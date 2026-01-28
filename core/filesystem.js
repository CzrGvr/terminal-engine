/**
 * FileSystem - Virtual file system for terminal navigation
 * Supports Unix-like directory structure and operations
 */

import { eventBus } from './event-bus.js';

class FileSystem {
    constructor() {
        this.root = {};
        this.currentPath = '/home/vault-dweller';
        this.initialized = false;
    }

    /**
     * Initialize filesystem with default structure
     */
    initialize() {
        if (this.initialized) return;

        this.root = {
            '/': {
                type: 'directory',
                contents: {
                    'home': {
                        type: 'directory',
                        contents: {
                            'vault-dweller': {
                                type: 'directory',
                                contents: {
                                    'welcome.txt': {
                                        type: 'file',
                                        content: `VAULT-TEC TERMINAL SYSTEM v2.1
================================

Welcome to the Post-Apocalyptic Network Interface.
Your mission: Investigate the mysterious transmissions.

Available commands: help, ls, cd, cat, clear
Connect to remote systems: ssh, telnet

Good luck, Vault Dweller.`,
                                        permissions: 'rw-r--r--'
                                    },
                                    'notes.txt': {
                                        type: 'file',
                                        content: `Personal Log - Day 1
----------------------
Found strange radio signals coming from the old research facility.
Coordinates: 37.2431° N, 115.7930° W
Access code fragment: \"RAVEN_\"

Need to find more information...`,
                                        permissions: 'rw-r--r--'
                                    },
                                    'downloads': {
                                        type: 'directory',
                                        contents: {},
                                        permissions: 'rwxr-xr-x'
                                    },
                                    '.secrets': {
                                        type: 'directory',
                                        hidden: true,
                                        contents: {
                                            'password.txt': {
                                                type: 'file',
                                                content: 'BBS credentials: user=ghost / pass=shadow1337',
                                                permissions: 'rw-------'
                                            }
                                        },
                                        permissions: 'rwx------'
                                    }
                                },
                                permissions: 'rwxr-xr-x'
                            }
                        },
                        permissions: 'rwxr-xr-x'
                    },
                    'etc': {
                        type: 'directory',
                        contents: {
                            'hosts': {
                                type: 'file',
                                content: `# Network Configuration
127.0.0.1       localhost
192.168.1.10    vault-mainframe.local
10.0.0.50       darknet.bbs.net
172.16.0.100    research-facility.secure`,
                                permissions: 'r--r--r--'
                            },
                            'motd': {
                                type: 'file',
                                content: `
╔═══════════════════════════════════════════╗
║  VAULT-TEC SECURITY TERMINAL SYSTEM       ║
║  Authorized Personnel Only                ║
║  All access is monitored and logged       ║
╚═══════════════════════════════════════════╝`,
                                permissions: 'r--r--r--'
                            }
                        },
                        permissions: 'r-xr-xr-x'
                    },
                    'var': {
                        type: 'directory',
                        contents: {
                            'log': {
                                type: 'directory',
                                contents: {
                                    'system.log': {
                                        type: 'file',
                                        content: '[SYSTEM] Terminal initialized\n[SYSTEM] User authenticated\n[WARNING] Unusual network activity detected',
                                        permissions: 'rw-r--r--'
                                    }
                                },
                                permissions: 'rwxr-xr-x'
                            }
                        },
                        permissions: 'rwxr-xr-x'
                    }
                },
                permissions: 'rwxr-xr-x'
            }
        };

        this.initialized = true;
        eventBus.emit('filesystem:initialized');
    }

    /**
     * Normalize path (resolve . and ..)
     * @param {string} path - Path to normalize
     * @returns {string}
     */
    normalizePath(path) {
        if (!path.startsWith('/')) {
            path = this.currentPath + '/' + path;
        }

        const parts = path.split('/').filter(p => p !== '');
        const normalized = [];

        for (const part of parts) {
            if (part === '..') {
                normalized.pop();
            } else if (part !== '.') {
                normalized.push(part);
            }
        }

        return '/' + normalized.join('/');
    }

    /**
     * Get node at path
     * @param {string} path - Path to node
     * @returns {object|null}
     */
    getNode(path) {
        path = this.normalizePath(path);
        const parts = path.split('/').filter(p => p !== '');
        
        let current = this.root['/'];
        
        for (const part of parts) {
            if (!current.contents || !current.contents[part]) {
                return null;
            }
            current = current.contents[part];
        }

        return current;
    }

    /**
     * Check if path exists
     * @param {string} path - Path to check
     * @returns {boolean}
     */
    exists(path) {
        return this.getNode(path) !== null;
    }

    /**
     * Check if path is directory
     * @param {string} path - Path to check
     * @returns {boolean}
     */
    isDirectory(path) {
        const node = this.getNode(path);
        return node !== null && node.type === 'directory';
    }

    /**
     * Check if path is file
     * @param {string} path - Path to check
     * @returns {boolean}
     */
    isFile(path) {
        const node = this.getNode(path);
        return node !== null && node.type === 'file';
    }

