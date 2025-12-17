// Admin Authentication Types
export interface AdminUser {
  _id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'super_admin';
  permissions: string[];
  lastLogin: Date;
}

// Place Related Types
export interface Place {
  _id: string;
  name: string;
  address: string;
  category: 'food' | 'entertainment';
  description: string;
  priceRange: {
    min: number;
    max: number;
  };
  images: string[];
  menu?: MenuItem[];
  aiTags: {
    space: string[];
    suitability: string[];
    mood: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  name: string;
  price: number;
  description?: string;
  category: string;
}

// User Related Types
export interface User {
  _id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: Date;
  isBanned: boolean;
  preferences: {
    favoriteFoods: string[];
    styles: string[];
    dietary: string[];
  };
}

// Review Types
export interface Review {
  _id: string;
  userId: string;
  placeId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  user?: User;
  place?: Place;
}

// AI Configuration Types
export interface AIConfig {
  _id: string;
  model: string;
  systemInstruction: string;
  isActive: boolean;
  createdAt: Date;
}

export interface AITrainingExample {
  _id: string;
  inputQuery: string;
  outputResponse: string;
  category: string;
  createdAt: Date;
}

// Chat Session Types
export interface ChatSession {
  _id: string;
  userId: string;
  messages: ChatMessage[];
  feedback?: 'like' | 'dislike';
  feedbackReason?: string;
  createdAt: Date;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}