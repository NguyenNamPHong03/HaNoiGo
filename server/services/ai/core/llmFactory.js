/**
 * LLM Factory - Singleton Pattern
 * Mục đích: Khởi tạo và quản lý LLM instance một lần duy nhất
 * Trách nhiệm: Cấp LLM instance cho toàn ứng dụng, quản lý retry & fallback
 */

import { ChatOpenAI } from '@langchain/openai';
import { RunnableSequence } from '@langchain/core/runnables';
import config from '../config/index.js';
import enhancedLogger from '../utils/enhancedLogger.js';
import { PERFORMANCE } from '../config/aiConstants.js';

const logger = enhancedLogger.child('LLMFactory');

class LLMFactory {
    constructor() {
        this.llm = null;
        this.initialized = false;
    }

    /**
     * Initialize LLM instance
     * Được gọi một lần duy nhất
     */
    async initialize() {
        if (this.initialized) {
            return this.llm;
        }

        try {
            logger.info('Initializing LLM...');

            this.llm = new ChatOpenAI({
                apiKey: config.openai.apiKey,
                modelName: config.openai.model,
                maxTokens: PERFORMANCE.LLM_MAX_TOKENS,

                // Retry logic
                maxRetries: PERFORMANCE.LLM_MAX_RETRIES,
                timeout: PERFORMANCE.LLM_TIMEOUT,

                // Performance
                streaming: config.features.streaming,
            });

            this.initialized = true;
            logger.info('LLM initialized successfully', { 
                model: config.openai.model,
                maxTokens: PERFORMANCE.LLM_MAX_TOKENS,
            });

            return this.llm;
        } catch (error) {
            logger.error('LLM initialization failed', error);
            throw new Error(`LLM initialization failed: ${error.message}`);
        }
    }

    /**
     * Get LLM instance (lazy initialization)
     */
    async getLLM() {
        if (!this.initialized) {
            await this.initialize();
        }
        return this.llm;
    }

    /**
     * Create a LLM chain with custom configuration
     */
    createChain(prompt) {
        if (!this.llm) {
            throw new Error('LLM not initialized. Call initialize() first.');
        }

        return RunnableSequence.from([prompt, this.llm]);
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            // Just check if we can get the instance
            if (!this.initialized) await this.initialize();
            // Optional: actually invoke detailed health check
            return true;
        } catch (e) {
            logger.error('Health check failed', e);
            return false;
        }
    }
}

// Export singleton instance
export default new LLMFactory();
