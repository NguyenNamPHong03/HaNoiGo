import * as reviewService from '../services/reviewService.js';

/**
 * @route   GET /api/admin/reviews
 * @desc    Get all reviews (Admin only)
 * @access  Private (Admin)
 */
export const getAllReviews = async (req, res) => {
  try {
    const { limit, skip, sort } = req.query;

    const result = await reviewService.getAllReviews({
      limit: parseInt(limit) || 100,
      skip: parseInt(skip) || 0,
      sort: sort || '-createdAt'
    });

    res.json({
      success: true,
      data: result.reviews,
      pagination: {
        total: result.total,
        page: result.page,
        pages: result.pages
      }
    });
  } catch (error) {
    console.error('Error getting all reviews:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get reviews'
    });
  }
};

/**
 * @route   GET /api/reviews/place/:placeId
 * @desc    Get all reviews for a place (Google + User reviews)
 * @access  Public
 */
export const getPlaceReviews = async (req, res) => {
  try {
    const { placeId } = req.params;
    const { limit, skip, sort } = req.query;

    const result = await reviewService.getReviewsByPlace(placeId, {
      limit: parseInt(limit) || 20,
      skip: parseInt(skip) || 0,
      sort: sort || '-createdAt'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting place reviews:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get reviews'
    });
  }
};

/**
 * @route   POST /api/reviews
 * @desc    Create a new review
 * @access  Private (requires authentication)
 */
export const createReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { placeId, rating, comment, images } = req.body;

    // Validation
    if (!placeId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Place ID, rating, and comment are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const review = await reviewService.createReview(userId, {
      placeId,
      rating,
      comment,
      images
    });

    res.status(201).json({
      success: true,
      data: review,
      message: 'Review created successfully'
    });
  } catch (error) {
    console.error('Error creating review:', error);
    
    if (error.message === 'You have already reviewed this place') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create review'
    });
  }
};

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update a review
 * @access  Private (owner only)
 */
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { rating, comment, images } = req.body;

    const review = await reviewService.updateReview(id, userId, {
      rating,
      comment,
      images
    });

    res.json({
      success: true,
      data: review,
      message: 'Review updated successfully'
    });
  } catch (error) {
    console.error('Error updating review:', error);
    
    if (error.message === 'You can only update your own reviews') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update review'
    });
  }
};

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete a review
 * @access  Private (owner or admin)
 */
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    await reviewService.deleteReview(id, userId, isAdmin);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    
    if (error.message === 'You can only delete your own reviews') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete review'
    });
  }
};

/**
 * @route   GET /api/reviews/user/:userId
 * @desc    Get all reviews by a user
 * @access  Public
 */
export const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit, skip } = req.query;

    const result = await reviewService.getReviewsByUser(userId, {
      limit: parseInt(limit) || 20,
      skip: parseInt(skip) || 0
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting user reviews:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user reviews'
    });
  }
};

/**
 * @route   POST /api/reviews/:id/helpful
 * @desc    Mark/unmark review as helpful
 * @access  Private
 */
export const markHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const review = await reviewService.markReviewHelpful(id, userId);

    res.json({
      success: true,
      data: {
        helpfulCount: review.helpfulCount,
        isHelpful: review.helpfulBy.some(uid => uid.toString() === userId.toString())
      },
      message: 'Review helpful status updated'
    });
  } catch (error) {
    console.error('Error marking review helpful:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update helpful status'
    });
  }
};
