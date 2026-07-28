// Environment Variables
// ============================================================
// FILE: env.js
// PURPOSE: Environment variables loader with validation
// DEPENDENCY: NONE
// USED BY: firebase-config.js, app-config.js, all services
// LOCATION: js/config/env.js
// ============================================================

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

/**
 * Environment variables object
 * Loads from window._env_ or falls back to defaults
 * In production, values should be injected at build time
 */
export const ENV = {
    // ============================================
    // FIREBASE CONFIGURATION
    // ============================================
    FIREBASE_API_KEY: '',
    FIREBASE_AUTH_DOMAIN: '',
    FIREBASE_PROJECT_ID: '',
    FIREBASE_STORAGE_BUCKET: '',
    FIREBASE_MESSAGING_SENDER_ID: '',
    FIREBASE_APP_ID: '',
    FIREBASE_MEASUREMENT_ID: '',

    // ============================================
    // GOOGLE ADMOB CONFIGURATION
    // ============================================
    ADMOB_APP_ID: '',
    ADMOB_BANNER_ID: '',
    ADMOB_REWARDED_ID: '',
    ADMOB_INTERSTITIAL_ID: '',
    ADMOB_NATIVE_ID: '',

    // ============================================
    // GOOGLE DRIVE API CONFIGURATION
    // ============================================
    GOOGLE_DRIVE_API_KEY: '',
    GOOGLE_DRIVE_CLIENT_ID: '',
    GOOGLE_DRIVE_CLIENT_SECRET: '',
    GOOGLE_DRIVE_REDIRECT_URI: '',
    GOOGLE_DRIVE_SCOPES: '',

    // ============================================
    // APP CONFIGURATION
    // ============================================
    APP_NAME: 'ZYMORE',
    APP_DESCRIPTION: 'Free Digital Marketplace',
    APP_URL: 'https://zymore.web.app',
    APP_ENV: 'development',
    APP_VERSION: '1.0.0',

    // ============================================
    // ANALYTICS CONFIGURATION
    // ============================================
    ANALYTICS_ID: '',
    ANALYTICS_ENABLED: 'true',

    // ============================================
    // API RATE LIMITS
    // ============================================
    RATE_LIMIT_REQUESTS: '100',
    RATE_LIMIT_WINDOW: '60000',

    // ============================================
    // FEATURE FLAGS
    // ============================================
    ENABLE_AI_CHAT: 'true',
    ENABLE_IMAGE_EDITOR: 'true',
    ENABLE_SOCIAL_LOGIN: 'true',
    ENABLE_DARK_MODE: 'true',
    ENABLE_PUSH_NOTIFICATIONS: 'true',
    ENABLE_OFFLINE_MODE: 'true',
    ENABLE_SENTRY_LOGGING: 'true',

    // ============================================
    // SENTRY ERROR TRACKING
    // ============================================
    SENTRY_DSN: '',
    SENTRY_ENABLED: 'false',
    SENTRY_ENVIRONMENT: 'development',

    // ============================================
    // FILE UPLOAD CONFIGURATION
    // ============================================
    MAX_IMAGE_SIZE: '10485760',
    MAX_FILE_SIZE: '20971520',
    MAX_TEMP_SIZE: '52428800',
    ALLOWED_IMAGE_TYPES: 'image/jpeg,image/png,image/webp,image/svg+xml',
    ALLOWED_FILE_TYPES: 'application/zip,application/pdf,application/rar,image/*,video/*',

    // ============================================
    // STORAGE PATHS
    // ============================================
    STORAGE_USER_PROFILE_PATH: 'users/{userId}/profile',
    STORAGE_PRODUCT_IMAGES_PATH: 'products/{productId}/images',
    STORAGE_PRODUCT_FILES_PATH: 'products/{productId}/files',
    STORAGE_TEMP_PATH: 'temp/{userId}',
    STORAGE_CACHE_PATH: 'cache',

    // ============================================
    // DATABASE COLLECTIONS
    // ============================================
    COLLECTION_USERS: 'users',
    COLLECTION_PRODUCTS: 'products',
    COLLECTION_REVIEWS: 'reviews',
    COLLECTION_HISTORY: 'history',
    COLLECTION_LIKES: 'likes',
    COLLECTION_CATEGORIES: 'categories',
    COLLECTION_NOTIFICATIONS: 'notifications',
    COLLECTION_REPORTS: 'reports',
    COLLECTION_DOWNLOADS: 'downloads',

    // ============================================
    // SEO & META TAGS
    // ============================================
    DEFAULT_TITLE: 'ZYMORE - Free Digital Marketplace',
    DEFAULT_DESCRIPTION: 'Download high-quality digital assets, wallpapers, icons, and more for free',
    DEFAULT_KEYWORDS: 'digital marketplace, free downloads, wallpapers, icons, assets',
    DEFAULT_IMAGE: 'https://zymore.web.app/assets/images/og-image.jpg',

    // ============================================
    // SOCIAL MEDIA LINKS
    // ============================================
    SOCIAL_INSTAGRAM: 'https://instagram.com/zymoreapp',
    SOCIAL_TWITTER: 'https://twitter.com/zymoreapp',
    SOCIAL_YOUTUBE: 'https://youtube.com/@zymoreapp',
    SOCIAL_FACEBOOK: 'https://facebook.com/zymoreapp',
    SOCIAL_DISCORD: 'https://discord.gg/zymore',

    // ============================================
    // CACHE SETTINGS
    // ============================================
    CACHE_STATIC_DURATION: '86400',
    CACHE_API_DURATION: '3600',
    CACHE_IMAGE_DURATION: '604800',
    CACHE_PRODUCT_DURATION: '3600',

    // ============================================
    // PWA CONFIGURATION
    // ============================================
    PWA_ENABLED: 'true',
    PWA_NAME: 'ZYMORE',
    PWA_SHORT_NAME: 'ZYMORE',
    PWA_START_URL: '/',
    PWA_THEME_COLOR: '#FF6B35',
    PWA_BACKGROUND_COLOR: '#FFFFFF',
    PWA_DISPLAY: 'standalone',
    PWA_ORIENTATION: 'portrait',

    // ============================================
    // GOOGLE ANALYTICS / TAG MANAGER
    // ============================================
    GTM_ID: '',
    GA_MEASUREMENT_ID: '',

    // ============================================
    // STRIPE (Future)
    // ============================================
    STRIPE_PUBLISHABLE_KEY: '',
    STRIPE_SECRET_KEY: '',
    STRIPE_WEBHOOK_SECRET: '',

    // ============================================
    // RECAPTCHA
    // ============================================
    RECAPTCHA_SITE_KEY: '',
    RECAPTCHA_SECRET_KEY: '',

    // ============================================
    // EMAILJS
    // ============================================
    EMAILJS_SERVICE_ID: '',
    EMAILJS_TEMPLATE_ID: '',
    EMAILJS_USER_ID: '',

    // ============================================
    // CLOUDINARY
    // ============================================
    CLOUDINARY_CLOUD_NAME: '',
    CLOUDINARY_API_KEY: '',
    CLOUDINARY_API_SECRET: '',
    CLOUDINARY_UPLOAD_PRESET: '',

    // ============================================
    // ALGOLIA (Future)
    // ============================================
    ALGOLIA_APP_ID: '',
    ALGOLIA_API_KEY: '',
    ALGOLIA_INDEX_NAME: 'products'
};

