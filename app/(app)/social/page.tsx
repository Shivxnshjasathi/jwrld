'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import { collection, query, where, getDocs, onSnapshot, getFirestore } from 'firebase/firestore';
import { useSound } from '@/hooks/use-sound';

export default function SocialPage() {
  const { user, appUser } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'friends' | 'search' | 'requests'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { playPop, playSuccess } = useSound();

  useEffect(() => {
    if (!user) return;
    const db = getFirestore();
    
    // Listen to friend requests
    const q = query(collection(db, 'friendRequests'), where('toUid', '==', user.uid), where('status', '==', 'pending'));
    const unsub = onSnapshot(q, (snap) => {
      const reqs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFriendRequests(reqs);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || !appUser?.friends?.length) return;
    // Load friends data
    const fetchFriends = async () => {
      const db = getFirestore();
      try {
        const friendsData = [];
        for (const fUid of appUser.friends!) {
          const docSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', fUid)));
          if (!docSnap.empty) {
            friendsData.push(docSnap.docs[0].data());
          }
        }
        setFriendsList(friendsData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchFriends();
  }, [user, appUser?.friends]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/friends?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      toast.error('Search failed');
    }
    setLoading(false);
  };

  const sendRequest = async (targetUid: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', uid: user.uid, targetUid })
      });
      const data = await res.json();
      if (data.success) {
        playPop();
        toast.success('Request sent!');
      }
      else toast.error(data.error);
    } catch (err) {
      toast.error('Failed to send request');
    }
  };

  const respondRequest = async (requestId: string, action: 'accept' | 'decline') => {
    if (!user) return;
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, uid: user.uid, requestId })
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'accept') playSuccess();
        else playPop();
        toast.success(`Request ${action}ed`);
      }
      else toast.error(data.error);
    } catch (err) {
      toast.error('Action failed');
    }
  };

  return (
    <div className="bg-background text-on-surface min-h-dvh pb-[120px] font-body-md selection:bg-primary/30 selection:text-primary relative">
      <div className="fixed top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.15)_0%,rgba(5,5,5,1)_70%)] pointer-events-none mix-blend-screen opacity-60"></div>
      
      <header className="bg-black/30 backdrop-blur-2xl border-b border-white/5 shadow-sm fixed top-0 w-full flex items-center px-gutter py-md z-40 gap-4">
        <button onClick={() => router.back()} className="text-primary hover:opacity-80 transition-opacity active:scale-95 duration-200">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-[24px] font-bold text-white header-glow flex-1 text-center pr-8">Social</h1>
      </header>

      <main className="pt-[100px] px-gutter md:px-xl max-w-container-max mx-auto relative z-10">
        
        {/* Tabs */}
        <div className="flex bg-surface-container rounded-xl p-1 mb-lg border border-outline-variant/20">
          <button 
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 font-bold text-[14px] rounded-lg transition-colors ${activeTab === 'friends' ? 'bg-white/10 text-white' : 'text-on-surface-variant hover:text-white/70'}`}
          >
            My Friends
          </button>
          <button 
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2 font-bold text-[14px] rounded-lg transition-colors ${activeTab === 'search' ? 'bg-white/10 text-white' : 'text-on-surface-variant hover:text-white/70'}`}
          >
            Find Users
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 font-bold text-[14px] rounded-lg transition-colors relative ${activeTab === 'requests' ? 'bg-white/10 text-white' : 'text-on-surface-variant hover:text-white/70'}`}
          >
            Requests
            {friendRequests.length > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(168,85,247,1)]"></span>
            )}
          </button>
        </div>

        {activeTab === 'friends' && (
          <div className="animate-fade-in space-y-4">
            {friendsList.length === 0 ? (
              <div className="text-center text-on-surface-variant py-10 glass-panel rounded-xl">
                <span className="material-symbols-outlined text-[48px] opacity-50 mb-2">group_off</span>
                <p>No friends yet.</p>
              </div>
            ) : (
              <motion.div 
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1 }
                  }
                }}
                className="space-y-4"
              >
              {friendsList.map(f => {
                const isVIP = f.isVIP && f.vipUntil && new Date(f.vipUntil) > new Date();
                return (
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0 }
                    }}
                    key={f.uid} 
                    className="glass-panel p-md rounded-xl flex items-center gap-md"
                  >
                    <div 
                      onClick={() => router.push(`/profile/${f.uid}`)}
                      className={`cursor-pointer w-12 h-12 rounded-full overflow-hidden relative flex items-center justify-center bg-surface-container flex-shrink-0 ${isVIP ? 'border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'border border-outline-variant/30'}`}
                    >
                      {f.photoURL ? <Image src={f.photoURL} alt={f.name} fill sizes="48px" className="object-cover" /> : <span className="material-symbols-outlined text-on-surface-variant">person</span>}
                    </div>
                    <div className="flex-1 cursor-pointer" onClick={() => router.push(`/profile/${f.uid}`)}>
                      <div className="font-bold text-white text-[16px] flex items-center gap-2">
                         {f.name}
                         {isVIP && <span className="material-symbols-outlined text-yellow-400 text-[16px]">workspace_premium</span>}
                      </div>
                      <div className="text-[12px] text-primary font-bold uppercase tracking-wider">{f.tier} Tier • {f.xp} XP</div>
                    </div>
                    <button 
                      onClick={() => router.push(`/chat/${f.uid}`)}
                      className="w-10 h-10 flex items-center justify-center bg-surface-variant rounded-full text-secondary hover:bg-secondary/20 transition-colors shadow-[0_0_10px_rgba(45,212,191,0.1)] active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[20px]">chat</span>
                    </button>
                  </motion.div>
                );
              })}
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="animate-fade-in">
            <form onSubmit={handleSearch} className="flex gap-2 mb-lg">
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary transition-colors"
              />
              <button type="submit" disabled={loading} className="bg-primary text-black px-6 rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all">
                {loading ? '...' : 'Search'}
              </button>
            </form>

            <motion.div 
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05 }
                }
              }}
              className="space-y-4"
            >
              {searchResults.map(s => {
                const isSelf = s.uid === user?.uid;
                const isFriend = appUser?.friends?.includes(s.uid);
                return (
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      show: { opacity: 1, x: 0 }
                    }}
                    key={s.uid} 
                    className="glass-panel p-md rounded-xl flex items-center gap-md"
                  >
                    <div 
                      onClick={() => router.push(`/profile/${s.uid}`)}
                      className="cursor-pointer w-12 h-12 rounded-full overflow-hidden border border-outline-variant/30 relative bg-surface-container flex items-center justify-center flex-shrink-0"
                    >
                      {s.photoURL ? <Image src={s.photoURL} alt={s.name} fill sizes="48px" className="object-cover" /> : <span className="material-symbols-outlined text-on-surface-variant">person</span>}
                    </div>
                    <div className="flex-1 cursor-pointer" onClick={() => router.push(`/profile/${s.uid}`)}>
                      <div className="font-bold text-white text-[16px]">{s.name}</div>
                      <div className="text-[12px] text-on-surface-variant">{s.tier} Tier</div>
                    </div>
                    {!isSelf && !isFriend && (
                      <button onClick={() => sendRequest(s.uid)} className="w-8 h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center hover:bg-secondary/40 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                      </button>
                    )}
                    {isFriend && (
                      <span className="text-[12px] text-secondary font-bold px-2 py-1 bg-secondary/20 rounded">Friend</span>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="animate-fade-in space-y-4">
            {friendRequests.length === 0 ? (
              <div className="text-center text-on-surface-variant py-10 glass-panel rounded-xl">
                <span className="material-symbols-outlined text-[48px] opacity-50 mb-2">check_circle</span>
                <p>No pending requests.</p>
              </div>
            ) : (
              <motion.div 
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1 }
                  }
                }}
                className="space-y-4"
              >
              {friendRequests.map(req => (
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    show: { opacity: 1, y: 0 }
                  }}
                  key={req.id} 
                  className="glass-panel p-md rounded-xl flex items-center gap-md"
                >
                  {req.fromName ? (
                    <>
                      <div 
                        onClick={() => router.push(`/profile/${req.fromUid}`)}
                        className="cursor-pointer w-12 h-12 rounded-full overflow-hidden border border-outline-variant/30 relative bg-surface-container flex items-center justify-center flex-shrink-0"
                      >
                        {req.fromPhotoURL ? <Image src={req.fromPhotoURL} alt={req.fromName} fill sizes="48px" className="object-cover" /> : <span className="material-symbols-outlined text-on-surface-variant">person</span>}
                      </div>
                      <div className="flex-1 cursor-pointer" onClick={() => router.push(`/profile/${req.fromUid}`)}>
                        <div className="font-bold text-white text-[16px]">{req.fromName}</div>
                        <div className="text-[12px] text-on-surface-variant">Sent you a friend request</div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1">
                      <div className="font-bold text-white text-[16px]">Friend Request</div>
                      <div className="text-[12px] text-on-surface-variant">From User ID: {req.fromUid.substring(0,8)}...</div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => respondRequest(req.id, 'accept')} className="w-8 h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center hover:bg-secondary/40 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </button>
                    <button onClick={() => respondRequest(req.id, 'decline')} className="w-8 h-8 rounded-full bg-error/20 text-error flex items-center justify-center hover:bg-error/40 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                </motion.div>
              ))}
              </motion.div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
