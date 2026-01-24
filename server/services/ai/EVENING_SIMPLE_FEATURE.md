# 🌙 Tính năng: Lịch trình Buổi tối (Evening Itinerary)

## 📋 Tổng quan

Tính năng cho phép AI tạo **lịch trình buổi tối ngắn gọn** (3 hoạt động) với 2 phong cách khác nhau:
- **EVENING_SIMPLE**: Đơn giản, nhanh gọn (Fast food → Cafe → Dạo hồ)
- **EVENING_FANCY**: Chỉnh chu, tươm tất (Lẩu/Buffet → Karaoke → Hotel)

Thay vì lịch trình 1 ngày đầy đủ (8 hoạt động), phù hợp với người dùng muốn kế hoạch nhanh cho buổi tối.

---

## 🎯 Use Cases

### Trường hợp 1: Buổi tối Đơn giản (EVENING_SIMPLE)

**Trigger keywords:**
- "buổi tối" + "đơn giản"
- "tối nay" + "nhanh/gọn"
- "evening" + "simple/casual"

**Flow:** 🍔 Ăn nhẹ → ☕ Cafe → 🌊 Dạo hồ

**Ví dụ queries:**
```
✅ "lên lịch trình một buổi tối ở hà nội đơn giản cho tôi"
✅ "tối nay đi đâu cho nhanh"
✅ "gợi ý lịch trình tối ở hà nội đơn giản"
✅ "lập kế hoạch buổi tối casual"
```

**Kết quả (3 hoạt động):**
```json
{
  "title": "Buổi tối đơn giản tại Hà Nội",
  "schedule": [
    {
      "time": "18:00",
      "activity": "Ăn nhẹ",
      "placeId": "60d5f484e...",
      "placeName": "KFC Royal City",
      "reason": "Ăn nhanh gọn, tiện lợi để bắt đầu buổi tối"
    },
    {
      "time": "19:30",
      "activity": "Uống cafe",
      "placeId": "60d5f484e...",
      "placeName": "The Coffee House Tràng Tiền",
      "reason": "Thư giãn, trò chuyện với bạn bè trong không gian chill"
    },
    {
      "time": "21:00",
      "activity": "Dạo hồ",
      "placeId": "60d5f484e...",
      "placeName": "Hồ Hoàn Kiếm",
      "reason": "Kết thúc ngày với không khí trong lành và phong cảnh đẹp"
    }
  ]
}
```

---

### Trường hợp 2: Buổi tối Chỉnh chu (EVENING_FANCY)

**Trigger keywords:**
- "buổi tối" + "chỉnh chu/tươm tất"
- "tối nay" + "sang trọng/cao cấp"
- "evening" + "fancy/luxury/elegant"

**Flow:** 🍲 Lẩu/Buffet → 🎤 Karaoke → 🏨 Hotel

**Ví dụ queries:**
```
✅ "lên lịch trình một buổi tối ở hà nội chỉnh chu cho tôi"
✅ "tối nay đi chơi tươm tất"
✅ "gợi ý lịch trình tối nay sang trọng"
✅ "lập kế hoạch buổi tối cao cấp"
```

**Kết quả (3 hoạt động):**
```json
{
  "title": "Buổi tối chỉnh chu tại Hà Nội",
  "schedule": [
    {
      "time": "18:00",
      "activity": "Ăn tối",
      "placeId": "60d5f484e...",
      "placeName": "Lẩu Nấm Ashima",
      "reason": "Thưởng thức bữa tối thịnh soạn với không gian sang trọng"
    },
    {
      "time": "20:00",
      "activity": "Hát karaoke",
      "placeId": "60d5f484e...",
      "placeName": "Music Box Karaoke",
      "reason": "Giải trí cùng bạn bè với âm thanh chất lượng cao"
    },
    {
      "time": "22:30",
      "activity": "Nghỉ ngơi",
      "placeId": "60d5f484e...",
      "placeName": "A25 Hotel",
      "reason": "Nghỉ ngơi thoải mái cho những ai ở xa, hoặc về nhà an toàn"
    }
  ]
}
```

---

### Trường hợp 3: Lịch trình 1 ngày Đầy đủ (FULL_DAY)

**Trigger keywords:**
- "lịch trình 1 ngày"
- "khám phá hà nội"
- KHÔNG có từ "buổi tối" hoặc "đơn giản"

**Flow:** 8 hoạt động từ 08:00 → 20:30

**Ví dụ queries:**
```
✅ "lên lịch trình 1 ngày hà nội"
✅ "khám phá hà nội từ sáng đến tối"
```

---

## 🏗️ Kiến trúc Kỹ thuật

### 1. Intent Detection (02-QueryAnalyzer.js)

```javascript
// Phát hiện itineraryType
const isEvening = /buổi tối|tối nay|tối ở|evening/.test(question);
const isSimple = /đơn giản|nhanh|gọn|casual|simple/.test(question);

if (isEvening && isSimple) {
    itineraryType = 'EVENING_SIMPLE';
}
```

