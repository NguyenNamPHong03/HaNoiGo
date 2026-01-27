/**
 * Debug script to check Pinecone vector IDs and metadata for Văn Miếu
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { Pinecone } from '@pinecone-database/pinecone';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from server root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX || 'hanoigo-places';

async function checkPinecone() {
    console.log('Connecting to Pinecone...');
    const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
    const index = pinecone.index(PINECONE_INDEX);

    const { OpenAIEmbeddings } = await import('@langchain/openai');
    const embeddings = new OpenAIEmbeddings({
        modelName: 'text-embedding-3-small',
        openAIApiKey: process.env.OPENAI_API_KEY
    });

    console.log('\n🔍 Semantic search for "văn miếu quốc tử giám"...');
    const queryVector = await embeddings.embedQuery('văn miếu quốc tử giám di tích lịch sử');

    const searchResult = await index.query({
        vector: queryVector,
        topK: 5,
        includeMetadata: true
    });

    console.log('   Results with FULL metadata:');
    searchResult.matches?.forEach((match, i) => {
        console.log(`\n   [${i}] Score: ${match.score?.toFixed(4)}`);
        console.log(`       Pinecone ID: ${match.id}`);
        console.log(`       metadata.id: ${match.metadata?.id}`);
        console.log(`       metadata.originalId: ${match.metadata?.originalId}`);
        console.log(`       metadata.name: ${match.metadata?.name}`);
    });

    console.log('\n\n🔍 Semantic search for "công viên starlake hồ tây"...');
    const queryVector2 = await embeddings.embedQuery('công viên starlake hồ tây');

    const searchResult2 = await index.query({
        vector: queryVector2,
        topK: 5,
        includeMetadata: true
    });

    console.log('   Results with FULL metadata:');
    searchResult2.matches?.forEach((match, i) => {
        console.log(`\n   [${i}] Score: ${match.score?.toFixed(4)}`);
        console.log(`       Pinecone ID: ${match.id}`);
        console.log(`       metadata.id: ${match.metadata?.id}`);
        console.log(`       metadata.originalId: ${match.metadata?.originalId}`);
        console.log(`       metadata.name: ${match.metadata?.name}`);
    });
}

checkPinecone();
