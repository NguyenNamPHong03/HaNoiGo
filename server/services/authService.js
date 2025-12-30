import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * AUTH SERVICE
 * Business logic layer cho authentication
 * Xử lý: Register, Login, JWT, OAuth, Password validation
 */

// ========== GOOGLE OAUTH HELPERS ==========

/**
 * Get Google OAuth client instance
 */
const getGoogleClient = () => {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

/**
 * Check if Google OAuth is configured
 */
export const isGoogleOAuthConfigured = () => {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REDIRECT_URI
  );
};

// ========== JWT TOKEN GENERATION ==========

/**
 * Generate access token (JWT)
 * @param {string} userId - User ID
 * @param {string} type - User type (user/admin)
 * @returns {string} JWT token
 */
export const generateToken = (userId, type = 'user') => {
  return jwt.sign(
    { id: userId, type },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Generate refresh token
 * @param {string} userId - User ID
 * @param {string} type - User type (user/admin)
 * @returns {string} Refresh token
 */
export const generateRefreshToken = (userId, type = 'user') => {
  return jwt.sign(
    { id: userId, type, refresh: true },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token
 * @returns {object} Decoded token payload
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

// ========== REGISTER & LOGIN ==========

/**
 * Register new user
 * @param {object} userData - { email, password, displayName }
 * @returns {object} { user, token, refreshToken }
 */
export const registerUser = async ({ email, password, displayName }) => {
  // Validate input
  if (!email || !password || !displayName) {
    throw new Error('Please provide email, password, and display name');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  // Create user
  const user = await User.create({
    email,
    password,
    displayName,
    role: 'user',
  });

  // Generate tokens
  const token = generateToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id, user.role);

  return {
    user,
    token,
    refreshToken,
  };
};

/**
 * Login user with email/password
 * @param {object} credentials - { email, password }
 * @returns {object} { user, token, refreshToken, role }
 */
export const loginUser = async ({ email, password }) => {
  // Validate input
  if (!email || !password) {
    throw new Error('Please provide email and password');
  }

  // Find user (include password field)
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check if user is active and not banned
  if (!user.isActive || user.isBanned) {
    throw new Error('Account is deactivated or banned');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  // Update last login timestamp
  await user.updateLastLogin();

  // Generate tokens
  const token = generateToken(user._id, user.role || 'user');
  const refreshToken = generateRefreshToken(user._id, user.role || 'user');

  // Remove password from response
  user.password = undefined;

  return {
    user,
    token,
    refreshToken,
    role: user.role || 'user',
  };
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {object} { token, refreshToken }
 */
export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // Check if user still exists
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive || user.isBanned) {
    throw new Error('User not found or account is deactivated');
  }

  // Generate new tokens
  const newToken = generateToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id, user.role);

  return {
    token: newToken,
    refreshToken: newRefreshToken,
  };
};

// ========== GOOGLE OAUTH ==========

/**
 * Generate Google OAuth URL
 * @returns {string} Google OAuth URL
 */
export const getGoogleAuthUrl = () => {
  if (!isGoogleOAuthConfigured()) {
    throw new Error('Google OAuth is not configured');
  }

  const googleClient = getGoogleClient();
  const url = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    prompt: 'consent',
  });

  return url;
};

/**
 * Handle Google OAuth callback
 * @param {string} code - Authorization code from Google
 * @returns {object} { user, token, refreshToken, isNewUser }
 */
export const handleGoogleCallback = async (code) => {
  if (!code) {
    throw new Error('Authorization code is required');
  }

  const googleClient = getGoogleClient();

  // Exchange code for tokens
  const { tokens } = await googleClient.getToken(code);
  googleClient.setCredentials(tokens);

  // Get user info from Google
  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { email, name, picture } = payload;

  if (!email) {
    throw new Error('Could not retrieve email from Google');
  }

  // Check if user exists
  let user = await User.findOne({ email });
  let isNewUser = false;

  if (!user) {
    // Create new user
    user = await User.create({
      email,
      displayName: name || email.split('@')[0],
      avatarUrl: picture || '',
      role: 'user',
      isActive: true,
      authProvider: 'google',
    });
    isNewUser = true;
  } else {
    // Update existing user
    user.avatarUrl = picture || user.avatarUrl;
    user.authProvider = 'google';
    await user.updateLastLogin();
  }

  // Generate tokens
  const token = generateToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id, user.role);

  return {
    user,
    token,
    refreshToken,
    isNewUser,
  };
};

// ========== PASSWORD MANAGEMENT ==========

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) {
    throw new Error('Please provide current and new password');
  }

  // Find user with password
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new Error('Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  return { message: 'Password changed successfully' };
};

/**
 * Reset password (for forgot password flow)
 * @param {string} email - User email
 * @returns {object} Reset token info
 */
export const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists for security
    return { message: 'If email exists, reset link will be sent' };
  }

  // Generate reset token (simple implementation)
  const resetToken = jwt.sign(
    { id: user._id, purpose: 'password-reset' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // TODO: Send email with reset token
  // emailService.sendPasswordResetEmail(user.email, resetToken);

  return {
    message: 'Password reset email sent',
    resetToken, // In production, don't return this - send via email
  };
};

/**
 * Reset password with token
 * @param {string} resetToken - Reset token from email
 * @param {string} newPassword - New password
 */
export const resetPassword = async (resetToken, newPassword) => {
  if (!resetToken || !newPassword) {
    throw new Error('Reset token and new password are required');
  }

  try {
    // Verify reset token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    if (decoded.purpose !== 'password-reset') {
      throw new Error('Invalid reset token');
    }

    // Find user and update password
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new Error('User not found');
    }

    user.password = newPassword;
    await user.save();

    return { message: 'Password reset successfully' };
  } catch (error) {
    throw new Error('Invalid or expired reset token');
  }
};

// ========== USER VERIFICATION ==========

/**
 * Get user by ID (for profile retrieval)
 * @param {string} userId - User ID
 * @returns {object} User object (without password)
 */
export const getUserById = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

/**
 * Verify user account status
 * @param {string} userId - User ID
 * @returns {boolean} Is user active and not banned
 */
export const verifyUserStatus = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return user.isActive && !user.isBanned;
};

// ========== PROFILE MANAGEMENT ==========

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {object} profileData - { displayName, avatarUrl, preferences }
 * @returns {object} Updated user
 */
export const updateUserProfile = async (userId, profileData) => {
  const { displayName, avatarUrl, preferences } = profileData;

  // Validation
  if (!displayName) {
    throw new Error('Display name is required');
  }

  // Update user profile
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      displayName,
      avatarUrl,
      preferences,
    },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    throw new Error('User not found');
  }

  return updatedUser;
};

/**
 * Create admin account
 * @param {object} adminData - { email, password, displayName }
 * @returns {object} { user, token, refreshToken, role }
 */
export const createAdmin = async ({ email, password, displayName }) => {
  // Validation
  if (!email || !password || !displayName) {
    throw new Error('Please provide email, password, and display name');
  }

  // Check if admin already exists
  const existingAdmin = await User.findOne({ email });
  if (existingAdmin) {
    throw new Error('Admin already exists with this email');
  }

  // Create admin
  const admin = await User.create({
    email,
    password,
    displayName,
    role: 'admin',
  });

  // Generate tokens
  const token = generateToken(admin._id, admin.role);
  const refreshToken = generateRefreshToken(admin._id, admin.role);

  return {
    user: admin,
    token,
    refreshToken,
    role: admin.role,
  };
};
