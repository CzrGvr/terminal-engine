/**
 * TerminalRenderer - Handles output rendering with typing effects
 * Manages terminal display, scrolling, and visual effects
 */

import { eventBus } from './event-bus.js';
import { InputHandler } from './input-handler.js';
import { CommandRegistry } from './command-registry.js';
import { ContextManager } from './context-manager.js';
import { stateManager } from './state-manager.js';
import { filesystem } from './filesystem.js';

class TerminalRenderer {
    constructor() {
        this.outputElement = null;
        this.promptElement = null;
        this.typingSpeed = 2; // ms per character
        this.isTyping = false;
        this.typingQueue = [];
        this.initialized = false;
    }

    /**
     * Initialize renderer
     */
    initialize() {
        if (this.initialized) return;

        this.outputElement = document.getElementById('terminal-output');
        this.promptElement = document.getElementById('prompt');

        if (!this.outputElement || !this.promptElement) {
            console.error('Terminal elements not found');
            return;
        }

        // Setup event listeners
        eventBus.on('terminal:output', (data) => this.print(data.text, data.className));
        eventBus.on('terminal:clear', () => this.clear());
        eventBus.on('terminal:glitch', (data) => this.triggerGlitch(data.duration));
        eventBus.on('context:changed', (data) => this.updatePrompt(data.prompt));

        this.initialized = true;
    }

    /**
     * Print text to terminal with optional typing effect
     * @param {string} text - Text to print
     * @param {string} className - CSS class for styling
     * @param {boolean} instant - Skip typing effect
     */
    async print(text, className = '', instant = false) {
        if (instant || this.typingSpeed === 0) {
            this.printInstant(text, className);
        } else {
            await this.printWithTyping(text, className);
        }
        this.scrollToBottom();
    }

    /**
     * Print text instantly
     * @param {string} text - Text to print
     * @param {string} className - CSS class for styling
     */
    printInstant(text, className = '') {
        const lines = text.split('\n');
        
        lines.forEach(line => {
            const lineElement = document.createElement('div');
            lineElement.className = `output-line ${className}`;
            lineElement.textContent = line;
            this.outputElement.appendChild(lineElement);
        });
    }

    /**
     * Print text with typing effect
     * @param {string} text - Text to print
     * @param {string} className - CSS class for styling
     */
    async printWithTyping(text, className = '') {
        return new Promise((resolve) => {
            this.typingQueue.push({ text, className, resolve });
            if (!this.isTyping) {
                this.processTypingQueue();
            }
        });
    }

    /**
     * Process typing queue
     */
    async processTypingQueue() {
        if (this.typingQueue.length === 0) {
            this.isTyping = false;
            return;
        }

        this.isTyping = true;
        const { text, className, resolve } = this.typingQueue.shift();

        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineElement = document.createElement('div');
            lineElement.className = `output-line ${className}`;
            this.outputElement.appendChild(lineElement);

            // Type out characters
            for (let j = 0; j < line.length; j++) {
                lineElement.textContent += line[j];
                this.scrollToBottom();
                await this.sleep(this.typingSpeed);
            }
        }

        resolve();
        this.processTypingQueue();
    }

    /**
     * Clear terminal
     */
    clear() {
        if (this.outputElement) {
            this.outputElement.innerHTML = '';
        }
    }

    /**
     * Update prompt text
     * @param {string} prompt - New prompt text
     */
    updatePrompt(prompt) {
        if (this.promptElement) {
            this.promptElement.textContent = prompt;
        }
    }

    /**
     * Scroll to bottom
     */
    scrollToBottom() {
        if (this.outputElement) {
            this.outputElement.scrollTop = this.outputElement.scrollHeight;
        }
    }

    /**
     * Trigger glitch effect
     * @param {number} duration - Duration in ms
     */
    triggerGlitch(duration = 300) {
        const container = document.getElementById('terminal-container');
        if (!container) return;

        // Add glitch class
        container.classList.add('glitch-active');

        // Add corruption overlay
        const overlay = document.createElement('div');
        overlay.className = 'corruption-overlay';
        document.body.appendChild(overlay);

        // Add glitch text effect to random lines
        const lines = this.outputElement.querySelectorAll('.output-line');
        const randomLines = Array.from(lines)
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(5, lines.length));

        randomLines.forEach(line => line.classList.add('glitch-text'));

        // Remove effects after duration
        setTimeout(() => {
            container.classList.remove('glitch-active');
            overlay.remove();
            randomLines.forEach(line => line.classList.remove('glitch-text'));
        }, duration);
    }

    /**
     * Show achievement notification
     * @param {string} achievement - Achievement name
     */
    showAchievement(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement';
        notification.textContent = `🏆 Achievement Unlocked: ${achievement}`;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideIn 0.5s ease-out reverse';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    /**
     * Show progress bar
     * @param {string} label - Progress label
     * @param {number} duration - Duration in ms
     */
    async showProgressBar(label, duration = 3000) {
        const container = document.createElement('div');
        container.className = 'output-line';
        container.innerHTML = `
            <div>${label}</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
        `;
        this.outputElement.appendChild(container);

        const fill = container.querySelector('.progress-fill');
        const steps = 20;
        const stepDuration = duration / steps;

        for (let i = 0; i <= steps; i++) {
            fill.style.width = `${(i / steps) * 100}%`;
            await this.sleep(stepDuration);
        }

        this.scrollToBottom();
    }

    /**
     * Print ASCII art
     * @param {string} art - ASCII art string
     */
    printASCII(art) {
        const artElement = document.createElement('pre');
        artElement.className = 'ascii-art output-line';
        artElement.textContent = art;
        this.outputElement.appendChild(artElement);
        this.scrollToBottom();
    }

    /**
     * Sleep helper
     * @param {number} ms - Milliseconds to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Set typing speed
     * @param {number} speed - Speed in ms per character (0 for instant)
     */
    setTypingSpeed(speed) {
        this.typingSpeed = speed;
    }
}

