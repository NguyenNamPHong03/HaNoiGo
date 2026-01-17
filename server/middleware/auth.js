import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// @desc    Authenticate token middleware
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user based on ID (only user authentication now)
    const userData = await User.findById(decoded.id);
    if (!userData || !userData.isActive || userData.isBanned) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or account deactivated'
      });
    }

    // Attach user info to request
    req.user = userData;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// @desc    Admin authentication middleware
export const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user and check if admin
    const userData = await User.findById(decoded.id);
    if (!userData || !userData.isActive || userData.isBanned) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or account deactivated'
      });
    }

    // Check if user is admin
    if (userData.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Attach user info to request
    req.user = userData;
    req.userType = 'user';

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * @desc    Optional authentication middleware
 * Attempts to authenticate user but allows request to proceed even if not authenticated.
 * Used for features that work for both anonymous and authenticated users (e.g., AI chat)
 * but provide enhanced experience for authenticated users (personalization).
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      // No token - proceed as anonymous user
      req.user = null;
      return next();
    }

    // Try to verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const userData = await User.findById(decoded.id).select('+preferences');

    if (!userData || !userData.isActive || userData.isBanned) {
      // Invalid user - proceed as anonymous
      req.user = null;
      return next();
    }

    // Attach user info to request
    req.user = userData;
    next();

  } catch (error) {
    // Token invalid/expired - proceed as anonymous user
    req.user = null;
    next();
  }
};

// Admin middleware functions removed - no admin authentication needed