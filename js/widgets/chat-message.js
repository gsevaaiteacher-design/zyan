// ============================================================
// FILE: js/widgets/chat-message.js
// PURPOSE: Full production chat message component with all features
// DEPENDENCY: constants.js, helpers.js, event-bus.js
// USED BY: chat-detail.js, chat-list.js
// ============================================================

import { APP_CONSTANTS } from '../utils/constants.js';
import { formatTime, formatDate, formatTimeAgo, escapeHtml, debounce } from '../utils/helpers.js';
import { EventBus } from '../state/event-bus.js';

export class ChatMessage {
    constructor(options = {}) {
        this.message = options.message || {};
        this.currentUserId = options.currentUserId || '';
        this.otherUserName = options.otherUserName || 'User';
        this.otherUserPhoto = options.otherUserPhoto || '';
        this.showAvatar = options.showAvatar !== false;
        this.showTime = options.showTime !== false;
        this.showStatus = options.showStatus !== false;
        this.showDateSeparator = options.showDateSeparator || false;
        this.showReactions = options.showReactions || false;
        this.showReplyPreview = options.showReplyPreview || false;
        this.onMediaClick = options.onMediaClick || null;
        this.onLongPress = options.onLongPress || null;
        this.onReply = options.onReply || null;
        this.onDelete = options.onDelete || null;
        this.onReact = options.onReact || null;
        this.onForward = options.onForward || null;
        this.onReport = options.onReport || null;
        this.onCopy = options.onCopy || null;
        this.isOwn = this.message.senderId === this.currentUserId;
        this.element = null;
        this.isDestroyed = false;
        this.longPressTimer = null;
        this.isLongPress = false;
        this.isHovered = false;
        this.audioPlayer = null;
        this.isPlaying = false;
        this.render = this.render.bind(this);
        this.destroy = this.destroy.bind(this);
        this.updateStatus = this.updateStatus.bind(this);
        this.updateReadReceipt = this.updateReadReceipt.bind(this);
        this.updateDeliveryReceipt = this.updateDeliveryReceipt.bind(this);
        this.playAudio = this.playAudio.bind(this);
        this.pauseAudio = this.pauseAudio.bind(this);
        this.seekAudio = this.seekAudio.bind(this);
        this._handleClick = this._handleClick.bind(this);
        this._handleDoubleClick = this._handleDoubleClick.bind(this);
        this._handleTouchStart = this._handleTouchStart.bind(this);
        this._handleTouchEnd = this._handleTouchEnd.bind(this);
        this._handleMouseEnter = this._handleMouseEnter.bind(this);
        this._handleMouseLeave = this._handleMouseLeave.bind(this);
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._handleContextMenu = this._handleContextMenu.bind(this);
        this._handleReactionClick = this._handleReactionClick.bind(this);
        this._handleForwardClick = this._handleForwardClick.bind(this);
        this._handleDeleteClick = this._handleDeleteClick.bind(this);
        this._handleReportClick = this._handleReportClick.bind(this);
        this._handleCopyClick = this._handleCopyClick.bind(this);
        this._handleMediaDownload = this._handleMediaDownload.bind(this);
        this._handleFullscreen = this._handleFullscreen.bind(this);
        this._handleReplyClick = this._handleReplyClick.bind(this);
        if (!this.message || !this.message.id) {
            console.warn('[ChatMessage] Invalid message data');
            return;
        }
        this._initAudio();
    }

    _initAudio() {
        if (this.message.type === 'audio' && this.message.media) {
            this.audioPlayer = new Audio(this.message.media);
            this.audioPlayer.preload = 'metadata';
            this.audioPlayer.addEventListener('timeupdate', this._updateAudioProgress.bind(this));
            this.audioPlayer.addEventListener('ended', this._onAudioEnded.bind(this));
            this.audioPlayer.addEventListener('loadedmetadata', this._onAudioLoaded.bind(this));
        }
    }

    render() {
        if (this.isDestroyed || !this.message || !this.message.id) return null;
        this.element = document.createElement('div');
        this.element.className = 'chat-message-container';
        this.element.dataset.messageId = this.message.id;
        this.element.dataset.senderId = this.message.senderId;
        this.element.dataset.timestamp = this.message.timestamp;
        this.element.setAttribute('role', 'article');
        this.element.setAttribute('aria-label', 'Message');
        if (this.isOwn) {
            this.element.classList.add('own-message');
        } else {
            this.element.classList.add('other-message');
        }
        if (this.message.type === 'system') {
            this.element.classList.add('system-message');
        }
        if (this.message.isDeleted) {
            this.element.classList.add('deleted-message');
        }
        if (this.message.isEdited) {
            this.element.classList.add('edited-message');
        }
        if (this.message.isPinned) {
            this.element.classList.add('pinned-message');
        }
        if (this.message.isForwarded) {
            this.element.classList.add('forwarded-message');
        }
        if (this.message.hasReply) {
            this.element.classList.add('has-reply');
        }
        if (this.showDateSeparator) {
            const dateSeparator = this._createDateSeparator();
            if (dateSeparator) {
                this.element.appendChild(dateSeparator);
            }
        }
        const bubbleWrapper = document.createElement('div');
        bubbleWrapper.className = 'message-bubble-wrapper';
        if (this.showAvatar && !this.isOwn) {
            const avatar = this._createAvatar();
            bubbleWrapper.appendChild(avatar);
        }
        const content = this._createContent();
        bubbleWrapper.appendChild(content);
        if (this.showStatus && this.isOwn) {
            const status = this._createStatusIndicator();
            bubbleWrapper.appendChild(status);
        }
        if (this.showReactions && this.message.reactions && this.message.reactions.length > 0) {
            const reactions = this._createReactions();
            if (reactions) {
                bubbleWrapper.appendChild(reactions);
            }
        }
        this.element.appendChild(bubbleWrapper);
        this._bindEvents();
        this._setupAccessibility();
        EventBus.emit('chat:message:render', {
            messageId: this.message.id,
            isOwn: this.isOwn
        });
        return this.element;
    }

