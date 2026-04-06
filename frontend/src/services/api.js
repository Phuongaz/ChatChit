import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://192.168.2.10:8089',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

export const authAPI = {
  /**
   * Check if user already exists
   * @param {string} username 
   * @returns {Promise}
   */
  checkRegister: (username) => {
    return api.post('/api/auth/check-register', { username });
  },

  register: (userData) => {
    return api.post('/api/auth/register', userData);
  },

  preLogin: (username) => {
    return api.post('/api/auth/pre-login', { username });
  },

  login: (username, hashedPassword) => {
    return api.post('/api/auth/login', { username, hashed_password: hashedPassword });
  },

  logout: () => {
    return api.post('/api/auth/logout');
  }
};

export const userAPI = {

  getPublicKey: (userID) => {
    return api.get(`/api/user/public-key/${userID}`);
  },

  /**
   * Get user profile
   * @returns {Promise}
   */
  getProfile: () => {
    return api.get('/api/user/profile');
  },

  /**
   * Get user by ID
   * @param {string} userID
   * @returns {Promise}
   */
  getUserById: (userID) => {
    return api.get(`/api/user/${userID}`);
  },

  /**
   * Search users
   * @param {string} query 
   * @returns {Promise}
   */
  searchUser: (query) => {
    return api.get(`/api/user/search?q=${encodeURIComponent(query)}`);
  }
};

// Chat API endpoints
export const chatAPI = {
  /**
   * Send encrypted message
   * @param {Object} messageData - Message data with encryption
   * @returns {Promise}
   */
  sendMessage: (messageData) => {
    return api.post('/api/chat/send-message', messageData);
  },

  getMessages: (conversationID, page = 1, limit = 50) => {
    return api.get(`/api/chat/messages/${conversationID}?page=${page}&limit=${limit}`);
  },

  getMessagesByUser: (userID, page = 1, limit = 50) => {
    return api.get(`/api/chat/history/${userID}`);
  },

  /**
   * Get chat list
   * @returns {Promise}
   */
  getChatList: () => {
    return api.get('/api/chat/history');
  },

  /**
   * Delete a single message
   * @param {string} messageID 
   * @returns {Promise}
   */
  deleteMessage: (messageID) => {
    return api.delete(`/api/chat/message/${messageID}`);
  },

  deleteConversation: (conversationID) => {
    return api.delete(`/api/chat/conversation/${conversationID}`);
  }
};

export default api; 