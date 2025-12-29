# 🔍 Hướng dẫn Debug Lỗi Avatar Không Hiển thị

## ✅ Những gì đã fix:

### 1. **OAuthSuccess.jsx** - Xử lý Response Đúng Cách
- ✅ Fix cách parse `response.data.user` từ backend
- ✅ Thêm detailed logging để tracking flow
- ✅ Hiển thị toast message với tên user

### 2. **UserContext.jsx** - Check Auth Status Đúng
- ✅ Fix `checkAuthStatus` để đọc `response.data.user` 
- ✅ Thêm logging để debug token và user data

### 3. **UserMenu.jsx** - Avatar Display Logic
- ✅ Thêm logging để xem user object và avatarUrl
- ✅ Fallback về UI-Avatars nếu không có avatarUrl

### 4. **api.js** - Request Interceptor
- ✅ Thêm logging để verify token được attach vào headers

---

## 🎯 Cách Debug Nhanh (5 phút)

### Bước 1: Kiểm tra Console Logs

Sau khi login Google, mở **DevTools Console** (F12) và tìm các logs sau:

```
✅ MẤU LOGS ĐÚNG:
📡 Fetching user profile...
📥 Full Profile response: {success: true, data: {user: {...}}}
👤 User data extracted: {_id: "...", email: "...", avatarUrl: "https://..."}
👤 User avatarUrl: https://lh3.googleusercontent.com/...
✅ User saved to context
🎨 UserMenu - user.avatarUrl: https://lh3.googleusercontent.com/...
```

```
❌ LOGS BỊ LỖI (phải fix):
📥 Full Profile response: {success: true, data: {user: {...}}}
👤 User avatarUrl: undefined  ← LỖI: avatarUrl không có
hoặc
❌ User data is missing from response.data.user  ← LỖI: structure sai
```

### Bước 2: Test API Profile Bằng Postman/Thunder Client

```http
GET http://localhost:5000/api/auth/profile
Headers:
  Authorization: Bearer <token_từ_localStorage>
```

**Response mong đợi:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "user@gmail.com",
      "displayName": "User Name",
      "avatarUrl": "https://lh3.googleusercontent.com/...",  ← PHẢI CÓ
      "googleId": "...",
      "role": "user"
    }
  }
}
```

### Bước 3: Kiểm tra MongoDB

Vào **MongoDB Atlas** → Collection `users` → tìm user vừa login:

```json
{
  "_id": ObjectId("..."),
  "email": "user@gmail.com",
  "displayName": "User Name",
  "googleId": "...",
  "avatarUrl": "https://lh3.googleusercontent.com/...",  ← PHẢI CÓ FIELD NÀY
  "isEmailVerified": true,
  "role": "user",
  "status": "active"
}
```

**Nếu `avatarUrl` rỗng hoặc không tồn tại** → Lỗi nằm ở Backend không lưu Google avatar.

---

## 🛠️ Các Case Lỗi Thường Gặp

### Case 1: Console log "User avatarUrl: undefined"

**Nguyên nhân:** Backend không lưu `avatarUrl` từ Google vào DB

**Fix:**
- Kiểm tra `server/controllers/authController.js` dòng 269-271
- Đảm bảo có code:
  ```javascript
  const avatarUrl = payload.picture;  // Lấy từ Google
  user = await User.create({
    ...
    avatarUrl,  // Lưu vào DB
    ...
  });
  ```

### Case 2: Network tab không thấy request `/api/auth/profile`

**Nguyên nhân:** Frontend không gọi API sau khi redirect từ OAuth

**Fix:** Đã fix trong `OAuthSuccess.jsx` - phải gọi `authAPI.getProfile()`

### Case 3: Request `/api/auth/profile` bị 401 Unauthorized

**Nguyên nhân:** Token không được gắn vào header

**Fix:** 
- Kiểm tra console log: `🔐 API Interceptor - Token exists: true`
- Nếu `false` → token không được lưu vào localStorage
- Check `OAuthSuccess.jsx` dòng 48: `localStorage.setItem('userToken', token);`

### Case 4: Avatar hiển thị chữ "U" thay vì ảnh Google

**Nguyên nhân:** User object có `avatarUrl` nhưng link bị lỗi hoặc blocked

**Fix:**
- Check console log: `🎨 UserMenu - user.avatarUrl: ...`
- Nếu URL là `https://lh3.googleusercontent.com/...` nhưng vẫn không load:
  - Mở link trong tab mới xem có lỗi CORS không
  - Kiểm tra CSP (Content Security Policy) có block Google images không

---

## 🚀 Cách Test Sau Khi Fix

1. **Xóa localStorage:**
   ```javascript
   // Trong DevTools Console
   localStorage.clear();
   ```

2. **Hard Refresh:**
   - Chrome: `Ctrl + Shift + R` (Windows) / `Cmd + Shift + R` (Mac)

3. **Login Google lại:**
   - Click "Login with Google"
   - Check console logs từ đầu đến cuối
   - Avatar phải hiển thị ảnh Google (không phải chữ "U")

4. **Verify User Menu:**
   - Click vào avatar góc phải
   - Dropdown phải hiển thị:
     - Avatar ảnh Google
     - Display name
     - Email
     - Menu items

---

## 📊 Checklist Debug (đánh dấu ✅)

- [ ] Console log: `📡 Fetching user profile...`
- [ ] Console log: `👤 User avatarUrl: https://lh3.googleusercontent.com/...`
- [ ] Console log: `✅ User saved to context`
- [ ] Console log: `🎨 UserMenu - user.avatarUrl: https://...`
- [ ] Network tab: Request `/api/auth/profile` status 200
- [ ] Network tab: Response có `data.user.avatarUrl`
- [ ] MongoDB: User document có field `avatarUrl`
- [ ] UI: Avatar hiển thị ảnh Google (không phải chữ "U")
- [ ] UI: Dropdown menu hiển thị đầy đủ thông tin

---

## 💡 Bonus: Tắt Lỗi MetaMask/Crypto Wallet

Lỗi `evmAsk.js… Cannot redefine property: ethereum` không ảnh hưởng tới avatar:

**Cách fix:**
1. Tắt extension MetaMask/Coin98/Trust Wallet trong Chrome
2. Hoặc mở Incognito mode (Ctrl+Shift+N) không có extension

---

## 📞 Nếu Vẫn Lỗi

Gửi cho dev:
1. Screenshot console logs đầy đủ
2. Screenshot Network tab (request `/api/auth/profile`)
3. Screenshot MongoDB document của user
4. Video recording flow login Google → homepage

---

**Lưu ý:** Sau khi fix, remember to **remove console.log** trước khi deploy production!
