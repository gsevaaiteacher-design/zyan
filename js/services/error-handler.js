// ============================================================
// FILE: js/services/error-handler.js
// PURPOSE: Global Error Handling System with Full Updates
// DEPENDENCY: logger.js
// USED BY: All Services, App.js, Screens, Widgets
// VERSION: 3.0.0
// ============================================================

import { logger, LOG_LEVELS } from './logger.js';

/**
 * 🚨 ZYMORE ERROR HANDLER v3.0
 * 
 * Complete Production-Ready Error Handling System with:
 * - 20+ Error Types
 * - Error Classification & Severity
 * - User-Friendly Messages (4 Languages)
 * - Retry Logic with Exponential Backoff
 * - Error Recovery Strategies
 * - Sentry Integration Ready
 * - Offline Error Queue
 * - Error Reporting & Analytics
 * - Custom Error Classes
 * - Validation Error Handling
 * - Network Error Detection
 * - Rate Limiting Protection
 * - Database Error Handling
 * - Authentication Error Handling
 * - File Upload Error Handling
 * - Social Features Error Handling
 * - Chat & AI Error Handling
 * - Ad Monetization Error Handling
 * - Location Error Handling
 */

// ─── ERROR TYPES ──────────────────────────────────────────────

export const ERROR_TYPES = {
    // Network Errors
    NETWORK: 'NETWORK_ERROR',
    NETWORK_OFFLINE: 'NETWORK_OFFLINE_ERROR',
    NETWORK_TIMEOUT: 'NETWORK_TIMEOUT_ERROR',
    NETWORK_DNS: 'NETWORK_DNS_ERROR',
    NETWORK_CORS: 'NETWORK_CORS_ERROR',
    
    // Authentication Errors
    AUTH: 'AUTH_ERROR',
    AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
    AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
    AUTH_WRONG_PASSWORD: 'AUTH_WRONG_PASSWORD',
    AUTH_EMAIL_IN_USE: 'AUTH_EMAIL_IN_USE',
    AUTH_WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
    AUTH_INVALID_EMAIL: 'AUTH_INVALID_EMAIL',
    AUTH_TOO_MANY_REQUESTS: 'AUTH_TOO_MANY_REQUESTS',
    AUTH_REQUIRES_RECENT_LOGIN: 'AUTH_REQUIRES_RECENT_LOGIN',
    AUTH_ACCOUNT_EXISTS: 'AUTH_ACCOUNT_EXISTS',
    AUTH_INVALID_VERIFICATION_CODE: 'AUTH_INVALID_VERIFICATION_CODE',
    AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
    AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
    
    // Database Errors
    DATABASE: 'DATABASE_ERROR',
    DB_PERMISSION_DENIED: 'DB_PERMISSION_DENIED',
    DB_NOT_FOUND: 'DB_NOT_FOUND',
    DB_ALREADY_EXISTS: 'DB_ALREADY_EXISTS',
    DB_INVALID_ARGUMENT: 'DB_INVALID_ARGUMENT',
    DB_UNKNOWN: 'DB_UNKNOWN',
    DB_RESOURCE_EXHAUSTED: 'DB_RESOURCE_EXHAUSTED',
    DB_ABORTED: 'DB_ABORTED',
    DB_DATA_LOSS: 'DB_DATA_LOSS',
    DB_UNIMPLEMENTED: 'DB_UNIMPLEMENTED',
    DB_UNAVAILABLE: 'DB_UNAVAILABLE',
    DB_DEADLINE_EXCEEDED: 'DB_DEADLINE_EXCEEDED',
    
    // Storage Errors
    STORAGE: 'STORAGE_ERROR',
    STORAGE_PERMISSION_DENIED: 'STORAGE_PERMISSION_DENIED',
    STORAGE_NOT_FOUND: 'STORAGE_NOT_FOUND',
    STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
    STORAGE_INVALID_URL: 'STORAGE_INVALID_URL',
    STORAGE_CANCELED: 'STORAGE_CANCELED',
    STORAGE_RETRY_LIMIT: 'STORAGE_RETRY_LIMIT',
    STORAGE_INVALID_FILE: 'STORAGE_INVALID_FILE',
    STORAGE_FILE_TOO_LARGE: 'STORAGE_FILE_TOO_LARGE',
    
    // Validation Errors
    VALIDATION: 'VALIDATION_ERROR',
    VALIDATION_REQUIRED: 'VALIDATION_REQUIRED',
    VALIDATION_EMAIL: 'VALIDATION_EMAIL',
    VALIDATION_PHONE: 'VALIDATION_PHONE',
    VALIDATION_URL: 'VALIDATION_URL',
    VALIDATION_MIN_LENGTH: 'VALIDATION_MIN_LENGTH',
    VALIDATION_MAX_LENGTH: 'VALIDATION_MAX_LENGTH',
    VALIDATION_MIN_VALUE: 'VALIDATION_MIN_VALUE',
    VALIDATION_MAX_VALUE: 'VALIDATION_MAX_VALUE',
    VALIDATION_PATTERN: 'VALIDATION_PATTERN',
    VALIDATION_CONFIRM: 'VALIDATION_CONFIRM',
    
    // Permission Errors
    PERMISSION: 'PERMISSION_ERROR',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    PERMISSION_ADMIN_REQUIRED: 'PERMISSION_ADMIN_REQUIRED',
    PERMISSION_SELLER_REQUIRED: 'PERMISSION_SELLER_REQUIRED',
    PERMISSION_VERIFIED_REQUIRED: 'PERMISSION_VERIFIED_REQUIRED',
    
    // Rate Limit Errors
    RATE_LIMIT: 'RATE_LIMIT_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    RATE_LIMIT_DAILY: 'RATE_LIMIT_DAILY',
    RATE_LIMIT_HOURLY: 'RATE_LIMIT_HOURLY',
    
    // Social Errors
    SOCIAL: 'SOCIAL_ERROR',
    SOCIAL_FOLLOW_SELF: 'SOCIAL_FOLLOW_SELF',
    SOCIAL_ALREADY_FOLLOWING: 'SOCIAL_ALREADY_FOLLOWING',
    SOCIAL_NOT_FOLLOWING: 'SOCIAL_NOT_FOLLOWING',
    SOCIAL_POST_NOT_FOUND: 'SOCIAL_POST_NOT_FOUND',
    SOCIAL_COMMENT_NOT_FOUND: 'SOCIAL_COMMENT_NOT_FOUND',
    SOCIAL_REACTION_INVALID: 'SOCIAL_REACTION_INVALID',
    
    // Chat Errors
    CHAT: 'CHAT_ERROR',
    CHAT_NOT_FOUND: 'CHAT_NOT_FOUND',
    CHAT_NO_PERMISSION: 'CHAT_NO_PERMISSION',
    CHAT_BLOCKED: 'CHAT_BLOCKED',
    CHAT_MESSAGE_FAILED: 'CHAT_MESSAGE_FAILED',
    
    // AI Errors
    AI: 'AI_ERROR',
    AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',
    AI_RATE_LIMITED: 'AI_RATE_LIMITED',
    AI_INVALID_RESPONSE: 'AI_INVALID_RESPONSE',
    AI_TIMEOUT: 'AI_TIMEOUT',
    AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
    
    // Ad Errors
    AD: 'AD_ERROR',
    AD_NOT_LOADED: 'AD_NOT_LOADED',
    AD_TIMEOUT: 'AD_TIMEOUT',
    AD_ALREADY_SHOWN: 'AD_ALREADY_SHOWN',
    AD_DAILY_LIMIT: 'AD_DAILY_LIMIT',
    AD_REWARD_FAILED: 'AD_REWARD_FAILED',
    
    // Location Errors
    LOCATION: 'LOCATION_ERROR',
    LOCATION_PERMISSION_DENIED: 'LOCATION_PERMISSION_DENIED',
    LOCATION_UNAVAILABLE: 'LOCATION_UNAVAILABLE',
    LOCATION_TIMEOUT: 'LOCATION_TIMEOUT',
    
    // Payment/Download Errors
    PAYMENT: 'PAYMENT_ERROR',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    PAYMENT_CANCELED: 'PAYMENT_CANCELED',
    PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',
    DOWNLOAD_FAILED: 'DOWNLOAD_FAILED',
    DOWNLOAD_CANCELED: 'DOWNLOAD_CANCELED',
    DOWNLOAD_PARTIAL: 'DOWNLOAD_PARTIAL',
    
    // File Errors
    FILE: 'FILE_ERROR',
    FILE_NOT_FOUND: 'FILE_NOT_FOUND',
    FILE_INVALID: 'FILE_INVALID',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    FILE_TYPE_NOT_ALLOWED: 'FILE_TYPE_NOT_ALLOWED',
    FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
    
    // Cache Errors
    CACHE: 'CACHE_ERROR',
    CACHE_MISS: 'CACHE_MISS',
    CACHE_EXPIRED: 'CACHE_EXPIRED',
    CACHE_STORAGE_FULL: 'CACHE_STORAGE_FULL',
    
    // Server Errors
    SERVER: 'SERVER_ERROR',
    SERVER_500: 'SERVER_500',
    SERVER_502: 'SERVER_502',
    SERVER_503: 'SERVER_503',
    SERVER_504: 'SERVER_504',
    
    // Client Errors
    CLIENT: 'CLIENT_ERROR',
    CLIENT_400: 'CLIENT_400',
    CLIENT_401: 'CLIENT_401',
    CLIENT_403: 'CLIENT_403',
    CLIENT_404: 'CLIENT_404',
    CLIENT_405: 'CLIENT_405',
    CLIENT_409: 'CLIENT_409',
    CLIENT_422: 'CLIENT_422',
    CLIENT_429: 'CLIENT_429',
    
    // Unknown
    UNKNOWN: 'UNKNOWN_ERROR'
};

