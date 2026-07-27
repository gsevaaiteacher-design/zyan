// ============================================================
// FILE: js/services/database-service.js
// PURPOSE: Complete Firestore Database Service with All Collections
// DEPENDENCY: firebase-config.js, all models, error-handler.js
// USED BY: store.js, all screens, all services
// VERSION: 3.0.0
// ============================================================

import { db } from '../config/firebase-config.js';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    startAt,
    endAt,
    endBefore,
    onSnapshot,
    writeBatch,
    runTransaction,
    serverTimestamp,
    increment,
    arrayUnion,
    arrayRemove,
    FieldPath,
    DocumentReference,
    CollectionReference,
    Query,
    QuerySnapshot,
    DocumentSnapshot,
    Timestamp,
    getCountFromServer,
    whereEqual,
    whereGreaterThan,
    whereGreaterThanOrEqual,
    whereLessThan,
    whereLessThanOrEqual,
    whereArrayContains,
    whereArrayContainsAny,
    whereIn,
    whereNotIn,
    whereNotEqual,
    limitToLast
} from 'firebase/firestore';
import { errorHandler, databaseError, networkError } from './error-handler.js';
import { logger } from './logger.js';
import {
    UserModel,
    ProductModel,
    ReviewModel,
    CategoryModel,
    NotificationModel,
    PostModel,
    StoryModel,
    ChatModel,
    AIChatModel,
    AdWatchModel,
    DownloadModel,
    FeedAlgorithmModel
} from '../models/index.js';

// ============================================================
// DATABASE CONFIGURATION
// ============================================================

const DB_CONFIG = {
    // Default page size for pagination
    defaultPageSize: 20,
    
    // Maximum page size
    maxPageSize: 100,
    
    // Cache duration (ms)
    cacheDuration: 5 * 60 * 1000, // 5 minutes
    
    // Enable real-time listeners
    enableRealtime: true,
    
    // Batch write size
    batchSize: 500,
    
    // Collections
    collections: {
        USERS: 'users',
        PRODUCTS: 'products',
        REVIEWS: 'reviews',
        HISTORY: 'history',
        LIKES: 'likes',
        CATEGORIES: 'categories',
        NOTIFICATIONS: 'notifications',
        REPORTS: 'reports',
        POSTS: 'posts',
        STORIES: 'stories',
        CHATS: 'chats',
        AI_CHATS: 'ai_chats',
        AD_WATCHES: 'ad_watches',
        DOWNLOADS: 'downloads',
        FOLLOWS: 'follows'
    }
};

// ─── CACHE MANAGEMENT ────────────────────────────────────────

class DatabaseCache {
    constructor() {
        this._cache = new Map();
        this._timestamps = new Map();
        this._maxSize = 100;
    }

    get(key) {
        const entry = this._cache.get(key);
        if (!entry) return null;
        
        const timestamp = this._timestamps.get(key);
        if (timestamp && (Date.now() - timestamp) > DB_CONFIG.cacheDuration) {
            this._cache.delete(key);
            this._timestamps.delete(key);
            return null;
        }
        
        return entry;
    }

    set(key, value) {
        if (this._cache.size >= this._maxSize) {
            const oldestKey = this._timestamps.keys().next().value;
            this._cache.delete(oldestKey);
            this._timestamps.delete(oldestKey);
        }
        this._cache.set(key, value);
        this._timestamps.set(key, Date.now());
    }

    clear() {
        this._cache.clear();
        this._timestamps.clear();
    }

    remove(key) {
        this._cache.delete(key);
        this._timestamps.delete(key);
    }
}

const cache = new DatabaseCache();

// ─── MAIN DATABASE SERVICE ──────────────────────────────────

class DatabaseService {
    constructor() {
        this._initialized = false;
        this._listeners = new Map();
        this._offlineQueue = [];
        this._batchQueue = [];
        this._isProcessing = false;
    }

