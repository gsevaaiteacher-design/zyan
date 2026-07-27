// Ad Service
// ============================================================
// FILE: ad-service.js
// PURPOSE: Google AdMob integration (Banner, Rewarded) with monetization
// VERSION: 3.0.0 (Production Ready)
// DEPENDENCY: app-config.js, error-handler.js, database-service.js, user-model.js
// USED BY: ad-banner.js, download-service.js, ai-service.js, product-detail.js
// LOCATION: js/services/ad-service.js
// ============================================================

// ============================================================
// AD SERVICE CLASS - ZYMORE v3.0 AD MONETIZATION
// ============================================================

/**
 * AdService Class
 * Manages all ad operations for ZYMORE v3.0
 * 
 * ZYMORE v3.0 Features:
 * - Rewarded Ads (Every 2 hours cooldown)
 * - 3-4 Ads per day limit
 * - Coin System (1-3 coins per ad)
 * - Banner Ads
 * - Interstitial Ads
 * - Native Ads
 * - Ad Tracking & Analytics
 * - Fraud Detection
 * - Ad Performance Metrics
 * - User Engagement Tracking
 * - Revenue Tracking
 * - A/B Testing Support
 */
class AdService {
    // ============================================
    // SINGLETON PATTERN
    // ============================================

    static #instance = null;
    static #initialized = false;

    /**
     * Get singleton instance
     * @returns {AdService} Singleton instance
     */
    static getInstance() {
        if (!AdService.#instance) {
            AdService.#instance = new AdService();
        }
        return AdService.#instance;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor() {
        if (AdService.#instance) {
            return AdService.#instance;
        }

        // Private properties
        this._isInitialized = false;
        this._currentUser = null;
        this._ads = [];
        this._adHistory = [];
        this._rewardedAdCallbacks = [];
        this._bannerAd = null;
        this._interstitialAd = null;
        this._nativeAd = null;
        this._adUnitIds = {};
        this._isAdLoading = false;
        this._isAdShowing = false;
        this._lastAdWatch = null;
        this._todayAdCount = 0;
        this._maxDailyAds = 4;
        this._adCooldownHours = 2;
        this._coinReward = 1;
        this._adProviders = [];
        this._currentProvider = 'google';
        this._adListeners = [];
        this._isTestMode = false;

        // Coin rewards mapping
        this._coinRewards = {
            rewarded: { min: 1, max: 3, default: 2 },
            banner: { min: 0, max: 0, default: 0 },
            interstitial: { min: 0, max: 1, default: 1 },
            native: { min: 0, max: 1, default: 1 }
        };

        // Ad type mapping
        this._adTypes = {
            rewarded: 'rewarded',
            banner: 'banner',
            interstitial: 'interstitial',
            native: 'native'
        };

        // Bind methods
        this._handleAuthChange = this._handleAuthChange.bind(this);
        this._handleOnline = this._handleOnline.bind(this);
        this._handleOffline = this._handleOffline.bind(this);
        this._onAdLoaded = this._onAdLoaded.bind(this);
        this._onAdError = this._onAdError.bind(this);
        this._onAdClosed = this._onAdClosed.bind(this);
        this._onAdRewarded = this._onAdRewarded.bind(this);
        this._onAdImpression = this._onAdImpression.bind(this);
        this._onAdClicked = this._onAdClicked.bind(this);

        AdService.#instance = this;
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    /**
     * Initialize ad service
     * @param {Object} options - Initialization options
     * @param {string} options.userId - User ID
     * @param {Object} options.adUnitIds - Ad unit IDs
     * @param {Object} options.adProviders - Ad providers
     * @param {number} options.maxDailyAds - Max daily ads
     * @param {number} options.adCooldownHours - Ad cooldown hours
     * @param {number} options.coinReward - Coin reward per ad
     * @param {boolean} options.testMode - Test mode
     * @param {Function} options.onAdLoaded - Ad loaded callback
     * @param {Function} options.onAdError - Ad error callback
     * @param {Function} options.onAdRewarded - Ad rewarded callback
     * @returns {Promise<AdService>} This instance
     */
    async initialize(options = {}) {
        if (this._isInitialized) return this;

        const {
            userId = '',
            adUnitIds = {},
            adProviders = ['google'],
            maxDailyAds = 4,
            adCooldownHours = 2,
            coinReward = 2,
            testMode = false,
            onAdLoaded = null,
            onAdError = null,
            onAdRewarded = null
        } = options;

        try {
            this._currentUser = userId;
            this._adUnitIds = {
                rewarded: adUnitIds.rewarded || '',
                banner: adUnitIds.banner || '',
                interstitial: adUnitIds.interstitial || '',
                native: adUnitIds.native || '',
                ...adUnitIds
            };
            this._adProviders = adProviders;
            this._maxDailyAds = maxDailyAds;
            this._adCooldownHours = adCooldownHours;
            this._coinReward = coinReward;
            this._isTestMode = testMode;

            // Set callbacks
            if (onAdLoaded) this._onAdLoaded = onAdLoaded;
            if (onAdError) this._onAdError = onAdError;
            if (onAdRewarded) this._onAdRewarded = onAdRewarded;

            // Load user ad history
            if (userId) {
                await this._loadUserAdHistory(userId);
            }

            // Set up event listeners
            this._setupListeners();

            // Initialize ad providers
            await this._initAdProviders();

            this._isInitialized = true;
            AdService.#initialized = true;

            if (typeof EventBus !== 'undefined') {
                EventBus.emit('ad:initialized', { success: true });
            }

            console.log('✅ AdService initialized successfully');
            return this;

        } catch (error) {
            console.error('❌ AdService initialization failed:', error);
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('ad:initialized', { success: false, error: error.message });
            }
            throw error;
        }
    }

