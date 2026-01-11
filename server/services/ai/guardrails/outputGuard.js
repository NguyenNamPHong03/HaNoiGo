/**
 * Output Guard - Validate LLM output, prevent hallucinations
 * Mục đích: Ensure output quality and safety
 */

import logger from '../utils/logger.js';

class OutputGuard {
    constructor() {
        this.maxOutputLength = 5000;
    }

    /**
     * Validate output
     */
    async validate(output) {
        try {
            // Check type
            if (typeof output !== 'string') {
                throw new Error('Output must be a string');
            }

            // Check length
            if (output.length > this.maxOutputLength) {
                logger.warn('⚠️  Output exceeds maximum length, truncating...');
                return output.substring(0, this.maxOutputLength) + '...';
            }

            // Check for harmful content
            if (this.containsHarmfulContent(output)) {
                logger.warn('⚠️  Harmful content detected in output');
                throw new Error('Output contains harmful content');
            }

            // Check for coherence
            if (!this.isCoherent(output)) {
                logger.warn('⚠️  Output lacks coherence');
                // We might choose to return it anyway with a log, or throw. 
                // For now, logging but returning (lenient)
            }

            logger.info(`✅ Output validation passed`);

            return output;
        } catch (error) {
            logger.error(`❌ Output validation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Check for harmful content
     */
    containsHarmfulContent(text) {
        const harmfulPatterns = [
            /violence/gi,
            /illegal/gi,
            /hate.*speech/gi,
        ];

        return harmfulPatterns.some((pattern) => pattern.test(text));
    }

    /**
     * Check coherence
     */
    isCoherent(text) {
        // Simple checks for coherence
        const words = text.split(/\s+/).length;
        // Just a basic heuristic
        return words > 2;
    }

    /**
     * Hallucination detection (basic)
     */
    detectHallucination(output, context) {
        // Simple check: does output reference information from context?
        const contextWords = new Set(context.toLowerCase().split(/\s+/));
        const outputWords = output.toLowerCase().split(/\s+/);

        const matchedWords = outputWords.filter((word) => contextWords.has(word)).length;
        const matchRatio = matchedWords / outputWords.length;

        if (matchRatio < 0.3) {
            logger.warn('⚠️  Potential hallucination detected (low context match)');
            return true;
        }

        return false;
    }
}

export default new OutputGuard();
