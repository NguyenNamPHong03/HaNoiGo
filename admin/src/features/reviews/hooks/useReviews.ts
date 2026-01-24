import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '../api/reviews.api';
import type { ReviewsListParams } from '../types/review.types';

// Query key factory
export const reviewKeys = {
  all: ['reviews'] as const,
  lists: () => [...reviewKeys.all, 'list'] as const,
  list: (params?: ReviewsListParams) => [...reviewKeys.lists(), params] as const,
};

// Hook: Get all reviews
export const useReviews = (params?: ReviewsListParams) => {
  return useQuery({
    queryKey: reviewKeys.list(params),
    queryFn: () => reviewsApi.getAll(params),
  });
};

// Hook: Delete review
export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reviewsApi.delete(id),
    onSuccess: () => {
      // Invalidate all review queries
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
};