// ============================================================
// LOAD ENVIRONMENT VARIABLES
// ============================================================

/**
 * Load environment variables from multiple sources
 * Priority: window._env_ > process.env > defaults
 */
function loadEnv() {
    try {
        // Source 1: window._env_ (injected at build time or runtime)
        if (typeof window !== 'undefined' && window._env_) {
            Object.keys(ENV).forEach(key => {
                if (window._env_[key] !== undefined && window._env_[key] !== '') {
                    ENV[key] = window._env_[key];
                }
            });
            console.log('âœ… Environment variables loaded from window._env_');
            return;
        }

        // Source 2: process.env (Node.js / Vite / Webpack)
        if (typeof process !== 'undefined' && process.env) {
            let loaded = 0;
            Object.keys(ENV).forEach(key => {
                // Check for VITE_ prefixed variables (Vite)
                const viteKey = `VITE_${key}`;
                if (process.env[viteKey] !== undefined && process.env[viteKey] !== '') {
                    ENV[key] = process.env[viteKey];
                    loaded++;
                }
                // Check for REACT_APP_ prefixed variables (Create React App)
                const reactKey = `REACT_APP_${key}`;
                if (process.env[reactKey] !== undefined && process.env[reactKey] !== '') {
                    ENV[key] = process.env[reactKey];
                    loaded++;
                }
                // Check for plain key
                if (process.env[key] !== undefined && process.env[key] !== '') {
                    ENV[key] = process.env[key];
                    loaded++;
                }
            });
            if (loaded > 0) {
                console.log(`âœ… Environment variables loaded from process.env (${loaded} vars)`);
                return;
            }
        }

        // Source 3: Defaults already set in ENV object
        console.log('â„¹ï¸ Using default environment variables');
        console.warn('âš ï¸ No custom environment variables found. Using defaults.');

    } catch (error) {
        console.error('âŒ Failed to load environment variables:', error);
        console.warn('âš ï¸ Using default environment variables');
    }
}

