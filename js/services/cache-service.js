// ============================================================
// FILE: js/services/cache-service.js
// PURPOSE: Complete Browser Cache Management Service - PRODUCTION READY
// DEPENDENCY: constants.js, error-handler.js, logger.js
// USED BY: All screens, widgets, services
// VERSION: 3.0.0 - FULLY UPDATED
// ============================================================

import { errorHandler, cacheError } from './error-handler.js';
import { logger } from './logger.js';

// ============================================================
// CACHE CONFIGURATION
// ============================================================

const CACHE_CONFIG = {
    // Enable/Disable cache
    enabled: true,
    
    // Default cache duration (ms)
    defaultDuration: 5 * 60 * 1000, // 5 minutes
    
    // Maximum cache size (number of items)
    maxSize: 100,
    
    // Maximum memory usage (bytes)
    maxMemory: 50 * 1024 * 1024, // 50MB
    
    // Cache storage types
    storage: {
        MEMORY: 'memory',
        LOCAL_STORAGE: 'localStorage',
        SESSION_STORAGE: 'sessionStorage',
        INDEXED_DB: 'indexedDB'
    },
    
    // Default storage type
    defaultStorage: 'memory',
    
    // Cache prefixes
    prefixes: {
        APP: 'zymore_',
        API: 'zymore_api_',
        USER: 'zymore_user_',
        PRODUCT: 'zymore_product_',
        SOCIAL: 'zymore_social_',
        CHAT: 'zymore_chat_',
        AI: 'zymore_ai_',
        AD: 'zymore_ad_',
        IMAGE: 'zymore_img_',
        CONFIG: 'zymore_config_'
    },
    
    // Compression
    compression: {
        enabled: true,
        threshold: 1024 // Compress if > 1KB
    },
    
    // Cache strategies
    strategies: {
        CACHE_FIRST: 'cache_first',
        NETWORK_FIRST: 'network_first',
        STALE_WHILE_REVALIDATE: 'stale_while_revalidate',
        CACHE_ONLY: 'cache_only',
        NETWORK_ONLY: 'network_only'
    },
    
    // Default strategy
    defaultStrategy: 'cache_first',
    
    // Cleanup interval (ms)
    cleanupInterval: 10 * 60 * 1000, // 10 minutes
    
    // Version
    version: '1.0.0'
};

// ============================================================
// CACHE STORAGE ENGINES
// ============================================================

/**
 * Memory Storage Engine
 */
class MemoryStorage {
    constructor() {
        this._data = new Map();
        this._size = 0;
    }

    get(key) {
        return this._data.get(key) || null;
    }

    set(key, value) {
        const oldSize = this._data.get(key)?.size || 0;
        const newSize = this._calculateSize(value);
        this._size = this._size - oldSize + newSize;
        this._data.set(key, value);
        return true;
    }

    delete(key) {
        const item = this._data.get(key);
        if (item) {
            this._size -= this._calculateSize(item);
        }
        return this._data.delete(key);
    }

    clear() {
        this._data.clear();
        this._size = 0;
    }

    keys() {
        return Array.from(this._data.keys());
    }

    has(key) {
        return this._data.has(key);
    }

    getSize() {
        return this._size;
    }

    getCount() {
        return this._data.size;
    }

    _calculateSize(value) {
        try {
            return new Blob([JSON.stringify(value)]).size;
        } catch {
            return 0;
        }
    }
}

/**
 * Local Storage Engine
 */
class LocalStorageEngine {
    get(key) {
        try {
            const data = localStorage.getItem(key);
            if (!data) return null;
            return JSON.parse(data);
        } catch {
            return null;
        }
    }

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    }

    delete(key) {
        localStorage.removeItem(key);
        return true;
    }

    clear() {
        localStorage.clear();
    }

    keys() {
        return Object.keys(localStorage);
    }

    has(key) {
        return localStorage.getItem(key) !== null;
    }

    getSize() {
        let size = 0;
        for (const key of this.keys()) {
            size += localStorage.getItem(key)?.length || 0;
        }
        return size;
    }

    getCount() {
        return localStorage.length;
    }
}

