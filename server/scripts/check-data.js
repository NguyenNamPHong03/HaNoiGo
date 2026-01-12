
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Place from '../models/Place.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 Connected to MongoDB');

        // Regex for Tự Do
        const regex = /(?:ngõ|ng\.?)\s+tự\s+do/i;
        console.log('🔍 Searching DB for address matching:', regex);

        const places = await Place.find({ address: regex }).lean();

        console.log(`✅ Found ${places.length} places in Ngõ Tự Do:`);
        places.forEach((p, i) => {
            console.log(`${i + 1}. [${p.name}] - ${p.address} (${p.category})`);
        });

    } catch (error) {
        console.error('❌ Check failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkData();
