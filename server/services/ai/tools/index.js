/**
 * Tool Registry - Centralized tool management
 */

import weatherTool from './weatherTool.js';
import logger from '../utils/logger.js';

class ToolRegistry {
    constructor() {
        this.tools = new Map();
        this.registerDefaultTools();
    }

    /**
     * Register default tools
     */
    registerDefaultTools() {
        this.register('get_weather', weatherTool);
    }

    /**
     * Register custom tool
     */
    register(name, tool) {
        this.tools.set(name, tool);
        logger.info(`✅ Tool registered: ${name}`);
    }

    /**
     * Get tool
     */
    get(name) {
        return this.tools.get(name);
    }

    /**
     * Get all tools
     */
    getAll() {
        return Array.from(this.tools.values());
    }

    /**
     * Tool descriptions for LLM
     */
    getToolDescriptions() {
        return Array.from(this.tools.values()).map((tool) => ({
            name: tool.name,
            description: tool.description,
            schema: tool.schema,
        }));
    }
}

export default new ToolRegistry();
