/**
 * useAIChat - React Query hook for AI chat functionality
 * @module hooks/useAIChat
 */

import { useMutation } from '@tanstack/react-query';
import { sendChatMessage } from '../services/aiService';

/**
 * Hook for sending chat queries to AI
 * @returns {Object} Mutation object with sendMessage function
 */
export const useAIChat = () => {
    return useMutation({
        mutationFn: ({ question, userId }) => sendChatMessage(question, userId),
        mutationKey: ['ai', 'chat'],
    });
};

export default useAIChat;
