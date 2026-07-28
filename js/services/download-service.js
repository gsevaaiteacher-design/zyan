// ============================================================
// FILE: js/services/download-service.js
// PURPOSE: Complete File Download Service with Ad Monetization - PRODUCTION READY
// DEPENDENCY: auth-service.js, database-service.js, ad-service.js, storage-service.js
// USED BY: product-detail.js, history-screen.js, all screens
// VERSION: 3.0.0 - FULLY UPDATED
// ============================================================

import { errorHandler, downloadError, networkError } from './error-handler.js';
import { logger } from './logger.js';
import { databaseService } from './database-service.js';
import { storageService } from './storage-service.js';
import { adService, showRewardedAd, canWatchAd, AD_CONFIG } from './ad-service.js';
import { getCurrentUser, isAuthenticated } from './auth-service.js';

// ============================================================
// DOWNLOAD CONFIGURATION
// ============================================================

const DOWNLOAD_CONFIG = {
    // Enable/Disable downloads
    enabled: true,
    
    // Maximum file size for direct download (MB)
    maxDirectDownload: 100,
    
    // Maximum file size for streaming (MB)
    maxStreamSize: 500,
    
    // Chunk size for streaming (MB)
    chunkSize: 5,
    
    // Allowed file types for download
    allowedTypes: [
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'audio/mp4',
        'video/mp4',
        'video/webm',
        'video/ogg',
        'application/json',
        'application/xml',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ],
    
    // Download types
    types: {
        FREE: 'free',
        PAID: 'paid',
        AD_REWARDED: 'ad_rewarded',
        COIN: 'coin',
        SUBSCRIPTION: 'subscription'
    },
    
    // Coin cost for downloads
    coinCost: {
        default: 5,
        video: 10,
        audio: 5,
        pdf: 3,
        image: 2,
        software: 15,
        document: 3
    },
    
    // Free downloads per month
    freeDownloadsPerMonth: 5,
    
    // Download history retention (days)
    historyRetention: 90,
    
    // Download timeout (ms)
    timeout: 60000, // 1 minute
    
    // Retry settings
    maxRetries: 3,
    retryDelay: 2000,
    
    // Speed limit (bytes per second) - 0 = no limit
    speedLimit: 0,
    
    // Resume support
    resumeSupport: true,
    
    // Track downloads
    trackDownloads: true
};

// ============================================================
// DOWNLOAD MANAGER CLASS
// ============================================================

