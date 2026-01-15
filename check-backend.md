# 🔧 Backend Connection Troubleshooting

## 1. Kiểm tra Backend có đang chạy không

Mở terminal và chạy:

```bash
cd server
npm run dev
```

Bạn phải thấy output:
```
📦 Connected to MongoDB
🚀 Server running on port 5000
📍 API Health Check: http://localhost:5000/api/health
```

## 2. Test kết nối trực tiếp

Mở browser hoặc terminal mới và test:

**Browser:**
```
http://localhost:5000/api/health
```

**Terminal:**
```bash
curl http://localhost:5000/api/health
```

Phải trả về:
```json
{
  "success": true,
  "message": "HaNoiGo API is running",
  "timestamp": "..."
}
```

## 3. Nếu Backend crash khi nhận request

Xem terminal backend có stacktrace đỏ không khi bạn submit form.

## 4. Các lỗi thường gặp:

### MongoDB Connection Error
```bash
❌ MongoDB connection error: ...
```
**Fix:** Kiểm tra MONGODB_URI trong .env

### Port đã được sử dụng
```bash
Error: listen EADDRINUSE :::5000
```
**Fix:** 
```bash
# Tìm process đang dùng port 5000
netstat -ano | findstr :5000
# Kill process (thay PID bằng số thật)
taskkill /PID [PID] /F
```

### Import/Module Errors
```bash
SyntaxError: Cannot use import statement outside a module
```
**Fix:** Đảm bảo package.json có `"type": "module"`

## 5. Restart Backend

```bash
# Stop current process (Ctrl+C)
# Restart
cd server
npm run dev
```

## 6. Nếu vẫn không được

Check package.json dependencies:
```bash
cd server
npm install
npm run dev
```