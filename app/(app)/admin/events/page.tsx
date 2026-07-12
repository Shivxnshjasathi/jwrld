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
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'create'>('upcoming');
  const router = useRouter();
  const { isAdmin } = useAuth();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [entryFee, setEntryFee] = useState<number | string>('');
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

  const upcomingEvents = events.filter(e => e.status === 'upcoming');
  const pastEvents = events.filter(e => e.status === 'completed' || e.status === 'cancelled');

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
      setEntryFee('');
      setPrizePool('');
      setMaxParticipants(16);
      setActiveTab('upcoming');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create event');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      const db = getFirebaseDb();
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'events', eventId));
      toast.success('Event deleted');
    } catch (err: any) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  const EventCard = ({ event }: { event: Event }) => (
    <div 
      onClick={() => router.push(`/admin/events/${event.id}`)}
      className="glass-panel p-md rounded-2xl border border-white/5 flex flex-col md:flex-row gap-md justify-between items-start md:items-center cursor-pointer hover:bg-white/5 transition-colors group"
    >
      <div>
        <div className="flex gap-2 items-center mb-1">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${event.status === 'upcoming' ? 'bg-primary/20 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>{event.status}</span>
          <span className="text-[12px] text-on-surface-variant">{event.date} at {event.time}</span>
        </div>
        <h3 className="font-bold text-white text-[18px] group-hover:text-primary transition-colors">{event.title}</h3>
        <p className="text-[12px] text-on-surface-variant mt-1">Prize: <span className="text-secondary font-bold">{event.prizePool}</span> • Entry: ₹{event.entryFee}</p>
      </div>
      
      <div className="text-right flex flex-col items-end justify-between">
        <div className="bg-surface-container px-4 py-2 rounded-lg">
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Registrations</p>
          <p className="font-display-md text-white font-bold leading-none">{event.currentParticipants} <span className="text-[14px] text-on-surface-variant">/ {event.maxParticipants}</span></p>
        </div>
        <button onClick={(e) => handleDelete(event.id!, e)} className="text-[12px] text-error hover:opacity-80 transition-opacity mt-3 flex items-center gap-1 font-bold bg-error/10 px-3 py-1.5 rounded-md">
          <span className="material-symbols-outlined text-[14px]">delete</span> Delete
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-background min-h-dvh text-on-surface pb-20">
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

        {/* Tabs */}
        <div className="flex gap-2 mb-md overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-3 rounded-full font-bold text-[14px] whitespace-nowrap transition-colors ${activeTab === 'upcoming' ? 'bg-primary text-black' : 'bg-surface-container text-on-surface-variant hover:text-white'}`}
          >
            Upcoming ({upcomingEvents.length})
          </button>
          <button 
            onClick={() => setActiveTab('past')}
            className={`px-6 py-3 rounded-full font-bold text-[14px] whitespace-nowrap transition-colors ${activeTab === 'past' ? 'bg-primary text-black' : 'bg-surface-container text-on-surface-variant hover:text-white'}`}
          >
            Past ({pastEvents.length})
          </button>
          <button 
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 rounded-full font-bold text-[14px] whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'create' ? 'bg-white text-black' : 'bg-surface-container text-on-surface-variant hover:text-white'}`}
          >
            <span className="material-symbols-outlined text-[18px]">add</span> Create New
          </button>
        </div>

        <div>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {activeTab === 'upcoming' && (
                <div className="space-y-md animate-fade-in">
                  {upcomingEvents.length === 0 ? (
                    <div className="text-center py-10 glass-panel rounded-2xl">
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">event_busy</span>
                      <p className="text-on-surface-variant">No upcoming events.</p>
                      <button onClick={() => setActiveTab('create')} className="text-primary mt-2 font-bold hover:underline">Create one now</button>
                    </div>
                  ) : (
                    upcomingEvents.map(event => <EventCard key={event.id} event={event} />)
                  )}
                </div>
              )}

              {activeTab === 'past' && (
                <div className="space-y-md animate-fade-in">
                  {pastEvents.length === 0 ? (
                    <div className="text-center py-10 glass-panel rounded-2xl">
                      <p className="text-on-surface-variant">No past events found.</p>
                    </div>
                  ) : (
                    pastEvents.map(event => <EventCard key={event.id} event={event} />)
                  )}
                </div>
              )}

              {activeTab === 'create' && (
                <div className="glass-panel rounded-2xl p-lg border border-white/5 animate-fade-in max-w-2xl mx-auto">
                  <h2 className="font-headline-sm font-bold text-white mb-lg">Create New Event</h2>
                  <form onSubmit={handleCreate} className="space-y-md">
                    <div>
                      <label className="block text-[12px] text-on-surface-variant mb-1 ml-1 font-bold">Event Title</label>
                      <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-surface-container rounded-xl px-4 py-3 text-[14px] text-white border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/50" placeholder="e.g., Saturday FIFA Cup" />
                    </div>
                    
                    <div>
                      <label className="block text-[12px] text-on-surface-variant mb-1 ml-1 font-bold">Description</label>
                      <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-surface-container rounded-xl px-4 py-3 text-[14px] text-white border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/50" rows={3} placeholder="Event details..."></textarea>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-md">
                      <div className="flex-1">
                        <label className="block text-[12px] text-on-surface-variant mb-1 ml-1 font-bold">Date</label>
                        <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full min-w-0 bg-surface-container rounded-xl px-3 py-3 text-[14px] text-white border border-outline-variant/30 focus:border-primary outline-none" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[12px] text-on-surface-variant mb-1 ml-1 font-bold">Time</label>
                        <input required type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full min-w-0 bg-surface-container rounded-xl px-3 py-3 text-[14px] text-white border border-outline-variant/30 focus:border-primary outline-none" />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-md">
                      <div className="flex-1">
                        <label className="block text-[12px] text-on-surface-variant mb-1 ml-1 font-bold">Entry Fee (₹)</label>
                        <input required type="number" min="0" value={entryFee} onChange={e => setEntryFee(e.target.value)} className="w-full min-w-0 bg-surface-container rounded-xl px-3 py-3 text-[14px] text-white border border-outline-variant/30 focus:border-primary outline-none" placeholder="e.g., 300" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[12px] text-on-surface-variant mb-1 ml-1 font-bold">Max Players</label>
                        <input required type="number" min="2" value={maxParticipants} onChange={e => setMaxParticipants(Number(e.target.value))} className="w-full min-w-0 bg-surface-container rounded-xl px-3 py-3 text-[14px] text-white border border-outline-variant/30 focus:border-primary outline-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] text-on-surface-variant mb-1 ml-1 font-bold">Prize Pool</label>
                      <input required type="text" value={prizePool} onChange={e => setPrizePool(e.target.value)} className="w-full bg-surface-container rounded-xl px-4 py-3 text-[14px] text-white border border-outline-variant/30 focus:border-primary outline-none" placeholder="e.g., ₹5000 + Custom Cue" />
                    </div>

                    <button type="submit" disabled={isCreating} className="w-full mt-4 bg-primary text-black font-bold py-4 rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-[0_0_20px_rgba(45,212,191,0.3)] disabled:opacity-50 text-[16px]">
                      {isCreating ? 'Creating...' : 'Launch Event'}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