/**
 * TerminalApp - Main application class
 */
class TerminalApp {
    constructor() {
        this.renderer = new TerminalRenderer();
        this.inputHandler = null;
        this.commandRegistry = null;
        this.contextManager = null;
    }

    /**
     * Initialize the terminal application
     */
    async initialize() {
        // Initialize core systems
        filesystem.initialize();
        stateManager.initialize();
        this.renderer.initialize();

        // Initialize command registry and context manager
        this.commandRegistry = new CommandRegistry();
        this.commandRegistry.initialize();

        this.contextManager = new ContextManager(this.commandRegistry);
        await this.contextManager.initialize();

        // Import and register contexts dynamically
        const { LocalShell } = await import('../contexts/local-shell.js');
        const { BBSSystem } = await import('../contexts/bbs-system.js');
        const { SSHClient } = await import('../contexts/ssh-client.js');

        const localShell = new LocalShell();
        const bbsSystem = new BBSSystem();
        const sshClient = new SSHClient();

        this.contextManager.registerContext('localhost', localShell);
        this.contextManager.registerContext('bbs', bbsSystem);
        this.contextManager.registerContext('ssh', sshClient);

        // Switch to initial context
        await this.contextManager.switchContext('localhost', { firstTime: true });

        // Initialize input handler
        this.inputHandler = new InputHandler(this.commandRegistry, this.contextManager);
        this.inputHandler.initialize();

        // Show welcome screen
        await this.showWelcomeScreen();

        // Setup achievement listener
        eventBus.on('achievement:unlocked', (data) => {
            this.renderer.showAchievement(data.achievement);
        });

        // Setup minigame listener
        eventBus.on('minigame:start', async (data) => {
            await this.startMinigame(data);
        });
    }

    /**
     * Start a minigame
     * @param {Object} data - Minigame data
     */
    async startMinigame(data) {
        if (data.type === 'password_crack') {
            await this.passwordCrackMinigame(data.target);
        }
    }

    /**
     * Password cracking minigame
     * @param {string} target - Target system
     */
    async passwordCrackMinigame(target) {
        const passwords = ['RAVEN', 'SHADOW', 'VAULT', 'OMEGA', 'ALPHA'];
        const correctPassword = 'RAVEN_NIGHT_SHADOW';
        
        await this.renderer.print('\n╔════════════════════════════════════════════╗', 'text-warning');
        await this.renderer.print('║   PASSWORD CRACKING SEQUENCE INITIATED     ║', 'text-warning');
        await this.renderer.print('╚════════════════════════════════════════════╝\n', 'text-warning');
        
        await this.renderer.print(`Target: ${target}`, 'text-info');
        await this.renderer.print('Analyzing security protocols...\n', 'text-dim');
        
        await this.renderer.sleep(1000);
        
        await this.renderer.print('Found password fragments:', 'text-success');
        passwords.forEach(pass => {
            this.renderer.print(`  ${pass}_`, 'text-info');
        });
        
        await this.renderer.print('\nCombine fragments to create full password.', 'text-dim');
        await this.renderer.print('Hint: Check downloaded files for the complete sequence.\n', 'text-dim');
    }

    /**
     * Show welcome screen
     */
    async showWelcomeScreen() {
        const welcomeArt = `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ██╗   ██╗ █████╗ ██╗   ██╗██╗  ████████╗              ║
║   ██║   ██║██╔══██╗██║   ██║██║  ╚══██╔══╝              ║
║   ██║   ██║███████║██║   ██║██║     ██║                 ║
║   ╚██╗ ██╔╝██╔══██║██║   ██║██║     ██║                 ║
║    ╚████╔╝ ██║  ██║╚██████╔╝███████╗██║                 ║
║     ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝                 ║
║                                                           ║
║              T E R M I N A L   S Y S T E M               ║
║                      v 2.1                                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`;

        this.renderer.printASCII(welcomeArt);
        
        await this.renderer.sleep(500);
        
        await this.renderer.print('\nINITIALIZING SYSTEM...', 'text-info');
        await this.renderer.sleep(300);
        await this.renderer.print('Loading kernel modules... [OK]', 'text-success');
        await this.renderer.print('Mounting filesystems... [OK]', 'text-success');
        await this.renderer.print('Starting network services... [OK]', 'text-success');
        
        await this.renderer.sleep(500);
        
        await this.renderer.print('\n════════════════════════════════════════════════', 'text-dim');
        await this.renderer.print('Welcome to VAULT-TEC Terminal System', 'text-bright');
        await this.renderer.print('Post-Apocalyptic Network Interface v2.1', 'text-info');
        await this.renderer.print('════════════════════════════════════════════════\n', 'text-dim');
        
        await this.renderer.print('Your mission: Investigate mysterious transmissions', 'text-warning');
        await this.renderer.print('Type "help" for available commands', 'text-dim');
        await this.renderer.print('Type "cat welcome.txt" to read your briefing\n', 'text-dim');
    }
}

export { TerminalRenderer, TerminalApp };
