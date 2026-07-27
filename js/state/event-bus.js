// ============================================================
// FILE: js/state/event-bus.js
// PURPOSE: Advanced Pub/Sub Event System - PRODUCTION v4.0
// DEPENDENCY: logger.js
// USED BY: store.js, all screens, all widgets, all services
// ============================================================

import { logger } from '../services/logger.js';

// ============================================================
// EVENT BUS CONFIGURATION
// ============================================================

export const EVENT_CONFIG = {
    version: '4.0.0',
    enabled: true,
    debugMode: false,
    maxListeners: 100,
    maxHistory: 1000,
    trackHistory: true,
    wildcardSupport: true,
    middlewareSupport: true,
    filterSupport: true,
    prioritySupport: true,
    namespaceSupport: true,
    throttleSupport: true,
    debounceSupport: true,
    onceSupport: true,
    asyncSupport: true,
    retrySupport: true,
    timeoutSupport: true,
    circuitBreaker: true,
    metricsCollector: true,
    eventValidation: true,
    autoCleanup: true,
    defaultThrottle: 300,
    defaultDebounce: 300,
    defaultTimeout: 5000,
    maxRetries: 3,
    retryDelay: 1000
};

// ============================================================
// EVENT BUS CLASS
// ============================================================

class EventBus {
    constructor() {
        // ==========================================
        // CORE PROPERTIES
        // ==========================================
        this._initialized = false;
        this._enabled = EVENT_CONFIG.enabled;
        this._debugMode = EVENT_CONFIG.debugMode;
        this._events = new Map();
        this._wildcards = new Map();
        this._namespaces = new Map();
        this._history = [];
        this._middlewares = [];
        this._filters = [];
        this._validators = [];
        this._interceptors = [];
        this._metrics = new Map();
        
        // ==========================================
        // TIMER PROPERTIES
        // ==========================================
        this._throttleTimers = new Map();
        this._debounceTimers = new Map();
        this._timeoutTimers = new Map();
        this._retryTimers = new Map();
        
        // ==========================================
        // LISTENER PROPERTIES
        // ==========================================
        this._listeners = [];
        this._onceListeners = new Set();
        this._circuitBreakers = new Map();
        this._listenerGroups = new Map();
        
        // ==========================================
        // STATS PROPERTIES
        // ==========================================
        this._eventCount = 0;
        this._listenerCount = 0;
        this._errorCount = 0;
        this._pendingEvents = [];
        this._isProcessing = false;
        this._startTime = null;
        
        // ==========================================
        // CONFIG PROPERTIES
        // ==========================================
        this._maxListeners = EVENT_CONFIG.maxListeners;
        this._maxHistory = EVENT_CONFIG.maxHistory;
        this._trackHistory = EVENT_CONFIG.trackHistory;
        this._wildcardSupport = EVENT_CONFIG.wildcardSupport;
        this._middlewareSupport = EVENT_CONFIG.middlewareSupport;
        this._filterSupport = EVENT_CONFIG.filterSupport;
        this._prioritySupport = EVENT_CONFIG.prioritySupport;
        this._namespaceSupport = EVENT_CONFIG.namespaceSupport;
        this._throttleSupport = EVENT_CONFIG.throttleSupport;
        this._debounceSupport = EVENT_CONFIG.debounceSupport;
        this._onceSupport = EVENT_CONFIG.onceSupport;
        this._asyncSupport = EVENT_CONFIG.asyncSupport;
        this._retrySupport = EVENT_CONFIG.retrySupport;
        this._timeoutSupport = EVENT_CONFIG.timeoutSupport;
        this._circuitBreakerSupport = EVENT_CONFIG.circuitBreaker;
        this._metricsCollector = EVENT_CONFIG.metricsCollector;
        this._eventValidation = EVENT_CONFIG.eventValidation;
        this._autoCleanup = EVENT_CONFIG.autoCleanup;
        this._defaultThrottle = EVENT_CONFIG.defaultThrottle;
        this._defaultDebounce = EVENT_CONFIG.defaultDebounce;
        this._defaultTimeout = EVENT_CONFIG.defaultTimeout;
        this._maxRetries = EVENT_CONFIG.maxRetries;
        this._retryDelay = EVENT_CONFIG.retryDelay;
        
        // ==========================================
        // CLEANUP PROPERTIES
        // ==========================================
        this._cleanupInterval = null;
        this._cleanupTimeout = 60000; // 1 minute
        this._lastCleanup = Date.now();
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================

    init(options = {}) {
        if (this._initialized) return this;

        const {
            enabled = true,
            debugMode = false,
            maxListeners = 100,
            maxHistory = 1000,
            trackHistory = true,
            wildcardSupport = true,
            middlewareSupport = true,
            filterSupport = true,
            prioritySupport = true,
            namespaceSupport = true,
            throttleSupport = true,
            debounceSupport = true,
            onceSupport = true,
            asyncSupport = true,
            retrySupport = true,
            timeoutSupport = true,
            circuitBreaker = true,
            metricsCollector = true,
            eventValidation = true,
            autoCleanup = true,
            defaultThrottle = 300,
            defaultDebounce = 300,
            defaultTimeout = 5000,
            maxRetries = 3,
            retryDelay = 1000,
            cleanupInterval = 60000
        } = options;

        try {
            this._enabled = enabled;
            this._debugMode = debugMode;
            this._maxListeners = maxListeners;
            this._maxHistory = maxHistory;
            this._trackHistory = trackHistory;
            this._wildcardSupport = wildcardSupport;
            this._middlewareSupport = middlewareSupport;
            this._filterSupport = filterSupport;
            this._prioritySupport = prioritySupport;
            this._namespaceSupport = namespaceSupport;
            this._throttleSupport = throttleSupport;
            this._debounceSupport = debounceSupport;
            this._onceSupport = onceSupport;
            this._asyncSupport = asyncSupport;
            this._retrySupport = retrySupport;
            this._timeoutSupport = timeoutSupport;
            this._circuitBreakerSupport = circuitBreaker;
            this._metricsCollector = metricsCollector;
            this._eventValidation = eventValidation;
            this._autoCleanup = autoCleanup;
            this._defaultThrottle = defaultThrottle;
            this._defaultDebounce = defaultDebounce;
            this._defaultTimeout = defaultTimeout;
            this._maxRetries = maxRetries;
            this._retryDelay = retryDelay;
            this._cleanupTimeout = cleanupInterval;

            this._initialized = true;
            this._startTime = Date.now();

            // Start cleanup
            if (this._autoCleanup) {
                this._startCleanup();
            }

            this._log('🚀 Event Bus v4.0 initialized', {
                enabled: this._enabled,
                debugMode: this._debugMode,
                maxListeners: this._maxListeners,
                features: {
                    wildcard: this._wildcardSupport,
                    middleware: this._middlewareSupport,
                    filter: this._filterSupport,
                    priority: this._prioritySupport,
                    namespace: this._namespaceSupport,
                    throttle: this._throttleSupport,
                    debounce: this._debounceSupport,
                    once: this._onceSupport,
                    async: this._asyncSupport,
                    retry: this._retrySupport,
                    timeout: this._timeoutSupport,
                    circuitBreaker: this._circuitBreakerSupport,
                    metrics: this._metricsCollector,
                    validation: this._eventValidation
                }
            });

            return this;
        } catch (error) {
            logger.error('❌ Event Bus initialization failed', { error: error.message });
            throw error;
        }
    }

    // ============================================================
    // EVENT REGISTRATION (ADVANCED)
    // ============================================================

    /**
     * Subscribe to an event with full options
     */
    on(event, callback, options = {}) {
        if (!this._enabled) return () => {};

        const {
            priority = 0,
            once = false,
            throttle = null,
            debounce = null,
            filter = null,
            namespace = null,
            context = null,
            timeout = null,
            retries = 0,
            circuitBreaker = null,
            group = null,
            validate = null,
            intercept = null,
            metadata = {},
            async = false
        } = options;

        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }

        let eventName = event;
        if (this._namespaceSupport && namespace) {
            eventName = `${namespace}:${event}`;
        }

        // Validate event
        if (this._eventValidation && this._validators.length > 0) {
            this._validateEvent(eventName, options);
        }

        // Check max listeners
        if (this._events.has(eventName) && 
            this._events.get(eventName).length >= this._maxListeners) {
            this._log(`⚠️ Max listeners reached for: ${eventName}`, { max: this._maxListeners });
        }

        // Create listener
        const listener = {
            id: this._generateId('listener'),
            event: eventName,
            callback,
            priority,
            once,
            throttle,
            debounce,
            filter,
            context,
            namespace,
            timeout,
            retries,
            retryCount: 0,
            circuitBreaker,
            group,
            validate,
            intercept,
            metadata,
            async,
            createdAt: Date.now(),
            called: 0,
            failed: 0,
            lastCalled: null,
            lastError: null,
            totalDuration: 0,
            active: true,
            paused: false
        };

        // Store listener
        if (!this._events.has(eventName)) {
            this._events.set(eventName, []);
        }
        this._events.get(eventName).push(listener);

        // Sort by priority
        this._events.get(eventName).sort((a, b) => b.priority - a.priority);

        // Handle group
        if (group) {
            if (!this._listenerGroups.has(group)) {
                this._listenerGroups.set(group, []);
            }
            this._listenerGroups.get(group).push(listener.id);
        }

        // Handle wildcard
        if (this._wildcardSupport && event.includes('*')) {
            this._registerWildcard(event, listener);
        }

        // Handle circuit breaker
        if (this._circuitBreakerSupport && circuitBreaker) {
            this._circuitBreakers.set(listener.id, {
                failures: 0,
                threshold: circuitBreaker.threshold || 5,
                timeout: circuitBreaker.timeout || 60000,
                state: 'closed',
                lastFailure: null
            });
        }

        this._listenerCount++;
        this._log(`📢 Listener registered: ${eventName}`, { 
            priority, once, group, id: listener.id 
        });

        // Return unsubscribe
        return () => this.off(event, callback, { namespace });
    }

