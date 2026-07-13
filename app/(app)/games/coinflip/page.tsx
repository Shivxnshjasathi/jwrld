'use client';

import { useState } from 'react';
import { useAppNavigation } from '@/hooks/useAppNavigation';

export default function CoinFlipPage() {
  const { goBack } = useAppNavigation();
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [rotation, setRotation] = useState(0);

  const flipCoin = () => {
    if (flipping) return;
    setFlipping(true);
    setResult(null);

    // Randomize result
    const isHeads = Math.random() > 0.5;
    
    // Add 10 full spins (3600 deg) + half a spin (180 deg) if tails
    const spinAmount = 3600 + (isHeads ? 0 : 180);
    
    // Make sure we add to the current rotation so it always goes forward
    const baseRotation = Math.ceil(rotation / 360) * 360;
    setRotation(baseRotation + spinAmount);

    setTimeout(() => {
      setResult(isHeads ? 'heads' : 'tails');
      setFlipping(false);
    }, 2000); // Wait for CSS transition
  };

  return (
    <div className="flex flex-col min-h-dvh bg-[#0A0618] relative font-sans perspective-[1000px]">
      <div className="flex items-center px-5 pt-14 pb-4 relative z-10">
        <button onClick={goBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center pt-[10vh] px-5 relative z-10">
        <h1 className="font-display-md text-[36px] font-bold text-white mb-2">Coin Flip</h1>
        <p className="text-white/40 text-[14px] font-medium mb-16">Heads or Tails?</p>

        {/* 3D Coin Container */}
        <div className="relative w-48 h-48 mb-16">
          <div 
            className="w-full h-full relative"
            style={{ 
              transformStyle: 'preserve-3d', 
              transform: `rotateX(${rotation}deg)`,
              transition: flipping ? 'transform 2s cubic-bezier(0.4, 0, 0.2, 1)' : 'transform 0.5s ease-out'
            }}
          >
            {/* Heads (Front) */}
            <div className="absolute inset-0 rounded-full border-[6px] border-[#FFD700] bg-gradient-to-br from-[#FFDF00] to-[#D4AF37] shadow-[inset_0_0_20px_rgba(0,0,0,0.4)] flex items-center justify-center backface-hidden">
               <div className="w-[80%] h-[80%] rounded-full border-2 border-[#B8860B] flex items-center justify-center">
                 <span className="font-display-md text-[60px] font-black text-[#B8860B]">H</span>
               </div>
            </div>

            {/* Tails (Back) */}
            <div className="absolute inset-0 rounded-full border-[6px] border-[#C0C0C0] bg-gradient-to-br from-[#E8E8E8] to-[#A9A9A9] shadow-[inset_0_0_20px_rgba(0,0,0,0.4)] flex items-center justify-center backface-hidden" style={{ transform: 'rotateX(180deg)' }}>
               <div className="w-[80%] h-[80%] rounded-full border-2 border-[#808080] flex items-center justify-center">
                 <span className="font-display-md text-[60px] font-black text-[#808080]">T</span>
               </div>
            </div>
          </div>

          {/* Shadow under coin */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/40 blur-md rounded-[100%] transition-transform" style={{ transform: `translateX(-50%) scale(${flipping ? 0.6 : 1})` }}></div>
        </div>

        <div className="h-10 mb-8 flex items-center justify-center">
          {result && !flipping && (
            <h2 className="text-[28px] font-black text-white uppercase tracking-wider animate-scale-in">
              {result}
            </h2>
          )}
        </div>

        <button 
          onClick={flipCoin}
          disabled={flipping}
          className={`w-[200px] h-[60px] rounded-full border-[3px] flex items-center justify-center shadow-[0_0_30px_rgba(78,205,196,0.5)] transition-all ${
            flipping ? 'bg-surface-variant border-white/10 opacity-50 scale-95' : 'bg-gradient-to-r from-[#4ECDC4] to-[#2B9348] border-[#FFD93D] active:scale-95'
          }`}
        >
          <span className="text-white font-bold text-[16px]">{flipping ? 'Flipping...' : 'FLIP COIN'}</span>
        </button>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}} />
    </div>
  );
}
