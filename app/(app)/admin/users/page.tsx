'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { getAllUsers, updateUserRole, addWalletBalance } from '@/lib/wallet';
import type { AppUser } from '@/lib/auth';
import { useModalBackHandler } from '@/hooks/use-modal-back-handler';

export default function AdminUsersPage() {
  const { appUser } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showMoneyModal, setShowMoneyModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [moneyAmount, setMoneyAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useModalBackHandler(showMoneyModal, () => setShowMoneyModal(false));

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleMakeAdmin = async (user: AppUser) => {
    if (!window.confirm(`Are you sure you want to make ${user.name || user.email} an admin?`)) return;
    try {
      await updateUserRole(user.uid, 'admin');
      toast.success(`${user.name || user.email} is now an admin`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const openMoneyModal = (user: AppUser) => {
    setSelectedUser(user);
    setMoneyAmount('');
    setShowMoneyModal(true);
  };

  const handleAddMoney = async () => {
    if (!selectedUser || !moneyAmount || isNaN(Number(moneyAmount))) return;
    setSubmitting(true);
    try {
      await addWalletBalance(selectedUser.uid, Number(moneyAmount));
      toast.success(`₹${moneyAmount} added to ${selectedUser.name || selectedUser.email}'s wallet`);
      setShowMoneyModal(false);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to add money');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const query = search.toLowerCase();
      const emailMatch = u.email?.toLowerCase().includes(query);
      const nameMatch = u.name?.toLowerCase().includes(query);
      const phoneMatch = u.phone?.toLowerCase().includes(query);
      return emailMatch || nameMatch || phoneMatch;
    });
  }, [users, search]);

  return (
    <div className="bg-[#0A0A0B] text-on-surface min-h-screen font-body-md selection:bg-primary/30 pb-[120px] md:pb-0">
      <header className="bg-surface/10 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm fixed top-0 w-full z-40">
        <div className="flex justify-between items-center px-gutter py-md w-full">
          <div className="flex items-center gap-md">
            <button onClick={() => router.push('/admin')} className="text-on-surface-variant hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="font-headline-sm text-[20px] font-bold text-white">Users</h1>
          </div>
        </div>
      </header>

      <main className="pt-[100px] w-full px-gutter md:px-xl min-h-screen">
        <div className="mb-lg flex flex-col md:flex-row md:items-center justify-between gap-md">
          <p className="text-on-surface-variant font-body-md text-[16px]">Manage users, roles, and wallets.</p>
          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              type="text"
              placeholder="Search by email, name, or phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/30 rounded-full pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-on-surface-variant text-center py-8">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="glass-panel rounded-xl p-xl text-center flex flex-col items-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-md">person_search</span>
            <h3 className="font-headline-sm text-white font-bold mb-sm">No Users Found</h3>
            <p className="text-on-surface-variant">Try adjusting your search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            {filteredUsers.map((u) => (
              <div key={u.uid} className="glass-panel rounded-xl p-md flex flex-col justify-between border-outline-variant/30 hover:border-outline-variant/60 transition-colors">
                <div>
                  <div className="flex items-start justify-between mb-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center font-bold text-primary overflow-hidden">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          (u.name || u.email || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-white truncate max-w-[150px]">{u.name || 'Anonymous'}</h4>
                        <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">{u.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-on-surface-variant mb-1">Wallet</p>
                      <p className="font-bold text-secondary text-lg leading-none">₹{u.walletBalance || 0}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 mb-md">
                    {u.email && (
                      <div className="flex items-center gap-2 text-sm text-on-surface-variant truncate">
                        <span className="material-symbols-outlined text-[16px]">mail</span>
                        {u.email}
                      </div>
                    )}
                    {u.phone && (
                      <div className="flex items-center gap-2 text-sm text-on-surface-variant truncate">
                        <span className="material-symbols-outlined text-[16px]">call</span>
                        {u.phone}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-sm border-t border-white/5 pt-md mt-auto">
                  <button
                    onClick={() => openMoneyModal(u)}
                    className="flex-1 bg-surface-variant hover:bg-white/10 text-white text-sm font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    Money
                  </button>
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => handleMakeAdmin(u)}
                      className="flex-1 bg-primary/20 hover:bg-primary/30 text-primary text-sm font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">shield_person</span>
                      Admin
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Money Modal */}
      {showMoneyModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center animate-fade-in">
          <div className="glass-panel w-full md:w-[400px] md:rounded-2xl rounded-t-2xl p-6 border-outline-variant/30 shadow-[0_0_40px_rgba(0,0,0,0.8)] animate-slide-up-fade">
            <div className="flex items-center justify-between mb-6 border-b border-outline-variant/20 pb-4">
              <h3 className="text-xl font-bold text-white">Add Money</h3>
              <button onClick={() => setShowMoneyModal(false)} className="hover:text-white text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            
            <p className="text-sm text-on-surface-variant mb-4">
              Add funds to <strong>{selectedUser.name || selectedUser.email}</strong>'s wallet.
            </p>

            <div className="mb-6 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold text-lg">₹</span>
              <input
                type="number"
                value={moneyAmount}
                onChange={(e) => setMoneyAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-surface-container border border-outline-variant/30 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-secondary transition-colors text-lg font-bold"
              />
            </div>

            <button
              onClick={handleAddMoney}
              disabled={submitting || !moneyAmount || isNaN(Number(moneyAmount)) || Number(moneyAmount) <= 0}
              className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-secondary to-primary text-black disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95 flex justify-center items-center gap-2"
            >
              {submitting ? (
                <span className="w-5 h-5 border-2 border-black/50 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                  Add ₹{moneyAmount || '0'}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
