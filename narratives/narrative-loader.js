
Action: file_editor create /app/terminal-engine/narratives/narrative-loader.js --file-text "/**
 * NarrativeLoader - Loads and validates narrative configurations from JSON
 */

import { validator } from '../utils/validator.js';
import { eventBus } from '../core/event-bus.js';
import { stateManager } from '../core/state-manager.js';
import { filesystem } from '../core/filesystem.js';

class NarrativeLoader {
    constructor() {
        this.currentNarrative = null;
        this.narrativeData = null;
    }

    /**
     * Load narrative from JSON configuration
     * @param {string} configPath - Path to config.json
     * @returns {Promise<boolean>}
     */
    async loadFromFile(configPath) {
        try {
            const response = await fetch(configPath);
            const config = await response.json();
            return this.load(config);
        } catch (error) {
            console.error('Error loading narrative:', error);
            return false;
        }
    }

    /**
     * Load narrative from configuration object
     * @param {Object} config - Narrative configuration
     * @returns {boolean}
     */
    load(config) {
        // Validate configuration
        const validation = validator.validateNarrative(config);
        
        if (!validation.valid) {
            console.error('Invalid narrative configuration:', validation.errors);
            return false;
        }

        this.narrativeData = config;
        this.currentNarrative = config.narrative;

        // Setup systems
        if (config.systems) {
            this.setupSystems(config.systems);
        }

        // Setup progression
        if (config.progression) {
            this.setupProgression(config.progression);
        }

        // Show intro dialogue
        if (config.dialogues && config.dialogues.intro) {
            eventBus.emit('terminal:output', {
                text: '\n' + config.dialogues.intro + '\n',
                className: 'text-info'
            });
        }

        eventBus.emit('narrative:loaded', { narrative: config.narrative });
        return true;
    }

    /**
     * Setup systems from configuration
     * @param {Array} systems - Systems configuration
     */
    setupSystems(systems) {
        systems.forEach(system => {
            if (system.filesystem) {
                this.setupFilesystem(system.filesystem);
            }
        });
    }

    /**
     * Setup filesystem from configuration
     * @param {Object} fsConfig - Filesystem configuration
     */
    setupFilesystem(fsConfig) {
        Object.entries(fsConfig).forEach(([path, contents]) => {
            if (Array.isArray(contents)) {
                // Contents is a list of files
                contents.forEach(item => {
                    if (typeof item === 'string') {
                        filesystem.writeFile(`${path}/${item}`, '');
                    }
                });
            } else if (typeof contents === 'object') {
                // Contents is a directory structure
                this.setupFilesystem({ [path]: contents });
            }
        });
    }

    /**
     * Setup progression system
     * @param {Object} progression - Progression configuration
     */
    setupProgression(progression) {
        if (progression.flags) {
            // Setup flag listeners
            progression.flags.forEach(flag => {
                eventBus.on(`flag:${flag}`, () => {
                    this.checkWinCondition();
                });
            });
        }

        if (progression.winCondition) {
            this.winCondition = progression.winCondition;
        }
    }

    /**
     * Check if win condition is met
     */
    checkWinCondition() {
        if (!this.winCondition) return;

        const state = stateManager.getState();

        if (this.winCondition.allFlags) {
            const requiredFlags = this.narrativeData.progression.flags || [];
            const hasAll = requiredFlags.every(flag => state.flags.includes(flag));

            if (hasAll) {
                this.triggerVictory();
            }
        }

        // Could add more win condition types here
    }

    /**
     * Trigger victory sequence
     */
    triggerVictory() {
        const victoryText = this.narrativeData.dialogues?.victory || 'MISSION COMPLETE!';

        eventBus.emit('terminal:glitch', { duration: 1000 });

        setTimeout(() => {
            eventBus.emit('terminal:output', {
                text: '\n' + '═'.repeat(60),
                className: 'text-success'
            });
            eventBus.emit('terminal:output', {
                text: victoryText,
                className: 'text-bright'
            });
            eventBus.emit('terminal:output', {
                text: '═'.repeat(60) + '\n',
                className: 'text-success'
            });

            stateManager.grantAchievement('Narrative Complete');
        }, 1000);
    }

    /**
     * Get current narrative info
     * @returns {Object|null}
     */
    getNarrativeInfo() {
        if (!this.narrativeData) return null;

        return {
            name: this.narrativeData.narrative,
            version: this.narrativeData.version,
            systems: this.narrativeData.systems?.length || 0
        };
    }

    /**
     * Reset narrative
     */
    reset() {
        this.currentNarrative = null;
        this.narrativeData = null;
        this.winCondition = null;
    }
}

const narrativeLoader = new NarrativeLoader();

export { narrativeLoader, NarrativeLoader };
"
Observation: Create successful: /app/terminal-engine/narratives/narrative-loader.js
