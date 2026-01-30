import React from 'react';
import type { SystemStatus } from '../types/dashboard.types';

interface SystemStatusCardProps {
  status: SystemStatus;
  isLoading?: boolean;
}

const SystemStatusCard: React.FC<SystemStatusCardProps> = ({ status, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            System Status
          </h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: 'running' | 'pending' | 'error') => {
    const styles = {
      running: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
    };

    const labels = {
      running: 'Running',
      pending: 'Pending',
      error: 'Error',
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium ${styles[status]} rounded-full`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          System Status
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Frontend</span>
            {getStatusBadge(status.frontend)}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Backend API</span>
            {getStatusBadge(status.backend)}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">AI Service</span>
            {getStatusBadge(status.aiService)}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Database</span>
            {getStatusBadge(status.database)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusCard;
