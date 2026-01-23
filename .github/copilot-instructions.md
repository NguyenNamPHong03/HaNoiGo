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

### **Hiển thị Địa điểm Mới nhất (Homepage)**

1. **Client**: Component Grid trong trang Home tự động gọi `placesAPI.getLatest(5)` khi mount
2. **Server**: Endpoint `/api/places/latest` query MongoDB với:
   - Filter: `status: 'Published'` và `isActive: true`
   - Sort: `createdAt: -1` (mới nhất trước)
   - Limit: 5 địa điểm
3. **Response**: Trả về 5 địa điểm mới nhất với fields: name, description, images, priceRange, category, district
4. **Client**: Grid component transform data và hiển thị trong layout responsive
5. **Auto-update**: Mỗi khi admin tạo địa điểm mới → refresh trang chủ → Grid tự động hiển thị địa điểm mới

**Lợi ích**: Trang chủ luôn hiển thị nội dung mới nhất, tăng engagement và khám phá các địa điểm mới.

### **Import Dữ liệu Tự động từ Goong Maps API** 🗺️

Admin có thể nhanh chóng import địa điểm từ Goong Maps thay vì nhập thủ công:

1. **Admin Dashboard**: Truy cập trang "Import Data" trong Admin panel
2. **Search**: Nhập keyword (ví dụ: "cafe học bài"), location (tọa độ Hà Nội), radius (5km)
3. **Goong Autocomplete**: Backend gọi Goong API `/Place/AutoComplete` → trả về danh sách gợi ý
4. **Select Places**: Admin tick chọn địa điểm muốn import từ bảng (checkbox multi-select)
5. **Fetch Details**: Backend gọi Goong API `/Place/Detail` cho từng địa điểm đã chọn
6. **Map Data**: 
   - `goongProvider.js` chuẩn hóa dữ liệu từ Goong
   - `placeMapper.js` transform sang Place schema của MongoDB
   - Tự động mapping: name, address, coordinates, category, phone
7. **Upsert MongoDB**: 
   - Kiểm tra `goongId` để tránh duplicate
   - **Update** nếu địa điểm đã tồn tại
   - **Create** nếu địa điểm mới
8. **Import Summary**: Hiển thị kết quả:
   - ✅ Imported: X places
   - 🔄 Updated: Y places
   - ⏭️ Skipped: Z duplicates
   - ❌ Errors: N failed

**Luồng kỹ thuật:**
```
Admin Frontend (GoongImportPage)
    ↓ [POST /admin/import/goong/autocomplete]
Backend (adminImportController)
    ↓ 
goongProvider → Goong Maps API
    ↓
placeImportService → Validate & Transform
    ↓
placeMapper → Map to Place schema
    ↓
MongoDB → Upsert (update/insert)
    ↓
Response → Import summary
```

**Tính năng bổ sung:**
- **Validate API Key**: Endpoint `/goong/validate-api-key` kiểm tra Goong token
- **Import Stats**: Dashboard hiển thị:
  - Total places in DB
  - Places from Goong vs Manual
  - Places needing AI enrichment
- **Re-sync**: Cập nhật lại data từ Goong cho địa điểm cũ
- **Needs Enrichment**: Filter places thiếu aiTags để admin gắn semantic tags

**Lợi ích**:
- ⚡ Tăng tốc độ tạo content (5-10 phút import hàng chục địa điểm)
- 🎯 Giảm lỗi nhập liệu thủ công
- 🔄 Dữ liệu luôn fresh từ Goong Maps
- 🤖 Tích hợp sẵn để AI enrichment sau

## ✨ ĐIỂM NỔI BẬT

**Hybrid Search**: Kết hợp tìm kiếm theo từ khóa cứng (tên địa điểm, địa chỉ) và semantic search (tâm trạng, ngữ cảnh sử dụng) để cho kết quả toàn diện.

**Cá nhân hóa thông minh**: Hệ thống ưu tiên gợi ý địa điểm phù hợp với sở thích cá nhân từ preferences, không chỉ dựa vào query hiện tại.

**Admin-friendly AI Control**: Quản trị viên có thể làm giàu dữ liệu bằng cách gắn semantic tags và điều chỉnh prompt AI qua giao diện web, không cần kiến thức lập trình.

