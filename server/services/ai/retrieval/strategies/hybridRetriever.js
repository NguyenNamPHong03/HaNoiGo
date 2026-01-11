/**
 * Hybrid Retriever - Vector Search + BM25 Keyword Search
 * Mục đích: Combine semantic and keyword matching
 */

import { BM25Retriever } from 'langchain/retrievers/bm25';
import basicRetriever from './basicRetriever.js';
import logger from '../../utils/logger.js';

class HybridRetriever {
    constructor() {
        this.bm25Retriever = null;
    }

    /**
     * Initialize BM25 retriever (requires document index)
     */
    async initialize(documents) {
        try {
            logger.info('🔧 Initializing BM25 retriever...');

            this.bm25Retriever = await BM25Retriever.fromDocuments(
                documents,
                {
                    k: 5,
                }
            );

            logger.info('✅ BM25 retriever initialized');
        } catch (error) {
            logger.warn('⚠️  BM25 initialization failed:', error);
            this.bm25Retriever = null;
        }
    }

    /**
     * Hybrid retrieve: combine vector + keyword results
     */
    async retrieve(query, topK = 5) {
        try {
            logger.info(`🔄 Hybrid retrieval for: "${query}"`);

            // Vector search
            const vectorResults = await basicRetriever.retrieve(query, topK);

            // Keyword search (if available)
            let keywordResults = [];
            if (this.bm25Retriever) {
                const bm25Results = await this.bm25Retriever.getRelevantDocuments(query);
                keywordResults = bm25Results.slice(0, topK).map((doc) => ({
                    id: doc.metadata?.id || doc.metadata?.source,
                    score: 0.5, // BM25 doesn't return scores in same format
                    content: doc.pageContent,
                    source: doc.metadata?.source,
                    metadata: doc.metadata,
                }));
            }

            // Merge results (deduplicate by id)
            const merged = new Map();

            vectorResults.forEach((result) => {
                merged.set(result.id, { ...result, type: 'vector' });
            });

            keywordResults.forEach((result) => {
                if (merged.has(result.id)) {
                    // Boost score if found in both
                    merged.get(result.id).score += result.score;
                    merged.get(result.id).type = 'hybrid';
                } else {
                    merged.set(result.id, { ...result, type: 'keyword' });
                }
            });

            // Sort by combined score
            const final = Array.from(merged.values())
                .sort((a, b) => b.score - a.score)
                .slice(0, topK);

            logger.info(`✅ Hybrid retrieval returned ${final.length} results`);
            return final;
        } catch (error) {
            logger.error('❌ Hybrid retrieval failed:', error);
            // Fallback to vector-only
            return basicRetriever.retrieve(query, topK);
        }
    }
}

export default new HybridRetriever();