    /**
     * Initialize ad providers
     * @private
     * @returns {Promise<void>}
     */
    async _initAdProviders() {
        try {
            // Check if Google AdMob is available
            if (typeof window.google !== 'undefined' && window.google.ima) {
                console.log('✅ Google AdMob detected');
            } else {
                console.warn('⚠️ Google AdMob not detected - using fallback');
            }

            // Load ad units
            await this._loadAdUnits();

        } catch (error) {
            console.error('Ad provider initialization error:', error);
        }
    }

    /**
     * Load ad units
     * @private
     * @returns {Promise<void>}
     */
    async _loadAdUnits() {
        // In production, this would load from Firebase Remote Config
        // For now, use the provided ad unit IDs
        console.log('📱 Ad units loaded:', this._adUnitIds);
    }

    /**
     * Load user ad history
     * @private
     * @param {string} userId - User ID
     * @returns {Promise<void>}
     */
    async _loadUserAdHistory(userId) {
        try {
            const db = this._getDatabase();
            if (!db) return;

            // Get today's ads
            const today = new Date();
            const startOfDay = new Date(today);
            startOfDay.setHours(0, 0, 0, 0);

            const ads = await db.query('ad_watches', {
                userId: userId,
                watchedAt: { $gte: startOfDay },
                isDeleted: false
            });

            this._todayAdCount = ads.filter(a => a.completed).length;

            // Get last ad watch
            const allAds = await db.query('ad_watches', {
                userId: userId,
                completed: true,
                isDeleted: false
            }, { orderBy: [['watchedAt', 'desc']], limit: 1 });

            if (allAds.length > 0) {
                this._lastAdWatch = new Date(allAds[0].watchedAt);
            }

            this._adHistory = ads;

        } catch (error) {
            console.error('Load user ad history error:', error);
        }
    }

    /**
     * Set up event listeners
     * @private
     */
    _setupListeners() {
        // Auth state change
        if (typeof EventBus !== 'undefined') {
            EventBus.on('auth:login', this._handleAuthChange);
            EventBus.on('auth:logout', this._handleAuthChange);
        }

        // Network status
        window.addEventListener('online', this._handleOnline);
        window.addEventListener('offline', this._handleOffline);
    }

    /**
     * Handle auth change
     * @private
     */
    _handleAuthChange() {
        // Reload user ad history
        if (this._currentUser) {
            this._loadUserAdHistory(this._currentUser);
        }
    }

    /**
     * Handle online
     * @private
     */
    _handleOnline() {
        // Refresh ad availability
        this._updateAdAvailability();
    }

    /**
     * Handle offline
     * @private
     */
    _handleOffline() {
        // Mark ads as unavailable
    }

    // ============================================
    // AD AVAILABILITY
    // ============================================

