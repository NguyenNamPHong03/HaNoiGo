import { useQuery } from '@tanstack/react-query';
import { placesAPI } from '../services/api';

/**
 * Hook to fetch all places with filters
 * @param {object} filters - Filter parameters
 * @returns {object} React Query result
 */
export const usePlaces = (filters = {}) => {
  return useQuery({
    queryKey: ['places', 'list', filters],
    queryFn: () => placesAPI.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    select: (response) => {
      // Transform API response
      if (response?.success && response?.data) {
        return {
          places: response.data.places || [],
          pagination: response.data.pagination || {}
        };
      }
      return { places: [], pagination: {} };
    }
  });
};

/**
 * Hook to fetch latest places
 * @param {number} limit - Number of places to fetch
 * @returns {object} React Query result
 */
export const useLatestPlaces = (limit = 5) => {
  return useQuery({
    queryKey: ['places', 'latest', limit],
    queryFn: () => placesAPI.getLatest(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    select: (response) => {
      if (response?.success && response?.data) {
        return response.data;
      }
      return [];
    }
  });
};
