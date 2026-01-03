// User Types - Centralized type definitions for Users feature

export interface User {
  _id: string;
  email: string;
  displayName: string;
  role: "user" | "admin";
  status: "active" | "banned" | "deleted";
  isActive: boolean;
  isBanned: boolean;
  banReason?: string;
  deletedAt?: string;
  createdAt: string;
  lastLoginAt?: string;
  avatarUrl?: string;
}

export interface UserFilters {
  page: number;
  limit: number;
  search?: string;
  role?: "all" | User["role"];
  status?: "all" | User["status"];
}

export interface UsersResponse {
  data: User[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface BanUserData {
  reason?: string;
  expiresAt?: string;
}
