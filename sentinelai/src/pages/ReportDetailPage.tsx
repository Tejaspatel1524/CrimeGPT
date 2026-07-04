import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Shield, Download, Printer, AlertTriangle,
  CheckCircle, User, Phone, Mail, DollarSign, Calendar,
  FileText, Lock, Loader2, ExternalLink,
} from 'lucide-react';
import api from '@/services/api';
import { formatINR, formatDate, formatDateTime } from '@/lib/formatters';

/* -- Types -- */
interface ReportDetail {
  id: string;
  title: string;
  type: string;
  status: string;
  caseId: string;
  createdBy: string;
  createdAt: string;
  pageCount: number;
  riskScore: number;
  riskLevel: string;
  victimName: string;
  victimPhone: string;
  victimEmail: string;
  caseTitle: string;
  fraudType: string;
  amountLost: number;
  casePriority: string;
  caseStatus: string;
  complaintText: string;
  reasons: string[];
  recommendedActions: string[];
}

const statusBadge: Record<string, string> = {
  Draft:       'bg-slate-500/10 text-[#98A2B3] border border-slate-500/20',
  'In Review': 'bg-[#FFB020]/10 text-[#FFB020] border border-amber-500/20',
  Approved:    'bg-[#00B8FF]/10 text-[#00B8FF] border border-cyan-500/20',
  Published:   'bg-[#00D084]/10 text-[#00D084] border border-emerald-500/20',
};

const riskColor = (score: number) =>
  score >= 75 ? 'text-[#FF4D6D]' : score >= 50 ? 'text-[#FFB020]' : 'text-[#00D084]';

const riskBg = (score: number) =>
  score >= 75
    ? 'from-red-950/40 to-red-900/20 border-red-900/30'
    : score >= 50
    ? 'from-amber-950/40 to-amber-900/20 border-amber-900/30'
    : 'from-emerald-950/40 to-emerald-900/20 border-emerald-900/30';

