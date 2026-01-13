/**
 * Token Counter - Estimate costs and token usage
 */

import { encoding_for_model } from 'js-tiktoken';
import config from '../config/index.js';
import { TOKEN_LIMITS } from '../config/constants.js';
import logger from './logger.js';

class TokenCounter {
    constructor() {
        try {
            this.enc = encoding_for_model(config.openai.model);
        } catch (error) {
            logger.warn(`⚠️  Model ${config.openai.model} not found in tiktoken, falling back to gpt-4 encoding`);
            this.enc = encoding_for_model('gpt-4');
        }
    }

    /**
     * Count tokens in text
     */
    countTokens(text) {
        try {
            const tokens = this.enc.encode(text);
            return tokens.length;
        } catch (error) {
            logger.error('❌ Token counting failed:', error);
            return Math.ceil(text.length / 4); // Fallback estimate
        }
    }

    /**
     * Estimate cost
     */
    estimateCost(inputTokens, outputTokens) {
        // Pricing for GPT-4-Turbo (as of 2024 - update as needed)
        const inputCostPer1k = 0.01;
        const outputCostPer1k = 0.03;

        const inputCost = (inputTokens / 1000) * inputCostPer1k;
        const outputCost = (outputTokens / 1000) * outputCostPer1k;

        return {
            input: inputCost.toFixed(4),
            output: outputCost.toFixed(4),
            total: (inputCost + outputCost).toFixed(4),
        };
    }

    /**
     * Get limit for current model
     */
    getCurrentModelLimit() {
        const currentModel = config.openai.model;

        // Basic fallback
        let limit = 128000; // Default to high context for modern models

        // Simple mapping based on checking substrings
        if (currentModel.includes('gpt-4o')) limit = 128000;
        else if (currentModel.includes('gpt-4.1')) limit = 128000; // New future model
        else if (currentModel.includes('mini')) limit = 128000; // All mini models tend to have high context
        else if (currentModel.includes('gpt-4-turbo')) limit = 128000;
        else if (currentModel.includes('gpt-3.5')) limit = 16385;
        else if (currentModel.includes('gpt-4')) limit = 8192; // Classic GPT-4

        return limit;
    }

    /**
     * Check if text fits in context window
     */
    fitsInContext(text, maxTokens = null) {
        const tokens = this.countTokens(text);
        const limit = maxTokens || this.getCurrentModelLimit();

        return tokens <= limit;
    }
}

export default new TokenCounter();
