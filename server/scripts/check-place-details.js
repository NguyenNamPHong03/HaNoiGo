
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Place from '../models/Place.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkPlace() {
    try {
        console.log('📦 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        const nameQuery = "Bún Chả Hà Thành";
        console.log(`🔍 Searching for place: "${nameQuery}"...`);

        const place = await Place.findOne({
            name: { $regex: new RegExp(nameQuery, 'i') }
        }).lean();

        if (place) {
            console.log('✅ Found place:');
            console.log(JSON.stringify(place, null, 2));

            // Also check if there are linked reviews in the reviews collection
            const Review = mongoose.connection.collection('reviews');
            const reviewCount = await Review.countDocuments({ place: place._id });
            console.log(`\n📊 Linked Reviews in 'reviews' collection: ${reviewCount}`);

            if (place.additionalInfo && place.additionalInfo.reviews) {
                console.log(`📊 Reviews in 'additionalInfo': ${place.additionalInfo.reviews.length}`);
            }

        } else {
            console.log('❌ Place not found.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkPlace();
