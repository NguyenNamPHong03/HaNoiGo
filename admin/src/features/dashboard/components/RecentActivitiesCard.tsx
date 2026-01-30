import React from 'react';
import type { RecentActivity } from '../types/dashboard.types';

interface RecentActivitiesCardProps {
  activities: RecentActivity[];
  isLoading?: boolean;
}

const RecentActivitiesCard: React.FC<RecentActivitiesCardProps> = ({ 
  activities, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Activities
          </h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center animate-pulse">
                <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                <div className="ml-3 h-4 bg-gray-200 rounded w-48"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-400';
      case 'warning':
        return 'bg-yellow-400';
      case 'error':
        return 'bg-red-400';
      default:
        return 'bg-blue-400';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Recent Activities
        </h3>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-sm text-gray-500">No recent activities</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-center">
                <div className={`flex-shrink-0 w-2 h-2 ${getStatusColor(activity.status)} rounded-full`}></div>
                <p className="ml-3 text-sm text-gray-600">{activity.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentActivitiesCard;
