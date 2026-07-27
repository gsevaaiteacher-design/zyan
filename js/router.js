// ============================================================
// FILE: js/router.js
// PURPOSE: SPA Router - Advanced Route Management
// DEPENDENCIES: event-bus.js, logger.js
// USED BY: app.js, all screens, bottom-nav
// VERSION: 4.0.0 - FULLY ADVANCED
// ============================================================

import { eventBus, EVENTS } from './state/event-bus.js';
import { logger } from './services/logger.js';

// ============================================================
// ROUTER CONFIGURATION
// ============================================================

export const ROUTER_CONFIG = {
    version: '4.0.0',
    mode: 'history', // 'history' | 'hash'
    basePath: '/',
    defaultRoute: '/home',
    notFoundRoute: '/404',
    enableLogging: true,
    enableMiddleware: true,
    enableGuards: true,
    enableLazyLoading: true,
    enablePreloading: true,
    enableCaching: true,
    enableAnimations: true,
    enableScrollRestoration: true,
    enableRouteParams: true,
    enableQueryParams: true,
    enableNestedRoutes: true,
    enableRouteAliases: true,
    enableRouteGroups: true,
    enableBeforeEach: true,
    enableAfterEach: true,
    enableErrorHandler: true,
    enableBreadcrumb: true,
    enableMetaTags: true,
    enableHistory: true,
    maxHistory: 50,
    transitionDuration: 300,
    cacheTTL: 300000, // 5 minutes
    preloadThreshold: 0.7
};

// ============================================================
// ROUTE DEFINITIONS
// ============================================================

export const ROUTES = {
    // Auth Routes
    AUTH: '/auth',
    LOGIN: '/login',
    SIGNUP: '/signup',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password/:token',
    VERIFY_EMAIL: '/verify-email/:token',
    
    // Main Routes
    HOME: '/home',
    EXPLORE: '/explore',
    SOCIAL: '/social',
    MARKETPLACE: '/marketplace',
    DASHBOARD: '/dashboard',
    
    // Social Routes
    SOCIAL_FEED: '/social/feed',
    CREATE_POST: '/social/create-post',
    CREATE_STORY: '/social/create-story',
    STORY_VIEW: '/social/story/:id',
    POST_DETAIL: '/social/post/:id',
    
    // Products Routes
    PRODUCT_DETAIL: '/product/:id',
    PRODUCT_CATEGORY: '/category/:slug',
    PRODUCT_SEARCH: '/search',
    UPLOAD_PRODUCT: '/upload-product',
    EDIT_PRODUCT: '/edit-product/:id',
    MY_PRODUCTS: '/my-products',
    SAVED_PRODUCTS: '/saved-products',
    
    // Chat Routes
    CHAT_LIST: '/chat',
    CHAT_DETAIL: '/chat/:id',
    AI_CHAT: '/ai-chat',
    
    // User Routes
    PROFILE: '/profile/:userId?',
    SETTINGS: '/settings',
    NOTIFICATIONS: '/notifications',
    HISTORY: '/history',
    FOLLOWERS: '/followers/:userId',
    FOLLOWING: '/following/:userId',
    
    // Admin Routes
    ADMIN: '/admin',
    ADMIN_DASHBOARD: '/admin/dashboard',
    ADMIN_USERS: '/admin/users',
    ADMIN_PRODUCTS: '/admin/products',
    ADMIN_REPORTS: '/admin/reports',
    ADMIN_SETTINGS: '/admin/settings',
    
    // Error Routes
    NOT_FOUND: '/404',
    ERROR: '/error',
    UNAUTHORIZED: '/unauthorized',
    FORBIDDEN: '/forbidden',
    
    // Other Routes
    ABOUT: '/about',
    CONTACT: '/contact',
    PRIVACY: '/privacy',
    TERMS: '/terms',
    HELP: '/help',
    FAQ: '/faq',
    BLOG: '/blog',
    BLOG_POST: '/blog/:slug'
};

// ============================================================
// ROUTE METADATA
// ============================================================

