/**
 * Nearby Search Strategy
 * Nhiệm vụ: Tìm kiếm địa điểm trong bán kính (Near Me mode)
 */

import { searchNearbyPlaces } from '../../../../placeService.js';
import logger from '../../../utils/logger.js';

const SEARCH_TIMEOUT_MS = 1000;

class NearbySearchStrategy {
    /**
     * Search nearby places within radius
     */
    async search(lat, lng, query, categoryFilter, priceFilter, districtFilter = null) {
        logger.info(`📍 NEAR ME MODE ACTIVE - Searching within 30km (toàn Hà Nội)`);
        logger.info(`🚫 Skipping semantic/keyword search to ensure AI only recommends nearby places`);
        
        // Extract food keyword from query for flexible search
        const foodKeywords = ['phở', 'bún', 'bánh mì', 'cơm', 'chả cá', 'nem', 'lẩu', 'nướng', 'cafe', 'coffee', 'bún chả', 'bún bò', 'bún riêu'];
        let searchKeyword = query;
        
        // Extract food keyword if present (check longer keywords first)
        const sortedKeywords = foodKeywords.sort((a, b) => b.length - a.length);
        for (const keyword of sortedKeywords) {
            if (query.toLowerCase().includes(keyword)) {
                searchKeyword = keyword;
                logger.info(`🍜 Extracted food keyword: "${keyword}" from query "${query}"`);
                break;
            }
        }
        
        logger.info(`🔍 Searching nearby places with keyword: "${searchKeyword}"`);

        const nearbyPromise = searchNearbyPlaces(
            lat,
            lng,
            30, // 30km radius - cover toàn Hà Nội
            100, // Get 100 candidates, will pick top 5 closest after filtering
            { 
                category: categoryFilter, 
                minPrice: priceFilter,
                query: searchKeyword, // Use extracted keyword for flexible matching
                district: districtFilter?.district || null // 📍 Add district filter
            }
        );

        return this.withTimeout(nearbyPromise).catch(err => {
            logger.warn('⚠️ Nearby search failed', err);
            return [];
        });
    }

    /**
     * Wrap promise with timeout
     */
    withTimeout(promise, fallback = []) {
        return Promise.race([
            promise,
            new Promise(resolve => setTimeout(() => {
                resolve(fallback);
            }, SEARCH_TIMEOUT_MS))
        ]);
    }
}

export default new NearbySearchStrategy();
