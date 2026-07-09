'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { verifyOTP } from '@/lib/auth';

function VerifyContent() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '';

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (newOtp.every((d) => d !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);

    if (newOtp.every((d) => d !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleVerify = async (code: string) => {
    setLoading(true);
    setError('');

    const user = await verifyOTP(code);
    if (user) {
      router.replace('/home');
    } else {
      setError('Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 pt-4 pb-2">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft size={22} className="text-arcade-text" />
        </button>
      </div>

      <div className="flex-1 px-6 pt-4">
        <h1 className="text-2xl font-bold text-arcade-text">Verify OTP</h1>
        <p className="text-sm text-arcade-text-muted mt-2">
          We&apos;ve sent a 6-digit code to{' '}
          <span className="font-semibold text-arcade-text">{phone}</span>
        </p>

        {/* OTP Input */}
        <div className="flex justify-center gap-3 mt-10" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="otp-input"
              disabled={loading}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mt-4 font-medium animate-scale-in">
            {error}
          </p>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 mt-6 text-arcade-green">
            <span className="w-5 h-5 border-2 border-arcade-green border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Verifying...</span>
          </div>
        )}

        {/* Resend */}
        <div className="text-center mt-8">
          {countdown > 0 ? (
            <p className="text-sm text-arcade-text-muted">
              Resend OTP in <span className="font-semibold text-arcade-text">{countdown}s</span>
            </p>
          ) : (
            <button
              onClick={() => {
                setCountdown(30);
                // Re-trigger OTP send
              }}
              className="text-sm font-semibold text-arcade-green"
            >
              Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-3 border-arcade-green border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
