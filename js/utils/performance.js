// Performance Monitoring
// ============================================================
// FILE: js/utils/performance.js
// PURPOSE: Performance monitoring & reporting
// DEPENDENCY: analytics-service.js
// USED BY: app.js
// ============================================================

import { AnalyticsService } from '../services/analytics-service.js';
import { eventBus } from '../state/event-bus.js';
import { Helpers } from './helpers.js';

/**
 * PerformanceMonitor Class - Tracks and reports performance metrics
 * 
 * Features:
 * - Core Web Vitals (LCP, FID, CLS)
 * - Custom performance marks and measures
 * - Page load timing
 * - Resource timing
 * - Navigation timing
 * - Memory usage tracking
 * - Network information
 * - Performance score calculation
 * - Report generation
 * - Real-time monitoring
 * - Threshold alerts
 * 
 * Usage:
 *   import { PerformanceMonitor } from './utils/performance.js';
 *   PerformanceMonitor.init();
 *   PerformanceMonitor.mark('myOperation');
 *   // ... operation
 *   PerformanceMonitor.measure('myOperation', 'myOperation');
 */
export class PerformanceMonitor {
    /**
     * Default configuration
     * @private
     * @static
     */
    static #defaultConfig = {
        enabled: true,
        sampleRate: 1.0,           // 0.0 - 1.0
        reportInterval: 60000,     // 60 seconds
        metrics: {
            webVitals: true,
            navigation: true,
            resources: true,
            memory: true,
            custom: true
        },
        thresholds: {
            lcp: 2500,             // milliseconds
            fid: 100,              // milliseconds
            cls: 0.1,              // score
            fcp: 1500,             // milliseconds
            tti: 3000,             // milliseconds
            ttfb: 200              // milliseconds
        },
        logLevel: 'info',          // 'debug', 'info', 'warn', 'error'
        autoReport: true,
        storageKey: 'zymore_performance'
    };

    /**
     * Private state
     * @private
     * @static
     */
    static #instance = null;
    static #isInitialized = false;
    static #marks = new Map();
    static #measures = new Map();
    static #scores = [];
    static #reportTimer = null;
    static #observers = [];
    static #config = {};
    static #performanceData = {
        navigation: {},
        resources: [],
        webVitals: {},
        memory: [],
        custom: []
    };
    static #listeners = [];

    /**
     * Initialize performance monitor
     * @public
     * @static
     * @param {Object} config - Configuration options
     * @returns {PerformanceMonitor} Instance
     */
    static init(config = {}) {
        if (this.#isInitialized) {
            return this.#instance;
        }

        // Merge config
        this.#config = {
            ...this.#defaultConfig,
            ...config
        };

        // Check if enabled
        if (!this.#config.enabled) {
            this.#log('debug', 'Performance monitoring is disabled');
            return null;
        }

        // Sample rate check
        if (Math.random() > this.#config.sampleRate) {
            this.#log('debug', 'Skipped due to sample rate');
            return null;
        }

        // Check Performance API support
        if (!window.performance || !window.performance.getEntries) {
            this.#log('warn', 'Performance API not supported');
            return null;
        }

        // Create instance
        this.#instance = new PerformanceMonitor();
        this.#isInitialized = true;

        // Setup observers
        this.#setupObservers();

        // Capture initial metrics
        this.#captureNavigationTiming();
        this.#captureResourceTiming();

        // Setup reporting
        if (this.#config.autoReport) {
            this.#setupReporting();
        }

        // Listen for visibility change
        this.#setupVisibilityListener();

        // Listen for page unload
        this.#setupUnloadListener();

        this.#log('info', 'Performance monitoring initialized');

        // Emit event
        EventBus.emit('performance:init');

        return this.#instance;
    }

    /**
     * Setup performance observers
     * @private
     * @static
     */
    static #setupObservers() {
        // LCP (Largest Contentful Paint)
        if (this.#config.metrics.webVitals) {
            try {
                const lcpObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    if (lastEntry) {
                        this.#performanceData.webVitals.lcp = {
                            value: lastEntry.startTime,
                            url: lastEntry.url || '',
                            timestamp: Date.now()
                        };
                        this.#checkThreshold('lcp', lastEntry.startTime);
                    }
                });
                lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
                this.#observers.push(lcpObserver);
            } catch (e) {
                this.#log('debug', 'LCP observer not supported');
            }

            // FID (First Input Delay)
            try {
                const fidObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const firstEntry = entries[0];
                    if (firstEntry) {
                        this.#performanceData.webVitals.fid = {
                            value: firstEntry.processingStart - firstEntry.startTime,
                            timestamp: Date.now()
                        };
                        this.#checkThreshold('fid', this.#performanceData.webVitals.fid.value);
                    }
                });
                fidObserver.observe({ type: 'first-input', buffered: true });
                this.#observers.push(fidObserver);
            } catch (e) {
                this.#log('debug', 'FID observer not supported');
            }

            // CLS (Cumulative Layout Shift)
            try {
                let clsValue = 0;
                const clsObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    for (const entry of entries) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    }
                    this.#performanceData.webVitals.cls = {
                        value: clsValue,
                        timestamp: Date.now()
                    };
                    this.#checkThreshold('cls', clsValue);
                });
                clsObserver.observe({ type: 'layout-shift', buffered: true });
                this.#observers.push(clsObserver);
            } catch (e) {
                this.#log('debug', 'CLS observer not supported');
            }

            // FCP (First Contentful Paint)
            try {
                const fcpObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const firstEntry = entries[0];
                    if (firstEntry) {
                        this.#performanceData.webVitals.fcp = {
                            value: firstEntry.startTime,
                            timestamp: Date.now()
                        };
                        this.#checkThreshold('fcp', firstEntry.startTime);
                    }
                });
                fcpObserver.observe({ type: 'paint', buffered: true });
                this.#observers.push(fcpObserver);
            } catch (e) {
                this.#log('debug', 'FCP observer not supported');
            }
        }

        // Navigation timing
        if (this.#config.metrics.navigation) {
            try {
                const navObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    for (const entry of entries) {
                        if (entry.entryType === 'navigation') {
                            this.#processNavigationEntry(entry);
                        }
                    }
                });
                navObserver.observe({ type: 'navigation', buffered: true });
                this.#observers.push(navObserver);
            } catch (e) {
                this.#log('debug', 'Navigation observer not supported');
            }
        }

        // Resource timing
        if (this.#config.metrics.resources) {
            try {
                const resourceObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    for (const entry of entries) {
                        this.#processResourceEntry(entry);
                    }
                });
                resourceObserver.observe({ type: 'resource', buffered: true });
                this.#observers.push(resourceObserver);
            } catch (e) {
                this.#log('debug', 'Resource observer not supported');
            }
        }
    }

    /**
     * Process navigation entry
     * @private
     * @static
     * @param {PerformanceEntry} entry - Navigation entry
     */
    static #processNavigationEntry(entry) {
        const navEntry = entry;
        this.#performanceData.navigation = {
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            domInteractive: navEntry.domInteractive - navEntry.fetchStart,
            loadComplete: navEntry.loadEventEnd - navEntry.fetchStart,
            redirectCount: navEntry.redirectCount,
            redirectTime: navEntry.redirectEnd - navEntry.redirectStart,
            dnsLookup: navEntry.domainLookupEnd - navEntry.domainLookupStart,
            tcpConnect: navEntry.connectEnd - navEntry.connectStart,
            requestStart: navEntry.requestStart - navEntry.fetchStart,
            responseStart: navEntry.responseStart - navEntry.requestStart,
            responseEnd: navEntry.responseEnd - navEntry.responseStart,
            domProcessing: navEntry.domContentLoadedEventStart - navEntry.responseEnd,
            totalTime: navEntry.loadEventEnd - navEntry.fetchStart,
            ttfb: navEntry.responseStart - navEntry.fetchStart,
            timestamp: Date.now()
        };

        this.#checkThreshold('ttfb', this.#performanceData.navigation.ttfb);
    }

    /**
     * Process resource entry
     * @private
     * @static
     * @param {PerformanceEntry} entry - Resource entry
     */
    static #processResourceEntry(entry) {
        if (!this.#config.metrics.resources) return;

        const resource = {
            name: entry.name,
            initiatorType: entry.initiatorType,
            duration: entry.duration,
            transferSize: entry.transferSize || 0,
            decodedBodySize: entry.decodedBodySize || 0,
            encodedBodySize: entry.encodedBodySize || 0,
            nextHopProtocol: entry.nextHopProtocol || '',
            cacheMode: this.#getCacheMode(entry),
            timestamp: Date.now()
        };

        // Store only if significant or slow
        if (entry.duration > 500 || resource.transferSize > 100000) {
            this.#performanceData.resources.push(resource);
            
            // Limit stored resources
            if (this.#performanceData.resources.length > 100) {
                this.#performanceData.resources.shift();
            }
        }
    }

    /**
     * Get cache mode from resource entry
     * @private
     * @static
     * @param {PerformanceEntry} entry - Resource entry
     * @returns {string} Cache mode
     */
    static #getCacheMode(entry) {
        if (entry.transferSize === 0) return 'cache';
        if (entry.encodedBodySize > 0 && entry.transferSize > 0) return 'network';
        return 'unknown';
    }

    /**
     * Check threshold for a metric
     * @private
     * @static
     * @param {string} metric - Metric name
     * @param {number} value - Metric value
     */
    static #checkThreshold(metric, value) {
        const threshold = this.#config.thresholds[metric];
        if (threshold && value > threshold) {
            this.#log('warn', `Threshold exceeded: ${metric} = ${value}ms (threshold: ${threshold}ms)`);
            
            EventBus.emit('performance:threshold', {
                metric,
                value,
                threshold,
                exceeded: true
            });
        }
    }

    /**
     * Capture navigation timing
     * @private
     * @static
     */
    static #captureNavigationTiming() {
        const entries = performance.getEntriesByType('navigation');
        if (entries.length > 0) {
            this.#processNavigationEntry(entries[0]);
        }
    }

    /**
     * Capture resource timing
     * @private
     * @static
     */
    static #captureResourceTiming() {
        const entries = performance.getEntriesByType('resource');
        for (const entry of entries) {
            this.#processResourceEntry(entry);
        }
    }

    /**
     * Setup reporting interval
     * @private
     * @static
     */
    static #setupReporting() {
        if (this.#reportTimer) {
            clearInterval(this.#reportTimer);
        }

        this.#reportTimer = setInterval(() => {
            this.report();
        }, this.#config.reportInterval);

        // Report on page visibility change (when tab becomes visible)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.report();
            }
        });
    }

    /**
     * Setup visibility change listener
     * @private
     * @static
     */
    static #setupVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // Capture metrics when tab becomes visible
                this.#captureResourceTiming();
                if (this.#config.metrics.memory) {
                    this.#captureMemoryUsage();
                }
            }
        });
    }

    /**
     * Setup page unload listener
     * @private
     * @static
     */
    static #setupUnloadListener() {
        window.addEventListener('beforeunload', () => {
            // Final report
            this.report();
        });
    }

    /**
     * Capture memory usage
     * @private
     * @static
     */
    static #captureMemoryUsage() {
        if (!this.#config.metrics.memory) return;

        try {
            if (window.performance && window.performance.memory) {
                const memory = window.performance.memory;
                this.#performanceData.memory.push({
                    usedJSHeapSize: memory.usedJSHeapSize,
                    totalJSHeapSize: memory.totalJSHeapSize,
                    jsHeapSizeLimit: memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                });

                // Limit stored memory data
                if (this.#performanceData.memory.length > 50) {
                    this.#performanceData.memory.shift();
                }
            }
        } catch (e) {
            this.#log('debug', 'Memory API not available');
        }
    }

    /**
     * Create a performance mark
     * @public
     * @static
     * @param {string} name - Mark name
     * @param {Object} data - Additional data
     */
    static mark(name, data = {}) {
        if (!this.#isInitialized) return;

        try {
            performance.mark(name);
            this.#marks.set(name, {
                name,
                timestamp: performance.now(),
                data,
                time: Date.now()
            });

            this.#log('debug', `Mark: ${name}`);
            
            EventBus.emit('performance:mark', { name, data });
        } catch (e) {
            this.#log('error', `Failed to create mark: ${name}`, e);
        }
    }

    /**
     * Create a performance measure
     * @public
     * @static
     * @param {string} name - Measure name
     * @param {string} startMark - Start mark name
     * @param {string} endMark - End mark name (optional)
     * @param {Object} data - Additional data
     * @returns {number|null} Duration in milliseconds
     */
    static measure(name, startMark, endMark = null, data = {}) {
        if (!this.#isInitialized) return null;

        try {
            let duration;
            if (endMark) {
                performance.measure(name, startMark, endMark);
                const entries = performance.getEntriesByName(name);
                if (entries.length > 0) {
                    duration = entries[0].duration;
                }
            } else {
                // Measure from mark to now
                const startTime = this.#marks.get(startMark)?.timestamp;
                if (startTime) {
                    duration = performance.now() - startTime;
                }
            }

            if (duration !== undefined) {
                this.#measures.set(name, {
                    name,
                    duration,
                    startMark,
                    endMark,
                    data,
                    timestamp: Date.now()
                });

                this.#log('debug', `Measure: ${name} = ${duration.toFixed(2)}ms`);
                
                EventBus.emit('performance:measure', { name, duration, data });

                // Track custom metric
                if (this.#config.metrics.custom) {
                    this.#performanceData.custom.push({
                        name,
                        duration,
                        data,
                        timestamp: Date.now()
                    });
                }

                return duration;
            }
        } catch (e) {
            this.#log('error', `Failed to create measure: ${name}`, e);
        }

        return null;
    }

    /**
     * Get performance score
     * @public
     * @static
     * @returns {Object} Performance score
     */
    static getScore() {
        const score = {
            overall: 0,
            metrics: {},
            details: {}
        };

        // Calculate individual scores
        const webVitals = this.#performanceData.webVitals;
        const navigation = this.#performanceData.navigation;

        // LCP Score
        if (webVitals.lcp) {
            const lcpValue = webVitals.lcp.value;
            score.metrics.lcp = {
                value: lcpValue,
                score: this.#calculateMetricScore(lcpValue, 2500, 4000),
                threshold: this.#config.thresholds.lcp
            };
        }

        // FID Score
        if (webVitals.fid) {
            const fidValue = webVitals.fid.value;
            score.metrics.fid = {
                value: fidValue,
                score: this.#calculateMetricScore(fidValue, 100, 300),
                threshold: this.#config.thresholds.fid
            };
        }

        // CLS Score
        if (webVitals.cls) {
            const clsValue = webVitals.cls.value;
            score.metrics.cls = {
                value: clsValue,
                score: this.#calculateMetricScore(clsValue, 0.1, 0.25, true),
                threshold: this.#config.thresholds.cls
            };
        }

        // FCP Score
        if (webVitals.fcp) {
            const fcpValue = webVitals.fcp.value;
            score.metrics.fcp = {
                value: fcpValue,
                score: this.#calculateMetricScore(fcpValue, 1500, 3000),
                threshold: this.#config.thresholds.fcp
            };
        }

        // TTFB Score
        if (navigation.ttfb) {
            const ttfbValue = navigation.ttfb;
            score.metrics.ttfb = {
                value: ttfbValue,
                score: this.#calculateMetricScore(ttfbValue, 200, 600),
                threshold: this.#config.thresholds.ttfb
            };
        }

        // Calculate overall score (weighted average)
        let totalWeight = 0;
        let weightedSum = 0;
        const weights = { lcp: 0.25, fid: 0.25, cls: 0.25, fcp: 0.15, ttfb: 0.1 };

        for (const [key, metric] of Object.entries(score.metrics)) {
            if (metric.score !== undefined) {
                const weight = weights[key] || 0.1;
                weightedSum += metric.score * weight;
                totalWeight += weight;
            }
        }

        score.overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

        // Add details
        score.details = {
            totalResources: this.#performanceData.resources.length,
            memoryUsage: this.#getCurrentMemoryUsage(),
            timestamp: Date.now()
        };

        return score;
    }

    /**
     * Calculate metric score (0-100)
     * @private
     * @static
     * @param {number} value - Metric value
     * @param {number} good - Good threshold
     * @param {number} poor - Poor threshold
     * @param {boolean} lowerIsBetter - Lower is better
     * @returns {number} Score (0-100)
     */
    static #calculateMetricScore(value, good, poor, lowerIsBetter = true) {
        if (value === undefined || value === null) return 0;

        let score;
        if (lowerIsBetter) {
            if (value <= good) score = 100;
            else if (value >= poor) score = 0;
            else score = 100 - ((value - good) / (poor - good)) * 100;
        } else {
            if (value >= good) score = 100;
            else if (value <= poor) score = 0;
            else score = ((value - poor) / (good - poor)) * 100;
        }

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    /**
     * Get current memory usage
     * @private
     * @static
     * @returns {Object} Memory usage
     */
    static #getCurrentMemoryUsage() {
        if (window.performance && window.performance.memory) {
            const mem = window.performance.memory;
            return {
                used: mem.usedJSHeapSize,
                total: mem.totalJSHeapSize,
                limit: mem.jsHeapSizeLimit,
                usedPercent: (mem.usedJSHeapSize / mem.totalJSHeapSize) * 100
            };
        }
        return null;
    }

    /**
     * Generate performance report
     * @public
     * @static
     * @param {Object} options - Report options
     * @returns {Object} Performance report
     */
    static report(options = {}) {
        if (!this.#isInitialized) {
            this.#log('warn', 'Performance monitor not initialized');
            return null;
        }

        // Capture latest metrics
        this.#captureNavigationTiming();
        this.#captureResourceTiming();
        if (this.#config.metrics.memory) {
            this.#captureMemoryUsage();
        }

        const score = this.getScore();

        const report = {
            timestamp: Date.now(),
            url: window.location.href,
            score: score,
            metrics: {
                webVitals: this.#performanceData.webVitals,
                navigation: this.#performanceData.navigation,
                resources: {
                    total: this.#performanceData.resources.length,
                    slowResources: this.#performanceData.resources.filter(r => r.duration > 500).length
                },
                memory: this.#getCurrentMemoryUsage()
            },
            marks: Array.from(this.#marks.values()).slice(-20),
            measures: Array.from(this.#measures.values()).slice(-20)
        };

        // Log report
        this.#log('info', `Performance Report: Score = ${score.overall}%`);

        // Store report
        this.#scores.push(score);
        if (this.#scores.length > 100) {
            this.#scores.shift();
        }

        // Save to storage
        try {
            const history = this.#loadHistory();
            history.push(report);
            if (history.length > 50) {
                history.shift();
            }
            localStorage.setItem(this.#config.storageKey, JSON.stringify(history));
        } catch (e) {
            this.#log('debug', 'Failed to save performance history');
        }

        // Send to analytics
        if (options.sendAnalytics !== false) {
            this.#sendToAnalytics(report);
        }

        // Emit event
        EventBus.emit('performance:report', { report });

        return report;
    }

    /**
     * Send report to analytics
     * @private
     * @static
     * @param {Object} report - Performance report
     */
    static #sendToAnalytics(report) {
        try {
            if (AnalyticsService && typeof AnalyticsService.trackEvent === 'function') {
                AnalyticsService.trackEvent('performance_report', {
                    score: report.score.overall,
                    lcp: report.metrics.webVitals.lcp?.value || 0,
                    fid: report.metrics.webVitals.fid?.value || 0,
                    cls: report.metrics.webVitals.cls?.value || 0,
                    fcp: report.metrics.webVitals.fcp?.value || 0,
                    ttfb: report.metrics.navigation?.ttfb || 0,
                    totalResources: report.metrics.resources.total,
                    slowResources: report.metrics.resources.slowResources
                });
            }
        } catch (e) {
            this.#log('debug', 'Failed to send report to analytics');
        }
    }

    /**
     * Load performance history from storage
     * @private
     * @static
     * @returns {Array} Performance history
     */
    static #loadHistory() {
        try {
            const data = localStorage.getItem(this.#config.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Get performance history
     * @public
     * @static
     * @param {number} limit - Maximum number of entries
     * @returns {Array} Performance history
     */
    static getHistory(limit = 20) {
        const history = this.#loadHistory();
        return history.slice(-limit);
    }

    /**
     * Clear performance history
     * @public
     * @static
     */
    static clearHistory() {
        try {
            localStorage.removeItem(this.#config.storageKey);
            this.#scores = [];
            this.#log('info', 'Performance history cleared');
        } catch (e) {
            this.#log('error', 'Failed to clear performance history', e);
        }
    }

    /**
     * Get current performance metrics
     * @public
     * @static
     * @returns {Object} Current metrics
     */
    static getMetrics() {
        return {
            webVitals: { ...this.#performanceData.webVitals },
            navigation: { ...this.#performanceData.navigation },
            resourceCount: this.#performanceData.resources.length,
            marks: Array.from(this.#marks.keys()),
            measures: Array.from(this.#measures.keys())
        };
    }

    /**
     * Reset all performance data
     * @public
     * @static
     */
    static reset() {
        this.#marks.clear();
        this.#measures.clear();
        this.#performanceData = {
            navigation: {},
            resources: [],
            webVitals: {},
            memory: [],
            custom: []
        };
        this.#log('info', 'Performance data reset');
    }

    /**
     * Log a message
     * @private
     * @static
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {*} data - Additional data
     */
    static #log(level, message, data = null) {
        const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
        const currentLevel = logLevels[this.#config.logLevel] || 0;
        const msgLevel = logLevels[level] || 0;

        if (msgLevel < currentLevel) return;

        const prefix = `[PerformanceMonitor]`;
        const logMsg = `${prefix} ${message}`;

        switch (level) {
            case 'debug':
                console.debug(logMsg, data);
                break;
            case 'info':
                console.info(logMsg, data);
                break;
            case 'warn':
                console.warn(logMsg, data);
                break;
            case 'error':
                console.error(logMsg, data);
                break;
            default:
                console.log(logMsg, data);
        }
    }

    /**
     * Destroy performance monitor
     * @public
     * @static
     */
    static destroy() {
        if (!this.#isInitialized) return;

        // Disconnect observers
        for (const observer of this.#observers) {
            try {
                observer.disconnect();
            } catch (e) {
                // Ignore
            }
        }
        this.#observers = [];

        // Clear timer
        if (this.#reportTimer) {
            clearInterval(this.#reportTimer);
            this.#reportTimer = null;
        }

        this.#isInitialized = false;
        this.#instance = null;

        this.#log('info', 'Performance monitoring destroyed');
    }

    /**
     * Check if performance monitor is running
     * @public
     * @static
     * @returns {boolean} Is running
     */
    static isRunning() {
        return this.#isInitialized;
    }

    /**
     * Update configuration
     * @public
     * @static
     * @param {Object} config - Configuration updates
     */
    static updateConfig(config = {}) {
        this.#config = {
            ...this.#config,
            ...config
        };

        // Update reporting interval
        if (config.reportInterval && this.#reportTimer) {
            clearInterval(this.#reportTimer);
            this.#setupReporting();
        }

        this.#log('info', 'Configuration updated');
    }

    /**
     * Get configuration
     * @public
     * @static
     * @returns {Object} Configuration
     */
    static getConfig() {
        return { ...this.#config };
    }

    /**
     * Create a performance transaction
     * @public
     * @static
     * @param {string} name - Transaction name
     * @param {Function} fn - Function to execute
     * @param {Object} data - Additional data
     * @returns {Promise<*>} Result of function
     */
    static async transaction(name, fn, data = {}) {
        if (!this.#isInitialized) {
            return await fn();
        }

        const startMark = `transaction:${name}:start`;
        const endMark = `transaction:${name}:end`;

        this.mark(startMark, data);

        try {
            const result = await fn();
            this.mark(endMark, { result: true });
            const duration = this.measure(name, startMark, endMark, data);
            this.#log('info', `Transaction: ${name} completed in ${duration?.toFixed(2) || '?'}ms`);
            return result;
        } catch (error) {
            this.mark(endMark, { result: false, error: error.message });
            const duration = this.measure(name, startMark, endMark, { ...data, error: error.message });
            this.#log('error', `Transaction: ${name} failed after ${duration?.toFixed(2) || '?'}ms`, error);
            throw error;
        }
    }
}

// ============================================================
// AUTO-INITIALIZE ON LOAD
// ============================================================
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            PerformanceMonitor.init();
        });
    } else {
        PerformanceMonitor.init();
    }
}

// ============================================================
// GLOBAL EXPOSURE
// ============================================================
if (typeof window !== 'undefined') {
    window.PerformanceMonitor = PerformanceMonitor;
}

// ============================================================
// EXPORT
// ============================================================
export default PerformanceMonitor;