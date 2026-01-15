/**
 * Food Keyword Extractor - Detect món ăn và build hard filter
 * Mục đích: Khi user hỏi món ăn cụ thể ("phở", "bún chả"...), 
 *           chỉ trả về places có keyword đó trong name/tags/description/reviews
 */

import logger from '../../utils/logger.js';

class FoodKeywordExtractor {
    constructor() {
        // Danh sách các món ăn phổ biến Hà Nội
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

        // Stop words để loại bỏ (không phải món ăn)
        this.stopWords = [
            'quán', 'nhà hàng', 'ở đâu', 'nào', 'ngon', 'rẻ', 'gần', 'tốt',
            'đẹp', 'sạch', 'nổi tiếng', 'giá', 'khoảng', 'tầm', 'với', 'có',
            'không', 'ạ', 'nhé', 'nha', 'đi', 'ăn', 'uống', 'chơi', 'tìm'
        ];
    }

    /**
     * Detect món ăn từ query
     * @param {string} query - Câu hỏi của user
     * @returns {string|null} - Keyword món ăn hoặc null
     */
    detectFoodKeyword(query) {
        const queryLower = query.toLowerCase().trim();

        // Tìm món ăn dài nhất trước (ví dụ: "bún chả" trước "bún")
        const sortedKeywords = [...this.foodKeywords].sort((a, b) => b.length - a.length);

        for (const keyword of sortedKeywords) {
            // Check if keyword is a whole word or phrase
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(queryLower)) {
                logger.info(`🍜 Food keyword detected: "${keyword}"`);
                return keyword;
            }
        }

        return null;
    }

    /**
     * Build MongoDB hard filter query
     * @param {string} keyword - Món ăn (vd: "phở")
     * @returns {Object} - MongoDB query object
     */
    buildFoodMustQuery(keyword) {
        // Escape regex special characters
        const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${safeKeyword}\\b`, 'i');

        // Hard filter: PHẢI chứa keyword trong 1 trong các fields
        const mustQuery = {
            $or: [
                { name: regex },
                { address: regex },
                { description: regex },
                { category: regex },
                // Semantic tags (nếu là array)
                { 'aiTags.space': regex },
                { 'aiTags.mood': regex },
                { 'aiTags.suitability': regex },
                // Reviews aggregated text (nếu có)
                { 'ai.reviewsText': regex },
            ]
        };

        logger.info(`🔒 MongoDB hard filter built:`, mustQuery);
        return mustQuery;
    }

    /**
     * Check if query is a food-specific query
     * @param {string} query 
     * @returns {boolean}
     */
    isFoodQuery(query) {
        const keyword = this.detectFoodKeyword(query);
        
        // Chỉ bật food mode nếu:
        // 1. Có detect được món ăn
        // 2. Câu query ngắn (< 50 ký tự) - tránh query dạng "lịch trình ăn phở bún chả"
        if (keyword && query.length < 50) {
            return true;
        }

        return false;
    }

    /**
     * Main extraction function
     * @param {string} query 
     * @returns {Object} { isFoodQuery, keyword, mustQuery }
     */
    extract(query) {
        const keyword = this.detectFoodKeyword(query);
        const isFoodQuery = this.isFoodQuery(query);

        if (!isFoodQuery || !keyword) {
            return {
                isFoodQuery: false,
                keyword: null,
                mustQuery: null
            };
        }

        const mustQuery = this.buildFoodMustQuery(keyword);

        return {
            isFoodQuery: true,
            keyword,
            mustQuery
        };
    }
}

export default new FoodKeywordExtractor();
