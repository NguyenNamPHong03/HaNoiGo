/**
 * Main Chat Pipeline - Complete RAG Workflow
 * Mục đích: Orchestrate entire RAG flow từ input đến output
 * Trách nhiệm: Guard -> Cache -> Retrieval -> LLM -> Response
 */

import { RunnableSequence } from '@langchain/core/runnables';
import { searchNearbyPlaces, searchPlaces, searchPlacesByRegex, searchPlacesByVibe } from '../../placeService.js';
import weatherService from '../../weather/weatherService.js';
import { RAG_STAGES } from '../config/constants.js';
import {
    ACCOMMODATION_KEYWORDS,
    LUXURY_KEYWORDS,
    VEGETARIAN_KEYWORDS,
    SPECIFIC_FOOD_KEYWORDS,
    GENERIC_FOOD_KEYWORDS,
    ADDRESS_MARKERS,
    STOP_WORDS
} from '../config/keywords.js';
import config from '../config/index.js';
import cacheClient from '../core/cacheClient.js';
import llmFactory from '../core/llmFactory.js';
import telemetry from '../core/telemetry.js';
import inputGuard from '../guardrails/inputGuard.js';
import outputGuard from '../guardrails/outputGuard.js';
import promptLoader from '../prompts/promptLoader.js';
import intentClassifier from '../retrieval/extractors/intentClassifier.js';
import reranker from '../retrieval/reranker.js';
import basicRetriever from '../retrieval/strategies/basicRetriever.js';
import { isGenericFoodQuery } from '../utils/distanceUtils.js';
import logger from '../utils/logger.js';
import { formatPreferencesForPrompt } from '../utils/preferencesMapper.js';

// Optimizaion constants
const SEARCH_TIMEOUT_MS = 1000; // 1s timeout for auxiliary searches

class MainChatPipeline {
    constructor() {
        this.chain = null;
        this.initialized = false;
        this.llm = null;
    }

    /**
     * Initialize the pipeline
     */
    async initialize() {
        if (this.initialized) return this.chain;

        try {
            logger.info('🏗️  Building RAG pipeline...');

            this.llm = await llmFactory.getLLM();
            await promptLoader.initialize();
            await reranker.initialize();

            // Compose pipeline
            this.chain = RunnableSequence.from([
                this.stageInputGuard.bind(this),
                // this.stageSemanticCache.bind(this), // Cache disabled by user request
                // Parallelize analysis stages
                this.stageParallelAnalysis.bind(this),
                this.stageRetrieval.bind(this),
                this.stageKeywordAugment.bind(this),
                this.stageReranking.bind(this),
                this.stageDietaryFilter.bind(this), // Vegetarian/Vegan filter
                this.stageLocationSort.bind(this),  // Sort by distance when "Gần tôi" enabled
                this.stageLocalReorder.bind(this),
                this.stageFormatContext.bind(this),
                this.stageCreatePrompt.bind(this),
                this.stageLLMInference.bind(this),
                // this.stageCacheResponse.bind(this), // Cache disabled
            ]);

            this.initialized = true;
            logger.info('✅ RAG pipeline initialized');

            return this.chain;
        } catch (error) {
            logger.error('❌ Pipeline initialization failed:', error);
            throw error;
        }
    }

    // STAGE 1: Input Guard
    async stageInputGuard(input) {
        return await telemetry.measureTime(RAG_STAGES.INPUT_GUARD, async () => {
            const sanitizedQuestion = await inputGuard.validate(input.question);
            return {
                ...input,
                question: sanitizedQuestion
            };
        });
    }

    // Helper: Generate context-aware cache key
    _generateCacheKey(input) {
        let key = input.question;
        const ctx = input.context;
        // If context exists, append switch states to key
        if (ctx) {
            const rt = ctx.useRealtime !== false ? '1' : '0'; // Default true logic matches pipeline
            const loc = ctx.useLocation ? '1' : '0';
            const pz = ctx.usePersonalization ? '1' : '0'; // Default depends provided match, but frontend provides explicit
            key += `|ctx:${rt}${loc}${pz}`;
        }
        return key;
    }

    // STAGE 2: Semantic Cache
    async stageSemanticCache(input) {
        return await telemetry.measureTime(RAG_STAGES.SEMANTIC_CACHE, async () => {
            const cacheKey = this._generateCacheKey(input);
            const cached = await cacheClient.getCache(cacheKey);

            if (cached) {
                logger.info(`🎯 Cache HIT! Key: "${cacheKey}"`);
                return {
                    ...input,
                    ...cached,
                    cached: true,
                    cacheKey // Pass key along
                };
            }
            return { ...input, cached: false, cacheKey };
        });
    }

