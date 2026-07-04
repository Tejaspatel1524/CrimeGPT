import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Download, FileText, Eye, Clock, User, File, BarChart3,
  BookOpen, ShieldCheck, CalendarDays, AlertTriangle, RefreshCw, Loader2,
  Sparkles, X, CheckCircle,
} from 'lucide-react';
import api from '@/services/api';
import { formatDate } from '@/lib/formatters';


/* ── Types ── */
interface Report {
  id: string;
  title: string;
  type: string;
  status: string;
  caseId?: string;
  caseNumber?: string;
  createdBy: string;
  createdAt: string;
  pageCount: number;
  riskScore?: number;
  riskLevel?: string;
  victimName?: string;
  caseTitle?: string;
}

const reportTypeIcon: Record<string, typeof FileText> = {
  'Investigation Summary': FileText,
  'Forensic Analysis':     ShieldCheck,
  'Intelligence Brief':    BarChart3,
  'Compliance Audit':      BookOpen,
  'Monthly Review':        CalendarDays,
};

const reportTypeColor: Record<string, string> = {
  'Investigation Summary': 'text-[#00B8FF] bg-[#00B8FF]/10',
  'Forensic Analysis':     'text-cyan-300 bg-[#0077B6]/15',
  'Intelligence Brief':    'text-[#00B8FF] bg-[#00B8FF]/10',
  'Compliance Audit':      'text-[#FFB020] bg-[#FFB020]/15',
  'Monthly Review':        'text-[#00D084] bg-[#00D084]/15',
};

const statusBadge: Record<string, string> = {
  Draft:      'bg-slate-500/15 text-[#98A2B3] border border-slate-500/30',
  'In Review':'bg-[#FFB020]/15 text-[#FFB020] border border-amber-500/30',
  Approved:   'bg-[#00B8FF]/10 text-[#00B8FF] border border-cyan-500/20',
  Published:  'bg-[#00D084]/15 text-[#00D084] border border-emerald-500/30',
};

const allStatuses = ['Draft', 'In Review', 'Approved', 'Published'];

