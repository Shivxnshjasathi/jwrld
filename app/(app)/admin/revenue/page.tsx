'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';
import { ArrowLeft, Download, TrendingUp, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import { subscribeToAllBookings, subscribeToFoodOrders, type Booking, type FoodOrder } from '@/lib/firestore';
import { formatPrice, getCategoryLabel } from '@/lib/utils';

export default function RevenuePage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [foodOrders, setFoodOrders] = useState<FoodOrder[]>([]);

  useEffect(() => {
    const unsub1 = subscribeToAllBookings((data) => setBookings(data));
    const unsub2 = subscribeToFoodOrders((data) => setFoodOrders(data));
    return () => { unsub1(); unsub2(); };
  }, []);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  const confirmedBookings = bookings.filter(b => ['approved', 'confirmed', 'completed'].includes(b.status));
  const completedOrders = foodOrders.filter(o => o.status === 'completed');

  const getBookingRevenue = (from: string) =>
    confirmedBookings.filter(b => b.date >= from).reduce((sum, b) => sum + b.totalAmount, 0);

  const getFoodRevenue = (from: string) =>
    completedOrders.filter(o => o.createdAt >= from).reduce((sum, o) => sum + o.totalAmount, 0);

  const todayRevenue = getBookingRevenue(todayStr) + getFoodRevenue(todayStr);
  const weekRevenue = getBookingRevenue(weekStart) + getFoodRevenue(weekStart);
  const monthRevenue = getBookingRevenue(monthStart) + getFoodRevenue(monthStart);
  const totalRevenue = confirmedBookings.reduce((s, b) => s + b.totalAmount, 0) + completedOrders.reduce((s, o) => s + o.totalAmount, 0);

  // Last 7 days chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const rev = confirmedBookings.filter(b => b.date === dateStr).reduce((s, b) => s + b.totalAmount, 0)
      + completedOrders.filter(o => o.createdAt.startsWith(dateStr)).reduce((s, o) => s + o.totalAmount, 0);
    return { date: format(d, 'EEE'), fullDate: dateStr, revenue: rev };
  });
  const maxRev = Math.max(...last7Days.map(d => d.revenue), 1);

  // Revenue by category
  const categoryRevenue = ['pool', 'snooker', 'ps5'].map(cat => ({
    category: cat,
    label: getCategoryLabel(cat),
    revenue: confirmedBookings.filter(b => b.category === cat).reduce((s, b) => s + b.totalAmount, 0),
  }));
  const foodRev = completedOrders.reduce((s, o) => s + o.totalAmount, 0);
  categoryRevenue.push({ category: 'food', label: 'Food & Drinks', revenue: foodRev });

  // CSV Export
  const handleExportCSV = () => {
    const header = 'Date,Asset,Category,User,Start,End,Amount,Status\n';
    const rows = bookings.map(b =>
      `${b.date},${b.assetName},${b.category},${(b.userName || 'Unknown').replace(',', '')},${b.startTime}:00,${b.endTime}:00,${b.totalAmount},${b.status}`
    ).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arcadezone-bookings-${todayStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-dvh bg-[#F5F5F5] pb-24">
      {/* Header */}
      <div className="bg-[#F5F5F5] px-6 pt-12 pb-6 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
            >
              <ArrowLeft size={20} className="text-[#1a1a1a]" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Revenue</h1>
              <p className="text-[11px] text-gray-500 font-medium">Analytics &amp; Reports</p>
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-[#111111] text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
              <DollarSign size={18} className="text-green-600" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Today</p>
            <p className="text-xl font-black text-gray-900">{formatPrice(todayRevenue)}</p>
          </div>
          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3">
              <Calendar size={18} className="text-blue-600" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">This Week</p>
            <p className="text-xl font-black text-gray-900">{formatPrice(weekRevenue)}</p>
          </div>
          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mb-3">
              <BarChart3 size={18} className="text-purple-600" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">This Month</p>
            <p className="text-xl font-black text-gray-900">{formatPrice(monthRevenue)}</p>
          </div>
          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mb-3">
              <TrendingUp size={18} className="text-orange-600" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">All Time</p>
            <p className="text-xl font-black text-gray-900">{formatPrice(totalRevenue)}</p>
          </div>
        </div>

        {/* 7-Day Chart */}
        <div className="bg-white rounded-[1.5rem] p-6 shadow-sm">
          <h3 className="text-[12px] font-extrabold text-gray-900 uppercase tracking-wider mb-6">Last 7 Days</h3>
          <div className="flex items-end justify-between gap-2 h-40">
            {last7Days.map((day) => (
              <div key={day.fullDate} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-gray-500">{day.revenue > 0 ? `₹${(day.revenue / 1000).toFixed(1)}k` : ''}</span>
                <div className="w-full flex justify-center">
                  <div
                    className="w-8 rounded-t-lg bg-[#111111] transition-all duration-500"
                    style={{
                      height: `${Math.max(4, (day.revenue / maxRev) * 120)}px`,
                      opacity: day.revenue > 0 ? 1 : 0.15,
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold text-gray-400">{day.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Category */}
        <div className="bg-white rounded-[1.5rem] p-6 shadow-sm">
          <h3 className="text-[12px] font-extrabold text-gray-900 uppercase tracking-wider mb-4">By Category</h3>
          <div className="space-y-4">
            {categoryRevenue.map((cat) => {
              const maxCatRev = Math.max(...categoryRevenue.map(c => c.revenue), 1);
              return (
                <div key={cat.category}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-bold text-gray-900">{cat.label}</span>
                    <span className="text-sm font-black text-gray-900">{formatPrice(cat.revenue)}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#111111] rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(2, (cat.revenue / maxCatRev) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
