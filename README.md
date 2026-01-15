# 🏛️ HaNoiGo - Nền tảng Khám phá Hà Nội thông minh

HaNoiGo là nền tảng web hiện đại hỗ trợ tìm kiếm và khám phá địa điểm ẩm thực, vui chơi tại Hà Nội với AI Chatbot thông minh và tính năng visual search.

## 🎯 Tính năng chính

### 👥 Cho người dùng
- **Tìm kiếm thông minh**: Chatbot AI (RAG) hiểu ngôn ngữ tự nhiên
- **Tìm kiếm thủ công**: Lọc theo khu vực, giá cả, danh mục
- **Visual Search**: Tìm địa điểm qua hình ảnh (CLIP)
- **Cá nhân hóa**: Gợi ý dựa trên sở thích người dùng
- **Đánh giá & Phản hồi**: Review địa điểm và feedback cho AI

### 🔧 Cho quản trị viên
- **Dashboard thống kê**: Theo dõi hoạt động hệ thống
- **Quản lý dữ liệu**: CRUD địa điểm, người dùng, đánh giá
- **AI Configuration**: Huấn luyện và tinh chỉnh chatbot
- **Semantic Tagging**: Làm giàu dữ liệu cho AI
- **Feedback Loop**: Cải thiện AI từ phản hồi người dùng

## 🏗️ Kiến trúc hệ thống

```
HaNoiGo/
├── 🎨 admin/          # Admin Dashboard (React + TypeScript + shadcn/ui)
├── 🌐 client/         # Client Website (React + JavaScript + CSS Modules)
├── ⚙️ server/          # Backend API (Node.js + Express + MongoDB)
├── 🤖 ai-service/     # AI Service (Python + CLIP + FastAPI)
├── 📁 docs/           # Documentation
└── 🐳 docker-compose.yml
```

## 🚀 Stack Công nghệ

### Frontend
**Admin Dashboard**
- React 18 + TypeScript
- Vite (Build tool)
- shadcn/ui + TailwindCSS
- React Query + Axios

**Client Website**
- React 18 + JavaScript
- Vite (Build tool)
- CSS Modules
- React Query + Axios

### Backend
**Core API Server**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT + Google OAuth
- Cloudinary (Media Storage)
- OpenAI API (RAG Chatbot)

**AI Service**
- Python + FastAPI
- CLIP Model (Visual Search)
- PyTorch

### Database & Services
- **MongoDB Atlas**: NoSQL Database
- **Cloudinary**: Image Storage & CDN
- **OpenAI**: GPT cho RAG Chatbot
- **Vercel/Netlify**: Frontend Hosting
- **Render/Railway**: Backend Hosting

## 📦 Cài đặt

### 1. Clone repository
```bash
git clone https://github.com/your-username/hanoigo.git
cd hanoigo
```

### 2. Setup Backend
```bash
cd server
npm install
cp .env.example .env
# Cấu hình .env với MongoDB, OpenAI, Cloudinary keys
npm run dev
```

### 3. Setup AI Service
```bash
cd ai-service
pip install -r requirements.txt
cp .env.example .env
python main.py
```

### 4. Setup Admin Dashboard
```bash
cd admin
npm install
npm run dev
```

### 5. Setup Client Website
```bash
cd client
npm install
npm run dev
```

### 6. Docker (Optional)
```bash
# Chạy toàn bộ hệ thống với Docker
docker-compose up -d
```

## 🌐 URLs

- **Client Website**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3001
- **Backend API**: http://localhost:5000
- **AI Service**: http://localhost:8000

## 📊 Database Schema

### Core Collections

**Places** - Địa điểm
```javascript
{
  name: String,
  address: String,
  category: "food" | "entertainment",
  priceRange: { min: Number, max: Number },
  images: [String],
  aiTags: {
    space: ["cozy", "spacious", ...],
    suitability: ["date", "family", ...],
    mood: ["relaxed", "romantic", ...]
  }
}
```

**Users** - Người dùng
```javascript
{
  email: String,
  displayName: String,
  preferences: {
    favoriteFoods: [String],
    styles: [String],
    dietary: [String]
  }
}
```

**Chat Sessions** - Lịch sử chat
```javascript
{
  userId: ObjectId,
  messages: [{role, content, timestamp}],
  feedback: "like" | "dislike",
  feedbackReason: String
}
```

## 🤖 AI Features

### 1. RAG Chatbot
- Sử dụng OpenAI GPT với Retrieval-Augmented Generation
- Truy xuất dữ liệu địa điểm phù hợp từ MongoDB
- Cá nhân hóa dựa trên sở thích người dùng

### 2. Visual Search
- CLIP model để search địa điểm qua hình ảnh
- So sánh semantic giữa text query và images
- Image-to-image similarity search

### 3. Semantic Enrichment
- Gắn thẻ ngữ nghĩa cho địa điểm (mood, space, suitability)
- Giúp AI hiểu sâu về ngữ cảnh và đặc điểm

## 🔄 Development Workflow

1. **Feature Development**: Tạo branch từ `develop`
2. **Testing**: Test thoroughly trước khi merge
3. **Code Review**: Review code qua Pull Request
4. **Deployment**: Auto deploy từ `main` branch

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh` - Refresh token

### Places Endpoints
- `GET /api/places` - Lấy danh sách địa điểm
- `GET /api/places/:id` - Chi tiết địa điểm
- `POST /api/places` - Tạo địa điểm (Admin)
- `PUT /api/places/:id` - Cập nhật địa điểm (Admin)

### Chat Endpoints
- `POST /api/chat/message` - Gửi tin nhắn
- `POST /api/chat/feedback` - Feedback chatbot
- `GET /api/chat/history` - Lịch sử chat

### AI Service Endpoints
- `POST /search/visual` - Visual search
- `POST /search/image-to-image` - Image similarity
- `GET /model/info` - Model information

## 🛡️ Security Features

- JWT Authentication với Refresh Token
- Input validation với express-validator
- Rate limiting
- CORS protection
- Helmet security headers
- Password hashing với bcryptjs

## 🚀 Deployment

### Production Environment Variables
Cấu hình các biến môi trường production trong `.env`:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=strong-secret-key
OPENAI_API_KEY=sk-...
CLOUDINARY_CLOUD_NAME=...
```

### Docker Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 👥 Contributing

1. Fork project
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

MIT License - xem [LICENSE.md](LICENSE.md)

## 👨‍💻 Authors

**HaNoiGo Team**
- Backend & AI: [Your Name]
- Frontend: [Team Member]
- UI/UX: [Designer]

## 📞 Support

- 📧 Email: support@hanoigo.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/hanoigo/issues)
- 📖 Docs: [Documentation](https://docs.hanoigo.com)

---

**🏛️ HaNoiGo - Khám phá Hà Nội một cách thông minh!**