/**
 * BBSSystem - Bulletin Board System context
 * Simulates retro BBS with menus, messages, and file downloads
 */

import { BaseContext } from './base-context.js';
import { eventBus } from '../core/event-bus.js';
import { stateManager } from '../core/state-manager.js';
import { filesystem } from '../core/filesystem.js';

class BBSSystem extends BaseContext {
    constructor() {
        super('bbs', 'BBS System', 'bbs');
        this.authenticated = false;
        this.currentMenu = 'main';
        this.address = '';
        this.systemName = 'DARKNET BBS';
    }

    getPrompt() {
        return `[BBS:${this.currentMenu.toUpperCase()}]>`;
    }

    async onEnter(params) {
        await super.onEnter(params);
        this.address = params.address || 'darknet.bbs.net';
        
        // Simulate connection delay
        eventBus.emit('terminal:output', {
            text: `\nConnecting to ${this.address}...`,
            className: 'text-info'
        });

        await this.sleep(800);

        eventBus.emit('terminal:output', {
            text: 'Connection established.',
            className: 'text-success'
        });

        await this.sleep(300);

        // Show BBS banner
        await this.showBanner();

        // Check authentication
        if (stateManager.hasFlag('bbs_authenticated')) {
            this.authenticated = true;
            await this.showMainMenu();
        } else {
            await this.showLoginPrompt();
        }

        stateManager.visitSystem('bbs');
    }

    async onExit() {
        eventBus.emit('terminal:output', {
            text: '\nDisconnecting from BBS...\nConnection closed.',
            className: 'text-warning'
        });
    }

    async showBanner() {
        const banner = `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ██████╗  █████╗ ██████╗ ██╗  ██╗███╗   ██╗███████╗████████╗ ║
║   ██╔══██╗██╔══██╗██╔══██╗██║ ██╔╝████╗  ██║██╔════╝╚══██╔══╝ ║
║   ██║  ██║███████║██████╔╝█████╔╝ ██╔██╗ ██║█████╗     ██║    ║
║   ██║  ██║██╔══██║██╔══██╗██╔═██╗ ██║╚██╗██║██╔══╝     ██║    ║
║   ██████╔╝██║  ██║██║  ██║██║  ██╗██║ ╚████║███████╗   ██║    ║
║   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝    ║
║                                                           ║
║              Underground Information Exchange             ║
║                    Since 2077                             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`;
        eventBus.emit('terminal:output', {
            text: banner,
            className: 'ascii-art'
        });
    }

    async showLoginPrompt() {
        eventBus.emit('terminal:output', {
            text: '\n════════════════════════════════════════════════',
            className: 'text-dim'
        });
        eventBus.emit('terminal:output', {
            text: 'LOGIN REQUIRED',
            className: 'text-warning'
        });
        eventBus.emit('terminal:output', {
            text: '════════════════════════════════════════════════\n',
            className: 'text-dim'
        });
        eventBus.emit('terminal:output', {
            text: 'Use: login <username> <password>',
            className: 'text-info'
        });
        eventBus.emit('terminal:output', {
            text: 'or type \"exit\" to disconnect\n',
            className: 'text-dim'
        });
    }

    async showMainMenu() {
        const menu = `
════════════════ MAIN MENU ════════════════

  [1] Message Boards
  [2] File Library
  [3] User List
  [4] System Info
  [5] Logout

═══════════════════════════════════════════

Type number or command name to continue.
`;
        eventBus.emit('terminal:output', {
            text: menu,
            className: 'text-info'
        });
    }

