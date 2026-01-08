import api from '../../../services/api';

export const reviewsApi = {
  /**
   * Get all reviews for a place (Google + User reviews)
   */
  getByPlace: async (placeId: string) => {
    return api.get(`/reviews/place/${placeId}`);
  },

  /**
   * Create a new review (requires authentication)
   */
  create: async (reviewData: {
    placeId: string;
    rating: number;
    comment: string;
    images?: string[];
  }) => {
    return api.post('/reviews', reviewData);
  },

  /**
   * Update a review (owner only)
   */
  update: async (reviewId: string, updateData: {
    rating?: number;
    comment?: string;
    images?: string[];
  }) => {
    return api.put(`/reviews/${reviewId}`, updateData);
  },

  /**
   * Delete a review (owner or admin)
   */
  delete: async (reviewId: string) => {
    return api.delete(`/reviews/${reviewId}`);
  },

  /**
   * Get all reviews by a user
   */
  getByUser: async (userId: string) => {
    return api.get(`/reviews/user/${userId}`);
  },

  /**
   * Mark/unmark review as helpful
   */
  markHelpful: async (reviewId: string) => {
    return api.post(`/reviews/${reviewId}/helpful`);
  }
};
