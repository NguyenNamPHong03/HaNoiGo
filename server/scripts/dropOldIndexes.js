/**
 * @fileoverview Drop Old Indexes Script
 * @description Drop old geospatial indexes to fix import errors
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const dropOldIndexes = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected');

    const Place = mongoose.connection.collection('places');

    // Drop old indexes
    try {
      await Place.dropIndex('coordinates_2dsphere');
      console.log('✅ Dropped coordinates_2dsphere index');
    } catch (err) {
      console.log('⏭️  coordinates_2dsphere index not found');
    }

    try {
      await Place.dropIndex('source_1_goongPlaceId_1');
      console.log('✅ Dropped source_1_goongPlaceId_1 index');
    } catch (err) {
      console.log('⏭️  source_1_goongPlaceId_1 index not found');
    }

    // List current indexes
    const indexes = await Place.indexes();
    console.log('\n📊 Current indexes:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.name || JSON.stringify(idx.key)}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

dropOldIndexes();
