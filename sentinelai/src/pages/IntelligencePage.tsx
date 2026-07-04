import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  AlertTriangle, TrendingUp, TrendingDown, Shield, Bell, ChevronRight,
  ArrowUpRight, ArrowDownRight, Target, Clock, CheckCircle, RefreshCw, DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { formatINR, timeAgo } from '@/lib/formatters';

interface IntelData {
  stats: {
    totalAmountLost: number;
    convictionRate: number;
    avgResolutionDays: number;
    activeAlerts: number;
  };
  fraudTrends: {
    category: string;
    currentMonth: number;
    previousMonth: number;
    changePercent: number;
    trend: 'up' | 'down';
  }[];
  categoryDistribution: { category: string; count: number; color: string }[];
  priorityCases: {
    id: string;
    title: string;
    priority: string;
    status: string;
    amountLost: number;
    assignedOfficer: { name: string };
  }[];
  alerts: {
    id: string;
    severity: string;
    title: string;
    description: string;
    timestamp: string;
    source: string;
    acknowledged: boolean;
  }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#070B14] border border-[#223047] rounded-lg px-3 py-1.5 shadow-xl">
      <p className="text-[10px] text-[#98A2B3] mb-0.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-semibold" style={{ color: '#22d3ee' }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

const severityStyle: Record<string, string> = {
  critical: 'bg-[#FF4D6D]/10 text-[#FF4D6D] border border-red-500/20',
  high:     'bg-[#FFB020]/10 text-[#FFB020] border border-amber-500/20',
  medium:   'bg-[#00B8FF]/10 text-[#00B8FF] border border-cyan-500/20',
  low:      'bg-slate-500/10 text-[#98A2B3] border border-slate-500/20',
};

function SkeletonBox({ h = 'h-32' }: { h?: string }) {
  return <div className={`${h} rounded-lg bg-[#121B2A] animate-pulse`} />;
}

export default function IntelligencePage() {
  const [data, setData] = useState<IntelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ackedAlerts, setAckedAlerts] = useState<Set<string>>(new Set());

  const fetchData = () => {
    setLoading(true);
    setError('');
    api.get('/stats/intelligence')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load intelligence data. Ensure the backend is running.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    try {
      const stored = JSON.parse(localStorage.getItem('acked_alerts') || '[]');
      if (Array.isArray(stored)) setAckedAlerts(new Set(stored));
    } catch { /* ignore */ }
  }, []);