/**
 * Session Storage Engine
 */
class SessionStorageEngine {
    get(key) {
        try {
            const data = sessionStorage.getItem(key);
            if (!data) return null;
            return JSON.parse(data);
        } catch {
            return null;
        }
    }

    set(key, value) {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    }

    delete(key) {
        sessionStorage.removeItem(key);
        return true;
    }

    clear() {
        sessionStorage.clear();
    }

    keys() {
        return Object.keys(sessionStorage);
    }

    has(key) {
        return sessionStorage.getItem(key) !== null;
    }

    getSize() {
        let size = 0;
        for (const key of this.keys()) {
            size += sessionStorage.getItem(key)?.length || 0;
        }
        return size;
    }

    getCount() {
        return sessionStorage.length;
    }
}

// ============================================================
// CACHE ENTRY CLASS
// ============================================================

class CacheEntry {
    constructor(data, options = {}) {
        this.data = data;
        this.timestamp = Date.now();
        this.ttl = options.ttl || CACHE_CONFIG.defaultDuration;
        this.key = options.key || '';
        this.size = this._calculateSize(data);
        this.version = options.version || CACHE_CONFIG.version;
        this.tags = options.tags || [];
        this.metadata = options.metadata || {};
        this.accessCount = 0;
        this.lastAccessed = this.timestamp;
        this.expiresAt = this.timestamp + this.ttl;
    }

    isExpired() {
        return Date.now() > this.expiresAt;
    }

    isStale() {
        const staleTime = this.ttl * 0.8;
        return Date.now() > (this.timestamp + staleTime);
    }

    access() {
        this.accessCount++;
        this.lastAccessed = Date.now();
    }

    _calculateSize(data) {
        try {
            return new Blob([JSON.stringify(data)]).size;
        } catch {
            return 0;
        }
    }

    toJSON() {
        return {
            data: this.data,
            timestamp: this.timestamp,
            ttl: this.ttl,
            version: this.version,
            tags: this.tags,
            metadata: this.metadata,
            accessCount: this.accessCount,
            lastAccessed: this.lastAccessed,
            expiresAt: this.expiresAt
        };
    }

    static fromJSON(json) {
        const entry = new CacheEntry(json.data, {
            ttl: json.ttl,
            key: json.key,
            version: json.version,
            tags: json.tags,
            metadata: json.metadata
        });
        entry.timestamp = json.timestamp;
        entry.accessCount = json.accessCount || 0;
        entry.lastAccessed = json.lastAccessed || json.timestamp;
        entry.expiresAt = json.expiresAt || json.timestamp + json.ttl;
        return entry;
    }
}

// ============================================================
// MAIN CACHE SERVICE
// ============================================================

class CacheService {
    constructor() {
        this._initialized = false;
        this._enabled = CACHE_CONFIG.enabled;
        this._storages = {};
        this._defaultStorage = CACHE_CONFIG.defaultStorage;
        this._cacheStats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            evictions: 0,
            errors: 0
        };
        this._cleanupTimer = null;
        this._listeners = [];
        this._namespace = 'default';
        this._version = CACHE_CONFIG.version;
        this._maxSize = CACHE_CONFIG.maxSize;
        this._maxMemory = CACHE_CONFIG.maxMemory;
        this._compressionEnabled = CACHE_CONFIG.compression.enabled;
        this._compressionThreshold = CACHE_CONFIG.compression.threshold;
        this._prefix = CACHE_CONFIG.prefixes.APP;
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    /**
     * Initialize cache service
     */
    async init(options = {}) {
        if (this._initialized) return;

        const {
            enabled = true,
            defaultStorage = 'memory',
            maxSize = 100,
            maxMemory = 50 * 1024 * 1024,
            prefix = CACHE_CONFIG.prefixes.APP,
            version = CACHE_CONFIG.version,
            cleanup = true,
            namespace = 'default'
        } = options;

        try {
            this._enabled = enabled;
            this._defaultStorage = defaultStorage;
            this._maxSize = maxSize;
            this._maxMemory = maxMemory;
            this._prefix = prefix;
            this._version = version;
            this._namespace = namespace;

            if (!this._enabled) {
                logger.info('📦 Cache service is disabled');
                this._initialized = true;
                return;
            }

            // Initialize storage engines
            this._storages = {
                memory: new MemoryStorage(),
                localStorage: new LocalStorageEngine(),
                sessionStorage: new SessionStorageEngine()
            };

            // Load persisted cache
            await this._loadPersistedCache();

            // Set cleanup timer
            if (cleanup) {
                this._startCleanupTimer();
            }

            this._initialized = true;

            logger.info('📦 Cache Service initialized', {
                defaultStorage: this._defaultStorage,
                maxSize: this._maxSize,
                maxMemory: this._maxMemory,
                version: this._version,
                namespace: this._namespace
            });

            return this;
        } catch (error) {
            logger.error('❌ Cache Service initialization failed', { error: error.message });
            throw error;
        }
    }

