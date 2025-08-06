import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import { hashPassword, decryptPrivateKey } from '../utils/crypto';
import forge from 'node-forge';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  privateKey: null,
  userSalt: null,
  userIV: null
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  SET_PRIVATE_KEY: 'SET_PRIVATE_KEY'
};

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true
      };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        userSalt: action.payload.salt,
        userIV: action.payload.iv
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        privateKey: null,
        userSalt: null,
        userIV: null
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        privateKey: null,
        userSalt: null,
        userIV: null
      };
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    case AUTH_ACTIONS.SET_PRIVATE_KEY:
      return {
        ...state,
        privateKey: action.payload
      };
    default:
      return state;
  }
}

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [salt, setSalt] = useState(null);
  const [iv, setIv] = useState(null);

  useEffect(() => {
   // const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { 
            user,
            salt: user.salt,
            iv: user.iv
          }
        });
      } catch (error) {
        localStorage.removeItem('user');
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    } else {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  // Login function
  const login = async (username, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const hashedPassword = hashPassword(password, username); // Using username as salt for demo
      
      const response = await authAPI.login(username, hashedPassword);

      const { user_id, username: returnedUsername, privateEncryptedKey, iv, salt } = response.data.data;
      console.log("Login response data:", response.data.data);
      
      const user = {
        id: user_id,
        username: returnedUsername || username,
        salt: salt,
        iv: iv,
        privateEncryptedKey: privateEncryptedKey
      };
      

      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { 
          user: user,
          salt: salt,
          iv: iv,
          privateEncryptedKey: privateEncryptedKey
        }
      });

      // Decrypt private key
      if (privateEncryptedKey) {
        try {
          // Convert hex salt and IV to binary format for decryption
          const binarySalt = forge.util.hexToBytes(salt);
          const binaryIV = forge.util.hexToBytes(iv);
          
          console.log('🔓 Decrypting private key with:');
          console.log('salt (hex):', salt, '-> binary length:', binarySalt.length);
          console.log('iv (hex):', iv, '-> binary length:', binaryIV.length);
          
          const decryptedPrivateKey = decryptPrivateKey(
            privateEncryptedKey,
            password,
            binarySalt,
            binaryIV
          );
          dispatch({
            type: AUTH_ACTIONS.SET_PRIVATE_KEY,
            payload: decryptedPrivateKey
          });
        } catch (error) {
          console.error('Failed to decrypt private key:', error);
        }
      }
      
      return { success: true };
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE });
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const response = await authAPI.register(userData);
      return { success: true, data: response.data };
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE });
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const checkUsername = async (username) => {
    try {
      const response = await authAPI.checkRegister(username);
      return { success: true, available: response.data.data.available };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Check failed' 
      };
    }
  };

  const value = {
    ...state,
    login,
    logout,
    register,
    checkUsername
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 