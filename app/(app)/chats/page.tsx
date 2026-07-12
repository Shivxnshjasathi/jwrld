'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { useAppNavigation } from '@/hooks/use-app-navigation';

export default function ChatsListPage() {
  const { appUser } = useAuth();
  const router = useRouter();
  const { goBack } = useAppNavigation();
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser) return;
    
    const fetchFriends = async () => {
      if (!appUser.friends || appUser.friends.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const db = getFirebaseDb();
        const uids = appUser.friends;
        
        // Firestore 'in' query supports up to 10 items. Chunking if more than 10.
        const chunkArray = (arr: any[], size: number) => {
          const chunked = [];
          for (let i = 0; i < arr.length; i += size) {
            chunked.push(arr.slice(i, i + size));
          }
          return chunked;
        };
        
        const uidChunks = chunkArray(uids, 10);
        let allFriends: any[] = [];
        
        for (const chunk of uidChunks) {
          const q = query(collection(db, 'users'), where(documentId(), 'in', chunk));
          const snap = await getDocs(q);
          const data = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
          allFriends = [...allFriends, ...data];
        }
        
        setFriends(allFriends);
      } catch (err) {
        console.error('Failed to fetch friends for chats', err);
      }
      setLoading(false);
    };

    fetchFriends();
  }, [appUser]);

  return (
    <div className="bg-[#0A0A0B] text-on-surface min-h-screen pb-[120px] font-body-md selection:bg-primary/30 selection:text-primary">
      {/* Header */}
      <header className="bg-surface/10 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm fixed top-0 w-full flex items-center gap-4 px-gutter py-4 z-40">
        <button
          onClick={() => goBack('/profile')}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-95 text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div>
          <h1 className="text-[18px] font-bold text-on-surface leading-tight header-glow">Chats</h1>
          <p className="text-[10px] text-primary font-bold tracking-widest uppercase">My Friends</p>
        </div>
      </header>

      <main className="pt-[100px] px-gutter max-w-container-max mx-auto relative z-10">
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : friends.length > 0 ? (
          <div className="space-y-3">
            {friends.map((friend) => (
              <div 
                key={friend.uid}
                onClick={() => router.push(`/chat/${friend.uid}`)}
                className="glass-panel p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-colors border border-outline-variant/20 group"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-container flex-shrink-0 border-2 border-white/5 group-hover:border-primary/50 transition-colors">
                  {friend.photoURL ? (
                    <img src={friend.photoURL} alt={friend.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-bold text-xl">
                      {friend.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-white text-[16px] truncate">{friend.name}</h3>
                    <span className="text-[10px] text-on-surface-variant">Tap to chat</span>
                  </div>
                  <p className="text-[13px] text-on-surface-variant truncate">
                    {friend.tier || 'Bronze'} Tier
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-6 border border-outline-variant/30">
              <span className="material-symbols-outlined text-[32px] text-on-surface-variant">forum</span>
            </div>
            <h2 className="text-[20px] font-bold text-white mb-2">No Chats Yet</h2>
            <p className="text-[14px] text-on-surface-variant mb-8 max-w-[250px] mx-auto">
              Add some friends to start chatting with them.
            </p>
            <button 
              onClick={() => router.push('/social')}
              className="bg-primary text-black font-bold py-3 px-8 rounded-full text-[14px] hover:bg-primary/90 transition-colors active:scale-95"
            >
              Find Friends
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
