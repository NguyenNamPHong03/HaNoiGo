# 🗺️ GOONG AUTO IMPORT MODULE

> Tự động import địa điểm từ Goong Maps API vào MongoDB cho HANOIGO

## 🎯 Tổng quan

Module này cho phép Admin dễ dàng import địa điểm (quán ăn, cafe, vui chơi) từ **Goong Maps API** vào database mà không cần nhập thủ công từng field.

**Workflow:**
1. Admin search keyword → Goong trả về gợi ý
2. Admin tick chọn → Backend fetch chi tiết & lưu MongoDB
3. AI enrich sau (optional)

---

## 📚 Documentation

| File | Mục đích |
|------|----------|
| **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** | Tổng quan implementation |
| **[GOONG_IMPORT_GUIDE.md](./GOONG_IMPORT_GUIDE.md)** | Hướng dẫn API đầy đủ |
| **[QUICK_TEST.md](./QUICK_TEST.md)** | Test nhanh trong 5 phút |
| **[PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md)** | Checklist trước deploy |
| **[Goong_Import.postman_collection.json](./Goong_Import.postman_collection.json)** | Postman collection |

**Đọc thứ tự:**
1. `IMPLEMENTATION_SUMMARY.md` - Hiểu tổng quan
2. `QUICK_TEST.md` - Test ngay
3. `GOONG_IMPORT_GUIDE.md` - Đọc chi tiết API
4. `PRE_DEPLOYMENT_CHECKLIST.md` - Trước khi deploy

---

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Copy .env.example → .env
cp .env.example .env

# Edit .env và add:
GOONG_API_KEY=your-goong-api-key  # Lấy tại https://account.goong.io
MONGODB_URI=mongodb+srv://...
```

### 2. Install & Run

```bash
npm install
npm run dev
```

### 3. Test

```bash
# Health check
curl http://localhost:5000/api/health

# Validate Goong API key
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:5000/api/admin/import/goong/validate-api-key
```

**Chi tiết:** Xem [QUICK_TEST.md](./QUICK_TEST.md)

---

## 🔌 API Endpoints

**Base:** `http://localhost:5000/api/admin/import`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/goong/autocomplete?input=cafe` | GET | Lấy gợi ý địa điểm |
| `/goong` | POST | Import places đã chọn |
| `/stats` | GET | Thống kê import |
| `/goong/:id/sync` | POST | Re-sync từ Goong |
| `/goong/needs-enrichment` | GET | Places cần AI enrich |

**Chi tiết:** Xem [GOONG_IMPORT_GUIDE.md](./GOONG_IMPORT_GUIDE.md)

---

## 📁 File Structure

```
server/
├── models/
│   └── Place.js                      ✅ Updated
│
├── services/
│   ├── providers/
│   │   └── goongProvider.js          🆕 Goong API client
│   └── imports/
│       └── placeImportService.js     🆕 Import logic
│
├── utils/
│   └── placeMapper.js                🆕 Data mapping
│
├── controllers/
│   └── adminImportController.js      🆕 Request handlers
│
├── routes/
│   └── adminImportRoutes.js          🆕 API routes
│
└── server.js                          ✅ Updated
```

---

## 🧪 Testing

### Với curl
```bash
# Xem QUICK_TEST.md
```

### Với Postman
```bash
# Import collection
1. Mở Postman
2. Import → File → Goong_Import.postman_collection.json
3. Set variables: base_url, admin_token
4. Run collection
```

---

## 📊 Database Schema

### Place Document

```javascript
{
  name: "Cafe Giảng",
  address: "39 Nguyễn Hữu Huân, Hoàn Kiếm, Hà Nội",
  district: "Hoàn Kiếm",
  category: "Ăn uống",
  
  // GeoJSON location
  location: {
    type: "Point",
    coordinates: [105.8521, 21.0345]  // [lng, lat]
  },
  
  // Goong metadata
  source: "goong",
  goongPlaceId: "goong_ChIJxxxxx",
  goong: {
    lastSyncedAt: ISODate("2026-01-06..."),
    rating: 4.5,
    raw: { /* full Goong response */ }
  },
  
  // AI enrichment
  needsEnrich: true,
  
  // Status
  status: "Draft",
  isActive: true
}
```

**Index:** `{ source: 1, goongPlaceId: 1 }` (unique) → Prevent duplicates

---

## ✅ Features

- [x] ✨ Autocomplete từ Goong API
- [x] 📥 Batch import nhiều places
- [x] 🔄 Upsert logic (update nếu đã tồn tại)
- [x] 🚫 Duplicate prevention
- [x] 🗺️ GeoJSON location format
- [x] 🤖 Auto-detect district & category
- [x] 📊 Import statistics
- [x] 🔄 Re-sync existing places
- [x] 🛡️ Admin authentication
- [x] 📝 Full documentation

---

## 🎓 Tech Stack

- **Goong API:** Autocomplete + Place Detail
- **MongoDB:** Database với geospatial indexes
- **Express.js:** REST API
- **Mongoose:** ODM với unique compound index

---

## 🐛 Troubleshooting

### "Invalid Goong API key"
→ Kiểm tra `GOONG_API_KEY` trong `.env`

### "Admin access required"
→ User phải có `role: "admin"` trong MongoDB

### Duplicate key error
→ Đã có place với cùng `goongPlaceId` (expected - sẽ update)

**Chi tiết:** Xem [PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md) → Troubleshooting

---

## 📈 Next Steps

### Phase 2: AI Enrichment
- [ ] Auto-generate description với OpenAI
- [ ] Extract semantic tags (mood, space, suitability)
- [ ] Estimate price range

### Phase 3: Admin UI
- [ ] Search bar với autocomplete dropdown
- [ ] Checkbox list với preview
- [ ] Import button + loading state
- [ ] Stats dashboard

### Phase 4: Advanced
- [ ] Goong Photo API integration
- [ ] Bulk import nhiều keywords
- [ ] Schedule auto-sync (cron)
- [ ] Export to CSV

---

## 🤝 Contributing

**Code structure:**
- Follow MVC + Service layer pattern
- Controller → Service → Provider/Model
- Error handling với try-catch + detailed errors
- Validate input ở Controller level

**Testing:**
- Unit test cho utilities (placeMapper)
- Integration test cho services
- E2E test cho API endpoints

---

## 📞 Support

- **Goong API Docs:** https://docs.goong.io
- **MongoDB Geospatial:** https://docs.mongodb.com/manual/geospatial-queries/
- **Project Issues:** [GitHub Issues]

---

## 📄 License

MIT License - HANOIGO Project

---

## 👥 Authors

**HANOIGO Team**  
Implementation: 06/01/2026

---

**🎉 Happy Importing!**
