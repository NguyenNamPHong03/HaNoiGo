
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import mainChatPipeline from '../services/ai/pipelines/mainChatPipeline.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTest() {
    try {
        console.log('📦 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        const query = "tìm quán chè ở ngõ tự do";
        console.log(`\n🔍 Testing query: "${query}"`);

        const result = await mainChatPipeline.execute(query, { userId: 'test-user' });

        console.log('\n🤖 AI Answer:');
        console.log(result.answer);

        console.log('\n📍 Places Found (Top 5):');
        const places = result.places || [];
        places.slice(0, 5).forEach((p, i) => {
            console.log(`${i + 1}. ${p.name}`);
            console.log(`   Address: ${p.address}`);
        });

        // Check if logs show Reranker initialized
        console.log("\nCheck server logs for '✅ Reranker initialized' and '✅ Reranked ... documents'");

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

runTest();
