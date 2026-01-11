/**
 * Telemetry & Monitoring - LangSmith Integration
 * Mục đích: Track LLM calls, debug chains, monitor performance
 * Trách nhiệm: Initialize telemetry, collect metrics, log traces
 */

import config from '../config/index.js';
import logger from '../utils/logger.js';

class Telemetry {
    constructor() {
        this.enabled = config.langsmith.enabled;
    }

    /**
     * Initialize LangSmith tracing
     * Set environment variables cho LangChain
     */
    initialize() {
        if (!this.enabled) {
            logger.info('⚠️  LangSmith tracing disabled');
            return;
        }

        try {
            logger.info('📊 Initializing LangSmith telemetry...');

            // Set environment variables
            process.env.LANGCHAIN_TRACING_V2 = 'true';
            if (config.langsmith.endpoint) {
                process.env.LANGCHAIN_ENDPOINT = config.langsmith.endpoint;
            }
            if (config.langsmith.apiKey) {
                process.env.LANGCHAIN_API_KEY = config.langsmith.apiKey;
            }
            if (config.langsmith.project) {
                process.env.LANGCHAIN_PROJECT = config.langsmith.project;
            }

            logger.info(`✅ LangSmith tracing enabled: ${config.langsmith.project}`);
        } catch (error) {
            logger.warn('⚠️  LangSmith initialization failed:', error);
        }
    }

    /**
     * Log custom metric
     */
    logMetric(name, value, tags = {}) {
        // Always log timing for debugging, regardless of LangSmith
        logger.info(`📈 [${tags.label || name}] ${value}ms`, tags);
    }

    /**
     * Log execution time
     */
    async measureTime(label, fn) {
        const start = Date.now();
        try {
            const result = await fn();
            const duration = Date.now() - start;

            this.logMetric('execution_time', duration, {
                label,
                status: 'success',
            });

            return result;
        } catch (error) {
            const duration = Date.now() - start;
            this.logMetric('execution_time', duration, {
                label,
                status: 'error',
            });

            throw error;
        }
    }

    /**
     * Health check for telemetry
     */
    async healthCheck() {
        if (!this.enabled) return true;
        return true; // Assume healthy if config present
    }
}

export default new Telemetry();
