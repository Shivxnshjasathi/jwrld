'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { subscribeToAssets, addAsset, updateAssetAdmin, deleteAsset, type Asset } from '@/lib/firestore';
import { useRouter } from 'next/navigation';

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAssetId, setCurrentAssetId] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'pool' as 'pool' | 'snooker' | 'ps5',
    price: 0,
    status: 'active' as 'active' | 'maintenance'
  });

  useEffect(() => {
    const unsub = subscribeToAssets((data) => {
      setAssets(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', category: 'pool', price: 0, status: 'active' });
    setIsEditing(false);
    setCurrentAssetId('');
  };

  const handleEdit = (asset: Asset) => {
    setFormData({
      name: asset.name,
      category: asset.category,
      price: asset.price,
      status: asset.status
    });
    setCurrentAssetId(asset.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      await deleteAsset(id);
      toast.success('Asset deleted');
    } catch (e: any) {
      toast.error('Failed to delete asset');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price <= 0) {
      toast.error('Please fill all fields correctly');
      return;
    }

    try {
      if (isEditing) {
        await updateAssetAdmin(currentAssetId, formData);
        toast.success('Asset updated');
      } else {
        await addAsset(formData);
        toast.success('Asset created');
      }
      setShowModal(false);
      resetForm();
    } catch (e: any) {
      toast.error(isEditing ? 'Failed to update' : 'Failed to create');
    }
  };

  return (
    <div className="w-full py-xl px-gutter md:px-xl min-h-screen">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-lg">
        <div>
          <button onClick={() => router.push('/admin')} className="text-primary hover:opacity-80 transition-opacity mb-2 flex items-center gap-1 font-label-md text-[14px]">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to Dashboard
          </button>
          <h1 className="font-headline-lg-mobile md:text-[32px] font-bold text-primary-fixed-dim">Manage Assets</h1>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-primary text-black px-6 py-2 rounded-xl font-bold hover:scale-[1.02] transition-all"
        >
          + Add Asset
        </button>
      </div>

      {loading ? (
        <p className="text-on-surface-variant">Loading assets...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {assets.map((asset) => (
            <div key={asset.id} className="glass-panel rounded-xl p-md border-l-4 border-l-secondary">
              <div className="flex justify-between items-start mb-sm">
                <h3 className="font-bold text-[18px] text-white">{asset.name}</h3>
                <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full ${asset.status === 'active' ? 'bg-secondary/20 text-secondary' : 'bg-error/20 text-error'}`}>
                  {asset.status}
                </span>
              </div>
              <p className="text-on-surface-variant text-[14px] mb-1">Category: <span className="text-white capitalize">{asset.category}</span></p>
              <p className="text-on-surface-variant text-[14px] mb-4">Price: <span className="text-white font-bold">₹{asset.price}/hr</span></p>
              
              <div className="flex gap-sm">
                <button 
                  onClick={() => handleEdit(asset)}
                  className="flex-1 glass-panel text-on-surface py-2 rounded-lg font-bold text-[12px] hover:bg-white/10 transition-colors"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(asset.id)}
                  className="flex-1 glass-panel text-error py-2 rounded-lg font-bold text-[12px] hover:bg-error/20 hover:border-error/40 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {assets.length === 0 && (
            <div className="col-span-full p-8 text-center text-on-surface-variant glass-panel rounded-xl">
              No assets found.
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
            <h2 className="text-xl font-bold text-white mb-6">{isEditing ? 'Edit Asset' : 'Add Asset'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Asset Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary"
                  placeholder="e.g. Pool Table 3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary appearance-none"
                  >
                    <option value="pool">Pool</option>
                    <option value="snooker">Snooker</option>
                    <option value="ps5">PS5</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Price/hr (₹)</label>
                  <input 
                    type="number" 
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Status</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary appearance-none"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full mt-6 py-4 rounded-xl font-bold bg-gradient-to-r from-secondary to-primary text-black transition-all hover:scale-[1.02]"
              >
                {isEditing ? 'Save Changes' : 'Create Asset'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