class DownloadManager {
    constructor() {
        this._activeDownloads = new Map();
        this._downloadQueue = [];
        this._isProcessing = false;
        this._maxConcurrent = 3;
        this._completedDownloads = [];
        this._failedDownloads = [];
        this._listeners = [];
        this._totalBytes = 0;
        this._downloadedBytes = 0;
        this._speedHistory = [];
        this._lastSpeedCheck = Date.now();
        this._lastBytes = 0;
        this._currentSpeed = 0;
        this._dailyDownloads = 0;
        this._dailyResetTimer = null;
        this._monthlyDownloads = new Map();
        this._resumeData = new Map();
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    /**
     * Initialize download manager
     */
    async init(options = {}) {
        const {
            enabled = true,
            maxConcurrent = 3,
            maxDirectDownload = 100,
            timeout = 60000
        } = options;

        try {
            this._enabled = enabled;
            this._maxConcurrent = maxConcurrent;
            DOWNLOAD_CONFIG.maxDirectDownload = maxDirectDownload;
            DOWNLOAD_CONFIG.timeout = timeout;

            if (!this._enabled) {
                logger.info('📥 Downloads are disabled');
                return this;
            }

            // Load user download history
            await this._loadUserHistory();

            // Set daily reset timer
            this._setDailyResetTimer();

            logger.info('📥 Download Manager initialized', {
                maxConcurrent: this._maxConcurrent,
                maxDirectDownload: DOWNLOAD_CONFIG.maxDirectDownload,
                freeDownloadsPerMonth: DOWNLOAD_CONFIG.freeDownloadsPerMonth
            });

            return this;
        } catch (error) {
            logger.error('❌ Download Manager initialization failed', { error: error.message });
            throw error;
        }
    }

    // ============================================
    // USER HISTORY
    // ============================================

    /**
     * Load user download history
     */
    async _loadUserHistory() {
        try {
            const userId = getCurrentUser()?.uid;
            if (!userId) return;

            const result = await databaseService.query('downloads', {
                where: [['userId', '==', userId]],
                orderBy: [['downloadedAt', 'desc']],
                limit: 100
            });

            this._completedDownloads = result.data || [];
            
            // Calculate monthly downloads
            const now = new Date();
            const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const monthly = this._completedDownloads.filter(d => {
                const date = new Date(d.downloadedAt);
                return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
            });
            this._monthlyDownloads.set(monthKey, monthly.length);

            // Calculate today's downloads
            const today = now.toDateString();
            this._dailyDownloads = this._completedDownloads.filter(d => 
                new Date(d.downloadedAt).toDateString() === today
            ).length;

            logger.debug(`📥 Loaded ${this._completedDownloads.length} download records`);
        } catch (error) {
            logger.error('❌ Failed to load download history', { error: error.message });
        }
    }

    // ============================================
    // DOWNLOAD CHECKS
    // ============================================

    /**
     * Check if user can download
     */
    async canDownload(product, options = {}) {
        const userId = getCurrentUser()?.uid;
        if (!userId) {
            return { allowed: false, reason: 'Please login to download' };
        }

        const {
            checkCoins = true,
            checkFreeLimit = true,
            checkAdLimit = true,
            checkFileSize = true
        } = options;

        // Check file size
        if (checkFileSize && product.fileSize) {
            const sizeMB = product.fileSize / (1024 * 1024);
            if (sizeMB > DOWNLOAD_CONFIG.maxDirectDownload) {
                return { 
                    allowed: false, 
                    reason: `File too large (${sizeMB.toFixed(1)}MB). Max: ${DOWNLOAD_CONFIG.maxDirectDownload}MB`,
                    size: sizeMB,
                    maxSize: DOWNLOAD_CONFIG.maxDirectDownload
                };
            }
        }

        // Check free product
        if (product.isFree) {
            return this._checkFreeDownload(userId, product);
        }

        // Check paid product
        if (product.isPaid) {
            return this._checkPaidDownload(userId, product);
        }

        // Check coin download
        if (checkCoins) {
            const coinCheck = await this._checkCoinDownload(userId, product);
            if (!coinCheck.allowed) {
                return coinCheck;
            }
        }

        // Check free limit
        if (checkFreeLimit) {
            const freeCheck = await this._checkFreeLimit(userId);
            if (!freeCheck.allowed) {
                return freeCheck;
            }
        }

        // Check ad limit
        if (checkAdLimit) {
            const adCheck = await this._checkAdLimit(userId);
            if (!adCheck.allowed) {
                return adCheck;
            }
        }

        return { allowed: true };
    }

    /**
     * Check free download
     */
    async _checkFreeDownload(userId, product) {
        const freeCheck = await this._checkFreeLimit(userId);
        if (!freeCheck.allowed) {
            return {
                allowed: false,
                reason: freeCheck.reason,
                type: DOWNLOAD_CONFIG.types.FREE,
                requiresAd: false
            };
        }

        return {
            allowed: true,
            type: DOWNLOAD_CONFIG.types.FREE,
            requiresAd: false
        };
    }

    /**
     * Check paid download
     */
    async _checkPaidDownload(userId, product) {
        // Check if user has purchased
        const purchase = await databaseService.query('purchases', {
            where: [
                ['userId', '==', userId],
                ['productId', '==', product.id],
                ['status', '==', 'completed']
            ]
        });

        if (purchase.data.length > 0) {
            return {
                allowed: true,
                type: DOWNLOAD_CONFIG.types.PAID,
                requiresAd: false,
                purchaseId: purchase.data[0].id
            };
        }

        return {
            allowed: false,
            reason: 'Product not purchased',
            type: DOWNLOAD_CONFIG.types.PAID,
            requiresAd: false
        };
    }

    /**
     * Check coin download
     */
    async _checkCoinDownload(userId, product) {
        const cost = this._getCoinCost(product);
        const coins = await adService.getUserCoins(userId);

        if (coins < cost) {
            return {
                allowed: false,
                reason: `Insufficient coins. Need ${cost}, have ${coins}`,
                type: DOWNLOAD_CONFIG.types.COIN,
                cost,
                coins,
                requiresAd: false
            };
        }

        return {
            allowed: true,
            type: DOWNLOAD_CONFIG.types.COIN,
            cost,
            coins,
            requiresAd: false
        };
    }

    /**
     * Check free download limit
     */
    async _checkFreeLimit(userId) {
        const monthKey = this._getMonthKey();
        const used = this._monthlyDownloads.get(monthKey) || 0;
        const limit = DOWNLOAD_CONFIG.freeDownloadsPerMonth;

        if (used >= limit) {
            return {
                allowed: false,
                reason: 'Free download limit reached',
                used,
                limit,
                type: DOWNLOAD_CONFIG.types.FREE
            };
        }

        return { allowed: true, used, limit };
    }

    /**
     * Check ad limit
     */
    async _checkAdLimit(userId) {
        const adStatus = canWatchAd(userId);
        if (!adStatus.allowed) {
            return {
                allowed: false,
                reason: adStatus.message || 'Ad not available',
                type: DOWNLOAD_CONFIG.types.AD_REWARDED
            };
        }

        return {
            allowed: true,
            type: DOWNLOAD_CONFIG.types.AD_REWARDED,
            requiresAd: true
        };
    }

    /**
     * Get coin cost for product
     */
    _getCoinCost(product) {
        if (product.coinCost) return product.coinCost;

        const fileType = product.fileType || '';
        const fileSize = product.fileSize || 0;

        // Determine cost based on file type
        let cost = DOWNLOAD_CONFIG.coinCost.default;

        if (fileType.includes('video')) cost = DOWNLOAD_CONFIG.coinCost.video;
        else if (fileType.includes('audio')) cost = DOWNLOAD_CONFIG.coinCost.audio;
        else if (fileType.includes('pdf')) cost = DOWNLOAD_CONFIG.coinCost.pdf;
        else if (fileType.includes('image')) cost = DOWNLOAD_CONFIG.coinCost.image;
        else if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) {
            cost = DOWNLOAD_CONFIG.coinCost.software;
        }

        // Adjust for file size
        if (fileSize > 100 * 1024 * 1024) { // > 100MB
            cost = Math.ceil(cost * 1.5);
        }

        return cost;
    }

