'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings } from 'lucide-react';

export default function SettingsPage() {
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
            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Settings</h1>
            <p className="text-[12px] md:text-[13px] text-gray-500 font-medium mt-0.5">
              Manage your preferences
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto mt-4 space-y-4">
        <div className="bg-white rounded-[1.5rem] p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Account Preferences</h3>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-bold text-gray-900">Push Notifications</p>
              <p className="text-xs text-gray-500">Receive alerts for bookings and messages</p>
            </div>
            <div className="w-12 h-6 bg-[#111111] rounded-full relative cursor-not-allowed opacity-50">
              <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-bold text-gray-900">Email Updates</p>
              <p className="text-xs text-gray-500">Promotions and news from ArcadeZone</p>
            </div>
            <div className="w-12 h-6 bg-gray-200 rounded-full relative cursor-not-allowed opacity-50">
              <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1 shadow-sm"></div>
            </div>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-bold text-gray-900">Dark Mode</p>
              <p className="text-xs text-gray-500">The app natively follows your system theme</p>
            </div>
            <div className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-500">Auto</div>
          </div>
        </div>

        <div className="bg-white rounded-[1.5rem] p-6 shadow-sm">
          <h3 className="text-sm font-bold text-red-600 mb-2">Danger Zone</h3>
          <p className="text-xs text-gray-500 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
          <button className="text-sm font-bold text-red-600 bg-red-50 px-4 py-2 rounded-full w-full">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
