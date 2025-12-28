# 📋 TỔNG QUAN DỰ ÁN HANOIGO

> **Tài liệu trình bày dự án HaNoiGo - Nền tảng khám phá địa điểm thông minh tại Hà Nội**

---

## 📖 MỤC LỤC
1. [Giới thiệu dự án](#1-giới-thiệu-dự-án)
2. [Cấu trúc dự án](#2-cấu-trúc-dự-án)
3. [Công nghệ sử dụng](#3-công-nghệ-sử-dụng)
4. [Kiến trúc hệ thống](#4-kiến-trúc-hệ-thống)
5. [Luồng hoạt động](#5-luồng-hoạt-động)
6. [Tính năng chính](#6-tính-năng-chính)
7. [Mô hình dữ liệu](#7-mô-hình-dữ-liệu)

---

## 1. GIỚI THIỆU DỰ ÁN

### 1.1 Tổng quan
**HaNoiGo** là nền tảng web hiện đại giúp người dùng tìm kiếm và khám phá địa điểm ẩm thực, vui chơi tại Hà Nội với sự hỗ trợ của công nghệ AI tiên tiến.

### 1.2 Mục tiêu
- ✅ Hỗ trợ người dùng tìm kiếm địa điểm thông minh bằng ngôn ngữ tự nhiên
- ✅ Tìm kiếm địa điểm qua hình ảnh (Visual Search)
- ✅ Gợi ý cá nhân hóa dựa trên sở thích người dùng
- ✅ Quản lý dữ liệu địa điểm hiệu quả cho admin
- ✅ Cải thiện trải nghiệm người dùng liên tục qua AI

### 1.3 Đối tượng sử dụng
- **Người dùng cuối**: Tìm kiếm, khám phá địa điểm, đánh giá
- **Quản trị viên**: Quản lý dữ liệu, theo dõi hệ thống, cấu hình AI

---

## 2. CẤU TRÚC DỰ ÁN

### 2.1 Tổng quan cấu trúc thư mục
```
HaNoiGo/
├── 📁 client/          # Frontend cho người dùng (React + JavaScript)
├── 📁 admin/           # Dashboard quản trị (React + TypeScript)
├── 📁 server/          # Backend API (Node.js + Express)
├── 📁 ai-service/      # Dịch vụ AI (Python + FastAPI)
├── 📁 docs/            # Tài liệu dự án
├── 📄 package.json     # Workspace configuration
└── 📄 README.md        # Hướng dẫn sử dụng
```

### 2.2 Chi tiết từng module

#### **🌐 CLIENT (Frontend người dùng)**
```
client/
├── src/
│   ├── pages/              # Các trang chính
│   │   ├── Home/           # Trang chủ
│   │   ├── SearchResult/   # Kết quả tìm kiếm
│   │   ├── Profile/        # Trang cá nhân
│   │   └── Authentication/ # Đăng nhập/Đăng ký
│   ├── components/         # Components tái sử dụng
│   │   ├── common/         # Common UI components
│   │   ├── Layout/         # Layout components
│   │   └── HanoiGo/        # Specific components
│   ├── contexts/           # React Context (User, Cursor)
│   ├── hooks/              # Custom hooks (GSAP, Lenis, Parallax)
│   ├── services/           # API services (axios)
│   └── styles/             # Global styles
└── docs/rules/             # Coding rules & conventions
```

**Đặc điểm:**
- Giao diện hiện đại với animations (GSAP)
- Smooth scrolling (Lenis)
- Responsive design
- CSS Modules cho styling
- React Query cho data fetching

#### **⚙️ ADMIN (Dashboard quản trị)**
```
admin/
├── src/
│   ├── pages/              # Các trang admin
│   │   ├── Dashboard.tsx   # Thống kê tổng quan
│   │   ├── Places.tsx      # Quản lý địa điểm
│   │   ├── Users.tsx       # Quản lý người dùng
│   │   ├── Reviews.tsx     # Quản lý đánh giá
│   │   └── AIConfig.tsx    # Cấu hình AI
│   ├── components/         # Admin components
│   │   ├── AdminLayout.tsx # Layout chính
│   │   ├── PlaceForm.tsx   # Form tạo/sửa địa điểm
│   │   └── ui/             # shadcn/ui components
│   ├── services/           # API services
│   └── types/              # TypeScript types
└── tailwind.config.js      # TailwindCSS config
```

**Đặc điểm:**
- TypeScript cho type safety
- shadcn/ui components
- TailwindCSS cho styling
- React Hook Form + Zod validation
- Recharts cho biểu đồ

#### **🔧 SERVER (Backend API)**
```
server/
├── controllers/            # Business logic
│   ├── authController.js   # Xác thực & phân quyền
│   ├── placesController.js # Quản lý địa điểm
│   ├── userController.js   # Quản lý người dùng
│   └── uploadController.js # Upload files
├── models/                 # MongoDB schemas
│   ├── User.js             # User model
│   └── Place.js            # Place model
├── routes/                 # API routes
│   ├── authRoutes.js       # /api/auth/*
│   ├── placeRoutes.js      # /api/places/*
│   ├── chatRoutes.js       # /api/chat/*
│   ├── reviewRoutes.js     # /api/reviews/*
│   └── aiRoutes.js         # /api/ai/*
├── middleware/             # Express middleware
│   ├── auth.js             # JWT authentication
│   ├── errorHandler.js     # Error handling
│   └── notFound.js         # 404 handler
├── utils/                  # Utilities
└── server.js               # Entry point
```

**Đặc điểm:**
- RESTful API
- JWT authentication
- MongoDB + Mongoose ODM
- Cloudinary integration
- OpenAI API integration
- Security (Helmet, CORS, Rate limiting)

#### **🤖 AI-SERVICE (Dịch vụ AI)**
```
ai-service/
├── main.py                 # FastAPI application
├── requirements.txt        # Python dependencies
└── .env                    # Environment variables
```

**Đặc điểm:**
- CLIP model cho visual search
- PyTorch backend
- FastAPI framework
- RESTful endpoints

---

## 3. CÔNG NGHỆ SỬ DỤNG

### 3.1 Frontend Technologies

#### **Client (User Interface)**
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **React** | 18.3.1 | Core UI library |
| **Vite** | 5.4.8 | Build tool & dev server |
| **React Router** | 6.28.0 | Routing |
| **React Query** | 5.59.0 | Data fetching & caching |
| **Axios** | 1.7.7 | HTTP client |
| **GSAP** | 3.14.2 | Animations |
| **Lenis** | 1.3.16 | Smooth scrolling |
| **React Hook Form** | 7.53.2 | Form handling |
| **React Hot Toast** | 2.4.1 | Notifications |
| **CSS Modules** | - | Component styling |

#### **Admin (Dashboard)**
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **React** | 18.3.1 | Core UI library |
| **TypeScript** | 5.6.2 | Type safety |
| **Vite** | 5.4.8 | Build tool |
| **TailwindCSS** | 3.4.13 | Utility-first CSS |
| **shadcn/ui** | - | UI components |
| **React Query** | 5.59.0 | Data fetching |
| **React Hook Form** | 7.53.2 | Form handling |
| **Zod** | 3.23.8 | Schema validation |
| **Recharts** | 2.13.3 | Data visualization |

### 3.2 Backend Technologies

#### **Server (API)**
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **Node.js** | - | Runtime environment |
| **Express.js** | 4.18.2 | Web framework |
| **MongoDB** | - | NoSQL Database |
| **Mongoose** | 7.6.3 | MongoDB ODM |
| **JWT** | 9.0.2 | Authentication |
| **bcryptjs** | 2.4.3 | Password hashing |
| **Cloudinary** | 1.40.0 | Image storage |
| **OpenAI** | 4.14.2 | AI Chatbot (RAG) |
| **Multer** | 1.4.5 | File upload |
| **Helmet** | 7.0.0 | Security headers |
| **CORS** | 2.8.5 | Cross-origin requests |
| **Express Validator** | 7.0.1 | Input validation |
| **Morgan** | 1.10.0 | HTTP logging |

### 3.3 AI Technologies

#### **AI Service**
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **Python** | 3.x | Programming language |
| **FastAPI** | 0.104.1 | Web framework |
| **PyTorch** | 2.0.0+ | Deep learning |
| **CLIP** | 1.0 | Visual search model |
| **Pillow** | 10.0.1 | Image processing |
| **Uvicorn** | 0.24.0 | ASGI server |

### 3.4 DevOps & Tools
- **Git** - Version control
- **npm** - Package manager (Node.js)
- **pip** - Package manager (Python)
- **Concurrently** - Run multiple commands
- **Nodemon** - Auto-restart server
- **ESLint** - Code linting
- **Prettier** - Code formatting

---

## 4. KIẾN TRÚC HỆ THỐNG

### 4.1 Sơ đồ kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER (Frontend)                     │
├──────────────────────┬──────────────────────────────────────────┤
│   Client Web         │        Admin Dashboard                   │
│   (React + JS)       │        (React + TS)                      │
│   Port: 5173         │        Port: 5174                        │
│   - Home Page        │        - Dashboard                       │
│   - Search           │        - Place Management                │
│   - Profile          │        - User Management                 │
│   - Auth             │        - AI Configuration                │
└──────────────────────┴──────────────────────────────────────────┘
                              ↓ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER (Backend)                         │
├─────────────────────────────────────────────────────────────────┤
│              Server (Node.js + Express)                          │
│              Port: 5000                                          │
│              - RESTful API                                       │
│              - JWT Authentication                                │
│              - Business Logic                                    │
│              - File Upload (Cloudinary)                          │
└─────────────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐
│   MongoDB      │  │  Cloudinary    │  │    AI Service          │
│   Database     │  │  Image CDN     │  │    (FastAPI + CLIP)    │
│   Port: 27017  │  │                │  │    Port: 8000          │
│   - Users      │  │  - Avatars     │  │    - Visual Search     │
│   - Places     │  │  - Place imgs  │  │    - Image Similarity  │
│   - Reviews    │  │                │  │                        │
└────────────────┘  └────────────────┘  └────────────────────────┘
         ↓                                          ↓
┌────────────────┐                        ┌────────────────────────┐
│   OpenAI API   │                        │    CLIP Model          │
│   GPT-4        │                        │    (ViT-B/32)          │
│   RAG Chatbot  │                        │    PyTorch             │
└────────────────┘                        └────────────────────────┘
```

### 4.2 Kiến trúc phân lớp (Layered Architecture)

#### **Presentation Layer (Frontend)**
- **Client App**: Giao diện người dùng
- **Admin App**: Giao diện quản trị
- **Responsibilities**: 
  - Hiển thị UI/UX
  - Xử lý user interactions
  - Client-side routing
  - State management

#### **Application Layer (Backend API)**
- **Controllers**: Xử lý HTTP requests/responses
- **Routes**: Định tuyến API endpoints
- **Middleware**: Authentication, validation, error handling
- **Responsibilities**:
  - Business logic
  - Data validation
  - Authentication & Authorization
  - API orchestration

#### **Data Layer**
- **Models**: MongoDB schemas (Mongoose)
- **Database**: MongoDB Atlas
- **External Services**: 
  - Cloudinary (Image storage)
  - OpenAI (AI Chatbot)
  - AI Service (Visual Search)

### 4.3 Communication Patterns

#### **Frontend ↔ Backend**
- **Protocol**: HTTP/HTTPS (REST)
- **Format**: JSON
- **Authentication**: JWT Bearer Token
- **CORS**: Configured for multiple origins

#### **Backend ↔ Database**
- **ODM**: Mongoose
- **Connection**: MongoDB connection string
- **Pattern**: Repository pattern

#### **Backend ↔ External Services**
```javascript
// Cloudinary - Image Upload
Backend → Cloudinary API → CDN URLs

// OpenAI - Chatbot
Backend → OpenAI API → GPT Response

// AI Service - Visual Search
Backend → FastAPI Service → CLIP Model → Similarity Scores
```

---

## 5. LUỒNG HOẠT ĐỘNG

### 5.1 Luồng Đăng ký & Đăng nhập

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. Nhập email, password, displayName 
     ↓
┌──────────────────┐
│  Client (React)  │
│  /register page  │
└────┬─────────────┘
     │
     │ 2. POST /api/auth/register
     │    { email, password, displayName }
     ↓
┌──────────────────────────────┐
│  Server (authController)     │
│  - Validate input            │
│  - Check email exists        │
│  - Hash password (bcrypt)    │
│  - Create user in MongoDB    │
│  - Generate JWT token        │
└────┬─────────────────────────┘
     │
     │ 3. Response: { token, user }
     ↓
┌──────────────────┐
│  Client          │
│  - Store token   │
│  - Update context│
│  - Redirect home │
└──────────────────┘
```

**Chi tiết luồng đăng nhập:**
1. User nhập credentials
2. Client gửi POST `/api/auth/login`
3. Server xác thực:
   - Tìm user trong DB
   - So sánh password (bcrypt)
   - Generate JWT token
4. Client lưu token vào localStorage
5. Client set Authorization header cho các requests tiếp theo

### 5.2 Luồng Tìm kiếm địa điểm (Manual Search)

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. Chọn filters (district, category, price)
     ↓
┌──────────────────────┐
│  Client              │
│  FilterSidebar       │
└────┬─────────────────┘
     │
     │ 2. GET /api/places?district=X&category=Y&priceMin=Z
     ↓
┌──────────────────────────────┐
│  Server (placesController)   │
│  - Parse query params        │
│  - Build MongoDB query       │
│  - Execute with filters      │
│  - Populate references       │
└────┬─────────────────────────┘
     │
     │ 3. Query MongoDB
     ↓
┌──────────────┐
│  MongoDB     │
│  Places DB   │
└────┬─────────┘
     │
     │ 4. Return matching places
     ↓
┌──────────────────────┐
│  Client              │
│  - Display results   │
│  - Show on map       │
│  - Enable filtering  │
└──────────────────────┘
```

### 5.3 Luồng AI Chatbot (RAG - Retrieval Augmented Generation)

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. Nhập câu hỏi: "Tìm quán café view đẹp ở Tây Hồ"
     ↓
┌──────────────────────┐
│  Client              │
│  ChatInput component │
└────┬─────────────────┘
     │
     │ 2. POST /api/chat/message
     │    { message: "Tìm quán café..." }
     ↓
┌──────────────────────────────────┐
│  Server (chatController)         │
│  Step 1: Semantic Search         │
│  - Extract keywords              │
│  - Query MongoDB với keywords    │
│  - Get relevant places           │
└────┬─────────────────────────────┘
     │
     │ 3. Query places from DB
     ↓
┌──────────────┐
│  MongoDB     │
└────┬─────────┘
     │
     │ 4. Return relevant places (context)
     ↓
┌──────────────────────────────────┐
│  Server                          │
│  Step 2: Generate Response       │
│  - Build context from places     │
│  - Create prompt for OpenAI      │
│  - Call OpenAI API               │
└────┬─────────────────────────────┘
     │
     │ 5. POST to OpenAI API
     │    Context: [Place1, Place2, ...]
     │    Question: "Tìm quán café..."
     ↓
┌──────────────┐
│  OpenAI API  │
│  GPT-4       │
└────┬─────────┘
     │
     │ 6. AI Response
     ↓
┌──────────────────────┐
│  Server              │
│  - Format response   │
│  - Save chat history │
└────┬─────────────────┘
     │
     │ 7. Response with AI answer & places
     ↓
┌──────────────────────┐
│  Client              │
│  - Display chat      │
│  - Show suggested    │
│    places            │
└──────────────────────┘
```

**RAG Process Detail:**
1. **Retrieval**: Tìm kiếm địa điểm liên quan từ database
2. **Augmentation**: Thêm context vào prompt
3. **Generation**: OpenAI tạo câu trả lời dựa trên context

### 5.4 Luồng Visual Search (CLIP)

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. Upload ảnh món ăn/địa điểm
     ↓
┌──────────────────────┐
│  Client              │
│  AISearchSection     │
└────┬─────────────────┘
     │
     │ 2. POST /api/ai/visual-search
     │    FormData: { image: File }
     ↓
┌──────────────────────────────┐
│  Server (aiController)       │
│  - Upload image to Cloudinary│
│  - Get place images from DB  │
│  - Prepare payload           │
└────┬─────────────────────────┘
     │
     │ 3. Forward to AI Service
     │    POST /search/visual
     │    { query: "food", image_urls: [...] }
     ↓
┌──────────────────────────────┐
│  AI Service (FastAPI)        │
│  - Load CLIP model           │
│  - Encode text query         │
│  - Download & encode images  │
│  - Calculate similarities    │
│  - Rank results              │
└────┬─────────────────────────┘
     │
     │ 4. Return similarity scores
     │    { results: [{ url, score }, ...] }
     ↓
┌──────────────────────┐
│  Server              │
│  - Match URLs to     │
│    places            │
│  - Sort by score     │
└────┬─────────────────┘
     │
     │ 5. Response with ranked places
     ↓
┌──────────────────────┐
│  Client              │
│  - Display results   │
│  - Show similarity % │
└──────────────────────┘
```

**CLIP Model Process:**
1. **Text Encoding**: Chuyển text query thành vector
2. **Image Encoding**: Chuyển images thành vectors
3. **Similarity**: Tính cosine similarity giữa vectors
4. **Ranking**: Sắp xếp theo điểm tương đồng

### 5.5 Luồng Upload Avatar

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. Chọn ảnh từ device
     ↓
┌──────────────────────┐
│  Client              │
│  AvatarUpload.jsx    │
│  - Preview image     │
│  - Validate size     │
└────┬─────────────────┘
     │
     │ 2. POST /api/auth/upload-avatar
     │    FormData: { avatar: File }
     │    Headers: { Authorization: "Bearer token" }
     ↓
┌──────────────────────────────────┐
│  Server                          │
│  Middleware: authenticateToken   │
│  - Verify JWT                    │
│  - Get user from token           │
└────┬─────────────────────────────┘
     │
     │ 3. Multer middleware
     │    - Validate file type
     │    - Validate file size
     ↓
┌──────────────────────────────────┐
│  Server (uploadController)       │
│  - Upload to Cloudinary          │
│  - Get secure URL                │
│  - Update user.avatarUrl in DB   │
└────┬─────────────────────────────┘
     │
     │ 4. Upload to Cloudinary
     ↓
┌──────────────┐
│  Cloudinary  │
│  - Store img │
│  - Optimize  │
│  - CDN       │
└────┬─────────┘
     │
     │ 5. Return URL
     ↓
┌──────────────────────┐
│  Server              │
│  - Update MongoDB    │
└────┬─────────────────┘
     │
     │ 6. Response: { avatarUrl }
     ↓
┌──────────────────────┐
│  Client              │
│  - Update UI         │
│  - Update context    │
└──────────────────────┘
```

### 5.6 Luồng Admin - Quản lý địa điểm

```
┌─────────┐
│  Admin  │
└────┬────┘
     │
     │ 1. Nhập thông tin địa điểm
     ↓
┌──────────────────────┐
│  Admin Dashboard     │
│  PlaceForm.tsx       │
│  - React Hook Form   │
│  - Zod validation    │
└────┬─────────────────┘
     │
     │ 2. POST /api/admin/places
     │    { name, address, district, ... }
     │    Headers: { Authorization: "Bearer admin_token" }
     ↓
┌──────────────────────────────────┐
│  Server                          │
│  Middleware: authenticateToken   │
│  - Verify JWT                    │
│  - Check role === 'admin'        │
└────┬─────────────────────────────┘
     │
     │ 3. Validate & process
     ↓
┌──────────────────────────────────┐
│  Server (placesController)       │
│  - Validate input                │
│  - Upload images to Cloudinary   │
│  - Create place in MongoDB       │
│  - Generate semantic tags (AI)   │
└────┬─────────────────────────────┘
     │
     │ 4. Save to database
     ↓
┌──────────────┐
│  MongoDB     │
│  Places      │
└────┬─────────┘
     │
     │ 5. Return created place
     ↓
┌──────────────────────┐
│  Admin Dashboard     │
│  - Update list       │
│  - Show success msg  │
│  - Reset form        │
└──────────────────────┘
```

---

## 6. TÍNH NĂNG CHÍNH

### 6.1 Tính năng User (Client)

#### **🔍 Tìm kiếm thông minh**
- **Manual Search**: Filter theo khu vực, danh mục, giá
- **AI Chatbot**: Tìm kiếm bằng ngôn ngữ tự nhiên
  - Sử dụng RAG (Retrieval Augmented Generation)
  - Hiểu ngữ cảnh và ý định người dùng
  - Gợi ý địa điểm phù hợp nhất
- **Visual Search**: Tìm kiếm bằng hình ảnh
  - Upload ảnh món ăn/địa điểm
  - CLIP model tìm địa điểm tương tự
  - Hiển thị độ tương đồng

#### **👤 Quản lý tài khoản**
- Đăng ký, đăng nhập
- Upload avatar
- Cập nhật thông tin cá nhân
- Lưu địa điểm yêu thích

#### **⭐ Đánh giá & Review**
- Đánh giá địa điểm (1-5 sao)
- Viết nhận xét
- Upload hình ảnh review
- Feedback cho AI chatbot

#### **🎨 UI/UX nâng cao**
- Smooth scrolling (Lenis)
- Animations (GSAP)
- Responsive design
- Loading states
- Error handling

### 6.2 Tính năng Admin

#### **📊 Dashboard**
- Thống kê tổng quan:
  - Số lượng users
  - Số lượng places
  - Số lượng reviews
  - Hoạt động hệ thống
- Biểu đồ (Recharts):
  - User growth
  - Popular places
  - Review trends

#### **🏢 Quản lý địa điểm**
- CRUD operations:
  - Create: Thêm địa điểm mới
  - Read: Xem danh sách, chi tiết
  - Update: Cập nhật thông tin
  - Delete: Xóa địa điểm
- Features:
  - Upload multiple images
  - Add menu items
  - Set price range
  - Assign categories
  - Semantic tagging (AI)

#### **👥 Quản lý người dùng**
- Xem danh sách users
- Ban/Unban users
- View user activity
- Role management

#### **💬 Quản lý đánh giá**
- Xem tất cả reviews
- Moderate reviews
- Delete inappropriate content
- Analyze feedback

#### **🤖 AI Configuration**
- Cấu hình chatbot:
  - System prompts
  - Temperature settings
  - Max tokens
- Training data management
- Feedback loop
- Performance monitoring

---

## 7. MÔ HÌNH DỮ LIỆU

### 7.1 User Schema

```javascript
{
  email: String (unique, required),
  password: String (hashed, required if not OAuth),
  displayName: String (required),
  role: String (enum: ['user', 'admin'], default: 'user'),
  status: String (enum: ['active', 'banned', 'deleted'], default: 'active'),
  avatarUrl: String (URL),
  googleId: String (for OAuth),
  preferences: {
    favoriteCategories: [String],
    priceRange: { min: Number, max: Number },
    favoriteDistricts: [String]
  },
  savedPlaces: [ObjectId] (ref: 'Place'),
  searchHistory: [Object],
  createdAt: Date,
  updatedAt: Date
}
```

**Relationships:**
- **1-to-Many** với Reviews: User có nhiều reviews
- **Many-to-Many** với Places: User có nhiều saved places

### 7.2 Place Schema

```javascript
{
  name: String (required, max: 100),
  address: String (required),
  district: String (enum: ['Ba Đình', 'Hoàn Kiếm', ...], required),
  category: String (enum: ['Ăn uống', 'Vui chơi', ...], required),
  description: String (required, max: 1000),
  priceRange: {
    min: Number (required, min: 0),
    max: Number (required, >= min)
  },
  images: [String] (URLs),
  menu: [{
    name: String,
    price: Number,
    description: String,
    category: String
  }],
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  rating: {
    average: Number (default: 0),
    count: Number (default: 0)
  },
  reviews: [ObjectId] (ref: 'Review'),
  semanticTags: [String], // AI-generated tags
  features: [String],
  openingHours: Object,
  contactInfo: {
    phone: String,
    website: String,
    facebook: String
  },
  status: String (enum: ['active', 'inactive', 'pending'], default: 'active'),
  createdBy: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `location` (2dsphere): Cho location-based queries
- `name, description` (text): Cho text search
- `district, category`: Cho filtering

### 7.3 Review Schema

```javascript
{
  userId: ObjectId (ref: 'User', required),
  placeId: ObjectId (ref: 'Place', required),
  rating: Number (1-5, required),
  comment: String,
  images: [String] (URLs),
  helpful: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

### 7.4 ChatHistory Schema (Proposed)

```javascript
{
  userId: ObjectId (ref: 'User', required),
  messages: [{
    role: String (enum: ['user', 'assistant']),
    content: String,
    timestamp: Date,
    relatedPlaces: [ObjectId] (ref: 'Place')
  }],
  feedback: {
    helpful: Boolean,
    comment: String
  },
  createdAt: Date
}
```

### 7.5 Database Relationships Diagram

```
┌──────────────┐         1        ┌──────────────┐
│     User     │─────────────────→│   Review     │
│              │                   │              │
│  - email     │         *         │  - rating    │
│  - password  │                   │  - comment   │
│  - role      │                   │  - images    │
└──────┬───────┘                   └──────┬───────┘
       │                                  │
       │ savedPlaces (M:M)                │
       │                                  │
       ↓                                  ↓
┌──────────────┐         1        ┌──────────────┐
│    Place     │←─────────────────│   Review     │
│              │                   │              │
│  - name      │         *         │              │
│  - address   │                   │              │
│  - district  │                   │              │
│  - category  │                   │              │
│  - images    │                   │              │
│  - menu      │                   │              │
└──────────────┘                   └──────────────┘
```

---

## 8. API ENDPOINTS

### 8.1 Authentication Routes (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Đăng ký user mới |
| POST | `/login` | ❌ | Đăng nhập |
| POST | `/create-admin` | ❌ | Tạo admin (dev only) |
| GET | `/profile` | ✅ | Lấy thông tin profile |
| PUT | `/profile` | ✅ | Cập nhật profile |
| POST | `/upload-avatar` | ✅ | Upload avatar |
| POST | `/logout` | ✅ | Đăng xuất |

### 8.2 Place Routes (`/api/places`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ❌ | Lấy danh sách places (filter) |
| GET | `/latest` | ❌ | Lấy places mới nhất |
| GET | `/:id` | ❌ | Lấy chi tiết place |
| POST | `/` | ✅ Admin | Tạo place mới |
| PUT | `/:id` | ✅ Admin | Cập nhật place |
| DELETE | `/:id` | ✅ Admin | Xóa place |

### 8.3 Review Routes (`/api/reviews`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/place/:placeId` | ❌ | Lấy reviews của place |
| POST | `/` | ✅ | Tạo review mới |
| PUT | `/:id` | ✅ | Cập nhật review |
| DELETE | `/:id` | ✅ | Xóa review |

### 8.4 Chat Routes (`/api/chat`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/message` | ✅ | Gửi message tới chatbot |
| GET | `/history` | ✅ | Lấy chat history |
| POST | `/feedback` | ✅ | Feedback cho AI response |

### 8.5 AI Routes (`/api/ai`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/visual-search` | ✅ | Visual search with image |
| POST | `/semantic-tag` | ✅ Admin | Generate semantic tags |

### 8.6 Admin Routes (`/api/admin`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/stats` | ✅ Admin | Dashboard statistics |
| GET | `/users` | ✅ Admin | Lấy danh sách users |
| PUT | `/users/:id/ban` | ✅ Admin | Ban/Unban user |
| GET | `/reviews` | ✅ Admin | Lấy tất cả reviews |

### 8.7 AI Service Routes (FastAPI - Port 8000)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ❌ | Health check |
| POST | `/search/visual` | ❌ | CLIP visual search |

---

## 9. SECURITY & BEST PRACTICES

### 9.1 Security Measures

#### **Authentication & Authorization**
- **JWT Tokens**: Secure token-based auth
- **Password Hashing**: bcrypt với salt rounds
- **Role-based Access**: User vs Admin permissions
- **Token Expiration**: Automatic logout

#### **API Security**
- **Helmet.js**: Security headers
- **CORS**: Configured origins only
- **Rate Limiting**: Prevent abuse
- **Input Validation**: express-validator
- **SQL Injection**: Mongoose parameterized queries
- **XSS Protection**: Content Security Policy

#### **File Upload Security**
- **File Type Validation**: Only images
- **File Size Limits**: Max 10MB
- **Cloudinary**: Secure CDN storage
- **No local file storage**: All in cloud

### 9.2 Performance Optimization

#### **Frontend**
- **Code Splitting**: React.lazy()
- **Image Optimization**: Cloudinary transformations
- **Caching**: React Query cache
- **Lazy Loading**: Images and components
- **Bundle Optimization**: Vite build

#### **Backend**
- **Compression**: gzip middleware
- **Database Indexing**: MongoDB indexes
- **Connection Pooling**: Mongoose pooling
- **Response Caching**: Consider Redis
- **Query Optimization**: Lean queries

#### **AI Service**
- **Model Caching**: Load CLIP once
- **Batch Processing**: Process multiple images
- **GPU Acceleration**: CUDA if available

### 9.3 Error Handling

#### **Frontend**
- **Try-Catch**: Async operations
- **Error Boundaries**: React components
- **Toast Notifications**: User-friendly messages
- **Fallback UI**: Loading states

#### **Backend**
- **Global Error Handler**: Express middleware
- **Custom Error Classes**: Structured errors
- **Logging**: Morgan + Winston
- **Status Codes**: Proper HTTP codes

---

## 10. DEPLOYMENT

### 10.1 Deployment Strategy

#### **Frontend (Client & Admin)**
- **Platform**: Vercel / Netlify
- **Build**: `npm run build`
- **Environment Variables**:
  - `VITE_API_URL`
  - `VITE_AI_SERVICE_URL`

#### **Backend (Server)**
- **Platform**: Render / Railway / Heroku
- **Process**: Node.js server
- **Environment Variables**:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `CLOUDINARY_*`
  - `OPENAI_API_KEY`
  - `CLIENT_URL`
  - `ADMIN_URL`

#### **AI Service**
- **Platform**: Railway / Google Cloud Run
- **Runtime**: Python 3.x
- **GPU**: Optional for faster inference
- **Environment Variables**:
  - `PORT`
  - Any API keys

#### **Database**
- **Platform**: MongoDB Atlas
- **Tier**: Free/Shared cluster (dev)
- **Features**: Auto-backups, monitoring

### 10.2 CI/CD Pipeline (Proposed)

```
Code Push → GitHub
    ↓
GitHub Actions
    ↓
├─ Run Tests
├─ Lint Code
├─ Build Frontend
└─ Deploy
    ├─ Client → Vercel
    ├─ Admin → Vercel
    ├─ Server → Render
    └─ AI Service → Railway
```

---

## 11. TÓM TẮT ĐIỂM NỔI BẬT

### 11.1 Công nghệ tiên tiến
✨ **AI Integration**: 
- RAG Chatbot với OpenAI GPT-4
- Visual Search với CLIP model
- Semantic tagging tự động

🚀 **Modern Stack**:
- React 18 với hooks
- TypeScript cho type safety
- TailwindCSS + shadcn/ui
- Vite build tool

💾 **Scalable Backend**:
- RESTful API architecture
- MongoDB với indexing
- Cloudinary CDN
- JWT authentication

### 11.2 Best Practices
✅ Code splitting & lazy loading  
✅ Error handling comprehensive  
✅ Security measures (Helmet, CORS, Rate limiting)  
✅ Form validation (React Hook Form + Zod)  
✅ State management (React Context + React Query)  
✅ Responsive design  
✅ SEO-friendly  

### 11.3 Unique Features
🎯 **Tìm kiếm thông minh**: 3 cách tìm kiếm (Manual, AI Chat, Visual)  
🎨 **UI/UX xuất sắc**: GSAP animations, smooth scrolling  
🤖 **AI-powered**: RAG cho chatbot, CLIP cho visual search  
📊 **Admin Dashboard**: Quản lý toàn diện  
🔐 **Security**: Multi-layer security measures  

---

## 12. KẾT LUẬN

**HaNoiGo** là một dự án full-stack hiện đại, kết hợp:
- ✅ **Frontend tiên tiến** với React, TypeScript, modern UI
- ✅ **Backend mạnh mẽ** với Node.js, Express, MongoDB
- ✅ **AI Integration** với OpenAI và CLIP model
- ✅ **Best Practices** trong development và security
- ✅ **Scalable Architecture** cho growth trong tương lai

Dự án thể hiện khả năng:
- Thiết kế và implement full-stack application
- Tích hợp AI vào ứng dụng thực tế
- Áp dụng best practices và design patterns
- Xây dựng UI/UX chất lượng cao
- Quản lý state và data flow hiệu quả

---

**Chuẩn bị bởi**: HaNoiGo Team  
**Ngày**: 22/12/2025  
**Version**: 1.0.0
