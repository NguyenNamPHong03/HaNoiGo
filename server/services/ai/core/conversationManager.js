/**
 * Conversation Manager - Multi-turn Conversation State Management
 * PHASE 4: Handles conversation history, context carry-over, reference resolution
 * 
 * Features:
 * - Session-based state storage in memory (LRU cache)
 * - Conversation history tracking
 * - Reference resolution ("quán đầu tiên", "có mở cửa không?")
 * - Context carry-over between queries
 */

import logger from '../utils/logger.js';
import crypto from 'crypto';

class ConversationManager {
    constructor() {
        this.sessions = new Map(); // sessionId -> ConversationState
        this.maxSessions = 1000; // Max concurrent sessions
        this.sessionTTL = 1800000; // 30 minutes in ms
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        logger.info('💬 Conversation Manager initialized (TTL: 30min, Max: 1000 sessions)');
        
        // Start cleanup interval (every 5 minutes)
        this.cleanupInterval = setInterval(() => {
            this._cleanupExpiredSessions();
        }, 300000); // 5 minutes

        return this;
    }

    /**
     * Generate or retrieve session ID
     */
    generateSessionId(userId) {
        return crypto.createHash('md5')
            .update(`${userId}-${Date.now()}`)
            .digest('hex');
    }

    /**
     * Get conversation state for a session
     */
    async getState(sessionId) {
        if (!sessionId) return null;

        const state = this.sessions.get(sessionId);
        if (!state) {
            return null;
        }

        // Check if expired
        if (Date.now() > state.expiresAt) {
            this.sessions.delete(sessionId);
            logger.info(`🗑️  Session expired: ${sessionId}`);
            return null;
        }

        // Refresh expiration on access
        state.expiresAt = Date.now() + this.sessionTTL;
        
        logger.info(`📖 Retrieved session: ${sessionId} (${state.history.length} messages)`);
        return state;
    }

    /**
     * Save conversation state
     */
    async saveState(sessionId, state) {
        if (!sessionId) {
            throw new Error('Session ID required');
        }

        // LRU eviction if at max capacity
        if (this.sessions.size >= this.maxSessions && !this.sessions.has(sessionId)) {
            const oldestKey = this.sessions.keys().next().value;
            this.sessions.delete(oldestKey);
            logger.info(`🗑️  Evicted oldest session: ${oldestKey}`);
        }

        const enrichedState = {
            ...state,
            sessionId,
            expiresAt: Date.now() + this.sessionTTL,
            updatedAt: new Date()
        };

        this.sessions.set(sessionId, enrichedState);
        logger.info(`💾 Saved session: ${sessionId}`);
    }

    /**
     * Append a message to conversation history
     */
    async appendMessage(sessionId, message) {
        let state = await this.getState(sessionId);
        
        if (!state) {
            // Create new session
            state = {
                sessionId,
                userId: message.userId,
                history: [],
                lastPlaces: [],
                lastIntent: null,
                context: {},
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: Date.now() + this.sessionTTL
            };
        }

        // Add message to history
        state.history.push({
            ...message,
            timestamp: new Date()
        });

        // Keep only last 10 messages (memory optimization)
        if (state.history.length > 10) {
            state.history = state.history.slice(-10);
        }

        await this.saveState(sessionId, state);
        return state;
    }

    /**
     * Update last places and intent
     */
    async updateContext(sessionId, { places, intent, location, budget }) {
        const state = await this.getState(sessionId);
        if (!state) return;

        if (places) {
            state.lastPlaces = places.slice(0, 10); // Keep top 10
        }

        if (intent) {
            state.lastIntent = intent;
        }

        if (location) {
            state.context.location = location;
        }

        if (budget !== undefined) {
            state.context.budget = budget;
        }

        await this.saveState(sessionId, state);
    }

