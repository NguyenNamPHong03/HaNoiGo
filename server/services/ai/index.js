/**
 * AI Service - Main Entry Point
 * Export tất cả services ra bên ngoài
 */

import llmFactory from './core/llmFactory.js';
import vectorStoreFactory from './core/vectorStoreFactory.js';
import cacheClient from './core/cacheClient.js';
import telemetry from './core/telemetry.js';
import promptLoader from './prompts/promptLoader.js';
import mainChatPipeline from './pipelines/mainChatPipeline.js';
import ingestionPipeline from './pipelines/ingestionPipeline.js';
import feedbackPipeline from './pipelines/feedbackPipeline.js';
import toolRegistry from './tools/index.js';
import inputGuard from './guardrails/inputGuard.js';
import outputGuard from './guardrails/outputGuard.js';
import logger from './utils/logger.js';
import errorHandlerModule from './utils/errorHandler.js';
const errorHandler = errorHandlerModule.handler;

/**
 * Initialize all services
 */
async function initializeAIService() {
    try {
        logger.info('🚀 Initializing AI Service...');

        // Initialize core services
        await llmFactory.initialize();
        await vectorStoreFactory.initialize();
        await cacheClient.initialize();
        await promptLoader.initialize();

        // Initialize pipeline
        await mainChatPipeline.initialize();

        // Initialize telemetry
        telemetry.initialize();

        logger.info('✅ AI Service initialized successfully');
    } catch (error) {
        logger.error('❌ AI Service initialization failed:', error);
        throw error;
    }
}

/**
 * Health check
 */
async function healthCheck() {
    const health = {
        service: 'ai_service',
        timestamp: new Date().toISOString(),
        status: 'healthy',
        components: {
            llm: await llmFactory.healthCheck(),
            vectorStore: await vectorStoreFactory.healthCheck(),
            cache: await cacheClient.healthCheck(),
        },
    };

    health.status = Object.values(health.components).every((c) => c)
        ? 'healthy'
        : 'degraded';

    return health;
}

/**
 * Process chat message
 */
async function processMessage(question, userId = 'anonymous') {
    try {
        const result = await mainChatPipeline.execute(question, { userId });
        return result;
    } catch (error) {
        throw errorHandler.handle(error, { component: 'processMessage' });
    }
}

/**
 * Ingest documents
 */
async function ingestDocuments(collectionName) {
    try {
        return await ingestionPipeline.ingest(collectionName);
    } catch (error) {
        throw errorHandler.handle(error, { component: 'ingestDocuments' });
    }
}

/**
 * Record user feedback
 */
async function recordFeedback(feedback) {
    try {
        return await feedbackPipeline.recordFeedback(feedback);
    } catch (error) {
        logger.error('❌ Feedback recording failed:', error);
    }
}

/**
 * Export service
 */
export {
    // Initialization
    initializeAIService,
    healthCheck,

    // Chat API
    processMessage,
    recordFeedback,

    // Ingestion API
    ingestDocuments,

    // Core factories
    llmFactory,
    vectorStoreFactory,
    cacheClient,

    // Pipelines
    mainChatPipeline,
    ingestionPipeline,
    feedbackPipeline,

    // Tools
    toolRegistry,

    // Guards
    inputGuard,
    outputGuard,

    // Utilities
    logger,
    errorHandler,
};
