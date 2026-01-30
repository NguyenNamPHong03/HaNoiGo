// Dashboard types
export interface DashboardStats {
  totalPlaces: number;
  totalUsers: number;
  totalReviews: number;
  placesGrowth?: number; // % change from last period
  usersGrowth?: number;
  reviewsGrowth?: number;
}

export interface RecentActivity {
  id: string;
  type: 'place' | 'user' | 'review' | 'system';
  message: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'error';
}

export interface SystemStatus {
  frontend: 'running' | 'pending' | 'error';
  backend: 'running' | 'pending' | 'error';
  aiService: 'running' | 'pending' | 'error';
  database: 'running' | 'pending' | 'error';
}

export interface StatCard {
  name: string;
  value: string;
  icon: string;
  color: string;
  bgColor: string;
  growth?: number;
}
