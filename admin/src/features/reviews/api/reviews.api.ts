// Reviews API - Wrapper around reviewsAPI from services/api.ts
import { reviewsAPI } from '../../../services/api';

export const reviewsApi = {
  // Get all reviews
  getAll: (params?: any) => {
    return reviewsAPI.getAll(params);
  },

  // Delete review (admin only)
  delete: (id: string) => {
    return reviewsAPI.delete(id);
  }
};
