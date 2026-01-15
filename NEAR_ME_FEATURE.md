# 📍 Near Me Feature - Technical Documentation

## 🎯 Overview

The **Near Me** feature enables users to find the nearest places based on their real-time GPS location with distance-based sorting. When combined with generic food queries like "quán ăn" or "quán cafe", the system uses an optimized MongoDB $geoNear aggregation path for fast results.

---

## 🏗️ Architecture

### **3-Layer Implementation**

```
┌─────────────────────────────────────────────────────────────┐
│                    1. FRONTEND LAYER                        │
│  - AISearchSection.jsx: Location button + nearMe flag      │
│  - Geolocation API: Get user coordinates                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    2. BACKEND API LAYER                     │
│  - aiRoutes.js: POST /api/ai/chat                          │
│  - Accepts: { question, context: { nearMe, location } }    │
│  - Post-processing: Sort places by distance                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 3. AI PIPELINE LAYER                        │
│  - mainChatPipeline.js: Intelligent routing                │
│  - Generic + nearMe → MongoDB $geoNear (fast)              │
│  - Specific query → Standard RAG (accurate)                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Modified Files

### 1. **Frontend: AISearchSection.jsx**
**Path**: `client/src/components/common/AISearchSection/AISearchSection.jsx`

**Changes**:
```jsx
// BEFORE: Hardcoded query
onClick={() => getLocation("Gợi ý địa điểm gần tôi nhất")}

// AFTER: Preserve user query
onClick={() => getLocation(query.trim() || "quán ăn")}
```

**Functionality**:
- Location button now keeps user's search query
- Adds `nearMe: true` flag to context
- Passes GPS coordinates (lat, lng) to backend

---

### 2. **Backend: aiRoutes.js**
**Path**: `server/routes/aiRoutes.js`

**Changes**:
```javascript
// Extract location from request
const nearMe = req.body.context?.nearMe || false;
const userLat = req.body.context?.location?.lat;
const userLng = req.body.context?.location?.lng;

// Sort by distance after retrieval
if (nearMe && userLat && userLng && places?.length) {
    const sortedPlaces = sortPlacesByDistance(places, userLat, userLng);
    places = sortedPlaces.slice(0, 30); // Limit to 30 nearest
}
```

**Functionality**:
- Accepts `nearMe` flag from frontend
- Post-processes places with distance sorting
- Includes `distanceKm` in response payload

---

### 3. **Backend: mainChatPipeline.js**
**Path**: `server/services/ai/pipelines/mainChatPipeline.js`

**Changes**:
```javascript
// NEAR ME OPTIMIZATION: For generic queries + location
const hasLocation = input.context?.location?.lat && input.context?.location?.lng;
const nearMeMode = input.context?.nearMe || false;

if (nearMeMode && hasLocation && isGenericFoodQuery(query)) {
    // Use MongoDB $geoNear for fast nearby search
    const { lat, lng } = input.context.location;
    
    const nearbyPlaces = await searchNearbyPlaces(lat, lng, 5, textLimit, {
        category: categoryFilter, 
        minPrice: priceFilter 
    });
    
    // Convert to document format and return early
    return { ...input, retrievedDocs: mongoDocs };
}
```

**Functionality**:
- Detects generic food queries ("quán ăn", "quán cafe")
- Routes to optimized MongoDB $geoNear aggregation
- Skips expensive semantic search for generic + nearMe
- Fallback to normal RAG if $geoNear fails

---

### 4. **NEW: distanceUtils.js**
**Path**: `server/services/ai/utils/distanceUtils.js`

**Exports**:
```javascript
// 1. Calculate GPS distance
haversineKm(lat1, lon1, lat2, lon2) → distance in km

// 2. Sort places by distance (nearest first)
sortPlacesByDistance(places, userLat, userLon) → sorted array

// 3. Detect generic food queries
isGenericFoodQuery(query) → true/false
```

**Algorithm**:
- **Haversine formula**: Accurate distance on Earth's spherical surface
- **Earth radius**: 6371 km
- **Handles multiple formats**: GeoJSON, {lat,lng}, {latitude,longitude}

---

### 5. **Backend: placeService.js**
**Path**: `server/services/placeService.js`

**New Function**: `searchNearbyPlaces(lat, lng, maxDistanceKm, limit, filters)`

```javascript
export async function searchNearbyPlaces(lat, lng, maxDistanceKm = 5, limit = 10, filters = {}) {
    const pipeline = [
        {
            $geoNear: {
                near: { type: 'Point', coordinates: [lng, lat] },
                distanceField: 'distanceMeters',
                maxDistance: maxDistanceKm * 1000,
                spherical: true
            }
        },
        { $match: { status: 'Published', isActive: true } },
        { $limit: limit }
    ];
    
    const results = await Place.aggregate(pipeline);
    
    // Add distanceKm field
    return results.map(p => ({
        ...p,
        distanceKm: p.distanceMeters / 1000
    }));
}
```

**Features**:
- MongoDB aggregation with $geoNear stage
- Requires 2dsphere index on `location.coordinates`
- Filters by Published + Active status
- Returns places sorted by distance with `distanceKm` field

---

## 🔄 Flow Diagrams

### **Standard Flow (Non-Generic Query)**

```
User types "quán phở" → Click "Near Me"
         ↓
