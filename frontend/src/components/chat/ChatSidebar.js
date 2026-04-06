import React, { useEffect, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import { TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ChatSidebar({ onClose }) {
  const { 
    chats, 
    currentChat, 
    setCurrentChat, 
    loadChats, 
    notifications, 
    deleteConversation,
    dispatch,
    CHAT_ACTIONS 
  } = useChat();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user, loadChats]);

  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (term.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await userAPI.searchUser(term);
      const users = response.data.data || [];
      // Filter out current user
      const filteredUsers = users.filter(u => u.id !== user?.id);
      setSearchResults(filteredUsers);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteChat = async (e, chat) => {
    e.stopPropagation();
    
    if (!chat.conversation_id) {
      return;
    }
    
    const confirmed = window.confirm(`Are you sure you want to delete your conversation with ${chat.username}? This action cannot be undone.`);
    if (!confirmed) return;
    
    setDeletingUserId(chat.user_id);
    const result = await deleteConversation(chat.conversation_id);
    
    if (result.success) {
      // Remove from chat list
      dispatch({
        type: CHAT_ACTIONS.SET_CHATS,
        payload: chats.filter(c => c.conversation_id !== chat.conversation_id)
      });
      
      // If current chat is being deleted, clear it
      if (currentChat?.conversation_id === chat.conversation_id) {
        setCurrentChat(null);
      }
    } else {
      alert('Failed to delete conversation: ' + result.error);
    }
    setDeletingUserId(null);
  };

  const handleUserSelect = (selectedUser) => {
    // Check if chat already exists
    const existingChat = chats.find(chat => chat.user_id === selectedUser.id);
    if (existingChat) {
      setCurrentChat(existingChat);
      setSearchTerm('');
      setSearchResults([]);
      return;
    }

    // Create new chat object
    const newChat = {
      user_id: selectedUser.id,
      username: selectedUser.username,
      conversation_id: null,
      last_message: '',
      last_message_timestamp: 0,
      updated_at: new Date().toISOString()
    };

    // Clear any existing deleting state
    setDeletingUserId(null);

    dispatch({
      type: CHAT_ACTIONS.SET_CHATS,
      payload: [newChat, ...chats]
    });
    setCurrentChat(newChat);
    setSearchTerm('');
    setSearchResults([]);
  };

  const getNotificationCount = (chatUserId) => {
    return notifications.filter(n => n.senderID === chatUserId).length;
  };

  return (
    <div className="w-80 bg-background-white border-r border-ui-border flex flex-col h-full font-baloo md:border-r-0 md:border-l">
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-ui-border bg-background-white">
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <h2 className="text-base md:text-lg font-semibold text-text-primary">Tin nhắn</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-2 text-text-light hover:text-text-primary rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="mt-2 md:mt-3">
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-primary"
          />
        </div>
      </div>

      {/* Search Results */}
      {searchTerm && (
        <div className="border-b border-ui-border max-h-60 overflow-y-auto bg-background-white ">
          {isSearching ? (
            <div className="p-4 text-center text-text-light">Đang tìm kiếm...</div>
          ) : searchResults.length > 0 ? (
            searchResults.map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className={onClose ? 'mobile-list-item' : 'list-item'}
              >
                <div className="icon-container icon-blue">
                  <span className="text-sm font-medium">
                    {user.username?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{user.username}</p>
                  <p className="text-xs text-text-light">Nhấn để bắt đầu trò chuyện</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-text-light">Không tìm thấy người dùng</div>
          )}
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto bg-background-white">
        {chats.length === 0 ? (
          <div className="p-4 text-center text-text-light">
            <p>Chưa có cuộc trò chuyện nào</p>
            <p className="text-sm mt-1">Tìm kiếm người dùng để bắt đầu trò chuyện</p>
          </div>
        ) : (
          chats.map((chat) => {
            const notificationCount = getNotificationCount(chat.user_id);
            const isDeleting = deletingUserId === chat.user_id;
            
            return (
              <div
                key={chat.user_id}
                onClick={() => !isDeleting && setCurrentChat(chat)}
                className={`${
                  onClose ? 'mobile-list-item' : 'list-item'
                } ${
                  currentChat?.user_id === chat.user_id ? 'bg-ui-active' : ''
                } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="icon-container icon-green">
                  <span className="text-sm font-medium">
                    {chat.username?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {chat.username || `Người dùng ${chat.user_id.slice(0, 8)}`}
                    </p>
                    <div className="flex items-center space-x-2">
                      {notificationCount > 0 && (
                        <div className="badge">
                          {notificationCount}
                        </div>
                      )}
                      {chat.conversation_id && (
                        <button
                          onClick={(e) => handleDeleteChat(e, chat)}
                          disabled={isDeleting}
                          className="opacity-0 group-hover:opacity-100 p-1 text-text-light hover:text-status-error rounded transition-all duration-200"
                          title="Xóa cuộc trò chuyện"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-text-light truncate mt-1">
                    {isDeleting ? 'Đang xóa...' : (chat.last_message || 'Chưa có tin nhắn')}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 