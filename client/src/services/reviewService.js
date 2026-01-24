import api from './api';

/**
 * Review Service - API calls cho review operations
 * Tuân thủ naming convention: camelCase + Service
 */

/**
 * Lấy tất cả reviews của 1 địa điểm (Google + User reviews)
 * @param {string} placeId - ID của địa điểm
 * @param {object} params - Query params (page, limit, sort)
 * @returns {Promise<{reviews: Array, total: number, userReviewsCount: number, googleReviewsCount: number}>}
 */
export const getPlaceReviews = async (placeId, params = {}) => {
  const { data } = await api.get(`/reviews/place/${placeId}`, { params });

  // Backend trả về { success: true, data: { reviews, total, ... } }
  return data.data || data;
};

/**
 * Lấy reviews của 1 user
 * @param {string} userId - ID của user
 * @returns {Promise<Array>}
 */
export const getUserReviews = async (userId) => {
  const { data } = await api.get(`/reviews/user/${userId}`);
  return data;
};

/**
 * Submit review mới
 * @param {string} placeId - ID của địa điểm
 * @param {object} reviewData - { rating, comment, images }
 * @returns {Promise<object>}
 */
export const submitReview = async (placeId, reviewData) => {
  const { data } = await api.post('/reviews', {
    placeId,
    ...reviewData
  });
  return data;
};

/**
 * Cập nhật review
 * @param {string} reviewId - ID của review
 * @param {object} updateData - { rating, comment, images }
 * @returns {Promise<object>}
 */
export const updateReview = async (reviewId, updateData) => {
  const { data } = await api.put(`/reviews/${reviewId}`, updateData);
  return data;
};

/**
 * Xóa review
 * @param {string} reviewId - ID của review
 * @returns {Promise<void>}
 */
export const deleteReview = async (reviewId) => {
  const { data } = await api.delete(`/reviews/${reviewId}`);
  return data;
};

/**
 * Đánh dấu review hữu ích
 * @param {string} reviewId - ID của review
 * @returns {Promise<object>}
 */
export const markReviewHelpful = async (reviewId) => {
  const { data } = await api.post(`/reviews/${reviewId}/helpful`);
  return data;
};

/**
 * Report review
 * @param {string} reviewId - ID của review
 * @param {string} reason - Lý do report
 * @returns {Promise<object>}
 */
export const reportReview = async (reviewId, reason) => {
  const { data } = await api.post(`/reviews/${reviewId}/report`, { reason });
  return data;
};

export default {
  getPlaceReviews,
  getUserReviews,
  submitReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  reportReview
};
