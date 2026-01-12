import dotenv from 'dotenv';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import Place from '../models/Place.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function checkGoogleImport() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Read the JSON file
    const jsonPath = path.join(__dirname, '../../dataset_crawler-google-places_2026-01-08_07-37-36-236 (1).json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    
    console.log(`\n📊 Total places in JSON file: ${jsonData.length}`);

    // Check how many places are already in database
    const placeIds = jsonData.map(p => p.placeId).filter(Boolean);
    const existingPlaces = await Place.find({
      $or: [
        { googleId: { $in: placeIds } },
        { placeId: { $in: placeIds } }
      ]
    }).select('name googleId placeId location');

    console.log(`✅ Places already in database: ${existingPlaces.length}`);
    console.log(`❌ Places NOT in database: ${jsonData.length - existingPlaces.length}`);

    // Show sample of existing places
    if (existingPlaces.length > 0) {
      console.log('\n📍 Sample existing places:');
      existingPlaces.slice(0, 5).forEach((place, idx) => {
        console.log(`  ${idx + 1}. ${place.name}`);
        console.log(`     googleId: ${place.googleId || place.placeId}`);
        console.log(`     location: ${place.location?.coordinates?.join(', ') || 'N/A'}`);
      });
    }

    // Show sample of places NOT imported
    const existingIds = new Set(existingPlaces.map(p => p.googleId || p.placeId));
    const notImported = jsonData.filter(p => !existingIds.has(p.placeId)).slice(0, 5);
    
    if (notImported.length > 0) {
      console.log('\n❌ Sample places NOT imported yet:');
      notImported.forEach((place, idx) => {
        console.log(`  ${idx + 1}. ${place.title}`);
        console.log(`     placeId: ${place.placeId}`);
        console.log(`     address: ${place.address}`);
        console.log(`     category: ${place.categoryName}`);
      });
    }

    // Check total places in database
    const totalPlaces = await Place.countDocuments();
    console.log(`\n📈 Total places in entire database: ${totalPlaces}`);

    // Check places with location data
    const placesWithLocation = await Place.countDocuments({
      'location.coordinates': { $exists: true, $ne: null }
    });
    console.log(`📍 Places with GPS coordinates: ${placesWithLocation}`);

    mongoose.connection.close();
    console.log('\n✅ Check complete!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkGoogleImport();
