import React, { useEffect, useMemo, useRef, useState } from "react";
import { userAPI } from "../services/api";

interface User {
  _id: string;
  email: string;
  displayName: string;
  role: "user" | "admin";
  status: "active" | "banned" | "deleted";
  isActive: boolean;
  isBanned: boolean;
  banReason?: string;
  deletedAt?: string;
  createdAt: string;
  lastLoginAt?: string;
  avatarUrl?: string;
}

type UsersResponse = {
  data?: User[];
  users?: User[];
  items?: User[];
  total?: number;
  totalPages?: number;
  page?: number;
  limit?: number;
};

function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | User["role"]>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | User["status"]>("all");

  const [showBanModal, setShowBanModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");

  const debouncedSearch = useDebouncedValue(searchTerm, 450);
  const requestIdRef = useRef(0);

  const params = useMemo(() => {
    const p: Record<string, any> = {
      page: currentPage,
      limit: 10,
    };

    const trimmed = debouncedSearch.trim();
    if (trimmed) p.search = trimmed;
    if (roleFilter !== "all") p.role = roleFilter;
    if (statusFilter !== "all") p.status = statusFilter;

    return p;
  }, [currentPage, debouncedSearch, roleFilter, statusFilter]);

  const normalizeResponse = (res: any): { data: User[]; total: number; totalPages: number } => {
    // userAPI.getAll returns response.data directly = { success: true, data: Array, total: number }
    const apiResponse = res; // res is already the API response body
    const list = apiResponse.data || []; // users array
    const t = Number(apiResponse.total ?? 0);
    const tp = Number(apiResponse.totalPages ?? 1);
    return { data: Array.isArray(list) ? list : [], total: isNaN(t) ? 0 : t, totalPages: isNaN(tp) ? 1 : tp };
  };

  const fetchUsers = async () => {
    const reqId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError(null);

      const res = await userAPI.getAll(params);

      if (reqId !== requestIdRef.current) return;

      const normalized = normalizeResponse(res);
      setUsers(normalized.data);
      setTotal(normalized.total);
      setTotalPages(normalized.totalPages);
    } catch (err: any) {
      if (reqId !== requestIdRef.current) return;

      setError("Failed to fetch users");
      console.error("Error fetching users:", err);
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const closeBanModal = () => {
    setShowBanModal(false);
    setBanReason("");
    setSelectedUser(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const handleUpdateUser = async (userId: string, data: Partial<User>) => {
    try {
      // Remove role from update data - role can only be changed in MongoDB directly
      const { role, ...allowedData } = data;
      
      await userAPI.update(userId, allowedData);
      await fetchUsers();
      alert("User updated successfully");
    } catch (err) {
      alert("Failed to update user");
      console.error("Error updating user:", err);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;

    try {
      await userAPI.ban(selectedUser._id, { reason: banReason });
      closeBanModal();
      await fetchUsers();
      alert("User banned successfully");
    } catch (err) {
      alert("Failed to ban user");
      console.error("Error banning user:", err);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await userAPI.delete(selectedUser._id);
      closeDeleteModal();
      await fetchUsers();
      alert("User deleted successfully");
    } catch (err) {
      alert("Failed to delete user");
      console.error("Error deleting user:", err);
    }
  };

  const openBanModal = (user: User) => {
    setSelectedUser(user);
    setShowBanModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("vi-VN");

  const getStatusBadge = (user: User) => {
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

  const getRoleBadge = (role: User["role"]) => {
    const colors: Record<User["role"], string> = {
      admin: "bg-purple-200 text-purple-800",
      user: "bg-gray-200 text-gray-800",
    };
    return <span className={`px-2 py-1 text-xs rounded-full ${colors[role]}`}>{role}</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
        <div className="text-sm text-gray-600">Total: {total} users</div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
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
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      </div>

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

                <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>

                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(user)}
                  {user.banReason && <div className="text-xs text-gray-500 mt-1">Reason: {user.banReason}</div>}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.createdAt)}</td>

                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2 items-center">
                    {user.status !== "deleted" && user.role !== "admin" && (
                      <>
                        {!user.isBanned ? (
                          <button
                            onClick={() => openBanModal(user)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Ban
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateUser(user._id, { status: "active", isBanned: false })}
                            className="text-green-600 hover:text-green-900 text-sm"
                          >
                            Unban
                          </button>
                        )}

                        <button
                          onClick={() => openDeleteModal(user)}
                          className="text-gray-600 hover:text-gray-900 text-sm"
                        >
                          Delete
                        </button>
                      </>
                    )}

                    {user.status === "deleted" && (
                      <button
                        onClick={() => handleUpdateUser(user._id, { status: "active" })}
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

        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>

            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{" "}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>

              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    ←
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    →
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ban User: {selectedUser.displayName}</h3>

              <div className="mb-4">
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Reason for banning (optional)"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                />
              </div>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={closeBanModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanUser}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Ban User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-4">Delete User</h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete <strong>{selectedUser.displayName}</strong>? This action will soft
                delete the user and can be undone.
              </p>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
