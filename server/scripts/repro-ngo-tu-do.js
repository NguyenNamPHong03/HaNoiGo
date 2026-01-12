import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Place from '../models/Place.js';
import mainChatPipeline from '../services/ai/pipelines/mainChatPipeline.js';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hanoigo';

async function runTest() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Verify Place Exists
        const targetPlace = await Place.findOne({ name: { $regex: 'Chè anh đẹp trai', $options: 'i' } });
        if (!targetPlace) {
            console.error('❌ FATAL: "Chè anh đẹp trai" not found in DB! Cannot test search.');
            return;
        }
        console.log('Ensure Place Exists:', {
            name: targetPlace.name,
            address: targetPlace.address
        });

        // 2. Test Pipeline with failing query
        const query = "có quán chè nào ở ngõ tự do không";
        console.log(`\n🔎 Testing Pipeline with query: "${query}"...`);

        const result = await mainChatPipeline.execute(query);

        console.log('\n--- Pipeline Result ---');
        console.log('Answer:', result.answer);

        // Check if retrievedDocs contains the target place
        const foundDoc = result.sources.find(src => src.metadata.name === targetPlace.name);

        if (foundDoc) {
            console.log(`\n✅ SUCCESS: Found target place in sources!`);
        } else {
            console.log(`\n❌ FAIL: Target place NOT found in sources.`);
            console.log('Retrieved Place Names:', result.sources.map(s => s.metadata.name));
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
