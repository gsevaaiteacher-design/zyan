// ============================================================
// FILE: js/services/feed-service.js
// PURPOSE: Complete Feed Algorithm Service - PRODUCTION READY
// DEPENDENCY: database-service.js, auth-service.js, cache-service.js, analytics-service.js
// USED BY: home-screen.js, social-feed.js, all feed screens
// VERSION: 3.0.0 - FULLY UPDATED
// ============================================================

import { errorHandler, feedError } from './error-handler.js';
import { logger } from './logger.js';
import { databaseService } from './database-service.js';
import { getCurrentUser, isAuthenticated } from './auth-service.js';
import { cacheService } from './cache-service.js';
import { analyticsService, trackEvent } from './analytics-service.js';

/**
 * FeedService export definition
 */
export const FeedService = {
    fetch: async () => [],
    get: async () => {}
};

// ============================================================
// FEED CONFIGURATION
// ============================================================

const FEED_CONFIG = {
    // Enable/Disable feed
    enabled: true,
    
    // Default page size
    pageSize: 20,
    
    // Maximum page size
    maxPageSize: 50,
    
    // Feed weights
    weights: {
        FOLLOW: 0.40,        // 40% - Follow based
        INTEREST: 0.30,      // 30% - Interest based
        ENGAGEMENT: 0.20,    // 20% - Engagement based
        TIME: 0.10           // 10% - Time based
    },
    
    // Feed types
    types: {
        SOCIAL: 'social',
        MARKETPLACE: 'marketplace',
        EXPLORE: 'explore',
        TRENDING: 'trending',
        RECOMMENDED: 'recommended'
    },
    
    // Cache duration (ms)
    cacheDuration: 5 * 60 * 1000, // 5 minutes
    
    // Max items to process
    maxItems: 200,
    
    // Min score threshold
    minScore: 10,
    
    // Engagement boost
    engagementBoost: {
        like: 2,
        comment: 3,
        share: 4,
        save: 3,
        view: 1
    },
    
    // Time decay factor
    timeDecay: 0.05,
    
    // Freshness weight
    freshnessWeight: 0.3,
    
    // Diversity weight
    diversityWeight: 0.2,
    
    // Popularity weight
    popularityWeight: 0.25
};

// ============================================================
// FEED ALGORITHM CLASS
// ============================================================

