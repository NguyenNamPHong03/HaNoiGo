/**
 * Enhanced Cache Client - Production-ready LRU Cache
 * Features:
 * - Automatic TTL cleanup
 * - Cache statistics tracking
 * - Memory usage monitoring
 * - Cache warming
 * - Metrics export
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
        
        // Statistics
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
        
        this.logger = enhancedLogger.child('CacheClient');
    }

    /**
     * Initialize cache and start cleanup process
     */
    async initialize() {
        if (this.initialized) {
            return this;
        }

        this.logger.info(`Initializing Enhanced LRU Cache`, {
            maxSize: this.maxSize,
            defaultTTL: this.defaultTTL / 1000 + 's',
            cleanupInterval: this.cleanupInterval / 1000 + 's',
        });

        // Start automatic TTL cleanup
        this.startCleanupProcess();

        this.initialized = true;
        this.logger.info('Enhanced Cache initialized successfully');
        
        return this;
    }

    /**
     * Start automatic cleanup of expired entries
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
     * Stop cleanup process
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
     */
    cleanupExpired() {
        const now = Date.now();
        let expiredCount = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                expiredCount++;
                this.stats.expirations++;
            }
        }

        if (expiredCount > 0) {
            this.logger.debug(`Cleaned up ${expiredCount} expired cache entries`, {
                remaining: this.cache.size,
            });
        }
    }

    /**
     * Generate cache key from query
     */
    _generateKey(query, prefix = CACHE_KEYS.QUERY_PREFIX) {
        // Normalize query: lowercase, trim, remove extra spaces
        const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');
        const hash = crypto.createHash('md5').update(normalized).digest('hex');
        return `${prefix}${hash}`;
    }

    /**
     * Set cache entry
     */
    async setCache(query, value, ttlSeconds = null) {
        const key = this._generateKey(query);
        const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
        const expiresAt = Date.now() + ttl;

        // LRU eviction: If at max capacity, remove oldest entry
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
            this.stats.evictions++;
            
            this.logger.debug('Cache eviction (LRU)', {
                evictedKey: oldestKey,
                reason: 'max_size_reached',
            });
        }

        // Store entry
        this.cache.set(key, {
            value,
            expiresAt,
            query: query.substring(0, 100), // Store truncated query for debugging
            createdAt: Date.now(),
        });

        this.stats.sets++;

        this.logger.debug(`Cache SET: ${query.substring(0, 50)}`, {
            ttl: ttl / 1000 + 's',
            size: this.cache.size,
        });

        return true;
    }

    /**
     * Get cached entry
     */
    async getCache(query) {
        const key = this._generateKey(query);
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            this.logger.debug(`Cache MISS: ${query.substring(0, 50)}`);
            return null;
        }

        // Check expiration
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.stats.misses++;
            this.stats.expirations++;
            
            this.logger.debug(`Cache EXPIRED: ${query.substring(0, 50)}`, {
                age: (Date.now() - entry.createdAt) / 1000 + 's',
            });
            
            return null;
        }

        // Move to end (most recently used) - LRU behavior
        this.cache.delete(key);
        this.cache.set(key, entry);

        this.stats.hits++;

        this.logger.debug(`Cache HIT: ${query.substring(0, 50)}`, {
            age: (Date.now() - entry.createdAt) / 1000 + 's',
        });

        return entry.value;
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
     * Get cache statistics
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
            : 0;

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hitRate: `${hitRate}%`,
            hits: this.stats.hits,
            misses: this.stats.misses,
            sets: this.stats.sets,
            deletes: this.stats.deletes,
            evictions: this.stats.evictions,
            expirations: this.stats.expirations,
            memoryUsage: this._getMemoryUsage(),
        };
    }

    /**
     * Reset statistics
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
     */
    async warmCache(queries = []) {
        this.logger.info(`Warming cache with ${queries.length} queries`);
        
        let warmed = 0;
        for (const { query, value, ttl } of queries) {
            await this.setCache(query, value, ttl);
            warmed++;
        }
        
        this.logger.info(`Cache warmed - ${warmed} entries loaded`);
        
        return warmed;
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            // Test set and get
            const testKey = '__health_check__';
            const testValue = { test: true, timestamp: Date.now() };
            
            await this.setCache(testKey, testValue, 10);
            const retrieved = await this.getCache(testKey);
            await this.deleteCache(testKey);
            
            const isHealthy = retrieved !== null && retrieved.test === true;
            
            if (!isHealthy) {
                this.logger.warn('Cache health check failed - retrieved value mismatch');
            }
            
            return isHealthy;
        } catch (error) {
            this.logger.error('Cache health check failed', error);
            return false;
        }
    }

    /**
     * Graceful shutdown
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
