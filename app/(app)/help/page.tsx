'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, HelpCircle } from 'lucide-react';

export default function HelpPage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-[#F5F5F5] pb-24">
      {/* Header */}
      <div className="bg-[#F5F5F5] px-4 md:px-6 pt-12 pb-6 sticky top-0 z-10 border-b border-gray-200">
        <div className="flex items-center gap-3 max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 shrink-0 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100"
          >
            <ArrowLeft size={20} className="text-gray-900" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Help & Support</h1>
            <p className="text-[12px] md:text-[13px] text-gray-500 font-medium mt-0.5">
              Get assistance with your account
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto mt-4 space-y-4">
        <div className="bg-white rounded-[1.5rem] p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Booking & Cancellations</h3>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            <strong>How do I make a booking?</strong><br/>
            Navigate to the home screen, select the asset you want (e.g., Pool Table), pick a date and time slot, and tap &quot;Book&quot;. You can view all your active bookings in the &quot;My Bookings&quot; tab.
          </p>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            <strong>Can I cancel my booking?</strong><br/>
            Yes, bookings can be cancelled up to 2 hours before the scheduled time slot. Go to &quot;My Bookings&quot;, select the booking, and tap &quot;Cancel&quot;.
          </p>
        </div>

        <div className="bg-white rounded-[1.5rem] p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Account & Support</h3>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            <strong>How do I reset my password?</strong><br/>
            If you are logged out, click &quot;Forgot Password&quot; on the login screen. If you are logged in, you can update your password in the Settings menu.
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong>Need further assistance?</strong><br/>
            You can message the admin directly by tapping the Message icon on the top right of the home screen. We&apos;ll get back to you immediately during operating hours!
          </p>
        </div>
      </div>
    </div>
  );
}
