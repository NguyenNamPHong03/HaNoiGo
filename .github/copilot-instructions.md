## 📋 MÔ TẢ BÀI TOÁN HANOIGO

### **Bài toán**

Người dùng trẻ tại Hà Nội gặp khó khăn khi tìm địa điểm ăn uống, vui chơi phù hợp vì các nền tảng hiện tại chỉ có bộ lọc tĩnh, không hiểu ngữ cảnh cá nhân như tâm trạng, mục đích hay ngân sách. Việc tìm kiếm mất thời gian và gợi ý thường không đúng gu.

### **Giải pháp**

HANOIGO là nền tảng web tích hợp AI Chatbot thông minh sử dụng công nghệ RAG (Retrieval-Augmented Generation) để người dùng có thể tìm kiếm địa điểm bằng ngôn ngữ tự nhiên, nhận gợi ý cá nhân hóa dựa trên sở thích và ngữ cảnh, đồng thời hệ thống liên tục học hỏi từ phản hồi người dùng.

## 🛠️ CÔNG NGHỆ SỬ DỤNG     

### **Nền tảng chính**

- **MERN Stack**: MongoDB, Express.js, React, Node.js
- **AI Engine**: OpenAI API kết hợp RAG Architecture
- **Database**: MongoDB, Pinecone
- **Cloud Storage**: Cloudinary lưu trữ hình ảnh
- **Bảo mật**: JWT Authentication


### **Kiến trúc AI**

Hệ thống sử dụng RAG để kết hợp semantic search từ database với khả năng sinh ngôn ngữ tự nhiên của LLM, tạo câu trả lời chính xác và có ngữ cảnh.

## 📊 CẤU TRÚC DỮ LIỆU

### **Collection users**

Lưu thông tin tài khoản người dùng bao gồm email, mật khẩu đã mã hóa, ảnh đại diện từ Cloudinary. Đặc biệt quan trọng là phần preferences lưu sở thích về món ăn yêu thích, phong cách không gian và chế độ ăn uống để hệ thống cá nhân hóa gợi ý.

### **Collection admins**

Quản lý tài khoản quản trị viên với phân quyền chi tiết. Admin có thể quản lý địa điểm, gắn semantic tags, và cấu hình/huấn luyện AI mà không cần code thông qua giao diện web.

### **Collection places (RAG Knowledge Base)**

Đây là "bộ não" của hệ thống, lưu thông tin chi tiết địa điểm gồm tên, địa chỉ, quận/huyện, danh mục, mô tả, khoảng giá, hình ảnh và menu. Điểm đặc biệt là aiTags - bộ semantic tags gồm:

- **space**: mô tả không gian vật lý (ấm cúng, ngoài trời, rộng rãi)
- **mood**: cảm xúc/không khí (lãng mạn, chill, sôi động)
- **suitability**: mục đích sử dụng (hẹn hò, học bài, tụ tập nhóm)


### **Collection reviews (Feedback Loop)**

Lưu đánh giá của người dùng gồm rating 1-5 sao, bình luận, ảnh review và các tags mô tả trải nghiệm. Dữ liệu này được sử dụng để cải thiện độ chính xác của AI qua thời gian.

## 🔄 LUỒNG HOẠT ĐỘNG

### **Tìm kiếm truyền thống**

Người dùng dùng bộ lọc thông thường theo danh mục, quận, khoảng giá để xem danh sách địa điểm.

### **AI Chatbot (RAG)**

1. Người dùng nhập câu hỏi tự nhiên tiếng Việt như "Tìm quán cafe yên tĩnh để học bài, giá dưới 100k"
2. Hệ thống phân tích và trích xuất semantic intent: suitability=học bài, mood=yên tĩnh, priceRange=dưới 100k
3. RAG retrieval tìm kiếm trong MongoDB dựa trên semantic tags và preferences của user
4. Kết quả được kết hợp với ngữ cảnh và gửi đến OpenAI API
5. AI sinh câu trả lời tự nhiên kèm danh sách địa điểm phù hợp nhất

### **Feedback Loop**

