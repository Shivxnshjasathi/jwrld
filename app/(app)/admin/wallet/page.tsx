'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type AppUser } from '@/lib/auth';
import { searchUserByPhone, addWalletBalance } from '@/lib/wallet';
import { ArrowLeft, Search, Plus, Loader2, Wallet, User as UserIcon } from 'lucide-react';

export default function AdminWalletPage() {
  const router = useRouter();
  const { isAdmin, loading } = useAuth();
  const [phoneQuery, setPhoneQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<AppUser | null>(null);
  const [error, setError] = useState('');
  const [amountToAdd, setAmountToAdd] = useState('');
  const [adding, setAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (loading) return null;
  if (!isAdmin) {
    router.replace('/home');
    return null;
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneQuery.trim()) return;
    setSearching(true);
    setError('');
    setFoundUser(null);
    setSuccessMsg('');

    try {
      const user = await searchUserByPhone(phoneQuery);
      if (user) {
        setFoundUser(user);
      } else {
        setError('No user found with this phone number.');
      }
    } catch (err) {
      setError('An error occurred while searching.');
    } finally {
      setSearching(false);
    }
  };

  const handleAddFunds = async () => {
    if (!foundUser || !amountToAdd || isNaN(Number(amountToAdd)) || Number(amountToAdd) <= 0) return;
    setAdding(true);
    setError('');
    setSuccessMsg('');

    try {
      await addWalletBalance(foundUser.uid, Number(amountToAdd));
      setSuccessMsg(`Successfully added ₹${amountToAdd} to ${foundUser.name}'s wallet.`);
      // Update local state to reflect new balance
      setFoundUser({
        ...foundUser,
        walletBalance: (foundUser.walletBalance || 0) + Number(amountToAdd)
      });
      setAmountToAdd('');
    } catch (err) {
      setError('Failed to add funds.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#F5F5F5] pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-40 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-900 active:bg-gray-100 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-[20px] font-black text-gray-900 tracking-tight">Manage Wallets</h1>
            <p className="text-[13px] font-medium text-gray-500">Add funds to user accounts</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <label className="block text-sm font-bold text-gray-900 mb-2">Search User by Phone</label>
          <div className="relative flex items-center">
            <div className="absolute left-4 text-gray-400">
              <Search size={20} />
            </div>
            <input
              type="tel"
              value={phoneQuery}
              onChange={(e) => setPhoneQuery(e.target.value)}
              placeholder="e.g. 9876543210 or +919876543210"
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-[15px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-300 transition-all shadow-sm"
            />
            <button
              type="submit"
              disabled={searching || !phoneQuery.trim()}
              className="absolute right-2 px-4 py-2 bg-[#111111] text-white rounded-xl text-sm font-bold disabled:opacity-50"
            >
              {searching ? <Loader2 size={18} className="animate-spin" /> : 'Search'}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2 font-medium px-2">{error}</p>}
        </form>

        {/* Search Results / Action Area */}
        {foundUser && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                <UserIcon size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{foundUser.name}</h3>
                <p className="text-gray-500 text-sm font-medium">{foundUser.phone}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-500">
                <Wallet size={18} />
                <span className="font-medium text-sm">Current Balance</span>
              </div>
              <span className="font-black text-xl text-gray-900">
                ₹{foundUser.walletBalance || 0}
              </span>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-900">Amount to Add (₹)</label>
              <div className="flex gap-2">
                {[500, 1000, 2000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setAmountToAdd(amt.toString())}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${
                      amountToAdd === amt.toString() ? 'bg-[#111111] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>
              
              <input
                type="number"
                value={amountToAdd}
                onChange={(e) => setAmountToAdd(e.target.value)}
                placeholder="Or enter custom amount"
                className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-[15px] font-bold text-gray-900 placeholder:font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-300 transition-all text-center"
              />

              <button
                onClick={handleAddFunds}
                disabled={adding || !amountToAdd || isNaN(Number(amountToAdd)) || Number(amountToAdd) <= 0}
                className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {adding ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Add Funds to Wallet</>}
              </button>
              
              {successMsg && (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-bold text-center border border-green-100 mt-4 animate-in fade-in duration-300">
                  {successMsg}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
