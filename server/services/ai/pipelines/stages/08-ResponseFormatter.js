/**
 * Stage 8: Response Formatter
 * Nhiệm vụ: Format final response với places, sources, metadata
 */

import config from '../../config/index.js';
import logger from '../../utils/logger.js';

class ResponseFormatter {
    /**
     * Extract place names mentioned in AI answer
     * @param {string} answer - AI generated answer
     * @param {Array} retrievedDocs - All retrieved documents
     * @returns {Array} - Ordered place names as mentioned in answer
     */
    extractPlaceNamesFromAnswer(answer, retrievedDocs) {
        if (!answer || !retrievedDocs) return [];

        const placeNames = retrievedDocs.map(doc => doc.metadata?.name).filter(Boolean);
        const mentionedPlaces = [];
        
        // Find all place names mentioned in the answer (preserve order)
        for (const placeName of placeNames) {
            // Check if place name appears in answer (case-insensitive)
            // Use word boundary to avoid partial matches
            const regex = new RegExp(`\\b${placeName.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&')}`, 'i');
            if (regex.test(answer)) {
                // Find position of first mention
                const match = answer.match(regex);
                if (match && !mentionedPlaces.some(p => p.name === placeName)) {
                    mentionedPlaces.push({
                        name: placeName,
                        position: match.index
                    });
                }
            }
        }
        
        // Sort by position (order of mention)
        mentionedPlaces.sort((a, b) => a.position - b.position);
        
        logger.info(`\n🔍 ===== PLACE EXTRACTION FROM ANSWER =====`);
        logger.info(`🔍 Total places in retrievedDocs: ${placeNames.length}`);
        logger.info(`🔍 Places mentioned in answer: ${mentionedPlaces.length}`);
        mentionedPlaces.forEach((p, i) => {
            logger.info(`   [${i}] ${p.name} (pos: ${p.position})`);
        });
        logger.info(`🔍 ==========================================\n`);
        
        return mentionedPlaces.map(p => p.name);
    }

    /**
     * Format final response for client
     */
    formatResponse(result) {
        // STEP 1: Extract place names mentioned in AI answer
        const mentionedPlaceNames = this.extractPlaceNamesFromAnswer(
            result.answer, 
            result.retrievedDocs
        );

        // STEP 2: Build places map from retrievedDocs
        const placesMap = new Map();
        if (result.retrievedDocs) {
            result.retrievedDocs.forEach(doc => {
                const placeId = doc.metadata?.originalId || doc.metadata?.id;
                const placeName = doc.metadata?.name;
                if (placeId && placeName && !placesMap.has(placeId)) {
                    placesMap.set(placeId, {
                        _id: placeId,
                        name: placeName,
                        address: doc.metadata.address,
                        category: doc.metadata.category,
                        priceRange: { max: doc.metadata.price || 0 },
                        averageRating: doc.metadata.rating,
                        totalReviews: doc.metadata.reviewCount,
                        images: [doc.metadata.image],
                        aiTags: {
                            space: doc.metadata.space ? doc.metadata.space.split(', ') : [],
                            specialFeatures: doc.metadata.specialFeatures ? doc.metadata.specialFeatures.split(', ') : []
                        },
                        distanceKm: doc.distanceKm
                    });
                }
            });
        }

        // STEP 3: Reorder places by AI answer mention order
        const orderedPlaces = [];
        const usedIds = new Set();

        // Add places in order of mention in AI answer
        for (const placeName of mentionedPlaceNames) {
            for (const [placeId, place] of placesMap.entries()) {
                if (place.name === placeName && !usedIds.has(placeId)) {
                    orderedPlaces.push(place);
                    usedIds.add(placeId);
                    break;
                }
            }
        }

        // Add remaining places (not mentioned but high ranked)
        for (const [placeId, place] of placesMap.entries()) {
            if (!usedIds.has(placeId) && orderedPlaces.length < 10) {
                orderedPlaces.push(place);
                usedIds.add(placeId);
            }
        }

        // Limit to top 10
        const placesArray = orderedPlaces.slice(0, 10);

        // 🔍 DEBUG: Log places order before return
        logger.info(`\n📊 ===== FINAL RESPONSE DEBUG =====`);
        logger.info(`📊 Places array length: ${placesArray.length}`);
        logger.info(`📊 Places order in response.places:`);
        placesArray.forEach((place, i) => {
            logger.info(`   [${i}] → RANK #${i + 1}: ${place.name}`);
        });
        logger.info(`📊 =================================\n`);

        return {
            question: result.question,
            answer: result.answer,
            context: result.context,
            cached: result.cached,
            places: placesArray,
            sources: result.retrievedDocs?.map((doc) => ({
                content: doc.content,
                source: doc.source,
                score: doc.score,
                metadata: doc.metadata
            })) || [],
            intent: result.intent,
            structuredData: result.structuredData,
            _meta: {
                model: config.openai.model,
            }
        };
    }
}

export default new ResponseFormatter();