Sau mỗi gợi ý, người dùng có thể đánh giá mức độ hữu ích. Dữ liệu này được thu thập vào reviews collection để tinh chỉnh thuật toán gợi ý, giúp hệ thống ngày càng thông minh hơn.

## ✨ ĐIỂM NỔI BẬT

**Hybrid Search**: Kết hợp tìm kiếm theo từ khóa cứng (tên địa điểm, địa chỉ) và semantic search (tâm trạng, ngữ cảnh sử dụng) để cho kết quả toàn diện.

**Cá nhân hóa thông minh**: Hệ thống ưu tiên gợi ý địa điểm phù hợp với sở thích cá nhân từ preferences, không chỉ dựa vào query hiện tại.

**Admin-friendly AI Control**: Quản trị viên có thể làm giàu dữ liệu bằng cách gắn semantic tags và điều chỉnh prompt AI qua giao diện web, không cần kiến thức lập trình.

**Học liên tục**: Mỗi review và phản hồi từ người dùng đều giúp cải thiện độ chính xác của gợi ý trong tương lai, tạo vòng lặp cải tiến không ngừng.


# 📁 CẤU TRÚC FRONTEND - HANOIGO

## 🎯 Tổng quan

Frontend được xây dựng bằng **React** với kiến trúc modular, phân tách rõ ràng giữa UI, business logic, và data management. Sử dụng **React Query** cho server state và **Context API** cho authentication state.

***

## 📂 Cấu trúc mẫu cho Thư mục Chính

```
client/
├── public/                      # Static assets (favicon, manifest)
├── src/
│   ├── assets/                  # Images, icons, fonts
│   ├── components/              # Reusable UI components
│   │   ├── common/             # Shared components (Button, Input, Modal)
│   │   ├── layout/             # Layout components (Navbar, Footer, Sidebar)
│   │   
│   │
│   │
│   │
│   ├── hooks/                  # Global custom hooks
│   │   ├── useCart.js         # Wishlist management
│   │   ├── useCategories.js   # Category data
│   │   ├── useHeaderHeight.js # UI utilities
│   │   └── useScrollLock.js   # Scroll control
│   │
│   ├── contexts/               # React Context providers
│   │   └── AuthContext.js     # Authentication state
│   │
│   ├── services/               # API service layer (Axios)
│   │   ├── api.js             # Axios config + interceptors
│   │   ├── authService.js     # Auth APIs
│   │   ├── placeService.js    # Place CRUD APIs
│   │   ├── chatService.js     # AI Chatbot APIs
│   │   ├── reviewService.js   # Review APIs
│   │   ├── categoryService.js # Category APIs
│   │   └── adminService.js    # Admin APIs
│   │
│   ├── pages/                  # Top-level page components
│   │   ├── /HomePage
│   │   ├── /ExplorePage
│   │   └── /ProfilePage
│   │
│   │
│   │
│   ├── lib/                    # External library configs
│   │   └── reactQuery.js      # React Query setup
│   │
│   ├── utils/                  # Helper functions
│   │   ├── validators.js      # Form validation
│   │   ├── formatters.js      # Data formatting
│   │   └── constants.js       # App constants
│   │
│   │
│   │
│   ├── config/                 # App configuration
│   │   └── env.js             # Environment variables
│   │
│   ├── App.js                  # Root component
│   ├── index.js                # Entry point
│   └── routes.js               # Route definitions
│   └── global.css              # Global styles
│
├── package.json
├── vite.config.js              # Vite configuration
└── tailwind.config.js          # Tailwind CSS config
```


***


### **services/** - API Layer

Axios instance cấu hình sẵn với interceptors để tự động:

- Gắn JWT token vào mọi request
- Xử lý refresh token
- Global error handling


### **hooks/** - React Query Custom Hooks

Quản lý server state với caching, optimistic updates, auto-refetch.

### **contexts/** - Authentication Context

Quản lý user session, login state, và user preferences.

***

## 🎨 Component Organization

### **Phân loại Components**

