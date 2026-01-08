import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  // User who wrote the review
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  // Place being reviewed
  place: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Place',
    required: [true, 'Place is required']
  },
  // Rating (1-5 stars)
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  // Review comment
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    trim: true,
    minlength: [10, 'Comment must be at least 10 characters'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  // Optional review images
  images: [{
    type: String,
    validate: {
      validator: function(value) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i.test(value) || 
               /^https?:\/\/res\.cloudinary\.com\//i.test(value);
      },
      message: 'Invalid image URL'
    }
  }],
  // Helpful count (likes)
  helpfulCount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Users who marked this review as helpful
  helpfulBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Status
  status: {
    type: String,
    enum: ['published', 'pending', 'hidden'],
    default: 'published'
  },
  // Reported flag
  reported: {
    type: Boolean,
    default: false
  },
  reportCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ Compound index: 1 user chỉ review 1 place 1 lần
reviewSchema.index({ user: 1, place: 1 }, { unique: true });

// Indexes for queries
reviewSchema.index({ place: 1, status: 1, createdAt: -1 }); // Get reviews for a place
reviewSchema.index({ user: 1, createdAt: -1 }); // Get user's reviews
reviewSchema.index({ rating: -1, helpfulCount: -1 }); // Sort by rating/helpful

// ✅ Pre-save: Update place's average rating and totalReviews
reviewSchema.post('save', async function() {
  await updatePlaceRating(this.place);
});

// ✅ Post-remove: Update place's average rating when review deleted
reviewSchema.post('remove', async function() {
  await updatePlaceRating(this.place);
});

// Helper function to recalculate place rating
async function updatePlaceRating(placeId) {
  const Place = mongoose.model('Place');
  const Review = mongoose.model('Review');

  const stats = await Review.aggregate([
    { $match: { place: placeId, status: 'published' } },
    {
      $group: {
        _id: '$place',
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Place.findByIdAndUpdate(placeId, {
      totalReviews: stats[0].totalReviews,
      averageRating: Math.round(stats[0].averageRating * 10) / 10 // Round to 1 decimal
    });
  } else {
    // No reviews, reset to 0
    await Place.findByIdAndUpdate(placeId, {
      totalReviews: 0,
      averageRating: 0
    });
  }
}

export default mongoose.model('Review', reviewSchema);
