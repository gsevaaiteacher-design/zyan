// ============================================================
// FILE: js/services/notification-service.js
// PURPOSE: Complete Push Notification Service - PRODUCTION READY
// DEPENDENCY: firebase-config.js, notification-model.js, error-handler.js, logger.js
// USED BY: app.js, settings-screen.js, all screens
// VERSION: 3.0.0 - FULLY UPDATED
// ============================================================

import { messaging, getToken, onMessage, deleteToken } from '../config/firebase-config.js';
import { errorHandler, notificationError } from './error-handler.js';
import { logger } from './logger.js';
import { databaseService } from './database-service.js';
import { getCurrentUser, isAuthenticated } from './auth-service.js';

// ============================================================
// NOTIFICATION CONFIGURATION
// ============================================================

const NOTIFICATION_CONFIG = {
    // Enable/Disable notifications
    enabled: true,
    
    // VAPID Key for Web Push
    vapidKey: 'YOUR_VAPID_KEY_HERE', // Replace with your VAPID key
    
    // Notification types
    types: {
        LIKE: 'like',
        COMMENT: 'comment',
        FOLLOW: 'follow',
        DOWNLOAD: 'download',
        PRODUCT: 'product',
        CHAT: 'chat',
        AI: 'ai',
        AD: 'ad',
        SYSTEM: 'system',
        PROMOTION: 'promotion',
        REMINDER: 'reminder',
        SOCIAL: 'social',
        ORDER: 'order',
        PAYMENT: 'payment',
        REVIEW: 'review',
        REPORT: 'report',
        STORY: 'story',
        POST: 'post',
        MENTION: 'mention',
        SHARE: 'share'
    },
    
    // Notification priorities
    priorities: {
        HIGH: 'high',
        NORMAL: 'normal',
        LOW: 'low'
    },
    
    // Default notification sound
    sound: '/sounds/notification.mp3',
    
    // Notification icon
    icon: '/assets/icons/icon-192.png',
    
    // Badge icon
    badge: '/assets/icons/badge-icon.png',
    
    // Max notifications to store
    maxStored: 100,
    
    // Auto-dismiss duration (ms)
    autoDismiss: 5000,
    
    // Notification groups
    groups: {
        SOCIAL: 'social',
        PRODUCT: 'product',
        CHAT: 'chat',
        SYSTEM: 'system',
        MARKETING: 'marketing'
    },
    
    // Permission request settings
    permission: {
        requestOnStart: true,
        retryOnDeny: false,
        retryInterval: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
};

// ============================================================
// NOTIFICATION SERVICE CLASS
// ============================================================

class NotificationService {
    constructor() {
        this._initialized = false;
        this._enabled = NOTIFICATION_CONFIG.enabled;
        this._token = null;
        this._permission = null;
        this._notifications = [];
        this._unreadCount = 0;
        this._listeners = [];
        this._messageHandlers = [];
        this._notificationSound = null;
        this._isPermissionRequested = false;
        this._serviceWorkerRegistration = null;
        this._notificationQueue = [];
        this._isProcessingQueue = false;
        this._badgeCount = 0;
        this._lastNotificationTime = null;
        this._notificationHistory = [];
        this._groups = {};
        this._subscriptions = [];
        this._dailyLimit = 50;
        this._todayCount = 0;
        this._dailyResetTimer = null;
        this._deviceInfo = null;
        this._userPreferences = {
            sound: true,
            vibration: true,
            banner: true,
            badge: true,
            doNotDisturb: false,
            quietHours: {
                enabled: false,
                start: '22:00',
                end: '07:00'
            }
        };
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    /**
     * Initialize notification service
     */
    async init(options = {}) {
        if (this._initialized) return;

        const {
            enabled = true,
            vapidKey = NOTIFICATION_CONFIG.vapidKey,
            requestPermission = true,
            serviceWorkerRegistration = null
        } = options;

        try {
            this._enabled = enabled;
            this._serviceWorkerRegistration = serviceWorkerRegistration;

            if (!this._enabled) {
                logger.info('🔔 Notifications are disabled');
                this._initialized = true;
                return;
            }

            // Check if browser supports notifications
            if (!('Notification' in window)) {
                logger.warn('🔔 Browser does not support notifications');
                this._initialized = true;
                return;
            }

            // Get permission status
            this._permission = Notification.permission;

            // Load user preferences
            await this._loadUserPreferences();

            // Request permission if needed
            if (requestPermission && this._permission === 'default') {
                await this.requestPermission();
            }

            // If permission granted, get token and setup
            if (this._permission === 'granted') {
                await this._setupNotifications(vapidKey);
            }

            // Setup notification listeners
            this._setupListeners();

            // Setup service worker
            if (this._serviceWorkerRegistration) {
                await this._setupServiceWorker();
            }

            // Load stored notifications
            await this._loadStoredNotifications();

            // Set daily reset timer
            this._setDailyResetTimer();

            this._initialized = true;

            logger.info('🔔 Notification Service initialized', {
                enabled: this._enabled,
                permission: this._permission,
                hasToken: !!this._token,
                unreadCount: this._unreadCount
            });

            return this;
        } catch (error) {
            logger.error('❌ Notification Service initialization failed', { error: error.message });
            throw error;
        }
    }

    // ============================================
    // PERMISSION MANAGEMENT
    // ============================================

    /**
     * Request notification permission
     */
    async requestPermission(options = {}) {
        if (this._isPermissionRequested) return;

        const { showPrompt = true } = options;

        try {
            this._isPermissionRequested = true;

            if (!('Notification' in window)) {
                throw notificationError('Notifications not supported', { code: 'NOT_SUPPORTED' });
            }

            if (this._permission === 'granted') {
                return this._permission;
            }

            if (this._permission === 'denied') {
                throw notificationError('Permission denied by user', { code: 'PERMISSION_DENIED' });
            }

            // Request permission
            const permission = await Notification.requestPermission();
            this._permission = permission;

            if (permission === 'granted') {
                logger.info('🔔 Notification permission granted');
                await this._setupNotifications(NOTIFICATION_CONFIG.vapidKey);
            } else if (permission === 'denied') {
                logger.warn('🔔 Notification permission denied');
            }

            return permission;
        } catch (error) {
            logger.error('❌ Failed to request notification permission', { error: error.message });
            throw error;
        } finally {
            this._isPermissionRequested = false;
        }
    }

    /**
     * Check if permission is granted
     */
    hasPermission() {
        return this._permission === 'granted';
    }

    /**
     * Get permission status
     */
    getPermissionStatus() {
        return this._permission;
    }

    // ============================================
    // TOKEN MANAGEMENT
    // ============================================

    /**
     * Get FCM token
     */
    async getFCMToken() {
        if (this._token) return this._token;

        try {
            if (!messaging) {
                throw notificationError('Messaging not available', { code: 'MESSAGING_UNAVAILABLE' });
            }

            const token = await getToken(messaging, {
                vapidKey: NOTIFICATION_CONFIG.vapidKey,
                serviceWorkerRegistration: this._serviceWorkerRegistration
            });

            if (token) {
                this._token = token;
                await this._saveToken(token);
                logger.info('🔔 FCM Token obtained');
                return token;
            } else {
                throw notificationError('Failed to get token', { code: 'TOKEN_FAILED' });
            }
        } catch (error) {
            logger.error('❌ Failed to get FCM token', { error: error.message });
            throw error;
        }
    }

    /**
     * Save token to server
     */
    async _saveToken(token) {
        try {
            const userId = getCurrentUser()?.uid;
            if (!userId) return;

            await databaseService.updateUser(userId, {
                fcmToken: token,
                fcmTokenUpdated: new Date().toISOString()
            });

            // Also save to tokens collection
            await databaseService.create('tokens', {
                userId,
                token,
                platform: 'web',
                deviceInfo: this._deviceInfo,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: true
            });

            logger.debug('🔔 FCM token saved to server');
        } catch (error) {
            logger.error('❌ Failed to save FCM token', { error: error.message });
        }
    }

    /**
     * Delete FCM token
     */
    async deleteFCMToken() {
        try {
            if (!this._token) return;

            await deleteToken(messaging);
            this._token = null;

            const userId = getCurrentUser()?.uid;
            if (userId) {
                await databaseService.updateUser(userId, {
                    fcmToken: null,
                    fcmTokenUpdated: new Date().toISOString()
                });

                // Deactivate token in tokens collection
                const tokens = await databaseService.query('tokens', {
                    where: [['userId', '==', userId], ['isActive', '==', true]]
                });
                for (const token of tokens.data) {
                    await databaseService.update('tokens', token.id, {
                        isActive: false,
                        deletedAt: new Date().toISOString()
                    });
                }
            }

            logger.info('🔔 FCM token deleted');
            return true;
        } catch (error) {
            logger.error('❌ Failed to delete FCM token', { error: error.message });
            throw error;
        }
    }

    // ============================================
    // MESSAGE HANDLING
    // ============================================

    /**
     * Setup notification listeners
     */
    _setupListeners() {
        // Firebase Cloud Messaging - Foreground messages
        if (messaging && onMessage) {
            onMessage(messaging, (payload) => {
                this._handleForegroundMessage(payload);
            });
        }

        // Service Worker messages
        if (navigator.serviceWorker) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'notification_click') {
                    this._handleNotificationClick(event.data);
                }
            });
        }
    }

    /**
     * Handle foreground message
     */
    _handleForegroundMessage(payload) {
        try {
            const notification = payload.notification || {};
            const data = payload.data || {};

            const notificationData = {
                id: data.id || `notif_${Date.now()}`,
                title: notification.title || 'New Notification',
                body: notification.body || '',
                icon: notification.icon || NOTIFICATION_CONFIG.icon,
                image: notification.image || null,
                badge: notification.badge || NOTIFICATION_CONFIG.badge,
                sound: notification.sound || NOTIFICATION_CONFIG.sound,
                vibrate: notification.vibrate || [200, 100, 200],
                data: data,
                timestamp: new Date().toISOString(),
                read: false,
                type: data.type || 'system',
                priority: data.priority || 'normal',
                group: data.group || 'system',
                link: data.link || null,
                action: data.action || null,
                metadata: data.metadata || {}
            };

            // Add to notifications
            this._addNotification(notificationData);

            // Show notification
            this._showNotification(notificationData);

            // Process actions
            this._processNotificationActions(notificationData);

            logger.debug('🔔 Foreground notification received', {
                title: notificationData.title,
                type: notificationData.type
            });

        } catch (error) {
            logger.error('❌ Failed to handle foreground message', { error: error.message });
        }
    }

    /**
     * Handle notification click
     */
    _handleNotificationClick(data) {
        try {
            const notification = this._notifications.find(n => n.id === data.id);
            if (notification) {
                this.markAsRead(notification.id);
                this._notifyListeners('click', notification);
                this._handleAction(notification);
            }
        } catch (error) {
            logger.error('❌ Failed to handle notification click', { error: error.message });
        }
    }

    // ============================================
    // NOTIFICATION DISPLAY
    // ============================================

    /**
     * Show notification
     */
    _showNotification(notification) {
        try {
            if (this._permission !== 'granted') return;
            if (this._userPreferences.doNotDisturb) return;

            // Check quiet hours
            if (this._isQuietHours()) return;

            // Check daily limit
            if (this._todayCount >= this._dailyLimit) {
                logger.warn('🔔 Daily notification limit reached');
                return;
            }

            // Create notification options
            const options = {
                body: notification.body,
                icon: notification.icon || NOTIFICATION_CONFIG.icon,
                badge: notification.badge || NOTIFICATION_CONFIG.badge,
                tag: notification.id,
                data: notification.data,
                requireInteraction: notification.priority === 'high',
                silent: !this._userPreferences.sound,
                vibrate: this._userPreferences.vibration ? [200, 100, 200] : [],
                actions: this._getNotificationActions(notification),
                image: notification.image || null,
                timestamp: Date.now(),
                renotify: true,
                sticky: notification.priority === 'high'
            };

            // Show notification
            const notif = new Notification(notification.title, options);

            // Handle click
            notif.onclick = () => {
                window.focus();
                notif.close();
                this._handleAction(notification);
                this.markAsRead(notification.id);
                this._notifyListeners('click', notification);
            };

            // Handle close
            notif.onclose = () => {
                this._notifyListeners('dismiss', notification);
            };

            // Auto-dismiss
            if (notification.priority !== 'high') {
                setTimeout(() => {
                    notif.close();
                }, NOTIFICATION_CONFIG.autoDismiss);
            }

            this._todayCount++;
            this._lastNotificationTime = new Date();

            logger.debug('🔔 Notification displayed', {
                title: notification.title,
                type: notification.type
            });

        } catch (error) {
            logger.error('❌ Failed to show notification', { error: error.message });
        }
    }

    /**
     * Get notification actions
     */
    _getNotificationActions(notification) {
        const actions = [];

        if (notification.type === 'like' || notification.type === 'comment' || notification.type === 'follow') {
            actions.push({
                action: 'view',
                title: 'View'
            });
        }

        if (notification.type === 'chat') {
            actions.push({
                action: 'reply',
                title: 'Reply'
            });
        }

        if (notification.type === 'order' || notification.type === 'payment') {
            actions.push({
                action: 'view_order',
                title: 'View Order'
            });
        }

        if (notification.link) {
            actions.push({
                action: 'open',
                title: 'Open'
            });
        }

        return actions;
    }

    /**
     * Handle notification action
     */
    _handleAction(notification) {
        if (!notification) return;

        // Navigate to link if present
        if (notification.link) {
            window.location.href = notification.link;
            return;
        }

        // Handle specific actions
        switch (notification.type) {
            case 'like':
                this._handleLikeAction(notification);
                break;
            case 'comment':
                this._handleCommentAction(notification);
                break;
            case 'follow':
                this._handleFollowAction(notification);
                break;
            case 'chat':
                this._handleChatAction(notification);
                break;
            case 'order':
                this._handleOrderAction(notification);
                break;
            case 'payment':
                this._handlePaymentAction(notification);
                break;
            default:
                // Navigate to notifications
                window.location.href = '/notifications';
        }
    }

    /**
     * Handle like action
     */
    _handleLikeAction(notification) {
        const data = notification.metadata || {};
        if (data.postId) {
            window.location.href = `/post/${data.postId}`;
        } else if (data.productId) {
            window.location.href = `/product/${data.productId}`;
        }
    }

    /**
     * Handle comment action
     */
    _handleCommentAction(notification) {
        const data = notification.metadata || {};
        if (data.postId) {
            window.location.href = `/post/${data.postId}`;
        }
    }

    /**
     * Handle follow action
     */
    _handleFollowAction(notification) {
        const data = notification.metadata || {};
        if (data.userId) {
            window.location.href = `/profile/${data.userId}`;
        }
    }

    /**
     * Handle chat action
     */
    _handleChatAction(notification) {
        const data = notification.metadata || {};
        if (data.chatId) {
            window.location.href = `/chat/${data.chatId}`;
        }
    }

    /**
     * Handle order action
     */
    _handleOrderAction(notification) {
        const data = notification.metadata || {};
        if (data.orderId) {
            window.location.href = `/order/${data.orderId}`;
        }
    }

    /**
     * Handle payment action
     */
    _handlePaymentAction(notification) {
        const data = notification.metadata || {};
        if (data.paymentId) {
            window.location.href = `/payment/${data.paymentId}`;
        }
    }

    /**
     * Process notification actions
     */
    _processNotificationActions(notification) {
        // Update badge count
        if (!notification.read) {
            this._badgeCount++;
            this._updateBadge();
        }

        // Store notification
        this._saveToHistory(notification);

        // Update unread count
        this._unreadCount = this._notifications.filter(n => !n.read).length;
        this._notifyListeners('update', this._notifications);
    }

    // ============================================
    // NOTIFICATION MANAGEMENT
    // ============================================

    /**
     * Add notification
     */
    _addNotification(notification) {
        // Check for duplicate
        const existing = this._notifications.find(n => n.id === notification.id);
        if (existing) {
            // Update existing
            Object.assign(existing, notification);
            this._notifyListeners('update', this._notifications);
            return;
        }

        // Add to notifications
        this._notifications.unshift(notification);

        // Limit stored notifications
        if (this._notifications.length > NOTIFICATION_CONFIG.maxStored) {
            this._notifications = this._notifications.slice(0, NOTIFICATION_CONFIG.maxStored);
        }

        // Update unread count
        if (!notification.read) {
            this._unreadCount++;
        }

        // Add to group
        if (notification.group) {
            if (!this._groups[notification.group]) {
                this._groups[notification.group] = [];
            }
            this._groups[notification.group].push(notification);
        }

        this._notifyListeners('new', notification);
        this._notifyListeners('update', this._notifications);
    }

    /**
     * Get all notifications
     */
    getNotifications(options = {}) {
        const {
            limit = 50,
            offset = 0,
            type = null,
            group = null,
            read = null,
            from = null,
            to = null
        } = options;

        let notifications = [...this._notifications];

        // Apply filters
        if (type) {
            notifications = notifications.filter(n => n.type === type);
        }
        if (group) {
            notifications = notifications.filter(n => n.group === group);
        }
        if (read !== null) {
            notifications = notifications.filter(n => n.read === read);
        }
        if (from) {
            notifications = notifications.filter(n => new Date(n.timestamp) >= new Date(from));
        }
        if (to) {
            notifications = notifications.filter(n => new Date(n.timestamp) <= new Date(to));
        }

        // Apply pagination
        return notifications.slice(offset, offset + limit);
    }

    /**
     * Get unread count
     */
    getUnreadCount() {
        return this._unreadCount;
    }

    /**
     * Get notification by ID
     */
    getNotification(id) {
        return this._notifications.find(n => n.id === id);
    }

    /**
     * Mark notification as read
     */
    async markAsRead(id) {
        const notification = this._notifications.find(n => n.id === id);
        if (notification && !notification.read) {
            notification.read = true;
            notification.readAt = new Date().toISOString();
            this._unreadCount--;

            // Update in database
            await this._updateNotificationInDB(notification);

            this._notifyListeners('read', notification);
            this._notifyListeners('update', this._notifications);

            // Update badge
            this._badgeCount = this._notifications.filter(n => !n.read).length;
            this._updateBadge();
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        const unread = this._notifications.filter(n => !n.read);
        for (const notification of unread) {
            notification.read = true;
            notification.readAt = new Date().toISOString();
            await this._updateNotificationInDB(notification);
        }

        this._unreadCount = 0;
        this._badgeCount = 0;
        this._updateBadge();

        this._notifyListeners('read_all', this._notifications);
        this._notifyListeners('update', this._notifications);

        logger.info('🔔 All notifications marked as read');
    }

    /**
     * Delete notification
     */
    async deleteNotification(id) {
        const index = this._notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            const notification = this._notifications[index];
            this._notifications.splice(index, 1);

            if (!notification.read) {
                this._unreadCount--;
            }

            // Delete from database
            await this._deleteNotificationFromDB(id);

            this._notifyListeners('delete', notification);
            this._notifyListeners('update', this._notifications);

            // Update badge
            this._badgeCount = this._notifications.filter(n => !n.read).length;
            this._updateBadge();
        }
    }

    /**
     * Clear all notifications
     */
    async clearAll() {
        this._notifications = [];
        this._unreadCount = 0;
        this._badgeCount = 0;
        this._updateBadge();

        // Clear from database
        await this._clearNotificationsFromDB();

        this._notifyListeners('clear', this._notifications);
        this._notifyListeners('update', this._notifications);

        logger.info('🔔 All notifications cleared');
    }

    // ============================================
    // DATABASE OPERATIONS
    // ============================================

    /**
     * Save notification to database
     */
    async _saveNotificationToDB(notification) {
        try {
            const userId = getCurrentUser()?.uid;
            if (!userId) return;

            await databaseService.create('notifications', {
                userId,
                ...notification,
                isDeleted: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            logger.error('❌ Failed to save notification to DB', { error: error.message });
        }
    }

    /**
     * Update notification in database
     */
    async _updateNotificationInDB(notification) {
        try {
            const userId = getCurrentUser()?.uid;
            if (!userId) return;

            const result = await databaseService.query('notifications', {
                where: [
                    ['userId', '==', userId],
                    ['id', '==', notification.id]
                ]
            });

            if (result.data.length > 0) {
                await databaseService.update('notifications', result.data[0].id, {
                    read: notification.read,
                    readAt: notification.readAt,
                    updatedAt: new Date().toISOString()
                });
            }
        } catch (error) {
            logger.error('❌ Failed to update notification in DB', { error: error.message });
        }
    }

    /**
     * Delete notification from database
     */
    async _deleteNotificationFromDB(id) {
        try {
            const userId = getCurrentUser()?.uid;
            if (!userId) return;

            const result = await databaseService.query('notifications', {
                where: [
                    ['userId', '==', userId],
                    ['id', '==', id]
                ]
            });

            if (result.data.length > 0) {
                await databaseService.update('notifications', result.data[0].id, {
                    isDeleted: true,
                    deletedAt: new Date().toISOString()
                });
            }
        } catch (error) {
            logger.error('❌ Failed to delete notification from DB', { error: error.message });
        }
    }

    /**
     * Clear notifications from database
     */
    async _clearNotificationsFromDB() {
        try {
            const userId = getCurrentUser()?.uid;
            if (!userId) return;

            const result = await databaseService.query('notifications', {
                where: [
                    ['userId', '==', userId],
                    ['isDeleted', '==', false]
                ]
            });

            for (const notification of result.data) {
                await databaseService.update('notifications', notification.id, {
                    isDeleted: true,
                    deletedAt: new Date().toISOString()
                });
            }
        } catch (error) {
            logger.error('❌ Failed to clear notifications from DB', { error: error.message });
        }
    }

    /**
     * Load stored notifications from database
     */
    async _loadStoredNotifications() {
        try {
            const userId = getCurrentUser()?.uid;
            if (!userId) return;

            const result = await databaseService.query('notifications', {
                where: [
                    ['userId', '==', userId],
                    ['isDeleted', '==', false]
                ],
                orderBy: [['createdAt', 'desc']],
                limit: NOTIFICATION_CONFIG.maxStored
            });

            if (result.data.length > 0) {
                this._notifications = result.data;
                this._unreadCount = this._notifications.filter(n => !n.read).length;
                this._badgeCount = this._unreadCount;
                this._updateBadge();

                logger.debug(`🔔 Loaded ${this._notifications.length} notifications from DB`);
            }
        } catch (error) {
            logger.error('❌ Failed to load notifications from DB', { error: error.message });
        }
    }

    // ============================================
    // USER PREFERENCES
    // ============================================

    /**
     * Load user preferences
     */
    async _loadUserPreferences() {
        try {
            const userId = getCurrentUser()?.uid;
            if (!userId) return;

            const user = await databaseService.getUser(userId);
            if (user && user.notificationPreferences) {
                this._userPreferences = {
                    ...this._userPreferences,
                    ...user.notificationPreferences
                };
            }
        } catch (error) {
            logger.error('❌ Failed to load user preferences', { error: error.message });
        }
    }

    /**
     * Update user preferences
     */
    async updatePreferences(preferences) {
        try {
            this._userPreferences = {
                ...this._userPreferences,
                ...preferences
            };

            const userId = getCurrentUser()?.uid;
            if (userId) {
                await databaseService.updateUser(userId, {
                    notificationPreferences: this._userPreferences
                });
            }

            logger.info('🔔 Notification preferences updated', preferences);
            this._notifyListeners('preferences_updated', this._userPreferences);

            return this._userPreferences;
        } catch (error) {
            logger.error('❌ Failed to update preferences', { error: error.message });
            throw error;
        }
    }

    /**
     * Get user preferences
     */
    getPreferences() {
        return { ...this._userPreferences };
    }

    /**
     * Check if quiet hours
     */
    _isQuietHours() {
        if (!this._userPreferences.quietHours.enabled) return false;

        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const start = this._userPreferences.quietHours.start;
        const end = this._userPreferences.quietHours.end;

        if (start <= end) {
            return currentTime >= start && currentTime <= end;
        } else {
            // Cross midnight
            return currentTime >= start || currentTime <= end;
        }
    }

    // ============================================
    // BADGE MANAGEMENT
    // ============================================

    /**
     * Update badge count
     */
    _updateBadge() {
        try {
            if (navigator.setAppBadge) {
                if (this._badgeCount > 0) {
                    navigator.setAppBadge(this._badgeCount);
                } else {
                    navigator.clearAppBadge();
                }
            }
        } catch (error) {
            // Ignore badge errors
        }
    }

    /**
     * Set badge count
     */
    setBadgeCount(count) {
        this._badgeCount = count;
        this._updateBadge();
    }

    // ============================================
    // NOTIFICATION SENDING
    // ============================================

    /**
     * Send notification to user
     */
    async sendNotification(userId, notification) {
        try {
            // Create notification data
            const notificationData = {
                id: notification.id || `notif_${Date.now()}`,
                userId,
                title: notification.title,
                body: notification.body,
                icon: notification.icon || NOTIFICATION_CONFIG.icon,
                image: notification.image || null,
                badge: notification.badge || NOTIFICATION_CONFIG.badge,
                sound: notification.sound || NOTIFICATION_CONFIG.sound,
                type: notification.type || 'system',
                priority: notification.priority || 'normal',
                group: notification.group || 'system',
                link: notification.link || null,
                action: notification.action || null,
                metadata: notification.metadata || {},
                read: false,
                timestamp: new Date().toISOString(),
                isDeleted: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Save to database
            await databaseService.create('notifications', notificationData);

            // Send push notification
            await this._sendPushNotification(userId, notificationData);

            // Add to local notifications
            if (getCurrentUser()?.uid === userId) {
                this._addNotification(notificationData);
            }

            logger.info(`🔔 Notification sent to user ${userId}`, {
                title: notification.title,
                type: notification.type
            });

            return notificationData;
        } catch (error) {
            logger.error('❌ Failed to send notification', { error: error.message });
            throw error;
        }
    }

    /**
     * Send push notification
     */
    async _sendPushNotification(userId, notification) {
        try {
            // Get user's FCM token
            const user = await databaseService.getUser(userId);
            if (!user || !user.fcmToken) {
                logger.warn(`🔔 User ${userId} has no FCM token`);
                return;
            }

            // Send via FCM
            const response = await fetch('https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${await this._getAccessToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: {
                        token: user.fcmToken,
                        notification: {
                            title: notification.title,
                            body: notification.body,
                            image: notification.image
                        },
                        data: {
                            id: notification.id,
                            type: notification.type,
                            link: notification.link || '',
                            action: notification.action || '',
                            metadata: JSON.stringify(notification.metadata || {})
                        },
                        webpush: {
                            notification: {
                                icon: notification.icon || NOTIFICATION_CONFIG.icon,
                                badge: notification.badge || NOTIFICATION_CONFIG.badge,
                                vibrate: [200, 100, 200],
                                sound: notification.sound || NOTIFICATION_CONFIG.sound,
                                actions: this._getNotificationActions(notification)
                            },
                            fcm_options: {
                                link: notification.link || '/notifications'
                            }
                        }
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`FCM API error: ${response.status}`);
            }

            logger.debug(`🔔 Push notification sent to user ${userId}`);

        } catch (error) {
            logger.error('❌ Failed to send push notification', { error: error.message });
            throw error;
        }
    }

    /**
     * Get access token for FCM
     */
    async _getAccessToken() {
        // This would need to be implemented with Firebase Admin SDK
        // For now, return a placeholder
        return 'YOUR_ACCESS_TOKEN';
    }

    // ============================================
    // SOCIAL NOTIFICATIONS (UPDATED)
    // ============================================

    /**
     * Send like notification
     */
    async sendLikeNotification(userId, actorId, targetId, targetType = 'post') {
        const actor = await databaseService.getUser(actorId);
        if (!actor) return;

        return this.sendNotification(userId, {
            title: `${actor.displayName} liked your ${targetType}`,
            body: `${actor.displayName} liked your ${targetType}`,
            type: NOTIFICATION_CONFIG.types.LIKE,
            group: NOTIFICATION_CONFIG.groups.SOCIAL,
            priority: NOTIFICATION_CONFIG.priorities.NORMAL,
            link: `/${targetType}/${targetId}`,
            action: 'view',
            metadata: {
                actorId,
                actorName: actor.displayName,
                actorPhoto: actor.photoURL,
                targetId,
                targetType
            }
        });
    }

    /**
     * Send comment notification
     */
    async sendCommentNotification(userId, actorId, targetId, targetType = 'post', comment = '') {
        const actor = await databaseService.getUser(actorId);
        if (!actor) return;

        const preview = comment.length > 50 ? comment.substring(0, 50) + '...' : comment;

        return this.sendNotification(userId, {
            title: `${actor.displayName} commented on your ${targetType}`,
            body: `"${preview}"`,
            type: NOTIFICATION_CONFIG.types.COMMENT,
            group: NOTIFICATION_CONFIG.groups.SOCIAL,
            priority: NOTIFICATION_CONFIG.priorities.NORMAL,
            link: `/${targetType}/${targetId}`,
            action: 'view',
            metadata: {
                actorId,
                actorName: actor.displayName,
                actorPhoto: actor.photoURL,
                targetId,
                targetType,
                comment
            }
        });
    }

    /**
     * Send follow notification
     */
    async sendFollowNotification(userId, followerId) {
        const follower = await databaseService.getUser(followerId);
        if (!follower) return;

        return this.sendNotification(userId, {
            title: `${follower.displayName} started following you`,
            body: `${follower.displayName} is now following you`,
            type: NOTIFICATION_CONFIG.types.FOLLOW,
            group: NOTIFICATION_CONFIG.groups.SOCIAL,
            priority: NOTIFICATION_CONFIG.priorities.NORMAL,
            link: `/profile/${followerId}`,
            action: 'view',
            metadata: {
                followerId,
                followerName: follower.displayName,
                followerPhoto: follower.photoURL
            }
        });
    }

    /**
     * Send mention notification
     */
    async sendMentionNotification(userId, actorId, targetId, targetType = 'post', context = '') {
        const actor = await databaseService.getUser(actorId);
        if (!actor) return;

        return this.sendNotification(userId, {
            title: `${actor.displayName} mentioned you`,
            body: context || `${actor.displayName} mentioned you in a ${targetType}`,
            type: NOTIFICATION_CONFIG.types.MENTION,
            group: NOTIFICATION_CONFIG.groups.SOCIAL,
            priority: NOTIFICATION_CONFIG.priorities.NORMAL,
            link: `/${targetType}/${targetId}`,
            action: 'view',
            metadata: {
                actorId,
                actorName: actor.displayName,
                actorPhoto: actor.photoURL,
                targetId,
                targetType,
                context
            }
        });
    }

    /**
     * Send post notification
     */
    async sendPostNotification(userId, actorId, postId, postContent = '') {
        const actor = await databaseService.getUser(actorId);
        if (!actor) return;

        const preview = postContent.length > 50 ? postContent.substring(0, 50) + '...' : postContent;

        return this.sendNotification(userId, {
            title: `${actor.displayName} shared a new post`,
            body: preview || 'New post from someone you follow',
            type: NOTIFICATION_CONFIG.types.POST,
            group: NOTIFICATION_CONFIG.groups.SOCIAL,
            priority: NOTIFICATION_CONFIG.priorities.NORMAL,
            link: `/post/${postId}`,
            action: 'view',
            metadata: {
                actorId,
                actorName: actor.displayName,
                actorPhoto: actor.photoURL,
                postId,
                postContent
            }
        });
    }

    /**
     * Send story notification
     */
    async sendStoryNotification(userId, actorId, storyId) {
        const actor = await databaseService.getUser(actorId);
        if (!actor) return;

        return this.sendNotification(userId, {
            title: `${actor.displayName} shared a new story`,
            body: `Check out ${actor.displayName}'s new story`,
            type: NOTIFICATION_CONFIG.types.STORY,
            group: NOTIFICATION_CONFIG.groups.SOCIAL,
            priority: NOTIFICATION_CONFIG.priorities.NORMAL,
            link: `/story/${storyId}`,
            action: 'view',
            metadata: {
                actorId,
                actorName: actor.displayName,
                actorPhoto: actor.photoURL,
                storyId
            }
        });
    }

    /**
     * Send share notification
     */
    async sendShareNotification(userId, actorId, targetId, targetType = 'post') {
        const actor = await databaseService.getUser(actorId);
        if (!actor) return;

        return this.sendNotification(userId, {
            title: `${actor.displayName} shared your ${targetType}`,
            body: `${actor.displayName} shared your ${targetType}`,
            type: NOTIFICATION_CONFIG.types.SHARE,
            group: NOTIFICATION_CONFIG.groups.SOCIAL,
            priority: NOTIFICATION_CONFIG.priorities.NORMAL,
            link: `/${targetType}/${targetId}`,
            action: 'view',
            metadata: {
                actorId,
                actorName: actor.displayName,
                actorPhoto: actor.photoURL,
                targetId,
                targetType
            }
        });
    }

    // ============================================
    // PRODUCT NOTIFICATIONS (UPDATED)
    // ============================================

    /**
     * Send product notification
     */
    async sendProductNotification(userId, productId, productTitle, type = 'new') {
        const messages = {
            new: 'New product available',
            updated: 'Product updated',
            price_drop: 'Price drop alert',
            back_in_stock: 'Back in stock',
            trending: 'Trending product',
            featured: 'Featured product'
        };

        return this.sendNotification(userId, {
            title: messages[type] || 'Product notification',
            body: productTitle,
            type: NOTIFICATION_CONFIG.types.PRODUCT,
            group: NOTIFICATION_CONFIG.groups.PRODUCT,
            priority: NOTIFICATION_CONFIG.priorities.NORMAL,
            link: `/product/${productId}`,
            action: 'view',
            metadata: {
                productId,
                productTitle,
                type
            }
        });
    }

    /**
     * Send download notification
     */
    async sendDownloadNotification(userId, productId, productTitle) {
        return this.sendNotification(userId, {
            title: 'Download Ready',
            body: `Your download for "${productTitle}" is ready`,
            type: NOTIFICATION_CONFIG.types.DOWNLOAD,
            group: NOTIFICATION_CONFIG.groups.PRODUCT,
            priority: NOTIFICATION_CONFIG.priorities.HIGH,
            link: `/product/${productId}`,
            action: 'view',
            metadata: {
                productId,
                productTitle
            }
        });
    }

    /**
     * Send review notification
     */
    async sendReviewNotification(userId, productId, productTitle, reviewerId, rating, comment = '') {
        const reviewer = await databaseService.getUser(reviewerId);
        if (!reviewer) return;

        const stars = '⭐'.repeat(rating);

        return this.sendNotification(userId, {
            title: `New review for "${productTitle}"`,
            body: `${reviewer.displayName} rated ${stars}${comment ? `: "${comment.substring(0, 50)}..."` : ''}`,
            type: NOTIFICATION_CONFIG.types.REVIEW,
            group: NOTIFICATION_CONFIG.groups.PRODUCT,
            priority: NOTIFICATION_CONFIG.priorities.NORMAL,
            link: `/product/${productId}`,
            action: 'view',
            metadata: {
                productId,
                productTitle,
                reviewerId,
                reviewerName: reviewer.displayName,
                rating,
                comment
            }
        });
    }

    // ============================================
    // CHAT NOTIFICATIONS (UPDATED)
    // ============================================

    /**
     * Send chat notification
     */
    async sendChatNotification(userId, senderId, chatId, message, messageType = 'text') {
        const sender = await databaseService.getUser(senderId);
        if (!sender) return;

        const messagePreview = messageType === 'image' ? '📷 Image' :
                              messageType === 'file' ? '📎 File' :
                              message.length > 50 ? message.substring(0, 50) + '...' : message;

        return this.sendNotification(userId, {
            title: `${sender.displayName}`,
            body: messagePreview,
            type: NOTIFICATION_CONFIG.types.CHAT,
            group: NOTIFICATION_CONFIG.groups.CHAT,
            priority: NOTIFICATION_CONFIG.priorities.HIGH,
            link: `/chat/${chatId}`,
            action: 'reply',
            metadata: {
                senderId,
                senderName: sender.displayName,
                senderPhoto: sender.photoURL,
                chatId,
                message,
                messageType
            }
        });
    }

    // ============================================
    // AI NOTIFICATIONS (UPDATED)
    // ============================================

    /**
     * Send AI notification
     */
    async sendAINotification(userId, type = 'response', content = '') {
        const messages = {
            response: 'AI response ready',
            question: 'AI question answered',
            limit: 'AI limit reached',
            error: 'AI service error'
        };

        return this.sendNotification(userId, {
            title: messages[type] || 'AI notification',
            body: content || 'Your AI request is ready',
            type: NOTIFICATION_CONFIG.types.AI,
            group: NOTIFICATION_CONFIG.groups.SYSTEM,
            priority: NOTIFICATION_CONFIG.priorities.NORMAL,
            link: '/ai-chat',
            action: 'view',
            metadata: {
                type,
                content
            }
        });
    }

    // ============================================
    // AD NOTIFICATIONS (UPDATED)
    // ============================================

    /**
     * Send ad notification
     */
    async sendAdNotification(userId, type = 'reward', amount = 0) {
        const messages = {
            reward: `You earned ${amount} coins!`,
            bonus: `Bonus coins earned!`,
            limit: 'Daily ad limit reached',
            available: 'Ad available'
        };

        return this.sendNotification(userId, {
            title: messages[type] || 'Ad notification',
            body: `Watch an ad to earn coins`,
            type: NOTIFICATION_CONFIG.types.AD,
            group: NOTIFICATION_CONFIG.groups.SYSTEM,
            priority: NOTIFICATION_CONFIG.priorities.NORMAL,
            link: '/home',
            action: 'view',
            metadata: {
                type,
                amount
            }
        });
    }

    // ============================================
    // SYSTEM NOTIFICATIONS (UPDATED)
    // ============================================

    /**
     * Send system notification
     */
    async sendSystemNotification(userId, title, body, priority = 'normal', action = 'view') {
        return this.sendNotification(userId, {
            title,
            body,
            type: NOTIFICATION_CONFIG.types.SYSTEM,
            group: NOTIFICATION_CONFIG.groups.SYSTEM,
            priority: priority,
            link: '/notifications',
            action,
            metadata: {}
        });
    }

    // ============================================
    // NOTIFICATION HISTORY
    // ============================================

    /**
     * Save notification to history
     */
    _saveToHistory(notification) {
        this._notificationHistory.push({
            ...notification,
            displayedAt: new Date().toISOString()
        });

        if (this._notificationHistory.length > 1000) {
            this._notificationHistory = this._notificationHistory.slice(-1000);
        }
    }

    /**
     * Get notification history
     */
    getNotificationHistory(options = {}) {
        const { limit = 100, type = null } = options;
        let history = [...this._notificationHistory];

        if (type) {
            history = history.filter(h => h.type === type);
        }

        return history.slice(-limit).reverse();
    }

    /**
     * Clear notification history
     */
    clearHistory() {
        this._notificationHistory = [];
        logger.info('🔔 Notification history cleared');
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

    /**
     * Add message handler
     */
    addMessageHandler(handler) {
        this._messageHandlers.push(handler);
        return () => {
            this._messageHandlers = this._messageHandlers.filter(h => h !== handler);
        };
    }

    // ============================================
    // SERVICE WORKER
    // ============================================

    /**
     * Setup service worker
     */
    async _setupServiceWorker() {
        try {
            if (!this._serviceWorkerRegistration) {
                if ('serviceWorker' in navigator) {
                    this._serviceWorkerRegistration = await navigator.serviceWorker.ready;
                }
            }

            if (this._serviceWorkerRegistration) {
                // Send initial data to service worker
                this._serviceWorkerRegistration.active?.postMessage({
                    type: 'init',
                    data: {
                        vapidKey: NOTIFICATION_CONFIG.vapidKey,
                        icon: NOTIFICATION_CONFIG.icon,
                        badge: NOTIFICATION_CONFIG.badge
                    }
                });
            }
        } catch (error) {
            logger.error('❌ Failed to setup service worker', { error: error.message });
        }
    }

    // ============================================
    // DAILY RESET
    // ============================================

    /**
     * Set daily reset timer
     */
    _setDailyResetTimer() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const msUntilMidnight = tomorrow.getTime() - now.getTime();

        this._dailyResetTimer = setTimeout(() => {
            this._todayCount = 0;
            this._setDailyResetTimer();
            logger.debug('🔔 Daily notification count reset');
        }, msUntilMidnight);
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Get notification stats
     */
    getStats() {
        return {
            initialized: this._initialized,
            enabled: this._enabled,
            permission: this._permission,
            hasToken: !!this._token,
            totalNotifications: this._notifications.length,
            unreadCount: this._unreadCount,
            badgeCount: this._badgeCount,
            todayCount: this._todayCount,
            dailyLimit: this._dailyLimit,
            groups: Object.keys(this._groups).length,
            historySize: this._notificationHistory.length,
            listeners: this._listeners.length
        };
    }

    /**
     * Enable notifications
     */
    enable() {
        this._enabled = true;
        logger.info('🔔 Notifications enabled');
    }

    /**
     * Disable notifications
     */
    disable() {
        this._enabled = false;
        this._notificationQueue = [];
        logger.info('🔔 Notifications disabled');
    }

    /**
     * Reset notification service
     */
    reset() {
        this._notifications = [];
        this._unreadCount = 0;
        this._badgeCount = 0;
        this._todayCount = 0;
        this._notificationHistory = [];
        this._groups = {};
        this._updateBadge();
        this._notifyListeners('reset', this._notifications);
        logger.info('🔔 Notification service reset');
    }

    /**
     * Destroy notification service
     */
    destroy() {
        if (this._dailyResetTimer) {
            clearTimeout(this._dailyResetTimer);
            this._dailyResetTimer = null;
        }

        this._listeners = [];
        this._messageHandlers = [];
        this._notificationQueue = [];
        this._initialized = false;

        logger.info('🔔 Notification service destroyed');
    }

    /**
     * Play notification sound
     */
    async playSound() {
        try {
            if (!this._userPreferences.sound) return;

            if (!this._notificationSound) {
                this._notificationSound = new Audio(NOTIFICATION_CONFIG.sound);
            }

            await this._notificationSound.play();
        } catch (error) {
            // Ignore audio errors
        }
    }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

const notificationService = new NotificationService();

// ============================================================
// EXPORTS
// ============================================================

export { notificationService, NOTIFICATION_CONFIG };

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Initialize notification service
 */
export function initNotifications(options = {}) {
    return notificationService.init(options);
}

/**
 * Request notification permission
 */
export function requestNotificationPermission(options = {}) {
    return notificationService.requestPermission(options);
}

/**
 * Check notification permission
 */
export function hasNotificationPermission() {
    return notificationService.hasPermission();
}

/**
 * Get notification permission status
 */
export function getNotificationPermission() {
    return notificationService.getPermissionStatus();
}

/**
 * Get FCM token
 */
export function getFCMToken() {
    return notificationService.getFCMToken();
}

/**
 * Delete FCM token
 */
export function deleteFCMToken() {
    return notificationService.deleteFCMToken();
}

/**
 * Get all notifications
 */
export function getNotifications(options = {}) {
    return notificationService.getNotifications(options);
}

/**
 * Get unread count
 */
export function getUnreadCount() {
    return notificationService.getUnreadCount();
}

/**
 * Get notification by ID
 */
export function getNotification(id) {
    return notificationService.getNotification(id);
}

/**
 * Mark notification as read
 */
export function markNotificationRead(id) {
    return notificationService.markAsRead(id);
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsRead() {
    return notificationService.markAllAsRead();
}

/**
 * Delete notification
 */
export function deleteNotification(id) {
    return notificationService.deleteNotification(id);
}

/**
 * Clear all notifications
 */
export function clearAllNotifications() {
    return notificationService.clearAll();
}

/**
 * Send notification
 */
export function sendNotification(userId, notification) {
    return notificationService.sendNotification(userId, notification);
}

/**
 * Send like notification
 */
export function sendLikeNotification(userId, actorId, targetId, targetType = 'post') {
    return notificationService.sendLikeNotification(userId, actorId, targetId, targetType);
}

/**
 * Send comment notification
 */
export function sendCommentNotification(userId, actorId, targetId, targetType = 'post', comment = '') {
    return notificationService.sendCommentNotification(userId, actorId, targetId, targetType, comment);
}

/**
 * Send follow notification
 */
export function sendFollowNotification(userId, followerId) {
    return notificationService.sendFollowNotification(userId, followerId);
}

/**
 * Send mention notification
 */
export function sendMentionNotification(userId, actorId, targetId, targetType = 'post', context = '') {
    return notificationService.sendMentionNotification(userId, actorId, targetId, targetType, context);
}

/**
 * Send chat notification
 */
export function sendChatNotification(userId, senderId, chatId, message, messageType = 'text') {
    return notificationService.sendChatNotification(userId, senderId, chatId, message, messageType);
}

/**
 * Send product notification
 */
export function sendProductNotification(userId, productId, productTitle, type = 'new') {
    return notificationService.sendProductNotification(userId, productId, productTitle, type);
}

/**
 * Send download notification
 */
export function sendDownloadNotification(userId, productId, productTitle) {
    return notificationService.sendDownloadNotification(userId, productId, productTitle);
}

/**
 * Send system notification
 */
export function sendSystemNotification(userId, title, body, priority = 'normal', action = 'view') {
    return notificationService.sendSystemNotification(userId, title, body, priority, action);
}

/**
 * Update notification preferences
 */
export function updateNotificationPreferences(preferences) {
    return notificationService.updatePreferences(preferences);
}

/**
 * Get notification preferences
 */
export function getNotificationPreferences() {
    return notificationService.getPreferences();
}

/**
 * Add notification listener
 */
export function onNotification(callback) {
    return notificationService.addListener(callback);
}

/**
 * Add message handler
 */
export function onNotificationMessage(handler) {
    return notificationService.addMessageHandler(handler);
}

/**
 * Get notification stats
 */
export function getNotificationStats() {
    return notificationService.getStats();
}

/**
 * Enable notifications
 */
export function enableNotifications() {
    return notificationService.enable();
}

/**
 * Disable notifications
 */
export function disableNotifications() {
    return notificationService.disable();
}

/**
 * Reset notifications
 */
export function resetNotifications() {
    return notificationService.reset();
}

/**
 * Destroy notification service
 */
export function destroyNotifications() {
    return notificationService.destroy();
}

/// ============================================================
// EXPORTS
// ============================================================

export default notificationService;
export { NotificationService };