'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, User, ChevronRight } from 'lucide-react';
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
    <div className="min-h-dvh bg-[#F5F5F5] flex flex-col md:flex-row">
      {/* Sidebar: Chat List */}
      <div className={`md:w-1/3 md:border-r border-gray-200 bg-white flex flex-col h-dvh ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 shrink-0 bg-[#F5F5F5] rounded-full flex items-center justify-center transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-900" />
          </button>
          <h1 className="text-xl font-black text-gray-900">Inbox</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chats.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm font-medium">
              No messages yet
            </div>
          ) : (
            chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full text-left p-4 rounded-[1.5rem] flex items-center gap-4 transition-colors ${
                  selectedChat?.id === chat.id ? 'bg-[#F5F5F5]' : 'bg-white hover:bg-gray-50 border border-gray-100'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-[#111111] flex items-center justify-center shrink-0 text-white relative">
                  <User size={20} />
                  {chat.unreadAdmin > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold">
                      {chat.unreadAdmin}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-gray-900 truncate pr-2">{chat.userName}</h3>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {format(new Date(chat.lastMessageAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${chat.unreadAdmin > 0 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                    {chat.lastMessage}
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content: Chat View */}
      <div className={`flex-1 bg-[#F5F5F5] flex flex-col h-dvh ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {!selectedChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <User size={32} className="text-gray-300" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Select a conversation</h2>
            <p className="text-sm text-gray-500 mt-1">Choose a chat from the sidebar to start messaging.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-white p-4 border-b border-gray-200 flex items-center gap-3 sticky top-0 z-10">
              <button
                onClick={() => setSelectedChat(null)}
                className="w-10 h-10 shrink-0 bg-[#F5F5F5] rounded-full flex items-center justify-center md:hidden"
              >
                <ArrowLeft size={20} className="text-gray-900" />
              </button>
              <div className="w-10 h-10 rounded-full bg-[#111111] flex items-center justify-center text-white shrink-0">
                <User size={18} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">{selectedChat.userName}</h2>
                <p className="text-[11px] text-gray-500">User</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4" ref={scrollRef}>
              {messages.map((msg) => {
                const isAdmin = msg.sender === 'admin';
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-[1.5rem] p-4 shadow-sm ${
                      isAdmin ? 'bg-[#111111] text-white rounded-tr-sm' : 'bg-white text-gray-900 rounded-tl-sm'
                    }`}>
                      <p className="text-[14px] leading-relaxed">{msg.text}</p>
                      <p className={`text-[10px] mt-2 font-medium text-gray-400`}>
                        {format(new Date(msg.createdAt), 'hh:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input */}
            <div className="bg-white p-4 pb-8 md:pb-4 border-t border-gray-100 mt-auto">
              <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a reply..."
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
          </>
        )}
      </div>
    </div>
  );
}
