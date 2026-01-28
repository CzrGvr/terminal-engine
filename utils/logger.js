
Action: file_editor create /app/terminal-engine/utils/logger.js --file-text "/**
 * Logger - Debug logging system
 */

class Logger {
    constructor() {
        this.enabled = true;
        this.level = 'info'; // 'debug', 'info', 'warn', 'error'
        this.logs = [];
        this.maxLogs = 1000;
    }

    /**
     * Set log level
     * @param {string} level - Log level
     */
    setLevel(level) {
        this.level = level;
    }

    /**
     * Enable/disable logging
     * @param {boolean} enabled - Enable state
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Log debug message
     * @param {string} message - Message to log
     * @param {*} data - Additional data
     */
    debug(message, data = null) {
        this.log('debug', message, data);
    }

    /**
     * Log info message
     * @param {string} message - Message to log
     * @param {*} data - Additional data
     */
    info(message, data = null) {
        this.log('info', message, data);
    }

    /**
     * Log warning message
     * @param {string} message - Message to log
     * @param {*} data - Additional data
     */
    warn(message, data = null) {
        this.log('warn', message, data);
    }

    /**
     * Log error message
     * @param {string} message - Message to log
     * @param {*} data - Additional data
     */
    error(message, data = null) {
        this.log('error', message, data);
    }

    /**
     * Internal log method
     * @param {string} level - Log level
     * @param {string} message - Message
     * @param {*} data - Data
     */
    log(level, message, data) {
        if (!this.enabled) return;

        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevelIndex = levels.indexOf(this.level);
        const messageLevelIndex = levels.indexOf(level);

        if (messageLevelIndex < currentLevelIndex) return;

        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data
        };

        this.logs.push(logEntry);

        // Limit logs
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Console output
        const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        
        if (data) {
            console[consoleMethod](prefix, message, data);
        } else {
            console[consoleMethod](prefix, message);
        }
    }

    /**
     * Get all logs
     * @returns {Array}
     */
    getLogs() {
        return [...this.logs];
    }

    /**
     * Clear logs
     */
    clear() {
        this.logs = [];
    }

    /**
     * Export logs as JSON
     * @returns {string}
     */
    export() {
        return JSON.stringify(this.logs, null, 2);
    }
}

const logger = new Logger();

export { logger, Logger };
"
Observation: Create successful: /app/terminal-engine/utils/logger.js
