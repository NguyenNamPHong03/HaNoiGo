/**
 * Run Ingestion Script - CLI for Proposition-based Data Ingestion
 * 
 * Usage:
 *   node services/ai/scripts/runIngestion.js           # Fast mode (rule-based propositions)
 *   node services/ai/scripts/runIngestion.js --llm     # LLM mode (slower, higher quality)
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Import after dotenv is loaded
const aiService = await import('../index.js');
const ingestionPipeline = await import('../pipelines/ingestionPipeline.js');
const vectorStoreFactory = await import('../core/vectorStoreFactory.js');

async function main() {
    console.log('🚀 Starting Proposition-based Place Ingestion...');
    console.log('================================================\n');

    // Check for --llm flag
    const useLLM = process.argv.includes('--llm');

    if (useLLM) {
        console.log('⚠️  LLM Mode: Will use GPT to extract propositions (slower but higher quality)\n');
    } else {
        console.log('⚡ Fast Mode: Using rule-based proposition extraction\n');
    }

    try {
        // Initialize AI Service
        console.log('📦 Initializing AI Service...');
        await aiService.initializeAIService();

        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hanoigo';
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB connected\n');

        // STEP 1: Delete old data (Handled inside ingestionPipeline)

        // STEP 2: Run ingestion
        console.log(`📥 Ingesting ALL places from collection: places\n`);
        const result = await ingestionPipeline.default.ingest('places', useLLM, 0); // 0 = process all

        console.log('\n================================================');
        console.log('✅ Ingestion Complete!');
        console.log(`   📍 Total Places: ${result.totalPlaces}`);
        console.log(`   📝 Total Propositions: ${result.totalPropositions}`);
        console.log(`   📊 Avg Propositions/Place: ${result.avgPropositionsPerPlace}`);
        console.log(`   🤖 Used LLM: ${result.usedLLM ? 'Yes' : 'No'}`);
        console.log('================================================');

    } catch (error) {
        console.error('❌ Ingestion failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

main();
