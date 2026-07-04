import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { authApi, initializeAuth } from '@/services/authApi';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setError('');
    setLoading(true);

    try {
      await authApi.login({
        email,
        password,
        remember_me: rememberMe,
      });
      
      initializeAuth();
      navigate('/dashboard');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Invalid email or password.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#070B14] via-[#0B1220] to-[#121B2A] flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-[#00B8FF]/10 border border-[#00B8FF]/20 mb-4">
            <Shield className="w-8 h-8 text-[#00B8FF]" />
          </div>
          <h1 className="text-3xl font-bold text-[#F8FAFC] tracking-tight">CrimeGPT</h1>
          <p className="text-sm text-[#98A2B3] mt-2 font-medium">Cybercrime Investigation Platform</p>
        </div>

        {/* Login Card */}
        {!showForgotPassword ? (
          <div className="bg-[#121B2A] border border-[#223047] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-8 pt-8 pb-6 border-b border-[#223047] bg-gradient-to-br from-[#0B1220] to-[#121B2A]">
              <h2 className="text-lg font-semibold text-[#F8FAFC]">Secure Authentication</h2>
              <p className="text-sm text-[#98A2B3] mt-1">Access restricted to authorized personnel</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg animate-fade-in">
                  <AlertTriangle className="w-5 h-5 text-[#FF4D6D] shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#F8FAFC] mb-2">
                  Officer Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    disabled={loading}
                    placeholder="officer@cybercrime.gov.in"
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
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    disabled={loading}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-12 py-3 bg-[#070B14] border border-[#223047] rounded-lg text-[#F8FAFC] placeholder-[#98A2B3] focus:outline-none focus:border-[#00B8FF]/50 focus:ring-2 focus:ring-[#00B8FF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#F8FAFC] transition-colors disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 rounded bg-[#070B14] border-[#223047] text-[#00B8FF] focus:ring-2 focus:ring-[#00B8FF]/20 disabled:opacity-50"
                  />
                  <span className="text-sm text-[#98A2B3]">Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-sm text-[#00B8FF] hover:text-[#29C5FF] transition-colors disabled:opacity-50"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#00B8FF] hover:bg-[#29C5FF] disabled:bg-[#00B8FF]/50 text-slate-50 font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>

              {/* Register Link */}
              <div className="text-center pt-4 border-t border-[#223047]">
                <p className="text-sm text-[#98A2B3]">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-[#00B8FF] hover:text-[#29C5FF] font-medium transition-colors">
                    Register here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        ) : (
          <ForgotPasswordCard onBack={() => setShowForgotPassword(false)} />
        )}

        {/* Footer */}
        <p className="text-center text-xs text-[#98A2B3] mt-6 uppercase tracking-wide font-medium">
          Ministry of Home Affairs • Government of India
        </p>
      </div>
    </div>
  );
}

function ForgotPasswordCard({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authApi.forgotPassword({ email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121B2A] border border-[#223047] rounded-2xl shadow-2xl overflow-hidden">
      <div className="px-8 pt-8 pb-6 border-b border-[#223047] bg-gradient-to-br from-[#0B1220] to-[#121B2A]">
        <h2 className="text-lg font-semibold text-[#F8FAFC]">Forgot Password</h2>
        <p className="text-sm text-[#98A2B3] mt-1">Enter your email to reset your password</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-5">
        {success && (
          <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-emerald-300 font-medium">Check your email</p>
              <p className="text-xs text-emerald-400 mt-1">
                If an account exists, a password reset link will be sent.
              </p>
              <p className="text-xs text-[#98A2B3] mt-2">
                Note: Email service not configured. Contact administrator for password reset.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-[#FF4D6D] shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {!success && (
          <>
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-[#F8FAFC] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  disabled={loading}
                  placeholder="officer@cybercrime.gov.in"
                  className="w-full pl-10 pr-4 py-3 bg-[#070B14] border border-[#223047] rounded-lg text-[#F8FAFC] placeholder-[#98A2B3] focus:outline-none focus:border-[#00B8FF]/50 focus:ring-2 focus:ring-[#00B8FF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#00B8FF] hover:bg-[#29C5FF] disabled:bg-[#00B8FF]/50 text-slate-50 font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send Reset Link
                </>
              )}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onBack}
          className="w-full py-3 text-sm text-[#98A2B3] hover:text-[#F8FAFC] transition-colors"
        >
          ← Back to Sign In
        </button>
      </form>
    </div>
  );
}
