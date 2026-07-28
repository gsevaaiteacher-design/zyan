// Ad Watch Model
// ============================================================
// FILE: ad-watch-model.js
// PURPOSE: Ad Watch/View Tracking for Rewarded Ads
// VERSION: 3.0.0 (Production Ready)
// DEPENDENCY: NONE
// USED BY: ad-service.js, download-service.js, ai-service.js, user-model.js
// LOCATION: js/models/ad-watch-model.js
// ============================================================

// ============================================================
// AD WATCH CLASS - ZYMORE v3.0 AD MONETIZATION
// ============================================================

/**
 * AdWatch Model Class
 * Represents an ad watch record in the ZYMORE Hybrid Platform
 * 
 * ZYMORE v3.0 Features:
 * - Rewarded Ads tracking
 * - Every 2 hours cooldown
 * - 3-4 ads per day limit
 * - Coin system integration
 * - Ad completion tracking
 * - Ad type support (rewarded, banner, interstitial, native)
 * - Reward type tracking (download, ai_chat, free_download)
 * - Device & IP tracking
 * - Fraud detection
 * - Analytics tracking
 * - Ad performance metrics
 * - User engagement tracking
 * - Revenue tracking
 */
export class AdWatch {
    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * Create a new AdWatch instance
     * @param {Object} data - Ad watch data
     * @param {string} data.id - Ad watch record ID
     * @param {string} data.userId - User ID
     * @param {string} data.adType - Ad type (rewarded, banner, interstitial, native)
     * @param {string} data.adUnitId - Ad unit ID
     * @param {string} data.adProvider - Ad provider (google, facebook, custom)
     * @param {string} data.adNetwork - Ad network name
     * @param {string} data.adCampaign - Ad campaign name
     * @param {string} data.adCreative - Ad creative ID
     * @param {Date|string} data.watchedAt - Watch timestamp
     * @param {number} data.rewardEarned - Coins earned
     * @param {string} data.rewardType - Reward type (download, ai_chat, free_download, coins)
     * @param {number} data.duration - Ad duration in seconds
     * @param {number} data.watchedDuration - Actual watched duration in seconds
     * @param {boolean} data.completed - Completed status
     * @param {number} data.completionPercentage - Completion percentage (0-100)
     * @param {string} data.ip - IP address
     * @param {string} data.deviceInfo - Device information
     * @param {string} data.deviceId - Device ID
     * @param {string} data.deviceType - Device type (mobile, desktop, tablet)
     * @param {string} data.browser - Browser name
     * @param {string} data.os - Operating system
     * @param {string} data.screenSize - Screen size
     * @param {string} data.networkType - Network type (wifi, cellular, ethernet)
     * @param {string} data.country - Country code
     * @param {string} data.city - City
     * @param {string} data.region - Region
     * @param {string} data.isp - Internet Service Provider
     * @param {string} data.referrer - Referrer URL
     * @param {string} data.landingPage - Landing page URL
     * @param {string} data.exitPage - Exit page URL
     * @param {number} data.timeSpentOnPage - Time spent on page in seconds
     * @param {Object} data.interactionData - User interaction data
     * @param {boolean} data.clicked - Ad clicked
     * @param {boolean} data.interacted - Ad interacted
     * @param {boolean} data.skipped - Ad skipped
     * @param {number} data.skippedAt - Skip timestamp
     * @param {string} data.skipReason - Skip reason
     * @param {boolean} data.muted - Ad muted
     * @param {boolean} data.fullscreened - Ad fullscreened
     * @param {string} data.placement - Ad placement (home, product, download, ai_chat)
     * @param {string} data.context - Ad context
     * @param {Object} data.adMetadata - Ad metadata
     * @param {Object} data.userMetadata - User metadata
     * @param {Object} data.analytics - Analytics data
     * @param {number} data.revenue - Revenue generated
     * @param {string} data.currency - Currency code
     * @param {number} data.ecpm - Effective CPM
     * @param {number} data.ctr - Click-through rate
     * @param {boolean} data.isFraud - Fraud flag
     * @param {string} data.fraudReason - Fraud reason
     * @param {number} data.fraudScore - Fraud score (0-100)
     * @param {string} data.sessionId - Session ID
     * @param {Date|string} data.createdAt - Creation date
     * @param {Date|string} data.updatedAt - Last update date
     * @param {string} data.status - Record status (pending, completed, failed, skipped)
     * @param {Object} data.metadata - Additional metadata
     * @param {boolean} data.isDeleted - Deleted status
     * @param {boolean} data.isValid - Valid status
     * @param {string} data.validationReason - Validation reason
     */
    constructor(data = {}) {
        // ============================================
        // 📌 BASIC INFORMATION
        // ============================================
        this.id = data.id || data.adWatchId || this.generateId();
        this.userId = data.userId || '';
        this.adType = data.adType || 'rewarded'; // 'rewarded' | 'banner' | 'interstitial' | 'native'
        this.adUnitId = data.adUnitId || '';
        this.adProvider = data.adProvider || 'google';
        this.adNetwork = data.adNetwork || '';
        this.adCampaign = data.adCampaign || '';
        this.adCreative = data.adCreative || '';
        
        // ============================================
        // ⏰ TIMESTAMPS
        // ============================================
        this.watchedAt = data.watchedAt ? new Date(data.watchedAt) : new Date();
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
        this.completedAt = data.completedAt ? new Date(data.completedAt) : null;
        this.skippedAt = data.skippedAt ? new Date(data.skippedAt) : null;
        this.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
        this.lastActivityAt = data.lastActivityAt ? new Date(data.lastActivityAt) : null;
        
        // ============================================
        // 💰 REWARD
        // ============================================
        this.rewardEarned = data.rewardEarned || 0;
        this.rewardType = data.rewardType || 'coins'; // 'coins' | 'download' | 'ai_chat' | 'free_download'
        this.rewardData = data.rewardData || {};
        this.rewardClaimed = data.rewardClaimed !== undefined ? data.rewardClaimed : false;
        this.rewardClaimedAt = data.rewardClaimedAt ? new Date(data.rewardClaimedAt) : null;
        this.rewardExpiresAt = data.rewardExpiresAt ? new Date(data.rewardExpiresAt) : null;
        
        // ============================================
        // 🎬 AD VIEWING
        // ============================================
        this.duration = data.duration || 30; // Total ad duration in seconds
        this.watchedDuration = data.watchedDuration || 0;
        this.completed = data.completed || false;
        this.completionPercentage = data.completionPercentage || 0;
        this.skipped = data.skipped || false;
        this.skipReason = data.skipReason || '';
        this.muted = data.muted || false;
        this.fullscreened = data.fullscreened || false;
        this.clicked = data.clicked || false;
        this.interacted = data.interacted || false;
        this.volume = data.volume !== undefined ? data.volume : 100;
        this.quality = data.quality || 'auto'; // 'auto' | 'low' | 'medium' | 'high'
        this.playedCount = data.playedCount || 0;
        
        // ============================================
        // 📍 DEVICE & LOCATION
        // ============================================
        this.ip = data.ip || '';
        this.deviceInfo = data.deviceInfo || '';
        this.deviceId = data.deviceId || '';
        this.deviceType = data.deviceType || ''; // 'mobile' | 'desktop' | 'tablet' | 'tv'
        this.browser = data.browser || '';
        this.os = data.os || '';
        this.screenSize = data.screenSize || '';
        this.networkType = data.networkType || ''; // 'wifi' | 'cellular' | 'ethernet' | 'unknown'
        this.country = data.country || '';
        this.city = data.city || '';
        this.region = data.region || '';
        this.isp = data.isp || '';
        this.lat = data.lat || 0;
        this.lng = data.lng || 0;
        this.timezone = data.timezone || 'UTC';
        this.language = data.language || 'en';
        
        // ============================================
        // 🔗 REFERRER & PAGE
        // ============================================
        this.referrer = data.referrer || '';
        this.landingPage = data.landingPage || '';
        this.exitPage = data.exitPage || '';
        this.timeSpentOnPage = data.timeSpentOnPage || 0;
        this.pageUrl = data.pageUrl || '';
        this.pageTitle = data.pageTitle || '';
        
        // ============================================
        // 📍 PLACEMENT & CONTEXT
        // ============================================
        this.placement = data.placement || ''; // 'home' | 'product' | 'download' | 'ai_chat' | 'explore'
        this.context = data.context || '';
        this.section = data.section || '';
        this.position = data.position || '';
        this.visibility = data.visibility || 100; // Percentage visible
        
        // ============================================
        // 📊 ANALYTICS
        // ============================================
        this.analytics = {
            totalViews: data.analytics?.totalViews || 0,
            totalClicks: data.analytics?.totalClicks || 0,
            totalInteractions: data.analytics?.totalInteractions || 0,
            totalCompletions: data.analytics?.totalCompletions || 0,
            totalSkips: data.analytics?.totalSkips || 0,
            averageViewDuration: data.analytics?.averageViewDuration || 0,
            completionRate: data.analytics?.completionRate || 0,
            ctr: data.analytics?.ctr || 0,
            viewability: data.analytics?.viewability || 0,
            engagementRate: data.analytics?.engagementRate || 0,
            dropoffPoints: data.analytics?.dropoffPoints || {},
            heatmap: data.analytics?.heatmap || {},
            interactions: data.analytics?.interactions || [],
            dailyStats: data.analytics?.dailyStats || {},
            weeklyStats: data.analytics?.weeklyStats || {},
            monthlyStats: data.analytics?.monthlyStats || {},
            ...data.analytics
        };
        
        // ============================================
        // 💰 REVENUE
        // ============================================
        this.revenue = data.revenue || 0;
        this.currency = data.currency || 'USD';
        this.ecpm = data.ecpm || 0;
        this.ctr = data.ctr || 0;
        this.cpc = data.cpc || 0;
        this.cpm = data.cpm || 0;
        this.payout = data.payout || 0;
        this.payoutCurrency = data.payoutCurrency || 'USD';
        this.advertiser = data.advertiser || '';
        
        // ============================================
        // 🚩 FRAUD DETECTION
        // ============================================
        this.isFraud = data.isFraud || false;
        this.fraudReason = data.fraudReason || '';
        this.fraudScore = data.fraudScore || 0;
        this.fraudFlags = Array.isArray(data.fraudFlags) ? [...data.fraudFlags] : [];
        this.validationStatus = data.validationStatus || 'pending'; // 'pending' | 'valid' | 'invalid' | 'fraud'
        this.validationReason = data.validationReason || '';
        this.validatedAt = data.validatedAt ? new Date(data.validatedAt) : null;
        
        // ============================================
        // 🔗 SESSION
        // ============================================
        this.sessionId = data.sessionId || '';
        this.sessionStart = data.sessionStart ? new Date(data.sessionStart) : null;
        this.sessionDuration = data.sessionDuration || 0;
        this.previousAdId = data.previousAdId || '';
        this.nextAdId = data.nextAdId || '';
        
        // ============================================
        // 🏷️ TAGS & CATEGORY
        // ============================================
        this.tags = Array.isArray(data.tags) ? [...data.tags] : [];
        this.category = data.category || 'general';
        this.adCategory = data.adCategory || '';
        this.adSubCategory = data.adSubCategory || '';
        
        // ============================================
        // 🚩 STATUS FLAGS
        // ============================================
        this.status = data.status || 'pending'; // 'pending' | 'completed' | 'failed' | 'skipped' | 'expired'
        this.isDeleted = data.isDeleted || false;
        this.isValid = data.isValid !== undefined ? data.isValid : true;
        this.isRepeated = data.isRepeated || false;
        this.isRewarded = data.isRewarded !== undefined ? data.isRewarded : true;
        
        // ============================================
        // 📝 METADATA
        // ============================================
        this.adMetadata = data.adMetadata || {};
        this.userMetadata = data.userMetadata || {};
        this.metadata = data.metadata || {};
        this.customFields = data.customFields || {};
        this.notes = data.notes || '';
        this.internalNotes = data.internalNotes || '';
        
        // ============================================
        // 🎯 TARGETING
        // ============================================
        this.targeting = data.targeting || {
            age: '',
            gender: '',
            location: '',
            interests: [],
            device: '',
            os: '',
            browser: '',
            language: ''
        };
        
        // ============================================
        // 🔄 SYNC & VERSION
        // ============================================
        this.lastSync = data.lastSync ? new Date(data.lastSync) : new Date();
        this.syncVersion = data.syncVersion || 1;
        this.appVersion = data.appVersion || '3.0.0';
    }

