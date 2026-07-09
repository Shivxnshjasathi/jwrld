'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPage() {
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
            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Privacy Policy</h1>
            <p className="text-[12px] md:text-[13px] text-gray-500 font-medium mt-0.5">
              How we handle your data
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto mt-4 space-y-4">
        <div className="bg-white rounded-[1.5rem] p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-2">1. Information We Collect</h3>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            We collect information you provide directly to us, such as when you create or modify your account, request services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, profile picture, and payment method.
          </p>
          <h3 className="text-sm font-bold text-gray-900 mb-2">2. How We Use Your Information</h3>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            We use the information we collect to provide, maintain, and improve our services, including to facilitate bookings for arcade assets like Pool, Snooker, and PS5 stations. We also use it to process transactions and send related information, including confirmations and receipts.
          </p>
          <h3 className="text-sm font-bold text-gray-900 mb-2">3. Data Security</h3>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage. Your data is securely encrypted in transit and at rest.
          </p>
          <h3 className="text-sm font-bold text-gray-900 mb-2">4. Sharing of Information</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            We do not share your personal information with third parties except as necessary to provide our services (e.g., payment processors), comply with the law, or protect our rights.
          </p>
        </div>
      </div>
    </div>
  );
}
