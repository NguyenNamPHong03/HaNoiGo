/**
 * Stage 8: Response Formatter
 * Nhiệm vụ: Format final response với places, sources, metadata
 */

import config from '../../config/index.js';
import logger from '../../utils/logger.js';

import { sortPlacesByAnswerOrder, filterAndSortPlaces } from '../../utils/reorderUtils.js';

class ResponseFormatter {
    /**
     * Format final response for client
     */
    formatResponse(result) {
        // 🧹 CLEANUP: Remove appended context list if present (Itinerary only)
        // Does this BEFORE generating cards to ensure cards match the final text exactly.
        let finalAnswer = result.answer;
        if (result.intent === 'ITINERARY') {
            // Regex to match separators or introductory phrases for reference lists
            // Matches:
            // 1. "---" or "___" (separator lines)
            // 2. "Dưới đây là danh sách" (Intro to list)
            // 3. "Địa điểm tham khảo" (Reference header)
            // 4. "Context:" or "Context list"
            const separatorRegex = /(\n\s*[-_]{3,}\s*\n)|(\n\s*(Dưới đây là danh sách|Địa điểm tham khảo|Danh sách địa điểm|Context list|Các địa điểm có trong|Danh sách context))/i;

            if (separatorRegex.test(finalAnswer)) {
                logger.info('✂️ Truncating itinerary reference list from answer...');
                finalAnswer = finalAnswer.split(separatorRegex)[0].trim();
            }
        }

        // STEP 1: Build initial places list from retrievedDocs
        // This ensures we have the full pool of potential places from the DB
        let availablePlaces = [];
        if (result.retrievedDocs) {
            const placesMap = new Map();
            result.retrievedDocs.forEach(doc => {
                const placeId = doc.metadata?.originalId || doc.metadata?.id;
                const placeName = doc.metadata?.name;

                // 🔧 FIX: Handle places with missing ID (e.g., Văn Miếu, Starlake)
                // Fallback to using NAME as unique key when ID is undefined
                const uniqueKey = placeId || placeName;

                if (placeName && !placesMap.has(uniqueKey)) {
                    placesMap.set(uniqueKey, {
                        _id: placeId || `temp-${placeName.replace(/\s+/g, '-').substring(0, 50)}`, // Generate temp ID if missing
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
                        distanceKm: doc.distanceKm,
                        _hasValidId: !!placeId // Track if this place has a real MongoDB ID
                    });
                }
            });
            availablePlaces = Array.from(placesMap.values());
        }

        // 🔍 DEBUG: Log places before filtering
        logger.info(`🔍 [ResponseFormatter] Available Places (Total: ${availablePlaces.length}):`);
        // availablePlaces.forEach(p => logger.debug(`   - ${p.name} (${p._id})`));

        // STEP 2: Sort and Filter places
        let placesArray = [];

        if (result.intent === 'ITINERARY') {
            // For Itinerary: STRICT filtering. Only show places mentioned in text.
            logger.info(`🔍 [ResponseFormatter] ITINERARY MODE - Filtering places...`);

            // Log the "search scope" logic for debugging
            const startMarker = '**1.';
            const startIndex = finalAnswer.indexOf(startMarker);
            logger.info(`   Search Start Marker "${startMarker}" found at index: ${startIndex}`);

            const matchedPlaces = filterAndSortPlaces(availablePlaces, finalAnswer);
            placesArray = matchedPlaces;

            // Log missing places
            const matchedIds = new Set(matchedPlaces.map(p => p._id));
            const missing = availablePlaces.filter(p => !matchedIds.has(p._id));
            if (missing.length > 0) {
                logger.info(`   ⚠️ ${missing.length} places NOT matched in answer:`);
                missing.forEach(p => logger.info(`      ❌ ${p.name}`));
            }
        } else {
            // For General Chat: Sort by mention, but include others as fallback (up to 10)
            const orderedPlaces = sortPlacesByAnswerOrder(availablePlaces, finalAnswer);
            placesArray = orderedPlaces.slice(0, 10);
        }

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
            answer: finalAnswer,
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
