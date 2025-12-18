import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
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
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API functions - Admin no longer needs authentication
export const authAPI = {
  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('adminToken');
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  }
};

// Places API functions  
export const placesAPI = {
  getAll: async (params?: any) => {
    const response = await api.get('/places', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/places/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/places', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/places/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/places/${id}`);
    return response.data;
  }
};

// Users API functions
export const usersAPI = {
  getAll: async (params?: any) => {
    const response = await api.get('/users', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};

// Reviews API functions
export const reviewsAPI = {
  getAll: async (params?: any) => {
    const response = await api.get('/reviews', { params });
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  }
};

// AI Config API functions
export const aiAPI = {
  getConfig: async () => {
    const response = await api.get('/ai/config');
    return response.data;
  },
  
  updateConfig: async (data: any) => {
    const response = await api.put('/ai/config', data);
    return response.data;
  },
  
  getTrainingExamples: async () => {
    const response = await api.get('/ai/training-examples');
    return response.data;
  },
  
  addTrainingExample: async (data: any) => {
    const response = await api.post('/ai/training-examples', data);
    return response.data;
  }
};

export default api;