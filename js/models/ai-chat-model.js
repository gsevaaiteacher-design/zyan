// AI Chat Model
// ============================================================
// FILE: ai-chat-model.js
// PURPOSE: AI Chat Assistant data structure for ZYMORE v3.0
// VERSION: 3.0.0 (Production Ready)
// DEPENDENCY: NONE
// USED BY: ai-service.js, ai-chat.js, settings-screen.js
// LOCATION: js/models/ai-chat-model.js
// ============================================================

// ============================================================
// AI CHAT CLASS - ZYMORE v3.0 CHATGPT STYLE
// ============================================================

/**
 * AIChat Model Class
 * Represents an AI chat session in the ZYMORE Hybrid Platform
 * 
 * ZYMORE v3.0 Features:
 * - 5 Free Questions per day
 * - Ad after 5 questions
 * - 3 More free questions after ad
 * - Ad cycle repeats
 * - Product marketing help
 * - Customer support
 * - Context-aware responses
 * - Session management
 * - Question tracking
 * - Coin system integration
 * - Multi-language support
 * - Response streaming
 * - Message history
 * - Context memory
 * - User feedback
 * - Analytics tracking
 */
export class AIChat {
    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * Create a new AIChat instance
     * @param {Object} data - AI Chat data
     * @param {string} data.id - AI Chat session ID
     * @param {string} data.userId - User ID
     * @param {string} data.sessionId - Session ID (same as id or separate)
     * @param {Array<Object>} data.messages - Message history
     * @param {number} data.questionCount - Number of questions asked
     * @param {number} data.freeQuestionsUsed - Free questions used today
     * @param {number} data.freeQuestionsLimit - Daily free questions limit (default 5)
     * @param {number} data.adFreeQuestionsUsed - Ad-free questions used after ad
     * @param {number} data.adFreeQuestionsLimit - Ad-free questions limit after ad (default 3)
     * @param {boolean} data.adShown - Whether ad was shown in current cycle
     * @param {number} data.adCycleCount - Number of ad cycles completed
     * @param {number} data.coinsUsed - Coins used for this session
     * @param {number} data.totalCoinsUsed - Total coins used overall
     * @param {number} data.coinsEarned - Coins earned from this session
     * @param {Object} data.context - Context for AI responses
     * @param {string} data.context.productId - Product ID for context
     * @param {string} data.context.category - Category for context
     * @param {string} data.context.userQuery - User query for context
     * @param {Array<string>} data.context.interests - User interests
     * @param {string} data.context.language - Language preference
     * @param {string} data.model - AI model used
     * @param {string} data.temperature - AI temperature setting
     * @param {number} data.maxTokens - Max tokens for response
     * @param {string} data.prompt - System prompt
     * @param {Array<Object>} data.feedback - User feedback on responses
     * @param {Object} data.analytics - Analytics data
     * @param {Date|string} data.createdAt - Creation date
     * @param {Date|string} data.updatedAt - Last update date
     * @param {Date|string} data.lastActivity - Last activity date
     * @param {Date|string} data.resetDate - Daily reset date
     * @param {string} data.status - Session status (active, expired, completed)
     * @param {Object} data.metadata - Additional metadata
     * @param {boolean} data.isActive - Active status
     * @param {boolean} data.isDeleted - Deleted status
     * @param {boolean} data.isArchived - Archived status
     * @param {Array<string>} data.tags - Tags for categorization
     * @param {string} data.rating - Session rating (1-5)
     * @param {string} data.ratingFeedback - Rating feedback
     * @param {Object} data.settings - User settings for AI
     */
    constructor(data = {}) {
        // ============================================
        // 📌 BASIC INFORMATION
        // ============================================
        this.id = data.id || data.sessionId || this.generateId();
        this.userId = data.userId || '';
        this.sessionId = data.sessionId || this.id;
        this.title = data.title || 'AI Chat Session';
        this.status = data.status || 'active'; // 'active' | 'expired' | 'completed' | 'archived'
        
        // ============================================
        // 💬 MESSAGES
        // ============================================
        this.messages = Array.isArray(data.messages) ? [...data.messages] : [];
        this.messageCount = data.messageCount || 0;
        this.totalMessages = data.totalMessages || 0;
        
        // ============================================
        // 📊 QUESTION TRACKING
        // ============================================
        this.questionCount = data.questionCount || 0;
        this.totalQuestions = data.totalQuestions || 0;
        this.freeQuestionsUsed = data.freeQuestionsUsed || 0;
        this.freeQuestionsLimit = data.freeQuestionsLimit || 5;
        this.adFreeQuestionsUsed = data.adFreeQuestionsUsed || 0;
        this.adFreeQuestionsLimit = data.adFreeQuestionsLimit || 3;
        this.adShown = data.adShown || false;
        this.adCycleCount = data.adCycleCount || 0;
        this.questionsToday = data.questionsToday || 0;
        this.resetDate = data.resetDate ? new Date(data.resetDate) : new Date();
        
        // ============================================
        // 💰 COINS
        // ============================================
        this.coinsUsed = data.coinsUsed || 0;
        this.totalCoinsUsed = data.totalCoinsUsed || 0;
        this.coinsEarned = data.coinsEarned || 0;
        this.coinsSaved = data.coinsSaved || 0;
        this.coinsBalance = data.coinsBalance || 0;
        
        // ============================================
        // 🎯 CONTEXT
        // ============================================
        this.context = {
            productId: data.context?.productId || '',
            productTitle: data.context?.productTitle || '',
            productDescription: data.context?.productDescription || '',
            productCategory: data.context?.productCategory || '',
            productPrice: data.context?.productPrice || 0,
            category: data.context?.category || '',
            userQuery: data.context?.userQuery || '',
            interests: Array.isArray(data.context?.interests) ? [...data.context.interests] : [],
            language: data.context?.language || 'en',
            previousTopics: Array.isArray(data.context?.previousTopics) ? [...data.context.previousTopics] : [],
            conversationState: data.context?.conversationState || 'initial',
            ...data.context
        };
        
        // ============================================
        // 🤖 AI SETTINGS
        // ============================================
        this.model = data.model || 'gpt-3.5-turbo';
        this.temperature = data.temperature || 0.7;
        this.maxTokens = data.maxTokens || 500;
        this.topP = data.topP || 0.9;
        this.frequencyPenalty = data.frequencyPenalty || 0;
        this.presencePenalty = data.presencePenalty || 0;
        this.prompt = data.prompt || this.getDefaultPrompt();
        this.responseSpeed = data.responseSpeed || 'medium'; // 'fast' | 'medium' | 'detailed'
        this.streaming = data.streaming !== undefined ? data.streaming : true;
        
        // ============================================
        // 📝 FEEDBACK
        // ============================================
        this.feedback = Array.isArray(data.feedback) ? [...data.feedback] : [];
        this.rating = data.rating || 0;
        this.ratingFeedback = data.ratingFeedback || '';
        this.helpfulCount = data.helpfulCount || 0;
        this.notHelpfulCount = data.notHelpfulCount || 0;
        this.accuracyScore = data.accuracyScore || 0;
        this.satisfactionScore = data.satisfactionScore || 0;
        
        // ============================================
        // 📈 ANALYTICS
        // ============================================
        this.analytics = {
            totalQuestions: data.analytics?.totalQuestions || 0,
            totalResponses: data.analytics?.totalResponses || 0,
            averageResponseTime: data.analytics?.averageResponseTime || 0,
            averageResponseLength: data.analytics?.averageResponseLength || 0,
            popularTopics: data.analytics?.popularTopics || [],
            dailyUsage: data.analytics?.dailyUsage || {},
            weeklyUsage: data.analytics?.weeklyUsage || {},
            monthlyUsage: data.analytics?.monthlyUsage || {},
            responseStats: data.analytics?.responseStats || { helpful: 0, notHelpful: 0, neutral: 0 },
            categoryStats: data.analytics?.categoryStats || {},
            averageRating: data.analytics?.averageRating || 0,
            ...data.analytics
        };
        
        // ============================================
        // ⏰ TIMESTAMPS
        // ============================================
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
        this.lastActivity = data.lastActivity ? new Date(data.lastActivity) : new Date();
        this.resetDate = data.resetDate ? new Date(data.resetDate) : new Date();
        this.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
        this.lastQuestionAt = data.lastQuestionAt ? new Date(data.lastQuestionAt) : null;
        this.lastResponseAt = data.lastResponseAt ? new Date(data.lastResponseAt) : null;
        this.firstQuestionAt = data.firstQuestionAt ? new Date(data.firstQuestionAt) : null;
        this.completedAt = data.completedAt ? new Date(data.completedAt) : null;
        
        // ============================================
        // 🏷️ TAGS & METADATA
        // ============================================
        this.tags = Array.isArray(data.tags) ? [...data.tags] : [];
        this.category = data.category || 'general';
        this.priority = data.priority || 'normal'; // 'low' | 'normal' | 'high'
        this.language = data.language || 'en';
        this.translations = data.translations || {};
        
        // ============================================
        // 🚩 STATUS FLAGS
        // ============================================
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.isDeleted = data.isDeleted || false;
        this.isArchived = data.isArchived || false;
        this.isBlocked = data.isBlocked || false;
        this.isPinned = data.isPinned || false;
        this.isStarred = data.isStarred || false;
        this.isReadOnly = data.isReadOnly || false;
        this.isTemporary = data.isTemporary || false;
        this.isPersistent = data.isPersistent !== undefined ? data.isPersistent : true;
        
        // ============================================
        // 📊 USAGE STATS
        // ============================================
        this.usageStats = {
            totalSessions: data.usageStats?.totalSessions || 0,
            totalQuestions: data.usageStats?.totalQuestions || 0,
            averageQuestionsPerSession: data.usageStats?.averageQuestionsPerSession || 0,
            totalTimeSpent: data.usageStats?.totalTimeSpent || 0, // in seconds
            averageSessionDuration: data.usageStats?.averageSessionDuration || 0,
            lastSessionDate: data.usageStats?.lastSessionDate ? new Date(data.usageStats.lastSessionDate) : null,
            ...data.usageStats
        };
        
        // ============================================
        // 🔄 SYNC & VERSION
        // ============================================
        this.lastSync = data.lastSync ? new Date(data.lastSync) : new Date();
        this.syncVersion = data.syncVersion || 1;
        this.appVersion = data.appVersion || '3.0.0';
        
        // ============================================
        // 📝 NOTES
        // ============================================
        this.notes = data.notes || '';
        this.internalNotes = data.internalNotes || '';
        this.customFields = data.customFields || {};
        this.metadata = data.metadata || {};
    }

