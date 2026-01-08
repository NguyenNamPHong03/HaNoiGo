import Place from '../models/Place.js';
import Review from '../models/Review.js';

/**
 * Get reviews for a specific place (kết hợp Google reviews + user reviews)
 */
export const getReviewsByPlace = async (placeId, options = {}) => {
  const { limit = 20, skip = 0, sort = '-createdAt' } = options;

  // 1. Get user reviews from database
  const userReviews = await Review.find({ 
    place: placeId, 
    status: 'published' 
  })
    .populate('user', 'username displayName avatar')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  // 2. Get Google reviews (if available) - only first 5
  const place = await Place.findById(placeId).lean();
  let googleReviews = [];
  
  // Try multiple possible field structures from Google Places data
  const reviewsArray = place?.googleData?.reviews || 
                       place?.googleData?.reviewsList || 
                       place?.additionalInfo?.reviews ||
                       [];
  
  if (Array.isArray(reviewsArray) && reviewsArray.length > 0) {
    console.log(`Found ${reviewsArray.length} Google reviews for place ${placeId}`);
    
    googleReviews = reviewsArray.slice(0, 5).map((review, index) => ({
      _id: `google-${review.reviewId || review.id || index}`,
      source: 'google',
      rating: review.rating || review.stars || 5,
      comment: review.snippet || review.text || review.review || review.comment || 'No comment',
      user: {
        username: review.reviewAuthor || review.author || review.userName || 'Google User',
        displayName: review.reviewAuthor || review.author || review.userName || 'Google User',
        avatar: review.reviewAuthorImage || review.authorImage || review.profilePhoto || null
      },
      createdAt: review.publishedAtDate || review.reviewDate || review.date || review.createdAt || new Date(),
      helpfulCount: review.likesCount || review.likes || 0,
      images: review.reviewImageUrls || review.images || []
    }));
  } else {
    console.log(`No Google reviews found for place ${placeId}. googleData:`, !!place?.googleData);
  }

  // 3. Combine: Google reviews first, then user reviews
  const allReviews = [...googleReviews, ...userReviews];

  return {
    reviews: allReviews,
    total: allReviews.length,
    userReviewsCount: userReviews.length,
    googleReviewsCount: googleReviews.length
  };
};

/**
 * Create a new review
 */
export const createReview = async (userId, reviewData) => {
  const { placeId, rating, comment, images } = reviewData;

  // Check if place exists
  const place = await Place.findById(placeId);
  if (!place) {
    throw new Error('Place not found');
  }

  // Check if user already reviewed this place
  const existingReview = await Review.findOne({ user: userId, place: placeId });
  if (existingReview) {
    throw new Error('You have already reviewed this place');
  }

  // Create review
  const review = await Review.create({
    user: userId,
    place: placeId,
    rating,
    comment,
    images: images || [],
    status: 'published'
  });

  // Populate user info
  await review.populate('user', 'username displayName avatar');

  return review;
};

/**
 * Update a review (only by owner)
 */
export const updateReview = async (reviewId, userId, updateData) => {
  const review = await Review.findById(reviewId);

  if (!review) {
    throw new Error('Review not found');
  }

  // Check ownership
  if (review.user.toString() !== userId.toString()) {
    throw new Error('You can only update your own reviews');
  }

  // Update allowed fields
  const { rating, comment, images } = updateData;
  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;
  if (images !== undefined) review.images = images;

  await review.save();
  await review.populate('user', 'username displayName avatar');

  return review;
};

/**
 * Delete a review (only by owner or admin)
 */
export const deleteReview = async (reviewId, userId, isAdmin = false) => {
  const review = await Review.findById(reviewId);

  if (!review) {
    throw new Error('Review not found');
  }

  // Check ownership (unless admin)
  if (!isAdmin && review.user.toString() !== userId.toString()) {
    throw new Error('You can only delete your own reviews');
  }

  await review.remove();

  return { message: 'Review deleted successfully' };
};

/**
 * Get reviews by user
 */
export const getReviewsByUser = async (userId, options = {}) => {
  const { limit = 20, skip = 0 } = options;

  const reviews = await Review.find({ user: userId })
    .populate('place', 'name address images category district')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Review.countDocuments({ user: userId });

  return { reviews, total };
};

/**
 * Mark review as helpful
 */
export const markReviewHelpful = async (reviewId, userId) => {
  const review = await Review.findById(reviewId);

  if (!review) {
    throw new Error('Review not found');
  }

  // Check if already marked helpful
  const alreadyMarked = review.helpfulBy.some(
    id => id.toString() === userId.toString()
  );

  if (alreadyMarked) {
    // Remove helpful mark
    review.helpfulBy = review.helpfulBy.filter(
      id => id.toString() !== userId.toString()
    );
    review.helpfulCount = Math.max(0, review.helpfulCount - 1);
  } else {
    // Add helpful mark
    review.helpfulBy.push(userId);
    review.helpfulCount += 1;
  }

  await review.save();

  return review;
};
