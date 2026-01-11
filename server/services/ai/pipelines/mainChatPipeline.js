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
                            question,
                            cached: true,
                            answer: cached,
                        };
                    }
                    return { question, cached: false };
                });
            };

            // Stage 3: Retrieval
            const retrieve = async (input) => {
                if (input.cached) return input;

                return await telemetry.measureTime(RAG_STAGES.RETRIEVAL, async () => {
                    const results = await basicRetriever.retrieve(input.question);
                    return {
                        ...input,
                        retrievedDocs: results,
                    };
                });
            };

            // Stage 4: Reranking
            const rerank = async (input) => {
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
            };

            // Stage 5: Format Context
            const formatContext = (input) => {
                if (input.cached) return input;

                const context = input.retrievedDocs
                    .map((doc, i) => {
                        const placeName = doc.name || doc.metadata?.name || `Địa điểm ${i + 1}`;
                        const address = doc.metadata?.address ? `Địa chỉ: ${doc.metadata.address}` : '';
                        return `[${placeName}] ${address}\n${doc.content}`;
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
                if (!input.cached) {
                    await cacheClient.setCache(input.question, input.answer);
                }
                return input;
            };

            // Compose pipeline
            this.chain = RunnableSequence.from([
                guardedInput,
                cachedResponse,
                retrieve,
                rerank,
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
