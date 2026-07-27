// ============================================================
// FILE: js/widgets/toast-notification.js
// PURPOSE: Premium Toast/Snackbar Notification System - Full Production
// DEPENDENCY: constants.js, event-bus.js
// USED BY: All screens, services, components
// VERSION: 7.0.0 - ULTIMATE PRODUCTION
// ============================================================

import { APP_CONSTANTS } from '../utils/constants.js';
import { eventBus } from '../state/event-bus.js';
import { logger } from '../services/logger.js';
import { themeManager } from '../utils/theme.js';

export class ToastNotification {
    static get TYPES() {
        return {
            SUCCESS: 'success',
            ERROR: 'error',
            WARNING: 'warning',
            INFO: 'info',
            LOADING: 'loading',
            CUSTOM: 'custom'
        };
    }

    static get POSITIONS() {
        return {
            TOP: 'top',
            BOTTOM: 'bottom',
            TOP_LEFT: 'top-left',
            TOP_RIGHT: 'top-right',
            BOTTOM_LEFT: 'bottom-left',
            BOTTOM_RIGHT: 'bottom-right',
            CENTER: 'center'
        };
    }

    static get DEFAULT_CONFIG() {
        return {
            duration: 3500,
            position: 'top-right',
            type: 'info',
            showProgress: true,
            dismissible: true,
            pauseOnHover: true,
            pauseOnFocusLoss: true,
            icon: null,
            action: null,
            actionLabel: null,
            className: '',
            maxToasts: 5,
            queue: true,
            zIndex: 9999,
            animation: 'slide',
            closeOnClick: false,
            showCloseButton: true,
            richColors: false
        };
    }

    static get ICON_MAP() {
        return {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            loading: '⏳'
        };
    }

    static get COLOR_MAP() {
        return {
            success: { bg: '#22c55e', text: '#ffffff', border: '#16a34a', light: '#dcfce7' },
            error: { bg: '#ef4444', text: '#ffffff', border: '#dc2626', light: '#fee2e2' },
            warning: { bg: '#f59e0b', text: '#ffffff', border: '#d97706', light: '#fef3c7' },
            info: { bg: '#3b82f6', text: '#ffffff', border: '#2563eb', light: '#dbeafe' },
            loading: { bg: '#6366f1', text: '#ffffff', border: '#4f46e5', light: '#e0e7ff' }
        };
    }

    constructor(options = {}) {
        this.options = {
            ...ToastNotification.DEFAULT_CONFIG,
            ...options
        };

        this._element = null;
        this._progressElement = null;
        this._timer = null;
        this._progressTimer = null;
        this._isVisible = false;
        this._isPaused = false;
        this._container = null;
        this._id = this._generateId();
        this._queue = [];
        this._isShowing = false;
        this._onDismiss = null;
        this._onAction = null;
        this._isDestroyed = false;
        this._touchStartX = 0;
        this._touchStartY = 0;
        this._isSwiping = false;

        this._handleDismiss = this._handleDismiss.bind(this);
        this._handleAction = this._handleAction.bind(this);
        this._handleMouseEnter = this._handleMouseEnter.bind(this);
        this._handleMouseLeave = this._handleMouseLeave.bind(this);
        this._handleSwipeStart = this._handleSwipeStart.bind(this);
        this._handleSwipeMove = this._handleSwipeMove.bind(this);
        this._handleSwipeEnd = this._handleSwipeEnd.bind(this);
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
        this._handleClick = this._handleClick.bind(this);
    }

    _generateId() {
        return 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }

    _getColor(type) {
        const colorMap = ToastNotification.COLOR_MAP;
        return colorMap[type] || colorMap.info;
    }

    _getIcon(type) {
        const iconMap = ToastNotification.ICON_MAP;
        return this.options.icon || iconMap[type] || '📢';
    }

