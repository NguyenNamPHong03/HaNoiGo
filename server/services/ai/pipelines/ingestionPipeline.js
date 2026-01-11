/**
 * Ingestion Pipeline - ETL for RAG
 * Mục đích: Extract data từ MongoDB -> Transform (Split/Seralize) -> Load into Pinecone
 * Trách nhiệm: Đảm bảo dữ liệu trong Vector DB luôn sync với Main DB
 */

import mongoLoader from '../retrieval/loaders/mongoLoader.js';
import propositionSplitter from '../retrieval/splitters/propositionSplitter.js';
import semanticSplitter from '../retrieval/splitters/semanticSplitter.js';
import vectorStoreFactory from '../core/vectorStoreFactory.js';
import logger from '../utils/logger.js';

class IngestionPipeline {
    constructor() {
        this.BATCH_SIZE = 100;
    }

    /**
     * Run ingestion process
     * @param {string} collectionName - MongoDB collection name to ingest (e.g., 'places')
     * @param {boolean} useLLM - Whether to use LLM for extraction
     * @param {number} limit - Number of documents to ingest (0 for all)
     */
    async ingest(collectionName, useLLM = true, limit = 0) {
        try {
            logger.info(`🚀 Starting ingestion for collection: ${collectionName} (Limit: ${limit || 'ALL'}, Method: ${useLLM ? 'Propositions (LLM)' : 'Standard'})`);

            // 1. DELETE OLD DATA
            // Critical First Step: Clear Pinecone
            try {
                logger.info('🗑️  Clearing all old data from Pinecone...');
                await vectorStoreFactory.deleteAll();
                logger.info('✅ Old data cleared');
            } catch (err) {
                logger.warn('⚠️ Could not delete all vectors (index might be empty or serverless restriction). Proceeding...');
            }

            // 2. EXTRACT: Load documents from MongoDB
            // Retrieve all docs if limit is 0
            const loadLimit = limit === 0 ? 10000 : limit;
            const rawDocs = await mongoLoader.loadDocuments(collectionName, { status: 'Published' }, loadLimit);

            if (!rawDocs || !rawDocs.length) {
                logger.warn('⚠️ No documents found to ingest.');
                return { success: false, message: 'No docs found' };
            }

            // 3. TRANSFORM: Convert to LangChain Document format
            const documents = this.prepareDocuments(rawDocs, collectionName);

            // 4. SPLIT: Chunking
            let chunks = [];
            if (useLLM) {
                logger.info('🧠 Using Proposition Extraction (LLM)...');
                chunks = await propositionSplitter.splitDocuments(documents);
            } else {
                logger.info('🔪 Using Standard Semantic Splitter...');
                chunks = await semanticSplitter.splitDocuments(documents);
            }

            // 5. LOAD: Upsert to Pinecone
            await vectorStoreFactory.addDocuments(chunks);

            logger.info('✅ Ingestion pipeline completed successfully');

            return {
                totalPlaces: rawDocs.length,
                totalPropositions: chunks.length,
                avgPropositionsPerPlace: (chunks.length / rawDocs.length).toFixed(1),
                usedLLM: useLLM,
                success: true
            };
        } catch (error) {
            logger.error('❌ Ingestion failed:', error);
            throw error;
        }
    }

    /**
     * Prepare documents based on PropertyCard requirements
     */
    prepareDocuments(rawDocs, collectionName) {
        return rawDocs.map((doc) => {
            let pageContent = '';

            // Core metadata needed by SearchResult.jsx > PropertyCard and AI context
            let metadata = {
                source: collectionName,
                id: doc._id.toString(), // PropertyCard uses 'id'
                originalId: doc._id.toString(),
                name: doc.name,
                address: doc.address || '',
                category: doc.category || '',
                // Ensure numbers
                price: doc.priceRange?.max || doc.priceRange?.min || 0,
                rating: doc.averageRating || 0,
                // Taking first image for card display
                image: doc.images && doc.images.length > 0 ? doc.images[0] : '',
                // For detailed context if needed
                reviewCount: doc.totalReviews || 0,
            };

            if (collectionName === 'places') {
                pageContent = doc.description || '';
                // Enrich pageContent with AI tags so Proposition Splitter captures them
                if (doc.aiTags) {
                    const moodText = doc.aiTags.mood?.length ? `Mood: ${doc.aiTags.mood.join(', ')}.` : '';
                    const spaceText = doc.aiTags.space?.length ? `Space: ${doc.aiTags.space.join(', ')}.` : '';
                    const featureText = doc.aiTags.specialFeatures?.length ? `Features: ${doc.aiTags.specialFeatures.join(', ')}.` : '';

                    pageContent = `${pageContent}\n\n${moodText} ${spaceText} ${featureText}`.trim();

                    metadata.space = doc.aiTags.space?.join(', ') || '';
                    metadata.mood = doc.aiTags.mood?.join(', ') || '';
                    metadata.specialFeatures = doc.aiTags.specialFeatures?.join(', ') || '';
                }
            } else {
                pageContent = JSON.stringify(doc);
            }

            return {
                pageContent, // This will be used by PropositionSplitter to generate atomic facts
                metadata,
            };
        });
    }
}

export default new IngestionPipeline();
