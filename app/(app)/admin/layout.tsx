'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useBookingStore } from '@/lib/store';
import { Shield, ArrowRight, ArrowLeft } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loading, profileLoading, isAdmin } = useAuth();
  const router = useRouter();
  const adminAuthenticated = useBookingStore(state => state.adminAuthenticated);
  const setAdminAuthenticated = useBookingStore(state => state.setAdminAuthenticated);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!loading && !profileLoading && !isAdmin) {
      router.replace('/home');
    }
  }, [loading, profileLoading, isAdmin, router]);

  if (loading || profileLoading || !isAdmin) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#0A0A0B]">
        <div className="w-10 h-10 border-3 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '12345') {
      setAdminAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  if (!adminAuthenticated) {
    return (
      <div className="w-[100vw] flex-1 min-h-dvh bg-[#0A0A0B] flex flex-col justify-center p-4 relative overflow-x-hidden font-body-md text-on-surface">
        {/* Background Ambient Glow */}
        <div className="ambient-glow"></div>
        
        <div className="w-full min-w-[320px] max-w-sm mx-auto glass-panel rounded-[1.5rem] p-8 relative z-10 border border-white/10 shadow-[0_0_40px_rgba(168,85,247,0.15)]">
          <button
            onClick={() => router.replace('/home')}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-on-surface-variant hover:text-primary active:scale-95"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-6 mt-4 border border-white/5 shadow-[0_0_20px_rgba(45,212,191,0.2)]">
            <Shield size={28} className="text-secondary neon-text-secondary" />
          </div>
          
          <h1 className="text-xl font-display-md font-bold text-white text-center mb-2 header-glow tracking-tighter">Admin Access</h1>
          <p className="text-[14px] text-on-surface-variant text-center mb-8">Enter the master password to continue</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Password"
                className={`w-full bg-black/40 rounded-full px-5 py-4 text-center font-bold text-white border transition-all ${
                  error 
                    ? 'border-error focus:ring-2 focus:ring-error focus:outline-none' 
                    : 'border-white/10 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                }`}
                autoFocus
              />
              {error && <p className="text-error text-[12px] font-bold text-center mt-2">Incorrect password</p>}
            </div>
            
            <button
              type="submit"
              disabled={!password}
              className="w-full bg-primary text-background rounded-full py-4 font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:bg-primary/90 active:scale-95 shadow-[0_0_15px_rgba(221,183,255,0.4)]"
            >
              Unlock <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
