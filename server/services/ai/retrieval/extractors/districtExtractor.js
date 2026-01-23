/**
 * District Extractor - Detect quận/huyện và build hard filter
 * Mục đích: Khi user hỏi địa điểm theo quận ("ở Đống Đa", "quận Ba Đình"...),
 *           chỉ trả về places ĐÚNG quận đó (hard filter)
 * 
 * Logic:
 * 1. Rule-based matching: Detect district patterns từ query
 * 2. Normalize: "q đống đa", "q.đống đa", "quận đống đa" → "Đống Đa"
 * 3. Return MongoDB filter: { district: "Đống Đa" }
 */

import logger from '../../utils/logger.js';

class DistrictExtractor {
    constructor() {
        // Danh sách các quận/huyện Hà Nội (chuẩn từ DB)
        this.districts = [
            'Ba Đình',
            'Hoàn Kiếm',
            'Tây Hồ',
            'Long Biên',
            'Cầu Giấy',
            'Đống Đa',
            'Thanh Xuân',
            'Nam Từ Liêm',
            'Bắc Từ Liêm',
            'Hà Đông',
            'Hoàng Mai',
            'Hai Bà Trưng'
        ];

        // Mapping variants → canonical name
        this.districtVariants = {
            // Ba Đình
            'ba dinh': 'Ba Đình',
            'ba đình': 'Ba Đình',
            'ba dình': 'Ba Đình',
            'q ba dinh': 'Ba Đình',
            'q.ba dinh': 'Ba Đình',
            'quan ba dinh': 'Ba Đình',
            'quận ba đình': 'Ba Đình',

            // Hoàn Kiếm
            'hoan kiem': 'Hoàn Kiếm',
            'hoàn kiếm': 'Hoàn Kiếm',
            'hoan kíem': 'Hoàn Kiếm',
            'q hoan kiem': 'Hoàn Kiếm',
            'quận hoàn kiếm': 'Hoàn Kiếm',

            // Tây Hồ
            'tay ho': 'Tây Hồ',
            'tây hồ': 'Tây Hồ',
            'tây ho': 'Tây Hồ',
            'q tay ho': 'Tây Hồ',
            'quận tây hồ': 'Tây Hồ',

            // Long Biên
            'long bien': 'Long Biên',
            'long biên': 'Long Biên',
            'q long bien': 'Long Biên',
            'quận long biên': 'Long Biên',

            // Cầu Giấy
            'cau giay': 'Cầu Giấy',
            'cầu giấy': 'Cầu Giấy',
            'cầu giay': 'Cầu Giấy',
            'q cau giay': 'Cầu Giấy',
            'quận cầu giấy': 'Cầu Giấy',

            // Đống Đa
            'dong da': 'Đống Đa',
            'đống đa': 'Đống Đa',
            'đống da': 'Đống Đa',
            'dong đa': 'Đống Đa',
            'q dong da': 'Đống Đa',
            'q.dong da': 'Đống Đa',
            'quan dong da': 'Đống Đa',
            'quận đống đa': 'Đống Đa',
            'q đống đa': 'Đống Đa',
            'q. đống đa': 'Đống Đa',

            // Thanh Xuân
            'thanh xuan': 'Thanh Xuân',
            'thanh xuân': 'Thanh Xuân',
            'q thanh xuan': 'Thanh Xuân',
            'quận thanh xuân': 'Thanh Xuân',

            // Nam Từ Liêm
            'nam tu liem': 'Nam Từ Liêm',
            'nam từ liêm': 'Nam Từ Liêm',
            'nam tử liêm': 'Nam Từ Liêm',
            'q nam tu liem': 'Nam Từ Liêm',
            'quận nam từ liêm': 'Nam Từ Liêm',

            // Bắc Từ Liêm
            'bac tu liem': 'Bắc Từ Liêm',
            'bắc từ liêm': 'Bắc Từ Liêm',
            'bắc tử liêm': 'Bắc Từ Liêm',
            'q bac tu liem': 'Bắc Từ Liêm',
            'quận bắc từ liêm': 'Bắc Từ Liêm',

            // Hà Đông
            'ha dong': 'Hà Đông',
            'hà đông': 'Hà Đông',
            'ha đông': 'Hà Đông',
            'q ha dong': 'Hà Đông',
            'quận hà đông': 'Hà Đông',

            // Hoàng Mai
            'hoang mai': 'Hoàng Mai',
            'hoàng mai': 'Hoàng Mai',
            'q hoang mai': 'Hoàng Mai',
            'quận hoàng mai': 'Hoàng Mai',

            // Hai Bà Trưng
            'hai ba trung': 'Hai Bà Trưng',
            'hai bà trưng': 'Hai Bà Trưng',
            'hai ba trưng': 'Hai Bà Trưng',
            'q hai ba trung': 'Hai Bà Trưng',
            'quận hai bà trưng': 'Hai Bà Trưng'
        };

        // Pattern để detect "ở [district]", "tại [district]", "quận [district]"
        this.locationPatterns = [
            /(?:ở|tại|quận|q\.|q)\s*([a-zà-ỹ\s]+)/gi,
            /([a-zà-ỹ\s]+)\s*(?:quận|q\.|q)/gi
        ];
    }

