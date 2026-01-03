import React from 'react';
import type { User } from '../../types/user.types';
import { formatDate } from '../../utils/formatters';
import RoleBadge from '../shared/RoleBadge';
import StatusBadge from '../shared/StatusBadge';

interface UsersTableProps {
  users: User[];
  onBan: (user: User) => void;
  onUnban: (userId: string) => void;
  onDelete: (user: User) => void;
  onRestore: (userId: string) => void;
}

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  onBan,
  onUnban,
  onDelete,
  onRestore
}) => {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.displayName} className="h-10 w-10 object-cover" />
                    ) : (
                      <span className="text-indigo-600 font-medium">
                        {user.displayName?.charAt(0)?.toUpperCase() ?? "U"}
                      </span>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <RoleBadge role={user.role} />
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge user={user} />
                {user.banReason && <div className="text-xs text-gray-500 mt-1">Reason: {user.banReason}</div>}
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.createdAt)}</td>

              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex gap-2 items-center">
                  {user.status !== "deleted" && user.role !== "admin" && (
                    <>
                      {!user.isBanned ? (
                        <button
                          onClick={() => onBan(user)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Ban
                        </button>
                      ) : (
                        <button
                          onClick={() => onUnban(user._id)}
                          className="text-green-600 hover:text-green-900 text-sm"
                        >
                          Unban
                        </button>
                      )}

                      <button
                        onClick={() => onDelete(user)}
                        className="text-gray-600 hover:text-gray-900 text-sm"
                      >
                        Delete
                      </button>
                    </>
                  )}

                  {user.status === "deleted" && (
                    <button
                      onClick={() => onRestore(user._id)}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}

          {!users.length && (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTable;
