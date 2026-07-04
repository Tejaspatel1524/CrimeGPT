import { useState, useEffect, type ReactNode } from 'react';
import { formatINR, formatDate, formatDateTime } from '@/lib/formatters';
import api from '@/services/api';
import {
  Shield, Download, Printer, Lock, AlertTriangle, CheckCircle,
  Sparkles, Loader2, Eye, Info, TrendingUp, FileText, Users,
  Clock, Camera, BookOpen, Scale, Target, Activity
} from 'lucide-react';
import type { Case, Entity, TimelineEvent, Evidence } from '@/types';

interface InvestigationReportTabProps {
  caseData: Case;
}

interface RecoveryData {
  case_id: string;
  case_number: string;
  recovery_probability: number;
  recovery_level: string;
  urgency: string;
  days_since_reported: number;
  entity_count: number;
  entity_types_found: string[];
  cross_case_matches: number;
  reasoning: string[];
  recommended_actions: string[];
}

interface AIReportData {
  report_id: string;
  case_id: string;
  case_number: string;
  executive_summary: {
    case_overview: string;
    total_loss_amount: string;
    fraud_category: string;
    risk_level: string;
  };
  fraud_pattern: {
    scam_type: string;
    attack_methodology: string;
    victim_manipulation: string;
    money_movement: string;
  };
  extracted_entities: {
    phone_numbers: string[];
    emails: string[];
    upi_ids: string[];
    bank_accounts: string[];
    ifsc_codes: string[];
    websites: string[];
    social_media_handles: string[];
    telegram_usernames: string[];
  };
  risk_assessment: {
    risk_score: number;
    confidence_score: number;
    severity_level: string;
    reasoning: string;
  };
  red_flags: string[];
  legal_sections: {
    bns: string[];
    it_act: string[];
    other: string[];
  };
  investigation_recs: string[];
  evidence_checklist: string[];
  recovery_assessment: {
    possibility: string;
    explanation: string;
  };
  next_action_plan: {
    immediate: string[];
    short_term: string[];
    long_term: string[];
  };
}

interface Note {
  id: string;
  note_text: string;
  created_by: string;
  created_at: string;
}

interface LinkedCaseData {
  total_linked_cases: number;
  shared_entity_types: string[];
  cases: Array<{
    case_id: string;
    case_number: string;
    fraud_type: string;
    amount_lost: number;
    status: string;
    created_at: string;
    shared_entities: Array<{
      entity_type: string;
      value: string;
      risk_level: string;
    }>;
  }>;
}

