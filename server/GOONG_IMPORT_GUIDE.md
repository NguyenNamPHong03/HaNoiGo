# 🗺️ GOONG AUTO IMPORT - HƯỚNG DẪN SỬ DỤNG

## 📋 Tổng quan

Module này cho phép Admin tự động import địa điểm từ **Goong Maps API** vào MongoDB mà không cần nhập thủ công.

**Luồng hoạt động:**
1. Admin nhập keyword tìm kiếm
2. Hệ thống gọi Goong Autocomplete → hiển thị gợi ý
3. Admin tick chọn địa điểm
4. Hệ thống gọi Goong Detail → flatten → upsert MongoDB
5. Trả về thống kê: imported / updated / skipped / errors

---

## 🔧 Setup

### 1. Cài đặt dependencies (đã có sẵn)

```bash
cd server
npm install axios
```

### 2. Cấu hình Environment Variables

Thêm vào file `server/.env`:

```env
# Goong Maps API
GOONG_API_KEY=your-actual-goong-api-key
GOONG_DEFAULT_LOCATION=21.0278,105.8342
GOONG_DEFAULT_RADIUS=5000
```

**Lấy Goong API Key:**
- Đăng ký tại: https://account.goong.io
- Tạo API key tại Dashboard
- Copy và paste vào `.env`

### 3. Khởi động server

```bash
cd server
npm run dev
```

---

## 📡 API Endpoints

### ✅ Base URL
```
http://localhost:5000/api/admin/import
```

**Lưu ý:** Tất cả endpoints yêu cầu **Admin authentication** (Bearer token)

---

### 1️⃣ **Autocomplete (Preview)**

**Endpoint:**
```
GET /api/admin/import/goong/autocomplete
```

**Query Params:**
- `input` (required): Từ khóa tìm kiếm (e.g., "bún bò huế")
- `location` (optional): Tọa độ (lat,lng) mặc định Hà Nội
- `radius` (optional): Bán kính tìm kiếm (meters), mặc định 5000

**Example Request:**
```bash
curl -X GET "http://localhost:5000/api/admin/import/goong/autocomplete?input=cafe" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Example Response:**
```json
{
  "success": true,
  "count": 10,
  "items": [
    {
      "goongPlaceId": "goong_abc123",
      "name": "Cafe Giảng",
      "addressHint": "Nguyễn Hữu Huân, Hoàn Kiếm, Hà Nội"
    },
    ...
  ]
}
```

---

### 2️⃣ **Import Selected Places**

**Endpoint:**
```
POST /api/admin/import/goong
```

**Request Body:**
```json
{
  "placeIds": ["goong_abc123", "goong_def456"]
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:5000/api/admin/import/goong" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "placeIds": ["goong_abc123", "goong_def456"]
  }'
```

**Example Response:**
```json
{
  "success": true,
  "message": "Đã xử lý 2 địa điểm",
  "data": {
    "total": 2,
    "imported": 1,
    "updated": 1,
    "skipped": 0,
    "success": 2,
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

**Giải thích Status:**
- `imported`: Địa điểm mới (chưa tồn tại)
- `updated`: Đã tồn tại → cập nhật dữ liệu từ Goong
- `skipped`: Bỏ qua (không có thay đổi)
- `errors`: Lỗi khi import (invalid data, API fail...)

---

### 3️⃣ **Get Import Statistics**

**Endpoint:**
```
GET /api/admin/import/stats
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "fromGoong": 120,
    "manual": 30,
    "needsEnrich": 80,
    "enriched": 70
  }
}
```

---

### 4️⃣ **Sync Existing Goong Place**

**Endpoint:**
```
POST /api/admin/import/goong/:placeId/sync
```

**Mô tả:** Re-fetch dữ liệu từ Goong cho địa điểm đã import trước đó

**Example Request:**
```bash
curl -X POST "http://localhost:5000/api/admin/import/goong/67.../sync" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

### 5️⃣ **Get Places Needing Enrichment**

**Endpoint:**
```
GET /api/admin/import/goong/needs-enrichment?limit=50
```

**Mô tả:** Lấy danh sách địa điểm có `needsEnrich=true` để AI xử lý

**Example Response:**
```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "_id": "67...",
      "name": "Cafe Giảng",
      "district": "Hoàn Kiếm",
      "category": "Ăn uống"
    }
  ]
}
```

---

### 6️⃣ **Validate Goong API Key**

**Endpoint:**
```
GET /api/admin/import/goong/validate-api-key
```

**Example Response:**
```json
{
  "success": true,
  "valid": true,
  "message": "Goong API key hợp lệ"
}
```

---

## 🧪 Testing với Postman

### Collection Setup

1. **Tạo Collection:** "HANOIGO - Goong Import"

2. **Set Environment Variables:**
   - `base_url`: `http://localhost:5000`
   - `admin_token`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **Test Flow:**

   **Step 1: Autocomplete**
   ```
   GET {{base_url}}/api/admin/import/goong/autocomplete?input=cafe
   Headers:
     Authorization: {{admin_token}}
   ```

   **Step 2: Copy `goongPlaceId` từ response**

   **Step 3: Import**
   ```
   POST {{base_url}}/api/admin/import/goong
   Headers:
     Authorization: {{admin_token}}
     Content-Type: application/json
   Body:
     {
       "placeIds": ["<paste_goongPlaceId_here>"]
     }
   ```

   **Step 4: Verify trong MongoDB**
   ```bash
   mongosh
   use hanoigo-db
   db.places.find({ source: "goong" }).pretty()
   ```

   **Step 5: Import lại cùng placeId → Verify `updated` status**

