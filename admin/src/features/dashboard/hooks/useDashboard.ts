// Dashboard hooks
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';

// Fetch dashboard stats
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 20000, // Consider fresh for 20 seconds
  });
};

// Fetch recent activities
export const useRecentActivities = (limit: number = 10) => {
  return useQuery({
    queryKey: ['dashboard', 'activities', limit],
    queryFn: () => dashboardApi.getRecentActivities(limit),
    refetchInterval: 60000, // Refetch every 1 minute
  });
};

// Fetch system status
export const useSystemStatus = () => {
  return useQuery({
    queryKey: ['dashboard', 'system-status'],
    queryFn: dashboardApi.getSystemStatus,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
};
