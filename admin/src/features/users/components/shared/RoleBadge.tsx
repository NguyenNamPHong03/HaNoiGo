import React from 'react';
import type { User } from '../../types/user.types';

interface RoleBadgeProps {
  role: User["role"];
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const colors: Record<User["role"], string> = {
    admin: "bg-purple-200 text-purple-800",
    user: "bg-gray-200 text-gray-800",
  };
  
  return <span className={`px-2 py-1 text-xs rounded-full ${colors[role]}`}>{role}</span>;
};

export default RoleBadge;
