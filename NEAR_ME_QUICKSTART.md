# 🚀 Near Me Feature - Quick Start Guide

## For Developers

### 🎯 What This Feature Does
User clicks "📍 Tìm quanh đây" → System returns nearest places sorted by distance, with special optimization for generic queries like "quán ăn".

---

## 📁 Key Files to Know

```
client/src/components/common/AISearchSection/
└── AISearchSection.jsx          # Location button UI

server/
├── routes/
│   └── aiRoutes.js              # API endpoint with distance sorting
├── services/
│   ├── placeService.js          # searchNearbyPlaces() function
│   └── ai/
│       ├── pipelines/
│       │   └── mainChatPipeline.js  # Routing logic
│       └── utils/
│           └── distanceUtils.js      # Distance calculations
└── scripts/
    └── testNearMeFeature.js     # Test suite
```

---

## 🔧 How to Test Locally

### 1. Run Test Suite
```bash
cd server
node scripts/testNearMeFeature.js
```

**Expected Output**:
```
✅ Distance utilities test passed
✅ Found 10 places within 5km
✅ Results are correctly sorted by distance
✅ Pipeline will use $geoNear optimization path
✅ All tests completed!
```

---

### 2. Frontend Testing

```bash
# Terminal 1: Start backend
cd server
npm start

# Terminal 2: Start frontend
cd client
npm run dev
```

**Steps**:
1. Open http://localhost:5173
2. Type "quán ăn" in search box
3. Click "📍 Tìm quanh đây" button
4. Allow location permission
5. Verify:
   - ✅ Nearest places appear first
   - ✅ Distance shown (e.g., "1.2km")
   - ✅ Results load fast (~100ms)

---

## 🐛 Debugging

### Check Backend Logs

**For generic queries** ("quán ăn", "quán cafe"):
```
📍 NEAR ME MODE: Generic query "quán ăn" → $geoNear search
✅ Found 10 nearby places
```

**For specific queries** ("quán phở"):
```
🔒 HARD FILTER: Only places matching "phở"
📍 Sorting places by distance (lat: 21.0285, lng: 105.8542)
```

**For vibe queries** ("hẹn hò"):
```
💕 VIBE FILTER: Tags [lãng mạn, romantic, riêng tư]
📍 Sorting places by distance
```

---

### Common Issues

#### ❌ "No places found"
**Cause**: Missing MongoDB 2dsphere index

**Fix**:
```bash
mongosh
use hanoi_go
db.places.createIndex({ 'location.coordinates': '2dsphere' })
```

#### ❌ Location button not working
**Cause**: Browser location permission denied

**Fix**: 
1. Click lock icon in address bar
2. Change "Location" to "Allow"
3. Refresh page

#### ❌ Distance not appearing
**Cause**: Frontend not receiving `distanceKm` field

**Check**:
```javascript
// In browser console
console.log(response.places[0]) // Should have distanceKm property
```

---

## 🧪 Testing Checklist

### Backend Tests
- [ ] Run `node scripts/testNearMeFeature.js` → All pass
- [ ] Check MongoDB index exists
- [ ] Verify places have coordinates

### Frontend Tests
- [ ] Location button preserves query
- [ ] Distance appears in UI
- [ ] Nearest places show first
- [ ] Works without location (fallback)

### Integration Tests
- [ ] Generic query → Fast response (~100ms)
- [ ] Specific query → Accurate results (with distance)
- [ ] Vibe query → Tag-based + distance
- [ ] Error handling works

---

## 💡 Code Examples

### Call API from Frontend
```javascript
const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        question: "quán ăn",
        context: {
            nearMe: true,
            location: {
                lat: 21.0285,
                lng: 105.8542
            }
        }
    })
});

const data = await response.json();
// data.places[0].distanceKm = 1.2
```

### Sort Places by Distance
```javascript
import { sortPlacesByDistance } from './services/ai/utils/distanceUtils.js';

const sorted = sortPlacesByDistance(places, userLat, userLng);
// sorted[0] is nearest, sorted[n-1] is farthest
```

### Check if Generic Query
```javascript
import { isGenericFoodQuery } from './services/ai/utils/distanceUtils.js';

isGenericFoodQuery("quán ăn")  // true
isGenericFoodQuery("quán cafe") // true
isGenericFoodQuery("quán phở")  // false (specific)
```

---

## 📊 Performance Benchmarks

| Query Type | nearMe | Performance | Path Used |
|------------|--------|-------------|-----------|
| "quán ăn" | ✅ | ~50-100ms | MongoDB $geoNear |
| "quán ăn" | ❌ | ~4-6s | Standard RAG |
| "quán phở" | ✅ | ~2-5s | RAG + distance sort |
| "hẹn hò" | ✅ | ~2-5s | Tag search + distance |

---

## 🔄 Query Flow Diagram

```
User Input: "quán ăn" + 📍 Click
         ↓
   isGenericFoodQuery?
    ↙YES        NO↘
$geoNear      RAG Search
 (fast)      + Distance Sort
   ↓               ↓
Return     Return sorted
sorted       places
places
   ↓___________↓
       Frontend
    (Display with
      distance)
```

---

## 📚 Related Documentation

- **Full Docs**: [NEAR_ME_FEATURE.md](./NEAR_ME_FEATURE.md)
- **Summary**: [NEAR_ME_SUMMARY.md](./NEAR_ME_SUMMARY.md)
- **Test Script**: [server/scripts/testNearMeFeature.js](./server/scripts/testNearMeFeature.js)

---

## 🎯 Quick Commands

```bash
# Run all tests
node scripts/testNearMeFeature.js

# Check MongoDB index
mongosh -u <user> -p <pass>
use hanoi_go
db.places.getIndexes()

# View distance calculation
node -e "import('./services/ai/utils/distanceUtils.js').then(m => console.log(m.haversineKm(21.0285, 105.8542, 21.0245, 105.8412)))"

# Test searchNearbyPlaces
node -e "import('./services/placeService.js').then(m => m.searchNearbyPlaces(21.0285, 105.8542, 5, 10).then(console.log))"
```

---

**Status**: ✅ Ready for Use
**Last Updated**: 2024-01-09
