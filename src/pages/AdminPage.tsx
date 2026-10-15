import React, { useState, useEffect } from 'react';
import {
  adminLogin,
  fetchAdminDashboard,
  fetchAdminRegistrations,
  fetchAdminStudents,
  fetchAdminPayments,
  verifyAdminPayment,
  rejectAdminPayment,
  fetchAuditLogs,
  fetchEmailLogs,
  downloadAdminExport
} from '../services/api.ts';
import {
  Lock,
  ShieldCheck,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Download,
  Eye,
  Check,
  X,
  Mail,
  FileSpreadsheet,
  LogOut,
  Filter,
  RefreshCw,
  ExternalLink,
  Image as ImageIcon,
  ZoomIn,
  Copy,
  Phone,
  GraduationCap,
  IndianRupee,
  Ticket,
  ArrowRight
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('deception_admin_token'));
  const [adminUser, setAdminUser] = useState<any>(() => {
    const saved = localStorage.getItem('deception_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Login form state
  const [emailInput, setEmailInput] = useState('admin@adg.org');
  const [passwordInput, setPasswordInput] = useState('Deception@2026');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Admin Sub-tab
  const [activeTab, setActiveTab] = useState<'overview' | 'registrations' | 'verification' | 'students' | 'audit' | 'emails'>('overview');

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingExport, setDownloadingExport] = useState<string | null>(null);

  // Registration Filters (payment-centric)
  const [regSearch, setRegSearch] = useState('');
  const [regPaymentFilter, setRegPaymentFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');
  const [regSizeFilter, setRegSizeFilter] = useState('');

  // Selected Registration detail modal
  const [selectedReg, setSelectedReg] = useState<any | null>(null);
  const [selectedRegPayment, setSelectedRegPayment] = useState<any | null>(null);
  const [previewModal, setPreviewModal] = useState<{
    url: string;
    title: string;
    subtitle?: string;
  } | null>(null);
  const [copiedUTR, setCopiedUTR] = useState(false);

  // Rejection modal (kept for compat, but primary desk is the dedicated page)
  const [rejectModalPayment, setRejectModalPayment] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const getDriveInfo = (url: string | null | undefined) => {
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
  };

  const getExportUrl = (endpoint: string) => {
    return token ? `${endpoint}?token=${encodeURIComponent(token)}` : endpoint;
  };

  const handleDownloadExport = async (e: React.MouseEvent, endpoint: string, filename: string) => {
    e.preventDefault();
    if (downloadingExport) return;
    setDownloadingExport(endpoint);
    try {
      await downloadAdminExport(endpoint, filename);
    } catch (err: any) {
      alert(err.message || 'Failed to download report');
    } finally {
      setDownloadingExport(null);
    }
  };

  useEffect(() => {
    if (token) {
      loadAllAdminData();
    }
  }, [token, activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await adminLogin({ email: emailInput, password: passwordInput });
      setToken(res.token);
      setAdminUser(res.admin);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('deception_admin_token');
    localStorage.removeItem('deception_admin_user');
    setToken(null);
    setAdminUser(null);
  };

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      fetchAdminDashboard().then(setDashboardData).catch(() => {});

      if (activeTab === 'registrations' || activeTab === 'verification') {
        // Load both registrations and payments so we can join them
        const [regs, pays] = await Promise.all([
          fetchAdminRegistrations({ search: regSearch, teamSize: regSizeFilter }),
          fetchAdminPayments()
        ]);
        setRegistrations(regs);
        setPayments(pays);
      } else if (activeTab === 'students') {
        const sList = await fetchAdminStudents();
        setStudents(sList);
      } else if (activeTab === 'audit') {
        const logs = await fetchAuditLogs();
        setAuditLogs(logs);
      } else if (activeTab === 'emails') {
        const eList = await fetchEmailLogs();
        setEmailLogs(eList);
      }
    } catch (err: any) {
      if (err.message?.includes('Unauthorized')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  // Derive payment status label (simple 3-state: Approved / Pending / Rejected)
  const getPaymentLabel = (pay: any): { label: string; color: string; bg: string } => {
    if (!pay) return { label: 'PENDING', color: '#92400e', bg: '#fef3c7' };
    if (pay.status === 'PAID') return { label: 'APPROVED', color: '#166534', bg: '#dcfce7' };
    if (pay.status === 'REJECTED') return { label: 'REJECTED', color: '#991b1b', bg: '#fee2e2' };
    return { label: 'PENDING', color: '#92400e', bg: '#fef3c7' };
  };

  const fallbackCopyText = (text: string) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
    } catch {}
    document.body.removeChild(ta);
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {
          fallbackCopyText(text);
        });
      } else {
        fallbackCopyText(text);
      }
    } catch {
      fallbackCopyText(text);
    }
    setCopiedUTR(true);
    setTimeout(() => setCopiedUTR(false), 1800);
  };

  // Client-side filter registrations by payment status
  const filteredRegistrations = registrations.filter(reg => {
    const pay = payments.find(p => p.registrationId === reg.registrationId);
    if (regPaymentFilter === 'ALL') return true;
    if (regPaymentFilter === 'APPROVED') return pay?.status === 'PAID';
    if (regPaymentFilter === 'REJECTED') return pay?.status === 'REJECTED';
    if (regPaymentFilter === 'PENDING') return !pay || !['PAID','REJECTED'].includes(pay?.status);
    return true;
  }).filter(reg => {
    if (!regSearch.trim()) return true;
    const q = regSearch.toLowerCase();
    return [
      reg.registrationId, reg.teamName, reg.leaderName, reg.contactEmail
    ].some(v => String(v || '').toLowerCase().includes(q));
  });

  const handleVerifyPayment = async (paymentId: string) => {
    try {
      await verifyAdminPayment(paymentId);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    }
  };

  const handleRejectPayment = async () => {
    if (!rejectModalPayment) return;
    try {
      await rejectAdminPayment(rejectModalPayment.paymentId, rejectReason || 'Transaction could not be verified on bank statement');
      setRejectModalPayment(null);
      setRejectReason('');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  // ----------------------------------------------------
  // LOGIN SCREEN
  // ----------------------------------------------------
  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-[#FFFDF0] border-4 border-[#111827] shadow-[8px_8px_0_0_#111827] p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-[#E5005A] border-3 border-[#111827] mx-auto flex items-center justify-center text-white shadow-[2px_2px_0_0_#111827]">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-pixel text-2xl text-[#111827]">ADMIN LOGIN</h1>
            <p className="text-xs font-arcade text-gray-600">DECEPTION 2026 ORGANIZER SUITE</p>
          </div>

          {loginError && (
            <div className="p-3 bg-[#E5005A] text-white text-xs font-arcade border-2 border-[#111827]">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs font-body">
            <div>
              <label className="block font-arcade text-[11px] font-bold text-[#111827] mb-1">
                Admin Email
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-[#F7E8B5] border-2 border-[#111827] font-mono shadow-[2px_2px_0_0_#111827] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-arcade text-[11px] font-bold text-[#111827] mb-1">
                Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-[#F7E8B5] border-2 border-[#111827] font-mono shadow-[2px_2px_0_0_#111827] focus:outline-none"
              />
            </div>

            <div className="p-3 bg-[#F7E8B5] border border-[#111827] text-[11px] font-mono space-y-1">
              <span className="text-[#E5005A] font-bold font-pixel text-[9px] block">PRELOADED SEED ACCOUNT:</span>
              <div>Email: admin@adg.org</div>
              <div>Password: Deception@2026</div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-[#111827] text-white font-arcade text-xs py-3 border-2 border-[#111827] shadow-[3px_3px_0_0_#E5005A] hover:bg-[#E5005A] transition-colors disabled:opacity-50"
            >
              {loginLoading ? 'AUTHENTICATING...' : 'ACCESS CONTROL PORTAL'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // LOGGED-IN ADMIN DASHBOARD
  // ----------------------------------------------------
  const pendingPayments = payments.filter((p) => p.status === 'PENDING_VERIFICATION');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Admin Header Bar */}
      <div className="bg-[#FFFDF0] border-4 border-[#111827] shadow-[6px_6px_0_0_#111827] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#E5005A] text-white font-pixel text-[10px] px-2 py-0.5 border border-[#111827]">
              ORGANIZER ACCESS
            </span>
            <span className="text-xs font-mono text-gray-600">
              Logged in as {adminUser?.name || 'Administrator'} ({adminUser?.email})
            </span>
          </div>
          <h1 className="font-pixel text-2xl sm:text-3xl text-[#111827] mt-1 tracking-wider">
            DECEPTION ADMIN CONTROL
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Individual Excel Reports */}
          <a
            href={getExportUrl('/api/admin/export/all')}
            onClick={(e) => handleDownloadExport(e, '/api/admin/export/all', 'DECEPTION_2026_MASTER_REGISTRATIONS.xlsx')}
            download="DECEPTION_2026_MASTER_REGISTRATIONS.xlsx"
            title="Download Master All-in-One Workbook with Overview, Teams, Students & ID Cards, and Payments & Receipts"
            className="bg-[#4CAF50] text-white font-arcade text-xs px-3 py-2 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] hover:bg-[#111827] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {downloadingExport === '/api/admin/export/all' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            {downloadingExport === '/api/admin/export/all' ? 'DOWNLOADING...' : 'MASTER EXCEL'}
          </a>

          <a
            href={getExportUrl('/api/admin/export/teams')}
            onClick={(e) => handleDownloadExport(e, '/api/admin/export/teams', 'DECEPTION_2026_TEAMS_LIST.xlsx')}
            download="DECEPTION_2026_TEAMS_LIST.xlsx"
            title="Download Teams Roster Excel with Squad sizes, Leader contacts, Tickets & Invoices"
            className="bg-[#00AFC6] text-[#111827] font-arcade text-xs px-3 py-2 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {downloadingExport === '/api/admin/export/teams' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Users className="w-4 h-4" />
            )}
            {downloadingExport === '/api/admin/export/teams' ? 'DOWNLOADING...' : 'TEAMS LIST (.XLSX)'}
          </a>

          <a
            href={getExportUrl('/api/admin/export/students')}
            onClick={(e) => handleDownloadExport(e, '/api/admin/export/students', 'DECEPTION_2026_STUDENTS_LIST.xlsx')}
            download="DECEPTION_2026_STUDENTS_LIST.xlsx"
            title="Download Students & ID Cards Excel with SFIT & Non-SFIT colleges, ID Card Links, and Tickets"
            className="bg-[#F4C430] text-[#111827] font-arcade text-xs px-3 py-2 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {downloadingExport === '/api/admin/export/students' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            {downloadingExport === '/api/admin/export/students' ? 'DOWNLOADING...' : 'STUDENTS & ID CARDS (.XLSX)'}
          </a>

          <a
            href={getExportUrl('/api/admin/export/payments')}
            onClick={(e) => handleDownloadExport(e, '/api/admin/export/payments', 'DECEPTION_2026_PAYMENTS_LIST.xlsx')}
            download="DECEPTION_2026_PAYMENTS_LIST.xlsx"
            title="Download Payments Roster Excel with UTR numbers, Invoices, Receipts, and verification timestamps"
            className="bg-[#E5005A] text-white font-arcade text-xs px-3 py-2 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] hover:bg-[#111827] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {downloadingExport === '/api/admin/export/payments' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            {downloadingExport === '/api/admin/export/payments' ? 'DOWNLOADING...' : 'PAYMENTS & RECEIPTS (.XLSX)'}
          </a>

          <button
            onClick={handleLogout}
            className="bg-[#111827] text-white font-arcade text-xs px-3 py-2 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] hover:bg-[#E5005A] transition-all flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" /> LOGOUT
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b-3 border-[#111827] pb-2 font-arcade text-xs">
        {[
          { id: 'overview', label: 'Dashboard Overview' },
          { id: 'registrations', label: `Registrations (${dashboardData?.totalRegistrations ?? '...'})` },
          { id: 'verification', label: `Payment Desk ↗` },
          { id: 'students', label: `Participants (${dashboardData?.totalParticipants ?? students.length})` },
          { id: 'audit', label: 'Audit Trail' },
          { id: 'emails', label: 'Email Dispatches' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 border-2 border-[#111827] transition-all ${
              activeTab === tab.id
                ? 'bg-[#111827] text-white shadow-[3px_3px_0_0_#E5005A]'
                : 'bg-[#FFFDF0] text-[#111827] hover:bg-[#F7E8B5]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1. OVERVIEW TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#FFFDF0] border-3 border-[#111827] p-5 shadow-[4px_4px_0_0_#111827]">
              <span className="text-[10px] font-pixel text-gray-500 block">TOTAL REGISTRATIONS</span>
              <div className="font-pixel text-3xl text-[#111827] mt-1">
                {dashboardData?.totalRegistrations ?? 0}
              </div>
              <span className="text-xs font-arcade text-[#00AFC6] mt-1 block">
                {dashboardData?.confirmedRegistrations ?? 0} Confirmed Passes
              </span>
            </div>

            <div className="bg-[#FFFDF0] border-3 border-[#111827] p-5 shadow-[4px_4px_0_0_#111827]">
              <span className="text-[10px] font-pixel text-gray-500 block">TOTAL SQUAD TEAMS</span>
              <div className="font-pixel text-3xl text-[#E5005A] mt-1">
                {dashboardData?.totalTeams ?? 0}
              </div>
              <span className="text-xs font-arcade text-gray-600 mt-1 block">
                Strict 5 or 6 players
              </span>
            </div>

            <div className="bg-[#FFFDF0] border-3 border-[#111827] p-5 shadow-[4px_4px_0_0_#111827]">
              <span className="text-[10px] font-pixel text-gray-500 block">VERIFIED STUDENTS</span>
              <div className="font-pixel text-3xl text-[#4CAF50] mt-1">
                {dashboardData?.totalParticipants ?? 0}
              </div>
              <span className="text-xs font-arcade text-gray-600 mt-1 block">
                @student.sfit.ac.in
              </span>
            </div>

            <div className="bg-[#FFFDF0] border-3 border-[#111827] p-5 shadow-[4px_4px_0_0_#111827]">
              <span className="text-[10px] font-pixel text-gray-500 block">TOTAL REVENUE</span>
              <div className="font-pixel text-3xl text-[#F4C430] mt-1">
                ₹{dashboardData?.totalRevenue ?? 0}
              </div>
              <span className="text-xs font-arcade text-[#111827] mt-1 block">
                {dashboardData?.pendingVerification ?? 0} Pending Verification
              </span>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-[#F7E8B5] border-3 border-[#111827] p-6 shadow-[4px_4px_0_0_#111827] space-y-3">
            <h3 className="font-arcade text-sm font-bold text-[#111827]">
              ORGANIZER OPERATIONAL SUMMARY
            </h3>
            <p className="text-xs font-body text-[#111827]/90 leading-relaxed">
              DECEPTION matches take place on <strong>16 & 17 October 2026</strong> in <strong>Room 028</strong>. All squads have 5 or 6 participants. When payments are confirmed, ticket QR codes are automatically generated for seamless check-in at the entrance.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => setActiveTab('verification')}
                className="bg-[#111827] text-white font-arcade text-xs px-4 py-2 border-2 border-[#111827]"
              >
                OPEN VERIFICATION QUEUE &gt;
              </button>
              <button
                onClick={() => setActiveTab('registrations')}
                className="bg-[#00AFC6] text-[#111827] font-arcade text-xs px-4 py-2 border-2 border-[#111827]"
              >
                VIEW SQUAD ROSTER &gt;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. REGISTRATIONS TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'registrations' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-[#FFFDF0] border-3 border-[#111827] p-4 shadow-[3px_3px_0_0_#111827] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#111827]/40" />
              <input
                type="text"
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadAllAdminData()}
                placeholder="Search by team name, leader, email, or registration ID…"
                className="w-full pl-9 pr-3 py-2.5 bg-[#F7E8B5] border-2 border-[#111827] text-xs font-body focus:outline-none focus:ring-2 focus:ring-[#E5005A]"
              />
            </div>

            {/* Payment Status filter — 3 simple states */}
            <div className="flex border-2 border-[#111827] overflow-hidden shrink-0">
              {(['ALL', 'APPROVED', 'PENDING', 'REJECTED'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setRegPaymentFilter(f)}
                  className={`px-3 py-2 text-[10px] font-arcade transition-colors ${
                    regPaymentFilter === f
                      ? f === 'APPROVED' ? 'bg-[#16a34a] text-white'
                        : f === 'REJECTED' ? 'bg-[#dc2626] text-white'
                        : f === 'PENDING' ? 'bg-[#d97706] text-white'
                        : 'bg-[#111827] text-white'
                      : 'bg-[#FFFDF0] text-[#111827] hover:bg-[#F7E8B5]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Squad size */}
            <select
              value={regSizeFilter}
              onChange={(e) => setRegSizeFilter(e.target.value)}
              className="px-3 py-2 bg-[#F7E8B5] border-2 border-[#111827] text-xs font-arcade shrink-0"
            >
              <option value="">All Sizes</option>
              <option value="5">5 Players</option>
              <option value="6">6 Players</option>
            </select>

            <button
              onClick={loadAllAdminData}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#111827] text-white font-arcade text-xs border-2 border-[#111827] hover:bg-gray-800 disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> REFRESH
            </button>

            <a
              href={getExportUrl('/api/admin/export/teams')}
              onClick={(e) => handleDownloadExport(e, '/api/admin/export/teams', 'DECEPTION_2026_TEAMS_LIST.xlsx')}
              download="DECEPTION_2026_TEAMS_LIST.xlsx"
              className="px-3.5 py-2 bg-[#00AFC6] text-[#111827] font-arcade text-xs border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] hover:bg-white flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {downloadingExport === '/api/admin/export/teams' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
              {downloadingExport === '/api/admin/export/teams' ? 'DOWNLOADING...' : 'EXPORT (.XLSX)'}
            </a>
          </div>

          {/* Summary count */}
          <p className="text-xs font-mono text-[#111827]/50">
            Showing <strong>{filteredRegistrations.length}</strong> of {registrations.length} registrations
          </p>

          {/* Table */}
          <div className="bg-[#FFFDF0] border-3 border-[#111827] shadow-[4px_4px_0_0_#111827] overflow-x-auto">
            <table className="w-full text-left text-xs font-body border-collapse">
              <thead>
                <tr className="bg-[#111827] text-white font-arcade">
                  <th className="p-3">Reg. ID</th>
                  <th className="p-3">Squad Name</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">Leader</th>
                  <th className="p-3">Payment Status</th>
                  <th className="p-3">Proof / UTR</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111827]">
                {filteredRegistrations.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center font-arcade text-xs text-[#111827]/40">
                      NO REGISTRATIONS MATCH YOUR FILTER
                    </td>
                  </tr>
                )}
                {filteredRegistrations.map((reg) => {
                  const pay = payments.find(p => p.registrationId === reg.registrationId);
                  const { label: payLabel, color: payColor, bg: payBg } = getPaymentLabel(pay);
                  const proofUrl = pay?.evidence?.url || pay?.entries?.[0]?.evidence?.url || reg.paymentEvidence;
                  const utr = pay?.transactionReference || pay?.entries?.[0]?.transactionReference || reg.transactionReference;

                  return (
                    <tr key={reg.registrationId} className="hover:bg-[#F7E8B5]/50">
                      <td className="p-3 font-mono font-bold text-[#E5005A] whitespace-nowrap">
                        {reg.registrationId}
                      </td>
                      <td className="p-3 font-bold">{reg.teamName}</td>
                      <td className="p-3 whitespace-nowrap">{reg.teamSize || 5}P</td>
                      <td className="p-3">
                        <div className="font-bold">{reg.leaderName}</div>
                        <div className="text-gray-500 text-[10px] font-mono">{reg.contactEmail}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className="px-2 py-0.5 border font-pixel text-[9px] font-bold"
                          style={{ color: payColor, borderColor: payColor, backgroundColor: payBg }}
                        >
                          {payLabel}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {proofUrl ? (
                            <button
                              type="button"
                              onClick={() => setPreviewModal({
                                url: proofUrl,
                                title: `UPI PAYMENT SCREENSHOT - ${reg.teamName}`,
                                subtitle: `${reg.registrationId} · Leader: ${reg.leaderName}`
                              })}
                              className="px-2 py-1 bg-[#111827] text-white hover:bg-[#E5005A] text-[10px] font-arcade flex items-center gap-1 border border-[#111827] shadow-[1px_1px_0_0_#000] cursor-pointer"
                              title="Click to preview payment screenshot"
                            >
                              <ImageIcon className="w-3 h-3 text-[#38bdf8]" /> PROOF
                            </button>
                          ) : (
                            <span className="text-gray-400 font-mono text-[10px]">No proof</span>
                          )}
                          {utr && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(utr)}
                              className="font-mono text-[10px] font-bold text-[#111827] bg-[#F7E8B5] px-1.5 py-0.5 border border-[#111827]/40 hover:bg-white truncate max-w-[110px] cursor-pointer"
                              title={`Click to copy UTR: ${utr}`}
                            >
                              {utr}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-gray-500 text-[11px] whitespace-nowrap">
                        {new Date(reg.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedReg(reg);
                            setSelectedRegPayment(pay || null);
                            setCopiedUTR(false);
                          }}
                          className="px-2.5 py-1.5 bg-[#00AFC6] text-[#111827] border-2 border-[#111827] font-arcade text-[10px] hover:bg-white flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Eye className="w-3 h-3" /> VIEW
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. PAYMENT DESK (redirect to dedicated page) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          <div className="bg-[#FFFDF0] border-3 border-[#111827] shadow-[6px_6px_0_0_#111827] p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-[#E5005A] border-3 border-[#111827] mx-auto flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-pixel text-lg text-[#111827]">PAYMENT APPROVAL DESK</h3>
              <p className="text-sm font-body text-[#111827]/70 mt-2 max-w-md mx-auto">
                All payment verification — approvals, rejections, UPI screenshot review, and team rosters — happens
                on the dedicated <strong>Payment Desk</strong> page.
              </p>
              <p className="text-xs font-body text-[#111827]/50 mt-1">
                Approving a team sends the entry ticket to the leader's email. Rejecting sends a notification with your contact info.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href="?payments"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[#111827] text-white font-arcade text-sm px-6 py-3 border-3 border-[#111827] shadow-[4px_4px_0_0_#E5005A] hover:bg-[#E5005A] transition-colors"
              >
                OPEN PAYMENT DESK <ArrowRight className="w-4 h-4" />
              </a>
              <span className="text-xs font-mono text-[#111827]/40">Opens in a new tab · URL: ?payments</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#FFFDF0] border-3 border-[#111827] p-4 text-center">
              <p className="font-pixel text-2xl text-[#d97706]">{dashboardData?.pendingVerification ?? '…'}</p>
              <p className="text-[10px] font-arcade text-[#111827]/50 mt-1">AWAITING REVIEW</p>
            </div>
            <div className="bg-[#FFFDF0] border-3 border-[#111827] p-4 text-center">
              <p className="font-pixel text-2xl text-[#16a34a]">{dashboardData?.confirmedRegistrations ?? '…'}</p>
              <p className="text-[10px] font-arcade text-[#111827]/50 mt-1">APPROVED</p>
            </div>
            <div className="bg-[#FFFDF0] border-3 border-[#111827] p-4 text-center">
              <p className="font-pixel text-2xl text-[#dc2626]">{dashboardData?.rejectedRegistrations ?? '…'}</p>
              <p className="text-[10px] font-arcade text-[#111827]/50 mt-1">REJECTED</p>
            </div>
          </div>

          {/* Pending verification queue right here in organizer portal */}
          <div className="bg-[#FFFDF0] border-3 border-[#111827] p-5 shadow-[4px_4px_0_0_#111827] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#111827] pb-3">
              <div>
                <h3 className="font-pixel text-base text-[#111827]">
                  PENDING REVIEW QUEUE ({pendingPayments.length} SQUADS)
                </h3>
                <p className="text-xs font-body text-gray-600">
                  Inspect UPI screenshots, verify UTR, review squad roster ID cards, and approve passes directly.
                </p>
              </div>
              <button
                onClick={loadAllAdminData}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] text-white font-arcade text-xs border border-[#111827] hover:bg-gray-800 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> REFRESH
              </button>
            </div>

            {pendingPayments.length === 0 ? (
              <div className="p-8 text-center bg-[#F7E8B5]/40 border-2 border-dashed border-[#111827]/30">
                <p className="font-arcade text-sm text-[#111827]/70">NO PAYMENTS CURRENTLY AWAITING VERIFICATION</p>
                <p className="text-xs text-[#111827]/50 mt-1">All submitted UPI proofs have been verified or rejected.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPayments.map((p) => {
                  const proofUrl = p.evidence?.url || p.entries?.[0]?.evidence?.url;
                  const utr = p.transactionReference || p.entries?.[0]?.transactionReference;
                  const drive = getDriveInfo(proofUrl);
                  const roster = p.roster || [];

                  return (
                    <div
                      key={p.paymentId || p.registrationId}
                      className="border-3 border-[#111827] bg-[#FFFDF0] shadow-[3px_3px_0_0_#111827] p-4 space-y-4"
                    >
                      {/* Squad header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#111827]/20 pb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-pixel text-sm text-[#111827]">{p.teamName || 'Unknown Team'}</span>
                            <span className="font-mono text-xs font-bold text-[#E5005A] bg-[#E5005A]/10 px-2 py-0.5 border border-[#E5005A]/30">
                              {p.registrationId}
                            </span>
                            <span className="font-arcade text-[10px] bg-[#fbbf24]/20 border border-[#fbbf24] text-[#b45309] font-bold px-2 py-0.5">
                              AWAITING REVIEW
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600 mt-1 flex-wrap">
                            <span>Leader: <strong>{p.leaderName}</strong></span>
                            <span>Email: <strong className="font-mono">{p.contactEmail}</strong></span>
                            {p.contactMobile && <span>Mobile: <strong className="font-mono">{p.contactMobile}</strong></span>}
                          </div>
                        </div>

                        {/* Direct Action buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleVerifyPayment(p.paymentId)}
                            className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white font-arcade text-xs border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] flex items-center gap-1.5 cursor-pointer font-bold transition-all"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> APPROVE
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectModalPayment(p);
                              setRejectReason('');
                            }}
                            className="px-3.5 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-arcade text-xs border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] flex items-center gap-1 cursor-pointer font-bold transition-all"
                          >
                            <X className="w-3.5 h-3.5" /> REJECT
                          </button>
                        </div>
                      </div>

                      {/* Payment Evidence & Roster Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Evidence column */}
                        <div className="bg-[#0f172a] border-2 border-[#1e293b] p-3.5 text-white space-y-3 rounded-xs">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                            PAYMENT EVIDENCE &amp; UTR
                          </p>

                          {/* UTR High-Contrast box */}
                          <div className="bg-[#020617] border border-[#334155] p-2.5 rounded-xs space-y-1.5">
                            <span className="text-[10px] font-bold text-[#94a3b8] uppercase block">
                              UTR Reference
                            </span>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <span className="font-mono text-sm sm:text-base font-bold text-[#38bdf8] select-all break-all tracking-wider">
                                {utr || '—'}
                              </span>
                              {utr && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(utr)}
                                  className="px-2.5 py-1 bg-[#38bdf8]/15 hover:bg-[#38bdf8] text-[#38bdf8] hover:text-[#020617] border border-[#38bdf8]/40 font-arcade text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                                >
                                  {copiedUTR ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                  {copiedUTR ? 'COPIED!' : 'COPY'}
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 text-gray-300">
                            <span>Amount: <strong className="text-[#facc15] font-mono text-sm">₹{Number(p.amountExpected || p.amount || 500).toLocaleString('en-IN')}</strong></span>
                            <span>Paid: <strong className="text-[#4ade80] font-mono text-sm">₹{Number(p.amountPaid || p.amount || 0).toLocaleString('en-IN')}</strong></span>
                          </div>

                          {/* Screenshot preview */}
                          {proofUrl ? (
                            <div className="border border-[#334155] bg-[#020617] p-2 rounded-xs space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-[#94a3b8] flex items-center gap-1 uppercase">
                                  <ImageIcon className="w-3 h-3 text-[#38bdf8]" /> UPI Screenshot
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewModal({
                                      url: proofUrl,
                                      title: `UPI Payment Proof - ${p.teamName}`,
                                      subtitle: `UTR: ${utr || 'N/A'} · ${p.registrationId}`
                                    })}
                                    className="text-[10px] text-[#38bdf8] hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <ZoomIn className="w-3 h-3" /> View Full
                                  </button>
                                  <a
                                    href={drive.openUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-gray-400 hover:text-white flex items-center gap-0.5"
                                  >
                                    <ExternalLink className="w-3 h-3" /> Tab
                                  </a>
                                </div>
                              </div>
                              <div
                                onClick={() => setPreviewModal({
                                  url: proofUrl,
                                  title: `UPI Payment Proof - ${p.teamName}`,
                                  subtitle: `UTR: ${utr || 'N/A'} · ${p.registrationId}`
                                })}
                                className="cursor-pointer bg-[#0b1329] border border-[#1e293b] rounded-xs flex items-center justify-center p-1 hover:opacity-90 max-h-48 overflow-hidden"
                              >
                                <img
                                  src={drive.isDrive ? drive.thumbUrl : proofUrl}
                                  alt="UPI Proof"
                                  className="max-h-44 w-auto object-contain rounded-xs"
                                  onError={(e) => {
                                    if (drive.isDrive && e.currentTarget.src !== drive.openUrl) {
                                      e.currentTarget.style.display = 'none';
                                      const par = e.currentTarget.parentElement;
                                      if (par && !par.querySelector('.drive-fb')) {
                                        const fb = document.createElement('div');
                                        fb.className = 'drive-fb text-xs text-[#38bdf8] p-4 text-center font-mono';
                                        fb.innerHTML = '📄 Google Drive Screenshot<br/><span style="font-size:10px;color:#94a3b8">Click to view full preview</span>';
                                        par.appendChild(fb);
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic py-2">No payment screenshot attached.</p>
                          )}
                        </div>

                        {/* Roster column with player cards and ID Card previews */}
                        <div className="bg-[#FFFDF0] border-2 border-[#111827] p-3.5 space-y-2">
                          <div className="flex items-center justify-between border-b border-[#111827]/20 pb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#111827]/60">
                              SQUAD ROSTER ({roster.length} PLAYERS)
                            </span>
                            <span className="text-[10px] text-[#E5005A] font-bold">1st Member is Leader</span>
                          </div>

                          {roster.length === 0 ? (
                            <p className="text-xs text-gray-500 italic py-2">No roster data loaded.</p>
                          ) : (
                            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                              {roster.map((m: any, idx: number) => {
                                const isLeader = idx === 0;
                                const idDrive = getDriveInfo(m.idCardUrl);
                                return (
                                  <div
                                    key={idx}
                                    className={`p-2 border rounded-xs flex items-center justify-between gap-2 text-xs ${
                                      isLeader
                                        ? 'bg-[#E5005A]/10 border-[#E5005A]'
                                        : 'bg-[#F7E8B5]/40 border-[#111827]/20'
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold truncate text-[#111827]">{m.fullName || m.name}</span>
                                        {isLeader && (
                                          <span className="text-[9px] font-pixel bg-[#E5005A] text-white px-1 py-0.2 shrink-0">
                                            LEADER
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-gray-600 truncate">
                                        {m.studentId} · {m.branch} · {m.college || 'SFIT'}
                                      </p>
                                    </div>

                                    {/* ID Card preview thumbnail */}
                                    <div className="shrink-0 flex items-center gap-1.5">
                                      {m.idCardUrl ? (
                                        <button
                                          type="button"
                                          onClick={() => setPreviewModal({
                                            url: m.idCardUrl,
                                            title: `College ID Card - ${m.fullName || m.name}`,
                                            subtitle: `${m.studentId} · ${m.college || 'SFIT'}`
                                          })}
                                          className="flex items-center gap-1 bg-[#111827] hover:bg-[#00AFC6] text-white text-[10px] font-arcade px-2 py-1 border border-[#111827] shadow-[1px_1px_0_0_#000] cursor-pointer"
                                          title="Click to preview College ID Card"
                                        >
                                          <Eye className="w-3 h-3 text-[#38bdf8]" /> ID CARD
                                        </button>
                                      ) : (
                                        <span className="text-[9px] text-gray-400 font-mono">No ID</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. STUDENTS ROSTER TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="bg-[#FFFDF0] border-3 border-[#111827] p-4 shadow-[3px_3px_0_0_#111827] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-arcade text-sm font-bold text-[#111827]">
                PARTICIPANTS &amp; STUDENTS ROSTER ({students.length} REGISTERED)
              </h3>
              <p className="text-xs font-body text-gray-600">
                Complete student records across SFIT and external colleges with uploaded ID cards.
              </p>
            </div>
            <a
              href={getExportUrl('/api/admin/export/students')}
              onClick={(e) => handleDownloadExport(e, '/api/admin/export/students', 'DECEPTION_2026_STUDENTS_LIST.xlsx')}
              download="DECEPTION_2026_STUDENTS_LIST.xlsx"
              className="bg-[#F4C430] text-[#111827] font-arcade text-xs px-4 py-2 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] hover:bg-white transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0 cursor-pointer"
            >
              {downloadingExport === '/api/admin/export/students' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              {downloadingExport === '/api/admin/export/students' ? 'DOWNLOADING...' : 'EXPORT STUDENTS & ID CARDS (.XLSX)'}
            </a>
          </div>

          <div className="bg-[#FFFDF0] border-3 border-[#111827] shadow-[4px_4px_0_0_#111827] overflow-x-auto">
            <table className="w-full text-left text-xs font-body border-collapse">
              <thead>
                <tr className="bg-[#111827] text-white font-arcade">
                  <th className="p-3">Student ID</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Institute / College</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Mobile</th>
                  <th className="p-3">Branch/Year</th>
                  <th className="p-3">College ID Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111827]">
                {students.map((st) => {
                  const isSfit = st.collegeType === 'SFIT' || st.isSfit !== false || st.college === 'SFIT';
                  return (
                    <tr key={st.studentId || st._id} className="hover:bg-[#F7E8B5]/50">
                      <td className="p-3 font-mono font-bold text-[#111827]">{st.studentId}</td>
                      <td className="p-3 font-bold">
                        {st.fullName}
                        {st.participantType === 'LEADER' && (
                          <span className="ml-2 bg-[#E5005A] text-white text-[9px] font-pixel px-1.5 py-0.5 border border-[#111827]">
                            LEADER
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {isSfit ? (
                          <span className="bg-[#F4C430] text-[#111827] px-2 py-0.5 font-arcade text-[10px] border border-[#111827] font-bold">
                            SFIT
                          </span>
                        ) : (
                          <span className="bg-[#00AFC6] text-[#111827] px-2 py-0.5 font-arcade text-[10px] border border-[#111827] font-bold" title={st.college}>
                            NON-SFIT: {st.college || 'Other'}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-[#00AFC6]">{st.email}</td>
                      <td className="p-3 font-mono">{st.mobile}</td>
                      <td className="p-3">{st.branch} • {st.year}</td>
                      <td className="p-3">
                        {st.idCardUrl ? (
                          <div className="flex items-center gap-2">
                            <div
                              onClick={() => setPreviewModal({
                                url: st.idCardUrl,
                                title: `COLLEGE ID CARD - ${st.fullName}`,
                                subtitle: `${st.studentId} · ${st.college || 'SFIT'} · ${st.branch}`
                              })}
                              className="w-12 h-9 border border-[#111827] bg-[#111827]/10 rounded-xs overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#E5005A] shrink-0 flex items-center justify-center shadow-[1px_1px_0_0_#111827]"
                              title="Click to preview College ID Card"
                            >
                              <img
                                src={getDriveInfo(st.idCardUrl).isDrive ? getDriveInfo(st.idCardUrl).thumbUrl : st.idCardUrl}
                                alt="ID Card"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => setPreviewModal({
                                  url: st.idCardUrl,
                                  title: `COLLEGE ID CARD - ${st.fullName}`,
                                  subtitle: `${st.studentId} · ${st.college || 'SFIT'} · ${st.branch}`
                                })}
                                className="inline-flex items-center gap-1 bg-[#111827] hover:bg-[#E5005A] text-white font-arcade text-[10px] px-2 py-0.5 border border-[#111827] cursor-pointer shadow-[1px_1px_0_0_#000]"
                              >
                                <Eye className="w-3 h-3 text-[#38bdf8]" /> PREVIEW
                              </button>
                              <a
                                href={getDriveInfo(st.idCardUrl).openUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[9px] text-[#00AFC6] font-mono hover:underline flex items-center gap-0.5"
                              >
                                <ExternalLink className="w-2.5 h-2.5" /> Full Tab
                              </a>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#E5005A] font-pixel text-[10px]">PENDING</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. AUDIT TRAIL TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-[#FFFDF0] border-3 border-[#111827] p-4 shadow-[3px_3px_0_0_#111827]">
            <h3 className="font-arcade text-sm font-bold text-[#111827]">
              SYSTEM AUDIT TRAIL
            </h3>
            <p className="text-xs font-body text-gray-600">
              Immutable activity log recording registrations, payments, and admin actions.
            </p>
          </div>

          <div className="bg-[#FFFDF0] border-3 border-[#111827] shadow-[4px_4px_0_0_#111827] divide-y divide-[#111827]">
            {auditLogs.map((log, idx) => (
              <div key={idx} className="p-4 flex items-start gap-4 hover:bg-[#F7E8B5]/40 text-xs font-body">
                <span className="font-pixel text-[10px] bg-[#111827] text-white px-2 py-0.5 shrink-0">
                  {log.action}
                </span>
                <div className="flex-1 space-y-0.5">
                  <div className="font-bold text-[#111827]">
                    Target: {log.entity} ({log.entityId})
                  </div>
                  <div className="text-gray-600 font-mono text-[11px]">
                    {log.actor} · {JSON.stringify(log.metadata)}
                  </div>
                </div>
                <div className="text-gray-500 font-mono text-[10px] shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 6. EMAIL DISPATCHES TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'emails' && (
        <div className="space-y-4">
          <div className="bg-[#FFFDF0] border-3 border-[#111827] p-4 shadow-[3px_3px_0_0_#111827]">
            <h3 className="font-arcade text-sm font-bold text-[#111827]">
              IN-APP EMAIL DISPATCH REPOSITORY
            </h3>
            <p className="text-xs font-body text-gray-600">
              View all confirmation notices and QR pass tickets dispatched to team leaders.
            </p>
          </div>

          <div className="space-y-3">
            {emailLogs.map((eLog) => (
              <div key={eLog.id} className="bg-[#FFFDF0] border-3 border-[#111827] shadow-[3px_3px_0_0_#111827] p-4 space-y-2 text-xs font-body">
                <div className="flex items-center justify-between border-b border-[#111827] pb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#E5005A]" />
                    <span className="font-bold font-arcade">{eLog.subject}</span>
                  </div>
                  <span className="font-mono text-[10px] text-gray-500">
                    {new Date(eLog.sentAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-gray-600 font-mono text-[11px]">
                  <strong>To:</strong> {eLog.to} • <strong>Status:</strong> {eLog.status}
                </div>
                <div className="p-3 bg-[#F7E8B5]/50 border border-[#111827] font-mono text-[11px] whitespace-pre-wrap">
                  {eLog.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* REGISTRATION DETAIL MODAL */}
      {/* ---------------      {/* Universal Image & Document Zoom Modal */}
      {previewModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs"
          onClick={() => setPreviewModal(null)}
        >
          <div
            className="bg-[#0f172a] border-4 border-[#111827] shadow-[8px_8px_0_0_#000] max-w-2xl w-full text-white overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-[#111827] border-b-2 border-[#1e293b]">
              <div>
                <span className="font-pixel text-xs text-[#38bdf8] block">{previewModal.title}</span>
                {previewModal.subtitle && (
                  <span className="text-[11px] font-mono text-gray-400">{previewModal.subtitle}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getDriveInfo(previewModal.url).openUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 text-[#f1f5f9] px-2.5 py-1 transition-colors border border-white/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open original
                </a>
                <button
                  onClick={() => setPreviewModal(null)}
                  className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-[#E5005A] text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-3 max-h-[78vh] overflow-auto bg-[#020617] flex items-center justify-center">
              {getDriveInfo(previewModal.url).isDrive ? (
                <div className="w-full flex flex-col items-center gap-2">
                  <iframe
                    src={getDriveInfo(previewModal.url).previewUrl}
                    className="w-full h-[65vh] border-0 rounded-xs bg-[#0f172a]"
                    title={previewModal.title}
                    allow="autoplay"
                  />
                  <a
                    href={getDriveInfo(previewModal.url).openUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-arcade text-[#38bdf8] hover:underline flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="w-3 h-3" /> Can't see the preview? Open in Google Drive
                  </a>
                </div>
              ) : (
                <img
                  src={previewModal.url}
                  alt={previewModal.title}
                  className="max-w-full h-auto object-contain rounded-xs"
                  style={{ maxHeight: '70vh' }}
                  onError={(e) => {
                    const d = getDriveInfo(previewModal.url);
                    if (d.openUrl && e.currentTarget.src !== d.thumbUrl) {
                      e.currentTarget.src = d.thumbUrl;
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Registration detail modal */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 bg-[#111827]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF0] border-4 border-[#111827] shadow-[8px_8px_0_0_#000] max-w-3xl w-full max-h-[90vh] overflow-y-auto text-xs font-body">

            {/* Modal header */}
            <div className="flex items-center justify-between border-b-2 border-[#111827] px-6 py-4 sticky top-0 bg-[#111827] z-10">
              <div>
                <span className="font-pixel text-[9px] text-[#E5005A]">TEAM DETAILS</span>
                <h3 className="font-pixel text-base text-white">
                  {selectedReg.registrationId} · {selectedReg.teamName}
                </h3>
              </div>
              <button onClick={() => setSelectedReg(null)}
                className="p-1.5 border-2 border-white/30 bg-white/10 hover:bg-[#E5005A] cursor-pointer">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Leader info + payment status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#F7E8B5] border-2 border-[#111827] p-4 space-y-1.5">
                  <p className="font-arcade text-[10px] font-bold text-[#111827]/50 mb-2">TEAM LEADER</p>
                  <p className="font-bold text-sm text-[#111827]">{selectedReg.leaderName}</p>
                  <p className="font-mono text-[11px] text-[#111827]/70">{selectedReg.contactEmail}</p>
                  {selectedReg.contactMobile && (
                    <p className="font-mono text-[11px] text-[#111827]/70">{selectedReg.contactMobile}</p>
                  )}
                  <p className="text-[11px] text-[#111827]/60 mt-1">Team size: {selectedReg.teamSize || 5} players</p>
                </div>
                <div className="bg-[#F7E8B5] border-2 border-[#111827] p-4 space-y-2">
                  <p className="font-arcade text-[10px] font-bold text-[#111827]/50 mb-2">PAYMENT STATUS</p>
                  {selectedRegPayment ? (
                    <>
                      {(() => {
                        const { label, color, bg } = getPaymentLabel(selectedRegPayment);
                        return (
                          <span className="inline-block px-3 py-1 font-pixel text-xs border-2 font-bold"
                            style={{ color, borderColor: color, backgroundColor: bg }}>
                            {label}
                          </span>
                        );
                      })()}
                      <p className="text-[11px] text-[#111827]"><strong>Amount:</strong> ₹{Number(selectedRegPayment.amountExpected || selectedRegPayment.amount).toLocaleString('en-IN')}</p>
                      <p className="text-[11px] text-[#111827]"><strong>Method:</strong> {selectedRegPayment.method || 'UPI'}</p>
                      {selectedRegPayment.verifiedAt && (
                        <p className="text-[11px] text-[#16a34a] font-bold">
                          Approved {new Date(selectedRegPayment.verifiedAt).toLocaleString('en-IN')}
                        </p>
                      )}
                      {selectedRegPayment.ticketNumber && (
                        <p className="text-[11px] flex items-center gap-1 text-[#16a34a] font-bold">
                          <Ticket className="w-3 h-3" /> {selectedRegPayment.ticketNumber}
                        </p>
                      )}
                    </>
                  ) : (
                    <span className="inline-block px-3 py-1 font-pixel text-xs border-2 font-bold"
                      style={{ color: '#92400e', borderColor: '#d97706', backgroundColor: '#fef3c7' }}>
                      NO PAYMENT YET
                    </span>
                  )}
                </div>
              </div>

              {/* Payment evidence: UTR + screenshot (Fixed high contrast, fully readable and copyable) */}
              {selectedRegPayment && (
                <div>
                  <h4 className="font-arcade text-[10px] font-bold text-[#111827] mb-3">PAYMENT EVIDENCE</h4>
                  <div className="border-2 border-[#111827] bg-[#0f172a] text-[#f1f5f9] p-4 space-y-4 rounded-xs shadow-[2px_2px_0_0_#111827]">
                    {/* UTR from entries or top-level */}
                    {(() => {
                      const entries: any[] = selectedRegPayment.entries || [];
                      const topUTR = selectedRegPayment.transactionReference;
                      const topImg = selectedRegPayment.evidence?.url || selectedReg.paymentEvidence;

                      if (entries.length > 0) return entries.map((e: any, i: number) => {
                        const entryImg = e.evidence?.url || topImg;
                        const entryDrive = getDriveInfo(entryImg);
                        return (
                          <div key={i} className="space-y-3 border-b border-[#1e293b] pb-3 last:border-b-0 last:pb-0">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-[#94a3b8]">
                                  UTR / Transaction Reference {entries.length > 1 ? `#${i + 1}` : ''}
                                </p>
                                {copiedUTR && <span className="text-[10px] font-bold text-[#4ade80]">✓ Copied!</span>}
                              </div>
                              <div className="bg-[#020617] border border-[#334155] p-2.5 rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className="font-mono text-sm sm:text-base font-bold text-[#38bdf8] select-all break-all tracking-wider">
                                  {e.transactionReference || '—'}
                                </span>
                                {e.transactionReference && (
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(e.transactionReference)}
                                    className="px-3 py-1.5 bg-[#38bdf8]/15 hover:bg-[#38bdf8] text-[#38bdf8] hover:text-[#020617] border border-[#38bdf8]/40 font-arcade text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                                  >
                                    {copiedUTR ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copiedUTR ? 'COPIED!' : 'COPY UTR'}
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-300">
                              <span><strong>Amount:</strong> ₹{Number(e.amount).toLocaleString('en-IN')}</span>
                              {e.payerName && <span><strong>Payer:</strong> {e.payerName}</span>}
                            </div>
                            {entryImg && (
                              <div className="border border-[#334155] bg-[#020617] rounded-xs overflow-hidden">
                                <div className="flex items-center justify-between px-3 py-1.5 bg-[#111827] border-b border-[#1e293b]">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1">
                                    <ImageIcon className="w-3 h-3 text-[#38bdf8]" /> UPI Screenshot
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewModal({
                                        url: entryImg,
                                        title: `UPI Payment Proof - ${selectedReg.teamName}`,
                                        subtitle: `UTR: ${e.transactionReference || 'N/A'}`
                                      })}
                                      className="text-[10px] flex items-center gap-1 text-[#38bdf8] hover:text-white font-bold cursor-pointer"
                                    >
                                      <ZoomIn className="w-3 h-3" /> View full
                                    </button>
                                    <a
                                      href={entryDrive.openUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] flex items-center gap-1 text-gray-400 hover:text-white"
                                    >
                                      <ExternalLink className="w-3 h-3" /> Tab
                                    </a>
                                  </div>
                                </div>
                                <div
                                  className="p-2 cursor-pointer bg-[#020617] flex items-center justify-center hover:opacity-90 max-h-52 overflow-hidden"
                                  onClick={() => setPreviewModal({
                                    url: entryImg,
                                    title: `UPI Payment Proof - ${selectedReg.teamName}`,
                                    subtitle: `UTR: ${e.transactionReference || 'N/A'}`
                                  })}
                                >
                                  <img
                                    src={entryDrive.isDrive ? entryDrive.thumbUrl : entryImg}
                                    alt="UPI screenshot"
                                    className="max-h-48 w-auto object-contain rounded-xs"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      });

                      const topDrive = getDriveInfo(topImg);
                      return (
                        <>
                          {topUTR && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-[#94a3b8]">
                                  UTR / Transaction Reference
                                </p>
                                {copiedUTR && <span className="text-[10px] font-bold text-[#4ade80]">✓ Copied!</span>}
                              </div>
                              <div className="bg-[#020617] border border-[#334155] p-2.5 rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className="font-mono text-sm sm:text-base font-bold text-[#38bdf8] select-all break-all tracking-wider">
                                  {topUTR}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(topUTR)}
                                  className="px-3 py-1.5 bg-[#38bdf8]/15 hover:bg-[#38bdf8] text-[#38bdf8] hover:text-[#020617] border border-[#38bdf8]/40 font-arcade text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                                >
                                  {copiedUTR ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                  {copiedUTR ? 'COPIED!' : 'COPY UTR'}
                                </button>
                              </div>
                            </div>
                          )}
                          {topImg && (
                            <div className="border border-[#334155] bg-[#020617] rounded-xs overflow-hidden">
                              <div className="flex items-center justify-between px-3 py-1.5 bg-[#111827] border-b border-[#1e293b]">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1">
                                  <ImageIcon className="w-3 h-3 text-[#38bdf8]" /> UPI Screenshot
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewModal({
                                      url: topImg,
                                      title: `UPI Payment Proof - ${selectedReg.teamName}`,
                                      subtitle: `UTR: ${topUTR || 'N/A'}`
                                    })}
                                    className="text-[10px] flex items-center gap-1 text-[#38bdf8] hover:text-white font-bold cursor-pointer"
                                  >
                                    <ZoomIn className="w-3 h-3" /> View full
                                  </button>
                                  <a
                                    href={topDrive.openUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] flex items-center gap-1 text-gray-400 hover:text-white"
                                  >
                                    <ExternalLink className="w-3 h-3" /> Tab
                                  </a>
                                </div>
                              </div>
                              <div
                                className="p-2 cursor-pointer bg-[#020617] flex items-center justify-center hover:opacity-90 max-h-52 overflow-hidden"
                                onClick={() => setPreviewModal({
                                  url: topImg,
                                  title: `UPI Payment Proof - ${selectedReg.teamName}`,
                                  subtitle: `UTR: ${topUTR || 'N/A'}`
                                })}
                              >
                                <img
                                  src={topDrive.isDrive ? topDrive.thumbUrl : topImg}
                                  alt="UPI screenshot"
                                  className="max-h-48 w-auto object-contain rounded-xs"
                                />
                              </div>
                            </div>
                          )}
                          {!topUTR && !topImg && (
                            <p className="text-xs text-gray-400 italic">No payment evidence submitted yet.</p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Team roster with member ID Card preview thumbnails */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-arcade text-[10px] font-bold text-[#111827]">SQUAD ROSTER &amp; COLLEGE ID CARDS</h4>
                  <span className="text-[10px] text-[#E5005A] font-bold">1st Member is Leader</span>
                </div>
                {(() => {
                  const members: any[] = selectedRegPayment?.roster || selectedReg.players || [];
                  if (members.length === 0) {
                    return <p className="text-xs text-[#111827]/40 italic">No roster data available.</p>;
                  }
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {members.map((m: any, i: number) => {
                        const isLeader = i === 0;
                        const idDrive = getDriveInfo(m.idCardUrl);
                        return (
                          <div
                            key={i}
                            className={`p-3 border-2 rounded-xs flex flex-col justify-between gap-2.5 ${
                              isLeader
                                ? 'border-[#E5005A] bg-[#FFFDF0] shadow-[2px_2px_0_0_#E5005A]'
                                : 'border-[#111827] bg-[#FFFDF0] shadow-[2px_2px_0_0_#111827]'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold border ${
                                  isLeader
                                    ? 'bg-[#E5005A] text-white border-[#111827]'
                                    : 'bg-[#111827] text-white border-[#111827]'
                                }`}
                              >
                                {(m.fullName || m.name || '?').charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-sm text-[#111827]">{m.fullName || m.name}</span>
                                  {isLeader && (
                                    <span className="text-[9px] font-pixel bg-[#E5005A] text-white px-1.5 py-0.5 border border-[#111827]">
                                      LEADER
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-700 font-mono mt-0.5">
                                  {m.studentId} · {m.branch} · {m.year}
                                </p>
                                <p className="text-[11px] text-gray-600 truncate">{m.college || m.collegeName || 'SFIT'}</p>
                                <p className="text-[11px] text-[#00AFC6] font-mono truncate">{m.email}</p>
                              </div>
                            </div>

                            {/* ID Card preview strip */}
                            <div className="pt-2 border-t border-[#111827]/15 flex items-center justify-between gap-2">
                              {m.idCardUrl ? (
                                <>
                                  <div
                                    onClick={() => setPreviewModal({
                                      url: m.idCardUrl,
                                      title: `College ID Card - ${m.fullName || m.name}`,
                                      subtitle: `${m.studentId} · ${m.college || 'SFIT'}`
                                    })}
                                    className="w-14 h-9 border border-[#111827] bg-[#111827]/10 rounded-xs overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#E5005A] shrink-0 flex items-center justify-center shadow-[1px_1px_0_0_#111827]"
                                    title="Click to preview College ID Card"
                                  >
                                    <img
                                      src={idDrive.isDrive ? idDrive.thumbUrl : m.idCardUrl}
                                      alt="ID Card preview"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewModal({
                                        url: m.idCardUrl,
                                        title: `College ID Card - ${m.fullName || m.name}`,
                                        subtitle: `${m.studentId} · ${m.college || 'SFIT'}`
                                      })}
                                      className="inline-flex items-center gap-1 bg-[#111827] hover:bg-[#E5005A] text-white text-[10px] font-arcade px-2.5 py-1 border border-[#111827] shadow-[1px_1px_0_0_#000] cursor-pointer"
                                    >
                                      <Eye className="w-3 h-3 text-[#38bdf8]" /> PREVIEW ID
                                    </button>
                                    <a
                                      href={idDrive.openUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] text-[#00AFC6] hover:underline flex items-center gap-0.5"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                </>
                              ) : (
                                <span className="text-[10px] text-amber-600 font-bold font-arcade">ID Card: Pending Upload</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReg(null)}
                  className="bg-[#111827] text-white font-arcade text-xs px-6 py-2.5 border-2 border-[#111827] hover:bg-[#E5005A] transition-colors cursor-pointer"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ---------------------------------------------------- */}
      {/* REJECT PAYMENT MODAL */}
      {/* ---------------------------------------------------- */}
      {rejectModalPayment && (
        <div className="fixed inset-0 z-50 bg-[#111827]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF0] border-4 border-[#111827] shadow-[8px_8px_0_0_#000] max-w-md w-full p-6 space-y-4 text-xs font-body">
            <h3 className="font-arcade text-base font-bold text-[#E5005A]">
              REJECT PAYMENT ({rejectModalPayment.registrationCode || rejectModalPayment.paymentId})
            </h3>
            <p className="text-gray-700">
              Provide a reason for rejection. The squad leader will be alerted to re-submit or correct payment details.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. UTR number not found in bank statement, partial amount transferred..."
              rows={3}
              className="w-full p-3 bg-[#F7E8B5] border-2 border-[#111827] font-body text-xs focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalPayment(null)}
                className="px-4 py-2 border-2 border-[#111827] font-arcade text-xs"
              >
                CANCEL
              </button>
              <button
                onClick={handleRejectPayment}
                className="px-4 py-2 bg-[#E5005A] text-white font-arcade text-xs border-2 border-[#111827]"
              >
                CONFIRM REJECTION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
