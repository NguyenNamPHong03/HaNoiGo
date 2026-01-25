/**
 * Main Chat Pipeline - Complete RAG Workflow (Refactored)
 * Mục đích: Orchestrate entire RAG flow từ input đến output
 * Trách nhiệm: Guard -> Cache -> Retrieval -> LLM -> Response
 * 
 * REFACTORED: Tách thành các stage modules để dễ maintain
 * 
 * @architecture Modular Pipeline (8 stages)
 * - 01-InputProcessor: Input validation & caching
 * - 02-QueryAnalyzer: Query rewriting & intent classification
 * - 03-SemanticRetrieval: Vector DB search
 * - 04-HybridSearchEngine: Nearby/Keyword/Address search
 * - 05-RankingEngine: Rerank, filter, sort
 * - 06-PromptBuilder: Context formatting & prompt creation
 * - 07-LLMInvoker: LLM inference
 * - 08-ResponseFormatter: Final response formatting
 */

import { RunnableSequence } from '@langchain/core/runnables';
import config from '../config/index.js';
import enhancedCacheClient from '../core/enhancedCacheClient.js';
import llmFactory from '../core/llmFactory.js';
import promptLoader from '../prompts/promptLoader.js';
import reranker from '../retrieval/reranker.js';
import enhancedLogger from '../utils/enhancedLogger.js';

// Import Stage Modules
import inputProcessor from './stages/01-InputProcessor.js';
import queryAnalyzer from './stages/02-QueryAnalyzer.js';
import semanticRetrieval from './stages/03-SemanticRetrieval.js';
import hybridSearchEngine from './stages/04-HybridSearchEngine.js';
import rankingEngine from './stages/05-RankingEngine.js';
import promptBuilder from './stages/06-PromptBuilder.js';
import llmInvoker from './stages/07-LLMInvoker.js';
import responseFormatter from './stages/08-ResponseFormatter.js';

