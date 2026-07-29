// Simple Event Bus
// FILE: js/event-bus.js
// PURPOSE: Lightweight pub/sub used across the app for decoupled communication

class EventBus {
    constructor() {
        this._events = Object.create(null);
    }

    on(event, handler) {
        if (!this._events[event]) this._events[event] = [];
        this._events[event].push(handler);
        return () => this.off(event, handler);
    }

    off(event, handler) {
        if (!this._events[event]) return;
        if (!handler) {
            delete this._events[event];
            return;
        }
        this._events[event] = this._events[event].filter(h => h !== handler);
        if (this._events[event].length === 0) delete this._events[event];
    }

    once(event, handler) {
        const wrapped = (...args) => {
            try { handler(...args); } finally { this.off(event, wrapped); }
        };
        return this.on(event, wrapped);
    }

    emit(event, ...args) {
        const handlers = this._events[event];
        if (!handlers || handlers.length === 0) return 0;
        // slice to guard against mutation during emit
        handlers.slice().forEach(h => {
            try { h(...args); } catch (e) {
                // Do not throw from the bus; log for debugging
                console.error('[EventBus] handler error for', event, e);
            }
        });
        return handlers.length;
    }
}

const bus = new EventBus();

// Named exports for convenience and backwards compatibility
export default bus;
export const on = bus.on.bind(bus);
export const off = bus.off.bind(bus);
export const once = bus.once.bind(bus);
export const emit = bus.emit.bind(bus);