function SkeletonCard() {
  return (
    <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-5 space-y-3 animate-pulse">
      <div className="flex gap-3">
        <div className="w-10 h-10 bg-[#0B1220] rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[#0B1220] rounded w-3/4" />
          <div className="h-3 bg-[#0B1220] rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-[#0B1220] rounded w-full" />
        <div className="h-3 bg-[#0B1220] rounded w-2/3" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 bg-[#0B1220] rounded flex-1" />
        <div className="h-8 bg-[#0B1220] rounded flex-1" />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const [reports,       setReports]       = useState<Report[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // ── Generate Report modal state ──────────────────────────────────────────────
  const [showModal,      setShowModal]      = useState(false);
  const [cases,          setCases]          = useState<{case_id:string;case_number?:string;title:string;fraud_type:string;victim_name:string}[]>([]);
  const [casesLoading,   setCasesLoading]   = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [generating,     setGenerating]     = useState(false);
  const [genError,       setGenError]       = useState('');
  const [genSuccess,     setGenSuccess]     = useState('');

  const openGenerateModal = async () => {
    setShowModal(true);
    setSelectedCaseId('');
    setGenError('');
    setGenSuccess('');
    setCasesLoading(true);
    try {
      const res = await api.get('/cases');
      setCases(Array.isArray(res.data) ? res.data : []);
    } catch {
      setGenError('Failed to load cases. Make sure the backend is running.');
    } finally {
      setCasesLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedCaseId) { setGenError('Please select a case.'); return; }
    setGenerating(true);
    setGenError('');
    setGenSuccess('');
    try {
      await api.post(`/report/generate/${selectedCaseId}`);
      setGenSuccess('Report generated successfully!');
      // Refresh the reports list
      fetchReports();
      // Auto-close modal after 1.5 s
      setTimeout(() => setShowModal(false), 1500);
    } catch (err: unknown) {
      const detail = (err as {response?:{data?:{detail?:string}}})?.response?.data?.detail;
      setGenError(detail || 'Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };


  const fetchReports = () => {
    setLoading(true);
    setError('');
    api.get('/reports')
      .then((res) => setReports(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('Failed to load reports. Ensure the backend is running.'))
      .finally(() => setLoading(false));
  };

  const handleDownload = async (reportId: string) => {
    setDownloadingId(reportId);
    try {
      const res = await api.get(`/reports/${reportId}`);
      const rawReport = res.data;
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
      const report = {
        ...rawReport,
        reasons: getSafeArray(rawReport.reasons),
        recommendedActions: getSafeArray(rawReport.recommendedActions || rawReport.recommended_actions),
      };
      const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      const caseDisplayId = report.caseNumber || report.caseId;
      const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Investigation Report — ${caseDisplayId}</title>
<style>
  body{font-family:'Segoe UI',sans-serif;background:#f8fafc;color:#1e293b;margin:0;padding:32px;}
  .hdr{text-align:center;border-bottom:3px solid #1e40af;padding-bottom:24px;margin-bottom:32px;}
  h1{margin:0;font-size:24px;color:#1e40af;} p{margin:6px 0 0;color:#64748b;font-size:13px;}
  .sec{margin-bottom:28px;} .stitle{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#2563eb;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:14px;}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
  .card{background:#f1f5f9;border-radius:6px;padding:10px 14px;}
  .lbl{font-size:10px;text-transform:uppercase;color:#64748b;} .val{font-size:14px;font-weight:600;margin-top:4px;}
  .complaint{background:#f8fafc;border-left:4px solid #3b82f6;padding:16px;font-size:13px;line-height:1.7;white-space:pre-wrap;border-radius:0 6px 6px 0;}
  li{margin:6px 0;font-size:13px;}
  .footer{margin-top:40px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px;}
  .conf{color:#dc2626;font-weight:800;letter-spacing:.1em;}
</style></head><body>
<div class="hdr"><div style="font-size:13px;font-weight:700;color:#1e40af;letter-spacing:.08em;margin-bottom:6px;"> CRIMEGPT</div>
<h1>Cyber Crime Investigation Report</h1><p>${caseDisplayId} | ${report.fraudType} | Generated: ${now}</p>
<p class="conf"> CONFIDENTIAL — FOR OFFICIAL USE ONLY</p></div>
<div class="sec"><div class="stitle">§01 — Executive Summary</div>
<p style="font-size:14px;line-height:1.7;">Case <strong>${caseDisplayId}</strong> — <strong>${report.fraudType}</strong>, ${report.casePriority} priority. Victim: <strong>${report.victimName}</strong>. Loss: <strong style="color:#dc2626;">${report.amountLost?.toLocaleString('en-IN', {style:'currency',currency:'INR'})}</strong>. Risk Score: <strong>${report.riskScore}/100 (${report.riskLevel})</strong>. Status: ${report.caseStatus}.</p></div>
<div class="sec"><div class="stitle">§02 — Victim Details</div>
<div class="grid">
<div class="card"><div class="lbl">Name</div><div class="val">${report.victimName}</div></div>
<div class="card"><div class="lbl">Phone</div><div class="val">${report.victimPhone}</div></div>
<div class="card"><div class="lbl">Email</div><div class="val">${report.victimEmail}</div></div>
<div class="card"><div class="lbl">Fraud Type</div><div class="val">${report.fraudType}</div></div>
<div class="card"><div class="lbl">Amount Lost</div><div class="val" style="color:#dc2626;">${report.amountLost?.toLocaleString('en-IN',{style:'currency',currency:'INR'})}</div></div>
</div></div>
<div class="sec"><div class="stitle">§03 — Risk Factors</div>
<ul>${(report.reasons||[]).map((r: string)=>`<li> ${r}</li>`).join('')}</ul></div>
<div class="sec"><div class="stitle">§04 — Complaint Narrative</div>
<div class="complaint">${report.complaintText}</div></div>
<div class="sec"><div class="stitle">§05 — Recommended Actions</div>
<ul>${(report.recommendedActions||[]).map((a: string)=>`<li> ${a}</li>`).join('')}</ul></div>
<div class="footer"><p>Report ID: ${report.id}</p><p class="conf">Unauthorised disclosure prohibited.</p></div>
</body></html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `Report_${caseDisplayId}_${reportId.slice(0,8)}.html`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download report. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const filtered = useMemo(() => {
    let result = [...reports];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          (r.caseId || '').toLowerCase().includes(q) ||
          (r.victimName || '').toLowerCase().includes(q)
      );
    }
    if (filterStatus) result = result.filter((r) => r.status === filterStatus);
    return result;
  }, [reports, searchQuery, filterStatus]);

  const selectClasses =
    'bg-[#070B14] border border-[#223047] text-[#F8FAFC] rounded-lg text-sm px-3 py-2 focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#F8FAFC]">Reports</h2>
          <p className="text-sm text-[#F8FAFC]0">
            {loading ? 'Loading…' : `${filtered.length} investigation report${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchReports}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 border border-[#223047] text-[#F8FAFC] text-sm rounded-lg hover:bg-[#0B1220]/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(reports, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'CrimeGPT_Reports_Export.json';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            disabled={reports.length === 0}
            className="hidden sm:flex items-center gap-2 px-3 py-2 border border-[#223047] text-[#F8FAFC] text-sm rounded-lg hover:bg-[#0B1220]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            Export All
          </button>
          <button
            onClick={openGenerateModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-[#F8FAFC] text-sm font-medium rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Generate Report</span>
            <span className="sm:hidden">Generate</span>
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F8FAFC]0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, case ID, victim name…"
            className="w-full pl-10 pr-4 py-2 bg-[#070B14] border border-[#223047] rounded-lg text-sm text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectClasses}>
          <option value="">All Status</option>
          {allStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-[#FF4D6D]/10 border border-red-500/20 rounded-lg text-sm text-[#FF4D6D]">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={fetchReports} className="ml-auto underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* ── Report Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : filtered.map((report) => {
              const Icon      = reportTypeIcon[report.type] || File;
              const iconColor = reportTypeColor[report.type] || 'text-[#98A2B3] bg-slate-500/15';
              const [iconCls, bgCls] = iconColor.split(' ');
              return (
                <div
                  key={report.id}
                  className="bg-[#121B2A] border border-[#223047] rounded-lg p-5 hover:border-[#223047] transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${bgCls} shrink-0`}>
                      <Icon className={`w-4 h-4 ${iconCls}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-[#F8FAFC] leading-snug">{report.title}</h4>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusBadge[report.status] || statusBadge.Draft}`}>
                          {report.status}
                        </span>
                        <span className="text-[10px] text-[#F8FAFC]0">{report.type}</span>
                        {report.riskScore !== undefined && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            report.riskScore >= 75 ? 'bg-[#FF4D6D]/15 text-[#FF4D6D]' :
                            report.riskScore >= 50 ? 'bg-[#FFB020]/15 text-[#FFB020]' :
                                                     'bg-[#00D084]/15 text-[#00D084]'
                          }`}>
                            Risk: {report.riskScore}/100
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-4 text-xs text-[#F8FAFC]0">
                    {report.caseId && (
                      <div className="flex items-center gap-1.5">
                        <File className="w-3 h-3" />
                        <span>Case: <span className="text-[#00B8FF] font-mono">{report.caseNumber || report.caseId?.slice(0, 8) || '—'}</span></span>
                      </div>
                    )}
                    {report.victimName && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3" />
                        <span>Victim: {report.victimName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3" />
                      <span>{report.createdBy}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(report.createdAt)}</span>
                      <span>•</span>
                      <span>{report.pageCount} pages</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/reports/${report.id}`, { state: { report } })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-[#00B8FF] border border-[#223047] rounded-lg hover:bg-[#29C5FF]/10 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(report.id)}
                      disabled={downloadingId === report.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-[#F8FAFC] border border-[#223047] rounded-lg hover:bg-[#0B1220]/50 transition-colors disabled:opacity-50"
                    >
                      {downloadingId === report.id
                        ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>
                        : <><Download className="w-3 h-3" /> Download</>}
                    </button>
                  </div>
                </div>
              );
            })
        }

        {/* ── Empty state ── */}
        {!loading && filtered.length === 0 && (
          <div className="col-span-2 py-20 text-center">
            <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-[#F8FAFC]0">
              {reports.length === 0
                ? 'No reports yet. Generate a report from a Case Detail page using the AI Analysis button.'
                : 'No reports match your search filters.'}
            </p>
          </div>
        )}
      </div>

      {/* ════════════════ GENERATE REPORT MODAL ════════════════ */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => !generating && setShowModal(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg bg-[#070B14] border border-[#223047] rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#223047]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-[#F8FAFC]">Generate AI Investigation Report</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                disabled={generating}
                className="p-1.5 rounded-lg text-[#98A2B3] hover:text-[#F8FAFC] hover:bg-[#0B1220] transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <p className="text-xs text-[#98A2B3] leading-relaxed">
                Select a case. The AI will analyse its complaint text, extract entities, calculate a risk score, and save a report that appears in this list.
              </p>

              {casesLoading ? (
                <div className="flex items-center justify-center py-10 gap-3">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  <span className="text-sm text-[#98A2B3]">Loading cases…</span>
                </div>
              ) : cases.length === 0 && !genError ? (
                <div className="py-10 text-center text-sm text-[#F8FAFC]0">No cases found. Create a case first.</div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {cases.map((c) => (
                    <label
                      key={c.case_id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedCaseId === c.case_id
                          ? 'border-cyan-500/60 bg-[#00B8FF]/10'
                          : 'border-[#223047] hover:border-[#223047] bg-[#121B2A]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="case_pick"
                        value={c.case_id}
                        checked={selectedCaseId === c.case_id}
                        onChange={() => { setSelectedCaseId(c.case_id); setGenError(''); }}
                        className="mt-0.5 accent-indigo-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#F8FAFC] leading-snug">{c.title}</p>
                        <p className="text-xs text-[#F8FAFC]0 mt-0.5">
                          <span className="font-mono text-[#00B8FF]">{c.case_number || c.case_id.slice(0, 8)}</span>
                          {' '}· {c.fraud_type}{c.victim_name ? ` · ${c.victim_name}` : ''}
                        </p>
                      </div>
                      {selectedCaseId === c.case_id && (
                        <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      )}
                    </label>
                  ))}
                </div>
              )}

              {genError && (
                <div className="flex items-center gap-2 p-3 bg-[#FF4D6D]/10 border border-red-500/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-[#FF4D6D] shrink-0" />
                  <p className="text-xs text-[#FF4D6D]">{genError}</p>
                </div>
              )}
              {genSuccess && (
                <div className="flex items-center gap-2 p-3 bg-[#00D084]/10 border border-emerald-500/20 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-[#00D084] shrink-0" />
                  <p className="text-xs text-emerald-300 font-medium">{genSuccess}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#223047] bg-[#0a1020]">
              <button
                onClick={() => setShowModal(false)}
                disabled={generating}
                className="px-4 py-2 text-sm text-[#98A2B3] hover:text-[#F8FAFC] border border-[#223047] rounded-lg hover:bg-[#0B1220]/50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating || !selectedCaseId || !!genSuccess}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-[#F8FAFC] text-sm font-medium rounded-lg transition-colors"
              >
                {generating
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                  : <><Sparkles className="w-3.5 h-3.5" /> Generate Report</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
