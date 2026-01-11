/**
 * Weather Tool - Example function calling tool
 * Mục đích: Show how to implement custom tools
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import logger from '../utils/logger.js';

const weatherTool = tool(
    async (input) => {
        try {
            logger.info(`🌤️  Getting weather for ${input.location}...`);

            // Mock API call
            const weather = {
                location: input.location,
                temperature: 25,
                condition: 'Sunny',
                humidity: 60,
            };

            return JSON.stringify(weather);
        } catch (error) {
            logger.error('❌ Weather tool failed:', error);
            return 'Weather service unavailable';
        }
    },
    {
        name: 'get_weather',
        description: 'Get current weather for a location',
        schema: z.object({
            location: z.string().describe('City name or location'),
        }),
    }
);

export default weatherTool;
