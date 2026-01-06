# ✅ PRE-DEPLOYMENT CHECKLIST

## 📋 Kiểm tra trước khi test/deploy

### 1️⃣ Environment Setup

- [ ] Copy `.env.example` → `.env`
- [ ] Set `GOONG_API_KEY` (lấy từ https://account.goong.io)
- [ ] Set `MONGODB_URI` (MongoDB Atlas hoặc local)
- [ ] Verify tất cả env variables:
  ```bash
  # PowerShell
  cd server
  node -e "require('dotenv').config(); console.log('GOONG_API_KEY:', process.env.GOONG_API_KEY ? 'SET' : 'NOT SET')"
  ```

### 2️⃣ Database

- [ ] MongoDB đang chạy
- [ ] Database `hanoigo-db` đã tạo
- [ ] Collection `users` có admin account:
  ```javascript
  // mongosh
  use hanoigo-db
  db.users.findOne({ role: "admin" })
  ```
  
  **Nếu chưa có admin:**
  ```bash
  # Đăng ký qua API
  curl -X POST http://localhost:5000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@hanoigo.com",
      "password": "admin123",
      "displayName": "Admin"
    }'
  
  # Sau đó update role trong MongoDB
  db.users.updateOne(
    { email: "admin@hanoigo.com" },
    { $set: { role: "admin" } }
  )
  ```

### 3️⃣ Dependencies

- [ ] Install packages:
  ```bash
  cd server
  npm install
  ```

- [ ] Verify axios installed:
  ```bash
  npm list axios
  ```

### 4️⃣ File Structure

Verify các file sau tồn tại:

```
server/
├── models/
│   └── Place.js ✅ (updated với Goong schema)
│
├── services/
│   ├── providers/
│   │   └── goongProvider.js ✅ (NEW)
│   └── imports/
│       └── placeImportService.js ✅ (NEW)
│
├── utils/
│   └── placeMapper.js ✅ (NEW)
│
├── controllers/
│   └── adminImportController.js ✅ (NEW)
│
├── routes/
│   └── adminImportRoutes.js ✅ (NEW)
│
├── server.js ✅ (updated)
├── .env.example ✅ (updated)
│
└── Documentation/
    ├── GOONG_IMPORT_GUIDE.md ✅
    ├── QUICK_TEST.md ✅
    ├── IMPLEMENTATION_SUMMARY.md ✅
    └── Goong_Import.postman_collection.json ✅
```

### 5️⃣ Server Start

- [ ] Khởi động server:
  ```bash
  cd server
  npm run dev
  ```

- [ ] Kiểm tra logs:
  ```
  ✅ 📦 Connected to MongoDB
  ✅ 🚀 Server running on port 5000
  ```

- [ ] Health check:
  ```bash
  curl http://localhost:5000/api/health
  ```
  
  **Expected:**
  ```json
  {
    "success": true,
    "message": "HaNoiGo API is running"
  }
  ```

### 6️⃣ API Testing

#### Test 1: Validate Goong API Key
```bash
# Lấy admin token trước
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hanoigo.com","password":"admin123"}' \
  | jq -r '.token')

# Test API key
curl -X GET "http://localhost:5000/api/admin/import/goong/validate-api-key" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:**
```json
{ "success": true, "valid": true, "message": "Goong API key hợp lệ" }
```

#### Test 2: Autocomplete
```bash
curl -X GET "http://localhost:5000/api/admin/import/goong/autocomplete?input=cafe" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:**
```json
{
  "success": true,
  "count": 10,
  "items": [ ... ]
}
```

#### Test 3: Import Place
```bash
# Copy goongPlaceId từ autocomplete response
curl -X POST "http://localhost:5000/api/admin/import/goong" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "placeIds": ["PASTE_goongPlaceId_HERE"]
  }'
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "imported": 1,
    "updated": 0,
    ...
  }
}
```

#### Test 4: Verify trong MongoDB
```javascript
// mongosh
use hanoigo-db
db.places.findOne({ source: "goong" })
```

**Expected fields:**
- `source: "goong"`
- `goongPlaceId`
- `location.coordinates`
- `needsEnrich: true`

### 7️⃣ Postman Testing (Optional)

- [ ] Import collection: `server/Goong_Import.postman_collection.json`
- [ ] Set variables:
  - `base_url`: `http://localhost:5000`
  - `admin_token`: `Bearer YOUR_TOKEN`
- [ ] Run all requests trong collection

### 8️⃣ Error Scenarios

Test các trường hợp lỗi:

- [ ] **No token:**
  ```bash
  curl http://localhost:5000/api/admin/import/goong/autocomplete?input=test
  ```
  → Expected: 401 Unauthorized

- [ ] **Invalid token:**
  ```bash
  curl -H "Authorization: Bearer invalid_token" \
    http://localhost:5000/api/admin/import/goong/autocomplete?input=test
  ```
  → Expected: 401 Invalid token

- [ ] **Missing input:**
  ```bash
  curl -H "Authorization: Bearer $TOKEN" \
    "http://localhost:5000/api/admin/import/goong/autocomplete"
  ```
  → Expected: 400 Bad Request

- [ ] **Invalid placeId:**
  ```bash
  curl -X POST -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"placeIds": ["invalid_id"]}' \
    http://localhost:5000/api/admin/import/goong
  ```
  → Expected: errors array với message

### 9️⃣ Performance Check

- [ ] Import 10 places cùng lúc:
  ```bash
  # Copy 10 goongPlaceIds từ autocomplete
  curl -X POST -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "placeIds": [
        "id1", "id2", "id3", "id4", "id5",
        "id6", "id7", "id8", "id9", "id10"
      ]
    }' \
    http://localhost:5000/api/admin/import/goong
  ```

- [ ] Kiểm tra response time < 30s

### 🔟 Duplicate Prevention

- [ ] Import place lần 1 → `imported: 1`
- [ ] Import lại cùng place → `updated: 1` (NOT `imported: 1`)
- [ ] Verify trong MongoDB chỉ có 1 document

---

## 🎯 Final Verification

Tất cả phải PASS:

```bash
# 1. Server health
✅ curl http://localhost:5000/api/health

# 2. MongoDB connected
✅ mongosh → use hanoigo-db → db.stats()

# 3. Goong API key valid
✅ curl .../validate-api-key

# 4. Autocomplete works
✅ curl .../autocomplete?input=cafe

# 5. Import works
✅ curl -X POST .../goong với placeIds

# 6. Database updated
✅ mongosh → db.places.count({ source: "goong" }) > 0

# 7. Stats accurate
✅ curl .../stats → fromGoong match MongoDB count
```

---

## 🚀 Ready for Production?

- [ ] All tests passed
- [ ] No console errors
- [ ] MongoDB indexes created
- [ ] Goong API quota checked
- [ ] Error handling verified
- [ ] Documentation reviewed

✅ **Nếu tất cả đều PASS → Sẵn sàng cho Admin UI development!**

---

## 📝 Next Steps

1. **Frontend Admin UI:**
   - Search bar + autocomplete dropdown
   - Checkbox list
   - Import button
   - Stats dashboard

2. **AI Enrichment:**
   - Implement `/api/ai/enrich-place`
   - Auto-generate description
   - Extract semantic tags

3. **Production Deployment:**
   - Environment variables
   - Rate limiting
   - Monitoring

---

## 📞 Troubleshooting

### Server won't start
```bash
# Check MongoDB
mongosh "YOUR_MONGODB_URI"

# Check port
netstat -ano | findstr :5000
# Kill process if needed
taskkill /PID <PID> /F
```

### Goong API errors
```bash
# Test API key directly
curl "https://rsapi.goong.io/Place/AutoComplete?api_key=YOUR_KEY&input=test"
```

### MongoDB connection errors
```bash
# Check URI format
mongodb+srv://username:password@cluster.mongodb.net/hanoigo-db

# Whitelist IP in MongoDB Atlas
```

---

**Good luck! 🍀**
