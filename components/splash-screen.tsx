'use client';

import { useState, useEffect } from 'react';

export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Faster splash — just enough to feel premium, not slow
    const timer1 = setTimeout(() => setFadeOut(true), 600);
    const timer2 = setTimeout(() => setShowSplash(false), 900);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!showSplash) return <>{children}</>;

  return (
    <>
      <div
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#111111] transition-opacity duration-300 ${
          fadeOut ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Minimal logo */}
        <div className="mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
            <svg width="32\" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 4L4 36H16L20 28L24 36H36L20 4Z" fill="white" />
              <circle cx="20" cy="22" r="3" fill="#111111" />
            </svg>
          </div>
        </div>

        {/* Brand */}
        <h1 className="text-xl font-black text-white tracking-tight mb-1">
          Jaaduwrld
        </h1>
        <p className="text-[10px] font-medium text-white/30 tracking-[0.25em] uppercase">
          Art and Arcade
        </p>

        {/* Simple spinner */}
        <div className="mt-8">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      </div>
      {/* Render children immediately behind splash for instant load */}
      <div className={`w-full flex-1 flex flex-col ${fadeOut ? '' : 'invisible'}`}>{children}</div>
    </>
  );
}
