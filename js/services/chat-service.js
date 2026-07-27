// ============================================================
// FILE: js/services/chat-service.js
// PURPOSE: Complete Real-time Chat System - PRODUCTION READY
// DEPENDENCY: database-service.js, auth-service.js, notification-service.js, analytics-service.js
// USED BY: chat-list.js, chat-detail.js, product-detail.js, all screens
// VERSION: 3.0.0 - FULLY UPDATED
// ============================================================

import { errorHandler, chatError } from './error-handler.js';
import { logger } from './logger.js';
import { databaseService } from './database-service.js';
import { getCurrentUser, isAuthenticated } from './auth-service.js';
import { notificationService, NOTIFICATION_CONFIG } from './notification-service.js';
import { analyticsService, trackEvent } from './analytics-service.js';
import { cacheService } from './cache-service.js';

// ============================================================
// CHAT CONFIGURATION
// ============================================================

const CHAT_CONFIG = {
    // Enable/Disable chat
    enabled: true,
    
    // Max message length
    maxMessageLength: 5000,
    
    // Max file size (MB)
    maxFileSize: 10,
    
    // Allowed file types
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/zip'],
    
    // Message types
    messageTypes: {
        TEXT: 'text',
        IMAGE: 'image',
        FILE: 'file',
        VIDEO: 'video',
        AUDIO: 'audio',
        LOCATION: 'location',
        PRODUCT: 'product',
        ORDER: 'order',
        PAYMENT: 'payment',
        SYSTEM: 'system'
    },
    
    // Chat status
    status: {
        ACTIVE: 'active',
        ARCHIVED: 'archived',
        BLOCKED: 'blocked',
        DELETED: 'deleted'
    },
    
    // Pagination
    pagination: {
        defaultPageSize: 50,
        maxPageSize: 100
    },
    
    // Cache duration (ms)
    cacheDuration: 30 * 1000, // 30 seconds
    
    // Typing indicator timeout (ms)
    typingTimeout: 3000,
    
    // Read receipt timeout (ms)
    readReceiptTimeout: 5000,
    
    // Max participants in group
    maxGroupParticipants: 50,
    
    // Message retention (days)
    messageRetention: 365,
    
    // Rate limiting
    maxMessagesPerMinute: 30,
    maxMessagesPerHour: 500
};

// ============================================================
// CHAT SERVICE CLASS
// ============================================================

