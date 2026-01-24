/**
 * Test Script: Evening Fancy Itinerary
 * Test case: "lên lịch trình một buổi tối ở hà nội chỉnh chu cho tôi"
 * Expected: 3 activities (Lẩu/Buffet → Karaoke → Hotel)
 */

import mainChatPipeline from '../pipelines/mainChatPipeline.js';

async function testEveningFancy() {
    console.log('\n🧪 ==================== TEST EVENING FANCY ITINERARY ====================\n');

    try {
        // Test cases
        const testQueries = [
            {
                query: 'lên lịch trình một buổi tối ở hà nội chỉnh chu cho tôi',
                expected: 'EVENING_FANCY',
                description: 'Query chính xác với "buổi tối" + "chỉnh chu"'
            },
            {
                query: 'gợi ý lịch trình tối nay tươm tất',
                expected: 'EVENING_FANCY',
                description: 'Query với "tối nay" + "tươm tất"'
            },
            {
                query: 'lập kế hoạch buổi tối sang trọng',
                expected: 'EVENING_FANCY',
                description: 'Query với "buổi tối" + "sang trọng"'
            },
            {
                query: 'lịch trình tối nay cao cấp',
                expected: 'EVENING_FANCY',
                description: 'Query với "tối nay" + "cao cấp"'
            },
            {
                query: 'lên lịch trình buổi tối đơn giản',
                expected: 'EVENING_SIMPLE',
                description: 'Không phải FANCY - là SIMPLE'
            },
            {
                query: 'lên lịch trình 1 ngày hà nội',
                expected: 'FULL_DAY',
                description: 'Không phải tối - là FULL_DAY'
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
                        favoriteFoods: ['Lẩu'],
                        favoriteSpaces: ['Sang trọng']
                    }
                }
            });

            console.log(`\n📊 RESULT:`);
            console.log(`- Intent: ${result.intent || 'N/A'}`);
            console.log(`- Itinerary Type: ${result.itineraryType || 'N/A'}`);
            
            if (result.structuredData?.schedule) {
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
testEveningFancy()
    .then(() => {
        console.log('\n✅ All EVENING_FANCY tests completed!');
        console.log('\n💡 Expected flow: Lẩu/Buffet (18:00) → Karaoke (20:00) → Hotel (22:30)\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    });
