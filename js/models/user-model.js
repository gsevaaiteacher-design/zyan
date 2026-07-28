// User Model
// ============================================================
// FILE: user-model.js
// PURPOSE: User data structure for ZYMORE v3.0 Hybrid Platform
// DEPENDENCY: NONE
// USED BY: auth-service.js, database-service.js, store.js, social-service.js, chat-service.js, ai-service.js
// LOCATION: js/models/user-model.js
// ============================================================

// ============================================================
// USER CLASS
// ============================================================

/**
 * User Model Class
 * Represents a user in the ZYMORE Hybrid Platform
 * Handles user data structure, validation, and serialization
 * 
 * ZYMORE v3.0 Features:
 * - Social Features (followers, following, totalPosts)
 * - Marketplace (isSeller, totalProducts, totalSales)
 * - AI Chat (aiQuestionsUsed, coins)
 * - Ad Monetization (lastAdWatch, coins)
 * - Location Based (location)
 * - Feed Algorithm (interests)
 * - PWA Ready
 * - Multi-language Support
 */
export class User {
    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * Create a new User instance
     * @param {Object} data - User data
     * @param {string} data.uid - Firebase UID
     * @param {string} data.email - User email
     * @param {string} data.displayName - Display name
     * @param {string} data.photoURL - Profile photo URL
     * @param {string} data.bio - User bio
     * @param {string} data.location - User location
     * @param {boolean} data.isSeller - Seller status
     * @param {boolean} data.isAdmin - Admin status
     * @param {boolean} data.isVerified - Email verified
     * @param {boolean} data.isBlocked - Blocked status
     * @param {number} data.followers - Number of followers
     * @param {number} data.following - Number of following
     * @param {number} data.totalPosts - Total posts made
     * @param {number} data.totalProducts - Total products listed
     * @param {number} data.totalSales - Total sales made
     * @param {number} data.coins - Coins earned from ads
     * @param {number} data.freeDownloadsUsed - Free downloads used this month
     * @param {number} data.aiQuestionsUsed - AI questions used today
     * @param {Date|string} data.lastAdWatch - Last rewarded ad time
     * @param {Array<string>} data.interests - User interests (categories)
     * @param {Object} data.preferences - User preferences
     * @param {Object} data.socialLinks - Social media links
     * @param {Object} data.sellerProfile - Seller profile (if isSeller)
     * @param {Date|string} data.createdAt - Account creation date
     * @param {Date|string} data.lastActive - Last active timestamp
     */
    constructor(data = {}) {
        // ============================================
        // BASIC INFORMATION
        // ============================================
        this.uid = data.uid || data.id || this.generateId();
        this.email = data.email || '';
        this.displayName = data.displayName || data.name || '';
        this.photoURL = data.photoURL || data.photoUrl || data.avatar || '';
        this.bio = data.bio || '';
        this.location = data.location || '';

        // ============================================
        // ACCOUNT STATUS
        // ============================================
        this.isSeller = data.isSeller !== undefined ? data.isSeller : false;
        this.isAdmin = data.isAdmin !== undefined ? data.isAdmin : false;
        this.isVerified = data.isVerified !== undefined ? data.isVerified : false;
        this.isBlocked = data.isBlocked !== undefined ? data.isBlocked : false;

        // ============================================
        // SOCIAL STATS
        // ============================================
        this.followers = data.followers !== undefined ? data.followers : 0;
        this.following = data.following !== undefined ? data.following : 0;
        this.totalPosts = data.totalPosts !== undefined ? data.totalPosts : 0;

        // ============================================
        // MARKETPLACE STATS
        // ============================================
        this.totalProducts = data.totalProducts !== undefined ? data.totalProducts : 0;
        this.totalSales = data.totalSales !== undefined ? data.totalSales : 0;

        // ============================================
        // AD & AI STATS
        // ============================================
        this.coins = data.coins !== undefined ? data.coins : 0;
        this.freeDownloadsUsed = data.freeDownloadsUsed !== undefined ? data.freeDownloadsUsed : 0;
        this.aiQuestionsUsed = data.aiQuestionsUsed !== undefined ? data.aiQuestionsUsed : 0;
        this.lastAdWatch = data.lastAdWatch ? new Date(data.lastAdWatch) : null;
        this.lastAdWatchDate = data.lastAdWatch ? new Date(data.lastAdWatch) : null;

        // ============================================
        // INTERESTS & PREFERENCES
        // ============================================
        this.interests = data.interests || [];
        this.preferences = {
            darkMode: data.preferences?.darkMode !== undefined ? data.preferences.darkMode : false,
            language: data.preferences?.language || 'en',
            notifications: data.preferences?.notifications !== undefined ? data.preferences.notifications : true,
            emailNotifications: data.preferences?.emailNotifications !== undefined ? data.preferences.emailNotifications : true,
            pushNotifications: data.preferences?.pushNotifications !== undefined ? data.preferences.pushNotifications : true,
            ...data.preferences
        };

        // ============================================
        // SOCIAL LINKS
        // ============================================
        this.socialLinks = {
            instagram: data.socialLinks?.instagram || '',
            twitter: data.socialLinks?.twitter || '',
            youtube: data.socialLinks?.youtube || '',
            facebook: data.socialLinks?.facebook || '',
            linkedin: data.socialLinks?.linkedin || '',
            website: data.socialLinks?.website || '',
            ...data.socialLinks
        };

        // ============================================
        // SELLER PROFILE
        // ============================================
        this.sellerProfile = data.sellerProfile || {
            bio: '',
            rating: 0,
            ratingCount: 0,
            totalListings: 0,
            totalSales: 0,
            joinedDate: null,
            badges: [],
            shopName: '',
            shopDescription: '',
            shopLogo: '',
            shopBanner: '',
            socialLinks: {},
            isVerified: false,
            verificationBadge: false
        };

        // ============================================
        // TIMESTAMPS
        // ============================================
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
        this.lastActive = data.lastActive ? new Date(data.lastActive) : new Date();
        this.lastLogin = data.lastLogin ? new Date(data.lastLogin) : null;

        // ============================================
        // METADATA
        // ============================================
        this.metadata = data.metadata || {};
        this.deviceInfo = data.deviceInfo || {};
        this.lastIP = data.lastIP || '';
        this.timezone = data.timezone || 'UTC';

        // ============================================
        // FREE DOWNLOADS TRACKING (Monthly Reset)
        // ============================================
        this.freeDownloadsLimit = data.freeDownloadsLimit || 5;
        this.freeDownloadsResetDate = data.freeDownloadsResetDate ? new Date(data.freeDownloadsResetDate) : new Date();
        
        // ============================================
        // AI CHAT TRACKING (Daily Reset)
        // ============================================
        this.aiQuestionsLimit = data.aiQuestionsLimit || 5;
        this.aiQuestionsResetDate = data.aiQuestionsResetDate ? new Date(data.aiQuestionsResetDate) : new Date();
        this.aiQuestionsTotal = data.aiQuestionsTotal !== undefined ? data.aiQuestionsTotal : 0;
        this.aiAdShown = data.aiAdShown !== undefined ? data.aiAdShown : false;
        this.aiQuestionCountAfterAd = data.aiQuestionCountAfterAd !== undefined ? data.aiQuestionCountAfterAd : 0;

        // ============================================
        // AD TRACKING
        // ============================================
        this.adWatchHistory = data.adWatchHistory || [];
        this.todayAdCount = data.todayAdCount !== undefined ? data.todayAdCount : 0;
        this.maxDailyAds = data.maxDailyAds || 4;
        this.adCooldownHours = data.adCooldownHours || 2;
        this.coinsTotal = data.coinsTotal !== undefined ? data.coinsTotal : 0;
        this.coinsSpent = data.coinsSpent !== undefined ? data.coinsSpent : 0;

        // ============================================
        // FOLLOW SYSTEM
        // ============================================
        this.followersList = data.followersList || [];
        this.followingList = data.followingList || [];
        this.followRequests = data.followRequests || [];
        this.isPrivate = data.isPrivate !== undefined ? data.isPrivate : false;

        // ============================================
        // NOTIFICATION SETTINGS
        // ============================================
        this.notificationSettings = {
            follow: data.notificationSettings?.follow !== undefined ? data.notificationSettings.follow : true,
            comment: data.notificationSettings?.comment !== undefined ? data.notificationSettings.comment : true,
            like: data.notificationSettings?.like !== undefined ? data.notificationSettings.like : true,
            mention: data.notificationSettings?.mention !== undefined ? data.notificationSettings.mention : true,
            message: data.notificationSettings?.message !== undefined ? data.notificationSettings.message : true,
            productUpdate: data.notificationSettings?.productUpdate !== undefined ? data.notificationSettings.productUpdate : true,
            promotion: data.notificationSettings?.promotion !== undefined ? data.notificationSettings.promotion : true,
            ...data.notificationSettings
        };

        // ============================================
        // SESSION
        // ============================================
        this.sessionId = data.sessionId || '';
        this.sessionExpiry = data.sessionExpiry ? new Date(data.sessionExpiry) : null;
        this.isOnline = data.isOnline !== undefined ? data.isOnline : false;
        this.lastSeen = data.lastSeen ? new Date(data.lastSeen) : null;
        this.activeSessions = data.activeSessions || [];
    }

