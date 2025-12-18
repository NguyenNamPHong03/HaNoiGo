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
