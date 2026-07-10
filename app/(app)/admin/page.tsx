'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  XCircle,
  Wrench,
  Calendar,
  Clock,
  Users,
  Activity,
  ChevronDown,
  CheckCircle,
  MessageCircle,
  BarChart3,
  Megaphone,
  Send,
} from 'lucide-react';
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

export default function AdminDashboard() {
  const { appUser, user } = useAuth();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWalkInForm, setShowWalkInForm] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Walk-in form state
  const [walkInName, setWalkInName] = useState('');
  const [walkInAsset, setWalkInAsset] = useState('');
  const [walkInStart, setWalkInStart] = useState(10);
  const [walkInEnd, setWalkInEnd] = useState(11);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);

  // Food orders state
  const [foodOrders, setFoodOrders] = useState<FoodOrder[]>([]);

  // Announcement state
  const [announcement, setAnnouncementState] = useState<Announcement | null>(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const unsubAssets = subscribeToAssets((data) => {
      setAssets(data);
      setLoading(false);
    });

    const unsubBookings = subscribeToAllBookings((data) => {
      setBookings(data);
    });

    const unsubFoodOrders = subscribeToFoodOrders((data) => {
      setFoodOrders(data);
    });

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
      console.error('Error seeding assets:', error);
      toast.error('Failed to seed assets');
    }
    setSeeding(false);
  };

  const handleBlockAsset = async (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return;
    const newStatus = asset.status === 'maintenance' ? 'active' : 'maintenance';
    await updateAssetStatus(assetId, newStatus);
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Cancel this booking?')) return;
    await cancelBooking(bookingId);
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
    try {
      await updateBookingStatus(id, 'rejected');
      toast.success('Booking rejected');
    } catch (err) {
      toast.error('Failed to reject');
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === 'pending');

  return (
    <div className="min-h-dvh bg-[#F5F5F5] pb-24">
      {/* Header */}
      <div className="bg-[#F5F5F5] px-4 md:px-6 pt-8 md:pt-12 pb-4 md:pb-6 sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between max-w-7xl mx-auto gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 shrink-0 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 lg:hidden"
            >
              <ArrowLeft size={20} className="text-gray-900" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Admin Dashboard</h1>
              <p className="text-[12px] md:text-[13px] text-gray-500 font-medium mt-0.5">
                {appUser?.name} · {format(new Date(), 'dd MMM yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => router.push('/admin/wallet')}
              className="flex-1 md:flex-none px-4 md:px-5 py-2.5 bg-white text-gray-900 rounded-full text-xs font-bold shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Users size={14} />
              Wallet
            </button>
            <button
              onClick={() => router.push('/admin/messages')}
              className="flex-1 md:flex-none px-4 md:px-5 py-2.5 bg-white text-gray-900 rounded-full text-xs font-bold shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <MessageCircle size={14} />
              Messages
            </button>
            <button
              onClick={() => router.push('/admin/revenue')}
              className="flex-1 md:flex-none px-4 md:px-5 py-2.5 bg-white text-gray-900 rounded-full text-xs font-bold shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <BarChart3 size={14} />
              Revenue
            </button>
            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="flex-1 md:flex-none px-4 md:px-5 py-2.5 bg-white text-gray-900 rounded-full text-xs font-bold shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Megaphone size={14} />
              Banner
            </button>
            <button
              onClick={handleSeedAssets}
              disabled={seeding}
              className="flex-1 md:flex-none px-4 md:px-5 py-2.5 bg-white text-gray-900 rounded-full text-xs font-bold shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {seeding ? 'Seeding...' : 'Seed Assets'}
            </button>
            <button
              onClick={() => setShowWalkInForm(true)}
              className="flex-1 md:flex-none px-4 md:px-5 py-2.5 bg-[#111111] text-white rounded-full text-xs font-bold shadow-md flex items-center justify-center gap-1.5 hover:bg-black transition-colors shrink-0"
            >
              <Plus size={14} />
              Walk-in
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white rounded-[1.5rem] p-4 md:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0">
              <Activity size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Assets</p>
              <p className="text-lg md:text-xl font-black text-gray-900 leading-none">{assets.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-[1.5rem] p-4 md:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Today's Bookings</p>
              <p className="text-lg md:text-xl font-black text-gray-900 leading-none">{todayBookings.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-[1.5rem] p-4 md:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
              <Users size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Occupied Now</p>
              <p className="text-lg md:text-xl font-black text-gray-900 leading-none">
                {assets.filter((a) => getAssetStatus(a.id).status === 'occupied').length}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-[1.5rem] p-4 md:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
              <Wrench size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Maintenance</p>
              <p className="text-lg md:text-xl font-black text-gray-900 leading-none">
                {assets.filter((a) => a.status === 'maintenance').length}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Food Orders */}
        {foodOrders.filter(o => o.status === 'pending').length > 0 && (
          <div>
            <h2 className="text-[12px] font-extrabold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Pending Food Orders ({foodOrders.filter(o => o.status === 'pending').length})
            </h2>
            <div className="space-y-3">
              {foodOrders.filter(o => o.status === 'pending').map((o) => (
                <div key={o.id} className="bg-white rounded-[1.5rem] p-5 shadow-sm border-l-4 border-blue-400">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900">Table: {o.tableNumber}</p>
                      <p className="text-[11px] font-medium text-gray-400 mt-0.5">
                        By {o.userName || 'Player'}
                      </p>
                    </div>
                    <span className="text-sm font-black text-gray-900">₹{o.totalAmount}</span>
                  </div>
                  
                  <div className="bg-[#F5F5F5] rounded-[1rem] p-3 mb-4">
                    {o.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-[13px]">
                        <span className="font-semibold text-gray-700">{item.quantity}x {item.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateFoodOrderStatus(o.id, 'completed')}
                      className="flex-1 py-3 bg-[#111111] text-white rounded-full text-xs font-bold hover:bg-black transition-colors"
                    >
                      MARK DELIVERED
                    </button>
                    <button
                      onClick={() => updateFoodOrderStatus(o.id, 'rejected')}
                      className="px-5 py-3 bg-[#F5F5F5] text-red-600 rounded-full text-xs font-bold hover:bg-red-50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Requests Queue */}
        {pendingBookings.length > 0 && (
          <div>
            <h2 className="text-[12px] font-extrabold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Pending Requests ({pendingBookings.length})
            </h2>
            <div className="space-y-3">
              {pendingBookings.map((b) => (
                <div key={b.id} className="bg-white rounded-[1.5rem] p-5 shadow-sm border-l-4 border-amber-400">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{b.userName || 'Unknown User'}</p>
                      <p className="text-[11px] font-medium text-gray-400 mt-0.5">
                        {b.assetName} · {b.date === todayStr ? 'Today' : b.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-gray-900">{formatPrice(b.totalAmount)}</p>
                      <p className="text-[11px] font-bold text-gray-500 mt-0.5">
                        {formatTime(b.startTime)} - {formatTime(b.endTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleReject(b.id)}
                      className="flex-1 py-3 rounded-full text-xs font-bold bg-[#F5F5F5] text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(b.id)}
                      className="flex-[2] py-3 rounded-full text-xs font-bold bg-[#111111] text-white hover:bg-black transition-colors flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <CheckCircle size={14} />
                      Approve Booking
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Floor Status */}
        <div>
          <h2 className="text-[12px] font-extrabold text-gray-900 uppercase tracking-wider mb-4">
            Live Floor Status
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse bg-white h-[100px] rounded-[1.5rem]" />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <div className="bg-white rounded-[1.5rem] p-8 text-center shadow-sm">
              <p className="text-gray-500 text-[13px] font-medium">
                No assets found. Click &quot;Seed Assets&quot; to populate.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assets.map((asset) => {
                const { status, booking } = getAssetStatus(asset.id);
                return (
                  <div key={asset.id} className="bg-white rounded-[1.5rem] p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getCategoryIcon(asset.category)}</span>
                        <div>
                          <p className="text-[13px] font-bold text-gray-900">{asset.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{getCategoryLabel(asset.category)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#F5F5F5] px-2 py-1 rounded-full">
                        <span className={`w-2 h-2 rounded-full ${
                          status === 'available' ? 'bg-green-500' : 
                          status === 'occupied' ? 'bg-orange-500' : 'bg-purple-500'
                        }`} />
                        <span className="text-[10px] font-extrabold text-gray-600 uppercase">
                          {status}
                        </span>
                      </div>
                    </div>

                    {booking && (
                      <div className="bg-[#111111] rounded-[1rem] px-4 py-3 mb-4 text-white">
                        <p className="text-[13px] font-bold">{booking.userName}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
                          {formatTime(booking.startTime)} - {formatTime(booking.endTime === 24 ? 0 : booking.endTime)}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => handleBlockAsset(asset.id)}
                      className={`w-full py-3 rounded-full text-[12px] font-bold transition-colors ${
                        asset.status === 'maintenance'
                          ? 'bg-[#111111] text-white shadow-md'
                          : 'bg-[#F5F5F5] text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {asset.status === 'maintenance' ? 'Activate' : 'Block for Maintenance'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Booking Ledger */}
        <div>
          <h2 className="text-[12px] font-extrabold text-gray-900 uppercase tracking-wider mb-4">
            Booking Ledger
          </h2>
          <div className="space-y-3">
            {bookings.slice(0, 20).map((booking) => (
              <div key={booking.id} className="bg-white rounded-[1.5rem] p-4 md:p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center shrink-0">
                      <span className="text-lg">{getCategoryIcon(booking.category)}</span>
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-gray-900">
                        {booking.assetName}
                      </p>
                      <p className="text-[11px] font-medium text-gray-400 mt-0.5">
                        {booking.userName || 'Unknown'} · {booking.date} · {formatTime(booking.startTime)}-{formatTime(booking.endTime === 24 ? 0 : booking.endTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:justify-end border-t sm:border-0 border-gray-100 pt-3 sm:pt-0">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      booking.status === 'confirmed'
                        ? 'bg-[#111111] text-white'
                        : booking.status === 'cancelled'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-[#F5F5F5] text-gray-500'
                    }`}>
                      {booking.status}
                    </span>
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="w-8 h-8 rounded-full bg-[#F5F5F5] hover:bg-gray-200 flex items-center justify-center transition-colors"
                      >
                        <XCircle size={16} className="text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {bookings.length === 0 && (
              <div className="bg-white rounded-[1.5rem] p-8 text-center shadow-sm">
                <p className="text-[13px] font-medium text-gray-500">No bookings yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Walk-in Modal */}
      {showWalkInForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end lg:items-center justify-center animate-fade-in">
          <div className="bg-white w-full lg:w-[480px] lg:rounded-2xl rounded-t-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-arcade-text">Add Walk-in</h3>
              <button onClick={() => setShowWalkInForm(false)} className="p-1">
                <XCircle size={22} className="text-arcade-text-muted" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-arcade-text-muted uppercase tracking-wider">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="Enter name"
                  className="mt-1 w-full px-4 py-3 border-2 border-arcade-border rounded-xl text-sm font-medium focus:border-arcade-green focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-arcade-text-muted uppercase tracking-wider">
                  Select Asset
                </label>
                <select
                  value={walkInAsset}
                  onChange={(e) => setWalkInAsset(e.target.value)}
                  className="mt-1 w-full px-4 py-3 border-2 border-arcade-border rounded-xl text-sm font-medium focus:border-arcade-green focus:outline-none bg-white"
                >
                  <option value="">Choose an asset...</option>
                  {assets
                    .filter((a) => a.status === 'active')
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {getCategoryIcon(a.category)} {a.name} — ₹{a.price}/hr
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-arcade-text-muted uppercase tracking-wider">
                    Start Time
                  </label>
                  <select
                    value={walkInStart}
                    onChange={(e) => setWalkInStart(Number(e.target.value))}
                    className="mt-1 w-full px-4 py-3 border-2 border-arcade-border rounded-xl text-sm font-medium focus:border-arcade-green focus:outline-none bg-white"
                  >
                    {Array.from({ length: 14 }, (_, i) => i + 10).map((h) => (
                      <option key={h} value={h}>{formatTime(h === 24 ? 0 : h)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-arcade-text-muted uppercase tracking-wider">
                    End Time
                  </label>
                  <select
                    value={walkInEnd}
                    onChange={(e) => setWalkInEnd(Number(e.target.value))}
                    className="mt-1 w-full px-4 py-3 border-2 border-arcade-border rounded-xl text-sm font-medium focus:border-arcade-green focus:outline-none bg-white"
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
                className="btn-green mt-2"
              >
                {walkInSubmitting ? 'Adding...' : 'Add Walk-in Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end lg:items-center justify-center animate-fade-in">
          <div className="bg-white w-full lg:w-[480px] lg:rounded-2xl rounded-t-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-arcade-text">Announcement Banner</h3>
              <button onClick={() => setShowAnnouncementModal(false)} className="p-1">
                <XCircle size={22} className="text-arcade-text-muted" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-arcade-text-muted uppercase tracking-wider">Banner Message</label>
                <textarea
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder='e.g. "Happy Hour! 50% off all Pool tables 🎱"'
                  rows={3}
                  className="mt-1 w-full px-4 py-3 border-2 border-arcade-border rounded-xl text-sm font-medium focus:border-arcade-green focus:outline-none resize-none"
                />
              </div>

              {announcement?.active && (
                <div className="bg-[#111111] text-white rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold">🔴 Live: {announcement.text}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    await setAnnouncement(announcementText, true);
                    toast.success('Banner is now live!');
                    setShowAnnouncementModal(false);
                  }}
                  disabled={!announcementText.trim()}
                  className="flex-1 btn-green flex items-center justify-center gap-2 !py-3"
                >
                  <Send size={14} /> Push Live
                </button>
                {announcement?.active && (
                  <button
                    onClick={async () => {
                      await setAnnouncement('', false);
                      setAnnouncementText('');
                      toast.success('Banner removed');
                      setShowAnnouncementModal(false);
                    }}
                    className="px-6 py-3 bg-red-50 text-red-600 rounded-full text-xs font-bold"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
