# 🤖 AI SERVICE - CẤU TRÚC & Ý NGHĨA CÁC FILE

## 📁 Tổng quan Cấu trúc

```
ai/
├── config/          # Cấu hình hệ thống AI
├── core/            # Các thành phần nền tảng
├── guardrails/      # Bảo vệ input/output
├── pipelines/       # Luồng xử lý RAG
├── prompts/         # Template cho GPT
├── retrieval/       # Tìm kiếm & trích xuất
├── scripts/         # Scripts test & debug
├── tools/           # Công cụ tích hợp bên ngoài
├── utils/           # Hàm tiện ích
└── index.js         # Entry point - export các module chính
```

---

## 📂 CHI TIẾT TỪNG FOLDER & FILE

### 📁 config/ - Cấu hình hệ thống

| File | Mô tả 1 dòng |
|------|--------------|
| `constants.js` | Định nghĩa các hằng số: model GPT, token limits, timeouts |
| `index.js` | Export cấu hình tổng hợp, validate biến môi trường |
| `keywords.js` | Dictionary từ khóa món ăn, quận, tags (Phở, Bún, Ba Đình...) |

---

### 🔧 core/ - Các thành phần nền tảng

| File | Mô tả 1 dòng |
|------|--------------|
| `cacheClient.js` | Redis client để cache response, tiết kiệm OpenAI API calls |
| `llmFactory.js` | Khởi tạo OpenAI client với config (model, temperature, max tokens) |
| `telemetry.js` | Logging và monitoring hiệu suất hệ thống AI |
| `vectorStoreFactory.js` | Kết nối Pinecone VectorDB cho semantic search |

---

### 🛡️ guardrails/ - Bảo vệ Input/Output

| File | Mô tả 1 dòng |
|------|--------------|
| `inputGuard.js` | Validate user input, chặn spam, SQL injection, prompt injection |
| `outputGuard.js` | Kiểm tra response từ GPT trước khi trả về user (safety, format) |

---

### 🔄 pipelines/ - Luồng xử lý RAG

| File | Mô tả 1 dòng |
|------|--------------|
| `mainChatPipeline.js` | Pipeline chính 8 bước xử lý chat từ input → response |
| `ingestionPipeline.js` | Pipeline đẩy dữ liệu từ MongoDB → VectorDB (tạo embeddings) |
| `feedbackPipeline.js` | Pipeline học từ phản hồi user để cải thiện gợi ý |

#### 📁 pipelines/stages/ - 8 bước xử lý chat

| File | Mô tả 1 dòng |
|------|--------------|
| `01-InputProcessor.js` | Làm sạch input, loại bỏ ký tự đặc biệt, normalize text |
| `02-QueryAnalyzer.js` | Phân tích ý định (tìm món ăn, hỏi giá, lịch trình...) |
| `03-SemanticRetrieval.js` | Tìm kiếm semantic trong VectorDB bằng embeddings |
| `04-HybridSearchEngine.js` | Kết hợp semantic search + keyword search MongoDB |
| `05-RankingEngine.js` | Xếp hạng kết quả dựa trên relevance, preferences, rating |
| `06-PromptBuilder.js` | Xây dựng prompt đầy đủ với context + user query |
| `07-LLMInvoker.js` | Gọi OpenAI API với prompt đã build |
| `08-ResponseFormatter.js` | Format response thành JSON chuẩn trả về client |

#### 📁 pipelines/stages/filters/ - Bộ lọc query

*(Folder chứa các filter logic cho search - chưa liệt kê chi tiết)*

#### 📁 pipelines/stages/retrieval/ - Chiến lược tìm kiếm

| File | Mô tả 1 dòng |
|------|--------------|
| `AddressRegexStrategy.js` | Tìm kiếm địa điểm bằng regex matching địa chỉ |
| `KeywordSearchStrategy.js` | Tìm kiếm bằng từ khóa trong name, description, menu |
| `NearbySearchStrategy.js` | Tìm kiếm địa điểm gần tọa độ user (geospatial) |

---

### 📝 prompts/ - Template cho GPT

| File | Mô tả 1 dòng |
|------|--------------|
| `promptLoader.js` | Load và manage các prompt template từ folder templates/ |

#### 📁 prompts/templates/ - Template files

| File | Mô tả 1 dòng |
|------|--------------|
| `system.v1.txt` | System prompt định nghĩa role của AI (chatbot tư vấn địa điểm) |
| `rag_query.v1.txt` | Template query RAG với context retrieved từ DB |
| `intent_classify.v1.txt` | Prompt phân loại ý định user (tìm quán, hỏi giá, lịch trình) |
| `query_rewrite.v1.txt` | Viết lại query user thành chuẩn dễ search hơn |
| `itinerary_gen.v1.txt` | Template sinh lịch trình du lịch nhiều ngày |

---

