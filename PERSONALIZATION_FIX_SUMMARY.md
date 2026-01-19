# 📊 TÓM TẮT THAY ĐỔI - USER PREFERENCES PERSONALIZATION

## 🎯 Mục tiêu

Khi user lưu preferences (thuần chay, ăn healthy, v.v.) trong trang Profile, AI chatbot phải sử dụng preferences này để gợi ý địa điểm phù hợp ngay lập tức.

## ⚠️ Vấn đề trước đây

- ❌ User mới set "Thuần chay" → Tìm "quán ăn" → Kết quả: quán ăn bình thường
- ✅ User cũ đã có "Thuần chay" từ trước → Hoạt động bình thường

**Root cause:** Frontend không gửi preferences trong AI chat request.

## ✅ Giải pháp

### Files đã sửa:

1. **client/src/pages/SearchResult/SearchResult.jsx**
   - Import `useUser` hook
   - Lấy `userPreferences` từ context
   - Gửi preferences trong mọi AI chat request
   - Set `usePersonalization: true` flag

2. **server/services/authService.js**
   - Thêm debug logging khi save preferences
   - Hiển thị số lượng items trong mỗi preference category

3. **server/routes/aiRoutes.js**
   - Thêm debug logging trong POST /ai/chat
   - Log preferences từ body và req.user

4. **server/services/ai/pipelines/mainChatPipeline.js**
   - Thêm debug logging trong dietary filter stage
   - Log chi tiết quá trình check vegetarian/vegan

5. **client/src/pages/Profile/ProfilePreferences/ProfilePreferences.jsx**
   - Thêm console log khi save preferences

## 🔄 Luồng hoạt động mới

```
1. User vào Profile → Set "Thuần chay" → Click "Lưu thay đổi"
   ↓
2. Frontend: ProfilePreferences.jsx
   - Gọi authAPI.updateProfile({ preferences: formData })
   - Log: "📤 Saving preferences: { dietary: ['vegan'] }"
   - Gọi updateUser() để update UserContext
   ↓
3. Backend: authController.updateProfile()
   - Log: "📝 Update Profile Request"
   - Gọi authService.updateUserProfile()
   ↓
4. Backend: authService.updateUserProfile()
   - User.findByIdAndUpdate() → Lưu preferences vào MongoDB
   - Log: "🔄 Updating user profile: { dietary: 1 }"
   - Log: "✅ User profile updated successfully"
   ↓
5. User search: "tìm quán ăn cho tôi"
   ↓
6. Frontend: SearchResult.jsx
   - Lấy userPreferences từ UserContext
   - Gọi aiChat.mutate({ 
       question, 
       context: { userPreferences, usePersonalization: true }
     })
   ↓
7. Backend: aiRoutes POST /ai/chat
   - Nhận userPreferences từ request body
   - Log: "🤖 AI Chat Request: { 
       hasBodyPreferences: true, 
       finalPreferences: { dietary: ['vegan'] }
     }"
   - Pass preferences vào AI pipeline
   ↓
8. AI Pipeline: mainChatPipeline.stageRetrieval()
   - Check dietary preferences
   - Log: "🍽️ DIETARY FILTER DEBUG: { userDietary: ['vegan'] }"
   - Detect: isVegetarian = true, isGenericFoodQuery = true
   - Log: "🥗 Augmenting query to vegetarian"
   - Augment query → "top các quán chay ngon review tốt"
   ↓
9. AI trả về danh sách quán chay ✅
```

## 📊 Kết quả mong đợi

| Scenario | Before | After |
|----------|--------|-------|
| User mới + Set "Thuần chay" → "tìm quán ăn" | ❌ Quán ăn bình thường | ✅ Quán chay |
| User có preferences → Reload page → "tìm quán ăn" | ✅ Quán chay | ✅ Quán chay |
| User có "Thuần chay" → "tìm quán phở" | ⚠️ Quán chay (bug) | ✅ Quán phở (specific) |

## 🧪 Cách test

