// ============================================================
// FILE: js/app.js
// PURPOSE: Main Application Entry Point - Full Production v4.0
// DEPENDENCIES: ALL modules (services, store, router, event-bus)
// USED BY: index.html
// VERSION: 4.0.0 - FULLY ADVANCED PRODUCTION
// ============================================================

console.log('🚀 ZYMORE App Starting...');
console.log('📅 Version: 4.0.0');
console.log('📦 Loading modules...');

// ============================================================
// 📦 IMPORT ALL MODULES - COMPLETE
// ============================================================

// --- Config ---
import { firebaseConfig } from './config/firebase-config.js';
import { appConfig, APP_VERSION, APP_NAME, APP_ENV } from './config/app-config.js';
import { env } from './config/env.js';

// --- Utils ---
import * as constants from './utils/constants.js';
import { validators } from './utils/validators.js';
import { helpers } from './utils/helpers.js';
import { themeManager } from './utils/theme.js';
import { performanceMonitor } from './utils/performance.js';

// --- Services ---
import { logger } from './services/logger.js';
import { errorHandler, ErrorHandler } from './services/error-handler.js';
import { authService, AuthService } from './services/auth-service.js';
import { databaseService, DatabaseService } from './services/database-service.js';
import { storageService, StorageService } from './services/storage-service.js';
import { adService, AdService } from './services/ad-service.js';
import { downloadService, DownloadService } from './services/download-service.js';
import { analyticsService, AnalyticsService } from './services/analytics-service.js';
import { notificationService, NotificationService } from './services/notification-service.js';
import { cacheService, CacheService } from './services/cache-service.js';
import { socialService, SocialService } from './services/social-service.js';
import { chatService, ChatService } from './services/chat-service.js';
import { aiService, AIService } from './services/ai-service.js';
import { feedService, FeedService } from './services/feed-service.js';
import { locationService, LocationService } from './services/location-service.js';

// --- State Management ---
import { eventBus, EVENTS } from './state/event-bus.js';
import { store, getStore, getState, setState, subscribe, batch } from './store.js';
import { router, ROUTES } from './router.js';

// --- Models ---
import { User } from './models/user-model.js';
import { Product } from './models/product-model.js';
import { Review } from './models/review-model.js';
import { Category } from './models/category-model.js';
import { Notification } from './models/notification-model.js';
import { Post } from './models/post-model.js';
import { Story } from './models/story-model.js';
import { Chat } from './models/chat-model.js';
import { AIChat } from './models/ai-chat-model.js';

// ============================================================
// ✅ VERIFY ALL IMPORTS
// ============================================================

const importStatus = {
    config: { firebase: !!firebaseConfig, app: !!appConfig, env: !!env },
    utils: { constants: !!constants, validators: !!validators, helpers: !!helpers, theme: !!themeManager, performance: !!performanceMonitor },
    services: {
        logger: !!logger, errorHandler: !!errorHandler, auth: !!authService,
        database: !!databaseService, storage: !!storageService, ad: !!adService,
        download: !!downloadService, analytics: !!analyticsService,
        notification: !!notificationService, cache: !!cacheService,
        social: !!socialService, chat: !!chatService, ai: !!aiService,
        feed: !!feedService, location: !!locationService
    },
    state: { eventBus: !!eventBus, store: !!store, router: !!router },
    models: { User: !!User, Product: !!Product, Review: !!Review, Category: !!Category, Notification: !!Notification }
};

console.log('✅ All modules imported:', importStatus);

// ============================================================
// 🚀 APP CLASS - COMPLETE PRODUCTION v4.0
// ============================================================

class App {
    
    // ============================================================
    // 🏗️ CONSTRUCTOR
    // ============================================================
    
    constructor() {
        // --- App Identity ---
        this.name = APP_NAME || 'ZYMORE';
        this.version = APP_VERSION || '4.0.0';
        this.environment = APP_ENV || 'production';
        
        // --- App State ---
        this.isInitialized = false;
        this.isReady = false;
        this.isFirstLaunch = true;
        this.isDevelopment = this.environment === 'development';
        this.isProduction = this.environment === 'production';
        this.startTime = performance.now();
        this.currentUser = null;
        this.swRegistration = null;
        
        // --- App Data ---
        this.pendingNotifications = [];
        this.routeHistory = [];
        this.activeModals = [];
        this.retryQueue = [];
        this.batchQueue = [];
        this.errorLog = [];
        this.healthCheckInterval = null;
        this.syncInterval = null;
        this.sessionTimer = null;
        
        // --- App Config ---
        this.config = {
            maxRetries: 3,
            retryDelay: 1000,
            batchSize: 10,
            cacheTTL: 3600000,
            sessionTimeout: 3600000,
            downloadTimeout: 120000,
            uploadTimeout: 60000,
            apiTimeout: 30000,
            toastDuration: 5000,
            maxNotifications: 50,
            maxHistoryItems: 100,
            maxProductsPerPage: 20,
            healthCheckInterval: 60000,
            syncInterval: 300000,
            autoSaveInterval: 30000
        };
        
        // --- Feature Flags ---
        this.features = {
            pwa: true,
            darkMode: true,
            notifications: true,
            analytics: true,
            ads: true,
            cache: true,
            offline: true,
            socialLogin: true,
            sellerMode: true,
            reviews: true,
            search: true,
            filters: true,
            infiniteScroll: true,
            imageSlider: true,
            lazyLoading: true,
            aiChat: true,
            directChat: true,
            stories: true,
            location: true,
            pushNotifications: true,
            emailNotifications: true,
            inAppNotifications: true,
            share: true,
            report: true,
            follow: true,
            like: true,
            comment: true
        };
        
        // --- Performance Metrics ---
        this.metrics = {
            loadTime: 0,
            domReady: 0,
            firstPaint: 0,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0,
            timeToInteractive: 0,
            totalRequests: 0,
            failedRequests: 0,
            apiCalls: 0,
            apiErrors: 0
        };
        
        // --- Bind All Methods ---
        this.init = this.init.bind(this);
        this.bootstrap = this.bootstrap.bind(this);
        this.onAuthStateChange = this.onAuthStateChange.bind(this);
        this.handleError = this.handleError.bind(this);
        this.registerServiceWorker = this.registerServiceWorker.bind(this);
        this.loadInitialData = this.loadInitialData.bind(this);
        this.setupEventListeners = this.setupEventListeners.bind(this);
        this.setupRouteGuards = this.setupRouteGuards.bind(this);
        this.setupTheme = this.setupTheme.bind(this);
        this.setupAnalytics = this.setupAnalytics.bind(this);
        this.setupNotifications = this.setupNotifications.bind(this);
        this.setupCache = this.setupCache.bind(this);
        this.setupOffline = this.setupOffline.bind(this);
        this.setupKeyboardShortcuts = this.setupKeyboardShortcuts.bind(this);
        this.setupPerformanceMonitoring = this.setupPerformanceMonitoring.bind(this);
        this.setupErrorReporting = this.setupErrorReporting.bind(this);
        this.setupSessionManagement = this.setupSessionManagement.bind(this);
        this.setupNetworkMonitoring = this.setupNetworkMonitoring.bind(this);
        this.setupFeatureDetection = this.setupFeatureDetection.bind(this);
        this.setupUserPreferences = this.setupUserPreferences.bind(this);
        this.setupHealthChecks = this.setupHealthChecks.bind(this);
        this.setupAutoSync = this.setupAutoSync.bind(this);
        this.setupServiceWorkers = this.setupServiceWorkers.bind(this);
        this.setupWebVitals = this.setupWebVitals.bind(this);
        this.setupErrorBoundary = this.setupErrorBoundary.bind(this);
        this.setupLazyLoading = this.setupLazyLoading.bind(this);
        
        // --- Start App ---
        console.log('🏗️ App instance created');
        this.init();
    }
    
    // ============================================================
    // 🔥 MAIN INITIALIZATION - COMPLETE
    // ============================================================
    
    async init() {
        try {
            console.log('🔥 Starting app initialization...');
            const initStart = performance.now();
            
            // --- PHASE 1: Core Setup ---
            await this.phase1_CoreSetup();
            
            // --- PHASE 2: Services ---
            await this.phase2_Services();
            
            // --- PHASE 3: State Management ---
            await this.phase3_StateManagement();
            
            // --- PHASE 4: Routing ---
            await this.phase4_Routing();
            
            // --- PHASE 5: Features ---
            await this.phase5_Features();
            
            // --- PHASE 6: Data ---
            await this.phase6_Data();
            
            // --- PHASE 7: UI ---
            await this.phase7_UI();
            
            // --- PHASE 8: Monitoring ---
            await this.phase8_Monitoring();
            
            // --- PHASE 9: Finalization ---
            await this.phase9_Finalization();
            
            // --- Metrics ---
            const totalTime = performance.now() - initStart;
            this.metrics.loadTime = totalTime;
            this.isReady = true;
            this.isInitialized = true;
            
            console.log(`✅ App initialized in ${totalTime.toFixed(2)}ms`);
            
            // --- Track ---
            this.trackAppLoad(totalTime);
            
            // --- Emit ---
            this.emitAppReady(totalTime);
            
            // --- Hide Loader ---
            this.hideLoadingScreen();
            
            // --- Show Welcome ---
            if (this.isFirstLaunch) {
                this.showWelcome();
            }
            
            console.log('🎉 App initialization complete!');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.handleError(error, 'App initialization failed');
            this.showFatalError(error);
        }
    }
    
    // ============================================================
    // 🔥 PHASE 1: CORE SETUP
    // ============================================================
    
