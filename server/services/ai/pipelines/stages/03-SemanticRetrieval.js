/**
 * Stage 3: Semantic Retrieval
 * Nhiệm vụ: Tìm kiếm semantic từ Pinecone Vector DB
 */

import { RAG_STAGES } from '../../config/constants.js';
import { GENERIC_FOOD_KEYWORDS, SPECIFIC_FOOD_KEYWORDS, VEGETARIAN_KEYWORDS } from '../../config/keywords.js';
import telemetry from '../../core/telemetry.js';
import basicRetriever from '../../retrieval/strategies/basicRetriever.js';
import logger from '../../utils/logger.js';

class SemanticRetrieval {
    /**
     * STAGE 6: Retrieval from Vector DB
     */
    async retrieve(input) {
        if (input.cached) return input;

        // 🔥 SKIP semantic retrieval if nearMe mode is active
        // Stage 7 (KeywordAugment) will handle nearby search exclusively
        const isNearMeMode = input.context?.useLocation && input.context?.location?.lat && input.context?.location?.lng;
        
        if (isNearMeMode) {
            logger.info('📍 NEAR ME MODE: Skipping semantic retrieval (will use nearby search only)');
            return {
                ...input,
                retrievedDocs: [], // Empty - will be populated by Stage 7
            };
        }

        // 🗓️ SPECIAL CASE: ITINERARY - Multi-query retrieval
        if (input.intent === 'ITINERARY') {
            logger.info('📅 ITINERARY MODE: Using multi-query retrieval for diverse places');
            return await this.retrieveForItinerary(input);
        }

        return await telemetry.measureTime(RAG_STAGES.RETRIEVAL, async () => {
            let queryToUse = input.refinedQuery || input.question;
            const queryLower = queryToUse.toLowerCase();

            // Only apply dietary filtering if Personalization is ENABLED
            const shouldIncludePersonalization = !!input.context?.usePersonalization;
            const userPreferences = input.context?.userPreferences || input.userPreferences || null;
            const userDietary = userPreferences?.dietary || [];

            console.log('🍽️ DIETARY FILTER DEBUG:', {
                shouldIncludePersonalization,
                hasUserPreferences: !!userPreferences,
                userDietary,
                queryLower: queryLower.substring(0, 50)
            });

            if (shouldIncludePersonalization && userDietary.length > 0) {
                const isVegetarian = userDietary.some(d => VEGETARIAN_KEYWORDS.includes(d.toLowerCase()));
                const isSpecificFoodQuery = SPECIFIC_FOOD_KEYWORDS.some(kw => queryLower.includes(kw));
                const isGenericFoodQueryForDietary = GENERIC_FOOD_KEYWORDS.some(kw => queryLower.includes(kw));

                console.log('🥗 Vegetarian check:', {
                    isVegetarian,
                    isSpecificFoodQuery,
                    isGenericFoodQueryForDietary
                });

                // Force vegetarian query if user is vegetarian/vegan AND query is generic food
                if (isVegetarian && isGenericFoodQueryForDietary && !isSpecificFoodQuery) {
                    logger.info('🥗 DIETARY FILTER: Vegetarian/Vegan user + generic food query -> Forcing "quán chay"');
                    console.log('✅ Augmenting query to vegetarian');
                    queryToUse = "top các quán chay ngon review tốt";
                    input.refinedQuery = queryToUse;
                    input.dietaryAugment = 'chay';
                }
            }

            // Execute retrieval
            const results = await basicRetriever.retrieve(queryToUse);
            return {
                ...input,
                retrievedDocs: results,
            };
        });
    }

    /**
     * ITINERARY MULTI-QUERY RETRIEVAL
     * Tìm kiếm đa dạng cho 8 loại địa điểm (FULL_DAY) hoặc 3 loại (EVENING_SIMPLE)
     */
    async retrieveForItinerary(input) {
        return await telemetry.measureTime(RAG_STAGES.RETRIEVAL, async () => {
            let itineraryQueries = [];
            
            // � EVENING FANCY: 3 queries cho buổi tối chỉnh chu
            if (input.itineraryType === 'EVENING_FANCY') {
                logger.info('🌟 EVENING FANCY: Starting retrieval (3 queries: Lẩu/Buffet → Karaoke → Hotel)...');
                itineraryQueries = [
                    'nhà hàng lẩu buffet cao cấp ăn tối Hà Nội',        // 18:00 - Ăn lẩu/buffet
                    'karaoke music box hát cao cấp Hà Nội',             // 20:00 - Karaoke
                    'A25 hotel khách sạn nghỉ ngơi Hà Nội',             // 22:30 - Nghỉ ngơi
                    'khách sạn gần trung tâm Hà Nội',                   // 22:30 - Khách sạn backup
                ];
            }
            // 🌙 EVENING SIMPLE: 3 queries cho buổi tối đơn giản
            else if (input.itineraryType === 'EVENING_SIMPLE') {
                logger.info('🌙 EVENING SIMPLE: Starting retrieval (3 queries: Fast food → Cafe → Dạo hồ)...');
                itineraryQueries = [
                    'KFC Jollibee McDonald fast food ăn nhanh Hà Nội',  // 18:00 - Ăn nhẹ fast food
                    'quán phở bún cơm ăn nhanh Hà Nội',                 // 18:00 - Ăn nhẹ Việt Nam
                    'quán cafe chill view đẹp Hà Nội',                  // 19:30 - Cafe
                    'hồ hoàn kiếm hồ tây dạo bộ tối Hà Nội',            // 21:00 - Dạo hồ
                ];
            } 
            // 📅 FULL DAY: 8 queries cho ngày đầy đủ
            else {
                logger.info('📅 FULL DAY ITINERARY: Starting multi-query retrieval (8 queries)...');
                itineraryQueries = [
                    'quán phở ngon Hà Nội ăn sáng',           // 08:00 - Ăn sáng
                    'quán cafe yên tĩnh làm việc Hà Nội',     // 09:30 - Cafe
                    'Lăng Bác Hồ Chí Minh tham quan',         // 10:30 - Tham quan
                    'quán bún chả ngon Hà Nội ăn trưa',       // 12:00 - Ăn trưa
                    'văn miếu quốc tử giám di tích lịch sử', // 14:00 - Tham quan
                    'hồ tây công viên dạo chơi Hà Nội',       // 16:00 - Dạo chơi
                    'nhà hàng lẩu buffet ăn tối Hà Nội',      // 18:30 - Ăn tối
                    'hồ gươm phố cổ dạo bộ tối Hà Nội'        // 20:30 - Dạo bộ
                ];
            }

            // Parallel retrieval cho tất cả queries
            const promises = itineraryQueries.map(query => 
                basicRetriever.retrieve(query, 5) // Lấy 5 kết quả mỗi query
            );

            const allResults = await Promise.all(promises);
            
            // Merge và deduplicate
            const mergedDocs = [];
            const seenIds = new Set();

            allResults.flat().forEach(doc => {
                const docId = doc.metadata?.id || doc.id;
                if (docId && !seenIds.has(docId)) {
                    seenIds.add(docId);
                    mergedDocs.push(doc);
                }
            });

            logger.info(`✅ ITINERARY: Retrieved ${mergedDocs.length} diverse places from ${itineraryQueries.length} queries`);
            
            return {
                ...input,
                retrievedDocs: mergedDocs,
            };
        });
    }
}

export default new SemanticRetrieval();
