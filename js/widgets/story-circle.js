// ============================================================
// FILE: js/widgets/story-circle.js
// PURPOSE: Instagram-style story circle component with ring animation
// DEPENDENCY: constants.js, helpers.js, event-bus.js
// USED BY: home-screen.js, social-feed.js, story-viewer.js
// ============================================================

import { APP_CONSTANTS } from '../utils/constants.js';
import { formatTimeAgo } from '../utils/helpers.js';
import { EventBus } from '../state/event-bus.js';

export class StoryCircle {
    constructor(options = {}) {
        this.story = options.story || {};
        this.userId = options.userId || this.story.userId || '';
        this.userName = options.userName || this.story.userName || 'User';
        this.userPhoto = options.userPhoto || this.story.userPhoto || '';
        this.media = options.media || this.story.media || '';
        this.mediaType = options.mediaType || this.story.mediaType || 'image';
        this.isViewed = options.isViewed || this.story.isViewed || false;
        this.isOwn = options.isOwn || this.story.isOwn || false;
        this.hasUnseen = options.hasUnseen || this.story.hasUnseen || false;
        this.storyCount = options.storyCount || this.story.storyCount || 1;
        this.size = options.size || 'medium';
        this.showName = options.showName !== false;
        this.showStatus = options.showStatus !== false;
        this.onClick = options.onClick || null;
        this.onLongPress = options.onLongPress || null;
        this.onUserClick = options.onUserClick || null;
        this.element = null;
        this.isDestroyed = false;
        this.longPressTimer = null;
        this.isLongPress = false;
        this.render = this.render.bind(this);
        this.destroy = this.destroy.bind(this);
        this.markAsViewed = this.markAsViewed.bind(this);
        this._handleClick = this._handleClick.bind(this);
        this._handleTouchStart = this._handleTouchStart.bind(this);
        this._handleTouchEnd = this._handleTouchEnd.bind(this);
        this._handleMouseEnter = this._handleMouseEnter.bind(this);
        this._handleMouseLeave = this._handleMouseLeave.bind(this);
        if (!this.userId && !this.story.userId) {
            console.warn('[StoryCircle] userId is required');
            return;
        }
    }