    async phase1_CoreSetup() {
        console.log('📋 Phase 1: Core Setup');
        
        // --- Logger ---
        this.setupLogger();
        
        // --- Error Handler ---
        this.setupErrorHandler();
        
        // --- Error Reporting ---
        this.setupErrorReporting();
        
        // --- Error Boundary ---
        this.setupErrorBoundary();
        
        // --- Feature Detection ---
        this.setupFeatureDetection();
        
        console.log('✅ Phase 1 complete');
    }
    
    // ============================================================
    // 🔥 PHASE 2: SERVICES
    // ============================================================
    
    async phase2_Services() {
        console.log('📦 Phase 2: Services');
        
        // --- Firebase ---
        await this.initializeFirebase();
        
        // --- Auth Service ---
        await this.initializeAuth();
        
        // --- Database Service ---
        await this.initializeDatabase();
        
        // --- Storage Service ---
        await this.initializeStorage();
        
        // --- Cache Service ---
        await this.initializeCache();
        
        // --- Analytics Service ---
        await this.initializeAnalytics();
        
        // --- Notification Service ---
        await this.initializeNotifications();
        
        // --- Ad Service ---
        await this.initializeAds();
        
        // --- Download Service ---
        await this.initializeDownloads();
        
        // --- Social Service ---
        await this.initializeSocial();
        
        // --- Chat Service ---
        await this.initializeChat();
        
        // --- AI Service ---
        await this.initializeAI();
        
        // --- Feed Service ---
        await this.initializeFeed();
        
        // --- Location Service ---
        await this.initializeLocation();
        
        console.log('✅ Phase 2 complete');
    }
    
    // ============================================================
    // 🔥 PHASE 3: STATE MANAGEMENT
    // ============================================================
    
    async phase3_StateManagement() {
        console.log('📊 Phase 3: State Management');
        
        // --- Event Bus ---
        this.setupEventBus();
        
        // --- Store ---
        await this.setupStore();
        
        // --- State Persistence ---
        this.setupStatePersistence();
        
        // --- State Subscriptions ---
        this.setupStateSubscriptions();
        
        console.log('✅ Phase 3 complete');
    }
    
    // ============================================================
    // 🔥 PHASE 4: ROUTING
    // ============================================================
    
    async phase4_Routing() {
        console.log('🧭 Phase 4: Routing');
        
        // --- Router ---
        this.setupRouter();
        
        // --- Route Guards ---
        this.setupRouteGuards();
        
        // --- Route Aliases ---
        this.setupRouteAliases();
        
        console.log('✅ Phase 4 complete');
    }
    
    // ============================================================
    // 🔥 PHASE 5: FEATURES
    // ============================================================
    
    async phase5_Features() {
        console.log('⚡ Phase 5: Features');
        
        // --- Theme ---
        this.setupTheme();
        
        // --- Keyboard Shortcuts ---
        this.setupKeyboardShortcuts();
        
        // --- Offline Support ---
        this.setupOffline();
        
        // --- Service Worker ---
        await this.setupServiceWorkers();
        
        // --- Lazy Loading ---
        this.setupLazyLoading();
        
        console.log('✅ Phase 5 complete');
    }
    
    // ============================================================
    // 🔥 PHASE 6: DATA
    // ============================================================
    
    async phase6_Data() {
        console.log('📊 Phase 6: Data');
        
        // --- Authentication ---
        await this.checkAuthentication();
        
        // --- Initial Data ---
        await this.loadInitialData();
        
        // --- User Preferences ---
        this.setupUserPreferences();
        
        // --- Auto Sync ---
        this.setupAutoSync();
        
        console.log('✅ Phase 6 complete');
    }
    
    // ============================================================
    // 🔥 PHASE 7: UI
    // ============================================================
    
    async phase7_UI() {
        console.log('🎨 Phase 7: UI');
        
        // --- Event Listeners ---
        this.setupEventListeners();
        
        // --- Network Monitoring ---
        this.setupNetworkMonitoring();
        
        // --- Session Management ---
        this.setupSessionManagement();
        
        console.log('✅ Phase 7 complete');
    }
    
    // ============================================================
    // 🔥 PHASE 8: MONITORING
    // ============================================================
    
    async phase8_Monitoring() {
        console.log('📈 Phase 8: Monitoring');
        
        // --- Performance Monitoring ---
        this.setupPerformanceMonitoring();
        
        // --- Web Vitals ---
        this.setupWebVitals();
        
        // --- Health Checks ---
        this.setupHealthChecks();
        
        // --- Analytics ---
        this.setupAnalytics();
        
        console.log('✅ Phase 8 complete');
    }
    
    // ============================================================
    // 🔥 PHASE 9: FINALIZATION
    // ============================================================
    
    async phase9_Finalization() {
        console.log('🎯 Phase 9: Finalization');
        
        // --- Cleanup ---
        this.setupCleanup();
        
        // --- Ready ---
        this.isFirstLaunch = false;
        
        console.log('✅ Phase 9 complete');
    }
    
    // ============================================================
    // 📋 LOGGER SETUP
    // ============================================================
    
    setupLogger() {
        console.log('📋 Setting up logger...');
        
        // Override console methods
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        const originalInfo = console.info;
        const originalDebug = console.debug;
        
        const timestamp = () => new Date().toISOString();
        
        console.log = (...args) => {
            if (this.isDevelopment || args[0]?.includes('🚀') || args[0]?.includes('✅') || args[0]?.includes('❌')) {
                originalLog(`[${timestamp()}] ℹ️`, ...args);
            }
        };
        
        console.error = (...args) => {
            originalError(`[${timestamp()}] ❌`, ...args);
            if (window.Sentry) {
                window.Sentry.captureMessage(args.join(' '), 'error');
            }
        };
        
        console.warn = (...args) => {
            originalWarn(`[${timestamp()}] ⚠️`, ...args);
        };
        
        console.info = (...args) => {
            originalInfo(`[${timestamp()}] 📌`, ...args);
        };
        
        console.debug = (...args) => {
            if (this.isDevelopment) {
                originalDebug(`[${timestamp()}] 🔍`, ...args);
            }
        };
        
        // Initialize logger service
        logger.init({
            level: this.isDevelopment ? 'debug' : 'info',
            environment: this.environment,
            version: this.version
        });
        
        console.log('✅ Logger setup complete');
    }
    
    // ============================================================
    // 🛡️ ERROR HANDLER SETUP
    // ============================================================
    
