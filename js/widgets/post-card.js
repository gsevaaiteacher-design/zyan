// ============================================================
// FILE: js/widgets/post-card.js
// PURPOSE: Instagram-style social post card component with all features
// DEPENDENCY: constants.js, helpers.js, event-bus.js
// USED BY: social-feed.js, home-screen.js, profile-screen.js
// ============================================================

import { APP_CONSTANTS } from '../utils/constants.js';
import { formatTimeAgo, debounce, generateUUID } from '../utils/helpers.js';
import { EventBus } from '../state/event-bus.js';

export class PostCard {
    constructor(options = {}) {
        this.post = options.post || {};
        this.currentUserId = options.currentUserId || '';
        this.isOwn = this.post.userId === this.currentUserId;
        this.showComments = options.showComments !== false;
        this.showReactions = options.showReactions !== false;
        this.showShares = options.showShares !== false;
        this.showBookmark = options.showBookmark !== false;
        this.showFullText = options.showFullText || false;
        this.maxTextLength = options.maxTextLength || 150;
        this.onLike = options.onLike || null;
        this.onComment = options.onComment || null;
        this.onShare = options.onShare || null;
        this.onBookmark = options.onBookmark || null;
        this.onUserClick = options.onUserClick || null;
        this.onPostClick = options.onPostClick || null;
        this.onReaction = options.onReaction || null;
        this.onReport = options.onReport || null;
        this.onDelete = options.onDelete || null;
        this.onEdit = options.onEdit || null;
        this.element = null;
        this.isDestroyed = false;
        this.isLiked = false;
        this.isBookmarked = false;
        this.showCommentsList = false;
        this.likeCount = 0;
        this.commentCount = 0;
        this.shareCount = 0;
        this.bookmarkCount = 0;
        this.render = this.render.bind(this);
        this.destroy = this.destroy.bind(this);
        this.toggleLike = this.toggleLike.bind(this);
        this.toggleBookmark = this.toggleBookmark.bind(this);
        this.toggleComments = this.toggleComments.bind(this);
        this.handleShare = this.handleShare.bind(this);
        this.handleUserClick = this.handleUserClick.bind(this);
        this.handlePostClick = this.handlePostClick.bind(this);
        this.handleReaction = this.handleReaction.bind(this);
        this.handleReport = this.handleReport.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.handleEdit = this.handleEdit.bind(this);
        this.updateStats = this.updateStats.bind(this);
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._handleClickOutside = this._handleClickOutside.bind(this);
        if (!this.post || !this.post.id) {
            console.warn('[PostCard] Invalid post data');
            return;
        }
        this.likeCount = this.post.likes || 0;
        this.commentCount = this.post.comments || 0;
        this.shareCount = this.post.shares || 0;
        this.bookmarkCount = this.post.saves || 0;
        this.isLiked = this.post.isLiked || false;
        this.isBookmarked = this.post.isBookmarked || false;
    }

    render() {
        if (this.isDestroyed || !this.post || !this.post.id) return null;
        this.element = document.createElement('div');
        this.element.className = 'post-card-container';
        this.element.dataset.postId = this.post.id;
        this.element.dataset.userId = this.post.userId;
        this.element.setAttribute('role', 'article');
        this.element.setAttribute('aria-label', 'Post by ' + (this.post.userName || 'User'));
        this.element.style.cssText = `
            background: var(--post-bg, #ffffff);
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
            border: 1px solid var(--border-color, #e5e7eb);
            font-family: inherit;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        `;
        this.element.addEventListener('mouseenter', () => {
            this.element.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
        });
        this.element.addEventListener('mouseleave', () => {
            this.element.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
        });
        const header = this._createHeader();
        this.element.appendChild(header);
        const content = this._createContent();
        this.element.appendChild(content);
        if (this.post.images && this.post.images.length > 0) {
            const media = this._createMedia();
            this.element.appendChild(media);
        }
        const stats = this._createStats();
        this.element.appendChild(stats);
        const actions = this._createActions();
        this.element.appendChild(actions);
        const caption = this._createCaption();
        this.element.appendChild(caption);
        if (this.showComments) {
            const commentSection = this._createCommentSection();
            this.element.appendChild(commentSection);
        }
        this._bindEvents();
        EventBus.emit('post:card:render', {
            postId: this.post.id,
            userId: this.post.userId
        });
        return this.element;
    }