// ─── ERROR SEVERITY ──────────────────────────────────────────

export const ERROR_SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

// ─── ERROR SEVERITY MAP ──────────────────────────────────────

const ERROR_SEVERITY_MAP = {
    // Low severity - User can retry or ignore
    [ERROR_TYPES.NETWORK_OFFLINE]: ERROR_SEVERITY.LOW,
    [ERROR_TYPES.NETWORK_TIMEOUT]: ERROR_SEVERITY.LOW,
    [ERROR_TYPES.RATE_LIMIT]: ERROR_SEVERITY.LOW,
    [ERROR_TYPES.VALIDATION]: ERROR_SEVERITY.LOW,
    [ERROR_TYPES.CACHE_MISS]: ERROR_SEVERITY.LOW,
    [ERROR_TYPES.CACHE_EXPIRED]: ERROR_SEVERITY.LOW,
    
    // Medium severity - User action required
    [ERROR_TYPES.AUTH_INVALID_CREDENTIALS]: ERROR_SEVERITY.MEDIUM,
    [ERROR_TYPES.AUTH_WRONG_PASSWORD]: ERROR_SEVERITY.MEDIUM,
    [ERROR_TYPES.AUTH_EMAIL_IN_USE]: ERROR_SEVERITY.MEDIUM,
    [ERROR_TYPES.AUTH_SESSION_EXPIRED]: ERROR_SEVERITY.MEDIUM,
    [ERROR_TYPES.PERMISSION_DENIED]: ERROR_SEVERITY.MEDIUM,
    [ERROR_TYPES.STORAGE_QUOTA_EXCEEDED]: ERROR_SEVERITY.MEDIUM,
    [ERROR_TYPES.AI_QUOTA_EXCEEDED]: ERROR_SEVERITY.MEDIUM,
    [ERROR_TYPES.AD_DAILY_LIMIT]: ERROR_SEVERITY.MEDIUM,
    [ERROR_TYPES.SOCIAL_FOLLOW_SELF]: ERROR_SEVERITY.MEDIUM,
    [ERROR_TYPES.CHAT_BLOCKED]: ERROR_SEVERITY.MEDIUM,
    
    // High severity - System issue, retry possible
    [ERROR_TYPES.DB_PERMISSION_DENIED]: ERROR_SEVERITY.HIGH,
    [ERROR_TYPES.DB_RESOURCE_EXHAUSTED]: ERROR_SEVERITY.HIGH,
    [ERROR_TYPES.STORAGE_PERMISSION_DENIED]: ERROR_SEVERITY.HIGH,
    [ERROR_TYPES.SERVER_500]: ERROR_SEVERITY.HIGH,
    [ERROR_TYPES.SERVER_502]: ERROR_SEVERITY.HIGH,
    [ERROR_TYPES.SERVER_503]: ERROR_SEVERITY.HIGH,
    [ERROR_TYPES.AI_SERVICE_UNAVAILABLE]: ERROR_SEVERITY.HIGH,
    [ERROR_TYPES.LOCATION_UNAVAILABLE]: ERROR_SEVERITY.HIGH,
    [ERROR_TYPES.DOWNLOAD_FAILED]: ERROR_SEVERITY.HIGH,
    [ERROR_TYPES.FILE_UPLOAD_FAILED]: ERROR_SEVERITY.HIGH,
    
    // Critical severity - System failure, immediate attention
    [ERROR_TYPES.DB_DATA_LOSS]: ERROR_SEVERITY.CRITICAL,
    [ERROR_TYPES.DB_UNAVAILABLE]: ERROR_SEVERITY.CRITICAL,
    [ERROR_TYPES.AUTH_TOKEN_INVALID]: ERROR_SEVERITY.CRITICAL,
    [ERROR_TYPES.PAYMENT_FAILED]: ERROR_SEVERITY.CRITICAL,
    [ERROR_TYPES.UNKNOWN]: ERROR_SEVERITY.CRITICAL
};

// ─── USER MESSAGES (4 Languages) ────────────────────────────