    /**
     * Subscribe once with advanced options
     */
    once(event, callback, options = {}) {
        if (!this._onceSupport) {
            return this.on(event, callback, options);
        }
        return this.on(event, callback, { ...options, once: true });
    }

    /**
     * Subscribe to multiple events
     */
    onMultiple(events, callback, options = {}) {
        const unsubscribes = [];
        for (const event of events) {
            unsubscribes.push(this.on(event, callback, options));
        }
        return () => {
            for (const unsubscribe of unsubscribes) {
                unsubscribe();
            }
        };
    }

    /**
     * Subscribe with throttle
     */
    throttle(event, callback, delay = null, options = {}) {
        if (!this._throttleSupport) {
            return this.on(event, callback, options);
        }
        const throttleDelay = delay || this._defaultThrottle;
        return this.on(event, callback, { ...options, throttle: throttleDelay });
    }

    /**
     * Subscribe with debounce
     */
    debounce(event, callback, delay = null, options = {}) {
        if (!this._debounceSupport) {
            return this.on(event, callback, options);
        }
        const debounceDelay = delay || this._defaultDebounce;
        return this.on(event, callback, { ...options, debounce: debounceDelay });
    }

    /**
     * Subscribe with filter
     */
    filter(event, callback, filterFn, options = {}) {
        if (!this._filterSupport) {
            return this.on(event, callback, options);
        }
        return this.on(event, callback, { ...options, filter: filterFn });
    }

