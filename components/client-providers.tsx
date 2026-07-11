'use client';

import { useEffect } from 'react';
import SplashScreen from '@/components/splash-screen';
import { useAppStore } from '@/lib/store';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const darkMode = useAppStore((s) => s.darkMode);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return <SplashScreen><div className="w-screen flex-1 flex flex-col">{children}</div></SplashScreen>;
}
