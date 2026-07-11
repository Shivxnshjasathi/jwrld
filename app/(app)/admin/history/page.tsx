'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getAllBookings, updateBookingStatus, type Booking } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import { formatTime } from '@/lib/utils';
import { format } from 'date-fns';

export default function AdminBookingHistoryPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await getAllBookings();
      setBookings(data);
      setFilteredBookings(data);
    } catch (e) {
      toast.error('Failed to load booking history');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    let result = bookings;
    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }
    if (dateFilter) {
      result = result.filter(b => b.date === dateFilter);
    }
    setFilteredBookings(result);
  }, [statusFilter, dateFilter, bookings]);

  const handleStatusChange = async (id: string, newStatus: Booking['status']) => {
    try {
      await updateBookingStatus(id, newStatus);
      toast.success(`Booking marked as ${newStatus}`);
      loadBookings();
    } catch (e) {
      toast.error('Failed to update booking status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'approved':
        return 'bg-secondary/20 text-secondary';
      case 'pending':
        return 'bg-primary/20 text-primary';
      case 'rejected':
      case 'cancelled':
        return 'bg-error/20 text-error';
      case 'completed':
        return 'bg-tertiary/20 text-tertiary';
      default:
        return 'bg-surface-variant text-on-surface-variant';
    }
  };

  return (
    <div className="w-full py-xl px-gutter md:px-xl min-h-screen">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-lg">
        <div>
          <button onClick={() => router.push('/admin')} className="text-primary hover:opacity-80 transition-opacity mb-2 flex items-center gap-1 font-label-md text-[14px]">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to Dashboard
          </button>
          <h1 className="font-headline-lg-mobile md:text-[32px] font-bold text-primary-fixed-dim">Booking History</h1>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-md mb-lg flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:w-1/3">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Filter by Status</label>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary appearance-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="w-full md:w-1/3">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Filter by Date</label>
          <input 
            type="date" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary"
          />
        </div>
        <div className="w-full md:w-auto">
          <button 
            onClick={() => { setStatusFilter('all'); setDateFilter(''); }}
            className="w-full md:w-auto bg-surface-variant text-on-surface-variant px-6 py-3 rounded-xl font-bold hover:text-white transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-on-surface-variant">Loading booking history...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-on-surface-variant font-label-md">
                <th className="py-4 px-4">Date & Time</th>
                <th className="py-4 px-4">User</th>
                <th className="py-4 px-4">Asset</th>
                <th className="py-4 px-4">Amount</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="border-b border-outline-variant/10 hover:bg-surface/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-bold text-white">{booking.date}</div>
                    <div className="text-[12px] text-on-surface-variant">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-bold text-white">{booking.userName || 'Unknown'}</div>
                    <div className="text-[10px] text-on-surface-variant font-mono">{booking.userId.substring(0,8)}...</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-white capitalize">{booking.assetName}</div>
                    <div className="text-[12px] text-on-surface-variant">{booking.category}</div>
                  </td>
                  <td className="py-4 px-4 font-bold text-white">₹{booking.totalAmount}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <select 
                      value={booking.status}
                      onChange={(e) => handleStatusChange(booking.id, e.target.value as Booking['status'])}
                      className="bg-surface-container border border-outline-variant/30 rounded-lg px-2 py-1 text-white text-[12px] focus:outline-none focus:border-secondary appearance-none inline-block ml-auto"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-on-surface-variant">
                    No bookings found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
