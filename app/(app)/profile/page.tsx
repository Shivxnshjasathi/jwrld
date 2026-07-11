'use client';

import { useRouter } from 'next/navigation';
import { useAuth, signOut } from '@/lib/auth';
import { useAppStore } from '@/lib/store';
import { doc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

const MENU_ITEMS = [
  { icon: 'calendar_month', label: 'My Bookings', href: '/bookings', color: 'text-secondary' },
  { icon: 'help', label: 'Help & Support', href: '/help', color: 'text-primary' },
  { icon: 'shield', label: 'Privacy Policy', href: '/privacy', color: 'text-on-surface-variant' },
];

export default function ProfilePage() {
  const { appUser, user, isAdmin } = useAuth();
  const router = useRouter();
  const isDarkMode = useAppStore((s) => s.darkMode);

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

  return (
    <div className="bg-background text-on-surface min-h-dvh pb-[120px] font-body-md selection:bg-primary/30 selection:text-primary">
      {/* TopAppBar */}
      <header className="bg-surface/10 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm fixed top-0 w-full flex justify-between items-center px-gutter py-md z-40">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/30 relative flex items-center justify-center bg-surface-container">
            {appUser?.photoURL ? (
              <img src={appUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
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
        <button className="text-primary hover:opacity-80 transition-opacity active:scale-95 duration-200">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      <main className="pt-[100px] px-gutter md:px-xl max-w-container-max mx-auto md:grid md:grid-cols-12 md:gap-gutter relative z-10">
        
        {/* Left Column: Digital Wallet / ID Card */}
        <section className="md:col-span-5 lg:col-span-4 mb-xl">
          <h1 className="font-headline-md text-[28px] md:text-[32px] font-bold mb-lg text-white">Profile</h1>
          
          {/* ID Card Component */}
          <div className="card-texture rounded-[20px] p-lg relative overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.5)] h-[220px] flex flex-col justify-between">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/30 rounded-full blur-[50px] pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/20 rounded-full blur-[40px] pointer-events-none"></div>
            
            <div className="flex justify-between items-start z-10 relative">
              <span className="material-symbols-outlined text-on-surface/80 text-[32px]">contactless</span>
              <span className="font-label-md text-[14px] text-on-surface/60 uppercase tracking-widest font-bold">Jaadu Pass</span>
            </div>
            
            <div className="z-10 relative mt-auto">
              <p className="font-label-sm text-[12px] text-on-surface-variant mb-xs font-bold uppercase tracking-wider">
                {isAdmin ? 'Admin Access' : 'Player Access'}
              </p>
              <p className="font-display-md text-[32px] font-bold text-white tracking-tight leading-tight">
                {appUser?.name || 'Arcade Player'}
              </p>
              <p className="text-on-surface-variant text-[14px] mt-1">{appUser?.email}</p>
            </div>
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
    </div>
  );
}
