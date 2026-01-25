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
        this.queryResultCache = new Map(); // NEW: Query result cache
        this.maxSize = 500; // Max cached queries
        this.maxQueryResultSize = 1000; // Max cached query results
        this.defaultTTL = 3600 * 1000; // 1 hour in ms
        this.initialized = true;
        
        // Cache statistics
        this.stats = {
            hits: 0,
            misses: 0,
            queryResultHits: 0,
            queryResultMisses: 0
        };
    }

    async initialize() {
        logger.info('💾 In-Memory LRU Cache enabled (max: ' + this.maxSize + ' entries)');
        logger.info('💾 Query Result Cache enabled (max: ' + this.maxQueryResultSize + ' entries)');
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
            this.stats.misses++;
            return null;
        }

        // Check expiration
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }

        // Move to end (most recently used) - LRU behavior
        this.cache.delete(key);
        this.cache.set(key, entry);

        this.stats.hits++;
        logger.info(`🎯 Cache HIT for: "${query.substring(0, 50)}..."`);
        return entry.payload;
    }

    /**
     * PHASE 2 OPTIMIZATION: Query result caching with tiered TTL
     * Cache search results to reduce vector DB queries
     */
    async setQueryResultCache(queryKey, results, options = {}) {
        const { 
            ttlSeconds = this._getTieredTTL(results),
            filters = {} 
        } = options;

        const cacheKey = this._generateQueryResultKey(queryKey, filters);
        const expiresAt = Date.now() + (ttlSeconds * 1000);

        // LRU eviction if at max capacity
        if (this.queryResultCache.size >= this.maxQueryResultSize) {
            const oldestKey = this.queryResultCache.keys().next().value;
            this.queryResultCache.delete(oldestKey);
        }

        this.queryResultCache.set(cacheKey, {
            results,
            filters,
            expiresAt,
            timestamp: Date.now()
        });

        logger.info(`💾 Cached query results: "${queryKey.substring(0, 40)}..." (TTL: ${ttlSeconds}s, ${results.length} results)`);
    }

    /**
     * Get cached query results
     */
    async getQueryResultCache(queryKey, filters = {}) {
        const cacheKey = this._generateQueryResultKey(queryKey, filters);
        const entry = this.queryResultCache.get(cacheKey);

        if (!entry) {
            this.stats.queryResultMisses++;
            return null;
        }

        // Check expiration
        if (Date.now() > entry.expiresAt) {
            this.queryResultCache.delete(cacheKey);
            this.stats.queryResultMisses++;
            return null;
        }

        // Move to end (LRU)
        this.queryResultCache.delete(cacheKey);
        this.queryResultCache.set(cacheKey, entry);

        this.stats.queryResultHits++;
        logger.info(`🎯 Query Result Cache HIT: "${queryKey.substring(0, 40)}..." (${entry.results.length} results)`);
        return entry.results;
    }

    /**
     * Generate cache key for query results (including filters)
     */
    _generateQueryResultKey(query, filters) {
        const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');
        const filterStr = JSON.stringify(filters || {});
        const combined = `${normalized}|${filterStr}`;
        return crypto.createHash('md5').update(combined).digest('hex');
    }

    /**
     * Tiered TTL based on query popularity and result count
     * Popular/high-quality results: 24h
     * Standard results: 1h  
     * Rare/empty results: 10m
     */
    _getTieredTTL(results) {
        if (!results || results.length === 0) {
            return 600; // 10 minutes for empty results
        }

        // Check if results are high quality (avg score > 0.8)
        const avgScore = results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length;
        
        if (avgScore > 0.8 && results.length >= 5) {
            return 86400; // 24 hours for high-quality popular results
        }

        return 3600; // 1 hour for standard results
    }

    /**
     * Clear all cache entries
     */
    async clearCache(pattern = '*') {
        this.cache.clear();
        logger.info('🗑️ Cache cleared');
    }

    /**
     * Get cache stats with hit rate metrics
     */
    getStats() {
        const totalRequests = this.stats.hits + this.stats.misses;
        const totalQueryResults = this.stats.queryResultHits + this.stats.queryResultMisses;
        
        return {
            semanticCache: {
                size: this.cache.size,
                maxSize: this.maxSize,
                hits: this.stats.hits,
                misses: this.stats.misses,
                hitRate: totalRequests > 0 
                    ? ((this.stats.hits / totalRequests) * 100).toFixed(2) + '%'
                    : '0%'
            },
            queryResultCache: {
                size: this.queryResultCache.size,
                maxSize: this.maxQueryResultSize,
                hits: this.stats.queryResultHits,
                misses: this.stats.queryResultMisses,
                hitRate: totalQueryResults > 0
                    ? ((this.stats.queryResultHits / totalQueryResults) * 100).toFixed(2) + '%'
                    : '0%'
            },
            memoryUsage: process.memoryUsage().heapUsed
        };
    }

    async healthCheck() {
        return true;
    }
}

export default new CacheClient();
