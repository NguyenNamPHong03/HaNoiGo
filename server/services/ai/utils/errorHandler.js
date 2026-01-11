/**
 * Error Handler - Centralized error handling
 */

import { ERROR_TYPES, HTTP_STATUS } from '../config/constants.js';
import logger from './logger.js';

class AIServiceError extends Error {
    constructor(type, message, statusCode = 500, details = {}) {
        super(message);
        this.type = type;
        this.statusCode = statusCode;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

class ErrorHandler {
    /**
     * Handle and format error
     */
    formatError(error) {
        let formattedError = {
            message: error.message,
            type: error.type || ERROR_TYPES.INTERNAL_ERROR,
            statusCode: error.statusCode || HTTP_STATUS.INTERNAL_ERROR,
            timestamp: error.timestamp || new Date().toISOString(),
        };

        if (error.details) {
            formattedError.details = error.details;
        }

        return formattedError;
    }

    /**
     * Log and format error
     */
    handle(error, context = {}) {
        logger.error(`Error in ${context.component || 'unknown'}:`, error, context);

        if (error instanceof AIServiceError) {
            return this.formatError(error);
        }

        // Map known error types
        if (error.message.includes('timeout')) {
            return new AIServiceError(
                ERROR_TYPES.TIMEOUT_ERROR,
                'Request timeout',
                HTTP_STATUS.SERVICE_UNAVAILABLE
            );
        }

        if (error.message.includes('rate limit')) {
            return new AIServiceError(
                ERROR_TYPES.RATE_LIMIT_ERROR,
                'Rate limit exceeded',
                HTTP_STATUS.RATE_LIMIT
            );
        }

        return new AIServiceError(
            ERROR_TYPES.INTERNAL_ERROR,
            error.message || 'Internal server error',
            HTTP_STATUS.INTERNAL_ERROR
        );
    }
}

export default {
    AIServiceError,
    handler: new ErrorHandler(),
};