/* -- Download helper � generates a self-contained HTML file -- */
function downloadReportAsHtml(report: ReportDetail) {
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Investigation Report � ${report.caseId}</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; background:#f8fafc; color:#1e293b; margin:0; padding:32px; }
  .header { text-align:center; border-bottom:3px solid #1e40af; padding-bottom:24px; margin-bottom:32px; }
  .header h1 { margin:0; font-size:24px; color:#1e40af; }
  .header p  { margin:6px 0 0; color:#64748b; font-size:13px; }
  .badge { display:inline-block; padding:3px 10px; border-radius:4px; font-size:11px; font-weight:700; }
  .badge-red  { background:#fee2e2; color:#dc2626; }
  .badge-amber{ background:#fef3c7; color:#d97706; }
  .badge-blue { background:#dbeafe; color:#2563eb; }
  .badge-green{ background:#d1fae5; color:#059669; }
  .section { margin-bottom:28px; }
  .section-title { font-size:11px; font-weight:800; letter-spacing:.12em; text-transform:uppercase;
                   color:#2563eb; border-bottom:1px solid #e2e8f0; padding-bottom:6px; margin-bottom:14px; }
  .meta-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
  .meta-item { background:#f1f5f9; border-radius:6px; padding:10px 14px; }
  .meta-label{ font-size:10px; text-transform:uppercase; color:#64748b; }
  .meta-val  { font-size:14px; font-weight:600; margin-top:4px; }
  .risk-box  { background:#fef9ec; border:2px solid #f59e0b; border-radius:8px; padding:16px 20px; }
  .reason-li { margin:6px 0; font-size:13px; padding-left:16px; position:relative; }
  .reason-li::before { content:"�"; position:absolute; left:0; color:#ef4444; }
  .action-li { margin:6px 0; font-size:13px; padding-left:16px; position:relative; }
  .action-li::before { content:""; position:absolute; left:0; color:#059669; font-weight:700; }
  .complaint { background:#f8fafc; border-left:4px solid #3b82f6; padding:16px; font-size:13px;
               line-height:1.7; white-space:pre-wrap; border-radius:0 6px 6px 0; }
  .footer { margin-top:40px; text-align:center; font-size:11px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:16px; }
  .confidential { color:#dc2626; font-weight:800; letter-spacing:.1em; }
</style>
</head>
<body>
<div class="header">
  <div style="font-size:13px;font-weight:700;color:#1e40af;letter-spacing:.08em;margin-bottom:6px;">
     CRIMEGPT � CYBER CRIME INVESTIGATION PLATFORM
  </div>
  <h1>Cyber Crime Investigation Report</h1>
  <p>${report.caseId} &nbsp;|&nbsp; ${report.fraudType} &nbsp;|&nbsp; Generated: ${now}</p>
  <p class="confidential"> CONFIDENTIAL � FOR OFFICIAL USE ONLY</p>
</div>

<div class="section">
  <div class="section-title">�01 � Executive Summary</div>
  <p style="font-size:14px;line-height:1.7;">
    This report documents investigation <strong>${report.caseId}</strong>, classified as
    <strong>${report.fraudType}</strong> with <strong>${report.casePriority}</strong> priority.
    Victim <strong>${report.victimName}</strong> suffered a total financial loss of
    <strong>${formatINR(report.amountLost)}</strong>.
    Investigation status: <strong>${report.caseStatus}</strong>.
    AI Risk Score: <strong>${report.riskScore}/100 (${report.riskLevel})</strong>.
  </p>
</div>

<div class="section">
  <div class="section-title">�02 � Case & Victim Details</div>
  <div class="meta-grid">
    <div class="meta-item"><div class="meta-label">Victim Name</div><div class="meta-val">${report.victimName}</div></div>
    <div class="meta-item"><div class="meta-label">Contact</div><div class="meta-val">${report.victimPhone}</div></div>
    <div class="meta-item"><div class="meta-label">Email</div><div class="meta-val">${report.victimEmail}</div></div>
    <div class="meta-item"><div class="meta-label">Fraud Type</div><div class="meta-val">${report.fraudType}</div></div>
    <div class="meta-item"><div class="meta-label">Amount Lost</div><div class="meta-val" style="color:#dc2626;">${formatINR(report.amountLost)}</div></div>
    <div class="meta-item"><div class="meta-label">Date Registered</div><div class="meta-val">${formatDate(report.createdAt)}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">�03 � AI Risk Assessment</div>
  <div class="risk-box">
    <div style="font-size:32px;font-weight:900;color:${report.riskScore >= 75 ? '#dc2626' : report.riskScore >= 50 ? '#d97706' : '#059669'};">
      ${report.riskScore}<span style="font-size:16px;">/100</span>
    </div>
    <div style="font-weight:700;font-size:14px;margin-top:4px;">${report.riskLevel} Risk</div>
  </div>
  ${report.reasons.length > 0 ? `
  <div style="margin-top:14px;">
    <strong style="font-size:12px;text-transform:uppercase;color:#475569;">Risk Factors Detected</strong>
    <ul style="margin:8px 0;padding:0;list-style:none;">
      ${report.reasons.map(r => `<li class="reason-li">${r}</li>`).join('')}
    </ul>
  </div>` : ''}
</div>

<div class="section">
  <div class="section-title">�04 � Complaint Narrative</div>
  <div class="complaint">${report.complaintText}</div>
</div>

<div class="section">
  <div class="section-title">�05 � Recommended Actions</div>
  <ul style="margin:0;padding:0;list-style:none;">
    ${report.recommendedActions.map(a => `<li class="action-li">${a}</li>`).join('')}
  </ul>
</div>

<div class="footer">
  <p>Report ID: ${report.id} &nbsp;|&nbsp; Investigating Officer: ${report.createdBy}</p>
  <p class="confidential">This document is classified. Unauthorised disclosure is prohibited.</p>
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `Report_${report.caseId}_${report.id.slice(0, 8)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const normalizeReport = (data: any): ReportDetail => {
  if (!data) return data;
  const getSafeArray = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      if (val.trim().startsWith('[') && val.trim().endsWith(']')) {
        try {
          const formatted = val.replace(/'/g, '"');
          const parsedFormatted = JSON.parse(formatted);
          if (Array.isArray(parsedFormatted)) return parsedFormatted;
        } catch {}
      }
      return [val];
    }
    return [];
  };

  return {
    ...data,
    reasons: getSafeArray(data.reasons),
    recommendedActions: getSafeArray(data.recommendedActions || data.recommended_actions),
  };
};

/* -- Component -- */
export default function ReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const printRef = useRef<HTMLDivElement>(null);

  // Try to read data passed via router state (from Reports page View button).
  // Fall back to an API fetch only when navigated directly by URL.
  const stateReport = (location.state as { report?: ReportDetail } | null)?.report ?? null;
  const normalizedStateReport = stateReport ? normalizeReport(stateReport) : null;

  const [report,  setReport]  = useState<ReportDetail | null>(normalizedStateReport);
  const [loading, setLoading] = useState(!normalizedStateReport);   // no loading spinner if we have state
  const [error,   setError]   = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // If we already have data from router state, skip the network call.
    if (normalizedStateReport) return;
    if (!reportId) return;

    setLoading(true);
    api.get(`/reports/${reportId}`)
      .then((res) => setReport(normalizeReport(res.data)))
      .catch((err) => {
        const detail = (err as { response?: { data?: { detail?: string } } })
          ?.response?.data?.detail;
        setError(detail || 'Report not found or backend unavailable.');
      })
      .finally(() => setLoading(false));
  }, [reportId]); // eslint-disable-line react-hooks/exhaustive-deps



  const handleDownload = () => {
    if (!report) return;
    setDownloading(true);
    try {
      downloadReportAsHtml(report);
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  const handlePrint = () => window.print();

  /* -- Loading -- */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-5 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#00B8FF]/20 blur-xl" />
          <Loader2 className="w-10 h-10 text-[#00B8FF] animate-spin relative" />
        </div>
        <div className="space-y-3 w-72">
          <div className="h-4 rounded-lg animate-pulse" />
          <div className="h-3 rounded-lg animate-pulse w-3/4 mx-auto" />
        </div>
        <p className="text-sm text-[#98A2B3]">Loading investigation report�</p>
      </div>
    );
  }

  /* -- Error -- */
  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-lg bg-[#FF4D6D]/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-[#FF4D6D]" />
        </div>
        <p className="text-sm text-[#FF4D6D] font-medium">{error || 'Report not found.'}</p>
        <button
          onClick={() => navigate('/reports')}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-[#F8FAFC] text-sm font-medium rounded-lg shadow-lg shadow-cyan-500/10 transition-all"
        >
          ? Back to Reports
        </button>
      </div>
    );
  }

  const riskCls = riskColor(report.riskScore);
  const riskBgCls = riskBg(report.riskScore);

  return (
    <div className="space-y-6 animate-fade-in" ref={printRef}>

      {/* -- Top bar -- */}
      <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/reports')}
              className="p-2 rounded-lg text-[#98A2B3] hover:text-[#00B8FF] hover:bg-[#0B1220]/50 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-base font-semibold text-[#F8FAFC] leading-snug tracking-tight">{report.title}</h2>
              <p className="text-xs text-[#F8FAFC]0 mt-0.5">
                <span className="font-mono text-[#00B8FF]">{report.caseId.slice(0,8)}�</span>
                &nbsp;�&nbsp;{report.fraudType}&nbsp;�&nbsp;Generated {formatDate(report.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusBadge[report.status] || statusBadge.Draft}`}>
              {report.status}
            </span>
            <Link
              to={`/cases/${report.caseId}`}
              className="flex items-center gap-1.5 px-3 py-2 border border-[#223047] bg-[#0B1220]/50 hover:bg-white/[0.06] text-[#F8FAFC] text-sm rounded-lg transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View Case
            </Link>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 border border-[#223047] bg-[#0B1220]/50 hover:bg-white/[0.06] text-[#F8FAFC] text-sm rounded-lg transition-all"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-60 text-[#F8FAFC] text-sm font-medium rounded-lg shadow-lg shadow-cyan-500/10 transition-all"
            >
              {downloading
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Downloading�</>
                : <><Download className="w-3.5 h-3.5" /> Download HTML</>}
            </button>
          </div>
        </div>
      </div>

      {/* -- Report body -- */}
      <div className="bg-[#121B2A] border border-[#223047] rounded-lg overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#020340] to-[#061070] px-8 py-6 border-b border-[#223047] text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-[#00B8FF]" />
            <span className="text-sm font-bold text-[#00B8FF] tracking-widest uppercase">CrimeGPT</span>
          </div>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Cyber Crime Investigation Report</h2>
          <p className="text-sm text-[#98A2B3] mt-1 font-mono">
            <span className="text-[#00B8FF]">{report.caseId}</span> � {report.fraudType}
          </p>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-[#F8FAFC]0 flex-wrap">
            <span>Generated: {formatDateTime(report.createdAt)}</span>
            <span className="text-white/[0.08]">|</span>
            <span>By: {report.createdBy}</span>
            <span className="text-white/[0.08]">|</span>
            <span>{report.caseStatus}</span>
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Lock className="w-3 h-3 text-[#FFB020]" />
            <span className="text-xs text-[#FFB020] font-bold tracking-widest uppercase">Confidential � Official Use Only</span>
          </div>
        </div>

        <div className="p-8 space-y-8">

          {/* � 01 � Executive Summary */}
          <Section num="01" title="Executive Summary">
            <p className="text-sm text-[#F8FAFC] leading-relaxed">
              This report documents investigation{' '}
              <strong className="text-[#F8FAFC]">{report.caseId}</strong>, classified as{' '}
              <strong className="text-[#F8FAFC]">{report.fraudType}</strong> with{' '}
              <strong className="text-[#F8FAFC]">{report.casePriority}</strong> priority. Victim{' '}
              <strong className="text-[#F8FAFC]">{report.victimName}</strong> suffered a total financial
              loss of{' '}
              <strong className="text-[#FF4D6D]">{formatINR(report.amountLost)}</strong>.
              Investigation is currently{' '}
              <strong className="text-[#F8FAFC]">{report.caseStatus}</strong>.
              AI risk analysis scored this case at{' '}
              <strong className={riskCls}>{report.riskScore}/100 ({report.riskLevel})</strong>.
            </p>
          </Section>

          {/* � 02 � Victim & Case Details */}
          <Section num="02" title="Victim & Case Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { icon: User,     label: 'Victim Name',     val: report.victimName },
                { icon: Phone,    label: 'Contact',         val: report.victimPhone },
                { icon: Mail,     label: 'Email',           val: report.victimEmail },
                { icon: FileText, label: 'Fraud Type',      val: report.fraudType },
                { icon: DollarSign, label: 'Amount Lost',   val: formatINR(report.amountLost), cls: 'text-[#FF4D6D]' },
                { icon: Calendar, label: 'Date Registered', val: formatDate(report.createdAt) },
              ].map((item) => (
                <div key={item.label} className="bg-[#070B14] border border-[#223047] rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <item.icon className="w-3 h-3 text-[#F8FAFC]0" />
                    <p className="text-[10px] text-[#F8FAFC]0 uppercase tracking-wider font-medium">{item.label}</p>
                  </div>
                  <p className={`text-sm font-medium break-all ${item.cls || 'text-[#F8FAFC]'}`}>{item.val}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* � 03 � AI Risk Assessment */}
          <Section num="03" title="AI Risk Assessment">
            <div className={`bg-gradient-to-r ${riskBgCls} border rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6`}>
              <div className="text-center shrink-0">
                <p className={`text-5xl font-black ${riskCls}`}>{report.riskScore}</p>
                <p className="text-xs text-[#F8FAFC]0 mt-1">out of 100</p>
                <p className={`text-sm font-bold mt-1 ${riskCls}`}>{report.riskLevel} Risk</p>
              </div>
              {report.reasons.length > 0 && (
                <div className="flex-1">
                  <p className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-3">Risk Factors Detected</p>
                  <ul className="space-y-2">
                    {report.reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#F8FAFC]">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#FF4D6D] mt-0.5 shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {report.reasons.length === 0 && (
                <p className="text-sm text-[#F8FAFC]0 italic">No specific risk factors extracted from complaint text.</p>
              )}
            </div>
          </Section>

          {/* � 04 � Complaint Narrative */}
          <Section num="04" title="Complaint Narrative">
            <div className="bg-[#070B14] border border-[#223047] rounded-lg p-5">
              <p className="text-[#F8FAFC] leading-relaxed whitespace-pre-wrap font-mono text-[13px]">
                {report.complaintText}
              </p>
            </div>
          </Section>

          {/* � 05 � Recommended Actions */}
          <Section num="05" title="Recommended Actions">
            <ul className="space-y-3">
              {report.recommendedActions.map((action, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-[#00D084] mt-0.5 shrink-0" />
                  <span className="text-[#F8FAFC] leading-relaxed">{action}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* � 06 � Report Metadata */}
          <Section num="06" title="Report Metadata">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Report ID',      val: report.id.slice(0, 12) + '�' },
                { label: 'Case ID',        val: report.caseId.slice(0, 12) + '�' },
                { label: 'Generated By',   val: report.createdBy },
                { label: 'Generated At',   val: formatDateTime(report.createdAt) },
              ].map((m) => (
                <div key={m.label} className="bg-[#070B14] border border-[#223047] rounded-lg p-3">
                  <p className="text-[10px] text-[#F8FAFC]0 uppercase tracking-wider font-medium">{m.label}</p>
                  <p className="text-xs font-mono text-[#00B8FF] mt-1 break-all">{m.val}</p>
                </div>
              ))}
            </div>
          </Section>

        </div>
      </div>

      {/* -- Bottom action bar -- */}
      <div className="flex items-center justify-between bg-[#121B2A] border border-[#223047] rounded-lg p-4 print:hidden">
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-1.5 text-sm text-[#98A2B3] hover:text-[#00B8FF] transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Reports
        </button>
        <div className="flex items-center gap-2">
          <Link
            to={`/cases/${report.caseId}`}
            className="flex items-center gap-1.5 px-3 py-2 border border-[#223047] bg-[#0B1220]/50 hover:bg-white/[0.06] text-[#F8FAFC] text-sm rounded-lg transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open Case
          </Link>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-60 text-[#F8FAFC] text-sm font-medium rounded-lg shadow-lg shadow-cyan-500/10 transition-all"
          >
            {downloading
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Downloading�</>
              : <><Download className="w-3.5 h-3.5" /> Download Report</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -- Section wrapper component -- */
function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-bold text-[#00B8FF] font-mono">�{num}</span>
        <h3 className="text-xs font-bold text-[#00B8FF] uppercase tracking-[0.15em]">{title}</h3>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>
      {children}
    </div>
  );
}
