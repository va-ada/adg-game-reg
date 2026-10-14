// Run: node scripts/email-service.test.mjs  (spins up a fake Apps Script relay; sends nothing real)
import http from 'http';
import assert from 'assert/strict';

let received = [];
let mode = 'ok';
const srv = http.createServer((req, res) => {
  if (req.url === '/exec') {           // Apps Script answers POST /exec with a 302
    let data = ''; req.on('data', c => data += c);
    req.on('end', () => { received.push(JSON.parse(data)); res.writeHead(302, { Location: '/echo' }); res.end(); });
    return;
  }
  res.setHeader('Content-Type', 'application/json');
  if (mode === 'ok') return res.end(JSON.stringify({ success: true, remaining: 5 }));
  if (mode === 'reject') return res.end(JSON.stringify({ success: false, message: 'Unauthorised' }));
  res.setHeader('Content-Type', 'text/html'); res.end('<html>Sign in</html>');
});
await new Promise(r => srv.listen(0, r));
const port = srv.address().port;

process.env.EMAIL_RELAY_URL = `http://127.0.0.1:${port}/exec`;
process.env.EMAIL_RELAY_TOKEN = 'tok123';
process.env.APP_URL = 'https://deception.example.com/';
process.env.PER_HEAD_AMOUNT = '50';
process.env.EMAIL_SEND_ALL = 'true'; // template checks below exercise every type
const { EmailService, statusLink, escapeHtml } = await import('../backend/src/services/emailService.js');
const svc = new EmailService();
let pass = 0; const ok = (c, m) => { assert.ok(c, m); pass++; console.log('  ✓', m); };

ok(svc.mode === 'RELAY', 'relay mode chosen when URL+token set');
ok(statusLink('DEC-1 2') === 'https://deception.example.com/?status=DEC-1%202', 'status link built + encoded, trailing slash trimmed');
ok(escapeHtml(`<b>"x"&'`) === '&lt;b&gt;&quot;x&quot;&amp;&#39;', 'escapeHtml covers all 5 chars');

// happy path: registration received
let r = await svc.sendRegistrationReceivedEmail({ to: 'a@student.sfit.ac.in', leaderName: 'Riya', teamName: '<script>alert(1)</script>', registrationId: 'DEC-101', teamSize: 5 });
await r.delivery;
ok(r.status === 'SENT', 'delivered via relay (followed 302) -> SENT');
const m = received.at(-1);
ok(m.token === 'tok123' && m.to === 'a@student.sfit.ac.in', 'token + single recipient sent');
ok(m.text.includes('INR 250') && m.text.includes('INR 50 per participant'), 'fee = 5 x 50 = INR 250');
ok(m.text.includes('Room 028') && !m.text.includes('Venue TBD') && !m.text.includes('500'), 'venue from config, no stale TBD/500');
ok(!m.html.includes('<script>') && m.html.includes('&lt;script&gt;'), 'team name HTML-escaped in html body');
ok(m.html.includes('href="https://deception.example.com/?status=DEC-101"'), 'CTA button links to status page');

// 6-player squad
r = await svc.sendRegistrationReceivedEmail({ to: 'b@x.in', leaderName: 'B', teamName: 'T', registrationId: 'DEC-102', teamSize: 6 });
await r.delivery; ok(received.at(-1).text.includes('INR 300'), '6 players -> INR 300');

// confirmation + pending + rejected
for (const [fn, args, needle] of [
  ['sendConfirmationEmail', { to: 'c@x.in', leaderName: 'C', teamName: 'T', registrationId: 'DEC-103', ticketNumber: 'TKT-9', amount: 250, transactionReference: 'UTR1' }, 'TKT-9'],
  ['sendVerificationPendingEmail', { to: 'd@x.in', leaderName: 'D', teamName: 'T', registrationId: 'DEC-104', transactionReference: 'UTR2' }, 'UTR2'],
  ['sendPaymentRejectedEmail', { to: 'e@x.in', leaderName: 'E', teamName: 'T', registrationId: 'DEC-105', reason: '<img src=x onerror=1>' }, 'Reason'],
]) {
  r = await svc[fn](args); await r.delivery;
  ok(r.status === 'SENT' && received.at(-1).text.includes(needle) && received.at(-1).html, `${fn} sent with text+html`);
}
ok(!received.at(-1).html.includes('<img'), 'rejection reason HTML-escaped');

