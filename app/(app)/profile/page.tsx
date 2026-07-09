'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut, User, Phone, Mail, Shield, ChevronRight, Settings, HelpCircle, Star } from 'lucide-react';
import { useAuth, signOut } from '@/lib/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

const MENU_ITEMS = [
  { icon: Star, label: 'My Bookings', href: '/bookings' },
  { icon: Settings, label: 'Settings', href: '/settings' },
  { icon: HelpCircle, label: 'Help & Support', href: '/help' },
  { icon: Shield, label: 'Privacy Policy', href: '/privacy' },
];

export default function ProfilePage() {
  const { appUser, user, isAdmin } = useAuth();
  const router = useRouter();

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
    <div className="min-h-dvh bg-[#F5F5F5]">
      {/* Header */}
      <div className="px-6 pt-12 pb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-8">Profile</h1>

        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
            {appUser?.photoURL ? (
              <img src={appUser.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User size={24} className="text-gray-900" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-gray-900">
              {appUser?.name || 'Arcade Player'}
            </h2>
            <div className="flex flex-col gap-1 mt-1">
              {appUser?.email && (
                <span className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500">
                  <Mail size={14} />
                  {appUser.email}
                </span>
              )}
              {appUser?.phone && (
                <span className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500">
                  <Phone size={14} />
                  {appUser.phone}
                </span>
              )}
            </div>
            {isAdmin && (
              <span className="inline-block mt-3 px-3 py-1 bg-purple-100 text-purple-700 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                Admin
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 space-y-4 pb-32">
        {/* Admin access */}
        {isAdmin && (
          <button
            onClick={() => router.push('/admin')}
            className="w-full bg-white rounded-[1.5rem] p-4 flex items-center justify-between shadow-sm transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <Shield size={20} className="text-purple-600" />
              </div>
              <div className="text-left">
                <p className="text-[14px] font-bold text-gray-900">Admin Dashboard</p>
                <p className="text-[12px] font-medium text-gray-400 mt-0.5">Manage bookings & assets</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </button>
        )}

        {/* Menu items */}
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => item.href !== '#' && router.push(item.href)}
              className="w-full bg-white rounded-[1.5rem] p-4 flex items-center justify-between shadow-sm transition-transform active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-gray-900" />
                </div>
                <span className="text-[14px] font-bold text-gray-900">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          );
        })}

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full bg-white rounded-[1.5rem] p-4 flex items-center gap-4 mt-6 shadow-sm transition-transform active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <LogOut size={20} className="text-red-500" />
          </div>
          <span className="text-[14px] font-bold text-red-500">Sign Out</span>
        </button>

        {/* Temporary Make Admin Button for testing */}
        {!isAdmin && appUser?.email === 'shivanshhasathi052004@gmail.com' && (
          <button
            onClick={handleMakeAdmin}
            className="w-full py-4 mt-8 border-2 border-dashed border-gray-300 rounded-[1.5rem] flex flex-col items-center justify-center bg-transparent hover:bg-gray-50 transition-colors"
          >
            <Shield size={20} className="text-gray-400 mb-2" />
            <span className="text-[12px] font-extrabold text-gray-500 uppercase tracking-wider">Make Me Admin (Test Mode)</span>
          </button>
        )}
      </div>
    </div>
  );
}