    /**
     * Get month key
     */
    _getMonthKey() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    // ============================================
    // DOWNLOAD EXECUTION
    // ============================================

    /**
     * Start download
     */
    async download(productId, options = {}) {
        if (!this._enabled) {
            throw downloadError('Downloads are disabled', { code: 'DISABLED' });
        }

        const userId = getCurrentUser()?.uid;
        if (!userId) {
            throw downloadError('Please login to download', { code: 'NOT_AUTHENTICATED' });
        }

        const {
            type = DOWNLOAD_CONFIG.types.FREE,
            onProgress = null,
            onComplete = null,
            onError = null,
            autoStart = true,
            showAd = true,
            useCoins = false
        } = options;

        try {
            // Get product
            const product = await databaseService.getProduct(productId);
            if (!product) {
                throw downloadError('Product not found', { code: 'PRODUCT_NOT_FOUND' });
            }

            // Check if already downloading
            if (this._activeDownloads.has(productId)) {
                return this._activeDownloads.get(productId);
            }

            // Check if user can download
            const canDownloadResult = await this.canDownload(product, {
                checkCoins: !useCoins,
                checkFreeLimit: type === DOWNLOAD_CONFIG.types.FREE,
                checkAdLimit: showAd
            });

            if (!canDownloadResult.allowed) {
                throw downloadError(canDownloadResult.reason, {
                    code: 'DOWNLOAD_NOT_ALLOWED',
                    context: canDownloadResult
                });
            }

            // Handle ad download
            if (canDownloadResult.requiresAd) {
                const adResult = await showRewardedAd({
                    rewardType: 'download',
                    rewardData: { productId },
                    onSuccess: async () => {
                        await this._executeDownload(product, userId, {
                            ...options,
                            type: DOWNLOAD_CONFIG.types.AD_REWARDED,
                            adWatched: true
                        });
                    }
                });
                return adResult;
            }

            // Handle coin download
            if (useCoins && canDownloadResult.type === DOWNLOAD_CONFIG.types.COIN) {
                const cost = canDownloadResult.cost || this._getCoinCost(product);
                await adService.deductCoins(userId, cost, 'download', {
                    productId,
                    productTitle: product.title
                });
            }

            // Execute download
            return this._executeDownload(product, userId, {
                ...options,
                type: canDownloadResult.type || type
            });

        } catch (error) {
            logger.error('❌ Download failed', { error: error.message, productId });
            if (onError) onError(error);
            throw errorHandler.handle(error, {
                type: 'DOWNLOAD',
                context: { productId }
            });
        }
    }