### 🔍 retrieval/ - Tìm kiếm & Trích xuất

| File | Mô tả 1 dòng |
|------|--------------|
| `reranker.js` | Xếp hạng lại kết quả search dựa trên relevance score |

#### 📁 retrieval/extractors/ - Trích xuất thông tin

| File | Mô tả 1 dòng |
|------|--------------|
| `intentClassifier.js` | Phân loại ý định user (FOOD_ENTITY, PLACE_VIBE, ACTIVITY) |
| `intentExtractor.js` | Trích xuất ý định legacy (cũ, có thể deprecated) |
| `districtExtractor.js` | Trích xuất tên quận từ query (Ba Đình, Đống Đa...) |
| `foodKeywordExtractor.js` | Trích xuất tên món ăn từ query (Phở, Bún chả...) |

#### 📁 retrieval/loaders/ - Load dữ liệu

| File | Mô tả 1 dòng |
|------|--------------|
| `mongoLoader.js` | Load dữ liệu địa điểm từ MongoDB để ingest vào VectorDB |

#### 📁 retrieval/splitters/ - Chia nhỏ văn bản

| File | Mô tả 1 dòng |
|------|--------------|
| `semanticSplitter.js` | Chia văn bản theo ngữ nghĩa (semantic chunking) |
| `propositionSplitter.js` | Chia văn bản thành các proposition nhỏ (câu đơn) |

#### 📁 retrieval/strategies/ - Chiến lược tìm kiếm

| File | Mô tả 1 dòng |
|------|--------------|
| `basicRetriever.js` | Retriever cơ bản từ VectorDB |
| `hybridRetriever.js` | Kết hợp vector search + keyword search |
| `hybridSearch.js` | Implementation hybrid search strategy |

---

### 🧪 scripts/ - Scripts test & debug

| File | Mô tả 1 dòng |
|------|--------------|
| `runIngestion.js` | Chạy pipeline ingest data từ MongoDB → VectorDB |
| `testChat.js` | Test chatbot với query mẫu |
| `debugDistrictData.js` | Debug dữ liệu district trong database |
| `testDatingFilter.js` | Test filter gợi ý địa điểm hẹn hò |
| `testDatingQuery.js` | Test query tìm quán hẹn hò |
| `testDistrictFilter.js` | Test filter theo quận |
| `testDistrictFilterIntegration.js` | Test tích hợp district filter với pipeline |
| `testEveningFancy.js` | Test gợi ý buổi tối sang trọng |
| `testEveningSimple.js` | Test gợi ý buổi tối đơn giản |
| `testFancyKeywords.js` | Test trích xuất từ khóa "sang trọng", "cao cấp" |
| `testStripVerbs.js` | Test loại bỏ động từ khỏi query (muốn, cần, tìm...) |
| `verifyDistrictFilter.js` | Verify district filter hoạt động đúng |
| `quickTestPlaceholder.js` | Script test nhanh (placeholder) |

---

### 🛠️ tools/ - Công cụ tích hợp

| File | Mô tả 1 dòng |
|------|--------------|
| `index.js` | Export tất cả tools để AI có thể gọi (function calling) |
| `bookingTool.js` | Tool đặt bàn tích hợp với hệ thống booking |
| `weatherTool.js` | Tool lấy thông tin thời tiết (tích hợp API weather) |

---

### ⚙️ utils/ - Hàm tiện ích

| File | Mô tả 1 dòng |
|------|--------------|
| `documentProcessor.js` | Xử lý văn bản: clean, normalize, format document |
| `errorHandler.js` | Xử lý lỗi tập trung cho AI service |
| `errHandler.js` | Error handler alternative (có thể duplicate/legacy) |
| `logger.js` | Logger custom cho AI service (console + file logs) |
| `outputParsers.js` | Parse output từ GPT thành JSON structure |
| `preferencesMapper.js` | Map user preferences sang query filters |
| `reorderUtils.js` | Reorder kết quả search theo điều kiện |
| `tokenCounter.js` | Đếm tokens để tránh vượt giới hạn OpenAI |
| `distanceUtils.js` | Tính khoảng cách giữa 2 tọa độ (Haversine formula) |

---

## 🎯 Luồng hoạt động tổng quan

```
User Input 
  ↓
[Input Guard] → Validate, sanitize
  ↓
[Pipeline Stage 01-08] → Xử lý query, tìm kiếm, ranking, build prompt
  ↓
[LLM Invoker] → Gọi OpenAI GPT
  ↓
[Output Guard] → Validate response
  ↓
Response JSON → Client
```

---

## 📊 Công nghệ sử dụng

- **LLM**: OpenAI GPT-4
- **Framework**: LangChain.js
- **Vector DB**: Pinecone
- **Cache**: Redis
- **Database**: MongoDB
- **Architecture**: RAG (Retrieval-Augmented Generation)

---

**📅 Last Updated**: January 2026
