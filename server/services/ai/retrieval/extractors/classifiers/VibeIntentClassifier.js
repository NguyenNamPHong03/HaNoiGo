/**
 * Vibe Intent Classifier
 * Handles PLACE_VIBE intent classification
 * 
 * @module VibeIntentClassifier
 */

import { VIBE_KEYWORDS, VIBE_TO_TAGS_MAP, DATING_NEGATIVE_KEYWORDS } from '../../../config/keywords/index.js';
import enhancedLogger from '../../../utils/enhancedLogger.js';

const logger = enhancedLogger.child('VibeIntentClassifier');

class VibeIntentClassifier {
    constructor() {
        this.vibeKeywords = VIBE_KEYWORDS;
        this.vibeToTagsMap = VIBE_TO_TAGS_MAP;
        this.datingNegativeKeywords = DATING_NEGATIVE_KEYWORDS;
        
        // Dating detection keywords
        this.datingKeywords = [
            'hẹn hò', 'date', 'dating', 'lãng mạn', 'romantic',
            'buổi hẹn', 'đưa crush', 'đưa bạn gái', 'đưa bạn trai', 'couple'
        ];
    }

    /**
     * Detect vibe keyword in query
     * @param {string} query - User query
     * @returns {string|null} Matched vibe keyword or null
     */
    detectKeyword(query) {
        const queryLower = query.toLowerCase().trim();
        
        // Sort by length (longest first)
        const sorted = [...this.vibeKeywords].sort((a, b) => b.length - a.length);

        for (const keyword of sorted) {
            // Use flexible word boundary for Vietnamese
            const pattern = `(^|\\s)${this.escapeRegex(keyword)}(\\s|$)`;
            const regex = new RegExp(pattern, 'i');
            
            if (regex.test(queryLower)) {
                logger.debug(`Vibe keyword detected: "${keyword}"`, { query: queryLower.substring(0, 50) });
                return keyword;
            }
        }

        return null;
    }

    /**
     * Check if query is dating-related
     * @param {string} query - User query
     * @returns {boolean}
     */
    isDatingQuery(query) {
        const queryLower = query.toLowerCase();
        return this.datingKeywords.some(kw => queryLower.includes(kw));
    }

    /**
     * Check if query has dating negative keywords
     * @param {string} query - User query
     * @returns {boolean}
     */
    hasDatingNegatives(query) {
        const queryLower = query.toLowerCase();
        return this.datingNegativeKeywords.some(kw => queryLower.includes(kw));
    }

    /**
     * Build MongoDB filter for dating mode
     * @returns {Object} Exclusion filter
     */
    buildDatingExcludeFilter() {
        return {
            category: { $nin: ['Lưu trú'] }, // Exclude accommodation
            $and: [
                { name: { $not: /nhà nghỉ|khách sạn|hotel|motel|homestay/i } },
                { name: { $not: /buffet|nhậu|bia hơi|quán nhậu|ăn vặt/i } },
                { name: { $not: /xiên|nem nướng|bún đậu|ốc|vỉa hè|lề đường/i } },
                { description: { $not: /nhà nghỉ|khách sạn|buffet|xiên|nem nướng|bún đậu/i } }
            ]
        };
    }

    /**
     * Classify vibe intent
     * @param {string} query - User query
     * @returns {Object|null} Classification result or null
     */
    classify(query) {
        const keyword = this.detectKeyword(query);
        
        if (!keyword) {
            return null;
        }

        const tags = this.vibeToTagsMap[keyword] || [keyword];
        const isDating = this.isDatingQuery(query);
        
        // Check for contradictions
        if (isDating && this.hasDatingNegatives(query)) {
            logger.warn('Dating query with negative keywords detected', { 
                query: query.substring(0, 50) 
            });
        }

        // Build exclude filter for dating mode
        let mustExclude = null;
        if (isDating) {
            mustExclude = this.buildDatingExcludeFilter();
            logger.info('Dating mode activated - adding exclude filter');
        }
        
        logger.info(`Vibe intent classified`, { 
            keyword, 
            isDating,
            tags: tags.join(', '),
            query: query.substring(0, 50) 
        });

        return {
            intent: 'PLACE_VIBE',
            keyword,
            tags,
            mustQuery: null,
            isDating,
            mustExclude
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

export default new VibeIntentClassifier();
