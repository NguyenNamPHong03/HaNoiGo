/**
 * Enhanced Cache Client - Production-Grade LRU Cache
 * Enterprise-ready caching with performance monitoring and automatic optimization
 * 
 * @features
 * - Automatic TTL cleanup with configurable intervals
 * - LRU eviction policy for memory efficiency
 * - Cache statistics and hit rate tracking
 * - Memory usage monitoring and alerts
 * - Cache warming for common queries
 * - Health checks for reliability
 * 
 * @performance
 * - O(1) get/set operations using Map
 * - Automatic expired entry cleanup
 * - Configurable cache size limits
 * 
 * @monitoring
 * - Hit rate percentage
 * - Memory usage tracking
 * - Eviction and expiration counts
 */

import crypto from 'crypto';
import enhancedLogger from '../utils/enhancedLogger.js';
import { PERFORMANCE, CACHE_KEYS, METRICS } from '../config/aiConstants.js';

class EnhancedCacheClient {
    constructor() {
        this.cache = new Map();
        this.maxSize = PERFORMANCE.CACHE_MAX_SIZE;
        this.defaultTTL = PERFORMANCE.CACHE_DEFAULT_TTL * 1000; // Convert to ms
        this.cleanupInterval = PERFORMANCE.CACHE_CLEANUP_INTERVAL;
        this.initialized = false;
        
        // Statistics for monitoring
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            evictions: 0,
            expirations: 0,
        };
        
        // Cleanup interval reference
        this.cleanupTimer = null;
        
        // Performance tracking
        this.performance = {
            lastCleanup: null,
            avgGetTime: 0,
            avgSetTime: 0,
            getOperations: [],
            setOperations: [],
        };
        