    getCommands() {
        return [
            {
                name: 'login',
                contexts: ['bbs'],
                description: 'Login to BBS',
                usage: 'login <username> <password>',
                execute: async (args) => this.cmdLogin(args)
            },
            {
                name: 'logout',
                contexts: ['bbs'],
                description: 'Logout from BBS',
                usage: 'logout',
                execute: async () => this.cmdLogout()
            },
            {
                name: 'menu',
                contexts: ['bbs'],
                description: 'Show current menu',
                usage: 'menu',
                execute: async () => this.cmdMenu()
            },
            {
                name: 'messages',
                aliases: ['1'],
                contexts: ['bbs'],
                description: 'View message boards',
                usage: 'messages',
                execute: async () => this.cmdMessages()
            },
            {
                name: 'files',
                aliases: ['2'],
                contexts: ['bbs'],
                description: 'Browse file library',
                usage: 'files',
                execute: async () => this.cmdFiles()
            },
            {
                name: 'users',
                aliases: ['3'],
                contexts: ['bbs'],
                description: 'List users',
                usage: 'users',
                execute: async () => this.cmdUsers()
            },
            {
                name: 'info',
                aliases: ['4'],
                contexts: ['bbs'],
                description: 'Show system info',
                usage: 'info',
                execute: async () => this.cmdInfo()
            },
            {
                name: 'download',
                contexts: ['bbs'],
                description: 'Download file',
                usage: 'download <filename>',
                execute: async (args) => this.cmdDownload(args)
            },
            {
                name: 'read',
                contexts: ['bbs'],
                description: 'Read message',
                usage: 'read <number>',
                execute: async (args) => this.cmdRead(args)
            },
            {
                name: 'exit',
                contexts: ['bbs'],
                description: 'Disconnect from BBS',
                usage: 'exit',
                execute: async () => this.cmdExit()
            },
            {
                name: 'help',
                contexts: ['bbs'],
                description: 'Show available commands',
                usage: 'help',
                execute: async () => this.cmdHelp()
            }
        ];
    }

    async cmdLogin(args) {
        if (args.length < 2) {
            return {
                success: false,
                error: 'Usage: login <username> <password>'
            };
        }

        const username = args[0];
        const password = args[1];

        eventBus.emit('terminal:output', {
            text: '\nAuthenticating...',
            className: 'text-info'
        });

        await this.sleep(1000);

        // Check credentials
        const validCreds = [
            { user: 'ghost', pass: 'shadow1337' },
            { user: 'admin', pass: 'vault-tec' },
            { user: 'guest', pass: 'guest' }
        ];

        const isValid = validCreds.some(c => c.user === username && c.pass === password);

        if (isValid) {
            this.authenticated = true;
            stateManager.setFlag('bbs_authenticated');
            stateManager.storeCredentials('bbs', { username, password });

            eventBus.emit('terminal:output', {
                text: `\nWelcome, ${username}!`,
                className: 'text-success'
            });

            // Trigger corruption effect if using ghost account
            if (username === 'ghost') {
                await this.sleep(500);
                eventBus.emit('terminal:glitch', { duration: 500 });
                stateManager.setFlag('ghost_login');
            }

            await this.showMainMenu();
            return { success: true };
        } else {
            return {
                success: false,
                error: '\nAccess denied. Invalid credentials.',
                className: 'text-error'
            };
        }
    }

    async cmdLogout() {
        if (!this.authenticated) {
            return {
                success: false,
                error: 'You are not logged in.'
            };
        }

        this.authenticated = false;
        await this.showLoginPrompt();
        return { success: true };
    }

    async cmdMenu() {
        if (!this.authenticated) {
            return {
                success: false,
                error: 'Please login first.'
            };
        }

        await this.showMainMenu();
        return { success: true };
    }

    async cmdMessages() {
        if (!this.authenticated) {
            return {
                success: false,
                error: 'Access denied. Please login.'
            };
        }

        const messages = `
════════════════ MESSAGE BOARDS ════════════════

  [1] General Discussion (23 messages)
  [2] Technical Support (8 messages)
  [3] Wasteland Reports (15 messages)
  [4] Encrypted Channel (3 messages) 🔒

Type \"read <number>\" to read messages.
Type \"menu\" to return to main menu.
`;

        return {
            success: true,
            output: messages,
            className: 'text-info'
        };
    }

    async cmdFiles() {
        if (!this.authenticated) {
            return {
                success: false,
                error: 'Access denied. Please login.'
            };
        }

        const files = `
════════════════ FILE LIBRARY ════════════════

  vault-map.txt          2.3 KB    Public
  radio-frequencies.txt  1.8 KB    Public
  research-notes.txt     4.1 KB    Members
  classified-data.zip    8.7 KB    Encrypted 🔒

Type \"download <filename>\" to download.
Type \"menu\" to return to main menu.
`;

        return {
            success: true,
            output: files,
            className: 'text-info'
        };
    }