class ChatService {
    constructor() {
        this._initialized = false;
        this._enabled = CHAT_CONFIG.enabled;
        this._activeChats = new Map();
        this._messages = new Map();
        this._typingUsers = new Map();
        this._readReceipts = new Map();
        this._listeners = [];
        this._messageListeners = [];
        this._typingListeners = [];
        this._readListeners = [];
        this._unreadCounts = new Map();
        this._chatCache = new Map();
        this._messageQueue = [];
        this._isProcessingQueue = false;
        this._onlineUsers = new Set();
        this._lastSeen = new Map();
        this._blockedUsers = new Set();
        this._mutedChats = new Set();
        this._pinnedChats = new Set();
        this._draftMessages = new Map();
        this._reactionHistory = new Map();
        this._deliveryReceipts = new Map();
        this._chatStats = new Map();
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    /**
     * Initialize chat service
     */
    async init(options = {}) {
        if (this._initialized) return;

        const {
            enabled = true,
            maxMessageLength = 5000,
            maxFileSize = 10,
            pageSize = 50
        } = options;

        try {
            this._enabled = enabled;
            CHAT_CONFIG.maxMessageLength = maxMessageLength;
            CHAT_CONFIG.maxFileSize = maxFileSize;
            CHAT_CONFIG.pagination.defaultPageSize = pageSize;

            if (!this._enabled) {
                logger.info('💬 Chat service is disabled');
                this._initialized = true;
                return this;
            }

            // Load user chats
            const userId = getCurrentUser()?.uid;
            if (userId) {
                await this._loadUserChats(userId);
                await this._loadUnreadCounts(userId);
            }

            // Setup online status
            this._setupOnlineStatus();

            // Start cleanup timer
            this._startCleanupTimer();

            this._initialized = true;

            logger.info('💬 Chat Service initialized', {
                maxMessageLength: CHAT_CONFIG.maxMessageLength,
                maxFileSize: CHAT_CONFIG.maxFileSize,
                pageSize: CHAT_CONFIG.pagination.defaultPageSize
            });

            return this;
        } catch (error) {
            logger.error('❌ Chat Service initialization failed', { error: error.message });
            throw error;
        }
    }

    // ============================================
    // CHAT MANAGEMENT
    // ============================================

    /**
     * Create a new chat
     */
    async createChat(participants, options = {}) {
        if (!this._enabled) throw chatError('Chat service disabled', { code: 'DISABLED' });

        const userId = getCurrentUser()?.uid;
        if (!userId) throw chatError('Please login to create chat', { code: 'NOT_AUTHENTICATED' });

        const {
            type = 'direct',
            productId = null,
            productTitle = '',
            productImage = '',
            groupName = '',
            groupImage = '',
            initialMessage = ''
        } = options;

        try {
            // Validate participants
            if (!participants || participants.length === 0) {
                throw chatError('At least one participant required', { code: 'NO_PARTICIPANTS' });
            }

            // Add current user to participants
            const allParticipants = [...new Set([userId, ...participants])];

            // Check if chat already exists (for direct chats)
            if (type === 'direct' && allParticipants.length === 2) {
                const existing = await this._findExistingChat(userId, allParticipants[1]);
                if (existing) {
                    return existing;
                }
            }

            // Check group limits
            if (type === 'group' && allParticipants.length > CHAT_CONFIG.maxGroupParticipants) {
                throw chatError(`Maximum ${CHAT_CONFIG.maxGroupParticipants} participants allowed`, {
                    code: 'MAX_PARTICIPANTS'
                });
            }

            // Create chat
            const chatData = {
                participants: allParticipants,
                type,
                productId,
                productTitle,
                productImage,
                groupName: type === 'group' ? groupName : '',
                groupImage: type === 'group' ? groupImage : '',
                lastMessage: initialMessage || '',
                lastMessageTime: new Date().toISOString(),
                lastMessageSender: initialMessage ? userId : '',
                unreadCount: {},
                status: CHAT_CONFIG.status.ACTIVE,
                isDeleted: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata: {
                    createdBy: userId,
                    participants: allParticipants
                }
            };

            // Set initial unread counts
            for (const participant of allParticipants) {
                chatData.unreadCount[participant] = participant === userId ? 0 : (initialMessage ? 1 : 0);
            }

            const result = await databaseService.create('chats', chatData);
            const chatId = result.id;

            // Add initial message if provided
            if (initialMessage) {
                await this.sendMessage(chatId, initialMessage, CHAT_CONFIG.messageTypes.TEXT);
            }

            // Clear cache
            this._chatCache.delete(userId);

            // Track analytics
            trackEvent('chat_created', {
                userId,
                chatId,
                type,
                participants: allParticipants.length
            });

            this._notifyListeners('chat_created', { chatId, userId, data: chatData });

            logger.info(`💬 Chat created: ${chatId}`, { type, participants: allParticipants.length });

            return { id: chatId, ...chatData };
        } catch (error) {
            logger.error('❌ Failed to create chat', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'CHAT',
                context: { userId, action: 'create_chat' }
            });
        }
    }

    /**
     * Get a chat
     */
    async getChat(chatId, options = {}) {
        if (!this._enabled) return null;

        const userId = getCurrentUser()?.uid;
        if (!userId) return null;

        const { cache = true } = options;

        try {
            // Check cache
            if (cache) {
                const cached = this._chatCache.get(chatId);
                if (cached && cached.expiry > Date.now()) {
                    return cached.data;
                }
            }

            const chat = await databaseService.getChat(chatId);
            if (!chat || chat.isDeleted) {
                return null;
            }

            // Check if user is participant
            if (!chat.participants.includes(userId)) {
                return null;
            }

            // Cache
            if (cache) {
                this._chatCache.set(chatId, {
                    data: chat,
                    expiry: Date.now() + CHAT_CONFIG.cacheDuration
                });
            }

            return chat;
        } catch (error) {
            logger.error('❌ Failed to get chat', { error: error.message });
            return null;
        }
    }

    /**
     * Get user chats
     */
    async getUserChats(userId, options = {}) {
        if (!this._enabled) return [];

        const {
            limit = CHAT_CONFIG.pagination.defaultPageSize,
            offset = 0,
            status = CHAT_CONFIG.status.ACTIVE
        } = options;

        try {
            const cacheKey = `chats_${userId}_${status}`;
            const cached = this._chatCache.get(cacheKey);
            if (cached && cached.expiry > Date.now()) {
                return cached.data;
            }

            const result = await databaseService.query('chats', {
                where: [
                    ['participants', 'array-contains', userId],
                    ['status', '==', status],
                    ['isDeleted', '==', false]
                ],
                orderBy: [['updatedAt', 'desc']],
                limit,
                offset
            });

            const chats = result.data || [];

            // Get unread counts
            for (const chat of chats) {
                chat.unreadCount = chat.unreadCount?.[userId] || 0;
                // Check if muted
                chat.isMuted = this._mutedChats.has(chat.id);
                // Check if pinned
                chat.isPinned = this._pinnedChats.has(chat.id);
            }

            this._chatCache.set(cacheKey, {
                data: chats,
                expiry: Date.now() + CHAT_CONFIG.cacheDuration
            });

            return chats;
        } catch (error) {
            logger.error('❌ Failed to get user chats', { error: error.message });
            return [];
        }
    }

