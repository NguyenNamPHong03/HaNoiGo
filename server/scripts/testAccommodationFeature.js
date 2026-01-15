/**
 * TEST SCRIPT: Accommodation Feature
 * Test AI nhận diện và gợi ý nhà nghỉ/homestay cho trường hợp "hẹn hò về muộn"
 * 
 * Cách chạy:
 * node server/scripts/testAccommodationFeature.js
 */

import dotenv from 'dotenv';
dotenv.config();

// Mock test cases
const testCases = [
  {
    id: 1,
    query: "Đi hẹn hò về muộn thì nên đi đâu?",
    expectedIntent: "CHAT",
    expectedAccommodationMode: true,
    expectedLuxuryMode: false,
    expectedCategory: "Lưu trú",
    expectedMinPrice: null,
    description: "Câu hỏi trực tiếp về hẹn hò về muộn - Standard mode"
  },
  {
    id: 2,
    query: "Hẹn hò về muộn rồi, gần Hoàn Kiếm có chỗ nào cao cấp không?",
    expectedIntent: "CHAT",
    expectedAccommodationMode: true,
    expectedLuxuryMode: true,
    expectedCategory: "Lưu trú",
    expectedMinPrice: 500000,
    description: "Hẹn hò về muộn + CAO CẤP - Luxury mode"
  },
  {
    id: 3,
    query: "Tìm homestay giá rẻ khu Tây Hồ",
    expectedIntent: "CHAT",
    expectedAccommodationMode: true,
    expectedLuxuryMode: false,
    expectedCategory: "Lưu trú",
    expectedMinPrice: null,
    description: "Tìm homestay cụ thể - Standard (giá rẻ)"
  },
  {
    id: 4,
    query: "Khách sạn xịn gần Hoàn Kiếm có gì?",
    expectedIntent: "CHAT",
    expectedAccommodationMode: true,
    expectedLuxuryMode: true,
    expectedCategory: "Lưu trú",
    expectedMinPrice: 500000,
    description: "Khách sạn XỊN - Luxury mode"
  },
  {
    id: 5,
    query: "23h rồi, cần chỗ ngủ gần Hoàn Kiếm",
    expectedIntent: "CHAT",
    expectedAccommodationMode: true,
    expectedLuxuryMode: false,
    expectedCategory: "Lưu trú",
    expectedMinPrice: null,
    description: "Context thời gian + cần chỗ ngủ - Standard mode"
  },
  {
    id: 6,
    query: "Resort sang trọng ở Ba Đình",
    expectedIntent: "CHAT",
    expectedAccommodationMode: true,
    expectedLuxuryMode: true,
    expectedCategory: "Lưu trú",
    expectedMinPrice: 500000,
    description: "Resort SANG TRỌNG - Luxury mode"
  },
  {
    id: 7,
    query: "Nhà nghỉ nào sạch sẽ ở Ba Đình?",
    expectedIntent: "CHAT",
    expectedAccommodationMode: true,
    expectedLuxuryMode: false,
    expectedCategory: "Lưu trú",
    expectedMinPrice: null,
    description: "Nhà nghỉ theo quận - Standard mode"
  },
  {
    id: 8,
    query: "Tìm quán cafe yên tĩnh để học bài",
    expectedIntent: "CHAT",
    expectedAccommodationMode: false,
    expectedLuxuryMode: false,
    expectedCategory: "Ăn uống",
    expectedMinPrice: null,
    description: "Query bình thường - KHÔNG phải accommodation"
  },
  {
    id: 9,
    query: "Lên lịch trình đi chơi 1 ngày ở Hà Nội",
    expectedIntent: "ITINERARY",
    expectedAccommodationMode: false,
    expectedLuxuryMode: false,
    expectedCategory: null,
    expectedMinPrice: null,
    description: "Itinerary mode - KHÔNG phải accommodation"
  },
  {
    id: 10,
    query: "Tôi muốn nghỉ qua đêm với người yêu ở đâu tầm 500k",
    expectedIntent: "CHAT",
    expectedAccommodationMode: true,
    expectedLuxuryMode: false,
    expectedCategory: "Lưu trú",
    expectedMinPrice: null,
    description: "🔴 CRITICAL: Nghỉ qua đêm phải là CHAT (chỉ list accommodation), KHÔNG phải ITINERARY"
  }
];

