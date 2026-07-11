'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import DateStrip from '@/components/date-strip';
import TimeSlider from '@/components/time-slider';
import { useBookingStore } from '@/lib/store';
import { getCategoryLabel } from '@/lib/utils';
import { getAssetsByCategory, subscribeToBookings, type Asset, type Booking } from '@/lib/firestore';

export default function BookingPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  const router = useRouter();
  const store = useBookingStore();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedDate = new Date(store.selectedDate + 'T00:00:00');

  // Set category on mount
  useEffect(() => {
    store.setCategory(category);
  }, [category]);

  // Fetch assets for this category
  useEffect(() => {
    async function fetchAssets() {
      try {
        const fetchedAssets = await getAssetsByCategory(category);
        setAssets(fetchedAssets);
      } catch (error) {
        console.error('Error fetching assets:', error);
      }
      setLoading(false);
    }
    fetchAssets();
  }, [category]);

  // Auto-select the only available asset for the category
  useEffect(() => {
    if (assets.length > 0) {
      store.setAsset(assets[0].id, assets[0].name, assets[0].price);
    }
  }, [assets]);

  // Subscribe to real-time booking updates
  useEffect(() => {
    const unsubscribe = subscribeToBookings(store.selectedDate, category, (updatedBookings) => {
      setBookings(updatedBookings);
    });
    return () => unsubscribe();
  }, [store.selectedDate, category]);

  const activeBookings = bookings.filter((b) => ['pending', 'approved', 'confirmed'].includes(b.status));

  const isAssetBooked = (assetId: string) => {
    return activeBookings.some(
      (b) =>
        b.assetId === assetId &&
        b.startTime < store.endTime &&
        b.endTime > store.startTime
    );
  };

  // Since there is only 1 asset per category, any active booking blocks those hours
  const bookedHours = Array.from(new Set(
    activeBookings.flatMap((b) => {
      const hours = [];
      for (let h = b.startTime; h < b.endTime; h++) hours.push(h);
      return hours;
    })
  ));

  const handleDateSelect = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    store.setDate(dateStr);
  };

  const hasTimeConflict = () => {
    for (let h = store.startTime; h < store.endTime; h++) {
      if (bookedHours.includes(h)) return true;
    }
    return false;
  };

  const handleProceed = () => {
    if (store.selectedAssetId) {
      router.push(`/book/${category}/checkout`);
    }
  };

  const categoryLabel = getCategoryLabel(category);

  return (
    <div className="min-h-dvh bg-[#0A0A0B] text-on-surface font-body-md selection:bg-primary/30">
      
      {/* Header */}
      <header className="glass-panel sticky top-0 w-full z-50 flex items-center justify-between px-gutter py-md border-b border-outline-variant/20 shadow-sm bg-surface/10 backdrop-blur-xl">
        <button
          onClick={() => router.back()}
          className="text-on-surface-variant hover:text-primary transition-colors active:scale-95 duration-200"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h1 className="font-display-md text-[20px] font-bold text-on-surface tracking-tighter uppercase text-center flex-1">
          {categoryLabel}
        </h1>
        <button className="text-on-surface-variant hover:text-primary transition-colors active:scale-95 duration-200">
          <span className="material-symbols-outlined text-[24px]">more_vert</span>
        </button>
      </header>

      {/* Select Slots title */}
      <div className="px-5 pt-6 pb-2">
        <h2 className="font-headline-lg text-[28px] font-bold text-on-surface header-glow">Select Slots</h2>
        <p className="font-body-md text-[14px] text-on-surface-variant">Reserve your play time.</p>
      </div>

      {/* Venue Info */}
      <div className="mx-5 mb-6 mt-2">
        <div className="glass-panel border border-primary/20 rounded-xl p-4 flex items-start justify-between gap-3 bg-primary/5">
          <div>
            <p className="text-[14px] font-bold text-primary">Jaaduwrld Art and Arcade</p>
            <p className="text-[12px] text-on-surface-variant mt-1 leading-snug">
              325, Jai Nagar Rd, near Indore Sweet, Labour Chowk, Yadav Colony, Jabalpur, New Adaresh Colony, Madhya Pradesh 482002
            </p>
          </div>
          <a
            href="https://maps.google.com/?q=325+Jai+Nagar+Rd+Jabalpur+Madhya+Pradesh+482002"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 flex items-center justify-center p-3 bg-secondary/10 text-secondary border border-secondary/30 rounded-full hover:bg-secondary/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">location_on</span>
          </a>
        </div>
      </div>

      {/* Date Selector */}
      <div className="px-5 mb-6">
        <DateStrip
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />
      </div>

      {/* Time Selector */}
      <div className="px-5 mb-8">
        <TimeSlider
          startTime={store.startTime}
          endTime={store.endTime}
          bookedHours={bookedHours}
          onTimeChange={(start, end) => store.setTimeRange(start, end)}
        />
      </div>

      {/* Proceed Button */}
      {store.selectedAssetId && (
        <div className="fixed bottom-[var(--bottom-nav-height)] left-0 right-0 p-4 glass-panel border-t border-white/10 animate-slide-up z-40 bg-[#0A0A0B]/80 backdrop-blur-2xl">
          <button 
            onClick={handleProceed} 
            disabled={hasTimeConflict()}
            className={`w-full py-4 rounded-xl font-bold text-[14px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 ${
              hasTimeConflict() 
                ? 'bg-surface-variant text-on-surface-variant border border-white/5 opacity-50' 
                : 'btn-gradient neon-glow-primary text-background'
            }`}
          >
            {hasTimeConflict() ? 'SLOT UNAVAILABLE' : 'PROCEED TO CHECKOUT'}
            {!hasTimeConflict() && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
          </button>
        </div>
      )}
    </div>
  );
}