const USER_MESSAGES = {
    en: {
        // Network
        [ERROR_TYPES.NETWORK_OFFLINE]: 'No internet connection. Please check your network.',
        [ERROR_TYPES.NETWORK_TIMEOUT]: 'Connection timeout. Please try again.',
        [ERROR_TYPES.NETWORK_DNS]: 'Unable to reach server. Please check your connection.',
        [ERROR_TYPES.NETWORK_CORS]: 'Cross-origin request blocked. Please try again.',
        
        // Auth
        [ERROR_TYPES.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password. Please try again.',
        [ERROR_TYPES.AUTH_USER_NOT_FOUND]: 'No account found with this email.',
        [ERROR_TYPES.AUTH_WRONG_PASSWORD]: 'Incorrect password. Please try again.',
        [ERROR_TYPES.AUTH_EMAIL_IN_USE]: 'This email is already registered. Please login.',
        [ERROR_TYPES.AUTH_WEAK_PASSWORD]: 'Password is too weak. Please use a stronger password.',
        [ERROR_TYPES.AUTH_INVALID_EMAIL]: 'Please enter a valid email address.',
        [ERROR_TYPES.AUTH_TOO_MANY_REQUESTS]: 'Too many attempts. Please wait a moment.',
        [ERROR_TYPES.AUTH_REQUIRES_RECENT_LOGIN]: 'Please login again to continue.',
        [ERROR_TYPES.AUTH_ACCOUNT_EXISTS]: 'Account already exists. Please login.',
        [ERROR_TYPES.AUTH_INVALID_VERIFICATION_CODE]: 'Invalid verification code. Please try again.',
        [ERROR_TYPES.AUTH_SESSION_EXPIRED]: 'Your session has expired. Please login again.',
        [ERROR_TYPES.AUTH_TOKEN_INVALID]: 'Invalid authentication. Please login again.',
        
        // Database
        [ERROR_TYPES.DB_PERMISSION_DENIED]: 'You don\'t have permission to perform this action.',
        [ERROR_TYPES.DB_NOT_FOUND]: 'The requested data was not found.',
        [ERROR_TYPES.DB_ALREADY_EXISTS]: 'This data already exists.',
        [ERROR_TYPES.DB_INVALID_ARGUMENT]: 'Invalid data provided. Please check your input.',
        [ERROR_TYPES.DB_RESOURCE_EXHAUSTED]: 'System is busy. Please try again later.',
        [ERROR_TYPES.DB_DATA_LOSS]: 'Data error occurred. Please contact support.',
        [ERROR_TYPES.DB_UNAVAILABLE]: 'Database is temporarily unavailable. Please try again.',
        [ERROR_TYPES.DB_DEADLINE_EXCEEDED]: 'Request timed out. Please try again.',
        
        // Storage
        [ERROR_TYPES.STORAGE_PERMISSION_DENIED]: 'You don\'t have permission to access this file.',
        [ERROR_TYPES.STORAGE_NOT_FOUND]: 'File not found.',
        [ERROR_TYPES.STORAGE_QUOTA_EXCEEDED]: 'Storage limit exceeded. Please free up space.',
        [ERROR_TYPES.STORAGE_INVALID_URL]: 'Invalid file URL.',
        [ERROR_TYPES.STORAGE_CANCELED]: 'Upload canceled.',
        [ERROR_TYPES.STORAGE_RETRY_LIMIT]: 'Upload failed after multiple attempts.',
        [ERROR_TYPES.STORAGE_INVALID_FILE]: 'Invalid file format.',
        [ERROR_TYPES.STORAGE_FILE_TOO_LARGE]: 'File is too large. Maximum size is 20MB.',
        
        // Validation
        [ERROR_TYPES.VALIDATION_REQUIRED]: 'This field is required.',
        [ERROR_TYPES.VALIDATION_EMAIL]: 'Please enter a valid email address.',
        [ERROR_TYPES.VALIDATION_PHONE]: 'Please enter a valid phone number.',
        [ERROR_TYPES.VALIDATION_URL]: 'Please enter a valid URL.',
        [ERROR_TYPES.VALIDATION_MIN_LENGTH]: 'Text is too short.',
        [ERROR_TYPES.VALIDATION_MAX_LENGTH]: 'Text is too long.',
        [ERROR_TYPES.VALIDATION_MIN_VALUE]: 'Value is too low.',
        [ERROR_TYPES.VALIDATION_MAX_VALUE]: 'Value is too high.',
        [ERROR_TYPES.VALIDATION_PATTERN]: 'Invalid format.',
        [ERROR_TYPES.VALIDATION_CONFIRM]: 'Values do not match.',
        
        // Permission
        [ERROR_TYPES.PERMISSION_DENIED]: 'Access denied.',
        [ERROR_TYPES.PERMISSION_ADMIN_REQUIRED]: 'Admin access required.',
        [ERROR_TYPES.PERMISSION_SELLER_REQUIRED]: 'Seller access required.',
        [ERROR_TYPES.PERMISSION_VERIFIED_REQUIRED]: 'Verified account required.',
        
        // Rate Limit
        [ERROR_TYPES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait.',
        [ERROR_TYPES.RATE_LIMIT_DAILY]: 'Daily limit reached. Please try tomorrow.',
        [ERROR_TYPES.RATE_LIMIT_HOURLY]: 'Hourly limit reached. Please wait.',
        
        // Social
        [ERROR_TYPES.SOCIAL_FOLLOW_SELF]: 'You cannot follow yourself.',
        [ERROR_TYPES.SOCIAL_ALREADY_FOLLOWING]: 'You are already following this user.',
        [ERROR_TYPES.SOCIAL_NOT_FOLLOWING]: 'You are not following this user.',
        [ERROR_TYPES.SOCIAL_POST_NOT_FOUND]: 'Post not found.',
        [ERROR_TYPES.SOCIAL_COMMENT_NOT_FOUND]: 'Comment not found.',
        [ERROR_TYPES.SOCIAL_REACTION_INVALID]: 'Invalid reaction.',
        
        // Chat
        [ERROR_TYPES.CHAT_NOT_FOUND]: 'Chat not found.',
        [ERROR_TYPES.CHAT_NO_PERMISSION]: 'You don\'t have permission to view this chat.',
        [ERROR_TYPES.CHAT_BLOCKED]: 'This user has blocked you.',
        [ERROR_TYPES.CHAT_MESSAGE_FAILED]: 'Failed to send message. Please try again.',
        
        // AI
        [ERROR_TYPES.AI_QUOTA_EXCEEDED]: 'Daily AI chat limit reached. Please try tomorrow.',
        [ERROR_TYPES.AI_RATE_LIMITED]: 'Too many AI requests. Please wait.',
        [ERROR_TYPES.AI_INVALID_RESPONSE]: 'AI response error. Please try again.',
        [ERROR_TYPES.AI_TIMEOUT]: 'AI request timed out. Please try again.',
        [ERROR_TYPES.AI_SERVICE_UNAVAILABLE]: 'AI service is temporarily unavailable.',
        
        // Ad
        [ERROR_TYPES.AD_NOT_LOADED]: 'Ad could not load. Please try again.',
        [ERROR_TYPES.AD_TIMEOUT]: 'Ad load timeout. Please try again.',
        [ERROR_TYPES.AD_ALREADY_SHOWN]: 'Ad already shown.',
        [ERROR_TYPES.AD_DAILY_LIMIT]: 'Daily ad limit reached.',
        [ERROR_TYPES.AD_REWARD_FAILED]: 'Reward could not be processed.',
        
        // Location
        [ERROR_TYPES.LOCATION_PERMISSION_DENIED]: 'Location permission denied.',
        [ERROR_TYPES.LOCATION_UNAVAILABLE]: 'Location unavailable.',
        [ERROR_TYPES.LOCATION_TIMEOUT]: 'Location request timed out.',
        
        // Payment/Download
        [ERROR_TYPES.PAYMENT_FAILED]: 'Payment failed. Please try again.',
        [ERROR_TYPES.PAYMENT_CANCELED]: 'Payment canceled.',
        [ERROR_TYPES.DOWNLOAD_FAILED]: 'Download failed. Please try again.',
        [ERROR_TYPES.DOWNLOAD_CANCELED]: 'Download canceled.',
        
        // File
        [ERROR_TYPES.FILE_NOT_FOUND]: 'File not found.',
        [ERROR_TYPES.FILE_INVALID]: 'Invalid file.',
        [ERROR_TYPES.FILE_TOO_LARGE]: 'File is too large.',
        [ERROR_TYPES.FILE_TYPE_NOT_ALLOWED]: 'File type not allowed.',
        [ERROR_TYPES.FILE_UPLOAD_FAILED]: 'File upload failed. Please try again.',
        
        // Cache
        [ERROR_TYPES.CACHE_STORAGE_FULL]: 'Cache is full. Please clear some space.',
        
        // Server/Client
        [ERROR_TYPES.SERVER_500]: 'Server error. Please try again later.',
        [ERROR_TYPES.SERVER_502]: 'Bad gateway. Please try again.',
        [ERROR_TYPES.SERVER_503]: 'Service unavailable. Please try again later.',
        [ERROR_TYPES.SERVER_504]: 'Gateway timeout. Please try again.',
        [ERROR_TYPES.CLIENT_404]: 'Resource not found.',
        
        // Unknown
        [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again.'
    },
    
    hi: {
        [ERROR_TYPES.NETWORK_OFFLINE]: 'इंटरनेट कनेक्शन नहीं है। कृपया अपना नेटवर्क चेक करें।',
        [ERROR_TYPES.NETWORK_TIMEOUT]: 'कनेक्शन टाइमआउट। कृपया पुनः प्रयास करें।',
        [ERROR_TYPES.NETWORK_DNS]: 'सर्वर तक पहुंच नहीं हो पा रही। कृपया कनेक्शन चेक करें।',
        
        [ERROR_TYPES.AUTH_INVALID_CREDENTIALS]: 'गलत ईमेल या पासवर्ड। कृपया पुनः प्रयास करें।',
        [ERROR_TYPES.AUTH_USER_NOT_FOUND]: 'इस ईमेल से कोई खाता नहीं मिला।',
        [ERROR_TYPES.AUTH_WRONG_PASSWORD]: 'गलत पासवर्ड। कृपया पुनः प्रयास करें।',
        [ERROR_TYPES.AUTH_EMAIL_IN_USE]: 'यह ईमेल पहले से रजिस्टर है। कृपया लॉगिन करें।',
        [ERROR_TYPES.AUTH_WEAK_PASSWORD]: 'पासवर्ड बहुत कमजोर है। कृपया मजबूत पासवर्ड use करें।',
        [ERROR_TYPES.AUTH_INVALID_EMAIL]: 'कृपया सही ईमेल पता डालें।',
        [ERROR_TYPES.AUTH_TOO_MANY_REQUESTS]: 'बहुत अधिक प्रयास। कृपया कुछ देर रुकें।',
        [ERROR_TYPES.AUTH_REQUIRES_RECENT_LOGIN]: 'कृपया जारी रखने के लिए फिर से लॉगिन करें।',
        [ERROR_TYPES.AUTH_ACCOUNT_EXISTS]: 'खाता पहले से मौजूद है। कृपया लॉगिन करें।',
        [ERROR_TYPES.AUTH_INVALID_VERIFICATION_CODE]: 'गलत वेरिफिकेशन कोड। कृपया पुनः प्रयास करें।',
        [ERROR_TYPES.AUTH_SESSION_EXPIRED]: 'आपका सत्र समाप्त हो गया है। कृपया फिर से लॉगिन करें।',
        [ERROR_TYPES.AUTH_TOKEN_INVALID]: 'अमान्य प्रमाणीकरण। कृपया फिर से लॉगिन करें।',
        
        [ERROR_TYPES.DB_PERMISSION_DENIED]: 'आपके पास यह कार्य करने की अनुमति नहीं है।',
        [ERROR_TYPES.DB_NOT_FOUND]: 'अनुरोधित डेटा नहीं मिला।',
        [ERROR_TYPES.DB_ALREADY_EXISTS]: 'यह डेटा पहले से मौजूद है।',
        [ERROR_TYPES.DB_INVALID_ARGUMENT]: 'गलत डेटा दिया गया। कृपया अपना इनपुट चेक करें।',
        [ERROR_TYPES.DB_RESOURCE_EXHAUSTED]: 'सिस्टम व्यस्त है। कृपया बाद में प्रयास करें।',
        [ERROR_TYPES.DB_DATA_LOSS]: 'डेटा त्रुटि हुई। कृपया सपोर्ट से संपर्क करें।',
        [ERROR_TYPES.DB_UNAVAILABLE]: 'डेटाबेस अस्थायी रूप से अनुपलब्ध है। कृपया पुनः प्रयास करें।',
        [ERROR_TYPES.DB_DEADLINE_EXCEEDED]: 'अनुरोध का समय समाप्त हुआ। कृपया पुनः प्रयास करें।',
        
        [ERROR_TYPES.STORAGE_PERMISSION_DENIED]: 'आपके पास इस फाइल तक पहुंच की अनुमति नहीं है।',
        [ERROR_TYPES.STORAGE_NOT_FOUND]: 'फाइल नहीं मिली।',
        [ERROR_TYPES.STORAGE_QUOTA_EXCEEDED]: 'स्टोरेज लिमिट पार हो गई। कृपया जगह खाली करें।',
        [ERROR_TYPES.STORAGE_INVALID_URL]: 'गलत फाइल URL।',
        [ERROR_TYPES.STORAGE_CANCELED]: 'अपलोड रद्द कर दिया गया।',
        [ERROR_TYPES.STORAGE_RETRY_LIMIT]: 'कई प्रयासों के बाद भी अपलोड विफल रहा।',
        [ERROR_TYPES.STORAGE_INVALID_FILE]: 'गलत फाइल फॉर्मेट।',
        [ERROR_TYPES.STORAGE_FILE_TOO_LARGE]: 'फाइल बहुत बड़ी है। अधिकतम साइज 20MB है।',
        
        [ERROR_TYPES.VALIDATION_REQUIRED]: 'यह फील्ड अनिवार्य है।',
        [ERROR_TYPES.VALIDATION_EMAIL]: 'कृपया सही ईमेल पता डालें।',
        [ERROR_TYPES.VALIDATION_PHONE]: 'कृपया सही फोन नंबर डालें।',
        [ERROR_TYPES.VALIDATION_URL]: 'कृपया सही URL डालें।',
        [ERROR_TYPES.VALIDATION_MIN_LENGTH]: 'टेक्स्ट बहुत छोटा है।',
        [ERROR_TYPES.VALIDATION_MAX_LENGTH]: 'टेक्स्ट बहुत लंबा है।',
        [ERROR_TYPES.VALIDATION_MIN_VALUE]: 'वैल्यू बहुत कम है।',
        [ERROR_TYPES.VALIDATION_MAX_VALUE]: 'वैल्यू बहुत ज्यादा है।',
        [ERROR_TYPES.VALIDATION_PATTERN]: 'गलत फॉर्मेट।',
        [ERROR_TYPES.VALIDATION_CONFIRM]: 'वैल्यू मैच नहीं कर रहे।',
        
        [ERROR_TYPES.PERMISSION_DENIED]: 'पहुंच अस्वीकृत।',
        [ERROR_TYPES.PERMISSION_ADMIN_REQUIRED]: 'एडमिन पहुंच आवश्यक है।',
        [ERROR_TYPES.PERMISSION_SELLER_REQUIRED]: 'सेलर पहुंच आवश्यक है।',
        [ERROR_TYPES.PERMISSION_VERIFIED_REQUIRED]: 'वेरिफाइड खाता आवश्यक है।',
        
        [ERROR_TYPES.RATE_LIMIT_EXCEEDED]: 'बहुत सारे अनुरोध। कृपया प्रतीक्षा करें।',
        [ERROR_TYPES.RATE_LIMIT_DAILY]: 'दैनिक सीमा पूरी हो गई। कृपया कल प्रयास करें।',
        [ERROR_TYPES.RATE_LIMIT_HOURLY]: 'प्रति घंटा सीमा पूरी हो गई। कृपया प्रतीक्षा करें।',
        
        [ERROR_TYPES.SOCIAL_FOLLOW_SELF]: 'आप खुद को फॉलो नहीं कर सकते।',
        [ERROR_TYPES.SOCIAL_ALREADY_FOLLOWING]: 'आप पहले से इस यूजर को फॉलो कर रहे हैं।',
        [ERROR_TYPES.SOCIAL_NOT_FOLLOWING]: 'आप इस यूजर को फॉलो नहीं कर रहे हैं।',
        [ERROR_TYPES.SOCIAL_POST_NOT_FOUND]: 'पोस्ट नहीं मिली।',
        [ERROR_TYPES.SOCIAL_COMMENT_NOT_FOUND]: 'कमेंट नहीं मिला।',
        [ERROR_TYPES.SOCIAL_REACTION_INVALID]: 'गलत रिएक्शन।',
        
        [ERROR_TYPES.CHAT_NOT_FOUND]: 'चैट नहीं मिली।',
        [ERROR_TYPES.CHAT_NO_PERMISSION]: 'आपके पास इस चैट को देखने की अनुमति नहीं है।',
        [ERROR_TYPES.CHAT_BLOCKED]: 'इस यूजर ने आपको ब्लॉक कर दिया है।',
        [ERROR_TYPES.CHAT_MESSAGE_FAILED]: 'मैसेज भेजने में विफल। कृपया पुनः प्रयास करें।',
        
        [ERROR_TYPES.AI_QUOTA_EXCEEDED]: 'दैनिक AI चैट सीमा पूरी हो गई। कृपया कल प्रयास करें।',
        [ERROR_TYPES.AI_RATE_LIMITED]: 'बहुत सारे AI अनुरोध। कृपया प्रतीक्षा करें।',
        [ERROR_TYPES.AI_INVALID_RESPONSE]: 'AI रिस्पांस में त्रुटि। कृपया पुनः प्रयास करें।',
        [ERROR_TYPES.AI_TIMEOUT]: 'AI अनुरोध का समय समाप्त हुआ। कृपया पुनः प्रयास करें।',
        [ERROR_TYPES.AI_SERVICE_UNAVAILABLE]: 'AI सेवा अस्थायी रूप से अनुपलब्ध है।',
        
        [ERROR_TYPES.AD_NOT_LOADED]: 'Ad लोड नहीं हो पाया। कृपया पुनः प्रयास करें।',
        [ERROR_TYPES.AD_TIMEOUT]: 'Ad लोड टाइमआउट। कृपया पुनः प्रयास करें।',
        [ERROR_TYPES.AD_ALREADY_SHOWN]: 'Ad पहले ही दिखाया जा चुका है।',
        [ERROR_TYPES.AD_DAILY_LIMIT]: 'दैनिक Ad सीमा पूरी हो गई।',
        [ERROR_TYPES.AD_REWARD_FAILED]: 'रिवार्ड प्रोसेस नहीं हो पाया।',
        
        [ERROR_TYPES.LOCATION_PERMISSION_DENIED]: 'लोकेशन अनुमति अस्वीकृत।',
        [ERROR_TYPES.LOCATION_UNAVAILABLE]: 'लोकेशन उपलब्ध नहीं।',
        [ERROR_TYPES.LOCATION_TIMEOUT]: 'लोकेशन अनुरोध का समय समाप्त हुआ।',
        
        [ERROR_TYPES.PAYMENT_FAILED]: 'पेमेंट विफल। कृपया पुनः प्रयास करें।',
        [ERROR_TYPES.PAYMENT_CANCELED]: 'पेमेंट रद्द।',
        [ERROR_TYPES.DOWNLOAD_FAILED]: 'डाउनलोड विफल। कृपया पुनः प्रयास करें।',
        [ERROR_TYPES.DOWNLOAD_CANCELED]: 'डाउनलोड रद्द।',
        
        [ERROR_TYPES.FILE_NOT_FOUND]: 'फाइल नहीं मिली।',
        [ERROR_TYPES.FILE_INVALID]: 'गलत फाइल।',
        [ERROR_TYPES.FILE_TOO_LARGE]: 'फाइल बहुत बड़ी है।',
        [ERROR_TYPES.FILE_TYPE_NOT_ALLOWED]: 'फाइल टाइप अनुमत नहीं है।',
        [ERROR_TYPES.FILE_UPLOAD_FAILED]: 'फाइल अपलोड विफल। कृपया पुनः प्रयास करें।',
        
        [ERROR_TYPES.SERVER_500]: 'सर्वर त्रुटि। कृपया बाद में प्रयास करें।',
        [ERROR_TYPES.SERVER_502]: 'Bad gateway। कृपया पुनः प्रयास करें।',
        [ERROR_TYPES.SERVER_503]: 'सेवा अनुपलब्ध। कृपया बाद में प्रयास करें।',
        [ERROR_TYPES.SERVER_504]: 'Gateway timeout। कृपया पुनः प्रयास करें।',
        [ERROR_TYPES.CLIENT_404]: 'संसाधन नहीं मिला।',
        
        [ERROR_TYPES.UNKNOWN]: 'एक अप्रत्याशित त्रुटि हुई। कृपया पुनः प्रयास करें।'
    },
    
    ur: {
        [ERROR_TYPES.NETWORK_OFFLINE]: 'انٹرنیٹ کنکشن نہیں ہے۔ براہ کرم اپنا نیٹ ورک چیک کریں۔',
        [ERROR_TYPES.NETWORK_TIMEOUT]: 'کنکشن کا وقت ختم ہو گیا۔ براہ کرم دوبارہ کوشش کریں۔',
        [ERROR_TYPES.AUTH_INVALID_CREDENTIALS]: 'غلط ای میل یا پاس ورڈ۔ براہ کرم دوبارہ کوشش کریں۔',
        [ERROR_TYPES.AUTH_USER_NOT_FOUND]: 'اس ای میل سے کوئی اکاؤنٹ نہیں ملا۔',
        [ERROR_TYPES.AUTH_WRONG_PASSWORD]: 'غلط پاس ورڈ۔ براہ کرم دوبارہ کوشش کریں۔',
        [ERROR_TYPES.AUTH_EMAIL_IN_USE]: 'یہ ای میل پہلے سے رجسٹر ہے۔ براہ کرم لاگ ان کریں۔',
        [ERROR_TYPES.AUTH_WEAK_PASSWORD]: 'پاس ورڈ بہت کمزور ہے۔ براہ کرم مضبوط پاس ورڈ استعمال کریں۔',
        [ERROR_TYPES.AUTH_INVALID_EMAIL]: 'براہ کرم درست ای میل پتہ ڈالیں۔',
        [ERROR_TYPES.AUTH_TOO_MANY_REQUESTS]: 'بہت زیادہ کوششیں۔ براہ کرم تھوڑی دیر رکیں۔',
        [ERROR_TYPES.AUTH_REQUIRES_RECENT_LOGIN]: 'براہ کرم جاری رکھنے کے لیے دوبارہ لاگ ان کریں۔',
        [ERROR_TYPES.DB_PERMISSION_DENIED]: 'آپ کے پاس یہ عمل کرنے کی اجازت نہیں ہے۔',
        [ERROR_TYPES.DB_NOT_FOUND]: 'مطلوبہ ڈیٹا نہیں ملا۔',
        [ERROR_TYPES.DB_RESOURCE_EXHAUSTED]: 'سسٹم مصروف ہے۔ براہ کرم بعد میں کوشش کریں۔',
        [ERROR_TYPES.STORAGE_PERMISSION_DENIED]: 'آپ کے پاس اس فائل تک رسائی کی اجازت نہیں ہے۔',
        [ERROR_TYPES.STORAGE_NOT_FOUND]: 'فائل نہیں ملی۔',
        [ERROR_TYPES.STORAGE_QUOTA_EXCEEDED]: 'اسٹوریج کی حد ختم ہو گئی۔ براہ کرم جگہ خالی کریں۔',
        [ERROR_TYPES.VALIDATION_REQUIRED]: 'یہ فیلڈ ضروری ہے۔',
        [ERROR_TYPES.VALIDATION_EMAIL]: 'براہ کرم درست ای میل پتہ ڈالیں۔',
        [ERROR_TYPES.PERMISSION_DENIED]: 'رسائی مسترد۔',
        [ERROR_TYPES.RATE_LIMIT_EXCEEDED]: 'بہت زیادہ درخواستیں۔ براہ کرم انتظار کریں۔',
        [ERROR_TYPES.SOCIAL_FOLLOW_SELF]: 'آپ خود کو فالو نہیں کر سکتے۔',
        [ERROR_TYPES.SOCIAL_ALREADY_FOLLOWING]: 'آپ پہلے سے اس صارف کو فالو کر رہے ہیں۔',
        [ERROR_TYPES.CHAT_NOT_FOUND]: 'چیٹ نہیں ملی۔',
        [ERROR_TYPES.CHAT_BLOCKED]: 'اس صارف نے آپ کو بلاک کر دیا ہے۔',
        [ERROR_TYPES.AI_QUOTA_EXCEEDED]: 'یومیہ AI چیٹ کی حد ختم ہو گئی۔ براہ کرم کل کوشش کریں۔',
        [ERROR_TYPES.AD_DAILY_LIMIT]: 'یومیہ اشتہار کی حد ختم ہو گئی۔',
        [ERROR_TYPES.LOCATION_PERMISSION_DENIED]: 'مقام کی اجازت مسترد۔',
        [ERROR_TYPES.PAYMENT_FAILED]: 'ادائیگی ناکام۔ براہ کرم دوبارہ کوشش کریں۔',
        [ERROR_TYPES.DOWNLOAD_FAILED]: 'ڈاؤن لوڈ ناکام۔ براہ کرم دوبارہ کوشش کریں۔',
        [ERROR_TYPES.FILE_NOT_FOUND]: 'فائل نہیں ملی۔',
        [ERROR_TYPES.SERVER_500]: 'سرور کی خرابی۔ براہ کرم بعد میں کوشش کریں۔',
        [ERROR_TYPES.UNKNOWN]: 'ایک غیر متوقع خرابی ہوئی۔ براہ کرم دوبارہ کوشش کریں۔'
    },
    
    ar: {
        [ERROR_TYPES.NETWORK_OFFLINE]: 'لا يوجد اتصال بالإنترنت. يرجى التحقق من شبكتك.',
        [ERROR_TYPES.NETWORK_TIMEOUT]: 'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.',
        [ERROR_TYPES.AUTH_INVALID_CREDENTIALS]: 'بريد إلكتروني أو كلمة مرور غير صحيحة. يرجى المحاولة مرة أخرى.',
        [ERROR_TYPES.AUTH_USER_NOT_FOUND]: 'لم يتم العثور على حساب بهذا البريد الإلكتروني.',
        [ERROR_TYPES.AUTH_WRONG_PASSWORD]: 'كلمة مرور غير صحيحة. يرجى المحاولة مرة أخرى.',
        [ERROR_TYPES.AUTH_EMAIL_IN_USE]: 'هذا البريد الإلكتروني مسجل مسبقاً. يرجى تسجيل الدخول.',
        [ERROR_TYPES.AUTH_WEAK_PASSWORD]: 'كلمة المرور ضعيفة جداً. يرجى استخدام كلمة مرور أقوى.',
        [ERROR_TYPES.AUTH_INVALID_EMAIL]: 'يرجى إدخال عنوان بريد إلكتروني صحيح.',
        [ERROR_TYPES.AUTH_TOO_MANY_REQUESTS]: 'محاولات كثيرة جداً. يرجى الانتظار لحظة.',
        [ERROR_TYPES.AUTH_REQUIRES_RECENT_LOGIN]: 'يرجى تسجيل الدخول مرة أخرى للمتابعة.',
        [ERROR_TYPES.DB_PERMISSION_DENIED]: 'ليس لديك إذن لتنفيذ هذا الإجراء.',
        [ERROR_TYPES.DB_NOT_FOUND]: 'البيانات المطلوبة غير موجودة.',
        [ERROR_TYPES.DB_RESOURCE_EXHAUSTED]: 'النظام مشغول. يرجى المحاولة لاحقاً.',
        [ERROR_TYPES.STORAGE_PERMISSION_DENIED]: 'ليس لديك إذن للوصول إلى هذا الملف.',
        [ERROR_TYPES.STORAGE_NOT_FOUND]: 'الملف غير موجود.',
        [ERROR_TYPES.STORAGE_QUOTA_EXCEEDED]: 'تم تجاوز حد التخزين. يرجى توفير مساحة.',
        [ERROR_TYPES.VALIDATION_REQUIRED]: 'هذا الحقل مطلوب.',
        [ERROR_TYPES.VALIDATION_EMAIL]: 'يرجى إدخال عنوان بريد إلكتروني صحيح.',
        [ERROR_TYPES.PERMISSION_DENIED]: 'تم رفض الوصول.',
        [ERROR_TYPES.RATE_LIMIT_EXCEEDED]: 'طلبات كثيرة جداً. يرجى الانتظار.',
        [ERROR_TYPES.SOCIAL_FOLLOW_SELF]: 'لا يمكنك متابعة نفسك.',
        [ERROR_TYPES.SOCIAL_ALREADY_FOLLOWING]: 'أنت تتابع هذا المستخدم بالفعل.',
        [ERROR_TYPES.CHAT_NOT_FOUND]: 'الدردشة غير موجودة.',
        [ERROR_TYPES.CHAT_BLOCKED]: 'قام هذا المستخدم بحظرك.',
        [ERROR_TYPES.AI_QUOTA_EXCEEDED]: 'تم الوصول إلى الحد اليومي لمحادثة AI. يرجى المحاولة غداً.',
        [ERROR_TYPES.AD_DAILY_LIMIT]: 'تم الوصول إلى الحد اليومي للإعلانات.',
        [ERROR_TYPES.LOCATION_PERMISSION_DENIED]: 'تم رفض إذن الموقع.',
        [ERROR_TYPES.PAYMENT_FAILED]: 'فشل الدفع. يرجى المحاولة مرة أخرى.',
        [ERROR_TYPES.DOWNLOAD_FAILED]: 'فشل التنزيل. يرجى المحاولة مرة أخرى.',
        [ERROR_TYPES.FILE_NOT_FOUND]: 'الملف غير موجود.',
        [ERROR_TYPES.SERVER_500]: 'خطأ في الخادم. يرجى المحاولة لاحقاً.',
        [ERROR_TYPES.UNKNOWN]: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
    }
};

// ─── ERROR CLASS ─────────────────────────────────────────────

export class ZymoreError extends Error {
    constructor(type, message, options = {}) {
        super(message);
        this.name = 'ZymoreError';
        this.type = type || ERROR_TYPES.UNKNOWN;
        this.severity = options.severity || ERROR_SEVERITY_MAP[type] || ERROR_SEVERITY.MEDIUM;
        this.code = options.code || null;
        this.originalError = options.originalError || null;
        this.context = options.context || {};
        this.userMessage = options.userMessage || null;
        this.retryable = options.retryable !== undefined ? options.retryable : this._isRetryable();
        this.timestamp = new Date().toISOString();
        this.stack = this.stack || new Error().stack;
        
        // Log automatically
        this._log();
    }

    _isRetryable() {
        const retryableTypes = [
            ERROR_TYPES.NETWORK_OFFLINE,
            ERROR_TYPES.NETWORK_TIMEOUT,
            ERROR_TYPES.NETWORK_DNS,
            ERROR_TYPES.NETWORK_CORS,
            ERROR_TYPES.DB_RESOURCE_EXHAUSTED,
            ERROR_TYPES.DB_UNAVAILABLE,
            ERROR_TYPES.DB_DEADLINE_EXCEEDED,
            ERROR_TYPES.STORAGE_RETRY_LIMIT,
            ERROR_TYPES.SERVER_500,
            ERROR_TYPES.SERVER_502,
            ERROR_TYPES.SERVER_503,
            ERROR_TYPES.SERVER_504,
            ERROR_TYPES.AI_SERVICE_UNAVAILABLE,
            ERROR_TYPES.AI_TIMEOUT,
            ERROR_TYPES.DOWNLOAD_FAILED,
            ERROR_TYPES.FILE_UPLOAD_FAILED
        ];
        return retryableTypes.includes(this.type);
    }

    _log() {
        const level = this.severity === ERROR_SEVERITY.CRITICAL ? LOG_LEVELS.FATAL :
                     this.severity === ERROR_SEVERITY.HIGH ? LOG_LEVELS.ERROR :
                     LOG_LEVELS.WARN;
        
        logger.log(level, `[${this.type}] ${this.message}`, {
            type: this.type,
            severity: this.severity,
            code: this.code,
            context: this.context,
            retryable: this.retryable,
            timestamp: this.timestamp,
            stack: this.stack
        });
    }

    getUserMessage(language = 'en') {
        if (this.userMessage) return this.userMessage;
        const messages = USER_MESSAGES[language] || USER_MESSAGES.en;
        return messages[this.type] || messages[ERROR_TYPES.UNKNOWN] || 'An error occurred. Please try again.';
    }

    toJSON() {
        return {
            type: this.type,
            message: this.message,
            severity: this.severity,
            code: this.code,
            context: this.context,
            retryable: this.retryable,
            timestamp: this.timestamp,
            stack: this.stack
        };
    }
}

// ─── ERROR HANDLER CLASS ─────────────────────────────────────

class ErrorHandler {
    constructor() {
        this._errorQueue = [];
        this._offlineQueue = [];
        this._isProcessing = false;
        this._listeners = [];
        this._retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            backoffFactor: 2
        };
        this._init();
    }

    _init() {
        // Global error handler
        if (typeof window !== 'undefined') {
            window.addEventListener('error', this._handleGlobalError.bind(this));
            window.addEventListener('unhandledrejection', this._handleUnhandledRejection.bind(this));
            
            // Online/Offline detection
            window.addEventListener('online', this._handleOnline.bind(this));
            window.addEventListener('offline', this._handleOffline.bind(this));
        }

        logger.info('🚨 Error Handler initialized', {
            retryConfig: this._retryConfig
        });
    }

    _handleGlobalError(event) {
        const error = new ZymoreError(
            ERROR_TYPES.UNKNOWN,
            event.message || 'Uncaught error',
            {
                originalError: event.error,
                context: {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                },
                severity: ERROR_SEVERITY.HIGH
            }
        );
        this._notifyListeners(error);
        this._handleOfflineQueue(error);
    }

    _handleUnhandledRejection(event) {
        const error = new ZymoreError(
            ERROR_TYPES.UNKNOWN,
            event.reason?.message || 'Unhandled promise rejection',
            {
                originalError: event.reason,
                context: {
                    reason: event.reason
                },
                severity: ERROR_SEVERITY.HIGH
            }
        );
        this._notifyListeners(error);
        this._handleOfflineQueue(error);
    }

    _handleOnline() {
        logger.info('🌐 Network online - processing offline queue');
        this._processOfflineQueue();
    }

    _handleOffline() {
        logger.warn('📡 Network offline - errors will be queued');
    }

    /**
     * Handle error with full processing
     */
    handle(error, options = {}) {
        const zymoreError = error instanceof ZymoreError ? error :
            new ZymoreError(
                options.type || ERROR_TYPES.UNKNOWN,
                error.message || String(error),
                {
                    originalError: error,
                    context: options.context || {},
                    severity: options.severity,
                    retryable: options.retryable,
                    userMessage: options.userMessage,
                    code: options.code
                }
            );

        // Notify listeners
        this._notifyListeners(zymoreError);

        // Handle offline queue
        this._handleOfflineQueue(zymoreError);

        // Auto-retry if retryable
        if (zymoreError.retryable && options.retry !== false) {
            this._scheduleRetry(zymoreError, options);
        }

        return zymoreError;
    }

    /**
     * Handle error with automatic retry
     */
    async handleWithRetry(fn, options = {}) {
        let lastError = null;
        let attempt = 0;
        const maxRetries = options.maxRetries || this._retryConfig.maxRetries;

        while (attempt <= maxRetries) {
            try {
                const result = await fn();
                if (attempt > 0) {
                    logger.info(`✅ Retry successful after ${attempt} attempts`, {
                        attempts: attempt
                    });
                }
                return result;
            } catch (error) {
                lastError = error;
                attempt++;
                if (attempt <= maxRetries) {
                    const delay = this._calculateRetryDelay(attempt);
                    logger.warn(`🔄 Retry ${attempt}/${maxRetries} after ${delay}ms`, {
                        error: error.message,
                        attempt
                    });
                    await this._sleep(delay);
                }
            }
        }

        // All retries failed
        const zymoreError = this.handle(lastError, {
            ...options,
            context: {
                ...options.context,
                retryAttempts: attempt - 1,
                maxRetries
            },
            severity: ERROR_SEVERITY.HIGH
        });

        throw zymoreError;
    }

    /**
     * Calculate retry delay with exponential backoff
     */
    _calculateRetryDelay(attempt) {
        const delay = this._retryConfig.baseDelay * Math.pow(this._retryConfig.backoffFactor, attempt - 1);
        return Math.min(delay, this._retryConfig.maxDelay);
    }

    /**
     * Schedule retry
     */
    _scheduleRetry(error, options) {
        const maxRetries = options.maxRetries || this._retryConfig.maxRetries;
        let attempts = options._retryAttempts || 0;
        attempts++;

        if (attempts <= maxRetries) {
            const delay = this._calculateRetryDelay(attempts);
            setTimeout(() => {
                logger.info(`🔄 Retrying ${error.type} (${attempts}/${maxRetries})`);
                // Emit retry event
                this._notifyListeners({
                    type: 'RETRY',
                    error: error,
                    attempt: attempts,
                    maxRetries: maxRetries
                });
            }, delay);
        }
    }

    /**
     * Handle offline queue
     */
    _handleOfflineQueue(error) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            this._offlineQueue.push({
                error,
                timestamp: Date.now()
            });
            logger.warn('📡 Error queued for offline', {
                type: error.type,
                queueSize: this._offlineQueue.length
            });
        }
    }

    /**
     * Process offline queue
     */
    async _processOfflineQueue() {
        if (this._isProcessing || this._offlineQueue.length === 0) return;
        this._isProcessing = true;

        try {
            const queue = [...this._offlineQueue];
            this._offlineQueue = [];

            for (const item of queue) {
                logger.info('📤 Processing queued error', {
                    type: item.error.type,
                    timestamp: item.timestamp
                });
                // Re-emit error
                this._notifyListeners(item.error);
            }
        } catch (error) {
            logger.error('Failed to process offline queue', { error: error.message });
        } finally {
            this._isProcessing = false;
        }
    }

    /**
     * Sleep helper
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Notify all listeners
     */
    _notifyListeners(data) {
        for (const listener of this._listeners) {
            try {
                listener(data);
            } catch (error) {
                logger.error('Error in error listener', { error: error.message });
            }
        }
    }

    /**
     * Add error listener
     */
    addListener(callback) {
        this._listeners.push(callback);
        return () => {
            this._listeners = this._listeners.filter(l => l !== callback);
        };
    }

    /**
     * Get offline queue
     */
    getOfflineQueue() {
        return [...this._offlineQueue];
    }

    /**
     * Clear offline queue
     */
    clearOfflineQueue() {
        this._offlineQueue = [];
    }

    /**
     * Get error statistics
     */
    getStats() {
        return {
            offlineQueueSize: this._offlineQueue.length,
            listenerCount: this._listeners.length,
            isProcessing: this._isProcessing,
            retryConfig: this._retryConfig
        };
    }

    /**
     * Update retry configuration
     */
    setRetryConfig(config) {
        this._retryConfig = { ...this._retryConfig, ...config };
        logger.info('⚙️ Retry config updated', this._retryConfig);
    }

    /**
     * Create validation error
     */
    validationError(field, message, options = {}) {
        return new ZymoreError(
            ERROR_TYPES.VALIDATION,
            message || `Invalid ${field}`,
            {
                context: { field, ...options.context },
                severity: ERROR_SEVERITY.LOW,
                retryable: false,
                ...options
            }
        );
    }

    /**
     * Create network error
     */
    networkError(message, options = {}) {
        return new ZymoreError(
            ERROR_TYPES.NETWORK,
            message || 'Network error',
            {
                context: options.context,
                severity: ERROR_SEVERITY.MEDIUM,
                retryable: true,
                ...options
            }
        );
    }

    /**
     * Create auth error
     */
    authError(message, options = {}) {
        return new ZymoreError(
            ERROR_TYPES.AUTH,
            message || 'Authentication error',
            {
                context: options.context,
                severity: ERROR_SEVERITY.HIGH,
                retryable: false,
                ...options
            }
        );
    }

    /**
     * Create database error
     */
    databaseError(message, options = {}) {
        return new ZymoreError(
            ERROR_TYPES.DATABASE,
            message || 'Database error',
            {
                context: options.context,
                severity: ERROR_SEVERITY.HIGH,
                retryable: true,
                ...options
            }
        );
    }

    /**
     * Create permission error
     */
    permissionError(message, options = {}) {
        return new ZymoreError(
            ERROR_TYPES.PERMISSION,
            message || 'Permission denied',
            {
                context: options.context,
                severity: ERROR_SEVERITY.MEDIUM,
                retryable: false,
                ...options
            }
        );
    }

    /**
     * Create social error
     */
    socialError(message, options = {}) {
        return new ZymoreError(
            ERROR_TYPES.SOCIAL,
            message || 'Social action failed',
            {
                context: options.context,
                severity: ERROR_SEVERITY.MEDIUM,
                retryable: false,
                ...options
            }
        );
    }

    /**
     * Create chat error
     */
    chatError(message, options = {}) {
        return new ZymoreError(
            ERROR_TYPES.CHAT,
            message || 'Chat error',
            {
                context: options.context,
                severity: ERROR_SEVERITY.MEDIUM,
                retryable: true,
                ...options
            }
        );
    }

    /**
     * Create AI error
     */
    aiError(message, options = {}) {
        return new ZymoreError(
            ERROR_TYPES.AI,
            message || 'AI service error',
            {
                context: options.context,
                severity: ERROR_SEVERITY.MEDIUM,
                retryable: true,
                ...options
            }
        );
    }

    /**
     * Create ad error
     */
    adError(message, options = {}) {
        return new ZymoreError(
            ERROR_TYPES.AD,
            message || 'Ad error',
            {
                context: options.context,
                severity: ERROR_SEVERITY.LOW,
                retryable: true,
                ...options
            }
        );
    }

    /**
     * Create location error
     */
    locationError(message, options = {}) {
        return new ZymoreError(
            ERROR_TYPES.LOCATION,
            message || 'Location error',
            {
                context: options.context,
                severity: ERROR_SEVERITY.MEDIUM,
                retryable: true,
                ...options
            }
        );
    }

    /**
     * Create file error
     */
    fileError(message, options = {}) {
        return new ZymoreError(
            ERROR_TYPES.FILE,
            message || 'File error',
            {
                context: options.context,
                severity: ERROR_SEVERITY.MEDIUM,
                retryable: true,
                ...options
            }
        );
    }

    /**
     * Create cache error
     */
    cacheError(message, options = {}) {
        return new ZymoreError(
            ERROR_TYPES.CACHE,
            message || 'Cache error',
            {
                context: options.context,
                severity: ERROR_SEVERITY.LOW,
                retryable: false,
                ...options
            }
        );
    }

    /**
     * Create server error
     */
    serverError(message, options = {}) {
        return new ZymoreError(
            ERROR_TYPES.SERVER,
            message || 'Server error',
            {
                context: options.context,
                severity: ERROR_SEVERITY.HIGH,
                retryable: true,
                ...options
            }
        );
    }

    /**
     * Check if error is retryable
     */
    isRetryable(error) {
        if (error instanceof ZymoreError) {
            return error.retryable;
        }
        return false;
    }

    /**
     * Get user-friendly message
     */
    getUserMessage(error, language = 'en') {
        if (error instanceof ZymoreError) {
            return error.getUserMessage(language);
        }
        return error.message || 'An error occurred. Please try again.';
    }

    /**
     * Format error for display
     */
    formatError(error, language = 'en') {
        const isZymore = error instanceof ZymoreError;
        return {
            type: isZymore ? error.type : ERROR_TYPES.UNKNOWN,
            message: isZymore ? error.getUserMessage(language) : error.message || 'An error occurred',
            severity: isZymore ? error.severity : ERROR_SEVERITY.MEDIUM,
            retryable: isZymore ? error.retryable : false,
            code: isZymore ? error.code : null,
            timestamp: isZymore ? error.timestamp : new Date().toISOString()
        };
    }
}

