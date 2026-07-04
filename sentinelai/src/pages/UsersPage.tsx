import { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, MoreVertical, UserPlus, 
  CheckCircle, XCircle, Lock, Unlock, Ban, Trash2, 
  Edit, Shield, Eye, AlertCircle, UserCheck
} from 'lucide-react';
import { usersApi, type UserListParams } from '@/services/usersApi';
import type { UserProfile } from '@/services/authApi';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileModal from '@/components/UserProfileModal';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [accountStatusFilter, setAccountStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'full_name' | 'email' | 'last_login'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // UI States
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [page, searchQuery, roleFilter, statusFilter, accountStatusFilter, sortBy, sortOrder]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: UserListParams = {
        page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      
      if (searchQuery) params.search = searchQuery;
      if (roleFilter !== 'all') params.role = roleFilter as any;
      if (statusFilter !== 'all') params.is_active = statusFilter === 'active';
      
      const response = await usersApi.list(params);
      
      // Client-side filter for account_status
      let filteredUsers = response.users;
      if (accountStatusFilter !== 'all') {
        filteredUsers = filteredUsers.filter(u => u.account_status === accountStatusFilter);
      }
      
      setUsers(filteredUsers);
      setTotal(response.total);
      setTotalPages(response.total_pages);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, userId: string) => {
    try {
      setActionLoading(userId);
      setActiveDropdown(null);
      
      switch (action) {
        case 'view':
          const user = users.find(u => u.id === userId);
          if (user) {
            setSelectedUser(user);
            setShowProfileModal(true);
          }
          break;
          
        case 'approve':
          await usersApi.approve(userId);
          await fetchUsers();
          break;
          
        case 'reject':
          if (confirm('Are you sure you want to reject this user registration?')) {
            await usersApi.reject(userId);
            await fetchUsers();
          }
          break;
          
        case 'activate':
          await usersApi.activate(userId);
          await fetchUsers();
          break;
          
        case 'deactivate':
          if (confirm('Are you sure you want to deactivate this user?')) {
            await usersApi.deactivate(userId);
            await fetchUsers();
          }
          break;
          
        case 'suspend':
          if (confirm('Are you sure you want to suspend this user?')) {
            await usersApi.suspend(userId);
            await fetchUsers();
          }
          break;
          
        case 'unlock':
          await usersApi.unlock(userId);
          await fetchUsers();
          break;
          
        case 'delete':
          if (confirm('⚠️ WARNING: This will permanently delete the user and ALL associated data (cases, evidence, reports). This action cannot be undone. Are you absolutely sure?')) {
            await usersApi.delete(userId);
            await fetchUsers();
          }
          break;
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: { icon: Shield, color: 'text-red-400 bg-red-500/10 border-red-500/20', label: 'Admin' },
      investigator: { icon: Users, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Investigator' },
      viewer: { icon: Eye, color: 'text-gray-400 bg-gray-500/10 border-gray-500/20', label: 'Viewer' },
    };
    const badge = badges[role as keyof typeof badges] || badges.viewer;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const getStatusBadge = (user: UserProfile) => {
    if (!user.is_active) {
      return <span className="px-2 py-1 rounded-md border border-gray-500/20 bg-gray-500/10 text-gray-400 text-xs font-medium">Inactive</span>;
    }
    
    const status = user.account_status || 'active';
    const badges = {
      pending: { color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', label: 'Pending Approval', icon: AlertCircle },
      active: { color: 'text-green-400 bg-green-500/10 border-green-500/20', label: 'Active', icon: CheckCircle },
      suspended: { color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', label: 'Suspended', icon: Ban },
      rejected: { color: 'text-red-400 bg-red-500/10 border-red-500/20', label: 'Rejected', icon: XCircle },
    };
    const badge = badges[status as keyof typeof badges] || badges.active;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const getAvailableActions = (user: UserProfile) => {
    const actions = [
      { id: 'view', label: 'View Profile', icon: Eye, color: 'text-blue-400' },
    ];
    
    // Can't perform actions on self
    if (user.id === currentUser?.id) {
      return actions;
    }
    
    const status = user.account_status || 'active';
    
    if (status === 'pending') {
      actions.push(
        { id: 'approve', label: 'Approve', icon: UserCheck, color: 'text-green-400' },
        { id: 'reject', label: 'Reject', icon: XCircle, color: 'text-red-400' }
      );
    }
    
    if (status === 'active' && user.is_active) {
      actions.push(
        { id: 'suspend', label: 'Suspend', icon: Ban, color: 'text-orange-400' },
        { id: 'deactivate', label: 'Deactivate', icon: XCircle, color: 'text-red-400' }
      );
    }
    
    if (status === 'suspended') {
      actions.push({ id: 'activate', label: 'Reactivate', icon: CheckCircle, color: 'text-green-400' });
    }
    
    if (!user.is_active && status !== 'rejected') {
      actions.push({ id: 'activate', label: 'Activate', icon: CheckCircle, color: 'text-green-400' });
    }
    
    if ((user.failed_login_attempts || 0) >= 5) {
      actions.push({ id: 'unlock', label: 'Unlock Account', icon: Unlock, color: 'text-yellow-400' });
    }
    
    actions.push({ id: 'delete', label: 'Delete', icon: Trash2, color: 'text-red-500' });
    
    return actions;
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

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
          <p className="text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E27] p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-cyan-400" />
              User Management
            </h1>
            <p className="text-gray-400 mt-1">Manage system users and permissions</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-[#1a1f3a]/50 backdrop-blur-sm border border-cyan-500/10 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, username..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-[#0A0E27] border border-cyan-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-[#0A0E27] border border-cyan-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="investigator">Investigator</option>
              <option value="viewer">Viewer</option>
            </select>

            {/* Active Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-[#0A0E27] border border-cyan-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Account Status Filter */}
            <select
              value={accountStatusFilter}
              onChange={(e) => {
                setAccountStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-[#0A0E27] border border-cyan-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="all">All Account Status</option>
              <option value="pending">Pending Approval</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#1a1f3a]/50 backdrop-blur-sm border border-cyan-500/10 rounded-xl overflow-hidden">
          {error && (
            <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-400">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0A0E27]/50 border-b border-cyan-500/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Failed Logins</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/5">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#0A0E27]/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-medium">{user.full_name}</div>
                          <div className="text-gray-400 text-sm">{user.email}</div>
                          {user.username && <div className="text-gray-500 text-xs">@{user.username}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4 text-gray-300">{user.department || '-'}</td>
                    <td className="px-6 py-4">{getStatusBadge(user)}</td>
                    <td className="px-6 py-4">
                      {(user.failed_login_attempts || 0) >= 5 ? (
                        <span className="inline-flex items-center gap-1 text-red-400">
                          <Lock className="w-4 h-4" />
                          <span className="font-semibold">{user.failed_login_attempts || 0}</span>
                          <span className="text-xs">(Locked)</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">{user.failed_login_attempts || 0}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(user.last_login)}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(user.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
                          disabled={actionLoading === user.id}
                          className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-400" />
                        </button>

                        {activeDropdown === user.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setActiveDropdown(null)}
                            ></div>
                            <div className="absolute right-0 top-full mt-2 w-56 bg-[#1a1f3a] border border-cyan-500/20 rounded-lg shadow-xl z-20 py-2">
                              {getAvailableActions(user).map((action) => (
                                <button
                                  key={action.id}
                                  onClick={() => handleAction(action.id, user.id)}
                                  className={`w-full px-4 py-2 text-left hover:bg-cyan-500/10 transition-colors flex items-center gap-3 ${action.color}`}
                                >
                                  <action.icon className="w-4 h-4" />
                                  <span>{action.label}</span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && !loading && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No users found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-cyan-500/10 flex items-center justify-between">
              <div className="text-gray-400 text-sm">
                Showing {users.length} of {total} users
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-[#0A0E27] border border-cyan-500/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-500/10 transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-white">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-[#0A0E27] border border-cyan-500/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-500/10 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Profile Modal */}
      {showProfileModal && selectedUser && (
        <UserProfileModal
          user={selectedUser}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedUser(null);
          }}
          onRefresh={fetchUsers}
        />
      )}
    </div>
  );
}
