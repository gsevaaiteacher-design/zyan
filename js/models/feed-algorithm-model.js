// Feed Algorithm Model
// ============================================================
// FILE: feed-algorithm-model.js
// PURPOSE: Feed Algorithm for Social Feed (Follow + Interest + Engagement + Time)
// VERSION: 3.0.0 (Production Ready)
// DEPENDENCY: NONE
// USED BY: feed-service.js, social-feed.js, home-screen.js
// LOCATION: js/models/feed-algorithm-model.js
// ============================================================

// ============================================================
// FEED ALGORITHM CLASS - ZYMORE v3.0 SOCIAL FEED
// ============================================================

/**
 * FeedAlgorithm Model Class
 * Represents the feed algorithm for social feed in ZYMORE
 * 
 * ZYMORE v3.0 Features:
 * - Follow Based Score (40% weight)
 * - Interest Based Score (30% weight)
 * - Engagement Based Score (20% weight)
 * - Time Based Score (10% weight)
 * - Combined Final Score
 * - Personalization
 * - Trending detection
 * - Content diversity
 * - User behavior learning
 * - Real-time scoring
 * - Batch scoring
 * - A/B testing support
 */
export class FeedAlgorithm {
    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * Create a new FeedAlgorithm instance
     * @param {Object} data - Feed algorithm data
     * @param {string} data.id - Algorithm run ID
     * @param {string} data.userId - User ID
     * @param {number} data.followScore - Follow based score (0-100)
     * @param {number} data.interestScore - Interest based score (0-100)
     * @param {number} data.engagementScore - Engagement based score (0-100)
     * @param {number} data.timeScore - Time based score (0-100)
     * @param {number} data.finalScore - Combined final score (0-100)
     * @param {Object} data.weights - Weight configuration
     * @param {Object} data.context - Algorithm context
     * @param {Object} data.metadata - Additional metadata
     * @param {Object} data.analytics - Analytics data
     * @param {Date|string} data.calculatedAt - Calculation timestamp
     * @param {Date|string} data.createdAt - Creation date
     * @param {Date|string} data.updatedAt - Last update date
     * @param {string} data.version - Algorithm version
     * @param {boolean} data.isActive - Active status
     * @param {Object} data.userBehavior - User behavior data
     * @param {Object} data.contentFeatures - Content features
     * @param {Array<Object>} data.feedItems - Feed items with scores
     */
    constructor(data = {}) {
        // ============================================
        // 📌 BASIC INFORMATION
        // ============================================
        this.id = data.id || data.algorithmId || this.generateId();
        this.userId = data.userId || '';
        this.version = data.version || '3.0.0';
        this.type = data.type || 'social_feed'; // 'social_feed' | 'product_feed' | 'mixed'
        
        // ============================================
        // 📊 SCORES
        // ============================================
        this.followScore = data.followScore || 0;
        this.interestScore = data.interestScore || 0;
        this.engagementScore = data.engagementScore || 0;
        this.timeScore = data.timeScore || 0;
        this.finalScore = data.finalScore || 0;
        this.normalizedScore = data.normalizedScore || 0;
        this.rawScore = data.rawScore || 0;
        
        // ============================================
        // ⚖️ WEIGHTS
        // ============================================
        this.weights = {
            follow: data.weights?.follow !== undefined ? data.weights.follow : 0.4,
            interest: data.weights?.interest !== undefined ? data.weights.interest : 0.3,
            engagement: data.weights?.engagement !== undefined ? data.weights.engagement : 0.2,
            time: data.weights?.time !== undefined ? data.weights.time : 0.1,
            diversity: data.weights?.diversity !== undefined ? data.weights.diversity : 0.05,
            quality: data.weights?.quality !== undefined ? data.weights.quality : 0.05,
            ...data.weights
        };
        
        // ============================================
        // 📋 CONTEXT
        // ============================================
        this.context = {
            userInterests: Array.isArray(data.context?.userInterests) ? [...data.context.userInterests] : [],
            following: Array.isArray(data.context?.following) ? [...data.context.following] : [],
            engagementHistory: Array.isArray(data.context?.engagementHistory) ? [...data.context.engagementHistory] : [],
            viewedPosts: Array.isArray(data.context?.viewedPosts) ? [...data.context.viewedPosts] : [],
            interactedPosts: Array.isArray(data.context?.interactedPosts) ? [...data.context.interactedPosts] : [],
            savedPosts: Array.isArray(data.context?.savedPosts) ? [...data.context.savedPosts] : [],
            sharedPosts: Array.isArray(data.context?.sharedPosts) ? [...data.context.sharedPosts] : [],
            timeSpent: data.context?.timeSpent || {},
            deviceInfo: data.context?.deviceInfo || {},
            location: data.context?.location || {},
            timezone: data.context?.timezone || 'UTC',
            language: data.context?.language || 'en',
            sessionId: data.context?.sessionId || '',
            platform: data.context?.platform || 'web',
            ...data.context
        };
        
        // ============================================
        // 👤 USER BEHAVIOR
        // ============================================
        this.userBehavior = {
            averageSessionDuration: data.userBehavior?.averageSessionDuration || 0,
            averageLikesPerSession: data.userBehavior?.averageLikesPerSession || 0,
            averageCommentsPerSession: data.userBehavior?.averageCommentsPerSession || 0,
            averageSharesPerSession: data.userBehavior?.averageSharesPerSession || 0,
            averageSavesPerSession: data.userBehavior?.averageSavesPerSession || 0,
            preferredCategories: Array.isArray(data.userBehavior?.preferredCategories) ? [...data.userBehavior.preferredCategories] : [],
            preferredContentTypes: Array.isArray(data.userBehavior?.preferredContentTypes) ? [...data.userBehavior.preferredContentTypes] : [],
            activeHours: Array.isArray(data.userBehavior?.activeHours) ? [...data.userBehavior.activeHours] : [],
            engagementPattern: data.userBehavior?.engagementPattern || {},
            contentAffinities: data.userBehavior?.contentAffinities || {},
            authorAffinities: data.userBehavior?.authorAffinities || {},
            topicAffinities: data.userBehavior?.topicAffinities || {},
            recencyPreference: data.userBehavior?.recencyPreference || 0.5,
            diversityPreference: data.userBehavior?.diversityPreference || 0.3,
            ...data.userBehavior
        };
        
        // ============================================
        // 📦 FEED ITEMS
        // ============================================
        this.feedItems = Array.isArray(data.feedItems) ? [...data.feedItems] : [];
        this.itemCount = data.itemCount || 0;
        this.processedCount = data.processedCount || 0;
        this.feedLimit = data.feedLimit || 50;
        this.offset = data.offset || 0;
        this.hasMore = data.hasMore !== undefined ? data.hasMore : true;
        this.cursor = data.cursor || '';
        
        // ============================================
        // 📊 ANALYTICS
        // ============================================
        this.analytics = {
            totalCalculations: data.analytics?.totalCalculations || 0,
            averageProcessingTime: data.analytics?.averageProcessingTime || 0,
            totalItemsProcessed: data.analytics?.totalItemsProcessed || 0,
            uniqueUsers: data.analytics?.uniqueUsers || 0,
            scoresDistribution: data.analytics?.scoresDistribution || {},
            performanceMetrics: data.analytics?.performanceMetrics || {},
            dailyStats: data.analytics?.dailyStats || {},
            weeklyStats: data.analytics?.weeklyStats || {},
            monthlyStats: data.analytics?.monthlyStats || {},
            ...data.analytics
        };
        
        // ============================================
        // ⏰ TIMESTAMPS
        // ============================================
        this.calculatedAt = data.calculatedAt ? new Date(data.calculatedAt) : new Date();
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
        this.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
        this.lastActivityAt = data.lastActivityAt ? new Date(data.lastActivityAt) : null;
        
        // ============================================
        // 🏷️ TAGS & CATEGORY
        // ============================================
        this.tags = Array.isArray(data.tags) ? [...data.tags] : [];
        this.category = data.category || 'general';
        this.feedType = data.feedType || 'social'; // 'social' | 'product' | 'mixed' | 'trending' | 'recommended'
        
        // ============================================
        // 🚩 STATUS FLAGS
        // ============================================
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.isPersonalized = data.isPersonalized !== undefined ? data.isPersonalized : true;
        this.isCached = data.isCached || false;
        this.isStale = data.isStale || false;
        this.isDeleted = data.isDeleted || false;
        this.isValid = data.isValid !== undefined ? data.isValid : true;
        
        // ============================================
        // 🎛️ CONFIGURATION
        // ============================================
        this.config = {
            maxItems: data.config?.maxItems || 50,
            minScore: data.config?.minScore || 10,
            diversityThreshold: data.config?.diversityThreshold || 0.3,
            recencyWeight: data.config?.recencyWeight || 0.5,
            personalizationLevel: data.config?.personalizationLevel || 1.0,
            exploreExploitRatio: data.config?.exploreExploitRatio || 0.3,
            freshnessWeight: data.config?.freshnessWeight || 0.4,
            popularityWeight: data.config?.popularityWeight || 0.3,
            relevanceWeight: data.config?.relevanceWeight || 0.3,
            boostFreshContent: data.config?.boostFreshContent || false,
            boostPopularContent: data.config?.boostPopularContent || false,
            boostDiverseContent: data.config?.boostDiverseContent || false,
            ...data.config
        };
        
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
     * Generate a unique algorithm run ID
     * @returns {string} Unique ID
     */
    generateId() {
        return `fa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // ============================================
    // VALIDATION
    // ============================================

    /**
     * Validate feed algorithm data
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

        // === SCORES ===
        if (this.followScore < 0 || this.followScore > 100) {
            warnings.push('Follow score should be between 0 and 100');
        }
        if (this.interestScore < 0 || this.interestScore > 100) {
            warnings.push('Interest score should be between 0 and 100');
        }
        if (this.engagementScore < 0 || this.engagementScore > 100) {
            warnings.push('Engagement score should be between 0 and 100');
        }
        if (this.timeScore < 0 || this.timeScore > 100) {
            warnings.push('Time score should be between 0 and 100');
        }
        if (this.finalScore < 0 || this.finalScore > 100) {
            warnings.push('Final score should be between 0 and 100');
        }

        // === WEIGHTS ===
        const totalWeight = (this.weights.follow || 0) + 
                           (this.weights.interest || 0) + 
                           (this.weights.engagement || 0) + 
                           (this.weights.time || 0);
        if (Math.abs(totalWeight - 1) > 0.01) {
            warnings.push(`Total weights should sum to 1 (currently ${totalWeight})`);
        }

        // === FEED ITEMS ===
        if (this.feedItems && this.feedItems.length > 1000) {
            warnings.push('Feed items exceeds 1000 items');
        }

        // === FEED TYPE ===
        const validFeedTypes = ['social', 'product', 'mixed', 'trending', 'recommended'];
        if (this.feedType && !validFeedTypes.includes(this.feedType)) {
            warnings.push(`Invalid feed type. Must be one of: ${validFeedTypes.join(', ')}`);
        }

        // === STRICT VALIDATION ===
        if (strict) {
            if (!this.context.userInterests || this.context.userInterests.length === 0) {
                warnings.push('User interests are recommended for personalization');
            }
            if (!this.feedItems || this.feedItems.length === 0) {
                warnings.push('No feed items generated');
            }
        }

        return {
            isValid: errors.length === 0,
            hasWarnings: warnings.length > 0,
            errors: errors,
            warnings: warnings
        };
    }

    // ============================================
    // CONVERSION METHODS
    // ============================================

    /**
     * Convert to Firestore document
     * @param {Object} options - Conversion options
     * @param {boolean} options.includeMetadata - Include metadata
     * @param {boolean} options.includeAnalytics - Include analytics
     * @param {boolean} options.includeContext - Include context
     * @param {boolean} options.includeBehavior - Include user behavior
     * @param {boolean} options.includeItems - Include feed items
     * @returns {Object} Firestore document
     */
    toFirestore(options = {}) {
        const { 
            includeMetadata = true, 
            includeAnalytics = true, 
            includeContext = true,
            includeBehavior = true,
            includeItems = true
        } = options;

        const data = {
            userId: this.userId,
            version: this.version,
            type: this.type,
            followScore: this.followScore,
            interestScore: this.interestScore,
            engagementScore: this.engagementScore,
            timeScore: this.timeScore,
            finalScore: this.finalScore,
            normalizedScore: this.normalizedScore,
            rawScore: this.rawScore,
            weights: { ...this.weights },
            calculatedAt: this.calculatedAt.toISOString(),
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            expiresAt: this.expiresAt ? this.expiresAt.toISOString() : null,
            lastActivityAt: this.lastActivityAt ? this.lastActivityAt.toISOString() : null,
            tags: [...this.tags],
            category: this.category,
            feedType: this.feedType,
            isActive: this.isActive,
            isPersonalized: this.isPersonalized,
            isCached: this.isCached,
            isStale: this.isStale,
            isDeleted: this.isDeleted,
            isValid: this.isValid,
            config: { ...this.config },
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

        if (includeContext) {
            data.context = { ...this.context };
        }

        if (includeBehavior) {
            data.userBehavior = { ...this.userBehavior };
        }

        if (includeItems) {
            data.feedItems = [...this.feedItems];
            data.itemCount = this.itemCount;
            data.processedCount = this.processedCount;
            data.feedLimit = this.feedLimit;
            data.offset = this.offset;
            data.hasMore = this.hasMore;
            data.cursor = this.cursor;
        }

        return data;
    }

    /**
     * Convert to JSON
     * @param {Object} options - Conversion options
     * @param {boolean} options.includePrivate - Include private fields
     * @param {boolean} options.includeMetadata - Include metadata
     * @param {boolean} options.includeAnalytics - Include analytics
     * @param {boolean} options.includeContext - Include context
     * @param {boolean} options.includeBehavior - Include user behavior
     * @param {boolean} options.includeItems - Include feed items
     * @returns {Object} JSON object
     */
    toJSON(options = {}) {
        const { 
            includePrivate = false, 
            includeMetadata = false, 
            includeAnalytics = false,
            includeContext = false,
            includeBehavior = false,
            includeItems = false
        } = options;

        const data = {
            id: this.id,
            userId: this.userId,
            version: this.version,
            type: this.type,
            followScore: this.followScore,
            interestScore: this.interestScore,
            engagementScore: this.engagementScore,
            timeScore: this.timeScore,
            finalScore: this.finalScore,
            normalizedScore: this.normalizedScore,
            rawScore: this.rawScore,
            weights: { ...this.weights },
            calculatedAt: this.calculatedAt.toISOString(),
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            expiresAt: this.expiresAt ? this.expiresAt.toISOString() : null,
            lastActivityAt: this.lastActivityAt ? this.lastActivityAt.toISOString() : null,
            tags: [...this.tags],
            category: this.category,
            feedType: this.feedType,
            isActive: this.isActive,
            isPersonalized: this.isPersonalized,
            isCached: this.isCached,
            isStale: this.isStale,
            isDeleted: this.isDeleted,
            isValid: this.isValid,
            config: { ...this.config },
            feedLimit: this.feedLimit,
            offset: this.offset,
            hasMore: this.hasMore,
            cursor: this.cursor
        };

        if (includePrivate) {
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

        if (includeContext) {
            data.context = { ...this.context };
        }

        if (includeBehavior) {
            data.userBehavior = { ...this.userBehavior };
        }

        if (includeItems) {
            data.feedItems = [...this.feedItems];
            data.itemCount = this.itemCount;
            data.processedCount = this.processedCount;
        }

        return data;
    }

    /**
     * Get public feed algorithm data
     * @param {Object} options - Options
     * @param {boolean} options.includeItems - Include feed items
     * @param {number} options.itemLimit - Item limit
     * @returns {Object} Public feed algorithm data
     */
    getPublicData(options = {}) {
        const { includeItems = true, itemLimit = 20 } = options;

        const data = {
            id: this.id,
            userId: this.userId,
            feedType: this.feedType,
            finalScore: this.finalScore,
            calculatedAt: this.calculatedAt.toISOString(),
            createdAt: this.createdAt.toISOString(),
            isPersonalized: this.isPersonalized,
            feedLimit: this.feedLimit,
            offset: this.offset,
            hasMore: this.hasMore,
            cursor: this.cursor
        };

        if (includeItems) {
            const items = this.feedItems.slice(0, itemLimit);
            data.feedItems = items.map(item => ({
                id: item.id,
                score: item.score,
                position: item.position,
                type: item.type,
                title: item.title,
                thumbnail: item.thumbnail,
                author: item.author,
                createdAt: item.createdAt
            }));
            data.itemCount = this.itemCount;
            data.processedCount = this.processedCount;
        }

        return data;
    }

    /**
     * Get minimal feed algorithm data
     * @param {Object} options - Options
     * @param {boolean} options.includeItems - Include feed items
     * @param {number} options.itemLimit - Item limit
     * @returns {Object} Minimal feed algorithm data
     */
    getMinimalData(options = {}) {
        const { includeItems = true, itemLimit = 10 } = options;

        const data = {
            id: this.id,
            userId: this.userId,
            feedType: this.feedType,
            finalScore: this.finalScore,
            calculatedAt: this.calculatedAt.toISOString(),
            hasMore: this.hasMore,
            cursor: this.cursor
        };

        if (includeItems) {
            const items = this.feedItems.slice(0, itemLimit);
            data.feedItems = items.map(item => ({
                id: item.id,
                score: item.score,
                position: item.position
            }));
        }

        return data;
    }

    // ============================================
    // SCORING METHODS
    // ============================================

    /**
     * Calculate follow score
     * @param {string} userId - User ID to check
     * @param {Array<string>} following - Following list
     * @param {Object} options - Options
     * @param {number} options.weight - Weight for this score
     * @returns {number} Follow score (0-100)
     */
    calculateFollowScore(userId, following, options = {}) {
        const { weight = this.weights.follow || 0.4 } = options;
        if (!following || following.length === 0) return 0;
        const score = following.includes(userId) ? 100 : 0;
        this.followScore = score;
        return score;
    }

    /**
     * Calculate interest score
     * @param {Array<string>} itemTags - Item tags
     * @param {Array<string>} userInterests - User interests
     * @param {Object} options - Options
     * @param {number} options.weight - Weight for this score
     * @param {number} options.minMatch - Minimum matches threshold
     * @returns {number} Interest score (0-100)
     */
    calculateInterestScore(itemTags, userInterests, options = {}) {
        const { weight = this.weights.interest || 0.3, minMatch = 1 } = options;
        if (!userInterests || userInterests.length === 0) return 0;
        if (!itemTags || itemTags.length === 0) return 0;

        let matchCount = 0;
        for (const tag of itemTags) {
            if (userInterests.some(interest => 
                interest.toLowerCase() === tag.toLowerCase() ||
                interest.toLowerCase().includes(tag.toLowerCase()) ||
                tag.toLowerCase().includes(interest.toLowerCase())
            )) {
                matchCount++;
            }
        }

        const score = Math.min(100, (matchCount / Math.max(1, itemTags.length)) * 100);
        this.interestScore = score;
        return score;
    }

    /**
     * Calculate engagement score
     * @param {Object} item - Feed item
     * @param {Object} userHistory - User engagement history
     * @param {Object} options - Options
     * @param {number} options.weight - Weight for this score
     * @param {number} options.maxEngagement - Maximum engagement threshold
     * @returns {number} Engagement score (0-100)
     */
    calculateEngagementScore(item, userHistory, options = {}) {
        const { weight = this.weights.engagement || 0.2, maxEngagement = 100 } = options;
        
        if (!userHistory || !item) return 0;
        
        const itemEngagement = (item.likes || 0) + (item.comments || 0) + (item.shares || 0);
        const avgEngagement = userHistory.averageEngagement || 50;
        
        let score = 0;
        if (avgEngagement > 0) {
            score = Math.min(100, (itemEngagement / avgEngagement) * 50);
        } else {
            score = Math.min(100, itemEngagement / maxEngagement * 100);
        }
        
        this.engagementScore = score;
        return score;
    }

    /**
     * Calculate time score
     * @param {Date} createdAt - Item creation date
     * @param {Object} options - Options
     * @param {number} options.weight - Weight for this score
     * @param {number} options.hoursWindow - Time window in hours
     * @returns {number} Time score (0-100)
     */
    calculateTimeScore(createdAt, options = {}) {
        const { weight = this.weights.time || 0.1, hoursWindow = 24 } = options;
        
        if (!createdAt) return 0;
        
        const now = new Date();
        const diffHours = (now - createdAt) / (1000 * 60 * 60);
        
        let score = 100;
        if (diffHours > hoursWindow) {
            score = Math.max(0, 100 - ((diffHours - hoursWindow) / hoursWindow) * 50);
        }
        
        this.timeScore = score;
        return score;
    }

    /**
     * Calculate final score
     * @param {Object} scores - Individual scores
     * @param {number} scores.followScore - Follow score
     * @param {number} scores.interestScore - Interest score
     * @param {number} scores.engagementScore - Engagement score
     * @param {number} scores.timeScore - Time score
     * @param {Object} options - Options
     * @param {Object} options.weights - Custom weights
     * @param {boolean} options.normalize - Normalize final score
     * @returns {number} Final score (0-100)
     */
    calculateFinalScore(scores = {}, options = {}) {
        const { weights = this.weights, normalize = true } = options;
        
        const followScore = scores.followScore || this.followScore || 0;
        const interestScore = scores.interestScore || this.interestScore || 0;
        const engagementScore = scores.engagementScore || this.engagementScore || 0;
        const timeScore = scores.timeScore || this.timeScore || 0;
        
        const finalScore = (followScore * (weights.follow || 0.4)) +
                          (interestScore * (weights.interest || 0.3)) +
                          (engagementScore * (weights.engagement || 0.2)) +
                          (timeScore * (weights.time || 0.1));
        
        this.finalScore = normalize ? Math.min(100, Math.max(0, finalScore)) : finalScore;
        return this.finalScore;
    }

    /**
     * Calculate all scores for an item
     * @param {Object} item - Feed item
     * @param {Object} context - Context for scoring
     * @param {Object} options - Options
     * @returns {Object} All scores
     */
    calculateAllScores(item, context = {}, options = {}) {
        const { userInterests = [], following = [], engagementHistory = [] } = context;
        
        const followScore = this.calculateFollowScore(item.userId, following);
        const interestScore = this.calculateInterestScore(item.tags || [], userInterests);
        const engagementScore = this.calculateEngagementScore(item, { averageEngagement: 50 });
        const timeScore = this.calculateTimeScore(item.createdAt || new Date());
        
        const finalScore = this.calculateFinalScore({
            followScore,
            interestScore,
            engagementScore,
            timeScore
        });
        
        return {
            followScore,
            interestScore,
            engagementScore,
            timeScore,
            finalScore,
            normalizedScore: finalScore / 100
        };
    }

    /**
     * Score multiple items
     * @param {Array<Object>} items - Items to score
     * @param {Object} context - Scoring context
     * @param {Object} options - Options
     * @param {boolean} options.sort - Sort by score
     * @param {boolean} options.limit - Limit results
     * @returns {Array<Object>} Scored items
     */
    scoreItems(items, context = {}, options = {}) {
        const { sort = true, limit = 50 } = options;
        const scoredItems = [];
        
        for (const item of items) {
            const scores = this.calculateAllScores(item, context);
            scoredItems.push({
                ...item,
                scores: scores,
                score: scores.finalScore
            });
        }
        
        if (sort) {
            scoredItems.sort((a, b) => b.score - a.score);
        }
        
        this.feedItems = scoredItems.slice(0, limit);
        this.itemCount = this.feedItems.length;
        this.processedCount = items.length;
        this.calculatedAt = new Date();
        this.updatedAt = new Date();
        
        return this.feedItems;
    }

    // ============================================
    // FEED GENERATION METHODS
    // ============================================

    /**
     * Generate feed
     * @param {Array<Object>} items - Available items
     * @param {Object} context - Generation context
     * @param {Object} options - Options
     * @param {number} options.limit - Items limit
     * @param {number} options.offset - Items offset
     * @param {boolean} options.diversify - Diversify feed
     * @param {number} options.diversityFactor - Diversity factor
     * @param {string} options.sortBy - Sort field
     * @param {string} options.sortOrder - Sort order
     * @param {Array<string>} options.exclude - Exclude item IDs
     * @returns {Object} Generated feed
     */
    generateFeed(items, context = {}, options = {}) {
        const {
            limit = 50,
            offset = 0,
            diversify = true,
            diversityFactor = 0.3,
            sortBy = 'finalScore',
            sortOrder = 'desc',
            exclude = []
        } = options;

        // Filter excluded items
        let filteredItems = items.filter(item => !exclude.includes(item.id));
        
        // Score items
        const scoredItems = this.scoreItems(filteredItems, context);
        
        // Apply diversity
        let feedItems = scoredItems;
        if (diversify) {
            feedItems = this.diversifyFeed(scoredItems, diversityFactor);
        }
        
        // Sort
        feedItems.sort((a, b) => {
            const aVal = a[sortBy] || a.scores?.[sortBy] || a.score || 0;
            const bVal = b[sortBy] || b.scores?.[sortBy] || b.score || 0;
            return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
        });
        
        // Apply offset and limit
        const paginatedItems = feedItems.slice(offset, offset + limit);
        const hasMore = feedItems.length > offset + limit;
        const nextCursor = hasMore ? String(offset + limit) : '';
        
        this.feedItems = paginatedItems;
        this.itemCount = paginatedItems.length;
        this.processedCount = feedItems.length;
        this.feedLimit = limit;
        this.offset = offset;
        this.hasMore = hasMore;
        this.cursor = nextCursor;
        this.calculatedAt = new Date();
        this.updatedAt = new Date();
        
        return {
            items: paginatedItems,
            hasMore,
            cursor: nextCursor,
            total: feedItems.length,
            limit,
            offset
        };
    }

    /**
     * Diversify feed
     * @param {Array<Object>} items - Items to diversify
     * @param {number} factor - Diversity factor (0-1)
     * @returns {Array<Object>} Diversified items
     */
    diversifyFeed(items, factor = 0.3) {
        if (items.length === 0) return items;
        if (factor <= 0) return items;
        
        const result = [];
        const categories = {};
        const itemsByCategory = {};
        
        // Group by category
        for (const item of items) {
            const category = item.category || 'uncategorized';
            if (!itemsByCategory[category]) {
                itemsByCategory[category] = [];
                categories[category] = 0;
            }
            itemsByCategory[category].push(item);
        }
        
        // Calculate max per category
        const totalItems = items.length;
        const maxPerCategory = Math.max(1, Math.floor((totalItems * (1 - factor)) / Object.keys(categories).length));
        
        // Distribute items
        let remaining = totalItems;
        let iterations = 0;
        const maxIterations = totalItems * 2;
        
        while (remaining > 0 && iterations < maxIterations) {
            iterations++;
            for (const category of Object.keys(categories)) {
                if (itemsByCategory[category] && itemsByCategory[category].length > 0) {
                    const item = itemsByCategory[category].shift();
                    result.push(item);
                    remaining--;
                }
            }
        }
        
        // Add remaining items (if any)
        for (const category of Object.keys(itemsByCategory)) {
            while (itemsByCategory[category] && itemsByCategory[category].length > 0) {
                result.push(itemsByCategory[category].shift());
            }
        }
        
        return result;
    }

    /**
     * Get feed recommendations
     * @param {Array<Object>} items - Available items
     * @param {Object} context - Context
     * @param {number} limit - Items limit
     * @returns {Array<Object>} Recommended items
     */
    getRecommendations(items, context = {}, limit = 10) {
        const scored = this.scoreItems(items, context);
        return scored.slice(0, limit);
    }

    /**
     * Get trending items
     * @param {Array<Object>} items - Items to check
     * @param {Object} options - Options
     * @param {number} options.hoursWindow - Trending window in hours
     * @param {number} options.minEngagement - Minimum engagement
     * @param {number} options.limit - Items limit
     * @returns {Array<Object>} Trending items
     */
    getTrending(items, options = {}) {
        const { hoursWindow = 24, minEngagement = 10, limit = 10 } = options;
        
        const now = new Date();
        const cutoff = new Date(now);
        cutoff.setHours(cutoff.getHours() - hoursWindow);
        
        const trending = items.filter(item => {
            const createdAt = item.createdAt ? new Date(item.createdAt) : new Date();
            const engagement = (item.likes || 0) + (item.comments || 0) + (item.shares || 0);
            return createdAt >= cutoff && engagement >= minEngagement;
        });
        
        // Score trending items
        for (const item of trending) {
            const engagement = (item.likes || 0) + (item.comments || 0) + (item.shares || 0);
            const age = (now - new Date(item.createdAt)) / (1000 * 60 * 60);
            item.trendingScore = engagement / (age + 1);
        }
        
        trending.sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
        return trending.slice(0, limit);
    }

    // ============================================
    // USER BEHAVIOR METHODS
    // ============================================

    /**
     * Update user behavior
     * @param {Object} behavior - Behavior data
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {FeedAlgorithm} Updated feed algorithm (this)
     */
    updateUserBehavior(behavior, options = {}) {
        const { emitEvent = true } = options;
        
        this.userBehavior = {
            ...this.userBehavior,
            ...behavior,
            updatedAt: new Date()
        };
        this.updatedAt = new Date();
        
        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('feed:behavior_updated', { userId: this.userId, behavior });
        }
        
        return this;
    }

    /**
     * Record engagement
     * @param {string} itemId - Item ID
     * @param {string} engagementType - Engagement type (like, comment, share, save, view)
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {FeedAlgorithm} Updated feed algorithm (this)
     */
    recordEngagement(itemId, engagementType, options = {}) {
        const { emitEvent = true } = options;
        
        // Update engagement history
        if (!this.context.engagementHistory) {
            this.context.engagementHistory = [];
        }
        
        this.context.engagementHistory.push({
            itemId,
            type: engagementType,
            timestamp: new Date()
        });
        
        // Update viewed/interacted posts
        if (engagementType === 'view') {
            if (!this.context.viewedPosts) this.context.viewedPosts = [];
            if (!this.context.viewedPosts.includes(itemId)) {
                this.context.viewedPosts.push(itemId);
            }
        } else {
            if (!this.context.interactedPosts) this.context.interactedPosts = [];
            if (!this.context.interactedPosts.includes(itemId)) {
                this.context.interactedPosts.push(itemId);
            }
        }
        
        this.updatedAt = new Date();
        
        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('feed:engagement', { 
                userId: this.userId, 
                itemId, 
                engagementType 
            });
        }
        
        return this;
    }

    /**
     * Get user's content affinities
     * @param {Array<Object>} items - Items to analyze
     * @param {Object} options - Options
     * @param {number} options.limit - Number of affinities
     * @returns {Object} Content affinities
     */
    getContentAffinities(items, options = {}) {
        const { limit = 10 } = options;
        const affinities = {};
        
        // Analyze interacted posts
        const interactedItems = items.filter(item => 
            this.context.interactedPosts?.includes(item.id)
        );
        
        for (const item of interactedItems) {
            // Category affinity
            if (item.category) {
                affinities[item.category] = (affinities[item.category] || 0) + 1;
            }
            
            // Tag affinity
            if (item.tags) {
                for (const tag of item.tags) {
                    affinities[tag] = (affinities[tag] || 0) + 1;
                }
            }
            
            // Author affinity
            if (item.userId) {
                const key = `author_${item.userId}`;
                affinities[key] = (affinities[key] || 0) + 1;
            }
        }
        
        // Sort and limit
        const sorted = Object.entries(affinities)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);
        
        const result = {};
        for (const [key, value] of sorted) {
            result[key] = value;
        }
        
        this.userBehavior.contentAffinities = result;
        return result;
    }

    // ============================================
    // STATUS METHODS
    // ============================================

    /** @returns {boolean} Check if feed is active */
    isActiveFeed() { return this.isActive && !this.isDeleted && this.isValid; }

    /** @returns {boolean} Check if feed is personalized */
    isPersonalizedFeed() { return this.isPersonalized === true; }

    /** @returns {boolean} Check if feed is cached */
    isCachedFeed() { return this.isCached === true; }

    /** @returns {boolean} Check if feed is stale */
    isStaleFeed() { return this.isStale === true || (this.expiresAt && new Date() > this.expiresAt); }

    /** @returns {boolean} Check if feed is empty */
    isEmpty() { return !this.feedItems || this.feedItems.length === 0; }

    /** @returns {boolean} Check if feed has more items */
    hasMoreItems() { return this.hasMore === true; }

    // ============================================
    // ANALYTICS METHODS
    // ============================================

    /**
     * Get score distribution
     * @param {Array<Object>} items - Items to analyze
     * @param {number} bins - Number of bins
     * @returns {Object} Score distribution
     */
    getScoreDistribution(items = null, bins = 10) {
        const feedItems = items || this.feedItems;
        if (!feedItems || feedItems.length === 0) return {};
        
        const distribution = {};
        const binSize = 100 / bins;
        
        for (const item of feedItems) {
            const score = item.score || item.finalScore || 0;
            const bin = Math.min(bins - 1, Math.floor(score / binSize));
            const key = `${Math.round(bin * binSize)}-${Math.round((bin + 1) * binSize)}`;
            distribution[key] = (distribution[key] || 0) + 1;
        }
        
        return distribution;
    }

    /**
     * Get feed stats
     * @param {Array<Object>} items - Items to analyze
     * @returns {Object} Feed statistics
     */
    getFeedStats(items = null) {
        const feedItems = items || this.feedItems;
        if (!feedItems || feedItems.length === 0) {
            return {
                total: 0,
                averageScore: 0,
                maxScore: 0,
                minScore: 0,
                categories: {},
                types: {}
            };
        }
        
        let totalScore = 0;
        let maxScore = 0;
        let minScore = 100;
        const categories = {};
        const types = {};
        
        for (const item of feedItems) {
            const score = item.score || item.finalScore || 0;
            totalScore += score;
            maxScore = Math.max(maxScore, score);
            minScore = Math.min(minScore, score);
            
            const category = item.category || 'uncategorized';
            categories[category] = (categories[category] || 0) + 1;
            
            const type = item.type || 'unknown';
            types[type] = (types[type] || 0) + 1;
        }
        
        return {
            total: feedItems.length,
            averageScore: totalScore / feedItems.length,
            maxScore,
            minScore,
            categories,
            types
        };
    }

    /**
     * Get performance metrics
     * @param {Object} options - Options
     * @param {number} options.days - Days to analyze
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics(options = {}) {
        const { days = 7 } = options;
        
        const metrics = {
            totalCalculations: this.analytics.totalCalculations || 0,
            averageProcessingTime: this.analytics.averageProcessingTime || 0,
            totalItemsProcessed: this.analytics.totalItemsProcessed || 0,
            uniqueUsers: this.analytics.uniqueUsers || 0,
            dailyStats: {},
            weeklyStats: {}
        };
        
        // Get daily stats for last N days
        const now = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const key = date.toISOString().split('T')[0];
            metrics.dailyStats[key] = {
                calculations: this.analytics.dailyStats?.[key]?.calculations || 0,
                items: this.analytics.dailyStats?.[key]?.items || 0
            };
        }
        
        return metrics;
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Get time ago for last calculation
     * @param {string} locale - Locale
     * @returns {string} Time ago
     */
    getTimeAgo(locale = 'en-US') {
        const now = new Date();
        const diff = now - this.calculatedAt;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return `${Math.floor(days / 7)}w ago`;
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
     * Get item at position
     * @param {number} position - Position in feed
     * @returns {Object|null} Item or null
     */
    getItemAt(position) {
        if (!this.feedItems || position < 0 || position >= this.feedItems.length) {
            return null;
        }
        return this.feedItems[position];
    }

    /**
     * Get items by category
     * @param {string} category - Category to filter
     * @param {number} limit - Items limit
     * @returns {Array<Object>} Filtered items
     */
    getItemsByCategory(category, limit = 10) {
        if (!this.feedItems) return [];
        const filtered = this.feedItems.filter(item => item.category === category);
        return filtered.slice(0, limit);
    }

    /**
     * Get items by score range
     * @param {number} minScore - Minimum score
     * @param {number} maxScore - Maximum score
     * @param {number} limit - Items limit
     * @returns {Array<Object>} Filtered items
     */
    getItemsByScore(minScore = 0, maxScore = 100, limit = 10) {
        if (!this.feedItems) return [];
        const filtered = this.feedItems.filter(item => {
            const score = item.score || item.finalScore || 0;
            return score >= minScore && score <= maxScore;
        });
        return filtered.slice(0, limit);
    }

    /**
     * Clone feed algorithm run
     * @param {Object} options - Clone options
     * @param {boolean} options.keepId - Keep original ID
     * @param {boolean} options.keepTimestamps - Keep original timestamps
     * @param {boolean} options.keepItems - Keep feed items
     * @param {boolean} options.keepScores - Keep scores
     * @param {boolean} options.resetContext - Reset context
     * @returns {FeedAlgorithm} Cloned feed algorithm
     */
    clone(options = {}) {
        const { 
            keepId = false, 
            keepTimestamps = false, 
            keepItems = true,
            keepScores = true,
            resetContext = false
        } = options;
        
        const data = this.toFirestore({ 
            includeMetadata: true, 
            includeAnalytics: true, 
            includeContext: true,
            includeBehavior: true,
            includeItems: keepItems
        });
        
        if (!keepId) {
            delete data.id;
            data.id = this.generateId();
        }
        
        if (!keepTimestamps) {
            data.calculatedAt = new Date();
            data.createdAt = new Date();
            data.updatedAt = new Date();
            data.expiresAt = null;
            data.lastActivityAt = null;
        }
        
        if (!keepScores) {
            data.followScore = 0;
            data.interestScore = 0;
            data.engagementScore = 0;
            data.timeScore = 0;
            data.finalScore = 0;
            data.normalizedScore = 0;
            data.rawScore = 0;
        }
        
        if (resetContext) {
            data.context = {
                userInterests: [],
                following: [],
                engagementHistory: [],
                viewedPosts: [],
                interactedPosts: [],
                savedPosts: [],
                sharedPosts: [],
                timeSpent: {},
                deviceInfo: {},
                location: {},
                timezone: 'UTC',
                language: 'en',
                sessionId: '',
                platform: 'web'
            };
            data.userBehavior = {
                averageSessionDuration: 0,
                averageLikesPerSession: 0,
                averageCommentsPerSession: 0,
                averageSharesPerSession: 0,
                averageSavesPerSession: 0,
                preferredCategories: [],
                preferredContentTypes: [],
                activeHours: [],
                engagementPattern: {},
                contentAffinities: {},
                authorAffinities: {},
                topicAffinities: {},
                recencyPreference: 0.5,
                diversityPreference: 0.3
            };
        }
        
        data.isCached = false;
        data.isStale = false;
        data.isDeleted = false;
        data.isValid = true;
        
        return new FeedAlgorithm({ ...data, id: data.id });
    }

    /**
     * Compare two feed algorithm runs
     * @param {FeedAlgorithm} other - Other feed algorithm
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
        return `FeedAlgorithm(${this.id}, ${this.userId}, ${this.feedType}, ${this.finalScore})`;
    }

    /**
     * Convert to display string
     * @returns {string} Display string
     */
    toDisplayString() {
        return `${this.feedType} Feed - ${this.finalScore.toFixed(1)}%`;
    }

    // ============================================
    // STATIC FACTORY METHODS
    // ============================================

    /**
     * Create feed algorithm from Firestore data
     * @param {Object} data - Firestore data
     * @param {string} id - Document ID
     * @returns {FeedAlgorithm} FeedAlgorithm instance
     */
    static fromFirestore(data, id) {
        const faData = { ...data, id };
        return new FeedAlgorithm(faData);
    }

    /**
     * Create feed algorithms from Firestore array
     * @param {Array} dataArray - Firestore data array
     * @returns {Array<FeedAlgorithm>} FeedAlgorithm instances
     */
    static fromFirestoreArray(dataArray) {
        if (!Array.isArray(dataArray)) return [];
        return dataArray.map(data => FeedAlgorithm.fromFirestore(data, data.id));
    }

    /**
     * Create a new feed algorithm run
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {string} options.feedType - Feed type
     * @param {Object} options.context - Algorithm context
     * @param {Array<Object>} options.items - Initial items
     * @param {Object} options.weights - Custom weights
     * @returns {FeedAlgorithm} New feed algorithm
     */
    static create(userId, options = {}) {
        const { feedType = 'social', context = {}, items = [], weights = {} } = options;

        return new FeedAlgorithm({
            userId,
            feedType,
            context,
            feedItems: items,
            weights: {
                follow: weights.follow || 0.4,
                interest: weights.interest || 0.3,
                engagement: weights.engagement || 0.2,
                time: weights.time || 0.1,
                ...weights
            },
            isActive: true,
            isPersonalized: true,
            config: {
                maxItems: 50,
                minScore: 10,
                diversityThreshold: 0.3,
                recencyWeight: 0.5,
                personalizationLevel: 1.0,
                exploreExploitRatio: 0.3
            }
        });
    }

    /**
     * Create a personalized feed
     * @param {string} userId - User ID
     * @param {Object} context - Personalization context
     * @param {Array<Object>} items - Available items
     * @param {Object} options - Options
     * @returns {FeedAlgorithm} Personalized feed
     */
    static createPersonalized(userId, context, items, options = {}) {
        const feed = FeedAlgorithm.create(userId, {
            feedType: 'social',
            context,
            weights: {
                follow: 0.5,
                interest: 0.25,
                engagement: 0.2,
                time: 0.05
            }
        });
        
        feed.generateFeed(items, context, {
            limit: options.limit || 50,
            diversify: true,
            diversityFactor: 0.3
        });
        
        return feed;
    }

    /**
     * Create a trending feed
     * @param {string} userId - User ID
     * @param {Array<Object>} items - Available items
     * @param {Object} options - Options
     * @param {number} options.limit - Items limit
     * @param {number} options.hoursWindow - Trending window
     * @returns {FeedAlgorithm} Trending feed
     */
    static createTrending(userId, items, options = {}) {
        const { limit = 20, hoursWindow = 24 } = options;
        
        const trendingItems = FeedAlgorithm.getTrendingItems(items, { hoursWindow, limit });
        
        return new FeedAlgorithm({
            userId,
            feedType: 'trending',
            feedItems: trendingItems.map((item, index) => ({
                ...item,
                position: index + 1,
                score: item.trendingScore || 0
            })),
            isPersonalized: false,
            config: {
                maxItems: limit,
                minScore: 0
            }
        });
    }

    /**
     * Create a recommended feed
     * @param {string} userId - User ID
     * @param {Array<Object>} items - Available items
     * @param {Object} context - Recommendation context
     * @param {Object} options - Options
     * @param {number} options.limit - Items limit
     * @returns {FeedAlgorithm} Recommended feed
     */
    static createRecommended(userId, items, context = {}, options = {}) {
        const { limit = 30 } = options;
        
        const feed = FeedAlgorithm.create(userId, {
            feedType: 'recommended',
            context,
            weights: {
                interest: 0.4,
                engagement: 0.3,
                time: 0.2,
                follow: 0.1
            }
        });
        
        const recommended = feed.getRecommendations(items, context, limit);
        feed.feedItems = recommended;
        feed.itemCount = recommended.length;
        feed.calculatedAt = new Date();
        
        return feed;
    }

    /**
     * Get trending items
     * @param {Array<Object>} items - Items to check
     * @param {Object} options - Options
     * @param {number} options.hoursWindow - Trending window
     * @param {number} options.limit - Items limit
     * @returns {Array<Object>} Trending items
     */
    static getTrendingItems(items, options = {}) {
        const { hoursWindow = 24, limit = 20 } = options;
        
        const now = new Date();
        const cutoff = new Date(now);
        cutoff.setHours(cutoff.getHours() - hoursWindow);
        
        const trending = items.filter(item => {
            const createdAt = item.createdAt ? new Date(item.createdAt) : new Date();
            return createdAt >= cutoff;
        });
        
        for (const item of trending) {
            const engagement = (item.likes || 0) + (item.comments || 0) + (item.shares || 0);
            const age = (now - new Date(item.createdAt)) / (1000 * 60 * 60);
            item.trendingScore = engagement / (age + 1);
        }
        
        trending.sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
        return trending.slice(0, limit);
    }

    // ============================================
    // STATIC QUERY & FILTER METHODS
    // ============================================

    /**
     * Filter feed algorithms by user
     * @param {Array<FeedAlgorithm>} feeds - Feeds array
     * @param {string} userId - User ID
     * @returns {Array<FeedAlgorithm>} Filtered feeds
     */
    static filterByUser(feeds, userId) {
        if (!userId) return feeds;
        return feeds.filter(f => f.userId === userId);
    }

    /**
     * Filter by feed type
     * @param {Array<FeedAlgorithm>} feeds - Feeds array
     * @param {string|Array<string>} types - Type(s) to filter
     * @returns {Array<FeedAlgorithm>} Filtered feeds
     */
    static filterByType(feeds, types) {
        if (!types) return feeds;
        if (!Array.isArray(types)) types = [types];
        return feeds.filter(f => types.includes(f.feedType));
    }

    /**
     * Filter active feeds
     * @param {Array<FeedAlgorithm>} feeds - Feeds array
     * @returns {Array<FeedAlgorithm>} Active feeds
     */
    static filterActive(feeds) {
        return feeds.filter(f => f.isActiveFeed());
    }

    /**
     * Filter personalized feeds
     * @param {Array<FeedAlgorithm>} feeds - Feeds array
     * @param {boolean} personalized - Personalized status
     * @returns {Array<FeedAlgorithm>} Filtered feeds
     */
    static filterPersonalized(feeds, personalized = true) {
        return feeds.filter(f => f.isPersonalized === personalized);
    }

    /**
     * Sort feeds by score
     * @param {Array<FeedAlgorithm>} feeds - Feeds array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<FeedAlgorithm>} Sorted feeds
     */
    static sortByScore(feeds, order = 'desc') {
        const sorted = [...feeds];
        sorted.sort((a, b) => {
            return order === 'asc' ? (a.finalScore || 0) - (b.finalScore || 0) : (b.finalScore || 0) - (a.finalScore || 0);
        });
        return sorted;
    }

    /**
     * Sort feeds by date
     * @param {Array<FeedAlgorithm>} feeds - Feeds array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<FeedAlgorithm>} Sorted feeds
     */
    static sortByDate(feeds, order = 'desc') {
        const sorted = [...feeds];
        sorted.sort((a, b) => {
            const aTime = a.calculatedAt.getTime();
            const bTime = b.calculatedAt.getTime();
            return order === 'asc' ? aTime - bTime : bTime - aTime;
        });
        return sorted;
    }

    /**
     * Get average score
     * @param {Array<FeedAlgorithm>} feeds - Feeds array
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {string} options.feedType - Feed type filter
     * @returns {number} Average score
     */
    static getAverageScore(feeds, userId, options = {}) {
        const { feedType = '' } = options;
        
        let filtered = feeds.filter(f => f.userId === userId);
        if (feedType) {
            filtered = filtered.filter(f => f.feedType === feedType);
        }
        
        if (filtered.length === 0) return 0;
        
        const total = filtered.reduce((sum, f) => sum + (f.finalScore || 0), 0);
        return total / filtered.length;
    }

    /**
     * Check if data is valid feed algorithm data
     * @param {Object} data - Data to check
     * @returns {boolean} True if valid
     */
    static isValidFeedData(data) {
        return data && typeof data === 'object' &&
            data.userId && data.userId.trim() !== '';
    }

    /**
     * Group feeds by type
     * @param {Array<FeedAlgorithm>} feeds - Feeds array
     * @returns {Object} Grouped by type
     */
    static groupByType(feeds) {
        const groups = {
            social: [],
            product: [],
            mixed: [],
            trending: [],
            recommended: []
        };
        for (const feed of feeds) {
            if (groups[feed.feedType]) {
                groups[feed.feedType].push(feed);
            } else {
                groups.other = groups.other || [];
                groups.other.push(feed);
            }
        }
        return groups;
    }

    /**
     * Group feeds by user
     * @param {Array<FeedAlgorithm>} feeds - Feeds array
     * @returns {Object} Grouped by user
     */
    static groupByUser(feeds) {
        const groups = {};
        for (const feed of feeds) {
            const key = feed.userId || 'unknown';
            if (!groups[key]) groups[key] = [];
            groups[key].push(feed);
        }
        return groups;
    }

    /**
     * Get feed by user and type
     * @param {Array<FeedAlgorithm>} feeds - Feeds array
     * @param {string} userId - User ID
     * @param {string} feedType - Feed type
     * @returns {FeedAlgorithm|null} Feed or null
     */
    static getByUserAndType(feeds, userId, feedType) {
        return feeds.find(f => f.userId === userId && f.feedType === feedType) || null;
    }

    /**
     * Get latest feed
     * @param {Array<FeedAlgorithm>} feeds - Feeds array
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {string} options.feedType - Feed type filter
     * @returns {FeedAlgorithm|null} Latest feed or null
     */
    static getLatest(feeds, userId, options = {}) {
        const { feedType = '' } = options;
        
        let filtered = feeds.filter(f => f.userId === userId);
        if (feedType) {
            filtered = filtered.filter(f => f.feedType === feedType);
        }
        
        if (filtered.length === 0) return null;
        const sorted = FeedAlgorithm.sortByDate(filtered, 'desc');
        return sorted[0] || null;
    }
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default FeedAlgorithm;


/**
 * Helpers to match index.js expectation for FeedAlgorithm
 */
export function createFeedAlgorithm(data) {
    return new FeedAlgorithm(data);
}

export function validateFeedAlgorithm(data) {
    const feedAlgorithm = data instanceof FeedAlgorithm ? data : new FeedAlgorithm(data);
    return feedAlgorithm.validate ? feedAlgorithm.validate() : { isValid: true };
}

export function feedAlgorithmToFirestore(feedAlgorithm) {
    if (feedAlgorithm && typeof feedAlgorithm.toFirestore === 'function') {
        return feedAlgorithm.toFirestore();
    }
    return feedAlgorithm;
}

export function firestoreToFeedAlgorithm(doc) {
    if (!doc) return null;
    const data = typeof doc.data === 'function' ? doc.data() : doc;
    const id = typeof doc.id === 'string' ? doc.id : data.id;
    if (typeof FeedAlgorithm.fromFirestore === 'function') {
        return FeedAlgorithm.fromFirestore(data, id);
    }
    return new FeedAlgorithm({ ...data, id });
}


/**
 * Helper to calculate feed score matching index.js expectation
 */
export function calculateFeedScore(item, userContext) {
    if (item && typeof item.calculateScore === 'function') {
        return item.calculateScore(userContext);
    }
    // Fallback scoring logic agar class ke andar method na ho
    return item?.score || 0;
}
// ============================================================
// END OF FILE: feed-algorithm-model.js
// ============================================================