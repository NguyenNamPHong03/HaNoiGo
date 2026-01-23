/**
 * Address Regex Search Strategy
 * Nhiệm vụ: Tìm kiếm địa điểm theo địa chỉ cụ thể (ngõ, ngách, phố)
 */

import { searchPlacesByRegex } from '../../../../placeService.js';
import { ADDRESS_MARKERS, STOP_WORDS } from '../../../config/keywords.js';
import logger from '../../../utils/logger.js';

const SEARCH_TIMEOUT_MS = 1000;

class AddressRegexStrategy {
    /**
     * Check if query has address markers
     */
    hasAddressMarker(query) {
        return ADDRESS_MARKERS.some(m => query.includes(m.key));
    }

    /**
     * Search by address regex
     */
    async search(query, categoryFilter, priceFilter, queryMustQuery = null, districtFilter = null) {
        if (!this.hasAddressMarker(query)) {
            return [];
        }

        const regexSearchPromise = (async () => {
            let addressPatternRaw = null;
            let prefixRegex = null;

            for (const marker of ADDRESS_MARKERS) {
                if (query.includes(marker.key)) {
                    const idx = query.indexOf(marker.key);
                    let afterMarker = query.substring(idx + marker.key.length).trim();
                    
                    // Heuristic to cut off stop words
                    for (const word of STOP_WORDS) {
                        const wIdx = afterMarker.toLowerCase().indexOf(word.toLowerCase());
                        if (wIdx !== -1) afterMarker = afterMarker.substring(0, wIdx).trim();
                    }
                    
                    if (afterMarker) {
                        addressPatternRaw = afterMarker;
                        prefixRegex = marker.regex;
                        break;
                    }
                }
            }

            if (addressPatternRaw && prefixRegex) {
                const safeSuffix = addressPatternRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const flexibleSuffix = safeSuffix.split(/\s+/).join('\\s+');
                const regex = new RegExp(`${prefixRegex}\\s+${flexibleSuffix}`, 'i');
                logger.info(`🎯 Address Regex detected: ${regex}`);
                
                return await searchPlacesByRegex(regex, 5, categoryFilter, priceFilter, queryMustQuery, districtFilter);
            }
            return [];
        })();

        return this.withTimeout(regexSearchPromise).catch(err => {
            logger.warn('⚠️ Regex search failed/timed out', err);
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

export default new AddressRegexStrategy();
