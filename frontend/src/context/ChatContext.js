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
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',
  // Reducer-level actions that always operate on fresh state (no stale closure)
  UPDATE_CHAT_LAST_MESSAGE: 'UPDATE_CHAT_LAST_MESSAGE',
  ADD_CHAT_IF_NOT_EXISTS: 'ADD_CHAT_IF_NOT_EXISTS'
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
    // Operates on fresh reducer state — safe from stale closure
    case CHAT_ACTIONS.UPDATE_CHAT_LAST_MESSAGE:
      return {
        ...state,
        chats: state.chats.map(chat =>
          chat.user_id === action.payload.userID
            ? { ...chat, last_message: action.payload.text, last_message_timestamp: action.payload.timestamp, iv: action.payload.iv }
            : chat
        )
      };
    case CHAT_ACTIONS.ADD_CHAT_IF_NOT_EXISTS:
      if (state.chats.some(c => c.user_id === action.payload.user_id)) {
        return state;
      }
      return { ...state, chats: [action.payload, ...state.chats] };
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
  // Always holds latest state so WS callbacks don't get stale closures
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  // Which thread is open — updated synchronously in setCurrentChat so WS events
  // that arrive before React commits still route to the correct conversation.
  const currentOpenChatUserIdRef = useRef(null);
  useEffect(() => {
    currentOpenChatUserIdRef.current = state.currentChat?.user_id ?? null;
  }, [state.currentChat]);

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
        if (currentOpenChatUserIdRef.current === userID) {
          dispatch({ type: CHAT_ACTIONS.SET_MESSAGES, payload: [] });
        }
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

      function stableMessageKey(m) {
        const ts = typeof m.timestamp === 'number'
          ? m.timestamp
          : Math.floor(new Date(m.created_at).getTime() / 1000);
        return `${m.sender_id ?? ''}|${m.receiver_id ?? ''}|${ts}|${m.iv ?? ''}`;
      }

      const serverKeys = new Set(decryptedMessages.map(stableMessageKey));
      const isMessageInThread = (m) =>
        (m.sender_id === userID && m.receiver_id === user.id) ||
        (m.receiver_id === userID && m.sender_id === user.id);

      const liveOnly = (stateRef.current.messages || []).filter(
        (m) => isMessageInThread(m) && !serverKeys.has(stableMessageKey(m))
      );

      const merged = [...decryptedMessages, ...liveOnly].sort((a, b) => {
        const ta = typeof a.timestamp === 'number'
          ? a.timestamp
          : Math.floor(new Date(a.created_at).getTime() / 1000);
        const tb = typeof b.timestamp === 'number'
          ? b.timestamp
          : Math.floor(new Date(b.created_at).getTime() / 1000);
        return ta - tb;
      });

      if (currentOpenChatUserIdRef.current !== userID) {
        return;
      }

      dispatch({ type: CHAT_ACTIONS.SET_MESSAGES, payload: merged });
    } catch (error) {
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: 'Không thể tải tin nhắn' });
    } finally {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: false });
    }
  }, [privateKey, user?.id]);

  // Dispatches reducer action — reducer always sees fresh state, no stale closure
  const updateChatWithNewMessage = useCallback((userID, newMessage, decryptedText) => {
    dispatch({
      type: CHAT_ACTIONS.UPDATE_CHAT_LAST_MESSAGE,
      payload: {
        userID,
        text: decryptedText,
        timestamp: newMessage.timestamp || Math.floor(Date.now() / 1000),
        iv: newMessage.iv
      }
    });
  }, []);

  const handleWebSocketMessage = useCallback(async (event) => {
    try {
      const data = JSON.parse(event.data);
      const { sender_id, receiver_id, cipher_text, timestamp, iv } = data;

      const pkResponse = await userAPI.getPublicKey(sender_id);
      const publicKey = pkResponse.data.data?.public_key;
      if (!publicKey) return;

      const sharedSecret = generateSharedSecret(privateKey, publicKey);
      const decryptedText = decryptMessage(cipher_text, sharedSecret, iv);

      const newMessage = {
        id: `${timestamp}${Math.random()}`,
        text: decryptedText,
        sender_id,
        receiver_id,
        timestamp,
        iv,
        created_at: new Date(timestamp * 1000).toISOString(),
        isDecrypted: true
      };

      // Read current chats via ref — always fresh, no stale closure
      const currentChats = stateRef.current.chats;
      const senderInList = currentChats.some(c => c.user_id === sender_id);

      // New sender not yet in sidebar — add them
      if (!senderInList && sender_id !== user?.id) {
        try {
          const userResponse = await userAPI.getUserById(sender_id);
          const senderUser = userResponse.data.data;
          dispatch({
            type: CHAT_ACTIONS.ADD_CHAT_IF_NOT_EXISTS,
            payload: {
              user_id: sender_id,
              username: senderUser?.username || sender_id.slice(0, 8),
              conversation_id: null,
              last_message: decryptedText,
              last_message_timestamp: timestamp,
              iv,
              updated_at: new Date(timestamp * 1000).toISOString()
            }
          });
        } catch (_) { /* ignore, chat will show on next reload */ }
      }

      // Update last message preview in sidebar (reducer uses fresh state)
      dispatch({
        type: CHAT_ACTIONS.UPDATE_CHAT_LAST_MESSAGE,
        payload: { userID: sender_id, text: decryptedText, timestamp, iv }
      });

      // Prefer ref synced in setCurrentChat (before paint); stateRef lags one frame.
      const openChatUserId = currentOpenChatUserIdRef.current;
      if (openChatUserId === sender_id) {
        dispatch({ type: CHAT_ACTIONS.ADD_MESSAGE, payload: newMessage });
      } else {
        dispatch({
          type: CHAT_ACTIONS.ADD_NOTIFICATION,
          payload: { senderID: sender_id, message: decryptedText, timestamp }
        });

        if (Notification.permission === 'granted') {
          const senderChat = stateRef.current.chats.find(c => c.user_id === sender_id);
          new Notification('Tin nhắn mới', {
            body: `${senderChat?.username || 'Người dùng'}: ${decryptedText}`,
            icon: '/logo192.png'
          });
        }
      }
    } catch (error) {
      console.error('WS message error:', error);
    }
  // Only stable deps — state is read via stateRef, not from closure
  }, [privateKey, user?.id]);

  // Keep ref always pointing to latest handler so WS onmessage never goes stale
  useEffect(() => {
    handleWebSocketMessageRef.current = handleWebSocketMessage;
  }, [handleWebSocketMessage]);

  // Create WebSocket connection with auto-reconnect
  useEffect(() => {
    if (!user?.id || !privateKey) return;

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;
    const baseDelay = 1000;
    let reconnectTimeout;
    // Signals that the effect has been cleaned up — prevents reconnect loop
    let isCleanedUp = false;

    const connectWebSocket = () => {
      if (isCleanedUp) return;

      const apiBase = (process.env.REACT_APP_API_URL || 'http://192.168.2.10:8089').replace(/\/$/, '');
      const wsBase = apiBase.replace(/^http/, 'ws');
      const wsUrl = `${wsBase}/api/ws/${user.id}`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isCleanedUp) {
            ws.close();
            return;
          }
          reconnectAttempts = 0;
        };
        ws.onmessage = (event) => handleWebSocketMessageRef.current(event);
        ws.onerror = () => {};
        ws.onclose = () => {
          if (isCleanedUp) return;
          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = baseDelay * Math.pow(1.5, reconnectAttempts) + Math.random() * 1000;
            reconnectTimeout = setTimeout(() => {
              if (!isCleanedUp) {
                reconnectAttempts++;
                connectWebSocket();
              }
            }, delay);
          }
        };
      } catch (error) {
        if (!isCleanedUp && reconnectAttempts < maxReconnectAttempts) {
          const delay = baseDelay * Math.pow(1.5, reconnectAttempts) + Math.random() * 1000;
          reconnectTimeout = setTimeout(() => {
            if (!isCleanedUp) {
              reconnectAttempts++;
              connectWebSocket();
            }
          }, delay);
        }
      }
    };

    connectWebSocket();

    return () => {
      isCleanedUp = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        // Remove close handler first so it doesn't trigger a reconnect
        wsRef.current.onclose = null;
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
        timestamp,
        iv,
        created_at: new Date(timestamp * 1000).toISOString(),
        isDecrypted: true
      };

      dispatch({ type: CHAT_ACTIONS.ADD_MESSAGE, payload: newMessage });

      // UPDATE_CHAT_LAST_MESSAGE runs in reducer with fresh state — no stale closure
      dispatch({
        type: CHAT_ACTIONS.UPDATE_CHAT_LAST_MESSAGE,
        payload: { userID: receiverID, text: messageText, timestamp, iv }
      });

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }, [privateKey, user?.id]);

  const setCurrentChat = useCallback((chat) => {
    currentOpenChatUserIdRef.current = chat?.user_id ?? null;
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