- **common/**: Reusable UI primitives (Button, Input, Select)
- **layout/**: Layout wrappers (Navbar, Footer, Sidebar)

***

## 📊 Data Flow

**User Action** → **Feature Hook** (React Query) → **Service Function** (Axios) → **Backend API** → **Response** → **Cache \& Update UI**

***

## ⚡ Performance

- **Code Splitting**: Lazy load pages với `React.lazy()`
- **React Query**: Smart caching và prefetching

***


## 💡 Best Practices

✅ Feature-based organization cho scalability
✅ Separation of concerns: UI ↔ Logic ↔ Data
✅ Reusable custom hooks với React Query
✅ Context API chỉ cho global state (auth, theme)
✅ Axios interceptors cho token management
# 🎯 Hướng dẫn \& Nguyên tắc Phát triển CLIENT - HANOIGO

Tài liệu này định nghĩa các tiêu chuẩn, nguyên tắc và hướng dẫn tối ưu hóa để đảm bảo Frontend **HANOIGO** đạt hiệu suất cao, code chất lượng và trải nghiệm người dùng xuất sắc.

***

## 1. Tầm nhìn \& Quy mô (Scope)

**HANOIGO Client** là giao diện người dùng cho nền tảng khám phá địa điểm tại Hà Nội, tích hợp AI Chatbot (RAG) và tìm kiếm semantic.

- **Tech Stack**: React 18 + Vite + React Query + Axios
- **Architecture**: Feature-based modular structure
- **Target**: Sub-3s load time

***

## 2. Nguyên tắc Cốt lõi (Core Principles)

### 🚀 Performance First (Tối ưu Hiệu năng)

- **Lazy Loading**: Luôn áp dụng `React.lazy` và `Suspense` cho Route components và heavy components (ChatWindow, MapView, ImageGallery)
- **Image Optimization**:
    - Format **WebP** cho tất cả ảnh tĩnh
    - Cloudinary images luôn dùng `f_auto,q_auto,w_800` (responsive width)
    - Lazy load images với Intersection Observer
- **Minimize Re-renders**:
    - Sử dụng `useMemo` cho tính toán phức tạp (filter arrays > 50 items)
    - `useCallback` cho functions pass xuống child components
    - `React.memo` cho list items (PlaceCard, ReviewCard)
    - Tránh inline objects/arrays trong props[^1][^2][^3]
- **Bundle Size**:
    - Initial bundle < 200KB (gzipped)
    - Tree-shake unused code
    - Dynamic imports cho features ít dùng


### 🎨 Visual \& UX Excellence

- **Loading States**:
    - **KHÔNG BAO GIỜ** để màn hình trắng
    - Skeleton loading cho data fetching (places list, chat history)
    - Spinner component cho mutations (submit review, send message)
- **Feedback**:
    - Toast notification cho mọi user action:
        - ✅ "Đã thêm vào yêu thích"
        - ❌ "Không thể gửi tin nhắn, vui lòng thử lại"
    - Visual feedback cho interactions (button press, card hover)
- **Micro-interactions**:
    - Smooth transitions (0.3s ease-in-out)
    - Hover effects trên PlaceCard (scale: 1.02, shadow lift)
    - Loading animations cho chatbot typing indicator[^4][^5]
- **Accessibility**:
    - ARIA labels cho interactive elements
    - Keyboard navigation (Tab, Enter, Esc)
    - Focus indicators rõ ràng


### 🛠 Clean Code \& Maintainability

- **DRY (Don't Repeat Yourself)**:
    - Tách logic lặp lại thành Custom Hooks (`usePlaces`, `useChat`)
    - Shared UI components trong `components/common/`
- **Modular Architecture**:
    - Feature-based structure: mỗi feature tự quản lý components, hooks, pages
    - Single Responsibility: 1 component chỉ làm 1 việc
- **Consistency**: Tuân thủ naming conventions[^6][^7]

***

## 3. Quy chuẩn Đặt tên (Naming Conventions)

### ⚛️ React Components \& Files

| Element | Convention | Example |
| :-- | :-- | :-- |
| **Components** | PascalCase | `PlaceCard`, `ChatWindow`, `SearchBar` |
| **Component files** | PascalCase + `.jsx` | `PlaceCard.jsx`, `ReviewForm.jsx` |
| **Pages** | PascalCase + `Page` | `HomePage.jsx`, `PlaceDetailPage.jsx` |
| **Layouts** | PascalCase + `Layout` | `MainLayout.jsx`, `AdminLayout.jsx` |

### 🪝 Hooks \& Services

| Element | Convention | Example |
| :-- | :-- | :-- |
| **Custom Hooks** | `use` + PascalCase | `usePlaces.js`, `useChat.js`, `useAuth.js` |
| **Services** | camelCase + `Service` | `placeService.js`, `chatService.js` |
| **API client** | camelCase | `api.js`, `axiosClient.js` |

### 📦 Utils \& Constants

| Element | Convention | Example |
| :-- | :-- | :-- |
| **Utilities** | camelCase | `formatPrice.js`, `debounce.js`, `validateEmail.js` |
| **Constants** | SCREAMING_SNAKE_CASE | `API_BASE_URL`, `MAX_PRICE_RANGE`, `DISTRICTS` |
| **Context** | PascalCase + `Context` | `AuthContext.js`, `ThemeContext.js` |

### 🎨 Styling

| Element | Convention | Example |
| :-- | :-- | :-- |
| **CSS Modules** | PascalCase + `.module.css` | `PlaceCard.module.css` |
| **Tailwind classes** | Alphabetical order | `className="flex items-center gap-4 rounded-lg bg-white p-4"` |

### 🔤 Variables \& Functions

| Element | Convention | Example |
| :-- | :-- | :-- |
| **State variables** | camelCase | `selectedPlace`, `chatHistory`, `isModalOpen` |
| **Boolean variables** | `is`, `has`, `should` prefix | `isLoading`, `hasError`, `shouldRefetch` |
| **Props** | camelCase | `placeData`, `onSubmit`, `isDisabled` |
| **Event handlers** | `handle` + Action | `handleSubmit`, `handlePlaceSelect`, `handleChatSend` |
| **Functions** | Verb + Noun | `fetchPlaces`, `formatCurrency`, `validateInput` |

**Examples:**

```javascript
// ✅ GOOD
const [selectedPlace, setSelectedPlace] = useState(null);
const [isLoading, setIsLoading] = useState(false);
const handlePlaceClick = useCallback((placeId) => { ... }, []);

// ❌ BAD
const [place, setPlace] = useState(null); // Không rõ nghĩa
const [loading, setLoading] = useState(false); // Thiếu 'is'
const clickPlace = (placeId) => { ... }; // Thiếu 'handle'
```


***

## 4. Xử lý Lỗi (Error Handling)

### 🛡️ React Error Boundaries

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


### 🔧 Axios Interceptor (Centralized Error Handling)

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


### 📡 React Query Error Handling

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


### ✅ Error Handling Best Practices

| Rule | Description |
| :-- | :-- |
| **Centralized Handling** | Xử lý error chung trong Axios interceptor + React Query config |
| **User-Friendly Messages** | Hiển thị message tiếng Việt, không leak technical details |
| **Retry Logic** | Tự động retry 2 lần cho network errors |
| **Fallback UI** | Luôn có UI fallback (ErrorBoundary, ErrorState component) |
| **Logging** | Log errors sang console (dev) và monitoring service (prod) |
| **Toast Notifications** | Dùng toast cho mọi error để user aware |

[^8][^9]

***

## 5. Tối ưu Performance (Optimization)

### 🧠 useMemo - Memoize Expensive Calculations

**✅ KHI NÀO DÙNG:**

1. **Filter/map/reduce array lớn (> 50 items)**
```javascript
const filteredPlaces = useMemo(() => {
  return places.filter(place => {
    const matchDistrict = !filters.district || place.district === filters.district;
    const matchPrice = place.priceRange.max <= filters.maxPrice;
    const matchMood = filters.mood ? place.aiTags.mood.includes(filters.mood) : true;
    return matchDistrict && matchPrice && matchMood;
  });
}, [places, filters.district, filters.maxPrice, filters.mood]);
```

2. **Transform data từ API**
```javascript
const placesByDistrict = useMemo(() => {
  return places.reduce((acc, place) => {
    if (!acc[place.district]) acc[place.district] = [];
    acc[place.district].push(place);
    return acc;
  }, {});
}, [places]);
```

3. **Tính toán phức tạp (> 5ms)**
```javascript
const averageRating = useMemo(() => {
  if (!reviews.length) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return (sum / reviews.length).toFixed(1);
}, [reviews]);
```

**❌ KHI KHÔNG NÊN DÙNG:**

```javascript
// ❌ BAD: Tính toán quá đơn giản
const fullName = useMemo(() => {
  return `${firstName} ${lastName}`; // < 0.1ms, không cần memo
}, [firstName, lastName]);

// ❌ BAD: Tạo object nhỏ
const style = useMemo(() => ({ color: 'red' }), []); // Không cần memo
```


### 🎯 useCallback - Memoize Functions

**✅ KHI NÀO DÙNG:**

1. **Function được pass xuống child component (tránh re-render)**
```javascript
const PlaceList = ({ places }) => {
  const handlePlaceSelect = useCallback((placeId) => {
    navigate(`/places/${placeId}`);
    trackEvent('place_clicked', { placeId });
  }, [navigate]);

  return places.map(place => (
    <PlaceCard 
      key={place._id}
      place={place}
      onSelect={handlePlaceSelect} // Không tạo function mới mỗi render
    />
  ));
};
```

2. **Function là dependency của useEffect/useMemo**
```javascript
const fetchPlaceDetails = useCallback(async (placeId) => {
  const data = await placeService.getPlaceById(placeId);
  setPlaceData(data);
}, []);

useEffect(() => {
  fetchPlaceDetails(placeId);
}, [placeId, fetchPlaceDetails]); // Không trigger re-fetch vô ích
```

3. **Event handlers trong lists**
```javascript
const handleReviewSubmit = useCallback((reviewData) => {
  submitReview.mutate({ placeId, ...reviewData });
}, [placeId, submitReview]);
```

**❌ KHI KHÔNG NÊN DÙNG:**

```javascript
// ❌ BAD: Function chỉ dùng local, không pass xuống
const handleClick = useCallback(() => {
  console.log('clicked'); // Không cần memo
}, []);

// ❌ BAD: Event handler inline đơn giản
<button onClick={useCallback(() => setCount(c => c + 1), [])}>
  // Quá phức tạp cho việc đơn giản
</button>
```


### 🛡️ React.memo - Prevent Component Re-renders

**✅ KHI NÀO DÙNG:**

1. **List items (PlaceCard, ReviewCard)**
```javascript
const PlaceCard = React.memo(({ place, onSelect }) => {
  return (
    <div className="place-card" onClick={() => onSelect(place._id)}>
      <img src={place.images[^0]} alt={place.name} />
      <h3>{place.name}</h3>
      <p>{formatPrice(place.priceRange.min)}</p>
    </div>
  );
});

PlaceCard.displayName = 'PlaceCard';
```

2. **Pure UI components (Button, Badge, Icon)**
```javascript
const Button = React.memo(({ children, onClick, variant = 'primary' }) => {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
});
```

3. **Heavy components (Charts, Maps)**
```javascript
const PlaceMap = React.memo(({ places, center }) => {
  return <MapView places={places} center={center} />;
}, (prevProps, nextProps) => {
  // Custom comparison: chỉ re-render khi places hoặc center thay đổi
  return prevProps.places.length === nextProps.places.length &&
         prevProps.center.lat === nextProps.center.lat;
});
```

**❌ KHI KHÔNG NÊN DÙNG:**

```javascript
// ❌ BAD: Component props thay đổi liên tục
const Counter = React.memo(({ count }) => {
  return <div>{count}</div>; // count thay đổi mỗi giây, memo vô ích
});

// ❌ BAD: Component quá đơn giản
const Text = React.memo(({ children }) => <p>{children}</p>); // Không cần
```


### 🚫 Anti-Patterns Phải Tránh

```javascript
// ❌ BAD: Inline object trong props → tạo mới mỗi render
<PlaceCard style={{ margin: 10 }} />

// ✅ GOOD: Hoist ra ngoài
const cardStyle = { margin: 10 };
<PlaceCard style={cardStyle} />

// ❌ BAD: Inline array trong props
<PlaceCard tags={['cafe', 'quiet']} />

// ✅ GOOD: useMemo hoặc constant
const tags = useMemo(() => ['cafe', 'quiet'], []);
<PlaceCard tags={tags} />

// ❌ BAD: Anonymous function trong prop
<button onClick={() => handleClick(id)}>Click</button>

// ✅ GOOD: useCallback
const onClick = useCallback(() => handleClick(id), [id]);
<button onClick={onClick}>Click</button>

// ❌ BAD: Nested map/filter trong render
{places.map(p => p.reviews.filter(r => r.rating > 4).map(...))}

// ✅ GOOD: useMemo
const topReviews = useMemo(() => {
  return places.flatMap(p => 
    p.reviews.filter(r => r.rating > 4)
  );
}, [places]);
```


### 📊 Optimization Decision Tree

```
Có phải tính toán phức tạp (> 5ms)?
├─ YES → useMemo
└─ NO → Không cần optimize

Function được pass xuống child?
├─ YES → useCallback
└─ NO → Không cần optimize

Component re-render không cần thiết?
├─ YES → React.memo
└─ NO → Không cần optimize
```


### 🔍 Profiling \& Measurement

**Tools:**

- **React DevTools Profiler**: Record và phân tích render time
- **Chrome DevTools Performance**: Flame chart toàn bộ app
- **Lighthouse**: Check Core Web Vitals

**Metrics mục tiêu:**

- First Contentful Paint (FCP) < 1.8s
- Largest Contentful Paint (LCP) < 2.5s
- Total Blocking Time (TBT) < 300ms
- Cumulative Layout Shift (CLS) < 0.1

**Khi nào cần optimize:**

1. Component render > 16ms (60 FPS)
2. User interaction bị lag
3. Lighthouse score < 90

[^2][^3][^10][^1]

***

## 6. React Query Best Practices

### 🔑 Query Keys Structure (Hierarchical)

```javascript
// ✅ GOOD: Tổ chức query keys theo hierarchy
['places'] // Base key
['places', 'list'] // All places
['places', 'list', { district: 'Ba Dinh' }] // Filtered places
['places', 'detail', placeId] // Single place
['places', 'reviews', placeId] // Place's reviews

['chat', 'history', userId] // Chat history
['chat', 'message', messageId] // Single message

['user', 'profile'] // Current user
['user', 'preferences'] // User preferences
```

**Lợi ích:**

- Dễ invalidate queries: `invalidateQueries(['places'])` → clear tất cả place-related
- Consistent và predictable


### 💾 Caching Strategy

```javascript
// hooks/usePlaces.js
export const usePlaces = (filters = {}) => {
  return useQuery({
    queryKey: ['places', 'list', filters],
    queryFn: () => placeService.getPlaces(filters),
    
    // Caching config
    staleTime: 5 * 60 * 1000, // 5 phút - data còn "fresh"
    gcTime: 10 * 60 * 1000, // 10 phút - giữ trong cache
    
    // Refetch behavior
    refetchOnWindowFocus: false, // Không refetch khi switch tab
    refetchOnReconnect: true, // Refetch khi reconnect internet
    
    // Retry
    retry: 2, // Retry 2 lần khi fail
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
```

**Caching rules theo data type:**


| Data Type | staleTime | gcTime | Lý do |
| :-- | :-- | :-- | :-- |
| Static data (categories, districts) | 30 mins | 1 hour | Ít thay đổi |
| User profile | 10 mins | 30 mins | Thay đổi trung bình |
| Place details | 5 mins | 15 mins | Có thể update |
| Search results | 2 mins | 5 mins | Thay đổi thường xuyên |
| Chat messages | 0 | 2 mins | Real-time data |

### 🔄 Optimistic Updates (UX Tốt hơn)

```javascript
// hooks/useReviews.js
export const useSubmitReview = (placeId) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (reviewData) => reviewService.submitReview(placeId, reviewData),
    
    // OPTIMISTIC UPDATE
    onMutate: async (newReview) => {
      // 1. Cancel outgoing refetches (tránh race condition)
      await queryClient.cancelQueries(['places', 'reviews', placeId]);
      
      // 2. Snapshot current data (để rollback nếu fail)
      const previousReviews = queryClient.getQueryData(['places', 'reviews', placeId]);
      
      // 3. Optimistically update UI (user thấy ngay)
      queryClient.setQueryData(['places', 'reviews', placeId], (old) => {
        return [...(old || []), { ...newReview, _id: 'temp-id', createdAt: new Date() }];
      });
      
      return { previousReviews };
    },
    
    onError: (err, newReview, context) => {
      // 4. Rollback nếu API fail
      queryClient.setQueryData(
        ['places', 'reviews', placeId],
        context.previousReviews
      );
      toast.error('Không thể gửi đánh giá');
    },
    
    onSuccess: () => {
      toast.success('Đánh giá đã được gửi');
    },
    
    onSettled: () => {
      // 5. Refetch để sync với server
      queryClient.invalidateQueries(['places', 'reviews', placeId]);
      queryClient.invalidateQueries(['places', 'detail', placeId]); // Update avg rating
    },
  });
};
```


### 📡 Prefetching (Tăng Performance)

```javascript
// Prefetch place details khi hover PlaceCard
const PlaceCard = ({ place }) => {
  const queryClient = useQueryClient();
  
  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ['places', 'detail', place._id],
      queryFn: () => placeService.getPlaceById(place._id),
      staleTime: 60000, // Cache 1 phút
    });
  };
  
  return (
    <div onMouseEnter={handleMouseEnter}>
      <Link to={`/places/${place._id}`}>{place.name}</Link>
    </div>
  );
};
```


### 🔁 Pagination với keepPreviousData

```javascript
export const usePlaces = (page, filters) => {
  return useQuery({
    queryKey: ['places', 'list', page, filters],
    queryFn: () => placeService.getPlaces({ page, ...filters }),
    keepPreviousData: true, // Giữ data cũ khi chuyển trang → không blink
  });
};

// Usage trong component
const PlacesPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = usePlaces(page, filters);
  
  return (
    <>
      <PlaceList places={data?.places} />
      {isFetching && <LoadingOverlay />} // Show loading khi fetch page mới
      <Pagination page={page} onPageChange={setPage} />
    </>
  );
};
```


***

## 7. Code Splitting \& Lazy Loading

### 📦 Route-based Code Splitting

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


### 🎯 Component-based Lazy Loading

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


***

## 9. Testing Checklist

- ✅ Unit tests cho utility functions (`formatPrice`, `validateEmail`)
- ✅ Hook tests với `@testing-library/react-hooks`
- ✅ Component tests với `@testing-library/react`
- ✅ Integration tests cho user flows (Search → Select Place → Submit Review)
- ✅ E2E tests với Playwright/Cypress cho critical paths

***

## 10. Git Commit Messages

**Format**: `type: description`

**Types:**

- `feat`: Tính năng mới (`feat: Add place favorite feature`)
- `fix`: Fix bug (`fix: Resolve chat scroll issue`)
- `perf`: Performance optimization (`perf: Optimize place list rendering`)
- `refactor`: Code refactoring (`refactor: Extract PlaceCard logic to hook`)
- `style`: UI/CSS changes (`style: Update place card hover effect`)
- `test`: Add tests (`test: Add PlaceCard component tests`)

***

## ✅ Final Checklist

Trước khi commit/deploy, đảm bảo:

- [ ] Không có console.log/debugger trong code
- [ ] Tất cả images đã optimize (WebP, lazy load)
- [ ] Components nặng đã được memo/lazy load
- [ ] Error boundaries đã wrap routes chính
- [ ] Loading states cho tất cả async operations
- [ ] Toast notifications cho user actions
- [ ] Mobile responsive (test từ 320px)
- [ ] Accessibility: ARIA labels, keyboard navigation
- [ ] No TypeScript/ESLint errors
- [ ] Lighthouse score > 90

***

**🎯 Mục tiêu cuối cùng**: Code clean, performant, maintainable, và mang lại trải nghiệm người dùng xuất sắc!
