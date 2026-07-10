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
      <div className="min-h-dvh flex items-center justify-center bg-[#F5F5F5]">
        <div className="w-10 h-10 border-3 border-[#111111] border-t-transparent rounded-full animate-spin" />
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
      <div className="min-h-dvh bg-[#F5F5F5] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-[1.5rem] p-8 shadow-sm relative">
          <button
            onClick={() => router.replace('/home')}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={16} className="text-gray-900" />
          </button>

          <div className="w-16 h-16 bg-[#111111] rounded-full flex items-center justify-center mx-auto mb-6 mt-4">
            <Shield size={28} className="text-white" />
          </div>
          
          <h1 className="text-xl font-black text-gray-900 text-center mb-2">Admin Access</h1>
          <p className="text-sm text-gray-500 text-center mb-8">Enter the master password to continue</p>
          
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
                className={`w-full bg-[#F5F5F5] rounded-full px-5 py-4 text-center font-medium focus:outline-none focus:ring-2 transition-all ${
                  error ? 'focus:ring-red-500 ring-2 ring-red-500' : 'focus:ring-[#111111]'
                }`}
                autoFocus
              />
              {error && <p className="text-red-500 text-xs font-bold text-center mt-2">Incorrect password</p>}
            </div>
            
            <button
              type="submit"
              disabled={!password}
              className="w-full bg-[#111111] text-white rounded-full py-4 font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors hover:bg-black"
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
