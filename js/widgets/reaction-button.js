// ============================================================
// FILE: js/widgets/reaction-button.js
// PURPOSE: Instagram-style reaction button with emoji picker and animations
// DEPENDENCY: constants.js, helpers.js, event-bus.js
// USED BY: social-feed.js, post-card.js, comment-section.js
// ============================================================

import { APP_CONSTANTS } from '../utils/constants.js';
import { debounce, generateUUID } from '../utils/helpers.js';
import { EventBus } from '../state/event-bus.js';

export class ReactionButton {
    constructor(options = {}) {
        this.targetId = options.targetId || '';
        this.targetType = options.targetType || 'post';
        this.currentUserId = options.currentUserId || '';
        this.reactions = options.reactions || [];
        this.totalReactions = options.totalReactions || 0;
        this.userReaction = options.userReaction || null;
        this.size = options.size || 'medium';
        this.position = options.position || 'bottom';
        this.showCount = options.showCount !== false;
        this.showTooltip = options.showTooltip !== false;
        this.animate = options.animate !== false;
        this.onReaction = options.onReaction || null;
        this.onReactionRemove = options.onReactionRemove || null;
        this.onReactionHover = options.onReactionHover || null;
        this.pickerPosition = options.pickerPosition || 'top';
        this.emojiSize = options.emojiSize || 'large';
        this.element = null;
        this.isDestroyed = false;
        this.isOpen = false;
        this.picker = null;
        this.overlay = null;
        this.tooltip = null;
        this.isHovering = false;
        this.animationTimeout = null;
        this.render = this.render.bind(this);
        this.destroy = this.destroy.bind(this);
        this.togglePicker = this.togglePicker.bind(this);
        this.openPicker = this.openPicker.bind(this);
        this.closePicker = this.closePicker.bind(this);
        this.handleReaction = this.handleReaction.bind(this);
        this.removeReaction = this.removeReaction.bind(this);
        this.updateReactions = this.updateReactions.bind(this);
        this._handleClickOutside = this._handleClickOutside.bind(this);
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._handleMouseEnter = this._handleMouseEnter.bind(this);
        this._handleMouseLeave = this._handleMouseLeave.bind(this);
        if (!this.targetId) {
            console.warn('[ReactionButton] targetId is required');
            return;
        }
    }

