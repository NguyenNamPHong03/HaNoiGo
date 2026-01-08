import dotenv from 'dotenv';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import Place from '../models/Place.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Update existing Google Places với reviews từ JSON file
 */
async function updateGooglePlacesWithReviews() {
  try {
    // Connect MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Read JSON file
    const jsonPath = path.join(__dirname, '../../dataset_crawler-google-places_2026-01-08_07-37-36-236 (1).json');
    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const googlePlaces = JSON.parse(rawData);

    console.log(`📦 Found ${googlePlaces.length} Google Places in JSON`);

    let updated = 0;
    let notFound = 0;

    for (const googleData of googlePlaces) {
      if (!googleData.placeId || !googleData.reviews || googleData.reviews.length === 0) {
        continue; // Skip if no placeId or no reviews
      }

      // Find place in MongoDB by googlePlaceId
      const place = await Place.findOne({ googlePlaceId: googleData.placeId });

      if (!place) {
        notFound++;
        continue;
      }

      // Update additionalInfo with reviews
      place.additionalInfo = {
        ...(place.additionalInfo || {}),
        reviews: googleData.reviews
      };

      await place.save({ validateBeforeSave: false }); // Skip validation
      updated++;

      console.log(`✅ Updated ${place.name} - ${googleData.reviews.length} reviews`);
    }

    console.log('\n📊 Summary:');
    console.log(`  ✅ Updated: ${updated} places`);
    console.log(`  ❌ Not found in DB: ${notFound} places`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateGooglePlacesWithReviews();
