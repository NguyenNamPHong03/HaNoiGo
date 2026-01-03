# Users Feature

Quản lý người dùng với ban/unban, delete/restore functionality.

## 📁 Cấu trúc

```
users/
├── api/
│   └── users.api.ts          # API layer wrapper (getAll, update, ban, delete)
├── components/
│   ├── list/
│   │   ├── UsersFilters.tsx  # Search + role/status filters
│   │   ├── UsersTable.tsx    # User table với avatar, badges, actions
│   │   └── UsersPagination.tsx # Pagination controls
│   ├── modals/
│   │   ├── BanModal.tsx      # Modal ban user với reason textarea
│   │   └── DeleteModal.tsx   # Confirmation modal cho soft delete
│   └── shared/
│       ├── StatusBadge.tsx   # Badge: Active/Banned/Deleted/Inactive
│       └── RoleBadge.tsx     # Badge: Admin/User
├── hooks/
│   └── useDebouncedValue.ts  # Generic debounce hook (450ms default)
├── pages/
│   └── UsersListPage.tsx     # Main orchestrator page
├── types/
│   └── user.types.ts         # User, UserFilters, BanUserData interfaces
├── utils/
│   └── formatters.ts         # formatDate, formatDateTime helpers
└── index.ts                   # Public exports
```

## 🎯 Usage trong Pages

```tsx
// pages/Users.tsx
import { UsersListPage } from '../features/users';

const Users: React.FC = () => {
  return <UsersListPage />;
};

export default Users;
```

## 🔧 Components

### UsersListPage
**Orchestrator** - Quản lý state, API calls, và modal logic.

**State management:**
- `users[]` - danh sách users
- `loading`, `error` - UI states
- `currentPage`, `totalPages` - pagination
- `searchTerm`, `roleFilter`, `statusFilter` - filters
- `showBanModal`, `showDeleteModal` - modal visibility
- `selectedUser` - user đang thao tác

**API Operations:**
- `fetchUsers()` - GET users với filters + pagination
- `handleUpdateUser()` - PATCH user (unban, restore)
- `handleBanUser()` - POST ban user với reason
- `handleDeleteUser()` - DELETE user (soft delete)

**Performance:**
- `useDebouncedValue(searchTerm, 450)` - debounce search input
- `useMemo(params)` - cache query params
- `useRef(requestIdRef)` - cancel racing requests

### UsersFilters
**Presentational** - Search input + role/status dropdowns.

```tsx
<UsersFilters
  searchTerm={searchTerm}
  onSearchChange={setSearchTerm}
  roleFilter={roleFilter}
  onRoleFilterChange={setRoleFilter}
  statusFilter={statusFilter}
  onStatusFilterChange={setStatusFilter}
  totalUsers={total}
/>
```

### UsersTable
**Presentational** - Table component với user info.

**Features:**
- Avatar display (fallback: first letter)
- Role badge (admin/user)
- Status badge (active/banned/deleted/inactive)
- Ban reason tooltip
- Conditional actions (ban/unban/delete/restore)

```tsx
<UsersTable
  users={users}
  onBanClick={openBanModal}
  onUnbanClick={handleUnban}
  onDeleteClick={openDeleteModal}
  onRestoreClick={handleRestore}
/>
```

### BanModal
**Controlled component** - Modal để ban user.

```tsx
<BanModal
  isOpen={showBanModal}
  user={selectedUser}
  banReason={banReason}
  onBanReasonChange={setBanReason}
  onConfirm={handleBanUser}
  onCancel={closeBanModal}
/>
```

### DeleteModal
**Controlled component** - Confirmation modal.

```tsx
<DeleteModal
  isOpen={showDeleteModal}
  user={selectedUser}
  onConfirm={handleDeleteUser}
  onCancel={closeDeleteModal}
/>
```

## 📊 API Layer

### usersApi.getAll(params)
**GET** `/api/admin/users`