    render() {
        if (this.isDestroyed) return null;
        this.element = document.createElement('div');
        this.element.className = 'story-circle-wrapper';
        this.element.dataset.userId = this.userId || this.story.userId;
        this.element.dataset.storyId = this.story.id || '';
        this.element.setAttribute('role', 'button');
        this.element.setAttribute('tabindex', '0');
        this.element.setAttribute('aria-label', 'Story from ' + this.userName);
        this.element.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            font-family: inherit;
            transition: transform 0.2s ease;
            -webkit-tap-highlight-color: transparent;
            user-select: none;
            position: relative;
        `;
        const sizeMap = {
            small: { container: 56, ring: 60, avatar: 48, fontSize: 11 },
            medium: { container: 72, ring: 76, avatar: 62, fontSize: 13 },
            large: { container: 96, ring: 100, avatar: 84, fontSize: 15 }
        };
        const size = sizeMap[this.size] || sizeMap.medium;
        const ring = document.createElement('div');
        ring.className = 'story-ring';
        ring.style.cssText = `
            position: relative;
            width: ${size.ring}px;
            height: ${size.ring}px;
            border-radius: 50%;
            padding: 2px;
            background: ${this._getRingColor()};
            transition: all 0.3s ease;
            flex-shrink: 0;
        `;
        if (this.isViewed) {
            ring.style.background = 'var(--story-viewed-color, #9ca3af)';
        }
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'story-avatar-container';
        avatarContainer.style.cssText = `
            width: ${size.container}px;
            height: ${size.container}px;
            border-radius: 50%;
            overflow: hidden;
            border: 2px solid var(--story-avatar-border, #ffffff);
            background: var(--story-avatar-bg, #e5e7eb);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        `;
        const avatar = document.createElement('img');
        avatar.className = 'story-avatar';
        avatar.src = this.userPhoto || APP_CONSTANTS.DEFAULT_AVATAR || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239ca3af"%3E%3Ccircle cx="12" cy="8" r="5"/%3E%3Cpath d="M4 20c0-4 4-6 8-6s8 2 8 6"/%3E%3C/svg%3E';
        avatar.alt = this.userName || 'User';
        avatar.loading = 'lazy';
        avatar.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            transition: transform 0.3s ease;
        `;
        avatarContainer.appendChild(avatar);
        ring.appendChild(avatarContainer);
        if (this.hasUnseen && !this.isViewed) {
            const pulse = document.createElement('div');
            pulse.className = 'story-pulse';
            pulse.style.cssText = `
                position: absolute;
                top: -4px;
                left: -4px;
                right: -4px;
                bottom: -4px;
                border-radius: 50%;
                border: 3px solid var(--story-unseen-color, #6366f1);
                animation: storyPulse 2s ease-in-out infinite;
                opacity: 0.4;
                pointer-events: none;
            `;
            ring.appendChild(pulse);
        }
        if (this.storyCount > 1) {
            const badge = document.createElement('span');
            badge.className = 'story-count-badge';
            badge.textContent = this.storyCount;
            badge.style.cssText = `
                position: absolute;
                bottom: -2px;
                right: -2px;
                background: var(--primary-color, #6366f1);
                color: #fff;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                font-size: 10px;
                font-weight: 700;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid var(--story-avatar-border, #ffffff);
                pointer-events: none;
            `;
            ring.appendChild(badge);
        }
        if (this.isOwn) {
            const addBadge = document.createElement('div');
            addBadge.className = 'story-add-badge';
            addBadge.textContent = '+';
            addBadge.style.cssText = `
                position: absolute;
                bottom: 0;
                right: 0;
                background: var(--primary-color, #6366f1);
                color: #fff;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                font-size: 16px;
                font-weight: 700;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid var(--story-avatar-border, #ffffff);
                pointer-events: none;
                box-shadow: 0 2px 8px rgba(99,102,241,0.3);
            `;
            ring.appendChild(addBadge);
        }
        if (this.showStatus && !this.isViewed) {
            const statusDot = document.createElement('div');
            statusDot.className = 'story-status-dot';
            statusDot.style.cssText = `
                position: absolute;
                top: 0;
                right: 0;
                width: 12px;
                height: 12px;
                background: var(--success-color, #22c55e);
                border-radius: 50%;
                border: 2px solid var(--story-avatar-border, #ffffff);
                pointer-events: none;
            `;
            ring.appendChild(statusDot);
        }
        this.element.appendChild(ring);
        if (this.showName) {
            const name = document.createElement('span');
            name.className = 'story-username';
            name.textContent = this.userName;
            name.style.cssText = `
                font-size: ${size.fontSize}px;
                color: var(--text-primary, #1f2937);
                text-align: center;
                max-width: ${size.container + 16}px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-weight: 500;
                transition: color 0.2s ease;
            `;
            if (this.isViewed) {
                name.style.color = 'var(--text-muted, #9ca3af)';
            }
            this.element.appendChild(name);
        }
        this._bindEvents();
        EventBus.emit('story:circle:render', {
            userId: this.userId || this.story.userId,
            storyId: this.story.id,
            isViewed: this.isViewed
        });
        return this.element;
    }

    _getRingColor() {
        if (this.isViewed) return 'var(--story-viewed-color, #9ca3af)';
        if (this.hasUnseen) return 'var(--story-unseen-gradient, linear-gradient(135deg, #f97316, #6366f1, #ec4899))';
        return 'var(--story-default-gradient, linear-gradient(135deg, #f59e0b, #ef4444, #ec4899))';
    }

    _bindEvents() {
        if (!this.element) return;
        this.element.addEventListener('click', this._handleClick);
        this.element.addEventListener('touchstart', this._handleTouchStart, { passive: true });
        this.element.addEventListener('touchend', this._handleTouchEnd, { passive: true });
        this.element.addEventListener('touchcancel', this._handleTouchEnd, { passive: true });
        this.element.addEventListener('mousedown', this._handleTouchStart);
        this.element.addEventListener('mouseup', this._handleTouchEnd);
        this.element.addEventListener('mouseenter', this._handleMouseEnter);
        this.element.addEventListener('mouseleave', this._handleMouseLeave);
        this.element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this._handleClick(e);
            }
        });
    }

    _handleClick(e) {
        if (this.isLongPress) {
            this.isLongPress = false;
            return;
        }
        if (this.onClick) {
            this.onClick(this.userId || this.story.userId, this.story);
        } else {
            EventBus.emit('story:view', {
                userId: this.userId || this.story.userId,
                story: this.story
            });
        }
        EventBus.emit('story:circle:click', {
            userId: this.userId || this.story.userId,
            storyId: this.story.id
        });
    }

    _handleTouchStart(e) {
        this.isLongPress = false;
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
        }
        this.longPressTimer = setTimeout(() => {
            this.isLongPress = true;
            if (this.onLongPress) {
                this.onLongPress(this.userId || this.story.userId, this.story);
            } else {
                EventBus.emit('story:longpress', {
                    userId: this.userId || this.story.userId,
                    story: this.story
                });
            }
        }, 600);
        const avatar = this.element.querySelector('.story-avatar');
        if (avatar) {
            avatar.style.transform = 'scale(0.92)';
        }
    }

    _handleTouchEnd() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        setTimeout(() => {
            this.isLongPress = false;
        }, 100);
        const avatar = this.element.querySelector('.story-avatar');
        if (avatar) {
            avatar.style.transform = 'scale(1)';
        }
    }

    _handleMouseEnter() {
        if (this.element) {
            this.element.style.transform = 'scale(1.05)';
        }
        const ring = this.element?.querySelector('.story-ring');
        if (ring) {
            ring.style.transform = 'scale(1.02)';
            ring.style.boxShadow = '0 4px 16px rgba(99,102,241,0.25)';
        }
        const avatar = this.element?.querySelector('.story-avatar');
        if (avatar) {
            avatar.style.transform = 'scale(1.02)';
        }
    }

    _handleMouseLeave() {
        if (this.element) {
            this.element.style.transform = 'scale(1)';
        }
        const ring = this.element?.querySelector('.story-ring');
        if (ring) {
            ring.style.transform = 'scale(1)';
            ring.style.boxShadow = 'none';
        }
        const avatar = this.element?.querySelector('.story-avatar');
        if (avatar) {
            avatar.style.transform = 'scale(1)';
        }
    }

    markAsViewed() {
        if (this.isViewed) return;
        this.isViewed = true;
        this.hasUnseen = false;
        const ring = this.element?.querySelector('.story-ring');
        if (ring) {
            ring.style.background = 'var(--story-viewed-color, #9ca3af)';
            const pulse = ring.querySelector('.story-pulse');
            if (pulse) pulse.remove();
        }
        const name = this.element?.querySelector('.story-username');
        if (name) {
            name.style.color = 'var(--text-muted, #9ca3af)';
        }
        const statusDot = this.element?.querySelector('.story-status-dot');
        if (statusDot) statusDot.remove();
        EventBus.emit('story:viewed', {
            userId: this.userId || this.story.userId,
            storyId: this.story.id
        });
    }

    markAsUnseen() {
        if (!this.isViewed) return;
        this.isViewed = false;
        this.hasUnseen = true;
        const ring = this.element?.querySelector('.story-ring');
        if (ring) {
            ring.style.background = this._getRingColor();
            const pulse = document.createElement('div');
            pulse.className = 'story-pulse';
            pulse.style.cssText = `
                position: absolute;
                top: -4px;
                left: -4px;
                right: -4px;
                bottom: -4px;
                border-radius: 50%;
                border: 3px solid var(--story-unseen-color, #6366f1);
                animation: storyPulse 2s ease-in-out infinite;
                opacity: 0.4;
                pointer-events: none;
            `;
            ring.appendChild(pulse);
        }
        const name = this.element?.querySelector('.story-username');
        if (name) {
            name.style.color = 'var(--text-primary, #1f2937)';
        }
        EventBus.emit('story:unseen', {
            userId: this.userId || this.story.userId,
            storyId: this.story.id
        });
    }

    updateStoryCount(count) {
        this.storyCount = count || 1;
        const badge = this.element?.querySelector('.story-count-badge');
        if (badge) {
            badge.textContent = this.storyCount;
        } else if (this.storyCount > 1) {
            const ring = this.element?.querySelector('.story-ring');
            if (ring) {
                const newBadge = document.createElement('span');
                newBadge.className = 'story-count-badge';
                newBadge.textContent = this.storyCount;
                newBadge.style.cssText = `
                    position: absolute;
                    bottom: -2px;
                    right: -2px;
                    background: var(--primary-color, #6366f1);
                    color: #fff;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    font-size: 10px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid var(--story-avatar-border, #ffffff);
                    pointer-events: none;
                `;
                ring.appendChild(newBadge);
            }
        }
    }

    updateUserPhoto(photoUrl) {
        this.userPhoto = photoUrl;
        const avatar = this.element?.querySelector('.story-avatar');
        if (avatar) {
            avatar.src = photoUrl || APP_CONSTANTS.DEFAULT_AVATAR || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239ca3af"%3E%3Ccircle cx="12" cy="8" r="5"/%3E%3Cpath d="M4 20c0-4 4-6 8-6s8 2 8 6"/%3E%3C/svg%3E';
        }
    }

    updateUserName(name) {
        this.userName = name;
        const nameEl = this.element?.querySelector('.story-username');
        if (nameEl) {
            nameEl.textContent = name;
        }
    }

    destroy() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        EventBus.emit('story:circle:destroy', {
            userId: this.userId || this.story.userId
        });
    }

    static createWithStory(story, options) {
        return new StoryCircle({
            story: story,
            userId: story.userId,
            userName: story.userName,
            userPhoto: story.userPhoto,
            media: story.media,
            mediaType: story.mediaType,
            isViewed: story.isViewed,
            hasUnseen: story.hasUnseen,
            storyCount: story.storyCount || 1,
            ...options
        });
    }

    static createForUser(user, options) {
        return new StoryCircle({
            userId: user.id || user.uid,
            userName: user.displayName || user.name || 'User',
            userPhoto: user.photoURL || user.photo || '',
            hasUnseen: options.hasUnseen !== undefined ? options.hasUnseen : true,
            ...options
        });
    }

    static createOwn(options) {
        return new StoryCircle({
            isOwn: true,
            hasUnseen: false,
            storyCount: 0,
            ...options
        });
    }
}

export default StoryCircle;