// Chat Model
// ============================================================
// FILE: chat-model.js
// PURPOSE: Chat data structure for Buyer-Seller Direct Chat
// VERSION: 3.0.0 (Production Ready)
// DEPENDENCY: NONE
// USED BY: chat-service.js, chat-list.js, chat-detail.js, chat-message.js
// LOCATION: js/models/chat-model.js
// ============================================================

// ============================================================
// CHAT CLASS - ZYMORE v3.0 DIRECT CHAT
// ============================================================

/**
 * Chat Model Class
 * Represents a direct chat between buyer and seller in ZYMORE
 * 
 * ZYMORE v3.0 Features:
 * - Real-time messaging
 * - Text, Image, File messages
 * - Read & Delivery receipts
 * - Online/Offline status
 * - Typing indicators
 * - Message replies
 * - Message editing & deletion
 * - Chat archiving & blocking
 * - Product context
 * - Chat history
 * - Unread count
 * - Last message preview
 * - Message reactions
 * - Voice messages
 * - Media messages
 * - Location sharing
 * - Contact sharing
 * - End-to-end encryption ready
 */
export class Chat {
    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * Create a new Chat instance
     * @param {Object} data - Chat data
     * @param {string} data.id - Chat ID
     * @param {Array<string>} data.participants - Participant user IDs
     * @param {string} data.productId - Product ID
     * @param {string} data.productTitle - Product title
     * @param {string} data.productImage - Product image
     * @param {number} data.productPrice - Product price
     * @param {string} data.lastMessage - Last message text
     * @param {Date|string} data.lastMessageTime - Last message time
     * @param {Object} data.unreadCount - Unread count per user
     * @param {Array<Object>} data.messages - Message history
     * @param {string} data.status - Chat status (active, archived, blocked)
     * @param {Date|string} data.createdAt - Creation date
     * @param {Date|string} data.updatedAt - Last update date
     * @param {Object} data.metadata - Additional metadata
     * @param {Object} data.typing - Typing status
     * @param {boolean} data.isMuted - Muted status
     * @param {Array<string>} data.mutedBy - Users who muted
     * @param {boolean} data.isPinned - Pinned status
     * @param {Array<string>} data.pinnedBy - Users who pinned
     * @param {string} data.groupName - Group name (for group chats)
     * @param {string} data.groupAvatar - Group avatar
     * @param {boolean} data.isGroup - Is group chat
     * @param {Array<string>} data.admins - Admin user IDs
     * @param {Array<Object>} data.participantsInfo - Participant details
     */
    constructor(data = {}) {
        // ============================================
        // 📌 BASIC INFORMATION
        // ============================================
        this.id = data.id || data.chatId || this.generateId();
        this.participants = Array.isArray(data.participants) ? [...data.participants] : [];
        this.productId = data.productId || '';
        this.productTitle = data.productTitle || '';
        this.productImage = data.productImage || '';
        this.productPrice = data.productPrice || 0;
        this.lastMessage = data.lastMessage || '';
        this.lastMessageType = data.lastMessageType || 'text';
        this.lastMessageSenderId = data.lastMessageSenderId || '';
        this.lastMessageTime = data.lastMessageTime ? new Date(data.lastMessageTime) : new Date();
        this.unreadCount = data.unreadCount || {};
        this.status = data.status || 'active'; // 'active' | 'archived' | 'blocked'
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
        
        // ============================================
        // 💬 MESSAGES
        // ============================================
        this.messages = Array.isArray(data.messages) ? [...data.messages] : [];
        this.messageCount = data.messageCount || 0;
        this.lastReadTimestamp = data.lastReadTimestamp || {};
        
        // ============================================
        // 👥 PARTICIPANTS INFO
        // ============================================
        this.participantsInfo = data.participantsInfo || {};
        this.onlineStatus = data.onlineStatus || {};
        this.lastSeen = data.lastSeen || {};
        
        // ============================================
        // ⌨️ TYPING STATUS
        // ============================================
        this.typing = data.typing || {};
        this.typingTimeout = data.typingTimeout || {};
        
        // ============================================
        // 🔇 MUTE & PIN
        // ============================================
        this.isMuted = data.isMuted || false;
        this.mutedBy = Array.isArray(data.mutedBy) ? [...data.mutedBy] : [];
        this.muteUntil = data.muteUntil ? new Date(data.muteUntil) : null;
        this.isPinned = data.isPinned || false;
        this.pinnedBy = Array.isArray(data.pinnedBy) ? [...data.pinnedBy] : [];
        this.pinOrder = data.pinOrder || 0;
        
        // ============================================
        // 👥 GROUP CHAT
        // ============================================
        this.isGroup = data.isGroup || false;
        this.groupName = data.groupName || '';
        this.groupAvatar = data.groupAvatar || '';
        this.groupDescription = data.groupDescription || '';
        this.admins = Array.isArray(data.admins) ? [...data.admins] : [];
        this.invitedUsers = Array.isArray(data.invitedUsers) ? [...data.invitedUsers] : [];
        this.joinRequests = Array.isArray(data.joinRequests) ? [...data.joinRequests] : [];
        this.groupSettings = data.groupSettings || {
            allowAddMembers: true,
            allowRemoveMembers: true,
            allowChangeName: true,
            allowChangeAvatar: true,
            allowChangeDescription: true,
            onlyAdminsCanSend: false,
            onlyAdminsCanAdd: false
        };
        
        // ============================================
        // 🎯 PRODUCT CONTEXT
        // ============================================
        this.productContext = data.productContext || {
            id: this.productId,
            title: this.productTitle,
            image: this.productImage,
            price: this.productPrice,
            sellerId: '',
            category: '',
            condition: ''
        };
        
        // ============================================
        // 📊 STATS
        // ============================================
        this.totalMessages = data.totalMessages || 0;
        this.totalMedia = data.totalMedia || 0;
        this.totalFiles = data.totalFiles || 0;
        this.lastActivity = data.lastActivity ? new Date(data.lastActivity) : new Date();
        this.activityLog = Array.isArray(data.activityLog) ? [...data.activityLog] : [];
        
        // ============================================
        // 🏷️ TAGS & LABELS
        // ============================================
        this.tags = Array.isArray(data.tags) ? [...data.tags] : [];
        this.labels = Array.isArray(data.labels) ? [...data.labels] : [];
        this.priority = data.priority || 'normal'; // 'low' | 'normal' | 'high' | 'urgent'
        
        // ============================================
        // 🚩 STATUS FLAGS
        // ============================================
        this.isArchived = data.isArchived || false;
        this.isBlocked = data.isBlocked || false;
        this.isDeleted = data.isDeleted || false;
        this.isReported = data.isReported || false;
        this.isSpam = data.isSpam || false;
        this.isStarred = data.isStarred || false;
        this.isMarked = data.isMarked || false;
        this.isReadOnly = data.isReadOnly || false;
        
        // ============================================
        // 🔒 ENCRYPTION
        // ============================================
        this.isEncrypted = data.isEncrypted || false;
        this.encryptionKey = data.encryptionKey || '';
        this.encryptionType = data.encryptionType || 'none'; // 'none' | 'aes' | 'signal'
        
        // ============================================
        // 📎 ATTACHMENTS
        // ============================================
        this.attachments = Array.isArray(data.attachments) ? [...data.attachments] : [];
        this.media = Array.isArray(data.media) ? [...data.media] : [];
        this.files = Array.isArray(data.files) ? [...data.files] : [];
        
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
     * Generate a unique chat ID
     * @returns {string} Unique ID
     */
    generateId() {
        return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate a unique message ID
     * @returns {string} Unique message ID
     */
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // ============================================
    // VALIDATION
    // ============================================

    /**
     * Validate chat data
     * @param {Object} options - Validation options
     * @param {boolean} options.strict - Strict validation
     * @returns {Object} Validation result { isValid, errors, warnings }
     */
    validate(options = {}) {
        const errors = [];
        const warnings = [];
        const { strict = false } = options;

        // === REQUIRED FIELDS ===
        if (!this.participants || this.participants.length < 2) {
            errors.push('Chat must have at least 2 participants');
        }

        if (this.participants && this.participants.length > 500) {
            errors.push('Group chat cannot have more than 500 participants');
        }

        // === GROUP CHAT ===
        if (this.isGroup) {
            if (!this.groupName || this.groupName.trim() === '') {
                errors.push('Group name is required');
            }
            if (this.groupName && this.groupName.length > 50) {
                errors.push('Group name must be less than 50 characters');
            }
            if (!this.admins || this.admins.length === 0) {
                warnings.push('Group chat should have at least one admin');
            }
        }

        // === PRODUCT ===
        if (this.productId && !this.productTitle) {
            warnings.push('Product ID provided but no product title');
        }

        // === MESSAGES ===
        if (this.messages && this.messages.length > 10000) {
            warnings.push('Message history exceeds 10000 messages');
        }

        // === UNREAD COUNT ===
        for (const [userId, count] of Object.entries(this.unreadCount)) {
            if (count < 0) {
                warnings.push(`Unread count for user ${userId} is negative`);
            }
        }

        // === STATUS ===
        const validStatuses = ['active', 'archived', 'blocked'];
        if (this.status && !validStatuses.includes(this.status)) {
            errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        // === PRIORITY ===
        const validPriorities = ['low', 'normal', 'high', 'urgent'];
        if (this.priority && !validPriorities.includes(this.priority)) {
            warnings.push(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
        }

        // === STRICT VALIDATION ===
        if (strict) {
            if (!this.productId && this.productTitle) {
                warnings.push('Product title provided but no product ID');
            }
            if (this.isGroup && this.participants.length < 3) {
                warnings.push('Group chat should have at least 3 participants');
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
     * @param {boolean} options.includeParticipantsInfo - Include participants info
     * @returns {Object} Firestore document
     */
    toFirestore(options = {}) {
        const { includeMetadata = true, includeMessages = true, includeParticipantsInfo = true } = options;

        const data = {
            participants: [...this.participants],
            productId: this.productId,
            productTitle: this.productTitle,
            productImage: this.productImage,
            productPrice: this.productPrice,
            lastMessage: this.lastMessage,
            lastMessageType: this.lastMessageType,
            lastMessageSenderId: this.lastMessageSenderId,
            lastMessageTime: this.lastMessageTime.toISOString(),
            unreadCount: { ...this.unreadCount },
            status: this.status,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            isGroup: this.isGroup,
            groupName: this.groupName,
            groupAvatar: this.groupAvatar,
            groupDescription: this.groupDescription,
            admins: [...this.admins],
            invitedUsers: [...this.invitedUsers],
            joinRequests: [...this.joinRequests],
            groupSettings: { ...this.groupSettings },
            isMuted: this.isMuted,
            mutedBy: [...this.mutedBy],
            muteUntil: this.muteUntil ? this.muteUntil.toISOString() : null,
            isPinned: this.isPinned,
            pinnedBy: [...this.pinnedBy],
            pinOrder: this.pinOrder,
            isArchived: this.isArchived,
            isBlocked: this.isBlocked,
            isDeleted: this.isDeleted,
            isReported: this.isReported,
            isSpam: this.isSpam,
            isStarred: this.isStarred,
            isMarked: this.isMarked,
            isReadOnly: this.isReadOnly,
            isEncrypted: this.isEncrypted,
            encryptionType: this.encryptionType,
            totalMessages: this.totalMessages,
            totalMedia: this.totalMedia,
            totalFiles: this.totalFiles,
            lastActivity: this.lastActivity.toISOString(),
            tags: [...this.tags],
            labels: [...this.labels],
            priority: this.priority,
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

        if (includeMessages) {
            data.messages = [...this.messages];
            data.messageCount = this.messageCount;
            data.lastReadTimestamp = { ...this.lastReadTimestamp };
            data.attachments = [...this.attachments];
            data.media = [...this.media];
            data.files = [...this.files];
        }

        if (includeParticipantsInfo) {
            data.participantsInfo = { ...this.participantsInfo };
            data.onlineStatus = { ...this.onlineStatus };
            data.lastSeen = { ...this.lastSeen };
            data.typing = { ...this.typing };
            data.typingTimeout = { ...this.typingTimeout };
        }

        return data;
    }

    /**
     * Convert to JSON
     * @param {Object} options - Conversion options
     * @param {boolean} options.includePrivate - Include private fields
     * @param {boolean} options.includeMetadata - Include metadata
     * @param {boolean} options.includeMessages - Include messages
     * @param {boolean} options.includeParticipantsInfo - Include participants info
     * @returns {Object} JSON object
     */
    toJSON(options = {}) {
        const { includePrivate = false, includeMetadata = false, includeMessages = false, includeParticipantsInfo = false } = options;

        const data = {
            id: this.id,
            participants: [...this.participants],
            productId: this.productId,
            productTitle: this.productTitle,
            productImage: this.productImage,
            productPrice: this.productPrice,
            lastMessage: this.lastMessage,
            lastMessageType: this.lastMessageType,
            lastMessageSenderId: this.lastMessageSenderId,
            lastMessageTime: this.lastMessageTime.toISOString(),
            unreadCount: { ...this.unreadCount },
            status: this.status,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            isGroup: this.isGroup,
            groupName: this.groupName,
            groupAvatar: this.groupAvatar,
            groupDescription: this.groupDescription,
            admins: [...this.admins],
            isMuted: this.isMuted,
            isPinned: this.isPinned,
            isArchived: this.isArchived,
            isBlocked: this.isBlocked,
            isDeleted: this.isDeleted,
            isReported: this.isReported,
            isSpam: this.isSpam,
            isStarred: this.isStarred,
            isMarked: this.isMarked,
            isReadOnly: this.isReadOnly,
            isEncrypted: this.isEncrypted,
            encryptionType: this.encryptionType,
            totalMessages: this.totalMessages,
            totalMedia: this.totalMedia,
            totalFiles: this.totalFiles,
            lastActivity: this.lastActivity.toISOString(),
            tags: [...this.tags],
            labels: [...this.labels],
            priority: this.priority
        };

        if (includePrivate) {
            data.mutedBy = [...this.mutedBy];
            data.muteUntil = this.muteUntil ? this.muteUntil.toISOString() : null;
            data.pinnedBy = [...this.pinnedBy];
            data.pinOrder = this.pinOrder;
            data.invitedUsers = [...this.invitedUsers];
            data.joinRequests = [...this.joinRequests];
            data.groupSettings = { ...this.groupSettings };
            data.encryptionKey = this.encryptionKey;
            data.customFields = this.customFields;
            data.notes = this.notes;
            data.internalNotes = this.internalNotes;
        }

        if (includeMetadata) {
            data.metadata = this.metadata;
        }

        if (includeMessages) {
            data.messages = [...this.messages];
            data.messageCount = this.messageCount;
            data.lastReadTimestamp = { ...this.lastReadTimestamp };
            data.attachments = [...this.attachments];
            data.media = [...this.media];
            data.files = [...this.files];
        }

        if (includeParticipantsInfo) {
            data.participantsInfo = { ...this.participantsInfo };
            data.onlineStatus = { ...this.onlineStatus };
            data.lastSeen = { ...this.lastSeen };
            data.typing = { ...this.typing };
            data.typingTimeout = { ...this.typingTimeout };
        }

        return data;
    }

    /**
     * Get public chat data
     * @param {Object} options - Options
     * @param {string} options.userId - User ID for context
     * @param {boolean} options.includeProduct - Include product info
     * @param {boolean} options.includeParticipants - Include participants info
     * @param {number} options.messageLimit - Message limit
     * @returns {Object} Public chat data
     */
    getPublicData(options = {}) {
        const { userId = '', includeProduct = true, includeParticipants = true, messageLimit = 50 } = options;

        const unread = userId ? (this.unreadCount[userId] || 0) : 0;

        const data = {
            id: this.id,
            participants: [...this.participants],
            lastMessage: this.lastMessage,
            lastMessageType: this.lastMessageType,
            lastMessageSenderId: this.lastMessageSenderId,
            lastMessageTime: this.lastMessageTime.toISOString(),
            unreadCount: unread,
            status: this.status,
            isGroup: this.isGroup,
            groupName: this.groupName,
            groupAvatar: this.groupAvatar,
            groupDescription: this.groupDescription,
            isMuted: this.isMuted,
            isPinned: this.isPinned,
            isArchived: this.isArchived,
            isBlocked: this.isBlocked,
            isReported: this.isReported,
            isSpam: this.isSpam,
            isStarred: this.isStarred,
            isEncrypted: this.isEncrypted,
            totalMessages: this.totalMessages,
            lastActivity: this.lastActivity.toISOString(),
            priority: this.priority,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        };

        if (includeProduct) {
            data.productId = this.productId;
            data.productTitle = this.productTitle;
            data.productImage = this.productImage;
            data.productPrice = this.productPrice;
        }

        if (includeParticipants) {
            data.participantsInfo = { ...this.participantsInfo };
            data.onlineStatus = { ...this.onlineStatus };
            data.lastSeen = { ...this.lastSeen };
        }

        // Include recent messages
        const recentMessages = this.getRecentMessages(messageLimit);
        data.messages = recentMessages;

        return data;
    }

    /**
     * Get minimal chat data (for chat list)
     * @param {Object} options - Options
     * @param {string} options.userId - User ID for context
     * @returns {Object} Minimal chat data
     */
    getMinimalData(options = {}) {
        const { userId = '' } = options;

        const unread = userId ? (this.unreadCount[userId] || 0) : 0;

        return {
            id: this.id,
            participants: [...this.participants],
            lastMessage: this.lastMessage,
            lastMessageType: this.lastMessageType,
            lastMessageSenderId: this.lastMessageSenderId,
            lastMessageTime: this.lastMessageTime.toISOString(),
            unreadCount: unread,
            isGroup: this.isGroup,
            groupName: this.groupName,
            groupAvatar: this.groupAvatar,
            isMuted: this.isMuted,
            isPinned: this.isPinned,
            isArchived: this.isArchived,
            isBlocked: this.isBlocked,
            totalMessages: this.totalMessages,
            lastActivity: this.lastActivity.toISOString(),
            productTitle: this.productTitle,
            productImage: this.productImage,
            participantsInfo: { ...this.participantsInfo }
        };
    }

    // ============================================
    // MESSAGE METHODS
    // ============================================

    /**
     * Add a message to the chat
     * @param {Object} message - Message data
     * @param {string} message.senderId - Sender ID
     * @param {string} message.text - Message text
     * @param {string} message.type - Message type (text, image, file, audio, video, location, contact)
     * @param {string} message.media - Media URL
     * @param {string} message.mediaType - Media type
     * @param {number} message.mediaSize - Media size
     * @param {Object} message.metadata - Message metadata
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @param {string} options.replyTo - Reply to message ID
     * @param {Array<string>} options.mentions - Mentioned user IDs
     * @returns {Chat} Updated chat (this)
     */
    addMessage(message, options = {}) {
        const { emitEvent = true, replyTo = '', mentions = [] } = options;

        const newMessage = {
            id: this.generateMessageId(),
            senderId: message.senderId || '',
            text: message.text || '',
            type: message.type || 'text',
            media: message.media || '',
            mediaType: message.mediaType || '',
            mediaSize: message.mediaSize || 0,
            fileName: message.fileName || '',
            fileSize: message.fileSize || 0,
            mimeType: message.mimeType || '',
            duration: message.duration || 0,
            location: message.location || null,
            contact: message.contact || null,
            replyTo: replyTo,
            mentions: mentions,
            isRead: false,
            isDelivered: false,
            isEdited: false,
            isDeleted: false,
            isPinned: false,
            reactions: {},
            metadata: message.metadata || {},
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.messages.push(newMessage);
        this.totalMessages = (this.totalMessages || 0) + 1;
        this.lastMessage = newMessage.text || this.getMessageTypeLabel(newMessage.type);
        this.lastMessageType = newMessage.type;
        this.lastMessageSenderId = newMessage.senderId;
        this.lastMessageTime = newMessage.createdAt;
        this.updatedAt = new Date();
        this.lastActivity = new Date();

        // Update unread count for other participants
        for (const participant of this.participants) {
            if (participant !== newMessage.senderId) {
                this.unreadCount[participant] = (this.unreadCount[participant] || 0) + 1;
            }
        }

        // Track media
        if (newMessage.type === 'image' || newMessage.type === 'video' || newMessage.type === 'audio') {
            this.totalMedia = (this.totalMedia || 0) + 1;
        }
        if (newMessage.type === 'file') {
            this.totalFiles = (this.totalFiles || 0) + 1;
        }

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('chat:message', { chatId: this.id, message: newMessage });
        }

        return this;
    }

    /**
     * Get message type label
     * @param {string} type - Message type
     * @returns {string} Label
     */
    getMessageTypeLabel(type) {
        const labels = {
            text: 'Message',
            image: '📷 Image',
            video: '🎥 Video',
            audio: '🎵 Audio',
            file: '📎 File',
            location: '📍 Location',
            contact: '👤 Contact',
            voice: '🎙️ Voice'
        };
        return labels[type] || type || 'Message';
    }

    /**
     * Mark message as read
     * @param {string} messageId - Message ID
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Chat} Updated chat (this)
     */
    markMessageRead(messageId, userId, options = {}) {
        const { emitEvent = true } = options;
        const message = this.messages.find(m => m.id === messageId);
        if (message && message.senderId !== userId) {
            message.isRead = true;
            this.unreadCount[userId] = Math.max(0, (this.unreadCount[userId] || 0) - 1);
            this.lastReadTimestamp[userId] = new Date();
            this.updatedAt = new Date();

            if (emitEvent && typeof EventBus !== 'undefined') {
                EventBus.emit('chat:message_read', { chatId: this.id, messageId, userId });
            }
        }
        return this;
    }

    /**
     * Mark all messages as read for a user
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Chat} Updated chat (this)
     */
    markAllRead(userId, options = {}) {
        const { emitEvent = true } = options;
        this.unreadCount[userId] = 0;
        this.lastReadTimestamp[userId] = new Date();
        this.updatedAt = new Date();

        // Mark all messages as read
        for (const message of this.messages) {
            if (message.senderId !== userId) {
                message.isRead = true;
            }
        }

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('chat:all_read', { chatId: this.id, userId });
        }
        return this;
    }

    /**
     * Edit a message
     * @param {string} messageId - Message ID
     * @param {string} newText - New text
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Chat} Updated chat (this)
     */
    editMessage(messageId, newText, options = {}) {
        const { emitEvent = true } = options;
        const message = this.messages.find(m => m.id === messageId);
        if (message) {
            message.text = newText;
            message.isEdited = true;
            message.updatedAt = new Date();
            this.updatedAt = new Date();

            // Update last message if this is the latest
            if (this.messages.length > 0 && this.messages[this.messages.length - 1].id === messageId) {
                this.lastMessage = newText;
            }

            if (emitEvent && typeof EventBus !== 'undefined') {
                EventBus.emit('chat:message_edited', { chatId: this.id, messageId, newText });
            }
        }
        return this;
    }

    /**
     * Delete a message
     * @param {string} messageId - Message ID
     * @param {string} userId - User ID (for permission)
     * @param {Object} options - Options
     * @param {boolean} options.hardDelete - Hard delete
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Chat} Updated chat (this)
     */
    deleteMessage(messageId, userId, options = {}) {
        const { hardDelete = false, emitEvent = true } = options;
        const message = this.messages.find(m => m.id === messageId);
        if (message) {
            // Check permission: sender or admin
            if (message.senderId === userId || this.admins.includes(userId)) {
                if (hardDelete) {
                    this.messages = this.messages.filter(m => m.id !== messageId);
                } else {
                    message.isDeleted = true;
                    message.text = 'This message was deleted';
                    message.updatedAt = new Date();
                }
                this.updatedAt = new Date();

                // Update last message if this was the latest
                if (this.messages.length > 0 && this.messages[this.messages.length - 1]?.id === messageId) {
                    const lastMsg = this.messages[this.messages.length - 2];
                    if (lastMsg) {
                        this.lastMessage = lastMsg.text || this.getMessageTypeLabel(lastMsg.type);
                        this.lastMessageType = lastMsg.type;
                        this.lastMessageSenderId = lastMsg.senderId;
                        this.lastMessageTime = lastMsg.createdAt;
                    }
                }

                if (emitEvent && typeof EventBus !== 'undefined') {
                    EventBus.emit('chat:message_deleted', { chatId: this.id, messageId, userId });
                }
            }
        }
        return this;
    }

    /**
     * Add reaction to a message
     * @param {string} messageId - Message ID
     * @param {string} userId - User ID
     * @param {string} reaction - Reaction emoji
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Chat} Updated chat (this)
     */
    addReaction(messageId, userId, reaction, options = {}) {
        const { emitEvent = true } = options;
        const message = this.messages.find(m => m.id === messageId);
        if (message) {
            if (!message.reactions) message.reactions = {};
            message.reactions[userId] = reaction;
            this.updatedAt = new Date();

            if (emitEvent && typeof EventBus !== 'undefined') {
                EventBus.emit('chat:reaction', { chatId: this.id, messageId, userId, reaction });
            }
        }
        return this;
    }

    /**
     * Remove reaction from a message
     * @param {string} messageId - Message ID
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Chat} Updated chat (this)
     */
    removeReaction(messageId, userId, options = {}) {
        const { emitEvent = true } = options;
        const message = this.messages.find(m => m.id === messageId);
        if (message && message.reactions) {
            delete message.reactions[userId];
            this.updatedAt = new Date();

            if (emitEvent && typeof EventBus !== 'undefined') {
                EventBus.emit('chat:reaction_removed', { chatId: this.id, messageId, userId });
            }
        }
        return this;
    }

    /**
     * Pin a message
     * @param {string} messageId - Message ID
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Chat} Updated chat (this)
     */
    pinMessage(messageId, userId, options = {}) {
        const { emitEvent = true } = options;
        const message = this.messages.find(m => m.id === messageId);
        if (message) {
            message.isPinned = true;
            message.pinnedBy = userId;
            message.pinnedAt = new Date();
            this.updatedAt = new Date();

            if (emitEvent && typeof EventBus !== 'undefined') {
                EventBus.emit('chat:message_pinned', { chatId: this.id, messageId, userId });
            }
        }
        return this;
    }

    /**
     * Unpin a message
     * @param {string} messageId - Message ID
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Chat} Updated chat (this)
     */
    unpinMessage(messageId, options = {}) {
        const { emitEvent = true } = options;
        const message = this.messages.find(m => m.id === messageId);
        if (message) {
            message.isPinned = false;
            message.pinnedBy = '';
            message.pinnedAt = null;
            this.updatedAt = new Date();

            if (emitEvent && typeof EventBus !== 'undefined') {
                EventBus.emit('chat:message_unpinned', { chatId: this.id, messageId });
            }
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
     * Get messages after a timestamp
     * @param {Date} timestamp - Timestamp
     * @returns {Array<Object>} Messages
     */
    getMessagesAfter(timestamp) {
        return this.messages.filter(m => m.createdAt > timestamp);
    }

    /**
     * Get unread messages for a user
     * @param {string} userId - User ID
     * @returns {Array<Object>} Unread messages
     */
    getUnreadMessages(userId) {
        const lastRead = this.lastReadTimestamp[userId];
        if (!lastRead) return this.messages;
        return this.messages.filter(m => m.createdAt > lastRead && m.senderId !== userId);
    }

    // ============================================
    // PARTICIPANT METHODS
    // ============================================

    /**
     * Add participant to chat
     * @param {string} userId - User ID
     * @param {Object} userInfo - User info
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Chat} Updated chat (this)
     */
    addParticipant(userId, userInfo = {}, options = {}) {
        const { emitEvent = true } = options;
        if (!this.participants.includes(userId)) {
            this.participants.push(userId);
            this.participantsInfo[userId] = userInfo;
            this.unreadCount[userId] = 0;
            this.onlineStatus[userId] = false;
            this.lastSeen[userId] = null;
            this.updatedAt = new Date();

            if (emitEvent && typeof EventBus !== 'undefined') {
                EventBus.emit('chat:participant_added', { chatId: this.id, userId });
            }
        }
        return this;
    }

    /**
     * Remove participant from chat
     * @param {string} userId - User ID
     * @param {string} removedBy - Removed by user ID
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Chat} Updated chat (this)
     */
    removeParticipant(userId, removedBy, options = {}) {
        const { emitEvent = true } = options;
        if (this.participants.includes(userId)) {
            this.participants = this.participants.filter(id => id !== userId);
            delete this.participantsInfo[userId];
            delete this.unreadCount[userId];
            delete this.onlineStatus[userId];
            delete this.lastSeen[userId];
            delete this.typing[userId];
            delete this.typingTimeout[userId];
            
            // Remove from admins if present
            this.admins = this.admins.filter(id => id !== userId);
            this.updatedAt = new Date();

            if (emitEvent && typeof EventBus !== 'undefined') {
                EventBus.emit('chat:participant_removed', { chatId: this.id, userId, removedBy });
            }
        }
        return this;
    }

    /**
     * Set participant online status
     * @param {string} userId - User ID
     * @param {boolean} isOnline - Online status
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Chat} Updated chat (this)
     */
    setOnlineStatus(userId, isOnline, options = {}) {
        const { emitEvent = true } = options;
        if (this.participants.includes(userId)) {
            this.onlineStatus[userId] = isOnline;
            if (!isOnline) {
                this.lastSeen[userId] = new Date();
            }
            this.updatedAt = new Date();

            if (emitEvent && typeof EventBus !== 'undefined') {
                EventBus.emit('chat:online_status', { chatId: this.id, userId, isOnline });
            }
        }
        return this;
    }

    /**
     * Set typing status
     * @param {string} userId - User ID
     * @param {boolean} isTyping - Typing status
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Chat} Updated chat (this)
     */
    setTyping(userId, isTyping, options = {}) {
        const { emitEvent = true } = options;
        if (this.participants.includes(userId)) {
            this.typing[userId] = isTyping;
            if (isTyping) {
                this.typingTimeout[userId] = setTimeout(() => {
                    this.setTyping(userId, false);
                }, 3000);
            }
            this.updatedAt = new Date();

            if (emitEvent && typeof EventBus !== 'undefined') {
                EventBus.emit('chat:typing', { chatId: this.id, userId, isTyping });
            }
        }
        return this;
    }

    // ============================================
    // GROUP METHODS
    // ============================================

    /**
     * Make user admin
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Chat} Updated chat (this)
     */
    makeAdmin(userId, options = {}) {
        const { emitEvent = true } = options;
        if (this.isGroup && this.participants.includes(userId) && !this.admins.includes(userId)) {
            this.admins.push(userId);
            this.updatedAt = new Date();

            if (emitEvent && typeof EventBus !== 'undefined') {
                EventBus.emit('chat:admin_added', { chatId: this.id, userId });
            }
        }
        return this;
    }

    /**
     * Remove admin
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Chat} Updated chat (this)
     */
    removeAdmin(userId, options = {}) {
        const { emitEvent = true } = options;
        if (this.isGroup && this.admins.includes(userId)) {
            this.admins = this.admins.filter(id => id !== userId);
            this.updatedAt = new Date();

            if (emitEvent && typeof EventBus !== 'undefined') {
                EventBus.emit('chat:admin_removed', { chatId: this.id, userId });
            }
        }
        return this;
    }

    /**
     * Update group info
     * @param {Object} updates - Group updates
     * @param {string} updates.groupName - Group name
     * @param {string} updates.groupAvatar - Group avatar
     * @param {string} updates.groupDescription - Group description
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Chat} Updated chat (this)
     */
    updateGroupInfo(updates, options = {}) {
        const { emitEvent = true } = options;
        if (this.isGroup) {
            if (updates.groupName !== undefined) this.groupName = updates.groupName;
            if (updates.groupAvatar !== undefined) this.groupAvatar = updates.groupAvatar;
            if (updates.groupDescription !== undefined) this.groupDescription = updates.groupDescription;
            this.updatedAt = new Date();

            if (emitEvent && typeof EventBus !== 'undefined') {
                EventBus.emit('chat:group_updated', { chatId: this.id, updates });
            }
        }
        return this;
    }

    // ============================================
    // CHAT STATUS METHODS
    // ============================================

    /**
     * Archive chat
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Chat} Updated chat (this)
     */
    archive(options = {}) {
        const { emitEvent = true } = options;
        this.isArchived = true;
        this.status = 'archived';
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('chat:archived', { chatId: this.id });
        }
        return this;
    }

    /**
     * Unarchive chat
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Chat} Updated chat (this)
     */
    unarchive(options = {}) {
        const { emitEvent = true } = options;
        this.isArchived = false;
        this.status = 'active';
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('chat:unarchived', { chatId: this.id });
        }
        return this;
    }

    /**
     * Block chat
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Chat} Updated chat (this)
     */
    block(options = {}) {
        const { emitEvent = true } = options;
        this.isBlocked = true;
        this.status = 'blocked';
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('chat:blocked', { chatId: this.id });
        }
        return this;
    }

    /**
     * Unblock chat
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Chat} Updated chat (this)
     */
    unblock(options = {}) {
        const { emitEvent = true } = options;
        this.isBlocked = false;
        this.status = 'active';
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('chat:unblocked', { chatId: this.id });
        }
        return this;
    }

    /**
     * Mute chat
     * @param {string} userId - User ID
     * @param {number} duration - Mute duration in minutes
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Chat} Updated chat (this)
     */
    mute(userId, duration = 60, options = {}) {
        const { emitEvent = true } = options;
        this.isMuted = true;
        if (!this.mutedBy.includes(userId)) {
            this.mutedBy.push(userId);
        }
        if (duration > 0) {
            this.muteUntil = new Date(Date.now() + duration * 60 * 1000);
        }
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('chat:muted', { chatId: this.id, userId, duration });
        }
        return this;
    }

    /**
     * Unmute chat
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Chat} Updated chat (this)
     */
    unmute(userId, options = {}) {
        const { emitEvent = true } = options;
        this.isMuted = false;
        this.mutedBy = this.mutedBy.filter(id => id !== userId);
        this.muteUntil = null;
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('chat:unmuted', { chatId: this.id, userId });
        }
        return this;
    }

    /**
     * Pin chat
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Chat} Updated chat (this)
     */
    pin(userId, options = {}) {
        const { emitEvent = true } = options;
        this.isPinned = true;
        if (!this.pinnedBy.includes(userId)) {
            this.pinnedBy.push(userId);
        }
        this.pinOrder = this.pinOrder + 1;
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('chat:pinned', { chatId: this.id, userId });
        }
        return this;
    }

    /**
     * Unpin chat
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Chat} Updated chat (this)
     */
    unpin(userId, options = {}) {
        const { emitEvent = true } = options;
        this.isPinned = false;
        this.pinnedBy = this.pinnedBy.filter(id => id !== userId);
        this.pinOrder = 0;
        this.updatedAt = new Date();

        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('chat:unpinned', { chatId: this.id, userId });
        }
        return this;
    }

    // ============================================
    // STATUS METHODS
    // ============================================

    /** @returns {boolean} Check if chat is active */
    isActiveChat() { return this.status === 'active' && !this.isArchived && !this.isBlocked && !this.isDeleted; }

    /** @returns {boolean} Check if chat is archived */
    isArchivedChat() { return this.isArchived === true; }

    /** @returns {boolean} Check if chat is blocked */
    isBlockedChat() { return this.isBlocked === true; }

    /** @returns {boolean} Check if chat is deleted */
    isDeletedChat() { return this.isDeleted === true; }

    /** @returns {boolean} Check if chat is muted */
    isMutedChat() { return this.isMuted === true && (!this.muteUntil || this.muteUntil > new Date()); }

    /** @returns {boolean} Check if chat is pinned */
    isPinnedChat() { return this.isPinned === true; }

    /** @returns {boolean} Check if chat is group chat */
    isGroupChat() { return this.isGroup === true; }

    /** @returns {boolean} Check if chat has product */
    hasProduct() { return this.productId && this.productId.trim() !== ''; }

    /** @returns {boolean} Check if user is participant */
    isParticipant(userId) { return this.participants.includes(userId); }

    /** @returns {boolean} Check if user is admin */
    isAdmin(userId) { return this.admins.includes(userId); }

    // ============================================
    // STATS METHODS
    // ============================================

    /**
     * Get message count by type
     * @returns {Object} Count by type
     */
    getMessageStats() {
        const stats = { text: 0, image: 0, video: 0, audio: 0, file: 0, location: 0, contact: 0, voice: 0 };
        for (const message of this.messages) {
            if (stats[message.type] !== undefined) stats[message.type]++;
        }
        return stats;
    }

    /**
     * Get daily message count
     * @param {number} days - Number of days
     * @returns {Object} Daily counts
     */
    getDailyMessageCount(days = 7) {
        const counts = {};
        const now = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const key = date.toISOString().split('T')[0];
            counts[key] = 0;
        }
        for (const message of this.messages) {
            const key = message.createdAt.toISOString().split('T')[0];
            if (counts[key] !== undefined) counts[key]++;
        }
        return counts;
    }

