🔹 Tổng quan Dự án HANOIGO

HANOIGO là một nền tảng web hỗ trợ tìm kiếm và khám phá địa điểm ăn uống, vui chơi tại Hà Nội, hướng đến người dùng trẻ có nhu cầu trải nghiệm theo cách cá nhân hóa và linh hoạt.

🎯 Vấn đề đặt ra

Các nền tảng hiện tại chủ yếu dựa vào bộ lọc tĩnh, khiến người dùng:

Mất nhiều thời gian tìm kiếm

Khó diễn đạt nhu cầu theo ngữ cảnh (tâm trạng, mục đích, ngân sách)

Nhận gợi ý chưa đủ “đúng gu”

💡 Giải pháp của HANOIGO

HANOIGO kết hợp tìm kiếm truyền thống và AI Chatbot thông minh (RAG), cho phép:

Tìm địa điểm bằng ngôn ngữ tự nhiên

Gợi ý dựa trên sở thích cá nhân + ngữ cảnh truy vấn

Liên tục cải thiện chất lượng gợi ý nhờ vòng lặp phản hồi từ người dùng

⚙️ Kiến trúc & Công nghệ

MERN Stack: MongoDB, Express.js, React, Node.js

AI Chatbot: OpenAI API + Retrieval-Augmented Generation (RAG)

Database NoSQL (MongoDB): linh hoạt, phù hợp dữ liệu ngữ nghĩa

Cloud Storage: Cloudinary

Authentication: JWT

👥 Đối tượng sử dụng

Người dùng (End-User):

Tìm kiếm địa điểm thủ công hoặc qua AI Chatbot

Xem chi tiết địa điểm, đánh giá, phản hồi chatbot

Quản trị viên (Admin):

Quản lý địa điểm, người dùng

Gắn thẻ ngữ nghĩa (semantic tags)

Cấu hình & huấn luyện AI (prompt, few-shot, feedback)

🧠 Điểm nổi bật của HANOIGO

AI hiểu ngữ cảnh, không chỉ lọc dữ liệu

Semantic Enrichment giúp AI “hiểu” địa điểm (mood, không gian, mức độ phù hợp)

Feedback Loop giúp hệ thống ngày càng thông minh

Admin có thể huấn luyện AI không cần code

✅ Kết luận ngắn

HANOIGO là một hệ thống kết hợp giữa:

Web Application + Cơ sở dữ liệu ngữ nghĩa + AI Chatbot cá nhân hóa

Giải pháp này giúp:

Giảm thời gian tìm kiếm

Tăng độ chính xác gợi ý

Dễ mở rộng và cải tiến trong tương lai
1) Collection: users (Người dùng)

Mục đích: lưu tài khoản người dùng và hồ sơ sở thích để cá nhân hóa gợi ý.

Fields tiêu biểu:

_id: ObjectId

role: user

email: string (unique)
avatarUrl: String, // ← URL Cloudinary

password: string (đã hash)

displayName: string

avatarUrl: string

createdAt: date

isBanned: boolean

Preferences (cực quan trọng cho AI):

preferences: object

favoriteFoods: [string] (vd: “lẩu”, “nướng”, “cafe”)

styles: [string] (vd: “yên tĩnh”, “sang trọng”, “vintage”)

dietary: [string] (vd: “vegetarian”, “eat-clean”, “không cay”)

2) Collection: admins (Quản trị viên)

Mục đích: quản lý hệ thống + dữ liệu + cấu hình/huấn luyện AI.

Fields tiêu biểu:

_id: ObjectId

role: admin

username: string (unique)

password: string (đã hash)

displayName: string

role: string (vd: “superAdmin”, “editor”)

permissions: [string] (vd: “places.create”, “places.update”, “ai.tune”)

lastLogin: date

3) Collection: places (Địa điểm)

Mục đích: “kho kiến thức trung tâm” cho hệ thống search + RAG chatbot.

Fields tiêu biểu:

_id: ObjectId

name: string

address: string

district: string (khuyến nghị thêm để lọc theo quận/huyện)

category: string (“Ăn uống” / “Vui chơi” / …)

description: string

priceRange: object

min: number

max: number

images: [string] (URL Cloudinary)

menu: [object] (tuỳ mô hình, ví dụ: {name, price})

AI Semantic Tags (làm giàu ngữ nghĩa):

aiTags: object

space: [string] (vd: “ấm cúng”, “ngoài trời”)

mood: [string] (vd: “lãng mạn”, “chill”, “sôi động”)

suitability: [string] (vd: “hẹn hò”, “học bài”, “tụ tập”)

(có thể mở rộng thêm: “crowdLevel”, “music”, “view”...)

4) Collection: reviews (Đánh giá)

Mục đích: tạo cộng đồng review + là dữ liệu feedback giúp AI cải thiện.

Fields tiêu biểu:

_id: ObjectId

userId: ObjectId (ref users._id)

placeId: ObjectId (ref places._id)

rating: number (1–5)

comment: string

createdAt: date

Gợi ý mở rộng (nếu muốn mạnh hơn):

images: [string] (ảnh review)

tags: [string] (vd: “đồ ngon”, “phục vụ tốt”, “giá cao”)
---

## 📁 CẤU TRÚC BACKEND - HANOIGO

### 🎯 Kiến trúc tổng quan

Backend HANOIGO tuân theo kiến trúc **MVC (Model-View-Controller)** với **Service Layer** tách biệt, đảm bảo:

- **Separation of Concerns**: Mỗi layer có trách nhiệm riêng biệt
- **Testability**: Dễ dàng unit test từng layer
- **Scalability**: Dễ mở rộng và maintain
- **Reusability**: Business logic có thể tái sử dụng

### 📊 Luồng xử lý Request

