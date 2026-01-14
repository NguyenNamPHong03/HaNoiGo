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
        mutationFn: ({ question, userId, context }) => sendChatMessage(question, userId, context),
        mutationKey: ['ai', 'chat'],
    });
};

export default useAIChat;
