// ============================================================
// FILE: js/screens/home-screen.js
// PURPOSE: Main Dashboard - Complete Home Screen v4.0
// DEPENDENCIES: store.js, all widgets, event-bus.js, router.js
// ROUTE: /home
// VERSION: 4.0.0 - FULL PRODUCTION
// ============================================================

import { store, getState, subscribe } from '../store.js';
import { eventBus, EVENTS } from '../state/event-bus.js';
import { router, ROUTES } from '../router.js';
import { logger } from '../services/logger.js';
import { analyticsService } from '../services/analytics-service.js';

// ============================================================
// HOME SCREEN CLASS
// ============================================================

export class HomeScreen {
    constructor(options = {}) {
        // ==========================================
        // CONFIGURATION
        // ==========================================
        this.config = {
            productsPerPage: 20,
            heroAutoplay: true,
            heroInterval: 5000,
            storiesLimit: 10,
            socialFeedLimit: 5,
            showHero: true,
            showCategories: true,
            showStories: true,
            showSocialFeed: true,
            showFeatured: true,
            showTrending: true,
            showSearch: true,
            showUserGreeting: true,
            showCoins: true,
            showSellerUpload: true,
            ...options
        };

        // ==========================================
        // STATE
        // ==========================================
        this._id = this._generateId('home');
        this._isDestroyed = false;
        this._isRendered = false;
        this._container = null;
        this._components = [];
        this._subscribers = [];
        this._eventListeners = [];

        // UI State
        this._activeTab = 'all';
        this._filterType = 'all';
        this._searchQuery = '';
        this._page = 1;
        this._isLoading = false;
        this._hasMore = true;

        // ==========================================
        // BIND METHODS
        // ==========================================
        this._handleProductClick = this._handleProductClick.bind(this);
        this._handleCategoryClick = this._handleCategoryClick.bind(this);
        this._handleSearch = this._handleSearch.bind(this);
        this._handleTabChange = this._handleTabChange.bind(this);
        this._handleFilterChange = this._handleFilterChange.bind(this);
        this._handleStoryClick = this._handleStoryClick.bind(this);
        this._handlePostClick = this._handlePostClick.bind(this);
        this._handleFollowClick = this._handleFollowClick.bind(this);
        this._handleContactClick = this._handleContactClick.bind(this);
        this._handleThemeChange = this._handleThemeChange.bind(this);
        this._handleAuthChange = this._handleAuthChange.bind(this);
        this._handleCoinsUpdate = this._handleCoinsUpdate.bind(this);
        this._handleProductsUpdate = this._handleProductsUpdate.bind(this);
        this._handleCategoriesUpdate = this._handleCategoriesUpdate.bind(this);
        this._handleStoriesUpdate = this._handleStoriesUpdate.bind(this);
        this._handleFeedUpdate = this._handleFeedUpdate.bind(this);

        // ==========================================
        // SETUP
        // ==========================================
        this._setupSubscriptions();
        this._setupEventListeners();
        
        logger.info('🏠 HomeScreen initialized', { id: this._id });
    }

    // ============================================================
    // RENDER
    // ============================================================

    render() {
        if (this._isDestroyed) {
            logger.warn('⚠️ HomeScreen destroyed, cannot render');
            return null;
        }

        if (this._isRendered) {
            return this._container;
        }

        logger.info('🏠 Rendering HomeScreen...');

        // Create container
        this._container = this._createContainer();

        // Build sections
        this._buildHeader();
        this._buildSearchBar();
        this._buildHeroSlider();
        this._buildStoriesBar();
        this._buildCategoriesGrid();
        this._buildTabs();
        this._buildSocialFeed();
        this._buildFeaturedProducts();
        this._buildTrendingProducts();
        this._buildProductGrid();
        this._buildFloatingAction();
        this._buildBottomNavigation();

        // Apply theme
        this._applyTheme();

        // Track view
        analyticsService.trackPageView('home');

        this._isRendered = true;
        logger.info('✅ HomeScreen rendered');

        return this._container;
    }

    // ============================================================
    // CONTAINER
    // ============================================================

