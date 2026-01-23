/**
 * Keyword Search Strategy
 * Nhiệm vụ: Tìm kiếm theo keyword, food entity, vibe
 */

import { searchPlaces, searchPlacesByVibe } from '../../../../placeService.js';
import logger from '../../../utils/logger.js';

const SEARCH_TIMEOUT_MS = 1000;

class KeywordSearchStrategy {
    /**
     * Search by keyword based on query intent
     */
    async search(input, categoryFilter, priceFilter, textLimit = 5) {
        const queryIntent = input.queryIntent || 'GENERAL';
        const isDatingMode = input.isDatingQuery || false;
        const datingExcludeFilter = input.mustExcludeQuery || null;
        const districtFilter = input.districtMustQuery || null;
        
        if (isDatingMode) {
            logger.info(`💕💕💕 DATING MODE ACTIVE - Will exclude accommodation/buffet from results`);
        }

        let searchPromise;
        
        if (queryIntent === 'FOOD_ENTITY') {
            searchPromise = searchPlaces(
                input.refinedQuery || input.question, 
                textLimit, 
                categoryFilter, 
                priceFilter, 
                input.queryMustQuery,
                districtFilter // 📍 Pass district filter
            );
        } else if (queryIntent === 'PLACE_VIBE' || queryIntent === 'ACTIVITY') {
            const tags = input.queryTags || [];
            // 💕 Pass dating exclude filter to searchPlacesByVibe
            searchPromise = searchPlacesByVibe(
                tags, 
                textLimit, 
                categoryFilter, 
                priceFilter, 
                datingExcludeFilter,
                districtFilter // 📍 Pass district filter
            );
        } else {
            searchPromise = searchPlaces(
                input.refinedQuery || input.question, 
                textLimit, 
                categoryFilter, 
                priceFilter,
                null, // no food must query
                districtFilter // 📍 Pass district filter
            );
        }

        return this.withTimeout(searchPromise).catch(err => {
            logger.warn('⚠️ Keyword search failed/timed out', err);
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

export default new KeywordSearchStrategy();