    // STAGE 3: Parallel Analysis (Rewrite + Intent + Query Analysis)
    async stageParallelAnalysis(input) {
        if (input.cached) return input;

        return await telemetry.measureTime('PARALLEL_ANALYSIS', async () => {
            // Helper wrapper to ensure we just return the diffs, not the whole input object to avoid conflicts
            // Actually, for simplicity, we let them return ...input and we just pick the new props.

            const [rewriteRes, intentRes, analysisRes] = await Promise.all([
                this.runRewriteQuery(input),
                this.runClassifyIntent(input),
                this.runClassifyQueryIntent(input)
            ]);

            return {
                ...input,
                ...rewriteRes,
                ...intentRes,
                ...analysisRes,
                // Ensure cached is still handled if any returned it (unlikely here as we checked input.cached top)
            };
        });
    }

    // --- Sub-functions for Parallel Analysis ---

    async runRewriteQuery(input) {
        if (!config.features.useQueryRewriting || input.question.length < 10) return {};

        try {
            const prompt = await promptLoader.formatQueryRewrite(input.question);
            const response = await this.llm.invoke(prompt);
            const refinedQuery = typeof response === 'string' ? response : response.content;
            logger.info(`🔄 Rewrote query: "${input.question}" -> "${refinedQuery}"`);
            return { refinedQuery: refinedQuery.trim() };
        } catch (error) {
            logger.warn('⚠️ Query rewriting failed:', error);
            return {};
        }
    }

    async runClassifyIntent(input) {
        try {
            const prompt = await promptLoader.formatIntentClassify(input.question);
            const response = await this.llm.invoke(prompt);
            let intent = typeof response === 'string' ? response : response.content;
            intent = intent.trim().toUpperCase();
            if (!intent.includes('ITINERARY')) intent = 'CHAT'; // Default to CHAT

            logger.info(`🧠 Intent detected: ${intent}`);
            return { intent };
        } catch (error) {
            logger.error('Intent classification failed', error);
            return { intent: 'CHAT' };
        }
    }

    async runClassifyQueryIntent(input) {
        const intentData = intentClassifier.classify(input.question);
        logger.info(`🎯 Query Intent: ${intentData.intent}`);

        // Log details
        if (intentData.intent === 'FOOD_ENTITY') {
            logger.info(`🍜 FOOD MODE: "${intentData.keyword}" → HARD FILTER`);
        } else if (intentData.intent === 'PLACE_VIBE') {
            logger.info(`💕 VIBE MODE: "${intentData.keyword}" > TAGS: [${intentData.tags.join(', ')}]`);
        }

        return {
            queryIntent: intentData.intent,
            queryKeyword: intentData.keyword,
            queryTags: intentData.tags,
            queryMustQuery: intentData.mustQuery
        };
    }

