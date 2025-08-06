import React from 'react';
import { useChat } from '../../context/ChatContext';

export default function NotificationBadge() {
  const { notifications, clearNotifications } = useChat();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.slice(-3).map((notification, index) => (
        <div
          key={`${notification.senderID}-${notification.timestamp}-${index}`}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg max-w-sm"
          onClick={clearNotifications}
        >
          <div className="text-sm font-medium">
            New message from {notification.senderID.substring(0, 8)}...
          </div>
          <div className="text-xs opacity-90 mt-1">
            {notification.message.length > 40 
              ? notification.message.substring(0, 40) + '...' 
              : notification.message}
          </div>
          <div className="text-xs opacity-75 mt-1">
            Click to dismiss
          </div>
        </div>
      ))}
      
      {notifications.length > 3 && (
        <div className="bg-gray-500 text-white px-4 py-2 rounded-lg shadow-lg text-center">
          <div className="text-sm">
            +{notifications.length - 3} more messages
          </div>
          <button 
            onClick={clearNotifications}
            className="text-xs underline mt-1"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
} 