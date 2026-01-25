/**
 * AI Service Constants
 * Centralized constants to avoid magic numbers/strings
 */

// ==================== PERFORMANCE CONSTANTS ====================

export const PERFORMANCE = {
    // Cache settings
    CACHE_MAX_SIZE: 500,
    CACHE_DEFAULT_TTL: 3600, // 1 hour in seconds
    CACHE_CLEANUP_INTERVAL: 300000, // 5 minutes in ms
    
    // LLM settings
    LLM_MAX_TOKENS: 1024,
    LLM_MAX_RETRIES: 2,
    LLM_TIMEOUT: 30000, // 30 seconds
    
    // Search settings
    SEARCH_TEXT_LIMIT_CHAT: 5,
    SEARCH_TEXT_LIMIT_ITINERARY: 20,
    SEARCH_MAX_RESULTS: 50,
    SEARCH_MIN_SCORE: 0.5,
    
    // Nearby search
    NEARBY_MAX_DISTANCE_METERS: 5000, // 5km
    NEARBY_DEFAULT_LIMIT: 15,
};

// ==================== ERROR TYPES ====================

export const ERROR_TYPES = {
    // Input validation
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INPUT_TOO_LONG: 'INPUT_TOO_LONG',
    INPUT_EMPTY: 'INPUT_EMPTY',
    INJECTION_DETECTED: 'INJECTION_DETECTED',
    
    // LLM errors
    LLM_TIMEOUT: 'LLM_TIMEOUT',
    LLM_RATE_LIMIT: 'LLM_RATE_LIMIT',
    LLM_API_ERROR: 'LLM_API_ERROR',
    LLM_INVALID_RESPONSE: 'LLM_INVALID_RESPONSE',
    
    // Retrieval errors
    NO_RESULTS_FOUND: 'NO_RESULTS_FOUND',
    SEARCH_FAILED: 'SEARCH_FAILED',
    DATABASE_ERROR: 'DATABASE_ERROR',
    
    // Cache errors
    CACHE_ERROR: 'CACHE_ERROR',
    
    // Generic
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
};

// ==================== HTTP STATUS CODES ====================

export const HTTP_STATUS = {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    RATE_LIMIT: 429,
    INTERNAL_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};

// ==================== INTENT TYPES ====================

export const INTENT_TYPES = {
    // Primary intents
    CHAT: 'CHAT',
    ITINERARY: 'ITINERARY',
    
    // Query intents
    FOOD_ENTITY: 'FOOD_ENTITY',
    PLACE_VIBE: 'PLACE_VIBE',
    ACTIVITY: 'ACTIVITY',
    GENERAL: 'GENERAL',
    
    // Itinerary types
    FULL_DAY: 'FULL_DAY',
    EVENING_SIMPLE: 'EVENING_SIMPLE',
    EVENING_FANCY: 'EVENING_FANCY',
    EVENING_FULL: 'EVENING_FULL',
};

// ==================== SEARCH STRATEGIES ====================

export const SEARCH_STRATEGIES = {
    SEMANTIC: 'semantic',
    KEYWORD: 'keyword',
    NEARBY: 'nearby',
    ADDRESS_REGEX: 'address_regex',
    HYBRID: 'hybrid',
};

// ==================== CACHE KEYS ====================

export const CACHE_KEYS = {
    QUERY_PREFIX: 'query:',
    INTENT_PREFIX: 'intent:',
    SEARCH_PREFIX: 'search:',
    PLACE_PREFIX: 'place:',
};

// ==================== VALIDATION LIMITS ====================

export const VALIDATION = {
    MAX_QUERY_LENGTH: 500,
    MIN_QUERY_LENGTH: 3,
    MAX_CONTEXT_LENGTH: 1000,
};

// ==================== DANGEROUS PATTERNS ====================

export const DANGEROUS_PATTERNS = [
    /ignore.*previous.*instruction/gi,
    /system prompt/gi,
    /disregard/gi,
    /jailbreak/gi,
    /forget.*previous/gi,
    /new instructions/gi,
];

// ==================== REGEX PATTERNS ====================

export const PATTERNS = {
    // Evening detection
    EVENING: /(?:buổi\s*)?tối(?:\s+(?:nay|ở|hà nội|thứ))?|evening/i,
    
    // Style detection
    SIMPLE: /đơn giản|nhanh|gọn|casual|simple/i,
    FANCY: /chỉnh chu|tươm tất|sang trọng|cao cấp|fancy|elegant|luxury/i,
    
    // Dating detection
    DATING: /hẹn hò|date|dating|lãng mạn|romantic|buổi hẹn|đưa crush|đưa bạn gái|đưa bạn trai|couple/i,
    
    // Location detection
    NEAR_ME: /gần đây|quanh đây|gần tôi|nearby|near me|xung quanh/i,
};

// ==================== LOGGING ====================

export const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
    TRACE: 'trace',
};

// ==================== METRICS ====================

export const METRICS = {
    PERFORMANCE: 'performance',
    LLM_CALL: 'llm_call',
    CACHE_HIT: 'cache_hit',
    CACHE_MISS: 'cache_miss',
    SEARCH: 'search',
    ERROR: 'error',
};

// ==================== DEFAULT VALUES ====================

export const DEFAULTS = {
    PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
    RELEVANCE_THRESHOLD: 0.7,
    MIN_RATING: 0,
    MAX_RATING: 5,
};
