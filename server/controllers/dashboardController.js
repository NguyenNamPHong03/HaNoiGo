import Place from '../models/Place.js';
import Review from '../models/Review.js';
import User from '../models/User.js';

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/dashboard/stats
 * @access  Private/Admin
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Get total counts
    const [totalPlaces, totalUsers, totalReviews] = await Promise.all([
      Place.countDocuments(),
      User.countDocuments(),
      Review.countDocuments()
    ]);

    // Calculate growth percentages (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Recent 30 days counts
    const [placesRecent, usersRecent, reviewsRecent] = await Promise.all([
      Place.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Review.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
    ]);

    // Previous 30 days counts
    const [placesPrevious, usersPrevious, reviewsPrevious] = await Promise.all([
      Place.countDocuments({ 
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } 
      }),
      User.countDocuments({ 
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } 
      }),
      Review.countDocuments({ 
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } 
      })
    ]);

    // Calculate growth percentages
    const calculateGrowth = (recent, previous) => {
      if (previous === 0) return recent > 0 ? 100 : 0;
      return Math.round(((recent - previous) / previous) * 100);
    };

    const stats = {
      totalPlaces,
      totalUsers,
      totalReviews,
      placesGrowth: calculateGrowth(placesRecent, placesPrevious),
      usersGrowth: calculateGrowth(usersRecent, usersPrevious),
      reviewsGrowth: calculateGrowth(reviewsRecent, reviewsPrevious)
    };

    res.json(stats);
  } catch (error) {
    console.error('❌ Error getting dashboard stats:', error);
    res.status(500).json({ 
      message: 'Error fetching dashboard statistics',
      error: error.message 
    });
  }
};

/**
 * @desc    Get recent activities
 * @route   GET /api/admin/dashboard/activities
 * @access  Private/Admin
 */
export const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent places, users, and reviews
    const [recentPlaces, recentUsers, recentReviews] = await Promise.all([
      Place.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .select('name createdAt'),
      User.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .select('email createdAt'),
      Review.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .select('place createdAt')
        .populate('place', 'name')
    ]);

    // Transform to activity format
    const activities = [];

    recentPlaces.forEach(place => {
      activities.push({
        id: `place-${place._id}`,
        type: 'place',
        message: `New place added: ${place.name}`,
        timestamp: place.createdAt,
        status: 'success'
      });
    });

    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user._id}`,
        type: 'user',
        message: `New user registered: ${user.email}`,
        timestamp: user.createdAt,
        status: 'success'
      });
    });

    recentReviews.forEach(review => {
      const placeName = review.place?.name || 'Unknown place';
      activities.push({
        id: `review-${review._id}`,
        type: 'review',
        message: `New review for ${placeName}`,
        timestamp: review.createdAt,
        status: 'success'
      });
    });

    // Sort by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    // Add system activity if no activities
    if (sortedActivities.length === 0) {
      sortedActivities.push({
        id: 'system-init',
        type: 'system',
        message: 'System initialized',
        timestamp: new Date(),
        status: 'success'
      });
    }

    res.json(sortedActivities);
  } catch (error) {
    console.error('❌ Error getting recent activities:', error);
    res.status(500).json({ 
      message: 'Error fetching recent activities',
      error: error.message 
    });
  }
};

/**
 * @desc    Get system status
 * @route   GET /api/admin/dashboard/system-status
 * @access  Private/Admin
 */
export const getSystemStatus = async (req, res) => {
  try {
    // Check database connection
    let databaseStatus = 'running';
    try {
      await Place.findOne().limit(1);
    } catch (error) {
      databaseStatus = 'error';
    }

    // Check AI service (simple ping)
    let aiServiceStatus = 'pending';
    // TODO: Implement actual AI service health check
    // For now, just return pending

    const systemStatus = {
      frontend: 'running', // Frontend is running if this request is being made
      backend: 'running', // Backend is running if this endpoint responds
      aiService: aiServiceStatus,
      database: databaseStatus
    };

    res.json(systemStatus);
  } catch (error) {
    console.error('❌ Error getting system status:', error);
    res.status(500).json({ 
      message: 'Error fetching system status',
      error: error.message 
    });
  }
};