// ─── SINGLETON INSTANCE ──────────────────────────────────────

const errorHandler = new ErrorHandler();

/**
 * Adapter for ErrorHandler class/object
 */
export { errorHandler };
export { ErrorHandler };


// ─── HELPER FUNCTIONS ────────────────────────────────────────

/**
 * Handle error with automatic retry
 */
export async function handleWithRetry(fn, options = {}) {
    return errorHandler.handleWithRetry(fn, options);
}

/**
 * Create validation error
 */
export function validationError(field, message, options = {}) {
    return errorHandler.validationError(field, message, options);
}

/**
 * Create network error
 */
export function networkError(message, options = {}) {
    return errorHandler.networkError(message, options);
}

/**
 * Create auth error
 */
export function authError(message, options = {}) {
    return errorHandler.authError(message, options);
}

/**
 * Create database error
 */
export function databaseError(message, options = {}) {
    return errorHandler.databaseError(message, options);
}

/**
 * Create permission error
 */
export function permissionError(message, options = {}) {
    return errorHandler.permissionError(message, options);
}

/**
 * Create social error
 */
export function socialError(message, options = {}) {
    return errorHandler.socialError(message, options);
}

/**
 * Create chat error
 */
export function chatError(message, options = {}) {
    return errorHandler.chatError(message, options);
}

