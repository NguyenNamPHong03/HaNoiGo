/**
 * Stage 2: Query Analysis
 * Nhiệm vụ: Phân tích câu hỏi - Rewrite, Intent Classification, Query Intent
 */

import config from '../../config/index.js';
import telemetry from '../../core/telemetry.js';
import promptLoader from '../../prompts/promptLoader.js';
import districtExtractor from '../../retrieval/extractors/districtExtractor.js';
import intentClassifier from '../../retrieval/extractors/intentClassifier.js';
import enhancedLogger from '../../utils/enhancedLogger.js';
import enhancedCacheClient from '../../core/enhancedCacheClient.js';
import { PERFORMANCE } from '../../config/aiConstants.js';
import conversationManager from '../../core/conversationManager.js'; // PHASE 4
import MOOD_MAPPING from '../../config/moodMapping.js';

const logger = enhancedLogger.child('QueryAnalyzer');

class QueryAnalyzer {
    constructor() {
        this.llm = null;
        this.intentCache = new Map(); // In-memory cache for intent classification
    }

    /**
     * Set LLM instance (called from MainChatPipeline)
     */
    setLLM(llm) {
        this.llm = llm;
    }

    /**
     * STAGE 3: Optimized Parallel Analysis with Conversation Context
     * PHASE 4: Added conversation reference detection
     */
    async analyzeParallel(input) {
        if (input.cached) return input;

        return await telemetry.measureTime('PARALLEL_ANALYSIS', async () => {
            // PHASE 4: Check for conversation references first
            const sessionId = input.context?.sessionId;
            if (sessionId) {
                const reference = await conversationManager.analyzeReference(input.question, sessionId);

                if (reference.type === 'REFERENCE' || reference.type === 'FOLLOW_UP') {
                    logger.info(`💬 ${reference.type} detected:`, reference);
                    return {
                        ...input,
                        conversationReference: reference,
                        skipNormalRetrieval: true // Signal to skip normal RAG flow
                    };
                }

                if (reference.type === 'REFINEMENT') {
                    logger.info('🔄 REFINEMENT query detected, carrying over context');
                    input.refinementContext = reference.baseContext;
                    input.lastIntent = reference.baseIntent;
                }
            }

            // Continue with normal analysis
            const queryIntentRes = this.classifyQueryIntent(input);
            const districtRes = this.extractDistrict(input);

            const needsRewrite = config.features.useQueryRewriting && input.question.length >= 10;
            const needsLLMIntent = this.shouldUseLLMIntent(input.question);

            const llmPromises = [];

            if (needsRewrite) {
                llmPromises.push(this.rewriteQuery(input));
            }

            if (needsLLMIntent) {
                llmPromises.push(this.classifyIntent(input));
            }

            const llmResults = llmPromises.length > 0 ? await Promise.all(llmPromises) : [];

            const rewriteRes = needsRewrite ? llmResults[0] : {};
            const intentRes = needsLLMIntent ? llmResults[needsRewrite ? 1 : 0] : { intent: 'CHAT', itineraryType: 'FULL_DAY' };

            logger.debug('Analysis optimization', {
                rewriteSkipped: !needsRewrite,
                llmIntentSkipped: !needsLLMIntent,
                parallelCalls: llmPromises.length,
                hasConversationContext: !!sessionId
            });

            return {
                ...input,
                ...rewriteRes,
                ...intentRes,
                ...queryIntentRes,
                ...districtRes,
            };
        });
    }

    /**
     * ✅ NEW: Determine if LLM-based intent classification is needed
     * Simple queries can skip this expensive operation
     */
    shouldUseLLMIntent(question) {
        const normalized = question.toLowerCase().trim();

        // Skip LLM if query contains clear itinerary keywords
        const itineraryKeywords = ['lịch trình', 'itinerary', 'hành trình', 'tour', 'ngày'];
        const hasItinerary = itineraryKeywords.some(kw => normalized.includes(kw));

        // Skip LLM for very short queries (likely simple CHAT)
        if (normalized.length < 15 && !hasItinerary) {
            return false;
        }

        // Use LLM for complex or itinerary queries
        return hasItinerary || normalized.length > 50;
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
     * ✅ OPTIMIZED: Query Intent Analysis with caching
     * Sub-function: Query Intent Analysis (FOOD_ENTITY, PLACE_VIBE, etc.)
     */
    classifyQueryIntent(input) {
        // ✅ Check cache first
        const cacheKey = input.question.toLowerCase().trim();
        if (this.intentCache.has(cacheKey)) {
            const cached = this.intentCache.get(cacheKey);
            logger.debug('Intent cache HIT', { query: cacheKey });
            return cached;
        }

        // ✅ Classify (synchronous, fast)
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

        const result = {
            queryIntent: intentData.intent,
            queryKeyword: intentData.keyword,
            queryTags: intentData.tags,
            queryMustQuery: intentData.mustQuery,
            isDatingQuery: intentData.isDating,
            mustExcludeQuery: intentData.mustExclude,
            moodContext: this._detectMood(input.question) // ✅ MOOD DETECTION
        };

        if (result.moodContext) {
            logger.info(`🎭 MOOD DETECTED: ${result.moodContext.type} (Tags: ${result.moodContext.tags.join(', ')})`);
            // If mood implies dating/romance, set isDatingQuery
            if (result.moodContext.type === 'romantic') {
                result.isDatingQuery = true;
            }
        }

        return result;
    }

    /**
     * ✅ NEW: Detect User Mood from Query
     * Uses keyword matching from MOOD_MAPPING
     */
    _detectMood(query) {
        const lowerQuery = query.toLowerCase();

        for (const [moodType, config] of Object.entries(MOOD_MAPPING)) {
            const hasKeyword = config.keywords.some(kw => lowerQuery.includes(kw));
            if (hasKeyword) {
                return {
                    type: moodType,
                    tags: config.relatedTags,
                    excludeTags: config.excludeTags
                };
            }
        }
        return null;
    }

    /**
     * ✅ OPTIMIZED: District Extraction (synchronous, no async needed)
     * Sub-function: District Extraction
     */
    extractDistrict(input) {
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

    /**
     * ✅ NEW: Clear intent cache (for testing/debugging)
     */
    clearIntentCache() {
        this.intentCache.clear();
        logger.info('Intent cache cleared');
    }

    /**
     * ✅ NEW: Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.intentCache.size,
            maxSize: 100
        };
    }
}

export default new QueryAnalyzer();
