// Place Types - Centralized type definitions for Places feature

export interface Place {
  _id: string;
  name: string;
  address: string;
  district: string;
  category: string;
  description: string;
  priceRange: { min: number; max: number };
  status: 'Published' | 'Draft' | 'Archived';
  isActive: boolean;
  averageRating: number;
  totalReviews: number;
  viewCount: number;
  images: string[];
  menu: MenuItem[];
  aiTags: AiTags;
  coordinates?: { latitude: number; longitude: number };
  contact: { phone: string; website: string };
  operatingHours?: OperatingHours;
  createdAt: string;
  updatedAt: string;
  createdBy?: { displayName: string; username: string };
  updatedBy?: { displayName: string; username: string };
}

export interface MenuItem {
  name: string;
  price: number;
  description: string;
  category: string;
}

export interface DayHours {
  open: string;
  close: string;
}

export interface OperatingHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface AiTags {
  space: string[];
  mood: string[];
  suitability: string[];
  crowdLevel: string[];
  music: string[];
  parking: string[];
  specialFeatures: string[];
}

export interface PlaceFormData {
  name: string;
  address: string;
  district: string;
  category: string;
  description: string;
  priceRange: { min: number; max: number };
  images: string[];
  menu: MenuItem[];
  aiTags: AiTags;
  coordinates?: { latitude: number; longitude: number };
  contact: { phone: string; website: string };
  operatingHours?: OperatingHours;
  status: string;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PlaceFilters {
  q: string;
  district: string;
  category: string;
  status: string;
  minPrice: string | number; // Accept both for flexibility
  maxPrice: string | number;
  mood: string;
  space: string;
  suitability: string;
  sortBy: string;
  sortOrder: string;
  page: number;
  limit: number;
}

export interface Review {
  _id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: { displayName: string; avatarUrl?: string };
}
