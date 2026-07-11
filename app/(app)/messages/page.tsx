'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { subscribeToMessages, sendMessage, markChatRead, type Message } from '@/lib/firestore';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function UserMessagesPage() {
  const { user, appUser } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    
    // Mark as read when entering the page
    markChatRead(user.uid, 'user').catch(console.error);

    const unsubscribe = subscribeToMessages(user.uid, (msgs) => {
      setMessages(msgs);
      // Mark as read whenever new messages arrive while on this page
      markChatRead(user.uid, 'user').catch(console.error);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !appUser) return;
    
    setSending(true);
    try {
      await sendMessage(user.uid, appUser.name, newMessage.trim(), 'user');
      setNewMessage('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send message');
    }
    setSending(false);
  };

  return (
    <div className="bg-[#0A0A0B] text-on-surface min-h-screen flex flex-col font-body-md overflow-hidden selection:bg-primary selection:text-on-primary">
      
      {/* Header */}
      <header className="glass-panel fixed top-0 w-full z-50 flex justify-between items-center px-gutter py-md border-b border-outline-variant/20 shadow-sm bg-surface/10 backdrop-blur-xl">
        <div className="flex items-center gap-md">
          <button 
            onClick={() => router.back()} 
            aria-label="Back" 
            className="text-on-surface-variant hover:text-primary transition-colors active:scale-95 duration-200"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          
          <div className="flex items-center gap-sm">
            <div className="relative">
              <div className="w-10 h-10 rounded-full object-cover border border-white/20 bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant">support_agent</span>
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-secondary rounded-full border-2 border-[#0A0A0B] neon-glow-secondary"></span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-md text-[20px] font-bold text-on-surface tracking-tight leading-none">Support</span>
              <span className="font-label-sm text-[12px] font-bold text-secondary flex items-center gap-xs mt-1">
                Online
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-md text-on-surface-variant">
          <button aria-label="More options" className="hover:text-primary transition-colors active:scale-95 duration-200">
            <span className="material-symbols-outlined text-[24px]">more_vert</span>
          </button>
        </div>
      </header>

      {/* Main Chat Canvas */}
      <main className="flex-1 flex flex-col pt-[88px] pb-[88px] max-w-container-max mx-auto w-full relative">
        
        {/* Ambient Background Light */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-[100px]"></div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto chat-scroll px-gutter py-lg flex flex-col gap-lg z-10" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center shadow-sm mb-4">
                <span className="text-2xl">👋</span>
              </div>
              <h3 className="text-white font-bold mb-1 text-[20px]">How can we help?</h3>
              <p className="text-sm text-on-surface-variant">Send us a message and we'll get back to you as soon as possible.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <span className="font-label-sm text-[12px] font-bold text-on-surface-variant/60 glass-panel px-md py-xs rounded-full">Today</span>
              </div>
              
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div key={msg.id} className={`flex flex-col gap-xs max-w-[85%] md:max-w-[70%] ${isUser ? 'items-end self-end' : 'items-start'}`}>
                    <div className={`px-md py-sm text-on-surface font-body-md text-[16px] ${
                      isUser ? 'glass-bubble-user rounded-2xl rounded-tr-sm' : 'glass-bubble-agent rounded-2xl rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                    <div className={`flex items-center gap-xs ${isUser ? 'mr-1' : 'ml-1'}`}>
                      <span className="font-label-sm text-[12px] text-on-surface-variant/50">
                        {format(new Date(msg.createdAt), 'hh:mm a')}
                      </span>
                      {isUser && <span className="material-symbols-outlined text-[14px] text-secondary">done_all</span>}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </main>

      {/* Chat Input Area */}
      <div className="fixed bottom-0 w-full glass-panel z-50 border-t border-white/10 bg-surface/40 backdrop-blur-2xl">
        <form onSubmit={handleSend} className="max-w-container-max mx-auto px-gutter py-md flex items-end gap-sm">
          <button type="button" aria-label="Add attachment" className="p-sm rounded-full text-on-surface-variant hover:text-primary hover:bg-white/5 transition-all active:scale-95 flex-shrink-0">
            <span className="material-symbols-outlined text-[24px]">add</span>
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-[#050505] border border-white/10 rounded-xl py-4 pl-md pr-xl text-on-surface font-body-md text-[16px] focus:ring-0 focus:border-secondary transition-colors placeholder-on-surface-variant/50 focus:outline-none"
            />
            <button 
              type="submit"
              disabled={!newMessage.trim() || sending}
              aria-label="Send" 
              className="absolute right-sm bottom-1/2 translate-y-1/2 text-on-surface-variant hover:text-secondary transition-colors active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[24px]">send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
