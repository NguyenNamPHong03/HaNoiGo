/**
 * Logger - Centralized logging
 */

import config from '../config/index.js';

class Logger {
    constructor() {
        this.level = config.logging.level;
    }

    /**
     * Helper to format metadata safely
     */
    _formatMeta(meta) {
        if (Object.keys(meta).length === 0) return '';
        try {
            return JSON.stringify(meta);
        } catch {
            return '[Circular/Unserializable]';
        }
    }

    info(message, meta = {}) {
        if (['info', 'debug'].includes(this.level)) {
            console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta);
        }
    }

    debug(message, meta = {}) {
        if (this.level === 'debug') {
            console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta);
        }
    }

    warn(message, meta = {}) {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta);
    }

    error(message, error, meta = {}) {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error, meta);
    }
}

export default new Logger();
