
/**
 * SSHClient - SSH connection context
 * Simulates SSH connection to remote systems with latency
 */

import { BaseContext } from './base-context.js';
import { eventBus } from '../core/event-bus.js';
import { stateManager } from '../core/state-manager.js';
import { filesystem } from '../core/filesystem.js';

class SSHClient extends BaseContext {
    constructor() {
        super('ssh', 'SSH Client', 'ssh');
        this.remoteHost = '';
        this.authenticated = false;
        this.latency = 100; // Artificial latency in ms
    }

    getPrompt() {
        const user = this.authenticated ? 'admin' : 'guest';
        return `${user}@${this.remoteHost}:~$`;
    }

    async onEnter(params) {
        await super.onEnter(params);
        this.remoteHost = params.address || 'remote.server';

        eventBus.emit('terminal:output', {
            text: `\nInitiating SSH connection to ${this.remoteHost}...`,
            className: 'text-info'
        });

        await this.sleep(800);

        // Check if host is known
        const knownHosts = {
            'mainframe.local': { requires_auth: true, accessible: true },
            'research-facility.secure': { requires_auth: true, accessible: stateManager.hasFlag('found_facility_code') },
            'data-vault.secure': { requires_auth: true, accessible: true },
            '192.168.1.10': { requires_auth: false, accessible: true }
        };

        const hostInfo = knownHosts[this.remoteHost];

        if (!hostInfo || !hostInfo.accessible) {
            eventBus.emit('terminal:output', {
                text: `ssh: connect to host ${this.remoteHost} port 22: Connection refused`,
                className: 'text-error'
            });

            await this.sleep(500);

            // Return to local shell
            eventBus.emit('context:switch', {
                contextId: 'localhost',
                params: {}
            });

            return;
        }

        eventBus.emit('terminal:output', {
            text: 'Connection established.',
            className: 'text-success'
        });

        if (hostInfo.requires_auth) {
            await this.sleep(300);
            eventBus.emit('terminal:output', {
                text: '\nAuthentication required.',
                className: 'text-warning'
            });
            eventBus.emit('terminal:output', {
                text: 'Use: auth <password> or type \"disconnect\" to close connection\n',
                className: 'text-dim'
            });
        } else {
            this.authenticated = true;
            await this.showWelcome();
        }

        stateManager.visitSystem('ssh_' + this.remoteHost);
    }

    async onExit() {
        eventBus.emit('terminal:output', {
            text: '\nClosing SSH connection...',
            className: 'text-warning'
        });
    }

    async showWelcome() {
        const welcome = `
════════════════════════════════════════════════
    SECURITY MAINFRAME SYSTEM
  Authorized Access Only
════════════════════════════════════════════════

Welcome to the secure terminal.
Type \"help\" for available commands.
`;
        eventBus.emit('terminal:output', {
            text: welcome,
            className: 'text-info'
        });
    }

    getCommands() {
        return [
            {
                name: 'auth',
                contexts: ['ssh'],
                description: 'Authenticate to system',
                usage: 'auth <password>',
                execute: async (args) => this.cmdAuth(args)
            },
            {
                name: 'ls',
                contexts: ['ssh'],
                description: 'List files',
                usage: 'ls',
                execute: async () => this.cmdLs()
            },
            {
                name: 'cat',
                contexts: ['ssh'],
                description: 'Read file',
                usage: 'cat <filename>',
                execute: async (args) => this.cmdCat(args)
            },
            {
                name: 'scan',
                contexts: ['ssh'],
                description: 'Scan system',
                usage: 'scan',
                execute: async () => this.cmdScan()
            },
            {
                name: 'status',
                contexts: ['ssh'],
                description: 'System status',
                usage: 'status',
                execute: async () => this.cmdStatus()
            },
            {
                name: 'disconnect',
                contexts: ['ssh'],
                description: 'Close SSH connection',
                usage: 'disconnect',
                execute: async () => this.cmdDisconnect()
            },
            {
                name: 'help',
                contexts: ['ssh'],
                description: 'Show commands',
                usage: 'help',
                execute: async () => this.cmdHelp()
            },
            {
                name: 'initiate',
                contexts: ['ssh'],
                description: 'Initiate system protocol',
                usage: 'initiate <protocol>',
                execute: async (args) => this.cmdInitiate(args)
            }
        ];
    }

    async cmdAuth(args) {
        if (args.length === 0) {
            return {
                success: false,
                error: 'Usage: auth <password>'
            };
        }

        const password = args[0];
        
        eventBus.emit('terminal:output', {
            text: '\nVerifying credentials...',
            className: 'text-info'
        });

        await this.sleep(this.latency + 500);

        // Valid passwords based on discovered info
        const validPasswords = ['RAVEN_NIGHT_SHADOW', 'SECURITY-admin', 'override-alpha'];

        if (validPasswords.includes(password)) {
            this.authenticated = true;
            stateManager.setFlag('ssh_authenticated');

            eventBus.emit('terminal:output', {
                text: 'Authentication successful.',
                className: 'text-success'
            });

            if (password === 'RAVEN_NIGHT_SHADOW') {
                stateManager.setFlag('used_raven_code');
                eventBus.emit('terminal:glitch', { duration: 800 });
            }

            await this.showWelcome();
            return { success: true };
        } else {
            return {
                success: false,
                error: 'Authentication failed. Access denied.',
                className: 'text-error'
            };
        }
    }

