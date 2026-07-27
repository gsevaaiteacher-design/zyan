/**
 * ============================================================
 * FILE: js/models/index.js
 * PURPOSE: Central export hub for all data models
 * DEPENDENCY: All model files
 * USED BY: All services, store.js, screens
 * VERSION: 3.0.0
 * ============================================================
 */

// ─── EXPORT ALL MODELS ──────────────────────────────────────

// User Models
export { User, createUser, validateUser, userToFirestore, firestoreToUser } from './user-model.js';

// Product Models
export { Product, createProduct, validateProduct, productToFirestore, firestoreToProduct } from './product-model.js';

// Review Models
export { Review, createReview, validateReview, reviewToFirestore, firestoreToReview } from './review-model.js';

// Category Models
export { Category, createCategory, validateCategory, categoryToFirestore, firestoreToCategory } from './category-model.js';

// Notification Models
export { Notification, createNotification, validateNotification, notificationToFirestore, firestoreToNotification } from './notification-model.js';

// ─── NEW SOCIAL MODELS ──────────────────────────────────────

// Post Models (Social)
export { Post, createPost, validatePost, postToFirestore, firestoreToPost } from './post-model.js';

// Story Models
export { Story, createStory, validateStory, storyToFirestore, firestoreToStory } from './story-model.js';

// Chat Models
export { Chat, createChat, validateChat, chatToFirestore, firestoreToChat } from './chat-model.js';

// AI Chat Models
export { AIChat, createAIChat, validateAIChat, aiChatToFirestore, firestoreToAIChat } from './ai-chat-model.js';

// Ad Watch Models
export { AdWatch, createAdWatch, validateAdWatch, adWatchToFirestore, firestoreToAdWatch } from './ad-watch-model.js';

// Download Models
export { Download, createDownload, validateDownload, downloadToFirestore, firestoreToDownload } from './download-model.js';

// Feed Algorithm Models
export { FeedAlgorithm, createFeedAlgorithm, calculateFeedScore } from './feed-algorithm-model.js';

// ─── MODEL FACTORY ──────────────────────────────────────────

/**
 * Model Factory - Create model instances dynamically
 */
export const ModelFactory = {
    /**
     * Create a model instance by type
     */
    create(type, data = {}) {
        const creators = {
            user: createUser,
            product: createProduct,
            review: createReview,
            category: createCategory,
            notification: createNotification,
            post: createPost,
            story: createStory,
            chat: createChat,
            aiChat: createAIChat,
            adWatch: createAdWatch,
            download: createDownload
        };

        const creator = creators[type];
        if (!creator) {
            throw new Error(`Unknown model type: ${type}`);
        }

        return creator(data);
    },

    /**
     * Validate a model
     */
    validate(type, data) {
        const validators = {
            user: validateUser,
            product: validateProduct,
            review: validateReview,
            category: validateCategory,
            notification: validateNotification,
            post: validatePost,
            story: validateStory,
            chat: validateChat,
            aiChat: validateAIChat,
            adWatch: validateAdWatch,
            download: validateDownload
        };

        const validator = validators[type];
        if (!validator) {
            throw new Error(`Unknown model type: ${type}`);
        }

        return validator(data);
    },

    /**
     * Convert to Firestore
     */
    toFirestore(type, data) {
        const converters = {
            user: userToFirestore,
            product: productToFirestore,
            review: reviewToFirestore,
            category: categoryToFirestore,
            notification: notificationToFirestore,
            post: postToFirestore,
            story: storyToFirestore,
            chat: chatToFirestore,
            aiChat: aiChatToFirestore,
            adWatch: adWatchToFirestore,
            download: downloadToFirestore
        };

        const converter = converters[type];
        if (!converter) {
            throw new Error(`Unknown model type: ${type}`);
        }

        return converter(data);
    },

    /**
     * Convert from Firestore
     */
    fromFirestore(type, doc) {
        const converters = {
            user: firestoreToUser,
            product: firestoreToProduct,
            review: firestoreToReview,
            category: firestoreToCategory,
            notification: firestoreToNotification,
            post: firestoreToPost,
            story: firestoreToStory,
            chat: firestoreToChat,
            aiChat: firestoreToAIChat,
            adWatch: firestoreToAdWatch,
            download: firestoreToDownload
        };

        const converter = converters[type];
        if (!converter) {
            throw new Error(`Unknown model type: ${type}`);
        }

        return converter(doc);
    }
};

// ─── MODEL REGISTRY ──────────────────────────────────────────

/**
 * Model Registry - Get model metadata
 */
export const ModelRegistry = {
    types: {
        user: { collection: 'users', primaryKey: 'uid' },
        product: { collection: 'products', primaryKey: 'id' },
        review: { collection: 'reviews', primaryKey: 'id' },
        category: { collection: 'categories', primaryKey: 'id' },
        notification: { collection: 'notifications', primaryKey: 'id' },
        post: { collection: 'posts', primaryKey: 'id' },
        story: { collection: 'stories', primaryKey: 'id' },
        chat: { collection: 'chats', primaryKey: 'id' },
        aiChat: { collection: 'ai_chats', primaryKey: 'id' },
        adWatch: { collection: 'ad_watches', primaryKey: 'id' },
        download: { collection: 'downloads', primaryKey: 'id' }
    },

    /**
     * Get model metadata
     */
    get(type) {
        const metadata = this.types[type];
        if (!metadata) {
            throw new Error(`Unknown model type: ${type}`);
        }
        return metadata;
    },

    /**
     * Get collection name for model type
     */
    getCollection(type) {
        return this.get(type).collection;
    },

    /**
     * Get primary key for model type
     */
    getPrimaryKey(type) {
        return this.get(type).primaryKey;
    },

    /**
     * Check if model type exists
     */
    exists(type) {
        return !!this.types[type];
    },

    /**
     * Get all model types
     */
    getAllTypes() {
        return Object.keys(this.types);
    }
};

// ─── DEFAULT EXPORT ──────────────────────────────────────────

// Default export with all models
export default {
    // Core Models
    User,
    createUser,
    validateUser,
    userToFirestore,
    firestoreToUser,

    Product,
    createProduct,
    validateProduct,
    productToFirestore,
    firestoreToProduct,

    Review,
    createReview,
    validateReview,
    reviewToFirestore,
    firestoreToReview,

    Category,
    createCategory,
    validateCategory,
    categoryToFirestore,
    firestoreToCategory,

    Notification,
    createNotification,
    validateNotification,
    notificationToFirestore,
    firestoreToNotification,

    // Social Models
    Post,
    createPost,
    validatePost,
    postToFirestore,
    firestoreToPost,

    Story,
    createStory,
    validateStory,
    storyToFirestore,
    firestoreToStory,

    Chat,
    createChat,
    validateChat,
    chatToFirestore,
    firestoreToChat,

    AIChat,
    createAIChat,
    validateAIChat,
    aiChatToFirestore,
    firestoreToAIChat,

    AdWatch,
    createAdWatch,
    validateAdWatch,
    adWatchToFirestore,
    firestoreToAdWatch,

    Download,
    createDownload,
    validateDownload,
    downloadToFirestore,
    firestoreToDownload,

    FeedAlgorithm,
    createFeedAlgorithm,
    calculateFeedScore,

    // Utilities
    ModelFactory,
    ModelRegistry
};