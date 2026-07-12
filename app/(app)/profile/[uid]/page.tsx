'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, type AppUser } from '@/lib/auth';
import { getUserBookings, type Booking } from '@/lib/firestore';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function PublicProfilePage() {
  const { user, appUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const profileUid = params.uid as string;

  const [profileUser, setProfileUser] = useState<AppUser | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'friends'>('none');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!profileUid) return;
      try {
        const db = getFirestore();
        const userRef = doc(db, 'users', profileUid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setProfileUser(userSnap.data() as AppUser);
        }

        // Fetch bookings
        const userBookings = await getUserBookings(profileUid);
        // Only show confirmed/completed bookings publicly to avoid clutter
        const publicBookings = userBookings.filter(b => ['confirmed', 'completed'].includes(b.status));
        setBookings(publicBookings);

      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [profileUid]);

  useEffect(() => {
    if (!user || !profileUid || authLoading) return;
    
    if (appUser?.friends?.includes(profileUid)) {
      setFriendStatus('friends');
      return;
    }

    const checkPending = async () => {
      const db = getFirestore();
      // Check if current user sent a request to profile user
      const q1 = query(collection(db, 'friendRequests'), where('fromUid', '==', user.uid), where('toUid', '==', profileUid), where('status', '==', 'pending'));
      const snap1 = await getDocs(q1);
      if (!snap1.empty) {
        setFriendStatus('pending');
        return;
      }
      
      // Check if profile user sent a request to current user
      const q2 = query(collection(db, 'friendRequests'), where('fromUid', '==', profileUid), where('toUid', '==', user.uid), where('status', '==', 'pending'));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        setFriendStatus('pending');
      }
    };
    
    checkPending();
  }, [user, appUser, profileUid, authLoading]);

  const handleAddFriend = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', uid: user.uid, targetUid: profileUid })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Friend request sent!');
        setFriendStatus('pending');
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Failed to send request');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="bg-background min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="bg-background text-on-surface min-h-dvh flex flex-col items-center justify-center p-md text-center">
        <span className="material-symbols-outlined text-[48px] text-error mb-4">error</span>
        <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
        <p className="text-on-surface-variant mb-6">The profile you are looking for does not exist.</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-surface-container rounded-full font-bold">Go Back</button>
      </div>
    );
  }

  const isSelf = user?.uid === profileUid;
  const isVIP = profileUser.isVIP && profileUser.vipUntil && new Date(profileUser.vipUntil) > new Date();

  return (
    <div className="bg-background text-on-surface min-h-dvh pb-[120px] font-body-md selection:bg-primary/30 selection:text-primary relative">
      <div className="fixed top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.15)_0%,rgba(5,5,5,1)_60%)] pointer-events-none mix-blend-screen opacity-60"></div>
      
      <header className="bg-black/30 backdrop-blur-2xl border-b border-white/5 shadow-sm fixed top-0 w-full flex justify-between items-center px-gutter py-md z-40 gap-4">
        <button onClick={() => router.back()} className="text-primary hover:opacity-80 transition-opacity active:scale-95 duration-200">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-[24px] font-bold text-white header-glow flex-1 text-center pr-8">Profile</h1>
      </header>

      <main className="pt-[100px] px-gutter md:px-xl max-w-container-max mx-auto relative z-10 space-y-6">
        
        {/* Profile Card */}
        <div className="glass-panel p-lg rounded-2xl flex flex-col items-center text-center relative overflow-hidden">
          {/* Avatar */}
          <div className={`w-28 h-28 rounded-full overflow-hidden relative flex items-center justify-center bg-surface-container mb-4 ${isVIP ? 'border-4 border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.6)]' : 'border border-outline-variant/30'}`}>
            {profileUser.photoURL ? (
              <img src={profileUser.photoURL} alt={profileUser.name} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant">person</span>
            )}
            {isVIP && (
              <div className="absolute -bottom-2 bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">VIP</div>
            )}
          </div>
          
          <h2 className="text-[24px] font-bold text-white flex items-center justify-center gap-2">
            {profileUser.name}
            {isVIP && <span className="material-symbols-outlined text-yellow-400 text-[20px]">workspace_premium</span>}
          </h2>
          
          <div className="flex items-center gap-4 mt-2">
            <span className="text-[14px] text-primary font-bold uppercase tracking-wider">{profileUser.tier} Tier</span>
            <span className="w-1 h-1 bg-white/20 rounded-full"></span>
            <span className="text-[14px] text-secondary font-bold">{profileUser.xp} XP</span>
          </div>

          {!isSelf && (
            <div className="mt-6 flex gap-3 w-full justify-center">
              {friendStatus === 'friends' && (
                <button onClick={() => router.push(`/chat/${profileUid}`)} className="flex items-center gap-2 bg-secondary text-black px-6 py-2 rounded-full font-bold active:scale-95 transition-transform">
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  Message
                </button>
              )}
              {friendStatus === 'none' && (
                <button onClick={handleAddFriend} className="flex items-center gap-2 bg-primary text-black px-6 py-2 rounded-full font-bold active:scale-95 transition-transform">
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  Add Friend
                </button>
              )}
              {friendStatus === 'pending' && (
                <button disabled className="flex items-center gap-2 bg-surface-variant text-on-surface-variant px-6 py-2 rounded-full font-bold opacity-70">
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                  Pending
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bookings Section */}
        <div>
          <h3 className="text-[18px] font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">sports_esports</span>
            Matches & Bookings
          </h3>
          
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="glass-panel p-lg rounded-xl text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[36px] opacity-50 mb-2">event_busy</span>
                <p>No recent bookings to display.</p>
              </div>
            ) : (
              bookings.map((booking) => (
                <div key={booking.id} className="glass-panel p-md rounded-xl flex items-center gap-md">
                  <div className="w-12 h-12 rounded-xl bg-surface-container border border-outline-variant/30 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-[24px]">
                      {booking.category === 'ps5' ? 'videogame_asset' : 'sports_golf'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-white text-[16px]">{booking.assetName}</div>
                    <div className="text-[12px] text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      {new Date(booking.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} 
                      &nbsp;•&nbsp; 
                      {booking.startTime}:00 - {booking.endTime}:00
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${booking.status === 'completed' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'}`}>
                    {booking.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
