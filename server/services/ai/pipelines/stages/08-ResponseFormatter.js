/**
 * Stage 8: Response Formatter
 * Nhiệm vụ: Format final response với places, sources, metadata
 */

import config from '../../config/index.js';
import logger from '../../utils/logger.js';

class ResponseFormatter {
    /**
     * Format final response for client
     */
    formatResponse(result) {
        // Deduplicate and process places for UI - LIMIT TO TOP 8
        const uniquePlacesMap = new Map();
        if (result.retrievedDocs) {
            // GIỚI HẠN CHỈ LẤY TOP 8 QUÁN
            const limitedDocs = result.retrievedDocs.slice(0, 8);
            limitedDocs.forEach(doc => {
                const placeId = doc.metadata?.originalId || doc.metadata?.id;
                if (placeId && !uniquePlacesMap.has(placeId)) {
                    uniquePlacesMap.set(placeId, {
                        _id: placeId,
                        name: doc.metadata.name,
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
                        distanceKm: doc.distanceKm // Preserve distance from stageLocationSort
                    });
                }
            });
        }

        // 🔍 DEBUG: Log places order before return
        const placesArray = Array.from(uniquePlacesMap.values()).slice(0, 8);
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