export const ROUTE_METADATA = {
    [ROUTES.HOME]: {
        title: 'Home - ZYMORE',
        description: 'Welcome to ZYMORE - Digital Marketplace',
        requiresAuth: false,
        requiresGuest: false,
        requiresAdmin: false,
        requiresSeller: false,
        layout: 'main',
        icon: 'home',
        breadcrumb: 'Home',
        meta: { keywords: 'marketplace, digital products' }
    },
    [ROUTES.AUTH]: {
        title: 'Authentication - ZYMORE',
        description: 'Login or Signup to ZYMORE',
        requiresAuth: false,
        requiresGuest: true,
        requiresAdmin: false,
        requiresSeller: false,
        layout: 'auth',
        icon: 'login',
        breadcrumb: 'Auth',
        meta: { keywords: 'login, signup, auth' }
    },
    [ROUTES.EXPLORE]: {
        title: 'Explore - ZYMORE',
        description: 'Explore products on ZYMORE',
        requiresAuth: false,
        requiresGuest: false,
        requiresAdmin: false,
        requiresSeller: false,
        layout: 'main',
        icon: 'explore',
        breadcrumb: 'Explore',
        meta: { keywords: 'explore, discover, products' }
    },
    [ROUTES.SOCIAL_FEED]: {
        title: 'Social Feed - ZYMORE',
        description: 'See what\'s happening on ZYMORE',
        requiresAuth: true,
        requiresGuest: false,
        requiresAdmin: false,
        requiresSeller: false,
        layout: 'main',
        icon: 'social',
        breadcrumb: 'Social',
        meta: { keywords: 'social, feed, posts' }
    },
    [ROUTES.CREATE_POST]: {
        title: 'Create Post - ZYMORE',
        description: 'Share your thoughts on ZYMORE',
        requiresAuth: true,
        requiresGuest: false,
        requiresAdmin: false,
        requiresSeller: false,
        layout: 'main',
        icon: 'create',
        breadcrumb: 'Create Post',
        meta: { keywords: 'create, post, share' }
    },
    [ROUTES.PRODUCT_DETAIL]: {
        title: 'Product - ZYMORE',
        description: 'View product details',
        requiresAuth: false,
        requiresGuest: false,
        requiresAdmin: false,
        requiresSeller: false,
        layout: 'main',
        icon: 'product',
        breadcrumb: 'Product',
        meta: { keywords: 'product, details, view' }
    },
    [ROUTES.UPLOAD_PRODUCT]: {
        title: 'Upload Product - ZYMORE',
        description: 'Sell your products on ZYMORE',
        requiresAuth: true,
        requiresGuest: false,
        requiresAdmin: false,
        requiresSeller: true,
        layout: 'main',
        icon: 'upload',
        breadcrumb: 'Upload',
        meta: { keywords: 'upload, sell, product' }
    },
    [ROUTES.CHAT_LIST]: {
        title: 'Chats - ZYMORE',
        description: 'Your messages on ZYMORE',
        requiresAuth: true,
        requiresGuest: false,
        requiresAdmin: false,
        requiresSeller: false,
        layout: 'main',
        icon: 'chat',
        breadcrumb: 'Chats',
        meta: { keywords: 'chat, messages' }
    },
    [ROUTES.AI_CHAT]: {
        title: 'AI Assistant - ZYMORE',
        description: 'Chat with our AI Assistant',
        requiresAuth: true,
        requiresGuest: false,
        requiresAdmin: false,
        requiresSeller: false,
        layout: 'main',
        icon: 'ai',
        breadcrumb: 'AI Chat',
        meta: { keywords: 'ai, chat, assistant' }
    },
    [ROUTES.PROFILE]: {
        title: 'Profile - ZYMORE',
        description: 'View your profile',
        requiresAuth: false,
        requiresGuest: false,
        requiresAdmin: false,
        requiresSeller: false,
        layout: 'main',
        icon: 'profile',
        breadcrumb: 'Profile',
        meta: { keywords: 'profile, user' }
    },
    [ROUTES.SETTINGS]: {
        title: 'Settings - ZYMORE',
        description: 'Manage your settings',
        requiresAuth: true,
        requiresGuest: false,
        requiresAdmin: false,
        requiresSeller: false,
        layout: 'main',
        icon: 'settings',
        breadcrumb: 'Settings',
        meta: { keywords: 'settings, preferences' }
    },
    [ROUTES.NOTIFICATIONS]: {
        title: 'Notifications - ZYMORE',
        description: 'Your notifications',
        requiresAuth: true,
        requiresGuest: false,
        requiresAdmin: false,
        requiresSeller: false,
        layout: 'main',
        icon: 'notifications',
        breadcrumb: 'Notifications',
        meta: { keywords: 'notifications, alerts' }
    },
    [ROUTES.HISTORY]: {
        title: 'History - ZYMORE',
        description: 'Your download history',
        requiresAuth: true,
        requiresGuest: false,
        requiresAdmin: false,
        requiresSeller: false,
        layout: 'main',
        icon: 'history',
        breadcrumb: 'History',
        meta: { keywords: 'history, downloads' }
    },
    [ROUTES.ADMIN_DASHBOARD]: {
        title: 'Admin Dashboard - ZYMORE',
        description: 'Admin Control Panel',
        requiresAuth: true,
        requiresGuest: false,
        requiresAdmin: true,
        requiresSeller: false,
        layout: 'admin',
        icon: 'admin',
        breadcrumb: 'Admin',
        meta: { keywords: 'admin, dashboard' }
    },
    [ROUTES.NOT_FOUND]: {
        title: 'Page Not Found - ZYMORE',
        description: 'The page you are looking for does not exist',
        requiresAuth: false,
        requiresGuest: false,
        requiresAdmin: false,
        requiresSeller: false,
        layout: 'error',
        icon: 'error',
        breadcrumb: '404',
        meta: { keywords: '404, not found' }
    }
};

// ============================================================
// ROUTER CLASS
// ============================================================

