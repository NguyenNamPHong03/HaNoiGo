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
            // 🧹 Pre-filtering: Remove places with Missing Addresses
            // User request: "mấy địa điểm mà không có địa chỉ thì loại luôn"
            const validDocs = input.retrievedDocs.filter(doc => {
                const address = doc.metadata?.address;
                if (!address || address.trim() === '' || address.toLowerCase() === 'đang cập nhật') {
                    logger.debug(`   🗑️ DROPPING Invalid Address: "${doc.metadata?.name}"`);
                    return false;
                }
                return true;
            });

            // 🧹 Pre-rerank deduplication to ensure unique candidates
            // Sometimes duplications slip through retrieval stages
            const dedupedDocs = this.deduplicateByPlaceId(validDocs);

            const reranked = await reranker.rerank(
                input.question,
                dedupedDocs
            );

            // PHASE 3 OPTIMIZATION: Apply preference-based ranking boost
            let boosted = this._applyPreferenceBoost(reranked, input);

            // 🎭 MOOD FILTERING: Apply mood-based boosting/demoting
            boosted = this._applyMoodFiltering(boosted, input);

            // 🍜 ENTITY FILTERING: Apply strict keyword check for FOOD_ENTITY
            boosted = this._applyEntityFiltering(boosted, input);

            // 🛡️ ENFORCE LIMIT: Slice to max Top K to prevent LLM overload
            // Even if Reranker fails (returns all), we must limit here
            const { RETRIEVAL_CONFIG } = await import('../../config/constants.js');
            const finalDocs = boosted.slice(0, RETRIEVAL_CONFIG.RERANK_TOP_K || 8);

            logger.info(`📉 Ranking complete: Keeping top ${finalDocs.length} documents (Limit: ${RETRIEVAL_CONFIG.RERANK_TOP_K})`);

            return {
                ...input,
                retrievedDocs: finalDocs,
            };
        });
    }

    /**
     * PHASE 3 OPTIMIZATION: Boost rankings based on user preferences
     * Increases score for places matching user's favorite foods, spaces, moods
     */
    _applyPreferenceBoost(docs, input) {
        const userPreferences = input.context?.userPreferences || input.userPreferences;
        if (!userPreferences || !input.context?.usePersonalization) {
            return docs; // No boost if personalization disabled
        }

        logger.info('🎯 Applying preference-based ranking boost...');

        return docs.map(doc => {
            let boostMultiplier = 1.0;
            const place = doc.metadata || {};
            const aiTags = place.aiTags || {};
            const matchedPreferences = [];

            // Boost for favorite foods (menu items)
            if (userPreferences.favoriteFoods && userPreferences.favoriteFoods.length > 0) {
                const menuItems = place.menu?.items || [];
                const hasFavoriteFood = userPreferences.favoriteFoods.some(favFood =>
                    menuItems.some(item =>
                        item.name?.toLowerCase().includes(favFood.toLowerCase())
                    )
                );
                if (hasFavoriteFood) {
                    boostMultiplier *= 1.10; // +10% boost
                    matchedPreferences.push('favorite food');
                }
            }

            // Boost for favorite spaces
            if (userPreferences.styles && userPreferences.styles.length > 0) {
                const styleMapping = {
                    'modern': ['hiện đại', 'thoáng đãng'],
                    'traditional': ['cổ điển', 'vintage'],
                    'cozy': ['ấm cúng', 'riêng tư'],
                    'elegant': ['thanh lịch', 'chuyên nghiệp']
                };

                const hasMatchingStyle = userPreferences.styles.some(style => {
                    const targetTags = styleMapping[style] || [];
                    return aiTags.space?.some(s => targetTags.includes(s));
                });

                if (hasMatchingStyle) {
                    boostMultiplier *= 1.05; // +5% boost
                    matchedPreferences.push('matching style');
                }
            }

            // Boost for preferred atmosphere/mood
            if (userPreferences.atmosphere && userPreferences.atmosphere.length > 0) {
                const atmosphereMapping = {
                    'quiet': ['yên tĩnh', 'yên bình', 'thư giãn'],
                    'lively': ['sôi động', 'năng động', 'vui vẻ'],
                    'romantic': ['lãng mạn', 'ấm cúng']
                };

                const hasMatchingMood = userPreferences.atmosphere.some(atm => {
                    const targetTags = atmosphereMapping[atm] || [];
                    return aiTags.mood?.some(m => targetTags.includes(m));
                });

                if (hasMatchingMood) {
                    boostMultiplier *= 1.08; // +8% boost
                    matchedPreferences.push('preferred mood');
                }
            }

            // Boost for activity suitability
            if (userPreferences.activities && userPreferences.activities.length > 0) {
                const activityMapping = {
                    'dating': ['hẹn hò', 'lãng mạn'],
                    'work-study': ['học bài', 'công việc', 'một mình'],
                    'hangout': ['bạn bè', 'tụ tập', 'nhóm lớn']
                };

                const hasMatchingActivity = userPreferences.activities.some(act => {
                    const targetTags = activityMapping[act] || [];
                    return aiTags.suitability?.some(s => targetTags.includes(s));
                });

                if (hasMatchingActivity) {
                    boostMultiplier *= 1.07; // +7% boost
                    matchedPreferences.push('activity match');
                }
            }

            if (boostMultiplier > 1.0) {
                const originalScore = doc.score || 0;
                const boostedScore = originalScore * boostMultiplier;
                logger.info(`   📈 Boosted "${place.name}": ${originalScore.toFixed(3)} → ${boostedScore.toFixed(3)} (${matchedPreferences.join(', ')})`);

                return {
                    ...doc,
                    score: boostedScore,
                    _preferenceBoost: boostMultiplier,
                    _matchedPreferences: matchedPreferences
                };
            }

            return doc;
        }).sort((a, b) => (b.score || 0) - (a.score || 0)); // Re-sort by new scores
    }

    /**
     * 🎭 Apply Mood Filtering (Boost related, Demote excluded)
     */
    _applyMoodFiltering(docs, input) {
        if (!input.moodContext || !docs.length) return docs;

        const { type, tags, excludeTags } = input.moodContext;
        logger.info(`🎭 Applying mood filtering for "${type}"...`);

        return docs.map(doc => {
            let scoreMultiplier = 1.0;
            const place = doc.metadata || {};
            const aiTags = [
                ...(place.aiTags?.space || []),
                ...(place.aiTags?.mood || []),
                ...(place.aiTags?.suitability || []),
                place.category || ''
            ].map(t => t.toLowerCase());

            const description = (place.description || '').toLowerCase();
            const fullText = `${aiTags.join(' ')} ${description}`;

            // BOOST: If matches related tags
            const matchesRelated = tags.some(tag => fullText.includes(tag.toLowerCase()));
            if (matchesRelated) {
                scoreMultiplier *= 1.2; // +20% boost
            }

            // DEMOTE: If matches exclude tags
            if (excludeTags && excludeTags.length > 0) {
                const matchesExclude = excludeTags.some(tag => fullText.includes(tag.toLowerCase()));
                if (matchesExclude) {
                    scoreMultiplier *= 0.5; // -50% penalty
                    logger.info(`   🔻 Demoting "${place.name}" (matches exclude tag for mood ${type})`);
                }
            }

            if (scoreMultiplier !== 1.0) {
                const originalScore = doc.score || 0;
                const newScore = originalScore * scoreMultiplier;
                return {
                    ...doc,
                    score: newScore,
                    _moodBoost: scoreMultiplier
                };
            }

            return doc;
        }).sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    /**
     * STAGE 8.25: Dietary Filter (for vegetarian/vegan users)
     */
    async applyDietaryFilter(input) {
        if (input.cached || !input.retrievedDocs?.length) return input;

        // Only apply if dietaryAugment was set
        if (input.dietaryAugment !== 'chay') return input;

        logger.info('🥗 Applying vegetarian filter to retrieved docs...');

        // 🔍 DEBUG: Check for duplicates BEFORE filtering
        const beforeIds = input.retrievedDocs.map(d => d.metadata?.id || d.metadata?.originalId);
        const uniqueBeforeIds = new Set(beforeIds);
        logger.info(`🔍 BEFORE dietary filter: ${beforeIds.length} docs, ${uniqueBeforeIds.size} unique IDs`);
        if (beforeIds.length !== uniqueBeforeIds.size) {
            logger.warn(`⚠️ DUPLICATES DETECTED in retrievedDocs before dietary filter!`);
            const duplicates = beforeIds.filter((id, index) => beforeIds.indexOf(id) !== index);
            logger.warn(`   Duplicate IDs: ${[...new Set(duplicates)].join(', ')}`);
        }

        const vegetarianNameKeywords = ['chay', 'chày', 'thuần chay', 'thuan chay', 'vegan'];

        const filtered = input.retrievedDocs.filter(doc => {
            const name = (doc.name || doc.metadata?.name || '').toLowerCase();
            const docId = doc.metadata?.id || doc.metadata?.originalId;

            // Only keep places with "chay" or similar in the NAME
            const isVegetarianPlace = vegetarianNameKeywords.some(kw => name.includes(kw));

            if (isVegetarianPlace) {
                logger.info(`✅ Keeping vegetarian place: ${name} (ID: ${docId})`);
                return true;
            }

            return false;
        });

        // 🔍 DEBUG: Check for duplicates AFTER filtering
        const afterIds = filtered.map(d => d.metadata?.id || d.metadata?.originalId);
        const uniqueAfterIds = new Set(afterIds);
        logger.info(`🔍 AFTER dietary filter: ${afterIds.length} docs, ${uniqueAfterIds.size} unique IDs`);
        if (afterIds.length !== uniqueAfterIds.size) {
            logger.warn(`⚠️ DUPLICATES REMAIN after dietary filter!`);
        }

        logger.info(`🥗 Dietary filter: ${input.retrievedDocs.length} -> ${filtered.length} places`);

        // 🛡️ DEDUPLICATE after filtering (safety measure)
        const deduped = [];
        const seenIds = new Set();
        for (const doc of filtered) {
            const id = doc.metadata?.id || doc.metadata?.originalId;
            if (!seenIds.has(id)) {
                deduped.push(doc);
                seenIds.add(id);
            }
        }

        if (deduped.length !== filtered.length) {
            logger.warn(`🛡️ Deduplication removed ${filtered.length - deduped.length} duplicates`);
        }

        return {
            ...input,
            retrievedDocs: deduped
        };
    }

    /**
     * 🍜 Apply Food Entity Filtering
     * Ensures "quán ốc" doesn't return "cafe" or "thịt chó"
     */
    _applyEntityFiltering(docs, input) {
        if (input.queryIntent !== 'FOOD_ENTITY') return docs;

        const keyword = (input.queryKeyword || '').toLowerCase();

        logger.info(`🍜 Applying strict entity filtering for "${keyword}"...`);

        // Categories that are explicitly NOT food (unless user asks for them)
        const nonFoodCategories = ['spa', 'gym', 'khách sạn', 'hotel', 'homestay', 'shop', 'cửa hàng', 'siêu thị'];

        // Categories that are typically drinks, not food
        const drinkCategories = ['cafe', 'coffee', 'cà phê', 'trà sữa', 'giải khát', 'pub', 'bar'];

        return docs.reduce((acc, doc) => {
            let scoreMultiplier = 1.0;
            const place = doc.metadata || {};
            const name = (place.name || '').toLowerCase();
            const category = (place.category || '').toLowerCase();
            const description = (place.description || '').toLowerCase();
            const fullText = `${name} ${category} ${description}`;

            // --- 1. STRONG FILTER: NON-FOOD CATEGORIES ---
            const isNonFood = nonFoodCategories.some(c => category.includes(c));
            if (isNonFood) {
                logger.info(`   🗑️ DROPPING "${place.name}" (Non-food category: ${category})`);
                return acc; // DROP
            }

            // --- 2. STRONG FILTER: DRINK VS FOOD ---
            const isDrinkPlace = drinkCategories.some(c => category.includes(c));
            const userWantsDrink = drinkCategories.some(c => keyword.includes(c));

            // If it's a "Cafe"/"Pub" and user wants "Food" (e.g. "ốc", "phở")
            // Strict check: The place MUST explicitly mention the keyword.
            const placeMentionsKeyword = fullText.includes(keyword);

            // FIX: Check keyword.length >= 2 (so "ốc" works)
            if (isDrinkPlace && !userWantsDrink && !placeMentionsKeyword && keyword.length >= 2) {
                logger.info(`   🗑️ DROPPING Drink Place "${place.name}" (Query is food: "${keyword}")`);
                return acc; // DROP
            }

            // --- 3. KEYWORD MATCHING ---
            // Common generic keywords to ignore for strict filtering
            const genericKeywords = ['quán', 'ăn', 'ngon', 'đâu', 'gì', 'tại', 'với', 'ở', 'tìm', 'thấy'];
            const isGenericKeyword = genericKeywords.includes(keyword) || keyword.length < 2;

            if (fullText.includes(keyword)) {
                scoreMultiplier *= 1.5; // +50% boost
                if (name.includes(keyword)) {
                    scoreMultiplier *= 1.2; // Extra boost if in name
                }
            } else {
                // If keyword matches nothing, penalize heavily or drop
                // FIX: Check !isGenericKeyword (so "ốc" mismatch triggers penalty)
                if (!isGenericKeyword) {
                    scoreMultiplier *= 0.1; // -90% penalty (matches nothing relevant)
                    logger.info(`   🔻 CRUSHING score for "${place.name}" (missing specific keyword "${keyword}")`);
                }
            }

            // --- 5. THRESHOLD CHECK ---
            if (scoreMultiplier < 0.2) {
                logger.info(`   🗑️ DROPPING "${place.name}" (Low relevance score: ${scoreMultiplier})`);
                return acc;
            }

            // Update score
            const originalScore = doc.score || 0;
            const newScore = originalScore * scoreMultiplier;

            acc.push({
                ...doc,
                score: newScore,
                _entityBoost: scoreMultiplier
            });
            return acc;

        }, []).sort((a, b) => (b.score || 0) - (a.score || 0));
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

        // Limit to top 8 nearest places
        const top8Nearest = sorted.slice(0, 8);

        const closestPlace = top8Nearest[0];
        if (closestPlace?.distanceKm !== null) {
            logger.info(`📍 Closest place: ${closestPlace.metadata?.name || 'Unknown'} (${closestPlace.distanceKm}km)`);
            logger.info(`📍 Showing top ${top8Nearest.length} nearest places`);
        }

        return {
            ...input,
            retrievedDocs: top8Nearest
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
    /**
     * Helper: Deduplicate documents by place ID or Name
     */
    deduplicateByPlaceId(docs) {
        const placeMap = new Map();

        docs.forEach(doc => {
            // Priority: ID > Original ID > Name
            const placeId = doc.metadata?.id || doc.metadata?.originalId || doc.metadata?.name;

            if (!placeId) {
                placeMap.set(doc.id || Math.random(), doc);
                return;
            }

            // Keep the one with higher score if duplicate exists
            const existing = placeMap.get(placeId);
            if (!existing || (doc.score > existing.score)) {
                placeMap.set(placeId, doc);
            }
        });

        return Array.from(placeMap.values());
    }
}

export default new RankingEngine();