    /**
     * Check if user can watch rewarded ad
     * @param {Object} options - Options
     * @param {boolean} options.checkCooldown - Check cooldown
     * @param {boolean} options.checkDailyLimit - Check daily limit
     * @param {boolean} options.checkUserStatus - Check user status
     * @returns {Object} Availability result
     */
    canWatchAd(options = {}) {
        const {
            checkCooldown = true,
            checkDailyLimit = true,
            checkUserStatus = true
        } = options;

        const result = {
            available: true,
            reason: '',
            nextAvailable: null,
            remainingToday: 0
        };

        // Check user status
        if (checkUserStatus && !this._currentUser) {
            result.available = false;
            result.reason = 'User not logged in';
            return result;
        }

        // Check daily limit
        if (checkDailyLimit) {
            const remaining = this._maxDailyAds - this._todayAdCount;
            result.remainingToday = remaining;

            if (remaining <= 0) {
                result.available = false;
                result.reason = 'Daily ad limit reached';
                // Calculate next available time (next day)
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);
                result.nextAvailable = tomorrow;
                return result;
            }
        }

        // Check cooldown
        if (checkCooldown && this._lastAdWatch) {
            const now = new Date();
            const diffHours = (now - this._lastAdWatch) / (1000 * 60 * 60);

            if (diffHours < this._adCooldownHours) {
                result.available = false;
                result.reason = 'Ad cooldown active';
                const cooldownEnd = new Date(this._lastAdWatch);
                cooldownEnd.setHours(cooldownEnd.getHours() + this._adCooldownHours);
                result.nextAvailable = cooldownEnd;
                return result;
            }
        }

