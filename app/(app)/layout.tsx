'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { isFirebaseConfigured } from '@/lib/firebase';
import BottomNav from '@/components/bottom-nav';
import InstallPrompt from '@/components/install-prompt';

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
      <div className="min-h-dvh flex items-center justify-center bg-arcade-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-arcade-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-arcade-text-muted">Loading ArcadeZone...</p>
        </div>
      </div>
    );
  }

  // Allow access in demo mode (Firebase not configured) or when authenticated
  if (!isAuthenticated && isFirebaseConfigured) return null;

  return (
    <div className={`min-h-dvh bg-[#F5F5F5] ${pathname === '/home' ? 'pb-[var(--bottom-nav-height)]' : ''}`}>
      {children}
      {pathname === '/home' && <BottomNav />}
      <InstallPrompt />
    </div>
  );
}