    /**
     * Subscribe with timeout
     */
    timeout(event, callback, timeout = null, options = {}) {
        if (!this._timeoutSupport) {
            return this.on(event, callback, options);
        }
        const timeoutMs = timeout || this._defaultTimeout;
        return this.on(event, callback, { ...options, timeout: timeoutMs });
    }

    /**
     * Subscribe with retry
     */
    retry(event, callback, retries = null, options = {}) {
        if (!this._retrySupport) {
            return this.on(event, callback, options);
        }
        const retryCount = retries || this._maxRetries;
        return this.on(event, callback, { ...options, retries: retryCount });
    }

    /**
     * Subscribe with circuit breaker
     */
    circuitBreaker(event, callback, config = {}, options = {}) {
        if (!this._circuitBreakerSupport) {
            return this.on(event, callback, options);
        }
        return this.on(event, callback, { 
            ...options, 
            circuitBreaker: {
                threshold: config.threshold || 5,
                timeout: config.timeout || 60000
            }
        });
    }

    /**
     * Subscribe to event with validation
     */
    validate(event, callback, validator, options = {}) {
        if (!this._eventValidation) {
            return this.on(event, callback, options);
        }
        return this.on(event, callback, { ...options, validate: validator });
    }

    /**
     * Subscribe to event with interceptor
     */
    intercept(event, callback, interceptor, options = {}) {
        return this.on(event, callback, { ...options, intercept: interceptor });
    }

    // ============================================================
    // GROUP MANAGEMENT
    // ============================================================

    /**
     * Create listener group
     */
    createGroup(groupName) {
        if (!this._listenerGroups.has(groupName)) {
            this._listenerGroups.set(groupName, []);
        }
        return {
            group: groupName,
            add: (event, callback, options = {}) => {
                return this.on(event, callback, { ...options, group: groupName });
            },
            remove: () => {
                this.removeGroup(groupName);
            },
            pause: () => {
                this.pauseGroup(groupName);
            },
            resume: () => {
                this.resumeGroup(groupName);
            }
        };
    }

    /**
     * Remove listener group
     */
    removeGroup(groupName) {
        if (!this._listenerGroups.has(groupName)) return;

        const listenerIds = this._listenerGroups.get(groupName);
        for (const id of listenerIds) {
            this._removeListenerById(id);
        }
        this._listenerGroups.delete(groupName);
        this._log(`🗑️ Group removed: ${groupName}`);
    }

    /**
     * Pause listener group
     */
    pauseGroup(groupName) {
        if (!this._listenerGroups.has(groupName)) return;

        const listenerIds = this._listenerGroups.get(groupName);
        for (const id of listenerIds) {
            this._setListenerState(id, { paused: true });
        }
        this._log(`⏸️ Group paused: ${groupName}`);
    }

    /**
     * Resume listener group
     */
    resumeGroup(groupName) {
        if (!this._listenerGroups.has(groupName)) return;

        const listenerIds = this._listenerGroups.get(groupName);
        for (const id of listenerIds) {
            this._setListenerState(id, { paused: false });
        }
        this._log(`▶️ Group resumed: ${groupName}`);
    }

