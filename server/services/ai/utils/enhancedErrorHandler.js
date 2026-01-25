/**
 * Enhanced Error Handler - Enterprise-grade error handling
 * Features:
 * - Custom error class hierarchy
 * - Structured error responses
 * - Error tracking/monitoring integration ready
 * - Consistent error messages (English)
 */

import { ERROR_TYPES, HTTP_STATUS } from '../config/aiConstants.js';
import enhancedLogger from './enhancedLogger.js';

/**
 * Base AIService Error Class
 */
export class AIServiceError extends Error {
    constructor(type, message, statusCode = 500, details = {}) {
        super(message);
        this.name = this.constructor.name;
        this.type = type;
        this.statusCode = statusCode;
        this.details = details;
        this.timestamp = new Date().toISOString();
        
        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            name: this.name,
            type: this.type,
            message: this.message,
            statusCode: this.statusCode,
            details: this.details,
            timestamp: this.timestamp,
        };
    }
}

/**
 * Validation Error
 */
export class ValidationError extends AIServiceError {
    constructor(message, details = {}) {
        super(ERROR_TYPES.VALIDATION_ERROR, message, HTTP_STATUS.BAD_REQUEST, details);
    }
}

/**
 * LLM Error
 */
export class LLMError extends AIServiceError {
    constructor(type, message, details = {}) {
        const statusCode = type === ERROR_TYPES.LLM_RATE_LIMIT 
            ? HTTP_STATUS.RATE_LIMIT 
            : HTTP_STATUS.SERVICE_UNAVAILABLE;
        super(type, message, statusCode, details);
    }
}

/**
 * Retrieval Error
 */
export class RetrievalError extends AIServiceError {
    constructor(type, message, details = {}) {
        super(type, message, HTTP_STATUS.INTERNAL_ERROR, details);
    }
}

/**
 * Cache Error
 */
export class CacheError extends AIServiceError {
    constructor(message, details = {}) {
        super(ERROR_TYPES.CACHE_ERROR, message, HTTP_STATUS.INTERNAL_ERROR, details);
    }
}

/**
 * Timeout Error
 */
export class TimeoutError extends AIServiceError {
    constructor(operation, timeout, details = {}) {
        const message = `Operation "${operation}" timed out after ${timeout}ms`;
        super(ERROR_TYPES.TIMEOUT_ERROR, message, HTTP_STATUS.SERVICE_UNAVAILABLE, details);
    }
}

/**
 * Error Handler Class
 */
class EnhancedErrorHandler {
    constructor() {
        this.logger = enhancedLogger.child('ErrorHandler');
    }

    /**
     * Format error for API response
     */
    formatError(error) {
        if (error instanceof AIServiceError) {
            return error.toJSON();
        }

        // Unknown error
        return {
            name: 'InternalError',
            type: ERROR_TYPES.INTERNAL_ERROR,
            message: error.message || 'An unexpected error occurred',
            statusCode: HTTP_STATUS.INTERNAL_ERROR,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Handle error with logging and formatting
     */
    handle(error, context = {}) {
        const component = context.component || 'unknown';
        const correlationId = context.correlationId;

        // Log error
        this.logger.error(`Error in ${component}`, error, {
            component,
            correlationId,
            context,
        });

        // Map known error types
        if (error instanceof AIServiceError) {
            return this.formatError(error);
        }

        // Map common error patterns
        const errorMessage = error.message?.toLowerCase() || '';

        if (errorMessage.includes('timeout')) {
            return new TimeoutError(context.operation || 'unknown', context.timeout || 30000);
        }

        if (errorMessage.includes('rate limit')) {
            return new LLMError(
                ERROR_TYPES.LLM_RATE_LIMIT,
                'LLM rate limit exceeded, please try again later',
                { originalError: error.message }
            );
        }

        if (errorMessage.includes('api key') || errorMessage.includes('authentication')) {
            return new LLMError(
                ERROR_TYPES.LLM_API_ERROR,
                'LLM API authentication failed',
                { originalError: error.message }
            );
        }

        // Default internal error
        return new AIServiceError(
            ERROR_TYPES.INTERNAL_ERROR,
            error.message || 'Internal server error',
            HTTP_STATUS.INTERNAL_ERROR,
            {
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            }
        );
    }

    /**
     * Create validation error
     */
    validationError(message, details = {}) {
        return new ValidationError(message, details);
    }

    /**
     * Create LLM error
     */
    llmError(type, message, details = {}) {
        return new LLMError(type, message, details);
    }

    /**
     * Create retrieval error
     */
    retrievalError(type, message, details = {}) {
        return new RetrievalError(type, message, details);
    }

    /**
     * Create timeout error
     */
    timeoutError(operation, timeout, details = {}) {
        return new TimeoutError(operation, timeout, details);
    }

    /**
     * Wrap async function with error handling
     */
    async wrapAsync(fn, context = {}) {
        try {
            return await fn();
        } catch (error) {
            throw this.handle(error, context);
        }
    }

    /**
     * Integration with error tracking services (Sentry, DataDog, etc.)
     * Call this method to send errors to monitoring service
     */
    trackError(error, context = {}) {
        // TODO: Integrate with Sentry/DataDog
        // Example:
        // Sentry.captureException(error, { extra: context });
        
        this.logger.error('Error tracked', error, context);
    }
}

// Export singleton instance and error classes
const handler = new EnhancedErrorHandler();

export default {
    handler,
    AIServiceError,
    ValidationError,
    LLMError,
    RetrievalError,
    CacheError,
    TimeoutError,
};