```
Request → Route → Middleware → Controller → Service → Model → Database
                                    ↓           ↓
                                Response ← Data Processing
```

---

## 📂 Cấu trúc thư mục Server

```
server/
├── server.js                    # Entry point - khởi tạo Express server
├── package.json                 # Dependencies và scripts
│
├── config/                      # Cấu hình môi trường
│   ├── db.js                   # MongoDB connection
│   └── cloudinary.js           # Cloudinary config
│
├── models/                      # MongoDB Schemas (Data Layer)
│   ├── User.js                 # Schema người dùng
│   ├── Place.js                # Schema địa điểm
│   ├── Review.js               # Schema đánh giá
│   └── Admin.js                # Schema quản trị viên
│
├── controllers/                 # HTTP Request Handlers (Controller Layer)
│   ├── authController.js       # Xử lý register/login/logout
│   ├── userController.js       # Xử lý user profile, preferences
│   ├── placesController.js     # Xử lý CRUD places, search
│   ├── reviewController.js     # Xử lý CRUD reviews
│   ├── chatController.js       # Xử lý AI chatbot interactions
│   ├── uploadController.js     # Xử lý upload ảnh (Cloudinary)
│   └── adminController.js      # Xử lý admin operations
│
├── services/                    # Business Logic Layer ⭐ QUAN TRỌNG
│   ├── authService.js          # Logic authentication, JWT, OAuth
│   ├── userService.js          # Logic quản lý user, preferences
│   ├── placeService.js         # Logic tìm kiếm, filter, semantic search
│   ├── reviewService.js        # Logic tính rating, validate review
│   ├── chatService.js          # Logic RAG, vector search, AI prompt
│   ├── uploadService.js        # Logic xử lý ảnh, resize, optimize
│   └── emailService.js         # Logic gửi email (nếu có)
│
├── middleware/                  # Express Middlewares
│   ├── auth.js                 # Verify JWT, protect routes
│   ├── errorHandler.js         # Global error handling
│   ├── notFound.js             # 404 handler
│   ├── validate.js             # Request validation (Joi/express-validator)
│   └── upload.js               # Multer config cho file upload
│
├── routes/                      # API Route Definitions
│   ├── authRoutes.js           # /api/auth/*
│   ├── userRoutes.js           # /api/users/*
│   ├── placeRoutes.js          # /api/places/*
│   ├── reviewRoutes.js         # /api/reviews/*
│   ├── chatRoutes.js           # /api/chat/*
│   ├── adminRoutes.js          # /api/admin/*
│   └── aiRoutes.js             # /api/ai/* (AI config, feedback)
│
├── utils/                       # Helper Functions
│   ├── asyncHandler.js         # Wrap async controllers (error handling)
│   ├── validators.js           # Custom validation functions
│   ├── formatters.js           # Data formatting utilities
│   └── constants.js            # App constants (districts, categories)
│
└── uploads/                     # Temporary file storage
    └── avatars/                # Avatar uploads trước khi lên Cloudinary
```

---

## ⚙️ KIẾN TRÚC CONTROLLER - SERVICE - MODEL

### 🎯 Nguyên tắc phân chia trách nhiệm

#### 1️⃣ **Controller Layer** (controllers/)

**Chức năng:**
- Nhận HTTP request, extract params/body/query
- Validate input cơ bản (gọi middleware hoặc validator)
- Gọi Service layer để xử lý business logic
- Format response và trả về cho client
- **KHÔNG chứa business logic phức tạp**

**✅ Controller KHÔNG làm gì:**
- Không query database trực tiếp
- Không xử lý logic phức tạp (filter, calculate, transform data)
- Không gọi external APIs
- Không validate business rules

---

#### 2️⃣ **Service Layer** (services/) ⭐ CORE BUSINESS LOGIC

**Chức năng:**
- Chứa toàn bộ business logic của ứng dụng
- Xử lý data transformation, filtering, sorting
- Validate business rules (ví dụ: user không thể review cùng 1 place 2 lần)
- Gọi Model để thao tác database
- Gọi external APIs (OpenAI, Cloudinary, Email service)
- Có thể gọi Service khác (composition)

*
```

**✅ Service làm gì:**
- Query database thông qua Model
- Validate business rules
- Transform data
- Orchestrate complex operations (gọi nhiều Models/Services)
- Handle external API calls

**❌ Service KHÔNG làm gì:**
- Không xử lý HTTP request/response
- Không biết về req, res objects
- Không format JSON response

---

#### 3️⃣ **Model Layer** (models/)

**Chức năng:**
- Define MongoDB schema
- Define virtual fields, methods, statics
- Pre/post hooks (middleware)
- Data validation tại DB level
- **Chỉ tương tác với database**





## ✅ TÓM TẮT NGUYÊN TẮC

| Layer | Trách nhiệm | Ví dụ code |
|-------|-------------|------------|
| **Route** | Define endpoints, apply middleware | `router.post('/places', protect, createPlace)` |
| **Middleware** | Authentication, validation, error handling | `auth.js`, `validate.js` |
| **Controller** | Handle HTTP, call Service, format response | `const result = await placeService.getPlaces(filters)` |
| **Service** | Business logic, orchestrate operations | `const place = await Place.findById(id)` |
| **Model** | Database schema, validation, indexes | `placeSchema.pre('save', ...)` |

**🎯 Quy tắc vàng:**
- Controller → gọi Service
- Service → gọi Model
- Model → tương tác Database
- **KHÔNG BAO GIỜ**: Controller gọi Model trực tiếp

**✨ Lợi ích:**
- **Testable**: Dễ viết unit test cho từng layer
- **Maintainable**: Thay đổi business logic không ảnh hưởng Controller
- **Reusable**: Service có thể dùng lại ở nhiều Controller
- **Scalable**: Dễ mở rộng và refactor