    /**
     * Update chat
     */
    async updateChat(chatId, data) {
        if (!this._enabled) throw chatError('Chat service disabled', { code: 'DISABLED' });

        const userId = getCurrentUser()?.uid;
        if (!userId) throw chatError('Please login to update chat', { code: 'NOT_AUTHENTICATED' });

        try {
            const chat = await this.getChat(chatId, { cache: false });
            if (!chat) throw chatError('Chat not found', { code: 'CHAT_NOT_FOUND' });

            if (!chat.participants.includes(userId)) {
                throw chatError('Not a participant', { code: 'NOT_PARTICIPANT' });
            }

            const updateData = {
                ...data,
                updatedAt: new Date().toISOString()
            };

            await databaseService.updateChat(chatId, updateData);

            // Clear cache
            this._chatCache.delete(chatId);
            this._chatCache.delete(`chats_${userId}`);

            this._notifyListeners('chat_updated', { chatId, userId, data: updateData });

            logger.info(`💬 Chat updated: ${chatId}`);

            return { id: chatId, ...chat, ...updateData };
        } catch (error) {
            logger.error('❌ Failed to update chat', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'CHAT',
                context: { userId, chatId, action: 'update_chat' }
            });
        }
    }

    /**
     * Delete chat
     */
    async deleteChat(chatId) {
        if (!this._enabled) throw chatError('Chat service disabled', { code: 'DISABLED' });

        const userId = getCurrentUser()?.uid;
        if (!userId) throw chatError('Please login to delete chat', { code: 'NOT_AUTHENTICATED' });

        try {
            const chat = await this.getChat(chatId, { cache: false });
            if (!chat) throw chatError('Chat not found', { code: 'CHAT_NOT_FOUND' });

            if (!chat.participants.includes(userId)) {
                throw chatError('Not a participant', { code: 'NOT_PARTICIPANT' });
            }

            await databaseService.updateChat(chatId, {
                status: CHAT_CONFIG.status.DELETED,
                deletedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            // Clear cache
            this._chatCache.delete(chatId);
            this._chatCache.delete(`chats_${userId}`);

            this._notifyListeners('chat_deleted', { chatId, userId });

            logger.info(`🗑️ Chat deleted: ${chatId}`);

            return true;
        } catch (error) {
            logger.error('❌ Failed to delete chat', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'CHAT',
                context: { userId, chatId, action: 'delete_chat' }
            });
        }
    }

    // ============================================
    // MESSAGE MANAGEMENT
    // ============================================

    /**
     * Send a message
     */
    async sendMessage(chatId, content, type = CHAT_CONFIG.messageTypes.TEXT, options = {}) {
        if (!this._enabled) throw chatError('Chat service disabled', { code: 'DISABLED' });

        const userId = getCurrentUser()?.uid;
        if (!userId) throw chatError('Please login to send message', { code: 'NOT_AUTHENTICATED' });

        const {
            media = null,
            fileName = '',
            fileSize = 0,
            fileType = '',
            location = null,
            productId = null,
            replyTo = null,
            metadata = {}
        } = options;

        try {
            // Validate
            if (!content && !media) {
                throw chatError('Message content required', { code: 'EMPTY_MESSAGE' });
            }

            if (content && content.length > CHAT_CONFIG.maxMessageLength) {
                throw chatError(`Message exceeds maximum length of ${CHAT_CONFIG.maxMessageLength} characters`, {
                    code: 'MESSAGE_TOO_LONG'
                });
            }

            const chat = await this.getChat(chatId, { cache: false });
            if (!chat) throw chatError('Chat not found', { code: 'CHAT_NOT_FOUND' });

            if (!chat.participants.includes(userId)) {
                throw chatError('Not a participant', { code: 'NOT_PARTICIPANT' });
            }

            // Check rate limit
            await this._checkRateLimit(userId);

            // Create message
            const messageData = {
                chatId,
                senderId: userId,
                content: content || '',
                type,
                media,
                fileName,
                fileSize,
                fileType,
                location,
                productId,
                replyTo,
                metadata,
                read: false,
                delivered: false,
                isDeleted: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const result = await databaseService.create(`chats/${chatId}/messages`, messageData);
            const messageId = result.id;

            // Update chat
            await databaseService.updateChat(chatId, {
                lastMessage: content || (type === 'image' ? '📷 Image' : type === 'file' ? '📎 File' : ''),
                lastMessageTime: new Date().toISOString(),
                lastMessageSender: userId,
                updatedAt: new Date().toISOString()
            });

            // Update unread counts
            const unreadUpdate = {};
            for (const participant of chat.participants) {
                if (participant !== userId) {
                    unreadUpdate[participant] = (chat.unreadCount?.[participant] || 0) + 1;
                }
            }
            await databaseService.updateChat(chatId, { unreadCount: unreadUpdate });

            // Update local unread counts
            for (const participant of chat.participants) {
                if (participant !== userId) {
                    const count = this._unreadCounts.get(participant) || 0;
                    this._unreadCounts.set(participant, count + 1);
                }
            }

            // Send notification
            for (const participant of chat.participants) {
                if (participant !== userId) {
                    await notificationService.sendChatNotification(
                        participant,
                        userId,
                        chatId,
                        content || (type === 'image' ? '📷 Image' : type === 'file' ? '📎 File' : ''),
                        type
                    );
                }
            }

            // Clear cache
            this._chatCache.delete(chatId);

            // Track analytics
            trackEvent('chat_message_sent', {
                userId,
                chatId,
                messageId,
                type,
                hasMedia: !!media
            });

            this._notifyListeners('message_sent', { chatId, messageId, userId, data: messageData });

            logger.info(`💬 Message sent: ${messageId} in chat ${chatId}`);

            return { id: messageId, ...messageData };
        } catch (error) {
            logger.error('❌ Failed to send message', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'CHAT',
                context: { userId, chatId, action: 'send_message' }
            });
        }
    }

    /**
     * Get chat messages
     */
    async getChatMessages(chatId, options = {}) {
        if (!this._enabled) return [];

        const userId = getCurrentUser()?.uid;
        if (!userId) return [];

        const {
            limit = CHAT_CONFIG.pagination.defaultPageSize,
            offset = 0,
            before = null,
            after = null,
            includeDeleted = false
        } = options;

        try {
            // Check if user is participant
            const chat = await this.getChat(chatId, { cache: false });
            if (!chat || !chat.participants.includes(userId)) {
                return [];
            }

            let query = [['chatId', '==', chatId]];
            if (!includeDeleted) {
                query.push(['isDeleted', '==', false]);
            }
            if (before) {
                query.push(['createdAt', '<', before]);
            }
            if (after) {
                query.push(['createdAt', '>', after]);
            }

            const result = await databaseService.query(`chats/${chatId}/messages`, {
                where: query,
                orderBy: [['createdAt', 'desc']],
                limit,
                offset
            });

            const messages = result.data || [];

            // Mark messages as read
            await this.markMessagesAsRead(chatId, userId);

            return messages.reverse();
        } catch (error) {
            logger.error('❌ Failed to get chat messages', { error: error.message });
            return [];
        }
    }

    /**
     * Get a single message
     */
    async getMessage(chatId, messageId) {
        if (!this._enabled) return null;

        try {
            const message = await databaseService.read(`chats/${chatId}/messages`, messageId);
            if (!message || message.isDeleted) {
                return null;
            }
            return message;
        } catch (error) {
            logger.error('❌ Failed to get message', { error: error.message });
            return null;
        }
    }

    /**
     * Delete a message
     */
    async deleteMessage(chatId, messageId) {
        if (!this._enabled) throw chatError('Chat service disabled', { code: 'DISABLED' });

        const userId = getCurrentUser()?.uid;
        if (!userId) throw chatError('Please login to delete message', { code: 'NOT_AUTHENTICATED' });

        try {
            const message = await this.getMessage(chatId, messageId);
            if (!message) throw chatError('Message not found', { code: 'MESSAGE_NOT_FOUND' });

            if (message.senderId !== userId) {
                throw chatError('You can only delete your own messages', { code: 'NOT_AUTHORIZED' });
            }

            await databaseService.update(`chats/${chatId}/messages`, messageId, {
                isDeleted: true,
                deletedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            this._notifyListeners('message_deleted', { chatId, messageId, userId });

            logger.info(`🗑️ Message deleted: ${messageId}`);

            return true;
        } catch (error) {
            logger.error('❌ Failed to delete message', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'CHAT',
                context: { userId, chatId, messageId, action: 'delete_message' }
            });
        }
    }

    // ============================================
    // MESSAGE STATUS
    // ============================================

    /**
     * Mark messages as read
     */
    async markMessagesAsRead(chatId, userId) {
        try {
            const chat = await this.getChat(chatId, { cache: false });
            if (!chat) return;

            // Get unread messages
            const unread = await databaseService.query(`chats/${chatId}/messages`, {
                where: [
                    ['read', '==', false],
                    ['senderId', '!=', userId],
                    ['isDeleted', '==', false]
                ],
                limit: 100
            });

            // Update each message
            const updates = [];
            for (const msg of unread.data) {
                updates.push({
                    collection: `chats/${chatId}/messages`,
                    id: msg.id,
                    type: 'update',
                    data: {
                        read: true,
                        readAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                });
            }

            if (updates.length > 0) {
                await databaseService.batch(updates);
            }

            // Update chat unread count
            const unreadCount = chat.unreadCount || {};
            unreadCount[userId] = 0;
            await databaseService.updateChat(chatId, {
                unreadCount: unreadCount,
                updatedAt: new Date().toISOString()
            });

            // Update local unread count
            this._unreadCounts.set(userId, 0);

            this._notifyListeners('messages_read', { chatId, userId, count: updates.length });

            return updates.length;
        } catch (error) {
            logger.error('❌ Failed to mark messages as read', { error: error.message });
            return 0;
        }
    }

    /**
     * Mark messages as delivered
     */
    async markMessagesAsDelivered(chatId, userId) {
        try {
            const chat = await this.getChat(chatId, { cache: false });
            if (!chat) return;

            // Get undelivered messages
            const undelivered = await databaseService.query(`chats/${chatId}/messages`, {
                where: [
                    ['delivered', '==', false],
                    ['senderId', '!=', userId],
                    ['isDeleted', '==', false]
                ],
                limit: 100
            });

            // Update each message
            const updates = [];
            for (const msg of undelivered.data) {
                updates.push({
                    collection: `chats/${chatId}/messages`,
                    id: msg.id,
                    type: 'update',
                    data: {
                        delivered: true,
                        deliveredAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                });
            }

            if (updates.length > 0) {
                await databaseService.batch(updates);
            }

            this._notifyListeners('messages_delivered', { chatId, userId, count: updates.length });

            return updates.length;
        } catch (error) {
            logger.error('❌ Failed to mark messages as delivered', { error: error.message });
            return 0;
        }
    }

    // ============================================
    // TYPING INDICATOR
    // ============================================

    /**
     * Send typing indicator
     */
    async sendTyping(chatId, isTyping = true) {
        if (!this._enabled) return;

        const userId = getCurrentUser()?.uid;
        if (!userId) return;

        try {
            const chat = await this.getChat(chatId, { cache: false });
            if (!chat) return;

            const key = `${chatId}_${userId}`;
            this._typingUsers.set(key, {
                userId,
                chatId,
                isTyping,
                timestamp: Date.now()
            });

            // Clear after timeout
            if (isTyping) {
                setTimeout(() => {
                    const current = this._typingUsers.get(key);
                    if (current && current.isTyping) {
                        this._typingUsers.delete(key);
                        this._notifyTypingListeners(chatId, userId, false);
                    }
                }, CHAT_CONFIG.typingTimeout);
            }

            this._notifyTypingListeners(chatId, userId, isTyping);
        } catch (error) {
            // Silent fail
        }
    }

    /**
     * Get typing users in chat
     */
    getTypingUsers(chatId) {
        const result = [];
        for (const [key, data] of this._typingUsers) {
            if (data.chatId === chatId && data.isTyping && (Date.now() - data.timestamp) < CHAT_CONFIG.typingTimeout) {
                result.push(data.userId);
            }
        }
        return result;
    }

    // ============================================
    // ONLINE STATUS
    // ============================================

    /**
     * Setup online status
     */
    _setupOnlineStatus() {
        // Set user online
        const userId = getCurrentUser()?.uid;
        if (userId) {
            this._onlineUsers.add(userId);
            this._lastSeen.set(userId, Date.now());
        }

        // Handle visibility change
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                const uid = getCurrentUser()?.uid;
                if (uid) {
                    if (document.hidden) {
                        this._onlineUsers.delete(uid);
                        this._lastSeen.set(uid, Date.now());
                    } else {
                        this._onlineUsers.add(uid);
                    }
                }
            });
        }

        // Heartbeat
        setInterval(() => {
            const uid = getCurrentUser()?.uid;
            if (uid) {
                this._lastSeen.set(uid, Date.now());
                if (typeof document === 'undefined' || !document.hidden) {
                    this._onlineUsers.add(uid);
                }
            }
        }, 30000);
    }

    /**
     * Check if user is online
     */
    isUserOnline(userId) {
        return this._onlineUsers.has(userId);
    }

    /**
     * Get user last seen
     */
    getUserLastSeen(userId) {
        return this._lastSeen.get(userId) || null;
    }

    // ============================================
    // UNREAD COUNTS
    // ============================================

    /**
     * Get unread count for user
     */
    async getUnreadCount(userId = null) {
        const uid = userId || getCurrentUser()?.uid;
        if (!uid) return 0;

        if (this._unreadCounts.has(uid)) {
            return this._unreadCounts.get(uid);
        }

        try {
            // Query all chats for user
            const chats = await databaseService.query('chats', {
                where: [
                    ['participants', 'array-contains', uid],
                    ['isDeleted', '==', false]
                ]
            });

            let total = 0;
            for (const chat of chats.data) {
                total += chat.unreadCount?.[uid] || 0;
            }

            this._unreadCounts.set(uid, total);
            return total;
        } catch (error) {
            logger.error('❌ Failed to get unread count', { error: error.message });
            return 0;
        }
    }

    // ============================================
    // CHAT ACTIONS (PIN, MUTE, BLOCK)
    // ============================================

    /**
     * Pin a chat
     */
    async pinChat(chatId) {
        const userId = getCurrentUser()?.uid;
        if (!userId) throw chatError('Please login', { code: 'NOT_AUTHENTICATED' });

        if (this._pinnedChats.has(chatId)) {
            this._pinnedChats.delete(chatId);
        } else {
            this._pinnedChats.add(chatId);
        }

        await this.updateChat(chatId, {
            pinned: this._pinnedChats.has(chatId),
            pinnedAt: this._pinnedChats.has(chatId) ? new Date().toISOString() : null
        });

        return this._pinnedChats.has(chatId);
    }

    /**
     * Mute a chat
     */
    async muteChat(chatId, duration = 'forever') {
        const userId = getCurrentUser()?.uid;
        if (!userId) throw chatError('Please login', { code: 'NOT_AUTHENTICATED' });

        if (this._mutedChats.has(chatId)) {
            this._mutedChats.delete(chatId);
        } else {
            this._mutedChats.add(chatId);
        }

        const expiresAt = duration === 'forever' ? null :
                         duration === 'day' ? Date.now() + 24 * 60 * 60 * 1000 :
                         duration === 'week' ? Date.now() + 7 * 24 * 60 * 60 * 1000 :
                         duration === 'month' ? Date.now() + 30 * 24 * 60 * 60 * 1000 : null;

        await this.updateChat(chatId, {
            muted: this._mutedChats.has(chatId),
            mutedUntil: expiresAt ? new Date(expiresAt).toISOString() : null
        });

        return this._mutedChats.has(chatId);
    }

    /**
     * Block a user in chat
     */
    async blockUser(chatId, targetUserId) {
        const userId = getCurrentUser()?.uid;
        if (!userId) throw chatError('Please login', { code: 'NOT_AUTHENTICATED' });

        const chat = await this.getChat(chatId, { cache: false });
        if (!chat) throw chatError('Chat not found', { code: 'CHAT_NOT_FOUND' });

        await this.updateChat(chatId, {
            blockedUsers: [...new Set([...(chat.blockedUsers || []), targetUserId])]
        });

        this._blockedUsers.add(targetUserId);

        return true;
    }

    /**
     * Unblock a user in chat
     */
    async unblockUser(chatId, targetUserId) {
        const userId = getCurrentUser()?.uid;
        if (!userId) throw chatError('Please login', { code: 'NOT_AUTHENTICATED' });

        const chat = await this.getChat(chatId, { cache: false });
        if (!chat) throw chatError('Chat not found', { code: 'CHAT_NOT_FOUND' });

        const blocked = (chat.blockedUsers || []).filter(id => id !== targetUserId);
        await this.updateChat(chatId, { blockedUsers: blocked });

        this._blockedUsers.delete(targetUserId);

        return true;
    }

    // ============================================
    // REACTIONS
    // ============================================

    /**
     * Add reaction to message
     */
    async addReaction(chatId, messageId, reaction) {
        const userId = getCurrentUser()?.uid;
        if (!userId) throw chatError('Please login', { code: 'NOT_AUTHENTICATED' });

        try {
            const message = await this.getMessage(chatId, messageId);
            if (!message) throw chatError('Message not found', { code: 'MESSAGE_NOT_FOUND' });

            const reactions = message.reactions || {};
            if (!reactions[userId]) {
                reactions[userId] = [];
            }

            const index = reactions[userId].indexOf(reaction);
            if (index > -1) {
                reactions[userId].splice(index, 1);
            } else {
                reactions[userId].push(reaction);
            }

            await databaseService.update(`chats/${chatId}/messages`, messageId, {
                reactions,
                updatedAt: new Date().toISOString()
            });

            this._notifyListeners('reaction_added', { chatId, messageId, userId, reaction });

            return true;
        } catch (error) {
            logger.error('❌ Failed to add reaction', { error: error.message });
            throw error;
        }
    }

    // ============================================
    // DRAFT MESSAGES
    // ============================================

    /**
     * Save draft message
     */
    saveDraft(chatId, content) {
        const userId = getCurrentUser()?.uid;
        if (!userId) return;

        const key = `${userId}_${chatId}`;
        this._draftMessages.set(key, {
            content,
            timestamp: Date.now()
        });
    }

    /**
     * Get draft message
     */
    getDraft(chatId) {
        const userId = getCurrentUser()?.uid;
        if (!userId) return null;

        const key = `${userId}_${chatId}`;
        const draft = this._draftMessages.get(key);
        if (draft && (Date.now() - draft.timestamp) < 7 * 24 * 60 * 60 * 1000) {
            return draft.content;
        }
        this._draftMessages.delete(key);
        return null;
    }

    /**
     * Clear draft message
     */
    clearDraft(chatId) {
        const userId = getCurrentUser()?.uid;
        if (!userId) return;

        const key = `${userId}_${chatId}`;
        this._draftMessages.delete(key);
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Find existing chat
     */
    async _findExistingChat(userId1, userId2) {
        try {
            const result = await databaseService.query('chats', {
                where: [
                    ['participants', 'array-contains', userId1],
                    ['type', '==', 'direct'],
                    ['isDeleted', '==', false]
                ],
                limit: 50
            });

            for (const chat of result.data) {
                if (chat.participants.includes(userId2)) {
                    return chat;
                }
            }
            return null;
        } catch (error) {
            logger.error('❌ Failed to find existing chat', { error: error.message });
            return null;
        }
    }

    /**
     * Load user chats
     */
    async _loadUserChats(userId) {
        try {
            const chats = await this.getUserChats(userId);
            for (const chat of chats) {
                this._activeChats.set(chat.id, chat);
            }
        } catch (error) {
            logger.error('❌ Failed to load user chats', { error: error.message });
        }
    }

    /**
     * Load unread counts
     */
    async _loadUnreadCounts(userId) {
        try {
            const count = await this.getUnreadCount(userId);
            this._unreadCounts.set(userId, count);
        } catch (error) {
            logger.error('❌ Failed to load unread counts', { error: error.message });
        }
    }

    /**
     * Check rate limit
     */
    async _checkRateLimit(userId) {
        const now = Date.now();
        const key = `rate_${userId}`;
        const data = this._chatStats.get(key) || { count: 0, windowStart: now };

        if (now - data.windowStart > 60000) {
            data.count = 0;
            data.windowStart = now;
        }

        data.count++;
        this._chatStats.set(key, data);

        if (data.count > CHAT_CONFIG.maxMessagesPerMinute) {
            throw chatError('Rate limit exceeded. Please slow down.', { code: 'RATE_LIMIT' });
        }
    }

    /**
     * Start cleanup timer
     */
    _startCleanupTimer() {
        setInterval(() => {
            // Clean typing indicators
            const now = Date.now();
            for (const [key, data] of this._typingUsers) {
                if (now - data.timestamp > CHAT_CONFIG.typingTimeout) {
                    this._typingUsers.delete(key);
                }
            }

            // Clean draft messages
            for (const [key, data] of this._draftMessages) {
                if (now - data.timestamp > 7 * 24 * 60 * 60 * 1000) {
                    this._draftMessages.delete(key);
                }
            }

            // Clean rate limit data
            for (const [key, data] of this._chatStats) {
                if (now - data.windowStart > 60000) {
                    this._chatStats.delete(key);
                }
            }
        }, 60000);
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
     * Add message listener
     */
    addMessageListener(callback) {
        this._messageListeners.push(callback);
        return () => {
            this._messageListeners = this._messageListeners.filter(c => c !== callback);
        };
    }

    /**
     * Add typing listener
     */
    addTypingListener(callback) {
        this._typingListeners.push(callback);
        return () => {
            this._typingListeners = this._typingListeners.filter(c => c !== callback);
        };
    }

    /**
     * Add read listener
     */
    addReadListener(callback) {
        this._readListeners.push(callback);
        return () => {
            this._readListeners = this._readListeners.filter(c => c !== callback);
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
     * Notify message listeners
     */
    _notifyMessageListeners(chatId, message, userId) {
        for (const listener of this._messageListeners) {
            try {
                listener(chatId, message, userId);
            } catch (e) {
                // Ignore
            }
        }
    }

    /**
     * Notify typing listeners
     */
    _notifyTypingListeners(chatId, userId, isTyping) {
        for (const listener of this._typingListeners) {
            try {
                listener(chatId, userId, isTyping);
            } catch (e) {
                // Ignore
            }
        }
    }

    /**
     * Notify read listeners
     */
    _notifyReadListeners(chatId, userId, messageIds) {
        for (const listener of this._readListeners) {
            try {
                listener(chatId, userId, messageIds);
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
        this._chatCache.clear();
        this._messages.clear();
        this._typingUsers.clear();
        this._readReceipts.clear();
        this._draftMessages.clear();
        logger.info('💬 Chat cache cleared');
    }

    /**
     * Destroy chat service
     */
    destroy() {
        this._chatCache.clear();
        this._messages.clear();
        this._typingUsers.clear();
        this._readReceipts.clear();
        this._draftMessages.clear();
        this._listeners = [];
        this._messageListeners = [];
        this._typingListeners = [];
        this._readListeners = [];
        this._initialized = false;
        logger.info('💬 Chat service destroyed');
    }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

const chatService = new ChatService();

// ============================================================
// EXPORTS
// ============================================================

export { chatService, CHAT_CONFIG };

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Initialize chat service
 */
export function initChat(options = {}) {
    return chatService.init(options);
}

/**
 * Create chat
 */
export function createChat(participants, options = {}) {
    return chatService.createChat(participants, options);
}

/**
 * Get chat
 */
export function getChat(chatId, options = {}) {
    return chatService.getChat(chatId, options);
}

/**
 * Get user chats
 */
export function getUserChats(userId, options = {}) {
    return chatService.getUserChats(userId, options);
}

/**
 * Update chat
 */
export function updateChat(chatId, data) {
    return chatService.updateChat(chatId, data);
}

/**
 * Delete chat
 */
export function deleteChat(chatId) {
    return chatService.deleteChat(chatId);
}

/**
 * Send message
 */
export function sendMessage(chatId, content, type = 'text', options = {}) {
    return chatService.sendMessage(chatId, content, type, options);
}

/**
 * Get chat messages
 */
export function getChatMessages(chatId, options = {}) {
    return chatService.getChatMessages(chatId, options);
}

/**
 * Get message
 */
export function getMessage(chatId, messageId) {
    return chatService.getMessage(chatId, messageId);
}

/**
 * Delete message
 */
export function deleteMessage(chatId, messageId) {
    return chatService.deleteMessage(chatId, messageId);
}

/**
 * Mark messages as read
 */
export function markMessagesAsRead(chatId, userId) {
    return chatService.markMessagesAsRead(chatId, userId);
}

/**
 * Send typing indicator
 */
export function sendTyping(chatId, isTyping = true) {
    return chatService.sendTyping(chatId, isTyping);
}

/**
 * Get typing users
 */
export function getTypingUsers(chatId) {
    return chatService.getTypingUsers(chatId);
}

/**
 * Check if user is online
 */
export function isUserOnline(userId) {
    return chatService.isUserOnline(userId);
}

/**
 * Get user last seen
 */
export function getUserLastSeen(userId) {
    return chatService.getUserLastSeen(userId);
}

/**
 * Get unread count
 */
export function getUnreadCount(userId = null) {
    return chatService.getUnreadCount(userId);
}

/**
 * Pin chat
 */
export function pinChat(chatId) {
    return chatService.pinChat(chatId);
}

/**
 * Mute chat
 */
export function muteChat(chatId, duration = 'forever') {
    return chatService.muteChat(chatId, duration);
}

/**
 * Block user in chat
 */
export function blockUser(chatId, targetUserId) {
    return chatService.blockUser(chatId, targetUserId);
}

/**
 * Unblock user in chat
 */
export function unblockUser(chatId, targetUserId) {
    return chatService.unblockUser(chatId, targetUserId);
}

/**
 * Add reaction
 */
export function addReaction(chatId, messageId, reaction) {
    return chatService.addReaction(chatId, messageId, reaction);
}

/**
 * Save draft
 */
export function saveDraft(chatId, content) {
    return chatService.saveDraft(chatId, content);
}

/**
 * Get draft
 */
export function getDraft(chatId) {
    return chatService.getDraft(chatId);
}

/**
 * Clear draft
 */
export function clearDraft(chatId) {
    return chatService.clearDraft(chatId);
}

/**
 * Add chat listener
 */
export function onChatEvent(callback) {
    return chatService.addListener(callback);
}

/**
 * Add message listener
 */
export function onChatMessage(callback) {
    return chatService.addMessageListener(callback);
}

/**
 * Add typing listener
 */
export function onChatTyping(callback) {
    return chatService.addTypingListener(callback);
}

/**
 * Add read listener
 */
export function onChatRead(callback) {
    return chatService.addReadListener(callback);
}

/**
 * Clear chat cache
 */
export function clearChatCache() {
    return chatService.clearCache();
}

/**
 * Destroy chat service
 */
export function destroyChatService() {
    return chatService.destroy();
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default chatService;