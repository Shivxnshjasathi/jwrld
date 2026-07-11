'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { createFoodOrder, type FoodItem } from '@/lib/firestore';

export default function FoodCheckoutPage() {
  const router = useRouter();
  const { appUser } = useAuth();
  
  const [cartItems, setCartItems] = useState<FoodItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [tableNumber, setTableNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const savedCart = sessionStorage.getItem('foodCart');
    const savedTotal = sessionStorage.getItem('foodTotal');
    if (savedCart && savedTotal) {
      setCartItems(JSON.parse(savedCart));
      setTotalAmount(parseInt(savedTotal, 10));
    } else {
      router.replace('/food');
    }
  }, [router]);

  const handlePlaceOrder = async () => {
    if (!appUser || !tableNumber.trim() || cartItems.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await createFoodOrder({
        userId: appUser.uid,
        userName: appUser.name,
        tableNumber: tableNumber.trim(),
        items: cartItems,
        totalAmount,
        status: 'pending',
      });
      
      sessionStorage.removeItem('foodCart');
      sessionStorage.removeItem('foodTotal');
      setIsSuccess(true);
    } catch (error) {
      console.error('Error placing food order:', error);
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center p-6 text-center animate-fade-in relative overflow-hidden bg-[#0A0A0B] text-on-surface selection:bg-primary/30">
        <div className="ambient-glow"></div>
        <div className="relative z-10 glass-card rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-white/10">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-secondary"></div>
          <div className="w-24 h-24 bg-secondary/10 border border-secondary/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <span 
              className="material-symbols-outlined text-[48px] text-secondary animate-bounce-slight drop-shadow-[0_0_15px_rgba(68,226,205,0.8)]" 
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <h1 className="font-display-md text-[32px] font-bold text-white mb-2 tracking-tighter">Order Placed!</h1>
          <p className="font-body-md text-[16px] text-on-surface-variant mb-8 leading-relaxed">
            Your food is being prepared and will be brought to <strong className="text-primary">{tableNumber}</strong> shortly.
          </p>
          <button
            onClick={() => router.replace('/home')}
            className="btn-gradient w-full rounded-full py-4 font-bold text-[14px] text-background uppercase tracking-widest shadow-[0_0_20px_rgba(132,43,210,0.4)] active:scale-95 transition-all neon-glow-primary"
          >
            BACK TO HOME
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh pb-[100px] relative overflow-hidden bg-[#0A0A0B] text-on-surface selection:bg-primary/30">
      {/* Background Glow */}
      <div className="ambient-glow"></div>

      <div className="relative z-10 w-full max-w-md px-5 mx-auto pt-24">
        {/* Header */}
        <header className="glass-panel sticky top-0 w-full z-50 flex items-center gap-4 px-gutter py-md border-b border-outline-variant/20 shadow-sm bg-surface/10 backdrop-blur-xl">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-on-surface-variant hover:text-primary transition-colors active:scale-95 duration-200 mr-sm hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="flex-1">
            <h1 className="font-display-md text-[20px] font-bold tracking-tighter text-on-surface header-glow">Checkout</h1>
            <p className="font-label-sm text-[11px] font-bold text-primary uppercase tracking-widest mt-1">Jaaduwrld Arcade</p>
          </div>
        </header>

        {/* Table Number */}
        <section className="mb-6 mt-6">
          <h2 className="font-headline-md text-[20px] font-bold mb-4 text-on-surface">Where are you seated?</h2>
          <div className="relative glass-panel rounded-2xl border border-white/10 p-5">
            <label htmlFor="tableNumber" className="font-label-sm text-[12px] font-bold text-on-surface-variant block mb-3 uppercase tracking-widest">Table / Station</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>chair</span>
              <input
                id="tableNumber"
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g. Pool Table 1, PS5 Station 2..."
                className="w-full bg-[#050505] border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-4 pl-12 pr-4 text-[14px] font-bold text-white placeholder-on-surface-variant/50 transition-all shadow-inner"
              />
            </div>
          </div>
        </section>

        {/* Order Summary */}
        <section className="mb-8">
          <h2 className="font-headline-md text-[20px] font-bold mb-4 text-on-surface">Order Summary</h2>
          <div className="glass-panel rounded-2xl border border-white/10 p-5 relative overflow-hidden group">
            {/* Inner Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none transition-all group-hover:bg-primary/10"></div>
            
            <div className="space-y-3 relative z-10">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center font-bold text-[12px] text-primary">{item.quantity}x</span>
                    <span className="font-bold text-[14px] text-white">{item.name}</span>
                  </div>
                  <span className="font-bold text-[14px] text-secondary">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-dashed border-white/20 my-5 relative z-10" />
            
            <div className="flex justify-between items-end relative z-10 bg-white/5 p-4 rounded-xl border border-white/5">
              <span className="font-bold text-[12px] text-on-surface-variant uppercase tracking-widest">Total</span>
              <span className="font-display-md text-[28px] font-black text-primary neon-text-primary leading-none">₹{totalAmount}</span>
            </div>
          </div>
        </section>

      </div>

      {/* Place Order Button */}
      <div className="fixed bottom-0 pb-8 left-0 right-0 px-5 z-40">
        <button 
          onClick={handlePlaceOrder} 
          disabled={!tableNumber.trim() || isSubmitting}
          className="btn-gradient w-full py-4 rounded-xl font-bold text-[14px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 neon-glow-primary text-background disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(221,183,255,0.4)]"
        >
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            {isSubmitting ? 'hourglass_empty' : 'send'}
          </span>
          <span>{isSubmitting ? 'Initiating Sequence...' : 'Place Order'}</span>
        </button>
      </div>
    </main>
  );
}
