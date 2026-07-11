'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { toast } from 'react-hot-toast';

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();
  const { isAdmin, profileLoading } = useAuth();

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;
    
    if (!confirm('Are you sure you want to send this push notification to ALL users?')) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/notify-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(`Successfully sent to ${data.count} users!`);
        setTitle('');
        setBody('');
      } else {
        toast.error(data.error || 'Failed to send broadcast');
      }
    } catch (error: any) {
      toast.error(error.message || 'Network error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-background min-h-dvh text-on-surface">
      <div className="px-md py-lg max-w-container-max mx-auto">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-lg">
          <div>
            <button onClick={() => router.push('/admin')} className="text-primary hover:opacity-80 transition-opacity mb-2 flex items-center gap-1 font-label-md text-[14px]">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to Dashboard
            </button>
            <h1 className="font-display-md text-[28px] font-bold text-white leading-tight">Marketing & Broadcast</h1>
            <p className="text-on-surface-variant text-[14px]">Send push notifications to all users instantly.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
          
          {/* Create Form */}
          <div className="glass-panel rounded-2xl p-xl border border-white/5 h-fit">
            <h2 className="font-headline-sm font-bold text-white mb-md flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">campaign</span>
              New Blast
            </h2>
            <form onSubmit={handleBroadcast} className="space-y-md">
              <div>
                <label className="block text-[12px] font-bold text-on-surface-variant mb-2 uppercase tracking-wider ml-1">Notification Title</label>
                <input 
                  required 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className="w-full bg-surface-container rounded-xl px-4 py-3 text-[14px] text-white border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/50" 
                  placeholder="e.g., 🚀 Flash Sale Today Only!" 
                />
              </div>
              
              <div>
                <label className="block text-[12px] font-bold text-on-surface-variant mb-2 uppercase tracking-wider ml-1">Message Body</label>
                <textarea 
                  required 
                  value={body} 
                  onChange={e => setBody(e.target.value)} 
                  className="w-full bg-surface-container rounded-xl px-4 py-3 text-[14px] text-white border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/50" 
                  rows={4} 
                  placeholder="Get 50% off Snooker tables for the next 2 hours. Book now in the app!"
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isSending || !title || !body} 
                className="w-full mt-4 bg-primary text-background font-bold py-4 rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-[0_0_15px_rgba(223,255,0,0.3)] hover:shadow-[0_0_25px_rgba(223,255,0,0.5)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">send</span>
                {isSending ? 'Broadcasting...' : 'Send to All Users'}
              </button>
            </form>
          </div>

          {/* Preview Panel */}
          <div className="hidden lg:block relative">
            <div className="sticky top-24 ml-10">
              <p className="text-on-surface-variant text-[14px] mb-4 text-center">iOS Lock Screen Preview</p>
              
              <div className="w-[320px] h-[600px] mx-auto bg-surface-container/20 border border-white/5 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col pt-[120px] px-4 backdrop-blur-3xl">
                <div className="absolute top-0 left-0 w-full h-[30px] bg-black"></div>
                {title && (
                  <div className="bg-surface-variant/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl animate-slide-up-fade">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
                          <span className="text-[10px] font-bold text-background">J</span>
                        </div>
                        <span className="text-[12px] text-white/60 uppercase tracking-widest font-bold">Jaaduwrld</span>
                      </div>
                      <span className="text-[12px] text-white/40">now</span>
                    </div>
                    <p className="text-white font-bold text-[15px] leading-tight mb-1">{title}</p>
                    <p className="text-white/80 text-[14px] leading-snug">{body}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