    // STAGE 6: Retrieval
    async stageRetrieval(input) {
        if (input.cached) return input;

        return await telemetry.measureTime(RAG_STAGES.RETRIEVAL, async () => {
            let queryToUse = input.refinedQuery || input.question;
            const queryLower = queryToUse.toLowerCase();

            // Only apply dietary filtering if Personalization is ENABLED
            const shouldIncludePersonalization = !!input.context?.usePersonalization;
            const userPreferences = input.context?.userPreferences || input.userPreferences || null;
            const userDietary = userPreferences?.dietary || [];

            if (shouldIncludePersonalization && userDietary.length > 0) {
                const isVegetarian = userDietary.some(d => VEGETARIAN_KEYWORDS.includes(d.toLowerCase()));
                const isSpecificFoodQuery = SPECIFIC_FOOD_KEYWORDS.some(kw => queryLower.includes(kw));
                const isGenericFoodQueryForDietary = GENERIC_FOOD_KEYWORDS.some(kw => queryLower.includes(kw));

                // Force vegetarian query if user is vegetarian/vegan AND query is generic food
                if (isVegetarian && isGenericFoodQueryForDietary && !isSpecificFoodQuery) {
                    logger.info('🥗 DIETARY FILTER: Vegetarian/Vegan user + generic food query -> Forcing "quán chay"');
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

    // STAGE 7: Hybrid/Keyword Augmentation
    async stageKeywordAugment(input) {
        if (input.cached) return input;

        return await telemetry.measureTime('KEYWORD_AUGMENT', async () => {
            let query = (input.refinedQuery || input.question).toLowerCase().trim();

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

            // Helper to wrap promise with timeout
            const withTimeout = (promise, fallback = []) => {
                return Promise.race([
                    promise,
                    new Promise(resolve => setTimeout(() => {
                        // Silent resolve with empty to avoid breaking main flow
                        resolve(fallback);
                    }, SEARCH_TIMEOUT_MS))
                ]);
            };

            const promises = [];
            const textLimit = input.intent === 'ITINERARY' ? 20 : 10;
            const queryIntent = input.queryIntent || 'GENERAL';

            // 1. Keyword/Mongo Search (Parallel)
            let searchPromise;
            if (queryIntent === 'FOOD_ENTITY') {
                searchPromise = searchPlaces(query, textLimit, categoryFilter, priceFilter, input.queryMustQuery);
            } else if (queryIntent === 'PLACE_VIBE' || queryIntent === 'ACTIVITY') {
                const tags = input.queryTags || [];
                searchPromise = searchPlacesByVibe(tags, textLimit, categoryFilter, priceFilter);
            } else {
                searchPromise = searchPlaces(query, textLimit, categoryFilter, priceFilter);
            }
            // Wrap in timeout
            promises.push(withTimeout(searchPromise).catch(err => {
                logger.warn('⚠️ Keyword search failed/timed out', err);
                return [];
            }));

            // 1.5 NEAR ME SEARCH (If enabled via context)
            // When "Gần tôi" switch is ON, ALWAYS trigger nearby search regardless of query keywords
            if (input.context?.useLocation && input.context?.location) {
                const { lat, lng } = input.context.location;

                if (lat && lng) {
                    logger.info(`📍 "Gần tôi" switch enabled - Searching within 5km of (${lat.toFixed(4)}, ${lng.toFixed(4)})`);

                    const nearbyPromise = searchNearbyPlaces(
                        lat,
                        lng,
                        5, // 5km radius
                        textLimit,
                        { category: categoryFilter, minPrice: priceFilter }
                    );

                    promises.push(withTimeout(nearbyPromise).catch(err => {
                        logger.warn('⚠️ Nearby search failed', err);
                        return [];
                    }));
                }
            }

            // 2. Address Regex Search (Parallel)
            // Move address parsing logic here or keep utilizing what we had.
            // For optimization, we only trigger this if we detect potential address markers
            const hasAddressMarker = ADDRESS_MARKERS.some(m => query.includes(m.key));

            if (hasAddressMarker) {
                const regexSearchPromise = (async () => {
                    let addressPatternRaw = null;
                    let prefixRegex = null;

                    for (const marker of ADDRESS_MARKERS) {
                        if (query.includes(marker.key)) {
                            const idx = query.indexOf(marker.key);
                            let afterMarker = query.substring(idx + marker.key.length).trim();
                            // Heuristic to cut off stop words
                            for (const word of STOP_WORDS) {
                                const wIdx = afterMarker.toLowerCase().indexOf(word.toLowerCase());
                                if (wIdx !== -1) afterMarker = afterMarker.substring(0, wIdx).trim();
                            }
                            if (afterMarker) {
                                addressPatternRaw = afterMarker;
                                prefixRegex = marker.regex;
                                break;
                            }
                        }
                    }

                    if (addressPatternRaw && prefixRegex) {
                        const safeSuffix = addressPatternRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const flexibleSuffix = safeSuffix.split(/\s+/).join('\\s+');
                        const regex = new RegExp(`${prefixRegex}\\s+${flexibleSuffix}`, 'i');
                        logger.info(`🎯 Address Regex detected: ${regex}`);
                        const addressMustQuery = (queryIntent === 'FOOD_ENTITY') ? input.queryMustQuery : null;
                        return await searchPlacesByRegex(regex, 5, categoryFilter, priceFilter, addressMustQuery);
                    }
                    return [];
                })();

                promises.push(withTimeout(regexSearchPromise).catch(err => {
                    logger.warn('⚠️ Regex search failed/timed out', err);
                    return [];
                }));
            }

            // Wait for all searches
            const results = await Promise.all(promises);
            const places = results.flat();

            if (!places || places.length === 0) return input;

            logger.info(`🔍 Hybrid search found ${places.length} results (merged)`);

            // Convert to retrievedDocs
            const mongoDocs = places.map(p => ({
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

            // Deduplicate
            const combined = [...(input.retrievedDocs || [])];
            const existingIds = new Set(combined.map(d => d.metadata?.id));

            for (const doc of mongoDocs) {
                if (!existingIds.has(doc.metadata.id)) {
                    combined.push(doc);
                    existingIds.add(doc.metadata.id);
                }
            }

            return {
                ...input,
                retrievedDocs: combined
            };
        });
    }

    // STAGE 8: Reranking
    async stageReranking(input) {
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

    // STAGE 8.25: Dietary Filter (for vegetarian/vegan users)
    async stageDietaryFilter(input) {
        if (input.cached || !input.retrievedDocs?.length) return input;

        // Only apply if dietaryAugment was set (meaning user is vegetarian + personalization ON + generic query)
        if (input.dietaryAugment !== 'chay') return input;

        logger.info('🥗 Applying vegetarian filter to retrieved docs...');

        // Keywords that indicate non-vegetarian food
        const nonVegetarianKeywords = [
            'thịt', 'thit', 'bò', 'bo', 'heo', 'gà', 'ga', 'cá', 'ca',
            'hải sản', 'hai san', 'ốc', 'oc', 'tôm', 'tom', 'cua',
            'lẩu', 'lau', 'nướng', 'nuong', 'bbq', 'nhậu', 'nhau',
            'bia', 'bar', 'pub', 'steak', 'bún bò', 'bun bo',
            'phở bò', 'pho bo', 'bún chả', 'bun cha'
        ];

        // Keywords that indicate vegetarian food
        const vegetarianKeywords = [
            'chay', 'vegan', 'vegetarian', 'thuần chay', 'thuan chay',
            'đậu', 'dau', 'rau', 'salad', 'healthy'
        ];

        const filtered = input.retrievedDocs.filter(doc => {
            const name = (doc.name || doc.metadata?.name || '').toLowerCase();
            const category = (doc.metadata?.category || '').toLowerCase();
            const content = (doc.pageContent || doc.content || '').toLowerCase();
            const combined = `${name} ${category} ${content}`;

            // If place explicitly contains vegetarian keywords, keep it
            if (vegetarianKeywords.some(kw => combined.includes(kw))) {
                return true;
            }

            // If place contains non-vegetarian keywords, remove it
            if (nonVegetarianKeywords.some(kw => combined.includes(kw))) {
                logger.info(`🚫 Filtered out non-vegetarian: ${name}`);
                return false;
            }

            // Default: keep (might be cafe, dessert, etc.)
            return true;
        });


        logger.info(`🥗 Dietary filter: ${input.retrievedDocs.length} -> ${filtered.length} places`);

        return {
            ...input,
            retrievedDocs: filtered
        };
    }

    // STAGE 8.3: Location-based Sorting (when "Gần tôi" is enabled)
    async stageLocationSort(input) {
        if (input.cached || !input.retrievedDocs?.length) return input;

        // Only sort by distance if "Gần tôi" switch is ON and we have coordinates
        if (!input.context?.useLocation || !input.context?.location) return input;

        const { lat, lng } = input.context.location;
        if (!lat || !lng) return input;

        logger.info(`📍 Sorting results by distance from user location...`);

        // Import haversine function
        const { haversineKm } = await import('../utils/distanceUtils.js');

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

        const closestPlace = sorted[0];
        if (closestPlace?.distanceKm !== null) {
            logger.info(`📍 Closest place: ${closestPlace.metadata?.name || 'Unknown'} (${closestPlace.distanceKm}km)`);
        }

        return {
            ...input,
            retrievedDocs: sorted
        };
    }

    // STAGE 8.5: Local Reordering (Keyword Boost)
    async stageLocalReorder(input) {
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
            return 0; // Maintain existing order
        });

        return {
            ...input,
            retrievedDocs: reordered,
        };
    }

    // STAGE 9: Format Context
    async stageFormatContext(input) {
        if (input.cached) return input;

        const context = input.retrievedDocs
            .map((doc, i) => {
                const placeName = doc.name || doc.metadata?.name || `Địa điểm ${i + 1}`;
                const address = doc.metadata?.address ? `Địa chỉ: ${doc.metadata.address}` : '';
                const price = doc.metadata?.price ? `Giá: ${doc.metadata.price} VND` : 'Giá: Liên hệ';
                const category = doc.metadata?.category ? `(${doc.metadata.category})` : '';

                return `RANK #${i + 1} [${placeName}] ${category}\n${address} | ${price}\n${doc.content}`;
            })
            .join('\n\n---\n\n');

        return { ...input, context };
    }

    // STAGE 10: Create Prompt
    async stageCreatePrompt(input) {
        if (input.cached) return input;

        return await telemetry.measureTime(RAG_STAGES.PROMPT_CONSTRUCTION, async () => {
            // Context Flags
            // Default to FALSE if not provided, matching the new "Default Off" policy
            const isContextProvided = !!input.context;
            const shouldIncludeRealtime = isContextProvided ? !!input.context.useRealtime : false;
            const shouldIncludePersonalization = isContextProvided ? !!input.context.usePersonalization : false;

            let enhancedWeatherDesc = "Thời tiết: Không có dữ liệu thời gian thực (User disabled).";
            let datetime = "Thời gian: Không có dữ liệu thời gian thực (User disabled).";

            if (shouldIncludeRealtime) {
                const weatherData = await weatherService.getCurrentWeather();
                const now = new Date();
                datetime = now.toLocaleString('vi-VN', {
                    hour: '2-digit', minute: '2-digit',
                    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
                    timeZone: 'Asia/Bangkok'
                });

                // Weather Warning
                let weatherWarning = "";
                const desc = weatherData?.description || "";
                const sky = weatherData?.skyConditions || "";
                const isRaining = desc.toLowerCase().includes('mưa') ||
                    desc.toLowerCase().includes('rain') ||
                    (sky && sky.includes('Rain'));

                if (isRaining) {
                    weatherWarning = "⚠️ WARNING: It is currently RAINING. Prioritize Indoor places. Highlight 'cozy', 'warm', 'shelter'.";
                    logger.info('☔️ Rain detected, injecting warning.');
                }
                enhancedWeatherDesc = `${weatherData.fullDescription}\n${weatherWarning}`;
            }

            const userPreferences = input.userPreferences || null;
            let preferencesContext = '';

            if (shouldIncludePersonalization && userPreferences) {
                preferencesContext = formatPreferencesForPrompt(userPreferences);
                logger.info('👤 Personalization ENABLED');
            } else {
                logger.info('👤 Personalization DISABLED or no preferences');
            }

            let formatted;
            const formatter = input.intent === 'ITINERARY'
                ? promptLoader.formatItineraryGen
                : promptLoader.formatRAGQuery;

            formatted = await formatter.call(promptLoader,
                input.context,
                input.question,
                enhancedWeatherDesc,
                datetime,
                preferencesContext
            );

            return { ...input, prompt: formatted };
        });
    }

    // STAGE 11: LLM Inference
    async stageLLMInference(input) {
        if (input.cached) return input;

        return await telemetry.measureTime(RAG_STAGES.LLM_INFERENCE, async () => {
            const response = await this.llm.invoke(input.prompt);

            let answer = '';
            // Robust response extraction
            if (typeof response === 'string') {
                answer = response;
            } else if (response?.content) {
                answer = response.content;
            } else if (response?.kwargs?.content) {
                answer = response.kwargs.content;
            } else if (response?.text) {
                answer = response.text;
            }

            let structuredData = null;
            if (input.intent === 'ITINERARY') {
                try {
                    const firstOpen = answer.indexOf('{');
                    const lastClose = answer.lastIndexOf('}');
                    let jsonString = answer;

                    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
                        jsonString = answer.substring(firstOpen, lastClose + 1);
                    }

                    jsonString = jsonString.replace(/[\u0000-\u0019]+/g, "").trim();
                    structuredData = JSON.parse(jsonString);
                    logger.info('✅ Successfully parsed Itinerary JSON');
                } catch (e) {
                    logger.warn('⚠️ Failed to parse itinerary JSON', e);
                }
            }

            return {
                ...input,
                answer,
                structuredData
            };
        });
    }

    // STAGE 13: Cache Response
    async stageCacheResponse(input) {
        if (!input.cached && input.answer && input.retrievedDocs) {
            const key = input.cacheKey || input.question;
            await cacheClient.setCache(key, {
                question: input.question,
                answer: input.answer,
                retrievedDocs: input.retrievedDocs,
                context: input.context,
                intent: input.intent,
                structuredData: input.structuredData
            });
        }
        return input;
    }

    /**
     * Execute the pipeline
     */
    async execute(question, metadata = {}) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            logger.info(`❓ Processing: ${question}`);

            const result = await this.chain.invoke({
                question,
                context: metadata, // Fix: Pass metadata as context object so stages can access input.context
                ...metadata,
                userPreferences: metadata.userPreferences || null,
            });

            logger.info(`✅ Response generated using model: ${config.openai.model}`);

            // Deduplicate and process places for UI
            const uniquePlacesMap = new Map();
            if (result.retrievedDocs) {
                result.retrievedDocs.forEach(doc => {
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
                            }
                        });
                    }
                });
            }

            return {
                question: result.question,
                answer: result.answer,
                context: result.context,
                cached: result.cached,
                places: Array.from(uniquePlacesMap.values()),
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
        } catch (error) {
            logger.error('❌ Pipeline execution failed:', error);
            throw error;
        }
    }
}

export default new MainChatPipeline();
