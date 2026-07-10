'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function SettingsPage() {
  const router = useRouter();
  const { darkMode, toggleDarkMode } = useAppStore();

  return (
    <div className="min-h-dvh bg-[#F5F5F5]">
      <div className="bg-[#F5F5F5] px-6 pt-12 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} className="text-[#1a1a1a]" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Settings</h1>
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
            <div className="flex items-center gap-3">
              {darkMode ? <Moon size={18} className="text-gray-900" /> : <Sun size={18} className="text-gray-900" />}
              <div>
                <p className="text-sm font-bold text-gray-900">Dark Mode</p>
                <p className="text-xs text-gray-500">{darkMode ? 'Dark theme active' : 'Light theme active'}</p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${
                darkMode ? 'bg-[#111111]' : 'bg-gray-200'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all duration-300 ${
                  darkMode ? 'right-1' : 'left-1'
                }`}
              />
            </button>
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
