import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Save, X, Briefcase, User, AlertCircle, Trash2,
  DollarSign, Loader2, Calendar, Phone, Mail, FileText, Check,
  Search, Users,
} from 'lucide-react';
import type { FraudCategory, CasePriority, CaseStatus } from '@/types';
import type { UserProfile } from '@/services/authApi';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/lib/permissions';
import { usersApi } from '@/services/usersApi';

/* -- Options -- */
const fraudCategories: FraudCategory[] = [
  'Investment Scam', 'UPI Fraud', 'Phishing', 'Job Scam',
  'Loan App Fraud', 'Sextortion', 'Identity Theft', 'Online Shopping Fraud',
];
const priorities: CasePriority[] = ['Critical', 'High', 'Medium', 'Low'];
const statuses: CaseStatus[] = [
  'Open', 'Under Investigation', 'Evidence Collection',
  'Pending Review', 'Escalated', 'Closed', 'Resolved',
];

/* -- Shared styles -- */
const inputCls =
  'w-full px-3 py-2.5 bg-[#070B14] border border-[#223047] rounded-lg text-sm text-[#F8FAFC] placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all';
const inputErrCls =
  'w-full px-3 py-2.5 bg-[#070B14] border border-red-500/50 rounded-lg text-sm text-[#F8FAFC] placeholder-slate-600 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/10 transition-all';
const labelCls = 'block text-sm font-medium text-[#F8FAFC] mb-1.5';
const selectCls =
  'w-full px-3 py-2.5 bg-[#070B14] border border-[#223047] rounded-lg text-sm text-[#F8FAFC] focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 appearance-none cursor-pointer transition-all';
const selectErrCls =
  'w-full px-3 py-2.5 bg-[#070B14] border border-red-500/50 rounded-lg text-sm text-[#F8FAFC] focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/10 appearance-none cursor-pointer transition-all';

function FieldError({ show, message }: { show: boolean; message: string }) {
  if (!show) return null;
  return (
    <p className="text-[#FF4D6D] text-xs mt-1 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 shrink-0" />
      {message}
    </p>
  );
}

/* -- Priority Config -- */
const priorityConfig: Record<CasePriority, { color: string; dot: string; desc: string }> = {
  Critical: { color: 'border-red-500/30 bg-[#FF4D6D]/10 text-red-300',       dot: 'bg-[#FF4D6D]',    desc: 'Immediate action' },
  High:     { color: 'border-amber-500/30 bg-[#FFB020]/10 text-amber-300', dot: 'bg-[#FFB020]',  desc: 'Urgent' },
  Medium:   { color: 'border-cyan-500/30 bg-[#00B8FF]/10 text-cyan-300',    dot: 'bg-[#00B8FF]',   desc: 'Standard' },
  Low:      { color: 'border-[#223047] bg-[#0B1220]/50 text-[#98A2B3]', dot: 'bg-slate-500',  desc: 'Routine' },
};