    /**
     * Set listener state
     */
    _setListenerState(id, state) {
        for (const [event, listeners] of this._events) {
            for (const listener of listeners) {
                if (listener.id === id) {
                    Object.assign(listener, state);
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Remove listener by ID
     */
    _removeListenerById(id) {
        for (const [event, listeners] of this._events) {
            const index = listeners.findIndex(l => l.id === id);
            if (index !== -1) {
                listeners.splice(index, 1);
                if (listeners.length === 0) {
                    this._events.delete(event);
                }
                this._listenerCount--;
                return true;
            }
        }
        return false;
    }

    // ============================================================
    // WILDCARD EVENTS
    // ============================================================

    _registerWildcard(pattern, listener) {
        if (!this._wildcardSupport) return;

        if (!this._wildcards.has(pattern)) {
            this._wildcards.set(pattern, []);
        }
        this._wildcards.get(pattern).push(listener);
    }

    _matchWildcard(pattern, event) {
        if (!this._wildcardSupport) return false;

        // Convert wildcard pattern to regex
        const regexPattern = pattern
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(event);
    }

    _getWildcardListeners(event) {
        if (!this._wildcardSupport) return [];

        const listeners = [];
        for (const [pattern, list] of this._wildcards) {
            if (this._matchWildcard(pattern, event)) {
                listeners.push(...list);
            }
        }
        return listeners;
    }

    // ============================================================
    // EVENT EMISSION (ADVANCED)
    // ============================================================

    /**
     * Emit event with advanced options
     */
    emit(event, data = {}, options = {}) {
        if (!this._enabled) return false;

        const {
            namespace = null,
            priority = null,
            async = false,
            throwErrors = false,
            timeout = null,
            retry = 0,
            metadata = {},
            source = null,
            correlationId = null,
            validate = true
        } = options;

        let eventName = event;
        if (this._namespaceSupport && namespace) {
            eventName = `${namespace}:${event}`;
        }

        // Validate event
        if (validate && this._eventValidation && this._validators.length > 0) {
            this._validateEventData(eventName, data);
        }

        // Create event context
        const context = {
            id: this._generateId('event'),
            event: eventName,
            data,
            timestamp: Date.now(),
            namespace,
            priority,
            async,
            throwErrors,
            timeout,
            retry,
            metadata,
            source,
            correlationId: correlationId || this._generateId('corr'),
            attempts: 0,
            processed: false,
            result: null,
            error: null
        };

        // Store pending
        this._pendingEvents.push(context);

        // Track metrics
        if (this._metricsCollector) {
            this._trackMetric('event_emitted', eventName);
        }

        // Process
        if (!async) {
            return this._processEvent(context);
        }

        if (this._asyncSupport) {
            setTimeout(() => {
                this._processEvent(context);
            }, 0);
            return true;
        }

        // Fallback
        return this._processEvent(context);
    }

    /**
     * Emit async
     */
    emitAsync(event, data = {}, options = {}) {
        return this.emit(event, data, { ...options, async: true });
    }

    /**
     * Emit with priority
     */
    emitPriority(event, data = {}, priority = 0, options = {}) {
        return this.emit(event, data, { ...options, priority });
    }

    /**
     * Emit with timeout
     */
    emitTimeout(event, data = {}, timeout = null, options = {}) {
        const timeoutMs = timeout || this._defaultTimeout;
        return this.emit(event, data, { ...options, timeout: timeoutMs });
    }

    /**
     * Emit with retry
     */
    emitRetry(event, data = {}, retries = null, options = {}) {
        const retryCount = retries || this._maxRetries;
        return this.emit(event, data, { ...options, retry: retryCount });
    }

    /**
     * Emit with correlation ID
     */
    emitCorrelated(event, data = {}, correlationId, options = {}) {
        return this.emit(event, data, { ...options, correlationId });
    }

    /**
     * Process event
     */
    _processEvent(context) {
        if (this._isProcessing) {
            this._pendingEvents.push(context);
            return false;
        }

        this._isProcessing = true;

        try {
            // Get listeners
            let listeners = this._events.get(context.event) || [];

            // Get wildcard listeners
            if (this._wildcardSupport) {
                const wildcardListeners = this._getWildcardListeners(context.event);
                listeners = [...listeners, ...wildcardListeners];
            }

            // Filter by priority
            if (context.priority !== null) {
                listeners = listeners.filter(l => l.priority >= context.priority);
            }

            // Sort by priority
            listeners.sort((a, b) => b.priority - a.priority);

            // Apply middleware
            if (this._middlewareSupport && this._middlewares.length > 0) {
                listeners = this._applyMiddleware(listeners, context);
            }

            // Apply filters
            if (this._filterSupport && this._filters.length > 0) {
                listeners = this._applyFilters(listeners, context);
            }

            // Execute listeners
            const results = [];

            for (const listener of listeners) {
                if (!listener.active || listener.paused) continue;

                // Check once
                if (listener.once) {
                    if (this._onceListeners.has(listener.id)) {
                        continue;
                    }
                    this._onceListeners.add(listener.id);
                }

                // Check filter
                if (listener.filter && !listener.filter(context.data, context)) {
                    continue;
                }

                // Validate
                if (listener.validate && !listener.validate(context.data, context)) {
                    continue;
                }

                // Check circuit breaker
                if (this._circuitBreakerSupport) {
                    const breaker = this._circuitBreakers.get(listener.id);
                    if (breaker && breaker.state === 'open') {
                        const elapsed = Date.now() - (breaker.lastFailure || 0);
                        if (elapsed < breaker.timeout) {
                            continue;
                        }
                        breaker.state = 'half-open';
                    }
                }

                // Execute with timeout
                if (this._timeoutSupport && listener.timeout) {
                    const result = this._executeWithTimeout(listener, context);
                    results.push(result);
                    continue;
                }

                // Execute with retry
                if (this._retrySupport && listener.retries > 0) {
                    const result = this._executeWithRetry(listener, context);
                    results.push(result);
                    continue;
                }

                // Execute normally
                const result = this._executeListener(listener, context);
                results.push(result);
            }

            // Track history
            if (this._trackHistory) {
                this._addHistory({ ...context, listeners: listeners.length, results });
            }

            // Update stats
            this._eventCount++;

            // Track metrics
            if (this._metricsCollector) {
                this._trackMetric('event_processed', context.event);
                this._trackMetric('event_listeners', context.event, listeners.length);
            }

            // Clear pending
            const index = this._pendingEvents.indexOf(context);
            if (index !== -1) {
                this._pendingEvents.splice(index, 1);
            }

            context.processed = true;

            this._log(`📢 Event processed: ${context.event}`, {
                listeners: listeners.length,
                duration: Date.now() - context.timestamp
            });

            return results;

        } catch (error) {
            this._errorCount++;
            logger.error(`❌ Event error: ${context.event}`, { 
                error: error.message,
                stack: error.stack 
            });

            if (context.throwErrors) {
                throw error;
            }

            context.error = error;
            return null;

        } finally {
            this._isProcessing = false;

            // Process next pending
            if (this._pendingEvents.length > 0) {
                const next = this._pendingEvents.shift();
                this._processEvent(next);
            }
        }
    }

    /**
     * Execute listener with timeout
     */
    _executeWithTimeout(listener, context) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Listener timeout: ${listener.timeout}ms`));
            }, listener.timeout);

            try {
                const result = this._executeListener(listener, context);
                clearTimeout(timer);
                resolve(result);
            } catch (error) {
                clearTimeout(timer);
                reject(error);
            }
        });
    }

    /**
     * Execute listener with retry
     */
    _executeWithRetry(listener, context) {
        let attempts = 0;
        const maxRetries = listener.retries || this._maxRetries;

        const execute = () => {
            try {
                return this._executeListener(listener, context);
            } catch (error) {
                attempts++;
                if (attempts <= maxRetries) {
                    const delay = this._retryDelay * attempts;
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            resolve(execute());
                        }, delay);
                    });
                }
                throw error;
            }
        };

        return execute();
    }

    /**
     * Execute listener
     */
    _executeListener(listener, context) {
        const startTime = Date.now();

        try {
            // Apply interceptor
            let data = context.data;
            let ctx = context;
            if (listener.intercept) {
                const intercepted = listener.intercept(data, ctx);
                if (intercepted !== undefined) {
                    data = intercepted;
                }
            }

            // Execute with context
            const result = listener.callback.call(
                listener.context || null,
                data,
                ctx
            );

            // Update stats
            listener.called++;
            listener.lastCalled = Date.now();
            const duration = Date.now() - startTime;
            listener.totalDuration += duration;

            // Update circuit breaker
            if (this._circuitBreakerSupport) {
                const breaker = this._circuitBreakers.get(listener.id);
                if (breaker) {
                    breaker.failures = 0;
                    breaker.state = 'closed';
                }
            }

            return result;

        } catch (error) {
            listener.failed++;
            listener.lastError = error;

            // Update circuit breaker
            if (this._circuitBreakerSupport) {
                const breaker = this._circuitBreakers.get(listener.id);
                if (breaker) {
                    breaker.failures++;
                    breaker.lastFailure = Date.now();
                    if (breaker.failures >= breaker.threshold) {
                        breaker.state = 'open';
                    }
                }
            }

            throw error;
        }
    }

    // ============================================================
    // EVENT UNREGISTRATION
    // ============================================================

    off(event, callback, options = {}) {
        const { namespace = null } = options;

        let eventName = event;
        if (this._namespaceSupport && namespace) {
            eventName = `${namespace}:${event}`;
        }

        if (!this._events.has(eventName)) return false;

        const listeners = this._events.get(eventName);
        const initialLength = listeners.length;

        if (callback) {
            this._events.set(
                eventName,
                listeners.filter(l => l.callback !== callback)
            );
        } else {
            this._events.delete(eventName);
        }

        // Clean up wildcards
        if (this._wildcardSupport) {
            for (const [pattern, wildcardListeners] of this._wildcards) {
                if (callback) {
                    this._wildcards.set(
                        pattern,
                        wildcardListeners.filter(l => l.callback !== callback)
                    );
                } else {
                    this._wildcards.delete(pattern);
                }
            }
        }

        const removed = initialLength - (this._events.get(eventName)?.length || 0);
        this._listenerCount -= removed;

        this._log(`🔕 Listener removed: ${eventName}`, { removed });

        return removed > 0;
    }

    /**
     * Remove all listeners
     */
    removeAllListeners(event = null, options = {}) {
        const { namespace = null } = options;

        if (event) {
            let eventName = event;
            if (this._namespaceSupport && namespace) {
                eventName = `${namespace}:${event}`;
            }
            this._events.delete(eventName);
            return;
        }

        if (namespace) {
            for (const [key] of this._events) {
                if (key.startsWith(`${namespace}:`)) {
                    this._events.delete(key);
                }
            }
            return;
        }

        this._events.clear();
        this._wildcards.clear();
        this._listenerCount = 0;
        this._onceListeners.clear();
        this._circuitBreakers.clear();

        this._log('🔕 All listeners removed');
    }

    // ============================================================
    // MIDDLEWARE & FILTERS
    // ============================================================

    /**
     * Add middleware
     */
    use(middleware) {
        if (!this._middlewareSupport) return;

        if (typeof middleware !== 'function') {
            throw new Error('Middleware must be a function');
        }

        this._middlewares.push(middleware);
        this._log('🔧 Middleware added');
    }

    _applyMiddleware(listeners, context) {
        let result = listeners;
        for (const middleware of this._middlewares) {
            try {
                const processed = middleware(listeners, context);
                if (processed !== undefined) {
                    result = processed;
                }
            } catch (error) {
                logger.error('❌ Middleware error', { error: error.message });
            }
        }
        return result;
    }

    /**
     * Add filter
     */
    addFilter(filter) {
        if (!this._filterSupport) return;

        if (typeof filter !== 'function') {
            throw new Error('Filter must be a function');
        }

        this._filters.push(filter);
        this._log('🔧 Filter added');
    }

    _applyFilters(listeners, context) {
        let result = listeners;
        for (const filter of this._filters) {
            try {
                const filtered = filter(listeners, context);
                if (filtered !== undefined) {
                    result = filtered;
                }
            } catch (error) {
                logger.error('❌ Filter error', { error: error.message });
            }
        }
        return result;
    }

    /**
     * Add validator
     */
    addValidator(validator) {
        if (!this._eventValidation) return;

        if (typeof validator !== 'function') {
            throw new Error('Validator must be a function');
        }

        this._validators.push(validator);
        this._log('🔧 Validator added');
    }

    _validateEvent(event, options) {
        for (const validator of this._validators) {
            try {
                const result = validator(event, options);
                if (result === false) {
                    throw new Error(`Event validation failed: ${event}`);
                }
            } catch (error) {
                logger.error('❌ Validator error', { error: error.message });
                throw error;
            }
        }
    }

    _validateEventData(event, data) {
        for (const validator of this._validators) {
            try {
                const result = validator(event, data);
                if (result === false) {
                    throw new Error(`Event data validation failed: ${event}`);
                }
            } catch (error) {
                logger.error('❌ Validator error', { error: error.message });
                throw error;
            }
        }
    }

    // ============================================================
    // HISTORY
    // ============================================================

    _addHistory(context) {
        if (!this._trackHistory) return;

        this._history.push(context);

        if (this._history.length > this._maxHistory) {
            this._history.shift();
        }
    }

    /**
     * Get history
     */
    getHistory(options = {}) {
        const {
            event = null,
            namespace = null,
            limit = 100,
            from = null,
            to = null,
            success = null,
            error = null
        } = options;

        let history = [...this._history];

        if (event) {
            history = history.filter(h => h.event === event);
        }

        if (namespace) {
            history = history.filter(h => h.namespace === namespace);
        }

        if (from) {
            history = history.filter(h => h.timestamp >= from);
        }

        if (to) {
            history = history.filter(h => h.timestamp <= to);
        }

        if (success !== null) {
            history = history.filter(h => h.processed === success);
        }

        if (error !== null) {
            history = history.filter(h => (h.error !== null) === error);
        }

        return history.slice(-limit).reverse();
    }

    /**
     * Clear history
     */
    clearHistory() {
        this._history = [];
        this._log('📜 History cleared');
    }

    // ============================================================
    // METRICS
    // ============================================================

    _trackMetric(type, event, value = 1) {
        if (!this._metricsCollector) return;

        const key = `${type}:${event}`;
        const current = this._metrics.get(key) || { count: 0, total: 0, avg: 0, min: Infinity, max: -Infinity };
        
        current.count += 1;
        current.total += value;
        current.avg = current.total / current.count;
        current.min = Math.min(current.min, value);
        current.max = Math.max(current.max, value);
        current.last = Date.now();

        this._metrics.set(key, current);
    }

    /**
     * Get metrics
     */
    getMetrics(event = null) {
        if (!this._metricsCollector) return {};

        const metrics = {};
        for (const [key, value] of this._metrics) {
            if (event && !key.includes(event)) continue;
            metrics[key] = value;
        }
        return metrics;
    }

    /**
     * Clear metrics
     */
    clearMetrics() {
        this._metrics.clear();
        this._log('📊 Metrics cleared');
    }

    // ============================================================
    // CLEANUP
    // ============================================================

    _startCleanup() {
        if (this._cleanupInterval) {
            clearInterval(this._cleanupInterval);
        }

        this._cleanupInterval = setInterval(() => {
            this._cleanup();
        }, this._cleanupTimeout);
    }

    _cleanup() {
        const now = Date.now();
        const staleThreshold = this._cleanupTimeout * 2;

        // Clean up stale once listeners
        for (const id of this._onceListeners) {
            const listener = this._findListener(id);
            if (listener && (now - listener.createdAt) > staleThreshold) {
                this._onceListeners.delete(id);
                this._removeListenerById(id);
            }
        }

        // Clean up stale circuit breakers
        for (const [id, breaker] of this._circuitBreakers) {
            if (breaker.state === 'open' && 
                breaker.lastFailure && 
                (now - breaker.lastFailure) > (breaker.timeout * 2)) {
                this._circuitBreakers.delete(id);
            }
        }

        this._lastCleanup = now;
        this._log('🧹 Cleanup completed');
    }

    _findListener(id) {
        for (const listeners of this._events.values()) {
            for (const listener of listeners) {
                if (listener.id === id) {
                    return listener;
                }
            }
        }
        return null;
    }

    // ============================================================
    // UTILITY METHODS
    // ============================================================

    _generateId(prefix = 'evt') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }

    _log(message, data = {}) {
        if (!this._debugMode) return;
        logger.debug(`[EventBus] ${message}`, data);
    }

    /**
     * Enable/disable
     */
    enable() { this._enabled = true; this._log('🔔 Enabled'); }
    disable() { this._enabled = false; this._log('🔕 Disabled'); }
    enableDebug() { this._debugMode = true; this._log('🔍 Debug enabled'); }
    disableDebug() { this._debugMode = false; }

    /**
     * Wait for event
     */
    waitFor(event, timeout = 5000) {
        return new Promise((resolve, reject) => {
            let resolved = false;
            let timer = null;

            const unsubscribe = this.once(event, (data) => {
                if (resolved) return;
                resolved = true;
                if (timer) clearTimeout(timer);
                resolve(data);
            });

            timer = setTimeout(() => {
                if (resolved) return;
                resolved = true;
                unsubscribe();
                reject(new Error(`Event ${event} timed out after ${timeout}ms`));
            }, timeout);
        });
    }

    /**
     * Wait for event with correlation
     */
    waitForCorrelated(event, correlationId, timeout = 5000) {
        return new Promise((resolve, reject) => {
            let resolved = false;
            let timer = null;

            const unsubscribe = this.once(event, (data, context) => {
                if (context.correlationId !== correlationId) return;
                if (resolved) return;
                resolved = true;
                if (timer) clearTimeout(timer);
                resolve(data);
            });

            timer = setTimeout(() => {
                if (resolved) return;
                resolved = true;
                unsubscribe();
                reject(new Error(`Event ${event} timed out for correlation ${correlationId}`));
            }, timeout);
        });
    }

    /**
     * Create event pipeline
     */
    pipeline(event, stages) {
        if (!Array.isArray(stages)) {
            throw new Error('Pipeline stages must be an array');
        }

        return this.on(event, async (data) => {
            let current = data;
            for (const stage of stages) {
                if (typeof stage !== 'function') continue;
                try {
                    current = await stage(current);
                } catch (error) {
                    logger.error('❌ Pipeline error', { error: error.message });
                    throw error;
                }
            }
            return current;
        });
    }

    // ============================================================
    // STATUS & STATS
    // ============================================================

    /**
     * Get status
     */
    getStatus() {
        return {
            initialized: this._initialized,
            enabled: this._enabled,
            debugMode: this._debugMode,
            uptime: this._startTime ? Date.now() - this._startTime : 0,
            eventCount: this._eventCount,
            listenerCount: this._listenerCount,
            errorCount: this._errorCount,
            activeEvents: this._events.size,
            wildcards: this._wildcards.size,
            pendingEvents: this._pendingEvents.length,
            historySize: this._history.length,
            middlewares: this._middlewares.length,
            filters: this._filters.length,
            validators: this._validators.length,
            throttled: this._throttleTimers.size,
            debounced: this._debounceTimers.size,
            onceListeners: this._onceListeners.size,
            circuitBreakers: this._circuitBreakers.size,
            listenerGroups: this._listenerGroups.size,
            isProcessing: this._isProcessing,
            maxListeners: this._maxListeners,
            maxHistory: this._maxHistory,
            version: EVENT_CONFIG.version,
            features: {
                wildcard: this._wildcardSupport,
                middleware: this._middlewareSupport,
                filter: this._filterSupport,
                priority: this._prioritySupport,
                namespace: this._namespaceSupport,
                throttle: this._throttleSupport,
                debounce: this._debounceSupport,
                once: this._onceSupport,
                async: this._asyncSupport,
                retry: this._retrySupport,
                timeout: this._timeoutSupport,
                circuitBreaker: this._circuitBreakerSupport,
                metrics: this._metricsCollector,
                validation: this._eventValidation
            }
        };
    }

    /**
     * Get stats
     */
    getStats(event = null) {
        const stats = {
            totalEvents: this._eventCount,
            totalListeners: this._listenerCount,
            errorCount: this._errorCount,
            activeEvents: this._events.size,
            pendingEvents: this._pendingEvents.length,
            historySize: this._history.length,
            metrics: this._metricsCollector ? this.getMetrics(event) : {}
        };

        if (event) {
            const listeners = this._events.get(event) || [];
            const wildcardListeners = this._getWildcardListeners(event);
            stats.eventListeners = listeners.length;
            stats.wildcardListeners = wildcardListeners.length;
            stats.totalListenersForEvent = listeners.length + wildcardListeners.length;
            stats.listenerStats = this._getListenerStats(listeners);
        }

        return stats;
    }

    _getListenerStats(listeners) {
        return {
            total: listeners.length,
            once: listeners.filter(l => l.once).length,
            throttled: listeners.filter(l => l.throttle).length,
            debounced: listeners.filter(l => l.debounce).length,
            filtered: listeners.filter(l => l.filter).length,
            validated: listeners.filter(l => l.validate).length,
            intercepted: listeners.filter(l => l.intercept).length,
            withTimeout: listeners.filter(l => l.timeout).length,
            withRetry: listeners.filter(l => l.retries > 0).length,
            withCircuitBreaker: listeners.filter(l => l.circuitBreaker).length,
            byPriority: this._groupByPriority(listeners),
            averageDuration: listeners.length > 0 
                ? listeners.reduce((sum, l) => sum + l.totalDuration, 0) / listeners.length 
                : 0,
            totalCalls: listeners.reduce((sum, l) => sum + l.called, 0),
            totalFailures: listeners.reduce((sum, l) => sum + l.failed, 0)
        };
    }

    _groupByPriority(listeners) {
        const groups = {};
        for (const listener of listeners) {
            const key = listener.priority || 0;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push({
                id: listener.id,
                called: listener.called,
                failed: listener.failed,
                duration: listener.totalDuration
            });
        }
        return groups;
    }

    // ============================================================
    // NAMESPACE MANAGEMENT
    // ============================================================

    getNamespaceListeners(namespace) {
        if (!this._namespaceSupport) return [];

        const result = [];
        for (const [event, listeners] of this._events) {
            if (event.startsWith(`${namespace}:`)) {
                result.push({ event, listeners });
            }
        }
        return result;
    }

    removeNamespace(namespace) {
        if (!this._namespaceSupport) return;

        for (const [event] of this._events) {
            if (event.startsWith(`${namespace}:`)) {
                this._events.delete(event);
            }
        }

        this._log(`🔕 Namespace removed: ${namespace}`);
    }

    // ============================================================
    // QUERY METHODS
    // ============================================================

    hasListeners(event, options = {}) {
        const { namespace = null } = options;

        let eventName = event;
        if (this._namespaceSupport && namespace) {
            eventName = `${namespace}:${event}`;
        }

        if (this._events.has(eventName) && this._events.get(eventName).length > 0) {
            return true;
        }

        if (this._wildcardSupport && this._wildcards.size > 0) {
            for (const [pattern] of this._wildcards) {
                if (this._matchWildcard(pattern, eventName)) {
                    return true;
                }
            }
        }

        return false;
    }

    getListeners(event, options = {}) {
        const { namespace = null, includeWildcards = true } = options;

        let eventName = event;
        if (this._namespaceSupport && namespace) {
            eventName = `${namespace}:${event}`;
        }

        let listeners = this._events.get(eventName) || [];

        if (includeWildcards && this._wildcardSupport) {
            const wildcardListeners = this._getWildcardListeners(eventName);
            listeners = [...listeners, ...wildcardListeners];
        }

        return listeners;
    }

    getAllEvents() {
        return Array.from(this._events.keys());
    }

    getAllWildcards() {
        return Array.from(this._wildcards.keys());
    }

    // ============================================================
    // RESET & DESTROY
    // ============================================================

    reset() {
        this.removeAllListeners();
        this._history = [];
        this._middlewares = [];
        this._filters = [];
        this._validators = [];
        this._interceptors = [];
        this._metrics.clear();
        this._throttleTimers.clear();
        this._debounceTimers.clear();
        this._timeoutTimers.clear();
        this._retryTimers.clear();
        this._onceListeners.clear();
        this._circuitBreakers.clear();
        this._listenerGroups.clear();
        this._eventCount = 0;
        this._listenerCount = 0;
        this._errorCount = 0;
        this._pendingEvents = [];
        this._isProcessing = false;
        this._log('🔄 Event bus reset');
    }

    destroy() {
        if (this._cleanupInterval) {
            clearInterval(this._cleanupInterval);
            this._cleanupInterval = null;
        }

        this.reset();
        this._initialized = false;
        this._log('💥 Event bus destroyed');
    }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const eventBus = new EventBus();

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export const initEventBus = (options = {}) => eventBus.init(options);
export const on = (event, callback, options = {}) => eventBus.on(event, callback, options);
export const once = (event, callback, options = {}) => eventBus.once(event, callback, options);
export const onMultiple = (events, callback, options = {}) => eventBus.onMultiple(events, callback, options);
export const throttle = (event, callback, delay = null, options = {}) => eventBus.throttle(event, callback, delay, options);
export const debounce = (event, callback, delay = null, options = {}) => eventBus.debounce(event, callback, delay, options);
export const filter = (event, callback, filterFn, options = {}) => eventBus.filter(event, callback, filterFn, options);
export const timeout = (event, callback, timeout = null, options = {}) => eventBus.timeout(event, callback, timeout, options);
export const retry = (event, callback, retries = null, options = {}) => eventBus.retry(event, callback, retries, options);
export const circuitBreaker = (event, callback, config = {}, options = {}) => eventBus.circuitBreaker(event, callback, config, options);
export const validate = (event, callback, validator, options = {}) => eventBus.validate(event, callback, validator, options);
export const intercept = (event, callback, interceptor, options = {}) => eventBus.intercept(event, callback, interceptor, options);
export const createGroup = (groupName) => eventBus.createGroup(groupName);
export const removeGroup = (groupName) => eventBus.removeGroup(groupName);
export const pauseGroup = (groupName) => eventBus.pauseGroup(groupName);
export const resumeGroup = (groupName) => eventBus.resumeGroup(groupName);
export const emit = (event, data = {}, options = {}) => eventBus.emit(event, data, options);
export const emitAsync = (event, data = {}, options = {}) => eventBus.emitAsync(event, data, options);
export const emitPriority = (event, data = {}, priority = 0, options = {}) => eventBus.emitPriority(event, data, priority, options);
export const emitTimeout = (event, data = {}, timeout = null, options = {}) => eventBus.emitTimeout(event, data, timeout, options);
export const emitRetry = (event, data = {}, retries = null, options = {}) => eventBus.emitRetry(event, data, retries, options);
export const emitCorrelated = (event, data = {}, correlationId, options = {}) => eventBus.emitCorrelated(event, data, correlationId, options);
export const off = (event, callback, options = {}) => eventBus.off(event, callback, options);
export const removeAllListeners = (event = null, options = {}) => eventBus.removeAllListeners(event, options);
export const use = (middleware) => eventBus.use(middleware);
export const addFilter = (filter) => eventBus.addFilter(filter);
export const addValidator = (validator) => eventBus.addValidator(validator);
export const getHistory = (options = {}) => eventBus.getHistory(options);
export const clearHistory = () => eventBus.clearHistory();
export const getMetrics = (event = null) => eventBus.getMetrics(event);
export const clearMetrics = () => eventBus.clearMetrics();
export const getStatus = () => eventBus.getStatus();
export const getStats = (event = null) => eventBus.getStats(event);
export const getNamespaceListeners = (namespace) => eventBus.getNamespaceListeners(namespace);
export const removeNamespace = (namespace) => eventBus.removeNamespace(namespace);
export const waitFor = (event, timeout = 5000) => eventBus.waitFor(event, timeout);
export const waitForCorrelated = (event, correlationId, timeout = 5000) => eventBus.waitForCorrelated(event, correlationId, timeout);
export const pipeline = (event, stages) => eventBus.pipeline(event, stages);
export const hasListeners = (event, options = {}) => eventBus.hasListeners(event, options);
export const getListeners = (event, options = {}) => eventBus.getListeners(event, options);
export const getAllEvents = () => eventBus.getAllEvents();
export const enableEventBus = () => eventBus.enable();
export const disableEventBus = () => eventBus.disable();
export const enableDebug = () => eventBus.enableDebug();
export const disableDebug = () => eventBus.disableDebug();
export const resetEventBus = () => eventBus.reset();
export const destroyEventBus = () => eventBus.destroy();

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default eventBus;