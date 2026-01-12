/**
 * Vector Store Factory - Singleton Pattern
 * Mục đích: Quản lý Pinecone vector database connection
 * Trách nhiệm: Initialize, cache, query Pinecone
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import config from '../config/index.js';
import logger from '../utils/logger.js';

class VectorStoreFactory {
    constructor() {
        this.pinecone = null;
        this.embeddings = null;
        this.vectorStore = null;
        this.initialized = false;
    }

    /**
     * Initialize Pinecone and embeddings
     */
    async initialize() {
        if (this.initialized) {
            return this.vectorStore;
        }

        try {
            logger.info('🗂️  Initializing Vector Store...');

            // Initialize Pinecone
            this.pinecone = new Pinecone({
                apiKey: config.pinecone.apiKey,
            });

            // Get index
            const index = this.pinecone.Index(config.pinecone.indexName);

            // Initialize embeddings
            this.embeddings = new OpenAIEmbeddings({
                apiKey: config.openai.apiKey,
                modelName: config.openai.embeddingModel,
                dimensions: 1536, // Standard dimension for text-embedding-3-small
            });

            // Test connection
            const stats = await index.describeIndexStats();
            logger.info(`✅ Pinecone connected. Total vectors: ${stats.totalVectorCount}`);

            this.vectorStore = index;
            this.initialized = true;

            return this.vectorStore;
        } catch (error) {
            logger.error('❌ Vector Store initialization failed:', error);
            throw error;
        }
    }

    /**
     * Get embeddings instance
     */
    async getEmbeddings() {
        if (!this.initialized) {
            await this.initialize();
        }
        return this.embeddings;
    }

    /**
     * Get vector store index
     */
    async getVectorStore() {
        if (!this.initialized) {
            await this.initialize();
        }
        return this.vectorStore;
    }

    /**
     * Query similar vectors
     */
    async querySimilar(query, topK = 5, minScore = 0.5) {
        try {
            const embedding = await (await this.getEmbeddings()).embedQuery(query);
            const store = await this.getVectorStore();

            const results = await store.query({
                vector: embedding,
                topK,
                includeMetadata: true,
            });

            // Filter by score
            return results.matches
                .filter((match) => match.score >= minScore)
                .map((match) => ({
                    id: match.id,
                    score: match.score,
                    metadata: match.metadata,
                }));
        } catch (error) {
            logger.error('❌ Vector query failed:', error);
            throw error;
        }
    }

    /**
     * Upsert vectors (save to Pinecone)
     */
    /**
     * Add documents (generate embeddings -> upsert)
     * @param {Array<{pageContent: string, metadata: object}>} documents
     */
    async addDocuments(documents) {
        try {
            const embeddings = await this.getEmbeddings();
            const texts = documents.map((d) => d.pageContent);

            logger.info(`🧠 Generating embeddings for ${documents.length} chunks...`);
            const vectors = await embeddings.embedDocuments(texts);

            const records = documents.map((doc, i) => ({
                id: doc.metadata.id || `${Date.now()}-${i}`,
                values: vectors[i],
                metadata: {
                    ...doc.metadata,
                    text: doc.pageContent, // Important for context retrieval
                },
            }));

            // Batch upsert (limit 100 per batch)
            const BATCH_SIZE = 100;
            for (let i = 0; i < records.length; i += BATCH_SIZE) {
                const batch = records.slice(i, i + BATCH_SIZE);
                await this.upsertVectors(batch);
            }

            logger.info(`✅ Added ${documents.length} documents to vector store`);
        } catch (error) {
            logger.error('❌ Add documents failed:', error);
            throw error;
        }
    }

    /**
     * Upsert vectors (save to Pinecone)
     */
    async upsertVectors(vectors) {
        try {
            const store = await this.getVectorStore();
            await store.upsert(vectors);
            logger.info(`✅ Upserted ${vectors.length} vectors`);
        } catch (error) {
            logger.error('❌ Upsert failed:', error);
            throw error;
        }
    }

    /**
     * Delete all vectors from the index
     */
    async deleteAll() {
        try {
            const store = await this.getVectorStore();
            logger.info('🗑️  Deleting all vectors from Pinecone...');
            await store.deleteAll();
            logger.info('✅ All vectors deleted');
        } catch (error) {
            logger.error('❌ Delete failed:', error);
            throw error;
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const store = await this.getVectorStore();
            const stats = await store.describeIndexStats();
            return !!stats;
        } catch {
            return false;
        }
    }
}

export default new VectorStoreFactory();
