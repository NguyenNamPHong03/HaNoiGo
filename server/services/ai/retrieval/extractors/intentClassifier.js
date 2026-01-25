/**
 * Intent Classifier - Orchestrator (Refactored)
 * Mục đích: Phân loại ý định query bằng cách delegate cho specialized classifiers
 * 
 * REFACTORED ARCHITECTURE:
 * - FoodIntentClassifier: Handles FOOD_ENTITY intents
 * - VibeIntentClassifier: Handles PLACE_VIBE intents
 * - ActivityIntentClassifier: Handles ACTIVITY intents
 * - IntentClassifier: Orchestrates all classifiers (priority-based)
 * 
 * @module IntentClassifier
 */

import FoodIntentClassifier from './classifiers/FoodIntentClassifier.js';
import VibeIntentClassifier from './classifiers/VibeIntentClassifier.js';
import ActivityIntentClassifier from './classifiers/ActivityIntentClassifier.js';
import enhancedLogger from '../../utils/enhancedLogger.js';

const logger = enhancedLogger.child('IntentClassifier');

/**
 * Main Intent Classifier Orchestrator
 * Delegates to specialized classifiers in priority order
 */
class IntentClassifier {
    constructor() {
        this.foodClassifier = FoodIntentClassifier;
        this.vibeClassifier = VibeIntentClassifier;
        this.activityClassifier = ActivityIntentClassifier;
    }

    /**
     * Classify query intent
     * Priority: FOOD_ENTITY > ACTIVITY > PLACE_VIBE > GENERAL
     * 
     * @param {string} query - User query
     * @returns {Object} Classification result
     * @property {string} intent - Intent type (FOOD_ENTITY, PLACE_VIBE, ACTIVITY, GENERAL)
     * @property {string|null} keyword - Matched keyword
     * @property {string[]|null} tags - Associated tags
     * @property {Object|null} mustQuery - MongoDB filter query
     * @property {boolean} isDating - Dating query flag
     * @property {Object|null} mustExclude - Exclusion filter
     */
    classify(query) {
        const queryTrimmed = query.trim();
        
        // Priority 1: FOOD_ENTITY (highest priority)
        const foodResult = this.foodClassifier.classify(queryTrimmed);
        if (foodResult) {
            logger.info('Intent: FOOD_ENTITY', { 
                keyword: foodResult.keyword,
                query: queryTrimmed.substring(0, 50) 
            });
            return foodResult;
        }

        // Priority 2: ACTIVITY
        const activityResult = this.activityClassifier.classify(queryTrimmed);
        if (activityResult) {
            logger.info('Intent: ACTIVITY', { 
                keyword: activityResult.keyword,
                query: queryTrimmed.substring(0, 50) 
            });
            return activityResult;
        }

        // Priority 3: PLACE_VIBE
        const vibeResult = this.vibeClassifier.classify(queryTrimmed);
        if (vibeResult) {
            logger.info('Intent: PLACE_VIBE', { 
                keyword: vibeResult.keyword,
                isDating: vibeResult.isDating,
                query: queryTrimmed.substring(0, 50) 
            });
            return vibeResult;
        }

        // Default: GENERAL (no specific intent)
        logger.info('Intent: GENERAL', { 
            query: queryTrimmed.substring(0, 50) 
        });
        
        return {
            intent: 'GENERAL',
            keyword: null,
            tags: null,
            mustQuery: null,
            isDating: false,
            mustExclude: null
        };
    }

    /**
     * Check if query is short and specific
     * @param {string} query - User query
     * @returns {boolean}
     */
    isShortQuery(query) {
        return query.length < 60;
    }

    /**
     * Check if query is dating-related (delegated)
     * @param {string} query - User query
     * @returns {boolean}
     */
    isDatingQuery(query) {
        return this.vibeClassifier.isDatingQuery(query);
    }

    /**
     * Check for dating negatives (delegated)
     * @param {string} query - User query
     * @returns {boolean}
     */
    hasDatingNegatives(query) {
        return this.vibeClassifier.hasDatingNegatives(query);
    }

    /**
     * Build food query (delegated)
     * @param {string} keyword - Food keyword
     * @returns {Object} MongoDB query
     */
    buildFoodMustQuery(keyword) {
        return this.foodClassifier.buildFoodMustQuery(keyword);
    }

    /**
     * Build vibe query (deprecated - use classify() instead)
     * @deprecated
     */
    buildVibeQuery(tags) {
        if (!tags || tags.length === 0) return null;

        const tagRegexes = tags.map(tag => {
            const safe = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return new RegExp(safe, 'i');
        });

        return {
            $or: [
                { 'aiTags.mood': { $in: tagRegexes } },
                { 'aiTags.space': { $in: tagRegexes } },
                { 'aiTags.suitability': { $in: tagRegexes } },
                { description: { $in: tagRegexes } }
            ]
        };
    }
}

export default new IntentClassifier();
