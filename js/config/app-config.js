// App Configuration
// ============================================================
// FILE: app-config.js
// PURPOSE: App settings and configuration
// DEPENDENCY: firebase-config.js
// USED BY: All services, screens, widgets
// LOCATION: js/config/app-config.js
// ============================================================

// ============================================================
// IMPORT DEPENDENCIES
// ============================================================

import { ENV } from './env.js';
import { getFirebase, isFirebaseInitialized } from './firebase-config.js';

// ============================================================
// APP CONFIGURATION OBJECT
// ============================================================

/**
 * Application configuration
 * Contains all app settings, feature flags, and constants
 * Values loaded from environment variables with fallbacks
 */

export const APP_VERSION = '1.0.0';
export const APP_CONFIG = {
    // ============================================
    // APP BASIC INFORMATION
    // ============================================
    app: {
        name: ENV.APP_NAME || 'ZYMORE',
        description: ENV.APP_DESCRIPTION || 'Free Digital Marketplace',
        url: ENV.APP_URL || 'https://zymore.web.app',
        version: ENV.APP_VERSION || '1.0.0',
        environment: ENV.APP_ENV || 'development',
        isProduction: (ENV.APP_ENV || 'development') === 'production',
        isDevelopment: (ENV.APP_ENV || 'development') === 'development',
        isStaging: (ENV.APP_ENV || 'development') === 'staging'
    },

    // ============================================
    // FEATURE FLAGS
    // ============================================
    features: {
        enableAiChat: ENV.ENABLE_AI_CHAT === 'true',
        enableImageEditor: ENV.ENABLE_IMAGE_EDITOR === 'true',
        enableSocialLogin: ENV.ENABLE_SOCIAL_LOGIN === 'true',
        enableDarkMode: ENV.ENABLE_DARK_MODE === 'true',
        enablePushNotifications: ENV.ENABLE_PUSH_NOTIFICATIONS === 'true',
        enableOfflineMode: ENV.ENABLE_OFFLINE_MODE === 'true',
        enableSentryLogging: ENV.ENABLE_SENTRY_LOGGING === 'true'
    },

    // ============================================
    // FIREBASE CONFIGURATION
    // ============================================
    firebase: {
        collections: {
            users: ENV.COLLECTION_USERS || 'users',
            products: ENV.COLLECTION_PRODUCTS || 'products',
            reviews: ENV.COLLECTION_REVIEWS || 'reviews',
            history: ENV.COLLECTION_HISTORY || 'history',
            likes: ENV.COLLECTION_LIKES || 'likes',
            categories: ENV.COLLECTION_CATEGORIES || 'categories',
            notifications: ENV.COLLECTION_NOTIFICATIONS || 'notifications',
            reports: ENV.COLLECTION_REPORTS || 'reports',
            downloads: ENV.COLLECTION_DOWNLOADS || 'downloads'
        },
        storage: {
            userProfile: ENV.STORAGE_USER_PROFILE_PATH || 'users/{userId}/profile',
            productImages: ENV.STORAGE_PRODUCT_IMAGES_PATH || 'products/{productId}/images',
            productFiles: ENV.STORAGE_PRODUCT_FILES_PATH || 'products/{productId}/files',
            temp: ENV.STORAGE_TEMP_PATH || 'temp/{userId}',
            cache: ENV.STORAGE_CACHE_PATH || 'cache'
        }
    },

    // ============================================
    // FILE UPLOAD CONFIGURATION
    // ============================================
    upload: {
        maxImageSize: parseInt(ENV.MAX_IMAGE_SIZE) || 10485760, // 10MB
        maxFileSize: parseInt(ENV.MAX_FILE_SIZE) || 20971520,    // 20MB
        maxTempSize: parseInt(ENV.MAX_TEMP_SIZE) || 52428800,    // 50MB
        allowedImageTypes: (ENV.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp,image/svg+xml')
            .split(',').map(type => type.trim()),
        allowedFileTypes: (ENV.ALLOWED_FILE_TYPES || 'application/zip,application/pdf,application/rar,image/*,video/*')
            .split(',').map(type => type.trim())
    },

    // ============================================
    // API CONFIGURATION
    // ============================================
    api: {
        rateLimit: {
            requests: parseInt(ENV.RATE_LIMIT_REQUESTS) || 100,
            window: parseInt(ENV.RATE_LIMIT_WINDOW) || 60000 // 1 minute
        }
    },

    // ============================================
    // CACHE CONFIGURATION
    // ============================================
    cache: {
        staticDuration: parseInt(ENV.CACHE_STATIC_DURATION) || 86400,   // 24 hours
        apiDuration: parseInt(ENV.CACHE_API_DURATION) || 3600,          // 1 hour
        imageDuration: parseInt(ENV.CACHE_IMAGE_DURATION) || 604800,    // 7 days
        productDuration: parseInt(ENV.CACHE_PRODUCT_DURATION) || 3600   // 1 hour
    },

    // ============================================
    // PWA CONFIGURATION
    // ============================================
    pwa: {
        enabled: ENV.PWA_ENABLED === 'true',
        name: ENV.PWA_NAME || 'ZYMORE',
        shortName: ENV.PWA_SHORT_NAME || 'ZYMORE',
        startUrl: ENV.PWA_START_URL || '/',
        themeColor: ENV.PWA_THEME_COLOR || '#FF6B35',
        backgroundColor: ENV.PWA_BACKGROUND_COLOR || '#FFFFFF',
        display: ENV.PWA_DISPLAY || 'standalone',
        orientation: ENV.PWA_ORIENTATION || 'portrait'
    },

    // ============================================
    // SEO CONFIGURATION
    // ============================================
    seo: {
        defaultTitle: ENV.DEFAULT_TITLE || 'ZYMORE - Free Digital Marketplace',
        defaultDescription: ENV.DEFAULT_DESCRIPTION || 'Download high-quality digital assets, wallpapers, icons, and more for free',
        defaultKeywords: ENV.DEFAULT_KEYWORDS || 'digital marketplace, free downloads, wallpapers, icons, assets',
        defaultImage: ENV.DEFAULT_IMAGE || 'https://zymore.web.app/assets/images/og-image.jpg'
    },

    // ============================================
    // SOCIAL MEDIA
    // ============================================
    social: {
        instagram: ENV.SOCIAL_INSTAGRAM || 'https://instagram.com/zymoreapp',
        twitter: ENV.SOCIAL_TWITTER || 'https://twitter.com/zymoreapp',
        youtube: ENV.SOCIAL_YOUTUBE || 'https://youtube.com/@zymoreapp',
        facebook: ENV.SOCIAL_FACEBOOK || 'https://facebook.com/zymoreapp',
        discord: ENV.SOCIAL_DISCORD || 'https://discord.gg/zymore'
    },

    // ============================================
    // ANALYTICS CONFIGURATION
    // ============================================
    analytics: {
        enabled: ENV.ANALYTICS_ENABLED === 'true',
        id: ENV.ANALYTICS_ID || null,
        gtmId: ENV.GTM_ID || null,
        gaMeasurementId: ENV.GA_MEASUREMENT_ID || null
    },

    // ============================================
    // ADMOB CONFIGURATION
    // ============================================
    admob: {
        appId: ENV.ADMOB_APP_ID || null,
        bannerId: ENV.ADMOB_BANNER_ID || null,
        rewardedId: ENV.ADMOB_REWARDED_ID || null,
        interstitialId: ENV.ADMOB_INTERSTITIAL_ID || null,
        nativeId: ENV.ADMOB_NATIVE_ID || null
    },

    // ============================================
    // GOOGLE DRIVE CONFIGURATION
    // ============================================
    drive: {
        apiKey: ENV.GOOGLE_DRIVE_API_KEY || null,
        clientId: ENV.GOOGLE_DRIVE_CLIENT_ID || null,
        clientSecret: ENV.GOOGLE_DRIVE_CLIENT_SECRET || null,
        redirectUri: ENV.GOOGLE_DRIVE_REDIRECT_URI || null,
        scopes: (ENV.GOOGLE_DRIVE_SCOPES || 'https://www.googleapis.com/auth/drive.file')
            .split(',').map(scope => scope.trim())
    },

    // ============================================
    // SENTRY CONFIGURATION
    // ============================================
    sentry: {
        enabled: ENV.SENTRY_ENABLED === 'true',
        dsn: ENV.SENTRY_DSN || null,
        environment: ENV.SENTRY_ENVIRONMENT || 'development'
    },

    // ============================================
    // STRIPE CONFIGURATION (Future)
    // ============================================
    stripe: {
        publishableKey: ENV.STRIPE_PUBLISHABLE_KEY || null,
        secretKey: ENV.STRIPE_SECRET_KEY || null,
        webhookSecret: ENV.STRIPE_WEBHOOK_SECRET || null
    },

    // ============================================
    // RECAPTCHA CONFIGURATION
    // ============================================
    recaptcha: {
        siteKey: ENV.RECAPTCHA_SITE_KEY || null,
        secretKey: ENV.RECAPTCHA_SECRET_KEY || null
    },

    // ============================================
    // EMAILJS CONFIGURATION
    // ============================================
    emailjs: {
        serviceId: ENV.EMAILJS_SERVICE_ID || null,
        templateId: ENV.EMAILJS_TEMPLATE_ID || null,
        userId: ENV.EMAILJS_USER_ID || null
    },

    // ============================================
    // CLOUDINARY CONFIGURATION
    // ============================================
    cloudinary: {
        cloudName: ENV.CLOUDINARY_CLOUD_NAME || null,
        apiKey: ENV.CLOUDINARY_API_KEY || null,
        apiSecret: ENV.CLOUDINARY_API_SECRET || null,
        uploadPreset: ENV.CLOUDINARY_UPLOAD_PRESET || null
    },

    // ============================================
    // ALGOLIA CONFIGURATION (Future)
    // ============================================
    algolia: {
        appId: ENV.ALGOLIA_APP_ID || null,
        apiKey: ENV.ALGOLIA_API_KEY || null,
        indexName: ENV.ALGOLIA_INDEX_NAME || 'products'
    }
};

// ============================================================
// APP CONFIG VALIDATION
// ============================================================

/**
 * Validate app configuration
 * Checks for required values and logs warnings for missing values
 * @returns {Object} Validation result with warnings and errors
 */
export function validateAppConfig() {
    const result = {
        isValid: true,
        warnings: [],
        errors: []
    };

    // Check environment
    const env = APP_CONFIG.app.environment;
    if (!['development', 'staging', 'production'].includes(env)) {
        result.warnings.push(`Unknown environment: ${env}. Using 'development' as fallback.`);
    }

    // Check Firebase collections
    const collections = APP_CONFIG.firebase.collections;
    Object.entries(collections).forEach(([key, value]) => {
        if (!value || value === '') {
            result.errors.push(`Firebase collection "${key}" is not configured.`);
            result.isValid = false;
        }
    });

    // Check upload limits
    const upload = APP_CONFIG.upload;
    if (upload.maxImageSize < 0) {
        result.errors.push('maxImageSize must be greater than 0.');
        result.isValid = false;
    }
    if (upload.maxFileSize < 0) {
        result.errors.push('maxFileSize must be greater than 0.');
        result.isValid = false;
    }
    if (upload.allowedImageTypes.length === 0) {
        result.warnings.push('No allowed image types configured. Using defaults.');
    }

    // Check AdMob (only warn, don't fail)
    const admob = APP_CONFIG.admob;
    if (!admob.appId || admob.appId === '') {
        result.warnings.push('AdMob App ID not configured. Ads will not work.');
    }
    if (!admob.bannerId || admob.bannerId === '') {
        result.warnings.push('AdMob Banner ID not configured. Banner ads will not work.');
    }
    if (!admob.rewardedId || admob.rewardedId === '') {
        result.warnings.push('AdMob Rewarded ID not configured. Rewarded ads will not work.');
    }

    // Check Google Drive
    const drive = APP_CONFIG.drive;
    if (!drive.apiKey || drive.apiKey === '') {
        result.warnings.push('Google Drive API Key not configured. Large file uploads may not work.');
    }
    if (!drive.clientId || drive.clientId === '') {
        result.warnings.push('Google Drive Client ID not configured. Large file uploads may not work.');
    }

    // Check PWA
    const pwa = APP_CONFIG.pwa;
    if (!pwa.name || pwa.name === '') {
        result.errors.push('PWA name is not configured.');
        result.isValid = false;
    }
    if (!pwa.shortName || pwa.shortName === '') {
        result.errors.push('PWA short name is not configured.');
        result.isValid = false;
    }

    // Log validation results
    if (result.errors.length > 0) {
        console.error('âŒ App config validation errors:');
        result.errors.forEach(err => console.error(`  - ${err}`));
    }
    if (result.warnings.length > 0) {
        console.warn('âš ï¸ App config warnings:');
        result.warnings.forEach(warn => console.warn(`  - ${warn}`));
    }
    if (result.isValid && result.warnings.length === 0) {
        console.log('âœ… App config validated successfully');
    }

    return result;
}

// ============================================================
// APP CONFIG GETTERS
// ============================================================

/**
 * Get a specific configuration value
 * @param {string} path - Dot notation path (e.g., 'app.name')
 * @param {*} defaultValue - Default value if path not found
 * @returns {*} Configuration value
 */
export function getConfig(path, defaultValue = null) {
    try {
        const parts = path.split('.');
        let current = APP_CONFIG;
        
        for (const part of parts) {
            if (current === undefined || current === null) {
                return defaultValue;
            }
            current = current[part];
        }
        
        return current !== undefined ? current : defaultValue;
    } catch (error) {
        console.warn(`Failed to get config for path: ${path}`, error);
        return defaultValue;
    }
}

/**
 * Check if a feature is enabled
 * @param {string} featureName - Feature name (e.g., 'enableAiChat')
 * @returns {boolean} True if feature is enabled
 */
export function isFeatureEnabled(featureName) {
    try {
        return APP_CONFIG.features[featureName] === true;
    } catch (error) {
        console.warn(`Feature "${featureName}" not found`, error);
        return false;
    }
}

/**
 * Get the current environment
 * @returns {string} 'development', 'staging', or 'production'
 */
export function getEnvironment() {
    return APP_CONFIG.app.environment;
}

/**
 * Check if app is in production mode
 * @returns {boolean} True if production
 */
export function isProduction() {
    return APP_CONFIG.app.isProduction;
}

/**
 * Check if app is in development mode
 * @returns {boolean} True if development
 */
export function isDevelopment() {
    return APP_CONFIG.app.isDevelopment;
}

// ============================================================
// APP CONFIG INITIALIZATION
// ============================================================

/**
 * Initialize app configuration
 * Validates config and logs status
 * @returns {Object} App configuration
 */
export function initAppConfig() {
    console.log('ðŸ“‹ Initializing app configuration...');
    
    // Validate configuration
    const validation = validateAppConfig();
    
    if (!validation.isValid) {
        console.error('âŒ App configuration is invalid. Some features may not work.');
    }
    
    // Log environment
    const env = APP_CONFIG.app.environment;
    const envEmoji = env === 'production' ? 'ðŸš€' : env === 'staging' ? 'ðŸ§ª' : 'ðŸ› ï¸';
    console.log(`${envEmoji} Environment: ${env}`);
    
    // Log feature status
    const features = APP_CONFIG.features;
    const enabledFeatures = Object.entries(features)
        .filter(([, enabled]) => enabled)
        .map(([name]) => name);
    
    if (enabledFeatures.length > 0) {
        console.log(`âœ… Enabled features: ${enabledFeatures.join(', ')}`);
    }
    
    // Log Firebase status
    const isInitialized = isFirebaseInitialized();
    console.log(`ðŸ”¥ Firebase: ${isInitialized ? 'âœ… Initialized' : 'âŒ Not initialized'}`);
    
    // Log upload limits
    const upload = APP_CONFIG.upload;
    const maxImageMB = (upload.maxImageSize / 1024 / 1024).toFixed(1);
    const maxFileMB = (upload.maxFileSize / 1024 / 1024).toFixed(1);
    console.log(`ðŸ“¤ Max upload: ${maxImageMB}MB (images), ${maxFileMB}MB (files)`);
    
    // Log AdMob status
    const admob = APP_CONFIG.admob;
    const hasAdmob = admob.appId && admob.appId !== '' && 
                      admob.appId !== 'ca-app-pub-3940256099942544~3347511713';
    console.log(`ðŸ“¢ AdMob: ${hasAdmob ? 'âœ… Configured' : 'âš ï¸ Using test IDs'}`);
    
    console.log('âœ… App configuration initialized');
    
    return APP_CONFIG;
}

// ============================================================
// CONFIG UPDATE & RELOAD
// ============================================================

/**
 * Update a configuration value at runtime
 * @param {string} path - Dot notation path
 * @param {*} value - New value
 * @returns {boolean} True if update was successful
 */
export function updateConfig(path, value) {
    try {
        const parts = path.split('.');
        let current = APP_CONFIG;
        
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (current[part] === undefined) {
                current[part] = {};
            }
            current = current[part];
        }
        
        const lastPart = parts[parts.length - 1];
        const oldValue = current[lastPart];
        current[lastPart] = value;
        
        console.log(`ðŸ”„ Config updated: ${path} = ${value} (was ${oldValue})`);
        return true;
    } catch (error) {
        console.error(`âŒ Failed to update config: ${path}`, error);
        return false;
    }
}

