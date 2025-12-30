import User from '../models/User.js';

/**
 * USER SERVICE
 * Business logic layer cho quản lý người dùng
 * Xử lý: User CRUD, Profile, Preferences, Ban/Unban, Statistics
 */

// ========== QUERY & SEARCH ==========

/**
 * Build user query từ filters
 * @param {object} filters - Filter parameters
 * @returns {object} MongoDB query
 */
const buildUserQuery = (filters) => {
  const { search, role, status } = filters;

  const query = {
    $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
  };

  // Search filter (displayName, email)
  if (search) {
    query.$or = [
      { displayName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
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
    } else if (status === 'banned') {
      query.isBanned = true;
    } else if (status === 'active') {
      query.isActive = true;
      query.isBanned = false;
    } else {
      query.status = status;
    }
  }

  return query;
};

// ========== USER CRUD ==========

/**
 * Get all users với pagination, search, filter
 * @param {object} options - Query options
 * @returns {object} { users, pagination }
 */
export const getAllUsers = async (options = {}) => {
  const { page = 1, limit = 10, search, role, status } = options;

  const query = buildUserQuery({ search, role, status });

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .populate('deletedBy', 'displayName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip),
    User.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / parseInt(limit));

  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages,
    hasNextPage: parseInt(page) < totalPages,
    hasPrevPage: parseInt(page) > 1,
  };

  return { users, pagination };
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {object} User object
 */
export const getUserById = async (userId) => {
  const user = await User.findById(userId).select('-password');

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

/**
 * Get user profile (with preferences)
 * @param {string} userId - User ID
 * @returns {object} User profile
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId)
    .select('-password')
    .populate('preferences');

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {object} updateData - { displayName, avatarUrl, etc. }
 * @returns {object} Updated user
 */
export const updateUserProfile = async (userId, updateData) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Chỉ cho phép update một số fields nhất định
  const allowedFields = ['displayName', 'avatarUrl', 'bio', 'phone'];
  const filteredData = {};

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      filteredData[field] = updateData[field];
    }
  });

  const updatedUser = await User.findByIdAndUpdate(userId, filteredData, {
    new: true,
    runValidators: true,
    select: '-password',
  });

  return updatedUser;
};

/**
 * Update user role and status (Admin only)
 * @param {string} userId - User ID
 * @param {object} updateData - { role, status, isBanned, isActive }
 * @returns {object} Updated user
 */
export const updateUserRoleAndStatus = async (userId, updateData) => {
  const { role, status, isBanned, isActive } = updateData;

  const user = await User.findById(userId);

  if (!user || user.deletedAt) {
    throw new Error('User not found');
  }

  // Don't allow changing admin role by non-superadmin
  if (user.role === 'admin' && role && role !== 'admin') {
    throw new Error('Cannot demote admin users');
  }

  const updates = {};
  if (role) updates.role = role;
  if (status) updates.status = status;
  if (typeof isBanned !== 'undefined') updates.isBanned = isBanned;
  if (typeof isActive !== 'undefined') updates.isActive = isActive;

  // Sync status with boolean fields
  if (status === 'banned') {
    updates.isBanned = true;
    updates.isActive = false;
  } else if (status === 'active') {
    updates.isBanned = false;
    updates.isActive = true;
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    select: '-password',
  });

  return updatedUser;
};

// ========== USER PREFERENCES ==========

/**
 * Get user preferences
 * @param {string} userId - User ID
 * @returns {object} Preferences
 */
export const getUserPreferences = async (userId) => {
  const user = await User.findById(userId).select('preferences');

  if (!user) {
    throw new Error('User not found');
  }

  return user.preferences || {};
};

/**
 * Update user preferences
 * @param {string} userId - User ID
 * @param {object} preferences - { favoriteFoods, styles, dietary }
 * @returns {object} Updated user
 */
export const updateUserPreferences = async (userId, preferences) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Merge với preferences hiện tại
  const updatedPreferences = {
    ...user.preferences,
    ...preferences,
  };

  user.preferences = updatedPreferences;
  await user.save();

  return user;
};

/**
 * Add item to preference array
 * @param {string} userId - User ID
 * @param {string} category - favoriteFoods/styles/dietary
 * @param {string} item - Item to add
 * @returns {object} Updated user
 */
export const addPreferenceItem = async (userId, category, item) => {
  const validCategories = ['favoriteFoods', 'styles', 'dietary'];

  if (!validCategories.includes(category)) {
    throw new Error('Invalid preference category');
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.preferences) {
    user.preferences = {};
  }

  if (!user.preferences[category]) {
    user.preferences[category] = [];
  }

  // Add item nếu chưa tồn tại
  if (!user.preferences[category].includes(item)) {
    user.preferences[category].push(item);
    await user.save();
  }

  return user;
};

/**
 * Remove item from preference array
 * @param {string} userId - User ID
 * @param {string} category - favoriteFoods/styles/dietary
 * @param {string} item - Item to remove
 * @returns {object} Updated user
 */