// ============================================================
// VALIDATE ENVIRONMENT VARIABLES
// ============================================================

/**
 * Validate required environment variables
 * @returns {Object} Validation result
 */
export function validateEnv() {
    const result = {
        isValid: true,
        errors: [],
        warnings: []
    };

    // Required Firebase config
    const firebaseRequired = [
        'FIREBASE_API_KEY',
        'FIREBASE_AUTH_DOMAIN',
        'FIREBASE_PROJECT_ID',
        'FIREBASE_STORAGE_BUCKET',
        'FIREBASE_MESSAGING_SENDER_ID',
        'FIREBASE_APP_ID'
    ];

    firebaseRequired.forEach(key => {
        if (!ENV[key] || ENV[key] === '') {
            result.errors.push(`Missing required Firebase config: ${key}`);
            result.isValid = false;
        }
    });

    // Check Firebase values for placeholder patterns
    const placeholderPatterns = [
        'AIzaSy',
        'xxxxxxxx',
        'XXXXXXX',
        'your-',
        'Your',
        'YOUR_',
        'placeholder',
        'example'
    ];

    firebaseRequired.forEach(key => {
        const value = ENV[key];
        if (value) {
            const isPlaceholder = placeholderPatterns.some(pattern => 
                value.includes(pattern) || value === pattern
            );
            if (isPlaceholder) {
                result.warnings.push(`Firebase ${key} appears to use placeholder value. Please update with real value.`);
            }
        }
    });

    // Check environment
    const validEnvs = ['development', 'staging', 'production'];
    if (ENV.APP_ENV && !validEnvs.includes(ENV.APP_ENV)) {
        result.warnings.push(`APP_ENV "${ENV.APP_ENV}" is not standard. Use: ${validEnvs.join(', ')}`);
    }

    // Check upload sizes
    const maxImageSize = parseInt(ENV.MAX_IMAGE_SIZE);
    const maxFileSize = parseInt(ENV.MAX_FILE_SIZE);
    const maxTempSize = parseInt(ENV.MAX_TEMP_SIZE);

    if (isNaN(maxImageSize) || maxImageSize <= 0) {
        result.warnings.push('MAX_IMAGE_SIZE is invalid. Using default.');
        ENV.MAX_IMAGE_SIZE = '10485760';
    }
    if (isNaN(maxFileSize) || maxFileSize <= 0) {
        result.warnings.push('MAX_FILE_SIZE is invalid. Using default.');
        ENV.MAX_FILE_SIZE = '20971520';
    }
    if (isNaN(maxTempSize) || maxTempSize <= 0) {
        result.warnings.push('MAX_TEMP_SIZE is invalid. Using default.');
        ENV.MAX_TEMP_SIZE = '52428800';
    }

    // Check AdMob (warn only, not required)
    if (!ENV.ADMOB_APP_ID || ENV.ADMOB_APP_ID === '' || ENV.ADMOB_APP_ID === 'ca-app-pub-3940256099942544~3347511713') {
        result.warnings.push('ADMOB_APP_ID not set. Using test ID.');
    }
    if (!ENV.ADMOB_BANNER_ID || ENV.ADMOB_BANNER_ID === '') {
        result.warnings.push('ADMOB_BANNER_ID not set. Banner ads will use test ID.');
    }
    if (!ENV.ADMOB_REWARDED_ID || ENV.ADMOB_REWARDED_ID === '') {
        result.warnings.push('ADMOB_REWARDED_ID not set. Rewarded ads will use test ID.');
    }

    // Log results
    if (result.errors.length > 0) {
        console.error('âŒ Environment validation errors:');
        result.errors.forEach(err => console.error(`  - ${err}`));
    }
    if (result.warnings.length > 0) {
        console.warn('âš ï¸ Environment validation warnings:');
        result.warnings.forEach(warn => console.warn(`  - ${warn}`));
    }
    if (result.isValid && result.warnings.length === 0) {
        console.log('âœ… Environment variables validated successfully');
    }

    return result;
}

