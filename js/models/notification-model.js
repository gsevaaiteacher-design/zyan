// Notification Model
// ============================================================
// FILE: notification-model.js
// PURPOSE: Notification data structure and management class
// VERSION: 3.0.0 (Production Ready)
// DEPENDENCY: NONE
// USED BY: notification-service.js, notification-screen.js, notification-card.js
// LOCATION: js/models/notification-model.js
// ============================================================

// ============================================================
// NOTIFICATION CLASS
// ============================================================

/**
 * Notification Model Class
 * Represents a notification in the ZYMORE Hybrid Platform
 * 
 * ZYMORE v3.0 Features:
 * - Social Notifications (follow, comment, like, mention, share)
 * - Order Notifications (placed, confirmed, shipped, delivered)
 * - Product Notifications (new, update, price_drop, back_in_stock)
 * - System Notifications (maintenance, update, alert)
 * - Promotion Notifications (offer, discount, campaign)
 * - Grouped Notifications
 * - Actionable Notifications
 * - Priority Based (low, medium, high, urgent)
 * - Push Notification Ready
 * - Email Notification Ready
 * - In-App Notification Ready
 */
export class Notification {
    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * Create a new Notification instance
     * @param {Object} data - Notification data
     * @param {string} data.id - Notification ID (optional)
     * @param {string} data.userId - User ID this notification belongs to
     * @param {string} data.type - Notification type (order, product, system, promotion, social, alert, reminder, update, follow, comment, like, mention, share)
     * @param {string} data.title - Notification title
     * @param {string} data.message - Notification message
     * @param {string} data.body - Notification body (alternative to message)
     * @param {string} data.icon - Notification icon (emoji or URL)
     * @param {string} data.image - Notification image URL
     * @param {string} data.link - Deep link or URL
     * @param {Object} data.data - Additional data payload
     * @param {string} data.priority - Priority level (low, medium, high, urgent)
     * @param {boolean} data.isRead - Read status
     * @param {boolean} data.isSeen - Seen status
     * @param {boolean} data.isDismissed - Dismissed status
     * @param {boolean} data.isArchived - Archived status
     * @param {Date|string} data.createdAt - Creation date
     * @param {Date|string} data.updatedAt - Last update date
     * @param {Date|string} data.readAt - Read timestamp
     * @param {Date|string} data.dismissedAt - Dismissed timestamp
     * @param {Date|string} data.expiresAt - Expiry timestamp
     * @param {string} data.category - Notification category
     * @param {string} data.senderId - Sender ID
     * @param {string} data.senderName - Sender name
     * @param {string} data.senderAvatar - Sender avatar URL
     * @param {string} data.targetId - Target entity ID (orderId, productId, etc.)
     * @param {string} data.targetType - Target entity type (order, product, user, etc.)
     * @param {string} data.action - Action associated with notification
     * @param {Object} data.actionData - Action data
     * @param {Object} data.metadata - Additional metadata
     * @param {boolean} data.isPinned - Pinned status
     * @param {boolean} data.isSilent - Silent notification (no sound/vibration)
     * @param {string} data.channel - Notification channel (in_app, email, push, sms)
     * @param {string} data.sound - Notification sound
     * @param {number} data.badge - Badge count
     * @param {string} data.subtitle - Notification subtitle
     * @param {string} data.summary - Notification summary
     * @param {string} data.status - Notification status (draft, sent, delivered, read, error, failed)
     * @param {Array<string>} data.tags - Tags for filtering
     * @param {string} data.groupId - Group ID for grouped notifications
     * @param {string} data.parentId - Parent notification ID (for replies)
     * @param {string} data.threadId - Thread ID for conversation
     * @param {string} data.replyTo - Reply to notification ID
     * @param {boolean} data.isActionable - Actionable notification
     * @param {Array<Object>} data.actions - Action buttons
     * @param {string} data.template - Notification template name
     * @param {Object} data.templateData - Template data
     * @param {string} data.language - Notification language
     * @param {string} data.translationKey - Translation key
     * @param {Object} data.translations - Translations object
     * @param {string} data.deviceId - Device ID for push
     * @param {string} data.platform - Platform (web, ios, android)
     * @param {string} data.appVersion - App version
     * @param {string} data.ip - IP address
     * @param {string} data.userAgent - User agent
     * @param {string} data.scheduleDate - Scheduled date
     * @param {boolean} data.isScheduled - Is scheduled
     * @param {boolean} data.isRecurring - Is recurring
     * @param {string} data.recurrencePattern - Recurrence pattern
     * @param {number} data.deliveryAttempts - Delivery attempts count
     * @param {string} data.lastDeliveryError - Last delivery error
     * @param {Date|string} data.lastDeliveryAttempt - Last delivery attempt
     * @param {number} data.priorityScore - Priority score (1-100)
     * @param {string} data.severity - Severity (info, warning, error, critical)
     */
    constructor(data = {}) {
        // ============================================
        // BASIC INFORMATION
        // ============================================
        this.id = data.id || data.notificationId || this.generateId();
        this.userId = data.userId || '';
        this.type = data.type || 'system';
        this.title = data.title || '';
        this.message = data.message || data.body || '';
        this.body = data.body || data.message || '';
        
        // ============================================
        // MEDIA
        // ============================================
        this.icon = data.icon || '🔔';
        this.image = data.image || '';
        this.thumbnail = data.thumbnail || '';
        this.avatar = data.avatar || data.senderAvatar || '';
        
        // ============================================
        // LINKS & ACTIONS
        // ============================================
        this.link = data.link || '';
        this.deepLink = data.deepLink || data.link || '';
        this.webUrl = data.webUrl || '';
        this.data = data.data || {};
        this.priority = data.priority || 'medium';
        this.priorityScore = data.priorityScore || this.calculatePriorityScore();
        this.severity = data.severity || 'info'; // 'info' | 'warning' | 'error' | 'critical'
        
        // ============================================
        // STATUS
        // ============================================
        this.isRead = data.isRead !== undefined ? data.isRead : false;
        this.isSeen = data.isSeen !== undefined ? data.isSeen : false;
        this.isDismissed = data.isDismissed !== undefined ? data.isDismissed : false;
        this.isArchived = data.isArchived !== undefined ? data.isArchived : false;
        this.isDeleted = data.isDeleted !== undefined ? data.isDeleted : false;
        this.isActionable = data.isActionable !== undefined ? data.isActionable : false;
        this.isScheduled = data.isScheduled !== undefined ? data.isScheduled : false;
        this.isRecurring = data.isRecurring !== undefined ? data.isRecurring : false;
        this.isSilent = data.isSilent !== undefined ? data.isSilent : false;
        
        // ============================================
        // TIMESTAMPS
        // ============================================
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
        this.readAt = data.readAt ? new Date(data.readAt) : null;
        this.dismissedAt = data.dismissedAt ? new Date(data.dismissedAt) : null;
        this.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
        this.scheduleDate = data.scheduleDate ? new Date(data.scheduleDate) : null;
        this.lastDeliveryAttempt = data.lastDeliveryAttempt ? new Date(data.lastDeliveryAttempt) : null;
        this.sentAt = data.sentAt ? new Date(data.sentAt) : null;
        this.deliveredAt = data.deliveredAt ? new Date(data.deliveredAt) : null;
        
        // ============================================
        // CATEGORY & SENDER
        // ============================================
        this.category = data.category || '';
        this.senderId = data.senderId || '';
        this.senderName = data.senderName || '';
        this.senderAvatar = data.senderAvatar || '';
        this.senderType = data.senderType || 'user'; // 'user' | 'system' | 'admin' | 'bot'
        
        // ============================================
        // TARGET
        // ============================================
        this.targetId = data.targetId || '';
        this.targetType = data.targetType || '';
        this.targetName = data.targetName || '';
        this.targetImage = data.targetImage || '';
        this.targetUrl = data.targetUrl || '';
        
        // ============================================
        // ACTION
        // ============================================
        this.action = data.action || '';
        this.actionData = data.actionData || {};
        this.actions = Array.isArray(data.actions) ? [...data.actions] : [];
        
        // ============================================
        // METADATA
        // ============================================
        this.metadata = data.metadata || {};
        this.context = data.context || {};
        this.reference = data.reference || {};
        
        // ============================================
        // DISPLAY SETTINGS
        // ============================================
        this.isPinned = data.isPinned !== undefined ? data.isPinned : false;
        this.isSilent = data.isSilent !== undefined ? data.isSilent : false;
        this.channel = data.channel || 'in_app'; // 'in_app' | 'email' | 'push' | 'sms' | 'all'
        this.sound = data.sound || 'default';
        this.badge = data.badge !== undefined ? data.badge : 1;
        this.subtitle = data.subtitle || '';
        this.summary = data.summary || '';
        this.color = data.color || '';
        this.backgroundColor = data.backgroundColor || '';
        this.textColor = data.textColor || '';
        this.animation = data.animation || 'default';
        
        // ============================================
        // STATUS TRACKING
        // ============================================
        this.status = data.status || 'sent'; // 'draft' | 'sent' | 'delivered' | 'read' | 'error' | 'failed' | 'scheduled'
        this.deliveryAttempts = data.deliveryAttempts || 0;
        this.lastDeliveryError = data.lastDeliveryError || '';
        this.deliveryStatus = data.deliveryStatus || '';
        
        // ============================================
        // TAGS & GROUPING
        // ============================================
        this.tags = Array.isArray(data.tags) ? [...data.tags] : [];
        this.groupId = data.groupId || data.group || '';
        this.parentId = data.parentId || '';
        this.threadId = data.threadId || data.thread || '';
        this.replyTo = data.replyTo || '';
        this.groupCount = data.groupCount || 1;
        
        // ============================================
        // TEMPLATE & LOCALIZATION
        // ============================================
        this.template = data.template || '';
        this.templateData = data.templateData || {};
        this.language = data.language || 'en';
        this.translationKey = data.translationKey || '';
        this.translations = data.translations || {};
        
        // ============================================
        // DEVICE & PLATFORM
        // ============================================
        this.deviceId = data.deviceId || '';
        this.platform = data.platform || 'web'; // 'web' | 'ios' | 'android' | 'all'
        this.appVersion = data.appVersion || '';
        this.ip = data.ip || '';
        this.userAgent = data.userAgent || '';
        
        // ============================================
        // RECURRENCE
        // ============================================
        this.recurrencePattern = data.recurrencePattern || ''; // 'daily' | 'weekly' | 'monthly' | 'custom'
        this.recurrenceInterval = data.recurrenceInterval || 1;
        this.recurrenceEndDate = data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null;
        this.recurrenceCount = data.recurrenceCount || 0;
        
        // ============================================
        // ANALYTICS
        // ============================================
        this.clickCount = data.clickCount || 0;
        this.impressionCount = data.impressionCount || 0;
        this.actionTaken = data.actionTaken || false;
        this.actionTakenAt = data.actionTakenAt ? new Date(data.actionTakenAt) : null;
        this.conversion = data.conversion || false;
        this.conversionValue = data.conversionValue || 0;
        
        // ============================================
        // EXPIRY & RETENTION
        // ============================================
        this.retentionDays = data.retentionDays || 30;
        this.isExpired = data.isExpired !== undefined ? data.isExpired : false;
        this.autoDelete = data.autoDelete !== undefined ? data.autoDelete : true;
        
        // ============================================
        // CUSTOM FIELDS
        // ============================================
        this.customFields = data.customFields || {};
        this.extraData = data.extraData || {};
        this.notes = data.notes || '';
        this.internalNotes = data.internalNotes || '';
    }

