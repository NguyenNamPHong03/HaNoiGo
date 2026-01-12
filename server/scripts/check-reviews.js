
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkReviews() {
    try {
        console.log('📦 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        const Review = mongoose.connection.collection('reviews');
        const Place = mongoose.connection.collection('places');

        const totalReviews = await Review.countDocuments();
        console.log(`📊 Total Reviews in DB: ${totalReviews}`);

        if (totalReviews > 0) {
            const sampleReview = await Review.findOne({});
            console.log('📝 Sample Review:', JSON.stringify(sampleReview, null, 2));

            // Check if there are reviews with rating >= 4
            const goodReviews = await Review.countDocuments({ rating: { $gte: 4 } });
            console.log(`🌟 Reviews with rating >= 4: ${goodReviews}`);

            // Check linkage to places
            const place = await Place.findOne({ _id: sampleReview.place });
            console.log('🏗️  Linked Place:', place ? place.name : 'Not Found');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkReviews();
