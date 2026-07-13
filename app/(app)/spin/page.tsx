'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { toast } from 'react-hot-toast';

export default function SpinPage() {
  const router = useRouter();
  const { appUser } = useAuth();
  
  const [spinning, setSpinning] = useState(false);
  const [targetRotation, setTargetRotation] = useState(0);
  const [spinsAvailable, setSpinsAvailable] = useState(0);

  useEffect(() => {
    if (appUser) {
      setSpinsAvailable(appUser.spinsAvailable || 0);
    }
  }, [appUser]);

  const handleSpin = async () => {
    if (spinsAvailable <= 0) {
      toast.error('No spins available! Come back tomorrow to build your streak.');
      return;
    }

    // Start a dummy fast spin while fetching
    setSpinning(true);
    // Add 10 full spins plus some extra so it looks like it's spinning endlessly while waiting
    setTargetRotation(prev => prev + 3600); 

    try {
      const res = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: appUser?.uid })
      });
      const data = await res.json();
      
      if (data.success) {
        setSpinsAvailable(s => s - 1);
        
        // Calculate the exact rotation needed to land on the prizeIndex
        // Wheel has 8 slices. Slice 0 is at top (0 deg). 
        // Each slice is 45 degrees.
        // To make slice `i` land at the top (0 degrees), we need the wheel to be rotated by `360 - (i * 45)` degrees.
        // We also want to add 5 full spins (1800 degrees) to make it spin for a while.
        
        const prizeIndex = data.prizeIndex;
        // Since we already started a dummy spin (targetRotation was updated), let's calculate a NEW final rotation
        // that's higher than the current rotation to ensure it keeps going forward.
        setTargetRotation(prev => {
          // Snap to the next multiple of 360, add 5 full spins, then subtract the index offset
          const base = Math.ceil(prev / 360) * 360;
          return base + 1800 + (360 - (prizeIndex * 45));
        });

        setTimeout(() => {
          setSpinning(false);
          if (data.prizeType === 'miss') {
             toast.error('Oh no! Better luck next time.', { icon: '😢' });
          } else {
             toast.success(`🎉 You won ${data.label}!`);
          }
        }, 3500); // Wait for the 3s CSS transition to finish + a little buffer
      } else {
        setSpinning(false);
        toast.error(data.error || 'Failed to spin');
      }
    } catch (error) {
      setSpinning(false);
      toast.error('Network error');
    }
  };

  return (
    <div className="flex flex-col min-h-dvh bg-[#0A0618] overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FF6B6B]/20 rounded-full blur-[100px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-[#4ECDC4]/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-[30%] left-[20%] w-[50%] h-[50%] bg-[#9D4EDD]/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="flex items-center justify-between px-5 pt-14 pb-4 relative z-10">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full">
          <span className="material-symbols-outlined text-[16px] text-[#FFD93D]">stars</span>
          <span className="text-white/60 text-[14px] font-medium">{spinsAvailable} spins left</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 relative z-10">
        
        {/* Title Area */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="font-display-md text-[36px] font-bold text-white mb-2 tracking-tight">Spin the Wheel!</h1>
          <p className="text-white/40 text-[14px] font-medium">Test your luck, win epic rewards.</p>
        </div>

        {/* Spin Button container */}
        <div className="relative mb-16 z-30">
          <button 
            onClick={handleSpin}
            disabled={spinning || spinsAvailable <= 0}
            className={`w-[200px] h-[60px] rounded-full border-[3px] flex items-center justify-center shadow-[0_0_30px_rgba(255,107,107,0.5)] transition-all ${
              spinning || spinsAvailable <= 0 ? 'bg-surface-variant border-white/10 opacity-50 scale-95' : 'bg-gradient-to-r from-[#FF6B6B] to-[#9D4EDD] border-[#FFD93D] active:scale-95'
            }`}
          >
            <span className="text-white font-bold text-[16px]">{spinning ? 'Spinning...' : 'Spin!'}</span>
          </button>
          
          {/* Subtle glow underneath */}
          {!spinning && spinsAvailable > 0 && (
             <div className="absolute inset-0 bg-[#FF6B6B] rounded-full blur-[20px] opacity-40 z-[-1] animate-pulse"></div>
          )}
        </div>

        {/* The Wheel Container */}
        <div className="relative w-[320px] h-[320px] mt-[-20px] mb-[60px] animate-scale-in">
          
          {/* Outer Ring with Glow */}
          <div className="absolute inset-[-4px] rounded-full bg-gradient-to-br from-[#FF6B6B] via-[#9D4EDD] to-[#4ECDC4] opacity-80 blur-[2px]"></div>
          <div className="absolute inset-0 rounded-full bg-[#0A0618] border-[12px] border-black"></div>

          {/* The Spinning Wheel */}
          <div 
            className="absolute inset-[8px] rounded-full overflow-hidden"
            style={{ 
              transform: `rotate(${targetRotation}deg)`,
              transition: spinning ? 'transform 3s cubic-bezier(0.15, 0.9, 0.15, 1)' : 'transform 1s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}
          >
            <div 
              className="w-full h-full"
              style={{
                background: 'conic-gradient(from -22.5deg, #b070f0 0deg 45deg, #d8b4f8 45deg 90deg, #ff4d85 90deg 135deg, #e5d0ff 135deg 180deg, #b070f0 180deg 225deg, #d8b4f8 225deg 270deg, #7b2cbf 270deg 315deg, #e5d0ff 315deg 360deg)'
              }}
            >
              {/* Text Labels on Wheel Slices */}
              <div className="absolute inset-0 flex items-center justify-center">
                 {['JACKPOT!', '₹50 Bonus', '200 XP', '100 XP', '₹20 Bonus', '50 XP', '₹10 Bonus', 'Try Again'].map((label, i) => (
                   <div 
                     key={i} 
                     className="absolute w-[30px] h-[50%] origin-bottom top-0 flex flex-col items-center justify-start pt-8"
                     style={{ transform: `rotate(${i * 45}deg)` }}
                   >
                     <span 
                       className="text-white font-black text-[24px] uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" 
                       style={{ transform: 'rotate(-90deg) translateY(10px)', writingMode: 'vertical-rl' }}
                     >
                       {label}
                     </span>
                   </div>
                 ))}
              </div>
            </div>
          </div>

          {/* Center Pointer & Hub */}
          <div className="absolute z-20 flex flex-col items-center justify-center translate-y-[-20%]">
            {/* The Black Pointer pointing UP */}
            <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[60px] border-b-black translate-y-[20px] drop-shadow-[0_-5px_10px_rgba(0,0,0,0.5)] z-20 relative"></div>
            
            {/* Center Black Circle with Gradient Border */}
            <div className="w-[70px] h-[70px] rounded-full bg-black relative z-30 shadow-[0_0_20px_rgba(0,0,0,0.8)] flex items-center justify-center">
               <div className="absolute inset-[-3px] rounded-full bg-gradient-to-br from-[#4ECDC4] via-[#9D4EDD] to-[#FF6B6B] z-[-1]"></div>
               <div className="w-[56px] h-[56px] bg-gradient-to-b from-[#333] to-[#111] rounded-full shadow-inner"></div>
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
}
