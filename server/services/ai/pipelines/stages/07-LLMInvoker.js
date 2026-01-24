/**
 * Stage 7: LLM Invoker
 * Nhiệm vụ: Gọi LLM và parse response
 */

import { RAG_STAGES } from '../../config/constants.js';
import telemetry from '../../core/telemetry.js';
import logger from '../../utils/logger.js';

class LLMInvoker {
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
     * STAGE 11: LLM Inference
     */
    async invoke(input) {
        if (input.cached) return input;

        return await telemetry.measureTime(RAG_STAGES.LLM_INFERENCE, async () => {
            const response = await this.llm.invoke(input.prompt);

            let answer = '';
            // Robust response extraction
            if (typeof response === 'string') {
                answer = response;
            } else if (response?.content) {
                answer = response.content;
            } else if (response?.kwargs?.content) {
                answer = response.kwargs.content;
            } else if (response?.text) {
                answer = response.text;
            }

            let structuredData = null;
            if (input.intent === 'ITINERARY') {
                const itineraryType = input.itineraryType || 'FULL_DAY';
                logger.info(`📋 Parsing ${itineraryType} itinerary JSON...`);
                
                try {
                    const firstOpen = answer.indexOf('{');
                    const lastClose = answer.lastIndexOf('}');
                    let jsonString = answer;

                    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
                        jsonString = answer.substring(firstOpen, lastClose + 1);
                    }

                    jsonString = jsonString.replace(/[\u0000-\u0019]+/g, "").trim();
                    structuredData = JSON.parse(jsonString);
                    logger.info('✅ Successfully parsed Itinerary JSON');
                } catch (e) {
                    logger.warn('⚠️ Failed to parse itinerary JSON', e);
                }
            }

            return {
                ...input,
                answer,
                structuredData
            };
        });
    }
}

export default new LLMInvoker();
