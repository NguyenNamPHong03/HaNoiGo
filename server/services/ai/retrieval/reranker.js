/**
 * Reranker - Use Cohere to rerank retrieved documents
 * Mục đích: Improve ranking of retrieved documents
 * Trách nhiệm: Call Cohere API, rerank results
 */

import { CohereRerank } from '@langchain/cohere';
import config from '../config/index.js';
import { RETRIEVAL_CONFIG } from '../config/constants.js';
import logger from '../utils/logger.js';

class Reranker {
    constructor() {
        this.reranker = null;
        this.initialized = false;
    }

    /**
     * Initialize Cohere reranker
     */
    async initialize() {
        if (this.initialized || !config.cohere.apiKey) {
            return;
        }

        try {
            logger.info('🔄 Initializing Cohere reranker...');

            this.reranker = new CohereRerank({
                apiKey: config.cohere.apiKey,
                model: RETRIEVAL_CONFIG.RERANK_MODEL,
                topN: RETRIEVAL_CONFIG.RERANK_TOP_K,
            });

            this.initialized = true;
            logger.info('✅ Reranker initialized');
        } catch (error) {
            logger.warn('⚠️  Reranker initialization failed:', error);
            this.reranker = null;
        }
    }

    /**
     * Rerank documents
     */
    async rerank(query, documents) {
        if (!this.reranker) {
            logger.warn('⚠️  Reranker not available, returning original order');
            return documents;
        }

        try {
            logger.info(`📊 Reranking ${documents.length} documents...`);

            const reranked = await this.reranker.compressDocuments(
                documents,
                query
            );

            logger.info(`✅ Reranked ${reranked.length} documents`);
            return reranked;
        } catch (error) {
            logger.error('❌ Reranking failed:', error);
            return documents; // Fallback to original
        }
    }
}

export default new Reranker();
