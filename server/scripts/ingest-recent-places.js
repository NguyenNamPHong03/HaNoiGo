
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
 * Chỉ import những địa điểm được tạo/cập nhật trong X ngày gần đây
 * Giải pháp cho việc Pinecone Serverless không hỗ trợ scan
 */
async function ingestRecentPlaces(daysAgo = 7) {
    try {
        console.log('📦 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        // Tính ngày cutoff
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        
        console.log(`🔍 Fetching places created/updated in last ${daysAgo} days...`);
        console.log(`   Cutoff date: ${cutoffDate.toISOString()}`);

        // Lấy địa điểm được tạo hoặc cập nhật gần đây
        const recentPlaces = await Place.find({
            status: 'Published',
            $or: [
                { createdAt: { $gte: cutoffDate } },
                { updatedAt: { $gte: cutoffDate } }
            ]
        }).lean();

        console.log(`   Found ${recentPlaces.length} recent places`);

        if (recentPlaces.length === 0) {
            console.log('✨ No recent places to ingest!');
            return { success: true, ingested: 0 };
        }

        // Prepare documents
        console.log('📝 Preparing documents...');
        const documents = recentPlaces.map(place => {
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
                    timestamp: new Date().toISOString()
                }
            };
        });

        // Split documents
        console.log('✂️  Splitting documents...');
        const chunks = await propositionSplitter.splitDocuments(documents);
        console.log(`   Created ${chunks.length} chunks from ${recentPlaces.length} places`);

        // Upload to Pinecone
        console.log('⬆️  Uploading to Pinecone...');
        await vectorStoreFactory.addDocuments(chunks);

        console.log('✅ Ingestion completed successfully!');
        console.log('📊 Summary:');
        console.log(`   - Places ingested: ${recentPlaces.length}`);
        console.log(`   - Chunks created: ${chunks.length}`);
        console.log(`   - Time window: Last ${daysAgo} days`);

        return {
            success: true,
            ingested: recentPlaces.length,
            chunks: chunks.length
        };

    } catch (error) {
        console.error('❌ Ingestion failed:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

// Lấy số ngày từ command line argument, mặc định 7 ngày
const daysAgo = parseInt(process.argv[2]) || 7;
console.log(`\n🚀 Starting ingestion for places from last ${daysAgo} days...\n`);
ingestRecentPlaces(daysAgo);
