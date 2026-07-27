// ============================================================
// FILE: js/services/logger.js
// PURPOSE: Advanced Production-Ready Logging System
// DEPENDENCY: NONE
// USED BY: error-handler.js, All Services, App.js
// VERSION: 3.0.0
// ============================================================

/**
 * 📊 ZYMORE LOGGER v3.0
 * 
 * Complete Production-Ready Logging System with:
 * - 6 Log Levels (DEBUG, INFO, WARN, ERROR, FATAL, SILENT)
 * - Console Styling with Colors
 * - Log History with Persistence
 * - Performance Tracking
 * - Remote Logging (Sentry/Server)
 * - Context & Tags Support
 * - Log Filtering & Search
 * - Export/Import Logs
 * - Memory Management
 * - Environment-Aware Configuration
 */

// ─── LOG LEVELS ──────────────────────────────────────────────

export const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    FATAL: 4,
    SILENT: 5
};

// ─── LOG LEVEL NAMES ─────────────────────────────────────────

export const LOG_LEVEL_NAMES = {
    0: 'DEBUG',
    1: 'INFO',
    2: 'WARN',
    3: 'ERROR',
    4: 'FATAL',
    5: 'SILENT'
};

// ─── LOG CONFIGURATION ──────────────────────────────────────

const LOG_CONFIG = {
    level: window.APP_CONFIG?.ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG,
    maxHistory: 10000,
    useColors: true,
    showTimestamp: true,
    showSource: true,
    persist: false,
    remoteLogging: false,
    remoteEndpoint: '/api/logs',
    batchSize: 100,
    flushInterval: 30000,
    maxBatchSize: 1000,
    memoryLimit: 50 * 1024 * 1024
};

// ─── LOG HISTORY STORAGE ─────────────────────────────────────

let logHistory = [];
let isPaused = false;
let isFlushing = false;
let batchQueue = [];
let flushTimer = null;

// ─── COLOR SCHEMES ───────────────────────────────────────────

const COLORS = {
    DEBUG: 'color: #4CAF50; font-weight: bold;',
    INFO: 'color: #2196F3; font-weight: bold;',
    WARN: 'color: #FF9800; font-weight: bold;',
    ERROR: 'color: #F44336; font-weight: bold;',
    FATAL: 'color: #FFFFFF; background: #F44336; font-weight: bold; padding: 2px 6px; border-radius: 3px;',
    TIMESTAMP: 'color: #9E9E9E; font-size: 11px;',
    SOURCE: 'color: #9C27B0; font-weight: 500;',
    TAG: 'color: #009688; font-weight: bold;',
    DATA: 'color: #607D8B; font-style: italic;',
    RESET: 'color: inherit;'
};

// ─── ENVIRONMENT DETECTION ──────────────────────────────────

const isBrowser = typeof window !== 'undefined';
const isNode = typeof process !== 'undefined';
const isProduction = isBrowser 
    ? (window.APP_CONFIG?.ENV === 'production')
    : (process?.env?.NODE_ENV === 'production');

// ─── MAIN LOGGER CLASS ──────────────────────────────────────

class Logger {
    constructor() {
        this._context = {};
        this._tags = [];
        this._startTime = Date.now();
        this._logCounts = {
            debug: 0,
            info: 0,
            warn: 0,
            error: 0,
            fatal: 0
        };
        this._sessionId = this._generateSessionId();
        this._initialized = false;
        this._init();
    }

    /**
     * Initialize logger with environment settings
     */
    _init() {
        if (this._initialized) return;
        
        this._initialized = true;
        
        // Set log level based on environment
        if (isProduction) {
            this.setLevel(LOG_LEVELS.INFO);
        } else if (window.APP_CONFIG?.ENV === 'test') {
            this.setLevel(LOG_LEVELS.WARN);
        } else {
            this.setLevel(LOG_LEVELS.DEBUG);
        }

        // Enable remote logging in production
        if (isProduction) {
            this.enableRemoteLogging(window.APP_CONFIG?.LOG_ENDPOINT || '/api/logs');
        }

        // Start auto-flush timer
        if (LOG_CONFIG.remoteLogging) {
            this._startFlushTimer();
        }

        this.info('🚀 Logger initialized', {
            sessionId: this._sessionId,
            level: LOG_LEVEL_NAMES[LOG_CONFIG.level],
            environment: isProduction ? 'production' : 'development',
            version: window.APP_CONFIG?.VERSION || '1.0.0',
            platform: isBrowser ? 'browser' : 'node'
        });
    }