    _createContainer() {
        const container = document.createElement('div');
        container.className = 'home-screen';
        container.id = `home-screen-${this._id}`;
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
    // HEADER
    // ============================================================

    _buildHeader() {
        const header = document.createElement('header');
        header.className = 'home-header';
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0 16px;
            flex-wrap: wrap;
            gap: 12px;
            border-bottom: 1px solid rgba(0,0,0,0.06);
            margin-bottom: 16px;
        `;

        // Left: Greeting
        if (this.config.showUserGreeting) {
            const greeting = this._createGreeting();
            header.appendChild(greeting);
        }

        // Right: Actions
        const actions = this._createHeaderActions();
        header.appendChild(actions);

        this._container.appendChild(header);
        this._headerEl = header;
    }

    _createGreeting() {
        const div = document.createElement('div');
        div.className = 'home-greeting';

        const user = getState('user.profile');
        const name = user?.displayName || 'Guest';
        const coins = user?.coins || 0;

        const title = document.createElement('h1');
        title.textContent = `Hello, ${name}!`;
        title.style.cssText = `
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            color: var(--text-primary, #1a1a2e);
        `;

        const subtitle = document.createElement('p');
        subtitle.style.cssText = `
            margin: 2px 0 0;
            font-size: 14px;
            color: var(--text-secondary, #6b7280);
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        `;

        // Coins
        if (this.config.showCoins) {
            const coinDisplay = document.createElement('span');
            coinDisplay.className = 'home-coins';
            coinDisplay.id = `coins-${this._id}`;
            coinDisplay.textContent = `🪙 ${coins}`;
            coinDisplay.style.cssText = `
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 2px 10px;
                border-radius: 12px;
                background: #fbbf24;
                color: #1a1a2e;
                font-size: 12px;
                font-weight: 600;
            `;
            subtitle.appendChild(coinDisplay);
        }

        // Followers
        if (user?.followers !== undefined) {
            const followers = document.createElement('span');
            followers.textContent = `👥 ${this._formatNumber(user.followers)} followers`;
            followers.style.fontSize = '12px';
            followers.style.color = 'var(--text-secondary, #6b7280)';
            subtitle.appendChild(followers);
        }

        div.appendChild(title);
        div.appendChild(subtitle);
        return div;
    }

    _createHeaderActions() {
        const div = document.createElement('div');
        div.className = 'home-actions';
        div.style.cssText = `
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
        `;

        const user = getState('user.profile');

        // Theme Toggle
        const themeBtn = this._createIconButton(
            document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙',
            'Toggle theme',
            () => this._toggleTheme()
        );
        div.appendChild(themeBtn);

        // Notifications
        const notifBtn = this._createIconButton('🔔', 'Notifications', () => {
            router.navigate(ROUTES.NOTIFICATIONS);
        });
        
        const unread = getState('notifications.unread') || 0;
        if (unread > 0) {
            const badge = document.createElement('span');
            badge.textContent = unread > 9 ? '9+' : unread;
            badge.style.cssText = `
                position: absolute;
                top: -2px;
                right: -2px;
                background: #ef4444;
                color: #fff;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                font-size: 10px;
                font-weight: 700;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid var(--bg-primary, #fff);
            `;
            notifBtn.style.position = 'relative';
            notifBtn.appendChild(badge);
        }
        div.appendChild(notifBtn);

        // Chat
        const chatBtn = this._createIconButton('💬', 'Chat', () => {
            router.navigate(ROUTES.CHAT_LIST);
        });
        div.appendChild(chatBtn);

        // Upload (Seller only)
        if (this.config.showSellerUpload && user?.isSeller) {
            const uploadBtn = document.createElement('button');
            uploadBtn.textContent = '➕ Upload';
            uploadBtn.style.cssText = `
                padding: 8px 16px;
                border-radius: 8px;
                border: none;
                background: #6366f1;
                color: #fff;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            uploadBtn.addEventListener('mouseenter', () => {
                uploadBtn.style.background = '#4f46e5';
                uploadBtn.style.transform = 'translateY(-2px)';
            });
            uploadBtn.addEventListener('mouseleave', () => {
                uploadBtn.style.background = '#6366f1';
                uploadBtn.style.transform = 'translateY(0)';
            });
            uploadBtn.addEventListener('click', () => {
                router.navigate(ROUTES.UPLOAD_PRODUCT);
            });
            div.appendChild(uploadBtn);
        }

        // Profile
        const profileBtn = document.createElement('button');
        profileBtn.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2px solid #6366f1;
            background: transparent;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            padding: 0;
            transition: all 0.3s ease;
        `;

        if (user?.photoURL) {
            const img = document.createElement('img');
            img.src = user.photoURL;
            img.alt = user.displayName || 'Profile';
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
            profileBtn.appendChild(img);
        } else {
            profileBtn.textContent = '👤';
            profileBtn.style.fontSize = '20px';
        }

        profileBtn.addEventListener('click', () => {
            router.navigate(ROUTES.PROFILE);
        });
        div.appendChild(profileBtn);

        return div;
    }

    _createIconButton(icon, label, onClick) {
        const btn = document.createElement('button');
        btn.textContent = icon;
        btn.setAttribute('aria-label', label);
        btn.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: none;
            background: transparent;
            font-size: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        `;
        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'rgba(0,0,0,0.05)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'transparent';
        });
        btn.addEventListener('click', onClick);
        return btn;
    }

    // ============================================================
    // SEARCH BAR
    // ============================================================

    _buildSearchBar() {
        if (!this.config.showSearch) return;

        const container = document.createElement('div');
        container.className = 'home-search';
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

        // Search Input
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Search for products, creators, categories...';
        input.className = 'home-search-input';
        input.setAttribute('aria-label', 'Search products');
        input.value = this._searchQuery;
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
            this._searchQuery = e.target.value;
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this._handleSearch(this._searchQuery);
            }
        });

        // Search Icon
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

        // Filter Dropdown
        const filterSelect = document.createElement('select');
        filterSelect.className = 'home-filter-select';
        filterSelect.style.cssText = `
            padding: 10px 12px;
            border-radius: 12px;
            border: 1px solid var(--border-color, #e5e7eb);
            font-size: 13px;
            background: var(--bg-secondary, #fff);
            color: var(--text-primary, #1f2937);
            cursor: pointer;
            outline: none;
            transition: all 0.3s ease;
        `;

        const filterOptions = [
            { value: 'all', label: 'All Types' },
            { value: 'digital', label: '📱 Digital' },
            { value: 'physical', label: '📦 Physical' },
            { value: 'service', label: '🛠️ Service' }
        ];

        filterOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value === this._filterType) option.selected = true;
            filterSelect.appendChild(option);
        });

        filterSelect.addEventListener('change', (e) => {
            this._filterType = e.target.value;
            this._handleFilterChange(this._filterType);
        });

        // Search Button
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
            this._handleSearch(this._searchQuery);
        });

        wrapper.appendChild(input);
        wrapper.appendChild(filterSelect);
        wrapper.appendChild(searchBtn);
        container.appendChild(icon);
        container.appendChild(wrapper);

        this._container.appendChild(container);
        this._searchInput = input;
        this._filterSelect = filterSelect;
    }

    // ============================================================
    // HERO SLIDER
    // ============================================================

    _buildHeroSlider() {
        if (!this.config.showHero) return;

        const slides = [
            {
                image: 'https://placehold.co/1200x400/6366f1/ffffff?text=Welcome+to+ZYMORE+v4.0',
                title: 'Welcome to ZYMORE',
                description: 'Discover amazing digital & physical products',
                badge: '🔥 Featured',
                link: '/explore'
            },
            {
                image: 'https://placehold.co/1200x400/22c55e/ffffff?text=Premium+Digital+Content',
                title: 'Premium Digital Products',
                description: 'Curated content for creators and professionals',
                badge: '⭐ Premium',
                link: '/explore?category=premium'
            },
            {
                image: 'https://placehold.co/1200x400/f59e0b/ffffff?text=Physical+Products+Available',
                title: 'Physical Products Available',
                description: 'Find products near you with location-based search',
                badge: '📦 Physical',
                link: '/explore?type=physical'
            },
            {
                image: 'https://placehold.co/1200x400/ec4899/ffffff?text=Join+the+Community',
                title: 'Join Our Community',
                description: 'Connect with creators and buyers worldwide',
                badge: '👥 Social',
                link: '/social'
            }
        ];

        const container = document.createElement('div');
        container.className = 'home-hero';
        container.style.cssText = `
            margin-bottom: 28px;
            border-radius: 16px;
            overflow: hidden;
            position: relative;
        `;

        let currentIndex = 0;
        const slideElements = [];

        // Create slides
        slides.forEach((slide, index) => {
            const slideEl = document.createElement('div');
            slideEl.className = 'hero-slide';
            slideEl.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                opacity: ${index === 0 ? 1 : 0};
                transition: opacity 0.6s ease;
                cursor: pointer;
            `;

            const img = document.createElement('img');
            img.src = slide.image;
            img.alt = slide.title;
            img.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            `;

            slideEl.appendChild(img);

            // Caption
            const caption = document.createElement('div');
            caption.style.cssText = `
                position: absolute;
                bottom: 40px;
                left: 40px;
                color: #fff;
                text-shadow: 0 2px 10px rgba(0,0,0,0.3);
                max-width: 60%;
                pointer-events: none;
            `;

            const badge = document.createElement('span');
            badge.textContent = slide.badge;
            badge.style.cssText = `
                display: inline-block;
                padding: 4px 12px;
                border-radius: 12px;
                background: ${slide.badge.includes('Premium') ? '#f59e0b' : slide.badge.includes('Physical') ? '#22c55e' : '#6366f1'};
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 8px;
            `;

            const title = document.createElement('h2');
            title.textContent = slide.title;
            title.style.cssText = `
                margin: 0;
                font-size: 32px;
                font-weight: 700;
            `;

            const desc = document.createElement('p');
            desc.textContent = slide.description;
            desc.style.cssText = `
                margin: 8px 0 0;
                font-size: 16px;
                opacity: 0.9;
            `;

            caption.appendChild(badge);
            caption.appendChild(title);
            caption.appendChild(desc);
            slideEl.appendChild(caption);

            slideEl.addEventListener('click', () => {
                if (slide.link) {
                    router.navigate(slide.link);
                }
            });

            container.appendChild(slideEl);
            slideElements.push(slideEl);
        });

        // Dots
        const dotsContainer = document.createElement('div');
        dotsContainer.style.cssText = `
            position: absolute;
            bottom: 12px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 8px;
            z-index: 5;
        `;

        const dots = [];
        slides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.style.cssText = `
                width: 10px;
                height: 10px;
                border-radius: 50%;
                border: 2px solid rgba(255,255,255,0.5);
                background: ${index === 0 ? '#ffffff' : 'transparent'};
                cursor: pointer;
                padding: 0;
                transition: all 0.3s ease;
            `;
            dot.addEventListener('click', () => {
                this._goToSlide(index, slideElements, dots);
            });
            dotsContainer.appendChild(dot);
            dots.push(dot);
        });

        container.appendChild(dotsContainer);

        // Arrows
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '‹';
        prevBtn.style.cssText = `
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 5;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: none;
            background: rgba(0,0,0,0.3);
            color: #fff;
            font-size: 28px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.3s;
        `;
        prevBtn.addEventListener('mouseenter', () => {
            prevBtn.style.background = 'rgba(0,0,0,0.5)';
        });
        prevBtn.addEventListener('mouseleave', () => {
            prevBtn.style.background = 'rgba(0,0,0,0.3)';
        });
        prevBtn.addEventListener('click', () => {
            const prev = (currentIndex - 1 + slides.length) % slides.length;
            this._goToSlide(prev, slideElements, dots);
        });
        container.appendChild(prevBtn);

        const nextBtn = document.createElement('button');
        nextBtn.textContent = '›';
        nextBtn.style.cssText = `
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 5;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: none;
            background: rgba(0,0,0,0.3);
            color: #fff;
            font-size: 28px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.3s;
        `;
        nextBtn.addEventListener('mouseenter', () => {
            nextBtn.style.background = 'rgba(0,0,0,0.5)';
        });
        nextBtn.addEventListener('mouseleave', () => {
            nextBtn.style.background = 'rgba(0,0,0,0.3)';
        });
        nextBtn.addEventListener('click', () => {
            const next = (currentIndex + 1) % slides.length;
            this._goToSlide(next, slideElements, dots);
        });
        container.appendChild(nextBtn);

        // Set initial size
        container.style.height = '400px';
        container.style.position = 'relative';

        // Auto-play
        if (this.config.heroAutoplay) {
            let interval = setInterval(() => {
                const next = (currentIndex + 1) % slides.length;
                this._goToSlide(next, slideElements, dots);
            }, this.config.heroInterval);

            // Pause on hover
            container.addEventListener('mouseenter', () => {
                clearInterval(interval);
            });
            container.addEventListener('mouseleave', () => {
                interval = setInterval(() => {
                    const next = (currentIndex + 1) % slides.length;
                    this._goToSlide(next, slideElements, dots);
                }, this.config.heroInterval);
            });
        }

        // Responsive
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        const handleResize = (e) => {
            if (e.matches) {
                container.style.height = '250px';
                const captions = container.querySelectorAll('.hero-slide > div:last-child');
                captions.forEach(cap => {
                    cap.style.bottom = '20px';
                    cap.style.left = '20px';
                    cap.style.maxWidth = '80%';
                    const title = cap.querySelector('h2');
                    if (title) title.style.fontSize = '20px';
                    const desc = cap.querySelector('p');
                    if (desc) desc.style.fontSize = '13px';
                });
            } else {
                container.style.height = '400px';
                const captions = container.querySelectorAll('.hero-slide > div:last-child');
                captions.forEach(cap => {
                    cap.style.bottom = '40px';
                    cap.style.left = '40px';
                    cap.style.maxWidth = '60%';
                    const title = cap.querySelector('h2');
                    if (title) title.style.fontSize = '32px';
                    const desc = cap.querySelector('p');
                    if (desc) desc.style.fontSize = '16px';
                });
            }
        };

        mediaQuery.addEventListener('change', handleResize);
        handleResize(mediaQuery);

        this._container.appendChild(container);
        this._heroContainer = container;
        this._slideElements = slideElements;
        this._dots = dots;
        this._currentIndex = currentIndex;
    }

    _goToSlide(index, slides, dots) {
        slides.forEach((slide, i) => {
            slide.style.opacity = i === index ? 1 : 0;
        });
        dots.forEach((dot, i) => {
            dot.style.background = i === index ? '#ffffff' : 'transparent';
        });
        this._currentIndex = index;
    }

    // ============================================================
    // STORIES BAR
    // ============================================================

    _buildStoriesBar() {
        if (!this.config.showStories) return;

        const stories = getState('social.stories') || [];
        if (stories.length === 0) return;

        const section = document.createElement('section');
        section.className = 'home-section home-stories';
        section.id = `stories-${this._id}`;
        section.style.cssText = `
            margin-bottom: 24px;
            padding: 8px 0;
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        `;

        const title = document.createElement('h3');
        title.textContent = '📸 Stories';
        title.style.cssText = `
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary, #1a1a2e);
        `;

        const addBtn = document.createElement('button');
        addBtn.textContent = '+ Add Story';
        addBtn.style.cssText = `
            background: none;
            border: none;
            color: #6366f1;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            padding: 4px 8px;
        `;
        addBtn.addEventListener('click', () => {
            router.navigate(ROUTES.CREATE_STORY);
        });

        header.appendChild(title);
        header.appendChild(addBtn);
        section.appendChild(header);

        // Stories scroll
        const scrollContainer = document.createElement('div');
        scrollContainer.style.cssText = `
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding: 4px 0 8px;
            scrollbar-width: thin;
            -webkit-overflow-scrolling: touch;
        `;

        const displayStories = stories.slice(0, this.config.storiesLimit);
        displayStories.forEach(story => {
            const storyEl = document.createElement('div');
            storyEl.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                cursor: pointer;
                flex-shrink: 0;
                transition: transform 0.2s;
                min-width: 72px;
            `;
            storyEl.addEventListener('mouseenter', () => {
                storyEl.style.transform = 'scale(1.05)';
            });
            storyEl.addEventListener('mouseleave', () => {
                storyEl.style.transform = 'scale(1)';
            });

            const avatar = document.createElement('div');
            avatar.style.cssText = `
                width: 64px;
                height: 64px;
                border-radius: 50%;
                padding: 2px;
                background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            const img = document.createElement('img');
            img.src = story.userPhoto || 'https://placehold.co/64x64/6366f1/ffffff?text=👤';
            img.alt = story.userName || 'User';
            img.style.cssText = `
                width: 58px;
                height: 58px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid #fff;
            `;

            avatar.appendChild(img);

            const name = document.createElement('span');
            name.textContent = story.userName?.substring(0, 8) || 'User';
            name.style.cssText = `
                font-size: 11px;
                color: var(--text-secondary, #6b7280);
                text-align: center;
                max-width: 72px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            `;

            storyEl.appendChild(avatar);
            storyEl.appendChild(name);

            storyEl.addEventListener('click', () => {
                this._handleStoryClick(story.id);
            });

            scrollContainer.appendChild(storyEl);
        });

        section.appendChild(scrollContainer);
        this._container.appendChild(section);
        this._storiesContainer = scrollContainer;
    }

    // ============================================================
    // CATEGORIES GRID
    // ============================================================

    _buildCategoriesGrid() {
        if (!this.config.showCategories) return;

        const categories = getState('categories.items') || [];
        if (categories.length === 0) return;

        const section = document.createElement('section');
        section.className = 'home-section home-categories';
        section.id = `categories-${this._id}`;
        section.style.cssText = `
            margin-bottom: 28px;
        `;

        const header = this._createSectionHeader('Categories', 'Browse all', '/explore');
        section.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'category-grid';
        grid.id = `category-grid-${this._id}`;
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 12px;
        `;

        const displayCategories = categories.slice(0, 8);
        displayCategories.forEach(category => {
            const card = this._createCategoryCard(category);
            grid.appendChild(card);
        });

        section.appendChild(grid);
        this._container.appendChild(section);
        this._categoryGrid = grid;
    }

    _createCategoryCard(category) {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.style.cssText = `
            padding: 16px;
            border-radius: 12px;
            background: var(--bg-secondary, #f3f4f6);
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid transparent;
        `;

        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-4px)';
            card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            card.style.borderColor = '#6366f1';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'none';
            card.style.borderColor = 'transparent';
        });

        const icon = document.createElement('div');
        icon.textContent = category.icon || '📁';
        icon.style.fontSize = '32px';

        const name = document.createElement('div');
        name.textContent = category.name || 'Category';
        name.style.cssText = `
            margin-top: 8px;
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary, #1a1a2e);
        `;

        const count = document.createElement('div');
        count.textContent = `${category.productCount || 0} products`;
        count.style.cssText = `
            font-size: 12px;
            color: var(--text-secondary, #6b7280);
            margin-top: 4px;
        `;

        card.appendChild(icon);
        card.appendChild(name);
        card.appendChild(count);

        card.addEventListener('click', () => {
            this._handleCategoryClick(category.id);
        });

        return card;
    }

    // ============================================================
    // TABS
    // ============================================================

    _buildTabs() {
        const tabs = [
            { id: 'all', label: 'All', icon: '📋' },
            { id: 'digital', label: 'Digital', icon: '📱' },
            { id: 'physical', label: 'Physical', icon: '📦' },
            { id: 'service', label: 'Service', icon: '🛠️' }
        ];

        const container = document.createElement('div');
        container.className = 'home-tabs';
        container.id = `tabs-${this._id}`;
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
            btn.className = 'home-tab';
            btn.dataset.tab = tab.id;
            btn.textContent = `${tab.icon} ${tab.label}`;
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
    }

    // ============================================================
    // SOCIAL FEED
    // ============================================================

    _buildSocialFeed() {
        if (!this.config.showSocialFeed) return;

        const posts = getState('social.feed') || [];
        if (posts.length === 0) return;

        const section = document.createElement('section');
        section.className = 'home-section home-social-feed';
        section.id = `social-${this._id}`;
        section.style.cssText = `
            margin-bottom: 28px;
            padding: 16px;
            border-radius: 12px;
            background: var(--bg-secondary, rgba(0,0,0,0.02));
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        `;

        const title = document.createElement('h3');
        title.textContent = '👥 Social Feed';
        title.style.cssText = `
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary, #1a1a2e);
        `;

        const viewAll = document.createElement('button');
        viewAll.textContent = 'View all →';
        viewAll.style.cssText = `
            background: none;
            border: none;
            color: #6366f1;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
        `;
        viewAll.addEventListener('click', () => {
            router.navigate(ROUTES.SOCIAL_FEED);
        });

        header.appendChild(title);
        header.appendChild(viewAll);
        section.appendChild(header);

        const feedContainer = document.createElement('div');
        feedContainer.className = 'social-feed-container';
        feedContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 16px;
        `;

        const displayPosts = posts.slice(0, this.config.socialFeedLimit);
        displayPosts.forEach(post => {
            const postEl = this._createPostCard(post);
            feedContainer.appendChild(postEl);
        });

        section.appendChild(feedContainer);
        this._container.appendChild(section);
        this._socialFeedContainer = feedContainer;
    }

    _createPostCard(post) {
        const card = document.createElement('div');
        card.className = 'social-post-card';
        card.style.cssText = `
            padding: 16px;
            border-radius: 12px;
            background: var(--bg-primary, #fff);
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-2px)';
            card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
        });

        // User info
        const userInfo = document.createElement('div');
        userInfo.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        `;

        const avatar = document.createElement('img');
        avatar.src = post.userPhoto || 'https://placehold.co/40x40/6366f1/ffffff?text=👤';
        avatar.alt = post.userName || 'User';
        avatar.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
        `;

        const nameContainer = document.createElement('div');
        const name = document.createElement('span');
        name.textContent = post.userName || 'User';
        name.style.cssText = `
            font-weight: 600;
            font-size: 14px;
            color: var(--text-primary, #1a1a2e);
        `;

        const time = document.createElement('span');
        time.textContent = this._getTimeAgo(post.createdAt);
        time.style.cssText = `
            font-size: 12px;
            color: var(--text-secondary, #6b7280);
            display: block;
        `;

        nameContainer.appendChild(name);
        nameContainer.appendChild(time);

        // Follow button
        const followBtn = document.createElement('button');
        const isFollowing = getState('social.following')?.includes(post.userId) || false;
        followBtn.textContent = isFollowing ? '✓ Following' : '+ Follow';
        followBtn.style.cssText = `
            margin-left: auto;
            padding: 4px 12px;
            border-radius: 12px;
            border: none;
            background: ${isFollowing ? 'rgba(99,102,241,0.1)' : '#6366f1'};
            color: ${isFollowing ? '#6366f1' : '#ffffff'};
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        `;
        followBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._handleFollowClick(post.userId);
        });

        userInfo.appendChild(avatar);
        userInfo.appendChild(nameContainer);
        userInfo.appendChild(followBtn);

        // Content
        const content = document.createElement('p');
        content.textContent = post.content || '';
        content.style.cssText = `
            margin: 0 0 10px;
            font-size: 14px;
            color: var(--text-primary, #374151);
            line-height: 1.5;
        `;

        // Images
        let imageContainer = null;
        if (post.images && post.images.length > 0) {
            imageContainer = document.createElement('div');
            imageContainer.style.cssText = `
                display: grid;
                grid-template-columns: repeat(${Math.min(post.images.length, 3)}, 1fr);
                gap: 4px;
                margin-bottom: 10px;
                border-radius: 8px;
                overflow: hidden;
            `;
            post.images.slice(0, 4).forEach(img => {
                const imgEl = document.createElement('img');
                imgEl.src = img;
                imgEl.alt = 'Post image';
                imgEl.style.cssText = `
                    width: 100%;
                    height: 150px;
                    object-fit: cover;
                `;
                imageContainer.appendChild(imgEl);
            });
        }

        // Stats
        const stats = document.createElement('div');
        stats.style.cssText = `
            display: flex;
            gap: 16px;
            font-size: 13px;
            color: var(--text-secondary, #6b7280);
        `;

        const likeCount = document.createElement('span');
        likeCount.textContent = `❤️ ${post.likes || 0}`;

        const commentCount = document.createElement('span');
        commentCount.textContent = `💬 ${post.comments || 0}`;

        const shareCount = document.createElement('span');
        shareCount.textContent = `🔄 ${post.shares || 0}`;

        stats.appendChild(likeCount);
        stats.appendChild(commentCount);
        stats.appendChild(shareCount);

        card.appendChild(userInfo);
        card.appendChild(content);
        if (imageContainer) card.appendChild(imageContainer);
        card.appendChild(stats);

        card.addEventListener('click', () => {
            this._handlePostClick(post.id);
        });

        return card;
    }

    // ============================================================
    // FEATURED PRODUCTS
    // ============================================================

    _buildFeaturedProducts() {
        if (!this.config.showFeatured) return;

        const products = getState('products.items') || [];
        const featured = products
            .filter(p => p.isFeatured)
            .filter(p => this._filterByType(p))
            .slice(0, 6);

        if (featured.length === 0) return;

        const section = document.createElement('section');
        section.className = 'home-section home-featured';
        section.style.cssText = `
            margin-bottom: 28px;
        `;

        const header = this._createSectionHeader('⭐ Featured Products', 'View all', '/explore?filter=featured');
        section.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'featured-grid';
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 16px;
        `;

        featured.forEach(product => {
            const card = this._createProductCard(product);
            grid.appendChild(card);
        });

        section.appendChild(grid);
        this._container.appendChild(section);
    }

    // ============================================================
    // TRENDING PRODUCTS
    // ============================================================

    _buildTrendingProducts() {
        if (!this.config.showTrending) return;

        const products = getState('products.items') || [];
        const trending = products
            .filter(p => p.isTrending)
            .filter(p => this._filterByType(p))
            .slice(0, 6);

        if (trending.length === 0) return;

        const section = document.createElement('section');
        section.className = 'home-section home-trending';
        section.style.cssText = `
            margin-bottom: 28px;
        `;

        const header = this._createSectionHeader('🔥 Trending Now', 'View all', '/explore?filter=trending');
        section.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'trending-grid';
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 16px;
        `;

        trending.forEach(product => {
            const card = this._createProductCard(product);
            grid.appendChild(card);
        });

        section.appendChild(grid);
        this._container.appendChild(section);
    }

    // ============================================================
    // PRODUCT GRID
    // ============================================================

    _buildProductGrid() {
        const section = document.createElement('section');
        section.className = 'home-section home-products';
        section.style.cssText = `
            margin-bottom: 20px;
        `;

        const header = this._createSectionHeader('📦 All Products', '', '');
        section.appendChild(header);

        const gridContainer = document.createElement('div');
        gridContainer.className = 'product-grid-container';
        gridContainer.style.cssText = `
            position: relative;
            min-height: 200px;
        `;

        const grid = document.createElement('div');
        grid.className = 'product-grid';
        grid.id = `product-grid-${this._id}`;
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 16px;
        `;

        gridContainer.appendChild(grid);
        section.appendChild(gridContainer);
        this._container.appendChild(section);

        // Load initial products
        this._loadProducts(grid);

        // Infinite scroll
        this._setupInfiniteScroll(grid, gridContainer);
    }

    _loadProducts(grid) {
        const allProducts = getState('products.items') || [];
        
        // Filter
        let filtered = allProducts;
        if (this._filterType !== 'all') {
            filtered = filtered.filter(p => p.productType === this._filterType);
        }
        if (this._searchQuery) {
            const query = this._searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.title?.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query) ||
                p.tags?.some(t => t.toLowerCase().includes(query))
            );
        }

        // Sort
        filtered = filtered.sort((a, b) => {
            if (a.isFeatured && !b.isFeatured) return -1;
            if (!a.isFeatured && b.isFeatured) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Paginate
        const start = 0;
        const end = this.config.productsPerPage;
        const items = filtered.slice(start, end);

        this._hasMore = items.length < filtered.length;
        this._allFiltered = filtered;

        grid.innerHTML = '';
        items.forEach(product => {
            const card = this._createProductCard(product);
            grid.appendChild(card);
        });

        if (items.length === 0) {
            this._showEmptyState(grid);
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
        sentinel.className = 'product-sentinel';
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

        this._grid = grid;
        this._sentinel = sentinel;
        this._observer = observer;
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
        newSentinel.className = 'product-sentinel';
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

    _showEmptyState(grid) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.style.cssText = `
            grid-column: 1 / -1;
            text-align: center;
            padding: 60px 20px;
            color: var(--text-secondary, #6b7280);
        `;
        empty.innerHTML = `
            <div style="font-size:48px;margin-bottom:16px;">📦</div>
            <h3 style="margin:0;color:var(--text-primary,#1a1a2e);">No Products Found</h3>
            <p style="margin:8px 0 0;">Try adjusting your filters or search</p>
        `;
        grid.appendChild(empty);
    }

    _createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.cssText = `
            background: var(--bg-primary, #fff);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid transparent;
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
            padding-top: 75%;
            overflow: hidden;
            background: var(--bg-secondary, #f3f4f6);
        `;

        const img = document.createElement('img');
        img.src = product.thumbnail || product.images?.[0] || 'https://placehold.co/400x300/6366f1/ffffff?text=Product';
        img.alt = product.title || 'Product';
        img.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
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

        // Type badge
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

        // Featured badge
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

        // Trending badge
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

        imageWrapper.appendChild(img);
        imageWrapper.appendChild(badges);
        card.appendChild(imageWrapper);

        // Info
        const info = document.createElement('div');
        info.style.cssText = `
            padding: 12px 16px;
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
        desc.textContent = product.description?.substring(0, 60) + (product.description?.length > 60 ? '...' : '') || '';
        desc.style.cssText = `
            margin: 0 0 8px;
            font-size: 13px;
            color: var(--text-secondary, #6b7280);
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        `;

        // Stats
        const stats = document.createElement('div');
        stats.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 12px;
            color: var(--text-secondary, #6b7280);
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
        card.appendChild(info);

        card.addEventListener('click', () => {
            this._handleProductClick(product.id);
        });

        return card;
    }

    // ============================================================
    // FLOATING ACTION BUTTON
    // ============================================================

    _buildFloatingAction() {
        const user = getState('user.profile');
        if (!this.config.showSellerUpload || !user?.isSeller) return;

        const fab = document.createElement('button');
        fab.className = 'home-fab';
        fab.setAttribute('aria-label', 'Upload product');
        fab.textContent = '➕';
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

        fab.addEventListener('click', () => {
            router.navigate(ROUTES.UPLOAD_PRODUCT);
        });

        this._container.appendChild(fab);
        this._fab = fab;
    }

    // ============================================================
    // BOTTOM NAVIGATION
    // ============================================================

    _buildBottomNavigation() {
        const nav = document.createElement('nav');
        nav.className = 'bottom-nav';
        nav.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            display: flex;
            justify-content: space-around;
            align-items: center;
            padding: 8px 0 env(safe-area-inset-bottom, 8px);
            background: var(--bg-primary, #fff);
            border-top: 1px solid var(--border-color, #e5e7eb);
            z-index: 999;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
        `;

        const items = [
            { icon: '🏠', label: 'Home', route: '/home', active: true },
            { icon: '🔍', label: 'Explore', route: '/explore' },
            { icon: '👥', label: 'Social', route: '/social' },
            { icon: '💬', label: 'Chat', route: '/chat' },
            { icon: '👤', label: 'Profile', route: '/profile' }
        ];

        items.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'bottom-nav-btn';
            btn.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px 12px;
                color: ${item.active ? '#6366f1' : 'var(--text-secondary, #6b7280)'};
                transition: all 0.2s;
                position: relative;
            `;

            const icon = document.createElement('span');
            icon.textContent = item.icon;
            icon.style.fontSize = '22px';

            const label = document.createElement('span');
            label.textContent = item.label;
            label.style.cssText = `
                font-size: 10px;
                font-weight: ${item.active ? '600' : '400'};
            `;

            btn.appendChild(icon);
            btn.appendChild(label);

            btn.addEventListener('click', () => {
                router.navigate(item.route);
            });

            nav.appendChild(btn);
        });

        this._container.appendChild(nav);
        this._bottomNav = nav;
    }

    // ============================================================
    // UTILITY METHODS
    // ============================================================

    _createSectionHeader(title, linkText, linkUrl) {
        const header = document.createElement('div');
        header.className = 'section-header';
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        `;

        const titleEl = document.createElement('h2');
        titleEl.textContent = title;
        titleEl.style.cssText = `
            margin: 0;
            font-size: 20px;
            font-weight: 600;
            color: var(--text-primary, #1a1a2e);
        `;

        header.appendChild(titleEl);

        if (linkText && linkUrl) {
            const link = document.createElement('button');
            link.textContent = linkText;
            link.type = 'button';
            link.style.cssText = `
                background: none;
                border: none;
                color: #6366f1;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                padding: 4px 8px;
                transition: color 0.2s;
            `;
            link.addEventListener('mouseenter', () => {
                link.style.color = '#4f46e5';
            });
            link.addEventListener('mouseleave', () => {
                link.style.color = '#6366f1';
            });
            link.addEventListener('click', () => {
                router.navigate(linkUrl);
            });
            header.appendChild(link);
        }

        return header;
    }

    _filterByType(product) {
        if (this._filterType === 'all') return true;
        return product.productType === this._filterType;
    }

    _formatNumber(num) {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
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

    _generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    // ============================================================
    // THEME
    // ============================================================

    _toggleTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
        localStorage.setItem('zymore_theme', isDark ? 'light' : 'dark');
        this._applyTheme();

        // Update theme button
        const btn = this._container?.querySelector('[aria-label="Toggle theme"]');
        if (btn) {
            btn.textContent = isDark ? '🌙' : '☀️';
        }
    }

    _applyTheme() {
        if (!this._container) return;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        this._container.style.color = isDark ? '#f3f4f6' : '#1a1a2e';
        this._container.style.background = isDark ? '#1a1a2e' : '#ffffff';
    }

    // ============================================================
    // EVENT HANDLERS
    // ============================================================

    _handleProductClick(productId) {
        analyticsService.trackEvent('home_product_click', { productId });
        router.navigate(`/product/${productId}`);
    }

    _handleCategoryClick(categoryId) {
        analyticsService.trackEvent('home_category_click', { categoryId });
        router.navigate(`/explore?category=${categoryId}`);
    }

    _handleSearch(query) {
        if (!query?.trim()) return;
        analyticsService.trackEvent('home_search', { query });
        router.navigate(`/explore?search=${encodeURIComponent(query.trim())}`);
    }

    _handleTabChange(tabId) {
        this._activeTab = tabId;
        analyticsService.trackEvent('home_tab_change', { tab: tabId });

        // Update tab styles
        const tabs = this._tabContainer?.querySelectorAll('.home-tab');
        tabs?.forEach(tab => {
            const isActive = tab.dataset.tab === tabId;
            tab.style.background = isActive ? '#6366f1' : 'transparent';
            tab.style.color = isActive ? '#ffffff' : 'var(--text-secondary, #6b7280)';
            tab.style.fontWeight = isActive ? '600' : '500';
        });

        // Refresh products
        this._page = 1;
        this._allFiltered = null;
        this._hasMore = true;
        this._loadProducts(this._grid);
    }

    _handleFilterChange(filterType) {
        this._filterType = filterType;
        this._page = 1;
        this._allFiltered = null;
        this._hasMore = true;
        this._loadProducts(this._grid);
    }

    _handleStoryClick(storyId) {
        analyticsService.trackEvent('home_story_click', { storyId });
        router.navigate(`/story/${storyId}`);
    }

    _handlePostClick(postId) {
        analyticsService.trackEvent('home_post_click', { postId });
        router.navigate(`/post/${postId}`);
    }

    _handleFollowClick(userId) {
        analyticsService.trackEvent('home_follow_click', { userId });
        eventBus.emit(EVENTS.FOLLOW_TOGGLE, { userId });
    }

    _handleContactClick(userId, productId) {
        analyticsService.trackEvent('home_contact_click', { userId, productId });
        router.navigate(`/chat?userId=${userId}&productId=${productId}`);
    }

    // ============================================================
    // STORE SUBSCRIPTIONS
    // ============================================================

    _setupSubscriptions() {
        this._subscribers.push(
            subscribe((state) => {
                this._handleThemeChange();
            }, ['ui.theme'])
        );

        this._subscribers.push(
            subscribe((state) => {
                this._handleCoinsUpdate();
            }, ['user.profile.coins'])
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

        this._subscribers.push(
            subscribe((state) => {
                this._handleStoriesUpdate();
            }, ['social.stories'])
        );

        this._subscribers.push(
            subscribe((state) => {
                this._handleFeedUpdate();
            }, ['social.feed'])
        );

        this._subscribers.push(
            subscribe((state) => {
                this._handleAuthChange();
            }, ['auth.isAuthenticated'])
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
            eventBus.on(EVENTS.USER_COINS_UPDATED, this._handleCoinsUpdate)
        );
    }

    // ============================================================
    // STATE HANDLERS
    // ============================================================

    _handleThemeChange() {
        this._applyTheme();
        // Update theme button
        const btn = this._container?.querySelector('[aria-label="Toggle theme"]');
        if (btn) {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            btn.textContent = isDark ? '☀️' : '🌙';
        }
    }

    _handleAuthChange() {
        this._updateHeader();
        this._renderStories();
        this._renderSocialFeed();
    }

    _handleCoinsUpdate() {
        const coinDisplay = this._container?.querySelector(`#coins-${this._id}`);
        if (coinDisplay) {
            const user = getState('user.profile');
            coinDisplay.textContent = `🪙 ${user?.coins || 0}`;
        }
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
        this._renderCategories();
    }

    _handleStoriesUpdate() {
        this._renderStories();
    }

    _handleFeedUpdate() {
        this._renderSocialFeed();
    }

    // ============================================================
    // RENDER HELPERS
    // ============================================================

    _updateHeader() {
        const greeting = this._container?.querySelector('.home-greeting');
        if (greeting) {
            const user = getState('user.profile');
            const name = user?.displayName || 'Guest';
            const title = greeting.querySelector('h1');
            if (title) title.textContent = `Hello, ${name}!`;
        }
    }

    _renderStories() {
        const container = this._container?.querySelector(`#stories-${this._id}`);
        if (!container) return;

        const stories = getState('social.stories') || [];
        if (stories.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        const scrollContainer = container.querySelector('.story-scroll-container');
        if (!scrollContainer) return;

        // Rebuild stories
        const displayStories = stories.slice(0, this.config.storiesLimit);
        // ... rebuild logic (similar to _buildStoriesBar)
    }

    _renderSocialFeed() {
        const container = this._container?.querySelector(`#social-${this._id}`);
        if (!container) return;

        const posts = getState('social.feed') || [];
        if (posts.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        const feedContainer = container.querySelector('.social-feed-container');
        if (!feedContainer) return;

        // Rebuild feed
        const displayPosts = posts.slice(0, this.config.socialFeedLimit);
        // ... rebuild logic (similar to _buildSocialFeed)
    }

    _renderCategories() {
        const grid = this._container?.querySelector(`#category-grid-${this._id}`);
        if (!grid) return;

        const categories = getState('categories.items') || [];
        const displayCategories = categories.slice(0, 8);

        grid.innerHTML = '';
        displayCategories.forEach(category => {
            const card = this._createCategoryCard(category);
            grid.appendChild(card);
        });
    }

    // ============================================================
    // PUBLIC METHODS
    // ============================================================

    refresh() {
        this._page = 1;
        this._allFiltered = null;
        this._hasMore = true;
        if (this._grid) {
            this._loadProducts(this._grid);
        }
        this._renderCategories();
        this._renderStories();
        this._renderSocialFeed();
        return this;
    }

    setFilter(filterType) {
        this._filterType = filterType;
        if (this._filterSelect) {
            this._filterSelect.value = filterType;
        }
        this._page = 1;
        this._allFiltered = null;
        this._hasMore = true;
        if (this._grid) {
            this._loadProducts(this._grid);
        }
        return this;
    }

    setSearch(query) {
        this._searchQuery = query;
        if (this._searchInput) {
            this._searchInput.value = query;
        }
        this._page = 1;
        this._allFiltered = null;
        this._hasMore = true;
        if (this._grid) {
            this._loadProducts(this._grid);
        }
        return this;
    }

    applyTheme() {
        this._applyTheme();
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

        // Remove from DOM
        if (this._container && this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }

        this._container = null;
        this._components = [];

        logger.info('🏠 HomeScreen destroyed', { id: this._id });
    }
}

// ============================================================
// EXPORT
// ============================================================

export default HomeScreen;

// ============================================================
// GLOBAL EXPOSURE
// ============================================================

if (typeof window !== 'undefined') {
    window.HomeScreen = HomeScreen;
}

// ============================================================
// END OF FILE: home-screen.js
// ============================================================