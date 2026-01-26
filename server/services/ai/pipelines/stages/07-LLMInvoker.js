/**
 * Stage 7: LLM Invoker
 * Nhiệm vụ: Gọi LLM và parse response
 */

import { RAG_STAGES } from '../../config/constants.js';
import telemetry from '../../core/telemetry.js';
import logger from '../../utils/logger.js';

class LLMInvoker {
    constructor() {
        this.llm = null;
    }

    /**
     * Set LLM instance (called from MainChatPipeline)
     */
    setLLM(llm) {
        this.llm = llm;
    }

    /**
     * STAGE 11: LLM Inference
     */
    async invoke(input) {
        if (input.cached) return input;

        return await telemetry.measureTime(RAG_STAGES.LLM_INFERENCE, async () => {
            const response = await this.llm.invoke(input.prompt);

            let answer = '';
            // Robust response extraction
            if (typeof response === 'string') {
                answer = response;
            } else if (response?.content) {
                answer = response.content;
            } else if (response?.kwargs?.content) {
                answer = response.kwargs.content;
            } else if (response?.text) {
                answer = response.text;
            }

            // 🔍 VALIDATION: Check if LLM mentioned all places
            if (input.intent !== 'ITINERARY' && input.retrievedDocs?.length > 0) {
                const mentionedPlaces = this.validatePlaceMentions(answer, input.retrievedDocs);
                
                if (mentionedPlaces.missing.length > 0) {
                    logger.warn(`⚠️ LLM bỏ qua ${mentionedPlaces.missing.length}/${input.retrievedDocs.length} places`);
                    logger.warn(`   Missing: ${mentionedPlaces.missing.map(p => p.name).join(', ')}`);
                    
                    // Auto-append missing places
                    answer = this.appendMissingPlaces(answer, mentionedPlaces.missing);
                    logger.info(`✅ Auto-appended ${mentionedPlaces.missing.length} missing places to answer`);
                }
            }

            let structuredData = null;
            if (input.intent === 'ITINERARY') {
                const itineraryType = input.itineraryType || 'FULL_DAY';
                logger.info(`📋 Processing ${itineraryType} itinerary...`);
                
                // Chỉ parse JSON cho EVENING types (có timeline component)
                // FULL_DAY trả về text tự nhiên, không cần parse JSON
                if (itineraryType === 'EVENING_SIMPLE' || itineraryType === 'EVENING_FANCY') {
                    try {
                        // Find JSON in answer (AI returns text + JSON for evening)
                        const firstOpen = answer.indexOf('{');
                        const lastClose = answer.lastIndexOf('}');
                        
                        if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
                            // Extract JSON part
                            const jsonString = answer.substring(firstOpen, lastClose + 1)
                                .replace(/[\u0000-\u0019]+/g, "")
                                .trim();
                            
                            structuredData = JSON.parse(jsonString);
                            
                            // Extract introduction text (before JSON)
                            const introText = answer.substring(0, firstOpen).trim();
                            
                            // Update answer to only contain introduction (không có JSON thô)
                            if (introText) {
                                answer = introText;
                            } else {
                                // Nếu không có intro, tạo default message
                                answer = `Dạ em đã tạo lịch trình "${structuredData.title}" cho bạn ạ! 🎉`;
                            }
                            
                            logger.info('✅ Successfully parsed Evening Itinerary JSON');
                            logger.info(`📝 Introduction text: "${answer.substring(0, 100)}..."`);
                        } else {
                            logger.warn('⚠️ No valid JSON found in evening itinerary response');
                        }
                    } catch (e) {
                        logger.warn('⚠️ Failed to parse evening itinerary JSON', e);
                    }
                } else {
                    // FULL_DAY: Chỉ cần text tự nhiên, không parse JSON
                    logger.info('✅ FULL_DAY itinerary returned as natural text (no JSON parsing)');
                }
            }

            return {
                ...input,
                answer,
                structuredData
            };
        });
    }

    /**
     * Validate if LLM mentioned all places in answer
     */
    validatePlaceMentions(answer, retrievedDocs) {
        const mentioned = [];
        const missing = [];
        
        for (const doc of retrievedDocs) {
            const placeName = doc.name || doc.metadata?.name || '';
            
            // Check if place name appears in answer (case-insensitive, fuzzy)
            const normalizedName = placeName.toLowerCase().replace(/\s+/g, ' ').trim();
            const normalizedAnswer = answer.toLowerCase().replace(/\s+/g, ' ');
            
            if (normalizedAnswer.includes(normalizedName)) {
                mentioned.push({ name: placeName, doc });
            } else {
                missing.push({ name: placeName, doc });
            }
        }
        
        return { mentioned, missing };
    }

    /**
     * Auto-append missing places to answer
     */
    appendMissingPlaces(answer, missingPlaces) {
        if (missingPlaces.length === 0) return answer;
        
        const missingCount = missingPlaces.length;
        const appendText = `\n\n🔍 **Bổ sung thêm ${missingCount} địa điểm khác cũng phù hợp:**\n\n` + 
            missingPlaces.map((item, index) => {
                const doc = item.doc;
                const name = item.name;
                const address = doc.metadata?.address || 'Địa chỉ: Đang cập nhật';
                const price = doc.metadata?.price ? `${doc.metadata.price} VND` : 'Giá: Liên hệ';
                
                return `${index + 1}. **${name}**\n   ${address}\n   ${price}`;
            }).join('\n\n');
        
        return answer + appendText;
    }
}

export default new LLMInvoker();
