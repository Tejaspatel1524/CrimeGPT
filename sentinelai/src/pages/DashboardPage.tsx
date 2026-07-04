import { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Briefcase, CheckCircle, AlertTriangle, Activity, ChevronRight, RefreshCw, TrendingDown, PlusCircle, Upload, MessageSquare, FileText, Users, Eye, UserCheck, TrendingUp, Package, Loader2, Clock } from 'lucide-react';
import api from '@/services/api';
import { formatINR, timeAgo } from '@/lib/formatters';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/lib/permissions';
import { usersApi } from '@/services/usersApi';

interface DashboardData {
  stats: { totalCases: number; openCases: number; closedCases: number; highPriorityCases: number; activeInvestigations: number; totalAmountLost: number; convictionRate: number; avgResolutionDays: number };
  monthlyTrends: { month: string; cases: number; resolved: number }[];
  categoryDistribution: { category: string; count: number; percentage: number; color: string }[];
  statusDistribution: { status: string; count: number; color: string }[];
  recentActivities: { id: string; type: string; title: string; description: string; timestamp: string; caseId?: string; caseNumber?: string }[];
}

interface UserStats { cases_assigned: number; cases_closed: number; active_cases: number; reports_generated: number; evidence_uploaded: number }
interface UserStatsSummary { total_users: number; active_users: number; inactive_users: number; online_users: number; by_role: { admin: number; investigator: number; viewer: number } }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return <div className="bg-[#121B2A] border border-[#223047] rounded-lg shadow-xl px-3 py-2 font-mono"><p className="text-xs text-[#98A2B3] mb-1">{label}</p>{payload.map((p: any, i: number) => <p key={i} className="text-sm font-semibold text-[#00B8FF]">{p.name}: {p.value}</p>)}</div>;
};

function Skeleton({ h = 'h-24' }: { h?: string }) { return <div className={`${h} animate-pulse rounded-lg bg-[#0B1220]/50`} />; }

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Memoize permissions to prevent infinite loop
  const permissions = useMemo(() => usePermissions(user?.role || 'viewer'), [user?.role]);
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [usersSummary, setUsersSummary] = useState<UserStatsSummary | null>(null);
  const [myCases, setMyCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const dashboardRes = await api.get('/stats/dashboard');
      setData(dashboardRes.data);
      
      // Use role directly instead of permissions in dependency
      const userRole = user?.role || 'viewer';
      
      if (userRole === 'investigator' || userRole === 'admin') {
        try { const statsRes = await api.get('/auth/stats'); setUserStats(statsRes.data); } catch (err) { console.error('Failed to load user stats:', err); }
      }
      if (userRole === 'admin') {
        try { const usersRes = await usersApi.getStats(); setUsersSummary(usersRes); } catch (err) { console.error('Failed to load users stats:', err); }
      }
      if (userRole === 'investigator' && user) {
        try { const casesRes = await api.get('/cases'); const allCases = casesRes.data || []; setMyCases(allCases.filter((c: any) => c.owner?.id === user.id)); } catch (err) { console.error('Failed to load cases:', err); }
      }
    } catch (err) { setError('Failed to load dashboard data.'); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (permissions.isAdmin()) return <AdminDashboard data={data} usersSummary={usersSummary} loading={loading} error={error} onRefresh={fetchData} navigate={navigate} />;
  if (permissions.isInvestigator()) return <InvestigatorDashboard data={data} userStats={userStats} myCases={myCases} loading={loading} error={error} onRefresh={fetchData} navigate={navigate} user={user} />;
  return <ViewerDashboard data={data} loading={loading} error={error} onRefresh={fetchData} navigate={navigate} />;
}

/* ADMIN DASHBOARD */
interface AdminDashboardProps { data: DashboardData | null; usersSummary: UserStatsSummary | null; loading: boolean; error: string; onRefresh: () => void; navigate: any }