    /**
     * Execute download
     */
    async _executeDownload(product, userId, options = {}) {
        const {
            type = DOWNLOAD_CONFIG.types.FREE,
            onProgress = null,
            onComplete = null,
            adWatched = false,
            resume = false
        } = options;

        const downloadId = this._generateDownloadId();
        const startTime = Date.now();

        // Create download record
        const downloadRecord = {
            id: downloadId,
            userId,
            productId: product.id,
            productTitle: product.title,
            productType: type,
            adWatched,
            downloadUrl: product.downloadUrl,
            fileSize: product.fileSize || 0,
            fileType: product.fileType || '',
            startedAt: new Date().toISOString(),
            status: 'downloading',
            progress: 0,
            speed: 0,
            downloadedBytes: 0,
            totalBytes: product.fileSize || 0,
            retryCount: 0,
            resumeData: null
        };

        this._activeDownloads.set(product.id, downloadRecord);
        this._notifyListeners('start', downloadRecord);

        try {
            // Get download URL
            let url = product.downloadUrl;
            if (!url) {
                // Get from storage
                const filePath = product.storagePath || `products/${product.id}/files/${product.fileName}`;
                const result = await storageService.download(filePath);
                url = result.url;
            }

            // Create download task
            const task = new DownloadTask({
                url,
                fileName: product.fileName || `${product.title}.${product.fileType?.split('/')[1] || 'file'}`,
                fileSize: product.fileSize || 0,
                downloadId,
                userId,
                productId: product.id,
                onProgress: (progress, speed, bytesDownloaded, totalBytes) => {
                    downloadRecord.progress = progress;
                    downloadRecord.speed = speed;
                    downloadRecord.downloadedBytes = bytesDownloaded;
                    downloadRecord.totalBytes = totalBytes;
                    this._updateSpeed(speed);
                    if (onProgress) onProgress(progress, speed, bytesDownloaded, totalBytes);
                    this._notifyListeners('progress', downloadRecord);
                },
                onComplete: async (data) => {
                    downloadRecord.status = 'completed';
                    downloadRecord.completedAt = new Date().toISOString();
                    downloadRecord.duration = (Date.now() - startTime) / 1000;
                    downloadRecord.downloadedBytes = data.totalBytes || downloadRecord.totalBytes;
                    
                    // Save to history
                    await this._saveDownloadHistory(downloadRecord);

                    // Update product stats
                    await databaseService.incrementProductDownloads(product.id);

                    // Update user stats
                    await this._updateUserStats(userId);

                    this._activeDownloads.delete(product.id);
                    this._completedDownloads.push(downloadRecord);
                    this._notifyListeners('complete', downloadRecord);
                    if (onComplete) onComplete(downloadRecord);

                    logger.info(`📥 Download completed: ${product.title}`, {
                        downloadId,
                        duration: downloadRecord.duration,
                        size: downloadRecord.downloadedBytes
                    });

                    return downloadRecord;
                },
                onError: async (error) => {
                    downloadRecord.status = 'failed';
                    downloadRecord.error = error.message;
                    downloadRecord.failedAt = new Date().toISOString();
                    downloadRecord.retryCount++;

                    // Retry logic
                    if (downloadRecord.retryCount < DOWNLOAD_CONFIG.maxRetries) {
                        logger.warn(`🔄 Retrying download (${downloadRecord.retryCount}/${DOWNLOAD_CONFIG.maxRetries})`);
                        downloadRecord.status = 'retrying';
                        this._notifyListeners('retry', downloadRecord);
                        
                        // Wait and retry
                        await this._sleep(DOWNLOAD_CONFIG.retryDelay * downloadRecord.retryCount);
                        return this._executeDownload(product, userId, {
                            ...options,
                            resume: true
                        });
                    }

                    this._activeDownloads.delete(product.id);
                    this._failedDownloads.push(downloadRecord);
                    this._notifyListeners('error', { downloadRecord, error });
                    
                    logger.error(`❌ Download failed: ${product.title}`, {
                        downloadId,
                        error: error.message,
                        retries: downloadRecord.retryCount
                    });

                    throw error;
                }
            });

            // Start download
            return task.start();

        } catch (error) {
            this._activeDownloads.delete(product.id);
            logger.error('❌ Download execution failed', { error: error.message, productId: product.id });
            throw error;
        }
    }

