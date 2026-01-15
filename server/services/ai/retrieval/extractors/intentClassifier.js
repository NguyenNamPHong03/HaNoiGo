/**
 * Intent Classifier - Phân loại ý định query
 * Mục đích: Phân biệt ENTITY (phở) vs VIBE (hẹn hò) vs ACTIVITY (karaoke)
 * 
 * 3 INTENT TYPES:
 * 1. FOOD_ENTITY: Món ăn cụ thể (phở, bún, lẩu) → HARD keyword filter
 * 2. PLACE_VIBE: Không khí/mood (hẹn hò, lãng mạn, chill) → TAG/MOOD filter
 * 3. ACTIVITY: Hoạt động (karaoke, xem bóng đá) → ACTIVITY filter
 */

import logger from '../../utils/logger.js';

class IntentClassifier {
    constructor() {
        // 🍜 FOOD ENTITIES - Tìm theo KEYWORD trong name/description
        this.foodKeywords = [
            // Món chính
            'phở', 'bún', 'bún chả', 'bún đậu', 'bún bò', 'bún riêu', 'bún ốc',
            'miến', 'miến gà', 'miến lươn', 'miến cua',
            'cơm', 'cơm tấm', 'cơm rang', 'cơm chiên',
            'bánh mì', 'bánh cuốn', 'bánh đa', 'bánh tôm',
            'xôi', 'xôi xéo', 'xôi gấc', 'xôi vò',
            'chả cá', 'nem', 'nem chua rán', 'nem rán',
            'lẩu', 'lẩu bò', 'lẩu thái', 'lẩu hải sản',
            'nướng', 'bbq', 'buffet', 'hotpot',
            
            // Món ăn vặt
            'chè', 'kem', 'trà sữa', 'sinh tố',
            'bánh trôi', 'bánh chay', 'bánh rán',
            'đậu hủ', 'tào phớ', 'sữa chua',
            
            // Fast food
            'pizza', 'burger', 'gà rán', 'pasta', 'sushi',
            
            // Đồ uống
            'cafe', 'coffee', 'cà phê', 'trà', 'nước ép',
            
            // Món Á khác
            'dimsum', 'mì', 'mì vằn thắn', 'hoành thánh',
            'cháo', 'súp', 'canh'
        ];

        // 💕 PLACE VIBE - Tìm theo TAGS/MOOD (không phải tên quán)
        this.vibeKeywords = [
            // Dating & Romance
            'hẹn hò', 'date', 'dating', 'lãng mạn', 'romantic', 'romance',
            'riêng tư', 'private', 'kín đáo', 'ấm cúng', 'cozy',
            
            // Mood & Atmosphere
            'chill', 'thư giãn', 'relax', 'yên tĩnh', 'quiet', 'peaceful',
            'sôi động', 'lively', 'náo nhiệt', 'vui vẻ', 'fun',
            
            // Visual & Aesthetic
            'view đẹp', 'view', 'cảnh đẹp', 'scenic', 'sống ảo', 'instagram',
            'đẹp', 'aesthetic', 'vintage', 'sang trọng', 'luxury', 'cao cấp',
            
            // Social Context
            'gia đình', 'family', 'bạn bè', 'friends', 'đám đông', 'nhóm',
            
            // Study/Work
            'học bài', 'study', 'làm việc', 'work', 'làm việc nhóm'
        ];

        // 🎵 ACTIVITY - Hoạt động cụ thể
        this.activityKeywords = [
            'karaoke', 'hát', 'sing',
            'xem bóng đá', 'xem bóng', 'bóng đá', 'football',
            'live music', 'nhạc sống', 'acoustic',
            'boardgame', 'board game', 'chơi game',
            'bi-a', 'billiards', 'pool',
            'bowling',
            'gym', 'thể thao', 'workout'
        ];

        // Mapping vibe keywords → aiTags để search
        this.vibeToTagsMap = {
            // Dating & Romance
            'hẹn hò': ['lãng mạn', 'romantic', 'date-night', 'riêng tư', 'ấm cúng'],
            'date': ['lãng mạn', 'romantic', 'date-night', 'riêng tư'],
            'lãng mạn': ['lãng mạn', 'romantic', 'ấm cúng', 'view đẹp'],
            'romantic': ['lãng mạn', 'romantic', 'ấm cúng'],
            'riêng tư': ['riêng tư', 'private', 'kín đáo', 'yên tĩnh'],
            
            // Mood
            'chill': ['chill', 'thư giãn', 'relax', 'yên tĩnh'],
            'yên tĩnh': ['yên tĩnh', 'quiet', 'peaceful', 'chill'],
            'sôi động': ['sôi động', 'lively', 'vui vẻ', 'náo nhiệt'],
            
            // Visual
            'view đẹp': ['view đẹp', 'scenic', 'cảnh đẹp', 'sống ảo'],
            'sống ảo': ['sống ảo', 'instagram', 'aesthetic', 'đẹp'],
            
            // Social
            'gia đình': ['gia đình', 'family-friendly', 'thân thiện'],
            'bạn bè': ['bạn bè', 'nhóm', 'tụ tập'],
            
            // Study/Work
            'học bài': ['yên tĩnh', 'study-friendly', 'wifi', 'ổ điện'],
            'làm việc': ['work-friendly', 'wifi', 'yên tĩnh', 'ổ điện']
        };
    }

