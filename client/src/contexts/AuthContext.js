import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [defaultChat, setDefaultChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    // Check if user is logged in by token in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Handle axios response interceptors for global error handling
  useEffect(() => {
    // Add a response interceptor to handle common error cases
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        // Handle session expiration
        if (error.response?.status === 401 && 
            error.response?.data?.error?.includes('Session expired')) {
          handleSessionExpiration();
        }
        
        // Handle rate limiting
        if (error.response?.status === 429) {
          console.error('Rate limit exceeded:', error.response?.data?.error);
          error.response.data.error = 'Too many attempts. Please wait a moment and try again.';
        }
        
        return Promise.reject(error);
      }
    );
    
    // Clean up the interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const handleSessionExpiration = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setDefaultChat(null);
    setSessionExpired(true);
    setError('Your session has expired. Please log in again.');
    
    // Reset the session expired flag after notification is shown
    setTimeout(() => {
      setSessionExpired(false);
      setError('');
    }, 5000);
  };

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get('/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCurrentUser(response.data.user);
      setDefaultChat(response.data.defaultChat);
      setSessionExpired(false);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      // If token is invalid or expired, clear it
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError('');
      const response = await axios.post('/auth/login', { email, password });
      const { token, user, defaultChat } = response.data;
      localStorage.setItem('token', token);
      setCurrentUser(user);
      setDefaultChat(defaultChat);
      setSessionExpired(false);
      return { user, defaultChat };
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle different error types with more specific messages
      if (err.response?.status === 429) {
        setError('Too many attempts. Please wait a moment and try again.');
      } else if (err.response?.status === 401) {
        setError('Invalid credentials. Please check your email and password.');
      } else {
        setError(err.response?.data?.error || 'Failed to log in. Please try again.');
      }
      
      throw err;
    }
  };

  const register = async (email, password, name) => {
    try {
      setError('');
      const response = await axios.post('/auth/register', { email, password, name });
      const { token, user, defaultChat } = response.data;
      localStorage.setItem('token', token);
      setCurrentUser(user);
      setDefaultChat(defaultChat);
      return { user, defaultChat };
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle different error types with more specific messages
      if (err.response?.status === 429) {
        setError('Too many registration attempts. Please wait a moment and try again.');
      } else {
        setError(err.response?.data?.error || 'Registration failed. Please try again later.');
      }
      
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setDefaultChat(null);
    setSessionExpired(false);
  };

  const value = {
    currentUser,
    defaultChat,
    login,
    register,
    logout,
    loading,
    error,
    sessionExpired,
    clearError: () => setError('')
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 