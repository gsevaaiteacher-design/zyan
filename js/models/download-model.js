// Download Model
// ============================================================
// FILE: download-model.js
// PURPOSE: Download History & Tracking for Digital Products
// VERSION: 3.0.0 (Production Ready)
// DEPENDENCY: NONE
// USED BY: download-service.js, history-screen.js, product-detail.js, user-model.js
// LOCATION: js/models/download-model.js
// ============================================================

// ============================================================
// DOWNLOAD CLASS - ZYMORE v3.0 DIGITAL DOWNLOADS
// ============================================================

/**
 * Download Model Class
 * Represents a download record in the ZYMORE Hybrid Platform
 * 
 * ZYMORE v3.0 Features:
 * - Free/Paid download tracking
 * - Ad reward tracking
 * - Coin usage tracking
 * - Download progress tracking
 * - Device & IP tracking
 * - Download speed tracking
 * - Completion tracking
 * - Expiry tracking
 * - Analytics tracking
 * - Fraud detection
 * - Multiple file support
 * - Resume support
 * - Download limits
 */
export class Download {
    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * Create a new Download instance
     * @param {Object} data - Download data
     * @param {string} data.id - Download record ID
     * @param {string} data.userId - User ID
     * @param {string} data.productId - Product ID
     * @param {string} data.productTitle - Product title
     * @param {string} data.productThumbnail - Product thumbnail
     * @param {string} data.productCategory - Product category
     * @param {number} data.productPrice - Product price
     * @param {string} data.downloadUrl - Download URL
     * @param {string} data.fileName - File name
     * @param {number} data.fileSize - File size in bytes
     * @param {string} data.fileType - File MIME type
     * @param {string} data.fileExtension - File extension
     * @param {string} data.productType - Product type (digital, physical, service)
     * @param {string} data.downloadType - Download type (free, paid, ad_rewarded, coin_rewarded)
     * @param {boolean} data.adWatched - Ad watched flag
     * @param {string} data.adId - Ad watch ID
     * @param {number} data.coinsUsed - Coins used for download
     * @param {number} data.downloadCount - Total download count for this product
     * @param {number} data.userDownloadCount - User's total download count
     * @param {number} data.downloadProgress - Download progress percentage
     * @param {number} data.downloadSpeed - Download speed in bytes/second
     * @param {number} data.downloadDuration - Download duration in seconds
     * @param {string} data.downloadStatus - Download status (pending, downloading, completed, failed, cancelled, expired)
     * @param {Date|string} data.downloadedAt - Download completion timestamp
     * @param {Date|string} data.startedAt - Download start timestamp
     * @param {Date|string} data.expiresAt - Download link expiry timestamp
     * @param {Date|string} data.lastActivityAt - Last activity timestamp
     * @param {string} data.ip - IP address
     * @param {string} data.deviceInfo - Device information
     * @param {string} data.deviceType - Device type (mobile, desktop, tablet)
     * @param {string} data.browser - Browser name
     * @param {string} data.os - Operating system
     * @param {string} data.networkType - Network type (wifi, cellular, ethernet)
     * @param {string} data.country - Country code
     * @param {string} data.city - City
     * @param {string} data.region - Region
     * @param {string} data.referrer - Referrer URL
     * @param {string} data.landingPage - Landing page URL
     * @param {number} data.timeSpentOnPage - Time spent on page in seconds
     * @param {boolean} data.isCompleted - Completion status
     * @param {boolean} data.isCancelled - Cancelled status
     * @param {boolean} data.isFailed - Failed status
     * @param {string} data.failReason - Failure reason
     * @param {boolean} data.isExpired - Expired status
     * @param {boolean} data.isFraud - Fraud flag
     * @param {string} data.fraudReason - Fraud reason
     * @param {number} data.fraudScore - Fraud score (0-100)
     * @param {string} data.sessionId - Session ID
     * @param {Object} data.metadata - Additional metadata
     * @param {Object} data.analytics - Analytics data
     * @param {Date|string} data.createdAt - Creation date
     * @param {Date|string} data.updatedAt - Last update date
     * @param {string} data.status - Record status (pending, processing, completed, failed, cancelled, expired)
     * @param {boolean} data.isDeleted - Deleted status
     * @param {boolean} data.isValid - Valid status
     * @param {Array<Object>} data.downloadAttempts - Download attempt history
     * @param {number} data.attemptCount - Number of download attempts
     * @param {string} data.lastError - Last error message
     * @param {Object} data.customFields - Custom fields
     * @param {string} data.notes - Notes
     * @param {string} data.internalNotes - Internal notes
     */
    constructor(data = {}) {
        // ============================================
        // 📌 BASIC INFORMATION
        // ============================================
        this.id = data.id || data.downloadId || this.generateId();
        this.userId = data.userId || '';
        this.productId = data.productId || '';
        this.productTitle = data.productTitle || '';
        this.productThumbnail = data.productThumbnail || '';
        this.productCategory = data.productCategory || '';
        this.productPrice = data.productPrice || 0;
        this.downloadUrl = data.downloadUrl || '';
        this.fileName = data.fileName || '';
        this.fileSize = data.fileSize || 0;
        this.fileType = data.fileType || '';
        this.fileExtension = data.fileExtension || '';
        this.productType = data.productType || 'digital';
        this.downloadType = data.downloadType || 'free'; // 'free' | 'paid' | 'ad_rewarded' | 'coin_rewarded'
        
        // ============================================
        // 💰 REWARD TRACKING
        // ============================================
        this.adWatched = data.adWatched || false;
        this.adId = data.adId || '';
        this.coinsUsed = data.coinsUsed || 0;
        this.downloadCount = data.downloadCount || 0;
        this.userDownloadCount = data.userDownloadCount || 0;
        
        // ============================================
        // 📊 DOWNLOAD PROGRESS
        // ============================================
        this.downloadProgress = data.downloadProgress || 0;
        this.downloadSpeed = data.downloadSpeed || 0;
        this.downloadDuration = data.downloadDuration || 0;
        this.downloadStatus = data.downloadStatus || 'pending'; // 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled' | 'expired'
        this.downloadedSize = data.downloadedSize || 0;
        this.totalSize = data.totalSize || this.fileSize || 0;
        this.bytesDownloaded = data.bytesDownloaded || 0;
        
        // ============================================
        // ⏰ TIMESTAMPS
        // ============================================
        this.downloadedAt = data.downloadedAt ? new Date(data.downloadedAt) : null;
        this.startedAt = data.startedAt ? new Date(data.startedAt) : null;
        this.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
        this.lastActivityAt = data.lastActivityAt ? new Date(data.lastActivityAt) : null;
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
        this.cancelledAt = data.cancelledAt ? new Date(data.cancelledAt) : null;
        this.failedAt = data.failedAt ? new Date(data.failedAt) : null;
        this.completedAt = data.completedAt ? new Date(data.completedAt) : null;
        
        // ============================================
        // 📍 DEVICE & LOCATION
        // ============================================
        this.ip = data.ip || '';
        this.deviceInfo = data.deviceInfo || '';
        this.deviceType = data.deviceType || '';
        this.browser = data.browser || '';
        this.os = data.os || '';
        this.networkType = data.networkType || '';
        this.country = data.country || '';
        this.city = data.city || '';
        this.region = data.region || '';
        this.isp = data.isp || '';
        this.timezone = data.timezone || 'UTC';
        this.language = data.language || 'en';
        
        // ============================================
        // 🔗 REFERRER & PAGE
        // ============================================
        this.referrer = data.referrer || '';
        this.landingPage = data.landingPage || '';
        this.timeSpentOnPage = data.timeSpentOnPage || 0;
        this.pageUrl = data.pageUrl || '';
        this.pageTitle = data.pageTitle || '';
        
        // ============================================
        // 🚩 STATUS FLAGS
        // ============================================
        this.isCompleted = data.isCompleted || false;
        this.isCancelled = data.isCancelled || false;
        this.isFailed = data.isFailed || false;
        this.failReason = data.failReason || '';
        this.isExpired = data.isExpired || false;
        this.isFraud = data.isFraud || false;
        this.fraudReason = data.fraudReason || '';
        this.fraudScore = data.fraudScore || 0;
        this.isDeleted = data.isDeleted || false;
        this.isValid = data.isValid !== undefined ? data.isValid : true;
        this.isResumed = data.isResumed || false;
        this.isPaused = data.isPaused || false;
        
        // ============================================
        // 🔗 SESSION
        // ============================================
        this.sessionId = data.sessionId || '';
        this.sessionStart = data.sessionStart ? new Date(data.sessionStart) : null;
        this.sessionDuration = data.sessionDuration || 0;
        
        // ============================================
        // 📊 ANALYTICS
        // ============================================
        this.analytics = {
            totalDownloads: data.analytics?.totalDownloads || 0,
            totalBytesDownloaded: data.analytics?.totalBytesDownloaded || 0,
            averageSpeed: data.analytics?.averageSpeed || 0,
            peakSpeed: data.analytics?.peakSpeed || 0,
            downloadTime: data.analytics?.downloadTime || 0,
            completionRate: data.analytics?.completionRate || 0,
            failureRate: data.analytics?.failureRate || 0,
            dailyDownloads: data.analytics?.dailyDownloads || {},
            weeklyDownloads: data.analytics?.weeklyDownloads || {},
            monthlyDownloads: data.analytics?.monthlyDownloads || {},
            deviceStats: data.analytics?.deviceStats || { mobile: 0, desktop: 0, tablet: 0 },
            locationStats: data.analytics?.locationStats || {},
            referrerStats: data.analytics?.referrerStats || {},
            timeStats: data.analytics?.timeStats || {},
            ...data.analytics
        };
        
        // ============================================
        // 📝 METADATA
        // ============================================
        this.metadata = data.metadata || {};
        this.customFields = data.customFields || {};
        this.notes = data.notes || '';
        this.internalNotes = data.internalNotes || '';
        
        // ============================================
        // 📊 DOWNLOAD ATTEMPTS
        // ============================================
        this.downloadAttempts = Array.isArray(data.downloadAttempts) ? [...data.downloadAttempts] : [];
        this.attemptCount = data.attemptCount || 0;
        this.maxAttempts = data.maxAttempts || 5;
        this.lastError = data.lastError || '';
        this.lastErrorCode = data.lastErrorCode || '';
        this.retryCount = data.retryCount || 0;
        this.maxRetries = data.maxRetries || 3;
        
        // ============================================
        // 🔄 SYNC & VERSION
        // ============================================
        this.lastSync = data.lastSync ? new Date(data.lastSync) : new Date();
        this.syncVersion = data.syncVersion || 1;
        this.appVersion = data.appVersion || '3.0.0';
        
        // ============================================
        // 📋 LICENSE & RIGHTS
        // ============================================
        this.licenseId = data.licenseId || '';
        this.licenseType = data.licenseType || '';
        this.licenseKey = data.licenseKey || '';
        this.isLicensed = data.isLicensed || false;
        this.licenseExpiresAt = data.licenseExpiresAt ? new Date(data.licenseExpiresAt) : null;
        
        // ============================================
        // 📦 FILE INFO
        // ============================================
        this.fileHash = data.fileHash || '';
        this.fileChecksum = data.fileChecksum || '';
        this.fileVersion = data.fileVersion || '1.0';
        this.fileFormat = data.fileFormat || '';
        this.fileQuality = data.fileQuality || '';
        this.fileResolution = data.fileResolution || '';
        this.fileDimensions = data.fileDimensions || '';
        this.fileDuration = data.fileDuration || 0;
        this.fileBitrate = data.fileBitrate || 0;
        this.fileSampleRate = data.fileSampleRate || 0;
        
        // ============================================
        // 💰 PAYMENT
        // ============================================
        this.paymentId = data.paymentId || '';
        this.paymentMethod = data.paymentMethod || '';
        this.paymentAmount = data.paymentAmount || 0;
        this.paymentCurrency = data.paymentCurrency || 'USD';
        this.paymentStatus = data.paymentStatus || '';
        this.transactionId = data.transactionId || '';
    }