    // ============================================
    // CORE OPERATIONS
    // ============================================

    /**
     * Set cache item
     */
    set(key, data, options = {}) {
        if (!this._enabled) return false;

        try {
            const {
                ttl = CACHE_CONFIG.defaultDuration,
                storage = this._defaultStorage,
                tags = [],
                metadata = {},
                version = this._version,
                compress = this._compressionEnabled,
                namespace = this._namespace
            } = options;

            const fullKey = this._buildKey(key, namespace);
            const entry = new CacheEntry(data, {
                key: fullKey,
                ttl,
                version,
                tags,
                metadata
            });

            // Check size limit
            if (entry.size > 0 && this._getTotalSize() + entry.size > this._maxMemory) {
                this._evictOldest();
            }

            // Check count limit
            if (this._getTotalCount() >= this._maxSize) {
                this._evictOldest();
            }

            // Store in selected storage
            const storageEngine = this._storages[storage];
            if (!storageEngine) {
                throw new Error(`Storage engine '${storage}' not found`);
            }

            // Compress if needed
            let valueToStore = entry.toJSON();
            if (compress && entry.size > this._compressionThreshold) {
                valueToStore = this._compress(valueToStore);
                entry.metadata.compressed = true;
            }

            const success = storageEngine.set(fullKey, valueToStore);
            if (!success) {
                throw new Error('Failed to store in cache');
            }

            this._cacheStats.sets++;
            this._notifyListeners('set', { key: fullKey, size: entry.size });

            logger.debug(`📦 Cache set: ${key}`, { storage, size: entry.size, ttl });

            return true;
        } catch (error) {
            this._cacheStats.errors++;
            logger.error(`❌ Failed to set cache: ${key}`, { error: error.message });
            return false;
        }
    }

    /**
     * Get cache item
     */
    get(key, options = {}) {
        if (!this._enabled) return null;

        try {
            const {
                storage = this._defaultStorage,
                strategy = CACHE_CONFIG.defaultStrategy,
                namespace = this._namespace,
                validate = null
            } = options;

            const fullKey = this._buildKey(key, namespace);
            const storageEngine = this._storages[storage];
            if (!storageEngine) return null;

            const rawData = storageEngine.get(fullKey);
            if (!rawData) {
                this._cacheStats.misses++;
                return null;
            }

            // Decompress if needed
            let entryData = rawData;
            if (entryData.metadata?.compressed) {
                entryData = this._decompress(entryData);
            }

            // Parse entry
            let entry;
            try {
                entry = CacheEntry.fromJSON(entryData);
            } catch {
                // Invalid entry
                storageEngine.delete(fullKey);
                this._cacheStats.misses++;
                return null;
            }

            // Check expiration
            if (entry.isExpired()) {
                storageEngine.delete(fullKey);
                this._cacheStats.misses++;
                return null;
            }

            // Validate if provided
            if (validate && !validate(entry.data)) {
                storageEngine.delete(fullKey);
                this._cacheStats.misses++;
                return null;
            }

            entry.access();
            this._cacheStats.hits++;
            this._notifyListeners('hit', { key: fullKey });

            logger.debug(`📦 Cache hit: ${key}`, { storage, accessCount: entry.accessCount });

            return entry.data;
        } catch (error) {
            this._cacheStats.errors++;
            logger.error(`❌ Failed to get cache: ${key}`, { error: error.message });
            return null;
        }
    }

