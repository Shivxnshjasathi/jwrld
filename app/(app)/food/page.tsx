'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import type { FoodItem } from '@/lib/firestore';

const SNACKS = [
  { id: 'fries', name: 'French Fries', price: 150, desc: 'Crispy golden fries with our secret seasoning.', image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&q=80&w=600' },
  { id: 'nachos', name: 'Loaded Nachos', price: 200, desc: 'Tortilla chips loaded with cheese and jalapenos.', image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&q=80&w=600' },
  { id: 'burger', name: 'Wagyu Bytes', price: 250, desc: 'Premium wagyu slider with black truffle aioli.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAab6cbW54Zx1n7-moUVohFUkV-6SEpmkkGDOZkshAo-rV5G0xiersXIzV_9ga7Tmt8g-0JiBfud_nhpy91CRUBASCyt0ZGSbpBiHLc1JonR9lP_4qXmX6e43tYgxfNXUekuAspqUd2qMTMqFiymj-hqf3uyXVyjTa2ROraoUDUpSY4gWBHpexz7SGmz-G8oBsKpL7sO0FAUCrK4JcndxKRxAE_jdy-X6P9rTtxffSPHyioU5HJHYQQkymswmKFBCEnQDrBeTjX715z' },
  { id: 'pizza', name: 'Pixel Margherita', price: 300, desc: 'San Marzano base, fior di latte on charcoal crust.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC93chL3YhTJgAsp-9u4AbRsK3X-R8o-gy48npuFsR9PpED604u-rdVqr2Kg9QsrQd7WND4UzoJx2YksrYaI7DW8XospNqdGj7qneaZss6cT5VBI0HHZK0OnXK3eDasfYOxsbds7RSOzJOKlzpCSeW4pYuOGkC2BJKvzXNK_W6bixoi6KgCkswORL4o7UggQNyHYgZD_RdfmssvfHc3Y9iqb4-StE9UCQs80iap-jFRImJPzc9b8rZo2XmPxo4r2rYB5SdZxWgaBJQS' },
];

const DRINKS = [
  { id: 'mocktail', name: 'Neon Nectar', price: 180, desc: 'Blue curacao essence, yuzu, sparkling tonic.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcUsMJi23y5PFT4g8MBPkayZMkeae3oHq8BH81kGvpwKLg686f8tPvksnrMUtm3gHJjyGdtFuyIz9slr5uaDvdrdmYDnWUYp1t6bM3PFfU81f9jiBRVcsS3V4XByezmir7xDk0C7EyoSBgrDkTz6qWvy3STwPafboRRsNfcuhJ10gTTipVPdJPucoBN1P8RCb5qdqDYlRt9JwTWLaUgXzyrrlknU5dmt4mkJo3VmXeUpJQzxNmBITN6mhfVjTj_2ZPgaZ0uN0N4u9_' },
  { id: 'coke', name: 'Coca Cola', price: 60, desc: 'Classic chilled cola.', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600' },
  { id: 'redbull', name: 'Red Bull', price: 150, desc: 'Energy drink to keep you gaming.', image: 'https://images.unsplash.com/photo-1543363136-3fde621c7d24?auto=format&fit=crop&q=80&w=600' },
  { id: 'coldcoffee', name: 'Cold Coffee', price: 180, desc: 'Iced coffee blended with cream.', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=600' },
];

export default function FoodMenuPage() {
  const router = useRouter();
  const { appUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'snacks' | 'drinks'>('all');
  const [cart, setCart] = useState<Record<string, FoodItem>>({});

  const items = activeTab === 'all' ? [...SNACKS, ...DRINKS] : activeTab === 'snacks' ? SNACKS : DRINKS;

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
      sessionStorage.setItem('foodCart', JSON.stringify(cartItems));
      sessionStorage.setItem('foodTotal', totalAmount.toString());
      router.push('/food/checkout');
    }
  };

  return (
    <div className="bg-[#0A0A0B] text-on-surface min-h-screen font-body-md selection:bg-primary/30 pb-32">
      
      {/* TopAppBar */}
      <header className="fixed top-0 w-full bg-surface/10 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm flex justify-between items-center px-gutter py-md z-50 max-w-container-max mx-auto">
        <div className="flex items-center gap-sm cursor-pointer" onClick={() => router.push('/home')}>
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-surface-container flex items-center justify-center">
            {appUser?.photoURL ? (
              <img src={appUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-on-surface-variant">person</span>
            )}
          </div>
        </div>
        <h1 className="font-display-md text-[24px] font-bold tracking-tighter text-on-surface cursor-pointer header-glow" onClick={() => router.push('/home')}>
          Jaaduwrld
        </h1>
        <button className="text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      <main className="pt-[100px] px-gutter max-w-container-max mx-auto md:px-xl">
        
        {/* Categories */}
        <section className="mb-lg overflow-x-auto no-scrollbar py-sm">
          <div className="flex gap-md min-w-max">
            <button 
              onClick={() => setActiveTab('all')}
              className={`glass-panel px-lg py-sm rounded-full font-label-md text-[14px] font-bold transition-all ${
                activeTab === 'all' 
                ? 'text-primary border-primary/50 shadow-[0_0_10px_rgba(221,183,255,0.2)]' 
                : 'text-on-surface-variant hover:text-white border-transparent'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setActiveTab('snacks')}
              className={`glass-panel px-lg py-sm rounded-full font-label-md text-[14px] font-bold transition-all ${
                activeTab === 'snacks' 
                ? 'text-primary border-primary/50 shadow-[0_0_10px_rgba(221,183,255,0.2)]' 
                : 'text-on-surface-variant hover:text-white border-transparent'
              }`}
            >
              Snacks & Food
            </button>
            <button 
              onClick={() => setActiveTab('drinks')}
              className={`glass-panel px-lg py-sm rounded-full font-label-md text-[14px] font-bold transition-all ${
                activeTab === 'drinks' 
                ? 'text-primary border-primary/50 shadow-[0_0_10px_rgba(221,183,255,0.2)]' 
                : 'text-on-surface-variant hover:text-white border-transparent'
              }`}
            >
              Drinks & Mixes
            </button>
          </div>
        </section>

        <div className="mb-lg">
          <h2 className="font-headline-lg text-[32px] font-bold text-on-surface mb-xs">Curated Menu</h2>
          <p className="font-body-md text-[16px] text-on-surface-variant">Elevate your arcade experience.</p>
        </div>

        {/* Food Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {items.map((item) => {
            const quantity = cart[item.id]?.quantity || 0;
            return (
              <article key={item.id} className="glass-card rounded-xl overflow-hidden flex flex-col group relative">
                <div className="h-48 w-full relative overflow-hidden bg-surface-container-high">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] to-transparent"></div>
                  <div className="absolute top-sm right-sm bg-black/50 backdrop-blur-md px-sm py-xs rounded-full border border-white/10">
                    <span className="font-label-sm text-[12px] font-bold text-primary">₹{item.price}</span>
                  </div>
                </div>
                <div className="p-md flex-1 flex flex-col justify-between z-10 relative -mt-4 bg-gradient-to-b from-transparent to-[#0A0A0B]">
                  <div>
                    <h3 className="font-headline-md text-[20px] font-bold text-on-surface mb-xs">{item.name}</h3>
                    <p className="font-body-md text-[14px] text-on-surface-variant line-clamp-2 mb-md">{item.desc}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center bg-surface-container/50 rounded-full border border-white/10 p-xs ml-auto">
                      <button 
                        onClick={() => handleRemove(item.id)}
                        disabled={quantity === 0}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors hover:bg-white/5 disabled:opacity-30"
                      >
                        <span className="material-symbols-outlined text-[18px]">remove</span>
                      </button>
                      <span className="font-label-md text-[14px] font-bold text-on-surface w-8 text-center">{quantity}</span>
                      <button 
                        onClick={() => handleAdd(item)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors hover:bg-white/5"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </main>

      {/* Floating Action Button (View Cart) */}
      {totalItems > 0 && (
        <div className="fixed bottom-[100px] right-md md:right-xl z-40 animate-slide-up">
          <button 
            onClick={handleCheckout}
            className="btn-gradient rounded-full h-16 px-6 flex items-center justify-center gap-sm neon-glow-primary text-black font-label-md text-[14px] font-bold transition-all hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            <span>Checkout (₹{totalAmount})</span>
            <div className="bg-black/20 text-black w-6 h-6 rounded-full flex items-center justify-center ml-sm font-label-sm text-[12px] font-bold">
              {totalItems}
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
