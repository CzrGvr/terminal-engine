/**
 * LocalShell - Unix-like local shell context
 * Implements basic shell commands (ls, cd, cat, etc.)
 */

import { BaseContext } from './base-context.js';
import { filesystem } from '../core/filesystem.js';
import { eventBus } from '../core/event-bus.js';
import { stateManager } from '../core/state-manager.js';

class LocalShell extends BaseContext {
    constructor() {
        super('localhost', 'Local Shell', 'local');
        this.hostname = 'vault-tec';
        this.username = 'root';
    }

    getPrompt() {
        const cwd = filesystem.getCurrentDirectory();
        const shortPath = cwd === `/home/${this.username}` ? '~' : cwd;
        return `${this.username}@${this.hostname}:${shortPath}$`;
    }

    async onEnter(params) {
        await super.onEnter(params);
        
        if (params.firstTime) {
            // Already shown in welcome screen
        }
    }

    getCommands() {
        return [
            {
                name: 'ls',
                aliases: ['dir'],
                contexts: ['local'],
                description: 'List directory contents',
                usage: 'ls [options] [path]',
                execute: async (args) => this.cmdLs(args)
            },
            {
                name: 'cd',
                contexts: ['local'],
                description: 'Change directory',
                usage: 'cd [directory]',
                execute: async (args) => this.cmdCd(args)
            },
            {
                name: 'pwd',
                contexts: ['local'],
                description: 'Print working directory',
                usage: 'pwd',
                execute: async () => this.cmdPwd()
            },
            {
                name: 'cat',
                contexts: ['local'],
                description: 'Display file contents',
                usage: 'cat <file>',
                execute: async (args) => this.cmdCat(args)
            },
            {
                name: 'grep',
                contexts: ['local'],
                description: 'Search for pattern in files',
                usage: 'grep <pattern> <file>',
                execute: async (args) => this.cmdGrep(args)
            },
            {
                name: 'find',
                contexts: ['local'],
                description: 'Search for files',
                usage: 'find <pattern>',
                execute: async (args) => this.cmdFind(args)
            },
            {
                name: 'mkdir',
                contexts: ['local'],
                description: 'Create directory',
                usage: 'mkdir <directory>',
                execute: async (args) => this.cmdMkdir(args)
            },
            {
                name: 'rm',
                contexts: ['local'],
                description: 'Remove file or directory',
                usage: 'rm <path>',
                execute: async (args) => this.cmdRm(args)
            },
            {
                name: 'echo',
                contexts: ['local'],
                description: 'Display text',
                usage: 'echo <text>',
                execute: async (args) => this.cmdEcho(args)
            },
            {
                name: 'help',
                contexts: ['*'],
                description: 'Show available commands',
                usage: 'help [command]',
                execute: async (args) => this.cmdHelp(args)
            },
            {
                name: 'clear',
                aliases: ['cls'],
                contexts: ['*'],
                description: 'Clear terminal screen',
                usage: 'clear',
                execute: async () => this.cmdClear()
            },
            {
                name: 'history',
                contexts: ['*'],
                description: 'Show command history',
                usage: 'history',
                execute: async () => this.cmdHistory()
            },
            {
                name: 'ssh',
                contexts: ['local'],
                description: 'Connect to remote system via SSH',
                usage: 'ssh <address>',
                execute: async (args) => this.cmdSsh(args)
            },
            {
                name: 'telnet',
                contexts: ['local'],
                description: 'Connect to BBS system',
                usage: 'telnet <address>',
                execute: async (args) => this.cmdTelnet(args)
            },
            {
                name: 'save',
                contexts: ['*'],
                description: 'Save game progress',
                usage: 'save [slot]',
                execute: async (args) => this.cmdSave(args)
            },
            {
                name: 'load',
                contexts: ['*'],
                description: 'Load saved game',
                usage: 'load [slot]',
                execute: async (args) => this.cmdLoad(args)
            },
            {
                name: 'inventory',
                aliases: ['inv'],
                contexts: ['*'],
                description: 'Show inventory',
                usage: 'inventory',
                execute: async () => this.cmdInventory()
            },
            {
                name: 'status',
                contexts: ['*'],
                description: 'Show game status',
                usage: 'status',
                execute: async () => this.cmdStatus()
            },
            // Easter eggs
            {
                name: 'cowsay',
                contexts: ['local'],
                description: 'Make a cow say something',
                usage: 'cowsay <message>',
                execute: async (args) => this.cmdCowsay(args),
                hidden: true
            },
            {
                name: 'matrix',
                contexts: ['local'],
                description: 'Enter the Matrix',
                usage: 'matrix',
                execute: async () => this.cmdMatrix(),
                hidden: true
            },
            {
                name: 'hack',
                contexts: ['*'],
                description: 'Initiate hacking sequence',
                usage: 'hack [target]',
                execute: async (args) => this.cmdHack(args)
            }
        ];
    }

