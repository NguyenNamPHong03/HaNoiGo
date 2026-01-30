// Dashboard feature exports
export { dashboardApi } from './api/dashboard.api';
export { useDashboardStats, useRecentActivities, useSystemStatus } from './hooks/useDashboard';
export { default as DashboardPage } from './pages/DashboardPage';
export type { DashboardStats, RecentActivity, StatCard, SystemStatus } from './types/dashboard.types';

