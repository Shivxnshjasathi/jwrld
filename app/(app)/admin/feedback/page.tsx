'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Feedback, subscribeToFeedback, updateFeedbackStatus } from '@/lib/firestore';
import { toast } from 'react-hot-toast';

export default function AdminFeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/home');
    }
  }, [isAdmin, loading, router]);

  useEffect(() => {
    if (!isAdmin) return;
    const unsub = subscribeToFeedback(setFeedbackList);
    return () => unsub();
  }, [isAdmin]);

  const handleUpdateStatus = async (id: string, status: 'new' | 'read' | 'resolved') => {
    try {
      await updateFeedbackStatus(id, status);
      toast.success('Status updated');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-surface border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#0A0A0B] text-on-surface min-h-screen font-body-md selection:bg-primary/30 pb-20 md:pb-0">
      
      {/* Header */}
      <header className="bg-surface/10 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm fixed top-0 w-full z-40">
        <div className="flex items-center px-gutter py-md w-full">
          <button onClick={() => router.back()} className="mr-4 text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="font-display-md text-[20px] font-bold text-on-surface">Feedback & Bugs</div>
        </div>
      </header>

      <main className="pt-[100px] px-gutter md:px-xl max-w-[1000px] mx-auto min-h-screen">
        <div className="mb-lg">
          <h1 className="font-headline-md md:text-[32px] font-bold text-primary-fixed-dim">User Feedback</h1>
          <p className="text-on-surface-variant text-[14px]">Manage bug reports and user reviews.</p>
        </div>

        <div className="grid grid-cols-1 gap-md">
          {feedbackList.length === 0 ? (
            <div className="glass-panel p-xl rounded-2xl border-dashed border-outline-variant/30 text-center text-on-surface-variant">
              No feedback found.
            </div>
          ) : (
            feedbackList.map(item => (
              <div key={item.id} className="glass-panel p-lg rounded-2xl flex flex-col md:flex-row gap-lg justify-between items-start border-outline-variant/20">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${item.type === 'bug' ? 'bg-error/20 text-error' : 'bg-primary/20 text-primary'}`}>
                      {item.type}
                    </span>
                    <span className="text-on-surface-variant text-[12px]">{new Date(item.createdAt).toLocaleString()}</span>
                    {item.status === 'new' && (
                      <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                    )}
                  </div>
                  <h3 className="font-bold text-white text-[16px] mb-1">{item.userName}</h3>
                  <p className="text-[12px] text-on-surface-variant mb-4 font-mono">{item.userId}</p>
                  
                  <div className="bg-black/20 p-4 rounded-xl text-[14px] text-white/90 whitespace-pre-wrap font-body-md border border-white/5">
                    {item.message}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => handleUpdateStatus(item.id, 'new')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-[12px] transition-colors ${item.status === 'new' ? 'bg-white/10 text-white' : 'text-on-surface-variant hover:bg-white/5'}`}
                  >
                    Mark New
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(item.id, 'read')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-[12px] transition-colors ${item.status === 'read' ? 'bg-secondary/20 text-secondary border border-secondary/30' : 'text-on-surface-variant hover:bg-white/5'}`}
                  >
                    Mark Read
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(item.id, 'resolved')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-[12px] transition-colors ${item.status === 'resolved' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-on-surface-variant hover:bg-white/5'}`}
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