    async cmdUsers() {
        if (!this.authenticated) {
            return {
                success: false,
                error: 'Access denied. Please login.'
            };
        }

        const users = `
════════════════ USER LIST ════════════════

  ghost        [SYSOP]      Last seen: 2 hours ago
  wanderer     [Member]     Last seen: 1 day ago
  techie       [Member]     Last seen: 3 days ago
  shadow       [Guest]      Last seen: 5 days ago

Total users: 47
Online now: 3
`;

        return {
            success: true,
            output: users,
            className: 'text-info'
        };
    }

    async cmdInfo() {
        const info = `
════════════════ SYSTEM INFO ════════════════

  System: DARKNET BBS v3.2
  Location: Undisclosed
  Uptime: 2847 days
  Total Calls: 15,847
  Files: 342
  Messages: 2,891

  Running on: Vault-Tec Terminal System
  Network: Post-Apocalyptic Mesh Network

\"Knowledge is power. Share responsibly.\"
`;

        return {
            success: true,
            output: info,
            className: 'text-dim'
        };
    }

    async cmdDownload(args) {
        if (!this.authenticated) {
            return {
                success: false,
                error: 'Access denied. Please login.'
            };
        }

        if (args.length === 0) {
            return {
                success: false,
                error: 'Usage: download <filename>'
            };
        }

        const filename = args[0];
        const availableFiles = {
            'vault-map.txt': 'Map of nearby vault locations...\nVault 13: 37.2431° N, 115.7930° W',
            'radio-frequencies.txt': 'Emergency frequencies:\n144.39 MHz - Vault Network\n446.50 MHz - Wasteland Comms',
            'research-notes.txt': 'CLASSIFIED RESEARCH\n\nProject RAVEN initiated.\nObjective: Neural interface development.\n\nAccess code fragment discovered: _NIGHT_SHADOW'
        };

        if (!availableFiles[filename]) {
            return {
                success: false,
                error: `File not found: ${filename}`
            };
        }

        eventBus.emit('terminal:output', {
            text: `\nInitiating download: ${filename}`,
            className: 'text-info'
        });

        // Show progress bar
        const renderer = window.terminalApp?.renderer;
        if (renderer) {
            await renderer.showProgressBar('Downloading...', 2000);
        } else {
            await this.sleep(2000);
        }

        // Save to filesystem
        filesystem.writeFile(`/home/vault-dweller/downloads/${filename}`, availableFiles[filename]);
        stateManager.addToInventory(filename);

        // Set flag if research notes downloaded
        if (filename === 'research-notes.txt') {
            stateManager.setFlag('downloaded_research_notes');
        }

        return {
            success: true,
            output: `\nDownload complete: ${filename}\nSaved to: ~/downloads/${filename}`,
            className: 'text-success'
        };
    }

    async cmdRead(args) {
        if (!this.authenticated) {
            return {
                success: false,
                error: 'Access denied. Please login.'
            };
        }

        if (args.length === 0) {
            return {
                success: false,
                error: 'Usage: read <message_number>'
            };
        }

        const msgNum = parseInt(args[0]);
        const messages = {
            1: 'From: wanderer\nSubject: Safe zones\n\nFound a clean water source near the old facility. Coordinates in vault-map.txt.',
            2: 'From: techie\nSubject: Terminal access\n\nAnyone know how to bypass Vault-Tec security? Need access codes.',
            3: 'From: ghost\nSubject: Research data\n\nCheck file library for updates. More fragments incoming.',
            4: 'From: [ENCRYPTED]\nSubject: [ENCRYPTED]\n\n[This message requires level 2 clearance]'
        };

        if (!messages[msgNum]) {
            return {
                success: false,
                error: `Message ${msgNum} not found.`
            };
        }

        return {
            success: true,
            output: `\n${messages[msgNum]}`,
            className: 'text-info'
        };
    }

    async cmdExit() {
        eventBus.emit('context:switch', {
            contextId: 'localhost',
            params: {}
        });
        return { success: true };
    }

    async cmdHelp() {
        const commands = this.getCommands()
            .filter(cmd => !cmd.hidden)
            .map(cmd => `  ${cmd.name.padEnd(12)} - ${cmd.description}`)
            .join('\n');

        return {
            success: true,
            output: `Available BBS commands:\n\n${commands}`,
            className: 'text-info'
        };
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export { BBSSystem };

