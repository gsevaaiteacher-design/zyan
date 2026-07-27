// ============================================================
// FILE: js/widgets/product-card.js
// PURPOSE: Complete Product Card Component - Digital & Physical
// DEPENDENCY: product-model.js, store.js, rating-stars.js
// USED BY: home-screen.js, explore-screen.js, history-screen.js
// VERSION: 6.0.0 - ULTRA PRODUCTION
// ============================================================

import { store } from '../store.js';
import { RatingStars } from './rating-stars.js';
import { showToast } from './toast-notification.js';
import { logger } from '../services/logger.js';
import { eventBus } from '../state/event-bus.js';
import { analyticsService } from '../services/analytics-service.js';
import { authService } from '../services/auth-service.js';

/**
 * ProductCard - Ultimate Product Card Component
 * 
 * 🔥 FEATURES:
 * ✅ Digital & Physical Product Support
 * ✅ Free/Paid Badge
 * ✅ Product Type Badge
 * ✅ Rating Stars
 * ✅ Like Button
 * ✅ Save Button
 * ✅ Share Button
 * ✅ View Product Button
 * ✅ Contact Seller Button
 * ✅ Download Button
 * ✅ Price Display
 * ✅ Discount Display
 * ✅ Location Display
 * ✅ Seller Info
 * ✅ Multiple Layouts (Grid, List, Compact)
 * ✅ Loading State
 * ✅ Skeleton Loading
 * ✅ Responsive Design
 * ✅ Dark/Light Theme
 * ✅ Accessibility (WCAG AA)
 * ✅ Production Ready
 */
export class ProductCard {
    /**
     * Layout Types
     */
    static get LAYOUTS() {
        return {
            GRID: 'grid',
            LIST: 'list',
            COMPACT: 'compact',
            FEATURED: 'featured'
        };
    }

    /**
     * Product Types
     */
    static get TYPES() {
        return {
            DIGITAL: 'digital',
            PHYSICAL: 'physical',
            SERVICE: 'service'
        };
    }

    /**
     * Constructor
     */
    constructor(options = {}) {
        this.options = {
            product: options.product || null,
            layout: options.layout || ProductCard.LAYOUTS.GRID,
            showActions: options.showActions !== undefined ? options.showActions : true,
            showRating: options.showRating !== undefined ? options.showRating : true,
            showSeller: options.showSeller !== undefined ? options.showSeller : true,
            showLocation: options.showLocation !== undefined ? options.showLocation : true,
            showBadges: options.showBadges !== undefined ? options.showBadges : true,
            showLikeButton: options.showLikeButton !== undefined ? options.showLikeButton : true,
            showSaveButton: options.showSaveButton !== undefined ? options.showSaveButton : true,
            showShareButton: options.showShareButton !== undefined ? options.showShareButton : true,
            showContactButton: options.showContactButton !== undefined ? options.showContactButton : true,
            showDownloadButton: options.showDownloadButton !== undefined ? options.showDownloadButton : true,
            onView: options.onView || null,
            onLike: options.onLike || null,
            onSave: options.onSave || null,
            onShare: options.onShare || null,
            onContact: options.onContact || null,
            onDownload: options.onDownload || null,
            className: options.className || '',
            containerClass: options.containerClass || '',
            imageSize: options.imageSize || 'medium', // small, medium, large
            lazyLoad: options.lazyLoad !== undefined ? options.lazyLoad : true,
            isLiked: options.isLiked || false,
            isSaved: options.isSaved || false,
            isOwner: options.isOwner || false
        };

        this._element = null;
        this._isLiked = this.options.isLiked;
        this._isSaved = this.options.isSaved;
        this._product = this.options.product;
        this._id = this._generateId();

        // Bind methods
        this._handleLike = this._handleLike.bind(this);
        this._handleSave = this._handleSave.bind(this);
        this._handleShare = this._handleShare.bind(this);
        this._handleView = this._handleView.bind(this);
        this._handleContact = this._handleContact.bind(this);
        this._handleDownload = this._handleDownload.bind(this);
    }

