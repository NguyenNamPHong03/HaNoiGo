/**
 * Stage 1: Input Processing
 * Nhiệm vụ: Validate & sanitize user input, kiểm tra cache
 */

import { RAG_STAGES } from '../../config/constants.js';
import cacheClient from '../../core/cacheClient.js';
import telemetry from '../../core/telemetry.js';
import inputGuard from '../../guardrails/inputGuard.js';
import logger from '../../utils/logger.js';

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
     * STAGE 2: Semantic Cache (Currently DISABLED)
     */
    async processSemanticCache(input) {
        return await telemetry.measureTime(RAG_STAGES.SEMANTIC_CACHE, async () => {
            const cacheKey = this.generateCacheKey(input);
            const cached = await cacheClient.getCache(cacheKey);

            if (cached) {
                logger.info(`🎯 Cache HIT! Key: "${cacheKey}"`);
                return {
                    ...input,
                    ...cached,
                    cached: true,
                    cacheKey
                };
            }
            return { ...input, cached: false, cacheKey };
        });
    }

    /**
     * STAGE 13: Cache Response (Currently DISABLED)
     */
    async cacheResponse(input) {
        if (!input.cached && input.answer && input.retrievedDocs) {
            const key = input.cacheKey || input.question;
            await cacheClient.setCache(key, {
                question: input.question,
                answer: input.answer,
                retrievedDocs: input.retrievedDocs,
                context: input.context,
                intent: input.intent,
                structuredData: input.structuredData
            });
        }
        return input;
    }
}

export default new InputProcessor();
