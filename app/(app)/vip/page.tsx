'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { deductWalletBalance } from '@/lib/wallet';

export default function VIPPage() {
  const { user, appUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const VIP_PRICE = 499;

  const handlePurchase = async () => {
    if (!user || !appUser) return;
    
    if (appUser.walletBalance === undefined || appUser.walletBalance < VIP_PRICE) {
      toast.error('Insufficient wallet balance to purchase VIP Pass.');
      return;
    }

    setLoading(true);
    try {
      // Deduct wallet balance
      await deductWalletBalance(user.uid, VIP_PRICE);
      
      // Update user to VIP for 30 days
      const db = getFirebaseDb();
      const vipUntil = new Date();
      vipUntil.setDate(vipUntil.getDate() + 30);
      
      await updateDoc(doc(db, 'users', user.uid), {
        isVIP: true,
        vipUntil: vipUntil.toISOString(),
      });
      
      toast.success('Welcome to Jaaduwrld VIP! 👑');
      router.push('/profile');
    } catch (err) {
      console.error(err);
      toast.error('Failed to purchase VIP Pass.');
    } finally {
      setLoading(false);
    }
  };

  const isVIP = appUser?.isVIP && appUser?.vipUntil && new Date(appUser.vipUntil) > new Date();

  return (
    <div className="bg-[#0A0618] text-on-surface min-h-dvh pb-[120px] font-body-md selection:bg-primary/30 relative overflow-hidden flex flex-col">
      <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-yellow-500/20 to-transparent pointer-events-none z-0"></div>
      
      <header className="flex justify-between items-center px-gutter py-md z-40 relative mt-4">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>
        <h1 className="font-headline-md text-[20px] font-bold text-white header-glow flex-1 text-center pr-10">VIP Pass</h1>
      </header>

      <main className="pt-8 px-gutter md:px-xl max-w-container-max mx-auto relative z-10 w-full">
        
        {/* VIP Card */}
        <div className="relative w-full aspect-[1.6/1] max-w-[400px] mx-auto rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(250,204,21,0.2)] mb-xl border border-yellow-400/30">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] z-0"></div>
          
          {/* Card Glows */}
          <div className="absolute -top-20 -right-20 w-[200px] h-[200px] bg-yellow-500/30 blur-[60px] rounded-full z-0"></div>
          <div className="absolute -bottom-20 -left-20 w-[200px] h-[200px] bg-yellow-600/20 blur-[60px] rounded-full z-0"></div>
          
          <div className="relative z-10 p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-yellow-400 font-black text-[24px] tracking-tight flex items-center gap-2">
                  JAADUWRLD <span className="material-symbols-outlined text-[24px]">workspace_premium</span>
                </h2>
                <p className="text-white/60 font-bold uppercase tracking-widest text-[10px]">Digital Membership</p>
              </div>
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10">
                <span className="material-symbols-outlined text-yellow-400">diamond</span>
              </div>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-white font-bold text-[18px]">{appUser?.name || 'Member'}</p>
                {isVIP ? (
                  <p className="text-yellow-400 font-bold text-[12px] mt-1">
                    Valid until {new Date(appUser.vipUntil!).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="text-white/40 font-bold text-[12px] mt-1 uppercase tracking-widest">Not Active</p>
                )}
              </div>
              {isVIP && (
                <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full text-yellow-400 text-[10px] font-black uppercase tracking-widest">
                  ACTIVE
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="max-w-[400px] mx-auto mb-xl space-y-4">
          <h3 className="text-white font-bold text-[18px] mb-4">VIP Benefits</h3>
          
          <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-container border border-white/5">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0 text-yellow-400">
              <span className="material-symbols-outlined text-[20px]">percent</span>
            </div>
            <div>
              <h4 className="text-white font-bold text-[15px]">15% Off All Bookings</h4>
              <p className="text-on-surface-variant text-[13px] leading-relaxed mt-1">Automatic 15% discount applied to the base price of every single booking you make.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-container border border-white/5">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 text-purple-400">
              <span className="material-symbols-outlined text-[20px]">casino</span>
            </div>
            <div>
              <h4 className="text-white font-bold text-[15px]">Double Daily Spins</h4>
              <p className="text-on-surface-variant text-[13px] leading-relaxed mt-1">Get 2 free spins every single day when you open the app instead of just 1.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-container border border-white/5">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 text-blue-400">
              <span className="material-symbols-outlined text-[20px]">star</span>
            </div>
            <div>
              <h4 className="text-white font-bold text-[15px]">Gold Profile Ring</h4>
              <p className="text-on-surface-variant text-[13px] leading-relaxed mt-1">Stand out with a glowing gold ring around your profile picture everywhere in the app.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-container border border-white/5">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 text-green-400">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
            <div>
              <h4 className="text-white font-bold text-[15px]">Priority Booking</h4>
              <p className="text-on-surface-variant text-[13px] leading-relaxed mt-1">Get priority placement on busy weekend waitlists.</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {!isVIP ? (
          <div className="fixed bottom-0 pb-6 pt-4 px-gutter left-0 right-0 bg-gradient-to-t from-[#0A0618] via-[#0A0618] to-transparent z-40 max-w-[400px] mx-auto">
            <button
              onClick={handlePurchase}
              disabled={loading}
              className="w-full py-4 rounded-full font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-[0_0_20px_rgba(250,204,21,0.4)] transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 text-[16px] flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : `Buy for ₹${VIP_PRICE}/month`}
            </button>
            <p className="text-center text-white/40 text-[11px] mt-3">Deducted automatically from Arcade Wallet</p>
          </div>
        ) : (
          <div className="pb-10 text-center">
            <p className="text-yellow-400 font-bold">You are an active VIP! 👑</p>
          </div>
        )}
      </main>
    </div>
  );
}
