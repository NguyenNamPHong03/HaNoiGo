/**
 * Food Intent Classifier
 * Detects food-related queries and builds appropriate filters
 * 
 * @module retrieval/extractors/classifiers/FoodIntentClassifier
 * @requires config/keywords
 * 
 * @example
 * import FoodIntentClassifier from './FoodIntentClassifier.js';
 * const result = FoodIntentClassifier.classify('Tìm quán phở ngon');
 * // Returns: { intent: 'FOOD_ENTITY', keyword: 'phở', mustQuery: {...} }
 * 
 * @description
 * Specialized classifier for food-related queries.
 * Uses keyword matching with Vietnamese-compatible regex.
 * Priority: Longest keyword first to match compound foods (e.g., "bún chả" before "bún")
 * 
 * @performance
 * - O(n) where n = number of food keywords (32)
 * - Synchronous operation
 * - Regex optimization: Pre-compiled patterns
 */

import { FOOD_KEYWORDS } from '../../../config/keywords/index.js';

/**
 * @class FoodIntentClassifier
 * @classdesc Classifies food entity intents from user queries
 */
class FoodIntentClassifier {
    constructor() {
        // ✅ Sort by length DESC (longest first) to match compound foods
        this.keywords = [...FOOD_KEYWORDS].sort((a, b) => b.length - a.length);
    }

    /**
     * Classify query as food intent
     * 
     * @param {string} query - User input query
     * 
     * @returns {Object|null} Classification result or null if no match
     * @property {string} intent - Always 'FOOD_ENTITY' if matched
     * @property {string} keyword - Matched food keyword
     * @property {Array<string>} tags - Empty array (not used for food)
     * @property {Object} mustQuery - MongoDB filter for keyword
     * @property {boolean} isDating - Always false for food intent
     * @property {Object|null} mustExclude - Always null
     * 
     * @example
     * FoodIntentClassifier.classify('Tìm quán phở bò');
     * // Returns: { intent: 'FOOD_ENTITY', keyword: 'phở', mustQuery: {...}, ... }
     */
    classify(query) {
        const keyword = this.detectKeyword(query);
        if (!keyword) return null;

        return {
            intent: 'FOOD_ENTITY',
            keyword,
            tags: [],
            mustQuery: this.buildFoodMustQuery(keyword),
            isDating: false,
            mustExclude: null
        };
    }

    /**
     * Detect food keyword from query
     * 
     * @private
     * @param {string} query - User query
     * 
     * @returns {string|null} Matched keyword or null
     * 
     * @description
     * Uses Vietnamese-compatible regex pattern (^|\s)keyword(\s|$)
     * instead of \b boundaries which don't work with diacritics
     */
    detectKeyword(query) {
        const normalized = query.toLowerCase().trim();
        
        for (const keyword of this.keywords) {
            // ✅ Vietnamese regex: (^|\s)keyword(\s|$) instead of \bkeyword\b
            const pattern = new RegExp(`(^|\\s)${keyword}(\\s|$)`, 'i');
            if (pattern.test(normalized)) {
                return keyword;
            }
        }
        
        return null;
    }

    /**
     * Build MongoDB must query for food keyword
     * 
     * @private
     * @param {string} keyword - Food keyword
     * 
     * @returns {Object} MongoDB $and query with category filter
     * 
     * @example
     * buildFoodMustQuery('phở');
     * // Returns: {
     * //   $and: [
     * //     { $or: [{ name: /phở/i }, { description: /phở/i }, ...] },
     * //     { $or: [{ category: {$in: ['Quán ăn', ...]} }, ...] }
     * //   ]
     * // }
     */
    buildFoodMustQuery(keyword) {
        // 🍜 FOOD-ONLY CATEGORIES (loại bỏ karaoke, spa, gym...)
        const foodRelatedCategories = [
            'Quán ăn',
            'Nhà hàng',
            'Quán cafe',
            'Quán ăn vặt',
            'Buffet',
            'Tiệm ăn',
            'Ăn uống',
            'Cafe',
            'Coffee',
            'Trà sữa',
            'Dessert',
            'Chay',
            'Hải sản',
            'Lẩu',
            'Nướng',
            'BBQ',
            'Fast food',
        ];

        return {
            $and: [
                // Condition 1: Keyword match in name/description/tags
                {
                    $or: [
                        { name: { $regex: keyword, $options: 'i' } },
                        { description: { $regex: keyword, $options: 'i' } },
                        { 'aiTags.food': keyword },
                        { 'menu.name': { $regex: keyword, $options: 'i' } }
                    ]
                },
                // Condition 2: Category MUST be food-related (exclude karaoke, spa, gym...)
                {
                    $or: [
                        { category: { $in: foodRelatedCategories } },
                        { category: { $regex: /ăn|uống|cafe|coffee|nhà hàng|quán|buffet|food/i } }
                    ]
                }
            ]
        };
    }
}

export default new FoodIntentClassifier();
