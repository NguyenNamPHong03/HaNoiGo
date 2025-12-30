import * as userService from '../services/userService.js';

// @desc    Get all users
// @route   GET /api/users?page=1&limit=10&search=...&role=...&status=...
// @access  Private (Admin only)
export const getUsers = async (req, res, next) => {
  try {
    const { page, limit, search, role, status } = req.query;
    
    // Call service layer
    const result = await userService.getAllUsers({ page, limit, search, role, status });

    res.status(200).json({
      success: true,
      data: result.users,
      ...result.pagination
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
    // Call service layer
    const user = await userService.getUserById(req.params.id);
    
    res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get User By ID Error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
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
    
    // Call service layer
    const updatedUser = await userService.updateUserRoleAndStatus(userId, {
      role,
      status,
      isBanned,
      isActive
    });
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update User Error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('Cannot demote')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    
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
    
    // Call service layer
    const updatedUser = await userService.banUser(userId, { reason, expiresAt });
    
    res.status(200).json({
      success: true,
      message: 'User banned successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Ban User Error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('Cannot ban')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    
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
    
    // Validate ObjectId format
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    // Call service layer
    const result = await userService.softDeleteUser(userId, adminId);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: result
    });

  } catch (error) {
    console.error('Delete User Error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('already deleted')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('Cannot delete')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    
    next(error);
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