    _getContainer() {
        const position = this.options.position;
        const containerId = 'toast-container-' + position;

        let container = document.getElementById(containerId);
        
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.className = 'toast-container toast-container-' + position;
            container.setAttribute('role', 'status');
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'true');
            
            Object.assign(container.style, this._getContainerStyles(position));
            
            document.body.appendChild(container);
        }

        return container;
    }

    _getContainerStyles(position) {
        const styles = {
            position: 'fixed',
            zIndex: this.options.zIndex,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxWidth: '460px',
            width: '100%',
            padding: '12px',
            pointerEvents: 'none',
            boxSizing: 'border-box'
        };

        switch (position) {
            case 'top':
                styles.top = '20px';
                styles.left = '50%';
                styles.transform = 'translateX(-50%)';
                styles.alignItems = 'center';
                break;
            case 'bottom':
                styles.bottom = '20px';
                styles.left = '50%';
                styles.transform = 'translateX(-50%)';
                styles.alignItems = 'center';
                break;
            case 'top-left':
                styles.top = '20px';
                styles.left = '20px';
                styles.alignItems = 'flex-start';
                break;
            case 'top-right':
                styles.top = '20px';
                styles.right = '20px';
                styles.alignItems = 'flex-end';
                break;
            case 'bottom-left':
                styles.bottom = '20px';
                styles.left = '20px';
                styles.alignItems = 'flex-start';
                break;
            case 'bottom-right':
                styles.bottom = '20px';
                styles.right = '20px';
                styles.alignItems = 'flex-end';
                break;
            case 'center':
                styles.top = '50%';
                styles.left = '50%';
                styles.transform = 'translate(-50%, -50%)';
                styles.alignItems = 'center';
                styles.maxWidth = '480px';
                break;
            default:
                styles.top = '20px';
                styles.right = '20px';
                styles.alignItems = 'flex-end';
        }

        return styles;
    }

    _getToastStyles(type) {
        const colors = this._getColor(type);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const themeBg = isDark ? '#1f2937' : '#ffffff';
        const themeText = isDark ? '#f3f4f6' : '#1f2937';
        const themeBorder = isDark ? '#374151' : '#e5e7eb';

        return {
            pointerEvents: 'auto',
            backgroundColor: isDark && type === 'custom' ? themeBg : colors.bg,
            color: isDark && type === 'custom' ? themeText : colors.text,
            borderRadius: '14px',
            padding: '18px 22px',
            minWidth: '260px',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 12px 40px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.05)',
            border: '1px solid ' + (isDark && type === 'custom' ? themeBorder : colors.border),
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            position: 'relative',
            animation: this._getAnimationStyles(),
            transform: 'translateX(0)',
            opacity: '1',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            fontFamily: (APP_CONSTANTS && APP_CONSTANTS.FONT_FAMILY) ? APP_CONSTANTS.FONT_FAMILY : 'Poppins, sans-serif',
            willChange: 'transform, opacity'
        };
    }

    _getAnimationStyles() {
        const position = this.options.position;
        const animations = {
            'top': 'toastSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            'bottom': 'toastSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            'top-left': 'toastSlideRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            'top-right': 'toastSlideLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            'bottom-left': 'toastSlideRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            'bottom-right': 'toastSlideLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            'center': 'toastZoomIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        };
        return animations[position] || animations['top-right'];
    }

    _createToast() {
        const type = this.options.type;
        const icon = this._getIcon(type);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const colors = this._getColor(type);

        const wrapper = document.createElement('div');
        wrapper.className = 'toast-notification toast-' + type + (this.options.className ? ' ' + this.options.className : '');
        wrapper.setAttribute('role', 'alert');
        wrapper.setAttribute('aria-live', 'polite');
        wrapper.setAttribute('aria-atomic', 'true');
        wrapper.dataset.toastId = this._id;
        wrapper.tabIndex = 0;

        Object.assign(wrapper.style, this._getToastStyles(type));

        if (this.options.richColors && type !== 'custom') {
            wrapper.style.background = colors.light;
            wrapper.style.color = colors.border;
            wrapper.style.borderColor = colors.border;
        }

        const iconEl = document.createElement('span');
        iconEl.className = 'toast-icon';
        iconEl.textContent = icon;
        iconEl.style.cssText = `
            font-size: 26px;
            flex-shrink: 0;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            ${type === 'loading' ? 'animation: toastSpin 0.8s linear infinite;' : ''}
            ${this.options.richColors && type !== 'custom' ? 'background: rgba(255,255,255,0.5); border-radius: 50%;' : ''}
        `;

        const content = document.createElement('div');
        content.className = 'toast-content';
        content.style.cssText = `
            flex: 1;
            min-width: 0;
        `;

        if (this.options.title) {
            const titleEl = document.createElement('div');
            titleEl.className = 'toast-title';
            titleEl.textContent = this.options.title;
            titleEl.style.cssText = `
                font-weight: 600;
                font-size: 15px;
                margin-bottom: 2px;
                color: ${isDark && type === 'custom' ? '#f3f4f6' : (this.options.richColors ? colors.border : 'inherit')};
            `;
            content.appendChild(titleEl);
        }

        if (this.options.message) {
            const msgEl = document.createElement('div');
            msgEl.className = 'toast-message';
            msgEl.textContent = this.options.message;
            msgEl.style.cssText = `
                font-size: 13px;
                line-height: 1.6;
                color: ${isDark && type === 'custom' ? '#d1d5db' : (this.options.richColors ? colors.border : 'rgba(255,255,255,0.9)')};
            `;
            content.appendChild(msgEl);
        }

        if (this.options.action && this.options.actionLabel) {
            const actionBtn = document.createElement('button');
            actionBtn.className = 'toast-action';
            actionBtn.textContent = this.options.actionLabel;
            actionBtn.style.cssText = `
                background: ${this.options.richColors ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.2)'};
                border: none;
                color: ${this.options.richColors ? colors.border : 'inherit'};
                padding: 6px 16px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                transition: all 0.2s ease;
                margin-top: 6px;
                font-family: inherit;
            `;
            actionBtn.addEventListener('mouseenter', function() {
                this.style.background = this.options.richColors ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.3)';
            }.bind(this));
            actionBtn.addEventListener('mouseleave', function() {
                this.style.background = this.options.richColors ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.2)';
            }.bind(this));
            actionBtn.addEventListener('click', this._handleAction);
            content.appendChild(actionBtn);
        }

        const rightWrapper = document.createElement('div');
        rightWrapper.style.cssText = 'display: flex; align-items: flex-start; gap: 8px; flex-shrink: 0;';

        if (this.options.showCloseButton) {
            const dismissBtn = document.createElement('button');
            dismissBtn.className = 'toast-dismiss';
            dismissBtn.innerHTML = '✕';
            dismissBtn.setAttribute('aria-label', 'Dismiss notification');
            dismissBtn.style.cssText = `
                background: none;
                border: none;
                color: ${isDark && type === 'custom' ? '#9ca3af' : (this.options.richColors ? colors.border : 'rgba(255,255,255,0.6)')};
                cursor: pointer;
                font-size: 16px;
                padding: 4px;
                flex-shrink: 0;
                transition: all 0.2s ease;
                line-height: 1;
                border-radius: 4px;
            `;
            dismissBtn.addEventListener('mouseenter', function() {
                this.style.color = isDark && type === 'custom' ? '#f3f4f6' : '#ffffff';
                this.style.background = this.options.richColors ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)';
            }.bind(this));
            dismissBtn.addEventListener('mouseleave', function() {
                this.style.color = isDark && type === 'custom' ? '#9ca3af' : (this.options.richColors ? colors.border : 'rgba(255,255,255,0.6)');
                this.style.background = 'transparent';
            }.bind(this));
            dismissBtn.addEventListener('click', this._handleDismiss);
            rightWrapper.appendChild(dismissBtn);
        }

        wrapper.appendChild(iconEl);
        wrapper.appendChild(content);
        wrapper.appendChild(rightWrapper);

        if (this.options.showProgress && this.options.duration > 0) {
            const progressContainer = document.createElement('div');
            progressContainer.className = 'toast-progress-container';
            progressContainer.style.cssText = `
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: rgba(255,255,255,0.15);
                border-radius: 0 0 14px 14px;
                overflow: hidden;
            `;

            const progressBar = document.createElement('div');
            progressBar.className = 'toast-progress-bar';
            progressBar.style.cssText = `
                height: 100%;
                background: ${this.options.richColors ? colors.border : 'rgba(255,255,255,0.7)'};
                width: 100%;
                border-radius: 0 0 14px 14px;
                transition: width 0.1s linear;
            `;

            progressContainer.appendChild(progressBar);
            wrapper.appendChild(progressContainer);
            this._progressElement = progressBar;
        }

        if (this.options.closeOnClick) {
            wrapper.addEventListener('click', this._handleClick);
        }

        if (this.options.pauseOnHover) {
            wrapper.addEventListener('mouseenter', this._handleMouseEnter);
            wrapper.addEventListener('mouseleave', this._handleMouseLeave);
        }

        wrapper.addEventListener('touchstart', this._handleSwipeStart, { passive: true });
        wrapper.addEventListener('touchmove', this._handleSwipeMove, { passive: true });
        wrapper.addEventListener('touchend', this._handleSwipeEnd, { passive: true });

        wrapper.addEventListener('keydown', this._handleKeyDown);

        this._element = wrapper;
        this._container = this._getContainer();

        return wrapper;
    }

    show() {
        if (this._isDestroyed) return this;

        if (this._container && this._container.children.length >= this.options.maxToasts) {
            if (this.options.queue) {
                this._queue.push({
                    options: { ...this.options },
                    onDismiss: this._onDismiss,
                    onAction: this._onAction
                });
                return this;
            }
            const oldest = this._container.firstChild;
            if (oldest) {
                oldest.style.opacity = '0';
                oldest.style.transform = 'scale(0.8)';
                oldest.style.transition = 'all 0.3s ease';
                setTimeout(function() {
                    if (oldest.parentNode) {
                        oldest.parentNode.removeChild(oldest);
                    }
                }, 300);
            }
        }

        this._createToast();
        this._container.appendChild(this._element);

        setTimeout(() => {
            if (this._element) {
                this._element.focus();
            }
        }, 100);

        this._isVisible = true;
        this._startTimer();
        this._register();

        eventBus.emit('toast:show', {
            id: this._id,
            type: this.options.type,
            message: this.options.message,
            title: this.options.title
        });

        if (logger) {
            logger.info('Toast shown', {
                id: this._id,
                type: this.options.type,
                message: this.options.message
            });
        }

        document.addEventListener('visibilitychange', this._handleVisibilityChange);

        return this;
    }

    dismiss() {
        this._handleDismiss();
        return this;
    }

    _startTimer() {
        if (this.options.duration <= 0) return;

        let remaining = this.options.duration;
        let startTime = Date.now();

        this._timer = setTimeout(function() {
            this._handleDismiss();
        }.bind(this), remaining);

        if (this.options.showProgress && this._progressElement) {
            this._progressTimer = setInterval(function() {
                if (this._isPaused || !this._isVisible) return;
                
                const elapsed = Date.now() - startTime;
                const progress = Math.max(0, 100 - (elapsed / this.options.duration) * 100);
                this._progressElement.style.width = progress + '%';
                
                if (progress <= 0) {
                    clearInterval(this._progressTimer);
                }
            }.bind(this), 100);
        }
    }

    _resetTimer() {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
        if (this._progressTimer) {
            clearInterval(this._progressTimer);
            this._progressTimer = null;
        }
        this._startTimer();
    }

    _pauseTimer() {
        this._isPaused = true;
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
        if (this._progressTimer) {
            clearInterval(this._progressTimer);
            this._progressTimer = null;
        }
    }

    _resumeTimer() {
        this._isPaused = false;
        this._startTimer();
    }

    _handleMouseEnter() {
        if (this.options.pauseOnHover && this._isVisible) {
            this._pauseTimer();
        }
    }

    _handleMouseLeave() {
        if (this.options.pauseOnHover && this._isVisible) {
            this._resumeTimer();
        }
    }

    _handleDismiss() {
        if (!this._isVisible || !this._element || this._isDestroyed) return;

        this._pauseTimer();

        const position = this.options.position;
        const exitAnimations = {
            'top': 'translateY(-100px)',
            'bottom': 'translateY(100px)',
            'top-left': 'translateX(-100px)',
            'top-right': 'translateX(100px)',
            'bottom-left': 'translateX(-100px)',
            'bottom-right': 'translateX(100px)',
            'center': 'scale(0.8)'
        };

        this._element.style.opacity = '0';
        this._element.style.transform = exitAnimations[position] || 'translateX(100px)';
        this._element.style.transition = 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)';

        setTimeout(function() {
            if (this._element && this._element.parentNode) {
                this._element.parentNode.removeChild(this._element);
            }
            this._isVisible = false;

            eventBus.emit('toast:dismiss', {
                id: this._id,
                type: this.options.type,
                message: this.options.message
            });

            if (logger) {
                logger.info('Toast dismissed', {
                    id: this._id,
                    type: this.options.type
                });
            }

            if (this._onDismiss) {
                this._onDismiss(this);
            }

            document.removeEventListener('visibilitychange', this._handleVisibilityChange);

            this._showNextInQueue();

        }.bind(this), 350);

        setTimeout(function() {
            if (this._container && this._container.children.length === 0) {
                // Keep container
            }
        }.bind(this), 500);
    }

    _handleAction(e) {
        e.stopPropagation();
        if (this.options.action) {
            this.options.action();
        }
        if (this._onAction) {
            this._onAction(this);
        }
        eventBus.emit('toast:action', {
            id: this._id,
            type: this.options.type
        });
        this._handleDismiss();
    }

    _handleClick(e) {
        if (this.options.closeOnClick) {
            this._handleDismiss();
        }
    }

    _handleSwipeStart(e) {
        const touch = e.touches[0];
        this._touchStartX = touch.clientX;
        this._touchStartY = touch.clientY;
        this._isSwiping = false;
    }

    _handleSwipeMove(e) {
        if (!this._element) return;
        const touch = e.touches[0];
        const deltaX = touch.clientX - this._touchStartX;
        const deltaY = touch.clientY - this._touchStartY;

        if (!this._isSwiping && Math.abs(deltaX) > 20) {
            this._isSwiping = true;
            this._pauseTimer();
        }

        if (this._isSwiping) {
            const opacity = Math.max(0, 1 - Math.abs(deltaX) / 250);
            this._element.style.transform = 'translateX(' + deltaX + 'px)';
            this._element.style.opacity = opacity;
        }
    }

    _handleSwipeEnd() {
        if (this._isSwiping && this._element) {
            const computedStyle = window.getComputedStyle(this._element);
            const transform = computedStyle.transform;
            const matrix = transform.match(/matrix.*\((.+)\)/);
            let translateX = 0;
            if (matrix) {
                const values = matrix[1].split(', ');
                translateX = parseFloat(values[4] || 0);
            }

            if (Math.abs(translateX) > 100) {
                this._handleDismiss();
            } else {
                this._element.style.transform = 'translateX(0)';
                this._element.style.opacity = '1';
                this._resumeTimer();
            }
        }
        this._isSwiping = false;
        this._touchStartX = 0;
        this._touchStartY = 0;
    }

    _handleKeyDown(e) {
        if (e.key === 'Escape') {
            this._handleDismiss();
        }
        if (e.key === 'Enter' || e.key === ' ') {
            const actionBtn = this._element?.querySelector('.toast-action');
            if (actionBtn && document.activeElement === actionBtn) {
                e.preventDefault();
                actionBtn.click();
            }
        }
    }

    _handleVisibilityChange() {
        if (document.hidden) {
            this._pauseTimer();
        } else if (this._isVisible) {
            this._resumeTimer();
        }
    }

    _showNextInQueue() {
        if (this._queue.length === 0) return;

        const next = this._queue.shift();
        const toast = new ToastNotification(next.options);
        toast._onDismiss = next.onDismiss;
        toast._onAction = next.onAction;
        toast.show();
    }

    _register() {
        if (!window._toastInstances) {
            window._toastInstances = [];
        }
        const existing = window._toastInstances.findIndex(t => t._id === this._id);
        if (existing === -1) {
            window._toastInstances.push(this);
        }
    }

    update(options) {
        if (!this._element || this._isDestroyed) return this;

        this.options = {
            ...this.options,
            ...options
        };

        if (options.message) {
            const msgEl = this._element.querySelector('.toast-message');
            if (msgEl) msgEl.textContent = options.message;
        }

        if (options.title) {
            const titleEl = this._element.querySelector('.toast-title');
            if (titleEl) titleEl.textContent = options.title;
        }

        if (options.type) {
            const colors = this._getColor(options.type);
            this._element.style.backgroundColor = colors.bg;
            this._element.style.borderColor = colors.border;
            const iconEl = this._element.querySelector('.toast-icon');
            if (iconEl) iconEl.textContent = this._getIcon(options.type);
        }

        if (options.duration) {
            this.options.duration = options.duration;
            this._resetTimer();
        }

        return this;
    }

    destroy() {
        if (this._isDestroyed) return;
        this._isDestroyed = true;

        this._pauseTimer();

        if (this._element && this._element.parentNode) {
            this._element.parentNode.removeChild(this._element);
        }

        document.removeEventListener('visibilitychange', this._handleVisibilityChange);

        this._element = null;
        this._container = null;
        this._progressElement = null;

        const instances = window._toastInstances || [];
        const index = instances.findIndex(t => t._id === this._id);
        if (index !== -1) {
            instances.splice(index, 1);
        }

        eventBus.emit('toast:destroy', {
            id: this._id
        });
    }

    static success(message, options = {}) {
        return new ToastNotification({
            type: 'success',
            message: message,
            title: options.title || 'Success',
            icon: options.icon || '✅',
            ...options
        }).show();
    }

    static error(message, options = {}) {
        return new ToastNotification({
            type: 'error',
            message: message,
            title: options.title || 'Error',
            icon: options.icon || '❌',
            ...options
        }).show();
    }

    static warning(message, options = {}) {
        return new ToastNotification({
            type: 'warning',
            message: message,
            title: options.title || 'Warning',
            icon: options.icon || '⚠️',
            ...options
        }).show();
    }

    static info(message, options = {}) {
        return new ToastNotification({
            type: 'info',
            message: message,
            title: options.title || 'Info',
            icon: options.icon || 'ℹ️',
            ...options
        }).show();
    }

    static loading(message, options = {}) {
        return new ToastNotification({
            type: 'loading',
            message: message,
            title: options.title || 'Loading...',
            duration: 0,
            showProgress: false,
            icon: options.icon || '⏳',
            ...options
        }).show();
    }

    static custom(options) {
        return new ToastNotification({
            type: 'custom',
            ...options
        }).show();
    }

    static dismissAll() {
        const containers = document.querySelectorAll('[id^="toast-container-"]');
        containers.forEach(function(container) {
            const toasts = container.querySelectorAll('.toast-notification');
            toasts.forEach(function(toast) {
                const toastId = toast.dataset.toastId;
                if (toastId) {
                    const instances = window._toastInstances || [];
                    const instance = instances.find(function(t) {
                        return t._id === toastId;
                    });
                    if (instance) {
                        instance.dismiss();
                    }
                }
            });
        });
    }

    static getActiveToasts() {
        const toasts = [];
        const containers = document.querySelectorAll('[id^="toast-container-"]');
        containers.forEach(function(container) {
            const toastEls = container.querySelectorAll('.toast-notification');
            toastEls.forEach(function(el) {
                const toastId = el.dataset.toastId;
                if (toastId) {
                    const instances = window._toastInstances || [];
                    const instance = instances.find(function(t) {
                        return t._id === toastId;
                    });
                    if (instance && instance._isVisible) {
                        toasts.push(instance);
                    }
                }
            });
        });
        return toasts;
    }

    static setDefaults(config) {
        ToastNotification.DEFAULT_CONFIG = {
            ...ToastNotification.DEFAULT_CONFIG,
            ...config
        };
    }
}