**Auto Import từ Goong Maps**: Tích hợp API Goong Maps cho phép Admin import hàng loạt địa điểm chỉ với vài click, tự động mapping data và upsert vào MongoDB, tiết kiệm thời gian và giảm lỗi nhập liệu.

**Học liên tục**: Mỗi review và phản hồi từ người dùng đều giúp cải thiện độ chính xác của gợi ý trong tương lai, tạo vòng lặp cải tiến không ngừng.


# 📁 CẤU TRÚC FRONTEND - HANOIGO

## 🎯 Tổng quan

Frontend được xây dựng bằng **React** với kiến trúc modular, phân tách rõ ràng giữa UI, business logic, và data management. Sử dụng **React Query** cho server state và **Context API** cho authentication state.

***

## 📂 Cấu trúc mẫu cho Thư mục Chính

```
client/
├── public/                      # Static assets (favicon, manifest)
│   └── img/                     # Static images
├── src/
│   ├── assets/                  # Images, icons, fonts
│   ├── components/              # Reusable UI components
│   │   ├── common/              # Shared components
│   │   │   ├── Grid/            # Grid hiển thị 5 địa điểm mới nhất
│   │   │   ├── Preloader/       # Loading animation
│   │   │   └── TitleSection/    # Title component
│   │   ├── Layout/              # Layout components
│   │   │   ├── Layout.jsx       # Main layout
│   │   │   └── UserMenu.jsx     # User menu dropdown
│   │   ├── HanoiGo/             # Specific components
│   │   ├── Link/                # Custom Link component
│   │   └── AvatarUpload.jsx     # Avatar upload
│   │
│   ├── hooks/                   # Global custom hooks
│   │   ├── useLenis.jsx         # Smooth scrolling
│   │   ├── useParallax.js       # Parallax effects
│   │   ├── useTextReveal.js     # Text animations
│   │   └── useHorizontalLoop.js # Horizontal scroll
│   │
│   ├── contexts/                # React Context providers
│   │   ├── UserContext.jsx      # User state & auth
│   │   └── CursorContext.jsx    # Custom cursor
│   │
│   ├── services/                # API service layer (Axios)
│   │   └── api.js               # Axios config + API functions
│   │                            #   - authAPI, placesAPI, chatAPI
│   │                            #   - placesAPI.getLatest(5) - Lấy 5 địa điểm mới nhất
│   │
│   ├── pages/                   # Top-level page components
│   │   ├── Home/                # Trang chủ
│   │   │   ├── Home.jsx         # Main component
│   │   │   ├── Hero/            # Hero section
│   │   │   ├── Introduction/    # Introduction (chứa Grid)
│   │   │   ├── OurPartners/     # Partners section
│   │   │   └── Why/             # Why choose us
│   │   ├── SearchResult/        # Search results page
│   │   ├── Profile/             # User profile
│   │   └── Authentication/      # Login/Register
│   │
│   ├── utils/                   # Helper functions
│   │   ├── validators.js        # Form validation
│   │   ├── formatters.js        # Data formatting
│   │   └── constants.js         # App constants
│   │
│   ├── App.jsx                  # Root component
│   ├── main.jsx                 # Entry point
│   └── global.css               # Global styles
│
├── docs/
│   └── rules/                   # Coding rules & conventions
│       ├── 00-overview.md
│       ├── 01-core-principles.md
│       ├── 02-naming-conventions.md
│       ├── 03-error-handling.md
│       ├── 04-performance-optimization.md
│       ├── 05-react-query.md
│       ├── 06-code-splitting.md
│       └── 07-testing-git.md
├── package.json
├── vite.config.js               # Vite configuration
└── index.html                   # HTML template
```


***

## 📂 Cấu trúc ADMIN Dashboard

