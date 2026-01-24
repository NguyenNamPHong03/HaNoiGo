/**
 * Quick Test: Evening Simple Itinerary với Placeholder
 * Test case: "gợi ý lịch trình buổi tối ở hà nội đơn giản"
 * Expected: 3 cards hiển thị (Jollibee + Coach cafe + Dạo hồ Hoàn Kiếm)
 */

import mainChatPipeline from '../services/ai/pipelines/mainChatPipeline.js';

async function quickTest() {
    console.log('\n🧪 ========== QUICK TEST: EVENING SIMPLE ==========\n');

    try {
        await mainChatPipeline.initialize();
        console.log('✅ Pipeline ready\n');

        const query = 'gợi ý lịch trình buổi tối ở hà nội đơn giản';
        console.log(`📝 Query: "${query}"\n`);

        const result = await mainChatPipeline.execute(query);

        console.log('\n📊 ========== RESULT ==========');
        console.log(`Intent: ${result.intent}`);
        console.log(`Itinerary Type: ${result.itineraryType}`);
        
        if (result.structuredData?.schedule) {
            console.log(`\n📋 Schedule (${result.structuredData.schedule.length} items):`);
            result.structuredData.schedule.forEach((item, idx) => {
                console.log(`\n${idx + 1}. ${item.time} - ${item.activity}`);
                console.log(`   📍 ${item.placeName}`);
                console.log(`   🆔 PlaceID: ${item.placeId || 'null (sẽ tạo placeholder)'}`);
                console.log(`   💡 ${item.reason}`);
            });
        }

        console.log('\n✅ Test completed successfully!');
        console.log('\n💡 Next: Test trên frontend để xem 3 cards hiển thị đúng không\n');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Test failed:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

quickTest();
