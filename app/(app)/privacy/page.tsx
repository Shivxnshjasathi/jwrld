'use client';

import { useAppNavigation } from '@/hooks/use-app-navigation';
export default function PrivacyPage() {
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
            <h1 className="text-[20px] font-bold text-white tracking-tight header-glow">Privacy Policy</h1>
            <p className="text-[11px] text-primary font-bold tracking-widest uppercase mt-1">
              How we handle your data
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 max-w-[1280px] mx-auto mt-2 space-y-6 relative z-10">
        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <h3 className="text-[14px] font-bold text-white mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">policy</span>
            1. Information We Collect
          </h3>
          <p className="text-[12px] text-on-surface-variant leading-relaxed mb-6">
            We collect information you provide directly to us, such as when you create or modify your account, request services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, profile picture, and payment method.
          </p>
          
          <h3 className="text-[14px] font-bold text-white mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">data_usage</span>
            2. How We Use Your Information
          </h3>
          <p className="text-[12px] text-on-surface-variant leading-relaxed mb-6">
            We use the information we collect to provide, maintain, and improve our services, including to facilitate bookings for arcade assets like 8-Ball Pool, Snooker, and PS5 stations. We also use it to process transactions and send related information, including confirmations and receipts.
          </p>
          
          <h3 className="text-[14px] font-bold text-white mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">encrypted</span>
            3. Data Security
          </h3>
          <p className="text-[12px] text-on-surface-variant leading-relaxed mb-6">
            We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage. Your data is securely encrypted in transit and at rest.
          </p>
          
          <h3 className="text-[14px] font-bold text-white mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">share</span>
            4. Sharing of Information
          </h3>
          <p className="text-[12px] text-on-surface-variant leading-relaxed">
            We do not share your personal information with third parties except as necessary to provide our services (e.g., payment processors), comply with the law, or protect our rights.
          </p>
        </div>
      </div>
    </div>
  );
}
