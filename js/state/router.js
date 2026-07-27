// SPA Router
// ============================================================
// FILE: router.js
// PURPOSE: SPA routing (URL to Screen mapping)
// DEPENDENCY: event-bus.js
// USED BY: app.js, bottom-nav
// LOCATION: js/router.js
// ============================================================

// ============================================================
// IMPORT DEPENDENCIES
// ============================================================


import { eventBus } from './event-bus.js'; 
import { logger } from '../services/logger.js';

// ============================================================
// ROUTE CONSTANTS
// ============================================================

export const ROUTES = {
    HOME: '/home',
    AUTH: '/auth',
    EXPLORE: '/explore',
    PRODUCT_DETAIL: '/product/:id',
    UPLOAD: '/upload',
    PROFILE: '/profile',
    HISTORY: '/history',
    SETTINGS: '/settings',
    NOTIFICATIONS: '/notifications',
    ABOUT: '/about',
    CONTACT: '/contact',
    PRIVACY: '/privacy',
    TERMS: '/terms'
};

export const ROUTE_NAMES = {
    [ROUTES.HOME]: 'Home',
    [ROUTES.AUTH]: 'Auth',
    [ROUTES.EXPLORE]: 'Explore',
    [ROUTES.PRODUCT_DETAIL]: 'Product Detail',
    [ROUTES.UPLOAD]: 'Upload',
    [ROUTES.PROFILE]: 'Profile',
    [ROUTES.HISTORY]: 'History',
    [ROUTES.SETTINGS]: 'Settings',
    [ROUTES.NOTIFICATIONS]: 'Notifications'
};

export const ROUTE_ICONS = {
    [ROUTES.HOME]: '🏠',
    [ROUTES.AUTH]: '🔐',
    [ROUTES.EXPLORE]: '🔍',
    [ROUTES.PRODUCT_DETAIL]: '📦',
    [ROUTES.UPLOAD]: '📤',
    [ROUTES.PROFILE]: '👤',
    [ROUTES.HISTORY]: '📋',
    [ROUTES.SETTINGS]: '⚙️',
    [ROUTES.NOTIFICATIONS]: '🔔'
};

export const ROUTE_GROUPS = {
    public: [ROUTES.HOME, ROUTES.EXPLORE, ROUTES.PRODUCT_DETAIL, ROUTES.ABOUT, ROUTES.CONTACT, ROUTES.PRIVACY, ROUTES.TERMS],
    auth: [ROUTES.AUTH],
    private: [ROUTES.UPLOAD, ROUTES.PROFILE, ROUTES.HISTORY, ROUTES.SETTINGS, ROUTES.NOTIFICATIONS]
};

// ============================================================
// ROUTER CLASS
// ============================================================

/**
 * Router - SPA Routing
 * Handles URL-based navigation, route protection, and history management
 */
class Router {
    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * Create a new Router instance
     * @param {Object} options - Router options
     * @param {string} options.mode - 'hash' or 'history'
     * @param {string} options.basePath - Base path for history mode
     * @param {Array} options.routes - Custom route definitions
     */
    constructor(options = {}) {
        this.eventBus = getEventBus();
        this.mode = options.mode || 'hash';
        this.basePath = options.basePath || '/';
        this.currentRoute = null;
        this.currentParams = {};
        this.previousRoute = null;
        this.routes = options.routes || this.getDefaultRoutes();
        this.middlewares = [];
        this.guards = [];
        this.listeners = [];
        this.isNavigating = false;
        this.historyStack = [];
        this.maxHistory = 50;
        this.isInitialized = false;
        this.routeData = {};

        // Initialize
        this.initialize();
    }

