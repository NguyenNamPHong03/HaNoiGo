import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    // Try to get token from either adminToken or regular token
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
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
      // Just log the error, don't redirect - admin should work without auth
      console.warn('API 401 error, but admin app continues to work');
    }
    return Promise.reject(error);
  }
);

// Auth API functions
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

// Places API functions - Complete admin version
export const placesAPI = {
  getAll: async (params?: {
    q?: string;
    district?: string;
    category?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    mood?: string;
    space?: string;
    suitability?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/admin/places?${queryParams.toString()}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/admin/places/${id}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    address: string;
    district: string;
    category: string;
    description: string;
    priceRange: { min: number; max: number };
    images?: string[];
    menu?: Array<{ name: string; price: number; description?: string; category: string }>;
    aiTags?: {
      space?: string[];
      mood?: string[];
      suitability?: string[];
      crowdLevel?: string[];
      music?: string[];
      parking?: string[];
      specialFeatures?: string[];
    };
    coordinates?: { latitude: number; longitude: number };
    operatingHours?: any;
    contact?: { phone?: string; website?: string };
    status?: string;
  }) => {
    const response = await api.post('/admin/places', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/admin/places/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/admin/places/${id}`);
    return response.data;
  },

  bulkUpdate: async (data: {
    placeIds: string[];
    operation: 'updateStatus' | 'delete' | 'toggleActive';
    updateData?: { status?: string };
  }) => {
    const response = await api.post('/admin/places/bulk', data);
    return response.data;
  },

  updateAiTags: async (id: string, aiTags: {
    space?: string[];
    mood?: string[];
    suitability?: string[];
    crowdLevel?: string[];
    music?: string[];
    parking?: string[];
    specialFeatures?: string[];
  }) => {
    const response = await api.patch(`/admin/places/${id}/ai-tags`, aiTags);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/admin/places/stats');
    return response.data;
  },

  getDistricts: async () => {
    const response = await api.get('/admin/districts');
    return response.data;
  },

  getAiTagsOptions: async () => {
    const response = await api.get('/admin/ai-tags-options');
    return response.data;
  },

  // 🤖 Auto-refresh AI tags from Google data
  refreshGoogleData: async (id: string) => {
    const response = await api.post(`/admin/places/${id}/refresh-google`);
    return response.data;
  }
};

// Users API functions
export const usersAPI = {
  getAll: async (params?: any) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  }
};

// Reviews API functions
export const reviewsAPI = {
  getAll: async (params?: any) => {
    const response = await api.get('/admin/reviews', { params });
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/admin/reviews/${id}`);
    return response.data;
  }
};

// User Management API functions
export const userAPI = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }
    const response = await api.get(`/admin/users?${queryParams.toString()}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  update: async (id: string, data: { role?: string; status?: string; isBanned?: boolean; isActive?: boolean }) => {
    const response = await api.patch(`/admin/users/${id}`, data);
    return response.data;
  },

  ban: async (id: string, banData: { reason?: string; expiresAt?: string }) => {
    const response = await api.post(`/admin/users/${id}/ban`, banData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/admin/users/stats');
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

// Upload API functions
export const uploadAPI = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/admin/upload/place-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/auth/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

export default api;