class Router {
    constructor() {
        // ==========================================
        // CONFIGURATION
        // ==========================================
        this.mode = ROUTER_CONFIG.mode;
        this.basePath = ROUTER_CONFIG.basePath;
        this.defaultRoute = ROUTER_CONFIG.defaultRoute;
        this.notFoundRoute = ROUTER_CONFIG.notFoundRoute;
        this.enableLogging = ROUTER_CONFIG.enableLogging;
        this.enableMiddleware = ROUTER_CONFIG.enableMiddleware;
        this.enableGuards = ROUTER_CONFIG.enableGuards;
        this.enableLazyLoading = ROUTER_CONFIG.enableLazyLoading;
        this.enablePreloading = ROUTER_CONFIG.enablePreloading;
        this.enableCaching = ROUTER_CONFIG.enableCaching;
        this.enableAnimations = ROUTER_CONFIG.enableAnimations;
        this.enableScrollRestoration = ROUTER_CONFIG.enableScrollRestoration;
        this.enableRouteParams = ROUTER_CONFIG.enableRouteParams;
        this.enableQueryParams = ROUTER_CONFIG.enableQueryParams;
        this.enableNestedRoutes = ROUTER_CONFIG.enableNestedRoutes;
        this.enableRouteAliases = ROUTER_CONFIG.enableRouteAliases;
        this.enableRouteGroups = ROUTER_CONFIG.enableRouteGroups;
        this.enableBeforeEach = ROUTER_CONFIG.enableBeforeEach;
        this.enableAfterEach = ROUTER_CONFIG.enableAfterEach;
        this.enableErrorHandler = ROUTER_CONFIG.enableErrorHandler;
        this.enableBreadcrumb = ROUTER_CONFIG.enableBreadcrumb;
        this.enableMetaTags = ROUTER_CONFIG.enableMetaTags;
        this.enableHistory = ROUTER_CONFIG.enableHistory;
        this.maxHistory = ROUTER_CONFIG.maxHistory;
        this.transitionDuration = ROUTER_CONFIG.transitionDuration;
        this.cacheTTL = ROUTER_CONFIG.cacheTTL;
        this.preloadThreshold = ROUTER_CONFIG.preloadThreshold;
        
        // ==========================================
        // ROUTE STORE
        // ==========================================
        this.routes = new Map();
        this.currentRoute = null;
        this.previousRoute = null;
        this.routeHistory = [];
        this.routeCache = new Map();
        this.routeData = new Map();
        this.routeComponents = new Map();
        
        // ==========================================
        // MIDDLEWARE & GUARDS
        // ==========================================
        this.middlewares = [];
        this.guards = [];
        this.errorHandlers = [];
        this.beforeHooks = [];
        this.afterHooks = [];
        
        // ==========================================
        // STATE
        // ==========================================
        this.isNavigating = false;
        this.isInitialized = false;
        this.initializationPromise = null;
        this.navigationQueue = [];
        this.abortController = null;
        this.scrollPositions = new Map();
        
        // ==========================================
        // EVENTS
        // ==========================================
        this.eventBus = eventBus;
        
        // ==========================================
        // INIT
        // ==========================================
        this.initialize();
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================

    initialize() {
        if (this.isInitialized) return;

        try {
            // Setup routes
            this.setupRoutes();
            
            // Setup history
            this.setupHistory();
            
            // Setup listeners
            this.setupListeners();
            
            // Handle initial route
            this.handleInitialRoute();
            
            this.isInitialized = true;
            this._log('🚀 Router initialized', {
                mode: this.mode,
                defaultRoute: this.defaultRoute,
                totalRoutes: this.routes.size
            });

            // Emit event
            this.eventBus.emit(EVENTS.ROUTE_READY, { routes: this.routes.size });

        } catch (error) {
            logger.error('❌ Router initialization failed', { error: error.message });
            throw error;
        }
    }

    // ============================================================
    // ROUTE SETUP
    // ============================================================

    setupRoutes() {
        // Register all routes
        for (const [path, metadata] of Object.entries(ROUTE_METADATA)) {
            this.registerRoute(path, metadata);
        }

        // Register route aliases
        if (this.enableRouteAliases) {
            this.registerAliases();
        }

        // Register route groups
        if (this.enableRouteGroups) {
            this.registerGroups();
        }
    }

    /**
     * Register a route
     */
    registerRoute(path, metadata, component = null) {
        const route = {
            path,
            metadata: { ...metadata },
            component,
            params: this.extractParams(path),
            regex: this.pathToRegex(path),
            children: [],
            parent: null
        };

        this.routes.set(path, route);
        this._log(`📌 Route registered: ${path}`);
        
        return route;
    }

    /**
     * Register route aliases
     */
    registerAliases() {
        const aliases = {
            '/': ROUTES.HOME,
            '/login': ROUTES.AUTH,
            '/signup': ROUTES.AUTH,
            '/register': ROUTES.AUTH,
            '/dashboard': ROUTES.HOME,
            '/feed': ROUTES.SOCIAL_FEED,
            '/messages': ROUTES.CHAT_LIST,
            '/inbox': ROUTES.CHAT_LIST,
            '/profile/me': ROUTES.PROFILE,
            '/settings/profile': ROUTES.SETTINGS,
            '/settings/notifications': ROUTES.NOTIFICATIONS,
            '/my/uploads': ROUTES.MY_PRODUCTS,
            '/my/products': ROUTES.MY_PRODUCTS,
            '/saved': ROUTES.SAVED_PRODUCTS,
            '/bookmarks': ROUTES.SAVED_PRODUCTS
        };

        for (const [alias, target] of Object.entries(aliases)) {
            this.routes.set(alias, {
                ...this.routes.get(target),
                path: alias,
                isAlias: true,
                target
            });
            this._log(`🔗 Alias registered: ${alias} → ${target}`);
        }
    }

    /**
     * Register route groups
     */
    registerGroups() {
        const groups = {
            auth: [ROUTES.AUTH, ROUTES.LOGIN, ROUTES.SIGNUP, ROUTES.FORGOT_PASSWORD],
            social: [ROUTES.SOCIAL_FEED, ROUTES.CREATE_POST, ROUTES.CREATE_STORY, ROUTES.STORY_VIEW, ROUTES.POST_DETAIL],
            product: [ROUTES.PRODUCT_DETAIL, ROUTES.PRODUCT_CATEGORY, ROUTES.UPLOAD_PRODUCT, ROUTES.EDIT_PRODUCT],
            chat: [ROUTES.CHAT_LIST, ROUTES.CHAT_DETAIL, ROUTES.AI_CHAT],
            user: [ROUTES.PROFILE, ROUTES.SETTINGS, ROUTES.NOTIFICATIONS, ROUTES.HISTORY],
            admin: [ROUTES.ADMIN, ROUTES.ADMIN_DASHBOARD, ROUTES.ADMIN_USERS, ROUTES.ADMIN_PRODUCTS]
        };

        for (const [groupName, paths] of Object.entries(groups)) {
            for (const path of paths) {
                if (this.routes.has(path)) {
                    const route = this.routes.get(path);
                    route.group = groupName;
                }
            }
            this._log(`📁 Group registered: ${groupName} (${paths.length} routes)`);
        }
    }

    // ============================================================
    // HISTORY SETUP
    // ===============================================-============

    setupHistory() {
        if (this.mode === 'history') {
            // Handle popstate
            window.addEventListener('popstate', (event) => {
                const path = window.location.pathname;
                this.handleRouteChange(path, event.state);
            });

            // Handle pushstate
            const originalPushState = window.history.pushState;
            const originalReplaceState = window.history.replaceState;

            window.history.pushState = (...args) => {
                originalPushState.apply(window.history, args);
                this.handleRouteChange(args[2]);
            };

            window.history.replaceState = (...args) => {
                originalReplaceState.apply(window.history, args);
                this.handleRouteChange(args[2]);
            };
        } else {
            // Hash mode
            window.addEventListener('hashchange', () => {
                const path = window.location.hash.slice(1) || '/';
                this.handleRouteChange(path);
            });
        }
    }

    // ============================================================
    // LISTENERS
    // ============================================================

    setupListeners() {
        // Listen for navigation events
        this.eventBus.on(EVENTS.NAVIGATE, (data) => {
            this.navigate(data.path, data.options);
        });

        // Listen for route changes
        this.eventBus.on(EVENTS.ROUTE_CHANGED, (data) => {
            this._log(`🔄 Route changed: ${data.from} → ${data.to}`);
        });

        // Listen for errors
        this.eventBus.on(EVENTS.ROUTE_ERROR, (error) => {
            logger.error('❌ Route error:', error);
        });
    }

    // ============================================================
    // INITIAL ROUTE
    // ============================================================

    handleInitialRoute() {
        let path = this.getCurrentPath();
        
        // Handle empty path
        if (!path || path === '/') {
            path = this.defaultRoute;
        }

        // Handle not found
        if (!this.routes.has(path) && !this.matchRoute(path)) {
            path = this.notFoundRoute;
        }

        // Navigate
        this.navigate(path, { replace: true, silent: true });
    }

    // ============================================================
    // NAVIGATION
    // ============================================================

    /**
     * Navigate to a route
     * @param {string} path - Route path
     * @param {Object} options - Navigation options
     * @returns {Promise<Object>} Navigation result
     */
    async navigate(path, options = {}) {
        if (this.isNavigating) {
            // Queue navigation
            return new Promise((resolve) => {
                this.navigationQueue.push({ path, options, resolve });
            });
        }

        this.isNavigating = true;
        this.abortController = new AbortController();

        const {
            replace = false,
            silent = false,
            data = null,
            query = null,
            preserveScroll = false,
            preserveState = false,
            forceReload = false
        } = options;

        try {
            // Normalize path
            path = this.normalizePath(path);

            // Match route
            const route = this.matchRoute(path);
            if (!route) {
                this._log(`❌ Route not found: ${path}`);
                return this.navigate(this.notFoundRoute, { replace, silent });
            }

            // Check route access
            if (this.enableGuards) {
                const canAccess = await this.checkRouteAccess(route);
                if (!canAccess) {
                    this._log(`⛔ Access denied: ${path}`);
                    return this.navigate(ROUTES.UNAUTHORIZED, { replace, silent });
                }
            }

            // Run before hooks
            if (this.enableBeforeEach) {
                await this.runBeforeHooks(route, this.currentRoute);
            }

            // Run middleware
            if (this.enableMiddleware) {
                route = await this.runMiddlewares(route);
            }

            // Load component
            const component = await this.loadComponent(route);

            // Update state
            const previousRoute = this.currentRoute;
            this.previousRoute = previousRoute;
            this.currentRoute = {
                ...route,
                data: this.extractRouteData(path),
                query: query || this.parseQueryString(window.location.search),
                component
            };

            // Update history
            if (!silent) {
                this.updateHistory(path, replace);
            }

            // Update metadata
            if (this.enableMetaTags) {
                this.updateMetaTags(this.currentRoute);
            }

            // Update breadcrumb
            if (this.enableBreadcrumb) {
                this.updateBreadcrumb(this.currentRoute);
            }

            // Restore scroll
            if (this.enableScrollRestoration && !preserveScroll) {
                this.restoreScroll();
            }

            // Add to history
            if (this.enableHistory) {
                this.addToHistory(this.currentRoute);
            }

            // Cache route
            if (this.enableCaching) {
                this.cacheRoute(this.currentRoute);
            }

            // Run after hooks
            if (this.enableAfterEach) {
                await this.runAfterHooks(this.currentRoute, previousRoute);
            }

            // Emit event
            if (!silent) {
                this.eventBus.emit(EVENTS.ROUTE_CHANGED, {
                    from: previousRoute?.path,
                    to: this.currentRoute.path,
                    data: this.currentRoute.data
                });
            }

            this._log(`✅ Navigated to: ${path}`, {
                from: previousRoute?.path,
                replace,
                silent
            });

            // Process queue
            this.processQueue();

            return this.currentRoute;

        } catch (error) {
            if (this.enableErrorHandler) {
                await this.handleError(error, path);
            }

            logger.error('❌ Navigation error:', { error: error.message, path });
            throw error;

        } finally {
            this.isNavigating = false;
            this.abortController = null;
        }
    }

    /**
     * Replace current route
     */
    replace(path, options = {}) {
        return this.navigate(path, { ...options, replace: true });
    }

    /**
     * Reload current route
     */
    reload() {
        if (this.currentRoute) {
            return this.navigate(this.currentRoute.path, { forceReload: true });
        }
        return this.navigate(this.defaultRoute);
    }

    /**
     * Go back
     */
    back() {
        window.history.back();
    }

    /**
     * Go forward
     */
    forward() {
        window.history.forward();
    }

    /**
     * Go to specific history
     */
    go(delta) {
        window.history.go(delta);
    }

    // ============================================================
    // ROUTE MATCHING
    // ============================================================

    /**
     * Match a route
     */
    matchRoute(path) {
        // Check exact match
        if (this.routes.has(path)) {
            return this.routes.get(path);
        }

        // Check regex match
        for (const [routePath, route] of this.routes) {
            if (route.regex && route.regex.test(path)) {
                return route;
            }
        }

        return null;
    }

    /**
     * Extract route parameters
     */
    extractRouteData(path) {
        const data = {};

        for (const [routePath, route] of this.routes) {
            if (route.regex && route.regex.test(path)) {
                const matches = path.match(route.regex);
                if (matches) {
                    for (const [key, value] of Object.entries(route.params || {})) {
                        data[key] = matches[value.index] || null;
                    }
                }
                break;
            }
        }

        return data;
    }

    /**
     * Extract params from path pattern
     */
    extractParams(path) {
        const params = {};
        const paramRegex = /:(\w+)/g;
        let match;

        while ((match = paramRegex.exec(path)) !== null) {
            params[match[1]] = {
                index: match.index,
                name: match[1]
            };
        }

        return params;
    }

    /**
     * Convert path to regex
     */
    pathToRegex(path) {
        let pattern = path
            .replace(/\/:(\w+)/g, '/([^/]+)')
            .replace(/\*/g, '.*');

        return new RegExp(`^${pattern}$`);
    }

    /**
     * Normalize path
     */
    normalizePath(path) {
        // Remove base path
        if (this.basePath && path.startsWith(this.basePath)) {
            path = path.slice(this.basePath.length);
        }

        // Ensure leading slash
        if (!path.startsWith('/')) {
            path = '/' + path;
        }

        // Remove trailing slash
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }

        return path;
    }

