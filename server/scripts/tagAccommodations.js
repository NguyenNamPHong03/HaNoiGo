/**
 * SCRIPT: Tag Accommodation Places
 * Mục đích: Tự động tag các địa điểm có tên chứa "nhà nghỉ", "homestay", "khách sạn"
 *          thành category "Lưu trú" để AI có thể gợi ý khi user hỏi về chỗ nghỉ
 * 
 * Cách dùng:
 * 1. Review mode (không update): node server/scripts/tagAccommodations.js
 * 2. Execute mode (update DB): node server/scripts/tagAccommodations.js --execute
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Place from '../models/Place.js';

dotenv.config();

// Accommodation keywords to detect
const ACCOMMODATION_KEYWORDS = [
  'nhà nghỉ',
  'homestay',
  'khách sạn',
  'hotel',
  'motel',
  'resort',
  'villa',
  'căn hộ',
  'apartment',
  'hostel',
  'guesthouse',
  'mini hotel',
  'minihotel',
  'phòng trọ',
  'cho thuê phòng'
];

/**
 * Detect if place name/description indicates accommodation
 */
const isAccommodation = (place) => {
  const searchText = `${place.name} ${place.description || ''}`.toLowerCase();
  
  return ACCOMMODATION_KEYWORDS.some(keyword => 
    searchText.includes(keyword.toLowerCase())
  );
};

/**
 * Main function
 */
const tagAccommodations = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const executeMode = process.argv.includes('--execute');
    
    if (executeMode) {
      console.log('⚠️  EXECUTE MODE: Changes will be written to database\n');
    } else {
      console.log('👁️  REVIEW MODE: No changes will be made (add --execute to apply)\n');
    }

    // Fetch all places that are NOT already "Lưu trú"
    const places = await Place.find({
      category: { $ne: 'Lưu trú' }
    }).lean();

    console.log(`📊 Found ${places.length} places to analyze\n`);

    const candidates = [];

    // Analyze each place
    for (const place of places) {
      if (isAccommodation(place)) {
        candidates.push({
          _id: place._id,
          name: place.name,
          currentCategory: place.category,
          address: place.address,
          description: (place.description || '').substring(0, 100)
        });
      }
    }

    console.log(`🏨 Found ${candidates.length} accommodation candidates:\n`);
    
    // Display candidates
    candidates.forEach((candidate, index) => {
      console.log(`${index + 1}. ${candidate.name}`);
      console.log(`   Current: ${candidate.currentCategory} → New: Lưu trú`);
      console.log(`   Address: ${candidate.address}`);
      console.log(`   Description: ${candidate.description}...`);
      console.log('');
    });

    if (candidates.length === 0) {
      console.log('✅ No accommodation places need tagging');
      process.exit(0);
    }

    // Execute update if in execute mode
    if (executeMode) {
      console.log('🚀 Updating database...\n');
      
      const placeIds = candidates.map(c => c._id);
      
      const result = await Place.updateMany(
        { _id: { $in: placeIds } },
        { $set: { category: 'Lưu trú' } }
      );

      console.log(`✅ Successfully updated ${result.modifiedCount} places to category "Lưu trú"`);
      
      // Verify
      const verifyCount = await Place.countDocuments({ category: 'Lưu trú' });
      console.log(`\n📊 Total places in "Lưu trú" category: ${verifyCount}`);
    } else {
      console.log('💡 To apply these changes, run:');
      console.log('   node server/scripts/tagAccommodations.js --execute\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
};

// Run script
tagAccommodations();
