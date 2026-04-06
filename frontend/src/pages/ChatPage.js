import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import ChatSidebar from '../components/chat/ChatSidebar';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import Header from '../components/layout/Header';
import NotificationBadge from '../components/chat/NotificationBadge';

export default function ChatPage() {
  const { currentChat, error } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex">
          <ChatSidebar />
        </div>
        
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div 
              className="flex-1 bg-black bg-opacity-50"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="w-80 bg-background-white border-l border-ui-border">
              <ChatSidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}
        
        <div className="flex-1 flex flex-col">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4">
              {error}
            </div>
          )}
          <MessageList />
          {currentChat && <MessageInput />}
        </div>
      </div>
      <NotificationBadge />
    </div>
  );
} 