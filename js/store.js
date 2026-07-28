// ============================================================
// FILE: js/store.js
// PURPOSE: Central State Management - Single Source of Truth
// DEPENDENCIES: event-bus.js, all models, all services
// USED BY: All screens, widgets, app.js
// VERSION: 4.0.0 - FULLY ADVANCED
// ============================================================
import { analytics } from './config/firebase-config.js';
import { eventBus, EVENTS } from './state/event-bus.js';
import { logger } from './services/logger.js';
import { ErrorHandler } from './services/error-handler.js';
import { DatabaseService } from './services/database-service.js';
import { AuthService } from './services/auth-service.js';
import { AdService } from './services/ad-service.js';
import { NotificationService } from './services/notification-service.js';
import { CacheService } from './services/cache-service.js';
import { AnalyticsService } from './services/analytics-service.js';
import { SocialService } from './services/social-service.js';
import { ChatService } from './services/chat-service.js';
import { AIService } from './services/ai-service.js';
import { FeedService } from './services/feed-service.js';
import { LocationService } from './services/location-service.js';

// ============================================================
// STORE CONFIGURATION
// ============================================================

export const STORE_CONFIG = {
    version: '4.0.0',
    enablePersistence: true,
    enableHistory: true,
    enableTimeTravel: false,
    enableLogger: true,
    enableDevTools: false,
    maxHistory: 50,
    persistenceKey: 'zymore_store',
    persistenceWhitelist: ['auth', 'user', 'preferences', 'settings'],
    persistenceBlacklist: ['loading', 'error', 'pendingActions'],
    autoSaveInterval: 30000,
    enableBatchUpdates: true,
    enableComputedProperties: true,
    enableEffects: true,
    enableMiddleware: true,
    enablePluginSystem: true,
    enableReactiveState: true,
    enableImmutableState: true,
    enableStateValidation: true,
    enableStateTracking: true,
    enableErrorBoundaries: true,
    enableRehydration: true
};

// ============================================================
// STORE CLASS - ADVANCED
// ============================================================

export class Store {
    constructor() {
        // ==========================================
        // SERVICES INITIALIZATION
        // ==========================================
        this.db = new DatabaseService();
        this.auth = new AuthService();
        this.ad = new AdService();
        this.notification = new NotificationService();
        this.cache = new CacheService();
        this.analytics = analytics || { logEvent: () => {}, setUserProperties: () => {} };
        this.social = new SocialService();
        this.chat = new ChatService();
        this.ai = new AIService();
        this.feed = FeedService || { 
            getFeed: () => {}, 
            updateFeed: () => {},
            getTrending: () => {},
            getRecommended: () => {}
        };
        
        this.location = new LocationService();
        this.errorHandler = new ErrorHandler();
        
        // ==========================================
        // EVENT BUS
        // ==========================================
        this.eventBus = eventBus;
        
        // ==========================================
        // STATE
        // ==========================================
        this.state = this.getInitialState();
        
        // ==========================================
        // HISTORY (Undo/Redo)
        // ==========================================
        this.history = [];
        this.historyIndex = -1;
        this.MAX_HISTORY = STORE_CONFIG.maxHistory;
        this.isTrackingHistory = STORE_CONFIG.enableHistory;
        
        // ==========================================
        // SUBSCRIPTIONS
        // ==========================================
        this.subscribers = [];
        this.globalSubscribers = [];
        this.watchers = new Map();
        
        // ==========================================
        // BATCH UPDATES
        // ==========================================
        this.batchUpdates = [];
        this.isBatching = false;
        this.batchLevel = 0;
        
        // ==========================================
        // COMPUTED PROPERTIES
        // ==========================================
        this.computed = new Map();
        this.computedCache = new Map();
        
        // ==========================================
        // EFFECTS
        // ==========================================
        this.effects = [];
        this.effectQueue = [];
        this.isProcessingEffects = false;
        
        // ==========================================
        // MIDDLEWARE
        // ==========================================
        this.middlewares = [];
        this.plugins = [];
        
        // ==========================================
        // PERSISTENCE
        // ==========================================
        this.persistenceKey = STORE_CONFIG.persistenceKey;
        this.persistWhitelist = STORE_CONFIG.persistenceWhitelist;
        this.persistBlacklist = STORE_CONFIG.persistenceBlacklist;
        this.autoSaveInterval = STORE_CONFIG.autoSaveInterval;
        this.autoSaveTimer = null;
        this.isRehydrating = false;
        
        // ==========================================
        // TRACKING
        // ==========================================
        this.changeLog = [];
        this.isTracking = STORE_CONFIG.enableStateTracking;
        this.trackingDepth = 0;
        
        // ==========================================
        // LOADING STATES
        // ==========================================
        this.loading = {
            global: false,
            auth: false,
            products: false,
            categories: false,
            social: false,
            chat: false,
            ai: false,
            notifications: false,
            history: false
        };
        
        // ==========================================
        // ERRORS
        // ==========================================
        this.errors = {
            global: null,
            auth: null,
            products: null,
            categories: null,
            social: null,
            chat: null,
            ai: null,
            notifications: null
        };
        
        // ==========================================
        // STATE FLAGS
        // ==========================================
        this.isInitialized = false;
        this.isReady = false;
        this.isDestroyed = false;
        this.lastUpdate = null;
        this.updateCount = 0;
        
        // ==========================================
        // INIT
        // ==========================================
        this.initialize();
    }

    // ============================================================
    // INITIAL STATE
    // ============================================================

