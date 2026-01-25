/**
 * District Filter Module
 * Handles geographic filtering based on district/location
 * 
 * @module retrieval/filters/DistrictFilter
 * @requires utils/enhancedLogger
 * 
 * @example
 * import DistrictFilter from './DistrictFilter.js';
 * const filtered = DistrictFilter.apply(docs, 'Ba Đình');
 * 
 * @description
 * Provides district-based filtering for search results.
 * Supports both exact district match and address fallback.
 * 
 * @performance
 * - O(n) complexity where n = number of documents
 * - Synchronous operation (no async overhead)
 * - Lightweight filtering logic
 */

import enhancedLogger from '../../utils/enhancedLogger.js';

const logger = enhancedLogger.child('DistrictFilter');

/**
 * @class DistrictFilter
 * @classdesc Filters documents by district/location
 */
class DistrictFilter {
    /**
     * Apply district filter to documents
     * 
     * @param {Array<Object>} docs - Retrieved documents from search
     * @param {Object} docs[].metadata - Document metadata
     * @param {string} [docs[].metadata.district] - District field
     * @param {string} [docs[].metadata.address] - Address field (fallback)
     * @param {string|null} targetDistrict - Target district to filter by
     * 
     * @returns {Array<Object>} Filtered documents
     * 
     * @example
     * const docs = [
     *   { metadata: { district: 'Ba Đình', name: 'Cafe A' } },
     *   { metadata: { district: 'Hoàn Kiếm', name: 'Cafe B' } }
     * ];
     * const filtered = DistrictFilter.apply(docs, 'Ba Đình');
     * // Returns: [{ metadata: { district: 'Ba Đình', name: 'Cafe A' } }]
     */
    apply(docs, targetDistrict) {
        if (!targetDistrict || docs.length === 0) return docs;

        const filtered = docs.filter(doc => {
            const docDistrict = doc.metadata?.district || null;
            if (docDistrict === targetDistrict) return true;
            
            if (!docDistrict) {
                const address = doc.metadata?.address || doc.address || '';
                return address.includes(targetDistrict);
            }
            
            return false;
        });

        logger.info('District filter applied', {
            before: docs.length,
            after: filtered.length,
            district: targetDistrict
        });

        return filtered;
    }

    /**
     * Build MongoDB must query for district filtering
     * 
     * @param {string} district - Target district name
     * 
     * @returns {Object} MongoDB $or query object
     * 
     * @example
     * const query = DistrictFilter.buildMustQuery('Ba Đình');
     * // Returns: { $or: [{ district: 'Ba Đình' }, { address: { $regex: 'Ba Đình', $options: 'i' } }] }
     */
    buildMustQuery(district) {
        return {
            $or: [
                { district: district },
                { address: { $regex: district, $options: 'i' } }
            ]
        };
    }
}

export default new DistrictFilter();