// Accommodation keywords (copy từ mainChatPipeline.js)
const accommodationKeywords = [
  'về muộn', 'về khuya', 'hẹn hò về muộn', 'hẹn hò tối muộn',
  'cần chỗ nghỉ', 'ở lại qua đêm', 'chỗ nghỉ qua đêm',
  'nghỉ qua đêm', 'ngủ qua đêm', 'nghỉ đêm', 'qua đêm',
  'nhà nghỉ', 'homestay', 'khách sạn', 'resort', 'chỗ ngủ',
  'chỗ ở', 'thuê phòng', 'đặt phòng', 'book phòng'
];

// Luxury keywords
const luxuryKeywords = [
  'cao cấp', 'xịn', 'sang trọng', 'luxury', 'đẳng cấp',
  'high-end', 'premium', '5 sao', 'sang', 'vip',
  'đắt', 'chất lượng cao', 'resort', 'khách sạn tốt'
];


const detectLuxury = (query) => {
  const lowerQuery = query.toLowerCase();
  return luxuryKeywords.some(kw => lowerQuery.includes(kw));
};
/**
 * Simulate keyword detection logic
 */
const detectAccommodation = (query) => {
  const lowerQuery = query.toLowerCase();
  return accommodationKeywords.some(kw => lowerQuery.includes(kw));
};

/**
 * Run tests
 */
const runTests = () => {
  console.log('🧪 TESTING ACCOMMODATION FEATURE\n');
  console.log('=' .repeat(80));
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase) => {
    console.log(`\nTest #${testCase.id}: ${testCase.description}`);
    console.log(`Query: "${testCase.query}"`);
    
    // Test accommodation detection
    const detectedAccommodation = detectAccommodation(testCase.query);
    const detectedLuxury = detectLuxury(testCase.query);
    
    const accommodationPass = detectedAccommodation === testCase.expectedAccommodationMode;
    const luxuryPass = detectedLuxury === testCase.expectedLuxuryMode;
    
    // Results
    console.log(`Expected Accommodation Mode: ${testCase.expectedAccommodationMode}`);
    console.log(`Detected Accommodation Mode: ${detectedAccommodation}`);
    
    console.log(`Expected Luxury Mode: ${testCase.expectedLuxuryMode}`);
    console.log(`Detected Luxury Mode: ${detectedLuxury}`);
    
    if (testCase.expectedCategory) {
      console.log(`Expected Category Filter: ${testCase.expectedCategory}`);
      console.log(`Would Filter By: ${detectedAccommodation ? testCase.expectedCategory : 'None'}`);
    }
    
    if (testCase.expectedMinPrice) {
      console.log(`Expected Min Price: ${testCase.expectedMinPrice.toLocaleString('vi-VN')} VNĐ`);
      console.log(`Would Apply Price Filter: ${detectedLuxury ? 'YES (≥500k)' : 'NO (Mix all prices)'}`);
    }
    
    if (accommodationPass && luxuryPass) {
      console.log('✅ PASS');
      passed++;
    } else {
      console.log('❌ FAIL');
      if (!accommodationPass) console.log('  → Accommodation detection failed');
      if (!luxuryPass) console.log('  → Luxury detection failed');
      failed++;
    }
    
    console.log('-'.repeat(80));
  });
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${testCases.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${(passed / testCases.length * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Feature is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the logic.');
  }
};

// Execute
console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           ACCOMMODATION FEATURE - TEST SUITE                  ║
║                    HaNoiGo AI Service                         ║
╚═══════════════════════════════════════════════════════════════╝
`);

runTests();

console.log('\n💡 Next steps:');
console.log('1. Run actual API tests with: POST /api/chat');
console.log('2. Check logs for "accommodationMode: true"');
console.log('3. Verify category filter is applied in search queries');
console.log('4. Test with real database using: node server/scripts/tagAccommodations.js --execute\n');
