import React, { useEffect, useRef } from 'react';
import { useChat } from "../../context/ChatContext";
import Message from "./Message";

export default function MessageList() {
  const { messages, currentChat, isLoading } = useChat();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-ghibli-background">
        <div className="text-center text-ghibli-text">
          <p className="text-lg font-medium mb-2">Chọn một cuộc trò chuyện</p>
          <p className="text-sm opacity-75">Chọn một cuộc trò chuyện từ danh sách hoặc bắt đầu một cuộc trò chuyện mới</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-ghibli-background">
        <div className="text-center text-ghibli-text">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-300 mx-auto mb-4"></div>
          <p>Đang tải tin nhắn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-ghibli-paper">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-lg text-ghibli-text mb-2">Chưa có tin nhắn</div>
            <div className="text-sm text-nav-vintage">Gửi tin nhắn để bắt đầu cuộc trò chuyện</div>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <Message key={message.id} message={message} currentChat={currentChat} />
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}