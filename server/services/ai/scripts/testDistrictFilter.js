/**
 * Test Script cho District Filter
 * Mục đích: Kiểm tra logic phát hiện và filter địa điểm theo quận
 * 
 * Usage: node server/services/ai/scripts/testDistrictFilter.js
 */

import districtExtractor from '../retrieval/extractors/districtExtractor.js';

console.log('\n🧪 TEST DISTRICT EXTRACTOR\n');
console.log('='.repeat(60));

// Test cases
const testCases = [
    'tìm quán phở ở đống đa',
    'quán cafe yên tĩnh ở quận Ba Đình',
    'quán ăn gần Hồ Tây',
    'tìm nhà hàng tại Thanh Xuân',
    'quán bún chả q đống đa',
    'cafe học bài q.cầu giấy',
    'quán nướng ở hai bà trưng',
    'tìm quán ăn ngon quận hoàn kiếm',
    'buffet ở nam từ liêm',
    'quán ăn vặt bắc từ liêm',
    'quán phở gần đây', // Không có quận
    'tìm quán cafe', // Không có quận
];

console.log('\n📋 Test Cases:\n');

testCases.forEach((query, index) => {
    console.log(`\n${index + 1}. Query: "${query}"`);
    console.log('-'.repeat(60));
    
    const district = districtExtractor.detectDistrict(query);
    
    if (district) {
        console.log(`✅ District detected: "${district}"`);
        
        const mustQuery = districtExtractor.buildDistrictMustQuery(district);
        console.log(`🔒 Hard filter: ${JSON.stringify(mustQuery)}`);
        
        // Validate
        const isValid = districtExtractor.isValidDistrict(district);
        console.log(`✔️ Valid district: ${isValid}`);
    } else {
        console.log('❌ No district detected');
    }
});

console.log('\n' + '='.repeat(60));
console.log('✨ Test completed!\n');

// Test all valid districts
console.log('\n📍 All Valid Districts:\n');
const allDistricts = districtExtractor.getAllDistricts();
allDistricts.forEach((district, i) => {
    console.log(`${i + 1}. ${district}`);
});
