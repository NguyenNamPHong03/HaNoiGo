
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Place from '../models/Place.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkPrice() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const regex = /(?:ngõ|ng\.?)\s+tự\s+do/i;
        const places = await Place.find({ address: regex }).lean();

        places.forEach(p => {
            console.log(`[${p.name}] Price: ${p.priceRange?.min} - ${p.priceRange?.max}`);
        });

    } catch (error) {
        console.error('❌ Check failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkPrice();
