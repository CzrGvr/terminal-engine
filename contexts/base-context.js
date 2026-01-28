/**
 * BaseContext - Abstract base class for all terminal contexts
 * Provides interface that all contexts must implement
 */

class BaseContext {
    constructor(id, name, type) {
        if (new.target === BaseContext) {
            throw new Error('BaseContext is abstract and cannot be instantiated directly');
        }

        this.id = id;
        this.name = name;
        this.type = type;
        this.data = {};
    }

    /**
     * Get context prompt string
     * @returns {string}
     */
    getPrompt() {
        throw new Error('getPrompt() must be implemented by subclass');
    }

    /**
     * Get available commands for this context
     * @returns {Array}
     */
    getCommands() {
        throw new Error('getCommands() must be implemented by subclass');
    }

    /**
     * Called when entering this context
     * @param {Object} params - Context parameters
     */
    async onEnter(params) {
        this.data = { ...this.data, ...params };
    }

    /**
     * Called when exiting this context
     */
    async onExit() {
        // Default implementation does nothing
    }

    /**
     * Process command in this context
     * @param {string} command - Command name
     * @param {Array} args - Command arguments
     * @returns {Object} Result object
     */
    async processCommand(command, args) {
        return {
            success: false,
            error: 'Command processing not implemented'
        };
    }

    /**
     * Set context data
     * @param {string} key - Data key
     * @param {*} value - Data value
     */
    setData(key, value) {
        this.data[key] = value;
    }

    /**
     * Get context data
     * @param {string} key - Data key
     * @returns {*}
     */
    getData(key) {
        return this.data[key];
    }

    /**
     * Check if context has data
     * @param {string} key - Data key
     * @returns {boolean}
     */
    hasData(key) {
        return key in this.data;
    }

    /**
     * Clear context data
     */
    clearData() {
        this.data = {};
    }
}

export { BaseContext };

