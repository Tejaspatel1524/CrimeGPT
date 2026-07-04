import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { formatINR, formatDate } from '@/lib/formatters';
import api from '@/services/api';
import type { Case, CasePriority, CaseStatus, FraudCategory } from '@/types';
import { Search, Plus, Eye, Edit, Archive, ArchiveRestore, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, FolderOpen } from 'lucide-react';

const ITEMS_PER_PAGE = 8;

const priorityStyle: Record<CasePriority, string> = {
  Critical: 'bg-[#FF4D6D]/10 text-[#FF4D6D] border border-red-500/20',
  High: 'bg-[#FFB020]/10 text-[#FFB020] border border-amber-500/20',
  Medium: 'bg-[#00B8FF]/10 text-[#00B8FF] border border-cyan-500/20',
  Low: 'bg-slate-500/10 text-[#98A2B3] border border-slate-500/20',
};

const statusStyle: Record<CaseStatus, string> = {
  Open: 'bg-[#00B8FF]/10 text-[#00B8FF] border border-cyan-500/20',
  'Under Investigation': 'bg-[#FFB020]/10 text-[#FFB020] border border-amber-500/20',
  'Evidence Collection': 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  'Pending Review': 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  Escalated: 'bg-[#FF4D6D]/10 text-[#FF4D6D] border border-red-500/20',
  Closed: 'bg-[#00D084]/10 text-[#00D084] border border-emerald-500/20',
  Resolved: 'bg-teal-500/10 text-teal-400 border border-teal-500/20',
};

const fraudCategories: FraudCategory[] = [
  'Investment Scam', 'UPI Fraud', 'Phishing', 'Job Scam',
  'Loan App Fraud', 'Sextortion', 'Identity Theft', 'Online Shopping Fraud',
];
const allStatuses: CaseStatus[] = [
  'Open', 'Under Investigation', 'Evidence Collection', 'Pending Review',
  'Escalated', 'Closed', 'Resolved',
];
const allPriorities: CasePriority[] = ['Critical', 'High', 'Medium', 'Low'];

const mapBackendCase = (c: any): Case & { caseNumber: string } => ({
  id: c.case_id || '',
  caseNumber: c.case_number || c.case_id?.slice(0, 8) || '',
  title: c.title || '',
  description: c.complaint_text || '',
  fraudCategory: (c.fraud_type || 'UPI Fraud') as FraudCategory,
  priority: (c.priority || 'Medium') as CasePriority,
  status: (c.status || 'Open') as CaseStatus,
  victim: {
    name: c.victim_name || '',
    contact: c.victim_phone || '',
    email: c.victim_email || '',
    address: '',
    age: undefined,
    occupation: '',
  },
  assignedOfficer: c.owner ? {
    id: c.owner.id || '',
    name: c.owner.full_name || 'Unassigned',
    rank: c.owner.role || 'Officer',
    department: c.owner.department || 'Cyber Crime Cell',
  } : {
    id: '',
    name: 'Unassigned',
    rank: 'Officer',
    department: 'Cyber Crime Cell',
  },
  entities: [],
  evidence: [],
  timeline: [],
  complaintText: c.complaint_text || '',
  amountLost: c.amount_lost || 0,
  createdAt: c.created_at || '',
  updatedAt: c.created_at || '',
  tags: [],
});

type SortField = 'caseNumber' | 'updatedAt' | 'amountLost' | 'priority' | 'status';
type SortDirection = 'asc' | 'desc';

