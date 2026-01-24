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
    .populate('user', 'displayName avatarUrl')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  // 2. Get Google reviews (if available)
  const place = await Place.findById(placeId).lean();
  let googleReviews = [];

  // ✅ Google reviews được lưu trong additionalInfo.reviews
  const reviewsArray = place?.additionalInfo?.reviews || [];

  if (Array.isArray(reviewsArray) && reviewsArray.length > 0) {
    console.log(`✅ Found ${reviewsArray.length} Google reviews for place: ${place?.name}`);

    googleReviews = reviewsArray.slice(0, 5).map((review, index) => ({
      _id: `google-${review.reviewId || review.id || Date.now() + index}`,
      source: 'google',
      rating: review.rating || review.stars || 5,
      comment: review.text || review.snippet || review.review || review.textTranslated || 'Không có nội dung',
      user: {
        displayName: review.name || review.reviewAuthor || review.author || review.userName || 'Người dùng Google',
        avatarUrl: review.reviewerPhotoUrl || review.reviewAuthorImage || review.authorImage || review.profilePhoto || null
      },
      createdAt: review.publishedAtDate || review.reviewDate || review.date || review.createdAt || new Date(),
      helpfulCount: review.likesCount || review.likes || 0,
      images: review.reviewImageUrls || review.images || []
    }));

    console.log(`✅ Mapped ${googleReviews.length} Google reviews successfully`);
  } else {
    console.log(`⚠️ No Google reviews found in additionalInfo for place: ${place?.name || placeId}`);
  }

  // 3. Combine: User reviews first (more relevant), then Google reviews
  const allReviews = [...userReviews, ...googleReviews];

  // 4. Calculate combined average rating
  let combinedAverageRating = 0;
  let combinedRatingDistribution = {
    fiveStar: 0,
    fourStar: 0,
    threeStar: 0,
    twoStar: 0,
    oneStar: 0
  };

  if (allReviews.length > 0) {
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    combinedAverageRating = Math.round((totalRating / allReviews.length) * 10) / 10;

    // Calculate distribution
    allReviews.forEach(review => {
      const rating = review.rating;
      if (rating === 5) combinedRatingDistribution.fiveStar++;
      else if (rating === 4) combinedRatingDistribution.fourStar++;
      else if (rating === 3) combinedRatingDistribution.threeStar++;
      else if (rating === 2) combinedRatingDistribution.twoStar++;
      else if (rating === 1) combinedRatingDistribution.oneStar++;
    })
  }

  console.log('📊 Combined Rating Calculation:', {
    totalReviews: allReviews.length,
    userReviews: userReviews.length,
    googleReviews: googleReviews.length,
    combinedAverageRating,
    combinedRatingDistribution
  });

  return {
    reviews: allReviews,
    total: allReviews.length,
    userReviewsCount: userReviews.length,
    googleReviewsCount: googleReviews.length,
    combinedAverageRating,
    combinedRatingDistribution
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

  // ✅ Sử dụng deleteOne() thay vì remove() (deprecated)
  await review.deleteOne();

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

/**
 * Get all reviews (Admin only)
 * Includes user and place information
 */
export const getAllReviews = async (options = {}) => {
  const { limit = 100, skip = 0, sort = '-createdAt' } = options;

  const reviews = await Review.find({ status: 'published' })
    .populate('user', 'displayName email avatarUrl')
    .populate('place', 'name address district category')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Review.countDocuments({ status: 'published' });

  return {
    reviews,
    total,
    page: Math.floor(skip / limit) + 1,
    pages: Math.ceil(total / limit)
  };
};
