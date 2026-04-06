import React, { useState, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { PaperAirplaneIcon, FaceSmileIcon } from '@heroicons/react/24/outline';
import EmojiPicker from 'emoji-picker-react';

export default function MessageInput() {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { currentChat, sendMessage } = useChat();
  const inputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !currentChat || isSending) return;

    setIsSending(true);
    const result = await sendMessage(currentChat.user_id, message.trim());
    
    if (result.success) {
      setMessage('');
      setShowEmojiPicker(false);
    }
    setIsSending(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const onEmojiClick = (emojiData) => {
    const cursor = inputRef.current.selectionStart;
    const text = message;
    const before = text.substring(0, cursor);
    const after = text.substring(cursor);
    const newText = before + emojiData.emoji + after;
    
    setMessage(newText);
    
    // Focus back to input and set cursor position
    setTimeout(() => {
      inputRef.current.focus();
      const newCursor = cursor + emojiData.emoji.length;
      inputRef.current.setSelectionRange(newCursor, newCursor);
    }, 10);
  };

  if (!currentChat) {
    return null;
  }

  return (
    <div className="border-t border-ui-border bg-background-white p-3 md:p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        <div className="flex-1 relative">
          <div className="flex items-end">
            <div className="flex-1 relative font-baloo">
              <textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Nhắn tin cho ${currentChat.username}...`}
                className="mobile-input font-baloo"
                rows="1"
                style={{
                  minHeight: '48px',
                  height: 'auto',
                  overflowY: message.split('\n').length > 3 ? 'scroll' : 'hidden'
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                }}
                disabled={isSending}
              />
              
              {/* Emoji Button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-3 bottom-3 p-1 text-text-light hover:text-brand-orange transition-colors"
                title="Thêm emoji"
              >
                <FaceSmileIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* Send Button */}
            <button
              type="submit"
              disabled={!message.trim() || isSending}
              className="ml-3 p-3 bg-brand-green text-white rounded-button hover:bg-brand-green-dark focus:outline-none focus:ring-2 focus:ring-ui-focus focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-button"
              title="Gửi tin nhắn"
            >
              {isSending ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <PaperAirplaneIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2 z-50">
              <div className="bg-background-white rounded-card shadow-card border border-ui-border p-2">
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  width={350}
                  height={400}
                  searchDisabled={false}
                  skinTonesDisabled={false}
                  previewConfig={{
                    showPreview: false
                  }}
                  theme="light"
                />
                <div className="mt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(false)}
                    className="text-xs text-text-light hover:text-brand-orange"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
      
      {/* Click outside to close emoji picker */}
      {showEmojiPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
} 