**Output:** `{ intent: 'ITINERARY', itineraryType: 'EVENING_SIMPLE' }`

---

### 2. Retrieval Queries (03-SemanticRetrieval.js)

**EVENING_SIMPLE:** 4 queries (Đơn giản)
```javascript
[
    'KFC Jollibee McDonald fast food ăn nhanh Hà Nội',
    'quán phở bún cơm ăn nhanh Hà Nội',
    'quán cafe chill view đẹp Hà Nội',
    'hồ hoàn kiếm hồ tây dạo bộ tối Hà Nội'
]
```

**EVENING_FANCY:** 4 queries (Chỉnh chu)
```javascript
[
    'nhà hàng lẩu buffet cao cấp ăn tối Hà Nội',
    'karaoke music box hát cao cấp Hà Nội',
    'A25 hotel khách sạn nghỉ ngơi Hà Nội',
    'khách sạn gần trung tâm Hà Nội'
]
```

**FULL_DAY:** 8 queries (1 ngày đầy đủ)

---

### 3. Prompt Template (itinerary_gen.v1.txt)

**Thêm section mới:**
```
🌙 TRƯỜNG HỢP 1: LỊCH TRÌNH BUỔI TỐI ĐƠN GIẢN (EVENING_SIMPLE)
- 3 hoạt động: Ăn nhẹ (18:00) → Cafe (19:30) → Dạo hồ (21:00)
- Ưu tiên: Fast food, cafe gần, hồ dễ tiếp cận

📅 TRƯỜNG HỢP 2: LỊCH TRÌNH 1 NGÀY ĐẦY ĐỦ (FULL_DAY)
- 8 hoạt động: 08:00 → 20:30
```

---

### 4. Prompt Builder (06-PromptBuilder.js)

```javascript
// Truyền itineraryType vào prompt
await promptLoader.formatItineraryGen(
    context,
    question,
    weather,
    datetime,
    userPreferences,
    input.itineraryType // 'EVENING_SIMPLE' hoặc 'FULL_DAY'
);
```

LLM nhận hint:
```
⚠️ QUAN TRỌNG: User yêu cầu LỊCH TRÌNH BUỔI TỐI ĐƠN GIẢN (3 hoạt động). 

# Test EVENING_SIMPLE
node services/ai/scripts/testEveningSimple.js

# Test EVENING_FANCY
node services/ai/scripts/testEveningFancy.js
```

### Test cases:
1. ✅ "lịch trình tối đơn giản" → EVENING_SIMPLE
2. ✅ "lịch trình tối chỉnh chu" → EVENING_FANCY
3. ✅ "lịch trình 1 ngày" → FULL_DAY
4. ✅ "tối nayript:
```bash
cd server
node services/ai/scripts/testEveningSimple.js
```

### Test cases:
1. ✅ "lên lịch trình một buổi tối ở hà nội đơn giản cho tôi" → EVENING_SIMPLE
2. ✅ "tối nay đi đâu cho nhanh" → EVENING_SIMPLE
3. ✅ "lên lịch trình 1 ngày hà nội" → FULL_DAY
4. ✅ "tối nay đi ăn gì" → CHAT (không phải itinerary)

---

## 📊 Luồng xử lý (Data Flow)

```mermaid
graph TD
    A[User: "lịch trình tối đơn giản"] --> B[02-QueryAnalyzer]
    B -->|Regex detect| C{isEvening && isSimple?}
    C -->|Yes| D[itineraryType = EVENING_SIMPLE]
    C -->|No| E[itineraryType = FULL_DAY]
    D --> F[03-SemanticRetrieval]
    E --> F
    F -->|EVENING_SIMPLE| G[4 queries: Fast food + Cafe + Hồ]
    F -->|FULL_DAY| H[8 queries: Sáng → Tối]
    G --> I[06-PromptBuilder]
    H --> I
    I -->|Add type hint| J[formatItineraryGen]
    J --> K[07-LLMInvoker]
    K --> L{Parse JSON}
    L -->|EVENING_SIMPLE| M[3 activities]
    L -->|FULL_DAY| N[8 activities]
    M --> O[Client: Display Timeline]
    N --> O
```

---

## ✅ Checklist Implementation

- [x] Phát hiện intent trong QueryAnalyzer
- [x] Retrieval queries riêng cho EVENING_SIMPLE
- [x] Template prompt với 2 trường hợp
- [x] Truyền itineraryType qua pipeline
- [x] Log tracking cho debug
- [x] Test script hoàn chỉnh

---

## 🚀 Next Steps (Tương lai)

- [ ] **EVENING_ROMANTIC**: Buổi tối hẹn hò (Fine dining → View đẹp → Rooftop)
- [ ] **EVENING_PARTY**: Buổi tối tiệc tùng (Bar → Karaoke → Club)
- [ ] **MORNING_QUICK**: Buổi sáng nhanh (Phở → Cafe → Công viên)

---

**Tài liệu cập nhật:** 24/01/2026
**Tác giả:** HaNoiGo AI Team
