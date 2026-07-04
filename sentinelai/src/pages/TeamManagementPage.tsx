import { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, Filter, Plus, Edit2, Power, PowerOff, Key, Eye,
  Loader2, AlertCircle, Check, X, Shield, Mail, Phone, Building,
  Calendar, Clock, ChevronLeft, ChevronRight, RefreshCw, XCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/services/usersApi';
import type { UserProfile } from '@/services/authApi';
import { formatDate, formatDateTime } from '@/lib/formatters';
import { getRoleBadgeColor, getRoleDisplayName, getPermissionDescription } from '@/lib/permissions';

type DialogMode = 'none' | 'view' | 'edit' | 'create' | 'reset' | 'activate' | 'deactivate' | 'changeRole';

interface UserFormData {
  full_name: string;
  email: string;
  username: string;
  password: string;
  role: 'admin' | 'investigator' | 'viewer';
  department: string;
  phone: string;
}

interface UserStats {
  cases_assigned: number;
  reports_generated: number;
}

const initialFormData: UserFormData = {
  full_name: '',
  email: '',
  username: '',
  password: '',
  role: 'investigator',
  department: '',
  phone: ''
};

const inputClasses =
  'w-full px-3.5 py-2.5 bg-[#070B14] border border-[#223047] rounded-lg text-sm text-[#F8FAFC] placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-[#00B4D8]/20 transition-all';
const labelClasses = 'block text-sm font-medium text-[#F8FAFC] mb-1.5';
const errorClasses = 'text-xs text-[#FF4D6D] mt-1';

export default function TeamManagementPage() {
  const { user } = useAuth();
  
  // Check admin access
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-[#FF4D6D]" />
        </div>
        <h2 className="text-xl font-bold text-[#F8FAFC]">Access Denied</h2>
        <p className="text-sm text-[#98A2B3] max-w-md text-center">
          You do not have permission to access Team Management. This page is restricted to administrators only.
        </p>
      </div>
    );
  }

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userCaseCounts, setUserCaseCounts] = useState<Record<string, number>>({});
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>('none');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'investigator' | 'viewer'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'full_name' | 'email' | 'last_login'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Form state
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newRole, setNewRole] = useState<'admin' | 'investigator' | 'viewer'>('investigator');
  const [newPassword, setNewPassword] = useState('');
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {
        page,
        per_page: 10,
        sort_by: sortBy,
        sort_order: sortOrder
      };
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.is_active = statusFilter === 'active';

      const response = await usersApi.list(params);
      setUsers(response.users);
      setTotal(response.total);
      setTotalPages(response.total_pages);
      
      // Fetch case counts for investigators
      try {
        const casesRes = await fetch('http://localhost:8000/cases', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('sentinelai_token')}` }
        });
        if (casesRes.ok) {
          const cases = await casesRes.json();
          const counts: Record<string, number> = {};
          response.users.forEach((u: UserProfile) => {
            if (u.role === 'investigator') {
              counts[u.id] = cases.filter((c: any) => c.owner?.id === u.id).length;
            }
          });
          setUserCaseCounts(counts);
        }
      } catch (err) {
        console.error('Failed to load case counts:', err);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Helper functions
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  // Action handlers
  const handleView = async (userToView: UserProfile) => {
    setSelectedUser(userToView);
    setDialogMode('view');
    // Fetch user stats
    try {
      const response = await fetch(`http://localhost:8000/auth/stats`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('sentinelai_token')}` }
      });
      if (response.ok) {
        const stats = await response.json();
        setUserStats(stats);
      }
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
    }
  };

  const handleEdit = (userToEdit: UserProfile) => {
    setSelectedUser(userToEdit);
    setFormData({
      full_name: userToEdit.full_name,
      email: userToEdit.email,
      username: userToEdit.username || '',
      password: '',
      role: userToEdit.role,
      department: userToEdit.department || '',
      phone: userToEdit.phone || ''
    });
    setFormErrors({});
    setDialogMode('edit');
  };

  const handleCreate = () => {
    setFormData({ ...initialFormData, password: generatePassword() });
    setFormErrors({});
    setDialogMode('create');
  };

  const handleChangeRole = (userToChange: UserProfile) => {
    setSelectedUser(userToChange);
    setNewRole(userToChange.role);
    setDialogMode('changeRole');
  };

  const handleResetPassword = (userToReset: UserProfile) => {
    setSelectedUser(userToReset);
    setNewPassword(generatePassword());
    setDialogMode('reset');
  };

  const handleActivate = (userToActivate: UserProfile) => {
    setSelectedUser(userToActivate);
    setDialogMode('activate');
  };

  const handleDeactivate = (userToDeactivate: UserProfile) => {
    setSelectedUser(userToDeactivate);
    setDialogMode('deactivate');
  };

  // Submit handlers
  const handleSubmitCreate = async () => {
    setFormErrors({});
    const errors: Record<string, string> = {};
    
    if (!formData.full_name) errors.full_name = 'Name is required';
    if (!formData.email) errors.email = 'Email is required';
    if (!formData.password) errors.password = 'Password is required';
    if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setActionLoading(true);
      await usersApi.create({
        full_name: formData.full_name,
        email: formData.email,
        username: formData.username || undefined,
        password: formData.password,
        role: formData.role,
        department: formData.department || undefined,
        phone: formData.phone || undefined
      });
      setSuccess(`User ${formData.full_name} created successfully`);
      setDialogMode('none');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setFormErrors({ submit: err.response?.data?.detail || 'Failed to create user' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedUser) return;
    setFormErrors({});
    
    try {
      setActionLoading(true);
      await usersApi.update(selectedUser.id, {
        full_name: formData.full_name,
        email: formData.email,
        username: formData.username || undefined,
        role: formData.role,
        department: formData.department || undefined,
        phone: formData.phone || undefined
      });
      setSuccess(`User ${formData.full_name} updated successfully`);
      setDialogMode('none');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setFormErrors({ submit: err.response?.data?.detail || 'Failed to update user' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitChangeRole = async () => {
    if (!selectedUser) return;
    
    try {
      setActionLoading(true);
      await usersApi.update(selectedUser.id, { role: newRole });
      setSuccess(`Role changed to ${getRoleDisplayName(newRole)} for ${selectedUser.full_name}`);
      setDialogMode('none');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to change role');
      setTimeout(() => setError(''), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitResetPassword = async () => {
    if (!selectedUser) return;
    
    try {
      setActionLoading(true);
      await usersApi.resetPassword(selectedUser.id, newPassword);
      setSuccess(`Password reset successfully for ${selectedUser.full_name}`);
      setDialogMode('none');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password');
      setTimeout(() => setError(''), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitActivate = async () => {
    if (!selectedUser) return;
    
    try {
      setActionLoading(true);
      await usersApi.activate(selectedUser.id);
      setSuccess(`User ${selectedUser.full_name} activated successfully`);
      setDialogMode('none');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to activate user');
      setTimeout(() => setError(''), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitDeactivate = async () => {
    if (!selectedUser) return;
    
    try {
      setActionLoading(true);
      await usersApi.deactivate(selectedUser.id);
      setSuccess(`User ${selectedUser.full_name} deactivated successfully`);
      setDialogMode('none');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to deactivate user');
      setTimeout(() => setError(''), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const closeDialog = () => {
    setDialogMode('none');
    setSelectedUser(null);
    setFormData(initialFormData);
    setFormErrors({});
    setUserStats(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#00B8FF]" />
            Team Management
          </h1>
          <p className="text-sm text-[#98A2B3] mt-1">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#223047] hover:border-slate-600 rounded-lg text-sm font-medium text-[#F8FAFC] hover:bg-[#0B1220]/50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00B8FF] hover:bg-[#29C5FF] rounded-lg text-sm font-semibold text-white transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Team Member
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-[#00D084]">
          <Check className="w-4 h-4" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-[#FF4D6D]">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
              <input
                type="text"
                placeholder="Search by name, email, username..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-[#070B14] border border-[#223047] rounded-lg text-sm text-[#F8FAFC] placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-[#00B4D8]/20"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value as any); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-[#070B14] border border-[#223047] rounded-lg text-sm text-[#F8FAFC] focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-[#00B4D8]/20"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="investigator">Investigator</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
              className="w-full px-4 py-2.5 bg-[#070B14] border border-[#223047] rounded-lg text-sm text-[#F8FAFC] focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-[#00B4D8]/20"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#121B2A] border border-[#223047] rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#00B8FF] animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-[#98A2B3] mx-auto mb-4" />
            <p className="text-sm text-[#98A2B3]">
              {search || roleFilter !== 'all' || statusFilter !== 'all' 
                ? 'No users match your filters' 
                : 'No team members yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#070B14] border-b border-[#223047]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#00B8FF] uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#00B8FF] uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#00B8FF] uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#00B8FF] uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#00B8FF] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#00B8FF] uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#00B8FF] uppercase tracking-wider">
                      Assigned Cases
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-[#00B8FF] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#223047]">
                  {users.map((userItem) => (
                    <tr key={userItem.id} className="hover:bg-[#0B1220]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {userItem.profile_photo ? (
                            <img
                              src={userItem.profile_photo}
                              alt={userItem.full_name}
                              className="w-10 h-10 rounded-lg object-cover border border-[#223047]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#00B8FF]/10 border border-cyan-500/20 flex items-center justify-center">
                              <span className="text-sm font-bold text-[#00B8FF]">
                                {getInitials(userItem.full_name)}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-[#F8FAFC]">{userItem.full_name}</p>
                            {userItem.username && (
                              <p className="text-xs text-[#98A2B3] font-mono">@{userItem.username}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#F8FAFC] font-mono">{userItem.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(userItem.role)}`}>
                          <Shield className="w-3 h-3" />
                          {getRoleDisplayName(userItem.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#98A2B3]">{userItem.department || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          userItem.is_active
                            ? 'bg-emerald-500/10 text-[#00D084] border-emerald-500/20'
                            : 'bg-red-500/10 text-[#FF4D6D] border-red-500/20'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${userItem.is_active ? 'bg-[#00D084]' : 'bg-[#FF4D6D]'}`} />
                          {userItem.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#98A2B3] font-mono">
                          {userItem.last_login ? formatDateTime(userItem.last_login) : 'Never'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {userItem.role === 'investigator' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#F8FAFC] font-mono">{userCaseCounts[userItem.id] || 0}</span>
                            <span className="text-xs text-[#98A2B3]">cases</span>
                          </div>
                        ) : (
                          <span className="text-sm text-[#98A2B3]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleView(userItem)}
                            className="p-2 hover:bg-[#0B1220] rounded-lg transition-colors"
                            title="View User"
                          >
                            <Eye className="w-4 h-4 text-[#00B8FF]" />
                          </button>
                          <button
                            onClick={() => handleEdit(userItem)}
                            className="p-2 hover:bg-[#0B1220] rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4 text-[#00B8FF]" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(userItem)}
                            className="p-2 hover:bg-[#0B1220] rounded-lg transition-colors"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4 text-[#FFB020]" />
                          </button>
                          {userItem.is_active ? (
                            <button
                              onClick={() => handleDeactivate(userItem)}
                              className="p-2 hover:bg-[#0B1220] rounded-lg transition-colors"
                              title="Deactivate User"
                              disabled={userItem.id === user.id}
                            >
                              <PowerOff className={`w-4 h-4 ${userItem.id === user.id ? 'text-[#98A2B3] opacity-50' : 'text-[#FF4D6D]'}`} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(userItem)}
                              className="p-2 hover:bg-[#0B1220] rounded-lg transition-colors"
                              title="Activate User"
                            >
                              <Power className="w-4 h-4 text-[#00D084]" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#223047]">
                <p className="text-sm text-[#98A2B3]">
                  Showing {users.length} of {total} users
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-[#223047] rounded-lg hover:bg-[#0B1220] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#F8FAFC]" />
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-[#F8FAFC]">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-[#223047] rounded-lg hover:bg-[#0B1220] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-[#F8FAFC]" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* View User Modal */}
      {dialogMode === 'view' && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#121B2A] border border-[#223047] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#121B2A] border-b border-[#223047] px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#F8FAFC]">User Profile</h3>
              <button
                onClick={closeDialog}
                className="p-2 hover:bg-[#0B1220] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#98A2B3]" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Photo & Name */}
              <div className="flex items-center gap-4">
                {selectedUser.profile_photo ? (
                  <img
                    src={selectedUser.profile_photo}
                    alt={selectedUser.full_name}
                    className="w-20 h-20 rounded-xl object-cover border-2 border-[#223047]"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-[#00B8FF]/10 border-2 border-cyan-500/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-[#00B8FF]">
                      {getInitials(selectedUser.full_name)}
                    </span>
                  </div>
                )}
                <div>
                  <h4 className="text-xl font-bold text-[#F8FAFC]">{selectedUser.full_name}</h4>
                  <p className="text-sm text-[#98A2B3] mt-1">{selectedUser.email}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#070B14] border border-[#223047] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-[#00B8FF]" />
                    <label className="text-xs text-[#98A2B3] uppercase tracking-wider">Role</label>
                  </div>
                  <p className="text-sm font-semibold text-[#F8FAFC]">{getRoleDisplayName(selectedUser.role)}</p>
                </div>

                <div className="p-4 bg-[#070B14] border border-[#223047] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="w-4 h-4 text-[#00B8FF]" />
                    <label className="text-xs text-[#98A2B3] uppercase tracking-wider">Department</label>
                  </div>
                  <p className="text-sm font-semibold text-[#F8FAFC]">{selectedUser.department || '—'}</p>
                </div>

                <div className="p-4 bg-[#070B14] border border-[#223047] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-[#00B8FF]" />
                    <label className="text-xs text-[#98A2B3] uppercase tracking-wider">Phone</label>
                  </div>
                  <p className="text-sm font-semibold text-[#F8FAFC] font-mono">{selectedUser.phone || '—'}</p>
                </div>

                <div className="p-4 bg-[#070B14] border border-[#223047] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-[#00B8FF]" />
                    <label className="text-xs text-[#98A2B3] uppercase tracking-wider">Member Since</label>
                  </div>
                  <p className="text-sm font-semibold text-[#F8FAFC]">{formatDate(selectedUser.created_at)}</p>
                </div>

                <div className="p-4 bg-[#070B14] border border-[#223047] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-[#00B8FF]" />
                    <label className="text-xs text-[#98A2B3] uppercase tracking-wider">Last Login</label>
                  </div>
                  <p className="text-sm font-semibold text-[#F8FAFC]">
                    {selectedUser.last_login ? formatDateTime(selectedUser.last_login) : 'Never'}
                  </p>
                </div>

                <div className="p-4 bg-[#070B14] border border-[#223047] rounded-lg">
                  <label className="text-xs text-[#98A2B3] uppercase tracking-wider block mb-2">Status</label>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    selectedUser.is_active
                      ? 'bg-emerald-500/10 text-[#00D084] border-emerald-500/20'
                      : 'bg-red-500/10 text-[#FF4D6D] border-red-500/20'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${selectedUser.is_active ? 'bg-[#00D084]' : 'bg-[#FF4D6D]'}`} />
                    {selectedUser.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Permission Description */}
              <div className="p-4 bg-[#00B8FF]/5 border border-cyan-500/20 rounded-lg">
                <p className="text-xs text-[#98A2B3] uppercase tracking-wider mb-2">Permissions</p>
                <p className="text-sm text-[#F8FAFC]">{getPermissionDescription(selectedUser.role)}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#223047]">
                <button
                  onClick={closeDialog}
                  className="px-4 py-2.5 text-sm font-medium text-[#98A2B3] hover:text-[#F8FAFC] transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => { closeDialog(); handleEdit(selectedUser); }}
                  className="px-4 py-2.5 bg-[#00B8FF] hover:bg-[#29C5FF] text-white text-sm font-semibold rounded-lg transition-all"
                >
                  Edit User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit User Modal */}
      {(dialogMode === 'create' || dialogMode === 'edit') && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#121B2A] border border-[#223047] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#121B2A] border-b border-[#223047] px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#F8FAFC]">
                {dialogMode === 'create' ? 'Add New Team Member' : 'Edit Team Member'}
              </h3>
              <button
                onClick={closeDialog}
                className="p-2 hover:bg-[#0B1220] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#98A2B3]" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {formErrors.submit && (
                <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-[#FF4D6D]">
                  <AlertCircle className="w-4 h-4" />
                  {formErrors.submit}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Full Name *</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className={inputClasses}
                    placeholder="Enter full name"
                  />
                  {formErrors.full_name && <p className={errorClasses}>{formErrors.full_name}</p>}
                </div>

                <div>
                  <label className={labelClasses}>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={inputClasses}
                    placeholder="email@example.com"
                  />
                  {formErrors.email && <p className={errorClasses}>{formErrors.email}</p>}
                </div>

                <div>
                  <label className={labelClasses}>Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={inputClasses}
                    placeholder="username"
                  />
                </div>

                <div>
                  <label className={labelClasses}>Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={inputClasses}
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className={labelClasses}>Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className={inputClasses}
                    placeholder="Department name"
                  />
                </div>

                <div>
                  <label className={labelClasses}>Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className={inputClasses}
                  >
                    <option value="admin">Administrator</option>
                    <option value="investigator">Investigator</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                {dialogMode === 'create' && (
                  <div className="md:col-span-2">
                    <label className={labelClasses}>Temporary Password *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={inputClasses}
                        placeholder="Temporary password"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, password: generatePassword() })}
                        className="px-4 py-2.5 bg-[#0B1220] border border-[#223047] hover:border-slate-600 rounded-lg text-sm font-medium text-[#F8FAFC] transition-all whitespace-nowrap"
                      >
                        Generate
                      </button>
                    </div>
                    {formErrors.password && <p className={errorClasses}>{formErrors.password}</p>}
                    <p className="text-xs text-[#98A2B3] mt-1">
                      User will be required to change this password on first login
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#223047]">
                <button
                  onClick={closeDialog}
                  className="px-4 py-2.5 text-sm font-medium text-[#98A2B3] hover:text-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={dialogMode === 'create' ? handleSubmitCreate : handleSubmitEdit}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#00B8FF] hover:bg-[#29C5FF] text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {dialogMode === 'create' ? 'Create User' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Dialog */}
      {dialogMode === 'reset' && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#121B2A] border border-[#223047] rounded-lg w-full max-w-md">
            <div className="px-6 py-4 border-b border-[#223047]">
              <h3 className="text-lg font-semibold text-[#F8FAFC]">Reset Password</h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-[#98A2B3]">
                Generate a temporary password for <span className="font-semibold text-[#F8FAFC]">{selectedUser.full_name}</span>
              </p>

              <div>
                <label className={labelClasses}>New Temporary Password</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClasses}
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={() => setNewPassword(generatePassword())}
                    className="px-4 py-2.5 bg-[#0B1220] border border-[#223047] hover:border-slate-600 rounded-lg text-sm font-medium text-[#F8FAFC] transition-all whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
                <p className="text-xs text-[#98A2B3] mt-1">
                  User will be required to change this password on next login
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#223047]">
                <button
                  onClick={closeDialog}
                  className="px-4 py-2.5 text-sm font-medium text-[#98A2B3] hover:text-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitResetPassword}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#FFB020] hover:bg-amber-400 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activate Confirmation Dialog */}
      {dialogMode === 'activate' && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#121B2A] border border-[#223047] rounded-lg w-full max-w-md">
            <div className="px-6 py-4 border-b border-[#223047]">
              <h3 className="text-lg font-semibold text-[#F8FAFC]">Activate User</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Power className="w-5 h-5 text-[#00D084]" />
                </div>
                <div>
                  <p className="text-sm text-[#F8FAFC] font-medium mb-1">
                    Activate <span className="font-bold">{selectedUser.full_name}</span>?
                  </p>
                  <p className="text-sm text-[#98A2B3]">
                    This user will be able to log in and access the system according to their role permissions.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#223047]">
                <button
                  onClick={closeDialog}
                  className="px-4 py-2.5 text-sm font-medium text-[#98A2B3] hover:text-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitActivate}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#00D084] hover:bg-emerald-400 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Activate User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Dialog */}
      {dialogMode === 'deactivate' && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#121B2A] border border-[#223047] rounded-lg w-full max-w-md">
            <div className="px-6 py-4 border-b border-[#223047]">
              <h3 className="text-lg font-semibold text-[#F8FAFC]">Deactivate User</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                  <PowerOff className="w-5 h-5 text-[#FF4D6D]" />
                </div>
                <div>
                  <p className="text-sm text-[#F8FAFC] font-medium mb-1">
                    Deactivate <span className="font-bold">{selectedUser.full_name}</span>?
                  </p>
                  <p className="text-sm text-[#98A2B3]">
                    This user will no longer be able to log in. Their data will be preserved and the account can be reactivated later.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#223047]">
                <button
                  onClick={closeDialog}
                  className="px-4 py-2.5 text-sm font-medium text-[#98A2B3] hover:text-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitDeactivate}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#FF4D6D] hover:bg-red-400 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Deactivate User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