export default function InvestigationReportTab({ caseData }: InvestigationReportTabProps) {
  const [generating, setGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportError, setReportError] = useState('');
  const [savedReportId, setSavedReportId] = useState('');
  
  const [aiReport, setAiReport] = useState<AIReportData | null>(null);
  const [recoveryData, setRecoveryData] = useState<RecoveryData | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [linkedCases, setLinkedCases] = useState<LinkedCaseData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all report data
  useEffect(() => {
    async function fetchReportData() {
      try {
        setLoading(true);
        
        // Fetch AI report (may not exist yet)
        try {
          const aiResp = await api.get(`/report/case/${caseData.id}`);
          setAiReport(aiResp.data);
          setReportGenerated(true);
          setSavedReportId(aiResp.data.report_id);
        } catch (e: any) {
          if (e.response?.status !== 404) {
            console.error('Failed to fetch AI report:', e);
          }
        }

        // Fetch recovery intelligence
        try {
          const recoveryResp = await api.get(`/cases/${caseData.id}/recovery`);
          setRecoveryData(recoveryResp.data);
        } catch (e) {
          console.error('Failed to fetch recovery data:', e);
        }

        // Fetch officer notes
        try {
          const notesResp = await api.get(`/cases/${caseData.id}/notes`);
          setNotes(notesResp.data.notes || []);
        } catch (e) {
          console.error('Failed to fetch notes:', e);
        }

        // Fetch linked cases
        try {
          const linkedResp = await api.get(`/cases/${caseData.id}/linked-cases`);
          setLinkedCases(linkedResp.data);
        } catch (e) {
          console.error('Failed to fetch linked cases:', e);
        }

      } catch (e) {
        console.error('Failed to fetch report data:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchReportData();
  }, [caseData.id]);

  // Generate AI report
  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      setReportError('');
      const response = await api.post(`/report/generate/${caseData.id}`);
      setAiReport(response.data);
      setReportGenerated(true);
      setSavedReportId(response.data.report_id);
    } catch (error: any) {
      setReportError(error.response?.data?.detail || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  // Helper: Get confidence badge
  const getConfidenceBadge = (score: number) => {
    if (score >= 90) return <span className="text-xs text-emerald-400 font-medium">Confidence: {score}%</span>;
    if (score >= 75) return <span className="text-xs text-[#00B8FF] font-medium">Confidence: {score}%</span>;
    if (score >= 60) return <span className="text-xs text-amber-400 font-medium">Confidence: {score}%</span>;
    return <span className="text-xs text-red-400 font-medium">Confidence: {score}%</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-[#00B8FF] animate-spin" />
        <span className="ml-3 text-sm text-[#98A2B3]">Loading report data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Generate AI Report Banner */}
      {!reportGenerated && !generating && (
        <div className="flex items-center justify-between gap-4 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#F8FAFC]">AI-Powered Analysis Ready</p>
              <p className="text-xs text-[#98A2B3] mt-0.5">Generate comprehensive fraud analysis with entity extraction and risk scoring.</p>
            </div>
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" /> Generate AI Report
          </button>
        </div>
      )}

      {generating && (
        <div className="flex items-center gap-3 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
          <Loader2 className="w-5 h-5 text-[#00B8FF] animate-spin shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-300">Analysing complaint text…</p>
            <p className="text-xs text-[#98A2B3] mt-0.5">Extracting entities, calculating risk score, saving to database.</p>
          </div>
        </div>
      )}

      {reportError && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{reportError}</p>
          <button onClick={handleGenerateReport} className="ml-auto text-xs text-red-300 underline hover:no-underline">Retry</button>
        </div>
      )}

      {reportGenerated && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-300">Report saved successfully!</p>
            <p className="text-xs text-[#98A2B3] mt-0.5">Report ID: <span className="font-mono text-[#F8FAFC]">{savedReportId}</span></p>
          </div>
          <a href="/reports" className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl transition-colors shrink-0">
            <Eye className="w-3 h-3" /> View in Reports
          </a>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-[#00B8FF] hover:bg-[#29C5FF] text-white text-sm font-medium rounded-xl transition-colors">
          <Download className="w-3.5 h-3.5" /> Export PDF
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 border border-white/[0.08] text-[#F8FAFC] text-sm rounded-xl hover:bg-white/[0.04] transition-colors">
          <Printer className="w-3.5 h-3.5" /> Print
        </button>
        <div className="ml-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Lock className="w-3 h-3 text-amber-400" />
          <span className="text-xs text-amber-400 font-medium">CONFIDENTIAL</span>
        </div>
      </div>

      {/* Report Document */}
      <div className="bg-[#121B2A] border border-[#223047] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B1220] to-[#0B1220] px-8 py-6 border-b border-[#223047] text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-[#00B8FF]" />
            <span className="text-sm font-bold text-[#00B8FF] tracking-widest uppercase">CrimeGPT</span>
          </div>
          <h2 className="text-xl font-bold text-white">Cyber Crime Investigation Report</h2>
          <p className="text-sm text-[#98A2B3] mt-1">{caseData.caseNumber || caseData.id} — {caseData.fraudCategory}</p>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-[#98A2B3]">
            <span>Generated: {formatDateTime(new Date().toISOString())}</span>
            <span>|</span>
            <span>IO: {caseData.assignedOfficer.name}</span>
            <span>|</span>
            <span>{caseData.status}</span>
          </div>
        </div>

        {/* Report Body */}
        <div className="p-8 space-y-8">
          {/* Section 01: Case Information */}
          <ReportSection num="01" title="CASE INFORMATION">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Case Number', value: caseData.caseNumber || caseData.id.slice(0, 8) },
                { label: 'Fraud Type', value: caseData.fraudCategory },
                { label: 'Amount Lost', value: formatINR(caseData.amountLost) },
                { label: 'Priority', value: caseData.priority },
                { label: 'Status', value: caseData.status },
                { label: 'Date Filed', value: formatDate(caseData.createdAt) },
                { label: 'Investigating Officer', value: caseData.assignedOfficer.name },
                { label: 'Officer Rank', value: caseData.assignedOfficer.rank },
              ].map((item) => (
                <div key={item.label} className="bg-[#0B1220] border border-[#223047] rounded-xl p-3">
                  <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-medium text-[#F8FAFC] mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </ReportSection>

          {/* Section 02: Victim Details */}
          <ReportSection num="02" title="VICTIM DETAILS">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard label="Name" value={caseData.victim.name} />
              <InfoCard label="Contact" value={caseData.victim.contact} />
              <InfoCard label="Email" value={caseData.victim.email} />
              <InfoCard label="Address" value={caseData.victim.address} />
              {caseData.victim.age && <InfoCard label="Age" value={`${caseData.victim.age} years`} />}
              {caseData.victim.occupation && <InfoCard label="Occupation" value={caseData.victim.occupation} />}
            </div>
            <div className="mt-3 text-xs text-[#F8FAFC]0 italic">
              <Info className="inline w-3 h-3 mr-1" />
              Source: Case registration form (Case ID: {caseData.id})
            </div>
          </ReportSection>

          {/* Section 03: Fraud Summary */}
          <ReportSection num="03" title="FRAUD SUMMARY">
            <p className="text-sm text-[#F8FAFC] leading-relaxed">{caseData.description}</p>
            {aiReport && (
              <div className="mt-4 space-y-3">
                <div className="p-4 bg-[#121B2A] border border-[#223047] rounded-xl">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-xs font-semibold text-[#00B8FF] uppercase tracking-wider">AI Analysis</h4>
                    {getConfidenceBadge(aiReport.risk_assessment.confidence_score)}
                  </div>
                  <p className="text-sm text-[#F8FAFC] leading-relaxed mb-3">{aiReport.executive_summary.case_overview}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-[#0B1220] rounded-lg">
                      <p className="text-[10px] text-[#98A2B3] uppercase">Scam Type</p>
                      <p className="text-sm text-[#F8FAFC] mt-1">{aiReport.fraud_pattern.scam_type}</p>
                    </div>
                    <div className="p-3 bg-[#0B1220] rounded-lg">
                      <p className="text-[10px] text-[#98A2B3] uppercase">Risk Level</p>
                      <p className={`text-sm mt-1 font-semibold ${
                        aiReport.risk_assessment.severity_level === 'CRITICAL' ? 'text-red-400' :
                        aiReport.risk_assessment.severity_level === 'HIGH' ? 'text-amber-400' :
                        aiReport.risk_assessment.severity_level === 'MEDIUM' ? 'text-[#00B8FF]' : 'text-emerald-400'
                      }`}>{aiReport.risk_assessment.severity_level}</p>
                    </div>
                    <div className="p-3 bg-[#0B1220] rounded-lg">
                      <p className="text-[10px] text-[#98A2B3] uppercase">Risk Score</p>
                      <p className="text-sm text-[#F8FAFC] mt-1">{aiReport.risk_assessment.risk_score}/100</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-3 text-xs text-[#F8FAFC]0 italic">
              <Info className="inline w-3 h-3 mr-1" />
              Source: Case description + AI fraud analysis
            </div>
          </ReportSection>

          {/* Section 04: Investigation Timeline */}
          <ReportSection num="04" title="INVESTIGATION TIMELINE">
            {caseData.timeline && caseData.timeline.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#0a1d80]">
                      {['Date', 'Time', 'Event', 'Type', 'Description', 'Risk'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[10px] font-medium text-[#98A2B3] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {caseData.timeline.map((event) => (
                      <tr key={event.id} className="border-t border-white/[0.04]">
                        <td className="px-3 py-2 text-xs text-[#F8FAFC]0 font-mono">{event.date}</td>
                        <td className="px-3 py-2 text-xs text-[#00B8FF] font-mono">{event.time}</td>
                        <td className="px-3 py-2 text-xs text-[#F8FAFC]">{event.title}</td>
                        <td className="px-3 py-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded border bg-white/[0.02] text-[#98A2B3] border-white/[0.06]">
                            {event.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-[#98A2B3]">{event.description}</td>
                        <td className="px-3 py-2">
                          <span className={`text-[10px] font-bold ${
                            (event.riskScore ?? 50) >= 80 ? 'text-red-400' :
                            (event.riskScore ?? 50) >= 50 ? 'text-amber-400' : 'text-[#98A2B3]'
                          }`}>{event.riskScore ?? 50}/100</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-[#F8FAFC]0 italic">No timeline events recorded.</p>
            )}
            <div className="mt-3 text-xs text-[#F8FAFC]0 italic">
              <Info className="inline w-3 h-3 mr-1" />
              Source: Case timeline events (Database: case_timeline_events)
            </div>
          </ReportSection>

          {/* Section 05: Evidence Summary */}
          <ReportSection num="05" title="EVIDENCE SUMMARY">
            {caseData.evidence && caseData.evidence.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#0a1d80]">
                      {['#', 'File Name', 'Type', 'Size', 'Uploaded By', 'Date', 'Description'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[10px] font-medium text-[#98A2B3] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {caseData.evidence.map((ev, i) => (
                      <tr key={ev.id} className="border-t border-white/[0.04]">
                        <td className="px-3 py-2 text-xs text-[#F8FAFC]0">{i + 1}</td>
                        <td className="px-3 py-2 text-xs text-[#F8FAFC]">{ev.fileName}</td>
                        <td className="px-3 py-2 text-xs text-[#98A2B3]">{ev.type}</td>
                        <td className="px-3 py-2 text-xs text-[#98A2B3]">{ev.fileSize}</td>
                        <td className="px-3 py-2 text-xs text-[#98A2B3]">{ev.uploadedBy}</td>
                        <td className="px-3 py-2 text-xs text-[#F8FAFC]0 font-mono">{formatDate(ev.uploadedAt)}</td>
                        <td className="px-3 py-2 text-xs text-[#98A2B3]">{ev.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-[#F8FAFC]0 italic">No evidence uploaded yet.</p>
            )}
            <div className="mt-3 text-xs text-[#F8FAFC]0 italic">
              <Info className="inline w-3 h-3 mr-1" />
              Source: Evidence files (Database: evidence, Evidence IDs: {caseData.evidence && caseData.evidence.length > 0 ? caseData.evidence.map(e => e.id.slice(0, 8)).join(', ') : 'None'})
            </div>
          </ReportSection>

          {/* Section 06: Extracted Entities */}
          <ReportSection num="06" title="EXTRACTED ENTITIES">
            {caseData.entities && caseData.entities.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#0a1d80]">
                      {['Type', 'Value', 'Risk Level', 'Score', 'Associated Cases', 'First Seen', 'Last Seen'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[10px] font-medium text-[#98A2B3] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {caseData.entities.map((entity) => (
                      <tr key={entity.id} className="border-t border-white/[0.04]">
                        <td className="px-3 py-2 text-xs text-[#98A2B3]">{entity.type}</td>
                        <td className="px-3 py-2 font-mono text-xs text-[#F8FAFC]">{entity.value}</td>
                        <td className="px-3 py-2">
                          <span className={`text-[10px] font-medium ${
                            entity.riskLevel === 'High' ? 'text-red-400' :
                            entity.riskLevel === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                          }`}>{entity.riskLevel}</span>
                        </td>
                        <td className="px-3 py-2 text-xs font-bold text-[#F8FAFC]">{entity.riskScore ?? '—'}/100</td>
                        <td className="px-3 py-2 text-xs text-[#F8FAFC]">{entity.associatedCases}</td>
                        <td className="px-3 py-2 text-xs text-[#F8FAFC]0 font-mono">{entity.firstSeen}</td>
                        <td className="px-3 py-2 text-xs text-[#F8FAFC]0 font-mono">{entity.lastSeen}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-[#F8FAFC]0 italic">No entities extracted yet.</p>
            )}
            <div className="mt-3 text-xs text-[#F8FAFC]0 italic">
              <Info className="inline w-3 h-3 mr-1" />
              Source: Entity extraction (Database: case_entities, Entity IDs: {caseData.entities && caseData.entities.length > 0 ? caseData.entities.map(e => e.id.slice(0, 8)).join(', ') : 'None'})
            </div>
          </ReportSection>

          {/* Section 07: Cross-Case Intelligence */}
          <ReportSection num="07" title="CROSS-CASE INTELLIGENCE">
            {linkedCases && linkedCases.total_linked_cases > 0 && linkedCases.cases && linkedCases.cases.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-[#98A2B3]">
                  Cross-referencing {caseData.entities?.length || 0} entities across the NCRP database reveals <strong className="text-[#00B8FF]">{linkedCases.total_linked_cases}</strong> linked case(s) sharing common entities.
                </p>
                <div className="space-y-2">
                  {linkedCases.cases.map((lc) => (
                    <div key={lc.case_id} className="flex items-start justify-between p-4 rounded-xl bg-[#0a1d80] border border-white/[0.06]">
                      <div className="flex-1">
                        <p className="text-xs font-mono text-[#00B8FF]">{lc.case_number || lc.case_id.slice(0, 8)}</p>
                        <p className="text-sm text-[#F8FAFC] mt-1">{lc.fraud_type} — {formatINR(lc.amount_lost)}</p>
                        <p className="text-xs text-[#F8FAFC]0 mt-1">Status: {lc.status} | Filed: {formatDate(lc.created_at)}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-[10px] text-[#F8FAFC]0 uppercase mb-1">Shared Entities</p>
                        {(lc.shared_entities || []).slice(0, 3).map((se, idx) => (
                          <p key={idx} className="text-[10px] font-mono text-indigo-400">{se.entity_type}: {se.value}</p>
                        ))}
                        {lc.shared_entities && lc.shared_entities.length > 3 && (
                          <p className="text-[10px] text-[#F8FAFC]0 mt-1">+{lc.shared_entities.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <p className="text-xs text-amber-400">
                    <AlertTriangle className="inline w-3 h-3 mr-1" />
                    <strong>Investigation Recommendation:</strong> Coordinate with {linkedCases.total_linked_cases} linked jurisdiction(s) for joint investigation. Possible organized fraud network.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#F8FAFC]0 italic">No cross-case entity matches found in current dataset.</p>
            )}
            <div className="mt-3 text-xs text-[#F8FAFC]0 italic">
              <Info className="inline w-3 h-3 mr-1" />
              Source: Cross-case entity matching (API: /cases/{'{case_id}'}/linked-cases)
            </div>
          </ReportSection>

          {/* Section 08: Relationship Analysis Summary */}
          <ReportSection num="08" title="RELATIONSHIP ANALYSIS SUMMARY">
            <p className="text-sm text-[#F8FAFC] leading-relaxed mb-4">
              Entity relationship graph reveals {caseData.entities?.length || 0} unique entities connected to this investigation. 
              Key nodes include victim contact points and suspect financial identifiers.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Entities', value: caseData.entities?.length || 0 },
                { label: 'High Risk', value: caseData.entities ? caseData.entities.filter(e => e.riskLevel === 'High').length : 0 },
                { label: 'Linked Cases', value: linkedCases?.total_linked_cases || 0 },
                { label: 'Entity Types', value: caseData.entities ? new Set(caseData.entities.map(e => e.type)).size : 0 },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-[#0a1d80] border border-white/[0.06] rounded-xl">
                  <p className="text-[10px] text-[#F8FAFC]0 uppercase tracking-wider">{item.label}</p>
                  <p className="text-2xl font-bold text-[#00B8FF] mt-1">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-[#F8FAFC]0 italic">
              <Info className="inline w-3 h-3 mr-1" />
              Source: Entity relationship graph analysis (Database: case_entities)
            </div>
          </ReportSection>

          {/* Section 09: Recovery Intelligence */}
          <ReportSection num="09" title="RECOVERY INTELLIGENCE">
            {recoveryData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-4 bg-[#0B1220] border border-cyan-500/20 rounded-xl">
                    <p className="text-[10px] text-[#98A2B3] uppercase">Recovery Probability</p>
                    <p className="text-3xl font-bold text-[#00B8FF] mt-1">{recoveryData.recovery_probability}%</p>
                    <p className="text-xs text-[#98A2B3] mt-1">{recoveryData.recovery_level}</p>
                  </div>
                  <div className="p-4 bg-[#0B1220] border border-amber-500/20 rounded-xl">
                    <p className="text-[10px] text-[#98A2B3] uppercase">Urgency Level</p>
                    <p className={`text-xl font-bold mt-1 ${
                      recoveryData.urgency === 'Immediate' ? 'text-red-400' :
                      recoveryData.urgency === 'Urgent' ? 'text-amber-400' : 'text-[#00B8FF]'
                    }`}>{recoveryData.urgency}</p>
                    <p className="text-xs text-[#98A2B3] mt-1">{recoveryData.days_since_reported.toFixed(1)} days elapsed</p>
                  </div>
                  <div className="p-4 bg-[#0B1220] border border-purple-500/20 rounded-xl">
                    <p className="text-[10px] text-[#98A2B3] uppercase">Entity Coverage</p>
                    <p className="text-3xl font-bold text-purple-400 mt-1">{recoveryData.entity_count}</p>
                    <p className="text-xs text-[#98A2B3] mt-1">{recoveryData.entity_types_found.join(', ')}</p>
                  </div>
                  <div className="p-4 bg-[#121B2A] border border-[#223047] rounded-xl">
                    <p className="text-[10px] text-[#98A2B3] uppercase">Cross-Case Matches</p>
                    <p className="text-3xl font-bold text-indigo-400 mt-1">{recoveryData.cross_case_matches}</p>
                    <p className="text-xs text-[#98A2B3] mt-1">Related investigations</p>
                  </div>
                </div>
                
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                  <h4 className="text-xs font-semibold text-[#00B8FF] uppercase tracking-wider mb-2">Analysis Reasoning</h4>
                  <ul className="space-y-1">
                    {(recoveryData.reasoning || []).map((reason, idx) => (
                      <li key={idx} className="text-sm text-[#F8FAFC] flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-[#00B8FF] mt-0.5 shrink-0" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Recommended Recovery Actions</h4>
                  <ul className="space-y-1">
                    {(recoveryData.recommended_actions || []).slice(0, 8).map((action, idx) => (
                      <li key={idx} className="text-sm text-[#F8FAFC] flex items-start gap-2">
                        <Target className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#F8FAFC]0 italic">Recovery intelligence not available.</p>
            )}
            <div className="mt-3 text-xs text-[#F8FAFC]0 italic">
              <Info className="inline w-3 h-3 mr-1" />
              Source: Rule-based recovery engine (API: /cases/{'{case_id}'}/recovery)
            </div>
          </ReportSection>

          {/* Section 10: Officer Investigation Notes */}
          <ReportSection num="10" title="OFFICER INVESTIGATION NOTES">
            {notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((note, idx) => (
                  <div key={note.id} className="p-4 bg-[#0B1220] border border-[#223047] rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#98A2B3] uppercase">Note #{idx + 1}</span>
                      <span className="text-[10px] text-[#98A2B3] font-mono">{formatDateTime(note.created_at)}</span>
                    </div>
                    <p className="text-sm text-[#F8FAFC] leading-relaxed">{note.note_text}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <BookOpen className="w-3 h-3 text-[#98A2B3]" />
                      <span className="text-xs text-[#98A2B3]">— {note.created_by}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#98A2B3] italic">No officer notes recorded yet.</p>
            )}
            <div className="mt-3 text-xs text-[#98A2B3] italic">
              <Info className="inline w-3 h-3 mr-1" />
              Source: Officer notes (Database: case_notes, Note IDs: {notes && notes.length > 0 ? notes.map(n => n.id.slice(0, 8)).join(', ') : 'None'})
            </div>
          </ReportSection>

          {/* Section 11: AI Investigation Summary */}
          <ReportSection num="11" title="AI INVESTIGATION SUMMARY">
            {aiReport ? (
              <div className="space-y-4">
                {/* Fraud Pattern Analysis */}
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Fraud Pattern Analysis</h4>
                    {getConfidenceBadge(aiReport.risk_assessment.confidence_score)}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-[#98A2B3] uppercase mb-1">Attack Methodology</p>
                      <p className="text-sm text-[#F8FAFC] leading-relaxed">{aiReport.fraud_pattern.attack_methodology}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#98A2B3] uppercase mb-1">Victim Manipulation</p>
                      <p className="text-sm text-[#F8FAFC] leading-relaxed">{aiReport.fraud_pattern.victim_manipulation}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#98A2B3] uppercase mb-1">Money Movement Pattern</p>
                      <p className="text-sm text-[#F8FAFC] leading-relaxed">{aiReport.fraud_pattern.money_movement}</p>
                    </div>
                  </div>
                </div>

                {/* Red Flags Detected */}
                {aiReport.red_flags && aiReport.red_flags.length > 0 && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Red Flags Detected</h4>
                    <ul className="space-y-1">
                      {aiReport.red_flags.map((flag, idx) => (
                        <li key={idx} className="text-sm text-[#F8FAFC] flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risk Assessment */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Risk Assessment</h4>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1">
                      <p className="text-[10px] text-[#F8FAFC]0 uppercase mb-1">Risk Score</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              aiReport.risk_assessment.risk_score >= 80 ? 'bg-red-500' :
                              aiReport.risk_assessment.risk_score >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${aiReport.risk_assessment.risk_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-[#F8FAFC]">{aiReport.risk_assessment.risk_score}/100</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#F8FAFC]0 uppercase mb-1">Severity</p>
                      <span className={`text-sm font-bold ${
                        aiReport.risk_assessment.severity_level === 'CRITICAL' ? 'text-red-400' :
                        aiReport.risk_assessment.severity_level === 'HIGH' ? 'text-amber-400' :
                        aiReport.risk_assessment.severity_level === 'MEDIUM' ? 'text-[#00B8FF]' : 'text-emerald-400'
                      }`}>{aiReport.risk_assessment.severity_level}</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#F8FAFC] leading-relaxed">{aiReport.risk_assessment.reasoning}</p>
                </div>

                {/* Legal Sections */}
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">Applicable Legal Provisions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] text-[#F8FAFC]0 uppercase mb-2">Bharatiya Nyaya Sanhita</p>
                      <ul className="space-y-1">
                        {(aiReport.legal_sections.bns || []).map((sec, idx) => (
                          <li key={idx} className="text-xs text-[#F8FAFC]">{sec}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#F8FAFC]0 uppercase mb-2">IT Act Sections</p>
                      <ul className="space-y-1">
                        {(aiReport.legal_sections.it_act || []).map((sec, idx) => (
                          <li key={idx} className="text-xs text-[#F8FAFC]">{sec}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#F8FAFC]0 uppercase mb-2">Other Provisions</p>
                      <ul className="space-y-1">
                        {(aiReport.legal_sections.other || []).map((sec, idx) => (
                          <li key={idx} className="text-xs text-[#F8FAFC]">{sec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#F8FAFC]0 italic">AI analysis not generated yet. Click "Generate AI Report" above.</p>
            )}
            <div className="mt-3 text-xs text-[#F8FAFC]0 italic">
              <Info className="inline w-3 h-3 mr-1" />
              Source: AI fraud analysis engine (Database: fraud_reports, Report ID: {aiReport?.report_id || 'N/A'})
            </div>
          </ReportSection>

          {/* Section 12: Recommended Next Actions */}
          <ReportSection num="12" title="RECOMMENDED NEXT ACTIONS">
            {aiReport ? (
              <div className="space-y-4">
                {/* Immediate Actions */}
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-red-400" />
                    <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider">Immediate Actions (0-24 Hours)</h4>
                  </div>
                  <ul className="space-y-2">
                    {(aiReport.next_action_plan.immediate || []).map((action, idx) => (
                      <li key={idx} className="text-sm text-[#F8FAFC] flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Short Term Actions */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Short-Term Actions (1-7 Days)</h4>
                  </div>
                  <ul className="space-y-2">
                    {(aiReport.next_action_plan.short_term || []).map((action, idx) => (
                      <li key={idx} className="text-sm text-[#F8FAFC] flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Long Term Actions */}
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-[#00B8FF]" />
                    <h4 className="text-xs font-semibold text-[#00B8FF] uppercase tracking-wider">Long-Term Actions (7+ Days)</h4>
                  </div>
                  <ul className="space-y-2">
                    {(aiReport.next_action_plan.long_term || []).map((action, idx) => (
                      <li key={idx} className="text-sm text-[#F8FAFC] flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-[#00B8FF] mt-0.5 shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Investigation Recommendations */}
                {aiReport.investigation_recs && aiReport.investigation_recs.length > 0 && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Additional Investigation Steps</h4>
                    </div>
                    <ul className="space-y-2">
                      {aiReport.investigation_recs.map((rec, idx) => (
                        <li key={idx} className="text-sm text-[#F8FAFC] flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[#F8FAFC]0 italic">AI-generated action plan not available. Generate AI report for comprehensive recommendations.</p>
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                  <h4 className="text-xs font-semibold text-[#00B8FF] uppercase tracking-wider mb-2">Standard Investigation Actions</h4>
                  <ul className="space-y-2">
                    <li className="text-sm text-[#F8FAFC] flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-[#00B8FF] mt-0.5 shrink-0" />
                      <span>File complaint on cybercrime.gov.in immediately</span>
                    </li>
                    <li className="text-sm text-[#F8FAFC] flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-[#00B8FF] mt-0.5 shrink-0" />
                      <span>Call cybercrime helpline 1930 for immediate assistance</span>
                    </li>
                    <li className="text-sm text-[#F8FAFC] flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-[#00B8FF] mt-0.5 shrink-0" />
                      <span>Preserve all digital evidence (screenshots, messages, call logs)</span>
                    </li>
                    <li className="text-sm text-[#F8FAFC] flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-[#00B8FF] mt-0.5 shrink-0" />
                      <span>Contact victim's bank to freeze beneficiary accounts</span>
                    </li>
                    <li className="text-sm text-[#F8FAFC] flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-[#00B8FF] mt-0.5 shrink-0" />
                      <span>Request CDR/IPDR from telecom operators for identified numbers</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
            <div className="mt-3 text-xs text-[#F8FAFC]0 italic">
              <Info className="inline w-3 h-3 mr-1" />
              Source: AI action planning engine + recovery intelligence recommendations
            </div>
          </ReportSection>

          {/* Section 13: Report Metadata */}
          <ReportSection num="13" title="REPORT METADATA">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Report Generated', value: formatDateTime(new Date().toISOString()) },
                { label: 'Case ID', value: caseData.id },
                { label: 'Case Number', value: caseData.caseNumber || 'N/A' },
                { label: 'Reporting Officer', value: caseData.assignedOfficer.name },
                { label: 'Officer Rank', value: caseData.assignedOfficer.rank },
                { label: 'Department', value: caseData.assignedOfficer.department },
                { label: 'Evidence Items', value: (caseData.evidence?.length || 0).toString() },
                { label: 'Entities Extracted', value: (caseData.entities?.length || 0).toString() },
                { label: 'Timeline Events', value: (caseData.timeline?.length || 0).toString() },
                { label: 'Officer Notes', value: (notes?.length || 0).toString() },
                { label: 'Linked Cases', value: (linkedCases?.total_linked_cases || 0).toString() },
                { label: 'Report Status', value: reportGenerated ? 'Complete' : 'Partial' },
              ].map((item) => (
                <div key={item.label} className="bg-[#0B1220] border border-[#223047] rounded-xl p-3">
                  <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-medium text-[#F8FAFC] mt-1 font-mono">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-slate-500/10 border border-slate-500/20 rounded-xl">
              <p className="text-xs text-[#98A2B3] leading-relaxed">
                <strong className="text-[#F8FAFC]">Certification:</strong> This report has been generated using CrimeGPT v1.0 
                Cyber Crime Investigation Platform. All data is sourced from verified database records and AI-assisted analysis. 
                Confidence scores are provided where AI inference is used. This report is intended for official investigation 
                purposes only and should be treated as confidential under applicable cybercrime investigation protocols.
              </p>
            </div>
            <div className="mt-3 text-xs text-[#98A2B3] italic">
              <Info className="inline w-3 h-3 mr-1" />
              Report version: 1.0 | Database: PostgreSQL | AI Engine: Rule-based + Pattern Matching
            </div>
          </ReportSection>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function ReportSection({ num, title, children }: { num: string; title: string; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-bold text-cyan-500 font-mono">§{num}</span>
        <h3 className="text-xs font-bold text-[#00B8FF] uppercase tracking-[0.15em]">{title}</h3>
        <div className="flex-1 h-px bg-slate-700/50" />
      </div>
      {children}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0B1220] border border-[#223047] rounded-xl p-3">
      <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-[#F8FAFC] mt-1">{value}</p>
    </div>
  );
}
