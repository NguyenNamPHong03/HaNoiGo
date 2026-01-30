# Dashboard Feature Module

## 📊 Tổng quan

Dashboard feature module cung cấp giao diện tổng quan thống kê và trạng thái hệ thống cho Admin Panel.

## 🏗️ Cấu trúc

```
dashboard/
├── api/
│   └── dashboard.api.ts          # API calls
├── components/
│   ├── StatCard.tsx              # Card hiển thị thống kê
│   ├── RecentActivitiesCard.tsx  # Card hoạt động gần đây
│   └── SystemStatusCard.tsx      # Card trạng thái hệ thống
├── hooks/
│   └── useDashboard.ts           # React Query hooks
├── pages/
│   └── DashboardPage.tsx         # Main dashboard page
├── types/
│   └── dashboard.types.ts        # TypeScript types
├── index.ts                       # Public exports
└── README.md                      # This file
```

## 📡 API Endpoints

### GET `/api/admin/dashboard/stats`
Lấy thống kê tổng quan:
- Total places, users, reviews
- Growth percentages (30 days)

**Response:**
```json
{
  "totalPlaces": 150,
  "totalUsers": 1200,
  "totalReviews": 450,
  "placesGrowth": 12,
  "usersGrowth": 25,
  "reviewsGrowth": 8
}
```

### GET `/api/admin/dashboard/activities?limit=10`
Lấy hoạt động gần đây:
- New places added
- New users registered
- New reviews posted

**Response:**
```json
[
  {
    "id": "place-123",
    "type": "place",
    "message": "New place added: Highlands Coffee",
    "timestamp": "2026-01-28T10:30:00Z",
    "status": "success"
  }
]
```

### GET `/api/admin/dashboard/system-status`
Kiểm tra trạng thái hệ thống:
- Frontend, Backend, AI Service, Database

**Response:**
```json
{
  "frontend": "running",
  "backend": "running",
  "aiService": "pending",
  "database": "running"
}
```

## 🎯 Usage

### Import vào App
```typescript
import { DashboardPage } from './features/dashboard';

<Route index element={<DashboardPage />} />
```

### Sử dụng hooks
```typescript
import { useDashboardStats, useRecentActivities } from '@/features/dashboard';

const MyComponent = () => {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: activities } = useRecentActivities(5);
  
  return <div>{stats?.totalPlaces}</div>;
};
```

## 🔄 Data Flow

```
DashboardPage
    ↓
useDashboardStats() (React Query)
    ↓
dashboardApi.getStats()
    ↓
dashboardAPI.getStats() (services/api.ts)
    ↓
Backend: /api/admin/dashboard/stats
    ↓
dashboardController.getDashboardStats()
    ↓
MongoDB (Place, User, Review models)
```

## ⚡ Features

### 1. **Auto-refresh**
- Stats: Mỗi 30 giây
- Activities: Mỗi 1 phút
- System Status: Mỗi 10 giây

### 2. **Loading States**
- Skeleton loading cho tất cả components
- Smooth transitions

### 3. **Growth Indicators**
- Hiển thị % tăng/giảm (30 ngày)
- Green (+) / Red (-) indicators

### 4. **Responsive Design**
- Grid layout tự động điều chỉnh
- Mobile-friendly

## 🛠️ Development

### Thêm stat card mới
1. Update `DashboardStats` type trong `types/dashboard.types.ts`
2. Update backend controller `getDashboardStats()`
3. Thêm card vào `DashboardPage.tsx`

### Thêm activity type mới
1. Update `RecentActivity` type
2. Update `getRecentActivities()` controller
3. UI tự động hiển thị

## 📊 Performance

- **Caching**: React Query cache 20s-30s
- **Parallel Queries**: Stats, Activities, Status load đồng thời
- **Lazy Components**: Không có, dashboard cần load ngay

## 🎨 Styling

- TailwindCSS utilities
- Consistent với các features khác
- Icons: Emoji (📍 👥 ⭐)
- Colors: Blue (places), Green (users), Purple (reviews)

## 🧪 Testing

```bash
# Backend endpoints
curl http://localhost:5000/api/admin/dashboard/stats
curl http://localhost:5000/api/admin/dashboard/activities?limit=5
curl http://localhost:5000/api/admin/dashboard/system-status
```

## 🚀 Future Enhancements

- [ ] Charts (line/bar) cho growth trends
- [ ] Real-time updates với WebSocket
- [ ] Customizable dashboard layout
- [ ] Export statistics to PDF/Excel
- [ ] Date range filters
- [ ] AI query metrics (nếu cần khôi phục)
