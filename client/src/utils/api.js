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

export const fetchChats = async () => {
  try {
    const response = await api.get('/api/chats');
    return response.data;
  } catch (error) {
    console.error('Error fetching chats:', error);
    throw error;
  }
};

export const createChat = async () => {
  try {
    const response = await api.post('/api/chats');
    return response.data;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

export const getChat = async (chatId) => {
  try {
    const response = await api.get(`/api/chats/${chatId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching chat:', error);
    throw error;
  }
};

export const addMessage = async (chatId, content) => {
  try {
    const response = await api.post(`/api/chats/${chatId}/messages`, {
      content,
      role: 'user'
    });
    return response.data;
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
};

export const sendQuery = async (query, chatId = null) => {
  try {
    const response = await api.post('/api/query', { query, chatId });
    return response.data;
  } catch (error) {
    console.error('Error sending query:', error);
    throw error;
  }
};

export default api; 