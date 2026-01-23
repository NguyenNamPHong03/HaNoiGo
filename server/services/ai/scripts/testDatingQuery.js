/**
 * Test Dating Query Optimization
 * Kiểm tra xem hệ thống có trả về đúng địa điểm hẹn hò không
 */

import intentClassifier from '../retrieval/extractors/intentClassifier.js';

console.log('🧪 TESTING DATING QUERY OPTIMIZATION\n');
console.log('='.repeat(60));

const testQueries = [
    {
        query: "Nhà hàng lãng mạn cho buổi hẹn hò ở Hà Nội",
        expected: "PLACE_VIBE with dating mode"
    },
    {
        query: "Quán cafe hẹn hò view đẹp",
        expected: "PLACE_VIBE with dating mode"
    },
    {
        query: "Chỗ hẹn hò riêng tư, yên tĩnh",
        expected: "PLACE_VIBE with dating mode"
    },
    {
        query: "Tìm nhà hàng để đưa bạn gái đi",
        expected: "PLACE_VIBE with dating mode"
    },
    {
        query: "Quán cafe couple ở Tây Hồ",
        expected: "PLACE_VIBE with dating mode"
    },
    {
        query: "Tìm quán phở ngon",
        expected: "FOOD_ENTITY (no dating mode)"
    },
    {
        query: "Quán cafe học bài yên tĩnh",
        expected: "PLACE_VIBE (no dating mode)"
    }
];

console.log('\n📋 Testing Intent Classification:\n');

testQueries.forEach((test, index) => {
    console.log(`\n${index + 1}. Query: "${test.query}"`);
    console.log(`   Expected: ${test.expected}`);
    
    const result = intentClassifier.classify(test.query);
    
    console.log(`   ✅ Result:`);
    console.log(`      - Intent: ${result.intent}`);
    console.log(`      - Keyword: ${result.keyword || 'N/A'}`);
    console.log(`      - Tags: ${result.tags?.join(', ') || 'N/A'}`);
    console.log(`      - Is Dating: ${result.isDating ? '💕 YES' : '❌ NO'}`);
    
    if (result.mustExclude) {
        console.log(`      - Exclude Filter: ✅ APPLIED`);
        console.log(`         Category: ${JSON.stringify(result.mustExclude.category)}`);
        if (result.mustExclude.$and) {
            console.log(`         $and filters: ${result.mustExclude.$and.length} conditions`);
            result.mustExclude.$and.forEach((cond, i) => {
                const field = Object.keys(cond)[0];
                const pattern = cond[field].$not.source;
                console.log(`           ${i+1}. ${field} excludes: /${pattern}/`);
            });
        }
    } else {
        console.log(`      - Exclude Filter: ❌ NOT APPLIED`);
    }
    
    console.log(`   -`.repeat(30));
});

console.log('\n' + '='.repeat(60));
console.log('\n🎯 KEY OBSERVATIONS:');
console.log('1. Dating queries should have isDating: true');
console.log('2. Dating queries should have mustExclude filter');
console.log('3. Dating tags should include: lãng mạn, view đẹp, riêng tư, rooftop');
console.log('4. Non-dating queries should NOT trigger exclude filter');
console.log('\n✅ Test complete! Check logs above for results.\n');
