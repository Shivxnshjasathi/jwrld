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
    <div className="min-h-dvh flex items-center justify-center bg-arcade-bg">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="bg-arcade-green text-white px-5 py-2.5 rounded-2xl font-black text-2xl tracking-tight shadow-lg">
          ARCADE<span className="text-yellow-300">ZONE</span>
        </div>
        <div className="w-8 h-8 border-3 border-arcade-green border-t-transparent rounded-full animate-spin mt-4" />
      </div>
    </div>
  );
}