        this.logger = enhancedLogger.child('CacheClient');
    }

    /**
     * Initialize cache and start cleanup process
     * @returns {Promise<EnhancedCacheClient>} Initialized cache instance
     */
    async initialize() {
        if (this.initialized) {
            return this;
        }

        this.logger.info('Initializing Enhanced LRU Cache', {
            maxSize: this.maxSize,
            defaultTTL: `${this.defaultTTL / 1000}s`,
            cleanupInterval: `${this.cleanupInterval / 1000}s`,
        });

        // Start automatic TTL cleanup
        this.startCleanupProcess();

        this.initialized = true;
        this.logger.info('Enhanced Cache initialized successfully');
        
        return this;
    }

    /**
     * Start automatic cleanup of expired entries
     * Runs in background without blocking main thread
     */
    startCleanupProcess() {
        if (this.cleanupTimer) {
            return; // Already started
        }
        
        this.cleanupTimer = setInterval(() => {
            this.cleanupExpired();
        }, this.cleanupInterval);

        // Prevent the timer from keeping Node.js process alive
        if (this.cleanupTimer.unref) {
            this.cleanupTimer.unref();
        }
        
        this.logger.debug('Cache cleanup process started');
    }

    /**
     * Stop cleanup process (for graceful shutdown)
     */
    stopCleanupProcess() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
            this.logger.debug('Cache cleanup process stopped');
        }
    }

    /**
     * Clean up expired entries
     * Optimized with batch deletion
     */
    cleanupExpired() {
        const startTime = Date.now();
        const now = Date.now();
        const expiredKeys = [];

        // Collect expired keys
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                expiredKeys.push(key);
            }
        }

        // Batch delete
        for (const key of expiredKeys) {
            this.cache.delete(key);
            this.stats.expirations++;
        }

        const duration = Date.now() - startTime;
        this.performance.lastCleanup = now;

        if (expiredKeys.length > 0) {
            this.logger.debug(`Cleaned ${expiredKeys.length} expired entries`, {
                duration: `${duration}ms`,
                remaining: this.cache.size,
            });
        }
    }

    /**
     * Generate optimized cache key from query
     * Uses SHA256 for collision resistance
     * 
     * @param {string} query - User query
     * @param {string} prefix - Cache key prefix
     * @returns {string} Hashed cache key
     */
    _generateKey(query, prefix = CACHE_KEYS.QUERY_PREFIX) {
        // Normalize query: lowercase, trim, remove extra spaces
        const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');
        
        // Use SHA256 for better collision resistance than MD5
        const hash = crypto
            .createHash('sha256')
            .update(normalized)
            .digest('hex')
            .substring(0, 16); // First 16 chars sufficient
        
        return `${prefix}${hash}`;
    }

    /**
     * Set cache entry with performance tracking
     * Implements LRU eviction when at capacity
     * 
     * @param {string} query - Query string
     * @param {any} value - Value to cache
     * @param {number} ttlSeconds - TTL in seconds (optional)
     * @returns {Promise<boolean>} Success status
     */
    async setCache(query, value, ttlSeconds = null) {
        const startTime = performance.now();
        const key = this._generateKey(query);
        const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
        const expiresAt = Date.now() + ttl;

        // LRU eviction: If at max capacity, remove oldest entry
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
            this.stats.evictions++;
            
            this.logger.debug('Cache eviction (LRU)', {
                evictedKey: oldestKey.substring(0, 20),
                reason: 'max_size_reached',
                cacheSize: this.cache.size,
            });
        }

        // Store entry with metadata
        this.cache.set(key, {
            value,
            expiresAt,
            query: query.substring(0, 100), // Truncate for logging
            createdAt: Date.now(),
            hits: 0, // Track individual entry hits
        });

        this.stats.sets++;
        
        // Track performance
        const duration = performance.now() - startTime;
        this._trackSetPerformance(duration);

        this.logger.debug(`Cache SET: ${query.substring(0, 50)}`, {
            ttl: `${ttl / 1000}s`,
            size: this.cache.size,
            duration: `${duration.toFixed(2)}ms`,
        });

        return true;
    }

    /**
     * Get cached entry with performance tracking and LRU update
     * 
     * @param {string} query - Query string
     * @returns {Promise<any|null>} Cached value or null
     */
    async getCache(query) {
        const startTime = performance.now();
        const key = this._generateKey(query);
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            const duration = performance.now() - startTime;
            this._trackGetPerformance(duration);
            
            this.logger.debug(`Cache MISS: ${query.substring(0, 50)}`, {
                duration: `${duration.toFixed(2)}ms`,
            });
            return null;
        }

        // Check expiration
        const now = Date.now();
        if (now > entry.expiresAt) {
            this.cache.delete(key);
            this.stats.misses++;
            this.stats.expirations++;
            
            const duration = performance.now() - startTime;
            this._trackGetPerformance(duration);
            
            this.logger.debug(`Cache EXPIRED: ${query.substring(0, 50)}`, {
                age: `${((now - entry.createdAt) / 1000).toFixed(1)}s`,
                duration: `${duration.toFixed(2)}ms`,
            });
            
            return null;
        }

        // LRU: Move to end (most recently used)
        this.cache.delete(key);
        entry.hits++;
        this.cache.set(key, entry);

        this.stats.hits++;
        
        // Track performance
        const duration = performance.now() - startTime;
        this._trackGetPerformance(duration);

        this.logger.debug(`Cache HIT: ${query.substring(0, 50)}`, {
            age: `${((now - entry.createdAt) / 1000).toFixed(1)}s`,
            entryHits: entry.hits,
            duration: `${duration.toFixed(2)}ms`,
        });

        return entry.value;
    }

    /**
     * Track SET operation performance
     */
    _trackSetPerformance(duration) {
        this.performance.setOperations.push(duration);
        
        // Keep only last 100 operations
        if (this.performance.setOperations.length > 100) {
            this.performance.setOperations.shift();
        }
        
        const total = this.performance.setOperations.reduce((a, b) => a + b, 0);
        this.performance.avgSetTime = total / this.performance.setOperations.length;
    }

    /**
     * Track GET operation performance
     */
    _trackGetPerformance(duration) {
        this.performance.getOperations.push(duration);
        
        // Keep only last 100 operations
        if (this.performance.getOperations.length > 100) {
            this.performance.getOperations.shift();
        }
        
        const total = this.performance.getOperations.reduce((a, b) => a + b, 0);
        this.performance.avgGetTime = total / this.performance.getOperations.length;
    }

    /**
     * Delete specific cache entry
     */
    async deleteCache(query) {
        const key = this._generateKey(query);
        const deleted = this.cache.delete(key);
        
        if (deleted) {
            this.stats.deletes++;
            this.logger.debug(`Cache DELETE: ${query.substring(0, 50)}`);
        }
        
        return deleted;
    }

    /**
     * Clear all cache entries
     */
    async clearCache() {
        const size = this.cache.size;
        this.cache.clear();
        
        this.logger.warn(`Cache cleared - ${size} entries removed`);
        
        return true;
    }

    /**
     * Get comprehensive cache statistics
     * Includes hit rate, performance metrics, and memory usage
     * 
     * @returns {Object} Cache statistics object
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0
            ? (this.stats.hits / total * 100).toFixed(2)
            : 0;

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            utilization: `${((this.cache.size / this.maxSize) * 100).toFixed(1)}%`,
            
            // Hit rate metrics
            hitRate: `${hitRate}%`,
            hits: this.stats.hits,
            misses: this.stats.misses,
            total,
            
            // Operation counts
            sets: this.stats.sets,
            deletes: this.stats.deletes,
            evictions: this.stats.evictions,
            expirations: this.stats.expirations,
            
            // Performance metrics
            performance: {
                avgGetTime: `${this.performance.avgGetTime.toFixed(3)}ms`,
                avgSetTime: `${this.performance.avgSetTime.toFixed(3)}ms`,
                lastCleanup: this.performance.lastCleanup 
                    ? new Date(this.performance.lastCleanup).toISOString()
                    : null,
            },
            
            // Memory usage
            memoryUsage: this._getMemoryUsage(),
        };
    }

    /**
     * Reset statistics (for testing or admin operations)
     */
    resetStats() {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            evictions: 0,
            expirations: 0,
        };
        
        this.performance.getOperations = [];
        this.performance.setOperations = [];
        this.performance.avgGetTime = 0;
        this.performance.avgSetTime = 0;
        
        this.logger.info('Cache statistics reset');
    }

    /**
     * Get memory usage estimate
     */
    _getMemoryUsage() {
        const heapUsed = process.memoryUsage().heapUsed;
        const mb = (heapUsed / 1024 / 1024).toFixed(2);
        return `${mb} MB`;
    }

    /**
     * Cache warming - preload common queries
     * Useful for startup optimization
     * 
     * @param {Array<Object>} queries - Array of {query, value, ttl}
     * @returns {Promise<number>} Number of entries warmed
     */
    async warmCache(queries = []) {
        this.logger.info(`Warming cache with ${queries.length} queries`);
        
        let warmed = 0;
        for (const { query, value, ttl } of queries) {
            try {
                await this.setCache(query, value, ttl);
                warmed++;
            } catch (error) {
                this.logger.warn('Cache warming failed for query', { 
                    query: query.substring(0, 50),
                    error: error.message,
                });
            }
        }
        
        this.logger.info(`Cache warmed - ${warmed}/${queries.length} entries loaded`);
        
        return warmed;
    }

    /**
     * Enterprise health check
     * Tests read/write operations and returns detailed status
     * 
     * @returns {Promise<Object>} Health status object
     */
    async healthCheck() {
        try {
            // Test set operation
            const testKey = `__health_check_${Date.now()}`;
            const testValue = { test: true, timestamp: Date.now() };
            
            const setStart = performance.now();
            await this.setCache(testKey, testValue, 10);
            const setDuration = performance.now() - setStart;
            
            // Test get operation
            const getStart = performance.now();
            const retrieved = await this.getCache(testKey);
            const getDuration = performance.now() - getStart;
            
            // Cleanup
            await this.deleteCache(testKey);
            
            const isHealthy = retrieved !== null && retrieved.test === true;
            
            if (!isHealthy) {
                this.logger.warn('Cache health check failed - value mismatch');
            }
            
            return {
                healthy: isHealthy,
                latency: {
                    set: `${setDuration.toFixed(2)}ms`,
                    get: `${getDuration.toFixed(2)}ms`,
                },
                stats: this.getStats(),
            };
        } catch (error) {
            this.logger.error('Cache health check failed', error);
            return {
                healthy: false,
                error: error.message,
            };
        }
    }

    /**
     * Graceful shutdown with final statistics
     * Clears cache and stops cleanup process
     * 
     * @returns {Promise<void>}
     */
    async shutdown() {
        this.logger.info('Shutting down cache...');
        
        this.stopCleanupProcess();
        
        const stats = this.getStats();
        this.logger.info('Final cache statistics', stats);
        
        this.cache.clear();
        this.initialized = false;
        
        this.logger.info('Cache shutdown complete');
    }
}

// Export singleton instance
export default new EnhancedCacheClient();