class FeedAlgorithm {
    constructor() {
        this._initialized = false;
        this._enabled = FEED_CONFIG.enabled;
        this._userScores = new Map();
        this._postScores = new Map();
        this._userInterests = new Map();
        this._userEngagements = new Map();
        this._cache = new Map();
        this._listeners = [];
        this._feedHistory = [];
        this._popularCache = new Map();
        this._trendingCache = new Map();
        this._recommendationCache = new Map();
        this._lastFeedBuild = new Map();
        this._feedVersions = new Map();
        this._diversityPool = new Set();
        this._seenItems = new Set();
        this._clickHistory = new Map();
        this._viewHistory = new Map();
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    /**
     * Initialize feed service
     */
    async init(options = {}) {
        if (this._initialized) return;

        const {
            enabled = true,
            pageSize = 20,
            maxPageSize = 50,
            cacheDuration = 5 * 60 * 1000
        } = options;

        try {
            this._enabled = enabled;
            FEED_CONFIG.pageSize = pageSize;
            FEED_CONFIG.maxPageSize = maxPageSize;
            FEED_CONFIG.cacheDuration = cacheDuration;

            if (!this._enabled) {
                logger.info('📰 Feed service is disabled');
                this._initialized = true;
                return this;
            }

            // Load user interests
            await this._loadUserInterests();

            // Load user engagement history
            await this._loadUserEngagements();

            // Load trending content
            await this._loadTrendingContent();

            this._initialized = true;

            logger.info('📰 Feed Service initialized', {
                pageSize: FEED_CONFIG.pageSize,
                weights: FEED_CONFIG.weights,
                cacheDuration: FEED_CONFIG.cacheDuration
            });

            return this;
        } catch (error) {
            logger.error('❌ Feed Service initialization failed', { error: error.message });
            throw error;
        }
    }

    // ============================================
    // FEED BUILDING
    // ============================================

    /**
     * Build feed for user
     */
    async buildFeed(userId, options = {}) {
        if (!this._enabled) return [];

        const {
            type = FEED_CONFIG.types.SOCIAL,
            page = 1,
            pageSize = FEED_CONFIG.pageSize,
            refresh = false,
            includeProducts = true,
            includePosts = true,
            filterCategories = [],
            excludeIds = []
        } = options;

        try {
            const startTime = Date.now();
            
            // Check cache
            const cacheKey = this._generateCacheKey(userId, { type, page, pageSize, filterCategories });
            if (!refresh) {
                const cached = this._getFromCache(cacheKey);
                if (cached) {
                    logger.debug(`📰 Feed served from cache: ${userId}`, { type, page });
                    return cached;
                }
            }

            // Get user data
            const user = await databaseService.getUser(userId);
            if (!user) {
                throw feedError('User not found', { code: 'USER_NOT_FOUND' });
            }

            // Get feed items based on type
            let feedItems = [];
            let feedScores = [];

            switch (type) {
                case FEED_CONFIG.types.SOCIAL:
                    feedItems = await this._buildSocialFeed(user);
                    break;
                case FEED_CONFIG.types.MARKETPLACE:
                    feedItems = await this._buildMarketplaceFeed(user);
                    break;
                case FEED_CONFIG.types.EXPLORE:
                    feedItems = await this._buildExploreFeed(user);
                    break;
                case FEED_CONFIG.types.TRENDING:
                    feedItems = await this._buildTrendingFeed(user);
                    break;
                case FEED_CONFIG.types.RECOMMENDED:
                    feedItems = await this._buildRecommendedFeed(user);
                    break;
                default:
                    feedItems = await this._buildSocialFeed(user);
            }

            // Apply filters
            feedItems = this._applyFilters(feedItems, {
                includeProducts,
                includePosts,
                filterCategories,
                excludeIds
            });

            // Calculate scores
            feedItems = this._calculateScores(feedItems, user);

            // Sort by score
            feedItems.sort((a, b) => b.score - a.score);

            // Apply pagination
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginated = feedItems.slice(startIndex, endIndex);

            // Cache results
            this._saveToCache(cacheKey, paginated);

            // Track feed build
            this._notifyListeners('feed_built', {
                userId,
                type,
                count: paginated.length,
                duration: Date.now() - startTime
            });

            logger.info(`📰 Feed built for user ${userId}`, {
                type,
                count: paginated.length,
                duration: Date.now() - startTime
            });

            return paginated;
        } catch (error) {
            logger.error('❌ Failed to build feed', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'FEED',
                context: { userId, type }
            });
        }
    }

    // ============================================
    // FEED BUILDERS
    // ============================================

    /**
     * Build social feed (Instagram style)
     */
    async _buildSocialFeed(user) {
        try {
            // Get following users
            const following = await databaseService.getFollowing(user.uid);
            const followingIds = following.map(f => f.followingId);

            // Get posts from following
            let posts = [];
            if (followingIds.length > 0) {
                const result = await databaseService.query('posts', {
                    where: [['userId', 'in', followingIds]],
                    orderBy: [['createdAt', 'desc']],
                    limit: FEED_CONFIG.maxItems
                });
                posts = result.data;
            }

            // If no following, get popular posts
            if (posts.length === 0) {
                const result = await databaseService.query('posts', {
                    orderBy: [['likes', 'desc']],
                    limit: FEED_CONFIG.maxItems
                });
                posts = result.data;
            }

            // Format for feed
            return posts.map(post => ({
                ...post,
                type: 'post',
                feedType: FEED_CONFIG.types.SOCIAL,
                _source: 'social_feed',
                _following: followingIds.includes(post.userId)
            }));
        } catch (error) {
            logger.error('❌ Failed to build social feed', { error: error.message });
            return [];
        }
    }

    /**
     * Build marketplace feed
     */
    async _buildMarketplaceFeed(user) {
        try {
            // Get user interests
            const interests = user.interests || [];
            
            // Get products based on interests
            let products = [];
            if (interests.length > 0) {
                const result = await databaseService.query('products', {
                    where: [['category', 'in', interests]],
                    orderBy: [['createdAt', 'desc']],
                    limit: FEED_CONFIG.maxItems
                });
                products = result.data;
            }

            // If no interests, get featured products
            if (products.length === 0) {
                const result = await databaseService.getFeaturedProducts({
                    limit: FEED_CONFIG.maxItems
                });
                products = result.data;
            }

            return products.map(product => ({
                ...product,
                type: 'product',
                feedType: FEED_CONFIG.types.MARKETPLACE,
                _source: 'marketplace_feed'
            }));
        } catch (error) {
            logger.error('❌ Failed to build marketplace feed', { error: error.message });
            return [];
        }
    }

