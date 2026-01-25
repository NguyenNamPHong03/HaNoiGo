/**
 * Activity Intent Classifier
 * Handles ACTIVITY intent classification
 * 
 * @module ActivityIntentClassifier
 */

import { ACTIVITY_KEYWORDS } from '../../../config/keywords/index.js';
import enhancedLogger from '../../../utils/enhancedLogger.js';

const logger = enhancedLogger.child('ActivityIntentClassifier');

class ActivityIntentClassifier {
    constructor() {
        this.activityKeywords = ACTIVITY_KEYWORDS;
    }

    /**
     * Detect activity keyword in query
     * @param {string} query - User query
     * @returns {string|null} Matched activity keyword or null
     */
    detectKeyword(query) {
        const queryLower = query.toLowerCase().trim();
        
        // Sort by length (longest first)
        const sorted = [...this.activityKeywords].sort((a, b) => b.length - a.length);

        for (const keyword of sorted) {
            // Use flexible word boundary for Vietnamese
            const pattern = `(^|\\s)${this.escapeRegex(keyword)}(\\s|$)`;
            const regex = new RegExp(pattern, 'i');
            
            if (regex.test(queryLower)) {
                logger.debug(`Activity keyword detected: "${keyword}"`, { query: queryLower.substring(0, 50) });
                return keyword;
            }
        }

        return null;
    }

    /**
     * Classify activity intent
     * @param {string} query - User query
     * @returns {Object|null} Classification result or null
     */
    classify(query) {
        const keyword = this.detectKeyword(query);
        
        if (!keyword) {
            return null;
        }

        const tags = [keyword];
        
        logger.info(`Activity intent classified`, { 
            keyword, 
            query: query.substring(0, 50) 
        });

        return {
            intent: 'ACTIVITY',
            keyword,
            tags,
            mustQuery: null,
            isDating: false,
            mustExclude: null
        };
    }

    /**
     * Escape special regex characters
     * @private
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

export default new ActivityIntentClassifier();
