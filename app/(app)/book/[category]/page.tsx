'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import DateStrip from '@/components/date-strip';
import TimeSlider from '@/components/time-slider';
import AssetCard from '@/components/asset-card';
import { useBookingStore } from '@/lib/store';
import { getCategoryLabel, getCategoryIcon } from '@/lib/utils';
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
  const categoryEmoji = getCategoryIcon(category);

  return (
    <div className="min-h-dvh bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-arcade-border">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={22} className="text-arcade-text" />
        </button>
        <h1 className="text-sm font-bold text-arcade-text tracking-wider uppercase flex-1 truncate">
          ARCADEZONE
        </h1>
        <span className="px-3 py-1.5 rounded-full border border-arcade-border text-xs font-semibold text-arcade-text">
          {categoryLabel}
        </span>
      </div>

      {/* Select Slots title */}
      <div className="px-5 pt-5 pb-2">
        <h2 className="text-2xl font-bold text-arcade-text">Select Slots</h2>
      </div>

      {/* Venue Info */}
      <div className="mx-5 mb-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-arcade-text">Jaaduwrld Art and Arcade</p>
              <p className="text-[10px] text-arcade-text-muted mt-1 leading-snug">
                325, Jai Nagar Rd, near Indore Sweet, Labour Chowk, Yadav Colony, Jabalpur, New Adaresh Colony, Madhya Pradesh 482002
              </p>
            </div>
            <a
              href="https://maps.google.com/?q=325+Jai+Nagar+Rd+Jabalpur+Madhya+Pradesh+482002"
              target="_blank"
              rel="noreferrer"
              className="shrink-0 flex items-center justify-center p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <MapPin size={16} />
            </a>
          </div>
        </div>
      </div>

      {/* Date Selector */}
      <div className="px-5 mb-5">
        <DateStrip
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />
      </div>

      {/* Time Selector */}
      <div className="px-5 mb-6">
        <TimeSlider
          startTime={store.startTime}
          endTime={store.endTime}
          bookedHours={bookedHours}
          onTimeChange={(start, end) => store.setTimeRange(start, end)}
        />
      </div>

      {/* (Removed asset selection grid since there's only 1 asset auto-selected) */}

      {/* Proceed Button */}
      {store.selectedAssetId && (
        <div className="fixed bottom-[var(--bottom-nav-height)] left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-arcade-border animate-slide-up">
          <button 
            onClick={handleProceed} 
            className="btn-green"
            disabled={hasTimeConflict()}
          >
            {hasTimeConflict() ? 'SLOT ALREADY BOOKED' : 'PROCEED TO CHECKOUT'}
          </button>
        </div>
      )}
    </div>
  );
}