    /**
     * Build explore feed
     */
    async _buildExploreFeed(user) {
        try {
            // Get trending posts and products
            const [trendingPosts, trendingProducts] = await Promise.all([
                this._getTrendingPosts(),
                this._getTrendingProducts()
            ]);

            // Mix trending content
            const mixed = this._interleaveArrays(trendingPosts, trendingProducts);
            
            return mixed.slice(0, FEED_CONFIG.maxItems).map(item => ({
                ...item,
                type: item._type || 'post',
                feedType: FEED_CONFIG.types.EXPLORE,
                _source: 'explore_feed'
            }));
        } catch (error) {
            logger.error('❌ Failed to build explore feed', { error: error.message });
            return [];
        }
    }

    /**
     * Build trending feed
     */
    async _buildTrendingFeed(user) {
        try {
            const trending = await this._getTrendingContent();
            
            return trending.slice(0, FEED_CONFIG.maxItems).map(item => ({
                ...item,
                feedType: FEED_CONFIG.types.TRENDING,
                _source: 'trending_feed'
            }));
        } catch (error) {
            logger.error('❌ Failed to build trending feed', { error: error.message });
            return [];
        }
    }

    /**
     * Build recommended feed
     */
    async _buildRecommendedFeed(user) {
        try {
            // Get recommendations based on user history
            const recommendations = await this._generateRecommendations(user);
            
            return recommendations.slice(0, FEED_CONFIG.maxItems).map(item => ({
                ...item,
                feedType: FEED_CONFIG.types.RECOMMENDED,
                _source: 'recommended_feed',
                recommendationScore: item.score || 0
            }));
        } catch (error) {
            logger.error('❌ Failed to build recommended feed', { error: error.message });
            return [];
        }
    }

    // ============================================
    // SCORE CALCULATION
    // ============================================

    /**
     * Calculate scores for feed items
     */
    _calculateScores(items, user) {
        const userId = user.uid;
        
        return items.map(item => {
            let score = 0;
            
            // Follow score (40%)
            const followScore = this._calculateFollowScore(item, user);
            score += followScore * FEED_CONFIG.weights.FOLLOW;
            
            // Interest score (30%)
            const interestScore = this._calculateInterestScore(item, user);
            score += interestScore * FEED_CONFIG.weights.INTEREST;
            
            // Engagement score (20%)
            const engagementScore = this._calculateEngagementScore(item, userId);
            score += engagementScore * FEED_CONFIG.weights.ENGAGEMENT;
            
            // Time score (10%)
            const timeScore = this._calculateTimeScore(item);
            score += timeScore * FEED_CONFIG.weights.TIME;
            
            // Apply engagement boost
            const boost = this._calculateEngagementBoost(item);
            score += boost;
            
            // Apply time decay
            const decay = this._calculateTimeDecay(item);
            score *= (1 - decay);
            
            // Normalize score
            score = Math.max(0, Math.min(100, score));
            
            return {
                ...item,
                score,
                scoreBreakdown: {
                    follow: followScore * FEED_CONFIG.weights.FOLLOW,
                    interest: interestScore * FEED_CONFIG.weights.INTEREST,
                    engagement: engagementScore * FEED_CONFIG.weights.ENGAGEMENT,
                    time: timeScore * FEED_CONFIG.weights.TIME,
                    boost,
                    decay: decay * 100
                }
            };
        });
    }

    /**
     * Calculate follow score
     */
    _calculateFollowScore(item, user) {
        if (item._following) return 100;
        if (item.userId && user.following && user.following.includes(item.userId)) return 80;
        if (item.sellerId && user.following && user.following.includes(item.sellerId)) return 80;
        return 0;
    }

    /**
     * Calculate interest score
     */
    _calculateInterestScore(item, user) {
        const interests = user.interests || [];
        const categories = item.category ? [item.category] : (item.categories || []);
        
        if (categories.length === 0 || interests.length === 0) return 0;
        
        let matchCount = 0;
        for (const interest of interests) {
            if (categories.some(cat => cat === interest || cat.includes(interest))) {
                matchCount++;
            }
        }
        
        return (matchCount / Math.max(interests.length, categories.length)) * 100;
    }

