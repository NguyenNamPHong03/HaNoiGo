import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance for client
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('userToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('userToken');
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post('/auth/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Google OAuth
  getGoogleAuthUrl: async () => {
    const response = await api.get('/auth/google/url');
    return response.data;
  }
};

// Places API functions  
export const placesAPI = {
  getAll: async (params) => {
    const response = await api.get('/places', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/places/${id}`);
    return response.data;
  },
  
  search: async (query) => {
    const response = await api.get('/places/search', { params: { q: query } });
    return response.data;
  },

  getLatest: async (limit = 5) => {
    const response = await api.get('/places/latest', { params: { limit } });
    return response.data;
  }
};

// Reviews API functions
export const reviewsAPI = {
  create: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },
  
  getByPlace: async (placeId) => {
    const response = await api.get(`/reviews/place/${placeId}`);
    return response.data;
  }
};

// Chat API functions
export const chatAPI = {
  sendMessage: async (message) => {
    const response = await api.post('/chat/message', { message });
    return response.data;
  },
  
  getHistory: async () => {
    const response = await api.get('/chat/history');
    return response.data;
  },
  
  sendFeedback: async (sessionId, feedback) => {
    const response = await api.post('/chat/feedback', { sessionId, feedback });
    return response.data;
  }
};

export default api;