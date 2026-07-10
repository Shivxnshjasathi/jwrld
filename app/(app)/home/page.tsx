'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { MessageCircle, CircleDashed, Target, Gamepad2, Utensils, Minus, Plus, X, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import { useBookingStore } from '@/lib/store';
import { getAssetsByCategory, subscribeToBookings, subscribeToAnnouncement, type Asset, type Booking, type Announcement } from '@/lib/firestore';
import SliderTrack from '@/components/slider-track';

const TABS = [
  { id: 'pool', label: 'Pool', icon: CircleDashed },
  { id: 'snooker', label: 'Snooker', icon: Target },
  { id: 'ps5', label: 'PS5', icon: Gamepad2 },
  { id: 'food', label: 'Food', icon: Utensils },
];

const HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export default function HomePage() {
  const { appUser } = useAuth();
  const router = useRouter();
  const userName = appUser?.name || 'Player';

  const [activeTab, setActiveTab] = useState('pool');
  const store = useBookingStore();

  // -- Booking State --
  const [assets, setAssets] = useState<Asset[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // -- Announcement --
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAnnouncement((data) => {
      setAnnouncement(data);
      setBannerDismissed(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (activeTab !== 'food') {
      store.setCategory(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'food') return;
    async function fetchAssets() {
      try {
        const fetchedAssets = await getAssetsByCategory(activeTab);
        setAssets(fetchedAssets);
      } catch (error) {
        console.error('Error fetching assets:', error);
      }
    }
    fetchAssets();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'food' && assets.length > 0) {
      store.setAsset(assets[0].id, assets[0].name, assets[0].price);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, activeTab]);

  useEffect(() => {
    if (activeTab === 'food') return;
    const unsubscribe = subscribeToBookings(store.selectedDate, activeTab, (updatedBookings) => {
      setBookings(updatedBookings);
    });
    return () => unsubscribe();
  }, [store.selectedDate, activeTab]);

  const activeBookings = bookings.filter((b) => ['pending', 'approved', 'confirmed'].includes(b.status));

  const bookedHours = Array.from(new Set(
    activeBookings.flatMap((b) => {
      const hours = [];
      for (let h = b.startTime; h < b.endTime; h++) hours.push(h);
      return hours;
    })
  ));

  const hasTimeConflict = () => {
    for (let h = store.startTime; h < store.endTime; h++) {
      if (bookedHours.includes(h)) return true;
    }
    return false;
  };

  const handleProceed = () => {
    if (store.selectedAssetId) {
      router.push(`/book/${activeTab}/checkout`);
    }
  };

  return (
    <div className="min-h-dvh bg-[#F5F5F5] pb-32">
      {/* Announcement Banner */}
      {announcement?.active && announcement.text && !bannerDismissed && (
        <div className="mx-4 mt-3 bg-[#111111] text-white rounded-2xl px-4 py-3 flex items-center gap-3 animate-slide-up shadow-lg">
          <Megaphone size={18} className="text-amber-400 shrink-0" />
          <p className="text-xs font-semibold flex-1">{announcement.text}</p>
          <button onClick={() => setBannerDismissed(true)} className="shrink-0 p-1">
            <X size={14} className="text-white/60" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="pt-12 px-6 flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center">
            {appUser?.photoURL ? (
              <img src={appUser.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl">😎</span>
            )}
          </div>
          <div>
            <p className="text-[13px] text-gray-500 font-medium">Hello 👋</p>
            <h1 className="text-[17px] font-bold text-gray-900 leading-tight">{userName}</h1>
          </div>
        </div>
        <button
          onClick={() => router.push('/messages')}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm relative text-gray-800"
        >
          <MessageCircle size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 rounded-full border border-white"></span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex justify-between px-8 mb-8">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <div key={tab.id} className="flex flex-col items-center gap-2">
              <button
                onClick={() => setActiveTab(tab.id)}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 border ${isActive ? 'bg-[#111111] text-white border-transparent' : 'bg-white text-[#111111] border-gray-100 hover:bg-gray-50'
                  }`}
              >
                <Icon size={24} strokeWidth={isActive ? 2 : 1.5} />
              </button>
              <span className={`text-[12px] transition-colors ${isActive ? 'font-bold text-[#1a1a1a]' : 'font-medium text-[#b0b0b0]'}`}>
                {tab.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="px-6">
        <div className="bg-white rounded-[2rem] p-5 shadow-sm">
          {activeTab === 'food' ? (
            <div className="text-center py-10">
              <Utensils size={40} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Feeling Hungry?</h3>
              <p className="text-sm text-gray-500 mb-6">Order snacks and drinks straight to your table.</p>
              <button
                onClick={() => router.push('/food')}
                className="bg-[#111111] text-white rounded-full py-4 px-8 font-bold text-sm w-full shadow-md"
              >
                View Menu
              </button>
            </div>
          ) : (
            <>
              {/* Where input */}
              <div className="bg-[#F5F5F5] rounded-full px-5 py-4 mb-5 flex items-center">
                <span className="text-sm font-medium text-gray-500">Jaaduwrld Art &amp; Arcade</span>
              </div>

              {/* Date Slider */}
              <div className="mb-5 flex gap-3 overflow-x-auto no-scrollbar snap-x pb-2 pt-1">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() + i);
                  const dateStr = format(d, 'yyyy-MM-dd');
                  const isSelected = store.selectedDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      onClick={() => store.setDate(dateStr)}
                      className={`flex flex-col items-center justify-center min-w-[72px] h-[84px] rounded-[1.25rem] snap-start transition-all ${isSelected
                          ? 'bg-[#111111] text-white shadow-md'
                          : 'bg-[#F5F5F5] text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                      <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                        {format(d, 'MMM')}
                      </span>
                      <span className={`text-[20px] font-black leading-none mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {format(d, 'dd')}
                      </span>
                      <span className={`text-[10px] font-semibold ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                        {format(d, 'EEE')}
                      </span>
                    </button>
                  );
                })}
              </div>



              {/* Time Range Slider */}
              <div className="mb-6 mt-2">
                <div className="flex items-center justify-between mb-8 px-1">
                  <div>
                    <h3 className="text-[12px] font-extrabold text-gray-900 tracking-wider mb-1 uppercase">TIME</h3>
                    <p className="text-[13px] text-gray-500 font-medium">
                      {format(new Date().setHours(store.startTime, 0), 'h:mm a')} - {format(new Date().setHours(store.endTime, 0), 'h:mm a')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-full px-2 py-1.5 shadow-sm border border-gray-100">
                    <button
                      onClick={() => store.setTimeRange(store.startTime, store.endTime - 1)}
                      disabled={store.endTime - store.startTime <= 1}
                      className="w-7 h-7 rounded-full flex items-center justify-center border border-gray-200 text-gray-500 disabled:opacity-30 disabled:bg-gray-50 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-[12px] font-bold text-gray-900 w-12 text-center">
                      {(store.endTime - store.startTime) * 60} Mins
                    </span>
                    <button
                      onClick={() => {
                        const maxDuration = 4;
                        if (store.endTime - store.startTime < maxDuration && store.endTime < 21) {
                          store.setTimeRange(store.startTime, store.endTime + 1);
                        }
                      }}
                      disabled={store.endTime - store.startTime >= 4 || store.endTime >= 21}
                      className="w-7 h-7 rounded-full flex items-center justify-center border border-gray-200 text-gray-500 disabled:opacity-30 disabled:bg-gray-50 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <SliderTrack
                  startTime={store.startTime}
                  endTime={store.endTime}
                  bookedHours={bookedHours}
                  onRangeChange={(start, end) => store.setTimeRange(start, end)}
                />
              </div>

              {/* Search / Proceed Button */}
              <button
                onClick={handleProceed}
                disabled={hasTimeConflict() || !store.selectedAssetId}
                className={`w-full py-4 rounded-full font-bold text-sm transition-all shadow-md ${hasTimeConflict()
                    ? 'bg-gray-200 text-gray-500'
                    : 'bg-[#111111] text-white hover:bg-black'
                  }`}
              >
                {hasTimeConflict() ? 'Slot Unavailable' : 'Search'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
