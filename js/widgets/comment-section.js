// ============================================================
// FILE: js/widgets/comment-section.js
// PURPOSE: Instagram-style comment section with replies, likes, mentions
// DEPENDENCY: constants.js, helpers.js, event-bus.js
// USED BY: social-feed.js, post-detail.js, product-detail.js
// ============================================================

import { APP_CONSTANTS } from '../utils/constants.js';
import { formatTimeAgo, escapeHtml, debounce } from '../utils/helpers.js';
import { EventBus } from '../state/event-bus.js';

export class CommentSection {
    constructor(options = {}) {
        this.postId = options.postId || '';
        this.postUserId = options.postUserId || '';
        this.currentUserId = options.currentUserId || '';
        this.currentUserName = options.currentUserName || 'User';
        this.currentUserPhoto = options.currentUserPhoto || '';
        this.comments = options.comments || [];
        this.totalComments = options.totalComments || 0;
        this.limit = options.limit || 20;
        this.hasMore = options.hasMore || false;
        this.lastDoc = options.lastDoc || null;
        this.isLoading = false;
        this.isDestroyed = false;
        this.replyStates = {};
        this.likedComments = new Set();
        this.onCommentAdded = options.onCommentAdded || null;
        this.onCommentDeleted = options.onCommentDeleted || null;
        this.onCommentLiked = options.onCommentLiked || null;
        this.onReplyAdded = options.onReplyAdded || null;
        this.onLoadMore = options.onLoadMore || null;
        this.onReport = options.onReport || null;
        this.onUserMention = options.onUserMention || null;
        this.element = null;
        this.listContainer = null;
        this.inputField = null;
        this.submitBtn = null;
        this.loadMoreBtn = null;
        this.render = this.render.bind(this);
        this.addComment = this.addComment.bind(this);
        this.addReply = this.addReply.bind(this);
        this.deleteComment = this.deleteComment.bind(this);
        this.deleteReply = this.deleteReply.bind(this);
        this.likeComment = this.likeComment.bind(this);
        this.toggleReplies = this.toggleReplies.bind(this);
        this.loadMore = this.loadMore.bind(this);
        this.reportComment = this.reportComment.bind(this);
        this.destroy = this.destroy.bind(this);
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._handleClickOutside = this._handleClickOutside.bind(this);
        if (!this.postId) {
            console.warn('[CommentSection] postId required');
            return;
        }
    }

    render() {
        if (this.isDestroyed) return null;
        this.element = document.createElement('div');
        this.element.className = 'comment-section-root';
        this.element.dataset.postId = this.postId;
        this.element.setAttribute('role', 'region');
        this.element.setAttribute('aria-label', 'Comments section');
        this.element.style.cssText = `
            display: flex;
            flex-direction: column;
            background: var(--comment-bg, #ffffff);
            border-radius: 12px;
            max-height: 600px;
            overflow: hidden;
            font-family: inherit;
        `;
        const header = this._buildHeader();
        this.element.appendChild(header);
        this.listContainer = document.createElement('div');
        this.listContainer.className = 'comment-list-scroll';
        this.listContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 8px 0;
            scroll-behavior: smooth;
        `;
        this.element.appendChild(this.listContainer);
        this._renderComments();
        const footer = this._buildFooter();
        this.element.appendChild(footer);
        this._bindEvents();
        EventBus.emit('comment:section:render', {
            postId: this.postId,
            count: this.comments.length
        });
        return this.element;
    }

    _buildHeader() {
        const header = document.createElement('div');
        header.className = 'comment-header';
        header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            flex-shrink: 0;
        `;
        const title = document.createElement('span');
        title.className = 'comment-title';
        title.textContent = this.totalComments + ' Comments';
        title.style.cssText = `
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary, #1f2937);
        `;
        const close = document.createElement('button');
        close.className = 'comment-close-btn';
        close.innerHTML = '✕';
        close.setAttribute('aria-label', 'Close comments');
        close.style.cssText = `
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: var(--text-secondary, #6b7280);
            padding: 4px 8px;
            border-radius: 4px;
            transition: background 0.2s;
        `;
        close.addEventListener('mouseenter', () => {
            close.style.background = 'var(--hover-bg, #f3f4f6)';
        });
        close.addEventListener('mouseleave', () => {
            close.style.background = 'transparent';
        });
        close.addEventListener('click', () => {
            EventBus.emit('comment:section:close', { postId: this.postId });
        });
        header.appendChild(title);
        header.appendChild(close);
        return header;
    }