```
admin/
├── src/
│   ├── pages/                   # Các trang admin
│   │   ├── Dashboard.tsx        # Thống kê tổng quan
│   │   ├── Places.tsx           # Quản lý địa điểm (legacy)
│   │   ├── Users.tsx            # Quản lý người dùng
│   │   ├── Reviews.tsx          # Quản lý đánh giá
│   │   ├── AIConfig.tsx         # Cấu hình AI
│   │   └── index.ts             # Exports
│   │
│   ├── features/                # Feature-based modules (NEW)
│   │   ├── places/              # Places feature module
│   │   │   ├── api/
│   │   │   │   └── places.api.ts         # API functions
│   │   │   ├── components/
│   │   │   │   ├── list/                 # List view
│   │   │   │   │   ├── PlacesTable.tsx
│   │   │   │   │   ├── PlacesFilters.tsx
│   │   │   │   │   └── PaginationControls.tsx
│   │   │   │   └── shared/               # Shared components
│   │   │   │       └── StatusBadge.tsx
│   │   │   ├── pages/
│   │   │   │   ├── PlacesListPage.tsx    # Danh sách
│   │   │   │   ├── PlaceFormPage.tsx     # Tạo/Sửa
│   │   │   │   └── PlaceDetailPage.tsx   # Chi tiết
│   │   │   ├── types/
│   │   │   │   └── place.types.ts        # TypeScript types
│   │   │   ├── utils/
│   │   │   │   ├── formatters.ts         # Format utilities
│   │   │   │   └── mapPlaceForm.ts       # Form mapping
│   │   │   ├── README.md                 # Feature docs
│   │   │   └── index.ts                  # Exports
│   │   │
│   │   ├── imports/             # Goong Auto Import module
│   │   │   ├── api/
│   │   │   │   └── goongImport.api.ts    # Goong API functions
│   │   │   ├── components/
│   │   │   │   ├── GoongImportForm.tsx   # Search form
│   │   │   │   ├── PredictionsTable.tsx  # Checkbox table
│   │   │   │   ├── ImportSummary.tsx     # Result summary
│   │   │   │   └── ImportStatsCard.tsx   # Database stats
│   │   │   ├── hooks/
│   │   │   │   └── useGoongImport.ts     # React Query hooks
│   │   │   ├── pages/
│   │   │   │   └── GoongImportPage.tsx   # Main import page
│   │   │   ├── types/
│   │   │   │   └── goongImport.types.ts  # TypeScript types
│   │   │   ├── README.md                 # Feature docs
│   │   │   └── index.ts                  # Exports
│   │   │
│   │   └── users/               # Users feature module
│   │       ├── api/
│   │       │   └── users.api.ts
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── pages/
│   │       ├── README.md
│   │       └── index.ts
│   │
│   ├── components/              # Shared components
│   │   ├── AdminLayout.tsx      # Main layout
│   │   ├── ToastProvider.tsx    # Toast notifications
│   │   └── ui/                  # shadcn/ui components
│   │
│   ├── hooks/                   # Global custom hooks
│   ├── services/                # API services
│   │   └── api.ts               # Axios config
│   ├── types/                   # Global TypeScript types
│   │   └── index.ts
│   └── utils/                   # Global utilities
│       └── imageCompression.ts
│
├── tailwind.config.js           # TailwindCSS config
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite config
├── PLACES_MIGRATION.md          # Migration guide
└── package.json
```

## 📂 Cấu trúc SERVER Backend

