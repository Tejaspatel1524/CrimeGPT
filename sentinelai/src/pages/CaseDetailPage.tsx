import { useState, useMemo, useCallback, useEffect, lazy, Suspense, memo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatINR, formatDate, formatDateTime } from '@/lib/formatters';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import EnterpriseRecoveryIntelligence from '@/components/EnterpriseRecoveryIntelligence';
import EnhancedOverviewSection from '@/components/EnhancedOverviewSection';
import InvestigationProgress from '@/components/InvestigationProgress';
import EnterpriseRelationshipGraph from '@/components/EnterpriseRelationshipGraph';
import { OverviewSkeleton, TimelineSkeleton, EvidenceSkeleton, TableSkeleton } from '@/components/SkeletonLoader';
import EnterpriseEvidenceWorkspace from '@/components/EnterpriseEvidenceWorkspace';

const InvestigationReportTab = lazy(() => import('@/components/InvestigationReportTab'));
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  type Node,
  type Edge,
  MarkerType,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  ArrowLeft, FileText, Shield, Clock, Users, Network, BookOpen,
  Phone, Mail, Globe, MessageSquare, CreditCard, AtSign, Hash,
  Download, Printer, AlertTriangle, Camera, File, Headphones,
  CheckCircle, Search, ChevronDown, ChevronRight,
  Eye, Tag, User, Building, BarChart3, Lock, Star,
  Info, Link2, X, MapPin, Layers, TrendingUp, Activity,
  Sparkles, Loader2, RefreshCw, MousePointer,
} from 'lucide-react';
import type { Case, CasePriority, CaseStatus, Entity, TimelineEvent, Evidence, FraudCategory } from '@/types';

