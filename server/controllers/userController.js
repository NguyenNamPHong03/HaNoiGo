import User from '../models/User.js';

// @desc    Get all users
// @route   GET /api/users?page=1&limit=10&search=...&role=...&status=...
// @access  Private (Admin only)
export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;
    
    const query = { 
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } }
      ]
    }; // Show non-deleted users (including those without deletedAt field)
    
    // Search filter
    if (search) {
      query.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Role filter
    if (role && role !== 'all') {
      query.role = role;
    }
    
    // Status filter
    if (status && status !== 'all') {
      if (status === 'deleted') {
        // Override default filter to show only deleted users
        delete query.$or;
        query.deletedAt = { $ne: null };
      } else {
        query.status = status;
      }
    }
    
    const users = await User.find(query)
      .select('-password')
      .populate('deletedBy', 'displayName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: users,
      page: parseInt(page),
      limit: parseInt(limit),
      total: total,
      totalPages: totalPages
    });

  } catch (error) {
    console.error('Get Users Error:', error);
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin only)
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get User By ID Error:', error);
    next(error);
  }
};

// @desc    Update user role and status
// @route   PATCH /api/users/:id
// @access  Private (Admin only)
export const updateUser = async (req, res, next) => {
  try {
    const { role, status, isBanned, isActive } = req.body;
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    
    if (!user || user.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Don't allow changing admin role by non-superadmin
    if (user.role === 'admin' && role && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot demote admin users'
      });
    }
    
    const updateData = {};
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (typeof isBanned !== 'undefined') updateData.isBanned = isBanned;
    if (typeof isActive !== 'undefined') updateData.isActive = isActive;
    
    // Sync status with boolean fields
    if (status === 'banned') {
      updateData.isBanned = true;
      updateData.isActive = false;
    } else if (status === 'active') {
      updateData.isBanned = false;
      updateData.isActive = true;
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password' }
    );
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update User Error:', error);
    next(error);
  }
};

// @desc    Ban user
// @route   POST /api/users/:id/ban
// @access  Private (Admin only)
export const banUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { reason, expiresAt } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user || user.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot ban admin users'
      });
    }
    
    const updateData = {
      isBanned: true,
      status: 'banned',
      isActive: false,
      banReason: reason || 'No reason provided'
    };
    
    if (expiresAt) {
      updateData.banExpiresAt = new Date(expiresAt);
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password' }
    );
    
    res.status(200).json({
      success: true,
      message: 'User banned successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Ban User Error:', error);
    next(error);
  }
};

// @desc    Soft delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const adminId = req.user?._id || null;
    
    // Validate ObjectId
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if already deleted
    if (user.deletedAt) {
      return res.status(400).json({
        success: false,
        message: 'User already deleted'
      });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }
    
    await user.softDelete(adminId);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {
        userId: user._id,
        displayName: user.displayName
      }
    });

  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Admin only)
export const getUserStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const activeUsers = await User.countDocuments({ isActive: true, role: 'user' });
    const bannedUsers = await User.countDocuments({ isBanned: true, role: 'user' });
    
    // Users registered this month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth },
      role: 'user'
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalAdmins,
        activeUsers,
        bannedUsers,
        newUsersThisMonth
      }
    });

  } catch (error) {
    console.error('Get User Stats Error:', error);
    next(error);
  }
};