    // ============================================
    // DOWNLOAD HISTORY
    // ============================================

    /**
     * Save download history
     */
    async _saveDownloadHistory(record) {
        try {
            await databaseService.create('downloads', {
                userId: record.userId,
                productId: record.productId,
                productTitle: record.productTitle,
                productType: record.productType,
                adWatched: record.adWatched || false,
                downloadUrl: record.downloadUrl || '',
                fileSize: record.downloadedBytes || record.fileSize || 0,
                fileType: record.fileType || '',
                downloadedAt: new Date().toISOString(),
                completedAt: record.completedAt || new Date().toISOString(),
                duration: record.duration || 0,
                status: record.status || 'completed',
                deviceInfo: this._getDeviceInfo(),
                ip: record.ip || '',
                isDeleted: false
            });

            // Update monthly count
            const monthKey = this._getMonthKey();
            const current = this._monthlyDownloads.get(monthKey) || 0;
            this._monthlyDownloads.set(monthKey, current + 1);

            // Update daily count
            this._dailyDownloads++;

        } catch (error) {
            logger.error('❌ Failed to save download history', { error: error.message });
        }
    }

    /**
     * Get download history
     */
    async getHistory(options = {}) {
        const {
            limit = 50,
            offset = 0,
            productId = null,
            status = null,
            from = null,
            to = null
        } = options;

        const userId = getCurrentUser()?.uid;
        if (!userId) return [];

        try {
            let query = { userId, isDeleted: false };
            if (productId) query.productId = productId;
            if (status) query.status = status;
            if (from) query.downloadedAt = { $gte: from };
            if (to) query.downloadedAt = { ...query.downloadedAt, $lte: to };

            const result = await databaseService.query('downloads', {
                where: Object.entries(query).map(([key, value]) => [key, '==', value]),
                orderBy: [['downloadedAt', 'desc']],
                limit,
                offset
            });

            return result.data || [];
        } catch (error) {
            logger.error('❌ Failed to get download history', { error: error.message });
            return [];
        }
    }

    /**
     * Get download stats
     */
    async getStats(userId = null) {
        const uid = userId || getCurrentUser()?.uid;
        if (!uid) return {};

        try {
            const downloads = await databaseService.query('downloads', {
                where: [['userId', '==', uid], ['isDeleted', '==', false]]
            });

            const total = downloads.data.length;
            const completed = downloads.data.filter(d => d.status === 'completed').length;
            const failed = downloads.data.filter(d => d.status === 'failed').length;
            const totalSize = downloads.data.reduce((sum, d) => sum + (d.fileSize || 0), 0);
            
            const monthKey = this._getMonthKey();
            const monthlyUsed = this._monthlyDownloads.get(monthKey) || 0;
            const monthlyLimit = DOWNLOAD_CONFIG.freeDownloadsPerMonth;

            return {
                total,
                completed,
                failed,
                successRate: total > 0 ? (completed / total) * 100 : 0,
                totalSize,
                monthlyUsed,
                monthlyLimit,
                monthlyRemaining: Math.max(0, monthlyLimit - monthlyUsed),
                dailyDownloads: this._dailyDownloads,
                activeDownloads: this._activeDownloads.size,
                queueLength: this._downloadQueue.length,
                averageSpeed: this._getAverageSpeed()
            };
        } catch (error) {
            logger.error('❌ Failed to get download stats', { error: error.message });
            return {};
        }
    }

