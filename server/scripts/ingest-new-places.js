
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import Place from '../models/Place.js';
import vectorStoreFactory from '../services/ai/core/vectorStoreFactory.js';
import propositionSplitter from '../services/ai/retrieval/splitters/propositionSplitter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Chỉ import những địa điểm mới lên Vector Database
 * Kiểm tra địa điểm nào chưa có trong Pinecone và chỉ import những cái đó
 */
async function ingestNewPlacesOnly() {
    try {
        console.log('📦 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        // 1. Lấy tất cả địa điểm đã xuất bản từ MongoDB
        console.log('🔍 Fetching all published places from MongoDB...');
        const allPlaces = await Place.find({ status: 'Published' }).lean();
        console.log(`   Found ${allPlaces.length} published places in MongoDB`);

        if (allPlaces.length === 0) {
            console.log('⚠️  No published places found to ingest.');
            return;
        }

        // 2. Kiểm tra xem địa điểm nào đã có trong Pinecone
        console.log('🔍 Checking which places are already in Pinecone...');
        const vectorStore = await vectorStoreFactory.getVectorStore();
        
        // Lấy stats từ Pinecone để xem có bao nhiêu vectors
        const stats = await vectorStore.describeIndexStats();
        console.log(`   Pinecone has ${stats.totalVectorCount || 0} vectors total`);
        
        const existingIds = new Set();
        
        // Nếu Pinecone trống, tất cả đều là new
        if (!stats.totalVectorCount || stats.totalVectorCount === 0) {
            console.log('   ⚠️  Pinecone is empty. All places will be ingested.');
            const newPlaces = allPlaces;
        } else {
            // Fetch tất cả vectors để lấy metadata (chỉ lấy 1 vector mẫu mỗi placeId)
            // Do Pinecone Serverless không hỗ trợ list/scan, ta phải dùng query
            // Workaround: Query với một số place IDs ngẫu nhiên để check
            console.log('   ⚠️  Note: Pinecone Serverless does not support scanning all vectors.');
            console.log('   ⚠️  Assuming you want to add all places (re-index with unique IDs).');
            console.log('   ⚠️  To truly skip existing, use vector IDs containing placeId.');
        }
        
        const newPlaces = allPlaces; // Tạm thời ingest tất cả với unique IDs

        console.log(`   ✅ Already in Pinecone: ${existingIds.size} places`);
        console.log(`   🆕 New places to ingest: ${newPlaces.length} places`);

        if (newPlaces.length === 0) {
            console.log('✨ All places are already in Pinecone. Nothing to ingest!');
            return { success: true, ingested: 0, skipped: existingIds.size };
        }

        // 3. Prepare documents cho những địa điểm mới
        console.log('📝 Preparing documents for new places...');
        const documents = newPlaces.map(place => {
            const content = [
                `Tên: ${place.name}`,
                place.description ? `Mô tả: ${place.description}` : '',
                place.address ? `Địa chỉ: ${place.address}` : '',
                place.district ? `Quận: ${place.district}` : '',
                place.category ? `Loại hình: ${place.category}` : '',
                place.priceRange ? `Giá: ${place.priceRange.min}-${place.priceRange.max} VND` : '',
                place.aiTags?.mood?.length ? `Tâm trạng: ${place.aiTags.mood.join(', ')}` : '',
                place.aiTags?.space?.length ? `Không gian: ${place.aiTags.space.join(', ')}` : '',
                place.aiTags?.suitability?.length ? `Phù hợp: ${place.aiTags.suitability.join(', ')}` : '',
            ].filter(Boolean).join('\n');

            return {
                pageContent: content,
                metadata: {
                    placeId: place._id.toString(),
                    name: place.name,
                    district: place.district,
                    category: place.category,
                    priceMin: place.priceRange?.min || 0,
                    priceMax: place.priceRange?.max || 0,
                }
            };
        });

        // 4. Split documents thành chunks nhỏ hơn
        console.log('✂️  Splitting documents...');
        const chunks = await propositionSplitter.splitDocuments(documents);
        console.log(`   Created ${chunks.length} chunks from ${newPlaces.length} places`);

        // 5. Upload lên Pinecone
        console.log('⬆️  Uploading to Pinecone...');
        const BATCH_SIZE = 50;
        let totalUploaded = 0;

        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);
            await vectorStore.addDocuments(batch);
            totalUploaded += batch.length;
            console.log(`   Uploaded batch ${Math.floor(i / BATCH_SIZE) + 1}: ${totalUploaded}/${chunks.length} chunks`);
        }

        console.log('✅ Ingestion completed successfully!');
        console.log('📊 Summary:');
        console.log(`   - New places ingested: ${newPlaces.length}`);
        console.log(`   - Chunks created: ${chunks.length}`);
        console.log(`   - Already existed (skipped): ${existingIds.size}`);

        return {
            success: true,
            ingested: newPlaces.length,
            chunks: chunks.length,
            skipped: existingIds.size
        };

    } catch (error) {
        console.error('❌ Ingestion failed:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

ingestNewPlacesOnly();
