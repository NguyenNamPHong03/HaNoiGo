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
}

export default new SemanticRetrieval();
