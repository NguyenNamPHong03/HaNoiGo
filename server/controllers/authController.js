import * as authService from '../services/authService.js';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

    // Call service layer
    const result = await authService.registerUser({ email, password, displayName });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });

  } catch (error) {
    console.error('Register User Error:', error);
    
    // Handle specific errors
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('provide')) {
      return res.status(400).json({
        success: false,
        message: error.message
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

    // Call service layer
    const result = await authService.loginUser({ email, password });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });

  } catch (error) {
    console.error('Login User Error:', error);
    
    // Handle authentication errors
    if (error.message.includes('Invalid credentials') || 
        error.message.includes('deactivated') || 
        error.message.includes('banned')) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('provide')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

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
    // Call service layer
    const url = authService.getGoogleAuthUrl();
    
    console.log('✅ Generated Google Auth URL:', url.substring(0, 100) + '...');
    
    return res.json({ 
      success: true,
      url 
    });
  } catch (error) {
    console.error('Google Auth URL Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate Google auth URL'
    });
  }
};

// @desc    Handle Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
export const googleCallback = async (req, res) => {
  try {
    console.log('🔵 Google Callback started');
    const { code } = req.query;
    
    if (!code) {
      console.log('❌ No code in query params');
      return res.redirect(`${process.env.CLIENT_URL}/login?error=missing_code`);
    }

    console.log('✅ Code received, processing with service...');
    
    // Call service layer
    const result = await authService.handleGoogleCallback(code);

    console.log('✅ Google auth successful, redirecting...');
    console.log('Redirect URL:', `${process.env.CLIENT_URL}/oauth-success?token=${result.token.substring(0, 20)}...`);
    
    // Redirect to client with token
    return res.redirect(
      `${process.env.CLIENT_URL}/oauth-success?token=${result.token}&refreshToken=${result.refreshToken}`
    );
  } catch (error) {
    console.error('❌ Google Callback Error:', error.message);
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

    // Call service layer
    const updatedUser = await authService.updateUserProfile(userId, {
      displayName,
      avatarUrl,
      preferences
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    
    if (error.message.includes('required') || error.message.includes('not found')) {
      return res.status(400).json({
        success: false,
        message: error.message
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

    // Call service layer
    const result = await authService.createAdmin({ email, password, displayName });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: result
    });

  } catch (error) {
    console.error('Create Admin Error:', error);
    
    if (error.message.includes('already exists') || error.message.includes('provide')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};