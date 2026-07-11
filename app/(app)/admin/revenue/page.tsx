'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';
import { subscribeToAllBookings, subscribeToFoodOrders, type Booking, type FoodOrder } from '@/lib/firestore';
import { getCategoryLabel } from '@/lib/utils';

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
    link.download = `jaaduwrld-bookings-${todayStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#0A0A0B] text-on-surface min-h-screen font-body-md selection:bg-primary/30 pb-24">
      {/* Header */}
      <div className="w-full py-xl px-gutter md:px-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-lg">
          <div>
            <button onClick={() => router.push('/admin')} className="text-primary hover:opacity-80 transition-opacity mb-2 flex items-center gap-1 font-label-md text-[14px]">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to Dashboard
            </button>
            <h1 className="font-headline-lg-mobile md:text-[32px] font-bold text-primary-fixed-dim leading-tight">Revenue</h1>
            <p className="text-on-surface-variant text-sm font-medium">Analytics &amp; Reports</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span> Export CSV
          </button>
        </div>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-32 border border-outline-variant/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Today</span>
                <span className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[16px]">attach_money</span>
                </span>
              </div>
              <p className="text-2xl font-bold text-white">₹ {todayRevenue.toFixed(2)}</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-32 border border-outline-variant/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">This Week</span>
                <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                </span>
              </div>
              <p className="text-2xl font-bold text-white">₹ {weekRevenue.toFixed(2)}</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-32 border border-outline-variant/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">This Month</span>
                <span className="w-8 h-8 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined text-[16px]">bar_chart</span>
                </span>
              </div>
              <p className="text-2xl font-bold text-white">₹ {monthRevenue.toFixed(2)}</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-32 border border-outline-variant/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">All Time</span>
                <span className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                </span>
              </div>
              <p className="text-2xl font-bold text-white">₹ {totalRevenue.toFixed(2)}</p>
            </div>
          </div>

          {/* Chart & Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Last 7 Days Chart */}
            <div className="glass-panel p-6 rounded-3xl border border-outline-variant/30">
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-8">Last 7 Days</h3>
              <div className="flex items-end justify-between h-48 gap-2">
                {last7Days.map((d, i) => {
                  const height = d.revenue > 0 ? Math.max((d.revenue / maxRev) * 100, 5) : 5;
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                      <span className="text-[10px] font-bold text-white/0 group-hover:text-white transition-colors duration-200">
                        ₹{(d.revenue / 1000).toFixed(1)}k
                      </span>
                      <div className="w-full max-w-[40px] bg-surface-variant rounded-t-md relative overflow-hidden h-full flex items-end">
                        <div 
                          className="w-full bg-gradient-to-t from-primary/50 to-primary rounded-t-md transition-all duration-500 ease-out" 
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase">{d.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Revenue by Category */}
            <div className="glass-panel p-6 rounded-3xl border border-outline-variant/30">
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-6">By Category</h3>
              <div className="space-y-6">
                {categoryRevenue.map((cat, i) => {
                  const pct = totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-white">{cat.label}</span>
                        <span className="text-sm font-bold text-secondary">₹ {cat.revenue.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full rounded-full transition-all duration-1000"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
