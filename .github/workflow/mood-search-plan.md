## Feature Plan: Mood-Based AI Search (Tìm kiếm theo tâm trạng)

### 1. Requirement Summary (Tóm tắt yêu cầu)
- **Goal**: Cho phép người dùng tìm kiếm địa điểm dựa trên cảm xúc/tâm trạng hiện tại (ví dụ: "buồn", "vui", "thất tình", "muốn chill").
- **User Story**: "Là một người dùng đang buồn chán, tôi muốn tìm một quán cafe yên tĩnh hoặc pub có nhạc nhẹ để giải sầu."
- **Success Metrics**:
    - AI nhận diện đúng intent "MOOD_SEARCH".
    - Kết quả trả về phù hợp với vibe của mood (ví dụ: buồn -> không gợi ý quán bar sàn ồn ào).
    - Tỷ lệ click vào địa điểm gợi ý > 20%.

### 2. Architecture & Design (Kiến trúc & Thiết kế)

#### A. Database Schema (No Schema Change, Logical Update)
Tận dụng trường `aiTags` hiện có trong collection `places`. 
Chúng ta cần chuẩn hóa bộ mapping từ **User Mood** sang **Place Tags/Keywords**.

**Mood Mapping Dictionary (`moodMapping.js`):**
```javascript
const MOOD_MAPPING = {
  sad: {
    keywords: ['buồn', 'sầu', 'tâm trạng', 'chán', 'thất tình'],
    relatedTags: ['yên tĩnh', 'riêng tư', 'chill', 'nhạc nhẹ', 'acoustic', 'góc nhỏ'],
    excludeTags: ['sôi động', 'edm', 'tụ tập đông', 'náo nhiệt']
  },
  happy: {
    keywords: ['vui', 'phấn khích', 'ăn mừng', 'quẩy'],
    relatedTags: ['sôi động', 'năng động', 'nhạc sống', 'view đẹp', 'tụ tập'],
    excludeTags: ['yên tĩnh', 'trầm lắng']
  },
  stress: {
    keywords: ['áp lực', 'mệt mỏi', 'stress', 'căng thẳng'],
    relatedTags: ['thiên nhiên', 'thoáng đãng', 'chữa lành', 'spa', 'massage', 'thư giãn'],
    excludeTags: []
  },
  romantic: { // Đã có logic nhưng cần chuẩn hóa vào đây luôn
    keywords: ['hẹn hò', 'người yêu', 'lãng mạn'],
    relatedTags: ['lãng mạn', 'ấm cúng', 'view hồ', 'rooftop', 'fine dining'],
    excludeTags: ['bình dân', 'vỉa hè ồn ào']
  }
};
```

#### B. Pipeline Extension (AI Pipeline)

Chúng ta sẽ mở rộng `MainChatPipeline` và các stage liên quan:

1.  **Stage 2: Query Analyzer (`02-QueryAnalyzer.js`)**
    - Thêm logic `detectMood(query)` sử dụng `moodMapping`.
    - Output thêm trường `moodContext`: `{ type: 'sad', tags: ['yên tĩnh', 'chill'] }`.

2.  **Stage 4: Hybrid Search (`04-HybridSearchEngine.js`)**
    - Nếu có `moodContext`, inject các `relatedTags` vào keyword search.
    - Ví dụ: User search "chỗ nào giải sầu" -> Query thực thi: "chỗ nào giải sầu yên tĩnh chill nhạc nhẹ".

3.  **Stage 5: Ranking Engine (`05-RankingEngine.js`)** (Quan trọng nhất)
    - **Demote (Giảm điểm)** các quán có tag trong `excludeTags` (ví dụ: đang buồn mà gợi ý sàn nhảy -> trừ điểm nặng).
    - **Boost (Tăng điểm)** các quán có tag trong `relatedTags`.

4.  **Stage 6: Prompt Builder (`06-PromptBuilder.js`)**
    - Thêm chỉ dẫn vào System Prompt hoặc User Prompt về mood của user để AI trả lời thấu cảm hơn.
    - Ví dụ: "User đang buồn, hãy trả lời nhẹ nhàng, an ủi."

### 3. Implementation Steps (Các bước triển khai)

1.  **Task 1: Create Mood Dictionary**
    - Tạo file `server/services/ai/config/moodMapping.js`.
    - Định nghĩa các mood phổ biến và tags tương ứng.

2.  **Task 2: Update Query Analyzer**
    - Sửa `server/services/ai/pipelines/stages/02-QueryAnalyzer.js`.
    - Implement hàm `_detectMood(query)`.
    - Trả về `intent: 'PLACE_VIBE'` (hoặc bổ sung metadata vào intent CHAT).

3.  **Task 3: Update Ranking Engine**
    - Sửa `server/services/ai/pipelines/stages/05-RankingEngine.js`.
    - Thêm logic `_applyMoodFiltering(docs, moodContext)` trong hàm `rerank`.
    - Logic: Score = Score * (1.2 nếu match tag) * (0.5 nếu match exclude).

4.  **Task 4: Update Prompt (Optional but nice)**
    - Sửa prompt template để AI nhận diện context mood và điều chỉnh tone giọng.

5.  **Task 5: Test**
    - Viết script test `server/scripts/testMoodSearch.js` với các câu query mẫu.

### 4. Test Strategy (Chiến lược kiểm thử)

- **Unit Test**: Test hàm `detectMood` với các keyword: "tôi buồn quá", "kiếm chỗ nào vui vẻ", "stress công việc".
- **Ranking Test**:
    - Input: "tìm chỗ giải sầu"
    - Expect: Top results phải là cafe yên tĩnh, pub nhẹ nhàng. Các quán Bar sàn ồn ào phải bị đẩy xuống dưới hoặc loại bỏ.
- **E2E**: Chat thử trên UI, verify AI trả lời đúng tone và list quán hợp mood.

### 5. Risk Assessment (Đánh giá rủi ro)

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **False Positive** | Medium | Low | Keyword "buồn" có thể xuất hiện trong tên quán "Bún Chả Buồn" (ví dụ vui). -> Chỉ detect mood nếu keyword nằm trong ngữ cảnh cảm xúc (dùng regex thông minh hoặc LLM verify). |
| **Over-filtering** | Medium | Medium | Nếu filter quá chặt (exclude nhiều), có thể không còn kết quả. -> Chỉ giảm điểm (demote) thay vì loại bỏ hoàn toàn (filter). |
| **Data Gaps** | High | High | Data quán chưa có đủ tag "yên tĩnh/sôi động". -> Cần chạy script `auto-tagging` lại cho DB dựa trên review/description. |

### 6. Acceptance Criteria (Tiêu chí nghiệm thu)
- [ ] Query "tìm chỗ giải sầu" trả về ít nhất 3 quán có tag "yên tĩnh" hoặc "chill".
- [ ] Query "đi quẩy" trả về Bar/Pub sôi động.
- [ ] Code không làm chậm pipeline quá 50ms.
