---
trigger: always_on
---

# 4. Xử lý Lỗi (Error Handling)

## 🛡️ React Error Boundaries

**Setup toàn cục:**

```javascript
// components/common/ErrorBoundary.jsx
import React from 'react';
import ErrorFallback from './ErrorFallback';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Optional: Send to monitoring (Sentry)
    // Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

**Usage trong App.jsx:**

```javascript
<ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryClientProvider>
</ErrorBoundary>
```

---

## 🔧 Axios Interceptor (Centralized Error Handling)

**Setup trong `services/api.js`:**

```javascript
import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Request interceptor: Attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized: Clear token & redirect
          toast.error('Phiên đăng nhập hết hạn');
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
          
        case 404:
          toast.error(data.message || 'Không tìm thấy dữ liệu');
          break;
          
        case 500:
          toast.error('Lỗi server, vui lòng thử lại sau');
          break;
          
        default:
          toast.error(data.message || 'Đã xảy ra lỗi');
      }
    } else if (error.request) {
      // No response from server
      toast.error('Không thể kết nối đến server');
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

---

## 📡 React Query Error Handling

**Global error handler:**

```javascript
// lib/reactQuery.js
import { QueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2, // Retry 2 lần khi fail
      staleTime: 5 * 60 * 1000, // 5 phút
      refetchOnWindowFocus: false,
      onError: (error) => {
        const message = error.response?.data?.message || 'Lỗi tải dữ liệu';
        toast.error(message);
      },
    },
    mutations: {
      onError: (error) => {
        const message = error.response?.data?.message || 'Thao tác thất bại';
        toast.error(message);
      },
    },
  },
});
```

**Per-hook error handling:**

```javascript
// hooks/usePlaces.js
export const usePlaces = (filters) => {
  return useQuery({
    queryKey: ['places', 'list', filters],
    queryFn: () => placeService.getPlaces(filters),
    onError: (error) => {
      // Custom error handling cho hook này
      if (error.response?.status === 404) {
        toast.info('Không tìm thấy địa điểm phù hợp');
      }
    },
  });
};
```

**UI Error States:**

```javascript
const PlacesPage = () => {
  const { data, isLoading, isError, error } = usePlaces(filters);

  if (isLoading) return <PlaceSkeleton />;
  
  if (isError) {
    return (
      <ErrorState 
        message="Không thể tải danh sách địa điểm"
        onRetry={() => refetch()}
      />
    );
  }

  return <PlaceList places={data} />;
};
```

---

## ✅ Error Handling Best Practices

| Rule | Description |
| :-- | :-- |
| **Centralized Handling** | Xử lý error chung trong Axios interceptor + React Query config |
| **User-Friendly Messages** | Hiển thị message tiếng Việt, không leak technical details |
| **Retry Logic** | Tự động retry 2 lần cho network errors |
| **Fallback UI** | Luôn có UI fallback (ErrorBoundary, ErrorState component) |
| **Logging** | Log errors sang console (dev) và monitoring service (prod) |
| **Toast Notifications** | Dùng toast cho mọi error để user aware |
