/**
 * Semantic Splitter - Chunk documents based on semantic meaning
 * Mục đích: Split documents thành meaningful chunks
 * Trách nhiệm: Preserve semantic coherence, handle overlaps
 */

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { RETRIEVAL_CONFIG } from '../../config/constants.js';
import logger from '../../utils/logger.js';

class SemanticSplitter {
    constructor() {
        this.splitter = new RecursiveCharacterTextSplitter({
            chunkSize: RETRIEVAL_CONFIG.CHUNK_SIZE,
            chunkOverlap: RETRIEVAL_CONFIG.CHUNK_OVERLAP,
            separators: [
                '\n\n',
                '\n',
                ' ',
                '',
            ],
        });
    }

    /**
     * Split documents
     */
    async splitDocuments(documents) {
        try {
            logger.info(`📄 Splitting ${documents.length} documents...`);

            const chunks = await this.splitter.splitDocuments(documents);

            logger.info(`✅ Created ${chunks.length} chunks`);
            return chunks;
        } catch (error) {
            logger.error('❌ Document splitting failed:', error);
            throw error;
        }
    }

    /**
     * Split text
     */
    async splitText(text) {
        try {
            return await this.splitter.splitText(text);
        } catch (error) {
            logger.error('❌ Text splitting failed:', error);
            throw error;
        }
    }

    /**
     * Custom split logic cho specific formats
     */
    splitByHeadings(text) {
        // Split by markdown headings
        const sections = text.split(/^##\s+(.+)$/m);
        const chunks = [];

        for (let i = 1; i < sections.length; i += 2) {
            const heading = sections[i];
            const content = sections[i + 1] || '';

            if (content.length > RETRIEVAL_CONFIG.CHUNK_SIZE) {
                // If content is too long, split further
                const subChunks = content
                    .split('\n\n')
                    .map((chunk) => `## ${heading}\n\n${chunk}`);
                chunks.push(...subChunks);
            } else {
                chunks.push(`## ${heading}\n\n${content}`);
            }
        }

        return chunks;
    }
}

export default new SemanticSplitter();
