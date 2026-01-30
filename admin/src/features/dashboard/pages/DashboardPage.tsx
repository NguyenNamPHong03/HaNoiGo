import React from 'react';
import RecentActivitiesCard from '../components/RecentActivitiesCard';
import StatCard from '../components/StatCard';
import SystemStatusCard from '../components/SystemStatusCard';
import { useDashboardStats, useRecentActivities, useSystemStatus } from '../hooks/useDashboard';
import type { StatCard as StatCardType } from '../types/dashboard.types';

const DashboardPage: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activities, isLoading: activitiesLoading } = useRecentActivities();
  const { data: systemStatus, isLoading: statusLoading } = useSystemStatus();

  // Transform stats to StatCard format
  const statCards: StatCardType[] = [
    {
      name: 'Total Places',
      value: stats?.totalPlaces?.toString() || '0',
      icon: '📍',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      growth: stats?.placesGrowth,
    },
    {
      name: 'Total Users',
      value: stats?.totalUsers?.toString() || '0',
      icon: '👥',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      growth: stats?.usersGrowth,
    },
    {
      name: 'Total Reviews',
      value: stats?.totalReviews?.toString() || '0',
      icon: '⭐',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      growth: stats?.reviewsGrowth,
    },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to HaNoiGo Admin Dashboard</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <StatCard key={stat.name} stat={stat} isLoading={statsLoading} />
        ))}
      </div>

      {/* Recent activities and System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentActivitiesCard 
          activities={activities || []} 
          isLoading={activitiesLoading} 
        />
        <SystemStatusCard 
          status={systemStatus || {
            frontend: 'running',
            backend: 'pending',
            aiService: 'pending',
            database: 'pending'
          }} 
          isLoading={statusLoading} 
        />
      </div>
    </div>
  );
};

export default DashboardPage;