export default function EditCasePage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissions = usePermissions(user?.role || 'viewer');

  const [loading, setLoading] = useState(true);
  const [fetchingError, setFetchingError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Investigator assignment (admin only)
  const [investigators, setInvestigators] = useState<UserProfile[]>([]);
  const [selectedInvestigator, setSelectedInvestigator] = useState<string>('');
  const [currentOwnerId, setCurrentOwnerId] = useState<string>('');
  const [investigatorSearch, setInvestigatorSearch] = useState('');
  const [loadingInvestigators, setLoadingInvestigators] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    fraudCategory: '' as FraudCategory | '',
    priority: 'Medium' as CasePriority,
    status: 'Open' as CaseStatus,
    victimName: '',
    victimPhone: '',
    victimEmail: '',
    amountLost: '',
    complaintText: '',
  });

  /* -- touched tracking: shows inline errors only after user interacts -- */
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const markTouched = (field: string) => setTouched((p) => ({ ...p, [field]: true }));

  /* -- field-level validation helpers -- */
  const emailValid = (v: string) => v.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const phoneValid = (v: string) => v.trim().length >= 10;

  // Validation
  const isValid = form.title.trim() !== '' && form.fraudCategory !== '' && form.victimName.trim() !== '' && phoneValid(form.victimPhone) && emailValid(form.victimEmail) && form.amountLost.trim() !== '' && form.complaintText.trim() !== '';

  // Fetch case details
  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    setFetchingError('');
    api.get(`/cases/${caseId}`)
      .then((res) => {
        const c = res.data;
        setForm({
          title: c.title || '',
          fraudCategory: (c.fraud_type || '') as FraudCategory,
          priority: (c.priority || 'Medium') as CasePriority,
          status: (c.status || 'Open') as CaseStatus,
          victimName: c.victim_name || '',
          victimPhone: c.victim_phone || '',
          victimEmail: c.victim_email || '',
          amountLost: c.amount_lost !== undefined ? String(c.amount_lost) : '',
          complaintText: c.complaint_text || '',
        });
        
        // Store current owner
        if (c.owner?.id) {
          setCurrentOwnerId(c.owner.id);
          setSelectedInvestigator(c.owner.id);
        }
      })
      .catch((err) => {
        const detail = err.response?.data?.detail || 'Failed to load case details.';
        setFetchingError(detail);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [caseId]);

  // Load investigators (admin only)
  useEffect(() => {
    if (!permissions.isAdmin()) return;
    
    const loadInvestigators = async () => {
      try {
        setLoadingInvestigators(true);
        const invs = await usersApi.getInvestigators();
        setInvestigators(invs);
      } catch (err) {
        console.error('Failed to load investigators:', err);
      } finally {
        setLoadingInvestigators(false);
      }
    };
    
    loadInvestigators();
  }, [permissions]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !caseId) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const payload: any = {
        title: form.title,
        fraud_type: form.fraudCategory,
        victim_name: form.victimName,
        victim_phone: form.victimPhone,
        victim_email: form.victimEmail || null,
        amount_lost: form.amountLost ? Number(form.amountLost) : 0,
        priority: form.priority,
        status: form.status,
        complaint_text: form.complaintText,
      };
      
      // Admin can reassign investigator
      if (permissions.isAdmin() && selectedInvestigator && selectedInvestigator !== currentOwnerId) {
        payload.owner_id = selectedInvestigator;
      }
      
      await api.put(`/cases/${caseId}`, payload);

      // Navigate back to details page
      navigate(`/cases/${caseId}`);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.message || 'Failed to update case.';
      setSubmitError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  /* -- Loading State -- */
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-48 rounded-lg animate-pulse" />
            <div className="h-3.5 w-32 rounded-lg animate-pulse" />
          </div>
        </div>
        {/* Form skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[420px] rounded-lg animate-pulse" />
          <div className="h-[420px] rounded-lg animate-pulse" />
        </div>
        <div className="h-56 rounded-lg animate-pulse" />
      </div>
    );
  }

  /* -- Error State -- */
  if (fetchingError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-lg bg-[#FF4D6D]/10 border border-red-500/20 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-[#FF4D6D]" />
        </div>
        <div className="space-y-1">
          <p className="text-[#F8FAFC] font-semibold">Failed to Load Case</p>
          <p className="text-sm text-[#FF4D6D] max-w-sm">{fetchingError}</p>
        </div>
        <Link
          to="/cases"
          className="mt-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-[#F8FAFC] text-sm font-medium rounded-lg btn-press shadow-lg shadow-cyan-500/10 transition-all"
        >
          ? Back to Cases
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={`/cases/${caseId}`}
          className="text-[#98A2B3] hover:text-[#00B8FF] hover:bg-[#0B1220]/50 rounded-lg p-2 transition-all shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-lg font-semibold text-[#F8FAFC]">Edit Investigation</h2>
          <p className="text-sm text-[#F8FAFC]0">Case ID: <span className="font-mono text-[#00B8FF]">{caseId}</span></p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT COLUMN: Case & Incident info */}
          <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-6 space-y-5">
            <div className="border-b border-[#223047] pb-4">
              <h3 className="text-[#F8FAFC] text-base font-semibold flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#00B8FF]" /> Case Details
              </h3>
            </div>

            <div>
              <label className={labelCls}>Case Title <span className="text-[#FF4D6D]">*</span></label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                onBlur={() => markTouched('title')}
                className={touched.title && !form.title.trim() ? inputErrCls : inputCls}
                placeholder="Case name/description summary"
                required
              />
              <FieldError show={!!touched.title && !form.title.trim()} message="Case title is required" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Fraud Category <span className="text-[#FF4D6D]">*</span></label>
                <select
                  value={form.fraudCategory}
                  onChange={(e) => setForm({ ...form, fraudCategory: e.target.value as FraudCategory })}
                  onBlur={() => markTouched('fraudCategory')}
                  className={touched.fraudCategory && !form.fraudCategory ? selectErrCls : selectCls}
                  required
                >
                  <option value="">Select Category</option>
                  {fraudCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <FieldError show={!!touched.fraudCategory && !form.fraudCategory} message="Fraud category is required" />
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as CaseStatus })}
                  className={selectCls}
                >
                  {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Priority Level</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {priorities.map((p) => {
                  const cfg = priorityConfig[p];
                  const active = form.priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, priority: p })}
                      className={`flex items-center gap-1.5 p-2.5 rounded-lg border text-left transition-all ${
                        active
                          ? cfg.color
                          : 'border-[#223047] bg-[#0B1220]/50 text-[#F8FAFC]0 hover:border-white/[0.12]'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? cfg.dot : 'bg-slate-600'}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold">{p}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={labelCls}>Amount Lost ($) <span className="text-[#FF4D6D]">*</span></label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F8FAFC]0" />
                <input
                  type="number"
                  value={form.amountLost}
                  onChange={(e) => setForm({ ...form, amountLost: e.target.value })}
                  onBlur={() => markTouched('amountLost')}
                  className={(touched.amountLost && !form.amountLost.trim() ? inputErrCls : inputCls) + ' pl-9'}
                  placeholder="0.00"
                  min="0"
                />
              </div>
              <FieldError show={!!touched.amountLost && !form.amountLost.trim()} message="Amount lost is required" />
            </div>

            {/* Admin only: Reassign investigator */}
            {permissions.isAdmin() && (
              <div>
                <label className={labelCls}>
                  <Users className="w-3.5 h-3.5 inline mr-1" />
                  Assigned Investigator
                </label>
                <div className="space-y-2">
                  {/* Search input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#F8FAFC]0" />
                    <input
                      type="text"
                      value={investigatorSearch}
                      onChange={(e) => setInvestigatorSearch(e.target.value)}
                      placeholder="Search investigators..."
                      className={inputCls + ' pl-9'}
                    />
                  </div>
                  
                  {/* Investigator list */}
                  {loadingInvestigators ? (
                    <div className="flex items-center justify-center py-4 text-xs text-[#98A2B3]">
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Loading...
                    </div>
                  ) : investigators.length === 0 ? (
                    <div className="text-center py-4 text-xs text-[#98A2B3]">
                      No investigators found
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1 bg-[#070B14] border border-[#223047] rounded-lg p-1.5">
                      {investigators
                        .filter((inv) => {
                          if (!investigatorSearch) return true;
                          const search = investigatorSearch.toLowerCase();
                          return (
                            inv.full_name.toLowerCase().includes(search) ||
                            inv.department?.toLowerCase().includes(search) ||
                            inv.email.toLowerCase().includes(search)
                          );
                        })
                        .map((inv) => (
                          <button
                            key={inv.id}
                            type="button"
                            onClick={() => setSelectedInvestigator(inv.id)}
                            className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
                              selectedInvestigator === inv.id
                                ? 'bg-[#00B8FF]/15 border border-[#00B8FF]/30'
                                : 'hover:bg-[#0B1220]/50 border border-transparent'
                            }`}
                          >
                            {inv.profile_photo ? (
                              <img src={inv.profile_photo} alt={inv.full_name} className="w-7 h-7 rounded-lg object-cover" />
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-[#00B8FF]/10 border border-[#00B8FF]/20 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-[#00B8FF]">
                                  {inv.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-[#F8FAFC] font-medium truncate">{inv.full_name}</p>
                              <p className="text-[10px] text-[#98A2B3] truncate">{inv.department || inv.role}</p>
                            </div>
                            {selectedInvestigator === inv.id && (
                              <Check className="w-3.5 h-3.5 text-[#00B8FF] shrink-0" />
                            )}
                          </button>
                        ))}
                    </div>
                  )}
                  {selectedInvestigator !== currentOwnerId && (
                    <p className="text-[10px] text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Investigator will be reassigned
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Victim Info */}
          <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-6 space-y-5">
            <div className="border-b border-[#223047] pb-4">
              <h3 className="text-[#F8FAFC] text-base font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-[#00B8FF]" /> Victim Information
              </h3>
            </div>

            <div>
              <label className={labelCls}>Victim Name <span className="text-[#FF4D6D]">*</span></label>
              <input
                type="text"
                value={form.victimName}
                onChange={(e) => setForm({ ...form, victimName: e.target.value })}
                onBlur={() => markTouched('victimName')}
                className={touched.victimName && !form.victimName.trim() ? inputErrCls : inputCls}
                placeholder="Full name"
                required
              />
              <FieldError show={!!touched.victimName && !form.victimName.trim()} message="Victim name is required" />
            </div>

            <div>
              <label className={labelCls}>Contact Number <span className="text-[#FF4D6D]">*</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F8FAFC]0" />
                <input
                  type="text"
                  value={form.victimPhone}
                  onChange={(e) => setForm({ ...form, victimPhone: e.target.value })}
                  onBlur={() => markTouched('victimPhone')}
                  className={(touched.victimPhone && !phoneValid(form.victimPhone) ? inputErrCls : inputCls) + ' pl-9'}
                  placeholder="Phone number"
                  required
                />
              </div>
              <FieldError show={!!touched.victimPhone && !form.victimPhone.trim()} message="Phone number is required" />
              <FieldError show={!!touched.victimPhone && form.victimPhone.trim().length > 0 && !phoneValid(form.victimPhone)} message="Enter at least 10 digits" />
            </div>

            <div>
              <label className={labelCls}>Email Address <span className="text-[#FF4D6D]">*</span></label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F8FAFC]0" />
                <input
                  type="email"
                  value={form.victimEmail}
                  onChange={(e) => setForm({ ...form, victimEmail: e.target.value })}
                  onBlur={() => markTouched('victimEmail')}
                  className={(touched.victimEmail && !emailValid(form.victimEmail) ? inputErrCls : inputCls) + ' pl-9'}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <FieldError show={!!touched.victimEmail && !form.victimEmail.trim()} message="Email address is required" />
              <FieldError show={!!touched.victimEmail && form.victimEmail.trim().length > 0 && !emailValid(form.victimEmail)} message="Enter a valid email address" />
            </div>
          </div>
        </div>

        {/* BOTTOM: Complaint Statement */}
        <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-6 space-y-4">
          <div className="border-b border-[#223047] pb-3">
            <h3 className="text-[#F8FAFC] text-base font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#00B8FF]" /> Complaint Narrative <span className="text-[#FF4D6D]">*</span>
            </h3>
          </div>
          <div>
            <textarea
              rows={8}
              value={form.complaintText}
              onChange={(e) => setForm({ ...form, complaintText: e.target.value })}
              onBlur={() => markTouched('complaintText')}
              className={(touched.complaintText && !form.complaintText.trim() ? inputErrCls : inputCls) + ' resize-none'}
              placeholder="Narrative statement detailing the fraud events..."
              required
            />
            <FieldError show={!!touched.complaintText && !form.complaintText.trim()} message="Complaint statement is required" />
          </div>
        </div>

        {/* Error Banner */}
        {submitError && (
          <div className="flex items-center gap-2.5 p-4 bg-[#FF4D6D]/10 border border-red-500/20 rounded-lg text-sm text-[#FF4D6D]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{submitError}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pb-4">
          <button
            type="button"
            onClick={() => navigate(`/cases/${caseId}`)}
            disabled={submitting}
            className="px-4 py-2.5 border border-[#223047] bg-[#0B1220]/50 hover:bg-white/[0.06] text-[#F8FAFC] text-sm rounded-lg transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:from-cyan-900/40 disabled:to-cyan-800/40 disabled:text-[#F8FAFC]0 disabled:cursor-not-allowed text-[#F8FAFC] text-sm font-medium rounded-lg btn-press shadow-lg shadow-cyan-500/10 transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving�
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