    // ============================================
    // ID GENERATION
    // ============================================

    /**
     * Generate a unique session ID
     * @returns {string} Unique ID
     */
    generateId() {
        return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate a unique message ID
     * @returns {string} Unique message ID
     */
    generateMessageId() {
        return `ai_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get default system prompt
     * @returns {string} Default prompt
     */
    getDefaultPrompt() {
        return `You are ZYMORE AI Assistant, a helpful assistant for a digital marketplace platform.

Key Information:
- Platform: ZYMORE Marketplace
- Products: Digital products (PDF, images, audio, video, software), Physical products, Services
- Users: Creators, Sellers, Buyers
- Features: Digital downloads, Physical products, Social features, AI Chat, Direct Chat

Your Role:
1. Help users with product recommendations
2. Assist with platform navigation
3. Provide marketing advice for sellers
4. Answer customer support questions
5. Explain platform features
6. Help with technical issues

Guidelines:
- Be helpful, friendly, and professional
- Provide accurate information
- Keep responses concise but comprehensive
- Ask clarifying questions when needed
- Offer practical solutions
- Stay within platform scope

You are integrated with the platform to help users with their needs.`;
    }

    // ============================================
    // VALIDATION
    // ============================================

    /**
     * Validate AI Chat data
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

        // === MESSAGES ===
        if (this.messages && this.messages.length > 1000) {
            warnings.push('Message history exceeds 1000 messages');
        }

        // === QUESTION TRACKING ===
        if (this.freeQuestionsUsed > this.freeQuestionsLimit) {
            warnings.push('Free questions used exceeds limit');
        }
        if (this.adFreeQuestionsUsed > this.adFreeQuestionsLimit) {
            warnings.push('Ad-free questions used exceeds limit');
        }

        // === STATUS ===
        const validStatuses = ['active', 'expired', 'completed', 'archived'];
        if (this.status && !validStatuses.includes(this.status)) {
            errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        // === TEMPERATURE ===
        if (this.temperature < 0 || this.temperature > 2) {
            warnings.push('Temperature should be between 0 and 2');
        }

        // === MAX TOKENS ===
        if (this.maxTokens < 10 || this.maxTokens > 4096) {
            warnings.push('Max tokens should be between 10 and 4096');
        }

        // === STRICT VALIDATION ===
        if (strict) {
            if (!this.title) {
                warnings.push('Session title is recommended');
            }
            if (this.messages.length === 0) {
                warnings.push('Session has no messages');
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
     * @param {boolean} options.includeMessages - Include messages
     * @param {boolean} options.includeAnalytics - Include analytics
     * @param {boolean} options.includeFeedback - Include feedback
     * @returns {Object} Firestore document
     */
    toFirestore(options = {}) {
        const { includeMetadata = true, includeMessages = true, includeAnalytics = true, includeFeedback = true } = options;

        const data = {
            userId: this.userId,
            sessionId: this.sessionId,
            title: this.title,
            status: this.status,
            questionCount: this.questionCount,
            totalQuestions: this.totalQuestions,
            freeQuestionsUsed: this.freeQuestionsUsed,
            freeQuestionsLimit: this.freeQuestionsLimit,
            adFreeQuestionsUsed: this.adFreeQuestionsUsed,
            adFreeQuestionsLimit: this.adFreeQuestionsLimit,
            adShown: this.adShown,
            adCycleCount: this.adCycleCount,
            questionsToday: this.questionsToday,
            resetDate: this.resetDate.toISOString(),
            coinsUsed: this.coinsUsed,
            totalCoinsUsed: this.totalCoinsUsed,
            coinsEarned: this.coinsEarned,
            coinsSaved: this.coinsSaved,
            coinsBalance: this.coinsBalance,
            context: { ...this.context },
            model: this.model,
            temperature: this.temperature,
            maxTokens: this.maxTokens,
            topP: this.topP,
            frequencyPenalty: this.frequencyPenalty,
            presencePenalty: this.presencePenalty,
            prompt: this.prompt,
            responseSpeed: this.responseSpeed,
            streaming: this.streaming,
            rating: this.rating,
            ratingFeedback: this.ratingFeedback,
            helpfulCount: this.helpfulCount,
            notHelpfulCount: this.notHelpfulCount,
            accuracyScore: this.accuracyScore,
            satisfactionScore: this.satisfactionScore,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            lastActivity: this.lastActivity.toISOString(),
            expiresAt: this.expiresAt ? this.expiresAt.toISOString() : null,
            lastQuestionAt: this.lastQuestionAt ? this.lastQuestionAt.toISOString() : null,
            lastResponseAt: this.lastResponseAt ? this.lastResponseAt.toISOString() : null,
            firstQuestionAt: this.firstQuestionAt ? this.firstQuestionAt.toISOString() : null,
            completedAt: this.completedAt ? this.completedAt.toISOString() : null,
            tags: [...this.tags],
            category: this.category,
            priority: this.priority,
            language: this.language,
            isActive: this.isActive,
            isDeleted: this.isDeleted,
            isArchived: this.isArchived,
            isBlocked: this.isBlocked,
            isPinned: this.isPinned,
            isStarred: this.isStarred,
            isReadOnly: this.isReadOnly,
            isTemporary: this.isTemporary,
            isPersistent: this.isPersistent,
            usageStats: { ...this.usageStats },
            notes: this.notes,
            internalNotes: this.internalNotes,
            customFields: this.customFields,
            lastSync: this.lastSync.toISOString(),
            syncVersion: this.syncVersion,
            appVersion: this.appVersion
        };

        if (includeMessages) {
            data.messages = [...this.messages];
            data.messageCount = this.messageCount;
            data.totalMessages = this.totalMessages;
        }

        if (includeAnalytics) {
            data.analytics = { ...this.analytics };
        }

        if (includeFeedback) {
            data.feedback = [...this.feedback];
        }

        if (includeMetadata) {
            data.metadata = this.metadata;
            data.translations = this.translations;
        }

        return data;
    }

    /**
     * Convert to JSON
     * @param {Object} options - Conversion options
     * @param {boolean} options.includePrivate - Include private fields
     * @param {boolean} options.includeMetadata - Include metadata
     * @param {boolean} options.includeMessages - Include messages
     * @param {boolean} options.includeAnalytics - Include analytics
     * @param {boolean} options.includeFeedback - Include feedback
     * @returns {Object} JSON object
     */
    toJSON(options = {}) {
        const { includePrivate = false, includeMetadata = false, includeMessages = false, includeAnalytics = false, includeFeedback = false } = options;

        const data = {
            id: this.id,
            userId: this.userId,
            sessionId: this.sessionId,
            title: this.title,
            status: this.status,
            questionCount: this.questionCount,
            totalQuestions: this.totalQuestions,
            freeQuestionsUsed: this.freeQuestionsUsed,
            freeQuestionsLimit: this.freeQuestionsLimit,
            adFreeQuestionsUsed: this.adFreeQuestionsUsed,
            adFreeQuestionsLimit: this.adFreeQuestionsLimit,
            adShown: this.adShown,
            adCycleCount: this.adCycleCount,
            questionsToday: this.questionsToday,
            resetDate: this.resetDate.toISOString(),
            coinsUsed: this.coinsUsed,
            coinsEarned: this.coinsEarned,
            coinsSaved: this.coinsSaved,
            coinsBalance: this.coinsBalance,
            context: { ...this.context },
            model: this.model,
            temperature: this.temperature,
            maxTokens: this.maxTokens,
            topP: this.topP,
            frequencyPenalty: this.frequencyPenalty,
            presencePenalty: this.presencePenalty,
            responseSpeed: this.responseSpeed,
            streaming: this.streaming,
            rating: this.rating,
            ratingFeedback: this.ratingFeedback,
            helpfulCount: this.helpfulCount,
            notHelpfulCount: this.notHelpfulCount,
            accuracyScore: this.accuracyScore,
            satisfactionScore: this.satisfactionScore,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            lastActivity: this.lastActivity.toISOString(),
            expiresAt: this.expiresAt ? this.expiresAt.toISOString() : null,
            lastQuestionAt: this.lastQuestionAt ? this.lastQuestionAt.toISOString() : null,
            lastResponseAt: this.lastResponseAt ? this.lastResponseAt.toISOString() : null,
            firstQuestionAt: this.firstQuestionAt ? this.firstQuestionAt.toISOString() : null,
            completedAt: this.completedAt ? this.completedAt.toISOString() : null,
            tags: [...this.tags],
            category: this.category,
            priority: this.priority,
            language: this.language,
            isActive: this.isActive,
            isDeleted: this.isDeleted,
            isArchived: this.isArchived,
            isBlocked: this.isBlocked,
            isPinned: this.isPinned,
            isStarred: this.isStarred,
            isReadOnly: this.isReadOnly,
            isTemporary: this.isTemporary,
            isPersistent: this.isPersistent,
            usageStats: { ...this.usageStats },
            notes: this.notes
        };

        if (includePrivate) {
            data.totalCoinsUsed = this.totalCoinsUsed;
            data.isBlocked = this.isBlocked;
            data.internalNotes = this.internalNotes;
            data.customFields = this.customFields;
            data.translations = this.translations;
        }

        if (includeMetadata) {
            data.metadata = this.metadata;
        }

        if (includeMessages) {
            data.messages = [...this.messages];
            data.messageCount = this.messageCount;
            data.totalMessages = this.totalMessages;
        }

        if (includeAnalytics) {
            data.analytics = { ...this.analytics };
        }

        if (includeFeedback) {
            data.feedback = [...this.feedback];
        }

        return data;
    }

    /**
     * Get public AI Chat data
     * @param {Object} options - Options
     * @param {boolean} options.includeMessages - Include messages
     * @param {number} options.messageLimit - Message limit
     * @param {boolean} options.includeContext - Include context
     * @returns {Object} Public AI Chat data
     */
    getPublicData(options = {}) {
        const { includeMessages = true, messageLimit = 50, includeContext = true } = options;

        const data = {
            id: this.id,
            sessionId: this.sessionId,
            title: this.title,
            status: this.status,
            questionCount: this.questionCount,
            freeQuestionsUsed: this.freeQuestionsUsed,
            freeQuestionsLimit: this.freeQuestionsLimit,
            adShown: this.adShown,
            adCycleCount: this.adCycleCount,
            coinsUsed: this.coinsUsed,
            coinsBalance: this.coinsBalance,
            model: this.model,
            rating: this.rating,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            lastActivity: this.lastActivity.toISOString(),
            category: this.category,
            language: this.language,
            isActive: this.isActive,
            isPinned: this.isPinned,
            isStarred: this.isStarred,
            responseSpeed: this.responseSpeed
        };

        if (includeMessages) {
            const messages = this.getRecentMessages(messageLimit);
            data.messages = messages;
            data.messageCount = this.messageCount;
            data.totalMessages = this.totalMessages;
        }

        if (includeContext) {
            data.context = {
                productId: this.context.productId,
                productTitle: this.context.productTitle,
                category: this.context.category,
                interests: [...this.context.interests],
                language: this.context.language,
                conversationState: this.context.conversationState
            };
        }

        return data;
    }

    /**
     * Get minimal AI Chat data (for list)
     * @param {Object} options - Options
     * @param {boolean} options.includeLastMessage - Include last message
     * @returns {Object} Minimal AI Chat data
     */
    getMinimalData(options = {}) {
        const { includeLastMessage = true } = options;

        const data = {
            id: this.id,
            sessionId: this.sessionId,
            title: this.title,
            status: this.status,
            questionCount: this.questionCount,
            freeQuestionsUsed: this.freeQuestionsUsed,
            freeQuestionsLimit: this.freeQuestionsLimit,
            adShown: this.adShown,
            adCycleCount: this.adCycleCount,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            lastActivity: this.lastActivity.toISOString(),
            category: this.category,
            language: this.language,
            isActive: this.isActive,
            isPinned: this.isPinned,
            isStarred: this.isStarred
        };

        if (includeLastMessage && this.messages.length > 0) {
            const lastMessage = this.messages[this.messages.length - 1];
            data.lastMessage = {
                role: lastMessage.role,
                content: lastMessage.content,
                timestamp: lastMessage.timestamp || lastMessage.createdAt || this.lastActivity.toISOString()
            };
        }

        return data;
    }

    // ============================================
    // MESSAGE METHODS
    // ============================================

    /**
     * Add a message to the chat
     * @param {Object} message - Message data
     * @param {string} message.role - Message role (user, assistant, system)
     * @param {string} message.content - Message content
     * @param {Object} message.metadata - Message metadata
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @param {boolean} options.isQuestion - Is this a question
     * @returns {AIChat} Updated AI Chat (this)
     */
    addMessage(message, options = {}) {
        const { emitEvent = true, isQuestion = false } = options;

        const newMessage = {
            id: this.generateMessageId(),
            role: message.role || 'user',
            content: message.content || '',
            metadata: message.metadata || {},
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        this.messages.push(newMessage);
        this.messageCount = (this.messageCount || 0) + 1;
        this.totalMessages = (this.totalMessages || 0) + 1;

        if (message.role === 'user') {
            this.questionCount = (this.questionCount || 0) + 1;
            this.totalQuestions = (this.totalQuestions || 0) + 1;
            this.lastQuestionAt = new Date();
            this.questionsToday = (this.questionsToday || 0) + 1;
            this.freeQuestionsUsed = (this.freeQuestionsUsed || 0) + 1;

            // Update daily usage
            const date = new Date().toISOString().split('T')[0];
            this.analytics.dailyUsage[date] = (this.analytics.dailyUsage[date] || 0) + 1;
        }

        if (message.role === 'assistant') {
            this.lastResponseAt = new Date();
            this.analytics.totalResponses = (this.analytics.totalResponses || 0) + 1;
        }

        this.lastActivity = new Date();
        this.updatedAt = new Date();

        if (this.firstQuestionAt === null && message.role === 'user') {
            this.firstQuestionAt = new Date();
        }

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ai:message', { sessionId: this.id, message: newMessage });
        }

        return this;
    }

    /**
     * Get recent messages
     * @param {number} limit - Message limit
     * @param {string} beforeId - Get messages before this ID
     * @returns {Array<Object>} Messages
     */
    getRecentMessages(limit = 50, beforeId = '') {
        let messages = [...this.messages];
        if (beforeId) {
            const index = messages.findIndex(m => m.id === beforeId);
            if (index !== -1) {
                messages = messages.slice(0, index);
            }
        }
        return messages.slice(-limit);
    }

    /**
     * Get messages by role
     * @param {string} role - Message role (user, assistant, system)
     * @returns {Array<Object>} Filtered messages
     */
    getMessagesByRole(role) {
        return this.messages.filter(m => m.role === role);
    }

    /**
     * Get user questions
     * @returns {Array<Object>} User questions
     */
    getUserQuestions() {
        return this.messages.filter(m => m.role === 'user');
    }

    /**
     * Get assistant responses
     * @returns {Array<Object>} Assistant responses
     */
    getAssistantResponses() {
        return this.messages.filter(m => m.role === 'assistant');
    }

    /**
     * Clear message history
     * @param {Object} options - Options
     * @param {boolean} options.keepSystem - Keep system messages
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AIChat} Updated AI Chat (this)
     */
    clearHistory(options = {}) {
        const { keepSystem = true, emitEvent = true } = options;
        
        if (keepSystem) {
            this.messages = this.messages.filter(m => m.role === 'system');
        } else {
            this.messages = [];
        }
        
        this.messageCount = this.messages.length;
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ai:history_cleared', { sessionId: this.id });
        }

        return this;
    }

    // ============================================
    // QUESTION TRACKING METHODS
    // ============================================

    /**
     * Check if user has free questions available
     * @param {Object} options - Options
     * @param {boolean} options.checkReset - Check daily reset
     * @returns {boolean} True if available
     */
    hasFreeQuestions(options = {}) {
        const { checkReset = true } = options;
        
        if (checkReset) {
            this.checkDailyReset();
        }
        
        return this.freeQuestionsUsed < this.freeQuestionsLimit;
    }

    /**
     * Check if user has ad-free questions available
     * @returns {boolean} True if available
     */
    hasAdFreeQuestions() {
        return this.adShown && this.adFreeQuestionsUsed < this.adFreeQuestionsLimit;
    }

    /**
     * Get remaining free questions
     * @param {Object} options - Options
     * @param {boolean} options.checkReset - Check daily reset
     * @returns {number} Remaining questions
     */
    getRemainingFreeQuestions(options = {}) {
        const { checkReset = true } = options;
        
        if (checkReset) {
            this.checkDailyReset();
        }
        
        return Math.max(0, this.freeQuestionsLimit - this.freeQuestionsUsed);
    }

    /**
     * Get remaining ad-free questions
     * @returns {number} Remaining questions
     */
    getRemainingAdFreeQuestions() {
        if (!this.adShown) return 0;
        return Math.max(0, this.adFreeQuestionsLimit - this.adFreeQuestionsUsed);
    }

    /**
     * Check if ad should be shown
     * @param {Object} options - Options
     * @param {number} options.freeQuestionsLimit - Free questions limit
     * @returns {boolean} True if ad should be shown
     */
    shouldShowAd(options = {}) {
        const limit = options.freeQuestionsLimit || this.freeQuestionsLimit;
        
        // Already shown ad in this cycle
        if (this.adShown) return false;
        
        // Free questions limit reached
        return this.freeQuestionsUsed >= limit;
    }

    /**
     * Check daily reset
     * @returns {boolean} True if reset occurred
     */
    checkDailyReset() {
        const today = new Date();
        const resetDate = new Date(this.resetDate || today);
        
        const isDifferentDay = resetDate.getDate() !== today.getDate() ||
                               resetDate.getMonth() !== today.getMonth() ||
                               resetDate.getFullYear() !== today.getFullYear();
        
        if (isDifferentDay) {
            this.resetDaily();
            return true;
        }
        
        return false;
    }

    /**
     * Reset daily questions
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AIChat} Updated AI Chat (this)
     */
    resetDaily(options = {}) {
        const { emitEvent = true } = options;
        
        this.freeQuestionsUsed = 0;
        this.adShown = false;
        this.adFreeQuestionsUsed = 0;
        this.adCycleCount = 0;
        this.questionsToday = 0;
        this.resetDate = new Date();
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ai:daily_reset', { sessionId: this.id });
        }

        return this;
    }

    /**
     * Show ad and reset ad-free questions
     * @param {Object} options - Options
     * @param {number} options.adFreeQuestions - Ad-free questions count
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AIChat} Updated AI Chat (this)
     */
    showAd(options = {}) {
        const { adFreeQuestions = 3, emitEvent = true } = options;
        
        this.adShown = true;
        this.adCycleCount = (this.adCycleCount || 0) + 1;
        this.adFreeQuestionsUsed = 0;
        this.adFreeQuestionsLimit = adFreeQuestions;
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ai:ad_shown', { 
                sessionId: this.id, 
                cycleCount: this.adCycleCount,
                adFreeQuestions: adFreeQuestions
            });
        }

        return this;
    }

    /**
     * Use free question
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AIChat} Updated AI Chat (this)
     */
    useFreeQuestion(options = {}) {
        const { emitEvent = true } = options;
        
        if (this.hasFreeQuestions()) {
            this.freeQuestionsUsed = (this.freeQuestionsUsed || 0) + 1;
            this.questionsToday = (this.questionsToday || 0) + 1;
            this.updatedAt = new Date();

            if (emitEvent && typeof EventBus !== 'undefined') {
                EventBus.emit('ai:free_question_used', { 
                    sessionId: this.id, 
                    remaining: this.getRemainingFreeQuestions()
                });
            }
        }
        
        return this;
    }

    /**
     * Use ad-free question
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AIChat} Updated AI Chat (this)
     */
    useAdFreeQuestion(options = {}) {
        const { emitEvent = true } = options;
        
        if (this.hasAdFreeQuestions()) {
            this.adFreeQuestionsUsed = (this.adFreeQuestionsUsed || 0) + 1;
            this.updatedAt = new Date();

            if (emitEvent && typeof EventBus !== 'undefined') {
                EventBus.emit('ai:ad_free_question_used', { 
                    sessionId: this.id, 
                    remaining: this.getRemainingAdFreeQuestions()
                });
            }
        }
        
        return this;
    }

    /**
     * Get question cycle status
     * @returns {Object} Question cycle status
     */
    getQuestionCycleStatus() {
        this.checkDailyReset();
        
        return {
            freeQuestionsUsed: this.freeQuestionsUsed,
            freeQuestionsLimit: this.freeQuestionsLimit,
            remainingFree: this.getRemainingFreeQuestions(),
            adShown: this.adShown,
            adFreeQuestionsUsed: this.adFreeQuestionsUsed,
            adFreeQuestionsLimit: this.adFreeQuestionsLimit,
            remainingAdFree: this.getRemainingAdFreeQuestions(),
            adCycleCount: this.adCycleCount,
            totalQuestionsToday: this.questionsToday,
            needsAd: this.shouldShowAd(),
            canAskQuestion: this.hasFreeQuestions() || this.hasAdFreeQuestions()
        };
    }

    // ============================================
    // COIN METHODS
    // ============================================

    /**
     * Use coins for AI chat
     * @param {number} amount - Amount of coins to use
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AIChat} Updated AI Chat (this)
     */
    useCoins(amount = 1, options = {}) {
        const { emitEvent = true } = options;
        
        this.coinsUsed = (this.coinsUsed || 0) + amount;
        this.totalCoinsUsed = (this.totalCoinsUsed || 0) + amount;
        this.coinsBalance = (this.coinsBalance || 0) - amount;
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ai:coins_used', { 
                sessionId: this.id, 
                amount: amount,
                totalUsed: this.totalCoinsUsed
            });
        }

        return this;
    }

    /**
     * Earn coins from AI chat
     * @param {number} amount - Amount of coins to earn
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AIChat} Updated AI Chat (this)
     */
    earnCoins(amount = 1, options = {}) {
        const { emitEvent = true } = options;
        
        this.coinsEarned = (this.coinsEarned || 0) + amount;
        this.coinsBalance = (this.coinsBalance || 0) + amount;
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ai:coins_earned', { 
                sessionId: this.id, 
                amount: amount,
                totalEarned: this.coinsEarned
            });
        }

        return this;
    }

    // ============================================
    // FEEDBACK METHODS
    // ============================================

    /**
     * Add feedback for a response
     * @param {Object} feedback - Feedback data
     * @param {string} feedback.messageId - Message ID
     * @param {string} feedback.rating - Rating (helpful, notHelpful, neutral)
     * @param {string} feedback.comment - Feedback comment
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AIChat} Updated AI Chat (this)
     */
    addFeedback(feedback, options = {}) {
        const { emitEvent = true } = options;
        
        const newFeedback = {
            id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            messageId: feedback.messageId || '',
            rating: feedback.rating || 'neutral',
            comment: feedback.comment || '',
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        this.feedback.push(newFeedback);

        // Update stats
        if (feedback.rating === 'helpful') {
            this.helpfulCount = (this.helpfulCount || 0) + 1;
            this.analytics.responseStats.helpful = (this.analytics.responseStats.helpful || 0) + 1;
        } else if (feedback.rating === 'notHelpful') {
            this.notHelpfulCount = (this.notHelpfulCount || 0) + 1;
            this.analytics.responseStats.notHelpful = (this.analytics.responseStats.notHelpful || 0) + 1;
        } else {
            this.analytics.responseStats.neutral = (this.analytics.responseStats.neutral || 0) + 1;
        }

        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ai:feedback', { 
                sessionId: this.id, 
                feedback: newFeedback 
            });
        }

        return this;
    }

    /**
     * Rate the AI chat session
     * @param {number} rating - Rating (1-5)
     * @param {string} feedback - Feedback comment
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AIChat} Updated AI Chat (this)
     */
    rateSession(rating, feedback = '', options = {}) {
        const { emitEvent = true } = options;
        
        this.rating = Math.min(5, Math.max(1, rating));
        this.ratingFeedback = feedback;
        this.updatedAt = new Date();
        this.completedAt = new Date();
        this.status = 'completed';

        // Update average rating
        this.analytics.averageRating = this.calculateAverageRating();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ai:rated', { 
                sessionId: this.id, 
                rating: this.rating,
                feedback: feedback
            });
        }

        return this;
    }

    /**
     * Calculate average rating
     * @returns {number} Average rating
     */
    calculateAverageRating() {
        if (this.feedback.length === 0) return this.rating || 0;
        const total = this.feedback.reduce((sum, f) => {
            if (f.rating === 'helpful') return sum + 4;
            if (f.rating === 'notHelpful') return sum + 1;
            return sum + 3;
        }, 0);
        return Math.round((total / this.feedback.length) * 10) / 10;
    }

    /**
     * Get feedback summary
     * @returns {Object} Feedback summary
     */
    getFeedbackSummary() {
        return {
            total: this.feedback.length,
            helpful: this.helpfulCount || 0,
            notHelpful: this.notHelpfulCount || 0,
            neutral: this.analytics?.responseStats?.neutral || 0,
            rating: this.rating || 0,
            averageRating: this.calculateAverageRating()
        };
    }

    // ============================================
    // CONTEXT METHODS
    // ============================================

    /**
     * Update context
     * @param {Object} context - Context data
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AIChat} Updated AI Chat (this)
     */
    updateContext(context, options = {}) {
        const { emitEvent = true } = options;
        
        this.context = { ...this.context, ...context };
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('ai:context_updated', { sessionId: this.id, context: this.context });
        }

        return this;
    }

    /**
     * Add topic to context
     * @param {string} topic - Topic to add
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {AIChat} Updated AI Chat (this)
     */
    addTopic(topic, options = {}) {
        const { emitEvent = true } = options;
        
        if (!this.context.previousTopics) {
            this.context.previousTopics = [];
        }
        if (!this.context.previousTopics.includes(topic)) {
            this.context.previousTopics.push(topic);
            this.updatedAt = new Date();

            if (emitEvent && typeof EventBus !== 'undefined') {
                EventBus.emit('ai:topic_added', { sessionId: this.id, topic });
            }
        }

        return this;
    }

    /**
     * Get context for AI
     * @param {Object} options - Options
     * @param {boolean} options.includeHistory - Include message history
     * @param {number} options.historyLimit - History limit
     * @returns {Object} AI context
     */
    getContextForAI(options = {}) {
        const { includeHistory = true, historyLimit = 20 } = options;
        
        const context = {
            userId: this.userId,
            productId: this.context.productId,
            productTitle: this.context.productTitle,
            productDescription: this.context.productDescription,
            productCategory: this.context.productCategory,
            productPrice: this.context.productPrice,
            category: this.context.category,
            userQuery: this.context.userQuery,
            interests: [...this.context.interests],
            language: this.context.language,
            previousTopics: [...this.context.previousTopics],
            conversationState: this.context.conversationState
        };

        if (includeHistory) {
            const recentMessages = this.getRecentMessages(historyLimit);
            context.messages = recentMessages.map(m => ({
                role: m.role,
                content: m.content
            }));
        }

        return context;
    }

    // ============================================
    // STATUS METHODS
    // ============================================

    /** @returns {boolean} Check if session is active */
    isActiveSession() { return this.isActive && !this.isDeleted && !this.isArchived && this.status === 'active'; }

    /** @returns {boolean} Check if session is expired */
    isExpiredSession() { return this.status === 'expired' || (this.expiresAt && new Date() > this.expiresAt); }

    /** @returns {boolean} Check if session is completed */
    isCompletedSession() { return this.status === 'completed'; }

    /** @returns {boolean} Check if session is archived */
    isArchivedSession() { return this.isArchived || this.status === 'archived'; }

    /** @returns {boolean} Check if session is deleted */
    isDeletedSession() { return this.isDeleted; }

    /** @returns {boolean} Check if session is pinned */
    isPinnedSession() { return this.isPinned; }

    /** @returns {boolean} Check if session is starred */
    isStarredSession() { return this.isStarred; }

    /** @returns {boolean} Check if session is read-only */
    isReadOnlySession() { return this.isReadOnly; }

    /** @returns {boolean} Check if session is temporary */
    isTemporarySession() { return this.isTemporary; }

    /** @returns {boolean} Check if session is persistent */
    isPersistentSession() { return this.isPersistent; }

    // ============================================
    // STATS METHODS
    // ============================================

    /**
     * Get conversation stats
     * @returns {Object} Conversation stats
     */
    getConversationStats() {
        const userMessages = this.getUserQuestions();
        const assistantMessages = this.getAssistantResponses();
        const totalUserMessages = userMessages.length;
        const totalAssistantMessages = assistantMessages.length;
        
        let totalUserLength = 0;
        let totalAssistantLength = 0;
        
        for (const msg of userMessages) {
            totalUserLength += (msg.content || '').length;
        }
        for (const msg of assistantMessages) {
            totalAssistantLength += (msg.content || '').length;
        }

        return {
            totalMessages: this.messageCount,
            userMessages: totalUserMessages,
            assistantMessages: totalAssistantMessages,
            ratio: totalUserMessages > 0 ? (totalAssistantMessages / totalUserMessages) : 0,
            averageUserLength: totalUserMessages > 0 ? (totalUserLength / totalUserMessages) : 0,
            averageAssistantLength: totalAssistantMessages > 0 ? (totalAssistantLength / totalAssistantMessages) : 0,
            totalQuestions: this.totalQuestions || this.questionCount,
            freeQuestionsUsed: this.freeQuestionsUsed,
            adFreeQuestionsUsed: this.adFreeQuestionsUsed,
            adCycleCount: this.adCycleCount
        };
    }

    /**
     * Get usage summary
     * @returns {Object} Usage summary
     */
    getUsageSummary() {
        return {
            totalSessions: this.usageStats.totalSessions || 1,
            totalQuestions: this.totalQuestions || this.questionCount,
            averageQuestionsPerSession: this.usageStats.averageQuestionsPerSession || this.questionCount || 0,
            totalTimeSpent: this.usageStats.totalTimeSpent || 0,
            averageSessionDuration: this.usageStats.averageSessionDuration || 0,
            lastSessionDate: this.usageStats.lastSessionDate || this.lastActivity
        };
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Get time ago for last activity
     * @param {string} locale - Locale
     * @returns {string} Time ago
     */
    getTimeAgo(locale = 'en-US') {
        const now = new Date();
        const diff = now - this.lastActivity;
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
     * Clone AI Chat session
     * @param {Object} options - Clone options
     * @param {boolean} options.keepId - Keep original ID
     * @param {boolean} options.keepTimestamps - Keep original timestamps
     * @param {boolean} options.keepMessages - Keep messages
     * @param {boolean} options.keepStats - Keep stats
     * @param {boolean} options.resetQuestions - Reset question tracking
     * @returns {AIChat} Cloned AI Chat
     */
    clone(options = {}) {
        const { 
            keepId = false, 
            keepTimestamps = false, 
            keepMessages = true,
            keepStats = true,
            resetQuestions = true
        } = options;
        
        const data = this.toFirestore({ 
            includeMetadata: true, 
            includeMessages: keepMessages, 
            includeAnalytics: true,
            includeFeedback: true
        });
        
        if (!keepId) {
            delete data.id;
            data.id = this.generateId();
            data.sessionId = data.id;
        }
        
        if (!keepTimestamps) {
            data.createdAt = new Date();
            data.updatedAt = new Date();
            data.lastActivity = new Date();
            data.lastQuestionAt = null;
            data.lastResponseAt = null;
            data.firstQuestionAt = null;
            data.completedAt = null;
            data.expiresAt = null;
        }
        
        if (resetQuestions) {
            data.freeQuestionsUsed = 0;
            data.adShown = false;
            data.adFreeQuestionsUsed = 0;
            data.adCycleCount = 0;
            data.questionsToday = 0;
            data.questionCount = 0;
            data.totalQuestions = 0;
            data.coinsUsed = 0;
            data.coinsEarned = 0;
            data.coinsBalance = 0;
            data.resetDate = new Date().toISOString();
        }
        
        if (!keepStats) {
            data.rating = 0;
            data.ratingFeedback = '';
            data.helpfulCount = 0;
            data.notHelpfulCount = 0;
            data.accuracyScore = 0;
            data.satisfactionScore = 0;
            data.feedback = [];
            data.analytics = {
                totalQuestions: 0,
                totalResponses: 0,
                averageResponseTime: 0,
                averageResponseLength: 0,
                popularTopics: [],
                dailyUsage: {},
                weeklyUsage: {},
                monthlyUsage: {},
                responseStats: { helpful: 0, notHelpful: 0, neutral: 0 },
                categoryStats: {},
                averageRating: 0
            };
            data.usageStats = {
                totalSessions: 0,
                totalQuestions: 0,
                averageQuestionsPerSession: 0,
                totalTimeSpent: 0,
                averageSessionDuration: 0,
                lastSessionDate: null
            };
        }
        
        data.isActive = true;
        data.isDeleted = false;
        data.isArchived = false;
        data.isBlocked = false;
        data.status = 'active';
        
        return new AIChat({ ...data, id: data.id });
    }

    /**
     * Compare two AI Chat sessions
     * @param {AIChat} other - Other AI Chat
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
        return `AIChat(${this.id}, ${this.userId}, ${this.questionCount} questions)`;
    }

    /**
     * Convert to display string
     * @returns {string} Display string
     */
    toDisplayString() {
        return this.title || `AI Chat ${this.createdAt.toLocaleDateString()}`;
    }

    // ============================================
    // STATIC FACTORY METHODS
    // ============================================

    /**
     * Create AI Chat from Firestore data
     * @param {Object} data - Firestore data
     * @param {string} id - Document ID
     * @returns {AIChat} AI Chat instance
     */
    static fromFirestore(data, id) {
        const chatData = { ...data, id };
        return new AIChat(chatData);
    }

    /**
     * Create AI Chats from Firestore array
     * @param {Array} dataArray - Firestore data array
     * @returns {Array<AIChat>} AI Chat instances
     */
    static fromFirestoreArray(dataArray) {
        if (!Array.isArray(dataArray)) return [];
        return dataArray.map(data => AIChat.fromFirestore(data, data.id));
    }

    /**
     * Create a new AI Chat session
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {string} options.title - Session title
     * @param {Object} options.context - Initial context
     * @param {string} options.model - AI model
     * @param {number} options.temperature - Temperature
     * @param {number} options.maxTokens - Max tokens
     * @param {string} options.language - Language
     * @returns {AIChat} New AI Chat session
     */
    static create(userId, options = {}) {
        const { title = 'AI Chat Session', context = {}, model = 'gpt-3.5-turbo', temperature = 0.7, maxTokens = 500, language = 'en' } = options;

        return new AIChat({
            userId,
            title,
            context: {
                language,
                ...context
            },
            model,
            temperature,
            maxTokens,
            language,
            isActive: true,
            isPersistent: true,
            status: 'active'
        });
    }

    /**
     * Create a product inquiry AI Chat
     * @param {string} userId - User ID
     * @param {Object} product - Product data
     * @param {Object} options - Options
     * @param {string} options.userQuery - User query
     * @param {string} options.language - Language
     * @returns {AIChat} Product inquiry AI Chat
     */
    static createProductInquiry(userId, product, options = {}) {
        const { userQuery = '', language = 'en' } = options;

        return new AIChat({
            userId,
            title: `Product Inquiry: ${product.title || 'Product'}`,
            context: {
                productId: product.id || '',
                productTitle: product.title || '',
                productDescription: product.description || '',
                productCategory: product.category || '',
                productPrice: product.price || 0,
                userQuery: userQuery,
                language,
                conversationState: 'product_inquiry'
            },
            language,
            isActive: true,
            isPersistent: true,
            status: 'active',
            tags: ['product_inquiry', product.category || 'general']
        });
    }

    /**
     * Create a support AI Chat
     * @param {string} userId - User ID
     * @param {string} issue - Issue description
     * @param {Object} options - Options
     * @param {string} options.category - Issue category
     * @param {string} options.language - Language
     * @returns {AIChat} Support AI Chat
     */
    static createSupport(userId, issue, options = {}) {
        const { category = 'general', language = 'en' } = options;

        return new AIChat({
            userId,
            title: `Support: ${issue.substring(0, 50)}${issue.length > 50 ? '...' : ''}`,
            context: {
                userQuery: issue,
                category,
                language,
                conversationState: 'support'
            },
            language,
            isActive: true,
            isPersistent: true,
            status: 'active',
            tags: ['support', category],
            priority: 'high'
        });
    }

    /**
     * Create a marketing AI Chat
     * @param {string} userId - User ID
     * @param {string} productId - Product ID
     * @param {Object} options - Options
     * @param {string} options.marketingGoal - Marketing goal
     * @param {string} options.language - Language
     * @returns {AIChat} Marketing AI Chat
     */
    static createMarketing(userId, productId, options = {}) {
        const { marketingGoal = 'promotion', language = 'en' } = options;

        return new AIChat({
            userId,
            title: `Marketing: ${marketingGoal.charAt(0).toUpperCase() + marketingGoal.slice(1)}`,
            context: {
                productId,
                userQuery: `Help me with ${marketingGoal}`,
                language,
                conversationState: 'marketing'
            },
            language,
            isActive: true,
            isPersistent: true,
            status: 'active',
            tags: ['marketing', marketingGoal],
            priority: 'high'
        });
    }

    /**
     * Create a temporary AI Chat (not saved)
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @returns {AIChat} Temporary AI Chat
     */
    static createTemporary(userId, options = {}) {
        const { context = {}, language = 'en' } = options;

        return new AIChat({
            userId,
            title: 'Quick Chat',
            context: {
                language,
                ...context
            },
            language,
            isActive: true,
            isTemporary: true,
            isPersistent: false,
            status: 'active',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });
    }

    // ============================================
    // STATIC QUERY & FILTER METHODS
    // ============================================

    /**
     * Filter AI Chats by user
     * @param {Array<AIChat>} chats - AI Chats array
     * @param {string} userId - User ID
     * @returns {Array<AIChat>} Filtered AI Chats
     */
    static filterByUser(chats, userId) {
        if (!userId) return chats;
        return chats.filter(c => c.userId === userId);
    }

    /**
     * Filter active AI Chats
     * @param {Array<AIChat>} chats - AI Chats array
     * @returns {Array<AIChat>} Active AI Chats
     */
    static filterActive(chats) {
        return chats.filter(c => c.isActiveSession());
    }

    /**
     * Filter by status
     * @param {Array<AIChat>} chats - AI Chats array
     * @param {string} status - Status
     * @returns {Array<AIChat>} Filtered AI Chats
     */
    static filterByStatus(chats, status) {
        if (!status) return chats;
        return chats.filter(c => c.status === status);
    }

    /**
     * Filter by category
     * @param {Array<AIChat>} chats - AI Chats array
     * @param {string} category - Category
     * @returns {Array<AIChat>} Filtered AI Chats
     */
    static filterByCategory(chats, category) {
        if (!category) return chats;
        return chats.filter(c => c.category === category);
    }

    /**
     * Filter by tag
     * @param {Array<AIChat>} chats - AI Chats array
     * @param {string} tag - Tag
     * @returns {Array<AIChat>} Filtered AI Chats
     */
    static filterByTag(chats, tag) {
        if (!tag) return chats;
        return chats.filter(c => c.tags && c.tags.includes(tag));
    }

    /**
     * Sort AI Chats by last activity
     * @param {Array<AIChat>} chats - AI Chats array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<AIChat>} Sorted AI Chats
     */
    static sortByActivity(chats, order = 'desc') {
        const sorted = [...chats];
        sorted.sort((a, b) => {
            const aTime = a.lastActivity.getTime();
            const bTime = b.lastActivity.getTime();
            return order === 'asc' ? aTime - bTime : bTime - aTime;
        });
        return sorted;
    }

    /**
     * Sort AI Chats by question count
     * @param {Array<AIChat>} chats - AI Chats array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<AIChat>} Sorted AI Chats
     */
    static sortByQuestions(chats, order = 'desc') {
        const sorted = [...chats];
        sorted.sort((a, b) => {
            return order === 'asc' ? (a.questionCount || 0) - (b.questionCount || 0) : (b.questionCount || 0) - (a.questionCount || 0);
        });
        return sorted;
    }

    /**
     * Get pinned AI Chats
     * @param {Array<AIChat>} chats - AI Chats array
     * @returns {Array<AIChat>} Pinned AI Chats
     */
    static getPinned(chats) {
        return chats.filter(c => c.isPinned);
    }

    /**
     * Get starred AI Chats
     * @param {Array<AIChat>} chats - AI Chats array
     * @returns {Array<AIChat>} Starred AI Chats
     */
    static getStarred(chats) {
        return chats.filter(c => c.isStarred);
    }

    /**
     * Get AI Chats with unread responses
     * @param {Array<AIChat>} chats - AI Chats array
     * @param {string} userId - User ID
     * @returns {Array<AIChat>} AI Chats with unread
     */
    static getWithUnread(chats, userId) {
        // This would need to track which responses the user has seen
        // For now, return chats where last message is from assistant
        return chats.filter(c => {
            const lastMessage = c.messages[c.messages.length - 1];
            return lastMessage && lastMessage.role === 'assistant';
        });
    }

    /**
     * Get AI Chat by session ID
     * @param {Array<AIChat>} chats - AI Chats array
     * @param {string} sessionId - Session ID
     * @returns {AIChat|null} AI Chat or null
     */
    static getBySessionId(chats, sessionId) {
        return chats.find(c => c.sessionId === sessionId || c.id === sessionId) || null;
    }

    /**
     * Validate AI Chat data
     * @param {Object} data - AI Chat data
     * @returns {boolean} True if valid
     */
    static isValidAIChatData(data) {
        return data && typeof data === 'object' &&
            data.userId && data.userId.trim() !== '';
    }

    /**
     * Group AI Chats by date
     * @param {Array<AIChat>} chats - AI Chats array
     * @param {string} groupBy - 'day', 'week', 'month'
     * @returns {Object} Grouped AI Chats
     */
    static groupByDate(chats, groupBy = 'day') {
        const groups = {};
        for (const chat of chats) {
            let key;
            switch (groupBy) {
                case 'week':
                    const weekStart = new Date(chat.lastActivity);
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    key = weekStart.toDateString();
                    break;
                case 'month':
                    key = `${chat.lastActivity.getFullYear()}-${chat.lastActivity.getMonth() + 1}`;
                    break;
                default:
                    key = chat.lastActivity.toDateString();
            }
            if (!groups[key]) groups[key] = [];
            groups[key].push(chat);
        }
        return groups;
    }

    /**
     * Group AI Chats by category
     * @param {Array<AIChat>} chats - AI Chats array
     * @returns {Object} Grouped by category
     */
    static groupByCategory(chats) {
        const groups = {};
        for (const chat of chats) {
            const key = chat.category || 'general';
            if (!groups[key]) groups[key] = [];
            groups[key].push(chat);
        }
        return groups;
    }

    /**
     * Get total questions across all chats
     * @param {Array<AIChat>} chats - AI Chats array
     * @returns {number} Total questions
     */
    static getTotalQuestions(chats) {
        return chats.reduce((sum, c) => sum + (c.questionCount || 0), 0);
    }

    /**
     * Get most active chats
     * @param {Array<AIChat>} chats - AI Chats array
     * @param {number} limit - Limit
     * @returns {Array<AIChat>} Most active chats
     */
    static getMostActive(chats, limit = 5) {
        return AIChat.sortByQuestions(chats, 'desc').slice(0, limit);
    }
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default AIChat;

// ============================================================
// END OF FILE: ai-chat-model.js
// ============================================================