/**
 * Reload configuration from environment variables
 * Useful for runtime environment changes
 * @returns {Object} Updated configuration
 */
export function reloadConfig() {
    console.log('ðŸ”„ Reloading app configuration...');
    
    // Re-import environment variables (if module system supports it)
    // This is a simple implementation - in production, you might need
    // to fetch from a server or use a more sophisticated approach
    
    // For now, just re-initialize with existing values
    return initAppConfig();
}

// ============================================================
// CONFIG HELPERS
// ============================================================

/**
 * Get Firebase collection name
 * @param {string} collectionKey - Collection key (e.g., 'users')
 * @returns {string} Collection name
 */
export function getCollectionName(collectionKey) {
    return APP_CONFIG.firebase.collections[collectionKey] || collectionKey;
}

/**
 * Get Firebase storage path
 * @param {string} pathKey - Path key (e.g., 'userProfile')
 * @returns {string} Storage path
 */
export function getStoragePath(pathKey) {
    return APP_CONFIG.firebase.storage[pathKey] || pathKey;
}

/**
 * Check if a file type is allowed for upload
 * @param {string} mimeType - MIME type to check
 * @param {string} type - 'image' or 'file'
 * @returns {boolean} True if allowed
 */
export function isFileTypeAllowed(mimeType, type = 'file') {
    const allowedTypes = type === 'image' 
        ? APP_CONFIG.upload.allowedImageTypes 
        : APP_CONFIG.upload.allowedFileTypes;
    
    // Check exact match
    if (allowedTypes.includes(mimeType)) {
        return true;
    }
    
    // Check wildcard match (e.g., 'image/*')
    for (const pattern of allowedTypes) {
        if (pattern.endsWith('/*')) {
            const prefix = pattern.slice(0, -2);
            if (mimeType.startsWith(prefix)) {
                return true;
            }
        }
    }
    
    return false;
}