    getInitialState() {
        return {
            // ==========================================
            // AUTH STATE
            // ==========================================
            auth: {
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
                token: null,
                refreshToken: null,
                expiresAt: null,
                sessionId: null,
                lastLogin: null
            },

            // ==========================================
            // USER STATE
            // ==========================================
            user: {
                profile: null,
                settings: {
                    darkMode: false,
                    language: 'en',
                    notifications: true,
                    emailNotifications: true,
                    pushNotifications: true,
                    soundEnabled: true,
                    autoPlay: true,
                    dataSaver: false
                },
                stats: {
                    followers: 0,
                    following: 0,
                    totalPosts: 0,
                    totalProducts: 0,
                    totalSales: 0,
                    totalDownloads: 0,
                    totalLikes: 0,
                    coins: 0,
                    rating: 0,
                    reviews: 0
                },
                interests: [],
                isSeller: false,
                isAdmin: false,
                isVerified: false,
                isBlocked: false,
                lastActive: null
            },

            // ==========================================
            // PRODUCTS STATE
            // ==========================================
            products: {
                items: [],
                featured: [],
                trending: [],
                recent: [],
                byCategory: {},
                bySeller: {},
                currentProduct: null,
                total: 0,
                hasMore: false,
                lastDoc: null,
                isLoading: false,
                error: null,
                filters: {
                    category: null,
                    subCategory: null,
                    tags: [],
                    minPrice: null,
                    maxPrice: null,
                    productType: null,
                    sortBy: 'recent',
                    location: null,
                    radius: null,
                    rating: null,
                    featured: null,
                    trending: null
                },
                search: {
                    query: '',
                    results: [],
                    isLoading: false,
                    hasMore: false,
                    lastDoc: null
                }
            },

            // ==========================================
            // CATEGORIES STATE
            // ==========================================
            categories: {
                items: [],
                flat: [],
                tree: [],
                currentCategory: null,
                isLoading: false,
                error: null,
                byId: {}
            },

            // ==========================================
            // SOCIAL STATE
            // ==========================================
            social: {
                posts: [],
                currentPost: null,
                stories: [],
                currentStory: null,
                feed: [],
                feedAlgorithm: null,
                comments: {},
                reactions: {},
                hasMore: false,
                lastDoc: null,
                isLoading: false,
                error: null,
                filters: {
                    category: null,
                    type: 'all',
                    sortBy: 'recent'
                },
                create: {
                    content: '',
                    media: [],
                    location: null,
                    isPosting: false,
                    progress: 0
                }
            },

            // ==========================================
            // CHAT STATE
            // ==========================================
            chat: {
                conversations: [],
                currentChat: null,
                messages: {},
                unreadCount: 0,
                typingUsers: {},
                onlineUsers: {},
                hasMore: false,
                lastDoc: null,
                isLoading: false,
                error: null,
                filters: {
                    status: 'all'
                },
                search: {
                    query: '',
                    results: []
                }
            },

            // ==========================================
            // AI STATE
            // ==========================================
            ai: {
                session: null,
                messages: [],
                questionCount: 0,
                freeQuestionsLeft: 5,
                adShown: false,
                isLoading: false,
                error: null,
                context: {},
                suggestions: [],
                history: [],
                settings: {
                    model: 'gpt-3.5-turbo',
                    temperature: 0.7,
                    maxTokens: 1000
                }
            },

            // ==========================================
            // NOTIFICATIONS STATE
            // ==========================================
            notifications: {
                items: [],
                unread: 0,
                hasMore: false,
                lastDoc: null,
                isLoading: false,
                error: null,
                filters: {
                    type: 'all'
                }
            },

            // ==========================================
            // HISTORY STATE
            // ==========================================
            history: {
                items: [],
                hasMore: false,
                lastDoc: null,
                isLoading: false,
                error: null,
                filters: {
                    status: 'all',
                    date: 'all'
                }
            },

            // ==========================================
            // DOWNLOADS STATE
            // ==========================================
            downloads: {
                items: [],
                active: [],
                completed: [],
                failed: [],
                progress: {},
                hasMore: false,
                lastDoc: null,
                isLoading: false,
                error: null
            },

            // ==========================================
            // ADS STATE
            // ==========================================
            ads: {
                banner: null,
                rewarded: null,
                interstitial: null,
                native: null,
                watched: [],
                dailyCount: 0,
                lastAdWatch: null,
                coins: 0,
                isLoading: false,
                error: null
            },

            // ==========================================
            // LOCATION STATE
            // ==========================================
            location: {
                current: null,
                nearby: [],
                selected: null,
                isLoading: false,
                error: null,
                permission: null
            },

            // ==========================================
            // REVIEWS STATE
            // ==========================================
            reviews: {
                items: [],
                currentReview: null,
                hasMore: false,
                lastDoc: null,
                isLoading: false,
                error: null
            },

            // ==========================================
            // UI STATE
            // ==========================================
            ui: {
                currentScreen: '/home',
                previousScreen: null,
                sidebarOpen: false,
                modalOpen: false,
                modalData: null,
                toast: null,
                loading: false,
                progress: 0,
                offline: false,
                theme: 'light',
                language: 'en',
                fontSize: 'medium',
                direction: 'ltr'
            },

            // ==========================================
            // APP STATE
            // ==========================================
            app: {
                ready: false,
                initialized: false,
                online: navigator.onLine,
                sessionStart: Date.now(),
                lastSync: null,
                version: STORE_CONFIG.version,
                platform: 'web',
                environment: 'production',
                build: '1.0.0',
                updates: []
            },

            // ==========================================
            // PENDING ACTIONS
            // ==========================================
            pending: {
                actions: [],
                isProcessing: false
            }
        };
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================

    async initialize() {
        if (this.isInitialized) return this;

        try {
            logger.info('🚀 Store initializing...', { version: STORE_CONFIG.version });

            // Set loading state
            this.setLoading('global', true);

            // Register middleware
            if (STORE_CONFIG.enableMiddleware) {
                this.registerDefaultMiddleware();
            }

            // Register computed properties
            if (STORE_CONFIG.enableComputedProperties) {
                this.registerComputedProperties();
            }

            // Register effects
            if (STORE_CONFIG.enableEffects) {
                this.registerDefaultEffects();
            }

            // Setup persistence
            if (STORE_CONFIG.enablePersistence) {
                await this.setupPersistence();
            }

            // Setup listeners
            this.setupEventListeners();

            // Setup network listener
            this.setupNetworkListener();

            // Setup auth listener
            this.setupAuthListener();

            // Load initial data
            await this.loadInitialData();

            // Mark as ready
            this.isInitialized = true;
            this.isReady = true;
            this.setLoading('global', false);
            this.setAppReady(true);

            // Emit ready event
            this.eventBus.emit(EVENTS.APP_READY, { 
                timestamp: Date.now(),
                version: STORE_CONFIG.version
            });

            logger.info('✅ Store initialized successfully');

        } catch (error) {
            logger.error('❌ Store initialization failed:', error);
            this.errors.global = error.message;
            this.setLoading('global', false);
            throw error;
        }

        return this;
    }

    // ============================================================
    // MIDDLEWARE
    // ============================================================

    registerDefaultMiddleware() {
        // Logger middleware
        this.use((state, action) => {
            if (STORE_CONFIG.enableLogger) {
                logger.debug(`📊 Action: ${action.type}`, {
                    payload: action.payload,
                    state: state
                });
            }
            return state;
        });

        // Validation middleware
        this.use((state, action) => {
            if (STORE_CONFIG.enableStateValidation) {
                this.validateState(state);
            }
            return state;
        });

        // Analytics middleware
        this.use((state, action) => {
            if (this.analytics) {
                this.analytics.track('store_action', {
                    action: action.type,
                    timestamp: Date.now()
                });
            }
            return state;
        });

        // Error boundary middleware
        this.use((state, action) => {
            try {
                return state;
            } catch (error) {
                if (STORE_CONFIG.enableErrorBoundaries) {
                    this.errorHandler.handle(error, `Store action: ${action.type}`);
                }
                return state;
            }
        });
    }

    /**
     * Add middleware
     */
    use(middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('Middleware must be a function');
        }
        this.middlewares.push(middleware);
        return this;
    }

