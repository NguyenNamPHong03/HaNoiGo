# 🚀 Quick Start - Accommodation Feature

## ✅ Setup trong 5 phút

### Bước 1: Cập nhật Database Schema
File `server/models/Place.js` đã được update với category mới:
```javascript
category: {
  enum: ['Ăn uống', 'Vui chơi', 'Mua sắm', 'Dịch vụ', 'Lưu trú', 'Khác']
}
```
✅ **Không cần làm gì** - Schema đã được update tự động.

### Bước 2: Tag Existing Places
Chạy script để tự động tag các địa điểm hiện có:

```bash
# Review mode (xem trước)
node server/scripts/tagAccommodations.js

# Execute mode (cập nhật DB)
node server/scripts/tagAccommodations.js --execute
```

Script này sẽ tự động phát hiện và tag các địa điểm có tên/mô tả chứa:
- "nhà nghỉ"
- "homestay"  
- "khách sạn"
- "hotel"
- "motel"
- ...và nhiều từ khóa khác

### Bước 3: Verify AI Logic
```bash
# Test keyword detection
node server/scripts/testAccommodationFeature.js
```

Kết quả mong đợi: **6/6 tests PASS** ✅

### Bước 4: Restart Server
```bash
cd server
npm start
```

AI pipeline sẽ tự động load prompts mới.

---

## 🧪 Test Feature

### Via Postman/Thunder Client

**Test 1: Hẹn hò về muộn**
```json
POST http://localhost:5000/api/chat
Content-Type: application/json

{
  "question": "Đi hẹn hò về muộn thì nên đi đâu?",
  "context": {
    "location": { "lat": 21.0285, "lon": 105.8542 },
    "localTime": "2026-01-15T23:30:00"
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "intent": "CHAT",
    "answer": "Mình có vài gợi ý nhà nghỉ/homestay tốt cho bạn...",
    "places": [
      {
        "name": "Nhà nghỉ ABC",
        "category": "Lưu trú",
        ...
      }
    ],
    "metadata": {
      "accommodationMode": true
    }
  }
}
```

**Test 2: Normal Query (không phải accommodation)**
```json
POST http://localhost:5000/api/chat

{
  "question": "Tìm quán cafe yên tĩnh"
}
```

**Expected:**
- `accommodationMode: false`
- `places[].category`: "Ăn uống", "Vui chơi", etc.

---

## 📊 Verify Logs

Khi test, check server logs:

✅ **Accommodation detected:**
```
🏨 Accommodation request detected! Filtering category="Lưu trú"
🔍 Hybrid search found 5 results
📍 All results have category: Lưu trú
```

❌ **Normal query:**
```
🔍 Hybrid search found 10 results
📊 Mixed categories: Ăn uống, Vui chơi, etc.
```

---

## 🎯 Thêm Places Mới

### Via Admin Dashboard

1. Login: `http://localhost:5173/admin`
2. Navigate: **Places** → **Add New Place**
3. Fill form:
   ```
   Name: "Nhà nghỉ View Hồ Tây"
   Category: "Lưu trú" ⭐ IMPORTANT
   Address: "123 Đường Thanh Niên, Tây Hồ"
   Price Range: 200,000 - 500,000 VNĐ
   
   AI Tags:
   - Suitability: hẹn hò, thư giãn
   - Mood: lãng mạn, yên bình
   - Special Features: wifi miễn phí, điều hòa, view đẹp
   ```
4. Save → AI sẽ tự động gợi ý địa điểm này!

### Via API (Advanced)

```javascript
POST /api/places
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "name": "Homestay Cozy Corner",
  "category": "Lưu trú",
  "address": "45 Ngõ Huế, Hoàn Kiếm",
  "district": "Hoàn Kiếm",
  "description": "Homestay ấm cúng, sạch sẽ, view đẹp, gần phố cổ",
  "priceRange": { "min": 300000, "max": 600000 },
  "images": ["https://..."],
  "aiTags": {
    "space": ["ấm cúng", "riêng tư"],
    "mood": ["lãng mạn", "yên bình"],
    "suitability": ["hẹn hò", "thư giãn"],
    "specialFeatures": ["wifi miễn phí", "điều hòa", "view đẹp"]
  }
}
```

---

## ✅ Success Checklist

Sau khi setup, verify:

- [ ] `tagAccommodations.js --execute` chạy thành công
- [ ] Database có ít nhất 1 place với `category: "Lưu trú"`
- [ ] Test script pass 6/6 tests
- [ ] API query "về muộn" trả về accommodation places
- [ ] API query "cafe" KHÔNG trả về accommodation
- [ ] Server logs show "accommodationMode: true" khi đúng
- [ ] Admin dashboard có thể tạo places với category "Lưu trú"

---

## 🐛 Troubleshooting

### Vấn đề: Query "về muộn" không trả về kết quả

**Nguyên nhân:** Database chưa có places category "Lưu trú"

**Fix:**
```bash
# Check số lượng places
mongo
> use hanoigo
> db.places.countDocuments({ category: "Lưu trú" })

# Nếu = 0, chạy:
node server/scripts/tagAccommodations.js --execute
```

### Vấn đề: AI vẫn gợi ý quán ăn thay vì nhà nghỉ

**Nguyên nhân:** Prompts chưa được reload

**Fix:**
```bash
# Restart server
cd server
npm restart
```

### Vấn đề: Script báo lỗi MongoDB connection

**Fix:**
```bash
# Check .env file
cat server/.env | grep MONGO_URI

# Verify connection
mongo $MONGO_URI
```

---

## 📚 Documentation

Full documentation: [docs/ACCOMMODATION_FEATURE.md](../docs/ACCOMMODATION_FEATURE.md)

---

## 🎉 Done!

Feature đã sẵn sàng! Test thử:

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Đi hẹn hò về muộn đi đâu?"}'
```

Enjoy! 🏨✨
