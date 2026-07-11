'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getGlobalSettings, updateGlobalSettings, type GlobalSettings } from '@/lib/firestore';
import { useRouter } from 'next/navigation';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getGlobalSettings();
        setSettings(data);
      } catch (e) {
        toast.error('Failed to load settings');
      }
      setLoading(false);
    };
    loadSettings();
  }, []);

  const handleToggle = async (key: keyof GlobalSettings) => {
    if (!settings) return;
    const newValue = !settings[key];
    setSettings({ ...settings, [key]: newValue });
    
    setSaving(true);
    try {
      await updateGlobalSettings({ [key]: newValue });
      toast.success('Setting updated');
    } catch (e) {
      toast.error('Failed to update setting');
      // Revert on failure
      setSettings({ ...settings, [key]: !newValue });
    }
    setSaving(false);
  };

  const handleUpdateString = async (key: keyof GlobalSettings, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
    setSaving(true);
    try {
      await updateGlobalSettings({ [key]: value });
      toast.success('Setting updated');
    } catch (e) {
      toast.error('Failed to update setting');
    }
    setSaving(false);
  };

  return (
    <div className="w-full py-xl px-gutter md:px-xl min-h-screen">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-lg">
        <div>
          <button onClick={() => router.push('/admin')} className="text-primary hover:opacity-80 transition-opacity mb-2 flex items-center gap-1 font-label-md text-[14px]">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to Dashboard
          </button>
          <h1 className="font-headline-lg-mobile md:text-[32px] font-bold text-primary-fixed-dim">Global Settings</h1>
        </div>
      </div>

      {loading ? (
        <p className="text-on-surface-variant">Loading settings...</p>
      ) : (
        <div className="max-w-[672px]">
          <div className="glass-panel rounded-xl p-lg">
            <h2 className="text-xl font-bold text-white mb-6">Booking Preferences</h2>
            
            <div className="flex items-center justify-between py-4 border-b border-outline-variant/20">
              <div>
                <h3 className="font-bold text-white text-[16px]">Allow Guest Bookings</h3>
                <p className="text-on-surface-variant text-[14px] mt-1">
                  When enabled, unauthenticated users can make bookings without logging in.
                </p>
              </div>
              <button
                disabled={saving}
                onClick={() => handleToggle('allowGuestBooking')}
                className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none flex-shrink-0 ${
                  settings?.allowGuestBooking ? 'bg-primary' : 'bg-surface-variant'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-black transition-transform duration-300 ${
                    settings?.allowGuestBooking ? 'transform translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Payment Settings */}
            <h2 className="text-xl font-bold text-white mb-6 mt-10">Payment Settings</h2>
            <div className="py-4">
              <label className="block text-[14px] font-bold text-white mb-2">UPI ID</label>
              <p className="text-on-surface-variant text-[14px] mb-4">
                This UPI ID will be shown to users when they choose to pay via UPI at checkout.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={settings?.upiId || ''}
                  onChange={(e) => setSettings({ ...settings!, upiId: e.target.value })}
                  placeholder="e.g. yourname@upi"
                  className="w-full bg-surface-container rounded-xl px-4 py-3 text-[14px] text-white border border-outline-variant/30 focus:border-primary outline-none"
                />
                <button
                  disabled={saving}
                  onClick={() => handleUpdateString('upiId', settings?.upiId || '')}
                  className="bg-primary text-background font-bold px-6 py-3 rounded-xl hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