    /**
     * Calculate engagement score
     */
    _calculateEngagementScore(item, userId) {
        const userEngagement = this._userEngagements.get(userId) || {};
        const itemId = item.id || item._id;
        const engagement = userEngagement[itemId] || { views: 0, likes: 0, comments: 0, shares: 0 };
        
        let score = 0;
        if (engagement.likes > 0) score += 30;
        if (engagement.comments > 0) score += 25;
        if (engagement.shares > 0) score += 25;
        if (engagement.views > 5) score += 20;
        
        return Math.min(100, score);
    }

    /**
     * Calculate time score
     */
    _calculateTimeScore(item) {
        const createdAt = item.createdAt || item.created_at;
        if (!createdAt) return 50;
        
        const timeDiff = Date.now() - new Date(createdAt).getTime();
        const hoursOld = timeDiff / (1000 * 60 * 60);
        
        if (hoursOld < 1) return 100;
        if (hoursOld < 6) return 80;
        if (hoursOld < 12) return 60;
        if (hoursOld < 24) return 40;
        if (hoursOld < 48) return 20;
        return 0;
    }

    /**
     * Calculate engagement boost
     */
    _calculateEngagementBoost(item) {
        const likes = item.likes || 0;
        const comments = item.comments || 0;
        const shares = item.shares || 0;
        const saves = item.saves || 0;
        const views = item.views || 0;
        
        let boost = 0;
        boost += likes * FEED_CONFIG.engagementBoost.like;
        boost += comments * FEED_CONFIG.engagementBoost.comment;
        boost += shares * FEED_CONFIG.engagementBoost.share;
        boost += saves * FEED_CONFIG.engagementBoost.save;
        boost += views * FEED_CONFIG.engagementBoost.view * 0.01;
        
        return Math.min(20, boost);
    }

    /**
     * Calculate time decay
     */
    _calculateTimeDecay(item) {
        const createdAt = item.createdAt || item.created_at;
        if (!createdAt) return 0;
        
        const timeDiff = Date.now() - new Date(createdAt).getTime();
        const daysOld = timeDiff / (1000 * 60 * 60 * 24);
        
        return Math.min(0.5, daysOld * FEED_CONFIG.timeDecay);
    }

    // ============================================
    // TRENDING CONTENT
    // ============================================

    /**
     * Get trending posts
     */
    async _getTrendingPosts() {
        try {
            const cacheKey = 'trending_posts';
            const cached = this._trendingCache.get(cacheKey);
            if (cached && cached.expiry > Date.now()) {
                return cached.data;
            }

            const result = await databaseService.query('posts', {
                orderBy: [
                    ['likes', 'desc'],
                    ['comments', 'desc']
                ],
                limit: 50
            });

            const data = result.data || [];
            this._trendingCache.set(cacheKey, {
                data,
                expiry: Date.now() + 5 * 60 * 1000
            });

            return data;
        } catch (error) {
            logger.error('❌ Failed to get trending posts', { error: error.message });
            return [];
        }
    }

    /**
     * Get trending products
     */
    async _getTrendingProducts() {
        try {
            const cacheKey = 'trending_products';
            const cached = this._trendingCache.get(cacheKey);
            if (cached && cached.expiry > Date.now()) {
                return cached.data;
            }

            const result = await databaseService.query('products', {
                orderBy: [
                    ['views', 'desc'],
                    ['downloads', 'desc']
                ],
                limit: 50
            });

            const data = result.data || [];
            data.forEach(p => p._type = 'product');
            
            this._trendingCache.set(cacheKey, {
                data,
                expiry: Date.now() + 5 * 60 * 1000
            });

            return data;
        } catch (error) {
            logger.error('❌ Failed to get trending products', { error: error.message });
            return [];
        }
    }

    /**
     * Get trending content (mixed)
     */
    async _getTrendingContent() {
        const [posts, products] = await Promise.all([
            this._getTrendingPosts(),
            this._getTrendingProducts()
        ]);

        const mixed = this._interleaveArrays(posts, products);
        return mixed.slice(0, 50);
    }

    // ============================================
    // RECOMMENDATIONS
    // ============================================