    // ============================================================
    // COMPONENT LOADING
    // ============================================================

    /**
     * Load component for route
     */
    async loadComponent(route) {
        // Check cache
        if (this.enableCaching && this.routeCache.has(route.path)) {
            const cached = this.routeCache.get(route.path);
            if (Date.now() - cached.timestamp < this.cacheTTL) {
                this._log(`📦 Loaded from cache: ${route.path}`);
                return cached.component;
            }
        }

        // Preload if enabled
        if (this.enablePreloading) {
            this.preloadRoutes();
        }

        try {
            // Lazy load component
            if (this.enableLazyLoading && route.component) {
                const component = await route.component();
                this._log(`📥 Lazy loaded: ${route.path}`);
                return component;
            }

            // Use static component
            return route.component || null;

        } catch (error) {
            logger.error('❌ Component loading failed:', { error: error.message, path: route.path });
            throw error;
        }
    }

    /**
     * Preload routes
     */
    preloadRoutes() {
        const currentPath = this.currentRoute?.path || '/';
        const routes = Array.from(this.routes.values());

        for (const route of routes) {
            // Skip if already loaded
            if (this.routeCache.has(route.path)) continue;

            // Check if route is likely to be visited
            if (this.shouldPreload(route, currentPath)) {
                try {
                    this.routeCache.set(route.path, {
                        component: route.component,
                        timestamp: Date.now()
                    });
                    this._log(`🔄 Preloaded: ${route.path}`);
                } catch (error) {
                    // Ignore preload errors
                }
            }
        }
    }

