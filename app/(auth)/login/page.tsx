'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, signInAsGuest, resetPassword, useAuth, signInWithGoogle } from '@/lib/auth';
import { isFirebaseConfigured } from '@/lib/firebase';

import { useSearchParams } from 'next/navigation';

import { Suspense } from 'react';

function LoginContent() {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const returnUrl = searchParams.get('returnUrl') || sessionStorage.getItem('returnUrl') || '/home';
      sessionStorage.removeItem('returnUrl');
      router.replace(returnUrl);
    }
  }, [isAuthenticated, authLoading, router, searchParams]);

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
    if (authMode === 'signup' && (!firstName || !lastName)) {
      setError('First and last name are required for sign up');
      return;
    }

    setLoading(true);
    setError('');
    setResetMessage('');

    try {
      const returnUrl = searchParams.get('returnUrl') || sessionStorage.getItem('returnUrl') || '/home';
      if (authMode === 'signup') {
        if (!phone) {
          setError('Phone number is required for sign up');
          setLoading(false);
          return;
        }
        const user = await signUpWithEmail(email, password, `${firstName} ${lastName}`, phone, referralCode);
        if (user) {
          sessionStorage.removeItem('returnUrl');
          router.replace(returnUrl);
        }
      } else {
        const user = await signInWithEmail(email, password);
        if (user) {
          sessionStorage.removeItem('returnUrl');
          router.replace(returnUrl);
        }
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password')) {
        setError('Invalid email or password. Please try again.');
      } else if (msg.includes('auth/email-already-in-use')) {
        setError('An account with this email already exists.');
      } else if (msg.includes('auth/weak-password')) {
        setError('Password is too weak (minimum 6 characters).');
      } else if (msg.includes('auth/invalid-email')) {
        setError('Please enter a valid email address.');
      } else if (msg.includes('auth/too-many-requests')) {
        setError('Too many failed attempts. Please try again later.');
      } else if (msg.includes('auth/network-request-failed')) {
        setError('Network error. Please check your connection.');
      } else if (msg.includes('auth/admin-restricted-operation') || msg.includes('auth/operation-not-allowed')) {
        setError('Anonymous sign-in is disabled. Please enable it in Firebase Console > Authentication > Sign-in method.');
      } else {
        setError('Authentication failed. Please try again.');
      }
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
      setResetMessage('Password reset email sent! Check your inbox or spam folder.');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('auth/user-not-found')) {
        setError('No account found with this email.');
      } else if (msg.includes('auth/invalid-email')) {
        setError('Please enter a valid email address.');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const returnUrl = searchParams.get('returnUrl') || sessionStorage.getItem('returnUrl') || '/home';
      const user = await signInAsGuest();
      if (user) {
        sessionStorage.removeItem('returnUrl');
        router.replace(returnUrl);
      }
    } catch (err: any) {
      console.error(err);
      setError('Guest Sign-In encountered an error. Please try again.');
    } finally {
      setLoading(false);
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
    <div className="w-[100vw] min-h-dvh bg-obsidian text-on-surface relative overflow-x-hidden font-body-md antialiased px-6 py-8">
      {/* Ambient Glow Background */}
      <div className="ambient-glow"></div>

      {/* Main Content Container */}
      <main className="relative z-10 w-full min-w-[320px] max-w-[400px] mx-auto pb-12">
        
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
          <h1 className="font-display-md text-display-md text-on-surface tracking-tighter leading-none mb-2">Jaaduwrld</h1>
          <p className="text-[11px] font-bold tracking-[0.2em] text-primary uppercase mb-4">Art and Arcade</p>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {authMode === 'login' ? 'Enter the Arcade' : 'Create your access pass'}
          </p>
        </div>

        {/* Toggle Pill */}
        <div className="glass-panel p-1 rounded-full flex items-center mb-lg relative z-10 max-w-[300px] mx-auto border-white/10 bg-white/5">
          <button
            onClick={() => { setAuthMode('login'); setError(''); }}
            className={`flex-1 py-2 px-3 rounded-full font-label-md text-[12px] transition-all duration-300 ${authMode === 'login'
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-on-surface-variant hover:text-white'
              }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setAuthMode('signup'); setError(''); }}
            className={`flex-1 py-2 px-3 rounded-full font-label-md text-[12px] transition-all duration-300 ${authMode === 'signup'
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-on-surface-variant hover:text-white'
              }`}
          >
            Sign Up
          </button>
        </div>

        {/* Login/Signup Card (Glassmorphism) */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 relative overflow-hidden border-white/10 shadow-xl shadow-black/50">
          {/* Subtle Inner Glow (Top Left) */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            
            {/* Sign Up Fields */}
            {authMode === 'signup' && (
              <div className="space-y-sm animate-fade-in">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-sm">
                    <label className="font-label-md text-label-md text-on-surface-variant block">First Name</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">badge</span>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Neon"
                        className="input-dark w-full rounded-lg py-3 pl-10 pr-3 text-on-surface font-body-md placeholder-on-surface-variant/30 focus:ring-0"
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
                      className="input-dark w-full rounded-lg py-3 px-3 text-on-surface font-body-md placeholder-on-surface-variant/30 focus:ring-0"
                    />
                  </div>
                </div>

                <div className="space-y-sm pt-2">
                  <label className="font-label-md text-label-md text-on-surface-variant block">Phone Number</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">call</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className="input-dark w-full rounded-lg py-3 pl-10 pr-3 text-on-surface font-body-md placeholder-on-surface-variant/30 focus:ring-0"
                    />
                  </div>
                </div>

                <div className="space-y-sm pt-2">
                  <label className="font-label-md text-label-md text-on-surface-variant block flex items-center justify-between">
                    <span>Referral Code</span>
                    <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">Optional</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">redeem</span>
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="e.g. A9B2C4"
                      maxLength={6}
                      className="input-dark w-full rounded-lg py-3 pl-10 pr-3 text-on-surface font-body-md placeholder-on-surface-variant/30 focus:ring-0 uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Form Fields - Hidden if Guest */}
            {authMode !== 'guest' && (
              <>
                {/* Email Field */}
                <div className="space-y-sm">
                  <label className="font-label-md text-label-md text-on-surface-variant block" htmlFor="email">Email Address</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>mail</span>
                    <input 
                      className="input-dark w-full rounded-lg py-3 pl-10 pr-3 text-on-surface font-body-md placeholder-on-surface-variant/30 focus:ring-0" 
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
                    {authMode === 'login' && (
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
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>lock</span>
                    <input 
                      className="input-dark w-full rounded-lg py-3 pl-10 pr-10 text-on-surface font-body-md placeholder-on-surface-variant/30 focus:ring-0 tracking-widest" 
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility' : 'visibility_off'}</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Error and Success Messages */}
            {error && <p className="text-error text-xs font-medium mt-3 px-1 animate-fade-in">{error}</p>}
            {resetMessage && (
              <p className="text-secondary text-xs font-medium mt-3 px-1 flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 size={14} />
                {resetMessage}
              </p>
            )}

            {authMode === 'login' && (
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
              className="btn-gradient w-full rounded-lg py-3 px-6 font-label-md text-label-md text-background font-bold flex items-center justify-center gap-sm disabled:opacity-50 mt-8"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  <span>{authMode === 'login' ? 'Authenticating...' : 'Initializing...'}</span>
                </>
              ) : (
                <>
                  <span>{authMode === 'login' ? 'Initiate Sequence' : 'Create Access Pass'}</span>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
                </>
              )}
            </button>
            
            {/* Divider */}
            {authMode === 'login' && (
              <>
                <div className="flex items-center gap-md py-sm opacity-60">
                  <div className="h-px bg-white/10 flex-1"></div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Or</span>
                  <div className="h-px bg-white/10 flex-1"></div>
                </div>
                
                {/* Join as Guest Button */}
                <button 
                  type="button"
                  onClick={handleGuestSignIn}
                  disabled={loading}
                  className="w-full glass-panel rounded-lg py-md px-lg font-label-md text-label-md text-white flex items-center justify-center gap-3 hover:bg-white/10 transition-colors border-white/10 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">person</span>
                  <span>Join as Guest</span>
                </button>
              </>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-obsidian text-primary">
        <div className="w-10 h-10 border-4 border-surface border-t-primary rounded-full animate-spin neon-glow-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
