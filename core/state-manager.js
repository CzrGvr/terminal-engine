/**
 * StateManager - Persistent state management with localStorage
 * Handles narrative progression, flags, inventory, and save/load
 */

import { eventBus } from './event-bus.js';

class StateManager {
    constructor() {
        this.state = {
            flags: new Set(),
            inventory: [],
            discoveredCredentials: {},
            visitedSystems: new Set(),
            commandHistory: [],
            achievements: [],
            currentContext: 'localhost',
            narrativeProgress: 0,
            startTime: Date.now(),
            playTime: 0,
            customData: {}
        };

        this.STORAGE_KEY = 'terminal-narrative-state';
        this.MAX_HISTORY = 100;
        this.autoSaveInterval = null;
    }

    /**
     * Initialize state manager
     */
    initialize() {
        this.load();
        this.startAutoSave();
        
        eventBus.on('command:executed', (data) => {
            this.addToHistory(data.command);
        });

        eventBus.on('flag:set', (flag) => {
            this.setFlag(flag);
        });

        return this;
    }

    /**
     * Set a narrative flag
     * @param {string} flag - Flag name
     */
    setFlag(flag) {
        if (!this.state.flags.has(flag)) {
            this.state.flags.add(flag);
            eventBus.emit('state:flag-set', { flag });
            this.checkAchievements();
        }
    }

    /**
     * Check if flag exists
     * @param {string} flag - Flag name
     * @returns {boolean}
     */
    hasFlag(flag) {
        return this.state.flags.has(flag);
    }

    /**
     * Remove a flag
     * @param {string} flag - Flag name
     */
    removeFlag(flag) {
        this.state.flags.delete(flag);
        eventBus.emit('state:flag-removed', { flag });
    }

    /**
     * Add item to inventory
     * @param {string} item - Item name
     */
    addToInventory(item) {
        if (!this.state.inventory.includes(item)) {
            this.state.inventory.push(item);
            eventBus.emit('state:inventory-updated', { item, action: 'add' });
        }
    }

    /**
     * Remove item from inventory
     * @param {string} item - Item name
     */
    removeFromInventory(item) {
        const index = this.state.inventory.indexOf(item);
        if (index > -1) {
            this.state.inventory.splice(index, 1);
            eventBus.emit('state:inventory-updated', { item, action: 'remove' });
        }
    }

    /**
     * Store discovered credentials
     * @param {string} system - System identifier
     * @param {object} credentials - Credentials object
     */
    storeCredentials(system, credentials) {
        this.state.discoveredCredentials[system] = credentials;
        eventBus.emit('state:credentials-discovered', { system, credentials });
    }

    /**
     * Get credentials for system
     * @param {string} system - System identifier
     * @returns {object|null}
     */
    getCredentials(system) {
        return this.state.discoveredCredentials[system] || null;
    }

    /**
     * Mark system as visited
     * @param {string} system - System identifier
     */
    visitSystem(system) {
        if (!this.state.visitedSystems.has(system)) {
            this.state.visitedSystems.add(system);
            eventBus.emit('state:system-visited', { system });
        }
    }

    /**
     * Add command to history
     * @param {string} command - Command string
     */
    addToHistory(command) {
        if (command.trim()) {
            this.state.commandHistory.push({
                command,
                timestamp: Date.now()
            });

            // Limit history size
            if (this.state.commandHistory.length > this.MAX_HISTORY) {
                this.state.commandHistory.shift();
            }
        }
    }

    /**
     * Grant achievement
     * @param {string} achievement - Achievement name
     */
    grantAchievement(achievement) {
        if (!this.state.achievements.includes(achievement)) {
            this.state.achievements.push(achievement);
            eventBus.emit('achievement:unlocked', { achievement });
        }
    }

    /**
     * Check for achievement conditions
     */
    checkAchievements() {
        // First Command
        if (this.state.commandHistory.length === 1) {
            this.grantAchievement('first_command');
        }

        // Explorer - visited 3 systems
        if (this.state.visitedSystems.size >= 3) {
            this.grantAchievement('explorer');
        }

        // Hacker - found 5 flags
        if (this.state.flags.size >= 5) {
            this.grantAchievement('hacker');
        }

        // Collector - 10 inventory items
        if (this.state.inventory.length >= 10) {
            this.grantAchievement('collector');
        }
    }

