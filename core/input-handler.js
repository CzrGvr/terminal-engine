
Action: file_editor create /app/terminal-engine/core/input-handler.js --file-text "/**
 * InputHandler - Handles keyboard input, command history, and command execution
 * Manages ↑/↓ navigation through history and TAB autocompletion
 */

import { eventBus } from './event-bus.js';

class InputHandler {
    constructor(commandRegistry, contextManager) {
        this.commandRegistry = commandRegistry;
        this.contextManager = contextManager;
        this.inputElement = null;
        this.history = [];
        this.historyIndex = -1;
        this.currentInput = '';
        this.initialized = false;
    }

    /**
     * Initialize input handler
     */
    initialize() {
        if (this.initialized) return;

        this.inputElement = document.getElementById('terminal-input');
        
        if (!this.inputElement) {
            console.error('Terminal input element not found');
            return;
        }

        // Setup event listeners
        this.inputElement.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.inputElement.addEventListener('input', () => this.handleInput());

        // Keep input focused
        document.addEventListener('click', () => {
            if (this.inputElement) {
                this.inputElement.focus();
            }
        });

        // Load history from state
        this.loadHistory();

        this.initialized = true;
    }

    /**
     * Handle keyboard input
     * @param {KeyboardEvent} e - Keyboard event
     */
    async handleKeyDown(e) {
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                await this.handleEnter();
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.navigateHistory(-1);
                break;

            case 'ArrowDown':
                e.preventDefault();
                this.navigateHistory(1);
                break;

            case 'Tab':
                e.preventDefault();
                this.handleTab();
                break;

            case 'l':
                if (e.ctrlKey) {
                    e.preventDefault();
                    eventBus.emit('terminal:clear');
                }
                break;

            case 'c':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.handleInterrupt();
                }
                break;
        }
    }

    /**
     * Handle regular input
     */
    handleInput() {
        // Update cursor position
        const cursor = document.getElementById('cursor');
        if (cursor && this.inputElement) {
            const inputWidth = this.getTextWidth(this.inputElement.value);
            cursor.style.marginLeft = `${inputWidth}px`;
        }
    }

    /**
     * Handle Enter key - execute command
     */
    async handleEnter() {
        const input = this.inputElement.value.trim();
        
        if (!input) {
            eventBus.emit('terminal:output', { text: '', className: '' });
            return;
        }

        // Echo command
        const prompt = document.getElementById('prompt').textContent;
        eventBus.emit('terminal:output', { 
            text: `${prompt} ${input}`, 
            className: 'text-bright' 
        });

        // Add to history
        this.addToHistory(input);

        // Execute command
        await this.executeCommand(input);

        // Clear input
        this.inputElement.value = '';
        this.currentInput = '';
        this.historyIndex = -1;
    }

    /**
     * Execute command
     * @param {string} input - Command input
     */
    async executeCommand(input) {
        const parts = input.trim().split(/\s+/);
        const commandName = parts[0].toLowerCase();
        const args = parts.slice(1);

        try {
            const result = await this.commandRegistry.execute(
                commandName,
                args,
                this.contextManager.getCurrentContext()
            );

            if (result.success) {
                if (result.output) {
                    eventBus.emit('terminal:output', { 
                        text: result.output, 
                        className: result.className || '' 
                    });
                }
            } else {
                eventBus.emit('terminal:output', { 
                    text: result.error || `Command failed: ${commandName}`, 
                    className: 'text-error' 
                });
            }

            // Emit command executed event
            eventBus.emit('command:executed', { 
                command: input, 
                success: result.success 
            });

        } catch (error) {
            console.error('Command execution error:', error);
            eventBus.emit('terminal:output', { 
                text: `Error: ${error.message}`, 
                className: 'text-error' 
            });
        }
    }

    /**
     * Navigate command history
     * @param {number} direction - Direction (-1 for up, 1 for down)
     */
    navigateHistory(direction) {
        if (this.history.length === 0) return;

        // Save current input when starting to navigate
        if (this.historyIndex === -1) {
            this.currentInput = this.inputElement.value;
        }

        // Calculate new index
        const newIndex = this.historyIndex + direction;

        if (newIndex < -1 || newIndex >= this.history.length) {
            return;
        }

        this.historyIndex = newIndex;

        // Update input
        if (this.historyIndex === -1) {
            this.inputElement.value = this.currentInput;
        } else {
            this.inputElement.value = this.history[this.history.length - 1 - this.historyIndex];
        }

        // Move cursor to end
        this.inputElement.setSelectionRange(
            this.inputElement.value.length,
            this.inputElement.value.length
        );
    }

    /**
     * Handle Tab key - autocompletion
     */
    handleTab() {
        const input = this.inputElement.value;
        const parts = input.split(/\s+/);
        
        if (parts.length === 1) {
            // Command completion
            const partial = parts[0].toLowerCase();
            const commands = this.commandRegistry.getAvailableCommands(
                this.contextManager.getCurrentContext()
            );

            const matches = commands.filter(cmd => cmd.startsWith(partial));

            if (matches.length === 1) {
                this.inputElement.value = matches[0] + ' ';
            } else if (matches.length > 1) {
                eventBus.emit('terminal:output', { 
                    text: matches.join('  '), 
                    className: 'text-info' 
                });
            }
        }
        // Could add file path completion here in the future
    }

    /**
     * Handle Ctrl+C - interrupt
     */
    handleInterrupt() {
        eventBus.emit('terminal:output', { 
            text: '^C', 
            className: 'text-warning' 
        });
        this.inputElement.value = '';
        this.currentInput = '';
        this.historyIndex = -1;
    }

    /**
     * Add command to history
     * @param {string} command - Command to add
     */
    addToHistory(command) {
        if (command.trim()) {
            // Avoid duplicates of last command
            if (this.history.length === 0 || this.history[this.history.length - 1] !== command) {
                this.history.push(command);
                
                // Limit history size
                const maxHistory = 100;
                if (this.history.length > maxHistory) {
                    this.history.shift();
                }
            }
        }
    }

    /**
     * Load history from state manager
     */
    loadHistory() {
        // Implementation would load from stateManager
        // For now, start with empty history
    }

    /**
     * Get text width for cursor positioning
     * @param {string} text - Text to measure
     * @returns {number}
     */
    getTextWidth(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = getComputedStyle(this.inputElement).font;
        return context.measureText(text).width;
    }

    /**
     * Get command history
     * @returns {Array}
     */
    getHistory() {
        return [...this.history];
    }

    /**
     * Clear command history
     */
    clearHistory() {
        this.history = [];
        this.historyIndex = -1;
    }

    /**
     * Enable/disable input
     * @param {boolean} enabled - Enable state
     */
    setEnabled(enabled) {
        if (this.inputElement) {
            this.inputElement.disabled = !enabled;
            if (enabled) {
                this.inputElement.focus();
            }
        }
    }
}

export { InputHandler };
"
Observation: Create successful: /app/terminal-engine/core/input-handler.js
