import React from 'react';
import { useChat } from '../context/ChatContext';
import ChatSidebar from '../components/chat/ChatSidebar';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import Header from '../components/layout/Header';
import NotificationBadge from '../components/chat/NotificationBadge';

export default function ChatPage() {
  const { currentChat, error } = useChat();

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <ChatSidebar />
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