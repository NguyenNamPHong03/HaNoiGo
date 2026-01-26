/**
 * Stage 6: Prompt Builder
 * Nhiệm vụ: Format context và tạo prompt cho LLM
 */

import weatherService from '../../../weather/weatherService.js';
import { RAG_STAGES } from '../../config/constants.js';
import telemetry from '../../core/telemetry.js';
import promptLoader from '../../prompts/promptLoader.js';
import logger from '../../utils/logger.js';
import { formatPreferencesForPrompt } from '../../utils/preferencesMapper.js';

class PromptBuilder {
    /**
     * STAGE 9: Format Context
     */
    async formatContext(input) {
        if (input.cached) return input;

        // Build context with STRICT header
        const placesCount = input.retrievedDocs.length;
        const contextHeader = `
==============================================
🚨 DANH SÁCH DUY NHẤT BẠN ĐƯỢC GỢI Ý 🚨
==============================================
BẠN CHỈ ĐƯỢC GỢI Ý CÁC ĐỊA ĐIỂM DƯỚI ĐÂY:
- KHÔNG ĐƯỢC thêm địa điểm nào khác
- KHÔNG ĐƯỢC dùng ký ức về địa điểm khác
- MỖI địa điểm bạn gợi ý PHẢI có RANK # trong danh sách

🚨🚨🚨 QUY TẮC BẮT BUỘC - PHẢI LIST TẤT CẢ ${placesCount} ĐỊA ĐIỂM 🚨🚨🚨
- Dưới đây có ${placesCount} địa điểm
- BẠN PHẢI GỢI Ý TẤT CẢ ${placesCount} ĐỊA ĐIỂM
- TUYỆT ĐỐI KHÔNG BỎ QUA bất kỳ địa điểm nào
- Nếu có ${placesCount} địa điểm → câu trả lời PHẢI có ${placesCount} gợi ý
- Ví dụ: Nếu có 5 địa điểm → PHẢI list cả 5 (1, 2, 3, 4, 5)

🚨🚨🚨 QUY TẮC THỨ TỰ (CRITICAL - HIGHEST PRIORITY) 🚨🚨🚨
- PHẢI list địa điểm THEO ĐÚNG THỨ TỰ RANK bên dưới
- RANK #1 → PHẢI là địa điểm ĐẦU TIÊN trong câu trả lời
- RANK #2 → PHẢI là địa điểm THỨ HAI trong câu trả lời  
- RANK #3 → PHẢI là địa điểm THỨ BA trong câu trả lời
- TUYỆT ĐỐI KHÔNG ĐẢO NGƯỢC hoặc THAY ĐỔI thứ tự
- Thứ tự RANK đã được tính toán kỹ theo độ phù hợp với yêu cầu

DANH SÁCH ${placesCount} ĐỊA ĐIỂM (ƯU TIÊN THEO THỨ TỰ):
==============================================
`;

        const placesContext = input.retrievedDocs
            .map((doc, i) => {
                const placeId = doc.metadata?.id || doc.id || 'N/A';
                const placeName = doc.name || doc.metadata?.name || `Địa điểm ${i + 1}`;
                const address = doc.metadata?.address ? `Địa chỉ: ${doc.metadata.address}` : '';
                const price = doc.metadata?.price ? `Giá: ${doc.metadata.price} VND` : 'Giá: Liên hệ';
                const category = doc.metadata?.category ? `(${doc.metadata.category})` : '';
                const distance = doc.distanceKm !== undefined && doc.distanceKm !== null
                    ? `📍 Cách bạn ${doc.distanceKm}km`
                    : '';

                return `RANK #${i + 1} [ID: ${placeId}] [${placeName}] ${category}\n${address} ${distance}| ${price}\n${doc.content}`;
            })
            .join('\n\n---\n\n');

        const contextFooter = `
==============================================
🚨 NHẮC LẠI QUY TẮC QUAN TRỌNG NHẤT 🚨
==============================================
Khi trả lời user, bạn PHẢI:

✅ GỢI Ý TẤT CẢ ${placesCount} ĐỊA ĐIỂM ở trên (KHÔNG BỎ SÓT)
✅ Sắp xếp ĐÚNG THỨ TỰ RANK (1 → 2 → 3 → ... → ${placesCount})

Ví dụ chuẩn (nếu có 5 địa điểm):
"Dưới đây là ${placesCount} quán mình gợi ý:
1. [RANK #1 name] - [mô tả]
2. [RANK #2 name] - [mô tả]
3. [RANK #3 name] - [mô tả]
4. [RANK #4 name] - [mô tả]
5. [RANK #5 name] - [mô tả]"

❌ TUYỆT ĐỐI KHÔNG chỉ list 2-3 địa điểm rồi bỏ qua phần còn lại!
==============================================
`;

        const context = contextHeader + placesContext + contextFooter;

        // Debug log: Show which places are in context
        const placeNames = input.retrievedDocs.map(d => d.name || d.metadata?.name).slice(0, 8);
        logger.info(`📝 Context formatted with ${input.retrievedDocs.length} places:`);
        placeNames.forEach((name, i) => {
            logger.info(`   RANK #${i + 1}: ${name}`);
        });
        logger.info(`⚠️ AI MUST ONLY recommend places from the list above! No hallucination allowed!`);

        return { ...input, context };
    }

