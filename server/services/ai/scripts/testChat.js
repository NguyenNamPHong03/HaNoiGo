
// Import dependency
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Import AI Service
import * as aiService from '../index.js';

// Setup MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};

const runTest = async () => {
    await connectDB();
    await aiService.initializeAIService();

    const question = "Nhà hàng lãng mạn cho buổi hẹn hò ở Hà Nội";
    console.log(`\n❓ Question: "${question}"`);
    console.log('⏳ Processing...');

    const start = Date.now();
    try {
        const result = await aiService.processMessage(question);
        const duration = (Date.now() - start) / 1000;

        console.log(`\n✅ Done in ${duration}s`);
        console.log('--------------------------------------------------');
        console.log('📝 Answer:', result.answer);
        console.log('--------------------------------------------------');

        console.log(`📍 Found ${result.sources?.length || 0} sources`);
        result.sources?.forEach((src, idx) => {
            console.log(`   ${idx + 1}. ${src.name} (Score: ${src.score?.toFixed(2)})`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();
