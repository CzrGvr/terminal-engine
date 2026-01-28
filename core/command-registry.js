Continuando con los archivos del núcleo y contextos:
Action: file_editor create /app/terminal-engine/core/command-registry.js --file-text "/**
 * CommandRegistry - Dynamic command registration system
 * Implements Strategy Pattern for extensible command handling
 */

import { eventBus } from './event-bus.js';

class CommandRegistry {
    constructor() {
        this.commands = new Map();
        this.globalCommands = new Set(['help', 'clear', 'history', 'save', 'load', 'exit', 'quit']);
    }

    /**
     * Initialize with global commands
     */
    initialize() {
        // Global commands are registered here
        // Context-specific commands are registered by each context
    }

    /**
     * Register a command
     * @param {Object} commandConfig - Command configuration
     */
    register(commandConfig) {
        const {
            name,
            aliases = [],
            contexts = ['*'], // '*' means all contexts
            description = '',
            usage = '',
            execute,
            hidden = false
        } = commandConfig;

        if (!name || !execute) {
            console.error('Invalid command configuration:', commandConfig);
            return false;
        }

        const command = {
            name,
            aliases,
            contexts,
            description,
            usage,
            execute,
            hidden
        };

        this.commands.set(name.toLowerCase(), command);

        // Register aliases
        aliases.forEach(alias => {
            this.commands.set(alias.toLowerCase(), command);
        });

        eventBus.emit('command:registered', { name });
        return true;
    }

    /**
     * Unregister a command
     * @param {string} name - Command name
     */
    unregister(name) {
        const command = this.commands.get(name.toLowerCase());
        if (!command) return false;

        this.commands.delete(name.toLowerCase());
        
        // Remove aliases
        if (command.aliases) {
            command.aliases.forEach(alias => {
                this.commands.delete(alias.toLowerCase());
            });
        }

        eventBus.emit('command:unregistered', { name });
        return true;
    }

    /**
     * Execute a command
     * @param {string} name - Command name
     * @param {Array} args - Command arguments
     * @param {Object} context - Current context
     * @returns {Promise<Object>} Result object
     */
    async execute(name, args, context) {
        const command = this.commands.get(name.toLowerCase());

        if (!command) {
            return {
                success: false,
                error: `Command not found: ${name}\nType 'help' for available commands.`
            };
        }

        // Check if command is available in current context
        if (!this.isAvailableInContext(command, context)) {
            return {
                success: false,
                error: `Command '${name}' is not available in this context.`
            };
        }

        try {
            const result = await command.execute(args, context);
            return result || { success: true };
        } catch (error) {
            console.error(`Error executing command '${name}':`, error);
            return {
                success: false,
                error: `Error: ${error.message}`
            };
        }
    }

    /**
     * Check if command is available in context
     * @param {Object} command - Command object
     * @param {Object} context - Context object
     * @returns {boolean}
     */
    isAvailableInContext(command, context) {
        if (!command.contexts || command.contexts.includes('*')) {
            return true;
        }

        return command.contexts.includes(context?.type || 'local');
    }

    /**
     * Get available commands for context
     * @param {Object} context - Context object
     * @returns {Array} Array of command names
     */
    getAvailableCommands(context) {
        const available = [];
        
        for (const [name, command] of this.commands.entries()) {
            // Skip aliases (only show primary names)
            if (command.name !== name) continue;
            
            // Skip hidden commands
            if (command.hidden) continue;

            // Check context availability
            if (this.isAvailableInContext(command, context)) {
                available.push(name);
            }
        }

        return available.sort();
    }

    /**
     * Get command info
     * @param {string} name - Command name
     * @returns {Object|null}
     */
    getCommand(name) {
        return this.commands.get(name.toLowerCase()) || null;
    }

    /**
     * Get all commands
     * @returns {Array}
     */
    getAllCommands() {
        const commands = [];
        const seen = new Set();

        for (const [, command] of this.commands.entries()) {
            if (!seen.has(command.name)) {
                commands.push(command);
                seen.add(command.name);
            }
        }

        return commands.sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Check if command exists
     * @param {string} name - Command name
     * @returns {boolean}
     */
    has(name) {
        return this.commands.has(name.toLowerCase());
    }

    /**
     * Clear all commands
     */
    clear() {
        this.commands.clear();
        eventBus.emit('command:registry-cleared');
    }
}

export { CommandRegistry };
"
Observation: Create successful: /app/terminal-engine/core/command-registry.js
