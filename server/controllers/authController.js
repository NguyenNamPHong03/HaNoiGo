import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper function to get Google OAuth client (lazy initialization)
const getGoogleClient = () => {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

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
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    next(error);
  }
};
// @desc    Get Google OAuth URL
// @route   GET /api/auth/google/url
// @access  Public
export const googleAuthUrl = async (req, res) => {
  try {
    // Debug log to check env variables
    console.log('🔍 Google OAuth Debug:');
    console.log('GOOGLE_CLIENT_ID =', process.env.GOOGLE_CLIENT_ID);
    console.log('GOOGLE_CLIENT_SECRET =', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');
    console.log('GOOGLE_REDIRECT_URI =', process.env.GOOGLE_REDIRECT_URI);

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('❌ Missing Google OAuth credentials in .env file');
      return res.status(500).json({
        success: false,
        message: 'Google OAuth is not configured. Please contact administrator.'
      });
    }

    const googleClient = getGoogleClient();
    const url = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      prompt: 'consent',
    });
    
    console.log('✅ Generated Google Auth URL:', url.substring(0, 100) + '...');
    
    return res.json({ 
      success: true,
      url 
    });
  } catch (error) {
    console.error('Google Auth URL Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate Google auth URL'
    });
  }
};

// @desc    Handle Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
export const googleCallback = async (req, res) => {
  try {
    console.log('🔵 Google Callback started');
    console.log('Query params:', req.query);
    
    const { code } = req.query;
    
    if (!code) {
      console.log('❌ No code in query params');
      return res.redirect(`${process.env.CLIENT_URL}/login?error=missing_code`);
    }

    console.log('✅ Code received, creating Google client...');
    const googleClient = getGoogleClient();

    console.log('🔄 Exchanging code for tokens...');
    // Exchange code for tokens
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);
    console.log('✅ Tokens received');

    console.log('🔄 Verifying ID token...');
    // Verify ID token to get user profile
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    console.log('✅ Token verified, user email:', payload.email);

    const googleId = payload.sub;
    const email = payload.email;
    const displayName = payload.name || 'Google User';
    const avatarUrl = payload.picture;

    console.log('🔄 Looking for existing user...');
    // Find user by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      console.log('📝 Creating new user...');
      // Create new user
      user = await User.create({
        email,
        displayName,
        googleId,
        avatarUrl,
        role: 'user',
        status: 'active',
        isEmailVerified: true, // Google emails are verified
      });
      console.log('✅ New user created:', user._id);
    } else {
      console.log('✅ User found:', user._id);
      // Update existing user
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (!user.avatarUrl && avatarUrl) {
        user.avatarUrl = avatarUrl;
      }
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
      }
      await user.save();
      console.log('✅ User updated');
    }

    // Check if user is banned
    if (user.status === 'banned' || user.isBanned) {
      console.log('❌ User is banned');
      return res.redirect(`${process.env.CLIENT_URL}/login?error=banned`);
    }

    console.log('🔄 Updating last login...');
    // Update last login
    await user.updateLastLogin();

    console.log('🔄 Generating JWT tokens...');
    // Generate JWT token
    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);
    console.log('✅ JWT tokens generated');

    console.log('🔄 Redirecting to client...');
    console.log('Redirect URL:', `${process.env.CLIENT_URL}/oauth-success?token=${token.substring(0, 20)}...`);
    
    // Redirect to client with token
    return res.redirect(
      `${process.env.CLIENT_URL}/oauth-success?token=${token}&refreshToken=${refreshToken}`
    );
  } catch (error) {
    console.error('❌ Google Callback Error:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error response:', error?.response?.data || 'No response data');
    
    return res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
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