/* ════════════════════════════════════════════════════════════
   CONSTANTS & CONFIG
════════════════════════════════════════════════════════════ */
const priorityStyle: Record<CasePriority, string> = {
  Critical: 'bg-red-500/15 text-[#FF4D6D] border border-red-500/30',
  High: 'bg-amber-500/15 text-[#FFB020] border border-amber-500/30',
  Medium: 'bg-[#00B8FF]/10 text-[#00B8FF] border border-[#00B8FF]/20',
  Low: 'bg-[#98A2B3]/15 text-[#98A2B3] border border-[#223047]/30',
};
const statusStyle: Record<CaseStatus, string> = {
  Open: 'bg-[#00B8FF]/10 text-[#00B8FF] border border-[#00B8FF]/20',
  'Under Investigation': 'bg-amber-500/15 text-[#FFB020] border border-amber-500/30',
  'Evidence Collection': 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  'Pending Review': 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  Escalated: 'bg-red-500/15 text-[#FF4D6D] border border-red-500/30',
  Closed: 'bg-emerald-500/15 text-[#00D084] border border-emerald-500/30',
  Resolved: 'bg-teal-500/15 text-teal-400 border border-teal-500/30',
};
const evidenceConfig: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
  'Complaint PDF':   { icon: FileText,    color: 'text-[#FF4D6D]',    bg: 'bg-red-500/10 border-red-500/20' },
  Screenshot:        { icon: Camera,      color: 'text-[#00B8FF]',   bg: 'bg-[#00B8FF]/10 border-[#00B8FF]/20' },
  'Chat Export':     { icon: MessageSquare, color: 'text-[#00D084]', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  'Bank Statement':  { icon: CreditCard,  color: 'text-[#FFB020]',  bg: 'bg-amber-500/10 border-amber-500/20' },
  Image:             { icon: Camera,      color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  'Call Recording':  { icon: Headphones,  color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/20' },
  'Email Thread':    { icon: Mail,        color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  'Transaction Log': { icon: BarChart3,   color: 'text-teal-400',   bg: 'bg-teal-500/10 border-teal-500/20' },
};
const timelineConfig: Record<string, { color: string; bg: string; badge: string; label: string }> = {
  contact:       { color: 'bg-[#00B8FF]',    bg: 'bg-[#00B8FF]/10',    badge: 'text-[#00B8FF] border-[#00B8FF]/20',    label: 'Contact' },
  transaction:   { color: 'bg-amber-500',   bg: 'bg-amber-500/10',   badge: 'text-[#FFB020] border-amber-500/30',  label: 'Transaction' },
  communication: { color: 'bg-violet-500',  bg: 'bg-violet-500/10',  badge: 'text-violet-400 border-violet-500/20', label: 'Communication' },
  escalation:    { color: 'bg-red-500',     bg: 'bg-red-500/10',     badge: 'text-[#FF4D6D] border-red-500/30',       label: 'Escalation' },
  evidence:      { color: 'bg-purple-500',  bg: 'bg-purple-500/10',  badge: 'text-purple-400 border-purple-500/30', label: 'Evidence' },
  action:        { color: 'bg-emerald-500', bg: 'bg-emerald-500/10', badge: 'text-[#00D084] border-emerald-500/30', label: 'Action' },
};
const entityGraphConfig: Record<string, { color: string; border: string; icon: string }> = {
  Victim:           { color: '#1e3a5f', border: '#3b82f6', icon: '' },
  'Phone Number':   { color: '#422006', border: '#f59e0b', icon: '' },
  'UPI ID':         { color: '#2e1065', border: '#8b5cf6', icon: '' },
  'Bank Account':   { color: '#064e3b', border: '#10b981', icon: '' },
  'Telegram Handle':{ color: '#1e3a5f', border: '#6366f1', icon: '' },
  'Email Address':  { color: '#4a044e', border: '#ec4899', icon: '' },
  Website:          { color: '#450a0a', border: '#ef4444', icon: '' },
  'Social Media':   { color: '#042f2e', border: '#14b8a6', icon: '' },
  'IP Address':     { color: '#1c1917', border: '#78716c', icon: '' },
  'Linked Case':    { color: '#1a1a2e', border: '#60a5fa', icon: '' },
};
const entityTypeIcon: Record<string, typeof Phone> = {
  'Phone Number': Phone, 'UPI ID': CreditCard, 'Email Address': Mail, Website: Globe,
  'Telegram Handle': MessageSquare, 'Bank Account': Building, 'Social Media': AtSign, 'IP Address': Hash,
};
/* ── Navigation Structure ── */
const NAVIGATION_GROUPS = [
  {
    id: 'case',
    label: 'CASE',
    items: [
      { id: 'overview',   label: 'Overview',  icon: Info },
      { id: 'complaint',  label: 'Complaint', icon: FileText },
      { id: 'evidence',   label: 'Evidence',  icon: Camera },
      { id: 'timeline',   label: 'Timeline',  icon: Clock },
    ]
  },
  {
    id: 'intelligence',
    label: 'INTELLIGENCE',
    items: [
      { id: 'entities',      label: 'Entity Intelligence',     icon: Users },
      { id: 'graph',         label: 'Relationship Graph',      icon: Network },
      { id: 'intelligence',  label: 'Cross-Case Intelligence', icon: Layers },
      { id: 'recovery',      label: 'Recovery Intelligence',   icon: TrendingUp },
    ]
  },
  {
    id: 'investigation',
    label: 'INVESTIGATION',
    items: [
      { id: 'notes',  label: 'Officer Notes',        icon: BookOpen },
      { id: 'report', label: 'Investigation Report', icon: FileText },
      { id: 'brief',  label: 'CrimeGPT',             icon: Sparkles },
    ]
  }
];

const tabs = NAVIGATION_GROUPS.flatMap(g => g.items);


/* ── Investigation progress steps ── */
const progressSteps = [
  { label: 'Case Registered', key: 'registered' },
  { label: 'Evidence Collected', key: 'evidence' },
  { label: 'Entity Analysis', key: 'entity' },
  { label: 'Timeline Reconstruction', key: 'timeline' },
  { label: 'Network Analysis', key: 'network' },
  { label: 'Report Generation', key: 'report' },
];

/* ════════════════════════════════════════════════════════════
   SMALL COMPONENTS
════════════════════════════════════════════════════════════ */
function RiskBar({ level, score }: { level: 'High' | 'Medium' | 'Low'; score?: number }) {
  const pct = score ?? (level === 'High' ? 90 : level === 'Medium' ? 55 : 20);
  const color = level === 'High' ? 'bg-red-500' : level === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500';
  const text = level === 'High' ? 'text-[#FF4D6D]' : level === 'Medium' ? 'text-[#FFB020]' : 'text-[#00D084]';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#0B1220]/50 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-bold tabular-nums ${text}`}>{pct}/100</span>
    </div>
  );
}

function RiskScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'from-red-500 to-red-700 text-slate-50' : score >= 50 ? 'from-amber-500 to-amber-700 text-slate-50' : 'from-emerald-500 to-emerald-700 text-slate-50';
  return (
    <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-sm font-bold shadow-lg`}>
      {score}
    </div>
  );
}

/* ── Slide-over Drawer ── */
function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-[420px] max-w-full h-full bg-[#070B14] border-l border-[#223047] shadow-2xl overflow-y-auto animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-[#070B14] border-b border-[#223047]">
          <h3 className="text-sm font-semibold text-[#F8FAFC]">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#0B1220]/50 text-[#98A2B3] hover:text-[#F8FAFC] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
const extractEntityValues = (text: string): string[] => {
  const upis = text.match(/\b([a-zA-Z0-9._-]+@[a-zA-Z]+)\b/g) || [];
  const phones = text.match(/(?:\+91)?[6-9]\d{9}/g) || [];
  const emails = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || [];
  const urls = text.match(/https?:\/\/[^\s]+/g) || [];
  return [...upis, ...phones, ...emails, ...urls].map(v => v.toLowerCase().trim());
};

interface CaseDetailPageProps {
  activeModule?: string;
}

export default function CaseDetailPage({ activeModule = 'overview' }: CaseDetailPageProps) {
  const { caseId } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(activeModule);

  // Sync activeTab with activeModule prop
  useEffect(() => {
    if (activeModule) {
      setActiveTab(activeModule);
    }
  }, [activeModule]);

  // Evidence
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [analysisModal, setAnalysisModal] = useState<null | {
    evidence_id: string; filename: string; status: string;
    raw_text: string; characters: number; entities: {type:string;value:string;confidence:number}[];
    entity_count: number; error_message?: string;
  }>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisCache, setAnalysisCache] = useState<Record<string, string>>({}); // evidence_id → status

  // Investigation Brief
  const [brief, setBrief] = useState<any>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState('');

  // Timeline
  const [expandedTimeline, setExpandedTimeline] = useState<Set<string>>(new Set());
  const [timelineDrawer, setTimelineDrawer] = useState<TimelineEvent | null>(null);
  const [timelineSearch, setTimelineSearch] = useState('');

  // Entities
  const [entitySearch, setEntitySearch] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [entityDrawer, setEntityDrawer] = useState<Entity | null>(null);

  // Graph
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [graphSearch, setGraphSearch] = useState('');
  const [graphApiData, setGraphApiData] = useState<Record<string, { confidence: number; related_case_count: number }>>({});

  // Cross-case intelligence
  const [linkedCases, setLinkedCases] = useState<{
    total_linked_cases: number;
    risk_badge: string;
    matches: { shared_value: string; entity_type: string; related_case_id: string; related_case_number: string; related_case_title: string; related_case_status: string; related_case_priority: string }[];
  } | null>(null);
  const [linkedLoading, setLinkedLoading] = useState(false);

  // Recovery Intelligence
  const [recovery, setRecovery] = useState<{
    recovery_probability: number; recovery_level: string; urgency: string;
    days_since_reported: number; entity_count: number; entity_types_found: string[];
    cross_case_matches: number; reasoning: string[]; recommended_actions: string[];
  } | null>(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  // Officer Notes
  const [notes, setNotes] = useState<{ id: string; case_id: string; officer_name: string; note_type: string; note_text: string; created_at: string }[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState('');
  const [noteSuccess, setNoteSuccess] = useState('');
  const [noteType, setNoteType] = useState('General Note');
  const [noteText, setNoteText] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // Progress tracking
  const [hasOCRProcessed, setHasOCRProcessed] = useState(false);
  const [hasAIReport, setHasAIReport] = useState(false);
  const [riskScore, setRiskScore] = useState<number | undefined>(undefined);
  const [entitySortBy, setEntitySortBy] = useState<'type' | 'risk' | 'occurrences'>('risk');
  const [entitySortDir, setEntitySortDir] = useState<'asc' | 'desc'>('desc');

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [casesList, setCasesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  const handleFetchBrief = async (force = false) => {
    if (!caseId) return;
    setBriefLoading(true);
    setBriefError('');
    try {
      const method = force ? 'post' : 'get';
      const url = force ? `/cases/${caseId}/investigation-brief?force=true` : `/cases/${caseId}/investigation-brief`;
      const res = force ? await api.post(url) : await api.get(url);
      setBrief(res.data);
    } catch (err: any) {
      setBriefError(err?.response?.data?.detail || 'Failed to generate brief. Please try again.');
    } finally {
      setBriefLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'brief' && !brief && !briefLoading) {
      handleFetchBrief(false);
    }
  }, [activeTab, caseId]);

  const handleAnalyzeEvidence = async (evidenceId: string) => {
    setAnalyzingId(evidenceId);
    try {
      const res = await api.post(`/evidence/${evidenceId}/analyze`);
      setAnalysisCache(prev => ({ ...prev, [evidenceId]: res.data.status }));
      setAnalysisModal(res.data);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleViewAnalysis = async (evidenceId: string) => {
    try {
      const res = await api.get(`/evidence/${evidenceId}/analysis`);
      setAnalysisCache(prev => ({ ...prev, [evidenceId]: res.data.status }));
      setAnalysisModal(res.data);
    } catch {
      alert('Could not load analysis. Run analysis first.');
    }
  };

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        setLoading(true);
        // 1. Fetch case from GET /cases/{caseId}
        const caseRes = await api.get(`/cases/${caseId}`);
        const c = caseRes.data;

        // Fetch other cases to calculate related cases
        try {
          const allCasesRes = await api.get('/cases');
          setCasesList(allCasesRes.data || []);
        } catch (errList) {
          console.error("Failed to load other cases list", errList);
        }

        // 2. Fetch evidence from GET /evidence/case/{caseId}
        let evidenceList: Evidence[] = [];
        try {
          const evidenceRes = await api.get(`/evidence/case/${caseId}`);
          evidenceList = (evidenceRes.data || []).map((e: any) => ({
            id: e.evidence_id,
            type: (e.file_type || 'Image') as any,
            fileName: e.filename,
            fileSize: `${(e.file_size / 1024 / 1024).toFixed(1)} MB`,
            uploadedAt: e.uploaded_at,
            uploadedBy: user?.full_name || 'Officer',
            description: `File: ${e.filename}`,
          }));
        } catch (evErr) {
          console.error("Failed to load evidence", evErr);
        }

        // 3. Fetch entities from DB + generate fraud score
        let extractedEntities: Entity[] = [];
        let riskScore = 45;
        let riskLevel: 'High' | 'Medium' | 'Low' = 'Medium';
        let reasons: string[] = [];
        let summaryText = c.complaint_text;

        // 3a. Fetch persisted entities from DB
        try {
          const entRes = await api.get(`/cases/${caseId}/entities`);
          const dbEntities: { id: string; entity_type: string; value: string }[] = entRes.data?.entities || [];

          const typeMap: Record<string, Entity['type']> = {
            phone:     'Phone Number',
            upi:       'UPI ID',
            email:     'Email Address',
            url:       'Website',
            telegram:  'Telegram Handle',
            instagram: 'Social Media',
            bank:      'Bank Account',
            ifsc:      'IP Address',   // re-using closest type
            amount:    'IP Address',   // amounts stored for reference
          };

          extractedEntities = dbEntities
            .filter(e => typeMap[e.entity_type])
            .map((e, i) => ({
              id: e.id || `entity-${i}`,
              type: typeMap[e.entity_type] as Entity['type'],
              value: e.value,
              label: e.value,
              riskLevel: 'Medium' as const,
              associatedCases: 1,
              firstSeen: c.created_at,
              lastSeen: c.created_at,
              riskScore: 50,
              statesDetected: ['Delhi', 'Mumbai'],
              connectedEntities: [],
              investigatorNotes: `Extracted from complaint text. Type: ${e.entity_type}`,
            }));
        } catch (entErr) {
          console.error("Failed to load DB entities", entErr);
        }

        // 3b. Generate fraud analysis for risk score
        try {
          const reportRes = await api.post('/report/generate', { text: c.complaint_text });
          const rep = reportRes.data;
          riskScore = rep.risk_score ?? 45;
          riskLevel = (rep.risk_level || 'Medium') as any;
          reasons = rep.reasons || [];
          summaryText = rep.summary || c.complaint_text;

          // Update risk levels on entities based on score
          const rl: 'High' | 'Medium' | 'Low' = riskScore >= 75 ? 'High' : riskScore >= 40 ? 'Medium' : 'Low';
          extractedEntities = extractedEntities.map(e => ({ ...e, riskLevel: rl, riskScore }));

          // If DB had 0 entities (old case before entity extraction), fallback to report entities
          if (extractedEntities.length === 0) {
            const ent = rep.entities || {};
            let idCounter = 1;
            const createEntity = (val: string, type: Entity['type']): Entity => ({
              id: `entity-${idCounter++}`, type, value: val, label: val,
              riskLevel: rl, associatedCases: 1,
              firstSeen: c.created_at, lastSeen: c.created_at,
              riskScore, statesDetected: ['Delhi', 'Mumbai'], connectedEntities: [],
              investigatorNotes: 'Extracted from complaint text.',
            });
            if (Array.isArray(ent.upi_ids)) ent.upi_ids.forEach((v: string) => extractedEntities.push(createEntity(v, 'UPI ID')));
            if (Array.isArray(ent.phone_numbers)) ent.phone_numbers.forEach((v: string) => extractedEntities.push(createEntity(v, 'Phone Number')));
            if (Array.isArray(ent.emails)) ent.emails.forEach((v: string) => extractedEntities.push(createEntity(v, 'Email Address')));
            if (Array.isArray(ent.urls)) ent.urls.forEach((v: string) => extractedEntities.push(createEntity(v, 'Website')));
            if (Array.isArray(ent.telegram_handles)) ent.telegram_handles.forEach((v: string) => extractedEntities.push(createEntity(v, 'Telegram Handle')));
            if (Array.isArray(ent.instagram_handles)) ent.instagram_handles.forEach((v: string) => extractedEntities.push(createEntity(v, 'Social Media')));
          }
        } catch (repErr) {
          console.error("Failed to generate report/entities", repErr);
        }

        // Add cross-connected entities for graph links if there are multiple entities
        if (extractedEntities.length > 1) {
          const allVals = extractedEntities.map(e => e.value);
          extractedEntities.forEach(e => {
            e.connectedEntities = allVals.filter(v => v !== e.value);
          });
        }

        // 4. Construct a timeline events array
        const timelineList: TimelineEvent[] = [
          {
            id: 'timeline-1',
            time: new Date(c.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            date: new Date(c.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            title: 'Case Registered',
            description: `Cybercrime case registered by victim ${c.victim_name}. Complaint text logged.`,
            type: 'action',
            investigatorNotes: 'Initial registration. Verification pending.',
          }
        ];

        if (evidenceList.length > 0) {
          evidenceList.forEach((ev, idx) => {
            timelineList.push({
              id: `timeline-ev-${idx}`,
              time: new Date(ev.uploadedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              date: new Date(ev.uploadedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
              title: `Evidence Attached: ${ev.fileName}`,
              description: `Uploaded file size: ${ev.fileSize}`,
              type: 'evidence',
              linkedEvidenceIds: [ev.id],
            });
          });
        }

        // 4b. Fetch persisted timeline events (from officer notes etc.)
        try {
          const tlRes = await api.get(`/cases/${caseId}/timeline`);
          (tlRes.data || []).forEach((ev: any) => {
            timelineList.push({
              id: ev.id,
              time: new Date(ev.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              date: new Date(ev.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
              title: ev.title,
              description: ev.title,   // show event title only — not note text
              type: ev.event_type as TimelineEvent['type'],
              investigatorNotes: ev.description
                ? `${ev.description}\n\nOfficer: ${ev.created_by || '—'}\nType: ${ev.title.replace('Officer Note Added — ', '')}`
                : ev.created_by ? `Officer: ${ev.created_by}` : undefined,
            });
          });
          // Sort all events newest-first
          timelineList.sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime());
        } catch {
          // silently ignore — static timeline still shows
        }

        // Map backend case schema to frontend Case interface
        const mappedCase: Case = {
          id: c.case_id,
          caseNumber: c.case_number || c.case_id.slice(0, 8),
          title: c.title,
          description: summaryText,
          fraudCategory: c.fraud_type,
          priority: c.priority,
          status: c.status,
          victim: {
            name: c.victim_name,
            contact: c.victim_phone,
            email: c.victim_email,
            address: 'New Delhi, India',
            age: 32,
            occupation: 'Software Engineer',
          },
          assignedOfficer: c.owner ? {
            id: c.owner.id,
            name: c.owner.full_name,
            rank: c.owner.role,
            department: c.owner.department || 'Cyber Crime Cell',
            avatar: undefined,  // Backend doesn't expose profile_photo in owner
          } : {
            id: user?.id || 'unknown',
            name: user?.full_name || 'Unassigned',
            rank: user?.role || 'Officer',
            department: user?.department || 'Cyber Crime Cell',
            avatar: user?.profile_photo || undefined,
          },
          entities: extractedEntities,
          evidence: evidenceList,
          timeline: timelineList,
          complaintText: c.complaint_text,
          amountLost: c.amount_lost,
          createdAt: c.created_at,
          updatedAt: c.created_at,
          tags: [c.fraud_type, c.priority],
        };

        setCaseData(mappedCase);
        
        // Check for OCR processing
        if (evidenceList.length > 0) {
          try {
            const ocrCheck = await Promise.all(
              evidenceList.slice(0, 3).map(ev => 
                api.get(`/evidence/${ev.id}/analysis`).catch(() => null)
              )
            );
            setHasOCRProcessed(ocrCheck.some(r => r?.data?.status === 'completed'));
          } catch {
            setHasOCRProcessed(false);
          }
        }
        
        // Check for AI report
        try {
          const reportRes = await api.get(`/report/case/${caseId}`);
          if (reportRes.data) {
            setHasAIReport(true);
            setRiskScore(reportRes.data.risk_assessment?.risk_score);
          }
        } catch {
          setHasAIReport(false);
        }
      } catch (err) {
        setApiError('Failed to load case details. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCaseDetails();
  }, [caseId]);

  /* ── Related cases (shared entities) ── */
  const relatedCases = useMemo(() => {
    if (!caseData || casesList.length === 0) return [];
    const myEntityValues = new Set(caseData.entities.map((e: Entity) => e.value.toLowerCase().trim()));

    return casesList
      .filter((c) => c.case_id !== caseData.id)
      .map((c) => {
        const otherValues = extractEntityValues(c.complaint_text || '');
        const sharedVals = otherValues.filter(v => myEntityValues.has(v));

        if (sharedVals.length > 0) {
          const mappedCase = {
            id: c.case_id as string,
            title: c.title as string,
            fraudCategory: c.fraud_type as FraudCategory,
            priority: c.priority as CasePriority,
            status: c.status as CaseStatus,
            victim: { name: c.victim_name as string },
          };

          const sharedEntities: Entity[] = sharedVals.map((val: string, idx: number) => ({
            id: `shared-${c.case_id}-${idx}`,
            type: val.includes('@') ? (val.includes('.') ? 'Email Address' : 'UPI ID') : (val.startsWith('http') ? 'Website' : 'Phone Number'),
            value: val,
            label: val,
            riskLevel: 'Medium',
            associatedCases: 2,
            firstSeen: c.created_at,
            lastSeen: c.created_at,
          }));

          return { caseObj: mappedCase, sharedEntities };
        }
        return null;
      })
      .filter(Boolean) as { caseObj: any; sharedEntities: Entity[] }[];
  }, [caseData, casesList]);

  /* ── Investigation progress ── */
  const progressData = useMemo(() => {
    if (!caseData) return { steps: progressSteps.map((s) => ({ ...s, done: false, active: false })), pct: 0 };
    const has = {
      registered: true,
      evidence: caseData.evidence.length > 0,
      entity: caseData.entities.length > 0,
      timeline: caseData.timeline.length > 0,
      network: caseData.entities.length > 3,
      report: caseData.status === 'Closed' || caseData.status === 'Resolved',
    };
    const doneCount = Object.values(has).filter(Boolean).length;
    let foundActive = false;
    const steps = progressSteps.map((s) => {
      const done = has[s.key as keyof typeof has];
      const active = !done && !foundActive;
      if (active) foundActive = true;
      return { ...s, done, active };
    });
    return { steps, pct: Math.round((doneCount / progressSteps.length) * 100) };
  }, [caseData]);

  /* ── Graph nodes & edges (V2 — more complex) ── */
  const { initNodes, initEdges } = useMemo(() => {
    if (!caseData) return { initNodes: [], initEdges: [] };
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const edgeLabels: Record<string, string> = {
      'Phone Number': 'CONTACTED',
      'UPI ID': 'TRANSFERRED_TO',
      'Bank Account': 'LINKED_TO',
      'Telegram Handle': 'CONNECTED_TO',
      'Email Address': 'REGISTERED_WITH',
      Website: 'USED_BY',
      'Social Media': 'CONNECTED_TO',
      'IP Address': 'TRACED_TO',
    };

    // Victim node (center)
    const vCfg = entityGraphConfig['Victim'];
    nodes.push({
      id: 'victim',
      position: { x: 400, y: 0 },
      data: { label: `VICTIM\n${caseData.victim.name}`, entityType: 'Victim' },
      style: {
        background: vCfg.color, border: `2px solid ${vCfg.border}`, borderRadius: 10,
        padding: '12px 20px', color: '#f1f5f9', fontSize: 12, fontWeight: 700,
        minWidth: 180, textAlign: 'center', whiteSpace: 'pre-line',
        boxShadow: `0 0 20px ${vCfg.border}33`,
      },
    });

    // Entity nodes — radial layout
    const typeOrder = ['Phone Number','UPI ID','Bank Account','Telegram Handle','Email Address','Website','Social Media','IP Address'];
    const grouped: Record<string, Entity[]> = {};
    caseData.entities.forEach((e) => { if (!grouped[e.type]) grouped[e.type] = []; grouped[e.type].push(e); });

    let yOff = 130;
    typeOrder.forEach((type) => {
      const group = grouped[type];
      if (!group?.length) return;
      const typeCfg = entityGraphConfig[type] || entityGraphConfig['IP Address'];
      const totalW = group.length * 230;
      const startX = 400 - totalW / 2 + 115;

      group.forEach((entity, i) => {
        nodes.push({
          id: entity.id,
          position: { x: startX + i * 230, y: yOff },
          data: { label: `${entity.type}\n${entity.value}`, entityType: entity.type, entity },
          style: {
            background: typeCfg.color, border: `1px solid ${typeCfg.border}`,
            borderLeft: `4px solid ${typeCfg.border}`, borderRadius: 8,
            padding: '10px 14px', color: '#e2e8f0', fontSize: 11,
            minWidth: 175, whiteSpace: 'pre-line', cursor: 'pointer',
          },
        });

        // Edge from victim
        edges.push({
          id: `victim-${entity.id}`,
          source: 'victim', target: entity.id,
          label: edgeLabels[type] || 'LINKED_TO',
          labelStyle: { fill: '#94a3b8', fontSize: 8, fontWeight: 700, letterSpacing: '0.05em' },
          labelBgStyle: { fill: '#0f172a', fillOpacity: 0.9 },
          markerEnd: { type: MarkerType.ArrowClosed, color: typeCfg.border, width: 14, height: 14 },
          style: { stroke: typeCfg.border, strokeWidth: 1.5, opacity: 0.7 },
          animated: entity.riskLevel === 'High',
        });
      });
      yOff += 130;
    });

    // Cross-entity connections (from connectedEntities field)
    caseData.entities.forEach((entity: Entity) => {
      if (!entity.connectedEntities) return;
      entity.connectedEntities.forEach((cv: string) => {
        const target = caseData.entities.find((e: Entity) => e.value === cv);
        if (target && entity.id < target.id) {
          edges.push({
            id: `cross-${entity.id}-${target.id}`,
            source: entity.id, target: target.id,
            label: 'LINKED_TO',
            labelStyle: { fill: '#64748b', fontSize: 7, fontWeight: 600 },
            labelBgStyle: { fill: '#0f172a', fillOpacity: 0.8 },
            style: { stroke: '#475569', strokeWidth: 1, strokeDasharray: '5 3', opacity: 0.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#475569', width: 10, height: 10 },
          });
        }
      });
    });

    // Related case nodes
    relatedCases.slice(0, 3).forEach((rc, i) => {
      const lcCfg = entityGraphConfig['Linked Case'];
      const nodeId = `case-${rc.caseObj.id}`;
      nodes.push({
        id: nodeId,
        position: { x: -150 + i * 250, y: yOff + 40 },
        data: { label: `  ${rc.caseObj.id}\n${rc.caseObj.fraudCategory}`, entityType: 'Linked Case' },
        style: {
          background: lcCfg.color, border: `1px dashed ${lcCfg.border}`, borderRadius: 8,
          padding: '10px 14px', color: '#94a3b8', fontSize: 10, minWidth: 160,
          whiteSpace: 'pre-line', cursor: 'pointer', opacity: 0.8,
        },
      });
      // Connect to shared entity
      rc.sharedEntities.slice(0, 1).forEach((se) => {
        edges.push({
          id: `lc-${nodeId}-${se.id}`, source: se.id, target: nodeId,
          label: 'SHARED_ENTITY',
          labelStyle: { fill: '#64748b', fontSize: 7, fontWeight: 600 },
          labelBgStyle: { fill: '#0f172a', fillOpacity: 0.8 },
          style: { stroke: '#60a5fa', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.4 },
        });
      });
    });

    return { initNodes: nodes, initEdges: edges };
  }, [caseData, relatedCases]);

  // Memoized filtered and sorted entities
  const filteredEntities = useMemo(() => {
    if (!caseData) return [];
    let filtered = caseData.entities;
    
    if (entitySearch) {
      filtered = filtered.filter(e => 
        e.value.toLowerCase().includes(entitySearch.toLowerCase()) ||
        e.type.toLowerCase().includes(entitySearch.toLowerCase())
      );
    }
    
    if (entityTypeFilter) {
      filtered = filtered.filter(e => e.type === entityTypeFilter);
    }
    
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (entitySortBy === 'type') {
        comparison = a.type.localeCompare(b.type);
      } else if (entitySortBy === 'risk') {
        const riskOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        comparison = ((riskOrder[b.riskLevel] || 0) - (riskOrder[a.riskLevel] || 0));
      } else if (entitySortBy === 'occurrences') {
        comparison = (b.associatedCases || 0) - (a.associatedCases || 0);
      }
      return entitySortDir === 'desc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [caseData, entitySearch, entityTypeFilter, entitySortBy, entitySortDir]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);

  useEffect(() => {
    setNodes(initNodes);
    setEdges(initEdges);
  }, [initNodes, initEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Fetch backend graph data when graph tab is activated
  useEffect(() => {
    if (activeTab !== 'graph' || !caseId) return;
    api.get(`/cases/${caseId}/graph`).then((res) => {
      const map: Record<string, { confidence: number; related_case_count: number }> = {};
      (res.data?.nodes || []).forEach((n: any) => {
        map[n.value] = { confidence: n.confidence, related_case_count: n.related_case_count };
      });
      setGraphApiData(map);
    }).catch(() => { /* silently ignore — graph still works from local data */ });
  }, [activeTab, caseId]);

  // Fetch cross-case intelligence when that tab is activated
  useEffect(() => {
    if (activeTab !== 'intelligence' || !caseId) return;
    setLinkedLoading(true);
    api.get(`/cases/${caseId}/linked-cases`)
      .then(res => setLinkedCases(res.data))
      .catch(() => setLinkedCases({ total_linked_cases: 0, risk_badge: 'Low', matches: [] }))
      .finally(() => setLinkedLoading(false));
  }, [activeTab, caseId]);

  // Fetch officer notes when notes tab is activated
  const fetchNotes = () => {
    if (!caseId) return;
    setNotesLoading(true);
    api.get(`/cases/${caseId}/notes`)
      .then(res => setNotes(res.data?.notes || []))
      .catch(() => setNotesError('Failed to load notes.'))
      .finally(() => setNotesLoading(false));
  };
  useEffect(() => {
    if (activeTab !== 'notes') return;
    fetchNotes();
  }, [activeTab, caseId]);

  const handleAddNote = async () => {
    if (!noteText.trim() || !caseId) return;
    setNoteSubmitting(true);
    setNotesError('');
    setNoteSuccess('');
    try {
      await api.post(`/cases/${caseId}/notes`, {
        officer_name: user?.full_name || 'Officer',
        note_type: noteType,
        note_text: noteText.trim(),
      });
      setNoteText('');
      setNoteSuccess(`Note saved: "${noteType}"`);
      setTimeout(() => setNoteSuccess(''), 3000);
      fetchNotes();

      // Refresh timeline so the new event appears in the Timeline tab
      try {
        const tlRes = await api.get(`/cases/${caseId}/timeline`);
        if (caseData && tlRes.data) {
          const baseEvents = caseData.timeline.filter((t: TimelineEvent) => !t.id.match(/^[0-9a-f-]{36}$/));
          const persistedEvents = (tlRes.data || []).map((ev: any) => ({
            id: ev.id,
            time: new Date(ev.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            date: new Date(ev.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            title: ev.title,
            description: ev.title,    // show event title only — not note text
            type: ev.event_type as TimelineEvent['type'],
            investigatorNotes: ev.description
              ? `${ev.description}\n\nOfficer: ${ev.created_by || '—'}\nType: ${ev.title.replace('Officer Note Added — ', '')}`
              : ev.created_by ? `Officer: ${ev.created_by}` : undefined,
          }));
          const merged = [...baseEvents, ...persistedEvents].sort(
            (a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime()
          );
          setCaseData({ ...caseData, timeline: merged });
        }
      } catch { /* ignore */ }
    } catch {
      setNotesError('Failed to save note. Please try again.');
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await api.delete(`/notes/${noteId}`);
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch {
      setNotesError('Failed to delete note.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-[#98A2B3]">
        <Shield className="w-16 h-16 mb-4 text-[#00B8FF] animate-pulse" />
        <h2 className="text-xl font-semibold text-[#F8FAFC] mb-2">Loading Case Details...</h2>
        <p className="text-sm text-[#98A2B3]">Retrieving case files and generating intelligence report...</p>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-[#98A2B3]">
        <AlertTriangle className="w-16 h-16 mb-4 text-red-500" />
        <h2 className="text-xl font-semibold text-[#F8FAFC] mb-2">Error Loading Case</h2>
        <p className="text-sm mb-4 text-[#FF4D6D]">{apiError}</p>
        <Link to="/cases" className="text-sm text-[#00B8FF] hover:text-[#29C5FF]">← Back to Cases</Link>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-[#98A2B3]">
        <Shield className="w-16 h-16 mb-4 text-[#98A2B3]" />
        <h2 className="text-xl font-semibold text-[#F8FAFC] mb-2">Case Not Found</h2>
        <p className="text-sm mb-4">Case ID "{caseId}" does not exist.</p>
        <Link to="/cases" className="text-sm text-[#00B8FF] hover:text-[#29C5FF]">← Back to Cases</Link>
      </div>
    );
  }

  const selectedEv = caseData.evidence.find((e: Evidence) => e.id === selectedEvidence) ?? caseData.evidence[0];
  const entityTypes: string[] = [...new Set(caseData.entities.map((e: Entity) => e.type as string))];
  const filteredTimeline = caseData.timeline.filter((t: TimelineEvent) => {
    if (!timelineSearch) return true;
    const q = timelineSearch.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
  });

  /* ════════════════════════════════════════════
     RENDER - MODULE CONTENT ONLY
  ════════════════════════════════════════════ */
  
  return (
    <div className="space-y-4">

      {/* ═══════════════ TAB: INVESTIGATION BRIEF ═══════════════ */}
      {activeTab === 'brief' && (
        <div className="space-y-4">
          {/* Header + buttons */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00B8FF]" /> AI Investigation Brief
              </h3>
              <p className="text-xs text-[#98A2B3] mt-0.5">
                {brief?._meta?.cached
                  ? `Cached · Generated ${new Date(brief._meta.generated_at).toLocaleString('en-IN')} · ${brief._meta.model_used}`
                  : 'Powered by Gemini AI — grounded in case evidence only'}
              </p>
            </div>
            <div className="flex gap-2">
              {brief && (
                <button onClick={() => handleFetchBrief(true)} disabled={briefLoading}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs text-[#F8FAFC] border border-[#223047] rounded-lg hover:bg-[#0B1220] transition-colors disabled:opacity-40">
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                </button>
              )}
              {!brief && !briefLoading && (
                <button onClick={() => handleFetchBrief(false)} disabled={briefLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#00B8FF] hover:bg-[#00B8FF] text-slate-50 text-xs font-medium rounded-lg transition-colors disabled:opacity-40">
                  <Sparkles className="w-3.5 h-3.5" /> Generate Brief
                </button>
              )}
            </div>
          </div>

          {/* Loading */}
          {briefLoading && (
            <div className="flex flex-col items-center justify-center h-48 bg-[#121B2A] border border-[#223047]/50 rounded-lg text-[#98A2B3]">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-[#00B8FF]" />
              <p className="text-sm font-medium">Gemini is analysing the case…</p>
              <p className="text-xs text-[#98A2B3] mt-1">Gathering entities, evidence, timeline and cross-case data</p>
            </div>
          )}

          {/* Error */}
          {briefError && !briefLoading && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-[#FF4D6D] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-300 font-medium">Failed to generate brief</p>
                <p className="text-xs text-[#FF4D6D] mt-1">{briefError}</p>
                <button onClick={() => handleFetchBrief(false)} className="mt-2 text-xs text-red-300 underline">Retry</button>
              </div>
            </div>
          )}

          {/* Brief content */}
          {brief && !briefLoading && (() => {
            const CONF_COLOR = (n: number) => n >= 80 ? 'text-[#00D084]' : n >= 60 ? 'text-[#FFB020]' : 'text-[#FF4D6D]';
            const RISK_STYLE: Record<string,string> = {
              High: 'bg-red-500/15 text-[#FF4D6D] border-red-500/30',
              Medium: 'bg-amber-500/15 text-[#FFB020] border-amber-500/30',
              Low: 'bg-emerald-500/15 text-[#00D084] border-emerald-500/30',
            };
            const PRI_COLOR = (n: number) => n === 1 ? 'bg-red-500 text-slate-50' : n === 2 ? 'bg-amber-500 text-slate-50' : 'bg-[#0B1220] text-[#F8FAFC]';
            const IMP_STYLE: Record<string,string> = {
              Critical: 'text-[#FF4D6D]', High: 'text-[#FFB020]', Medium: 'text-[#00B8FF]',
            };

            return (
              <div className="space-y-4">

                {/* Executive Summary */}
                {brief.executive_summary && (
                  <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-5">
                    <h4 className="text-xs font-semibold text-[#00B8FF] uppercase tracking-wider mb-2">Executive Summary</h4>
                    <p className="text-sm text-[#F8FAFC] leading-relaxed">{brief.executive_summary}</p>
                  </div>
                )}

                {/* Case Assessment */}
                {brief.case_assessment && (
                  <div className="bg-[#121B2A] border border-[#223047]/50 rounded-lg p-5">
                    <h4 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-3">Case Assessment</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Crime Type', value: brief.case_assessment.crime_type },
                        { label: 'Severity', value: brief.case_assessment.severity },
                        { label: 'Confidence', value: `${brief.case_assessment.confidence}%` },
                        { label: 'Organised Crime', value: brief.case_assessment.organized_crime ? 'Yes' : 'No' },
                      ].map(item => (
                        <div key={item.label} className="bg-[#0d1525] rounded-lg p-3">
                          <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider">{item.label}</p>
                          <p className="text-sm font-semibold text-[#F8FAFC] mt-0.5">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    {brief.case_assessment.reason && (
                      <p className="text-xs text-[#98A2B3] mt-3 italic">{brief.case_assessment.reason}</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Key Findings */}
                  {brief.key_findings?.length > 0 && (
                    <div className="bg-[#121B2A] border border-[#223047]/50 rounded-lg p-5">
                      <h4 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-3">Key Findings</h4>
                      <div className="space-y-3">
                        {brief.key_findings.map((f: any, i: number) => (
                          <div key={i} className="border-l-2 border-[#00B8FF]/40 pl-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-[#F8FAFC]">{f.title}</p>
                              <span className={`text-[10px] font-bold tabular-nums ${CONF_COLOR(f.confidence)}`}>{f.confidence}%</span>
                            </div>
                            <p className="text-xs text-[#98A2B3] mt-0.5">{f.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Primary Entities */}
                  {brief.primary_entities?.length > 0 && (
                    <div className="bg-[#121B2A] border border-[#223047]/50 rounded-lg p-5">
                      <h4 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-3">Primary Entities</h4>
                      <div className="space-y-2">
                        {brief.primary_entities.map((e: any, i: number) => (
                          <div key={i} className="flex items-start justify-between gap-2 p-2.5 bg-[#0d1525] rounded-lg">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-mono text-[#F8FAFC] truncate">{e.entity}</p>
                              <p className="text-[10px] text-[#98A2B3] mt-0.5">{e.type} — {e.reason}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium border shrink-0 ${RISK_STYLE[e.risk] || RISK_STYLE['Medium']}`}>{e.risk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Recommended Actions */}
                {brief.recommended_actions?.length > 0 && (
                  <div className="bg-[#121B2A] border border-[#223047]/50 rounded-lg p-5">
                    <h4 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-3">Recommended Actions</h4>
                    <div className="space-y-2">
                      {brief.recommended_actions.map((a: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-[#0d1525] rounded-lg">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${PRI_COLOR(a.priority)}`}>{a.priority}</span>
                          <div>
                            <p className="text-sm text-[#F8FAFC]">{a.action}</p>
                            <p className="text-xs text-[#98A2B3] mt-0.5">{a.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Missing Evidence */}
                  {brief.missing_evidence?.length > 0 && (
                    <div className="bg-[#121B2A] border border-[#223047]/50 rounded-lg p-5">
                      <h4 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-3">Missing Evidence</h4>
                      <div className="space-y-2">
                        {brief.missing_evidence.map((m: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 p-2.5 bg-[#0d1525] rounded-lg">
                            <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${IMP_STYLE[m.importance] || 'text-[#98A2B3]'}`} />
                            <div>
                              <p className="text-xs font-medium text-[#F8FAFC]">{m.item}</p>
                              <p className="text-[10px] text-[#98A2B3] mt-0.5">{m.reason}</p>
                            </div>
                            <span className={`ml-auto text-[9px] font-bold shrink-0 ${IMP_STYLE[m.importance] || 'text-[#98A2B3]'}`}>{m.importance}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recovery + Legal */}
                  <div className="space-y-3">
                    {brief.recovery_assessment && (
                      <div className="bg-[#121B2A] border border-[#223047]/50 rounded-lg p-4">
                        <h4 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-2">Recovery Assessment</h4>
                        <div className="flex items-center gap-3">
                          <div className={`text-2xl font-black ${brief.recovery_assessment.probability >= 60 ? 'text-[#00D084]' : brief.recovery_assessment.probability >= 35 ? 'text-[#FFB020]' : 'text-[#FF4D6D]'}`}>
                            {brief.recovery_assessment.probability}%
                          </div>
                          <p className="text-xs text-[#98A2B3] leading-relaxed">{brief.recovery_assessment.reason}</p>
                        </div>
                      </div>
                    )}
                    {brief.legal_actions?.length > 0 && (
                      <div className="bg-[#121B2A] border border-[#223047]/50 rounded-lg p-4">
                        <h4 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-2">Legal Actions</h4>
                        <div className="space-y-2">
                          {brief.legal_actions.map((l: any, i: number) => (
                            <div key={i} className="p-2.5 bg-[#0d1525] rounded-lg">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-[#FFB020] border border-amber-500/30 font-medium">{l.agency}</span>
                              </div>
                              <p className="text-xs text-[#F8FAFC]">{l.request}</p>
                              <p className="text-[10px] text-[#98A2B3] mt-0.5">{l.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Next Steps */}
                {brief.investigation_next_steps?.length > 0 && (
                  <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-5">
                    <h4 className="text-xs font-semibold text-[#00B8FF] uppercase tracking-wider mb-3">Investigation Next Steps</h4>
                    <ol className="space-y-2">
                      {brief.investigation_next_steps.map((step: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <span className="w-5 h-5 rounded-full bg-[#00B8FF]/10 text-[#00B8FF] border border-[#00B8FF]/20 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i+1}</span>
                          <span className="text-[#F8FAFC] leading-snug">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB: OVERVIEW  (Enhanced with Professional Cards)
      ═══════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Enhanced Overview Cards */}
          <EnhancedOverviewSection 
            caseData={caseData}
            recovery={recovery}
            crossCaseMatches={linkedCases?.total_linked_cases || 0}
            riskScore={riskScore}
          />
          
          {/* Investigation Progress */}
          <InvestigationProgress 
            caseData={caseData}
            hasAIReport={hasAIReport}
            hasOCRProcessed={hasOCRProcessed}
            crossCaseMatches={linkedCases?.total_linked_cases || 0}
            recovery={recovery}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Summary */}
            <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-5">
              <h3 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-3">Case Summary</h3>
              <p className="text-sm text-[#F8FAFC] leading-relaxed">{caseData.description}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {caseData.tags.map((tag: string) => (
                  <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[#0B1220]/80 text-[#F8FAFC] border border-[#223047]">
                    <Tag className="w-2.5 h-2.5" />{tag}
                  </span>
                ))}
              </div>
            </div>
            {/* ── Related Investigations ── */}
            {relatedCases.length > 0 && (
              <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-5">
                <h3 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-[#00B8FF]" /> Related Investigations ({relatedCases.length})
                </h3>
                <div className="space-y-2">
                  {relatedCases.map((rc) => (
                    <Link key={rc.caseObj.id} to={`/cases/${rc.caseObj.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-[#223047] hover:border-[#223047] hover:bg-[#0B1220]/50 transition-all group">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-mono text-[#00B8FF]">{rc.caseObj.id}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${priorityStyle[rc.caseObj.priority as CasePriority]}`}>{rc.caseObj.priority}</span>
                        </div>
                        <p className="text-sm text-[#F8FAFC] truncate">{rc.caseObj.title}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {rc.sharedEntities.map((se) => (
                            <span key={se.id} className="text-[10px] px-1.5 py-0.5 rounded bg-[#00B8FF]/10 text-[#00B8FF] border border-[#00B8FF]/20 font-mono">
                              {se.value}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#98A2B3] group-hover:text-[#98A2B3] shrink-0 ml-2" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Right column */}
          <div className="space-y-4">
            <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-5">
              <h3 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-4">Victim Profile</h3>
              <dl className="space-y-3">
                {[['Full Name', caseData.victim.name],['Contact', caseData.victim.contact],['Email', caseData.victim.email],
                  ...(caseData.victim.age ? [['Age', `${caseData.victim.age} years`]] : []),
                  ...(caseData.victim.occupation ? [['Occupation', caseData.victim.occupation]] : []),
                  ['Address', caseData.victim.address]].map(([k, v]) => (
                  <div key={k as string}><dt className="text-[10px] text-[#98A2B3] uppercase tracking-wider">{k}</dt><dd className="text-sm text-[#F8FAFC]">{v}</dd></div>
                ))}
              </dl>
              <button
                onClick={() => {
                  alert(`Notification sent to ${caseData.victim.name} via ${caseData.victim.email} and ${caseData.victim.contact}`);
                }}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-xs text-[#00B8FF] border border-[#223047] rounded-lg hover:bg-[#00B8FF]/10 transition-colors"
              >
                <Mail className="w-3 h-3" /> Notify Victim
              </button>
            </div>
            <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-5">
              <h3 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-4">Assigned Officer</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-600 to-cyan-700 flex items-center justify-center text-sm font-bold text-slate-50">
                  {caseData.assignedOfficer.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#F8FAFC]">{caseData.assignedOfficer.name}</p>
                  <p className="text-xs text-[#98A2B3]">{caseData.assignedOfficer.rank}</p>
                </div>
              </div>
              <p className="text-xs text-[#98A2B3]">{caseData.assignedOfficer.department}</p>
            </div>
            <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-5">
              <h3 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-3">Case Dates</h3>
              <dl className="space-y-2.5">
                <div><dt className="text-[10px] text-[#98A2B3] uppercase tracking-wider">Filed</dt><dd className="text-sm text-[#F8FAFC]">{formatDateTime(caseData.createdAt)}</dd></div>
                <div><dt className="text-[10px] text-[#98A2B3] uppercase tracking-wider">Last Updated</dt><dd className="text-sm text-[#F8FAFC]">{formatDateTime(caseData.updatedAt)}</dd></div>
                {caseData.closedAt && <div><dt className="text-[10px] text-[#98A2B3] uppercase tracking-wider">Closed</dt><dd className="text-sm text-[#00D084]">{formatDateTime(caseData.closedAt)}</dd></div>}
              </dl>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* ═══════════════ TAB: COMPLAINT ═══════════════ */}
      {activeTab === 'complaint' && (
        <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2"><FileText className="w-4 h-4 text-[#00B8FF]" /> Official Complaint Statement</h3>
              <p className="text-xs text-[#98A2B3] mt-0.5">Filed on {formatDate(caseData.createdAt)} • Verbatim transcript</p>
            </div>
            <span className="px-2.5 py-1 rounded text-xs bg-emerald-500/10 text-[#00D084] border border-emerald-500/20">Verified</span>
          </div>
          <div className="border-l-2 border-[#00B8FF]/40 pl-5 text-sm text-[#F8FAFC] leading-[1.9] whitespace-pre-wrap">{caseData.complaintText}</div>
        </div>
      )}

      {/* ═══════════════ TAB: EVIDENCE (V2 - ENTERPRISE WORKSPACE) ═══════════════ */}
      {activeTab === 'evidence' && (
        <EnterpriseEvidenceWorkspace
          evidence={caseData.evidence}
          caseData={caseData}
          analyzingId={analyzingId}
          analysisCache={analysisCache}
          onAnalyze={handleAnalyzeEvidence}
          onViewAnalysis={handleViewAnalysis}
        />
      )}

      {/* ── Evidence Analysis Modal ── */}
      {analysisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setAnalysisModal(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#070B14] border border-[#223047] rounded-lg shadow-2xl flex flex-col overflow-hidden"
               onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#223047] bg-[#121B2A]">
              <div>
                <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#00B8FF]" /> Evidence Analysis
                </h3>
                <p className="text-xs text-[#98A2B3] mt-0.5">{analysisModal.filename}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                  analysisModal.status === 'completed' ? 'bg-emerald-500/15 text-[#00D084] border-emerald-500/30' :
                  analysisModal.status === 'failed'    ? 'bg-red-500/15 text-[#FF4D6D] border-red-500/30' :
                  'bg-amber-500/15 text-[#FFB020] border-amber-500/30'
                }`}>{analysisModal.status.toUpperCase()}</span>
                <button onClick={() => setAnalysisModal(null)}
                  className="p-1.5 rounded-lg hover:bg-[#0B1220]/50 text-[#98A2B3] hover:text-[#F8FAFC] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-6 space-y-5 flex-1">

              {/* Entity summary tiles */}
              {analysisModal.entities.length > 0 && (() => {
                const counts: Record<string,number> = {};
                analysisModal.entities.forEach(e => { counts[e.type] = (counts[e.type]||0)+1; });
                const ICONS: Record<string,string> = {
                  phone:'', upi:'', email:'✉️', url:'',
                  telegram:'', bank:'', ifsc:'🔢', amount:'₹'
                };
                return (
                  <div>
                    <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-2">
                      Entities Found — {analysisModal.entity_count} total
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(counts).map(([type, count]) => (
                        <span key={type} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0B1220]/50 border border-[#223047] text-xs text-[#F8FAFC]">
                          <span>{ICONS[type]||'🔷'}</span>
                          <span className="capitalize">{type}</span>
                          <span className="font-bold text-slate-50">{count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Extracted entities table */}
              {analysisModal.entities.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-2">Extracted Entities</p>
                  <div className="bg-[#121B2A] border border-[#223047] rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#070B14] border-b border-[#223047]">
                          <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#98A2B3] uppercase tracking-wider">Type</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#98A2B3] uppercase tracking-wider">Value</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#98A2B3] uppercase tracking-wider">Confidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {analysisModal.entities.map((ent, i) => (
                          <tr key={i} className="hover:bg-[#0B1220]/50 transition-colors">
                            <td className="px-4 py-2.5">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-[#0B1220] text-[#F8FAFC] capitalize">{ent.type}</span>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-xs text-[#F8FAFC]">{ent.value}</td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-[#0B1220]/50 rounded-full overflow-hidden max-w-[60px]">
                                  <div className={`h-full rounded-full ${ent.confidence >= 90 ? 'bg-emerald-500' : ent.confidence >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                                       style={{width: `${ent.confidence}%`}} />
                                </div>
                                <span className="text-[10px] text-[#98A2B3] tabular-nums">{ent.confidence}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {analysisModal.entities.length === 0 && analysisModal.status === 'completed' && (
                <div className="flex flex-col items-center justify-center py-8 text-[#98A2B3]">
                  <Search className="w-10 h-10 mb-2 text-[#98A2B3]" />
                  <p className="text-sm">No entities detected in this file.</p>
                </div>
              )}

              {/* Raw OCR text */}
              {analysisModal.raw_text && (
                <div>
                  <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-2">
                    Raw OCR Text — {analysisModal.characters} characters
                  </p>
                  <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-4 max-h-48 overflow-y-auto">
                    <pre className="text-xs text-[#98A2B3] whitespace-pre-wrap font-mono leading-relaxed">{analysisModal.raw_text}</pre>
                  </div>
                </div>
              )}

              {/* Error */}
              {analysisModal.status === 'failed' && analysisModal.error_message && (
                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-[#FF4D6D] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#FF4D6D]">{analysisModal.error_message}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-[#223047] flex justify-between items-center">
              <p className="text-xs text-[#98A2B3]">
                {analysisModal.entities.length > 0
                  ? `${analysisModal.entities.length} entities auto-saved to case intelligence`
                  : 'Entities will be auto-saved to case after analysis'}
              </p>
              <button onClick={() => setAnalysisModal(null)}
                className="px-4 py-1.5 text-xs text-[#F8FAFC] border border-[#223047] rounded-lg hover:bg-[#0B1220]/50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ TAB: TIMELINE (V2 + Drawer) ═══════════════ */}
      {activeTab === 'timeline' && (
        <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#F8FAFC]">Investigation Timeline</h3>
              <p className="text-xs text-[#98A2B3] mt-0.5">{filteredTimeline.length} events • Click any event for full analysis</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#98A2B3]" />
                <input type="text" value={timelineSearch} onChange={(e) => setTimelineSearch(e.target.value)} placeholder="Search timeline..."
                  className="pl-8 pr-3 py-1.5 w-48 bg-[#070B14] border border-[#223047] rounded-lg text-xs text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#00B8FF]/50 transition-colors" />
              </div>
              <div className="flex gap-1">
                {Object.entries(timelineConfig).slice(0, 4).map(([type, c]) => (
                  <span key={type} className={`px-1.5 py-0.5 text-[10px] rounded border ${c.badge}`}>{c.label}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute left-[88px] top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/40 via-slate-700/40 to-transparent" />
            <div className="space-y-2">
              {filteredTimeline.map((event: TimelineEvent, idx: number) => {
                const cfg = timelineConfig[event.type] || timelineConfig['action'];
                const isExpanded = expandedTimeline.has(event.id);
                const risk = event.riskScore ?? (event.type === 'escalation' || event.type === 'transaction' ? 80 : 40);
                const linkedEvidence = (event.linkedEvidenceIds || []).map((eid: string) => caseData.evidence.find((e: Evidence) => e.id === eid)).filter(Boolean) as Evidence[];
                const linkedEntities = (event.linkedEntityIds || []).map((eid: string) => caseData.entities.find((e: Entity) => e.id === eid)).filter(Boolean) as Entity[];
                return (
                  <div key={event.id} className="relative flex items-start gap-0">
                    <div className="w-[88px] shrink-0 text-right pr-5 pt-3.5">
                      <p className="text-[10px] font-mono text-[#98A2B3]">{event.date.slice(5)}</p>
                      <p className="text-xs font-mono text-[#00B8FF] font-medium">{event.time}</p>
                    </div>
                    <div className={`absolute left-[84px] top-3.5 w-[9px] h-[9px] rounded-full ${cfg.color} ring-4 ring-[#061070] z-10`} />
                    <div className={`ml-8 flex-1 rounded-lg border transition-all mb-2 overflow-hidden cursor-pointer ${isExpanded ? 'border-[#223047] bg-[#070B14]' : 'border-[#223047] bg-[#121B2A]/40 hover:border-[#223047]'}`}
                      onClick={() => { const next = new Set(expandedTimeline); if (next.has(event.id)) next.delete(event.id); else next.add(event.id); setExpandedTimeline(next); }}>
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`px-2 py-0.5 text-[10px] font-medium rounded border ${cfg.badge} shrink-0`}>{cfg.label}</span>
                          <h4 className="text-sm font-medium text-[#F8FAFC] truncate">{event.title}</h4>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded tabular-nums ${risk >= 80 ? 'bg-red-500/15 text-[#FF4D6D]' : risk >= 50 ? 'bg-amber-500/15 text-[#FFB020]' : 'bg-[#0B1220] text-[#98A2B3]'}`}>{risk}/100</span>
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[#98A2B3]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#98A2B3]" />}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className={`px-4 pb-4 pt-0 border-t border-[#223047] ${cfg.bg}`}>
                          <p className="text-sm text-[#F8FAFC] leading-relaxed mt-3">{event.description}</p>
                          {linkedEntities.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {linkedEntities.map((ent) => (
                                <span key={ent.id} className="text-[10px] px-2 py-0.5 rounded-full bg-[#00B8FF]/10 text-[#00B8FF] border border-[#00B8FF]/20 font-mono">{ent.value}</span>
                              ))}
                            </div>
                          )}
                          {linkedEvidence.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {linkedEvidence.map((ev) => (
                                <span key={ev.id} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1"><File className="w-2.5 h-2.5" />{ev.fileName}</span>
                              ))}
                            </div>
                          )}
                          {event.investigatorNotes && (
                            <div className="mt-3 p-2.5 rounded-lg bg-[#121B2A]/60 border border-[#223047]">
                              <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-1">Investigator Notes</p>
                              <p className="text-xs text-[#98A2B3] italic leading-relaxed">{event.investigatorNotes}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#223047]/50">
                            <span className="text-[10px] text-[#98A2B3]">Event #{idx + 1} of {caseData.timeline.length}</span>
                            <button onClick={(e) => { e.stopPropagation(); setTimelineDrawer(event); }}
                              className="text-[10px] text-[#00B8FF] hover:text-[#29C5FF] flex items-center gap-1"><Eye className="w-2.5 h-2.5" /> Full Analysis</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Timeline Event Drawer ── */}
      <Drawer open={!!timelineDrawer} onClose={() => setTimelineDrawer(null)} title="Event Analysis">
        {timelineDrawer && (() => {
          const ev = timelineDrawer;
          const cfg = timelineConfig[ev.type] || timelineConfig['action'];
          const risk = ev.riskScore ?? 50;
          const linkedEvidence = (ev.linkedEvidenceIds || []).map((eid: string) => caseData.evidence.find((e: Evidence) => e.id === eid)).filter(Boolean) as Evidence[];
          const linkedEntities = (ev.linkedEntityIds || []).map((eid: string) => caseData.entities.find((e: Entity) => e.id === eid)).filter(Boolean) as Entity[];
          return (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <RiskScoreBadge score={risk} />
                <div><h4 className="text-sm font-semibold text-[#F8FAFC]">{ev.title}</h4><span className={`px-2 py-0.5 text-[10px] font-medium rounded border ${cfg.badge}`}>{cfg.label}</span></div>
              </div>
              <dl className="space-y-3 text-sm">
                <div><dt className="text-[10px] text-[#98A2B3] uppercase tracking-wider">Date & Time</dt><dd className="text-[#F8FAFC] mt-0.5 font-mono text-xs">{ev.date} at {ev.time}</dd></div>
                <div><dt className="text-[10px] text-[#98A2B3] uppercase tracking-wider">Description</dt><dd className="text-[#F8FAFC] mt-0.5 text-xs leading-relaxed">{ev.description}</dd></div>
                <div><dt className="text-[10px] text-[#98A2B3] uppercase tracking-wider">Risk Score</dt><dd className="mt-1"><RiskBar level={risk >= 80 ? 'High' : risk >= 50 ? 'Medium' : 'Low'} score={risk} /></dd></div>
              </dl>
              {linkedEntities.length > 0 && (
                <div><h5 className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-2">Linked Entities</h5>
                  {linkedEntities.map((ent) => (
                    <div key={ent.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#121B2A] border border-[#223047] mb-1.5">
                      <div><p className="text-xs font-mono text-[#F8FAFC]">{ent.value}</p><p className="text-[10px] text-[#98A2B3]">{ent.type}</p></div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${ent.riskLevel === 'High' ? 'bg-red-500/15 text-[#FF4D6D]' : 'bg-amber-500/15 text-[#FFB020]'}`}>{ent.riskLevel}</span>
                    </div>
                  ))}
                </div>
              )}
              {linkedEvidence.length > 0 && (
                <div><h5 className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-2">Linked Evidence</h5>
                  {linkedEvidence.map((ev) => {
                    const ecfg = evidenceConfig[ev.type] || evidenceConfig['Screenshot'];
                    return (
                      <div key={ev.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#121B2A] border border-[#223047] mb-1.5">
                        <ecfg.icon className={`w-3.5 h-3.5 ${ecfg.color} shrink-0`} />
                        <div><p className="text-xs text-[#F8FAFC]">{ev.fileName}</p><p className="text-[10px] text-[#98A2B3]">{ev.type} • {ev.fileSize}</p></div>
                      </div>
                    );
                  })}
                </div>
              )}
              {ev.investigatorNotes && (
                <div><h5 className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-2">Investigator Notes</h5>
                  <div className="p-3 rounded-lg bg-[#121B2A] border border-[#223047] space-y-2">
                    {ev.investigatorNotes.split('\n\n').map((block, i) => (
                      <p key={i} className={`text-xs leading-relaxed whitespace-pre-wrap ${i === 0 ? 'text-[#F8FAFC]' : 'text-[#98A2B3]'}`}>{block}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Drawer>

      {/* ═══════════════ TAB: ENTITY INTELLIGENCE (V2 + Drawer) ═══════════════ */}
      {activeTab === 'entities' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
              <input type="text" value={entitySearch} onChange={(e) => setEntitySearch(e.target.value)} placeholder="Search entities, notes..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#070B14] border border-[#223047] rounded-lg text-sm text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#00B8FF]/50 transition-colors" />
            </div>
            <select value={entityTypeFilter} onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="bg-[#070B14] border border-[#223047] text-[#F8FAFC] rounded-lg text-sm px-3 py-2.5 focus:outline-none focus:border-[#00B8FF]/50 appearance-none cursor-pointer">
              <option value="">All Entity Types</option>
              {entityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[{ label: 'High Risk', count: caseData.entities.filter((e: Entity) => e.riskLevel === 'High').length, color: 'text-[#FF4D6D] bg-red-500/10 border-red-500/20' },
              { label: 'Medium Risk', count: caseData.entities.filter((e: Entity) => e.riskLevel === 'Medium').length, color: 'text-[#FFB020] bg-amber-500/10 border-amber-500/20' },
              { label: 'Low Risk', count: caseData.entities.filter((e: Entity) => e.riskLevel === 'Low').length, color: 'text-[#00D084] bg-emerald-500/10 border-emerald-500/20' },
            ].map((s) => (
              <div key={s.label} className={`rounded-lg border px-4 py-3 ${s.color}`}>
                <p className="text-xl font-bold">{s.count}</p><p className="text-xs mt-0.5 opacity-80">{s.label} Entities</p>
              </div>
            ))}
          </div>
          {entityTypes.filter((t: string) => !entityTypeFilter || t === entityTypeFilter).map((type: string) => {
            const group = filteredEntities.filter((e: Entity) => e.type === type);
            if (!group.length) return null;
            const Icon = entityTypeIcon[type] || Hash;
            const gCfg = entityGraphConfig[type] || entityGraphConfig['IP Address'];
            return (
              <div key={type}>
                <h3 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" style={{ color: gCfg.border }} />{type}s ({group.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {group.map((entity: Entity) => (
                    <div key={entity.id} onClick={() => setEntityDrawer(entity)}
                      className="bg-[#121B2A] border border-[#223047] rounded-lg p-4 hover:border-[#223047] transition-all cursor-pointer"
                      style={{ borderLeft: `3px solid ${gCfg.border}` }}>
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-mono text-slate-50 break-all leading-snug">{entity.value}</p>
                        <span className={`ml-2 shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${entity.riskLevel === 'High' ? 'bg-red-500/15 text-[#FF4D6D]' : entity.riskLevel === 'Medium' ? 'bg-amber-500/15 text-[#FFB020]' : 'bg-emerald-500/15 text-[#00D084]'}`}>{entity.riskLevel}</span>
                      </div>
                      <p className="text-xs text-[#98A2B3] mb-3">{entity.label}</p>
                      <RiskBar level={entity.riskLevel} score={entity.riskScore} />
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#223047]">
                        <div><p className="text-[10px] text-[#98A2B3] uppercase tracking-wider">Linked Cases</p><p className="text-sm font-semibold text-[#F8FAFC] mt-0.5">{entity.associatedCases}</p></div>
                        <div><p className="text-[10px] text-[#98A2B3] uppercase tracking-wider">First Seen</p><p className="text-xs text-[#F8FAFC] mt-0.5">{entity.firstSeen}</p></div>
                      </div>
                      {entity.statesDetected && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entity.statesDetected.slice(0, 3).map((s: string) => (<span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-[#0B1220]/50 text-[#98A2B3] border border-[#223047]">{s}</span>))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Entity Detail Drawer ── */}
      <Drawer open={!!entityDrawer} onClose={() => setEntityDrawer(null)} title="Entity Intelligence">
        {entityDrawer && (() => {
          const ent = entityDrawer;
          const gCfg = entityGraphConfig[ent.type] || entityGraphConfig['IP Address'];
          const Icon = entityTypeIcon[ent.type] || Hash;
          return (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <RiskScoreBadge score={ent.riskScore ?? 50} />
                <div><p className="text-sm font-mono text-[#F8FAFC] break-all">{ent.value}</p><span className="text-xs text-[#98A2B3]">{ent.type}</span></div>
              </div>
              <div className="p-3 rounded-lg border" style={{ borderColor: gCfg.border + '40', background: gCfg.color + '33' }}>
                <p className="text-xs text-[#F8FAFC] font-medium">{ent.label}</p>
              </div>
              <dl className="space-y-3">
                <div><dt className="text-[10px] text-[#98A2B3] uppercase tracking-wider">Risk Score</dt><dd className="mt-1"><RiskBar level={ent.riskLevel} score={ent.riskScore} /></dd></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><dt className="text-[10px] text-[#98A2B3] uppercase tracking-wider">Linked Cases</dt><dd className="text-lg font-bold text-[#F8FAFC] mt-0.5">{ent.associatedCases}</dd></div>
                  <div><dt className="text-[10px] text-[#98A2B3] uppercase tracking-wider">First Seen</dt><dd className="text-xs text-[#F8FAFC] mt-0.5">{ent.firstSeen}</dd></div>
                </div>
                <div><dt className="text-[10px] text-[#98A2B3] uppercase tracking-wider">Last Seen</dt><dd className="text-xs text-[#F8FAFC] mt-0.5">{ent.lastSeen}</dd></div>
              </dl>
              {ent.statesDetected && ent.statesDetected.length > 0 && (
                <div><h5 className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-2 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> States Detected</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {ent.statesDetected.map((s: string) => (<span key={s} className="px-2.5 py-1 text-xs rounded-lg bg-[#121B2A] text-[#F8FAFC] border border-[#223047]">{s}</span>))}
                  </div>
                </div>
              )}
              {ent.connectedEntities && ent.connectedEntities.length > 0 && (
                <div><h5 className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-2 flex items-center gap-1"><Link2 className="w-2.5 h-2.5" /> Connected Entities</h5>
                  {ent.connectedEntities.map((cv) => {
                    const linked = caseData.entities.find((e: Entity) => e.value === cv);
                    return (
                      <div key={cv} className="flex items-center justify-between p-2.5 rounded-lg bg-[#121B2A] border border-[#223047] mb-1.5 cursor-pointer hover:border-[#223047] transition-colors"
                        onClick={() => { if (linked) setEntityDrawer(linked); }}>
                        <div><p className="text-xs font-mono text-[#F8FAFC]">{cv}</p>{linked && <p className="text-[10px] text-[#98A2B3]">{linked.type}</p>}</div>
                        {linked && <span className={`text-[10px] px-1.5 py-0.5 rounded ${linked.riskLevel === 'High' ? 'bg-red-500/15 text-[#FF4D6D]' : 'bg-amber-500/15 text-[#FFB020]'}`}>{linked.riskLevel}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
              {ent.investigatorNotes && (
                <div><h5 className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-2">Investigator Notes</h5>
                  <div className="p-3 rounded-lg bg-[#121B2A] border border-[#223047]"><p className="text-xs text-[#98A2B3] italic leading-relaxed">{ent.investigatorNotes}</p></div>
                </div>
              )}
            </div>
          );
        })()}
      </Drawer>

      {/* ═══════════════ TAB: RELATIONSHIP GRAPH V3 (ENTERPRISE) ═══════════════ */}
      {activeTab === 'graph' && caseData && (
        <EnterpriseRelationshipGraph
          caseData={caseData}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          selectedNode={selectedNode}
          graphSearch={graphSearch}
          setGraphSearch={setGraphSearch}
          entityGraphConfig={entityGraphConfig}
          graphApiData={graphApiData}
          linkedCases={linkedCases}
          setEntityDrawer={setEntityDrawer}
        />
      )}

      {/* ═══════════════ TAB: CROSS-CASE INTELLIGENCE ═══════════════ */}
      {activeTab === 'intelligence' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#00B8FF]" /> Cross-Case Intelligence
              </h3>
              <p className="text-xs text-[#98A2B3] mt-0.5">Entities shared with other cybercrime cases in the system</p>
            </div>
            {linkedCases && (
              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                linkedCases.risk_badge === 'Critical' ? 'bg-red-500/15 text-[#FF4D6D] border-red-500/30' :
                linkedCases.risk_badge === 'High'     ? 'bg-amber-500/15 text-[#FFB020] border-amber-500/30' :
                linkedCases.risk_badge === 'Medium'   ? 'bg-[#00B8FF]/10 text-[#00B8FF] border-[#00B8FF]/20' :
                                                        'bg-[#98A2B3]/15 text-[#98A2B3] border-[#223047]/30'
              }`}>
                {linkedCases.risk_badge} RISK · {linkedCases.total_linked_cases} linked case{linkedCases.total_linked_cases !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Loading */}
          {linkedLoading && (
            <div className="flex items-center justify-center h-40 text-[#98A2B3]">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Scanning case database...
            </div>
          )}

          {/* No matches */}
          {!linkedLoading && linkedCases && linkedCases.matches.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 bg-[#121B2A] border border-[#223047] rounded-lg text-[#98A2B3]">
              <Shield className="w-10 h-10 mb-2 text-[#98A2B3]" />
              <p className="text-sm font-medium">No shared entities detected</p>
              <p className="text-xs mt-1">This case has no overlapping phone numbers, UPI IDs, emails, Telegram handles or bank accounts with other cases.</p>
            </div>
          )}

          {/* Matches grouped by entity type */}
          {!linkedLoading && linkedCases && linkedCases.matches.length > 0 && (() => {
            const ENTITY_DISPLAY: Record<string, { label: string; icon: string; color: string; border: string }> = {
              phone:    { label: 'Shared Phone Numbers',    icon: '', color: 'text-[#FFB020]',  border: 'border-amber-500/30' },
              upi:      { label: 'Shared UPI IDs',          icon: '', color: 'text-purple-400', border: 'border-purple-500/30' },
              email:    { label: 'Shared Email Addresses',  icon: '✉️', color: 'text-pink-400',   border: 'border-pink-500/30' },
              telegram: { label: 'Shared Telegram Handles', icon: '', color: 'text-[#00B8FF]', border: 'border-indigo-500/30' },
              bank:     { label: 'Shared Bank Accounts',    icon: '', color: 'text-[#00D084]',border: 'border-emerald-500/30' },
            };

            // Group matches by entity_type
            const grouped: Record<string, typeof linkedCases.matches> = {};
            linkedCases.matches.forEach(m => {
              if (!grouped[m.entity_type]) grouped[m.entity_type] = [];
              grouped[m.entity_type].push(m);
            });

            return Object.entries(grouped).map(([type, items]) => {
              const cfg = ENTITY_DISPLAY[type] || { label: `Shared ${type}`, icon: '🔗', color: 'text-[#98A2B3]', border: 'border-[#223047]' };
              return (
                <div key={type} className="bg-[#121B2A] border border-[#223047] rounded-lg overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-[#223047] bg-[#070B14]">
                    <span className="text-base">{cfg.icon}</span>
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>
                      ⚠ {cfg.label}
                    </h4>
                    <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-bold border ${cfg.color} ${cfg.border} bg-transparent`}>
                      {items.length} match{items.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-800">
                    {items.map((m, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-[#0B1220]/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <code className={`text-sm font-mono font-bold ${cfg.color}`}>{m.shared_value}</code>
                          <span className="text-[#98A2B3]">→</span>
                          <div className="min-w-0">
                            <Link
                              to={`/cases/${m.related_case_id}`}
                              className="text-xs font-mono text-[#00B8FF] hover:text-[#29C5FF] transition-colors"
                            >
                              {m.related_case_number}
                            </Link>
                            <p className="text-xs text-[#98A2B3] truncate">{m.related_case_title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                            m.related_case_status === 'Open' ? 'bg-[#00B8FF]/10 text-[#00B8FF] border-[#00B8FF]/20' :
                            m.related_case_status === 'Escalated' ? 'bg-red-500/10 text-[#FF4D6D] border-red-500/20' :
                            m.related_case_status === 'Closed' ? 'bg-emerald-500/10 text-[#00D084] border-emerald-500/20' :
                            'bg-[#98A2B3]/10 text-[#98A2B3] border-[#223047]/20'
                          }`}>{m.related_case_status}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                            m.related_case_priority === 'Critical' ? 'bg-red-500/10 text-[#FF4D6D] border-red-500/20' :
                            m.related_case_priority === 'High' ? 'bg-amber-500/10 text-[#FFB020] border-amber-500/20' :
                            'bg-[#98A2B3]/10 text-[#98A2B3] border-[#223047]/20'
                          }`}>{m.related_case_priority}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* ═══════════════ TAB: RECOVERY INTELLIGENCE ═══════════════ */}
      {activeTab === 'recovery' && caseId && caseData && (
        <EnterpriseRecoveryIntelligence caseId={caseId} amountLost={caseData.amountLost} />
      )}

      {/* ═══════════════ TAB: OFFICER NOTES ═══════════════ */}
      {activeTab === 'notes' && (
        <div className="space-y-4">

          {/* ── Summary Header ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Total Notes', value: notes.length, color: 'text-[#00B8FF]' },
              { label: 'Last Updated', value: notes.length > 0 ? new Date(notes[0].created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—', color: 'text-[#F8FAFC]' },
              { label: 'Note Types', value: [...new Set(notes.map(n => n.note_type))].length || 0, color: 'text-purple-400' },
            ].map(s => (
              <div key={s.label} className="bg-[#121B2A] border border-[#223047] rounded-lg px-4 py-3">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-[#98A2B3] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── Success Toast ── */}
          {noteSuccess && (
            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-[#00D084] shrink-0" />
              <p className="text-sm text-emerald-300">{noteSuccess}</p>
            </div>
          )}

          {/* ── Add Note Form ── */}
          <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-[#00B8FF]" /> Add Investigation Note
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] text-[#98A2B3] uppercase tracking-wider block mb-1">Officer Name</label>
                <div className="flex items-center gap-3 px-3 py-2 bg-[#070B14] border border-[#223047] rounded-lg">
                  {user?.profile_photo ? (
                    <img src={user.profile_photo} alt={user.full_name} className="w-6 h-6 rounded object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded bg-[#00B8FF]/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-[#00B8FF]">
                        {user?.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <span className="text-sm text-[#F8FAFC]">{user?.full_name || 'Officer'}</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#98A2B3] uppercase tracking-wider block mb-1">Note Type</label>
                <select
                  value={noteType}
                  onChange={e => setNoteType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#070B14] border border-[#223047] rounded-lg text-sm text-[#F8FAFC] focus:outline-none focus:border-[#00B8FF]/50 transition-colors cursor-pointer"
                >
                  {['General Note', 'Victim Contact', 'Bank Action', 'Legal Request', 'Evidence Review', 'Suspect Tracking'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-[10px] text-[#98A2B3] uppercase tracking-wider block mb-1">Note Content</label>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder={
                  noteType === 'Victim Contact'    ? 'Describe victim communication, status update...' :
                  noteType === 'Bank Action'        ? 'Account freeze order, transaction details...' :
                  noteType === 'Legal Request'      ? 'Section invoked, court order, warrant details...' :
                  noteType === 'Evidence Review'    ? 'Evidence item analysed, findings...' :
                  noteType === 'Suspect Tracking'   ? 'Suspect movement, lead generated...' :
                  'Record investigation observation, action taken...'
                }
                rows={5}
                className="w-full px-3 py-2.5 bg-[#070B14] border border-[#223047] rounded-lg text-sm text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#00B8FF]/50 transition-colors resize-none"
              />
              <p className="text-[10px] text-[#98A2B3] mt-1 text-right">{noteText.length} chars</p>
            </div>
            {notesError && (
              <p className="text-xs text-[#FF4D6D] mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 shrink-0" /> {notesError}
              </p>
            )}
            <button
              onClick={handleAddNote}
              disabled={noteSubmitting || !noteText.trim() || !user?.full_name}
              className="flex items-center gap-2 px-5 py-2 bg-[#00B8FF] hover:bg-[#00B8FF] disabled:opacity-50 disabled:cursor-not-allowed text-slate-50 text-sm font-medium rounded-lg transition-colors"
            >
              {noteSubmitting
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                : <><CheckCircle className="w-3.5 h-3.5" /> Save Note</>}
            </button>
          </div>

          {/* ── Notes Timeline List ── */}
          {notesLoading ? (
            <div className="flex items-center justify-center h-32 text-[#98A2B3]">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading notes…
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 bg-[#121B2A] border border-[#223047] rounded-lg text-[#98A2B3]">
              <BookOpen className="w-10 h-10 mb-2 text-[#98A2B3]" />
              <p className="text-sm font-medium">No investigation notes yet.</p>
              <p className="text-xs mt-1 text-[#98A2B3]">Use the form above to record the first note.</p>
            </div>
          ) : (
            <div className="bg-[#121B2A] border border-[#223047] rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#223047] bg-[#070B14]">
                <h3 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Notes Timeline ({notes.length})
                </h3>
              </div>
              <div className="divide-y divide-slate-800/60">
                {notes.map((note, idx) => {
                  const TYPE_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string }> = {
                    'General Note':      { color: 'text-[#98A2B3]',   bg: 'bg-[#98A2B3]/10',   border: 'border-[#223047]/30',   icon: '📝' },
                    'Victim Contact':    { color: 'text-[#00B8FF]',    bg: 'bg-[#00B8FF]/10',    border: 'border-[#00B8FF]/20',    icon: '' },
                    'Bank Action':       { color: 'text-[#00D084]', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: '' },
                    'Legal Request':     { color: 'text-[#FFB020]',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   icon: '⚖️' },
                    'Evidence Review':   { color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/30',  icon: '🔍' },
                    'Suspect Tracking':  { color: 'text-[#FF4D6D]',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     icon: '🎯' },
                    // legacy types
                    'General':  { color: 'text-[#98A2B3]', bg: 'bg-[#98A2B3]/10', border: 'border-[#223047]/30', icon: '📝' },
                    'Action':   { color: 'text-[#00B8FF]',  bg: 'bg-[#00B8FF]/10',  border: 'border-[#00B8FF]/20',  icon: '⚡' },
                    'Evidence': { color: 'text-purple-400',bg: 'bg-purple-500/10',border: 'border-purple-500/30',icon: '🔍' },
                    'Legal':    { color: 'text-[#FFB020]', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: '⚖️' },
                    'Urgent':   { color: 'text-[#FF4D6D]',   bg: 'bg-red-500/10',   border: 'border-red-500/30',   icon: '🚨' },
                  };
                  const cfg = TYPE_CONFIG[note.note_type] || TYPE_CONFIG['General Note'];
                  const dt = new Date(note.created_at);
                  return (
                    <div key={note.id} className="flex gap-4 px-5 py-4 group hover:bg-[#0B1220]/20 transition-colors">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${cfg.bg} border ${cfg.border}`}>
                          {cfg.icon}
                        </div>
                        {idx < notes.length - 1 && <div className="w-px flex-1 bg-[#0B1220]/50 min-h-[16px]" />}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0 pb-2">
                        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-[#F8FAFC]">{note.officer_name}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${cfg.color} ${cfg.border} bg-transparent`}>
                              {note.note_type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <p className="text-[10px] text-[#98A2B3] font-mono">
                                {dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-[10px] text-[#98A2B3]">
                                {dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/15 text-[#98A2B3] hover:text-[#FF4D6D] transition-all"
                              title="Delete note"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-[#F8FAFC] leading-relaxed whitespace-pre-wrap">{note.note_text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ TAB: INVESTIGATION REPORT (V2) ═══════════════ */}
      {activeTab === 'report' && caseData && (
        <Suspense fallback={<OverviewSkeleton />}>
          <InvestigationReportTab caseData={caseData} />
        </Suspense>
      )}
        
    </div>
  );
}
