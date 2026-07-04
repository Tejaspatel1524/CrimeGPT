import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, User, Building, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { authApi } from '@/services/authApi';
import type { RegisterData } from '@/services/authApi';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterData>({
    full_name: '',
    email: '',
    password: '',
    role: 'investigator',
    department: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      await authApi.register(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#070B14] via-[#0B1220] to-[#121B2A] flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
      </div>

      {/* Register Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-[#121B2A] border border-[#223047] rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-[#223047] bg-gradient-to-br from-[#0B1220] to-[#121B2A]">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-xl bg-[#00B8FF]/10 border border-[#00B8FF]/20">
                <Shield className="w-8 h-8 text-[#00B8FF]" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center text-[#F8FAFC]">Create Account</h1>
            <p className="text-sm text-center text-[#98A2B3] mt-2">
              Join CrimeGPT Cybercrime Investigation Platform
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {/* Success Message */}
            {success && (
              <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg animate-fade-in">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-emerald-300 font-medium">Registration successful!</p>
                  <p className="text-xs text-emerald-400 mt-1">Redirecting to login...</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg animate-fade-in">
                <AlertTriangle className="w-5 h-5 text-[#FF4D6D] shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-[#F8FAFC] mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  disabled={loading || success}
                  placeholder="Inspector Rajesh Kumar"
                  className="w-full pl-10 pr-4 py-3 bg-[#070B14] border border-[#223047] rounded-lg text-[#F8FAFC] placeholder-[#98A2B3] focus:outline-none focus:border-[#00B8FF]/50 focus:ring-2 focus:ring-[#00B8FF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#F8FAFC] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading || success}
                  placeholder="rajesh@cybercrime.gov.in"
                  className="w-full pl-10 pr-4 py-3 bg-[#070B14] border border-[#223047] rounded-lg text-[#F8FAFC] placeholder-[#98A2B3] focus:outline-none focus:border-[#00B8FF]/50 focus:ring-2 focus:ring-[#00B8FF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-[#F8FAFC] mb-2">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={loading || success}
                className="w-full px-4 py-3 bg-[#070B14] border border-[#223047] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#00B8FF]/50 focus:ring-2 focus:ring-[#00B8FF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <option value="investigator">Investigator</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            {/* Department */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-[#F8FAFC] mb-2">
                Department (Optional)
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
                <input
                  id="department"
                  name="department"
                  type="text"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={loading || success}
                  placeholder="Cyber Crime Cell"
                  className="w-full pl-10 pr-4 py-3 bg-[#070B14] border border-[#223047] rounded-lg text-[#F8FAFC] placeholder-[#98A2B3] focus:outline-none focus:border-[#00B8FF]/50 focus:ring-2 focus:ring-[#00B8FF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#F8FAFC] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading || success}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-[#070B14] border border-[#223047] rounded-lg text-[#F8FAFC] placeholder-[#98A2B3] focus:outline-none focus:border-[#00B8FF]/50 focus:ring-2 focus:ring-[#00B8FF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>
              <p className="text-xs text-[#98A2B3] mt-1">At least 8 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#F8FAFC] mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  disabled={loading || success}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-[#070B14] border border-[#223047] rounded-lg text-[#F8FAFC] placeholder-[#98A2B3] focus:outline-none focus:border-[#00B8FF]/50 focus:ring-2 focus:ring-[#00B8FF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#00B8FF] hover:bg-[#29C5FF] disabled:bg-[#00B8FF]/50 text-slate-50 font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Success!
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  Create Account
                </>
              )}
            </button>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-[#223047]">
              <p className="text-sm text-[#98A2B3]">
                Already have an account?{' '}
                <Link to="/" className="text-[#00B8FF] hover:text-[#29C5FF] font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#98A2B3] mt-6">
          Secure Authentication • Enterprise-Grade Encryption
        </p>
      </div>
    </div>
  );
}