    /**
     * Generate recommendations
     */
    async _generateRecommendations(user) {
        try {
            // Get user history
            const history = await this._getUserHistory(user.uid);
            
            // Get collaborative recommendations
            const collaborative = await this._getCollaborativeRecommendations(user, history);
            
            // Get content-based recommendations
            const contentBased = await this._getContentBasedRecommendations(user, history);
            
            // Merge recommendations
            const merged = this._mergeRecommendations(collaborative, contentBased);
            
            return merged.slice(0, FEED_CONFIG.maxItems);
        } catch (error) {
            logger.error('❌ Failed to generate recommendations', { error: error.message });
            return [];
        }
    }

    /**
     * Get user history
     */
    async _getUserHistory(userId) {
        try {
            const [views, likes, comments, downloads] = await Promise.all([
                this._getUserViews(userId),
                this._getUserLikes(userId),
                this._getUserComments(userId),
                this._getUserDownloads(userId)
            ]);

            return {
                views,
                likes,
                comments,
                downloads,
                all: [...views, ...likes, ...comments, ...downloads]
            };
        } catch (error) {
            logger.error('❌ Failed to get user history', { error: error.message });
            return { views: [], likes: [], comments: [], downloads: [], all: [] };
        }
    }

    /**
     * Get user views
     */
    async _getUserViews(userId) {
        try {
            const history = await databaseService.query('history', {
                where: [['userId', '==', userId]],
                orderBy: [['downloadedAt', 'desc']],
                limit: 50
            });
            return history.data.map(h => h.productId).filter(Boolean);
        } catch {
            return [];
        }
    }

    /**
     * Get user likes
     */
    async _getUserLikes(userId) {
        try {
            const likes = await databaseService.query('likes', {
                where: [['userId', '==', userId]],
                orderBy: [['createdAt', 'desc']],
                limit: 50
            });
            return likes.data.map(l => l.productId).filter(Boolean);
        } catch {
            return [];
        }
    }

    /**
     * Get user comments
     */
    async _getUserComments(userId) {
        try {
            // Get user's comments across all collections
            const comments = await databaseService.query('reviews', {
                where: [['userId', '==', userId]],
                orderBy: [['createdAt', 'desc']],
                limit: 50
            });
            return comments.data.map(c => c.productId).filter(Boolean);
        } catch {
            return [];
        }
    }

    /**
     * Get user downloads
     */
    async _getUserDownloads(userId) {
        try {
            const downloads = await databaseService.query('downloads', {
                where: [['userId', '==', userId]],
                orderBy: [['downloadedAt', 'desc']],
                limit: 50
            });
            return downloads.data.map(d => d.productId).filter(Boolean);
        } catch {
            return [];
        }
    }

    /**
     * Get collaborative recommendations
     */
    async _getCollaborativeRecommendations(user, history) {
        // Find similar users based on history
        const similarUsers = await this._findSimilarUsers(user, history);
        
        // Get items liked by similar users
        const recommendations = [];
        for (const similarUser of similarUsers) {
            const likes = await this._getUserLikes(similarUser);
            for (const item of likes) {
                if (!history.all.includes(item)) {
                    recommendations.push(item);
                }
            }
        }
        
        return this._getItemDetails(recommendations);
    }

    /**
     * Find similar users
     */
    async _findSimilarUsers(user, history) {
        // Simple implementation - find users with similar interests
        const interests = user.interests || [];
        if (interests.length === 0) return [];

        const users = await databaseService.query('users', {
            where: [['interests', 'array-contains-any', interests]],
            limit: 10
        });

        return users.data.map(u => u.uid).filter(id => id !== user.uid);
    }

    /**
     * Get content-based recommendations
     */
    async _getContentBasedRecommendations(user, history) {
        const interests = user.interests || [];
        if (interests.length === 0) return [];

        // Get products matching interests
        const products = await databaseService.query('products', {
            where: [['category', 'in', interests]],
            orderBy: [['rating', 'desc']],
            limit: 30
        });

        return products.data;
    }

    /**
     * Get item details
     */
    async _getItemDetails(ids) {
        const items = [];
        for (const id of ids) {
            try {
                const product = await databaseService.getProduct(id);
                if (product) {
                    items.push({ ...product, type: 'product' });
                }
            } catch {
                // Ignore
            }
        }
        return items;
    }

