Ahora voy a crear los archivos de utilidades y el sistema de narrativas:
Action: file_editor create /app/terminal-engine/utils/ascii-renderer.js --file-text "/**
 * ASCII Renderer - Handles ASCII art rendering and ANSI color codes
 */

class ASCIIRenderer {
    constructor() {
        this.colorMap = {
            black: '#000000',
            red: '#ff4444',
            green: '#00ff00',
            yellow: '#ffaa00',
            blue: '#0088ff',
            magenta: '#ff00ff',
            cyan: '#00ffff',
            white: '#ffffff'
        };
    }

    /**
     * Render ASCII art with optional coloring
     * @param {string} art - ASCII art string
     * @param {string} color - Color name
     * @returns {string}
     */
    render(art, color = 'green') {
        return art;
    }

    /**
     * Parse ANSI color codes
     * @param {string} text - Text with ANSI codes
     * @returns {string}
     */
    parseANSI(text) {
        // Simple ANSI parser (can be extended)
        return text
            .replace(/\x1b\[0m/g, '</span>')
            .replace(/\x1b\[31m/g, '<span class=\"text-error\">')
            .replace(/\x1b\[32m/g, '<span class=\"text-success\">')
            .replace(/\x1b\[33m/g, '<span class=\"text-warning\">')
            .replace(/\x1b\[36m/g, '<span class=\"text-info\">');
    }

    /**
     * Create box around text
     * @param {string} text - Text to box
     * @param {string} style - Box style ('single', 'double')
     * @returns {string}
     */
    createBox(text, style = 'double') {
        const lines = text.split('\n');
        const maxLength = Math.max(...lines.map(l => l.length));

        const chars = style === 'double' 
            ? { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' }
            : { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' };

        let result = chars.tl + chars.h.repeat(maxLength + 2) + chars.tr + '\n';
        
        lines.forEach(line => {
            const padded = line.padEnd(maxLength);
            result += `${chars.v} ${padded} ${chars.v}\n`;
        });

        result += chars.bl + chars.h.repeat(maxLength + 2) + chars.br;

        return result;
    }

    /**
     * Create progress bar
     * @param {number} percent - Progress percentage (0-100)
     * @param {number} width - Bar width
     * @returns {string}
     */
    createProgressBar(percent, width = 40) {
        const filled = Math.floor((width * percent) / 100);
        const empty = width - filled;
        return `[${'█'.repeat(filled)}${' '.repeat(empty)}] ${percent}%`;
    }

    /**
     * Center text
     * @param {string} text - Text to center
     * @param {number} width - Total width
     * @returns {string}
     */
    center(text, width = 80) {
        const padding = Math.max(0, Math.floor((width - text.length) / 2));
        return ' '.repeat(padding) + text;
    }

    /**
     * Create divider
     * @param {number} width - Divider width
     * @param {string} char - Character to use
     * @returns {string}
     */
    divider(width = 80, char = '═') {
        return char.repeat(width);
    }
}

const asciiRenderer = new ASCIIRenderer();

export { asciiRenderer, ASCIIRenderer };
"
Observation: Create successful: /app/terminal-engine/utils/ascii-renderer.js