function AdminDashboard({ data, usersSummary, loading, error, onRefresh, navigate }: AdminDashboardProps) {
  if (loading) return <div className="space-y-4 animate-fade-in"><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}</div><Skeleton h="h-64" /></div>;
  if (error || !data) return <div className="flex flex-col items-center justify-center h-64 text-center gap-3"><AlertTriangle className="w-8 h-8 text-[#FFB020]" /><p className="text-xs text-[#98A2B3]">{error || 'No data available.'}</p><button onClick={onRefresh} className="px-4 py-2 bg-[#00B4D8] hover:bg-[#0077B6] text-white text-xs font-semibold rounded-lg transition-colors">Retry</button></div>;

  const { stats, categoryDistribution, statusDistribution, recentActivities } = data;
  const kpiCards = [
    { label: 'Total Users', value: usersSummary?.total_users || 0, sub: `${usersSummary?.active_users || 0} active`, icon: Users, color: 'text-[#00B8FF]' },
    { label: 'Online Users', value: usersSummary?.online_users || 0, sub: 'Currently active', icon: UserCheck, color: 'text-[#00D084]' },
    { label: 'Investigators', value: usersSummary?.by_role.investigator || 0, sub: 'Field officers', icon: Shield, color: 'text-[#00B8FF]' },
    { label: 'Viewers', value: usersSummary?.by_role.viewer || 0, sub: 'Read-only', icon: Eye, color: 'text-[#98A2B3]' },
    { label: 'Total Cases', value: stats.totalCases, sub: `${stats.openCases} active`, icon: Briefcase, color: 'text-[#00B8FF]' },
    { label: 'Open Cases', value: stats.openCases, sub: 'Pending', icon: Package, color: 'text-[#FFB020]' },
    { label: 'Closed Cases', value: stats.closedCases, sub: `${Math.round(stats.closedCases/stats.totalCases*100 || 0)}% resolved`, icon: CheckCircle, color: 'text-[#00D084]' },
    { label: 'High Priority', value: stats.highPriorityCases, sub: 'Critical', icon: AlertTriangle, color: 'text-[#FF4D6D]' }
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold text-[#F8FAFC]">Admin Command Center</h1><p className="text-sm text-[#98A2B3] mt-1">System-wide operations and analytics</p></div><button onClick={onRefresh} disabled={loading} className="inline-flex items-center gap-2 text-sm text-[#F8FAFC] hover:text-[#F8FAFC] border border-[#223047] hover:border-slate-600 hover:bg-[#0B1220]/50 rounded-lg px-4 py-2 transition-all"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button></div>
      <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-6"><div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-lg bg-[#00B8FF]/10 border border-cyan-500/20 flex items-center justify-center"><TrendingDown className="w-6 h-6 text-[#00B8FF]" /></div><div><p className="text-xs text-[#F8FAFC]0 uppercase tracking-wider font-semibold">Total Exposure</p><p className="text-3xl font-bold text-[#F8FAFC] tracking-tight">{formatINR(stats.totalAmountLost)}</p></div></div><div className="flex gap-8"><div><p className="text-xs text-[#F8FAFC]0 uppercase tracking-wider">Cases</p><p className="text-lg font-bold text-[#F8FAFC] mt-1 font-mono">{stats.totalCases}</p></div><div><p className="text-xs text-[#F8FAFC]0 uppercase tracking-wider">Resolution</p><p className="text-lg font-bold text-[#00D084] mt-1 font-mono">{Math.round(stats.closedCases/stats.totalCases*100 || 0)}%</p></div></div></div></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{kpiCards.map(card => { const Icon = card.icon; return <div key={card.label} className="bg-[#121B2A] border border-[#223047] rounded-lg p-4"><div className="flex items-center justify-between mb-3"><span className="text-xs text-[#F8FAFC]0 uppercase tracking-wider font-semibold">{card.label}</span><Icon className={`w-5 h-5 ${card.color}`} /></div><div><p className="text-2xl font-bold text-[#F8FAFC] tracking-tight font-mono">{card.value}</p><p className="text-xs text-[#98A2B3] mt-1">{card.sub}</p></div></div>; })}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="bg-[#121B2A] border border-[#223047] rounded-lg p-5"><div className="mb-4"><h3 className="text-sm font-semibold text-[#F8FAFC]">Cases by Priority</h3></div>{categoryDistribution.length === 0 ? <div className="flex items-center justify-center h-48 text-[#F8FAFC]0 text-sm">No data</div> : <div className="h-[220px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={categoryDistribution} layout="vertical"><XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} /><YAxis type="category" dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} width={120} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="count" fill="#22d3ee" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>}</div><div className="bg-[#121B2A] border border-[#223047] rounded-lg p-5"><div className="mb-4"><h3 className="text-sm font-semibold text-[#F8FAFC]">Case Status</h3></div>{statusDistribution.length === 0 ? <div className="flex items-center justify-center h-48 text-[#F8FAFC]0 text-sm">No data</div> : <div className="space-y-3">{statusDistribution.map((s, i) => { const pct = Math.round((s.count / stats.totalCases) * 100) || 0; return <div key={s.status}><div className="flex justify-between text-sm mb-1"><span className="text-[#98A2B3]">{s.status}</span><span className="font-bold text-[#F8FAFC]">{s.count} <span className="text-[#F8FAFC]0 text-xs">({pct}%)</span></span></div><div className="h-1.5 bg-[#0B1220] rounded-full"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: i % 2 === 0 ? '#22d3ee' : '#06b6d4' }} /></div></div>; })}</div>}</div></div>
      <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-5"><div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-[#F8FAFC]">Recent Activity</h3><Link to="/cases" className="text-sm text-[#00B8FF] hover:text-cyan-300">View All <ChevronRight className="w-4 h-4 inline" /></Link></div>{recentActivities.length === 0 ? <div className="text-center py-12 text-sm text-[#98A2B3]">No activity</div> : <div className="overflow-x-auto border border-[#223047] rounded-lg"><table className="min-w-full divide-y divide-slate-800 text-sm"><thead className="bg-[#070B14]/50"><tr><th className="px-4 py-3 text-left text-xs font-semibold text-[#98A2B3] uppercase">Action</th><th className="px-4 py-3 text-left text-xs font-semibold text-[#98A2B3] uppercase">Case</th><th className="px-4 py-3 text-right text-xs font-semibold text-[#98A2B3] uppercase">Time</th></tr></thead><tbody className="divide-y divide-slate-800">{recentActivities.map(act => <tr key={act.id} onClick={() => act.caseId && navigate(`/cases/${act.caseId}`)} className="hover:bg-[#0B1220]/50 cursor-pointer"><td className="px-4 py-3 text-[#F8FAFC]">{act.title}</td><td className="px-4 py-3 font-mono text-[#00B8FF]">{act.caseNumber || '—'}</td><td className="px-4 py-3 text-right text-[#F8FAFC]0 text-xs">{timeAgo(act.timestamp)}</td></tr>)}</tbody></table></div>}</div>
    </div>
  );
}

/* INVESTIGATOR DASHBOARD */
interface InvestigatorDashboardProps { data: DashboardData | null; userStats: UserStats | null; myCases: any[]; loading: boolean; error: string; onRefresh: () => void; navigate: any; user: any }

function InvestigatorDashboard({ data, userStats, myCases, loading, error, onRefresh, navigate, user }: InvestigatorDashboardProps) {
  if (loading) return <div className="space-y-4 animate-fade-in"><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}</div><Skeleton h="h-64" /></div>;
  if (error || !data) return <div className="flex flex-col items-center justify-center h-64 text-center gap-3"><AlertTriangle className="w-8 h-8 text-[#FFB020]" /><p className="text-xs text-[#98A2B3]">{error || 'No data available.'}</p><button onClick={onRefresh} className="px-4 py-2 bg-[#00B4D8] hover:bg-[#0077B6] text-white text-xs font-semibold rounded-lg transition-colors">Retry</button></div>;

  const myHighPriority = myCases.filter(c => c.priority === 'Critical' || c.priority === 'High');
  const todayCases = myCases.filter(c => new Date(c.created_at).toDateString() === new Date().toDateString());
  const pendingReports = (userStats?.cases_assigned || 0) - (userStats?.reports_generated || 0);

  const kpiCards = [
    { label: 'My Assigned Cases', value: userStats?.cases_assigned || 0, sub: 'Total assigned', icon: Briefcase, color: 'text-[#00B8FF]', link: '/cases' },
    { label: 'High Priority', value: myHighPriority.length, sub: 'Requires attention', icon: AlertTriangle, color: 'text-[#FF4D6D]', link: '/cases' },
    { label: 'Pending Reports', value: pendingReports > 0 ? pendingReports : 0, sub: 'Need reports', icon: FileText, color: 'text-[#FFB020]', link: '/reports' },
    { label: 'Active Cases', value: userStats?.active_cases || 0, sub: 'In progress', icon: Activity, color: 'text-[#00B8FF]', link: '/cases' },
    { label: 'Cases Closed', value: userStats?.cases_closed || 0, sub: 'Completed', icon: CheckCircle, color: 'text-[#00D084]', link: '/cases' },
    { label: "Today's Assignments", value: todayCases.length, sub: 'New today', icon: Clock, color: 'text-purple-400', link: '/cases' }
  ];

  const closureRate = userStats && userStats.cases_assigned > 0 ? Math.round((userStats.cases_closed / userStats.cases_assigned) * 100) : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold text-[#F8FAFC]">My Investigation Dashboard</h1><p className="text-sm text-[#98A2B3] mt-1">Welcome back, {user?.full_name || 'Officer'}</p></div><button onClick={onRefresh} disabled={loading} className="inline-flex items-center gap-2 text-sm text-[#F8FAFC] hover:text-[#F8FAFC] border border-[#223047] hover:border-slate-600 hover:bg-[#0B1220]/50 rounded-lg px-4 py-2 transition-all"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button></div>
      <div className="bg-gradient-to-r from-[#00B8FF]/10 to-transparent border border-cyan-500/20 rounded-lg p-5"><div className="flex items-center justify-between"><div><p className="text-xs text-[#98A2B3] uppercase tracking-wider font-semibold mb-1">Case Closure Rate</p><p className="text-4xl font-bold text-[#F8FAFC]">{closureRate}%</p><p className="text-xs text-[#98A2B3] mt-1">{userStats?.cases_closed || 0} of {userStats?.cases_assigned || 0} cases</p></div><div className="w-20 h-20 rounded-lg bg-[#00B8FF]/10 flex items-center justify-center"><TrendingUp className="w-10 h-10 text-[#00B8FF]" /></div></div></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{kpiCards.map(card => { const Icon = card.icon; return <div key={card.label} onClick={() => navigate(card.link)} className="bg-[#121B2A] border border-[#223047] hover:border-[#223047] rounded-lg p-4 cursor-pointer transition-all"><div className="flex items-center justify-between mb-3"><span className="text-xs text-[#F8FAFC]0 uppercase tracking-wider font-semibold">{card.label}</span><Icon className={`w-5 h-5 ${card.color}`} /></div><div><p className="text-2xl font-bold text-[#F8FAFC] tracking-tight font-mono">{card.value}</p><p className="text-xs text-[#98A2B3] mt-1">{card.sub}</p></div></div>; })}</div>
      <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-4"><h3 className="text-sm font-semibold text-[#F8FAFC] mb-4">Quick Actions</h3><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{[{ label: 'Register Case', icon: PlusCircle, link: '/cases/new' }, { label: 'Upload Evidence', icon: Upload, link: '/cases' }, { label: 'Query CrimeGPT', icon: MessageSquare, link: '/chat' }].map(act => { const Icon = act.icon; return <button key={act.label} onClick={() => navigate(act.link)} className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-[#223047] bg-[#121B2A] hover:bg-[#0B1220] hover:border-[#223047] text-[#F8FAFC] transition-all text-left"><Icon className="w-5 h-5 text-[#00B8FF] shrink-0" /><span className="text-sm font-medium">{act.label}</span></button>; })}</div></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="bg-[#121B2A] border border-[#223047] rounded-lg p-5"><div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-[#F8FAFC]">Recently Updated Cases</h3><Link to="/cases" className="text-sm text-[#00B8FF] hover:text-cyan-300">View All</Link></div>{myCases.length === 0 ? <div className="text-center py-12 text-sm text-[#98A2B3]">No assigned cases</div> : <div className="space-y-3">{myCases.slice(0, 5).map(c => <div key={c.case_id} onClick={() => navigate(`/cases/${c.case_id}`)} className="p-3 bg-[#0B1220]/30 hover:bg-[#0B1220]/50 border border-[#223047] rounded-lg cursor-pointer transition-colors"><div className="flex items-start justify-between mb-2"><p className="text-sm font-medium text-[#F8FAFC] truncate flex-1">{c.title}</p><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${c.priority === 'Critical' ? 'bg-red-500/10 text-[#FF4D6D] border border-red-500/20' : c.priority === 'High' ? 'bg-amber-500/10 text-[#FFB020] border border-amber-500/20' : 'bg-[#00B8FF]/10 text-[#00B8FF] border border-cyan-500/20'}`}>{c.priority}</span></div><div className="flex items-center gap-3 text-xs text-[#98A2B3]"><span className="font-mono">{c.case_number}</span><span>•</span><span>{c.status}</span><span>•</span><span>{timeAgo(c.created_at)}</span></div></div>)}</div>}</div><div className="bg-[#121B2A] border border-[#223047] rounded-lg p-5"><div className="mb-4"><h3 className="text-sm font-semibold text-[#F8FAFC]">High Priority Cases</h3></div>{myHighPriority.length === 0 ? <div className="text-center py-12 text-sm text-[#00D084]">No high priority cases</div> : <div className="space-y-3">{myHighPriority.slice(0, 5).map(c => <div key={c.case_id} onClick={() => navigate(`/cases/${c.case_id}`)} className="p-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-lg cursor-pointer transition-colors"><div className="flex items-start justify-between mb-2"><p className="text-sm font-medium text-[#F8FAFC] truncate flex-1">{c.title}</p><span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-red-500/10 text-[#FF4D6D] border border-red-500/20">{c.priority}</span></div><div className="flex items-center gap-3 text-xs text-[#98A2B3]"><span className="font-mono">{c.case_number}</span><span>•</span><span>{c.status}</span></div></div>)}</div>}</div></div>
    </div>
  );
}

/* VIEWER DASHBOARD */
interface ViewerDashboardProps { data: DashboardData | null; loading: boolean; error: string; onRefresh: () => void; navigate: any }

function ViewerDashboard({ data, loading, error, onRefresh, navigate }: ViewerDashboardProps) {
  if (loading) return <div className="space-y-4 animate-fade-in"><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)}</div><Skeleton h="h-64" /></div>;
  if (error || !data) return <div className="flex flex-col items-center justify-center h-64 text-center gap-3"><AlertTriangle className="w-8 h-8 text-[#FFB020]" /><p className="text-xs text-[#98A2B3]">{error || 'No data available.'}</p><button onClick={onRefresh} className="px-4 py-2 bg-[#00B4D8] hover:bg-[#0077B6] text-white text-xs font-semibold rounded-lg transition-colors">Retry</button></div>;

  const { stats, categoryDistribution, statusDistribution, recentActivities } = data;
  const kpiCards = [
    { label: 'Total Cases', value: stats.totalCases, sub: 'System-wide', icon: Briefcase, color: 'text-[#00B8FF]' },
    { label: 'Open Cases', value: stats.openCases, sub: 'Active', icon: Package, color: 'text-[#FFB020]' },
    { label: 'Closed Cases', value: stats.closedCases, sub: 'Resolved', icon: CheckCircle, color: 'text-[#00D084]' },
    { label: 'High Priority', value: stats.highPriorityCases, sub: 'Critical', icon: AlertTriangle, color: 'text-[#FF4D6D]' }
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold text-[#F8FAFC]">Viewer Dashboard</h1><p className="text-sm text-[#98A2B3] mt-1">Read-only system statistics</p></div><button onClick={onRefresh} disabled={loading} className="inline-flex items-center gap-2 text-sm text-[#F8FAFC] hover:text-[#F8FAFC] border border-[#223047] hover:border-slate-600 hover:bg-[#0B1220]/50 rounded-lg px-4 py-2 transition-all"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button></div>
      <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-6"><div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-lg bg-[#00B8FF]/10 border border-cyan-500/20 flex items-center justify-center"><Eye className="w-6 h-6 text-[#00B8FF]" /></div><div><p className="text-xs text-[#F8FAFC]0 uppercase tracking-wider font-semibold">Total Exposure</p><p className="text-3xl font-bold text-[#F8FAFC] tracking-tight">{formatINR(stats.totalAmountLost)}</p></div></div><div className="flex gap-8"><div><p className="text-xs text-[#F8FAFC]0 uppercase tracking-wider">Cases</p><p className="text-lg font-bold text-[#F8FAFC] mt-1 font-mono">{stats.totalCases}</p></div><div><p className="text-xs text-[#F8FAFC]0 uppercase tracking-wider">Resolution</p><p className="text-lg font-bold text-[#00D084] mt-1 font-mono">{Math.round(stats.closedCases/stats.totalCases*100 || 0)}%</p></div></div></div></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{kpiCards.map(card => { const Icon = card.icon; return <div key={card.label} className="bg-[#121B2A] border border-[#223047] rounded-lg p-4"><div className="flex items-center justify-between mb-3"><span className="text-xs text-[#F8FAFC]0 uppercase tracking-wider font-semibold">{card.label}</span><Icon className={`w-5 h-5 ${card.color}`} /></div><div><p className="text-2xl font-bold text-[#F8FAFC] tracking-tight font-mono">{card.value}</p><p className="text-xs text-[#98A2B3] mt-1">{card.sub}</p></div></div>; })}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="bg-[#121B2A] border border-[#223047] rounded-lg p-5"><div className="mb-4"><h3 className="text-sm font-semibold text-[#F8FAFC]">Cases by Category</h3></div>{categoryDistribution.length === 0 ? <div className="flex items-center justify-center h-48 text-[#F8FAFC]0 text-sm">No data</div> : <div className="h-[220px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={categoryDistribution} layout="vertical"><XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} /><YAxis type="category" dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} width={120} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="count" fill="#22d3ee" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>}</div><div className="bg-[#121B2A] border border-[#223047] rounded-lg p-5"><div className="mb-4"><h3 className="text-sm font-semibold text-[#F8FAFC]">Case Status</h3></div>{statusDistribution.length === 0 ? <div className="flex items-center justify-center h-48 text-[#F8FAFC]0 text-sm">No data</div> : <div className="space-y-3">{statusDistribution.map((s, i) => { const pct = Math.round((s.count / stats.totalCases) * 100) || 0; return <div key={s.status}><div className="flex justify-between text-sm mb-1"><span className="text-[#98A2B3]">{s.status}</span><span className="font-bold text-[#F8FAFC]">{s.count} <span className="text-[#F8FAFC]0 text-xs">({pct}%)</span></span></div><div className="h-1.5 bg-[#0B1220] rounded-full"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: i % 2 === 0 ? '#22d3ee' : '#06b6d4' }} /></div></div>; })}</div>}</div></div>
      <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-5"><div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-[#F8FAFC]">Recent Cases</h3><Link to="/cases" className="text-sm text-[#00B8FF] hover:text-cyan-300">View All</Link></div>{recentActivities.length === 0 ? <div className="text-center py-12 text-sm text-[#98A2B3]">No activity</div> : <div className="overflow-x-auto border border-[#223047] rounded-lg"><table className="min-w-full divide-y divide-slate-800 text-sm"><thead className="bg-[#070B14]/50"><tr><th className="px-4 py-3 text-left text-xs font-semibold text-[#98A2B3] uppercase">Action</th><th className="px-4 py-3 text-left text-xs font-semibold text-[#98A2B3] uppercase">Case</th><th className="px-4 py-3 text-right text-xs font-semibold text-[#98A2B3] uppercase">Time</th></tr></thead><tbody className="divide-y divide-slate-800">{recentActivities.map(act => <tr key={act.id} onClick={() => act.caseId && navigate(`/cases/${act.caseId}`)} className="hover:bg-[#0B1220]/50 cursor-pointer"><td className="px-4 py-3 text-[#F8FAFC]">{act.title}</td><td className="px-4 py-3 font-mono text-[#00B8FF]">{act.caseNumber || '—'}</td><td className="px-4 py-3 text-right text-[#F8FAFC]0 text-xs">{timeAgo(act.timestamp)}</td></tr>)}</tbody></table></div>}</div>
    </div>
  );
}
