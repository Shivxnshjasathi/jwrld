'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Calendar, Clock, X, CheckCircle2, CircleDashed, Target, Gamepad2, Utensils } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { subscribeToUserBookings, cancelBooking, type Booking } from '@/lib/firestore';
import { formatTime, formatPrice, getCategoryLabel } from '@/lib/utils';

const getLucideIcon = (category: string) => {
  switch (category) {
    case 'pool': return <CircleDashed size={20} className="text-gray-900" />;
    case 'snooker': return <Target size={20} className="text-gray-900" />;
    case 'ps5': return <Gamepad2 size={20} className="text-gray-900" />;
    case 'food': return <Utensils size={20} className="text-gray-900" />;
    default: return <CircleDashed size={20} className="text-gray-900" />;
  }
};

function BookingsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserBookings(user.uid, (data) => {
      setBookings(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
      );
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
    setCancellingId(null);
  };

  const upcomingBookings = bookings.filter((b) => b.status === 'pending' || b.status === 'approved' || b.status === 'confirmed');
  const pastBookings = bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled' || b.status === 'rejected');

  return (
    <div className="min-h-dvh bg-[#F5F5F5]">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-[#111111] text-white p-4 rounded-[2rem] shadow-lg flex items-center gap-3 animate-slide-up">
          <CheckCircle2 size={22} className="text-white" />
          <div>
            <p className="font-bold text-sm">Booking Requested! 🕒</p>
            <p className="text-xs opacity-90 mt-0.5">Your request is pending admin approval.</p>
          </div>
        </div>
      )}

      <div className="px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
      </div>

      <div className="px-6 space-y-4 pb-32">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-[120px] rounded-2xl" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🎮</p>
            <p className="text-base font-semibold text-arcade-text">No bookings yet</p>
            <p className="text-sm text-arcade-text-muted mt-1">
              Book your first slot to get started!
            </p>
            <button
              onClick={() => router.push('/home')}
              className="btn-green mt-6 !w-auto !px-8 mx-auto"
            >
              Browse Activities
            </button>
          </div>
        ) : (
          <>
            {/* Upcoming */}
            {upcomingBookings.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-arcade-text-muted uppercase tracking-wider mb-3">
                  Upcoming ({upcomingBookings.length})
                </h2>
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <div key={booking.id} className="checkout-card animate-fade-in">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center shrink-0">
                            {getLucideIcon(booking.category)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-arcade-text">{booking.assetName}</p>
                            <p className="text-xs text-arcade-text-muted mt-0.5">
                              {getCategoryLabel(booking.category)}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="flex items-center gap-1 text-xs text-arcade-text-secondary">
                                <Calendar size={12} />
                                {format(new Date(booking.date + 'T00:00:00'), 'dd MMM yyyy')}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-arcade-text-secondary">
                                <Clock size={12} />
                                {formatTime(booking.startTime)} - {formatTime(booking.endTime === 24 ? 0 : booking.endTime)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <p className="text-sm font-bold text-arcade-text">
                                {formatPrice(booking.totalAmount)}
                              </p>
                              {booking.status === 'pending' && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                  Pending Approval
                                </span>
                              )}
                              {booking.status === 'approved' && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                  Approved
                                </span>
                              )}
                              {booking.status === 'confirmed' && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                  Confirmed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="p-2 rounded-full hover:bg-red-50 transition-colors"
                        >
                          {cancellingId === booking.id ? (
                            <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
                          ) : (
                            <X size={16} className="text-red-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past */}
            {pastBookings.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-arcade-text-muted uppercase tracking-wider mb-3">
                  Past ({pastBookings.length})
                </h2>
                <div className="space-y-3">
                  {pastBookings.map((booking) => (
                    <div key={booking.id} className="checkout-card opacity-60">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center shrink-0">
                          {getLucideIcon(booking.category)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-arcade-text">{booking.assetName}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              booking.status === 'cancelled'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-1 text-xs text-arcade-text-muted">
                              <Calendar size={12} />
                              {format(new Date(booking.date + 'T00:00:00'), 'dd MMM yyyy')}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-arcade-text-muted">
                              <Clock size={12} />
                              {formatTime(booking.startTime)} - {formatTime(booking.endTime === 24 ? 0 : booking.endTime)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-[#F5F5F5] p-6">
        <div className="skeleton h-8 w-40 mb-6 mt-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-[120px] rounded-2xl" />
          ))}
        </div>
      </div>
    }>
      <BookingsContent />
    </Suspense>
  );
}