    // Command implementations
    async cmdLs(args) {
        const showHidden = args.includes('-a') || args.includes('--all');
        const longFormat = args.includes('-l');
        const path = args.find(arg => !arg.startsWith('-')) || '.';

        const items = filesystem.list(path, showHidden);

        if (items === null) {
            return {
                success: false,
                error: `ls: cannot access '${path}': No such file or directory`
            };
        }

        if (items.length === 0) {
            return { success: true, output: '' };
        }

        let output = '';
        if (longFormat) {
            items.forEach(item => {
                const type = item.type === 'directory' ? 'd' : '-';
                const size = item.size.toString().padStart(8);
                output += `${type}${item.permissions}  ${size}  ${item.name}\n`;
            });
        } else {
            output = items.map(item => {
                const name = item.type === 'directory' ? item.name + '/' : item.name;
                return name;
            }).join('  ');
        }

        return { success: true, output, className: 'text-info' };
    }

    async cmdCd(args) {
        const path = args[0] || '/home/vault-dweller';
        
        if (filesystem.changeDirectory(path)) {
            return { success: true };
        } else {
            return {
                success: false,
                error: `cd: ${path}: No such file or directory`
            };
        }
    }

    async cmdPwd() {
        return {
            success: true,
            output: filesystem.getCurrentDirectory()
        };
    }

    async cmdCat(args) {
        if (args.length === 0) {
            return {
                success: false,
                error: 'cat: missing file operand'
            };
        }

        const content = filesystem.readFile(args[0]);
        
        if (content === null) {
            return {
                success: false,
                error: `cat: ${args[0]}: No such file or directory`
            };
        }

        // Check for hidden credentials
        if (content.includes('user=') && content.includes('pass=')) {
            const match = content.match(/user=(\w+).*pass=(\S+)/);
            if (match) {
                stateManager.setFlag('found_credentials');
            }
        }

        return { success: true, output: content };
    }

    async cmdGrep(args) {
        if (args.length < 2) {
            return {
                success: false,
                error: 'grep: usage: grep <pattern> <file>'
            };
        }

        const pattern = args[0];
        const filename = args[1];
        const content = filesystem.readFile(filename);

        if (content === null) {
            return {
                success: false,
                error: `grep: ${filename}: No such file or directory`
            };
        }

        const lines = content.split('\n');
        const matches = lines.filter(line => 
            line.toLowerCase().includes(pattern.toLowerCase())
        );

        return {
            success: true,
            output: matches.join('\n'),
            className: 'text-warning'
        };
    }

    async cmdFind(args) {
        if (args.length === 0) {
            return {
                success: false,
                error: 'find: missing pattern'
            };
        }

        const pattern = args[0];
        const results = filesystem.find(pattern);

        return {
            success: true,
            output: results.join('\n'),
            className: 'text-info'
        };
    }

    async cmdMkdir(args) {
        if (args.length === 0) {
            return {
                success: false,
                error: 'mkdir: missing operand'
            };
        }

        if (filesystem.createDirectory(args[0])) {
            return { success: true };
        } else {
            return {
                success: false,
                error: `mkdir: cannot create directory '${args[0]}'`
            };
        }
    }

    async cmdRm(args) {
        if (args.length === 0) {
            return {
                success: false,
                error: 'rm: missing operand'
            };
        }

        if (filesystem.delete(args[0])) {
            return { success: true };
        } else {
            return {
                success: false,
                error: `rm: cannot remove '${args[0]}': No such file or directory`
            };
        }
    }

    async cmdEcho(args) {
        return {
            success: true,
            output: args.join(' ')
        };
    }

