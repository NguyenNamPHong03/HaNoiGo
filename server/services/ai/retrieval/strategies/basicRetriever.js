/**
 * Basic Retriever - Pure Vector Search
 * Mục đích: Retrieve documents dựa trên vector similarity
 */

import vectorStoreFactory from '../../core/vectorStoreFactory.js';
import { RETRIEVAL_CONFIG } from '../../config/constants.js';
import logger from '../../utils/logger.js';

class BasicRetriever {
    /**
     * Retrieve relevant documents
     */
    async retrieve(query, topK = RETRIEVAL_CONFIG.TOP_K) {
        try {
            logger.info(`🔍 Retrieving documents for: "${query}"`);

            const results = await vectorStoreFactory.querySimilar(
                query,
                topK,
                RETRIEVAL_CONFIG.MIN_SIMILARITY_SCORE
            );

            if (results.length === 0) {
                logger.warn('⚠️  No relevant documents found');
                return [];
            }

            logger.info(`✅ Retrieved ${results.length} documents`);

            return results.map((result) => ({
                id: result.id,
                score: result.score,
                pageContent: result.metadata?.text || '', // LangChain compatibility
                content: result.metadata?.text || '',
                source: result.metadata?.source || 'unknown',
                name: result.metadata?.name || '',
                metadata: result.metadata,
            }));
        } catch (error) {
            logger.error('❌ Retrieval failed:', error);
            throw error;
        }
    }

    /**
     * Batch retrieve for multiple queries
     */
    async batchRetrieve(queries, topK = RETRIEVAL_CONFIG.TOP_K) {
        try {
            const results = await Promise.all(
                queries.map((query) => this.retrieve(query, topK))
            );

            return results;
        } catch (error) {
            logger.error('❌ Batch retrieval failed:', error);
            throw error;
        }
    }
}

export default new BasicRetriever();
