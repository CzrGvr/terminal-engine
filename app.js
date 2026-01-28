// app.js
import { EventBus } from './core/event-bus.js';
import { StateManager } from './core/state-manager.js';
import { FileSystem } from './core/filesystem.js';
import { TerminalRenderer } from './core/terminal-renderer.js';
import { InputHandler } from './core/input-handler.js';
import { CommandRegistry } from './core/command-registry.js';
import { ContextManager } from './core/context-manager.js';
import { LocalShell } from './contexts/local-shell.js';

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Terminal Engine...');

    try {
        // Inicializar componentes core
        const eventBus = new EventBus();
        const stateManager = new StateManager();
        const fileSystem = new FileSystem();
        const renderer = new TerminalRenderer();
        const commandRegistry = new CommandRegistry();
        const contextManager = new ContextManager(renderer, commandRegistry);
        
        // Crear input handler
        const inputHandler = new InputHandler(
            document.getElementById('terminal-input'),
            commandRegistry,
            contextManager
        );

        // Registrar contexto inicial (Local Shell)
        const localShell = new LocalShell(renderer, fileSystem, stateManager);
        contextManager.registerContext('local', localShell);
        contextManager.switchContext('local');

        // Mostrar mensaje de bienvenida
        renderer.printWelcome();

        console.log('Terminal Engine initialized successfully');
        
        // Guardar globalmente para debugging
        window.terminal = {
            renderer,
            inputHandler,
            contextManager,
            fileSystem,
            stateManager
        };

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
