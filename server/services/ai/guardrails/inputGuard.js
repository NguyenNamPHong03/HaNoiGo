/**
 * Input Guard - Validate inputs, prevent prompt injection
 * Mục đích: Secure input validation
 */

import validator from 'validator';
import { z } from 'zod';
import enhancedLogger from '../utils/enhancedLogger.js';
import { ValidationError } from '../utils/enhancedErrorHandler.js';
import { VALIDATION, DANGEROUS_PATTERNS } from '../config/aiConstants.js';

const logger = enhancedLogger.child('InputGuard');

class InputGuard {
    constructor() {
        this.maxQueryLength = VALIDATION.MAX_QUERY_LENGTH;
        this.dangerous_patterns = DANGEROUS_PATTERNS;
    }

    /**
     * Validate input
     */
    async validate(input) {
        try {
            // Check type
            if (typeof input !== 'string') {
                throw new ValidationError('Input must be a string');
            }

            // Check length
            if (input.length > this.maxQueryLength) {
                throw new ValidationError(
                    `Input exceeds maximum length of ${this.maxQueryLength} characters`,
                    { length: input.length, maxLength: this.maxQueryLength }
                );
            }

            // Check for empty
            if (input.trim().length === 0) {
                throw new ValidationError('Input cannot be empty');
            }

            // Check for injection patterns
            for (const pattern of this.dangerous_patterns) {
                if (pattern.test(input)) {
                    logger.warn('Potential injection detected', { input: input.substring(0, 100) });
                    throw new ValidationError('Input contains potentially harmful patterns');
                }
            }

            // Sanitize HTML
            const sanitized = validator.escape(input);

            logger.debug('Input validation passed', { length: sanitized.length });

            return sanitized;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            logger.error('Input validation failed', error);
            throw new ValidationError('Input validation failed', { originalError: error.message });
        }
    }

    /**
     * Validate question format
     */
    async validateQuestion(question) {
        const schema = z.object({
            question: z.string().min(VALIDATION.MIN_QUERY_LENGTH).max(this.maxQueryLength),
            context: z.string().optional(),
            userId: z.string().optional(),
        });

        return schema.parse({ question });
    }
}

export default new InputGuard();
