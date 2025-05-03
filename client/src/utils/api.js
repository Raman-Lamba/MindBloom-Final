import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add an interceptor to add the token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add an interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear it and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Function to handle API error responses in a consistent way
const handleApiError = (error, customMessage = null) => {
  console.error('API Error:', error);
  
  // Check if it's a network error
  if (error.message === 'Network Error') {
    throw new Error('Unable to connect to the server. Please check your internet connection.');
  }
  
  // Check if it's a response error with status code
  if (error.response) {
    // Authentication errors
    if (error.response.status === 401) {
      throw new Error('Session expired. Please log in again.');
    }
    
    // Rate limiting
    if (error.response.status === 429) {
      throw new Error('Too many requests. Please try again later.');
    }
    
    // Server error
    if (error.response.status >= 500) {
      throw new Error('Server error occurred. Our team has been notified.');
    }
    
    // Use error message from the response if available
    if (error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
  }
  
  // Use custom message or default to generic error
  throw new Error(customMessage || 'Something went wrong. Please try again.');
};

export const fetchChats = async () => {
  try {
    const response = await api.get('/api/chats');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to fetch your chats');
  }
};

export const createChat = async () => {
  try {
    const response = await api.post('/api/chats');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to create a new chat');
  }
};

export const getChat = async (chatId) => {
  try {
    const response = await api.get(`/api/chats/${chatId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to load this chat');
  }
};

export const addMessage = async (chatId, message) => {
  try {
    const response = await api.post(`/api/chats/${chatId}/messages`, {
      role: 'user',
      content: message
    });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to send your message');
  }
};

export const sendQuery = async (query, chatId) => {
  try {
    // Remove the client-side message creation that's causing duplication
    // Let the server create the message as part of the query processing
    
    // Send the query to get AI response
    const response = await api.post('/api/query', {
      chatId,
      query
    });
    
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to get a response from AI');
  }
};

export default api; 