    // ============================================
    // ID GENERATION
    // ============================================

    /**
     * Generate a unique notification ID
     * @returns {string} Unique ID
     */
    generateId() {
        return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Calculate priority score
     * @returns {number} Priority score (1-100)
     */
    calculatePriorityScore() {
        const scores = {
            low: 25,
            medium: 50,
            high: 75,
            urgent: 100
        };
        return scores[this.priority] || 50;
    }

    // ============================================
    // VALIDATION METHODS
    // ============================================

    /**
     * Validate notification data
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

        if (!this.title || this.title.trim() === '') {
            errors.push('Notification title is required');
        }

        if (this.title && this.title.length > 100) {
            errors.push('Notification title must be less than 100 characters');
        }

        if (!this.message || this.message.trim() === '') {
            errors.push('Notification message is required');
        }

        if (this.message && this.message.length > 500) {
            errors.push('Notification message must be less than 500 characters');
        }

        // === TYPE VALIDATION ===
        const validTypes = [
            'order', 'product', 'system', 'promotion', 'social', 
            'alert', 'reminder', 'update', 'follow', 'comment', 
            'like', 'mention', 'share', 'message', 'review',
            'payment', 'shipping', 'support', 'security', 'news'
        ];
        if (this.type && !validTypes.includes(this.type)) {
            warnings.push(`Uncommon notification type: ${this.type}`);
        }

        // === PRIORITY VALIDATION ===
        const validPriorities = ['low', 'medium', 'high', 'urgent'];
        if (this.priority && !validPriorities.includes(this.priority)) {
            errors.push(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
        }

        // === STATUS VALIDATION ===
        const validStatuses = ['draft', 'sent', 'delivered', 'read', 'error', 'failed', 'scheduled'];
        if (this.status && !validStatuses.includes(this.status)) {
            errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        // === CHANNEL VALIDATION ===
        const validChannels = ['in_app', 'email', 'push', 'sms', 'all'];
        if (this.channel && !validChannels.includes(this.channel)) {
            warnings.push(`Uncommon channel: ${this.channel}`);
        }

        // === SEVERITY VALIDATION ===
        const validSeverities = ['info', 'warning', 'error', 'critical'];
        if (this.severity && !validSeverities.includes(this.severity)) {
            warnings.push(`Uncommon severity: ${this.severity}`);
        }

        // === STRICT VALIDATION ===
        if (strict) {
            if (!this.category) {
                warnings.push('Category is recommended');
            }
            if (this.expiresAt && this.expiresAt < new Date()) {
                warnings.push('Notification has already expired');
            }
            if (this.type === 'order' && !this.targetId) {
                warnings.push('Order notification should have a target ID');
            }
            if (this.type === 'social' && !this.senderId) {
                warnings.push('Social notification should have a sender ID');
            }
        }

        // === ACTION VALIDATION ===
        if (this.isActionable && this.actions.length === 0) {
            warnings.push('Actionable notification should have actions');
        }

        // === LINK VALIDATION ===
        if (this.link && !this.isValidUrl(this.link)) {
            warnings.push('Invalid link URL format');
        }
        if (this.deepLink && !this.isValidUrl(this.deepLink)) {
            warnings.push('Invalid deep link URL format');
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
    // TRANSFORMATION METHODS
    // ============================================

    /**
     * Convert Notification to plain object for Firestore
     * @param {Object} options - Conversion options
     * @param {boolean} options.includeMetadata - Include metadata
     * @param {boolean} options.includeTranslations - Include translations
     * @param {boolean} options.includeActions - Include actions
     * @returns {Object} Plain object representation
     */
    toFirestore(options = {}) {
        const { includeMetadata = true, includeTranslations = true, includeActions = true } = options;

        const data = {
            userId: this.userId,
            type: this.type,
            title: this.title,
            message: this.message,
            body: this.body,
            icon: this.icon,
            image: this.image,
            thumbnail: this.thumbnail,
            avatar: this.avatar,
            link: this.link,
            deepLink: this.deepLink,
            webUrl: this.webUrl,
            data: this.data,
            priority: this.priority,
            priorityScore: this.priorityScore,
            severity: this.severity,
            isRead: this.isRead,
            isSeen: this.isSeen,
            isDismissed: this.isDismissed,
            isArchived: this.isArchived,
            isDeleted: this.isDeleted,
            isActionable: this.isActionable,
            isScheduled: this.isScheduled,
            isRecurring: this.isRecurring,
            isSilent: this.isSilent,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            readAt: this.readAt ? this.readAt.toISOString() : null,
            dismissedAt: this.dismissedAt ? this.dismissedAt.toISOString() : null,
            expiresAt: this.expiresAt ? this.expiresAt.toISOString() : null,
            scheduleDate: this.scheduleDate ? this.scheduleDate.toISOString() : null,
            sentAt: this.sentAt ? this.sentAt.toISOString() : null,
            deliveredAt: this.deliveredAt ? this.deliveredAt.toISOString() : null,
            lastDeliveryAttempt: this.lastDeliveryAttempt ? this.lastDeliveryAttempt.toISOString() : null,
            category: this.category,
            senderId: this.senderId,
            senderName: this.senderName,
            senderAvatar: this.senderAvatar,
            senderType: this.senderType,
            targetId: this.targetId,
            targetType: this.targetType,
            targetName: this.targetName,
            targetImage: this.targetImage,
            targetUrl: this.targetUrl,
            action: this.action,
            actionData: this.actionData,
            isPinned: this.isPinned,
            isSilent: this.isSilent,
            channel: this.channel,
            sound: this.sound,
            badge: this.badge,
            subtitle: this.subtitle,
            summary: this.summary,
            color: this.color,
            backgroundColor: this.backgroundColor,
            textColor: this.textColor,
            animation: this.animation,
            status: this.status,
            deliveryAttempts: this.deliveryAttempts,
            lastDeliveryError: this.lastDeliveryError,
            deliveryStatus: this.deliveryStatus,
            tags: [...this.tags],
            groupId: this.groupId,
            parentId: this.parentId,
            threadId: this.threadId,
            replyTo: this.replyTo,
            groupCount: this.groupCount,
            template: this.template,
            templateData: this.templateData,
            language: this.language,
            translationKey: this.translationKey,
            deviceId: this.deviceId,
            platform: this.platform,
            appVersion: this.appVersion,
            ip: this.ip,
            userAgent: this.userAgent,
            recurrencePattern: this.recurrencePattern,
            recurrenceInterval: this.recurrenceInterval,
            recurrenceEndDate: this.recurrenceEndDate ? this.recurrenceEndDate.toISOString() : null,
            recurrenceCount: this.recurrenceCount,
            clickCount: this.clickCount,
            impressionCount: this.impressionCount,
            actionTaken: this.actionTaken,
            actionTakenAt: this.actionTakenAt ? this.actionTakenAt.toISOString() : null,
            conversion: this.conversion,
            conversionValue: this.conversionValue,
            retentionDays: this.retentionDays,
            isExpired: this.isExpired,
            autoDelete: this.autoDelete,
            customFields: this.customFields,
            extraData: this.extraData,
            notes: this.notes,
            internalNotes: this.internalNotes
        };

        if (includeMetadata) {
            data.metadata = this.metadata;
            data.context = this.context;
            data.reference = this.reference;
        }

        if (includeTranslations) {
            data.translations = this.translations;
        }

        if (includeActions) {
            data.actions = [...this.actions];
        }

        return data;
    }

    /**
     * Convert to JSON for API responses
     * @param {Object} options - Conversion options
     * @param {boolean} options.includePrivate - Include private fields
     * @param {boolean} options.includeMetadata - Include metadata
     * @param {boolean} options.includeActions - Include actions
     * @returns {Object} Notification data
     */
    toJSON(options = {}) {
        const { includePrivate = false, includeMetadata = false, includeActions = true } = options;

        const data = {
            id: this.id,
            userId: this.userId,
            type: this.type,
            title: this.title,
            message: this.message,
            body: this.body,
            icon: this.icon,
            image: this.image,
            thumbnail: this.thumbnail,
            avatar: this.avatar,
            link: this.link,
            deepLink: this.deepLink,
            webUrl: this.webUrl,
            priority: this.priority,
            priorityScore: this.priorityScore,
            severity: this.severity,
            isRead: this.isRead,
            isSeen: this.isSeen,
            isDismissed: this.isDismissed,
            isArchived: this.isArchived,
            isDeleted: this.isDeleted,
            isActionable: this.isActionable,
            isScheduled: this.isScheduled,
            isRecurring: this.isRecurring,
            isSilent: this.isSilent,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            readAt: this.readAt ? this.readAt.toISOString() : null,
            dismissedAt: this.dismissedAt ? this.dismissedAt.toISOString() : null,
            expiresAt: this.expiresAt ? this.expiresAt.toISOString() : null,
            scheduleDate: this.scheduleDate ? this.scheduleDate.toISOString() : null,
            sentAt: this.sentAt ? this.sentAt.toISOString() : null,
            deliveredAt: this.deliveredAt ? this.deliveredAt.toISOString() : null,
            category: this.category,
            senderId: this.senderId,
            senderName: this.senderName,
            senderAvatar: this.senderAvatar,
            senderType: this.senderType,
            targetId: this.targetId,
            targetType: this.targetType,
            targetName: this.targetName,
            targetImage: this.targetImage,
            targetUrl: this.targetUrl,
            action: this.action,
            actionData: this.actionData,
            isPinned: this.isPinned,
            channel: this.channel,
            sound: this.sound,
            badge: this.badge,
            subtitle: this.subtitle,
            summary: this.summary,
            color: this.color,
            backgroundColor: this.backgroundColor,
            textColor: this.textColor,
            animation: this.animation,
            status: this.status,
            deliveryStatus: this.deliveryStatus,
            tags: [...this.tags],
            groupId: this.groupId,
            parentId: this.parentId,
            threadId: this.threadId,
            replyTo: this.replyTo,
            groupCount: this.groupCount,
            template: this.template,
            templateData: this.templateData,
            language: this.language,
            translationKey: this.translationKey,
            platform: this.platform,
            appVersion: this.appVersion,
            retentionDays: this.retentionDays,
            isExpired: this.isExpired,
            autoDelete: this.autoDelete,
            customFields: this.customFields
        };

        if (includeActions) {
            data.actions = [...this.actions];
        }

        if (includeMetadata) {
            data.metadata = this.metadata;
            data.context = this.context;
            data.reference = this.reference;
        }

        if (includePrivate) {
            data.data = this.data;
            data.actionData = this.actionData;
            data.ip = this.ip;
            data.userAgent = this.userAgent;
            data.deviceId = this.deviceId;
            data.deliveryAttempts = this.deliveryAttempts;
            data.lastDeliveryError = this.lastDeliveryError;
            data.lastDeliveryAttempt = this.lastDeliveryAttempt ? this.lastDeliveryAttempt.toISOString() : null;
            data.clickCount = this.clickCount;
            data.impressionCount = this.impressionCount;
            data.actionTaken = this.actionTaken;
            data.actionTakenAt = this.actionTakenAt ? this.actionTakenAt.toISOString() : null;
            data.conversion = this.conversion;
            data.conversionValue = this.conversionValue;
            data.recurrencePattern = this.recurrencePattern;
            data.recurrenceInterval = this.recurrenceInterval;
            data.recurrenceEndDate = this.recurrenceEndDate ? this.recurrenceEndDate.toISOString() : null;
            data.recurrenceCount = this.recurrenceCount;
            data.notes = this.notes;
            data.internalNotes = this.internalNotes;
            data.translations = this.translations;
            data.extraData = this.extraData;
        }

        return data;
    }

    /**
     * Get public notification data
     * @param {Object} options - Options
     * @param {boolean} options.includeSender - Include sender info
     * @param {boolean} options.includeTarget - Include target info
     * @returns {Object} Public notification data
     */
    getPublicData(options = {}) {
        const { includeSender = true, includeTarget = true } = options;

        const data = {
            id: this.id,
            type: this.type,
            title: this.title,
            message: this.message,
            body: this.body,
            icon: this.icon,
            image: this.image,
            thumbnail: this.thumbnail,
            link: this.link,
            deepLink: this.deepLink,
            priority: this.priority,
            severity: this.severity,
            isRead: this.isRead,
            isSeen: this.isSeen,
            isActionable: this.isActionable,
            isPinned: this.isPinned,
            createdAt: this.createdAt.toISOString(),
            readAt: this.readAt ? this.readAt.toISOString() : null,
            expiresAt: this.expiresAt ? this.expiresAt.toISOString() : null,
            category: this.category,
            channel: this.channel,
            badge: this.badge,
            subtitle: this.subtitle,
            summary: this.summary,
            color: this.color,
            backgroundColor: this.backgroundColor,
            textColor: this.textColor,
            status: this.status,
            tags: [...this.tags],
            groupId: this.groupId,
            groupCount: this.groupCount,
            template: this.template,
            templateData: this.templateData,
            language: this.language,
            actions: [...this.actions]
        };

        if (includeSender) {
            data.senderId = this.senderId;
            data.senderName = this.senderName;
            data.senderAvatar = this.senderAvatar;
            data.senderType = this.senderType;
        }

        if (includeTarget) {
            data.targetId = this.targetId;
            data.targetType = this.targetType;
            data.targetName = this.targetName;
            data.targetImage = this.targetImage;
            data.targetUrl = this.targetUrl;
        }

        return data;
    }

    /**
     * Get minimal notification data (for lists)
     * @param {Object} options - Options
     * @param {boolean} options.includeSender - Include sender info
     * @returns {Object} Minimal notification data
     */
    getMinimalData(options = {}) {
        const { includeSender = false } = options;

        const data = {
            id: this.id,
            title: this.title,
            message: this.message,
            icon: this.icon,
            image: this.image,
            isRead: this.isRead,
            isPinned: this.isPinned,
            createdAt: this.createdAt.toISOString(),
            type: this.type,
            category: this.category,
            badge: this.badge,
            color: this.color,
            link: this.link,
            isActionable: this.isActionable
        };

        if (includeSender) {
            data.senderName = this.senderName;
            data.senderAvatar = this.senderAvatar;
        }

        return data;
    }

    /**
     * Get compact notification data (for notifications list)
     * @returns {Object} Compact notification data
     */
    getCompactData() {
        return {
            id: this.id,
            title: this.title,
            message: this.message,
            icon: this.icon,
            image: this.image,
            isRead: this.isRead,
            isPinned: this.isPinned,
            createdAt: this.createdAt.toISOString(),
            timeAgo: this.getTimeAgo(),
            type: this.type,
            category: this.category,
            color: this.color,
            link: this.link,
            senderName: this.senderName,
            senderAvatar: this.senderAvatar,
            actions: this.actions.slice(0, 2)
        };
    }

    // ============================================
    // STATUS METHODS
    // ============================================

    /**
     * Mark notification as read
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Notification} Updated notification (this)
     */
    markAsRead(options = {}) {
        const { emitEvent = true } = options;
        if (!this.isRead) {
            this.isRead = true;
            this.isSeen = true;
            this.readAt = new Date();
            this.updatedAt = new Date();
            this.status = 'read';
            if (emitEvent && typeof EventBus !== 'undefined') {
                EventBus.emit('notification:read', { notificationId: this.id });
            }
        }
        return this;
    }

    /**
     * Mark notification as unread
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Notification} Updated notification (this)
     */
    markAsUnread(options = {}) {
        const { emitEvent = true } = options;
        this.isRead = false;
        this.readAt = null;
        this.updatedAt = new Date();
        this.status = 'delivered';
        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('notification:unread', { notificationId: this.id });
        }
        return this;
    }

