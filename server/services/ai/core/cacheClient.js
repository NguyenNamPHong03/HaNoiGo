/**
 * Cache Client - In-Memory LRU Cache
 * Fast in-memory caching for semantic search results
 * Falls back to no-op if memory constrained
 */

import logger from '../utils/logger.js';
import crypto from 'crypto';

class CacheClient {
    constructor() {
        this.cache = new Map();
        this.maxSize = 500; // Max cached queries
        this.defaultTTL = 3600 * 1000; // 1 hour in ms
        this.initialized = true;
    }

    async initialize() {
        logger.info('💾 In-Memory LRU Cache enabled (max: ' + this.maxSize + ' entries)');
        return this;
    }

    /**
     * Generate cache key from query
     */
    _generateKey(query) {
        // Normalize query: lowercase, trim, remove extra spaces
        const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');
        return crypto.createHash('md5').update(normalized).digest('hex');
    }

    /**
     * Set cache entry
     */
    async setCache(query, answer, ttlSeconds = 3600) {
        const key = this._generateKey(query);
        const expiresAt = Date.now() + (ttlSeconds * 1000);

        // If at max capacity, remove oldest entry (LRU)
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            payload: answer, // can be string or object
            expiresAt,
            query // Store original for debugging
        });

        logger.info(`💾 Cached query: "${query.substring(0, 50)}..."`);
    }

    /**
     * Get cached entry
     */
    async getCache(query) {
        const key = this._generateKey(query);
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check expiration
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        // Move to end (most recently used) - LRU behavior
        this.cache.delete(key);
        this.cache.set(key, entry);

        logger.info(`🎯 Cache HIT for: "${query.substring(0, 50)}..."`);
        return entry.payload;
    }

    /**
     * Clear all cache entries
     */
    async clearCache(pattern = '*') {
        this.cache.clear();
        logger.info('🗑️ Cache cleared');
    }

    /**
     * Get cache stats
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            memoryUsage: process.memoryUsage().heapUsed
        };
    }

    async healthCheck() {
        return true;
    }
}

export default new CacheClient();
