// Notifications Screen
// ============================================================
// FILE: js/screens/notifications-screen.js
// PURPOSE: User notifications list with read/unread management
// DEPENDENCY: store.js, notification-model.js, loading-spinner.js
// ROUTE: /notifications
// ============================================================

import { Store } from '../store.js';
import { Notification } from '../models/notification-model.js';
import { LoadingSpinner } from '../widgets/loading-spinner.js';
import { ToastNotification } from '../widgets/toast-notification.js';
import { Modal } from '../widgets/modal.js';
import { EventBus } from '../event-bus.js';

/**
 * NotificationsScreen Class - Renders user notifications
 * 
 * Features:
 * - List of notifications with icons
 * - Read/unread status
 * - Mark as read/unread
 * - Mark all as read
 * - Delete notification
 * - Clear all notifications
 * - Filter by type
 * - Notification click to navigate
 * - Empty state
 * - Responsive design
 * - Dark mode support
 * 
 * Usage:
 *   const notificationsScreen = new NotificationsScreen();
 *   document.getElementById('app').appendChild(notificationsScreen.render());
 */
export class NotificationsScreen {
    /**
     * Default configuration
     * @private
     * @static
     */
    static #defaultConfig = {
        showFilters: true,
        showMarkAllRead: true,
        showClearAll: true,
        itemsPerPage: 20,
        className: '',
        onNotificationClick: null,
        onMarkAllRead: null,
        onClearAll: null
    };

    /**
     * Notification type icons
     * @private
     * @static
     */
    static #typeIcons = {
        like: '❤️',
        comment: '💬',
        download: '⬇️',
        follow: '👤',
        mention: '@',
        reply: '↩️',
        share: '📤',
        system: '⚙️',
        product: '📦',
        review: '⭐',
        achievement: '🏆',
        message: '✉️',
        default: '🔔'
    };

    /**
     * Notification type colors
     * @private
     * @static
     */
    static #typeColors = {
        like: '#ef4444',
        comment: '#3b82f6',
        download: '#22c55e',
        follow: '#8b5cf6',
        mention: '#f59e0b',
        reply: '#06b6d4',
        share: '#ec4899',
        system: '#6b7280',
        product: '#6366f1',
        review: '#f59e0b',
        achievement: '#fbbf24',
        message: '#3b82f6',
        default: '#6b7280'
    };

    /**
     * Constructor
     * @param {Object} config - Configuration object
     */
    constructor(config = {}) {
        this.config = {
            ...NotificationsScreen.#defaultConfig,
            ...config
        };

        // Private state
        this._isDestroyed = false;
        this._isLoading = true;
        this._container = null;
        this._notifications = [];
        this._filteredNotifications = [];
        this._components = [];
        this._filter = 'all';

        // Bind methods
        this._handleNotificationClick = this._handleNotificationClick.bind(this);
        this._handleMarkRead = this._handleMarkRead.bind(this);
        this._handleMarkAllRead = this._handleMarkAllRead.bind(this);
        this._handleDeleteNotification = this._handleDeleteNotification.bind(this);
        this._handleClearAll = this._handleClearAll.bind(this);
        this._handleFilterChange = this._handleFilterChange.bind(this);
        this._handleBack = this._handleBack.bind(this);
    }

    /**
     * Render the notifications screen
     * @public
     * @returns {HTMLElement} Container element
     */
    render() {
        if (this._isDestroyed) return null;

        // Check if user is logged in
        const user = Store.getUser();
        if (!user) {
            this._redirectToAuth();
            return null;
        }

        // Get notifications from store
        this._loadNotifications();

        // Create container
        this._container = document.createElement('div');
        this._container.className = 'notifications-screen';
        if (this.config.className) {
            this._container.classList.add(this.config.className);
        }

        // Apply styles
        Object.assign(this._container.style, {
            maxWidth: '700px',
            margin: '0 auto',
            padding: '16px 20px 80px',
            fontFamily: 'inherit',
            minHeight: '100vh'
        });

        // Build content
        this._buildHeader();
        this._buildControls();
        this._buildNotificationList();

        return this._container;
    }

    /**
     * Build header
     * @private
     */
    _buildHeader() {
        const header = document.createElement('div');
        Object.assign(header.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px'
        });

        // Back button
        const backBtn = document.createElement('button');
        backBtn.className = 'notifications-back-btn';
        backBtn.textContent = '←';
        backBtn.setAttribute('aria-label', 'Go back');
        Object.assign(backBtn.style, {
            padding: '8px 12px',
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#6b7280',
            transition: 'color 0.2s'
        });
        backBtn.addEventListener('mouseenter', () => {
            backBtn.style.color = '#1a1a2e';
        });
        backBtn.addEventListener('mouseleave', () => {
            backBtn.style.color = '#6b7280';
        });
        backBtn.addEventListener('click', this._handleBack);

        header.appendChild(backBtn);

        const title = document.createElement('h1');
        title.textContent = 'Notifications';
        Object.assign(title.style, {
            margin: '0',
            fontSize: '24px',
            fontWeight: '700',
            color: '#1a1a2e',
            flex: '1'
        });

        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            title.style.color = '#f3f4f6';
        }

        header.appendChild(title);

        // Unread count
        const unreadCount = this._getUnreadCount();
        if (unreadCount > 0) {
            const badge = document.createElement('span');
            badge.textContent = unreadCount;
            Object.assign(badge.style, {
                backgroundColor: '#ef4444',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '2px 10px',
                fontSize: '12px',
                fontWeight: '600'
            });
            header.appendChild(badge);
        }

        this._container.appendChild(header);
        this._unreadBadge = badge;
    }

    /**
     * Build controls (filter, actions)
     * @private
     */
    _buildControls() {
        const controls = document.createElement('div');
        controls.className = 'notifications-controls';
        Object.assign(controls.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
            flexWrap: 'wrap'
        });

        // Filter
        if (this.config.showFilters) {
            const filterGroup = document.createElement('div');
            Object.assign(filterGroup.style, {
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap'
            });

            const filters = [
                { value: 'all', label: 'All' },
                { value: 'unread', label: 'Unread' },
                { value: 'read', label: 'Read' }
            ];

            // Add type filters from existing notifications
            const types = new Set();
            this._notifications.forEach(n => {
                if (n.type) types.add(n.type);
            });
            types.forEach(type => {
                filters.push({
                    value: type,
                    label: type.charAt(0).toUpperCase() + type.slice(1)
                });
            });

            filters.forEach(filter => {
                const btn = document.createElement('button');
                btn.className = 'notifications-filter-btn';
                btn.textContent = filter.label;
                btn.dataset.value = filter.value;
                btn.style.cssText = `
                    padding: 6px 14px;
                    border-radius: 20px;
                    border: 1px solid ${filter.value === this._filter ? '#6366f1' : '#e5e7eb'};
                    background-color: ${filter.value === this._filter ? '#6366f1' : 'transparent'};
                    color: ${filter.value === this._filter ? '#ffffff' : '#6b7280'};
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: inherit;
                `;
                btn.addEventListener('click', () => {
                    this._handleFilterChange(filter.value);
                });
                filterGroup.appendChild(btn);
                if (filter.value === this._filter) {
                    btn.dataset.active = 'true';
                }
            });

            controls.appendChild(filterGroup);
        }

        // Actions
        const actions = document.createElement('div');
        Object.assign(actions.style, {
            display: 'flex',
            gap: '8px'
        });

        if (this.config.showMarkAllRead && this._getUnreadCount() > 0) {
            const markAllBtn = document.createElement('button');
            markAllBtn.className = 'notifications-mark-all-btn';
            markAllBtn.textContent = '✓ Mark All Read';
            Object.assign(markAllBtn.style, {
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid #22c55e',
                backgroundColor: 'transparent',
                color: '#22c55e',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s'
            });
            markAllBtn.addEventListener('mouseenter', () => {
                markAllBtn.style.backgroundColor = '#22c55e';
                markAllBtn.style.color = '#ffffff';
            });
            markAllBtn.addEventListener('mouseleave', () => {
                markAllBtn.style.backgroundColor = 'transparent';
                markAllBtn.style.color = '#22c55e';
            });
            markAllBtn.addEventListener('click', this._handleMarkAllRead);
            actions.appendChild(markAllBtn);
        }

        if (this.config.showClearAll && this._notifications.length > 0) {
            const clearBtn = document.createElement('button');
            clearBtn.className = 'notifications-clear-btn';
            clearBtn.textContent = '🗑️ Clear All';
            Object.assign(clearBtn.style, {
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid #ef4444',
                backgroundColor: 'transparent',
                color: '#ef4444',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s'
            });
            clearBtn.addEventListener('mouseenter', () => {
                clearBtn.style.backgroundColor = '#ef4444';
                clearBtn.style.color = '#ffffff';
            });
            clearBtn.addEventListener('mouseleave', () => {
                clearBtn.style.backgroundColor = 'transparent';
                clearBtn.style.color = '#ef4444';
            });
            clearBtn.addEventListener('click', this._handleClearAll);
            actions.appendChild(clearBtn);
        }

        controls.appendChild(actions);
        this._container.appendChild(controls);

        // Store references
        this._filterBtns = controls.querySelectorAll('.notifications-filter-btn');
    }

    /**
     * Build notification list
     * @private
     */
    _buildNotificationList() {
        const section = document.createElement('section');
        section.className = 'notifications-list';
        Object.assign(section.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
        });

        // Apply filter
        this._applyFilter();

        if (this._filteredNotifications.length === 0) {
            this._showEmptyState(section);
        } else {
            this._filteredNotifications.forEach((notification, index) => {
                const item = this._buildNotificationItem(notification, index);
                section.appendChild(item);
            });
        }

        this._container.appendChild(section);
        this._notificationList = section;
    }

    /**
     * Build single notification item
     * @private
     * @param {Object} notification - Notification object
     * @param {number} index - Index for animation
     * @returns {HTMLElement} Notification item
     */
    _buildNotificationItem(notification, index) {
        const container = document.createElement('div');
        container.className = 'notification-item';
        container.dataset.id = notification.id;
        container.dataset.read = notification.isRead ? 'true' : 'false';
        Object.assign(container.style, {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            padding: '14px 16px',
            backgroundColor: notification.isRead ? 'transparent' : 'rgba(99,102,241,0.05)',
            borderRadius: '12px',
            border: '1px solid ' + (notification.isRead ? '#f3f4f6' : 'rgba(99,102,241,0.15)'),
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            animation: `fadeInUp 0.3s ease ${index * 0.05}s both`,
            position: 'relative'
        });

        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            container.style.backgroundColor = notification.isRead ? 'transparent' : 'rgba(99,102,241,0.1)';
            container.style.borderColor = notification.isRead ? '#374151' : 'rgba(99,102,241,0.2)';
        }

        container.addEventListener('mouseenter', () => {
            container.style.backgroundColor = notification.isRead ? 
                (document.documentElement.getAttribute('data-theme') === 'dark' ? '#374151' : '#f9fafb') :
                (document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)');
            container.style.transform = 'translateX(4px)';
        });
        container.addEventListener('mouseleave', () => {
            container.style.backgroundColor = notification.isRead ? 
                (document.documentElement.getAttribute('data-theme') === 'dark' ? 'transparent' : 'transparent') :
                (document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)');
            container.style.transform = 'translateX(0)';
        });

        // Icon
        const iconContainer = document.createElement('div');
        Object.assign(iconContainer.style, {
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: this._getTypeColor(notification.type) + '20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: '0'
        });
        iconContainer.textContent = this._getTypeIcon(notification.type);
        container.appendChild(iconContainer);

        // Content
        const content = document.createElement('div');
        Object.assign(content.style, {
            flex: '1',
            minWidth: '0'
        });

        // Title
        const title = document.createElement('div');
        title.textContent = notification.title || 'Notification';
        Object.assign(title.style, {
            fontSize: '14px',
            fontWeight: notification.isRead ? '400' : '600',
            color: '#1a1a2e',
            marginBottom: '2px'
        });

        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            title.style.color = '#f3f4f6';
        }

        // Body
        const body = document.createElement('div');
        body.textContent = notification.body || '';
        Object.assign(body.style, {
            fontSize: '13px',
            color: '#6b7280',
            lineHeight: '1.5',
            display: '-webkit-box',
            WebkitLineClamp: '2',
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
        });

        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            body.style.color = '#9ca3af';
        }

        content.appendChild(title);
        content.appendChild(body);

        // Time
        const time = document.createElement('div');
        const date = notification.createdAt?.toDate ? 
            notification.createdAt.toDate() : 
            new Date(notification.createdAt || Date.now());
        time.textContent = this._formatTime(date);
        Object.assign(time.style, {
            fontSize: '11px',
            color: '#9ca3af',
            marginTop: '4px'
        });

        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            time.style.color = '#6b7280';
        }

        content.appendChild(time);
        container.appendChild(content);

        // Actions
        const actions = document.createElement('div');
        Object.assign(actions.style, {
            display: 'flex',
            gap: '4px',
            flexShrink: '0',
            alignSelf: 'flex-start'
        });

        // Mark read/unread button
        const readBtn = document.createElement('button');
        readBtn.textContent = notification.isRead ? '○' : '●';
        readBtn.setAttribute('aria-label', notification.isRead ? 'Mark as unread' : 'Mark as read');
        Object.assign(readBtn.style, {
            background: 'none',
            border: 'none',
            fontSize: '14px',
            color: notification.isRead ? '#9ca3af' : '#6366f1',
            cursor: 'pointer',
            padding: '4px',
            transition: 'all 0.2s'
        });
        readBtn.addEventListener('mouseenter', () => {
            readBtn.style.transform = 'scale(1.2)';
        });
        readBtn.addEventListener('mouseleave', () => {
            readBtn.style.transform = 'scale(1)';
        });
        readBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._handleMarkRead(notification);
        });
        actions.appendChild(readBtn);

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '✕';
        deleteBtn.setAttribute('aria-label', 'Delete notification');
        Object.assign(deleteBtn.style, {
            background: 'none',
            border: 'none',
            fontSize: '12px',
            color: '#9ca3af',
            cursor: 'pointer',
            padding: '4px',
            transition: 'all 0.2s'
        });
        deleteBtn.addEventListener('mouseenter', () => {
            deleteBtn.style.color = '#ef4444';
            deleteBtn.style.transform = 'scale(1.2)';
        });
        deleteBtn.addEventListener('mouseleave', () => {
            deleteBtn.style.color = '#9ca3af';
            deleteBtn.style.transform = 'scale(1)';
        });
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._handleDeleteNotification(notification);
        });
        actions.appendChild(deleteBtn);

        container.appendChild(actions);

        // Click to navigate
        container.addEventListener('click', () => {
            this._handleNotificationClick(notification);
        });

        // Unread dot indicator (left side)
        if (!notification.isRead) {
            const dot = document.createElement('span');
            Object.assign(dot.style, {
                position: 'absolute',
                left: '-6px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#6366f1'
            });
            container.appendChild(dot);
        }

        return container;
    }

    /**
     * Show empty state
     * @private
     * @param {HTMLElement} container - Container element
     */
    _showEmptyState(container) {
        const empty = document.createElement('div');
        Object.assign(empty.style, {
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6b7280'
        });

        empty.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 16px;">🔔</div>
            <h3 style="margin: 0; color: #1a1a2e;">No Notifications</h3>
            <p style="margin: 8px 0 0; font-size: 14px;">You're all caught up! Check back later for updates.</p>
        `;

        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            const title = empty.querySelector('h3');
            if (title) title.style.color = '#f3f4f6';
        }

        container.appendChild(empty);
    }

    /**
     * Load notifications from store
     * @private
     */
    _loadNotifications() {
        this._notifications = Store.getNotifications() || [];
        
        // Sort by date (newest first)
        this._notifications.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return dateB - dateA;
        });

        this._filteredNotifications = [...this._notifications];
    }

    /**
     * Apply filter to notifications
     * @private
     */
    _applyFilter() {
        const filter = this._filter;

        if (filter === 'all') {
            this._filteredNotifications = [...this._notifications];
        } else if (filter === 'unread') {
            this._filteredNotifications = this._notifications.filter(n => !n.isRead);
        } else if (filter === 'read') {
            this._filteredNotifications = this._notifications.filter(n => n.isRead);
        } else {
            // Filter by type
            this._filteredNotifications = this._notifications.filter(n => n.type === filter);
        }

        // Update unread badge
        if (this._unreadBadge) {
            const unreadCount = this._getUnreadCount();
            if (unreadCount > 0) {
                this._unreadBadge.textContent = unreadCount;
                this._unreadBadge.style.display = 'inline';
            } else {
                this._unreadBadge.style.display = 'none';
            }
        }
    }

    /**
     * Get unread count
     * @private
     * @returns {number} Unread count
     */
    _getUnreadCount() {
        return this._notifications.filter(n => !n.isRead).length;
    }

    /**
     * Get notification icon
     * @private
     * @param {string} type - Notification type
     * @returns {string} Icon character
     */
    _getTypeIcon(type) {
        return NotificationsScreen.#typeIcons[type] || NotificationsScreen.#typeIcons.default;
    }

    /**
     * Get notification color
     * @private
     * @param {string} type - Notification type
     * @returns {string} Color hex
     */
    _getTypeColor(type) {
        return NotificationsScreen.#typeColors[type] || NotificationsScreen.#typeColors.default;
    }

    /**
     * Format time
     * @private
     * @param {Date} date - Date object
     * @returns {string} Formatted time
     */
    _formatTime(date) {
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) {
            return 'Just now';
        } else if (diff < 3600000) {
            const mins = Math.floor(diff / 60000);
            return `${mins}m ago`;
        } else if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else if (diff < 172800000) {
            return 'Yesterday';
        } else if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days}d ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    }

    /**
     * Handle notification click
     * @private
     * @param {Object} notification - Notification object
     */
    _handleNotificationClick(notification) {
        // Mark as read if unread
        if (!notification.isRead) {
            this._handleMarkRead(notification);
        }

        // Navigate if link exists
        if (notification.link) {
            if (this.config.onNotificationClick) {
                this.config.onNotificationClick(notification);
            } else if (window.Router) {
                window.Router.navigate(notification.link);
            }
        }
    }

    /**
     * Handle mark read/unread
     * @private
     * @param {Object} notification - Notification object
     */
    _handleMarkRead(notification) {
        const newState = !notification.isRead;
        Store.markNotificationRead(notification.id, newState);
        notification.isRead = newState;

        // Update UI
        this._refreshList();

        // Update badge
        if (this._unreadBadge) {
            const unreadCount = this._getUnreadCount();
            if (unreadCount > 0) {
                this._unreadBadge.textContent = unreadCount;
                this._unreadBadge.style.display = 'inline';
            } else {
                this._unreadBadge.style.display = 'none';
            }
        }

        EventBus.emit('notification:read', { 
            notificationId: notification.id, 
            isRead: newState 
        });
    }

    /**
     * Handle mark all as read
     * @private
     */
    _handleMarkAllRead() {
        const unread = this._notifications.filter(n => !n.isRead);
        if (unread.length === 0) {
            ToastNotification.info('No unread notifications');
            return;
        }

        unread.forEach(n => {
            Store.markNotificationRead(n.id, true);
            n.isRead = true;
        });

        ToastNotification.success(`Marked ${unread.length} notifications as read`);
        this._refreshList();

        if (this._unreadBadge) {
            this._unreadBadge.style.display = 'none';
        }

        if (this.config.onMarkAllRead) {
            this.config.onMarkAllRead(unread);
        }

        EventBus.emit('notification:markAllRead', { count: unread.length });
    }

    /**
     * Handle delete notification
     * @private
     * @param {Object} notification - Notification object
     */
    async _handleDeleteNotification(notification) {
        const confirmed = await Modal.confirm(
            'Delete this notification?',
            {
                title: 'Delete Notification',
                confirmLabel: 'Delete',
                cancelLabel: 'Cancel'
            }
        );

        if (!confirmed) return;

        Store.deleteNotification(notification.id);
        this._notifications = this._notifications.filter(n => n.id !== notification.id);
        this._applyFilter();
        this._refreshList();

        if (this._unreadBadge) {
            const unreadCount = this._getUnreadCount();
            if (unreadCount > 0) {
                this._unreadBadge.textContent = unreadCount;
                this._unreadBadge.style.display = 'inline';
            } else {
                this._unreadBadge.style.display = 'none';
            }
        }

        ToastNotification.info('Notification deleted');
        EventBus.emit('notification:delete', { notificationId: notification.id });
    }

    /**
     * Handle clear all notifications
     * @private
     */
    async _handleClearAll() {
        if (this._notifications.length === 0) {
            ToastNotification.info('No notifications to clear');
            return;
        }

        const confirmed = await Modal.confirm(
            'This will permanently delete all your notifications. Continue?',
            {
                title: 'Clear All Notifications',
                confirmLabel: 'Clear All',
                cancelLabel: 'Cancel'
            }
        );

        if (!confirmed) return;

        Store.clearNotifications();
        this._notifications = [];
        this._filteredNotifications = [];
        this._refreshList();

        if (this._unreadBadge) {
            this._unreadBadge.style.display = 'none';
        }

        ToastNotification.success('All notifications cleared');

        if (this.config.onClearAll) {
            this.config.onClearAll();
        }

        EventBus.emit('notification:clearAll');
    }

    /**
     * Handle filter change
     * @private
     * @param {string} filter - Filter value
     */
    _handleFilterChange(filter) {
        this._filter = filter;
        this._applyFilter();
        this._refreshList();

        // Update filter buttons
        if (this._filterBtns) {
            this._filterBtns.forEach(btn => {
                const isActive = btn.dataset.value === filter;
                btn.dataset.active = isActive ? 'true' : 'false';
                btn.style.backgroundColor = isActive ? '#6366f1' : 'transparent';
                btn.style.color = isActive ? '#ffffff' : '#6b7280';
                btn.style.borderColor = isActive ? '#6366f1' : '#e5e7eb';
            });
        }
    }

    /**
     * Refresh notification list
     * @private
     */
    _refreshList() {
        if (!this._notificationList) return;

        // Clear existing
        this._notificationList.innerHTML = '';

        if (this._filteredNotifications.length === 0) {
            this._showEmptyState(this._notificationList);
        } else {
            this._filteredNotifications.forEach((notification, index) => {
                const item = this._buildNotificationItem(notification, index);
                this._notificationList.appendChild(item);
            });
        }

        // Update controls (show/hide mark all read)
        const markAllBtn = this._container?.querySelector('.notifications-mark-all-btn');
        if (markAllBtn) {
            const unreadCount = this._getUnreadCount();
            markAllBtn.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
        }

        const clearBtn = this._container?.querySelector('.notifications-clear-btn');
        if (clearBtn) {
            clearBtn.style.display = this._notifications.length > 0 ? 'inline-flex' : 'none';
        }
    }

    /**
     * Handle back button
     * @private
     */
    _handleBack() {
        if (window.Router) {
            window.Router.back();
        } else {
            window.history.back();
        }
    }

    /**
     * Redirect to auth
     * @private
     */
    _redirectToAuth() {
        if (window.Router) {
            window.Router.navigate('/auth');
        } else {
            window.location.href = '/auth';
        }
    }

    /**
     * Refresh notifications
     * @public
     * @returns {this} Chainable
     */
    refresh() {
        if (this._isDestroyed) return this;

        this._loadNotifications();
        this._applyFilter();
        this._refreshList();

        return this;
    }

    /**
     * Destroy the component
     * @public
     */
    destroy() {
        if (this._isDestroyed) return;

        this._isDestroyed = true;

        // Destroy all components
        this._components.forEach(component => {
            if (component && typeof component.destroy === 'function') {
                component.destroy();
            }
        });
        this._components = [];

        // Remove from DOM
        if (this._container && this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }

        this._container = null;
        this._notifications = [];
        this._filteredNotifications = [];
    }
}

// ============================================================
// GLOBAL EXPOSURE
// ============================================================
if (typeof window !== 'undefined') {
    window.NotificationsScreen = NotificationsScreen;
}

// ============================================================
// EXPORT
// ============================================================
export default NotificationsScreen;