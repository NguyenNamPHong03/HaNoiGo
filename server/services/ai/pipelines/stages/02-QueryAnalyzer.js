/**
 * Stage 2: Query Analysis
 * Nhiệm vụ: Phân tích câu hỏi - Rewrite, Intent Classification, Query Intent
 */

import config from '../../config/index.js';
import telemetry from '../../core/telemetry.js';
import promptLoader from '../../prompts/promptLoader.js';
import districtExtractor from '../../retrieval/extractors/districtExtractor.js';
import intentClassifier from '../../retrieval/extractors/intentClassifier.js';
import logger from '../../utils/logger.js';

class QueryAnalyzer {
    constructor() {
        this.llm = null;
    }

    /**
     * Set LLM instance (called from MainChatPipeline)
     */
    setLLM(llm) {
        this.llm = llm;
    }

    /**
     * STAGE 3: Parallel Analysis (Rewrite + Intent + Query Analysis + District Extraction)
     */
    async analyzeParallel(input) {
        if (input.cached) return input;

        return await telemetry.measureTime('PARALLEL_ANALYSIS', async () => {
            const [rewriteRes, intentRes, analysisRes, districtRes] = await Promise.all([
                this.rewriteQuery(input),
                this.classifyIntent(input),
                this.classifyQueryIntent(input),
                this.extractDistrict(input)
            ]);

            return {
                ...input,
                ...rewriteRes,
                ...intentRes,
                ...analysisRes,
                ...districtRes,
            };
        });
    }

    /**
     * Sub-function: Query Rewriting
     */
    async rewriteQuery(input) {
        if (!config.features.useQueryRewriting || input.question.length < 10) return {};

        try {
            const prompt = await promptLoader.formatQueryRewrite(input.question);
            const response = await this.llm.invoke(prompt);
            const refinedQuery = typeof response === 'string' ? response : response.content;
            logger.info(`🔄 Rewrote query: "${input.question}" -> "${refinedQuery}"`);
            return { refinedQuery: refinedQuery.trim() };
        } catch (error) {
            logger.warn('⚠️ Query rewriting failed:', error);
            return {};
        }
    }

    /**
     * Sub-function: Intent Classification (CHAT vs ITINERARY)
     * Phát hiện thêm: EVENING_SIMPLE vs FULL_DAY itinerary
     */
    async classifyIntent(input) {
        try {
            const prompt = await promptLoader.formatIntentClassify(input.question);
            const response = await this.llm.invoke(prompt);
            let intent = typeof response === 'string' ? response : response.content;
            intent = intent.trim().toUpperCase();
            if (!intent.includes('ITINERARY')) intent = 'CHAT'; // Default to CHAT

            // 🌙 DETECT EVENING ITINERARY TYPE
            let itineraryType = 'FULL_DAY'; // Default
            if (intent === 'ITINERARY') {
                const question = input.question.toLowerCase();
                // Match: "buổi tối", "tối nay", "tối ở", "lịch trình tối", "tối sang trọng"
                const isEvening = /(?:buổi\s*)?tối(?:\s+(?:nay|ở|hà nội|thứ))?|evening/i.test(question);
                const isSimple = /đơn giản|nhanh|gọn|casual|simple/.test(question);
                const isFancy = /chỉnh chu|tươm tất|sang trọng|cao cấp|fancy|elegant|luxury/.test(question);
                
                if (isEvening && isFancy) {
                    itineraryType = 'EVENING_FANCY';
                    logger.info('🌟 Detected EVENING FANCY itinerary (Lẩu/Buffet → Karaoke → Hotel)');
                } else if (isEvening && isSimple) {
                    itineraryType = 'EVENING_SIMPLE';
                    logger.info('🌙 Detected EVENING SIMPLE itinerary (Ăn nhẹ → Cafe → Dạo hồ)');
                } else if (isEvening) {
                    itineraryType = 'EVENING_FULL';
                    logger.info('🌆 Detected EVENING FULL itinerary');
                }
            }

            logger.info(`🧠 Intent detected: ${intent} | Type: ${itineraryType}`);
            return { intent, itineraryType };
        } catch (error) {
            logger.error('Intent classification failed', error);
            return { intent: 'CHAT', itineraryType: 'FULL_DAY' };
        }
    }

    /**
     * Sub-function: Query Intent Analysis (FOOD_ENTITY, PLACE_VIBE, etc.)
     */
    async classifyQueryIntent(input) {
        const intentData = intentClassifier.classify(input.question);
        logger.info(`🎯 Query Intent: ${intentData.intent}`);

        // Log details
        if (intentData.intent === 'FOOD_ENTITY') {
            logger.info(`🍜 FOOD MODE: "${intentData.keyword}" → HARD FILTER`);
        } else if (intentData.intent === 'PLACE_VIBE') {
            logger.info(`💕 VIBE MODE: "${intentData.keyword}" → TAGS: [${intentData.tags.join(', ')}]`);
            if (intentData.isDating) {
                logger.info(`💕💕💕 DATING QUERY DETECTED! Will exclude accommodation/buffet`);
            }
        }

        return {
            queryIntent: intentData.intent,
            queryKeyword: intentData.keyword,
            queryTags: intentData.tags,
            queryMustQuery: intentData.mustQuery,
            isDatingQuery: intentData.isDating,
            mustExcludeQuery: intentData.mustExclude
        };
    }

    /**
     * Sub-function: District Extraction
     */
    async extractDistrict(input) {
        const district = districtExtractor.detectDistrict(input.question);
        
        if (!district) {
            return {
                queryDistrict: null,
                districtMustQuery: null
            };
        }

        logger.info(`📍 DISTRICT MODE: "${district}" → HARD FILTER`);
        
        const districtMustQuery = districtExtractor.buildDistrictMustQuery(district);

        return {
            queryDistrict: district,
            districtMustQuery: districtMustQuery
        };
    }
}

export default new QueryAnalyzer();
