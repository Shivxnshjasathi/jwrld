'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { collection, query, orderBy, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { Event } from '@/lib/firestore';
import { toast } from 'react-hot-toast';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const { isAdmin, profileLoading } = useAuth();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [entryFee, setEntryFee] = useState(0);
  const [prizePool, setPrizePool] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(16);

  useEffect(() => {
    const db = getFirebaseDb();
    const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Event)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isAdmin, router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const db = getFirebaseDb();
      const newRef = doc(collection(db, 'events'));
      const newEvent: Event = {
        id: newRef.id,
        title,
        description,
        date,
        time,
        entryFee: Number(entryFee),
        prizePool,
        maxParticipants: Number(maxParticipants),
        currentParticipants: 0,
        status: 'upcoming',
        createdAt: new Date().toISOString()
      };
      await setDoc(newRef, newEvent);
      toast.success('Event created successfully');
      
      // Reset form
      setTitle('');
      setDescription('');
      setDate('');
      setTime('');
      setEntryFee(0);
      setPrizePool('');
      setMaxParticipants(16);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create event');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-background min-h-dvh text-on-surface">
      <div className="px-md py-lg max-w-container-max mx-auto">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-lg">
          <div>
            <button onClick={() => router.push('/admin')} className="text-primary hover:opacity-80 transition-opacity mb-2 flex items-center gap-1 font-label-md text-[14px]">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to Dashboard
            </button>
            <h1 className="font-display-md text-[28px] font-bold text-white leading-tight">Manage Events</h1>
            <p className="text-on-surface-variant text-[14px]">Create and oversee tournaments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          
          {/* Create Form */}
          <div className="lg:col-span-1 glass-panel rounded-2xl p-md border border-white/5 h-fit sticky top-24">
            <h2 className="font-headline-sm font-bold text-white mb-md">New Event</h2>
            <form onSubmit={handleCreate} className="space-y-sm">
              <div>
                <label className="block text-[12px] text-on-surface-variant mb-1 ml-1">Event Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-surface-container rounded-xl px-4 py-3 text-[14px] text-white border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/50" placeholder="e.g., Saturday FIFA Cup" />
              </div>
              
              <div>
                <label className="block text-[12px] text-on-surface-variant mb-1 ml-1">Description</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-surface-container rounded-xl px-4 py-3 text-[14px] text-white border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/50" rows={3} placeholder="Event details..."></textarea>
              </div>

              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label className="block text-[12px] text-on-surface-variant mb-1 ml-1">Date</label>
                  <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-surface-container rounded-xl px-4 py-3 text-[14px] text-white border border-outline-variant/30 focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-[12px] text-on-surface-variant mb-1 ml-1">Time</label>
                  <input required type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-surface-container rounded-xl px-4 py-3 text-[14px] text-white border border-outline-variant/30 focus:border-primary outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label className="block text-[12px] text-on-surface-variant mb-1 ml-1">Entry Fee (₹)</label>
                  <input required type="number" min="0" value={entryFee} onChange={e => setEntryFee(Number(e.target.value))} className="w-full bg-surface-container rounded-xl px-4 py-3 text-[14px] text-white border border-outline-variant/30 focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-[12px] text-on-surface-variant mb-1 ml-1">Max Players</label>
                  <input required type="number" min="2" value={maxParticipants} onChange={e => setMaxParticipants(Number(e.target.value))} className="w-full bg-surface-container rounded-xl px-4 py-3 text-[14px] text-white border border-outline-variant/30 focus:border-primary outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[12px] text-on-surface-variant mb-1 ml-1">Prize Pool</label>
                <input required type="text" value={prizePool} onChange={e => setPrizePool(e.target.value)} className="w-full bg-surface-container rounded-xl px-4 py-3 text-[14px] text-white border border-outline-variant/30 focus:border-primary outline-none" placeholder="e.g., ₹5000 + Custom Cue" />
              </div>

              <button type="submit" disabled={isCreating} className="w-full mt-4 bg-primary text-background font-bold py-3 rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-md disabled:opacity-50">
                {isCreating ? 'Creating...' : 'Create Event'}
              </button>
            </form>
          </div>

          {/* Events List */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-md">
                {events.length === 0 ? (
                  <p className="text-on-surface-variant text-center py-10">No events found.</p>
                ) : (
                  events.map(event => (
                    <div key={event.id} className="glass-panel p-md rounded-2xl border border-white/5 flex flex-col md:flex-row gap-md justify-between items-start md:items-center">
                      <div>
                        <div className="flex gap-2 items-center mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${event.status === 'upcoming' ? 'bg-primary/20 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>{event.status}</span>
                          <span className="text-[12px] text-on-surface-variant">{event.date} at {event.time}</span>
                        </div>
                        <h3 className="font-bold text-white text-[18px]">{event.title}</h3>
                        <p className="text-[12px] text-on-surface-variant mt-1">Prize: <span className="text-secondary font-bold">{event.prizePool}</span> • Entry: ₹{event.entryFee}</p>
                      </div>
                      
                      <div className="text-right">
                        <div className="bg-surface-container px-4 py-2 rounded-lg">
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Registrations</p>
                          <p className="font-display-md text-white font-bold leading-none">{event.currentParticipants} <span className="text-[14px] text-on-surface-variant">/ {event.maxParticipants}</span></p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
