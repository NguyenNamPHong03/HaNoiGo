/**
 * Stage 1: Input Processing
 * Nhiệm vụ: Validate & sanitize user input, kiểm tra cache
 */

import { RAG_STAGES } from '../../config/constants.js';
import enhancedCacheClient from '../../core/enhancedCacheClient.js';
import telemetry from '../../core/telemetry.js';
import inputGuard from '../../guardrails/inputGuard.js';
import enhancedLogger from '../../utils/enhancedLogger.js';

const logger = enhancedLogger.child('InputProcessor');

class InputProcessor {
    /**
     * STAGE 1: Input Guard - Validate & Sanitize
     */
    async processInputGuard(input) {
        return await telemetry.measureTime(RAG_STAGES.INPUT_GUARD, async () => {
            const sanitizedQuestion = await inputGuard.validate(input.question);
            return {
                ...input,
                question: sanitizedQuestion
            };
        });
    }

    /**
     * Helper: Generate context-aware cache key
     */
    generateCacheKey(input) {
        let key = input.question;
        const ctx = input.context;
        // If context exists, append switch states to key
        if (ctx) {
            const rt = ctx.useRealtime !== false ? '1' : '0'; // Default true logic matches pipeline
            const loc = ctx.useLocation ? '1' : '0';
            const pz = ctx.usePersonalization ? '1' : '0';
            key += `|ctx:${rt}${loc}${pz}`;
        }
        return key;
    }

    /**
     * STAGE 2: Semantic Cache (ENABLED)
     */
    async processSemanticCache(input) {
        return await telemetry.measureTime(RAG_STAGES.SEMANTIC_CACHE, async () => {
            const cacheKey = this.generateCacheKey(input);
            const cached = await enhancedCacheClient.getCache(cacheKey);

            if (cached) {
                logger.info(`Cache HIT! Returning cached response`, { cacheKey });
                return {
                    ...input,
                    ...cached,
                    cached: true,
                    cacheKey
                };
            }
            
            logger.debug(`Cache MISS - proceeding with full pipeline`, { cacheKey });
            return { ...input, cached: false, cacheKey };
        });
    }

    /**
     * STAGE 13: Cache Response (ENABLED)
     */
    async cacheResponse(input) {
        if (!input.cached && input.answer && input.retrievedDocs) {
            const key = input.cacheKey || input.question;
            
            logger.debug('Caching response', { 
                key: key.substring(0, 50),
                hasAnswer: !!input.answer,
                docsCount: input.retrievedDocs?.length || 0
            });
            
            await enhancedCacheClient.setCache(key, {
                question: input.question,
                answer: input.answer,
                retrievedDocs: input.retrievedDocs,
                context: input.context,
                intent: input.intent,
                structuredData: input.structuredData
            }, 3600); // 1 hour TTL
        }
        return input;
    }
}

export default new InputProcessor();