    // ============================================
    // DOWNLOAD QUEUE
    // ============================================

    /**
     * Add to queue
     */
    addToQueue(downloadFn, priority = 0) {
        return new Promise((resolve, reject) => {
            this._downloadQueue.push({ downloadFn, priority, resolve, reject });
            this._downloadQueue.sort((a, b) => b.priority - a.priority);
            this._processQueue();
        });
    }

    /**
     * Process queue
     */
    async _processQueue() {
        if (this._isProcessing) return;
        if (this._downloadQueue.length === 0) return;
        if (this._activeDownloads.size >= this._maxConcurrent) return;

        this._isProcessing = true;

        try {
            while (this._downloadQueue.length > 0 && this._activeDownloads.size < this._maxConcurrent) {
                const item = this._downloadQueue.shift();
                this._activeDownloads.set(`queue_${Date.now()}`, {});
                
                try {
                    const result = await item.downloadFn();
                    item.resolve(result);
                } catch (error) {
                    item.reject(error);
                } finally {
                    // Remove from active
                    for (const [key] of this._activeDownloads) {
                        if (key.startsWith('queue_')) {
                            this._activeDownloads.delete(key);
                            break;
                        }
                    }
                }
            }
        } finally {
            this._isProcessing = false;
            if (this._downloadQueue.length > 0) {
                this._processQueue();
            }
        }
    }

    /**
     * Get queue status
     */
    getQueueStatus() {
        return {
            queueLength: this._downloadQueue.length,
            activeDownloads: this._activeDownloads.size,
            maxConcurrent: this._maxConcurrent,
            isProcessing: this._isProcessing
        };
    }

    /**
     * Clear queue
     */
    clearQueue() {
        const items = [...this._downloadQueue];
        this._downloadQueue = [];
        for (const item of items) {
            item.reject(new Error('Queue cleared'));
        }
        this._notifyListeners('queue_cleared', { cleared: items.length });
    }

    // ============================================
    // DOWNLOAD CONTROL
    // ============================================

    /**
     * Pause download
     */
    pauseDownload(downloadId) {
        const download = this._activeDownloads.get(downloadId);
        if (download && download.task) {
            download.task.pause();
            download.status = 'paused';
            this._notifyListeners('paused', download);
            return true;
        }
        return false;
    }

    /**
     * Resume download
     */
    resumeDownload(downloadId) {
        const download = this._activeDownloads.get(downloadId);
        if (download && download.task) {
            download.task.resume();
            download.status = 'downloading';
            this._notifyListeners('resumed', download);
            return true;
        }
        return false;
    }

    /**
     * Cancel download
     */
    cancelDownload(downloadId) {
        const download = this._activeDownloads.get(downloadId);
        if (download && download.task) {
            download.task.cancel();
            download.status = 'cancelled';
            this._activeDownloads.delete(downloadId);
            this._notifyListeners('cancelled', download);
            return true;
        }
        return false;
    }

    /**
     * Get active downloads
     */
    getActiveDownloads() {
        return Array.from(this._activeDownloads.values());
    }