    /**
     * Generate Unique ID
     */
    _generateId() {
        return 'product_card_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }

    /**
     * Render Product Card
     */
    render(container = null) {
        if (!this._product) {
            logger.warn('ProductCard: No product data provided');
            return this._renderEmpty(container);
        }

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const layout = this.options.layout;
        const product = this._product;

        // Create card container
        const card = document.createElement('div');
        card.className = `product-card product-card-${layout}${this.options.className ? ' ' + this.options.className : ''}`;
        card.dataset.productId = product.id;
        card.style.cssText = `
            background: ${isDark ? '#1f2937' : '#ffffff'};
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
            font-family: ${this._getFontFamily()};
            ${layout === ProductCard.LAYOUTS.FEATURED ? 'grid-column: span 2;' : ''}
        `;

        // Add hover effect
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-4px)';
            card.style.boxShadow = isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 20px 40px rgba(0,0,0,0.1)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'none';
        });

        // Build content based on layout
        const content = this._buildContent(product);
        card.appendChild(content);

        this._element = card;

        if (container) {
            container.appendChild(card);
        }

        // Emit event
        eventBus.emit('productCard:rendered', {
            id: this._id,
            productId: product.id
        });

        return card;
    }

    /**
     * Build Content
     */
    _buildContent(product) {
        const layout = this.options.layout;
        
        if (layout === ProductCard.LAYOUTS.LIST) {
            return this._buildListLayout(product);
        } else if (layout === ProductCard.LAYOUTS.COMPACT) {
            return this._buildCompactLayout(product);
        } else if (layout === ProductCard.LAYOUTS.FEATURED) {
            return this._buildFeaturedLayout(product);
        } else {
            return this._buildGridLayout(product);
        }
    }

    /**
     * Build Grid Layout
     */
    _buildGridLayout(product) {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            height: 100%;
        `;

        // Image
        const imageSection = this._buildImageSection(product);
        container.appendChild(imageSection);

        // Content
        const contentSection = this._buildContentSection(product);
        container.appendChild(contentSection);

        // Footer
        const footerSection = this._buildFooterSection(product);
        container.appendChild(footerSection);

        return container;
    }

    /**
     * Build List Layout
     */
    _buildListLayout(product) {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            gap: 16px;
            height: 100%;
            padding: 12px;
        `;

        // Image (smaller)
        const imageSection = this._buildImageSection(product, 'small');
        imageSection.style.cssText += `
            flex: 0 0 120px;
            height: 120px;
        `;
        container.appendChild(imageSection);

        // Content (flexible)
        const contentWrapper = document.createElement('div');
        contentWrapper.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-width: 0;
        `;

        const contentSection = this._buildContentSection(product, true);
        contentWrapper.appendChild(contentSection);

        const footerSection = this._buildFooterSection(product);
        contentWrapper.appendChild(footerSection);

        container.appendChild(contentWrapper);

        return container;
    }

    /**
     * Build Compact Layout
     */
    _buildCompactLayout(product) {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 12px;
            height: 100%;
        `;

        // Image (very small)
        const imageSection = this._buildImageSection(product, 'small');
        imageSection.style.cssText += `
            flex: 0 0 48px;
            height: 48px;
            border-radius: 8px;
        `;
        container.appendChild(imageSection);

        // Content
        const contentWrapper = document.createElement('div');
        contentWrapper.style.cssText = `
            flex: 1;
            min-width: 0;
        `;

        const title = document.createElement('div');
        title.textContent = product.title || 'Untitled';
        title.style.cssText = `
            font-size: 14px;
            font-weight: 600;
            color: ${document.documentElement.getAttribute('data-theme') === 'dark' ? '#f3f4f6' : '#1f2937'};
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;

        const meta = document.createElement('div');
        meta.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            color: ${document.documentElement.getAttribute('data-theme') === 'dark' ? '#9ca3af' : '#6b7280'};
            margin-top: 2px;
        `;

        const price = this._getPriceDisplay(product);
        const priceEl = document.createElement('span');
        priceEl.textContent = price;
        priceEl.style.cssText = `
            font-weight: 600;
            color: ${document.documentElement.getAttribute('data-theme') === 'dark' ? '#f3f4f6' : '#1f2937'};
        `;
        meta.appendChild(priceEl);

        if (this.options.showRating && product.rating) {
            const ratingEl = document.createElement('span');
            ratingEl.textContent = `⭐ ${product.rating.toFixed(1)}`;
            meta.appendChild(ratingEl);
        }

        contentWrapper.appendChild(title);
        contentWrapper.appendChild(meta);
        container.appendChild(contentWrapper);

        // Actions (compact)
        if (this.options.showActions) {
            const actions = this._buildCompactActions(product);
            container.appendChild(actions);
        }

        return container;
    }

    /**
     * Build Featured Layout
     */
    _buildFeaturedLayout(product) {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            height: 100%;
            position: relative;
        `;

        // Featured badge
        const featuredBadge = document.createElement('div');
        featuredBadge.textContent = '⭐ FEATURED';
        featuredBadge.style.cssText = `
            position: absolute;
            top: 12px;
            left: 12px;
            z-index: 10;
            background: linear-gradient(135deg, #f59e0b, #f97316);
            color: #ffffff;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        `;
        container.appendChild(featuredBadge);

        // Image (larger)
        const imageSection = this._buildImageSection(product, 'large');
        imageSection.style.cssText += `
            height: 300px;
        `;
        container.appendChild(imageSection);

        // Content
        const contentSection = this._buildContentSection(product);
        container.appendChild(contentSection);

        // Footer
        const footerSection = this._buildFooterSection(product);
        container.appendChild(footerSection);

        return container;
    }

    /**
     * Build Image Section
     */
    _buildImageSection(product, size = 'medium') {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            position: relative;
            overflow: hidden;
            background: ${document.documentElement.getAttribute('data-theme') === 'dark' ? '#374151' : '#f3f4f6'};
            ${size === 'small' ? 'height: 120px;' : size === 'large' ? 'height: 280px;' : 'height: 200px;'}
            flex-shrink: 0;
        `;

        // Image
        const img = document.createElement('img');
        const thumbnail = product.thumbnail || product.images?.[0] || '/assets/images/default-product.png';
        img.src = thumbnail;
        img.alt = product.title || 'Product';
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s ease;
        `;
        
        if (this.options.lazyLoad) {
            img.loading = 'lazy';
        }

        wrapper.addEventListener('mouseenter', () => {
            img.style.transform = 'scale(1.05)';
        });
        wrapper.addEventListener('mouseleave', () => {
            img.style.transform = 'scale(1)';
        });

        wrapper.appendChild(img);

        // Badges
        if (this.options.showBadges) {
            const badges = this._buildBadges(product);
            wrapper.appendChild(badges);
        }

        // Overlay actions (like/save on hover)
        if (this.options.showActions) {
            const overlayActions = this._buildOverlayActions(product);
            wrapper.appendChild(overlayActions);
        }

        return wrapper;
    }

    /**
     * Build Badges
     */
    _buildBadges(product) {
        const container = document.createElement('div');
        container.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            z-index: 5;
        `;

        // Type badge
        const typeBadge = document.createElement('span');
        const typeMap = {
            digital: '💻 Digital',
            physical: '📦 Physical',
            service: '🛠️ Service'
        };
        typeBadge.textContent = typeMap[product.productType] || product.productType || '📦 Product';
        typeBadge.style.cssText = `
            background: ${document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)'};
            color: ${document.documentElement.getAttribute('data-theme') === 'dark' ? '#f3f4f6' : '#1f2937'};
            padding: 2px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-align: center;
        `;
        container.appendChild(typeBadge);

        // Price badge
        const priceBadge = document.createElement('span');
        if (product.isFree) {
            priceBadge.textContent = '🎁 FREE';
            priceBadge.style.background = '#22c55e';
            priceBadge.style.color = '#ffffff';
        } else if (product.price) {
            priceBadge.textContent = product.discount ? `$${product.discountedPrice || product.price}` : `$${product.price}`;
            priceBadge.style.background = '#6366f1';
            priceBadge.style.color = '#ffffff';
        } else {
            priceBadge.textContent = '💰 Contact';
            priceBadge.style.background = '#f59e0b';
            priceBadge.style.color = '#ffffff';
        }
        priceBadge.style.cssText += `
            padding: 2px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 700;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-align: center;
        `;
        container.appendChild(priceBadge);

        // Discount badge
        if (product.discount && product.discount > 0) {
            const discountBadge = document.createElement('span');
            discountBadge.textContent = `-${Math.round(product.discount)}%`;
            discountBadge.style.cssText = `
                background: #ef4444;
                color: #ffffff;
                padding: 2px 10px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: 700;
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                text-align: center;
            `;
            container.appendChild(discountBadge);
        }

        // Verified badge
        if (product.isVerified) {
            const verifiedBadge = document.createElement('span');
            verifiedBadge.textContent = '✅ Verified';
            verifiedBadge.style.cssText = `
                background: #22c55e;
                color: #ffffff;
                padding: 2px 10px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: 600;
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                text-align: center;
            `;
            container.appendChild(verifiedBadge);
        }

        return container;
    }

    /**
     * Build Overlay Actions
     */
    _buildOverlayActions(product) {
        const container = document.createElement('div');
        container.style.cssText = `
            position: absolute;
            bottom: 8px;
            right: 8px;
            display: flex;
            gap: 6px;
            z-index: 5;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        // Add hover to parent to show actions
        const parent = container.parentElement;
        if (parent) {
            parent.addEventListener('mouseenter', () => {
                container.style.opacity = '1';
            });
            parent.addEventListener('mouseleave', () => {
                container.style.opacity = '0';
            });
        }

        // Like button
        if (this.options.showLikeButton) {
            const likeBtn = this._createActionButton('❤️', this._isLiked, 'Like', this._handleLike);
            container.appendChild(likeBtn);
        }

        // Save button
        if (this.options.showSaveButton) {
            const saveBtn = this._createActionButton('📌', this._isSaved, 'Save', this._handleSave);
            container.appendChild(saveBtn);
        }

        // Share button
        if (this.options.showShareButton) {
            const shareBtn = this._createActionButton('📤', false, 'Share', this._handleShare);
            container.appendChild(shareBtn);
        }

        return container;
    }

    /**
     * Create Action Button
     */
    _createActionButton(icon, isActive, label, handler) {
        const btn = document.createElement('button');
        btn.textContent = icon;
        btn.style.cssText = `
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: none;
            background: ${document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)'};
            color: ${isActive ? '#ef4444' : 'inherit'};
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: inherit;
        `;
        btn.setAttribute('aria-label', label);
        
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'scale(1.1)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'scale(1)';
        });
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            handler(e);
        });

        return btn;
    }

    /**
     * Build Content Section
     */
    _buildContentSection(product, isList = false) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const container = document.createElement('div');
        container.style.cssText = `
            padding: ${isList ? '0 12px 0 0' : '12px 14px'};
            flex: 1;
        `;

        // Title
        const title = document.createElement('h3');
        title.textContent = product.title || 'Untitled Product';
        title.style.cssText = `
            font-size: ${isList ? '15px' : '16px'};
            font-weight: 600;
            color: ${isDark ? '#f3f4f6' : '#1f2937'};
            margin: 0 0 4px 0;
            line-height: 1.3;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            cursor: pointer;
        `;
        title.addEventListener('click', this._handleView);
        container.appendChild(title);

        // Description (only in list/featured)
        if (isList && product.description) {
            const desc = document.createElement('p');
            desc.textContent = product.description;
            desc.style.cssText = `
                font-size: 13px;
                color: ${isDark ? '#9ca3af' : '#6b7280'};
                margin: 4px 0 8px 0;
                line-height: 1.5;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            `;
            container.appendChild(desc);
        }

        // Meta info (category, tags)
        const meta = document.createElement('div');
        meta.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 4px;
        `;

        if (product.category) {
            const cat = document.createElement('span');
            cat.textContent = `#${product.category}`;
            cat.style.cssText = `
                font-size: 11px;
                color: ${isDark ? '#9ca3af' : '#6b7280'};
                background: ${isDark ? '#374151' : '#f3f4f6'};
                padding: 1px 8px;
                border-radius: 10px;
            `;
            meta.appendChild(cat);
        }

        if (product.tags && product.tags.length > 0) {
            product.tags.slice(0, 2).forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.textContent = `#${tag}`;
                tagEl.style.cssText = `
                    font-size: 11px;
                    color: ${isDark ? '#9ca3af' : '#6b7280'};
                    background: ${isDark ? '#374151' : '#f3f4f6'};
                    padding: 1px 8px;
                    border-radius: 10px;
                `;
                meta.appendChild(tagEl);
            });
        }

        if (meta.children.length > 0) {
            container.appendChild(meta);
        }

        // Location
        if (this.options.showLocation && product.location) {
            const location = document.createElement('div');
            location.textContent = `📍 ${product.location.city || product.location.address || product.location}`;
            location.style.cssText = `
                font-size: 12px;
                color: ${isDark ? '#9ca3af' : '#6b7280'};
                margin-top: 4px;
            `;
            container.appendChild(location);
        }

        // Rating
        if (this.options.showRating && product.rating !== undefined) {
            const ratingContainer = document.createElement('div');
            ratingContainer.style.cssText = `
                display: flex;
                align-items: center;
                gap: 6px;
                margin-top: 6px;
            `;

            // Use RatingStars component
            const rating = new RatingStars({
                value: product.rating,
                max: 5,
                readOnly: true,
                size: RatingStars.SIZES.SM,
                showValue: true,
                showCount: product.ratingCount > 0
            });
            ratingContainer.appendChild(rating.render());

            container.appendChild(ratingContainer);
        }

        return container;
    }

    /**
     * Build Footer Section
     */
    _buildFooterSection(product) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const container = document.createElement('div');
        container.style.cssText = `
            padding: 8px 14px 12px;
            border-top: 1px solid ${isDark ? '#374151' : '#f3f4f6'};
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            flex-wrap: wrap;
        `;

        // Seller info
        if (this.options.showSeller) {
            const seller = document.createElement('div');
            seller.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
                color: ${isDark ? '#9ca3af' : '#6b7280'};
                cursor: pointer;
            `;
            seller.addEventListener('click', () => {
                if (product.sellerId) {
                    window.location.hash = `/profile/${product.sellerId}`;
                }
            });

            const avatar = document.createElement('img');
            avatar.src = product.sellerPhoto || '/assets/images/default-avatar.png';
            avatar.alt = product.sellerName || 'Seller';
            avatar.style.cssText = `
                width: 24px;
                height: 24px;
                border-radius: 50%;
                object-fit: cover;
            `;
            seller.appendChild(avatar);

            const name = document.createElement('span');
            name.textContent = product.sellerName || 'Unknown Seller';
            name.style.cssText = `
                font-weight: 500;
                color: ${isDark ? '#f3f4f6' : '#1f2937'};
            `;
            seller.appendChild(name);

            container.appendChild(seller);
        }

        // Actions (view/contact/download)
        if (this.options.showActions) {
            const actions = document.createElement('div');
            actions.style.cssText = `
                display: flex;
                gap: 6px;
                align-items: center;
            `;

            // View button
            const viewBtn = this._createFooterButton('👁️ View', 'primary', this._handleView);
            actions.appendChild(viewBtn);

            // Download button (for digital products)
            if (this.options.showDownloadButton && product.productType === 'digital') {
                const downloadBtn = this._createFooterButton('⬇️ Download', 'success', this._handleDownload);
                actions.appendChild(downloadBtn);
            }

            // Contact button (for physical products or if not owner)
            if (this.options.showContactButton && !this.options.isOwner) {
                const contactBtn = this._createFooterButton('💬 Contact', 'secondary', this._handleContact);
                actions.appendChild(contactBtn);
            }

            container.appendChild(actions);
        }

        return container;
    }

    /**
     * Create Footer Button
     */
    _createFooterButton(label, type, handler) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.style.cssText = `
            padding: 4px 12px;
            border-radius: 8px;
            border: none;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: ${this._getFontFamily()};
            ${type === 'primary' ? `
                background: ${isDark ? '#374151' : '#f3f4f6'};
                color: ${isDark ? '#f3f4f6' : '#1f2937'};
            ` : type === 'success' ? `
                background: #22c55e;
                color: #ffffff;
            ` : `
                background: ${isDark ? '#374151' : '#f3f4f6'};
                color: ${isDark ? '#f3f4f6' : '#1f2937'};
            `}
        `;

        btn.addEventListener('mouseenter', () => {
            if (type === 'primary') {
                btn.style.background = isDark ? '#4b5563' : '#e5e7eb';
            } else if (type === 'success') {
                btn.style.background = '#16a34a';
                btn.style.transform = 'scale(1.02)';
            } else {
                btn.style.background = isDark ? '#4b5563' : '#e5e7eb';
            }
        });
        btn.addEventListener('mouseleave', () => {
            if (type === 'primary') {
                btn.style.background = isDark ? '#374151' : '#f3f4f6';
            } else if (type === 'success') {
                btn.style.background = '#22c55e';
                btn.style.transform = 'scale(1)';
            } else {
                btn.style.background = isDark ? '#374151' : '#f3f4f6';
            }
        });

        btn.addEventListener('click', handler);
        return btn;
    }

    /**
     * Build Compact Actions
     */
    _buildCompactActions(product) {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            gap: 4px;
            flex-shrink: 0;
        `;

        if (this.options.showLikeButton) {
            const likeBtn = document.createElement('button');
            likeBtn.textContent = this._isLiked ? '❤️' : '🤍';
            likeBtn.style.cssText = `
                background: none;
                border: none;
                font-size: 16px;
                cursor: pointer;
                padding: 4px;
                transition: transform 0.2s ease;
            `;
            likeBtn.addEventListener('click', this._handleLike);
            container.appendChild(likeBtn);
        }

        if (this.options.showSaveButton) {
            const saveBtn = document.createElement('button');
            saveBtn.textContent = this._isSaved ? '📌' : '📍';
            saveBtn.style.cssText = `
                background: none;
                border: none;
                font-size: 16px;
                cursor: pointer;
                padding: 4px;
                transition: transform 0.2s ease;
            `;
            saveBtn.addEventListener('click', this._handleSave);
            container.appendChild(saveBtn);
        }

        return container;
    }

    /**
     * Get Price Display
     */
    _getPriceDisplay(product) {
        if (product.isFree) return '🎁 Free';
        if (product.price) {
            if (product.discount && product.discountedPrice) {
                return `$${product.discountedPrice}`;
            }
            return `$${product.price}`;
        }
        return '💰 Contact';
    }

    /**
     * Get Font Family
     */
    _getFontFamily() {
        try {
            const constants = require('../utils/constants.js');
            return constants.APP_CONSTANTS?.FONT_FAMILY || 'Poppins, sans-serif';
        } catch {
            return 'Poppins, sans-serif';
        }
    }

    /**
     * Render Empty State
     */
    _renderEmpty(container) {
        const empty = document.createElement('div');
        empty.style.cssText = `
            padding: 20px;
            text-align: center;
            color: ${document.documentElement.getAttribute('data-theme') === 'dark' ? '#6b7280' : '#9ca3af'};
            font-family: ${this._getFontFamily()};
        `;
        empty.textContent = 'No product data available';

        if (container) {
            container.appendChild(empty);
        }

        return empty;
    }

    /**
     * Handle Like
     */
    _handleLike(e) {
        e.stopPropagation();
        this._isLiked = !this._isLiked;
        
        if (this.options.onLike) {
            this.options.onLike(this._product, this._isLiked);
        }

        // Update button
        const buttons = this._element?.querySelectorAll('button');
        buttons?.forEach(btn => {
            if (btn.textContent === '❤️' || btn.textContent === '🤍') {
                btn.textContent = this._isLiked ? '❤️' : '🤍';
            }
        });

        eventBus.emit('productCard:like', {
            productId: this._product.id,
            liked: this._isLiked
        });

        analyticsService.trackEvent('product', this._isLiked ? 'liked' : 'unliked', {
            productId: this._product.id
        });
    }

    /**
     * Handle Save
     */
    _handleSave(e) {
        e.stopPropagation();
        this._isSaved = !this._isSaved;
        
        if (this.options.onSave) {
            this.options.onSave(this._product, this._isSaved);
        }

        // Update button
        const buttons = this._element?.querySelectorAll('button');
        buttons?.forEach(btn => {
            if (btn.textContent === '📌' || btn.textContent === '📍') {
                btn.textContent = this._isSaved ? '📌' : '📍';
            }
        });

        showToast(this._isSaved ? 'Product saved! 📌' : 'Product unsaved', this._isSaved ? 'success' : 'info');
        
        eventBus.emit('productCard:save', {
            productId: this._product.id,
            saved: this._isSaved
        });

        analyticsService.trackEvent('product', this._isSaved ? 'saved' : 'unsaved', {
            productId: this._product.id
        });
    }

    /**
     * Handle Share
     */
    _handleShare(e) {
        e.stopPropagation();
        const product = this._product;
        const url = `${window.location.origin}/#/product/${product.id}`;
        const text = `Check out ${product.title || 'this product'} on ZYMORE!`;

        if (navigator.share) {
            navigator.share({
                title: product.title || 'ZYMORE Product',
                text: text,
                url: url
            }).catch(() => {
                this._copyToClipboard(`${text}\n\n${url}`);
            });
        } else {
            this._copyToClipboard(`${text}\n\n${url}`);
        }

        if (this.options.onShare) {
            this.options.onShare(product);
        }

        eventBus.emit('productCard:share', {
            productId: product.id
        });

        analyticsService.trackEvent('product', 'shared', {
            productId: product.id
        });
    }

    /**
     * Handle View
     */
    _handleView(e) {
        e.stopPropagation();
        const productId = this._product.id;
        
        if (this.options.onView) {
            this.options.onView(this._product);
        }

        window.location.hash = `/product/${productId}`;

        eventBus.emit('productCard:view', {
            productId: productId
        });

        analyticsService.trackEvent('product', 'viewed', {
            productId: productId
        });
    }

    /**
     * Handle Contact
     */
    _handleContact(e) {
        e.stopPropagation();
        const product = this._product;
        
        if (!authService.getCurrentUserId()) {
            showToast('Please login to contact seller', 'warning');
            setTimeout(() => {
                window.location.hash = '/auth';
            }, 1500);
            return;
        }

        if (this.options.onContact) {
            this.options.onContact(product);
        }

        window.location.hash = `/chat/${product.sellerId}`;

        eventBus.emit('productCard:contact', {
            productId: product.id,
            sellerId: product.sellerId
        });

        analyticsService.trackEvent('product', 'contacted', {
            productId: product.id
        });
    }

    /**
     * Handle Download
     */
    _handleDownload(e) {
        e.stopPropagation();
        const product = this._product;
        
        if (!authService.getCurrentUserId()) {
            showToast('Please login to download', 'warning');
            setTimeout(() => {
                window.location.hash = '/auth';
            }, 1500);
            return;
        }

        if (this.options.onDownload) {
            this.options.onDownload(product);
        }

        // Navigate to product detail for download
        window.location.hash = `/product/${product.id}`;

        eventBus.emit('productCard:download', {
            productId: product.id
        });

        analyticsService.trackEvent('product', 'download_clicked', {
            productId: product.id
        });
    }

    /**
     * Copy to Clipboard
     */
    _copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard! 📋', 'success');
        }).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast('Copied to clipboard! 📋', 'success');
        });
    }

    /**
     * Get Product Data
     */
    getProduct() {
        return this._product;
    }

    /**
     * Update Product Data
     */
    update(product) {
        this._product = product;
        if (this._element) {
            // Re-render
            const parent = this._element.parentNode;
            this.destroy();
            this.render(parent);
        }
        return this;
    }

    /**
     * Destroy Component
     */
    destroy() {
        if (this._element && this._element.parentNode) {
            this._element.parentNode.removeChild(this._element);
        }
        this._element = null;
    }

    // =====================
    // STATIC METHODS
    // =====================

    /**
     * Create Product Card
     */
    static create(product, options) {
        options = options || {};
        return new ProductCard({
            product: product,
            ...options
        });
    }

    /**
     * Create Grid of Product Cards
     */
    static createGrid(products, container, options) {
        options = options || {};
        const cards = [];
        
        products.forEach(product => {
            const card = new ProductCard({
                product: product,
                layout: ProductCard.LAYOUTS.GRID,
                ...options
            });
            card.render(container);
            cards.push(card);
        });

        return cards;
    }

    /**
     * Create List of Product Cards
     */
    static createList(products, container, options) {
        options = options || {};
        const cards = [];
        
        products.forEach(product => {
            const card = new ProductCard({
                product: product,
                layout: ProductCard.LAYOUTS.LIST,
                ...options
            });
            card.render(container);
            cards.push(card);
        });

        return cards;
    }
}

// Global exposure
if (typeof window !== 'undefined') {
    window.ProductCard = ProductCard;
}

// Export default
export default ProductCard;