    /**
     * Detect quận/huyện từ query
     * @param {string} query - Câu hỏi của user
     * @returns {string|null} - District name (canonical) hoặc null
     */
    detectDistrict(query) {
        if (!query || typeof query !== 'string') return null;

        const queryLower = query.toLowerCase().trim();

        // Strategy 1: Check exact match với variants (dài nhất trước)
        const sortedVariants = Object.keys(this.districtVariants)
            .sort((a, b) => b.length - a.length);

        for (const variant of sortedVariants) {
            // Tạo regex pattern với word boundary để tránh false match
            const regex = new RegExp(`\\b${variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (regex.test(queryLower)) {
                const district = this.districtVariants[variant];
                logger.info(`📍 District detected (variant match): "${variant}" → "${district}"`);
                return district;
            }
        }

        // Strategy 2: Check với location patterns (ở X, tại X, quận X)
        for (const pattern of this.locationPatterns) {
            pattern.lastIndex = 0; // Reset regex
            const match = pattern.exec(queryLower);
            if (match) {
                const potentialDistrict = match[1].trim();
                // Check xem có match với variant không
                if (this.districtVariants[potentialDistrict]) {
                    const district = this.districtVariants[potentialDistrict];
                    logger.info(`📍 District detected (pattern match): "${potentialDistrict}" → "${district}"`);
                    return district;
                }
            }
        }

        // Strategy 3: Fuzzy match với canonical names
        for (const district of this.districts) {
            const districtLower = district.toLowerCase();
            const districtNormalized = this.removeVietnameseTones(districtLower);
            const queryNormalized = this.removeVietnameseTones(queryLower);

            if (queryNormalized.includes(districtNormalized)) {
                logger.info(`📍 District detected (fuzzy match): "${district}"`);
                return district;
            }
        }

        logger.info('📍 No district detected in query');
        return null;
    }

    /**
     * Build MongoDB hard filter query
     * @param {string} district - Quận/huyện (vd: "Đống Đa")
     * @returns {Object} - MongoDB query object
     */
    buildDistrictMustQuery(district) {
        if (!district) return null;

        // Hard filter: PHẢI match đúng quận
        const filter = { district: district };

        logger.info(`🔒 Hard filter applied: district = "${district}"`);
        return filter;
    }

    /**
     * Remove Vietnamese tones for fuzzy matching
     * @param {string} str - Input string
     * @returns {string} - String without tones
     */
    removeVietnameseTones(str) {
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D');
    }

    /**
     * Validate if district is in the valid list
     * @param {string} district - District name
     * @returns {boolean}
     */
    isValidDistrict(district) {
        return this.districts.includes(district);
    }

    /**
     * Get all valid districts
     * @returns {Array<string>}
     */
    getAllDistricts() {
        return [...this.districts];
    }
}

export default new DistrictExtractor();
