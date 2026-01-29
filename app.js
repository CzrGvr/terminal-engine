// app.js
import { TerminalApp } from './core/terminal-renderer.js';

// Initialize app once DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Terminal Engine...');

    try {
        const app = new TerminalApp();
        await app.initialize();

        console.log('Terminal Engine initialized successfully');

        // Expose for debugging
        window.terminalApp = app;
    } catch (error) {
        console.error('Failed to initialize Terminal Engine:', error);
        document.body.innerHTML = `
            <div style="color: red; font-family: monospace; padding: 20px;">
                <h2>TERMINAL INITIALIZATION FAILED</h2>
                <pre>${error.message}</pre>
                <p>Check console for details (F12)</p>
            </div>
        `;
    }
});
