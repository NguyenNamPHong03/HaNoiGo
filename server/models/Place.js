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
  district: {
    type: String,
    required: [true, 'District is required'],
    enum: [
      'Ba Đình', 'Hoàn Kiếm', 'Tây Hồ', 'Long Biên', 'Cầu Giấy', 
      'Đống Đa', 'Thanh Xuân', 'Nam Từ Liêm', 'Bắc Từ Liêm', 
      'Hà Đông', 'Hoàng Mai', 'Hai Bà Trưng'
    ]
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Ăn uống', 'Vui chơi', 'Mua sắm', 'Dịch vụ', 'Khác']
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
          // ✅ Fix: Check null safety để tránh lỗi "Cannot read properties of undefined"
          if (this.priceRange == null || this.priceRange.min == null) {
            return true; // Skip validation nếu min chưa được set
          }
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
      enum: ['ấm cúng', 'rộng rãi', 'riêng tư', 'thoáng đãng', 'yên tĩnh', 'sôi động', 'hiện đại', 'cổ điển', 'ngoài trời', 'rooftop', 'vintage']
    }],
    mood: [{
      type: String,
      enum: ['chill', 'lãng mạn', 'sôi động', 'thư giãn', 'năng động', 'chuyên nghiệp', 'vui vẻ', 'yên bình', 'phiêu lưu', 'ấm cúng']
    }],
    suitability: [{
      type: String,
      enum: ['hẹn hò', 'gia đình', 'bạn bè', 'công việc', 'một mình', 'nhóm lớn', 'học bài', 'tụ tập', 'họp mặt', 'sinh nhật', 'thư giãn']
    }],
    // Thêm các tags mở rộng
    crowdLevel: [{
      type: String,
      enum: ['ít người', 'vừa phải', 'đông đúc', 'rất đông']
    }],
    music: [{
      type: String,
      enum: ['nhạc nhẹ', 'nhạc sôi động', 'không có nhạc', 'karaoke', 'live music']
    }],
    parking: [{
      type: String,
      enum: ['có chỗ đậu xe', 'khó đậu xe', 'gửi xe miễn phí', 'gửi xe có phí']
    }],
    specialFeatures: [{
      type: String,
      enum: ['wifi miễn phí', 'điều hòa', 'view đẹp', 'phục vụ 24h', 'delivery', 'pet friendly', 'có khu vui chơi trẻ em']
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
  status: {
    type: String,
    enum: ['Published', 'Draft', 'Archived'],
    default: 'Draft'
  },
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
  },
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
placeSchema.index({ name: 'text', description: 'text' });
placeSchema.index({ category: 1, status: 1, isActive: 1 });
placeSchema.index({ district: 1 });
placeSchema.index({ 'priceRange.min': 1, 'priceRange.max': 1 });
placeSchema.index({ coordinates: '2dsphere' });
placeSchema.index({ featured: 1, averageRating: -1 });
placeSchema.index({ 'aiTags.mood': 1 });
placeSchema.index({ 'aiTags.space': 1 });
placeSchema.index({ 'aiTags.suitability': 1 });
placeSchema.index({ updatedAt: -1 });
placeSchema.index({ status: 1, updatedAt: -1 });

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