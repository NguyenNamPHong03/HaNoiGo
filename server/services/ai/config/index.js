/**
 * Centralized Configuration
 * Mục đích: Quản lý tất cả environment variables, API keys, và configs
 * Trách nhiệm: Load, validate, và export config toàn ứng dụng
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env file
dotenv.config();

// Validation schema sử dụng Zod
const configSchema = z.object({
    // OpenAI
    OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
    OPENAI_MODEL: z.string().default('gpt-4o-mini'),
    OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),

    // Pinecone (Vector DB)
    PINECONE_API_KEY: z.string().min(1, 'PINECONE_API_KEY is required'),
    PINECONE_ENVIRONMENT: z.string().default('production'),
    PINECONE_INDEX_NAME: z.string().default('main-index'),

    // Redis (Semantic Cache & Session)
    REDIS_URL: z.string().url().default('redis://localhost:6379'),
    REDIS_DB: z.coerce.number().default(0),

    // MongoDB (Knowledge Store)
    MONGODB_URI: z.string().url().min(1, 'MONGODB_URI is required'),
    MONGODB_DB_NAME: z.string().default('ai_service'),

    // LangSmith (Monitoring)
    LANGCHAIN_TRACING_V2: z.enum(['true', 'false']).default('false'),
    LANGCHAIN_ENDPOINT: z.string().url().optional(),
    LANGCHAIN_API_KEY: z.string().optional(),
    LANGCHAIN_PROJECT: z.string().optional(),

    // Cohere (Reranking)
    COHERE_API_KEY: z.string().optional(),

    // Environment
    NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

    // Server
    PORT: z.coerce.number().default(3000),
    HOST: z.string().default('localhost'),

    // Timeouts
    LLM_TIMEOUT_MS: z.coerce.number().default(60000),
    RETRIEVAL_TIMEOUT_MS: z.coerce.number().default(30000),

    // Feature Flags
    ENABLE_SEMANTIC_CACHE: z.enum(['true', 'false']).default('true'),
    ENABLE_STREAMING: z.enum(['true', 'false']).default('false'),
    ENABLE_TELEMETRY: z.enum(['true', 'false']).default('true'),
});

// Parse và validate
const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment configuration:');
    console.error(parsed.error.errors);
    // process.exit(1); // Don't exit in dev for now, just warn
}

// Default to empty object if validation fails to prevent crash during dev setup
const data = parsed.success ? parsed.data : {};

const config = {
    // OpenAI
    openai: {
        apiKey: data.OPENAI_API_KEY,
        model: data.OPENAI_MODEL,
        embeddingModel: data.OPENAI_EMBEDDING_MODEL,
        timeout: data.LLM_TIMEOUT_MS,
    },

    // Pinecone
    pinecone: {
        apiKey: data.PINECONE_API_KEY,
        environment: data.PINECONE_ENVIRONMENT,
        indexName: data.PINECONE_INDEX_NAME,
        timeout: data.RETRIEVAL_TIMEOUT_MS,
    },

    // Redis
    redis: {
        url: data.REDIS_URL,
        db: data.REDIS_DB,
        retryStrategy: (times) => Math.min(times * 50, 2000),
    },

    // MongoDB
    mongodb: {
        uri: data.MONGODB_URI,
        dbName: data.MONGODB_DB_NAME,
        options: {
            maxPoolSize: 10,
            minPoolSize: 2,
            socketTimeoutMS: 45000,
        },
    },

    // LangSmith
    langsmith: {
        enabled: data.LANGCHAIN_TRACING_V2 === 'true',
        endpoint: data.LANGCHAIN_ENDPOINT,
        apiKey: data.LANGCHAIN_API_KEY,
        project: data.LANGCHAIN_PROJECT,
    },

    // Cohere
    cohere: {
        apiKey: data.COHERE_API_KEY,
    },

    // Application
    app: {
        environment: data.NODE_ENV,
        port: data.PORT,
        host: data.HOST,
        isDevelopment: data.NODE_ENV === 'development',
        isProduction: data.NODE_ENV === 'production',
    },

    // Logging
    logging: {
        level: data.LOG_LEVEL,
    },

    // Features
    features: {
        semanticCache: data.ENABLE_SEMANTIC_CACHE === 'true',
        streaming: data.ENABLE_STREAMING === 'true',
        telemetry: data.ENABLE_TELEMETRY === 'true',
    },
};

console.log(`✅ Config loaded for ${config.app.environment || 'unknown'} environment`);

export default config;