### Test 1: Save preferences
```bash
1. Đăng nhập tài khoản mới
2. Profile → Cá nhân hóa → Chỉnh sửa
3. Chọn "Thuần chay"
4. Click "Lưu thay đổi"
5. Mở Console → Kiểm tra logs:
   ✅ "📤 Saving preferences"
   ✅ "🔄 Updating user profile"
   ✅ "✅ User profile updated successfully"
```

### Test 2: AI Personalization
```bash
1. Sau khi save, vào /search
2. Gõ: "tìm quán ăn cho tôi"
3. Mở Console → Kiểm tra logs:
   ✅ "🤖 AI Chat Request: { usePersonalization: true }"
   ✅ "🍽️ DIETARY FILTER DEBUG: { userDietary: ['vegan'] }"
   ✅ "🥗 Augmenting query to vegetarian"
4. Kết quả: Danh sách quán chay
```

### Test 3: Specific query (should NOT override)
```bash
1. Gõ: "tìm quán phở"
2. Console: isSpecificFoodQuery = true
3. Kết quả: Quán phở bình thường (không force chay)
```

## 📝 Console Logs để tìm

### ✅ Success logs:
```
📤 Saving preferences: { dietary: ['vegan'], ... }
✅ Preferences saved successfully
🔄 Updating user profile: { dietary: 1 }
✅ User profile updated successfully
🤖 AI Chat Request: { finalPreferences: { dietary: ['vegan'] } }
🍽️ DIETARY FILTER DEBUG: { userDietary: ['vegan'] }
🥗 Augmenting query to vegetarian
```

### ❌ Error logs to watch:
```
❌ Update error: ...
❌ Update Profile Error: ...
hasBodyPreferences: false  ← Should be TRUE
finalPreferences: null     ← Should have data
userDietary: []            ← Should have ['vegan']
```

## 🚀 Deployment

### Pre-deployment:
1. Test với tài khoản mới
2. Test với tài khoản cũ
3. Test các dietary options: Vegan, Vegetarian, Healthy, Low-fat
4. Verify logs xuất hiện đúng

### Post-deployment:
1. Monitor logs trong production
2. Check user feedback
3. Remove debug logs sau 1 tuần nếu stable

## 🔗 Related Files

- Frontend:
  - [SearchResult.jsx](client/src/pages/SearchResult/SearchResult.jsx)
  - [ProfilePreferences.jsx](client/src/pages/Profile/ProfilePreferences/ProfilePreferences.jsx)
  - [UserContext.jsx](client/src/contexts/UserContext.jsx)

- Backend:
  - [authService.js](server/services/authService.js)
  - [aiRoutes.js](server/routes/aiRoutes.js)
  - [mainChatPipeline.js](server/services/ai/pipelines/mainChatPipeline.js)
  - [auth.js](server/middleware/auth.js) (optionalAuth middleware)

## 💡 Technical Details

### Why this works:

1. **UserContext**: Frontend state management, luôn sync với latest user data
2. **Request Body Preferences**: Frontend gửi preferences explicitly, không dựa vào JWT token
3. **optionalAuth Middleware**: Backend fetch user từ DB, nhưng prioritize body preferences
4. **usePersonalization Flag**: Explicit flag để enable/disable personalization
5. **Dietary Augmentation**: AI pipeline augment query dựa trên dietary preferences

### Edge cases handled:

1. ✅ User mới (chưa có preferences) → AI vẫn hoạt động bình thường
2. ✅ User update preferences nhiều lần → Luôn dùng preferences mới nhất
3. ✅ Specific food query + dietary restriction → Không override query
4. ✅ Generic food query + dietary restriction → Augment query
5. ✅ Logged out user → AI hoạt động không có personalization

## 📚 Documentation

- [PERSONALIZATION_FIX.md](PERSONALIZATION_FIX.md) - Chi tiết technical implementation
- [USER_PREFERENCES_ENHANCEMENT.md](server/USER_PREFERENCES_ENHANCEMENT.md) - Feature overview
