import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { chatAPI, userAPI } from '../services/api';
import { 
  generateSharedSecret, 
  encryptMessage, 
  decryptMessage, 
  generateIV
} from '../utils/crypto';
import { useAuth } from './AuthContext';

const initialState = {
  chats: [],
  messages: [],
  currentChat: null,
  isLoading: false,
  error: null,
  notifications: []
};

const CHAT_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_CHATS: 'SET_CHATS',
  SET_CURRENT_CHAT: 'SET_CURRENT_CHAT',
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  REMOVE_MESSAGE: 'REMOVE_MESSAGE',
  CLEAR_ERROR: 'CLEAR_ERROR',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS'
};

export { CHAT_ACTIONS };

function chatReducer(state, action) {
  switch (action.type) {
    case CHAT_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    case CHAT_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    case CHAT_ACTIONS.SET_CHATS:
      return {
        ...state,
        chats: action.payload,
        isLoading: false
      };
    case CHAT_ACTIONS.SET_CURRENT_CHAT:
      return {
        ...state,
        currentChat: action.payload
      };
    case CHAT_ACTIONS.SET_MESSAGES:
      return {
        ...state,
        messages: action.payload,
        isLoading: false
      };
    case CHAT_ACTIONS.ADD_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
    case CHAT_ACTIONS.REMOVE_MESSAGE:
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.payload)
      };
    case CHAT_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    case CHAT_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };
    case CHAT_ACTIONS.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: []
      };
    default:
      return state;
  }
}

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user, privateKey } = useAuth();
  const wsRef = useRef(null);
  const handleWebSocketMessageRef = useRef(null);

  const loadChats = useCallback(async () => {
    dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const response = await chatAPI.getChatList();
      
      const chats = response.data.data?.chats || response.data.chats || [];

      const decryptedChats = await Promise.all(chats.map(async (chat) => {
        if (!chat.last_message || !chat.iv) return chat;
        
        try {
          const publicKeyResponse = await userAPI.getPublicKey(chat.user_id);
          const publicKey = publicKeyResponse.data.data?.public_key;
          
          if (!publicKey) {
            return { ...chat, last_message: '[Tin nhắn được mã hóa]' };
          }

          const sharedSecret = generateSharedSecret(privateKey, publicKey);
          
          const decryptedMessage = decryptMessage(chat.last_message, sharedSecret, chat.iv);
          
          return {
            ...chat,
            last_message: decryptedMessage || '[Không thể giải mã]'
          };
        } catch (error) {
          return { ...chat, last_message: '[Không thể giải mã]' };
        }
      }));
      
      dispatch({
        type: CHAT_ACTIONS.SET_CHATS,
        payload: decryptedChats
      });
    } catch (error) {
      dispatch({
        type: CHAT_ACTIONS.SET_ERROR,
        payload: error.response?.data?.message || 'Failed to load chats'
      });
    }
  }, [privateKey]);

  const loadMessages = useCallback(async (userID) => {
    if (!privateKey || !user?.id) return;
    
    try {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });
      
      const response = await chatAPI.getMessagesByUser(userID);
      const messages = response.data.data?.messages || [];
      
      const publicKeyResponse = await userAPI.getPublicKey(userID);
      const publicKey = publicKeyResponse.data.data?.public_key;
      
      if (!publicKey) {
        dispatch({ type: CHAT_ACTIONS.SET_MESSAGES, payload: [] });
        return;
      }

      const sharedSecret = generateSharedSecret(privateKey, publicKey);
      
      const decryptedMessages = await Promise.all(messages.map(async (msg) => {
        if (!msg.cipher_text || !msg.iv) {
          return {
            ...msg,
            text: '[Tin nhắn không hợp lệ]',
            isDecrypted: false
          };
        }
        
        try {
          const decryptedText = decryptMessage(msg.cipher_text, sharedSecret, msg.iv);
          return {
            ...msg,
            text: decryptedText,
            created_at: new Date(msg.timestamp * 1000).toISOString(),
            isDecrypted: true
          };
        } catch (error) {
          return {
            ...msg,
            text: '[Không thể giải mã]',
            created_at: new Date(msg.timestamp * 1000).toISOString(),
            isDecrypted: false
          };
        }
      }));

      dispatch({ type: CHAT_ACTIONS.SET_MESSAGES, payload: decryptedMessages });
    } catch (error) {
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: 'Không thể tải tin nhắn' });
    } finally {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: false });
    }
  }, [privateKey, user?.id]);

  const updateChatWithNewMessage = useCallback((chatToUpdate, newMessage, decryptedText) => {
    dispatch({
      type: CHAT_ACTIONS.SET_CHATS,
      payload: state.chats.map(chat => {
        if (chat.user_id === chatToUpdate.user_id) {
          return {
            ...chat,
            last_message: decryptedText,
            last_message_timestamp: newMessage.timestamp || Math.floor(Date.now() / 1000),
            iv: newMessage.iv
          };
        }
        return chat;
      })
    });
  }, [state.chats]);

  const handleWebSocketMessage = useCallback(async (event) => {
    try {
      const data = JSON.parse(event.data);
      const { sender_id, receiver_id, cipher_text, timestamp, iv } = data;
      
      const response = await userAPI.getPublicKey(sender_id);
      const publicKey = response.data.data?.public_key;
      
      if (!publicKey) {
        return;
      }
      
      const sharedSecret = generateSharedSecret(privateKey, publicKey);
      const decryptedText = decryptMessage(cipher_text, sharedSecret, iv);
      
      const newMessage = {
        id: `${timestamp}${Math.random()}`,
        text: decryptedText,
        sender_id,
        receiver_id,
        created_at: new Date(timestamp * 1000).toISOString(),
        isDecrypted: true
      };

      let relevantChat = state.chats.find(chat => chat.user_id === sender_id);

      // If no chat exists with the sender, create a new chat entry
      if (!relevantChat && sender_id !== user?.id) {
        try {
          const userResponse = await userAPI.getUserById(sender_id);
          const senderUser = userResponse.data.data;
          
          const newChat = {
            user_id: sender_id,
            username: senderUser.username,
            conversation_id: null,
            last_message: decryptedText,
            last_message_timestamp: timestamp,
            iv: iv,
            updated_at: new Date(timestamp * 1000).toISOString()
          };
          
          dispatch({
            type: CHAT_ACTIONS.SET_CHATS,
            payload: [newChat, ...state.chats]
          });
          
          relevantChat = newChat;
        } catch (error) {
          // Silently fail, chat will be created when user starts conversation
        }
      }

      if (state.currentChat?.user_id === sender_id) {
        dispatch({ type: CHAT_ACTIONS.ADD_MESSAGE, payload: newMessage });
        // Always update chat with new message
        if (relevantChat) {
          updateChatWithNewMessage(relevantChat, data, decryptedText);
        }
      } else {
        dispatch({
          type: CHAT_ACTIONS.ADD_NOTIFICATION,
          payload: { senderID: sender_id, message: decryptedText, timestamp }
        });
        
        // Always update chat with new message, even if not in current view
        if (relevantChat) {
          updateChatWithNewMessage(relevantChat, data, decryptedText);
        }

        if (Notification.permission === 'granted') {
          const senderChat = state.chats.find(chat => chat.user_id === sender_id);
          new Notification('Tin nhắn mới', {
            body: `${senderChat?.username || 'Người dùng'}: ${decryptedText}`,
            icon: '/logo192.png'
          });
        }
      }
    } catch (error) {
      // Silent fail for malformed messages
    }
  }, [privateKey, state.chats, updateChatWithNewMessage, user?.id, state.currentChat?.user_id]);

  // Keep ref always pointing to latest handler so WS onmessage never goes stale
  useEffect(() => {
    handleWebSocketMessageRef.current = handleWebSocketMessage;
  }, [handleWebSocketMessage]);

  // Create WebSocket connection with auto-reconnect
  useEffect(() => {
    if (!user?.id || !privateKey) return;

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;
    const baseDelay = 1000; // 1 second
    let reconnectTimeout;

    const connectWebSocket = () => {
      const apiBase = process.env.REACT_APP_API_URL || 'http://192.168.2.10:8089';
      const wsBase = apiBase.replace(/^http/, 'ws');
      const wsUrl = `${wsBase}/api/ws/${user.id}`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          reconnectAttempts = 0; // Reset attempts on successful connection
        };
        ws.onmessage = (event) => handleWebSocketMessageRef.current(event);
        ws.onerror = () => {
          // Connection error, will trigger onclose
        };
        ws.onclose = () => {
          if (reconnectAttempts < maxReconnectAttempts) {
            // Exponential backoff with jitter
            const delay = baseDelay * Math.pow(1.5, reconnectAttempts) + Math.random() * 1000;
            reconnectTimeout = setTimeout(() => {
              reconnectAttempts++;
              connectWebSocket();
            }, delay);
          }
        };
      } catch (error) {
        // Silently fail, will retry after delay
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = baseDelay * Math.pow(1.5, reconnectAttempts) + Math.random() * 1000;
          reconnectTimeout = setTimeout(() => {
            reconnectAttempts++;
            connectWebSocket();
          }, delay);
        }
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user?.id, privateKey]);

  const sendMessage = useCallback(async (receiverID, messageText) => {
    if (!privateKey || !user?.id) {
      throw new Error('Missing private key or user ID');
    }

    try {
      const response = await userAPI.getPublicKey(receiverID);
      const publicKey = response.data.data?.public_key;
      
      if (!publicKey) {
        throw new Error('Could not get receiver public key');
      }

      const sharedSecret = generateSharedSecret(privateKey, publicKey);
      
      const iv = generateIV();
      
      const encryptedMessage = encryptMessage(messageText, sharedSecret, iv);
      
      const messageData = {
        receiver_id: receiverID,
        cipher_text: encryptedMessage,
        iv: iv
      };

      const response2 = await chatAPI.sendMessage(messageData);
      const timestamp = response2.data.data?.timestamp || Math.floor(Date.now() / 1000);

      const newMessage = {
        id: `${timestamp}${Math.random()}`,
        text: messageText,
        sender_id: user.id,
        receiver_id: receiverID,
        created_at: new Date(timestamp * 1000).toISOString(),
        isDecrypted: true
      };

      dispatch({ type: CHAT_ACTIONS.ADD_MESSAGE, payload: newMessage });

      const relevantChat = state.chats.find(chat => chat.user_id === receiverID);
      if (relevantChat) {
        updateChatWithNewMessage(relevantChat, { ...messageData, timestamp }, messageText);
      }

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }, [privateKey, user?.id, state.chats, updateChatWithNewMessage]);

  const setCurrentChat = useCallback((chat) => {
    dispatch({ type: CHAT_ACTIONS.SET_CURRENT_CHAT, payload: chat });
    if (chat) {
      loadMessages(chat.user_id);
    }
  }, [loadMessages]);

  const clearError = useCallback(() => {
    dispatch({ type: CHAT_ACTIONS.CLEAR_ERROR });
  }, []);

  const clearNotifications = useCallback(() => {
    dispatch({ type: CHAT_ACTIONS.CLEAR_NOTIFICATIONS });
  }, []);

  const deleteMessage = useCallback(async (messageID) => {
    try {
      await chatAPI.deleteMessage(messageID);
      dispatch({ type: CHAT_ACTIONS.REMOVE_MESSAGE, payload: messageID });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }, []);

  const deleteConversation = useCallback(async (conversationID) => {
    try {
      await chatAPI.deleteConversation(conversationID);
      
      dispatch({
        type: CHAT_ACTIONS.SET_CHATS,
        payload: state.chats.filter(chat => chat.conversation_id !== conversationID)
      });
      
      if (state.currentChat && state.currentChat.conversation_id === conversationID) {
        dispatch({ type: CHAT_ACTIONS.SET_CURRENT_CHAT, payload: null });
        dispatch({ type: CHAT_ACTIONS.SET_MESSAGES, payload: [] });
      }
      
      return { success: true };
    } catch (error) {
      dispatch({
        type: CHAT_ACTIONS.SET_ERROR,
        payload: error.response?.data?.message || 'Failed to delete conversation'
      });
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }, [state.chats, state.currentChat]);

  const value = {
    chats: state.chats,
    currentChat: state.currentChat,
    messages: state.messages,
    error: state.error,
    isLoading: state.isLoading,
    notifications: state.notifications,
    setCurrentChat,
    loadChats,
    loadMessages,
    sendMessage,
    clearNotifications,
    deleteMessage,
    deleteConversation,
    dispatch,
    CHAT_ACTIONS
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 