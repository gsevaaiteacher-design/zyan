// ============================================================
// FILE: js/screens/profile-screen.js
// PURPOSE: User Profile - Complete Profile Management
// DEPENDENCIES: auth-service.js, store.js, user-model.js
// ROUTE: /profile/:userId?
// VERSION: 4.0.0 - FULL PRODUCTION
// ============================================================

import { store, getState, setState, subscribe } from '../store.js';
import { eventBus, EVENTS } from '../state/event-bus.js';
import { router, ROUTES } from '../router.js';
import { logger } from '../services/logger.js';
import { analyticsService } from '../services/analytics-service.js';
import { authService } from '../services/auth-service.js';
import { databaseService } from '../services/database-service.js';
import { storageService } from '../services/storage-service.js';
import { ToastNotification } from '../widgets/toast-notification.js';
import { Modal } from '../widgets/modal.js';
import { LoadingSpinner } from '../widgets/loading-spinner.js';

// ============================================================
// PROFILE SCREEN CLASS
// ============================================================

export class ProfileScreen {
    constructor(options = {}) {
        // ==========================================
        // CONFIGURATION
        // ==========================================
        this.config = {
            maxBioLength: 200,
            maxDisplayNameLength: 30,
            enableEdit: true,
            enableFollow: true,
            enableProductsTab: true,
            enablePostsTab: true,
            enableReviewsTab: true,
            productsPerPage: 12,
            postsPerPage: 10,
            ...options
        };

        // ==========================================
        // STATE
        // ==========================================
        this._id = this._generateId('profile');
        this._isDestroyed = false;
        this._isRendered = false;
        this._container = null;
        this._subscribers = [];
        this._eventListeners = [];
        this._isLoading = false;
        this._isOwnProfile = false;
        this._isFollowing = false;
        this._activeTab = 'products'; // 'products' | 'posts' | 'reviews'
        this._profileUserId = null;
        this._profileData = null;
        this._userProducts = [];
        this._userPosts = [];
        this._userReviews = [];
        this._isEditMode = false;
        this._editFormData = {
            displayName: '',
            bio: '',
            location: '',
            website: '',
            socialLinks: {
                instagram: '',
                twitter: '',
                youtube: ''
            }
        };

        // ==========================================
        // BIND METHODS
        // ==========================================
        this._handleTabChange = this._handleTabChange.bind(this);
        this._handleFollow = this._handleFollow.bind(this);
        this._handleEdit = this._handleEdit.bind(this);
        this._handleSaveProfile = this._handleSaveProfile.bind(this);
        this._handleCancelEdit = this._handleCancelEdit.bind(this);
        this._handleAvatarUpload = this._handleAvatarUpload.bind(this);
        this._handleProductClick = this._handleProductClick.bind(this);
        this._handlePostClick = this._handlePostClick.bind(this);
        this._handleThemeChange = this._handleThemeChange.bind(this);
        this._handleAuthChange = this._handleAuthChange.bind(this);
        this._handleProfileUpdate = this._handleProfileUpdate.bind(this);

        // ==========================================
        // SETUP
        // ==========================================
        this._setupSubscriptions();
        this._setupEventListeners();

        // Get user ID from URL
        const path = window.location.pathname;
        const match = path.match(/\/profile\/(.+)/);
        this._profileUserId = match ? match[1] : null;

        logger.info('👤 ProfileScreen initialized', { 
            id: this._id, 
            userId: this._profileUserId 
        });
    }

    // ============================================================
    // RENDER
    // ============================================================

    render() {
        if (this._isDestroyed) {
            logger.warn('⚠️ ProfileScreen destroyed, cannot render');
            return null;
        }

        if (this._isRendered) {
            return this._container;
        }

        logger.info('👤 Rendering ProfileScreen...');

        // Determine if own profile
        const currentUser = getState('auth.user');
        this._isOwnProfile = !this._profileUserId || 
            (currentUser && this._profileUserId === currentUser.uid);

        // If own profile and no userId, use current user
        if (this._isOwnProfile && !this._profileUserId && currentUser) {
            this._profileUserId = currentUser.uid;
        }

        // Create container
        this._container = this._createContainer();

        // Load profile
        this._loadProfile();

        // Build skeleton
        this._buildSkeleton();

        // Apply theme
        this._applyTheme();

        // Track view
        analyticsService.trackPageView('profile', { 
            userId: this._profileUserId,
            isOwn: this._isOwnProfile 
        });

        this._isRendered = true;
        logger.info('✅ ProfileScreen rendered');

        return this._container;
    }

    // ============================================================
    // CONTAINER
    // ============================================================

