import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import reviewService from '../services/reviewService';

/**
 * Hook lấy reviews của địa điểm
 * @param {string} placeId - ID địa điểm
 * @param {object} params - Query params (page, limit, sort)
 */
export const usePlaceReviews = (placeId, params = {}) => {
  return useQuery({
    queryKey: ['reviews', 'place', placeId, params],
    queryFn: () => reviewService.getPlaceReviews(placeId, params),
    enabled: !!placeId, // Chỉ fetch khi có placeId
    staleTime: 2 * 60 * 1000, // 2 phút - reviews thay đổi thường xuyên
    gcTime: 5 * 60 * 1000, // 5 phút
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook lấy reviews của user
 * @param {string} userId - ID user
 */
export const useUserReviews = (userId) => {
  return useQuery({
    queryKey: ['reviews', 'user', userId],
    queryFn: () => reviewService.getUserReviews(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook submit review mới với Optimistic Updates
 * @param {string} placeId - ID địa điểm
 */
export const useSubmitReview = (placeId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewData) => reviewService.submitReview(placeId, reviewData),

    // OPTIMISTIC UPDATE - Update UI ngay trước khi API response
    onMutate: async (newReview) => {
      // 1. Cancel outgoing refetches (tránh race condition)
      await queryClient.cancelQueries(['reviews', 'place', placeId]);

      // 2. Snapshot current data (để rollback nếu fail)
      const previousReviews = queryClient.getQueryData(['reviews', 'place', placeId]);

      // 3. Optimistically update UI
      queryClient.setQueryData(['reviews', 'place', placeId], (old) => {
        if (!old) return old;
        
        const tempReview = {
          _id: 'temp-' + Date.now(),
          ...newReview,
          user: {
            _id: 'temp-user',
            displayName: 'Bạn',
            avatarUrl: localStorage.getItem('userAvatar') || null
          },
          createdAt: new Date().toISOString(),
          helpfulCount: 0,
          status: 'pending'
        };

        return {
          ...old,
          reviews: [tempReview, ...(old.reviews || [])]
        };
      });

      return { previousReviews };
    },

    onError: (err, newReview, context) => {
      // Rollback nếu API fail
      if (context?.previousReviews) {
        queryClient.setQueryData(
          ['reviews', 'place', placeId],
          context.previousReviews
        );
      }
      
      const message = err.response?.data?.message || 'Không thể gửi đánh giá';
      toast.error(message);
    },

    onSuccess: (data) => {
      toast.success('Đánh giá của bạn đã được gửi thành công! 🎉');
    },

    onSettled: () => {
      // Refetch để sync với server
      queryClient.invalidateQueries(['reviews', 'place', placeId]);
      queryClient.invalidateQueries(['places', 'detail', placeId]); // Update avg rating
    },
  });
};

/**
 * Hook update review
 * @param {string} placeId - ID địa điểm
 */
export const useUpdateReview = (placeId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, updateData }) => 
      reviewService.updateReview(reviewId, updateData),

    onMutate: async ({ reviewId, updateData }) => {
      await queryClient.cancelQueries(['reviews', 'place', placeId]);
      const previousReviews = queryClient.getQueryData(['reviews', 'place', placeId]);

      // Optimistic update
      queryClient.setQueryData(['reviews', 'place', placeId], (old) => {
        if (!old) return old;
        
        return {
          ...old,
          reviews: old.reviews.map(review => 
            review._id === reviewId 
              ? { ...review, ...updateData, updatedAt: new Date().toISOString() }
              : review
          )
        };
      });

      return { previousReviews };
    },

    onError: (err, variables, context) => {
      if (context?.previousReviews) {
        queryClient.setQueryData(
          ['reviews', 'place', placeId],
          context.previousReviews
        );
      }
      toast.error('Không thể cập nhật đánh giá');
    },

    onSuccess: () => {
      toast.success('Đã cập nhật đánh giá');
    },

    onSettled: () => {
      queryClient.invalidateQueries(['reviews', 'place', placeId]);
      queryClient.invalidateQueries(['places', 'detail', placeId]);
    },
  });
};

/**
 * Hook xóa review
 * @param {string} placeId - ID địa điểm
 */
export const useDeleteReview = (placeId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId) => reviewService.deleteReview(reviewId),

    onMutate: async (reviewId) => {
      await queryClient.cancelQueries(['reviews', 'place', placeId]);
      const previousReviews = queryClient.getQueryData(['reviews', 'place', placeId]);

      // Optimistic delete
      queryClient.setQueryData(['reviews', 'place', placeId], (old) => {
        if (!old) return old;
        
        return {
          ...old,
          reviews: old.reviews.filter(review => review._id !== reviewId),
          total: old.total - 1
        };
      });

      return { previousReviews };
    },

    onError: (err, reviewId, context) => {
      if (context?.previousReviews) {
        queryClient.setQueryData(
          ['reviews', 'place', placeId],
          context.previousReviews
        );
      }
      toast.error('Không thể xóa đánh giá');
    },

    onSuccess: () => {
      toast.success('Đã xóa đánh giá');
    },

    onSettled: () => {
      queryClient.invalidateQueries(['reviews', 'place', placeId]);
      queryClient.invalidateQueries(['places', 'detail', placeId]);
    },
  });
};

/**
 * Hook đánh dấu review hữu ích
 * @param {string} placeId - ID địa điểm
 */
export const useMarkReviewHelpful = (placeId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId) => reviewService.markReviewHelpful(reviewId),

    onMutate: async (reviewId) => {
      await queryClient.cancelQueries(['reviews', 'place', placeId]);
      const previousReviews = queryClient.getQueryData(['reviews', 'place', placeId]);

      // Optimistic update
      queryClient.setQueryData(['reviews', 'place', placeId], (old) => {
        if (!old) return old;
        
        return {
          ...old,
          reviews: old.reviews.map(review => 
            review._id === reviewId 
              ? { ...review, helpfulCount: review.helpfulCount + 1 }
              : review
          )
        };
      });

      return { previousReviews };
    },

    onError: (err, reviewId, context) => {
      if (context?.previousReviews) {
        queryClient.setQueryData(
          ['reviews', 'place', placeId],
          context.previousReviews
        );
      }
      toast.error('Không thể đánh dấu hữu ích');
    },

    onSettled: () => {
      queryClient.invalidateQueries(['reviews', 'place', placeId]);
    },
  });
};