    render() {
        if (this.isDestroyed || !this.targetId) return null;
        this.element = document.createElement('div');
        this.element.className = 'reaction-button-wrapper';
        this.element.dataset.targetId = this.targetId;
        this.element.dataset.targetType = this.targetType;
        this.element.setAttribute('role', 'group');
        this.element.setAttribute('aria-label', 'Reaction button');
        this.element.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 4px;
            position: relative;
            font-family: inherit;
        `;
        const button = this._createButton();
        this.element.appendChild(button);
        if (this.showCount) {
            const count = this._createCount();
            this.element.appendChild(count);
        }
        this._bindEvents();
        EventBus.emit('reaction:button:render', {
            targetId: this.targetId,
            targetType: this.targetType,
            totalReactions: this.totalReactions
        });
        return this.element;
    }

    _createButton() {
        const btn = document.createElement('button');
        btn.className = 'reaction-main-button';
        btn.setAttribute('aria-haspopup', 'true');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Add reaction');
        btn.setAttribute('type', 'button');
        const sizeMap = {
            small: { padding: '4px 8px', fontSize: '16px', iconSize: '18px' },
            medium: { padding: '6px 12px', fontSize: '18px', iconSize: '22px' },
            large: { padding: '8px 16px', fontSize: '22px', iconSize: '28px' }
        };
        const size = sizeMap[this.size] || sizeMap.medium;
        const isActive = this.userReaction !== null && this.userReaction !== undefined;
        const displayEmoji = isActive ? this.userReaction : '😊';
        btn.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            padding: ${size.padding};
            border: 2px solid ${isActive ? 'var(--primary-color, #6366f1)' : 'var(--border-color, #e5e7eb)'};
            border-radius: 50%;
            background: ${isActive ? 'var(--primary-light, #eef2ff)' : 'var(--button-bg, #ffffff)'};
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: ${size.fontSize};
            font-family: inherit;
            width: ${parseInt(size.padding) * 2 + parseInt(size.iconSize) + 8}px;
            height: ${parseInt(size.padding) * 2 + parseInt(size.iconSize) + 8}px;
            min-width: 40px;
            min-height: 40px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
            position: relative;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        `;
        btn.addEventListener('mouseenter', () => {
            if (!isActive) {
                btn.style.borderColor = 'var(--primary-color, #6366f1)';
                btn.style.background = 'var(--hover-bg, #f3f4f6)';
                btn.style.transform = 'scale(1.05)';
                btn.style.boxShadow = '0 4px 12px rgba(99,102,241,0.2)';
            } else {
                btn.style.transform = 'scale(1.05)';
                btn.style.boxShadow = '0 4px 12px rgba(99,102,241,0.2)';
            }
        });
        btn.addEventListener('mouseleave', () => {
            if (!isActive) {
                btn.style.borderColor = 'var(--border-color, #e5e7eb)';
                btn.style.background = 'var(--button-bg, #ffffff)';
            } else {
                btn.style.borderColor = 'var(--primary-color, #6366f1)';
                btn.style.background = 'var(--primary-light, #eef2ff)';
            }
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
        });
        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'reaction-emoji-display';
        emojiSpan.textContent = displayEmoji;
        emojiSpan.style.cssText = `
            font-size: ${size.iconSize};
            line-height: 1;
            transition: transform 0.2s ease;
        `;
        if (this.animate && isActive) {
            emojiSpan.style.animation = 'reactionPop 0.4s ease';
        }
        btn.appendChild(emojiSpan);
        if (isActive) {
            const removeBtn = document.createElement('span');
            removeBtn.className = 'reaction-remove-indicator';
            removeBtn.textContent = '×';
            removeBtn.setAttribute('aria-label', 'Remove reaction');
            removeBtn.style.cssText = `
                position: absolute;
                top: -6px;
                right: -6px;
                background: var(--danger-color, #ef4444);
                color: #fff;
                border-radius: 50%;
                width: 16px;
                height: 16px;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                opacity: 0;
                transition: opacity 0.2s ease;
                pointer-events: none;
            `;
            btn.appendChild(removeBtn);
            btn.addEventListener('mouseenter', () => {
                removeBtn.style.opacity = '1';
            });
            btn.addEventListener('mouseleave', () => {
                removeBtn.style.opacity = '0';
            });
            btn._removeIndicator = removeBtn;
        }
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.userReaction) {
                this.removeReaction();
            } else {
                this.togglePicker();
            }
        });
        btn._emojiSpan = emojiSpan;
        this._mainButton = btn;
        return btn;
    }

    _createCount() {
        const count = document.createElement('span');
        count.className = 'reaction-count';
        count.textContent = this.totalReactions > 0 ? this.totalReactions : '';
        count.style.cssText = `
            font-size: 14px;
            color: var(--text-secondary, #6b7280);
            font-weight: 500;
            min-width: 20px;
            transition: all 0.2s ease;
            cursor: default;
        `;
        if (this.totalReactions > 0) {
            count.style.color = 'var(--text-primary, #1f2937)';
        }
        this._countDisplay = count;
        return count;
    }

    _createPicker() {
        const picker = document.createElement('div');
        picker.className = 'reaction-picker';
        picker.setAttribute('role', 'menu');
        picker.setAttribute('aria-label', 'Reaction picker');
        const positionMap = {
            top: { bottom: 'calc(100% + 8px)', top: 'auto' },
            bottom: { top: 'calc(100% + 8px)', bottom: 'auto' },
            left: { right: 'calc(100% + 8px)', left: 'auto', top: '50%', transform: 'translateY(-50%)' },
            right: { left: 'calc(100% + 8px)', right: 'auto', top: '50%', transform: 'translateY(-50%)' }
        };
        const pos = positionMap[this.pickerPosition] || positionMap.top;
        picker.style.cssText = `
            position: absolute;
            ${pos.top ? 'top: ' + pos.top + ';' : ''}
            ${pos.bottom ? 'bottom: ' + pos.bottom + ';' : ''}
            ${pos.left ? 'left: ' + pos.left + ';' : ''}
            ${pos.right ? 'right: ' + pos.right + ';' : ''}
            ${pos.transform ? 'transform: ' + pos.transform + ';' : ''}
            background: var(--picker-bg, #ffffff);
            border-radius: 16px;
            padding: 8px 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            display: flex;
            gap: 6px;
            z-index: 1000;
            border: 1px solid var(--border-color, #e5e7eb);
            opacity: 0;
            visibility: hidden;
            transform: scale(0.8) ${pos.transform || ''};
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            pointer-events: none;
            flex-wrap: wrap;
            max-width: 280px;
        `;
        const emojis = this._getEmojis();
        emojis.forEach((emoji) => {
            const btn = document.createElement('button');
            btn.className = 'reaction-picker-emoji';
            btn.setAttribute('role', 'menuitem');
            btn.setAttribute('aria-label', 'React with ' + emoji);
            btn.textContent = emoji;
            btn.style.cssText = `
                font-size: ${this.emojiSize === 'large' ? '32px' : this.emojiSize === 'small' ? '22px' : '28px'};
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px 6px;
                border-radius: 50%;
                transition: all 0.15s ease;
                line-height: 1;
                width: 44px;
                height: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: inherit;
            `;
            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'var(--hover-bg, #f3f4f6)';
                btn.style.transform = 'scale(1.2)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'transparent';
                btn.style.transform = 'scale(1)';
            });
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleReaction(emoji);
            });
            picker.appendChild(btn);
        });
        const closeBtn = document.createElement('button');
        closeBtn.className = 'reaction-picker-close';
        closeBtn.textContent = '✕';
        closeBtn.setAttribute('aria-label', 'Close reaction picker');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            font-size: 14px;
            color: var(--text-muted, #9ca3af);
            padding: 4px 8px;
            border-radius: 50%;
            transition: background 0.15s ease;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'var(--hover-bg, #f3f4f6)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'transparent';
        });
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closePicker();
        });
        picker.appendChild(closeBtn);
        this._picker = picker;
        return picker;
    }

    _createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'reaction-picker-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 999;
            display: none;
            cursor: default;
        `;
        overlay.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closePicker();
        });
        this._overlay = overlay;
        return overlay;
    }

    _getEmojis() {
        return ['❤️', '😍', '😂', '😮', '😢', '😡', '🎉', '🔥', '👍', '👏', '💯', '🤔', '✨', '💪', '🙌'];
    }

    togglePicker() {
        if (this.isOpen) {
            this.closePicker();
        } else {
            this.openPicker();
        }
    }

    openPicker() {
        if (this.isOpen || this.isDestroyed) return;
        if (this.userReaction) {
            this.removeReaction();
            return;
        }
        this.isOpen = true;
        if (!this._picker) {
            this._picker = this._createPicker();
            this.element.appendChild(this._picker);
        }
        if (!this._overlay) {
            this._overlay = this._createOverlay();
            document.body.appendChild(this._overlay);
        }
        this._picker.style.opacity = '1';
        this._picker.style.visibility = 'visible';
        this._picker.style.transform = 'scale(1) ' + (this.pickerPosition === 'top' || this.pickerPosition === 'bottom' ? '' : 'translateY(-50%)');
        this._overlay.style.display = 'block';
        if (this._mainButton) {
            this._mainButton.setAttribute('aria-expanded', 'true');
            this._mainButton.style.borderColor = 'var(--primary-color, #6366f1)';
            this._mainButton.style.background = 'var(--primary-light, #eef2ff)';
        }
        setTimeout(() => {
            const firstEmoji = this._picker?.querySelector('.reaction-picker-emoji');
            if (firstEmoji) firstEmoji.focus();
        }, 100);
        EventBus.emit('reaction:picker:open', {
            targetId: this.targetId,
            targetType: this.targetType
        });
    }

    closePicker() {
        if (!this.isOpen || this.isDestroyed) return;
        this.isOpen = false;
        if (this._picker) {
            this._picker.style.opacity = '0';
            this._picker.style.visibility = 'hidden';
            this._picker.style.transform = 'scale(0.8) ' + (this.pickerPosition === 'top' || this.pickerPosition === 'bottom' ? '' : 'translateY(-50%)');
        }
        if (this._overlay) {
            this._overlay.style.display = 'none';
        }
        if (this._mainButton) {
            this._mainButton.setAttribute('aria-expanded', 'false');
            if (!this.userReaction) {
                this._mainButton.style.borderColor = 'var(--border-color, #e5e7eb)';
                this._mainButton.style.background = 'var(--button-bg, #ffffff)';
            }
        }
        EventBus.emit('reaction:picker:close', {
            targetId: this.targetId,
            targetType: this.targetType
        });
    }

    handleReaction(emoji) {
        if (this.isDestroyed) return;
        if (this.userReaction === emoji) {
            this.removeReaction();
            return;
        }
        const oldReaction = this.userReaction;
        this.userReaction = emoji;
        if (this.onReaction) {
            this.onReaction(this.targetId, emoji, oldReaction);
        }
        this.totalReactions += oldReaction ? 0 : 1;
        this.closePicker();
        this._updateUI(emoji);
        EventBus.emit('reaction:added', {
            targetId: this.targetId,
            targetType: this.targetType,
            emoji: emoji,
            totalReactions: this.totalReactions
        });
        if (this._mainButton) {
            this._mainButton.style.animation = 'reactionButtonPop 0.3s ease';
            setTimeout(() => {
                if (this._mainButton) {
                    this._mainButton.style.animation = '';
                }
            }, 300);
        }
    }

    removeReaction() {
        if (this.isDestroyed || !this.userReaction) return;
        const oldReaction = this.userReaction;
        this.userReaction = null;
        this.totalReactions = Math.max(0, this.totalReactions - 1);
        if (this.onReactionRemove) {
            this.onReactionRemove(this.targetId, oldReaction);
        }
        this.closePicker();
        this._updateUI(null);
        EventBus.emit('reaction:removed', {
            targetId: this.targetId,
            targetType: this.targetType,
            emoji: oldReaction,
            totalReactions: this.totalReactions
        });
    }

    _updateUI(emoji) {
        if (this._mainButton) {
            const emojiSpan = this._mainButton._emojiSpan;
            if (emojiSpan) {
                if (emoji) {
                    emojiSpan.textContent = emoji;
                    if (this.animate) {
                        emojiSpan.style.animation = 'reactionPop 0.4s ease';
                        setTimeout(() => {
                            emojiSpan.style.animation = '';
                        }, 400);
                    }
                } else {
                    emojiSpan.textContent = '😊';
                }
            }
            if (emoji) {
                this._mainButton.style.borderColor = 'var(--primary-color, #6366f1)';
                this._mainButton.style.background = 'var(--primary-light, #eef2ff)';
                if (!this._mainButton._removeIndicator) {
                    const removeBtn = document.createElement('span');
                    removeBtn.className = 'reaction-remove-indicator';
                    removeBtn.textContent = '×';
                    removeBtn.style.cssText = `
                        position: absolute;
                        top: -6px;
                        right: -6px;
                        background: var(--danger-color, #ef4444);
                        color: #fff;
                        border-radius: 50%;
                        width: 16px;
                        height: 16px;
                        font-size: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 700;
                        opacity: 0;
                        transition: opacity 0.2s ease;
                        pointer-events: none;
                    `;
                    this._mainButton.appendChild(removeBtn);
                    this._mainButton._removeIndicator = removeBtn;
                    this._mainButton.addEventListener('mouseenter', () => {
                        if (this._mainButton._removeIndicator) {
                            this._mainButton._removeIndicator.style.opacity = '1';
                        }
                    });
                    this._mainButton.addEventListener('mouseleave', () => {
                        if (this._mainButton._removeIndicator) {
                            this._mainButton._removeIndicator.style.opacity = '0';
                        }
                    });
                }
            } else {
                this._mainButton.style.borderColor = 'var(--border-color, #e5e7eb)';
                this._mainButton.style.background = 'var(--button-bg, #ffffff)';
                if (this._mainButton._removeIndicator) {
                    this._mainButton._removeIndicator.remove();
                    this._mainButton._removeIndicator = null;
                }
            }
        }
        if (this._countDisplay) {
            this._countDisplay.textContent = this.totalReactions > 0 ? this.totalReactions : '';
            if (this.totalReactions > 0) {
                this._countDisplay.style.color = 'var(--text-primary, #1f2937)';
            } else {
                this._countDisplay.style.color = 'var(--text-secondary, #6b7280)';
            }
            if (this.animate) {
                this._countDisplay.style.animation = 'countPop 0.3s ease';
                setTimeout(() => {
                    if (this._countDisplay) {
                        this._countDisplay.style.animation = '';
                    }
                }, 300);
            }
        }
        if (this.element) {
            const mainBtn = this.element.querySelector('.reaction-main-button');
            if (mainBtn) {
                const ariaLabel = emoji ? 'Remove ' + emoji + ' reaction' : 'Add reaction';
                mainBtn.setAttribute('aria-label', ariaLabel);
            }
        }
    }

    updateReactions(totalReactions, userReaction) {
        if (this.isDestroyed) return;
        if (totalReactions !== undefined) {
            this.totalReactions = totalReactions;
        }
        if (userReaction !== undefined) {
            this.userReaction = userReaction;
        }
        this._updateUI(this.userReaction);
    }

    _bindEvents() {
        if (!this.element) return;
        document.addEventListener('click', this._handleClickOutside);
        document.addEventListener('keydown', this._handleKeyDown);
        if (this.showTooltip) {
            this.element.addEventListener('mouseenter', this._handleMouseEnter);
            this.element.addEventListener('mouseleave', this._handleMouseLeave);
        }
    }

    _handleClickOutside(e) {
        if (this.isOpen && this.element && !this.element.contains(e.target)) {
            this.closePicker();
        }
    }

    _handleKeyDown(e) {
        if (e.key === 'Escape' && this.isOpen) {
            this.closePicker();
        }
        if (e.key === 'Enter' || e.key === ' ') {
            const target = e.target;
            if (target.classList.contains('reaction-picker-emoji')) {
                e.preventDefault();
                target.click();
            }
        }
    }

    _handleMouseEnter() {
        this.isHovering = true;
        if (this.onReactionHover) {
            this.onReactionHover(this.targetId, true);
        }
        if (this._mainButton && !this.userReaction) {
            this._mainButton.style.transform = 'scale(1.05)';
            this._mainButton.style.boxShadow = '0 4px 12px rgba(99,102,241,0.2)';
        }
    }

    _handleMouseLeave() {
        this.isHovering = false;
        if (this.onReactionHover) {
            this.onReactionHover(this.targetId, false);
        }
        if (this._mainButton && !this.userReaction) {
            this._mainButton.style.transform = 'scale(1)';
            this._mainButton.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
        }
    }

    destroy() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        this.closePicker();
        if (this._overlay && this._overlay.parentNode) {
            this._overlay.parentNode.removeChild(this._overlay);
        }
        document.removeEventListener('click', this._handleClickOutside);
        document.removeEventListener('keydown', this._handleKeyDown);
        if (this._mainButton) {
            this._mainButton._emojiSpan = null;
            this._mainButton._removeIndicator = null;
        }
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this._picker = null;
        this._overlay = null;
        this._mainButton = null;
        this._countDisplay = null;
        EventBus.emit('reaction:button:destroy', {
            targetId: this.targetId,
            targetType: this.targetType
        });
    }

    static createWithReactions(options) {
        return new ReactionButton({
            showCount: true,
            showTooltip: true,
            animate: true,
            ...options
        });
    }

    static createSimple(options) {
        return new ReactionButton({
            showCount: false,
            showTooltip: false,
            animate: false,
            ...options
        });
    }
}

export default ReactionButton;