    async cmdLs() {
        if (!this.authenticated) {
            return {
                success: false,
                error: 'Permission denied. Authentication required.'
            };
        }

        await this.sleep(this.latency);

        const files = `system.log
config.dat
project_files/
classified/
backup.tar.gz`;

        return {
            success: true,
            output: files,
            className: 'text-info'
        };
    }

    async cmdCat(args) {
        if (!this.authenticated) {
            return {
                success: false,
                error: 'Permission denied.'
            };
        }

        if (args.length === 0) {
            return {
                success: false,
                error: 'Usage: cat <filename>'
            };
        }

        await this.sleep(this.latency);

        const files = {
            'system.log': '[SYSTEM] 2077-10-23 09:15:42 - Project RAVEN initialization\n[SYSTEM] 2077-10-23 12:33:18 - Neural interface test successful\n[WARNING] 2077-10-23 15:47:29 - Unauthorized access attempt detected\n[ALERT] 2077-10-23 18:22:11 - Emergency lockdown initiated',
            'config.dat': 'SYSTEM_ID=VAULT_MAINFRAME_01\nSECURITY_LEVEL=MAXIMUM\nPROTOCOL_STATUS=ACTIVE\nEMERGENCY_CODE=OMEGA-7',
            'readme.txt': 'This mainframe contains classified research data.\nAccess is restricted to authorized personnel only.'
        };

        if (!files[args[0]]) {
            return {
                success: false,
                error: `cat: ${args[0]}: No such file or directory`
            };
        }

        // Set flags for reading certain files
        if (args[0] === 'system.log') {
            stateManager.setFlag('read_system_log');
        }

        return {
            success: true,
            output: files[args[0]]
        };
    }

    async cmdScan() {
        if (!this.authenticated) {
            return {
                success: false,
                error: 'Permission denied.'
            };
        }

        eventBus.emit('terminal:output', {
            text: '\nScanning system...',
            className: 'text-info'
        });

        const renderer = window.terminalApp?.renderer;
        if (renderer) {
            await renderer.showProgressBar('Analyzing...', 3000);
        } else {
            await this.sleep(3000);
        }

        const scanResult = `
Scan Results:
-------------
System: SECURITY Mainframe v4.2
Status: OPERATIONAL
Security: ACTIVE
Open Ports: 22 (SSH), 80 (HTTP)
Running Processes: 47
Network Activity: MODERATE

[DETECTED] Encrypted data stream on port 9001
[DETECTED] Background protocol: PROJECT_RAVEN
`;

        stateManager.setFlag('scanned_mainframe');

        return {
            success: true,
            output: scanResult,
            className: 'text-warning'
        };
    }

    async cmdStatus() {
        if (!this.authenticated) {
            return {
                success: false,
                error: 'Permission denied.'
            };
        }

        await this.sleep(this.latency);

        const status = `
╔════════════════════════════════════════════╗
║      MAINFRAME SYSTEM STATUS               ║
╠════════════════════════════════════════════╣
║ CPU Usage: 34%                             ║
║ Memory: 2847 MB / 8192 MB                  ║
║ Uptime: 2847 days                          ║
║ Active Connections: 3                      ║
║ Security Level: MAXIMUM                    ║
╚════════════════════════════════════════════╝
`;

        return {
            success: true,
            output: status,
            className: 'text-info'
        };
    }

    async cmdInitiate(args) {
        if (!this.authenticated) {
            return {
                success: false,
                error: 'Permission denied.'
            };
        }

        if (args.length === 0) {
            return {
                success: false,
                error: 'Usage: initiate <protocol_name>'
            };
        }

        const protocol = args[0].toUpperCase();

        if (protocol === 'OMEGA-7' || protocol === 'OMEGA') {
            eventBus.emit('terminal:output', {
                text: '\nInitiating OMEGA-7 protocol...',
                className: 'text-warning'
            });

            await this.sleep(1000);

            eventBus.emit('terminal:glitch', { duration: 1500 });

            await this.sleep(1500);

            eventBus.emit('terminal:output', {
                text: '\n╔═══════════════════════════════════════════╗',
                className: 'text-success'
            });
            eventBus.emit('terminal:output', {
                text: '║   MISSION COMPLETE                        ║',
                className: 'text-success'
            });
            eventBus.emit('terminal:output', {
                text: '║   ACCESS GRANTED TO PROJECT RAVEN         ║',
                className: 'text-success'
            });
            eventBus.emit('terminal:output', {
                text: '╚═══════════════════════════════════════════╝',
                className: 'text-success'
            });

            stateManager.setFlag('mission_complete');
            stateManager.grantAchievement('Mission Complete');

            return { success: true };
        } else {
            return {
                success: false,
                error: `Unknown protocol: ${protocol}`
            };
        }
    }

    async cmdDisconnect() {
        eventBus.emit('context:switch', {
            contextId: 'localhost',
            params: {}
        });
        return { success: true };
    }

    async cmdHelp() {
        const commands = this.getCommands()
            .map(cmd => `  ${cmd.name.padEnd(12)} - ${cmd.description}`)
            .join('\n');

        const note = '\n\nNote: For an authoritative, contextual list run "help" (global).';

        return {
            success: true,
            output: `Available SSH commands:\n\n${commands}${note}`,
            className: 'text-info'
        };
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export { SSHClient };