    /**
     * Apply middleware
     */
    applyMiddleware(state, action) {
        let result = state;
        for (const middleware of this.middlewares) {
            try {
                result = middleware(result, action) || result;
            } catch (error) {
                this.errorHandler.handle(error, 'Middleware');
            }
        }
        return result;
    }

    // ============================================================
    // COMPUTED PROPERTIES
    // ============================================================

    registerComputedProperties() {
        // Total products count
        this.computed.set('totalProducts', (state) => {
            return state.products.items.length;
        });

        // Unread notifications count
        this.computed.set('unreadNotifications', (state) => {
            return state.notifications.items.filter(n => !n.isRead).length;
        });

        // User is logged in
        this.computed.set('isLoggedIn', (state) => {
            return state.auth.isAuthenticated && state.auth.user !== null;
        });

        // User is seller
        this.computed.set('isSeller', (state) => {
            return state.user.isSeller && state.auth.isAuthenticated;
        });

        // User is admin
        this.computed.set('isAdmin', (state) => {
            return state.user.isAdmin && state.auth.isAuthenticated;
        });

        // Recent products
        this.computed.set('recentProducts', (state) => {
            return state.products.items.slice(0, 10);
        });

        // Trending products
        this.computed.set('trendingProducts', (state) => {
            return state.products.trending || [];
        });

        // Featured products
        this.computed.set('featuredProducts', (state) => {
            return state.products.featured || [];
        });

        // User coins
        this.computed.set('userCoins', (state) => {
            return state.user.stats.coins || 0;
        });

        // Has unread notifications
        this.computed.set('hasUnreadNotifications', (state) => {
            return this.computed.get('unreadNotifications')(state) > 0;
        });

        // Has new messages
        this.computed.set('hasNewMessages', (state) => {
            return state.chat.unreadCount > 0;
        });

        // Total downloads
        this.computed.set('totalDownloads', (state) => {
            return state.downloads.completed.length;
        });

        // App is online
        this.computed.set('isOnline', (state) => {
            return state.app.online;
        });

        // Current theme
        this.computed.set('currentTheme', (state) => {
            return state.ui.theme;
        });

        // Current language
        this.computed.set('currentLanguage', (state) => {
            return state.ui.language;
        });
    }

    /**
     * Get computed property
     */
    getComputed(key) {
        if (this.computed.has(key)) {
            return this.computed.get(key)(this.state);
        }
        return null;
    }

    /**
     * Get all computed properties
     */
    getAllComputed() {
        const result = {};
        for (const [key, fn] of this.computed) {
            result[key] = fn(this.state);
        }
        return result;
    }

    // ============================================================
    // EFFECTS
    // ============================================================

    registerDefaultEffects() {
        // Auto-save effect
        this.effects.push({
            name: 'autoSave',
            dependencies: ['state'],
            handler: (state) => {
                if (STORE_CONFIG.enablePersistence) {
                    this.saveState();
                }
            }
        });

        // Theme effect
        this.effects.push({
            name: 'themeEffect',
            dependencies: ['ui.theme'],
            handler: (state) => {
                const theme = state.ui.theme;
                if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
                document.documentElement.setAttribute('data-theme', theme);
            }
        });

        // Language effect
        this.effects.push({
            name: 'languageEffect',
            dependencies: ['ui.language'],
            handler: (state) => {
                const lang = state.ui.language;
                document.documentElement.lang = lang;
                localStorage.setItem('zymore_language', lang);
            }
        });

        // Offline effect
        this.effects.push({
            name: 'offlineEffect',
            dependencies: ['app.online'],
            handler: (state) => {
                if (!state.app.online) {
                    this.eventBus.emit(EVENTS.NETWORK_OFFLINE);
                } else {
                    this.eventBus.emit(EVENTS.NETWORK_ONLINE);
                }
            }
        });

        // Notification effect
        this.effects.push({
            name: 'notificationEffect',
            dependencies: ['notifications.items'],
            handler: (state) => {
                const unread = state.notifications.items.filter(n => !n.isRead).length;
                if (unread > 0) {
                    this.eventBus.emit(EVENTS.NOTIFICATION_COUNT_UPDATED, { count: unread });
                }
            }
        });

        // Analytics effect
        this.effects.push({
            name: 'analyticsEffect',
            dependencies: ['state'],
            handler: (state) => {
                if (this.analytics && this.updateCount % 10 === 0) {
                    this.analytics.track('store_update', {
                        updateCount: this.updateCount,
                        stateSize: JSON.stringify(state).length
                    });
                }
            }
        });
    }

    /**
     * Process effects
     */
    processEffects(state, changedKeys = null) {
        if (this.isProcessingEffects) return;

        this.isProcessingEffects = true;

        try {
            for (const effect of this.effects) {
                try {
                    // Check if dependencies match
                    if (changedKeys) {
                        const deps = effect.dependencies || [];
                        const shouldRun = deps.some(dep => {
                            return changedKeys.some(key => key.startsWith(dep));
                        });
                        if (!shouldRun && deps.length > 0) {
                            continue;
                        }
                    }
                    effect.handler(state);
                } catch (error) {
                    this.errorHandler.handle(error, `Effect: ${effect.name}`);
                }
            }
        } finally {
            this.isProcessingEffects = false;
        }
    }

    // ============================================================
    // PERSISTENCE
    // ============================================================

    async setupPersistence() {
        try {
            // Try to rehydrate
            await this.rehydrate();

            // Setup auto-save
            if (this.autoSaveInterval > 0) {
                this.autoSaveTimer = setInterval(() => {
                    this.saveState();
                }, this.autoSaveInterval);
            }

            // Save on page unload
            window.addEventListener('beforeunload', () => {
                this.saveState();
            });

            logger.info('💾 Persistence setup complete');

        } catch (error) {
            logger.warn('⚠️ Persistence setup failed:', error);
        }
    }

    /**
     * Save state to persistence
     */
    saveState() {
        try {
            if (this.isRehydrating) return;

            const state = this.getPersistableState();
            const serialized = JSON.stringify(state);
            localStorage.setItem(this.persistenceKey, serialized);

            this.eventBus.emit(EVENTS.STORAGE_CHANGE, { 
                action: 'save',
                timestamp: Date.now()
            });

        } catch (error) {
            this.errorHandler.handle(error, 'Store.saveState');
        }
    }

    /**
     * Rehydrate state from persistence
     */
    async rehydrate() {
        try {
            this.isRehydrating = true;

            const saved = localStorage.getItem(this.persistenceKey);
            if (!saved) {
                this.isRehydrating = false;
                return;
            }

            const parsed = JSON.parse(saved);
            
            // Merge saved state
            this.state = this.mergeState(this.state, parsed);

            this.eventBus.emit(EVENTS.STORAGE_CHANGE, {
                action: 'rehydrate',
                timestamp: Date.now()
            });

            logger.info('💾 State rehydrated successfully');

        } catch (error) {
            this.errorHandler.handle(error, 'Store.rehydrate');
        } finally {
            this.isRehydrating = false;
        }
    }

