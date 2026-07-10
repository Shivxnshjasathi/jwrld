'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { isFirebaseConfigured } from '@/lib/firebase';
import BottomNav from '@/components/bottom-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect to login if Firebase is configured AND user is not authenticated
    if (!loading && !isAuthenticated && isFirebaseConfigured) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading && isFirebaseConfigured) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#111111]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-sm font-medium text-white/50">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow access in demo mode (Firebase not configured) or when authenticated
  if (!isAuthenticated && isFirebaseConfigured) return null;

  const showBottomNav = ['/home', '/bookings', '/profile'].includes(pathname);

  return (
    <div className={`min-h-dvh bg-[#F5F5F5] ${showBottomNav ? 'pb-[var(--bottom-nav-height)]' : ''}`}>
      {children}
      {showBottomNav && <BottomNav />}
    </div>
  );
}
