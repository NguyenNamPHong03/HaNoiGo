# 🍜 Food Keyword Filter - Fix AI Gợi Ý Sai Món Ăn

## 🎯 Vấn Đề (Problem)

Khi user hỏi "phở", AI lại gợi ý các món khác như "xôi", "pub", "bún chả"... vì:
1. **Retrieval quá rộng**: Vector search cho kết quả "gần đúng" về semantic nhưng không chính xác keyword
2. **Không có hard constraint**: MongoDB query không bắt buộc chứa từ khóa món ăn
3. **LLM hallucination**: AI có thể tự bịa gợi ý ngoài candidates

## ✅ Giải Pháp (Solution)

### 1️⃣ **Food Keyword Detector** (NEW)
**File**: `server/services/ai/retrieval/extractors/foodKeywordExtractor.js`

**Chức năng**:
- Detect món ăn từ query user (phở, bún chả, xôi, lẩu...)
- Build MongoDB hard filter `$or` query để PHẢI chứa keyword trong:
  - `name` (tên quán)
  - `description` (mô tả)
  - `address` (địa chỉ)
  - `category` (danh mục)
  - `aiTags.*` (semantic tags)
  - `ai.reviewsText` (reviews tổng hợp)

**Logic**:
```javascript
// Query: "phở"
const mustQuery = {
  $or: [
    { name: /\bphở\b/i },
    { description: /\bphở\b/i },
    { category: /\bphở\b/i },
    // ... các fields khác
  ]
};
```

**Kết quả**: CHỈ lấy places có từ "phở" trong dữ liệu → loại bỏ xôi, pub, bún...

### 2️⃣ **MongoDB Service Update**
**File**: `server/services/placeService.js`

**Thay đổi**:
- `searchPlaces()`: Thêm param `mustQuery` (optional)
- `searchPlacesByRegex()`: Thêm param `mustQuery` (optional)

**Cách dùng**:
```javascript
// Trước
await searchPlaces(query, 10, category, minPrice);

// Sau
await searchPlaces(query, 10, category, minPrice, foodMustQuery);
```

### 3️⃣ **Pipeline Integration**
**File**: `server/services/ai/pipelines/mainChatPipeline.js`

**Thêm Stage mới**:
```javascript
// Stage 2.6: Food Keyword Detection
const detectFoodKeyword = async (input) => {
  const foodData = foodKeywordExtractor.extract(input.question);
  
  if (foodData.isFoodQuery) {
    logger.info(`🍜 FOOD MODE: "${foodData.keyword}"`);
    return {
      ...input,
      foodMode: true,
      foodKeyword: foodData.keyword,
      foodMustQuery: foodData.mustQuery // Hard filter
    };
  }
  
  return input;
};
```

**Thứ tự pipeline**:
1. Input Guard
2. Semantic Cache
3. Query Rewrite
4. Intent Classification
5. **🍜 Food Keyword Detection** (NEW)
6. Vector Retrieval
7. MongoDB Keyword Augmentation (apply `foodMustQuery` here)
8. Rerank
9. Local Reorder
10. LLM Generation

### 4️⃣ **Prompt Update**
**File**: `server/services/ai/prompts/templates/rag_query.v1.txt`

**Quy tắc mới**:
```
🚨 QUY TẮC NGHIÊM NGẶT:

1. TUYỆT ĐỐI CHỈ GỢI Ý TỪ DANH SÁCH CANDIDATES
   - KHÔNG tự bịa địa điểm ngoài {context}
   - Nếu không có → nói rõ "không tìm thấy"

2. CHÍNH XÁC KEYWORD MÓN ĂN
   - User hỏi "phở" → CHỈ gợi ý quán phở
   - KHÔNG gợi ý món "gần đúng" (xôi, pub...)

3. KHI CANDIDATES RỖNG
   - Trả lời: "Mình chưa tìm thấy quán [món] nào..."
   - Gợi ý mở rộng tiêu chí
```

## 📊 Luồng Hoạt Động (Flow)

```mermaid
graph TD
    A[User: "phở"] --> B[detectFoodKeyword]
    B --> C{Is Food Query?}
    C -- YES --> D[foodKeyword = "phở"]
    D --> E[Build mustQuery]
    E --> F[MongoDB Hard Filter]
    F --> G[ONLY places with "phở"]
    G --> H[Rerank Top Results]
    H --> I[LLM Generation]
    I --> J[Response: Phở places only ✅]
    
    C -- NO --> K[Normal Retrieval]
    K --> H
```

## 🧪 Test Cases

### ✅ Test 1: Món Ăn Cụ Thể
**Input**: "phở"
**Expected**:
- `foodMode: true`
- `foodKeyword: "phở"`
- MongoDB filter: `{ $or: [{ name: /\bphở\b/i }, ...] }`
- **Output**: CHỈ quán phở

### ✅ Test 2: Món Ăn Dài
**Input**: "bún chả"
**Expected**:
- Detect "bún chả" (không phải "bún" riêng)
- Filter chính xác "bún chả"

### ✅ Test 3: Không Phải Food Query
**Input**: "lên lịch trình đi chơi Cầu Giấy"
**Expected**:
- `foodMode: false`
- Retrieval bình thường (không hard filter)

### ✅ Test 4: Không Có Kết Quả
**Input**: "sushi ngon"
**Expected**:
- Hard filter active
- MongoDB returns 0 places
- LLM: "Mình chưa tìm thấy quán sushi nào trong hệ thống nè 😅"

## 🎯 Điểm Mấu Chốt (Key Points)

1. **Hard Filter BEFORE Rerank**: Lọc cứng trước khi LLM nhìn thấy
2. **Keyword Must Match**: PHẢI chứa từ khóa trong dữ liệu thực tế
3. **LLM Constraint**: Prompt khóa chặt không cho bịa
4. **Graceful Fallback**: Nếu 0 results → nói rõ + gợi ý mở rộng

## 📝 Checklist Deploy

- [x] Tạo `foodKeywordExtractor.js`
- [x] Update `placeService.js` (thêm param `mustQuery`)
- [x] Sửa `mainChatPipeline.js` (thêm stage + apply filter)
- [x] Update prompt `rag_query.v1.txt` (quy tắc nghiêm ngặt)
- [ ] Test với queries: "phở", "bún chả", "xôi", "lẩu"
- [ ] Verify logs: `🍜 FOOD MODE ACTIVATED` + `🔒 HARD FILTER ACTIVE`
- [ ] Check MongoDB query có `$or` filter

## 🚀 Kết Quả Mong Đợi

**Trước**:
```
User: "phở"
AI: Gợi ý xôi Yến, Mutt A Pub, bún đậu... ❌
```

**Sau**:
```
User: "phở"
AI: 
🍜 Phở Thìn - 50k - Phở bò truyền thống
🍜 Phở Gà Hà Nội - 40k - Phở gà nước trong
🍜 Phở Cuốn Ngũ Xã - 60k - Đặc sản Hà Nội ✅
```

---
**Created**: 2026-01-16  
**Author**: GitHub Copilot  
**Priority**: CRITICAL - Fix gợi ý sai món ăn