    /**
     * Get persistable state
     */
    getPersistableState() {
        const state = {};

        for (const [key, value] of Object.entries(this.state)) {
            // Check whitelist
            if (this.persistWhitelist.includes(key)) {
                state[key] = value;
                continue;
            }

            // Check blacklist
            if (this.persistBlacklist.includes(key)) {
                continue;
            }

            // Default: persist if not blacklisted
            if (!this.persistBlacklist.includes(key)) {
                state[key] = value;
            }
        }

        return state;
    }

    /**
     * Merge states
     */
    mergeState(current, saved) {
        const result = { ...current };

        for (const [key, value] of Object.entries(saved)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                result[key] = this.mergeState(result[key] || {}, value);
            } else {
                result[key] = value;
            }
        }

        return result;
    }

    /**
     * Clear persistence
     */
    clearPersistence() {
        localStorage.removeItem(this.persistenceKey);
        this.eventBus.emit(EVENTS.STORAGE_CHANGE, {
            action: 'clear',
            timestamp: Date.now()
        });
        logger.info('💾 Persistence cleared');
    }

    // ============================================================
    // ✅ ADD THIS METHOD (Line 1026 ke paas ya methods block mein)
    // ============================================================
    addProductToState(product) {
        if (!product) return;
        
        // Add to products list
        const currentProducts = Array.isArray(this.state.products) ? this.state.products : [];
        const exists = currentProducts.some(p => p.id === product.id);
        
        if (!exists) {
            this.setState('products', [...currentProducts, product]);
        }
        
        // Also add to user's products if seller
        if (product.sellerId === this.state.user?.uid) {
            const userProducts = this.state.userProducts || [];
            const existsInUser = userProducts.some(p => p.id === product.id);
            if (!existsInUser) {
                this.setState('userProducts', [...userProducts, product]);
            }
        }
    }



       // ============================================================
       // ✅ UPDATE PRODUCT METHOD
       // ============================================================
       updateProductInState(product) {
            if (!product || !product.id) return;
    
            // Update in products list
            const products = Array.isArray(this.state.products) ? this.state.products : [];
            const index = products.findIndex(p => p.id === product.id);
    
            if (index !== -1) {
                products[index] = { ...products[index], ...product };
                this.setState('products', [...products]);
            }
    
            // Update in user products
            const userProducts = Array.isArray(this.state.userProducts) ? this.state.userProducts : [];
            const userIndex = userProducts.findIndex(p => p.id === product.id);
    
            if (userIndex !== -1) {
                userProducts[userIndex] = { ...userProducts[userIndex], ...product };
                this.setState('userProducts', [...userProducts]);
            }
        }



    // ============================================================
    // ✅ ADD THIS METHOD - store.js (Robust Version)
    // ============================================================
    addPostToState(post) {
        if (!post || !post.id) return;
    
        // Convert to string to avoid type mismatch (e.g., number vs string ID)
        const targetId = String(post.id);
    
        const posts = Array.isArray(this.state.posts) ? this.state.posts : [];
        const index = posts.findIndex(p => String(p.id) === targetId);
    
        if (index !== -1) {
            // Agar post pehle se exist karti hai, toh use update kar dein taaki latest data rahe
            posts[index] = { ...posts[index], ...post };
            this.setState('posts', [...posts]);
        } else {
            // Agar nayi post hai, toh top par add karein
            this.setState('posts', [post, ...posts]);
        }
    }


    // ============================================================
    // ✅ ADD THIS METHOD - store.js (Robust Version)
    // ============================================================
    updateFollowState(data) {
        if (!data || !data.followerId || !data.followingId) return;

        const currentUserId = String(this.state.user?.uid || '');
        const targetFollowingId = String(data.followingId);
        const isFollowing = Boolean(data.isFollowing);

        // Agar action current logged-in user se juda hua hai, tabhi 'following' list update karein
        if (String(data.followerId) === currentUserId) {
            const following = Array.isArray(this.state.following) ? this.state.following : [];
            const hasId = following.map(String).includes(targetFollowingId);

            if (isFollowing && !hasId) {
                this.setState('following', [...following, data.followingId]);
            } else if (!isFollowing && hasId) {
                const filteredFollowing = following.filter(id => String(id) !== targetFollowingId);
                this.setState('following', filteredFollowing);
            }
        }

        // Update follower/following counts safely (bina zaroorat ke state change na ho)
        if (data.counts) {
            if (data.counts.followers !== undefined && this.state.followersCount !== data.counts.followers) {
                this.setState('followersCount', Number(data.counts.followers));
            }
            if (data.counts.following !== undefined && this.state.followingCount !== data.counts.following) {
                this.setState('followingCount', Number(data.counts.following));
            }
        }
    }


    // ============================================================
    // ✅ ADD THIS METHOD - store.js (Robust Version)
    // ============================================================
    addChatMessage(data) {
        if (!data) return;
    
        // Ensure unique message ID with string format safety
        const messageId = String(data.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`);
        const chatId = data.chatId ? String(data.chatId) : null;
    
        // Get current chat messages safely
        const messages = Array.isArray(this.state.chatMessages) ? this.state.chatMessages : [];
    
        // Check if message already exists (using strict string comparison)
        const exists = messages.some(m => String(m.id) === messageId);
        if (exists) return; // Agar pehle se hai toh dobara add mat karo
    
        // Construct robust message object
        const newMessage = {
            ...data,
            id: messageId,
            chatId: chatId,
            text: data.text || data.content || '',
            type: data.type || 'text',
            timestamp: data.timestamp || new Date().toISOString(),
            read: Boolean(data.read),
            delivered: Boolean(data.delivered)
        };
    
        // Optional: Agar active chat ID match karti hai ya general chat list hai toh state update karein
        if (!chatId || !this.state.activeChatId || String(this.state.activeChatId) === chatId) {
            this.setState('chatMessages', [...messages, newMessage]);
        }
    }



    // ============================================================
    // ✅ ADD THIS METHOD - store.js (Robust Version)
    // ============================================================
    addNotification(notification) {
        if (!notification) return;
    
        // Ensure unique notification ID with type safety
        const notificationId = String(notification.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`);
    
        // Get current notifications safely
        const notifications = Array.isArray(this.state.notifications) ? this.state.notifications : [];
    
        // Check if notification already exists using strict string comparison
        const exists = notifications.some(n => String(n.id) === notificationId);
        if (exists) return; // Agar pehle se maujood hai toh dobara add mat karo
    
        // Construct robust notification object
        const newNotification = {
            ...notification,
            id: notificationId,
            timestamp: notification.timestamp || new Date().toISOString(),
            read: Boolean(notification.read) // Ensure boolean type
        };
    
        // Add to the beginning of the list
        const updatedNotifications = [newNotification, ...notifications];
        this.setState('notifications', updatedNotifications);
    
        // Recalculate unread count accurately based on unread items in the array
        const unreadCount = updatedNotifications.filter(n => !n.read).length;
        this.setState('unreadCount', unreadCount);
    }
 


    // ============================================================
    // ✅ ADD THIS METHOD - store.js (Robust Version)
    // ============================================================
    removeProductFromState(productId) {
        if (!productId) return;
    
        // Convert to string to avoid type mismatch issues (e.g., number vs string ID)
        const targetId = String(productId);
    
        // 1. Remove from products list efficiently
        const products = Array.isArray(this.state.products) ? this.state.products : [];
        const filtered = products.filter(p => String(p.id) !== targetId);
    
        // Only update state if something was actually removed
        if (filtered.length !== products.length) {
            this.setState('products', filtered);
        }
    
        // 2. Remove from user products
        const userProducts = Array.isArray(this.state.userProducts) ? this.state.userProducts : [];
        const filteredUser = userProducts.filter(p => String(p.id) !== targetId);
    
        // Only update state if something was actually removed
        if (filteredUser.length !== userProducts.length) {
            this.setState('userProducts', filteredUser);
        }
    }

    // ============================================================
    // EVENT LISTENERS
    // ============================================================

    setupEventListeners() {
        // Listen for navigation
        this.eventBus.on(EVENTS.NAVIGATE, (data) => {
            this.setCurrentScreen(data.path);
        });

        // Listen for network changes
        this.eventBus.on(EVENTS.NETWORK_CHANGE, (data) => {
            this.setState('app.online', data.online);
        });

        // Listen for auth changes
        this.eventBus.on(EVENTS.AUTH_LOGIN, (user) => {
            this.handleAuthLogin(user);
        });

        this.eventBus.on(EVENTS.AUTH_LOGOUT, () => {
            this.handleAuthLogout();
        });

        // Listen for product events
        this.eventBus.on(EVENTS.PRODUCT_CREATED, (product) => {
            this.addProductToState(product);
        });

        this.eventBus.on(EVENTS.PRODUCT_UPDATED, (product) => {
            this.updateProductInState(product);
        });

        this.eventBus.on(EVENTS.PRODUCT_DELETED, (productId) => {
            this.removeProductFromState(productId);
        });

        // Listen for social events
        this.eventBus.on(EVENTS.POST_CREATED, (post) => {
            this.addPostToState(post);
        });

        this.eventBus.on(EVENTS.FOLLOW_ADDED, (data) => {
            this.updateFollowState(data);
        });

        this.eventBus.on(EVENTS.FOLLOW_REMOVED, (data) => {
            this.updateFollowState(data);
        });

        // Listen for chat events
        this.eventBus.on(EVENTS.CHAT_MESSAGE, (data) => {
            this.addChatMessage(data);
        });

        // Listen for notification events
        this.eventBus.on(EVENTS.NOTIFICATION_RECEIVED, (notification) => {
            this.addNotification(notification);
        });
    }

    // ============================================================
    // NETWORK LISTENER
    // ============================================================

    setupNetworkListener() {
        window.addEventListener('online', () => {
            this.setState('app.online', true);
            this.eventBus.emit(EVENTS.NETWORK_ONLINE);
            logger.info('🌐 Network online');
        });

        window.addEventListener('offline', () => {
            this.setState('app.online', false);
            this.eventBus.emit(EVENTS.NETWORK_OFFLINE);
            logger.warn('🌐 Network offline');
        });
    }

    // ============================================================
    // AUTH LISTENER
    // ============================================================

    setupAuthListener() {
        this.auth.onAuthChange(async (user) => {
            if (user) {
                await this.handleAuthLogin(user);
            } else {
                this.handleAuthLogout();
            }
        });
    }

    // ============================================================
    // AUTH HANDLERS
    // ============================================================

    async handleAuthLogin(user) {
        try {
            this.setLoading('auth', true);
            this.setState('auth.user', user);
            this.setState('auth.isAuthenticated', true);
            this.setState('auth.lastLogin', Date.now());

            // Load user data
            await this.loadUserData(user.uid);

            // Emit event
            this.eventBus.emit(EVENTS.USER_LOADED, user);

            logger.info('🔐 User logged in', { uid: user.uid });

        } catch (error) {
            this.errorHandler.handle(error, 'Store.handleAuthLogin');
        } finally {
            this.setLoading('auth', false);
        }
    }

    handleAuthLogout() {
        this.setState('auth.user', null);
        this.setState('auth.isAuthenticated', false);
        this.setState('auth.token', null);
        this.resetUserData();
        this.eventBus.emit(EVENTS.USER_LOGOUT);
        logger.info('🔐 User logged out');
    }

    // ============================================================
    // STORE.JS - Add this method
    // ============================================================

    resetUserData() {
        // Reset all user-related state
        this.setState('user', null);
        this.setState('isAuthenticated', false);
        this.setState('userProfile', null);
        this.setState('userStats', null);
        this.setState('userProducts', []);
        this.setState('userLikes', []);
        this.setState('userDownloads', []);
    
        // Clear localStorage
        localStorage.removeItem('zymore_user');
        localStorage.removeItem('zymore_token');
        localStorage.removeItem('zymore_session');
    
        console.log('🔄 User data reset complete');
    }

    // ============================================================
    // DATA LOADING
    // ============================================================

    async loadInitialData() {
        try {
            // Load categories
            await this.loadCategories();

            // Load products
            await this.loadProducts({});

            // Load social feed
            await this.loadSocialFeed();

            // Load notifications
            if (this.state.auth.isAuthenticated) {
                await this.loadNotifications();
            }

            // Load dark mode preference
            const darkMode = localStorage.getItem('zymore_dark_mode') === 'true';
            this.setState('ui.theme', darkMode ? 'dark' : 'light');

            // Load language preference
            const language = localStorage.getItem('zymore_language') || 'en';
            this.setState('ui.language', language);

            this.eventBus.emit(EVENTS.DATA_LOADED, {
                timestamp: Date.now()
            });

        } catch (error) {
            this.errorHandler.handle(error, 'Store.loadInitialData');
            throw error;
        }
    }

    /**
     * Load categories
     */
    async loadCategories() {
        try {
            this.setLoading('categories', true);
            const categories = await this.db.getCategories({ activeOnly: true });
            this.setState('categories.items', categories);
            this.eventBus.emit(EVENTS.CATEGORIES_LOADED, categories);
            return categories;
        } catch (error) {
            this.errors.categories = error.message;
            this.errorHandler.handle(error, 'Store.loadCategories');
            return [];
        } finally {
            this.setLoading('categories', false);
        }
    }

    /**
     * Load products
     */
    async loadProducts(filters = {}, append = false) {
        try {
            this.setLoading('products', true);
            this.setState('products.isLoading', true);

            const result = await this.db.getProducts(filters);

            if (append) {
                this.setState('products.items', [...this.state.products.items, ...result.items]);
            } else {
                this.setState('products.items', result.items);
            }

            this.setState('products.total', result.total);
            this.setState('products.hasMore', result.hasMore);
            this.setState('products.lastDoc', result.lastDoc);
            this.setState('products.isLoading', false);

            this.eventBus.emit(EVENTS.PRODUCTS_LOADED, result);

            return result;

        } catch (error) {
            this.errors.products = error.message;
            this.setState('products.isLoading', false);
            this.errorHandler.handle(error, 'Store.loadProducts');
            throw error;
        } finally {
            this.setLoading('products', false);
        }
    }

    /**
     * Load social feed
     */
    async loadSocialFeed() {
        try {
            this.setLoading('social', true);
            const feed = await this.feed.getFeed(this.state.auth.user?.uid);
            this.setState('social.feed', feed);
            this.eventBus.emit(EVENTS.FEED_LOADED, feed);
            return feed;
        } catch (error) {
            this.errors.social = error.message;
            this.errorHandler.handle(error, 'Store.loadSocialFeed');
            return [];
        } finally {
            this.setLoading('social', false);
        }
    }

    /**
     * Load user data
     */
    async loadUserData(userId) {
        try {
            const userData = await this.db.getUser(userId);
            if (userData) {
                this.setState('user.profile', userData);
                this.setState('user.stats', userData.stats || {});
                this.setState('user.interests', userData.interests || []);
                this.setState('user.isSeller', userData.isSeller || false);
                this.setState('user.isAdmin', userData.isAdmin || false);
                this.setState('user.isVerified', userData.isVerified || false);
                this.setState('user.settings', userData.settings || {});
            }
        } catch (error) {
            this.errorHandler.handle(error, 'Store.loadUserData');
        }
    }

    /**
     * Load notifications
     */
    async loadNotifications() {
        try {
            this.setLoading('notifications', true);
            const notifications = await this.db.getNotifications(this.state.auth.user.uid);
            this.setState('notifications.items', notifications);
            this.setState('notifications.unread', notifications.filter(n => !n.isRead).length);
            this.eventBus.emit(EVENTS.NOTIFICATIONS_LOADED, notifications);
            return notifications;
        } catch (error) {
            this.errors.notifications = error.message;
            this.errorHandler.handle(error, 'Store.loadNotifications');
            return [];
        } finally {
            this.setLoading('notifications', false);
        }
    }

    // ============================================================
    // STATE MANAGEMENT - ADVANCED
    // ============================================================

    /**
     * Set state with advanced options
     */
    setState(key, value, options = {}) {
        if (this.isDestroyed) {
            throw new Error('Store is destroyed');
        }

        const {
            silent = false,
            batch = false,
            track = true,
            validate = true,
            persist = true,
            history = true
        } = options;

        // Handle batch updates
        if (batch || this.isBatching) {
            this.batchUpdates.push({ key, value, options });
            return;
        }

        // Handle object keys
        if (typeof key === 'object') {
            const entries = Object.entries(key);
            for (const [k, v] of entries) {
                this._setState(k, v, { ...options, silent: true, track: false });
            }
            this._finalizeUpdate(entries.map(e => e[0]), silent, track, persist, history);
            return;
        }

        // Set single key
        this._setState(key, value, options);
        this._finalizeUpdate([key], silent, track, persist, history);
    }

    /**
     * Internal set state
     */
    _setState(key, value, options) {
        const parts = key.split('.');
        let current = this.state;

        // Navigate to nested object
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part]) {
                current[part] = {};
            }
            current = current[part];
        }

        const lastKey = parts[parts.length - 1];
        current[lastKey] = value;
    }

    /**
     * Finalize update
     */
    _finalizeUpdate(keys, silent, track, persist, history) {
        // Track changes
        if (track && this.isTracking) {
            this.trackChanges(keys);
        }

        // Update history
        if (history && this.isTrackingHistory) {
            this.addToHistory(keys);
        }

        // Notify subscribers
        if (!silent) {
            this.notifySubscribers(keys);
        }

        // Process effects
        if (STORE_CONFIG.enableEffects) {
            this.processEffects(this.state, keys);
        }

        // Save to persistence
        if (persist && STORE_CONFIG.enablePersistence) {
            this.saveState();
        }

        // Update counters
        this.updateCount++;
        this.lastUpdate = Date.now();
    }

    /**
     * Batch update
     */
    batch(updates, options = {}) {
        this.isBatching = true;
        this.batchLevel++;

        try {
            for (const update of updates) {
                this.setState(update.key, update.value, { 
                    ...options, 
                    batch: true, 
                    silent: true,
                    track: false 
                });
            }
        } finally {
            this.batchLevel--;
            if (this.batchLevel === 0) {
                this.isBatching = false;
                this.flushBatch(options);
            }
        }
    }

    /**
     * Flush batch updates
     */
    flushBatch(options = {}) {
        if (this.batchUpdates.length === 0) return;

        const keys = this.batchUpdates.map(u => u.key);
        this.batchUpdates = [];

        // Notify once
        this.notifySubscribers(keys);

        // Process effects
        if (STORE_CONFIG.enableEffects) {
            this.processEffects(this.state, keys);
        }

        // Save to persistence
        if (options.persist !== false && STORE_CONFIG.enablePersistence) {
            this.saveState();
        }

        this.updateCount++;
        this.lastUpdate = Date.now();
    }

    /**
     * Get state
     */
    getState(key = null) {
        if (!key) return { ...this.state };

        const parts = key.split('.');
        let current = this.state;

        for (const part of parts) {
            if (current && typeof current === 'object') {
                current = current[part];
            } else {
                return undefined;
            }
        }

        return current;
    }

    /**
     * Get entire state snapshot
     */
    getSnapshot() {
        return {
            state: { ...this.state },
            computed: this.getAllComputed(),
            timestamp: Date.now(),
            updateCount: this.updateCount
        };
    }

    /**
     * Track changes
     */
    trackChanges(keys) {
        this.changeLog.push({
            keys,
            timestamp: Date.now(),
            depth: ++this.trackingDepth
        });

        // Limit change log
        if (this.changeLog.length > 1000) {
            this.changeLog.shift();
        }
    }

    /**
     * Get change log
     */
    getChangeLog(limit = 100) {
        return this.changeLog.slice(-limit);
    }

    // ============================================================
    // SUBSCRIPTIONS
    // ============================================================

    /**
     * Subscribe to state changes
     */
    subscribe(callback, keys = null, options = {}) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }

        const subscriber = {
            id: this.generateId('sub'),
            callback,
            keys: keys ? new Set(keys) : null,
            once: options.once || false,
            filter: options.filter || null,
            context: options.context || null,
            createdAt: Date.now()
        };

        this.subscribers.push(subscriber);

        // Return unsubscribe
        return () => {
            const index = this.subscribers.indexOf(subscriber);
            if (index > -1) {
                this.subscribers.splice(index, 1);
            }
        };
    }

    /**
     * Subscribe once
     */
    subscribeOnce(callback, keys = null, options = {}) {
        return this.subscribe(callback, keys, { ...options, once: true });
    }

    /**
     * Watch a specific state path
     */
    watch(path, callback, options = {}) {
        if (!this.watchers.has(path)) {
            this.watchers.set(path, []);
        }

        const watcher = {
            callback,
            id: this.generateId('watch'),
            once: options.once || false,
            debounce: options.debounce || 0,
            throttle: options.throttle || 0,
            lastCall: 0,
            timeout: null
        };

        this.watchers.get(path).push(watcher);

        return () => {
            const watchers = this.watchers.get(path);
            if (watchers) {
                const index = watchers.indexOf(watcher);
                if (index > -1) {
                    watchers.splice(index, 1);
                }
            }
        };
    }

    /**
     * Notify subscribers
     */
    notifySubscribers(keys) {
        const state = this.state;

        for (const subscriber of this.subscribers) {
            // Check if subscriber cares about these keys
            if (subscriber.keys) {
                const matching = keys.some(key => {
                    for (const subKey of subscriber.keys) {
                        if (key.startsWith(subKey)) return true;
                    }
                    return false;
                });
                if (!matching) continue;
            }

            // Check filter
            if (subscriber.filter) {
                try {
                    const result = subscriber.filter(state);
                    if (!result) continue;
                } catch (error) {
                    continue;
                }
            }

            // Check once
            if (subscriber.once) {
                const index = this.subscribers.indexOf(subscriber);
                if (index > -1) {
                    this.subscribers.splice(index, 1);
                }
            }

            // Call callback
            try {
                subscriber.callback.call(
                    subscriber.context || null,
                    state,
                    keys
                );
            } catch (error) {
                this.errorHandler.handle(error, 'Store.notifySubscribers');
            }
        }

        // Notify watchers
        for (const key of keys) {
            if (this.watchers.has(key)) {
                const watchers = this.watchers.get(key);
                const value = this.getState(key);

                for (const watcher of watchers) {
                    // Throttle
                    if (watcher.throttle) {
                        const now = Date.now();
                        if (now - watcher.lastCall < watcher.throttle) {
                            continue;
                        }
                        watcher.lastCall = now;
                    }

                    // Debounce
                    if (watcher.debounce) {
                        if (watcher.timeout) {
                            clearTimeout(watcher.timeout);
                        }
                        watcher.timeout = setTimeout(() => {
                            watcher.callback(value, key);
                            if (watcher.once) {
                                const index = watchers.indexOf(watcher);
                                if (index > -1) {
                                    watchers.splice(index, 1);
                                }
                            }
                        }, watcher.debounce);
                        continue;
                    }

                    // Call
                    watcher.callback(value, key);

                    // Once
                    if (watcher.once) {
                        const index = watchers.indexOf(watcher);
                        if (index > -1) {
                            watchers.splice(index, 1);
                        }
                    }
                }
            }
        }
    }

    // ============================================================
    // HISTORY (Undo/Redo)
    // ============================================================

    /**
     * Add to history
     */
    addToHistory(keys) {
        if (!this.isTrackingHistory) return;

        // Remove future history if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        // Add current state
        this.history.push({
            state: JSON.parse(JSON.stringify(this.state)),
            keys,
            timestamp: Date.now()
        });

        // Limit history
        if (this.history.length > this.MAX_HISTORY) {
            this.history.shift();
        }

        this.historyIndex = this.history.length - 1;
    }

    /**
     * Undo last action
     */
    undo() {
        if (this.historyIndex <= 0) return false;

        this.historyIndex--;
        const historyItem = this.history[this.historyIndex];
        this.restoreState(historyItem.state);
        this.eventBus.emit(EVENTS.STORE_UNDO, { 
            index: this.historyIndex,
            timestamp: Date.now()
        });

        return true;
    }

    /**
     * Redo last undone action
     */
    redo() {
        if (this.historyIndex >= this.history.length - 1) return false;

        this.historyIndex++;
        const historyItem = this.history[this.historyIndex];
        this.restoreState(historyItem.state);
        this.eventBus.emit(EVENTS.STORE_REDO, {
            index: this.historyIndex,
            timestamp: Date.now()
        });

        return true;
    }

    /**
     * Restore state
     */
    restoreState(state) {
        // Deep merge state
        this.state = this.mergeState(this.state, state);
        
        // Notify subscribers
        this.notifySubscribers(Object.keys(state));

        // Save to persistence
        if (STORE_CONFIG.enablePersistence) {
            this.saveState();
        }

        // Process effects
        if (STORE_CONFIG.enableEffects) {
            this.processEffects(this.state, Object.keys(state));
        }

        this.updateCount++;
        this.lastUpdate = Date.now();
    }


    /**
     * Clear history
     */
    clearHistory() {
        this.history = [];
        this.historyIndex = -1;
        this.eventBus.emit(EVENTS.STORE_HISTORY_CLEARED);
        logger.info('📜 History cleared');
    }

    // ============================================================
    // LOADING STATES
    // ============================================================

    /**
     * Set loading state
     */
    setLoading(key, value) {
        if (key === 'global') {
            this.loading.global = value;
            this.setState('ui.loading', value);
            this.eventBus.emit(
                value ? EVENTS.LOADING_START : EVENTS.LOADING_END,
                { key }
            );
        } else if (this.loading.hasOwnProperty(key)) {
            this.loading[key] = value;
            this.setState(`products.isLoading`, value);
        } else {
            this.loading[key] = value;
        }
    }

    /**
     * Get loading state
     */
    isLoading(key = 'global') {
        if (key === 'global') {
            return this.loading.global;
        }
        return this.loading[key] || false;
    }

    /**
     * Get any loading
     */
    isAnyLoading() {
        return Object.values(this.loading).some(v => v === true);
    }

    // ============================================================
    // ERROR HANDLING
    // ============================================================

    /**
     * Set error
     */
    setError(key, error) {
        if (key === 'global') {
            this.errors.global = error;
            this.setState('ui.error', error);
        } else if (this.errors.hasOwnProperty(key)) {
            this.errors[key] = error;
        } else {
            this.errors[key] = error;
        }

        this.eventBus.emit(EVENTS.STORE_ERROR, { key, error });
    }

    /**
     * Get error
     */
    getError(key = 'global') {
        if (key === 'global') {
            return this.errors.global;
        }
        return this.errors[key] || null;
    }

    /**
     * Clear error
     */
    clearError(key = null) {
        if (key) {
            this.setError(key, null);
        } else {
            for (const k of Object.keys(this.errors)) {
                this.errors[k] = null;
            }
            this.setState('ui.error', null);
        }
        this.eventBus.emit(EVENTS.STORE_ERROR_CLEARED, { key });
    }

    // ============================================================
    // UI STATE
    // ============================================================

    /**
     * Set current screen
     */
    setCurrentScreen(screen) {
        this.setState('ui.previousScreen', this.state.ui.currentScreen);
        this.setState('ui.currentScreen', screen);
        this.eventBus.emit(EVENTS.SCREEN_CHANGED, {
            from: this.state.ui.previousScreen,
            to: screen
        });
    }

    /**
     * Toggle sidebar
     */
    toggleSidebar() {
        this.setState('ui.sidebarOpen', !this.state.ui.sidebarOpen);
    }

    /**
     * Show modal
     */
    showModal(modalData) {
        this.setState('ui.modalOpen', true);
        this.setState('ui.modalData', modalData);
        this.eventBus.emit(EVENTS.MODAL_OPEN, modalData);
    }

    /**
     * Hide modal
     */
    hideModal() {
        this.setState('ui.modalOpen', false);
        this.setState('ui.modalData', null);
        this.eventBus.emit(EVENTS.MODAL_CLOSE);
    }

    /**
     * Show toast
     */
    showToast(message, type = 'info', duration = 3000) {
        this.setState('ui.toast', { message, type, duration });
        this.eventBus.emit(EVENTS.TOAST_SHOW, { message, type, duration });

        // Auto-hide
        setTimeout(() => {
            this.setState('ui.toast', null);
        }, duration);
    }

    /**
     * Set theme
     */
    setTheme(theme) {
        if (!['light', 'dark', 'system'].includes(theme)) {
            throw new Error('Invalid theme');
        }
        this.setState('ui.theme', theme);
        localStorage.setItem('zymore_dark_mode', theme === 'dark' ? 'true' : 'false');
        this.eventBus.emit(EVENTS.THEME_CHANGED, { theme });
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        const current = this.state.ui.theme;
        const next = current === 'light' ? 'dark' : 'light';
        this.setTheme(next);
    }

    // ============================================================
    // APP STATE
    // ============================================================

    /**
     * Set app ready
     */
    setAppReady(ready) {
        this.setState('app.ready', ready);
        if (ready) {
            this.eventBus.emit(EVENTS.APP_READY);
        }
    }

    /**
     * Set app offline
     */
    setOffline(offline) {
        this.setState('app.online', !offline);
        if (offline) {
            this.eventBus.emit(EVENTS.NETWORK_OFFLINE);
        } else {
            this.eventBus.emit(EVENTS.NETWORK_ONLINE);
        }
    }

    /**
     * Set app version
     */
    setVersion(version) {
        this.setState('app.version', version);
    }

    // ============================================================
    // UTILITY METHODS
    // ============================================================

    /**
     * Generate ID
     */
    generateId(prefix = 'store') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }

    /**
     * Reset store
     */
    reset() {
        this.state = this.getInitialState();
        this.history = [];
        this.historyIndex = -1;
        this.batchUpdates = [];
        this.subscribers = [];
        this.watchers.clear();
        this.changeLog = [];
        this.updateCount = 0;
        this.lastUpdate = null;

        this.eventBus.emit(EVENTS.STORE_RESET);
        logger.info('🔄 Store reset');
    }

    /**
     * Destroy store
     */
    destroy() {
        if (this.isDestroyed) return;

        // Clear auto-save timer
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }

        // Save final state
        this.saveState();

        // Clear all
        this.reset();
        this.isDestroyed = true;
        this.isInitialized = false;
        this.isReady = false;

        this.eventBus.emit(EVENTS.STORE_DESTROYED);
        logger.info('💥 Store destroyed');
    }

    /**
     * Get store status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            ready: this.isReady,
            destroyed: this.isDestroyed,
            updateCount: this.updateCount,
            lastUpdate: this.lastUpdate,
            subscriberCount: this.subscribers.length,
            watcherCount: this.watchers.size,
            historySize: this.history.length,
            batchLevel: this.batchLevel,
            isBatching: this.isBatching,
            loading: { ...this.loading },
            errors: { ...this.errors },
            config: { ...STORE_CONFIG },
            computed: Object.fromEntries(this.computed.keys()),
            effects: this.effects.length,
            middlewares: this.middlewares.length
        };
    }

    /**
     * Get debug info
     */
    getDebugInfo() {
        return {
            stateKeys: Object.keys(this.state),
            stateSize: JSON.stringify(this.state).length,
            subscriberCount: this.subscribers.length,
            watcherCount: this.watchers.size,
            historySize: this.history.length,
            changeLogSize: this.changeLog.length,
            updateCount: this.updateCount,
            isReady: this.isReady,
            isInitialized: this.isInitialized,
            isDestroyed: this.isDestroyed,
            version: STORE_CONFIG.version,
            timestamp: Date.now()
        };
    }

    /**
     * Validate state
     */
    validateState(state) {
        // Check for required keys
        const requiredKeys = ['auth', 'user', 'products', 'categories', 'social', 'chat', 'ai', 'notifications', 'ui', 'app'];
        for (const key of requiredKeys) {
            if (!state.hasOwnProperty(key)) {
                throw new Error(`Missing required state key: ${key}`);
            }
        }

        // Check auth state
        if (state.auth.isAuthenticated && !state.auth.user) {
            throw new Error('Auth inconsistent: isAuthenticated but user is null');
        }

        // Check user state
        if (state.user.profile && !state.auth.isAuthenticated) {
            throw new Error('User state inconsistent: profile exists but not authenticated');
        }

        return true;
    }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