```
server/
├── controllers/                 # Business logic
│   ├── authController.js        # Authentication
│   ├── placesController.js      # Places management
│   │                            #   - getLatestPlaces() - Lấy 5 địa điểm mới nhất
│   ├── userController.js        # User management
│   ├── uploadController.js      # File uploads
│   ├── reviewController.js      # Review management
│   └── adminImportController.js # Goong/Google auto import
│
├── models/                      # MongoDB schemas
│   ├── User.js                  # User model
│   ├── Place.js                 # Place model (với aiTags, goongId, googlePlaceId)
│   └── Review.js                # Review model
│
├── routes/                      # API routes
│   ├── authRoutes.js            # /api/auth/*
│   ├── placeRoutes.js           # /api/places/*
│   │                            #   - GET /latest (5 địa điểm mới)
│   ├── adminRoutes.js           # /api/admin/*
│   ├── adminImportRoutes.js     # /api/admin/import/* (Goong/Google)
│   ├── chatRoutes.js            # /api/chat/* (RAG chatbot)
│   ├── reviewRoutes.js          # /api/reviews/*
│   ├── userRoutes.js            # /api/users/*
│   └── aiRoutes.js              # /api/ai/* (AI operations)
│
├── services/                    # Service layer
│   ├── authService.js           # Auth logic
│   ├── placeService.js          # Place logic
│   ├── userService.js           # User logic
│   ├── uploadService.js         # Upload logic
│   ├── reviewService.js         # Review logic
│   ├── autoTaggerService.js     # Auto-tagging với AI
│   │
│   ├── ai/                      # 🤖 AI Service Module (RAG Architecture)
│   │   ├── index.js             # Main exports
│   │   │
│   │   ├── config/              # Configuration
│   │   │   ├── constants.js     # AI constants
│   │   │   ├── keywords.js      # Food keywords dictionary
│   │   │   └── index.js         # Config exports
│   │   │
│   │   ├── core/                # Core AI components
│   │   │   ├── cacheClient.js   # Redis cache
│   │   │   ├── llmFactory.js    # LLM provider factory
│   │   │   ├── telemetry.js     # Logging & monitoring
│   │   │   └── vectorStoreFactory.js # Vector DB factory
│   │   │
│   │   ├── guardrails/          # Input/Output validation
│   │   │   ├── inputGuard.js    # Input sanitization
│   │   │   └── outputGuard.js   # Output validation
│   │   │
│   │   ├── pipelines/           # AI Processing Pipelines
│   │   │   ├── mainChatPipeline.js    # Main RAG chat flow với intent routing
│   │   │   ├── ingestionPipeline.js   # Data ingestion
│   │   │   ├── feedbackPipeline.js    # Feedback learning
│   │   │   └── stages/          # Pipeline stages (modular)
│   │   │       ├── 01-InputProcessor.js       # Input processing
│   │   │       ├── 02-QueryAnalyzer.js        # Query analysis
│   │   │       ├── 03-SemanticRetrieval.js    # Semantic search
│   │   │       ├── 04-HybridSearchEngine.js   # Hybrid search
│   │   │       ├── 05-RankingEngine.js        # Ranking & reordering
│   │   │       ├── 06-PromptBuilder.js        # Prompt construction
│   │   │       ├── 07-LLMInvoker.js           # LLM generation
│   │   │       ├── 08-ResponseFormatter.js    # Response formatting
│   │   │       ├── filters/                   # Query filters
│   │   │       └── retrieval/                 # Retrieval strategies
│   │   │           ├── AddressRegexStrategy.js   # Address matching
│   │   │           ├── KeywordSearchStrategy.js  # Keyword search
│   │   │           └── NearbySearchStrategy.js   # Geospatial search
│   │   │
│   │   ├── prompts/             # Prompt Engineering
│   │   │   ├── promptLoader.js  # Dynamic prompt loader
│   │   │   └── templates/       # Prompt templates
│   │   │       ├── system.v1.txt         # System prompt
│   │   │       ├── rag_query.v1.txt      # RAG query
│   │   │       ├── query_rewrite.v1.txt  # Query rewriting
│   │   │       ├── intent_classify.v1.txt # Intent classification
│   │   │       └── itinerary_gen.v1.txt  # Itinerary generation
│   │   │
│   │   ├── retrieval/           # RAG Retrieval Components
│   │   │   ├── reranker.js      # Result reranking
│   │   │   ├── extractors/
│   │   │   │   ├── intentExtractor.js     # Legacy intent extraction
│   │   │   │   ├── intentClassifier.js    # Multi-level intent classification
│   │   │   │   ├── foodKeywordExtractor.js # Food-specific keyword extraction
│   │   │   │   └── districtExtractor.js   # District/location extraction
│   │   │   ├── loaders/
│   │   │   │   └── mongoLoader.js        # MongoDB data loader
│   │   │   ├── splitters/
│   │   │   │   ├── semanticSplitter.js   # Semantic chunking
│   │   │   │   └── propositionSplitter.js # Proposition-based
│   │   │   └── strategies/
│   │   │       ├── basicRetriever.js     # Basic retrieval
│   │   │       ├── hybridRetriever.js    # Hybrid search
│   │   │       └── hybridSearch.js       # Search strategy
│   │   │
│   │   ├── scripts/             # Utility & test scripts
│   │   │   ├── runIngestion.js  # Run data ingestion
│   │   │   ├── testChat.js      # Test chatbot
│   │   │   ├── debugDistrictData.js         # Debug district data
│   │   │   ├── testDatingFilter.js          # Test dating recommendations
│   │   │   ├── testDatingQuery.js           # Test dating queries
│   │   │   ├── testDistrictFilter.js        # Test district filtering
│   │   │   ├── testDistrictFilterIntegration.js # Integration tests
│   │   │   └── verifyDistrictFilter.js      # Verify district logic
│   │   │
│   │   ├── tools/               # AI Tools (Function Calling)
│   │   │   ├── index.js         # Tool registry
│   │   │   ├── bookingTool.js   # Booking integration
│   │   │   └── weatherTool.js   # Weather API
│   │   │
│   │   └── utils/               # AI Utilities
│   │       ├── documentProcessor.js  # Document processing
│   │       ├── errorHandler.js       # Error handling
│   │       ├── errHandler.js         # Error handler (alternative)
│   │       ├── logger.js             # Logging
│   │       ├── outputParsers.js      # Output parsing
│   │       ├── reorderUtils.js       # Result reordering
│   │       ├── tokenCounter.js       # Token counting
│   │       ├── distanceUtils.js      # Distance & location utilities
│   │       └── preferencesMapper.js  # User preferences mapping
│   │
│   ├── imports/                 # Import services
│   │   └── placeImportService.js # Goong/Google import logic
│   │
│   └── providers/               # External API providers
│       ├── goongProvider.js     # Goong Maps API client
│       └── googleProvider.js    # Google Places API client (nếu có)
│
├── middleware/                  # Express middleware
│   ├── auth.js                  # JWT authentication
│   ├── errorHandler.js          # Error handling
│   └── notFound.js              # 404 handler
│
├── utils/                       # Utilities
│   ├── placeMapper.js           # Map Goong data → Place schema
│   └── googlePlaceMapper.js     # Map Google data → Place schema
│
├── scripts/                     # Database & utility scripts
│   ├── importGooglePlaces.js    # Import từ Google Places
│   ├── updateGoogleReviews.js   # Sync Google reviews
│   ├── check-data.js            # Data validation
│   ├── make-admin.js            # Create admin user
│   └── ingest-data.js           # Ingest data vào vector DB
│
├── uploads/                     # Local storage (dev)
│   ├── avatars/
│   └── places/
│
├── server.js                    # Main entry point
├── server-simple.js             # Simple server (testing)
├── MIGRATION_GUIDE.md           # Documentation
├── GOONG_MODULE_README.md       # Goong import guide
├── GOONG_IMPORT_GUIDE.md        # API detailed guide
├── IMPLEMENTATION_SUMMARY.md    # Implementation summary
├── QUICK_TEST.md                # Quick test guide
├── PRE_DEPLOYMENT_CHECKLIST.md  # Deploy checklist
├── Goong_Import.postman_collection.json # Postman tests
├── update-users.js              # Utility scripts
└── package.json
```

