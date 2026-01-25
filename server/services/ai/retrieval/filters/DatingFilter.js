/**
 * Dating Filter Module
 * Applies strict filtering for dating/romantic queries
 * @module DatingFilter
 */

import enhancedLogger from '../../utils/enhancedLogger.js';
import { DATING_NEGATIVE_KEYWORDS } from '../../config/keywords/index.js';

const logger = enhancedLogger.child('DatingFilter');

/**
 * Dating filter configuration
 */
const DATING_CONFIG = {
    allowedCategories: ['Ăn uống'],
    excludePatterns: [
        /buffet/i, /nhậu/i, /bia hơi/i, /xiên/i,
        /nem nướng/i, /bún đậu/i, /ốc/i, /vỉa hè/i,
        /nhà nghỉ/i, /khách sạn/i, /hotel/i, /motel/i,
        /bánh mì/i, /cơm văn phòng/i, /quán nhậu/i
    ]
};

class DatingFilter {
    /**
     * Apply dating mode filter to documents
     * @param {Array} docs - Retrieved documents
     * @param {boolean} isDatingMode - Whether dating mode is active
     * @returns {Array} Filtered documents
     */
    apply(docs, isDatingMode = false) {
        if (!isDatingMode || docs.length === 0) {
            return docs;
        }

        const before = docs.length;
        
        const filtered = docs.filter(doc => {
            const name = doc.metadata?.name || doc.name || '';
            const desc = doc.pageContent || doc.metadata?.description || '';
            const category = doc.metadata?.category || '';

            // Strict category check
            if (category && !DATING_CONFIG.allowedCategories.includes(category)) {
                logger.debug(`Removed "${name}" - Category "${category}" not allowed for dating`, {
                    reason: 'invalid_category'
                });
                return false;
            }

            // If no category, reject
            if (!category) {
                logger.debug(`Removed "${name}" - No category defined`, {
                    reason: 'missing_category'
                });
                return false;
            }

            // Check negative keywords
            for (const pattern of DATING_CONFIG.excludePatterns) {
                if (pattern.test(name) || pattern.test(desc)) {
                    logger.debug(`Removed "${name}" - Matched pattern ${pattern}`, {
                        reason: 'negative_keyword'
                    });
                    return false;
                }
            }

            // Check additional negative keywords from config
            for (const keyword of DATING_NEGATIVE_KEYWORDS) {
                const regex = new RegExp(`(^|\\s)${keyword}(\\s|$)`, 'i');
                if (regex.test(name) || regex.test(desc)) {
                    logger.debug(`Removed "${name}" - Matched keyword "${keyword}"`, {
                        reason: 'dating_negative_keyword'
                    });
                    return false;
                }
            }

            return true;
        });

        const removed = before - filtered.length;
        logger.info('Dating filter applied', {
            before,
            after: filtered.length,
            removed,
            removalRate: `${((removed / before) * 100).toFixed(1)}%`
        });

        return filtered;
    }

    /**
     * Build MongoDB exclude filter for dating mode
     * @returns {Object} MongoDB filter object
     */
    buildExcludeFilter() {
        const excludeConditions = [];

        // Exclude non-food categories
        excludeConditions.push({
            category: { $nin: DATING_CONFIG.allowedCategories }
        });

        // Exclude patterns in name/description
        const negativeRegex = DATING_NEGATIVE_KEYWORDS.map(kw => `\\b${kw}\\b`).join('|');
        excludeConditions.push({
            $or: [
                { name: { $regex: negativeRegex, $options: 'i' } },
                { description: { $regex: negativeRegex, $options: 'i' } }
            ]
        });

        return {
            $nor: excludeConditions
        };
    }

    /**
     * Check if query is dating-related
     * @param {string} query - User query
     * @returns {boolean}
     */
    isDatingQuery(query) {
        const datingKeywords = [
            'hẹn hò', 'date', 'dating', 'lãng mạn', 'romantic',
            'cặp đôi', 'couple', 'bạn gái', 'bạn trai',
            'kỷ niệm', 'anniversary', 'sinh nhật người yêu'
        ];

        const normalized = query.toLowerCase().trim();
        return datingKeywords.some(kw => {
            const regex = new RegExp(`(^|\\s)${kw}(\\s|$)`, 'i');
            return regex.test(normalized);
        });
    }
}

export default new DatingFilter();
