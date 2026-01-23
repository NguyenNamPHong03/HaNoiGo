/**
 * Quick Test - Verify Dating Filter Works
 * Test MongoDB query with exclude filter
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

// Connect to MongoDB
await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Connected to MongoDB\n');

const Place = mongoose.model('Place');

// Test query with dating exclude filter
const mustExclude = {
    category: { $nin: ['Lưu trú'] },
    $and: [
        { name: { $not: /nhà nghỉ|khách sạn|hotel|motel|homestay/i } },
        { name: { $not: /buffet|nhậu|bia hơi|quán nhậu|ăn vặt/i } },
        { name: { $not: /xiên|nem nướng|bún đậu|ốc|vỉa hè|lề đường/i } },
        { description: { $not: /nhà nghỉ|khách sạn|buffet|xiên|nem nướng|bún đậu/i } }
    ]
};

const tags = ['lãng mạn', 'romantic', 'view đẹp', 'ấm cúng', 'riêng tư', 'rooftop', 'fine dining'];

const query = {
    $or: [
        { 'aiTags.mood': { $in: tags } },
        { 'aiTags.space': { $in: tags } },
        { 'aiTags.suitability': { $in: tags } },
        { 'aiTags.specialFeatures': { $in: tags } }
    ]
};

// Merge exclude filter
if (mustExclude.category) {
    query.category = mustExclude.category;
}
if (mustExclude.$and) {
    query.$and = mustExclude.$and;
}

console.log('🔍 Query:', JSON.stringify(query, null, 2));
console.log('\n' + '='.repeat(60) + '\n');

// Execute query
const places = await Place.find(query).limit(10).lean();

console.log(`📊 Found ${places.length} places:\n`);

places.forEach((place, i) => {
    console.log(`${i+1}. ${place.name}`);
    console.log(`   Category: ${place.category}`);
    console.log(`   Tags: mood=${place.aiTags?.mood?.join(', ') || 'none'}`);
    console.log(`         space=${place.aiTags?.space?.join(', ') || 'none'}`);
    console.log(`         suitability=${place.aiTags?.suitability?.join(', ') || 'none'}`);
    
    // Check for negative keywords
    const negativesInName = ['buffet', 'xiên', 'nem nướng', 'bún đậu', 'nhà nghỉ', 'hotel'];
    const found = negativesInName.filter(kw => 
        place.name.toLowerCase().includes(kw)
    );
    
    if (found.length > 0) {
        console.log(`   ⚠️ WARNING: Contains negative keywords: ${found.join(', ')}`);
    } else {
        console.log(`   ✅ No negative keywords`);
    }
    console.log();
});

console.log('='.repeat(60));
console.log('\n✅ Test complete!');
console.log('Expected: NO places with buffet/xiên/nem/bún đậu/nhà nghỉ');
console.log('Actual: Check "WARNING" messages above\n');

mongoose.disconnect();
