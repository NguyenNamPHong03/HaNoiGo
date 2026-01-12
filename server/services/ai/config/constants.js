/**
 * Application Constants
 * Mục đích: Centralized constants để tránh magic strings
 */

// Model Names
export const MODELS = {
    LLM: {
        GPT_5_MINI: 'gpt-5-mini-2025-08-07',
        GPT_4_TURBO: 'gpt-4-turbo',
        GPT_4: 'gpt-4',
        GPT_35_TURBO: 'gpt-3.5-turbo',
    },
    EMBEDDING: {
        TEXT_EMBEDDING_3_SMALL: 'text-embedding-3-small',
        TEXT_EMBEDDING_3_LARGE: 'text-embedding-3-large',
        ADA: 'text-embedding-ada-002',
    },
};

// Token Limits (để tính toán giới hạn context window)
export const TOKEN_LIMITS = {
    GPT_5_MINI: {
        input: 128000,
        output: 16384,
    },
    GPT_4_TURBO: {
        input: 128000,
        output: 4096,
    },
    GPT_4: {
        input: 8192,
        output: 2048,
    },
    GPT_35_TURBO: {
        input: 4096,
        output: 2048,
    },
};

// Cache Settings
export const CACHE_CONFIG = {
    TTL_SECONDS: {
        SHORT: 300,           // 5 phút - cho cached LLM responses
        MEDIUM: 3600,         // 1 giờ - cho semantic search results
        LONG: 86400,          // 24 giờ - cho embeddings
    },
    SIMILARITY_THRESHOLD: 0.75, // Ngưỡng để consider queries "same"
    MAX_CACHE_SIZE_MB: 100,     // Redis memory limit
};

// Retrieval Settings
export const RETRIEVAL_CONFIG = {
    TOP_K: 20,                   // Tăng lên 20 để bao quát nhiều kết quả hơn (Diversity)
    RERANK_TOP_K: 10,            // Lấy top 10 sau khi rerank để LLM có đủ lựa chọn
    RERANK_MODEL: 'rerank-multilingual-v3.0', // Cohere Rerank Model
    MIN_SIMILARITY_SCORE: 0.25,  // Giảm nhẹ ngưỡng filter để bắt được các kết quả "ngõ ngách"
    CHUNK_SIZE: 1024,            // Document chunk size
    CHUNK_OVERLAP: 256,          // Overlap giữa chunks
};

// RAG Pipeline Stages
export const RAG_STAGES = {
    INPUT_GUARD: 'INPUT_GUARD',
    SEMANTIC_CACHE: 'SEMANTIC_CACHE',
    QUERY_REWRITE: 'QUERY_REWRITE',
    RETRIEVAL: 'RETRIEVAL',
    RERANKING: 'RERANKING',
    PROMPT_CONSTRUCTION: 'PROMPT_CONSTRUCTION',
    LLM_INFERENCE: 'LLM_INFERENCE',
    OUTPUT_GUARD: 'OUTPUT_GUARD',
    RESPONSE_CACHE: 'RESPONSE_CACHE',
};

// Error Types
export const ERROR_TYPES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    RETRIEVAL_ERROR: 'RETRIEVAL_ERROR',
    LLM_ERROR: 'LLM_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
    SECURITY_ERROR: 'SECURITY_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
};

// HTTP Status Codes
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    RATE_LIMIT: 429,
    INTERNAL_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};

// Prompt Versions (để versioning prompt)
export const PROMPT_VERSIONS = {
    SYSTEM: 'v1',
    RAG_QUERY: 'v1',
    QUERY_REWRITE: 'v1',
};

// Feature Flags
export const FEATURE_FLAGS = {
    USE_SEMANTIC_CACHE: true,
    USE_QUERY_REWRITING: true,
    USE_RERANKING: true,
    USE_STREAMING_RESPONSE: false,
    ENABLE_FEEDBACK_COLLECTION: true,
};

export default {
    MODELS,
    TOKEN_LIMITS,
    CACHE_CONFIG,
    RETRIEVAL_CONFIG,
    RAG_STAGES,
    ERROR_TYPES,
    HTTP_STATUS,
    PROMPT_VERSIONS,
    FEATURE_FLAGS,
};
