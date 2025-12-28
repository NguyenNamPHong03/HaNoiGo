# 🔧 FIX: Missing required parameter: client_id

## ✅ Đã fix xong!

Tôi đã xác định và sửa lỗi của bạn. Vấn đề là **server không load được Google OAuth credentials từ file `.env`**.

## 🔍 Nguyên nhân

File `.env` trong thư mục `server/` **CHƯA CÓ** các biến Google OAuth:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

## ✨ Đã thực hiện

### 1. ✅ Thêm Google OAuth variables vào `server/.env`

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

### 2. ✅ Thêm debug logs vào authController

Giờ sẽ log ra để kiểm tra:
```javascript
console.log('GOOGLE_CLIENT_ID =', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET =', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');
```

### 3. ✅ Thêm validation

Nếu thiếu credentials, server sẽ trả về lỗi rõ ràng thay vì để Google báo lỗi.

## 🚀 Bước tiếp theo (BẮT BUỘC)

### Bước 1: Lấy Google OAuth Credentials

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo hoặc chọn project
3. Vào **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Thêm **Authorized redirect URIs**:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
7. Click **Create**
8. Copy **Client ID** và **Client Secret**

### Bước 2: Cập nhật file `server/.env`

Mở file `server/.env` và thay thế:

```env
GOOGLE_CLIENT_ID=186140531400-xxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx
```

**⚠️ LƯU Ý:**
- Client ID có dạng: `xxx.apps.googleusercontent.com`
- Client Secret có dạng: `GOCSPX-xxx`
- KHÔNG có dấu nháy kép `"` hoặc khoảng trắng

### Bước 3: Restart Server

```bash
# Dừng server (Ctrl + C nếu đang chạy)
# Sau đó chạy lại:
cd server
npm run dev
```

### Bước 4: Kiểm tra Logs

Khi server khởi động, bạn sẽ thấy:

```
ENV LOADED: {
  ...
  GOOGLE_CLIENT_ID: '186140531400-xxxxx...',
  GOOGLE_CLIENT_SECRET: 'SET',
  GOOGLE_REDIRECT_URI: 'http://localhost:5000/api/auth/google/callback'
}
```

**✅ Nếu thấy giá trị đúng** → OK, ready để test!

**❌ Nếu thấy 'NOT SET'** → Kiểm tra lại file `.env`

### Bước 5: Test Google Login

1. Vào http://localhost:5173/login
2. Click "Continue with Google"
3. Kiểm tra logs trong terminal server:
   ```
   🔍 Google OAuth Debug:
   GOOGLE_CLIENT_ID = 186140531400-xxxxx...
   GOOGLE_CLIENT_SECRET = SET
   GOOGLE_REDIRECT_URI = http://localhost:5000/api/auth/google/callback
   ✅ Generated Google Auth URL
   ```
4. Đăng nhập thành công! 🎉

## 🐛 Nếu vẫn lỗi

### Kiểm tra 1: File .env đúng vị trí?

```
server/
├── .env          ✅ Phải có file này
├── server.js
└── controllers/
```

### Kiểm tra 2: Tên biến đúng chính xác?

```env
GOOGLE_CLIENT_ID     ✅ Đúng
GOOGLE_CLIENTID      ❌ Sai (thiếu dấu _)
GOOGLE-CLIENT-ID     ❌ Sai (dùng dấu -)
```

### Kiểm tra 3: Restart server chưa?

Sau khi sửa `.env`, **BẮT BUỘC** restart server!

### Kiểm tra 4: Console logs

Kiểm tra terminal server xem có log debug không:
- ✅ Có log `🔍 Google OAuth Debug:` → Đã gọi endpoint
- ❌ Không có log → Client chưa gọi đúng endpoint

## 🎯 Checklist hoàn thành

- [x] ✅ Thêm Google OAuth variables vào `server/.env`
- [ ] ⏳ Lấy credentials từ Google Cloud Console
- [ ] ⏳ Cập nhật GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET
- [ ] ⏳ Restart server
- [ ] ⏳ Test login

## 📞 Debug Commands

```bash
# Kiểm tra file .env có tồn tại không
dir server\.env

# Xem nội dung file .env (Windows)
type server\.env

# Kiểm tra server đang chạy
netstat -ano | findstr :5000
```

---

**💡 TIP:** Lỗi `ethereum` / `evmAsk.js` trong F12 là do extension ví crypto (MetaMask, Coin98...), hoàn toàn không liên quan đến Google OAuth. Bỏ qua nó!