    /**
     * Classify query intent
     * @param {string} query 
     * @returns {Object} { intent, keyword, tags, mustQuery }
     */
    classify(query) {
        const queryLower = query.toLowerCase().trim();

        // Priority 1: FOOD_ENTITY (cao nhất)
        const foodKeyword = this.detectKeyword(queryLower, this.foodKeywords);
        if (foodKeyword) {
            const mustQuery = this.buildFoodMustQuery(foodKeyword);
            logger.info(`🍜 Intent: FOOD_ENTITY - "${foodKeyword}"`);
            return {
                intent: 'FOOD_ENTITY',
                keyword: foodKeyword,
                tags: null,
                mustQuery
            };
        }

        // Priority 2: ACTIVITY
        const activityKeyword = this.detectKeyword(queryLower, this.activityKeywords);
        if (activityKeyword) {
            const tags = [activityKeyword];
            logger.info(`🎵 Intent: ACTIVITY - "${activityKeyword}"`);
            return {
                intent: 'ACTIVITY',
                keyword: activityKeyword,
                tags,
                mustQuery: null // Will use tag filter
            };
        }

        // Priority 3: PLACE_VIBE
        const vibeKeyword = this.detectKeyword(queryLower, this.vibeKeywords);
        if (vibeKeyword) {
            const tags = this.vibeToTagsMap[vibeKeyword] || [vibeKeyword];
            logger.info(`💕 Intent: PLACE_VIBE - "${vibeKeyword}" → tags: ${tags.join(', ')}`);
            return {
                intent: 'PLACE_VIBE',
                keyword: vibeKeyword,
                tags,
                mustQuery: null // Will use tag filter
            };
        }

        // Default: GENERAL
        logger.info(`🔍 Intent: GENERAL - No specific intent detected`);
        return {
            intent: 'GENERAL',
            keyword: null,
            tags: null,
            mustQuery: null
        };
    }

    /**
     * Detect keyword từ list (longest match first)
     * @param {string} query 
     * @param {string[]} keywords 
     * @returns {string|null}
     */
    detectKeyword(query, keywords) {
        // Sort by length (longest first) để "bún chả" match trước "bún"
        const sorted = [...keywords].sort((a, b) => b.length - a.length);

        for (const keyword of sorted) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(query)) {
                return keyword;
            }
        }

        return null;
    }

    /**
     * Build MongoDB hard filter cho FOOD_ENTITY
     * @param {string} keyword 
     * @returns {Object}
     */
    buildFoodMustQuery(keyword) {
        const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${safeKeyword}\\b`, 'i');

        return {
            $or: [
                { name: regex },
                { address: regex },
                { description: regex },
                { category: regex },
                { 'aiTags.space': regex },
                { 'aiTags.mood': regex },
                { 'aiTags.suitability': regex },
                { 'ai.reviewsText': regex },
            ]
        };
    }

    /**
     * Build MongoDB filter cho PLACE_VIBE
     * @param {string[]} tags 
     * @returns {Object}
     */
    buildVibeQuery(tags) {
        if (!tags || tags.length === 0) return null;

        // Tìm trong aiTags (space, mood, suitability) hoặc description
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

    /**
     * Check if query is short and specific (để bật hard filter)
     * @param {string} query 
     * @returns {boolean}
     */
    isShortQuery(query) {
        return query.length < 60;
    }
}

export default new IntentClassifier();
