import React from 'react';
import type { User } from '../../types/user.types';

interface UsersFiltersProps {
  searchTerm: string;
  roleFilter: "all" | User["role"];
  statusFilter: "all" | User["status"];
  onSearchChange: (value: string) => void;
  onRoleChange: (value: "all" | User["role"]) => void;
  onStatusChange: (value: "all" | User["status"]) => void;
}

const UsersFilters: React.FC<UsersFiltersProps> = ({
  searchTerm,
  roleFilter,
  statusFilter,
  onSearchChange,
  onRoleChange,
  onStatusChange
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <select
          value={roleFilter}
          onChange={(e) => onRoleChange(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      <div>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>
    </div>
  );
};

export default UsersFilters;
