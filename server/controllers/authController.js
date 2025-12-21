import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper function to generate JWT
const generateToken = (id, type = 'user') => {
  return jwt.sign(
    { id, type },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Helper function to generate refresh token
const generateRefreshToken = (id, type = 'user') => {
  return jwt.sign(
    { id, type, refresh: true },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};





// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

    // Validation
    if (!email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and display name'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      displayName,
      role: 'user'
    });

    // Generate tokens
    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Register User Error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0]
      });
    }

    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active and not banned
    if (!user.isActive || user.isBanned) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated or banned'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate tokens based on user role
    const token = generateToken(user._id, user.role || 'user');
    const refreshToken = generateRefreshToken(user._id, user.role || 'user');

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
        refreshToken,
        role: user.role || 'user'
      }
    });

  } catch (error) {
    console.error('Login User Error:', error);
    next(error);
  }
};

// @desc    Get current authenticated user/admin profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res, next) => {
  try {
    // req.user will be set by auth middleware
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { displayName, avatarUrl, preferences } = req.body;
    const userId = req.user._id;

    // Validation
    if (!displayName) {
      return res.status(400).json({
        success: false,
        message: 'Display name is required'
      });
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        displayName,
        avatarUrl,
        preferences
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0]
      });
    }

    next(error);
  }
};

// @desc    Logout user/admin (invalidate token)
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    // In a real app, you might want to blacklist the token
    // For now, we'll rely on frontend to remove the token
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout Error:', error);
    next(error);
  }
};

// @desc    Create admin account
// @route   POST /api/auth/create-admin
// @access  Private (for development only)
export const createAdmin = async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

    // Validation
    if (!email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and display name'
      });
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists with this email'
      });
    }

    // Create admin
    const admin = await User.create({
      email,
      password,
      displayName,
      role: 'admin'
    });

    // Generate tokens
    const token = generateToken(admin._id, admin.role);
    const refreshToken = generateRefreshToken(admin._id, admin.role);

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        user: admin,
        token,
        refreshToken,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Create Admin Error:', error);
    next(error);
  }
};