    _createContainer() {
        const container = document.createElement('div');
        container.className = 'profile-screen';
        container.id = `profile-screen-${this._id}`;
        container.style.cssText = `
            max-width: 1000px;
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
    // LOAD PROFILE
    // ============================================================

    async _loadProfile() {
        try {
            this._isLoading = true;
            this._showLoader();

            const userId = this._profileUserId;
            if (!userId) {
                throw new Error('User ID not found');
            }

            // Get user data
            let userData = await databaseService.getDocument('users', userId);

            if (!userData) {
                throw new Error('User not found');
            }

            this._profileData = userData;

            // Check if following
            const currentUser = getState('auth.user');
            if (currentUser && currentUser.uid !== userId) {
                const follows = await databaseService.getCollection('follows', [
                    { field: 'followerId', operator: '==', value: currentUser.uid },
                    { field: 'followingId', operator: '==', value: userId }
                ]);
                this._isFollowing = follows.length > 0;
            }

            // Load user products
            await this._loadUserProducts(userId);

            // Load user posts
            await this._loadUserPosts(userId);

            // Load user reviews
            await this._loadUserReviews(userId);

            // Render profile
            this._renderProfile();

            this._isLoading = false;

        } catch (error) {
            logger.error('❌ Failed to load profile:', error);
            this._showError(error.message || 'Failed to load profile');
            this._isLoading = false;
        }
    }

    async _loadUserProducts(userId) {
        try {
            const products = await databaseService.getCollection('products', [
                { field: 'sellerId', operator: '==', value: userId },
                { field: 'isActive', operator: '==', value: true }
            ], { 
                orderBy: 'createdAt', 
                orderDirection: 'desc',
                limit: this.config.productsPerPage 
            });
            this._userProducts = products;
        } catch (error) {
            logger.error('❌ Failed to load user products:', error);
            this._userProducts = [];
        }
    }

    async _loadUserPosts(userId) {
        try {
            const posts = await databaseService.getCollection('posts', [
                { field: 'userId', operator: '==', value: userId }
            ], { 
                orderBy: 'createdAt', 
                orderDirection: 'desc',
                limit: this.config.postsPerPage 
            });
            this._userPosts = posts;
        } catch (error) {
            logger.error('❌ Failed to load user posts:', error);
            this._userPosts = [];
        }
    }

    async _loadUserReviews(userId) {
        try {
            const reviews = await databaseService.getCollection('reviews', [
                { field: 'userId', operator: '==', value: userId },
                { field: 'isVisible', operator: '==', value: true }
            ], { 
                orderBy: 'createdAt', 
                orderDirection: 'desc',
                limit: 10 
            });
            this._userReviews = reviews;
        } catch (error) {
            logger.error('❌ Failed to load user reviews:', error);
            this._userReviews = [];
        }
    }

    // ============================================================
    // SKELETON
    // ============================================================

    _buildSkeleton() {
        const skeleton = document.createElement('div');
        skeleton.className = 'profile-skeleton';
        skeleton.id = `profile-skeleton-${this._id}`;
        skeleton.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 20px;
        `;

        // Avatar skeleton
        const avatarSkeleton = document.createElement('div');
        avatarSkeleton.style.cssText = `
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            margin: 0 auto;
        `;

        // Name skeleton
        const nameSkeleton = document.createElement('div');
        nameSkeleton.style.cssText = `
            width: 200px;
            height: 28px;
            border-radius: 8px;
            background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            margin: 8px auto;
        `;

        // Bio skeleton
        const bioSkeleton = document.createElement('div');
        bioSkeleton.style.cssText = `
            width: 300px;
            height: 16px;
            border-radius: 8px;
            background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            margin: 0 auto;
        `;

        // Stats skeleton
        const statsSkeleton = document.createElement('div');
        statsSkeleton.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 40px;
            padding: 16px;
        `;
        for (let i = 0; i < 3; i++) {
            const stat = document.createElement('div');
            stat.style.cssText = `
                width: 60px;
                height: 40px;
                border-radius: 8px;
                background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
            `;
            statsSkeleton.appendChild(stat);
        }

        // Tabs skeleton
        const tabsSkeleton = document.createElement('div');
        tabsSkeleton.style.cssText = `
            display: flex;
            gap: 8px;
            justify-content: center;
            padding: 8px 0;
        `;
        for (let i = 0; i < 3; i++) {
            const tab = document.createElement('div');
            tab.style.cssText = `
                width: 100px;
                height: 40px;
                border-radius: 8px;
                background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
            `;
            tabsSkeleton.appendChild(tab);
        }

        // Grid skeleton
        const gridSkeleton = document.createElement('div');
        gridSkeleton.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 16px;
        `;
        for (let i = 0; i < 6; i++) {
            const card = document.createElement('div');
            card.style.cssText = `
                height: 200px;
                border-radius: 12px;
                background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
            `;
            gridSkeleton.appendChild(card);
        }

        skeleton.appendChild(avatarSkeleton);
        skeleton.appendChild(nameSkeleton);
        skeleton.appendChild(bioSkeleton);
        skeleton.appendChild(statsSkeleton);
        skeleton.appendChild(tabsSkeleton);
        skeleton.appendChild(gridSkeleton);

        // Add shimmer animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
        document.head.appendChild(style);

        this._container.appendChild(skeleton);
        this._skeleton = skeleton;
    }

    // ============================================================
    // RENDER PROFILE
    // ============================================================

