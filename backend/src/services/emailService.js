/**
 * @file emailService.js
 * @description Email notification service with an in-memory audit log.
 *
 * Delivery, in order of preference:
 *  1. EMAIL_RELAY_URL + EMAIL_RELAY_TOKEN - the Apps Script relay (scripts/email-sender.gs)
 *     running as the ADG Gmail account. Plain HTTPS, so it works on Render's free tier,
 *     which blocks outbound SMTP ports.
 *  2. EMAIL_HOST / EMAIL_USER / EMAIL_PASSWORD - ordinary SMTP, for hosts that allow it.
 *  3. Neither - every message is recorded in the log but not sent.
 */

import nodemailer from 'nodemailer';
import { EVENT_CONFIG } from '../../../shared/eventConfig.js';
import { perHeadAmount, currency, expectedAmountForTeamSize } from '../utils/fees.js';

const RELAY_TIMEOUT_MS = 20000;

/** Everything a participant typed goes into HTML through this. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Public site address, or '' when unknown (local runs without APP_URL). */
function siteUrl() {
  const raw = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || '';
  if (!/^https?:\/\//i.test(raw)) return '';
  return raw.replace(/\/+$/, '');
}

/** Deep link that opens the Check Status page with the ID filled in. */
export function statusLink(registrationId) {
  const base = siteUrl();
  return base ? `${base}/?status=${encodeURIComponent(registrationId)}` : '';
}

function venueLine() {
  return `${EVENT_CONFIG.venue}, ${EVENT_CONFIG.college}`;
}

function money(amount) {
  return `${currency()} ${amount}`;
}

/**
 * Wraps a message body in the shared layout. `rows` become a details table,
 * `cta` a button, `paragraphs` are HTML that the caller has already escaped.
 */
function renderHtml({ heading, accent, paragraphs, rows = [], cta }) {
  const table = rows.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:16px 0">${rows
        .map(([k, v]) => `<tr><td style="padding:6px 0;color:#94a3b8;font-size:13px;width:40%">${escapeHtml(k)}</td><td style="padding:6px 0;color:#f1f5f9;font-size:14px;font-weight:600">${escapeHtml(v)}</td></tr>`)
        .join('')}</table>`
    : '';
  const button = cta && cta.url
    ? `<p style="margin:24px 0"><a href="${escapeHtml(cta.url)}" style="background:${accent};color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:700;display:inline-block">${escapeHtml(cta.label)}</a></p>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#0b0f19;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:24px">
  <div style="background:#111827;border-top:4px solid ${accent};border-radius:8px;padding:24px">
    <p style="margin:0 0 4px;color:${accent};font-size:12px;letter-spacing:2px;font-weight:700">${escapeHtml(EVENT_CONFIG.name)} &middot; ${escapeHtml(EVENT_CONFIG.collaboration)}</p>
    <h1 style="margin:0 0 16px;color:#f1f5f9;font-size:22px">${heading}</h1>
    ${paragraphs.map(p => `<p style="margin:0 0 12px;color:#cbd5e1;font-size:14px;line-height:1.6">${p}</p>`).join('')}
    ${table}${button}
  </div>
  <p style="color:#64748b;font-size:12px;text-align:center;margin-top:16px">${escapeHtml(EVENT_CONFIG.organizer)} &middot; &ldquo;${escapeHtml(EVENT_CONFIG.warningQuote)}&rdquo;</p>
</div></body></html>`;
}

function renderText(lines) {
  return lines.filter(l => l !== null && l !== undefined).join('\n');
}

export class EmailService {
  constructor() {
    this.emailLogs = [];
    this.transporter = null;
    this.mode = 'LOG_ONLY';
    this.initTransport();
  }

  /**
   * Pick a delivery route. Without one the service still records every message in
   * the log, so the app works end to end with mail simply disabled rather than throwing.
   */
  initTransport() {
    if (process.env.EMAIL_RELAY_URL && process.env.EMAIL_RELAY_TOKEN) {
      this.mode = 'RELAY';
      console.log('[EmailService] Sending through the Apps Script relay.');
      return;
    }
    const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD } = process.env;
    if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASSWORD) {
      console.log('[EmailService] Email not configured - messages will be logged only, not sent.');
      return;
    }
    const port = Number(EMAIL_PORT) || 587;
    this.transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port,
      secure: port === 465,
      auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD }
    });
    this.mode = 'SMTP';
    console.log(`[EmailService] SMTP transport ready via ${EMAIL_HOST}:${port}`);
  }

  async sendViaRelay(record) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), RELAY_TIMEOUT_MS);
    try {
      const res = await fetch(process.env.EMAIL_RELAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: process.env.EMAIL_RELAY_TOKEN,
          to: record.to,
          subject: record.subject,
          text: record.body,
          html: record.html
        }),
        signal: controller.signal,
        // Apps Script answers /exec with a redirect to googleusercontent.com.
        redirect: 'follow'
      });
      const raw = await res.text();
      let reply;
      try {
        reply = JSON.parse(raw);
      } catch {
        throw new Error(`Relay returned a non-JSON response (${res.status}). Check the deployment is set to "Anyone" access.`);
      }
      if (!reply.success) throw new Error(reply.message || 'Relay rejected the message');
      if (Number.isFinite(reply.remaining) && reply.remaining < 20) {
        console.warn(`[EmailService] Only ${reply.remaining} emails left in today's Gmail quota.`);
      }
    } catch (err) {
      if (err.name === 'AbortError') throw new Error(`Relay timed out after ${RELAY_TIMEOUT_MS}ms`);
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async deliver(record) {
    if (this.mode === 'LOG_ONLY') {
      record.status = 'LOGGED_NOT_SENT';
      return record;
    }
    try {
      if (this.mode === 'RELAY') {
        await this.sendViaRelay(record);
      } else {
        await this.transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: record.to,
          subject: record.subject,
          text: record.body,
          html: record.html
        });
      }
      record.status = 'SENT';
      console.log(`[EmailService] Sent ${record.type} to ${record.to}`);
    } catch (err) {
      // A mail failure must never roll back a confirmed registration.
      record.status = 'FAILED';
      record.error = err.message;
      console.error(`[EmailService] Delivery failed for ${record.to}:`, err.message);
    }
    return record;
  }

  logEmail(email) {
    const record = {
      _id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      to: email.to,
      subject: email.subject,
      type: email.type,
      registrationId: email.registrationId,
      body: email.body,
      html: email.html,
      sentAt: new Date(),
      status: 'QUEUED'
    };
    this.emailLogs.unshift(record);
    console.log(`[EmailService] Queued ${email.type} for ${email.to}`);
    // Fire and forget: delivery updates the record in place once it settles.
    record.delivery = this.deliver(record);
    return record;
  }

  async sendRegistrationReceivedEmail({ to, leaderName, teamName, registrationId, teamSize }) {
    const due = expectedAmountForTeamSize(teamSize);
    const link = statusLink(registrationId);
    const subject = `[${EVENT_CONFIG.name}] Registration Received - ${teamName} (${registrationId})`;
    const body = renderText([
      `Hello ${leaderName},`,
      '',
      `We have received your team registration for ${EVENT_CONFIG.name} (${EVENT_CONFIG.collaboration}).`,
      '',
      'Event Details:',
      `- Event: ${EVENT_CONFIG.name}`,
      `- Dates: ${EVENT_CONFIG.eventDateDisplay}`,
      `- Venue: ${venueLine()}`,
      `- Team Name: ${teamName}`,
      `- Registration ID: ${registrationId}`,
      '- Current Status: PAYMENT PENDING',
      '',
      `To confirm your spot, complete the payment of ${money(due)} (${money(perHeadAmount())} per participant) via the registration portal.`,
      'Entry QR passes will be unlocked once payment is verified.',
      link ? `\nCheck your status: ${link}` : null,
      '',
      'Stay sharp. One of you isn\'t who they seem...',
      '',
      'Regards,',
      `${EVENT_CONFIG.organizer} x MosaIC`
    ]);
    const html = renderHtml({
      heading: 'Registration received',
      accent: '#F4C430',
      paragraphs: [
        `Hello ${escapeHtml(leaderName)},`,
        `We have received your squad's registration. To confirm your spot, pay <strong>${escapeHtml(money(due))}</strong> (${escapeHtml(money(perHeadAmount()))} per participant) through the portal. Your entry QR pass unlocks once the payment is verified.`
      ],
      rows: [
        ['Team', teamName],
        ['Registration ID', registrationId],
        ['Status', 'Payment pending'],
        ['Dates', EVENT_CONFIG.eventDateDisplay],
        ['Venue', venueLine()]
      ],
      cta: { url: link, label: 'Complete payment' }
    });

    return this.logEmail({ to, subject, type: 'REGISTRATION_RECEIVED', registrationId, body, html });
  }

  async sendConfirmationEmail({ to, leaderName, teamName, registrationId, ticketNumber, amount, transactionReference }) {
    const link = statusLink(registrationId);
    const subject = `[CONFIRMED] Your Official Pass for ${EVENT_CONFIG.name} - ${teamName} (${registrationId})`;
    const body = renderText([
      `Congratulations ${leaderName}!`,
      '',
      `Your payment of ${money(amount)} (Ref: ${transactionReference || 'N/A'}) has been VERIFIED.`,
      `Your team "${teamName}" is officially CONFIRMED for ${EVENT_CONFIG.name}!`,
      '',
      'TICKET DETAILS:',
      `- Ticket Number: ${ticketNumber}`,
      `- Registration ID: ${registrationId}`,
      `- Venue: ${venueLine()}`,
      `- Dates: ${EVENT_CONFIG.eventDateDisplay}`,
      '- Mandatory: Carry your college ID cards and your digital/printed QR Pass.',
      '',
      link
        ? `Download your Combined Entry Pass & Payment Receipt at:\n${link}`
        : 'Download your Combined Entry Pass & Payment Receipt from the Check Status page using your Registration ID.',
      '',
      `"${EVENT_CONFIG.warningQuote}." See you in ${EVENT_CONFIG.venue}!`,
      '',
      EVENT_CONFIG.organizer
    ]);
    const html = renderHtml({
      heading: 'Your squad is confirmed',
      accent: '#22c55e',
      paragraphs: [
        `Congratulations ${escapeHtml(leaderName)}!`,
        `Your payment of <strong>${escapeHtml(money(amount))}</strong> has been verified. Team <strong>${escapeHtml(teamName)}</strong> is officially confirmed for ${escapeHtml(EVENT_CONFIG.name)}.`,
        'Every member must carry their <strong>college ID card</strong> and the <strong>QR entry pass</strong> (digital or printed).'
      ],
      rows: [
        ['Ticket Number', ticketNumber],
        ['Registration ID', registrationId],
        ['Payment Ref', transactionReference || 'N/A'],
        ['Dates', EVENT_CONFIG.eventDateDisplay],
        ['Venue', venueLine()]
      ],
      cta: { url: link, label: 'Download entry pass & receipt' }
    });

    return this.logEmail({ to, subject, type: 'REGISTRATION_CONFIRMED', registrationId, body, html });
  }

  async sendVerificationPendingEmail({ to, leaderName, teamName, registrationId, transactionReference }) {
    const link = statusLink(registrationId);
    const subject = `[PENDING VERIFICATION] Payment Evidence Received - ${registrationId}`;
    const body = renderText([
      `Hello ${leaderName},`,
      '',
      `We have received your payment reference: ${transactionReference} for team "${teamName}" (${registrationId}).`,
      '',
      'Our finance team is currently cross-verifying the UTR reference with our bank records.',
      'You will receive another email and your QR Pass once approved (typically within 2-6 hours).',
      link ? `\nCheck status anytime at:\n${link}` : null,
      '',
      'ADG Verification Desk'
    ]);
    const html = renderHtml({
      heading: 'Payment received - verifying',
      accent: '#3b82f6',
      paragraphs: [
        `Hello ${escapeHtml(leaderName)},`,
        `We have received your payment reference for team <strong>${escapeHtml(teamName)}</strong>. Our team is matching it against our bank records; you will get another email with your QR pass once it is approved (typically within 2&ndash;6 hours).`
      ],
      rows: [
        ['Registration ID', registrationId],
        ['Payment Ref', transactionReference]
      ],
      cta: { url: link, label: 'Check status' }
    });

    return this.logEmail({ to, subject, type: 'VERIFICATION_PENDING', registrationId, body, html });
  }

  async sendPaymentRejectedEmail({ to, leaderName, teamName, registrationId, reason }) {
    const link = statusLink(registrationId);
    const subject = `[ACTION REQUIRED] Payment Verification Issue - ${registrationId}`;
    const body = renderText([
      `Hello ${leaderName},`,
      '',
      `We could not verify your payment reference for team "${teamName}" (${registrationId}).`,
      '',
      'Reason provided by admin:',
      reason,
      '',
      'Please open the registration status page to re-upload your valid payment screenshot or submit the correct UTR transaction ID.',
      link ? `\nPortal: ${link}` : null,
      '',
      'ADG Organizing Team'
    ]);
    const html = renderHtml({
      heading: 'Action needed on your payment',
      accent: '#ff2a4b',
      paragraphs: [
        `Hello ${escapeHtml(leaderName)},`,
        `We could not verify the payment for team <strong>${escapeHtml(teamName)}</strong> (${escapeHtml(registrationId)}).`,
        `<strong>Reason:</strong> ${escapeHtml(reason)}`,
        'Please open your status page and submit the correct UTR reference or a valid payment screenshot.'
      ],
      cta: { url: link, label: 'Fix my payment' }
    });

    return this.logEmail({ to, subject, type: 'PAYMENT_REJECTED', registrationId, body, html });
  }

  getEmailLogs() {
    // The in-flight delivery promise is internal and does not serialise.
    return this.emailLogs.map(({ delivery, ...rest }) => rest);
  }
}

export const emailService = new EmailService();
export default emailService;
