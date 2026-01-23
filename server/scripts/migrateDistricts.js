/**
 * Migration Script: Populate District Field for Existing Places
 * Purpose: Extract district from address and update Place documents
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Place from '../models/Place.js';

dotenv.config();

// District extraction logic (same as placeMapper.js)
const extractDistrict = (address) => {
    if (!address) return null;
    
    const addressLower = address.toLowerCase();
    
    const districtPatterns = [
        'Ba Đình', 'Hoàn Kiếm', 'Tây Hồ', 'Long Biên', 'Cầu Giấy',
        'Đống Đa', 'Thanh Xuân', 'Nam Từ Liêm', 'Bắc Từ Liêm',
        'Hà Đông', 'Hoàng Mai', 'Hai Bà Trưng'
    ];
    
    // Check for each district pattern (case insensitive)
    for (const district of districtPatterns) {
        const districtLower = district.toLowerCase();
        const normalized = districtLower
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd');
        
        if (addressLower.includes(districtLower) || 
            addressLower.includes(normalized)) {
            return district;
        }
    }
    
    return null;
};

async function migrateDistricts() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        // Find all places without district or with empty district
        const placesWithoutDistrict = await Place.find({
            $or: [
                { district: { $exists: false } },
                { district: null },
                { district: '' }
            ]
        }).lean();
        
        console.log(`📊 Found ${placesWithoutDistrict.length} places without district\n`);
        
        if (placesWithoutDistrict.length === 0) {
            console.log('✨ All places already have districts!');
            process.exit(0);
        }
        
        let updated = 0;
        let failed = 0;
        
        for (const place of placesWithoutDistrict) {
            const district = extractDistrict(place.address);
            
            if (district) {
                try {
                    await Place.updateOne(
                        { _id: place._id },
                        { $set: { district: district } }
                    );
                    console.log(`✅ Updated: ${place.name} → ${district}`);
                    updated++;
                } catch (err) {
                    console.error(`❌ Failed to update ${place.name}:`, err.message);
                    failed++;
                }
            } else {
                console.warn(`⚠️  Could not extract district for: ${place.name} (${place.address})`);
                failed++;
            }
        }
        
        console.log('\n' + '='.repeat(70));
        console.log(`📊 Migration Results:`);
        console.log(`   ✅ Updated: ${updated}`);
        console.log(`   ❌ Failed: ${failed}`);
        console.log(`   📝 Total: ${placesWithoutDistrict.length}`);
        console.log('='.repeat(70) + '\n');
        
        // Show current district distribution
        const districtStats = await Place.aggregate([
            { $group: { _id: '$district', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        console.log('📊 Current District Distribution:');
        districtStats.forEach(stat => {
            const district = stat._id || 'NO DISTRICT';
            console.log(`   ${district}: ${stat.count} places`);
        });
        
        await mongoose.disconnect();
        console.log('\n✅ Migration completed!\n');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateDistricts();