export default function CasesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryQ = searchParams.get('q') || '';
  const queryStatus = searchParams.get('status') || '';
  const queryPriority = searchParams.get('priority') || '';

  const [searchQuery, setSearchQuery] = useState(queryQ);
  const [filterFraud, setFilterFraud] = useState('');
  const [filterStatus, setFilterStatus] = useState(queryStatus);
  const [filterPriority, setFilterPriority] = useState(queryPriority);
  const [showArchived, setShowArchived] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Sync state if URL search parameters change
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setFilterStatus(searchParams.get('status') || '');
    setFilterPriority(searchParams.get('priority') || '');
    setCurrentPage(1);
  }, [searchParams]);

  const [cases, setCases] = useState<(Case & { caseNumber: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [archiveConfirm, setArchiveConfirm] = useState<string | null>(null);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const url = showArchived ? '/cases?archived=true' : '/cases';
        const response = await api.get(url);
        const data = Array.isArray(response.data) ? response.data : response.data.cases || [];
        setCases(data.map(mapBackendCase));
      } catch {
        setApiError('Failed to load cases. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, [showArchived]);

  const handleArchive = async (caseId: string) => {
    try {
      await api.post(`/cases/${caseId}/archive`);
      setCases((prev) => prev.filter((c) => c.id !== caseId));
      setArchiveConfirm(null);
    } catch {
      alert('Failed to archive case.');
    }
  };

  const handleUnarchive = async (caseId: string) => {
    try {
      await api.post(`/cases/${caseId}/unarchive`);
      setCases((prev) => prev.filter((c) => c.id !== caseId));
    } catch {
      alert('Failed to unarchive case.');
    }
  };

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort icon component
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-[#98A2B3]" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-[#00B8FF]" />
      : <ArrowDown className="w-3 h-3 text-[#00B8FF]" />;
  };

  // Highlight matched text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">{part}</mark>
        : part
    );
  };

  // Enhanced filtering with entity search
  const filtered = useMemo(() => {
    let result = [...cases];
    
    // Search filter - enhanced global search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => {
        // Basic fields
        const matchesBasic = 
          c.id.toLowerCase().includes(q) ||
          c.caseNumber.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.victim.name.toLowerCase().includes(q) ||
          c.fraudCategory.toLowerCase().includes(q) ||
          c.assignedOfficer.name.toLowerCase().includes(q);
        
        // Contact fields (phone, email)
        const matchesContact =
          c.victim.contact.toLowerCase().includes(q) ||
          (c.victim.email && c.victim.email.toLowerCase().includes(q));
        
        // Complaint text (for UPI, Telegram, etc.)
        const matchesComplaint = c.complaintText.toLowerCase().includes(q);
        
        return matchesBasic || matchesContact || matchesComplaint;
      });
    }
    
    // Other filters
    if (filterFraud) result = result.filter((c) => c.fraudCategory === filterFraud);
    if (filterStatus) result = result.filter((c) => c.status === filterStatus);
    if (filterPriority) result = result.filter((c) => c.priority === filterPriority);
    
    // Sorting
    result.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case 'caseNumber':
          aVal = a.caseNumber;
          bVal = b.caseNumber;
          break;
        case 'updatedAt':
          aVal = new Date(a.updatedAt).getTime();
          bVal = new Date(b.updatedAt).getTime();
          break;
        case 'amountLost':
          aVal = a.amountLost;
          bVal = b.amountLost;
          break;
        case 'priority':
          const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          aVal = priorityOrder[a.priority];
          bVal = priorityOrder[b.priority];
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [searchQuery, filterFraud, filterStatus, filterPriority, cases, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <tr className="border-b border-white/[0.03] animate-pulse">
      <td className="px-4 py-3"><div className="h-4 bg-[#0B1220] rounded w-28"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-[#0B1220] rounded w-40"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-[#0B1220] rounded w-32"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-[#0B1220] rounded w-24"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-[#0B1220] rounded w-20"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-[#0B1220] rounded w-16"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-[#0B1220] rounded w-20"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-[#0B1220] rounded w-32"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-[#0B1220] rounded w-20"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-[#0B1220] rounded w-16"></div></td>
    </tr>
  );

  const selectClasses =
    'bg-[#121B2A] border border-[#223047] text-sm text-[#F8FAFC] rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 appearance-none cursor-pointer transition-all hover:border-[#223047]';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-[#F8FAFC] text-xl font-bold">{showArchived ? 'Archived Cases' : 'All Cases'}</h2>
          <span className="bg-[#00B8FF]/10 text-[#00B8FF] text-sm font-semibold rounded-full px-3 py-1 border border-cyan-500/20">
            {filtered.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0B1220] hover:bg-slate-700 text-[#F8FAFC] hover:text-[#F8FAFC] text-sm font-medium rounded-lg transition-all shrink-0 border border-[#223047]"
          >
            {showArchived ? <><ArchiveRestore className="w-4 h-4" /> Show Active</> : <><Archive className="w-4 h-4" /> Show Archived</>}
          </button>
          <Link
            to="/cases/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#00B8FF] hover:bg-[#29C5FF] text-white text-sm font-medium rounded-lg shadow-lg transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create New Case
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F8FAFC]0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by case number, victim, fraud type, phone, UPI, email, officer..."
              className="w-full pl-10 pr-4 py-2 bg-[#070B14] border border-[#223047] rounded-lg text-sm text-[#F8FAFC] placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>
          <select
            value={filterFraud}
            onChange={(e) => { setFilterFraud(e.target.value); setCurrentPage(1); }}
            className={selectClasses}
          >
            <option value="">All Fraud Types</option>
            {fraudCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className={selectClasses}
          >
            <option value="">All Status</option>
            {allStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => { setFilterPriority(e.target.value); setCurrentPage(1); }}
            className={selectClasses}
          >
            <option value="">All Priorities</option>
            {allPriorities.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-[#121B2A] border border-[#223047] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#070B14] border-b border-[#223047]">
                  {['Case Number', 'Case Title', 'Victim', 'Fraud Type', 'Amount', 'Priority', 'Status', 'Officer', 'Updated', 'Actions'].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#98A2B3] uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => <LoadingSkeleton key={i} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* API Error */}
      {apiError && (
        <div className="text-sm text-[#FF4D6D] bg-[#FF4D6D]/10 border border-red-500/20 rounded-lg px-4 py-3">
          {apiError}
        </div>
      )}

      {/* Table */}
      {!loading && !apiError && (
      <div className="bg-[#121B2A] border border-[#223047] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#070B14] border-b border-[#223047]">
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[#98A2B3] uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-[#00B8FF] transition-colors"
                  onClick={() => handleSort('caseNumber')}
                >
                  <div className="flex items-center gap-1.5">
                    Case Number
                    <SortIcon field="caseNumber" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#98A2B3] uppercase tracking-wider whitespace-nowrap">
                  Case Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#98A2B3] uppercase tracking-wider whitespace-nowrap">
                  Victim
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#98A2B3] uppercase tracking-wider whitespace-nowrap">
                  Fraud Type
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[#98A2B3] uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-[#00B8FF] transition-colors"
                  onClick={() => handleSort('amountLost')}
                >
                  <div className="flex items-center gap-1.5">
                    Amount
                    <SortIcon field="amountLost" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[#98A2B3] uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-[#00B8FF] transition-colors"
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center gap-1.5">
                    Priority
                    <SortIcon field="priority" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[#98A2B3] uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-[#00B8FF] transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1.5">
                    Status
                    <SortIcon field="status" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#98A2B3] uppercase tracking-wider whitespace-nowrap">
                  Officer
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[#98A2B3] uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-[#00B8FF] transition-colors"
                  onClick={() => handleSort('updatedAt')}
                >
                  <div className="flex items-center gap-1.5">
                    Updated
                    <SortIcon field="updatedAt" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#98A2B3] uppercase tracking-wider whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((c) => (
                <tr 
                  key={c.id} 
                  className="border-b border-[#223047] hover:bg-[#0B1220]/50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/cases/${c.id}`)}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-[#00B8FF] text-xs">
                      {highlightText(c.caseNumber, searchQuery)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#F8FAFC] max-w-[200px] truncate">
                    {highlightText(c.title, searchQuery)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#F8FAFC] whitespace-nowrap">
                    {highlightText(c.victim.name, searchQuery)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#98A2B3] whitespace-nowrap">
                    {highlightText(c.fraudCategory, searchQuery)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#F8FAFC] whitespace-nowrap">{formatINR(c.amountLost)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${priorityStyle[c.priority]}`}>
                      {c.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${statusStyle[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#98A2B3] whitespace-nowrap">
                    {highlightText(c.assignedOfficer.name.split(' ').slice(0, 2).join(' '), searchQuery)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#F8FAFC]0 whitespace-nowrap">{formatDate(c.updatedAt)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={`/cases/${c.id}`} className="p-1.5 rounded-lg hover:bg-slate-700 text-[#F8FAFC]0 hover:text-[#00B8FF] transition-all" title="View">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <Link to={`/cases/${c.id}/edit`} className="p-1.5 rounded-lg hover:bg-slate-700 text-[#F8FAFC]0 hover:text-[#00B8FF] transition-all" title="Edit">
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      {showArchived ? (
                        <button onClick={() => handleUnarchive(c.id)} className="p-1.5 rounded-lg hover:bg-green-500/10 text-[#F8FAFC]0 hover:text-green-400 transition-all" title="Unarchive">
                          <ArchiveRestore className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button onClick={() => setArchiveConfirm(c.id)} className="p-1.5 rounded-lg hover:bg-[#FFB020]/10 text-[#F8FAFC]0 hover:text-[#FFB020] transition-all" title="Archive">
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-[#0B1220]/50 flex items-center justify-center">
                        <FolderOpen className="w-8 h-8 text-[#98A2B3]" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-[#F8FAFC] mb-1">No investigations found</p>
                        <p className="text-sm text-[#F8FAFC]0 mb-4">
                          {searchQuery || filterFraud || filterStatus || filterPriority
                            ? 'Try adjusting your search query or filters'
                            : showArchived 
                              ? 'No archived cases yet'
                              : 'Get started by creating your first case'}
                        </p>
                        {!searchQuery && !filterFraud && !filterStatus && !filterPriority && !showArchived && (
                          <Link
                            to="/cases/new"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00B8FF] hover:bg-[#29C5FF] text-white text-sm font-medium rounded-lg shadow-lg transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            Create New Case
                          </Link>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#223047]">
          <p className="text-xs text-[#F8FAFC]0">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}�{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg text-[#98A2B3] hover:text-[#F8FAFC] hover:bg-[#0B1220] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                  page === currentPage
                    ? 'bg-[#00B8FF]/10 text-[#00B8FF] border border-cyan-500/20'
                    : 'text-[#98A2B3] hover:text-[#F8FAFC] hover:bg-[#0B1220]'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg text-[#98A2B3] hover:text-[#F8FAFC] hover:bg-[#0B1220] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Archive Confirmation Modal */}
      {archiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setArchiveConfirm(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-[#121B2A] border border-[#223047] rounded-lg shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#FFB020]/10 flex items-center justify-center shrink-0">
                <Archive className="w-6 h-6 text-[#FFB020]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">Archive this case?</h3>
                <p className="text-sm text-[#98A2B3] leading-relaxed mb-6">
                  This case will no longer appear in active investigations. All evidence, notes, reports, timeline, entities, and AI analysis will be preserved. You can restore it anytime from the archived cases view.
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setArchiveConfirm(null)}
                    className="px-4 py-2 text-sm text-[#98A2B3] hover:text-[#F8FAFC] border border-[#223047] rounded-lg hover:bg-[#0B1220] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleArchive(archiveConfirm)}
                    className="px-4 py-2 text-sm bg-amber-600 hover:bg-[#FFB020] text-white font-medium rounded-lg transition-colors"
                  >
                    Archive Case
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
