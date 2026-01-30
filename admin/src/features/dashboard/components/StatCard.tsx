import React from 'react';
import type { StatCard as StatCardType } from '../types/dashboard.types';

interface StatCardProps {
  stat: StatCardType;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ stat, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-gray-200"></div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center text-2xl`}>
              {stat.icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {stat.name}
              </dt>
              <dd className="flex items-baseline">
                <div className={`text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                {stat.growth !== undefined && (
                  <span
                    className={`ml-2 text-sm font-medium ${
                      stat.growth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.growth >= 0 ? '+' : ''}
                    {stat.growth}%
                  </span>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
