// Dashboard API - Fetch statistics and metrics
import { dashboardAPI } from '../../../services/api';

export const dashboardApi = {
  // Get all dashboard stats
  getStats: async () => {
    return dashboardAPI.getStats();
  },

  // Get recent activities
  getRecentActivities: async (limit: number = 10) => {
    return dashboardAPI.getActivities(limit);
  },

  // Get system status
  getSystemStatus: async () => {
    return dashboardAPI.getSystemStatus();
  }
};
