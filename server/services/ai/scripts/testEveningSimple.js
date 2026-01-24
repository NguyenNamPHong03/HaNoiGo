/**
 * Test Script: Evening Simple Itinerary
 * Mục đích: Kiểm tra logic lịch trình buổi tối đơn giản
 * Usage: node server/services/ai/scripts/testEveningSimple.js
 */

import mainChatPipeline from '../pipelines/mainChatPipeline.js';

async function testEveningSimpleItinerary() {
    console.log('\n🧪 ==================== TEST EVENING SIMPLE ITINERARY ====================\n');

    try {
        // Test cases
        const testQueries = [
            {
                query: 'lên lịch trình một buổi tối ở hà nội đơn giản cho tôi',
                expected: 'EVENING_SIMPLE',
                description: 'Query đúng với từ khóa "buổi tối" + "đơn giản"'
            },
            {
                query: 'tối nay đi đâu cho nhanh',
                expected: 'EVENING_SIMPLE',
                description: 'Query ngắn gọn với "tối nay" + "nhanh"'
            },
            {
                query: 'gợi ý lịch trình tối ở hà nội đơn giản',
                expected: 'EVENING_SIMPLE',
                description: 'Variant khác với "tối" + "đơn giản"'
            },
            {
                query: 'lên lịch trình 1 ngày hà nội',
                expected: 'FULL_DAY',
                description: 'Query không có "tối" → phải là FULL_DAY'
            },
            {
                query: 'tối nay đi ăn gì',
                expected: 'CHAT',
                description: 'Query không phải lịch trình → CHAT'
            }
        ];

        // Initialize pipeline
        await mainChatPipeline.initialize();
        console.log('✅ Pipeline initialized\n');

        // Run tests
        for (const test of testQueries) {
            console.log(`\n📝 TEST: ${test.description}`);
            console.log(`Query: "${test.query}"`);
            console.log(`Expected: ${test.expected}`);
            console.log('---');

            const result = await mainChatPipeline.execute(test.query, {
                userProfile: {
                    preferences: {
                        favoriteFoods: [],
                        favoriteSpaces: ['Đơn giản', 'Tiện lợi']
                    }
                }
            });

            console.log(`\n📊 RESULT:`);
            console.log(`- Intent: ${result.intent || 'N/A'}`);
            console.log(`- Itinerary Type: ${result.itineraryType || 'N/A'}`);
            
            if (result.structuredData) {
                console.log(`- Title: ${result.structuredData.title}`);
                console.log(`- Activities: ${result.structuredData.schedule.length}`);
                console.log(`\n📋 Schedule:`);
                result.structuredData.schedule.forEach((activity, idx) => {
                    console.log(`  ${idx + 1}. ${activity.time} - ${activity.activity}`);
                    console.log(`     📍 ${activity.placeName}`);
                    console.log(`     💡 ${activity.reason}`);
                    console.log(`     🆔 PlaceID: ${activity.placeId || 'null'}`);
                });
            }

            // Validation
            const passed = test.expected === 'CHAT' 
                ? result.intent === 'CHAT'
                : result.intent === 'ITINERARY' && result.itineraryType === test.expected;

            console.log(`\n${passed ? '✅ PASS' : '❌ FAIL'}`);
            console.log('='.repeat(80));
        }

    } catch (error) {
        console.error('\n❌ Test failed:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run test
testEveningSimpleItinerary()
    .then(() => {
        console.log('\n✅ All tests completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    });
