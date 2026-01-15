# 🎯 Intent Classification Fix - Phân biệt FOOD vs VIBE vs ACTIVITY

## 📋 Tổng Quan Vấn Đề

### ❌ **LỖI CŨ**
```
Query: "Nhà hàng lãng mạn cho buổi hẹn hò ở Hà Nội"
AI xử lý: "hẹn hò" = tên quán (entity) 
→ Tìm places có name CHỨA "hẹn hò"
→ Không tìm thấy → trả về rỗng
```

### ✅ **LOGIC ĐÚNG**
```
Query: "Nhà hàng lãng mạn cho buổi hẹn hò ở Hà Nội"
AI xử lý: "hẹn hò" = VIBE/MOOD (intent)
→ Tìm places có TAGS: ["lãng mạn", "romantic", "riêng tư", "ấm cúng"]
→ Trả về quán có không khí phù hợp
```

---

## 🎯 3 Loại Intent

| Intent Type | Ví dụ | Cách Xử Lý | Filter Type |
|------------|-------|------------|-------------|
| **🍜 FOOD_ENTITY** | phở, bún chả, lẩu | Tìm theo **KEYWORD** trong name/description | **HARD** filter (must match) |
| **💕 PLACE_VIBE** | hẹn hò, lãng mạn, chill, học bài | Tìm theo **TAGS/MOOD** | **SOFT** filter (aiTags) |
| **🎵 ACTIVITY** | karaoke, xem bóng đá, live music | Tìm theo **ACTIVITY** type | **TAG** filter |

---

## 🔄 Luồng Xử Lý Mới

```mermaid
graph TD
    A[User Query] --> B{Intent Classifier}
    
    B -->|"phở"| C[FOOD_ENTITY]
    B -->|"hẹn hò"| D[PLACE_VIBE]
    B -->|"karaoke"| E[ACTIVITY]
    B -->|Other| F[GENERAL]
    
    C --> C1[Hard Keyword Filter]
    C1 --> C2[name/description CONTAINS "phở"]
    
    D --> D1[Tag/Mood Filter]
    D1 --> D2[aiTags.mood IN romantic, riêng tư]
    
    E --> E1[Activity Filter]
    E1 --> E2[aiTags/category = activity type]
    
    F --> F1[General Text Search]
    
    C2 & D2 & E2 & F1 --> G[MongoDB Query]
    G --> H[Results]
```

---

## 📁 Files Thay Đổi

### 1️⃣ **NEW**: `intentClassifier.js`
Thay thế `foodKeywordExtractor.js` với logic phân loại 3 intent:

```javascript
classify(query) {
  // Priority 1: FOOD_ENTITY
  if (detectFood(query)) {
    return { intent: 'FOOD_ENTITY', mustQuery: hardFilter };
  }
  
  // Priority 2: ACTIVITY
  if (detectActivity(query)) {
    return { intent: 'ACTIVITY', tags: activityTags };
  }
  
  // Priority 3: PLACE_VIBE
  if (detectVibe(query)) {
    return { intent: 'PLACE_VIBE', tags: vibeTags };
  }
  
  return { intent: 'GENERAL' };
}
```

**Vibe Mapping:**
```javascript
vibeToTagsMap = {
  'hẹn hò': ['lãng mạn', 'romantic', 'riêng tư', 'ấm cúng'],
  'chill': ['chill', 'thư giãn', 'relax', 'yên tĩnh'],
  'học bài': ['yên tĩnh', 'study-friendly', 'wifi', 'ổ điện']
}
```

### 2️⃣ **UPDATED**: `placeService.js`
Thêm function mới:

```javascript
/**
 * Search by vibe/mood tags (for PLACE_VIBE intent)
 */
export const searchPlacesByVibe = async (tags, limit = 10) => {
  const query = {
    $or: [
      { 'aiTags.mood': { $in: tags } },
      { 'aiTags.space': { $in: tags } },
      { 'aiTags.suitability': { $in: tags } },
      { description: { $in: tagRegexes } }
    ]
  };
  
  return await Place.find(query).limit(limit).lean();
};
```

### 3️⃣ **UPDATED**: `mainChatPipeline.js`
Intent-aware retrieval:

```javascript
const queryIntent = input.queryIntent || 'GENERAL';

if (queryIntent === 'FOOD_ENTITY') {
  // HARD keyword filter
  promises.push(searchPlaces(query, limit, category, price, mustQuery));
  
} else if (queryIntent === 'PLACE_VIBE') {
  // TAG/MOOD filter
  const vibeTags = input.queryTags || [];
  promises.push(searchPlacesByVibe(vibeTags, limit, category, price));
  
} else if (queryIntent === 'ACTIVITY') {
  // Activity filter
  promises.push(searchPlacesByVibe(activityTags, limit, category, price));
  
} else {
  // GENERAL text search
  promises.push(searchPlaces(query, limit, category, price));
}
```

### 4️⃣ **UPDATED**: `rag_query.v1.txt`
Thêm rules cho 3 loại query:

```
2. **PHÂN BIỆT 3 LOẠI QUERY:**
   
   🍜 A. MÓN ĂN CỤ THỂ (phở, bún chả...):
   - Keyword cứng → CHỈ gợi ý quán có tên chứa từ đó
   
   💕 B. KHÔNG KHÍ/MỤC ĐÍCH (hẹn hò, lãng mạn, chill...):
   - VIBE/MOOD → Tìm theo TAG và ĐẶC ĐIỂM
   - "hẹn hò" KHÔNG PHẢI là tên quán, mà là ý định sử dụng
   
   🎵 C. HOẠT ĐỘNG (karaoke, xem bóng đá...):
   - Tìm theo loại hình hoạt động
```

---

## 🧪 Test Cases

### ✅ Test 1: Food Entity
```bash
Query: "phở"
Expected Intent: FOOD_ENTITY
Expected Filter: name/description CONTAINS "phở"
Expected Results: Phở Thìn, Phở Gà, Phở Cuốn
```

### ✅ Test 2: Place Vibe (Critical Fix)
```bash
Query: "Nhà hàng lãng mạn cho buổi hẹn hò ở Hà Nội"
Expected Intent: PLACE_VIBE
Expected Filter: aiTags.mood IN ["lãng mạn", "romantic", "riêng tư", "ấm cúng"]
Expected Results: Quán có không gian lãng mạn (không cần tên chứa "hẹn hò")
```

### ✅ Test 3: Activity
```bash
Query: "quán có karaoke"
Expected Intent: ACTIVITY
Expected Filter: aiTags/category = "karaoke"
Expected Results: Quán có phòng karaoke
```

### ✅ Test 4: General
```bash
Query: "quán ngon ở Ba Đình"
Expected Intent: GENERAL
Expected Filter: Text search "quán ngon" + district filter
Expected Results: Các quán ở Ba Đình
```

---

## 📊 So Sánh Logic Cũ vs Mới

| Aspect | Logic Cũ (❌) | Logic Mới (✅) |
|--------|--------------|--------------|
| **"phở"** | Text search "phở" | HARD filter: name CONTAINS "phở" |
| **"hẹn hò"** | ❌ Text search "hẹn hò" → rỗng | ✅ Tag filter: ["lãng mạn", "romantic"] |
| **Priority** | Single layer | 3-tier: FOOD > ACTIVITY > VIBE |
| **Fallback** | Không rõ ràng | GENERAL search nếu không match |

---

## 🔍 Debug Commands

### Check Intent Classification
```bash
# Log sẽ hiện:
🎯 Query Intent: PLACE_VIBE
💕 VIBE MODE: "hẹn hò" → TAG FILTER [lãng mạn, romantic, riêng tư, ấm cúng]
```

### Verify MongoDB Query
```javascript
// FOOD_ENTITY
{ $or: [
  { name: /\bphở\b/i },
  { description: /\bphở\b/i }
]}

// PLACE_VIBE
{ $or: [
  { 'aiTags.mood': { $in: ['lãng mạn', 'romantic'] }},
  { 'aiTags.space': { $in: ['riêng tư', 'ấm cúng'] }}
]}
```

---

## 🚨 Quan Trọng: Khi Nào Dùng Intent Nào?

### 🍜 FOOD_ENTITY
- **Dấu hiệu**: Món ăn cụ thể
- **Keyword**: phở, bún, lẩu, pizza, cafe...
- **Logic**: Phải có từ đó trong tên hoặc mô tả

### 💕 PLACE_VIBE
- **Dấu hiệu**: Mục đích/không khí
- **Keyword**: hẹn hò, lãng mạn, chill, yên tĩnh, học bài...
- **Logic**: Tìm theo mood/tag, KHÔNG phải tên

### 🎵 ACTIVITY
- **Dấu hiệu**: Hoạt động cụ thể
- **Keyword**: karaoke, xem bóng đá, live music...
- **Logic**: Tìm theo activity type

---

## ✅ Kết Quả Mong Đợi

### Trước Fix:
```
Query: "Nhà hàng lãng mạn cho buổi hẹn hò"
Result: ❌ Không tìm thấy địa điểm nào
```

### Sau Fix:
```
Query: "Nhà hàng lãng mạn cho buổi hẹn hò"
Result: ✅ 5-10 nhà hàng có không gian lãng mạn, riêng tư, view đẹp
AI: "Dưới đây là những quán lãng mạn phù hợp cho buổi hẹn hò của bạn nè 💕..."
```

---

## 📝 Notes

1. **Priority Order**: FOOD > ACTIVITY > VIBE > GENERAL
2. **Short Queries**: Queries < 60 chars → Apply intent filter
3. **Long Queries**: Queries > 60 chars → Might be ITINERARY mode
4. **Vibe Mapping**: Có thể thêm mapping trong `intentClassifier.js`

---

**Tác giả**: HanoiGo AI Team  
**Ngày**: 2026-01-16  
**Version**: 2.0 (Intent Classification)
