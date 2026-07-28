// ============================================================
// FILE: js/services/social-service.js
// PURPOSE: Complete Social Features Service - PRODUCTION READY
// DEPENDENCY: database-service.js, auth-service.js, notification-service.js, analytics-service.js
// USED BY: social-feed.js, profile-screen.js, post-card.js, all social screens
// VERSION: 3.0.0 - FULLY UPDATED
// ============================================================

import { errorHandler, socialError } from './error-handler.js';
import { logger } from './logger.js';
import { databaseService } from './database-service.js';
import { getCurrentUser, isAuthenticated } from './auth-service.js';
import { notificationService, NOTIFICATION_CONFIG } from './notification-service.js';
import { analyticsService, trackEvent } from './analytics-service.js';
import { cacheService } from './cache-service.js';
import { feedService } from './feed-service.js';

// ============================================================
// SOCIAL CONFIGURATION
// ============================================================

const SOCIAL_CONFIG = {
    // Enable/Disable social features
    enabled: true,
    
    // Post settings
    posts: {
        maxLength: 5000,
        maxImages: 10,
        maxVideoSize: 50 * 1024 * 1024, // 50MB
        maxImageSize: 10 * 1024 * 1024, // 10MB
        allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        allowedVideoTypes: ['video/mp4', 'video/webm', 'video/ogg'],
        cacheDuration: 5 * 60 * 1000 // 5 minutes
    },
    
    // Stories settings
    stories: {
        duration: 24 * 60 * 60 * 1000, // 24 hours
        maxMediaSize: 20 * 1024 * 1024, // 20MB
        maxTextLength: 500,
        cacheDuration: 1 * 60 * 1000 // 1 minute
    },
    
    // Comments settings
    comments: {
        maxLength: 2000,
        maxReplies: 50,
        cacheDuration: 2 * 60 * 1000 // 2 minutes
    },
    
    // Reactions settings
    reactions: {
        types: ['like', 'love', 'wow', 'sad', 'angry', 'laugh', 'celebrate'],
        maxPerPost: 1000
    },
    
    // Follow settings
    follow: {
        maxFollows: 5000,
        cacheDuration: 5 * 60 * 1000 // 5 minutes
    },
    
    // Share settings
    share: {
        maxShares: 1000
    },
    
    // Report settings
    report: {
        reasons: ['spam', 'harassment', 'abuse', 'fake', 'inappropriate', 'other'],
        maxReports: 10
    },
    
    // Pagination
    pagination: {
        defaultPageSize: 20,
        maxPageSize: 50
    }
};

// ============================================================
// SOCIAL SERVICE CLASS
// ============================================================

class SocialService {
    constructor() {
        this._initialized = false;
        this._enabled = SOCIAL_CONFIG.enabled;
        this._postsCache = new Map();
        this._storiesCache = new Map();
        this._commentsCache = new Map();
        this._followingCache = new Map();
        this._followersCache = new Map();
        this._reactionsCache = new Map();
        this._listeners = [];
        this._pendingPosts = [];
        this._isProcessing = false;
        this._userStats = new Map();
        this._trendingTopics = new Map();
        this._activityFeed = [];
        this._mentionUsers = new Set();
        this._blockedUsers = new Set();
        this._mutedUsers = new Set();
        this._reportedContent = new Set();
        this._savedPosts = new Set();
        this._shareCounts = new Map();
        this._viewCounts = new Map();
        this._engagementScore = new Map();
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    /**
     * Initialize social service
     */
    async init(options = {}) {
        if (this._initialized) return;

        const {
            enabled = true,
            maxPostLength = 5000,
            maxImages = 10,
            cacheDuration = 5 * 60 * 1000
        } = options;

        try {
            this._enabled = enabled;
            SOCIAL_CONFIG.posts.maxLength = maxPostLength;
            SOCIAL_CONFIG.posts.maxImages = maxImages;
            SOCIAL_CONFIG.posts.cacheDuration = cacheDuration;

            if (!this._enabled) {
                logger.info('👥 Social service is disabled');
                this._initialized = true;
                return this;
            }

            // Load user data
            const userId = getCurrentUser()?.uid;
            if (userId) {
                await this._loadUserSocialData(userId);
            }

            // Load trending topics
            await this._loadTrendingTopics();

            this._initialized = true;

            logger.info('👥 Social Service initialized', {
                maxPostLength: SOCIAL_CONFIG.posts.maxLength,
                maxImages: SOCIAL_CONFIG.posts.maxImages,
                reactionTypes: SOCIAL_CONFIG.reactions.types.length
            });

            return this;
        } catch (error) {
            logger.error('❌ Social Service initialization failed', { error: error.message });
            throw error;
        }
    }

    // ============================================
    // POST MANAGEMENT
    // ============================================

    /**
     * Create a post
     */
    async createPost(data, options = {}) {
        if (!this._enabled) throw socialError('Social features disabled', { code: 'DISABLED' });

        const userId = getCurrentUser()?.uid;
        if (!userId) throw socialError('Please login to create a post', { code: 'NOT_AUTHENTICATED' });

        const {
            content = '',
            images = [],
            video = null,
            category = '',
            tags = [],
            location = null,
            isPublic = true,
            isProduct = false,
            productId = null
        } = data;

        try {
            // Validate
            if (content.length === 0 && images.length === 0 && !video) {
                throw socialError('Post must have content, images, or video', { code: 'EMPTY_POST' });
            }

            if (content.length > SOCIAL_CONFIG.posts.maxLength) {
                throw socialError(`Post exceeds maximum length of ${SOCIAL_CONFIG.posts.maxLength} characters`, {
                    code: 'POST_TOO_LONG'
                });
            }

            if (images.length > SOCIAL_CONFIG.posts.maxImages) {
                throw socialError(`Maximum ${SOCIAL_CONFIG.posts.maxImages} images allowed`, {
                    code: 'TOO_MANY_IMAGES'
                });
            }

            // Get user data
            const user = await databaseService.getUser(userId);
            if (!user) throw socialError('User not found', { code: 'USER_NOT_FOUND' });

            // Create post
            const postData = {
                userId,
                userName: user.displayName || 'User',
                userPhoto: user.photoURL || '',
                content,
                images,
                video,
                category,
                tags,
                location,
                isPublic,
                isProduct,
                productId,
                likes: 0,
                comments: 0,
                shares: 0,
                saves: 0,
                views: 0,
                reactions: {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: true,
                isDeleted: false
            };

            const result = await databaseService.create('posts', postData);
            const postId = result.id;

            // Update user stats
            await databaseService.updateUser(userId, {
                totalPosts: (user.totalPosts || 0) + 1,
                lastPostAt: new Date().toISOString()
            });

            // Update user stats cache
            this._updateUserStats(userId, 'posts', 1);

            // Track analytics
            trackEvent('social_post_create', {
                userId,
                postId,
                hasImages: images.length > 0,
                hasVideo: !!video,
                category,
                tags: tags.length
            });

            // Notify followers
            await this._notifyFollowers(userId, 'post', postId, content);

            // Clear cache
            this._postsCache.clear();

            // Notify listeners
            this._notifyListeners('post_created', { postId, userId, data: postData });

            logger.info(`📝 Post created by user ${userId}`, { postId, contentLength: content.length });

            return { id: postId, ...postData };
        } catch (error) {
            logger.error('❌ Failed to create post', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'SOCIAL',
                context: { userId, action: 'create_post' }
            });
        }
    }

    /**
     * Get a post
     */
    async getPost(postId, options = {}) {
        if (!this._enabled) return null;

        const {
            cache = true,
            incrementViews = true
        } = options;

        try {
            // Check cache
            if (cache) {
                const cached = this._postsCache.get(postId);
                if (cached && cached.expiry > Date.now()) {
                    return cached.data;
                }
            }

            const post = await databaseService.getPost(postId);
            if (!post || post.isDeleted) {
                return null;
            }

            // Increment views
            if (incrementViews) {
                await databaseService.incrementPostViews(postId);
                this._viewCounts.set(postId, (this._viewCounts.get(postId) || 0) + 1);
            }

            // Cache
            if (cache) {
                this._postsCache.set(postId, {
                    data: post,
                    expiry: Date.now() + SOCIAL_CONFIG.posts.cacheDuration
                });
            }

            return post;
        } catch (error) {
            logger.error('❌ Failed to get post', { error: error.message });
            return null;
        }
    }

    /**
     * Update a post
     */
    async updatePost(postId, data) {
        if (!this._enabled) throw socialError('Social features disabled', { code: 'DISABLED' });

        const userId = getCurrentUser()?.uid;
        if (!userId) throw socialError('Please login to update post', { code: 'NOT_AUTHENTICATED' });

        try {
            const post = await this.getPost(postId, { cache: false });
            if (!post) throw socialError('Post not found', { code: 'POST_NOT_FOUND' });

            if (post.userId !== userId) {
                throw socialError('You can only update your own posts', { code: 'NOT_AUTHORIZED' });
            }

            const updateData = {
                ...data,
                updatedAt: new Date().toISOString()
            };

            await databaseService.updatePost(postId, updateData);

            // Clear cache
            this._postsCache.delete(postId);

            this._notifyListeners('post_updated', { postId, userId, data: updateData });

            logger.info(`📝 Post updated: ${postId}`);

            return { id: postId, ...post, ...updateData };
        } catch (error) {
            logger.error('❌ Failed to update post', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'SOCIAL',
                context: { userId, postId, action: 'update_post' }
            });
        }
    }