    _renderProfile() {
        if (!this._profileData) return;

        // Remove skeleton
        if (this._skeleton) {
            this._skeleton.remove();
            this._skeleton = null;
        }

        const user = this._profileData;

        // --- Profile Header ---
        const header = document.createElement('div');
        header.className = 'profile-header';
        header.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px 0 16px;
            border-bottom: 1px solid var(--border-color, rgba(0,0,0,0.06));
            margin-bottom: 20px;
            position: relative;
        `;

        // Avatar
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'profile-avatar-container';
        avatarContainer.style.cssText = `
            position: relative;
            width: 120px;
            height: 120px;
            margin-bottom: 12px;
        `;

        const avatar = document.createElement('img');
        avatar.src = user.photoURL || 'https://placehold.co/120x120/6366f1/ffffff?text=👤';
        avatar.alt = user.displayName || 'User';
        avatar.className = 'profile-avatar';
        avatar.style.cssText = `
            width: 120px;
            height: 120px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid #6366f1;
        `;

        avatarContainer.appendChild(avatar);

        // Upload avatar button (own profile)
        if (this._isOwnProfile && this.config.enableEdit) {
            const uploadBtn = document.createElement('button');
            uploadBtn.className = 'profile-avatar-upload';
            uploadBtn.textContent = '📷';
            uploadBtn.setAttribute('aria-label', 'Change avatar');
            uploadBtn.style.cssText = `
                position: absolute;
                bottom: 4px;
                right: 4px;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: 2px solid var(--bg-primary, #fff);
                background: #6366f1;
                color: #fff;
                font-size: 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            `;
            uploadBtn.addEventListener('mouseenter', () => {
                uploadBtn.style.transform = 'scale(1.1)';
            });
            uploadBtn.addEventListener('mouseleave', () => {
                uploadBtn.style.transform = 'scale(1)';
            });
            uploadBtn.addEventListener('click', this._handleAvatarUpload);
            avatarContainer.appendChild(uploadBtn);
        }

        header.appendChild(avatarContainer);

        // Name
        const name = document.createElement('h1');
        name.textContent = user.displayName || 'User';
        name.className = 'profile-name';
        name.style.cssText = `
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            color: var(--text-primary, #1a1a2e);
        `;

        // Username/Email
        const email = document.createElement('p');
        email.textContent = user.email || '';
        email.className = 'profile-email';
        email.style.cssText = `
            margin: 2px 0 0;
            font-size: 14px;
            color: var(--text-secondary, #6b7280);
        `;

        // Bio
        const bio = document.createElement('p');
        bio.textContent = user.bio || 'No bio yet';
        bio.className = 'profile-bio';
        bio.style.cssText = `
            margin: 8px 0 0;
            font-size: 15px;
            color: var(--text-primary, #374151);
            text-align: center;
            max-width: 500px;
            line-height: 1.5;
        `;

        // Location
        if (user.location) {
            const location = document.createElement('p');
            location.textContent = `📍 ${user.location}`;
            location.className = 'profile-location';
            location.style.cssText = `
                margin: 4px 0 0;
                font-size: 14px;
                color: var(--text-secondary, #6b7280);
            `;
            header.appendChild(location);
        }

        // Badges
        const badges = document.createElement('div');
        badges.className = 'profile-badges';
        badges.style.cssText = `
            display: flex;
            gap: 8px;
            margin-top: 8px;
            flex-wrap: wrap;
            justify-content: center;
        `;

        if (user.isSeller) {
            const badge = document.createElement('span');
            badge.textContent = '🛍️ Seller';
            badge.style.cssText = `
                padding: 2px 10px;
                border-radius: 12px;
                background: #6366f1;
                color: #fff;
                font-size: 12px;
                font-weight: 500;
            `;
            badges.appendChild(badge);
        }

        if (user.isVerified) {
            const badge = document.createElement('span');
            badge.textContent = '✅ Verified';
            badge.style.cssText = `
                padding: 2px 10px;
                border-radius: 12px;
                background: #22c55e;
                color: #fff;
                font-size: 12px;
                font-weight: 500;
            `;
            badges.appendChild(badge);
        }

        if (user.isAdmin) {
            const badge = document.createElement('span');
            badge.textContent = '👑 Admin';
            badge.style.cssText = `
                padding: 2px 10px;
                border-radius: 12px;
                background: #f59e0b;
                color: #fff;
                font-size: 12px;
                font-weight: 500;
            `;
            badges.appendChild(badge);
        }

        header.appendChild(name);
        header.appendChild(email);
        header.appendChild(bio);
        header.appendChild(badges);

        // --- Actions ---
        const actions = document.createElement('div');
        actions.className = 'profile-actions';
        actions.style.cssText = `
            display: flex;
            gap: 8px;
            margin-top: 12px;
            flex-wrap: wrap;
            justify-content: center;
        `;

        // Follow button
        if (!this._isOwnProfile && this.config.enableFollow) {
            const followBtn = document.createElement('button');
            followBtn.className = 'profile-follow-btn';
            followBtn.textContent = this._isFollowing ? '✅ Following' : '➕ Follow';
            followBtn.style.cssText = `
                padding: 8px 24px;
                border: none;
                border-radius: 8px;
                background: ${this._isFollowing ? 'rgba(99,102,241,0.1)' : '#6366f1'};
                color: ${this._isFollowing ? '#6366f1' : '#fff'};
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            followBtn.addEventListener('mouseenter', () => {
                if (!this._isFollowing) {
                    followBtn.style.background = '#4f46e5';
                    followBtn.style.transform = 'translateY(-2px)';
                }
            });
            followBtn.addEventListener('mouseleave', () => {
                if (!this._isFollowing) {
                    followBtn.style.background = '#6366f1';
                    followBtn.style.transform = 'translateY(0)';
                }
            });
            followBtn.addEventListener('click', this._handleFollow);
            actions.appendChild(followBtn);
            this._followBtn = followBtn;

            // Message button
            const msgBtn = document.createElement('button');
            msgBtn.textContent = '💬 Message';
            msgBtn.style.cssText = `
                padding: 8px 20px;
                border: 1px solid var(--border-color, #e5e7eb);
                border-radius: 8px;
                background: transparent;
                color: var(--text-primary, #1a1a2e);
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            msgBtn.addEventListener('mouseenter', () => {
                msgBtn.style.background = 'rgba(0,0,0,0.05)';
            });
            msgBtn.addEventListener('mouseleave', () => {
                msgBtn.style.background = 'transparent';
            });
            msgBtn.addEventListener('click', () => {
                router.navigate(`/chat?userId=${this._profileUserId}`);
            });
            actions.appendChild(msgBtn);
        }

        // Edit button (own profile)
        if (this._isOwnProfile && this.config.enableEdit) {
            const editBtn = document.createElement('button');
            editBtn.className = 'profile-edit-btn';
            editBtn.textContent = '✏️ Edit Profile';
            editBtn.style.cssText = `
                padding: 8px 20px;
                border: 1px solid var(--border-color, #e5e7eb);
                border-radius: 8px;
                background: transparent;
                color: var(--text-primary, #1a1a2e);
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            editBtn.addEventListener('mouseenter', () => {
                editBtn.style.background = 'rgba(0,0,0,0.05)';
                editBtn.style.borderColor = '#6366f1';
            });
            editBtn.addEventListener('mouseleave', () => {
                editBtn.style.background = 'transparent';
                editBtn.style.borderColor = 'var(--border-color, #e5e7eb)';
            });
            editBtn.addEventListener('click', this._handleEdit);
            actions.appendChild(editBtn);

            // Settings button
            const settingsBtn = document.createElement('button');
            settingsBtn.textContent = '⚙️ Settings';
            settingsBtn.style.cssText = `
                padding: 8px 20px;
                border: none;
                border-radius: 8px;
                background: transparent;
                color: var(--text-secondary, #6b7280);
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            settingsBtn.addEventListener('mouseenter', () => {
                settingsBtn.style.background = 'rgba(0,0,0,0.05)';
            });
            settingsBtn.addEventListener('mouseleave', () => {
                settingsBtn.style.background = 'transparent';
            });
            settingsBtn.addEventListener('click', () => {
                router.navigate(ROUTES.SETTINGS);
            });
            actions.appendChild(settingsBtn);
        }

        header.appendChild(actions);

        // --- Stats ---
        const stats = document.createElement('div');
        stats.className = 'profile-stats';
        stats.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 40px;
            padding: 16px 0;
            border-top: 1px solid var(--border-color, rgba(0,0,0,0.06));
            border-bottom: 1px solid var(--border-color, rgba(0,0,0,0.06));
            margin-top: 8px;
            width: 100%;
        `;

        const statItems = [
            { label: 'Products', value: user.totalProducts || this._userProducts.length || 0 },
            { label: 'Followers', value: user.followers || 0 },
            { label: 'Following', value: user.following || 0 },
            { label: 'Posts', value: user.totalPosts || this._userPosts.length || 0 },
            { label: 'Reviews', value: this._userReviews.length || 0 },
            { label: 'Coins', value: user.coins || 0 }
        ];

        statItems.forEach(item => {
            const stat = document.createElement('div');
            stat.className = 'profile-stat';
            stat.style.cssText = `
                text-align: center;
            `;

            const value = document.createElement('div');
            value.textContent = item.value;
            value.className = 'profile-stat-value';
            value.style.cssText = `
                font-size: 20px;
                font-weight: 700;
                color: var(--text-primary, #1a1a2e);
            `;

            const label = document.createElement('div');
            label.textContent = item.label;
            label.className = 'profile-stat-label';
            label.style.cssText = `
                font-size: 12px;
                color: var(--text-secondary, #6b7280);
                margin-top: 2px;
            `;

            stat.appendChild(value);
            stat.appendChild(label);
            stats.appendChild(stat);
        });

        header.appendChild(stats);

        this._container.appendChild(header);
        this._headerEl = header;

        // --- Tabs ---
        this._buildTabs();

        // --- Tab Content ---
        this._buildTabContent();

        // --- Edit Form (hidden) ---
        if (this._isOwnProfile) {
            this._buildEditForm();
        }
    }

    // ============================================================
    // TABS
    // ============================================================

    _buildTabs() {
        const tabs = [
            { id: 'products', label: '📦 Products', count: this._userProducts.length },
            { id: 'posts', label: '📝 Posts', count: this._userPosts.length },
            { id: 'reviews', label: '⭐ Reviews', count: this._userReviews.length }
        ];

        const container = document.createElement('div');
        container.className = 'profile-tabs';
        container.style.cssText = `
            display: flex;
            gap: 4px;
            margin: 16px 0 20px;
            padding: 4px;
            background: var(--bg-secondary, rgba(0,0,0,0.05));
            border-radius: 12px;
            overflow-x: auto;
            scrollbar-width: none;
        `;

        tabs.forEach(tab => {
            const btn = document.createElement('button');
            btn.className = 'profile-tab';
            btn.dataset.tab = tab.id;
            btn.textContent = `${tab.label} (${tab.count})`;
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
    // TAB CONTENT
    // ============================================================

    _buildTabContent() {
        const container = document.createElement('div');
        container.className = 'profile-tab-content';
        container.id = `profile-tab-content-${this._id}`;

        // Products Tab
        const productsContainer = document.createElement('div');
        productsContainer.className = 'profile-products-tab';
        productsContainer.id = 'profile-products-tab';
        productsContainer.style.cssText = `
            display: ${this._activeTab === 'products' ? 'block' : 'none'};
        `;

        if (this._userProducts.length === 0) {
            productsContainer.innerHTML = `
                <div style="text-align:center;padding:60px 20px;color:var(--text-secondary,#6b7280);">
                    <div style="font-size:48px;margin-bottom:16px;">📦</div>
                    <h3 style="margin:0;color:var(--text-primary,#1a1a2e);">No Products</h3>
                    <p style="margin:8px 0 0;">${this._isOwnProfile ? 'Start selling by uploading a product!' : 'This user has no products yet'}</p>
                    ${this._isOwnProfile ? `<button onclick="window.Router?.navigate('/upload')" style="margin-top:16px;padding:10px 24px;border:none;border-radius:8px;background:#6366f1;color:#fff;font-size:14px;font-weight:500;cursor:pointer;">Upload Product</button>` : ''}
                </div>
            `;
        } else {
            const grid = document.createElement('div');
            grid.className = 'profile-products-grid';
            grid.style.cssText = `
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 16px;
            `;

            this._userProducts.forEach(product => {
                const card = this._createProductCard(product);
                grid.appendChild(card);
            });

            productsContainer.appendChild(grid);
        }

        // Posts Tab
        const postsContainer = document.createElement('div');
        postsContainer.className = 'profile-posts-tab';
        postsContainer.id = 'profile-posts-tab';
        postsContainer.style.cssText = `
            display: ${this._activeTab === 'posts' ? 'block' : 'none'};
        `;

        if (this._userPosts.length === 0) {
            postsContainer.innerHTML = `
                <div style="text-align:center;padding:60px 20px;color:var(--text-secondary,#6b7280);">
                    <div style="font-size:48px;margin-bottom:16px;">📝</div>
                    <h3 style="margin:0;color:var(--text-primary,#1a1a2e);">No Posts</h3>
                    <p style="margin:8px 0 0;">${this._isOwnProfile ? 'Share your thoughts with the community!' : 'This user has no posts yet'}</p>
                    ${this._isOwnProfile ? `<button onclick="window.Router?.navigate('/create-post')" style="margin-top:16px;padding:10px 24px;border:none;border-radius:8px;background:#6366f1;color:#fff;font-size:14px;font-weight:500;cursor:pointer;">Create Post</button>` : ''}
                </div>
            `;
        } else {
            const list = document.createElement('div');
            list.className = 'profile-posts-list';
            list.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 16px;
            `;

            this._userPosts.forEach(post => {
                const postEl = this._createPostCard(post);
                list.appendChild(postEl);
            });

            postsContainer.appendChild(list);
        }

        // Reviews Tab
        const reviewsContainer = document.createElement('div');
        reviewsContainer.className = 'profile-reviews-tab';
        reviewsContainer.id = 'profile-reviews-tab';
        reviewsContainer.style.cssText = `
            display: ${this._activeTab === 'reviews' ? 'block' : 'none'};
        `;

        if (this._userReviews.length === 0) {
            reviewsContainer.innerHTML = `
                <div style="text-align:center;padding:60px 20px;color:var(--text-secondary,#6b7280);">
                    <div style="font-size:48px;margin-bottom:16px;">⭐</div>
                    <h3 style="margin:0;color:var(--text-primary,#1a1a2e);">No Reviews</h3>
                    <p style="margin:8px 0 0;">${this._isOwnProfile ? 'Start reviewing products you\'ve downloaded!' : 'This user has no reviews yet'}</p>
                </div>
            `;
        } else {
            const list = document.createElement('div');
            list.className = 'profile-reviews-list';
            list.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 12px;
            `;

            this._userReviews.forEach(review => {
                const reviewEl = this._createReviewCard(review);
                list.appendChild(reviewEl);
            });

            reviewsContainer.appendChild(list);
        }

        container.appendChild(productsContainer);
        container.appendChild(postsContainer);
        container.appendChild(reviewsContainer);

        this._container.appendChild(container);
        this._tabContentContainer = container;
        this._productsContainer = productsContainer;
        this._postsContainer = postsContainer;
        this._reviewsContainer = reviewsContainer;
    }

    // ============================================================
    // CARDS
    // ============================================================

    _createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'profile-product-card';
        card.style.cssText = `
            padding: 12px;
            border-radius: 10px;
            background: var(--bg-primary, #fff);
            border: 1px solid var(--border-color, #e5e7eb);
            cursor: pointer;
            transition: all 0.3s ease;
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
        img.src = product.thumbnail || product.images?.[0] || 'https://placehold.co/200x150/6366f1/ffffff?text=Product';
        img.alt = product.title || 'Product';
        img.style.cssText = `
            width: 100%;
            height: 120px;
            object-fit: cover;
            border-radius: 6px;
            margin-bottom: 8px;
        `;

        const title = document.createElement('div');
        title.textContent = product.title || 'Product';
        title.style.cssText = `
            font-size: 14px;
            font-weight: 600;
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
                margin-top: 2px;
            `;
        } else if (product.price) {
            price.textContent = `$${product.price}`;
            price.style.cssText = `
                font-size: 13px;
                font-weight: 600;
                color: var(--text-primary, #1a1a2e);
                margin-top: 2px;
            `;
        }

        const rating = document.createElement('div');
        rating.textContent = `⭐ ${product.rating?.toFixed(1) || 0}`;
        rating.style.cssText = `
            font-size: 12px;
            color: var(--text-secondary, #6b7280);
            margin-top: 2px;
        `;

        card.appendChild(img);
        card.appendChild(title);
        card.appendChild(price);
        card.appendChild(rating);

        card.addEventListener('click', () => {
            this._handleProductClick(product.id);
        });

        return card;
    }

    _createPostCard(post) {
        const card = document.createElement('div');
        card.className = 'profile-post-card';
        card.style.cssText = `
            padding: 16px;
            border-radius: 10px;
            background: var(--bg-primary, #fff);
            border: 1px solid var(--border-color, #e5e7eb);
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-2px)';
            card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'none';
        });

        const content = document.createElement('p');
        content.textContent = post.content || '';
        content.style.cssText = `
            margin: 0;
            font-size: 14px;
            color: var(--text-primary, #374151);
            line-height: 1.5;
        `;

        const stats = document.createElement('div');
        stats.style.cssText = `
            display: flex;
            gap: 16px;
            margin-top: 8px;
            font-size: 12px;
            color: var(--text-secondary, #6b7280);
        `;

        const likes = document.createElement('span');
        likes.textContent = `❤️ ${post.likes || 0}`;

        const comments = document.createElement('span');
        comments.textContent = `💬 ${post.comments || 0}`;

        const time = document.createElement('span');
        time.textContent = this._getTimeAgo(post.createdAt);

        stats.appendChild(likes);
        stats.appendChild(comments);
        stats.appendChild(time);

        card.appendChild(content);
        card.appendChild(stats);

        card.addEventListener('click', () => {
            this._handlePostClick(post.id);
        });

        return card;
    }

    _createReviewCard(review) {
        const card = document.createElement('div');
        card.className = 'profile-review-card';
        card.style.cssText = `
            padding: 12px 16px;
            border-radius: 10px;
            background: var(--bg-primary, #fff);
            border: 1px solid var(--border-color, #e5e7eb);
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
        `;

        const rating = document.createElement('span');
        rating.textContent = '⭐'.repeat(Math.round(review.rating || 0)) + '☆'.repeat(5 - Math.round(review.rating || 0));
        rating.style.fontSize = '14px';

        const time = document.createElement('span');
        time.textContent = this._getTimeAgo(review.createdAt);
        time.style.cssText = `
            font-size: 12px;
            color: var(--text-secondary, #6b7280);
        `;

        header.appendChild(rating);
        header.appendChild(time);

        const comment = document.createElement('p');
        comment.textContent = review.comment || '';
        comment.style.cssText = `
            margin: 4px 0 0;
            font-size: 14px;
            color: var(--text-primary, #374151);
        `;

        const productLink = document.createElement('div');
        productLink.textContent = `📦 Product: ${review.productId || 'Unknown'}`;
        productLink.style.cssText = `
            font-size: 12px;
            color: var(--text-secondary, #6b7280);
            margin-top: 4px;
            cursor: pointer;
        `;
        productLink.addEventListener('click', () => {
            if (review.productId) {
                router.navigate(`/product/${review.productId}`);
            }
        });

        card.appendChild(header);
        card.appendChild(comment);
        card.appendChild(productLink);

        return card;
    }

    // ============================================================
    // EDIT FORM
    // ============================================================

    _buildEditForm() {
        const form = document.createElement('div');
        form.className = 'profile-edit-form';
        form.id = `profile-edit-form-${this._id}`;
        form.style.cssText = `
            display: none;
            padding: 20px;
            border-radius: 12px;
            background: var(--bg-secondary, #f9fafb);
            border: 1px solid var(--border-color, #e5e7eb);
            margin-bottom: 20px;
        `;

        // Title
        const title = document.createElement('h3');
        title.textContent = '✏️ Edit Profile';
        title.style.cssText = `
            margin: 0 0 16px;
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary, #1a1a2e);
        `;
        form.appendChild(title);

        // Display Name
        const nameGroup = this._createEditField('displayName', 'Display Name', 'text');
        const nameInput = nameGroup.querySelector('input');
        nameInput.value = this._profileData?.displayName || '';
        nameInput.maxLength = this.config.maxDisplayNameLength;
        nameInput.addEventListener('change', (e) => {
            this._editFormData.displayName = e.target.value;
        });
        form.appendChild(nameGroup);

        // Bio
        const bioGroup = this._createEditField('bio', 'Bio', 'textarea');
        const bioInput = bioGroup.querySelector('textarea');
        bioInput.value = this._profileData?.bio || '';
        bioInput.maxLength = this.config.maxBioLength;
        bioInput.addEventListener('change', (e) => {
            this._editFormData.bio = e.target.value;
        });
        form.appendChild(bioGroup);

        // Location
        const locationGroup = this._createEditField('location', 'Location', 'text');
        const locationInput = locationGroup.querySelector('input');
        locationInput.value = this._profileData?.location || '';
        locationInput.addEventListener('change', (e) => {
            this._editFormData.location = e.target.value;
        });
        form.appendChild(locationGroup);

        // Website
        const websiteGroup = this._createEditField('website', 'Website', 'url');
        const websiteInput = websiteGroup.querySelector('input');
        websiteInput.value = this._profileData?.website || '';
        websiteInput.addEventListener('change', (e) => {
            this._editFormData.website = e.target.value;
        });
        form.appendChild(websiteGroup);

        // Social Links
        const socialTitle = document.createElement('h4');
        socialTitle.textContent = '🔗 Social Links';
        socialTitle.style.cssText = `
            margin: 16px 0 8px;
            font-size: 15px;
            font-weight: 600;
            color: var(--text-primary, #1a1a2e);
        `;
        form.appendChild(socialTitle);

        const socialPlatforms = [
            { id: 'instagram', label: '📸 Instagram' },
            { id: 'twitter', label: '🐦 Twitter' },
            { id: 'youtube', label: '🎬 YouTube' }
        ];

        socialPlatforms.forEach(platform => {
            const group = this._createEditField(`social_${platform.id}`, platform.label, 'url');
            const input = group.querySelector('input');
            input.value = this._profileData?.socialLinks?.[platform.id] || '';
            input.addEventListener('change', (e) => {
                this._editFormData.socialLinks[platform.id] = e.target.value;
            });
            form.appendChild(group);
        });

        // Actions
        const actions = document.createElement('div');
        actions.style.cssText = `
            display: flex;
            gap: 12px;
            margin-top: 16px;
        `;

        const saveBtn = document.createElement('button');
        saveBtn.textContent = '💾 Save Changes';
        saveBtn.style.cssText = `
            flex: 2;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            background: #6366f1;
            color: #fff;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        saveBtn.addEventListener('mouseenter', () => {
            saveBtn.style.background = '#4f46e5';
        });
        saveBtn.addEventListener('mouseleave', () => {
            saveBtn.style.background = '#6366f1';
        });
        saveBtn.addEventListener('click', this._handleSaveProfile);

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = `
            flex: 1;
            padding: 12px 20px;
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: 8px;
            background: transparent;
            color: var(--text-secondary, #6b7280);
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.background = 'rgba(0,0,0,0.05)';
        });
        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.background = 'transparent';
        });
        cancelBtn.addEventListener('click', this._handleCancelEdit);

        actions.appendChild(saveBtn);
        actions.appendChild(cancelBtn);
        form.appendChild(actions);

        this._container.appendChild(form);
        this._editForm = form;
    }

    _createEditField(id, label, type) {
        const group = document.createElement('div');
        group.className = 'edit-field';
        group.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-bottom: 12px;
        `;

        const labelEl = document.createElement('label');
        labelEl.htmlFor = `edit-${id}`;
        labelEl.textContent = label;
        labelEl.style.cssText = `
            font-size: 13px;
            font-weight: 500;
            color: var(--text-primary, #1a1a2e);
        `;

        let input;

        if (type === 'textarea') {
            input = document.createElement('textarea');
            input.rows = 3;
            input.style.cssText = `
                width: 100%;
                padding: 8px 12px;
                border-radius: 6px;
                border: 1px solid var(--border-color, #e5e7eb);
                background: var(--bg-primary, #fff);
                color: var(--text-primary, #1f2937);
                font-size: 14px;
                outline: none;
                resize: vertical;
                font-family: inherit;
                box-sizing: border-box;
            `;
        } else {
            input = document.createElement('input');
            input.type = type;
            input.style.cssText = `
                width: 100%;
                padding: 8px 12px;
                border-radius: 6px;
                border: 1px solid var(--border-color, #e5e7eb);
                background: var(--bg-primary, #fff);
                color: var(--text-primary, #1f2937);
                font-size: 14px;
                outline: none;
                box-sizing: border-box;
            `;
        }

        input.id = `edit-${id}`;
        input.name = id;

        input.addEventListener('focus', () => {
            input.style.borderColor = '#6366f1';
            input.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
        });
        input.addEventListener('blur', () => {
            input.style.borderColor = 'var(--border-color, #e5e7eb)';
            input.style.boxShadow = 'none';
        });

        group.appendChild(labelEl);
        group.appendChild(input);

        return group;
    }

    // ============================================================
    // HANDLERS
    // ============================================================

    _handleTabChange(tabId) {
        this._activeTab = tabId;

        // Update tab styles
        const tabs = this._tabContainer?.querySelectorAll('.profile-tab');
        tabs?.forEach(tab => {
            const isActive = tab.dataset.tab === tabId;
            tab.style.background = isActive ? '#6366f1' : 'transparent';
            tab.style.color = isActive ? '#ffffff' : 'var(--text-secondary, #6b7280)';
            tab.style.fontWeight = isActive ? '600' : '500';
        });

        // Show/hide tab content
        const productsTab = this._container?.querySelector('#profile-products-tab');
        const postsTab = this._container?.querySelector('#profile-posts-tab');
        const reviewsTab = this._container?.querySelector('#profile-reviews-tab');

        if (productsTab) productsTab.style.display = tabId === 'products' ? 'block' : 'none';
        if (postsTab) postsTab.style.display = tabId === 'posts' ? 'block' : 'none';
        if (reviewsTab) reviewsTab.style.display = tabId === 'reviews' ? 'block' : 'none';

        analyticsService.trackEvent('profile_tab_change', { 
            tab: tabId,
            userId: this._profileUserId 
        });
    }

    async _handleFollow() {
        if (!this._profileUserId) return;

        const currentUser = getState('auth.user');
        if (!currentUser) {
            ToastNotification.show('Please login to follow', 'warning');
            router.navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
            return;
        }

        try {
            if (this._isFollowing) {
                // Unfollow
                const follows = await databaseService.getCollection('follows', [
                    { field: 'followerId', operator: '==', value: currentUser.uid },
                    { field: 'followingId', operator: '==', value: this._profileUserId }
                ]);
                if (follows.length > 0) {
                    await databaseService.deleteDocument('follows', follows[0].id);
                }
                this._isFollowing = false;
                this._profileData.followers = Math.max(0, (this._profileData.followers || 0) - 1);
                analyticsService.trackEvent('profile_unfollow', { 
                    userId: this._profileUserId 
                });
                ToastNotification.show('Unfollowed successfully', 'info');
            } else {
                // Follow
                await databaseService.addDocument('follows', {
                    followerId: currentUser.uid,
                    followingId: this._profileUserId,
                    createdAt: new Date().toISOString()
                });
                this._isFollowing = true;
                this._profileData.followers = (this._profileData.followers || 0) + 1;
                analyticsService.trackEvent('profile_follow', { 
                    userId: this._profileUserId 
                });
                ToastNotification.show('Followed successfully!', 'success');
            }

            // Update UI
            if (this._followBtn) {
                this._followBtn.textContent = this._isFollowing ? '✅ Following' : '➕ Follow';
                this._followBtn.style.background = this._isFollowing ? 'rgba(99,102,241,0.1)' : '#6366f1';
                this._followBtn.style.color = this._isFollowing ? '#6366f1' : '#fff';
            }

            // Update stats
            this._updateStats();

            // Update database
            await databaseService.updateDocument('users', this._profileUserId, {
                followers: this._profileData.followers
            });

            eventBus.emit(this._isFollowing ? EVENTS.FOLLOW_ADDED : EVENTS.FOLLOW_REMOVED, {
                userId: this._profileUserId,
                followerId: currentUser.uid
            });

        } catch (error) {
            logger.error('❌ Follow action failed:', error);
            ToastNotification.show('Failed to update follow status', 'error');
        }
    }

    _handleEdit() {
        if (this._isEditMode) return;

        this._isEditMode = true;

        // Fill form with current data
        const user = this._profileData;
        this._editFormData = {
            displayName: user.displayName || '',
            bio: user.bio || '',
            location: user.location || '',
            website: user.website || '',
            socialLinks: {
                instagram: user.socialLinks?.instagram || '',
                twitter: user.socialLinks?.twitter || '',
                youtube: user.socialLinks?.youtube || ''
            }
        };

        // Show form
        if (this._editForm) {
            this._editForm.style.display = 'block';
            // Fill inputs
            const inputs = this._editForm.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                const name = input.name;
                if (name === 'displayName') input.value = this._editFormData.displayName;
                else if (name === 'bio') input.value = this._editFormData.bio;
                else if (name === 'location') input.value = this._editFormData.location;
                else if (name === 'website') input.value = this._editFormData.website;
                else if (name === 'social_instagram') input.value = this._editFormData.socialLinks.instagram;
                else if (name === 'social_twitter') input.value = this._editFormData.socialLinks.twitter;
                else if (name === 'social_youtube') input.value = this._editFormData.socialLinks.youtube;
            });
        }

        // Hide edit button
        const editBtn = this._container?.querySelector('.profile-edit-btn');
        if (editBtn) editBtn.style.display = 'none';

        analyticsService.trackEvent('profile_edit_start', { userId: this._profileUserId });
    }

    async _handleSaveProfile() {
        try {
            this._isLoading = true;

            const updates = {
                displayName: this._editFormData.displayName || this._profileData.displayName,
                bio: this._editFormData.bio || '',
                location: this._editFormData.location || '',
                website: this._editFormData.website || '',
                socialLinks: {
                    instagram: this._editFormData.socialLinks.instagram || '',
                    twitter: this._editFormData.socialLinks.twitter || '',
                    youtube: this._editFormData.socialLinks.youtube || ''
                },
                updatedAt: new Date().toISOString()
            };

            await databaseService.updateDocument('users', this._profileUserId, updates);

            // Update local data
            Object.assign(this._profileData, updates);

            // Update store
            if (this._isOwnProfile) {
                const currentUser = getState('auth.user');
                if (currentUser) {
                    const updatedUser = { ...currentUser, ...updates };
                    setState('auth.user', updatedUser);
                    setState('user.profile', updatedUser);
                }
            }

            ToastNotification.show('Profile updated successfully! ✅', 'success');

            this._isEditMode = false;
            if (this._editForm) this._editForm.style.display = 'none';

            // Show edit button
            const editBtn = this._container?.querySelector('.profile-edit-btn');
            if (editBtn) editBtn.style.display = 'inline-block';

            // Refresh profile display
            this._refreshProfileDisplay();

            analyticsService.trackEvent('profile_edit_save', { userId: this._profileUserId });

        } catch (error) {
            logger.error('❌ Failed to save profile:', error);
            ToastNotification.show('Failed to save profile: ' + error.message, 'error');
        } finally {
            this._isLoading = false;
        }
    }

    _handleCancelEdit() {
        this._isEditMode = false;
        if (this._editForm) this._editForm.style.display = 'none';

        const editBtn = this._container?.querySelector('.profile-edit-btn');
        if (editBtn) editBtn.style.display = 'inline-block';

        analyticsService.trackEvent('profile_edit_cancel', { userId: this._profileUserId });
    }

    async _handleAvatarUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            // Validate
            if (!file.type.startsWith('image/')) {
                ToastNotification.show('Please select an image file', 'error');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                ToastNotification.show('Image too large. Max 5MB', 'error');
                return;
            }

            try {
                const url = await storageService.uploadProfileImage(file, this._profileUserId);

                // Update user
                await databaseService.updateDocument('users', this._profileUserId, {
                    photoURL: url
                });

                // Update local
                this._profileData.photoURL = url;

                // Update store
                if (this._isOwnProfile) {
                    const currentUser = getState('auth.user');
                    if (currentUser) {
                        const updatedUser = { ...currentUser, photoURL: url };
                        setState('auth.user', updatedUser);
                        setState('user.profile', updatedUser);
                    }
                }

                // Update UI
                const avatar = this._container?.querySelector('.profile-avatar');
                if (avatar) {
                    avatar.src = url;
                }

                ToastNotification.show('Avatar updated successfully! 📸', 'success');
                analyticsService.trackEvent('profile_avatar_upload', { userId: this._profileUserId });

            } catch (error) {
                logger.error('❌ Avatar upload failed:', error);
                ToastNotification.show('Failed to upload avatar: ' + error.message, 'error');
            }
        });
        input.click();
    }

    _handleProductClick(productId) {
        router.navigate(`/product/${productId}`);
    }

    _handlePostClick(postId) {
        router.navigate(`/post/${postId}`);
    }

    // ============================================================
    // UI HELPERS
    // ============================================================

    _refreshProfileDisplay() {
        const user = this._profileData;

        // Update name
        const nameEl = this._container?.querySelector('.profile-name');
        if (nameEl) nameEl.textContent = user.displayName || 'User';

        // Update bio
        const bioEl = this._container?.querySelector('.profile-bio');
        if (bioEl) bioEl.textContent = user.bio || 'No bio yet';

        // Update location
        let locationEl = this._container?.querySelector('.profile-location');
        if (user.location) {
            if (!locationEl) {
                locationEl = document.createElement('p');
                locationEl.className = 'profile-location';
                locationEl.style.cssText = `
                    margin: 4px 0 0;
                    font-size: 14px;
                    color: var(--text-secondary, #6b7280);
                `;
                const bioParent = this._container?.querySelector('.profile-bio');
                if (bioParent) {
                    bioParent.parentNode?.insertBefore(locationEl, bioParent.nextSibling);
                }
            }
            locationEl.textContent = `📍 ${user.location}`;
        } else if (locationEl) {
            locationEl.remove();
        }
    }

    _updateStats() {
        const stats = this._container?.querySelector('.profile-stats');
        if (!stats) return;

        const values = stats.querySelectorAll('.profile-stat-value');
        const user = this._profileData;

        if (values.length >= 6) {
            values[0].textContent = user.totalProducts || this._userProducts.length || 0;
            values[1].textContent = user.followers || 0;
            values[2].textContent = user.following || 0;
            values[3].textContent = user.totalPosts || this._userPosts.length || 0;
            values[4].textContent = this._userReviews.length || 0;
            values[5].textContent = user.coins || 0;
        }
    }

    _showLoader() {
        // Skeleton already showing
    }

    _showError(message) {
        if (this._skeleton) {
            this._skeleton.innerHTML = `
                <div style="text-align:center;padding:60px 20px;color:var(--text-secondary,#6b7280);">
                    <div style="font-size:48px;margin-bottom:16px;">😕</div>
                    <h3 style="margin:0;color:var(--text-primary,#1a1a2e);">${message}</h3>
                    <button onclick="window.location.reload()" style="margin-top:16px;padding:10px 24px;border:none;border-radius:8px;background:#6366f1;color:#fff;font-size:14px;font-weight:500;cursor:pointer;">
                        Retry
                    </button>
                </div>
            `;
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
                this._handleProfileUpdate();
            }, ['user.profile'])
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
            eventBus.on(EVENTS.USER_UPDATED, this._handleProfileUpdate)
        );
    }

    // ============================================================
    // STATE HANDLERS
    // ============================================================

    _handleThemeChange() {
        this._applyTheme();
    }

    _handleAuthChange() {
        // Check if profile is still valid
        const user = getState('auth.user');
        if (!user && this._isOwnProfile) {
            router.navigate('/auth');
        }
    }

    _handleProfileUpdate() {
        if (this._isOwnProfile) {
            const user = getState('user.profile');
            if (user) {
                this._profileData = user;
                this._refreshProfileDisplay();
                this._updateStats();
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
        this._loadProfile();
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

        // Remove from DOM
        if (this._container && this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }

        this._container = null;
        this._profileData = null;

        logger.info('👤 ProfileScreen destroyed', { id: this._id });
    }
}

// ============================================================
// EXPORT
// ============================================================

export default ProfileScreen;

// ============================================================
// GLOBAL EXPOSURE
// ============================================================

if (typeof window !== 'undefined') {
    window.ProfileScreen = ProfileScreen;
}

// ============================================================
// END OF FILE: profile-screen.js
// ============================================================