'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
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
    <div className="min-h-dvh bg-[#F5F5F5] flex flex-col">
      {/* Header */}
      <div className="bg-[#F5F5F5] px-4 md:px-6 pt-12 pb-4 sticky top-0 z-10 border-b border-gray-200">
        <div className="flex items-center gap-3 max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 shrink-0 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100"
          >
            <ArrowLeft size={20} className="text-gray-900" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Support</h1>
            <p className="text-[12px] md:text-[13px] text-gray-500 font-medium mt-0.5">
              Chat with admin
            </p>
          </div>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-w-7xl mx-auto w-full" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <span className="text-2xl">👋</span>
            </div>
            <h3 className="text-gray-900 font-bold mb-1">How can we help?</h3>
            <p className="text-sm text-gray-500">Send us a message and we&apos;ll get back to you as soon as possible.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-[1.5rem] p-4 shadow-sm ${
                  isUser ? 'bg-[#111111] text-white rounded-tr-sm' : 'bg-white text-gray-900 rounded-tl-sm'
                }`}>
                  <p className="text-[14px] leading-relaxed">{msg.text}</p>
                  <p className={`text-[10px] mt-2 font-medium ${isUser ? 'text-gray-400' : 'text-gray-400'}`}>
                    {format(new Date(msg.createdAt), 'hh:mm a')}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input area */}
      <div className="bg-white p-4 pb-8 md:pb-4 border-t border-gray-100 mt-auto sticky bottom-0">
        <form onSubmit={handleSend} className="max-w-7xl mx-auto flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-[#F5F5F5] rounded-full px-5 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-12 h-12 shrink-0 bg-[#111111] text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-colors shadow-sm"
          >
            <Send size={18} className="ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}
