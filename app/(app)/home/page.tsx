'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';
import { useBookingStore } from '@/lib/store';
import { getAssetsByCategory, subscribeToBookings, subscribeToAnnouncement, type Asset, type Booking, type Announcement } from '@/lib/firestore';
import SliderTrack from '@/components/slider-track';
import { toast } from 'react-hot-toast';

const TABS = [
  { id: 'pool', label: '8-Ball Pool', icon: 'sports_baseball' },
  { id: 'snooker', label: 'Snooker', icon: 'sports_esports' },
  { id: 'ps5', label: 'PS5', icon: 'videogame_asset' },
  { id: 'food', label: 'Food', icon: 'restaurant' },
];

export default function HomePage() {
  const { user, appUser } = useAuth();
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

  const userBookedHours = Array.from(new Set(
    activeBookings
      .filter(b => b.userId === user?.uid)
      .flatMap((b) => {
        const hours = [];
        for (let h = b.startTime; h < b.endTime; h++) hours.push(h);
        return hours;
      })
  ));

  const hasUserConflict = () => {
    for (let h = store.startTime; h < store.endTime; h++) {
      if (userBookedHours.includes(h)) return true;
    }
    return false;
  };

  const isPastTime = () => {
    const now = new Date();
    const [year, month, day] = store.selectedDate.split('-').map(Number);
    const selectedDateObj = new Date(year, month - 1, day);
    
    // If selected date is in the past, return true
    if (selectedDateObj.setHours(0,0,0,0) < new Date().setHours(0,0,0,0)) return true;
    
    // If selected date is today, check if start time is <= current hour
    if (selectedDateObj.getTime() === new Date().setHours(0,0,0,0)) {
      if (store.startTime <= now.getHours()) return true;
    }
    
    return false;
  };

  const pastHours = useMemo(() => {
    const hours: number[] = [];
    const now = new Date();
    const [year, month, day] = store.selectedDate.split('-').map(Number);
    const selectedDateObj = new Date(year, month - 1, day);
    
    if (selectedDateObj.setHours(0,0,0,0) < new Date().setHours(0,0,0,0)) {
      for (let h = 10; h <= 24; h++) hours.push(h);
    } else if (selectedDateObj.getTime() === new Date().setHours(0,0,0,0)) {
      for (let h = 10; h <= now.getHours(); h++) hours.push(h);
    }
    return hours;
  }, [store.selectedDate]);

  useEffect(() => {
    if (activeTab === 'food') return;
    
    // Auto-select first available slot if current slot has conflict or is in the past
    let currentHasConflict = false;
    for (let h = store.startTime; h < store.endTime; h++) {
      if (bookedHours.includes(h) || pastHours.includes(h)) {
        currentHasConflict = true;
        break;
      }
    }

    if (currentHasConflict) {
      for (let h = 10; h < 21; h++) {
        if (!bookedHours.includes(h) && !pastHours.includes(h)) {
          store.setTimeRange(h, h + 1);
          break;
        }
      }
    }
  }, [store.selectedDate, activeTab, bookedHours, pastHours, store.startTime, store.endTime]);

  const [waitlisting, setWaitlisting] = useState(false);

  const handleWaitlist = async () => {
    if (!user || !appUser) return;
    setWaitlisting(true);
    try {
      const { joinWaitlist } = await import('@/lib/firestore');
      await joinWaitlist({
        userId: user.uid,
        userName: appUser.name,
        category: activeTab,
        date: store.selectedDate,
        startTime: store.startTime,
        endTime: store.endTime,
      });
      toast.success('Successfully joined the waitlist for this slot!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join waitlist');
    }
    setWaitlisting(false);
  };

  const handleProceed = () => {
    if (store.selectedAssetId) {
      router.push(`/book/${activeTab}/checkout`);
    }
  };

  const displayDate = useMemo(() => {
    const [year, month, day] = store.selectedDate.split('-').map(Number);
    return new Date(year, month - 1, day);
  }, [store.selectedDate]);

  return (
    <div className="min-h-dvh font-body-md text-body-md relative overflow-x-hidden">
      {/* Shader Background Placeholder (assuming animation exists or just gradient fallback) */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.15)_0%,rgba(5,5,5,1)_70%)] pointer-events-none mix-blend-screen opacity-60"></div>
      
      {/* TopAppBar */}
      <header className="fixed top-0 w-full flex justify-between items-center px-gutter py-md z-40 bg-black/30 backdrop-blur-2xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-sm cursor-pointer hover:opacity-80 transition-opacity active:scale-95 duration-200">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/40 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
            {appUser?.photoURL ? (
              <img src={appUser.photoURL} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-container flex items-center justify-center text-primary font-bold">{userName.charAt(0)}</div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="font-display-md text-[24px] tracking-tighter text-on-surface header-glow font-bold leading-none">
            Jaaduwrld
          </div>
          <div className="text-[9px] font-bold tracking-[0.2em] text-primary uppercase mt-1">Art and Arcade</div>
        </div>
        <button 
          onClick={() => router.push('/messages')}
          className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-secondary hover:bg-white/10 transition-colors active:scale-95 duration-200 shadow-[0_0_15px_rgba(45,212,191,0.2)] relative"
        >
          <span className="material-symbols-outlined neon-text-secondary">chat</span>
          {/* Notification dot */}
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(168,85,247,1)]"></span>
        </button>
      </header>

      <main className="pt-[100px] px-gutter md:px-xl max-w-container-max mx-auto relative z-10 pb-[120px]">
        {/* Announcement Banner */}
        {announcement?.active && announcement.text && !bannerDismissed && (
          <div className="mb-lg bg-surface-variant/40 border border-secondary/30 backdrop-blur-md rounded-xl p-md flex items-center gap-md animate-slide-up-fade shadow-[0_0_15px_rgba(45,212,191,0.1)]">
            <span className="material-symbols-outlined text-secondary neon-text-secondary text-[24px]">campaign</span>
            <p className="text-sm font-medium text-white flex-1">{announcement.text}</p>
            <button onClick={() => setBannerDismissed(true)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <span className="material-symbols-outlined text-white/60 text-[20px]">close</span>
            </button>
          </div>
        )}

        {/* Category Tabs */}
        <section className="mb-xl animate-slide-up-fade">
          <h2 className="font-headline-md text-[24px] mb-md text-white font-semibold">Experiences</h2>
          <div className="flex gap-md overflow-x-auto no-scrollbar pb-sm px-1">
            {TABS.map((tab, i) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center gap-sm glass-card p-md rounded-xl w-[100px] transition-all duration-300 ${
                    isActive 
                      ? 'border-primary/60 shadow-[0_0_20px_rgba(168,85,247,0.35)]'
                      : `opacity-60 hover:opacity-100 hover:-translate-y-1`
                  }`}
                >
                  <span 
                    className={`material-symbols-outlined text-[32px] ${isActive ? 'text-primary neon-text-primary' : 'text-on-surface-variant'}`}
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {tab.icon}
                  </span>
                  <span className={`font-label-md text-[14px] font-bold ${isActive ? 'text-primary neon-text-primary' : 'text-on-surface-variant'}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {activeTab === 'food' ? (
          <section className="animate-slide-up-fade delay-100 opacity-0 text-center py-xl glass-card rounded-2xl border-white/10">
            <span className="material-symbols-outlined text-[64px] text-secondary neon-text-secondary mb-md">restaurant</span>
            <h3 className="text-[24px] font-bold text-white header-glow mb-sm">Feeling Hungry?</h3>
            <p className="text-on-surface-variant text-[16px] mb-lg px-lg">Order snacks and drinks straight to your table.</p>
            <button
              onClick={() => router.push('/food')}
              className="px-xl py-md rounded-full shimmer-btn animate-shimmer text-black font-bold text-[16px] fab-glow transition-transform hover:scale-105 active:scale-95"
            >
              View Menu
            </button>
          </section>
        ) : (
          <>
            {/* Date Picker */}
            <section className="mb-xl">
              <div className="flex justify-between items-end mb-md animate-slide-up-fade delay-100 opacity-0">
                <h2 className="font-headline-md text-[24px] text-white font-semibold">Select Date</h2>
                <span className="font-label-sm text-[12px] font-bold text-secondary uppercase tracking-widest neon-text-secondary">
                  {format(displayDate, 'MMM yyyy')}
                </span>
              </div>
              <div className="flex gap-sm overflow-x-auto no-scrollbar pb-sm px-1">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() + i);
                  const dateStr = format(d, 'yyyy-MM-dd');
                  const isSelected = store.selectedDate === dateStr;
                  const delayClass = `delay-${Math.min((i+2)*100, 400)}`;

                  return (
                    <div
                      key={dateStr}
                      onClick={() => store.setDate(dateStr)}
                      className={`flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-[90px] rounded-xl cursor-pointer animate-slide-up-fade opacity-0 transition-transform ${delayClass} ${
                        isSelected 
                          ? 'gradient-bg-primary text-black transform hover:scale-105'
                          : 'glass-card text-on-surface-variant hover:border-secondary/40 hover:text-white'
                      }`}
                    >
                      <span className={`font-label-sm text-[12px] mb-xs ${isSelected ? 'opacity-90 font-bold' : ''}`}>
                        {format(d, 'EEE').toUpperCase()}
                      </span>
                      <span className={`font-headline-md text-[24px] ${isSelected ? 'font-bold' : ''}`}>
                        {format(d, 'dd')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Time Range Slider */}
            <section className="mb-xxl opacity-0 animate-slide-up-fade delay-400">
              <h2 className="font-headline-md text-[24px] mb-lg text-white font-semibold">Duration</h2>
              <div className="glass-card pt-lg pb-md rounded-xl relative border border-white/10">
                <div className="flex justify-between items-center mb-lg px-md">
                  <div className="text-center">
                    <span className="block font-label-sm text-[12px] font-bold text-on-surface-variant mb-xs uppercase tracking-wider">Start</span>
                    <span className="font-headline-md text-[24px] font-bold text-white header-glow">
                      {format(new Date().setHours(store.startTime, 0), 'HH:mm')}
                    </span>
                  </div>
                  <div className="flex-1 flex justify-center items-center px-md">
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-secondary/40 to-transparent"></div>
                    <div className="flex items-center gap-2 mx-sm">
                      <button 
                        onClick={() => store.endTime - store.startTime > 1 && store.setTimeRange(store.startTime, store.endTime - 1)}
                        disabled={store.endTime - store.startTime <= 1}
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 active:scale-95 text-secondary border border-white/10 disabled:opacity-30 transition-all"
                      >
                        <span className="material-symbols-outlined text-[14px]">remove</span>
                      </button>
                      <span className="font-label-sm text-[12px] font-bold text-secondary px-sm py-xs glass-panel rounded-full neon-text-secondary whitespace-nowrap border-secondary/20 min-w-[70px] text-center">
                        {store.endTime - store.startTime} {store.endTime - store.startTime === 1 ? 'Hour' : 'Hours'}
                      </span>
                      <button 
                        onClick={() => store.endTime < 21 && store.setTimeRange(store.startTime, store.endTime + 1)}
                        disabled={store.endTime >= 21}
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 active:scale-95 text-secondary border border-white/10 disabled:opacity-30 transition-all"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                      </button>
                    </div>
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-secondary/40 to-transparent"></div>
                  </div>
                  <div className="text-center">
                    <span className="block font-label-sm text-[12px] font-bold text-on-surface-variant mb-xs uppercase tracking-wider">End</span>
                    <span className="font-headline-md text-[24px] font-bold text-white header-glow">
                      {format(new Date().setHours(store.endTime, 0), 'HH:mm')}
                    </span>
                  </div>
                </div>
                
                <SliderTrack
                  startTime={store.startTime}
                  endTime={store.endTime}
                  bookedHours={bookedHours}
                  pastHours={pastHours}
                  onRangeChange={(start, end) => store.setTimeRange(start, end)}
                />
              </div>
            </section>
          </>
        )}
      </main>

      {/* Contextual FAB / Main CTA */}
      {activeTab !== 'food' && (
        <div className="fixed bottom-[88px] left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-[400px] z-30">
          <button
            onClick={hasUserConflict() ? undefined : hasTimeConflict() && !isPastTime() ? handleWaitlist : handleProceed}
            disabled={!store.selectedAssetId || waitlisting || isPastTime() || hasUserConflict()}
            className={`w-full py-4 rounded-full font-headline-md text-[18px] transition-all flex items-center justify-center gap-sm font-bold border border-white/20 ${
              isPastTime()
                ? 'bg-surface-variant/80 text-white/50 backdrop-blur-md cursor-not-allowed border-white/5'
                : hasUserConflict()
                ? 'bg-error/80 text-white backdrop-blur-md shadow-[0_0_20px_rgba(255,180,171,0.5)] cursor-not-allowed'
                : hasTimeConflict()
                ? 'bg-primary-container text-on-primary-container shadow-[0_0_20px_rgba(183,109,255,0.5)] hover:scale-[1.02] active:scale-95'
                : 'shimmer-btn animate-shimmer text-black fab-glow hover:scale-[1.02] active:scale-95'
            }`}
          >
            {isPastTime() ? (
              <>
                <span className="material-symbols-outlined text-[24px]">history</span>
                Time has passed
              </>
            ) : waitlisting ? (
              <>
                <span className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                Joining Waitlist...
              </>
            ) : hasUserConflict() ? (
              <>
                <span className="material-symbols-outlined text-[24px]">block</span>
                Already Booked
              </>
            ) : hasTimeConflict() ? (
              <>
                <span className="material-symbols-outlined text-[24px]">notifications_active</span>
                Join Waitlist
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[24px]">calendar_month</span>
                Book Experience
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
