'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { subscribeToUserBookings, extendBookingTime, type Booking } from '@/lib/firestore';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Clock, Plus, Loader2 } from 'lucide-react';

export default function LiveSessionWidget() {
  const { user } = useAuth();
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [extending, setExtending] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUserBookings(user.uid, (bookings) => {
      const now = new Date();
      const currentHour = now.getHours();
      const todayStr = format(now, 'yyyy-MM-dd');

      // Find a booking that is currently ongoing
      const ongoing = bookings.find(b => 
        (b.status === 'confirmed' || b.status === 'approved') &&
        b.date === todayStr &&
        b.startTime <= currentHour &&
        b.endTime > currentHour
      );
      
      setActiveBooking(ongoing || null);
    });
    return () => unsub();
  }, [user]);

  const handleExtend = async () => {
    if (!activeBooking) return;
    setExtending(true);
    try {
      await extendBookingTime(activeBooking, 1);
      toast.success('Added 1 hour to your session!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to extend time');
    }
    setExtending(false);
  };

  if (!activeBooking) return null;

  // Calculate minutes left
  const endDateTime = new Date();
  endDateTime.setHours(activeBooking.endTime, 0, 0, 0);
  const minutesLeft = Math.max(0, Math.floor((endDateTime.getTime() - currentTime.getTime()) / 60000));

  return (
    <div className="fixed bottom-[88px] left-4 right-4 z-40">
      <div className="bg-[#111111] text-white rounded-2xl p-4 shadow-xl shadow-black/20 flex items-center justify-between animate-in slide-in-from-bottom-8 duration-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center relative">
            <Clock size={20} className="text-white" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#111111] rounded-full" />
          </div>
          <div>
            <h4 className="text-sm font-bold truncate max-w-[140px]">{activeBooking.assetName}</h4>
            <p className="text-xs font-medium text-white/60">
              {minutesLeft} mins left (ends at {activeBooking.endTime > 12 ? activeBooking.endTime - 12 : activeBooking.endTime} {activeBooking.endTime >= 12 ? 'PM' : 'AM'})
            </p>
          </div>
        </div>
        
        <button
          onClick={handleExtend}
          disabled={extending || activeBooking.endTime >= 21}
          className="bg-white text-black px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {extending ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> 1 Hour</>}
        </button>
      </div>
    </div>
  );
}
