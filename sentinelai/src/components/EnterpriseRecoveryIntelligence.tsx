import { useEffect, useState } from 'react';
import {
  TrendingUp, Shield, AlertTriangle, CheckCircle, Clock, Loader2, 
  XCircle, DollarSign, Target, Zap, FileText, Scale, Phone, 
  Building, Ban, Archive, Info
} from 'lucide-react';
import api from '@/services/api';
import { formatINR } from '@/lib/formatters';

interface RecoveryData {
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

interface Props {
  caseId: string;
  amountLost: number;
}

const LEVEL_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  'High':      { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'Medium':    { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/30' },
  'Low':       { bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/30' },
  'Very Low':  { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/30' },
};

const URGENCY_CONFIG: Record<string, { bg: string; text: string; border: string; label: string; icon: any }> = {
  'Immediate': { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/30',    label: 'Critical (0-24h)', icon: Zap },
  'Urgent':    { bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/30', label: 'High (1-3 Days)', icon: AlertTriangle },
  'High':      { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/30',  label: 'Medium (4-7 Days)', icon: Clock },
  'Medium':    { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/30',   label: 'Low (>7 Days)', icon: Info },
  'Low':       { bg: 'bg-slate-500/10',   text: 'text-[#98A2B3]',   border: 'border-slate-500/30',  label: 'Low (>30 Days)', icon: Archive },
};

/* ═══════════════════════════════════════════════════════════
   SKELETON LOADER
═══════════════════════════════════════════════════════════ */
function RecoverySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#121B2A] border border-[#223047] rounded-xl p-4 h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#121B2A] border border-[#223047] rounded-xl p-5 h-48" />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function EnterpriseRecoveryIntelligence({ caseId, amountLost }: Props) {
  const [data, setData] = useState<RecoveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get(`/cases/${caseId}/recovery`)
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load recovery intelligence.'))
      .finally(() => setLoading(false));
  }, [caseId]);

  if (loading) return <RecoverySkeleton />;

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-[#98A2B3] mb-2">Recovery Analysis Unavailable</h3>
        <p className="text-sm text-[#98A2B3] max-w-md">
          {error || 'Unable to compute recovery intelligence. Please try again later.'}
        </p>
      </div>
    );
  }

  // Calculations
  const probColor = data.recovery_probability >= 76 ? 'text-emerald-400'
    : data.recovery_probability >= 51 ? 'text-amber-400'
    : data.recovery_probability >= 26 ? 'text-orange-400'
    : 'text-red-400';

  const probBg = data.recovery_probability >= 76 ? 'from-emerald-500 to-emerald-700'
    : data.recovery_probability >= 51 ? 'from-amber-500 to-amber-700'
    : data.recovery_probability >= 26 ? 'from-orange-500 to-orange-700'
    : 'from-red-500 to-red-700';

  const levelStyle = LEVEL_STYLE[data.recovery_level] || LEVEL_STYLE['Low'];
  const urgencyConfig = URGENCY_CONFIG[data.urgency] || URGENCY_CONFIG['Medium'];
  const UrgencyIcon = urgencyConfig.icon;

  // Financial recovery calculations
  const recoverableAmount = Math.round(amountLost * (data.recovery_probability / 100));
  const potentialRecovery = data.recovery_probability;

  // Separate positive and negative factors from reasoning
  const positiveFactors = data.reasoning.filter(r => 
    !r.includes('No ') && !r.includes('cannot') && !r.includes('Insufficient') && 
    !r.includes('after 30 days') && !r.includes('already layered')
  );
  const negativeFactors = data.reasoning.filter(r => 
    r.includes('No ') || r.includes('cannot') || r.includes('Insufficient') || 
    r.includes('after 30 days') || r.includes('already layered')
  );

  // Categorize actions by urgency
  const immediateActions = data.recommended_actions.filter(a => 
    a.includes('immediately') || a.includes('1930') || a.includes('Freeze') || a.includes('NOW')
  );
  const urgentActions = data.recommended_actions.filter(a => 
    !immediateActions.includes(a) && (
      a.includes('Request') || a.includes('Raise') || a.includes('Send') || 
      a.includes('Obtain') || a.includes('Issue')
    )
  );
  const standardActions = data.recommended_actions.filter(a => 
    !immediateActions.includes(a) && !urgentActions.includes(a)
  );

  // Legal actions
  const legalActions = data.recommended_actions.filter(a => 
    a.includes('Section') || a.includes('legal') || a.includes('KYC') || 
    a.includes('preservation') || a.includes('Preserve') || a.includes('CDR') || 
    a.includes('IPDR')
  );

  return (
    <div className="space-y-4">
      
      {/* ═══════════════════════════════════════════════════════════
          1. RECOVERY OVERVIEW - KPI CARDS
      ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Recovery Probability */}
        <div className="bg-[#121B2A] border border-[#223047] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider">Recovery Probability</p>
              <p className={`text-3xl font-bold mt-1 ${probColor}`}>{data.recovery_probability}%</p>
            </div>
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${probBg} flex items-center justify-center`}>
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
          </div>
          <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}>
            {data.recovery_level} Confidence
          </span>
        </div>

        {/* Recovery Status / Urgency */}
        <div className="bg-[#121B2A] border border-[#223047] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider">Action Window</p>
              <p className={`text-sm font-bold mt-1 ${urgencyConfig.text}`}>{urgencyConfig.label}</p>
            </div>
            <div className={`w-14 h-14 rounded-xl ${urgencyConfig.bg} border ${urgencyConfig.border} flex items-center justify-center`}>
              <UrgencyIcon className={`w-7 h-7 ${urgencyConfig.text}`} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#98A2B3]" />
            <span className="text-xs text-[#98A2B3]">
              {data.days_since_reported < 1 ? 'Reported today' : `${data.days_since_reported}d since report`}
            </span>
          </div>
        </div>

        {/* Risk Level */}
        <div className="bg-[#121B2A] border border-[#223047] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider">Risk Assessment</p>
              <p className="text-lg font-bold text-[#F8FAFC] mt-1">{data.recovery_level}</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <Shield className="w-7 h-7 text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-[#98A2B3]">
            {data.entity_count} entities • {data.cross_case_matches} cross-case
          </p>
        </div>

        {/* Recovery Status Badge */}
        <div className="bg-[#121B2A] border border-[#223047] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider">Current Status</p>
              <p className={`text-sm font-bold mt-1 ${urgencyConfig.text}`}>{data.urgency}</p>
            </div>
            <div className={`w-14 h-14 rounded-xl ${urgencyConfig.bg} border ${urgencyConfig.border} flex items-center justify-center`}>
              <Target className={`w-7 h-7 ${urgencyConfig.text}`} />
            </div>
          </div>
          <p className="text-xs text-[#98A2B3]">
            Action required: {data.urgency}
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          2. RECOVERY TIMELINE - VISUAL TIMELINE
      ═══════════════════════════════════════════════════════════ */}
      <div className="bg-[#121B2A] border border-[#223047] rounded-xl p-5">
        <h3 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          Recovery Timeline Window
        </h3>
        <div className="space-y-3">
          {/* Timeline visual */}
          <div className="relative">
            <div className="flex items-center gap-2">
              {[
                { label: 'Critical', range: '0-24h', urgency: 'Immediate', color: 'bg-red-500' },
                { label: 'High', range: '1-3d', urgency: 'Urgent', color: 'bg-orange-500' },
                { label: 'Medium', range: '4-7d', urgency: 'High', color: 'bg-amber-500' },
                { label: 'Low', range: '>7d', urgency: 'Medium', color: 'bg-blue-500' },
              ].map((phase, idx) => (
                <div 
                  key={idx} 
                  className={`flex-1 h-10 rounded-lg border ${
                    data.urgency === phase.urgency 
                      ? `${phase.color} border-white/20 shadow-lg` 
                      : 'bg-[#0B1220]/30 border-[#223047]/50'
                  } flex flex-col items-center justify-center transition-all`}
                >
                  <p className={`text-[10px] font-bold ${data.urgency === phase.urgency ? 'text-white' : 'text-slate-600'}`}>
                    {phase.label}
                  </p>
                  <p className={`text-[9px] ${data.urgency === phase.urgency ? 'text-white/80' : 'text-slate-600'}`}>
                    {phase.range}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${urgencyConfig.text.replace('text-', 'bg-')}`} />
              <span className="text-[#98A2B3]">Current Window: <span className={urgencyConfig.text}>{urgencyConfig.label}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          3. FINANCIAL RECOVERY
      ═══════════════════════════════════════════════════════════ */}
      <div className="bg-[#121B2A] border border-[#223047] rounded-xl p-5">
        <h3 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-4 flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          Financial Recovery Estimate
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-1">Amount Lost</p>
            <p className="text-lg font-bold text-red-400">{formatINR(amountLost)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-1">Recoverable</p>
            <p className="text-lg font-bold text-emerald-400">{formatINR(recoverableAmount)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-1">Recovery %</p>
            <p className={`text-lg font-bold ${probColor}`}>{potentialRecovery}%</p>
          </div>
          <div>
            <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-1">Assets ID'd</p>
            <p className="text-lg font-bold text-[#00B8FF]">{data.entity_types_found.filter(t => ['upi', 'bank', 'ifsc'].includes(t)).length}</p>
          </div>
        </div>
        {/* Recovery bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#98A2B3]">Recovery Probability</span>
            <span className={`text-xs font-bold ${probColor}`}>{data.recovery_probability}%</span>
          </div>
          <div className="w-full h-2 bg-[#0B1220]/50 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${probBg} transition-all duration-700`}
              style={{ width: `${data.recovery_probability}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* ═══════════════════════════════════════════════════════════
            4. IMMEDIATE ACTIONS - PRIORITY PANEL
        ═══════════════════════════════════════════════════════════ */}
        <div className="bg-[#121B2A] border border-[#223047] rounded-xl p-5">
          <h3 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-red-400" />
            Immediate Actions
          </h3>
          <div className="space-y-2">
            {immediateActions.length > 0 ? immediateActions.map((action, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-[#F8FAFC] leading-relaxed">{action}</p>
              </div>
            )) : (
              <div className="text-center py-8 text-[#98A2B3] text-xs">
                No immediate critical actions required.
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            5. URGENT ACTIONS
        ═══════════════════════════════════════════════════════════ */}
        <div className="bg-[#121B2A] border border-[#223047] rounded-xl p-5">
          <h3 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            High Priority Actions
          </h3>
          <div className="space-y-2">
            {urgentActions.length > 0 ? urgentActions.slice(0, 6).map((action, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-[#F8FAFC] leading-relaxed">{action}</p>
              </div>
            )) : (
              <div className="text-center py-8 text-[#98A2B3] text-xs">
                No urgent actions at this time.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* ═══════════════════════════════════════════════════════════
            6. POSITIVE FACTORS
        ═══════════════════════════════════════════════════════════ */}
        <div className="bg-[#121B2A] border border-[#223047] rounded-xl p-5">
          <h3 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            Positive Recovery Factors
          </h3>
          <div className="space-y-2.5">
            {positiveFactors.length > 0 ? positiveFactors.map((factor, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-sm text-[#F8FAFC] leading-relaxed">{factor}</p>
              </div>
            )) : (
              <div className="text-center py-8 text-[#98A2B3] text-xs">
                No significant positive factors identified.
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            7. NEGATIVE FACTORS
        ═══════════════════════════════════════════════════════════ */}
        <div className="bg-[#121B2A] border border-[#223047] rounded-xl p-5">
          <h3 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-3 flex items-center gap-2">
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            Negative Recovery Factors
          </h3>
          <div className="space-y-2.5">
            {negativeFactors.length > 0 ? negativeFactors.map((factor, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-[#F8FAFC] leading-relaxed">{factor}</p>
              </div>
            )) : (
              <div className="text-center py-8 text-emerald-500/60 text-xs">
                ✓ No negative factors detected.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          8. LEGAL ACTIONS
      ═══════════════════════════════════════════════════════════ */}
      {legalActions.length > 0 && (
        <div className="bg-[#121B2A] border border-[#223047] rounded-xl p-5">
          <h3 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Scale className="w-3.5 h-3.5 text-purple-400" />
            Legal Actions & Preservation Notices
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {legalActions.map((action, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-purple-500/5 border border-purple-500/10 rounded-lg">
                <FileText className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <p className="text-sm text-[#F8FAFC] leading-relaxed">{action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          9. STANDARD ACTIONS
      ═══════════════════════════════════════════════════════════ */}
      {standardActions.length > 0 && (
        <div className="bg-[#121B2A] border border-[#223047] rounded-xl p-5">
          <h3 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-3 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-[#00B8FF]" />
            Standard Actions
          </h3>
          <div className="space-y-2">
            {standardActions.map((action, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-lg">
                <span className="w-5 h-5 rounded-full bg-slate-700/50 text-[#98A2B3] border border-slate-600/50 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-[#F8FAFC] leading-relaxed">{action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          10. RECOVERY REASONING - WHY THIS SCORE
      ═══════════════════════════════════════════════════════════ */}
      <div className="bg-[#121B2A] border border-[#223047] rounded-xl p-5">
        <h3 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-3 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          Recovery Analysis Reasoning
        </h3>
        <p className="text-sm text-[#98A2B3] mb-4 leading-relaxed">
          The recovery probability of <span className={`font-bold ${probColor}`}>{data.recovery_probability}%</span> is calculated 
          based on the following contributing factors:
        </p>
        <div className="space-y-2">
          {data.reasoning.map((reason, i) => (
            <div 
              key={i} 
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                positiveFactors.includes(reason)
                  ? 'bg-emerald-500/5 border-emerald-500/10'
                  : 'bg-red-500/5 border-red-500/10'
              }`}
            >
              {positiveFactors.includes(reason) ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <p className="text-sm text-[#F8FAFC] leading-relaxed">{reason}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          11. URGENCY BANNER (if immediate/urgent)
      ═══════════════════════════════════════════════════════════ */}
      {(data.urgency === 'Immediate' || data.urgency === 'Urgent') && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          data.urgency === 'Immediate' 
            ? 'bg-red-500/10 border-red-500/30' 
            : 'bg-orange-500/10 border-orange-500/30'
        }`}>
          <AlertTriangle className={`w-6 h-6 shrink-0 ${
            data.urgency === 'Immediate' ? 'text-red-400 animate-pulse' : 'text-orange-400'
          }`} />
          <div>
            <p className={`text-sm font-semibold ${
              data.urgency === 'Immediate' ? 'text-red-300' : 'text-orange-300'
            }`}>
              {data.urgency === 'Immediate' ? '🚨 Critical Action Required - Act NOW' : '⚠️ Urgent Action Required'}
            </p>
            <p className={`text-xs mt-0.5 ${
              data.urgency === 'Immediate' ? 'text-red-400/80' : 'text-orange-400/80'
            }`}>
              {data.urgency === 'Immediate'
                ? 'Call cybercrime helpline 1930 IMMEDIATELY and initiate freeze request. Every minute counts.'
                : 'Act within the next 24-48 hours to maximize recovery probability. Time is critical.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
