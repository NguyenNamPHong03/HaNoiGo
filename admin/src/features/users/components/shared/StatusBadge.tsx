import React from 'react';
import type { User } from '../../types/user.types';

interface StatusBadgeProps {
  user: User;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ user }) => {
  if (user.status === "deleted") {
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800">Deleted</span>;
  }
  if (user.isBanned || user.status === "banned") {
    return <span className="px-2 py-1 text-xs rounded-full bg-red-200 text-red-800">Banned</span>;
  }
  if (user.isActive || user.status === "active") {
    return <span className="px-2 py-1 text-xs rounded-full bg-green-200 text-green-800">Active</span>;
  }
  return <span className="px-2 py-1 text-xs rounded-full bg-yellow-200 text-yellow-800">Inactive</span>;
};

export default StatusBadge;
