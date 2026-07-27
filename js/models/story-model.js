// Story Model
// ============================================================
// FILE: story-model.js
// PURPOSE: Story data structure for ZYMORE v3.0 Social Features
// VERSION: 3.0.0 (Production Ready)
// DEPENDENCY: NONE
// USED BY: social-service.js, story-viewer.js, story-circle.js, home-screen.js
// LOCATION: js/models/story-model.js
// ============================================================

// ============================================================
// STORY CLASS - ZYMORE v3.0 SOCIAL FEATURE
// ============================================================

/**
 * Story Model Class
 * Represents a story in the ZYMORE Hybrid Platform (Instagram style)
 * 
 * ZYMORE v3.0 Features:
 * - Image & Video Stories
 * - 24 hours expiry
 * - Views tracking
 * - Reactions
 * - Text overlay
 * - Duration control
 * - User info (name, photo)
 * - Location support
 * - Highlight support
 * - Archive support
 * - Analytics tracking
 * - Report system
 * - Privacy controls
 */
export class Story {
    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * Create a new Story instance
     * @param {Object} data - Story data
     * @param {string} data.id - Story ID
     * @param {string} data.userId - User ID
     * @param {string} data.userName - User name
     * @param {string} data.userPhoto - User photo URL
     * @param {string} data.media - Image or video URL
     * @param {string} data.type - Story type (image, video)
     * @param {string} data.text - Text overlay
     * @param {number} data.duration - Duration in seconds
     * @param {number} data.views - View count
     * @param {Array<string>} data.reactions - User reactions
     * @param {Date|string} data.expiresAt - Expiry timestamp (24 hours)
     * @param {Date|string} data.createdAt - Creation date
     * @param {string} data.location - Location
     * @param {string} data.placeId - Place ID
     * @param {Object} data.coordinates - Coordinates {lat, lng}
     * @param {Array<string>} data.tags - Tags
     * @param {string} data.category - Category
     * @param {boolean} data.isHighlight - Is highlight story
     * @param {string} data.highlightId - Highlight ID
     * @param {string} data.highlightName - Highlight name
     * @param {boolean} data.isArchived - Is archived
     * @param {Array<string>} data.viewers - Viewer IDs
     * @param {Array<Object>} data.reactionsList - Detailed reactions
     * @param {Object} data.analytics - Analytics data
     * @param {string} data.thumbnail - Thumbnail URL
     * @param {string} data.filter - Filter name
     * @param {string} data.backgroundColor - Background color
     * @param {string} data.textColor - Text color
     * @param {string} data.font - Font name
     * @param {boolean} data.isPublic - Public status
     * @param {Array<string>} data.visibleTo - Visible to specific users
     * @param {boolean} data.isReported - Reported flag
     * @param {number} data.reportCount - Report count
     * @param {boolean} data.isBlocked - Blocked flag
     * @param {boolean} data.isDeleted - Deleted flag
     * @param {string} data.sharedFrom - Shared from story ID
     * @param {Object} data.metadata - Additional metadata
     * @param {string} data.link - External link
     * @param {Object} data.linkData - Link data (title, description, image)
     * @param {Array<Object>} data.poll - Poll data
     * @param {Array<Object>} data.questions - Question stickers
     * @param {Array<Object>} data.mentions - Mentioned users
     * @param {Array<Object>} data.hashtags - Hashtags
     * @param {boolean} data.isMuted - Muted status
     * @param {number} data.mutedCount - Muted count
     * @param {boolean} data.isHidden - Hidden status
     * @param {number} data.hiddenCount - Hidden count
     */
    constructor(data = {}) {
        // ============================================
        // 📌 BASIC INFORMATION
        // ============================================
        this.id = data.id || data.storyId || this.generateId();
        this.userId = data.userId || '';
        this.userName = data.userName || '';
        this.userPhoto = data.userPhoto || '';
        this.media = data.media || '';
        this.type = data.type || this.detectType(data);
        this.text = data.text || '';
        this.duration = data.duration || 5;
        this.views = data.views || 0;
        this.reactions = Array.isArray(data.reactions) ? [...data.reactions] : [];
        this.expiresAt = data.expiresAt ? new Date(data.expiresAt) : this.calculateExpiry();
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
        
        // ============================================
        // 📍 LOCATION
        // ============================================
        this.location = data.location || '';
        this.placeId = data.placeId || '';
        this.coordinates = data.coordinates || { lat: 0, lng: 0 };
        
        // ============================================
        // 🏷️ TAGS & CATEGORY
        // ============================================
        this.tags = Array.isArray(data.tags) ? [...data.tags] : [];
        this.category = data.category || '';
        
        // ============================================
        // 📌 HIGHLIGHT
        // ============================================
        this.isHighlight = data.isHighlight || false;
        this.highlightId = data.highlightId || '';
        this.highlightName = data.highlightName || '';
        this.highlightCover = data.highlightCover || this.media || '';
        this.isArchived = data.isArchived || false;
        this.archivedAt = data.archivedAt ? new Date(data.archivedAt) : null;
        
        // ============================================
        // 👥 VIEWERS & REACTIONS
        // ============================================
        this.viewers = Array.isArray(data.viewers) ? [...data.viewers] : [];
        this.reactionsList = Array.isArray(data.reactionsList) ? [...data.reactionsList] : [];
        this.reactionCounts = data.reactionCounts || {};
        this.viewerCount = data.viewerCount || 0;
        this.uniqueViewers = data.uniqueViewers || 0;
        
        // ============================================
        // 📊 ANALYTICS
        // ============================================
        this.analytics = {
            totalViews: data.analytics?.totalViews || 0,
            uniqueViewers: data.analytics?.uniqueViewers || 0,
            totalReactions: data.analytics?.totalReactions || 0,
            averageViewTime: data.analytics?.averageViewTime || 0,
            completionRate: data.analytics?.completionRate || 0,
            dailyViews: data.analytics?.dailyViews || {},
            dailyReactions: data.analytics?.dailyReactions || {},
            locationStats: data.analytics?.locationStats || {},
            deviceStats: data.analytics?.deviceStats || { mobile: 0, desktop: 0, tablet: 0 },
            referrerStats: data.analytics?.referrerStats || {},
            ...data.analytics
        };
        
        // ============================================
        // 🎨 STYLING
        // ============================================
        this.thumbnail = data.thumbnail || this.media || '';
        this.filter = data.filter || '';
        this.backgroundColor = data.backgroundColor || '#000000';
        this.textColor = data.textColor || '#ffffff';
        this.font = data.font || 'default';
        this.textSize = data.textSize || 'medium';
        this.textPosition = data.textPosition || 'center';
        this.textBackground = data.textBackground || '';
        this.overlayColor = data.overlayColor || '';
        this.overlayOpacity = data.overlayOpacity || 0;
        
        // ============================================
        // 🔒 PRIVACY
        // ============================================
        this.isPublic = data.isPublic !== undefined ? data.isPublic : true;
        this.visibleTo = Array.isArray(data.visibleTo) ? [...data.visibleTo] : [];
        this.visibility = data.visibility || 'public'; // 'public' | 'friends' | 'custom'
        this.closeFriendsOnly = data.closeFriendsOnly || false;
        
        // ============================================
        // 🚩 STATUS FLAGS
        // ============================================
        this.isReported = data.isReported || false;
        this.reportCount = data.reportCount || 0;
        this.isBlocked = data.isBlocked || false;
        this.isDeleted = data.isDeleted || false;
        this.isMuted = data.isMuted || false;
        this.mutedCount = data.mutedCount || 0;
        this.isHidden = data.isHidden || false;
        this.hiddenCount = data.hiddenCount || 0;
        
        // ============================================
        // 🔗 SHARING
        // ============================================
        this.sharedFrom = data.sharedFrom || '';
        this.isShare = data.isShare || false;
        this.originalStory = data.originalStory || null;
        
        // ============================================
        // 🔗 EXTERNAL LINKS
        // ============================================
        this.link = data.link || '';
        this.linkData = data.linkData || {
            title: '',
            description: '',
            image: '',
            url: ''
        };
        this.linkClickCount = data.linkClickCount || 0;
        
        // ============================================
        // 🎯 INTERACTIVE ELEMENTS
        // ============================================
        this.poll = Array.isArray(data.poll) ? [...data.poll] : [];
        this.pollResults = data.pollResults || {};
        this.pollVotes = data.pollVotes || 0;
        this.questions = Array.isArray(data.questions) ? [...data.questions] : [];
        this.questionResponses = data.questionResponses || {};
        this.mentions = Array.isArray(data.mentions) ? [...data.mentions] : [];
        this.hashtags = Array.isArray(data.hashtags) ? [...data.hashtags] : [];
        this.stickers = Array.isArray(data.stickers) ? [...data.stickers] : [];
        
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
     * Generate a unique story ID
     * @returns {string} Unique ID
     */
    generateId() {
        return `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Calculate expiry timestamp (24 hours from creation)
     * @returns {Date} Expiry date
     */
    calculateExpiry() {
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 24);
        return expiry;
    }

    /**
     * Detect story type from data
     * @param {Object} data - Story data
     * @returns {string} Story type
     */
    detectType(data) {
        if (data.media) {
            const mediaLower = data.media.toLowerCase();
            if (mediaLower.includes('.mp4') || mediaLower.includes('.mov') || 
                mediaLower.includes('.webm') || mediaLower.includes('video')) {
                return 'video';
            }
            return 'image';
        }
        return 'image';
    }

    // ============================================
    // VALIDATION
    // ============================================

    /**
     * Validate story data
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

        if (!this.media || this.media.trim() === '') {
            errors.push('Media URL is required');
        }

        // === TYPE VALIDATION ===
        const validTypes = ['image', 'video'];
        if (this.type && !validTypes.includes(this.type)) {
            warnings.push(`Uncommon story type: ${this.type}`);
        }

        // === DURATION ===
        if (this.duration < 1 || this.duration > 60) {
            warnings.push('Duration should be between 1 and 60 seconds');
        }

        // === TEXT ===
        if (this.text && this.text.length > 500) {
            warnings.push('Text exceeds 500 characters - consider shortening');
        }

        // === URL VALIDATION ===
        if (this.media && !this.isValidUrl(this.media)) {
            errors.push('Invalid media URL format');
        }

        if (this.link && !this.isValidUrl(this.link)) {
            warnings.push('Invalid link URL format');
        }

        // === TAGS ===
        if (this.tags && this.tags.length > 10) {
            warnings.push('Maximum 10 tags recommended');
        }
        if (this.tags && this.tags.some(t => !t || t.trim() === '')) {
            errors.push('Tags cannot be empty');
        }

        // === EXPIRY ===
        if (this.expiresAt && this.expiresAt < new Date()) {
            warnings.push('Story has already expired');
        }

        // === HIGHLIGHT ===
        if (this.isHighlight && !this.highlightId) {
            warnings.push('Highlight story should have a highlight ID');
        }

        // === PRIVACY ===
        const validVisibilities = ['public', 'friends', 'custom'];
        if (this.visibility && !validVisibilities.includes(this.visibility)) {
            warnings.push(`Invalid visibility: ${this.visibility}`);
        }

        // === STRICT VALIDATION ===
        if (strict) {
            if (!this.userName) {
                warnings.push('User name is recommended');
            }
            if (!this.thumbnail) {
                warnings.push('Thumbnail is recommended');
            }
            if (this.isPublic && this.visibleTo.length > 0) {
                warnings.push('Public story should not have visibleTo restrictions');
            }
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
     * @param {boolean} options.includeInteractive - Include interactive elements
     * @returns {Object} Firestore document
     */
    toFirestore(options = {}) {
        const { includeMetadata = true, includeAnalytics = true, includeInteractive = true } = options;

        const data = {
            userId: this.userId,
            userName: this.userName,
            userPhoto: this.userPhoto,
            media: this.media,
            type: this.type,
            text: this.text,
            duration: this.duration,
            views: this.views,
            reactions: [...this.reactions],
            expiresAt: this.expiresAt.toISOString(),
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            location: this.location,
            placeId: this.placeId,
            coordinates: { ...this.coordinates },
            tags: [...this.tags],
            category: this.category,
            isHighlight: this.isHighlight,
            highlightId: this.highlightId,
            highlightName: this.highlightName,
            highlightCover: this.highlightCover,
            isArchived: this.isArchived,
            archivedAt: this.archivedAt ? this.archivedAt.toISOString() : null,
            viewers: [...this.viewers],
            reactionsList: [...this.reactionsList],
            reactionCounts: { ...this.reactionCounts },
            viewerCount: this.viewerCount,
            uniqueViewers: this.uniqueViewers,
            thumbnail: this.thumbnail,
            filter: this.filter,
            backgroundColor: this.backgroundColor,
            textColor: this.textColor,
            font: this.font,
            textSize: this.textSize,
            textPosition: this.textPosition,
            textBackground: this.textBackground,
            overlayColor: this.overlayColor,
            overlayOpacity: this.overlayOpacity,
            isPublic: this.isPublic,
            visibleTo: [...this.visibleTo],
            visibility: this.visibility,
            closeFriendsOnly: this.closeFriendsOnly,
            isReported: this.isReported,
            reportCount: this.reportCount,
            isBlocked: this.isBlocked,
            isDeleted: this.isDeleted,
            isMuted: this.isMuted,
            mutedCount: this.mutedCount,
            isHidden: this.isHidden,
            hiddenCount: this.hiddenCount,
            sharedFrom: this.sharedFrom,
            isShare: this.isShare,
            link: this.link,
            linkData: { ...this.linkData },
            linkClickCount: this.linkClickCount,
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
        }

        if (includeInteractive) {
            data.poll = [...this.poll];
            data.pollResults = { ...this.pollResults };
            data.pollVotes = this.pollVotes;
            data.questions = [...this.questions];
            data.questionResponses = { ...this.questionResponses };
            data.mentions = [...this.mentions];
            data.hashtags = [...this.hashtags];
            data.stickers = [...this.stickers];
        }

        if (this.originalStory) {
            data.originalStory = this.originalStory;
        }

        return data;
    }

    /**
     * Convert to JSON
     * @param {Object} options - Conversion options
     * @param {boolean} options.includePrivate - Include private fields
     * @param {boolean} options.includeMetadata - Include metadata
     * @param {boolean} options.includeAnalytics - Include analytics
     * @param {boolean} options.includeInteractive - Include interactive elements
     * @returns {Object} JSON object
     */
    toJSON(options = {}) {
        const { includePrivate = false, includeMetadata = false, includeAnalytics = false, includeInteractive = false } = options;

        const data = {
            id: this.id,
            userId: this.userId,
            userName: this.userName,
            userPhoto: this.userPhoto,
            media: this.media,
            type: this.type,
            text: this.text,
            duration: this.duration,
            views: this.views,
            reactions: [...this.reactions],
            expiresAt: this.expiresAt.toISOString(),
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            location: this.location,
            tags: [...this.tags],
            category: this.category,
            isHighlight: this.isHighlight,
            highlightId: this.highlightId,
            highlightName: this.highlightName,
            highlightCover: this.highlightCover,
            isArchived: this.isArchived,
            archivedAt: this.archivedAt ? this.archivedAt.toISOString() : null,
            thumbnail: this.thumbnail,
            filter: this.filter,
            backgroundColor: this.backgroundColor,
            textColor: this.textColor,
            font: this.font,
            textSize: this.textSize,
            textPosition: this.textPosition,
            isPublic: this.isPublic,
            visibility: this.visibility,
            isShare: this.isShare,
            sharedFrom: this.sharedFrom,
            link: this.link,
            linkData: { ...this.linkData },
            linkClickCount: this.linkClickCount
        };

        if (includePrivate) {
            data.placeId = this.placeId;
            data.coordinates = { ...this.coordinates };
            data.visibleTo = [...this.visibleTo];
            data.closeFriendsOnly = this.closeFriendsOnly;
            data.isReported = this.isReported;
            data.reportCount = this.reportCount;
            data.isBlocked = this.isBlocked;
            data.isDeleted = this.isDeleted;
            data.isMuted = this.isMuted;
            data.mutedCount = this.mutedCount;
            data.isHidden = this.isHidden;
            data.hiddenCount = this.hiddenCount;
            data.textBackground = this.textBackground;
            data.overlayColor = this.overlayColor;
            data.overlayOpacity = this.overlayOpacity;
            data.notes = this.notes;
            data.internalNotes = this.internalNotes;
            data.customFields = this.customFields;
            data.viewers = [...this.viewers];
            data.reactionsList = [...this.reactionsList];
            data.reactionCounts = { ...this.reactionCounts };
            data.viewerCount = this.viewerCount;
            data.uniqueViewers = this.uniqueViewers;
        }

        if (includeMetadata) {
            data.metadata = this.metadata;
        }

        if (includeAnalytics) {
            data.analytics = { ...this.analytics };
        }

        if (includeInteractive) {
            data.poll = [...this.poll];
            data.pollResults = { ...this.pollResults };
            data.pollVotes = this.pollVotes;
            data.questions = [...this.questions];
            data.questionResponses = { ...this.questionResponses };
            data.mentions = [...this.mentions];
            data.hashtags = [...this.hashtags];
            data.stickers = [...this.stickers];
        }

        if (this.originalStory) {
            data.originalStory = this.originalStory;
        }

        return data;
    }

    /**
     * Get public story data
     * @param {Object} options - Options
     * @param {boolean} options.includeUser - Include user info
     * @param {boolean} options.includeStats - Include statistics
     * @param {boolean} options.includeText - Include text
     * @returns {Object} Public story data
     */
    getPublicData(options = {}) {
        const { includeUser = true, includeStats = true, includeText = true } = options;

        const data = {
            id: this.id,
            media: this.media,
            type: this.type,
            duration: this.duration,
            expiresAt: this.expiresAt.toISOString(),
            createdAt: this.createdAt.toISOString(),
            location: this.location,
            tags: [...this.tags],
            category: this.category,
            isHighlight: this.isHighlight,
            highlightId: this.highlightId,
            highlightName: this.highlightName,
            highlightCover: this.highlightCover,
            thumbnail: this.thumbnail,
            filter: this.filter,
            backgroundColor: this.backgroundColor,
            textColor: this.textColor,
            font: this.font,
            visibility: this.visibility,
            isPublic: this.isPublic,
            link: this.link,
            linkData: { ...this.linkData }
        };

        if (includeUser) {
            data.userId = this.userId;
            data.userName = this.userName;
            data.userPhoto = this.userPhoto;
        }

        if (includeStats) {
            data.views = this.views;
            data.viewerCount = this.viewerCount;
            data.uniqueViewers = this.uniqueViewers;
            data.reactions = [...this.reactions];
            data.reactionCounts = { ...this.reactionCounts };
        }

        if (includeText) {
            data.text = this.text;
        }

        return data;
    }

    /**
     * Get minimal story data (for story circles)
     * @param {Object} options - Options
     * @param {boolean} options.includeUser - Include user info
     * @returns {Object} Minimal story data
     */
    getMinimalData(options = {}) {
        const { includeUser = true } = options;

        const data = {
            id: this.id,
            media: this.media,
            type: this.type,
            thumbnail: this.thumbnail,
            expiresAt: this.expiresAt.toISOString(),
            createdAt: this.createdAt.toISOString(),
            isHighlight: this.isHighlight,
            highlightId: this.highlightId,
            highlightName: this.highlightName,
            highlightCover: this.highlightCover
        };

        if (includeUser) {
            data.userId = this.userId;
            data.userName = this.userName;
            data.userPhoto = this.userPhoto;
        }

        return data;
    }

    /**
     * Get highlight data
     * @returns {Object} Highlight data
     */
    getHighlightData() {
        return {
            id: this.highlightId || this.id,
            name: this.highlightName || 'Highlight',
            cover: this.highlightCover || this.thumbnail || this.media,
            storyIds: [this.id],
            count: 1,
            userId: this.userId,
            userName: this.userName,
            userPhoto: this.userPhoto,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        };
    }

    // ============================================
    // VIEW & REACTION METHODS
    // ============================================

    /**
     * Add a view
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {string} options.device - Device type
     * @param {string} options.location - Location
     * @param {number} options.viewDuration - View duration in seconds
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Story} Updated story (this)
     */
    addView(userId, options = {}) {
        const { device = '', location = '', viewDuration = 0, emitEvent = true } = options;

        if (!this.viewers.includes(userId)) {
            this.viewers.push(userId);
            this.uniqueViewers = (this.uniqueViewers || 0) + 1;
        }

        this.views = (this.views || 0) + 1;
        this.viewerCount = (this.viewerCount || 0) + 1;
        this.analytics.totalViews = (this.analytics.totalViews || 0) + 1;
        this.analytics.averageViewTime = this.calculateAverageViewTime(viewDuration);

        const date = new Date().toISOString().split('T')[0];
        this.analytics.dailyViews[date] = (this.analytics.dailyViews[date] || 0) + 1;

        if (device && this.analytics.deviceStats[device] !== undefined) {
            this.analytics.deviceStats[device] = (this.analytics.deviceStats[device] || 0) + 1;
        }

        if (location) {
            this.analytics.locationStats[location] = (this.analytics.locationStats[location] || 0) + 1;
        }

        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('story:view', { storyId: this.id, userId, viewDuration });
        }

        return this;
    }

    /**
     * Add a reaction
     * @param {string} userId - User ID
     * @param {string} reaction - Reaction type
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Story} Updated story (this)
     */
    addReaction(userId, reaction, options = {}) {
        const { emitEvent = true } = options;
        const validReactions = ['❤️', '🔥', '😂', '😍', '😮', '😢', '😡', '🎉', '💯', '👏', '🙌', '💪'];

        if (validReactions.includes(reaction)) {
            if (!this.reactions.includes(reaction)) {
                this.reactions.push(reaction);
            }

            this.reactionsList.push({ userId, reaction, timestamp: new Date() });
            this.reactionCounts[reaction] = (this.reactionCounts[reaction] || 0) + 1;
            this.analytics.totalReactions = (this.analytics.totalReactions || 0) + 1;

            const date = new Date().toISOString().split('T')[0];
            this.analytics.dailyReactions[date] = (this.analytics.dailyReactions[date] || 0) + 1;

            this.updatedAt = new Date();

            if (emitEvent && typeof EventBus !== 'undefined') {
                EventBus.emit('story:reaction', { storyId: this.id, userId, reaction });
            }
        }
        return this;
    }

    /**
     * Get total reactions count
     * @returns {number} Total reactions
     */
    getTotalReactions() {
        return Object.values(this.reactionCounts).reduce((sum, val) => sum + (val || 0), 0);
    }

    /**
     * Get most popular reaction
     * @returns {Object} { reaction, count }
     */
    getMostPopularReaction() {
        let maxReaction = '❤️';
        let maxCount = 0;
        for (const [reaction, count] of Object.entries(this.reactionCounts)) {
            if (count > maxCount) {
                maxCount = count;
                maxReaction = reaction;
            }
        }
        return { reaction: maxReaction, count: maxCount };
    }

    /**
     * Check if story has been viewed by user
     * @param {string} userId - User ID
     * @returns {boolean} True if viewed
     */
    isViewedBy(userId) {
        return this.viewers.includes(userId);
    }

    /**
     * Get view percentage
     * @returns {number} View percentage (0-100)
     */
    getViewPercentage() {
        if (this.viewerCount === 0 || this.uniqueViewers === 0) return 0;
        return (this.uniqueViewers / this.viewerCount) * 100;
    }

    /**
     * Calculate average view time
     * @param {number} viewDuration - View duration in seconds
     * @returns {number} Average view time
     */
    calculateAverageViewTime(viewDuration) {
        const total = (this.analytics.averageViewTime || 0) * (this.views || 1);
        const newTotal = total + viewDuration;
        return newTotal / (this.views || 1);
    }

    // ============================================
    // LINK METHODS
    // ============================================

    /**
     * Increment link click count
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Story} Updated story (this)
     */
    incrementLinkClicks(options = {}) {
        const { emitEvent = true } = options;
        this.linkClickCount = (this.linkClickCount || 0) + 1;
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('story:link_click', { storyId: this.id, count: this.linkClickCount });
        }
        return this;
    }

    // ============================================
    // POLL METHODS
    // ============================================

    /**
     * Add poll option
     * @param {string} option - Poll option text
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Story} Updated story (this)
     */
    addPollOption(option, options = {}) {
        const { emitEvent = true } = options;
        this.poll.push({ text: option, votes: 0 });
        this.pollResults[option] = 0;
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('story:poll_created', { storyId: this.id, poll: this.poll });
        }
        return this;
    }

    /**
     * Vote on poll
     * @param {string} userId - User ID
     * @param {string} option - Poll option
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Story} Updated story (this)
     */
    votePoll(userId, option, options = {}) {
        const { emitEvent = true } = options;
        if (this.poll.some(p => p.text === option)) {
            this.poll = this.poll.map(p => 
                p.text === option ? { ...p, votes: (p.votes || 0) + 1 } : p
            );
            this.pollResults[option] = (this.pollResults[option] || 0) + 1;
            this.pollVotes = (this.pollVotes || 0) + 1;
            this.updatedAt = new Date();

            if (emitEvent && typeof EventBus !== 'undefined') {
                EventBus.emit('story:poll_vote', { storyId: this.id, userId, option });
            }
        }
        return this;
    }

    /**
     * Get poll results
     * @returns {Object} Poll results
     */
    getPollResults() {
        const total = this.pollVotes || 0;
        if (total === 0) return {};
        const results = {};
        for (const [option, count] of Object.entries(this.pollResults)) {
            results[option] = {
                count: count,
                percentage: (count / total) * 100
            };
        }
        return results;
    }

    // ============================================
    // QUESTION METHODS
    // ============================================

    /**
     * Add a question sticker
     * @param {string} question - Question text
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Story} Updated story (this)
     */
    addQuestion(question, options = {}) {
        const { emitEvent = true } = options;
        this.questions.push({
            id: `q_${Date.now()}`,
            text: question,
            responses: [],
            createdAt: new Date()
        });
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('story:question_created', { storyId: this.id, question });
        }
        return this;
    }

    /**
     * Respond to a question
     * @param {string} userId - User ID
     * @param {string} userName - User name
     * @param {string} questionId - Question ID
     * @param {string} response - Response text
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Story} Updated story (this)
     */
    respondToQuestion(userId, userName, questionId, response, options = {}) {
        const { emitEvent = true } = options;
        const question = this.questions.find(q => q.id === questionId);
        if (question) {
            question.responses.push({
                userId,
                userName,
                response,
                timestamp: new Date()
            });
            this.updatedAt = new Date();

            if (emitEvent && typeof EventBus !== 'undefined') {
                EventBus.emit('story:question_response', { 
                    storyId: this.id, 
                    userId, 
                    questionId, 
                    response 
                });
            }
        }
        return this;
    }

    // ============================================
    // HIGHLIGHT METHODS
    // ============================================

    /**
     * Add to highlight
     * @param {string} highlightId - Highlight ID
     * @param {string} highlightName - Highlight name
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Story} Updated story (this)
     */
    addToHighlight(highlightId, highlightName, options = {}) {
        const { emitEvent = true } = options;
        this.isHighlight = true;
        this.highlightId = highlightId;
        this.highlightName = highlightName;
        this.highlightCover = this.highlightCover || this.thumbnail || this.media;
        this.isArchived = true;
        this.archivedAt = new Date();
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('story:highlight_added', { 
                storyId: this.id, 
                highlightId, 
                highlightName 
            });
        }
        return this;
    }

    /**
     * Remove from highlight
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Story} Updated story (this)
     */
    removeFromHighlight(options = {}) {
        const { emitEvent = true } = options;
        this.isHighlight = false;
        this.highlightId = '';
        this.highlightName = '';
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('story:highlight_removed', { storyId: this.id });
        }
        return this;
    }

    // ============================================
    // STATUS METHODS
    // ============================================

    /** @returns {boolean} Check if story is active (not expired) */
    isActive() {
        return !this.isDeleted && !this.isBlocked && 
               this.expiresAt && this.expiresAt > new Date();
    }

    /** @returns {boolean} Check if story is expired */
    isExpired() {
        return this.expiresAt && this.expiresAt <= new Date();
    }

    /** @returns {boolean} Check if story is public */
    isPublicStory() { return this.isPublic === true && !this.isDeleted && !this.isBlocked; }

    /** @returns {boolean} Check if story is highlight */
    isHighlightStory() { return this.isHighlight === true; }

    /** @returns {boolean} Check if story is archived */
    isArchivedStory() { return this.isArchived === true; }

    /** @returns {boolean} Check if story is image */
    isImageStory() { return this.type === 'image'; }

    /** @returns {boolean} Check if story is video */
    isVideoStory() { return this.type === 'video'; }

    /** @returns {boolean} Check if story has text */
    hasText() { return this.text && this.text.trim() !== ''; }

    /** @returns {boolean} Check if story has location */
    hasLocation() { return this.location && this.location.trim() !== ''; }

    /** @returns {boolean} Check if story has tags */
    hasTags() { return this.tags && this.tags.length > 0; }

    /** @returns {boolean} Check if story has link */
    hasLink() { return this.link && this.link.trim() !== ''; }

    /** @returns {boolean} Check if story has poll */
    hasPoll() { return this.poll && this.poll.length > 0; }

    /** @returns {boolean} Check if story has questions */
    hasQuestions() { return this.questions && this.questions.length > 0; }

    /** @returns {boolean} Check if story is muted */
    isMutedStory() { return this.isMuted === true; }

    /** @returns {boolean} Check if story is hidden */
    isHiddenStory() { return this.isHidden === true; }

    /** @returns {boolean} Check if story is reported */
    isReportedStory() { return this.isReported === true; }

    /** @returns {boolean} Check if story is deleted */
    isDeletedStory() { return this.isDeleted === true; }

    /** @returns {boolean} Check if story is blocked */
    isBlockedStory() { return this.isBlocked === true; }

    // ============================================
    // TIME METHODS
    // ============================================

    /**
     * Get time remaining before expiry
     * @returns {Object} { hours, minutes, seconds, totalSeconds }
     */
    getTimeRemaining() {
        if (!this.expiresAt) return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
        const now = new Date();
        const diff = this.expiresAt - now;
        if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
        const totalSeconds = Math.floor(diff / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return { hours, minutes, seconds, totalSeconds };
    }

    /**
     * Get formatted time remaining
     * @param {string} locale - Locale
     * @returns {string} Formatted time remaining
     */
    getTimeRemainingFormatted(locale = 'en-US') {
        const { hours, minutes, seconds } = this.getTimeRemaining();
        if (hours === 0 && minutes === 0 && seconds === 0) return 'Expired';
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    }

    /**
     * Get time ago
     * @param {string} locale - Locale
     * @returns {string} Time ago
     */
    getTimeAgo(locale = 'en-US') {
        const now = new Date();
        const diff = now - this.createdAt;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
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

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Clone story
     * @param {Object} options - Clone options
     * @param {boolean} options.keepId - Keep original ID
     * @param {boolean} options.keepTimestamps - Keep original timestamps
     * @param {boolean} options.keepStats - Keep original stats
     * @param {boolean} options.extendExpiry - Extend expiry to 24 hours from now
     * @returns {Story} Cloned story
     */
    clone(options = {}) {
        const { 
            keepId = false, 
            keepTimestamps = false, 
            keepStats = false,
            extendExpiry = true
        } = options;
        
        const data = this.toFirestore({ 
            includeMetadata: true, 
            includeAnalytics: true, 
            includeInteractive: true 
        });
        
        if (!keepId) {
            delete data.id;
            data.id = this.generateId();
        }
        
        if (!keepTimestamps) {
            data.createdAt = new Date();
            data.updatedAt = new Date();
            data.archivedAt = null;
        }
        
        if (extendExpiry) {
            data.expiresAt = this.calculateExpiry().toISOString();
        }
        
        if (!keepStats) {
            data.views = 0;
            data.viewers = [];
            data.reactions = [];
            data.reactionsList = [];
            data.reactionCounts = {};
            data.viewerCount = 0;
            data.uniqueViewers = 0;
            data.linkClickCount = 0;
            data.pollVotes = 0;
            data.pollResults = {};
            data.poll = data.poll.map(p => ({ ...p, votes: 0 }));
            data.analytics = {
                totalViews: 0,
                uniqueViewers: 0,
                totalReactions: 0,
                averageViewTime: 0,
                completionRate: 0,
                dailyViews: {},
                dailyReactions: {},
                locationStats: {},
                deviceStats: { mobile: 0, desktop: 0, tablet: 0 },
                referrerStats: {}
            };
        }
        
        data.isReported = false;
        data.reportCount = 0;
        data.isBlocked = false;
        data.isDeleted = false;
        data.isMuted = false;
        data.mutedCount = 0;
        data.isHidden = false;
        data.hiddenCount = 0;
        data.isShare = false;
        data.sharedFrom = '';
        data.originalStory = null;
        
        return new Story({ ...data, id: data.id });
    }

    /**
     * Compare two stories
     * @param {Story} other - Other story
     * @returns {boolean} True if equal
     */
    equals(other) {
        if (!other) return false;
        return this.id === other.id;
    }

    /**
     * Check if story belongs to user
     * @param {string} userId - User ID
     * @returns {boolean} True if belongs to user
     */
    belongsToUser(userId) {
        return this.userId === userId;
    }

    /**
     * Check if story has tag
     * @param {string} tag - Tag to check
     * @returns {boolean} True if has tag
     */
    hasTag(tag) {
        return this.tags.some(t => t.toLowerCase() === tag.toLowerCase());
    }

    /**
     * Add tag
     * @param {string} tag - Tag to add
     * @returns {Story} Updated story (this)
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
     * @returns {Story} Updated story (this)
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
        return `Story(${this.userName}, ${this.type}, ${this.views} views)`;
    }

    /**
     * Convert to display string
     * @returns {string} Display string
     */
    toDisplayString() {
        return `${this.userName}'s Story`;
    }

    // ============================================
    // STATIC FACTORY METHODS
    // ============================================

    /**
     * Create story from Firestore data
     * @param {Object} data - Firestore data
     * @param {string} id - Document ID
     * @returns {Story} Story instance
     */
    static fromFirestore(data, id) {
        const storyData = { ...data, id };
        return new Story(storyData);
    }

    /**
     * Create stories from Firestore array
     * @param {Array} dataArray - Firestore data array
     * @returns {Array<Story>} Story instances
     */
    static fromFirestoreArray(dataArray) {
        if (!Array.isArray(dataArray)) return [];
        return dataArray.map(data => Story.fromFirestore(data, data.id));
    }

    /**
     * Create an image story
     * @param {string} userId - User ID
     * @param {string} userName - User name
     * @param {string} image - Image URL
     * @param {string} text - Text overlay
     * @param {Object} options - Options
     * @returns {Story} Image story
     */
    static createImageStory(userId, userName, image, text = '', options = {}) {
        return new Story({
            userId,
            userName,
            media: image,
            type: 'image',
            text,
            thumbnail: image,
            ...options
        });
    }

    /**
     * Create a video story
     * @param {string} userId - User ID
     * @param {string} userName - User name
     * @param {string} video - Video URL
     * @param {string} text - Text overlay
     * @param {number} duration - Duration in seconds
     * @param {Object} options - Options
     * @returns {Story} Video story
     */
    static createVideoStory(userId, userName, video, text = '', duration = 15, options = {}) {
        return new Story({
            userId,
            userName,
            media: video,
            type: 'video',
            text,
            duration,
            thumbnail: options.thumbnail || '',
            ...options
        });
    }

    /**
     * Create a highlight story
     * @param {string} userId - User ID
     * @param {string} userName - User name
     * @param {string} highlightId - Highlight ID
     * @param {string} highlightName - Highlight name
     * @param {string} media - Media URL
     * @param {string} type - Media type
     * @param {Object} options - Options
     * @returns {Story} Highlight story
     */
    static createHighlightStory(userId, userName, highlightId, highlightName, media, type = 'image', options = {}) {
        return new Story({
            userId,
            userName,
            media,
            type,
            isHighlight: true,
            highlightId,
            highlightName,
            highlightCover: media,
            isArchived: true,
            archivedAt: new Date(),
            ...options
        });
    }

    /**
     * Create a text-only story
     * @param {string} userId - User ID
     * @param {string} userName - User name
     * @param {string} text - Text content
     * @param {Object} options - Options
     * @param {string} options.backgroundColor - Background color
     * @param {string} options.textColor - Text color
     * @param {string} options.font - Font name
     * @returns {Story} Text story
     */
    static createTextStory(userId, userName, text, options = {}) {
        return new Story({
            userId,
            userName,
            media: '',
            type: 'image',
            text,
            backgroundColor: options.backgroundColor || '#6366f1',
            textColor: options.textColor || '#ffffff',
            font: options.font || 'default',
            ...options
        });
    }

    // ============================================
    // STATIC QUERY & FILTER METHODS
    // ============================================

    /**
     * Filter stories by user
     * @param {Array<Story>} stories - Stories array
     * @param {string} userId - User ID
     * @returns {Array<Story>} Filtered stories
     */
    static filterByUser(stories, userId) {
        if (!userId) return stories;
        return stories.filter(s => s.userId === userId);
    }

    /**
     * Filter stories by type
     * @param {Array<Story>} stories - Stories array
     * @param {string|Array<string>} types - Type(s) to filter
     * @returns {Array<Story>} Filtered stories
     */
    static filterByType(stories, types) {
        if (!types) return stories;
        if (!Array.isArray(types)) types = [types];
        return stories.filter(s => types.includes(s.type));
    }

    /**
     * Filter active stories (not expired, not deleted, not blocked)
     * @param {Array<Story>} stories - Stories array
     * @returns {Array<Story>} Active stories
     */
    static filterActive(stories) {
        return stories.filter(s => s.isActive());
    }

    /**
     * Filter expired stories
     * @param {Array<Story>} stories - Stories array
     * @returns {Array<Story>} Expired stories
     */
    static filterExpired(stories) {
        return stories.filter(s => s.isExpired());
    }

    /**
     * Filter highlight stories
     * @param {Array<Story>} stories - Stories array
     * @returns {Array<Story>} Highlight stories
     */
    static filterHighlights(stories) {
        return stories.filter(s => s.isHighlight && !s.isDeleted && !s.isBlocked);
    }

    /**
     * Filter by visibility
     * @param {Array<Story>} stories - Stories array
     * @param {string} visibility - 'public', 'friends', 'custom'
     * @returns {Array<Story>} Filtered stories
     */
    static filterByVisibility(stories, visibility) {
        if (!visibility) return stories;
        return stories.filter(s => s.visibility === visibility);
    }

    /**
     * Get stories grouped by user
     * @param {Array<Story>} stories - Stories array
     * @returns {Object} Grouped by user
     */
    static groupByUser(stories) {
        const groups = {};
        for (const story of stories) {
            const key = story.userId || 'unknown';
            if (!groups[key]) groups[key] = [];
            groups[key].push(story);
        }
        return groups;
    }

    /**
     * Get stories grouped by highlight
     * @param {Array<Story>} stories - Stories array
     * @returns {Object} Grouped by highlight
     */
    static groupByHighlight(stories) {
        const groups = {};
        for (const story of stories) {
            if (!story.isHighlight) continue;
            const key = story.highlightId || story.id;
            if (!groups[key]) {
                groups[key] = {
                    id: key,
                    name: story.highlightName || 'Highlight',
                    cover: story.highlightCover || story.thumbnail || story.media,
                    userId: story.userId,
                    userName: story.userName,
                    userPhoto: story.userPhoto,
                    stories: []
                };
            }
            groups[key].stories.push(story);
        }
        return groups;
    }

    /**
     * Sort stories by date
     * @param {Array<Story>} stories - Stories array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<Story>} Sorted stories
     */
    static sortByDate(stories, order = 'desc') {
        const sorted = [...stories];
        sorted.sort((a, b) => {
            const aTime = a.createdAt.getTime();
            const bTime = b.createdAt.getTime();
            return order === 'asc' ? aTime - bTime : bTime - aTime;
        });
        return sorted;
    }

    /**
     * Sort stories by views
     * @param {Array<Story>} stories - Stories array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<Story>} Sorted stories
     */
    static sortByViews(stories, order = 'desc') {
        const sorted = [...stories];
        sorted.sort((a, b) => {
            return order === 'asc' ? (a.views || 0) - (b.views || 0) : (b.views || 0) - (a.views || 0);
        });
        return sorted;
    }

    /**
     * Get most viewed stories
     * @param {Array<Story>} stories - Stories array
     * @param {number} limit - Limit
     * @returns {Array<Story>} Most viewed stories
     */
    static getMostViewed(stories, limit = 10) {
        return Story.sortByViews(stories, 'desc').slice(0, limit);
    }

    /**
     * Get recent stories
     * @param {Array<Story>} stories - Stories array
     * @param {number} limit - Limit
     * @param {number} hours - Hours window
     * @returns {Array<Story>} Recent stories
     */
    static getRecent(stories, limit = 10, hours = 24) {
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - hours);
        const recent = stories.filter(s => s.createdAt >= cutoff);
        return Story.sortByDate(recent, 'desc').slice(0, limit);
    }

