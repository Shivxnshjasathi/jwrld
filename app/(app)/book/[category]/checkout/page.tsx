'use client';

import { useState, use, useEffect } from 'react';
import { useSound } from '@/hooks/use-sound';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { format, isToday, isTomorrow } from 'date-fns';
import { useBookingStore } from '@/lib/store';
import { useAuth, signInAsGuest } from '@/lib/auth';
import { createBooking, validateCoupon, incrementCouponUsage, getGlobalSettings } from '@/lib/firestore';
import { formatTime, formatPrice } from '@/lib/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';

export default function CheckoutPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  const { goBack, push, replace } = useAppNavigation();
  const store = useBookingStore();
  const { user, appUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'counter' | 'upi'>('counter');
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const { playSuccess } = useSound();

  useEffect(() => {
    getGlobalSettings().then(setGlobalSettings).catch(console.error);
  }, []);
  
  // Guest details state
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  
  // Split with friends
  const [splitWith, setSplitWith] = useState<string[]>([]);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [friendsList, setFriendsList] = useState<any[]>([]);

  useEffect(() => {
    if (!appUser?.friends?.length) return;
    const { collection, query, where, getDocs } = require('firebase/firestore');
    const { getFirebaseDb } = require('@/lib/firebase');
    const fetchFriends = async () => {
      const db = getFirebaseDb();
      try {
        const friendsData = [];
        for (const fUid of appUser.friends!) {
          const docSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', fUid)));
          if (!docSnap.empty) {
            friendsData.push(docSnap.docs[0].data());
          }
        }
        setFriendsList(friendsData);
      } catch (err) {}
    };
    fetchFriends();
  }, [appUser?.friends]);
  
  // Global settings
  const [allowGuest, setAllowGuest] = useState(false);
  const [globalSettingsLoading, setGlobalSettingsLoading] = useState(true);

  // Expandable policies state
  const [expandReschedule, setExpandReschedule] = useState(false);
  const [expandCancel, setExpandCancel] = useState(false);
  const [showTotalBreakdown, setShowTotalBreakdown] = useState(false);

  // Load global settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getGlobalSettings();
        setAllowGuest(settings.allowGuestBooking);
      } catch (e) {
        console.error('Failed to load global settings', e);
      }
      setGlobalSettingsLoading(false);
    };
    fetchSettings();
  }, []);

  const isVIP = appUser?.isVIP && appUser?.vipUntil && new Date(appUser.vipUntil) > new Date();
  const duration = store.endTime - store.startTime;
  const basePrice = (store.selectedAssetPrice || 0) * duration;
  const vipDiscount = isVIP ? Math.round(basePrice * 0.15) : 0;

  const totalAmount = Math.max(0, store.getTotalAmount() - vipDiscount);
  const selectedDate = new Date(store.selectedDate + 'T00:00:00');

  const getDateLabel = () => {
    if (isToday(selectedDate)) return 'TODAY';
    if (isTomorrow(selectedDate)) return 'TOMORROW';
    return format(selectedDate, 'EEE, dd MMM').toUpperCase();
  };

  const handleRemoveBooking = () => {
    store.clearAsset();
    goBack('/home');
  };

  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null);

  const handleApplyCoupon = async () => {
    setLoading(true);
    setError('');
    try {
      const coupon = await validateCoupon(couponCode);
      if (coupon) {
        const duration = store.endTime - store.startTime;
        const basePrice = (store.selectedAssetPrice || 0) * duration;
        
        let discount = 0;
        if (coupon.discountType === 'percentage') {
          discount = basePrice * (coupon.discountValue / 100);
        } else {
          discount = coupon.discountValue;
        }
        
        // Don't discount more than base price
        discount = Math.min(discount, basePrice);
        
        store.applyCoupon(discount);
        setAppliedCouponId(coupon.id);
        setShowCouponInput(false);
      } else {
        setError('Invalid or expired coupon code');
      }
    } catch (err) {
      setError('Failed to validate coupon');
    }
    setLoading(false);
  };

  const handlePayment = async () => {
    console.log('[handlePayment] triggered. user:', !!user, 'selectedAssetId:', store.selectedAssetId, 'appUser:', !!appUser);
    
    if (!store.selectedAssetId) {
      setError('No asset selected. Please go back and select a table.');
      return;
    }

    if (!user || !appUser) {
      console.warn('[handlePayment] Aborting because user or appUser is missing.');
      // If we don't have user info, show guest modal if allowed, otherwise error
      if (allowGuest) {
        setShowGuestModal(true);
      } else {
        setError('Guest bookings are currently disabled. Please log in.');
      }
      return;
    }

    if (appUser.role === 'guest') {
      if (!allowGuest) {
        setError('Guest bookings are currently disabled. Please log in.');
        return;
      }
      setShowGuestModal(true);
      return;
    }

    await executeBooking(appUser.name);
  };

  const executeBooking = async (userName: string, uid?: string) => {
    const finalUid = uid || user?.uid;
    console.log('[executeBooking] triggered. userName:', userName, 'finalUid:', !!finalUid, 'selectedAssetId:', store.selectedAssetId);
    
    if (!finalUid || !store.selectedAssetId) {
      console.warn('[executeBooking] Aborting because finalUid or selectedAssetId is missing.');
      return;
    }

    const finalInvitedFriends = splitWith;
    const isInviting = finalInvitedFriends.length > 0;
    const shareToPay = totalAmount; // Booker pays full amount

    if (paymentMethod === 'wallet' && (appUser?.walletBalance || 0) < shareToPay) {
      setError(`Insufficient wallet balance (₹${shareToPay}).`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (paymentMethod === 'wallet') {
        const { deductWalletBalance } = await import('@/lib/wallet');
        await deductWalletBalance(finalUid, shareToPay);
      }

      if (appliedCouponId) {
        // Need current used count to increment
        const cpn = await validateCoupon(couponCode);
        if (cpn) {
          await incrementCouponUsage(cpn.id, cpn.usedCount);
        }
      }

      const bookingData: any = {
        userId: finalUid,
        userName: userName || 'Jaaduwrld Guest',
        assetId: store.selectedAssetId,
        assetName: store.selectedAssetName || '',
        category,
        date: store.selectedDate,
        startTime: store.startTime,
        endTime: store.endTime,
        totalAmount,
        status: paymentMethod === 'wallet' ? 'confirmed' : 'pending',
        paymentMethod,
        createdAt: new Date().toISOString(),
        protection: store.protection,
      };

      if (isInviting) {
        bookingData.invitedFriends = finalInvitedFriends;
        bookingData.splitWith = finalInvitedFriends;
        
        const statusMap: Record<string, string> = {};
        finalInvitedFriends.forEach((fId: string) => {
          statusMap[fId] = 'pending';
        });
        bookingData.splitStatus = statusMap;
      }

      await createBooking(bookingData);

      playSuccess();
      setShowSuccessModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    }
    setLoading(false);
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestPhone) {
      setError('Name and phone number are required.');
      return;
    }
    
    setLoading(true);
    try {
      const db = getFirebaseDb();
      let currentUid = user?.uid;
      
      // If user is not authenticated, sign them in anonymously as a guest
      if (!currentUid) {
        console.log('[handleGuestSubmit] User not authenticated. Signing in as guest...');
        const newUser = await signInAsGuest();
        if (!newUser) throw new Error('Failed to create guest session');
        currentUid = newUser.uid;
      }
      
      await updateDoc(doc(db, 'users', currentUid), {
        name: guestName,
        phone: guestPhone,
        role: 'customer'
      });
      setShowGuestModal(false);
      await executeBooking(guestName, currentUid);
    } catch (err) {
      setError('Failed to update details. Try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!store.selectedAssetId) {
      goBack('/home');
    }
  }, [store.selectedAssetId]);

  if (!store.selectedAssetId) {
    return null;
  }

  return (
    <div className="min-h-dvh bg-[#0A0A0B] text-on-surface font-body-md selection:bg-primary/30">
      
      {/* Header */}
      <header className="glass-panel sticky top-0 w-full z-50 flex items-center gap-4 px-gutter py-4 border-b border-outline-variant/20 shadow-sm bg-surface/10 backdrop-blur-xl">
        <button
          onClick={() => goBack('/home')}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-95 text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div>
          <h1 className="text-[16px] font-bold text-on-surface leading-tight header-glow">Checkout</h1>
          <p className="text-[10px] text-primary font-bold tracking-widest uppercase">Jaaduwrld</p>
        </div>
      </header>

      <div className="px-5 space-y-3 pt-4 pb-32">
        {/* Booking Summary Card */}
        <div className="glass-panel p-3 rounded-xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-secondary"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-[14px] font-bold text-white">
                {getDateLabel()}, {formatTime(store.startTime)} - {formatTime(store.endTime === 24 ? 0 : store.endTime)}
              </p>
              <p className="text-[12px] text-primary mt-0.5 font-bold">
                {store.selectedAssetName}
              </p>
            </div>
            <button
              onClick={handleRemoveBooking}
              className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500/20 transition-colors text-on-surface-variant hover:text-red-400"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        </div>

        {/* Apply Coupon */}
        <div className="glass-panel p-3 rounded-xl border border-white/10">
          <button
            onClick={() => setShowCouponInput(!showCouponInput)}
            className="flex items-center justify-between w-full text-on-surface hover:text-primary transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-container-high border border-white/5 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[16px]">local_offer</span>
              </div>
              <span className="text-[13px] font-bold">Apply Coupon</span>
            </div>
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>

          {showCouponInput && (
            <div className="mt-3 flex gap-2 animate-fade-in">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="flex-1 px-3 py-2 bg-[#050505] border border-white/10 rounded-lg text-[13px] font-bold text-white focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all placeholder:text-on-surface-variant/50 uppercase"
              />
              <button
                onClick={handleApplyCoupon}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[13px] font-bold border border-white/20 transition-all active:scale-95"
              >
                Apply
              </button>
            </div>
          )}

          {store.couponDiscount > 0 && (
            <div className="mt-3 bg-secondary/10 border border-secondary/30 rounded-lg px-3 py-2 flex items-center justify-between animate-scale-in">
              <p className="text-[11px] font-bold text-secondary flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">celebration</span>
                Wohoo! you can avail {store.couponDiscount} off
              </p>
              <button
                onClick={() => {
                  store.applyCoupon(0);
                  setAppliedCouponId(null);
                  setCouponCode('');
                }}
                className="text-[11px] text-error font-bold bg-error/10 px-2 py-1 rounded hover:bg-error/20 transition-colors"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="glass-panel p-3 rounded-xl border border-white/10">
          <h3 className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-3">PAYMENT METHOD</h3>
          <div className="flex flex-col gap-2">
            <label className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'wallet' ? 'border-primary/50 bg-primary/10 shadow-[0_0_15px_rgba(221,183,255,0.1)]' : 'border-white/5 bg-white/5 hover:border-white/20'}`}>
              <div className="flex items-center gap-3">
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  checked={paymentMethod === 'wallet'} 
                  onChange={() => setPaymentMethod('wallet')}
                  disabled={(appUser?.walletBalance || 0) < totalAmount}
                  className="w-4 h-4 text-primary focus:ring-primary accent-primary bg-background border-white/20" 
                />
                <div>
                  <span className="text-[13px] font-bold text-white block flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px] text-primary">account_balance_wallet</span>
                    Arcade Wallet
                  </span>
                  <span className={`text-[11px] font-bold mt-0.5 block ${((appUser?.walletBalance || 0) < totalAmount) ? 'text-red-400' : 'text-secondary'}`}>
                    Balance: {formatPrice(appUser?.walletBalance || 0)}
                  </span>
                </div>
              </div>
            </label>
            <label className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'counter' ? 'border-primary/50 bg-primary/10 shadow-[0_0_15px_rgba(221,183,255,0.1)]' : 'border-white/5 bg-white/5 hover:border-white/20'}`}>
              <div className="flex items-center gap-3">
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  checked={paymentMethod === 'counter'} 
                  onChange={() => setPaymentMethod('counter')}
                  className="w-4 h-4 text-primary focus:ring-primary accent-primary bg-background border-white/20" 
                />
                <span className="text-[13px] font-bold text-white block flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-primary">storefront</span>
                  Pay at Counter
                </span>
              </div>
            </label>
            {globalSettings?.upiId && (
              <label className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'upi' ? 'border-primary/50 bg-primary/10 shadow-[0_0_15px_rgba(221,183,255,0.1)]' : 'border-white/5 bg-white/5 hover:border-white/20'}`}>
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    checked={paymentMethod === 'upi'} 
                    onChange={() => setPaymentMethod('upi')}
                    className="w-4 h-4 text-primary focus:ring-primary accent-primary bg-background border-white/20" 
                  />
                  <span className="text-[13px] font-bold text-white block flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px] text-primary">qr_code_scanner</span>
                    Pay via UPI
                  </span>
                </div>
                {paymentMethod === 'upi' && (
                  <div className="mt-3 ml-7 p-3 bg-surface-container rounded-lg border border-primary/20">
                    <p className="text-[12px] text-white font-bold mb-1">UPI ID: <span className="text-primary tracking-wider">{globalSettings.upiId}</span></p>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Pay using the UPI ID above and send the payment screenshot & transaction details in the <strong className="text-secondary">support chat</strong> to confirm your booking.
                    </p>
                  </div>
                )}
              </label>
            )}
          </div>
        </div>

        {/* Total Amount */}
        <div className="glass-panel p-4 rounded-xl border border-white/10">
          <button 
            onClick={() => setShowTotalBreakdown(!showTotalBreakdown)}
            className="flex items-center justify-between w-full"
          >
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">TOTAL AMOUNT</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[18px] font-black text-primary neon-text-primary">{formatPrice(totalAmount)}</span>
              <span className={`material-symbols-outlined text-[18px] text-on-surface-variant transition-transform ${showTotalBreakdown ? 'rotate-90' : ''}`}>
                chevron_right
              </span>
            </div>
          </button>
          
          {showTotalBreakdown && (
            <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5 animate-fade-in">
              <div className="flex justify-between text-[13px]">
                <span className="text-on-surface-variant">Base Price ({store.endTime - store.startTime} hrs)</span>
                <span className="text-white">{formatPrice((store.selectedAssetPrice || 0) * (store.endTime - store.startTime))}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-on-surface-variant">GST (18%)</span>
                <span className="text-white">{formatPrice((store.selectedAssetPrice || 0) * (store.endTime - store.startTime) * 0.18)}</span>
              </div>
              {store.protection && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-on-surface-variant">Protection Plan</span>
                  <span className="text-white">₹9.00</span>
                </div>
              )}
              {store.couponDiscount > 0 && (
                <div className="flex justify-between text-[13px] text-secondary font-bold">
                  <span>Coupon Discount</span>
                  <span>-{formatPrice(store.couponDiscount)}</span>
                </div>
              )}
              {vipDiscount > 0 && (
                <div className="flex justify-between text-[13px] text-yellow-400 font-bold">
                  <span>👑 VIP Pass Discount (15%)</span>
                  <span>-{formatPrice(vipDiscount)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reschedule Policy */}
        <div className="glass-panel p-4 rounded-xl border border-white/10 bg-white/5">
          <h3 className="text-[10px] font-bold text-white tracking-widest uppercase mb-1.5">
            RESCHEDULE POLICIES
          </h3>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Rescheduling is allowed 1.0 Hour prior to slot time. Rescheduling of a booking can be done
            only 3 times.{' '}
            {expandReschedule ? (
              <>
                Once rescheduled, further modifications may incur additional charges. Subject to availability of the same asset category.
                <button onClick={() => setExpandReschedule(false)} className="text-primary font-bold ml-1">See Less</button>
              </>
            ) : (
              <>
                Once resch...
                <button onClick={() => setExpandReschedule(true)} className="text-primary font-bold ml-1">See More</button>
              </>
            )}
          </p>
        </div>

        {/* Cancellation Policy */}
        <div className="glass-panel p-4 rounded-xl border border-white/10 bg-white/5">
          <h3 className="text-[10px] font-bold text-white tracking-widest uppercase mb-1.5">
            CANCELLATION POLICY
          </h3>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Cancellation is allowed up to 2 hours before the slot. A cancellation fee of 10% will be charged.{' '}
            {expandCancel ? (
              <>
                Refund will be credited to the original payment method within 5-7 business days. Last-minute cancellations (under 2 hours) are non-refundable.
                <button onClick={() => setExpandCancel(false)} className="text-primary font-bold ml-1">See Less</button>
              </>
            ) : (
              <>
                Refund will be credited...
                <button onClick={() => setExpandCancel(true)} className="text-primary font-bold ml-1">See More</button>
              </>
            )}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-[13px] font-bold p-3 rounded-xl animate-scale-in flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            {error}
          </div>
        )}
      </div>

      {/* Invite Friends Button */}
      <div className="fixed bottom-[80px] pb-2 left-0 right-0 px-5 z-40 pointer-events-none flex justify-end">
         <button 
           onClick={() => setShowSplitModal(true)}
           className="bg-surface-variant text-white px-4 py-2 rounded-full shadow-[0_0_15px_rgba(45,212,191,0.2)] border border-white/10 font-bold text-[12px] flex items-center gap-2 pointer-events-auto hover:bg-white/10 transition-colors"
         >
           <span className="material-symbols-outlined text-[16px] text-secondary">group_add</span>
           {splitWith.length > 0 ? `Inviting ${splitWith.length} Friend${splitWith.length > 1 ? 's' : ''}` : 'Invite Friends'}
         </button>
      </div>

      {/* Invite Modal */}
      {showSplitModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
           <div className="bg-surface-container rounded-t-[2rem] sm:rounded-[2rem] p-6 w-full sm:w-[90vw] sm:max-w-[400px] shadow-2xl relative overflow-hidden animate-slide-up-fade pointer-events-auto">
            <h2 className="text-xl font-bold text-white mb-4">Invite Friends</h2>
            <div className="space-y-2 mb-6 max-h-[50vh] overflow-y-auto">
              {friendsList.length > 0 ? friendsList.map(f => {
                const isSelected = splitWith.includes(f.uid);
                return (
                  <div key={f.uid} onClick={() => setSplitWith(prev => isSelected ? prev.filter(id => id !== f.uid) : [...prev, f.uid])} className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? 'bg-primary/20 border-primary' : 'bg-surface-variant/40 border-outline-variant/30 hover:bg-white/5'}`}>
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center overflow-hidden">
                      {f.photoURL ? <img src={f.photoURL} alt={f.name} /> : <span className="material-symbols-outlined text-white/50">person</span>}
                    </div>
                    <div className="flex-1 font-bold text-[14px] text-white">{f.name}</div>
                    {isSelected && <span className="material-symbols-outlined text-primary">check_circle</span>}
                  </div>
                );
              }) : (
                <div className="text-center py-6 text-on-surface-variant">
                  <p className="mb-4 text-[14px]">You haven't added any friends yet.</p>
                  <button onClick={() => push('/social')} className="bg-primary text-black font-bold py-2 px-6 rounded-full text-[13px]">
                    Find Friends
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSplitModal(false)} className="flex-1 py-3 rounded-xl font-bold border border-white/10 text-white/70 hover:bg-white/5 transition-colors">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Pay Button */}
      <div className="fixed bottom-0 pb-6 left-0 right-0 px-5 z-40 pointer-events-none">
        <button
          onClick={handlePayment}
          disabled={loading}
          className="btn-gradient w-full py-3.5 rounded-xl font-bold text-[13px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 neon-glow-primary text-background pointer-events-auto"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            <>
              {paymentMethod === 'counter' ? 'BOOK' : 'PAY'} {formatPrice(splitWith.length > 0 ? Math.round(totalAmount / (1 + splitWith.length)) : totalAmount)}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </>
          )}
        </button>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card rounded-[2rem] p-8 w-[90vw] min-w-[320px] max-w-[384px] flex flex-col items-center text-center shadow-2xl animate-scale-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-secondary"></div>
            
            <div className="w-20 h-20 bg-primary/10 border border-primary/30 rounded-full flex items-center justify-center mb-6 mt-4">
              <span className="material-symbols-outlined text-[40px] text-primary">schedule</span>
            </div>
            
            <h2 className="text-[24px] font-black text-white mb-2 tracking-tight">Booking Requested!</h2>
            <p className="text-[14px] text-on-surface-variant mb-8 font-medium leading-relaxed">
              You have requested to book <span className="text-primary font-bold">{store.selectedAssetName}</span> for {formatTime(store.startTime)} - {formatTime(store.endTime === 24 ? 0 : store.endTime)}.<br/><br/>
              Waiting for confirmation from our team.
            </p>
            
            <button
              onClick={() => {
                store.reset();
                replace('/bookings?success=true');
              }}
              className="w-full btn-gradient py-4 rounded-full font-bold shadow-md hover:bg-black transition-all active:scale-95 text-background neon-text-primary"
            >
              View My Bookings
            </button>
          </div>
        </div>
      )}

      {/* Guest Details Modal */}
      {showGuestModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card rounded-[2rem] p-8 w-[90vw] min-w-[320px] max-w-[384px] flex flex-col shadow-2xl animate-scale-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[20px] font-black text-white tracking-tight">Final Details</h2>
              <button onClick={() => setShowGuestModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-on-surface-variant hover:text-white">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            
            <p className="text-[14px] text-on-surface-variant mb-6 leading-relaxed">
              Before we confirm your booking, we just need a name and number for the reservation.
            </p>
            
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">person</span>
                  <input 
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Neon Rider"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-[14px] focus:border-primary/50 focus:ring-0 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">call</span>
                  <input 
                    type="tel"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-[14px] focus:border-primary/50 focus:ring-0 outline-none"
                  />
                </div>
              </div>
              
              {error && <p className="text-red-400 text-xs font-medium">{error}</p>}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gradient py-4 rounded-full font-bold shadow-md hover:bg-black transition-all active:scale-95 text-background mt-4 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Confirm Booking</span>
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
