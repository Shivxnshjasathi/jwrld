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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-obsidian text-primary">
        <div className="w-10 h-10 border-4 border-surface border-t-primary rounded-full animate-spin neon-glow-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-obsidian text-on-surface flex flex-col items-center justify-center relative overflow-hidden font-body-md antialiased p-6">
      {/* Ambient Glow Background */}
      <div className="ambient-glow"></div>

      {/* Main Content Container */}
      <main className="relative z-10 w-full max-w-md pt-8 pb-12">
        
        {/* Firebase not configured warning */}
        {!isFirebaseConfigured && (
          <div className="glass-panel border-error/30 bg-error/10 rounded-xl p-4 mb-6 flex items-start gap-3 animate-fade-in relative z-20">
            <span className="material-symbols-outlined text-error shrink-0">warning</span>
            <div>
              <p className="text-sm font-semibold text-error">Firebase Not Configured</p>
              <p className="text-[12px] text-error/80 mt-1 leading-relaxed">
                Add your Firebase credentials to .env.local to enable login.
              </p>
              <button
                onClick={() => router.replace('/home')}
                className="mt-2 text-[12px] font-bold text-white underline hover:text-primary transition-colors"
              >
                Continue in Demo Mode →
              </button>
            </div>
          </div>
        )}

        {/* Brand Header */}
        <div className="text-center mb-xl">
          <h1 className="font-display-md text-display-md text-on-surface tracking-tighter mb-sm">Jaaduwrld</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {isLogin ? 'Enter the Arcade' : 'Create your access pass'}
          </p>
        </div>

        {/* Toggle Pill */}
        <div className="glass-panel p-1 rounded-full flex items-center mb-lg relative z-10 max-w-[240px] mx-auto border-white/10 bg-white/5">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2 px-4 rounded-full font-label-md text-label-md transition-all duration-300 ${isLogin
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-on-surface-variant hover:text-white'
              }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2 px-4 rounded-full font-label-md text-label-md transition-all duration-300 ${!isLogin
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-on-surface-variant hover:text-white'
              }`}
          >
            Sign Up
          </button>
        </div>

        {/* Login/Signup Card (Glassmorphism) */}
        <div className="glass-panel rounded-2xl p-lg md:p-xl relative overflow-hidden border-white/10 shadow-xl shadow-black/50">
          {/* Subtle Inner Glow (Top Left) */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          
          <form onSubmit={handleSubmit} className="space-y-lg relative z-10">
            
            {/* Sign Up Fields */}
            {!isLogin && (
              <div className="space-y-sm animate-fade-in">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-sm">
                    <label className="font-label-md text-label-md text-on-surface-variant block">First Name</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">badge</span>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Neon"
                        className="input-dark w-full rounded-lg py-md pl-11 pr-md text-on-surface font-body-md placeholder-on-surface-variant/30 focus:ring-0"
                      />
                    </div>
                  </div>
                  <div className="flex-1 space-y-sm">
                    <label className="font-label-md text-label-md text-on-surface-variant block">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Rider"
                      className="input-dark w-full rounded-lg py-md px-md text-on-surface font-body-md placeholder-on-surface-variant/30 focus:ring-0"
                    />
                  </div>
                </div>

                <div className="space-y-sm pt-2">
                  <label className="font-label-md text-label-md text-on-surface-variant block">Phone Number</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">call</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className="input-dark w-full rounded-lg py-md pl-11 pr-md text-on-surface font-body-md placeholder-on-surface-variant/30 focus:ring-0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-sm">
              <label className="font-label-md text-label-md text-on-surface-variant block" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>mail</span>
                <input 
                  className="input-dark w-full rounded-lg py-md pl-11 pr-md text-on-surface font-body-md placeholder-on-surface-variant/30 focus:ring-0" 
                  id="email" 
                  name="email" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pilot@jaaduwrld.com" 
                />
              </div>
            </div>
            
            {/* Password Field */}
            <div className="space-y-sm">
              <div className="flex justify-between items-center">
                <label className="font-label-md text-label-md text-on-surface-variant block" htmlFor="password">Password</label>
                {isLogin && (
                  <button 
                    type="button"
                    onClick={handleForgetPassword}
                    className="font-label-sm text-label-sm text-primary hover:text-primary-fixed transition-colors"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>lock</span>
                <input 
                  className="input-dark w-full rounded-lg py-md pl-11 pr-11 text-on-surface font-body-md placeholder-on-surface-variant/30 focus:ring-0 tracking-widest" 
                  id="password" 
                  name="password" 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
            </div>

            {/* Error and Success Messages */}
            {error && <p className="text-error text-xs font-medium mt-3 px-1 animate-fade-in">{error}</p>}
            {resetMessage && (
              <p className="text-secondary text-xs font-medium mt-3 px-1 flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 size={14} />
                {resetMessage}
              </p>
            )}

            {isLogin && (
              <div className="flex items-center justify-between pt-2 px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer appearance-none w-4 h-4 rounded border border-white/20 bg-white/5 checked:bg-secondary checked:border-secondary transition-all cursor-pointer"
                    />
                    <span className="material-symbols-outlined absolute text-[12px] text-background opacity-0 peer-checked:opacity-100 pointer-events-none" style={{ fontVariationSettings: "'wght' 700" }}>check</span>
                  </div>
                  <span className="text-sm font-medium text-on-surface-variant group-hover:text-white transition-colors">Remember me</span>
                </label>
              </div>
            )}

            {/* Primary Action */}
            <button 
              type="submit"
              disabled={loading}
              className="btn-gradient w-full rounded-lg py-md px-lg font-label-md text-label-md text-background font-bold flex items-center justify-center gap-sm disabled:opacity-50 mt-8"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  <span>{isLogin ? 'Authenticating...' : 'Initializing...'}</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? 'Initiate Sequence' : 'Create Access Pass'}</span>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
                </>
              )}
            </button>
            
            {/* Divider */}
            {isLogin && (
              <>
                <div className="flex items-center gap-md py-sm opacity-60">
                  <div className="h-px bg-white/10 flex-1"></div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Or</span>
                  <div className="h-px bg-white/10 flex-1"></div>
                </div>
                
                {/* Google SSO Button (Glass Secondary) */}
                <button 
                  type="button"
                  className="w-full glass-panel rounded-lg py-md px-lg font-label-md text-label-md text-white flex items-center justify-center gap-3 hover:bg-white/10 transition-colors border-white/10"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
