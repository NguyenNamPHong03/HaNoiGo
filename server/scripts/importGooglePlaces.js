/**
 * @fileoverview Google Places Import Script
 * @description Import địa điểm từ Google Places dataset JSON vào MongoDB
 * @usage node server/scripts/importGooglePlaces.js
 */

import dotenv from 'dotenv';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import Place from '../models/Place.js';
import { mapGooglePlaceToPlace, validatePlaceData } from '../utils/googlePlaceMapper.js';

// ES modules workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * @desc Connect to MongoDB
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI or MONGO_URI not found in environment variables. Please create server/.env file.');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * @desc Import places from Google dataset
 * @param {String} filePath - Path to JSON file
 * @param {Object} options - { limit, skipExisting }
 */
const importGooglePlaces = async (filePath, options = {}) => {
  const { limit = null, skipExisting = true } = options;

  try {
    // Read JSON file
    console.log(`📂 Reading file: ${filePath}`);
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const googlePlaces = JSON.parse(rawData);

    console.log(`📊 Found ${googlePlaces.length} places in dataset`);

    const stats = {
      total: googlePlaces.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    // Process places (with optional limit)
    const placesToProcess = limit ? googlePlaces.slice(0, limit) : googlePlaces;

    for (let i = 0; i < placesToProcess.length; i++) {
      const googleData = placesToProcess[i];
      
      try {
        console.log(`\n[${i + 1}/${placesToProcess.length}] Processing: ${googleData.title}`);

        // Check if exists
        if (skipExisting && googleData.placeId) {
          const exists = await Place.findOne({
            source: 'google',
            googlePlaceId: googleData.placeId
          });

          if (exists) {
            console.log(`⏭️  Skipped (already exists): ${googleData.title}`);
            stats.skipped++;
            continue;
          }
        }

        // Map data
        const placeData = mapGooglePlaceToPlace(googleData);

        // Validate
        const validation = validatePlaceData(placeData);
        if (!validation.valid) {
          console.log(`❌ Validation failed: ${validation.errors.join(', ')}`);
          stats.errors.push({
            place: googleData.title,
            errors: validation.errors
          });
          continue;
        }

        // Upsert
        const result = await Place.findOneAndUpdate(
          { source: 'google', googlePlaceId: googleData.placeId },
          placeData,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        if (result) {
          console.log(`✅ Imported: ${googleData.title}`);
          stats.imported++;
        }

      } catch (error) {
        console.error(`❌ Error processing ${googleData.title}:`, error.message);
        stats.errors.push({
          place: googleData.title,
          error: error.message
        });
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total in dataset: ${stats.total}`);
    console.log(`Processed: ${placesToProcess.length}`);
    console.log(`✅ Imported: ${stats.imported}`);
    console.log(`⏭️  Skipped: ${stats.skipped}`);
    console.log(`❌ Errors: ${stats.errors.length}`);
    console.log('='.repeat(60));

    if (stats.errors.length > 0) {
      console.log('\n❌ ERROR DETAILS:');
      stats.errors.slice(0, 10).forEach((err, idx) => {
        console.log(`${idx + 1}. ${err.place}: ${err.error || err.errors?.join(', ')}`);
      });
    }

    return stats;

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
};

/**
 * @desc Main function
 */
const main = async () => {
  try {
    await connectDB();

    // File path (adjust based on your file location)
    const filePath = path.join(
      __dirname, 
      '../../dataset_crawler-google-places_2026-01-08_07-37-36-236 (1).json'
    );

    // Check file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Import with options
    await importGooglePlaces(filePath, {
      limit: null, // null = import all, hoặc set số lượng (ví dụ: 100)
      skipExisting: true // Skip places đã tồn tại
    });

    console.log('\n✅ Import completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
};

// Run script
main();