    /**
     * Generate unique session ID
     */
    _generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get current timestamp with timezone
     */
    _getTimestamp() {
        const now = new Date();
        return {
            iso: now.toISOString(),
            locale: now.toLocaleString(),
            timestamp: now.getTime(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    /**
     * Get source information from stack trace
     */
    _getSource() {
        try {
            const stack = new Error().stack;
            const lines = stack.split('\n');
            
            for (let i = 3; i < Math.min(lines.length, 15); i++) {
                const line = lines[i];
                if (!line) continue;
                if (line.includes('logger.js')) continue;
                if (line.includes('node_modules')) continue;
                if (line.includes('internal/')) continue;

                // Try to extract function and file
                const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
                if (match) {
                    const [, func, file, lineNum] = match;
                    const fileName = file.split('/').pop().split('\\').pop();
                    const shortFunc = func.split(' ').pop();
                    return {
                        function: shortFunc || 'anonymous',
                        file: fileName || 'unknown',
                        line: parseInt(lineNum) || 0,
                        full: `${shortFunc} (${fileName}:${lineNum})`
                    };
                }
                
                // Fallback for simple stack
                const simpleMatch = line.match(/at\s+(.+?)\s+\(/);
                if (simpleMatch) {
                    return {
                        function: simpleMatch[1],
                        file: 'unknown',
                        line: 0,
                        full: simpleMatch[1]
                    };
                }
            }
        } catch (e) {
            // Silent fail
        }
        return {
            function: 'unknown',
            file: 'unknown',
            line: 0,
            full: 'unknown'
        };
    }

    /**
     * Set log level
     */
    setLevel(level) {
        LOG_CONFIG.level = level;
        return this;
    }

    /**
     * Get current log level
     */
    getLevel() {
        return LOG_CONFIG.level;
    }

    /**
     * Set context for all logs
     */
    setContext(context) {
        this._context = { ...this._context, ...context };
        return this;
    }

    /**
     * Add tags to logs
     */
    addTags(...tags) {
        this._tags = [...this._tags, ...tags];
        return this;
    }

    /**
     * Clear all tags
     */
    clearTags() {
        this._tags = [];
        return this;
    }

    /**
     * Create child logger with inherited context
     */
    child(additionalContext) {
        const child = new Logger();
        child._context = { ...this._context, ...additionalContext };
        child._tags = [...this._tags];
        child._sessionId = this._sessionId;
        return child;
    }

    /**
     * Pause logging
     */
    pause() {
        isPaused = true;
        return this;
    }

    /**
     * Resume logging
     */
    resume() {
        isPaused = false;
        return this;
    }

    /**
     * Clear log history
     */
    clearHistory() {
        logHistory = [];
        return this;
    }

    /**
     * Get log history
     */
    getHistory(options = {}) {
        let result = [...logHistory];
        
        if (options.level !== undefined) {
            result = result.filter(log => log.level === options.level);
        }
        if (options.tags) {
            const tags = Array.isArray(options.tags) ? options.tags : [options.tags];
            result = result.filter(log => 
                tags.some(tag => log.tags.includes(tag))
            );
        }
        if (options.search) {
            const search = options.search.toLowerCase();
            result = result.filter(log => 
                log.message.toLowerCase().includes(search) ||
                JSON.stringify(log.data).toLowerCase().includes(search)
            );
        }
        if (options.limit) {
            result = result.slice(-options.limit);
        }
        if (options.from) {
            result = result.filter(log => new Date(log.timestamp.timestamp) >= new Date(options.from));
        }
        if (options.to) {
            result = result.filter(log => new Date(log.timestamp.timestamp) <= new Date(options.to));
        }
        
        return result;
    }

    /**
     * Get log counts
     */
    getCounts() {
        return { ...this._logCounts };
    }

    /**
     * Enable remote logging
     */
    enableRemoteLogging(endpoint) {
        LOG_CONFIG.remoteLogging = true;
        if (endpoint) {
            LOG_CONFIG.remoteEndpoint = endpoint;
        }
        this._startFlushTimer();
        return this;
    }

    /**
     * Disable remote logging
     */
    disableRemoteLogging() {
        LOG_CONFIG.remoteLogging = false;
        this._stopFlushTimer();
        return this;
    }

    /**
     * Enable persistence
     */
    enablePersistence() {
        LOG_CONFIG.persist = true;
        this._loadFromStorage();
        return this;
    }

    /**
     * Disable persistence
     */
    disablePersistence() {
        LOG_CONFIG.persist = false;
        this._clearStorage();
        return this;
    }

    /**
     * Start auto-flush timer
     */
    _startFlushTimer() {
        if (flushTimer) return;
        flushTimer = setInterval(() => {
            this._flushBatch();
        }, LOG_CONFIG.flushInterval);
    }

    /**
     * Stop auto-flush timer
     */
    _stopFlushTimer() {
        if (flushTimer) {
            clearInterval(flushTimer);
            flushTimer = null;
        }
    }

    /**
     * Internal log method
     */
    _log(level, message, data = {}, tags = []) {
        if (isPaused) return;
        if (level < LOG_CONFIG.level) return;

        const allTags = [...this._tags, ...tags];
        const source = this._getSource();
        const timestamp = this._getTimestamp();

        // Count log
        const levelName = LOG_LEVEL_NAMES[level]?.toLowerCase() || 'unknown';
        if (this._logCounts[levelName] !== undefined) {
            this._logCounts[levelName]++;
        }

        const logEntry = {
            sessionId: this._sessionId,
            level,
            levelName: LOG_LEVEL_NAMES[level] || 'UNKNOWN',
            timestamp,
            message,
            data: {
                ...this._context,
                ...data
            },
            tags: allTags,
            source,
            uptime: Date.now() - this._startTime,
            environment: isProduction ? 'production' : 'development',
            browser: isBrowser ? {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform
            } : null
        };

        // Store in history
        logHistory.push(logEntry);
        if (logHistory.length > LOG_CONFIG.maxHistory) {
            logHistory.splice(0, logHistory.length - LOG_CONFIG.maxHistory);
        }

        // Check memory limit
        this._checkMemory();

        // Console output
        if (LOG_CONFIG.useColors) {
            this._consoleWithColor(logEntry);
        } else {
            this._consolePlain(logEntry);
        }

        // Remote logging (batch)
        if (LOG_CONFIG.remoteLogging) {
            this._addToBatch(logEntry);
        }

        // Persistence
        if (LOG_CONFIG.persist) {
            this._saveToStorage(logEntry);
        }
    }

    /**
     * Check memory usage
     */
    _checkMemory() {
        try {
            const size = new Blob([JSON.stringify(logHistory)]).size;
            if (size > LOG_CONFIG.memoryLimit) {
                logHistory.splice(0, Math.floor(logHistory.length / 2));
                this.warn('Memory limit reached, truncated log history', {
                    size,
                    limit: LOG_CONFIG.memoryLimit,
                    remaining: logHistory.length
                });
            }
        } catch (e) {
            // Silent fail
        }
    }

    /**
     * Console output with colors
     */
    _consoleWithColor(logEntry) {
        const { level, levelName, message, data, tags, source, timestamp } = logEntry;
        const color = COLORS[levelName] || COLORS.DEBUG;
        
        const styles = [];
        const parts = [];

        // Timestamp
        if (LOG_CONFIG.showTimestamp) {
            parts.push(`%c${timestamp.iso}`);
            styles.push(COLORS.TIMESTAMP);
        }

        // Source
        if (LOG_CONFIG.showSource && source.full !== 'unknown') {
            parts.push(`%c[${source.function}]`);
            styles.push(COLORS.SOURCE);
        }

        // Tags
        if (tags.length > 0) {
            parts.push(`%c[${tags.join('][')}]`);
            styles.push(COLORS.TAG);
        }

        // Level
        parts.push(`%c${levelName}:`);
        styles.push(color);

        // Message
        parts.push(message);

        // Data
        let dataStr = '';
        if (data && Object.keys(data).length > 0) {
            dataStr = ` %c${JSON.stringify(data)}`;
            parts.push(dataStr);
            styles.push(COLORS.DATA);
        }

        console.log(parts.join(' '), ...styles);
    }

    /**
     * Console output without colors
     */
    _consolePlain(logEntry) {
        const { levelName, message, data, tags, source, timestamp } = logEntry;
        const parts = [];

        if (LOG_CONFIG.showTimestamp) {
            parts.push(`[${timestamp.iso}]`);
        }
        if (LOG_CONFIG.showSource && source.full !== 'unknown') {
            parts.push(`[${source.full}]`);
        }
        if (tags.length > 0) {
            parts.push(`[${tags.join('][')}]`);
        }
        parts.push(`${levelName}:`);
        parts.push(message);
        
        if (data && Object.keys(data).length > 0) {
            parts.push(JSON.stringify(data));
        }

        console.log(parts.join(' '));
    }

    /**
     * Add to batch for remote logging
     */
    _addToBatch(logEntry) {
        batchQueue.push(logEntry);
        if (batchQueue.length >= LOG_CONFIG.batchSize) {
            this._flushBatch();
        }
    }

    /**
     * Flush batch to remote server
     */
    async _flushBatch() {
        if (isFlushing || batchQueue.length === 0) return;
        isFlushing = true;

        const batch = [...batchQueue];
        batchQueue = [];

        try {
            const payload = {
                sessionId: this._sessionId,
                logs: batch,
                environment: isProduction ? 'production' : 'development',
                timestamp: new Date().toISOString()
            };

            // Use sendBeacon for better delivery
            if (isBrowser && navigator.sendBeacon) {
                const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                const success = navigator.sendBeacon(LOG_CONFIG.remoteEndpoint, blob);
                if (!success) {
                    throw new Error('sendBeacon failed');
                }
            } else {
                const response = await fetch(LOG_CONFIG.remoteEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    keepalive: true,
                    timeout: 5000
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
            }

            this.debug('Batch flushed successfully', { count: batch.length });

        } catch (error) {
            // Re-queue on failure
            batchQueue = [...batch, ...batchQueue];
            // Limit queue size
            if (batchQueue.length > LOG_CONFIG.maxBatchSize) {
                batchQueue.splice(0, batchQueue.length - LOG_CONFIG.maxBatchSize);
            }
            this.error('Failed to flush batch', { error: error.message, count: batch.length });
        } finally {
            isFlushing = false;
        }
    }

    /**
     * Save log to storage
     */
    _saveToStorage(logEntry) {
        try {
            if (!isBrowser) return;
            const key = `zymore_logs_${new Date().toISOString().split('T')[0]}`;
            let stored = JSON.parse(localStorage.getItem(key) || '[]');
            stored.push(logEntry);
            if (stored.length > 1000) {
                stored = stored.slice(-1000);
            }
            localStorage.setItem(key, JSON.stringify(stored));
        } catch (e) {
            // Silent fail
        }
    }

    /**
     * Load logs from storage
     */
    _loadFromStorage() {
        try {
            if (!isBrowser) return;
            const keys = Object.keys(localStorage).filter(k => k.startsWith('zymore_logs_'));
            for (const key of keys) {
                try {
                    const logs = JSON.parse(localStorage.getItem(key) || '[]');
                    logHistory = [...logHistory, ...logs];
                } catch (e) {
                    // Ignore
                }
            }
            if (logHistory.length > LOG_CONFIG.maxHistory) {
                logHistory = logHistory.slice(-LOG_CONFIG.maxHistory);
            }
        } catch (e) {
            // Silent fail
        }
    }

    /**
     * Clear storage
     */
    _clearStorage() {
        try {
            if (!isBrowser) return;
            const keys = Object.keys(localStorage).filter(k => k.startsWith('zymore_logs_'));
            for (const key of keys) {
                localStorage.removeItem(key);
            }
        } catch (e) {
            // Silent fail
        }
    }

    // ─── PUBLIC LOGGING METHODS ──────────────────────────────

    debug(message, data = {}, tags = []) {
        this._log(LOG_LEVELS.DEBUG, message, data, tags);
        return this;
    }

    info(message, data = {}, tags = []) {
        this._log(LOG_LEVELS.INFO, message, data, tags);
        return this;
    }

    warn(message, data = {}, tags = []) {
        this._log(LOG_LEVELS.WARN, message, data, tags);
        return this;
    }

    error(message, data = {}, tags = []) {
        this._log(LOG_LEVELS.ERROR, message, data, tags);
        return this;
    }

    fatal(message, data = {}, tags = []) {
        this._log(LOG_LEVELS.FATAL, message, data, tags);
        return this;
    }

    /**
     * Log with custom level
     */
    log(level, message, data = {}, tags = []) {
        this._log(level, message, data, tags);
        return this;
    }

    /**
     * Log performance metric
     */
    performance(operation, duration, data = {}) {
        this.info(`⏱️ ${operation} - ${duration}ms`, {
            ...data,
            duration,
            operation,
            timestamp: Date.now()
        }, ['performance']);
        return this;
    }

    /**
     * Log API call
     */
    api(method, url, status, duration, data = {}) {
        const emoji = status < 400 ? '✅' : '❌';
        this.info(`${emoji} API ${method} ${url} → ${status} (${duration}ms)`, {
            method,
            url,
            status,
            duration,
            ...data
        }, ['api']);
        return this;
    }

    /**
     * Log user action
     */
    userAction(action, data = {}) {
        this.info(`👤 ${action}`, {
            action,
            userId: window.APP_STORE?.state?.user?.uid || 'anonymous',
            ...data
        }, ['user', 'action']);
        return this;
    }

    /**
     * Log system event
     */
    system(event, data = {}) {
        this.info(`🖥️ ${event}`, {
            event,
            ...data
        }, ['system']);
        return this;
    }

    /**
     * Log security event
     */
    security(event, data = {}) {
        this.warn(`🔒 ${event}`, {
            event,
            ...data
        }, ['security']);
        return this;
    }

    /**
     * Log database operation
     */
    database(operation, collection, duration, data = {}) {
        this.debug(`🗄️ ${operation} on ${collection} (${duration}ms)`, {
            operation,
            collection,
            duration,
            ...data
        }, ['database']);
        return this;
    }

    /**
     * Log authentication event
     */
    auth(event, userId, data = {}) {
        this.info(`🔑 ${event}`, {
            event,
            userId,
            ...data
        }, ['auth']);
        return this;
    }

    /**
     * Log network event
     */
    network(url, status, data = {}) {
        const emoji = status < 400 ? '🌐' : '🚨';
        this.debug(`${emoji} ${url} → ${status}`, {
            url,
            status,
            ...data
        }, ['network']);
        return this;
    }

    /**
     * Log UI interaction
     */
    ui(element, action, data = {}) {
        this.debug(`🎨 ${action} on ${element}`, {
            element,
            action,
            ...data
        }, ['ui']);
        return this;
    }

    /**
     * Log with custom emoji
     */
    custom(emoji, message, data = {}, tags = []) {
        this.info(`${emoji} ${message}`, data, tags);
        return this;
    }

    /**
     * Log start of a process
     */
    startProcess(name, data = {}) {
        this.info(`▶️ Starting: ${name}`, data, ['process', 'start']);
        return this;
    }

    /**
     * Log end of a process
     */
    endProcess(name, duration, data = {}) {
        this.info(`⏹️ Completed: ${name} (${duration}ms)`, {
            duration,
            ...data
        }, ['process', 'end']);
        return this;
    }

    /**
     * Log error with stack trace
     */
    errorWithStack(error, context = {}) {
        this.error(error.message || 'Unknown error', {
            ...context,
            stack: error.stack,
            name: error.name,
            code: error.code
        }, ['error', 'stack']);
        return this;
    }

    /**
     * Flush logs immediately
     */
    async flush() {
        await this._flushBatch();
        return this;
    }

    /**
     * Export logs as JSON
     */
    exportJSON(options = {}) {
        const logs = this.getHistory(options);
        const data = {
            sessionId: this._sessionId,
            exportedAt: new Date().toISOString(),
            count: logs.length,
            logs
        };
        return JSON.stringify(data, null, 2);
    }

    /**
     * Export logs as CSV
     */
    exportCSV(options = {}) {
        const logs = this.getHistory(options);
        if (logs.length === 0) return 'No logs available';
        
        const headers = ['Level', 'Timestamp', 'Message', 'Source', 'Tags', 'Data'];
        const rows = logs.map(log => {
            return [
                log.levelName,
                log.timestamp.iso,
                log.message,
                log.source.full || 'unknown',
                log.tags.join(';'),
                JSON.stringify(log.data)
            ];
        });
        
        const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        return csv;
    }

    /**
     * Download logs as file
     */
    download(format = 'json') {
        try {
            const data = format === 'json' ? this.exportJSON() : this.exportCSV();
            const mimeType = format === 'json' ? 'application/json' : 'text/csv';
            const extension = format === 'json' ? 'json' : 'csv';
            
            const blob = new Blob([data], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `logs_${new Date().toISOString().split('T')[0]}.${extension}`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.info(`Logs downloaded (${format})`, { count: logHistory.length });
            return true;
        } catch (error) {
            this.error('Failed to download logs', { error: error.message });
            return false;
        }
    }

    /**
     * Get session info
     */
    getSessionInfo() {
        return {
            sessionId: this._sessionId,
            startTime: new Date(this._startTime).toISOString(),
            uptime: Date.now() - this._startTime,
            logCount: logHistory.length,
            counts: this._logCounts,
            config: {
                level: LOG_LEVEL_NAMES[LOG_CONFIG.level],
                remoteLogging: LOG_CONFIG.remoteLogging,
                persistence: LOG_CONFIG.persist,
                maxHistory: LOG_CONFIG.maxHistory
            }
        };
    }

    /**
     * Search logs
     */
    search(query, options = {}) {
        return this.getHistory({ ...options, search: query });
    }

    /**
     * Get logs by level
     */
    getByLevel(level, limit = 100) {
        return this.getHistory({ level, limit });
    }

    /**
     * Get latest logs
     */
    getLatest(count = 100) {
        return this.getHistory({ limit: count });
    }

    /**
     * Get logs by tags
     */
    getByTags(tags, limit = 100) {
        return this.getHistory({ tags, limit });
    }

    /**
     * Get log statistics
     */
    getStats() {
        const counts = this._logCounts;
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        const levels = Object.keys(counts);
        
        return {
            total,
            counts,
            levels,
            sessionId: this._sessionId,
            uptime: Date.now() - this._startTime,
            memoryUsage: logHistory.length > 0 
                ? new Blob([JSON.stringify(logHistory)]).size 
                : 0,
            historySize: logHistory.length
        };
    }

    /**
     * Reset logger
     */
    reset() {
        this.clearHistory();
        this._logCounts = {
            debug: 0,
            info: 0,
            warn: 0,
            error: 0,
            fatal: 0
        };
        this._startTime = Date.now();
        this._sessionId = this._generateSessionId();
        batchQueue = [];
        this.info('🔄 Logger reset');
        return this;
    }

    /**
     * Destroy logger (cleanup)
     */
    destroy() {
        this._stopFlushTimer();
        this._flushBatch();
        this._clearStorage();
        this._initialized = false;
        logHistory = [];
        batchQueue = [];
        return this;
    }
}

// ─── SINGLETON INSTANCE ──────────────────────────────────────

const logger = new Logger();

// ─── EXPORTS ──────────────────────────────────────────────────

export { logger };

// ─── HELPER FUNCTIONS ────────────────────────────────────────

/**
 * Create a tagged logger instance
 */
export function createTaggedLogger(...tags) {
    const newLogger = new Logger();
    newLogger.addTags(...tags);
    return newLogger;
}

/**
 * Create a child logger with context
 */
export function createChildLogger(context, ...tags) {
    const newLogger = new Logger();
    newLogger.setContext(context);
    newLogger.addTags(...tags);
    return newLogger;
}

/**
 * Get singleton logger instance
 */
export function getLogger() {
    return logger;
}

/**
 * Set global log level
 */
export function setLogLevel(level) {
    logger.setLevel(level);
}

/**
 * Get global log level
 */
export function getLogLevel() {
    return logger.getLevel();
}

/**
 * Enable colors
 */
export function enableLogColors() {
    LOG_CONFIG.useColors = true;
}

/**
 * Disable colors
 */
export function disableLogColors() {
    LOG_CONFIG.useColors = false;
}

/**
 * Enable remote logging
 */
export function enableRemoteLogging(endpoint) {
    logger.enableRemoteLogging(endpoint);
}

/**
 * Disable remote logging
 */
export function disableRemoteLogging() {
    logger.disableRemoteLogging();
}

/**
 * Enable persistence
 */
export function enableLogPersistence() {
    logger.enablePersistence();
}

/**
 * Disable persistence
 */
export function disableLogPersistence() {
    logger.disableLogPersistence();
}

/**
 * Flush all logs
 */
export async function flushLogs() {
    await logger.flush();
}

/**
 * Download logs
 */
export function downloadLogs(format = 'json') {
    return logger.download(format);
}

/**
 * Get session info
 */
export function getSessionInfo() {
    return logger.getSessionInfo();
}

/**
 * Get log stats
 */
export function getLogStats() {
    return logger.getStats();
}

/**
 * Search logs
 */
export function searchLogs(query, options = {}) {
    return logger.search(query, options);
}

/**
 * Reset logger
 */
export function resetLogger() {
    return logger.reset();
}

/**
 * Destroy logger
 */
export function destroyLogger() {
    return logger.destroy();
}

// ─── AUTO-INIT ON WINDOW LOAD ──────────────────────────────

if (isBrowser) {
    // Expose to window for debugging
    window.__logger = logger;
    window.__log = {
        debug: logger.debug.bind(logger),
        info: logger.info.bind(logger),
        warn: logger.warn.bind(logger),
        error: logger.error.bind(logger),
        fatal: logger.fatal.bind(logger),
        setLevel: setLogLevel,
        getLevel: getLogLevel,
        getHistory: logger.getHistory.bind(logger),
        getStats: logger.getStats.bind(logger),
        clear: logger.clearHistory.bind(logger),
        export: (format) => logger.download(format),
        search: logger.search.bind(logger),
        reset: logger.reset.bind(logger),
        session: logger.getSessionInfo.bind(logger)
    };

    // Log page load
    window.addEventListener('load', () => {
        logger.info('📄 Page loaded', {
            url: window.location.href,
            title: document.title,
            referrer: document.referrer
        });
    });

    // Log page unload
    window.addEventListener('beforeunload', () => {
        logger.info('👋 Page unloading');
        logger.flush();
    });

    // Log errors
    window.addEventListener('error', (event) => {
        logger.fatal('💥 Uncaught error', {
            message: event.message,
            filename: event.filename,
            line: event.lineno,
            col: event.colno,
            stack: event.error?.stack
        });
    });

    // Log unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        logger.fatal('💔 Unhandled promise rejection', {
            reason: event.reason?.message || String(event.reason),
            stack: event.reason?.stack
        });
    });
}

// ─── DEFAULT EXPORT ──────────────────────────────────────────

export default logger;