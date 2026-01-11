import { JsonOutputParser } from "@langchain/core/output_parsers";
import { llmFactory } from "../../core/llmFactory.js";
import { promptLoader } from "../../prompts/promptLoader.js";

export const intentExtractor = {
    /**
     * Phân tích câu hỏi tự nhiên thành object filter
     * @param {string} query 
     * @returns {Promise<Object>} { district, priceRange, mood }
     */
    extract: async (query) => {
        try {
            // 1. Dùng model nhiệt độ thấp (0) để output JSON chuẩn xác
            const llm = llmFactory.createChatModel({ temperature: 0 });

            // 2. Load prompt chuyên dụng
            const prompt = await promptLoader.load('intent_extraction.txt');

            // 3. Build chain
            const chain = prompt.pipe(llm).pipe(new JsonOutputParser());

            // 4. Run
            const result = await chain.invoke({ query });
            console.log("🔍 Extracted Intent:", result);

            return result;

        } catch (error) {
            console.warn("⚠️ Intent extraction failed, falling back to empty filter.", error);
            return {};
        }
    }
};
