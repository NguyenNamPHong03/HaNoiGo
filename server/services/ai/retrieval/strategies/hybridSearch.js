import { vectorStoreFactory } from '../../core/vectorStoreFactory.js';
import { config } from '../../config/index.js';

export class HybridRetriever {
    /**
     * Thực hiện tìm kiếm Vector có Filter
     * @param {string} query - Câu hỏi user
     * @param {Object} filters - Filter metadata (district, mood...)
     */
    async search(query, filters = {}) {
        const store = await vectorStoreFactory.getStore();

        // 1. Build Pinecone Filter Object
        // Lưu ý: Cấu trúc filter phụ thuộc vào cách bạn lưu metadata lúc ingest
        const pineconeFilter = {};

        if (filters.district) {
            pineconeFilter['district'] = { '$eq': filters.district };
        }
        // Ví dụ filter nested field
        if (filters.mood) {
            pineconeFilter['aiTags.mood'] = { '$eq': filters.mood };
        }
        if (filters.priceRange) {
            // Example simple filter, adapt based on your actual metadata
            pineconeFilter['priceRange'] = { '$eq': filters.priceRange };
        }

        console.log(`🔎 Searching Pinecone with filter:`, JSON.stringify(pineconeFilter));

        // 2. Execute Search
        // k: Số lượng kết quả lấy về
        const results = await store.similaritySearch(query, config.retrieval.topK, pineconeFilter);

        return results;
    }
}

export const hybridRetriever = new HybridRetriever();