  const handleAcknowledge = (alertId: string) => {
    setAckedAlerts((prev) => {
      const next = new Set(prev);
      next.add(alertId);
      localStorage.setItem('acked_alerts', JSON.stringify([...next]));
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} h="h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonBox h="h-64" /><SkeletonBox h="h-64" />
        </div>
        <SkeletonBox h="h-44" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-[#FFB020]/10 flex items-center justify-center border border-amber-500/20">
          <AlertTriangle className="w-6 h-6 text-[#FFB020]" />
        </div>
        <p className="text-xs text-[#98A2B3] max-w-xs">{error || 'No data available.'}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-[#00B8FF] hover:bg-[#29C5FF] text-[#F8FAFC] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, fraudTrends, categoryDistribution, priorityCases, alerts } = data;

  const topMetrics = [
    { label: 'Total Amount Lost', value: formatINR(stats.totalAmountLost), icon: DollarSign, color: 'red', borderColor: 'border-red-500/40' },
    { label: 'Conviction Rate', value: `${stats.convictionRate}%`, icon: Target, color: 'emerald', borderColor: 'border-emerald-500/40' },
    { label: 'Avg Resolution', value: `${stats.avgResolutionDays} days`, icon: Clock, color: 'cyan', borderColor: 'border-cyan-500/40' },
    { label: 'Active Alerts', value: stats.activeAlerts.toString(), icon: Bell, color: 'amber', borderColor: 'border-amber-500/40' },
  ];

  const iconBg: Record<string, string> = {
    red: 'bg-[#FF4D6D]/10 border border-red-500/20',
    emerald: 'bg-[#00D084]/10 border border-emerald-500/20',
    cyan: 'bg-[#00B8FF]/10 border border-cyan-500/20',
    amber: 'bg-[#FFB020]/10 border border-amber-500/20',
  };

  const iconColor: Record<string, string> = {
    red: 'text-[#FF4D6D]',
    emerald: 'text-[#00D084]',
    cyan: 'text-[#00B8FF]',
    amber: 'text-[#FFB020]',
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[#F8FAFC]">Threat Intelligence</h1>
          <p className="text-xs text-[#F8FAFC]0">Real-time fraud analytics and indicators database</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="text-[#98A2B3] hover:text-[#F8FAFC] rounded-lg p-2 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {topMetrics.map((m) => (
          <div
            key={m.label}
            className={`bg-[#121B2A] border border-[#223047] rounded-lg p-4 flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <span className="text-[10px] text-[#F8FAFC]0 uppercase tracking-wider font-semibold">{m.label}</span>
              <div className={`w-7 h-7 rounded ${iconBg[m.color]} flex items-center justify-center`}>
                <m.icon className={`w-4 h-4 ${iconColor[m.color]}`} />
              </div>
            </div>
            <p className="text-lg font-bold text-[#F8FAFC] tracking-tight">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Emerging Fraud Trends */}
        <div className="bg-[#121B2A] border border-[#223047] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#223047] bg-[#070B14]">
            <h3 className="text-xs font-semibold text-[#F8FAFC] flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#00B8FF]" />
              Emerging Fraud Trends
            </h3>
          </div>
          {fraudTrends.length === 0 ? (
            <div className="py-12 text-center text-[#F8FAFC]0 text-xs px-5">
              Insufficient history for active trend mapping.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {fraudTrends.map((trend) => (
                <div
                  key={trend.category}
                  className="flex items-center justify-between p-4 hover:bg-[#0B1220]/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#F8FAFC] truncate">{trend.category}</p>
                    <p className="text-[10px] text-[#F8FAFC]0 mt-0.5">
                      {trend.currentMonth} active cases (previous: {trend.previousMonth})
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-4 shrink-0">
                    {trend.trend === 'up' ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#FF4D6D]" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 text-[#00D084]" />
                    )}
                    <span className={`text-xs font-bold font-mono ${trend.trend === 'up' ? 'text-[#FF4D6D]' : 'text-[#00D084]'}`}>
                      {trend.changePercent > 0 ? '+' : ''}{trend.changePercent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Distribution Chart */}
        <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-4 flex flex-col">
          <h3 className="text-xs font-semibold text-[#F8FAFC] mb-4">Fraud Category Distribution</h3>
          {categoryDistribution.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-[#F8FAFC]0 text-xs py-10">
              No registered category distributions to chart.
            </div>
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryDistribution} layout="vertical">
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 9 }} />
                  <YAxis
                    type="category"
                    dataKey="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 9 }}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Cases" radius={[0, 4, 4, 0]} barSize={12} fill="#22d3ee">
                    {categoryDistribution.map((entry, idx) => (
                      <Bar key={idx} dataKey="count" fill={idx % 2 === 0 ? '#00B4D8' : '#0077B6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Investigation Alerts */}
      <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-[#F8FAFC]">Active Operational Alerts</h3>
          {stats.activeAlerts > 0 && (
            <span className="bg-[#FF4D6D]/10 text-[#FF4D6D] border border-red-500/20 rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
              {stats.activeAlerts} Alerts
            </span>
          )}
        </div>
        <div className="space-y-2">
          {alerts.map((alert) => {
            const isAcked = alert.acknowledged || ackedAlerts.has(alert.id);
            return (
              <div
                key={alert.id}
                className={`flex items-start gap-4 rounded-lg border p-3.5 transition-colors ${
                  isAcked
                    ? 'border-[#223047] bg-[#0B1220]/50 opacity-55'
                    : 'border-[#223047] bg-[#070B14]/20'
                }`}
              >
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${severityStyle[alert.severity] || severityStyle.low}`}>
                  {alert.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <h4 className="text-xs font-semibold text-[#F8FAFC]">{alert.title}</h4>
                    {isAcked && <CheckCircle className="w-3.5 h-3.5 text-[#00D084] shrink-0" />}
                  </div>
                  <p className="text-xs text-[#98A2B3] leading-relaxed mb-3">{alert.description}</p>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 text-[10px] text-[#F8FAFC]0 font-mono">
                      <span>{alert.source}</span>
                      <span>•</span>
                      <span>{timeAgo(alert.timestamp)}</span>
                    </div>
                    {!isAcked && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-2.5 py-1 text-[10px] font-bold rounded bg-[#00B8FF]/10 hover:bg-[#00B8FF]/20 text-[#00B8FF] transition-colors cursor-pointer"
                      >
                        Acknowledge Alert
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {alerts.length === 0 && (
            <div className="py-8 text-center text-[#F8FAFC]0 text-xs">No active operational alerts.</div>
          )}
        </div>
      </div>

      {/* Priority & Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Priority Cases */}
        <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-4">
          <h3 className="text-xs font-semibold text-[#F8FAFC] mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-[#FF4D6D]" />
            Priority Investigations
          </h3>
          {priorityCases.length === 0 ? (
            <div className="py-8 text-center text-[#F8FAFC]0 text-xs">
              No active high-priority cases detected.
            </div>
          ) : (
            <div className="space-y-1.5">
              {priorityCases.map((c) => (
                <Link
                  key={c.id}
                  to={`/cases/${c.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#0B1220]/50 border border-[#223047] transition-colors group bg-[#070B14]/20"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-[#00B8FF]">{c.id.slice(0, 8)}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        c.priority === 'Critical'
                          ? 'bg-[#FF4D6D]/10 text-[#FF4D6D] border border-red-500/20'
                          : 'bg-[#FFB020]/10 text-[#FFB020] border border-amber-500/20'
                      }`}>
                        {c.priority}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-350 truncate">{c.title}</p>
                    <p className="text-[10px] text-[#F8FAFC]0 mt-0.5 font-mono">{formatINR(c.amountLost)}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#98A2B3] group-hover:text-[#00B8FF] shrink-0 ml-2 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Intelligence Summary */}
        <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-4">
          <h3 className="text-xs font-semibold text-[#F8FAFC] mb-3 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[#98A2B3]" />
            Intelligence Summary
          </h3>
          <div className="space-y-2">
            {[
              { label: 'Total Monitored Cases', value: categoryDistribution.reduce((s, c) => s + c.count, 0), highlight: false },
              { label: 'Active Threat Vectors', value: categoryDistribution.length, highlight: false },
              { label: 'Priority Escalations', value: priorityCases.length, highlight: priorityCases.length > 0 },
              { label: 'Active Alerts Queue', value: stats.activeAlerts, highlight: stats.activeAlerts > 0 },
              { label: 'Financial Exposure', value: formatINR(stats.totalAmountLost), highlight: true },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between p-3 rounded-lg bg-[#0B1220]/50 border border-[#223047]">
                <span className="text-xs text-[#98A2B3]">{row.label}</span>
                <span className={`text-xs font-bold font-mono ${row.highlight ? 'text-[#FF4D6D]' : 'text-[#F8FAFC]'}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
