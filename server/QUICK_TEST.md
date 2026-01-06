# 🧪 QUICK TEST GUIDE - Goong Import

## ⚡ Test nhanh trong 5 phút

### 📋 Prerequisites

1. **Server đang chạy:**
   ```bash
   cd server
   npm run dev
   ```
   → Thấy: `🚀 Server running on port 5000`

2. **MongoDB đã kết nối:**
   → Thấy: `📦 Connected to MongoDB`

3. **Goong API key đã set trong `.env`:**
   ```env
   GOONG_API_KEY=your-actual-key
   ```

4. **Có Admin account:**
   - Email: admin@hanoigo.com
   - Password: admin123
   (hoặc tạo mới bằng /api/auth/register)

---

## 🔑 Step 1: Lấy Admin Token

### Option A: Dùng Postman/Thunder Client

```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@hanoigo.com",
  "password": "admin123"
}
```

**Copy `token` từ response**

### Option B: Dùng curl

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hanoigo.com","password":"admin123"}'
```

**Lưu token vào biến môi trường:**
```bash
# PowerShell
$TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Bash/Git Bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## ✅ Step 2: Test API Key

```bash
# PowerShell
curl -X GET "http://localhost:5000/api/admin/import/goong/validate-api-key" `
  -H "Authorization: Bearer $TOKEN"

# Bash
curl -X GET "http://localhost:5000/api/admin/import/goong/validate-api-key" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:**
```json
{
  "success": true,
  "valid": true,
  "message": "Goong API key hợp lệ"
}
```

❌ **Nếu lỗi:** Kiểm tra lại `GOONG_API_KEY` trong `.env`

---

## 🔍 Step 3: Autocomplete Test

```bash
# PowerShell
curl -X GET "http://localhost:5000/api/admin/import/goong/autocomplete?input=cafe" `
  -H "Authorization: Bearer $TOKEN"

# Bash
curl -X GET "http://localhost:5000/api/admin/import/goong/autocomplete?input=cafe" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "count": 10,
  "items": [
    {
      "goongPlaceId": "goong_ChIJxxxxx",
      "name": "Cafe Giảng",
      "addressHint": "Nguyễn Hữu Huân, Hoàn Kiếm, Hà Nội"
    },
    ...
  ]
}
```

**✏️ Copy 1 `goongPlaceId` để test import**

---

## 📥 Step 4: Import Place

**Replace `PLACE_ID_HERE` bằng goongPlaceId từ step 3**

```bash
# PowerShell
curl -X POST "http://localhost:5000/api/admin/import/goong" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{\"placeIds\": [\"PLACE_ID_HERE\"]}'

# Bash
curl -X POST "http://localhost:5000/api/admin/import/goong" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"placeIds": ["PLACE_ID_HERE"]}'
```

**Expected Response (lần 1):**
```json
{
  "success": true,
  "message": "Đã xử lý 1 địa điểm",
  "data": {
    "total": 1,
    "imported": 1,  ← NEW PLACE
    "updated": 0,
    "skipped": 0,
    "success": 1,
    "errors": [],
    "places": [
      {
        "_id": "67...",
        "name": "Cafe Giảng",
        "address": "39 Nguyễn Hữu Huân, Hoàn Kiếm, Hà Nội",
        "district": "Hoàn Kiếm",
        "category": "Ăn uống"
      }
    ]
  }
}
```

---

## 🔁 Step 5: Test Duplicate Prevention

**Chạy lại command ở Step 4 (cùng placeId)**

**Expected Response (lần 2):**
```json
{
  "success": true,
  "message": "Đã xử lý 1 địa điểm",
  "data": {
    "total": 1,
    "imported": 0,
    "updated": 1,  ← UPDATED, KHÔNG TẠO DUPLICATE
    "skipped": 0,
    "success": 1
  }
}
```

✅ **PASS nếu `updated: 1`, không phải `imported: 1`**

---

## 📊 Step 6: Verify trong MongoDB

```bash
# Kết nối MongoDB
mongosh "YOUR_MONGODB_URI"

# Switch database
use hanoigo-db

# Query Goong places
db.places.find({ source: "goong" }).pretty()

# Count
db.places.count({ source: "goong" })
```

**Expected Fields:**
```javascript
{
  "_id": ObjectId("67..."),
  "name": "Cafe Giảng",
  "source": "goong",
  "goongPlaceId": "goong_ChIJxxxxx",
  "location": {
    "type": "Point",
    "coordinates": [105.xxx, 21.xxx]
  },
  "goong": {
    "lastSyncedAt": ISODate("2026-01-06..."),
    "rating": 4.5
  },
  "needsEnrich": true
}
```

---

## 📈 Step 7: Check Stats

```bash
# PowerShell
curl -X GET "http://localhost:5000/api/admin/import/stats" `
  -H "Authorization: Bearer $TOKEN"

# Bash
curl -X GET "http://localhost:5000/api/admin/import/stats" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "total": 1,
    "fromGoong": 1,
    "manual": 0,
    "needsEnrich": 1,
    "enriched": 0
  }
}
```

---

## 🎯 Quick Test Checklist

- [ ] Server khởi động thành công
- [ ] Login và lấy được admin token
- [ ] Validate API key: `valid: true`
- [ ] Autocomplete trả về danh sách địa điểm
- [ ] Import thành công: `imported: 1`
- [ ] Import lại → `updated: 1` (không duplicate)
- [ ] MongoDB có document với `source: "goong"`
- [ ] Stats hiển thị `fromGoong: 1`

✅ **ALL PASS → Hệ thống hoạt động hoàn hảo!**

---

## ⚠️ Common Issues

### 1. "Invalid or expired token"
→ Login lại để lấy token mới

### 2. "Admin access required"
→ User phải có `role: "admin"` trong MongoDB

### 3. "Goong autocomplete failed: Invalid API key"
→ Kiểm tra `GOONG_API_KEY` trong `.env`

### 4. MongoDB duplicate key error
→ Đã có place với cùng `goongPlaceId` (đây là expected behavior - sẽ update thay vì throw error)

### 5. "No result from Goong Detail API"
→ PlaceId không hợp lệ hoặc đã bị xóa khỏi Goong

---

## 🚀 Next: Test với Postman

Import collection:
```
server/Goong_Import.postman_collection.json
```

1. Mở Postman
2. Import → File → Chọn `Goong_Import.postman_collection.json`
3. Edit Collection Variables:
   - `base_url`: `http://localhost:5000`
   - `admin_token`: `YOUR_TOKEN_HERE`
4. Run collection

---

## 📞 Need Help?

- Check server logs: `npm run dev` console output
- MongoDB logs: `mongosh` → `show logs`
- Goong API docs: https://docs.goong.io

**Good luck! 🎉**
