import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Invalid email format'
    }
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required if not using Google OAuth
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    maxlength: [50, 'Display name cannot exceed 50 characters']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // Account status following the recommended structure
  status: {
    type: String,
    enum: ['active', 'banned', 'deleted'],
    default: 'active'
  },
  avatarUrl: {
    type: String,
    validate: {
      validator: function(url) {
        return !url || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
      },
      message: 'Invalid avatar URL'
    }
  },
  // User preferences for AI personalization
  preferences: {
    favoriteFoods: [{
      type: String,
      trim: true
    }],
    styles: [{
      type: String,
      enum: ['modern', 'traditional', 'cozy', 'elegant', 'casual', 'upscale']
    }],
    dietary: [{
      type: String,
      enum: ['vegetarian', 'vegan', 'halal', 'kosher', 'gluten-free', 'dairy-free']
    }],
    priceRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 1000000 }
    }
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: String,
  banExpiresAt: Date,
  
  // Soft delete support
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Email verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Password reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // OAuth
  googleId: String,
  
  // Activity tracking
  lastLoginAt: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  
  // Statistics
  totalReviews: {
    type: Number,
    default: 0
  },
  totalChatSessions: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ isActive: 1, isBanned: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user is banned
userSchema.methods.isBannedUser = function() {
  if (!this.isBanned) return false;
  
  if (this.banExpiresAt && this.banExpiresAt < new Date()) {
    this.isBanned = false;
    this.banReason = undefined;
    this.banExpiresAt = undefined;
    this.save();
    return false;
  }
  
  return true;
};

// Method to update last login time
userSchema.methods.updateLastLogin = async function() {
  this.lastLoginAt = new Date();
  this.loginCount += 1;
  return this.save();
};

// Soft delete method
userSchema.methods.softDelete = async function(deletedBy = null) {
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.status = 'deleted';
  this.isActive = false;
  return this.save();
};

// Static method to find non-deleted users
userSchema.statics.findActive = function(query = {}) {
  return this.find({ ...query, deletedAt: null });
};

// Restore method
userSchema.methods.restore = async function() {
  this.deletedAt = null;
  this.deletedBy = null;
  this.status = 'active';
  this.isActive = true;
  return this.save();
};

// Virtual for full user info (excluding sensitive data)
userSchema.virtual('profile').get(function() {
  return {
    _id: this._id,
    email: this.email,
    displayName: this.displayName,
    avatarUrl: this.avatarUrl,
    preferences: this.preferences,
    isActive: this.isActive,
    totalReviews: this.totalReviews,
    createdAt: this.createdAt
  };
});

export default mongoose.model('User', userSchema);