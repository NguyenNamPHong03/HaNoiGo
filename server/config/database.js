/**
 * MongoDB Connection Pool Configuration
 * Enterprise-grade connection management with monitoring
 */

import mongoose from 'mongoose';

/**
 * Optimized MongoDB connection options
 * Reference: https://mongoosejs.com/docs/connections.html
 */
export const mongooseOptions = {
  // Connection pooling (CRITICAL for performance)
  maxPoolSize: 50,        // Max number of connections (default: 100)
  minPoolSize: 5,         // Min number of connections (default: 0)
  
  // Connection timeouts
  serverSelectionTimeoutMS: 5000,   // Timeout for initial server selection
  socketTimeoutMS: 45000,           // Socket timeout
  connectTimeoutMS: 10000,          // Connection timeout
  
  // Heartbeat & monitoring
  heartbeatFrequencyMS: 10000,      // Ping server every 10s
  
  // Retry logic
  maxIdleTimeMS: 300000,            // Close idle connections after 5 minutes
  waitQueueTimeoutMS: 10000,        // Queue timeout when pool is full
  
  // Performance
  autoIndex: process.env.NODE_ENV !== 'production', // Disable in prod
  
  // Buffering
  bufferCommands: false,            // Fail fast if not connected
  
  // Options for MongoDB 4.0+
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

/**
 * Connect to MongoDB with optimized pooling
 */
export async function connectDatabase(uri) {
  try {
    console.log('🔗 Connecting to MongoDB with connection pooling...');
    console.log('   Pool size: 5-50 connections');
    console.log('   URI:', uri.replace(/:[^:]*@/, ':***@')); // Hide password

    await mongoose.connect(uri, mongooseOptions);

    console.log('✅ MongoDB connected successfully');

    // Monitor connection pool
    setupConnectionMonitoring();

    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
}

/**
 * Setup connection pool monitoring
 */
function setupConnectionMonitoring() {
  const db = mongoose.connection.db;

  // Log connection pool stats every 60 seconds
  setInterval(() => {
    const poolStats = db.serverConfig?.s?.pool;
    
    if (poolStats) {
      console.log('📊 MongoDB Pool Stats:', {
        available: poolStats.availableConnections?.length || 0,
        inUse: poolStats.inUseConnections?.length || 0,
        total: poolStats.totalConnections || 0,
      });
    }
  }, 60000);

  // Connection events
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connection established');
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB reconnected');
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
      process.exit(1);
    }
  });
}

/**
 * Get connection pool statistics
 */
export function getPoolStats() {
  const db = mongoose.connection.db;
  const poolStats = db?.serverConfig?.s?.pool;

  if (!poolStats) {
    return { available: 0, inUse: 0, total: 0 };
  }

  return {
    available: poolStats.availableConnections?.length || 0,
    inUse: poolStats.inUseConnections?.length || 0,
    total: poolStats.totalConnections || 0,
    state: mongoose.connection.readyState,
  };
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth() {
  try {
    if (mongoose.connection.readyState !== 1) {
      return {
        healthy: false,
        state: getConnectionState(mongoose.connection.readyState),
      };
    }

    // Ping database
    const start = Date.now();
    await mongoose.connection.db.admin().ping();
    const latency = Date.now() - start;

    return {
      healthy: true,
      latency,
      poolStats: getPoolStats(),
      state: 'connected',
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      state: getConnectionState(mongoose.connection.readyState),
    };
  }
}

/**
 * Get human-readable connection state
 */
function getConnectionState(state) {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized',
  };
  return states[state] || 'unknown';
}

export default {
  connect: connectDatabase,
  getPoolStats,
  checkHealth: checkDatabaseHealth,
  options: mongooseOptions,
};