// ============================================================
// GET ENVIRONMENT VARIABLE
// ============================================================

/**
 * Get an environment variable by key
 * @param {string} key - Environment variable key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Environment variable value
 */
export function getEnv(key, defaultValue = null) {
    try {
        if (ENV[key] !== undefined && ENV[key] !== '') {
            return ENV[key];
        }
        return defaultValue;
    } catch (error) {
        console.warn(`Failed to get environment variable: ${key}`, error);
        return defaultValue;
    }
}

/**
 * Get environment variable as boolean
 * @param {string} key - Environment variable key
 * @param {boolean} defaultValue - Default value
 * @returns {boolean} Boolean value
 */
export function getEnvBoolean(key, defaultValue = false) {
    const value = getEnv(key, String(defaultValue));
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
    }
    return Boolean(value);
}

/**
 * Get environment variable as number
 * @param {string} key - Environment variable key
 * @param {number} defaultValue - Default value
 * @returns {number} Number value
 */
export function getEnvNumber(key, defaultValue = 0) {
    const value = getEnv(key, String(defaultValue));
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
}

/**
 * Get environment variable as array
 * @param {string} key - Environment variable key
 * @param {string} separator - Separator character
 * @param {Array} defaultValue - Default value
 * @returns {Array} Array value
 */
export function getEnvArray(key, separator = ',', defaultValue = []) {
    const value = getEnv(key, '');
    if (!value) return defaultValue;
    return String(value).split(separator).map(item => item.trim()).filter(item => item !== '');
}

// ============================================================
// ENVIRONMENT HELPERS
// ============================================================

/**
 * Check if running in production
 * @returns {boolean}
 */
export function isProduction() {
    return getEnv('APP_ENV', 'development') === 'production';
}

/**
 * Check if running in development
 * @returns {boolean}
 */
export function isDevelopment() {
    return getEnv('APP_ENV', 'development') === 'development';
}

/**
 * Check if running in staging
 * @returns {boolean}
 */
export function isStaging() {
    return getEnv('APP_ENV', 'development') === 'staging';
}

/**
 * Check if analytics is enabled
 * @returns {boolean}
 */
export function isAnalyticsEnabled() {
    return getEnvBoolean('ANALYTICS_ENABLED', true);
}

/**
 * Check if a feature is enabled
 * @param {string} feature - Feature flag name
 * @returns {boolean}
 */
export function isFeatureEnabled(feature) {
    const key = `ENABLE_${feature.toUpperCase()}`;
    return getEnvBoolean(key, false);
}

