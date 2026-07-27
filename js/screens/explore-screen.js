// ============================================================
// FILE: js/screens/explore-screen.js
// PURPOSE: Explore Products with Advanced Filters & Search
// DEPENDENCIES: store.js, product-card.js, category-card.js, infinite-scroll.js
// ROUTE: /explore
// VERSION: 4.0.0 - FULL PRODUCTION
// ============================================================

import { store, getState, setState, subscribe } from '../store.js';
import { eventBus, EVENTS } from '../state/event-bus.js';
import { router, ROUTES } from '../router.js';
import { logger } from '../services/logger.js';
import { analyticsService } from '../services/analytics-service.js';
import { ProductCard } from '../widgets/product-card.js';
import { CategoryCard } from '../widgets/category-card.js';
import { LoadingSpinner } from '../widgets/loading-spinner.js';
import { ToastNotification } from '../widgets/toast-notification.js';
import { Modal } from '../widgets/modal.js';

// ============================================================
// EXPLORE SCREEN CLASS
// ============================================================

export class ExploreScreen {
    constructor(options = {}) {
        // ==========================================
        // CONFIGURATION
        // ==========================================
        this.config = {
            productsPerPage: 24,
            showCategories: true,
            showFilters: true,
            showSort: true,
            showSearch: true,
            showLocationFilter: true,
            showPriceRange: true,
            showRatingFilter: true,
            showTypeFilter: true,
            enableInfiniteScroll: true,
            enableViewToggle: true,
            ...options
        };

        // ==========================================
        // STATE
        // ==========================================
        this._id = this._generateId('explore');
        this._isDestroyed = false;
        this._isRendered = false;
        this._container = null;
        this._subscribers = [];
        this._eventListeners = [];
        this._isLoading = false;
        this._hasMore = true;
        this._page = 1;
        this._viewMode = 'grid'; // 'grid' | 'list'

        // Filters state
        this._filters = {
            category: null,
            subCategory: null,
            productType: 'all',
            minPrice: 0,
            maxPrice: 10000,
            rating: 0,
            location: null,
            radius: 50,
            tags: [],
            isFeatured: null,
            isTrending: null,
            isFree: null,
            isPaid: null,
            sortBy: 'recent',
            searchQuery: ''
        };

        // ==========================================
        // BIND METHODS
        // ==========================================
        this._handleProductClick = this._handleProductClick.bind(this);
        this._handleCategoryClick = this._handleCategoryClick.bind(this);
        this._handleSearch = this._handleSearch.bind(this);
        this._handleFilterChange = this._handleFilterChange.bind(this);
        this._handleSortChange = this._handleSortChange.bind(this);
        this._handleViewToggle = this._handleViewToggle.bind(this);
        this._handleApplyFilters = this._handleApplyFilters.bind(this);
        this._handleClearFilters = this._handleClearFilters.bind(this);
        this._handleLoadMore = this._handleLoadMore.bind(this);
        this._handleThemeChange = this._handleThemeChange.bind(this);
        this._handleAuthChange = this._handleAuthChange.bind(this);
        this._handleProductsUpdate = this._handleProductsUpdate.bind(this);
        this._handleCategoriesUpdate = this._handleCategoriesUpdate.bind(this);
        this._handleFilterSubmit = this._handleFilterSubmit.bind(this);
        this._handleLocationChange = this._handleLocationChange.bind(this);
        this._handlePriceChange = this._handlePriceChange.bind(this);
        this._handleRatingChange = this._handleRatingChange.bind(this);
        this._handleTypeChange = this._handleTypeChange.bind(this);

        // ==========================================
        // SETUP
        // ==========================================
        this._setupSubscriptions();
        this._setupEventListeners();
        
        logger.info('🔍 ExploreScreen initialized', { id: this._id });
    }

    // ============================================================
    // RENDER
    // ============================================================

    render() {
        if (this._isDestroyed) {
            logger.warn('⚠️ ExploreScreen destroyed, cannot render');
            return null;
        }

        if (this._isRendered) {
            return this._container;
        }

        logger.info('🔍 Rendering ExploreScreen...');

        // Parse URL parameters
        this._parseUrlParams();

        // Create container
        this._container = this._createContainer();

        // Build sections
        this._buildHeader();
        this._buildSearchBar();
        this._buildFilterSidebar();
        this._buildCategoriesSection();
        this._buildToolbar();
        this._buildProductGrid();
        this._buildFilterToggle();

        // Apply theme
        this._applyTheme();

        // Track view
        analyticsService.trackPageView('explore');

        this._isRendered = true;
        logger.info('✅ ExploreScreen rendered');

        return this._container;
    }

    // ============================================================
    // CONTAINER
    // ============================================================

