## 1. Tổng Quan (Overview)

Tài liệu này mô tả kiến trúc kỹ thuật cho phân hệ AI (AI Module) của dự án **HanoiGo**. Hệ thống được thiết kế theo mô hình **RAG (Retrieval-Augmented Generation) Enterprise-grade**, tích hợp các kỹ thuật tìm kiếm lai (Hybrid Search) và tối ưu hóa thứ hạng (Re-ranking) để xử lý chính xác các truy vấn địa điểm phức tạp (ví dụ: tìm theo ngõ, ngách).

Mục tiêu chính:
*   **Accuracy:** Ưu tiên độ chính xác tuyệt đối cho các truy vấn địa chỉ cụ thể (Address-Aware).
*   **Cost Optimization:** Tối ưu chi phí Token thông qua Caching và chiến lược Context Window hiệu quả.
*   **Modular:** Dễ dàng thay thế Model (LLM), Vector DB hoặc chiến lược truy xuất.

***

## 2. Technology Stack (Công Nghệ Sử Dụng)

### Core AI Engine
*   **Orchestration Framework:** [LangChain.js](https://js.langchain.com/) (v0.2+) - Quản lý luồng xử lý (Chain/LCEL).
*   **LLM Provider:** OpenAI API (`gpt-4o-mini`) - Model cân bằng tốt nhất giữa hiệu năng và chi phí.
*   **Vector Database:** [Pinecone](https://www.pinecone.io/) (Serverless mode) - Lưu trữ Embeddings.
*   **Embedding Model:** `text-embedding-3-large` (OpenAI).

### Performance & Quality
*   **Retrieval Strategy:** **Hybrid Search**
    *   Vector Search (Semantic): Tìm kiếm theo ngữ nghĩa.
    *   Keyword Search (MongoDB): Tìm kiếm Text & Regex (hỗ trợ "ngõ", "ngách", "phố" smart matching).
*   **Reranking:** [Cohere Rerank](https://cohere.com/rerank) (`rerank-multilingual-v3.0`) - Sắp xếp lại danh sách kết quả dựa trên độ liên quan ngữ nghĩa sâu.
*   **Local Reordering:** Thuật toán tùy chỉnh để boost điểm cho các địa điểm khớp chính xác tên hoặc địa chỉ (Address Boosting).
*   **Semantic Caching:** Redis (In-Memory) - Cache toàn bộ **Payload** (Câu trả lời + Danh sách địa điểm + Context) để đảm bảo đồng nhất UI khi cache hit.

### Infrastructure
*   **Runtime:** Node.js (v20+ LTS).
*   **Language:** JavaScript (ES Modules).

***

## 3. Cấu Trúc Dự Án (Enterprise Folder Structure)

```plaintext
server/services/ai/
├── config/                     # Cấu hình tập trung
├── core/                       # LLM & DB Connection
├── prompts/
│   ├── templates/
│   │   ├── system.v1.txt       # Persona (Fong)
│   │   ├── rag_query.v1.txt    # Standard RAG Prompt
│   │   ├── itinerary_gen.v1.txt # JSON Prompt cho lịch trình
│   │   ├── intent_classify.v1.txt # Prompt phân loại ý định
│   └── promptLoader.js         
├── retrieval/                  # Search strategies & Reranker
├── pipelines/
│   └── mainChatPipeline.js     # Router Pattern Orchestrator:
│                               # 1. Input Guard
│                               # 2. Intent Classify (Itinerary vs Chat)
│                               # 3. Weather/Time Context Injection
│                               # 4. Branch Execution
│                               # 5. Output Format
├── guardrails/
└── index.js                    
```

### External Services
*   **Weather Provider:** [Open-Meteo](https://open-meteo.com/) - Dữ liệu thời tiết Real-time & Forecast.
*   **LLM Provider:** OpenAI API (`gpt-4o-mini`).
*   **Vector DB:** Pinecone (Serverless).
*   **Reranker:** Cohere Rerank.

***

### 4. Luồng Dữ Liệu Chi Tiết (Data Flow)

Biểu đồ luồng xử lý request chuẩn cho `mainChatPipeline.js`:

```mermaid
graph TD
    A[Request + Context (Weather)] --> B{Input Guard}
    B -- Safe --> C[Intent Classifier]
    
    C -- "ITINERARY" --> D1[Itinerary Pipeline]
    C -- "CHAT" --> D2[General Pipeline]

    subgraph "D2: General Pipeline"
        D2 --> E1[Inject Weather Context]
        E1 --> E2[Hybrid Retrieval (Vector + Keyword)]
        E2 --> E3[Semantic Rerank]
        E3 --> E4[LLM Generation (Answer + Place IDs)]
    end

    subgraph "D1: Itinerary Pipeline"
        D1 --> F1[Broad Retrieval]
        F1 --> F2[Structured Planner LLM]
        F2 --> F3[JSON-Based Plan Generation]
    end
    
    E4 & F3 --> G{Response Formatter}
    G --> H[Final Client Response]
```
    
    F --> G[Hybrid Retrieval Operations]
    
    subgraph "Stage 3.5: Hybrid Retrieval"
        G --> H1[Pinecone Vector Search]
        G --> H2[Mongo Text/Regex Search]
        H2 -- Address Detection --> H3[Smart Address Regex]
    end
    
    H1 & H2 & H3 --> I[Raw Candidate List (Top 20)]
    
    I --> J[Cohere Reranker (Top 10)]
    J -- Semantic Filter --> K[Local Reorder]
    
    K -- Name/Address Boost --> L[Optimized Context]
    
    L --> M[LLM Generation (GPT-4o-mini)]
    M --> N[Generated Answer]
    
    subgraph "Post-Processing (Route Layer)"
        N --> O[Extract Place IDs]
        O --> P[Fetch Full Data (MongoDB)]
        P --> Q[**Answer-Aware Reordering**]
        Q -- Sync UI with Text --> R[Final JSON Response]
    end
```

***

## 5. Tối Ưu Hóa Hiệu Năng & Chất Lượng (Optimization Config)

Hệ thống được tinh chỉnh với các tham số "Vàng" để cân bằng giữa tốc độ và độ chính xác:

### 🚀 Performance (Hiệu Suất)
*   **Model**: `gpt-4o-mini` (latency < 4s, cost ~1/30 GPT-4).
*   **Vector Search**: `TOP_K = 20`. Lấy rộng để tránh bỏ sót (High Recall).
*   **Caching**: Redis Semantic Cache (TTL 1h) giúp giảm 30-50% request lặp lại.

### ⭐ Quality (Chất Lượng)
*   **Reranking**: `Cohere v3` (`TOP_K = 10`). Lọc kỹ lại 20 kết quả thô để chọn ra 10 kết quả tinh túy nhất cho LLM.
*   **Strict Location**: Prompt được cấu hình để "Cảnh báo" nếu không tìm thấy quán đúng khu vực (tránh Hallucination).
*   **UI Synchronization**: Thuật toán "Answer-Aware Reordering" sắp xếp lại danh sách hiển thị khớp 100% với thứ tự xuất hiện trong câu trả lời (xử lý cả viết tắt, tên phụ).

### 🧩 Review & Multilingual Strategy (Chiến lược Đánh giá & Đa ngôn ngữ)
*   **Tại sao lưu Review vào Pinecone?**
    *   Review chứa các "từ khóa cảm xúc" (clean, cozy, noisy, friendly) mà dữ liệu tĩnh không có.
    *   Ví dụ: User tìm *"quán toilet sạch"*, chỉ có trong review mới nhắc đến.
*   **Cách thức (Aggregation)**:
    *   Thay vì lưu mỗi review là 1 vector (gây loãng kết quả), ta **gộp Top 3 review chất lượng nhất** ( > 4 sao, dài > 10 ký tự) vào thẳng văn bản mô tả của địa điểm (`PageContent`).
    *   Khi tìm kiếm, nếu vector khớp với nội dung review, hệ thống sẽ trả về **Địa điểm** đó.
*   **Đa ngôn ngữ (Multilingual)**:
    *   Model `text-embedding-3-small` hỗ trợ tốt việc mapping ý nghĩa xuyên ngôn ngữ.
    *   Review tiếng Hàn ("matjib" - ngon) vẫn sẽ khớp với query tiếng Việt ("quán ngon") hoặc tiếng Anh ("tasty").

***
*Tài liệu này được cập nhật lần cuối vào: 12/01/2026 bởi HanoiGo Team.*