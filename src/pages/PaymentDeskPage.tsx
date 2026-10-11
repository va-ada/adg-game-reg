/**
 * @file PaymentDeskPage.tsx
 * @description Focused payment-approval desk. One job: go through the teams that
 * say they have paid, check the money actually arrived, and tick them off.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X, Search, RefreshCw, Lock, LogOut, IndianRupee,
  Clock, CheckCircle2, XCircle, Copy, Image as ImageIcon, AlertTriangle,
  ChevronDown, ChevronUp, Users, Phone, Mail, Ticket,
  Eye, ExternalLink, ShieldCheck, ShieldX, ZoomIn
} from 'lucide-react';
import {
  adminLogin, fetchAdminPayments, verifyAdminPayment, rejectAdminPayment
} from '../services/api.ts';

type Filter = 'AWAITING' | 'CONFIRMED' | 'REJECTED' | 'ALL';

const AWAITING_STATES = ['PENDING_VERIFICATION', 'PENDING', 'PROCESSING', 'NOT_STARTED'];

/* ────────────── helpers ────────────── */

function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string, string]> = {
    PAID:                 ['CONFIRMED',     '#16a34a', '#dcfce7'],
    REJECTED:             ['REJECTED',      '#dc2626', '#fee2e2'],
    PENDING_VERIFICATION: ['AWAITING CHECK','#d97706', '#fef3c7'],
    PENDING:              ['PENDING',       '#6b7280', '#f3f4f6'],
    PROCESSING:           ['PROCESSING',    '#6b7280', '#f3f4f6'],
    NOT_STARTED:          ['NOT STARTED',   '#6b7280', '#f3f4f6'],
  };
  const [label, color, bg] = map[status] || [status, '#6b7280', '#f3f4f6'];
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm border shrink-0"
      style={{ color, borderColor: color, backgroundColor: bg }}>
      {label}
    </span>
  );
}

function Stat({ icon: Icon, label, value, tone }: any) {
  return (
    <div className="border-2 border-[#111827] bg-white p-3 sm:p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ background: tone }}
      />
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 relative">
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-sm flex items-center justify-center shrink-0" style={{ background: tone + '22' }}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: tone }} />
        </div>
        <span className="text-[9px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest font-bold text-[#111827]/50 truncate">{label}</span>
      </div>
      <p className="font-pixel text-xs sm:text-base relative truncate" style={{ color: tone }}>{value}</p>
    </div>
  );
}

