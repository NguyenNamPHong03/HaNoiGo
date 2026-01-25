/**
 * Enhanced Logger - Production-ready logging with Winston
 * Features:
 * - Multiple log levels (error, warn, info, debug, trace)
 * - Structured logging (JSON format)
 * - Request correlation IDs
 * - Log rotation
 * - Performance logging
 * - Separate error logs
 */

import winston from 'winston';
import config from '../config/index.js';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

/**
 * Custom log format for console (development)
 */
const consoleFormat = printf(({ level, message, timestamp, correlationId, component, duration, ...meta }) => {
    let log = `${timestamp} [${level}]`;
    
    if (correlationId) {
        log += ` [${correlationId}]`;
    }
    
    if (component) {
        log += ` [${component}]`;
    }
    
    log += `: ${message}`;
    
    if (duration !== undefined) {
        log += ` (${duration}ms)`;
    }
    
    // Add metadata if exists
    const metaKeys = Object.keys(meta);
    if (metaKeys.length > 0) {
        log += ` ${JSON.stringify(meta)}`;
    }
    
    return log;
});

/**
 * Create Winston logger instance
 */
class EnhancedLogger {
    constructor() {
        this.logger = this.createLogger();
        this.correlationId = null;
    }

    createLogger() {
        const logLevel = config.logging?.level || 'info';
        const isDevelopment = process.env.NODE_ENV !== 'production';

        // Define log transports
        const transports = [];

        // Console transport (always enabled in development)
        if (isDevelopment) {
            transports.push(
                new winston.transports.Console({
                    format: combine(
                        colorize(),
                        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                        consoleFormat
                    ),
                })
            );
        }

        // File transports for production
        if (!isDevelopment) {
            // Combined logs
            transports.push(
                new winston.transports.File({
                    filename: 'logs/ai-service-combined.log',
                    format: combine(
                        timestamp(),
                        errors({ stack: true }),
                        json()
                    ),
                    maxsize: 10485760, // 10MB
                    maxFiles: 5,
                })
            );

            // Error logs only
            transports.push(
                new winston.transports.File({
                    filename: 'logs/ai-service-error.log',
                    level: 'error',
                    format: combine(
                        timestamp(),
                        errors({ stack: true }),
                        json()
                    ),
                    maxsize: 10485760, // 10MB
                    maxFiles: 5,
                })
            );

            // Console in production (JSON format)
            transports.push(
                new winston.transports.Console({
                    format: combine(
                        timestamp(),
                        json()
                    ),
                })
            );
        }

        return winston.createLogger({
            level: logLevel,
            transports,
            // Handle uncaught exceptions
            exceptionHandlers: [
                new winston.transports.File({ filename: 'logs/ai-service-exceptions.log' })
            ],
            // Handle unhandled rejections
            rejectionHandlers: [
                new winston.transports.File({ filename: 'logs/ai-service-rejections.log' })
            ],
        });
    }

    /**
     * Set correlation ID for request tracking
     */
    setCorrelationId(id) {
        this.correlationId = id;
    }

    /**
     * Generate correlation ID
     */
    generateCorrelationId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Create child logger with component context
     */
    child(component) {
        return {
            trace: (message, meta = {}) => this.trace(message, { ...meta, component }),
            debug: (message, meta = {}) => this.debug(message, { ...meta, component }),
            info: (message, meta = {}) => this.info(message, { ...meta, component }),
            warn: (message, meta = {}) => this.warn(message, { ...meta, component }),
            error: (message, error, meta = {}) => this.error(message, error, { ...meta, component }),
        };
    }

    /**
     * Log methods with automatic correlation ID
     */
    _log(level, message, meta = {}) {
        const logMeta = {
            ...meta,
            correlationId: this.correlationId || meta.correlationId,
        };

        this.logger.log(level, message, logMeta);
    }

    trace(message, meta = {}) {
        // Winston doesn't have trace, use debug
        this._log('debug', `[TRACE] ${message}`, meta);
    }

    debug(message, meta = {}) {
        this._log('debug', message, meta);
    }

    info(message, meta = {}) {
        this._log('info', message, meta);
    }

    warn(message, meta = {}) {
        this._log('warn', message, meta);
    }

    error(message, error, meta = {}) {
        const errorMeta = {
            ...meta,
            error: error instanceof Error ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
            } : error,
        };

        this._log('error', message, errorMeta);
    }

    /**
     * Performance logging
     */
    performance(operation, duration, meta = {}) {
        this.info(`Performance: ${operation}`, {
            ...meta,
            duration,
            metric: 'performance',
        });
    }

    /**
     * Log with timing
     */
    async time(operation, fn, meta = {}) {
        const start = Date.now();
        const correlationId = this.generateCorrelationId();
        this.setCorrelationId(correlationId);

        this.info(`Starting: ${operation}`, { ...meta, correlationId });

        try {
            const result = await fn();
            const duration = Date.now() - start;
            
            this.info(`Completed: ${operation}`, {
                ...meta,
                duration,
                correlationId,
                status: 'success',
            });

            return result;
        } catch (error) {
            const duration = Date.now() - start;
            
            this.error(`Failed: ${operation}`, error, {
                ...meta,
                duration,
                correlationId,
                status: 'failed',
            });

            throw error;
        } finally {
            this.correlationId = null;
        }
    }

    /**
     * Log LLM API calls
     */
    llmCall(model, prompt, meta = {}) {
        this.info(`LLM Call: ${model}`, {
            ...meta,
            model,
            promptLength: prompt?.length || 0,
            metric: 'llm_call',
        });
    }

    /**
     * Log cache operations
     */
    cacheOperation(operation, key, meta = {}) {
        this._log('debug', `Cache ${operation}: ${key}`, {
            ...meta,
            operation,
            key,
            metric: 'cache',
        });
    }

    /**
     * Log search operations
     */
    searchOperation(strategy, resultCount, meta = {}) {
        this.info(`Search [${strategy}]: ${resultCount} results`, {
            ...meta,
            strategy,
            resultCount,
            metric: 'search',
        });
    }
}

// Export singleton instance
export default new EnhancedLogger();
