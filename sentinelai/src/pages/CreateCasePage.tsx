import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Save, Upload, X, FileText, Camera,
  MessageSquare, CreditCard, Image, Check, CheckCircle, User, Briefcase,
  AlertCircle, MapPin, Phone, Mail, Calendar, Search,
} from 'lucide-react';
import type { FraudCategory, CasePriority, CaseStatus } from '@/types';
import type { UserProfile } from '@/services/authApi';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/services/usersApi';
import { usePermissions } from '@/lib/permissions';

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

/* -- Steps config -- */
const steps = [
  { id: 1, label: 'Case Info',   icon: Briefcase,   description: 'Basic case details' },
  { id: 2, label: 'Victim Info', icon: User,         description: 'Victim profile' },
  { id: 3, label: 'Incident',    icon: AlertCircle,  description: 'Incident details' },
  { id: 4, label: 'Evidence',    icon: Camera,       description: 'Upload evidence' },
];

/* -- Shared styles -- */
const inputCls = 'w-full px-3 py-2.5 bg-[#070B14] border border-[#223047] rounded-lg text-sm text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10/30 transition-colors';
const inputErrCls = 'w-full px-3 py-2.5 bg-[#070B14] border border-red-500/60 rounded-lg text-sm text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-500/30 transition-colors';
const labelCls = 'block text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-1.5';
const selectCls = 'w-full px-3 py-2.5 bg-[#070B14] border border-[#223047] rounded-lg text-sm text-[#F8FAFC] focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer';
const selectErrCls = 'w-full px-3 py-2.5 bg-[#070B14] border border-red-500/60 rounded-lg text-sm text-[#F8FAFC] focus:outline-none focus:border-red-400 appearance-none cursor-pointer';

function FieldError({ show, message }: { show: boolean; message: string }) {
  if (!show) return null;
  return <p className="text-[11px] text-[#FF4D6D] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3 shrink-0" />{message}</p>;
}

