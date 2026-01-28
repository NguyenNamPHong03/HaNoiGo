/**
 * Debug script to check if Văn Miếu and Starlake exist in Pinecone
 */

import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from server root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI;

async function findPlaces() {
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db();
        const placesCollection = db.collection('places');

        // Search for Văn Miếu
        const vanMieu = await placesCollection.findOne({
            name: { $regex: /văn miếu|van mieu/i }
        });
        console.log('\n🔍 Văn Miếu result:');
        console.log(vanMieu ? `   ✅ Found: ${vanMieu.name} (ID: ${vanMieu._id})` : '   ❌ NOT FOUND');

        // Search for Starlake
        const starlake = await placesCollection.findOne({
            name: { $regex: /starlake|star lake/i }
        });
        console.log('\n🔍 Starlake result:');
        console.log(starlake ? `   ✅ Found: ${starlake.name} (ID: ${starlake._id})` : '   ❌ NOT FOUND');

        // Search for Hồ Hoàn Kiếm
        const hoHoanKiem = await placesCollection.findOne({
            name: { $regex: /hồ hoàn kiếm|hoàn kiếm|hồ gươm|ho guom|hoan kiem/i }
        });
        console.log('\n🔍 Hồ Hoàn Kiếm result:');
        console.log(hoHoanKiem ? `   ✅ Found: ${hoHoanKiem.name} (ID: ${hoHoanKiem._id})` : '   ❌ NOT FOUND');

        // Count total places
        const total = await placesCollection.countDocuments();
        console.log(`\n📊 Total places in database: ${total}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

findPlaces();