## 📂 Cấu trúc AI Service (Legacy - Deprecated)

**Lưu ý**: AI service đã được tích hợp trực tiếp vào `server/services/ai/`. Folder này không còn được sử dụng.

```
ai-service/ (DEPRECATED)
├── main.py                      # FastAPI application (không dùng)
├── requirements.txt             # Python dependencies
└── .env                         # Environment variables
```

**Migration**: Toàn bộ AI logic đã chuyển sang Node.js trong `server/services/ai/` với kiến trúc RAG hoàn chỉnh.

## 📂 Root Structure

```
HaNoiGo/
├── .github/
│   └── copilot-instructions.md  # Tài liệu này (hướng dẫn cho Copilot)
│
├── client/                      # 🎨 Frontend người dùng (React + Vite)
│   ├── src/
│   │   ├── components/          # UI components
│   │   ├── pages/               # Route pages
│   │   ├── hooks/               # Custom hooks
│   │   ├── contexts/            # React contexts
│   │   └── services/            # API services
│   └── docs/rules/              # Frontend coding rules
│
├── admin/                       # 🛠️ Admin Dashboard (React + TypeScript + Vite)
│   └── src/
│       ├── features/            # Feature modules
│       │   ├── places/          # Places management
│       │   ├── imports/         # Goong/Google import
│       │   └── users/           # User management
│       ├── components/          # Shared components
│       └── pages/               # Admin pages
│
├── server/                      # ⚙️ Backend API (Node.js + Express)
│   ├── controllers/             # Request handlers
│   ├── models/                  # MongoDB schemas
│   ├── routes/                  # API routes
│   ├── services/                # Business logic
│   │   ├── ai/                  # 🤖 RAG AI Service (Node.js)
│   │   ├── imports/             # Import services
│   │   └── providers/           # External API clients
│   ├── middleware/              # Express middleware
│   ├── scripts/                 # Utility scripts
│   └── utils/                   # Helper functions
│
├── ai-service/ (DEPRECATED)     # ❌ Old Python AI service (không dùng)
│
├── docs/                        # 📚 Project documentation
│
├── dataset_crawler-google-places_*.json # Google Places dataset
├── package.json                 # Workspace config (monorepo)
├── PROJECT_OVERVIEW.md          # Project overview
├── AI.md                        # AI architecture documentation
├── FEATURE_GOOGLE_MAPS_DIRECTIONS.md # Google Maps integration
└── README.md                    # Getting started guide
```

