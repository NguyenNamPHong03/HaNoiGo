import mongoose from 'mongoose';

const placeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Place name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['food', 'entertainment']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  priceRange: {
    min: {
      type: Number,
      required: true,
      min: [0, 'Minimum price cannot be negative']
    },
    max: {
      type: Number,
      required: true,
      validate: {
        validator: function(value) {
          return value >= this.priceRange.min;
        },
        message: 'Maximum price must be greater than or equal to minimum price'
      }
    }
  },
  images: [{
    type: String,
    validate: {
      validator: function(value) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i.test(value);
      },
      message: 'Invalid image URL'
    }
  }],
  menu: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    }
  }],
  // AI Tags for semantic enrichment
  aiTags: {
    space: [{
      type: String,
      enum: ['cozy', 'spacious', 'intimate', 'open', 'quiet', 'lively', 'modern', 'traditional']
    }],
    suitability: [{
      type: String,
      enum: ['date', 'family', 'friends', 'business', 'solo', 'group', 'romantic', 'casual']
    }],
    mood: [{
      type: String,
      enum: ['relaxed', 'energetic', 'romantic', 'professional', 'festive', 'peaceful', 'adventurous']
    }]
  },
  // Location coordinates (for future map integration)
  coordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    }
  },
  // Operating hours
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  // Contact information
  contact: {
    phone: {
      type: String,
      validate: {
        validator: function(v) {
          return /^[\+]?[0-9\-\(\)\s]+$/.test(v);
        },
        message: 'Invalid phone number'
      }
    },
    website: {
      type: String,
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+$/.test(v);
        },
        message: 'Invalid website URL'
      }
    }
  },
  // Status and metadata
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
placeSchema.index({ name: 'text', description: 'text' });
placeSchema.index({ category: 1, isActive: 1 });
placeSchema.index({ 'priceRange.min': 1, 'priceRange.max': 1 });
placeSchema.index({ coordinates: '2dsphere' });
placeSchema.index({ featured: 1, averageRating: -1 });

// Virtual for price range display
placeSchema.virtual('priceRangeDisplay').get(function() {
  if (this.priceRange.min === this.priceRange.max) {
    return `${this.priceRange.min.toLocaleString()}₫`;
  }
  return `${this.priceRange.min.toLocaleString()}₫ - ${this.priceRange.max.toLocaleString()}₫`;
});

// Pre-save middleware to ensure data consistency
placeSchema.pre('save', function(next) {
  if (this.priceRange.max < this.priceRange.min) {
    this.priceRange.max = this.priceRange.min;
  }
  next();
});

export default mongoose.model('Place', placeSchema);