/**
 * MongoDB Loader - Load documents từ MongoDB
 * Mục đích: Ingest data từ MongoDB collections vào vector store
 */

import { MongoClient } from 'mongodb';
import config from '../../config/index.js';
import logger from '../../utils/logger.js';

class MongoLoader {
    constructor() {
        this.client = null;
        this.db = null;
    }

    /**
     * Initialize MongoDB connection
     */
    async initialize() {
        if (this.client) return this.db;

        try {
            logger.info('🔌 Connecting to MongoDB...');

            this.client = new MongoClient(config.mongodb.uri, config.mongodb.options);
            await this.client.connect();

            this.db = this.client.db(config.mongodb.dbName);

            logger.info('✅ MongoDB connected');
            return this.db;
        } catch (error) {
            logger.error('❌ MongoDB connection failed:', error);
            throw error;
        }
    }

    /**
     * Load documents từ collection
     */
    async loadDocuments(collectionName, query = {}, limit = 1000) {
        try {
            const db = await this.initialize();
            const collection = db.collection(collectionName);

            const documents = await collection
                .find(query)
                .limit(limit)
                .toArray();

            logger.info(`✅ Loaded ${documents.length} documents from ${collectionName}`);
            return documents;
        } catch (error) {
            logger.error('❌ Document loading failed:', error);
            throw error;
        }
    }

    /**
     * Stream large document collections
     */
    async streamDocuments(collectionName, batchSize = 100) {
        try {
            const db = await this.initialize();
            const collection = db.collection(collectionName);

            const cursor = collection.find().batchSize(batchSize);

            return {
                async *[Symbol.asyncIterator]() {
                    while (await cursor.hasNext()) {
                        yield await cursor.next();
                    }
                },
            };
        } catch (error) {
            logger.error('❌ Stream initialization failed:', error);
            throw error;
        }
    }

    /**
     * Close connection
     */
    async close() {
        if (this.client) {
            await this.client.close();
            logger.info('✅ MongoDB connection closed');
        }
    }
}

export default new MongoLoader();
