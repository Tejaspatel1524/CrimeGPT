import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Building, Shield, Calendar, Clock,
  Briefcase, CheckCircle, FileText, Upload, Settings, Activity,
  Award, TrendingUp, AlertCircle, Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { formatDate, formatDateTime } from '@/lib/formatters';

interface UserStats {
  cases_assigned: number;
  cases_closed: number;
  active_cases: number;
  reports_generated: number;
  evidence_uploaded: number;
}

interface RecentActivity {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  type: 'case' | 'report' | 'evidence' | 'note' | 'login';
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  // Fetch user statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError('');
        const response = await api.get('/auth/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setStatsError('Failed to load statistics');
        // Set default stats on error
        setStats({
          cases_assigned: 0,
          cases_closed: 0,
          active_cases: 0,
          reports_generated: 0,
          evidence_uploaded: 0,
        });
      } finally {
        setStatsLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  // Fetch recent activity from backend audit logs
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setActivityLoading(true);
        const response = await api.get('/auth/activity', {
          params: { limit: 20 }
        });
        
        if (response.data && Array.isArray(response.data)) {
          setRecentActivity(response.data);
        } else {
          // Fallback to empty if API returns unexpected format
          setRecentActivity([]);
        }
      } catch (error) {
        console.error('Failed to fetch activity:', error);
        // Fallback to basic activity on error
        const activities: RecentActivity[] = [];
        
        if (user?.last_login) {
          activities.push({
            id: '1',
            action: 'Logged In',
            details: 'Authenticated successfully',
            timestamp: user.last_login,
            type: 'login'
          });
        }
        
        setRecentActivity(activities);
      } finally {
        setActivityLoading(false);
      }
    };

    if (user) {
      fetchActivity();
    }
  }, [user]);

  // Get user initials
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-[#FF4D6D] border-red-500/20';
      case 'investigator':
        return 'bg-[#00B8FF]/10 text-[#00B8FF] border-cyan-500/20';
      case 'viewer':
        return 'bg-[#98A2B3]/10 text-[#98A2B3] border-slate-500/20';
      default:
        return 'bg-[#98A2B3]/10 text-[#98A2B3] border-slate-500/20';
    }
  };

  // Activity type icon
  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'case':
        return <Briefcase className="w-4 h-4" />;
      case 'report':
        return <FileText className="w-4 h-4" />;
      case 'evidence':
        return <Upload className="w-4 h-4" />;
      case 'note':
        return <FileText className="w-4 h-4" />;
      case 'login':
        return <Activity className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#00B8FF] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="w-8 h-8 text-[#FFB020]" />
        <p className="text-sm text-[#98A2B3]">User not authenticated</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Cases Assigned',
      value: stats?.cases_assigned || 0,
      icon: Briefcase,
      color: 'text-[#00B8FF]',
      bgColor: 'bg-[#00B8FF]/10',
      borderColor: 'border-cyan-500/20'
    },
    {
      label: 'Cases Closed',
      value: stats?.cases_closed || 0,
      icon: CheckCircle,
      color: 'text-[#00D084]',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
    {
      label: 'Pending Cases',
      value: stats?.active_cases || 0,
      icon: TrendingUp,
      color: 'text-[#FFB020]',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20'
    },
    {
      label: 'High Priority',
      value: 0, // This will be calculated from active cases with high priority
      icon: AlertCircle,
      color: 'text-[#FF4D6D]',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    },
    {
      label: 'Reports Generated',
      value: stats?.reports_generated || 0,
      icon: FileText,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/20'
    },
    {
      label: 'Evidence Uploaded',
      value: stats?.evidence_uploaded || 0,
      icon: Upload,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20'
    }
  ];

  const closureRate = stats && stats.cases_assigned > 0
    ? Math.round((stats.cases_closed / stats.cases_assigned) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Profile Header */}
      <div className="bg-[#121B2A] border border-[#223047] rounded-lg overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-[#00B8FF]/10 via-[#00B8FF]/5 to-transparent" />
        
        {/* Profile Info */}
        <div className="px-6 pb-6 -mt-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
            {/* Avatar */}
            <div
              onClick={() => navigate('/settings')}
              className="relative cursor-pointer group"
              title="Click to update profile photo"
            >
              {user.profile_photo ? (
                <img
                  src={user.profile_photo}
                  alt={user.full_name}
                  className="w-32 h-32 rounded-xl object-cover border-4 border-[#121B2A] shadow-xl group-hover:opacity-80 transition-opacity"
                />
              ) : (
                <div className="w-32 h-32 rounded-xl bg-[#00B8FF]/10 border-4 border-[#121B2A] flex items-center justify-center shadow-xl group-hover:bg-[#00B8FF]/20 transition-colors">
                  <span className="text-4xl font-bold text-[#00B8FF]">
                    {getInitials(user.full_name)}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#F8FAFC]">{user.full_name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}>
                  <Shield className="w-3 h-3" />
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
                {user.department && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#98A2B3]/10 text-[#98A2B3] border border-slate-500/20">
                    <Building className="w-3 h-3" />
                    {user.department}
                  </span>
                )}
                {user.is_active && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-[#00D084] border border-emerald-500/20">
                    <CheckCircle className="w-3 h-3" />
                    Active
                  </span>
                )}
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => navigate('/settings')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00B8FF] hover:bg-[#29C5FF] text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal & Professional Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Personal Information */}
          <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#F8FAFC] mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#00B8FF]" />
              Personal Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#98A2B3] uppercase tracking-wider block mb-1">Email</label>
                <div className="flex items-center gap-2 text-sm text-[#F8FAFC]">
                  <Mail className="w-4 h-4 text-[#00B8FF]" />
                  <span>{user.email}</span>
                </div>
              </div>
              {user.phone && (
                <div>
                  <label className="text-xs text-[#98A2B3] uppercase tracking-wider block mb-1">Phone</label>
                  <div className="flex items-center gap-2 text-sm text-[#F8FAFC]">
                    <Phone className="w-4 h-4 text-[#00B8FF]" />
                    <span>{user.phone}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#F8FAFC] mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#00B8FF]" />
              Professional Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#98A2B3] uppercase tracking-wider block mb-1">Role</label>
                <span className="text-sm text-[#F8FAFC] font-medium">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
              {user.department && (
                <div>
                  <label className="text-xs text-[#98A2B3] uppercase tracking-wider block mb-1">Department</label>
                  <span className="text-sm text-[#F8FAFC]">{user.department}</span>
                </div>
              )}
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#F8FAFC] mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#00B8FF]" />
              Account Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#98A2B3] uppercase tracking-wider block mb-1">Member Since</label>
                <div className="flex items-center gap-2 text-sm text-[#F8FAFC]">
                  <Calendar className="w-4 h-4 text-[#00B8FF]" />
                  <span>{formatDate(user.created_at)}</span>
                </div>
              </div>
              {user.last_login && (
                <div>
                  <label className="text-xs text-[#98A2B3] uppercase tracking-wider block mb-1">Last Login</label>
                  <div className="flex items-center gap-2 text-sm text-[#F8FAFC]">
                    <Clock className="w-4 h-4 text-[#00B8FF]" />
                    <span>{formatDateTime(user.last_login)}</span>
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs text-[#98A2B3] uppercase tracking-wider block mb-1">Status</label>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  user.is_active 
                    ? 'bg-emerald-500/10 text-[#00D084] border border-emerald-500/20' 
                    : 'bg-red-500/10 text-[#FF4D6D] border border-red-500/20'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-[#00D084]' : 'bg-[#FF4D6D]'}`} />
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Statistics & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Overview */}
          {stats && (
            <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#00B8FF]" />
                  Performance Overview
                </h3>
                {statsLoading && (
                  <Loader2 className="w-4 h-4 text-[#00B8FF] animate-spin" />
                )}
              </div>

              {statsError ? (
                <div className="text-sm text-[#FFB020] bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {statsError}
                </div>
              ) : (
                <>
                  {/* Case Closure Rate Banner */}
                  <div className="bg-gradient-to-r from-[#00B8FF]/10 to-transparent border border-cyan-500/20 rounded-lg p-4 mb-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#98A2B3] uppercase tracking-wider font-semibold mb-1">Case Closure Rate</p>
                        <p className="text-3xl font-bold text-[#F8FAFC]">{closureRate}%</p>
                      </div>
                      <div className="w-16 h-16 rounded-lg bg-[#00B8FF]/10 flex items-center justify-center">
                        <TrendingUp className="w-8 h-8 text-[#00B8FF]" />
                      </div>
                    </div>
                  </div>

                  {/* Statistics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {statCards.map((stat) => {
                      const Icon = stat.icon;
                      return (
                        <div
                          key={stat.label}
                          className={`border ${stat.borderColor} ${stat.bgColor} rounded-lg p-4`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-[#98A2B3] uppercase tracking-wider font-semibold">
                              {stat.label}
                            </span>
                            <Icon className={`w-5 h-5 ${stat.color}`} />
                          </div>
                          <p className="text-2xl font-bold text-[#F8FAFC] font-mono">{stat.value}</p>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#00B8FF]" />
                Recent Activity
              </h3>
              {activityLoading && (
                <Loader2 className="w-4 h-4 text-[#00B8FF] animate-spin" />
              )}
            </div>

            {activityLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-[#0B1220]/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-12 text-sm text-[#98A2B3]">
                No recent activity recorded
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 bg-[#0B1220]/30 hover:bg-[#0B1220]/50 border border-[#223047] rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#00B8FF]/10 flex items-center justify-center shrink-0 text-[#00B8FF]">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#F8FAFC]">{activity.action}</p>
                      <p className="text-xs text-[#98A2B3] mt-0.5">{activity.details}</p>
                    </div>
                    <span className="text-xs text-[#98A2B3] whitespace-nowrap">
                      {formatDateTime(activity.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
