'use client';

import { useAppNavigation } from '@/hooks/use-app-navigation';

export default function HelpPage() {
  const { goBack } = useAppNavigation();

  return (
    <div className="min-h-dvh bg-[#0A0A0B] text-on-surface selection:bg-primary/30 pb-24 font-body-md relative overflow-hidden">
      {/* Background Glow */}
      <div className="ambient-glow"></div>

      {/* Header */}
      <div className="bg-surface/10 px-6 pt-12 pb-6 sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-4 max-w-[1280px] mx-auto">
          <button
            onClick={() => goBack('/profile')}
            className="w-10 h-10 shrink-0 bg-white/5 rounded-full flex items-center justify-center border border-white/5 hover:bg-white/10 transition-colors active:scale-95 text-on-surface-variant hover:text-primary"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-[20px] font-bold text-white tracking-tight header-glow">Help & Support</h1>
            <p className="text-[11px] text-primary font-bold tracking-widest uppercase mt-1">
              Get assistance with your account
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 max-w-[1280px] mx-auto mt-2 space-y-6 relative z-10">
        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <h3 className="text-[12px] font-bold text-primary tracking-widest uppercase mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">book_online</span>
            Booking & Cancellations
          </h3>
          <p className="text-[12px] text-on-surface-variant leading-relaxed mb-6">
            <strong className="text-white block mb-1">How do I make a booking?</strong>
            Navigate to the home screen, select the asset you want (e.g., 8-Ball Pool), pick a date and time slot, and tap "Book". You can view all your active bookings in the "My Bookings" tab.
          </p>
          <p className="text-[12px] text-on-surface-variant leading-relaxed">
            <strong className="text-white block mb-1">Can I cancel my booking?</strong>
            Yes, bookings can be cancelled up to 2 hours before the scheduled time slot. Go to "My Bookings", select the booking, and tap "Cancel".
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <h3 className="text-[12px] font-bold text-primary tracking-widest uppercase mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
            Account & Support
          </h3>
          <p className="text-[12px] text-on-surface-variant leading-relaxed mb-6">
            <strong className="text-white block mb-1">How do I reset my password?</strong>
            If you are logged out, click "Forgot Password" on the login screen. If you are logged in, you can update your password in the Settings menu.
          </p>
          <p className="text-[12px] text-on-surface-variant leading-relaxed">
            <strong className="text-white block mb-1">Need further assistance?</strong>
            You can message the admin directly by tapping the Message icon on the top right of the home screen. We'll get back to you immediately during operating hours!
          </p>
        </div>
      </div>
    </div>
  );
}