    /**
     * Get default routes
     * @returns {Array} Route definitions
     */
    getDefaultRoutes() {
        return [
            { path: ROUTES.HOME, component: 'home-screen', title: 'Home', group: 'public' },
            { path: ROUTES.AUTH, component: 'auth-screen', title: 'Auth', group: 'auth' },
            { path: ROUTES.EXPLORE, component: 'explore-screen', title: 'Explore', group: 'public' },
            { path: ROUTES.PRODUCT_DETAIL, component: 'product-detail', title: 'Product Detail', group: 'public' },
            { path: ROUTES.UPLOAD, component: 'upload-screen', title: 'Upload', group: 'private' },
            { path: ROUTES.PROFILE, component: 'profile-screen', title: 'Profile', group: 'private' },
            { path: ROUTES.HISTORY, component: 'history-screen', title: 'History', group: 'private' },
            { path: ROUTES.SETTINGS, component: 'settings-screen', title: 'Settings', group: 'private' },
            { path: ROUTES.NOTIFICATIONS, component: 'notifications-screen', title: 'Notifications', group: 'private' }
        ];
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    /**
     * Initialize router
     */
    initialize() {
        try {
            logger.info('Initializing Router...');

            // Setup URL change listener
            if (this.mode === 'hash') {
                window.addEventListener('hashchange', this.handleUrlChange.bind(this));
            } else {
                window.addEventListener('popstate', this.handleUrlChange.bind(this));
            }

            // Setup link click handler
            document.addEventListener('click', this.handleLinkClick.bind(this));

            // Load initial route
            this.handleUrlChange();

            this.isInitialized = true;
            logger.info('Router initialized');

        } catch (error) {
            logger.error('Failed to initialize Router:', error);
            this.isInitialized = true;
        }
    }

    // ============================================
    // URL HANDLING
    // ============================================

    /**
     * Handle URL change
     * @param {Event} event - URL change event
     */
    handleUrlChange(event = null) {
        if (this.isNavigating) return;

        try {
            const path = this.getCurrentPath();
            const params = this.parsePathParams(path);
            
            this.navigateTo(path, params, { replace: false, triggerEvent: true });

        } catch (error) {
            logger.error('Error handling URL change:', error);
        }
    }

    /**
     * Handle link clicks
     * @param {Event} event - Click event
     */
    handleLinkClick(event) {
        const target = event.target.closest('a');
        if (!target) return;

        // Check if it's an internal link
        const href = target.getAttribute('href');
        if (!href) return;

        // Skip external links
        if (href.startsWith('http') || href.startsWith('//')) return;

        // Skip if target is _blank
        if (target.target === '_blank') return;

        // Skip if modifier keys are pressed
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        // Skip if it's a download link
        if (target.hasAttribute('download')) return;

        // Handle internal navigation
        event.preventDefault();
        this.goTo(href);
    }

    /**
     * Get current path
     * @returns {string} Current path
     */
    getCurrentPath() {
        if (this.mode === 'hash') {
            const hash = window.location.hash;
            return hash ? hash.substring(1) : '/';
        }
        const path = window.location.pathname;
        return path.startsWith(this.basePath) ? path.substring(this.basePath.length - 1) : path;
    }

    /**
     * Parse path parameters
     * @param {string} path - Path to parse
     * @returns {Object} Parsed parameters
     */
    parsePathParams(path) {
        const params = {};
        const route = this.findRoute(path);

        if (route) {
            const pathParts = path.split('/');
            const routeParts = route.path.split('/');

            for (let i = 0; i < routeParts.length; i++) {
                if (routeParts[i].startsWith(':')) {
                    const key = routeParts[i].substring(1);
                    params[key] = pathParts[i] || '';
                }
            }
        }

        return params;
    }

    /**
     * Find route by path
     * @param {string} path - Path to find
     * @returns {Object|null} Route definition
     */
    findRoute(path) {
        // Direct match
        const directMatch = this.routes.find(r => r.path === path);
        if (directMatch) return directMatch;

        // Parameter match
        const pathParts = path.split('/');
        for (const route of this.routes) {
            const routeParts = route.path.split('/');
            if (routeParts.length !== pathParts.length) continue;

            let matches = true;
            for (let i = 0; i < routeParts.length; i++) {
                if (routeParts[i].startsWith(':')) continue;
                if (routeParts[i] !== pathParts[i]) {
                    matches = false;
                    break;
                }
            }
            if (matches) return route;
        }

        return null;
    }

    /**
     * Check if path matches route
     * @param {string} path - Path to check
     * @param {string} routePath - Route path
     * @returns {boolean} True if matches
     */
    matchesRoute(path, routePath) {
        if (path === routePath) return true;

        const pathParts = path.split('/');
        const routeParts = routePath.split('/');
        if (pathParts.length !== routeParts.length) return false;

        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) continue;
            if (routeParts[i] !== pathParts[i]) return false;
        }

