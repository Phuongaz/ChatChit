import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { TrashIcon } from '@heroicons/react/24/outline';

const formatMessageTime = (timestamp) => {
  if (!timestamp) {
    return 'Now';
  }
  
  const messageDate = new Date(timestamp);
  const now = new Date();
  
  // Check if date is valid
  if (isNaN(messageDate.getTime())) {
    return 'Now';
  }
  
  const diffInMs = now - messageDate;
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
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
  const { deleteMessage } = useChat();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteBtn, setShowDeleteBtn] = useState(false);
  
  if (!message) return null;
  
  const isFromCurrentUser = message.sender_id === user?.id;
  const isDecrypted = message.isDecrypted !== false;

  const handleDeleteMessage = async (e) => {
    e.stopPropagation();
    if (!message.id || isDeleting) return;
    
    const confirmed = window.confirm('Delete this message?');
    if (!confirmed) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteMessage(message.id);
      if (!result.success) {
        alert('Failed to delete message: ' + result.error);
      }
    } catch (error) {
      alert('Error deleting message');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div 
      className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} mb-4 group`}
      onMouseEnter={() => setShowDeleteBtn(true)}
      onMouseLeave={() => setShowDeleteBtn(false)}
    >
      <div className="flex items-end gap-2">
        <div
          className={`max-w-[280px] sm:max-w-xs lg:max-w-md px-3 md:px-4 py-2 md:py-2.5 rounded-card shadow-sm ${
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
        {isFromCurrentUser && showDeleteBtn && (
          <button
            onClick={handleDeleteMessage}
            disabled={isDeleting}
            className="p-1.5 text-text-light hover:text-status-error rounded transition-colors opacity-0 group-hover:opacity-100"
            title="Delete message"
          >
            {isDeleting ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <TrashIcon className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}