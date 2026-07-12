'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { Event } from '@/lib/firestore';
import { toast } from 'react-hot-toast';

export default function AdminEventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isAdmin } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [winnerId, setWinnerId] = useState<string>('');

  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchEventData = async () => {
      try {
        const db = getFirebaseDb();
        // Fetch event
        const eventSnap = await getDoc(doc(db, 'events', id));
        if (eventSnap.exists()) {
          setEvent({ id: eventSnap.id, ...eventSnap.data() } as Event);
        }

        // Fetch participants
        const q = query(collection(db, 'event_registrations'), where('eventId', '==', id));
        const participantsSnap = await getDocs(q);
        const partsData = participantsSnap.docs.map(d => d.data());
        setParticipants(partsData);
      } catch (err) {
        console.error('Failed to load event data', err);
        toast.error('Failed to load event data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEventData();
  }, [id, isAdmin]);

  const handleCompleteEvent = async () => {
    if (!confirm('Are you sure you want to mark this event as completed?')) return;
    setIsUpdating(true);
    try {
      const db = getFirebaseDb();
      await updateDoc(doc(db, 'events', id), {
        status: 'completed',
        winnerId: winnerId || null
      });
      setEvent(prev => prev ? { ...prev, status: 'completed', winnerId: winnerId || undefined } : null);
      toast.success('Event marked as completed!');
    } catch (err: any) {
      toast.error('Failed to update event: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEvent = async () => {
    if (!confirm('Are you sure you want to cancel this event? (Refunds must be processed manually for now)')) return;
    setIsUpdating(true);
    try {
      const db = getFirebaseDb();
      await updateDoc(doc(db, 'events', id), {
        status: 'cancelled'
      });
      setEvent(prev => prev ? { ...prev, status: 'cancelled' } : null);
      toast.success('Event cancelled');
    } catch (err: any) {
      toast.error('Failed to cancel event: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background min-h-dvh flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="bg-background min-h-dvh text-on-surface p-md text-center py-20">
        <p className="text-on-surface-variant">Event not found.</p>
        <button onClick={() => router.push('/admin/events')} className="text-primary mt-4 font-bold hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-dvh text-on-surface pb-20">
      <div className="px-md py-lg max-w-container-max mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-lg">
          <div>
            <button onClick={() => router.push('/admin/events')} className="text-primary hover:opacity-80 transition-opacity mb-2 flex items-center gap-1 font-label-md text-[14px]">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to Events
            </button>
            <div className="flex items-center gap-3">
              <h1 className="font-display-md text-[28px] font-bold text-white leading-tight">{event.title}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                event.status === 'upcoming' ? 'bg-primary/20 text-primary' : 
                event.status === 'completed' ? 'bg-secondary/20 text-secondary' : 'bg-error/20 text-error'
              }`}>
                {event.status}
              </span>
            </div>
            <p className="text-on-surface-variant text-[14px] mt-1">{event.date} at {event.time} • ₹{event.entryFee} Entry • {event.prizePool} Prize Pool</p>
          </div>

          {event.status === 'upcoming' && (
            <div className="flex gap-2">
              <button 
                onClick={handleCancelEvent} 
                disabled={isUpdating}
                className="px-4 py-2 rounded-lg font-bold text-[14px] border border-error/50 text-error hover:bg-error/10 transition-colors disabled:opacity-50"
              >
                Cancel Event
              </button>
              <button 
                onClick={handleCompleteEvent} 
                disabled={isUpdating}
                className="px-4 py-2 rounded-lg font-bold text-[14px] bg-primary text-black hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-md"
              >
                Mark Completed
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-md">
            <div className="glass-panel p-lg rounded-2xl border border-white/5">
              <h2 className="text-[18px] font-bold text-white mb-4">Participants ({participants.length}/{event.maxParticipants})</h2>
              
              {event.status === 'upcoming' && participants.length > 0 && (
                <div className="mb-6 p-4 rounded-xl bg-surface-container border border-outline-variant/30">
                  <label className="block text-[12px] text-on-surface-variant mb-2 font-bold">Select Winner (Optional before completing)</label>
                  <select 
                    value={winnerId}
                    onChange={(e) => setWinnerId(e.target.value)}
                    className="w-full bg-background rounded-lg px-3 py-2 text-[14px] text-white border border-outline-variant/30 focus:border-primary outline-none"
                  >
                    <option value="">-- No specific winner selected --</option>
                    {participants.map(p => (
                      <option key={p.userId} value={p.userId}>{p.userName || p.userId}</option>
                    ))}
                  </select>
                </div>
              )}

              {participants.length === 0 ? (
                <p className="text-on-surface-variant text-center py-10 bg-surface-container/50 rounded-xl">No one has registered yet.</p>
              ) : (
                <div className="space-y-2">
                  {participants.map((p, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border flex justify-between items-center ${event.winnerId === p.userId ? 'bg-secondary/10 border-secondary/50' : 'bg-surface-container border-outline-variant/20'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {p.userName ? p.userName[0].toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="font-bold text-white text-[15px]">{p.userName}</p>
                          <p className="text-[11px] text-on-surface-variant">Registered: {new Date(p.registeredAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {event.winnerId === p.userId && (
                        <div className="flex items-center gap-1 text-secondary font-bold text-[12px] bg-secondary/20 px-2 py-1 rounded-full">
                          <span className="material-symbols-outlined text-[14px]">emoji_events</span> Winner
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-md">
            <div className="glass-panel p-md rounded-2xl border border-white/5">
              <h2 className="text-[14px] font-bold text-white mb-2">Event Description</h2>
              <p className="text-[13px] text-on-surface-variant leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
