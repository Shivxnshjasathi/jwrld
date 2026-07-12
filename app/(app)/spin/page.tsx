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
    <div className="bg-background text-on-surface min-h-dvh pb-[120px] font-body-md selection:bg-primary/30 selection:text-primary relative overflow-hidden">
      <div className="fixed top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.15)_0%,rgba(5,5,5,1)_70%)] pointer-events-none mix-blend-screen opacity-60"></div>
      
      <header className="bg-black/30 backdrop-blur-2xl border-b border-white/5 shadow-sm fixed top-0 w-full flex items-center px-gutter py-md z-40 gap-4">
        <button onClick={() => router.back()} className="text-primary hover:opacity-80 transition-opacity active:scale-95 duration-200">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-[24px] font-bold text-white header-glow flex-1 text-center pr-8">Daily Spin</h1>
      </header>

      <main className="pt-[120px] px-gutter md:px-xl max-w-container-max mx-auto relative z-10 flex flex-col items-center justify-center min-h-[70vh]">
        
        <div className="text-center mb-xl">
          <h2 className="font-display-md text-[32px] text-white font-bold tracking-tight mb-2">Spin & Win</h2>
          <p className="text-on-surface-variant font-bold uppercase tracking-wider text-[14px]">You have {spinsAvailable} spin{spinsAvailable !== 1 ? 's' : ''} left</p>
        </div>

        <div className="relative w-[300px] h-[300px] mb-xl flex items-center justify-center">
          {/* Wheel pointer */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
            <span className="material-symbols-outlined text-[40px]">arrow_drop_down</span>
          </div>

          {/* The Wheel */}
          <div 
            className={`w-full h-full rounded-full border-4 border-outline-variant/30 shadow-[0_0_50px_rgba(45,212,191,0.2)] flex items-center justify-center bg-surface-container relative overflow-hidden transition-all duration-[3000ms] ease-out ${spinning ? 'rotate-[1800deg]' : ''}`}
            style={{ 
              background: 'conic-gradient(from 0deg, #A855F7 0deg 60deg, #2DD4BF 60deg 120deg, #A855F7 120deg 180deg, #2DD4BF 180deg 240deg, #A855F7 240deg 300deg, #2DD4BF 300deg 360deg)' 
            }}
          >
            {/* Inner circle */}
            <div className="absolute w-[60%] h-[60%] bg-background rounded-full z-10 flex flex-col items-center justify-center border-4 border-outline-variant/50 shadow-inner">
              <span className="material-symbols-outlined text-primary text-[48px] neon-text-primary">casino</span>
            </div>
          </div>
        </div>

        {prize && !spinning && (
          <div className="animate-slide-up-fade mb-lg bg-surface-variant/40 border border-secondary/30 backdrop-blur-md rounded-xl p-lg text-center shadow-[0_0_30px_rgba(45,212,191,0.3)] w-full max-w-[300px]">
            <p className="text-on-surface-variant text-[14px] uppercase font-bold tracking-wider mb-2">You Won</p>
            <p className="text-[32px] font-bold text-white header-glow mb-4">{prize.label}</p>
            <p className="text-[14px] text-secondary">Added to your account!</p>
          </div>
        )}

        <button
          onClick={handleSpin}
          disabled={spinning || spinsAvailable <= 0}
          className="w-full max-w-[300px] py-4 rounded-xl font-bold bg-gradient-to-r from-secondary to-primary text-black disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95 text-[18px] shadow-[0_0_20px_rgba(168,85,247,0.4)]"
        >
          {spinning ? 'Spinning...' : 'SPIN NOW'}
        </button>

      </main>
    </div>
  );
}
