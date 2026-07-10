'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { isFirebaseConfigured } from '@/lib/firebase';

export default function RootPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isFirebaseConfigured) {
        // Demo mode: go to login to show setup instructions
        router.replace('/login');
      } else {
        router.replace(isAuthenticated ? '/home' : '/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#111111]">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    </div>
  );
}
