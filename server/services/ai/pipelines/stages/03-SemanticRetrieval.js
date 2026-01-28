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

            // ═══════════════════════════════════════════════════════════
            // 🥗 DIETARY FILTER LOGIC (Only for personalization)
            // ═══════════════════════════════════════════════════════════
            // RULE:
            // - User hỏi CHUNG CHUNG ("tìm quán ăn", "ăn gì đây")
            //   → Áp dụng preferences (chay, yên tĩnh, etc.)
            // 
            // - User hỏi CỤ THỂ MÓN ĂN ("quán phở", "bún chả", "ốc")
            //   → KHÔNG áp dụng dietary filter, search theo món user hỏi
            // ═══════════════════════════════════════════════════════════

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
                // STEP 1: Check if user asked for SPECIFIC DISH (phở, ốc, bún chả...)
                const isSpecificFoodQuery = SPECIFIC_FOOD_KEYWORDS.some(kw => queryLower.includes(kw));

                console.log('🔍 Step 1 - Specific food check:', {
                    isSpecificFoodQuery,
                    matchedKeywords: SPECIFIC_FOOD_KEYWORDS.filter(kw => queryLower.includes(kw))
                });

                // ✅ IF SPECIFIC DISH → Skip dietary filter (respect user's explicit request)
                if (isSpecificFoodQuery) {
                    logger.info('🍜 SPECIFIC FOOD QUERY detected → Skipping dietary filter (user wants this specific dish)');
                    // Continue with original query, NO override
                } else {
                    // STEP 2: Check if query is GENERIC FOOD ("tìm quán ăn", "ăn gì")
                    const isGenericFoodQuery = GENERIC_FOOD_KEYWORDS.some(kw => queryLower.includes(kw));
                    const isVegetarian = userDietary.some(d => VEGETARIAN_KEYWORDS.includes(d.toLowerCase()));

                    console.log('🥗 Step 2 - Generic food + dietary check:', {
                        isGenericFoodQuery,
                        isVegetarian
                    });

                    // ✅ IF GENERIC FOOD + VEGETARIAN → Apply dietary filter
                    if (isVegetarian && isGenericFoodQuery) {
                        logger.info('🥗 DIETARY FILTER: Vegetarian user + generic query ("tìm quán ăn") → Forcing "quán chay"');
                        console.log('✅ Augmenting query to vegetarian');
                        queryToUse = "top các quán chay ngon review tốt";
                        input.refinedQuery = queryToUse;
                        input.dietaryAugment = 'chay';
                    } else {
                        logger.info('ℹ️ No dietary augmentation needed (query is not generic food)');
                    }
                }
            }

            // PHASE 2 OPTIMIZATION: Check query result cache first
            const cacheClient = (await import('../../core/cacheClient.js')).default;
            const cacheKey = queryToUse;
            const cacheFilters = {
                dietary: input.dietaryAugment,
                personalization: shouldIncludePersonalization
            };

            const cachedResults = await cacheClient.getQueryResultCache(cacheKey, cacheFilters);
            if (cachedResults && cachedResults.length > 0) {
                logger.info(`🎯 Query result cache HIT: ${cachedResults.length} results`);
                return {
                    ...input,
                    retrievedDocs: cachedResults,
                };
            }

            // PHASE 2 OPTIMIZATION: Pre-filter metadata before vector search
            const metadataFilter = this._buildMetadataFilter(input);

            // ⚡ PERFORMANCE: Reduce top_k for faster retrieval (12 instead of 20)
            const { PINECONE_TOP_K } = await import('../../config/aiConstants.js').then(m => m.PERFORMANCE);
            const topK = PINECONE_TOP_K || 12;

            // Execute retrieval with pre-filtering
            const results = await basicRetriever.retrieve(queryToUse, topK, metadataFilter);

            // 🔥 DEDUPLICATE: Remove duplicate places (same metadata.id)
            let dedupedResults = this.deduplicateByPlaceId(results);
            logger.info(`🧹 Deduplication: ${results.length} docs → ${dedupedResults.length} unique places`);

            // 🍜 POST-FILTER: Apply food category filter if FOOD_ENTITY query
            if (input.queryIntent === 'FOOD_ENTITY' && input.queryMustQuery) {
                const beforeFilter = dedupedResults.length;
                dedupedResults = this._applyFoodCategoryFilter(dedupedResults, input.queryMustQuery);
                logger.info(`🍜 Food category filter: ${beforeFilter} → ${dedupedResults.length} places`);
            }

            // PHASE 2: Cache the query results
            await cacheClient.setQueryResultCache(cacheKey, dedupedResults, {
                filters: cacheFilters
            });

            return {
                ...input,
                retrievedDocs: dedupedResults,
            };
        });
    }

    /**
     * Deduplicate documents by place ID
     * Giữ document có score cao nhất cho mỗi place
     */
    deduplicateByPlaceId(docs) {
        const placeMap = new Map();

        docs.forEach(doc => {
            const placeId = doc.metadata?.originalId || doc.metadata?.id;
            if (!placeId) {
                // Nếu không có placeId, vẫn giữ lại
                placeMap.set(doc.id, doc);
                return;
            }

            const existing = placeMap.get(placeId);
            if (!existing || (doc.score > existing.score)) {
                // Giữ document có score cao hơn
                placeMap.set(placeId, doc);
            }
        });

        return Array.from(placeMap.values());
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
                    'hồ hoàn kiếm phố cổ dạo bộ tối Hà Nội'   // 20:30 - Dạo bộ
                ];
            }

            // Parallel retrieval cho tất cả queries
            const promises = itineraryQueries.map(query =>
                basicRetriever.retrieve(query, 5) // Lấy 5 kết quả mỗi query
            );

            const allResults = await Promise.all(promises);

            // Stratified Selection: Ensure we pick top result from EACH category
            const mergedDocs = [];
            const seenIds = new Set();
            const docsPerCategory = 2; // Pick top 2 for each valid query

            allResults.forEach((results, index) => {
                let count = 0;
                for (const doc of results) {
                    if (count >= docsPerCategory) break;

                    const docId = doc.metadata?.originalId || doc.metadata?.id || doc.id;
                    if (docId && !seenIds.has(docId)) {
                        seenIds.add(docId);
                        mergedDocs.push(doc);
                        count++;
                    }
                }
                logger.info(`   - Query "${itineraryQueries[index]}": added ${count} docs`);
            });

            logger.info(`✅ ITINERARY: Retrieved ${mergedDocs.length} balanced places from ${itineraryQueries.length} categories`);

            return {
                ...input,
                retrievedDocs: mergedDocs,
            };
        });
    }

    /**
     * Deduplicate documents by place ID
     * Giữ document có score cao nhất cho mỗi place
     */
    deduplicateByPlaceId(docs) {
        const placeMap = new Map();

        docs.forEach(doc => {
            const placeId = doc.metadata?.originalId || doc.metadata?.id;
            if (!placeId) {
                // Nếu không có placeId, vẫn giữ lại
                placeMap.set(doc.id, doc);
                return;
            }

            const existing = placeMap.get(placeId);
            if (!existing || (doc.score > existing.score)) {
                // Giữ document có score cao hơn
                placeMap.set(placeId, doc);
            }
        });

        return Array.from(placeMap.values());
    }

    /**
     * PHASE 2 OPTIMIZATION: Build metadata pre-filter
     * Reduce vector search space by filtering in Pinecone
     */
    _buildMetadataFilter(input) {
        const filter = {};

        // District filter
        if (input.districtMustQuery) {
            filter.district = input.districtMustQuery;
        }

        // Price range filter
        if (input.context?.filters?.priceRange) {
            filter['priceRange.max'] = {
                $lte: input.context.filters.priceRange.max
            };
        }

        // Category filter
        if (input.context?.filters?.category) {
            filter.category = input.context.filters.category;
        }

        // Only return filter if it has properties
        return Object.keys(filter).length > 0 ? filter : undefined;
    }

    /**
     * 🍜 Apply food category filter to retrieved documents
     * Filters out non-food categories (karaoke, spa, gym, etc.) when user searches for food
     * 
     * @param {Array} docs - Retrieved documents from vector search
     * @param {Object} mustQuery - MongoDB $and query with category filter
     * @returns {Array} Filtered documents matching food categories only
     */
    _applyFoodCategoryFilter(docs, mustQuery) {
        // Extract food-related categories from mustQuery
        const foodRelatedCategories = [
            'Quán ăn',
            'Nhà hàng',
            'Quán cafe',
            'Quán ăn vặt',
            'Buffet',
            'Tiệm ăn',
            'Ăn uống',
            'Cafe',
            'Coffee',
            'Trà sữa',
            'Dessert',
            'Chay',
            'Hải sản',
            'Lẩu',
            'Nướng',
            'BBQ',
            'Fast food',
        ];

        const foodCategoryRegex = /ăn|uống|cafe|coffee|nhà hàng|quán|buffet|food/i;

        return docs.filter(doc => {
            const category = doc.metadata?.category || doc.pageContent?.match(/Category:\s*([^\n]+)/)?.[1];

            if (!category) {
                // No category info - keep it (better to include than exclude)
                return true;
            }

            // Check if category is food-related
            const isFoodCategory =
                foodRelatedCategories.includes(category) ||
                foodCategoryRegex.test(category);

            if (!isFoodCategory) {
                logger.info(`🚫 Filtered out non-food category: "${category}" (place: ${doc.metadata?.name || 'unknown'})`);
            }

            return isFoodCategory;
        });
    }
}

export default new SemanticRetrieval();
