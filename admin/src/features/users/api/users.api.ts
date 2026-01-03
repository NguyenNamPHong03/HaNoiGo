// Users API - Wrapper around userAPI from services/api.ts
import { userAPI } from '../../../services/api';
import type { BanUserData, User } from '../types/user.types';

export const usersApi = {
  // List with filters
  getAll: (params?: any) => {
    return userAPI.getAll(params);
  },

  // Get single user
  getById: (id: string) => {
    return userAPI.getById(id);
  },

  // Update user
  update: (id: string, data: Partial<User>) => {
    return userAPI.update(id, data);
  },

  // Ban user
  ban: (id: string, banData: BanUserData) => {
    return userAPI.ban(id, banData);
  },

  // Delete user
  delete: (id: string) => {
    return userAPI.delete(id);
  },

  // Get stats
  getStats: () => {
    return userAPI.getStats();
  }
};
