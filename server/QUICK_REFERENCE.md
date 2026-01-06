# ⚡ GOONG IMPORT - QUICK REFERENCE

> **Cheat sheet 1 trang để copy-paste nhanh**

---

## 🔑 Environment Setup

```bash
# .env
GOONG_API_KEY=your-actual-goong-api-key
GOONG_DEFAULT_LOCATION=21.0278,105.8342
GOONG_DEFAULT_RADIUS=5000
```

---

## 🚀 Start Server

```bash
cd server
npm run dev
```

---

## 🔐 Get Admin Token

```bash
# PowerShell
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@hanoigo.com","password":"admin123"}'
$TOKEN = $response.token

# Bash
export TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hanoigo.com","password":"admin123"}' \
  | jq -r '.token')
```

---

## 📡 API Quick Commands

### 1. Validate API Key
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/import/goong/validate-api-key
```

### 2. Autocomplete
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/admin/import/goong/autocomplete?input=cafe"
```

### 3. Import Places
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"placeIds":["PASTE_PLACE_ID_HERE"]}' \
  http://localhost:5000/api/admin/import/goong
```

### 4. Get Stats
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/import/stats
```

### 5. Needs Enrichment
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/admin/import/goong/needs-enrichment?limit=10"
```

---

## 🗄️ MongoDB Quick Queries

```javascript
// Connect
mongosh "YOUR_MONGODB_URI"
use hanoigo-db

// Find Goong places
db.places.find({ source: "goong" }).pretty()

// Count by source
db.places.countDocuments({ source: "goong" })
db.places.countDocuments({ source: "manual" })

// Places needing enrichment
db.places.find({ needsEnrich: true }).count()

// Check indexes
db.places.getIndexes()

// Find duplicates (should be 0)
db.places.aggregate([
  { $match: { source: "goong" } },
  { $group: { _id: "$goongPlaceId", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])
```

---

## 🧪 Test Workflow

```bash
# 1. Health check
curl http://localhost:5000/api/health

# 2. Get token (see above)

# 3. Validate Goong key
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/import/goong/validate-api-key

# 4. Search
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/admin/import/goong/autocomplete?input=bun bo hue"

# 5. Copy goongPlaceId from response

# 6. Import
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"placeIds":["<PASTE_HERE>"]}' \
  http://localhost:5000/api/admin/import/goong

# 7. Verify in MongoDB
mongosh
use hanoigo-db
db.places.findOne({ source: "goong" })

# 8. Import again (same placeId) → should update, not duplicate

# 9. Check stats
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/import/stats
```

---

## 📂 File Locations

```
server/
├── services/providers/goongProvider.js       ← Goong API client
├── services/imports/placeImportService.js    ← Import logic
├── utils/placeMapper.js                      ← Data mapping
├── controllers/adminImportController.js      ← API handlers
├── routes/adminImportRoutes.js               ← Routes
├── models/Place.js                           ← Schema (updated)
└── server.js                                 ← Mount routes (updated)

Documentation/
├── GOONG_MODULE_README.md                    ← Start here
├── QUICK_TEST.md                             ← Testing guide
├── GOONG_IMPORT_GUIDE.md                     ← Full API docs
├── PRE_DEPLOYMENT_CHECKLIST.md               ← Deployment
├── IMPLEMENTATION_SUMMARY.md                 ← Overview
├── CHANGES_LOG.md                            ← All changes
└── Goong_Import.postman_collection.json      ← Postman
```

---

## 🔍 Troubleshooting Quick Fixes

### "Invalid token"
```bash
# Get new token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hanoigo.com","password":"admin123"}' \
  | jq -r '.token')
```

### "Admin access required"
```javascript
// MongoDB - make user admin
db.users.updateOne(
  { email: "admin@hanoigo.com" },
  { $set: { role: "admin" } }
)
```

### "Goong API key invalid"
```bash
# Check .env
cat .env | grep GOONG_API_KEY

# Test directly
curl "https://rsapi.goong.io/Place/AutoComplete?api_key=YOUR_KEY&input=test"
```

### Server won't start
```bash
# Check port
netstat -ano | findstr :5000

# Kill process (Windows)
taskkill /PID <PID> /F

# Restart
npm run dev
```

---

## 📊 Response Format Examples

### Autocomplete
```json
{
  "success": true,
  "count": 10,
  "items": [
    {
      "goongPlaceId": "goong_ChIJxxxxx",
      "name": "Cafe Giảng",
      "addressHint": "Nguyễn Hữu Huân, Hoàn Kiếm, Hà Nội"
    }
  ]
}
```

### Import
```json
{
  "success": true,
  "message": "Đã xử lý 2 địa điểm",
  "data": {
    "total": 2,
    "imported": 1,    ← NEW places
    "updated": 1,     ← EXISTING places (updated)
    "skipped": 0,
    "success": 2,
    "errors": [],
    "places": [ ... ]
  }
}
```

### Stats
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

## 🎯 Expected Behavior

| Action | First Time | Second Time |
|--------|-----------|-------------|
| Import same place | `imported: 1` | `updated: 1` |
| MongoDB count | +1 | No change (still 1) |
| Response success | `true` | `true` |

---

## 📞 Quick Links

- **Goong Dashboard:** https://account.goong.io
- **Goong API Docs:** https://docs.goong.io
- **MongoDB Atlas:** https://cloud.mongodb.com

---

## ⚙️ Common Commands

```bash
# Restart server
npm run dev

# Check logs
# (Xem terminal output)

# Connect MongoDB
mongosh "YOUR_MONGODB_URI"

# Import Postman collection
# File → Import → Goong_Import.postman_collection.json

# Run all Postman tests
# Collections → Goong Import → Run
```

---

## 🎓 Key Concepts

**Autocomplete** = Search suggestions (preview)  
**Import** = Fetch detail + save to MongoDB  
**Upsert** = Update if exists, create if not  
**needsEnrich** = Flag for AI processing later  
**goongPlaceId** = Unique ID từ Goong (dùng để check duplicates)

---

**Print & stick này lên màn hình! 📌**