    /**
     * Analyze query for context references
     * Returns: { type, target, context }
     */
    async analyzeReference(query, sessionId) {
        const state = await this.getState(sessionId);
        if (!state || !state.lastPlaces || state.lastPlaces.length === 0) {
            return { type: 'NEW_QUERY' };
        }

        const queryLower = query.toLowerCase();

        // Reference to first place: "quán đầu tiên", "quán thứ nhất"
        if (queryLower.match(/quán (đầu tiên|thứ nhất|đầu|1)/i)) {
            return {
                type: 'REFERENCE',
                targetPlace: state.lastPlaces[0],
                targetIndex: 0,
                originalQuery: query
            };
        }

        // Reference to second place: "quán thứ hai", "quán 2"
        if (queryLower.match(/quán (thứ hai|thứ 2|hai|2)/i)) {
            return {
                type: 'REFERENCE',
                targetPlace: state.lastPlaces[1],
                targetIndex: 1,
                originalQuery: query
            };
        }

        // Follow-up question about last place: "có mở cửa không?", "giá bao nhiêu?"
        const followUpPatterns = [
            /có (mở cửa|phục vụ|đông|xa)/i,
            /giá (bao nhiêu|như thế nào|thế nào)/i,
            /(địa chỉ|ở đâu|đường nào)/i,
            /(review|đánh giá) (thế nào|sao)/i
        ];

        if (followUpPatterns.some(pattern => pattern.test(queryLower))) {
            return {
                type: 'FOLLOW_UP',
                subject: state.lastPlaces[0],
                question: query,
                originalContext: state.lastIntent
            };
        }

        // Refinement query: "gần hơn", "rẻ hơn", "đông người hơn"
        const refinementPatterns = [
            /(gần|xa) hơn/i,
            /(rẻ|đắt) hơn/i,
            /(đông|vắng|yên tĩnh|sôi động) hơn/i
        ];

        if (refinementPatterns.some(pattern => pattern.test(queryLower))) {
            return {
                type: 'REFINEMENT',
                baseIntent: state.lastIntent,
                baseContext: state.context,
                modification: query,
                lastPlaces: state.lastPlaces
            };
        }

        // No reference detected - new query
        return { type: 'NEW_QUERY' };
    }

    /**
     * Format conversation history for LLM context
     */
    formatHistoryForPrompt(sessionId, limit = 5) {
        const state = this.sessions.get(sessionId);
        if (!state || !state.history.length) {
            return '';
        }

        const recent = state.history.slice(-limit);
        const formatted = recent.map(msg => {
            const role = msg.role === 'user' ? 'Người dùng' : 'Fong';
            return `${role}: ${msg.content}`;
        }).join('\n');

        return `\n--- Lịch sử hội thoại ---\n${formatted}\n--- ---\n`;
    }

    /**
     * Clean up expired sessions (runs periodically)
     */
    _cleanupExpiredSessions() {
        const now = Date.now();
        let cleaned = 0;

        for (const [sessionId, state] of this.sessions.entries()) {
            if (now > state.expiresAt) {
                this.sessions.delete(sessionId);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.info(`🧹 Cleaned up ${cleaned} expired sessions`);
        }
    }

    /**
     * Get conversation statistics
     */
    getStats() {
        const now = Date.now();
        let activeCount = 0;

        for (const state of this.sessions.values()) {
            if (now < state.expiresAt) {
                activeCount++;
            }
        }

        return {
            totalSessions: this.sessions.size,
            activeSessions: activeCount,
            maxSessions: this.maxSessions,
            ttlMinutes: this.sessionTTL / 60000
        };
    }

    /**
     * Clear session (for testing or logout)
     */
    async clearSession(sessionId) {
        this.sessions.delete(sessionId);
        logger.info(`🗑️  Cleared session: ${sessionId}`);
    }

    /**
     * Shutdown cleanup
     */
    async shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.sessions.clear();
        logger.info('💬 Conversation Manager shutdown');
    }
}

export default new ConversationManager();