/* -- Evidence type definitions -- */
const evidenceTypes = [
  { label: 'Complaint PDF',   icon: FileText,      color: 'text-[#FF4D6D] bg-[#FF4D6D]/10 border-red-500/20',         exts: ['pdf'] },
  { label: 'Screenshots',     icon: Camera,         color: 'text-[#00B8FF] bg-[#00B8FF]/10 border-cyan-500/20',      exts: ['png', 'jpg', 'jpeg', 'webp'] },
  { label: 'Chat Exports',    icon: MessageSquare,  color: 'text-[#00D084] bg-[#00D084]/10 border-emerald-500/20', exts: ['html', 'txt'] },
  { label: 'Bank Statements', icon: CreditCard,     color: 'text-[#FFB020] bg-[#FFB020]/10 border-amber-500/20',   exts: ['csv', 'xlsx'] },
  { label: 'Images',          icon: Image,          color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', exts: ['gif', 'bmp', 'mp4'] },
];

function getEvidenceConfig(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return evidenceTypes.find((t) => t.exts.includes(ext)) ?? evidenceTypes[1];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/* -- Priority display -- */
const priorityConfig: Record<CasePriority, { color: string; dot: string; desc: string }> = {
  Critical: { color: 'border-red-500/40 bg-[#FF4D6D]/10 text-red-300',     dot: 'bg-[#FF4D6D]',    desc: 'Immediate action required' },
  High:     { color: 'border-amber-500/40 bg-[#FFB020]/10 text-amber-300', dot: 'bg-[#FFB020]', desc: 'Urgent, escalate within 24h' },
  Medium:   { color: 'border-cyan-500/40 bg-[#00B8FF]/10 text-cyan-300',   dot: 'bg-[#00B8FF]',   desc: 'Standard investigation timeline' },
  Low:      { color: 'border-[#223047]/40 bg-[#0B1220]/50 text-[#98A2B3]', dot: 'bg-slate-500', desc: 'Routine follow-up' },
};

export default function CreateCasePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissions = usePermissions(user?.role || 'viewer');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Block viewers from creating cases
  if (permissions.isViewer()) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-[#FF4D6D]" />
        </div>
        <h2 className="text-xl font-bold text-[#F8FAFC]">Access Denied</h2>
        <p className="text-sm text-[#98A2B3] max-w-md text-center">
          You do not have permission to create cases. Viewers have read-only access.
        </p>
      </div>
    );
  }

  const [currentStep, setCurrentStep] = useState(1);
  const [isDragging, setIsDragging]   = useState(false);
  const [files, setFiles]             = useState<File[]>([]);

  // Investigators list and selection
  const [investigators, setInvestigators] = useState<UserProfile[]>([]);
  const [selectedInvestigator, setSelectedInvestigator] = useState<string>('');
  const [investigatorSearch, setInvestigatorSearch] = useState('');
  const [loadingInvestigators, setLoadingInvestigators] = useState(false);

  const [step1, setStep1] = useState({
    title: '', fraudCategory: '' as FraudCategory | '',
    priority: 'High' as CasePriority, status: 'Open' as CaseStatus,
  });
  const [step2, setStep2] = useState({
    victimName: '', victimContact: '', victimEmail: '',
    victimAddress: '', victimAge: '', victimOccupation: '',
  });
  const [step3, setStep3] = useState({
    incidentDate: '', incidentLocation: '',
    amountLost: '', complaint: '', modus: '',
  });

  /* -- touched tracking: shows inline errors only after user interacts -- */
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const markTouched = (field: string) => setTouched((p) => ({ ...p, [field]: true }));
  /* Mark all fields for the current step when trying to proceed */
  const touchStep = (step: number) => {
    if (step === 1) setTouched((p) => ({ ...p, title: true, fraudCategory: true }));
    if (step === 2) setTouched((p) => ({ ...p, victimName: true, victimContact: true, victimEmail: true }));
    if (step === 3) setTouched((p) => ({ ...p, amountLost: true, complaint: true }));
  };

  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState('');

  // Load investigators on mount
  useEffect(() => {
    const loadInvestigators = async () => {
      try {
        setLoadingInvestigators(true);
        const invs = await usersApi.getInvestigators();
        setInvestigators(invs);
        
        // Auto-select current user if investigator
        if (permissions.isInvestigator() && user) {
          setSelectedInvestigator(user.id);
        }
      } catch (err) {
        console.error('Failed to load investigators:', err);
      } finally {
        setLoadingInvestigators(false);
      }
    };
    
    loadInvestigators();
  }, [permissions, user]);

  /* -- file helpers -- */
  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    setFiles((prev) => {
      const deduped = incoming.filter(
        (f) => !prev.some((e) => e.name === f.name && e.size === f.size)
      );
      return [...prev, ...deduped];
    });
  };
  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  /* -- drag-and-drop -- */
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();   // ? stops browser from navigating to the dropped file
    e.stopPropagation();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();   // ? stops browser from opening file in a new tab
    e.stopPropagation();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  /* -- field-level validation helpers -- */
  const emailValid = (v: string) => v.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const phoneValid = (v: string) => v.trim().length >= 10;

  /* -- step-level validation -- */
  const canProceed = (step: number) => {
    if (step === 1) return step1.title.trim() !== '' && step1.fraudCategory !== '';
    if (step === 2) return step2.victimName.trim() !== '' && phoneValid(step2.victimContact) && emailValid(step2.victimEmail);
    if (step === 3) return step3.amountLost.trim() !== '' && Number(step3.amountLost) >= 0 && step3.complaint.trim() !== '';
    return true;
  };

  /* -- full form validity (used on final submit) -- */
  const isFormValid = canProceed(1) && canProceed(2) && canProceed(3);

  /* -- submit -- */
  const handleCreateCase = async () => {
    if (!isFormValid) return;
    setSubmitError('');
    setSubmitting(true);
    try {
      // 1. Create the case record with assigned investigator
      const { data: caseData } = await api.post('/cases', {
        title:          step1.title,
        fraud_type:     step1.fraudCategory,
        victim_name:    step2.victimName,
        victim_phone:   step2.victimContact,
        victim_email:   step2.victimEmail,
        amount_lost:    step3.amountLost ? Number(step3.amountLost) : 0,
        priority:       step1.priority,
        status:         step1.status,
        complaint_text: step3.complaint,
        owner_id:       selectedInvestigator || user?.id,
      });

      const caseId: string = caseData?.case_id ?? caseData?.id ?? '';

      // 2. Upload evidence files (best-effort � non-blocking)
      if (caseId && files.length > 0) {
        await Promise.allSettled(
          files.map((file) => {
            const fd = new FormData();
            fd.append('case_id', caseId);
            fd.append('file', file);
            return api.post('/evidence/upload', fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          })
        );
      }

      navigate('/cases');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string; message?: string } } };
      setSubmitError(
        axiosErr?.response?.data?.detail ||
        axiosErr?.response?.data?.message ||
        'Failed to create case. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------------------------------
     RENDER
  ------------------------------------------- */
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">

      {/* -- Header -- */}
      <div className="flex items-center gap-3">
        <Link
          to="/cases"
          className="p-2 rounded-lg text-[#98A2B3] hover:text-[#F8FAFC] hover:bg-[#0B1220]/50 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-lg font-semibold text-[#F8FAFC]">Register New Case</h2>
          <p className="text-sm text-[#F8FAFC]0">Complete all steps to create an investigation record</p>
        </div>
      </div>

      {/* -- Progress bar -- */}
      <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-5">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-5 h-px bg-slate-700/60 mx-8" />
          <div
            className="absolute left-0 top-5 h-px bg-[#00B8FF] transition-all duration-500 mx-8"
            style={{ width: `calc(${((currentStep - 1) / (steps.length - 1)) * 100}%)` }}
          />
          {steps.map((step) => {
            const done   = currentStep > step.id;
            const active = currentStep === step.id;
            return (
              <div key={step.id} className="flex flex-col items-center gap-2 relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                  done   ? 'bg-[#00B8FF] border-cyan-500 text-[#F8FAFC]' :
                  active ? 'bg-[#00B8FF]/10 border-cyan-400 text-cyan-300' :
                           'bg-[#070B14] border-[#223047] text-[#F8FAFC]0'
                }`}>
                  {done ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                </div>
                <div className="text-center">
                  <p className={`text-xs font-semibold ${active ? 'text-[#F8FAFC]' : done ? 'text-[#00B8FF]' : 'text-[#F8FAFC]0'}`}>
                    {step.label}
                  </p>
                  <p className="text-[10px] text-[#98A2B3] hidden sm:block">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --------------------------------------
          STEP 1 � Case Information
      -------------------------------------- */}
      {currentStep === 1 && (
        <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-6 space-y-5">
          <div className="border-b border-[#223047] pb-4 mb-1">
            <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#00B8FF]" /> Case Information
            </h3>
            <p className="text-xs text-[#F8FAFC]0 mt-0.5">Provide the core details of this investigation</p>
          </div>

          <div>
            <label className={labelCls}>Case Title <span className="text-[#FF4D6D]">*</span></label>
            <input
              type="text"
              value={step1.title}
              onChange={(e) => setStep1({ ...step1, title: e.target.value })}
              onBlur={() => markTouched('title')}
              placeholder="e.g. Investment Scam via Telegram Trading Group"
              className={touched.title && !step1.title.trim() ? inputErrCls : inputCls}
            />
            <FieldError show={!!touched.title && !step1.title.trim()} message="Case title is required" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Fraud Category <span className="text-[#FF4D6D]">*</span></label>
              <select
                value={step1.fraudCategory}
                onChange={(e) => setStep1({ ...step1, fraudCategory: e.target.value as FraudCategory })}
                onBlur={() => markTouched('fraudCategory')}
                className={touched.fraudCategory && !step1.fraudCategory ? selectErrCls : selectCls}
              >
                <option value="">Select Category</option>
                {fraudCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <FieldError show={!!touched.fraudCategory && !step1.fraudCategory} message="Fraud category is required" />
            </div>
            <div>
              <label className={labelCls}>Investigation Status</label>
              <select
                value={step1.status}
                onChange={(e) => setStep1({ ...step1, status: e.target.value as CaseStatus })}
                className={selectCls}
              >
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Priority Level</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {priorities.map((p) => {
                const cfg = priorityConfig[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setStep1({ ...step1, priority: p })}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-all ${
                      step1.priority === p
                        ? cfg.color
                        : 'border-[#223047] bg-[#121B2A]/40 text-[#F8FAFC]0 hover:border-[#223047]'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${step1.priority === p ? cfg.dot : 'bg-slate-600'}`} />
                    <div>
                      <p className="text-xs font-semibold">{p}</p>
                      <p className={`text-[9px] mt-0.5 leading-tight ${step1.priority === p ? 'opacity-80' : 'text-[#98A2B3]'}`}>
                        {cfg.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Assigned Investigator <span className="text-[#FF4D6D]">*</span>
            </label>
            
            {/* Admin: Searchable investigator selector */}
            {permissions.isAdmin() && (
              <div className="space-y-2">
                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#F8FAFC]0" />
                  <input
                    type="text"
                    value={investigatorSearch}
                    onChange={(e) => setInvestigatorSearch(e.target.value)}
                    placeholder="Search investigators by name, department, or email..."
                    className={inputCls + ' pl-9'}
                  />
                </div>
                
                {/* Investigator list */}
                {loadingInvestigators ? (
                  <div className="flex items-center justify-center py-6 text-sm text-[#98A2B3]">
                    <div className="animate-spin w-4 h-4 border-2 border-[#00B8FF] border-t-transparent rounded-full mr-2" />
                    Loading investigators...
                  </div>
                ) : investigators.length === 0 ? (
                  <div className="text-center py-6 text-sm text-[#98A2B3]">
                    No investigators found
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 bg-[#070B14] border border-[#223047] rounded-lg p-2">
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
                          className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                            selectedInvestigator === inv.id
                              ? 'bg-[#00B8FF]/15 border border-[#00B8FF]/30'
                              : 'hover:bg-[#0B1220]/50 border border-transparent'
                          }`}
                        >
                          {inv.profile_photo ? (
                            <img src={inv.profile_photo} alt={inv.full_name} className="w-9 h-9 rounded-lg object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-[#00B8FF]/10 border border-[#00B8FF]/20 flex items-center justify-center">
                              <span className="text-xs font-bold text-[#00B8FF]">
                                {inv.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#F8FAFC] font-medium truncate">{inv.full_name}</p>
                            <p className="text-xs text-[#98A2B3] truncate">{inv.department || inv.role}</p>
                          </div>
                          {inv.is_active ? (
                            <span className="shrink-0 w-2 h-2 rounded-full bg-emerald-500" title="Active" />
                          ) : (
                            <span className="shrink-0 w-2 h-2 rounded-full bg-slate-600" title="Inactive" />
                          )}
                        </button>
                      ))}
                  </div>
                )}
                <p className="text-[10px] text-[#98A2B3]">Select an investigator to assign this case</p>
              </div>
            )}
            
            {/* Investigator: Show self (disabled) */}
            {permissions.isInvestigator() && user && (
              <div className="flex items-center gap-3 px-3 py-2.5 bg-[#070B14] border border-[#223047] rounded-lg opacity-75 cursor-not-allowed">
                {user.profile_photo ? (
                  <img src={user.profile_photo} alt={user.full_name} className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[#00B8FF]/10 border border-[#00B8FF]/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#00B8FF]">
                      {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm text-[#F8FAFC] font-medium">{user.full_name}</p>
                  <p className="text-xs text-[#98A2B3]">{user.department || user.role}</p>
                </div>
              </div>
            )}
            {permissions.isInvestigator() && (
              <p className="text-[10px] text-[#98A2B3] mt-1">Case will be assigned to you automatically</p>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------
          STEP 2 � Victim Information
      -------------------------------------- */}
      {currentStep === 2 && (
        <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-6 space-y-5">
          <div className="border-b border-[#223047] pb-4 mb-1">
            <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
              <User className="w-4 h-4 text-[#00B8FF]" /> Victim Information
            </h3>
            <p className="text-xs text-[#F8FAFC]0 mt-0.5">Personal details of the reporting victim</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Full Name <span className="text-[#FF4D6D]">*</span></label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#F8FAFC]0" />
                <input
                  type="text" value={step2.victimName}
                  onChange={(e) => setStep2({ ...step2, victimName: e.target.value })}
                  onBlur={() => markTouched('victimName')}
                  placeholder="Full legal name" className={(touched.victimName && !step2.victimName.trim() ? inputErrCls : inputCls) + ' pl-9'}
                />
              </div>
              <FieldError show={!!touched.victimName && !step2.victimName.trim()} message="Victim name is required" />
            </div>
            <div>
              <label className={labelCls}>Contact Number <span className="text-[#FF4D6D]">*</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#F8FAFC]0" />
                <input
                  type="text" value={step2.victimContact}
                  onChange={(e) => setStep2({ ...step2, victimContact: e.target.value })}
                  onBlur={() => markTouched('victimContact')}
                  placeholder="+91-XXXXX-XXXXX" className={(touched.victimContact && !phoneValid(step2.victimContact) ? inputErrCls : inputCls) + ' pl-9'}
                />
              </div>
              <FieldError show={!!touched.victimContact && !step2.victimContact.trim()} message="Phone number is required" />
              <FieldError show={!!touched.victimContact && step2.victimContact.trim().length > 0 && !phoneValid(step2.victimContact)} message="Enter at least 10 digits" />
            </div>
            <div>
              <label className={labelCls}>Email Address <span className="text-[#FF4D6D]">*</span></label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#F8FAFC]0" />
                <input
                  type="email" value={step2.victimEmail}
                  onChange={(e) => setStep2({ ...step2, victimEmail: e.target.value })}
                  onBlur={() => markTouched('victimEmail')}
                  placeholder="victim@email.com" className={(touched.victimEmail && !emailValid(step2.victimEmail) ? inputErrCls : inputCls) + ' pl-9'}
                />
              </div>
              <FieldError show={!!touched.victimEmail && !step2.victimEmail.trim()} message="Email address is required" />
              <FieldError show={!!touched.victimEmail && step2.victimEmail.trim().length > 0 && !emailValid(step2.victimEmail)} message="Enter a valid email address" />
            </div>
            <div>
              <label className={labelCls}>Age</label>
              <input
                type="number" value={step2.victimAge}
                onChange={(e) => setStep2({ ...step2, victimAge: e.target.value })}
                placeholder="Age in years" className={inputCls} min="1" max="120"
              />
            </div>
            <div>
              <label className={labelCls}>Occupation</label>
              <input
                type="text" value={step2.victimOccupation}
                onChange={(e) => setStep2({ ...step2, victimOccupation: e.target.value })}
                placeholder="e.g. Software Engineer, Retired" className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 text-[#F8FAFC]0" />
                <input
                  type="text" value={step2.victimAddress}
                  onChange={(e) => setStep2({ ...step2, victimAddress: e.target.value })}
                  placeholder="City, State, PIN" className={inputCls + ' pl-9'}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------
          STEP 3 � Incident Details
      -------------------------------------- */}
      {currentStep === 3 && (
        <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-6 space-y-5">
          <div className="border-b border-[#223047] pb-4 mb-1">
            <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#00B8FF]" /> Incident Details
            </h3>
            <p className="text-xs text-[#F8FAFC]0 mt-0.5">Describe the fraud incident in detail</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Date of Incident</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#F8FAFC]0" />
                <input
                  type="date" value={step3.incidentDate}
                  onChange={(e) => setStep3({ ...step3, incidentDate: e.target.value })}
                  className={inputCls + ' pl-9'}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Amount Lost (?) <span className="text-[#FF4D6D]">*</span></label>
              <input
                type="number" value={step3.amountLost}
                onChange={(e) => setStep3({ ...step3, amountLost: e.target.value })}
                onBlur={() => markTouched('amountLost')}
                placeholder="0.00" className={touched.amountLost && !step3.amountLost.trim() ? inputErrCls : inputCls} min="0"
              />
              <FieldError show={!!touched.amountLost && !step3.amountLost.trim()} message="Amount lost is required" />
            </div>
            <div>
              <label className={labelCls}>Incident Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#F8FAFC]0" />
                <input
                  type="text" value={step3.incidentLocation}
                  onChange={(e) => setStep3({ ...step3, incidentLocation: e.target.value })}
                  placeholder="City / State" className={inputCls + ' pl-9'}
                />
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Victim's Complaint Statement <span className="text-[#FF4D6D]">*</span>
            </label>
            <textarea
              rows={7} value={step3.complaint}
              onChange={(e) => setStep3({ ...step3, complaint: e.target.value })}
              onBlur={() => markTouched('complaint')}
              placeholder="Provide a detailed account � sequence of events, communications, payment details, platform names..."
              className={(touched.complaint && !step3.complaint.trim() ? inputErrCls : inputCls) + ' resize-none'}
            />
            <FieldError show={!!touched.complaint && !step3.complaint.trim()} message="Complaint statement is required" />
            <p className="text-[10px] text-[#98A2B3] mt-1">{step3.complaint.length} characters</p>
          </div>

          <div>
            <label className={labelCls}>Suspected Modus Operandi</label>
            <textarea
              rows={3} value={step3.modus}
              onChange={(e) => setStep3({ ...step3, modus: e.target.value })}
              placeholder="Officer's assessment (e.g. 'pig butchering via Telegram trading group')..."
              className={inputCls + ' resize-none'}
            />
          </div>
        </div>
      )}

      {/* --------------------------------------
          STEP 4 � Evidence Upload
      -------------------------------------- */}
      {currentStep === 4 && (
        <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-6 space-y-5">
          <div className="border-b border-[#223047] pb-4 mb-1">
            <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#00B8FF]" /> Evidence Upload
            </h3>
            <p className="text-xs text-[#F8FAFC]0 mt-0.5">Attach digital evidence (optional � can also be added later)</p>
          </div>

          {/*
            -- REAL HIDDEN FILE INPUT --
            This is the actual DOM element the browser uses to open the file picker.
            It is hidden but programmatically clicked from the drop zone below.
          */}
          <input
            id="evidence-file-input"
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.mp4,.html,.csv,.xlsx,.txt,.gif,.bmp,.webp"
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              // Reset value so the same file can be re-selected
              e.target.value = '';
            }}
          />

          {/* -- Drop zone -- */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload evidence files � click or drag and drop"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
            onDragOver={onDragOver}
            onDragEnter={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-lg p-10 text-center transition-all duration-200 cursor-pointer select-none ${
              isDragging
                ? 'border-cyan-400 bg-[#00B8FF]/10 scale-[1.01]'
                : 'border-[#223047]/60 hover:border-cyan-500/40 hover:bg-[#29C5FF]/5'
            }`}
          >
            <div className={`w-12 h-12 rounded-lg border flex items-center justify-center mx-auto mb-4 transition-all ${
              isDragging ? 'bg-[#00B8FF]/20 border-cyan-400' : 'bg-[#0B1220] border-[#223047]'
            }`}>
              <Upload className={`w-5 h-5 transition-colors ${isDragging ? 'text-[#00B8FF]' : 'text-[#F8FAFC]0'}`} />
            </div>
            <p className="text-sm font-medium text-[#F8FAFC] mb-1">
              {isDragging ? 'Release to attach files' : 'Drop files here or click to browse'}
            </p>
            <p className="text-xs text-[#F8FAFC]0 mb-4">PDF, PNG, JPG, MP4, HTML, CSV � max 50 MB per file</p>
            <div className="flex flex-wrap justify-center gap-2 pointer-events-none">
              {evidenceTypes.map((t) => (
                <span key={t.label} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border ${t.color}`}>
                  <t.icon className="w-3 h-3" /> {t.label}
                </span>
              ))}
            </div>
          </div>

          {/* -- Attached file list -- */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#F8FAFC]0 uppercase tracking-wider">
                Attached Files ({files.length})
              </p>
              {files.map((file, index) => {
                const cfg  = getEvidenceConfig(file);
                const Icon = cfg.icon;
                return (
                  <div
                    key={`${file.name}-${file.size}-${index}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${cfg.color}`}
                  >
                    <div className={`p-2 rounded-lg ${cfg.color} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Render file.name string directly � fixes "[object Object]" */}
                      <p className="text-sm text-[#F8FAFC] truncate">{file.name}</p>
                      <p className="text-xs text-[#F8FAFC]0">{cfg.label} &bull; {formatSize(file.size)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                        aria-label={`Remove ${file.name}`}
                        className="p-1 text-[#98A2B3] hover:text-[#FF4D6D] transition-colors rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* -- Empty state -- */}
          {files.length === 0 && (
            <p className="text-xs text-[#98A2B3] text-center italic">
              No files attached yet. Evidence upload is optional.
            </p>
          )}

          {/* -- API Error -- */}
          {submitError && (
            <div className="text-sm text-[#FF4D6D] bg-[#FF4D6D]/10 border border-red-500/20 rounded-lg px-4 py-3">
              {submitError}
            </div>
          )}

          {/* -- Case Summary -- */}
          <div className="bg-[#070B14] border border-[#223047] rounded-lg p-4">
            <h4 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-3">Case Summary</h4>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-[#F8FAFC]0">Title:</span>
              <span className="text-[#F8FAFC] truncate">{step1.title || '�'}</span>
              <span className="text-[#F8FAFC]0">Category:</span>
              <span className="text-[#F8FAFC]">{step1.fraudCategory || '�'}</span>
              <span className="text-[#F8FAFC]0">Priority:</span>
              <span className={`font-medium ${
                step1.priority === 'Critical' ? 'text-[#FF4D6D]' :
                step1.priority === 'High'     ? 'text-[#FFB020]' : 'text-[#00B8FF]'
              }`}>{step1.priority}</span>
              <span className="text-[#F8FAFC]0">Victim:</span>
              <span className="text-[#F8FAFC]">{step2.victimName || '�'}</span>
              <span className="text-[#F8FAFC]0">Amount Lost:</span>
              <span className="text-[#F8FAFC]">
                {step3.amountLost ? `?${Number(step3.amountLost).toLocaleString('en-IN')}` : '�'}
              </span>
              <span className="text-[#F8FAFC]0">Evidence:</span>
              <span className="text-[#F8FAFC]">
                {files.length > 0 ? `${files.length} file(s) attached` : 'None'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* -- Navigation -- */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => s - 1)}
              className="flex items-center gap-2 px-4 py-2 border border-[#223047] text-[#F8FAFC] text-sm rounded-lg hover:bg-[#0B1220]/50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}
          <button
            type="button"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-[#F8FAFC] text-sm rounded-lg transition-colors"
          >
            <Save className="w-3.5 h-3.5 inline mr-1.5" />Save Draft
          </button>
        </div>

        <div className="flex items-center gap-2">
          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={() => {
                touchStep(currentStep);
                if (canProceed(currentStep)) setCurrentStep((s) => s + 1);
              }}
              disabled={!canProceed(currentStep)}
              className="flex items-center gap-2 px-5 py-2 bg-[#00B8FF] hover:bg-[#29C5FF] disabled:opacity-40 disabled:cursor-not-allowed text-[#F8FAFC] text-sm font-medium rounded-lg transition-colors"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreateCase}
              disabled={submitting || !isFormValid}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-[#00D084] disabled:opacity-50 disabled:cursor-not-allowed text-[#F8FAFC] text-sm font-medium rounded-lg transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {submitting ? 'Creating...' : 'Create Investigation'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
