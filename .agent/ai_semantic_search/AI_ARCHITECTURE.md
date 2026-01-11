## 1. Tổng Quan (Overview)

Tài liệu này mô tả kiến trúc kỹ thuật cho phân hệ AI (AI Module) của dự án **HanoiGo**. Hệ thống được thiết kế theo mô hình **RAG (Retrieval-Augmented Generation) Enterprise-grade**, tập trung vào khả năng cá nhân hóa cao, độ trễ thấp và độ chính xác của dữ liệu.

Mục tiêu chính:
*   **High Availability:** Hệ thống hoạt động ổn định dưới tải cao.
*   **Cost Optimization:** Tối ưu chi phí Token thông qua Caching và chiến lược Context Window hiệu quả.
*   **Modular:** Dễ dàng thay thế Model (LLM), Vector DB hoặc chiến lược truy xuất mà không ảnh hưởng toàn bộ hệ thống.
*   **Traceability:** Giám sát được toàn bộ luồng suy luận của AI để debug và cải thiện chất lượng.

***

## 2. Technology Stack (Công Nghệ Sử Dụng)

### Core AI Engine
*   **Orchestration Framework:** [LangChain.js](https://js.langchain.com/) (v0.2+) - Quản lý luồng xử lý (Chain/LCEL).
*   **LLM Provider:** OpenAI API (`gpt-5-mini-2025-08-07` cho tác vụ thường, `gpt-4o` cho tác vụ phức tạp). Chuẩn bị sẵn Adapter để switch sang Azure OpenAI nếu cần bảo mật cao hơn.
*   **Vector Database:** [Pinecone](https://www.pinecone.io/) (Serverless mode) - Lưu trữ Embeddings với khả năng Metadata Filtering mạnh mẽ.
*   **Embedding Model:** `text-embedding-3-small` (OpenAI) - Tối ưu cân bằng giữa chi phí và hiệu năng (MTEB benchmark cao).

### Performance & Quality
*   **Reranking:** [Cohere Rerank](https://cohere.com/rerank) - Sắp xếp lại kết quả tìm kiếm vector để tăng độ chính xác (Relevance).
*   **Semantic Caching:** [Redis](https://redis.io/) (hoặc Upstash) - Cache câu trả lời dựa trên ngữ nghĩa câu hỏi để giảm latency và chi phí API.
*   **Evaluation:** [Ragas](https://docs.ragas.io/) hoặc [LangSmith](https://smith.langchain.com/) - Đánh giá tự động chất lượng câu trả lời (Faithfulness, Answer Relevance).

### Infrastructure
*   **Runtime:** Node.js (v20+ LTS).
*   **Language:** JavaScript (ES Modules) hoặc TypeScript (Khuyến nghị).

***

## 3. Cấu Trúc Dự Án (Enterprise Folder Structure)

Cấu trúc thư mục được thiết kế theo nguyên lý **Separation of Concerns** (Phân tách mối quan tâm).

```plaintext
server/services/ai/
├── config/                     \# Cấu hình tập trung
│   ├── index.js                \# Env vars (API Keys, Configs)
│   └── constants.js            \# Các hằng số (Model names, limits)
│
├── core/                       \# Core Factories (Design Patterns)
│   ├── llmFactory.js           \# Singleton quản lý khởi tạo LLM
│   ├── vectorStoreFactory.js   \# Singleton quản lý kết nối Pinecone
│   ├── cacheClient.js          \# Redis client cho Semantic Cache
│   └── telemetry.js            \# Cấu hình LangSmith/OpenTelemetry
│
├── prompts/                    \# Quản lý Prompt (Prompt Engineering)
│   ├── templates/              \# File text thuần chứa prompt
│   │   ├── system.v1.txt       \# Persona của Bot
│   │   ├── rag_query.v1.txt    \# Prompt RAG tiêu chuẩn
│   │   └── query_rewrite.txt   \# Prompt viết lại câu hỏi
│   └── promptLoader.js         \# Logic load và inject variables vào prompt
│
├── retrieval/                  \# Logic tìm kiếm \& Truy xuất dữ liệu
│   ├── loaders/                \# Xử lý Ingestion (Load data từ MongoDB)
│   ├── splitters/              \# Logic Chunking (Propositions/Semantic Splitter)
│   ├── strategies/             \# Các chiến lược tìm kiếm
│   │   ├── basicRetriever.js   \# Vector Search thuần
│   │   └── hybridRetriever.js  \# Vector + Keyword (BM25)
│   └── reranker.js             \# Logic gọi Cohere để rerank kết quả
│
├── pipelines/                  \# (Workflows) Các luồng xử lý chính - LCEL
│   ├── mainChatPipeline.js     \# Luồng Chatbot chính (Guard -> Cache -> RAG -> LLM)
│   ├── ingestionPipeline.js    \# Luồng nạp dữ liệu (ETL)
│   └── feedbackPipeline.js     \# Xử lý feedback từ user để fine-tune
│
├── tools/                      \# Các function calling tools (nếu cần mở rộng Agent)
│   ├── bookingTool.js          \# Tool đặt bàn
│   └── weatherTool.js          \# Tool xem thời tiết
│
├── guardrails/                 \# Bảo mật \& An toàn nội dung
│   ├── inputGuard.js           \# Chặn PII, Prompt Injection
│   └── outputGuard.js          \# Chặn nội dung độc hại, hallucination check
│
├── utils/                      \# Tiện ích bổ trợ
│   ├── tokenCounter.js         \# Đếm token để estimate chi phí
│   ├── outputParsers.js        \# Format JSON/String đầu ra
│   └── errHandler.js           \# Xử lý lỗi AI tập trung
│
└── index.js                    \# Entry point (Export các Service ra bên ngoài)
```

***

## 4. Luồng Dữ Liệu Chi Tiết (Data Flow)

Biểu đồ luồng xử lý request chuẩn doanh nghiệp cho `mainChatPipeline.js`:

```mermaid
graph TD
    A[User Request] --> B{Input Guardrails}
    B -- Vi phạm --> C[Block Response]
    B -- Hợp lệ --> D{Semantic Cache (Redis)}
    
    D -- Hit (Đã có câu hỏi tương tự) --> E[Return Cached Answer]
    D -- Miss --> F[Query Rewriter]
    
    F --> G[Hybrid Retrieval]
    G --> G1[Pinecone (Vector)]
    G --> G2[Metadata Filter (MongoDB Prefs)]
    
    G1 & G2 --> H[Raw Documents]
    H --> I[Reranker (Cohere)]
    I --> J[Top K Relevant Docs]
    
    J --> K[LLM Generation (GPT-5-Mini)]
    K --> L{Output Guardrails}
    
    L -- Vi phạm --> M[Fallback Response]
    L -- Hợp lệ --> N[Update Cache]
    N --> O[Final Response to User]
```

***

## 5. Các Mẫu Thiết Kế Chính (Key Design Patterns)

1.  **Factory Pattern (`core/llmFactory.js`):**
    *   Giúp dễ dàng chuyển đổi giữa `ChatOpenAI`, `ChatAnthropic` hoặc `AzureChatOpenAI` dựa trên biến môi trường mà không cần sửa code logic nghiệp vụ.

2.  **Strategy Pattern (`retrieval/strategies/`):**
    *   Cho phép runtime switch giữa các chiến lược tìm kiếm: `Basic` (nhanh, rẻ) hoặc `Hybrid` (chậm hơn, chính xác hơn) tùy thuộc vào gói dịch vụ của user hoặc loại câu hỏi.

3.  **Singleton Pattern (`core/vectorStoreFactory.js`):**
    *   Đảm bảo chỉ có một kết nối duy nhất tới Pinecone/Redis trong suốt vòng đời ứng dụng để tránh leak connection.

4.  **Chain of Responsibility (Pipelines):**
    *   Sử dụng LCEL (LangChain Expression Language) để nối các bước xử lý thành một chuỗi: `Retriever | Prompt | Model | OutputParser`.

***

## 6. Tiêu Chuẩn Bảo Mật & An Toàn (Security & Safety)

1.  **PII Redaction (Ẩn danh hóa):**
    *   Sử dụng middleware trong `inputGuard` để phát hiện và mask các thông tin nhạy cảm (SĐT, Email) trước khi gửi sang OpenAI.

2.  **Prompt Injection Defense:**
    *   Sử dụng delimiters (ví dụ: `"""Query"""`) trong System Prompt.
    *   Kiểm tra độ dài và các ký tự đặc biệt trong input.

3.  **Rate Limiting:**
    *   Giới hạn số request AI/phút cho từng User ID để tránh bị DoS bill (cạn kiệt ngân sách API).

***

## 7. Chiến Lược Đánh Giá & Cải Tiến (Evaluation Loop)

1.  **Feedback Loop:**
    *   Mỗi câu trả lời của Bot đều có nút Like/Dislike.
    *   Dữ liệu Dislike + Conversation ID sẽ được log lại vào DB để dev review.

2.  **Automated Testing:**
    *   Sử dụng **Ragas** để chạy test hàng đêm trên bộ dataset mẫu (Golden Dataset).
    *   Các chỉ số cần đo:
        *   **Faithfulness:** Câu trả lời có bịa ra ngoài context không?
        *   **Answer Relevance:** Câu trả lời có đúng trọng tâm câu hỏi không?
        *   **Context Precision:** Các doc tìm được có đúng thứ cần tìm không?

***
*Tài liệu này được cập nhật lần cuối vào: 11/01/2026 bởi HanoiGo Team.*