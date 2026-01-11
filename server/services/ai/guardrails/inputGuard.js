/**
 * Input Guard - Validate inputs, prevent prompt injection
 * Mục đích: Secure input validation
 */

import validator from 'validator';
import { z } from 'zod';
import logger from '../utils/logger.js';

class InputGuard {
    constructor() {
        this.maxQueryLength = 500;
        this.dangerous_patterns = [
            /ignore.*previous.*instruction/gi,
            /system prompt/gi,
            /disregard/gi,
            /jailbreak/gi,
        ];
    }

    /**
     * Validate input
     */
    async validate(input) {
        try {
            // Check type
            if (typeof input !== 'string') {
                throw new Error('Input must be a string');
            }

            // Check length
            if (input.length > this.maxQueryLength) {
                throw new Error(`Input exceeds maximum length of ${this.maxQueryLength}`);
            }

            // Check for empty
            if (input.trim().length === 0) {
                throw new Error('Input cannot be empty');
            }

            // Check for injection patterns
            for (const pattern of this.dangerous_patterns) {
                if (pattern.test(input)) {
                    logger.warn(`⚠️  Potential injection detected: ${input}`);
                    throw new Error('Input contains potentially harmful patterns');
                }
            }

            // Sanitize HTML
            const sanitized = validator.escape(input);

            logger.info(`✅ Input validation passed`);

            return sanitized;
        } catch (error) {
            logger.error(`❌ Input validation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate question format
     */
    async validateQuestion(question) {
        const schema = z.object({
            question: z.string().min(3).max(this.maxQueryLength),
            context: z.string().optional(),
            userId: z.string().optional(),
        });

        return schema.parse({ question });
    }
}

export default new InputGuard();