    /**
     * Get cache entry with metadata
     */
    getEntry(key, options = {}) {
        if (!this._enabled) return null;

        try {
            const {
                storage = this._defaultStorage,
                namespace = this._namespace
            } = options;

            const fullKey = this._buildKey(key, namespace);
            const storageEngine = this._storages[storage];
            if (!storageEngine) return null;

            const rawData = storageEngine.get(fullKey);
            if (!rawData) return null;

            let entryData = rawData;
            if (entryData.metadata?.compressed) {
                entryData = this._decompress(entryData);
            }

            const entry = CacheEntry.fromJSON(entryData);
            if (entry.isExpired()) {
                storageEngine.delete(fullKey);
                return null;
            }

            entry.access();
            this._cacheStats.hits++;

            return entry;
        } catch (error) {
            this._cacheStats.errors++;
            return null;
        }
    }

    /**
     * Delete cache item
     */
    delete(key, options = {}) {
        if (!this._enabled) return false;

        try {
            const {
                storage = this._defaultStorage,
                namespace = this._namespace
            } = options;

            const fullKey = this._buildKey(key, namespace);
            const storageEngine = this._storages[storage];
            if (!storageEngine) return false;

            const result = storageEngine.delete(fullKey);
            if (result) {
                this._cacheStats.deletes++;
                this._notifyListeners('delete', { key: fullKey });
                logger.debug(`📦 Cache deleted: ${key}`);
            }

            return result;
        } catch (error) {
            this._cacheStats.errors++;
            logger.error(`❌ Failed to delete cache: ${key}`, { error: error.message });
            return false;
        }
    }

    /**
     * Clear all cache
     */
    clear(options = {}) {
        if (!this._enabled) return false;

        try {
            const {
                storage = null,
                namespace = this._namespace,
                pattern = null
            } = options;

            if (storage) {
                const storageEngine = this._storages[storage];
                if (storageEngine) {
                    if (pattern) {
                        const keys = storageEngine.keys();
                        for (const key of keys) {
                            if (key.includes(pattern)) {
                                storageEngine.delete(key);
                            }
                        }
                    } else {
                        storageEngine.clear();
                    }
                }
            } else {
                // Clear all storages
                for (const engine of Object.values(this._storages)) {
                    if (pattern) {
                        const keys = engine.keys();
                        for (const key of keys) {
                            if (key.includes(pattern)) {
                                engine.delete(key);
                            }
                        }
                    } else {
                        engine.clear();
                    }
                }
            }

            this._notifyListeners('clear', { storage, namespace, pattern });
            logger.info(`📦 Cache cleared`, { storage, namespace });

            return true;
        } catch (error) {
            this._cacheStats.errors++;
            logger.error('❌ Failed to clear cache', { error: error.message });
            return false;
        }
    }

    /**
     * Check if cache exists
     */
    has(key, options = {}) {
        if (!this._enabled) return false;

        try {
            const {
                storage = this._defaultStorage,
                namespace = this._namespace
            } = options;

            const fullKey = this._buildKey(key, namespace);
            const storageEngine = this._storages[storage];
            if (!storageEngine) return false;

            return storageEngine.has(fullKey);
        } catch (error) {
            return false;
        }
    }

    /**
     * Get cache stats
     */
    getStats() {
        const stats = { ...this._cacheStats };
        const total = stats.hits + stats.misses;
        stats.hitRate = total > 0 ? (stats.hits / total) * 100 : 0;

        // Add storage stats
        stats.storages = {};
        for (const [name, engine] of Object.entries(this._storages)) {
            stats.storages[name] = {
                count: engine.getCount(),
                size: engine.getSize()
            };
        }

        stats.totalItems = this._getTotalCount();
        stats.totalSize = this._getTotalSize();
        stats.maxSize = this._maxSize;
        stats.maxMemory = this._maxMemory;
        stats.enabled = this._enabled;
        stats.version = this._version;
        stats.namespace = this._namespace;

        return stats;
    }

