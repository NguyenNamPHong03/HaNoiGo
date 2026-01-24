/**
 * Test Keywords Detection for EVENING_FANCY
 * Verify: "chỉnh chu", "tươm tất", "sang trọng" được detect đúng
 */

const testCases = [
    // EVENING_FANCY cases
    {
        input: 'lên lịch trình một buổi tối ở hà nội chỉnh chu cho tôi',
        expected: 'EVENING_FANCY',
        description: 'Detect "buổi tối" + "chỉnh chu"'
    },
    {
        input: 'tối nay đi chơi tươm tất',
        expected: 'EVENING_FANCY',
        description: 'Detect "tối nay" + "tươm tất"'
    },
    {
        input: 'gợi ý lịch trình tối sang trọng',
        expected: 'EVENING_FANCY',
        description: 'Detect "tối" + "sang trọng"'
    },
    {
        input: 'lập kế hoạch buổi tối cao cấp',
        expected: 'EVENING_FANCY',
        description: 'Detect "buổi tối" + "cao cấp"'
    },
    
    // EVENING_SIMPLE cases
    {
        input: 'lịch trình tối đơn giản',
        expected: 'EVENING_SIMPLE',
        description: 'Detect "tối" + "đơn giản"'
    },
    {
        input: 'tối nay đi đâu cho nhanh',
        expected: 'EVENING_SIMPLE',
        description: 'Detect "tối nay" + "nhanh"'
    },
    
    // FULL_DAY cases
    {
        input: 'lịch trình 1 ngày hà nội',
        expected: 'FULL_DAY',
        description: 'No evening keywords'
    }
];

console.log('\n🧪 ========== TEST EVENING ITINERARY DETECTION ==========\n');

testCases.forEach(({ input, expected, description }) => {
    const question = input.toLowerCase();
    
    // Simulate the logic from 02-QueryAnalyzer.js (UPDATED REGEX)
    const isEvening = /(?:buổi\s*)?tối(?:\s+(?:nay|ở|hà nội|thứ))?|evening/i.test(question);
    const isSimple = /đơn giản|nhanh|gọn|casual|simple/.test(question);
    const isFancy = /chỉnh chu|tươm tất|sang trọng|cao cấp|fancy|elegant|luxury/.test(question);
    
    let itineraryType = 'FULL_DAY';
    if (isEvening && isFancy) {
        itineraryType = 'EVENING_FANCY';
    } else if (isEvening && isSimple) {
        itineraryType = 'EVENING_SIMPLE';
    } else if (isEvening) {
        itineraryType = 'EVENING_FULL';
    }
    
    const passed = itineraryType === expected;
    console.log(`${passed ? '✅' : '❌'} ${description}`);
    console.log(`   Input:    "${input}"`);
    console.log(`   Detected: ${itineraryType}`);
    console.log(`   Expected: ${expected}`);
    console.log('');
});

console.log('✅ All keyword detection tests completed!\n');
console.log('💡 Next: Test full pipeline với server thực tế\n');
