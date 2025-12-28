# 🚀 Quick Setup - Google OAuth

## Bước 1: Cấu hình Google Cloud Console

1. Truy cập https://console.cloud.google.com/
2. Tạo OAuth 2.0 Client ID
3. Thêm Authorized redirect URI:
   ```
   http://localhost:5000/api/auth/google/callback
   ```

## Bước 2: Cập nhật .env

File `.env` đã có sẵn các biến cần thiết. Chỉ cần thay thế:

```env
GOOGLE_CLIENT_ID=paste_your_client_id_here
GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
```

## Bước 3: Test

1. Khởi động server:
   ```bash
   cd server
   npm run dev
   ```

2. Khởi động client:
   ```bash
   cd client
   npm run dev
   ```

3. Vào http://localhost:5173/login
4. Click "Continue with Google"
5. Đăng nhập thành công! 🎉

---

**Chi tiết:** Xem file [GOOGLE_OAUTH_GUIDE.md](./GOOGLE_OAUTH_GUIDE.md)
