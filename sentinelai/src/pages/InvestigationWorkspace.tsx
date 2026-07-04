import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Camera, Clock, Users, Network, Layers,
  TrendingUp, BookOpen, Info, Download, Edit, Sparkles,
  AlertTriangle, Shield, ChevronLeft, ChevronRight, Menu, X,
} from 'lucide-react';
import type { Case, CasePriority, CaseStatus } from '@/types';
import api from '@/services/api';
import { formatINR, formatDateTime } from '@/lib/formatters';
import CaseDetailPage from './CaseDetailPage';

/* ═══════════════════════════════════════════════════════════
   INVESTIGATION NAVIGATION ITEMS
═══════════════════════════════════════════════════════════ */
const INVESTIGATION_NAV_ITEMS = [
  { id: 'overview',      label: 'Overview',                 icon: Info },
  { id: 'complaint',     label: 'Complaint',                icon: FileText },
  { id: 'evidence',      label: 'Evidence',                 icon: Camera },
  { id: 'timeline',      label: 'Timeline',                 icon: Clock },
  { id: 'entities',      label: 'Entity Intelligence',      icon: Users },
  { id: 'graph',         label: 'Relationship Graph',       icon: Network },
  { id: 'intelligence',  label: 'Cross-Case Intelligence',  icon: Layers },
  { id: 'recovery',      label: 'Recovery Intelligence',    icon: TrendingUp },
  { id: 'notes',         label: 'Officer Notes',            icon: BookOpen },
  { id: 'report',        label: 'Investigation Report',     icon: FileText },
  { id: 'brief',         label: 'CrimeGPT',                 icon: Sparkles },
];

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

/* ═══════════════════════════════════════════════════════════
   INVESTIGATION WORKSPACE COMPONENT
═══════════════════════════════════════════════════════════ */
export default function InvestigationWorkspace() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch minimal case data for header
  useEffect(() => {
    const fetchCaseHeader = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/cases/${caseId}`);
        setCaseData(res.data);
      } catch (err) {
        console.error('Failed to load case:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCaseHeader();
  }, [caseId]);

  return (
    <div className="flex flex-col h-screen bg-[#070B14]">
      {/* ═══════════════ HEADER ═══════════════ */}
      <header className="flex-none h-16 bg-[#121B2A] border-b border-[#223047] flex items-center justify-between px-6">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Link
            to="/cases"
            className="p-2 rounded-lg text-[#98A2B3] hover:text-[#F8FAFC] hover:bg-[#0B1220] transition-colors shrink-0"
            title="Back to Cases"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          {!loading && caseData && (
            <>
              <div className="h-8 w-px bg-[#223047]" />
              
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Shield className="w-5 h-5 text-[#00B8FF] shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono font-bold text-[#00B8FF]">
                      {caseData.case_number || caseData.case_id?.slice(0, 8)}
                    </code>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusStyle[caseData.status as CaseStatus]}`}>
                      {caseData.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${priorityStyle[caseData.priority as CasePriority]}`}>
                      {caseData.priority}
                    </span>
                  </div>
                  <h1 className="text-sm font-semibold text-[#F8FAFC] truncate">{caseData.title}</h1>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden p-2 rounded-lg text-[#98A2B3] hover:text-[#F8FAFC] hover:bg-[#0B1220] transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => navigate(`/cases/${caseId}/edit`)}
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#F8FAFC] hover:text-[#F8FAFC] bg-[#0B1220] hover:bg-slate-700 border border-[#223047] rounded-lg transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit
          </button>
          
          <button
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#070B14] bg-[#00B8FF] hover:bg-[#29C5FF] rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </header>

      {/* ═══════════════ MAIN LAYOUT ═══════════════ */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT NAVIGATION - Desktop */}
        <nav
          className={`hidden lg:flex flex-col flex-none bg-[#0B1220] border-r border-[#223047] transition-all duration-300 ${
            navCollapsed ? 'w-16' : 'w-[280px]'
          }`}
        >
          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {INVESTIGATION_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                      isActive
                        ? 'bg-[#121B2A] text-[#F8FAFC]'
                        : 'text-[#98A2B3] hover:text-[#F8FAFC] hover:bg-[#121B2A]/50'
                    }`}
                  >
                    {isActive && !navCollapsed && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#00B8FF] rounded-r" />
                    )}
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#00B8FF]' : ''}`} />
                    {!navCollapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collapse Toggle */}
          <div className="flex-none p-3 border-t border-[#223047]">
            <button
              onClick={() => setNavCollapsed(!navCollapsed)}
              className="w-full flex items-center justify-center p-2 rounded-lg text-[#98A2B3] hover:text-[#F8FAFC] hover:bg-[#121B2A] transition-colors"
            >
              {navCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </nav>

        {/* LEFT NAVIGATION - Mobile Drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex" onClick={() => setMobileNavOpen(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
              className="relative w-[280px] h-full bg-[#0B1220] border-r border-[#223047] shadow-2xl animate-slide-in flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Nav Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#223047]">
                <h3 className="text-sm font-semibold text-[#F8FAFC]">Investigation</h3>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-[#121B2A] text-[#98A2B3] hover:text-[#F8FAFC] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Nav Items */}
              <div className="flex-1 overflow-y-auto py-4 px-3">
                <div className="space-y-1">
                  {INVESTIGATION_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileNavOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                          isActive
                            ? 'bg-[#121B2A] text-[#F8FAFC]'
                            : 'text-[#98A2B3] hover:text-[#F8FAFC] hover:bg-[#121B2A]/50'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#00B8FF] rounded-r" />
                        )}
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#00B8FF]' : ''}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-[#070B14]">
          <div className="h-full">
            {/* Render the original CaseDetailPage content with active tab */}
            <CaseDetailPage activeModule={activeTab} />
          </div>
        </main>
      </div>

      {/* ═══════════════ BOTTOM STATUS BAR ═══════════════ */}
      {!loading && caseData && (
        <footer className="flex-none h-12 bg-[#121B2A] border-t border-[#223047] flex items-center justify-between px-6 text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[#98A2B3]">Status:</span>
              <span className="font-medium text-[#F8FAFC]">{caseData.status}</span>
            </div>
            
            <div className="h-4 w-px bg-[#223047]" />
            
            <div className="flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-[#98A2B3]" />
              <span className="text-[#98A2B3]">Evidence:</span>
              <span className="font-medium text-[#F8FAFC]">—</span>
            </div>
            
            <div className="h-4 w-px bg-[#223047]" />
            
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#98A2B3]" />
              <span className="text-[#98A2B3]">Entities:</span>
              <span className="font-medium text-[#F8FAFC]">—</span>
            </div>
            
            <div className="h-4 w-px bg-[#223047]" />
            
            <div className="flex items-center gap-2">
              <Network className="w-3.5 h-3.5 text-[#98A2B3]" />
              <span className="text-[#98A2B3]">Connections:</span>
              <span className="font-medium text-[#F8FAFC]">—</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#98A2B3]" />
              <span className="text-[#98A2B3]">Updated:</span>
              <span className="font-medium text-[#F8FAFC]">
                {formatDateTime(caseData.created_at)}
              </span>
            </div>
            
            <div className="h-4 w-px bg-[#223047]" />
            
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#00B8FF]" />
              <span className="font-medium text-[#00B8FF]">AI Ready</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