    /**
     * Get download by ID
     */
    getDownload(downloadId) {
        return this._activeDownloads.get(downloadId);
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Generate download ID
     */
    _generateDownloadId() {
        return `download_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }

    /**
     * Get device info
     */
    _getDeviceInfo() {
        if (typeof window === 'undefined') return {};
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink
            } : null
        };
    }

    /**
     * Update speed
     */
    _updateSpeed(bytes) {
        const now = Date.now();
        const diff = now - this._lastSpeedCheck;
        
        if (diff >= 1000) {
            const bytesDiff = bytes - this._lastBytes;
            this._currentSpeed = bytesDiff / (diff / 1000);
            this._lastBytes = bytes;
            this._lastSpeedCheck = now;
            
            // Add to history
            this._speedHistory.push(this._currentSpeed);
            if (this._speedHistory.length > 60) {
                this._speedHistory.shift();
            }
        }
    }

    /**
     * Get average speed
     */
    _getAverageSpeed() {
        if (this._speedHistory.length === 0) return 0;
        const sum = this._speedHistory.reduce((a, b) => a + b, 0);
        return sum / this._speedHistory.length;
    }

    /**
     * Sleep
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Update user stats
     */
    async _updateUserStats(userId) {
        try {
            const user = await databaseService.getUser(userId);
            if (user) {
                await databaseService.updateUser(userId, {
                    totalDownloads: (user.totalDownloads || 0) + 1,
                    lastDownload: new Date().toISOString()
                });
            }
        } catch (error) {
            logger.error('❌ Failed to update user stats', { error: error.message });
        }
    }

    /**
     * Set daily reset timer
     */
    _setDailyResetTimer() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const msUntilMidnight = tomorrow.getTime() - now.getTime();

        this._dailyResetTimer = setTimeout(() => {
            this._dailyDownloads = 0;
            this._setDailyResetTimer();
            logger.debug('📥 Daily download count reset');
        }, msUntilMidnight);
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

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

    // ============================================
    // DESTROY
    // ============================================

    /**
     * Destroy download manager
     */
    destroy() {
        if (this._dailyResetTimer) {
            clearTimeout(this._dailyResetTimer);
            this._dailyResetTimer = null;
        }

        // Cancel all active downloads
        for (const [id] of this._activeDownloads) {
            this.cancelDownload(id);
        }

        this._listeners = [];
        this._downloadQueue = [];
        this._activeDownloads.clear();
        this._speedHistory = [];

        logger.info('📥 Download Manager destroyed');
    }
}

// ============================================================
// DOWNLOAD TASK CLASS
// ============================================================

class DownloadTask {
    constructor(options = {}) {
        this.url = options.url;
        this.fileName = options.fileName;
        this.fileSize = options.fileSize;
        this.downloadId = options.downloadId;
        this.userId = options.userId;
        this.productId = options.productId;
        this.onProgress = options.onProgress || (() => {});
        this.onComplete = options.onComplete || (() => {});
        this.onError = options.onError || (() => {});
        
        this._xhr = null;
        this._paused = false;
        this._cancelled = false;
        this._started = false;
        this._loaded = 0;
        this._total = 0;
        this._speed = 0;
        this._startTime = 0;
        this._lastLoaded = 0;
        this._lastSpeedCheck = 0;
        this._chunks = [];
        this._resumeData = null;
        this._blobUrl = null;
    }

    /**
     * Start download
     */
    start() {
        return new Promise((resolve, reject) => {
            this._startTime = Date.now();
            this._lastSpeedCheck = this._startTime;
            this._started = true;

            try {
                this._xhr = new XMLHttpRequest();
                this._xhr.open('GET', this.url, true);
                this._xhr.responseType = 'blob';

                // Set range header for resume
                if (this._resumeData) {
                    this._xhr.setRequestHeader('Range', `bytes=${this._resumeData}-`);
                }

                // Progress
                this._xhr.onprogress = (event) => {
                    if (this._cancelled) {
                        this._xhr.abort();
                        return;
                    }

                    if (this._paused) return;

                    this._loaded = this._resumeData || 0;
                    if (event.total > 0) {
                        this._total = event.total + (this._resumeData || 0);
                        this._loaded = event.loaded + (this._resumeData || 0);
                    } else {
                        this._total = this.fileSize || 0;
                        this._loaded = event.loaded + (this._resumeData || 0);
                    }

                    const progress = this._total > 0 ? (this._loaded / this._total) * 100 : 0;
                    this._calculateSpeed();
                    this.onProgress(progress, this._speed, this._loaded, this._total);
                };

                // Load
                this._xhr.onload = () => {
                    if (this._cancelled) {
                        reject(new Error('Download cancelled'));
                        return;
                    }

                    if (this._xhr.status === 200 || this._xhr.status === 206) {
                        const blob = this._xhr.response;
                        const url = URL.createObjectURL(blob);
                        this._blobUrl = url;

                        // Trigger download
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = this.fileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);

                        // Clean up after download
                        setTimeout(() => {
                            URL.revokeObjectURL(url);
                        }, 5000);

                        this.onComplete({
                            blob,
                            url,
                            fileName: this.fileName,
                            totalBytes: blob.size || this._total
                        });
                        resolve({
                            blob,
                            url,
                            fileName: this.fileName,
                            totalBytes: blob.size || this._total
                        });
                    } else {
                        const error = new Error(`HTTP ${this._xhr.status}: ${this._xhr.statusText}`);
                        this.onError(error);
                        reject(error);
                    }
                };

                // Error
                this._xhr.onerror = (event) => {
                    if (this._cancelled) return;
                    const error = new Error('Network error');
                    this.onError(error);
                    reject(error);
                };

                // Abort
                this._xhr.onabort = () => {
                    if (this._cancelled) {
                        reject(new Error('Download cancelled'));
                    } else {
                        reject(new Error('Download aborted'));
                    }
                };

                // Timeout
                this._xhr.timeout = DOWNLOAD_CONFIG.timeout;
                this._xhr.ontimeout = () => {
                    const error = new Error('Download timeout');
                    this.onError(error);
                    reject(error);
                };

                this._xhr.send();

            } catch (error) {
                this.onError(error);
                reject(error);
            }
        });
    }

    /**
     * Calculate speed
     */
    _calculateSpeed() {
        const now = Date.now();
        const diff = now - this._lastSpeedCheck;
        
        if (diff >= 1000) {
            const bytesDiff = this._loaded - this._lastLoaded;
            this._speed = bytesDiff / (diff / 1000);
            this._lastLoaded = this._loaded;
            this._lastSpeedCheck = now;
        }
    }

    /**
     * Pause download
     */
    pause() {
        if (this._paused) return;
        this._paused = true;
        if (this._xhr) {
            this._xhr.abort();
        }
        // Save resume data
        this._resumeData = this._loaded;
    }

    /**
     * Resume download
     */
    resume() {
        if (!this._paused) return;
        this._paused = false;
        this._started = false;
        return this.start();
    }

    /**
     * Cancel download
     */
    cancel() {
        this._cancelled = true;
        if (this._xhr) {
            this._xhr.abort();
        }
        if (this._blobUrl) {
            URL.revokeObjectURL(this._blobUrl);
        }
    }

    /**
     * Get status
     */
    getStatus() {
        return {
            id: this.downloadId,
            fileName: this.fileName,
            total: this._total,
            loaded: this._loaded,
            progress: this._total > 0 ? (this._loaded / this._total) * 100 : 0,
            speed: this._speed,
            paused: this._paused,
            cancelled: this._cancelled,
            started: this._started,
            duration: this._startTime > 0 ? (Date.now() - this._startTime) / 1000 : 0
        };
    }
}

/// ============================================================
// SINGLETON INSTANCE & EXPORTS - CLEAN VERSION
// ============================================================
const downloadManager = new DownloadManager();

export function initDownloadManager(options = {}) { return downloadManager.init(options); }
export function downloadProduct(productId, options = {}) { return downloadManager.download(productId, options); }
export function getDownloadHistory(options = {}) { return downloadManager.getHistory(options); }
export function getDownloadStats(userId = null) { return downloadManager.getStats(userId); }
export function pauseDownload(downloadId) { return downloadManager.pauseDownload(downloadId); }
export function resumeDownload(downloadId) { return downloadManager.resumeDownload(downloadId); }
export function cancelDownload(downloadId) { return downloadManager.cancelDownload(downloadId); }
export function getActiveDownloads() { return downloadManager.getActiveDownloads(); }
export function getDownload(downloadId) { return downloadManager.getDownload(downloadId); }
export function getDownloadQueueStatus() { return downloadManager.getQueueStatus(); }
export function clearDownloadQueue() { return downloadManager.clearQueue(); }
export function onDownloadEvent(callback) { return downloadManager.addListener(callback); }
export function canDownloadProduct(product, options = {}) { return downloadManager.canDownload(product, options); }
export function getCoinCost(product) { return downloadManager._getCoinCost(product); }
export function destroyDownloadManager() { return downloadManager.destroy(); }

export const downloadService = downloadManager;
export { DownloadManager as DownloadService };
export default downloadService;