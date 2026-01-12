/**
 * Main Chat Pipeline - Complete RAG Workflow
 * Mục đích: Orchestrate entire RAG flow từ input đến output
 * Trách nhiệm: Guard -> Cache -> Retrieval -> LLM -> Response
 */

import { RunnableSequence } from '@langchain/core/runnables';
import llmFactory from '../core/llmFactory.js';
import cacheClient from '../core/cacheClient.js';
import promptLoader from '../prompts/promptLoader.js';
import inputGuard from '../guardrails/inputGuard.js';
import outputGuard from '../guardrails/outputGuard.js';
import basicRetriever from '../retrieval/strategies/basicRetriever.js';
import reranker from '../retrieval/reranker.js';
import telemetry from '../core/telemetry.js';
import { RAG_STAGES } from '../config/constants.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';
import { searchPlaces, searchPlacesByRegex } from '../../placeService.js';

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

            // Stage 3: Retrieval
            const retrieve = async (input) => {
                if (input.cached) return input;

                return await telemetry.measureTime(RAG_STAGES.RETRIEVAL, async () => {
                    // Use refined query if available, otherwise original
                    const queryToUse = input.refinedQuery || input.question;
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
                    const query = (input.refinedQuery || input.question).toLowerCase().trim();

                    try {
                        const promises = [];

                        // 1. Text Search (General) (increased limit)
                        promises.push(searchPlaces(query, 10));

                        // 2. Smart Address Regex Search
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
                            promises.push(searchPlacesByRegex(regex, 5));
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
                                source: 'mongo-hybrid'
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

            // Stage 4: Reranking (Cohere)
            const rerank = async (input) => {
                if (input.cached || !input.retrievedDocs?.length) return input;

                return await telemetry.measureTime(RAG_STAGES.RERANKING, async () => {
                    const reranked = await reranker.rerank(
                        input.question, // Always rerank against original intent
                        input.retrievedDocs
                    );
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
                    const formatted = await promptLoader.formatRAGQuery(
                        input.context,
                        input.question
                    );

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
                    const response = await llm.invoke(input.prompt);
                    // ChatOpenAI returns AIMessage object
                    // Try multiple ways to extract the content
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

                    return {
                        ...input,
                        answer,
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
                        context: input.context
                    });
                }
                return input;
            };

            // Compose pipeline
            this.chain = RunnableSequence.from([
                guardedInput,
                cachedResponse,
                rewriteQuery,
                retrieve,
                keywordAugment, // Hybrid Search
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

            logger.info(`✅ Response generated`);

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
            };
        } catch (error) {
            logger.error('❌ Pipeline execution failed:', error);
            throw error;
        }
    }
}

export default new MainChatPipeline();
