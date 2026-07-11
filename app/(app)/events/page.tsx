'use client';

import { useState, useEffect } from 'react';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAuth } from '@/lib/auth';
import { collection, query, orderBy, onSnapshot, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { Event, awardXP } from '@/lib/firestore';
import { deductWalletBalance } from '@/lib/wallet';
import { toast } from 'react-hot-toast';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { goBack, push } = useAppNavigation();
  const { appUser } = useAuth();

  useEffect(() => {
    const db = getFirebaseDb();
    const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Event)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleJoin = async (event: Event) => {
    if (!appUser) {
      toast.error('Please log in to join events');
      push('/login');
      return;
    }
    
    if (appUser.walletBalance < event.entryFee) {
      toast.error('Insufficient wallet balance. Please top up.');
      push('/wallet');
      return;
    }

    if (event.currentParticipants >= event.maxParticipants) {
      toast.error('Event is already full!');
      return;
    }

    setProcessingId(event.id);
    try {
      const db = getFirebaseDb();
      
      // Check if already registered
      const regId = `${event.id}_${appUser.uid}`;
      const regRef = doc(db, 'event_registrations', regId);
      const regSnap = await getDoc(regRef);
      if (regSnap.exists()) {
        toast('You are already registered for this event', { icon: 'ℹ️' });
        setProcessingId(null);
        return;
      }

      // Deduct wallet
      if (event.entryFee > 0) {
        await deductWalletBalance(appUser.uid, event.entryFee);
      }

      // Register
      await setDoc(regRef, {
        id: regId,
        eventId: event.id,
        userId: appUser.uid,
        userName: appUser.name,
        registeredAt: new Date().toISOString()
      });

      // Update participant count
      await updateDoc(doc(db, 'events', event.id), {
        currentParticipants: event.currentParticipants + 1
      });

      // Award XP for joining an event
      await awardXP(appUser.uid, 500);

      toast.success('Successfully registered! You earned 500 XP.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to register');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-background text-on-surface min-h-dvh pb-[120px] font-body-md selection:bg-primary/30 selection:text-primary">
      <header className="bg-surface/10 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm fixed top-0 w-full flex items-center px-gutter py-md z-40">
        <button onClick={() => goBack('/home')} className="text-on-surface hover:text-primary transition-colors active:scale-95 duration-200">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1 text-center font-headline-sm font-bold text-white header-glow">
          Tournaments & Events
        </div>
        <div className="w-6"></div>
      </header>

      <main className="pt-[100px] px-gutter md:px-xl max-w-container-max mx-auto relative z-10">
        <div className="mb-lg">
          <h1 className="font-display-sm text-[28px] font-bold text-white leading-tight header-glow">Epic Battles Await</h1>
          <p className="text-on-surface-variant text-[14px] mt-2">Join exclusive tournaments, compete for massive prize pools, and earn Jaadu XP.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-on-surface-variant mt-4 animate-pulse">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="glass-panel p-xl rounded-[24px] text-center flex flex-col items-center border border-dashed border-outline-variant/30">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant">event_busy</span>
            </div>
            <h3 className="text-white font-headline-sm font-bold mb-2">No Upcoming Events</h3>
            <p className="text-on-surface-variant">Check back later for new tournaments and leagues!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {events.map((event) => (
              <div key={event.id} className="glass-panel rounded-2xl overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-white/5 hover:border-primary/30 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[40px] -mr-16 -mt-16 pointer-events-none group-hover:bg-primary/30 transition-colors"></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      event.status === 'upcoming' ? 'bg-primary/20 text-primary border border-primary/30' :
                      event.status === 'ongoing' ? 'bg-secondary/20 text-secondary border border-secondary/30' :
                      'bg-surface-container text-on-surface-variant'
                    }`}>
                      {event.status}
                    </span>
                    <div className="text-right">
                      <p className="text-[12px] text-on-surface-variant">Prize Pool</p>
                      <p className="font-bold text-white text-[16px] text-secondary">{event.prizePool}</p>
                    </div>
                  </div>
                  
                  <h3 className="font-headline-sm font-bold text-white mb-2 leading-tight">{event.title}</h3>
                  <p className="text-on-surface-variant text-[14px] line-clamp-2 mb-6">{event.description}</p>
                  
                  <div className="space-y-3 mb-6 bg-surface-container/30 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px] text-primary">calendar_month</span>
                      <span className="text-[14px] text-white">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {event.time}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px] text-primary">group</span>
                      <span className="text-[14px] text-white">{event.currentParticipants} / {event.maxParticipants} Players</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div>
                      <p className="text-[12px] text-on-surface-variant mb-1">Entry Fee</p>
                      <p className="font-display-sm text-[20px] font-bold text-white">₹{event.entryFee}</p>
                    </div>
                    <button 
                      onClick={() => handleJoin(event)}
                      disabled={processingId === event.id || event.status !== 'upcoming' || event.currentParticipants >= event.maxParticipants}
                      className="bg-primary hover:bg-primary/90 text-background font-bold py-3 px-6 rounded-full transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(223,255,0,0.3)] disabled:shadow-none flex items-center gap-2"
                    >
                      {processingId === event.id ? 'Joining...' : (event.currentParticipants >= event.maxParticipants ? 'Full' : 'Join Now')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