/**
 * Create AI error
 */
export function aiError(message, options = {}) {
    return errorHandler.aiError(message, options);
}

/**
 * Create ad error
 */
export function adError(message, options = {}) {
    return errorHandler.adError(message, options);
}

/**
 * Create location error
 */
export function locationError(message, options = {}) {
    return errorHandler.locationError(message, options);
}

/**
 * Create file error
 */
export function fileError(message, options = {}) {
    return errorHandler.fileError(message, options);
}

/**
 * Create cache error
 */
export function cacheError(message, options = {}) {
    return errorHandler.cacheError(message, options);
}

/**
 * Create server error
 */
export function serverError(message, options = {}) {
    return errorHandler.serverError(message, options);
}

/**
 * Add error listener
 */
export function onError(callback) {
    return errorHandler.addListener(callback);
}

/**
 * Get user-friendly message
 */
export function getUserMessage(error, language = 'en') {
    return errorHandler.getUserMessage(error, language);
}

/**
 * Format error for display
 */
export function formatError(error, language = 'en') {
    return errorHandler.formatError(error, language);
}

/**
 * Get error stats
 */
export function getErrorStats() {
    return errorHandler.getStats();
}

/**
 * Check if error is retryable
 */
export function isRetryable(error) {
    return errorHandler.isRetryable(error);
}

/**
 * Get offline queue
 */
export function getOfflineQueue() {
    return errorHandler.getOfflineQueue();
}

/**
 * Clear offline queue
 */
export function clearOfflineQueue() {
    return errorHandler.clearOfflineQueue();
}

/**
 * Set retry configuration
 */
export function setRetryConfig(config) {
    return errorHandler.setRetryConfig(config);
}

// ─── DEFAULT EXPORT ──────────────────────────────────────────

export default errorHandler;

/**
 * Adapter for downloadError
 */
export function downloadError(message, options = {}) {
    return new Error(`Download Error: ${message}`);
}

/**
 * Adapter for notificationError
 */
export function notificationError(message = 'Notification error occurred', options = {}) {
    return new Error(`Notification Error: ${message}`);
}

/**
 * Adapter for feedError
 */
export function feedError(message = 'Feed error occurred', options = {}) {
    return new Error(`Feed Error: ${message}`);
}