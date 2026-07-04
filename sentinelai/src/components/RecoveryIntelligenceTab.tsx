import { useEffect, useState } from 'react';
import { TrendingUp, Shield, AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import api from '@/services/api';

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
}

const LEVEL_STYLE: Record<string, string> = {
  High:      'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  Medium:    'text-amber-400   bg-amber-500/10   border-amber-500/30',
  Low:       'text-orange-400  bg-orange-500/10  border-orange-500/30',
  'Very Low':'text-red-400     bg-red-500/10     border-red-500/30',
};

const URGENCY_STYLE: Record<string, string> = {
  Immediate: 'text-red-400     bg-red-500/10     border-red-500/30',
  Urgent:    'text-orange-400  bg-orange-500/10  border-orange-500/30',
  High:      'text-amber-400   bg-amber-500/10   border-amber-500/30',
  Medium:    'text-cyan-400    bg-cyan-500/10    border-cyan-500/20',
  Low:       'text-slate-400   bg-slate-500/10   border-slate-500/30',
};

export default function RecoveryIntelligenceTab({ caseId }: Props) {
  const [data, setData] = useState<RecoveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(`/cases/${caseId}/recovery`)
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load recovery intelligence.'))
      .finally(() => setLoading(false));
  }, [caseId]);

  if (loading) return (
    <div className="flex items-center justify-center h-48 text-slate-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Computing recovery analysis…
    </div>
  );

  if (error || !data) return (
    <div className="flex items-center justify-center h-48 text-red-400">
      <AlertTriangle className="w-5 h-5 mr-2" /> {error || 'No recovery data available.'}
    </div>
  );

  const probColor = data.recovery_probability >= 76 ? 'text-emerald-400'
    : data.recovery_probability >= 51 ? 'text-amber-400'
    : data.recovery_probability >= 26 ? 'text-orange-400'
    : 'text-red-400';

  const probBg = data.recovery_probability >= 76 ? 'from-emerald-500 to-emerald-700'
    : data.recovery_probability >= 51 ? 'from-amber-500 to-amber-700'
    : data.recovery_probability >= 26 ? 'from-orange-500 to-orange-700'
    : 'from-red-500 to-red-700';

  return (
    <div className="space-y-4">

      {/* ── Hero score cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Recovery Probability */}
        <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${probBg} flex items-center justify-center text-2xl font-black text-white shadow-lg mb-3`}>
            {data.recovery_probability}%
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recovery Probability</p>
          <span className={`mt-2 px-3 py-1 rounded-lg text-xs font-bold border ${LEVEL_STYLE[data.recovery_level] || LEVEL_STYLE['Low']}`}>
            {data.recovery_level}
          </span>
        </div>

        {/* Urgency */}
        <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
          <Clock className="w-10 h-10 mb-2 text-slate-600" />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Action Urgency</p>
          <span className={`px-4 py-2 rounded-xl text-sm font-black border ${URGENCY_STYLE[data.urgency] || URGENCY_STYLE['Medium']}`}>
            {data.urgency}
          </span>
          <p className="text-[10px] text-slate-500 mt-2">Reported {data.days_since_reported < 1 ? 'today' : `${data.days_since_reported}d ago`}</p>
        </div>

        {/* Evidence summary */}
        <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Evidence Available</p>
          <p className="text-2xl font-bold text-slate-100 mb-1">{data.entity_count}</p>
          <p className="text-xs text-slate-500 mb-3">entities extracted</p>
          <div className="flex flex-wrap gap-1.5">
            {(data.entity_types_found || []).map(t => (
              <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700 capitalize">{t}</span>
            ))}
          </div>
          {data.cross_case_matches > 0 && (
            <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {data.cross_case_matches} cross-case match{data.cross_case_matches > 1 ? 'es' : ''}
            </p>
          )}
        </div>
      </div>

      {/* ── Recovery bar ── */}
      <div className="bg-[#111827] border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recovery Score</p>
          <span className={`text-sm font-black ${probColor}`}>{data.recovery_probability}/100</span>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${probBg} transition-all duration-700`}
            style={{ width: `${data.recovery_probability}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-600 mt-1.5">
          <span>Very Low (0)</span><span>Low (26)</span><span>Medium (51)</span><span>High (76)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── Reasoning ── */}
        <div className="bg-[#111827] border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-blue-400" /> Analysis Reasoning
          </h3>
          <ul className="space-y-2">
            {(data.reasoning || []).map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-slate-300 leading-snug">{r}</span>
              </li>
            ))}
            {(!data.reasoning || data.reasoning.length === 0) && (
              <li className="text-xs text-slate-500 italic">No significant factors detected.</li>
            )}
          </ul>
        </div>

        {/* ── Recommended Actions ── */}
        <div className="bg-[#111827] border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Recommended Actions
          </h3>
          <ol className="space-y-2">
            {(data.recommended_actions || []).map((a, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                  i === 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : i <= 2  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-700 text-slate-400 border border-slate-600'
                }`}>{i + 1}</span>
                <span className="text-slate-300 leading-snug">{a}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Urgency banner for high-priority cases */}
      {(data.urgency === 'Immediate' || data.urgency === 'Urgent') && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
          <div>
            <p className="text-sm font-semibold text-red-300">
              {data.urgency === 'Immediate' ? '🚨 Immediate Action Required' : '⚠️ Urgent Action Required'}
            </p>
            <p className="text-xs text-red-400/80 mt-0.5">
              {data.urgency === 'Immediate'
                ? 'Call 1930 NOW and freeze beneficiary accounts before funds are layered.'
                : 'Act within the next 24–48 hours to maximize recovery chances.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