const logger = enhancedLogger.child('MainChatPipeline');

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
            logger.info('Building RAG pipeline (Modular Architecture)...');

            // Initialize enhanced cache
            await enhancedCacheClient.initialize();
            
            this.llm = await llmFactory.getLLM();
            await promptLoader.initialize();
            await reranker.initialize();

            // Set LLM for stages that need it
            queryAnalyzer.setLLM(this.llm);
            llmInvoker.setLLM(this.llm);

            // Compose pipeline with modular stages
            this.chain = RunnableSequence.from([
                // Stage 1: Input Processing & Cache Check
                inputProcessor.processInputGuard.bind(inputProcessor),
                inputProcessor.processSemanticCache.bind(inputProcessor),
                
                // Stage 2: Query Analysis
                queryAnalyzer.analyzeParallel.bind(queryAnalyzer),
                
                // Stage 3-4: Retrieval
                semanticRetrieval.retrieve.bind(semanticRetrieval),
                hybridSearchEngine.augmentWithKeywords.bind(hybridSearchEngine),
                
                // Stage 5: Ranking & Filtering
                rankingEngine.rerank.bind(rankingEngine),
                rankingEngine.applyDietaryFilter.bind(rankingEngine),
                rankingEngine.sortByLocation.bind(rankingEngine),
                
                // Stage 6-7: Prompt & LLM
                promptBuilder.formatContext.bind(promptBuilder),
                promptBuilder.createPrompt.bind(promptBuilder),
                llmInvoker.invoke.bind(llmInvoker),
                
                // Stage 8: Cache Response
                inputProcessor.cacheResponse.bind(inputProcessor),
            ]);

            this.initialized = true;
            logger.info('RAG pipeline initialized successfully', {
                stages: 8,
                cacheEnabled: true,
                model: config.openai.model,
            });

            return this.chain;
        } catch (error) {
            logger.error('Pipeline initialization failed', error);
            throw error;
        }
    }

    /**
     * Execute the pipeline with conversation context support
     * PHASE 4: Added session management and weather context
     */
    async execute(question, metadata = {}) {
        const correlationId = enhancedLogger.generateCorrelationId();
        enhancedLogger.setCorrelationId(correlationId);
        
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            // PHASE 4: Initialize conversation manager
            const conversationManager = (await import('../core/conversationManager.js')).default;
            if (!conversationManager.initialized) {
                await conversationManager.initialize();
            }

            // Get or create session
            let sessionId = metadata.sessionId;
            if (!sessionId && metadata.userId) {
                sessionId = conversationManager.generateSessionId(metadata.userId);
            }

            // Get conversation state
            const conversationState = sessionId 
                ? await conversationManager.getState(sessionId)
                : null;

            // PHASE 3: Get weather context (if location available)
            let weatherContext = null;
            if (metadata.location || conversationState?.context?.location) {
                try {
                    const location = metadata.location || conversationState.context.location;
                    // Simple weather integration (can be enhanced with actual API)
                    weatherContext = await this._getWeatherContext(location);
                } catch (err) {
                    logger.warn('Weather context fetch failed:', err.message);
                }
            }

            // PHASE 3: Get time context
            const timeContext = this._getTimeContext();

            logger.info('Processing query', {
                query: question.substring(0, 100),
                correlationId,
                hasSession: !!sessionId,
                hasWeather: !!weatherContext,
                timeContext: timeContext.period
            });

            // Append user message to conversation
            if (sessionId) {
                await conversationManager.appendMessage(sessionId, {
                    role: 'user',
                    content: question,
                    userId: metadata.userId
                });
            }

            const result = await this.chain.invoke({
                question,
                context: {
                    ...metadata,
                    sessionId,
                    conversationHistory: conversationState?.history,
                    weatherContext,
                    timeContext
                },
                ...metadata,
                userPreferences: metadata.userPreferences || null,
                correlationId,
            });

            // PHASE 4: Handle conversation references
            if (result.conversationReference) {
                const response = await this._handleConversationReference(
                    result.conversationReference,
                    sessionId
                );
                
                if (sessionId) {
                    await conversationManager.appendMessage(sessionId, {
                        role: 'assistant',
                        content: response.message
                    });
                }
                
                return response;
            }

            logger.info('Response generated successfully', {
                model: config.openai.model,
                cached: result.cached || false,
                correlationId,
            });

            // Use ResponseFormatter to format final response
            const formattedResponse = responseFormatter.formatResponse(result);

            // PHASE 4: Update conversation context
            if (sessionId && formattedResponse.data?.places) {
                await conversationManager.updateContext(sessionId, {
                    places: formattedResponse.data.places,
                    intent: result.intent,
                    location: metadata.location
                });

                // Append assistant message
                await conversationManager.appendMessage(sessionId, {
                    role: 'assistant',
                    content: formattedResponse.data.answer || formattedResponse.message,
                    metadata: {
                        intent: result.intent,
                        placeIds: formattedResponse.data.places?.map(p => p._id)
                    }
                });
            }

            return formattedResponse;
        } catch (error) {
            logger.error('Pipeline execution failed', error, {
                query: question.substring(0, 100),
                correlationId,
            });
            throw error;
        } finally {
            enhancedLogger.setCorrelationId(null);
        }
    }

    /**
     * PHASE 4: Handle conversation references (direct answers)
     */
    async _handleConversationReference(reference, sessionId) {
        const { type, targetPlace, question } = reference;

        if (type === 'REFERENCE') {
            // Direct reference: "quán đầu tiên"
            return {
                success: true,
                data: {
                    intent: 'REFERENCE',
                    answer: `Quán "${targetPlace.name}" nằm tại ${targetPlace.address}. ${targetPlace.description || ''}`,
                    places: [targetPlace]
                }
            };
        }

        if (type === 'FOLLOW_UP') {
            // Follow-up question about a place
            const queryLower = question.toLowerCase();
            
            if (queryLower.includes('mở cửa') || queryLower.includes('phục vụ')) {
                const hours = targetPlace.openingHours || 'Chưa có thông tin giờ mở cửa';
                return {
                    success: true,
                    data: {
                        intent: 'FOLLOW_UP',
                        answer: `Quán "${targetPlace.name}" ${hours}`,
                        places: [targetPlace]
                    }
                };
            }

            if (queryLower.includes('giá')) {
                const price = targetPlace.priceRange 
                    ? `${targetPlace.priceRange.min?.toLocaleString('vi-VN')} - ${targetPlace.priceRange.max?.toLocaleString('vi-VN')}đ`
                    : 'Chưa có thông tin giá';
                return {
                    success: true,
                    data: {
                        intent: 'FOLLOW_UP',
                        answer: `Quán "${targetPlace.name}" có mức giá khoảng ${price}`,
                        places: [targetPlace]
                    }
                };
            }

            if (queryLower.includes('địa chỉ') || queryLower.includes('ở đâu')) {
                return {
                    success: true,
                    data: {
                        intent: 'FOLLOW_UP',
                        answer: `Quán "${targetPlace.name}" nằm tại ${targetPlace.address}, ${targetPlace.district}`,
                        places: [targetPlace]
                    }
                };
            }
        }

        // Default fallback
        return {
            success: true,
            data: {
                intent: 'GENERAL',
                answer: 'Xin lỗi, em chưa hiểu rõ câu hỏi của bạn. Bạn có thể hỏi cụ thể hơn được không?',
                places: []
            }
        };
    }

    /**
     * PHASE 3: Get weather context (placeholder for actual API)
     */
    async _getWeatherContext(location) {
        // TODO: Integrate with Open-Meteo or OpenWeatherMap API
        // For now, return placeholder
        return {
            temp: 28,
            condition: 'sunny',
            isRaining: false,
            humidity: 70
        };
    }

    /**
     * PHASE 3: Get time-of-day context
     */
    _getTimeContext() {
        const hour = new Date().getHours();
        
        let period = 'general';
        let suggestion = '';

        if (hour >= 6 && hour < 10) {
            period = 'breakfast';
            suggestion = 'Khung giờ ăn sáng, ưu tiên quán phở, bánh mì, cafe';
        } else if (hour >= 11 && hour < 14) {
            period = 'lunch';
            suggestion = 'Giờ ăn trưa, ưu tiên nhà hàng, quán cơm, bún chả';
        } else if (hour >= 17 && hour < 21) {
            period = 'dinner';
            suggestion = 'Giờ ăn tối, ưu tiên nhà hàng, quán ăn tối, lẩu';
        } else if (hour >= 21 || hour < 6) {
            period = 'late_night';
            suggestion = 'Đêm khuya, ưu tiên quán cafe, ăn vặt, quán mở cửa khuya';
        } else {
            period = 'afternoon';
            suggestion = 'Buổi chiều, ưu tiên quán cafe, trà sữa, điểm tâm';
        }

        return {
            hour,
            period,
            suggestion
        };
    }
}

export default new MainChatPipeline();
