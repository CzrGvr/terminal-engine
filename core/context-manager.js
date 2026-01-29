/**
 * ContextManager - Manages different terminal contexts (local, BBS, SSH)
 * Handles context switching and command routing
 */

import { eventBus } from './event-bus.js';
import { stateManager } from './state-manager.js';

class ContextManager {
    constructor(commandRegistry) {
        this.commandRegistry = commandRegistry;
        this.contexts = new Map();
        this.currentContext = null;
        this.contextStack = [];
        this._fsListener = null;
    }

    /**
     * Initialize context manager
     */
    async initialize() {
        // Contexts will be registered dynamically
        // Start with local shell context
        eventBus.on('context:switch', async (data) => {
            await this.switchContext(data.contextId, data.params);
        });
    }

    /**
     * Register a context
     * @param {string} id - Context identifier
     * @param {Object} contextInstance - Context instance
     */
    registerContext(id, contextInstance) {
        this.contexts.set(id, contextInstance);
        
        // Register context's commands
        const commands = contextInstance.getCommands();
        commands.forEach(cmd => {
            this.commandRegistry.register(cmd);
        });

        eventBus.emit('context:registered', { id });
    }

    /**
     * Switch to a different context
     * @param {string} contextId - Target context ID
     * @param {Object} params - Context parameters
     */
    async switchContext(contextId, params = {}) {
        const newContext = this.contexts.get(contextId);
        
        if (!newContext) {
            eventBus.emit('terminal:output', {
                text: `Error: Unknown context '${contextId}'`,
                className: 'text-error'
            });
            return false;
        }

        // Exit current context
        if (this.currentContext) {
            await this.currentContext.onExit();
            this.contextStack.push(this.currentContext);
        }

        // Enter new context
        this.currentContext = newContext;
        await this.currentContext.onEnter(params);

        // Update prompt
        const prompt = this.currentContext.getPrompt();
        eventBus.emit('context:changed', { 
            contextId, 
            prompt,
            context: this.currentContext 
        });

        // Listen for filesystem directory changes so prompt updates (e.g., after `cd`)
        if (this._fsListener) {
            eventBus.off('filesystem:directory-changed', this._fsListener);
            this._fsListener = null;
        }

        this._fsListener = () => {
            try {
                const updatedPrompt = this.currentContext?.getPrompt?.() || '';
                eventBus.emit('context:changed', {
                    contextId: this.currentContext?.id,
                    prompt: updatedPrompt,
                    context: this.currentContext
                });
            } catch (err) {
                console.error('Error updating prompt on directory change:', err);
            }
        };

        eventBus.on('filesystem:directory-changed', this._fsListener);

        // Update state
        stateManager.state.currentContext = contextId;

        return true;
    }

    /**
     * Return to previous context
     */
    async popContext() {
        if (this.contextStack.length === 0) {
            return false;
        }

        // Exit current context
        if (this.currentContext) {
            await this.currentContext.onExit();
        }

        // Restore previous context
        this.currentContext = this.contextStack.pop();
        await this.currentContext.onEnter({});

        // Update prompt
        const prompt = this.currentContext.getPrompt();
        eventBus.emit('context:changed', { 
            contextId: this.currentContext.id,
            prompt,
            context: this.currentContext 
        });

        return true;
    }

    /**
     * Get current context
     * @returns {Object}
     */
    getCurrentContext() {
        return this.currentContext;
    }

    /**
     * Get context by ID
     * @param {string} id - Context ID
     * @returns {Object|null}
     */
    getContext(id) {
        return this.contexts.get(id) || null;
    }

    /**
     * Check if context exists
     * @param {string} id - Context ID
     * @returns {boolean}
     */
    hasContext(id) {
        return this.contexts.has(id);
    }

    /**
     * Get all registered contexts
     * @returns {Array}
     */
    getAllContexts() {
        return Array.from(this.contexts.entries()).map(([id, context]) => ({
            id,
            name: context.name || id,
            type: context.type || 'unknown'
        }));
    }
}

export { ContextManager };

