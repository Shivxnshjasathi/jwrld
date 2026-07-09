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

      <div className="p-4 md:p-6 max-w-7xl mx-auto mt-4">
        <div className="bg-white rounded-[1.5rem] p-8 shadow-sm text-center">
          <Settings size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Settings Overview</h2>
          <p className="text-gray-500 text-sm">
            This is a placeholder page for Settings. Future updates will include profile editing, notification preferences, and account management.
          </p>
        </div>
      </div>
    </div>
  );
}
