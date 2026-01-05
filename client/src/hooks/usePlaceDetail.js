import { useQuery } from '@tanstack/react-query';
import { placesAPI } from '../services/api';

/**
 * Custom hook để fetch chi tiết địa điểm
 * @param {string} placeId - ID của địa điểm
 * @param {object} options - React Query options
 * @returns {object} { data, isLoading, error, refetch }
 */
export const usePlaceDetail = (placeId, options = {}) => {
  return useQuery({
    queryKey: ['places', 'detail', placeId],
    queryFn: async () => {
      const response = await placesAPI.getById(placeId);
      return response.data;
    },
    enabled: !!placeId, // Chỉ fetch khi có placeId
    staleTime: 5 * 60 * 1000, // 5 phút
    gcTime: 10 * 60 * 1000, // 10 phút (renamed từ cacheTime)
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });
};

export default usePlaceDetail;
