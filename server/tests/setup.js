/**
 * Jest Setup - Test Environment Configuration
 * Configures global test environment and mocks
 */

// Set test environment with all required variables
process.env.NODE_ENV = 'development'; // Use 'development' instead of 'test' for AI config validation
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hanoigo_test';
process.env.JWT_SECRET = 'test-jwt-secret-12345';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test-mock-key-for-unit-tests';
process.env.PINECONE_API_KEY = process.env.PINECONE_API_KEY || 'test-pinecone-api-key';
// Use production index for tests since test index doesn't exist
process.env.PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'hanoigo-places';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';

// Enable mock mode for Pinecone to avoid external API dependency
process.env.USE_MOCK_VECTOR_STORE = 'true';

// Reduce console noise in tests (but keep error/warn)
const originalConsoleLog = console.log;
const originalConsoleDebug = console.debug;
const originalConsoleInfo = console.info;

console.log = () => {};
console.debug = () => {};
console.info = () => {};

