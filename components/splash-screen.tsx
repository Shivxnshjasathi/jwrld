'use client';

import { useState, useEffect } from 'react';

export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setFadeOut(true), 1200);
    const timer2 = setTimeout(() => setShowSplash(false), 1700);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!showSplash) return <>{children}</>;

  return (
    <>
      <div
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#111111] transition-opacity duration-500 ${
          fadeOut ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Logo */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center splash-pulse">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 4L4 36H16L20 28L24 36H36L20 4Z" fill="white" />
              <circle cx="20" cy="22" r="3" fill="#111111" />
            </svg>
          </div>
          {/* Glow ring */}
          <div className="absolute inset-0 w-20 h-20 rounded-2xl border border-white/20 splash-ring" />
        </div>

        {/* Brand Text */}
        <h1 className="text-2xl font-black text-white tracking-tight mb-1">
          ArcadeZone
        </h1>
        <p className="text-xs font-medium text-white/40 tracking-[0.2em] uppercase">
          Book · Play · Win
        </p>

        {/* Loading dots */}
        <div className="flex gap-1.5 mt-8">
          <div className="w-1.5 h-1.5 rounded-full bg-white/60 splash-dot" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-white/60 splash-dot" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-white/60 splash-dot" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
      {/* Render children behind splash so they start loading */}
      <div className={fadeOut ? '' : 'invisible'}>{children}</div>
    </>
  );
}
