
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Place from '../models/Place.js'; // Ensure this path is correct relative to the script

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function getOnePlace() {
    try {
        console.log('📦 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        const place = await Place.findOne().lean();

        if (place) {
            console.log('✅ Found one place:');
            console.log(JSON.stringify(place, null, 2));
        } else {
            console.log('⚠️ No places found in the database.');
        }

    } catch (error) {
        console.error('❌ Error fetching place:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

getOnePlace();
