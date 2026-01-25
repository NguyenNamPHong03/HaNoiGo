/**
 * Redis Cache Client - Enterprise Grade
 * Distributed caching with connection pooling & circuit breaker
 * Replaces in-memory LRU cache for production scalability
 */

import Redis from 'ioredis';
import crypto from 'crypto';

class RedisCacheClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };
    
    // Circuit breaker state
    this.circuitBreaker = {
      failures: 0,
      threshold: 5,
      timeout: 60000, // 1 minute
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      lastFailureTime: null,
    };
  }

  /**
   * Initialize Redis connection with pooling
   */
  async initialize() {
    if (this.isConnected) {
      return this;
    }

    const config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
      
      // Connection pooling
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      
      // Performance
      enableReadyCheck: true,
      enableOfflineQueue: true,
      lazyConnect: false,
      
      // Timeouts
      connectTimeout: 10000,
      commandTimeout: 5000,
    };

    try {
      this.client = new Redis(config);

      // Event handlers
      this.client.on('connect', () => {
        console.log('✅ Redis connected');
        this.isConnected = true;
        this.resetCircuitBreaker();
      });

      this.client.on('error', (error) => {
        console.error('❌ Redis error:', error.message);
        this.handleCircuitBreakerError();
      });

      this.client.on('close', () => {
        console.log('🔌 Redis connection closed');
        this.isConnected = false;
      });

      // Wait for connection
      await this.client.ping();
      console.log('🚀 Redis cache initialized successfully');

      return this;
    } catch (error) {
      console.error('Failed to initialize Redis:', error.message);
      console.warn('⚠️  Falling back to in-memory cache');
      this.client = null;
      throw error;
    }
  }

  /**
   * Circuit breaker pattern for fault tolerance
   */
  handleCircuitBreakerError() {
    this.stats.errors++;
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.state = 'OPEN';
      console.warn('⚠️  Circuit breaker OPEN - Redis unavailable');
      
      // Auto-reset after timeout
      setTimeout(() => {
        this.circuitBreaker.state = 'HALF_OPEN';
        console.log('🔄 Circuit breaker HALF_OPEN - Testing connection');
      }, this.circuitBreaker.timeout);
    }
  }

  resetCircuitBreaker() {
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.state = 'CLOSED';
    this.circuitBreaker.lastFailureTime = null;
  }

  /**
   * Check if circuit breaker allows operation
   */
  canExecute() {
    if (this.circuitBreaker.state === 'OPEN') {
      const elapsed = Date.now() - this.circuitBreaker.lastFailureTime;
      if (elapsed < this.circuitBreaker.timeout) {
        return false;
      }
      this.circuitBreaker.state = 'HALF_OPEN';
    }
    return true;
  }

  /**
   * Generate cache key with namespace
   */
  generateKey(namespace, key) {
    if (typeof key === 'object') {
      key = JSON.stringify(key);
    }
    
    // Hash for consistent length
    const hash = crypto
      .createHash('sha256')
      .update(key)
      .digest('hex')
      .substring(0, 16);
    
    return `hanoigo:ai:${namespace}:${hash}`;
  }

  /**
   * Get value from cache
   */
  async get(namespace, key) {
    if (!this.canExecute() || !this.client) {
      this.stats.misses++;
      return null;
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      const value = await this.client.get(cacheKey);

      if (value) {
        this.stats.hits++;
        return JSON.parse(value);
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      console.error('Redis GET error:', error.message);
      this.handleCircuitBreakerError();
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(namespace, key, value, ttlSeconds = 3600) {
    if (!this.canExecute() || !this.client) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      const serialized = JSON.stringify(value);
      
      await this.client.setex(cacheKey, ttlSeconds, serialized);
      this.stats.sets++;
      
      // Reset circuit breaker on success
      if (this.circuitBreaker.state === 'HALF_OPEN') {
        this.resetCircuitBreaker();
      }
      
      return true;
    } catch (error) {
      console.error('Redis SET error:', error.message);
      this.handleCircuitBreakerError();
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async delete(namespace, key) {
    if (!this.canExecute() || !this.client) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      await this.client.del(cacheKey);
      this.stats.deletes++;
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error.message);
      this.handleCircuitBreakerError();
      return false;
    }
  }

  /**
   * Clear all keys in namespace
   */
  async clear(namespace) {
    if (!this.canExecute() || !this.client) {
      return false;
    }

    try {
      const pattern = `hanoigo:ai:${namespace}:*`;
      const keys = await this.client.keys(pattern);
      
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      
      return true;
    } catch (error) {
      console.error('Redis CLEAR error:', error.message);
      this.handleCircuitBreakerError();
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      total,
      hitRate: hitRate.toFixed(2) + '%',
      circuitBreakerState: this.circuitBreaker.state,
      isConnected: this.isConnected,
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    if (!this.client) {
      return { healthy: false, reason: 'Redis client not initialized' };
    }

    if (!this.canExecute()) {
      return {
        healthy: false,
        reason: 'Circuit breaker OPEN',
        state: this.circuitBreaker.state,
      };
    }

    try {
      await this.client.ping();
      return { healthy: true, latency: await this.measureLatency() };
    } catch (error) {
      return { healthy: false, reason: error.message };
    }
  }

  /**
   * Measure Redis latency
   */
  async measureLatency() {
    const start = Date.now();
    await this.client.ping();
    return Date.now() - start;
  }

  /**
   * Graceful shutdown
   */
  async close() {
    if (this.client) {
      console.log('🔌 Closing Redis connection...');
      await this.client.quit();
      this.isConnected = false;
      console.log('✅ Redis connection closed');
    }
  }
}

// Singleton instance
const redisCacheClient = new RedisCacheClient();

export default redisCacheClient;