    /**
     * Get active participants
     * @param {number} minutes - Minutes threshold
     * @returns {Array<string>} Active participant IDs
     */
    getActiveParticipants(minutes = 5) {
        const threshold = new Date(Date.now() - minutes * 60 * 1000);
        return this.participants.filter(id => 
            this.lastSeen[id] && this.lastSeen[id] > threshold
        );
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Get participant name
     * @param {string} userId - User ID
     * @param {Object} users - Users data
     * @returns {string} Participant name
     */
    getParticipantName(userId, users = {}) {
        if (this.participantsInfo[userId]?.name) {
            return this.participantsInfo[userId].name;
        }
        if (users[userId]) {
            return users[userId].displayName || users[userId].name || userId;
        }
        return userId;
    }

    /**
     * Get participant avatar
     * @param {string} userId - User ID
     * @param {Object} users - Users data
     * @returns {string} Participant avatar
     */
    getParticipantAvatar(userId, users = {}) {
        if (this.participantsInfo[userId]?.avatar) {
            return this.participantsInfo[userId].avatar;
        }
        if (users[userId]) {
            return users[userId].photoURL || users[userId].avatar || '';
        }
        return '';
    }

    /**
     * Get other participant (for 1-on-1 chat)
     * @param {string} userId - User ID
     * @returns {string|null} Other participant ID
     */
    getOtherParticipant(userId) {
        if (this.isGroup) return null;
        const others = this.participants.filter(id => id !== userId);
        return others.length === 1 ? others[0] : null;
    }

    /**
     * Get chat display name
     * @param {string} userId - User ID
     * @param {Object} users - Users data
     * @returns {string} Display name
     */
    getDisplayName(userId, users = {}) {
        if (this.isGroup) {
            return this.groupName || this.participants.map(id => this.getParticipantName(id, users)).join(', ');
        }
        const other = this.getOtherParticipant(userId);
        if (other) {
            return this.getParticipantName(other, users);
        }
        return 'Chat';
    }

    /**
     * Get chat display avatar
     * @param {string} userId - User ID
     * @param {Object} users - Users data
     * @returns {string} Display avatar
     */
    getDisplayAvatar(userId, users = {}) {
        if (this.isGroup) {
            return this.groupAvatar || '';
        }
        const other = this.getOtherParticipant(userId);
        if (other) {
            return this.getParticipantAvatar(other, users);
        }
        return '';
    }

    /**
     * Clone chat
     * @param {Object} options - Clone options
     * @param {boolean} options.keepId - Keep original ID
     * @param {boolean} options.keepTimestamps - Keep original timestamps
     * @param {boolean} options.keepMessages - Keep messages
     * @param {boolean} options.keepStats - Keep stats
     * @returns {Chat} Cloned chat
     */
    clone(options = {}) {
        const { keepId = false, keepTimestamps = false, keepMessages = true, keepStats = true } = options;
        
        const data = this.toFirestore({ 
            includeMetadata: true, 
            includeMessages: keepMessages, 
            includeParticipantsInfo: true 
        });
        
        if (!keepId) {
            delete data.id;
            data.id = this.generateId();
        }
        
        if (!keepTimestamps) {
            data.createdAt = new Date();
            data.updatedAt = new Date();
            data.lastActivity = new Date();
            data.lastMessageTime = new Date();
        }
        
        if (!keepMessages) {
            data.messages = [];
            data.messageCount = 0;
            data.totalMessages = 0;
            data.totalMedia = 0;
            data.totalFiles = 0;
            data.lastMessage = '';
            data.lastMessageType = 'text';
            data.lastMessageSenderId = '';
            data.unreadCount = {};
            data.attachments = [];
            data.media = [];
            data.files = [];
        }
        
        if (!keepStats) {
            data.totalMessages = 0;
            data.totalMedia = 0;
            data.totalFiles = 0;
            data.messageCount = 0;
            data.unreadCount = {};
            data.lastReadTimestamp = {};
        }
        
        data.isDeleted = false;
        data.isArchived = false;
        data.isBlocked = false;
        data.isReported = false;
        data.isSpam = false;
        
        return new Chat({ ...data, id: data.id });
    }

    /**
     * Compare two chats
     * @param {Chat} other - Other chat
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
        return `Chat(${this.id}, ${this.participants.length} participants)`;
    }

    /**
     * Convert to display string
     * @returns {string} Display string
     */
    toDisplayString() {
        return this.isGroup ? this.groupName || 'Group Chat' : 'Chat';
    }

    // ============================================
    // STATIC FACTORY METHODS
    // ============================================

    /**
     * Create chat from Firestore data
     * @param {Object} data - Firestore data
     * @param {string} id - Document ID
     * @returns {Chat} Chat instance
     */
    static fromFirestore(data, id) {
        const chatData = { ...data, id };
        return new Chat(chatData);
    }

    /**
     * Create chats from Firestore array
     * @param {Array} dataArray - Firestore data array
     * @returns {Array<Chat>} Chat instances
     */
    static fromFirestoreArray(dataArray) {
        if (!Array.isArray(dataArray)) return [];
        return dataArray.map(data => Chat.fromFirestore(data, data.id));
    }

    /**
     * Create a direct chat
     * @param {string} userId1 - First user ID
     * @param {string} userId2 - Second user ID
     * @param {Object} options - Options
     * @param {Object} options.user1Info - User 1 info
     * @param {Object} options.user2Info - User 2 info
     * @param {string} options.productId - Product ID
     * @param {string} options.productTitle - Product title
     * @param {string} options.productImage - Product image
     * @returns {Chat} Direct chat
     */
    static createDirectChat(userId1, userId2, options = {}) {
        const { user1Info = {}, user2Info = {}, productId = '', productTitle = '', productImage = '' } = options;

        const chat = new Chat({
            participants: [userId1, userId2],
            productId,
            productTitle,
            productImage,
            isGroup: false,
            participantsInfo: {
                [userId1]: { name: user1Info.name || '', avatar: user1Info.avatar || '' },
                [userId2]: { name: user2Info.name || '', avatar: user2Info.avatar || '' }
            },
            unreadCount: { [userId1]: 0, [userId2]: 0 },
            status: 'active'
        });

        return chat;
    }

    /**
     * Create a group chat
     * @param {string} creatorId - Creator user ID
     * @param {Array<string>} participants - Participant user IDs
     * @param {string} groupName - Group name
     * @param {Object} options - Options
     * @param {string} options.groupAvatar - Group avatar
     * @param {string} options.groupDescription - Group description
     * @param {Object} options.participantsInfo - Participants info
     * @returns {Chat} Group chat
     */
    static createGroupChat(creatorId, participants, groupName, options = {}) {
        const { groupAvatar = '', groupDescription = '', participantsInfo = {} } = options;

        const allParticipants = [creatorId, ...participants.filter(id => id !== creatorId)];
        const unreadCount = {};
        for (const pid of allParticipants) {
            unreadCount[pid] = 0;
        }

        const chat = new Chat({
            participants: allParticipants,
            isGroup: true,
            groupName,
            groupAvatar,
            groupDescription,
            admins: [creatorId],
            participantsInfo,
            unreadCount,
            status: 'active',
            groupSettings: {
                allowAddMembers: true,
                allowRemoveMembers: true,
                allowChangeName: true,
                allowChangeAvatar: true,
                allowChangeDescription: true,
                onlyAdminsCanSend: false,
                onlyAdminsCanAdd: false
            }
        });

        return chat;
    }

    /**
     * Create a product inquiry chat
     * @param {string} buyerId - Buyer user ID
     * @param {string} sellerId - Seller user ID
     * @param {Object} product - Product data
     * @param {Object} options - Options
     * @param {Object} options.buyerInfo - Buyer info
     * @param {Object} options.sellerInfo - Seller info
     * @returns {Chat} Product inquiry chat
     */
    static createProductInquiry(buyerId, sellerId, product, options = {}) {
        const { buyerInfo = {}, sellerInfo = {} } = options;

        const chat = new Chat({
            participants: [buyerId, sellerId],
            productId: product.id || '',
            productTitle: product.title || '',
            productImage: product.thumbnail || product.images?.[0] || '',
            productPrice: product.price || 0,
            isGroup: false,
            participantsInfo: {
                [buyerId]: { name: buyerInfo.name || '', avatar: buyerInfo.avatar || '' },
                [sellerId]: { name: sellerInfo.name || '', avatar: sellerInfo.avatar || '' }
            },
            unreadCount: { [buyerId]: 0, [sellerId]: 0 },
            status: 'active',
            productContext: {
                id: product.id || '',
                title: product.title || '',
                image: product.thumbnail || product.images?.[0] || '',
                price: product.price || 0,
                sellerId: sellerId,
                category: product.category || '',
                condition: product.condition || 'new'
            }
        });

        return chat;
    }

    // ============================================
    // STATIC QUERY & FILTER METHODS
    // ============================================

    /**
     * Filter chats by user
     * @param {Array<Chat>} chats - Chats array
     * @param {string} userId - User ID
     * @returns {Array<Chat>} Filtered chats
     */
    static filterByUser(chats, userId) {
        if (!userId) return chats;
        return chats.filter(c => c.isParticipant(userId));
    }

    /**
     * Filter active chats
     * @param {Array<Chat>} chats - Chats array
     * @returns {Array<Chat>} Active chats
     */
    static filterActive(chats) {
        return chats.filter(c => c.isActiveChat());
    }

    /**
     * Filter archived chats
     * @param {Array<Chat>} chats - Chats array
     * @returns {Array<Chat>} Archived chats
     */
    static filterArchived(chats) {
        return chats.filter(c => c.isArchived);
    }

    /**
     * Filter blocked chats
     * @param {Array<Chat>} chats - Chats array
     * @returns {Array<Chat>} Blocked chats
     */
    static filterBlocked(chats) {
        return chats.filter(c => c.isBlocked);
    }

    /**
     * Filter group chats
     * @param {Array<Chat>} chats - Chats array
     * @param {boolean} isGroup - Group status
     * @returns {Array<Chat>} Filtered chats
     */
    static filterByGroup(chats, isGroup = true) {
        return chats.filter(c => c.isGroup === isGroup);
    }

    /**
     * Filter chats by product
     * @param {Array<Chat>} chats - Chats array
     * @param {string} productId - Product ID
     * @returns {Array<Chat>} Filtered chats
     */
    static filterByProduct(chats, productId) {
        if (!productId) return chats;
        return chats.filter(c => c.productId === productId);
    }

    /**
     * Sort chats by last activity
     * @param {Array<Chat>} chats - Chats array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<Chat>} Sorted chats
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
     * Sort chats by unread count
     * @param {Array<Chat>} chats - Chats array
     * @param {string} userId - User ID
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<Chat>} Sorted chats
     */
    static sortByUnread(chats, userId, order = 'desc') {
        const sorted = [...chats];
        sorted.sort((a, b) => {
            const aCount = a.unreadCount[userId] || 0;
            const bCount = b.unreadCount[userId] || 0;
            return order === 'asc' ? aCount - bCount : bCount - aCount;
        });
        return sorted;
    }

    /**
     * Get pinned chats
     * @param {Array<Chat>} chats - Chats array
     * @param {string} userId - User ID
     * @returns {Array<Chat>} Pinned chats
     */
    static getPinned(chats, userId) {
        return chats.filter(c => c.isPinned && c.pinnedBy.includes(userId));
    }

    /**
     * Get chats with unread messages
     * @param {Array<Chat>} chats - Chats array
     * @param {string} userId - User ID
     * @returns {Array<Chat>} Chats with unread
     */
    static getWithUnread(chats, userId) {
        return chats.filter(c => (c.unreadCount[userId] || 0) > 0);
    }

    /**
     * Get total unread count
     * @param {Array<Chat>} chats - Chats array
     * @param {string} userId - User ID
     * @returns {number} Total unread
     */
    static getTotalUnread(chats, userId) {
        return chats.reduce((sum, c) => sum + (c.unreadCount[userId] || 0), 0);
    }

    /**
     * Get chat by participants (for direct chat)
     * @param {Array<Chat>} chats - Chats array
     * @param {string} userId1 - First user ID
     * @param {string} userId2 - Second user ID
     * @returns {Chat|null} Chat or null
     */
    static getByParticipants(chats, userId1, userId2) {
        return chats.find(c => 
            !c.isGroup &&
            c.participants.includes(userId1) &&
            c.participants.includes(userId2) &&
            c.participants.length === 2
        ) || null;
    }

    /**
     * Validate chat data
     * @param {Object} data - Chat data
     * @returns {boolean} True if valid
     */
    static isValidChatData(data) {
        return data && typeof data === 'object' &&
            data.participants && Array.isArray(data.participants) &&
            data.participants.length >= 2;
    }

    /**
     * Group chats by status
     * @param {Array<Chat>} chats - Chats array
     * @returns {Object} Grouped chats
     */
    static groupByStatus(chats) {
        const groups = {
            active: [],
            archived: [],
            blocked: []
        };
        for (const chat of chats) {
            if (chat.isBlocked) groups.blocked.push(chat);
            else if (chat.isArchived) groups.archived.push(chat);
            else groups.active.push(chat);
        }
        return groups;
    }

    /**
     * Group chats by date
     * @param {Array<Chat>} chats - Chats array
     * @param {string} groupBy - 'day', 'week', 'month'
     * @returns {Object} Grouped chats
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
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default Chat;

// ============================================================
// END OF FILE: chat-model.js
// ============================================================