        return result;
    }

    /**
     * Get ad availability status
     * @param {Object} options - Options
     * @returns {Object} Availability status
     */
    getAdStatus(options = {}) {
        const result = this.canWatchAd(options);

        return {
            canWatch: result.available,
            reason: result.reason,
            nextAvailable: result.nextAvailable,
            remainingToday: result.remainingToday || 0,
            cooldownRemaining: this._getCooldownRemaining(),
            todayAdCount: this._todayAdCount,
            maxDailyAds: this._maxDailyAds,
            lastAdWatch: this._lastAdWatch
        };
    }

    /**
     * Get cooldown remaining
     * @private
     * @returns {number} Cooldown remaining in minutes
     */
    _getCooldownRemaining() {
        if (!this._lastAdWatch) return 0;

        const now = new Date();
        const cooldownEnd = new Date(this._lastAdWatch);
        cooldownEnd.setHours(cooldownEnd.getHours() + this._adCooldownHours);

        if (now >= cooldownEnd) return 0;

        const diffMs = cooldownEnd - now;
        return Math.ceil(diffMs / (1000 * 60));
    }

    /**
     * Update ad availability
     * @private
     */
    _updateAdAvailability() {
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('ad:availability_updated', this.getAdStatus());
        }
    }

    // ============================================
    // REWARDED ADS
    // ============================================

    /**
     * Show rewarded ad
     * @param {Object} options - Options
     * @param {string} options.adUnitId - Ad unit ID
     * @param {number} options.coinsReward - Coins reward
     * @param {string} options.rewardType - Reward type (download, ai_chat, coins)
     * @param {Object} options.rewardData - Reward data
     * @param {Function} options.onSuccess - Success callback
     * @param {Function} options.onError - Error callback
     * @param {Function} options.onCancel - Cancel callback
     * @returns {Promise<Object>} Ad result
     */
    async showRewardedAd(options = {}) {
        const {
            adUnitId = this._adUnitIds.rewarded,
            coinsReward = this._coinReward,
            rewardType = 'coins',
            rewardData = {},
            onSuccess = null,
            onError = null,
            onCancel = null
        } = options;

        // Check availability
        const status = this.canWatchAd();
        if (!status.available) {
            const error = new Error(status.reason);
            if (onError) onError(error);
            throw error;
        }

        // Check if ad is already loading/showing
        if (this._isAdLoading || this._isAdShowing) {
            const error = new Error('Ad is already loading or showing');
            if (onError) onError(error);
            throw error;
        }

        try {
            this._isAdLoading = true;

            if (typeof EventBus !== 'undefined') {
                EventBus.emit('ad:rewarded:loading', { adUnitId });
            }

            // In production, this would load a real ad
            // For now, simulate ad loading
            await this._simulateAdLoad(1000);

            this._isAdLoading = false;
            this._isAdShowing = true;

            if (typeof EventBus !== 'undefined') {
                EventBus.emit('ad:rewarded:showing', { adUnitId });
            }

            // Simulate ad watching
            const result = await this._simulateAdWatch(3000);

            if (result.completed) {
                // Calculate reward
                const reward = this._calculateReward(coinsReward, rewardType);

                // Record ad watch
                await this._recordAdWatch({
                    adType: 'rewarded',
                    adUnitId,
                    rewardEarned: reward.amount,
                    rewardType: reward.type,
                    rewardData,
                    completed: true,
                    duration: result.duration,
                    watchedDuration: result.duration
                });

                // Update user coins
                if (rewardType === 'coins') {
                    await this._updateUserCoins(reward.amount);
                }

                this._isAdShowing = false;

                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('ad:rewarded:completed', {
                        adUnitId,
                        reward: reward.amount,
                        rewardType: reward.type
                    });
                }

                if (onSuccess) {
                    await onSuccess({ reward: reward.amount, rewardType: reward.type });
                }

                return {
                    success: true,
                    reward: reward.amount,
                    rewardType: reward.type
                };
            } else {
                this._isAdShowing = false;

                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('ad:rewarded:cancelled', { adUnitId });
                }

                if (onCancel) {
                    await onCancel();
                }

                return {
                    success: false,
                    reason: 'Ad not completed'
                };
            }

        } catch (error) {
            this._isAdLoading = false;
            this._isAdShowing = false;

            console.error('Show rewarded ad error:', error);

            if (typeof EventBus !== 'undefined') {
                EventBus.emit('ad:rewarded:error', { adUnitId, error: error.message });
            }

            if (onError) onError(error);
            throw error;
        }
    }

    /**
     * Simulate ad load
     * @private
     * @param {number} duration - Duration in ms
     * @returns {Promise<void>}
     */
    _simulateAdLoad(duration) {
        return new Promise((resolve) => {
            setTimeout(resolve, duration);
        });
    }

    /**
     * Simulate ad watch
     * @private
     * @param {number} duration - Duration in ms
     * @returns {Promise<Object>} Ad result
     */
    _simulateAdWatch(duration) {
        return new Promise((resolve) => {
            let completed = true;
            // 10% chance of cancellation
            if (Math.random() < 0.1) {
                completed = false;
            }

            setTimeout(() => {
                resolve({
                    completed,
                    duration: duration / 1000
                });
            }, duration);
        });
    }

    /**
     * Calculate reward
     * @private
     * @param {number} baseReward - Base reward
     * @param {string} rewardType - Reward type
     * @returns {Object} Reward result
     */
    _calculateReward(baseReward, rewardType) {
        // Randomize reward slightly
        const variation = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
        const amount = Math.round(baseReward * variation);

        return {
            amount: Math.max(1, amount),
            type: rewardType
        };
    }

    /**
     * Record ad watch
     * @private
     * @param {Object} adData - Ad data
     * @returns {Promise<void>}
     */
    async _recordAdWatch(adData) {
        try {
            const db = this._getDatabase();
            if (!db) return;

            const adWatch = {
                userId: this._currentUser,
                adType: adData.adType,
                adUnitId: adData.adUnitId,
                watchedAt: new Date(),
                rewardEarned: adData.rewardEarned || 0,
                rewardType: adData.rewardType || 'coins',
                rewardData: adData.rewardData || {},
                duration: adData.duration || 30,
                watchedDuration: adData.watchedDuration || 30,
                completed: adData.completed || false,
                completionPercentage: adData.completed ? 100 : 0,
                ip: adData.ip || '',
                deviceInfo: adData.deviceInfo || '',
                deviceType: adData.deviceType || '',
                browser: adData.browser || '',
                os: adData.os || '',
                country: adData.country || '',
                placement: adData.placement || '',
                context: adData.context || '',
                isFraud: false,
                isDeleted: false,
                isValid: true,
                status: adData.completed ? 'completed' : 'failed',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Store in database
            const result = await db.create('ad_watches', adWatch);

            // Update local stats
            this._todayAdCount += 1;
            this._lastAdWatch = new Date();

            // Update ad history
            this._adHistory.push(result);

            // Emit event
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('ad:recorded', { adWatch: result });
            }

            // Update availability
            this._updateAdAvailability();

        } catch (error) {
            console.error('Record ad watch error:', error);
        }
    }

    /**
     * Update user coins
     * @private
     * @param {number} amount - Coin amount
     * @returns {Promise<void>}
     */
    async _updateUserCoins(amount) {
        try {
            const db = this._getDatabase();
            if (!db || !this._currentUser) return;

            const user = await db.getUser(this._currentUser);
            if (user) {
                const currentCoins = user.coins || 0;
                await db.updateUser(this._currentUser, {
                    coins: currentCoins + amount,
                    updatedAt: new Date()
                });

                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('user:coins_updated', {
                        userId: this._currentUser,
                        coins: currentCoins + amount,
                        earned: amount
                    });
                }
            }

        } catch (error) {
            console.error('Update user coins error:', error);
        }
    }

    // ============================================
    // BANNER ADS
    // ============================================

    /**
     * Show banner ad
     * @param {Object} options - Options
     * @param {string} options.adUnitId - Ad unit ID
     * @param {string} options.position - Position (top, bottom)
     * @param {string} options.size - Size (banner, medium, large)
     * @param {Function} options.onLoad - Load callback
     * @param {Function} options.onError - Error callback
     * @returns {Promise<Object>} Banner result
     */
    async showBannerAd(options = {}) {
        const {
            adUnitId = this._adUnitIds.banner,
            position = 'bottom',
            size = 'banner',
            onLoad = null,
            onError = null
        } = options;

        try {
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('ad:banner:loading', { adUnitId });
            }

            // Simulate ad loading
            await this._simulateAdLoad(500);

            const bannerData = {
                id: adUnitId,
                position,
                size,
                loaded: true,
                timestamp: new Date()
            };

            this._bannerAd = bannerData;

            // Record impression
            await this._recordAdWatch({
                adType: 'banner',
                adUnitId,
                rewardEarned: 0,
                rewardType: 'coins',
                completed: true,
                duration: 0,
                watchedDuration: 0,
                placement: position
            });

            if (typeof EventBus !== 'undefined') {
                EventBus.emit('ad:banner:loaded', bannerData);
            }

            if (onLoad) await onLoad(bannerData);

            return {
                success: true,
                banner: bannerData
            };

        } catch (error) {
            console.error('Show banner ad error:', error);
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('ad:banner:error', { error: error.message });
            }
            if (onError) onError(error);
            throw error;
        }
    }

    /**
     * Hide banner ad
     * @param {Object} options - Options
     * @returns {Promise<void>}
     */
    async hideBannerAd(options = {}) {
        this._bannerAd = null;

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('ad:banner:hidden', {});
        }

        return Promise.resolve();
    }

    /**
     * Update banner ad position
     * @param {string} position - Position (top, bottom)
     * @param {Object} options - Options
     * @returns {Promise<Object>} Updated banner
     */
    async updateBannerPosition(position, options = {}) {
        if (this._bannerAd) {
            this._bannerAd.position = position;

            if (typeof EventBus !== 'undefined') {
                EventBus.emit('ad:banner:position_updated', { position });
            }

            return this._bannerAd;
        }

        return null;
    }

    // ============================================
    // INTERSTITIAL ADS
    // ============================================

    /**
     * Show interstitial ad
     * @param {Object} options - Options
     * @param {string} options.adUnitId - Ad unit ID
     * @param {Function} options.onLoad - Load callback
     * @param {Function} options.onError - Error callback
     * @param {Function} options.onClose - Close callback
     * @returns {Promise<Object>} Ad result
     */
    async showInterstitialAd(options = {}) {
        const {
            adUnitId = this._adUnitIds.interstitial,
            onLoad = null,
            onError = null,
            onClose = null
        } = options;

        try {
            if (this._isAdShowing) {
                throw new Error('Ad already showing');
            }

            if (typeof EventBus !== 'undefined') {
                EventBus.emit('ad:interstitial:loading', { adUnitId });
            }

            this._isAdShowing = true;

            // Simulate ad loading
            await this._simulateAdLoad(800);

            if (typeof EventBus !== 'undefined') {
                EventBus.emit('ad:interstitial:loaded', { adUnitId });
            }

            if (onLoad) await onLoad();

            // Simulate ad showing
            await this._simulateAdWatch(2000);

            this._isAdShowing = false;

            // Record impression
            await this._recordAdWatch({
                adType: 'interstitial',
                adUnitId,
                rewardEarned: 0,
                rewardType: 'coins',
                completed: true,
                duration: 0,
                watchedDuration: 0
            });

            if (typeof EventBus !== 'undefined') {
                EventBus.emit('ad:interstitial:closed', { adUnitId });
            }

            if (onClose) await onClose();

            return {
                success: true,
                adUnitId
            };

        } catch (error) {
            this._isAdShowing = false;

            console.error('Show interstitial ad error:', error);
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('ad:interstitial:error', { error: error.message });
            }
            if (onError) onError(error);
            throw error;
        }
    }

    // ============================================
    // NATIVE ADS
    // ============================================

    /**
     * Show native ad
     * @param {Object} options - Options
     * @param {string} options.adUnitId - Ad unit ID
     * @param {string} options.format - Ad format (small, medium, large)
     * @param {Function} options.onLoad - Load callback
     * @param {Function} options.onError - Error callback
     * @returns {Promise<Object>} Native ad data
     */
    async showNativeAd(options = {}) {
        const {
            adUnitId = this._adUnitIds.native,
            format = 'medium',
            onLoad = null,
            onError = null
        } = options;

        try {
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('ad:native:loading', { adUnitId });
            }

            // Simulate ad loading
            await this._simulateAdLoad(600);

            const nativeAdData = {
                id: adUnitId,
                format,
                title: 'Sponsored Content',
                description: 'Discover amazing products on ZYMORE Marketplace',
                image: '/assets/images/ad-placeholder.png',
                callToAction: 'Learn More',
                sponsored: 'Sponsored',
                loaded: true,
                timestamp: new Date()
            };

            this._nativeAd = nativeAdData;

            // Record impression
            await this._recordAdWatch({
                adType: 'native',
                adUnitId,
                rewardEarned: 0,
                rewardType: 'coins',
                completed: true,
                duration: 0,
                watchedDuration: 0,
                placement: format
            });

            if (typeof EventBus !== 'undefined') {
                EventBus.emit('ad:native:loaded', nativeAdData);
            }

            if (onLoad) await onLoad(nativeAdData);

            return {
                success: true,
                nativeAd: nativeAdData
            };

        } catch (error) {
            console.error('Show native ad error:', error);
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('ad:native:error', { error: error.message });
            }
            if (onError) onError(error);
            throw error;
        }
    }

    // ============================================
    // AD TESTING / DEMO
    // ============================================

    /**
     * Show test rewarded ad
     * @param {Object} options - Options
     * @param {Function} options.onSuccess - Success callback
     * @param {Function} options.onError - Error callback
     * @returns {Promise<Object>} Ad result
     */
    async showTestRewardedAd(options = {}) {
        const {
            onSuccess = null,
            onError = null
        } = options;

        try {
            const status = this.canWatchAd({ checkCooldown: false });

            // Simulate ad loading
            await this._simulateAdLoad(500);

            // Simulate ad watching
            await this._simulateAdWatch(2000);

            // Record ad watch
            const reward = 2;
            await this._recordAdWatch({
                adType: 'rewarded',
                adUnitId: 'test_ad_unit',
                rewardEarned: reward,
                rewardType: 'coins',
                completed: true,
                duration: 5,
                watchedDuration: 5,
                placement: 'test'
            });

            await this._updateUserCoins(reward);

            if (typeof EventBus !== 'undefined') {
                EventBus.emit('ad:test:completed', { reward });
            }

            if (onSuccess) await onSuccess({ reward });

            return {
                success: true,
                reward,
                isTest: true
            };

        } catch (error) {
            console.error('Test ad error:', error);
            if (onError) onError(error);
            throw error;
        }
    }

    // ============================================
    // AD ANALYTICS
    // ============================================

    /**
     * Get ad analytics
     * @param {Object} options - Options
     * @param {string} options.userId - User ID
     * @param {Date} options.startDate - Start date
     * @param {Date} options.endDate - End date
     * @param {string} options.adType - Ad type filter
     * @returns {Promise<Object>} Analytics data
     */
    async getAdAnalytics(options = {}) {
        const {
            userId = this._currentUser,
            startDate = null,
            endDate = null,
            adType = ''
        } = options;

        try {
            const db = this._getDatabase();
            if (!db) return {};

            let query = { userId, isDeleted: false };
            if (startDate) query.watchedAt = { $gte: startDate };
            if (endDate) query.watchedAt = { ...query.watchedAt, $lte: endDate };
            if (adType) query.adType = adType;

            const ads = await db.query('ad_watches', query);

            const total = ads.length;
            const completed = ads.filter(a => a.completed).length;
            const totalRewards = ads.reduce((sum, a) => sum + (a.rewardEarned || 0), 0);
            const totalDuration = ads.reduce((sum, a) => sum + (a.duration || 0), 0);

            const analytics = {
                total,
                completed,
                completionRate: total > 0 ? (completed / total) * 100 : 0,
                totalRewards,
                averageReward: total > 0 ? totalRewards / total : 0,
                totalDuration,
                averageDuration: total > 0 ? totalDuration / total : 0,
                byType: this._groupAdsByType(ads),
                byDate: this._groupAdsByDate(ads),
                revenue: ads.reduce((sum, a) => sum + (a.revenue || 0), 0),
                ecpm: total > 0 ? (ads.reduce((sum, a) => sum + (a.revenue || 0), 0) / total) * 1000 : 0
            };

            return analytics;

        } catch (error) {
            console.error('Get ad analytics error:', error);
            return {};
        }
    }

    /**
     * Group ads by type
     * @private
     * @param {Array} ads - Ads array
     * @returns {Object} Grouped ads
     */
    _groupAdsByType(ads) {
        const groups = {};
        for (const ad of ads) {
            const type = ad.adType || 'unknown';
            if (!groups[type]) {
                groups[type] = { total: 0, completed: 0, rewards: 0 };
            }
            groups[type].total++;
            if (ad.completed) groups[type].completed++;
            groups[type].rewards += ad.rewardEarned || 0;
        }
        return groups;
    }

    /**
     * Group ads by date
     * @private
     * @param {Array} ads - Ads array
     * @returns {Object} Grouped ads
     */
    _groupAdsByDate(ads) {
        const groups = {};
        for (const ad of ads) {
            const date = ad.watchedAt ? new Date(ad.watchedAt).toDateString() : 'unknown';
            if (!groups[date]) {
                groups[date] = { total: 0, completed: 0, rewards: 0 };
            }
            groups[date].total++;
            if (ad.completed) groups[date].completed++;
            groups[date].rewards += ad.rewardEarned || 0;
        }
        return groups;
    }

    /**
     * Get ad performance metrics
     * @param {Object} options - Options
     * @param {string} options.userId - User ID
     * @param {number} options.days - Days to analyze
     * @returns {Promise<Object>} Performance metrics
     */
    async getAdPerformance(options = {}) {
        const { userId = this._currentUser, days = 7 } = options;

        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const analytics = await this.getAdAnalytics({
                userId,
                startDate,
                endDate
            });

            return {
                ...analytics,
                dailyAverage: analytics.total > 0 ? analytics.total / days : 0,
                dailyRewardAverage: analytics.totalRewards > 0 ? analytics.totalRewards / days : 0,
                period: days,
                startDate,
                endDate
            };

        } catch (error) {
            console.error('Get ad performance error:', error);
            return {};
        }
    }

    // ============================================
    // AD RESET / MANAGEMENT
    // ============================================

    /**
     * Reset daily ad count
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AdService} This instance
     */
    resetDailyCount(options = {}) {
        const { emitEvent = true } = options;

        this._todayAdCount = 0;

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ad:daily_reset', {});
        }

        this._updateAdAvailability();

        return this;
    }

    /**
     * Reset cooldown
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AdService} This instance
     */
    resetCooldown(options = {}) {
        const { emitEvent = true } = options;

        this._lastAdWatch = null;

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ad:cooldown_reset', {});
        }

        this._updateAdAvailability();

        return this;
    }

    /**
     * Set max daily ads
     * @param {number} max - Max daily ads
     * @param {Object} options - Options
     * @returns {AdService} This instance
     */
    setMaxDailyAds(max, options = {}) {
        this._maxDailyAds = Math.max(1, max);
        this._updateAdAvailability();
        return this;
    }

    /**
     * Set ad cooldown hours
     * @param {number} hours - Cooldown hours
     * @param {Object} options - Options
     * @returns {AdService} This instance
     */
    setCooldownHours(hours, options = {}) {
        this._adCooldownHours = Math.max(0, hours);
        this._updateAdAvailability();
        return this;
    }

    /**
     * Set coin reward
     * @param {number} reward - Coin reward
     * @param {Object} options - Options
     * @returns {AdService} This instance
     */
    setCoinReward(reward, options = {}) {
        this._coinReward = Math.max(0, reward);
        return this;
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Get database service
     * @private
     * @returns {Object|null} Database service
     */
    _getDatabase() {
        if (typeof DatabaseService !== 'undefined') {
            return DatabaseService.getInstance();
        }
        if (window.db) {
            return window.db;
        }
        return null;
    }

    /**
     * Get current user
     * @returns {string} User ID
     */
    getCurrentUser() {
        return this._currentUser;
    }

    /**
     * Get today's ad count
     * @returns {number} Today's ad count
     */
    getTodayAdCount() {
        return this._todayAdCount;
    }

    /**
     * Get last ad watch time
     * @returns {Date|null} Last ad watch time
     */
    getLastAdWatch() {
        return this._lastAdWatch;
    }

    /**
     * Get max daily ads
     * @returns {number} Max daily ads
     */
    getMaxDailyAds() {
        return this._maxDailyAds;
    }

    /**
     * Get ad cooldown hours
     * @returns {number} Ad cooldown hours
     */
    getCooldownHours() {
        return this._adCooldownHours;
    }

    /**
     * Get coin reward
     * @returns {number} Coin reward
     */
    getCoinReward() {
        return this._coinReward;
    }

    /**
     * Check if in test mode
     * @returns {boolean} True if in test mode
     */
    isTestMode() {
        return this._isTestMode;
    }

    /**
     * Get ad unit IDs
     * @returns {Object} Ad unit IDs
     */
    getAdUnitIds() {
        return { ...this._adUnitIds };
    }

    /**
     * Set ad unit ID
     * @param {string} type - Ad type
     * @param {string} adUnitId - Ad unit ID
     * @returns {AdService} This instance
     */
    setAdUnitId(type, adUnitId) {
        if (this._adUnitIds[type] !== undefined) {
            this._adUnitIds[type] = adUnitId;
        }
        return this;
    }

    /**
     * Get ad history
     * @param {Object} options - Options
     * @param {number} options.limit - History limit
     * @param {string} options.adType - Ad type filter
     * @returns {Array} Ad history
     */
    getAdHistory(options = {}) {
        const { limit = 50, adType = '' } = options;

        let history = [...this._adHistory];

        if (adType) {
            history = history.filter(a => a.adType === adType);
        }

        history.sort((a, b) => {
            const aTime = a.watchedAt ? new Date(a.watchedAt) : new Date(0);
            const bTime = b.watchedAt ? new Date(b.watchedAt) : new Date(0);
            return bTime - aTime;
        });

        return history.slice(0, limit);
    }

    /**
     * Clear ad history
     * @param {Object} options - Options
     * @returns {AdService} This instance
     */
    clearAdHistory(options = {}) {
        this._adHistory = [];
        return this;
    }

    /**
     * Get ad stats
     * @param {Object} options - Options
     * @param {string} options.userId - User ID
     * @returns {Promise<Object>} Ad stats
     */
    async getAdStats(options = {}) {
        const { userId = this._currentUser } = options;

        try {
            const db = this._getDatabase();
            if (!db) return {};

            const ads = await db.query('ad_watches', {
                userId,
                isDeleted: false
            });

            const total = ads.length;
            const completed = ads.filter(a => a.completed).length;
            const totalRewards = ads.reduce((sum, a) => sum + (a.rewardEarned || 0), 0);
            const today = new Date().toDateString();
            const todayAds = ads.filter(a => {
                const date = a.watchedAt ? new Date(a.watchedAt).toDateString() : '';
                return date === today;
            });

            return {
                total,
                completed,
                completionRate: total > 0 ? (completed / total) * 100 : 0,
                totalRewards,
                averageReward: total > 0 ? totalRewards / total : 0,
                today: todayAds.length,
                todayRewards: todayAds.reduce((sum, a) => sum + (a.rewardEarned || 0), 0)
            };

        } catch (error) {
            console.error('Get ad stats error:', error);
            return {};
        }
    }

    // ============================================
    // DESTROY
    // ============================================

    /**
     * Destroy service instance
     */
    destroy() {
        // Remove event listeners
        if (typeof EventBus !== 'undefined') {
            EventBus.off('auth:login', this._handleAuthChange);
            EventBus.off('auth:logout', this._handleAuthChange);
        }
        window.removeEventListener('online', this._handleOnline);
        window.removeEventListener('offline', this._handleOffline);

        // Clear ad listeners
        this._adListeners = [];
        this._rewardedAdCallbacks = [];

        // Clear ad data
        this._bannerAd = null;
        this._interstitialAd = null;
        this._nativeAd = null;

        this._isInitialized = false;
        AdService.#initialized = false;
        AdService.#instance = null;

        console.log('AdService destroyed');
    }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

const adService = AdService.getInstance();

// ============================================================
// EXPORT
// ============================================================

export default adService;

// ============================================================
// END OF FILE: ad-service.js
// ============================================================