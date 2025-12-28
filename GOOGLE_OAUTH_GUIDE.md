# 🔐 Google OAuth Implementation Guide

## 📋 Tổng quan

Dự án HaNoiGo đã được tích hợp Google OAuth để cho phép người dùng đăng nhập/đăng ký bằng tài khoản Google.

## ✅ Các thay đổi đã thực hiện

### 1. Backend (Server)

#### 1.1. Thư viện mới
- Đã cài đặt `google-auth-library`

#### 1.2. Controller mới
**File:** `server/controllers/authController.js`

Đã thêm 2 endpoints mới:
- `googleAuthUrl` - Tạo URL để redirect đến Google OAuth
- `googleCallback` - Xử lý callback từ Google sau khi user đồng ý

#### 1.3. Routes mới
**File:** `server/routes/authRoutes.js`

```javascript
router.get('/google/url', googleAuthUrl);
router.get('/google/callback', googleCallback);
```

#### 1.4. User Model
**File:** `server/models/User.js`

- `googleId` field đã tồn tại
- `password` đã có validation: không required khi có `googleId`
- Tự động verify email khi đăng nhập qua Google

### 2. Frontend (Client)

#### 2.1. Component mới
**File:** `client/src/pages/Authentication/OAuthSuccess.jsx`

- Xử lý callback từ Google
- Lưu token vào localStorage
- Fetch user profile
- Redirect về trang chủ hoặc admin panel

#### 2.2. API Service
**File:** `client/src/services/api.js`

Đã thêm function:
```javascript
getGoogleAuthUrl: async () => {
  const response = await api.get('/auth/google/url');
  return response.data;
}
```

#### 2.3. Login & Register Components
**Files:** 
- `client/src/pages/Authentication/Login.jsx`
- `client/src/pages/Authentication/Register.jsx`

Đã thêm:
- `handleGoogleLogin()` / `handleGoogleRegister()` function
- `onClick` event cho nút "Continue with Google"
- Giữ nguyên UI/UX hiện tại

#### 2.4. Routing
**File:** `client/src/App.jsx`

Đã thêm route:
```javascript
<Route path="/oauth-success" element={<OAuthSuccess />} />
```

## 🔧 Cấu hình cần thiết

### 1. Google Cloud Console

Bạn cần tạo OAuth 2.0 credentials:

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Vào **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Chọn **Web application**
6. Thêm **Authorized redirect URIs**:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
7. Copy **Client ID** và **Client Secret**

### 2. Environment Variables

**File:** `server/.env` (hoặc `.env` ở root)

Đã được cấu hình với các biến:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret
```

**⚠️ LƯU Ý:** Thay thế `your_google_client_id` và `your_google_client_secret` bằng credentials từ Google Cloud Console.

## 🔄 Luồng hoạt động

```
1. User click "Continue with Google"
   ↓
2. Client gọi GET /api/auth/google/url
   ↓
3. Server trả về Google OAuth URL
   ↓
4. Browser redirect đến Google
   ↓
5. User đăng nhập và đồng ý
   ↓
6. Google redirect về /api/auth/google/callback?code=xxx
   ↓
7. Server:
   - Đổi code lấy tokens
   - Verify ID token
   - Tìm hoặc tạo user trong DB
   - Generate JWT token
   - Redirect về /oauth-success?token=xxx
   ↓
8. OAuthSuccess component:
   - Lưu token vào localStorage
   - Fetch user profile
   - Update UserContext
   - Redirect về home hoặc admin
```

## 🚀 Cách sử dụng

### Cho người dùng:

1. Vào trang Login hoặc Register
2. Click nút "Continue with Google"
3. Đăng nhập với tài khoản Google
4. Tự động đăng nhập vào hệ thống

### Cho developer:

1. Đảm bảo đã cấu hình Google OAuth credentials
2. Cập nhật `.env` với credentials từ Google
3. Khởi động server: `npm run dev` (trong thư mục server)
4. Khởi động client: `npm run dev` (trong thư mục client)
5. Test login/register với Google

## 🔒 Bảo mật

### Các tính năng bảo mật đã implement:

✅ **Email verification tự động** - Email từ Google đã được verify
✅ **JWT tokens** - Sử dụng JWT cho authentication
✅ **Password không required** - Khi đăng nhập qua Google
✅ **Account linking** - Tự động link Google account với email hiện có
✅ **Ban check** - Kiểm tra user bị ban trước khi login
✅ **HTTPS in production** - Khuyến nghị sử dụng HTTPS cho production

## 📝 Test Cases

### 1. Test đăng nhập lần đầu với Google
- User chưa có account
- Nhấn "Continue with Google"
- Hệ thống tạo account mới với thông tin từ Google
- User được đăng nhập thành công

### 2. Test đăng nhập lần thứ 2 với Google
- User đã có account (đã đăng ký qua Google trước đó)
- Nhấn "Continue with Google"
- Hệ thống tìm thấy user
- User được đăng nhập thành công

### 3. Test account linking
- User đã có account bằng email/password
- Đăng nhập qua Google với cùng email
- Hệ thống link Google ID vào account hiện có
- User được đăng nhập thành công

### 4. Test banned user
- User bị ban
- Nhấn "Continue with Google"
- Hệ thống redirect về login với error=banned
- Hiển thị thông báo "Your account has been banned"

### 5. Test error handling
- Google auth failed
- Missing code
- Network error
- Các trường hợp đều hiển thị error message phù hợp

## 🐛 Troubleshooting

### Lỗi "redirect_uri_mismatch"
**Nguyên nhân:** Redirect URI trong code không khớp với Google Console
**Giải pháp:** 
- Kiểm tra `GOOGLE_REDIRECT_URI` trong `.env`
- Đảm bảo URI này có trong "Authorized redirect URIs" của Google Console
- URI phải match CHÍNH XÁC (bao gồm protocol, domain, port, path)

### Lỗi "Invalid credentials"
**Nguyên nhân:** GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET sai
**Giải pháp:** Copy lại credentials từ Google Console

### Lỗi CORS
**Nguyên nhân:** Backend không cho phép origin từ client
**Giải pháp:** Kiểm tra CORS config trong server (thường đã được config sẵn)

### Không redirect về client sau khi login
**Nguyên nhân:** CLIENT_URL sai
**Giải pháp:** Đảm bảo `CLIENT_URL=http://localhost:5173` trong `.env`

## 🔮 Production Deployment

Khi deploy lên production:

1. **Update Redirect URI:**
   ```
   https://yourdomain.com/api/auth/google/callback
   ```

2. **Update Environment Variables:**
   ```env
   GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
   CLIENT_URL=https://yourdomain.com
   ```

3. **Add to Google Console:**
   - Thêm production redirect URI vào Google Console
   - Có thể giữ localhost URI cho development

4. **HTTPS Required:**
   - Google OAuth yêu cầu HTTPS cho production
   - Chỉ cho phép HTTP với localhost

## 📞 Support

Nếu gặp vấn đề, kiểm tra:
1. Console logs (browser & server)
2. Network tab trong DevTools
3. Google Cloud Console OAuth logs
4. Server logs

---

**Tác giả:** GitHub Copilot  
**Ngày cập nhật:** December 28, 2025  
**Version:** 1.0.0