    /**
     * Check if route should be preloaded
     */
    shouldPreload(route, currentPath) {
        // Preload routes with high priority
        const highPriority = [ROUTES.HOME, ROUTES.EXPLORE, ROUTES.SOCIAL_FEED];
        if (highPriority.includes(route.path)) return true;

        // Preload routes in same group
        if (route.group && this.currentRoute?.group === route.group) return true;

        // Preload based on threshold
        return Math.random() < this.preloadThreshold;
    }

    /**
     * Cache route
     */
    cacheRoute(route) {
        if (!this.enableCaching) return;

        this.routeCache.set(route.path, {
            route,
            timestamp: Date.now()
        });

        // Clean old cache
        this.cleanCache();
    }

    /**
     * Clean cache
     */
    cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.routeCache) {
            if (now - value.timestamp > this.cacheTTL) {
                this.routeCache.delete(key);
            }
        }
    }

    // ============================================================
    // ROUTE GUARDS
    // ============================================================

    /**
     * Check route access
     */
    async checkRouteAccess(route) {
        const metadata = route.metadata || {};
        const user = this.eventBus.getState?.('user') || null;

        // Check authentication
        if (metadata.requiresAuth && !user) {
            this._log(`⛔ Requires auth: ${route.path}`);
            return false;
        }

        // Check guest
        if (metadata.requiresGuest && user) {
            this._log(`⛔ Requires guest: ${route.path}`);
            return false;
        }

        // Check admin
        if (metadata.requiresAdmin && !user?.isAdmin) {
            this._log(`⛔ Requires admin: ${route.path}`);
            return false;
        }

        // Check seller
        if (metadata.requiresSeller && !user?.isSeller) {
            this._log(`⛔ Requires seller: ${route.path}`);
            return false;
        }

        // Run custom guards
        for (const guard of this.guards) {
            try {
                const result = await guard(route, this.currentRoute);
                if (result === false) {
                    this._log(`⛔ Guard blocked: ${route.path}`);
                    return false;
                }
                if (typeof result === 'string') {
                    await this.navigate(result, { replace: true });
                    return false;
                }
            } catch (error) {
                logger.error('❌ Guard error:', { error: error.message });
                return false;
            }
        }

        return true;
    }

    /**
     * Add route guard
     */
    addGuard(guard) {
        if (typeof guard !== 'function') {
            throw new Error('Guard must be a function');
        }
        this.guards.push(guard);
        this._log('🛡️ Guard added');
    }

    /**
     * Remove route guard
     */
    removeGuard(guard) {
        const index = this.guards.indexOf(guard);
        if (index > -1) {
            this.guards.splice(index, 1);
            this._log('🛡️ Guard removed');
        }
    }

    // ============================================================
    // MIDDLEWARE
    // ============================================================

    /**
     * Add middleware
     */
    addMiddleware(middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('Middleware must be a function');
        }
        this.middlewares.push(middleware);
        this._log('🔧 Middleware added');
    }

    /**
     * Run middlewares
     */
    async runMiddlewares(route) {
        let result = route;

        for (const middleware of this.middlewares) {
            try {
                const processed = await middleware(route, this.currentRoute);
                if (processed) {
                    result = processed;
                }
            } catch (error) {
                logger.error('❌ Middleware error:', { error: error.message });
            }
        }

        return result;
    }

    // ============================================================
    // HOOKS
    // ============================================================

    /**
     * Add before hook
     */
    beforeEach(hook) {
        if (typeof hook !== 'function') {
            throw new Error('Before hook must be a function');
        }
        this.beforeHooks.push(hook);
        this._log('📌 Before hook added');
    }

    /**
     * Add after hook
     */
    afterEach(hook) {
        if (typeof hook !== 'function') {
            throw new Error('After hook must be a function');
        }
        this.afterHooks.push(hook);
        this._log('📌 After hook added');
    }

    /**
     * Run before hooks
     */
    async runBeforeHooks(route, previousRoute) {
        for (const hook of this.beforeHooks) {
            try {
                const result = await hook(route, previousRoute);
                if (result === false) {
                    throw new Error('Before hook blocked navigation');
                }
                if (typeof result === 'string') {
                    await this.navigate(result, { replace: true });
                    throw new Error('Before hook redirected');
                }
            } catch (error) {
                throw error;
            }
        }
    }

    /**
     * Run after hooks
     */
    async runAfterHooks(route, previousRoute) {
        for (const hook of this.afterHooks) {
            try {
                await hook(route, previousRoute);
            } catch (error) {
                logger.error('❌ After hook error:', { error: error.message });
            }
        }
    }

    // ============================================================
    // ERROR HANDLING
    // ============================================================

    /**
     * Add error handler
     */
    addErrorHandler(handler) {
        if (typeof handler !== 'function') {
            throw new Error('Error handler must be a function');
        }
        this.errorHandlers.push(handler);
        this._log('🧹 Error handler added');
    }

    /**
     * Handle navigation error
     */
    async handleError(error, path) {
        for (const handler of this.errorHandlers) {
            try {
                await handler(error, path);
            } catch (e) {
                // Ignore handler errors
            }
        }

        // Emit error event
        this.eventBus.emit(EVENTS.ROUTE_ERROR, { error, path });
    }

    // ============================================================
    // METADATA
    // ============================================================

    /**
     * Update meta tags
     */
    updateMetaTags(route) {
        const metadata = route.metadata || {};

        // Update title
        if (metadata.title) {
            document.title = metadata.title;
        }

        // Update meta description
        if (metadata.description) {
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.content = metadata.description;
            }
        }

        // Update Open Graph
        if (metadata.og) {
            for (const [key, value] of Object.entries(metadata.og)) {
                const meta = document.querySelector(`meta[property="og:${key}"]`);
                if (meta) {
                    meta.content = value;
                }
            }
        }

        // Update meta tags
        if (metadata.meta) {
            for (const [key, value] of Object.entries(metadata.meta)) {
                const meta = document.querySelector(`meta[name="${key}"]`);
                if (meta) {
                    meta.content = value;
                }
            }
        }
    }

    /**
     * Update breadcrumb
     */
    updateBreadcrumb(route) {
        const breadcrumb = this.generateBreadcrumb(route);
        this.eventBus.emit(EVENTS.BREADCRUMB_UPDATED, breadcrumb);
        return breadcrumb;
    }

    /**
     * Generate breadcrumb
     */
    generateBreadcrumb(route) {
        const breadcrumb = [];

        // Add home
        breadcrumb.push({
            label: 'Home',
            path: ROUTES.HOME,
            icon: 'home'
        });

        // Add route path
        const parts = route.path.split('/').filter(Boolean);
        let currentPath = '';

        for (const part of parts) {
            currentPath += '/' + part;
            const meta = ROUTE_METADATA[currentPath];
            if (meta) {
                breadcrumb.push({
                    label: meta.breadcrumb || part,
                    path: currentPath,
                    icon: meta.icon
                });
            }
        }

        return breadcrumb;
    }

    // ============================================================
    // SCROLL RESTORATION
    // ============================================================

    /**
     * Save scroll position
     */
    saveScroll() {
        if (!this.enableScrollRestoration) return;

        const key = this.currentRoute?.path || '/';
        this.scrollPositions.set(key, {
            x: window.scrollX,
            y: window.scrollY
        });
    }

    /**
     * Restore scroll position
     */
    restoreScroll() {
        if (!this.enableScrollRestoration) return;

        const key = this.currentRoute?.path || '/';
        const position = this.scrollPositions.get(key);

        if (position) {
            window.scrollTo(position.x, position.y);
        } else {
            window.scrollTo(0, 0);
        }
    }

    // ============================================================
    // HISTORY
    // ============================================================

    /**
     * Update history
     */
    updateHistory(path, replace = false) {
        const url = this.getFullUrl(path);

        if (replace) {
            window.history.replaceState({ path }, '', url);
        } else {
            window.history.pushState({ path }, '', url);
        }
    }

    /**
     * Add to history
     */
    addToHistory(route) {
        this.routeHistory.push({
            ...route,
            timestamp: Date.now()
        });

        if (this.routeHistory.length > this.maxHistory) {
            this.routeHistory.shift();
        }
    }

    /**
     * Get full URL
     */
    getFullUrl(path) {
        if (this.mode === 'hash') {
            return `#${path}`;
        }
        return this.basePath + path;
    }

    /**
     * Get current path
     */
    getCurrentPath() {
        if (this.mode === 'hash') {
            return window.location.hash.slice(1) || '/';
        }
        return window.location.pathname || '/';
    }

    /**
     * Parse query string
     */
    parseQueryString(queryString) {
        const params = {};
        const search = queryString.startsWith('?') ? queryString.slice(1) : queryString;

        for (const param of search.split('&')) {
            const [key, value] = param.split('=');
            if (key) {
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
            }
        }

        return params;
    }

    /**
     * Stringify query params
     */
    stringifyQueryParams(params) {
        const parts = [];

        for (const [key, value] of Object.entries(params)) {
            if (value !== null && value !== undefined) {
                parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
            }
        }

        return parts.length ? '?' + parts.join('&') : '';
    }

    /**
     * Build URL with params
     */
    buildUrl(path, params = {}, query = {}) {
        let url = path;

        // Replace params
        for (const [key, value] of Object.entries(params)) {
            url = url.replace(`:${key}`, encodeURIComponent(value));
        }

        // Add query
        const queryString = this.stringifyQueryParams(query);
        if (queryString) {
            url += queryString;
        }

        return url;
    }

    // ============================================================
    // UTILITY METHODS
    // ============================================================

    /**
     * Process navigation queue
     */
    processQueue() {
        if (this.navigationQueue.length === 0) return;

        const next = this.navigationQueue.shift();
        this.navigate(next.path, next.options).then(next.resolve);
    }

    /**
     * Get route by path
     */
    getRoute(path) {
        return this.routes.get(path) || null;
    }

    /**
     * Get all routes
     */
    getAllRoutes() {
        return Array.from(this.routes.values());
    }

    /**
     * Get current route
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * Get route history
     */
    getRouteHistory() {
        return [...this.routeHistory];
    }

    /**
     * Get route metadata
     */
    getRouteMetadata(path) {
        return ROUTE_METADATA[path] || null;
    }

    /**
     * Check if route exists
     */
    routeExists(path) {
        return this.routes.has(path) || this.matchRoute(path) !== null;
    }

    /**
     * Get route group
     */
    getRouteGroup(path) {
        const route = this.routes.get(path);
        return route?.group || null;
    }

    /**
     * Get routes by group
     */
    getRoutesByGroup(group) {
        const routes = [];
        for (const [path, route] of this.routes) {
            if (route.group === group) {
                routes.push({ path, ...route });
            }
        }
        return routes;
    }

    /**
     * Log message
     */
    _log(message, data = {}) {
        if (!this.enableLogging) return;
        logger.debug(`[Router] ${message}`, data);
    }

    /**
     * Get router status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            mode: this.mode,
            basePath: this.basePath,
            defaultRoute: this.defaultRoute,
            notFoundRoute: this.notFoundRoute,
            currentRoute: this.currentRoute?.path,
            previousRoute: this.previousRoute?.path,
            totalRoutes: this.routes.size,
            historySize: this.routeHistory.length,
            cacheSize: this.routeCache.size,
            middlewares: this.middlewares.length,
            guards: this.guards.length,
            beforeHooks: this.beforeHooks.length,
            afterHooks: this.afterHooks.length,
            isNavigating: this.isNavigating,
            queueSize: this.navigationQueue.length,
            scrollPositions: this.scrollPositions.size,
            features: {
                lazyLoading: this.enableLazyLoading,
                preloading: this.enablePreloading,
                caching: this.enableCaching,
                animations: this.enableAnimations,
                scrollRestoration: this.enableScrollRestoration,
                routeParams: this.enableRouteParams,
                queryParams: this.enableQueryParams,
                nestedRoutes: this.enableNestedRoutes,
                routeAliases: this.enableRouteAliases,
                routeGroups: this.enableRouteGroups,
                beforeEach: this.enableBeforeEach,
                afterEach: this.enableAfterEach,
                errorHandler: this.enableErrorHandler,
                breadcrumb: this.enableBreadcrumb,
                metaTags: this.enableMetaTags,
                history: this.enableHistory
            },
            version: ROUTER_CONFIG.version
        };
    }

    /**
     * Reset router
     */
    reset() {
        this.routes.clear();
        this.routeCache.clear();
        this.routeData.clear();
        this.routeComponents.clear();
        this.routeHistory = [];
        this.scrollPositions.clear();
        this.navigationQueue = [];
        this.middlewares = [];
        this.guards = [];
        this.errorHandlers = [];
        this.beforeHooks = [];
        this.afterHooks = [];
        this.currentRoute = null;
        this.previousRoute = null;
        this.isNavigating = false;
        this.isInitialized = false;

        this._log('🔄 Router reset');
    }

    /**
     * Destroy router
     */
    destroy() {
        this.reset();
        window.removeEventListener('popstate', this.handleRouteChange);
        window.removeEventListener('hashchange', this.handleRouteChange);
        this._log('💥 Router destroyed');
    }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

