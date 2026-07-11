'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon, type Coupon } from '@/lib/firestore';
import { useRouter } from 'next/navigation';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCouponId, setCurrentCouponId] = useState('');
  
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '' as number | '',
    active: true,
    maxUses: '' as number | '',
    usedCount: 0
  });

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await getCoupons();
      setCoupons(data);
    } catch (e) {
      toast.error('Failed to load coupons');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const resetForm = () => {
    setFormData({ 
      code: '', 
      discountType: 'percentage', 
      discountValue: '', 
      active: true,
      maxUses: '',
      usedCount: 0
    });
    setIsEditing(false);
    setCurrentCouponId('');
  };

  const handleEdit = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      active: coupon.active,
      maxUses: coupon.maxUses,
      usedCount: coupon.usedCount
    });
    setCurrentCouponId(coupon.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await deleteCoupon(id);
      toast.success('Coupon deleted');
      loadCoupons();
    } catch (e: any) {
      toast.error('Failed to delete coupon');
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      await updateCoupon(id, { active: !currentState });
      toast.success(currentState ? 'Coupon disabled' : 'Coupon enabled');
      loadCoupons();
    } catch (e: any) {
      toast.error('Failed to update status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || formData.discountValue === '' || Number(formData.discountValue) <= 0) {
      toast.error('Please fill all required fields correctly');
      return;
    }

    const payload = {
      ...formData,
      discountValue: Number(formData.discountValue),
      maxUses: Number(formData.maxUses) || 0,
      code: formData.code.trim().toUpperCase()
    };

    try {
      if (isEditing) {
        await updateCoupon(currentCouponId, payload);
        toast.success('Coupon updated');
      } else {
        await createCoupon(payload);
        toast.success('Coupon created');
      }
      setShowModal(false);
      resetForm();
      loadCoupons();
    } catch (e: any) {
      toast.error(e.message || (isEditing ? 'Failed to update' : 'Failed to create'));
    }
  };

  return (
    <div className="w-full py-xl px-gutter md:px-xl min-h-screen">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-lg">
        <div>
          <button onClick={() => router.push('/admin')} className="text-primary hover:opacity-80 transition-opacity mb-2 flex items-center gap-1 font-label-md text-[14px]">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to Dashboard
          </button>
          <h1 className="font-headline-lg-mobile md:text-[32px] font-bold text-primary-fixed-dim">Manage Coupons</h1>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-primary text-black px-6 py-2 rounded-xl font-bold hover:scale-[1.02] transition-all"
        >
          + Create Coupon
        </button>
      </div>

      {loading ? (
        <p className="text-on-surface-variant">Loading coupons...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {coupons.map((coupon) => (
            <div key={coupon.id} className={`glass-panel rounded-xl p-md border-l-4 ${coupon.active ? 'border-l-primary' : 'border-l-outline-variant/30 opacity-70'}`}>
              <div className="flex justify-between items-start mb-sm">
                <h3 className="font-bold text-[22px] tracking-wider text-primary-fixed-dim">{coupon.code}</h3>
                <button 
                  onClick={() => toggleActive(coupon.id, coupon.active)}
                  className={`px-3 py-1 text-[10px] uppercase font-bold rounded-full transition-colors ${coupon.active ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-surface-variant text-on-surface-variant hover:bg-surface-variant/80'}`}
                >
                  {coupon.active ? 'Active' : 'Inactive'}
                </button>
              </div>
              <p className="text-on-surface-variant text-[14px] mb-1">
                Discount: <span className="text-white font-bold">
                  {coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`}
                </span>
              </p>
              <p className="text-on-surface-variant text-[14px] mb-4">
                Usage: <span className="text-white">{coupon.usedCount} {coupon.maxUses > 0 ? `/ ${coupon.maxUses}` : '(Unlimited)'}</span>
              </p>
              
              <div className="flex gap-sm">
                <button 
                  onClick={() => handleEdit(coupon)}
                  className="flex-1 glass-panel text-on-surface py-2 rounded-lg font-bold text-[12px] hover:bg-white/10 transition-colors"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(coupon.id)}
                  className="flex-1 glass-panel text-error py-2 rounded-lg font-bold text-[12px] hover:bg-error/20 hover:border-error/40 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {coupons.length === 0 && (
            <div className="col-span-full p-8 text-center text-on-surface-variant glass-panel rounded-xl">
              No coupons found.
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-[448px] rounded-2xl p-6 relative shadow-[0_0_40px_rgba(0,0,0,0.8)]">
            <button 
              onClick={() => setShowModal(false)} 
              className="absolute top-4 right-4 text-on-surface-variant hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="text-xl font-bold text-white mb-6">{isEditing ? 'Edit Coupon' : 'Create Coupon'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Coupon Code</label>
                <input 
                  type="text" 
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary uppercase"
                  placeholder="e.g. SUMMER20"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Discount Type</label>
                  <select 
                    value={formData.discountType}
                    onChange={(e) => setFormData({...formData, discountType: e.target.value as any})}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary appearance-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Discount Value</label>
                  <input 
                    type="number" 
                    value={formData.discountValue}
                    onChange={(e) => setFormData({...formData, discountValue: e.target.value === '' ? '' : Number(e.target.value)})}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Max Uses (0 for unlimited)</label>
                <input 
                  type="number" 
                  value={formData.maxUses}
                  onChange={(e) => setFormData({...formData, maxUses: e.target.value === '' ? '' : Number(e.target.value)})}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary"
                  min="0"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  className="w-4 h-4 bg-surface-container border border-outline-variant/30 rounded accent-primary"
                />
                <label htmlFor="active" className="text-sm text-on-surface">Active immediately</label>
              </div>

              <button 
                type="submit"
                className="w-full mt-6 py-4 rounded-xl font-bold bg-gradient-to-r from-secondary to-primary text-black transition-all hover:scale-[1.02]"
              >
                {isEditing ? 'Save Changes' : 'Create Coupon'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