/**
 * Check if file size is within limits
 * @param {number} size - File size in bytes
 * @param {string} type - 'image' or 'file'
 * @returns {boolean} True if within limits
 */
export function isFileSizeAllowed(size, type = 'file') {
    const maxSize = type === 'image' 
        ? APP_CONFIG.upload.maxImageSize 
        : APP_CONFIG.upload.maxFileSize;
    return size <= maxSize;
}

/**
 * Format file size for display
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size (e.g., '2.5 MB')
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = (bytes / Math.pow(k, i)).toFixed(1);
    return `${size} ${sizes[i]}`;
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default {
    APP_CONFIG,
    validateAppConfig,
    initAppConfig,
    getConfig,
    isFeatureEnabled,
    getEnvironment,
    isProduction,
    isDevelopment,
    updateConfig,
    reloadConfig,
    getCollectionName,
    getStoragePath,
    isFileTypeAllowed,
    isFileSizeAllowed,
    formatFileSize
};

// ============================================================
// AUTO-INITIALIZE
// ============================================================

// Initialize app config when module is imported
try {
    initAppConfig();
} catch (error) {
    console.error('âŒ Failed to initialize app config:', error);
}

export const getAppConfig = () => APP_CONFIG;


// ============================================================
// END OF FILE: app-config.js
// ============================================================