    /**
     * STAGE 10: Create Prompt
     */
    async createPrompt(input) {
        if (input.cached) return input;

        return await telemetry.measureTime(RAG_STAGES.PROMPT_CONSTRUCTION, async () => {
            // Context Flags - Default to FALSE if not provided
            const isContextProvided = !!input.context;
            const shouldIncludeRealtime = isContextProvided ? !!input.context.useRealtime : false;
            const shouldIncludePersonalization = isContextProvided ? !!input.context.usePersonalization : false;

            let enhancedWeatherDesc = "Thời tiết: Không có dữ liệu thời gian thực (User disabled).";
            let datetime = "Thời gian: Không có dữ liệu thời gian thực (User disabled).";

            if (shouldIncludeRealtime) {
                const weatherData = await weatherService.getCurrentWeather();
                const now = new Date();
                datetime = now.toLocaleString('vi-VN', {
                    hour: '2-digit', minute: '2-digit',
                    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
                    timeZone: 'Asia/Bangkok'
                });

                // Weather Warning
                let weatherWarning = "";
                const desc = weatherData?.description || "";
                const sky = weatherData?.skyConditions || "";
                const isRaining = desc.toLowerCase().includes('mưa') ||
                    desc.toLowerCase().includes('rain') ||
                    (sky && sky.includes('Rain'));

                if (isRaining) {
                    weatherWarning = "⚠️ WARNING: It is currently RAINING. Prioritize Indoor places. Highlight 'cozy', 'warm', 'shelter'.";
                    logger.info('☔️ Rain detected, injecting warning.');
                }
                enhancedWeatherDesc = `${weatherData.fullDescription}\n${weatherWarning}`;
            }

            const userPreferences = input.userPreferences || null;
            let preferencesContext = '';

            if (shouldIncludePersonalization && userPreferences) {
                preferencesContext = formatPreferencesForPrompt(userPreferences);
                logger.info('👤 Personalization ENABLED');
            } else {
                logger.info('👤 Personalization DISABLED or no preferences');
            }

            // 🎭 MOOD CONTEXT INJECTION
            if (input.moodContext) {
                const moodMsg = `\n\n📢 TÂM TRẠNG NGƯỜI DÙNG: Đang cảm thấy "${input.moodContext.type}".\n👉 YÊU CẦU: Hãy điều chỉnh tone giọng trả lời phù hợp (ví dụ: buồn -> nhẹ nhàng, an ủi; vui -> hào hứng).`;
                preferencesContext += moodMsg;
                logger.info(`🎭 Injected mood context into prompt: ${input.moodContext.type}`);
            }

            let formatted;
            if (input.intent === 'ITINERARY') {
                // Truyền itineraryType cho prompt template
                formatted = await promptLoader.formatItineraryGen(
                    input.context,
                    input.question,
                    enhancedWeatherDesc,
                    datetime,
                    preferencesContext,
                    input.itineraryType || 'FULL_DAY'
                );
            } else {
                formatted = await promptLoader.formatRAGQuery(
                    input.context,
                    input.question,
                    enhancedWeatherDesc,
                    datetime,
                    preferencesContext
                );
            }

            return { ...input, prompt: formatted };
        });
    }
}

export default new PromptBuilder();
