// ============================================================
// FILE: js/screens/product-detail.js
// PURPOSE: Product Detail Page - Complete Product View
// DEPENDENCIES: store.js, product-model.js, download-service.js, rating-stars.js
// ROUTE: /product/:id
// VERSION: 4.0.0 - FULL PRODUCTION
// ============================================================

import { store, getState, setState, subscribe } from '../store.js';
import { eventBus, EVENTS } from '../state/event-bus.js';
import { router, ROUTES } from '../router.js';
import { logger } from '../services/logger.js';
import { analyticsService } from '../services/analytics-service.js';
import { downloadService } from '../services/download-service.js';
import { authService } from '../services/auth-service.js';
import { databaseService } from '../services/database-service.js';
import { RatingStars } from '../widgets/rating-stars.js';
import { ImageSlider } from '../widgets/image-slider.js';
import { LoadingSpinner } from '../widgets/loading-spinner.js';
import { ToastNotification } from '../widgets/toast-notification.js';
import { Modal } from '../widgets/modal.js';

// ============================================================
// PRODUCT DETAIL CLASS
// ============================================================

export class ProductDetail {
    constructor(options = {}) {
        // ==========================================
        // CONFIGURATION
        // ==========================================
        this.config = {
            enableReviews: true,
            enableRelatedProducts: true,
            enableDownload: true,
            enableContact: true,
            enableShare: true,
            enableReport: true,
            enableLike: true,
            enableSave: true,
            maxReviews: 10,
            relatedProductsLimit: 6,
            ...options
        };

        // ==========================================
        // STATE
        // ==========================================
        this._id = this._generateId('product-detail');
        this._isDestroyed = false;
        this._isRendered = false;
        this._container = null;
        this._subscribers = [];
        this._eventListeners = [];
        this._isLoading = false;
        this._product = null;
        this._reviews = [];
        this._relatedProducts = [];
        this._isLiked = false;
        this._isSaved = false;
        this._activeTab = 'details'; // 'details' | 'reviews' | 'seller'

        // ==========================================
        // BIND METHODS
        // ==========================================
        this._handleDownload = this._handleDownload.bind(this);
        this._handleLike = this._handleLike.bind(this);
        this._handleSave = this._handleSave.bind(this);
        this._handleShare = this._handleShare.bind(this);
        this._handleReport = this._handleReport.bind(this);
        this._handleContact = this._handleContact.bind(this);
        this._handleReviewSubmit = this._handleReviewSubmit.bind(this);
        this._handleTabChange = this._handleTabChange.bind(this);
        this._handleProductClick = this._handleProductClick.bind(this);
        this._handleThemeChange = this._handleThemeChange.bind(this);
        this._handleAuthChange = this._handleAuthChange.bind(this);
        this._handleProductUpdate = this._handleProductUpdate.bind(this);

        // ==========================================
        // SETUP
        // ==========================================
        this._setupSubscriptions();
        this._setupEventListeners();
        
        logger.info('📦 ProductDetail initialized', { id: this._id });
    }

    // ============================================================
    // RENDER
    // ============================================================

    render() {
        if (this._isDestroyed) {
            logger.warn('⚠️ ProductDetail destroyed, cannot render');
            return null;
        }

        if (this._isRendered) {
            return this._container;
        }

        logger.info('📦 Rendering ProductDetail...');

        // Get product ID from URL
        const path = window.location.pathname;
        const match = path.match(/\/product\/(.+)/);
        const productId = match ? match[1] : null;

        if (!productId) {
            this._showError('Product not found');
            router.navigate('/explore');
            return null;
        }

        // Load product
        this._loadProduct(productId);

        // Create container
        this._container = this._createContainer();

        // Build sections
        this._buildHeader();
        this._buildProductView();
        this._buildTabs();
        this._buildDetailsTab();
        this._buildReviewsTab();
        this._buildSellerTab();
        this._buildRelatedProducts();
        this._buildFloatingActions();

        // Apply theme
        this._applyTheme();

        // Track view
        analyticsService.trackPageView('product_detail', { productId });

        this._isRendered = true;
        logger.info('✅ ProductDetail rendered');

        return this._container;
    }

    // ============================================================
    // CONTAINER
    // ============================================================

    _createContainer() {
        const container = document.createElement('div');
        container.className = 'product-detail-screen';
        container.id = `product-detail-${this._id}`;
        container.style.cssText = `
            max-width: 1200px;
            margin: 0 auto;
            padding: 16px 20px 100px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            min-height: 100vh;
            transition: all 0.3s ease;
            position: relative;
        `;
        return container;
    }

    // ============================================================
    // LOAD PRODUCT
    // ============================================================

    async _loadProduct(productId) {
        try {
            this._isLoading = true;
            this._showLoader();

            // Get product from store or database
            let product = getState('products.items')?.find(p => p.id === productId);
            
            if (!product) {
                // Load from database
                product = await databaseService.getDocument('products', productId);
            }

            if (!product) {
                throw new Error('Product not found');
            }

            this._product = product;
            
            // Check if liked
            const user = getState('auth.user');
            if (user) {
                const likes = getState('user.likes') || [];
                this._isLiked = likes.includes(productId);
            }

            // Load reviews
            await this._loadReviews(productId);

            // Load related products
            await this._loadRelatedProducts(product.category);

            // Track view
            analyticsService.trackEvent('product_view', { 
                productId, 
                category: product.category,
                sellerId: product.sellerId
            });

            // Update view count
            await databaseService.updateDocument('products', productId, {
                views: (product.views || 0) + 1
            });

            this._renderContent();
            this._isLoading = false;

        } catch (error) {
            logger.error('❌ Failed to load product:', error);
            this._showError(error.message || 'Failed to load product');
            this._isLoading = false;
        }
    }

    async _loadReviews(productId) {
        try {
            const reviews = await databaseService.getCollection('reviews', [
                { field: 'productId', operator: '==', value: productId },
                { field: 'isVisible', operator: '==', value: true }
            ], { 
                orderBy: 'createdAt', 
                orderDirection: 'desc',
                limit: this.config.maxReviews 
            });
            this._reviews = reviews;
        } catch (error) {
            logger.error('❌ Failed to load reviews:', error);
            this._reviews = [];
        }
    }

    async _loadRelatedProducts(category) {
        try {
            const products = await databaseService.getCollection('products', [
                { field: 'category', operator: '==', value: category },
                { field: 'isActive', operator: '==', value: true }
            ], { 
                limit: this.config.relatedProductsLimit + 1 
            });
            // Exclude current product
            this._relatedProducts = products.filter(p => p.id !== this._product?.id).slice(0, this.config.relatedProductsLimit);
        } catch (error) {
            logger.error('❌ Failed to load related products:', error);
            this._relatedProducts = [];
        }
    }

    // ============================================================
    // HEADER
    // ============================================================

