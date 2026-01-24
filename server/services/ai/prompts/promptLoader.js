/**
 * Prompt Loader - Load và inject variables vào prompts
 * Mục đích: Centralized prompt management
 * Trách nhiệm: Load prompt templates, fill variables, version control
 */

import { PromptTemplate } from '@langchain/core/prompts';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class PromptLoader {
    constructor() {
        this.templates = {};
        this.initialized = false;
    }

    /**
     * Load all prompt templates
     */
    async initialize() {
        if (this.initialized) return;

        try {
            logger.info('📝 Loading prompts...');

            const templatesDir = path.join(__dirname, 'templates');

            // Load system prompt
            const systemPrompt = await fs.readFile(
                path.join(templatesDir, 'system.v1.txt'),
                'utf-8'
            );
            this.templates.system = systemPrompt;

            // Load RAG query prompt
            const ragQueryPrompt = await fs.readFile(
                path.join(templatesDir, 'rag_query.v1.txt'),
                'utf-8'
            );
            this.templates.ragQuery = new PromptTemplate({
                template: ragQueryPrompt,
                inputVariables: ['context', 'question', 'weather', 'datetime', 'userPreferences'],
            });

            // Load query rewrite prompt
            const queryRewritePrompt = await fs.readFile(
                path.join(templatesDir, 'query_rewrite.v1.txt'),
                'utf-8'
            );
            this.templates.queryRewrite = new PromptTemplate({
                template: queryRewritePrompt,
                inputVariables: ['original_query'],
            });

            // Load intent classify prompt
            const intentClassifyPrompt = await fs.readFile(
                path.join(templatesDir, 'intent_classify.v1.txt'),
                'utf-8'
            );
            this.templates.intentClassify = new PromptTemplate({
                template: intentClassifyPrompt,
                inputVariables: ['question'],
            });

            // Load itinerary generation prompt
            const itineraryGenPrompt = await fs.readFile(
                path.join(templatesDir, 'itinerary_gen.v1.txt'),
                'utf-8'
            );
            this.templates.itineraryGen = new PromptTemplate({
                template: itineraryGenPrompt,
                inputVariables: ['question', 'context', 'weather', 'datetime', 'userPreferences'],
            });

            this.initialized = true;
            logger.info('✅ Prompts loaded successfully');
        } catch (error) {
            logger.error('❌ Failed to load prompts:', error);
            throw error;
        }
    }

    /**
     * Get system prompt
     */
    getSystemPrompt() {
        if (!this.initialized) {
            throw new Error('PromptLoader not initialized');
        }
        return this.templates.system;
    }

    /**
     * Format RAG query prompt
     * @param {string} context - Retrieved context from search
     * @param {string} question - User question
     * @param {string} weather - Current weather description
     * @param {string} datetime - Current date/time
     * @param {string} userPreferences - Formatted user preferences (optional)
     */
    async formatRAGQuery(context, question, weather = 'Không xác định', datetime = '', userPreferences = '') {
        if (!this.initialized) await this.initialize();

        return this.templates.ragQuery.format({
            context,
            question,
            weather,
            datetime,
            userPreferences: userPreferences || 'Chưa có thông tin sở thích'
        });
    }

    /**
     * Format query rewrite prompt
     */
    async formatQueryRewrite(originalQuery) {
        if (!this.initialized) await this.initialize();

        return this.templates.queryRewrite.format({
            original_query: originalQuery,
        });
    }

    /**
     * Format intent classification prompt
     */
    async formatIntentClassify(question) {
        if (!this.initialized) await this.initialize();

        return this.templates.intentClassify.format({
            question,
        });
    }

    /**
     * Format itinerary generation prompt
     * @param {string} context - Retrieved context from search
     * @param {string} question - User question
     * @param {string} weather - Current weather description
     * @param {string} datetime - Current date/time
     * @param {string} userPreferences - Formatted user preferences (optional)
     * @param {string} itineraryType - Type of itinerary (EVENING_SIMPLE, FULL_DAY)
     */
    async formatItineraryGen(context, question, weather = 'Không xác định', datetime = '', userPreferences = '', itineraryType = 'FULL_DAY') {
        if (!this.initialized) await this.initialize();

        // Thêm hint cho LLM về loại lịch trình
        let typeHint = '';
        if (itineraryType === 'EVENING_FANCY') {
            typeHint = '\n⚠️ QUAN TRỌNG: User yêu cầu LỊCH TRÌNH BUỔI TỐI CHỈNH CHU (3 hoạt động: Lẩu/Buffet → Karaoke → Hotel). Hãy follow TRƯỜNG HỢP 2 trong hướng dẫn!';
        } else if (itineraryType === 'EVENING_SIMPLE') {
            typeHint = '\n⚠️ QUAN TRỌNG: User yêu cầu LỊCH TRÌNH BUỔI TỐI ĐƠN GIẢN (3 hoạt động: Ăn nhẹ → Cafe → Dạo hồ). Hãy follow TRƯỜNG HỢP 1 trong hướng dẫn!';
        } else {
            typeHint = '\n⚠️ QUAN TRỌNG: User yêu cầu LỊCH TRÌNH 1 NGÀY ĐẦY ĐỦ (8 hoạt động). Hãy follow TRƯỜNG HỢP 3 trong hướng dẫn!';
        }

        return this.templates.itineraryGen.format({
            context,
            question: question + typeHint,
            weather,
            datetime,
            userPreferences: userPreferences || 'Chưa có thông tin sở thích'
        });
    }

    /**
     * Create custom prompt template
     */
    createPromptTemplate(template, inputVariables) {
        return new PromptTemplate({
            template,
            inputVariables,
        });
    }
}

export default new PromptLoader();
