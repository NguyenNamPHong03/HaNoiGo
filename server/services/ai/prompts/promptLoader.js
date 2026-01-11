/**
 * Prompt Loader - Load và inject variables vào prompts
 * Mục đích: Centralized prompt management
 * Trách nhiệm: Load prompt templates, fill variables, version control
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { PromptTemplate } from '@langchain/core/prompts';
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
                inputVariables: ['context', 'question'],
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
     */
    async formatRAGQuery(context, question) {
        if (!this.initialized) await this.initialize();

        return this.templates.ragQuery.format({
            context,
            question,
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