// ============================================================
// EXPOSE ENV TO WINDOW (For runtime injection)
// ============================================================

/**
 * Expose environment variables to window object
 * Allows runtime injection from server-side
 */
export function exposeEnvToWindow() {
    if (typeof window !== 'undefined') {
        window._env_ = window._env_ || {};
        Object.keys(ENV).forEach(key => {
            if (window._env_[key] === undefined || window._env_[key] === '') {
                window._env_[key] = ENV[key];
            }
        });
    }
}

// ============================================================
// REDACT SENSITIVE INFO (For logging)
// ============================================================

/**
 * Get redacted version of env for logging
 * @returns {Object} Redacted environment variables
 */
export function getRedactedEnv() {
    const redacted = {};
    const sensitiveKeys = [
        'API_KEY', 'SECRET', 'PASSWORD', 'TOKEN', 'KEY',
        'CLIENT_SECRET', 'PRIVATE_KEY', 'WEBHOOK_SECRET'
    ];

    Object.keys(ENV).forEach(key => {
        const value = ENV[key];
        const isSensitive = sensitiveKeys.some(k => key.includes(k));
        
        if (isSensitive && value && value.length > 0) {
            redacted[key] = value.substring(0, 4) + '...' + value.substring(value.length - 4);
        } else {
            redacted[key] = value;
        }
    });

    return redacted;
}

// ============================================================
// INITIALIZE ENVIRONMENT
// ============================================================

/**
 * Initialize environment variables
 * Loads and validates all environment variables
 * @returns {Object} Environment variables object
 */
export function initEnv() {
    console.log('ðŸŒ Initializing environment variables...');
    
    // Load environment variables
    loadEnv();
    
    // Expose to window
    exposeEnvToWindow();
    
    // Validate
    const validation = validateEnv();
    
    // Log environment info (redacted)
    const redacted = getRedactedEnv();
    console.log('ðŸ“‹ Environment configuration loaded:');
    console.log(`  - Environment: ${redacted.APP_ENV}`);
    console.log(`  - Project: ${redacted.FIREBASE_PROJECT_ID}`);
    console.log(`  - Analytics: ${redacted.ANALYTICS_ENABLED}`);
    console.log(`  - AdMob: ${redacted.ADMOB_APP_ID ? 'Configured' : 'Not configured'}`);
    
    
    /*    ISKO BAD MAI KHOLNA HAI OR NICHE WARN KA MITANA HAI 
    if (!validation.isValid) {
        console.error('âŒ Environment validation failed. Some features may not work.');
        throw new Error('Environment validation failed');
    }
        */

    if (!validation.isValid) {
        console.warn('⚠️ Environment validation failed, but bypassing in development mode to allow local testing.');
        // throw new Error('Environment validation failed'); // <--- Isko comment out kar do
    }
    
    console.log('âœ… Environment initialization complete');
    return ENV;
}

// ============================================================
// AUTO-INITIALIZE
// ============================================================

// Initialize on import
/*    ISKO BHI KHOLNA HAI NICHE KA SAME MITANA HAI 
try {
    initEnv();
} catch (error) {
    console.error('âŒ Failed to initialize environment:', error);
    // Don't throw - allow app to start with defaults
}
*/

// Initialize on import safely
try {
    initEnv();
} catch (error) {
    console.warn('⚠️ Environment initialization warning (bypassed for development):', error.message);
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default {
    ENV,
    getEnv,
    getEnvBoolean,
    getEnvNumber,
    getEnvArray,
    validateEnv,
    initEnv,
    isProduction,
    isDevelopment,
    isStaging,
    isAnalyticsEnabled,
    isFeatureEnabled,
    getRedactedEnv,
    exposeEnvToWindow
};

// Safe env export for app.js
export const env = {
    APP_NAME: 'ZYMORE',
    APP_ENV: 'development',
    APP_VERSION: '1.0.0',
    API_URL: ''
};

// ============================================================
// END OF FILE: env.js
// ============================================================