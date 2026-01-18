
import { initializeAIService, processMessage } from './index.js';

(async () => {
    try {
        console.log("🚀 Initializing AI Service...");
        await initializeAIService();

        // Test query explicitly asking for itinerary to trigger itinerary prompt
        const question = "Lên lộ trình đi chơi foodtour Hoàn Kiếm";
        console.log(`\n❓ Testing query: "${question}"`);

        const start = performance.now();
        const result = await processMessage(question, 'test-user-vn', {
            location: { lat: 21.0285, lng: 105.8542 }
        });
        const end = performance.now();

        console.log("\n✅ Response received!");
        console.log(`⏱️  Latency: ${(end - start).toFixed(2)}ms`);
        console.log(`\n📝 Answer Snippet: ${result.answer.substring(0, 100)}...`);
        console.log(`📊 Intent: ${result.intent}`);

        if (result.intent === 'ITINERARY') {
            console.log("📦 Parsed Itinerary Data:", JSON.stringify(result.structuredData, null, 2).substring(0, 500));
        }

        process.exit(0);
    } catch (e) {
        console.error("❌ Test failed:", e);
        process.exit(1);
    }
})();