        return true;
    }

    // ============================================
    // NAVIGATION
    // ============================================

    /**
     * Navigate to a path
     * @param {string} path - Path to navigate to
     * @param {Object} params - Path parameters
     * @param {Object} options - Navigation options
     * @param {boolean} options.replace - Replace history entry
     * @param {boolean} options.triggerEvent - Trigger route event
     * @param {Object} options.data - Additional data
     * @returns {Promise<Object>} Navigation result
     */
    async navigateTo(path, params = {}, options = {}) {
        if (this.isNavigating) {
            logger.debug('Navigation already in progress, ignoring');
            return null;
        }

        this.isNavigating = true;

        try {
            const normalizedPath = this.normalizePath(path);
            const route = this.findRoute(normalizedPath);

            if (!route) {
                // 404 - redirect to home
                logger.warn(`Route not found: ${normalizedPath}`);
                await this.redirectTo('/');
                return null;
            }

            // Check guards
            const guardResult = await this.runGuards(route, params);
            if (guardResult === false) {
                logger.debug('Navigation blocked by guard');
                this.isNavigating = false;
                return null;
            }

            // Store previous route
            this.previousRoute = this.currentRoute;

            // Update current route
            this.currentRoute = {
                path: normalizedPath,
                route: route,
                params: { ...params, ...this.parsePathParams(normalizedPath) },
                data: options.data || {},
                timestamp: Date.now()
            };

            // Add to history
            if (!options.replace) {
                this.historyStack.push(this.currentRoute);
                if (this.historyStack.length > this.maxHistory) {
                    this.historyStack.shift();
                }
            }

            // Update URL
            if (!options.replace) {
                this.updateUrl(normalizedPath);
            }

            // Emit route change event
            if (options.triggerEvent !== false) {
                this.emitRouteChange();
            }

            this.isNavigating = false;
            return this.currentRoute;

        } catch (error) {
            logger.error('Navigation error:', error);
            this.isNavigating = false;
            throw error;
        }
    }

    /**
     * Go to a path (public method)
     * @param {string} path - Path to navigate to
     * @param {Object} data - Additional data
     * @returns {Promise<Object>} Navigation result
     */
    async goTo(path, data = {}) {
        if (!path) return null;
        
        // Handle relative paths
        if (path.startsWith('.')) {
            path = this.resolveRelativePath(path);
        }

        // Handle query string
        const queryIndex = path.indexOf('?');
        let query = '';
        let cleanPath = path;
        if (queryIndex !== -1) {
            query = path.substring(queryIndex);
            cleanPath = path.substring(0, queryIndex);
        }

        const params = { ...data };
        if (query) {
            const queryParams = this.parseQueryString(query);
            Object.assign(params, queryParams);
        }

        return this.navigateTo(cleanPath, params, { replace: false, triggerEvent: true });
    }

    /**
     * Redirect to a path (replaces current history)
     * @param {string} path - Path to redirect to
     * @param {Object} data - Additional data
     * @returns {Promise<Object>} Navigation result
     */
    async redirectTo(path, data = {}) {
        const params = { ...data };
        return this.navigateTo(path, params, { replace: true, triggerEvent: true });
    }

    /**
     * Go back in history
     * @returns {Promise<Object>} Navigation result
     */
    async goBack() {
        if (this.historyStack.length > 1) {
            const previous = this.historyStack[this.historyStack.length - 2];
            this.historyStack.pop();
            return this.goTo(previous.path, previous.params);
        }
        return this.goTo('/');
    }

    /**
     * Go forward in history
     * @returns {Promise<Object>} Navigation result
     */
    goForward() {
        // Not implemented for client-side navigation
        window.history.forward();
        return null;
    }

    /**
     * Resolve relative path
     * @param {string} path - Relative path
     * @returns {string} Resolved path
     */
    resolveRelativePath(path) {
        const currentPath = this.currentRoute?.path || '/';
        const parts = currentPath.split('/');
        parts.pop(); // Remove last part
        
        const relParts = path.split('/');
        for (const part of relParts) {
            if (part === '..') {
                parts.pop();
            } else if (part !== '.') {
                parts.push(part);
            }
        }
        
        return parts.join('/') || '/';
    }

    // ============================================
    // URL MANAGEMENT
    // ============================================

    /**
     * Update URL
     * @param {string} path - Path to set
     */
    updateUrl(path) {
        const url = this.buildUrl(path);

        if (this.mode === 'hash') {
            window.location.hash = path;
        } else {
            window.history.pushState({ path: path }, '', url);
        }
    }

    /**
     * Build URL
     * @param {string} path - Path
     * @returns {string} Full URL
     */
    buildUrl(path) {
        if (this.mode === 'hash') {
            return `${window.location.pathname}${window.location.search}#${path}`;
        }
        return `${this.basePath}${path.startsWith('/') ? path.substring(1) : path}`;
    }

    /**
     * Normalize path
     * @param {string} path - Path to normalize
     * @returns {string} Normalized path
     */
    normalizePath(path) {
        if (!path) return '/';
        
        // Remove trailing slash
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        
        // Ensure leading slash
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        return path;
    }

    /**
     * Parse query string
     * @param {string} query - Query string
     * @returns {Object} Parsed parameters
     */
    parseQueryString(query) {
        const params = {};
        if (!query) return params;

        const queryString = query.startsWith('?') ? query.substring(1) : query;
        const pairs = queryString.split('&');

        for (const pair of pairs) {
            const [key, value] = pair.split('=');
            if (key) {
                params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
            }
        }

        return params;
    }

    // ============================================
    // ROUTE GUARDS
    // ============================================

    /**
     * Add a route guard
     * @param {Function} guard - Guard function
     * @returns {Function} Remove guard function
     */
    addGuard(guard) {
        if (typeof guard !== 'function') {
            throw new Error('Guard must be a function');
        }

        this.guards.push(guard);

        return () => {
            this.guards = this.guards.filter(g => g !== guard);
        };
    }

    /**
     * Run all guards
     * @param {Object} route - Route definition
     * @param {Object} params - Route parameters
     * @returns {Promise<boolean>} True if all guards pass
     */
    async runGuards(route, params) {
        for (const guard of this.guards) {
            try {
                const result = await guard(route, params);
                if (result === false) {
                    return false;
                }
                if (typeof result === 'string') {
                    await this.redirectTo(result);
                    return false;
                }
            } catch (error) {
                logger.error('Guard error:', error);
                return false;
            }
        }
        return true;
    }

    /**
     * Add middleware
     * @param {Function} middleware - Middleware function
     * @returns {Function} Remove middleware function
     */
    use(middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('Middleware must be a function');
        }

        this.middlewares.push(middleware);

        return () => {
            this.middlewares = this.middlewares.filter(m => m !== middleware);
        };
    }

    // ============================================
    // EVENT EMISSION
    // ============================================

    /**
     * Emit route change event
     */
    emitRouteChange() {
        const routeData = {
            current: this.currentRoute,
            previous: this.previousRoute,
            timestamp: Date.now()
        };

        // Apply middlewares
        for (const middleware of this.middlewares) {
            try {
                middleware(routeData);
            } catch (error) {
                logger.error('Middleware error:', error);
            }
        }

        // Emit event
        this.eventBus.emit('route:change', routeData);
        this.eventBus.emit(`route:${this.currentRoute.route.component}`, this.currentRoute);

        // Update title
        if (this.currentRoute.route.title) {
            document.title = `ZYMORE - ${this.currentRoute.route.title}`;
        }

        this.notifyListeners(routeData);
    }

    /**
     * Add route listener
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    onRouteChange(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }

        this.listeners.push(callback);

        // Immediately call with current route
        if (this.currentRoute) {
            try {
                callback({
                    current: this.currentRoute,
                    previous: this.previousRoute,
                    timestamp: Date.now()
                });
            } catch (error) {
                logger.error('Error in route listener:', error);
            }
        }

        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    /**
     * Notify all listeners
     * @param {Object} data - Route data
     */
    notifyListeners(data) {
        for (const callback of this.listeners) {
            try {
                callback(data);
            } catch (error) {
                logger.error('Error in route listener:', error);
            }
        }
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Get current route
     * @returns {Object|null} Current route
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * Get route by path
     * @param {string} path - Path to find
     * @returns {Object|null} Route definition
     */
    getRoute(path) {
        return this.findRoute(path);
    }

    /**
     * Check if path matches current route
     * @param {string} path - Path to check
     * @returns {boolean} True if matches
     */
    isCurrentRoute(path) {
        if (!this.currentRoute) return false;
        return this.matchesRoute(this.currentRoute.path, path);
    }

    /**
     * Check if path is active
     * @param {string} path - Path to check
     * @param {boolean} exact - Exact match
     * @returns {boolean} True if active
     */
    isActive(path, exact = false) {
        if (!this.currentRoute) return false;

        if (exact) {
            return this.currentRoute.path === path;
        }

        return this.currentRoute.path.startsWith(path);
    }

    /**
     * Get route parameters
     * @returns {Object} Route parameters
     */
    getParams() {
        return this.currentRoute?.params || {};
    }

    /**
     * Get route data
     * @returns {Object} Route data
     */
    getRouteData() {
        return this.currentRoute?.data || {};
    }

    /**
     * Get history
     * @param {number} limit - Max entries
     * @returns {Array} History entries
     */
    getHistory(limit = 20) {
        return this.historyStack.slice(-limit);
    }

    /**
     * Clear history
     */
    clearHistory() {
        this.historyStack = [];
        this.previousRoute = null;
    }

    /**
     * Get navigation status
     * @returns {Object} Navigation status
     */
    getStatus() {
        return {
            isNavigating: this.isNavigating,
            currentRoute: this.currentRoute,
            historySize: this.historyStack.length,
            isInitialized: this.isInitialized,
            mode: this.mode,
            basePath: this.basePath,
            guards: this.guards.length,
            middlewares: this.middlewares.length,
            listeners: this.listeners.length
        };
    }

    // ============================================
    // STRING REPRESENTATION
    // ============================================

    /**
     * Get string representation
     * @returns {string} String representation
     */
    toString() {
        return `Router(mode=${this.mode}, current=${this.currentRoute?.path || 'none'})`;
    }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

let routerInstance = null;

/**
 * Get or create Router instance
 * @param {Object} options - Router options
 * @returns {Router} Router instance
 */
export function getRouter(options = {}) {
    if (!routerInstance) {
        routerInstance = new Router(options);
    }
    return routerInstance;
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

const router = getRouter();

// Export individual methods for convenience
export const goTo = router.goTo.bind(router);
export const redirectTo = router.redirectTo.bind(router);
export const goBack = router.goBack.bind(router);
export const goForward = router.goForward.bind(router);
export const getCurrentRoute = router.getCurrentRoute.bind(router);
export const getParams = router.getParams.bind(router);
export const getRouteData = router.getRouteData.bind(router);
export const isActive = router.isActive.bind(router);
export const isCurrentRoute = router.isCurrentRoute.bind(router);
export const getRoute = router.getRoute.bind(router);
export const getHistory = router.getHistory.bind(router);
export const clearHistory = router.clearHistory.bind(router);
export const addGuard = router.addGuard.bind(router);
export const use = router.use.bind(router);
export const onRouteChange = router.onRouteChange.bind(router);
export const getStatus = router.getStatus.bind(router);

// Export route constants
//export { ROUTES, ROUTE_NAMES, ROUTE_ICONS, ROUTE_GROUPS };

export default router;

// ============================================================
// END OF FILE: router.js
// ============================================================