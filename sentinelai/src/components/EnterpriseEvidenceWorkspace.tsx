import { useState, useMemo, memo } from 'react';
import {
  Search, Filter, Download, Eye, Sparkles, AlertTriangle,
  FileText, Camera, MessageSquare, CreditCard, Headphones,
  Mail, BarChart3, X, Loader2, Copy, ExternalLink, Clock,
  User, Hash, Shield, CheckCircle, ChevronDown,
} from 'lucide-react';
import type { Evidence } from '@/types';
import { formatDate, formatDateTime } from '@/lib/formatters';

/* ═══════════════════════════════════════════════════════════
   TYPES & CONFIG
═══════════════════════════════════════════════════════════ */

interface EnterpriseEvidenceWorkspaceProps {
  evidence: Evidence[];
  caseData: any;
  analyzingId: string | null;
  analysisCache: Record<string, string>;
  onAnalyze: (evidenceId: string) => void;
  onViewAnalysis: (evidenceId: string) => void;
}

const evidenceConfig: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
  'Complaint PDF':   { icon: FileText,      color: 'text-[#FF4D6D]',    bg: 'bg-red-500/10 border-red-500/20' },
  Screenshot:        { icon: Camera,        color: 'text-[#00B8FF]',   bg: 'bg-[#00B8FF]/10 border-[#00B8FF]/20' },
  'Chat Export':     { icon: MessageSquare, color: 'text-[#00D084]',   bg: 'bg-emerald-500/10 border-emerald-500/20' },
  'Bank Statement':  { icon: CreditCard,    color: 'text-[#FFB020]',   bg: 'bg-amber-500/10 border-amber-500/20' },
  Image:             { icon: Camera,        color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/20' },
  'Call Recording':  { icon: Headphones,    color: 'text-pink-400',    bg: 'bg-pink-500/10 border-pink-500/20' },
  'Email Thread':    { icon: Mail,          color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20' },
  'Transaction Log': { icon: BarChart3,     color: 'text-teal-400',    bg: 'bg-teal-500/10 border-teal-500/20' },
};

/* ═══════════════════════════════════════════════════════════
   ENTERPRISE EVIDENCE WORKSPACE
═══════════════════════════════════════════════════════════ */

export default memo(function EnterpriseEvidenceWorkspace({
  evidence,
  caseData,
  analyzingId,
  analysisCache,
  onAnalyze,
  onViewAnalysis,
}: EnterpriseEvidenceWorkspaceProps) {
  const [selectedId, setSelectedId] = useState<string | null>(evidence[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'type'>('date');

  // Filtered and sorted evidence
  const filteredEvidence = useMemo(() => {
    let filtered = evidence;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(ev =>
        ev.fileName.toLowerCase().includes(q) ||
        ev.id.toLowerCase().includes(q) ||
        ev.type.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(ev => ev.type === filterType);
    }

    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'analyzed') {
        filtered = filtered.filter(ev => analysisCache[ev.id] === 'completed');
      } else if (filterStatus === 'pending') {
        filtered = filtered.filter(ev => !analysisCache[ev.id] || analysisCache[ev.id] === 'pending');
      } else if (filterStatus === 'failed') {
        filtered = filtered.filter(ev => analysisCache[ev.id] === 'failed');
      }
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'date') return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      if (sortBy === 'name') return a.fileName.localeCompare(b.fileName);
      if (sortBy === 'type') return a.type.localeCompare(b.type);
      return 0;
    });

    return sorted;
  }, [evidence, searchQuery, filterType, filterStatus, sortBy, analysisCache]);

  const selectedEvidence = evidence.find(ev => ev.id === selectedId) || evidence[0];
  const evidenceTypes = useMemo(() => [...new Set(evidence.map(ev => ev.type))], [evidence]);

  // Generate mock SHA256 hash
  const generateHash = (id: string) => {
    return 'a'.repeat(16) + id.slice(0, 16).split('').map(c => c.charCodeAt(0).toString(16)).join('').padEnd(48, '0');
  };

  // Empty state
  if (evidence.length === 0) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-[#121B2A] border border-[#223047] rounded-lg">
        <div className="text-center">
          <Shield className="w-16 h-16 text-[#98A2B3] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">No Evidence Collected</h3>
          <p className="text-sm text-[#98A2B3] max-w-md">
            Evidence files will appear here once uploaded by investigators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-[700px]">
      {/* ═══════════════ LEFT: EVIDENCE LIST ═══════════════ */}
      <div className="w-[400px] shrink-0 flex flex-col bg-[#121B2A] border border-[#223047] rounded-lg overflow-hidden">
        {/* List Header */}
        <div className="p-4 border-b border-[#223047] bg-[#0B1220]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#F8FAFC]">Evidence Collection</h3>
            <span className="text-xs text-[#98A2B3] font-medium">{filteredEvidence.length} of {evidence.length}</span>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#98A2B3]" />
            <input
              type="text"
              placeholder="Search evidence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#070B14] border border-[#223047] rounded-lg text-[#F8FAFC] placeholder-[#98A2B3] focus:outline-none focus:border-[#00B8FF]/50"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 px-2 py-1.5 text-xs bg-[#070B14] border border-[#223047] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#00B8FF]/50"
            >
              <option value="all">All Types</option>
              {evidenceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 px-2 py-1.5 text-xs bg-[#070B14] border border-[#223047] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#00B8FF]/50"
            >
              <option value="all">All Status</option>
              <option value="analyzed">Analyzed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            <button
              onClick={() => setSortBy(sortBy === 'date' ? 'name' : sortBy === 'name' ? 'type' : 'date')}
              className="px-3 py-1.5 text-xs bg-[#070B14] border border-[#223047] rounded-lg text-[#F8FAFC] hover:bg-[#0B1220] transition-colors"
              title="Sort by"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Evidence List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredEvidence.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#98A2B3] py-8">
              <Search className="w-10 h-10 mb-2" />
              <p className="text-sm">No evidence matches your filters</p>
            </div>
          ) : (
            filteredEvidence.map((ev) => {
              const cfg = evidenceConfig[ev.type] || evidenceConfig['Screenshot'];
              const Icon = cfg.icon;
              const isSelected = selectedId === ev.id;
              const status = analysisCache[ev.id];

              return (
                <button
                  key={ev.id}
                  onClick={() => setSelectedId(ev.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-[#00B8FF]/15 border-[#00B8FF]/40 shadow-lg'
                      : 'bg-[#0B1220] border-[#223047] hover:border-[#00B8FF]/20 hover:bg-[#0B1220]/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border ${cfg.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                      </div>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>
                        {ev.type}
                      </span>
                    </div>
                    {status === 'completed' && (
                      <CheckCircle className="w-3.5 h-3.5 text-[#00D084]" />
                    )}
                  </div>

                  <p className="text-xs font-medium text-[#F8FAFC] mb-1 truncate">{ev.fileName}</p>
                  <div className="flex items-center gap-2 text-[10px] text-[#98A2B3]">
                    <span>{ev.fileSize}</span>
                    <span>•</span>
                    <span>{formatDate(ev.uploadedAt)}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ═══════════════ RIGHT: EVIDENCE INSPECTOR ═══════════════ */}
      {selectedEvidence && (() => {
        const cfg = evidenceConfig[selectedEvidence.type] || evidenceConfig['Screenshot'];
        const Icon = cfg.icon;
        const status = analysisCache[selectedEvidence.id];
        const hash = generateHash(selectedEvidence.id);

        return (
          <div className="flex-1 flex flex-col bg-[#121B2A] border border-[#223047] rounded-lg overflow-hidden">
            {/* Inspector Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#223047] bg-[#0B1220]">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${cfg.bg}`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#F8FAFC]">{selectedEvidence.fileName}</p>
                  <p className="text-xs text-[#98A2B3]">{selectedEvidence.type}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(hash);
                    alert('SHA256 hash copied to clipboard');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#F8FAFC] border border-[#223047] rounded-lg hover:bg-[#0B1220]/50 transition-colors"
                  title="Copy Hash"
                >
                  <Copy className="w-3 h-3" />
                </button>

                <button
                  onClick={() => window.open('#', '_blank')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#F8FAFC] border border-[#223047] rounded-lg hover:bg-[#0B1220]/50 transition-colors"
                  title="Open Original"
                >
                  <ExternalLink className="w-3 h-3" />
                </button>

                <button
                  onClick={() => {
                    const content = `Evidence ID: ${selectedEvidence.id}\nFile: ${selectedEvidence.fileName}\nType: ${selectedEvidence.type}\nSize: ${selectedEvidence.fileSize}\nHash: ${hash}\nUploaded: ${selectedEvidence.uploadedAt}\nOfficer: ${selectedEvidence.uploadedBy}`;
                    const blob = new Blob([content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `evidence_${selectedEvidence.id}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#F8FAFC] border border-[#223047] rounded-lg hover:bg-[#0B1220]/50 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>

                {status === 'completed' ? (
                  <button
                    onClick={() => onViewAnalysis(selectedEvidence.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#00D084] bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-colors"
                  >
                    <CheckCircle className="w-3 h-3" />
                    View Analysis
                  </button>
                ) : (
                  <button
                    disabled={analyzingId === selectedEvidence.id}
                    onClick={() => onAnalyze(selectedEvidence.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#00B8FF] bg-[#00B8FF]/10 border border-[#00B8FF]/20 rounded-lg hover:bg-[#00B8FF]/20 transition-colors disabled:opacity-50"
                  >
                    {analyzingId === selectedEvidence.id ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        Analyze OCR
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Inspector Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Preview Area */}
              <div className="flex-1 flex items-center justify-center p-6 bg-[#070B14]">
                <div className={`flex flex-col items-center justify-center gap-4 w-full max-w-lg rounded-lg border-2 border-dashed ${cfg.bg} p-8`}>
                  <div className={`p-6 rounded-lg ${cfg.bg}`}>
                    <Icon className={`w-12 h-12 ${cfg.color}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-[#F8FAFC] mb-1">{selectedEvidence.fileName}</p>
                    <p className={`text-xs font-medium ${cfg.color} mb-3`}>{selectedEvidence.type}</p>
                    <p className="text-xs text-[#98A2B3] max-w-xs leading-relaxed">{selectedEvidence.description}</p>
                  </div>
                  <button
                    onClick={() => alert(`Evidence: ${selectedEvidence.fileName}\n\n${selectedEvidence.description}`)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#00B8FF] hover:bg-[#29C5FF] text-slate-50 text-xs font-medium rounded-lg transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Open Evidence Viewer
                  </button>
                </div>
              </div>

              {/* Metadata Panel */}
              <div className="w-80 shrink-0 border-l border-[#223047] p-4 overflow-y-auto space-y-5 bg-[#0B1220]">
                {/* Metadata Section */}
                <div>
                  <h4 className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Hash className="w-3 h-3" />
                    Metadata
                  </h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-[10px] text-[#98A2B3] uppercase mb-1">Evidence ID</dt>
                      <dd className="text-xs text-[#F8FAFC] font-mono bg-[#070B14] px-2 py-1 rounded border border-[#223047]">
                        {selectedEvidence.id}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-[#98A2B3] uppercase mb-1">SHA256 Hash</dt>
                      <dd className="text-[10px] text-[#F8FAFC] font-mono bg-[#070B14] px-2 py-1 rounded border border-[#223047] break-all">
                        {hash}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-[#98A2B3] uppercase mb-1">File Size</dt>
                      <dd className="text-xs text-[#F8FAFC]">{selectedEvidence.fileSize}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-[#98A2B3] uppercase mb-1">Upload Time</dt>
                      <dd className="text-xs text-[#F8FAFC]">{formatDateTime(selectedEvidence.uploadedAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-[#98A2B3] uppercase mb-1">Officer</dt>
                      <dd className="text-xs text-[#F8FAFC]">{selectedEvidence.uploadedBy}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-[#98A2B3] uppercase mb-1">Status</dt>
                      <dd>
                        {status === 'completed' ? (
                          <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/15 text-[#00D084] border border-emerald-500/30 font-medium">
                            ✓ Analyzed
                          </span>
                        ) : status === 'failed' ? (
                          <span className="text-[10px] px-2 py-1 rounded-full bg-red-500/15 text-[#FF4D6D] border border-red-500/30 font-medium">
                            ✗ Failed
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/15 text-[#FFB020] border border-amber-500/30 font-medium">
                            ⏳ Pending
                          </span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* OCR Result Section */}
                {status === 'completed' && (
                  <div>
                    <h4 className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      OCR Result
                    </h4>
                    <div className="bg-[#070B14] border border-[#223047] rounded-lg p-3">
                      <p className="text-xs text-[#00D084] mb-2">✓ Text extracted successfully</p>
                      <button
                        onClick={() => onViewAnalysis(selectedEvidence.id)}
                        className="text-xs text-[#00B8FF] hover:text-[#29C5FF] underline"
                      >
                        View extracted entities →
                      </button>
                    </div>
                  </div>
                )}

                {/* Extracted Entities Preview */}
                {status === 'completed' && (
                  <div>
                    <h4 className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Shield className="w-3 h-3" />
                      Extracted Entities
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-3 py-2 bg-[#070B14] border border-[#223047] rounded-lg">
                        <span className="text-xs text-[#98A2B3]">Phone Numbers</span>
                        <span className="text-xs font-bold text-[#F8FAFC]">—</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 bg-[#070B14] border border-[#223047] rounded-lg">
                        <span className="text-xs text-[#98A2B3]">UPI IDs</span>
                        <span className="text-xs font-bold text-[#F8FAFC]">—</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 bg-[#070B14] border border-[#223047] rounded-lg">
                        <span className="text-xs text-[#98A2B3]">Email Addresses</span>
                        <span className="text-xs font-bold text-[#F8FAFC]">—</span>
                      </div>
                      <button
                        onClick={() => onViewAnalysis(selectedEvidence.id)}
                        className="w-full text-xs text-[#00B8FF] hover:text-[#29C5FF] py-2"
                      >
                        View all entities →
                      </button>
                    </div>
                  </div>
                )}

                {/* Related Timeline Events */}
                <div>
                  <h4 className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Related Timeline
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 px-3 py-2 bg-[#070B14] border border-[#223047] rounded-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00B8FF] mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs text-[#F8FAFC]">Evidence Uploaded</p>
                        <p className="text-[10px] text-[#98A2B3]">{formatDate(selectedEvidence.uploadedAt)}</p>
                      </div>
                    </div>
                    {status === 'completed' && (
                      <div className="flex items-start gap-2 px-3 py-2 bg-[#070B14] border border-[#223047] rounded-lg">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-xs text-[#F8FAFC]">OCR Analysis Complete</p>
                          <p className="text-[10px] text-[#98A2B3]">{formatDate(selectedEvidence.uploadedAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cross-Case References */}
                <div>
                  <h4 className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    Cross-Case References
                  </h4>
                  <div className="bg-[#070B14] border border-[#223047] rounded-lg p-3">
                    <p className="text-xs text-[#98A2B3]">
                      No cross-case matches found
                    </p>
                  </div>
                </div>

                {/* Recovery Impact */}
                <div>
                  <h4 className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <BarChart3 className="w-3 h-3" />
                    Recovery Impact
                  </h4>
                  <div className="bg-[#070B14] border border-[#223047] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[#98A2B3]">Impact Level</span>
                      <span className="text-xs font-bold text-[#00B8FF]">Medium</span>
                    </div>
                    <div className="h-1.5 bg-[#0B1220] rounded-full overflow-hidden">
                      <div className="h-full bg-[#00B8FF] rounded-full" style={{ width: '60%' }} />
                    </div>
                    <p className="text-[10px] text-[#98A2B3] mt-2">
                      This evidence contains critical entities for recovery analysis
                    </p>
                  </div>
                </div>

                {/* Chain of Custody */}
                <div>
                  <h4 className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Chain of Custody
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#F8FAFC]">Collected</p>
                        <p className="text-[10px] text-[#98A2B3]">{selectedEvidence.uploadedBy} • {formatDate(selectedEvidence.uploadedAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#F8FAFC]">Hash Verified (SHA-256)</p>
                        <p className="text-[10px] text-[#98A2B3]">System • {formatDate(selectedEvidence.uploadedAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#F8FAFC]">Reviewed</p>
                        <p className="text-[10px] text-[#98A2B3]">{caseData.assignedOfficer.name} • {formatDate(caseData.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
});
