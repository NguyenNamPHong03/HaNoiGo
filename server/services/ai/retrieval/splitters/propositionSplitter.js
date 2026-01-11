/**
 * Proposition Splitter - Use LLM to split text into atomic propositions
 * Based on "Master RAG" Ch. 4.1 & 4.2
 */

import OpenAI from 'openai';
import config from '../../config/index.js';
import logger from '../../utils/logger.js';

class PropositionSplitter {
    constructor() {
        this.openai = new OpenAI({ apiKey: config.openai.apiKey });
        this.MODEL = 'gpt-4o-mini'; // Using 4o-mini for cost/speed balance, or 4o as requested
    }

    /**
     * Split documents into propositions
     * @param {Array<{pageContent: string, metadata: object}>} documents
     * @returns {Promise<Array<{pageContent: string, metadata: object}>>}
     */
    async splitDocuments(documents) {
        logger.info(`🧠 Generating propositions for ${documents.length} documents...`);

        const chunks = [];

        // Massive parallelism for speed using 20 concurrent requests
        const CONCURRENCY = 20;

        for (let i = 0; i < documents.length; i += CONCURRENCY) {
            const batch = documents.slice(i, i + CONCURRENCY);
            const results = await Promise.all(
                batch.map(doc => this.createPropositionsForDoc(doc))
            );

            // Flatten results
            results.forEach(docChunks => {
                if (docChunks) chunks.push(...docChunks);
            });

            if ((i + CONCURRENCY) % 100 === 0) {
                logger.info(`✅ Processed ${Math.min(i + CONCURRENCY, documents.length)}/${documents.length} docs`);
            }
        }

        return chunks;
    }

    /**
     * Extract propositions from a single document
     */
    async createPropositionsForDoc(doc) {
        try {
            const { name, description } = doc.metadata;
            // The pipeline appends tags to pageContent, so use that
            const textToProcess = doc.pageContent || description || "";

            // OPTIMIZATION: If text is short, don't waste time/money on LLM
            // 300 chars is roughly 2-3 sentences. Sufficiently atomic.
            if (!textToProcess || textToProcess.length < 300) {
                return [{
                    pageContent: textToProcess,
                    metadata: {
                        ...doc.metadata,
                        text: textToProcess,
                        isProposition: false // Raw doc
                    }
                }];
            }

            const prompt = `Tách mô tả địa điểm sau thành các mệnh đề (sự kiện) nguyên tử, ngắn gọn, tự chứa. Trả về một mảng JSON.
Mô tả: ${name} là ${textToProcess}
Example format: { "propositions": ["${name} có không gian rộng.", "${name} phù hợp tâm trạng buồn."] }`;

            const response = await this.openai.chat.completions.create({
                model: this.MODEL,
                response_format: { type: "json_object" },
                messages: [{ role: "user", content: prompt }],
                temperature: 0.1,
            });

            const content = response.choices[0].message.content;

            try {
                const result = JSON.parse(content);
                const propositions = result.propositions || [];

                if (propositions.length === 0) return [doc];

                // Create a chunk for each proposition
                return propositions.map((prop, index) => ({
                    pageContent: prop,
                    metadata: {
                        ...doc.metadata,
                        text: prop, // Important: this is the atomic fact
                        isProposition: true,
                        propIndex: index
                    }
                }));

            } catch (parseError) {
                logger.error('Error parsing propositions JSON', parseError);
                return [doc]; // Fallback
            }

        } catch (error) {
            logger.error(`❌ Proposition extraction failed for doc: ${doc.metadata.name}`, error);
            return [doc]; // Fallback to original
        }
    }
}

export default new PropositionSplitter();
