import express from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/reviews/place/:placeId
 * @desc    Get all reviews for a place (Google + User reviews combined)
 * @access  Public
 */
router.get('/place/:placeId', reviewController.getPlaceReviews);

/**
 * @route   GET /api/reviews/user/:userId
 * @desc    Get all reviews by a user
 * @access  Public
 */
router.get('/user/:userId', reviewController.getUserReviews);

/**
 * @route   POST /api/reviews
 * @desc    Create a new review
 * @access  Private (requires authentication)
 */
router.post('/', authenticateToken, reviewController.createReview);

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update a review (owner only)
 * @access  Private
 */
router.put('/:id', authenticateToken, reviewController.updateReview);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete a review (owner or admin)
 * @access  Private
 */
router.delete('/:id', authenticateToken, reviewController.deleteReview);

/**
 * @route   POST /api/reviews/:id/helpful
 * @desc    Mark/unmark review as helpful
 * @access  Private
 */
router.post('/:id/helpful', authenticateToken, reviewController.markHelpful);

export default router;