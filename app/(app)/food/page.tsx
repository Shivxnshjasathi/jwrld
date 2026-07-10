'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import type { FoodItem } from '@/lib/firestore';

const SNACKS = [
  { id: 'fries', name: 'French Fries', price: 150 },
  { id: 'nachos', name: 'Loaded Nachos', price: 200 },
  { id: 'popcorn', name: 'Cheese Popcorn', price: 120 },
  { id: 'sandwich', name: 'Club Sandwich', price: 180 },
];

const DRINKS = [
  { id: 'coke', name: 'Coca Cola', price: 60 },
  { id: 'redbull', name: 'Red Bull', price: 150 },
  { id: 'coldcoffee', name: 'Cold Coffee', price: 180 },
  { id: 'water', name: 'Mineral Water', price: 40 },
];

export default function FoodMenuPage() {
  const router = useRouter();
  const { appUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'snacks' | 'drinks'>('snacks');
  const [cart, setCart] = useState<Record<string, FoodItem>>({});

  const items = activeTab === 'snacks' ? SNACKS : DRINKS;

  const handleAdd = (item: { id: string; name: string; price: number }) => {
    setCart((prev) => {
      const current = prev[item.id] || { ...item, quantity: 0 };
      return {
        ...prev,
        [item.id]: { ...current, quantity: current.quantity + 1 },
      };
    });
  };

  const handleRemove = (id: string) => {
    setCart((prev) => {
      const current = prev[id];
      if (!current) return prev;
      
      const newCart = { ...prev };
      if (current.quantity <= 1) {
        delete newCart[id];
      } else {
        newCart[id] = { ...current, quantity: current.quantity - 1 };
      }
      return newCart;
    });
  };

  const cartItems = Object.values(cart);
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (totalItems > 0) {
      // Store cart in sessionStorage for the checkout page
      sessionStorage.setItem('foodCart', JSON.stringify(cartItems));
      sessionStorage.setItem('foodTotal', totalAmount.toString());
      router.push('/food/checkout');
    }
  };

  return (
    <div className="min-h-dvh bg-[#F5F5F5] pb-32">
      {/* Header */}
      <div className="bg-[#F5F5F5] px-6 pt-12 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} className="text-[#1a1a1a]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Order Food</h1>
            <p className="text-[11px] text-gray-500 font-medium">ArcadeZone</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-6 pt-2 pb-2 gap-4 sticky top-[88px] bg-[#F5F5F5] z-10 mb-2">
        <button
          onClick={() => setActiveTab('snacks')}
          className={`flex-1 pb-3 text-sm font-bold transition-colors border-b-2 ${
            activeTab === 'snacks'
              ? 'text-gray-900 border-gray-900'
              : 'text-gray-400 border-transparent'
          }`}
        >
          🍔 Snacks
        </button>
        <button
          onClick={() => setActiveTab('drinks')}
          className={`flex-1 pb-3 text-sm font-bold transition-colors border-b-2 ${
            activeTab === 'drinks'
              ? 'text-gray-900 border-gray-900'
              : 'text-gray-400 border-transparent'
          }`}
        >
          🥤 Drinks
        </button>
      </div>

      {/* Menu List */}
      <div className="px-6 space-y-3">
        {items.map((item) => {
          const quantity = cart[item.id]?.quantity || 0;
          return (
            <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-white shadow-sm">
              <div>
                <p className="font-bold text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-600 font-semibold mt-0.5">₹{item.price}</p>
              </div>
              <div className="flex items-center gap-3 bg-[#F5F5F5] rounded-full p-1 shadow-inner">
                <button
                  onClick={() => handleRemove(item.id)}
                  disabled={quantity === 0}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-gray-900 shadow-sm disabled:opacity-30 disabled:bg-transparent disabled:shadow-none"
                >
                  <Minus size={14} />
                </button>
                <span className="w-4 text-center font-bold text-sm text-gray-900">{quantity}</span>
                <button
                  onClick={() => handleAdd(item)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-[#111111] text-white shadow-sm"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkout Bottom Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-[104px] left-0 right-0 px-6 z-10 animate-slide-up pointer-events-none">
          <button onClick={handleCheckout} className="btn-green flex items-center justify-between px-6 pointer-events-auto shadow-lg shadow-black/10 w-full">
            <div className="flex flex-col items-start">
              <span className="text-xs opacity-90 font-medium">{totalItems} Item{totalItems > 1 ? 's' : ''}</span>
              <span className="font-bold text-base">₹{totalAmount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">VIEW CART</span>
              <ShoppingBag size={18} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
