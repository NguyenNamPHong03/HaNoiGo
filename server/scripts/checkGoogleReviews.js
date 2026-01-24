/**
 * Test script để verify Google reviews trong database
 * Usage: node server/scripts/checkGoogleReviews.js <placeId>
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import Place from '../models/Place.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkGoogleReviews = async (placeId) => {
  try {
    const place = await Place.findById(placeId).lean();
    
    if (!place) {
      console.log('❌ Place not found');
      return;
    }

    console.log('\n📍 Place:', place.name);
    console.log('📊 Total Reviews:', place.totalReviews);
    console.log('⭐ Average Rating:', place.averageRating);
    
    console.log('\n🔍 Checking Google reviews in additionalInfo...');
    const reviews = place?.additionalInfo?.reviews || [];
    
    if (reviews.length > 0) {
      console.log(`✅ Found ${reviews.length} Google reviews!`);
      console.log('\n📝 Sample review:');
      console.log(JSON.stringify(reviews[0], null, 2));
    } else {
      console.log('❌ No Google reviews found in additionalInfo.reviews');
      console.log('\n🔍 Available additionalInfo fields:');
      console.log(Object.keys(place.additionalInfo || {}));
    }

    // Also check googleData
    console.log('\n🔍 Checking googleData...');
    if (place.googleData) {
      console.log('GoogleData keys:', Object.keys(place.googleData));
    } else {
      console.log('❌ No googleData field');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

// Run
const placeId = process.argv[2] || '6974a71f43067f1d352fff7'; // Default: Hồ Tây

connectDB().then(() => checkGoogleReviews(placeId));
