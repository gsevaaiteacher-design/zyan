// ============================================================
// FILE: js/widgets/contact-button.js
// PURPOSE: Contact seller button component with multiple contact methods
// DEPENDENCY: constants.js, helpers.js, event-bus.js
// USED BY: product-detail.js, product-card.js, profile-screen.js
// ============================================================

import { APP_CONSTANTS } from '../utils/constants.js';
import { formatPhoneNumber, isValidEmail, generateUUID } from '../utils/helpers.js';
import { EventBus } from '../state/event-bus.js';

export class ContactButton {
    constructor(options = {}) {
        this.sellerId = options.sellerId || '';
        this.sellerName = options.sellerName || 'Seller';
        this.sellerPhoto = options.sellerPhoto || '';
        this.sellerEmail = options.sellerEmail || '';
        this.sellerPhone = options.sellerPhone || '';
        this.productId = options.productId || '';
        this.productTitle = options.productTitle || '';
        this.currentUserId = options.currentUserId || '';
        this.contactMethods = options.contactMethods || ['chat', 'email', 'phone'];
        this.onContact = options.onContact || null;
        this.onChatStart = options.onChatStart || null;
        this.onEmailSend = options.onEmailSend || null;
        this.onPhoneCall = options.onPhoneCall || null;
        this.onWhatsApp = options.onWhatsApp || null;
        this.onTelegram = options.onTelegram || null;
        this.buttonText = options.buttonText || 'Contact Seller';
        this.buttonVariant = options.buttonVariant || 'primary';
        this.buttonSize = options.buttonSize || 'medium';
        this.showDropdown = options.showDropdown !== false;
        this.element = null;
        this.isDestroyed = false;
        this.isOpen = false;
        this.dropdown = null;
        this.overlay = null;
        this.render = this.render.bind(this);
        this.destroy = this.destroy.bind(this);
        this.openDropdown = this.openDropdown.bind(this);
        this.closeDropdown = this.closeDropdown.bind(this);
        this.toggleDropdown = this.toggleDropdown.bind(this);
        this.handleChat = this.handleChat.bind(this);
        this.handleEmail = this.handleEmail.bind(this);
        this.handlePhone = this.handlePhone.bind(this);
        this.handleWhatsApp = this.handleWhatsApp.bind(this);
        this.handleTelegram = this.handleTelegram.bind(this);
        this._handleClickOutside = this._handleClickOutside.bind(this);
        this._handleKeyDown = this._handleKeyDown.bind(this);
        if (!this.sellerId) {
            console.warn('[ContactButton] sellerId is required');
            return;
        }
    }

    render() {
        if (this.isDestroyed) return null;
        if (this.currentUserId === this.sellerId) {
            return this._renderSelfMessage();
        }
        this.element = document.createElement('div');
        this.element.className = 'contact-button-wrapper';
        this.element.setAttribute('role', 'group');
        this.element.setAttribute('aria-label', 'Contact seller options');
        const button = this._createMainButton();
        this.element.appendChild(button);
        if (this.showDropdown && this.contactMethods.length > 1) {
            this.dropdown = this._createDropdown();
            this.element.appendChild(this.dropdown);
            this.overlay = this._createOverlay();
            this.element.appendChild(this.overlay);
        }
        this._bindEvents();
        EventBus.emit('contact:button:render', {
            sellerId: this.sellerId,
            productId: this.productId
        });
        return this.element;
    }

    _renderSelfMessage() {
        const container = document.createElement('div');
        container.className = 'contact-button-self';
        Object.assign(container.style, {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#f3f4f6',
            borderRadius: '8px',
            color: '#6b7280',
            fontSize: '14px',
            fontWeight: '500'
        });
        const icon = document.createElement('span');
        icon.textContent = '👤';
        icon.style.fontSize = '16px';
        const text = document.createElement('span');
        text.textContent = 'This is your own product';
        container.appendChild(icon);
        container.appendChild(text);
        return container;
    }

