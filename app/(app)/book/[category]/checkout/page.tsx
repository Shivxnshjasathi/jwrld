'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X, ChevronRight, Shield, Tag } from 'lucide-react';
import { format, parse, isToday, isTomorrow, addDays } from 'date-fns';
import { useBookingStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { createBooking } from '@/lib/firestore';
import { formatTime, formatPrice, getCategoryLabel } from '@/lib/utils';

export default function CheckoutPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  const router = useRouter();
  const store = useBookingStore();
  const { user, appUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState('');

  const totalAmount = store.getTotalAmount();
  const selectedDate = new Date(store.selectedDate + 'T00:00:00');

  const getDateLabel = () => {
    if (isToday(selectedDate)) return 'TODAY';
    if (isTomorrow(selectedDate)) return 'TOMORROW';
    return format(selectedDate, 'EEE, dd MMM').toUpperCase();
  };

  const handleRemoveBooking = () => {
    store.clearAsset();
    router.back();
  };

  const handleApplyCoupon = () => {
    if (couponCode.toLowerCase() === 'arcade10') {
      store.applyCoupon(22.5);
      setShowCouponInput(false);
    }
  };

  const handlePayment = async () => {
    if (!user || !store.selectedAssetId) return;

    setLoading(true);
    setError('');

    try {
      await createBooking({
        userId: user.uid,
        userName: appUser?.name || 'Player',
        assetId: store.selectedAssetId,
        assetName: store.selectedAssetName || '',
        category,
        date: store.selectedDate,
        startTime: store.startTime,
        endTime: store.endTime,
        totalAmount,
        status: 'pending',
        createdAt: new Date().toISOString(),
        protection: store.protection,
      });

      store.reset();
      router.replace('/bookings?success=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    }
    setLoading(false);
  };

  if (!store.selectedAssetId) {
    router.back();
    return null;
  }

  return (
    <div className="min-h-dvh bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-[#F5F5F5] px-6 pt-12 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} className="text-[#1a1a1a]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Checkout</h1>
            <p className="text-[11px] text-gray-500 font-medium">ArcadeZone</p>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-4 pb-32">
        {/* Booking Summary Card */}
        <div className="checkout-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-base font-bold text-arcade-text">
                {getDateLabel()}, {formatTime(store.startTime)} - {formatTime(store.endTime === 24 ? 0 : store.endTime)}
              </p>
              <p className="text-sm text-arcade-text-secondary mt-1">
                {store.selectedAssetName}
              </p>
            </div>
            <button
              onClick={handleRemoveBooking}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X size={16} className="text-arcade-text-muted" />
            </button>
          </div>
        </div>

        {/* Apply Coupon */}
        <div className="checkout-card">
          <button
            onClick={() => setShowCouponInput(!showCouponInput)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                <Tag size={16} className="text-[#111111]" />
              </div>
              <span className="text-sm font-semibold text-gray-900">Apply Coupon</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </button>

          {showCouponInput && (
            <div className="mt-4 flex gap-2 animate-fade-in">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="flex-1 px-4 py-3 bg-[#F5F5F5] rounded-full text-sm font-medium focus:ring-2 focus:ring-black focus:outline-none transition-colors"
              />
              <button
                onClick={handleApplyCoupon}
                className="px-6 py-3 bg-[#111111] text-white rounded-full text-sm font-bold"
              >
                Apply
              </button>
            </div>
          )}

          {store.couponDiscount > 0 && (
            <div className="mt-4 bg-[#F5F5F5] rounded-xl px-4 py-3 animate-scale-in">
              <p className="text-xs font-semibold text-[#111111]">
                🎉 Wohoo! you can avail {store.couponDiscount} off
              </p>
            </div>
          )}
        </div>

        {/* Total Amount */}
        <div className="checkout-card">
          <button className="flex items-center justify-between w-full">
            <div>
              <p className="text-sm font-bold text-gray-900 tracking-wide">TOTAL AMOUNT</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-gray-900">{formatPrice(totalAmount)}</span>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
          </button>
        </div>

        {/* Reschedule Policy */}
        <div className="checkout-card">
          <h3 className="text-sm font-bold text-gray-900 tracking-wide mb-2">
            RESCHEDULE POLICIES
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Rescheduling is allowed 1.0 Hour prior to slot time. Rescheduling of a booking can be done
            only 3 times. Once resch...
            <button className="text-gray-900 font-bold ml-1">See More</button>
          </p>
        </div>

        {/* Cancellation Policy */}
        <div className="checkout-card">
          <h3 className="text-sm font-bold text-gray-900 tracking-wide mb-2">
            CANCELLATION POLICY
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Cancellation is allowed up to 2 hours before the slot. A cancellation fee of 10% will be charged.
            Refund will be credited...
            <button className="text-gray-900 font-bold ml-1">See More</button>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm font-medium p-4 rounded-2xl animate-scale-in">
            {error}
          </div>
        )}
      </div>

      {/* Sticky Pay Button */}
      <div className="fixed bottom-6 left-0 right-0 px-6 z-10 pointer-events-none">
        <button
          onClick={handlePayment}
          disabled={loading}
          className="btn-green pointer-events-auto shadow-lg shadow-black/10"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            `PAY ${formatPrice(totalAmount)}`
          )}
        </button>
      </div>
    </div>
  );
}