    // ============================================
    // CACHE STRATEGIES
    // ============================================

    /**
     * Cache-first strategy
     */
    async cacheFirst(key, fetchFn, options = {}) {
        // Try cache first
        const cached = this.get(key, options);
        if (cached !== null) {
            return cached;
        }

        // Fallback to network
        try {
            const data = await fetchFn();
            this.set(key, data, options);
            return data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Network-first strategy
     */
    async networkFirst(key, fetchFn, options = {}) {
        try {
            // Try network first
            const data = await fetchFn();
            this.set(key, data, options);
            return data;
        } catch (error) {
            // Fallback to cache
            const cached = this.get(key, options);
            if (cached !== null) {
                return cached;
            }
            throw error;
        }
    }

    /**
     * Stale-while-revalidate strategy
     */
    async staleWhileRevalidate(key, fetchFn, options = {}) {
        // Get cached entry
        const entry = this.getEntry(key, options);
        
        // Start revalidation in background
        let revalidatePromise = null;
        if (entry && entry.isStale()) {
            revalidatePromise = fetchFn()
                .then(data => {
                    this.set(key, data, options);
                    return data;
                })
                .catch(() => {});
        }

        // If cache exists, return it
        if (entry && !entry.isExpired()) {
            // Revalidate in background
            if (revalidatePromise) {
                revalidatePromise.catch(() => {});
            }
            return entry.data;
        }

        // No cache or expired
        if (revalidatePromise) {
            try {
                return await revalidatePromise;
            } catch (error) {
                // If revalidation fails and we have stale data, return it
                if (entry) {
                    return entry.data;
                }
                throw error;
            }
        }

        // No cache at all
        try {
            const data = await fetchFn();
            this.set(key, data, options);
            return data;
        } catch (error) {
            if (entry) {
                return entry.data;
            }
            throw error;
        }
    }

    // ============================================
    // BATCH OPERATIONS
    // ============================================

    /**
     * Get multiple cache items
     */
    getBatch(keys, options = {}) {
        const results = {};
        for (const key of keys) {
            results[key] = this.get(key, options);
        }
        return results;
    }

    /**
     * Set multiple cache items
     */
    setBatch(items, options = {}) {
        const results = {};
        for (const [key, data] of Object.entries(items)) {
            results[key] = this.set(key, data, options);
        }
        return results;
    }

    /**
     * Delete multiple cache items
     */
    deleteBatch(keys, options = {}) {
        const results = {};
        for (const key of keys) {
            results[key] = this.delete(key, options);
        }
        return results;
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Build cache key
     */
    _buildKey(key, namespace = this._namespace) {
        return `${this._prefix}${namespace}:${key}`;
    }

    /**
     * Get total count across all storages
     */
    _getTotalCount() {
        let total = 0;
        for (const engine of Object.values(this._storages)) {
            total += engine.getCount();
        }
        return total;
    }

    /**
     * Get total size across all storages
     */
    _getTotalSize() {
        let total = 0;
        for (const engine of Object.values(this._storages)) {
            total += engine.getSize();
        }
        return total;
    }

    /**
     * Evict oldest entries
     */
    _evictOldest() {
        // Collect all entries from all storages
        const allEntries = [];
        for (const [storageName, engine] of Object.entries(this._storages)) {
            for (const key of engine.keys()) {
                const data = engine.get(key);
                if (data) {
                    allEntries.push({ key, data, storage: storageName });
                }
            }
        }

        // Sort by timestamp
        allEntries.sort((a, b) => {
            const aTime = a.data?.timestamp || 0;
            const bTime = b.data?.timestamp || 0;
            return aTime - bTime;
        });

        // Remove oldest 20%
        const toRemove = Math.max(1, Math.floor(allEntries.length * 0.2));
        for (let i = 0; i < toRemove && i < allEntries.length; i++) {
            const entry = allEntries[i];
            const engine = this._storages[entry.storage];
            if (engine) {
                engine.delete(entry.key);
                this._cacheStats.evictions++;
            }
        }

        logger.debug(`📦 Evicted ${toRemove} cache entries`);
    }

    /**
     * Compress data
     */
    _compress(data) {
        try {
            const json = JSON.stringify(data);
            // Simple compression using base64
            return {
                compressed: true,
                data: btoa(unescape(encodeURIComponent(json))),
                originalSize: json.length
            };
        } catch {
            return data;
        }
    }

    /**
     * Decompress data
     */
    _decompress(data) {
        try {
            if (!data.compressed) return data;
            const json = decodeURIComponent(escape(atob(data.data)));
            return JSON.parse(json);
        } catch {
            return data;
        }
    }

    /**
     * Load persisted cache from localStorage
     */
    async _loadPersistedCache() {
        try {
            // Check if we have a cache index
            const indexKey = `${this._prefix}index`;
            const index = localStorage.getItem(indexKey);
            if (index) {
                const parsed = JSON.parse(index);
                // Validate version
                if (parsed.version === this._version) {
                    logger.debug(`📦 Loaded cache index with ${parsed.count} items`);
                } else {
                    // Version mismatch, clear cache
                    localStorage.removeItem(indexKey);
                    logger.info('📦 Cache version mismatch, cleared');
                }
            }
        } catch (error) {
            // Ignore
        }
    }

    /**
     * Save cache index
     */
    _saveCacheIndex() {
        try {
            const totalCount = this._getTotalCount();
            const index = {
                version: this._version,
                count: totalCount,
                timestamp: Date.now(),
                namespace: this._namespace
            };
            localStorage.setItem(`${this._prefix}index`, JSON.stringify(index));
        } catch (error) {
            // Ignore
        }
    }

    /**
     * Start cleanup timer
     */
    _startCleanupTimer() {
        if (this._cleanupTimer) {
            clearInterval(this._cleanupTimer);
        }

        this._cleanupTimer = setInterval(() => {
            this._cleanup();
        }, CACHE_CONFIG.cleanupInterval);
    }

    /**
     * Cleanup expired entries
     */
    _cleanup() {
        let cleaned = 0;
        for (const [storageName, engine] of Object.entries(this._storages)) {
            for (const key of engine.keys()) {
                const data = engine.get(key);
                if (data) {
                    try {
                        let entryData = data;
                        if (entryData.metadata?.compressed) {
                            entryData = this._decompress(entryData);
                        }
                        const entry = CacheEntry.fromJSON(entryData);
                        if (entry.isExpired()) {
                            engine.delete(key);
                            cleaned++;
                        }
                    } catch {
                        // Invalid entry, remove it
                        engine.delete(key);
                        cleaned++;
                    }
                }
            }
        }

        if (cleaned > 0) {
            logger.debug(`📦 Cleaned ${cleaned} expired cache entries`);
            this._saveCacheIndex();
        }
    }

    /**
     * Add listener
     */
    addListener(callback) {
        this._listeners.push(callback);
        return () => {
            this._listeners = this._listeners.filter(c => c !== callback);
        };
    }

    /**
     * Notify listeners
     */
    _notifyListeners(event, data) {
        for (const listener of this._listeners) {
            try {
                listener(event, data);
            } catch (e) {
                // Ignore
            }
        }
    }

    /**
     * Get cache keys
     */
    getKeys(options = {}) {
        const {
            storage = null,
            namespace = this._namespace,
            pattern = null
        } = options;

        let allKeys = [];

        if (storage) {
            const engine = this._storages[storage];
            if (engine) {
                allKeys = engine.keys();
            }
        } else {
            for (const engine of Object.values(this._storages)) {
                allKeys = allKeys.concat(engine.keys());
            }
        }

        // Filter by namespace
        const prefix = this._buildKey('', namespace);
        allKeys = allKeys.filter(key => key.startsWith(prefix));

        // Filter by pattern
        if (pattern) {
            allKeys = allKeys.filter(key => key.includes(pattern));
        }

        return allKeys;
    }

    /**
     * Get cache entries
     */
    getEntries(options = {}) {
        const keys = this.getKeys(options);
        const entries = {};
        for (const key of keys) {
            const entry = this.getEntry(key, options);
            if (entry) {
                entries[key] = entry;
            }
        }
        return entries;
    }

    /**
     * Set namespace
     */
    setNamespace(namespace) {
        this._namespace = namespace;
        logger.debug(`📦 Cache namespace changed: ${namespace}`);
    }

    /**
     * Set default storage
     */
    setDefaultStorage(storage) {
        if (this._storages[storage]) {
            this._defaultStorage = storage;
            logger.debug(`📦 Default storage changed: ${storage}`);
        }
    }

    /**
     * Enable cache
     */
    enable() {
        this._enabled = true;
        this._startCleanupTimer();
        logger.info('📦 Cache enabled');
    }

    /**
     * Disable cache
     */
    disable() {
        this._enabled = false;
        if (this._cleanupTimer) {
            clearInterval(this._cleanupTimer);
            this._cleanupTimer = null;
        }
        logger.info('📦 Cache disabled');
    }

    /**
     * Reset cache service
     */
    reset() {
        this.clear();
        this._cacheStats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            evictions: 0,
            errors: 0
        };
        this._listeners = [];
        logger.info('📦 Cache service reset');
    }

    /**
     * Destroy cache service
     */
    destroy() {
        if (this._cleanupTimer) {
            clearInterval(this._cleanupTimer);
            this._cleanupTimer = null;
        }
        this.clear();
        this._listeners = [];
        this._initialized = false;
        logger.info('📦 Cache service destroyed');
    }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

const cacheService = new CacheService();

// ============================================================
// EXPORTS
// ============================================================

export { cacheService, CACHE_CONFIG };

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Initialize cache service
 */
export function initCache(options = {}) {
    return cacheService.init(options);
}

/**
 * Set cache item
 */
export function setCache(key, data, options = {}) {
    return cacheService.set(key, data, options);
}

/**
 * Get cache item
 */
export function getCache(key, options = {}) {
    return cacheService.get(key, options);
}

/**
 * Get cache entry with metadata
 */
export function getCacheEntry(key, options = {}) {
    return cacheService.getEntry(key, options);
}

/**
 * Delete cache item
 */
export function deleteCache(key, options = {}) {
    return cacheService.delete(key, options);
}

/**
 * Clear cache
 */
export function clearCache(options = {}) {
    return cacheService.clear(options);
}

/**
 * Check if cache exists
 */
export function hasCache(key, options = {}) {
    return cacheService.has(key, options);
}

/**
 * Get cache stats
 */
export function getCacheStats() {
    return cacheService.getStats();
}

/**
 * Get cache keys
 */
export function getCacheKeys(options = {}) {
    return cacheService.getKeys(options);
}

/**
 * Get cache entries
 */
export function getCacheEntries(options = {}) {
    return cacheService.getEntries(options);
}

/**
 * Set namespace
 */
export function setCacheNamespace(namespace) {
    return cacheService.setNamespace(namespace);
}

/**
 * Set default storage
 */
export function setCacheStorage(storage) {
    return cacheService.setDefaultStorage(storage);
}

/**
 * Cache-first strategy
 */
export function cacheFirst(key, fetchFn, options = {}) {
    return cacheService.cacheFirst(key, fetchFn, options);
}

/**
 * Network-first strategy
 */
export function networkFirst(key, fetchFn, options = {}) {
    return cacheService.networkFirst(key, fetchFn, options);
}

/**
 * Stale-while-revalidate strategy
 */
export function staleWhileRevalidate(key, fetchFn, options = {}) {
    return cacheService.staleWhileRevalidate(key, fetchFn, options);
}

/**
 * Add cache listener
 */
export function onCacheEvent(callback) {
    return cacheService.addListener(callback);
}

/**
 * Enable cache
 */
export function enableCache() {
    return cacheService.enable();
}

/**
 * Disable cache
 */
export function disableCache() {
    return cacheService.disable();
}

/**
 * Reset cache
 */
export function resetCache() {
    return cacheService.reset();
}

/**
 * Destroy cache
 */
export function destroyCache() {
    return cacheService.destroy();
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default cacheService;