    // ============================================
    // ID GENERATION
    // ============================================

    /**
     * Generate a unique download ID
     * @returns {string} Unique ID
     */
    generateId() {
        return `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // ============================================
    // VALIDATION
    // ============================================

    /**
     * Validate download data
     * @param {Object} options - Validation options
     * @param {boolean} options.strict - Strict validation
     * @returns {Object} Validation result { isValid, errors, warnings }
     */
    validate(options = {}) {
        const errors = [];
        const warnings = [];
        const { strict = false } = options;

        // === REQUIRED FIELDS ===
        if (!this.userId || this.userId.trim() === '') {
            errors.push('User ID is required');
        }

        if (!this.productId || this.productId.trim() === '') {
            errors.push('Product ID is required');
        }

        if (!this.downloadUrl || this.downloadUrl.trim() === '') {
            errors.push('Download URL is required');
        }

        // === FILE NAME ===
        if (!this.fileName || this.fileName.trim() === '') {
            warnings.push('File name is recommended');
        }

        // === FILE SIZE ===
        if (this.fileSize < 0) {
            errors.push('File size cannot be negative');
        }
        if (this.fileSize === 0) {
            warnings.push('File size is 0 - may cause download issues');
        }

        // === DOWNLOAD TYPE ===
        const validTypes = ['free', 'paid', 'ad_rewarded', 'coin_rewarded'];
        if (this.downloadType && !validTypes.includes(this.downloadType)) {
            warnings.push(`Invalid download type. Must be one of: ${validTypes.join(', ')}`);
        }

        // === STATUS ===
        const validStatuses = ['pending', 'downloading', 'completed', 'failed', 'cancelled', 'expired'];
        if (this.downloadStatus && !validStatuses.includes(this.downloadStatus)) {
            errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        // === PROGRESS ===
        if (this.downloadProgress < 0 || this.downloadProgress > 100) {
            warnings.push('Download progress must be between 0 and 100');
        }

        // === COINS ===
        if (this.coinsUsed < 0) {
            warnings.push('Coins used cannot be negative');
        }

        // === ATTEMPTS ===
        if (this.attemptCount > this.maxAttempts) {
            warnings.push('Download attempts exceed maximum allowed');
        }

        // === STRICT VALIDATION ===
        if (strict) {
            if (!this.fileType) {
                warnings.push('File type is recommended');
            }
            if (!this.fileSize) {
                warnings.push('File size is recommended');
            }
            if (this.downloadStatus === 'completed' && !this.downloadedAt) {
                warnings.push('Completed download should have completion timestamp');
            }
            if (this.downloadStatus === 'failed' && !this.failReason) {
                warnings.push('Failed download should have failure reason');
            }
            if (this.downloadType === 'paid' && !this.paymentId) {
                warnings.push('Paid download should have payment ID');
            }
            if (this.downloadType === 'ad_rewarded' && !this.adId) {
                warnings.push('Ad rewarded download should have ad ID');
            }
        }

        // === URL VALIDATION ===
        if (this.downloadUrl && !this.isValidUrl(this.downloadUrl)) {
            errors.push('Invalid download URL format');
        }

        // === EXPIRY ===
        if (this.expiresAt && this.expiresAt < new Date()) {
            warnings.push('Download has already expired');
        }

        return {
            isValid: errors.length === 0,
            hasWarnings: warnings.length > 0,
            errors: errors,
            warnings: warnings
        };
    }

    /**
     * Validate URL format
     * @param {string} url - URL to validate
     * @returns {boolean} True if valid URL
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // ============================================
    // CONVERSION METHODS
    // ============================================

    /**
     * Convert to Firestore document
     * @param {Object} options - Conversion options
     * @param {boolean} options.includeMetadata - Include metadata
     * @param {boolean} options.includeAnalytics - Include analytics
     * @param {boolean} options.includeAttempts - Include download attempts
     * @param {boolean} options.includeLicense - Include license info
     * @returns {Object} Firestore document
     */
    toFirestore(options = {}) {
        const { includeMetadata = true, includeAnalytics = true, includeAttempts = true, includeLicense = true } = options;

        const data = {
            userId: this.userId,
            productId: this.productId,
            productTitle: this.productTitle,
            productThumbnail: this.productThumbnail,
            productCategory: this.productCategory,
            productPrice: this.productPrice,
            downloadUrl: this.downloadUrl,
            fileName: this.fileName,
            fileSize: this.fileSize,
            fileType: this.fileType,
            fileExtension: this.fileExtension,
            productType: this.productType,
            downloadType: this.downloadType,
            adWatched: this.adWatched,
            adId: this.adId,
            coinsUsed: this.coinsUsed,
            downloadCount: this.downloadCount,
            userDownloadCount: this.userDownloadCount,
            downloadProgress: this.downloadProgress,
            downloadSpeed: this.downloadSpeed,
            downloadDuration: this.downloadDuration,
            downloadStatus: this.downloadStatus,
            downloadedSize: this.downloadedSize,
            totalSize: this.totalSize,
            bytesDownloaded: this.bytesDownloaded,
            downloadedAt: this.downloadedAt ? this.downloadedAt.toISOString() : null,
            startedAt: this.startedAt ? this.startedAt.toISOString() : null,
            expiresAt: this.expiresAt ? this.expiresAt.toISOString() : null,
            lastActivityAt: this.lastActivityAt ? this.lastActivityAt.toISOString() : null,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            cancelledAt: this.cancelledAt ? this.cancelledAt.toISOString() : null,
            failedAt: this.failedAt ? this.failedAt.toISOString() : null,
            completedAt: this.completedAt ? this.completedAt.toISOString() : null,
            ip: this.ip,
            deviceInfo: this.deviceInfo,
            deviceType: this.deviceType,
            browser: this.browser,
            os: this.os,
            networkType: this.networkType,
            country: this.country,
            city: this.city,
            region: this.region,
            isp: this.isp,
            timezone: this.timezone,
            language: this.language,
            referrer: this.referrer,
            landingPage: this.landingPage,
            timeSpentOnPage: this.timeSpentOnPage,
            pageUrl: this.pageUrl,
            pageTitle: this.pageTitle,
            isCompleted: this.isCompleted,
            isCancelled: this.isCancelled,
            isFailed: this.isFailed,
            failReason: this.failReason,
            isExpired: this.isExpired,
            isFraud: this.isFraud,
            fraudReason: this.fraudReason,
            fraudScore: this.fraudScore,
            isDeleted: this.isDeleted,
            isValid: this.isValid,
            isResumed: this.isResumed,
            isPaused: this.isPaused,
            sessionId: this.sessionId,
            sessionStart: this.sessionStart ? this.sessionStart.toISOString() : null,
            sessionDuration: this.sessionDuration,
            attemptCount: this.attemptCount,
            maxAttempts: this.maxAttempts,
            lastError: this.lastError,
            lastErrorCode: this.lastErrorCode,
            retryCount: this.retryCount,
            maxRetries: this.maxRetries,
            customFields: this.customFields,
            notes: this.notes,
            internalNotes: this.internalNotes,
            lastSync: this.lastSync.toISOString(),
            syncVersion: this.syncVersion,
            appVersion: this.appVersion,
            fileHash: this.fileHash,
            fileChecksum: this.fileChecksum,
            fileVersion: this.fileVersion,
            fileFormat: this.fileFormat,
            fileQuality: this.fileQuality,
            fileResolution: this.fileResolution,
            fileDimensions: this.fileDimensions,
            fileDuration: this.fileDuration,
            fileBitrate: this.fileBitrate,
            fileSampleRate: this.fileSampleRate,
            paymentId: this.paymentId,
            paymentMethod: this.paymentMethod,
            paymentAmount: this.paymentAmount,
            paymentCurrency: this.paymentCurrency,
            paymentStatus: this.paymentStatus,
            transactionId: this.transactionId
        };

        if (includeMetadata) {
            data.metadata = this.metadata;
        }

        if (includeAnalytics) {
            data.analytics = { ...this.analytics };
        }

        if (includeAttempts) {
            data.downloadAttempts = [...this.downloadAttempts];
        }

        if (includeLicense) {
            data.licenseId = this.licenseId;
            data.licenseType = this.licenseType;
            data.licenseKey = this.licenseKey;
            data.isLicensed = this.isLicensed;
            data.licenseExpiresAt = this.licenseExpiresAt ? this.licenseExpiresAt.toISOString() : null;
        }

        return data;
    }

    /**
     * Convert to JSON
     * @param {Object} options - Conversion options
     * @param {boolean} options.includePrivate - Include private fields
     * @param {boolean} options.includeMetadata - Include metadata
     * @param {boolean} options.includeAnalytics - Include analytics
     * @param {boolean} options.includeAttempts - Include download attempts
     * @param {boolean} options.includeLicense - Include license info
     * @param {boolean} options.includePayment - Include payment info
     * @returns {Object} JSON object
     */
    toJSON(options = {}) {
        const { 
            includePrivate = false, 
            includeMetadata = false, 
            includeAnalytics = false, 
            includeAttempts = false,
            includeLicense = false,
            includePayment = false
        } = options;

        const data = {
            id: this.id,
            userId: this.userId,
            productId: this.productId,
            productTitle: this.productTitle,
            productThumbnail: this.productThumbnail,
            productCategory: this.productCategory,
            productPrice: this.productPrice,
            downloadUrl: this.downloadUrl,
            fileName: this.fileName,
            fileSize: this.fileSize,
            fileType: this.fileType,
            fileExtension: this.fileExtension,
            productType: this.productType,
            downloadType: this.downloadType,
            adWatched: this.adWatched,
            adId: this.adId,
            coinsUsed: this.coinsUsed,
            downloadCount: this.downloadCount,
            userDownloadCount: this.userDownloadCount,
            downloadProgress: this.downloadProgress,
            downloadSpeed: this.downloadSpeed,
            downloadDuration: this.downloadDuration,
            downloadStatus: this.downloadStatus,
            downloadedSize: this.downloadedSize,
            totalSize: this.totalSize,
            bytesDownloaded: this.bytesDownloaded,
            downloadedAt: this.downloadedAt ? this.downloadedAt.toISOString() : null,
            startedAt: this.startedAt ? this.startedAt.toISOString() : null,
            expiresAt: this.expiresAt ? this.expiresAt.toISOString() : null,
            lastActivityAt: this.lastActivityAt ? this.lastActivityAt.toISOString() : null,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            cancelledAt: this.cancelledAt ? this.cancelledAt.toISOString() : null,
            failedAt: this.failedAt ? this.failedAt.toISOString() : null,
            completedAt: this.completedAt ? this.completedAt.toISOString() : null,
            deviceType: this.deviceType,
            browser: this.browser,
            os: this.os,
            networkType: this.networkType,
            country: this.country,
            city: this.city,
            region: this.region,
            isCompleted: this.isCompleted,
            isCancelled: this.isCancelled,
            isFailed: this.isFailed,
            failReason: this.failReason,
            isExpired: this.isExpired,
            isFraud: this.isFraud,
            isValid: this.isValid,
            isResumed: this.isResumed,
            isPaused: this.isPaused,
            attemptCount: this.attemptCount,
            maxAttempts: this.maxAttempts,
            retryCount: this.retryCount,
            maxRetries: this.maxRetries,
            fileHash: this.fileHash,
            fileChecksum: this.fileChecksum,
            fileVersion: this.fileVersion,
            fileFormat: this.fileFormat,
            fileQuality: this.fileQuality,
            fileResolution: this.fileResolution,
            fileDimensions: this.fileDimensions,
            fileDuration: this.fileDuration,
            fileBitrate: this.fileBitrate,
            fileSampleRate: this.fileSampleRate
        };

        if (includePrivate) {
            data.ip = this.ip;
            data.deviceInfo = this.deviceInfo;
            data.isp = this.isp;
            data.timezone = this.timezone;
            data.language = this.language;
            data.referrer = this.referrer;
            data.landingPage = this.landingPage;
            data.timeSpentOnPage = this.timeSpentOnPage;
            data.pageUrl = this.pageUrl;
            data.pageTitle = this.pageTitle;
            data.sessionId = this.sessionId;
            data.sessionStart = this.sessionStart ? this.sessionStart.toISOString() : null;
            data.sessionDuration = this.sessionDuration;
            data.lastError = this.lastError;
            data.lastErrorCode = this.lastErrorCode;
            data.fraudReason = this.fraudReason;
            data.fraudScore = this.fraudScore;
            data.notes = this.notes;
            data.internalNotes = this.internalNotes;
            data.customFields = this.customFields;
        }

        if (includeMetadata) {
            data.metadata = this.metadata;
        }

        if (includeAnalytics) {
            data.analytics = { ...this.analytics };
        }

        if (includeAttempts) {
            data.downloadAttempts = [...this.downloadAttempts];
        }

        if (includeLicense) {
            data.licenseId = this.licenseId;
            data.licenseType = this.licenseType;
            data.licenseKey = this.licenseKey;
            data.isLicensed = this.isLicensed;
            data.licenseExpiresAt = this.licenseExpiresAt ? this.licenseExpiresAt.toISOString() : null;
        }

        if (includePayment) {
            data.paymentId = this.paymentId;
            data.paymentMethod = this.paymentMethod;
            data.paymentAmount = this.paymentAmount;
            data.paymentCurrency = this.paymentCurrency;
            data.paymentStatus = this.paymentStatus;
            data.transactionId = this.transactionId;
        }

        return data;
    }

    /**
     * Get public download data
     * @param {Object} options - Options
     * @param {boolean} options.includeProduct - Include product info
     * @param {boolean} options.includeStats - Include statistics
     * @param {boolean} options.includeUser - Include user info
     * @returns {Object} Public download data
     */
    getPublicData(options = {}) {
        const { includeProduct = true, includeStats = true, includeUser = true } = options;

        const data = {
            id: this.id,
            downloadType: this.downloadType,
            downloadStatus: this.downloadStatus,
            downloadProgress: this.downloadProgress,
            fileName: this.fileName,
            fileSize: this.fileSize,
            fileType: this.fileType,
            fileExtension: this.fileExtension,
            productType: this.productType,
            downloadedAt: this.downloadedAt ? this.downloadedAt.toISOString() : null,
            startedAt: this.startedAt ? this.startedAt.toISOString() : null,
            expiresAt: this.expiresAt ? this.expiresAt.toISOString() : null,
            createdAt: this.createdAt.toISOString(),
            isCompleted: this.isCompleted,
            isExpired: this.isExpired,
            isValid: this.isValid
        };

        if (includeProduct) {
            data.productId = this.productId;
            data.productTitle = this.productTitle;
            data.productThumbnail = this.productThumbnail;
            data.productCategory = this.productCategory;
            data.productPrice = this.productPrice;
        }

        if (includeStats) {
            data.downloadCount = this.downloadCount;
            data.downloadDuration = this.downloadDuration;
            data.downloadSpeed = this.downloadSpeed;
            data.bytesDownloaded = this.bytesDownloaded;
            data.totalSize = this.totalSize;
        }

        if (includeUser) {
            data.userId = this.userId;
        }

        return data;
    }

    /**
     * Get minimal download data (for history list)
     * @param {Object} options - Options
     * @param {boolean} options.includeProduct - Include product info
     * @returns {Object} Minimal download data
     */
    getMinimalData(options = {}) {
        const { includeProduct = true } = options;

        const data = {
            id: this.id,
            downloadStatus: this.downloadStatus,
            downloadProgress: this.downloadProgress,
            fileName: this.fileName,
            fileSize: this.fileSize,
            fileType: this.fileType,
            downloadedAt: this.downloadedAt ? this.downloadedAt.toISOString() : null,
            createdAt: this.createdAt.toISOString(),
            isCompleted: this.isCompleted,
            isExpired: this.isExpired,
            downloadType: this.downloadType
        };

        if (includeProduct) {
            data.productId = this.productId;
            data.productTitle = this.productTitle;
            data.productThumbnail = this.productThumbnail;
            data.productCategory = this.productCategory;
        }

        return data;
    }

    /**
     * Get download progress summary
     * @returns {Object} Progress summary
     */
    getProgressSummary() {
        return {
            progress: this.downloadProgress || 0,
            downloadedSize: this.downloadedSize || 0,
            totalSize: this.totalSize || this.fileSize || 0,
            speed: this.downloadSpeed || 0,
            timeRemaining: this.getTimeRemaining(),
            status: this.downloadStatus,
            isCompleted: this.isCompleted,
            isPaused: this.isPaused,
            isResumed: this.isResumed
        };
    }

    /**
     * Get estimated time remaining
     * @returns {number} Time remaining in seconds
     */
    getTimeRemaining() {
        if (!this.downloadSpeed || this.downloadSpeed === 0) return 0;
        const remaining = (this.totalSize || this.fileSize || 0) - (this.downloadedSize || 0);
        if (remaining <= 0) return 0;
        return Math.ceil(remaining / this.downloadSpeed);
    }

    // ============================================
    // DOWNLOAD PROGRESS METHODS
    // ============================================

    /**
     * Start download
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Download} Updated download (this)
     */
    startDownload(options = {}) {
        const { emitEvent = true } = options;
        this.downloadStatus = 'downloading';
        this.startedAt = new Date();
        this.lastActivityAt = new Date();
        this.attemptCount = (this.attemptCount || 0) + 1;
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('download:started', { downloadId: this.id, userId: this.userId });
        }

        return this;
    }

    /**
     * Update download progress
     * @param {number} bytesDownloaded - Bytes downloaded
     * @param {number} speed - Download speed in bytes/second
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Download} Updated download (this)
     */
    updateProgress(bytesDownloaded, speed = 0, options = {}) {
        const { emitEvent = true } = options;
        
        this.bytesDownloaded = bytesDownloaded;
        this.downloadedSize = bytesDownloaded;
        this.downloadSpeed = speed || this.downloadSpeed;
        this.lastActivityAt = new Date();
        
        const total = this.totalSize || this.fileSize || 1;
        this.downloadProgress = Math.min(100, (bytesDownloaded / total) * 100);
        
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('download:progress', { 
                downloadId: this.id, 
                progress: this.downloadProgress,
                bytesDownloaded,
                speed
            });
        }

        return this;
    }

    /**
     * Complete download
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @param {boolean} options.saveHistory - Save to history
     * @returns {Download} Updated download (this)
     */
    completeDownload(options = {}) {
        const { emitEvent = true, saveHistory = true } = options;
        
        this.downloadStatus = 'completed';
        this.downloadProgress = 100;
        this.isCompleted = true;
        this.downloadedAt = new Date();
        this.completedAt = new Date();
        this.updatedAt = new Date();
        
        if (this.startedAt) {
            this.downloadDuration = Math.floor((this.downloadedAt - this.startedAt) / 1000);
        }

        this.analytics.totalDownloads = (this.analytics.totalDownloads || 0) + 1;
        this.analytics.totalBytesDownloaded = (this.analytics.totalBytesDownloaded || 0) + (this.fileSize || 0);
        
        const date = new Date().toISOString().split('T')[0];
        this.analytics.dailyDownloads[date] = (this.analytics.dailyDownloads[date] || 0) + 1;

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('download:completed', { 
                downloadId: this.id, 
                userId: this.userId,
                productId: this.productId
            });
        }

        return this;
    }

    /**
     * Fail download
     * @param {string} reason - Failure reason
     * @param {string} errorCode - Error code
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @param {boolean} options.retry - Retry download
     * @returns {Download} Updated download (this)
     */
    failDownload(reason, errorCode = '', options = {}) {
        const { emitEvent = true, retry = false } = options;
        
        this.downloadStatus = 'failed';
        this.isFailed = true;
        this.failReason = reason;
        this.lastError = reason;
        this.lastErrorCode = errorCode;
        this.failedAt = new Date();
        this.updatedAt = new Date();

        if (retry && this.retryCount < this.maxRetries) {
            this.retryCount = (this.retryCount || 0) + 1;
            this.downloadStatus = 'pending';
            this.isFailed = false;
        }

        this.analytics.failureRate = (this.analytics.failureRate || 0) + 1;

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('download:failed', { 
                downloadId: this.id, 
                userId: this.userId,
                reason,
                errorCode,
                retry: retry && this.retryCount < this.maxRetries
            });
        }

        return this;
    }

    /**
     * Cancel download
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Download} Updated download (this)
     */
    cancelDownload(options = {}) {
        const { emitEvent = true } = options;
        
        this.downloadStatus = 'cancelled';
        this.isCancelled = true;
        this.cancelledAt = new Date();
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('download:cancelled', { 
                downloadId: this.id, 
                userId: this.userId 
            });
        }

        return this;
    }

    /**
     * Pause download
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Download} Updated download (this)
     */
    pauseDownload(options = {}) {
        const { emitEvent = true } = options;
        
        this.isPaused = true;
        this.downloadStatus = 'paused';
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('download:paused', { 
                downloadId: this.id, 
                userId: this.userId 
            });
        }

        return this;
    }

    /**
     * Resume download
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Download} Updated download (this)
     */
    resumeDownload(options = {}) {
        const { emitEvent = true } = options;
        
        this.isPaused = false;
        this.isResumed = true;
        this.downloadStatus = 'downloading';
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('download:resumed', { 
                downloadId: this.id, 
                userId: this.userId 
            });
        }

        return this;
    }

    /**
     * Add download attempt
     * @param {Object} attempt - Attempt data
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Download} Updated download (this)
     */
    addAttempt(attempt, options = {}) {
        const { emitEvent = true } = options;
        
        const newAttempt = {
            id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            timestamp: new Date().toISOString(),
            status: attempt.status || 'started',
            bytesDownloaded: attempt.bytesDownloaded || 0,
            speed: attempt.speed || 0,
            duration: attempt.duration || 0,
            error: attempt.error || '',
            ip: attempt.ip || this.ip,
            deviceInfo: attempt.deviceInfo || this.deviceInfo,
            ...attempt
        };
        
        this.downloadAttempts.push(newAttempt);
        this.attemptCount = this.downloadAttempts.length;
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('download:attempt', { 
                downloadId: this.id, 
                attempt: newAttempt 
            });
        }

        return this;
    }

    /**
     * Get last download attempt
     * @returns {Object|null} Last attempt or null
     */
    getLastAttempt() {
        if (this.downloadAttempts.length === 0) return null;
        return this.downloadAttempts[this.downloadAttempts.length - 1];
    }

    // ============================================
    // STATUS METHODS
    // ============================================

    /** @returns {boolean} Check if download is completed */
    isCompletedDownload() { return this.isCompleted === true || this.downloadStatus === 'completed'; }

    /** @returns {boolean} Check if download is pending */
    isPending() { return this.downloadStatus === 'pending'; }

    /** @returns {boolean} Check if download is downloading */
    isDownloading() { return this.downloadStatus === 'downloading'; }

    /** @returns {boolean} Check if download is failed */
    isFailedDownload() { return this.isFailed === true || this.downloadStatus === 'failed'; }

    /** @returns {boolean} Check if download is cancelled */
    isCancelledDownload() { return this.isCancelled === true || this.downloadStatus === 'cancelled'; }

    /** @returns {boolean} Check if download is expired */
    isExpiredDownload() { return this.isExpired === true || this.downloadStatus === 'expired' || (this.expiresAt && new Date() > this.expiresAt); }

    /** @returns {boolean} Check if download is paused */
    isPausedDownload() { return this.isPaused === true; }

    /** @returns {boolean} Check if download is valid */
    isValidDownload() { return this.isValid === true && !this.isDeleted && !this.isFraud; }

    /** @returns {boolean} Check if download is fraud */
    isFraudulent() { return this.isFraud === true; }

    /** @returns {boolean} Check if download is free */
    isFreeDownload() { return this.downloadType === 'free'; }

    /** @returns {boolean} Check if download is paid */
    isPaidDownload() { return this.downloadType === 'paid'; }

    /** @returns {boolean} Check if download is ad rewarded */
    isAdRewardedDownload() { return this.downloadType === 'ad_rewarded'; }

    /** @returns {boolean} Check if download is coin rewarded */
    isCoinRewardedDownload() { return this.downloadType === 'coin_rewarded'; }

    /** @returns {boolean} Check if download has license */
    hasLicense() { return this.isLicensed && this.licenseId && this.licenseKey; }

    /** @returns {boolean} Check if license is expired */
    isLicenseExpired() { return this.licenseExpiresAt && new Date() > this.licenseExpiresAt; }

    // ============================================
    // ANALYTICS METHODS
    // ============================================

    /**
     * Get download speed in human readable format
     * @returns {string} Human readable speed
     */
    getSpeedDisplay() {
        if (!this.downloadSpeed || this.downloadSpeed === 0) return '0 B/s';
        const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
        let speed = this.downloadSpeed;
        let unitIndex = 0;
        while (speed >= 1024 && unitIndex < units.length - 1) {
            speed /= 1024;
            unitIndex++;
        }
        return `${speed.toFixed(1)} ${units[unitIndex]}`;
    }

    /**
     * Get file size in human readable format
     * @param {number} size - File size in bytes
     * @returns {string} Human readable size
     */
    getFileSizeDisplay(size = null) {
        const bytes = size || this.fileSize || 0;
        if (bytes === 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let value = bytes;
        let unitIndex = 0;
        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex++;
        }
        return `${value.toFixed(1)} ${units[unitIndex]}`;
    }

    /**
     * Get downloaded size display
     * @returns {string} Downloaded size display
     */
    getDownloadedSizeDisplay() {
        return this.getFileSizeDisplay(this.downloadedSize || 0);
    }

    /**
     * Get progress percentage with decimals
     * @param {number} decimals - Decimal places
     * @returns {string} Progress percentage
     */
    getProgressDisplay(decimals = 1) {
        return `${this.downloadProgress.toFixed(decimals)}%`;
    }

    /**
     * Get time remaining display
     * @returns {string} Time remaining display
     */
    getTimeRemainingDisplay() {
        const seconds = this.getTimeRemaining();
        if (seconds <= 0) return 'Calculating...';
        if (seconds < 60) return `${Math.ceil(seconds)}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s`;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    /**
     * Get download duration display
     * @returns {string} Duration display
     */
    getDurationDisplay() {
        const seconds = this.downloadDuration || 0;
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    /**
     * Get download stats summary
     * @returns {Object} Stats summary
     */
    getStatsSummary() {
        return {
            progress: this.downloadProgress,
            downloadedSize: this.downloadedSize || 0,
            totalSize: this.totalSize || this.fileSize || 0,
            speed: this.downloadSpeed || 0,
            speedDisplay: this.getSpeedDisplay(),
            timeRemaining: this.getTimeRemaining(),
            timeRemainingDisplay: this.getTimeRemainingDisplay(),
            duration: this.downloadDuration || 0,
            durationDisplay: this.getDurationDisplay(),
            attemptCount: this.attemptCount || 0,
            retryCount: this.retryCount || 0,
            status: this.downloadStatus,
            isCompleted: this.isCompleted,
            isPaused: this.isPaused,
            isResumed: this.isResumed
        };
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Get time ago for download
     * @param {string} locale - Locale
     * @returns {string} Time ago
     */
    getTimeAgo(locale = 'en-US') {
        const date = this.downloadedAt || this.createdAt;
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        if (weeks < 4) return `${weeks}w ago`;
        if (months < 12) return `${months}mo ago`;
        return `${years}y ago`;
    }

    /**
     * Get formatted date
     * @param {string} locale - Locale
     * @param {Object} options - Date options
     * @returns {string} Formatted date
     */
    getCreatedDate(locale = 'en-US', options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return this.createdAt.toLocaleDateString(locale, { ...defaultOptions, ...options });
    }

    /**
     * Get formatted download date
     * @param {string} locale - Locale
     * @param {Object} options - Date options
     * @returns {string} Formatted date
     */
    getDownloadedDate(locale = 'en-US', options = {}) {
        const date = this.downloadedAt || this.createdAt;
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString(locale, { ...defaultOptions, ...options });
    }

    /**
     * Check if download is for product
     * @param {string} productId - Product ID
     * @returns {boolean} True if for product
     */
    isForProduct(productId) {
        return this.productId === productId;
    }

    /**
     * Clone download record
     * @param {Object} options - Clone options
     * @param {boolean} options.keepId - Keep original ID
     * @param {boolean} options.keepTimestamps - Keep original timestamps
     * @param {boolean} options.keepStats - Keep stats
     * @param {boolean} options.resetProgress - Reset progress
     * @returns {Download} Cloned download
     */
    clone(options = {}) {
        const { 
            keepId = false, 
            keepTimestamps = false, 
            keepStats = false,
            resetProgress = true
        } = options;
        
        const data = this.toFirestore({ 
            includeMetadata: true, 
            includeAnalytics: true, 
            includeAttempts: true,
            includeLicense: true
        });
        
        if (!keepId) {
            delete data.id;
            data.id = this.generateId();
        }
        
        if (!keepTimestamps) {
            data.createdAt = new Date();
            data.updatedAt = new Date();
            data.startedAt = null;
            data.downloadedAt = null;
            data.completedAt = null;
            data.cancelledAt = null;
            data.failedAt = null;
            data.lastActivityAt = null;
            data.expiresAt = null;
        }
        
        if (resetProgress) {
            data.downloadProgress = 0;
            data.downloadStatus = 'pending';
            data.isCompleted = false;
            data.isCancelled = false;
            data.isFailed = false;
            data.isPaused = false;
            data.isResumed = false;
            data.bytesDownloaded = 0;
            data.downloadedSize = 0;
            data.downloadSpeed = 0;
            data.downloadDuration = 0;
            data.attemptCount = 0;
            data.retryCount = 0;
            data.downloadAttempts = [];
            data.lastError = '';
            data.lastErrorCode = '';
            data.failReason = '';
        }
        
        if (!keepStats) {
            data.analytics = {
                totalDownloads: 0,
                totalBytesDownloaded: 0,
                averageSpeed: 0,
                peakSpeed: 0,
                downloadTime: 0,
                completionRate: 0,
                failureRate: 0,
                dailyDownloads: {},
                weeklyDownloads: {},
                monthlyDownloads: {},
                deviceStats: { mobile: 0, desktop: 0, tablet: 0 },
                locationStats: {},
                referrerStats: {},
                timeStats: {}
            };
            data.downloadCount = 0;
            data.userDownloadCount = 0;
        }
        
        data.isFraud = false;
        data.fraudReason = '';
        data.fraudScore = 0;
        data.isDeleted = false;
        data.isValid = true;
        
        return new Download({ ...data, id: data.id });
    }

    /**
     * Compare two download records
     * @param {Download} other - Other download
     * @returns {boolean} True if equal
     */
    equals(other) {
        if (!other) return false;
        return this.id === other.id;
    }

    /**
     * Convert to string
     * @returns {string} String representation
     */
    toString() {
        return `Download(${this.id}, ${this.userId}, ${this.productId}, ${this.downloadStatus})`;
    }

    /**
     * Convert to display string
     * @returns {string} Display string
     */
    toDisplayString() {
        return `${this.productTitle || 'Product'} - ${this.downloadStatus}`;
    }

    // ============================================
    // STATIC FACTORY METHODS
    // ============================================

    /**
     * Create download from Firestore data
     * @param {Object} data - Firestore data
     * @param {string} id - Document ID
     * @returns {Download} Download instance
     */
    static fromFirestore(data, id) {
        const downloadData = { ...data, id };
        return new Download(downloadData);
    }

    /**
     * Create downloads from Firestore array
     * @param {Array} dataArray - Firestore data array
     * @returns {Array<Download>} Download instances
     */
    static fromFirestoreArray(dataArray) {
        if (!Array.isArray(dataArray)) return [];
        return dataArray.map(data => Download.fromFirestore(data, data.id));
    }

    /**
     * Create a free download
     * @param {string} userId - User ID
     * @param {string} productId - Product ID
     * @param {Object} product - Product data
     * @param {Object} options - Options
     * @param {string} options.downloadUrl - Download URL
     * @param {Object} options.deviceInfo - Device info
     * @returns {Download} Free download
     */
    static createFree(userId, productId, product, options = {}) {
        const { downloadUrl = '', deviceInfo = {} } = options;

        return new Download({
            userId,
            productId,
            productTitle: product.title || '',
            productThumbnail: product.thumbnail || '',
            productCategory: product.category || '',
            productPrice: product.price || 0,
            downloadUrl,
            fileName: product.fileName || '',
            fileSize: product.fileSize || 0,
            fileType: product.fileType || '',
            fileExtension: product.fileExtension || '',
            productType: product.productType || 'digital',
            downloadType: 'free',
            downloadStatus: 'pending',
            deviceInfo: deviceInfo.deviceInfo || '',
            deviceType: deviceInfo.deviceType || '',
            browser: deviceInfo.browser || '',
            os: deviceInfo.os || ''
        });
    }

    /**
     * Create a paid download
     * @param {string} userId - User ID
     * @param {string} productId - Product ID
     * @param {Object} product - Product data
     * @param {Object} options - Options
     * @param {string} options.downloadUrl - Download URL
     * @param {string} options.paymentId - Payment ID
     * @param {number} options.paymentAmount - Payment amount
     * @param {string} options.paymentMethod - Payment method
     * @param {Object} options.deviceInfo - Device info
     * @returns {Download} Paid download
     */
    static createPaid(userId, productId, product, options = {}) {
        const { downloadUrl = '', paymentId = '', paymentAmount = 0, paymentMethod = '', deviceInfo = {} } = options;

        return new Download({
            userId,
            productId,
            productTitle: product.title || '',
            productThumbnail: product.thumbnail || '',
            productCategory: product.category || '',
            productPrice: product.price || 0,
            downloadUrl,
            fileName: product.fileName || '',
            fileSize: product.fileSize || 0,
            fileType: product.fileType || '',
            fileExtension: product.fileExtension || '',
            productType: product.productType || 'digital',
            downloadType: 'paid',
            downloadStatus: 'pending',
            paymentId,
            paymentAmount,
            paymentMethod,
            paymentStatus: 'completed',
            deviceInfo: deviceInfo.deviceInfo || '',
            deviceType: deviceInfo.deviceType || '',
            browser: deviceInfo.browser || '',
            os: deviceInfo.os || ''
        });
    }

    /**
     * Create an ad rewarded download
     * @param {string} userId - User ID
     * @param {string} productId - Product ID
     * @param {Object} product - Product data
     * @param {Object} options - Options
     * @param {string} options.downloadUrl - Download URL
     * @param {string} options.adId - Ad watch ID
     * @param {Object} options.deviceInfo - Device info
     * @returns {Download} Ad rewarded download
     */
    static createAdRewarded(userId, productId, product, options = {}) {
        const { downloadUrl = '', adId = '', deviceInfo = {} } = options;

        return new Download({
            userId,
            productId,
            productTitle: product.title || '',
            productThumbnail: product.thumbnail || '',
            productCategory: product.category || '',
            productPrice: product.price || 0,
            downloadUrl,
            fileName: product.fileName || '',
            fileSize: product.fileSize || 0,
            fileType: product.fileType || '',
            fileExtension: product.fileExtension || '',
            productType: product.productType || 'digital',
            downloadType: 'ad_rewarded',
            downloadStatus: 'pending',
            adWatched: true,
            adId,
            deviceInfo: deviceInfo.deviceInfo || '',
            deviceType: deviceInfo.deviceType || '',
            browser: deviceInfo.browser || '',
            os: deviceInfo.os || ''
        });
    }

    /**
     * Create a coin rewarded download
     * @param {string} userId - User ID
     * @param {string} productId - Product ID
     * @param {Object} product - Product data
     * @param {Object} options - Options
     * @param {string} options.downloadUrl - Download URL
     * @param {number} options.coinsUsed - Coins used
     * @param {Object} options.deviceInfo - Device info
     * @returns {Download} Coin rewarded download
     */
    static createCoinRewarded(userId, productId, product, options = {}) {
        const { downloadUrl = '', coinsUsed = 0, deviceInfo = {} } = options;

        return new Download({
            userId,
            productId,
            productTitle: product.title || '',
            productThumbnail: product.thumbnail || '',
            productCategory: product.category || '',
            productPrice: product.price || 0,
            downloadUrl,
            fileName: product.fileName || '',
            fileSize: product.fileSize || 0,
            fileType: product.fileType || '',
            fileExtension: product.fileExtension || '',
            productType: product.productType || 'digital',
            downloadType: 'coin_rewarded',
            downloadStatus: 'pending',
            coinsUsed,
            deviceInfo: deviceInfo.deviceInfo || '',
            deviceType: deviceInfo.deviceType || '',
            browser: deviceInfo.browser || '',
            os: deviceInfo.os || ''
        });
    }

    // ============================================
    // STATIC QUERY & FILTER METHODS
    // ============================================

    /**
     * Filter downloads by user
     * @param {Array<Download>} downloads - Downloads array
     * @param {string} userId - User ID
     * @returns {Array<Download>} Filtered downloads
     */
    static filterByUser(downloads, userId) {
        if (!userId) return downloads;
        return downloads.filter(d => d.userId === userId);
    }

    /**
     * Filter downloads by product
     * @param {Array<Download>} downloads - Downloads array
     * @param {string} productId - Product ID
     * @returns {Array<Download>} Filtered downloads
     */
    static filterByProduct(downloads, productId) {
        if (!productId) return downloads;
        return downloads.filter(d => d.productId === productId);
    }

    /**
     * Filter downloads by status
     * @param {Array<Download>} downloads - Downloads array
     * @param {string} status - Download status
     * @returns {Array<Download>} Filtered downloads
     */
    static filterByStatus(downloads, status) {
        if (!status) return downloads;
        return downloads.filter(d => d.downloadStatus === status);
    }

    /**
     * Filter completed downloads
     * @param {Array<Download>} downloads - Downloads array
     * @param {boolean} completed - Completed status
     * @returns {Array<Download>} Filtered downloads
     */
    static filterByCompleted(downloads, completed = true) {
        return downloads.filter(d => d.isCompleted === completed);
    }

    /**
     * Filter valid downloads
     * @param {Array<Download>} downloads - Downloads array
     * @param {boolean} isValid - Valid status
     * @returns {Array<Download>} Filtered downloads
     */
    static filterByValid(downloads, isValid = true) {
        return downloads.filter(d => d.isValid === isValid);
    }

    /**
     * Filter by download type
     * @param {Array<Download>} downloads - Downloads array
     * @param {string|Array<string>} types - Type(s) to filter
     * @returns {Array<Download>} Filtered downloads
     */
    static filterByType(downloads, types) {
        if (!types) return downloads;
        if (!Array.isArray(types)) types = [types];
        return downloads.filter(d => types.includes(d.downloadType));
    }

    /**
     * Filter downloads by date range
     * @param {Array<Download>} downloads - Downloads array
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Array<Download>} Filtered downloads
     */
    static filterByDateRange(downloads, startDate, endDate) {
        return downloads.filter(d => {
            const date = d.createdAt;
            return date >= startDate && date <= endDate;
        });
    }

    /**
     * Sort downloads by date
     * @param {Array<Download>} downloads - Downloads array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<Download>} Sorted downloads
     */
    static sortByDate(downloads, order = 'desc') {
        const sorted = [...downloads];
        sorted.sort((a, b) => {
            const aTime = a.createdAt.getTime();
            const bTime = b.createdAt.getTime();
            return order === 'asc' ? aTime - bTime : bTime - aTime;
        });
        return sorted;
    }

    /**
     * Sort downloads by file size
     * @param {Array<Download>} downloads - Downloads array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<Download>} Sorted downloads
     */
    static sortBySize(downloads, order = 'desc') {
        const sorted = [...downloads];
        sorted.sort((a, b) => {
            return order === 'asc' ? (a.fileSize || 0) - (b.fileSize || 0) : (b.fileSize || 0) - (a.fileSize || 0);
        });
        return sorted;
    }

    /**
     * Get total downloads count by user
     * @param {Array<Download>} downloads - Downloads array
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {boolean} options.includeFailed - Include failed downloads
     * @param {boolean} options.includeCancelled - Include cancelled downloads
     * @returns {number} Total count
     */
    static getTotalCount(downloads, userId, options = {}) {
        const { includeFailed = false, includeCancelled = false } = options;
        
        let filtered = downloads.filter(d => d.userId === userId);
        
        if (!includeFailed) {
            filtered = filtered.filter(d => !d.isFailed);
        }
        if (!includeCancelled) {
            filtered = filtered.filter(d => !d.isCancelled);
        }
        
        return filtered.length;
    }

    /**
     * Get total downloads by type
     * @param {Array<Download>} downloads - Downloads array
     * @param {string} userId - User ID
     * @returns {Object} Counts by type
     */
    static getCountsByType(downloads, userId) {
        const filtered = downloads.filter(d => d.userId === userId && d.isCompleted);
        const types = ['free', 'paid', 'ad_rewarded', 'coin_rewarded'];
        const result = { total: filtered.length };
        
        for (const type of types) {
            result[type] = filtered.filter(d => d.downloadType === type).length;
        }
        
        return result;
    }

    /**
     * Get total file size downloaded
     * @param {Array<Download>} downloads - Downloads array
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {boolean} options.includeCompleted - Include completed only
     * @returns {number} Total file size
     */
    static getTotalSize(downloads, userId, options = {}) {
        const { includeCompleted = true } = options;
        
        let filtered = downloads.filter(d => d.userId === userId);
        
        if (includeCompleted) {
            filtered = filtered.filter(d => d.isCompleted);
        }
        
        return filtered.reduce((sum, d) => sum + (d.fileSize || 0), 0);
    }

    /**
     * Get download stats by date
     * @param {Array<Download>} downloads - Downloads array
     * @param {string} userId - User ID
     * @param {number} days - Number of days
     * @returns {Object} Daily stats
     */
    static getDailyStats(downloads, userId, days = 7) {
        const stats = {};
        const now = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const key = date.toISOString().split('T')[0];
            stats[key] = { total: 0, completed: 0, failed: 0, size: 0 };
        }
        
        const filtered = downloads.filter(d => d.userId === userId);
        
        for (const dl of filtered) {
            const key = dl.createdAt.toISOString().split('T')[0];
            if (stats[key]) {
                stats[key].total++;
                if (dl.isCompleted) {
                    stats[key].completed++;
                    stats[key].size += dl.fileSize || 0;
                }
                if (dl.isFailed) {
                    stats[key].failed++;
                }
            }
        }
        
        return stats;
    }

    /**
     * Get completion rate
     * @param {Array<Download>} downloads - Downloads array
     * @param {string} userId - User ID
     * @returns {number} Completion rate (0-100)
     */
    static getCompletionRate(downloads, userId) {
        const filtered = downloads.filter(d => d.userId === userId);
        const total = filtered.length;
        const completed = filtered.filter(d => d.isCompleted).length;
        return total > 0 ? (completed / total) * 100 : 0;
    }

    /**
     * Check if data is valid download data
     * @param {Object} data - Data to check
     * @returns {boolean} True if valid
     */
    static isValidDownloadData(data) {
        return data && typeof data === 'object' &&
            data.userId && data.userId.trim() !== '' &&
            data.productId && data.productId.trim() !== '' &&
            data.downloadUrl && data.downloadUrl.trim() !== '';
    }

    /**
     * Group downloads by date
     * @param {Array<Download>} downloads - Downloads array
     * @param {string} groupBy - 'day', 'week', 'month'
     * @returns {Object} Grouped by date
     */
    static groupByDate(downloads, groupBy = 'day') {
        const groups = {};
        for (const dl of downloads) {
            let key;
            switch (groupBy) {
                case 'week':
                    const weekStart = new Date(dl.createdAt);
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    key = weekStart.toDateString();
                    break;
                case 'month':
                    key = `${dl.createdAt.getFullYear()}-${dl.createdAt.getMonth() + 1}`;
                    break;
                default:
                    key = dl.createdAt.toDateString();
            }
            if (!groups[key]) groups[key] = [];
            groups[key].push(dl);
        }
        return groups;
    }

    /**
     * Group downloads by status
     * @param {Array<Download>} downloads - Downloads array
     * @returns {Object} Grouped by status
     */
    static groupByStatus(downloads) {
        const groups = {
            pending: [],
            downloading: [],
            completed: [],
            failed: [],
            cancelled: [],
            expired: []
        };
        for (const dl of downloads) {
            if (groups[dl.downloadStatus]) {
                groups[dl.downloadStatus].push(dl);
            } else {
                groups.other = groups.other || [];
                groups.other.push(dl);
            }
        }
        return groups;
    }

    /**
     * Group downloads by type
     * @param {Array<Download>} downloads - Downloads array
     * @returns {Object} Grouped by type
     */
    static groupByType(downloads) {
        const groups = {
            free: [],
            paid: [],
            ad_rewarded: [],
            coin_rewarded: []
        };
        for (const dl of downloads) {
            if (groups[dl.downloadType]) {
                groups[dl.downloadType].push(dl);
            } else {
                groups.other = groups.other || [];
                groups.other.push(dl);
            }
        }
        return groups;
    }
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default Download;


/**
 * Helpers to match index.js expectation for Download
 */
export function createDownload(data) {
    return new Download(data);
}

export function validateDownload(data) {
    const download = data instanceof Download ? data : new Download(data);
    return download.validate ? download.validate() : { isValid: true };
}

export function downloadToFirestore(download) {
    if (download && typeof download.toFirestore === 'function') {
        return download.toFirestore();
    }
    return download;
}

export function firestoreToDownload(doc) {
    if (!doc) return null;
    const data = typeof doc.data === 'function' ? doc.data() : doc;
    const id = typeof doc.id === 'string' ? doc.id : data.id;
    if (typeof Download.fromFirestore === 'function') {
        return Download.fromFirestore(data, id);
    }
    return new Download({ ...data, id });
}
// ============================================================
// END OF FILE: download-model.js
// ============================================================