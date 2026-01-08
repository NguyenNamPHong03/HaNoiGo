// Places API - Wrapper around existing placesAPI from services/api.ts
import { placesAPI } from '../../../services/api';
import type { PlaceFormData } from '../types/place.types';

// Re-export với typing rõ ràng hơn
export const placesApi = {
  // List with filters
  getAll: (filters?: any) => {
    return placesAPI.getAll(filters);
  },

  // Get single place
  getById: (id: string) => {
    return placesAPI.getById(id);
  },

  // Create new place
  create: (data: PlaceFormData) => {
    return placesAPI.create(data);
  },

  // Update existing place
  update: (id: string, data: Partial<PlaceFormData>) => {
    return placesAPI.update(id, data);
  },

  // Delete place
  delete: (id: string) => {
    return placesAPI.delete(id);
  },

  // Bulk operations
  bulkUpdate: (data: {
    placeIds: string[];
    operation: 'updateStatus' | 'delete' | 'toggleActive';
    updateData?: { status?: string };
  }) => {
    return placesAPI.bulkUpdate(data);
  },

  // Update AI tags only
  updateAiTags: (id: string, aiTags: any) => {
    return placesAPI.updateAiTags(id, aiTags);
  },

  // Get stats
  getStats: () => {
    return placesAPI.getStats();
  },

  // Get options for filters
  getDistricts: () => {
    return placesAPI.getDistricts();
  },

  getAiTagsOptions: () => {
    return placesAPI.getAiTagsOptions();
  },

  // 🤖 Refresh AI tags from Google data
  refreshGoogleData: (id: string) => {
    return placesAPI.refreshGoogleData(id);
  },

  // 🔄 Bulk refresh Google data
  bulkRefreshGoogleData: (placeIds: string[]) => {
    return placesAPI.bulkRefreshGoogleData(placeIds);
  }
};