    async cmdHelp(args) {
        if (args.length > 0) {
            // Show help for specific command
            const cmdName = args[0];
            const cmd = this.getCommands().find(c => c.name === cmdName);
            
            if (cmd) {
                return {
                    success: true,
                    output: `${cmd.name} - ${cmd.description}\nUsage: ${cmd.usage}`
                };
            } else {
                return {
                    success: false,
                    error: `help: no help for '${cmdName}'`
                };
            }
        }

        // Show all commands
        const commands = this.getCommands()
            .filter(cmd => !cmd.hidden)
            .sort((a, b) => a.name.localeCompare(b.name));

        let output = 'Available commands:\n\n';
        commands.forEach(cmd => {
            output += `  ${cmd.name.padEnd(12)} - ${cmd.description}\n`;
        });
        output += '\nType "help <command>" for more information.';

        return { success: true, output, className: 'text-info' };
    }

    async cmdClear() {
        eventBus.emit('terminal:clear');
        return { success: true };
    }

    async cmdHistory() {
        const history = stateManager.state.commandHistory.slice(-20);
        const output = history.map((entry, i) => 
            `  ${i + 1}  ${entry.command}`
        ).join('\n');

        return { success: true, output, className: 'text-dim' };
    }

    async cmdSsh(args) {
        if (args.length === 0) {
            return {
                success: false,
                error: 'ssh: missing host address\nUsage: ssh <address>\nExample: ssh vault-mainframe.local'
            };
        }

        // Switch to SSH context
        eventBus.emit('context:switch', {
            contextId: 'ssh',
            params: { address: args[0] }
        });

        return { success: true };
    }

    async cmdTelnet(args) {
        if (args.length === 0) {
            return {
                success: false,
                error: 'telnet: missing address'
            };
        }

        // Switch to BBS context
        eventBus.emit('context:switch', {
            contextId: 'bbs',
            params: { address: args[0] }
        });

        return { success: true };
    }

    async cmdSave(args) {
        const slot = parseInt(args[0]) || 0;
        
        if (stateManager.save(slot)) {
            return {
                success: true,
                output: `Game saved to slot ${slot}`,
                className: 'text-success'
            };
        } else {
            return {
                success: false,
                error: 'Failed to save game'
            };
        }
    }

    async cmdLoad(args) {
        const slot = parseInt(args[0]) || 0;
        
        if (stateManager.load(slot)) {
            eventBus.emit('terminal:clear');
            return {
                success: true,
                output: `Game loaded from slot ${slot}`,
                className: 'text-success'
            };
        } else {
            return {
                success: false,
                error: `No save found in slot ${slot}`
            };
        }
    }

    async cmdInventory() {
        const inv = stateManager.state.inventory;
        
        if (inv.length === 0) {
            return {
                success: true,
                output: 'Inventory is empty',
                className: 'text-dim'
            };
        }

        let output = 'Inventory:\n';
        inv.forEach((item, i) => {
            output += `  ${i + 1}. ${item}\n`;
        });

        return { success: true, output, className: 'text-info' };
    }

    async cmdStatus() {
        const state = stateManager.getState();
        const playTimeMin = Math.floor(state.playTime / 60000);

        let output = '╔════════════════════════════════╗\n';
        output += '║      SYSTEM STATUS             ║\n';
        output += '╠════════════════════════════════╣\n';
        output += `║ Play Time: ${playTimeMin} minutes\n`;
        output += `║ Flags: ${state.flags.length}\n`;
        output += `║ Systems Visited: ${state.visitedSystems.length}\n`;
        output += `║ Achievements: ${state.achievements.length}\n`;
        output += '╚════════════════════════════════╝';

        return { success: true, output, className: 'text-info' };
    }

    // Easter eggs
    async cmdCowsay(args) {
        const message = args.join(' ') || 'Moo!';
        const bubble = ' ' + '_'.repeat(message.length + 2);
        
        const art = `${bubble}
< ${message} >
 ${'-'.repeat(message.length + 2)}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||`;

        return { success: true, output: art, className: 'ascii-art' };
    }

    async cmdMatrix() {
        eventBus.emit('terminal:glitch', { duration: 2000 });
        
        return {
            success: true,
            output: 'Wake up, Neo...\nThe Matrix has you...\nFollow the white rabbit.',
            className: 'text-bright glitch-text'
        };
    }

    async cmdHack(args) {
        const target = args[0] || 'mainframe';
        
        // Trigger mini-game
        eventBus.emit('minigame:start', {
            type: 'password_crack',
            target
        });

        return { success: true };
    }
}

export { LocalShell };