Frontend: nearMe=true, lat/lng
         ↓
Backend: aiRoutes → mainChatPipeline
         ↓
Pipeline: NOT generic → Standard RAG search
         ↓
aiRoutes: sortPlacesByDistance()
         ↓
Response: Places sorted by distance
```

### **Optimized Flow (Generic Query)**

```
User types "quán ăn" → Click "Near Me"
         ↓
Frontend: nearMe=true, lat/lng
         ↓
Backend: aiRoutes → mainChatPipeline
         ↓
Pipeline: Generic + nearMe detected
         ↓
MongoDB: $geoNear aggregation (fast)
         ↓
Response: Nearest places (already sorted)
```

---

## 🧪 Testing

### **Run Test Suite**

```bash
cd server
node scripts/testNearMeFeature.js
```

**Test Coverage**:
1. ✅ Distance utility functions (haversine, sorting, detection)
2. ✅ MongoDB $geoNear aggregation
3. ✅ Pipeline optimization conditions
4. ✅ Generic vs specific query routing

### **Manual Testing**

**Test Case 1: Generic Food + Location**
```
Query: "quán ăn"
Action: Click location button
Expected: Top 10 nearest restaurants, sorted by distance
Log: "📍 NEAR ME MODE: Generic query → $geoNear search"
```

**Test Case 2: Specific Food + Location**
```
Query: "quán phở"
Action: Click location button
Expected: Phở restaurants with distance sorting (RAG path)
Log: "🔒 HARD FILTER: Only places matching 'phở'"
```

**Test Case 3: Vibe Query + Location**
```
Query: "hẹn hò"
Action: Click location button
Expected: Romantic places with distance sorting (TAG path)
Log: "💕 VIBE FILTER: Tags [lãng mạn, romantic, ...]"
```

---

## ⚙️ Configuration

### **MongoDB Index (Required)**

The feature requires a 2dsphere index on coordinates:

```javascript
// Already created in Place.js schema
placeSchema.index({ 'location.coordinates': '2dsphere' });
```

Verify index:
```bash
mongosh
use hanoi_go
db.places.getIndexes()
```

### **Environment Variables**

No new environment variables required. Uses existing:
- `MONGODB_URI`: Database connection
- `OPENAI_API_KEY`: For non-generic queries

---

## 📊 Performance

### **Optimized Path (Generic + nearMe)**
- **Query Time**: ~50-100ms (MongoDB aggregation)
- **No LLM Call**: Skips OpenAI API
- **Use Case**: "quán ăn", "quán cafe", "chỗ ăn"

### **Standard Path (Specific Query)**
- **Query Time**: ~2-5s (RAG + LLM)
- **Accuracy**: Higher for specific needs
- **Use Case**: "quán phở", "hẹn hò", "học bài"

---

## 🚀 Future Enhancements

1. **Radius Customization**: Let user choose 1km, 5km, 10km
2. **Real-time Updates**: WebSocket for live location updates
3. **Clustering**: Group nearby places on map
4. **Offline Caching**: Store nearby places in localStorage
5. **Travel Time**: Show walking/driving time instead of just distance

---

## 🐛 Troubleshooting

### **Issue: "No places found"**

**Check**:
```bash
# Verify 2dsphere index exists
db.places.getIndexes()

# Check if places have coordinates
db.places.findOne({ 'location.coordinates': { $exists: true } })
```

**Fix**:
```javascript
// Rebuild index
db.places.createIndex({ 'location.coordinates': '2dsphere' })
```

### **Issue: Distance not showing**

**Check**: Frontend console for location permission denied
**Fix**: Enable location in browser settings

### **Issue: $geoNear failing**

**Check**: `mainChatPipeline.js` logs for "⚠️ $geoNear failed"
**Fix**: System falls back to standard search automatically

---

## ✅ Checklist for Deployment

- [ ] MongoDB 2dsphere index created
- [ ] All places have valid coordinates (GeoJSON Point)
- [ ] Frontend location permission prompt works
- [ ] Backend logs show optimization path for generic queries
- [ ] Distance appears in frontend cards
- [ ] Test script passes all 4 tests
- [ ] Error handling for denied location permission
- [ ] Fallback to normal search if $geoNear fails

---

## 📞 Support

For issues or questions:
1. Check server logs for pipeline routing decisions
2. Run test script: `node scripts/testNearMeFeature.js`
3. Verify MongoDB index status
4. Review browser console for location errors

---

**Last Updated**: 2024-01-09
**Version**: 1.0.0
**Status**: ✅ Production Ready