let routerInstance = null;

export function getRouter() {
    if (!routerInstance) {
        routerInstance = new Router();
    }
    return routerInstance;
}

// ============================================================
// EXPORT INSTANCE
// ============================================================

const router = getRouter();

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export const navigate = (path, options = {}) => router.navigate(path, options);
export const replace = (path, options = {}) => router.replace(path, options);
export const reload = () => router.reload();
export const back = () => router.back();
export const forward = () => router.forward();
export const go = (delta) => router.go(delta);
export const getCurrentRoute = () => router.getCurrentRoute();
export const getRouteHistory = () => router.getRouteHistory();
export const getRoute = (path) => router.getRoute(path);
export const getAllRoutes = () => router.getAllRoutes();
export const routeExists = (path) => router.routeExists(path);
export const getRouteGroup = (path) => router.getRouteGroup(path);
export const getRoutesByGroup = (group) => router.getRoutesByGroup(group);
export const getRouteMetadata = (path) => router.getRouteMetadata(path);
export const buildUrl = (path, params = {}, query = {}) => router.buildUrl(path, params, query);
export const addRouteGuard = (guard) => router.addGuard(guard);
export const removeRouteGuard = (guard) => router.removeGuard(guard);
export const addRouteMiddleware = (middleware) => router.addMiddleware(middleware);
export const beforeEach = (hook) => router.beforeEach(hook);
export const afterEach = (hook) => router.afterEach(hook);
export const addErrorHandler = (handler) => router.addErrorHandler(handler);
export const getRouterStatus = () => router.getStatus();
export const resetRouter = () => router.reset();
export const destroyRouter = () => router.destroy();

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default router;

// ============================================================
// END OF FILE: router.js
// ============================================================