**🎯 Tech Stack Summary:**
- **Frontend**: React 18 + Vite + React Query + Axios
- **Admin**: React + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Node.js + Express + MongoDB + Redis
- **AI Engine**: OpenAI API + RAG Architecture (LangChain.js)
- **Maps**: Goong Maps API, Google Places API
- **Storage**: Cloudinary (images), MongoDB (data), Redis (cache)

***

## 🏗️ KIẾN TRÚC BACKEND CHI TIẾT

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

### ⚙️ Phân chia trách nhiệm theo Layer

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

---

### ✅ TÓM TẮT NGUYÊN TẮC

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

***

## 🤖 KIẾN TRÚC AI SERVICE (RAG ARCHITECTURE)

### 🎯 Tổng quan

AI Service là "bộ não" của HANOIGO, sử dụng kiến trúc **RAG (Retrieval-Augmented Generation)** kết hợp:
- **Semantic Search**: Tìm kiếm thông minh dựa trên ngữ nghĩa
- **LLM Generation**: OpenAI GPT-4 để sinh câu trả lời tự nhiên
- **Intent Classification**: Phân loại ý định người dùng đa cấp
- **Food Keyword Extraction**: Trích xuất từ khóa món ăn chuyên biệt

### 📊 Luồng xử lý Chat Query

```
User Input (Tiếng Việt)
    ↓
[1] Input Guardrails - Validate & Sanitize
    ↓
[2] Intent Classification (Multi-level)
    ├─ PRIMARY: find_place | greeting | itinerary | chit_chat
    ├─ SECONDARY: specific_dish | mood_based | budget_conscious
    └─ FOOD_TYPE: vietnamese | korean | japanese | western
    ↓
[3] Food Keyword Extraction (Nếu có food intent)
    ├─ Exact Match: "phở" → PHỞ
    ├─ Fuzzy Match: "pho" → PHỞ
    └─ Compound: "bún chả" → BÚN CHẢ
    ↓
[4] Hybrid Retrieval (MongoDB + Semantic)
    ├─ Keyword Search: Name, description, menu items
    ├─ Semantic Tags: aiTags.mood, aiTags.suitability
    ├─ Location Filter: District, coordinates (near_me)
    ├─ Price Range: priceRange.min/max
    └─ User Preferences: Ưu tiên based on userProfile
    ↓
[5] Re-ranking & Scoring
    ├─ Relevance Score: TF-IDF + Semantic similarity
    ├─ User Preference Boost: +10% if match favorites
    ├─ Distance Penalty: -5% per km (near_me mode)
    └─ Rating Boost: +avgRating * 2%
    ↓
[6] LLM Generation với Context
    ├─ System Prompt: Role + Guidelines
    ├─ Retrieved Context: Top 5-10 places
    ├─ User Query: Original + intent metadata
    └─ User Preferences: Food, mood, dietary
    ↓
[7] Output Guardrails - Validate Response
    ├─ JSON Structure Check
    ├─ Place ID Validation
    └─ Safety Filter (No harmful content)
    ↓
Response (JSON)
{
  "message": "Dạ em tìm được 3 quán phở gần bạn...",
  "places": [...],
  "metadata": { "intent": "find_place", "foodType": "vietnamese" }
}
```

