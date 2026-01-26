/**
 * Test Script for Mood-Based Search
 * Run: node server/scripts/testMoodSearch.js
 */

import queryAnalyzer from '../services/ai/pipelines/stages/02-QueryAnalyzer.js';
import rankingEngine from '../services/ai/pipelines/stages/05-RankingEngine.js';
import hybridSearchEngine from '../services/ai/pipelines/stages/04-HybridSearchEngine.js';
import promptBuilder from '../services/ai/pipelines/stages/06-PromptBuilder.js';
import logger from '../services/ai/utils/logger.js';

// Mock Input
const mockInputs = [
    "tôi buồn quá tìm chỗ nào giải sầu",
    "đang vui đi quẩy ở đâu",
    "stress công việc muốn tìm chỗ yên tĩnh",
    "hẹn hò lãng mạn với người yêu"
];

async function runTest() {
    console.log("🧪 STARTING MOOD SEARCH TEST...\n");

    for (const query of mockInputs) {
        console.log(`\n-----------------------------------`);
        console.log(`🔍 Testing Query: "${query}"`);

        // 1. Test Query Analyzer
        const analyzed = queryAnalyzer.classifyQueryIntent({ question: query });
        if (analyzed.moodContext) {
            console.log(`✅ Mood Detected: ${analyzed.moodContext.type}`);
            console.log(`   Tags: ${analyzed.moodContext.tags.join(', ')}`);
            console.log(`   Exclude: ${analyzed.moodContext.excludeTags?.join(', ')}`);
        } else {
            console.log(`❌ No Mood Detected`);
        }

        // Simulating Pipeline Context
        const input = {
            question: query,
            moodContext: analyzed.moodContext,
            retrievedDocs: [
                {
                    metadata: { name: "Quán Pub Sôi Động", aiTags: { mood: ["sôi động", "náo nhiệt"] }, description: "Nhạc mạnh, quẩy cực đã" },
                    score: 0.9
                },
                {
                    metadata: { name: "Cafe Yên Tĩnh", aiTags: { mood: ["yên tĩnh", "chill"] }, description: "Góc nhỏ bình yên, nhạc acoustic" },
                    score: 0.85
                },
                {
                    metadata: { name: "Spa Thư Giãn", aiTags: { mood: ["thư giãn", "yên tĩnh"] }, description: "Massage trị liệu, giải tỏa stress" },
                    score: 0.8
                }
            ]
        };

        // 2. Test Ranking Engine (Filtering)
        const ranked = rankingEngine._applyMoodFiltering(input.retrievedDocs, input);

        console.log(`\n📊 Ranking Results:`);
        ranked.forEach(doc => {
            const originalScore = doc.score / (doc._moodBoost || 1);
            const boost = doc._moodBoost ? `x${doc._moodBoost}` : '-';
            console.log(`   - ${doc.metadata.name}: ${originalScore.toFixed(2)} -> ${doc.score.toFixed(2)} (${boost})`);
        });
    }
}

// Run test (commented out to prevent auto-execution issues in prod environment)
// runTest();