    /**
     * Delete a post
     */
    async deletePost(postId) {
        if (!this._enabled) throw socialError('Social features disabled', { code: 'DISABLED' });

        const userId = getCurrentUser()?.uid;
        if (!userId) throw socialError('Please login to delete post', { code: 'NOT_AUTHENTICATED' });

        try {
            const post = await this.getPost(postId, { cache: false });
            if (!post) throw socialError('Post not found', { code: 'POST_NOT_FOUND' });

            if (post.userId !== userId) {
                throw socialError('You can only delete your own posts', { code: 'NOT_AUTHORIZED' });
            }

            await databaseService.updatePost(postId, {
                isDeleted: true,
                deletedAt: new Date().toISOString()
            });

            // Update user stats
            await databaseService.updateUser(userId, {
                totalPosts: Math.max(0, (post.user?.totalPosts || 0) - 1)
            });

            // Clear cache
            this._postsCache.delete(postId);

            this._notifyListeners('post_deleted', { postId, userId });

            logger.info(`🗑️ Post deleted: ${postId}`);

            return true;
        } catch (error) {
            logger.error('❌ Failed to delete post', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'SOCIAL',
                context: { userId, postId, action: 'delete_post' }
            });
        }
    }

    /**
     * Get posts by user
     */
    async getUserPosts(userId, options = {}) {
        if (!this._enabled) return [];

        const {
            limit = SOCIAL_CONFIG.pagination.defaultPageSize,
            offset = 0,
            includeDeleted = false
        } = options;

        try {
            const result = await databaseService.query('posts', {
                where: [
                    ['userId', '==', userId],
                    ['isDeleted', '==', includeDeleted ? false : false]
                ],
                orderBy: [['createdAt', 'desc']],
                limit,
                offset
            });

            return result.data || [];
        } catch (error) {
            logger.error('❌ Failed to get user posts', { error: error.message });
            return [];
        }
    }

    /**
     * Get feed posts
     */
    async getFeedPosts(userId, options = {}) {
        if (!this._enabled) return [];

        const {
            limit = SOCIAL_CONFIG.pagination.defaultPageSize,
            offset = 0,
            includeProducts = true
        } = options;

        try {
            // Get following users
            const following = await this.getFollowing(userId);
            const followingIds = following.map(f => f.followingId);

            // Get posts from following
            let posts = [];
            if (followingIds.length > 0) {
                const result = await databaseService.query('posts', {
                    where: [
                        ['userId', 'in', followingIds],
                        ['isDeleted', '==', false],
                        ['isPublic', '==', true]
                    ],
                    orderBy: [['createdAt', 'desc']],
                    limit: limit * 2
                });
                posts = result.data || [];
            }

            // If no following, get popular posts
            if (posts.length === 0) {
                const result = await databaseService.query('posts', {
                    where: [['isDeleted', '==', false], ['isPublic', '==', true]],
                    orderBy: [['likes', 'desc']],
                    limit
                });
                posts = result.data || [];
            }

            // Filter out blocked users
            posts = posts.filter(p => !this._blockedUsers.has(p.userId));

            // Sort by score
            posts.sort((a, b) => {
                const scoreA = this._calculatePostScore(a);
                const scoreB = this._calculatePostScore(b);
                return scoreB - scoreA;
            });

            // Paginate
            const paginated = posts.slice(offset, offset + limit);

            // Track feed view
            trackEvent('feed_view', {
                userId,
                postCount: paginated.length,
                followingCount: followingIds.length
            });

            return paginated;
        } catch (error) {
            logger.error('❌ Failed to get feed posts', { error: error.message });
            return [];
        }
    }

    /**
     * Calculate post score
     */
    _calculatePostScore(post) {
        const now = Date.now();
        const createdAt = new Date(post.createdAt).getTime();
        const hoursOld = (now - createdAt) / (1000 * 60 * 60);

        // Base score
        let score = 0;
        score += post.likes || 0;
        score += (post.comments || 0) * 2;
        score += (post.shares || 0) * 3;
        score += (post.saves || 0) * 1.5;
        score += (post.views || 0) * 0.1;

        // Time decay
        const decay = Math.max(0, 1 - (hoursOld / 24) * 0.5);
        score *= (1 + decay);

        // Engagement bonus
        const engagement = (post.likes || 0) + (post.comments || 0) + (post.shares || 0);
        if (engagement > 50) score *= 1.2;
        if (engagement > 100) score *= 1.5;

        return Math.round(score);
    }

    // ============================================
    // STORY MANAGEMENT
    // ============================================

    /**
     * Create a story
     */
    async createStory(data, options = {}) {
        if (!this._enabled) throw socialError('Social features disabled', { code: 'DISABLED' });

        const userId = getCurrentUser()?.uid;
        if (!userId) throw socialError('Please login to create a story', { code: 'NOT_AUTHENTICATED' });

        const {
            media = '',
            type = 'image',
            text = '',
            duration = 5
        } = data;

        try {
            if (!media) {
                throw socialError('Story must have media', { code: 'EMPTY_STORY' });
            }

            if (text.length > SOCIAL_CONFIG.stories.maxTextLength) {
                throw socialError(`Story text exceeds maximum length of ${SOCIAL_CONFIG.stories.maxTextLength} characters`, {
                    code: 'STORY_TOO_LONG'
                });
            }

            const user = await databaseService.getUser(userId);

            const storyData = {
                userId,
                userName: user.displayName || 'User',
                userPhoto: user.photoURL || '',
                media,
                type,
                text,
                duration,
                views: 0,
                reactions: [],
                expiresAt: new Date(Date.now() + SOCIAL_CONFIG.stories.duration).toISOString(),
                createdAt: new Date().toISOString(),
                isActive: true,
                isDeleted: false
            };

            const result = await databaseService.create('stories', storyData);

            // Clear cache
            this._storiesCache.clear();

            this._notifyListeners('story_created', { storyId: result.id, userId });

            logger.info(`📸 Story created by user ${userId}`);

            return { id: result.id, ...storyData };
        } catch (error) {
            logger.error('❌ Failed to create story', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'SOCIAL',
                context: { userId, action: 'create_story' }
            });
        }
    }

    /**
     * Get active stories
     */
    async getActiveStories(options = {}) {
        if (!this._enabled) return [];

        const {
            limit = 50,
            userId = null
        } = options;

        try {
            const cacheKey = `active_stories_${userId || 'all'}`;
            const cached = this._storiesCache.get(cacheKey);
            if (cached && cached.expiry > Date.now()) {
                return cached.data;
            }

            let query = [
                ['expiresAt', '>', new Date().toISOString()],
                ['isDeleted', '==', false],
                ['isActive', '==', true]
            ];

            if (userId) {
                query.push(['userId', '==', userId]);
            }

            const result = await databaseService.query('stories', {
                where: query,
                orderBy: [['createdAt', 'desc']],
                limit
            });

            const stories = result.data || [];

            // Filter out blocked users
            const filtered = stories.filter(s => !this._blockedUsers.has(s.userId));

            this._storiesCache.set(cacheKey, {
                data: filtered,
                expiry: Date.now() + SOCIAL_CONFIG.stories.cacheDuration
            });

            return filtered;
        } catch (error) {
            logger.error('❌ Failed to get active stories', { error: error.message });
            return [];
        }
    }

    /**
     * View a story
     */
    async viewStory(storyId) {
        if (!this._enabled) return false;

        const userId = getCurrentUser()?.uid;
        if (!userId) return false;

        try {
            const story = await databaseService.getStory(storyId);
            if (!story || story.isDeleted) return false;

            // Check if already viewed
            if (story.views?.includes(userId)) return false;

            await databaseService.updateStory(storyId, {
                views: (story.views || 0) + 1,
                viewers: [...(story.viewers || []), userId]
            });

            return true;
        } catch (error) {
            logger.error('❌ Failed to view story', { error: error.message });
            return false;
        }
    }

    // ============================================
    // COMMENT MANAGEMENT
    // ============================================

    /**
     * Add a comment
     */
    async addComment(postId, content, options = {}) {
        if (!this._enabled) throw socialError('Social features disabled', { code: 'DISABLED' });

        const userId = getCurrentUser()?.uid;
        if (!userId) throw socialError('Please login to comment', { code: 'NOT_AUTHENTICATED' });

        if (!content || content.trim().length === 0) {
            throw socialError('Comment cannot be empty', { code: 'EMPTY_COMMENT' });
        }

        if (content.length > SOCIAL_CONFIG.comments.maxLength) {
            throw socialError(`Comment exceeds maximum length of ${SOCIAL_CONFIG.comments.maxLength} characters`, {
                code: 'COMMENT_TOO_LONG'
            });
        }

        try {
            const post = await this.getPost(postId, { cache: false });
            if (!post) throw socialError('Post not found', { code: 'POST_NOT_FOUND' });

            const user = await databaseService.getUser(userId);

            const commentData = {
                postId,
                userId,
                userName: user.displayName || 'User',
                userPhoto: user.photoURL || '',
                content: content.trim(),
                likes: 0,
                replies: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isDeleted: false
            };

            // Create comment
            const result = await databaseService.create(`posts/${postId}/comments`, commentData);

            // Update post comment count
            await databaseService.updatePost(postId, {
                comments: (post.comments || 0) + 1
            });

            // Clear cache
            this._commentsCache.delete(postId);

            // Send notification
            if (post.userId !== userId) {
                await notificationService.sendCommentNotification(
                    post.userId,
                    userId,
                    postId,
                    'post',
                    content
                );
            }

            // Track analytics
            trackEvent('social_comment_add', {
                userId,
                postId,
                commentLength: content.length
            });

            this._notifyListeners('comment_added', { postId, userId, comment: result });

            logger.info(`💬 Comment added on post ${postId} by user ${userId}`);

            return { id: result.id, ...commentData };
        } catch (error) {
            logger.error('❌ Failed to add comment', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'SOCIAL',
                context: { userId, postId, action: 'add_comment' }
            });
        }
    }

    /**
     * Get comments for a post
     */
    async getPostComments(postId, options = {}) {
        if (!this._enabled) return [];

        const {
            limit = SOCIAL_CONFIG.pagination.defaultPageSize,
            offset = 0
        } = options;

        try {
            const cacheKey = `comments_${postId}_${offset}`;
            const cached = this._commentsCache.get(cacheKey);
            if (cached && cached.expiry > Date.now()) {
                return cached.data;
            }

            const result = await databaseService.query(`posts/${postId}/comments`, {
                where: [['isDeleted', '==', false]],
                orderBy: [['createdAt', 'desc']],
                limit,
                offset
            });

            const comments = result.data || [];

            // Filter out blocked users
            const filtered = comments.filter(c => !this._blockedUsers.has(c.userId));

            this._commentsCache.set(cacheKey, {
                data: filtered,
                expiry: Date.now() + SOCIAL_CONFIG.comments.cacheDuration
            });

            return filtered;
        } catch (error) {
            logger.error('❌ Failed to get comments', { error: error.message });
            return [];
        }
    }

    /**
     * Delete a comment
     */
    async deleteComment(postId, commentId) {
        if (!this._enabled) throw socialError('Social features disabled', { code: 'DISABLED' });

        const userId = getCurrentUser()?.uid;
        if (!userId) throw socialError('Please login to delete comment', { code: 'NOT_AUTHENTICATED' });

        try {
            const comment = await databaseService.read(`posts/${postId}/comments`, commentId);
            if (!comment || comment.isDeleted) throw socialError('Comment not found', { code: 'COMMENT_NOT_FOUND' });

            if (comment.userId !== userId) {
                throw socialError('You can only delete your own comments', { code: 'NOT_AUTHORIZED' });
            }

            await databaseService.update(`posts/${postId}/comments`, commentId, {
                isDeleted: true,
                deletedAt: new Date().toISOString()
            });

            // Update post comment count
            const post = await this.getPost(postId, { cache: false });
            if (post) {
                await databaseService.updatePost(postId, {
                    comments: Math.max(0, (post.comments || 0) - 1)
                });
            }

            // Clear cache
            this._commentsCache.delete(postId);

            this._notifyListeners('comment_deleted', { postId, commentId, userId });

            logger.info(`🗑️ Comment deleted: ${commentId}`);

            return true;
        } catch (error) {
            logger.error('❌ Failed to delete comment', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'SOCIAL',
                context: { userId, postId, commentId, action: 'delete_comment' }
            });
        }
    }

    // ============================================
    // REACTION MANAGEMENT
    // ============================================

    /**
     * Add reaction to post
     */
    async addReaction(postId, type = 'like') {
        if (!this._enabled) throw socialError('Social features disabled', { code: 'DISABLED' });

        const userId = getCurrentUser()?.uid;
        if (!userId) throw socialError('Please login to react', { code: 'NOT_AUTHENTICATED' });

        if (!SOCIAL_CONFIG.reactions.types.includes(type)) {
            throw socialError('Invalid reaction type', { code: 'INVALID_REACTION' });
        }

        try {
            const post = await this.getPost(postId, { cache: false });
            if (!post) throw socialError('Post not found', { code: 'POST_NOT_FOUND' });

            // Check if already reacted
            const existing = await databaseService.query(`posts/${postId}/reactions`, {
                where: [
                    ['userId', '==', userId],
                    ['type', '==', type]
                ]
            });

            if (existing.data.length > 0) {
                // Remove reaction (toggle)
                await databaseService.delete(`posts/${postId}/reactions`, existing.data[0].id);
                
                // Update post
                const reactionKey = type + 's';
                if (post[reactionKey] !== undefined) {
                    await databaseService.updatePost(postId, {
                        [reactionKey]: Math.max(0, (post[reactionKey] || 0) - 1)
                    });
                }

                // Update likes if type is like
                if (type === 'like') {
                    await databaseService.updatePost(postId, {
                        likes: Math.max(0, (post.likes || 0) - 1)
                    });
                }

                this._notifyListeners('reaction_removed', { postId, userId, type });

                logger.info(`👎 Reaction removed: ${type} on post ${postId}`);

                return { action: 'removed', type };
            }

            // Add reaction
            const reactionData = {
                postId,
                userId,
                type,
                createdAt: new Date().toISOString()
            };

            await databaseService.create(`posts/${postId}/reactions`, reactionData);

            // Update post
            const reactionKey = type + 's';
            if (post[reactionKey] !== undefined) {
                await databaseService.updatePost(postId, {
                    [reactionKey]: (post[reactionKey] || 0) + 1
                });
            }

            // Update likes if type is like
            if (type === 'like') {
                await databaseService.updatePost(postId, {
                    likes: (post.likes || 0) + 1
                });
            }

            // Clear cache
            this._postsCache.delete(postId);

            // Send notification
            if (post.userId !== userId) {
                await notificationService.sendLikeNotification(
                    post.userId,
                    userId,
                    postId,
                    'post'
                );
            }

            trackEvent('social_reaction_add', {
                userId,
                postId,
                reactionType: type
            });

            this._notifyListeners('reaction_added', { postId, userId, type });

            logger.info(`👍 Reaction added: ${type} on post ${postId}`);

            return { action: 'added', type };
        } catch (error) {
            logger.error('❌ Failed to add reaction', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'SOCIAL',
                context: { userId, postId, type, action: 'add_reaction' }
            });
        }
    }

    /**
     * Get reactions for a post
     */
    async getPostReactions(postId, options = {}) {
        if (!this._enabled) return [];

        const {
            type = null,
            limit = 50,
            offset = 0
        } = options;

        try {
            let query = [['postId', '==', postId]];
            if (type) query.push(['type', '==', type]);

            const result = await databaseService.query(`posts/${postId}/reactions`, {
                where: query,
                orderBy: [['createdAt', 'desc']],
                limit,
                offset
            });

            return result.data || [];
        } catch (error) {
            logger.error('❌ Failed to get reactions', { error: error.message });
            return [];
        }
    }

    // ============================================
    // FOLLOW MANAGEMENT
    // ============================================

    /**
     * Follow a user
     */
    async followUser(targetUserId) {
        if (!this._enabled) throw socialError('Social features disabled', { code: 'DISABLED' });

        const userId = getCurrentUser()?.uid;
        if (!userId) throw socialError('Please login to follow', { code: 'NOT_AUTHENTICATED' });

        if (userId === targetUserId) {
            throw socialError('You cannot follow yourself', { code: 'FOLLOW_SELF' });
        }

        try {
            // Check if already following
            const existing = await databaseService.query('follows', {
                where: [
                    ['followerId', '==', userId],
                    ['followingId', '==', targetUserId]
                ]
            });

            if (existing.data.length > 0) {
                // Unfollow
                await databaseService.delete('follows', existing.data[0].id);
                
                // Update user stats
                await databaseService.updateUser(userId, {
                    following: Math.max(0, (await this._getUserStats(userId))?.following || 0 - 1)
                });
                await databaseService.updateUser(targetUserId, {
                    followers: Math.max(0, (await this._getUserStats(targetUserId))?.followers || 0 - 1)
                });

                // Clear cache
                this._followingCache.delete(userId);
                this._followersCache.delete(targetUserId);

                this._notifyListeners('unfollowed', { userId, targetUserId });

                logger.info(`👤 User ${userId} unfollowed ${targetUserId}`);

                return { action: 'unfollowed' };
            }

            // Follow
            const followData = {
                followerId: userId,
                followingId: targetUserId,
                createdAt: new Date().toISOString()
            };

            await databaseService.create('follows', followData);

            // Update user stats
            await databaseService.updateUser(userId, {
                following: (await this._getUserStats(userId))?.following || 0 + 1
            });
            await databaseService.updateUser(targetUserId, {
                followers: (await this._getUserStats(targetUserId))?.followers || 0 + 1
            });

            // Clear cache
            this._followingCache.delete(userId);
            this._followersCache.delete(targetUserId);

            // Send notification
            await notificationService.sendFollowNotification(targetUserId, userId);

            trackEvent('social_follow', {
                userId,
                targetUserId
            });

            this._notifyListeners('followed', { userId, targetUserId });

            logger.info(`👤 User ${userId} followed ${targetUserId}`);

            return { action: 'followed' };
        } catch (error) {
            logger.error('❌ Failed to follow/unfollow user', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'SOCIAL',
                context: { userId, targetUserId, action: 'follow' }
            });
        }
    }

    /**
     * Get followers
     */
    async getFollowers(userId, options = {}) {
        if (!this._enabled) return [];

        const {
            limit = SOCIAL_CONFIG.pagination.defaultPageSize,
            offset = 0
        } = options;

        try {
            const cacheKey = `followers_${userId}_${offset}`;
            const cached = this._followersCache.get(cacheKey);
            if (cached && cached.expiry > Date.now()) {
                return cached.data;
            }

            const result = await databaseService.query('follows', {
                where: [['followingId', '==', userId]],
                orderBy: [['createdAt', 'desc']],
                limit,
                offset
            });

            const followers = result.data || [];

            // Get user details
            const followerData = await Promise.all(
                followers.map(async (f) => {
                    const user = await databaseService.getUser(f.followerId);
                    return user ? { ...f, user } : null;
                })
            );

            const filtered = followerData.filter(f => f && !this._blockedUsers.has(f.followerId));

            this._followersCache.set(cacheKey, {
                data: filtered,
                expiry: Date.now() + SOCIAL_CONFIG.follow.cacheDuration
            });

            return filtered;
        } catch (error) {
            logger.error('❌ Failed to get followers', { error: error.message });
            return [];
        }
    }

    /**
     * Get following
     */
    async getFollowing(userId, options = {}) {
        if (!this._enabled) return [];

        const {
            limit = SOCIAL_CONFIG.pagination.defaultPageSize,
            offset = 0
        } = options;

        try {
            const cacheKey = `following_${userId}_${offset}`;
            const cached = this._followingCache.get(cacheKey);
            if (cached && cached.expiry > Date.now()) {
                return cached.data;
            }

            const result = await databaseService.query('follows', {
                where: [['followerId', '==', userId]],
                orderBy: [['createdAt', 'desc']],
                limit,
                offset
            });

            const following = result.data || [];

            // Get user details
            const followingData = await Promise.all(
                following.map(async (f) => {
                    const user = await databaseService.getUser(f.followingId);
                    return user ? { ...f, user } : null;
                })
            );

            const filtered = followingData.filter(f => f && !this._blockedUsers.has(f.followingId));

            this._followingCache.set(cacheKey, {
                data: filtered,
                expiry: Date.now() + SOCIAL_CONFIG.follow.cacheDuration
            });

            return filtered;
        } catch (error) {
            logger.error('❌ Failed to get following', { error: error.message });
            return [];
        }
    }

    /**
     * Check if following
     */
    async isFollowing(followerId, followingId) {
        if (!this._enabled) return false;

        try {
            const result = await databaseService.query('follows', {
                where: [
                    ['followerId', '==', followerId],
                    ['followingId', '==', followingId]
                ]
            });

            return result.data.length > 0;
        } catch (error) {
            logger.error('❌ Failed to check following', { error: error.message });
            return false;
        }
    }

    // ============================================
    // SHARE MANAGEMENT
    // ============================================

    /**
     * Share a post
     */
    async sharePost(postId, options = {}) {
        if (!this._enabled) throw socialError('Social features disabled', { code: 'DISABLED' });

        const userId = getCurrentUser()?.uid;
        if (!userId) throw socialError('Please login to share', { code: 'NOT_AUTHENTICATED' });

        const { platform = 'copy', text = '' } = options;

        try {
            const post = await this.getPost(postId, { cache: false });
            if (!post) throw socialError('Post not found', { code: 'POST_NOT_FOUND' });

            // Update share count
            await databaseService.updatePost(postId, {
                shares: (post.shares || 0) + 1
            });

            this._shareCounts.set(postId, (this._shareCounts.get(postId) || 0) + 1);

            // Track analytics
            trackEvent('social_share', {
                userId,
                postId,
                platform,
                shareCount: this._shareCounts.get(postId)
            });

            this._notifyListeners('post_shared', { postId, userId, platform });

            logger.info(`🔗 Post ${postId} shared by user ${userId} on ${platform}`);

            return {
                success: true,
                platform,
                shareUrl: `${window.location.origin}/post/${postId}`,
                shareText: text || post.content || 'Check out this post!'
            };
        } catch (error) {
            logger.error('❌ Failed to share post', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'SOCIAL',
                context: { userId, postId, platform, action: 'share' }
            });
        }
    }

    // ============================================
    // SAVE MANAGEMENT
    // ============================================

    /**
     * Save a post
     */
    async savePost(postId) {
        if (!this._enabled) throw socialError('Social features disabled', { code: 'DISABLED' });

        const userId = getCurrentUser()?.uid;
        if (!userId) throw socialError('Please login to save', { code: 'NOT_AUTHENTICATED' });

        try {
            const post = await this.getPost(postId, { cache: false });
            if (!post) throw socialError('Post not found', { code: 'POST_NOT_FOUND' });

            // Check if already saved
            const existing = await databaseService.query('saves', {
                where: [
                    ['userId', '==', userId],
                    ['postId', '==', postId]
                ]
            });

            if (existing.data.length > 0) {
                // Unsave
                await databaseService.delete('saves', existing.data[0].id);
                await databaseService.updatePost(postId, {
                    saves: Math.max(0, (post.saves || 0) - 1)
                });
                this._savedPosts.delete(postId);

                this._notifyListeners('post_unsaved', { postId, userId });

                logger.info(`💾 Post ${postId} unsaved by user ${userId}`);

                return { action: 'unsaved' };
            }

            // Save
            const saveData = {
                userId,
                postId,
                createdAt: new Date().toISOString()
            };

            await databaseService.create('saves', saveData);
            await databaseService.updatePost(postId, {
                saves: (post.saves || 0) + 1
            });
            this._savedPosts.add(postId);

            trackEvent('social_save', { userId, postId });

            this._notifyListeners('post_saved', { postId, userId });

            logger.info(`💾 Post ${postId} saved by user ${userId}`);

            return { action: 'saved' };
        } catch (error) {
            logger.error('❌ Failed to save/unsave post', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'SOCIAL',
                context: { userId, postId, action: 'save' }
            });
        }
    }

    /**
     * Get saved posts
     */
    async getSavedPosts(userId, options = {}) {
        if (!this._enabled) return [];

        const {
            limit = SOCIAL_CONFIG.pagination.defaultPageSize,
            offset = 0
        } = options;

        try {
            const result = await databaseService.query('saves', {
                where: [['userId', '==', userId]],
                orderBy: [['createdAt', 'desc']],
                limit,
                offset
            });

            const saves = result.data || [];
            const posts = await Promise.all(
                saves.map(async (s) => {
                    const post = await this.getPost(s.postId, { cache: true });
                    return post ? { ...s, post } : null;
                })
            );

            return posts.filter(p => p !== null);
        } catch (error) {
            logger.error('❌ Failed to get saved posts', { error: error.message });
            return [];
        }
    }

    // ============================================
    // REPORT MANAGEMENT
    // ============================================

    /**
     * Report content
     */
    async reportContent(targetId, targetType, reason, description = '') {
        if (!this._enabled) throw socialError('Social features disabled', { code: 'DISABLED' });

        const userId = getCurrentUser()?.uid;
        if (!userId) throw socialError('Please login to report', { code: 'NOT_AUTHENTICATED' });

        if (!SOCIAL_CONFIG.report.reasons.includes(reason)) {
            throw socialError('Invalid report reason', { code: 'INVALID_REASON' });
        }

        try {
            // Check if already reported
            const existing = await databaseService.query('reports', {
                where: [
                    ['reporterId', '==', userId],
                    ['targetId', '==', targetId],
                    ['targetType', '==', targetType]
                ]
            });

            if (existing.data.length > 0) {
                throw socialError('Already reported this content', { code: 'ALREADY_REPORTED' });
            }

            const reportData = {
                reporterId: userId,
                targetId,
                targetType,
                reason,
                description,
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await databaseService.create('reports', reportData);

            // Mark as reported
            this._reportedContent.add(`${targetType}_${targetId}`);

            trackEvent('social_report', {
                userId,
                targetId,
                targetType,
                reason
            });

            this._notifyListeners('content_reported', { targetId, targetType, userId });

            logger.info(`🚨 Content reported: ${targetType}/${targetId} by user ${userId}`);

            return { success: true };
        } catch (error) {
            logger.error('❌ Failed to report content', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'SOCIAL',
                context: { userId, targetId, targetType, action: 'report' }
            });
        }
    }

    // ============================================
    // BLOCK/MUTE MANAGEMENT
    // ============================================

    /**
     * Block a user
     */
    async blockUser(targetUserId) {
        if (!this._enabled) throw socialError('Social features disabled', { code: 'DISABLED' });

        const userId = getCurrentUser()?.uid;
        if (!userId) throw socialError('Please login to block', { code: 'NOT_AUTHENTICATED' });

        try {
            // Check if already blocked
            const existing = await databaseService.query('blocks', {
                where: [
                    ['blockerId', '==', userId],
                    ['blockedId', '==', targetUserId]
                ]
            });

            if (existing.data.length > 0) {
                // Unblock
                await databaseService.delete('blocks', existing.data[0].id);
                this._blockedUsers.delete(targetUserId);

                this._notifyListeners('unblocked', { userId, targetUserId });

                logger.info(`🔓 User ${userId} unblocked ${targetUserId}`);

                return { action: 'unblocked' };
            }

            // Block
            const blockData = {
                blockerId: userId,
                blockedId: targetUserId,
                createdAt: new Date().toISOString()
            };

            await databaseService.create('blocks', blockData);
            this._blockedUsers.add(targetUserId);

            // Unfollow if following
            await this.followUser(targetUserId);

            trackEvent('social_block', { userId, targetUserId });

            this._notifyListeners('blocked', { userId, targetUserId });

            logger.info(`🔒 User ${userId} blocked ${targetUserId}`);

            return { action: 'blocked' };
        } catch (error) {
            logger.error('❌ Failed to block/unblock user', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'SOCIAL',
                context: { userId, targetUserId, action: 'block' }
            });
        }
    }

    /**
     * Mute a user
     */
    async muteUser(targetUserId, duration = 'forever') {
        if (!this._enabled) throw socialError('Social features disabled', { code: 'DISABLED' });

        const userId = getCurrentUser()?.uid;
        if (!userId) throw socialError('Please login to mute', { code: 'NOT_AUTHENTICATED' });

        try {
            // Check if already muted
            const existing = await databaseService.query('mutes', {
                where: [
                    ['muterId', '==', userId],
                    ['mutedId', '==', targetUserId]
                ]
            });

            if (existing.data.length > 0) {
                // Unmute
                await databaseService.delete('mutes', existing.data[0].id);
                this._mutedUsers.delete(targetUserId);

                this._notifyListeners('unmuted', { userId, targetUserId });

                logger.info(`🔊 User ${userId} unmuted ${targetUserId}`);

                return { action: 'unmuted' };
            }

            const durationMs = duration === 'forever' ? null :
                              duration === 'day' ? 24 * 60 * 60 * 1000 :
                              duration === 'week' ? 7 * 24 * 60 * 60 * 1000 :
                              duration === 'month' ? 30 * 24 * 60 * 60 * 1000 : null;

            const muteData = {
                muterId: userId,
                mutedId: targetUserId,
                duration,
                expiresAt: durationMs ? new Date(Date.now() + durationMs).toISOString() : null,
                createdAt: new Date().toISOString()
            };

            await databaseService.create('mutes', muteData);
            this._mutedUsers.add(targetUserId);

            trackEvent('social_mute', { userId, targetUserId, duration });

            this._notifyListeners('muted', { userId, targetUserId, duration });

            logger.info(`🔇 User ${userId} muted ${targetUserId} for ${duration}`);

            return { action: 'muted', duration };
        } catch (error) {
            logger.error('❌ Failed to mute/unmute user', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'SOCIAL',
                context: { userId, targetUserId, action: 'mute' }
            });
        }
    }

    // ============================================
    // TRENDING & EXPLORE
    // ============================================

    /**
     * Get trending topics
     */
    async getTrendingTopics(limit = 10) {
        if (!this._enabled) return [];

        try {
            // Get recent posts
            const result = await databaseService.query('posts', {
                where: [['isDeleted', '==', false], ['isPublic', '==', true]],
                orderBy: [['createdAt', 'desc']],
                limit: 100
            });

            const posts = result.data || [];
            const topics = new Map();

            for (const post of posts) {
                const tags = post.tags || [];
                for (const tag of tags) {
                    const count = topics.get(tag) || 0;
                    topics.set(tag, count + 1);
                }
            }

            // Sort by count
            const sorted = Array.from(topics.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
                .map(([tag, count]) => ({ tag, count }));

            return sorted;
        } catch (error) {
            logger.error('❌ Failed to get trending topics', { error: error.message });
            return [];
        }
    }

    // ============================================
    // USER STATS
    // ============================================

    /**
     * Get user stats
     */
    async _getUserStats(userId) {
        if (this._userStats.has(userId)) {
            return this._userStats.get(userId);
        }

        try {
            const user = await databaseService.getUser(userId);
            if (user) {
                this._userStats.set(userId, {
                    followers: user.followers || 0,
                    following: user.following || 0,
                    posts: user.totalPosts || 0,
                    likes: user.totalLikes || 0
                });
                return this._userStats.get(userId);
            }
            return null;
        } catch (error) {
            logger.error('❌ Failed to get user stats', { error: error.message });
            return null;
        }
    }

    /**
     * Update user stats
     */
    _updateUserStats(userId, type, delta) {
        const stats = this._userStats.get(userId);
        if (stats) {
            if (type === 'posts') stats.posts = (stats.posts || 0) + delta;
            else if (type === 'followers') stats.followers = (stats.followers || 0) + delta;
            else if (type === 'following') stats.following = (stats.following || 0) + delta;
            else if (type === 'likes') stats.likes = (stats.likes || 0) + delta;
            this._userStats.set(userId, stats);
        }
    }

    // ============================================
    // NOTIFICATION HELPERS
    // ============================================

    /**
     * Notify followers of new post
     */
    async _notifyFollowers(userId, type, targetId, content) {
        try {
            const followers = await this.getFollowers(userId, { limit: 100 });
            
            for (const follower of followers) {
                if (this._mutedUsers.has(follower.followerId)) continue;
                
                await notificationService.sendPostNotification(
                    follower.followerId,
                    userId,
                    targetId,
                    content
                );
            }
        } catch (error) {
            logger.error('❌ Failed to notify followers', { error: error.message });
        }
    }

    // ============================================
    // LOAD DATA
    // ============================================

    /**
     * Load user social data
     */
    async _loadUserSocialData(userId) {
        try {
            // Load blocks
            const blocks = await databaseService.query('blocks', {
                where: [['blockerId', '==', userId]]
            });
            for (const block of blocks.data) {
                this._blockedUsers.add(block.blockedId);
            }

            // Load mutes
            const mutes = await databaseService.query('mutes', {
                where: [['muterId', '==', userId]]
            });
            for (const mute of mutes.data) {
                if (!mute.expiresAt || new Date(mute.expiresAt) > new Date()) {
                    this._mutedUsers.add(mute.mutedId);
                }
            }

            // Load saved posts
            const saves = await databaseService.query('saves', {
                where: [['userId', '==', userId]]
            });
            for (const save of saves.data) {
                this._savedPosts.add(save.postId);
            }

            logger.debug(`👥 Loaded social data for user ${userId}`, {
                blocked: this._blockedUsers.size,
                muted: this._mutedUsers.size,
                saved: this._savedPosts.size
            });
        } catch (error) {
            logger.error('❌ Failed to load user social data', { error: error.message });
        }
    }

    /**
     * Load trending topics
     */
    async _loadTrendingTopics() {
        try {
            const topics = await this.getTrendingTopics(20);
            for (const topic of topics) {
                this._trendingTopics.set(topic.tag, topic.count);
            }
        } catch (error) {
            logger.error('❌ Failed to load trending topics', { error: error.message });
        }
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
    // CLEANUP
    // ============================================

    /**
     * Clear cache
     */
    clearCache() {
        this._postsCache.clear();
        this._storiesCache.clear();
        this._commentsCache.clear();
        this._followingCache.clear();
        this._followersCache.clear();
        this._reactionsCache.clear();
        logger.info('👥 Social cache cleared');
    }

    /**
     * Destroy social service
     */
    destroy() {
        this._postsCache.clear();
        this._storiesCache.clear();
        this._commentsCache.clear();
        this._followingCache.clear();
        this._followersCache.clear();
        this._reactionsCache.clear();
        this._listeners = [];
        this._initialized = false;
        logger.info('👥 Social service destroyed');
    }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

const socialService = new SocialService();

// ============================================================
// EXPORTS
// ============================================================

export { socialService, SOCIAL_CONFIG };

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Initialize social service
 */
export function initSocial(options = {}) {
    return socialService.init(options);
}

/**
 * Create a post
 */
export function createPost(data, options = {}) {
    return socialService.createPost(data, options);
}

/**
 * Get a post
 */
export function getPost(postId, options = {}) {
    return socialService.getPost(postId, options);
}

/**
 * Update a post
 */
export function updatePost(postId, data) {
    return socialService.updatePost(postId, data);
}

/**
 * Delete a post
 */
export function deletePost(postId) {
    return socialService.deletePost(postId);
}

/**
 * Get user posts
 */
export function getUserPosts(userId, options = {}) {
    return socialService.getUserPosts(userId, options);
}

/**
 * Get feed posts
 */
export function getFeedPosts(userId, options = {}) {
    return socialService.getFeedPosts(userId, options);
}

/**
 * Create a story
 */
export function createStory(data, options = {}) {
    return socialService.createStory(data, options);
}

/**
 * Get active stories
 */
export function getActiveStories(options = {}) {
    return socialService.getActiveStories(options);
}

/**
 * View a story
 */
export function viewStory(storyId) {
    return socialService.viewStory(storyId);
}

/**
 * Add a comment
 */
export function addComment(postId, content, options = {}) {
    return socialService.addComment(postId, content, options);
}

/**
 * Get post comments
 */
export function getPostComments(postId, options = {}) {
    return socialService.getPostComments(postId, options);
}

/**
 * Delete a comment
 */
export function deleteComment(postId, commentId) {
    return socialService.deleteComment(postId, commentId);
}

/**
 * Add reaction
 */
export function addReaction(postId, type = 'like') {
    return socialService.addReaction(postId, type);
}

/**
 * Get post reactions
 */
export function getPostReactions(postId, options = {}) {
    return socialService.getPostReactions(postId, options);
}

/**
 * Follow a user
 */
export function followUser(targetUserId) {
    return socialService.followUser(targetUserId);
}

/**
 * Get followers
 */
export function getFollowers(userId, options = {}) {
    return socialService.getFollowers(userId, options);
}

/**
 * Get following
 */
export function getFollowing(userId, options = {}) {
    return socialService.getFollowing(userId, options);
}

/**
 * Check if following
 */
export function isFollowing(followerId, followingId) {
    return socialService.isFollowing(followerId, followingId);
}

/**
 * Share a post
 */
export function sharePost(postId, options = {}) {
    return socialService.sharePost(postId, options);
}

/**
 * Save a post
 */
export function savePost(postId) {
    return socialService.savePost(postId);
}

/**
 * Get saved posts
 */
export function getSavedPosts(userId, options = {}) {
    return socialService.getSavedPosts(userId, options);
}

/**
 * Report content
 */
export function reportContent(targetId, targetType, reason, description = '') {
    return socialService.reportContent(targetId, targetType, reason, description);
}

/**
 * Block a user
 */
export function blockUser(targetUserId) {
    return socialService.blockUser(targetUserId);
}

/**
 * Mute a user
 */
export function muteUser(targetUserId, duration = 'forever') {
    return socialService.muteUser(targetUserId, duration);
}

/**
 * Get trending topics
 */
export function getTrendingTopics(limit = 10) {
    return socialService.getTrendingTopics(limit);
}

/**
 * Add social listener
 */
export function onSocialEvent(callback) {
    return socialService.addListener(callback);
}

/**
 * Clear social cache
 */
export function clearSocialCache() {
    return socialService.clearCache();
}

/**
 * Destroy social service
 */
export function destroySocialService() {
    return socialService.destroy();
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default socialService;
export { SocialService };