    _createDateSeparator() {
        if (!this.message.timestamp) return null;
        const separator = document.createElement('div');
        separator.className = 'chat-date-separator';
        const date = new Date(this.message.timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        let dateText = '';
        if (date.toDateString() === today.toDateString()) {
            dateText = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            dateText = 'Yesterday';
        } else if (date > weekAgo) {
            dateText = date.toLocaleDateString('en-US', { weekday: 'long' });
        } else {
            dateText = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        const span = document.createElement('span');
        span.textContent = dateText;
        separator.appendChild(span);
        return separator;
    }

    _createAvatar() {
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.setAttribute('role', 'img');
        avatar.setAttribute('aria-label', this.otherUserName || 'User avatar');
        const img = document.createElement('img');
        img.src = this.otherUserPhoto || APP_CONSTANTS.DEFAULT_AVATAR || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239ca3af"%3E%3Ccircle cx="12" cy="8" r="5"/%3E%3Cpath d="M4 20c0-4 4-6 8-6s8 2 8 6"/%3E%3C/svg%3E';
        img.alt = this.otherUserName || 'User';
        img.loading = 'lazy';
        img.draggable = false;
        Object.assign(img.style, {
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid #e5e7eb'
        });
        avatar.appendChild(img);
        if (this.message.isOnline) {
            const online = document.createElement('span');
            online.className = 'message-avatar-online';
            Object.assign(online.style, {
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#22c55e',
                border: '2px solid #fff'
            });
            avatar.style.position = 'relative';
            avatar.appendChild(online);
        }
        return avatar;
    }

    _createContent() {
        const content = document.createElement('div');
        content.className = 'message-content';
        if (this.message.isForwarded) {
            const forwarded = document.createElement('div');
            forwarded.className = 'message-forwarded-badge';
            forwarded.textContent = '↗ Forwarded';
            Object.assign(forwarded.style, {
                fontSize: '11px',
                color: '#6b7280',
                marginBottom: '2px',
                fontWeight: '500'
            });
            content.appendChild(forwarded);
        }
        if (!this.isOwn && this.message.senderName) {
            const name = document.createElement('div');
            name.className = 'message-sender-name';
            name.textContent = this.message.senderName;
            Object.assign(name.style, {
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                marginBottom: '2px',
                padding: '0 4px'
            });
            content.appendChild(name);
        }
        if (this.showReplyPreview && this.message.replyTo) {
            const reply = this._createReplyPreview();
            if (reply) {
                content.appendChild(reply);
            }
        }
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        if (this.message.isDeleted) {
            this._renderDeletedMessage(bubble);
        } else {
            const type = this.message.type || 'text';
            switch (type) {
                case 'image':
                    this._renderImageMessage(bubble);
                    break;
                case 'file':
                    this._renderFileMessage(bubble);
                    break;
                case 'audio':
                    this._renderAudioMessage(bubble);
                    break;
                case 'video':
                    this._renderVideoMessage(bubble);
                    break;
                case 'location':
                    this._renderLocationMessage(bubble);
                    break;
                case 'contact':
                    this._renderContactMessage(bubble);
                    break;
                case 'poll':
                    this._renderPollMessage(bubble);
                    break;
                case 'system':
                    this._renderSystemMessage(bubble);
                    break;
                case 'text':
                default:
                    this._renderTextMessage(bubble);
                    break;
            }
        }
        if (this.message.isEdited && !this.message.isDeleted) {
            const edited = document.createElement('span');
            edited.className = 'message-edited-badge';
            edited.textContent = 'edited';
            Object.assign(edited.style, {
                fontSize: '10px',
                color: '#9ca3af',
                marginLeft: '6px',
                fontStyle: 'italic'
            });
            bubble.appendChild(edited);
        }
        content.appendChild(bubble);
        const metaRow = document.createElement('div');
        metaRow.className = 'message-meta-row';
        Object.assign(metaRow.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '2px',
            padding: '0 4px'
        });
        if (this.showTime && this.message.timestamp) {
            const time = document.createElement('span');
            time.className = 'message-time';
            time.textContent = this._formatTime(this.message.timestamp);
            Object.assign(time.style, {
                fontSize: '11px',
                color: '#9ca3af'
            });
            metaRow.appendChild(time);
        }
        if (this.message.isPinned) {
            const pin = document.createElement('span');
            pin.className = 'message-pin-badge';
            pin.textContent = '📌';
            pin.setAttribute('aria-label', 'Pinned message');
            Object.assign(pin.style, {
                fontSize: '12px'
            });
            metaRow.appendChild(pin);
        }
        content.appendChild(metaRow);
        return content;
    }

    _createReplyPreview() {
        if (!this.message.replyTo) return null;
        const container = document.createElement('div');
        container.className = 'message-reply-preview';
        Object.assign(container.style, {
            padding: '6px 10px',
            marginBottom: '6px',
            background: 'rgba(0,0,0,0.04)',
            borderRadius: '6px',
            borderLeft: '3px solid #6366f1',
            fontSize: '12px',
            color: '#6b7280',
            maxWidth: '300px',
            cursor: 'pointer'
        });
        const sender = document.createElement('span');
        sender.className = 'message-reply-sender';
        sender.textContent = (this.message.replyTo.senderName || 'User') + ': ';
        Object.assign(sender.style, {
            fontWeight: '600',
            color: '#1f2937'
        });
        const text = document.createElement('span');
        text.className = 'message-reply-text';
        const replyText = this.message.replyTo.text || '';
        text.textContent = replyText.length > 60 ? replyText.substring(0, 60) + '...' : replyText;
        container.appendChild(sender);
        container.appendChild(text);
        container.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.onReply) {
                this.onReply(this.message.replyTo);
            }
        });
        return container;
    }

    _renderTextMessage(container) {
        const text = document.createElement('p');
        text.className = 'message-text';
        text.textContent = this.message.text || '';
        Object.assign(text.style, {
            margin: '0',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.6',
            fontSize: '14px'
        });
        const content = this.message.text || '';
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
        const phoneRegex = /(\+?[\d\s\-\(\)]{8,})/g;
        const hashtagRegex = /#(\w+)/g;
        const mentionRegex = /@(\w+)/g;
        const allMatches = [];
        let match;
        while ((match = urlRegex.exec(content)) !== null) {
            allMatches.push({ index: match.index, end: match.index + match[0].length, type: 'url', text: match[0] });
        }
        while ((match = emailRegex.exec(content)) !== null) {
            allMatches.push({ index: match.index, end: match.index + match[0].length, type: 'email', text: match[0] });
        }
        while ((match = phoneRegex.exec(content)) !== null) {
            allMatches.push({ index: match.index, end: match.index + match[0].length, type: 'phone', text: match[0] });
        }
        while ((match = hashtagRegex.exec(content)) !== null) {
            allMatches.push({ index: match.index, end: match.index + match[0].length, type: 'hashtag', text: match[0] });
        }
        while ((match = mentionRegex.exec(content)) !== null) {
            allMatches.push({ index: match.index, end: match.index + match[0].length, type: 'mention', text: match[0] });
        }
        allMatches.sort((a, b) => a.index - b.index);
        if (allMatches.length > 0) {
            text.innerHTML = '';
            let lastIndex = 0;
            allMatches.forEach((matchItem) => {
                if (lastIndex < matchItem.index) {
                    text.appendChild(document.createTextNode(content.substring(lastIndex, matchItem.index)));
                }
                const el = document.createElement('span');
                if (matchItem.type === 'url') {
                    const a = document.createElement('a');
                    a.href = matchItem.text;
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                    a.textContent = matchItem.text;
                    Object.assign(a.style, {
                        color: this.isOwn ? '#c7d2fe' : '#6366f1',
                        textDecoration: 'underline',
                        wordBreak: 'break-all'
                    });
                    el.appendChild(a);
                } else if (matchItem.type === 'email') {
                    const a = document.createElement('a');
                    a.href = 'mailto:' + matchItem.text;
                    a.textContent = matchItem.text;
                    Object.assign(a.style, {
                        color: this.isOwn ? '#c7d2fe' : '#6366f1',
                        textDecoration: 'underline'
                    });
                    el.appendChild(a);
                } else if (matchItem.type === 'phone') {
                    const a = document.createElement('a');
                    a.href = 'tel:' + matchItem.text.replace(/[\s\-\(\)]/g, '');
                    a.textContent = matchItem.text;
                    Object.assign(a.style, {
                        color: this.isOwn ? '#c7d2fe' : '#6366f1',
                        textDecoration: 'underline'
                    });
                    el.appendChild(a);
                } else if (matchItem.type === 'hashtag') {
                    el.textContent = matchItem.text;
                    Object.assign(el.style, {
                        color: this.isOwn ? '#c7d2fe' : '#6366f1',
                        fontWeight: '500',
                        cursor: 'pointer'
                    });
                    el.addEventListener('click', (e) => {
                        e.stopPropagation();
                        EventBus.emit('chat:hashtag:click', { hashtag: matchItem.text.substring(1) });
                    });
                } else if (matchItem.type === 'mention') {
                    el.textContent = matchItem.text;
                    Object.assign(el.style, {
                        color: this.isOwn ? '#c7d2fe' : '#6366f1',
                        fontWeight: '500',
                        cursor: 'pointer'
                    });
                    el.addEventListener('click', (e) => {
                        e.stopPropagation();
                        EventBus.emit('chat:mention:click', { username: matchItem.text.substring(1) });
                    });
                }
                text.appendChild(el);
                lastIndex = matchItem.end;
            });
            if (lastIndex < content.length) {
                text.appendChild(document.createTextNode(content.substring(lastIndex)));
            }
        } else {
            text.textContent = content;
        }
        container.appendChild(text);
    }

    _renderImageMessage(container) {
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'message-image-wrapper';
        Object.assign(imgWrapper.style, {
            maxWidth: '350px',
            borderRadius: '12px',
            overflow: 'hidden',
            cursor: 'pointer',
            position: 'relative',
            background: '#f3f4f6'
        });
        const img = document.createElement('img');
        img.className = 'message-image';
        img.src = this.message.media || this.message.text || '';
        img.alt = this.message.alt || 'Shared image';
        img.loading = 'lazy';
        img.draggable = false;
        Object.assign(img.style, {
            width: '100%',
            height: 'auto',
            display: 'block',
            objectFit: 'cover',
            opacity: '0',
            transition: 'opacity 0.3s ease'
        });
        img.addEventListener('load', function() {
            this.style.opacity = '1';
            this.classList.add('loaded');
        });
        img.addEventListener('error', function() {
            this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23d1d5db"%3E%3Crect width="24" height="24" rx="4"/%3E%3Ccircle cx="12" cy="12" r="4" fill="%239ca3af"/%3E%3C/svg%3E';
            this.style.opacity = '1';
            this.style.objectFit = 'contain';
            this.style.padding = '20%';
        });
        imgWrapper.appendChild(img);
        const actions = document.createElement('div');
        actions.className = 'message-image-actions';
        Object.assign(actions.style, {
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            display: 'flex',
            gap: '6px',
            opacity: '0',
            transition: 'opacity 0.2s ease'
        });
        const downloadBtn = this._createActionButton('⬇', 'Download image', this._handleMediaDownload);
        const fullscreenBtn = this._createActionButton('⛶', 'Fullscreen', this._handleFullscreen);
        actions.appendChild(downloadBtn);
        actions.appendChild(fullscreenBtn);
        imgWrapper.appendChild(actions);
        imgWrapper.addEventListener('mouseenter', () => {
            actions.style.opacity = '1';
        });
        imgWrapper.addEventListener('mouseleave', () => {
            actions.style.opacity = '0';
        });
        imgWrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            if (e.target.closest('.message-image-actions')) return;
            if (this.onMediaClick) {
                this.onMediaClick(this.message);
            } else {
                this._zoomImage(img.src, img.alt);
            }
        });
        if (this.message.text && this.message.text !== this.message.media) {
            const caption = document.createElement('p');
            caption.className = 'message-image-caption';
            caption.textContent = this.message.text;
            Object.assign(caption.style, {
                margin: '8px 0 0',
                fontSize: '14px',
                wordBreak: 'break-word',
                color: this.isOwn ? '#e5e7eb' : '#1f2937'
            });
            imgWrapper.appendChild(caption);
        }
        container.appendChild(imgWrapper);
    }

    _createActionButton(icon, label, handler) {
        const btn = document.createElement('button');
        btn.textContent = icon;
        btn.setAttribute('aria-label', label);
        Object.assign(btn.style, {
            background: 'rgba(0,0,0,0.6)',
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'background 0.2s ease'
        });
        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'rgba(0,0,0,0.8)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'rgba(0,0,0,0.6)';
        });
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (handler) handler(e);
        });
        return btn;
    }

    _renderFileMessage(container) {
        const fileWrapper = document.createElement('div');
        fileWrapper.className = 'message-file-wrapper';
        Object.assign(fileWrapper.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '12px 16px',
            background: this.isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(99,102,241,0.08)',
            borderRadius: '10px',
            minWidth: '220px',
            maxWidth: '350px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: '1px solid ' + (this.isOwn ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.1)')
        });
        fileWrapper.addEventListener('mouseenter', () => {
            fileWrapper.style.background = this.isOwn ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.12)';
            fileWrapper.style.transform = 'scale(1.01)';
        });
        fileWrapper.addEventListener('mouseleave', () => {
            fileWrapper.style.background = this.isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(99,102,241,0.08)';
            fileWrapper.style.transform = 'scale(1)';
        });
        const fileType = this._getFileType(this.message.fileName || this.message.text || 'file');
        const icon = document.createElement('span');
        icon.className = 'message-file-icon';
        icon.textContent = this._getFileIcon(fileType);
        Object.assign(icon.style, {
            fontSize: '32px',
            flexShrink: '0'
        });
        const info = document.createElement('div');
        info.className = 'message-file-info';
        Object.assign(info.style, {
            flex: '1',
            minWidth: '0'
        });
        const name = document.createElement('div');
        name.className = 'message-file-name';
        name.textContent = this.message.fileName || this.message.text || 'File';
        Object.assign(name.style, {
            fontWeight: '500',
            fontSize: '14px',
            wordBreak: 'break-word',
            color: this.isOwn ? '#ffffff' : '#1f2937'
        });
        const size = document.createElement('div');
        size.className = 'message-file-size';
        size.textContent = this.message.fileSize || this._formatFileSize(this.message.fileSizeBytes || 0);
        Object.assign(size.style, {
            fontSize: '12px',
            color: this.isOwn ? 'rgba(255,255,255,0.6)' : '#6b7280'
        });
        const progress = document.createElement('div');
        progress.className = 'message-file-progress';
        Object.assign(progress.style, {
            width: '100%',
            height: '3px',
            background: this.isOwn ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
            borderRadius: '2px',
            marginTop: '4px',
            display: 'none'
        });
        const progressBar = document.createElement('div');
        progressBar.className = 'message-file-progress-bar';
        Object.assign(progressBar.style, {
            width: '0%',
            height: '100%',
            background: '#6366f1',
            borderRadius: '2px',
            transition: 'width 0.3s ease'
        });
        progress.appendChild(progressBar);
        info.appendChild(name);
        info.appendChild(size);
        info.appendChild(progress);
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'message-file-download';
        downloadBtn.textContent = '⬇';
        downloadBtn.setAttribute('aria-label', 'Download file');
        Object.assign(downloadBtn.style, {
            background: 'none',
            border: 'none',
            fontSize: '22px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '6px',
            transition: 'background 0.2s ease',
            color: this.isOwn ? '#ffffff' : '#1f2937'
        });
        downloadBtn.addEventListener('mouseenter', () => {
            downloadBtn.style.background = 'rgba(0,0,0,0.05)';
        });
        downloadBtn.addEventListener('mouseleave', () => {
            downloadBtn.style.background = 'none';
        });
        fileWrapper.appendChild(icon);
        fileWrapper.appendChild(info);
        fileWrapper.appendChild(downloadBtn);
        fileWrapper.addEventListener('click', (e) => {
            if (e.target === downloadBtn) return;
            if (this.onMediaClick) {
                this.onMediaClick(this.message);
            }
        });
        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._handleMediaDownload(e);
        });
        container.appendChild(fileWrapper);
        this._fileProgressBar = progressBar;
        this._fileProgress = progress;
    }

    _renderAudioMessage(container) {
        const audioWrapper = document.createElement('div');
        audioWrapper.className = 'message-audio-wrapper';
        Object.assign(audioWrapper.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            background: this.isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(99,102,241,0.08)',
            borderRadius: '10px',
            minWidth: '250px',
            maxWidth: '350px',
            border: '1px solid ' + (this.isOwn ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.1)')
        });
        const playBtn = document.createElement('button');
        playBtn.className = 'message-audio-play';
        playBtn.textContent = '▶';
        playBtn.setAttribute('aria-label', 'Play audio');
        Object.assign(playBtn.style, {
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            background: this.isOwn ? 'rgba(255,255,255,0.2)' : '#6366f1',
            color: this.isOwn ? '#ffffff' : '#ffffff',
            fontSize: '16px',
            cursor: 'pointer',
            flexShrink: '0',
            transition: 'all 0.2s ease'
        });
        playBtn.addEventListener('mouseenter', () => {
            playBtn.style.transform = 'scale(1.05)';
        });
        playBtn.addEventListener('mouseleave', () => {
            playBtn.style.transform = 'scale(1)';
        });
        const progressContainer = document.createElement('div');
        progressContainer.className = 'message-audio-progress-container';
        Object.assign(progressContainer.style, {
            flex: '1',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            minWidth: '0'
        });
        const progressBar = document.createElement('div');
        progressBar.className = 'message-audio-progress-bar';
        Object.assign(progressBar.style, {
            width: '100%',
            height: '4px',
            background: this.isOwn ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
            borderRadius: '2px',
            cursor: 'pointer',
            position: 'relative'
        });
        const progressFill = document.createElement('div');
        progressFill.className = 'message-audio-progress-fill';
        Object.assign(progressFill.style, {
            width: '0%',
            height: '100%',
            background: '#6366f1',
            borderRadius: '2px',
            transition: 'width 0.1s linear'
        });
        progressBar.appendChild(progressFill);
        const timeDisplay = document.createElement('div');
        timeDisplay.className = 'message-audio-time';
        timeDisplay.textContent = '0:00 / 0:00';
        Object.assign(timeDisplay.style, {
            fontSize: '11px',
            color: this.isOwn ? 'rgba(255,255,255,0.6)' : '#6b7280'
        });
        progressContainer.appendChild(progressBar);
        progressContainer.appendChild(timeDisplay);
        audioWrapper.appendChild(playBtn);
        audioWrapper.appendChild(progressContainer);
        if (this.message.text && this.message.text !== this.message.media) {
            const caption = document.createElement('div');
            caption.className = 'message-audio-caption';
            caption.textContent = this.message.text;
            Object.assign(caption.style, {
                fontSize: '12px',
                color: this.isOwn ? 'rgba(255,255,255,0.7)' : '#6b7280',
                marginTop: '4px',
                width: '100%'
            });
            audioWrapper.appendChild(caption);
        }
        container.appendChild(audioWrapper);
        this._audioPlayBtn = playBtn;
        this._audioProgressFill = progressFill;
        this._audioTimeDisplay = timeDisplay;
        this._audioProgressBar = progressBar;
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._toggleAudio();
        });
        progressBar.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            this._seekAudio(percent);
        });
    }

    _renderVideoMessage(container) {
        const videoWrapper = document.createElement('div');
        videoWrapper.className = 'message-video-wrapper';
        Object.assign(videoWrapper.style, {
            maxWidth: '350px',
            borderRadius: '12px',
            overflow: 'hidden',
            position: 'relative',
            background: '#000'
        });
        const video = document.createElement('video');
        video.className = 'message-video';
        video.src = this.message.media || this.message.text || '';
        video.poster = this.message.thumbnail || '';
        video.controls = true;
        video.playsInline = true;
        video.preload = 'metadata';
        Object.assign(video.style, {
            width: '100%',
            height: 'auto',
            display: 'block'
        });
        videoWrapper.appendChild(video);
        if (this.message.text && this.message.text !== this.message.media) {
            const caption = document.createElement('p');
            caption.className = 'message-video-caption';
            caption.textContent = this.message.text;
            Object.assign(caption.style, {
                padding: '8px 12px',
                margin: '0',
                fontSize: '14px',
                color: this.isOwn ? '#e5e7eb' : '#1f2937',
                background: this.isOwn ? 'rgba(0,0,0,0.5)' : '#f9fafb'
            });
            videoWrapper.appendChild(caption);
        }
        container.appendChild(videoWrapper);
        this._videoElement = video;
    }

    _renderLocationMessage(container) {
        const locWrapper = document.createElement('div');
        locWrapper.className = 'message-location-wrapper';
        Object.assign(locWrapper.style, {
            maxWidth: '350px',
            borderRadius: '12px',
            overflow: 'hidden',
            cursor: 'pointer',
            position: 'relative',
            background: '#f3f4f6'
        });
        const mapPlaceholder = document.createElement('div');
        mapPlaceholder.className = 'message-location-placeholder';
        Object.assign(mapPlaceholder.style, {
            width: '100%',
            height: '160px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '48px'
        });
        mapPlaceholder.textContent = '📍';
        const details = document.createElement('div');
        details.className = 'message-location-details';
        Object.assign(details.style, {
            padding: '10px 14px',
            background: this.isOwn ? 'rgba(255,255,255,0.1)' : '#ffffff'
        });
        const address = document.createElement('div');
        address.className = 'message-location-address';
        address.textContent = this.message.address || 'Location shared';
        Object.assign(address.style, {
            fontSize: '14px',
            fontWeight: '500',
            color: this.isOwn ? '#ffffff' : '#1f2937'
        });
        details.appendChild(address);
        locWrapper.appendChild(mapPlaceholder);
        locWrapper.appendChild(details);
        locWrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.message.lat && this.message.lng) {
                window.open('https://www.google.com/maps?q=' + this.message.lat + ',' + this.message.lng, '_blank');
            } else if (this.onMediaClick) {
                this.onMediaClick(this.message);
            }
        });
        container.appendChild(locWrapper);
    }

    _renderContactMessage(container) {
        const contactWrapper = document.createElement('div');
        contactWrapper.className = 'message-contact-wrapper';
        Object.assign(contactWrapper.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            background: this.isOwn ? 'rgba(255,255,255,0.1)' : '#f9fafb',
            borderRadius: '10px',
            minWidth: '200px',
            maxWidth: '300px',
            border: '1px solid ' + (this.isOwn ? 'rgba(255,255,255,0.1)' : '#e5e7eb')
        });
        const avatar = document.createElement('div');
        avatar.className = 'message-contact-avatar';
        Object.assign(avatar.style, {
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: '0',
            background: '#e5e7eb'
        });
        const img = document.createElement('img');
        img.src = this.message.contactPhoto || APP_CONSTANTS.DEFAULT_AVATAR || '';
        img.alt = this.message.contactName || 'Contact';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        avatar.appendChild(img);
        const info = document.createElement('div');
        info.className = 'message-contact-info';
        Object.assign(info.style, {
            flex: '1',
            minWidth: '0'
        });
        const name = document.createElement('div');
        name.className = 'message-contact-name';
        name.textContent = this.message.contactName || 'Contact';
        Object.assign(name.style, {
            fontWeight: '500',
            fontSize: '14px',
            color: this.isOwn ? '#ffffff' : '#1f2937'
        });
        const phone = document.createElement('div');
        phone.className = 'message-contact-phone';
        phone.textContent = this.message.contactPhone || '';
        Object.assign(phone.style, {
            fontSize: '12px',
            color: this.isOwn ? 'rgba(255,255,255,0.6)' : '#6b7280'
        });
        info.appendChild(name);
        info.appendChild(phone);
        contactWrapper.appendChild(avatar);
        contactWrapper.appendChild(info);
        contactWrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.onMediaClick) {
                this.onMediaClick(this.message);
            }
        });
        container.appendChild(contactWrapper);
    }

    _renderPollMessage(container) {
        const pollWrapper = document.createElement('div');
        pollWrapper.className = 'message-poll-wrapper';
        Object.assign(pollWrapper.style, {
            padding: '12px 14px',
            background: this.isOwn ? 'rgba(255,255,255,0.1)' : '#f9fafb',
            borderRadius: '10px',
            minWidth: '200px',
            maxWidth: '350px',
            border: '1px solid ' + (this.isOwn ? 'rgba(255,255,255,0.1)' : '#e5e7eb')
        });
        const question = document.createElement('div');
        question.className = 'message-poll-question';
        question.textContent = this.message.pollQuestion || 'Poll';
        Object.assign(question.style, {
            fontWeight: '500',
            fontSize: '14px',
            marginBottom: '8px',
            color: this.isOwn ? '#ffffff' : '#1f2937'
        });
        pollWrapper.appendChild(question);
        const options = this.message.pollOptions || [];
        options.forEach((option, index) => {
            const optionWrapper = document.createElement('div');
            optionWrapper.className = 'message-poll-option';
            Object.assign(optionWrapper.style, {
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                marginBottom: '4px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
            });
            optionWrapper.addEventListener('mouseenter', () => {
                optionWrapper.style.background = this.isOwn ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.05)';
            });
            optionWrapper.addEventListener('mouseleave', () => {
                optionWrapper.style.background = 'transparent';
            });
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'poll_' + this.message.id;
            radio.value = index;
            radio.style.cursor = 'pointer';
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    EventBus.emit('chat:poll:vote', {
                        messageId: this.message.id,
                        optionIndex: index
                    });
                }
            });
            const label = document.createElement('label');
            label.textContent = option.text || 'Option ' + (index + 1);
            Object.assign(label.style, {
                flex: '1',
                cursor: 'pointer',
                fontSize: '13px',
                color: this.isOwn ? '#e5e7eb' : '#1f2937'
            });
            const percent = document.createElement('span');
            percent.className = 'message-poll-percent';
            percent.textContent = option.votes ? Math.round((option.votes / this.message.totalVotes) * 100) + '%' : '0%';
            Object.assign(percent.style, {
                fontSize: '12px',
                color: this.isOwn ? 'rgba(255,255,255,0.6)' : '#6b7280',
                minWidth: '40px',
                textAlign: 'right'
            });
            optionWrapper.appendChild(radio);
            optionWrapper.appendChild(label);
            optionWrapper.appendChild(percent);
            pollWrapper.appendChild(optionWrapper);
        });
        const totalVotes = document.createElement('div');
        totalVotes.className = 'message-poll-total';
        totalVotes.textContent = (this.message.totalVotes || 0) + ' votes';
        Object.assign(totalVotes.style, {
            fontSize: '11px',
            color: this.isOwn ? 'rgba(255,255,255,0.5)' : '#9ca3af',
            marginTop: '6px',
            textAlign: 'center'
        });
        pollWrapper.appendChild(totalVotes);
        container.appendChild(pollWrapper);
    }

    _renderSystemMessage(container) {
        const text = document.createElement('p');
        text.className = 'message-system-text';
        text.textContent = this.message.text || '';
        Object.assign(text.style, {
            textAlign: 'center',
            fontSize: '12px',
            color: '#9ca3af',
            margin: '0',
            padding: '8px 0'
        });
        container.appendChild(text);
    }

    _renderDeletedMessage(container) {
        const text = document.createElement('p');
        text.className = 'message-deleted-text';
        text.textContent = 'This message was deleted';
        Object.assign(text.style, {
            fontStyle: 'italic',
            color: '#9ca3af',
            fontSize: '13px',
            margin: '0',
            padding: '4px 0'
        });
        container.appendChild(text);
    }

    _createStatusIndicator() {
        const s = document.createElement('div');
        s.className = 'message-status';
        Object.assign(s.style, {
            fontSize: '12px',
            color: '#9ca3af',
            marginTop: '4px',
            textAlign: 'right'
        });
        if (this.message.read) {
            s.textContent = '✓✓ Read';
            s.style.color = '#6366f1';
        } else if (this.message.delivered) {
            s.textContent = '✓✓ Delivered';
            s.style.color = '#9ca3af';
        } else {
            s.textContent = '✓ Sent';
            s.style.color = '#9ca3af';
        }
        return s;
    }

    _createReactions() {
        if (!this.message.reactions || this.message.reactions.length === 0) return null;
        const container = document.createElement('div');
        container.className = 'message-reactions';
        Object.assign(container.style, {
            display: 'flex',
            gap: '4px',
            marginTop: '4px',
            flexWrap: 'wrap'
        });
        this.message.reactions.forEach((reaction) => {
            const item = document.createElement('span');
            item.className = 'message-reaction-item';
            item.textContent = reaction.emoji + ' ' + (reaction.count || 1);
            Object.assign(item.style, {
                background: 'rgba(0,0,0,0.05)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
            });
            item.addEventListener('mouseenter', () => {
                item.style.background = 'rgba(0,0,0,0.1)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = 'rgba(0,0,0,0.05)';
            });
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.onReact) {
                    this.onReact(this.message.id, reaction.emoji);
                }
            });
            container.appendChild(item);
        });
        return container;
    }

    _zoomImage(src, alt) {
        const overlay = document.createElement('div');
        overlay.className = 'chat-image-zoom-overlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.9)',
            zIndex: '9999',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
            animation: 'fadeIn 0.3s ease'
        });
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt || 'Zoomed image';
        Object.assign(img.style, {
            maxWidth: '90%',
            maxHeight: '90%',
            objectFit: 'contain',
            borderRadius: '8px',
            animation: 'zoomIn 0.3s ease'
        });
        overlay.appendChild(img);
        overlay.addEventListener('click', function() {
            this.remove();
            document.body.style.overflow = '';
        });
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
    }

    _toggleAudio() {
        if (!this.audioPlayer) return;
        if (this.isPlaying) {
            this.pauseAudio();
        } else {
            this.playAudio();
        }
    }

    playAudio() {
        if (!this.audioPlayer) return;
        this.audioPlayer.play();
        this.isPlaying = true;
        if (this._audioPlayBtn) {
            this._audioPlayBtn.textContent = '⏸';
        }
        EventBus.emit('chat:audio:play', { messageId: this.message.id });
    }

    pauseAudio() {
        if (!this.audioPlayer) return;
        this.audioPlayer.pause();
        this.isPlaying = false;
        if (this._audioPlayBtn) {
            this._audioPlayBtn.textContent = '▶';
        }
        EventBus.emit('chat:audio:pause', { messageId: this.message.id });
    }

    seekAudio(percent) {
        if (!this.audioPlayer || !this.audioPlayer.duration) return;
        const time = percent * this.audioPlayer.duration;
        this.audioPlayer.currentTime = time;
    }

    _updateAudioProgress() {
        if (!this.audioPlayer || !this._audioProgressFill || !this._audioTimeDisplay) return;
        const percent = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
        this._audioProgressFill.style.width = percent + '%';
        const current = this._formatDuration(this.audioPlayer.currentTime);
        const total = this._formatDuration(this.audioPlayer.duration);
        this._audioTimeDisplay.textContent = current + ' / ' + total;
    }

    _onAudioLoaded() {
        if (!this._audioTimeDisplay) return;
        const total = this._formatDuration(this.audioPlayer.duration);
        this._audioTimeDisplay.textContent = '0:00 / ' + total;
    }

    _onAudioEnded() {
        this.isPlaying = false;
        if (this._audioPlayBtn) {
            this._audioPlayBtn.textContent = '▶';
        }
        if (this._audioProgressFill) {
            this._audioProgressFill.style.width = '0%';
        }
        EventBus.emit('chat:audio:ended', { messageId: this.message.id });
    }

    _formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    }

    _formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    _formatFileSize(bytes) {
        if (!bytes || bytes === 0) return 'Unknown';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return Math.round(size) + ' ' + units[unitIndex];
    }

    _getFileType(filename) {
        if (!filename) return 'file';
        const ext = filename.split('.').pop().toLowerCase();
        const types = {
            'pdf': 'pdf',
            'doc': 'doc',
            'docx': 'doc',
            'xls': 'xls',
            'xlsx': 'xls',
            'ppt': 'ppt',
            'pptx': 'ppt',
            'txt': 'txt',
            'zip': 'zip',
            'rar': 'zip',
            '7z': 'zip',
            'jpg': 'image',
            'jpeg': 'image',
            'png': 'image',
            'gif': 'image',
            'svg': 'image',
            'mp3': 'audio',
            'wav': 'audio',
            'mp4': 'video',
            'avi': 'video',
            'mkv': 'video'
        };
        return types[ext] || 'file';
    }

    _getFileIcon(type) {
        const icons = {
            'pdf': '📄',
            'doc': '📝',
            'xls': '📊',
            'ppt': '📊',
            'txt': '📃',
            'zip': '📦',
            'image': '🖼️',
            'audio': '🎵',
            'video': '🎬',
            'file': '📎'
        };
        return icons[type] || '📎';
    }

    _handleMediaDownload(e) {
        e.stopPropagation();
        if (this.message.media) {
            const link = document.createElement('a');
            link.href = this.message.media;
            link.download = this.message.fileName || 'download';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    _handleFullscreen(e) {
        e.stopPropagation();
        const wrapper = e.target.closest('.message-image-wrapper');
        if (wrapper) {
            const img = wrapper.querySelector('.message-image');
            if (img) {
                this._zoomImage(img.src, img.alt);
            }
        }
    }

    _bindEvents() {
        if (!this.element) return;
        this.element.addEventListener('click', this._handleClick);
        this.element.addEventListener('dblclick', this._handleDoubleClick);
        this.element.addEventListener('touchstart', this._handleTouchStart, { passive: true });
        this.element.addEventListener('touchend', this._handleTouchEnd, { passive: true });
        this.element.addEventListener('touchcancel', this._handleTouchEnd, { passive: true });
        this.element.addEventListener('mousedown', this._handleTouchStart);
        this.element.addEventListener('mouseup', this._handleTouchEnd);
        this.element.addEventListener('mouseleave', this._handleTouchEnd);
        this.element.addEventListener('mouseenter', this._handleMouseEnter);
        this.element.addEventListener('mouseleave', this._handleMouseLeave);
        this.element.addEventListener('contextmenu', this._handleContextMenu);
    }

    _handleClick(e) {
        if (this.isLongPress) {
            this.isLongPress = false;
            return;
        }
        const target = e.target;
        if (target.closest('.message-reply-preview')) return;
        if (target.closest('.message-image-actions')) return;
        if (target.closest('.message-file-download')) return;
    }

    _handleDoubleClick(e) {
        e.stopPropagation();
        if (this.isOwn && this.onReply) {
            this.onReply(this.message);
        }
    }

    _handleTouchStart(e) {
        this.isLongPress = false;
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
        }
        this.longPressTimer = setTimeout(() => {
            this.isLongPress = true;
            if (this.onLongPress) {
                this.onLongPress(this.message, this.element);
            }
        }, 600);
    }

    _handleTouchEnd() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        setTimeout(() => {
            this.isLongPress = false;
        }, 100);
    }

    _handleMouseEnter() {
        this.isHovered = true;
    }

    _handleMouseLeave() {
        this.isHovered = false;
    }

    _handleContextMenu(e) {
        e.preventDefault();
        e.stopPropagation();
        EventBus.emit('chat:message:contextmenu', {
            message: this.message,
            element: this.element
        });
    }

    _handleReactionClick(emoji) {
        if (this.onReact) {
            this.onReact(this.message.id, emoji);
        }
    }

    _handleForwardClick() {
        if (this.onForward) {
            this.onForward(this.message);
        }
    }

    _handleDeleteClick() {
        if (this.onDelete) {
            this.onDelete(this.message.id);
        }
    }

    _handleReportClick() {
        if (this.onReport) {
            this.onReport(this.message);
        }
    }

    _handleCopyClick() {
        if (this.onCopy) {
            this.onCopy(this.message);
        } else {
            const text = this.message.text || '';
            navigator.clipboard.writeText(text).then(() => {
                EventBus.emit('toast:show', {
                    message: 'Copied to clipboard',
                    type: 'success'
                });
            }).catch(() => {});
        }
    }

    _handleReplyClick() {
        if (this.onReply) {
            this.onReply(this.message);
        }
    }

    _setupAccessibility() {
        if (!this.element) return;
        this.element.setAttribute('role', 'article');
        this.element.setAttribute('aria-label', 'Message from ' + (this.isOwn ? 'you' : this.otherUserName));
        if (this.message.text) {
            this.element.setAttribute('aria-description', this.message.text.substring(0, 100));
        }
    }

    updateStatus(status) {
        if (this.isDestroyed || !this.element) return;
        const s = this.element.querySelector('.message-status');
        if (!s) return;
        switch (status) {
            case 'read':
                s.textContent = '✓✓ Read';
                s.style.color = '#6366f1';
                this.message.read = true;
                break;
            case 'delivered':
                s.textContent = '✓✓ Delivered';
                s.style.color = '#9ca3af';
                this.message.delivered = true;
                break;
            case 'sent':
                s.textContent = '✓ Sent';
                s.style.color = '#9ca3af';
                break;
            default:
                break;
        }
        EventBus.emit('chat:message:status', {
            messageId: this.message.id,
            status: status
        });
    }

    updateReadReceipt() {
        this.updateStatus('read');
    }

    updateDeliveryReceipt() {
        this.updateStatus('delivered');
    }

    destroy() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer = null;
        }
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        EventBus.emit('chat:message:destroy', {
            messageId: this.message.id
        });
    }

    static createTextMessage(options) {
        return new ChatMessage({
            message: { type: 'text', ...options.message },
            ...options
        });
    }

    static createImageMessage(options) {
        return new ChatMessage({
            message: { type: 'image', ...options.message },
            ...options
        });
    }

    static createFileMessage(options) {
        return new ChatMessage({
            message: { type: 'file', ...options.message },
            ...options
        });
    }

    static createAudioMessage(options) {
        return new ChatMessage({
            message: { type: 'audio', ...options.message },
            ...options
        });
    }

    static createVideoMessage(options) {
        return new ChatMessage({
            message: { type: 'video', ...options.message },
            ...options
        });
    }

    static createLocationMessage(options) {
        return new ChatMessage({
            message: { type: 'location', ...options.message },
            ...options
        });
    }

    static createContactMessage(options) {
        return new ChatMessage({
            message: { type: 'contact', ...options.message },
            ...options
        });
    }

    static createPollMessage(options) {
        return new ChatMessage({
            message: { type: 'poll', ...options.message },
            ...options
        });
    }

    static createSystemMessage(options) {
        return new ChatMessage({
            message: { type: 'system', ...options.message },
            ...options
        });
    }
}

export default ChatMessage;