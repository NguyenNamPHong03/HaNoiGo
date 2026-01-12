
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import ingestionPipeline from '../services/ai/pipelines/ingestionPipeline.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function ingestAll() {
    try {
        console.log('📦 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        console.log('🚀 Starting ingestion...');
        const result = await ingestionPipeline.ingest('places', true);

        console.log('✅ Ingestion successfully!');
        console.log('📊 Stats:', result);

    } catch (error) {
        console.error('❌ Ingestion failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

ingestAll();