    /**
     * Set custom data
     * @param {string} key - Data key
     * @param {*} value - Data value
     */
    setCustomData(key, value) {
        this.state.customData[key] = value;
    }

    /**
     * Get custom data
     * @param {string} key - Data key
     * @returns {*}
     */
    getCustomData(key) {
        return this.state.customData[key];
    }

    /**
     * Update play time
     */
    updatePlayTime() {
        const now = Date.now();
        const sessionTime = now - this.state.startTime;
        this.state.playTime += sessionTime;
        this.state.startTime = now;
    }

    /**
     * Save state to localStorage
     * @param {number} slot - Save slot (default: 0)
     */
    save(slot = 0) {
        try {
            this.updatePlayTime();
            
            const saveData = {
                ...this.state,
                flags: Array.from(this.state.flags),
                visitedSystems: Array.from(this.state.visitedSystems),
                savedAt: Date.now(),
                slot
            };

            const key = `${this.STORAGE_KEY}_slot_${slot}`;
            localStorage.setItem(key, JSON.stringify(saveData));
            
            eventBus.emit('state:saved', { slot });
            return true;
        } catch (error) {
            console.error('Error saving state:', error);
            return false;
        }
    }

    /**
     * Load state from localStorage
     * @param {number} slot - Save slot (default: 0)
     */
    load(slot = 0) {
        try {
            const key = `${this.STORAGE_KEY}_slot_${slot}`;
            const savedData = localStorage.getItem(key);

            if (savedData) {
                const data = JSON.parse(savedData);
                
                this.state = {
                    ...data,
                    flags: new Set(data.flags || []),
                    visitedSystems: new Set(data.visitedSystems || []),
                    startTime: Date.now()
                };

                eventBus.emit('state:loaded', { slot });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error loading state:', error);
            return false;
        }
    }

    /**
     * Check if save exists
     * @param {number} slot - Save slot
     * @returns {boolean}
     */
    hasSave(slot = 0) {
        const key = `${this.STORAGE_KEY}_slot_${slot}`;
        return localStorage.getItem(key) !== null;
    }

    /**
     * Delete save
     * @param {number} slot - Save slot
     */
    deleteSave(slot = 0) {
        const key = `${this.STORAGE_KEY}_slot_${slot}`;
        localStorage.removeItem(key);
        eventBus.emit('state:deleted', { slot });
    }

    /**
     * Reset state to initial
     */
    reset() {
        this.state = {
            flags: new Set(),
            inventory: [],
            discoveredCredentials: {},
            visitedSystems: new Set(),
            commandHistory: [],
            achievements: [],
            currentContext: 'localhost',
            narrativeProgress: 0,
            startTime: Date.now(),
            playTime: 0,
            customData: {}
        };
        
        eventBus.emit('state:reset');
    }

    /**
     * Start auto-save interval
     */
    startAutoSave(intervalMs = 60000) {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.autoSaveInterval = setInterval(() => {
            this.save(0); // Auto-save to slot 0
        }, intervalMs);
    }

    /**
     * Stop auto-save
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    /**
     * Get current state (read-only)
     * @returns {object}
     */
    getState() {
        return {
            ...this.state,
            flags: Array.from(this.state.flags),
            visitedSystems: Array.from(this.state.visitedSystems)
        };
    }

    /**
     * Export state as JSON
     * @returns {string}
     */
    exportState() {
        return JSON.stringify(this.getState(), null, 2);
    }

    /**
     * Import state from JSON
     * @param {string} jsonString - JSON state
     */
    importState(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this.state = {
                ...data,
                flags: new Set(data.flags || []),
                visitedSystems: new Set(data.visitedSystems || []),
                startTime: Date.now()
            };
            eventBus.emit('state:imported');
            return true;
        } catch (error) {
            console.error('Error importing state:', error);
            return false;
        }
    }
}

// Singleton instance
const stateManager = new StateManager();

export { stateManager, StateManager };
"
Observation: Create successful: /app/terminal-engine/core/state-manager.js