    _createMainButton() {
        const btn = document.createElement('button');
        btn.className = 'contact-main-button';
        btn.setAttribute('aria-haspopup', 'true');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Contact ' + this.sellerName);
        const sizeStyles = {
            small: { padding: '6px 14px', fontSize: '12px' },
            medium: { padding: '10px 20px', fontSize: '14px' },
            large: { padding: '14px 28px', fontSize: '16px' }
        };
        const variantStyles = {
            primary: { background: '#6366f1', color: '#fff' },
            secondary: { background: '#f3f4f6', color: '#1f2937' },
            success: { background: '#22c55e', color: '#fff' },
            danger: { background: '#ef4444', color: '#fff' },
            warning: { background: '#f59e0b', color: '#fff' },
            outline: { background: 'transparent', color: '#6366f1', border: '2px solid #6366f1' }
        };
        const size = sizeStyles[this.buttonSize] || sizeStyles.medium;
        const variant = variantStyles[this.buttonVariant] || variantStyles.primary;
        Object.assign(btn.style, {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            padding: size.padding,
            fontSize: size.fontSize,
            background: variant.background,
            color: variant.color,
            border: variant.border || 'none',
            position: 'relative',
            whiteSpace: 'nowrap'
        });
        if (this.buttonVariant === 'outline') {
            btn.style.background = 'transparent';
            btn.style.border = '2px solid #6366f1';
            btn.style.color = '#6366f1';
        }
        btn.addEventListener('mouseenter', () => {
            if (this.buttonVariant === 'primary') {
                btn.style.background = '#4f46e5';
                btn.style.transform = 'translateY(-1px)';
                btn.style.boxShadow = '0 4px 12px rgba(99,102,241,0.3)';
            } else if (this.buttonVariant === 'outline') {
                btn.style.background = 'rgba(99,102,241,0.05)';
                btn.style.transform = 'translateY(-1px)';
            } else {
                btn.style.transform = 'translateY(-1px)';
                btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = 'none';
            if (this.buttonVariant === 'primary') {
                btn.style.background = '#6366f1';
            } else if (this.buttonVariant === 'outline') {
                btn.style.background = 'transparent';
            }
        });
        const icon = document.createElement('span');
        icon.className = 'contact-button-icon';
        icon.textContent = '💬';
        icon.style.fontSize = this.buttonSize === 'large' ? '18px' : '14px';
        const text = document.createElement('span');
        text.className = 'contact-button-text';
        text.textContent = this.buttonText;
        if (this.showDropdown && this.contactMethods.length > 1) {
            const arrow = document.createElement('span');
            arrow.className = 'contact-button-arrow';
            arrow.textContent = '▼';
            arrow.style.fontSize = '10px';
            arrow.style.marginLeft = '4px';
            arrow.style.transition = 'transform 0.2s ease';
            btn.appendChild(icon);
            btn.appendChild(text);
            btn.appendChild(arrow);
            btn._arrow = arrow;
        } else {
            btn.appendChild(icon);
            btn.appendChild(text);
        }
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.showDropdown && this.contactMethods.length > 1) {
                this.toggleDropdown();
            } else if (this.contactMethods.length === 1) {
                const method = this.contactMethods[0];
                if (method === 'chat') this.handleChat();
                else if (method === 'email') this.handleEmail();
                else if (method === 'phone') this.handlePhone();
                else if (method === 'whatsapp') this.handleWhatsApp();
                else if (method === 'telegram') this.handleTelegram();
            }
        });
        return btn;
    }

    _createDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = 'contact-dropdown';
        dropdown.setAttribute('role', 'menu');
        dropdown.setAttribute('aria-label', 'Contact methods');
        Object.assign(dropdown.style, {
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '0',
            minWidth: '220px',
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            padding: '6px 0',
            zIndex: '1000',
            opacity: '0',
            visibility: 'hidden',
            transform: 'translateY(-8px) scale(0.98)',
            transition: 'all 0.2s ease',
            border: '1px solid #e5e7eb'
        });
        const methods = [
            { id: 'chat', icon: '💬', label: 'Chat with ' + this.sellerName, handler: this.handleChat },
            { id: 'email', icon: '📧', label: 'Send Email', handler: this.handleEmail },
            { id: 'phone', icon: '📞', label: 'Call ' + this.sellerName, handler: this.handlePhone },
            { id: 'whatsapp', icon: '💚', label: 'WhatsApp', handler: this.handleWhatsApp },
            { id: 'telegram', icon: '✈️', label: 'Telegram', handler: this.handleTelegram }
        ];
        methods.forEach((method) => {
            if (!this.contactMethods.includes(method.id)) return;
            const item = document.createElement('button');
            item.className = 'contact-dropdown-item';
            item.setAttribute('role', 'menuitem');
            item.dataset.method = method.id;
            Object.assign(item.style, {
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#1f2937',
                transition: 'background 0.15s ease',
                borderRadius: '0',
                fontFamily: 'inherit'
            });
            item.addEventListener('mouseenter', () => {
                item.style.background = '#f3f4f6';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = 'none';
            });
            const icon = document.createElement('span');
            icon.textContent = method.icon;
            icon.style.fontSize = '16px';
            const label = document.createElement('span');
            label.textContent = method.label;
            item.appendChild(icon);
            item.appendChild(label);
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeDropdown();
                method.handler();
            });
            dropdown.appendChild(item);
        });
        const divider = document.createElement('div');
        divider.style.cssText = 'height: 1px; background: #e5e7eb; margin: 4px 12px;';
        dropdown.appendChild(divider);
        const closeItem = document.createElement('button');
        closeItem.className = 'contact-dropdown-close';
        closeItem.setAttribute('role', 'menuitem');
        closeItem.textContent = '✕ Close';
        Object.assign(closeItem.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '8px 16px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#9ca3af',
            transition: 'background 0.15s ease',
            borderRadius: '0',
            fontFamily: 'inherit'
        });
        closeItem.addEventListener('mouseenter', () => {
            closeItem.style.background = '#f3f4f6';
            closeItem.style.color = '#ef4444';
        });
        closeItem.addEventListener('mouseleave', () => {
            closeItem.style.background = 'none';
            closeItem.style.color = '#9ca3af';
        });
        closeItem.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closeDropdown();
        });
        dropdown.appendChild(closeItem);
        return dropdown;
    }

    _createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'contact-dropdown-overlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            zIndex: '999',
            display: 'none',
            cursor: 'default'
        });
        overlay.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closeDropdown();
        });
        return overlay;
    }

    _bindEvents() {
        if (!this.element) return;
        document.addEventListener('click', this._handleClickOutside);
        document.addEventListener('keydown', this._handleKeyDown);
    }

    _handleClickOutside(e) {
        if (!this.element) return;
        if (this.isOpen && !this.element.contains(e.target)) {
            this.closeDropdown();
        }
    }

    _handleKeyDown(e) {
        if (e.key === 'Escape' && this.isOpen) {
            this.closeDropdown();
        }
        if (e.key === 'Tab' && this.isOpen) {
            const focusable = this.dropdown ? 
                this.dropdown.querySelectorAll('button') : [];
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first?.focus();
            }
        }
    }

    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        if (this.isOpen || !this.dropdown || !this.overlay) return;
        this.isOpen = true;
        this.dropdown.style.opacity = '1';
        this.dropdown.style.visibility = 'visible';
        this.dropdown.style.transform = 'translateY(0) scale(1)';
        this.overlay.style.display = 'block';
        const mainBtn = this.element.querySelector('.contact-main-button');
        if (mainBtn) {
            mainBtn.setAttribute('aria-expanded', 'true');
            if (mainBtn._arrow) {
                mainBtn._arrow.style.transform = 'rotate(180deg)';
            }
        }
        const firstItem = this.dropdown.querySelector('.contact-dropdown-item');
        if (firstItem) {
            setTimeout(() => firstItem.focus(), 50);
        }
    }

    closeDropdown() {
        if (!this.isOpen || !this.dropdown || !this.overlay) return;
        this.isOpen = false;
        this.dropdown.style.opacity = '0';
        this.dropdown.style.visibility = 'hidden';
        this.dropdown.style.transform = 'translateY(-8px) scale(0.98)';
        this.overlay.style.display = 'none';
        const mainBtn = this.element.querySelector('.contact-main-button');
        if (mainBtn) {
            mainBtn.setAttribute('aria-expanded', 'false');
            if (mainBtn._arrow) {
                mainBtn._arrow.style.transform = 'rotate(0deg)';
            }
        }
    }

    handleChat() {
        if (!this.currentUserId) {
            EventBus.emit('toast:show', {
                message: 'Please login to start chat',
                type: 'warning'
            });
            EventBus.emit('auth:required', { action: 'chat' });
            return;
        }
        if (this.onChatStart) {
            this.onChatStart({
                sellerId: this.sellerId,
                sellerName: this.sellerName,
                sellerPhoto: this.sellerPhoto,
                productId: this.productId,
                productTitle: this.productTitle
            });
        } else {
            EventBus.emit('chat:start', {
                userId: this.sellerId,
                userName: this.sellerName,
                userPhoto: this.sellerPhoto,
                productId: this.productId,
                productTitle: this.productTitle
            });
        }
        if (this.onContact) {
            this.onContact('chat');
        }
        EventBus.emit('contact:chat', {
            sellerId: this.sellerId,
            productId: this.productId
        });
    }

    handleEmail() {
        if (!this.sellerEmail) {
            EventBus.emit('toast:show', {
                message: 'Seller email not available',
                type: 'error'
            });
            return;
        }
        const subject = encodeURIComponent('Inquiry about: ' + this.productTitle);
        const body = encodeURIComponent(
            'Hello ' + this.sellerName + ',\n\n' +
            'I am interested in your product: ' + this.productTitle + '\n\n' +
            'Please let me know more details.\n\n' +
            'Thank you.'
        );
        window.location.href = 'mailto:' + this.sellerEmail + '?subject=' + subject + '&body=' + body;
        if (this.onEmailSend) {
            this.onEmailSend({
                sellerId: this.sellerId,
                sellerEmail: this.sellerEmail,
                productId: this.productId
            });
        }
        if (this.onContact) {
            this.onContact('email');
        }
        EventBus.emit('contact:email', {
            sellerId: this.sellerId,
            productId: this.productId
        });
    }

    handlePhone() {
        if (!this.sellerPhone) {
            EventBus.emit('toast:show', {
                message: 'Seller phone not available',
                type: 'error'
            });
            return;
        }
        const phone = this.sellerPhone.replace(/[\s\-\(\)]/g, '');
        if (confirm('Call ' + this.sellerName + ' at ' + this.sellerPhone + '?')) {
            window.location.href = 'tel:' + phone;
            if (this.onPhoneCall) {
                this.onPhoneCall({
                    sellerId: this.sellerId,
                    phone: this.sellerPhone,
                    productId: this.productId
                });
            }
            if (this.onContact) {
                this.onContact('phone');
            }
            EventBus.emit('contact:phone', {
                sellerId: this.sellerId,
                productId: this.productId
            });
        }
    }

    handleWhatsApp() {
        if (!this.sellerPhone) {
            EventBus.emit('toast:show', {
                message: 'Seller phone not available',
                type: 'error'
            });
            return;
        }
        const phone = this.sellerPhone.replace(/[\s\-\(\)]/g, '');
        const message = encodeURIComponent(
            'Hello ' + this.sellerName + ',\n\n' +
            'I am interested in your product: ' + this.productTitle + '\n\n' +
            'Please let me know more details.'
        );
        window.open('https://wa.me/' + phone + '?text=' + message, '_blank');
        if (this.onWhatsApp) {
            this.onWhatsApp({
                sellerId: this.sellerId,
                phone: this.sellerPhone,
                productId: this.productId
            });
        }
        if (this.onContact) {
            this.onContact('whatsapp');
        }
        EventBus.emit('contact:whatsapp', {
            sellerId: this.sellerId,
            productId: this.productId
        });
    }

    handleTelegram() {
        if (!this.sellerPhone && !this.sellerTelegram) {
            EventBus.emit('toast:show', {
                message: 'Seller Telegram not available',
                type: 'error'
            });
            return;
        }
        const telegramId = this.sellerTelegram || this.sellerPhone;
        const cleaned = telegramId.replace(/[\s\-\(\)]/g, '');
        window.open('https://t.me/' + cleaned, '_blank');
        if (this.onTelegram) {
            this.onTelegram({
                sellerId: this.sellerId,
                telegramId: telegramId,
                productId: this.productId
            });
        }
        if (this.onContact) {
            this.onContact('telegram');
        }
        EventBus.emit('contact:telegram', {
            sellerId: this.sellerId,
            productId: this.productId
        });
    }

    setContactMethod(method) {
        if (!this.contactMethods.includes(method)) {
            this.contactMethods.push(method);
        }
        this.closeDropdown();
        if (this.element) {
            const newElement = this.render();
            if (newElement && this.element.parentNode) {
                this.element.parentNode.replaceChild(newElement, this.element);
                this.element = newElement;
            }
        }
    }

    removeContactMethod(method) {
        this.contactMethods = this.contactMethods.filter(m => m !== method);
        if (this.contactMethods.length === 0) {
            this.contactMethods = ['chat'];
        }
        this.closeDropdown();
        if (this.element) {
            const newElement = this.render();
            if (newElement && this.element.parentNode) {
                this.element.parentNode.replaceChild(newElement, this.element);
                this.element = newElement;
            }
        }
    }

    updateButtonText(text) {
        this.buttonText = text;
        if (this.element) {
            const textEl = this.element.querySelector('.contact-button-text');
            if (textEl) {
                textEl.textContent = text;
            }
        }
    }

    updateVariant(variant) {
        this.buttonVariant = variant;
        if (this.element) {
            const newElement = this.render();
            if (newElement && this.element.parentNode) {
                this.element.parentNode.replaceChild(newElement, this.element);
                this.element = newElement;
            }
        }
    }

    destroy() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        this.closeDropdown();
        document.removeEventListener('click', this._handleClickOutside);
        document.removeEventListener('keydown', this._handleKeyDown);
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.dropdown = null;
        this.overlay = null;
        EventBus.emit('contact:button:destroy', {
            sellerId: this.sellerId
        });
    }

    static createChatButton(options) {
        return new ContactButton({
            contactMethods: ['chat'],
            buttonText: '💬 Chat',
            buttonVariant: 'primary',
            ...options
        });
    }

    static createCallButton(options) {
        return new ContactButton({
            contactMethods: ['phone'],
            buttonText: '📞 Call',
            buttonVariant: 'success',
            ...options
        });
    }

    static createEmailButton(options) {
        return new ContactButton({
            contactMethods: ['email'],
            buttonText: '📧 Email',
            buttonVariant: 'secondary',
            ...options
        });
    }

    static createWhatsAppButton(options) {
        return new ContactButton({
            contactMethods: ['whatsapp'],
            buttonText: '💚 WhatsApp',
            buttonVariant: 'success',
            ...options
        });
    }

    static createFullContactButton(options) {
        return new ContactButton({
            contactMethods: ['chat', 'email', 'phone', 'whatsapp'],
            buttonText: '📞 Contact Seller',
            buttonVariant: 'primary',
            showDropdown: true,
            ...options
        });
    }
}

export default ContactButton;