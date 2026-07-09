'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, resetPassword, useAuth } from '@/lib/auth';
import { isFirebaseConfigured } from '@/lib/firebase';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/home');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) {
      setError('Firebase is not configured. Add your credentials to .env.local and restart.');
      return;
    }
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    if (!isLogin && (!firstName || !lastName)) {
      setError('First and last name are required for sign up');
      return;
    }

    setLoading(true);
    setError('');
    setResetMessage('');

    try {
      if (!isLogin) {
        if (!phone) {
          setError('Phone number is required for sign up');
          setLoading(false);
          return;
        }
        const user = await signUpWithEmail(email, password, `${firstName} ${lastName}`, phone);
        if (user) router.replace('/home');
      } else {
        const user = await signInWithEmail(email, password);
        if (user) router.replace('/home');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
    setLoading(false);
  };

  const handleForgetPassword = async () => {
    if (!email) {
      setError('Please enter your email address first to reset password.');
      return;
    }
    setError('');
    setResetMessage('');
    try {
      await resetPassword(email);
      setResetMessage('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-3 border-[#111111] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-white px-6 pt-16 pb-8 overflow-y-auto">
      {/* Firebase not configured warning */}
      {!isFirebaseConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex items-start gap-2.5 animate-fade-in">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-800">Firebase Not Configured</p>
            <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
              Add your Firebase credentials to .env.local to enable login.
            </p>
            <button
              onClick={() => router.replace('/home')}
              className="mt-2 text-[11px] font-bold text-gray-900 underline"
            >
              Continue in Demo Mode →
            </button>
          </div>
        </div>
      )}

      {/* Header text */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2 tracking-tight">
          {isLogin ? 'Welcome Back' : 'Get Started Now'}
        </h1>
        <p className="text-sm text-gray-500 font-medium">
          {isLogin
            ? 'Login to access your account'
            : 'Create an account or log in to explore about our app'}
        </p>
      </div>

      {/* Toggle Pill */}
      <div className="bg-[#F5F5F5] p-1.5 rounded-full flex items-center mb-8">
        <button
          onClick={() => { setIsLogin(false); setError(''); }}
          className={`flex-1 py-3 text-sm font-semibold rounded-full transition-all duration-300 ${!isLogin
            ? 'bg-[#111111] text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Sign Up
        </button>
        <button
          onClick={() => { setIsLogin(true); setError(''); }}
          className={`flex-1 py-3 text-sm font-semibold rounded-full transition-all duration-300 ${isLogin
            ? 'bg-[#111111] text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Log In
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="space-y-4">

          {/* Sign Up Fields */}
          {!isLogin && (
            <>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Raj"
                    className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all placeholder:text-gray-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Sarkar"
                    className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all placeholder:text-gray-400"
                />
              </div>
            </>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••"
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all placeholder:text-gray-400 tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-xs font-medium mt-3 px-1">{error}</p>}
        {resetMessage && (
          <p className="text-green-600 text-xs font-medium mt-3 px-1 flex items-center gap-1.5">
            <CheckCircle2 size={14} />
            {resetMessage}
          </p>
        )}

        {isLogin && (
          <div className="flex items-center justify-between mt-5 px-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black accent-black"
              />
              <span className="text-sm font-semibold text-[#1a1a1a]">Remember me</span>
            </label>
            <button
              type="button"
              onClick={handleForgetPassword}
              className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              Forget password?
            </button>
          </div>
        )}

        <div className="mt-auto pt-8">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-[#111111] hover:bg-black text-white font-bold text-base transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isLogin ? 'LOGGING IN...' : 'CREATING...'}
              </span>
            ) : (
              isLogin ? 'Log In' : 'Sign Up'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
