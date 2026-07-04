import { useState, useEffect } from 'react';
import { 
  User, Bell, Shield, Info, Save, Camera, Key, Check, X, 
  AlertCircle, Loader2, Upload, Trash2, Eye, EyeOff, Settings as SettingsIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/authApi';
import api from '@/services/api';
import { formatDate } from '@/lib/formatters';

const settingsSections = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'about', label: 'About', icon: Info },
];

const inputClasses =
  'w-full px-3.5 py-2.5 bg-[#070B14] border border-[#223047] rounded-lg text-sm text-[#F8FAFC] placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-[#00B4D8]/20 transition-all';
const labelClasses = 'block text-sm font-medium text-[#F8FAFC] mb-1.5';
const readOnlyClasses =
  'w-full px-3.5 py-2.5 bg-[#070B14] border border-[#223047] rounded-lg text-sm text-[#98A2B3] cursor-not-allowed focus:outline-none';
const errorClasses = 'text-xs text-[#FF4D6D] mt-1';
const successClasses = 'text-xs text-[#00D084] mt-1';

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      type="button"
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 ${
        enabled ? 'bg-[#00B8FF]' : 'bg-[#223047]'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeSection, setActiveSection] = useState('account');

  // Account section state
  const [accountData, setAccountData] = useState({
    full_name: '',
    email: '',
    username: '',
    phone: '',
    department: '',
    profile_photo: ''
  });
  const [accountErrors, setAccountErrors] = useState<Record<string, string>>({});
  const [accountSuccess, setAccountSuccess] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Security section state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Preferences section state
  const [preferences, setPreferences] = useState({
    theme: 'cyber-navy',
    language: 'english',
    timezone: 'auto',
    dateFormat: 'dd/mm/yyyy',
    timeFormat: '24h'
  });
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesSuccess, setPreferencesSuccess] = useState('');

  // Notifications section state
  const [notifications, setNotifications] = useState({
    caseAssignment: true,
    crimeGPT: true,
    evidenceProcessing: true,
    reportGeneration: true,
    crossCaseMatch: true
  });
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsSuccess, setNotificationsSuccess] = useState('');

  // Load user data and preferences
  useEffect(() => {
    if (user) {
      setAccountData({
        full_name: user.full_name,
        email: user.email,
        username: user.username || '',
        phone: user.phone || '',
        department: user.department || '',
        profile_photo: user.profile_photo || ''
      });
      setPhotoPreview(user.profile_photo || null);
      
      // Load preferences from backend
      const loadPreferences = async () => {
        try {
          const response = await api.get('/auth/preferences');
          if (response.data) {
            setPreferences({
              theme: response.data.theme || 'cyber-navy',
              language: response.data.language || 'english',
              timezone: response.data.timezone || 'auto',
              dateFormat: response.data.dateFormat || 'dd/mm/yyyy',
              timeFormat: response.data.timeFormat || '24h'
            });
            
            if (response.data.notifications) {
              setNotifications({
                caseAssignment: response.data.notifications.caseAssignment ?? true,
                crimeGPT: response.data.notifications.crimeGPT ?? true,
                evidenceProcessing: response.data.notifications.evidenceProcessing ?? true,
                reportGeneration: response.data.notifications.reportGeneration ?? true,
                crossCaseMatch: response.data.notifications.crossCaseMatch ?? true
              });
            }
          }
        } catch (error) {
          console.error('Failed to load preferences:', error);
        }
      };
      
      loadPreferences();
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

  // Validate email
  const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Invalid email format';
    return null;
  };

  // Validate phone
  const validatePhone = (phone: string): string | null => {
    if (!phone) return null; // Phone is optional
    if (!/^[\d\s\-\+\(\)]+$/.test(phone)) return 'Invalid phone format (numbers only)';
    return null;
  };

  // Validate password strength
  const validatePasswordStrength = (password: string) => {
    const checks = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    const strength = Object.values(checks).filter(Boolean).length;
    return { checks, strength };
  };

  // Handle account save
  const handleAccountSave = async () => {
    setAccountErrors({});
    setAccountSuccess('');

    // Validate
    const errors: Record<string, string> = {};
    if (!accountData.full_name) errors.full_name = 'Full name is required';
    const emailError = validateEmail(accountData.email);
    if (emailError) errors.email = emailError;
    const phoneError = validatePhone(accountData.phone);
    if (phoneError) errors.phone = phoneError;

    if (Object.keys(errors).length > 0) {
      setAccountErrors(errors);
      return;
    }

    try {
      setAccountLoading(true);
      await authApi.updateProfile({
        full_name: accountData.full_name,
        username: accountData.username || undefined,
        department: accountData.department || undefined,
        phone: accountData.phone || undefined,
        profile_photo: photoPreview || undefined
      });
      await refreshUser();
      setAccountSuccess('Profile updated successfully');
      setTimeout(() => setAccountSuccess(''), 3000);
    } catch (error: any) {
      setAccountErrors({ 
        submit: error.response?.data?.detail || 'Failed to update profile' 
      });
    } finally {
      setAccountLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    setPasswordErrors({});
    setPasswordSuccess('');

    // Validate
    const errors: Record<string, string> = {};
    if (!passwordData.current_password) errors.current_password = 'Current password is required';
    if (!passwordData.new_password) errors.new_password = 'New password is required';
    if (passwordData.new_password !== passwordData.confirm_password) {
      errors.confirm_password = 'Passwords do not match';
    }

    const { checks, strength } = validatePasswordStrength(passwordData.new_password);
    if (strength < 4) {
      errors.new_password = 'Password must meet at least 4 requirements';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    try {
      setPasswordLoading(true);
      await authApi.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      setPasswordSuccess('Password changed successfully');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (error: any) {
      setPasswordErrors({ 
        submit: error.response?.data?.detail || 'Failed to change password' 
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle photo upload (simulated - in production would upload to S3/CDN)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setAccountErrors({ profile_photo: 'Image size must be less than 5MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setAccountData({ ...accountData, profile_photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle photo remove
  const handlePhotoRemove = () => {
    setPhotoPreview(null);
    setAccountData({ ...accountData, profile_photo: '' });
  };

  // Handle preferences save
  const handlePreferencesSave = async () => {
    try {
      setPreferencesLoading(true);
      setPreferencesSuccess('');
      await api.put('/auth/preferences', {
        theme: preferences.theme,
        language: preferences.language,
        timezone: preferences.timezone,
        dateFormat: preferences.dateFormat,
        timeFormat: preferences.timeFormat
      });
      setPreferencesSuccess('Preferences saved successfully');
      setTimeout(() => setPreferencesSuccess(''), 3000);
    } catch (error: any) {
      console.error('Failed to save preferences:', error);
      setPreferencesSuccess('');
    } finally {
      setPreferencesLoading(false);
    }
  };

  // Handle notifications save
  const handleNotificationsSave = async () => {
    try {
      setNotificationsLoading(true);
      setNotificationsSuccess('');
      await api.put('/auth/preferences', {
        notifications: notifications
      });
      setNotificationsSuccess('Notification preferences saved successfully');
      setTimeout(() => setNotificationsSuccess(''), 3000);
    } catch (error: any) {
      console.error('Failed to save notifications:', error);
      setNotificationsSuccess('');
    } finally {
      setNotificationsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#00B8FF] animate-spin" />
      </div>
    );
  }

  const passwordStrength = validatePasswordStrength(passwordData.new_password);

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
      {/* Left Navigation */}
      <div className="lg:col-span-1">
        <div className="bg-[#121B2A] border border-[#223047] rounded-lg p-2 sticky top-4">
          <nav className="space-y-1">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                  activeSection === section.id
                    ? 'bg-[#00B8FF]/10 text-[#00B8FF] border border-cyan-500/20'
                    : 'text-[#98A2B3] hover:text-[#F8FAFC] hover:bg-[#0B1220]/50'
                }`}
              >
                <section.icon className="w-4 h-4" />
                {section.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Right Content */}
      <div className="lg:col-span-3 space-y-6">
        {/* ===== ACCOUNT ===== */}
        {activeSection === 'account' && (
          <div className="bg-[#121B2A] border border-[#223047] rounded-lg overflow-hidden">
            <div className="p-6 border-b border-[#223047]">
              <h3 className="text-[#F8FAFC] text-lg font-semibold">Account Settings</h3>
              <p className="text-sm text-[#98A2B3] mt-1">Manage your profile and account information</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Error/Success Messages */}
              {accountErrors.submit && (
                <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-[#FF4D6D]">
                  <AlertCircle className="w-4 h-4" />
                  {accountErrors.submit}
                </div>
              )}
              {accountSuccess && (
                <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-[#00D084]">
                  <Check className="w-4 h-4" />
                  {accountSuccess}
                </div>
              )}

              {/* Profile Photo */}
              <div>
                <label className={labelClasses}>Profile Photo</label>
                <div className="flex items-center gap-4 mt-2">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile"
                      className="w-20 h-20 rounded-xl object-cover border-2 border-[#223047]"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-[#00B8FF]/10 border-2 border-[#223047] flex items-center justify-center">
                      <span className="text-2xl font-bold text-[#00B8FF]">
                        {getInitials(accountData.full_name)}
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2 px-4 py-2 bg-[#00B8FF]/10 hover:bg-[#00B8FF]/20 text-[#00B8FF] text-sm font-medium rounded-lg border border-cyan-500/20 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {photoPreview && (
                      <button
                        onClick={handlePhotoRemove}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-[#FF4D6D] text-sm font-medium rounded-lg border border-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                {accountErrors.profile_photo && (
                  <p className={errorClasses}>{accountErrors.profile_photo}</p>
                )}
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Full Name *</label>
                  <input
                    type="text"
                    value={accountData.full_name}
                    onChange={(e) => setAccountData({ ...accountData, full_name: e.target.value })}
                    className={inputClasses}
                    placeholder="Enter full name"
                  />
                  {accountErrors.full_name && (
                    <p className={errorClasses}>{accountErrors.full_name}</p>
                  )}
                </div>

                <div>
                  <label className={labelClasses}>Email Address *</label>
                  <input
                    type="email"
                    value={accountData.email}
                    onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                    className={inputClasses}
                    placeholder="email@example.com"
                  />
                  {accountErrors.email && (
                    <p className={errorClasses}>{accountErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className={labelClasses}>Username</label>
                  <input
                    type="text"
                    value={accountData.username}
                    onChange={(e) => setAccountData({ ...accountData, username: e.target.value })}
                    className={inputClasses}
                    placeholder="username"
                  />
                </div>

                <div>
                  <label className={labelClasses}>Phone Number</label>
                  <input
                    type="text"
                    value={accountData.phone}
                    onChange={(e) => setAccountData({ ...accountData, phone: e.target.value })}
                    className={inputClasses}
                    placeholder="+91-9876543210"
                  />
                  {accountErrors.phone && (
                    <p className={errorClasses}>{accountErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className={labelClasses}>Department</label>
                  <input
                    type="text"
                    value={accountData.department}
                    onChange={(e) => setAccountData({ ...accountData, department: e.target.value })}
                    className={inputClasses}
                    placeholder="Department name"
                  />
                </div>

                <div>
                  <label className={labelClasses}>Role</label>
                  <input
                    type="text"
                    value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    readOnly
                    className={readOnlyClasses}
                  />
                </div>

                <div>
                  <label className={labelClasses}>Member Since</label>
                  <input
                    type="text"
                    value={formatDate(user.created_at)}
                    readOnly
                    className={readOnlyClasses}
                  />
                </div>

                <div>
                  <label className={labelClasses}>Last Login</label>
                  <input
                    type="text"
                    value={user.last_login ? formatDate(user.last_login) : 'N/A'}
                    readOnly
                    className={readOnlyClasses}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#223047]">
                <button
                  onClick={() => {
                    setAccountData({
                      full_name: user.full_name,
                      email: user.email,
                      username: user.username || '',
                      phone: user.phone || '',
                      department: user.department || '',
                      profile_photo: user.profile_photo || ''
                    });
                    setPhotoPreview(user.profile_photo || null);
                    setAccountErrors({});
                    setAccountSuccess('');
                  }}
                  className="px-5 py-2.5 text-[#98A2B3] hover:text-[#F8FAFC] text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAccountSave}
                  disabled={accountLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#00B8FF] hover:bg-[#29C5FF] text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {accountLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {accountLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== SECURITY ===== */}
        {activeSection === 'security' && (
          <div className="bg-[#121B2A] border border-[#223047] rounded-lg overflow-hidden">
            <div className="p-6 border-b border-[#223047]">
              <h3 className="text-[#F8FAFC] text-lg font-semibold">Security Settings</h3>
              <p className="text-sm text-[#98A2B3] mt-1">Manage your password and security preferences</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Error/Success Messages */}
              {passwordErrors.submit && (
                <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-[#FF4D6D]">
                  <AlertCircle className="w-4 h-4" />
                  {passwordErrors.submit}
                </div>
              )}
              {passwordSuccess && (
                <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-[#00D084]">
                  <Check className="w-4 h-4" />
                  {passwordSuccess}
                </div>
              )}

              {/* Change Password */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#F8FAFC]">
                  <Key className="w-5 h-5 text-[#00B8FF]" />
                  <h4 className="text-base font-semibold">Change Password</h4>
                </div>

                <div>
                  <label className={labelClasses}>Current Password *</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      className={inputClasses}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#F8FAFC]"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.current_password && (
                    <p className={errorClasses}>{passwordErrors.current_password}</p>
                  )}
                </div>

                <div>
                  <label className={labelClasses}>New Password *</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      className={inputClasses}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#F8FAFC]"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.new_password && (
                    <p className={errorClasses}>{passwordErrors.new_password}</p>
                  )}
                </div>

                <div>
                  <label className={labelClasses}>Confirm New Password *</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      className={inputClasses}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#F8FAFC]"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.confirm_password && (
                    <p className={errorClasses}>{passwordErrors.confirm_password}</p>
                  )}
                </div>

                {/* Password Strength Indicator */}
                {passwordData.new_password && (
                  <div className="p-4 bg-[#070B14] border border-[#223047] rounded-lg space-y-2">
                    <p className="text-xs font-semibold text-[#F8FAFC] uppercase">Password Strength</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-2 flex-1 rounded-full transition-all ${
                            level <= passwordStrength.strength
                              ? passwordStrength.strength >= 4
                                ? 'bg-[#00D084]'
                                : passwordStrength.strength >= 3
                                ? 'bg-[#FFB020]'
                                : 'bg-[#FF4D6D]'
                              : 'bg-[#223047]'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {[
                        { key: 'minLength', label: 'At least 8 characters' },
                        { key: 'hasUppercase', label: 'Uppercase letter' },
                        { key: 'hasLowercase', label: 'Lowercase letter' },
                        { key: 'hasNumber', label: 'Number' },
                        { key: 'hasSpecial', label: 'Special character' }
                      ].map((req) => (
                        <div key={req.key} className="flex items-center gap-2 text-xs">
                          {passwordStrength.checks[req.key as keyof typeof passwordStrength.checks] ? (
                            <Check className="w-3 h-3 text-[#00D084]" />
                          ) : (
                            <X className="w-3 h-3 text-[#98A2B3]" />
                          )}
                          <span className={passwordStrength.checks[req.key as keyof typeof passwordStrength.checks] ? 'text-[#00D084]' : 'text-[#98A2B3]'}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#223047]">
                <button
                  onClick={() => {
                    setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                    setPasswordErrors({});
                    setPasswordSuccess('');
                  }}
                  className="px-5 py-2.5 text-[#98A2B3] hover:text-[#F8FAFC] text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={passwordLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#00B8FF] hover:bg-[#29C5FF] text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {passwordLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Key className="w-4 h-4" />
                  )}
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== PREFERENCES ===== */}
        {activeSection === 'preferences' && (
          <div className="bg-[#121B2A] border border-[#223047] rounded-lg overflow-hidden">
            <div className="p-6 border-b border-[#223047]">
              <h3 className="text-[#F8FAFC] text-lg font-semibold">Preferences</h3>
              <p className="text-sm text-[#98A2B3] mt-1">Customize your application experience</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>Theme</label>
                  <select
                    value={preferences.theme}
                    onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                    className={inputClasses}
                  >
                    <option value="cyber-navy">Cyber Navy (Default)</option>
                    <option value="dark" disabled>Dark (Coming Soon)</option>
                    <option value="light" disabled>Light (Coming Soon)</option>
                  </select>
                  <p className="text-xs text-[#98A2B3] mt-1">Choose your preferred color theme</p>
                </div>

                <div>
                  <label className={labelClasses}>Language</label>
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                    className={inputClasses}
                  >
                    <option value="english">English</option>
                    <option value="hindi" disabled>Hindi (Coming Soon)</option>
                    <option value="tamil" disabled>Tamil (Coming Soon)</option>
                  </select>
                  <p className="text-xs text-[#98A2B3] mt-1">Application language</p>
                </div>

                <div>
                  <label className={labelClasses}>Timezone</label>
                  <select
                    value={preferences.timezone}
                    onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                    className={inputClasses}
                  >
                    <option value="auto">Auto Detect</option>
                    <option value="asia/kolkata">Asia/Kolkata (IST)</option>
                    <option value="utc">UTC</option>
                  </select>
                  <p className="text-xs text-[#98A2B3] mt-1">Timezone for dates and times</p>
                </div>

                <div>
                  <label className={labelClasses}>Date Format</label>
                  <select
                    value={preferences.dateFormat}
                    onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                    className={inputClasses}
                  >
                    <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                    <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                    <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                  </select>
                  <p className="text-xs text-[#98A2B3] mt-1">Date display format</p>
                </div>

                <div>
                  <label className={labelClasses}>Time Format</label>
                  <select
                    value={preferences.timeFormat}
                    onChange={(e) => setPreferences({ ...preferences, timeFormat: e.target.value })}
                    className={inputClasses}
                  >
                    <option value="24h">24-hour</option>
                    <option value="12h">12-hour (AM/PM)</option>
                  </select>
                  <p className="text-xs text-[#98A2B3] mt-1">Time display format</p>
                </div>
              </div>

              {/* Success Message */}
              {preferencesSuccess && (
                <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-[#00D084]">
                  <Check className="w-4 h-4" />
                  {preferencesSuccess}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-[#223047]">
                <button
                  onClick={() => {
                    setPreferences({
                      theme: 'cyber-navy',
                      language: 'english',
                      timezone: 'auto',
                      dateFormat: 'dd/mm/yyyy',
                      timeFormat: '24h'
                    });
                    setPreferencesSuccess('');
                  }}
                  className="px-5 py-2.5 text-[#98A2B3] hover:text-[#F8FAFC] text-sm font-medium transition-colors"
                >
                  Reset to Defaults
                </button>
                <button
                  onClick={handlePreferencesSave}
                  disabled={preferencesLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#00B8FF] hover:bg-[#29C5FF] text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {preferencesLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {preferencesLoading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== NOTIFICATIONS ===== */}
        {activeSection === 'notifications' && (
          <div className="bg-[#121B2A] border border-[#223047] rounded-lg overflow-hidden">
            <div className="p-6 border-b border-[#223047]">
              <h3 className="text-[#F8FAFC] text-lg font-semibold">Notification Preferences</h3>
              <p className="text-sm text-[#98A2B3] mt-1">Manage how you receive notifications</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#070B14] border border-[#223047] rounded-lg">
                <div>
                  <h4 className="text-sm font-semibold text-[#F8FAFC]">Case Assignment Alerts</h4>
                  <p className="text-xs text-[#98A2B3] mt-1">Receive notifications when cases are assigned to you</p>
                </div>
                <Toggle
                  enabled={notifications.caseAssignment}
                  onToggle={() => setNotifications({ ...notifications, caseAssignment: !notifications.caseAssignment })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-[#070B14] border border-[#223047] rounded-lg">
                <div>
                  <h4 className="text-sm font-semibold text-[#F8FAFC]">CrimeGPT Notifications</h4>
                  <p className="text-xs text-[#98A2B3] mt-1">Get notified about AI analysis results and insights</p>
                </div>
                <Toggle
                  enabled={notifications.crimeGPT}
                  onToggle={() => setNotifications({ ...notifications, crimeGPT: !notifications.crimeGPT })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-[#070B14] border border-[#223047] rounded-lg">
                <div>
                  <h4 className="text-sm font-semibold text-[#F8FAFC]">Evidence Processing Alerts</h4>
                  <p className="text-xs text-[#98A2B3] mt-1">Notifications when evidence is uploaded or processed</p>
                </div>
                <Toggle
                  enabled={notifications.evidenceProcessing}
                  onToggle={() => setNotifications({ ...notifications, evidenceProcessing: !notifications.evidenceProcessing })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-[#070B14] border border-[#223047] rounded-lg">
                <div>
                  <h4 className="text-sm font-semibold text-[#F8FAFC]">Report Generation Alerts</h4>
                  <p className="text-xs text-[#98A2B3] mt-1">Get notified when reports are generated or ready</p>
                </div>
                <Toggle
                  enabled={notifications.reportGeneration}
                  onToggle={() => setNotifications({ ...notifications, reportGeneration: !notifications.reportGeneration })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-[#070B14] border border-[#223047] rounded-lg">
                <div>
                  <h4 className="text-sm font-semibold text-[#F8FAFC]">Cross-Case Match Alerts</h4>
                  <p className="text-xs text-[#98A2B3] mt-1">Receive alerts when patterns match across multiple cases</p>
                </div>
                <Toggle
                  enabled={notifications.crossCaseMatch}
                  onToggle={() => setNotifications({ ...notifications, crossCaseMatch: !notifications.crossCaseMatch })}
                />
              </div>

              {/* Success Message */}
              {notificationsSuccess && (
                <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-[#00D084]">
                  <Check className="w-4 h-4" />
                  {notificationsSuccess}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-[#223047]">
                <button
                  onClick={() => {
                    setNotifications({
                      caseAssignment: true,
                      crimeGPT: true,
                      evidenceProcessing: true,
                      reportGeneration: true,
                      crossCaseMatch: true
                    });
                    setNotificationsSuccess('');
                  }}
                  className="px-5 py-2.5 text-[#98A2B3] hover:text-[#F8FAFC] text-sm font-medium transition-colors"
                >
                  Reset to Defaults
                </button>
                <button
                  onClick={handleNotificationsSave}
                  disabled={notificationsLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#00B8FF] hover:bg-[#29C5FF] text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {notificationsLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {notificationsLoading ? 'Saving...' : 'Save Notification Preferences'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== ABOUT ===== */}
        {activeSection === 'about' && (
          <div className="bg-[#121B2A] border border-[#223047] rounded-lg overflow-hidden">
            <div className="p-6 border-b border-[#223047]">
              <h3 className="text-[#F8FAFC] text-lg font-semibold">About CrimeGPT</h3>
              <p className="text-sm text-[#98A2B3] mt-1">System information and version details</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Application Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#070B14] border border-[#223047] rounded-lg">
                  <div>
                    <p className="text-xs text-[#98A2B3] uppercase tracking-wider mb-1">Application Name</p>
                    <p className="text-sm font-semibold text-[#F8FAFC]">CrimeGPT - Cyber Crime Investigation Platform</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#070B14] border border-[#223047] rounded-lg">
                    <p className="text-xs text-[#98A2B3] uppercase tracking-wider mb-1">Application Version</p>
                    <p className="text-sm font-semibold text-[#F8FAFC] font-mono">v1.0.0</p>
                  </div>

                  <div className="p-4 bg-[#070B14] border border-[#223047] rounded-lg">
                    <p className="text-xs text-[#98A2B3] uppercase tracking-wider mb-1">Build Number</p>
                    <p className="text-sm font-semibold text-[#F8FAFC] font-mono">#2024.07.001</p>
                  </div>

                  <div className="p-4 bg-[#070B14] border border-[#223047] rounded-lg">
                    <p className="text-xs text-[#98A2B3] uppercase tracking-wider mb-1">Backend Version</p>
                    <p className="text-sm font-semibold text-[#F8FAFC] font-mono">v1.0.0 (FastAPI)</p>
                  </div>

                  <div className="p-4 bg-[#070B14] border border-[#223047] rounded-lg">
                    <p className="text-xs text-[#98A2B3] uppercase tracking-wider mb-1">Frontend Version</p>
                    <p className="text-sm font-semibold text-[#F8FAFC] font-mono">v1.0.0 (React + TypeScript)</p>
                  </div>
                </div>
              </div>

              {/* System Status */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-[#F8FAFC]">System Status</h4>
                
                <div className="flex items-center justify-between p-4 bg-[#070B14] border border-[#223047] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#00D084]" />
                    <div>
                      <p className="text-sm font-medium text-[#F8FAFC]">Database</p>
                      <p className="text-xs text-[#98A2B3]">PostgreSQL connected</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-[#00D084] border border-emerald-500/20">
                    Operational
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#070B14] border border-[#223047] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#00D084]" />
                    <div>
                      <p className="text-sm font-medium text-[#F8FAFC]">API Server</p>
                      <p className="text-xs text-[#98A2B3]">All endpoints responding</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-[#00D084] border border-emerald-500/20">
                    Operational
                  </span>
                </div>
              </div>

              {/* User Info */}
              <div className="p-4 bg-[#070B14] border border-[#223047] rounded-lg">
                <p className="text-xs text-[#98A2B3] uppercase tracking-wider mb-2">Current User ID</p>
                <p className="text-sm font-mono text-[#F8FAFC]">{user.id}</p>
              </div>

              {/* Additional Info */}
              <div className="p-4 bg-gradient-to-r from-[#00B8FF]/10 to-transparent border border-cyan-500/20 rounded-lg">
                <p className="text-xs text-[#98A2B3] mb-2">Need help?</p>
                <p className="text-sm text-[#F8FAFC]">
                  Contact support at{' '}
                  <a href="mailto:support@crimegpt.gov.in" className="text-[#00B8FF] hover:underline">
                    support@crimegpt.gov.in
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