    _createContainer() {
        const container = document.createElement('div');
        container.className = 'explore-screen';
        container.id = `explore-screen-${this._id}`;
        container.style.cssText = `
            max-width: 1400px;
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
    // HEADER
    // ============================================================

    _buildHeader() {
        const header = document.createElement('header');
        header.className = 'explore-header';
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

        // Left: Title
        const titleContainer = document.createElement('div');
        const title = document.createElement('h1');
        title.textContent = '🔍 Explore';
        title.style.cssText = `
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            color: var(--text-primary, #1a1a2e);
        `;

        const subtitle = document.createElement('p');
        subtitle.textContent = 'Discover amazing products from creators worldwide';
        subtitle.style.cssText = `
            margin: 2px 0 0;
            font-size: 14px;
            color: var(--text-secondary, #6b7280);
        `;

        titleContainer.appendChild(title);
        titleContainer.appendChild(subtitle);
        header.appendChild(titleContainer);

        // Right: Actions
        const actions = this._createHeaderActions();
        header.appendChild(actions);

        this._container.appendChild(header);
        this._headerEl = header;
    }

    _createHeaderActions() {
        const div = document.createElement('div');
        div.className = 'explore-actions';
        div.style.cssText = `
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
        `;

        // View toggle
        if (this.config.enableViewToggle) {
            const viewBtn = document.createElement('button');
            viewBtn.className = 'explore-view-btn';
            viewBtn.textContent = this._viewMode === 'grid' ? '☷' : '☰';
            viewBtn.setAttribute('aria-label', 'Toggle view');
            viewBtn.style.cssText = `
                width: 40px;
                height: 40px;
                border-radius: 8px;
                border: 1px solid var(--border-color, #e5e7eb);
                background: var(--bg-secondary, #fff);
                font-size: 20px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            viewBtn.addEventListener('click', this._handleViewToggle);
            div.appendChild(viewBtn);
        }

        // Filter toggle (mobile)
        const filterBtn = document.createElement('button');
        filterBtn.className = 'explore-filter-toggle';
        filterBtn.textContent = '🔍';
        filterBtn.setAttribute('aria-label', 'Toggle filters');
        filterBtn.style.cssText = `
            display: none;
            width: 40px;
            height: 40px;
            border-radius: 8px;
            border: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-secondary, #fff);
            font-size: 18px;
            cursor: pointer;
            transition: all 0.3s ease;
            align-items: center;
            justify-content: center;
        `;
        filterBtn.addEventListener('click', () => {
            const sidebar = this._container?.querySelector('.explore-filters');
            if (sidebar) {
                sidebar.classList.toggle('open');
                sidebar.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
            }
        });

        // Show on mobile
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        mediaQuery.addEventListener('change', (e) => {
            filterBtn.style.display = e.matches ? 'flex' : 'none';
        });
        if (mediaQuery.matches) {
            filterBtn.style.display = 'flex';
        }

        div.appendChild(filterBtn);
        this._filterToggle = filterBtn;

        return div;
    }

    // ============================================================
    // SEARCH BAR
    // ============================================================

    _buildSearchBar() {
        if (!this.config.showSearch) return;

        const container = document.createElement('div');
        container.className = 'explore-search';
        container.style.cssText = `
            margin-bottom: 20px;
            position: relative;
        `;

        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            display: flex;
            gap: 8px;
            align-items: center;
        `;

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Search products, categories, tags...';
        input.className = 'explore-search-input';
        input.setAttribute('aria-label', 'Search');
        input.value = this._filters.searchQuery;
        input.style.cssText = `
            flex: 1;
            padding: 12px 16px 12px 44px;
            border-radius: 12px;
            border: 1px solid var(--border-color, #e5e7eb);
            font-size: 14px;
            background: var(--bg-secondary, #fff);
            color: var(--text-primary, #1f2937);
            transition: all 0.3s ease;
            outline: none;
            box-sizing: border-box;
        `;

        input.addEventListener('focus', () => {
            input.style.borderColor = '#6366f1';
            input.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
        });
        input.addEventListener('blur', () => {
            input.style.borderColor = 'var(--border-color, #e5e7eb)';
            input.style.boxShadow = 'none';
        });
        input.addEventListener('input', (e) => {
            this._filters.searchQuery = e.target.value;
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this._handleSearch(this._filters.searchQuery);
            }
        });

        const icon = document.createElement('span');
        icon.textContent = '🔍';
        icon.style.cssText = `
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 18px;
            opacity: 0.5;
        `;

        const searchBtn = document.createElement('button');
        searchBtn.textContent = 'Search';
        searchBtn.type = 'button';
        searchBtn.style.cssText = `
            padding: 10px 20px;
            border-radius: 12px;
            border: none;
            background: #6366f1;
            color: #fff;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            white-space: nowrap;
        `;
        searchBtn.addEventListener('mouseenter', () => {
            searchBtn.style.background = '#4f46e5';
            searchBtn.style.transform = 'translateY(-2px)';
        });
        searchBtn.addEventListener('mouseleave', () => {
            searchBtn.style.background = '#6366f1';
            searchBtn.style.transform = 'translateY(0)';
        });
        searchBtn.addEventListener('click', () => {
            this._handleSearch(this._filters.searchQuery);
        });

        wrapper.appendChild(input);
        wrapper.appendChild(searchBtn);
        container.appendChild(icon);
        container.appendChild(wrapper);

        this._container.appendChild(container);
        this._searchInput = input;
        this._searchBtn = searchBtn;
    }

    // ============================================================
    // FILTER SIDEBAR
    // ============================================================

    _buildFilterSidebar() {
        if (!this.config.showFilters) return;

        const sidebar = document.createElement('aside');
        sidebar.className = 'explore-filters';
        sidebar.style.cssText = `
            position: fixed;
            top: 0;
            right: -400px;
            width: 380px;
            height: 100vh;
            background: var(--bg-primary, #fff);
            box-shadow: -4px 0 24px rgba(0,0,0,0.1);
            padding: 24px;
            overflow-y: auto;
            z-index: 1000;
            transition: right 0.3s ease;
            display: none;
        `;

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
            position: absolute;
            top: 16px;
            right: 16px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: var(--text-secondary, #6b7280);
            padding: 4px 8px;
        `;
        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebar.style.right = '-400px';
            sidebar.style.display = 'none';
        });
        sidebar.appendChild(closeBtn);

        // Title
        const title = document.createElement('h2');
        title.textContent = 'Filters';
        title.style.cssText = `
            margin: 0 0 20px;
            font-size: 20px;
            font-weight: 600;
            color: var(--text-primary, #1a1a2e);
        `;
        sidebar.appendChild(title);

        // --- Category Filter ---
        if (this.config.showCategories) {
            const categoryGroup = this._createFilterGroup('Category', 'category');
            const categories = getState('categories.items') || [];
            const categorySelect = document.createElement('select');
            categorySelect.className = 'filter-select';
            categorySelect.style.cssText = `
                width: 100%;
                padding: 10px 12px;
                border-radius: 8px;
                border: 1px solid var(--border-color, #e5e7eb);
                background: var(--bg-secondary, #fff);
                color: var(--text-primary, #1f2937);
                font-size: 14px;
                outline: none;
                cursor: pointer;
            `;

            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'All Categories';
            categorySelect.appendChild(defaultOption);

            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name || 'Category';
                if (cat.id === this._filters.category) {
                    option.selected = true;
                }
                categorySelect.appendChild(option);
            });

            categorySelect.addEventListener('change', (e) => {
                this._filters.category = e.target.value || null;
                this._handleFilterChange('category', this._filters.category);
            });

            categoryGroup.appendChild(categorySelect);
            sidebar.appendChild(categoryGroup);
        }

        // --- Product Type Filter ---
        if (this.config.showTypeFilter) {
            const typeGroup = this._createFilterGroup('Product Type', 'type');
            const typeOptions = [
                { value: 'all', label: 'All Types' },
                { value: 'digital', label: '📱 Digital' },
                { value: 'physical', label: '📦 Physical' },
                { value: 'service', label: '🛠️ Service' }
            ];

            const typeContainer = document.createElement('div');
            typeContainer.style.cssText = `
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            `;

            typeOptions.forEach(opt => {
                const btn = document.createElement('button');
                btn.textContent = opt.label;
                btn.type = 'button';
                btn.style.cssText = `
                    padding: 6px 14px;
                    border-radius: 20px;
                    border: 1px solid var(--border-color, #e5e7eb);
                    background: ${this._filters.productType === opt.value ? '#6366f1' : 'transparent'};
                    color: ${this._filters.productType === opt.value ? '#fff' : 'var(--text-secondary, #6b7280)'};
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                `;
                btn.addEventListener('click', () => {
                    this._filters.productType = opt.value;
                    this._handleTypeChange(opt.value);
                    // Update button styles
                    typeContainer.querySelectorAll('button').forEach(b => {
                        const isActive = b.textContent === opt.label;
                        b.style.background = isActive ? '#6366f1' : 'transparent';
                        b.style.color = isActive ? '#fff' : 'var(--text-secondary, #6b7280)';
                    });
                });
                typeContainer.appendChild(btn);
            });

            typeGroup.appendChild(typeContainer);
            sidebar.appendChild(typeGroup);
        }

        // --- Price Range ---
        if (this.config.showPriceRange) {
            const priceGroup = this._createFilterGroup('Price Range', 'price');
            const priceContainer = document.createElement('div');
            priceContainer.style.cssText = `
                display: flex;
                gap: 12px;
                align-items: center;
            `;

            const minInput = document.createElement('input');
            minInput.type = 'number';
            minInput.placeholder = 'Min';
            minInput.value = this._filters.minPrice || '';
            minInput.style.cssText = `
                flex: 1;
                padding: 8px 12px;
                border-radius: 8px;
                border: 1px solid var(--border-color, #e5e7eb);
                background: var(--bg-secondary, #fff);
                color: var(--text-primary, #1f2937);
                font-size: 14px;
                outline: none;
                width: 80px;
            `;
            minInput.addEventListener('input', (e) => {
                this._filters.minPrice = parseFloat(e.target.value) || 0;
            });

            const maxInput = document.createElement('input');
            maxInput.type = 'number';
            maxInput.placeholder = 'Max';
            maxInput.value = this._filters.maxPrice || '';
            maxInput.style.cssText = `
                flex: 1;
                padding: 8px 12px;
                border-radius: 8px;
                border: 1px solid var(--border-color, #e5e7eb);
                background: var(--bg-secondary, #fff);
                color: var(--text-primary, #1f2937);
                font-size: 14px;
                outline: none;
                width: 80px;
            `;
            maxInput.addEventListener('input', (e) => {
                this._filters.maxPrice = parseFloat(e.target.value) || 10000;
            });

            const applyBtn = document.createElement('button');
            applyBtn.textContent = 'Apply';
            applyBtn.type = 'button';
            applyBtn.style.cssText = `
                padding: 8px 16px;
                border-radius: 8px;
                border: none;
                background: #6366f1;
                color: #fff;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            applyBtn.addEventListener('click', () => {
                this._handlePriceChange(
                    parseFloat(minInput.value) || 0,
                    parseFloat(maxInput.value) || 10000
                );
            });

            priceContainer.appendChild(minInput);
            priceContainer.appendChild(maxInput);
            priceContainer.appendChild(applyBtn);

            priceGroup.appendChild(priceContainer);
            sidebar.appendChild(priceGroup);
        }

        // --- Rating Filter ---
        if (this.config.showRatingFilter) {
            const ratingGroup = this._createFilterGroup('Minimum Rating', 'rating');
            const ratingContainer = document.createElement('div');
            ratingContainer.style.cssText = `
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            `;

            const ratings = [
                { value: 0, label: 'Any' },
                { value: 1, label: '⭐' },
                { value: 2, label: '⭐⭐' },
                { value: 3, label: '⭐⭐⭐' },
                { value: 4, label: '⭐⭐⭐⭐' },
                { value: 5, label: '⭐⭐⭐⭐⭐' }
            ];

            ratings.forEach(r => {
                const btn = document.createElement('button');
                btn.textContent = r.label;
                btn.type = 'button';
                btn.style.cssText = `
                    padding: 4px 12px;
                    border-radius: 16px;
                    border: 1px solid var(--border-color, #e5e7eb);
                    background: ${this._filters.rating === r.value ? '#f59e0b' : 'transparent'};
                    color: ${this._filters.rating === r.value ? '#fff' : 'var(--text-secondary, #6b7280)'};
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                `;
                btn.addEventListener('click', () => {
                    this._filters.rating = r.value;
                    this._handleRatingChange(r.value);
                    ratingContainer.querySelectorAll('button').forEach(b => {
                        const isActive = b.textContent === r.label;
                        b.style.background = isActive ? '#f59e0b' : 'transparent';
                        b.style.color = isActive ? '#fff' : 'var(--text-secondary, #6b7280)';
                    });
                });
                ratingContainer.appendChild(btn);
            });

            ratingGroup.appendChild(ratingContainer);
            sidebar.appendChild(ratingGroup);
        }

        // --- Location Filter ---
        if (this.config.showLocationFilter) {
            const locationGroup = this._createFilterGroup('Location', 'location');
            const locationInput = document.createElement('input');
            locationInput.type = 'text';
            locationInput.placeholder = 'Enter location...';
            locationInput.value = this._filters.location || '';
            locationInput.style.cssText = `
                width: 100%;
                padding: 10px 12px;
                border-radius: 8px;
                border: 1px solid var(--border-color, #e5e7eb);
                background: var(--bg-secondary, #fff);
                color: var(--text-primary, #1f2937);
                font-size: 14px;
                outline: none;
                box-sizing: border-box;
            `;
            locationInput.addEventListener('input', (e) => {
                this._filters.location = e.target.value || null;
            });
            locationInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this._handleLocationChange(this._filters.location);
                }
            });

            const radiusContainer = document.createElement('div');
            radiusContainer.style.cssText = `
                display: flex;
                align-items: center;
                gap: 12px;
                margin-top: 8px;
            `;

            const radiusLabel = document.createElement('span');
            radiusLabel.textContent = `Radius: ${this._filters.radius}km`;
            radiusLabel.style.cssText = `
                font-size: 13px;
                color: var(--text-secondary, #6b7280);
            `;

            const radiusInput = document.createElement('input');
            radiusInput.type = 'range';
            radiusInput.min = '5';
            radiusInput.max = '200';
            radiusInput.value = this._filters.radius;
            radiusInput.style.cssText = `
                flex: 1;
                accent-color: #6366f1;
            `;
            radiusInput.addEventListener('input', (e) => {
                this._filters.radius = parseInt(e.target.value);
                radiusLabel.textContent = `Radius: ${this._filters.radius}km`;
            });

            radiusContainer.appendChild(radiusLabel);
            radiusContainer.appendChild(radiusInput);

            const applyLocationBtn = document.createElement('button');
            applyLocationBtn.textContent = 'Apply Location';
            applyLocationBtn.type = 'button';
            applyLocationBtn.style.cssText = `
                margin-top: 8px;
                padding: 8px 16px;
                border-radius: 8px;
                border: none;
                background: #6366f1;
                color: #fff;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                width: 100%;
            `;
            applyLocationBtn.addEventListener('click', () => {
                this._handleLocationChange(this._filters.location);
            });

            locationGroup.appendChild(locationInput);
            locationGroup.appendChild(radiusContainer);
            locationGroup.appendChild(applyLocationBtn);
            sidebar.appendChild(locationGroup);
        }

        // --- Additional Filters ---
        const additionalGroup = this._createFilterGroup('Additional Filters', 'additional');

        // Featured
        const featuredCheck = document.createElement('label');
        featuredCheck.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: var(--text-secondary, #6b7280);
            cursor: pointer;
            margin-bottom: 6px;
        `;
        const featuredInput = document.createElement('input');
        featuredInput.type = 'checkbox';
        featuredInput.checked = this._filters.isFeatured || false;
        featuredInput.style.cssText = `
            accent-color: #6366f1;
            width: 16px;
            height: 16px;
            cursor: pointer;
        `;
        featuredInput.addEventListener('change', (e) => {
            this._filters.isFeatured = e.target.checked ? true : null;
        });
        featuredCheck.appendChild(featuredInput);
        featuredCheck.appendChild(document.createTextNode('⭐ Featured Only'));
        additionalGroup.appendChild(featuredCheck);

        // Trending
        const trendingCheck = document.createElement('label');
        trendingCheck.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: var(--text-secondary, #6b7280);
            cursor: pointer;
            margin-bottom: 6px;
        `;
        const trendingInput = document.createElement('input');
        trendingInput.type = 'checkbox';
        trendingInput.checked = this._filters.isTrending || false;
        trendingInput.style.cssText = `
            accent-color: #6366f1;
            width: 16px;
            height: 16px;
            cursor: pointer;
        `;
        trendingInput.addEventListener('change', (e) => {
            this._filters.isTrending = e.target.checked ? true : null;
        });
        trendingCheck.appendChild(trendingInput);
        trendingCheck.appendChild(document.createTextNode('🔥 Trending Now'));
        additionalGroup.appendChild(trendingCheck);

        // Free
        const freeCheck = document.createElement('label');
        freeCheck.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: var(--text-secondary, #6b7280);
            cursor: pointer;
        `;
        const freeInput = document.createElement('input');
        freeInput.type = 'checkbox';
        freeInput.checked = this._filters.isFree || false;
        freeInput.style.cssText = `
            accent-color: #6366f1;
            width: 16px;
            height: 16px;
            cursor: pointer;
        `;
        freeInput.addEventListener('change', (e) => {
            this._filters.isFree = e.target.checked ? true : null;
            if (e.target.checked) {
                this._filters.isPaid = null;
            }
        });
        freeCheck.appendChild(freeInput);
        freeCheck.appendChild(document.createTextNode('💰 Free Only'));
        additionalGroup.appendChild(freeCheck);

        sidebar.appendChild(additionalGroup);

        // --- Action Buttons ---
        const actionsContainer = document.createElement('div');
        actionsContainer.style.cssText = `
            display: flex;
            gap: 12px;
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid var(--border-color, #e5e7eb);
        `;

        const applyFiltersBtn = document.createElement('button');
        applyFiltersBtn.textContent = 'Apply Filters';
        applyFiltersBtn.type = 'button';
        applyFiltersBtn.style.cssText = `
            flex: 2;
            padding: 12px 20px;
            border-radius: 10px;
            border: none;
            background: #6366f1;
            color: #fff;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        applyFiltersBtn.addEventListener('mouseenter', () => {
            applyFiltersBtn.style.background = '#4f46e5';
        });
        applyFiltersBtn.addEventListener('mouseleave', () => {
            applyFiltersBtn.style.background = '#6366f1';
        });
        applyFiltersBtn.addEventListener('click', this._handleApplyFilters);

        const clearFiltersBtn = document.createElement('button');
        clearFiltersBtn.textContent = 'Clear All';
        clearFiltersBtn.type = 'button';
        clearFiltersBtn.style.cssText = `
            flex: 1;
            padding: 12px 16px;
            border-radius: 10px;
            border: 1px solid var(--border-color, #e5e7eb);
            background: transparent;
            color: var(--text-secondary, #6b7280);
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        clearFiltersBtn.addEventListener('mouseenter', () => {
            clearFiltersBtn.style.background = 'rgba(0,0,0,0.05)';
        });
        clearFiltersBtn.addEventListener('mouseleave', () => {
            clearFiltersBtn.style.background = 'transparent';
        });
        clearFiltersBtn.addEventListener('click', this._handleClearFilters);

        actionsContainer.appendChild(applyFiltersBtn);
        actionsContainer.appendChild(clearFiltersBtn);
        sidebar.appendChild(actionsContainer);

        document.body.appendChild(sidebar);
        this._filterSidebar = sidebar;

        // Open on desktop by default
        const desktopQuery = window.matchMedia('(min-width: 1024px)');
        if (desktopQuery.matches) {
            sidebar.style.display = 'block';
            sidebar.style.right = '0';
            sidebar.style.position = 'sticky';
            sidebar.style.top = '80px';
            sidebar.style.height = 'auto';
            sidebar.style.maxHeight = 'calc(100vh - 100px)';
            sidebar.style.borderRadius = '12px';
            sidebar.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
            sidebar.style.border = '1px solid var(--border-color, #e5e7eb)';
            sidebar.style.width = '300px';

            // Move sidebar to container
            const filterContainer = document.createElement('div');
            filterContainer.className = 'explore-filter-container';
            filterContainer.style.cssText = `
                display: flex;
                gap: 24px;
            `;

            const mainContent = document.createElement('div');
            mainContent.className = 'explore-main-content';
            mainContent.style.cssText = `
                flex: 1;
            `;

            // Move existing children to main content
            const children = Array.from(this._container.children);
            children.forEach(child => {
                if (child !== this._headerEl) {
                    mainContent.appendChild(child);
                }
            });

            filterContainer.appendChild(sidebar);
            filterContainer.appendChild(mainContent);

            // Re-insert header
            this._container.innerHTML = '';
            this._container.appendChild(this._headerEl);
            this._container.appendChild(filterContainer);
        }
    }

    // ============================================================
    // CATEGORIES SECTION
    // ============================================================

    _buildCategoriesSection() {
        if (!this.config.showCategories) return;

        const categories = getState('categories.items') || [];
        if (categories.length === 0) return;

        const section = document.createElement('section');
        section.className = 'explore-categories';
        section.style.cssText = `
            margin-bottom: 24px;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        `;

        const title = document.createElement('h2');
        title.textContent = 'Categories';
        title.style.cssText = `
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary, #1a1a2e);
        `;

        header.appendChild(title);
        section.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'explore-categories-grid';
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 12px;
        `;

        const displayCategories = categories.slice(0, 12);
        displayCategories.forEach(category => {
            const card = document.createElement('div');
            card.className = 'explore-category-item';
            card.style.cssText = `
                padding: 12px;
                border-radius: 10px;
                background: var(--bg-secondary, #f3f4f6);
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 2px solid transparent;
            `;

            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-4px)';
                card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                card.style.borderColor = '#6366f1';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = 'none';
                card.style.borderColor = 'transparent';
            });

            const icon = document.createElement('div');
            icon.textContent = category.icon || '📁';
            icon.style.fontSize = '28px';

            const name = document.createElement('div');
            name.textContent = category.name || 'Category';
            name.style.cssText = `
                margin-top: 6px;
                font-size: 13px;
                font-weight: 500;
                color: var(--text-primary, #1a1a2e);
            `;

            const count = document.createElement('div');
            count.textContent = `${category.productCount || 0} products`;
            count.style.cssText = `
                font-size: 11px;
                color: var(--text-secondary, #6b7280);
            `;

            card.appendChild(icon);
            card.appendChild(name);
            card.appendChild(count);

            card.addEventListener('click', () => {
                this._handleCategoryClick(category.id);
            });

            grid.appendChild(card);
        });

        section.appendChild(grid);

        // Find main content container
        const mainContent = this._container.querySelector('.explore-main-content') || this._container;
        mainContent.appendChild(section);
    }

    // ============================================================
    // TOOLBAR
    // ============================================================

    _buildToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'explore-toolbar';
        toolbar.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0 16px;
            flex-wrap: wrap;
            gap: 12px;
        `;

        // Results count
        const countContainer = document.createElement('div');
        const count = getState('products.items')?.length || 0;
        const countText = document.createElement('span');
        countText.textContent = `${count} products found`;
        countText.style.cssText = `
            font-size: 14px;
            color: var(--text-secondary, #6b7280);
        `;
        countContainer.appendChild(countText);

        // Sort
        if (this.config.showSort) {
            const sortContainer = document.createElement('div');
            sortContainer.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
            `;

            const sortLabel = document.createElement('span');
            sortLabel.textContent = 'Sort by:';
            sortLabel.style.cssText = `
                font-size: 13px;
                color: var(--text-secondary, #6b7280);
            `;

            const sortSelect = document.createElement('select');
            sortSelect.className = 'explore-sort';
            sortSelect.style.cssText = `
                padding: 6px 12px;
                border-radius: 8px;
                border: 1px solid var(--border-color, #e5e7eb);
                background: var(--bg-secondary, #fff);
                color: var(--text-primary, #1f2937);
                font-size: 13px;
                outline: none;
                cursor: pointer;
            `;

            const sortOptions = [
                { value: 'recent', label: 'Most Recent' },
                { value: 'popular', label: 'Most Popular' },
                { value: 'trending', label: 'Trending' },
                { value: 'rating', label: 'Highest Rated' },
                { value: 'price_low', label: 'Price: Low to High' },
                { value: 'price_high', label: 'Price: High to Low' },
                { value: 'downloads', label: 'Most Downloaded' }
            ];

            sortOptions.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                if (opt.value === this._filters.sortBy) {
                    option.selected = true;
                }
                sortSelect.appendChild(option);
            });

            sortSelect.addEventListener('change', (e) => {
                this._handleSortChange(e.target.value);
            });

            sortContainer.appendChild(sortLabel);
            sortContainer.appendChild(sortSelect);
            toolbar.appendChild(sortContainer);
        }

        toolbar.appendChild(countContainer);

        // Find main content container
        const mainContent = this._container.querySelector('.explore-main-content') || this._container;
        mainContent.appendChild(toolbar);
    }

    // ============================================================
    // PRODUCT GRID
    // ============================================================

    _buildProductGrid() {
        const container = document.createElement('div');
        container.className = 'explore-products-container';
        container.style.cssText = `
            position: relative;
            min-height: 200px;
        `;

        const grid = document.createElement('div');
        grid.className = 'explore-products-grid';
        grid.id = `explore-grid-${this._id}`;
        grid.style.cssText = `
            display: grid;
            grid-template-columns: ${this._viewMode === 'grid' 
                ? 'repeat(auto-fill, minmax(240px, 1fr))' 
                : '1fr'};
            gap: ${this._viewMode === 'grid' ? '20px' : '16px'};
        `;

        container.appendChild(grid);

        // Load products
        this._loadProducts(grid);

        // Infinite scroll
        if (this.config.enableInfiniteScroll) {
            this._setupInfiniteScroll(grid, container);
        }

        // Find main content container
        const mainContent = this._container.querySelector('.explore-main-content') || this._container;
        mainContent.appendChild(container);

        this._grid = grid;
        this._gridContainer = container;
    }

    _loadProducts(grid) {
        const allProducts = getState('products.items') || [];
        
        // Apply filters
        let filtered = this._applyFiltersToProducts(allProducts);

        // Sort
        filtered = this._sortProducts(filtered);

        // Paginate
        const start = 0;
        const end = this.config.productsPerPage;
        const items = filtered.slice(start, end);

        this._hasMore = items.length < filtered.length;
        this._allFiltered = filtered;

        grid.innerHTML = '';
        if (items.length === 0) {
            this._showEmptyState(grid);
            return;
        }

        items.forEach(product => {
            const card = this._createProductCard(product);
            grid.appendChild(card);
        });

        // Update count
        this._updateCount(filtered.length);
    }

    _applyFiltersToProducts(products) {
        let filtered = [...products];

        // Search
        if (this._filters.searchQuery) {
            const query = this._filters.searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.title?.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query) ||
                p.tags?.some(t => t.toLowerCase().includes(query))
            );
        }

        // Category
        if (this._filters.category) {
            filtered = filtered.filter(p => p.category === this._filters.category);
        }

        // Product Type
        if (this._filters.productType !== 'all') {
            filtered = filtered.filter(p => p.productType === this._filters.productType);
        }

        // Price
        filtered = filtered.filter(p => {
            const price = p.price || 0;
            return price >= (this._filters.minPrice || 0) && 
                   price <= (this._filters.maxPrice || 10000);
        });

        // Rating
        if (this._filters.rating > 0) {
            filtered = filtered.filter(p => (p.rating || 0) >= this._filters.rating);
        }

        // Featured
        if (this._filters.isFeatured) {
            filtered = filtered.filter(p => p.isFeatured);
        }

        // Trending
        if (this._filters.isTrending) {
            filtered = filtered.filter(p => p.isTrending);
        }

        // Free
        if (this._filters.isFree) {
            filtered = filtered.filter(p => p.isFree);
        }

        // Location (if available)
        if (this._filters.location) {
            // Simple location filter - would use geocoding in production
            filtered = filtered.filter(p => 
                p.location?.city?.toLowerCase().includes(this._filters.location.toLowerCase()) ||
                p.location?.state?.toLowerCase().includes(this._filters.location.toLowerCase()) ||
                p.location?.country?.toLowerCase().includes(this._filters.location.toLowerCase())
            );
        }

        return filtered;
    }

    _sortProducts(products) {
        const sorted = [...products];
        const sortBy = this._filters.sortBy;

        switch (sortBy) {
            case 'recent':
                return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'popular':
                return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
            case 'trending':
                return sorted.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
            case 'rating':
                return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            case 'price_low':
                return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
            case 'price_high':
                return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
            case 'downloads':
                return sorted.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
            default:
                return sorted;
        }
    }

    _setupInfiniteScroll(grid, container) {
        let isLoading = false;
        let page = 1;
        const pageSize = this.config.productsPerPage;

        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0];
            if (entry.isIntersecting && !isLoading && this._hasMore) {
                this._loadMoreProducts(grid, page + 1, pageSize);
                page++;
            }
        }, {
            root: container,
            rootMargin: '100px',
            threshold: 0.1
        });

        // Create sentinel
        const sentinel = document.createElement('div');
        sentinel.className = 'explore-sentinel';
        sentinel.style.cssText = `
            grid-column: 1 / -1;
            text-align: center;
            padding: 20px;
            color: var(--text-secondary, #6b7280);
            font-size: 14px;
        `;

        const loadMore = () => {
            if (this._hasMore) {
                sentinel.textContent = 'Loading more products...';
                observer.observe(sentinel);
            } else {
                sentinel.textContent = '✨ You\'ve seen all products';
            }
        };

        loadMore();
        grid.appendChild(sentinel);

        this._observer = observer;
        this._sentinel = sentinel;
        this._page = page;
    }

    _loadMoreProducts(grid, page, pageSize) {
        if (this._isLoading || !this._hasMore) return;

        this._isLoading = true;

        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const items = this._allFiltered?.slice(start, end) || [];

        if (items.length === 0) {
            this._hasMore = false;
            if (this._sentinel) {
                this._sentinel.textContent = '✨ You\'ve seen all products';
            }
            this._isLoading = false;
            return;
        }

        // Remove sentinel
        const sentinel = this._sentinel;
        if (sentinel && sentinel.parentNode) {
            sentinel.parentNode.removeChild(sentinel);
        }

        items.forEach(product => {
            const card = this._createProductCard(product);
            grid.appendChild(card);
        });

        // Add sentinel back
        const newSentinel = document.createElement('div');
        newSentinel.className = 'explore-sentinel';
        newSentinel.style.cssText = `
            grid-column: 1 / -1;
            text-align: center;
            padding: 20px;
            color: var(--text-secondary, #6b7280);
            font-size: 14px;
        `;
        newSentinel.textContent = this._hasMore ? 'Loading more products...' : '✨ You\'ve seen all products';
        grid.appendChild(newSentinel);
        this._sentinel = newSentinel;

        if (this._hasMore) {
            this._observer.observe(newSentinel);
        }

        this._isLoading = false;
        this._page = page;

        this._hasMore = end < (this._allFiltered?.length || 0);
    }

    _createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'explore-product-item';
        card.style.cssText = `
            background: var(--bg-primary, #fff);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid transparent;
            ${this._viewMode === 'list' ? 'display: flex; flex-direction: row; align-items: stretch;' : ''}
        `;

        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-4px)';
            card.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
            card.style.borderColor = '#6366f1';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
            card.style.borderColor = 'transparent';
        });

        // Image
        const imageWrapper = document.createElement('div');
        imageWrapper.style.cssText = `
            position: relative;
            padding-top: ${this._viewMode === 'list' ? '0' : '75%'};
            overflow: hidden;
            background: var(--bg-secondary, #f3f4f6);
            ${this._viewMode === 'list' ? 'width: 200px; min-height: 160px; flex-shrink: 0;' : ''}
        `;

        const img = document.createElement('img');
        img.src = product.thumbnail || product.images?.[0] || 'https://placehold.co/400x300/6366f1/ffffff?text=Product';
        img.alt = product.title || 'Product';
        img.style.cssText = `
            ${this._viewMode === 'list' ? 'width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0;' : 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;'}
            transition: transform 0.3s ease;
        `;
        imageWrapper.addEventListener('mouseenter', () => {
            img.style.transform = 'scale(1.05)';
        });
        imageWrapper.addEventListener('mouseleave', () => {
            img.style.transform = 'scale(1)';
        });

        // Badges
        const badges = document.createElement('div');
        badges.style.cssText = `
            position: absolute;
            top: 8px;
            left: 8px;
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
        `;

        const typeBadge = document.createElement('span');
        const typeLabels = {
            digital: '📱 Digital',
            physical: '📦 Physical',
            service: '🛠️ Service'
        };
        typeBadge.textContent = typeLabels[product.productType] || '📱 Digital';
        typeBadge.style.cssText = `
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            background: rgba(99,102,241,0.9);
            color: #fff;
        `;
        badges.appendChild(typeBadge);

        if (product.isFeatured) {
            const featuredBadge = document.createElement('span');
            featuredBadge.textContent = '⭐ Featured';
            featuredBadge.style.cssText = `
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 600;
                background: rgba(245,158,11,0.9);
                color: #fff;
            `;
            badges.appendChild(featuredBadge);
        }

        if (product.isTrending) {
            const trendingBadge = document.createElement('span');
            trendingBadge.textContent = '🔥 Trending';
            trendingBadge.style.cssText = `
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 600;
                background: rgba(239,68,68,0.9);
                color: #fff;
            `;
            badges.appendChild(trendingBadge);
        }

        if (product.isFree) {
            const freeBadge = document.createElement('span');
            freeBadge.textContent = '💰 Free';
            freeBadge.style.cssText = `
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 600;
                background: rgba(34,197,94,0.9);
                color: #fff;
            `;
            badges.appendChild(freeBadge);
        }

        imageWrapper.appendChild(img);
        imageWrapper.appendChild(badges);

        // Info
        const info = document.createElement('div');
        info.style.cssText = `
            padding: 12px 16px;
            flex: 1;
            ${this._viewMode === 'list' ? 'display: flex; flex-direction: column; justify-content: space-between;' : ''}
        `;

        const title = document.createElement('h3');
        title.textContent = product.title || 'Product';
        title.style.cssText = `
            margin: 0 0 4px;
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary, #1a1a2e);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `;

        const desc = document.createElement('p');
        desc.textContent = product.description?.substring(0, 80) + (product.description?.length > 80 ? '...' : '') || '';
        desc.style.cssText = `
            margin: 0 0 8px;
            font-size: 13px;
            color: var(--text-secondary, #6b7280);
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: ${this._viewMode === 'list' ? '3' : '2'};
            -webkit-box-orient: vertical;
            flex: 1;
        `;

        // Stats
        const stats = document.createElement('div');
        stats.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 12px;
            color: var(--text-secondary, #6b7280);
            flex-wrap: wrap;
        `;

        const rating = document.createElement('span');
        rating.textContent = `⭐ ${product.rating?.toFixed(1) || 0}`;

        const downloads = document.createElement('span');
        downloads.textContent = `📥 ${product.downloads || 0}`;

        const price = document.createElement('span');
        if (product.isFree) {
            price.textContent = 'Free';
            price.style.cssText = `
                margin-left: auto;
                font-weight: 600;
                color: #22c55e;
            `;
        } else if (product.price) {
            price.textContent = `$${product.price}`;
            price.style.cssText = `
                margin-left: auto;
                font-weight: 600;
                color: var(--text-primary, #1a1a2e);
            `;
        } else {
            price.textContent = 'Free';
            price.style.cssText = `
                margin-left: auto;
                font-weight: 600;
                color: #22c55e;
            `;
        }

        stats.appendChild(rating);
        stats.appendChild(downloads);
        stats.appendChild(price);

        info.appendChild(title);
        info.appendChild(desc);
        info.appendChild(stats);

        if (this._viewMode === 'list') {
            card.appendChild(imageWrapper);
            card.appendChild(info);
        } else {
            card.appendChild(imageWrapper);
            card.appendChild(info);
        }

        card.addEventListener('click', () => {
            this._handleProductClick(product.id);
        });

        return card;
    }

    _showEmptyState(grid) {
        const empty = document.createElement('div');
        empty.className = 'explore-empty';
        empty.style.cssText = `
            grid-column: 1 / -1;
            text-align: center;
            padding: 80px 20px;
            color: var(--text-secondary, #6b7280);
        `;
        empty.innerHTML = `
            <div style="font-size:64px;margin-bottom:16px;">🔍</div>
            <h3 style="margin:0;color:var(--text-primary,#1a1a2e);">No Products Found</h3>
            <p style="margin:8px 0 0;">Try adjusting your filters or search terms</p>
            <button onclick="window.location.reload()" style="margin-top:16px;padding:10px 24px;border:none;border-radius:8px;background:#6366f1;color:#fff;font-size:14px;font-weight:500;cursor:pointer;">
                Reset Filters
            </button>
        `;
        grid.appendChild(empty);
    }

    _updateCount(count) {
        const toolbar = this._container?.querySelector('.explore-toolbar');
        if (toolbar) {
            const countEl = toolbar.querySelector('span:first-child');
            if (countEl) {
                countEl.textContent = `${count} products found`;
            }
        }
    }

    // ============================================================
    // FILTER TOGGLE (Mobile)
    // ============================================================

    _buildFilterToggle() {
        // Desktop: filter toggle already built in sidebar
        // Mobile: handled by filter toggle button
    }

    // ============================================================
    // FILTER GROUP HELPER
    // ============================================================

    _createFilterGroup(title, id) {
        const group = document.createElement('div');
        group.className = 'filter-group';
        group.style.cssText = `
            margin-bottom: 20px;
        `;

        const label = document.createElement('h3');
        label.textContent = title;
        label.style.cssText = `
            margin: 0 0 8px;
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary, #1a1a2e);
        `;

        group.appendChild(label);
        return group;
    }

    // ============================================================
    // URL PARAMS
    // ============================================================

    _parseUrlParams() {
        const params = new URLSearchParams(window.location.search);

        if (params.has('search')) {
            this._filters.searchQuery = params.get('search');
        }
        if (params.has('category')) {
            this._filters.category = params.get('category');
        }
        if (params.has('type')) {
            this._filters.productType = params.get('type');
        }
        if (params.has('sort')) {
            this._filters.sortBy = params.get('sort');
        }
        if (params.has('minPrice')) {
            this._filters.minPrice = parseFloat(params.get('minPrice')) || 0;
        }
        if (params.has('maxPrice')) {
            this._filters.maxPrice = parseFloat(params.get('maxPrice')) || 10000;
        }
        if (params.has('rating')) {
            this._filters.rating = parseFloat(params.get('rating')) || 0;
        }
        if (params.has('location')) {
            this._filters.location = params.get('location');
        }
        if (params.has('featured')) {
            this._filters.isFeatured = params.get('featured') === 'true';
        }
        if (params.has('trending')) {
            this._filters.isTrending = params.get('trending') === 'true';
        }
        if (params.has('free')) {
            this._filters.isFree = params.get('free') === 'true';
        }
    }

    // ============================================================
    // THEME
    // ============================================================

    _applyTheme() {
        if (!this._container) return;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        this._container.style.color = isDark ? '#f3f4f6' : '#1a1a2e';
        this._container.style.background = isDark ? '#0f0f1a' : '#ffffff';

        // Update filter sidebar
        if (this._filterSidebar) {
            this._filterSidebar.style.background = isDark ? '#1a1a2e' : '#ffffff';
            this._filterSidebar.style.color = isDark ? '#f3f4f6' : '#1a1a2e';
        }
    }

    // ============================================================
    // EVENT HANDLERS
    // ============================================================

    _handleProductClick(productId) {
        analyticsService.trackEvent('explore_product_click', { productId });
        router.navigate(`/product/${productId}`);
    }

    _handleCategoryClick(categoryId) {
        analyticsService.trackEvent('explore_category_click', { categoryId });
        this._filters.category = categoryId;
        this._handleApplyFilters();
    }

    _handleSearch(query) {
        if (!query?.trim()) return;
        analyticsService.trackEvent('explore_search', { query });
        this._filters.searchQuery = query;
        this._handleApplyFilters();
    }

    _handleFilterChange(key, value) {
        this._filters[key] = value;
        // Don't auto-apply, wait for Apply button
    }

    _handleSortChange(sortBy) {
        this._filters.sortBy = sortBy;
        this._handleApplyFilters();
    }

    _handleViewToggle() {
        this._viewMode = this._viewMode === 'grid' ? 'list' : 'grid';
        const btn = this._container?.querySelector('.explore-view-btn');
        if (btn) {
            btn.textContent = this._viewMode === 'grid' ? '☷' : '☰';
        }
        // Rebuild grid with new view
        if (this._grid) {
            this._loadProducts(this._grid);
        }
        analyticsService.trackEvent('explore_view_toggle', { view: this._viewMode });
    }

    _handleApplyFilters() {
        analyticsService.trackEvent('explore_apply_filters', { 
            filters: this._filters 
        });
        this._page = 1;
        this._allFiltered = null;
        this._hasMore = true;
        this._loadProducts(this._grid);

        // Close sidebar on mobile
        if (this._filterSidebar) {
            this._filterSidebar.classList.remove('open');
            this._filterSidebar.style.right = '-400px';
            this._filterSidebar.style.display = 'none';
        }
    }

    _handleClearFilters() {
        this._filters = {
            category: null,
            subCategory: null,
            productType: 'all',
            minPrice: 0,
            maxPrice: 10000,
            rating: 0,
            location: null,
            radius: 50,
            tags: [],
            isFeatured: null,
            isTrending: null,
            isFree: null,
            isPaid: null,
            sortBy: 'recent',
            searchQuery: ''
        };

        // Reset UI elements
        const searchInput = this._container?.querySelector('.explore-search-input');
        if (searchInput) searchInput.value = '';

        const categorySelect = this._container?.querySelector('.filter-select');
        if (categorySelect) categorySelect.value = '';

        analyticsService.trackEvent('explore_clear_filters');
        this._handleApplyFilters();
    }

    _handleFilterSubmit(e) {
        e.preventDefault();
        this._handleApplyFilters();
    }

    _handleLocationChange(location) {
        this._filters.location = location;
        this._handleApplyFilters();
    }

    _handlePriceChange(min, max) {
        this._filters.minPrice = min || 0;
        this._filters.maxPrice = max || 10000;
        this._handleApplyFilters();
    }

    _handleRatingChange(rating) {
        this._filters.rating = rating;
        this._handleApplyFilters();
    }

    _handleTypeChange(type) {
        this._filters.productType = type;
        this._handleApplyFilters();
    }

    _handleLoadMore() {
        if (this._hasMore && !this._isLoading) {
            this._loadMoreProducts(this._grid, this._page + 1, this.config.productsPerPage);
        }
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
                this._handleProductsUpdate();
            }, ['products.items'])
        );

        this._subscribers.push(
            subscribe((state) => {
                this._handleCategoriesUpdate();
            }, ['categories.items'])
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
            eventBus.on(EVENTS.PRODUCTS_UPDATED, this._handleProductsUpdate)
        );
    }

    // ============================================================
    // STATE HANDLERS
    // ============================================================

    _handleThemeChange() {
        this._applyTheme();
    }

    _handleAuthChange() {
        // Refresh products if needed
    }

    _handleProductsUpdate() {
        if (this._grid) {
            this._page = 1;
            this._allFiltered = null;
            this._hasMore = true;
            this._loadProducts(this._grid);
        }
    }

    _handleCategoriesUpdate() {
        // Rebuild categories section
        const section = this._container?.querySelector('.explore-categories');
        if (section) {
            section.remove();
            this._buildCategoriesSection();
        }
    }

    // ============================================================
    // UTILITY METHODS
    // ============================================================

    _generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    // ============================================================
    // PUBLIC METHODS
    // ============================================================

    setSearch(query) {
        this._filters.searchQuery = query;
        if (this._searchInput) {
            this._searchInput.value = query;
        }
        this._handleApplyFilters();
        return this;
    }

    setCategory(categoryId) {
        this._filters.category = categoryId;
        this._handleApplyFilters();
        return this;
    }

    setFilterType(type) {
        this._filters.productType = type;
        this._handleApplyFilters();
        return this;
    }

    setSort(sort) {
        this._filters.sortBy = sort;
        this._handleApplyFilters();
        return this;
    }

    refresh() {
        this._page = 1;
        this._allFiltered = null;
        this._hasMore = true;
        if (this._grid) {
            this._loadProducts(this._grid);
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

        // Disconnect observer
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }

        // Remove filter sidebar
        if (this._filterSidebar && this._filterSidebar.parentNode) {
            this._filterSidebar.parentNode.removeChild(this._filterSidebar);
        }

        // Remove from DOM
        if (this._container && this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }

        this._container = null;
        this._grid = null;

        logger.info('🔍 ExploreScreen destroyed', { id: this._id });
    }
}

// ============================================================
// EXPORT
// ============================================================

export default ExploreScreen;

// ============================================================
// GLOBAL EXPOSURE
// ============================================================

if (typeof window !== 'undefined') {
    window.ExploreScreen = ExploreScreen;
}

// ============================================================
// END OF FILE: explore-screen.js
// ============================================================