    _createHeader() {
        const header = document.createElement('div');
        header.className = 'post-header';
        header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
        `;
        const left = document.createElement('div');
        left.className = 'post-header-left';
        left.style.cssText = 'display: flex; align-items: center; gap: 10px; cursor: pointer;';
        left.addEventListener('click', () => this.handleUserClick());
        const avatar = document.createElement('img');
        avatar.className = 'post-avatar';
        avatar.src = this.post.userPhoto || APP_CONSTANTS.DEFAULT_AVATAR || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239ca3af"%3E%3Ccircle cx="12" cy="8" r="5"/%3E%3Cpath d="M4 20c0-4 4-6 8-6s8 2 8 6"/%3E%3C/svg%3E';
        avatar.alt = this.post.userName || 'User';
        avatar.style.cssText = `
            width: 36px;
            height: 36px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid var(--border-color, #e5e7eb);
        `;
        avatar.loading = 'lazy';
        const userInfo = document.createElement('div');
        userInfo.className = 'post-user-info';
        const name = document.createElement('span');
        name.className = 'post-username';
        name.textContent = this.post.userName || 'User';
        name.style.cssText = `
            font-weight: 600;
            font-size: 14px;
            color: var(--text-primary, #1f2937);
        `;
        const time = document.createElement('span');
        time.className = 'post-time';
        time.textContent = ' • ' + formatTimeAgo(this.post.createdAt);
        time.style.cssText = `
            font-size: 12px;
            color: var(--text-muted, #9ca3af);
        `;
        userInfo.appendChild(name);
        userInfo.appendChild(time);
        left.appendChild(avatar);
        left.appendChild(userInfo);
        header.appendChild(left);
        const right = document.createElement('div');
        right.className = 'post-header-right';
        right.style.cssText = 'display: flex; align-items: center; gap: 4px; position: relative;';
        const moreBtn = document.createElement('button');
        moreBtn.className = 'post-more-btn';
        moreBtn.innerHTML = '⋯';
        moreBtn.setAttribute('aria-label', 'More options');
        moreBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: var(--text-secondary, #6b7280);
            padding: 4px 8px;
            border-radius: 4px;
            transition: background 0.2s;
        `;
        moreBtn.addEventListener('mouseenter', () => {
            moreBtn.style.background = 'var(--hover-bg, #f3f4f6)';
        });
        moreBtn.addEventListener('mouseleave', () => {
            moreBtn.style.background = 'transparent';
        });
        moreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._showMoreMenu(e);
        });
        right.appendChild(moreBtn);
        header.appendChild(right);
        return header;
    }

    _showMoreMenu(e) {
        const existing = this.element.querySelector('.post-more-menu');
        if (existing) {
            existing.remove();
            return;
        }
        const menu = document.createElement('div');
        menu.className = 'post-more-menu';
        menu.style.cssText = `
            position: absolute;
            top: 30px;
            right: 0;
            background: var(--menu-bg, #ffffff);
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            min-width: 180px;
            padding: 6px 0;
            z-index: 100;
            border: 1px solid var(--border-color, #e5e7eb);
        `;
        const items = [
            { id: 'report', icon: '🚩', label: 'Report', handler: this.handleReport },
            { id: 'copy', icon: '📋', label: 'Copy link', handler: () => this._copyLink() }
        ];
        if (this.isOwn) {
            items.push({ id: 'edit', icon: '✏️', label: 'Edit post', handler: this.handleEdit });
            items.push({ id: 'delete', icon: '🗑️', label: 'Delete post', handler: this.handleDelete });
        }
        items.forEach((item) => {
            const btn = document.createElement('button');
            btn.className = 'post-menu-item';
            btn.dataset.id = item.id;
            btn.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
                padding: 8px 16px;
                border: none;
                background: none;
                cursor: pointer;
                font-size: 14px;
                color: var(--text-primary, #1f2937);
                transition: background 0.15s ease;
                font-family: inherit;
                text-align: left;
            `;
            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'var(--hover-bg, #f3f4f6)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'transparent';
            });
            const icon = document.createElement('span');
            icon.textContent = item.icon;
            icon.style.fontSize = '16px';
            const label = document.createElement('span');
            label.textContent = item.label;
            btn.appendChild(icon);
            btn.appendChild(label);
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.remove();
                item.handler();
            });
            menu.appendChild(btn);
        });
        const parent = e.target.closest('.post-header-right');
        if (parent) {
            parent.appendChild(menu);
            setTimeout(() => {
                const first = menu.querySelector('.post-menu-item');
                if (first) first.focus();
            }, 50);
        }
        document.addEventListener('click', function closeMenu(ev) {
            if (!menu.contains(ev.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }

    _copyLink() {
        const url = window.location.origin + '/post/' + this.post.id;
        navigator.clipboard.writeText(url).then(() => {
            EventBus.emit('toast:show', {
                message: 'Post link copied to clipboard',
                type: 'success'
            });
        }).catch(() => {
            EventBus.emit('toast:show', {
                message: 'Failed to copy link',
                type: 'error'
            });
        });
    }

    _createContent() {
        const content = document.createElement('div');
        content.className = 'post-content';
        content.style.cssText = 'padding: 0 16px;';
        if (this.post.content) {
            const text = document.createElement('div');
            text.className = 'post-text';
            let displayText = this.post.content;
            if (!this.showFullText && displayText.length > this.maxTextLength) {
                displayText = displayText.substring(0, this.maxTextLength) + '...';
                const readMore = document.createElement('span');
                readMore.textContent = ' See more';
                readMore.style.cssText = `
                    color: var(--primary-color, #6366f1);
                    cursor: pointer;
                    font-weight: 500;
                `;
                readMore.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showFullText = true;
                    const parent = e.target.closest('.post-text');
                    if (parent) {
                        parent.textContent = this.post.content;
                    }
                });
                text.textContent = displayText;
                text.appendChild(readMore);
            } else {
                text.textContent = this.post.content;
            }
            text.style.cssText = `
                font-size: 14px;
                line-height: 1.6;
                color: var(--text-primary, #1f2937);
                white-space: pre-wrap;
                word-wrap: break-word;
                padding: 4px 0 8px;
            `;
            this._processText(text);
            content.appendChild(text);
        }
        if (this.post.tags && this.post.tags.length > 0) {
            const tags = document.createElement('div');
            tags.className = 'post-tags';
            tags.style.cssText = `
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                padding: 4px 0 8px;
            `;
            this.post.tags.forEach((tag) => {
                const t = document.createElement('span');
                t.className = 'post-tag';
                t.textContent = '#' + tag;
                t.style.cssText = `
                    color: var(--primary-color, #6366f1);
                    font-size: 13px;
                    cursor: pointer;
                    font-weight: 500;
                `;
                t.addEventListener('click', (e) => {
                    e.stopPropagation();
                    EventBus.emit('search:tag', { tag: tag });
                });
                tags.appendChild(t);
            });
            content.appendChild(tags);
        }
        if (this.post.location) {
            const location = document.createElement('div');
            location.className = 'post-location';
            location.textContent = '📍 ' + this.post.location;
            location.style.cssText = `
                font-size: 12px;
                color: var(--text-muted, #9ca3af);
                padding: 2px 0 6px;
            `;
            content.appendChild(location);
        }
        return content;
    }

    _processText(element) {
        const text = element.textContent || '';
        const regex = /@(\w+)/g;
        const hashtagRegex = /#(\w+)/g;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(/(@\w+|#\w+|https?:\/\/[^\s]+)/g);
        if (parts.length > 1) {
            element.innerHTML = '';
            parts.forEach((part) => {
                if (part.match(/^@\w+/)) {
                    const mention = document.createElement('span');
                    mention.className = 'post-mention';
                    mention.textContent = part;
                    mention.style.cssText = `
                        color: var(--primary-color, #6366f1);
                        cursor: pointer;
                        font-weight: 500;
                    `;
                    mention.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const username = part.substring(1);
                        EventBus.emit('user:profile', { username: username });
                    });
                    element.appendChild(mention);
                } else if (part.match(/^#\w+/)) {
                    const tag = document.createElement('span');
                    tag.className = 'post-hashtag';
                    tag.textContent = part;
                    tag.style.cssText = `
                        color: var(--primary-color, #6366f1);
                        cursor: pointer;
                        font-weight: 500;
                    `;
                    tag.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const tagName = part.substring(1);
                        EventBus.emit('search:tag', { tag: tagName });
                    });
                    element.appendChild(tag);
                } else if (part.match(/^https?:\/\//)) {
                    const link = document.createElement('a');
                    link.className = 'post-link';
                    link.href = part;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    link.textContent = part;
                    link.style.cssText = `
                        color: var(--primary-color, #6366f1);
                        text-decoration: underline;
                        word-break: break-all;
                    `;
                    element.appendChild(link);
                } else {
                    element.appendChild(document.createTextNode(part));
                }
            });
        }
    }

    _createMedia() {
        const media = document.createElement('div');
        media.className = 'post-media';
        media.style.cssText = `
            width: 100%;
            position: relative;
            overflow: hidden;
            background: var(--media-bg, #f3f4f6);
        `;
        const images = this.post.images || [];
        if (images.length === 1) {
            const img = document.createElement('img');
            img.className = 'post-image';
            img.src = images[0];
            img.alt = this.post.content || 'Post image';
            img.loading = 'lazy';
            img.style.cssText = `
                width: 100%;
                height: auto;
                display: block;
                object-fit: cover;
                max-height: 600px;
            `;
            img.addEventListener('click', () => this.handlePostClick());
            media.appendChild(img);
        } else if (images.length > 1) {
            const grid = document.createElement('div');
            grid.className = 'post-image-grid';
            grid.style.cssText = `
                display: grid;
                grid-template-columns: repeat(${Math.min(images.length, 2)}, 1fr);
                gap: 2px;
            `;
            images.forEach((imgSrc, index) => {
                const wrapper = document.createElement('div');
                wrapper.style.cssText = `
                    position: relative;
                    overflow: hidden;
                    aspect-ratio: 1;
                    background: var(--media-bg, #f3f4f6);
                `;
                const img = document.createElement('img');
                img.className = 'post-image-grid-item';
                img.src = imgSrc;
                img.alt = 'Post image ' + (index + 1);
                img.loading = 'lazy';
                img.style.cssText = `
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                    transition: transform 0.3s ease;
                `;
                img.addEventListener('mouseenter', () => {
                    img.style.transform = 'scale(1.02)';
                });
                img.addEventListener('mouseleave', () => {
                    img.style.transform = 'scale(1)';
                });
                img.addEventListener('click', () => this.handlePostClick());
                wrapper.appendChild(img);
                if (index === 2 && images.length > 3) {
                    const overlay = document.createElement('div');
                    overlay.className = 'post-image-overlay';
                    overlay.textContent = '+' + (images.length - 3);
                    overlay.style.cssText = `
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0,0,0,0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #fff;
                        font-size: 28px;
                        font-weight: 600;
                        cursor: pointer;
                    `;
                    overlay.addEventListener('click', () => this.handlePostClick());
                    wrapper.appendChild(overlay);
                }
                grid.appendChild(wrapper);
            });
            media.appendChild(grid);
        }
        if (this.post.video) {
            const videoWrapper = document.createElement('div');
            videoWrapper.className = 'post-video-wrapper';
            videoWrapper.style.cssText = 'position: relative; width: 100%; background: #000;';
            const video = document.createElement('video');
            video.className = 'post-video';
            video.src = this.post.video;
            video.poster = this.post.thumbnail || (this.post.images && this.post.images[0]) || '';
            video.controls = true;
            video.playsInline = true;
            video.preload = 'metadata';
            video.style.cssText = 'width: 100%; height: auto; display: block; max-height: 600px;';
            videoWrapper.appendChild(video);
            media.appendChild(videoWrapper);
        }
        return media;
    }

    _createStats() {
        const stats = document.createElement('div');
        stats.className = 'post-stats';
        stats.style.cssText = `
            display: flex;
            padding: 8px 16px;
            gap: 16px;
            font-size: 13px;
            color: var(--text-secondary, #6b7280);
            border-bottom: 1px solid var(--border-light, #f3f4f6);
        `;
        const likeStat = document.createElement('span');
        likeStat.className = 'post-stat-like';
        likeStat.textContent = this.likeCount + ' likes';
        const commentStat = document.createElement('span');
        commentStat.className = 'post-stat-comment';
        commentStat.textContent = this.commentCount + ' comments';
        const shareStat = document.createElement('span');
        shareStat.className = 'post-stat-share';
        shareStat.textContent = this.shareCount + ' shares';
        stats.appendChild(likeStat);
        stats.appendChild(commentStat);
        stats.appendChild(shareStat);
        return stats;
    }

    _createActions() {
        const actions = document.createElement('div');
        actions.className = 'post-actions';
        actions.style.cssText = `
            display: flex;
            align-items: center;
            padding: 4px 8px;
            gap: 4px;
            border-bottom: 1px solid var(--border-light, #f3f4f6);
        `;
        const likeBtn = this._createActionButton(
            this.isLiked ? '❤️' : '🤍',
            'Like',
            this.toggleLike,
            this.isLiked ? 'var(--danger-color, #ef4444)' : 'var(--text-secondary, #6b7280)'
        );
        actions.appendChild(likeBtn);
        const commentBtn = this._createActionButton(
            '💬',
            'Comment',
            () => this.toggleComments()
        );
        actions.appendChild(commentBtn);
        if (this.showShares) {
            const shareBtn = this._createActionButton(
                '↗️',
                'Share',
                this.handleShare
            );
            actions.appendChild(shareBtn);
        }
        if (this.showBookmark) {
            const bookmarkBtn = this._createActionButton(
                this.isBookmarked ? '🔖' : '📑',
                'Save',
                this.toggleBookmark,
                this.isBookmarked ? 'var(--primary-color, #6366f1)' : 'var(--text-secondary, #6b7280)'
            );
            actions.appendChild(bookmarkBtn);
        }
        if (this.showReactions) {
            const reactionBtn = document.createElement('button');
            reactionBtn.className = 'post-reaction-btn';
            reactionBtn.textContent = '😊';
            reactionBtn.setAttribute('aria-label', 'Add reaction');
            reactionBtn.style.cssText = `
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                padding: 6px 10px;
                border-radius: 8px;
                transition: background 0.2s;
                margin-left: auto;
            `;
            reactionBtn.addEventListener('mouseenter', () => {
                reactionBtn.style.background = 'var(--hover-bg, #f3f4f6)';
            });
            reactionBtn.addEventListener('mouseleave', () => {
                reactionBtn.style.background = 'transparent';
            });
            reactionBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._showReactionPicker(e);
            });
            actions.appendChild(reactionBtn);
        }
        return actions;
    }

    _createActionButton(icon, label, handler, color) {
        const btn = document.createElement('button');
        btn.className = 'post-action-btn';
        btn.setAttribute('aria-label', label);
        btn.style.cssText = `
            display: flex;
            align-items: center;
            gap: 4px;
            background: none;
            border: none;
            cursor: pointer;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 14px;
            color: var(--text-secondary, #6b7280);
            transition: all 0.2s ease;
            font-family: inherit;
        `;
        const iconSpan = document.createElement('span');
        iconSpan.textContent = icon;
        iconSpan.style.fontSize = '18px';
        const labelSpan = document.createElement('span');
        labelSpan.textContent = label;
        labelSpan.style.fontSize = '13px';
        btn.appendChild(iconSpan);
        btn.appendChild(labelSpan);
        if (color) {
            btn.style.color = color;
        }
        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'var(--hover-bg, #f3f4f6)';
            if (!color) {
                btn.style.color = 'var(--primary-color, #6366f1)';
            }
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'transparent';
            if (!color) {
                btn.style.color = 'var(--text-secondary, #6b7280)';
            }
        });
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            handler();
        });
        return btn;
    }

    _showReactionPicker(e) {
        const existing = this.element.querySelector('.post-reaction-picker');
        if (existing) {
            existing.remove();
            return;
        }
        const reactions = ['❤️', '😍', '😂', '😮', '😢', '😡', '🎉', '🔥'];
        const picker = document.createElement('div');
        picker.className = 'post-reaction-picker';
        picker.style.cssText = `
            position: absolute;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--picker-bg, #ffffff);
            border-radius: 20px;
            padding: 6px 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            display: flex;
            gap: 6px;
            z-index: 50;
            border: 1px solid var(--border-color, #e5e7eb);
        `;
        reactions.forEach((emoji) => {
            const btn = document.createElement('button');
            btn.textContent = emoji;
            btn.style.cssText = `
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                padding: 4px 6px;
                border-radius: 50%;
                transition: transform 0.2s ease, background 0.2s;
            `;
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.3)';
                btn.style.background = 'var(--hover-bg, #f3f4f6)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
                btn.style.background = 'transparent';
            });
            btn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                this.handleReaction(emoji);
                picker.remove();
            });
            picker.appendChild(btn);
        });
        const parent = e.target.closest('.post-actions');
        if (parent) {
            parent.style.position = 'relative';
            parent.appendChild(picker);
        }
        setTimeout(() => {
            document.addEventListener('click', function closePicker(ev) {
                if (!picker.contains(ev.target)) {
                    picker.remove();
                    document.removeEventListener('click', closePicker);
                }
            });
        }, 10);
    }

    _createCaption() {
        const caption = document.createElement('div');
        caption.className = 'post-caption';
        caption.style.cssText = `
            padding: 8px 16px 4px;
            font-size: 14px;
            color: var(--text-primary, #1f2937);
        `;
        return caption;
    }

    _createCommentSection() {
        const section = document.createElement('div');
        section.className = 'post-comment-section';
        section.style.cssText = `
            padding: 0 16px 12px;
            display: ${this.showCommentsList ? 'block' : 'none'};
        `;
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'post-comment-input-wrapper';
        inputWrapper.style.cssText = `
            display: flex;
            gap: 8px;
            align-items: center;
            padding: 8px 0;
        `;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'post-comment-input';
        input.placeholder = 'Write a comment...';
        input.style.cssText = `
            flex: 1;
            padding: 8px 14px;
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: 20px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
            background: var(--input-bg, #f9fafb);
            color: var(--text-primary, #1f2937);
        `;
        input.addEventListener('focus', () => {
            input.style.borderColor = 'var(--primary-color, #6366f1)';
            input.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
        });
        input.addEventListener('blur', () => {
            input.style.borderColor = 'var(--border-color, #e5e7eb)';
            input.style.boxShadow = 'none';
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const text = input.value.trim();
                if (text) {
                    this.handleComment(text);
                    input.value = '';
                }
            }
        });
        const submitBtn = document.createElement('button');
        submitBtn.className = 'post-comment-submit';
        submitBtn.textContent = 'Post';
        submitBtn.style.cssText = `
            background: var(--primary-color, #6366f1);
            color: #fff;
            border: none;
            border-radius: 20px;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
        `;
        submitBtn.addEventListener('mouseenter', () => {
            submitBtn.style.background = 'var(--primary-dark, #4f46e5)';
        });
        submitBtn.addEventListener('mouseleave', () => {
            submitBtn.style.background = 'var(--primary-color, #6366f1)';
        });
        submitBtn.addEventListener('click', () => {
            const text = input.value.trim();
            if (text) {
                this.handleComment(text);
                input.value = '';
            }
        });
        inputWrapper.appendChild(input);
        inputWrapper.appendChild(submitBtn);
        section.appendChild(inputWrapper);
        const commentsList = document.createElement('div');
        commentsList.className = 'post-comments-list';
        commentsList.style.cssText = `
            max-height: 200px;
            overflow-y: auto;
        `;
        section.appendChild(commentsList);
        return section;
    }

    toggleLike() {
        this.isLiked = !this.isLiked;
        this.likeCount += this.isLiked ? 1 : -1;
        if (this.onLike) {
            this.onLike(this.post.id, this.isLiked);
        }
        this.updateStats();
        EventBus.emit('post:like', {
            postId: this.post.id,
            liked: this.isLiked,
            count: this.likeCount
        });
        const likeBtn = this.element.querySelector('.post-action-btn:first-child');
        if (likeBtn) {
            const icon = likeBtn.querySelector('span:first-child');
            if (icon) {
                icon.textContent = this.isLiked ? '❤️' : '🤍';
            }
            likeBtn.style.color = this.isLiked ? 'var(--danger-color, #ef4444)' : 'var(--text-secondary, #6b7280)';
        }
    }

    toggleBookmark() {
        this.isBookmarked = !this.isBookmarked;
        this.bookmarkCount += this.isBookmarked ? 1 : -1;
        if (this.onBookmark) {
            this.onBookmark(this.post.id, this.isBookmarked);
        }
        EventBus.emit('post:bookmark', {
            postId: this.post.id,
            bookmarked: this.isBookmarked
        });
        const bookmarkBtns = this.element.querySelectorAll('.post-action-btn');
        bookmarkBtns.forEach((btn) => {
            if (btn.textContent.includes('Save') || btn.textContent.includes('📑') || btn.textContent.includes('🔖')) {
                const icon = btn.querySelector('span:first-child');
                if (icon) {
                    icon.textContent = this.isBookmarked ? '🔖' : '📑';
                }
                btn.style.color = this.isBookmarked ? 'var(--primary-color, #6366f1)' : 'var(--text-secondary, #6b7280)';
            }
        });
    }

    toggleComments() {
        this.showCommentsList = !this.showCommentsList;
        const section = this.element.querySelector('.post-comment-section');
        if (section) {
            section.style.display = this.showCommentsList ? 'block' : 'none';
            if (this.showCommentsList) {
                const input = section.querySelector('.post-comment-input');
                if (input) setTimeout(() => input.focus(), 100);
            }
        }
        EventBus.emit('post:comments:toggle', {
            postId: this.post.id,
            open: this.showCommentsList
        });
    }

    handleShare() {
        const url = window.location.origin + '/post/' + this.post.id;
        if (navigator.share) {
            navigator.share({
                title: this.post.content || 'Post',
                text: this.post.content || '',
                url: url
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(url).then(() => {
                EventBus.emit('toast:show', {
                    message: 'Post link copied to clipboard',
                    type: 'success'
                });
            }).catch(() => {
                EventBus.emit('toast:show', {
                    message: 'Share: ' + url,
                    type: 'info'
                });
            });
        }
        this.shareCount += 1;
        if (this.onShare) {
            this.onShare(this.post.id);
        }
        EventBus.emit('post:share', {
            postId: this.post.id,
            shareCount: this.shareCount
        });
        this.updateStats();
    }

    handleComment(text) {
        if (this.onComment) {
            this.onComment(this.post.id, text);
        }
        this.commentCount += 1;
        EventBus.emit('post:comment', {
            postId: this.post.id,
            text: text
        });
        this.updateStats();
    }

    handleUserClick() {
        if (this.onUserClick) {
            this.onUserClick(this.post.userId);
        } else {
            EventBus.emit('user:profile', { userId: this.post.userId });
        }
    }

    handlePostClick() {
        if (this.onPostClick) {
            this.onPostClick(this.post.id);
        } else {
            EventBus.emit('post:detail', { postId: this.post.id });
        }
    }

    handleReaction(emoji) {
        if (this.onReaction) {
            this.onReaction(this.post.id, emoji);
        }
        EventBus.emit('post:reaction', {
            postId: this.post.id,
            emoji: emoji
        });
        EventBus.emit('toast:show', {
            message: 'Reacted with ' + emoji,
            type: 'success'
        });
    }

    handleReport() {
        if (this.onReport) {
            this.onReport(this.post.id);
        } else {
            EventBus.emit('modal:show', {
                title: 'Report Post',
                content: 'Are you sure you want to report this post?',
                confirmText: 'Report',
                cancelText: 'Cancel',
                onConfirm: () => {
                    EventBus.emit('post:report', {
                        postId: this.post.id,
                        userId: this.post.userId
                    });
                }
            });
        }
    }

    handleDelete() {
        if (this.onDelete) {
            this.onDelete(this.post.id);
        } else {
            EventBus.emit('modal:show', {
                title: 'Delete Post',
                content: 'Are you sure you want to delete this post? This cannot be undone.',
                confirmText: 'Delete',
                cancelText: 'Cancel',
                confirmVariant: 'danger',
                onConfirm: () => {
                    EventBus.emit('post:delete', {
                        postId: this.post.id
                    });
                    this.destroy();
                }
            });
        }
    }

    handleEdit() {
        if (this.onEdit) {
            this.onEdit(this.post);
        } else {
            EventBus.emit('post:edit', { post: this.post });
        }
    }

    updateStats() {
        const stats = this.element.querySelector('.post-stats');
        if (stats) {
            const likeStat = stats.querySelector('.post-stat-like');
            const commentStat = stats.querySelector('.post-stat-comment');
            const shareStat = stats.querySelector('.post-stat-share');
            if (likeStat) likeStat.textContent = this.likeCount + ' likes';
            if (commentStat) commentStat.textContent = this.commentCount + ' comments';
            if (shareStat) shareStat.textContent = this.shareCount + ' shares';
        }
    }

    _bindEvents() {
        if (!this.element) return;
        this.element.addEventListener('keydown', this._handleKeyDown);
        document.addEventListener('click', this._handleClickOutside);
    }

    _handleKeyDown(e) {
        if (e.key === 'Escape') {
            const menu = this.element.querySelector('.post-more-menu');
            if (menu) menu.remove();
            const picker = this.element.querySelector('.post-reaction-picker');
            if (picker) picker.remove();
        }
    }

    _handleClickOutside(e) {
        if (this.element && !this.element.contains(e.target)) {
            const menu = this.element.querySelector('.post-more-menu');
            if (menu) menu.remove();
            const picker = this.element.querySelector('.post-reaction-picker');
            if (picker) picker.remove();
        }
    }

    destroy() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        document.removeEventListener('click', this._handleClickOutside);
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        EventBus.emit('post:card:destroy', {
            postId: this.post.id
        });
    }

    static create(options) {
        return new PostCard(options);
    }
}

export default PostCard;