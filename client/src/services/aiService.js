/**
 * AI Service - API calls for AI chat functionality
 * @module services/aiService
 */

import api from './api';

/**
 * Send a chat message to the AI and get response
 * @param {string} question - Natural language query
 * @param {string} userId - Optional user identifier
 * @returns {Promise<Object>} AI response with answer and places
 */
export const sendChatMessage = async (question, userId = 'anonymous') => {
    const response = await api.post('/ai/chat', { question, userId });
    return response.data;
};

/**
 * Check AI service health
 * @returns {Promise<Object>} Health status
 */
export const checkAIHealth = async () => {
    const response = await api.get('/ai/health');
    return response.data;
};

/**
 * Send a chat message using SSE streaming for faster perceived response
 * @param {string} question - Natural language query
 * @param {string} userId - Optional user identifier
 * @param {Function} onStatus - Callback for status updates
 * @param {Function} onPlaces - Callback for places data
 * @param {Function} onAnswer - Callback for answer text
 * @param {Function} onDone - Callback when streaming completes
 * @param {Function} onError - Callback for errors
 */
export const sendChatMessageStream = ({ question, userId = 'anonymous', onStatus, onPlaces, onAnswer, onDone, onError }) => {
    const baseURL = api.defaults.baseURL || '';

    fetch(`${baseURL}/ai/chat/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, userId }),
    })
        .then(response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            function read() {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        onDone?.();
                        return;
                    }

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n\n').filter(Boolean);

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));

                                switch (data.type) {
                                    case 'status':
                                        onStatus?.(data.message);
                                        break;
                                    case 'places':
                                        onPlaces?.(data.data);
                                        break;
                                    case 'answer':
                                        onAnswer?.(data.data);
                                        break;
                                    case 'done':
                                        onDone?.();
                                        break;
                                    case 'error':
                                        onError?.(data.message);
                                        break;
                                }
                            } catch (e) {
                                console.error('Error parsing SSE:', e);
                            }
                        }
                    }

                    read();
                });
            }

            read();
        })
        .catch(err => {
            onError?.(err.message);
        });
};

export default {
    sendChatMessage,
    sendChatMessageStream,
    checkAIHealth
};