    /**
     * Initialize database service
     */
    async init() {
        if (this._initialized) return;
        
        try {
            // Check connection
            await this._checkConnection();
            
            this._initialized = true;
            logger.info('🗄️ Database Service initialized', {
                collections: Object.keys(DB_CONFIG.collections)
            });
        } catch (error) {
            logger.error('❌ Database Service initialization failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Check database connection
     */
    async _checkConnection() {
        try {
            const testRef = doc(db, 'users', '_test_');
            await getDoc(testRef);
            return true;
        } catch (error) {
            logger.warn('Database connection check failed', { error: error.message });
            return false;
        }
    }

    /**
     * Get collection reference
     */
    _getCollection(name) {
        return collection(db, name);
    }

    /**
     * Get document reference
     */
    _getDocument(collectionName, id) {
        return doc(db, collectionName, id);
    }

    /**
     * Generate cache key
     */
    _generateCacheKey(collectionName, queryParams = {}) {
        return `${collectionName}:${JSON.stringify(queryParams)}`;
    }

    // ─── CRUD OPERATIONS ──────────────────────────────────────

    /**
     * Create a document
     */
    async create(collectionName, data, options = {}) {
        try {
            const startTime = Date.now();
            const colRef = this._getCollection(collectionName);
            const docRef = options.id ? doc(db, collectionName, options.id) : colRef;
            
            const finalData = {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            let result;
            if (options.id) {
                await setDoc(docRef, finalData, { merge: options.merge });
                result = { id: options.id, ...data };
            } else {
                const docSnap = await addDoc(colRef, finalData);
                result = { id: docSnap.id, ...data };
            }

            // Invalidate cache
            cache.remove(this._generateCacheKey(collectionName));

            logger.database('create', collectionName, Date.now() - startTime, {
                id: result.id,
                options
            });

            return result;
        } catch (error) {
            throw errorHandler.handle(error, {
                type: 'DATABASE',
                context: { collection: collectionName, operation: 'create' }
            });
        }
    }

    /**
     * Read a document
     */
    async read(collectionName, id, options = {}) {
        try {
            const startTime = Date.now();
            
            // Check cache
            const cacheKey = this._generateCacheKey(collectionName, { id, ...options });
            if (!options.skipCache) {
                const cached = cache.get(cacheKey);
                if (cached) {
                    logger.database('read-cache', collectionName, 0, { id });
                    return cached;
                }
            }

            const docRef = this._getDocument(collectionName, id);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                throw databaseError(`Document not found: ${id}`, {
                    context: { collection: collectionName, id }
                });
            }

            const data = { id: docSnap.id, ...docSnap.data() };
            
            // Cache result
            cache.set(cacheKey, data);

            logger.database('read', collectionName, Date.now() - startTime, { id });

            return data;
        } catch (error) {
            throw errorHandler.handle(error, {
                type: 'DATABASE',
                context: { collection: collectionName, id, operation: 'read' }
            });
        }
    }

    /**
     * Update a document
     */
    async update(collectionName, id, data, options = {}) {
        try {
            const startTime = Date.now();
            const docRef = this._getDocument(collectionName, id);
            
            const updateData = {
                ...data,
                updatedAt: serverTimestamp()
            };

            await updateDoc(docRef, updateData);

            // Invalidate cache
            cache.remove(this._generateCacheKey(collectionName, { id }));
            cache.remove(this._generateCacheKey(collectionName));

            logger.database('update', collectionName, Date.now() - startTime, {
                id,
                fields: Object.keys(data)
            });

            return true;
        } catch (error) {
            throw errorHandler.handle(error, {
                type: 'DATABASE',
                context: { collection: collectionName, id, operation: 'update' }
            });
        }
    }

    /**
     * Delete a document
     */
    async delete(collectionName, id, options = {}) {
        try {
            const startTime = Date.now();
            const docRef = this._getDocument(collectionName, id);
            
            await deleteDoc(docRef);

            // Invalidate cache
            cache.remove(this._generateCacheKey(collectionName, { id }));
            cache.remove(this._generateCacheKey(collectionName));

            logger.database('delete', collectionName, Date.now() - startTime, { id });

            return true;
        } catch (error) {
            throw errorHandler.handle(error, {
                type: 'DATABASE',
                context: { collection: collectionName, id, operation: 'delete' }
            });
        }
    }

    /**
     * Query documents
     */
    async query(collectionName, constraints = {}, options = {}) {
        try {
            const startTime = Date.now();
            
            // Build query
            let q = this._getCollection(collectionName);
            
            // Apply where constraints
            if (constraints.where) {
                for (const condition of constraints.where) {
                    const [field, operator, value] = condition;
                    q = this._applyWhere(q, field, operator, value);
                }
            }

            // Apply ordering
            if (constraints.orderBy) {
                for (const [field, direction] of constraints.orderBy) {
                    q = orderBy(q, field, direction || 'asc');
                }
            }

            // Apply pagination
            const pageSize = Math.min(
                options.limit || DB_CONFIG.defaultPageSize,
                DB_CONFIG.maxPageSize
            );
            q = limit(q, pageSize);

            if (options.startAfter) {
                q = startAfter(q, options.startAfter);
            }

            if (options.startAt) {
                q = startAt(q, options.startAt);
            }

            // Execute query
            const querySnapshot = await getDocs(q);
            
            const results = [];
            let lastDoc = null;
            
            querySnapshot.forEach((doc) => {
                results.push({ id: doc.id, ...doc.data() });
                lastDoc = doc;
            });

            const response = {
                data: results,
                total: results.length,
                lastDoc,
                hasMore: results.length === pageSize
            };

            logger.database('query', collectionName, Date.now() - startTime, {
                count: results.length,
                constraints: Object.keys(constraints)
            });

            return response;
        } catch (error) {
            throw errorHandler.handle(error, {
                type: 'DATABASE',
                context: { collection: collectionName, operation: 'query' }
            });
        }
    }

    /**
     * Apply where conditions
     */
    _applyWhere(q, field, operator, value) {
        switch (operator) {
            case '==':
                return where(q, field, '==', value);
            case '!=':
                return where(q, field, '!=', value);
            case '>':
                return where(q, field, '>', value);
            case '>=':
                return where(q, field, '>=', value);
            case '<':
                return where(q, field, '<', value);
            case '<=':
                return where(q, field, '<=', value);
            case 'array-contains':
                return where(q, field, 'array-contains', value);
            case 'array-contains-any':
                return where(q, field, 'array-contains-any', value);
            case 'in':
                return where(q, field, 'in', value);
            case 'not-in':
                return where(q, field, 'not-in', value);
            default:
                return where(q, field, '==', value);
        }
    }

    /**
     * Get count of documents
     */
    async count(collectionName, constraints = {}) {
        try {
            let q = this._getCollection(collectionName);
            
            if (constraints.where) {
                for (const condition of constraints.where) {
                    const [field, operator, value] = condition;
                    q = this._applyWhere(q, field, operator, value);
                }
            }

            const snapshot = await getCountFromServer(q);
            return snapshot.data().count;
        } catch (error) {
            throw errorHandler.handle(error, {
                type: 'DATABASE',
                context: { collection: collectionName, operation: 'count' }
            });
        }
    }

    /**
     * Real-time listener
     */
    listen(collectionName, constraints = {}, callback, options = {}) {
        try {
            let q = this._getCollection(collectionName);
            
            if (constraints.where) {
                for (const condition of constraints.where) {
                    const [field, operator, value] = condition;
                    q = this._applyWhere(q, field, operator, value);
                }
            }

            if (constraints.orderBy) {
                for (const [field, direction] of constraints.orderBy) {
                    q = orderBy(q, field, direction || 'asc');
                }
            }

            const pageSize = Math.min(
                options.limit || DB_CONFIG.defaultPageSize,
                DB_CONFIG.maxPageSize
            );
            q = limit(q, pageSize);

            const unsubscribe = onSnapshot(q, (snapshot) => {
                try {
                    const results = [];
                    snapshot.forEach((doc) => {
                        results.push({ id: doc.id, ...doc.data() });
                    });
                    callback(null, results);
                } catch (error) {
                    callback(error, null);
                }
            }, (error) => {
                callback(error, null);
            });

            const listenerId = `${collectionName}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
            this._listeners.set(listenerId, unsubscribe);

            logger.database('listen-start', collectionName, 0, {
                listenerId,
                constraints: Object.keys(constraints)
            });

            return () => {
                this._listeners.delete(listenerId);
                unsubscribe();
                logger.database('listen-stop', collectionName, 0, { listenerId });
            };
        } catch (error) {
            throw errorHandler.handle(error, {
                type: 'DATABASE',
                context: { collection: collectionName, operation: 'listen' }
            });
        }
    }

    /**
     * Batch write
     */
    async batch(operations) {
        try {
            const batch = writeBatch(db);
            
            for (const op of operations) {
                const docRef = this._getDocument(op.collection, op.id);
                
                switch (op.type) {
                    case 'set':
                        batch.set(docRef, op.data, { merge: op.merge || false });
                        break;
                    case 'update':
                        batch.update(docRef, op.data);
                        break;
                    case 'delete':
                        batch.delete(docRef);
                        break;
                }
            }

            await batch.commit();

            // Invalidate cache
            cache.clear();

            logger.database('batch', 'batch', 0, {
                count: operations.length,
                types: operations.map(o => o.type)
            });

            return true;
        } catch (error) {
            throw errorHandler.handle(error, {
                type: 'DATABASE',
                context: { operation: 'batch' }
            });
        }
    }

    /**
     * Transaction
     */
    async transaction(callback) {
        try {
            const result = await runTransaction(db, async (transaction) => {
                return callback(transaction);
            });
            return result;
        } catch (error) {
            throw errorHandler.handle(error, {
                type: 'DATABASE',
                context: { operation: 'transaction' }
            });
        }
    }

    // ─── COLLECTION SPECIFIC METHODS ─────────────────────────

    // === USERS ===

    async getUser(uid) {
        return this.read(DB_CONFIG.collections.USERS, uid);
    }

    async getUserByEmail(email) {
        const result = await this.query(DB_CONFIG.collections.USERS, {
            where: [['email', '==', email]]
        });
        return result.data[0] || null;
    }

    async createUser(userData) {
        return this.create(DB_CONFIG.collections.USERS, userData, { id: userData.uid });
    }

    async updateUser(uid, data) {
        return this.update(DB_CONFIG.collections.USERS, uid, data);
    }

    async deleteUser(uid) {
        return this.delete(DB_CONFIG.collections.USERS, uid);
    }

    async getAllUsers(options = {}) {
        return this.query(DB_CONFIG.collections.USERS, {}, options);
    }

    async getUsersByRole(role, options = {}) {
        return this.query(DB_CONFIG.collections.USERS, {
            where: [[role, '==', true]]
        }, options);
    }

    // === PRODUCTS ===

    async getProduct(productId) {
        return this.read(DB_CONFIG.collections.PRODUCTS, productId);
    }

    async createProduct(productData) {
        return this.create(DB_CONFIG.collections.PRODUCTS, productData);
    }

    async updateProduct(productId, data) {
        return this.update(DB_CONFIG.collections.PRODUCTS, productId, data);
    }

    async deleteProduct(productId) {
        return this.delete(DB_CONFIG.collections.PRODUCTS, productId);
    }

    async getProductsBySeller(sellerId, options = {}) {
        return this.query(DB_CONFIG.collections.PRODUCTS, {
            where: [['sellerId', '==', sellerId]],
            orderBy: [['createdAt', 'desc']]
        }, options);
    }

    async getProductsByCategory(category, options = {}) {
        return this.query(DB_CONFIG.collections.PRODUCTS, {
            where: [['category', '==', category]],
            orderBy: [['createdAt', 'desc']]
        }, options);
    }

    async getProductsByType(type, options = {}) {
        return this.query(DB_CONFIG.collections.PRODUCTS, {
            where: [['productType', '==', type]],
            orderBy: [['createdAt', 'desc']]
        }, options);
    }

    async getFeaturedProducts(options = {}) {
        return this.query(DB_CONFIG.collections.PRODUCTS, {
            where: [['isFeatured', '==', true]],
            orderBy: [['createdAt', 'desc']]
        }, options);
    }

    async getTrendingProducts(options = {}) {
        return this.query(DB_CONFIG.collections.PRODUCTS, {
            where: [['isTrending', '==', true]],
            orderBy: [['views', 'desc']]
        }, options);
    }

    async searchProducts(query, options = {}) {
        // Note: For production, use Algolia/Meilisearch
        // Simple implementation for now
        const result = await this.query(DB_CONFIG.collections.PRODUCTS, {}, options);
        const filtered = result.data.filter(product => {
            const searchStr = (product.title + ' ' + product.description + ' ' + (product.tags || []).join(' ')).toLowerCase();
            return searchStr.includes(query.toLowerCase());
        });
        return { ...result, data: filtered };
    }

    async incrementProductViews(productId) {
        return this.update(DB_CONFIG.collections.PRODUCTS, productId, {
            views: increment(1)
        });
    }

    async incrementProductDownloads(productId) {
        return this.update(DB_CONFIG.collections.PRODUCTS, productId, {
            downloads: increment(1)
        });
    }

    async incrementProductLikes(productId) {
        return this.update(DB_CONFIG.collections.PRODUCTS, productId, {
            likes: increment(1)
        });
    }

    // === REVIEWS ===

    async getReview(reviewId) {
        return this.read(DB_CONFIG.collections.REVIEWS, reviewId);
    }

    async createReview(reviewData) {
        return this.create(DB_CONFIG.collections.REVIEWS, reviewData);
    }

    async updateReview(reviewId, data) {
        return this.update(DB_CONFIG.collections.REVIEWS, reviewId, data);
    }

    async deleteReview(reviewId) {
        return this.delete(DB_CONFIG.collections.REVIEWS, reviewId);
    }

    async getReviewsByProduct(productId, options = {}) {
        return this.query(DB_CONFIG.collections.REVIEWS, {
            where: [['productId', '==', productId]],
            orderBy: [['createdAt', 'desc']]
        }, options);
    }

    async getReviewsByUser(userId, options = {}) {
        return this.query(DB_CONFIG.collections.REVIEWS, {
            where: [['userId', '==', userId]],
            orderBy: [['createdAt', 'desc']]
        }, options);
    }

    // === HISTORY ===

    async getHistory(historyId) {
        return this.read(DB_CONFIG.collections.HISTORY, historyId);
    }

    async createHistory(historyData) {
        return this.create(DB_CONFIG.collections.HISTORY, historyData);
    }

    async updateHistory(historyId, data) {
        return this.update(DB_CONFIG.collections.HISTORY, historyId, data);
    }

    async deleteHistory(historyId) {
        return this.delete(DB_CONFIG.collections.HISTORY, historyId);
    }

    async getHistoryByUser(userId, options = {}) {
        return this.query(DB_CONFIG.collections.HISTORY, {
            where: [['userId', '==', userId]],
            orderBy: [['downloadedAt', 'desc']]
        }, options);
    }

    // === LIKES ===

    async getLike(likeId) {
        return this.read(DB_CONFIG.collections.LIKES, likeId);
    }

    async createLike(likeData) {
        return this.create(DB_CONFIG.collections.LIKES, likeData);
    }

    async deleteLike(likeId) {
        return this.delete(DB_CONFIG.collections.LIKES, likeId);
    }

    async getLikesByUser(userId, options = {}) {
        return this.query(DB_CONFIG.collections.LIKES, {
            where: [['userId', '==', userId]],
            orderBy: [['createdAt', 'desc']]
        }, options);
    }

    async getLikesByProduct(productId, options = {}) {
        return this.query(DB_CONFIG.collections.LIKES, {
            where: [['productId', '==', productId]]
        }, options);
    }

    async hasLiked(userId, productId) {
        const result = await this.query(DB_CONFIG.collections.LIKES, {
            where: [
                ['userId', '==', userId],
                ['productId', '==', productId]
            ]
        });
        return result.data.length > 0;
    }

    // === CATEGORIES ===

    async getCategory(categoryId) {
        return this.read(DB_CONFIG.collections.CATEGORIES, categoryId);
    }

    async createCategory(categoryData) {
        return this.create(DB_CONFIG.collections.CATEGORIES, categoryData);
    }

    async updateCategory(categoryId, data) {
        return this.update(DB_CONFIG.collections.CATEGORIES, categoryId, data);
    }

    async deleteCategory(categoryId) {
        return this.delete(DB_CONFIG.collections.CATEGORIES, categoryId);
    }

    async getAllCategories(options = {}) {
        return this.query(DB_CONFIG.collections.CATEGORIES, {
            orderBy: [['displayOrder', 'asc']]
        }, options);
    }

    async getActiveCategories(options = {}) {
        return this.query(DB_CONFIG.collections.CATEGORIES, {
            where: [['isActive', '==', true]],
            orderBy: [['displayOrder', 'asc']]
        }, options);
    }

    // === NOTIFICATIONS ===

    async getNotification(notificationId) {
        return this.read(DB_CONFIG.collections.NOTIFICATIONS, notificationId);
    }

    async createNotification(notificationData) {
        return this.create(DB_CONFIG.collections.NOTIFICATIONS, notificationData);
    }

    async updateNotification(notificationId, data) {
        return this.update(DB_CONFIG.collections.NOTIFICATIONS, notificationId, data);
    }

    async deleteNotification(notificationId) {
        return this.delete(DB_CONFIG.collections.NOTIFICATIONS, notificationId);
    }

    async getNotificationsByUser(userId, options = {}) {
        return this.query(DB_CONFIG.collections.NOTIFICATIONS, {
            where: [['userId', '==', userId]],
            orderBy: [['createdAt', 'desc']]
        }, options);
    }

    async markNotificationRead(notificationId) {
        return this.update(DB_CONFIG.collections.NOTIFICATIONS, notificationId, {
            isRead: true
        });
    }

    async markAllNotificationsRead(userId) {
        const result = await this.query(DB_CONFIG.collections.NOTIFICATIONS, {
            where: [
                ['userId', '==', userId],
                ['isRead', '==', false]
            ]
        });
        
        const updates = result.data.map(notification => ({
            collection: DB_CONFIG.collections.NOTIFICATIONS,
            id: notification.id,
            type: 'update',
            data: { isRead: true }
        }));

        if (updates.length > 0) {
            await this.batch(updates);
        }
        return updates.length;
    }

    async getUnreadCount(userId) {
        return this.count(DB_CONFIG.collections.NOTIFICATIONS, {
            where: [
                ['userId', '==', userId],
                ['isRead', '==', false]
            ]
        });
    }

    // === POSTS (Social) ===

    async getPost(postId) {
        return this.read(DB_CONFIG.collections.POSTS, postId);
    }

    async createPost(postData) {
        return this.create(DB_CONFIG.collections.POSTS, postData);
    }

    async updatePost(postId, data) {
        return this.update(DB_CONFIG.collections.POSTS, postId, data);
    }

    async deletePost(postId) {
        return this.delete(DB_CONFIG.collections.POSTS, postId);
    }

    async getPostsByUser(userId, options = {}) {
        return this.query(DB_CONFIG.collections.POSTS, {
            where: [['userId', '==', userId]],
            orderBy: [['createdAt', 'desc']]
        }, options);
    }

    async getPostsByCategory(category, options = {}) {
        return this.query(DB_CONFIG.collections.POSTS, {
            where: [['category', '==', category]],
            orderBy: [['createdAt', 'desc']]
        }, options);
    }

    async getFeedPosts(userId, options = {}) {
        // Get following users
        const following = await this.getFollowing(userId);
        const followingIds = following.map(f => f.followingId);
        
        if (followingIds.length === 0) {
            return this.query(DB_CONFIG.collections.POSTS, {
                orderBy: [['createdAt', 'desc']]
            }, options);
        }

        return this.query(DB_CONFIG.collections.POSTS, {
            where: [['userId', 'in', followingIds]],
            orderBy: [['createdAt', 'desc']]
        }, options);
    }

    async incrementPostLikes(postId) {
        return this.update(DB_CONFIG.collections.POSTS, postId, {
            likes: increment(1)
        });
    }

    async incrementPostComments(postId) {
        return this.update(DB_CONFIG.collections.POSTS, postId, {
            comments: increment(1)
        });
    }

    async incrementPostShares(postId) {
        return this.update(DB_CONFIG.collections.POSTS, postId, {
            shares: increment(1)
        });
    }

    // === STORIES ===

    async getStory(storyId) {
        return this.read(DB_CONFIG.collections.STORIES, storyId);
    }

    async createStory(storyData) {
        return this.create(DB_CONFIG.collections.STORIES, storyData);
    }

    async updateStory(storyId, data) {
        return this.update(DB_CONFIG.collections.STORIES, storyId, data);
    }

    async deleteStory(storyId) {
        return this.delete(DB_CONFIG.collections.STORIES, storyId);
    }

    async getStoriesByUser(userId, options = {}) {
        return this.query(DB_CONFIG.collections.STORIES, {
            where: [['userId', '==', userId]],
            orderBy: [['createdAt', 'desc']]
        }, options);
    }

    async getActiveStories(options = {}) {
        const now = new Date();
        return this.query(DB_CONFIG.collections.STORIES, {
            where: [['expiresAt', '>', now]],
            orderBy: [['createdAt', 'desc']]
        }, options);
    }

    async getStoriesForFeed(userId, options = {}) {
        const following = await this.getFollowing(userId);
        const followingIds = following.map(f => f.followingId);
        
        if (followingIds.length === 0) {
            return this.getActiveStories(options);
        }

        return this.query(DB_CONFIG.collections.STORIES, {
            where: [
                ['userId', 'in', followingIds],
                ['expiresAt', '>', new Date()]
            ],
            orderBy: [['createdAt', 'desc']]
        }, options);
    }

    // === CHATS ===

    async getChat(chatId) {
        return this.read(DB_CONFIG.collections.CHATS, chatId);
    }

    async createChat(chatData) {
        return this.create(DB_CONFIG.collections.CHATS, chatData);
    }

    async updateChat(chatId, data) {
        return this.update(DB_CONFIG.collections.CHATS, chatId, data);
    }

    async deleteChat(chatId) {
        return this.delete(DB_CONFIG.collections.CHATS, chatId);
    }

    async getChatsByUser(userId, options = {}) {
        return this.query(DB_CONFIG.collections.CHATS, {
            where: [['participants', 'array-contains', userId]],
            orderBy: [['updatedAt', 'desc']]
        }, options);
    }

    async getChatBetweenUsers(userId1, userId2) {
        const result = await this.query(DB_CONFIG.collections.CHATS, {
            where: [
                ['participants', 'array-contains', userId1]
            ]
        });
        
        return result.data.find(chat => 
            chat.participants.includes(userId2)
        ) || null;
    }

    async addMessage(chatId, message) {
        return this.update(DB_CONFIG.collections.CHATS, chatId, {
            messages: arrayUnion(message),
            lastMessage: message.text,
            lastMessageTime: serverTimestamp()
        });
    }

    async markChatRead(chatId, userId) {
        return this.update(DB_CONFIG.collections.CHATS, chatId, {
            [`unreadCount.${userId}`]: 0
        });
    }

    // === AI CHATS ===

    async getAIChat(aiChatId) {
        return this.read(DB_CONFIG.collections.AI_CHATS, aiChatId);
    }

    async createAIChat(aiChatData) {
        return this.create(DB_CONFIG.collections.AI_CHATS, aiChatData);
    }

    async updateAIChat(aiChatId, data) {
        return this.update(DB_CONFIG.collections.AI_CHATS, aiChatId, data);
    }

    async deleteAIChat(aiChatId) {
        return this.delete(DB_CONFIG.collections.AI_CHATS, aiChatId);
    }

    async getAIChatsByUser(userId, options = {}) {
        return this.query(DB_CONFIG.collections.AI_CHATS, {
            where: [['userId', '==', userId]],
            orderBy: [['updatedAt', 'desc']]
        }, options);
    }

    async getAIChatSession(userId, sessionId) {
        const result = await this.query(DB_CONFIG.collections.AI_CHATS, {
            where: [
                ['userId', '==', userId],
                ['sessionId', '==', sessionId]
            ]
        });
        return result.data[0] || null;
    }

    async addAIMessage(aiChatId, message) {
        return this.update(DB_CONFIG.collections.AI_CHATS, aiChatId, {
            messages: arrayUnion(message),
            updatedAt: serverTimestamp()
        });
    }

    async incrementAIQuestions(aiChatId) {
        return this.update(DB_CONFIG.collections.AI_CHATS, aiChatId, {
            questionCount: increment(1)
        });
    }

    // === AD WATCHES ===

    async getAdWatch(adWatchId) {
        return this.read(DB_CONFIG.collections.AD_WATCHES, adWatchId);
    }

    async createAdWatch(adWatchData) {
        return this.create(DB_CONFIG.collections.AD_WATCHES, adWatchData);
    }

    async updateAdWatch(adWatchId, data) {
        return this.update(DB_CONFIG.collections.AD_WATCHES, adWatchId, data);
    }

    async getAdWatchesByUser(userId, options = {}) {
        return this.query(DB_CONFIG.collections.AD_WATCHES, {
            where: [['userId', '==', userId]],
            orderBy: [['watchedAt', 'desc']]
        }, options);
    }

    async getAdWatchesToday(userId) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        return this.query(DB_CONFIG.collections.AD_WATCHES, {
            where: [
                ['userId', '==', userId],
                ['watchedAt', '>=', startOfDay]
            ]
        });
    }

    // === DOWNLOADS ===

    async getDownload(downloadId) {
        return this.read(DB_CONFIG.collections.DOWNLOADS, downloadId);
    }

    async createDownload(downloadData) {
        return this.create(DB_CONFIG.collections.DOWNLOADS, downloadData);
    }

    async updateDownload(downloadId, data) {
        return this.update(DB_CONFIG.collections.DOWNLOADS, downloadId, data);
    }

    async getDownloadsByUser(userId, options = {}) {
        return this.query(DB_CONFIG.collections.DOWNLOADS, {
            where: [['userId', '==', userId]],
            orderBy: [['downloadedAt', 'desc']]
        }, options);
    }

    async getDownloadsByProduct(productId, options = {}) {
        return this.query(DB_CONFIG.collections.DOWNLOADS, {
            where: [['productId', '==', productId]],
            orderBy: [['downloadedAt', 'desc']]
        }, options);
    }

    // === FOLLOWS ===

    async getFollow(followId) {
        return this.read(DB_CONFIG.collections.FOLLOWS, followId);
    }

    async createFollow(followData) {
        return this.create(DB_CONFIG.collections.FOLLOWS, followData);
    }

    async deleteFollow(followId) {
        return this.delete(DB_CONFIG.collections.FOLLOWS, followId);
    }

    async getFollowers(userId, options = {}) {
        return this.query(DB_CONFIG.collections.FOLLOWS, {
            where: [['followingId', '==', userId]],
            orderBy: [['createdAt', 'desc']]
        }, options);
    }

    async getFollowing(userId, options = {}) {
        return this.query(DB_CONFIG.collections.FOLLOWS, {
            where: [['followerId', '==', userId]],
            orderBy: [['createdAt', 'desc']]
        }, options);
    }

    async isFollowing(followerId, followingId) {
        const result = await this.query(DB_CONFIG.collections.FOLLOWS, {
            where: [
                ['followerId', '==', followerId],
                ['followingId', '==', followingId]
            ]
        });
        return result.data.length > 0;
    }

    async getFollowersCount(userId) {
        return this.count(DB_CONFIG.collections.FOLLOWS, {
            where: [['followingId', '==', userId]]
        });
    }

    async getFollowingCount(userId) {
        return this.count(DB_CONFIG.collections.FOLLOWS, {
            where: [['followerId', '==', userId]]
        });
    }

    // === REPORTS ===

    async getReport(reportId) {
        return this.read(DB_CONFIG.collections.REPORTS, reportId);
    }

    async createReport(reportData) {
        return this.create(DB_CONFIG.collections.REPORTS, reportData);
    }

    async updateReport(reportId, data) {
        return this.update(DB_CONFIG.collections.REPORTS, reportId, data);
    }

    async getReportsByStatus(status, options = {}) {
        return this.query(DB_CONFIG.collections.REPORTS, {
            where: [['status', '==', status]],
            orderBy: [['createdAt', 'desc']]
        }, options);
    }

    async getReportsByTarget(targetId, options = {}) {
        return this.query(DB_CONFIG.collections.REPORTS, {
            where: [['targetId', '==', targetId]],
            orderBy: [['createdAt', 'desc']]
        }, options);
    }

    // ─── UTILITY METHODS ──────────────────────────────────────

    /**
     * Get database statistics
     */
    async getStats() {
        try {
            const stats = {};
            for (const [key, collectionName] of Object.entries(DB_CONFIG.collections)) {
                try {
                    stats[key] = await this.count(collectionName);
                } catch (e) {
                    stats[key] = 'error';
                }
            }
            return {
                collections: stats,
                listenerCount: this._listeners.size,
                cacheSize: cache._cache.size
            };
        } catch (error) {
            logger.error('Failed to get database stats', { error: error.message });
            return null;
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        cache.clear();
        logger.info('🗄️ Database cache cleared');
    }

    /**
     * Get cache size
     */
    getCacheSize() {
        return cache._cache.size;
    }

    /**
     * Remove all listeners
     */
    removeAllListeners() {
        for (const [id, unsubscribe] of this._listeners) {
            try {
                unsubscribe();
            } catch (e) {
                // Ignore
            }
        }
        this._listeners.clear();
        logger.info('🗄️ All database listeners removed');
    }

    /**
     * Get collection reference
     */
    getCollectionRef(collectionName) {
        return this._getCollection(collectionName);
    }

    /**
     * Get document reference
     */
    getDocumentRef(collectionName, id) {
        return this._getDocument(collectionName, id);
    }

    /**
     * Create composite index
     */
    async createIndex(collectionName, fields) {
        // Note: Firestore indexes must be created in Firebase Console
        logger.warn('Create index in Firebase Console', {
            collection: collectionName,
            fields
        });
        return true;
    }

    /**
     * Export database to JSON
     */
    async exportToJSON(collectionName, options = {}) {
        try {
            const result = await this.query(collectionName, {}, { limit: 1000, ...options });
            return {
                collection: collectionName,
                exportedAt: new Date().toISOString(),
                count: result.data.length,
                data: result.data
            };
        } catch (error) {
            logger.error('Export failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Import from JSON
     */
    async importFromJSON(collectionName, data, options = {}) {
        try {
            const results = [];
            for (const item of data) {
                const result = await this.create(collectionName, item, options);
                results.push(result);
            }
            return {
                imported: results.length,
                data: results
            };
        } catch (error) {
            logger.error('Import failed', { error: error.message });
            throw error;
        }
    }
}

// ─── SINGLETON INSTANCE ──────────────────────────────────────

const databaseService = new DatabaseService();

// ─── EXPORTS ──────────────────────────────────────────────────

export { databaseService };

// ─── HELPER FUNCTIONS ────────────────────────────────────────

/**
 * Initialize database
 */
export async function initDatabase() {
    return databaseService.init();
}

/**
 * Get user
 */
export function getUser(uid) {
    return databaseService.getUser(uid);
}

/**
 * Get product
 */
export function getProduct(productId) {
    return databaseService.getProduct(productId);
}

/**
 * Create product
 */
export function createProduct(productData) {
    return databaseService.createProduct(productData);
}

/**
 * Update product
 */
export function updateProduct(productId, data) {
    return databaseService.updateProduct(productId, data);
}

/**
 * Delete product
 */
export function deleteProduct(productId) {
    return databaseService.deleteProduct(productId);
}

/**
 * Get products by seller
 */
export function getProductsBySeller(sellerId, options = {}) {
    return databaseService.getProductsBySeller(sellerId, options);
}

/**
 * Get products by category
 */
export function getProductsByCategory(category, options = {}) {
    return databaseService.getProductsByCategory(category, options);
}

/**
 * Get featured products
 */
export function getFeaturedProducts(options = {}) {
    return databaseService.getFeaturedProducts(options);
}

/**
 * Search products
 */
export function searchProducts(query, options = {}) {
    return databaseService.searchProducts(query, options);
}

/**
 * Create review
 */
export function createReview(reviewData) {
    return databaseService.createReview(reviewData);
}

/**
 * Get reviews by product
 */
export function getReviewsByProduct(productId, options = {}) {
    return databaseService.getReviewsByProduct(productId, options);
}

/**
 * Create notification
 */
export function createNotification(notificationData) {
    return databaseService.createNotification(notificationData);
}

/**
 * Get notifications by user
 */
export function getNotificationsByUser(userId, options = {}) {
    return databaseService.getNotificationsByUser(userId, options);
}

/**
 * Mark notification read
 */
export function markNotificationRead(notificationId) {
    return databaseService.markNotificationRead(notificationId);
}

/**
 * Get unread count
 */
export function getUnreadCount(userId) {
    return databaseService.getUnreadCount(userId);
}

/**
 * Create post
 */
export function createPost(postData) {
    return databaseService.createPost(postData);
}

/**
 * Get posts by user
 */
export function getPostsByUser(userId, options = {}) {
    return databaseService.getPostsByUser(userId, options);
}

/**
 * Get feed posts
 */
export function getFeedPosts(userId, options = {}) {
    return databaseService.getFeedPosts(userId, options);
}

/**
 * Create story
 */
export function createStory(storyData) {
    return databaseService.createStory(storyData);
}

/**
 * Get active stories
 */
export function getActiveStories(options = {}) {
    return databaseService.getActiveStories(options);
}

/**
 * Get stories for feed
 */
export function getStoriesForFeed(userId, options = {}) {
    return databaseService.getStoriesForFeed(userId, options);
}

/**
 * Create chat
 */
export function createChat(chatData) {
    return databaseService.createChat(chatData);
}

/**
 * Get chats by user
 */
export function getChatsByUser(userId, options = {}) {
    return databaseService.getChatsByUser(userId, options);
}

/**
 * Add message
 */
export function addMessage(chatId, message) {
    return databaseService.addMessage(chatId, message);
}

/**
 * Follow user
 */
export function createFollow(followData) {
    return databaseService.createFollow(followData);
}

/**
 * Unfollow user
 */
export function deleteFollow(followId) {
    return databaseService.deleteFollow(followId);
}

/**
 * Get followers
 */
export function getFollowers(userId, options = {}) {
    return databaseService.getFollowers(userId, options);
}

/**
 * Get following
 */
export function getFollowing(userId, options = {}) {
    return databaseService.getFollowing(userId, options);
}

/**
 * Check if following
 */
export function isFollowing(followerId, followingId) {
    return databaseService.isFollowing(followerId, followingId);
}

/**
 * Get followers count
 */
export function getFollowersCount(userId) {
    return databaseService.getFollowersCount(userId);
}

/**
 * Get following count
 */
export function getFollowingCount(userId) {
    return databaseService.getFollowingCount(userId);
}

/**
 * Create download record
 */
export function createDownload(downloadData) {
    return databaseService.createDownload(downloadData);
}

/**
 * Get downloads by user
 */
export function getDownloadsByUser(userId, options = {}) {
    return databaseService.getDownloadsByUser(userId, options);
}

/**
 * Get database stats
 */
export function getDatabaseStats() {
    return databaseService.getStats();
}

/**
 * Clear cache
 */
export function clearDatabaseCache() {
    return databaseService.clearCache();
}

/**
 * Get cache size
 */
export function getCacheSize() {
    return databaseService.getCacheSize();
}

/**
 * Remove all listeners
 */
export function removeAllListeners() {
    return databaseService.removeAllListeners();
}

// ─── DEFAULT EXPORT ──────────────────────────────────────────

export default databaseService;