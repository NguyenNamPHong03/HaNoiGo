---
trigger: always_on
---

# 7. Code Splitting & Lazy Loading

## 📦 Route-based Code Splitting

```javascript
// App.jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoadingSpinner from './components/common/LoadingSpinner';

// ✅ Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
const PlacesPage = lazy(() => import('./pages/PlacesPage'));
const PlaceDetailPage = lazy(() => import('./pages/PlaceDetailPage'));
const ChatbotPage = lazy(() => import('./pages/ChatbotPage'));
const AdminDashboard = lazy(() => import('./features/admin/pages/AdminDashboard'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/places" element={<PlacesPage />} />
          <Route path="/places/:id" element={<PlaceDetailPage />} />
          <Route path="/chat" element={<ChatbotPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

---

## 🎯 Component-based Lazy Loading

```javascript
// Heavy components như Map, Chart
const PlaceMap = lazy(() => import('./components/PlaceMap'));

const PlaceDetailPage = () => {
  return (
    <div>
      <PlaceInfo />
      <Suspense fallback={<MapSkeleton />}>
        <PlaceMap places={nearbyPlaces} />
      </Suspense>
    </div>
  );
};
```

---

## 💡 Best Practices

1. **Lazy load tất cả route components** - Tách mỗi page thành chunk riêng
2. **Lazy load heavy components** - Map, Chart, ImageGallery, Video players
3. **Chuẩn bị Suspense fallback phù hợp** - Skeleton loading hoặc Spinner
4. **Đặt tên chunk để debug dễ hơn:**

```javascript
const ChatbotPage = lazy(() => 
  import(/* webpackChunkName: "chatbot" */ './pages/ChatbotPage')
);
```

5. **Preload critical routes:**

```javascript
// Preload khi hover vào link
const handleMouseEnter = () => {
  import('./pages/PlaceDetailPage');
};
```
