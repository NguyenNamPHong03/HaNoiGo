/**
 * @fileoverview Verify Google Places Import
 * @description Check imported data quality and statistics
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const verifyImport = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected\n');

    const Place = mongoose.connection.collection('places');

    // Count by source
    const googleCount = await Place.countDocuments({ source: 'google' });
    const goongCount = await Place.countDocuments({ source: 'goong' });
    const manualCount = await Place.countDocuments({ source: 'manual' });
    const totalCount = await Place.countDocuments({});

    console.log('📊 DATABASE STATISTICS');
    console.log('='.repeat(50));
    console.log(`Total places: ${totalCount}`);
    console.log(`  - Google source: ${googleCount}`);
    console.log(`  - Goong source: ${goongCount}`);
    console.log(`  - Manual source: ${manualCount}`);
    console.log('='.repeat(50));

    // Check Google places data quality
    const googlePlaces = await Place.find({ source: 'google' }).limit(3).toArray();
    
    console.log('\n🔍 SAMPLE GOOGLE PLACES (first 3):');
    console.log('='.repeat(50));
    
    googlePlaces.forEach((place, idx) => {
      console.log(`\n[${idx + 1}] ${place.name}`);
      console.log(`  - googlePlaceId: ${place.googlePlaceId}`);
      console.log(`  - District: ${place.district || 'N/A'}`);
      console.log(`  - Category: ${place.category || 'N/A'}`);
      console.log(`  - Price Display: ${place.priceDisplay || 'N/A'}`);
      console.log(`  - Price Range: ${place.priceRange?.min || 0} - ${place.priceRange?.max || 0} VNĐ`);
      console.log(`  - Rating: ${place.averageRating || 0} (${place.totalReviews || 0} reviews)`);
      console.log(`  - AI Tags:`);
      console.log(`    * mood: ${place.aiTags?.mood?.join(', ') || 'N/A'}`);
      console.log(`    * space: ${place.aiTags?.space?.join(', ') || 'N/A'}`);
      console.log(`    * suitability: ${place.aiTags?.suitability?.join(', ') || 'N/A'}`);
      console.log(`  - Opening Hours: ${place.openingHours?.length || 0} entries`);
      console.log(`  - Reviews Distribution: ${JSON.stringify(place.reviewsDistribution || {})}`);
      console.log(`  - Location: [${place.location?.coordinates?.[0]}, ${place.location?.coordinates?.[1]}]`);
      console.log(`  - Google Data stored: ${!!place.googleData}`);
    });

    // Check places without aiTags (needs enrichment)
    const needsEnrich = await Place.countDocuments({ 
      source: 'google',
      $or: [
        { 'aiTags.mood': { $size: 0 } },
        { 'aiTags.space': { $size: 0 } },
        { 'aiTags.suitability': { $size: 0 } }
      ]
    });

    console.log('\n\n📝 ENRICHMENT STATUS');
    console.log('='.repeat(50));
    console.log(`Google places needing AI enrichment: ${needsEnrich}`);
    console.log('='.repeat(50));

    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

verifyImport();
