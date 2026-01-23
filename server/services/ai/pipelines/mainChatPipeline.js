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
import llmFactory from '../core/llmFactory.js';
import promptLoader from '../prompts/promptLoader.js';
import reranker from '../retrieval/reranker.js';
import logger from '../utils/logger.js';

// Import Stage Modules
import inputProcessor from './stages/01-InputProcessor.js';
import queryAnalyzer from './stages/02-QueryAnalyzer.js';
import semanticRetrieval from './stages/03-SemanticRetrieval.js';
import hybridSearchEngine from './stages/04-HybridSearchEngine.js';
import rankingEngine from './stages/05-RankingEngine.js';
import promptBuilder from './stages/06-PromptBuilder.js';
import llmInvoker from './stages/07-LLMInvoker.js';
import responseFormatter from './stages/08-ResponseFormatter.js';

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
            logger.info('🏗️  Building RAG pipeline (Modular Architecture)...');

            this.llm = await llmFactory.getLLM();
            await promptLoader.initialize();
            await reranker.initialize();

            // Set LLM for stages that need it
            queryAnalyzer.setLLM(this.llm);
            llmInvoker.setLLM(this.llm);

            // Compose pipeline with modular stages
            this.chain = RunnableSequence.from([
                // Stage 1: Input Processing
                inputProcessor.processInputGuard.bind(inputProcessor),
                // inputProcessor.processSemanticCache.bind(inputProcessor), // Cache disabled
                
                // Stage 2: Query Analysis
                queryAnalyzer.analyzeParallel.bind(queryAnalyzer),
                
                // Stage 3-4: Retrieval
                semanticRetrieval.retrieve.bind(semanticRetrieval),
                hybridSearchEngine.augmentWithKeywords.bind(hybridSearchEngine),
                
                // Stage 5: Ranking & Filtering
                rankingEngine.rerank.bind(rankingEngine),
                rankingEngine.applyDietaryFilter.bind(rankingEngine),
                rankingEngine.sortByLocation.bind(rankingEngine),
                // rankingEngine.localReorder.bind(rankingEngine), // Disabled
                
                // Stage 6-7: Prompt & LLM
                promptBuilder.formatContext.bind(promptBuilder),
                promptBuilder.createPrompt.bind(promptBuilder),
                llmInvoker.invoke.bind(llmInvoker),
                
                // inputProcessor.cacheResponse.bind(inputProcessor), // Cache disabled
            ]);

            this.initialized = true;
            logger.info('✅ RAG pipeline initialized (8 modular stages)');

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

            const result = await this.chain.invoke({
                question,
                context: metadata,
                ...metadata,
                userPreferences: metadata.userPreferences || null,
            });

            logger.info(`✅ Response generated using model: ${config.openai.model}`);

            // Use ResponseFormatter to format final response
            return responseFormatter.formatResponse(result);
        } catch (error) {
            logger.error('❌ Pipeline execution failed:', error);
            throw error;
        }
    }
}

export default new MainChatPipeline();