    /**
     * List directory contents
     * @param {string} path - Directory path
     * @param {boolean} showHidden - Show hidden files
     * @returns {Array|null}
     */
    list(path, showHidden = false) {
        const node = this.getNode(path);
        
        if (!node || node.type !== 'directory') {
            return null;
        }

        const items = [];
        for (const [name, item] of Object.entries(node.contents || {})) {
            if (!showHidden && (name.startsWith('.') || item.hidden)) {
                continue;
            }
            items.push({
                name,
                type: item.type,
                permissions: item.permissions || 'rwxr-xr-x',
                size: item.type === 'file' ? (item.content?.length || 0) : 0,
                hidden: item.hidden || false
            });
        }

        return items;
    }

    /**
     * Read file content
     * @param {string} path - File path
     * @returns {string|null}
     */
    readFile(path) {
        const node = this.getNode(path);
        
        if (!node || node.type !== 'file') {
            return null;
        }

        eventBus.emit('filesystem:file-read', { path });
        return node.content || '';
    }

    /**
     * Write file content
     * @param {string} path - File path
     * @param {string} content - File content
     * @returns {boolean}
     */
    writeFile(path, content) {
        const normalizedPath = this.normalizePath(path);
        const parts = normalizedPath.split('/').filter(p => p !== '');
        const fileName = parts.pop();
        const dirPath = '/' + parts.join('/');

        const dirNode = this.getNode(dirPath);
        if (!dirNode || dirNode.type !== 'directory') {
            return false;
        }

        if (!dirNode.contents) {
            dirNode.contents = {};
        }

        dirNode.contents[fileName] = {
            type: 'file',
            content,
            permissions: 'rw-r--r--'
        };

        eventBus.emit('filesystem:file-written', { path: normalizedPath, content });
        return true;
    }

    /**
     * Create directory
     * @param {string} path - Directory path
     * @returns {boolean}
     */
    createDirectory(path) {
        const normalizedPath = this.normalizePath(path);
        const parts = normalizedPath.split('/').filter(p => p !== '');
        const dirName = parts.pop();
        const parentPath = '/' + parts.join('/');

        const parentNode = this.getNode(parentPath);
        if (!parentNode || parentNode.type !== 'directory') {
            return false;
        }

        if (!parentNode.contents) {
            parentNode.contents = {};
        }

        if (parentNode.contents[dirName]) {
            return false; // Already exists
        }

        parentNode.contents[dirName] = {
            type: 'directory',
            contents: {},
            permissions: 'rwxr-xr-x'
        };

        eventBus.emit('filesystem:directory-created', { path: normalizedPath });
        return true;
    }

    /**
     * Delete file or directory
     * @param {string} path - Path to delete
     * @returns {boolean}
     */
    delete(path) {
        const normalizedPath = this.normalizePath(path);
        const parts = normalizedPath.split('/').filter(p => p !== '');
        const itemName = parts.pop();
        const parentPath = '/' + parts.join('/');

        const parentNode = this.getNode(parentPath);
        if (!parentNode || !parentNode.contents || !parentNode.contents[itemName]) {
            return false;
        }

        delete parentNode.contents[itemName];
        eventBus.emit('filesystem:deleted', { path: normalizedPath });
        return true;
    }

    /**
     * Change current directory
     * @param {string} path - New directory path
     * @returns {boolean}
     */
    changeDirectory(path) {
        const normalizedPath = this.normalizePath(path);
        
        if (!this.exists(normalizedPath) || !this.isDirectory(normalizedPath)) {
            return false;
        }

        this.currentPath = normalizedPath;
        eventBus.emit('filesystem:directory-changed', { path: normalizedPath });
        return true;
    }

    /**
     * Get current working directory
     * @returns {string}
     */
    getCurrentDirectory() {
        return this.currentPath;
    }

    /**
     * Search for files matching pattern
     * @param {string} pattern - Search pattern (simple glob)
     * @param {string} startPath - Starting path
     * @returns {Array}
     */
    find(pattern, startPath = '/') {
        const results = [];
        const regex = new RegExp(pattern.replace('*', '.*'));

        const search = (path, node) => {
            if (node.type === 'file' && regex.test(path)) {
                results.push(path);
            }

            if (node.type === 'directory' && node.contents) {
                for (const [name, child] of Object.entries(node.contents)) {
                    search(path + '/' + name, child);
                }
            }
        };

        const startNode = this.getNode(startPath);
        if (startNode) {
            search(startPath, startNode);
        }

        return results;
    }

    /**
     * Get file size
     * @param {string} path - File path
     * @returns {number|null}
     */
    getSize(path) {
        const node = this.getNode(path);
        if (!node || node.type !== 'file') {
            return null;
        }
        return node.content?.length || 0;
    }
}

// Singleton instance
const filesystem = new FileSystem();

export { filesystem, FileSystem };