    _renderComments() {
        this.listContainer.innerHTML = '';
        if (this.comments.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'comment-empty';
            empty.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px 20px;
                color: var(--text-muted, #9ca3af);
                text-align: center;
            `;
            empty.innerHTML = `
                <span style="font-size: 48px; margin-bottom: 12px;">💬</span>
                <p style="margin: 0; font-size: 15px;">No comments yet</p>
                <p style="margin: 4px 0 0; font-size: 13px;">Be the first to comment!</p>
            `;
            this.listContainer.appendChild(empty);
            return;
        }
        const fragment = document.createDocumentFragment();
        this.comments.forEach((comment, index) => {
            const item = this._createCommentNode(comment, index);
            fragment.appendChild(item);
        });
        this.listContainer.appendChild(fragment);
        if (this.hasMore) {
            this.loadMoreBtn = document.createElement('button');
            this.loadMoreBtn.className = 'comment-load-more';
            this.loadMoreBtn.textContent = 'Load more comments';
            this.loadMoreBtn.style.cssText = `
                display: block;
                width: 100%;
                padding: 10px;
                background: none;
                border: none;
                color: var(--primary-color, #6366f1);
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.2s;
                border-radius: 4px;
            `;
            this.loadMoreBtn.addEventListener('mouseenter', () => {
                this.loadMoreBtn.style.background = 'var(--hover-bg, #f3f4f6)';
            });
            this.loadMoreBtn.addEventListener('mouseleave', () => {
                this.loadMoreBtn.style.background = 'transparent';
            });
            this.loadMoreBtn.addEventListener('click', this.loadMore);
            this.listContainer.appendChild(this.loadMoreBtn);
        }
    }

    _createCommentNode(comment, index) {
        const isOwn = comment.userId === this.currentUserId;
        const container = document.createElement('div');
        container.className = 'comment-item';
        container.dataset.commentId = comment.id;
        container.dataset.userId = comment.userId;
        container.dataset.index = index;
        container.style.cssText = `
            padding: 10px 16px;
            border-bottom: 1px solid var(--border-light, #f3f4f6);
            animation: fadeInUp 0.25s ease;
            transition: background 0.2s;
        `;
        container.addEventListener('mouseenter', () => {
            container.style.background = 'var(--hover-subtle, #fafafa)';
        });
        container.addEventListener('mouseleave', () => {
            container.style.background = 'transparent';
        });
        const wrapper = document.createElement('div');
        wrapper.className = 'comment-wrapper';
        wrapper.style.cssText = 'display: flex; gap: 12px; align-items: flex-start;';
        const avatar = this._createAvatar(comment.userPhoto, comment.userName);
        wrapper.appendChild(avatar);
        const body = document.createElement('div');
        body.className = 'comment-body';
        body.style.cssText = 'flex: 1; min-width: 0;';
        const nameRow = document.createElement('div');
        nameRow.className = 'comment-name-row';
        nameRow.style.cssText = 'display: flex; align-items: center; gap: 8px; flex-wrap: wrap;';
        const name = document.createElement('span');
        name.className = 'comment-username';
        name.textContent = comment.userName || 'User';
        name.style.cssText = 'font-weight: 600; font-size: 14px; color: var(--text-primary, #1f2937);';
        if (comment.userId === this.postUserId) {
            const badge = document.createElement('span');
            badge.className = 'comment-author-badge';
            badge.textContent = 'Author';
            badge.style.cssText = `
                font-size: 10px;
                background: var(--primary-color, #6366f1);
                color: #fff;
                padding: 1px 8px;
                border-radius: 10px;
                font-weight: 500;
            `;
            nameRow.appendChild(name);
            nameRow.appendChild(badge);
        } else {
            nameRow.appendChild(name);
        }
        const time = document.createElement('span');
        time.className = 'comment-time';
        time.textContent = formatTimeAgo(comment.timestamp);
        time.style.cssText = 'font-size: 12px; color: var(--text-muted, #9ca3af); margin-left: auto;';
        nameRow.appendChild(time);
        body.appendChild(nameRow);
        const text = document.createElement('div');
        text.className = 'comment-text';
        text.textContent = comment.text || '';
        text.style.cssText = `
            font-size: 14px;
            line-height: 1.5;
            color: var(--text-primary, #1f2937);
            word-wrap: break-word;
            margin-top: 2px;
            white-space: pre-wrap;
        `;
        this._processMentions(text);
        body.appendChild(text);
        const actions = document.createElement('div');
        actions.className = 'comment-actions';
        actions.style.cssText = 'display: flex; align-items: center; gap: 16px; margin-top: 6px;';
        const likeBtn = this._createActionButton(
            comment.isLiked ? '❤️' : '🤍',
            comment.likes || 0,
            () => this.likeComment(comment.id)
        );
        actions.appendChild(likeBtn);
        const replyBtn = document.createElement('button');
        replyBtn.className = 'comment-reply-btn';
        replyBtn.textContent = 'Reply';
        replyBtn.style.cssText = `
            background: none;
            border: none;
            color: var(--text-secondary, #6b7280);
            font-size: 13px;
            cursor: pointer;
            padding: 2px 4px;
            transition: color 0.2s;
        `;
        replyBtn.addEventListener('mouseenter', () => {
            replyBtn.style.color = 'var(--primary-color, #6366f1)';
        });
        replyBtn.addEventListener('mouseleave', () => {
            replyBtn.style.color = 'var(--text-secondary, #6b7280)';
        });
        replyBtn.addEventListener('click', () => {
            this._showReplyInput(comment.id);
        });
        actions.appendChild(replyBtn);
        if (isOwn || this.currentUserId === this.postUserId) {
            const delBtn = document.createElement('button');
            delBtn.className = 'comment-delete-btn';
            delBtn.textContent = 'Delete';
            delBtn.style.cssText = `
                background: none;
                border: none;
                color: var(--danger-color, #ef4444);
                font-size: 13px;
                cursor: pointer;
                padding: 2px 4px;
                transition: opacity 0.2s;
                opacity: 0.6;
            `;
            delBtn.addEventListener('mouseenter', () => {
                delBtn.style.opacity = '1';
            });
            delBtn.addEventListener('mouseleave', () => {
                delBtn.style.opacity = '0.6';
            });
            delBtn.addEventListener('click', () => {
                if (confirm('Delete this comment?')) {
                    this.deleteComment(comment.id);
                }
            });
            actions.appendChild(delBtn);
        }
        const reportBtn = document.createElement('button');
        reportBtn.className = 'comment-report-btn';
        reportBtn.textContent = 'Report';
        reportBtn.style.cssText = `
            background: none;
            border: none;
            color: var(--text-muted, #9ca3af);
            font-size: 12px;
            cursor: pointer;
            padding: 2px 4px;
            transition: color 0.2s;
            opacity: 0.5;
        `;
        reportBtn.addEventListener('mouseenter', () => {
            reportBtn.style.color = 'var(--danger-color, #ef4444)';
            reportBtn.style.opacity = '1';
        });
        reportBtn.addEventListener('mouseleave', () => {
            reportBtn.style.color = 'var(--text-muted, #9ca3af)';
            reportBtn.style.opacity = '0.5';
        });
        reportBtn.addEventListener('click', () => {
            this.reportComment(comment.id);
        });
        actions.appendChild(reportBtn);
        body.appendChild(actions);
        wrapper.appendChild(body);
        container.appendChild(wrapper);
        const repliesContainer = document.createElement('div');
        repliesContainer.className = 'comment-replies-wrapper';
        repliesContainer.dataset.commentId = comment.id;
        repliesContainer.style.cssText = 'margin-left: 48px; margin-top: 8px;';
        const replies = comment.replies || [];
        if (replies.length > 0) {
            const showAll = this.replyStates[comment.id] || false;
            const visible = showAll ? replies : replies.slice(0, 2);
            visible.forEach((reply, idx) => {
                const node = this._createReplyNode(reply, comment.id, idx);
                repliesContainer.appendChild(node);
            });
            if (replies.length > 2) {
                const toggle = document.createElement('button');
                toggle.className = 'comment-toggle-replies';
                toggle.textContent = showAll ? 'Hide replies' : `View ${replies.length - 2} more replies`;
                toggle.style.cssText = `
                    background: none;
                    border: none;
                    color: var(--primary-color, #6366f1);
                    font-size: 13px;
                    cursor: pointer;
                    padding: 4px 0;
                    font-weight: 500;
                    transition: color 0.2s;
                `;
                toggle.addEventListener('mouseenter', () => {
                    toggle.style.color = 'var(--primary-dark, #4f46e5)';
                });
                toggle.addEventListener('mouseleave', () => {
                    toggle.style.color = 'var(--primary-color, #6366f1)';
                });
                toggle.addEventListener('click', () => {
                    this.toggleReplies(comment.id);
                });
                repliesContainer.appendChild(toggle);
            }
        }
        container.appendChild(repliesContainer);
        const replyInputWrapper = document.createElement('div');
        replyInputWrapper.className = 'comment-reply-input-wrapper';
        replyInputWrapper.dataset.commentId = comment.id;
        replyInputWrapper.style.cssText = `
            margin-left: 48px;
            margin-top: 8px;
            display: none;
        `;
        const replyInput = document.createElement('input');
        replyInput.type = 'text';
        replyInput.placeholder = 'Write a reply...';
        replyInput.className = 'comment-reply-input';
        replyInput.style.cssText = `
            flex: 1;
            padding: 6px 12px;
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: 20px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
            background: var(--input-bg, #f9fafb);
            color: var(--text-primary, #1f2937);
        `;
        replyInput.addEventListener('focus', () => {
            replyInput.style.borderColor = 'var(--primary-color, #6366f1)';
            replyInput.style.background = 'var(--input-bg-focus, #ffffff)';
        });
        replyInput.addEventListener('blur', () => {
            replyInput.style.borderColor = 'var(--border-color, #e5e7eb)';
            replyInput.style.background = 'var(--input-bg, #f9fafb)';
        });
        replyInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const text = replyInput.value.trim();
                if (text) {
                    this.addReply(comment.id, text);
                    replyInput.value = '';
                    replyInputWrapper.style.display = 'none';
                }
            }
            if (e.key === 'Escape') {
                replyInputWrapper.style.display = 'none';
            }
        });
        const replySubmit = document.createElement('button');
        replySubmit.textContent = 'Post';
        replySubmit.className = 'comment-reply-submit';
        replySubmit.style.cssText = `
            background: var(--primary-color, #6366f1);
            color: #fff;
            border: none;
            border-radius: 20px;
            padding: 6px 16px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
            white-space: nowrap;
        `;
        replySubmit.addEventListener('mouseenter', () => {
            replySubmit.style.background = 'var(--primary-dark, #4f46e5)';
        });
        replySubmit.addEventListener('mouseleave', () => {
            replySubmit.style.background = 'var(--primary-color, #6366f1)';
        });
        replySubmit.addEventListener('click', () => {
            const text = replyInput.value.trim();
            if (text) {
                this.addReply(comment.id, text);
                replyInput.value = '';
                replyInputWrapper.style.display = 'none';
            }
        });
        const replyInputRow = document.createElement('div');
        replyInputRow.style.cssText = 'display: flex; gap: 8px; align-items: center;';
        replyInputRow.appendChild(replyInput);
        replyInputRow.appendChild(replySubmit);
        replyInputWrapper.appendChild(replyInputRow);
        container.appendChild(replyInputWrapper);
        return container;
    }

    _createReplyNode(reply, parentId, index) {
        const isOwn = reply.userId === this.currentUserId;
        const container = document.createElement('div');
        container.className = 'reply-item';
        container.dataset.replyId = reply.id;
        container.dataset.parentId = parentId;
        container.dataset.index = index;
        container.style.cssText = `
            padding: 6px 0;
            border-bottom: 1px solid var(--border-light, #f3f4f6);
            display: flex;
            gap: 10px;
            align-items: flex-start;
            animation: fadeInUp 0.2s ease;
        `;
        const avatar = this._createAvatar(reply.userPhoto, reply.userName, 28);
        container.appendChild(avatar);
        const body = document.createElement('div');
        body.className = 'reply-body';
        body.style.cssText = 'flex: 1; min-width: 0;';
        const nameRow = document.createElement('div');
        nameRow.className = 'reply-name-row';
        nameRow.style.cssText = 'display: flex; align-items: center; gap: 8px; flex-wrap: wrap;';
        const name = document.createElement('span');
        name.className = 'reply-username';
        name.textContent = reply.userName || 'User';
        name.style.cssText = 'font-weight: 600; font-size: 13px; color: var(--text-primary, #1f2937);';
        nameRow.appendChild(name);
        if (reply.userId === this.postUserId) {
            const badge = document.createElement('span');
            badge.textContent = 'Author';
            badge.style.cssText = `
                font-size: 9px;
                background: var(--primary-color, #6366f1);
                color: #fff;
                padding: 1px 6px;
                border-radius: 8px;
                font-weight: 500;
            `;
            nameRow.appendChild(badge);
        }
        const time = document.createElement('span');
        time.textContent = formatTimeAgo(reply.timestamp);
        time.style.cssText = 'font-size: 11px; color: var(--text-muted, #9ca3af); margin-left: auto;';
        nameRow.appendChild(time);
        body.appendChild(nameRow);
        const text = document.createElement('div');
        text.className = 'reply-text';
        text.textContent = reply.text || '';
        text.style.cssText = `
            font-size: 13px;
            line-height: 1.4;
            color: var(--text-primary, #1f2937);
            word-wrap: break-word;
            margin-top: 1px;
            white-space: pre-wrap;
        `;
        this._processMentions(text);
        body.appendChild(text);
        const actions = document.createElement('div');
        actions.className = 'reply-actions';
        actions.style.cssText = 'display: flex; align-items: center; gap: 12px; margin-top: 4px;';
        const likeBtn = this._createActionButton(
            reply.isLiked ? '❤️' : '🤍',
            reply.likes || 0,
            () => this.likeComment(reply.id, true)
        );
        actions.appendChild(likeBtn);
        if (isOwn || this.currentUserId === this.postUserId) {
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Delete';
            delBtn.style.cssText = `
                background: none;
                border: none;
                color: var(--danger-color, #ef4444);
                font-size: 12px;
                cursor: pointer;
                padding: 0 4px;
                opacity: 0.5;
                transition: opacity 0.2s;
            `;
            delBtn.addEventListener('mouseenter', () => {
                delBtn.style.opacity = '1';
            });
            delBtn.addEventListener('mouseleave', () => {
                delBtn.style.opacity = '0.5';
            });
            delBtn.addEventListener('click', () => {
                if (confirm('Delete this reply?')) {
                    this.deleteReply(parentId, reply.id);
                }
            });
            actions.appendChild(delBtn);
        }
        body.appendChild(actions);
        container.appendChild(body);
        return container;
    }

    _createAvatar(photo, name, size = 36) {
        const a = document.createElement('div');
        a.className = 'comment-avatar';
        a.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            overflow: hidden;
            flex-shrink: 0;
            background: var(--avatar-bg, #e5e7eb);
        `;
        const img = document.createElement('img');
        img.src = photo || APP_CONSTANTS.DEFAULT_AVATAR || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239ca3af"%3E%3Ccircle cx="12" cy="8" r="5"/%3E%3Cpath d="M4 20c0-4 4-6 8-6s8 2 8 6"/%3E%3C/svg%3E';
        img.alt = name || 'User';
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; display: block;';
        img.loading = 'lazy';
        a.appendChild(img);
        return a;
    }

    _createActionButton(icon, count, handler) {
        const btn = document.createElement('button');
        btn.className = 'comment-action-btn';
        btn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 2px 4px;
            font-size: 14px;
            color: var(--text-secondary, #6b7280);
            transition: all 0.2s;
            border-radius: 4px;
        `;
        const iconSpan = document.createElement('span');
        iconSpan.textContent = icon;
        iconSpan.style.cssText = 'font-size: 15px; line-height: 1;';
        const countSpan = document.createElement('span');
        countSpan.textContent = count || 0;
        countSpan.style.cssText = 'font-size: 13px; font-weight: 500;';
        btn.appendChild(iconSpan);
        btn.appendChild(countSpan);
        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'var(--hover-bg, #f3f4f6)';
            btn.style.color = 'var(--primary-color, #6366f1)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'transparent';
            btn.style.color = 'var(--text-secondary, #6b7280)';
        });
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (handler) handler();
        });
        return btn;
    }

    _processMentions(element) {
        const text = element.textContent || '';
        const regex = /@(\w+)/g;
        const parts = text.split(regex);
        if (parts.length > 1) {
            element.innerHTML = '';
            parts.forEach((part, index) => {
                if (index % 2 === 1) {
                    const mention = document.createElement('span');
                    mention.className = 'comment-mention';
                    mention.textContent = '@' + part;
                    mention.style.cssText = `
                        color: var(--primary-color, #6366f1);
                        font-weight: 500;
                        cursor: pointer;
                    `;
                    mention.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (this.onUserMention) {
                            this.onUserMention(part);
                        }
                    });
                    element.appendChild(mention);
                } else if (part) {
                    element.appendChild(document.createTextNode(part));
                }
            });
        }
    }

    _showReplyInput(commentId) {
        const wrapper = this.element.querySelector(
            `.comment-reply-input-wrapper[data-comment-id="${commentId}"]`
        );
        if (wrapper) {
            const currentDisplay = wrapper.style.display;
            wrapper.style.display = currentDisplay === 'none' ? 'block' : 'none';
            if (wrapper.style.display === 'block') {
                const input = wrapper.querySelector('.comment-reply-input');
                if (input) {
                    setTimeout(() => input.focus(), 100);
                }
            }
        }
    }

    _buildFooter() {
        const footer = document.createElement('div');
        footer.className = 'comment-footer';
        footer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 16px;
            border-top: 1px solid var(--border-color, #e5e7eb);
            flex-shrink: 0;
            background: var(--comment-footer-bg, #fafafa);
        `;
        const avatar = document.createElement('img');
        avatar.src = this.currentUserPhoto || APP_CONSTANTS.DEFAULT_AVATAR || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239ca3af"%3E%3Ccircle cx="12" cy="8" r="5"/%3E%3Cpath d="M4 20c0-4 4-6 8-6s8 2 8 6"/%3E%3C/svg%3E';
        avatar.alt = 'Your avatar';
        avatar.style.cssText = `
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
            flex-shrink: 0;
        `;
        footer.appendChild(avatar);
        const inputWrapper = document.createElement('div');
        inputWrapper.style.cssText = 'flex: 1; display: flex; gap: 8px; align-items: center;';
        this.inputField = document.createElement('input');
        this.inputField.type = 'text';
        this.inputField.className = 'comment-input';
        this.inputField.placeholder = 'Write a comment...';
        this.inputField.style.cssText = `
            flex: 1;
            padding: 8px 14px;
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: 20px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
            background: var(--input-bg, #ffffff);
            color: var(--text-primary, #1f2937);
        `;
        this.inputField.addEventListener('focus', () => {
            this.inputField.style.borderColor = 'var(--primary-color, #6366f1)';
            this.inputField.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
        });
        this.inputField.addEventListener('blur', () => {
            this.inputField.style.borderColor = 'var(--border-color, #e5e7eb)';
            this.inputField.style.boxShadow = 'none';
        });
        this.inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this._handleSubmit();
            }
        });
        this.inputField.addEventListener('input', () => {
            this._updateSubmitButton();
        });
        inputWrapper.appendChild(this.inputField);
        this.submitBtn = document.createElement('button');
        this.submitBtn.className = 'comment-submit-btn';
        this.submitBtn.textContent = 'Post';
        this.submitBtn.style.cssText = `
            background: var(--primary-color, #6366f1);
            color: #fff;
            border: none;
            border-radius: 20px;
            padding: 8px 18px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
            opacity: 0.5;
        `;
        this.submitBtn.disabled = true;
        this.submitBtn.addEventListener('mouseenter', () => {
            if (!this.submitBtn.disabled) {
                this.submitBtn.style.background = 'var(--primary-dark, #4f46e5)';
            }
        });
        this.submitBtn.addEventListener('mouseleave', () => {
            if (!this.submitBtn.disabled) {
                this.submitBtn.style.background = 'var(--primary-color, #6366f1)';
            } else {
                this.submitBtn.style.opacity = '0.5';
            }
        });
        this.submitBtn.addEventListener('click', this._handleSubmit.bind(this));
        inputWrapper.appendChild(this.submitBtn);
        footer.appendChild(inputWrapper);
        return footer;
    }

    _updateSubmitButton() {
        const hasText = this.inputField && this.inputField.value.trim().length > 0;
        this.submitBtn.disabled = !hasText;
        this.submitBtn.style.opacity = hasText ? '1' : '0.5';
        if (hasText) {
            this.submitBtn.style.cursor = 'pointer';
        } else {
            this.submitBtn.style.cursor = 'default';
        }
    }

    _handleSubmit() {
        const text = this.inputField ? this.inputField.value.trim() : '';
        if (text) {
            this.addComment(text);
            this.inputField.value = '';
            this._updateSubmitButton();
        }
    }

    addComment(text) {
        if (!this.currentUserId) {
            EventBus.emit('toast:show', {
                message: 'Please login to comment',
                type: 'warning'
            });
            return;
        }
        const comment = {
            id: 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            userId: this.currentUserId,
            userName: this.currentUserName,
            userPhoto: this.currentUserPhoto,
            text: text,
            timestamp: Date.now(),
            likes: 0,
            isLiked: false,
            replies: []
        };
        this.comments.push(comment);
        this.totalComments += 1;
        if (this.onCommentAdded) this.onCommentAdded(comment);
        this._renderComments();
        this._scrollToBottom();
        EventBus.emit('comment:added', {
            postId: this.postId,
            comment: comment
        });
    }

    addReply(commentId, text) {
        if (!this.currentUserId) {
            EventBus.emit('toast:show', {
                message: 'Please login to reply',
                type: 'warning'
            });
            return;
        }
        const reply = {
            id: 'reply_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            userId: this.currentUserId,
            userName: this.currentUserName,
            userPhoto: this.currentUserPhoto,
            text: text,
            timestamp: Date.now(),
            likes: 0,
            isLiked: false
        };
        const comment = this.comments.find(c => c.id === commentId);
        if (comment) {
            if (!comment.replies) comment.replies = [];
            comment.replies.push(reply);
            if (this.onReplyAdded) this.onReplyAdded(commentId, reply);
            this._renderComments();
            EventBus.emit('comment:reply:added', {
                postId: this.postId,
                commentId: commentId,
                reply: reply
            });
        }
    }

    deleteComment(commentId) {
        this.comments = this.comments.filter(c => c.id !== commentId);
        this.totalComments -= 1;
        if (this.onCommentDeleted) this.onCommentDeleted(commentId);
        this._renderComments();
        EventBus.emit('comment:deleted', {
            postId: this.postId,
            commentId: commentId
        });
    }

    deleteReply(commentId, replyId) {
        const comment = this.comments.find(c => c.id === commentId);
        if (comment && comment.replies) {
            comment.replies = comment.replies.filter(r => r.id !== replyId);
            this._renderComments();
            EventBus.emit('comment:reply:deleted', {
                postId: this.postId,
                commentId: commentId,
                replyId: replyId
            });
        }
    }

    likeComment(commentId, isReply = false) {
        if (!this.currentUserId) {
            EventBus.emit('toast:show', {
                message: 'Please login to like',
                type: 'warning'
            });
            return;
        }
        let target = null;
        if (isReply) {
            for (const c of this.comments) {
                if (c.replies) {
                    const reply = c.replies.find(r => r.id === commentId);
                    if (reply) {
                        target = reply;
                        break;
                    }
                }
            }
        } else {
            target = this.comments.find(c => c.id === commentId);
        }
        if (target) {
            const key = commentId;
            if (this.likedComments.has(key)) {
                target.likes = Math.max(0, (target.likes || 0) - 1);
                target.isLiked = false;
                this.likedComments.delete(key);
            } else {
                target.likes = (target.likes || 0) + 1;
                target.isLiked = true;
                this.likedComments.add(key);
            }
            if (this.onCommentLiked) this.onCommentLiked(commentId, target.likes);
            this._renderComments();
        }
    }

    toggleReplies(commentId) {
        this.replyStates[commentId] = !this.replyStates[commentId];
        this._renderComments();
        const container = this.element.querySelector(
            `.comment-replies-wrapper[data-comment-id="${commentId}"]`
        );
        if (container) {
            setTimeout(() => {
                container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    }

    loadMore() {
        if (this.isLoading) return;
        if (this.onLoadMore) {
            this.isLoading = true;
            if (this.loadMoreBtn) {
                this.loadMoreBtn.textContent = 'Loading...';
                this.loadMoreBtn.disabled = true;
            }
            this.onLoadMore(this.lastDoc, (newComments, hasMore, lastDoc) => {
                this.isLoading = false;
                if (newComments && newComments.length > 0) {
                    this.comments = [...this.comments, ...newComments];
                    this.hasMore = hasMore;
                    this.lastDoc = lastDoc;
                    this._renderComments();
                } else {
                    this.hasMore = false;
                    if (this.loadMoreBtn) {
                        this.loadMoreBtn.textContent = 'No more comments';
                        this.loadMoreBtn.disabled = true;
                    }
                }
            });
        }
    }

    reportComment(commentId) {
        if (this.onReport) {
            this.onReport(commentId);
        } else {
            EventBus.emit('modal:show', {
                title: 'Report Comment',
                content: 'Are you sure you want to report this comment?',
                confirmText: 'Report',
                cancelText: 'Cancel',
                onConfirm: () => {
                    EventBus.emit('comment:report', {
                        postId: this.postId,
                        commentId: commentId
                    });
                }
            });
        }
    }

    _scrollToBottom() {
        if (this.listContainer) {
            setTimeout(() => {
                this.listContainer.scrollTop = this.listContainer.scrollHeight;
            }, 50);
        }
    }

    _bindEvents() {
        if (!this.element) return;
        this.element.addEventListener('keydown', this._handleKeyDown);
        document.addEventListener('click', this._handleClickOutside);
    }

    _handleKeyDown(e) {
        if (e.key === 'Escape') {
            const activeInput = this.element.querySelector('input:focus');
            if (activeInput) {
                activeInput.blur();
                const wrapper = activeInput.closest('.comment-reply-input-wrapper');
                if (wrapper) {
                    wrapper.style.display = 'none';
                }
            }
        }
    }

    _handleClickOutside(e) {
        if (this.element && !this.element.contains(e.target)) {
            const replyWrappers = this.element.querySelectorAll('.comment-reply-input-wrapper');
            replyWrappers.forEach(w => {
                if (w.style.display === 'block') {
                    w.style.display = 'none';
                }
            });
        }
    }

    updateComments(newComments, totalComments) {
        if (this.isDestroyed) return;
        if (newComments) this.comments = newComments;
        if (totalComments !== undefined) this.totalComments = totalComments;
        this._renderComments();
    }

    destroy() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        document.removeEventListener('click', this._handleClickOutside);
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.listContainer = null;
        this.inputField = null;
        this.submitBtn = null;
        this.loadMoreBtn = null;
        EventBus.emit('comment:section:destroy', { postId: this.postId });
    }
}

export default CommentSection;