'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAuth, signOut } from '@/lib/auth';
import { useAppStore } from '@/lib/store';
import { doc, updateDoc, collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

const MENU_ITEMS = [
  { icon: 'event_available', label: 'Tournaments & Events', href: '/events', color: 'text-primary' },
  { icon: 'calendar_month', label: 'My Bookings', href: '/bookings', color: 'text-secondary' },
  { icon: 'help', label: 'Help & Support', href: '/messages', color: 'text-primary' },
  { icon: 'shield', label: 'Privacy Policy', href: '/privacy', color: 'text-on-surface-variant' },
];

export default function ProfilePage() {
  const { appUser, user, isAdmin } = useAuth();
  const router = useRouter();
  const isDarkMode = useAppStore((s) => s.darkMode);
  const [showContactInfo, setShowContactInfo] = useState(false);

  const [currentStreak, setCurrentStreak] = useState(appUser?.currentStreak || 0);
  const [spinsAvailable, setSpinsAvailable] = useState(appUser?.spinsAvailable || 0);
  const [friendsData, setFriendsData] = useState<any[]>([]);

  useEffect(() => {
    if (!appUser?.friends || appUser.friends.length === 0) return;
    const fetchFriends = async () => {
      try {
        const db = getFirebaseDb();
        const uids = appUser.friends!.slice(0, 10);
        const q = query(collection(db, 'users'), where(documentId(), 'in', uids));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
        setFriendsData(data);
      } catch (err) {
        console.error('Failed to fetch friends', err);
      }
    };
    fetchFriends();
  }, [appUser?.friends]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/streak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: user.uid })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCurrentStreak(data.currentStreak);
          setSpinsAvailable(data.spinsAvailable);
          if (data.spinGranted) {
            toast.success('🔥 You earned a free daily spin!');
          }
        }
      })
      .catch(console.error);
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const handleMakeAdmin = async () => {
    if (!user || !appUser) return;
    try {
      const db = getFirebaseDb();
      await updateDoc(doc(db, 'users', appUser.uid), { role: 'admin' });
      toast.success('You are now an admin!');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to make admin');
    }
  };

  const isVIP = appUser?.isVIP && appUser?.vipUntil && new Date(appUser.vipUntil) > new Date();

  // 3D Tilt Card Animation Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="bg-background text-on-surface min-h-dvh pb-[120px] font-body-md selection:bg-primary/30 selection:text-primary overflow-hidden">
      {/* TopAppBar */}
      <header className="bg-surface/10 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm fixed top-0 w-full flex justify-between items-center px-gutter py-md z-40">
        <div className="flex items-center gap-sm">
          <div className={`w-10 h-10 rounded-full overflow-hidden relative flex items-center justify-center bg-surface-container ${isVIP ? 'border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'border border-outline-variant/30'}`}>
            {appUser?.photoURL ? (
              <Image src={appUser.photoURL} alt="Profile" fill sizes="40px" className="object-cover" />
            ) : (
              <span className="material-symbols-outlined text-on-surface-variant">person</span>
            )}
          </div>
          <div className="flex-1 flex flex-col items-center">
            <div className="font-display-md text-[24px] tracking-tighter text-on-surface header-glow font-bold leading-none">
              Jaaduwrld
            </div>
            <div className="text-[9px] font-bold tracking-[0.2em] text-primary uppercase mt-1">Art and Arcade</div>
          </div>
        </div>
        <div className="flex items-center gap-2">

           <button 
             onClick={() => router.push('/spin')}
             className={`flex items-center gap-1 px-2 py-1 rounded-full font-bold text-[10px] ${spinsAvailable > 0 ? 'bg-gradient-to-r from-secondary to-primary text-black animate-pulse shadow-[0_0_10px_rgba(45,212,191,0.5)]' : 'bg-surface-variant/40 text-on-surface-variant border border-outline-variant/30 backdrop-blur-md hover:bg-white/10'}`}
           >
             <span className={`material-symbols-outlined text-[14px] ${spinsAvailable === 0 ? 'opacity-50' : ''}`}>casino</span>
             {spinsAvailable}
           </button>
          <button 
            onClick={() => router.push('/chats')}
            className="text-primary hover:opacity-80 transition-opacity active:scale-95 duration-200 ml-2"
          >
            <span className="material-symbols-outlined">chat</span>
          </button>
          <button 
            onClick={() => setShowContactInfo(true)}
            className="text-primary hover:opacity-80 transition-opacity active:scale-95 duration-200 ml-2"
          >
            <span className="material-symbols-outlined">info</span>
          </button>
        </div>
      </header>

      <main className="pt-[100px] px-gutter md:px-xl max-w-container-max mx-auto md:grid md:grid-cols-12 md:gap-gutter relative z-10">

        {/* Left Column: Digital Wallet / ID Card */}
        <section className="md:col-span-5 lg:col-span-4 mb-xl">
          <h1 className="font-headline-md text-[28px] md:text-[32px] font-bold mb-lg text-white">Profile</h1>

          {/* ID Card Component */}
          <div style={{ perspective: 1000 }} className="w-full mx-auto relative h-[220px]">
          {isVIP ? (
            <motion.div 
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              onClick={() => router.push('/vip')}
              className="cursor-pointer relative w-full h-full rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(250,204,21,0.2)] border border-yellow-400/50 transition-shadow active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] z-0" style={{ transform: "translateZ(-10px)" }}></div>
              
              {/* Card Glows */}
              <div className="absolute -top-20 -right-20 w-[200px] h-[200px] bg-yellow-500/30 blur-[60px] rounded-full z-0"></div>
              <div className="absolute -bottom-20 -left-20 w-[200px] h-[200px] bg-yellow-600/20 blur-[60px] rounded-full z-0"></div>
              
              <div className="relative z-10 p-6 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-yellow-400 font-black text-[24px] tracking-tight flex items-center gap-2">
                      JAADUWRLD <span className="material-symbols-outlined text-[24px]">workspace_premium</span>
                    </h2>
                    <p className="text-white/60 font-bold uppercase tracking-widest text-[10px]">Digital Membership</p>
                  </div>
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10">
                    <span className="material-symbols-outlined text-yellow-400">diamond</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-white font-bold text-[24px] leading-tight">{appUser?.name || 'Member'}</p>
                    <p className="text-yellow-400 font-bold text-[12px] mt-1">
                      Valid until {new Date(appUser.vipUntil!).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full text-yellow-400 text-[10px] font-black uppercase tracking-widest">
                    ACTIVE
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              onClick={() => router.push('/vip')}
              className="cursor-pointer card-texture rounded-[20px] p-lg relative overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.5)] h-full flex flex-col justify-between transition-shadow active:scale-95"
            >
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/30 rounded-full blur-[50px] pointer-events-none" style={{ transform: "translateZ(-20px)" }}></div>
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/20 rounded-full blur-[40px] pointer-events-none" style={{ transform: "translateZ(-20px)" }}></div>

              <div className="flex justify-between items-start z-10 relative">
                <span className="material-symbols-outlined text-on-surface/80 text-[32px]">contactless</span>
                <span className="font-label-md text-[14px] text-on-surface/60 uppercase tracking-widest font-bold">Jaadu Pass</span>
              </div>

              <div className="z-10 relative mt-auto">
                <p className="font-label-sm text-[12px] text-on-surface-variant mb-xs font-bold uppercase tracking-wider">
                  {isAdmin ? 'Admin Access' : 'Player Access'}
                </p>
                <p className="font-display-md text-[32px] font-bold tracking-tight leading-tight text-white">
                  {appUser?.name || 'Arcade Player'}
                </p>
                <p className="text-on-surface-variant text-[14px] mt-1">{appUser?.email}</p>
              </div>
            </motion.div>
          )}
          </div>

          {/* Gamification Section */}
          <div className="glass-panel rounded-xl p-md mt-md">
            <div className="flex justify-between items-end mb-sm">
              <div>
                <h3 className="font-body-lg text-[18px] text-on-surface font-bold uppercase tracking-wider text-primary">
                  {appUser?.tier || 'Bronze'} Tier
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-[12px] text-on-surface-variant">Jaadu XP</p>
                  {currentStreak > 0 && (
                    <div className="flex items-center gap-0.5 text-orange-400">
                      <span className="text-[10px]">🔥</span>
                      <span className="font-bold text-[10px] uppercase">{currentStreak}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-display-md text-[24px] font-bold text-white leading-none">
                  {appUser?.xp || 0}
                </p>
                <p className="text-[10px] text-on-surface-variant">
                  {appUser?.tier === 'Diamond' ? 'Max Rank' : `Next tier at ${appUser?.tier === 'Gold' ? '10000' : (appUser?.tier === 'Silver' ? '5000' : '1000')} XP`}
                </p>
              </div>
            </div>
            
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden relative">
              <div 
                className="absolute top-0 left-0 h-full bg-primary rounded-full" 
                style={{ 
                  width: `${appUser?.tier === 'Diamond' ? 100 : Math.min(100, Math.max(0, ((appUser?.xp || 0) / (appUser?.tier === 'Gold' ? 10000 : (appUser?.tier === 'Silver' ? 5000 : 1000))) * 100))}%` 
                }}
              ></div>
            </div>
          </div>

          {/* Refer & Earn Section */}
          <div className="glass-panel rounded-xl p-md mt-md relative overflow-hidden border-primary/20">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/20 rounded-full blur-[30px] pointer-events-none"></div>
            <div className="flex items-start gap-sm mb-sm relative z-10">
              <span className="material-symbols-outlined text-primary text-[24px]">redeem</span>
              <div>
                <h3 className="font-body-lg text-[16px] text-white font-bold">Refer & Earn ₹50</h3>
                <p className="text-[12px] text-on-surface-variant leading-tight mt-1">
                  Share your code with friends. When they sign up, you both get ₹50 in your Arcade Wallet!
                </p>
              </div>
            </div>
            
            {appUser?.referralCode ? (
              <div className="flex items-center gap-2 relative z-10 mt-3">
                <div className="flex-1 bg-surface-container-high/50 border border-outline-variant/30 rounded-lg px-3 py-2 text-center font-display-md tracking-widest text-[18px] text-white font-bold select-all">
                  {appUser.referralCode}
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(appUser.referralCode!);
                    toast.success('Code copied!');
                  }}
                  className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg h-[44px] px-4 flex items-center justify-center transition-colors active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">content_copy</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={async () => {
                  if (!appUser) return;
                  const db = getFirebaseDb();
                  const prefix = (appUser.name || 'JDU').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'JDU');
                  const randomNum = Math.floor(1000 + Math.random() * 9000);
                  const code = `${prefix}${randomNum}`;
                  await updateDoc(doc(db, 'users', appUser.uid), { referralCode: code });
                  toast.success('Code generated!');
                  window.location.reload();
                }}
                className="w-full bg-primary text-black font-bold py-2 rounded-lg mt-3 transition-transform active:scale-95"
              >
                Generate My Code
              </button>
            )}
          </div>



          <div className="grid grid-cols-2 gap-md mt-md">
            {isAdmin && (
              <button
                onClick={() => router.push('/admin')}
                className="col-span-2 glass-panel rounded-lg py-sm px-md flex items-center justify-center gap-sm hover:bg-white/10 transition-colors border-primary/30 text-primary"
              >
                <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                <span className="font-label-md text-[14px] font-bold">Admin Dashboard</span>
              </button>
            )}

            {!isAdmin && appUser?.email === 'shivanshjasathi052004@gmail.com' && (
              <button
                onClick={handleMakeAdmin}
                className="col-span-2 glass-panel rounded-lg py-sm px-md flex items-center justify-center gap-sm hover:bg-white/10 transition-colors border-dashed border-white/20 text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">shield</span>
                <span className="font-label-md text-[14px] font-bold uppercase">Make Me Admin</span>
              </button>
            )}
          </div>
        </section>

        {/* Right Column: Settings & Actions */}
        <section className="md:col-span-7 lg:col-span-8">

          {/* My Friends Section */}
          <div className="mb-xl">
            <h2 className="font-headline-md text-[24px] font-bold mb-sm text-white">My Friends</h2>
            {friendsData.length > 0 ? (
              <div className="flex gap-md overflow-x-auto pb-sm scrollbar-hide snap-x">
                {friendsData.map(friend => (
                  <div key={friend.uid} className="glass-panel p-md rounded-xl min-w-[240px] flex-shrink-0 snap-center border-outline-variant/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container flex-shrink-0">
                        {friend.photoURL ? (
                          <Image src={friend.photoURL} alt={friend.name} fill sizes="48px" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-bold">
                            {friend.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-white text-[16px] truncate">{friend.name}</p>
                        <p className="text-[12px] text-on-surface-variant truncate">XP: {friend.xp || 0}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => router.push(`/chat/${friend.uid}`)}
                        className="flex-1 bg-surface-container hover:bg-white/10 text-white font-bold py-2 rounded-lg text-[12px] transition-colors"
                      >
                        Chat
                      </button>
                      <button 
                        onClick={() => toast.success(`Invited ${friend.name} to play!`)}
                        className="flex-1 bg-primary text-black font-bold py-2 rounded-lg text-[12px] hover:bg-primary/90 transition-colors"
                      >
                        Invite
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel p-md rounded-xl border-dashed border-outline-variant/30 text-center">
                <p className="text-on-surface-variant text-[14px]">No friends yet.</p>
                <button onClick={() => router.push('/social')} className="text-primary text-[14px] font-bold mt-2 hover:underline">Find Friends</button>
              </div>
            )}
          </div>

          <h2 className="font-headline-md text-[24px] font-bold mb-lg text-white">Account Actions</h2>

          <div className="space-y-md">
            {MENU_ITEMS.map((item, idx) => (
              <div
                key={item.label}
                onClick={() => item.href !== '#' && router.push(item.href)}
                className="glass-panel rounded-xl p-md flex items-center justify-between group hover:bg-white/[0.08] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-md">
                  <div className={`w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center border border-outline-variant/30 ${item.color}`}>
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-body-lg text-[18px] text-on-surface font-semibold">{item.label}</h3>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-white transition-colors">chevron_right</span>
                </div>
              </div>
            ))}

          </div>
          {/* Settings & Sign Out */}
          <div className="mt-xl border-t border-outline-variant/20 pt-lg space-y-sm">
            <button
              onClick={() => router.push('/settings')}
              className="w-full flex items-center justify-between p-md glass-panel rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-on-surface-variant">settings</span>
                <span className="font-body-md text-[16px] text-on-surface">Account Settings</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-between p-md glass-panel rounded-lg hover:bg-error/10 transition-colors border-error/20"
            >
              <div className="flex items-center gap-sm text-error">
                <span className="material-symbols-outlined">logout</span>
                <span className="font-body-md text-[16px] font-bold">Sign Out</span>
              </div>
            </button>
          </div>
        </section>
      </main>

      {/* Contact Info Bottom Sheet */}
      {showContactInfo && (
        <>
          <div 
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowContactInfo(false)}
          ></div>
          <div className="fixed bottom-0 left-0 w-full z-[70] bg-surface-container-high rounded-t-3xl border-t border-outline-variant/20 p-xl shadow-[0_-20px_40px_rgba(0,0,0,0.5)] animate-slide-up-fade">
            <div className="w-12 h-1 bg-outline-variant/30 rounded-full mx-auto mb-lg"></div>
            <h2 className="font-headline-sm text-[24px] font-bold text-white mb-md">Contact Us</h2>
            <div className="space-y-sm">
              <div className="flex items-center gap-md glass-panel p-md rounded-xl">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <div>
                  <div className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">Email</div>
                  <a href="mailto:jaaduwrldartandarcade@gmail.com" className="text-[14px] font-bold text-white">jaaduwrldartandarcade@gmail.com</a>
                </div>
              </div>
              <div className="flex items-center gap-md glass-panel p-md rounded-xl">
                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined">call</span>
                </div>
                <div>
                  <div className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">Phone</div>
                  <div className="text-[14px] font-bold text-white mt-0.5">
                    <a href="tel:+919238005628">+91 92380 05628</a>
                    <span className="text-on-surface-variant mx-2">|</span>
                    <a href="tel:8815867503">8815867503</a>
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowContactInfo(false)}
              className="w-full mt-lg py-4 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
}
