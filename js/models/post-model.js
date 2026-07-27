// Post Model
// ============================================================
// FILE: post-model.js
// PURPOSE: Social Post data structure for ZYMORE v3.0
// VERSION: 3.0.0 (Production Ready)
// DEPENDENCY: NONE
// USED BY: social-service.js, social-feed.js, post-card.js, profile-screen.js
// LOCATION: js/models/post-model.js
// ============================================================

// ============================================================
// POST CLASS - ZYMORE v3.0 SOCIAL FEATURE
// ============================================================

/**
 * Post Model Class
 * Represents a social post in the ZYMORE Hybrid Platform
 * 
 * ZYMORE v3.0 Features:
 * - Text, Image, Video, Mixed Posts
 * - 7 Reactions (Like, Love, Wow, Sad, Angry, Laugh, Celebrate)
 * - Comments & Replies
 * - Shares & Saves
 * - Category & Tags
 * - Location Support
 * - Product Linking
 * - Public/Private
 * - Feed Algorithm Scores
 * - Analytics Tracking
 * - Report System
 */
export class Post {
    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * Create a new Post instance
     * @param {Object} data - Post data
     * @param {string} data.id - Post ID
     * @param {string} data.userId - User ID
     * @param {string} data.userName - User name
     * @param {string} data.userPhoto - User photo URL
     * @param {string} data.content - Post content/text
     * @param {Array<string>} data.images - Image URLs
     * @param {string} data.video - Video URL
     * @param {string} data.type - Post type (text, image, video, mixed)
     * @param {string} data.category - Category
     * @param {Array<string>} data.tags - Tags
     * @param {string} data.location - Location
     * @param {number} data.likes - Like count
     * @param {number} data.comments - Comment count
     * @param {number} data.shares - Share count
     * @param {number} data.saves - Save count
     * @param {Object} data.reactions - Reaction counts
     * @param {boolean} data.isPublic - Public status
     * @param {boolean} data.isProduct - Is product post
     * @param {string} data.productId - Product ID
     * @param {Date|string} data.createdAt - Creation date
     * @param {Date|string} data.updatedAt - Update date
     * @param {Object} data.metadata - Additional metadata
     * @param {Object} data.algorithm - Feed algorithm scores
     * @param {number} data.followScore - Follow score
     * @param {number} data.interestScore - Interest score
     * @param {number} data.engagementScore - Engagement score
     * @param {number} data.timeScore - Time score
     * @param {number} data.finalScore - Final algorithm score
     * @param {Object} data.analytics - Analytics data
     * @param {Array<Object>} data.recentComments - Recent comments
     * @param {Array<Object>} data.recentReactions - Recent reactions
     * @param {boolean} data.isReported - Reported flag
     * @param {number} data.reportCount - Report count
     * @param {boolean} data.isBlocked - Blocked flag
     * @param {boolean} data.isDeleted - Deleted flag
     * @param {boolean} data.isPinned - Pinned flag
     * @param {boolean} data.isHighlighted - Highlighted flag
     * @param {string} data.sharedFrom - Shared from post ID
     * @param {Object} data.originalPost - Original post data (for shares)
     */
    constructor(data = {}) {
        // ============================================
        // 📌 BASIC INFORMATION
        // ============================================
        this.id = data.id || data.postId || this.generateId();
        this.userId = data.userId || '';
        this.userName = data.userName || '';
        this.userPhoto = data.userPhoto || '';
        this.content = data.content || '';
        this.images = Array.isArray(data.images) ? [...data.images] : [];
        this.video = data.video || '';
        this.type = data.type || this.detectType(data);
        this.category = data.category || '';
        this.tags = Array.isArray(data.tags) ? [...data.tags] : [];
        this.location = data.location || '';
        this.placeId = data.placeId || '';
        this.coordinates = data.coordinates || { lat: 0, lng: 0 };

        // ============================================
        // 📊 STATS
        // ============================================
        this.likes = data.likes || 0;
        this.comments = data.comments || 0;
        this.shares = data.shares || 0;
        this.saves = data.saves || 0;
        this.views = data.views || 0;
        this.reactions = {
            like: data.reactions?.like || 0,
            love: data.reactions?.love || 0,
            wow: data.reactions?.wow || 0,
            sad: data.reactions?.sad || 0,
            angry: data.reactions?.angry || 0,
            laugh: data.reactions?.laugh || 0,
            celebrate: data.reactions?.celebrate || 0,
            ...data.reactions
        };

        // ============================================
        // 🏷️ STATUS FLAGS
        // ============================================
        this.isPublic = data.isPublic !== undefined ? data.isPublic : true;
        this.isProduct = data.isProduct || false;
        this.productId = data.productId || '';
        this.isReported = data.isReported || false;
        this.reportCount = data.reportCount || 0;
        this.isBlocked = data.isBlocked || false;
        this.isDeleted = data.isDeleted || false;
        this.isPinned = data.isPinned || false;
        this.isHighlighted = data.isHighlighted || false;
        this.isVerified = data.isVerified || false;
        this.isSponsored = data.isSponsored || false;
        this.isAdult = data.isAdult || false;
        this.isSensitive = data.isSensitive || false;

        // ============================================
        // 🔗 SHARING
        // ============================================
        this.sharedFrom = data.sharedFrom || '';
        this.originalPost = data.originalPost || null;
        this.isShare = data.isShare || false;

        // ============================================
        // ⏰ TIMESTAMPS
        // ============================================
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
        this.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
        this.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
        this.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;

        // ============================================
        // 📊 FEED ALGORITHM SCORES
        // ============================================
        this.followScore = data.followScore || 0;
        this.interestScore = data.interestScore || 0;
        this.engagementScore = data.engagementScore || 0;
        this.timeScore = data.timeScore || 0;
        this.finalScore = data.finalScore || 0;
        this.algorithm = data.algorithm || {
            followScore: 0,
            interestScore: 0,
            engagementScore: 0,
            timeScore: 0,
            finalScore: 0
        };

        // ============================================
        // 📈 ANALYTICS
        // ============================================
        this.analytics = {
            totalViews: data.analytics?.totalViews || 0,
            totalLikes: data.analytics?.totalLikes || 0,
            totalComments: data.analytics?.totalComments || 0,
            totalShares: data.analytics?.totalShares || 0,
            totalSaves: data.analytics?.totalSaves || 0,
            uniqueViewers: data.analytics?.uniqueViewers || 0,
            engagementRate: data.analytics?.engagementRate || 0,
            averageTimeSpent: data.analytics?.averageTimeSpent || 0,
            dailyViews: data.analytics?.dailyViews || {},
            dailyLikes: data.analytics?.dailyLikes || {},
            dailyComments: data.analytics?.dailyComments || {},
            locationStats: data.analytics?.locationStats || {},
            deviceStats: data.analytics?.deviceStats || { mobile: 0, desktop: 0, tablet: 0 },
            referrerStats: data.analytics?.referrerStats || {},
            ...data.analytics
        };

        // ============================================
        // 💬 COMMENTS & REACTIONS (Recent)
        // ============================================
        this.recentComments = Array.isArray(data.recentComments) ? [...data.recentComments] : [];
        this.recentReactions = Array.isArray(data.recentReactions) ? [...data.recentReactions] : [];
        this.topCommenters = data.topCommenters || [];

        // ============================================
        // 📎 ATTACHMENTS & MEDIA
        // ============================================
        this.attachments = Array.isArray(data.attachments) ? [...data.attachments] : [];
        this.thumbnail = data.thumbnail || (this.images && this.images[0]) || '';
        this.coverImage = data.coverImage || this.thumbnail;
        this.altText = data.altText || '';
        this.caption = data.caption || '';

        // ============================================
        // 🎯 TARGET AUDIENCE
        // ============================================
        this.targetAudience = data.targetAudience || 'all';
        this.audience = data.audience || 'everyone';
        this.visibility = data.visibility || 'public';

        // ============================================
        // 🔍 SEO & META
        // ============================================
        this.metaTitle = data.metaTitle || '';
        this.metaDescription = data.metaDescription || '';
        this.metaImage = data.metaImage || this.thumbnail;
        this.ogTitle = data.ogTitle || '';
        this.ogDescription = data.ogDescription || '';
        this.ogImage = data.ogImage || this.thumbnail;

        // ============================================
        // 📝 METADATA
        // ============================================
        this.metadata = data.metadata || {};
        this.customFields = data.customFields || {};
        this.notes = data.notes || '';
        this.internalNotes = data.internalNotes || '';

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
     * Generate a unique post ID
     * @returns {string} Unique ID
     */
    generateId() {
        return `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Detect post type from data
     * @param {Object} data - Post data
     * @returns {string} Post type
     */
    detectType(data) {
        if (data.video) return 'video';
        if (data.images && data.images.length > 0) return data.images.length === 1 ? 'image' : 'mixed';
        if (data.content && data.content.trim() !== '') return 'text';
        return 'text';
    }

    // ============================================
    // VALIDATION
    // ============================================

    /**
     * Validate post data
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

        if (!this.content && (!this.images || this.images.length === 0) && !this.video) {
            errors.push('Post must have content, image, or video');
        }

        if (this.content && this.content.length > 5000) {
            warnings.push('Content exceeds 5000 characters - consider shortening');
        }

        // === TYPE VALIDATION ===
        const validTypes = ['text', 'image', 'video', 'mixed', 'poll', 'event'];
        if (this.type && !validTypes.includes(this.type)) {
            warnings.push(`Uncommon post type: ${this.type}`);
        }

        // === IMAGES ===
        if (this.images && this.images.length > 10) {
            warnings.push('More than 10 images - consider reducing');
        }
        if (this.images && this.images.some(img => !img || img.trim() === '')) {
            errors.push('All image URLs must be valid');
        }

        // === VIDEO ===
        if (this.video && !this.isValidUrl(this.video)) {
            warnings.push('Invalid video URL format');
        }

        // === TAGS ===
        if (this.tags && this.tags.length > 20) {
            warnings.push('Maximum 20 tags recommended');
        }
        if (this.tags && this.tags.some(t => !t || t.trim() === '')) {
            errors.push('Tags cannot be empty');
        }

        // === CATEGORY ===
        if (!this.category && strict) {
            warnings.push('Category is recommended');
        }

        // === LOCATION ===
        if (this.location && this.location.length > 100) {
            warnings.push('Location is too long (max 100 characters)');
        }

        // === URL VALIDATION ===
        if (this.video && !this.isValidUrl(this.video)) {
            warnings.push('Invalid video URL format');
        }

        // === SHARING ===
        if (this.isShare && !this.sharedFrom) {
            warnings.push('Shared post should have original post ID');
        }

        // === PRODUCT ===
        if (this.isProduct && !this.productId) {
            warnings.push('Product post should have product ID');
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
     * @param {boolean} options.includeAlgorithm - Include algorithm scores
     * @returns {Object} Firestore document
     */
    toFirestore(options = {}) {
        const { includeMetadata = true, includeAnalytics = true, includeAlgorithm = true } = options;

        const data = {
            userId: this.userId,
            userName: this.userName,
            userPhoto: this.userPhoto,
            content: this.content,
            images: [...this.images],
            video: this.video,
            type: this.type,
            category: this.category,
            tags: [...this.tags],
            location: this.location,
            placeId: this.placeId,
            coordinates: { ...this.coordinates },
            likes: this.likes,
            comments: this.comments,
            shares: this.shares,
            saves: this.saves,
            views: this.views,
            reactions: { ...this.reactions },
            isPublic: this.isPublic,
            isProduct: this.isProduct,
            productId: this.productId,
            isReported: this.isReported,
            reportCount: this.reportCount,
            isBlocked: this.isBlocked,
            isDeleted: this.isDeleted,
            isPinned: this.isPinned,
            isHighlighted: this.isHighlighted,
            isVerified: this.isVerified,
            isSponsored: this.isSponsored,
            isAdult: this.isAdult,
            isSensitive: this.isSensitive,
            sharedFrom: this.sharedFrom,
            isShare: this.isShare,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            scheduledAt: this.scheduledAt ? this.scheduledAt.toISOString() : null,
            expiresAt: this.expiresAt ? this.expiresAt.toISOString() : null,
            publishedAt: this.publishedAt ? this.publishedAt.toISOString() : null,
            thumbnail: this.thumbnail,
            coverImage: this.coverImage,
            altText: this.altText,
            caption: this.caption,
            targetAudience: this.targetAudience,
            visibility: this.visibility,
            metaTitle: this.metaTitle,
            metaDescription: this.metaDescription,
            metaImage: this.metaImage,
            ogTitle: this.ogTitle,
            ogDescription: this.ogDescription,
            ogImage: this.ogImage,
            customFields: this.customFields,
            notes: this.notes,
            internalNotes: this.internalNotes,
            lastSync: this.lastSync.toISOString(),
            syncVersion: this.syncVersion,
            appVersion: this.appVersion
        };

        if (includeMetadata) {
            data.metadata = this.metadata;
        }

        if (includeAnalytics) {
            data.analytics = { ...this.analytics };
            data.recentComments = [...this.recentComments];
            data.recentReactions = [...this.recentReactions];
            data.topCommenters = [...this.topCommenters];
        }

        if (includeAlgorithm) {
            data.followScore = this.followScore;
            data.interestScore = this.interestScore;
            data.engagementScore = this.engagementScore;
            data.timeScore = this.timeScore;
            data.finalScore = this.finalScore;
            data.algorithm = { ...this.algorithm };
        }

        if (this.originalPost) {
            data.originalPost = this.originalPost;
        }

        if (this.attachments && this.attachments.length > 0) {
            data.attachments = [...this.attachments];
        }

        return data;
    }

    /**
     * Convert to JSON
     * @param {Object} options - Conversion options
     * @param {boolean} options.includePrivate - Include private fields
     * @param {boolean} options.includeMetadata - Include metadata
     * @param {boolean} options.includeAnalytics - Include analytics
     * @param {boolean} options.includeAlgorithm - Include algorithm scores
     * @returns {Object} JSON object
     */
    toJSON(options = {}) {
        const { includePrivate = false, includeMetadata = false, includeAnalytics = false, includeAlgorithm = false } = options;

        const data = {
            id: this.id,
            userId: this.userId,
            userName: this.userName,
            userPhoto: this.userPhoto,
            content: this.content,
            images: [...this.images],
            video: this.video,
            type: this.type,
            category: this.category,
            tags: [...this.tags],
            location: this.location,
            likes: this.likes,
            comments: this.comments,
            shares: this.shares,
            saves: this.saves,
            views: this.views,
            reactions: { ...this.reactions },
            isPublic: this.isPublic,
            isProduct: this.isProduct,
            productId: this.productId,
            isReported: this.isReported,
            isBlocked: this.isBlocked,
            isDeleted: this.isDeleted,
            isPinned: this.isPinned,
            isHighlighted: this.isHighlighted,
            isVerified: this.isVerified,
            isSponsored: this.isSponsored,
            isShare: this.isShare,
            sharedFrom: this.sharedFrom,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            publishedAt: this.publishedAt ? this.publishedAt.toISOString() : null,
            thumbnail: this.thumbnail,
            coverImage: this.coverImage,
            altText: this.altText,
            caption: this.caption,
            targetAudience: this.targetAudience,
            visibility: this.visibility,
            metaTitle: this.metaTitle,
            metaDescription: this.metaDescription,
            metaImage: this.metaImage,
            ogTitle: this.ogTitle,
            ogDescription: this.ogDescription,
            ogImage: this.ogImage
        };

        if (includePrivate) {
            data.placeId = this.placeId;
            data.coordinates = { ...this.coordinates };
            data.reportCount = this.reportCount;
            data.isAdult = this.isAdult;
            data.isSensitive = this.isSensitive;
            data.scheduledAt = this.scheduledAt ? this.scheduledAt.toISOString() : null;
            data.expiresAt = this.expiresAt ? this.expiresAt.toISOString() : null;
            data.notes = this.notes;
            data.internalNotes = this.internalNotes;
            data.customFields = this.customFields;
        }

        if (includeMetadata) {
            data.metadata = this.metadata;
        }

        if (includeAnalytics) {
            data.analytics = { ...this.analytics };
            data.recentComments = [...this.recentComments];
            data.recentReactions = [...this.recentReactions];
            data.topCommenters = [...this.topCommenters];
        }

        if (includeAlgorithm) {
            data.followScore = this.followScore;
            data.interestScore = this.interestScore;
            data.engagementScore = this.engagementScore;
            data.timeScore = this.timeScore;
            data.finalScore = this.finalScore;
            data.algorithm = { ...this.algorithm };
        }

        if (this.originalPost) {
            data.originalPost = this.originalPost;
        }

        if (this.attachments && this.attachments.length > 0) {
            data.attachments = [...this.attachments];
        }

        return data;
    }

    /**
     * Get public post data
     * @param {Object} options - Options
     * @param {boolean} options.includeStats - Include statistics
     * @param {boolean} options.includeUser - Include user info
     * @param {boolean} options.includeReactions - Include reactions
     * @returns {Object} Public post data
     */
    getPublicData(options = {}) {
        const { includeStats = true, includeUser = true, includeReactions = true } = options;

        const data = {
            id: this.id,
            content: this.content,
            images: [...this.images],
            video: this.video,
            type: this.type,
            category: this.category,
            tags: [...this.tags],
            location: this.location,
            isPublic: this.isPublic,
            isProduct: this.isProduct,
            productId: this.productId,
            isPinned: this.isPinned,
            isHighlighted: this.isHighlighted,
            isVerified: this.isVerified,
            isSponsored: this.isSponsored,
            isShare: this.isShare,
            sharedFrom: this.sharedFrom,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            publishedAt: this.publishedAt ? this.publishedAt.toISOString() : null,
            thumbnail: this.thumbnail,
            coverImage: this.coverImage,
            altText: this.altText,
            caption: this.caption
        };

        if (includeUser) {
            data.userId = this.userId;
            data.userName = this.userName;
            data.userPhoto = this.userPhoto;
        }

        if (includeStats) {
            data.likes = this.likes;
            data.comments = this.comments;
            data.shares = this.shares;
            data.saves = this.saves;
            data.views = this.views;
        }

        if (includeReactions) {
            data.reactions = { ...this.reactions };
        }

        if (this.originalPost) {
            data.originalPost = this.originalPost;
        }

        return data;
    }

    /**
     * Get minimal post data (for lists)
     * @param {Object} options - Options
     * @param {boolean} options.includeUser - Include user info
     * @returns {Object} Minimal post data
     */
    getMinimalData(options = {}) {
        const { includeUser = true } = options;

        const data = {
            id: this.id,
            content: this.content.substring(0, 100) + (this.content.length > 100 ? '...' : ''),
            thumbnail: this.thumbnail || (this.images && this.images[0]) || '',
            type: this.type,
            likes: this.likes,
            comments: this.comments,
            shares: this.shares,
            createdAt: this.createdAt.toISOString(),
            timeAgo: this.getTimeAgo(),
            isPinned: this.isPinned,
            isVerified: this.isVerified,
            isSponsored: this.isSponsored,
            isProduct: this.isProduct
        };

        if (includeUser) {
            data.userId = this.userId;
            data.userName = this.userName;
            data.userPhoto = this.userPhoto;
        }

        return data;
    }

    // ============================================
    // REACTION METHODS
    // ============================================

    /**
     * Add a reaction
     * @param {string} reaction - Reaction type
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Post} Updated post (this)
     */
    addReaction(reaction, userId, options = {}) {
        const { emitEvent = true } = options;
        const validReactions = ['like', 'love', 'wow', 'sad', 'angry', 'laugh', 'celebrate'];
        
        if (validReactions.includes(reaction)) {
            this.reactions[reaction] = (this.reactions[reaction] || 0) + 1;
            if (reaction === 'like') {
                this.likes = (this.likes || 0) + 1;
            }
            this.updatedAt = new Date();
            
            if (emitEvent && typeof EventBus !== 'undefined') {
                EventBus.emit('post:reaction', { postId: this.id, userId, reaction, action: 'add' });
            }
        }
        return this;
    }

    /**
     * Remove a reaction
     * @param {string} reaction - Reaction type
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Post} Updated post (this)
     */
    removeReaction(reaction, userId, options = {}) {
        const { emitEvent = true } = options;
        const validReactions = ['like', 'love', 'wow', 'sad', 'angry', 'laugh', 'celebrate'];
        
        if (validReactions.includes(reaction) && (this.reactions[reaction] || 0) > 0) {
            this.reactions[reaction] = Math.max(0, (this.reactions[reaction] || 0) - 1);
            if (reaction === 'like') {
                this.likes = Math.max(0, (this.likes || 0) - 1);
            }
            this.updatedAt = new Date();
            
            if (emitEvent && typeof EventBus !== 'undefined') {
                EventBus.emit('post:reaction', { postId: this.id, userId, reaction, action: 'remove' });
            }
        }
        return this;
    }

    /**
     * Get total reactions count
     * @returns {number} Total reactions
     */
    getTotalReactions() {
        return Object.values(this.reactions).reduce((sum, val) => sum + (val || 0), 0);
    }

    /**
     * Get most popular reaction
     * @returns {Object} { type, count }
     */
    getMostPopularReaction() {
        let maxType = 'like';
        let maxCount = 0;
        for (const [type, count] of Object.entries(this.reactions)) {
            if (count > maxCount) {
                maxCount = count;
                maxType = type;
            }
        }
        return { type: maxType, count: maxCount };
    }

    // ============================================
    // COMMENT METHODS
    // ============================================

    /**
     * Increment comment count
     * @param {number} amount - Amount to increment
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Post} Updated post (this)
     */
    incrementComments(amount = 1, options = {}) {
        const { emitEvent = true } = options;
        this.comments = (this.comments || 0) + amount;
        this.updatedAt = new Date();
        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('post:comment', { postId: this.id, count: this.comments });
        }
        return this;
    }

    /**
     * Add recent comment
     * @param {Object} comment - Comment data
     * @param {number} maxComments - Max recent comments to keep
     * @returns {Post} Updated post (this)
     */
    addRecentComment(comment, maxComments = 5) {
        this.recentComments.unshift(comment);
        if (this.recentComments.length > maxComments) {
            this.recentComments = this.recentComments.slice(0, maxComments);
        }
        this.updatedAt = new Date();
        return this;
    }

    // ============================================
    // SHARE & SAVE METHODS
    // ============================================

    /**
     * Increment shares count
     * @param {number} amount - Amount to increment
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Post} Updated post (this)
     */
    incrementShares(amount = 1, options = {}) {
        const { emitEvent = true } = options;
        this.shares = (this.shares || 0) + amount;
        this.updatedAt = new Date();
        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('post:share', { postId: this.id, count: this.shares });
        }
        return this;
    }

    /**
     * Increment saves count
     * @param {number} amount - Amount to increment
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Post} Updated post (this)
     */
    incrementSaves(amount = 1, options = {}) {
        const { emitEvent = true } = options;
        this.saves = (this.saves || 0) + amount;
        this.updatedAt = new Date();
        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('post:save', { postId: this.id, count: this.saves });
        }
        return this;
    }

    /**
     * Increment views count
     * @param {number} amount - Amount to increment
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @param {string} options.device - Device type
     * @param {string} options.location - Location
     * @returns {Post} Updated post (this)
     */
    incrementViews(amount = 1, options = {}) {
        const { emitEvent = true, device = '', location = '' } = options;
        this.views = (this.views || 0) + amount;
        this.analytics.totalViews = (this.analytics.totalViews || 0) + amount;
        
        const date = new Date().toISOString().split('T')[0];
        this.analytics.dailyViews[date] = (this.analytics.dailyViews[date] || 0) + amount;
        
        if (device && this.analytics.deviceStats[device] !== undefined) {
            this.analytics.deviceStats[device] = (this.analytics.deviceStats[device] || 0) + amount;
        }
        
        if (location) {
            this.analytics.locationStats[location] = (this.analytics.locationStats[location] || 0) + amount;
        }
        
        this.updatedAt = new Date();
        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('post:view', { postId: this.id, count: this.views });
        }
        return this;
    }

    // ============================================
    // FEED ALGORITHM METHODS
    // ============================================

    /**
     * Calculate feed algorithm scores
     * @param {Object} context - Context for calculation
     * @param {Array<string>} context.userInterests - User interests
     * @param {Array<string>} context.following - Following users
     * @param {Array<string>} context.engagementHistory - Engagement history
     * @param {number} context.timeWeight - Time weight
     * @returns {Object} Algorithm scores
     */
    calculateScores(context = {}) {
        const { userInterests = [], following = [], engagementHistory = [], timeWeight = 1 } = context;

        // Follow Score (40% weight)
        let followScore = 0;
        if (following.includes(this.userId)) {
            followScore = 100;
        }

        // Interest Score (30% weight)
        let interestScore = 0;
        if (userInterests.length > 0) {
            const matchingInterests = this.tags.filter(tag => 
                userInterests.some(interest => 
                    interest.toLowerCase() === tag.toLowerCase() ||
                    interest.toLowerCase().includes(tag.toLowerCase()) ||
                    tag.toLowerCase().includes(interest.toLowerCase())
                )
            );
            interestScore = Math.min(100, (matchingInterests.length / Math.max(1, this.tags.length)) * 100);
        }

        // Engagement Score (20% weight)
        let engagementScore = 0;
        if (engagementHistory.length > 0) {
            const postEngagement = (this.likes || 0) + (this.comments || 0) + (this.shares || 0);
            const avgEngagement = engagementHistory.reduce((sum, e) => sum + e, 0) / Math.max(1, engagementHistory.length);
            engagementScore = Math.min(100, (postEngagement / Math.max(1, avgEngagement)) * 50);
        }

        // Time Score (10% weight)
        const now = new Date();
        const hoursSince = (now - this.createdAt) / (1000 * 60 * 60);
        let timeScore = 100;
        if (hoursSince > 24) {
            timeScore = Math.max(0, 100 - ((hoursSince - 24) / 24) * 50);
        }

        // Final Score
        const finalScore = (followScore * 0.4) + (interestScore * 0.3) + (engagementScore * 0.2) + (timeScore * 0.1);

        this.followScore = followScore;
        this.interestScore = interestScore;
        this.engagementScore = engagementScore;
        this.timeScore = timeScore;
        this.finalScore = finalScore;
        this.algorithm = { followScore, interestScore, engagementScore, timeScore, finalScore };

        return this.algorithm;
    }

    /**
     * Check if post matches user interests
     * @param {Array<string>} interests - User interests
     * @param {number} threshold - Match threshold (0-100)
     * @returns {boolean} True if matches
     */
    matchesInterests(interests, threshold = 50) {
        if (!interests || interests.length === 0) return true;
        if (!this.tags || this.tags.length === 0) return false;

        let matchCount = 0;
        for (const tag of this.tags) {
            if (interests.some(interest => 
                interest.toLowerCase() === tag.toLowerCase() ||
                interest.toLowerCase().includes(tag.toLowerCase()) ||
                tag.toLowerCase().includes(interest.toLowerCase())
            )) {
                matchCount++;
            }
        }

        const matchPercentage = (matchCount / Math.max(1, this.tags.length)) * 100;
        return matchPercentage >= threshold;
    }

    // ============================================
    // STATUS METHODS
    // ============================================

    /** @returns {boolean} Check if post is public */
    isPublicPost() { return this.isPublic === true && !this.isDeleted && !this.isBlocked; }

    /** @returns {boolean} Check if post is verified */
    isVerifiedPost() { return this.isVerified === true; }

    /** @returns {boolean} Check if post is sponsored */
    isSponsoredPost() { return this.isSponsored === true; }

    /** @returns {boolean} Check if post is pinned */
    isPinnedPost() { return this.isPinned === true; }

    /** @returns {boolean} Check if post is highlighted */
    isHighlightedPost() { return this.isHighlighted === true; }

    /** @returns {boolean} Check if post is product post */
    isProductPost() { return this.isProduct === true && this.productId !== ''; }

    /** @returns {boolean} Check if post is share */
    isSharePost() { return this.isShare === true && this.sharedFrom !== ''; }

    /** @returns {boolean} Check if post has images */
    hasImages() { return this.images && this.images.length > 0; }

    /** @returns {boolean} Check if post has video */
    hasVideo() { return this.video && this.video.trim() !== ''; }

    /** @returns {boolean} Check if post has location */
    hasLocation() { return this.location && this.location.trim() !== ''; }

    /** @returns {boolean} Check if post has tags */
    hasTags() { return this.tags && this.tags.length > 0; }

    /** @returns {boolean} Check if post is deleted */
    isDeletedPost() { return this.isDeleted === true; }

    /** @returns {boolean} Check if post is blocked */
    isBlockedPost() { return this.isBlocked === true; }

    /** @returns {boolean} Check if post is reported */
    isReportedPost() { return this.isReported === true; }

    /** @returns {boolean} Check if post is adult content */
    isAdultPost() { return this.isAdult === true; }

    /** @returns {boolean} Check if post is sensitive */
    isSensitivePost() { return this.isSensitive === true; }

    /** @returns {boolean} Check if post is scheduled */
    isScheduledPost() { return this.scheduledAt !== null && this.scheduledAt > new Date(); }

    /** @returns {boolean} Check if post is expired */
    isExpiredPost() { return this.expiresAt !== null && this.expiresAt < new Date(); }

    // ============================================
    // TIME METHODS
    // ============================================

    /**
     * Get time ago
     * @param {string} locale - Locale for formatting
     * @returns {string} Time ago
     */
    getTimeAgo(locale = 'en-US') {
        const now = new Date();
        const diff = now - this.createdAt;
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
     * Get formatted creation date
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
     * Check if post is today
     * @returns {boolean} True if today
     */
    isToday() {
        const today = new Date();
        return this.createdAt.getDate() === today.getDate() &&
               this.createdAt.getMonth() === today.getMonth() &&
               this.createdAt.getFullYear() === today.getFullYear();
    }

    /**
     * Check if post is recent (within last 24 hours)
     * @returns {boolean} True if recent
     */
    isRecent() {
        const now = new Date();
        return (now - this.createdAt) < 24 * 60 * 60 * 1000;
    }

    // ============================================
    // SEARCH HELPERS
    // ============================================

    /**
     * Get searchable text
     * @returns {string} Searchable text
     */
    getSearchText() {
        return `${this.content} ${this.tags.join(' ')} ${this.category} ${this.location}`.toLowerCase();
    }

    /**
     * Check if post matches search query
     * @param {string} query - Search query
     * @returns {boolean} True if matches
     */
    matchesSearch(query) {
        if (!query || query.trim() === '') return true;
        const search = query.toLowerCase().trim();
        return this.getSearchText().includes(search);
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Get first image
     * @returns {string} First image URL
     */
    getFirstImage() {
        return this.images && this.images.length > 0 ? this.images[0] : this.thumbnail;
    }

    /**
     * Get content preview
     * @param {number} maxLength - Maximum length
     * @param {string} truncate - Truncation string
     * @returns {string} Content preview
     */
    getContentPreview(maxLength = 150, truncate = '...') {
        if (this.content.length <= maxLength) return this.content;
        return this.content.substring(0, maxLength) + truncate;
    }

    /**
     * Get engagement rate
     * @returns {number} Engagement rate (percentage)
     */
    getEngagementRate() {
        if (this.views === 0) return 0;
        const engagement = (this.likes || 0) + (this.comments || 0) + (this.shares || 0);
        return (engagement / this.views) * 100;
    }

    /**
     * Get reaction breakdown
     * @returns {Array<Object>} Reaction breakdown
     */
    getReactionBreakdown() {
        const total = this.getTotalReactions();
        if (total === 0) return [];
        return Object.entries(this.reactions)
            .filter(([_, count]) => count > 0)
            .map(([type, count]) => ({
                type,
                count,
                percentage: (count / total) * 100
            }))
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Clone post
     * @param {Object} options - Clone options
     * @param {boolean} options.keepId - Keep original ID
     * @param {boolean} options.keepTimestamps - Keep original timestamps
     * @param {boolean} options.keepStats - Keep original stats
     * @param {boolean} options.keepScores - Keep algorithm scores
     * @returns {Post} Cloned post
     */
    clone(options = {}) {
        const { keepId = false, keepTimestamps = false, keepStats = false, keepScores = false } = options;
        
        const data = this.toFirestore({ 
            includeMetadata: true, 
            includeAnalytics: true, 
            includeAlgorithm: true 
        });
        
        if (!keepId) {
            delete data.id;
            data.id = this.generateId();
        }
        
        if (!keepTimestamps) {
            data.createdAt = new Date();
            data.updatedAt = new Date();
            data.publishedAt = null;
            data.scheduledAt = null;
        }
        
        if (!keepStats) {
            data.likes = 0;
            data.comments = 0;
            data.shares = 0;
            data.saves = 0;
            data.views = 0;
            data.reactions = { like: 0, love: 0, wow: 0, sad: 0, angry: 0, laugh: 0, celebrate: 0 };
            data.analytics = {
                totalViews: 0,
                totalLikes: 0,
                totalComments: 0,
                totalShares: 0,
                totalSaves: 0,
                uniqueViewers: 0,
                engagementRate: 0,
                averageTimeSpent: 0,
                dailyViews: {},
                dailyLikes: {},
                dailyComments: {},
                locationStats: {},
                deviceStats: { mobile: 0, desktop: 0, tablet: 0 },
                referrerStats: {}
            };
            data.recentComments = [];
            data.recentReactions = [];
            data.topCommenters = [];
        }
        
        if (!keepScores) {
            data.followScore = 0;
            data.interestScore = 0;
            data.engagementScore = 0;
            data.timeScore = 0;
            data.finalScore = 0;
            data.algorithm = { followScore: 0, interestScore: 0, engagementScore: 0, timeScore: 0, finalScore: 0 };
        }
        
        data.isReported = false;
        data.reportCount = 0;
        data.isBlocked = false;
        data.isDeleted = false;
        
        return new Post({ ...data, id: data.id });
    }

    /**
     * Compare two posts
     * @param {Post} other - Other post
     * @returns {boolean} True if equal
     */
    equals(other) {
        if (!other) return false;
        return this.id === other.id;
    }

    /**
     * Check if post belongs to user
     * @param {string} userId - User ID
     * @returns {boolean} True if belongs to user
     */
    belongsToUser(userId) {
        return this.userId === userId;
    }

    /**
     * Check if post has tag
     * @param {string} tag - Tag to check
     * @returns {boolean} True if has tag
     */
    hasTag(tag) {
        return this.tags.some(t => t.toLowerCase() === tag.toLowerCase());
    }

    /**
     * Add tag
     * @param {string} tag - Tag to add
     * @returns {Post} Updated post (this)
     */
    addTag(tag) {
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
            this.updatedAt = new Date();
        }
        return this;
    }

    /**
     * Remove tag
     * @param {string} tag - Tag to remove
     * @returns {Post} Updated post (this)
     */
    removeTag(tag) {
        this.tags = this.tags.filter(t => t !== tag);
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Convert to string
     * @returns {string} String representation
     */
    toString() {
        return `Post(${this.userName}, ${this.type}, ${this.likes} likes)`;
    }

    /**
     * Convert to display string
     * @returns {string} Display string
     */
    toDisplayString() {
        return this.content || 'Post';
    }

    // ============================================
    // STATIC FACTORY METHODS
    // ============================================

    /**
     * Create post from Firestore data
     * @param {Object} data - Firestore data
     * @param {string} id - Document ID
     * @returns {Post} Post instance
     */
    static fromFirestore(data, id) {
        const postData = { ...data, id };
        return new Post(postData);
    }

    /**
     * Create posts from Firestore array
     * @param {Array} dataArray - Firestore data array
     * @returns {Array<Post>} Post instances
     */
    static fromFirestoreArray(dataArray) {
        if (!Array.isArray(dataArray)) return [];
        return dataArray.map(data => Post.fromFirestore(data, data.id));
    }

    /**
     * Create a text post
     * @param {string} userId - User ID
     * @param {string} userName - User name
     * @param {string} content - Post content
     * @param {Object} options - Options
     * @returns {Post} Text post
     */
    static createTextPost(userId, userName, content, options = {}) {
        return new Post({
            userId,
            userName,
            content,
            type: 'text',
            ...options
        });
    }

    /**
     * Create an image post
     * @param {string} userId - User ID
     * @param {string} userName - User name
     * @param {Array<string>} images - Image URLs
     * @param {string} content - Post content
     * @param {Object} options - Options
     * @returns {Post} Image post
     */
    static createImagePost(userId, userName, images, content = '', options = {}) {
        return new Post({
            userId,
            userName,
            content,
            images,
            type: images.length === 1 ? 'image' : 'mixed',
            thumbnail: images && images[0] || '',
            ...options
        });
    }

    /**
     * Create a video post
     * @param {string} userId - User ID
     * @param {string} userName - User name
     * @param {string} video - Video URL
     * @param {string} content - Post content
     * @param {Object} options - Options
     * @returns {Post} Video post
     */
    static createVideoPost(userId, userName, video, content = '', options = {}) {
        return new Post({
            userId,
            userName,
            content,
            video,
            type: 'video',
            thumbnail: options.thumbnail || '',
            ...options
        });
    }

    /**
     * Create a product post
     * @param {string} userId - User ID
     * @param {string} userName - User name
     * @param {string} productId - Product ID
     * @param {string} content - Post content
     * @param {Object} options - Options
     * @returns {Post} Product post
     */
    static createProductPost(userId, userName, productId, content = '', options = {}) {
        return new Post({
            userId,
            userName,
            content,
            productId,
            isProduct: true,
            type: 'image',
            ...options
        });
    }

    /**
     * Create a share post
     * @param {string} userId - User ID
     * @param {string} userName - User name
     * @param {string} sharedFrom - Original post ID
     * @param {Object} originalPost - Original post data
     * @param {string} content - Post content
     * @param {Object} options - Options
     * @returns {Post} Share post
     */
    static createShare(userId, userName, sharedFrom, originalPost = null, content = '', options = {}) {
        return new Post({
            userId,
            userName,
            content,
            sharedFrom,
            originalPost,
            isShare: true,
            type: 'text',
            ...options
        });
    }

    // ============================================
    // STATIC QUERY & FILTER METHODS
    // ============================================

    /**
     * Filter posts by user
     * @param {Array<Post>} posts - Posts array
     * @param {string} userId - User ID
     * @returns {Array<Post>} Filtered posts
     */
    static filterByUser(posts, userId) {
        if (!userId) return posts;
        return posts.filter(p => p.userId === userId);
    }

    /**
     * Filter posts by type
     * @param {Array<Post>} posts - Posts array
     * @param {string|Array<string>} types - Type(s) to filter
     * @returns {Array<Post>} Filtered posts
     */
    static filterByType(posts, types) {
        if (!types) return posts;
        if (!Array.isArray(types)) types = [types];
        return posts.filter(p => types.includes(p.type));
    }

    /**
     * Filter posts by category
     * @param {Array<Post>} posts - Posts array
     * @param {string} category - Category
     * @returns {Array<Post>} Filtered posts
     */
    static filterByCategory(posts, category) {
        if (!category) return posts;
        return posts.filter(p => p.category === category);
    }

    /**
     * Filter posts by tag
     * @param {Array<Post>} posts - Posts array
     * @param {string} tag - Tag
     * @returns {Array<Post>} Filtered posts
     */
    static filterByTag(posts, tag) {
        if (!tag) return posts;
        return posts.filter(p => p.hasTag(tag));
    }

    /**
     * Filter posts by search query
     * @param {Array<Post>} posts - Posts array
     * @param {string} query - Search query
     * @returns {Array<Post>} Filtered posts
     */
    static filterBySearch(posts, query) {
        if (!query || query.trim() === '') return posts;
        return posts.filter(p => p.matchesSearch(query));
    }

    /**
     * Filter posts by visibility
     * @param {Array<Post>} posts - Posts array
     * @param {boolean} isPublic - Public status
     * @returns {Array<Post>} Filtered posts
     */
    static filterByVisibility(posts, isPublic = true) {
        return posts.filter(p => p.isPublic === isPublic);
    }

    /**
     * Filter active posts (not deleted, not blocked)
     * @param {Array<Post>} posts - Posts array
     * @returns {Array<Post>} Active posts
     */
    static filterActive(posts) {
        return posts.filter(p => !p.isDeleted && !p.isBlocked);
    }

    /**
     * Filter posts by user interests
     * @param {Array<Post>} posts - Posts array
     * @param {Array<string>} interests - User interests
     * @param {number} threshold - Match threshold
     * @returns {Array<Post>} Filtered posts
     */
    static filterByInterests(posts, interests, threshold = 50) {
        if (!interests || interests.length === 0) return posts;
        return posts.filter(p => p.matchesInterests(interests, threshold));
    }

    /**
     * Sort posts by date
     * @param {Array<Post>} posts - Posts array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<Post>} Sorted posts
     */
    static sortByDate(posts, order = 'desc') {
        const sorted = [...posts];
        sorted.sort((a, b) => {
            const aTime = a.createdAt.getTime();
            const bTime = b.createdAt.getTime();
            return order === 'asc' ? aTime - bTime : bTime - aTime;
        });
        return sorted;
    }

    /**
     * Sort posts by likes
     * @param {Array<Post>} posts - Posts array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<Post>} Sorted posts
     */
    static sortByLikes(posts, order = 'desc') {
        const sorted = [...posts];
        sorted.sort((a, b) => {
            return order === 'asc' ? (a.likes || 0) - (b.likes || 0) : (b.likes || 0) - (a.likes || 0);
        });
        return sorted;
    }

    /**
     * Sort posts by comments
     * @param {Array<Post>} posts - Posts array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<Post>} Sorted posts
     */
    static sortByComments(posts, order = 'desc') {
        const sorted = [...posts];
        sorted.sort((a, b) => {
            return order === 'asc' ? (a.comments || 0) - (b.comments || 0) : (b.comments || 0) - (a.comments || 0);
        });
        return sorted;
    }

    /**
     * Sort posts by algorithm score
     * @param {Array<Post>} posts - Posts array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<Post>} Sorted posts
     */
    static sortByScore(posts, order = 'desc') {
        const sorted = [...posts];
        sorted.sort((a, b) => {
            return order === 'asc' ? (a.finalScore || 0) - (b.finalScore || 0) : (b.finalScore || 0) - (a.finalScore || 0);
        });
        return sorted;
    }

    /**
     * Get trending posts
     * @param {Array<Post>} posts - Posts array
     * @param {number} limit - Limit
     * @param {number} hours - Hours window
     * @returns {Array<Post>} Trending posts
     */
    static getTrending(posts, limit = 10, hours = 24) {
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - hours);
        
        const recent = posts.filter(p => p.createdAt >= cutoff);
        const scored = recent.map(p => ({
            post: p,
            score: (p.likes || 0) * 2 + (p.comments || 0) * 3 + (p.shares || 0) * 2 + (p.views || 0) * 0.5
        }));
        
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, limit).map(s => s.post);
    }

    /**
     * Get most liked posts
     * @param {Array<Post>} posts - Posts array
     * @param {number} limit - Limit
     * @returns {Array<Post>} Most liked posts
     */
    static getMostLiked(posts, limit = 10) {
        return Post.sortByLikes(posts, 'desc').slice(0, limit);
    }

    /**
     * Get most commented posts
     * @param {Array<Post>} posts - Posts array
     * @param {number} limit - Limit
     * @returns {Array<Post>} Most commented posts
     */
    static getMostCommented(posts, limit = 10) {
        return Post.sortByComments(posts, 'desc').slice(0, limit);
    }

    /**
     * Get recent posts
     * @param {Array<Post>} posts - Posts array
     * @param {number} limit - Limit
     * @param {number} days - Days
     * @returns {Array<Post>} Recent posts
     */
    static getRecent(posts, limit = 10, days = 7) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const recent = posts.filter(p => p.createdAt >= cutoff);
        return Post.sortByDate(recent, 'desc').slice(0, limit);
    }

    /**
     * Get posts for feed (algorithm based)
     * @param {Array<Post>} posts - Posts array
     * @param {Object} context - Context for algorithm
     * @param {Array<string>} context.userInterests - User interests
     * @param {Array<string>} context.following - Following users
     * @param {Array<string>} context.engagementHistory - Engagement history
     * @param {number} limit - Limit
     * @param {number} offset - Offset
     * @returns {Array<Post>} Feed posts
     */
    static getFeed(posts, context = {}, limit = 20, offset = 0) {
        const { userInterests = [], following = [], engagementHistory = [] } = context;
        
        // Calculate scores for all posts
        const scored = posts.map(post => {
            const scores = post.calculateScores({ userInterests, following, engagementHistory });
            return { post, score: scores.finalScore };
        });
        
        // Sort by score
        scored.sort((a, b) => b.score - a.score);
        
        // Apply offset and limit
        return scored.slice(offset, offset + limit).map(s => s.post);
    }

    /**
     * Check if post data is valid
     * @param {Object} data - Post data
     * @returns {boolean} True if valid
     */
    static isValidPostData(data) {
        return data && typeof data === 'object' &&
            data.userId && data.userId.trim() !== '' &&
            (data.content || (data.images && data.images.length > 0) || data.video);
    }

    /**
     * Group posts by date
     * @param {Array<Post>} posts - Posts array
     * @param {string} groupBy - 'day', 'week', 'month'
     * @returns {Object} Grouped posts
     */
    static groupByDate(posts, groupBy = 'day') {
        const groups = {};
        for (const post of posts) {
            let key;
            switch (groupBy) {
                case 'week':
                    const weekStart = new Date(post.createdAt);
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    key = weekStart.toDateString();
                    break;
                case 'month':
                    key = `${post.createdAt.getFullYear()}-${post.createdAt.getMonth() + 1}`;
                    break;
                default:
                    key = post.createdAt.toDateString();
            }
            if (!groups[key]) groups[key] = [];
            groups[key].push(post);
        }
        return groups;
    }

    /**
     * Group posts by user
     * @param {Array<Post>} posts - Posts array
     * @returns {Object} Grouped by user
     */
    static groupByUser(posts) {
        const groups = {};
        for (const post of posts) {
            const key = post.userId || 'unknown';
            if (!groups[key]) groups[key] = [];
            groups[key].push(post);
        }
        return groups;
    }

    /**
     * Group posts by category
     * @param {Array<Post>} posts - Posts array
     * @returns {Object} Grouped by category
     */
    static groupByCategory(posts) {
        const groups = {};
        for (const post of posts) {
            const key = post.category || 'uncategorized';
            if (!groups[key]) groups[key] = [];
            groups[key].push(post);
        }
        return groups;
    }
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default Post;

// ============================================================
// END OF FILE: post-model.js
// ============================================================