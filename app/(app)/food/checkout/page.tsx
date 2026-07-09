'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
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
      <div className="min-h-dvh bg-[#F5F5F5] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <CheckCircle2 size={80} className="text-[#111111] mb-6 animate-bounce-slight" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Order Placed!</h1>
        <p className="text-sm text-gray-500 mb-8 font-medium">
          Your food is being prepared and will be brought to {tableNumber} shortly.
        </p>
        <button
          onClick={() => router.push('/home')}
          className="btn-green w-full"
        >
          BACK TO HOME
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#F5F5F5] pb-32">
      {/* Header */}
      <div className="bg-[#F5F5F5] px-6 pt-12 pb-6 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} className="text-[#1a1a1a]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Checkout</h1>
            <p className="text-[11px] text-gray-500 font-medium">ArcadeZone</p>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Table Number */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Where are you seated?</h2>
          <input
            type="text"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="e.g. Pool Table 1, PS5 Station 2..."
            className="w-full bg-white rounded-2xl px-5 py-4 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black transition-all font-medium"
          />
        </div>

        {/* Order Summary */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Order Summary</h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{item.quantity}x</span>
                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">₹{item.price * item.quantity}</span>
              </div>
            ))}
            
            <div className="h-px bg-gray-100 my-4" />
            
            <div className="flex justify-between items-center pt-1">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-[#111111] text-lg">₹{totalAmount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Place Order Button */}
      <div className="fixed bottom-6 left-0 right-0 px-6 z-10 animate-slide-up pointer-events-none">
        <button 
          onClick={handlePlaceOrder} 
          disabled={!tableNumber.trim() || isSubmitting}
          className="btn-green w-full pointer-events-auto shadow-lg shadow-black/10"
        >
          {isSubmitting ? 'PLACING ORDER...' : 'PLACE ORDER'}
        </button>
      </div>
    </div>
  );
}
