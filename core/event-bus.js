/**
 * EventBus - Central event system for decoupled communication
 * Implements Observer pattern for system-wide events
 */

class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Handler function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Handler to remove
     */
    off(event, callback) {
        if (!this.listeners.has(event)) return;
        
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * Emit an event to all subscribers
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (!this.listeners.has(event)) return;

        const callbacks = this.listeners.get(event);
        callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for \"${event}\":`, error);
            }
        });
    }

    /**
     * Subscribe to an event that fires only once
     * @param {string} event - Event name
     * @param {Function} callback - Handler function
     */
    once(event, callback) {
        const wrappedCallback = (data) => {
            callback(data);
            this.off(event, wrappedCallback);
        };
        this.on(event, wrappedCallback);
    }

    /**
     * Clear all listeners for an event
     * @param {string} event - Event name
     */
    clear(event) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * Get all registered events
     * @returns {string[]} Array of event names
     */
    getEvents() {
        return Array.from(this.listeners.keys());
    }
}

// Singleton instance
const eventBus = new EventBus();

export { eventBus, EventBus };
"
Observation: Create successful: /app/terminal-engine/core/event-bus.js