### 🧩 Module Chi tiết

#### 1️⃣ **Intent Classification** (`retrieval/extractors/intentClassifier.js`)

**Chức năng**: Phân loại ý định người dùng theo **3 cấp độ**

```javascript
// PRIMARY INTENTS
- find_place      // "Tìm quán cafe yên tĩnh"
- greeting        // "Xin chào", "Hello"
- itinerary       // "Lập lịch trình 3 ngày Hà Nội"
- chit_chat       // "Hôm nay trời đẹp nhỉ"

// SECONDARY INTENTS (Context)
- specific_dish   // "Tìm quán phở"
- mood_based      // "Muốn đi chỗ lãng mạn"
- budget_conscious // "Dưới 100k"
- group_dining    // "Đi nhóm 10 người"
- near_me         // "Gần đây", "Quanh đây"

// FOOD TYPE (Category)
- vietnamese      // "Phở", "Bún chả"
- korean          // "Kimchi", "Bulgogi"
- japanese        // "Sushi", "Ramen"
- western         // "Pizza", "Burger"
- cafe            // "Cà phê", "Coffee"
```

**Ví dụ Output**:
```json
{
  "primary": "find_place",
  "secondary": ["specific_dish", "budget_conscious"],
  "foodType": "vietnamese",
  "confidence": 0.92
}
```

#### 2️⃣ **Food Keyword Extractor** (`retrieval/extractors/foodKeywordExtractor.js`)

**Chức năng**: Trích xuất từ khóa món ăn từ query với **3 chiến lược**

```javascript
// EXACT MATCH - Khớp chính xác
"Tìm quán phở" → ["PHỞ"]

// FUZZY MATCH - Xử lý lỗi chính tả
"pho bo" → ["PHỞ BÒ"]
"bun ca" → ["BÚN CÁ"]

// COMPOUND DETECTION - Món ăn ghép
"bún chả" → ["BÚN CHẢ"] (KHÔNG tách thành "bún" + "chả")
"phở cuốn" → ["PHỞ CUỐN"]
```

**Food Dictionary**: `config/food-keywords.json`
```json
{
  "vietnamese": ["phở", "bún", "bánh mì", "chả cá", ...],
  "korean": ["kimchi", "bulgogi", "bibimbap", ...],
  "japanese": ["sushi", "ramen", "tempura", ...],
  "western": ["pizza", "burger", "pasta", ...]
}
```

#### 3️⃣ **Hybrid Search** (`retrieval/strategies/hybridSearch.js`)

**Chức năng**: Kết hợp **4 loại search** để tối đa hóa recall

```javascript
// 1. KEYWORD SEARCH (MongoDB Text Index)
{
  $text: { 
    $search: "phở bò", 
    $caseSensitive: false,
    $language: "vietnamese" 
  }
}

// 2. SEMANTIC TAGS MATCH (aiTags)
{
  "aiTags.mood": { $in: ["yên tĩnh", "ấm cúng"] },
  "aiTags.suitability": { $in: ["học bài", "làm việc"] }
}

// 3. CATEGORY + FOOD FILTER
{
  "category": { $in: ["Quán ăn", "Nhà hàng"] },
  "menu.items": { $regex: /phở|bún/i }
}

// 4. GEOSPATIAL SEARCH (Near me)
{
  location: {
    $nearSphere: {
      $geometry: { type: "Point", coordinates: [lng, lat] },
      $maxDistance: 5000 // 5km
    }
  }
}
```

#### 4️⃣ **Preferences Mapper** (`utils/preferencesMapper.js`)

**Chức năng**: Map user preferences sang query filters

```javascript
// User Profile
{
  preferences: {
    favoriteFoods: ["Phở", "Bún chả"],
    favoriteSpaces: ["Yên tĩnh", "Có sân vườn"],
    dietaryRestrictions: ["Chay", "Không gluten"]
  }
}

// Mapped to Query
{
  boostKeywords: ["phở", "bún chả"],
  requiredTags: { "aiTags.space": { $in: ["yên tĩnh"] } },
  excludeFilters: { "menu.dietary": { $nin: ["gluten"] } }
}
```

