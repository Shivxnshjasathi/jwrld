'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type AppUser } from '@/lib/auth';
import { getAllUsers, searchUserByPhone, addWalletBalance } from '@/lib/wallet';
import { toast } from 'react-hot-toast';

export default function AdminWalletPage() {
  const router = useRouter();
  const { appUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [phoneQuery, setPhoneQuery] = useState('');
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [foundUser, setFoundUser] = useState<AppUser | null>(null);
  const [amountToAdd, setAmountToAdd] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (appUser?.role === 'admin') {
      setIsAdmin(true);
      setLoading(false);
    } else if (appUser) {
      router.replace('/home');
    }
  }, [appUser, router]);

  useEffect(() => {
    getAllUsers().then(users => {
      setAllUsers(users);
      setLoadingUsers(false);
    });
  }, []);

  if (loading) return null;
  if (!isAdmin) {
    router.replace('/home');
    return null;
  }

  const filteredUsers = allUsers.filter(u => 
    u.phone?.toLowerCase().includes(phoneQuery.toLowerCase()) || 
    u.name?.toLowerCase().includes(phoneQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(phoneQuery.toLowerCase())
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneQuery.trim()) return;
    try {
      const user = await searchUserByPhone(phoneQuery);
      if (user) {
        setFoundUser(user);
      } else {
        toast.error('No user found with this phone number.');
      }
    } catch (err) {
      toast.error('An error occurred while searching.');
    }
  };

  const handleAddFunds = async () => {
    if (!foundUser || !amountToAdd || isNaN(Number(amountToAdd))) return;
    setAdding(true);

    try {
      await addWalletBalance(foundUser.uid, Number(amountToAdd));
      toast.success(`Successfully added ₹${amountToAdd} to ${foundUser.name}'s wallet.`);
      setFoundUser({
        ...foundUser,
        walletBalance: (foundUser.walletBalance || 0) + Number(amountToAdd)
      });
      setAllUsers(allUsers.map(u => u.uid === foundUser.uid ? { ...u, walletBalance: (u.walletBalance || 0) + Number(amountToAdd) } : u));
      setAmountToAdd('');
    } catch (err) {
      toast.error('Failed to add funds.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-[#0A0A0B] text-on-surface min-h-screen font-body-md selection:bg-primary/30 pb-24">
      {/* Header */}
      <div className="w-full py-xl px-gutter md:px-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-lg">
          <div>
            <button onClick={() => {
                if (foundUser) setFoundUser(null);
                else router.push('/admin');
              }} 
              className="text-primary hover:opacity-80 transition-opacity mb-2 flex items-center gap-1 font-label-md text-[14px]">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span> {foundUser ? 'Back to search' : 'Back to Dashboard'}
            </button>
            <h1 className="font-headline-lg-mobile md:text-[32px] font-bold text-primary-fixed-dim leading-tight">Manage Wallets</h1>
            <p className="text-on-surface-variant text-sm font-medium">Add funds to user accounts</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Search Form */}
          {!foundUser && (
            <div className="mb-6 relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                type="text"
                value={phoneQuery}
                onChange={(e) => setPhoneQuery(e.target.value)}
                placeholder="Search by name, phone, or email"
                className="w-full pl-12 pr-4 py-4 bg-surface-container border border-outline-variant/30 rounded-2xl text-[15px] font-medium text-white placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-all"
              />
            </div>
          )}

          {/* User List */}
          {!foundUser && (
            <div className="space-y-3">
              {loadingUsers ? (
                <div className="text-center py-8 text-on-surface-variant">
                  Loading users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant font-medium">
                  No users found.
                </div>
              ) : (
                filteredUsers.map(user => (
                  <button
                    key={user.uid}
                    onClick={() => { setFoundUser(user); setAmountToAdd(''); }}
                    className="w-full glass-panel p-4 rounded-2xl border border-outline-variant/30 flex items-center justify-between hover:bg-white/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-surface-variant rounded-full flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-[20px]">person</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-[16px] leading-tight mb-1">{user.name || 'Unknown'}</h3>
                        <p className="text-xs text-on-surface-variant">{user.phone || user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Balance</p>
                      <p className="font-black text-secondary text-lg">₹{user.walletBalance || 0}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Action Area */}
          {foundUser && (
            <div className="glass-panel rounded-3xl p-6 border border-outline-variant/30 animate-fade-in">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[32px]">person</span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-xl">{foundUser.name || 'Unknown'}</h3>
                  <p className="text-on-surface-variant text-sm mt-1">{foundUser.phone || foundUser.email}</p>
                </div>
              </div>

              <div className="bg-surface/30 rounded-2xl p-6 mb-8 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <span className="material-symbols-outlined">account_balance_wallet</span>
                  <span className="font-bold text-sm uppercase tracking-wider">Current Balance</span>
                </div>
                <span className="font-black text-2xl text-secondary">
                  ₹{foundUser.walletBalance || 0}
                </span>
              </div>

              <div className="space-y-6">
                <label className="block text-sm font-bold text-white uppercase tracking-wider">Amount to Add (₹)</label>
                <div className="flex gap-3">
                  {[500, 1000, 2000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setAmountToAdd(amt.toString())}
                      className={`flex-1 py-4 rounded-xl font-bold transition-all ${
                        amountToAdd === amt.toString() ? 'bg-primary text-black' : 'bg-surface-variant text-white hover:bg-white/10'
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
                  placeholder="Enter custom amount"
                  className="w-full px-6 py-4 bg-surface-container border border-outline-variant/30 rounded-xl text-lg font-bold text-white placeholder:font-medium placeholder:text-on-surface-variant focus:outline-none focus:border-secondary transition-all text-center"
                />

                <button
                  onClick={handleAddFunds}
                  disabled={adding || !amountToAdd || isNaN(Number(amountToAdd)) || Number(amountToAdd) <= 0}
                  className="w-full py-4 mt-4 bg-gradient-to-r from-secondary to-primary text-black rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-95"
                >
                  {adding ? (
                    <span className="w-6 h-6 border-2 border-black/50 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined">add_circle</span> Add Funds
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
