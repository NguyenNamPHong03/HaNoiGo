/**
 * Main Chat Pipeline - Complete RAG Workflow
 * Mục đích: Orchestrate entire RAG flow từ input đến output
 * Trách nhiệm: Guard -> Cache -> Retrieval -> LLM -> Response
 */

import { RunnableSequence } from '@langchain/core/runnables';
import { searchNearbyPlaces, searchPlaces, searchPlacesByRegex, searchPlacesByVibe } from '../../placeService.js';
import weatherService from '../../weather/weatherService.js';
import { RAG_STAGES } from '../config/constants.js';
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

class MainChatPipeline {
    constructor() {
        this.chain = null;
        this.initialized = false;
    }

    /**
     * Initialize the pipeline
     */
    async initialize() {
        if (this.initialized) return this.chain;

        try {
            logger.info('🏗️  Building RAG pipeline...');

            const llm = await llmFactory.getLLM();
            await promptLoader.initialize();
            await reranker.initialize(); // Initialize reranker

            // Stage 1: Input Guard
            const guardedInput = async (input) => {
                return await telemetry.measureTime(RAG_STAGES.INPUT_GUARD, async () => {
                    return await inputGuard.validate(input.question);
                });
            };

            // Stage 2: Check Semantic Cache
            const cachedResponse = async (input) => {
                // Input is now the sanitized question string from Stage 1
                // We need to wrap it back into an object to carry context
                const question = input;

                return await telemetry.measureTime(RAG_STAGES.SEMANTIC_CACHE, async () => {
                    const cached = await cacheClient.getCache(question);
                    if (cached) {
                        logger.info('🎯 Cache HIT!');
                        return {
                            ...cached, // Spread full cached object (answer, retrievedDocs, etc.)
                            cached: true,
                        };
                    }
                    return { question, cached: false };
                });
            };

            // Stage 1.5: Query Rewriting
            const rewriteQuery = async (input) => {
                if (input.cached || !config.features.useQueryRewriting) return input;

                return await telemetry.measureTime(RAG_STAGES.QUERY_REWRITE, async () => {
                    // Skip rewriting for very short queries
                    if (input.question.length < 10) return input;

                    try {
                        const prompt = await promptLoader.formatQueryRewrite(input.question);
                        const response = await llm.invoke(prompt);
                        const refinedQuery = typeof response === 'string' ? response : response.content;

                        logger.info(`🔄 Rewrote query: "${input.question}" -> "${refinedQuery}"`);

                        return {
                            ...input,
                            refinedQuery: refinedQuery.trim(),
                        };
                    } catch (error) {
                        logger.warn('⚠️ Query rewriting failed, using original:', error);
                        return input;
                    }
                });
            };

            // Stage 2.5: Intent Classification
            const classifyIntent = async (input) => {
                if (input.cached) return input;

                return await telemetry.measureTime('INTENT_CLASSIFY', async () => {
                    try {
                        const prompt = await promptLoader.formatIntentClassify(input.question);
                        const response = await llm.invoke(prompt);
                        let intent = typeof response === 'string' ? response : response.content;
                        intent = intent.trim().toUpperCase();

                        // Defaut to CHAT if unclear
                        if (intent.includes('ITINERARY')) {
                            intent = 'ITINERARY';
                        } else {
                            intent = 'CHAT';
                        }

                        logger.info(`🧠 Intent detected: ${intent}`);
                        return {
                            ...input,
                            intent
                        };
                    } catch (error) {
                        logger.error('Intent classification failed', error);
                        return { ...input, intent: 'CHAT' };
                    }
                });
            };

            // Stage 2.6: � Intent Classification (CRITICAL: Food vs Vibe vs Activity)
            const classifyQueryIntent = async (input) => {
                if (input.cached) return input;

                return await telemetry.measureTime('QUERY_INTENT_CLASSIFY', async () => {
                    const intentData = intentClassifier.classify(input.question);
                    
                    logger.info(`🎯 Query Intent: ${intentData.intent}`);
                    
                    if (intentData.intent === 'FOOD_ENTITY') {
                        logger.info(`🍜 FOOD MODE: "${intentData.keyword}" → HARD FILTER`);
                    } else if (intentData.intent === 'PLACE_VIBE') {
                        logger.info(`💕 VIBE MODE: "${intentData.keyword}" → TAG FILTER [${intentData.tags.join(', ')}]`);
                    } else if (intentData.intent === 'ACTIVITY') {
                        logger.info(`🎵 ACTIVITY MODE: "${intentData.keyword}"`);
                    }

                    return {
                        ...input,
                        queryIntent: intentData.intent,
                        queryKeyword: intentData.keyword,
                        queryTags: intentData.tags,
                        queryMustQuery: intentData.mustQuery
                    };
                });
            };

            // Stage 3: Retrieval
            const retrieve = async (input) => {
                if (input.cached) return input;

                return await telemetry.measureTime(RAG_STAGES.RETRIEVAL, async () => {
                    // Use refined query if available, otherwise original
                    const queryToUse = input.refinedQuery || input.question;

                    // If ITINERARY, we might want to fetch more results or different strategy
                    // For now, keep it simple but maybe increase limit later if needed
                    const results = await basicRetriever.retrieve(queryToUse);
                    return {
                        ...input,
                        retrievedDocs: results,
                    };
                });
            };

            // Stage 3.5: Hybrid/Keyword Augmentation
            const keywordAugment = async (input) => {
                if (input.cached) return input;

                return await telemetry.measureTime('KEYWORD_AUGMENT', async () => {
                    let query = (input.refinedQuery || input.question).toLowerCase().trim();

                    // --- Context Awareness: Time ---
                    const now = new Date();
                    const hour = now.getHours();
                    const isLateNight = hour >= 22 || hour < 4;

                    // 🏨 ACCOMMODATION DETECTION (Nhận diện yêu cầu lưu trú)
                    const accommodationKeywords = [
                        'về muộn', 'về khuya', 'hẹn hò về muộn', 'hẹn hò tối muộn',
                        'cần chỗ nghỉ', 'ở lại qua đêm', 'chỗ nghỉ qua đêm',
                        'nghỉ qua đêm', 'ngủ qua đêm', 'nghỉ đêm', 'qua đêm',
                        'nhà nghỉ', 'homestay', 'khách sạn', 'resort', 'chỗ ngủ',
                        'chỗ ở', 'thuê phòng', 'đặt phòng', 'book phòng'
                    ];
                    
                    // 💎 LUXURY TIER DETECTION (Nhận diện nhu cầu cao cấp)
                    const luxuryKeywords = [
                        'cao cấp', 'xịn', 'sang trọng', 'luxury', 'đẳng cấp',
                        'high-end', 'premium', '5 sao', 'sang', 'vip',
                        'đắt', 'chất lượng cao', 'resort', 'khách sạn tốt'
                    ];
                    
                    const needsAccommodation = accommodationKeywords.some(kw => query.includes(kw));
                    const needsLuxury = luxuryKeywords.some(kw => query.includes(kw));
                    
                    if (needsAccommodation) {
                        logger.info('🏨 Accommodation request detected! Filtering category="Lưu trú"');
                        input.accommodationMode = true;
                        
                        // Determine price tier
                        if (needsLuxury) {
                            logger.info('💎 LUXURY MODE: Filtering high-end accommodations (≥500k)');
                            input.luxuryMode = true;
                            input.minPrice = 500000; // 500k+ for luxury
                        } else {
                            logger.info('🏠 STANDARD MODE: Mix of budget & mid-range accommodations');
                            input.luxuryMode = false;
                            input.minPrice = null; // No filter, random mix
                        }
                    }

                    if (isLateNight) {
                        // Automatically append "late night" context to search
                        // This helps find places that are actually open or tagged for nightlife
                        logger.info('🌙 Late night detected, augmenting search query...');
                        // We don't change the visible query, but the search query
                        // Actually searchPlaces does fuzzy search, so appending might dilute if not careful
                        // But specialized tags like "xuyên đêm" are useful.
                        // Let's rely on filter/scoring later? 
                        // For now, let's append only if the user didn't ask about time.
                        if (!query.includes('đêm') && !query.includes('muộn')) {
                            // query += " mở xuyên đêm"; // Risky if exact match
                        }
                    }

                    try {
                        const promises = [];

                        // Increase limit for itinerary to get diversity
                        const textLimit = input.intent === 'ITINERARY' ? 20 : 10;
                        
                        // 🏨 Apply category filter for accommodation mode
                        const categoryFilter = input.accommodationMode ? 'Lưu trú' : null;
                        
                        // 💎 Apply price filter for luxury mode
                        const priceFilter = input.minPrice || null;
                        
                        // � Apply filter based on Query Intent Type
                        const queryIntent = input.queryIntent || 'GENERAL';
                                                // 📍 NEAR ME OPTIMIZATION: For generic queries + location
                        const hasLocation = input.context?.location?.lat && input.context?.location?.lng;
                        const nearMeMode = input.context?.nearMe || false;
                        
                        if (nearMeMode && hasLocation && isGenericFoodQuery(query)) {
                            // Use MongoDB $geoNear for fast nearby search
                            const { lat, lng } = input.context.location;
                            logger.info(`📍 NEAR ME MODE: Generic query "${query}" → $geoNear search`);
                            
                            try {
                                const nearbyPlaces = await searchNearbyPlaces(
                                    lat, 
                                    lng, 
                                    5, // 5km radius
                                    textLimit, 
                                    { category: categoryFilter, minPrice: priceFilter }
                                );
                                
                                // Convert to document format
                                const mongoDocs = nearbyPlaces.map(p => ({
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
                                        source: 'mongo-nearby',
                                        coordinates: p.location?.coordinates || null,
                                        distanceKm: p.distanceKm
                                    }
                                }));
                                
                                logger.info(`✅ Found ${mongoDocs.length} nearby places`);
                                
                                return {
                                    ...input,
                                    retrievedDocs: mongoDocs
                                };
                            } catch (err) {
                                logger.warn('⚠️ $geoNear failed, fallback to normal search:', err);
                                // Fallback to normal search
                            }
                        }
                        
                        // Standard search paths
                        if (queryIntent === 'FOOD_ENTITY') {
                            // HARD keyword filter for food
                            const foodMustQuery = input.queryMustQuery;
                            logger.info(`🔒 HARD FILTER: Only places matching "${input.queryKeyword}"`);
                            promises.push(searchPlaces(query, textLimit, categoryFilter, priceFilter, foodMustQuery));
                            
                        } else if (queryIntent === 'PLACE_VIBE') {
                            // TAG/MOOD filter for vibe (hẹn hò, lãng mạn, chill...)
                            const vibeTags = input.queryTags || [];
                            logger.info(`💕 VIBE FILTER: Tags [${vibeTags.join(', ')}]`);
                            promises.push(searchPlacesByVibe(vibeTags, textLimit, categoryFilter, priceFilter));
                            
                        } else if (queryIntent === 'ACTIVITY') {
                            // Activity-based search
                            const activityTags = input.queryTags || [];
                            logger.info(`🎵 ACTIVITY FILTER: Tags [${activityTags.join(', ')}]`);
                            promises.push(searchPlacesByVibe(activityTags, textLimit, categoryFilter, priceFilter));
                            
                        } else {
                            // GENERAL: Normal text search
                            logger.info(`🔍 GENERAL SEARCH: "${query}"`);
                            promises.push(searchPlaces(query, textLimit, categoryFilter, priceFilter));
                        }

                        // 2. Smart Address Regex Search (for all intents)
                        // Detect patterns: "ngõ tự do" -> search for /(ngõ|ng\.?)\s*tự\s*do/i
                        // Common prefixes
                        const addressMarkers = [
                            { key: 'ngõ', regex: '(?:ngõ|ng\\.?)' },
                            { key: 'ngách', regex: '(?:ngách|ngh\\.?)' },
                            { key: 'phố', regex: '(?:phố|p\\.?)' },
                            { key: 'đường', regex: '(?:đường|đ\\.?)' },
                            { key: 'quận', regex: '(?:quận|q\\.?)' },
                            { key: 'phường', regex: '(?:phường|p\\.?)' }
                        ];

                        let addressPatternRaw = null;
                        let prefixRegex = null;

                        for (const marker of addressMarkers) {
                            // Check if marker exists as a whole word or start
                            if (query.includes(marker.key)) {
                                const idx = query.indexOf(marker.key);
                                let afterMarker = query.substring(idx + marker.key.length).trim();

                                // Remove trailing noise words often used in queries
                                // "ngõ tự do với 500k" -> remove "với 500k"
                                // "ngõ tự do không" -> remove " không"
                                const stopWords = [
                                    ' với ', ' giá ', ' khoảng ', ' tầm ', ' hết ', ' cho ', ' có ',
                                    ' không', ' nào', ' nhỉ', ' ạ', ' ở đâu', ' đâu'
                                ];
                                for (const word of stopWords) {
                                    // Case insensitive check
                                    const lowerAfter = afterMarker.toLowerCase();
                                    const lowerWord = word.toLowerCase();
                                    const idx = lowerAfter.indexOf(lowerWord);

                                    if (idx !== -1) {
                                        afterMarker = afterMarker.substring(0, idx).trim();
                                        // Continue checking? Usually one cut is enough if list is ordered or we just cut the tail.
                                        // But if we have "ngõ tự do nào không", cutting " nào" leaves "ngõ tự do". Correct.
                                    }
                                }

                                if (afterMarker) {
                                    addressPatternRaw = afterMarker;
                                    prefixRegex = marker.regex;
                                    break;
                                }
                            }
                        }

                        if (addressPatternRaw && prefixRegex) {
                            // Escape special regex chars
                            const safeSuffix = addressPatternRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            // Allow flexible spacing between words
                            const flexibleSuffix = safeSuffix.split(/\s+/).join('\\s+');
                            const regex = new RegExp(`${prefixRegex}\\s+${flexibleSuffix}`, 'i');

                            logger.info(`🎯 Address Regex detected: ${regex}`);
                            
                            // Only apply foodMustQuery for FOOD_ENTITY intent
                            const addressMustQuery = (queryIntent === 'FOOD_ENTITY') ? input.queryMustQuery : null;
                            promises.push(searchPlacesByRegex(regex, 5, categoryFilter, priceFilter, addressMustQuery));
                        }

                        const results = await Promise.all(promises);
                        const places = results.flat();

                        if (!places || places.length === 0) return input;

                        logger.info(`🔍 Hybrid search found ${places.length} results`);

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
                                // Pass coordinates for distance calculation
                                coordinates: p.location?.coordinates || null
                            }
                        }));

                        // Merge results, preferring vector results if duplicates (or just appending)
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

                    } catch (error) {
                        logger.warn('⚠️ Keyword augmentation failed:', error);
                        return input;
                    }
                });
            };

            // Stage 4: Reranking (Cohere + Location)
            const rerank = async (input) => {
                if (input.cached || !input.retrievedDocs?.length) return input;

                return await telemetry.measureTime(RAG_STAGES.RERANKING, async () => {
                    let docs = input.retrievedDocs;

                    // --- Context Awareness: Location ---
                    if (input.context?.location) {
                        const { lat: userLat, lng: userLng } = input.context.location;
                        const queryLower = input.question.toLowerCase();

                        // Check if user explicitly asked for proximity
                        const isProximityQuery =
                            queryLower.includes('gần') ||
                            queryLower.includes('quanh') ||
                            queryLower.includes('near');

                        if (isProximityQuery) {
                            logger.info('📍 Proximity query detected. Calculating distances...');

                            // Simple Haversine distance
                            const calculateDistance = (lat1, lon1, lat2, lon2) => {
                                const R = 6371; // km
                                const dLat = (lat2 - lat1) * Math.PI / 180;
                                const dLon = (lon2 - lon1) * Math.PI / 180;
                                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                return R * c;
                            };

                            // Calculate distances for all docs that have coordinates
                            docs = docs.map(doc => {
                                let distance = Infinity;
                                if (doc.metadata?.coordinates && Array.isArray(doc.metadata.coordinates)) {
                                    // MongoDB stores [lng, lat]
                                    const [lng, lat] = doc.metadata.coordinates;
                                    if (lat && lng) {
                                        distance = calculateDistance(userLat, userLng, lat, lng);
                                    }
                                }
                                return { ...doc, metadata: { ...doc.metadata, distance } };
                            });

                            // Re-sort primarily by distance if it's a proximity query
                            docs = docs.sort((a, b) => (a.metadata.distance || Infinity) - (b.metadata.distance || Infinity));
                            logger.info('📍 Sorted results by distance.');
                        }
                    }

                    // We stick to the plan: Rerank top results with Cohere first for Semantic Relevance
                    // Then if proximity is key, we perform a final re-sort or boost.

                    let reranked = await reranker.rerank(
                        input.question,
                        docs
                    );

                    // Post-Rerank Adjustment for Proximity
                    // If proximity query, we prioritize strictly by distance among the top semantic candidates
                    if (input.context?.location) {
                        const { lat: userLat, lng: userLng } = input.context.location;
                        const queryLower = input.question.toLowerCase();
                        if (queryLower.includes('gần') || queryLower.includes('quanh') || queryLower.includes('near') || queryLower.includes('tôi')) {
                            const calculateDistance = (lat1, lon1, lat2, lon2) => {
                                const R = 6371;
                                const dLat = (lat2 - lat1) * Math.PI / 180;
                                const dLon = (lon2 - lon1) * Math.PI / 180;
                                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                return R * c;
                            };

                            reranked = reranked.map(doc => {
                                let distance = Infinity;
                                if (doc.metadata?.coordinates) {
                                    const [lng, lat] = doc.metadata.coordinates;
                                    if (lat && lng) distance = calculateDistance(userLat, userLng, lat, lng);
                                }
                                return { ...doc, metadata: { ...doc.metadata, distance } };
                            }).sort((a, b) => (a.metadata.distance || Infinity) - (b.metadata.distance || Infinity));
                        }
                    }

                    return {
                        ...input,
                        retrievedDocs: reranked,
                    };
                });
            };

            // Stage 4.5: Local Reordering (Keyword Boost)
            const localReorder = (input) => {
                if (input.cached || !input.retrievedDocs?.length) return input;

                const queryLower = input.question.toLowerCase().normalize('NFC');

                // Simple scoring function
                const scoreDoc = (doc) => {
                    const name = (doc.name || doc.metadata?.name || '').toLowerCase();
                    const address = (doc.metadata?.address || '').toLowerCase();
                    const query = queryLower;
                    let score = 0;

                    // Boost exact name match
                    if (name.includes(query)) score += 10;

                    // Boost if name parts match
                    const queryParts = query.split(' ').filter(p => p.length > 1); // Filter single chars
                    const nameMatches = queryParts.filter(p => name.includes(p)).length;
                    score += nameMatches * 0.5;

                    // Boost address match (CRITICAL for "Ngõ Tự Do" queries)
                    // Handle "ngõ" vs "ng." normalization
                    const normalizedAddress = address.replace(/ng\./g, 'ngõ').replace(/p\./g, 'phường').replace(/q\./g, 'quận');
                    const normalizedQuery = query.replace(/ng\./g, 'ngõ').replace(/p\./g, 'phường').replace(/q\./g, 'quận');

                    if (normalizedAddress.includes(normalizedQuery)) {
                        score += 8; // High boost for exact address match
                    } else {
                        // Check partial address match (e.g. "ngõ tự do" in "ng. tự do, ...")
                        const addressMatches = queryParts.filter(p => normalizedAddress.includes(p)).length;
                        if (addressMatches >= 2) { // At least 2 words match (e.g. "tự" and "do")
                            score += addressMatches * 1.5;
                        }
                    }

                    return score;
                };

                const reordered = [...input.retrievedDocs].sort((a, b) => {
                    const scoreA = scoreDoc(a);
                    const scoreB = scoreDoc(b);

                    if (Math.abs(scoreA - scoreB) > 0.1) {
                        return scoreB - scoreA; // Sort by boost score
                    }
                    return 0; // Maintain previous order (Cohere/Vector)
                });

                return {
                    ...input,
                    retrievedDocs: reordered,
                };
            };

            // Stage 5: Format Context
            const formatContext = (input) => {
                if (input.cached) return input;

                const context = input.retrievedDocs
                    .map((doc, i) => {
                        const placeName = doc.name || doc.metadata?.name || `Địa điểm ${i + 1}`;
                        const address = doc.metadata?.address ? `Địa chỉ: ${doc.metadata.address}` : '';
                        const price = doc.metadata?.price ? `Giá: ${doc.metadata.price} VND` : 'Giá: Liên hệ';
                        const category = doc.metadata?.category ? `(${doc.metadata.category})` : '';

                        // Add Rank, Price, Category explicitly to guide LLM for itinerary planning
                        return `RANK #${i + 1} [${placeName}] ${category}\n${address} | ${price}\n${doc.content}`;
                    })
                    .join('\n\n---\n\n');

                return {
                    ...input,
                    context,
                };
            };

            // Stage 6: Create Prompt
            const createPrompt = async (input) => {
                if (input.cached) return input;

                return await telemetry.measureTime(RAG_STAGES.PROMPT_CONSTRUCTION, async () => {
                    // Fetch dynamic context
                    const weatherData = await weatherService.getCurrentWeather();
                    const now = new Date();
                    // Format: 14:30 - Thứ 3, 16/01/2024
                    const datetime = now.toLocaleString('vi-VN', {
                        hour: '2-digit', minute: '2-digit',
                        weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
                        timeZone: 'Asia/Bangkok'
                    });

                    // --- Context Awareness: Weather ---
                    // --- Context Awareness: Weather ---
                    let weatherWarning = "";
                    const desc = weatherData?.description || "";
                    const sky = weatherData?.skyConditions || "";

                    const isRaining = desc.toLowerCase().includes('mưa') ||
                        desc.toLowerCase().includes('rain') ||
                        (sky && sky.includes('Rain'));

                    if (isRaining) {
                        weatherWarning = "⚠️ WARNING: It is currently RAINING in Hanoi. You MUST prioritize Indoor places. " +
                            "Do NOT suggest open-air rooftops, street food (vỉa hè) without cover, or parks unless explicitly asked. " +
                            "Highlight 'cozy', 'warm', 'shelter' qualities.";
                        logger.info('☔️ Rain detected, injecting strict prompt warning.');
                    }

                    // --- Context Awareness: Time ---
                    const currentHour = now.getHours();
                    let timeContext = "";
                    if (currentHour >= 22 || currentHour < 5) {
                        timeContext = "It is Late Night. Ensure suggested places are OPEN LATE or 24/7. " +
                            "Prioritize nightlife, 24h cafes, or late-night food spots (Xôi Yến, Phở gánh, etc).";
                    }

                    // Append to system instructions effectively
                    // We'll append this to the weather description field for now 
                    // since the prompt templates use {currentWeather}
                    const enhancedWeatherDesc = `${weatherData.fullDescription}\n${weatherWarning}\n${timeContext}`;

                    let formatted;
                    if (input.intent === 'ITINERARY') {
                        formatted = await promptLoader.formatItineraryGen(
                            input.context,
                            input.question,
                            enhancedWeatherDesc, // Pass enhanced description
                            datetime
                        );
                    } else {
                        formatted = await promptLoader.formatRAGQuery(
                            input.context,
                            input.question,
                            enhancedWeatherDesc, // Pass enhanced description
                            datetime
                        );
                    }

                    return {
                        ...input,
                        prompt: formatted,
                    };
                });
            };

            // Stage 7: LLM Inference
            const llmInference = async (input) => {
                if (input.cached) return input;

                return await telemetry.measureTime(RAG_STAGES.LLM_INFERENCE, async () => {

                    // We rely on the robust parsing logic below instead of strict json_mode
                    // to avoid potential compatibility issues with llm.bind()

                    const response = await llm.invoke(input.prompt);

                    let answer = '';
                    if (typeof response === 'string') {
                        answer = response;
                    } else if (response?.content) {
                        answer = response.content;
                    } else if (response?.kwargs?.content) {
                        answer = response.kwargs.content;
                    } else if (response?.text) {
                        answer = response.text;
                    }

                    // If itinerary, try to parse JSON
                    let structuredData = null;
                    if (input.intent === 'ITINERARY') {
                        try {
                            // Locate JSON boundaries
                            const firstOpen = answer.indexOf('{');
                            const lastClose = answer.lastIndexOf('}');

                            let jsonString = answer;
                            if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
                                jsonString = answer.substring(firstOpen, lastClose + 1);
                            }

                            // Basic Cleanup
                            jsonString = jsonString
                                .replace(/[\u0000-\u0019]+/g, "") // Remove control chars
                                .trim();

                            structuredData = JSON.parse(jsonString);
                            logger.info('✅ Successfully parsed Itinerary JSON');
                        } catch (e) {
                            logger.warn('⚠️ Failed to parse itinerary JSON', e);
                            logger.debug('Raw answer:', answer);
                            // Fallback attempts could go here (e.g. fix keys)
                        }
                    }

                    return {
                        ...input,
                        answer,
                        structuredData
                    };
                });
            };

            // Stage 8: Output Guard
            const guard = async (input) => {
                return await telemetry.measureTime(RAG_STAGES.OUTPUT_GUARD, async () => {
                    const validated = await outputGuard.validate(input.answer);
                    return {
                        ...input,
                        answer: validated,
                    };
                });
            };

            // Stage 9: Cache Response
            const cacheResponse = async (input) => {
                if (!input.cached && input.answer && input.retrievedDocs) {
                    await cacheClient.setCache(input.question, {
                        question: input.question,
                        answer: input.answer,
                        retrievedDocs: input.retrievedDocs,
                        context: input.context,
                        intent: input.intent,
                        structuredData: input.structuredData
                    });
                }
                return input;
            };

            // Compose pipeline
            this.chain = RunnableSequence.from([
                guardedInput,
                cachedResponse,
                rewriteQuery,
                classifyIntent, // Intent classification (ITINERARY vs CHAT)
                classifyQueryIntent, // 🎯 Query intent (FOOD vs VIBE vs ACTIVITY)
                retrieve,
                keywordAugment, // Hybrid Search with intent-aware filtering
                rerank,
                localReorder,
                formatContext,
                createPrompt,
                llmInference,
                // guard, // Output Guard removed for speed optimization
                cacheResponse,
            ]);

            this.initialized = true;
            logger.info('✅ RAG pipeline initialized');

            return this.chain;
        } catch (error) {
            logger.error('❌ Pipeline initialization failed:', error);
            throw error;
        }
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

            // Pass input as object initially? 
            // The chain starts with `guardedInput` which allows a string directly if configured,
            // but here we constructed it to take { question } or strictly defined flow.
            // My implementation above of `guardedInput` takes `input` which in `RunnableSequence` 
            // is the first arg.
            // However `guardedInput` implementation: `return await inputGuard.validate(input.question);`
            // implies it expects an object `{ question: ... }`.

            const result = await this.chain.invoke({
                question,
                ...metadata,
            });

            logger.info(`✅ Response generated using model: ${config.openai.model}`);

            // Deduplicate places from retrieved docs
            const uniquePlacesMap = new Map();
            if (result.retrievedDocs) {
                result.retrievedDocs.forEach(doc => {
                    // Start of Selection: Handle metadata structure differences
                    const placeId = doc.metadata?.originalId || doc.metadata?.id;
                    if (placeId && !uniquePlacesMap.has(placeId)) {
                        // Construct place object compatible with frontend PropertyCard
                        uniquePlacesMap.set(placeId, {
                            _id: placeId,
                            name: doc.metadata.name,
                            address: doc.metadata.address,
                            category: doc.metadata.category,
                            priceRange: { max: doc.metadata.price || 0 }, // Approx
                            averageRating: doc.metadata.rating,
                            totalReviews: doc.metadata.reviewCount,
                            images: [doc.metadata.image], // Single image from metadata
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
                places: Array.from(uniquePlacesMap.values()), // Return unique places for UI
                sources: result.retrievedDocs?.map((doc) => ({
                    content: doc.content,
                    source: doc.source,
                    score: doc.score,
                    metadata: doc.metadata
                })) || [],
                intent: result.intent,
                structuredData: result.structuredData,
                // Add debug info about model used
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