**Request:**
```typescript
{
  page: number;        // Default: 1
  limit: number;       // Default: 10
  search?: string;     // Search displayName/email
  role?: 'user' | 'admin';
  status?: 'active' | 'banned' | 'deleted';
}
```

**Response:**
```typescript
{
  success: true;
  data: User[];        // Array of users
  total: number;       // Total count
  totalPages: number;  // Số trang
}
```

### usersApi.update(userId, data)
**PATCH** `/api/admin/users/:id`

**Data:**
```typescript
{
  status?: 'active' | 'banned' | 'deleted';
  isBanned?: boolean;
  isActive?: boolean;
  // Note: role CANNOT be changed via API
}
```

### usersApi.ban(userId, { reason })
**POST** `/api/admin/users/:id/ban`

**Data:**
```typescript
{
  reason?: string;  // Ban reason
}
```

### usersApi.delete(userId)
**DELETE** `/api/admin/users/:id`

Soft delete - set `status: 'deleted'`.

## 📝 Types

### User
```typescript
interface User {
  _id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  status: 'active' | 'banned' | 'deleted';
  isActive: boolean;
  isBanned: boolean;
  banReason?: string;
  deletedAt?: string;
  createdAt: string;
  lastLoginAt?: string;
  avatarUrl?: string;
}
```

### UserFilters
```typescript
interface UserFilters {
  searchTerm: string;
  roleFilter: 'all' | 'user' | 'admin';
  statusFilter: 'all' | 'active' | 'banned' | 'deleted';
}
```

## 🎨 UI Patterns

### Loading State
```tsx
if (loading) {
  return <LoadingSpinner />;
}
```

### Error State
```tsx
if (error) {
  return <ErrorMessage message={error} />;
}
```

### Empty State
```tsx
if (!users.length) {
  return <EmptyTableRow message="No users found." />;
}
```

## 🔄 User Actions Flow

### Ban User
1. User clicks "Ban" → `openBanModal(user)`
2. Modal shows → Enter ban reason (optional)
3. Confirm → `handleBanUser()` → API call
4. Success → Close modal + refetch users
5. UI updates với "Banned" badge

### Unban User
1. User clicks "Unban"
2. Direct API call: `handleUpdateUser(userId, { status: 'active', isBanned: false })`
3. Success → Refetch users
4. UI updates với "Active" badge

### Delete User
1. User clicks "Delete" → `openDeleteModal(user)`
2. Confirmation modal shows
3. Confirm → `handleDeleteUser()` → Soft delete
4. Success → Close modal + refetch
5. UI updates với "Deleted" badge

### Restore User
1. User clicks "Restore" on deleted user
2. Direct API call: `handleUpdateUser(userId, { status: 'active' })`
3. Success → Refetch users
4. UI updates với "Active" badge

## 🚨 Important Notes

1. **Role Restriction**: Admin users KHÔNG có ban/delete actions (frontend + backend enforced)
2. **Soft Delete**: Delete chỉ set `status: 'deleted'`, không xóa khỏi DB
3. **Debounced Search**: Search input debounce 450ms để tránh spam API
4. **Request Cancellation**: Dùng `requestIdRef` để cancel racing requests khi filters thay đổi nhanh
5. **Response Normalization**: `normalizeResponse()` xử lý inconsistent API responses

## 🧪 Testing Checklist

- [ ] Search by displayName
- [ ] Search by email
- [ ] Filter by role (user/admin)
- [ ] Filter by status (active/banned/deleted)
- [ ] Pagination works
- [ ] Ban user với reason
- [ ] Unban user
- [ ] Soft delete user
- [ ] Restore deleted user
- [ ] Loading states
- [ ] Error handling
- [ ] No actions for admin users

## 📦 Migration từ Old Structure

**Old:** `pages/Users.tsx` (513 lines monolithic file)
**New:** Feature-based structure với 11 files

**Để rollback:**
```bash
git checkout HEAD -- admin/src/pages/Users.tsx
```

Sau đó xóa folder `features/users/`.