---

## 📊 Database Schema

### Place Document (sau khi import)

```javascript
{
  "_id": ObjectId("67..."),
  "name": "Cafe Giảng",
  "address": "39 Nguyễn Hữu Huân, Hoàn Kiếm, Hà Nội",
  "district": "Hoàn Kiếm",
  "category": "Ăn uống",
  "description": "Cafe Giảng tọa lạc tại 39 Nguyễn Hữu Huân...",
  
  // GeoJSON location
  "location": {
    "type": "Point",
    "coordinates": [105.8521, 21.0345] // [lng, lat]
  },
  
  // Goong-specific
  "source": "goong",
  "goongPlaceId": "goong_abc123",
  "goong": {
    "lastSyncedAt": ISODate("2026-01-06T..."),
    "rating": 4.5,
    "raw": { /* full Goong response */ }
  },
  
  // Flags
  "needsEnrich": true,
  "status": "Draft",
  "isActive": true,
  
  // Audit
  "createdBy": ObjectId("..."),
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

---

## 🔍 Kiểm tra Duplicate Prevention

### Test Scenario

1. Import place lần 1:
   ```bash
   POST /goong
   Body: { placeIds: ["goong_abc123"] }
   ```
   → Response: `imported: 1`

2. Import lại place đó:
   ```bash
   POST /goong
   Body: { placeIds: ["goong_abc123"] }
   ```
   → Response: `updated: 1` (không tạo duplicate)

3. Verify trong DB:
   ```javascript
   db.places.count({ goongPlaceId: "goong_abc123" })
   // Kết quả: 1 (chỉ 1 document)
   ```

**Cơ chế:** Unique compound index `{ source: 1, goongPlaceId: 1 }`

---

## ❌ Error Handling

### Common Errors

1. **Missing API Key**
   ```json
   {
     "success": false,
     "message": "Goong autocomplete failed: Invalid Goong API key"
   }
   ```
   → **Fix:** Kiểm tra `GOONG_API_KEY` trong `.env`

2. **Invalid Place ID**
   ```json
   {
     "success": false,
     "errors": [
       {
         "placeId": "invalid_id",
         "message": "Place not found: invalid_id"
       }
     ]
   }
   ```

3. **Rate Limit**
   ```json
   {
     "success": false,
     "message": "Goong API rate limit exceeded"
   }
   ```
   → **Fix:** Đợi 1 phút hoặc upgrade Goong plan

---

## 🚀 Next Steps (AI Enrichment)

Sau khi import xong, bạn có thể:

1. **Lấy danh sách cần enrich:**
   ```
   GET /api/admin/import/goong/needs-enrichment
   ```

2. **Gọi AI service để enrich** (implement sau)
   - Auto-generate `description`
   - Extract `aiTags` (mood, space, suitability)
   - Set `priceRange` từ name/category

3. **Mark as enriched:**
   ```
   POST /api/admin/import/goong/:placeId/mark-enriched
   ```

---

## 📝 Checklist Hoàn thành

- [x] Place schema updated với Goong fields
- [x] Unique index (source + goongPlaceId)
- [x] GoongProvider service
- [x] PlaceMapper utility
- [x] PlaceImportService
- [x] AdminImportController
- [x] AdminImportRoutes
- [x] Server.js integration
- [x] .env.example updated
- [ ] Postman testing
- [ ] Admin UI (frontend)

---

## 🐛 Troubleshooting

### Server không khởi động được
```bash
# Check MongoDB connection
mongosh "YOUR_MONGODB_URI"

# Check missing dependencies
npm install
```

### Import không trả về data
```bash
# Check Goong API key
curl "https://rsapi.goong.io/Place/AutoComplete?api_key=YOUR_KEY&input=test"

# Check server logs
npm run dev
# Xem console output
```

---

## 📧 Contact

- **Developer:** HANOIGO Team
- **Goong Support:** https://docs.goong.io
- **GitHub Issues:** [Link to your repo]

---

**Chúc bạn implement thành công! 🎉**
