'use client';
// Force cache invalidation

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { subscribeToUserBookings, cancelBooking, type Booking } from '@/lib/firestore';
import { formatTime, formatPrice, getCategoryLabel } from '@/lib/utils';

const getMaterialIcon = (category: string) => {
  switch (category) {
    case 'pool': return 'sports_baseball';
    case 'snooker': return 'sports_esports';
    case 'ps5': return 'videogame_asset';
    case 'food': return 'restaurant';
    default: return 'sports_esports';
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
  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

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

  // Booking Reminders — check every minute for upcoming slots
  useEffect(() => {
    if (bookings.length === 0) return;

    const checkReminders = () => {
      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      bookings
        .filter(b => b.date === todayStr && ['approved', 'confirmed'].includes(b.status))
        .forEach(b => {
          const bookingMinutes = b.startTime * 60;
          const diff = bookingMinutes - currentMinutes;
          if (diff > 0 && diff <= 30) {
            const key = `reminder-${b.id}`;
            if (!sessionStorage.getItem(key)) {
              sessionStorage.setItem(key, 'true');
              toast(`⏰ Your ${b.assetName} session starts in ${diff} minutes!`, { duration: 6000, style: { background: '#131314', color: '#ddb7ff', border: '1px solid rgba(221,183,255,0.2)' } });
            }
          }
        });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [bookings]);

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

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#0A0A0B',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `jaaduwrld-receipt-${receiptBooking?.id?.slice(0, 6)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Receipt downloaded!', { style: { background: '#131314', color: '#44e2cd' }});
    } catch {
      toast.error('Could not download receipt');
    }
  };

  const handleShareReceipt = async () => {
    if (!receiptBooking) return;
    const text = `🎮 Jaaduwrld Receipt\n${receiptBooking.assetName}\n📅 ${receiptBooking.date}\n⏰ ${formatTime(receiptBooking.startTime)} - ${formatTime(receiptBooking.endTime)}\n💰 ${formatPrice(receiptBooking.totalAmount)}\nStatus: ${receiptBooking.status.toUpperCase()}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Jaaduwrld Receipt', text });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Receipt copied to clipboard!');
    }
  };

  const now = new Date();
  const isPast = (b: Booking) => {
    if (b.status === 'completed' || b.status === 'cancelled' || b.status === 'rejected') return true;
    const endDate = new Date(b.date + 'T00:00:00');
    endDate.setHours(b.endTime === 24 ? 23 : b.endTime, b.endTime === 24 ? 59 : 0, 0, 0);
    return endDate < now;
  };

  const upcomingBookings = bookings.filter((b) => !isPast(b));
  const pastBookings = bookings.filter((b) => isPast(b));

  return (
    <div className="min-h-dvh bg-[#0A0A0B] text-on-surface font-body-md selection:bg-primary/30">
      
      {/* TopAppBar */}
      <header className="fixed top-0 w-full bg-surface/10 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm flex justify-between items-center px-gutter py-md z-50 max-w-container-max mx-auto">
        <div className="flex items-center gap-sm cursor-pointer" onClick={() => router.push('/home')}>
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-surface-container flex items-center justify-center">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-on-surface-variant">person</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center pt-1">
          <div className="font-display-md text-[24px] tracking-tighter text-on-surface font-bold header-glow leading-none">
            Jaaduwrld
          </div>
          <div className="text-[9px] font-bold tracking-[0.2em] text-primary uppercase mt-1">Art and Arcade</div>
        </div>
        <a 
          href="https://maps.google.com/?q=325+Jai+Nagar+Rd+near+Indore+Sweet+Labour+Chowk+Yadav+Colony+Jabalpur+New+Adaresh+Colony+Madhya+Pradesh+482002"
          target="_blank"
          rel="noreferrer"
          className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-primary hover:bg-white/10 transition-colors active:scale-95 duration-200 shadow-[0_0_15px_rgba(221,183,255,0.2)]"
        >
          <span className="material-symbols-outlined neon-text-primary text-[20px]">location_on</span>
        </a>
      </header>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-24 left-4 right-4 z-50 glass-panel border border-secondary/50 neon-glow-secondary p-4 rounded-2xl flex items-center gap-3 animate-slide-up">
          <span className="material-symbols-outlined text-secondary">check_circle</span>
          <div>
            <p className="font-bold text-sm text-secondary">Booking Requested! 🕒</p>
            <p className="text-xs text-on-surface-variant mt-0.5">Your request is pending admin approval.</p>
          </div>
        </div>
      )}

      <main className="pt-[100px] px-gutter max-w-container-max mx-auto md:px-xl pb-32">
        <div className="mb-lg">
          <h2 className="font-headline-lg text-[32px] font-bold text-on-surface mb-xs">My Bookings</h2>
          <p className="font-body-md text-[16px] text-on-surface-variant">Manage your arcade reservations.</p>
        </div>

        <div className="space-y-8">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card h-[120px] rounded-2xl animate-pulse bg-white/5" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-[64px] text-primary/50 mb-4">sports_esports</span>
              <p className="text-base font-bold text-on-surface">No bookings yet</p>
              <p className="text-sm text-on-surface-variant mt-1">Book your first slot to get started!</p>
              <button
                onClick={() => router.replace('/home')}
                className="btn-gradient rounded-full px-8 py-3 font-bold text-[14px] text-background mt-6 neon-glow-primary active:scale-95 transition-all"
              >
                Browse Activities
              </button>
            </div>
          ) : (
            <>
              {/* Upcoming */}
              {upcomingBookings.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-4">
                    Upcoming ({upcomingBookings.length})
                  </h3>
                  <motion.div 
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1 }
                      }
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {upcomingBookings.map((booking) => (
                      <motion.div 
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          show: { opacity: 1, y: 0 }
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        key={booking.id} 
                        className="glass-card p-4 rounded-xl relative overflow-hidden group border border-primary/20 hover:border-primary/50 transition-colors cursor-pointer"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-secondary"></div>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center shrink-0 text-primary">
                              <span className="material-symbols-outlined">{getMaterialIcon(booking.category)}</span>
                            </div>
                            <div>
                              <p className="text-[16px] font-bold text-on-surface">{booking.assetName}</p>
                              <p className="text-[12px] text-on-surface-variant mt-0.5">
                                {getCategoryLabel(booking.category)}
                              </p>
                              <div className="flex items-center gap-3 mt-3">
                                <span className="flex items-center gap-1 text-[12px] text-on-surface-variant">
                                  <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                                  {format(new Date(booking.date + 'T00:00:00'), 'dd MMM yyyy')}
                                </span>
                                <span className="flex items-center gap-1 text-[12px] text-on-surface-variant">
                                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                                  {formatTime(booking.startTime)} - {formatTime(booking.endTime === 24 ? 0 : booking.endTime)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-3">
                                <p className="text-[14px] font-bold text-primary">
                                  {formatPrice(booking.totalAmount)}
                                </p>
                                {booking.status === 'pending' && (
                                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                    Pending Approval
                                  </span>
                                )}
                                {booking.status === 'approved' && (
                                  <span className="px-2 py-0.5 bg-secondary/20 text-secondary border border-secondary/30 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                    Approved
                                  </span>
                                )}
                                {booking.status === 'confirmed' && (
                                  <span className="px-2 py-0.5 bg-secondary/20 text-secondary border border-secondary/30 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                    Confirmed
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            <button
                              onClick={() => setReceiptBooking(booking)}
                              className="p-2 rounded-full hover:bg-white/10 transition-colors text-on-surface-variant hover:text-primary"
                            >
                              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                            </button>
                            <button
                              onClick={() => handleCancel(booking.id)}
                              disabled={cancellingId === booking.id}
                              className="p-2 rounded-full hover:bg-red-500/20 transition-colors text-on-surface-variant hover:text-red-400"
                            >
                              {cancellingId === booking.id ? (
                                <span className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
                              ) : (
                                <span className="material-symbols-outlined text-[20px]">close</span>
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Past */}
              {pastBookings.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">
                    Past ({pastBookings.length})
                  </h3>
                  <motion.div 
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1 }
                      }
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {pastBookings.map((booking) => (
                      <motion.div 
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          show: { opacity: 1, y: 0 }
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        key={booking.id} 
                        className="glass-card p-4 rounded-xl relative overflow-hidden opacity-80 hover:opacity-100 transition-opacity cursor-pointer border border-white/5"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center shrink-0 text-on-surface-variant">
                              <span className="material-symbols-outlined">{getMaterialIcon(booking.category)}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-[16px] font-bold text-on-surface">{booking.assetName}</p>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  booking.status === 'cancelled' || booking.status === 'rejected'
                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                    : 'bg-white/5 text-on-surface-variant border-white/10'
                                }`}>
                                  {booking.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="flex items-center gap-1 text-[12px] text-on-surface-variant">
                                  <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                                  {format(new Date(booking.date + 'T00:00:00'), 'dd MMM yyyy')}
                                </span>
                                <span className="flex items-center gap-1 text-[12px] text-on-surface-variant">
                                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                                  {formatTime(booking.startTime)} - {formatTime(booking.endTime === 24 ? 0 : booking.endTime)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setReceiptBooking(booking)}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors text-on-surface-variant hover:text-white"
                          >
                            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Receipt Modal */}
      <AnimatePresence>
        {receiptBooking && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 overflow-y-auto" 
            onClick={() => setReceiptBooking(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
              className="w-full flex flex-col items-center justify-center" 
              onClick={e => e.stopPropagation()}
            >
            {/* Printable receipt area */}
            <div ref={receiptRef} className="bg-[#131314] rounded-[2rem] p-8 shadow-2xl relative overflow-hidden border border-white/10 w-[320px] shrink-0">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-secondary"></div>
              
              <div className="text-center mb-8 mt-2">
                <h2 className="text-[28px] font-display-md font-bold text-white tracking-tight">Jaaduwrld</h2>
                <p className="text-[10px] text-primary font-bold tracking-[0.2em] uppercase mt-1">Digital Pass</p>
              </div>

              <div className="border-t border-dashed border-white/20 my-6" />

              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[12px] text-on-surface-variant font-medium whitespace-nowrap">Asset</span>
                  <span className="text-[14px] font-bold text-white text-right">{receiptBooking.assetName}</span>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[12px] text-on-surface-variant font-medium whitespace-nowrap">Category</span>
                  <span className="text-[14px] font-bold text-white text-right">{getCategoryLabel(receiptBooking.category)}</span>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[12px] text-on-surface-variant font-medium whitespace-nowrap">Date</span>
                  <span className="text-[14px] font-bold text-white text-right">{format(new Date(receiptBooking.date + 'T00:00:00'), 'dd MMM yyyy')}</span>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[12px] text-on-surface-variant font-medium whitespace-nowrap">Time</span>
                  <span className="text-[14px] font-bold text-secondary text-right">{formatTime(receiptBooking.startTime)} — {formatTime(receiptBooking.endTime)}</span>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[12px] text-on-surface-variant font-medium whitespace-nowrap">Status</span>
                  <span className={`text-[12px] font-bold uppercase px-2 py-1 rounded-full text-right ${
                    receiptBooking.status === 'approved' || receiptBooking.status === 'confirmed' ? 'bg-secondary/20 text-secondary' :
                    receiptBooking.status === 'cancelled' || receiptBooking.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-300'
                  }`}>{receiptBooking.status}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-white/20 my-6" />

              <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                <span className="text-[14px] font-bold text-on-surface-variant">Total</span>
                <span className="text-[24px] font-black text-primary">{formatPrice(receiptBooking.totalAmount)}</span>
              </div>

              <p className="text-[10px] text-on-surface-variant/50 text-center mt-6 font-mono">ID: {receiptBooking.id}</p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 mt-6 w-[320px]">
              <button
                onClick={handleDownloadReceipt}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">download</span> Download
              </button>
              <button
                onClick={handleShareReceipt}
                className="flex-1 py-3 bg-primary text-background hover:bg-primary/90 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_15px_rgba(221,183,255,0.4)]"
              >
                <span className="material-symbols-outlined text-[18px]">share</span> Share
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-[#0A0A0B] p-6 pt-24">
        <div className="glass-panel h-8 w-40 mb-6 rounded-lg animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card h-[120px] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <BookingsContent />
    </Suspense>
  );
}