    /**
     * Check if story data is valid
     * @param {Object} data - Story data
     * @returns {boolean} True if valid
     */
    static isValidStoryData(data) {
        return data && typeof data === 'object' &&
            data.userId && data.userId.trim() !== '' &&
            data.media && data.media.trim() !== '';
    }

    /**
     * Get user's active stories
     * @param {Array<Story>} stories - Stories array
     * @param {string} userId - User ID
     * @returns {Array<Story>} User's active stories
     */
    static getUserActiveStories(stories, userId) {
        return stories.filter(s => s.userId === userId && s.isActive());
    }

    /**
     * Get user's stories for feed
     * @param {Array<Story>} stories - Stories array
     * @param {Array<string>} following - Following user IDs
     * @param {number} limit - Limit per user
     * @returns {Array<Story>} Feed stories
     */
    static getFeedStories(stories, following, limit = 3) {
        if (!following || following.length === 0) return [];
        
        const userStories = Story.groupByUser(stories);
        const feedStories = [];
        
        for (const userId of following) {
            if (userStories[userId]) {
                const active = userStories[userId].filter(s => s.isActive());
                const sorted = Story.sortByDate(active, 'desc');
                feedStories.push(...sorted.slice(0, limit));
            }
        }
        
        return Story.sortByDate(feedStories, 'desc');
    }
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default Story;

// ============================================================
// END OF FILE: story-model.js
// ============================================================