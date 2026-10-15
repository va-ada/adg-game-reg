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
    PAID:                 ['CONFIRMED',     '#4ade80', 'rgba(74, 222, 128, 0.15)'],
    REJECTED:             ['REJECTED',      '#f87171', 'rgba(248, 113, 113, 0.15)'],
    PENDING_VERIFICATION: ['AWAITING CHECK','#fbbf24', 'rgba(251, 191, 36, 0.15)'],
    PENDING:              ['PENDING',       '#94a3b8', 'rgba(148, 163, 184, 0.15)'],
    PROCESSING:           ['PROCESSING',    '#38bdf8', 'rgba(56, 189, 248, 0.15)'],
    NOT_STARTED:          ['NOT STARTED',   '#94a3b8', 'rgba(148, 163, 184, 0.15)'],
  };
  const [label, color, bg] = map[status] || [status, '#94a3b8', 'rgba(148, 163, 184, 0.15)'];
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm border shrink-0"
      style={{ color, borderColor: color, backgroundColor: bg }}>
      {label}
    </span>
  );
}

function Stat({ icon: Icon, label, value, tone }: any) {
  return (
    <div className="border-2 border-[#22314d] bg-[#0d1322] p-3 sm:p-4 relative overflow-hidden shadow-[2px_2px_0_0_#04060a]">
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{ background: tone }}
      />
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 relative">
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-sm flex items-center justify-center shrink-0 border border-[#22314d]" style={{ background: tone + '22' }}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: tone }} />
        </div>
        <span className="text-[9px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest font-bold text-[#94a3b8] truncate">{label}</span>
      </div>
      <p className="font-pixel text-xs sm:text-base relative truncate" style={{ color: tone }}>{value}</p>
    </div>
  );
}

/* ────────────── Google Drive & Image Helper ────────────── */
function getDriveInfo(url: string | null | undefined): { isDrive: boolean; previewUrl: string; thumbUrl: string; openUrl: string } {
  if (!url || typeof url !== 'string') {
    return { isDrive: false, previewUrl: '', thumbUrl: '', openUrl: '' };
  }
  const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|lh3\.googleusercontent\.com\/d\/)([a-zA-Z0-9_-]+)/;
  const match = url.match(driveRegex);
  if (match && match[1]) {
    const fileId = match[1];
    return {
      isDrive: true,
      previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      thumbUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`,
      openUrl: `https://drive.google.com/file/d/${fileId}/view`
    };
  }
  return {
    isDrive: false,
    previewUrl: url,
    thumbUrl: url,
    openUrl: url
  };
}

