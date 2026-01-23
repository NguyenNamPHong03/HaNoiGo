/**
 * Stage 4: Hybrid Search Engine
 * Nhiệm vụ: Kết hợp nhiều chiến lược tìm kiếm (Nearby, Keyword, Address Regex)
 */

import { ACCOMMODATION_KEYWORDS, LUXURY_KEYWORDS } from '../../config/keywords.js';
import telemetry from '../../core/telemetry.js';
import logger from '../../utils/logger.js';
import addressRegexStrategy from './retrieval/AddressRegexStrategy.js';
import keywordSearchStrategy from './retrieval/KeywordSearchStrategy.js';
import nearbySearchStrategy from './retrieval/NearbySearchStrategy.js';

class HybridSearchEngine {
    /**
     * STAGE 7: Hybrid/Keyword Augmentation
     */
    async augmentWithKeywords(input) {
        if (input.cached) return input;

        return await telemetry.measureTime('KEYWORD_AUGMENT', async () => {
            let query = (input.refinedQuery || input.question).toLowerCase().trim();

            // Check for special modes
            const needsAccommodation = ACCOMMODATION_KEYWORDS.some(kw => query.includes(kw));
            const needsLuxury = LUXURY_KEYWORDS.some(kw => query.includes(kw));
            let categoryFilter = null;
            let priceFilter = null;

            if (needsAccommodation) {
                input.accommodationMode = true;
                categoryFilter = 'Lưu trú';
                if (needsLuxury) {
                    input.luxuryMode = true;
                    input.minPrice = 500000;
                    priceFilter = 500000;
                }
            }

            const promises = [];
            const textLimit = input.intent === 'ITINERARY' ? 20 : 5;
            const queryIntent = input.queryIntent || 'GENERAL';
            const districtFilter = input.districtMustQuery || null; // 📍 Get district filter
            
            // 🔥 PRIORITY CHECK: If nearMe mode is active, ONLY use nearby search
            const isNearMeMode = input.context?.useLocation && input.context?.location?.lat && input.context?.location?.lng;

            if (isNearMeMode) {
                const { lat, lng } = input.context.location;
                promises.push(
                    nearbySearchStrategy.search(lat, lng, query, categoryFilter, priceFilter, districtFilter) // 📍 Pass district
                );
            } else {
                // NORMAL MODE: Use semantic + keyword search
                promises.push(
                    keywordSearchStrategy.search(input, categoryFilter, priceFilter, textLimit)
                );
            }

            // 2. Address Regex Search (Parallel)
            promises.push(
                addressRegexStrategy.search(query, categoryFilter, priceFilter, input.queryMustQuery, districtFilter) // 📍 Pass district
            );

            // Wait for all searches
            const results = await Promise.all(promises);
            const places = results.flat();

            if (!places || places.length === 0) return input;

            logger.info(`🔍 Hybrid search found ${places.length} results (merged)`);

            // Convert to retrievedDocs format
            const mongoDocs = this.convertToRetrievedDocs(places);

            // Deduplicate with existing semantic results
            const combined = this.deduplicateResults(input.retrievedDocs || [], mongoDocs);

            logger.info(`✅ Final retrievedDocs count: ${combined.length} (semantic: ${input.retrievedDocs?.length || 0}, nearby: ${mongoDocs.length})`);

            // � POST-FILTER: If district constraint, remove places from other districts
            let filtered = this.applyDistrictFilter(input, combined);
            
            // 💕 POST-FILTER: If dating query, remove unwanted places
            filtered = this.applyDatingFilter(input, filtered);

            return {
                ...input,
                retrievedDocs: filtered
            };
        });
    }

    /**
     * Convert MongoDB places to retrievedDocs format
     */
    convertToRetrievedDocs(places) {
        return places.map(p => ({
            pageContent: `${p.name} - ${p.address}\n${p.description}\nCategory: ${p.category}`,
            metadata: {
                id: p._id.toString(),
                name: p.name,
                address: p.address,
                image: p.images?.[0] || '',
                category: p.category,
                price: p.priceRange?.min || 0,
                rating: p.averageRating || 0,
                reviewCount: p.totalReviews || 0,
                source: 'mongo-hybrid',
                coordinates: p.location?.coordinates || null,
                space: p.aiTags?.space?.join(', ') || '',
                specialFeatures: p.aiTags?.specialFeatures?.join(', ') || ''
            }
        }));
    }

    /**
     * Deduplicate results
     */
    deduplicateResults(existingDocs, newDocs) {
        const combined = [...existingDocs];
        const existingIds = new Set(combined.map(d => d.metadata?.id));

        for (const doc of newDocs) {
            if (!existingIds.has(doc.metadata.id)) {
                combined.push(doc);
                existingIds.add(doc.metadata.id);
            }
        }

        return combined;
    }

    /**
     * Apply district hard filter (POST-FILTER for semantic results)
     */
    applyDistrictFilter(input, docs) {
        const targetDistrict = input.queryDistrict || null;
        
        if (!targetDistrict || docs.length === 0) {
            return docs;
        }

        const filtered = docs.filter(doc => {
            const docDistrict = doc.metadata?.district || null;
            
            // Hard match on district field
            if (docDistrict === targetDistrict) {
                return true;
            }
            
            // Fallback: check if address contains district name
            if (!docDistrict) {
                const address = doc.metadata?.address || doc.address || '';
                return address.includes(targetDistrict);
            }
            
            return false;
        });

        logger.info(`📍 District filter: ${docs.length} → ${filtered.length} places (${targetDistrict})`);

        return filtered;
    }

    /**
     * Apply dating mode filter
     */
    applyDatingFilter(input, docs) {
        const isDatingMode = input.isDatingQuery || false;
        
        if (!isDatingMode || docs.length === 0) {
            return docs;
        }

        const excludePatterns = [
            /buffet/i, /nhậu/i, /bia hơi/i, /xiên/i, 
            /nem nướng/i, /bún đậu/i, /ốc/i, /vỉa hè/i,
            /nhà nghỉ/i, /khách sạn/i, /hotel/i, /motel/i
        ];
        
        const filtered = docs.filter(doc => {
            const name = doc.metadata?.name || doc.name || '';
            const desc = doc.pageContent || doc.metadata?.description || '';
            const category = doc.metadata?.category || '';
            
            // Exclude if category is "Lưu trú"
            if (category === 'Lưu trú') {
                logger.warn(`💕 POST-FILTER: Removed accommodation "${name}"`);
                return false;
            }
            
            // Exclude if name/description contains negative keywords
            for (const pattern of excludePatterns) {
                if (pattern.test(name) || pattern.test(desc)) {
                    logger.warn(`💕 POST-FILTER: Removed "${name}" (matched ${pattern})`);
                    return false;
                }
            }
            
            return true;
        });
        
        logger.info(`💕 POST-FILTER: ${docs.length} → ${filtered.length} places (removed ${docs.length - filtered.length} unwanted)`);
        
        return filtered;
    }
}

export default new HybridSearchEngine();