    // ============================================
    // ID GENERATION
    // ============================================

    /**
     * Generate a unique user ID
     * @returns {string} Unique ID
     */
    generateId() {
        return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // ============================================
    // VALIDATION METHODS
    // ============================================

    /**
     * Validate user data
     * @param {Object} options - Validation options
     * @param {boolean} options.strict - Strict validation
     * @returns {Object} Validation result { isValid, errors, warnings }
     */
    validate(options = {}) {
        const errors = [];
        const warnings = [];
        const { strict = false } = options;

        // === REQUIRED FIELDS ===
        if (!this.email || this.email.trim() === '') {
            errors.push('Email is required');
        }

        if (this.email && !this.isValidEmail(this.email)) {
            errors.push('Invalid email format');
        }

        if (strict && (!this.displayName || this.displayName.trim() === '')) {
            errors.push('Display name is required');
        }

        if (this.displayName && (this.displayName.length < 2 || this.displayName.length > 50)) {
            errors.push('Display name must be between 2 and 50 characters');
        }

        // === BIO VALIDATION ===
        if (this.bio && this.bio.length > 500) {
            warnings.push('Bio is too long (max 500 characters)');
        }

        // === LOCATION VALIDATION ===
        if (this.location && this.location.length > 100) {
            warnings.push('Location is too long (max 100 characters)');
        }

        // === INTERESTS VALIDATION ===
        if (this.interests && this.interests.length > 20) {
            warnings.push('Too many interests (max 20 recommended)');
        }

        // === SOCIAL LINKS VALIDATION ===
        for (const [platform, url] of Object.entries(this.socialLinks)) {
            if (url && !this.isValidUrl(url)) {
                warnings.push(`Invalid ${platform} URL format`);
            }
        }

        // === COINS VALIDATION ===
        if (this.coins < 0) {
            warnings.push('Coins cannot be negative');
        }

        // === SELLER PROFILE VALIDATION ===
        if (this.isSeller) {
            if (this.sellerProfile && this.sellerProfile.shopName && 
                this.sellerProfile.shopName.length > 100) {
                warnings.push('Shop name is too long (max 100 characters)');
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            hasWarnings: warnings.length > 0
        };
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid email
     */
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
    // TRANSFORMATION METHODS
    // ============================================

    /**
     * Convert User to plain object for Firestore
     * @param {Object} options - Conversion options
     * @param {boolean} options.includePrivate - Include private fields
     * @param {boolean} options.includeMetadata - Include metadata
     * @returns {Object} Plain object representation
     */
    toFirestore(options = {}) {
        const { includePrivate = false, includeMetadata = false } = options;

        const data = {
            uid: this.uid,
            email: this.email,
            displayName: this.displayName,
            photoURL: this.photoURL,
            bio: this.bio,
            location: this.location,
            isSeller: this.isSeller,
            isAdmin: this.isAdmin,
            isVerified: this.isVerified,
            isBlocked: this.isBlocked,
            followers: this.followers,
            following: this.following,
            totalPosts: this.totalPosts,
            totalProducts: this.totalProducts,
            totalSales: this.totalSales,
            coins: this.coins,
            freeDownloadsUsed: this.freeDownloadsUsed,
            aiQuestionsUsed: this.aiQuestionsUsed,
            lastAdWatch: this.lastAdWatch ? this.lastAdWatch.toISOString() : null,
            interests: this.interests,
            preferences: this.preferences,
            socialLinks: this.socialLinks,
            sellerProfile: this.sellerProfile,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            lastActive: this.lastActive.toISOString(),
            lastLogin: this.lastLogin ? this.lastLogin.toISOString() : null,
            freeDownloadsLimit: this.freeDownloadsLimit,
            freeDownloadsResetDate: this.freeDownloadsResetDate.toISOString(),
            aiQuestionsLimit: this.aiQuestionsLimit,
            aiQuestionsResetDate: this.aiQuestionsResetDate.toISOString(),
            aiQuestionsTotal: this.aiQuestionsTotal,
            aiAdShown: this.aiAdShown,
            aiQuestionCountAfterAd: this.aiQuestionCountAfterAd,
            todayAdCount: this.todayAdCount,
            maxDailyAds: this.maxDailyAds,
            adCooldownHours: this.adCooldownHours,
            coinsTotal: this.coinsTotal,
            coinsSpent: this.coinsSpent,
            isPrivate: this.isPrivate,
            notificationSettings: this.notificationSettings,
            timezone: this.timezone,
            isOnline: this.isOnline,
            lastSeen: this.lastSeen ? this.lastSeen.toISOString() : null
        };

        if (includePrivate) {
            data.followersList = this.followersList;
            data.followingList = this.followingList;
            data.followRequests = this.followRequests;
            data.deviceInfo = this.deviceInfo;
            data.lastIP = this.lastIP;
            data.sessionId = this.sessionId;
            data.sessionExpiry = this.sessionExpiry ? this.sessionExpiry.toISOString() : null;
            data.activeSessions = this.activeSessions;
            data.adWatchHistory = this.adWatchHistory;
        }

        if (includeMetadata) {
            data.metadata = this.metadata;
        }

        return data;
    }

    /**
     * Convert to JSON for API responses
     * @param {Object} options - Conversion options
     * @param {boolean} options.includePrivate - Include private fields
     * @param {boolean} options.includeStats - Include statistics
     * @returns {Object} User data
     */
    toJSON(options = {}) {
        const { includePrivate = false, includeStats = true } = options;

        const data = {
            uid: this.uid,
            email: this.email,
            displayName: this.displayName,
            photoURL: this.photoURL,
            bio: this.bio,
            location: this.location,
            isSeller: this.isSeller,
            isAdmin: this.isAdmin,
            isVerified: this.isVerified,
            isBlocked: this.isBlocked,
            followers: this.followers,
            following: this.following,
            totalPosts: this.totalPosts,
            totalProducts: this.totalProducts,
            totalSales: this.totalSales,
            coins: this.coins,
            interests: this.interests,
            preferences: this.preferences,
            socialLinks: this.socialLinks,
            sellerProfile: this.sellerProfile,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            lastActive: this.lastActive.toISOString(),
            lastLogin: this.lastLogin ? this.lastLogin.toISOString() : null,
            isOnline: this.isOnline,
            lastSeen: this.lastSeen ? this.lastSeen.toISOString() : null,
            isPrivate: this.isPrivate,
            timezone: this.timezone
        };

        if (includeStats && includePrivate) {
            data.coinsTotal = this.coinsTotal;
            data.coinsSpent = this.coinsSpent;
            data.freeDownloadsUsed = this.freeDownloadsUsed;
            data.freeDownloadsLimit = this.freeDownloadsLimit;
            data.aiQuestionsUsed = this.aiQuestionsUsed;
            data.aiQuestionsLimit = this.aiQuestionsLimit;
            data.aiQuestionsTotal = this.aiQuestionsTotal;
            data.todayAdCount = this.todayAdCount;
            data.maxDailyAds = this.maxDailyAds;
        }

        if (includePrivate) {
            data.email = this.email;
            data.deviceInfo = this.deviceInfo;
            data.lastIP = this.lastIP;
            data.sessionId = this.sessionId;
            data.sessionExpiry = this.sessionExpiry ? this.sessionExpiry.toISOString() : null;
            data.activeSessions = this.activeSessions;
            data.followersList = this.followersList;
            data.followingList = this.followingList;
            data.followRequests = this.followRequests;
            data.notificationSettings = this.notificationSettings;
            data.adWatchHistory = this.adWatchHistory;
        }

        return data;
    }

    /**
     * Get public user data (for social features)
     * @param {Object} options - Options
     * @param {boolean} options.includeStats - Include statistics
     * @returns {Object} Public user data
     */
    getPublicData(options = {}) {
        const { includeStats = true } = options;

        const data = {
            uid: this.uid,
            displayName: this.displayName,
            photoURL: this.photoURL,
            bio: this.bio,
            location: this.location,
            isSeller: this.isSeller,
            isVerified: this.isVerified,
            followers: this.followers,
            following: this.following,
            totalPosts: this.totalPosts,
            totalProducts: this.totalProducts,
            totalSales: this.totalSales,
            sellerProfile: this.sellerProfile,
            socialLinks: this.socialLinks,
            isOnline: this.isOnline,
            lastSeen: this.lastSeen ? this.lastSeen.toISOString() : null,
            createdAt: this.createdAt.toISOString(),
            isPrivate: this.isPrivate,
            interests: this.interests
        };

        if (includeStats) {
            data.coins = this.coins;
            data.totalSales = this.totalSales;
        }

        return data;
    }

    /**
     * Get minimal user data (for lists)
     * @returns {Object} Minimal user data
     */
    getMinimalData() {
        return {
            uid: this.uid,
            displayName: this.displayName,
            photoURL: this.photoURL,
            isSeller: this.isSeller,
            isVerified: this.isVerified,
            followers: this.followers
        };
    }

    // ============================================
    // SOCIAL FEATURE METHODS
    // ============================================

    /**
     * Check if user follows another user
     * @param {string} userId - User ID to check
     * @returns {boolean} True if following
     */
    isFollowing(userId) {
        return this.followingList && this.followingList.includes(userId);
    }

    /**
     * Check if user is followed by another user
     * @param {string} userId - User ID to check
     * @returns {boolean} True if followed
     */
    isFollowedBy(userId) {
        return this.followersList && this.followersList.includes(userId);
    }

    /**
     * Follow a user
     * @param {string} userId - User ID to follow
     * @returns {User} Updated user (this)
     */
    follow(userId) {
        if (!this.followingList) this.followingList = [];
        if (!this.followingList.includes(userId)) {
            this.followingList.push(userId);
            this.following = (this.following || 0) + 1;
            this.updatedAt = new Date();
        }
        return this;
    }

    /**
     * Unfollow a user
     * @param {string} userId - User ID to unfollow
     * @returns {User} Updated user (this)
     */
    unfollow(userId) {
        if (this.followingList) {
            this.followingList = this.followingList.filter(id => id !== userId);
            this.following = Math.max(0, (this.following || 0) - 1);
            this.updatedAt = new Date();
        }
        return this;
    }

    /**
     * Add a follower
     * @param {string} userId - User ID who followed
     * @returns {User} Updated user (this)
     */
    addFollower(userId) {
        if (!this.followersList) this.followersList = [];
        if (!this.followersList.includes(userId)) {
            this.followersList.push(userId);
            this.followers = (this.followers || 0) + 1;
            this.updatedAt = new Date();
        }
        return this;
    }

    /**
     * Remove a follower
     * @param {string} userId - User ID who unfollowed
     * @returns {User} Updated user (this)
     */
    removeFollower(userId) {
        if (this.followersList) {
            this.followersList = this.followersList.filter(id => id !== userId);
            this.followers = Math.max(0, (this.followers || 0) - 1);
            this.updatedAt = new Date();
        }
        return this;
    }

    /**
     * Increment posts count
     * @param {number} amount - Amount to increment
     * @returns {User} Updated user (this)
     */
    incrementPosts(amount = 1) {
        this.totalPosts = (this.totalPosts || 0) + amount;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Decrement posts count
     * @param {number} amount - Amount to decrement
     * @returns {User} Updated user (this)
     */
    decrementPosts(amount = 1) {
        this.totalPosts = Math.max(0, (this.totalPosts || 0) - amount);
        this.updatedAt = new Date();
        return this;
    }

    // ============================================
    // AI CHAT METHODS
    // ============================================

    /**
     * Check if user has free AI questions available
     * @returns {boolean} True if available
     */
    hasFreeAIQuestions() {
        // Check if daily reset is needed
        const today = new Date();
        const resetDate = new Date(this.aiQuestionsResetDate || today);
        if (this.isDifferentDay(resetDate, today)) {
            this.aiQuestionsUsed = 0;
            this.aiQuestionsResetDate = today;
            this.aiAdShown = false;
            this.aiQuestionCountAfterAd = 0;
        }
        return (this.aiQuestionsUsed || 0) < this.aiQuestionsLimit;
    }

    /**
     * Use a free AI question
     * @returns {User} Updated user (this)
     */
    useAIQuestion() {
        if (this.hasFreeAIQuestions()) {
            this.aiQuestionsUsed = (this.aiQuestionsUsed || 0) + 1;
            this.aiQuestionsTotal = (this.aiQuestionsTotal || 0) + 1;
            this.updatedAt = new Date();
        }
        return this;
    }

    /**
     * Check if AI ad should be shown (after 5 questions)
     * @returns {boolean} True if ad should be shown
     */
    shouldShowAIAd() {
        // If already shown ad in this cycle, no
        if (this.aiAdShown) return false;
        
        // If questions used >= limit, show ad
        return (this.aiQuestionsUsed || 0) >= this.aiQuestionsLimit;
    }

    /**
     * Reset AI chat after ad
     * @returns {User} Updated user (this)
     */
    resetAIAfterAd() {
        this.aiAdShown = true;
        this.aiQuestionCountAfterAd = 0;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Use ad-free AI question (after watching ad)
     * @param {number} count - Number of questions
     * @returns {User} Updated user (this)
     */
    useAdFreeAIQuestions(count = 3) {
        this.aiQuestionCountAfterAd = (this.aiQuestionCountAfterAd || 0) + count;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Check if user has ad-free AI questions
     * @returns {boolean} True if available
     */
    hasAdFreeAIQuestions() {
        const remaining = this.aiQuestionsLimit - (this.aiQuestionCountAfterAd || 0);
        return remaining > 0;
    }

    /**
     * Get remaining AI questions
     * @returns {number} Remaining questions
     */
    getRemainingAIQuestions() {
        if (this.hasFreeAIQuestions()) {
            return this.aiQuestionsLimit - (this.aiQuestionsUsed || 0);
        }
        return 0;
    }

    /**
     * Get remaining ad-free AI questions
     * @returns {number} Remaining questions
     */
    getRemainingAdFreeAIQuestions() {
        return this.aiQuestionsLimit - (this.aiQuestionCountAfterAd || 0);
    }

    // ============================================
    // AD METHODS
    // ============================================

    /**
     * Check if user can watch rewarded ad
     * @returns {boolean} True if can watch
     */
    canWatchAd() {
        // Check daily limit
        if ((this.todayAdCount || 0) >= (this.maxDailyAds || 4)) {
            return false;
        }

        // Check cooldown (2 hours)
        if (this.lastAdWatch) {
            const now = new Date();
            const diffHours = (now - this.lastAdWatch) / (1000 * 60 * 60);
            if (diffHours < (this.adCooldownHours || 2)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Watch rewarded ad
     * @param {number} coinsEarned - Coins earned
     * @param {string} adType - Type of ad
     * @returns {User} Updated user (this)
     */
    watchAd(coinsEarned = 1, adType = 'rewarded') {
        if (!this.canWatchAd()) {
            throw new Error('Cannot watch ad at this time');
        }

        const now = new Date();
        this.lastAdWatch = now;
        this.lastAdWatchDate = now;
        this.todayAdCount = (this.todayAdCount || 0) + 1;
        this.coins = (this.coins || 0) + coinsEarned;
        this.coinsTotal = (this.coinsTotal || 0) + coinsEarned;

        this.adWatchHistory.push({
            timestamp: now.toISOString(),
            adType: adType,
            coinsEarned: coinsEarned,
            date: now.toISOString().split('T')[0]
        });

        this.updatedAt = now;
        return this;
    }

    /**
     * Use coins for a download
     * @param {number} coinsUsed - Coins to use
     * @returns {User} Updated user (this)
     */
    useCoins(coinsUsed = 1) {
        if ((this.coins || 0) < coinsUsed) {
            throw new Error('Not enough coins');
        }
        this.coins = (this.coins || 0) - coinsUsed;
        this.coinsSpent = (this.coinsSpent || 0) + coinsUsed;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Check if user can download for free (monthly free downloads)
     * @returns {boolean} True if can download for free
     */
    canDownloadFree() {
        // Check if monthly reset is needed
        const now = new Date();
        const resetDate = new Date(this.freeDownloadsResetDate || now);
        if (this.isDifferentMonth(resetDate, now)) {
            this.freeDownloadsUsed = 0;
            this.freeDownloadsResetDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        return (this.freeDownloadsUsed || 0) < (this.freeDownloadsLimit || 5);
    }

    /**
     * Use a free download
     * @returns {User} Updated user (this)
     */
    useFreeDownload() {
        if (this.canDownloadFree()) {
            this.freeDownloadsUsed = (this.freeDownloadsUsed || 0) + 1;
            this.updatedAt = new Date();
        }
        return this;
    }

    /**
     * Get today's ad count
     * @returns {number} Today's ad count
     */
    getTodayAdCount() {
        const today = new Date().toISOString().split('T')[0];
        return this.adWatchHistory.filter(h => h.date === today).length;
    }

    /**
     * Reset daily ad count
     * @returns {User} Updated user (this)
     */
    resetDailyAdCount() {
        this.todayAdCount = 0;
        this.updatedAt = new Date();
        return this;
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Check if two dates are different days
     * @param {Date} date1 - First date
     * @param {Date} date2 - Second date
     * @returns {boolean} True if different days
     */
    isDifferentDay(date1, date2) {
        return date1.getDate() !== date2.getDate() ||
               date1.getMonth() !== date2.getMonth() ||
               date1.getFullYear() !== date2.getFullYear();
    }

    /**
     * Check if two dates are different months
     * @param {Date} date1 - First date
     * @param {Date} date2 - Second date
     * @returns {boolean} True if different months
     */
    isDifferentMonth(date1, date2) {
        return date1.getMonth() !== date2.getMonth() ||
               date1.getFullYear() !== date2.getFullYear();
    }

    /**
     * Get formatted creation date
     * @param {string} locale - Locale for formatting
     * @param {Object} options - Date formatting options
     * @returns {string} Formatted date
     */
    getCreatedDate(locale = 'en-US', options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return this.createdAt.toLocaleDateString(locale, { ...defaultOptions, ...options });
    }

    /**
     * Get time ago (e.g., "5 minutes ago")
     * @param {string} locale - Locale for formatting
     * @returns {string} Time ago string
     */
    getTimeAgo(locale = 'en-US') {
        const now = new Date();
        const diff = now - this.lastActive;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (seconds < 60) {
            return 'Just now';
        } else if (minutes < 60) {
            return `${minutes}m ago`;
        } else if (hours < 24) {
            return `${hours}h ago`;
        } else if (days < 7) {
            return `${days}d ago`;
        } else if (weeks < 4) {
            return `${weeks}w ago`;
        } else if (months < 12) {
            return `${months}mo ago`;
        } else {
            return `${years}y ago`;
        }
    }

    /**
     * Check if user is active (online)
     * @returns {boolean} True if online
     */
    isActive() {
        return this.isOnline === true;
    }

    /**
     * Check if user is seller
     * @returns {boolean} True if seller
     */
    isSellerUser() {
        return this.isSeller === true;
    }

    /**
     * Check if user is admin
     * @returns {boolean} True if admin
     */
    isAdminUser() {
        return this.isAdmin === true;
    }

    /**
     * Check if user is verified
     * @returns {boolean} True if verified
     */
    isVerifiedUser() {
        return this.isVerified === true;
    }

    /**
     * Check if user is blocked
     * @returns {boolean} True if blocked
     */
    isBlockedUser() {
        return this.isBlocked === true;
    }

    /**
     * Get user profile completeness
     * @returns {number} Percentage of profile completeness
     */
    getProfileCompleteness() {
        let score = 0;
        if (this.displayName) score += 20;
        if (this.photoURL) score += 20;
        if (this.bio) score += 15;
        if (this.location) score += 10;
        if (this.socialLinks.instagram) score += 5;
        if (this.socialLinks.twitter) score += 5;
        if (this.socialLinks.youtube) score += 5;
        if (this.interests && this.interests.length > 0) score += 10;
        if (this.isSeller && this.sellerProfile?.shopName) score += 10;
        return Math.min(score, 100);
    }

    /**
     * Clone user object
     * @param {Object} options - Clone options
     * @param {boolean} options.keepId - Keep original ID
     * @param {boolean} options.keepTimestamps - Keep original timestamps
     * @returns {User} New User instance with same data
     */
    clone(options = {}) {
        const { keepId = false, keepTimestamps = false } = options;
        
        const data = this.toFirestore({ includePrivate: true, includeMetadata: true });
        
        if (!keepId) {
            delete data.uid;
            data.uid = this.generateId();
        }
        
        if (!keepTimestamps) {
            data.createdAt = new Date();
            data.updatedAt = new Date();
            data.lastActive = new Date();
        }
        
        return new User({ ...data, uid: data.uid });
    }

    // ============================================
    // COMPARISON METHODS
    // ============================================

    /**
     * Compare two users for equality
     * @param {User} other - Other user
     * @returns {boolean} True if same user
     */
    equals(other) {
        if (!other) return false;
        return this.uid === other.uid;
    }

    /**
     * Check if user has an interest
     * @param {string} interest - Interest to check
     * @returns {boolean} True if has interest
     */
    hasInterest(interest) {
        return this.interests && this.interests.includes(interest);
    }

    /**
     * Add an interest
     * @param {string} interest - Interest to add
     * @returns {User} Updated user (this)
     */
    addInterest(interest) {
        if (!this.interests) this.interests = [];
        if (!this.interests.includes(interest)) {
            this.interests.push(interest);
            this.updatedAt = new Date();
        }
        return this;
    }

    /**
     * Remove an interest
     * @param {string} interest - Interest to remove
     * @returns {User} Updated user (this)
     */
    removeInterest(interest) {
        if (this.interests) {
            this.interests = this.interests.filter(i => i !== interest);
            this.updatedAt = new Date();
        }
        return this;
    }

    // ============================================
    // STRING REPRESENTATION
    // ============================================

    /**
     * Get string representation
     * @returns {string} String representation
     */
    toString() {
        return `User(${this.displayName}, ${this.email})`;
    }

    /**
     * Get display string for UI
     * @param {Object} options - Display options
     * @param {string} options.format - Display format
     * @returns {string} Display string
     */
    toDisplayString(options = {}) {
        const { format = 'name_badge' } = options;
        
        switch (format) {
            case 'name_badge':
                return this.isSeller ? `${this.displayName} 🛒` : this.displayName;
            case 'name_verified':
                return this.isVerified ? `${this.displayName} ✅` : this.displayName;
            case 'full':
                return `${this.displayName} (${this.email})`;
            default:
                return this.displayName;
        }
    }

    // ============================================
    // STATIC FACTORY METHODS
    // ============================================

    /**
     * Create User from Firestore data
     * @param {Object} data - Firestore document data
     * @param {string} id - Document ID
     * @returns {User} User instance
     */
    static fromFirestore(data, id) {
        const userData = { ...data, uid: id || data.uid };
        return new User(userData);
    }

    /**
     * Create a new user from form data
     * @param {Object} formData - Form data
     * @returns {User} User instance
     */
    static fromForm(formData) {
        return new User({
            email: formData.email,
            displayName: formData.displayName || formData.name,
            photoURL: formData.photoURL || formData.avatar,
            bio: formData.bio || '',
            location: formData.location || '',
            isSeller: formData.isSeller || false,
            preferences: {
                darkMode: formData.darkMode || false,
                language: formData.language || 'en',
                notifications: formData.notifications !== undefined ? formData.notifications : true
            },
            interests: formData.interests || [],
            socialLinks: {
                instagram: formData.instagram || '',
                twitter: formData.twitter || '',
                youtube: formData.youtube || ''
            }
        });
    }

    /**
     * Create a guest/anonymous user
     * @param {string} displayName - Display name
     * @returns {User} Guest user instance
     */
    static createGuest(displayName = 'Guest') {
        return new User({
            displayName: displayName,
            isVerified: false,
            isSeller: false,
            isAdmin: false,
            preferences: {
                darkMode: false,
                language: 'en',
                notifications: true
            }
        });
    }

    /**
     * Create a seller user template
     * @param {string} email - Email
     * @param {string} displayName - Display name
     * @param {Object} sellerData - Seller profile data
     * @returns {User} Seller user instance
     */
    static createSeller(email, displayName, sellerData = {}) {
        return new User({
            email: email,
            displayName: displayName,
            isSeller: true,
            sellerProfile: {
                shopName: sellerData.shopName || `${displayName}'s Shop`,
                shopDescription: sellerData.shopDescription || '',
                bio: sellerData.bio || '',
                joinedDate: new Date(),
                badges: ['new_seller'],
                ...sellerData
            }
        });
    }

    /**
     * Create an admin user
     * @param {string} email - Email
     * @param {string} displayName - Display name
     * @returns {User} Admin user instance
     */
    static createAdmin(email, displayName) {
        return new User({
            email: email,
            displayName: displayName,
            isAdmin: true,
            isVerified: true,
            isSeller: true,
            sellerProfile: {
                shopName: 'ZYMORE Admin',
                badges: ['admin', 'verified_seller']
            }
        });
    }

    // ============================================
    // STATIC HELPERS
    // ============================================

    /**
     * Check if data is a valid user object
     * @param {Object} data - Data to check
     * @returns {boolean} True if valid user data
     */
    static isValidUserData(data) {
        return data && typeof data === 'object' &&
               data.email && data.email.trim() !== '' &&
               data.displayName && data.displayName.trim() !== '';
    }

    /**
     * Create an array of users from Firestore data
     * @param {Array} dataArray - Array of Firestore documents
     * @returns {Array<User>} Array of User instances
     */
    static fromFirestoreArray(dataArray) {
        if (!Array.isArray(dataArray)) return [];
        return dataArray.map(data => User.fromFirestore(data, data.uid || data.id));
    }

    /**
     * Sort users by followers count
     * @param {Array<User>} users - Users array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<User>} Sorted users
     */
    static sortByFollowers(users, order = 'desc') {
        const sorted = [...users];
        sorted.sort((a, b) => {
            return order === 'asc' ? a.followers - b.followers : b.followers - a.followers;
        });
        return sorted;
    }

    /**
     * Sort users by posts count
     * @param {Array<User>} users - Users array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<User>} Sorted users
     */
    static sortByPosts(users, order = 'desc') {
        const sorted = [...users];
        sorted.sort((a, b) => {
            return order === 'asc' ? a.totalPosts - b.totalPosts : b.totalPosts - a.totalPosts;
        });
        return sorted;
    }

    /**
     * Sort users by coins
     * @param {Array<User>} users - Users array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<User>} Sorted users
     */
    static sortByCoins(users, order = 'desc') {
        const sorted = [...users];
        sorted.sort((a, b) => {
            return order === 'asc' ? a.coins - b.coins : b.coins - a.coins;
        });
        return sorted;
    }

    /**
     * Filter users by seller status
     * @param {Array<User>} users - Users array
     * @param {boolean} isSeller - Seller status
     * @returns {Array<User>} Filtered users
     */
    static filterBySeller(users, isSeller = true) {
        return users.filter(u => u.isSeller === isSeller);
    }

    /**
     * Filter users by admin status
     * @param {Array<User>} users - Users array
     * @param {boolean} isAdmin - Admin status
     * @returns {Array<User>} Filtered users
     */
    static filterByAdmin(users, isAdmin = true) {
        return users.filter(u => u.isAdmin === isAdmin);
    }

    /**
     * Filter users by verified status
     * @param {Array<User>} users - Users array
     * @param {boolean} isVerified - Verified status
     * @returns {Array<User>} Filtered users
     */
    static filterByVerified(users, isVerified = true) {
        return users.filter(u => u.isVerified === isVerified);
    }

    /**
     * Filter users by active status (online)
     * @param {Array<User>} users - Users array
     * @param {boolean} isOnline - Online status
     * @returns {Array<User>} Filtered users
     */
    static filterByOnline(users, isOnline = true) {
        return users.filter(u => u.isOnline === isOnline);
    }

    /**
     * Get active users (online in last 5 minutes)
     * @param {Array<User>} users - Users array
     * @param {number} minutes - Minutes threshold
     * @returns {Array<User>} Active users
     */
    static getActiveUsers(users, minutes = 5) {
        const threshold = new Date(Date.now() - minutes * 60 * 1000);
        return users.filter(u => u.lastActive && u.lastActive > threshold);
    }

    /**
     * Get top users by followers
     * @param {Array<User>} users - Users array
     * @param {number} limit - Number of users to return
     * @returns {Array<User>} Top users
     */
    static getTopByFollowers(users, limit = 10) {
        return User.sortByFollowers(users, 'desc').slice(0, limit);
    }

    /**
     * Get top users by posts
     * @param {Array<User>} users - Users array
     * @param {number} limit - Number of users to return
     * @returns {Array<User>} Top users
     */
    static getTopByPosts(users, limit = 10) {
        return User.sortByPosts(users, 'desc').slice(0, limit);
    }

    /**
     * Get top users by coins
     * @param {Array<User>} users - Users array
     * @param {number} limit - Number of users to return
     * @returns {Array<User>} Top users
     */
    static getTopByCoins(users, limit = 10) {
        return User.sortByCoins(users, 'desc').slice(0, limit);
    }

    /**
     * Get user by email
     * @param {Array<User>} users - Users array
     * @param {string} email - Email to find
     * @returns {User|null} User or null
     */
    static getByEmail(users, email) {
        return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }

    /**
     * Get user by display name
     * @param {Array<User>} users - Users array
     * @param {string} name - Display name to find
     * @returns {User|null} User or null
     */
    static getByName(users, name) {
        return users.find(u => u.displayName.toLowerCase() === name.toLowerCase()) || null;
    }

    /**
     * Search users by name
     * @param {Array<User>} users - Users array
     * @param {string} query - Search query
     * @returns {Array<User>} Matched users
     */
    static search(users, query) {
        const lowerQuery = query.toLowerCase();
        return users.filter(u => 
            u.displayName.toLowerCase().includes(lowerQuery) ||
            u.email.toLowerCase().includes(lowerQuery) ||
            (u.bio && u.bio.toLowerCase().includes(lowerQuery))
        );
    }
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default User;
export { User as UserModel };

// ============================================================
// HELPER FUNCTIONS FOR AUTH SERVICE
// ============================================================

/**
 * Firebase डेटा से User ऑब्जेक्ट बनाएं
 * @param {Object} firebaseUser - Firebase auth user object
 * @returns {User} User instance
 */
export function createUserFromFirebase(firebaseUser) {
    return new User({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
        isVerified: firebaseUser.emailVerified || false,
        createdAt: new Date(),
        lastLogin: new Date(),
        isOnline: true
    });
}

/**
 * User ऑब्जेक्ट को Firestore में भेजने लायक फॉर्मेट में बदलें
 * @param {User|Object} user - User instance or object
 * @returns {Object} Plain object for Firestore
 */
export function userToFirestore(user) {
    if (user instanceof User) {
        return user.toFirestore({ includePrivate: true });
    }
    return user;
}



/**
 * Create a new User instance (Helper for ModelFactory)
 * @param {Object} data - User data
 * @returns {User} User instance
 */
export function createUser(data) {
    return new User(data);
}

/**
 * Validate user data (Helper for ModelFactory)
 * @param {Object} data - User data
 * @returns {Object} Validation result
 */
export function validateUser(data) {
    const user = data instanceof User ? data : new User(data);
    return user.validate();
}

/**
 * Convert Firestore document to User instance
 * @param {Object} doc - Firestore document data
 * @returns {User} User instance
 */
export function firestoreToUser(doc) {
    if (!doc) return null;
    const data = typeof doc.data === 'function' ? doc.data() : doc;
    const id = typeof doc.id === 'string' ? doc.id : data.uid;
    return User.fromFirestore(data, id);
}

// ============================================================
// END OF FILE: user-model.js
// ============================================================