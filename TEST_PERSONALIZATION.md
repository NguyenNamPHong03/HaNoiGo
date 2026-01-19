# ✅ QUICK TEST CHECKLIST - User Preferences Personalization

## 🚀 Bước 1: Khởi động Backend & Frontend

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

## 📝 Bước 2: Test Save Preferences

### 2.1. Tạo tài khoản mới (hoặc dùng tài khoản test)
- [ ] Đăng ký/Đăng nhập
- [ ] Vào trang Profile: `http://localhost:5173/profile`

### 2.2. Set preferences
- [ ] Click **"Chỉnh sửa"** ở phần "Cá nhân hóa"
- [ ] Chọn **"Thuần chay"** trong "CHẾ ĐỘ ĂN"
- [ ] (Optional) Chọn thêm:
  - Món ăn yêu thích: "Salad", "Đậu phụ"
  - Phong cách: "Hiện đại"
  - Không khí: "Yên tĩnh"
- [ ] Click **"Lưu thay đổi"**

### 2.3. Kiểm tra Console (Frontend)
Mở DevTools → Console, tìm:
```
✅ 📤 Saving preferences: { dietary: ['vegan'], ... }
✅ ✅ Preferences saved successfully: { ... }
```

### 2.4. Kiểm tra Terminal (Backend)
```
✅ 🔄 Updating user profile: { userId: ..., dietary: 1 }
✅ ✅ User profile updated successfully: { dietary: ['vegan'] }
```

## 🤖 Bước 3: Test AI Personalization

### 3.1. Vào trang Search
- [ ] Navigate: `http://localhost:5173/search`

### 3.2. Test Generic Food Query
- [ ] Gõ query: **"tìm quán ăn cho tôi"**
- [ ] Click search hoặc Enter

### 3.3. Kiểm tra Console (Frontend)
```
✅ Sending AI request with userPreferences
```

### 3.4. Kiểm tra Terminal (Backend)
```
✅ 🤖 AI Chat Request: { 
     question: "tìm quán ăn cho tôi",
     hasBodyPreferences: true,
     finalPreferences: { dietary: ['vegan'], ... },
     usePersonalization: true
   }

✅ 🍽️ DIETARY FILTER DEBUG: {
     shouldIncludePersonalization: true,
     hasUserPreferences: true,
     userDietary: ['vegan'],
     queryLower: "tìm quán ăn cho tôi"
   }

✅ 🥗 Vegetarian check: {
     isVegetarian: true,
     isGenericFoodQueryForDietary: true,
     isSpecificFoodQuery: false
   }

✅ ✅ Augmenting query to vegetarian
✅ 🥗 DIETARY FILTER: Vegetarian/Vegan user + generic food query -> Forcing "quán chay"
```

### 3.5. Kiểm tra Kết quả
- [ ] Danh sách địa điểm hiển thị
- [ ] **TẤT CẢ** địa điểm đều là **quán chay/vegan** ✅
- [ ] AI answer có mention "quán chay" hoặc "thuần chay"

## 🔍 Bước 4: Test Specific Food Query (Should NOT Override)

### 4.1. Test query cụ thể
- [ ] Clear search
- [ ] Gõ: **"tìm quán phở"**
- [ ] Click search

### 4.2. Kiểm tra Terminal
```
✅ 🥗 Vegetarian check: {
     isVegetarian: true,
     isSpecificFoodQuery: true,  ← Specific query!
     isGenericFoodQueryForDietary: false
   }

❌ (Should NOT see) Augmenting query to vegetarian
```

### 4.3. Kiểm tra Kết quả
- [ ] Kết quả: **Quán phở bình thường** (không bị force thành quán chay)
- [ ] Reason: User query cụ thể "phở" → Không override

## 🧪 Bước 5: Test Edge Cases

### 5.1. Test với dietary khác
- [ ] Vào Profile → Chuyển sang **"Chay"** (vegetarian)
- [ ] Save
- [ ] Search: "gợi ý đồ ăn"
- [ ] Expected: Quán chay ✅

### 5.2. Test update preferences nhiều lần
- [ ] Profile → Change dietary: **"Ăn mặn"**
- [ ] Save
- [ ] Search: "tìm quán ăn"
- [ ] Expected: Quán ăn bình thường (không filter chay) ✅

### 5.3. Test không có preferences
- [ ] Profile → Remove tất cả dietary selections
- [ ] Save
- [ ] Search: "tìm quán ăn"
- [ ] Expected: Quán ăn bình thường ✅

## ❌ Troubleshooting

### Issue: Không thấy logs trong Console/Terminal
**Fix:**
- Clear cache: Ctrl+Shift+R (frontend)
- Restart backend: Ctrl+C → npm run dev
- Check console filters: Show "All levels"

### Issue: "finalPreferences: null" trong logs
**Fix:**
- Verify preferences saved: Check MongoDB
- Check frontend: UserContext có user.preferences?
- Re-login hoặc refresh token

### Issue: Vẫn hiển thị quán ăn bình thường với "Thuần chay"
**Fix:**
- Check: `usePersonalization: true` trong request?
- Check: `hasBodyPreferences: true` trong backend logs?
- Check: Database có preferences đúng không?
  ```bash
  # MongoDB shell
  db.users.findOne({ email: "test@example.com" })
  ```

### Issue: Tất cả queries đều force "quán chay" (kể cả specific)
**Fix:**
- Check: `isSpecificFoodQuery` should be TRUE for "tìm quán phở"
- Verify SPECIFIC_FOOD_KEYWORDS trong mainChatPipeline.js
- Check logs: "Vegetarian check"

## 🎉 Success Criteria

- [x] ✅ Save preferences → Console logs xuất hiện
- [x] ✅ Backend nhận preferences → Terminal logs xuất hiện
- [x] ✅ Generic food query + Vegan → Quán chay
- [x] ✅ Specific food query + Vegan → Quán cụ thể (không force)
- [x] ✅ Update preferences → Kết quả thay đổi ngay
- [x] ✅ Remove preferences → Trở về bình thường

## 📧 Report Issues

Nếu có bất kỳ step nào fail, ghi lại:
1. **Step number:** (e.g., 3.4)
2. **Expected:** (e.g., Should see dietary filter logs)
3. **Actual:** (e.g., No logs, shows null preferences)
4. **Console logs:** (Copy paste from DevTools)
5. **Terminal logs:** (Copy paste from server terminal)
6. **Screenshot:** (Optional)

---

**Estimated time:** 10-15 minutes
**Last updated:** 2026-01-19
