/**
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
        // Register a global, context-aware `help` command so help is
        // always contextual to the current context (lists only usable commands).
        this.register({
            name: 'help',
            contexts: ['*'],
            description: 'Show available commands',
            usage: 'help [command]',
            execute: async (args = [], context) => {
                // If asking about a specific command, show detailed usage
                if (args.length > 0) {
                    const q = args[0].toLowerCase();
                    const cmd = this.getCommand(q);
                    if (!cmd) {
                        return { success: false, error: `help: no help for '${args[0]}'` };
                    }

                    // Check availability in current context
                    if (!this.isAvailableInContext(cmd, context)) {
                        return { success: false, error: `Command '${args[0]}' is not available in this context.` };
                    }

                    return {
                        success: true,
                        output: `${cmd.name} - ${cmd.description}\nUsage: ${cmd.usage || 'N/A'}`,
                        className: 'text-info'
                    };
                }

                // Show list of available commands for the provided context
                const names = this.getAvailableCommands(context);
                let output = 'Available commands:\n\n';
                names.forEach(n => {
                    const c = this.getCommand(n);
                    if (c && !c.hidden) {
                        output += `  ${c.name.padEnd(12)} - ${c.description}\n`;
                    }
                });
                output += '\nType "help <command>" for more information.';

                return { success: true, output, className: 'text-info' };
            }
        });

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

        console.debug(`[CommandRegistry] Registering command: ${name}`);

        const command = {
            name,
            aliases,
            contexts,
            description,
            usage,
            execute,
            hidden
        };

        const nameKey = name.toLowerCase();

        // If a primary command with this name already exists, do not overwrite it.
        if (this.commands.has(nameKey)) {
            const existing = this.commands.get(nameKey);
            if (existing.name === nameKey) {
                console.debug(`[CommandRegistry] Primary command '${name}' already registered; skipping overwrite.`);
            } else {
                // If existing entry is an alias, preserve existing primary and still register this primary if not present
                if (!this.commands.has(nameKey) || this.commands.get(nameKey).name !== name) {
                    // Only set if no primary exists — defensive, though previous condition should catch it
                    this.commands.set(nameKey, command);
                }
            }
        } else {
            this.commands.set(nameKey, command);
        }

        // Register aliases without overwriting existing entries
        aliases.forEach(alias => {
            const aliasKey = alias.toLowerCase();
            if (!this.commands.has(aliasKey)) {
                this.commands.set(aliasKey, command);
            } else {
                console.debug(`[CommandRegistry] Alias '${alias}' exists; not overwriting.`);
            }
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
            console.debug(`[CommandRegistry] Command not found: ${name}`);
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
            console.debug(`[CommandRegistry] Executing command: ${name}`, { args, contextType: context?.type });
            const result = await command.execute(args, context);
            console.debug(`[CommandRegistry] Command result: ${name}`, result);
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
