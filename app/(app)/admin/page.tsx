'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import {
  subscribeToAssets,
  subscribeToAllBookings,
  cancelBooking,
  updateBookingStatus,
  updateAssetStatus,
  createBooking,
  seedAssets,
  subscribeToFoodOrders,
  updateFoodOrderStatus,
  setAnnouncement,
  subscribeToAnnouncement,
  type Asset,
  type Booking,
  type FoodOrder,
  type Announcement,
} from '@/lib/firestore';
import { formatTime, formatPrice, getCategoryIcon, getCategoryLabel } from '@/lib/utils';
import { useModalBackHandler } from '@/hooks/use-modal-back-handler';

export default function AdminDashboard() {
  const { appUser, user } = useAuth();
  const router = useRouter();
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [foodOrders, setFoodOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Modals state
  const [showWalkInForm, setShowWalkInForm] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const [walkInName, setWalkInName] = useState('');
  const [walkInAsset, setWalkInAsset] = useState('');
  const [walkInStart, setWalkInStart] = useState(10);
  const [walkInEnd, setWalkInEnd] = useState(11);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);
  
  const [announcement, setAnnouncementState] = useState<Announcement | null>(null);
  const [announcementText, setAnnouncementText] = useState('');

  useModalBackHandler(showWalkInForm, () => setShowWalkInForm(false));
  useModalBackHandler(showAnnouncementModal, () => setShowAnnouncementModal(false));

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const unsubAssets = subscribeToAssets((data) => {
      setAssets(data);
      setLoading(false);
    });
    const unsubBookings = subscribeToAllBookings((data) => setBookings(data));
    const unsubFoodOrders = subscribeToFoodOrders((data) => setFoodOrders(data));
    const unsubAnnouncement = subscribeToAnnouncement((data) => {
      setAnnouncementState(data);
      if (data?.text) setAnnouncementText(data.text);
    });

    return () => {
      unsubAssets();
      unsubBookings();
      unsubFoodOrders();
      unsubAnnouncement();
    };
  }, []);

  const todayBookings = bookings.filter((b) => b.date === todayStr && (b.status === 'confirmed' || b.status === 'approved'));
  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const activeAssets = assets.filter((a) => a.status === 'active');
  const todayRevenue = todayBookings
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const getAssetStatus = (assetId: string) => {
    const now = new Date().getHours();
    const activeBooking = todayBookings.find(
      (b) => b.assetId === assetId && b.startTime <= now && b.endTime > now
    );
    const asset = assets.find((a) => a.id === assetId);

    if (asset?.status === 'maintenance') return { status: 'maintenance', booking: null };
    if (activeBooking) return { status: 'occupied', booking: activeBooking };
    return { status: 'available', booking: null };
  };

  const handleSeedAssets = async () => {
    setSeeding(true);
    try {
      await seedAssets();
      toast.success('Assets seeded successfully!');
    } catch (error) {
      toast.error('Failed to seed assets');
    }
    setSeeding(false);
  };

  const handleWalkIn = async () => {
    if (!walkInName || !walkInAsset || !user) return;
    setWalkInSubmitting(true);
    const asset = assets.find((a) => a.id === walkInAsset);
    try {
      await createBooking({
        userId: user.uid,
        userName: `Walk-in: ${walkInName}`,
        assetId: walkInAsset,
        assetName: asset?.name || '',
        category: asset?.category || '',
        date: todayStr,
        startTime: walkInStart,
        endTime: walkInEnd,
        totalAmount: (asset?.price || 0) * (walkInEnd - walkInStart),
        status: 'approved',
        createdAt: new Date().toISOString(),
        protection: false,
      });
      setShowWalkInForm(false);
      setWalkInName('');
      setWalkInAsset('');
      toast.success('Walk-in booking created');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create walk-in booking');
    }
    setWalkInSubmitting(false);
  };

  const handleApprove = async (id: string) => {
    try {
      await updateBookingStatus(id, 'approved');
      toast.success('Booking approved');
    } catch (err) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this booking?')) return;
    try {
      await updateBookingStatus(id, 'rejected');
      toast.success('Booking rejected');
    } catch (err) {
      toast.error('Failed to reject');
    }
  };

  return (
    <div className="bg-[#0A0A0B] text-on-surface min-h-screen font-body-md selection:bg-primary/30 pb-[120px] md:pb-0">
      
      {/* Top Navigation */}
      <header className="bg-surface/10 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm fixed top-0 w-full z-40">
        <div className="flex justify-between items-center px-gutter py-md w-full">
          {/* Brand */}
          <div className="flex flex-col items-center cursor-pointer" onClick={() => router.push('/home')}>
            <div className="font-display-md text-[24px] tracking-tighter text-on-surface font-bold header-glow leading-none">
              Jaaduwrld
            </div>
            <div className="text-[9px] font-bold tracking-[0.2em] text-primary uppercase mt-1">Art and Arcade</div>
          </div>
          
          {/* Desktop Nav Links */}
            <nav className="hidden md:flex gap-lg">
              <a onClick={() => router.push('/admin')} className="cursor-pointer text-primary hover:opacity-80 transition-opacity font-label-md text-[14px]">Dashboard</a>
              <a onClick={() => router.push('/admin/assets')} className="cursor-pointer text-on-surface-variant hover:opacity-80 transition-opacity font-label-md text-[14px]">Assets</a>
              <a onClick={() => router.push('/admin/coupons')} className="cursor-pointer text-on-surface-variant hover:opacity-80 transition-opacity font-label-md text-[14px]">Coupons</a>
              <a onClick={() => router.push('/admin/users')} className="cursor-pointer text-on-surface-variant hover:opacity-80 transition-opacity font-label-md text-[14px]">Users</a>
              <a onClick={() => router.push('/admin/settings')} className="cursor-pointer text-on-surface-variant hover:opacity-80 transition-opacity font-label-md text-[14px]">Settings</a>
              <a onClick={() => router.push('/admin/history')} className="cursor-pointer text-on-surface-variant hover:opacity-80 transition-opacity font-label-md text-[14px]">History</a>
              <a onClick={() => router.push('/admin/wallet')} className="cursor-pointer text-on-surface-variant hover:opacity-80 transition-opacity font-label-md text-[14px]">Wallet</a>
              <a onClick={() => router.push('/admin/events')} className="cursor-pointer text-on-surface-variant hover:opacity-80 transition-opacity font-label-md text-[14px]">Events</a>
              <a onClick={() => router.push('/admin/broadcast')} className="cursor-pointer text-on-surface-variant hover:opacity-80 transition-opacity font-label-md text-[14px]">Broadcast</a>
              <a onClick={() => router.push('/admin/revenue')} className="cursor-pointer text-on-surface-variant hover:opacity-80 transition-opacity font-label-md text-[14px]">Revenue</a>
            </nav>

          {/* Trailing */}
          <div className="flex items-center gap-md">
            <button onClick={() => router.push('/admin/messages')} className="hover:opacity-80 transition-opacity text-on-surface-variant md:hidden">
              <span className="material-symbols-outlined text-[20px]">forum</span>
            </button>
            <button onClick={() => setShowAnnouncementModal(true)} className="hover:opacity-80 transition-opacity text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">campaign</span>
            </button>
            <button onClick={() => setShowWalkInForm(true)} className="hover:opacity-80 transition-opacity text-primary">
              <span className="material-symbols-outlined text-[24px]">add_circle</span>
            </button>
            <button onClick={() => setShowMobileMenu(true)} className="md:hidden text-on-surface-variant hover:text-white ml-2 transition-colors">
              <span className="material-symbols-outlined text-[28px]">menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-[100px] w-full px-gutter md:px-xl min-h-screen">
        <div className="mb-lg">
          <h1 className="font-headline-lg-mobile md:text-[32px] font-bold text-primary-fixed-dim">Command Center</h1>
          <p className="text-on-surface-variant font-body-md text-[16px]">Real-time venue analytics and control.</p>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl">
          <div className="glass-panel rounded-xl p-lg flex flex-col justify-between h-[140px] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="flex justify-between items-start z-10">
              <span className="font-label-md text-[14px] font-bold text-on-surface-variant uppercase tracking-wider">Today's Revenue</span>
              <span className="material-symbols-outlined text-primary text-[24px]">account_balance_wallet</span>
            </div>
            <div className="z-10">
              <div className="font-display-md text-[40px] font-bold text-on-surface">₹{todayRevenue.toLocaleString()}</div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-lg flex flex-col justify-between h-[140px] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="flex justify-between items-start z-10">
              <span className="font-label-md text-[14px] font-bold text-on-surface-variant uppercase tracking-wider">Today's Bookings</span>
              <span className="material-symbols-outlined text-secondary text-[24px]">event_available</span>
            </div>
            <div className="z-10">
              <div className="font-display-md text-[40px] font-bold text-on-surface">{todayBookings.length}</div>
              <div className="text-on-surface-variant font-label-sm text-[12px] mt-xs">
                {pendingBookings.length} pending
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-lg flex flex-col justify-between h-[140px] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-tertiary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="flex justify-between items-start z-10">
              <span className="font-label-md text-[14px] font-bold text-on-surface-variant uppercase tracking-wider">Active Assets</span>
              <span className="material-symbols-outlined text-tertiary-fixed-dim text-[24px]">sports_esports</span>
            </div>
            <div className="z-10 flex items-end justify-between w-full">
              <div className="font-display-md text-[40px] font-bold text-on-surface">{activeAssets.length}<span className="text-[24px] text-on-surface-variant font-medium">/{assets.length}</span></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
          
          {/* Live Floor Status */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-md">
              <h2 className="font-headline-md text-[24px] font-bold text-on-surface">Live Floor Status</h2>
              <div className="flex gap-md font-label-sm text-[12px] font-bold text-on-surface-variant">
                <span className="flex items-center gap-xs"><div className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_8px_rgba(68,226,205,0.8)]"></div> Available</span>
                <span className="flex items-center gap-xs"><div className="w-3 h-3 rounded-full bg-error shadow-[0_0_8px_rgba(255,180,171,0.8)]"></div> Occupied</span>
              </div>
            </div>

            {loading ? (
              <div className="text-on-surface-variant text-center py-8">Loading floor status...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                {assets.map(asset => {
                  const { status, booking } = getAssetStatus(asset.id);
                  const isOccupied = status === 'occupied';
                  const isAvailable = status === 'available';
                  return (
                    <div 
                      key={asset.id} 
                      onClick={() => {
                        if (isOccupied && booking) {
                          if (confirm(`Cancel active booking for ${booking.userName || 'this user'}?`)) {
                             updateBookingStatus(booking.id, 'cancelled').then(() => {
                               toast.success('Booking cancelled');
                             }).catch(() => toast.error('Failed to cancel booking'));
                          }
                        }
                      }}
                      className={`glass-panel rounded-lg p-md flex flex-col items-center justify-center gap-sm relative overflow-hidden transition-all hover:scale-[1.02] cursor-pointer ${
                        isOccupied ? 'status-occupied hover:border-error/50 group' : isAvailable ? 'status-available' : 'border-outline-variant/30 opacity-70'
                      }`}
                    >
                      {isOccupied && (
                         <div className="absolute inset-0 bg-error/0 group-hover:bg-error/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-20 backdrop-blur-[2px]">
                           <span className="font-bold text-error text-[12px] bg-black/50 px-2 py-1 rounded">Click to Cancel</span>
                         </div>
                      )}
                      {isAvailable && (
                        <div className="absolute inset-0 bg-gradient-to-t from-secondary/5 to-transparent"></div>
                      )}
                      
                      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                        isOccupied ? 'bg-error animate-pulse shadow-[0_0_8px_rgba(255,180,171,1)]' : 
                        isAvailable ? 'bg-secondary shadow-[0_0_8px_rgba(68,226,205,1)]' : 'bg-on-surface-variant'
                      }`}></div>
                      
                      <span className={`material-symbols-outlined text-[32px] ${
                        isOccupied ? 'text-error/80' : isAvailable ? 'text-secondary/80' : 'text-on-surface-variant'
                      }`}>
                        {asset.category === 'pool' || asset.category === 'snooker' ? 'adjust' : 'sports_esports'}
                      </span>
                      
                      <div className="text-center z-10">
                        <div className="font-label-md text-[14px] font-bold text-on-surface">{asset.name}</div>
                        <div className={`font-label-sm text-[12px] mt-xs ${
                          isOccupied ? 'text-error' : isAvailable ? 'text-secondary' : 'text-on-surface-variant'
                        }`}>
                          {isOccupied && booking ? `${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}` : 
                           isAvailable ? 'Ready' : 'Maintenance'}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {assets.length === 0 && (
                  <div className="col-span-full flex flex-col items-center p-8 text-on-surface-variant glass-panel rounded-xl">
                    <p className="mb-4">No assets found</p>
                    <button onClick={handleSeedAssets} disabled={seeding} className="px-6 py-2 rounded-full bg-surface-variant hover:bg-white/10 transition-colors">
                      {seeding ? 'Seeding...' : 'Seed Assets'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pending Requests Queue */}
          <div className="lg:col-span-1">
            <h2 className="font-headline-md text-[24px] font-bold text-on-surface mb-md">Pending Requests</h2>
            
            <div className="flex flex-col gap-md">
              {pendingBookings.map(b => (
                <div key={b.id} className="glass-panel rounded-xl p-md border-l-4 border-l-primary relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-sm">
                    <span className="material-symbols-outlined text-primary text-[16px]">schedule</span>
                  </div>
                  <div className="flex items-center gap-sm mb-md">
                    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/30 text-on-surface-variant">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <div>
                      <div className="font-label-md text-[14px] font-bold text-on-surface">{b.userName || 'Unknown User'}</div>
                      <div className="font-label-sm text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">{b.date === todayStr ? 'Today' : b.date}</div>
                    </div>
                  </div>
                  <div className="mb-md">
                    <div className="font-body-md text-[16px] text-on-surface">Requesting <strong>{b.assetName}</strong></div>
                    <div className="font-label-sm text-[12px] font-bold text-on-surface-variant mt-xs">
                      {formatTime(b.startTime)} to {formatTime(b.endTime)}
                    </div>
                  </div>
                  <div className="flex gap-sm">
                    <button 
                      onClick={() => handleApprove(b.id)}
                      className="flex-1 bg-gradient-to-r from-primary to-secondary text-black font-label-md text-[14px] font-bold py-sm rounded-lg hover:shadow-[0_0_15px_rgba(221,183,255,0.4)] transition-all active:scale-95"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleReject(b.id)}
                      className="flex-1 glass-panel text-on-surface font-label-md text-[14px] font-bold py-sm rounded-lg hover:bg-error/20 hover:text-error hover:border-error/40 transition-all active:scale-95"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
              
              {pendingBookings.length === 0 && (
                <div className="glass-panel rounded-xl p-md text-center text-on-surface-variant border-dashed border-outline-variant/30">
                  <p>No pending requests.</p>
                </div>
              )}
            </div>

            {/* Food Orders (Pending) */}
            {foodOrders.filter(o => o.status === 'pending').length > 0 && (
              <div className="mt-xl">
                <h2 className="font-headline-md text-[24px] font-bold text-on-surface mb-md">Food Orders</h2>
                <div className="flex flex-col gap-md">
                  {foodOrders.filter(o => o.status === 'pending').map((o) => (
                    <div key={o.id} className="glass-panel rounded-xl p-md border-l-4 border-l-secondary relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-sm">
                        <span className="material-symbols-outlined text-secondary text-[16px]">restaurant</span>
                      </div>
                      <div className="flex items-center gap-sm mb-md">
                        <div>
                          <div className="font-label-md text-[14px] font-bold text-on-surface">Table: {o.tableNumber}</div>
                          <div className="font-label-sm text-[12px] font-bold text-on-surface-variant">By {o.userName || 'Player'}</div>
                        </div>
                        <div className="ml-auto font-bold text-white mr-6">₹{o.totalAmount}</div>
                      </div>
                      <div className="mb-md bg-surface/30 p-sm rounded-lg">
                        {o.items.map((item) => (
                          <div key={item.id} className="text-[13px] text-on-surface flex justify-between">
                            <span>{item.quantity}x {item.name}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-sm">
                        <button 
                          onClick={() => updateFoodOrderStatus(o.id, 'completed')}
                          className="flex-1 bg-gradient-to-r from-secondary to-primary text-black font-label-md text-[14px] font-bold py-sm rounded-lg hover:shadow-[0_0_15px_rgba(68,226,205,0.4)] transition-all active:scale-95"
                        >
                          Mark Delivered
                        </button>
                        <button 
                          onClick={() => updateFoodOrderStatus(o.id, 'rejected')}
                          className="flex-1 glass-panel text-on-surface font-label-md text-[14px] font-bold py-sm rounded-lg hover:bg-error/20 hover:text-error transition-all active:scale-95"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {/* Walk-in Modal */}
      {showWalkInForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end lg:items-center justify-center animate-fade-in">
          <div className="glass-panel w-full lg:w-[480px] lg:rounded-2xl rounded-t-2xl p-6 border-outline-variant/30 shadow-[0_0_40px_rgba(0,0,0,0.8)] animate-slide-up-fade">
            <div className="flex items-center justify-between mb-6 border-b border-outline-variant/20 pb-4">
              <h3 className="text-xl font-bold text-white">Add Walk-in</h3>
              <button onClick={() => setShowWalkInForm(false)} className="hover:text-white text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Customer Name</label>
                <input
                  type="text"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="Enter name"
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Select Asset</label>
                <select
                  value={walkInAsset}
                  onChange={(e) => setWalkInAsset(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary transition-colors appearance-none"
                >
                  <option value="">Choose an asset...</option>
                  {activeAssets.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} — ₹{a.price}/hr</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Start Time</label>
                  <select
                    value={walkInStart}
                    onChange={(e) => setWalkInStart(Number(e.target.value))}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary transition-colors appearance-none"
                  >
                    {Array.from({ length: 14 }, (_, i) => i + 10).map((h) => (
                      <option key={h} value={h}>{formatTime(h === 24 ? 0 : h)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">End Time</label>
                  <select
                    value={walkInEnd}
                    onChange={(e) => setWalkInEnd(Number(e.target.value))}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary transition-colors appearance-none"
                  >
                    {Array.from({ length: 14 }, (_, i) => i + 11).map((h) => (
                      <option key={h} value={h}>{formatTime(h === 24 ? 0 : h)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleWalkIn}
                disabled={walkInSubmitting || !walkInName || !walkInAsset}
                className="w-full mt-6 py-4 rounded-xl font-bold bg-gradient-to-r from-secondary to-primary text-black disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95"
              >
                {walkInSubmitting ? 'Adding...' : 'Add Walk-in Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end lg:items-center justify-center animate-fade-in">
          <div className="glass-panel w-full lg:w-[480px] lg:rounded-2xl rounded-t-2xl p-6 border-outline-variant/30 shadow-[0_0_40px_rgba(0,0,0,0.8)] animate-slide-up-fade">
            <div className="flex items-center justify-between mb-6 border-b border-outline-variant/20 pb-4">
              <h3 className="text-xl font-bold text-white">Announcement Banner</h3>
              <button onClick={() => setShowAnnouncementModal(false)} className="hover:text-white text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Banner Message</label>
                <textarea
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder='e.g. "Happy Hour! 50% off all Pool tables 🎱"'
                  rows={3}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary transition-colors resize-none"
                />
              </div>

              {announcement?.active && (
                <div className="bg-primary/20 border border-primary/50 text-white rounded-xl px-4 py-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <p className="text-xs font-semibold">Live: {announcement.text}</p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={async () => {
                    await setAnnouncement(announcementText, true);
                    toast.success('Banner is now live!');
                    setShowAnnouncementModal(false);
                  }}
                  disabled={!announcementText.trim()}
                  className="flex-1 py-4 rounded-xl font-bold bg-gradient-to-r from-secondary to-primary text-black disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95 flex justify-center items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">campaign</span> Push Live
                </button>
                {announcement?.active && (
                  <button
                    onClick={async () => {
                      await setAnnouncement('', false);
                      setAnnouncementText('');
                      toast.success('Banner removed');
                      setShowAnnouncementModal(false);
                    }}
                    className="px-6 py-4 rounded-xl font-bold glass-panel text-error border-error/30 hover:bg-error/20 transition-all"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col p-6 animate-fade-in md:hidden">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white">Admin Menu</h2>
            <button onClick={() => setShowMobileMenu(false)} className="text-on-surface-variant hover:text-white">
              <span className="material-symbols-outlined text-[32px]">close</span>
            </button>
          </div>
          <nav className="flex flex-col gap-6 mt-4">
            <a onClick={() => router.push('/admin')} className="text-white text-xl font-bold flex items-center gap-4"><span className="material-symbols-outlined text-primary">dashboard</span> Dashboard</a>
            <a onClick={() => router.push('/admin/assets')} className="text-white text-xl font-bold flex items-center gap-4"><span className="material-symbols-outlined text-secondary">sports_esports</span> Assets</a>
            <a onClick={() => router.push('/admin/coupons')} className="text-white text-xl font-bold flex items-center gap-4"><span className="material-symbols-outlined text-tertiary">local_offer</span> Coupons</a>
            <a onClick={() => router.push('/admin/users')} className="text-white text-xl font-bold flex items-center gap-4"><span className="material-symbols-outlined text-primary">group</span> Users</a>
            <a onClick={() => router.push('/admin/settings')} className="text-white text-xl font-bold flex items-center gap-4"><span className="material-symbols-outlined text-secondary">settings</span> Settings</a>
            <a onClick={() => router.push('/admin/history')} className="text-white text-xl font-bold flex items-center gap-4"><span className="material-symbols-outlined text-tertiary">history</span> History</a>
            <a onClick={() => router.push('/admin/wallet')} className="text-white text-xl font-bold flex items-center gap-4"><span className="material-symbols-outlined text-primary">account_balance_wallet</span> Wallet</a>
            <a onClick={() => router.push('/admin/messages')} className="text-white text-xl font-bold flex items-center gap-4"><span className="material-symbols-outlined text-secondary">forum</span> Messages</a>
            <a onClick={() => router.push('/admin/events')} className="text-white text-xl font-bold flex items-center gap-4"><span className="material-symbols-outlined text-primary">event_available</span> Events</a>
            <a onClick={() => router.push('/admin/broadcast')} className="text-white text-xl font-bold flex items-center gap-4"><span className="material-symbols-outlined text-secondary">campaign</span> Broadcast</a>
            <a onClick={() => router.push('/admin/revenue')} className="text-white text-xl font-bold flex items-center gap-4"><span className="material-symbols-outlined text-tertiary">payments</span> Revenue</a>
          </nav>
        </div>
      )}
    </div>
  );
}
