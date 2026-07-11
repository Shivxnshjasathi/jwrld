'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-[#0A0A0B] text-on-surface selection:bg-primary/30 pb-24 font-body-md relative overflow-hidden">
      {/* Background Glow */}
      <div className="ambient-glow"></div>

      <div className="bg-surface/10 px-6 pt-12 pb-4 sticky top-0 z-50 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-95 text-on-surface-variant hover:text-primary"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <h1 className="text-[20px] font-bold text-white leading-tight header-glow">Settings</h1>
        </div>
      </div>

      <div className="p-5 max-w-[1280px] mx-auto mt-2 space-y-6 relative z-10">
        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <h3 className="text-[12px] font-bold text-primary tracking-widest uppercase mb-6">Account Preferences</h3>
          
          <div className="flex items-center justify-between py-4 border-b border-white/10">
            <div>
              <p className="text-[14px] font-bold text-white">Push Notifications</p>
              <p className="text-[12px] text-on-surface-variant mt-1">Receive alerts for bookings and messages</p>
            </div>
            <div className="w-12 h-6 bg-white/5 rounded-full relative cursor-not-allowed border border-white/10">
              <div className="w-4 h-4 bg-on-surface-variant/50 rounded-full absolute right-1 top-1"></div>
            </div>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-white/10">
            <div>
              <p className="text-[14px] font-bold text-white">Email Updates</p>
              <p className="text-[12px] text-on-surface-variant mt-1">Promotions and news from Jaaduwrld</p>
            </div>
            <div className="w-12 h-6 bg-white/5 rounded-full relative cursor-not-allowed border border-white/10">
              <div className="w-4 h-4 bg-on-surface-variant/50 rounded-full absolute left-1 top-1 shadow-sm"></div>
            </div>
          </div>


        </div>

        <div className="glass-panel rounded-2xl p-6 border border-red-500/20 bg-red-500/5">
          <h3 className="text-[12px] font-bold text-red-400 tracking-widest uppercase mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            Danger Zone
          </h3>
          <p className="text-[12px] text-on-surface-variant mb-6 leading-relaxed">Once you delete your account, there is no going back. Please be certain.</p>
          <button className="text-[14px] font-bold text-background bg-red-400 hover:bg-red-500 transition-colors py-3 px-6 rounded-full w-full shadow-[0_0_15px_rgba(248,113,113,0.4)] active:scale-95">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