export const removePreferenceItem = async (userId, category, item) => {
  const validCategories = ['favoriteFoods', 'styles', 'dietary'];

  if (!validCategories.includes(category)) {
    throw new Error('Invalid preference category');
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.preferences || !user.preferences[category]) {
    return user;
  }

  // Remove item
  user.preferences[category] = user.preferences[category].filter(
    (i) => i !== item
  );
  await user.save();

  return user;
};

// ========== BAN & UNBAN ==========

/**
 * Ban user
 * @param {string} userId - User ID to ban
 * @param {object} banData - { reason, expiresAt }
 * @returns {object} Banned user
 */
export const banUser = async (userId, banData = {}) => {
  const { reason, expiresAt } = banData;

  const user = await User.findById(userId);

  if (!user || user.deletedAt) {
    throw new Error('User not found');
  }

  if (user.role === 'admin') {
    throw new Error('Cannot ban admin users');
  }

  const updates = {
    isBanned: true,
    status: 'banned',
    isActive: false,
    banReason: reason || 'No reason provided',
  };

  if (expiresAt) {
    updates.banExpiresAt = new Date(expiresAt);
  }

  const bannedUser = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    select: '-password',
  });

  return bannedUser;
};

/**
 * Unban user
 * @param {string} userId - User ID to unban
 * @returns {object} Unbanned user
 */
export const unbanUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const updates = {
    isBanned: false,
    status: 'active',
    isActive: true,
    banReason: null,
    banExpiresAt: null,
  };

  const unbannedUser = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    select: '-password',
  });

  return unbannedUser;
};

// ========== SOFT DELETE ==========

/**
 * Soft delete user
 * @param {string} userId - User ID to delete
 * @param {string} adminId - Admin ID who deleted
 * @returns {object} Deleted user info
 */
export const softDeleteUser = async (userId, adminId = null) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  if (user.deletedAt) {
    throw new Error('User already deleted');
  }

  if (user.role === 'admin') {
    throw new Error('Cannot delete admin users');
  }

  await user.softDelete(adminId);

  return {
    userId: user._id,
    displayName: user.displayName,
    deletedAt: user.deletedAt,
  };
};

/**
 * Restore soft-deleted user
 * @param {string} userId - User ID to restore
 * @returns {object} Restored user
 */
export const restoreUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.deletedAt) {
    throw new Error('User is not deleted');
  }

  user.deletedAt = null;
  user.deletedBy = null;
  user.isActive = true;
  await user.save();

  return user;
};

// ========== STATISTICS ==========

/**
 * Get user statistics
 * @returns {object} Stats data
 */
export const getUserStats = async () => {
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  const [
    totalUsers,
    totalAdmins,
    activeUsers,
    bannedUsers,
    newUsersThisMonth,
    deletedUsers,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ isActive: true, role: 'user' }),
    User.countDocuments({ isBanned: true, role: 'user' }),
    User.countDocuments({
      createdAt: { $gte: startOfMonth },
      role: 'user',
    }),
    User.countDocuments({ deletedAt: { $ne: null } }),
  ]);

  return {
    totalUsers,
    totalAdmins,
    activeUsers,
    bannedUsers,
    newUsersThisMonth,
    deletedUsers,
  };
};

/**
 * Get users registered in date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {array} Users array
 */
export const getUsersByDateRange = async (startDate, endDate) => {
  const users = await User.find({
    createdAt: { $gte: startDate, $lte: endDate },
  })
    .select('-password')
    .sort({ createdAt: -1 });

  return users;
};

// ========== VALIDATION & HELPERS ==========

/**
 * Check if user exists
 * @param {string} userId - User ID
 * @returns {boolean} Exists
 */
export const userExists = async (userId) => {
  const count = await User.countDocuments({ _id: userId });
  return count > 0;
};

/**
 * Check if email exists
 * @param {string} email - Email
 * @returns {boolean} Exists
 */
export const emailExists = async (email) => {
  const count = await User.countDocuments({ email });
  return count > 0;
};

/**
 * Check if user is admin
 * @param {string} userId - User ID
 * @returns {boolean} Is admin
 */
export const isAdmin = async (userId) => {
  const user = await User.findById(userId).select('role');
  return user && user.role === 'admin';
};

/**
 * Check if user is active
 * @param {string} userId - User ID
 * @returns {boolean} Is active
 */
export const isUserActive = async (userId) => {
  const user = await User.findById(userId).select('isActive isBanned');
  return user && user.isActive && !user.isBanned;
};

/**
 * Get users by role
 * @param {string} role - Role (user/admin)
 * @returns {array} Users array
 */
export const getUsersByRole = async (role) => {
  const users = await User.find({ role }).select('-password');
  return users;
};

/**
 * Search users by display name or email
 * @param {string} searchText - Search query
 * @param {number} limit - Result limit
 * @returns {array} Users array
 */
export const searchUsers = async (searchText, limit = 20) => {
  const users = await User.find({
    $or: [
      { displayName: { $regex: searchText, $options: 'i' } },
      { email: { $regex: searchText, $options: 'i' } },
    ],
  })
    .select('-password')
    .limit(limit);

  return users;
};