let storeInstance = null;

export function getStore() {
    if (!storeInstance) {
        storeInstance = new Store();
    }
    return storeInstance;
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

const store = getStore();

// Export convenience functions
export const getState = store.getState.bind(store);
export const setState = store.setState.bind(store);
export const batch = store.batch.bind(store);
export const subscribe = store.subscribe.bind(store);
export const subscribeOnce = store.subscribeOnce.bind(store);
export const watch = store.watch.bind(store);
export const undo = store.undo.bind(store);
export const redo = store.redo.bind(store);
export const clearHistory = store.clearHistory.bind(store);
export const getStatus = store.getStatus.bind(store);
export const getDebugInfo = store.getDebugInfo.bind(store);
export const reset = store.reset.bind(store);
export const destroy = store.destroy.bind(store);

// Export actions
export const loadCategories = store.loadCategories.bind(store);
export const loadProducts = store.loadProducts.bind(store);
export const loadSocialFeed = store.loadSocialFeed.bind(store);
export const loadNotifications = store.loadNotifications.bind(store);
export const setTheme = store.setTheme.bind(store);
export const toggleTheme = store.toggleTheme.bind(store);
export const setCurrentScreen = store.setCurrentScreen.bind(store);
export const showToast = store.showToast.bind(store);
export const showModal = store.showModal.bind(store);
export const hideModal = store.hideModal.bind(store);
export const toggleSidebar = store.toggleSidebar.bind(store);
export const setLoading = store.setLoading.bind(store);
export const setError = store.setError.bind(store);
export const clearError = store.clearError.bind(store);

export { store };
export default store;

// ============================================================
// END OF FILE: store.js
// ============================================================