    /**
     * Mark notification as seen
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Notification} Updated notification (this)
     */
    markAsSeen(options = {}) {
        const { emitEvent = true } = options;
        this.isSeen = true;
        this.updatedAt = new Date();
        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('notification:seen', { notificationId: this.id });
        }
        return this;
    }

    /**
     * Mark notification as dismissed
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Notification} Updated notification (this)
     */
    markAsDismissed(options = {}) {
        const { emitEvent = true } = options;
        this.isDismissed = true;
        this.dismissedAt = new Date();
        this.updatedAt = new Date();
        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('notification:dismissed', { notificationId: this.id });
        }
        return this;
    }

    /**
     * Mark notification as archived
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Notification} Updated notification (this)
     */
    markAsArchived(options = {}) {
        const { emitEvent = true } = options;
        this.isArchived = true;
        this.updatedAt = new Date();
        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('notification:archived', { notificationId: this.id });
        }
        return this;
    }

    /**
     * Toggle read status
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Notification} Updated notification (this)
     */
    toggleRead(options = {}) {
        if (this.isRead) {
            this.markAsUnread(options);
        } else {
            this.markAsRead(options);
        }
        return this;
    }

    /**
     * Toggle pinned status
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Notification} Updated notification (this)
     */
    togglePinned(options = {}) {
        const { emitEvent = true } = options;
        this.isPinned = !this.isPinned;
        this.updatedAt = new Date();
        if (emitEvent && typeof EventBus !== 'undefined') {
            EventBus.emit('notification:pinned', { 
                notificationId: this.id, 
                isPinned: this.isPinned 
            });
        }
        return this;
    }

    /**
     * Check if notification is unread
     * @returns {boolean} True if unread
     */
    isUnread() {
        return !this.isRead;
    }

    /**
     * Check if notification is unpinned
     * @returns {boolean} True if unpinned
     */
    isUnpinned() {
        return !this.isPinned;
    }

    /**
     * Check if notification is actionable
     * @returns {boolean} True if actionable
     */
    isActionableNotification() {
        return this.isActionable === true && this.actions.length > 0;
    }

    /**
     * Check if notification is expired
     * @returns {boolean} True if expired
     */
    isExpiredNotification() {
        if (!this.expiresAt) return false;
        return new Date() > this.expiresAt;
    }

    /**
     * Check if notification is scheduled
     * @returns {boolean} True if scheduled
     */
    isScheduledNotification() {
        return this.isScheduled === true && this.scheduleDate !== null;
    }

    /**
     * Check if notification should be auto-deleted
     * @returns {boolean} True if should be deleted
     */
    shouldAutoDelete() {
        if (!this.autoDelete) return false;
        if (!this.expiresAt) {
            const expiryDate = new Date(this.createdAt);
            expiryDate.setDate(expiryDate.getDate() + this.retentionDays);
            return new Date() > expiryDate;
        }
        return new Date() > this.expiresAt;
    }

    // ============================================
    // TIME METHODS
    // ============================================

    /**
     * Get formatted creation date
     * @param {string} locale - Locale for formatting
     * @param {Object} options - Date formatting options
     * @returns {string} Formatted date
     */
    getCreatedDate(locale = 'en-US', options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return this.createdAt.toLocaleDateString(locale, { ...defaultOptions, ...options });
    }

    /**
     * Get formatted creation time
     * @param {string} locale - Locale for formatting
     * @param {Object} options - Time formatting options
     * @returns {string} Formatted time
     */
    getCreatedTime(locale = 'en-US', options = {}) {
        const defaultOptions = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        return this.createdAt.toLocaleTimeString(locale, { ...defaultOptions, ...options });
    }

    /**
     * Get full formatted date and time
     * @param {string} locale - Locale for formatting
     * @returns {string} Formatted date and time
     */
    getFullDateTime(locale = 'en-US') {
        return this.getCreatedDate(locale) + ' ' + this.getCreatedTime(locale);
    }

    /**
     * Get time ago (e.g., "5 minutes ago")
     * @param {string} locale - Locale for formatting
     * @returns {string} Time ago string
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

        if (seconds < 60) {
            return seconds < 10 ? 'Just now' : `${seconds}s ago`;
        } else if (minutes < 60) {
            return `${minutes}m ago`;
        } else if (hours < 24) {
            return `${hours}h ago`;
        } else if (days < 7) {
            return `${days}d ago`;
        } else if (weeks < 4) {
            return `${weeks}w ago`;
        } else if (months < 12) {
            return `${months}mo ago`;
        } else {
            return `${years}y ago`;
        }
    }

    /**
     * Check if notification is recent (within last 24 hours)
     * @returns {boolean} True if recent
     */
    isRecent() {
        const now = new Date();
        const diff = now - this.createdAt;
        return diff < 24 * 60 * 60 * 1000;
    }

    /**
     * Check if notification is today
     * @returns {boolean} True if today
     */
    isToday() {
        const today = new Date();
        return this.createdAt.getDate() === today.getDate() &&
               this.createdAt.getMonth() === today.getMonth() &&
               this.createdAt.getFullYear() === today.getFullYear();
    }

    /**
     * Check if notification is this week
     * @returns {boolean} True if this week
     */
    isThisWeek() {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return this.createdAt >= startOfWeek;
    }

    /**
     * Check if notification is this month
     * @returns {boolean} True if this month
     */
    isThisMonth() {
        const now = new Date();
        return this.createdAt.getMonth() === now.getMonth() &&
               this.createdAt.getFullYear() === now.getFullYear();
    }

    // ============================================
    // GROUPING METHODS
    // ============================================

    /**
     * Check if notification is part of a group
     * @returns {boolean} True if in a group
     */
    isGrouped() {
        return this.groupId && this.groupId.trim() !== '';
    }

    /**
     * Get group key for grouping
     * @returns {string} Group key
     */
    getGroupKey() {
        return this.groupId || this.id;
    }

    /**
     * Check if notification is part of a thread
     * @returns {boolean} True if in a thread
     */
    isThreaded() {
        return this.threadId && this.threadId.trim() !== '';
    }

    /**
     * Get thread key
     * @returns {string} Thread key
     */
    getThreadKey() {
        return this.threadId || this.id;
    }

    /**
     * Increment group count
     * @param {number} amount - Amount to increment
     * @returns {Notification} Updated notification (this)
     */
    incrementGroupCount(amount = 1) {
        this.groupCount = (this.groupCount || 1) + amount;
        this.updatedAt = new Date();
        return this;
    }

    // ============================================
    // CATEGORY & TYPE METHODS
    // ============================================

    /**
     * Get notification category display name
     * @param {string} locale - Locale for formatting
     * @returns {string} Category display name
     */
    getCategoryDisplayName(locale = 'en-US') {
        const categories = {
            order: '🛒 Order',
            product: '📦 Product',
            system: '⚙️ System',
            promotion: '🎉 Promotion',
            social: '👥 Social',
            alert: '⚠️ Alert',
            reminder: '⏰ Reminder',
            update: '🔄 Update',
            follow: '👤 Follow',
            comment: '💬 Comment',
            like: '❤️ Like',
            mention: '@ Mention',
            share: '↗️ Share',
            message: '✉️ Message',
            review: '⭐ Review',
            payment: '💳 Payment',
            shipping: '📦 Shipping',
            support: '🆘 Support',
            security: '🔒 Security',
            news: '📰 News'
        };
        return categories[this.category] || this.category || '📬 Notification';
    }

    /**
     * Get notification type display name
     * @param {string} locale - Locale for formatting
     * @returns {string} Type display name
     */
    getTypeDisplayName(locale = 'en-US') {
        const types = {
            order: 'Order Update',
            product: 'Product Update',
            system: 'System Notification',
            promotion: 'Promotion',
            social: 'Social Update',
            alert: 'Alert',
            reminder: 'Reminder',
            update: 'Update',
            follow: 'New Follower',
            comment: 'New Comment',
            like: 'New Like',
            mention: 'Mention',
            share: 'New Share',
            message: 'New Message',
            review: 'New Review',
            payment: 'Payment Update',
            shipping: 'Shipping Update',
            support: 'Support Update',
            security: 'Security Alert',
            news: 'News Update'
        };
        return types[this.type] || this.type || 'Notification';
    }

    /**
     * Get notification icon based on type
     * @returns {string} Icon emoji
     */
    getTypeIcon() {
        const icons = {
            order: '🛒',
            product: '📦',
            system: '⚙️',
            promotion: '🎉',
            social: '👥',
            alert: '⚠️',
            reminder: '⏰',
            update: '🔄',
            follow: '👤',
            comment: '💬',
            like: '❤️',
            mention: '@',
            share: '↗️',
            message: '✉️',
            review: '⭐',
            payment: '💳',
            shipping: '📦',
            support: '🆘',
            security: '🔒',
            news: '📰'
        };
        return icons[this.type] || this.icon || '🔔';
    }

    /**
     * Get notification color based on type
     * @returns {string} Color hex code
     */
    getColor() {
        const colors = {
            order: '#4CAF50',
            product: '#2196F3',
            system: '#9E9E9E',
            promotion: '#FF9800',
            social: '#E91E63',
            alert: '#F44336',
            reminder: '#FF5722',
            update: '#00BCD4',
            follow: '#8BC34A',
            comment: '#3F51B5',
            like: '#F44336',
            mention: '#9C27B0',
            share: '#4CAF50',
            message: '#2196F3',
            review: '#FFC107',
            payment: '#4CAF50',
            shipping: '#00BCD4',
            support: '#FF5722',
            security: '#F44336',
            news: '#607D8B'
        };
        return colors[this.type] || '#607D8B';
    }

    /**
     * Get priority display name
     * @param {string} locale - Locale for formatting
     * @returns {string} Priority display name
     */
    getPriorityDisplayName(locale = 'en-US') {
        const priorities = {
            low: '🟢 Low',
            medium: '🟡 Medium',
            high: '🟠 High',
            urgent: '🔴 Urgent'
        };
        return priorities[this.priority] || this.priority || '🟡 Medium';
    }

    /**
     * Get severity display name
     * @param {string} locale - Locale for formatting
     * @returns {string} Severity display name
     */
    getSeverityDisplayName(locale = 'en-US') {
        const severities = {
            info: 'ℹ️ Info',
            warning: '⚠️ Warning',
            error: '❌ Error',
            critical: '🚨 Critical'
        };
        return severities[this.severity] || this.severity || 'ℹ️ Info';
    }

    // ============================================
    // ACTION METHODS
    // ============================================

    /**
     * Get action handler function
     * @param {Object} handlers - Action handlers object
     * @param {string} actionId - Specific action ID
     * @returns {Function} Action handler
     */
    getActionHandler(handlers = {}, actionId = null) {
        const action = actionId || this.action;
        if (action && handlers[action]) {
            return handlers[action];
        }
        return handlers.default || null;
    }

    /**
     * Execute action
     * @param {Object} context - Execution context
     * @param {Object} handlers - Action handlers
     * @param {string} actionId - Specific action ID
     * @param {Object} options - Execution options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Promise} Action result
     */
    async executeAction(context = {}, handlers = {}, actionId = null, options = {}) {
        const { emitEvent = true } = options;
        const handler = this.getActionHandler(handlers, actionId);
        
        if (handler) {
            try {
                const result = await handler(this, context);
                this.actionTaken = true;
                this.actionTakenAt = new Date();
                this.updatedAt = new Date();
                
                if (emitEvent && typeof EventBus !== 'undefined') {
                    EventBus.emit('notification:action', { 
                        notificationId: this.id, 
                        action: actionId || this.action,
                        result: result
                    });
                }
                
                return result;
            } catch (error) {
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('notification:action:error', { 
                        notificationId: this.id, 
                        action: actionId || this.action,
                        error: error.message
                    });
                }
                throw error;
            }
        }
        return null;
    }

    /**
     * Add an action button
     * @param {Object} action - Action configuration
     * @param {string} action.id - Action ID
     * @param {string} action.label - Action label
     * @param {string} action.icon - Action icon
     * @param {string} action.type - Action type (primary, secondary, danger)
     * @param {Function} action.handler - Action handler
     * @param {Object} action.data - Action data
     * @returns {Notification} Updated notification (this)
     */
    addAction(action) {
        if (!this.actions) this.actions = [];
        action.id = action.id || `action_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        this.actions.push(action);
        this.isActionable = true;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Remove an action
     * @param {string} actionId - Action ID to remove
     * @returns {Notification} Updated notification (this)
     */
    removeAction(actionId) {
        if (this.actions) {
            this.actions = this.actions.filter(a => a.id !== actionId);
            if (this.actions.length === 0) {
                this.isActionable = false;
            }
            this.updatedAt = new Date();
        }
        return this;
    }

    // ============================================
    // TRACKING METHODS
    // ============================================

    /**
     * Record an impression
     * @param {Object} details - Impression details
     * @param {string} details.source - Source (feed, notification_center, etc.)
     * @param {string} details.device - Device type
     * @returns {Notification} Updated notification (this)
     */
    recordImpression(details = {}) {
        this.impressionCount = (this.impressionCount || 0) + 1;
        this.updatedAt = new Date();
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('notification:impression', { 
                notificationId: this.id, 
                ...details 
            });
        }
        return this;
    }

    /**
     * Record a click
     * @param {Object} details - Click details
     * @param {string} details.source - Source
     * @param {string} details.device - Device type
     * @returns {Notification} Updated notification (this)
     */
    recordClick(details = {}) {
        this.clickCount = (this.clickCount || 0) + 1;
        this.updatedAt = new Date();
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('notification:click', { 
                notificationId: this.id, 
                ...details 
            });
        }
        return this;
    }

    /**
     * Record conversion
     * @param {number} value - Conversion value
     * @param {Object} details - Conversion details
     * @returns {Notification} Updated notification (this)
     */
    recordConversion(value = 0, details = {}) {
        this.conversion = true;
        this.conversionValue = value;
        this.updatedAt = new Date();
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('notification:conversion', { 
                notificationId: this.id, 
                value: value,
                ...details 
            });
        }
        return this;
    }

    /**
     * Record delivery attempt
     * @param {string} status - Delivery status
     * @param {string} error - Error message (if failed)
     * @returns {Notification} Updated notification (this)
     */
    recordDeliveryAttempt(status, error = '') {
        this.deliveryAttempts = (this.deliveryAttempts || 0) + 1;
        this.lastDeliveryAttempt = new Date();
        this.deliveryStatus = status;
        if (error) {
            this.lastDeliveryError = error;
        }
        this.updatedAt = new Date();
        return this;
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Get notification display string
     * @param {Object} options - Display options
     * @param {string} options.format - Format ('icon_title', 'title_only', 'full')
     * @returns {string} Display string
     */
    toDisplayString(options = {}) {
        const { format = 'icon_title' } = options;
        
        switch (format) {
            case 'icon_title':
                return this.icon ? `${this.icon} ${this.title}` : this.title;
            case 'title_only':
                return this.title;
            case 'full':
                return this.icon ? `${this.icon} ${this.title}: ${this.message}` : `${this.title}: ${this.message}`;
            default:
                return this.icon ? `${this.icon} ${this.title}` : this.title;
        }
    }

    /**
     * Get full notification text
     * @returns {string} Full text
     */
    getFullText() {
        return `${this.title}: ${this.message}`;
    }

    /**
     * Get short summary (truncated)
     * @param {number} maxLength - Maximum length
     * @param {string} truncate - Truncation string
     * @returns {string} Short summary
     */
    getShortSummary(maxLength = 50, truncate = '...') {
        const text = this.message || this.body || '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + truncate;
    }

    /**
     * Get notification priority level
     * @returns {number} Priority number (1-4)
     */
    getPriorityLevel() {
        const levels = {
            low: 1,
            medium: 2,
            high: 3,
            urgent: 4
        };
        return levels[this.priority] || 2;
    }

    /**
     * Check if notification has image
     * @returns {boolean} True if has image
     */
    hasImage() {
        return !!(this.image && this.image.trim() !== '');
    }

    /**
     * Check if notification has thumbnail
     * @returns {boolean} True if has thumbnail
     */
    hasThumbnail() {
        return !!(this.thumbnail && this.thumbnail.trim() !== '');
    }

    /**
     * Check if notification has link
     * @returns {boolean} True if has link
     */
    hasLink() {
        return !!(this.link && this.link.trim() !== '');
    }

    /**
     * Check if notification has deep link
     * @returns {boolean} True if has deep link
     */
    hasDeepLink() {
        return !!(this.deepLink && this.deepLink.trim() !== '');
    }

    /**
     * Check if notification has actions
     * @returns {boolean} True if has actions
     */
    hasActions() {
        return this.actions && this.actions.length > 0;
    }

    /**
     * Get primary action
     * @returns {Object|null} Primary action or null
     */
    getPrimaryAction() {
        if (!this.actions || this.actions.length === 0) return null;
        return this.actions.find(a => a.type === 'primary') || this.actions[0];
    }

    /**
     * Get action by ID
     * @param {string} actionId - Action ID
     * @returns {Object|null} Action or null
     */
    getAction(actionId) {
        if (!this.actions) return null;
        return this.actions.find(a => a.id === actionId) || null;
    }

    /**
     * Get translated content
     * @param {string} locale - Locale
     * @param {string} field - Field to translate (title, message, body)
     * @returns {string} Translated content
     */
    getTranslation(locale = 'en', field = 'title') {
        if (this.translations && this.translations[locale] && this.translations[locale][field]) {
            return this.translations[locale][field];
        }
        return this[field] || '';
    }

    /**
     * Clone notification object
     * @param {Object} options - Clone options
     * @param {boolean} options.keepId - Keep original ID
     * @param {boolean} options.keepTimestamps - Keep original timestamps
     * @param {boolean} options.keepStats - Keep original stats
     * @returns {Notification} New Notification instance with same data
     */
    clone(options = {}) {
        const { keepId = false, keepTimestamps = false, keepStats = false } = options;
        
        const data = this.toFirestore({ 
            includeMetadata: true, 
            includeTranslations: true, 
            includeActions: true 
        });
        
        if (!keepId) {
            delete data.id;
            data.id = this.generateId();
        }
        
        if (!keepTimestamps) {
            data.createdAt = new Date();
            data.updatedAt = new Date();
            data.readAt = null;
            data.dismissedAt = null;
            data.sentAt = null;
            data.deliveredAt = null;
            data.lastDeliveryAttempt = null;
            data.actionTakenAt = null;
        }
        
        if (!keepStats) {
            data.clickCount = 0;
            data.impressionCount = 0;
            data.actionTaken = false;
            data.conversion = false;
            data.conversionValue = 0;
            data.deliveryAttempts = 0;
            data.lastDeliveryError = '';
            data.deliveryStatus = '';
        }
        
        return new Notification({ ...data, id: data.id });
    }

    // ============================================
    // COMPARISON METHODS
    // ============================================

    /**
     * Compare two notifications for equality
     * @param {Notification} other - Other notification
     * @returns {boolean} True if same notification
     */
    equals(other) {
        if (!other) return false;
        return this.id === other.id;
    }

    /**
     * Check if notification belongs to a user
     * @param {string} userId - User ID
     * @returns {boolean} True if belongs to user
     */
    belongsToUser(userId) {
        return this.userId === userId;
    }

    /**
     * Check if notification has a tag
     * @param {string} tag - Tag to check
     * @returns {boolean} True if has tag
     */
    hasTag(tag) {
        return this.tags && this.tags.includes(tag);
    }

    /**
     * Add a tag to notification
     * @param {string} tag - Tag to add
     * @returns {Notification} Updated notification (this)
     */
    addTag(tag) {
        if (!this.tags) this.tags = [];
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
            this.updatedAt = new Date();
        }
        return this;
    }

    /**
     * Remove a tag from notification
     * @param {string} tag - Tag to remove
     * @returns {Notification} Updated notification (this)
     */
    removeTag(tag) {
        if (this.tags) {
            this.tags = this.tags.filter(t => t !== tag);
            this.updatedAt = new Date();
        }
        return this;
    }

    /**
     * Check if notification is from sender
     * @param {string} senderId - Sender ID
     * @returns {boolean} True if from sender
     */
    fromSender(senderId) {
        return this.senderId === senderId;
    }

    /**
     * Check if notification targets entity
     * @param {string} targetId - Target ID
     * @param {string} targetType - Target type
     * @returns {boolean} True if targets entity
     */
    targets(targetId, targetType = null) {
        if (this.targetId !== targetId) return false;
        if (targetType && this.targetType !== targetType) return false;
        return true;
    }

    // ============================================
    // STRING REPRESENTATION
    // ============================================

    /**
     * Get string representation
     * @returns {string} String representation
     */
    toString() {
        return `Notification(${this.title}, ${this.type}, ${this.status})`;
    }

    // ============================================
    // STATIC FACTORY METHODS
    // ============================================

    /**
     * Create Notification from Firestore data
     * @param {Object} data - Firestore document data
     * @param {string} id - Document ID
     * @returns {Notification} Notification instance
     */
    static fromFirestore(data, id) {
        const notificationData = { ...data, id };
        return new Notification(notificationData);
    }

    /**
     * Create a new notification from form data
     * @param {Object} formData - Form data
     * @returns {Notification} Notification instance
     */
    static fromForm(formData) {
        return new Notification({
            userId: formData.userId || '',
            type: formData.type || 'system',
            title: formData.title || '',
            message: formData.message || formData.body || '',
            body: formData.body || formData.message || '',
            icon: formData.icon || '🔔',
            image: formData.image || '',
            link: formData.link || '',
            priority: formData.priority || 'medium',
            category: formData.category || '',
            senderId: formData.senderId || '',
            senderName: formData.senderName || '',
            senderAvatar: formData.senderAvatar || '',
            targetId: formData.targetId || '',
            targetType: formData.targetType || '',
            action: formData.action || '',
            actionData: formData.actionData || {},
            metadata: formData.metadata || {},
            isPinned: formData.isPinned || false,
            isSilent: formData.isSilent || false,
            channel: formData.channel || 'in_app',
            sound: formData.sound || 'default',
            subtitle: formData.subtitle || '',
            summary: formData.summary || '',
            tags: formData.tags || [],
            groupId: formData.groupId || formData.group || '',
            isActionable: formData.isActionable || false,
            actions: formData.actions || [],
            severity: formData.severity || 'info',
            expiresAt: formData.expiresAt || null,
            scheduleDate: formData.scheduleDate || null,
            retentionDays: formData.retentionDays || 30,
            autoDelete: formData.autoDelete !== undefined ? formData.autoDelete : true,
            customFields: formData.customFields || {},
            extraData: formData.extraData || {},
            notes: formData.notes || '',
            internalNotes: formData.internalNotes || ''
        });
    }

    /**
     * Create a system notification
     * @param {Object} data - Notification data
     * @param {Object} options - Options
     * @param {boolean} options.highPriority - High priority
     * @returns {Notification} System notification
     */
    static createSystem(data, options = {}) {
        const { highPriority = false } = options;
        return new Notification({
            ...data,
            type: 'system',
            category: 'system',
            priority: highPriority ? 'high' : 'medium',
            severity: 'info',
            channel: 'in_app',
            senderType: 'system'
        });
    }

    /**
     * Create an order notification
     * @param {Object} data - Notification data
     * @param {Object} options - Options
     * @param {boolean} options.urgent - Urgent notification
     * @returns {Notification} Order notification
     */
    static createOrder(data, options = {}) {
        const { urgent = false } = options;
        return new Notification({
            ...data,
            type: 'order',
            category: 'order',
            priority: urgent ? 'urgent' : 'high',
            icon: data.icon || '🛒',
            targetType: 'order',
            action: 'view_order',
            severity: urgent ? 'critical' : 'info',
            channel: 'in_app'
        });
    }

    /**
     * Create a product notification
     * @param {Object} data - Notification data
     * @param {Object} options - Options
     * @param {boolean} options.highPriority - High priority
     * @returns {Notification} Product notification
     */
    static createProduct(data, options = {}) {
        const { highPriority = false } = options;
        return new Notification({
            ...data,
            type: 'product',
            category: 'product',
            priority: highPriority ? 'high' : 'medium',
            icon: data.icon || '📦',
            targetType: 'product',
            action: 'view_product',
            severity: 'info',
            channel: 'in_app'
        });
    }

    /**
     * Create a social notification
     * @param {Object} data - Notification data
     * @param {Object} options - Options
     * @param {string} options.socialType - Social type (follow, comment, like, mention, share)
     * @returns {Notification} Social notification
     */
    static createSocial(data, options = {}) {
        const { socialType = 'follow' } = options;
        const socialIcons = {
            follow: '👤',
            comment: '💬',
            like: '❤️',
            mention: '@',
            share: '↗️'
        };
        return new Notification({
            ...data,
            type: 'social',
            category: 'social',
            priority: 'low',
            icon: data.icon || socialIcons[socialType] || '👥',
            targetType: 'user',
            action: 'view_profile',
            severity: 'info',
            channel: 'in_app',
            senderType: 'user',
            tags: [socialType, 'social']
        });
    }

    /**
     * Create a follow notification
     * @param {Object} data - Notification data
     * @param {string} data.userId - Target user ID
     * @param {string} data.senderId - Follower user ID
     * @param {string} data.senderName - Follower name
     * @param {string} data.senderAvatar - Follower avatar
     * @returns {Notification} Follow notification
     */
    static createFollow(data) {
        return Notification.createSocial({
            ...data,
            title: 'New Follower',
            message: `${data.senderName || 'Someone'} started following you`,
            icon: '👤',
            action: 'view_profile',
            actionData: { userId: data.senderId },
            targetId: data.senderId,
            targetType: 'user'
        }, { socialType: 'follow' });
    }

    /**
     * Create a comment notification
     * @param {Object} data - Notification data
     * @param {string} data.userId - Target user ID
     * @param {string} data.senderId - Commenter user ID
     * @param {string} data.senderName - Commenter name
     * @param {string} data.senderAvatar - Commenter avatar
     * @param {string} data.targetId - Post/Product ID
     * @param {string} data.targetType - Post or Product
     * @param {string} data.comment - Comment text
     * @returns {Notification} Comment notification
     */
    static createComment(data) {
        return Notification.createSocial({
            ...data,
            title: 'New Comment',
            message: `${data.senderName || 'Someone'} commented: "${data.comment || ''}"`,
            icon: '💬',
            action: 'view_comment',
            actionData: { targetId: data.targetId, commentId: data.commentId },
            targetId: data.targetId,
            targetType: data.targetType || 'post'
        }, { socialType: 'comment' });
    }

    /**
     * Create a like notification
     * @param {Object} data - Notification data
     * @param {string} data.userId - Target user ID
     * @param {string} data.senderId - Liked user ID
     * @param {string} data.senderName - Liked name
     * @param {string} data.senderAvatar - Liked avatar
     * @param {string} data.targetId - Post/Product ID
     * @param {string} data.targetType - Post or Product
     * @returns {Notification} Like notification
     */
    static createLike(data) {
        return Notification.createSocial({
            ...data,
            title: 'New Like',
            message: `${data.senderName || 'Someone'} liked your ${data.targetType || 'post'}`,
            icon: '❤️',
            action: 'view_like',
            actionData: { targetId: data.targetId },
            targetId: data.targetId,
            targetType: data.targetType || 'post'
        }, { socialType: 'like' });
    }

    /**
     * Create a mention notification
     * @param {Object} data - Notification data
     * @param {string} data.userId - Target user ID
     * @param {string} data.senderId - Mentioned user ID
     * @param {string} data.senderName - Mentioned name
     * @param {string} data.targetId - Post/Product ID
     * @param {string} data.targetType - Post or Product
     * @param {string} data.context - Mention context
     * @returns {Notification} Mention notification
     */
    static createMention(data) {
        return Notification.createSocial({
            ...data,
            title: 'You were mentioned',
            message: `${data.senderName || 'Someone'} mentioned you in a ${data.targetType || 'post'}`,
            icon: '@',
            action: 'view_mention',
            actionData: { targetId: data.targetId, context: data.context },
            targetId: data.targetId,
            targetType: data.targetType || 'post'
        }, { socialType: 'mention' });
    }

    /**
     * Create a promotion notification
     * @param {Object} data - Notification data
     * @param {Object} options - Options
     * @param {boolean} options.highPriority - High priority
     * @returns {Notification} Promotion notification
     */
    static createPromotion(data, options = {}) {
        const { highPriority = false } = options;
        return new Notification({
            ...data,
            type: 'promotion',
            category: 'promotion',
            priority: highPriority ? 'high' : 'low',
            icon: data.icon || '🎉',
            severity: 'info',
            channel: 'in_app',
            tags: ['promotion', 'offer']
        });
    }

    /**
     * Create an alert notification
     * @param {Object} data - Notification data
     * @param {Object} options - Options
     * @param {boolean} options.critical - Critical alert
     * @returns {Notification} Alert notification
     */
    static createAlert(data, options = {}) {
        const { critical = false } = options;
        return new Notification({
            ...data,
            type: 'alert',
            category: 'alert',
            priority: critical ? 'urgent' : 'high',
            icon: data.icon || '⚠️',
            severity: critical ? 'critical' : 'warning',
            channel: 'all',
            sound: 'alert'
        });
    }

    /**
     * Create a reminder notification
     * @param {Object} data - Notification data
     * @param {Object} options - Options
     * @param {boolean} options.recurring - Recurring reminder
     * @returns {Notification} Reminder notification
     */
    static createReminder(data, options = {}) {
        const { recurring = false } = options;
        return new Notification({
            ...data,
            type: 'reminder',
            category: 'reminder',
            priority: 'medium',
            icon: data.icon || '⏰',
            severity: 'info',
            channel: 'in_app',
            isRecurring: recurring,
            tags: ['reminder']
        });
    }

    /**
     * Create an email notification
     * @param {Object} data - Notification data
     * @returns {Notification} Email notification
     */
    static createEmail(data) {
        return new Notification({
            ...data,
            type: 'system',
            category: 'email',
            priority: 'medium',
            severity: 'info',
            channel: 'email',
            icon: data.icon || '✉️'
        });
    }

    /**
     * Create a push notification
     * @param {Object} data - Notification data
     * @param {Object} options - Options
     * @param {boolean} options.highPriority - High priority
     * @returns {Notification} Push notification
     */
    static createPush(data, options = {}) {
        const { highPriority = false } = options;
        return new Notification({
            ...data,
            type: data.type || 'system',
            priority: highPriority ? 'high' : 'medium',
            severity: 'info',
            channel: 'push',
            icon: data.icon || '📱',
            sound: data.sound || 'default'
        });
    }

    /**
     * Create a notification from template
     * @param {string} templateName - Template name
     * @param {Object} data - Template data
     * @param {Object} options - Options
     * @returns {Notification} Notification instance
     */
    static fromTemplate(templateName, data = {}, options = {}) {
        const templates = {
            welcome: {
                title: 'Welcome to ZYMORE!',
                message: 'We\'re excited to have you on board. Start exploring amazing products!',
                icon: '🎉',
                category: 'system',
                priority: 'medium'
            },
            order_confirmation: {
                title: 'Order Confirmed',
                message: 'Your order has been confirmed and is being processed',
                icon: '🛒',
                category: 'order',
                priority: 'high'
            },
            order_shipped: {
                title: 'Order Shipped',
                message: 'Your order has been shipped and is on its way',
                icon: '📦',
                category: 'order',
                priority: 'high'
            },
            order_delivered: {
                title: 'Order Delivered',
                message: 'Your order has been delivered successfully',
                icon: '✅',
                category: 'order',
                priority: 'high'
            },
            product_uploaded: {
                title: 'Product Uploaded',
                message: 'Your product has been uploaded successfully and is now live',
                icon: '📤',
                category: 'product',
                priority: 'medium'
            },
            product_approved: {
                title: 'Product Approved',
                message: 'Your product has been approved and is now visible to everyone',
                icon: '✅',
                category: 'product',
                priority: 'medium'
            },
            product_rejected: {
                title: 'Product Rejected',
                message: 'Your product has been rejected. Please check the feedback',
                icon: '❌',
                category: 'product',
                priority: 'high'
            },
            new_follower: {
                title: 'New Follower',
                message: '{name} started following you',
                icon: '👤',
                category: 'social',
                priority: 'low'
            },
            new_comment: {
                title: 'New Comment',
                message: '{name} commented on your post',
                icon: '💬',
                category: 'social',
                priority: 'medium'
            },
            new_like: {
                title: 'New Like',
                message: '{name} liked your post',
                icon: '❤️',
                category: 'social',
                priority: 'low'
            },
            price_drop: {
                title: 'Price Drop Alert',
                message: 'A product you\'re interested in has dropped in price',
                icon: '💰',
                category: 'product',
                priority: 'high'
            },
            back_in_stock: {
                title: 'Back in Stock',
                message: 'A product you\'re interested in is back in stock',
                icon: '🔄',
                category: 'product',
                priority: 'high'
            },
            system_update: {
                title: 'System Update',
                message: 'A new update is available for the platform',
                icon: '⚙️',
                category: 'system',
                priority: 'medium'
            },
            security_alert: {
                title: 'Security Alert',
                message: 'We detected unusual activity on your account',
                icon: '🔒',
                category: 'security',
                priority: 'urgent'
            },
            promotion_offer: {
                title: 'Special Offer',
                message: 'Exclusive offer just for you',
                icon: '🎉',
                category: 'promotion',
                priority: 'low'
            }
        };

        const template = templates[templateName] || templates.system;
        const interpolatedData = { ...data };
        
        // Interpolate message with data
        let message = template.message;
        for (const [key, value] of Object.entries(data)) {
            message = message.replace(`{${key}}`, value);
        }

        return new Notification({
            ...template,
            ...data,
            message: message,
            template: templateName,
            templateData: data,
            ...options
        });
    }

    // ============================================
    // STATIC QUERY METHODS
    // ============================================

    /**
     * Filter notifications by type
     * @param {Array<Notification>} notifications - Notifications array
     * @param {string|Array<string>} types - Type(s) to filter
     * @returns {Array<Notification>} Filtered notifications
     */
    static filterByType(notifications, types) {
        if (!Array.isArray(types)) {
            types = [types];
        }
        return notifications.filter(n => types.includes(n.type));
    }

    /**
     * Filter notifications by category
     * @param {Array<Notification>} notifications - Notifications array
     * @param {string|Array<string>} categories - Category(ies) to filter
     * @returns {Array<Notification>} Filtered notifications
     */
    static filterByCategory(notifications, categories) {
        if (!Array.isArray(categories)) {
            categories = [categories];
        }
        return notifications.filter(n => categories.includes(n.category));
    }

    /**
     * Filter notifications by read status
     * @param {Array<Notification>} notifications - Notifications array
     * @param {boolean} isRead - Read status
     * @returns {Array<Notification>} Filtered notifications
     */
    static filterByReadStatus(notifications, isRead = false) {
        return notifications.filter(n => n.isRead === isRead);
    }

    /**
     * Filter notifications by priority
     * @param {Array<Notification>} notifications - Notifications array
     * @param {string|Array<string>} priorities - Priority(ies) to filter
     * @returns {Array<Notification>} Filtered notifications
     */
    static filterByPriority(notifications, priorities) {
        if (!Array.isArray(priorities)) {
            priorities = [priorities];
        }
        return notifications.filter(n => priorities.includes(n.priority));
    }

    /**
     * Filter notifications by status
     * @param {Array<Notification>} notifications - Notifications array
     * @param {string|Array<string>} statuses - Status(es) to filter
     * @returns {Array<Notification>} Filtered notifications
     */
    static filterByStatus(notifications, statuses) {
        if (!Array.isArray(statuses)) {
            statuses = [statuses];
        }
        return notifications.filter(n => statuses.includes(n.status));
    }

    /**
     * Filter notifications by tag
     * @param {Array<Notification>} notifications - Notifications array
     * @param {string} tag - Tag to filter
     * @returns {Array<Notification>} Filtered notifications
     */
    static filterByTag(notifications, tag) {
        return notifications.filter(n => n.hasTag(tag));
    }

    /**
     * Filter notifications by date range
     * @param {Array<Notification>} notifications - Notifications array
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Array<Notification>} Filtered notifications
     */
    static filterByDateRange(notifications, startDate, endDate) {
        return notifications.filter(n => {
            const date = n.createdAt;
            return date >= startDate && date <= endDate;
        });
    }

    /**
     * Filter notifications by user
     * @param {Array<Notification>} notifications - Notifications array
     * @param {string} userId - User ID
     * @returns {Array<Notification>} Filtered notifications
     */
    static filterByUser(notifications, userId) {
        return notifications.filter(n => n.userId === userId);
    }

    /**
     * Filter notifications by sender
     * @param {Array<Notification>} notifications - Notifications array
     * @param {string} senderId - Sender ID
     * @returns {Array<Notification>} Filtered notifications
     */
    static filterBySender(notifications, senderId) {
        return notifications.filter(n => n.senderId === senderId);
    }

    /**
     * Filter actionable notifications
     * @param {Array<Notification>} notifications - Notifications array
     * @param {boolean} actionable - Actionable status
     * @returns {Array<Notification>} Filtered notifications
     */
    static filterByActionable(notifications, actionable = true) {
        return notifications.filter(n => n.isActionable === actionable);
    }

    /**
     * Filter active notifications (not dismissed, not archived, not expired)
     * @param {Array<Notification>} notifications - Notifications array
     * @returns {Array<Notification>} Active notifications
     */
    static filterActive(notifications) {
        return notifications.filter(n => 
            !n.isDismissed && 
            !n.isArchived && 
            !n.isDeleted &&
            !n.isExpiredNotification()
        );
    }

    /**
     * Sort notifications by date
     * @param {Array<Notification>} notifications - Notifications array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<Notification>} Sorted notifications
     */
    static sortByDate(notifications, order = 'desc') {
        const sorted = [...notifications];
        sorted.sort((a, b) => {
            const aTime = a.createdAt.getTime();
            const bTime = b.createdAt.getTime();
            return order === 'asc' ? aTime - bTime : bTime - aTime;
        });
        return sorted;
    }

    /**
     * Sort notifications by priority
     * @param {Array<Notification>} notifications - Notifications array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<Notification>} Sorted notifications
     */
    static sortByPriority(notifications, order = 'desc') {
        const sorted = [...notifications];
        sorted.sort((a, b) => {
            const aLevel = a.getPriorityLevel();
            const bLevel = b.getPriorityLevel();
            return order === 'asc' ? aLevel - bLevel : bLevel - aLevel;
        });
        return sorted;
    }

    /**
     * Sort notifications by priority score
     * @param {Array<Notification>} notifications - Notifications array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<Notification>} Sorted notifications
     */
    static sortByPriorityScore(notifications, order = 'desc') {
        const sorted = [...notifications];
        sorted.sort((a, b) => {
            const aScore = a.priorityScore || 0;
            const bScore = b.priorityScore || 0;
            return order === 'asc' ? aScore - bScore : bScore - aScore;
        });
        return sorted;
    }

    /**
     * Get unread count
     * @param {Array<Notification>} notifications - Notifications array
     * @returns {number} Unread count
     */
    static getUnreadCount(notifications) {
        return notifications.filter(n => !n.isRead).length;
    }

    /**
     * Get pinned notifications
     * @param {Array<Notification>} notifications - Notifications array
     * @returns {Array<Notification>} Pinned notifications
     */
    static getPinned(notifications) {
        return notifications.filter(n => n.isPinned);
    }

    /**
     * Get recent notifications (last N days)
     * @param {Array<Notification>} notifications - Notifications array
     * @param {number} days - Number of days
     * @returns {Array<Notification>} Recent notifications
     */
    static getRecent(notifications, days = 7) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return notifications.filter(n => n.createdAt >= cutoff);
    }

    /**
     * Get today's notifications
     * @param {Array<Notification>} notifications - Notifications array
     * @returns {Array<Notification>} Today's notifications
     */
    static getToday(notifications) {
        return notifications.filter(n => n.isToday());
    }

    /**
     * Get notifications by date group
     * @param {Array<Notification>} notifications - Notifications array
     * @param {string} groupBy - 'day', 'week', 'month'
     * @returns {Object} Grouped by date
     */
    static groupByDate(notifications, groupBy = 'day') {
        const groups = {};
        for (const notification of notifications) {
            let key;
            switch (groupBy) {
                case 'week':
                    const weekStart = new Date(notification.createdAt);
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    key = weekStart.toDateString();
                    break;
                case 'month':
                    key = `${notification.createdAt.getFullYear()}-${notification.createdAt.getMonth() + 1}`;
                    break;
                default:
                    key = notification.createdAt.toDateString();
            }
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(notification);
        }
        return groups;
    }

    /**
     * Group notifications by category
     * @param {Array<Notification>} notifications - Notifications array
     * @returns {Object} Grouped by category
     */
    static groupByCategory(notifications) {
        const groups = {};
        for (const notification of notifications) {
            const key = notification.category || 'uncategorized';
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(notification);
        }
        return groups;
    }

    /**
     * Group notifications by type
     * @param {Array<Notification>} notifications - Notifications array
     * @returns {Object} Grouped by type
     */
    static groupByType(notifications) {
        const groups = {};
        for (const notification of notifications) {
            const key = notification.type;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(notification);
        }
        return groups;
    }

    /**
     * Group notifications by group ID
     * @param {Array<Notification>} notifications - Notifications array
     * @returns {Object} Grouped by group ID
     */
    static groupByGroupId(notifications) {
        const groups = {};
        for (const notification of notifications) {
            const key = notification.groupId || notification.id;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(notification);
        }
        return groups;
    }

    /**
     * Mark all as read
     * @param {Array<Notification>} notifications - Notifications array
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Array<Notification>} Updated notifications
     */
    static markAllAsRead(notifications, options = {}) {
        return notifications.map(n => n.markAsRead(options));
    }

    /**
     * Mark all as seen
     * @param {Array<Notification>} notifications - Notifications array
     * @param {Object} options - Options
     * @param {boolean} options.emitEvent - Emit event
     * @returns {Array<Notification>} Updated notifications
     */
    static markAllAsSeen(notifications, options = {}) {
        return notifications.map(n => n.markAsSeen(options));
    }

    /**
     * Delete all read notifications
     * @param {Array<Notification>} notifications - Notifications array
     * @param {Object} options - Options
     * @param {boolean} options.hardDelete - Hard delete
     * @returns {Array<Notification>} Remaining notifications
     */
    static deleteAllRead(notifications, options = {}) {
        const { hardDelete = false } = options;
        if (hardDelete) {
            return notifications.filter(n => !n.isRead);
        } else {
            return notifications.map(n => {
                if (n.isRead) {
                    n.isDeleted = true;
                    n.updatedAt = new Date();
                }
                return n;
            });
        }
    }

    /**
     * Delete all expired notifications
     * @param {Array<Notification>} notifications - Notifications array
     * @param {Object} options - Options
     * @param {boolean} options.hardDelete - Hard delete
     * @returns {Array<Notification>} Remaining notifications
     */
    static deleteAllExpired(notifications, options = {}) {
        const { hardDelete = false } = options;
        if (hardDelete) {
            return notifications.filter(n => !n.isExpiredNotification());
        } else {
            return notifications.map(n => {
                if (n.isExpiredNotification()) {
                    n.isDeleted = true;
                    n.updatedAt = new Date();
                }
                return n;
            });
        }
    }

    // ============================================
    // STATIC HELPERS
    // ============================================

    /**
     * Check if data is a valid notification object
     * @param {Object} data - Data to check
     * @returns {boolean} True if valid notification data
     */
    static isValidNotificationData(data) {
        return data && typeof data === 'object' &&
               data.userId && data.userId.trim() !== '' &&
               data.title && data.title.trim() !== '' &&
               (data.message || data.body);
    }

    /**
     * Create an array of notifications from Firestore data
     * @param {Array} dataArray - Array of Firestore documents
     * @returns {Array<Notification>} Array of Notification instances
     */
    static fromFirestoreArray(dataArray) {
        if (!Array.isArray(dataArray)) return [];
        return dataArray.map(data => Notification.fromFirestore(data, data.id));
    }

    /**
     * Create an array of notifications from JSON data
     * @param {Array} dataArray - Array of JSON objects
     * @returns {Array<Notification>} Array of Notification instances
     */
    static fromJSONArray(dataArray) {
        if (!Array.isArray(dataArray)) return [];
        return dataArray.map(data => new Notification(data));
    }

    /**
     * Merge duplicate notifications into groups
     * @param {Array<Notification>} notifications - Notifications array
     * @param {string} groupBy - 'groupId', 'type', 'category'
     * @param {Function} mergeFn - Custom merge function
     * @returns {Array<Notification>} Merged notifications
     */
    static mergeGroups(notifications, groupBy = 'groupId', mergeFn = null) {
        const groups = {};
        
        for (const notification of notifications) {
            let key;
            switch (groupBy) {
                case 'type':
                    key = notification.type;
                    break;
                case 'category':
                    key = notification.category || 'uncategorized';
                    break;
                default:
                    key = notification.groupId || notification.id;
            }
            
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(notification);
        }

        const result = [];
        for (const [key, group] of Object.entries(groups)) {
            if (group.length === 1) {
                result.push(group[0]);
            } else {
                // Merge group
                const first = group[0];
                if (mergeFn) {
                    result.push(mergeFn(group));
                } else {
                    // Default merge: keep first, increment count
                    const merged = first.clone({ keepId: true, keepTimestamps: true, keepStats: true });
                    merged.groupCount = group.length;
                    merged.message = `${first.message} (+${group.length - 1} more)`;
                    merged.updatedAt = new Date();
                    result.push(merged);
                }
            }
        }
        
        return result;
    }
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default Notification;


/**
 * Helpers to match index.js expectation for Notification
 */
export function createNotification(data) {
    return new Notification(data);
}

export function validateNotification(data) {
    const notification = data instanceof Notification ? data : new Notification(data);
    return notification.validate ? notification.validate() : { isValid: true };
}

export function notificationToFirestore(notification) {
    if (notification && typeof notification.toFirestore === 'function') {
        return notification.toFirestore();
    }
    return notification;
}

export function firestoreToNotification(doc) {
    if (!doc) return null;
    const data = typeof doc.data === 'function' ? doc.data() : doc;
    const id = typeof doc.id === 'string' ? doc.id : data.id;
    if (typeof Notification.fromFirestore === 'function') {
        return Notification.fromFirestore(data, id);
    }
    return new Notification({ ...data, id });
}
// ============================================================
// END OF FILE: notification-model.js
// ============================================================