    _buildHeader() {
        const header = document.createElement('header');
        header.className = 'product-detail-header';
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0 16px;
            flex-wrap: wrap;
            gap: 12px;
            border-bottom: 1px solid var(--border-color, rgba(0,0,0,0.06));
            margin-bottom: 16px;
        `;

        // Back button
        const backBtn = document.createElement('button');
        backBtn.textContent = '← Back';
        backBtn.style.cssText = `
            background: none;
            border: none;
            color: var(--text-secondary, #6b7280);
            font-size: 14px;
            cursor: pointer;
            padding: 6px 12px;
            border-radius: 8px;
            transition: all 0.3s ease;
        `;
        backBtn.addEventListener('mouseenter', () => {
            backBtn.style.background = 'rgba(0,0,0,0.05)';
        });
        backBtn.addEventListener('mouseleave', () => {
            backBtn.style.background = 'transparent';
        });
        backBtn.addEventListener('click', () => {
            router.navigate(-1);
        });

        // Title
        const title = document.createElement('h1');
        title.textContent = 'Product Details';
        title.style.cssText = `
            margin: 0;
            font-size: 20px;
            font-weight: 600;
            color: var(--text-primary, #1a1a2e);
            flex: 1;
            text-align: center;
        `;

        // Actions
        const actions = document.createElement('div');
        actions.style.cssText = `
            display: flex;
            gap: 8px;
        `;

        header.appendChild(backBtn);
        header.appendChild(title);
        header.appendChild(actions);

        this._container.appendChild(header);
        this._headerEl = header;
    }

    // ============================================================
    // PRODUCT VIEW
    // ============================================================

    _buildProductView() {
        const container = document.createElement('div');
        container.className = 'product-view-container';
        container.id = `product-view-${this._id}`;
        container.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            margin-bottom: 32px;
        `;

        container.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;min-height:400px;color:var(--text-secondary,#6b7280);">
                ${this._isLoading ? 'Loading...' : 'Product not loaded'}
            </div>
        `;

        this._container.appendChild(container);
        this._productViewContainer = container;
    }

    _renderContent() {
        if (!this._product || !this._productViewContainer) return;

        const product = this._product;

        // Left: Images
        const leftCol = document.createElement('div');
        leftCol.className = 'product-images';
        leftCol.style.cssText = `
            position: relative;
        `;

        const images = product.images || [product.thumbnail || 'https://placehold.co/600x400/6366f1/ffffff?text=Product'];
        
        const slider = new ImageSlider({
            images: images,
            altTexts: images.map(() => product.title || 'Product'),
            autoPlay: false,
            showArrows: true,
            showDots: true,
            showThumbnails: images.length > 1,
            zoomOnClick: true,
            transition: 'slide',
            transitionDuration: 400
        });

        const sliderEl = slider.render();
        if (sliderEl) {
            leftCol.appendChild(sliderEl);
            this._slider = slider;
        }

        // Badge overlay
        const badges = document.createElement('div');
        badges.style.cssText = `
            position: absolute;
            top: 12px;
            left: 12px;
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            z-index: 5;
        `;

        const typeLabels = {
            digital: '📱 Digital',
            physical: '📦 Physical',
            service: '🛠️ Service'
        };
        const typeBadge = document.createElement('span');
        typeBadge.textContent = typeLabels[product.productType] || '📱 Digital';
        typeBadge.style.cssText = `
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            background: #6366f1;
            color: #fff;
        `;
        badges.appendChild(typeBadge);

        if (product.isFeatured) {
            const badge = document.createElement('span');
            badge.textContent = '⭐ Featured';
            badge.style.cssText = `
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                background: #f59e0b;
                color: #fff;
            `;
            badges.appendChild(badge);
        }

        if (product.isTrending) {
            const badge = document.createElement('span');
            badge.textContent = '🔥 Trending';
            badge.style.cssText = `
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                background: #ef4444;
                color: #fff;
            `;
            badges.appendChild(badge);
        }

        if (product.isFree) {
            const badge = document.createElement('span');
            badge.textContent = '💰 Free';
            badge.style.cssText = `
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                background: #22c55e;
                color: #fff;
            `;
            badges.appendChild(badge);
        }

        leftCol.appendChild(badges);

        // Right: Info
        const rightCol = document.createElement('div');
        rightCol.className = 'product-info';
        rightCol.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 16px;
        `;

        // Title
        const title = document.createElement('h1');
        title.textContent = product.title || 'Product';
        title.style.cssText = `
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            color: var(--text-primary, #1a1a2e);
        `;

        // Rating
        const ratingContainer = document.createElement('div');
        ratingContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        `;

        const stars = new RatingStars({
            rating: product.rating || 0,
            count: product.ratingCount || 0,
            size: 'medium',
            interactive: false
        });
        const starsEl = stars.render();
        if (starsEl) {
            ratingContainer.appendChild(starsEl);
            this._stars = stars;
        }

        const ratingText = document.createElement('span');
        ratingText.textContent = `(${product.ratingCount || 0} reviews)`;
        ratingText.style.cssText = `
            font-size: 14px;
            color: var(--text-secondary, #6b7280);
        `;
        ratingContainer.appendChild(ratingText);

        // Stats
        const stats = document.createElement('div');
        stats.style.cssText = `
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            padding: 12px 0;
        `;

        const statItems = [
            { icon: '👁️', label: 'Views', value: product.views || 0 },
            { icon: '📥', label: 'Downloads', value: product.downloads || 0 },
            { icon: '❤️', label: 'Likes', value: product.likes || 0 },
            { icon: '🔄', label: 'Shares', value: product.shareCount || 0 }
        ];

        statItems.forEach(item => {
            const div = document.createElement('div');
            div.style.cssText = `
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 14px;
                color: var(--text-secondary, #6b7280);
            `;
            div.innerHTML = `<span style="font-size:16px;">${item.icon}</span> ${item.value} ${item.label}`;
            stats.appendChild(div);
        });

        // Description
        const desc = document.createElement('p');
        desc.textContent = product.description || '';
        desc.style.cssText = `
            margin: 0;
            font-size: 15px;
            line-height: 1.6;
            color: var(--text-primary, #374151);
        `;

        // Tags
        if (product.tags && product.tags.length > 0) {
            const tagsContainer = document.createElement('div');
            tagsContainer.style.cssText = `
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
            `;
            product.tags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.textContent = `#${tag}`;
                tagEl.style.cssText = `
                    padding: 2px 10px;
                    border-radius: 12px;
                    background: var(--bg-secondary, #f3f4f6);
                    font-size: 12px;
                    color: var(--text-secondary, #6b7280);
                `;
                tagsContainer.appendChild(tagEl);
            });
            rightCol.appendChild(tagsContainer);
        }

        // Price
        const priceContainer = document.createElement('div');
        priceContainer.style.cssText = `
            display: flex;
            align-items: baseline;
            gap: 12px;
            padding: 12px 0;
            border-top: 1px solid var(--border-color, #e5e7eb);
            border-bottom: 1px solid var(--border-color, #e5e7eb);
        `;

        if (product.isFree) {
            const price = document.createElement('span');
            price.textContent = 'Free';
            price.style.cssText = `
                font-size: 28px;
                font-weight: 700;
                color: #22c55e;
            `;
            priceContainer.appendChild(price);
        } else if (product.price) {
            const price = document.createElement('span');
            price.textContent = `$${product.price}`;
            price.style.cssText = `
                font-size: 28px;
                font-weight: 700;
                color: var(--text-primary, #1a1a2e);
            `;
            priceContainer.appendChild(price);

            if (product.discount) {
                const original = document.createElement('span');
                original.textContent = `$${product.price + product.discount}`;
                original.style.cssText = `
                    font-size: 18px;
                    text-decoration: line-through;
                    color: var(--text-secondary, #6b7280);
                `;
                priceContainer.appendChild(original);

                const discount = document.createElement('span');
                discount.textContent = `-${Math.round((product.discount / (product.price + product.discount)) * 100)}%`;
                discount.style.cssText = `
                    font-size: 14px;
                    font-weight: 600;
                    color: #ef4444;
                `;
                priceContainer.appendChild(discount);
            }
        }

        // Location (for physical products)
        if (product.productType === 'physical' && product.location) {
            const locationDiv = document.createElement('div');
            locationDiv.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                color: var(--text-secondary, #6b7280);
            `;
            locationDiv.innerHTML = `
                📍 ${product.location.city || ''} ${product.location.state || ''} ${product.location.country || ''}
            `;
            rightCol.appendChild(locationDiv);
        }

        // Actions
        const actions = document.createElement('div');
        actions.className = 'product-actions';
        actions.style.cssText = `
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            padding-top: 8px;
        `;

        // Download button
        if (this.config.enableDownload && product.productType === 'digital') {
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'product-download-btn';
            downloadBtn.textContent = '📥 Download';
            downloadBtn.style.cssText = `
                flex: 1;
                padding: 14px 24px;
                border: none;
                border-radius: 12px;
                background: #6366f1;
                color: #fff;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 140px;
            `;
            downloadBtn.addEventListener('mouseenter', () => {
                downloadBtn.style.background = '#4f46e5';
                downloadBtn.style.transform = 'translateY(-2px)';
                downloadBtn.style.boxShadow = '0 4px 12px rgba(99,102,241,0.3)';
            });
            downloadBtn.addEventListener('mouseleave', () => {
                downloadBtn.style.background = '#6366f1';
                downloadBtn.style.transform = 'translateY(0)';
                downloadBtn.style.boxShadow = 'none';
            });
            downloadBtn.addEventListener('click', this._handleDownload);
            actions.appendChild(downloadBtn);
            this._downloadBtn = downloadBtn;
        }

        // Contact button (for physical/service)
        if (this.config.enableContact && (product.productType === 'physical' || product.productType === 'service')) {
            const contactBtn = document.createElement('button');
            contactBtn.className = 'product-contact-btn';
            contactBtn.textContent = '💬 Contact Seller';
            contactBtn.style.cssText = `
                flex: 1;
                padding: 14px 24px;
                border: none;
                border-radius: 12px;
                background: #22c55e;
                color: #fff;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 140px;
            `;
            contactBtn.addEventListener('mouseenter', () => {
                contactBtn.style.background = '#16a34a';
                contactBtn.style.transform = 'translateY(-2px)';
            });
            contactBtn.addEventListener('mouseleave', () => {
                contactBtn.style.background = '#22c55e';
                contactBtn.style.transform = 'translateY(0)';
            });
            contactBtn.addEventListener('click', this._handleContact);
            actions.appendChild(contactBtn);
        }

        // Like button
        if (this.config.enableLike) {
            const likeBtn = document.createElement('button');
            likeBtn.className = 'product-like-btn';
            likeBtn.textContent = this._isLiked ? '❤️ Liked' : '🤍 Like';
            likeBtn.style.cssText = `
                padding: 14px 20px;
                border-radius: 12px;
                border: 1px solid var(--border-color, #e5e7eb);
                background: var(--bg-primary, #fff);
                color: var(--text-primary, #1a1a2e);
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            likeBtn.addEventListener('mouseenter', () => {
                likeBtn.style.background = 'rgba(99,102,241,0.05)';
                likeBtn.style.borderColor = '#6366f1';
            });
            likeBtn.addEventListener('mouseleave', () => {
                if (!this._isLiked) {
                    likeBtn.style.background = 'var(--bg-primary, #fff)';
                    likeBtn.style.borderColor = 'var(--border-color, #e5e7eb)';
                }
            });
            likeBtn.addEventListener('click', this._handleLike);
            actions.appendChild(likeBtn);
            this._likeBtn = likeBtn;
        }

        // Save button
        if (this.config.enableSave) {
            const saveBtn = document.createElement('button');
            saveBtn.className = 'product-save-btn';
            saveBtn.textContent = this._isSaved ? '📌 Saved' : '📌 Save';
            saveBtn.style.cssText = `
                padding: 14px 20px;
                border-radius: 12px;
                border: 1px solid var(--border-color, #e5e7eb);
                background: var(--bg-primary, #fff);
                color: var(--text-primary, #1a1a2e);
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            saveBtn.addEventListener('mouseenter', () => {
                saveBtn.style.background = 'rgba(99,102,241,0.05)';
                saveBtn.style.borderColor = '#6366f1';
            });
            saveBtn.addEventListener('mouseleave', () => {
                if (!this._isSaved) {
                    saveBtn.style.background = 'var(--bg-primary, #fff)';
                    saveBtn.style.borderColor = 'var(--border-color, #e5e7eb)';
                }
            });
            saveBtn.addEventListener('click', this._handleSave);
            actions.appendChild(saveBtn);
            this._saveBtn = saveBtn;
        }

        // Share button
        if (this.config.enableShare) {
            const shareBtn = document.createElement('button');
            shareBtn.className = 'product-share-btn';
            shareBtn.textContent = '🔄 Share';
            shareBtn.style.cssText = `
                padding: 14px 20px;
                border-radius: 12px;
                border: 1px solid var(--border-color, #e5e7eb);
                background: var(--bg-primary, #fff);
                color: var(--text-primary, #1a1a2e);
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            shareBtn.addEventListener('mouseenter', () => {
                shareBtn.style.background = 'rgba(99,102,241,0.05)';
                shareBtn.style.borderColor = '#6366f1';
            });
            shareBtn.addEventListener('mouseleave', () => {
                shareBtn.style.background = 'var(--bg-primary, #fff)';
                shareBtn.style.borderColor = 'var(--border-color, #e5e7eb)';
            });
            shareBtn.addEventListener('click', this._handleShare);
            actions.appendChild(shareBtn);
        }

        // Report button
        if (this.config.enableReport) {
            const reportBtn = document.createElement('button');
            reportBtn.className = 'product-report-btn';
            reportBtn.textContent = '⚠️ Report';
            reportBtn.style.cssText = `
                padding: 14px 20px;
                border-radius: 12px;
                border: 1px solid var(--border-color, #e5e7eb);
                background: var(--bg-primary, #fff);
                color: var(--text-secondary, #6b7280);
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            reportBtn.addEventListener('mouseenter', () => {
                reportBtn.style.background = 'rgba(239,68,68,0.05)';
                reportBtn.style.borderColor = '#ef4444';
                reportBtn.style.color = '#ef4444';
            });
            reportBtn.addEventListener('mouseleave', () => {
                reportBtn.style.background = 'var(--bg-primary, #fff)';
                reportBtn.style.borderColor = 'var(--border-color, #e5e7eb)';
                reportBtn.style.color = 'var(--text-secondary, #6b7280)';
            });
            reportBtn.addEventListener('click', this._handleReport);
            actions.appendChild(reportBtn);
        }

        // Assemble right column
        rightCol.appendChild(title);
        rightCol.appendChild(ratingContainer);
        rightCol.appendChild(stats);
        rightCol.appendChild(desc);
        rightCol.appendChild(priceContainer);
        rightCol.appendChild(actions);

        // Assemble view
        this._productViewContainer.innerHTML = '';
        this._productViewContainer.appendChild(leftCol);
        this._productViewContainer.appendChild(rightCol);

        // Responsive: single column on mobile
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        const handleResize = (e) => {
            this._productViewContainer.style.gridTemplateColumns = e.matches ? '1fr' : '1fr 1fr';
        };
        mediaQuery.addEventListener('change', handleResize);
        handleResize(mediaQuery);
    }

    // ============================================================
    // TABS
    // ============================================================

    _buildTabs() {
        const tabs = [
            { id: 'details', label: 'Details' },
            { id: 'reviews', label: `Reviews (${this._reviews.length})` },
            { id: 'seller', label: 'Seller' }
        ];

        const container = document.createElement('div');
        container.className = 'product-tabs';
        container.style.cssText = `
            display: flex;
            gap: 4px;
            margin-bottom: 20px;
            padding: 4px;
            background: var(--bg-secondary, rgba(0,0,0,0.05));
            border-radius: 12px;
            overflow-x: auto;
            scrollbar-width: none;
        `;

        tabs.forEach(tab => {
            const btn = document.createElement('button');
            btn.className = 'product-tab';
            btn.dataset.tab = tab.id;
            btn.textContent = tab.label;
            btn.style.cssText = `
                flex: 1;
                padding: 10px 16px;
                border-radius: 8px;
                border: none;
                background: ${this._activeTab === tab.id ? '#6366f1' : 'transparent'};
                color: ${this._activeTab === tab.id ? '#ffffff' : 'var(--text-secondary, #6b7280)'};
                font-size: 14px;
                font-weight: ${this._activeTab === tab.id ? '600' : '500'};
                cursor: pointer;
                transition: all 0.3s ease;
                white-space: nowrap;
                min-width: 80px;
            `;

            if (this._activeTab !== tab.id) {
                btn.addEventListener('mouseenter', () => {
                    btn.style.background = 'rgba(99,102,241,0.1)';
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.background = 'transparent';
                });
            }

            btn.addEventListener('click', () => {
                this._handleTabChange(tab.id);
            });

            container.appendChild(btn);
        });

        this._container.appendChild(container);
        this._tabContainer = container;
        this._tabs = tabs;
    }

    // ============================================================
    // DETAILS TAB
    // ============================================================

    _buildDetailsTab() {
        const container = document.createElement('div');
        container.className = 'product-details-tab';
        container.id = 'product-details-tab';
        container.style.cssText = `
            display: ${this._activeTab === 'details' ? 'block' : 'none'};
            padding: 16px 0;
        `;

        // Additional details
        if (this._product) {
            const details = [
                { label: 'Category', value: this._product.category || 'N/A' },
                { label: 'Sub-Category', value: this._product.subCategory || 'N/A' },
                { label: 'Product Type', value: this._product.productType || 'N/A' },
                { label: 'File Size', value: this._product.fileSize ? `${(this._product.fileSize / (1024 * 1024)).toFixed(2)} MB` : 'N/A' },
                { label: 'File Type', value: this._product.fileType || 'N/A' },
                { label: 'Posted', value: this._product.createdAt ? new Date(this._product.createdAt).toLocaleDateString() : 'N/A' },
                { label: 'Last Updated', value: this._product.updatedAt ? new Date(this._product.updatedAt).toLocaleDateString() : 'N/A' }
            ];

            const grid = document.createElement('div');
            grid.style.cssText = `
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            `;

            details.forEach(detail => {
                const div = document.createElement('div');
                div.style.cssText = `
                    padding: 12px 16px;
                    border-radius: 8px;
                    background: var(--bg-secondary, #f3f4f6);
                `;
                div.innerHTML = `
                    <div style="font-size:12px;color:var(--text-secondary,#6b7280);">${detail.label}</div>
                    <div style="font-size:14px;font-weight:500;color:var(--text-primary,#1a1a2e);margin-top:4px;">${detail.value}</div>
                `;
                grid.appendChild(div);
            });

            container.appendChild(grid);

            // Preview images
            if (this._product.mockups && this._product.mockups.length > 0) {
                const previewTitle = document.createElement('h3');
                previewTitle.textContent = 'Preview Mockups';
                previewTitle.style.cssText = `
                    margin: 20px 0 12px;
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--text-primary, #1a1a2e);
                `;
                container.appendChild(previewTitle);

                const previewGrid = document.createElement('div');
                previewGrid.style.cssText = `
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 12px;
                `;

                this._product.mockups.slice(0, 4).forEach(img => {
                    const imgEl = document.createElement('img');
                    imgEl.src = img;
                    imgEl.alt = 'Mockup';
                    imgEl.style.cssText = `
                        width: 100%;
                        height: 150px;
                        object-fit: cover;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: transform 0.3s ease;
                    `;
                    imgEl.addEventListener('click', () => {
                        this._openImagePreview(img);
                    });
                    previewGrid.appendChild(imgEl);
                });

                container.appendChild(previewGrid);
            }
        }

        this._container.appendChild(container);
        this._detailsTab = container;
    }

    // ============================================================
    // REVIEWS TAB
    // ============================================================

    _buildReviewsTab() {
        const container = document.createElement('div');
        container.className = 'product-reviews-tab';
        container.id = 'product-reviews-tab';
        container.style.cssText = `
            display: ${this._activeTab === 'reviews' ? 'block' : 'none'};
            padding: 16px 0;
        `;

        // Write review
        const user = getState('auth.user');
        if (user && this.config.enableReviews) {
            const reviewForm = this._createReviewForm();
            container.appendChild(reviewForm);
        }

        // Reviews list
        const listContainer = document.createElement('div');
        listContainer.className = 'reviews-list';
        listContainer.style.cssText = `
            margin-top: 16px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        `;

        if (this._reviews.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'reviews-empty';
            empty.style.cssText = `
                text-align: center;
                padding: 40px 20px;
                color: var(--text-secondary, #6b7280);
            `;
            empty.innerHTML = `
                <div style="font-size:48px;margin-bottom:16px;">📝</div>
                <p style="margin:0;">No reviews yet. Be the first to review!</p>
            `;
            listContainer.appendChild(empty);
        } else {
            this._reviews.forEach(review => {
                const reviewEl = this._createReviewItem(review);
                listContainer.appendChild(reviewEl);
            });
        }

        container.appendChild(listContainer);

        this._container.appendChild(container);
        this._reviewsTab = container;
    }

    _createReviewForm() {
        const form = document.createElement('form');
        form.className = 'review-form';
        form.style.cssText = `
            padding: 16px;
            border-radius: 12px;
            background: var(--bg-secondary, #f3f4f6);
            margin-bottom: 16px;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Write a Review';
        title.style.cssText = `
            margin: 0 0 12px;
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary, #1a1a2e);
        `;
        form.appendChild(title);

        // Rating
        const ratingLabel = document.createElement('div');
        ratingLabel.textContent = 'Rating:';
        ratingLabel.style.cssText = `
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary, #1a1a2e);
            margin-bottom: 4px;
        `;
        form.appendChild(ratingLabel);

        const ratingContainer = document.createElement('div');
        ratingContainer.style.cssText = `
            display: flex;
            gap: 4px;
            margin-bottom: 12px;
            font-size: 28px;
        `;

        let selectedRating = 0;

        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('button');
            star.type = 'button';
            star.textContent = '☆';
            star.style.cssText = `
                background: none;
                border: none;
                font-size: 28px;
                cursor: pointer;
                color: var(--text-secondary, #6b7280);
                transition: all 0.3s ease;
                padding: 2px 4px;
            `;
            star.addEventListener('mouseenter', () => {
                star.style.transform = 'scale(1.2)';
                star.style.color = '#f59e0b';
            });
            star.addEventListener('mouseleave', () => {
                star.style.transform = 'scale(1)';
                if (i <= selectedRating) {
                    star.style.color = '#f59e0b';
                } else {
                    star.style.color = 'var(--text-secondary, #6b7280)';
                }
            });
            star.addEventListener('click', () => {
                selectedRating = i;
                ratingContainer.querySelectorAll('button').forEach((s, idx) => {
                    s.textContent = idx < i ? '★' : '☆';
                    s.style.color = idx < i ? '#f59e0b' : 'var(--text-secondary, #6b7280)';
                });
            });
            ratingContainer.appendChild(star);
        }

        form.appendChild(ratingContainer);

        // Comment
        const commentLabel = document.createElement('label');
        commentLabel.textContent = 'Comment:';
        commentLabel.style.cssText = `
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary, #1a1a2e);
            display: block;
            margin-bottom: 4px;
        `;
        form.appendChild(commentLabel);

        const commentInput = document.createElement('textarea');
        commentInput.placeholder = 'Share your experience with this product...';
        commentInput.required = true;
        commentInput.style.cssText = `
            width: 100%;
            padding: 10px 12px;
            border-radius: 8px;
            border: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-primary, #fff);
            color: var(--text-primary, #1f2937);
            font-size: 14px;
            outline: none;
            resize: vertical;
            min-height: 80px;
            box-sizing: border-box;
            font-family: inherit;
        `;
        form.appendChild(commentInput);

        // Submit
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.textContent = 'Submit Review';
        submitBtn.style.cssText = `
            margin-top: 12px;
            padding: 10px 24px;
            border: none;
            border-radius: 8px;
            background: #6366f1;
            color: #fff;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
        `;
        submitBtn.addEventListener('mouseenter', () => {
            submitBtn.style.background = '#4f46e5';
        });
        submitBtn.addEventListener('mouseleave', () => {
            submitBtn.style.background = '#6366f1';
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (selectedRating === 0) {
                ToastNotification.show('Please select a rating', 'warning');
                return;
            }
            this._handleReviewSubmit({
                rating: selectedRating,
                comment: commentInput.value
            });
        });

        form.appendChild(submitBtn);

        return form;
    }

    _createReviewItem(review) {
        const div = document.createElement('div');
        div.className = 'review-item';
        div.style.cssText = `
            padding: 16px;
            border-radius: 12px;
            background: var(--bg-primary, #fff);
            border: 1px solid var(--border-color, #e5e7eb);
        `;

        // User info
        const userInfo = document.createElement('div');
        userInfo.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        `;

        const avatar = document.createElement('img');
        avatar.src = review.userPhoto || 'https://placehold.co/40x40/6366f1/ffffff?text=👤';
        avatar.alt = review.userName || 'User';
        avatar.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
        `;

        const nameContainer = document.createElement('div');
        const name = document.createElement('span');
        name.textContent = review.userName || 'Anonymous';
        name.style.cssText = `
            font-weight: 600;
            font-size: 14px;
            color: var(--text-primary, #1a1a2e);
        `;

        const time = document.createElement('span');
        time.textContent = this._getTimeAgo(review.createdAt);
        time.style.cssText = `
            font-size: 12px;
            color: var(--text-secondary, #6b7280);
            display: block;
        `;

        nameContainer.appendChild(name);
        nameContainer.appendChild(time);

        userInfo.appendChild(avatar);
        userInfo.appendChild(nameContainer);

        // Rating
        const stars = new RatingStars({
            rating: review.rating || 0,
            size: 'small',
            interactive: false
        });
        const starsEl = stars.render();
        if (starsEl) {
            userInfo.appendChild(starsEl);
            starsEl.style.marginLeft = 'auto';
        }

        div.appendChild(userInfo);

        // Comment
        if (review.comment) {
            const comment = document.createElement('p');
            comment.textContent = review.comment;
            comment.style.cssText = `
                margin: 8px 0 0;
                font-size: 14px;
                line-height: 1.5;
                color: var(--text-primary, #374151);
            `;
            div.appendChild(comment);
        }

        return div;
    }

    // ============================================================
    // SELLER TAB
    // ============================================================

    _buildSellerTab() {
        const container = document.createElement('div');
        container.className = 'product-seller-tab';
        container.id = 'product-seller-tab';
        container.style.cssText = `
            display: ${this._activeTab === 'seller' ? 'block' : 'none'};
            padding: 16px 0;
        `;

        if (this._product) {
            const seller = {
                id: this._product.sellerId,
                name: this._product.sellerName || 'Unknown Seller',
                photo: this._product.sellerPhoto || 'https://placehold.co/80x80/6366f1/ffffff?text=👤',
                rating: this._product.sellerRating || 0,
                totalProducts: getState('products.items')?.filter(p => p.sellerId === this._product.sellerId).length || 0
            };

            const card = document.createElement('div');
            card.style.cssText = `
                padding: 20px;
                border-radius: 12px;
                background: var(--bg-secondary, #f3f4f6);
                display: flex;
                align-items: center;
                gap: 20px;
                flex-wrap: wrap;
            `;

            const avatar = document.createElement('img');
            avatar.src = seller.photo;
            avatar.alt = seller.name;
            avatar.style.cssText = `
                width: 80px;
                height: 80px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid #6366f1;
            `;

            const info = document.createElement('div');
            info.style.cssText = `
                flex: 1;
            `;

            const name = document.createElement('h3');
            name.textContent = seller.name;
            name.style.cssText = `
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: var(--text-primary, #1a1a2e);
            `;

            const rating = document.createElement('p');
            rating.textContent = `⭐ ${seller.rating || 0} rating · ${seller.totalProducts} products`;
            rating.style.cssText = `
                margin: 4px 0 0;
                font-size: 14px;
                color: var(--text-secondary, #6b7280);
            `;

            info.appendChild(name);
            info.appendChild(rating);

            const actions = document.createElement('div');
            actions.style.cssText = `
                display: flex;
                gap: 8px;
            `;

            const viewProfileBtn = document.createElement('button');
            viewProfileBtn.textContent = 'View Profile';
            viewProfileBtn.style.cssText = `
                padding: 8px 20px;
                border: none;
                border-radius: 8px;
                background: #6366f1;
                color: #fff;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            viewProfileBtn.addEventListener('mouseenter', () => {
                viewProfileBtn.style.background = '#4f46e5';
            });
            viewProfileBtn.addEventListener('mouseleave', () => {
                viewProfileBtn.style.background = '#6366f1';
            });
            viewProfileBtn.addEventListener('click', () => {
                router.navigate(`/profile/${seller.id}`);
            });

            const contactBtn = document.createElement('button');
            contactBtn.textContent = '💬 Chat';
            contactBtn.style.cssText = `
                padding: 8px 20px;
                border: 1px solid #6366f1;
                border-radius: 8px;
                background: transparent;
                color: #6366f1;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            contactBtn.addEventListener('mouseenter', () => {
                contactBtn.style.background = 'rgba(99,102,241,0.05)';
            });
            contactBtn.addEventListener('mouseleave', () => {
                contactBtn.style.background = 'transparent';
            });
            contactBtn.addEventListener('click', this._handleContact);

            actions.appendChild(viewProfileBtn);
            actions.appendChild(contactBtn);

            card.appendChild(avatar);
            card.appendChild(info);
            card.appendChild(actions);

            container.appendChild(card);

            // Seller's other products
            const otherProducts = getState('products.items')?.filter(p => 
                p.sellerId === this._product.sellerId && p.id !== this._product.id
            ).slice(0, 4) || [];

            if (otherProducts.length > 0) {
                const title = document.createElement('h4');
                title.textContent = 'More from this seller';
                title.style.cssText = `
                    margin: 20px 0 12px;
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--text-primary, #1a1a2e);
                `;
                container.appendChild(title);

                const grid = document.createElement('div');
                grid.style.cssText = `
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 12px;
                `;

                otherProducts.forEach(product => {
                    const card = document.createElement('div');
                    card.style.cssText = `
                        padding: 12px;
                        border-radius: 8px;
                        background: var(--bg-primary, #fff);
                        border: 1px solid var(--border-color, #e5e7eb);
                        cursor: pointer;
                        transition: all 0.3s ease;
                        text-align: center;
                    `;
                    card.addEventListener('mouseenter', () => {
                        card.style.transform = 'translateY(-4px)';
                        card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    });
                    card.addEventListener('mouseleave', () => {
                        card.style.transform = 'translateY(0)';
                        card.style.boxShadow = 'none';
                    });

                    const img = document.createElement('img');
                    img.src = product.thumbnail || 'https://placehold.co/150x100/6366f1/ffffff?text=Product';
                    img.alt = product.title || 'Product';
                    img.style.cssText = `
                        width: 100%;
                        height: 100px;
                        object-fit: cover;
                        border-radius: 4px;
                        margin-bottom: 8px;
                    `;

                    const name = document.createElement('div');
                    name.textContent = product.title || 'Product';
                    name.style.cssText = `
                        font-size: 13px;
                        font-weight: 500;
                        color: var(--text-primary, #1a1a2e);
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    `;

                    card.appendChild(img);
                    card.appendChild(name);

                    card.addEventListener('click', () => {
                        this._handleProductClick(product.id);
                    });

                    grid.appendChild(card);
                });

                container.appendChild(grid);
            }
        }

        this._container.appendChild(container);
        this._sellerTab = container;
    }

    // ============================================================
    // RELATED PRODUCTS
    // ============================================================

    _buildRelatedProducts() {
        if (!this.config.enableRelatedProducts || this._relatedProducts.length === 0) return;

        const section = document.createElement('section');
        section.className = 'related-products';
        section.style.cssText = `
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid var(--border-color, #e5e7eb);
        `;

        const title = document.createElement('h2');
        title.textContent = 'Related Products';
        title.style.cssText = `
            margin: 0 0 16px;
            font-size: 20px;
            font-weight: 600;
            color: var(--text-primary, #1a1a2e);
        `;
        section.appendChild(title);

        const grid = document.createElement('div');
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 16px;
        `;

        this._relatedProducts.forEach(product => {
            const card = document.createElement('div');
            card.style.cssText = `
                padding: 12px;
                border-radius: 10px;
                background: var(--bg-primary, #fff);
                border: 1px solid var(--border-color, #e5e7eb);
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
            `;
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-4px)';
                card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                card.style.borderColor = '#6366f1';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = 'none';
                card.style.borderColor = 'var(--border-color, #e5e7eb)';
            });

            const img = document.createElement('img');
            img.src = product.thumbnail || 'https://placehold.co/180x120/6366f1/ffffff?text=Product';
            img.alt = product.title || 'Product';
            img.style.cssText = `
                width: 100%;
                height: 120px;
                object-fit: cover;
                border-radius: 6px;
                margin-bottom: 8px;
            `;

            const name = document.createElement('div');
            name.textContent = product.title || 'Product';
            name.style.cssText = `
                font-size: 13px;
                font-weight: 500;
                color: var(--text-primary, #1a1a2e);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            `;

            const price = document.createElement('div');
            if (product.isFree) {
                price.textContent = 'Free';
                price.style.cssText = `
                    font-size: 13px;
                    font-weight: 600;
                    color: #22c55e;
                    margin-top: 4px;
                `;
            } else if (product.price) {
                price.textContent = `$${product.price}`;
                price.style.cssText = `
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-primary, #1a1a2e);
                    margin-top: 4px;
                `;
            }

            card.appendChild(img);
            card.appendChild(name);
            card.appendChild(price);

            card.addEventListener('click', () => {
                this._handleProductClick(product.id);
            });

            grid.appendChild(card);
        });

        section.appendChild(grid);
        this._container.appendChild(section);
    }

    // ============================================================
    // FLOATING ACTIONS
    // ============================================================

    _buildFloatingActions() {
        // Quick download button (mobile)
        if (this._product?.productType === 'digital' && this.config.enableDownload) {
            const fab = document.createElement('button');
            fab.className = 'product-fab';
            fab.textContent = '📥';
            fab.setAttribute('aria-label', 'Download');
            fab.style.cssText = `
                position: fixed;
                bottom: 90px;
                right: 20px;
                width: 56px;
                height: 56px;
                border-radius: 50%;
                border: none;
                background: #6366f1;
                color: #fff;
                font-size: 28px;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(99,102,241,0.4);
                transition: all 0.3s ease;
                z-index: 1000;
                display: none;
                align-items: center;
                justify-content: center;
            `;

            fab.addEventListener('mouseenter', () => {
                fab.style.background = '#4f46e5';
                fab.style.transform = 'scale(1.1)';
            });
            fab.addEventListener('mouseleave', () => {
                fab.style.background = '#6366f1';
                fab.style.transform = 'scale(1)';
            });

            if (window.innerWidth <= 768) {
                fab.style.display = 'flex';
            }

            window.addEventListener('resize', () => {
                fab.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
            });

            fab.addEventListener('click', this._handleDownload);

            this._container.appendChild(fab);
            this._fab = fab;
        }
    }

    // ============================================================
    // EVENT HANDLERS
    // ============================================================

    async _handleDownload() {
        if (!this._product) return;

        const user = getState('auth.user');
        if (!user) {
            ToastNotification.show('Please login to download', 'warning');
            router.navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
            return;
        }

        if (this._isLoading) return;

        analyticsService.trackEvent('product_download_attempt', { 
            productId: this._product.id 
        });

        try {
            this._isLoading = true;
            if (this._downloadBtn) {
                this._downloadBtn.textContent = '⏳ Downloading...';
                this._downloadBtn.disabled = true;
            }

            const result = await downloadService.downloadProduct(this._product.id);

            if (result.success) {
                analyticsService.trackEvent('product_download_success', { 
                    productId: this._product.id 
                });
                ToastNotification.show('Download started! 📥', 'success');
                
                // Update download count
                await databaseService.updateDocument('products', this._product.id, {
                    downloads: (this._product.downloads || 0) + 1
                });
                this._product.downloads = (this._product.downloads || 0) + 1;

                // Update stats
                const stats = this._productViewContainer?.querySelector('.product-stats');
                if (stats) {
                    const downloadStat = stats.querySelector('[data-stat="downloads"]');
                    if (downloadStat) {
                        downloadStat.textContent = `📥 ${this._product.downloads}`;
                    }
                }

                eventBus.emit(EVENTS.PRODUCT_DOWNLOADED, { 
                    productId: this._product.id 
                });
            } else {
                analyticsService.trackEvent('product_download_failed', { 
                    productId: this._product.id,
                    error: result.error 
                });
                ToastNotification.show(result.error || 'Download failed. Please try again.', 'error');
            }

        } catch (error) {
            logger.error('❌ Download failed:', error);
            ToastNotification.show(error.message || 'Download failed. Please try again.', 'error');
        } finally {
            this._isLoading = false;
            if (this._downloadBtn) {
                this._downloadBtn.textContent = '📥 Download';
                this._downloadBtn.disabled = false;
            }
        }
    }

    async _handleLike() {
        if (!this._product) return;

        const user = getState('auth.user');
        if (!user) {
            ToastNotification.show('Please login to like', 'warning');
            router.navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
            return;
        }

        try {
            this._isLiked = !this._isLiked;

            if (this._isLiked) {
                await databaseService.addDocument('likes', {
                    userId: user.uid,
                    productId: this._product.id,
                    createdAt: new Date().toISOString()
                });
                this._product.likes = (this._product.likes || 0) + 1;
                analyticsService.trackEvent('product_like', { productId: this._product.id });
            } else {
                // Remove like
                const likes = await databaseService.getCollection('likes', [
                    { field: 'userId', operator: '==', value: user.uid },
                    { field: 'productId', operator: '==', value: this._product.id }
                ]);
                if (likes.length > 0) {
                    await databaseService.deleteDocument('likes', likes[0].id);
                }
                this._product.likes = Math.max(0, (this._product.likes || 0) - 1);
                analyticsService.trackEvent('product_unlike', { productId: this._product.id });
            }

            // Update UI
            if (this._likeBtn) {
                this._likeBtn.textContent = this._isLiked ? '❤️ Liked' : '🤍 Like';
                this._likeBtn.style.color = this._isLiked ? '#ef4444' : 'var(--text-primary, #1a1a2e)';
            }

            // Update stats
            const stats = this._productViewContainer?.querySelector('.product-stats');
            if (stats) {
                const likeStat = stats.querySelector('[data-stat="likes"]');
                if (likeStat) {
                    likeStat.textContent = `❤️ ${this._product.likes}`;
                }
            }

            eventBus.emit(this._isLiked ? EVENTS.PRODUCT_LIKED : EVENTS.PRODUCT_UNLIKED, { 
                productId: this._product.id 
            });

        } catch (error) {
            logger.error('❌ Like failed:', error);
            this._isLiked = !this._isLiked;
            ToastNotification.show('Failed to update like', 'error');
        }
    }

    async _handleSave() {
        if (!this._product) return;

        const user = getState('auth.user');
        if (!user) {
            ToastNotification.show('Please login to save', 'warning');
            router.navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
            return;
        }

        try {
            this._isSaved = !this._isSaved;

            if (this._isSaved) {
                // Save to saved products
                ToastNotification.show('Product saved! 📌', 'success');
                analyticsService.trackEvent('product_save', { productId: this._product.id });
            } else {
                ToastNotification.show('Product unsaved', 'info');
                analyticsService.trackEvent('product_unsave', { productId: this._product.id });
            }

            if (this._saveBtn) {
                this._saveBtn.textContent = this._isSaved ? '📌 Saved' : '📌 Save';
            }

        } catch (error) {
            logger.error('❌ Save failed:', error);
            this._isSaved = !this._isSaved;
            ToastNotification.show('Failed to save product', 'error');
        }
    }

    async _handleShare() {
        if (!this._product) return;

        const url = window.location.href;
        const title = `Check out ${this._product.title} on ZYMORE!`;

        analyticsService.trackEvent('product_share', { productId: this._product.id });

        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: `Check out ${this._product.title} on ZYMORE!`,
                    url: url
                });
                ToastNotification.show('Shared successfully!', 'success');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    ToastNotification.show('Share cancelled', 'info');
                }
            }
        } else {
            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(`${title}\n${url}`);
                ToastNotification.show('Link copied to clipboard! 📋', 'success');
            } catch (error) {
                ToastNotification.show('Failed to copy link', 'error');
            }
        }

        // Update share count
        try {
            await databaseService.updateDocument('products', this._product.id, {
                shareCount: (this._product.shareCount || 0) + 1
            });
            this._product.shareCount = (this._product.shareCount || 0) + 1;
        } catch (error) {
            logger.error('❌ Failed to update share count:', error);
        }
    }

    async _handleReport() {
        if (!this._product) return;

        const user = getState('auth.user');
        if (!user) {
            ToastNotification.show('Please login to report', 'warning');
            router.navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
            return;
        }

        // Show report modal
        const modal = new Modal({
            title: 'Report Product',
            content: `
                <div style="padding: 8px 0;">
                    <p style="margin:0 0 12px;color:var(--text-secondary,#6b7280);">Why are you reporting this product?</p>
                    <select id="report-reason" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--border-color,#e5e7eb);font-size:14px;margin-bottom:12px;background:var(--bg-primary,#fff);color:var(--text-primary,#1f2937);">
                        <option value="inappropriate">Inappropriate Content</option>
                        <option value="copyright">Copyright Infringement</option>
                        <option value="spam">Spam</option>
                        <option value="scam">Scam/Fraud</option>
                        <option value="other">Other</option>
                    </select>
                    <textarea id="report-description" placeholder="Describe the issue..." style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--border-color,#e5e7eb);font-size:14px;min-height:80px;resize:vertical;background:var(--bg-primary,#fff);color:var(--text-primary,#1f2937);font-family:inherit;box-sizing:border-box;"></textarea>
                </div>
            `,
            confirmText: 'Submit Report',
            cancelText: 'Cancel',
            onConfirm: async (modalEl) => {
                const reason = modalEl.querySelector('#report-reason')?.value || 'other';
                const description = modalEl.querySelector('#report-description')?.value || '';

                try {
                    await databaseService.addDocument('reports', {
                        reporterId: user.uid,
                        targetId: this._product.id,
                        targetType: 'product',
                        reason: reason,
                        description: description,
                        status: 'pending',
                        createdAt: new Date().toISOString()
                    });

                    analyticsService.trackEvent('product_report', { 
                        productId: this._product.id,
                        reason: reason 
                    });

                    ToastNotification.show('Report submitted successfully! We\'ll review it.', 'success');

                } catch (error) {
                    logger.error('❌ Report failed:', error);
                    ToastNotification.show('Failed to submit report. Please try again.', 'error');
                }
            }
        });

        modal.render();
    }

    async _handleContact() {
        if (!this._product) return;

        const user = getState('auth.user');
        if (!user) {
            ToastNotification.show('Please login to contact seller', 'warning');
            router.navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
            return;
        }

        analyticsService.trackEvent('product_contact', { 
            productId: this._product.id,
            sellerId: this._product.sellerId 
        });

        // Navigate to chat
        router.navigate(`/chat?userId=${this._product.sellerId}&productId=${this._product.id}`);
    }

    async _handleReviewSubmit(reviewData) {
        const user = getState('auth.user');
        if (!user) {
            ToastNotification.show('Please login to review', 'warning');
            return;
        }

        try {
            const review = {
                productId: this._product.id,
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                userPhoto: user.photoURL || null,
                rating: reviewData.rating,
                comment: reviewData.comment,
                createdAt: new Date().toISOString(),
                isVisible: true
            };

            const result = await databaseService.addDocument('reviews', review);

            analyticsService.trackEvent('review_create', { 
                productId: this._product.id,
                rating: reviewData.rating 
            });

            // Update product rating
            const totalRating = (this._product.rating || 0) * (this._product.ratingCount || 0);
            const newCount = (this._product.ratingCount || 0) + 1;
            const newRating = (totalRating + reviewData.rating) / newCount;

            await databaseService.updateDocument('products', this._product.id, {
                rating: newRating,
                ratingCount: newCount
            });
            this._product.rating = newRating;
            this._product.ratingCount = newCount;

            // Update reviews list
            this._reviews.unshift(result);
            this._renderReviews();

            ToastNotification.show('Review posted successfully! ⭐', 'success');

            // Update tab count
            this._updateTabCount('reviews', this._reviews.length);

        } catch (error) {
            logger.error('❌ Review failed:', error);
            ToastNotification.show('Failed to post review. Please try again.', 'error');
        }
    }

    _handleTabChange(tabId) {
        this._activeTab = tabId;

        // Update tab styles
        const tabs = this._tabContainer?.querySelectorAll('.product-tab');
        tabs?.forEach(tab => {
            const isActive = tab.dataset.tab === tabId;
            tab.style.background = isActive ? '#6366f1' : 'transparent';
            tab.style.color = isActive ? '#ffffff' : 'var(--text-secondary, #6b7280)';
            tab.style.fontWeight = isActive ? '600' : '500';
        });

        // Show/hide tab content
        const detailsTab = this._container?.querySelector('#product-details-tab');
        const reviewsTab = this._container?.querySelector('#product-reviews-tab');
        const sellerTab = this._container?.querySelector('#product-seller-tab');

        if (detailsTab) detailsTab.style.display = tabId === 'details' ? 'block' : 'none';
        if (reviewsTab) reviewsTab.style.display = tabId === 'reviews' ? 'block' : 'none';
        if (sellerTab) sellerTab.style.display = tabId === 'seller' ? 'block' : 'none';
    }

    _handleProductClick(productId) {
        router.navigate(`/product/${productId}`);
    }

    // ============================================================
    // UI HELPERS
    // ============================================================

    _updateTabCount(tabId, count) {
        const tab = this._tabContainer?.querySelector(`[data-tab="${tabId}"]`);
        if (tab) {
            const label = tabId === 'reviews' ? 'Reviews' : tabId;
            tab.textContent = `${label} (${count})`;
        }
    }

    _renderReviews() {
        const container = this._container?.querySelector('#product-reviews-tab');
        if (!container) return;

        // Rebuild reviews
        const listContainer = container.querySelector('.reviews-list');
        if (listContainer) {
            listContainer.innerHTML = '';
            
            if (this._reviews.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'reviews-empty';
                empty.style.cssText = `
                    text-align: center;
                    padding: 40px 20px;
                    color: var(--text-secondary, #6b7280);
                `;
                empty.innerHTML = `
                    <div style="font-size:48px;margin-bottom:16px;">📝</div>
                    <p style="margin:0;">No reviews yet. Be the first to review!</p>
                `;
                listContainer.appendChild(empty);
            } else {
                this._reviews.forEach(review => {
                    const reviewEl = this._createReviewItem(review);
                    listContainer.appendChild(reviewEl);
                });
            }
        }
    }

    _showLoader() {
        if (this._productViewContainer) {
            this._productViewContainer.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;min-height:400px;flex-direction:column;gap:16px;grid-column:1/-1;">
                    <div style="width:48px;height:48px;border:3px solid var(--border-color,#e5e7eb);border-top-color:#6366f1;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
                    <div style="color:var(--text-secondary,#6b7280);font-size:14px;">Loading product...</div>
                </div>
                <style>
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                </style>
            `;
        }
    }

    _showError(message) {
        if (this._productViewContainer) {
            this._productViewContainer.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;min-height:400px;flex-direction:column;gap:16px;grid-column:1/-1;text-align:center;padding:20px;">
                    <div style="font-size:48px;">😕</div>
                    <h3 style="margin:0;color:var(--text-primary,#1a1a2e);">${message}</h3>
                    <button onclick="window.history.back()" style="padding:10px 24px;border:none;border-radius:8px;background:#6366f1;color:#fff;font-size:14px;font-weight:500;cursor:pointer;">
                        Go Back
                    </button>
                </div>
            `;
        }
    }

    _openImagePreview(imageUrl) {
        const modal = new Modal({
            title: 'Image Preview',
            content: `
                <div style="text-align:center;padding:8px;">
                    <img src="${imageUrl}" alt="Preview" style="max-width:100%;max-height:70vh;border-radius:8px;">
                </div>
            `,
            showConfirm: false,
            cancelText: 'Close'
        });
        modal.render();
    }

    // ============================================================
    // THEME
    // ============================================================

    _applyTheme() {
        if (!this._container) return;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        this._container.style.color = isDark ? '#f3f4f6' : '#1a1a2e';
        this._container.style.background = isDark ? '#0f0f1a' : '#ffffff';
    }

    // ============================================================
    // SUBSCRIPTIONS
    // ============================================================

    _setupSubscriptions() {
        this._subscribers.push(
            subscribe((state) => {
                this._handleThemeChange();
            }, ['ui.theme'])
        );

        this._subscribers.push(
            subscribe((state) => {
                this._handleAuthChange();
            }, ['auth.isAuthenticated'])
        );

        this._subscribers.push(
            subscribe((state) => {
                this._handleProductUpdate();
            }, ['products.items'])
        );
    }

    // ============================================================
    // EVENT LISTENERS
    // ============================================================

    _setupEventListeners() {
        this._eventListeners.push(
            eventBus.on(EVENTS.THEME_CHANGED, this._handleThemeChange)
        );
        this._eventListeners.push(
            eventBus.on(EVENTS.AUTH_LOGIN, this._handleAuthChange)
        );
        this._eventListeners.push(
            eventBus.on(EVENTS.AUTH_LOGOUT, this._handleAuthChange)
        );
        this._eventListeners.push(
            eventBus.on(EVENTS.PRODUCTS_UPDATED, this._handleProductUpdate)
        );
    }

    // ============================================================
    // STATE HANDLERS
    // ============================================================

    _handleThemeChange() {
        this._applyTheme();
    }

    _handleAuthChange() {
        // Update UI for authenticated state
        if (this._product) {
            const user = getState('auth.user');
            if (user) {
                const likes = getState('user.likes') || [];
                this._isLiked = likes.includes(this._product.id);
                if (this._likeBtn) {
                    this._likeBtn.textContent = this._isLiked ? '❤️ Liked' : '🤍 Like';
                }
            }
        }
    }

    _handleProductUpdate() {
        // Refresh product data if needed
        if (this._product) {
            const updated = getState('products.items')?.find(p => p.id === this._product.id);
            if (updated) {
                this._product = updated;
            }
        }
    }

    // ============================================================
    // UTILITY METHODS
    // ============================================================

    _generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    _getTimeAgo(date) {
        if (!date) return 'Just now';
        const now = new Date();
        const past = new Date(date);
        const diff = now - past;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return `${Math.floor(days / 7)}w ago`;
    }

    // ============================================================
    // PUBLIC METHODS
    // ============================================================

    refresh() {
        if (this._product) {
            this._loadProduct(this._product.id);
        }
        return this;
    }

    destroy() {
        if (this._isDestroyed) return;

        this._isDestroyed = true;

        // Unsubscribe
        this._subscribers.forEach(unsub => {
            if (typeof unsub === 'function') unsub();
        });
        this._subscribers = [];

        // Remove event listeners
        this._eventListeners.forEach(unsub => {
            if (typeof unsub === 'function') unsub();
        });
        this._eventListeners = [];

        // Destroy slider
        if (this._slider && typeof this._slider.destroy === 'function') {
            this._slider.destroy();
        }

        // Remove from DOM
        if (this._container && this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }

        this._container = null;
        this._product = null;

        logger.info('📦 ProductDetail destroyed', { id: this._id });
    }
}

// ============================================================
// EXPORT
// ============================================================

export default ProductDetail;

// ============================================================
// GLOBAL EXPOSURE
// ============================================================

if (typeof window !== 'undefined') {
    window.ProductDetail = ProductDetail;
}

// ============================================================
// END OF FILE: product-detail.js
// ============================================================