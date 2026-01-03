import React, { useEffect, useMemo, useRef, useState } from "react";
import { usersApi } from '../api/users.api';
import UsersFilters from '../components/list/UsersFilters';
import UsersPagination from '../components/list/UsersPagination';
import UsersTable from '../components/list/UsersTable';
import BanModal from '../components/modals/BanModal';
import DeleteModal from '../components/modals/DeleteModal';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import type { User } from '../types/user.types';

const UsersListPage: React.FC = () => {
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
    const apiResponse = res;
    const list = apiResponse.data || [];
    const t = Number(apiResponse.total ?? 0);
    const tp = Number(apiResponse.totalPages ?? 1);
    return { data: Array.isArray(list) ? list : [], total: isNaN(t) ? 0 : t, totalPages: isNaN(tp) ? 1 : tp };
  };

  const fetchUsers = async () => {
    const reqId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError(null);

      const res = await usersApi.getAll(params);

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
    setSelectedUser(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const handleUpdateUser = async (userId: string, data: Partial<User>) => {
    try {
      const { role, ...allowedData } = data;
      
      await usersApi.update(userId, allowedData);
      await fetchUsers();
      alert("User updated successfully");
    } catch (err) {
      alert("Failed to update user");
      console.error("Error updating user:", err);
    }
  };

  const handleBanUser = async (reason: string) => {
    if (!selectedUser) return;

    try {
      await usersApi.ban(selectedUser._id, { reason });
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
      await usersApi.delete(selectedUser._id);
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

      <UsersFilters
        searchTerm={searchTerm}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        onSearchChange={setSearchTerm}
        onRoleChange={setRoleFilter}
        onStatusChange={setStatusFilter}
      />

      <UsersTable
        users={users}
        onBan={openBanModal}
        onUnban={(userId) => handleUpdateUser(userId, { status: "active", isBanned: false })}
        onDelete={openDeleteModal}
        onRestore={(userId) => handleUpdateUser(userId, { status: "active" })}
      />

      <UsersPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {showBanModal && selectedUser && (
        <BanModal
          user={selectedUser}
          onClose={closeBanModal}
          onConfirm={handleBanUser}
        />
      )}

      {showDeleteModal && selectedUser && (
        <DeleteModal
          user={selectedUser}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteUser}
        />
      )}
    </div>
  );
};

export default UsersListPage;