#### 5️⃣ **Distance Utils** (`utils/distanceUtils.js`)

**Chức năng**: Tính toán khoảng cách và location-based ranking

```javascript
// Haversine Formula - Calculate distance between 2 points
calculateDistance(lat1, lon1, lat2, lon2) → distanceInKm

// Sort by distance
sortByProximity(places, userLocation) → sortedPlaces

// Distance penalty score
applyDistancePenalty(baseScore, distance) {
  // Giảm 5% điểm cho mỗi km xa
  return baseScore * (1 - 0.05 * distance);
}
```

### 🔄 Prompt Templates

#### 📝 **intent_classify.v1.txt**
Phân loại ý định người dùng với LLM fallback (khi rule-based fail)

```
Bạn là chuyên gia phân tích ý định người dùng.
Phân loại câu hỏi sau theo 3 cấp độ:
- PRIMARY: find_place, greeting, itinerary, chit_chat
- SECONDARY: specific_dish, mood_based, budget_conscious...
- FOOD_TYPE: vietnamese, korean, japanese, western

Query: "{userQuery}"

Trả về JSON:
{
  "primary": "...",
  "secondary": [...],
  "foodType": "...",
  "confidence": 0.0-1.0
}
```

#### 🗺️ **itinerary_gen.v1.txt**
Sinh lịch trình du lịch đa ngày

```
Bạn là chuyên gia lập lịch trình du lịch Hà Nội.
User yêu cầu: "{userQuery}"
Ngân sách: {budget}
Thời gian: {days} ngày

Danh sách địa điểm khả dụng:
{retrievedPlaces}

Tạo lịch trình chi tiết theo format:
{
  "days": [
    {
      "day": 1,
      "title": "Khám phá phố cổ",
      "activities": [
        {
          "time": "08:00",
          "placeId": "...",
          "duration": "2h",
          "note": "..."
        }
      ]
    }
  ]
}
```

### 📊 Caching Strategy

```javascript
// Redis Cache Layers
L1 - Query Cache (5 mins)
   Key: `chat:query:${hash(userQuery + userId)}`
   Value: { message, places, metadata }

L2 - Intent Cache (30 mins)
   Key: `intent:${hash(userQuery)}`
   Value: { primary, secondary, foodType }

L3 - Search Results Cache (10 mins)
   Key: `search:${hash(filters)}`
   Value: { places: [...], total, timestamp }
```

### 🛡️ Guardrails

#### Input Guardrails (`guardrails/inputGuard.js`)
- **Max length**: 500 characters
- **Blacklist**: Từ cấm, spam keywords
- **Injection Prevention**: SQL, NoSQL, XSS patterns

#### Output Guardrails (`guardrails/outputGuard.js`)
- **JSON Validation**: Parse & validate structure
- **Place ID Check**: Tồn tại trong DB
- **Content Safety**: No harmful/offensive content

### 🔍 Error Handling

```javascript
// AI Service Error Types
AI_INTENT_CLASSIFICATION_FAILED  // Không phân loại được
AI_NO_RESULTS_FOUND              // Không tìm thấy địa điểm
AI_LLM_TIMEOUT                   // OpenAI timeout
AI_INVALID_RESPONSE              // Response không hợp lệ

// Fallback Strategies
1. Intent Classification Failed → Use default "find_place"
2. LLM Timeout → Return cached results + generic message
3. No Results → Suggest alternative queries
```

### 📈 Performance Metrics

| Operation | Target | Actual |
|-----------|--------|--------|
| Intent Classification | < 100ms | ~80ms |
| Food Keyword Extraction | < 50ms | ~30ms |
| Hybrid Search | < 300ms | ~250ms |
| LLM Generation | < 2s | ~1.5s |
| **Total E2E** | **< 3s** | **~2s** |

### 🧪 Testing

```bash
# Test Intent Classifier
node server/services/ai/scripts/testIntentClassifier.js

# Test Food Extractor
node server/services/ai/scripts/testFoodExtractor.js

# Test Full Chat Pipeline
node server/services/ai/scripts/testChat.js \
  --query "Tìm quán phở gần đây dưới 100k"
```

***

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