// CSS Styles
const style = document.createElement('style');
style.id = 'toast-styles-v7';
style.textContent = `
    @keyframes toastSlideDown {
        0% { opacity: 0; transform: translateY(-60px) scale(0.96); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes toastSlideUp {
        0% { opacity: 0; transform: translateY(60px) scale(0.96); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes toastSlideLeft {
        0% { opacity: 0; transform: translateX(60px) scale(0.96); }
        100% { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes toastSlideRight {
        0% { opacity: 0; transform: translateX(-60px) scale(0.96); }
        100% { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes toastZoomIn {
        0% { opacity: 0; transform: scale(0.8) translateY(20px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes toastSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    .toast-container {
        pointer-events: none;
    }
    .toast-container .toast-notification {
        pointer-events: auto;
    }
    .toast-container .toast-notification:last-child {
        margin-bottom: 0;
    }
    .toast-container .toast-notification .toast-action {
        font-weight: 600;
    }
    .toast-container .toast-notification .toast-action:focus-visible {
        outline: 2px solid rgba(255,255,255,0.5);
        outline-offset: 2px;
    }
    .toast-container .toast-notification .toast-dismiss:focus-visible {
        outline: 2px solid rgba(255,255,255,0.5);
        outline-offset: 2px;
    }
    .toast-notification:focus-visible {
        outline: 2px solid rgba(255,255,255,0.3);
        outline-offset: 2px;
    }
    @media (max-width: 480px) {
        .toast-container {
            padding: 8px;
            max-width: 100%;
        }
        .toast-container .toast-notification {
            min-width: auto;
            max-width: 100%;
            padding: 14px 16px;
            border-radius: 12px;
        }
        .toast-container .toast-notification .toast-icon {
            font-size: 20px;
            width: 30px;
            height: 30px;
        }
        .toast-container .toast-notification .toast-title {
            font-size: 14px;
        }
        .toast-container .toast-notification .toast-message {
            font-size: 12px;
        }
        .toast-container .toast-notification .toast-action {
            font-size: 11px;
            padding: 4px 12px;
        }
    }
    @media (prefers-color-scheme: dark) {
        .toast-container .toast-notification.custom {
            background: #1f2937;
            color: #f3f4f6;
            border-color: #374151;
        }
    }
    @media (max-width: 768px) {
        .toast-container.toast-container-center {
            max-width: 90%;
        }
    }
`;

if (!document.getElementById('toast-styles-v7')) {
    document.head.appendChild(style);
}

if (typeof window !== 'undefined') {
    window.ToastNotification = ToastNotification;
}

export default ToastNotification;

export const showToast = ToastNotification.info;
export const showSuccess = ToastNotification.success;
export const showError = ToastNotification.error;
export const showWarning = ToastNotification.warning;
export const showInfo = ToastNotification.info;
export const showLoading = ToastNotification.loading;
export const dismissAllToasts = ToastNotification.dismissAll;