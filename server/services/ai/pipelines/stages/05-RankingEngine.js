/**
 * Stage 5: Ranking Engine
 * Nhiệm vụ: Rerank, filter, và sort kết quả tìm kiếm
 */

import { RAG_STAGES } from '../../config/constants.js';
import telemetry from '../../core/telemetry.js';
import reranker from '../../retrieval/reranker.js';
import logger from '../../utils/logger.js';

class RankingEngine {
    /**
     * STAGE 8: Reranking with Cohere
     */
    async rerank(input) {
        if (input.cached || !input.retrievedDocs?.length) return input;

        return await telemetry.measureTime(RAG_STAGES.RERANKING, async () => {
            const reranked = await reranker.rerank(
                input.question,
                input.retrievedDocs
            );
            return {
                ...input,
                retrievedDocs: reranked,
            };
        });
    }

    /**
     * STAGE 8.25: Dietary Filter (for vegetarian/vegan users)
     */
    async applyDietaryFilter(input) {
        if (input.cached || !input.retrievedDocs?.length) return input;

        // Only apply if dietaryAugment was set
        if (input.dietaryAugment !== 'chay') return input;

        logger.info('🥗 Applying vegetarian filter to retrieved docs...');

        const vegetarianNameKeywords = ['chay', 'chày', 'thuần chay', 'thuan chay', 'vegan'];

        const filtered = input.retrievedDocs.filter(doc => {
            const name = (doc.name || doc.metadata?.name || '').toLowerCase();
            
            // Only keep places with "chay" or similar in the NAME
            const isVegetarianPlace = vegetarianNameKeywords.some(kw => name.includes(kw));
            
            if (isVegetarianPlace) {
                logger.info(`✅ Keeping vegetarian place: ${name}`);
                return true;
            }
            
            return false;
        });

        logger.info(`🥗 Dietary filter: ${input.retrievedDocs.length} -> ${filtered.length} places`);

        return {
            ...input,
            retrievedDocs: filtered
        };
    }

    /**
     * STAGE 8.3: Location-based Sorting (when "Gần tôi" is enabled)
     */
    async sortByLocation(input) {
        if (input.cached || !input.retrievedDocs?.length) return input;

        // Only sort by distance if "Gần tôi" switch is ON
        if (!input.context?.useLocation || !input.context?.location) return input;

        const { lat, lng } = input.context.location;
        if (!lat || !lng) return input;

        logger.info(`📍 Sorting results by distance from user location...`);

        // Import haversine function
        const { haversineKm } = await import('../../utils/distanceUtils.js');

        // Calculate distance for each doc and sort
        const docsWithDistance = input.retrievedDocs.map(doc => {
            const coords = doc.metadata?.coordinates;
            let distance = null;

            if (coords && coords.length === 2) {
                // GeoJSON format: [longitude, latitude]
                const [placeLng, placeLat] = coords;
                distance = haversineKm(lat, lng, placeLat, placeLng);
            }

            return {
                ...doc,
                distanceKm: distance !== null ? Math.round(distance * 100) / 100 : null
            };
        });

        // Sort by distance (null distances go to end)
        const sorted = docsWithDistance.sort((a, b) => {
            if (a.distanceKm == null && b.distanceKm == null) return 0;
            if (a.distanceKm == null) return 1;
            if (b.distanceKm == null) return -1;
            return a.distanceKm - b.distanceKm;
        });

        // Limit to top 5 nearest places
        const top5Nearest = sorted.slice(0, 5);

        const closestPlace = top5Nearest[0];
        if (closestPlace?.distanceKm !== null) {
            logger.info(`📍 Closest place: ${closestPlace.metadata?.name || 'Unknown'} (${closestPlace.distanceKm}km)`);
            logger.info(`📍 Showing top ${top5Nearest.length} nearest places`);
        }

        return {
            ...input,
            retrievedDocs: top5Nearest
        };
    }

    /**
     * STAGE 8.5: Local Reordering (Keyword Boost) - CURRENTLY DISABLED
     */
    async localReorder(input) {
        if (input.cached || !input.retrievedDocs?.length) return input;

        const queryLower = input.question.toLowerCase().normalize('NFC');
        const scoreDoc = (doc) => {
            const name = (doc.name || doc.metadata?.name || '').toLowerCase();
            const address = (doc.metadata?.address || '').toLowerCase();
            let score = 0;

            if (name.includes(queryLower)) score += 10;

            const queryParts = queryLower.split(' ').filter(p => p.length > 1);
            const nameMatches = queryParts.filter(p => name.includes(p)).length;
            score += nameMatches * 0.5;

            const normalizedAddress = address.replace(/ng\./g, 'ngõ').replace(/p\./g, 'phường').replace(/q\./g, 'quận');
            const normalizedQuery = queryLower.replace(/ng\./g, 'ngõ').replace(/p\./g, 'phường').replace(/q\./g, 'quận');

            if (normalizedAddress.includes(normalizedQuery)) {
                score += 8;
            } else {
                const addressMatches = queryParts.filter(p => normalizedAddress.includes(p)).length;
                if (addressMatches >= 2) {
                    score += addressMatches * 1.5;
                }
            }
            return score;
        };

        const reordered = [...input.retrievedDocs].sort((a, b) => {
            const scoreA = scoreDoc(a);
            const scoreB = scoreDoc(b);
            if (Math.abs(scoreA - scoreB) > 0.1) {
                return scoreB - scoreA;
            }
            return 0;
        });

        return {
            ...input,
            retrievedDocs: reordered,
        };
    }
}

export default new RankingEngine();
