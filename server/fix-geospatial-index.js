/**
 * @fileoverview Fix Geospatial Index
 * @description Drop old 'coordinates' index and create proper 'location' index
 * Run: node fix-geospatial-index.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function fixGeospatialIndex() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('places');

    // 1. Get existing indexes
    console.log('\n📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // 2. Drop old 'coordinates' 2dsphere index if exists
    const coordinatesIndex = indexes.find(idx => 
      idx.key.coordinates === '2dsphere' || 
      idx.key['coordinates.coordinates'] === '2dsphere'
    );

    if (coordinatesIndex) {
      console.log(`\n🗑️ Dropping old index: ${coordinatesIndex.name}`);
      await collection.dropIndex(coordinatesIndex.name);
      console.log('✅ Old index dropped');
    } else {
      console.log('\n⚠️ No old coordinates index found');
    }

    // 3. Ensure 'location' 2dsphere index exists
    const locationIndex = indexes.find(idx => 
      idx.key.location === '2dsphere' || 
      idx.key['location.coordinates'] === '2dsphere'
    );

    if (!locationIndex) {
      console.log('\n🔧 Creating location 2dsphere index...');
      await collection.createIndex({ location: '2dsphere' });
      console.log('✅ Location index created');
    } else {
      console.log('\n✅ Location index already exists');
    }

    // 4. Verify final indexes
    console.log('\n📋 Final indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n🎉 Geospatial index fix completed!');
    console.log('\n💡 Now restart your server and test import again.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

fixGeospatialIndex();