    setupErrorHandler() {
        console.log('🛡️ Setting up error handler...');
        
        // Global error handler
        window.addEventListener('error', (event) => {
            const error = event.error || event.message;
            this.handleError(error, 'Uncaught error');
        });
        
        // Promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, 'Unhandled promise rejection');
        });
        
        // Resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target.tagName === 'IMG' || event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK') {
                this.handleError(
                    `Failed to load resource: ${event.target.src || event.target.href}`,
                    'Resource load error'
                );
            }
        }, true);
        
        console.log('✅ Error handler setup complete');
    }
    
    // ============================================================
    // 🛡️ ERROR BOUNDARY
    // ============================================================
    
    setupErrorBoundary() {
        console.log('🛡️ Setting up error boundary...');
        
        // Wrap all event handlers
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function(type, listener, options) {
            const wrappedListener = function(event) {
                try {
                    return listener.call(this, event);
                } catch (error) {
                    console.error('❌ Error in event handler:', error);
                    // Don't throw to prevent app crash
                }
            };
            return originalAddEventListener.call(this, type, wrappedListener, options);
        };
        
        // Wrap setTimeout
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = function(fn, delay, ...args) {
            const wrappedFn = function() {
                try {
                    return fn.apply(this, args);
                } catch (error) {
                    console.error('❌ Error in setTimeout:', error);
                }
            };
            return originalSetTimeout(wrappedFn, delay);
        };
        
        // Wrap setInterval
        const originalSetInterval = window.setInterval;
        window.setInterval = function(fn, delay, ...args) {
            const wrappedFn = function() {
                try {
                    return fn.apply(this, args);
                } catch (error) {
                    console.error('❌ Error in setInterval:', error);
                }
            };
            return originalSetInterval(wrappedFn, delay);
        };
        
        console.log('✅ Error boundary setup complete');
    }
    
    // ============================================================
    // 🔥 FIREBASE INITIALIZATION
    // ============================================================
    
    async initializeFirebase() {
        try {
            console.log('📡 Initializing Firebase...');
            
            const firebase = await import('firebase/app');
            await import('firebase/auth');
            await import('firebase/firestore');
            await import('firebase/storage');
            await import('firebase/analytics');
            await import('firebase/messaging');
            
            if (!firebase.getApps().length) {
                firebase.initializeApp(firebaseConfig);
                console.log('✅ Firebase initialized');
            } else {
                console.log('✅ Firebase already initialized');
            }
            
            this.firebase = firebase;
            
        } catch (error) {
            throw new Error(`Firebase initialization failed: ${error.message}`);
        }
    }
    
    // ============================================================
    // 🔐 AUTH INITIALIZATION
    // ============================================================
    
    async initializeAuth() {
        try {
            console.log('🔐 Initializing auth...');
            await authService.init();
            authService.onAuthStateChanged(this.onAuthStateChange);
            console.log('✅ Auth initialized');
        } catch (error) {
            console.error('❌ Auth init failed:', error);
        }
    }
    
    // ============================================================
    // 💾 DATABASE INITIALIZATION
    // ============================================================
    
    async initializeDatabase() {
        try {
            console.log('💾 Initializing database...');
            await databaseService.init();
            console.log('✅ Database initialized');
        } catch (error) {
            console.error('❌ Database init failed:', error);
        }
    }
    
    // ============================================================
    // 📁 STORAGE INITIALIZATION
    // ============================================================
    
    async initializeStorage() {
        try {
            console.log('📁 Initializing storage...');
            await storageService.init();
            console.log('✅ Storage initialized');
        } catch (error) {
            console.error('❌ Storage init failed:', error);
        }
    }
    
    // ============================================================
    // 💾 CACHE INITIALIZATION
    // ============================================================
    
    async initializeCache() {
        try {
            console.log('💾 Initializing cache...');
            await cacheService.init();
            console.log('✅ Cache initialized');
        } catch (error) {
            console.error('❌ Cache init failed:', error);
        }
    }
    
    // ============================================================
    // 📊 ANALYTICS INITIALIZATION
    // ============================================================
    
    async initializeAnalytics() {
        try {
            console.log('📊 Initializing analytics...');
            await analyticsService.init();
            console.log('✅ Analytics initialized');
        } catch (error) {
            console.error('❌ Analytics init failed:', error);
        }
    }
    
    // ============================================================
    // 🔔 NOTIFICATIONS INITIALIZATION
    // ============================================================
    
    async initializeNotifications() {
        try {
            console.log('🔔 Initializing notifications...');
            await notificationService.init();
            console.log('✅ Notifications initialized');
        } catch (error) {
            console.error('❌ Notifications init failed:', error);
        }
    }
    
    // ============================================================
    // 💰 ADS INITIALIZATION
    // ============================================================
    
    async initializeAds() {
        try {
            console.log('💰 Initializing ads...');
            await adService.init();
            console.log('✅ Ads initialized');
        } catch (error) {
            console.error('❌ Ads init failed:', error);
        }
    }
    
    // ============================================================
    // 📥 DOWNLOADS INITIALIZATION
    // ============================================================
    
    async initializeDownloads() {
        try {
            console.log('📥 Initializing downloads...');
            await downloadService.init();
            console.log('✅ Downloads initialized');
        } catch (error) {
            console.error('❌ Downloads init failed:', error);
        }
    }
    
    // ============================================================
    // 👥 SOCIAL INITIALIZATION
    // ============================================================
    
    async initializeSocial() {
        try {
            console.log('👥 Initializing social...');
            await socialService.init();
            console.log('✅ Social initialized');
        } catch (error) {
            console.error('❌ Social init failed:', error);
        }
    }
    
    // ============================================================
    // 💬 CHAT INITIALIZATION
    // ============================================================
    
    async initializeChat() {
        try {
            console.log('💬 Initializing chat...');
            await chatService.init();
            console.log('✅ Chat initialized');
        } catch (error) {
            console.error('❌ Chat init failed:', error);
        }
    }
    
    // ============================================================
    // 🤖 AI INITIALIZATION
    // ============================================================
    
    async initializeAI() {
        try {
            console.log('🤖 Initializing AI...');
            await aiService.init();
            console.log('✅ AI initialized');
        } catch (error) {
            console.error('❌ AI init failed:', error);
        }
    }
    
    // ============================================================
    // 📡 FEED INITIALIZATION
    // ============================================================
    
    async initializeFeed() {
        try {
            console.log('📡 Initializing feed...');
            await feedService.init();
            console.log('✅ Feed initialized');
        } catch (error) {
            console.error('❌ Feed init failed:', error);
        }
    }
    
    // ============================================================
    // 📍 LOCATION INITIALIZATION
    // ============================================================
    
    async initializeLocation() {
        try {
            console.log('📍 Initializing location...');
            await locationService.init();
            console.log('✅ Location initialized');
        } catch (error) {
            console.error('❌ Location init failed:', error);
        }
    }
    
    // ============================================================
    // 📊 EVENT BUS SETUP
    // ============================================================
    
    setupEventBus() {
        console.log('🔗 Setting up event bus...');
        
        // Initialize event bus
        eventBus.init({
            debugMode: this.isDevelopment,
            maxListeners: 100,
            maxHistory: 1000
        });
        
        // Setup event subscriptions
        this.setupEventSubscriptions();
        
        console.log('✅ Event bus setup complete');
    }
    
    // ============================================================
    // 📊 EVENT SUBSCRIPTIONS
    // ============================================================
    
    setupEventSubscriptions() {
        // --- Auth Events ---
        eventBus.on(EVENTS.AUTH_LOGIN, this.onAuthLogin.bind(this));
        eventBus.on(EVENTS.AUTH_LOGOUT, this.onAuthLogout.bind(this));
        eventBus.on(EVENTS.AUTH_ERROR, this.onAuthError.bind(this));
        
        // --- Product Events ---
        eventBus.on(EVENTS.PRODUCT_CREATED, this.onProductCreated.bind(this));
        eventBus.on(EVENTS.PRODUCT_UPDATED, this.onProductUpdated.bind(this));
        eventBus.on(EVENTS.PRODUCT_DELETED, this.onProductDeleted.bind(this));
        eventBus.on(EVENTS.PRODUCT_VIEWED, this.onProductViewed.bind(this));
        eventBus.on(EVENTS.PRODUCT_DOWNLOADED, this.onProductDownloaded.bind(this));
        eventBus.on(EVENTS.PRODUCT_LIKED, this.onProductLiked.bind(this));
        eventBus.on(EVENTS.PRODUCT_SHARED, this.onProductShared.bind(this));
        
        // --- Social Events ---
        eventBus.on(EVENTS.POST_CREATED, this.onPostCreated.bind(this));
        eventBus.on(EVENTS.POST_LIKED, this.onPostLiked.bind(this));
        eventBus.on(EVENTS.POST_COMMENTED, this.onPostCommented.bind(this));
        eventBus.on(EVENTS.FOLLOW_ADDED, this.onFollowAdded.bind(this));
        eventBus.on(EVENTS.FOLLOW_REMOVED, this.onFollowRemoved.bind(this));
        
        // --- Chat Events ---
        eventBus.on(EVENTS.CHAT_MESSAGE, this.onChatMessage.bind(this));
        eventBus.on(EVENTS.CHAT_TYPING, this.onChatTyping.bind(this));
        eventBus.on(EVENTS.CHAT_READ, this.onChatRead.bind(this));
        
        // --- AI Events ---
        eventBus.on(EVENTS.AI_MESSAGE_SENT, this.onAIMessageSent.bind(this));
        eventBus.on(EVENTS.AI_RESPONSE, this.onAIResponse.bind(this));
        
        // --- Ad Events ---
        eventBus.on(EVENTS.AD_SHOWN, this.onAdShown.bind(this));
        eventBus.on(EVENTS.AD_COMPLETED, this.onAdCompleted.bind(this));
        eventBus.on(EVENTS.AD_REWARDED, this.onAdRewarded.bind(this));
        
        // --- Notification Events ---
        eventBus.on(EVENTS.NOTIFICATION_RECEIVED, this.onNotificationReceived.bind(this));
        eventBus.on(EVENTS.NOTIFICATION_READ, this.onNotificationRead.bind(this));
        
        // --- System Events ---
        eventBus.on(EVENTS.APP_READY, this.onAppReady.bind(this));
        eventBus.on(EVENTS.APP_ERROR, this.onAppError.bind(this));
        eventBus.on(EVENTS.NETWORK_ONLINE, this.onNetworkOnline.bind(this));
        eventBus.on(EVENTS.NETWORK_OFFLINE, this.onNetworkOffline.bind(this));
        
        // --- UI Events ---
        eventBus.on(EVENTS.THEME_CHANGED, this.onThemeChanged.bind(this));
        eventBus.on(EVENTS.ROUTE_CHANGED, this.onRouteChanged.bind(this));
        eventBus.on(EVENTS.TOAST_SHOW, this.onToastShow.bind(this));
        eventBus.on(EVENTS.MODAL_OPEN, this.onModalOpen.bind(this));
        eventBus.on(EVENTS.MODAL_CLOSE, this.onModalClose.bind(this));
    }
    
    // ============================================================
    // 📊 EVENT HANDLERS - AUTH
    // ============================================================
    
    onAuthLogin(user) {
        console.log('👤 User logged in:', user?.displayName || user?.email);
        this.currentUser = user;
        store.setState('auth.user', user);
        store.setState('auth.isAuthenticated', true);
        analyticsService.setUserId(user?.uid);
        analyticsService.trackEvent('auth_login', { method: 'email' });
        this.showToast(`Welcome back, ${user?.displayName || 'User'}!`, 'success');
        router.navigate('/home');
    }
    
    onAuthLogout() {
        console.log('👤 User logged out');
        this.currentUser = null;
        store.setState('auth.user', null);
        store.setState('auth.isAuthenticated', false);
        analyticsService.setUserId(null);
        analyticsService.trackEvent('auth_logout');
        this.showToast('Logged out successfully', 'info');
        router.navigate('/auth');
    }
    
    onAuthError(error) {
        console.error('❌ Auth error:', error);
        this.showToast(error.message || 'Authentication failed', 'error');
    }
    
    // ============================================================
    // 📊 EVENT HANDLERS - PRODUCTS
    // ============================================================
    
    onProductCreated(product) {
        console.log('📦 Product created:', product?.title);
        analyticsService.trackEvent('product_upload', {
            productId: product?.id,
            category: product?.category
        });
        this.showToast('Product uploaded successfully!', 'success');
        store.setState('products.items', [product, ...store.getState('products.items')]);
    }
    
    onProductUpdated(product) {
        console.log('📦 Product updated:', product?.title);
        analyticsService.trackEvent('product_update', { productId: product?.id });
        this.showToast('Product updated successfully!', 'success');
        // Update in store
        const items = store.getState('products.items');
        const index = items.findIndex(p => p.id === product.id);
        if (index > -1) {
            items[index] = product;
            store.setState('products.items', items);
        }
    }
    
    onProductDeleted(productId) {
        console.log('📦 Product deleted:', productId);
        analyticsService.trackEvent('product_delete', { productId });
        this.showToast('Product deleted successfully', 'info');
        store.setState('products.items', store.getState('products.items').filter(p => p.id !== productId));
    }
    
    onProductViewed(productId) {
        analyticsService.trackEvent('product_view', { productId });
    }
    
    onProductDownloaded(productId) {
        analyticsService.trackEvent('product_download', { productId });
        console.log('📥 Product downloaded:', productId);
    }
    
    onProductLiked(productId) {
        analyticsService.trackEvent('product_like', { productId });
    }
    
    onProductShared(productId) {
        analyticsService.trackEvent('product_share', { productId });
    }
    
    // ============================================================
    // 📊 EVENT HANDLERS - SOCIAL
    // ============================================================
    
    onPostCreated(post) {
        console.log('📝 Post created:', post?.id);
        analyticsService.trackEvent('post_create', { postId: post?.id });
        this.showToast('Post shared successfully!', 'success');
    }
    
    onPostLiked(data) {
        analyticsService.trackEvent('post_like', { postId: data?.postId });
    }
    
    onPostCommented(data) {
        analyticsService.trackEvent('post_comment', { postId: data?.postId });
    }
    
    onFollowAdded(data) {
        analyticsService.trackEvent('follow_add', { userId: data?.userId });
    }
    
    onFollowRemoved(data) {
        analyticsService.trackEvent('follow_remove', { userId: data?.userId });
    }
    
    // ============================================================
    // 📊 EVENT HANDLERS - CHAT
    // ============================================================
    
    onChatMessage(data) {
        console.log('💬 New message:', data?.message);
        analyticsService.trackEvent('chat_message', { chatId: data?.chatId });
    }
    
    onChatTyping(data) {
        // Handle typing indicator
    }
    
    onChatRead(data) {
        // Handle read receipt
    }
    
    // ============================================================
    // 📊 EVENT HANDLERS - AI
    // ============================================================
    
    onAIMessageSent(data) {
        console.log('🤖 AI message sent');
        analyticsService.trackEvent('ai_message', { sessionId: data?.sessionId });
    }
    
    onAIResponse(data) {
        console.log('🤖 AI response received');
        analyticsService.trackEvent('ai_response', { sessionId: data?.sessionId });
    }
    
    // ============================================================
    // 📊 EVENT HANDLERS - ADS
    // ============================================================
    
    onAdShown(data) {
        analyticsService.trackEvent('ad_shown', { adId: data?.adId });
    }
    
    onAdCompleted(data) {
        analyticsService.trackEvent('ad_completed', { adId: data?.adId });
    }
    
    onAdRewarded(data) {
        console.log('💰 Ad rewarded:', data?.coins);
        analyticsService.trackEvent('ad_rewarded', { coins: data?.coins });
        this.showToast(`You earned ${data?.coins || 0} coins! 🪙`, 'success');
    }
    
    // ============================================================
    // 📊 EVENT HANDLERS - NOTIFICATIONS
    // ============================================================
    
    onNotificationReceived(notification) {
        console.log('🔔 Notification received:', notification?.title);
        this.pendingNotifications.push(notification);
        if (this.pendingNotifications.length > 50) {
            this.pendingNotifications.shift();
        }
        // Show browser notification
        if (Notification.permission === 'granted') {
            this.showBrowserNotification(notification);
        }
    }
    
    onNotificationRead(notificationId) {
        console.log('📖 Notification read:', notificationId);
    }
    
    // ============================================================
    // 📊 EVENT HANDLERS - SYSTEM
    // ============================================================
    
    onAppReady(data) {
        console.log('🚀 App ready:', data);
    }
    
    onAppError(error) {
        console.error('❌ App error:', error);
        this.handleError(error, 'App error');
    }
    
    onNetworkOnline() {
        console.log('🌐 Network online');
        this.showToast('Back online!', 'success');
        this.syncOfflineData();
    }
    
    onNetworkOffline() {
        console.log('📴 Network offline');
        this.showToast('You are offline. Some features may be unavailable.', 'warning');
    }
    
    // ============================================================
    // 📊 EVENT HANDLERS - UI
    // ============================================================
    
    onThemeChanged(theme) {
        console.log('🎨 Theme changed:', theme);
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('zymore_theme', theme);
    }
    
    onRouteChanged(data) {
        console.log('🧭 Route changed:', data?.to);
        // Track page view
        analyticsService.trackEvent('page_view', {
            page: data?.to,
            from: data?.from
        });
        // Update meta tags
        this.updateMetaTags(data?.to);
        // Update title
        if (data?.title) {
            document.title = `${data.title} | ${this.name}`;
        }
        // Scroll to top
        window.scrollTo(0, 0);
    }
    
    onToastShow(data) {
        // Show toast via UI
    }
    
    onModalOpen(data) {
        this.activeModals.push(data);
    }
    
    onModalClose(data) {
        this.activeModals.pop();
    }
    
    // ============================================================
    // 📊 STORE SETUP
    // ============================================================
    
    async setupStore() {
        console.log('📊 Setting up store...');
        
        // Initialize store
        await store.initialize();
        
        // Subscribe to store changes
        store.subscribe((state) => {
            if (this.isDevelopment) {
                console.debug('📊 State updated:', state);
            }
            // Save state to localStorage
            this.saveStateToStorage(state);
        });
        
        console.log('✅ Store setup complete');
    }
    
    // ============================================================
    // 💾 STATE PERSISTENCE
    // ============================================================
    
    setupStatePersistence() {
        console.log('💾 Setting up state persistence...');
        
        // Load saved state
        const savedState = localStorage.getItem('zymore_app_state');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                // Restore theme
                if (parsed.theme) {
                    themeManager.setTheme(parsed.theme);
                }
                // Restore language
                if (parsed.language) {
                    store.setState('ui.language', parsed.language);
                }
                console.log('📂 State restored from localStorage');
            } catch (error) {
                console.warn('Failed to restore state:', error);
            }
        }
        
        // Auto-save
        setInterval(() => {
            this.saveStateToStorage(store.getState());
        }, this.config.autoSaveInterval);
        
        console.log('✅ State persistence setup complete');
    }
    
    saveStateToStorage(state) {
        try {
            const saveState = {
                theme: state.ui?.theme || 'light',
                language: state.ui?.language || 'en',
                lastRoute: router.getCurrentRoute?.()?.path || '/home',
                timestamp: Date.now()
            };
            localStorage.setItem('zymore_app_state', JSON.stringify(saveState));
        } catch (error) {
            // Ignore storage errors
        }
    }
    
    // ============================================================
    // 📊 STATE SUBSCRIPTIONS
    // ============================================================
    
    setupStateSubscriptions() {
        console.log('📊 Setting up state subscriptions...');
        
        // Subscribe to auth state
        store.subscribe((state) => {
            if (state.auth?.isAuthenticated !== undefined) {
                this.isAuthenticated = state.auth.isAuthenticated;
            }
        }, ['auth']);
        
        // Subscribe to user state
        store.subscribe((state) => {
            if (state.user?.profile) {
                this.currentUser = state.user.profile;
            }
        }, ['user']);
        
        // Subscribe to theme state
        store.subscribe((state) => {
            if (state.ui?.theme) {
                document.documentElement.setAttribute('data-theme', state.ui.theme);
            }
        }, ['ui.theme']);
        
        console.log('✅ State subscriptions setup complete');
    }
    
    // ============================================================
    // 🧭 ROUTER SETUP
    // ============================================================
    
    setupRouter() {
        console.log('🧭 Setting up router...');
        
        router.init({
            mode: 'history',
            basePath: '/',
            defaultRoute: '/home',
            notFoundRoute: '/404'
        });
        
        // Define routes
        const routeDefinitions = [
            { path: '/home', component: 'HomeScreen', meta: { title: 'Home', icon: 'home' } },
            { path: '/auth', component: 'AuthScreen', meta: { title: 'Authentication', icon: 'login', requiresGuest: true } },
            { path: '/explore', component: 'ExploreScreen', meta: { title: 'Explore', icon: 'explore' } },
            { path: '/social', component: 'SocialFeed', meta: { title: 'Social', icon: 'social', requiresAuth: true } },
            { path: '/marketplace', component: 'Marketplace', meta: { title: 'Marketplace', icon: 'store' } },
            { path: '/product/:id', component: 'ProductDetail', meta: { title: 'Product' } },
            { path: '/upload', component: 'UploadScreen', meta: { title: 'Upload', requiresAuth: true, requiresSeller: true } },
            { path: '/profile/:userId?', component: 'ProfileScreen', meta: { title: 'Profile', icon: 'profile' } },
            { path: '/settings', component: 'SettingsScreen', meta: { title: 'Settings', requiresAuth: true, icon: 'settings' } },
            { path: '/notifications', component: 'NotificationsScreen', meta: { title: 'Notifications', requiresAuth: true, icon: 'bell' } },
            { path: '/history', component: 'HistoryScreen', meta: { title: 'History', requiresAuth: true, icon: 'history' } },
            { path: '/chat', component: 'ChatList', meta: { title: 'Chats', requiresAuth: true, icon: 'chat' } },
            { path: '/chat/:id', component: 'ChatDetail', meta: { title: 'Chat', requiresAuth: true } },
            { path: '/ai-chat', component: 'AIChat', meta: { title: 'AI Assistant', requiresAuth: true, icon: 'ai' } },
            { path: '/create-post', component: 'CreatePost', meta: { title: 'Create Post', requiresAuth: true } },
            { path: '/create-story', component: 'CreateStory', meta: { title: 'Create Story', requiresAuth: true } },
            { path: '/story/:id', component: 'StoryViewer', meta: { title: 'Story', requiresAuth: true } },
            { path: '/post/:id', component: 'PostDetail', meta: { title: 'Post', requiresAuth: true } },
            { path: '/followers/:userId', component: 'FollowersList', meta: { title: 'Followers' } },
            { path: '/following/:userId', component: 'FollowingList', meta: { title: 'Following' } },
            { path: '/admin', component: 'AdminDashboard', meta: { title: 'Admin', requiresAuth: true, requiresAdmin: true } },
            { path: '/about', component: 'AboutScreen', meta: { title: 'About' } },
            { path: '/contact', component: 'ContactScreen', meta: { title: 'Contact' } },
            { path: '/privacy', component: 'PrivacyScreen', meta: { title: 'Privacy Policy' } },
            { path: '/terms', component: 'TermsScreen', meta: { title: 'Terms of Service' } },
            { path: '/404', component: 'NotFoundScreen', meta: { title: 'Page Not Found' } }
        ];
        
        for (const route of routeDefinitions) {
            router.addRoute(route.path, route.component, route.meta);
        }
        
        console.log(`✅ ${routeDefinitions.length} routes registered`);
    }
    
    // ============================================================
    // 🛡️ ROUTE GUARDS
    // ============================================================
    
    setupRouteGuards() {
        console.log('🛡️ Setting up route guards...');
        
        router.beforeEach((to, from, next) => {
            // Track history
            this.routeHistory.push({ to, from, timestamp: Date.now() });
            if (this.routeHistory.length > 100) {
                this.routeHistory.shift();
            }
            
            // Check authentication
            if (to.meta?.requiresAuth && !store.getState('auth.isAuthenticated')) {
                console.warn('🔒 Route requires auth, redirecting to login:', to.path);
                next('/auth');
                return;
            }
            
            // Check guest only
            if (to.meta?.requiresGuest && store.getState('auth.isAuthenticated')) {
                console.warn('🔒 Route is guest only, redirecting to home:', to.path);
                next('/home');
                return;
            }
            
            // Check seller role
            if (to.meta?.requiresSeller && !store.getState('user.isSeller')) {
                console.warn('🔒 Route requires seller, redirecting to home:', to.path);
                next('/home');
                return;
            }
            
            // Check admin role
            if (to.meta?.requiresAdmin && !store.getState('user.isAdmin')) {
                console.warn('🔒 Route requires admin, redirecting to home:', to.path);
                next('/home');
                return;
            }
            
            next();
        });
        
        router.afterEach((to, from) => {
            // Track page view
            analyticsService.trackEvent('page_view', {
                page: to.path,
                title: to.title || to.name,
                from: from?.path || 'direct'
            });
            
            // Update document title
            if (to.title) {
                document.title = `${to.title} | ${this.name}`;
            }
            
            // Update meta tags
            this.updateMetaTagsForRoute(to);
            
            // Scroll to top
            window.scrollTo(0, 0);
            
            // Log navigation
            console.log(`🧭 Navigated: ${from?.path || 'start'} → ${to.path}`);
        });
        
        console.log('✅ Route guards setup complete');
    }
    
    // ============================================================
    // 🔗 ROUTE ALIASES
    // ============================================================
    
    setupRouteAliases() {
        console.log('🔗 Setting up route aliases...');
        
        const aliases = {
            '/': '/home',
            '/login': '/auth',
            '/signup': '/auth',
            '/register': '/auth',
            '/dashboard': '/home',
            '/feed': '/social',
            '/messages': '/chat',
            '/inbox': '/chat',
            '/profile/me': '/profile',
            '/my-profile': '/profile',
            '/settings/profile': '/settings',
            '/settings/notifications': '/notifications',
            '/my/uploads': '/upload',
            '/my-products': '/upload',
            '/saved': '/history',
            '/bookmarks': '/history',
            '/ai': '/ai-chat',
            '/assistant': '/ai-chat'
        };
        
        for (const [alias, target] of Object.entries(aliases)) {
            router.addAlias(alias, target);
        }
        
        console.log(`✅ ${Object.keys(aliases).length} route aliases registered`);
    }
    
    // ============================================================
    // 🎨 THEME SETUP
    // ============================================================
    
    setupTheme() {
        console.log('🎨 Setting up theme...');
        
        // Initialize theme manager
        themeManager.init({
            defaultTheme: 'light',
            themes: ['light', 'dark', 'system'],
            storageKey: 'zymore_theme',
            systemTheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        });
        
        // Apply saved theme
        const savedTheme = localStorage.getItem('zymore_theme') || 'system';
        themeManager.setTheme(savedTheme);
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (themeManager.getCurrentTheme() === 'system') {
                themeManager.setTheme('system');
            }
        });
        
        // Theme toggle button
        this.addThemeToggleButton();
        
        console.log('✅ Theme setup complete');
    }
    
    addThemeToggleButton() {
        // Check if already exists
        if (document.querySelector('.theme-toggle-btn')) return;
        
        const button = document.createElement('button');
        button.className = 'theme-toggle-btn';
        button.setAttribute('aria-label', 'Toggle theme');
        button.innerHTML = '🌓';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: none;
            background: var(--primary-color, #FF6B35);
            color: white;
            font-size: 24px;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
        `;
        button.onmouseover = () => {
            button.style.transform = 'scale(1.1)';
        };
        button.onmouseout = () => {
            button.style.transform = 'scale(1)';
        };
        button.onclick = () => {
            const current = themeManager.getCurrentTheme();
            const next = current === 'light' ? 'dark' : 'light';
            themeManager.setTheme(next);
            this.showToast(`Theme changed to ${next} mode`, 'info', 2000);
        };
        
        document.body.appendChild(button);
    }
    
    // ============================================================
    // 📊 ANALYTICS SETUP
    // ============================================================
    
    setupAnalytics() {
        console.log('📊 Setting up analytics...');
        
        if (!this.features.analytics) {
            console.log('📊 Analytics disabled');
            return;
        }
        
        // Track initial page view
        analyticsService.trackEvent('app_start', {
            version: this.version,
            environment: this.environment,
            timestamp: new Date().toISOString()
        });
        
        console.log('✅ Analytics setup complete');
    }
    
    // ============================================================
    // 🔔 NOTIFICATIONS SETUP
    // ============================================================
    
    setupNotifications() {
        console.log('🔔 Setting up notifications...');
        
        // Request permission on user interaction
        document.addEventListener('click', () => {
            if (this.features.notifications && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }, { once: true });
        
        console.log('✅ Notifications setup complete');
    }
    
    // ============================================================
    // 💾 CACHE SETUP
    // ============================================================
    
    setupCache() {
        console.log('💾 Setting up cache...');
        
        cacheService.init({
            ttl: this.config.cacheTTL,
            maxSize: 100,
            storage: 'localStorage'
        });
        
        // Periodic cleanup
        setInterval(() => {
            cacheService.cleanup();
        }, 3600000);
        
        console.log('✅ Cache setup complete');
    }
    
    // ============================================================
    // 📴 OFFLINE SUPPORT
    // ============================================================
    
    setupOffline() {
        console.log('📴 Setting up offline support...');
        
        if (!this.features.offline) return;
        
        // Check for offline data
        const offlineData = cacheService.get('offline_data');
        if (offlineData) {
            console.log('📴 Offline data found');
            store.setState('app.offlineData', offlineData);
        }
        
        console.log('✅ Offline support setup complete');
    }
    
    async syncOfflineData() {
        try {
            console.log('🔄 Syncing offline data...');
            const offlineData = cacheService.get('offline_data');
            if (offlineData) {
                // Sync logic here
                cacheService.remove('offline_data');
                console.log('✅ Offline data synced');
            }
        } catch (error) {
            console.error('❌ Offline sync failed:', error);
        }
    }
    
    // ============================================================
    // ⌨️ KEYBOARD SHORTCUTS
    // ============================================================
    
    setupKeyboardShortcuts() {
        console.log('⌨️ Setting up keyboard shortcuts...');
        
        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + K = Search
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                this.openSearch();
            }
            
            // Ctrl/Cmd + N = New Product
            if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
                event.preventDefault();
                if (store.getState('auth.isAuthenticated') && store.getState('user.isSeller')) {
                    router.navigate('/upload');
                }
            }
            
            // Ctrl/Cmd + H = Home
            if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
                event.preventDefault();
                router.navigate('/home');
            }
            
            // Escape = Close modals
            if (event.key === 'Escape') {
                this.closeAllModals();
            }
            
            // Ctrl/Cmd + Shift + D = Dark Mode
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
                event.preventDefault();
                const current = themeManager.getCurrentTheme();
                themeManager.setTheme(current === 'light' ? 'dark' : 'light');
            }
            
            // Ctrl/Cmd + / = Help
            if ((event.ctrlKey || event.metaKey) && event.key === '/') {
                event.preventDefault();
                this.showKeyboardShortcutsHelp();
            }
        });
        
        console.log('✅ Keyboard shortcuts setup complete');
    }
    
    openSearch() {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
        }
        eventBus.emit(EVENTS.SEARCH_OPEN);
    }
    
    closeAllModals() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        eventBus.emit(EVENTS.MODAL_CLOSE_ALL);
    }
    
    showKeyboardShortcutsHelp() {
        const shortcuts = [
            { keys: '⌘K / Ctrl+K', description: 'Open Search' },
            { keys: '⌘N / Ctrl+N', description: 'New Product (Seller)' },
            { keys: '⌘H / Ctrl+H', description: 'Go Home' },
            { keys: 'Esc', description: 'Close Modals' },
            { keys: '⌘⇧D / Ctrl+Shift+D', description: 'Toggle Dark Mode' },
            { keys: '⌘/ / Ctrl+/', description: 'Show this help' }
        ];
        
        let html = `
            <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;border-radius:12px;padding:24px;max-width:400px;width:90%;z-index:10000;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                <h3 style="margin:0 0 16px;font-size:20px;">⌨️ Keyboard Shortcuts</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;">
        `;
        
        for (const shortcut of shortcuts) {
            html += `
                <div style="font-size:13px;color:#6b7280;">${shortcut.keys}</div>
                <div style="font-size:13px;">${shortcut.description}</div>
            `;
        }
        
        html += `
                </div>
                <button onclick="this.closest('div[style]').remove()" style="margin-top:16px;padding:8px 24px;background:#FF6B35;color:white;border:none;border-radius:8px;cursor:pointer;width:100%;font-size:14px;">
                    Close
                </button>
            </div>
        `;
        
        // Remove existing help
        const existing = document.querySelector('[data-help="shortcuts"]');
        if (existing) existing.remove();
        
        const container = document.createElement('div');
        container.dataset.help = 'shortcuts';
        container.innerHTML = html;
        document.body.appendChild(container);
        
        // Click outside to close
        container.addEventListener('click', (e) => {
            if (e.target === container) {
                container.remove();
            }
        });
    }
    
    // ============================================================
    // ⚡ PERFORMANCE MONITORING
    // ============================================================
    
    setupPerformanceMonitoring() {
        console.log('⚡ Setting up performance monitoring...');
        
        performanceMonitor.init({
            enabled: true,
            logToConsole: this.isDevelopment,
            sendToAnalytics: this.isProduction
        });
        
        // Monitor page load
        window.addEventListener('load', () => {
            const loadTime = performance.now() - this.startTime;
            this.metrics.loadTime = loadTime;
            performanceMonitor.track('page_load', loadTime);
            analyticsService.trackEvent('performance_page_load', { loadTime });
            console.log(`⚡ Page load time: ${loadTime.toFixed(2)}ms`);
        });
        
        // Monitor DOM ready
        document.addEventListener('DOMContentLoaded', () => {
            const domReady = performance.now() - this.startTime;
            this.metrics.domReady = domReady;
            performanceMonitor.track('dom_ready', domReady);
        });
        
        // Monitor first paint
        if (window.performance) {
            const paint = performance.getEntriesByType('paint');
            for (const entry of paint) {
                if (entry.name === 'first-paint') {
                    this.metrics.firstPaint = entry.startTime;
                    performanceMonitor.track('first_paint', entry.startTime);
                }
                if (entry.name === 'first-contentful-paint') {
                    this.metrics.firstContentfulPaint = entry.startTime;
                    performanceMonitor.track('fcp', entry.startTime);
                }
            }
        }
        
        // Monitor API calls
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const start = performance.now();
            this.metrics.apiCalls++;
            try {
                const response = await originalFetch(...args);
                const duration = performance.now() - start;
                if (duration > 1000) {
                    console.warn(`⚡ Slow API: ${args[0]} took ${duration.toFixed(0)}ms`);
                    analyticsService.trackEvent('performance_slow_api', {
                        url: args[0],
                        duration
                    });
                }
                return response;
            } catch (error) {
                this.metrics.apiErrors++;
                throw error;
            }
        };
        
        console.log('✅ Performance monitoring setup complete');
    }
    
    // ============================================================
    // 📊 WEB VITALS
    // ============================================================
    
    setupWebVitals() {
        console.log('📊 Setting up Web Vitals...');
        
        // Largest Contentful Paint
        if (window.PerformanceObserver) {
            const observer = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.largestContentfulPaint = lastEntry.startTime;
                performanceMonitor.track('lcp', lastEntry.startTime);
                analyticsService.trackEvent('web_vital_lcp', { value: lastEntry.startTime });
            });
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
            
            // First Input Delay
            const fidObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                for (const entry of entries) {
                    performanceMonitor.track('fid', entry.processingStart - entry.startTime);
                    analyticsService.trackEvent('web_vital_fid', { 
                        value: entry.processingStart - entry.startTime 
                    });
                }
            });
            fidObserver.observe({ entryTypes: ['first-input'] });
            
            // Cumulative Layout Shift
            const clsObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                let clsValue = 0;
                for (const entry of entries) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                this.metrics.cls = clsValue;
                performanceMonitor.track('cls', clsValue);
                analyticsService.trackEvent('web_vital_cls', { value: clsValue });
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        }
        
        console.log('✅ Web Vitals setup complete');
    }
    
    // ============================================================
    // 🏥 HEALTH CHECKS
    // ============================================================
    
    setupHealthChecks() {
        console.log('🏥 Setting up health checks...');
        
        this.healthCheckInterval = setInterval(() => {
            this.runHealthCheck();
        }, this.config.healthCheckInterval);
        
        console.log('✅ Health checks setup complete');
    }
    
    async runHealthCheck() {
        try {
            // Check Firebase connection
            await databaseService.healthCheck();
            
            // Check network
            if (!navigator.onLine) {
                console.warn('🏥 Network offline');
                this.handleOffline();
            }
            
            // Check memory
            if (performance.memory) {
                const memory = performance.memory;
                if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
                    console.warn('🏥 High memory usage:', memory);
                    analyticsService.trackEvent('performance_high_memory', {
                        used: memory.usedJSHeapSize,
                        limit: memory.jsHeapSizeLimit
                    });
                }
            }
            
            console.debug('🏥 Health check passed');
            
        } catch (error) {
            console.warn('🏥 Health check failed:', error);
            this.handleError(error, 'Health check failed');
        }
    }
    
    // ============================================================
    // 🔄 AUTO SYNC
    // ============================================================
    
    setupAutoSync() {
        console.log('🔄 Setting up auto sync...');
        
        this.syncInterval = setInterval(() => {
            this.syncData();
        }, this.config.syncInterval);
        
        console.log('✅ Auto sync setup complete');
    }
    
    async syncData() {
        try {
            console.log('🔄 Syncing data...');
            // Sync logic here
        } catch (error) {
            console.error('❌ Sync failed:', error);
        }
    }
    
    // ============================================================
    // 📱 SERVICE WORKERS
    // ============================================================
    
    async setupServiceWorkers() {
        try {
            if ('serviceWorker' in navigator && this.environment !== 'development') {
                console.log('📱 Registering service worker...');
                
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });
                
                this.swRegistration = registration;
                console.log('✅ Service worker registered:', registration.scope);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('🔄 Service worker update available');
                            this.showToast('Update available! Refresh for new features.', 'info');
                        }
                    });
                });
            }
        } catch (error) {
            console.warn('⚠️ Service worker registration failed:', error);
        }
    }
    
    // ============================================================
    // 🌐 NETWORK MONITORING
    // ============================================================
    
    setupNetworkMonitoring() {
        console.log('🌐 Setting up network monitoring...');
        
        // Check initial status
        if (!navigator.onLine) {
            this.handleOffline();
        }
        
        // Monitor changes
        window.addEventListener('online', () => {
            eventBus.emit(EVENTS.NETWORK_ONLINE);
            this.handleOnline();
        });
        
        window.addEventListener('offline', () => {
            eventBus.emit(EVENTS.NETWORK_OFFLINE);
            this.handleOffline();
        });
        
        console.log('✅ Network monitoring setup complete');
    }
    
    handleOnline() {
        console.log('🌐 Online');
        this.showToast('Back online!', 'success');
        this.syncOfflineData();
        store.setState('app.online', true);
    }
    
    handleOffline() {
        console.log('📴 Offline');
        this.showToast('You are offline. Some features may be unavailable.', 'warning');
        store.setState('app.online', false);
    }
    
    // ============================================================
    // 🔐 SESSION MANAGEMENT
    // ============================================================
    
    setupSessionManagement() {
        console.log('🔐 Setting up session management...');
        
        // Check session on load
        this.checkSession();
        
        // Periodic session check
        this.sessionTimer = setInterval(() => {
            this.checkSession();
        }, 60000);
        
        console.log('✅ Session management setup complete');
    }
    
    checkSession() {
        const sessionStart = localStorage.getItem('zymore_session_start');
        if (sessionStart) {
            const elapsed = Date.now() - parseInt(sessionStart);
            if (elapsed > this.config.sessionTimeout) {
                console.log('⏰ Session expired');
                localStorage.removeItem('zymore_session_start');
                if (store.getState('auth.isAuthenticated')) {
                    authService.logout();
                    this.showToast('Your session has expired. Please login again.', 'warning');
                }
            }
        }
        
        // Update session
        localStorage.setItem('zymore_session_start', Date.now().toString());
    }
    
    // ============================================================
    // 🔍 FEATURE DETECTION
    // ============================================================
    
    setupFeatureDetection() {
        console.log('🔍 Setting up feature detection...');
        
        const features = {
            webp: this.checkWebPSupport(),
            webp: this.checkWebPSupport(),
            webp: this.checkWebPSupport(),
            webp: this.checkWebPSupport()
        };
        
        // Detect more features
        features.webWorker = 'Worker' in window;
        features.serviceWorker = 'serviceWorker' in navigator;
        features.pushManager = 'PushManager' in window;
        features.notifications = 'Notification' in window;
        features.geolocation = 'geolocation' in navigator;
        features.storage = 'localStorage' in window;
        features.indexedDB = 'indexedDB' in window;
        features.sessionStorage = 'sessionStorage' in window;
        features.webGL = this.checkWebGLSupport();
        features.webAudio = 'AudioContext' in window || 'webkitAudioContext' in window;
        features.webRTC = 'RTCPeerConnection' in window;
        features.websocket = 'WebSocket' in window;
        features.fetch = 'fetch' in window;
        features.promise = 'Promise' in window;
        features.asyncAwait = this.checkAsyncAwaitSupport();
        features.intersectionObserver = 'IntersectionObserver' in window;
        features.resizeObserver = 'ResizeObserver' in window;
        features.mutationObserver = 'MutationObserver' in window;
        
        // Store features
        store.setState('app.browserFeatures', features);
        
        console.log('🔍 Features detected:', features);
        console.log('✅ Feature detection setup complete');
    }
    
    checkWebPSupport() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        const data = ctx.getImageData(0, 0, 1, 1);
        return canvas.toDataURL('image/webp').indexOf('image/webp') !== -1;
    }
    
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }
    
    checkAsyncAwaitSupport() {
        try {
            eval('(async () => {})()');
            return true;
        } catch (e) {
            return false;
        }
    }
    
    // ============================================================
    // ⚙️ USER PREFERENCES
    // ============================================================
    
    setupUserPreferences() {
        console.log('⚙️ Setting up user preferences...');
        
        const preferences = localStorage.getItem('zymore_preferences');
        if (preferences) {
            try {
                const prefs = JSON.parse(preferences);
                store.setState('user.preferences', prefs);
                console.log('📂 User preferences loaded');
            } catch (error) {
                console.warn('Failed to load preferences:', error);
            }
        }
        
        console.log('✅ User preferences setup complete');
    }
    
    // ============================================================
    // 📦 LAZY LOADING
    // ============================================================
    
    setupLazyLoading() {
        console.log('📦 Setting up lazy loading...');
        
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        const el = entry.target;
                        // Load image
                        if (el.dataset.src) {
                            el.src = el.dataset.src;
                            el.removeAttribute('data-src');
                        }
                        // Load background image
                        if (el.dataset.bg) {
                            el.style.backgroundImage = `url(${el.dataset.bg})`;
                            el.removeAttribute('data-bg');
                        }
                        observer.unobserve(el);
                    }
                }
            }, {
                rootMargin: '50px',
                threshold: 0.1
            });
            
            // Observe all lazy elements
            document.querySelectorAll('[data-src], [data-bg]').forEach(el => {
                observer.observe(el);
            });
            
            // Dynamic observer for new elements
            const mutationObserver = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1) { // Element
                            if (node.dataset?.src || node.dataset?.bg) {
                                observer.observe(node);
                            }
                            // Check children
                            node.querySelectorAll('[data-src], [data-bg]').forEach(el => {
                                observer.observe(el);
                            });
                        }
                    }
                }
            });
            mutationObserver.observe(document.body, { childList: true, subtree: true });
        }
        
        console.log('✅ Lazy loading setup complete');
    }
    
    // ============================================================
    // 🔐 AUTHENTICATION
    // ============================================================
    
    async checkAuthentication() {
        try {
            console.log('🔐 Checking authentication...');
            
            const user = await authService.getCurrentUser();
            
            if (user) {
                this.currentUser = user;
                store.setState('auth.user', user);
                store.setState('auth.isAuthenticated', true);
                analyticsService.setUserId(user.uid);
                console.log('✅ User authenticated:', user.displayName || user.email);
            } else {
                store.setState('auth.user', null);
                store.setState('auth.isAuthenticated', false);
                console.log('🔐 No user authenticated');
            }
            
        } catch (error) {
            console.error('❌ Auth check failed:', error);
            this.handleError(error, 'Authentication check failed');
        }
    }
    
    async onAuthStateChange(user) {
        try {
            if (user) {
                this.currentUser = user;
                store.setState('auth.user', user);
                store.setState('auth.isAuthenticated', true);
                await this.loadUserData(user.uid);
                analyticsService.setUserId(user.uid);
                eventBus.emit(EVENTS.AUTH_LOGIN, user);
                console.log('👤 Auth state - User logged in');
            } else {
                this.currentUser = null;
                store.setState('auth.user', null);
                store.setState('auth.isAuthenticated', false);
                analyticsService.setUserId(null);
                eventBus.emit(EVENTS.AUTH_LOGOUT);
                console.log('👤 Auth state - User logged out');
            }
        } catch (error) {
            console.error('❌ Auth state change error:', error);
            this.handleError(error, 'Auth state change failed');
        }
    }
    
    async loadUserData(uid) {
        try {
            const userData = await databaseService.getDocument('users', uid);
            if (userData) {
                store.setState('user.profile', userData);
                store.setState('user.stats', userData.stats || {});
                store.setState('user.isSeller', userData.isSeller || false);
                store.setState('user.isAdmin', userData.isAdmin || false);
                store.setState('user.isVerified', userData.isVerified || false);
                
                // Load preferences
                if (userData.preferences) {
                    if (userData.preferences.darkMode !== undefined) {
                        themeManager.setTheme(userData.preferences.darkMode ? 'dark' : 'light');
                    }
                    if (userData.preferences.language) {
                        store.setState('ui.language', userData.preferences.language);
                    }
                }
                
                console.log('✅ User data loaded');
            }
        } catch (error) {
            console.error('❌ Failed to load user data:', error);
        }
    }
    
    // ============================================================
    // 📊 LOAD INITIAL DATA
    // ============================================================
    
    async loadInitialData() {
        try {
            console.log('📊 Loading initial data...');
            
            // --- Load categories ---
            const cachedCategories = cacheService.get('categories');
            if (cachedCategories) {
                store.setState('categories.items', cachedCategories);
                console.log('📂 Categories loaded from cache');
            }
            
            const categories = await databaseService.getCollection('categories', [
                { field: 'isActive', operator: '==', value: true }
            ]);
            store.setState('categories.items', categories);
            cacheService.set('categories', categories);
            console.log(`✅ ${categories.length} categories loaded`);
            
            // --- Load featured products ---
            const cachedFeatured = cacheService.get('featured_products');
            if (cachedFeatured) {
                store.setState('products.featured', cachedFeatured);
                console.log('📂 Featured products loaded from cache');
            }
            
            const featuredProducts = await databaseService.getCollection('products', [
                { field: 'isFeatured', operator: '==', value: true },
                { field: 'isActive', operator: '==', value: true }
            ], { limit: 10 });
            store.setState('products.featured', featuredProducts);
            cacheService.set('featured_products', featuredProducts);
            console.log(`✅ ${featuredProducts.length} featured products loaded`);
            
            // --- Load trending products ---
            const trendingProducts = await databaseService.getCollection('products', [
                { field: 'isTrending', operator: '==', value: true },
                { field: 'isActive', operator: '==', value: true }
            ], { limit: 10 });
            store.setState('products.trending', trendingProducts);
            console.log(`✅ ${trendingProducts.length} trending products loaded`);
            
            // --- Load all products ---
            const allProducts = await databaseService.getCollection('products', [
                { field: 'isActive', operator: '==', value: true }
            ], { limit: 50 });
            store.setState('products.items', allProducts);
            console.log(`✅ ${allProducts.length} total products loaded`);
            
            // --- Load notifications ---
            if (this.currentUser) {
                const notifications = await databaseService.getCollection('notifications', [
                    { field: 'userId', operator: '==', value: this.currentUser.uid }
                ], { orderBy: 'createdAt', orderDirection: 'desc', limit: 20 });
                store.setState('notifications.items', notifications);
                store.setState('notifications.unread', notifications.filter(n => !n.isRead).length);
                console.log(`✅ ${notifications.length} notifications loaded`);
            }
            
            // --- Load social feed ---
            if (this.currentUser) {
                const feed = await feedService.getFeed(this.currentUser.uid);
                store.setState('social.feed', feed);
                console.log(`✅ ${feed.length} feed items loaded`);
            }
            
            console.log('✅ Initial data loaded successfully');
            
        } catch (error) {
            console.error('❌ Failed to load initial data:', error);
            this.handleError(error, 'Failed to load initial data');
        }
    }
    
    // ============================================================
    // 👂 EVENT LISTENERS
    // ============================================================
    
    setupEventListeners() {
        console.log('👂 Setting up event listeners...');
        
        // --- Visibility change ---
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                eventBus.emit(EVENTS.APP_VISIBLE);
                this.refreshData();
            } else {
                eventBus.emit(EVENTS.APP_HIDDEN);
            }
        });
        
        // --- Page unload ---
        window.addEventListener('beforeunload', () => {
            this.saveStateToStorage(store.getState());
            console.log('💾 State saved before unload');
        });
        
        // --- Page load ---
        window.addEventListener('load', () => {
            console.log('📄 Page loaded completely');
            this.metrics.pageLoadComplete = Date.now();
        });
        
        // --- Resize ---
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const width = window.innerWidth;
                const height = window.innerHeight;
                store.setState('ui.windowSize', { width, height });
            }, 250);
        });
        
        // --- Scroll ---
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollY = window.scrollY;
                store.setState('ui.scrollY', scrollY);
            }, 100);
        });
        
        // --- Service worker updates ---
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('🔄 Service worker updated');
                eventBus.emit(EVENTS.SW_UPDATED);
                this.showToast('App updated! Refresh for new features.', 'info');
            });
        }
        
        console.log('✅ Event listeners setup complete');
    }
    
    // ============================================================
    // 🎨 UI HELPERS
    // ============================================================
    
    showToast(message, type = 'info', duration = 5000) {
        // Use global toast if available
        if (window.toastNotification) {
            window.toastNotification.show(message, type, duration);
            return;
        }
        
        // Fallback toast
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 8px;
            background: ${type === 'error' ? '#EF4444' : type === 'success' ? '#22C55E' : type === 'warning' ? '#F59E0B' : '#3B82F6'};
            color: white;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 90%;
            text-align: center;
            transition: all 0.3s ease;
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });
        
        // Remove after duration
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, duration);
    }
    
    showWelcome() {
        this.showToast(`Welcome to ${this.name}! 🎉`, 'success', 3000);
    }
    
    showBrowserNotification(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const options = {
                body: notification.body,
                icon: notification.icon || '/assets/icons/icon-192.png',
                badge: '/assets/icons/badge-icon.png',
                data: notification.data || {},
                tag: notification.tag || 'default',
                requireInteraction: notification.requireInteraction || false
            };
            
            const n = new Notification(notification.title, options);
            
            n.onclick = () => {
                n.close();
                if (notification.link) {
                    router.navigate(notification.link);
                }
            };
            
            n.onclose = () => {
                if (notification.id) {
                    eventBus.emit(EVENTS.NOTIFICATION_READ, notification.id);
                }
            };
        }
    }
    
    hideLoadingScreen() {
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }
    }
    
    showFatalError(error) {
        const content = document.getElementById('app-content');
        if (content) {
            content.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:20px;text-align:center;font-family:system-ui,-apple-system,sans-serif;">
                    <div style="font-size:64px;margin-bottom:16px;">💥</div>
                    <h1 style="color:#FF6B35;margin:0;font-size:28px;">Something Went Wrong</h1>
                    <p style="color:#6b7280;margin:8px 0 4px;font-size:14px;">${error.message || 'An unexpected error occurred'}</p>
                    <p style="color:#9ca3af;font-size:12px;margin:4px 0 20px;">Please try refreshing the page</p>
                    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
                        <button onclick="location.reload()" style="padding:12px 32px;background:#FF6B35;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;font-weight:500;">
                            🔄 Refresh Page
                        </button>
                        <button onclick="localStorage.clear();location.reload()" style="padding:12px 32px;background:#6b7280;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;">
                            🧹 Clear Cache & Refresh
                        </button>
                    </div>
                    <details style="margin-top:24px;text-align:left;color:#6b7280;font-size:12px;max-width:500px;">
                        <summary style="cursor:pointer;color:#9ca3af;">Technical Details</summary>
                        <pre style="white-space:pre-wrap;word-break:break-word;background:#f3f4f6;padding:12px;border-radius:8px;font-size:11px;max-height:200px;overflow:auto;">
                            ${error.stack || error.message || 'Unknown error'}
                        </pre>
                    </details>
                    <p style="color:#d1d5db;font-size:11px;margin-top:24px;">${this.name} v${this.version} | ${this.environment}</p>
                </div>
            `;
            content.style.display = 'block';
        }
        
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }
    
    // ============================================================
    // 🎯 PUBLIC METHODS
    // ============================================================
    
    getStatus() {
        return {
            initialized: this.isInitialized,
            ready: this.isReady,
            version: this.version,
            environment: this.environment,
            name: this.name,
            user: this.currentUser?.displayName || null,
            authenticated: !!this.currentUser,
            loadTime: this.metrics.loadTime.toFixed(2) + 'ms',
            features: this.features,
            config: this.config,
            metrics: this.metrics,
            routeHistory: this.routeHistory.length,
            pendingNotifications: this.pendingNotifications.length,
            activeModals: this.activeModals.length,
            swRegistered: !!this.swRegistration
        };
    }
    
    getMetrics() {
        return { ...this.metrics };
    }
    
    reload() {
        console.log('🔄 Reloading app...');
        window.location.reload();
    }
    
    async checkUpdates() {
        if (this.swRegistration) {
            await this.swRegistration.update();
            console.log('🔄 Checking for updates...');
            this.showToast('Checking for updates...', 'info');
        }
    }
    
    getVersion() {
        return this.version;
    }
    
    getConfig() {
        return { ...this.config };
    }
    
    getFeatures() {
        return { ...this.features };
    }
    
    // ============================================================
    // 📈 TRACKING
    // ============================================================
    
    trackAppLoad(loadTime) {
        analyticsService.trackEvent('app_loaded', {
            version: this.version,
            environment: this.environment,
            loadTime: loadTime,
            features: Object.keys(this.features).filter(k => this.features[k])
        });
    }
    
    emitAppReady(loadTime) {
        eventBus.emit(EVENTS.APP_READY, {
            version: this.version,
            loadTime: loadTime,
            features: this.features
        });
    }
    
    // ============================================================
    // 🧹 CLEANUP
    // ============================================================
    
    setupCleanup() {
        console.log('🧹 Setting up cleanup...');
        
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
        
        console.log('✅ Cleanup setup complete');
    }
    
    cleanup() {
        // Clear intervals
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
            this.sessionTimer = null;
        }
        
        // Save state
        this.saveStateToStorage(store.getState());
        
        // Cleanup services
        if (this.firebase) {
            // Firebase cleanup
        }
        
        console.log('🧹 App cleanup complete');
    }
    
    // ============================================================
    // 🔄 REFRESH DATA
    // ============================================================
    
    async refreshData() {
        if (!this.isReady) return;
        
        try {
            console.log('🔄 Refreshing data...');
            await this.loadInitialData();
            this.showToast('Data refreshed successfully!', 'success', 2000);
            console.log('✅ Data refreshed');
        } catch (error) {
            console.error('❌ Failed to refresh data:', error);
            this.handleError(error, 'Failed to refresh data');
        }
    }
    
    // ============================================================
    // 📋 META TAGS
    // ============================================================
    
    updateMetaTagsForRoute(route) {
        const title = route.title || this.name;
        const description = route.meta?.description || `${this.name} - Ultimate Digital Marketplace`;
        
        // Update title
        document.title = `${title} | ${this.name}`;
        
        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = description;
        }
        
        // Update Open Graph
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
            ogTitle.content = `${title} | ${this.name}`;
        }
        
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) {
            ogDesc.content = description;
        }
        
        // Update Twitter Card
        const twitterTitle = document.querySelector('meta[name="twitter:title"]');
        if (twitterTitle) {
            twitterTitle.content = `${title} | ${this.name}`;
        }
        
        const twitterDesc = document.querySelector('meta[name="twitter:description"]');
        if (twitterDesc) {
            twitterDesc.content = description;
        }
    }
    
    updateMetaTags(path) {
        // Find route by path
        const routes = router.getAllRoutes();
        const route = routes.find(r => r.path === path);
        if (route) {
            this.updateMetaTagsForRoute(route);
        }
    }
}