/* ────────────── screenshot modal ────────────── */
function ScreenshotModal({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-xl w-full bg-white border-2 border-[#111827] shadow-[4px_4px_0_0_#111827] sm:shadow-[8px_8px_0_0_#111827]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b-2 border-[#111827] bg-[#111827] text-white gap-2">
          <span className="font-pixel text-[10px] sm:text-xs truncate">UPI SCREENSHOT</span>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <a href={url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-[11px] sm:text-xs bg-white/10 hover:bg-white/20 px-2 py-1 transition-colors">
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">Open original</span>
              <span className="inline sm:hidden">Original</span>
            </a>
            <button onClick={onClose}
              className="w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-[#E5005A] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-2 max-h-[80vh] overflow-auto flex items-center justify-center bg-[#f3f4f6]">
          <img
            src={url}
            alt="UPI payment screenshot"
            className="max-w-full h-auto object-contain"
            style={{ maxHeight: '72vh' }}
          />
        </div>
      </div>
    </div>
  );
}

/* ────────────── team roster panel ────────────── */
function RosterPanel({ payment }: { payment: any }) {
  const roster: any[] = payment.roster || [];

  if (roster.length === 0) {
    return (
      <p className="text-sm text-[#111827]/40 italic py-2">No roster data available.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {roster.map((m: any, i: number) => (
        <div key={i}
          className={`flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 border rounded-sm ${
            m.participantType === 'LEADER'
              ? 'border-[#E5005A]/40 bg-[#E5005A]/5'
              : 'border-[#111827]/15 bg-[#111827]/3'
          }`}
        >
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 text-xs sm:text-sm font-bold ${
            m.participantType === 'LEADER' ? 'bg-[#E5005A] text-white' : 'bg-[#111827]/10 text-[#111827]'
          }`}>
            {m.fullName?.charAt(0) || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs sm:text-sm truncate">{m.fullName}</span>
              {m.participantType === 'LEADER' && (
                <span className="text-[9px] font-bold bg-[#E5005A] text-white px-1.5 py-0.5 rounded-sm shrink-0">LEADER</span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-[#111827]/50 mt-0.5 truncate">
              {m.studentId} · {m.branch} · {m.year}
            </p>
            <p className="text-[11px] sm:text-xs text-[#111827]/40 truncate">{m.college}</p>
            <p className="text-[11px] sm:text-xs text-[#111827]/50 truncate">{m.email}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ────────────── payment evidence section ────────────── */
function PaymentEvidencePanel({ payment, onViewScreenshot }: { payment: any; onViewScreenshot: (url: string) => void }) {
  const entries: any[] = payment.entries || [];
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1800);
  };

  // Top-level evidence (non-entries based payment)
  const topEvidence = payment.evidence?.url;
  const topUTR = payment.transactionReference;

  return (
    <div className="space-y-3">
      {/* Entries-based submissions */}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((e: any, i: number) => (
            <div key={i} className="border-2 border-[#111827]/20 bg-white p-2.5 sm:p-3 rounded-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wide font-bold text-[#111827]/40 mb-1">UTR / Transaction Reference</p>
                  <button
                    onClick={() => copy(e.transactionReference)}
                    className="font-mono text-xs sm:text-sm bg-[#111827]/5 border border-[#111827]/20 px-3 py-1.5 hover:bg-[#111827]/10 flex items-center gap-2 transition-colors w-full text-left"
                  >
                    <span className="flex-1 truncate">{e.transactionReference || '—'}</span>
                    <Copy className="w-3.5 h-3.5 opacity-40 shrink-0" />
                  </button>
                  {copied === e.transactionReference && (
                    <p className="text-[11px] text-[#16a34a] mt-0.5">✓ Copied to clipboard</p>
                  )}
                </div>
                <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[#111827]/10">
                  <p className="text-[10px] uppercase tracking-wide font-bold text-[#111827]/40 sm:mb-1">Amount</p>
                  <div className="text-right">
                    <p className="font-bold text-sm tabular-nums">₹{Number(e.amount).toLocaleString('en-IN')}</p>
                    {e.payerName && <p className="text-xs text-[#111827]/50 mt-0.5">{e.payerName}</p>}
                  </div>
                </div>
              </div>

              {/* Screenshot */}
              {e.evidence?.url && (
                <div className="mt-2.5 sm:mt-3 border border-[#111827]/15 bg-[#f9fafb] rounded-sm overflow-hidden">
                  <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 border-b border-[#111827]/10 bg-[#111827]/5">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#111827]/50 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 shrink-0" /> UPI Screenshot
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onViewScreenshot(e.evidence.url)}
                        className="text-[10px] flex items-center gap-1 text-[#E5005A] font-bold hover:underline">
                        <ZoomIn className="w-3 h-3" /> View full
                      </button>
                    </div>
                  </div>
                  <div className="p-2 cursor-pointer" onClick={() => onViewScreenshot(e.evidence.url)}>
                    <img
                      src={e.evidence.url}
                      alt="UPI screenshot"
                      className="w-full max-h-48 object-contain object-center hover:opacity-90 transition-opacity"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Fallback: top-level UTR/evidence (no entries array) */}
      {entries.length === 0 && (topUTR || topEvidence) && (
        <div className="border-2 border-[#111827]/20 bg-white p-2.5 sm:p-3 rounded-sm">
          {topUTR && (
            <div className="mb-3">
              <p className="text-[10px] uppercase tracking-wide font-bold text-[#111827]/40 mb-1">UTR / Transaction Reference</p>
              <button
                onClick={() => copy(topUTR)}
                className="font-mono text-xs sm:text-sm bg-[#111827]/5 border border-[#111827]/20 px-3 py-1.5 hover:bg-[#111827]/10 flex items-center gap-2 transition-colors w-full text-left"
              >
                <span className="flex-1 truncate">{topUTR}</span>
                <Copy className="w-3.5 h-3.5 opacity-40 shrink-0" />
              </button>
              {copied === topUTR && (
                <p className="text-[11px] text-[#16a34a] mt-0.5">✓ Copied to clipboard</p>
              )}
            </div>
          )}
          {topEvidence && (
            <div className="border border-[#111827]/15 bg-[#f9fafb] rounded-sm overflow-hidden">
              <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 border-b border-[#111827]/10 bg-[#111827]/5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#111827]/50 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 shrink-0" /> UPI Screenshot
                </span>
                <button onClick={() => onViewScreenshot(topEvidence)}
                  className="text-[10px] flex items-center gap-1 text-[#E5005A] font-bold hover:underline">
                  <ZoomIn className="w-3 h-3" /> View full
                </button>
              </div>
              <div className="p-2 cursor-pointer" onClick={() => onViewScreenshot(topEvidence)}>
                <img
                  src={topEvidence}
                  alt="UPI screenshot"
                  className="w-full max-h-48 object-contain object-center hover:opacity-90 transition-opacity"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {entries.length === 0 && !topUTR && !topEvidence && (
        <p className="text-sm text-[#111827]/40 italic">No payment submission yet.</p>
      )}

      {/* Amount summary */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap py-2 border-t-2 border-[#111827]/10 text-xs sm:text-sm">
        <span className="font-bold tabular-nums">
          ₹{Number(payment.amountPaid || 0).toLocaleString('en-IN')} paid
        </span>
        <span className="text-[#111827]/50">
          of ₹{Number(payment.amountExpected || 0).toLocaleString('en-IN')} expected
          {payment.teamSize ? ` (${payment.teamSize} players)` : ''}
        </span>
        {!payment.fullyPaid && payment.status !== 'REJECTED' && (
          <span className="text-[#dc2626] font-bold text-[10px] sm:text-xs bg-[#fee2e2] px-2 py-0.5 rounded-sm">
            SHORT ₹{Number(payment.amountRemaining || 0).toLocaleString('en-IN')}
          </span>
        )}
        {payment.fullyPaid && payment.status !== 'PAID' && payment.status !== 'REJECTED' && (
          <span className="text-[#16a34a] font-bold text-[10px] sm:text-xs bg-[#dcfce7] px-2 py-0.5 rounded-sm">
            FULLY COVERED ✓
          </span>
        )}
      </div>
    </div>
  );
}

/* ────────────── payment card (AWAITING view) ────────────── */
function AwaitingCard({
  p,
  busyId,
  onConfirm,
  onReject
}: {
  p: any;
  busyId: string | null;
  onConfirm: (p: any) => void;
  onReject: (p: any) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'payment' | 'roster'>('payment');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  const busy = busyId === p.paymentId;

  return (
    <>
      {screenshotUrl && (
        <ScreenshotModal url={screenshotUrl} onClose={() => setScreenshotUrl(null)} />
      )}
      <div className="border-2 border-[#111827] bg-white border-l-4 sm:border-l-8 border-l-[#d97706] overflow-hidden">
        {/* Header */}
        <div className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-pixel text-xs break-words">{p.teamName || '(no team name)'}</span>
                <StatusPill status={p.status} />
              </div>
              <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm text-[#111827]/70 mt-1">
                <span className="flex items-center gap-1 min-w-0">
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{p.leaderName}</span>
                </span>
                <span className="flex items-center gap-1 min-w-0">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate max-w-[180px] sm:max-w-none">{p.contactEmail}</span>
                </span>
                {p.contactMobile && (
                  <span className="flex items-center gap-1 shrink-0">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{p.contactMobile}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#111827]/40 mt-1 break-words">
                {p.registrationId} · {p.method || 'UPI'} · ₹{Number(p.amount).toLocaleString('en-IN')}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-[#111827]/10">
              <button
                onClick={() => onConfirm(p)}
                disabled={busy}
                title="Approve payment – mark as PAID and send ticket email"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 font-bold text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{busy ? 'Saving…' : 'Approve'}</span>
              </button>
              <button
                onClick={() => onReject(p)}
                disabled={busy}
                title="Reject payment – notify team leader by email"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 border-2 border-[#dc2626] text-[#dc2626] font-bold text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-[#dc2626] hover:text-white disabled:opacity-50 transition-colors"
              >
                <ShieldX className="w-4 h-4 shrink-0" />
                <span>Reject</span>
              </button>
              <button
                onClick={() => setExpanded(v => !v)}
                className="flex items-center justify-center gap-1 border-2 border-[#111827]/20 text-[#111827]/50 px-2 sm:px-2.5 py-2 sm:py-2.5 hover:bg-[#111827]/5 transition-colors shrink-0"
                title={expanded ? 'Collapse' : 'Expand details'}
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Expandable detail area */}
        {expanded && (
          <div className="border-t-2 border-[#111827]/10">
            {/* Tab bar */}
            <div className="flex border-b-2 border-[#111827]/10 bg-[#f9fafb]">
              <button
                onClick={() => setActiveTab('payment')}
                className={`flex-1 sm:flex-none justify-center flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs font-bold transition-colors border-b-2 -mb-[2px] ${
                  activeTab === 'payment'
                    ? 'border-[#E5005A] text-[#E5005A] bg-white'
                    : 'border-transparent text-[#111827]/50 hover:text-[#111827]'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">UPI Evidence &amp; UTR</span>
              </button>
              <button
                onClick={() => setActiveTab('roster')}
                className={`flex-1 sm:flex-none justify-center flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs font-bold transition-colors border-b-2 -mb-[2px] ${
                  activeTab === 'roster'
                    ? 'border-[#E5005A] text-[#E5005A] bg-white'
                    : 'border-transparent text-[#111827]/50 hover:text-[#111827]'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Team Roster</span>
                {p.roster?.length > 0 && (
                  <span className="ml-1 bg-[#111827]/10 text-[#111827] text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    {p.roster.length}
                  </span>
                )}
              </button>
            </div>

            <div className="p-3 sm:p-4">
              {activeTab === 'payment' && (
                <PaymentEvidencePanel payment={p} onViewScreenshot={setScreenshotUrl} />
              )}
              {activeTab === 'roster' && (
                <RosterPanel payment={p} />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ────────────── compact card (CONFIRMED / REJECTED / ALL views) ────────────── */
function CompactCard({ p, onViewScreenshot }: { p: any; onViewScreenshot: (url: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'payment' | 'roster'>('payment');

  const borderColor = p.status === 'PAID' ? '#16a34a' : p.status === 'REJECTED' ? '#dc2626' : '#d97706';
  const statusBg   = p.status === 'PAID' ? 'bg-[#f0fdf4]' : p.status === 'REJECTED' ? 'bg-[#fff5f5] opacity-80' : 'bg-white';

  return (
    <div className={`border-2 border-[#111827] ${statusBg} overflow-hidden`}
      style={{ borderLeftWidth: 6, borderLeftColor: borderColor }}>
      <div className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-pixel text-xs break-words">{p.teamName || '(no team name)'}</span>
              <StatusPill status={p.status} />
              {p.status === 'PAID' && p.ticketNumber && (
                <span className="text-[10px] flex items-center gap-1 bg-[#16a34a]/10 text-[#16a34a] font-bold px-2 py-0.5 rounded-sm">
                  <Ticket className="w-3 h-3" /> {p.ticketNumber}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-0.5 text-xs text-[#111827]/60">
              <span className="truncate max-w-[150px] sm:max-w-none">{p.leaderName}</span>
              <span className="truncate max-w-[180px] sm:max-w-none">{p.contactEmail}</span>
              <span>{p.registrationId}</span>
              <span className="font-bold">₹{Number(p.amountPaid || 0).toLocaleString('en-IN')}</span>
            </div>
            {p.status === 'PAID' && p.verifiedAt && (
              <p className="text-[10px] text-[#16a34a] mt-0.5">
                Approved {new Date(p.verifiedAt).toLocaleString('en-IN')}
                {p.verifiedBy ? ` by ${p.verifiedBy}` : ''}
              </p>
            )}
          </div>
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full sm:w-auto justify-center flex items-center gap-1 border-2 border-[#111827]/20 text-[#111827]/50 px-3 py-1.5 sm:py-2 hover:bg-[#111827]/5 transition-colors text-xs font-bold shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            {expanded ? 'Hide' : 'View'} Details
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t-2 border-[#111827]/10">
          <div className="flex border-b-2 border-[#111827]/10 bg-[#f9fafb]">
            <button
              onClick={() => setActiveTab('payment')}
              className={`flex-1 sm:flex-none justify-center flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-bold transition-colors border-b-2 -mb-[2px] ${
                activeTab === 'payment'
                  ? 'border-[#E5005A] text-[#E5005A] bg-white'
                  : 'border-transparent text-[#111827]/50 hover:text-[#111827]'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">UPI Evidence &amp; UTR</span>
            </button>
            <button
              onClick={() => setActiveTab('roster')}
              className={`flex-1 sm:flex-none justify-center flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-bold transition-colors border-b-2 -mb-[2px] ${
                activeTab === 'roster'
                  ? 'border-[#E5005A] text-[#E5005A] bg-white'
                  : 'border-transparent text-[#111827]/50 hover:text-[#111827]'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Team Roster</span>
            </button>
          </div>
          <div className="p-3 sm:p-4">
            {activeTab === 'payment' && (
              <PaymentEvidencePanel payment={p} onViewScreenshot={onViewScreenshot} />
            )}
            {activeTab === 'roster' && (
              <RosterPanel payment={p} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────── main page ────────────── */
export function PaymentDeskPage() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('deception_admin_token')
  );
  const [email, setEmail]       = useState('admin@adg.org');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError]   = useState<string | null>(null);
  const [loggingIn, setLoggingIn]     = useState(false);

  const [payments, setPayments]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter]       = useState<Filter>('AWAITING');
  const [search, setSearch]       = useState('');
  const [busyId, setBusyId]       = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [lastSynced, setLastSynced]     = useState<Date | null>(null);

  // Global screenshot modal (for compact cards)
  const [globalScreenshot, setGlobalScreenshot] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchAdminPayments();
      setPayments(Array.isArray(data) ? data : []);
      setLastSynced(new Date());
    } catch (err: any) {
      if (String(err.message).toLowerCase().includes('unauthor')) {
        localStorage.removeItem('deception_admin_token');
        setToken(null);
      }
      setLoadError(err.message || 'Could not load payments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (token) load(); }, [token, load]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      const res = await adminLogin({ email: email.trim(), password });
      localStorage.setItem('deception_admin_token', res.token);
      setToken(res.token);
      setPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed.');
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('deception_admin_token');
    setToken(null);
    setPayments([]);
  };

  const counts = useMemo(() => {
    const c = { awaiting: 0, confirmed: 0, rejected: 0, collected: 0 };
    for (const p of payments) {
      if (p.status === 'PAID')       { c.confirmed++; c.collected += Number(p.amountPaid ?? p.amount) || 0; }
      else if (p.status === 'REJECTED') c.rejected++;
      else if (AWAITING_STATES.includes(p.status)) c.awaiting++;
    }
    return c;
  }, [payments]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments
      .filter(p => {
        if (filter === 'CONFIRMED') return p.status === 'PAID';
        if (filter === 'REJECTED')  return p.status === 'REJECTED';
        if (filter === 'AWAITING')  return AWAITING_STATES.includes(p.status);
        return true;
      })
      .filter(p => !q || [p.teamName, p.leaderName, p.registrationId, p.transactionReference, p.contactEmail]
        .some(v => String(v || '').toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [payments, filter, search]);

  const confirm = async (p: any) => {
    setBusyId(p.paymentId);
    const before = payments;
    setPayments(cur => cur.map(x => x.paymentId === p.paymentId ? { ...x, status: 'PAID' } : x));
    try {
      await verifyAdminPayment(p.paymentId);
      await load();
    } catch (err: any) {
      setPayments(before);
      setLoadError(`Could not approve ${p.teamName}: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const doReject = async () => {
    if (!rejecting) return;
    setBusyId(rejecting.paymentId);
    try {
      await rejectAdminPayment(
        rejecting.paymentId,
        rejectReason.trim() || 'Payment could not be verified. Please contact the organizer.'
      );
      setRejecting(null);
      setRejectReason('');
      await load();
    } catch (err: any) {
      setLoadError(`Could not reject: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  /* ── login screen ── */
  if (!token) {
    return (
      <div className="max-w-md mx-auto mt-6 sm:mt-12 mb-24 px-2 sm:px-0">
        <div className="bg-white border-2 border-[#111827] shadow-[4px_4px_0_0_#111827] sm:shadow-[6px_6px_0_0_#111827] p-5 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#111827] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-pixel text-sm">PAYMENT DESK</h1>
              <p className="text-xs text-[#111827]/60">ADG x Mosaic · Organiser access</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1 uppercase tracking-wide">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full border-2 border-[#111827] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E5005A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 uppercase tracking-wide">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus
                className="w-full border-2 border-[#111827] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E5005A]"
              />
            </div>
            {loginError && (
              <p className="text-sm text-[#dc2626] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {loginError}
              </p>
            )}
            <button
              type="submit" disabled={loggingIn}
              className="w-full bg-[#111827] text-white font-pixel text-xs py-3 hover:bg-[#E5005A] transition-colors disabled:opacity-50"
            >
              {loggingIn ? 'CHECKING…' : 'SIGN IN'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ── main desk ── */
  return (
    <div className="mb-24">
      {/* Global screenshot modal */}
      {globalScreenshot && (
        <ScreenshotModal url={globalScreenshot} onClose={() => setGlobalScreenshot(null)} />
      )}

      {/* Reject dialog */}
      {rejecting && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-3 sm:p-4 z-50"
          onClick={() => setRejecting(null)}>
          <div className="bg-white border-2 border-[#111827] shadow-[4px_4px_0_0_#111827] sm:shadow-[8px_8px_0_0_#111827] p-4 sm:p-6 max-w-md w-full"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-[#dc2626] flex items-center justify-center shrink-0">
                <ShieldX className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="font-pixel text-xs">REJECT PAYMENT</h2>
                <p className="text-xs text-[#111827]/60 mt-0.5 truncate">Team: <strong>{rejecting.teamName}</strong></p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[#111827]/70 mb-1 break-words">
              An email will be sent to <strong>{rejecting.contactEmail}</strong> with the rejection reason and your contact info.
            </p>
            <p className="text-xs text-[#111827]/40 mb-3">Leave blank to use the default message.</p>
            <textarea
              value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} autoFocus
              placeholder={`e.g. No credit of ₹${Number(rejecting.amountExpected || 500).toLocaleString('en-IN')} found against this UTR. Please contact us at adg@sfit.ac.in`}
              className="w-full border-2 border-[#111827] px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#E5005A] resize-none"
            />
            <div className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
              <button onClick={() => setRejecting(null)}
                className="w-full sm:w-auto px-5 py-2.5 sm:py-3 border-2 border-[#111827] font-bold text-xs sm:text-sm hover:bg-[#111827] hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={doReject} disabled={busyId === rejecting.paymentId}
                className="flex-1 flex items-center justify-center gap-2 bg-[#dc2626] text-white font-bold text-xs sm:text-sm py-2.5 sm:py-3 hover:bg-[#b91c1c] disabled:opacity-50 transition-colors">
                <ShieldX className="w-4 h-4 shrink-0" />
                <span>{busyId === rejecting.paymentId ? 'Sending…' : 'Reject & Notify Team'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-pixel text-base sm:text-lg">PAYMENT DESK</h1>
          <p className="text-xs text-[#111827]/60 mt-1">
            Verify UPI screenshots &amp; UTRs, then approve or reject each team.
            {lastSynced && <> · Synced at {lastSynced.toLocaleTimeString()}</>}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={load} disabled={loading}
            className="flex-1 sm:flex-initial justify-center flex items-center gap-2 border-2 border-[#111827] px-3 py-2 text-xs font-bold hover:bg-[#111827] hover:text-white transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={logout}
            className="flex-1 sm:flex-initial justify-center flex items-center gap-2 border-2 border-[#111827] px-3 py-2 text-xs font-bold hover:bg-[#dc2626] hover:text-white hover:border-[#dc2626] transition-colors">
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Sign out
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-6">
        <Stat icon={Clock}        label="Awaiting check" value={counts.awaiting}  tone="#d97706" />
        <Stat icon={CheckCircle2} label="Confirmed"       value={counts.confirmed} tone="#16a34a" />
        <Stat icon={XCircle}      label="Rejected"        value={counts.rejected}  tone="#dc2626" />
        <Stat icon={IndianRupee}  label="Collected"       value={`₹${counts.collected.toLocaleString('en-IN')}`} tone="#111827" />
      </div>

      {/* Filter + search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="w-full sm:w-auto overflow-x-auto flex border-2 border-[#111827] divide-x-2 divide-[#111827]">
          {(['AWAITING', 'CONFIRMED', 'REJECTED', 'ALL'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-1 sm:flex-initial whitespace-nowrap px-2.5 sm:px-4 py-2 text-[11px] sm:text-xs font-bold transition-colors text-center ${
                filter === f ? 'bg-[#111827] text-white' : 'hover:bg-[#111827]/10'
              }`}>
              {f === 'AWAITING' ? `Awaiting (${counts.awaiting})`
                : f === 'CONFIRMED' ? `Confirmed (${counts.confirmed})`
                : f === 'REJECTED'  ? `Rejected (${counts.rejected})`
                : 'All'}
            </button>
          ))}
        </div>
        <div className="w-full sm:flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#111827]/40" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search team, leader, email or UTR…"
            className="w-full border-2 border-[#111827] pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E5005A]"
          />
        </div>
      </div>

      {loadError && (
        <div className="border-2 border-[#dc2626] bg-[#dc2626]/5 text-[#dc2626] px-4 py-3 mb-4 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{loadError}</span>
          <button onClick={() => setLoadError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* AWAITING hint */}
      {filter === 'AWAITING' && visible.length > 0 && (
        <div className="border-2 border-[#d97706]/40 bg-[#fef3c7] px-3 sm:px-4 py-3 mb-4 text-xs sm:text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[#d97706]" />
          <span className="text-[#92400e]">
            Review the UPI screenshot and UTR for each team before approving.
            Clicking <strong>Approve</strong> marks payment as received and sends the team leader their entry ticket by email.
            Clicking <strong>Reject</strong> notifies the leader to contact the organizer.
          </span>
        </div>
      )}

      {/* List */}
      {visible.length === 0 ? (
        <div className="border-2 border-dashed border-[#111827]/30 p-8 sm:p-16 text-center">
          <p className="font-pixel text-xs text-[#111827]/40">
            {loading ? 'LOADING…'
              : filter === 'AWAITING'   ? 'NOTHING WAITING — ALL CLEAR ✓'
              : filter === 'CONFIRMED'  ? 'NO CONFIRMED PAYMENTS YET'
              : filter === 'REJECTED'   ? 'NO REJECTED PAYMENTS'
              : 'NO PAYMENTS FOUND'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filter === 'AWAITING'
            ? visible.map(p => (
                <AwaitingCard
                  key={p.paymentId}
                  p={p}
                  busyId={busyId}
                  onConfirm={confirm}
                  onReject={r => { setRejecting(r); setRejectReason(''); }}
                />
              ))
            : visible.map(p => (
                <CompactCard
                  key={p.paymentId}
                  p={p}
                  onViewScreenshot={setGlobalScreenshot}
                />
              ))
          }
        </div>
      )}
    </div>
  );
}

export default PaymentDeskPage;