    // ============================================
    // ID GENERATION
    // ============================================

    /**
     * Generate a unique ad watch ID
     * @returns {string} Unique ID
     */
    generateId() {
        return `ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // ============================================
    // VALIDATION
    // ============================================

    /**
     * Validate ad watch data
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

        if (!this.adType) {
            errors.push('Ad type is required');
        }

        // === AD TYPE VALIDATION ===
        const validAdTypes = ['rewarded', 'banner', 'interstitial', 'native'];
        if (this.adType && !validAdTypes.includes(this.adType)) {
            errors.push(`Invalid ad type. Must be one of: ${validAdTypes.join(', ')}`);
        }

        // === DURATION ===
        if (this.duration < 1 || this.duration > 300) {
            warnings.push('Duration should be between 1 and 300 seconds');
        }

        if (this.watchedDuration > this.duration) {
            warnings.push('Watched duration exceeds total duration');
        }

        // === COMPLETION ===
        if (this.completed && this.completionPercentage < 100) {
            warnings.push('Completed flag set but completion percentage is less than 100');
        }

        // === REWARD ===
        if (this.rewardEarned < 0) {
            errors.push('Reward earned cannot be negative');
        }

        // === REWARD TYPE ===
        const validRewardTypes = ['coins', 'download', 'ai_chat', 'free_download'];
        if (this.rewardType && !validRewardTypes.includes(this.rewardType)) {
            warnings.push(`Invalid reward type. Must be one of: ${validRewardTypes.join(', ')}`);
        }

        // === STATUS ===
        const validStatuses = ['pending', 'completed', 'failed', 'skipped', 'expired'];
        if (this.status && !validStatuses.includes(this.status)) {
            errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        // === IP ===
        if (this.ip && !this.isValidIP(this.ip)) {
            warnings.push('Invalid IP address format');
        }

        // === DEVICE TYPE ===
        const validDeviceTypes = ['mobile', 'desktop', 'tablet', 'tv', 'unknown'];
        if (this.deviceType && !validDeviceTypes.includes(this.deviceType)) {
            warnings.push(`Invalid device type. Must be one of: ${validDeviceTypes.join(', ')}`);
        }

        // === NETWORK TYPE ===
        const validNetworkTypes = ['wifi', 'cellular', 'ethernet', 'unknown'];
        if (this.networkType && !validNetworkTypes.includes(this.networkType)) {
            warnings.push(`Invalid network type. Must be one of: ${validNetworkTypes.join(', ')}`);
        }

        // === STRICT VALIDATION ===
        if (strict) {
            if (!this.adUnitId) {
                warnings.push('Ad unit ID is recommended');
            }
            if (!this.deviceInfo) {
                warnings.push('Device info is recommended');
            }
            if (this.completed && !this.completedAt) {
                warnings.push('Completed ad should have completion timestamp');
            }
            if (this.rewardClaimed && !this.rewardClaimedAt) {
                warnings.push('Claimed reward should have claim timestamp');
            }
        }

        // === FRAUD ===
        if (this.isFraud && !this.fraudReason) {
            warnings.push('Fraud flagged but no reason provided');
        }

        return {
            isValid: errors.length === 0,
            hasWarnings: warnings.length > 0,
            errors: errors,
            warnings: warnings
        };
    }

    /**
     * Validate IP address format
     * @param {string} ip - IP address
     * @returns {boolean} True if valid IP
     */
    isValidIP(ip) {
        const ipv4 = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6 = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
        return ipv4.test(ip) || ipv6.test(ip);
    }

    // ============================================
    // CONVERSION METHODS
    // ============================================

    /**
     * Convert to Firestore document
     * @param {Object} options - Conversion options
     * @param {boolean} options.includeMetadata - Include metadata
     * @param {boolean} options.includeAnalytics - Include analytics
     * @param {boolean} options.includePrivate - Include private fields
     * @returns {Object} Firestore document
     */
    toFirestore(options = {}) {
        const { includeMetadata = true, includeAnalytics = true, includePrivate = false } = options;

        const data = {
            userId: this.userId,
            adType: this.adType,
            adUnitId: this.adUnitId,
            adProvider: this.adProvider,
            adNetwork: this.adNetwork,
            adCampaign: this.adCampaign,
            adCreative: this.adCreative,
            watchedAt: this.watchedAt.toISOString(),
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            completedAt: this.completedAt ? this.completedAt.toISOString() : null,
            skippedAt: this.skippedAt ? this.skippedAt.toISOString() : null,
            expiresAt: this.expiresAt ? this.expiresAt.toISOString() : null,
            lastActivityAt: this.lastActivityAt ? this.lastActivityAt.toISOString() : null,
            rewardEarned: this.rewardEarned,
            rewardType: this.rewardType,
            rewardData: this.rewardData,
            rewardClaimed: this.rewardClaimed,
            rewardClaimedAt: this.rewardClaimedAt ? this.rewardClaimedAt.toISOString() : null,
            rewardExpiresAt: this.rewardExpiresAt ? this.rewardExpiresAt.toISOString() : null,
            duration: this.duration,
            watchedDuration: this.watchedDuration,
            completed: this.completed,
            completionPercentage: this.completionPercentage,
            skipped: this.skipped,
            skipReason: this.skipReason,
            muted: this.muted,
            fullscreened: this.fullscreened,
            clicked: this.clicked,
            interacted: this.interacted,
            volume: this.volume,
            quality: this.quality,
            playedCount: this.playedCount,
            ip: this.ip,
            deviceInfo: this.deviceInfo,
            deviceId: this.deviceId,
            deviceType: this.deviceType,
            browser: this.browser,
            os: this.os,
            screenSize: this.screenSize,
            networkType: this.networkType,
            country: this.country,
            city: this.city,
            region: this.region,
            isp: this.isp,
            lat: this.lat,
            lng: this.lng,
            timezone: this.timezone,
            language: this.language,
            referrer: this.referrer,
            landingPage: this.landingPage,
            exitPage: this.exitPage,
            timeSpentOnPage: this.timeSpentOnPage,
            pageUrl: this.pageUrl,
            pageTitle: this.pageTitle,
            placement: this.placement,
            context: this.context,
            section: this.section,
            position: this.position,
            visibility: this.visibility,
            revenue: this.revenue,
            currency: this.currency,
            ecpm: this.ecpm,
            ctr: this.ctr,
            cpc: this.cpc,
            cpm: this.cpm,
            payout: this.payout,
            payoutCurrency: this.payoutCurrency,
            advertiser: this.advertiser,
            isFraud: this.isFraud,
            fraudReason: this.fraudReason,
            fraudScore: this.fraudScore,
            fraudFlags: [...this.fraudFlags],
            validationStatus: this.validationStatus,
            validationReason: this.validationReason,
            validatedAt: this.validatedAt ? this.validatedAt.toISOString() : null,
            sessionId: this.sessionId,
            sessionStart: this.sessionStart ? this.sessionStart.toISOString() : null,
            sessionDuration: this.sessionDuration,
            previousAdId: this.previousAdId,
            nextAdId: this.nextAdId,
            tags: [...this.tags],
            category: this.category,
            adCategory: this.adCategory,
            adSubCategory: this.adSubCategory,
            status: this.status,
            isDeleted: this.isDeleted,
            isValid: this.isValid,
            isRepeated: this.isRepeated,
            isRewarded: this.isRewarded,
            targeting: { ...this.targeting },
            customFields: this.customFields,
            notes: this.notes,
            internalNotes: this.internalNotes,
            lastSync: this.lastSync.toISOString(),
            syncVersion: this.syncVersion,
            appVersion: this.appVersion
        };

        if (includeMetadata) {
            data.adMetadata = this.adMetadata;
            data.userMetadata = this.userMetadata;
            data.metadata = this.metadata;
        }

        if (includeAnalytics) {
            data.analytics = { ...this.analytics };
        }

        if (includePrivate) {
            data.isp = this.isp;
            data.ip = this.ip;
            data.deviceId = this.deviceId;
            data.sessionId = this.sessionId;
            data.sessionStart = this.sessionStart ? this.sessionStart.toISOString() : null;
            data.sessionDuration = this.sessionDuration;
            data.previousAdId = this.previousAdId;
            data.nextAdId = this.nextAdId;
        }

        return data;
    }

    /**
     * Convert to JSON
     * @param {Object} options - Conversion options
     * @param {boolean} options.includePrivate - Include private fields
     * @param {boolean} options.includeMetadata - Include metadata
     * @param {boolean} options.includeAnalytics - Include analytics
     * @param {boolean} options.includeRevenue - Include revenue
     * @returns {Object} JSON object
     */
    toJSON(options = {}) {
        const { includePrivate = false, includeMetadata = false, includeAnalytics = false, includeRevenue = false } = options;

        const data = {
            id: this.id,
            userId: this.userId,
            adType: this.adType,
            adUnitId: this.adUnitId,
            adProvider: this.adProvider,
            adNetwork: this.adNetwork,
            adCampaign: this.adCampaign,
            adCreative: this.adCreative,
            watchedAt: this.watchedAt.toISOString(),
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            completedAt: this.completedAt ? this.completedAt.toISOString() : null,
            skippedAt: this.skippedAt ? this.skippedAt.toISOString() : null,
            expiresAt: this.expiresAt ? this.expiresAt.toISOString() : null,
            rewardEarned: this.rewardEarned,
            rewardType: this.rewardType,
            rewardData: this.rewardData,
            rewardClaimed: this.rewardClaimed,
            rewardClaimedAt: this.rewardClaimedAt ? this.rewardClaimedAt.toISOString() : null,
            rewardExpiresAt: this.rewardExpiresAt ? this.rewardExpiresAt.toISOString() : null,
            duration: this.duration,
            watchedDuration: this.watchedDuration,
            completed: this.completed,
            completionPercentage: this.completionPercentage,
            skipped: this.skipped,
            skipReason: this.skipReason,
            muted: this.muted,
            fullscreened: this.fullscreened,
            clicked: this.clicked,
            interacted: this.interacted,
            volume: this.volume,
            quality: this.quality,
            playedCount: this.playedCount,
            deviceType: this.deviceType,
            browser: this.browser,
            os: this.os,
            screenSize: this.screenSize,
            networkType: this.networkType,
            country: this.country,
            city: this.city,
            region: this.region,
            timezone: this.timezone,
            language: this.language,
            referrer: this.referrer,
            landingPage: this.landingPage,
            exitPage: this.exitPage,
            placement: this.placement,
            context: this.context,
            section: this.section,
            position: this.position,
            visibility: this.visibility,
            isFraud: this.isFraud,
            fraudReason: this.fraudReason,
            fraudScore: this.fraudScore,
            validationStatus: this.validationStatus,
            validationReason: this.validationReason,
            validatedAt: this.validatedAt ? this.validatedAt.toISOString() : null,
            tags: [...this.tags],
            category: this.category,
            adCategory: this.adCategory,
            adSubCategory: this.adSubCategory,
            status: this.status,
            isDeleted: this.isDeleted,
            isValid: this.isValid,
            isRepeated: this.isRepeated,
            isRewarded: this.isRewarded,
            targeting: { ...this.targeting }
        };

        if (includePrivate) {
            data.ip = this.ip;
            data.deviceInfo = this.deviceInfo;
            data.deviceId = this.deviceId;
            data.isp = this.isp;
            data.lat = this.lat;
            data.lng = this.lng;
            data.pageUrl = this.pageUrl;
            data.pageTitle = this.pageTitle;
            data.timeSpentOnPage = this.timeSpentOnPage;
            data.sessionId = this.sessionId;
            data.sessionStart = this.sessionStart ? this.sessionStart.toISOString() : null;
            data.sessionDuration = this.sessionDuration;
            data.previousAdId = this.previousAdId;
            data.nextAdId = this.nextAdId;
            data.customFields = this.customFields;
            data.notes = this.notes;
            data.internalNotes = this.internalNotes;
        }

        if (includeMetadata) {
            data.adMetadata = this.adMetadata;
            data.userMetadata = this.userMetadata;
            data.metadata = this.metadata;
        }

        if (includeAnalytics) {
            data.analytics = { ...this.analytics };
        }

        if (includeRevenue) {
            data.revenue = this.revenue;
            data.currency = this.currency;
            data.ecpm = this.ecpm;
            data.ctr = this.ctr;
            data.cpc = this.cpc;
            data.cpm = this.cpm;
            data.payout = this.payout;
            data.payoutCurrency = this.payoutCurrency;
            data.advertiser = this.advertiser;
        }

        return data;
    }

    /**
     * Get public ad watch data
     * @param {Object} options - Options
     * @param {boolean} options.includeReward - Include reward info
     * @param {boolean} options.includeStats - Include statistics
     * @returns {Object} Public ad watch data
     */
    getPublicData(options = {}) {
        const { includeReward = true, includeStats = true } = options;

        const data = {
            id: this.id,
            adType: this.adType,
            adProvider: this.adProvider,
            watchedAt: this.watchedAt.toISOString(),
            duration: this.duration,
            watchedDuration: this.watchedDuration,
            completed: this.completed,
            completionPercentage: this.completionPercentage,
            clicked: this.clicked,
            interacted: this.interacted,
            placement: this.placement,
            context: this.context,
            status: this.status,
            isValid: this.isValid
        };

        if (includeReward) {
            data.rewardEarned = this.rewardEarned;
            data.rewardType = this.rewardType;
            data.rewardClaimed = this.rewardClaimed;
            data.rewardClaimedAt = this.rewardClaimedAt ? this.rewardClaimedAt.toISOString() : null;
        }

        if (includeStats) {
            data.analytics = {
                totalViews: this.analytics.totalViews,
                totalClicks: this.analytics.totalClicks,
                totalCompletions: this.analytics.totalCompletions,
                completionRate: this.analytics.completionRate,
                ctr: this.analytics.ctr
            };
        }

        return data;
    }

    /**
     * Get minimal ad watch data
     * @param {Object} options - Options
     * @param {boolean} options.includeReward - Include reward info
     * @returns {Object} Minimal ad watch data
     */
    getMinimalData(options = {}) {
        const { includeReward = true } = options;

        const data = {
            id: this.id,
            userId: this.userId,
            adType: this.adType,
            watchedAt: this.watchedAt.toISOString(),
            completed: this.completed,
            completionPercentage: this.completionPercentage,
            status: this.status,
            isValid: this.isValid
        };

        if (includeReward) {
            data.rewardEarned = this.rewardEarned;
            data.rewardType = this.rewardType;
            data.rewardClaimed = this.rewardClaimed;
        }

        return data;
    }

    /**
     * Get ad performance summary
     * @returns {Object} Performance summary
     */
    getPerformanceSummary() {
        const totalViews = this.analytics.totalViews || 0;
        const totalClicks = this.analytics.totalClicks || 0;
        const totalCompletions = this.analytics.totalCompletions || 0;
        const totalSkips = this.analytics.totalSkips || 0;

        return {
            totalViews,
            totalClicks,
            totalCompletions,
            totalSkips,
            completionRate: totalViews > 0 ? (totalCompletions / totalViews) * 100 : 0,
            ctr: totalViews > 0 ? (totalClicks / totalViews) * 100 : 0,
            skipRate: totalViews > 0 ? (totalSkips / totalViews) * 100 : 0,
            averageViewDuration: this.analytics.averageViewDuration || 0,
            engagementRate: this.analytics.engagementRate || 0,
            viewability: this.analytics.viewability || 0,
            revenue: this.revenue || 0,
            ecpm: this.ecpm || 0
        };
    }

    // ============================================
    // AD VIEWING METHODS
    // ============================================

    /**
     * Start ad viewing
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AdWatch} Updated ad watch (this)
     */
    startViewing(options = {}) {
        const { emitEvent = true } = options;
        this.watchedAt = new Date();
        this.lastActivityAt = new Date();
        this.status = 'pending';
        this.playedCount = (this.playedCount || 0) + 1;
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ad:start', { adId: this.id, userId: this.userId });
        }

        return this;
    }

    /**
     * Update ad viewing progress
     * @param {number} duration - Watched duration in seconds
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AdWatch} Updated ad watch (this)
     */
    updateProgress(duration, options = {}) {
        const { emitEvent = true } = options;
        this.watchedDuration = Math.min(duration, this.duration);
        this.completionPercentage = Math.min(100, (this.watchedDuration / this.duration) * 100);
        this.lastActivityAt = new Date();
        this.updatedAt = new Date();

        if (this.watchedDuration >= this.duration) {
            this.completeViewing({ emitEvent });
        }

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ad:progress', { 
                adId: this.id, 
                userId: this.userId, 
                progress: this.completionPercentage 
            });
        }

        return this;
    }

    /**
     * Complete ad viewing
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @param {boolean} options.claimReward - Claim reward
     * @returns {AdWatch} Updated ad watch (this)
     */
    completeViewing(options = {}) {
        const { emitEvent = true, claimReward = true } = options;
        this.completed = true;
        this.completionPercentage = 100;
        this.watchedDuration = this.duration;
        this.completedAt = new Date();
        this.status = 'completed';
        this.updatedAt = new Date();

        if (claimReward) {
            this.claimReward({ emitEvent });
        }

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ad:completed', { adId: this.id, userId: this.userId });
        }

        return this;
    }

    /**
     * Skip ad
     * @param {string} reason - Skip reason
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AdWatch} Updated ad watch (this)
     */
    skipAd(reason = '', options = {}) {
        const { emitEvent = true } = options;
        this.skipped = true;
        this.skippedAt = new Date();
        this.status = 'skipped';
        this.skipReason = reason || 'User skipped';
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ad:skipped', { adId: this.id, userId: this.userId, reason });
        }

        return this;
    }

    /**
     * Click ad
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AdWatch} Updated ad watch (this)
     */
    clickAd(options = {}) {
        const { emitEvent = true } = options;
        this.clicked = true;
        this.interacted = true;
        this.analytics.totalClicks = (this.analytics.totalClicks || 0) + 1;
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ad:clicked', { adId: this.id, userId: this.userId });
        }

        return this;
    }

    /**
     * Interact with ad
     * @param {Object} interactionData - Interaction data
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AdWatch} Updated ad watch (this)
     */
    interact(interactionData = {}, options = {}) {
        const { emitEvent = true } = options;
        this.interacted = true;
        this.analytics.totalInteractions = (this.analytics.totalInteractions || 0) + 1;
        this.analytics.interactions.push({
            timestamp: new Date(),
            data: interactionData
        });
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ad:interacted', { adId: this.id, userId: this.userId, data: interactionData });
        }

        return this;
    }

    /**
     * Mute ad
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AdWatch} Updated ad watch (this)
     */
    mute(options = {}) {
        const { emitEvent = true } = options;
        this.muted = true;
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ad:muted', { adId: this.id, userId: this.userId });
        }

        return this;
    }

    /**
     * Unmute ad
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AdWatch} Updated ad watch (this)
     */
    unmute(options = {}) {
        const { emitEvent = true } = options;
        this.muted = false;
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ad:unmuted', { adId: this.id, userId: this.userId });
        }

        return this;
    }

    /**
     * Fullscreen ad
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AdWatch} Updated ad watch (this)
     */
    fullscreen(options = {}) {
        const { emitEvent = true } = options;
        this.fullscreened = true;
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ad:fullscreen', { adId: this.id, userId: this.userId });
        }

        return this;
    }

    // ============================================
    // REWARD METHODS
    // ============================================

    /**
     * Claim reward
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AdWatch} Updated ad watch (this)
     */
    claimReward(options = {}) {
        const { emitEvent = true } = options;
        if (this.completed && !this.rewardClaimed) {
            this.rewardClaimed = true;
            this.rewardClaimedAt = new Date();
            this.updatedAt = new Date();

            if (emitEvent && typeof EventBus !== 'undefined') {
                EventBus.emit('ad:reward_claimed', { 
                    adId: this.id, 
                    userId: this.userId, 
                    reward: this.rewardEarned,
                    rewardType: this.rewardType
                });
            }
        }
        return this;
    }

    /**
     * Set reward
     * @param {number} amount - Reward amount
     * @param {string} type - Reward type
     * @param {Object} data - Reward data
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AdWatch} Updated ad watch (this)
     */
    setReward(amount, type = 'coins', data = {}, options = {}) {
        const { emitEvent = true } = options;
        this.rewardEarned = amount;
        this.rewardType = type;
        this.rewardData = data;
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ad:reward_set', { 
                adId: this.id, 
                userId: this.userId, 
                reward: amount,
                rewardType: type
            });
        }

        return this;
    }

    /**
     * Check if reward is expired
     * @returns {boolean} True if expired
     */
    isRewardExpired() {
        if (!this.rewardExpiresAt) return false;
        return new Date() > this.rewardExpiresAt;
    }

    /**
     * Check if reward can be claimed
     * @returns {boolean} True if can claim
     */
    canClaimReward() {
        return this.completed && !this.rewardClaimed && !this.isRewardExpired();
    }

    // ============================================
    // FRAUD DETECTION METHODS
    // ============================================

    /**
     * Flag as fraud
     * @param {string} reason - Fraud reason
     * @param {number} score - Fraud score (0-100)
     * @param {Array<string>} flags - Fraud flags
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AdWatch} Updated ad watch (this)
     */
    flagAsFraud(reason, score = 50, flags = [], options = {}) {
        const { emitEvent = true } = options;
        this.isFraud = true;
        this.fraudReason = reason;
        this.fraudScore = Math.min(100, Math.max(0, score));
        this.fraudFlags = [...this.fraudFlags, ...flags];
        this.validationStatus = 'fraud';
        this.validationReason = reason;
        this.validatedAt = new Date();
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ad:fraud_detected', { 
                adId: this.id, 
                userId: this.userId, 
                reason, 
                score 
            });
        }

        return this;
    }

    /**
     * Validate ad watch
     * @param {boolean} isValid - Is valid
     * @param {string} reason - Validation reason
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AdWatch} Updated ad watch (this)
     */
    validate(isValid = true, reason = '', options = {}) {
        const { emitEvent = true } = options;
        this.isValid = isValid;
        this.validationStatus = isValid ? 'valid' : 'invalid';
        this.validationReason = reason;
        this.validatedAt = new Date();
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ad:validated', { 
                adId: this.id, 
                userId: this.userId, 
                isValid, 
                reason 
            });
        }

        return this;
    }

    /**
     * Check for fraud indicators
     * @param {Object} context - Context for fraud detection
     * @param {string} context.ip - IP address
     * @param {string} context.deviceId - Device ID
     * @param {number} context.viewDuration - View duration
     * @param {number} context.completionPercentage - Completion percentage
     * @param {Array} context.history - User history
     * @returns {Object} Fraud detection result
     */
    detectFraud(context = {}) {
        const { ip, deviceId, viewDuration, completionPercentage, history = [] } = context;
        const flags = [];
        let score = 0;
        let reason = '';

        // Check for suspicious IP
        if (ip && this.isSuspiciousIP(ip)) {
            flags.push('suspicious_ip');
            score += 20;
            reason = 'Suspicious IP address';
        }

        // Check for device mismatch
        if (deviceId && this.deviceId && deviceId !== this.deviceId) {
            flags.push('device_mismatch');
            score += 15;
            reason = 'Device ID mismatch';
        }

        // Check for invalid view duration
        if (viewDuration && viewDuration < 1) {
            flags.push('invalid_duration');
            score += 25;
            reason = 'Invalid view duration';
        }

        // Check for suspicious completion
        if (completionPercentage && completionPercentage > 0 && viewDuration && viewDuration < this.duration / 2) {
            flags.push('suspicious_completion');
            score += 30;
            reason = 'Suspicious completion pattern';
        }

        // Check for rapid repeats
        const recentViews = history.filter(h => h.userId === this.userId && h.adUnitId === this.adUnitId);
        if (recentViews.length > 5) {
            flags.push('rapid_repeats');
            score += 10;
            reason = 'Too many repeated views';
        }

        // Check for VPN/proxy
        if (ip && this.isVPNIP(ip)) {
            flags.push('vpn_detected');
            score += 15;
            reason = 'VPN/Proxy detected';
        }

        return {
            isFraud: score > 50,
            score,
            flags,
            reason: reason || (score > 50 ? 'Suspicious activity detected' : ''),
            details: {
                ip: ip || this.ip,
                deviceId: deviceId || this.deviceId,
                viewDuration: viewDuration || this.watchedDuration,
                completionPercentage: completionPercentage || this.completionPercentage
            }
        };
    }

    /**
     * Check if IP is suspicious
     * @param {string} ip - IP address
     * @returns {boolean} True if suspicious
     */
    isSuspiciousIP(ip) {
        // Check for private IPs, localhost, etc.
        const privateIPs = /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.|0\.|::1|fe80|fc00|fd00)/;
        return privateIPs.test(ip);
    }

    /**
     * Check if IP is VPN/Proxy
     * @param {string} ip - IP address
     * @returns {boolean} True if VPN
     */
    isVPNIP(ip) {
        // This would need an external service or database
        // For now, check for common VPN IP ranges
        const vpnRanges = /^(5\.|46\.|91\.|92\.|93\.|94\.|95\.|109\.|110\.|176\.|178\.|185\.|188\.|193\.|194\.|195\.)/;
        return vpnRanges.test(ip);
    }

    // ============================================
    // REVENUE METHODS
    // ============================================

    /**
     * Calculate revenue
     * @param {number} rate - Rate per view
     * @param {string} currency - Currency
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AdWatch} Updated ad watch (this)
     */
    calculateRevenue(rate = 0.01, currency = 'USD', options = {}) {
        const { emitEvent = true } = options;
        this.revenue = this.completed ? rate : 0;
        this.currency = currency;
        this.ecpm = this.revenue * 1000;
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ad:revenue_calculated', { 
                adId: this.id, 
                userId: this.userId, 
                revenue: this.revenue,
                currency
            });
        }

        return this;
    }

    /**
     * Update CPM/CPC
     * @param {number} cpm - Cost per mille
     * @param {number} cpc - Cost per click
     * @param {Object} options - Options
     * @returns {AdWatch} Updated ad watch (this)
     */
    updateRates(cpm = 0, cpc = 0, options = {}) {
        this.cpm = cpm;
        this.cpc = cpc;
        this.updatedAt = new Date();
        return this;
    }

    // ============================================
    // STATUS METHODS
    // ============================================

    /** @returns {boolean} Check if ad is completed */
    isCompleted() { return this.completed === true && this.status === 'completed'; }

    /** @returns {boolean} Check if ad is pending */
    isPending() { return this.status === 'pending'; }

    /** @returns {boolean} Check if ad is skipped */
    isSkipped() { return this.skipped === true || this.status === 'skipped'; }

    /** @returns {boolean} Check if ad is expired */
    isExpired() { return this.status === 'expired' || (this.expiresAt && new Date() > this.expiresAt); }

    /** @returns {boolean} Check if ad is fraud */
    isFraudulent() { return this.isFraud === true; }

    /** @returns {boolean} Check if ad is valid */
    isValidAd() { return this.isValid === true && !this.isFraud && !this.isDeleted; }

    /** @returns {boolean} Check if ad is rewarded */
    isRewardedAd() { return this.isRewarded === true; }

    /** @returns {boolean} Check if ad has reward claimable */
    hasClaimableReward() { return this.canClaimReward(); }

    /** @returns {boolean} Check if ad was clicked */
    wasClicked() { return this.clicked === true; }

    /** @returns {boolean} Check if ad was interacted */
    wasInteracted() { return this.interacted === true; }

    /** @returns {boolean} Check if ad was fullscreened */
    wasFullscreened() { return this.fullscreened === true; }

    /** @returns {boolean} Check if ad was muted */
    wasMuted() { return this.muted === true; }

    // ============================================
    // ANALYTICS METHODS
    // ============================================

    /**
     * Add daily stat
     * @param {string} date - Date string (YYYY-MM-DD)
     * @param {string} stat - Stat key
     * @param {number} value - Stat value
     * @param {Object} options - Options
     * @returns {AdWatch} Updated ad watch (this)
     */
    addDailyStat(date, stat, value, options = {}) {
        if (!this.analytics.dailyStats) {
            this.analytics.dailyStats = {};
        }
        if (!this.analytics.dailyStats[date]) {
            this.analytics.dailyStats[date] = {};
        }
        this.analytics.dailyStats[date][stat] = (this.analytics.dailyStats[date][stat] || 0) + value;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Get view completion rate
     * @returns {number} Completion rate (0-100)
     */
    getCompletionRate() {
        return this.analytics.completionRate || (this.completed ? 100 : this.completionPercentage);
    }

    /**
     * Get view engagement score
     * @returns {number} Engagement score (0-100)
     */
    getEngagementScore() {
        let score = 0;
        if (this.completed) score += 30;
        if (this.interacted) score += 20;
        if (this.clicked) score += 20;
        if (this.fullscreened) score += 10;
        if (this.watchedDuration / this.duration > 0.5) score += 10;
        if (this.completionPercentage > 75) score += 10;
        return Math.min(100, score);
    }

    /**
     * Get ad performance summary
     * @returns {Object} Performance summary
     */
    getAdPerformance() {
        return {
            viewDuration: this.watchedDuration,
            totalDuration: this.duration,
            completionPercentage: this.completionPercentage,
            completed: this.completed,
            clicked: this.clicked,
            interacted: this.interacted,
            engagementScore: this.getEngagementScore(),
            rewardEarned: this.rewardEarned,
            revenue: this.revenue,
            ecpm: this.ecpm,
            quality: this.quality,
            volume: this.volume
        };
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Get time ago for ad watch
     * @param {string} locale - Locale
     * @returns {string} Time ago
     */
    getTimeAgo(locale = 'en-US') {
        const now = new Date();
        const diff = now - this.watchedAt;
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
     * Clone ad watch record
     * @param {Object} options - Clone options
     * @param {boolean} options.keepId - Keep original ID
     * @param {boolean} options.keepTimestamps - Keep original timestamps
     * @param {boolean} options.keepStats - Keep stats
     * @param {boolean} options.resetReward - Reset reward
     * @returns {AdWatch} Cloned ad watch
     */
    clone(options = {}) {
        const { keepId = false, keepTimestamps = false, keepStats = false, resetReward = true } = options;
        
        const data = this.toFirestore({ 
            includeMetadata: true, 
            includeAnalytics: true, 
            includePrivate: true 
        });
        
        if (!keepId) {
            delete data.id;
            data.id = this.generateId();
        }
        
        if (!keepTimestamps) {
            data.watchedAt = new Date();
            data.createdAt = new Date();
            data.updatedAt = new Date();
            data.completedAt = null;
            data.skippedAt = null;
            data.rewardClaimedAt = null;
            data.validatedAt = null;
            data.lastActivityAt = null;
            data.expiresAt = null;
        }
        
        if (resetReward) {
            data.rewardEarned = 0;
            data.rewardClaimed = false;
            data.rewardData = {};
        }
        
        if (!keepStats) {
            data.analytics = {
                totalViews: 0,
                totalClicks: 0,
                totalInteractions: 0,
                totalCompletions: 0,
                totalSkips: 0,
                averageViewDuration: 0,
                completionRate: 0,
                ctr: 0,
                viewability: 0,
                engagementRate: 0,
                dropoffPoints: {},
                heatmap: {},
                interactions: [],
                dailyStats: {},
                weeklyStats: {},
                monthlyStats: {}
            };
            data.revenue = 0;
            data.ecpm = 0;
            data.ctr = 0;
            data.cpc = 0;
            data.cpm = 0;
            data.payout = 0;
        }
        
        data.completed = false;
        data.completionPercentage = 0;
        data.watchedDuration = 0;
        data.skipped = false;
        data.skipReason = '';
        data.clicked = false;
        data.interacted = false;
        data.isFraud = false;
        data.fraudReason = '';
        data.fraudScore = 0;
        data.fraudFlags = [];
        data.validationStatus = 'pending';
        data.validationReason = '';
        data.status = 'pending';
        data.isValid = true;
        data.isRepeated = false;
        
        return new AdWatch({ ...data, id: data.id });
    }

    /**
     * Compare two ad watch records
     * @param {AdWatch} other - Other ad watch
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
        return `AdWatch(${this.id}, ${this.userId}, ${this.adType}, ${this.status})`;
    }

    /**
     * Convert to display string
     * @returns {string} Display string
     */
    toDisplayString() {
        return `${this.adType} Ad - ${this.status} (${this.completionPercentage}%)`;
    }

    // ============================================
    // STATIC FACTORY METHODS
    // ============================================

    /**
     * Create ad watch from Firestore data
     * @param {Object} data - Firestore data
     * @param {string} id - Document ID
     * @returns {AdWatch} AdWatch instance
     */
    static fromFirestore(data, id) {
        const adData = { ...data, id };
        return new AdWatch(adData);
    }

    /**
     * Create ad watches from Firestore array
     * @param {Array} dataArray - Firestore data array
     * @returns {Array<AdWatch>} AdWatch instances
     */
    static fromFirestoreArray(dataArray) {
        if (!Array.isArray(dataArray)) return [];
        return dataArray.map(data => AdWatch.fromFirestore(data, data.id));
    }

    /**
     * Create a rewarded ad watch
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {string} options.adUnitId - Ad unit ID
     * @param {number} options.duration - Ad duration
     * @param {number} options.rewardAmount - Reward amount
     * @param {string} options.rewardType - Reward type
     * @param {Object} options.deviceInfo - Device info
     * @param {string} options.placement - Ad placement
     * @returns {AdWatch} Rewarded ad watch
     */
    static createRewarded(userId, options = {}) {
        const { 
            adUnitId = '', 
            duration = 30, 
            rewardAmount = 1, 
            rewardType = 'coins',
            deviceInfo = {},
            placement = 'rewarded'
        } = options;

        return new AdWatch({
            userId,
            adType: 'rewarded',
            adUnitId,
            duration,
            rewardEarned: rewardAmount,
            rewardType,
            placement,
            deviceInfo: deviceInfo.deviceInfo || '',
            deviceType: deviceInfo.deviceType || '',
            browser: deviceInfo.browser || '',
            os: deviceInfo.os || '',
            isRewarded: true,
            status: 'pending'
        });
    }

    /**
     * Create a banner ad watch
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {string} options.adUnitId - Ad unit ID
     * @param {string} options.placement - Ad placement
     * @param {Object} options.deviceInfo - Device info
     * @returns {AdWatch} Banner ad watch
     */
    static createBanner(userId, options = {}) {
        const { adUnitId = '', placement = 'banner', deviceInfo = {} } = options;

        return new AdWatch({
            userId,
            adType: 'banner',
            adUnitId,
            placement,
            duration: 0,
            rewardEarned: 0,
            deviceInfo: deviceInfo.deviceInfo || '',
            deviceType: deviceInfo.deviceType || '',
            browser: deviceInfo.browser || '',
            os: deviceInfo.os || '',
            isRewarded: false,
            status: 'pending'
        });
    }

    /**
     * Create an interstitial ad watch
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {string} options.adUnitId - Ad unit ID
     * @param {string} options.placement - Ad placement
     * @param {Object} options.deviceInfo - Device info
     * @returns {AdWatch} Interstitial ad watch
     */
    static createInterstitial(userId, options = {}) {
        const { adUnitId = '', placement = 'interstitial', deviceInfo = {} } = options;

        return new AdWatch({
            userId,
            adType: 'interstitial',
            adUnitId,
            placement,
            duration: 0,
            rewardEarned: 0,
            deviceInfo: deviceInfo.deviceInfo || '',
            deviceType: deviceInfo.deviceType || '',
            browser: deviceInfo.browser || '',
            os: deviceInfo.os || '',
            isRewarded: false,
            status: 'pending'
        });
    }

    /**
     * Create a native ad watch
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {string} options.adUnitId - Ad unit ID
     * @param {string} options.placement - Ad placement
     * @param {Object} options.deviceInfo - Device info
     * @returns {AdWatch} Native ad watch
     */
    static createNative(userId, options = {}) {
        const { adUnitId = '', placement = 'native', deviceInfo = {} } = options;

        return new AdWatch({
            userId,
            adType: 'native',
            adUnitId,
            placement,
            duration: 0,
            rewardEarned: 0,
            deviceInfo: deviceInfo.deviceInfo || '',
            deviceType: deviceInfo.deviceType || '',
            browser: deviceInfo.browser || '',
            os: deviceInfo.os || '',
            isRewarded: false,
            status: 'pending'
        });
    }

    /**
     * Create a download reward ad watch
     * @param {string} userId - User ID
     * @param {string} productId - Product ID
     * @param {Object} options - Options
     * @param {string} options.adUnitId - Ad unit ID
     * @param {number} options.duration - Ad duration
     * @param {Object} options.deviceInfo - Device info
     * @returns {AdWatch} Download reward ad watch
     */
    static createDownloadReward(userId, productId, options = {}) {
        const { adUnitId = '', duration = 30, deviceInfo = {} } = options;

        return new AdWatch({
            userId,
            adType: 'rewarded',
            adUnitId,
            duration,
            rewardEarned: 1,
            rewardType: 'download',
            rewardData: { productId },
            placement: 'download',
            deviceInfo: deviceInfo.deviceInfo || '',
            deviceType: deviceInfo.deviceType || '',
            browser: deviceInfo.browser || '',
            os: deviceInfo.os || '',
            isRewarded: true,
            status: 'pending'
        });
    }

    /**
     * Create an AI chat reward ad watch
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {string} options.adUnitId - Ad unit ID
     * @param {number} options.duration - Ad duration
     * @param {Object} options.deviceInfo - Device info
     * @returns {AdWatch} AI chat reward ad watch
     */
    static createAIChatReward(userId, options = {}) {
        const { adUnitId = '', duration = 30, deviceInfo = {} } = options;

        return new AdWatch({
            userId,
            adType: 'rewarded',
            adUnitId,
            duration,
            rewardEarned: 3,
            rewardType: 'ai_chat',
            placement: 'ai_chat',
            deviceInfo: deviceInfo.deviceInfo || '',
            deviceType: deviceInfo.deviceType || '',
            browser: deviceInfo.browser || '',
            os: deviceInfo.os || '',
            isRewarded: true,
            status: 'pending'
        });
    }

    // ============================================
    // STATIC QUERY & FILTER METHODS
    // ============================================

    /**
     * Filter ad watches by user
     * @param {Array<AdWatch>} adWatches - Ad watches array
     * @param {string} userId - User ID
     * @returns {Array<AdWatch>} Filtered ad watches
     */
    static filterByUser(adWatches, userId) {
        if (!userId) return adWatches;
        return adWatches.filter(a => a.userId === userId);
    }

    /**
     * Filter ad watches by type
     * @param {Array<AdWatch>} adWatches - Ad watches array
     * @param {string|Array<string>} types - Type(s) to filter
     * @returns {Array<AdWatch>} Filtered ad watches
     */
    static filterByType(adWatches, types) {
        if (!types) return adWatches;
        if (!Array.isArray(types)) types = [types];
        return adWatches.filter(a => types.includes(a.adType));
    }

    /**
     * Filter completed ad watches
     * @param {Array<AdWatch>} adWatches - Ad watches array
     * @param {boolean} completed - Completed status
     * @returns {Array<AdWatch>} Filtered ad watches
     */
    static filterByCompleted(adWatches, completed = true) {
        return adWatches.filter(a => a.completed === completed);
    }

    /**
     * Filter valid ad watches
     * @param {Array<AdWatch>} adWatches - Ad watches array
     * @param {boolean} isValid - Valid status
     * @returns {Array<AdWatch>} Filtered ad watches
     */
    static filterByValid(adWatches, isValid = true) {
        return adWatches.filter(a => a.isValid === isValid);
    }

    /**
     * Filter ad watches by reward claimed
     * @param {Array<AdWatch>} adWatches - Ad watches array
     * @param {boolean} claimed - Claimed status
     * @returns {Array<AdWatch>} Filtered ad watches
     */
    static filterByRewardClaimed(adWatches, claimed = true) {
        return adWatches.filter(a => a.rewardClaimed === claimed);
    }

    /**
     * Filter ad watches by fraud status
     * @param {Array<AdWatch>} adWatches - Ad watches array
     * @param {boolean} isFraud - Fraud status
     * @returns {Array<AdWatch>} Filtered ad watches
     */
    static filterByFraud(adWatches, isFraud = true) {
        return adWatches.filter(a => a.isFraud === isFraud);
    }

    /**
     * Filter ad watches by date range
     * @param {Array<AdWatch>} adWatches - Ad watches array
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Array<AdWatch>} Filtered ad watches
     */
    static filterByDateRange(adWatches, startDate, endDate) {
        return adWatches.filter(a => a.watchedAt >= startDate && a.watchedAt <= endDate);
    }

    /**
     * Sort ad watches by date
     * @param {Array<AdWatch>} adWatches - Ad watches array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<AdWatch>} Sorted ad watches
     */
    static sortByDate(adWatches, order = 'desc') {
        const sorted = [...adWatches];
        sorted.sort((a, b) => {
            const aTime = a.watchedAt.getTime();
            const bTime = b.watchedAt.getTime();
            return order === 'asc' ? aTime - bTime : bTime - aTime;
        });
        return sorted;
    }

    /**
     * Sort ad watches by reward
     * @param {Array<AdWatch>} adWatches - Ad watches array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<AdWatch>} Sorted ad watches
     */
    static sortByReward(adWatches, order = 'desc') {
        const sorted = [...adWatches];
        sorted.sort((a, b) => {
            return order === 'asc' ? (a.rewardEarned || 0) - (b.rewardEarned || 0) : (b.rewardEarned || 0) - (a.rewardEarned || 0);
        });
        return sorted;
    }

    /**
     * Get total rewards earned
     * @param {Array<AdWatch>} adWatches - Ad watches array
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {boolean} options.includeClaimed - Include claimed rewards
     * @param {string} options.rewardType - Reward type filter
     * @returns {number} Total rewards
     */
    static getTotalRewards(adWatches, userId, options = {}) {
        const { includeClaimed = true, rewardType = '' } = options;
        
        let filtered = adWatches.filter(a => a.userId === userId && a.completed);
        
        if (!includeClaimed) {
            filtered = filtered.filter(a => !a.rewardClaimed);
        }
        
        if (rewardType) {
            filtered = filtered.filter(a => a.rewardType === rewardType);
        }
        
        return filtered.reduce((sum, a) => sum + (a.rewardEarned || 0), 0);
    }

    /**
     * Get total revenue
     * @param {Array<AdWatch>} adWatches - Ad watches array
     * @param {Object} options - Options
     * @param {string} options.currency - Currency filter
     * @param {boolean} options.includeFraud - Include fraud
     * @returns {number} Total revenue
     */
    static getTotalRevenue(adWatches, options = {}) {
        const { currency = '', includeFraud = false } = options;
        
        let filtered = adWatches.filter(a => a.completed);
        
        if (!includeFraud) {
            filtered = filtered.filter(a => !a.isFraud && a.isValid);
        }
        
        if (currency) {
            filtered = filtered.filter(a => a.currency === currency);
        }
        
        return filtered.reduce((sum, a) => sum + (a.revenue || 0), 0);
    }

    /**
     * Get stats by day
     * @param {Array<AdWatch>} adWatches - Ad watches array
     * @param {string} userId - User ID
     * @param {number} days - Number of days
     * @returns {Object} Daily stats
     */
    static getDailyStats(adWatches, userId, days = 7) {
        const stats = {};
        const now = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const key = date.toISOString().split('T')[0];
            stats[key] = { views: 0, completions: 0, rewards: 0, revenue: 0 };
        }
        
        const filtered = adWatches.filter(a => a.userId === userId);
        
        for (const ad of filtered) {
            const key = ad.watchedAt.toISOString().split('T')[0];
            if (stats[key]) {
                stats[key].views++;
                if (ad.completed) {
                    stats[key].completions++;
                    stats[key].rewards += ad.rewardEarned || 0;
                    stats[key].revenue += ad.revenue || 0;
                }
            }
        }
        
        return stats;
    }

    /**
     * Get completion rate by type
     * @param {Array<AdWatch>} adWatches - Ad watches array
     * @param {string} userId - User ID
     * @returns {Object} Completion rates by type
     */
    static getCompletionRateByType(adWatches, userId) {
        const filtered = adWatches.filter(a => a.userId === userId);
        const types = ['rewarded', 'banner', 'interstitial', 'native'];
        const result = {};
        
        for (const type of types) {
            const typeAds = filtered.filter(a => a.adType === type);
            const total = typeAds.length;
            const completed = typeAds.filter(a => a.completed).length;
            result[type] = {
                total,
                completed,
                rate: total > 0 ? (completed / total) * 100 : 0
            };
        }
        
        return result;
    }

    /**
     * Get total ad watches count by user
     * @param {Array<AdWatch>} adWatches - Ad watches array
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {boolean} options.includeFraud - Include fraud
     * @param {boolean} options.includeSkipped - Include skipped
     * @returns {number} Total count
     */
    static getTotalCount(adWatches, userId, options = {}) {
        const { includeFraud = false, includeSkipped = false } = options;
        
        let filtered = adWatches.filter(a => a.userId === userId);
        
        if (!includeFraud) {
            filtered = filtered.filter(a => !a.isFraud);
        }
        
        if (!includeSkipped) {
            filtered = filtered.filter(a => !a.skipped);
        }
        
        return filtered.length;
    }

    /**
     * Check if data is valid ad watch data
     * @param {Object} data - Data to check
     * @returns {boolean} True if valid
     */
    static isValidAdWatchData(data) {
        return data && typeof data === 'object' &&
            data.userId && data.userId.trim() !== '' &&
            data.adType && data.adType.trim() !== '';
    }

    /**
     * Group ad watches by type
     * @param {Array<AdWatch>} adWatches - Ad watches array
     * @returns {Object} Grouped by type
     */
    static groupByType(adWatches) {
        const groups = { rewarded: [], banner: [], interstitial: [], native: [] };
        for (const ad of adWatches) {
            if (groups[ad.adType]) {
                groups[ad.adType].push(ad);
            } else {
                groups.other = groups.other || [];
                groups.other.push(ad);
            }
        }
        return groups;
    }

    /**
     * Group ad watches by date
     * @param {Array<AdWatch>} adWatches - Ad watches array
     * @param {string} groupBy - 'day', 'week', 'month'
     * @returns {Object} Grouped by date
     */
    static groupByDate(adWatches, groupBy = 'day') {
        const groups = {};
        for (const ad of adWatches) {
            let key;
            switch (groupBy) {
                case 'week':
                    const weekStart = new Date(ad.watchedAt);
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    key = weekStart.toDateString();
                    break;
                case 'month':
                    key = `${ad.watchedAt.getFullYear()}-${ad.watchedAt.getMonth() + 1}`;
                    break;
                default:
                    key = ad.watchedAt.toDateString();
            }
            if (!groups[key]) groups[key] = [];
            groups[key].push(ad);
        }
        return groups;
    }
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default AdWatch;

/**
 * Helpers to match index.js expectation for AdWatch
 */
export function createAdWatch(data) {
    return new AdWatch(data);
}

export function validateAdWatch(data) {
    const adWatch = data instanceof AdWatch ? data : new AdWatch(data);
    return adWatch.validate ? adWatch.validate() : { isValid: true };
}

export function adWatchToFirestore(adWatch) {
    if (adWatch && typeof adWatch.toFirestore === 'function') {
        return adWatch.toFirestore();
    }
    return adWatch;
}

export function firestoreToAdWatch(doc) {
    if (!doc) return null;
    const data = typeof doc.data === 'function' ? doc.data() : doc;
    const id = typeof doc.id === 'string' ? doc.id : data.id;
    if (typeof AdWatch.fromFirestore === 'function') {
        return AdWatch.fromFirestore(data, id);
    }
    return new AdWatch({ ...data, id });
}

// ============================================================
// END OF FILE: ad-watch-model.js
// ============================================================