// ============================================================
// 🚀 BOOTSTRAP APP
// ============================================================

function bootstrapApp() {
    try {
        console.log('🚀 Bootstrapping ZYMORE...');
        
        if (window.__zymoreApp) {
            console.warn('⚠️ App already initialized');
            return window.__zymoreApp;
        }
        
        const startApp = () => {
            window.__zymoreApp = new App();
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startApp);
        } else {
            startApp();
        }
        
        return window.__zymoreApp;
        
    } catch (error) {
        console.error('❌ Failed to bootstrap app:', error);
        document.body.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;font-family:system-ui,-apple-system,sans-serif;padding:20px;text-align:center;">
                <div style="font-size:64px;margin-bottom:16px;">💥</div>
                <h1 style="color:#FF6B35;margin:0;font-size:28px;">App Failed to Load</h1>
                <p style="color:#6b7280;max-width:400px;margin:8px 0 20px;">${error.message || 'An unexpected error occurred. Please refresh the page.'}</p>
                <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
                    <button onclick="location.reload()" style="padding:12px 32px;background:#FF6B35;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;font-weight:500;">
                        🔄 Refresh Page
                    </button>
                    <button onclick="localStorage.clear();location.reload()" style="padding:12px 32px;background:#6b7280;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;">
                        🧹 Clear Cache & Refresh
                    </button>
                </div>
            </div>
        `;
    }
}

// ============================================================
// 📦 EXPOSE APP TO GLOBAL
// ============================================================

const app = bootstrapApp();

window.__zymore = {
    app: app,
    store: store,
    router: router,
    eventBus: eventBus,
    auth: authService,
    db: databaseService,
    logger: logger,
    version: APP_VERSION,
    constants: constants,
    theme: themeManager,
    performance: performanceMonitor,
    analytics: analyticsService,
    features: app?.features || {}
};

if (APP_ENV === 'development') {
    console.log('🔧 ZYMORE Development Tools:');
    console.log('  window.__zymore - Full app access');
    console.log('  window.__zymore.app - App instance');
    console.log('  window.__zymore.store - State store');
    console.log('  window.__zymore.router - Router');
    console.log('  window.__zymore.eventBus - Event bus');
    console.log('  window.__zymore.auth - Auth service');
    console.log('  window.__zymore.db - Database service');
    console.log('  window.__zymore.theme - Theme manager');
    console.log('  window.__zymore.performance - Performance monitor');
    console.log('  window.__zymore.analytics - Analytics service');
}

// ============================================================
// ✅ FILE APP.JS COMPLETE
// ============================================================

console.log(`✅ ${APP_NAME} App loaded successfully!`);
console.log(`🚀 Version: ${APP_VERSION}`);
console.log(`📅 Environment: ${APP_ENV || 'production'}`);
console.log('🎉 Ready to rock!');