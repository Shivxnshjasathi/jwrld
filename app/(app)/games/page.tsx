'use client';

import { useRouter } from 'next/navigation';
import { useAppNavigation } from '@/hooks/useAppNavigation';

export default function GamesHubPage() {
  const router = useRouter();
  const { goBack } = useAppNavigation();

  return (
    <div className="flex flex-col min-h-dvh bg-[#0A0618] overflow-hidden relative font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FF6B6B]/10 rounded-full blur-[100px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-[#4ECDC4]/10 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="flex items-center px-5 pt-14 pb-4 relative z-10">
        <button onClick={goBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
      </div>

      <div className="flex-1 px-5 relative z-10 flex flex-col pt-4">
        <div className="mb-10 animate-fade-in">
          <h1 className="font-display-md text-[40px] font-bold text-white mb-2 tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">Arcade</h1>
          <p className="text-white/50 text-[15px] font-medium max-w-[280px]">Play games, test your luck, and win big.</p>
        </div>

        <div className="flex flex-col gap-5 pb-10">
          {/* Game 1: Spin */}
          <div 
            onClick={() => router.push('/spin')}
            className="group relative w-full h-[140px] rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform animate-scale-in"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#9D4EDD] to-[#FF6B6B] opacity-80 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl backdrop-blur-md border border-white/30 flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
                 <span className="material-symbols-outlined text-white text-[28px]">casino</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-[22px] leading-none mb-1">Spin the Wheel</h3>
                <p className="text-white/70 text-[13px] font-medium">Daily free spins & rewards</p>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-[20px] group-hover:bg-white/20 transition-colors"></div>
          </div>

          {/* Game 2: Minesweeper */}
          <div 
            onClick={() => router.push('/games/minesweeper')}
            className="group relative w-full h-[140px] rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform animate-scale-in"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFD93D] to-[#FF8C42] opacity-80 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl backdrop-blur-md border border-white/30 flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
                 <span className="material-symbols-outlined text-white text-[28px]">grid_view</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-[22px] leading-none mb-1">Minesweeper</h3>
                <p className="text-white/70 text-[13px] font-medium">Classic puzzle strategy</p>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-[20px] group-hover:bg-white/20 transition-colors"></div>
          </div>

          {/* Game 3: Coin Flip */}
          <div 
            onClick={() => router.push('/games/coinflip')}
            className="group relative w-full h-[140px] rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform animate-scale-in"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#4ECDC4] to-[#2B9348] opacity-80 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl backdrop-blur-md border border-white/30 flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
                 <span className="material-symbols-outlined text-white text-[28px]">toll</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-[22px] leading-none mb-1">Coin Flip</h3>
                <p className="text-white/70 text-[13px] font-medium">Test your 50/50 luck</p>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-[20px] group-hover:bg-white/20 transition-colors"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