// failure paths never throw
mode = 'reject';
r = await svc.sendConfirmationEmail({ to: 'f@x.in', leaderName: 'F', teamName: 'T', registrationId: 'DEC-106', ticketNumber: 'T', amount: 1 });
await r.delivery; ok(r.status === 'FAILED' && r.error === 'Unauthorised', 'relay rejection -> FAILED with reason, no throw');
mode = 'html';
r = await svc.sendConfirmationEmail({ to: 'g@x.in', leaderName: 'G', teamName: 'T', registrationId: 'DEC-107', ticketNumber: 'T', amount: 1 });
await r.delivery; ok(r.status === 'FAILED' && /non-JSON/.test(r.error), 'non-JSON (wrong access setting) -> FAILED with hint');
process.env.EMAIL_RELAY_URL = 'http://127.0.0.1:1/exec';
r = await svc.sendConfirmationEmail({ to: 'h@x.in', leaderName: 'H', teamName: 'T', registrationId: 'DEC-108', ticketNumber: 'T', amount: 1 });
await r.delivery; ok(r.status === 'FAILED', 'unreachable relay -> FAILED, no throw');

ok(svc.getEmailLogs().every(l => !('delivery' in l)) && JSON.stringify(svc.getEmailLogs()), 'logs serialise cleanly for admin page');

// log-only mode + no link when APP_URL unset
delete process.env.EMAIL_RELAY_URL; delete process.env.EMAIL_RELAY_TOKEN; delete process.env.APP_URL; delete process.env.RENDER_EXTERNAL_URL;
const quiet = new EmailService();
r = await quiet.sendConfirmationEmail({ to: 'i@x.in', leaderName: 'I', teamName: 'T', registrationId: 'DEC-109', ticketNumber: 'T', amount: 1 });
await r.delivery;
ok(quiet.mode === 'LOG_ONLY' && r.status === 'LOGGED_NOT_SENT', 'no config -> logged only');
ok(!r.body.includes('/registration/status') && r.body.includes('Check Status page') && !r.html.includes('href='), 'no broken relative link when site URL unknown');

// quota saver: by default only the confirmed pass and rejections go out
process.env.EMAIL_RELAY_URL = `http://127.0.0.1:${port}/exec`; process.env.EMAIL_RELAY_TOKEN = 'tok123'; mode = 'ok';
delete process.env.EMAIL_SEND_ALL;
const saver = new EmailService(); const before = received.length;
r = await saver.sendRegistrationReceivedEmail({ to: 'j@x.in', leaderName: 'J', teamName: 'T', registrationId: 'DEC-110', teamSize: 5 }); await r.delivery;
ok(r.status === 'SKIPPED_TO_SAVE_QUOTA', 'default: registration-received skipped');
r = await saver.sendVerificationPendingEmail({ to: 'j@x.in', leaderName: 'J', teamName: 'T', registrationId: 'DEC-110', transactionReference: 'U' }); await r.delivery;
ok(r.status === 'SKIPPED_TO_SAVE_QUOTA', 'default: verification-pending skipped');
r = await saver.sendConfirmationEmail({ to: 'j@x.in', leaderName: 'J', teamName: 'T', registrationId: 'DEC-110', ticketNumber: 'T', amount: 250 }); await r.delivery;
ok(r.status === 'SENT', 'default: confirmation still sent');
r = await saver.sendPaymentRejectedEmail({ to: 'j@x.in', leaderName: 'J', teamName: 'T', registrationId: 'DEC-110', reason: 'x' }); await r.delivery;
ok(r.status === 'SENT', 'default: rejection still sent');
ok(received.length - before === 2, 'exactly 2 of 4 reached the relay');

console.log(`\n${pass} checks passed`);
srv.close();
