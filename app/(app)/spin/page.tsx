'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { toast } from 'react-hot-toast';

export default function SpinPage() {
  const { user, appUser } = useAuth();
  const router = useRouter();
  
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState<{ type: string, amount: number, label: string } | null>(null);
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
    
    setSpinning(true);
    setPrize(null);

    try {
      const res = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user?.uid })
      });
      const data = await res.json();
      
      if (data.success) {
        setSpinsAvailable(s => s - 1);
        
        // Wait for animation
        setTimeout(() => {
          setSpinning(false);
          setPrize({ type: data.prizeType, amount: data.prizeAmount, label: data.label });
          toast.success(`You won ${data.label}!`);
        }, 3000);
      } else {
        setSpinning(false);
        toast.error(data.error || 'Failed to spin');
      }
    } catch (err) {
      setSpinning(false);
      toast.error('An error occurred');
    }
  };

  return (
    <div className="bg-[#0A0618] text-on-surface min-h-dvh font-body-md selection:bg-primary/30 relative overflow-hidden flex flex-col">
      {/* Background Gradient */}
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-[#4A154B]/40 to-transparent pointer-events-none"></div>
      
      {/* Top Bar */}
      <header className="flex justify-between items-center px-gutter py-md z-40 relative mt-4">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>
        <span className="text-white/60 text-[14px] font-medium">{spinsAvailable} spins left</span>
        <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>
      </header>

      {/* Text Content */}
      <div className="flex flex-col items-center mt-xl z-40 relative">
        <h1 className="font-display-md text-[36px] font-bold text-white mb-2 tracking-tight">Spin the Wheel!</h1>
        <p className="text-white/40 text-[14px] font-medium">5 more spins ready in 05:00</p>
        
        <button
          onClick={handleSpin}
          disabled={spinning || spinsAvailable <= 0}
          className="mt-8 relative group active:scale-95 transition-transform disabled:opacity-50 disabled:pointer-events-none"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] rounded-full blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
          <div className="relative px-10 py-3.5 bg-[#1A1A24] rounded-full leading-none flex items-center justify-center">
            <span className="text-white font-bold text-[16px]">{spinning ? 'Spinning...' : 'Spin Again'}</span>
          </div>
        </button>
      </div>

      {/* Wheel Area - Positioned at bottom */}
      <div className="relative flex-1 flex flex-col justify-end items-center w-full mt-10">
        
        {/* Glow behind wheel */}
        <div className="absolute bottom-[-100px] w-[400px] h-[400px] bg-gradient-to-t from-[#FF6B6B]/20 to-[#4ECDC4]/20 blur-[80px] rounded-full pointer-events-none z-0"></div>

        {/* The Wheel Container */}
        <div className="relative w-[500px] h-[500px] translate-y-[35%] flex items-center justify-center z-10">
          
          {/* Outer Ring with Glow */}
          <div className="absolute inset-[-4px] rounded-full bg-gradient-to-br from-[#FF6B6B] via-[#9D4EDD] to-[#4ECDC4] opacity-80 blur-[2px]"></div>
          <div className="absolute inset-0 rounded-full bg-[#0A0618] border-[12px] border-black"></div>

          {/* The Spinning Wheel */}
          <div 
            className="absolute inset-[8px] rounded-full overflow-hidden"
            style={{ 
              transform: spinning ? 'rotate(1800deg)' : 'rotate(0deg)',
              transition: spinning ? 'transform 3s cubic-bezier(0.15, 0.9, 0.15, 1)' : 'none'
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
                 {['jackpot', '₹50 OFF', 'miss', '15% OFF', '₹20 OFF', 'miss', '10% OFF', '5% OFF'].map((label, i) => (
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