/* ────────────── screenshot modal ────────────── */
function ScreenshotModal({
  url,
  title = 'UPI PAYMENT SCREENSHOT',
  subtitle,
  onClose
}: {
  url: string;
  title?: string;
  subtitle?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const drive = getDriveInfo(url);

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-[100] p-2 sm:p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-[#0d1322] border-2 border-[#22314d] shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b-2 border-[#22314d] bg-[#070a13] text-[#fdfbf7] gap-2">
          <div>
            <span className="font-pixel text-[10px] sm:text-xs truncate text-[#fdfbf7] block">{title}</span>
            {subtitle && <span className="text-[10px] text-[#94a3b8] font-mono">{subtitle}</span>}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <a href={drive.openUrl} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-[11px] sm:text-xs bg-white/10 hover:bg-white/20 text-[#f1f5f9] px-2 py-1 transition-colors border border-white/20">
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">Open original</span>
              <span className="inline sm:hidden">Original</span>
            </a>
            <button onClick={onClose}
              className="w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-[#ff2a4b] text-white transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-3 max-h-[80vh] overflow-auto flex items-center justify-center bg-[#070a13]">
          {drive.isDrive ? (
            <div className="w-full flex flex-col items-center gap-2">
              <iframe
                src={drive.previewUrl}
                className="w-full h-[65vh] border-0 rounded-xs bg-[#0d1322]"
                title={title}
                allow="autoplay"
              />
              <a
                href={drive.openUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-arcade text-[#38bdf8] hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" /> Can't see the preview? Open in Google Drive
              </a>
            </div>
          ) : (
            <img
              src={url}
              alt={title}
              className="max-w-full h-auto object-contain rounded-xs"
              style={{ maxHeight: '72vh' }}
              onError={(e) => {
                if (drive.isDrive && e.currentTarget.src !== drive.openUrl) {
                  e.currentTarget.style.display = 'none';
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────── team roster panel ────────────── */
function RosterPanel({
  payment,
  onViewScreenshot
}: {
  payment: any;
  onViewScreenshot?: (url: string, title?: string, subtitle?: string) => void;
}) {
  const roster: any[] = payment.roster || [];

  if (roster.length === 0) {
    return (
      <p className="text-sm text-[#94a3b8] italic py-2">No roster data available.</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-[#94a3b8] border-b border-[#22314d] pb-1.5">
        <span>SQUAD MEMBERS ({roster.length})</span>
        <span className="text-[10px] text-[#ff2a4b] font-bold">1st Member is Leader</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {roster.map((m: any, i: number) => {
          const isLeader = i === 0;
          const idDrive = getDriveInfo(m.idCardUrl);
          return (
            <div key={i}
              className={`flex flex-col justify-between p-2.5 sm:p-3 border rounded-sm ${
                isLeader
                  ? 'border-[#ff2a4b]/60 bg-[#ff2a4b]/10'
                  : 'border-[#22314d] bg-[#131b2e]'
              }`}
            >
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs sm:text-sm font-bold ${
                  isLeader ? 'bg-[#ff2a4b] text-white shadow-[0_0_8px_rgba(255,42,75,0.4)]' : 'bg-[#070a13] text-[#94a3b8] border border-[#22314d]'
                }`}>
                  {m.fullName?.charAt(0) || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm truncate text-[#f1f5f9]">{m.fullName}</span>
                    {isLeader && (
                      <span className="text-[9px] font-bold bg-[#ff2a4b] text-white px-1.5 py-0.5 rounded-sm shrink-0">LEADER</span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#94a3b8] mt-0.5 truncate">
                    {m.studentId} · {m.branch} · {m.year}
                  </p>
                  <p className="text-[11px] sm:text-xs text-[#94a3b8]/80 truncate">{m.college}</p>
                  <p className="text-[11px] sm:text-xs text-[#38bdf8] truncate">{m.email}</p>
                </div>
              </div>

              {/* College ID card preview */}
              <div className="mt-2 pt-2 border-t border-[#22314d]/60 flex items-center justify-between gap-2">
                {m.idCardUrl ? (
                  <>
                    <div
                      onClick={() => onViewScreenshot?.(m.idCardUrl, 'COLLEGE ID CARD', `${m.fullName} (${m.studentId})`)}
                      className="w-12 h-8 border border-[#22314d] bg-[#070a13] rounded-xs overflow-hidden cursor-pointer hover:border-[#38bdf8] shrink-0 flex items-center justify-center shadow-[1px_1px_0_0_#000]"
                      title="Click to preview College ID Card"
                    >
                      <img
                        src={idDrive.isDrive ? idDrive.thumbUrl : m.idCardUrl}
                        alt="ID Card"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onViewScreenshot?.(m.idCardUrl, 'COLLEGE ID CARD', `${m.fullName} (${m.studentId})`)}
                        className="text-[10px] font-bold text-[#38bdf8] hover:text-white bg-[#070a13] border border-[#22314d] px-2 py-0.5 rounded-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" /> Preview ID
                      </button>
                      <a
                        href={idDrive.openUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-[#94a3b8] hover:text-white"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </>
                ) : (
                  <span className="text-[10px] text-[#94a3b8]/60 italic">ID Card: Pending</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────── payment evidence section ────────────── */
function PaymentEvidencePanel({
  payment,
  onViewScreenshot
}: {
  payment: any;
  onViewScreenshot: (url: string, title?: string, subtitle?: string) => void;
}) {
  const entries: any[] = payment.entries || [];
  const [copied, setCopied] = useState<string | null>(null);

  const fallbackCopy = (text: string) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch {}
    document.body.removeChild(ta);
  };

  const copy = (text: string) => {
    if (!text) return;
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
      } else {
        fallbackCopy(text);
      }
    } catch {
      fallbackCopy(text);
    }
    setCopied(text);
    setTimeout(() => setCopied(null), 1800);
  };

  // Top-level evidence (or resolved evidence from entries / documents)
  const resolvedEvidence = payment.evidence?.url || payment.paymentEvidence || entries.find((e: any) => e.evidence?.url)?.evidence?.url;
  const topUTR = payment.transactionReference || entries[0]?.transactionReference;

  return (
    <div className="space-y-3">
      {/* Entries-based submissions */}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((e: any, i: number) => {
            const entryImg = e.evidence?.url || resolvedEvidence;
            const entryDrive = getDriveInfo(entryImg);
            return (
              <div key={i} className="border-2 border-[#22314d] bg-[#0d1322] p-2.5 sm:p-3 rounded-sm space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] uppercase tracking-wide font-bold text-[#94a3b8]">
                        UTR / Transaction Reference {entries.length > 1 ? `#${i + 1}` : ''}
                      </p>
                      {copied === e.transactionReference && (
                        <p className="text-[11px] text-[#4ade80] font-bold">✓ Copied to clipboard</p>
                      )}
                    </div>
                    <div className="bg-[#070a13] border border-[#22314d] p-1.5 sm:p-2 rounded-xs flex items-center justify-between gap-2">
                      <span className="font-mono text-xs sm:text-sm font-bold text-[#38bdf8] select-all break-all tracking-wider">
                        {e.transactionReference || '—'}
                      </span>
                      {e.transactionReference && (
                        <button
                          type="button"
                          onClick={() => copy(e.transactionReference)}
                          className="px-2.5 py-1 bg-[#131b2e] hover:bg-[#1a253c] text-[#38bdf8] border border-[#22314d] text-xs font-bold rounded-xs flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copied === e.transactionReference ? 'COPIED' : 'COPY'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[#22314d]">
                    <p className="text-[10px] uppercase tracking-wide font-bold text-[#94a3b8] sm:mb-1">Amount</p>
                    <div className="text-right">
                      <p className="font-bold text-sm tabular-nums text-[#f1f5f9]">₹{Number(e.amount).toLocaleString('en-IN')}</p>
                      {e.payerName && <p className="text-xs text-[#94a3b8] mt-0.5">{e.payerName}</p>}
                    </div>
                  </div>
                </div>

                {/* Screenshot (Guaranteed Visible) */}
                {entryImg && (
                  <div className="mt-2.5 sm:mt-3 border border-[#22314d] bg-[#070a13] rounded-sm overflow-hidden">
                    <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 border-b border-[#22314d] bg-[#131b2e]">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#94a3b8] flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 shrink-0 text-[#38bdf8]" /> UPI Screenshot
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onViewScreenshot(entryImg, 'UPI PAYMENT SCREENSHOT', `UTR: ${e.transactionReference || 'N/A'}`)}
                          className="text-[10px] flex items-center gap-1 text-[#ff2a4b] font-bold hover:underline cursor-pointer"
                        >
                          <ZoomIn className="w-3 h-3" /> View full
                        </button>
                        <a
                          href={entryDrive.openUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-[#94a3b8] hover:text-white flex items-center gap-0.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <div
                      className="p-2 cursor-pointer bg-[#070a13] flex items-center justify-center max-h-52 overflow-hidden"
                      onClick={() => onViewScreenshot(entryImg, 'UPI PAYMENT SCREENSHOT', `UTR: ${e.transactionReference || 'N/A'}`)}
                    >
                      <img
                        src={entryDrive.isDrive ? entryDrive.thumbUrl : entryImg}
                        alt="UPI screenshot"
                        className="max-h-48 w-auto object-contain hover:opacity-90 transition-opacity rounded-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Fallback: top-level UTR/evidence (when entries are empty) */}
      {entries.length === 0 && (topUTR || resolvedEvidence) && (
        <div className="border-2 border-[#22314d] bg-[#0d1322] p-2.5 sm:p-3 rounded-sm space-y-2">
          {topUTR && (
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase tracking-wide font-bold text-[#94a3b8]">UTR / Transaction Reference</p>
                {copied === topUTR && <p className="text-[11px] text-[#4ade80] font-bold">✓ Copied to clipboard</p>}
              </div>
              <div className="bg-[#070a13] border border-[#22314d] p-1.5 sm:p-2 rounded-xs flex items-center justify-between gap-2">
                <span className="font-mono text-xs sm:text-sm font-bold text-[#38bdf8] select-all break-all tracking-wider">
                  {topUTR}
                </span>
                <button
                  type="button"
                  onClick={() => copy(topUTR)}
                  className="px-2.5 py-1 bg-[#131b2e] hover:bg-[#1a253c] text-[#38bdf8] border border-[#22314d] text-xs font-bold rounded-xs flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied === topUTR ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
            </div>
          )}
          {resolvedEvidence && (
            <div className="border border-[#22314d] bg-[#070a13] rounded-sm overflow-hidden">
              <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 border-b border-[#22314d] bg-[#131b2e]">
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#94a3b8] flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 shrink-0 text-[#38bdf8]" /> UPI Screenshot
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onViewScreenshot(resolvedEvidence, 'UPI PAYMENT SCREENSHOT', `UTR: ${topUTR || 'N/A'}`)}
                    className="text-[10px] flex items-center gap-1 text-[#ff2a4b] font-bold hover:underline cursor-pointer"
                  >
                    <ZoomIn className="w-3 h-3" /> View full
                  </button>
                  <a
                    href={getDriveInfo(resolvedEvidence).openUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-[#94a3b8] hover:text-white"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div
                className="p-2 cursor-pointer bg-[#070a13] flex items-center justify-center max-h-52 overflow-hidden"
                onClick={() => onViewScreenshot(resolvedEvidence, 'UPI PAYMENT SCREENSHOT', `UTR: ${topUTR || 'N/A'}`)}
              >
                <img
                  src={getDriveInfo(resolvedEvidence).isDrive ? getDriveInfo(resolvedEvidence).thumbUrl : resolvedEvidence}
                  alt="UPI screenshot"
                  className="max-h-48 w-auto object-contain hover:opacity-90 transition-opacity rounded-xs"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {entries.length === 0 && !topUTR && !resolvedEvidence && (
        <p className="text-sm text-[#94a3b8] italic">No payment submission yet.</p>
      )}

      {/* Amount summary */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap py-2 border-t-2 border-[#22314d] text-xs sm:text-sm">
        <span className="font-bold tabular-nums text-[#f1f5f9]">
          ₹{Number(payment.amountPaid || 0).toLocaleString('en-IN')} paid
        </span>
        <span className="text-[#94a3b8]">
          of ₹{Number(payment.amountExpected || 0).toLocaleString('en-IN')} expected
          {payment.teamSize ? ` (${payment.teamSize} players)` : ''}
        </span>
        {!payment.fullyPaid && payment.status !== 'REJECTED' && (
          <span className="text-[#f87171] font-bold text-[10px] sm:text-xs bg-[#ef4444]/20 border border-[#ef4444] px-2 py-0.5 rounded-sm">
            SHORT ₹{Number(payment.amountRemaining || 0).toLocaleString('en-IN')}
          </span>
        )}
        {payment.fullyPaid && payment.status !== 'PAID' && payment.status !== 'REJECTED' && (
          <span className="text-[#4ade80] font-bold text-[10px] sm:text-xs bg-[#22c55e]/20 border border-[#22c55e] px-2 py-0.5 rounded-sm">
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
  onReject,
  onViewScreenshot
}: {
  p: any;
  busyId: string | null;
  onConfirm: (p: any) => void;
  onReject: (p: any) => void;
  onViewScreenshot: (url: string, title?: string, subtitle?: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'payment' | 'roster'>('payment');

  const busy = busyId === p.paymentId;

  return (
    <div className="border-2 border-[#22314d] bg-[#0d1322] border-l-4 sm:border-l-8 border-l-[#f59e0b] shadow-[3px_3px_0_0_#04060a] overflow-hidden">
        {/* Header */}
        <div className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-pixel text-xs break-words text-[#fdfbf7]">{p.teamName || '(no team name)'}</span>
                <StatusPill status={p.status} />
              </div>
              <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm text-[#94a3b8] mt-1">
                <span className="flex items-center gap-1 min-w-0 text-[#f1f5f9]">
                  <Users className="w-3.5 h-3.5 shrink-0 text-[#ff2a4b]" />
                  <span className="truncate">{p.leaderName}</span>
                </span>
                <span className="flex items-center gap-1 min-w-0">
                  <Mail className="w-3.5 h-3.5 shrink-0 text-[#38bdf8]" />
                  <span className="truncate max-w-[180px] sm:max-w-none">{p.contactEmail}</span>
                </span>
                {p.contactMobile && (
                  <span className="flex items-center gap-1 shrink-0">
                    <Phone className="w-3.5 h-3.5 shrink-0 text-[#4ade80]" />
                    <span>{p.contactMobile}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#94a3b8]/70 mt-1 break-words">
                {p.registrationId} · {p.method || 'UPI'} · ₹{Number(p.amount).toLocaleString('en-IN')}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-[#22314d]">
              <button
                onClick={() => onConfirm(p)}
                disabled={busy}
                title="Approve payment – mark as PAID and send ticket email"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 font-bold text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-[0_0_10px_rgba(22,163,74,0.3)]"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{busy ? 'Saving…' : 'Approve'}</span>
              </button>
              <button
                onClick={() => onReject(p)}
                disabled={busy}
                title="Reject payment – notify team leader by email"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 border-2 border-[#ef4444] text-[#ef4444] font-bold text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-[#ef4444] hover:text-white disabled:opacity-50 transition-colors cursor-pointer"
              >
                <ShieldX className="w-4 h-4 shrink-0" />
                <span>Reject</span>
              </button>
              <button
                onClick={() => setExpanded(v => !v)}
                className="flex items-center justify-center gap-1 border-2 border-[#22314d] text-[#94a3b8] px-2 sm:px-2.5 py-2 sm:py-2.5 hover:bg-[#131b2e] hover:text-[#f1f5f9] transition-colors shrink-0 cursor-pointer"
                title={expanded ? 'Collapse' : 'Expand details'}
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Expandable detail area */}
        {expanded && (
          <div className="border-t-2 border-[#22314d]">
            {/* Tab bar */}
            <div className="flex border-b-2 border-[#22314d] bg-[#070a13]">
              <button
                onClick={() => setActiveTab('payment')}
                className={`flex-1 sm:flex-none justify-center flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs font-bold transition-colors border-b-2 -mb-[2px] cursor-pointer ${
                  activeTab === 'payment'
                    ? 'border-[#ff2a4b] text-[#ff2a4b] bg-[#0d1322]'
                    : 'border-transparent text-[#94a3b8] hover:text-[#f1f5f9]'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">UPI Evidence &amp; UTR</span>
              </button>
              <button
                onClick={() => setActiveTab('roster')}
                className={`flex-1 sm:flex-none justify-center flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs font-bold transition-colors border-b-2 -mb-[2px] cursor-pointer ${
                  activeTab === 'roster'
                    ? 'border-[#ff2a4b] text-[#ff2a4b] bg-[#0d1322]'
                    : 'border-transparent text-[#94a3b8] hover:text-[#f1f5f9]'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Team Roster</span>
                {p.roster?.length > 0 && (
                  <span className="ml-1 bg-[#131b2e] border border-[#22314d] text-[#94a3b8] text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    {p.roster.length}
                  </span>
                )}
              </button>
            </div>

            <div className="p-3 sm:p-4 bg-[#0d1322]">
              {activeTab === 'payment' && (
                <PaymentEvidencePanel payment={p} onViewScreenshot={onViewScreenshot} />
              )}
              {activeTab === 'roster' && (
                <RosterPanel payment={p} onViewScreenshot={onViewScreenshot} />
              )}
            </div>
          </div>
        )}
      </div>
  );
}

/* ────────────── compact card (CONFIRMED / REJECTED / ALL views) ────────────── */
function CompactCard({
  p,
  onViewScreenshot
}: {
  p: any;
  onViewScreenshot: (url: string, title?: string, subtitle?: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'payment' | 'roster'>('payment');

  const borderColor = p.status === 'PAID' ? '#16a34a' : p.status === 'REJECTED' ? '#ef4444' : '#f59e0b';
  const statusBg   = 'bg-[#0d1322]';

  return (
    <div className={`border-2 border-[#22314d] ${statusBg} shadow-[2px_2px_0_0_#04060a] overflow-hidden`}
      style={{ borderLeftWidth: 6, borderLeftColor: borderColor }}>
      <div className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-pixel text-xs break-words text-[#fdfbf7]">{p.teamName || '(no team name)'}</span>
              <StatusPill status={p.status} />
              {p.status === 'PAID' && p.ticketNumber && (
                <span className="text-[10px] flex items-center gap-1 bg-[#22c55e]/15 border border-[#22c55e] text-[#4ade80] font-bold px-2 py-0.5 rounded-sm">
                  <Ticket className="w-3 h-3" /> {p.ticketNumber}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-0.5 text-xs text-[#94a3b8]">
              <span className="truncate max-w-[150px] sm:max-w-none text-[#f1f5f9]">{p.leaderName}</span>
              <span className="truncate max-w-[180px] sm:max-w-none">{p.contactEmail}</span>
              <span>{p.registrationId}</span>
              <span className="font-bold text-[#f1f5f9]">₹{Number(p.amountPaid || 0).toLocaleString('en-IN')}</span>
            </div>
            {p.status === 'PAID' && p.verifiedAt && (
              <p className="text-[10px] text-[#4ade80] mt-0.5">
                Approved {new Date(p.verifiedAt).toLocaleString('en-IN')}
                {p.verifiedBy ? ` by ${p.verifiedBy}` : ''}
              </p>
            )}
          </div>
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full sm:w-auto justify-center flex items-center gap-1 border-2 border-[#22314d] text-[#94a3b8] px-3 py-1.5 sm:py-2 hover:bg-[#131b2e] hover:text-[#f1f5f9] transition-colors text-xs font-bold shrink-0 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            {expanded ? 'Hide' : 'View'} Details
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t-2 border-[#22314d]">
          <div className="flex border-b-2 border-[#22314d] bg-[#070a13]">
            <button
              onClick={() => setActiveTab('payment')}
              className={`flex-1 sm:flex-none justify-center flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-bold transition-colors border-b-2 -mb-[2px] cursor-pointer ${
                activeTab === 'payment'
                  ? 'border-[#ff2a4b] text-[#ff2a4b] bg-[#0d1322]'
                  : 'border-transparent text-[#94a3b8] hover:text-[#f1f5f9]'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">UPI Evidence &amp; UTR</span>
            </button>
            <button
              onClick={() => setActiveTab('roster')}
              className={`flex-1 sm:flex-none justify-center flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-bold transition-colors border-b-2 -mb-[2px] cursor-pointer ${
                activeTab === 'roster'
                  ? 'border-[#ff2a4b] text-[#ff2a4b] bg-[#0d1322]'
                  : 'border-transparent text-[#94a3b8] hover:text-[#f1f5f9]'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Team Roster</span>
            </button>
          </div>
          <div className="p-3 sm:p-4 bg-[#0d1322]">
            {activeTab === 'payment' && (
              <PaymentEvidencePanel payment={p} onViewScreenshot={onViewScreenshot} />
            )}
            {activeTab === 'roster' && (
              <RosterPanel payment={p} onViewScreenshot={onViewScreenshot} />
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

  // Global preview modal (supports both UPI screenshots and College ID cards)
  const [previewModal, setPreviewModal] = useState<{ url: string; title?: string; subtitle?: string } | null>(null);

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
        <div className="bg-[#0d1322] border-2 border-[#22314d] shadow-[4px_4px_0_0_#04060a] sm:shadow-[6px_6px_0_0_#04060a] p-5 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#070a13] border border-[#22314d] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-[#ff2a4b]" />
            </div>
            <div>
              <h1 className="font-pixel text-sm text-[#fdfbf7]">PAYMENT DESK</h1>
              <p className="text-xs text-[#94a3b8]">ADG x Mosaic · Organiser access</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1 uppercase tracking-wide text-[#94a3b8]">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full border-2 border-[#22314d] bg-[#101726] text-[#f8fafc] px-3 py-2 text-sm focus:outline-none focus:border-[#ff2a4b]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 uppercase tracking-wide text-[#94a3b8]">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus
                className="w-full border-2 border-[#22314d] bg-[#101726] text-[#f8fafc] px-3 py-2 text-sm focus:outline-none focus:border-[#ff2a4b]"
              />
            </div>
            {loginError && (
              <p className="text-sm text-[#f87171] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {loginError}
              </p>
            )}
            <button
              type="submit" disabled={loggingIn}
              className="w-full bg-[#ff2a4b] hover:bg-[#e50914] text-white font-pixel text-xs py-3 transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(255,42,75,0.4)] cursor-pointer"
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
      {/* Global screenshot / ID modal */}
      {previewModal && (
        <ScreenshotModal
          url={previewModal.url}
          title={previewModal.title}
          subtitle={previewModal.subtitle}
          onClose={() => setPreviewModal(null)}
        />
      )}

      {/* Reject dialog */}
      {rejecting && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-3 sm:p-4 z-50 backdrop-blur-xs"
          onClick={() => setRejecting(null)}>
          <div className="bg-[#0d1322] border-2 border-[#22314d] shadow-[0_0_30px_rgba(0,0,0,0.8)] p-4 sm:p-6 max-w-md w-full"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-[#ef4444] flex items-center justify-center shrink-0 rounded-xs shadow-[0_0_8px_rgba(239,68,68,0.4)]">
                <ShieldX className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="font-pixel text-xs text-[#fdfbf7]">REJECT PAYMENT</h2>
                <p className="text-xs text-[#94a3b8] mt-0.5 truncate">Team: <strong className="text-[#f1f5f9]">{rejecting.teamName}</strong></p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[#94a3b8] mb-1 break-words">
              An email will be sent to <strong className="text-[#f1f5f9]">{rejecting.contactEmail}</strong> with the rejection reason and your contact info.
            </p>
            <p className="text-xs text-[#64748b] mb-3">Leave blank to use the default message.</p>
            <textarea
              value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} autoFocus
              placeholder={`e.g. No credit of ₹${Number(rejecting.amountExpected || 500).toLocaleString('en-IN')} found against this UTR. Please contact us at adg@sfit.ac.in`}
              className="w-full border-2 border-[#22314d] bg-[#101726] text-[#f8fafc] px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#ff2a4b] resize-none placeholder-[#64748b]"
            />
            <div className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
              <button onClick={() => setRejecting(null)}
                className="w-full sm:w-auto px-5 py-2.5 sm:py-3 border-2 border-[#22314d] bg-[#131b2e] text-[#f1f5f9] font-bold text-xs sm:text-sm hover:bg-[#1a253c] transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={doReject} disabled={busyId === rejecting.paymentId}
                className="flex-1 flex items-center justify-center gap-2 bg-[#ef4444] text-white font-bold text-xs sm:text-sm py-2.5 sm:py-3 hover:bg-[#dc2626] disabled:opacity-50 transition-colors cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.4)]">
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
          <h1 className="font-pixel text-base sm:text-lg text-[#fdfbf7] drop-shadow-[0_0_8px_rgba(255,42,75,0.3)]">PAYMENT DESK</h1>
          <p className="text-xs text-[#94a3b8] mt-1">
            Verify UPI screenshots &amp; UTRs, then approve or reject each team.
            {lastSynced && <> · Synced at {lastSynced.toLocaleTimeString()}</>}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={load} disabled={loading}
            className="flex-1 sm:flex-initial justify-center flex items-center gap-2 border-2 border-[#22314d] bg-[#0d1322] px-3 py-2 text-xs font-bold text-[#f1f5f9] hover:bg-[#131b2e] transition-colors disabled:opacity-50 cursor-pointer shadow-[2px_2px_0_0_#04060a]">
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#38bdf8] ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={logout}
            className="flex-1 sm:flex-initial justify-center flex items-center gap-2 border-2 border-[#ef4444] bg-[#0d1322] text-[#ef4444] px-3 py-2 text-xs font-bold hover:bg-[#ef4444] hover:text-white transition-colors cursor-pointer shadow-[2px_2px_0_0_#04060a]">
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Sign out
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-6">
        <Stat icon={Clock}        label="Awaiting check" value={counts.awaiting}  tone="#fbbf24" />
        <Stat icon={CheckCircle2} label="Confirmed"       value={counts.confirmed} tone="#4ade80" />
        <Stat icon={XCircle}      label="Rejected"        value={counts.rejected}  tone="#f87171" />
        <Stat icon={IndianRupee}  label="Collected"       value={`₹${counts.collected.toLocaleString('en-IN')}`} tone="#38bdf8" />
      </div>

      {/* Filter + search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="w-full sm:w-auto overflow-x-auto flex border-2 border-[#22314d] divide-x-2 divide-[#22314d] bg-[#0d1322] shadow-[2px_2px_0_0_#04060a]">
          {(['AWAITING', 'CONFIRMED', 'REJECTED', 'ALL'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-1 sm:flex-initial whitespace-nowrap px-2.5 sm:px-4 py-2 text-[11px] sm:text-xs font-bold transition-colors text-center cursor-pointer ${
                filter === f ? 'bg-[#ff2a4b] text-white shadow-[0_0_10px_rgba(255,42,75,0.4)]' : 'text-[#94a3b8] hover:bg-[#131b2e] hover:text-[#f1f5f9]'
              }`}>
              {f === 'AWAITING' ? `Awaiting (${counts.awaiting})`
                : f === 'CONFIRMED' ? `Confirmed (${counts.confirmed})`
                : f === 'REJECTED'  ? `Rejected (${counts.rejected})`
                : 'All'}
            </button>
          ))}
        </div>
        <div className="w-full sm:flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search team, leader, email or UTR…"
            className="w-full border-2 border-[#22314d] bg-[#0d1322] pl-9 pr-3 py-2 text-sm text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:border-[#ff2a4b] shadow-[2px_2px_0_0_#04060a]"
          />
        </div>
      </div>

      {loadError && (
        <div className="border-2 border-[#ef4444] bg-[#ef4444]/10 text-[#f87171] px-4 py-3 mb-4 text-sm flex items-start gap-2 rounded-xs">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{loadError}</span>
          <button onClick={() => setLoadError(null)} className="ml-auto cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* AWAITING hint */}
      {filter === 'AWAITING' && visible.length > 0 && (
        <div className="border-2 border-[#f59e0b]/40 bg-[#f59e0b]/10 px-3 sm:px-4 py-3 mb-4 text-xs sm:text-sm flex items-start gap-2 rounded-xs">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[#fbbf24]" />
          <span className="text-[#fde68a]">
            Review the UPI screenshot and UTR for each team before approving.
            Clicking <strong className="text-[#4ade80]">Approve</strong> marks payment as received and sends the team leader their entry ticket by email.
            Clicking <strong className="text-[#f87171]">Reject</strong> notifies the leader to contact the organizer.
          </span>
        </div>
      )}

      {/* List */}
      {visible.length === 0 ? (
        <div className="border-2 border-dashed border-[#22314d] bg-[#0d1322]/50 p-8 sm:p-16 text-center">
          <p className="font-pixel text-xs text-[#94a3b8]">
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
                  onViewScreenshot={(url, title, subtitle) => setPreviewModal({ url, title, subtitle })}
                />
              ))
            : visible.map(p => (
                <CompactCard
                  key={p.paymentId}
                  p={p}
                  onViewScreenshot={(url, title, subtitle) => setPreviewModal({ url, title, subtitle })}
                />
              ))
          }
        </div>
      )}
    </div>
  );
}

export default PaymentDeskPage;
