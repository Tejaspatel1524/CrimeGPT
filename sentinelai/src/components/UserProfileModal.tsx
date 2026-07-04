import { useState, useEffect } from 'react';
import { X, User, Shield, Calendar, Clock, Activity, FileText, Folder, AlertCircle, Lock, MapPin, Phone, Mail, ExternalLink } from 'lucide-react';
import { usersApi } from '@/services/usersApi';
import type { UserProfile } from '@/services/authApi';

interface UserProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onRefresh: () => void;
}

interface UserProfileData {
  user: UserProfile;
  stats: {
    total_cases: number;
  };
  login_history: Array<{
    timestamp: string;
    ip_address?: string;
    user_agent?: string;
    action: string;
  }>;
  recent_activity: Array<{
    timestamp: string;
    action: string;
    activity_type: string;
    details?: string;
    resource_id?: string;
  }>;
}

interface UserCase {
  case_id: string;
  case_number: string;
  title: string;
  fraud_type: string;
  status: string;
  priority: string;
  created_at: string;
  archived: boolean;
}

export default function UserProfileModal({ user, onClose, onRefresh }: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'activity' | 'cases' | 'reports'>('info');
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [cases, setCases] = useState<UserCase[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, [user.id]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [profile, userCases, userReports] = await Promise.all([
        usersApi.getProfile(user.id),
        usersApi.getUserCases(user.id),
        usersApi.getUserReports(user.id),
      ]);
      
      setProfileData(profile);
      setCases(userCases.cases || []);
      setReports(userReports.reports || []);
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
      active: 'text-green-400 bg-green-500/10 border-green-500/20',
      suspended: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      rejected: 'text-red-400 bg-red-500/10 border-red-500/20',
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1a1f3a] border border-cyan-500/20 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{user.full_name}</h2>
              <p className="text-gray-400">{user.email}</p>
              {user.username && <p className="text-gray-500 text-sm">@{user.username}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-cyan-500/10 px-6">
          {[
            { id: 'info', label: 'Information', icon: User },
            { id: 'activity', label: 'Activity', icon: Activity },
            { id: 'cases', label: 'Cases', icon: Folder },
            { id: 'reports', label: 'Reports', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
          ) : (
            <>
              {/* Information Tab */}
              {activeTab === 'info' && profileData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="bg-[#0A0E27]/50 border border-cyan-500/10 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-cyan-400" />
                      Personal Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-gray-400 text-sm">Full Name</div>
                        <div className="text-white font-medium">{user.full_name}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </div>
                        <div className="text-white">{user.email}</div>
                      </div>
                      {user.phone && (
                        <div>
                          <div className="text-gray-400 text-sm flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone
                          </div>
                          <div className="text-white">{user.phone}</div>
                        </div>
                      )}
                      {user.department && (
                        <div>
                          <div className="text-gray-400 text-sm flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Department
                          </div>
                          <div className="text-white">{user.department}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Security Information */}
                  <div className="bg-[#0A0E27]/50 border border-cyan-500/10 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-cyan-400" />
                      Security Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-gray-400 text-sm">Role</div>
                        <div className="text-white font-medium capitalize">{user.role}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Account Status</div>
                        <span className={`inline-block px-3 py-1 rounded-md border text-sm font-medium ${getStatusColor(user.account_status || 'active')}`}>
                          {(user.account_status || 'active').charAt(0).toUpperCase() + (user.account_status || 'active').slice(1)}
                        </span>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Active</div>
                        <div className="text-white">{user.is_active ? 'Yes' : 'No'}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Failed Login Attempts
                        </div>
                        <div className={`font-semibold ${(user.failed_login_attempts || 0) >= 5 ? 'text-red-400' : 'text-white'}`}>
                          {user.failed_login_attempts || 0}
                          {(user.failed_login_attempts || 0) >= 5 && ' (Account Locked)'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Last Login
                        </div>
                        <div className="text-white">{formatDate(user.last_login)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Member Since
                        </div>
                        <div className="text-white">{formatDate(user.created_at)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="bg-[#0A0E27]/50 border border-cyan-500/10 rounded-lg p-6 md:col-span-2">
                    <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-cyan-500/5 rounded-lg">
                        <div className="text-3xl font-bold text-cyan-400">{profileData.stats.total_cases}</div>
                        <div className="text-gray-400 text-sm mt-1">Total Cases</div>
                      </div>
                      <div className="text-center p-4 bg-blue-500/5 rounded-lg">
                        <div className="text-3xl font-bold text-blue-400">{reports.length}</div>
                        <div className="text-gray-400 text-sm mt-1">Reports Generated</div>
                      </div>
                      <div className="text-center p-4 bg-purple-500/5 rounded-lg">
                        <div className="text-3xl font-bold text-purple-400">{profileData.login_history.length}</div>
                        <div className="text-gray-400 text-sm mt-1">Login Sessions</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && profileData && (
                <div className="space-y-6">
                  {/* Login History */}
                  <div className="bg-[#0A0E27]/50 border border-cyan-500/10 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Login History</h3>
                    <div className="space-y-3">
                      {profileData.login_history.length > 0 ? (
                        profileData.login_history.map((login, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-cyan-500/5 rounded-lg">
                            <Clock className="w-5 h-5 text-cyan-400 mt-0.5" />
                            <div className="flex-1">
                              <div className="text-white font-medium">{login.action}</div>
                              <div className="text-gray-400 text-sm">{formatDate(login.timestamp)}</div>
                              {login.ip_address && (
                                <div className="text-gray-500 text-xs mt-1">IP: {login.ip_address}</div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-center py-4">No login history</p>
                      )}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-[#0A0E27]/50 border border-cyan-500/10 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {profileData.recent_activity.length > 0 ? (
                        profileData.recent_activity.map((activity, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-purple-500/5 rounded-lg">
                            <Activity className="w-5 h-5 text-purple-400 mt-0.5" />
                            <div className="flex-1">
                              <div className="text-white font-medium">{activity.action}</div>
                              <div className="text-gray-400 text-sm">{formatDate(activity.timestamp)}</div>
                              {activity.details && (
                                <div className="text-gray-500 text-xs mt-1">{activity.details}</div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-center py-4">No recent activity</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Cases Tab */}
              {activeTab === 'cases' && (
                <div className="bg-[#0A0E27]/50 border border-cyan-500/10 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Assigned Cases ({cases.length})</h3>
                  {cases.length > 0 ? (
                    <div className="space-y-3">
                      {cases.map((caseItem) => (
                        <div key={caseItem.case_id} className="p-4 bg-cyan-500/5 rounded-lg hover:bg-cyan-500/10 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="text-white font-medium">{caseItem.title}</div>
                              <div className="text-gray-400 text-sm mt-1">
                                Case #{caseItem.case_number} • {caseItem.fraud_type}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  caseItem.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                  caseItem.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-green-500/20 text-green-400'
                                }`}>
                                  {caseItem.priority}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  caseItem.status === 'open' ? 'bg-blue-500/20 text-blue-400' :
                                  caseItem.status === 'closed' ? 'bg-gray-500/20 text-gray-400' :
                                  'bg-purple-500/20 text-purple-400'
                                }`}>
                                  {caseItem.status}
                                </span>
                              </div>
                            </div>
                            <div className="text-gray-400 text-sm">{formatDate(caseItem.created_at)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-8">No cases assigned</p>
                  )}
                </div>
              )}

              {/* Reports Tab */}
              {activeTab === 'reports' && (
                <div className="bg-[#0A0E27]/50 border border-cyan-500/10 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Generated Reports ({reports.length})</h3>
                  {reports.length > 0 ? (
                    <div className="space-y-3">
                      {reports.map((report) => (
                        <div key={report.report_id} className="p-4 bg-blue-500/5 rounded-lg hover:bg-blue-500/10 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="text-white font-medium">Report #{report.report_id.slice(0, 8)}</div>
                              <div className="text-gray-400 text-sm mt-1">
                                Case ID: {report.case_id.slice(0, 8)}
                              </div>
                              <div className="mt-2">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  report.risk_level === 'High' ? 'bg-red-500/20 text-red-400' :
                                  report.risk_level === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-green-500/20 text-green-400'
                                }`}>
                                  Risk: {report.risk_score}/100 ({report.risk_level})
                                </span>
                              </div>
                            </div>
                            <div className="text-gray-400 text-sm">{formatDate(report.created_at)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-8">No reports generated</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