    /**
     * Merge recommendations
     */
    _mergeRecommendations(collaborative, contentBased) {
        const merged = [...collaborative, ...contentBased];
        const unique = [];
        const seen = new Set();
        
        for (const item of merged) {
            if (!seen.has(item.id)) {
                seen.add(item.id);
                unique.push(item);
            }
        }
        
        return unique;
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Interleave arrays
     */
    _interleaveArrays(arr1, arr2) {
        const result = [];
        const maxLength = Math.max(arr1.length, arr2.length);
        
        for (let i = 0; i < maxLength; i++) {
            if (i < arr1.length) result.push(arr1[i]);
            if (i < arr2.length) result.push(arr2[i]);
        }
        
        return result;
    }

    /**
     * Apply filters
     */
    _applyFilters(items, options) {
        let filtered = [...items];

        if (!options.includeProducts) {
            filtered = filtered.filter(item => item.type !== 'product');
        }

        if (!options.includePosts) {
            filtered = filtered.filter(item => item.type !== 'post');
        }

        if (options.filterCategories && options.filterCategories.length > 0) {
            filtered = filtered.filter(item => {
                const category = item.category || item.categories?.[0] || '';
                return options.filterCategories.includes(category);
            });
        }

        if (options.excludeIds && options.excludeIds.length > 0) {
            filtered = filtered.filter(item => !options.excludeIds.includes(item.id));
        }

        return filtered;
    }

    /**
     * Generate cache key
     */
    _generateCacheKey(userId, options) {
        return `feed_${userId}_${JSON.stringify(options)}`;
    }

    /**
     * Get from cache
     */
    _getFromCache(key) {
        const cached = this._cache.get(key);
        if (cached && cached.expiry > Date.now()) {
            return cached.data;
        }
        this._cache.delete(key);
        return null;
    }

    /**
     * Save to cache
     */
    _saveToCache(key, data) {
        this._cache.set(key, {
            data,
            expiry: Date.now() + FEED_CONFIG.cacheDuration
        });
    }

    /**
     * Load user interests
     */
    async _loadUserInterests() {
        try {
            const userId = getCurrentUser()?.uid;
            if (!userId) return;

            const user = await databaseService.getUser(userId);
            if (user && user.interests) {
                this._userInterests.set(userId, user.interests);
            }
        } catch (error) {
            logger.error('❌ Failed to load user interests', { error: error.message });
        }
    }

    /**
     * Load user engagements
     */
    async _loadUserEngagements() {
        try {
            const userId = getCurrentUser()?.uid;
            if (!userId) return;

            // Load user's engagement history
            const engagements = await databaseService.query('history', {
                where: [['userId', '==', userId]],
                limit: 100
            });

            const engagementMap = {};
            for (const eng of engagements.data) {
                engagementMap[eng.productId] = {
                    views: (engagementMap[eng.productId]?.views || 0) + 1,
                    likes: (engagementMap[eng.productId]?.likes || 0) + (eng.liked ? 1 : 0),
                    comments: (engagementMap[eng.productId]?.comments || 0) + (eng.commented ? 1 : 0),
                    shares: (engagementMap[eng.productId]?.shares || 0) + (eng.shared ? 1 : 0)
                };
            }

            this._userEngagements.set(userId, engagementMap);
        } catch (error) {
            logger.error('❌ Failed to load user engagements', { error: error.message });
        }
    }

    /**
     * Load trending content
     */
    async _loadTrendingContent() {
        try {
            await Promise.all([
                this._getTrendingPosts(),
                this._getTrendingProducts()
            ]);
        } catch (error) {
            logger.error('❌ Failed to load trending content', { error: error.message });
        }
    }

    /**
     * Track feed item view
     */
    async trackView(userId, itemId, itemType) {
        try {
            if (!this._viewHistory.has(userId)) {
                this._viewHistory.set(userId, new Set());
            }
            this._viewHistory.get(userId).add(itemId);

            // Update user engagement
            const engagement = this._userEngagements.get(userId) || {};
            if (!engagement[itemId]) {
                engagement[itemId] = { views: 0, likes: 0, comments: 0, shares: 0 };
            }
            engagement[itemId].views++;
            this._userEngagements.set(userId, engagement);

            // Track analytics
            trackEvent('feed_item_view', {
                userId,
                itemId,
                itemType,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('❌ Failed to track view', { error: error.message });
        }
    }

    /**
     * Track feed item interaction
     */
    async trackInteraction(userId, itemId, itemType, action) {
        try {
            const engagement = this._userEngagements.get(userId) || {};
            if (!engagement[itemId]) {
                engagement[itemId] = { views: 0, likes: 0, comments: 0, shares: 0 };
            }

            if (action === 'like') engagement[itemId].likes++;
            else if (action === 'comment') engagement[itemId].comments++;
            else if (action === 'share') engagement[itemId].shares++;
            
            this._userEngagements.set(userId, engagement);

            // Track analytics
            trackEvent('feed_item_interaction', {
                userId,
                itemId,
                itemType,
                action,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('❌ Failed to track interaction', { error: error.message });
        }
    }

    /**
     * Get feed stats
     */
    getFeedStats() {
        return {
            enabled: this._enabled,
            initialized: this._initialized,
            cacheSize: this._cache.size,
            userScores: this._userScores.size,
            userInterests: this._userInterests.size,
            userEngagements: this._userEngagements.size,
            popularCache: this._popularCache.size,
            trendingCache: this._trendingCache.size,
            feedHistory: this._feedHistory.length,
            listeners: this._listeners.length
        };
    }

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

    /**
     * Clear cache
     */
    clearCache() {
        this._cache.clear();
        this._popularCache.clear();
        this._trendingCache.clear();
        this._recommendationCache.clear();
        logger.info('📰 Feed cache cleared');
    }

    /**
     * Destroy feed service
     */
    destroy() {
        this._cache.clear();
        this._popularCache.clear();
        this._trendingCache.clear();
        this._recommendationCache.clear();
        this._userScores.clear();
        this._postScores.clear();
        this._userInterests.clear();
        this._userEngagements.clear();
        this._listeners = [];
        this._initialized = false;
        logger.info('📰 Feed service destroyed');
    }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

const feedService = new FeedAlgorithm();

// ============================================================
// EXPORTS
// ============================================================

export { feedService, FEED_CONFIG };

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Initialize feed service
 */
export function initFeedService(options = {}) {
    return feedService.init(options);
}

/**
 * Build feed
 */
export function buildFeed(userId, options = {}) {
    return feedService.buildFeed(userId, options);
}

/**
 * Build social feed
 */
export function buildSocialFeed(userId, options = {}) {
    return feedService.buildFeed(userId, { ...options, type: FEED_CONFIG.types.SOCIAL });
}

/**
 * Build marketplace feed
 */
export function buildMarketplaceFeed(userId, options = {}) {
    return feedService.buildFeed(userId, { ...options, type: FEED_CONFIG.types.MARKETPLACE });
}

/**
 * Build explore feed
 */
export function buildExploreFeed(userId, options = {}) {
    return feedService.buildFeed(userId, { ...options, type: FEED_CONFIG.types.EXPLORE });
}

/**
 * Build trending feed
 */
export function buildTrendingFeed(userId, options = {}) {
    return feedService.buildFeed(userId, { ...options, type: FEED_CONFIG.types.TRENDING });
}

/**
 * Build recommended feed
 */
export function buildRecommendedFeed(userId, options = {}) {
    return feedService.buildFeed(userId, { ...options, type: FEED_CONFIG.types.RECOMMENDED });
}

/**
 * Track feed view
 */
export function trackFeedView(userId, itemId, itemType) {
    return feedService.trackView(userId, itemId, itemType);
}

/**
 * Track feed interaction
 */
export function trackFeedInteraction(userId, itemId, itemType, action) {
    return feedService.trackInteraction(userId, itemId, itemType, action);
}

/**
 * Get trending posts
 */
export function getTrendingPosts() {
    return feedService._getTrendingPosts();
}

/**
 * Get trending products
 */
export function getTrendingProducts() {
    return feedService._getTrendingProducts();
}

/**
 * Get trending content
 */
export function getTrendingContent() {
    return feedService._getTrendingContent();
}

/**
 * Get feed stats
 */
export function getFeedStats() {
    return feedService.getFeedStats();
}

/**
 * Clear feed cache
 */
export function clearFeedCache() {
    return feedService.clearCache();
}

/**
 * Add feed listener
 */
export function onFeedEvent(callback) {
    return feedService.addListener(callback);
}

/**
 * Destroy feed service
 */
export function destroyFeedService() {
    return feedService.destroy();
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default feedService;

