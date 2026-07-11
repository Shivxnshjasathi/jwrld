'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeToChats, subscribeToMessages, sendMessage, markChatRead, type Chat, type Message } from '@/lib/firestore';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function AdminMessagesPage() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Subscribe to all active chats
  useEffect(() => {
    const unsubscribe = subscribeToChats((data) => {
      setChats(data);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to messages when a chat is selected
  useEffect(() => {
    if (!selectedChat) return;

    markChatRead(selectedChat.id, 'admin').catch(console.error);

    const unsubscribe = subscribeToMessages(selectedChat.id, (msgs) => {
      setMessages(msgs);
      markChatRead(selectedChat.id, 'admin').catch(console.error);
    });

    return () => unsubscribe();
  }, [selectedChat]);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;
    
    setSending(true);
    try {
      await sendMessage(selectedChat.id, selectedChat.userName, newMessage.trim(), 'admin');
      setNewMessage('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send message');
    }
    setSending(false);
  };

  return (
    <div className="min-h-dvh flex flex-col md:flex-row relative overflow-hidden text-on-surface">
      {/* Ambient Background Light */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Sidebar: Chat List */}
      <div className={`md:w-1/3 md:border-r border-white/10 glass-panel flex flex-col h-dvh ${selectedChat ? 'hidden md:flex' : 'flex'} relative z-10`}>
        <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-surface/20">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 shrink-0 bg-white/5 rounded-full flex items-center justify-center transition-colors hover:text-primary hover:bg-white/10 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <h1 className="font-display-md text-headline-md tracking-tight">Inbox</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto chat-scroll p-4 space-y-3">
          {chats.length === 0 ? (
            <div className="text-center py-10 text-on-surface-variant font-label-md">
              No messages yet
            </div>
          ) : (
            chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full text-left p-4 rounded-xl flex items-center gap-4 transition-colors ${
                  selectedChat?.id === chat.id 
                    ? 'bg-white/10 border border-primary/30 neon-glow-primary' 
                    : 'bg-white/5 hover:bg-white/10 border border-white/5'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 text-on-surface relative border border-white/10">
                  <span className="material-symbols-outlined text-[24px]">person</span>
                  {chat.unreadAdmin > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full border-2 border-surface flex items-center justify-center text-[10px] font-bold text-background neon-glow-secondary">
                      {chat.unreadAdmin}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-label-md text-on-surface truncate pr-2">{chat.userName}</h3>
                    <span className="font-label-sm text-[10px] text-on-surface-variant shrink-0">
                      {format(new Date(chat.lastMessageAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className={`font-body-md text-xs truncate ${chat.unreadAdmin > 0 ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>
                    {chat.lastMessage}
                  </p>
                </div>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant shrink-0">chevron_right</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content: Chat View */}
      <div className={`flex-1 flex flex-col h-dvh relative z-10 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {!selectedChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center shadow-sm mb-4 border border-white/10">
              <span className="material-symbols-outlined text-[32px] text-on-surface-variant">forum</span>
            </div>
            <h2 className="font-headline-md text-headline-md">Select a conversation</h2>
            <p className="font-body-md text-on-surface-variant mt-1">Choose a chat from the sidebar to start messaging.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <header className="glass-panel w-full flex items-center gap-3 px-gutter py-md border-b border-white/10 shadow-sm bg-surface/10 backdrop-blur-xl">
              <button
                onClick={() => setSelectedChat(null)}
                className="w-10 h-10 shrink-0 bg-white/5 rounded-full flex items-center justify-center md:hidden hover:text-primary transition-colors active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div className="w-10 h-10 rounded-full bg-surface-container-high border border-white/20 flex items-center justify-center text-on-surface shrink-0 relative">
                <span className="material-symbols-outlined text-[20px]">person</span>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-secondary rounded-full border-2 border-surface neon-glow-secondary"></span>
              </div>
              <div className="flex flex-col">
                <h2 className="font-headline-md text-[16px] tracking-tight leading-none">{selectedChat.userName}</h2>
                <p className="font-label-sm text-secondary flex items-center gap-xs mt-1">User • Online</p>
              </div>
              
              <div className="ml-auto flex items-center gap-md text-on-surface-variant">
                <button aria-label="More options" className="hover:text-primary transition-colors active:scale-95 duration-200">
                  <span className="material-symbols-outlined text-[24px]">more_vert</span>
                </button>
              </div>
            </header>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto chat-scroll px-gutter py-lg flex flex-col gap-lg z-10" ref={scrollRef}>
              {messages.map((msg) => {
                const isAdmin = msg.sender === 'admin';
                return (
                  <div key={msg.id} className={`flex flex-col gap-xs max-w-[85%] md:max-w-[70%] ${isAdmin ? 'items-end self-end' : 'items-start'}`}>
                    <div className={`px-md py-sm text-on-surface font-body-md text-[15px] ${
                      isAdmin 
                        ? 'glass-bubble-user rounded-2xl rounded-tr-sm' 
                        : 'glass-bubble-agent rounded-2xl rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                    <div className={`flex items-center gap-xs ${isAdmin ? 'mr-1' : 'ml-1'}`}>
                      <span className="font-label-sm text-[10px] text-on-surface-variant/50">
                        {format(new Date(msg.createdAt), 'hh:mm a')}
                      </span>
                      {isAdmin && (
                        <span className="material-symbols-outlined text-[14px] text-secondary">done_all</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input */}
            <div className="w-full glass-panel z-50 border-t border-white/10 bg-surface/40 backdrop-blur-2xl">
              <form onSubmit={handleSend} className="max-w-container-max mx-auto px-gutter py-md flex items-end gap-sm">
                <button 
                  type="button"
                  aria-label="Add attachment" 
                  className="p-sm rounded-full text-on-surface-variant hover:text-primary hover:bg-white/5 transition-all active:scale-95 flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[24px]">add</span>
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a reply..."
                    className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 pl-md pr-[50px] text-on-surface font-body-md text-body-md focus:ring-0 focus:border-secondary transition-colors overflow-hidden placeholder-on-surface-variant/50"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    aria-label="Send" 
                    className="absolute right-sm bottom-1/2 translate-y-1/2 p-2 text-on-surface-variant hover:text-secondary transition-colors active:scale-95 disabled:opacity-50 disabled:hover:text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-[24px]">send</span>
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
