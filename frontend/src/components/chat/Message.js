import React from 'react';
import { useAuth } from '../../context/AuthContext';

const formatMessageTime = (timestamp) => {
  if (!timestamp) {
    console.log('⏰ No timestamp provided, returning "Now"');
    return 'Now';
  }
  
  const messageDate = new Date(timestamp);
  const now = new Date();
  
  // Debug logging
  console.log('⏰ Formatting timestamp:', timestamp);
  console.log('⏰ Message date:', messageDate.toISOString());
  console.log('⏰ Current time:', now.toISOString());
  
  // Check if date is valid
  if (isNaN(messageDate.getTime())) {
    console.log('⏰ Invalid date, returning "Now"');
    return 'Now';
  }
  
  const diffInMs = now - messageDate;
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  console.log('⏰ Time difference:', {
    seconds: diffInSeconds,
    minutes: diffInMinutes,
    hours: diffInHours,
    days: diffInDays
  });
  
  if (diffInSeconds < 10) {
    return 'Just now';
  } else if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return messageDate.toLocaleDateString();
  }
};

export default function Message({ message, currentChat }) {
  const { user } = useAuth();
  
  if (!message) return null;
  
  const isFromCurrentUser = message.sender_id === user?.id;
  const isDecrypted = message.isDecrypted !== false;
  
  return (
    <div className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-card shadow-sm ${
          isFromCurrentUser
            ? 'bg-brand-green text-white rounded-br-none'
            : 'bg-background-white text-text-primary rounded-bl-none border border-ui-border'
        }`}
      >
        <p className="text-sm font-baloo">
          {isDecrypted ? (message.text || '[Tin nhắn trống]') : '[Tin nhắn được mã hóa]'}
        </p>
        <p className={`text-xs mt-1 ${isFromCurrentUser ? 'text-white/75' : 'text-text-light'}`}>
          {formatMessageTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}