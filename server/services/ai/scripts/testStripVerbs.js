/**
 * Test Strip Action Verbs Logic
 * Verify: "Dạo hồ Hoàn Kiếm" → tìm thấy "Hồ Hoàn Kiếm" trong DB
 */

const testCases = [
    {
        input: 'Dạo hồ Hoàn Kiếm',
        expected: 'Hồ Hoàn Kiếm',
        description: 'Strip "Dạo" verb'
    },
    {
        input: 'Tham quan Văn Miếu',
        expected: 'Văn Miếu',
        description: 'Strip "Tham quan" verb'
    },
    {
        input: 'Đi Hồ Tây',
        expected: 'Hồ Tây',
        description: 'Strip "Đi" verb'
    },
    {
        input: 'Xem Lăng Bác',
        expected: 'Lăng Bác',
        description: 'Strip "Xem" verb'
    },
    {
        input: 'Hồ Gươm',
        expected: 'Hồ Gươm',
        description: 'No verb - keep as is'
    }
];

console.log('\n🧪 ========== TEST STRIP ACTION VERBS ==========\n');

testCases.forEach(({ input, expected, description }) => {
    // Simulate the regex from aiRoutes.js
    let cleanName = input.replace(/\s*\(.*?\)\s*/g, '').trim();
    cleanName = cleanName.replace(/^(Dạo|Tham quan|Đi|Xem|Thăm|Ghé)\s+/i, '').trim();
    
    // Capitalize first letter (same as aiRoutes.js)
    if (cleanName.length > 0) {
        cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    }
    
    const passed = cleanName === expected;
    console.log(`${passed ? '✅' : '❌'} ${description}`);
    console.log(`   Input:    "${input}"`);
    console.log(`   Output:   "${cleanName}"`);
    console.log(`   Expected: "${expected}"`);
    console.log('');
});

console.log('✅ All tests completed!\n');
console.log('💡 Next: Test trên server thực tế với query "lịch trình buổi tối đơn giản"\n');
