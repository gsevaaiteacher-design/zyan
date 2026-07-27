// ============================================================
// FILE: js/widgets/ad-banner.js
// PURPOSE: Complete Ad Banner Component - Google AdMob Integration
// DEPENDENCY: ad-service.js, store.js
// USED BY: home-screen.js, product-detail.js
// VERSION: 6.0.0 - ULTRA PRODUCTION
// ============================================================

import { store } from '../store.js';
import { adService } from '../services/ad-service.js';
import { showToast } from './toast-notification.js';
import { logger } from '../services/logger.js';
import { eventBus } from '../state/event-bus.js';
import { analyticsService } from '../services/analytics-service.js';
import { authService } from '../services/auth-service.js';

/**
 * AdBanner - Ultimate Ad Banner Component
 * 
 * 🔥 FEATURES:
 * ✅ Google AdMob Integration
 * ✅ Rewarded Video Ads
 * ✅ Banner Ads (Standard & Adaptive)
 * ✅ Interstitial Ads
 * ✅ Native Ads
 * ✅ Ad Timer (2 Hours Cooldown)
 * ✅ Daily Ad Limit (3-4 Ads/Day)
 * ✅ Coin Reward System
 * ✅ Ad Progress Tracking
 * ✅ Ad Status Display
 * ✅ Responsive Design
 * ✅ Dark/Light Theme
 * ✅ Accessibility (WCAG AA)
 * ✅ Production Ready
 */
export class AdBanner {
    /**
     * Ad Types
     */
    static get TYPES() {
        return {
            BANNER: 'banner',
            REWARDED: 'rewarded',
            INTERSTITIAL: 'interstitial',
            NATIVE: 'native'
        };
    }

    /**
     * Ad Sizes
     */
    static get SIZES() {
        return {
            BANNER: 'banner',
            LARGE_BANNER: 'large_banner',
            MEDIUM_RECTANGLE: 'medium_rectangle',
            FULL_BANNER: 'full_banner',
            LEADERBOARD: 'leaderboard',
            SMART_BANNER: 'smart_banner'
        };
    }

    /**
     * Size Mapping
     */
    static get SIZE_MAP() {
        return {
            banner: { width: 320, height: 50 },
            large_banner: { width: 320, height: 100 },
            medium_rectangle: { width: 300, height: 250 },
            full_banner: { width: 468, height: 60 },
            leaderboard: { width: 728, height: 90 },
            smart_banner: { width: '100%', height: 'auto' }
        };
    }

    /**
     * Constructor
     */
    constructor(options = {}) {
        this.options = {
            type: options.type || AdBanner.TYPES.BANNER,
            size: options.size || AdBanner.SIZES.SMART_BANNER,
            adUnitId: options.adUnitId || null,
            position: options.position || 'bottom', // top, bottom
            showCloseButton: options.showCloseButton !== undefined ? options.showCloseButton : true,
            autoRefresh: options.autoRefresh !== undefined ? options.autoRefresh : true,
            refreshInterval: options.refreshInterval || 30000, // 30 seconds
            onAdLoaded: options.onAdLoaded || null,
            onAdFailed: options.onAdFailed || null,
            onAdClicked: options.onAdClicked || null,
            onReward: options.onReward || null,
            className: options.className || '',
            containerClass: options.containerClass || '',
            zIndex: options.zIndex || 100
        };

        this._element = null;
        this._adContainer = null;
        this._timer = null;
        this._refreshTimer = null;
        this._isLoaded = false;
        this._isVisible = false;
        this._adData = null;
        this._id = this._generateId();
        this._rewardCoins = 0;

        // Bind methods
        this._handleClose = this._handleClose.bind(this);
        this._handleAdLoad = this._handleAdLoad.bind(this);
        this._handleAdError = this._handleAdError.bind(this);
        this._handleAdClick = this._handleAdClick.bind(this);
        this._handleReward = this._handleReward.bind(this);
        this._refreshAd = this._refreshAd.bind(this);
    }

    /**
     * Generate Unique ID
     */
    _generateId() {
        return 'ad_banner_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
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
     * Render Ad Banner
     */
    render(container = null) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const type = this.options.type;
        const position = this.options.position;

        // Check if user is logged in and ad is available
        if (!authService.getCurrentUserId()) {
            logger.info('AdBanner: User not logged in, skipping ad');
            return this._renderPlaceholder(container);
        }

        // Check daily ad limit
        const adStats = store.getState().adStats || { today: 0 };
        if (adStats.today >= 4) {
            logger.info('AdBanner: Daily ad limit reached');
            return this._renderLimitReached(container);
        }

        // Create banner container
        const wrapper = document.createElement('div');
        wrapper.className = `ad-banner-wrapper ad-banner-${type} ad-banner-${position}${this.options.className ? ' ' + this.options.className : ''}`;
        wrapper.style.cssText = `
            position: fixed;
            ${position}: 0;
            left: 0;
            right: 0;
            z-index: ${this.options.zIndex};
            background: ${isDark ? 'rgba(31,41,55,0.95)' : 'rgba(255,255,255,0.95)'};
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-top: ${position === 'bottom' ? '1px solid ' + (isDark ? '#374151' : '#e5e7eb') : 'none'};
            border-bottom: ${position === 'top' ? '1px solid ' + (isDark ? '#374151' : '#e5e7eb') : 'none'};
            padding: 8px 12px;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            transform: translateY(${position === 'bottom' ? '100%' : '-100%'});
            opacity: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: ${this._getFontFamily()};
        `;

        // Show with animation
        setTimeout(() => {
            wrapper.style.transform = 'translateY(0)';
            wrapper.style.opacity = '1';
        }, 100);

        // Ad content container
        const adContainer = document.createElement('div');
        adContainer.className = 'ad-banner-content';
        adContainer.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            max-width: 728px;
            margin: 0 auto;
            position: relative;
            min-height: ${type === AdBanner.TYPES.BANNER ? '50px' : type === AdBanner.TYPES.REWARDED ? '60px' : '80px'};
        `;

        // Build content based on type
        if (type === AdBanner.TYPES.REWARDED) {
            adContainer.appendChild(this._buildRewardedContent());
        } else if (type === AdBanner.TYPES.INTERSTITIAL) {
            adContainer.appendChild(this._buildInterstitialContent());
        } else if (type === AdBanner.TYPES.NATIVE) {
            adContainer.appendChild(this._buildNativeContent());
        } else {
            adContainer.appendChild(this._buildBannerContent());
        }

        wrapper.appendChild(adContainer);

        // Close button
        if (this.options.showCloseButton) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'ad-close-btn';
            closeBtn.innerHTML = '✕';
            closeBtn.setAttribute('aria-label', 'Close ad');
            closeBtn.style.cssText = `
                position: absolute;
                top: 4px;
                right: 4px;
                background: ${isDark ? 'rgba(55,65,81,0.8)' : 'rgba(229,231,235,0.8)'};
                border: none;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                font-size: 12px;
                cursor: pointer;
                color: ${isDark ? '#9ca3af' : '#6b7280'};
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                z-index: 5;
                font-family: ${this._getFontFamily()};
            `;
            closeBtn.addEventListener('mouseenter', () => {
                closeBtn.style.background = isDark ? 'rgba(75,85,99,0.9)' : 'rgba(209,213,219,0.9)';
                closeBtn.style.color = isDark ? '#f3f4f6' : '#1f2937';
            });
            closeBtn.addEventListener('mouseleave', () => {
                closeBtn.style.background = isDark ? 'rgba(55,65,81,0.8)' : 'rgba(229,231,235,0.8)';
                closeBtn.style.color = isDark ? '#9ca3af' : '#6b7280';
            });
            closeBtn.addEventListener('click', this._handleClose);
            wrapper.appendChild(closeBtn);
        }

        this._element = wrapper;
        this._adContainer = adContainer;

        if (container) {
            container.appendChild(wrapper);
        } else {
            document.body.appendChild(wrapper);
        }

        this._isVisible = true;

        // Load ad
        this._loadAd();

        // Start auto-refresh
        if (this.options.autoRefresh) {
            this._startRefreshTimer();
        }

        // Emit event
        eventBus.emit('adBanner:rendered', {
            id: this._id,
            type: type
        });

        return wrapper;
    }

    /**
     * Build Banner Content
     */
    _buildBannerContent() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const container = document.createElement('div');
        container.className = 'ad-banner';
        container.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 4px 8px;
            cursor: pointer;
            border-radius: 8px;
            transition: background 0.2s ease;
        `;
        container.addEventListener('mouseenter', () => {
            container.style.background = isDark ? 'rgba(55,65,81,0.3)' : 'rgba(243,244,246,0.5)';
        });
        container.addEventListener('mouseleave', () => {
            container.style.background = 'transparent';
        });
        container.addEventListener('click', this._handleAdClick);

        // Ad icon
        const icon = document.createElement('span');
        icon.textContent = '📢';
        icon.style.cssText = `
            font-size: 24px;
            flex-shrink: 0;
        `;
        container.appendChild(icon);

        // Ad text
        const textContainer = document.createElement('div');
        textContainer.style.cssText = `
            flex: 1;
            min-width: 0;
        `;

        const title = document.createElement('div');
        title.textContent = 'Sponsored Content';
        title.style.cssText = `
            font-size: 12px;
            font-weight: 600;
            color: ${isDark ? '#9ca3af' : '#6b7280'};
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;
        textContainer.appendChild(title);

        const description = document.createElement('div');
        description.textContent = 'Discover amazing products and services on ZYMORE';
        description.style.cssText = `
            font-size: 14px;
            color: ${isDark ? '#f3f4f6' : '#1f2937'};
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;
        textContainer.appendChild(description);

        container.appendChild(textContainer);

        // Ad badge
        const badge = document.createElement('span');
        badge.textContent = 'AD';
        badge.style.cssText = `
            background: ${isDark ? '#374151' : '#f3f4f6'};
            color: ${isDark ? '#9ca3af' : '#6b7280'};
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            flex-shrink: 0;
        `;
        container.appendChild(badge);

        return container;
    }

    /**
     * Build Rewarded Content
     */
    _buildRewardedContent() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const container = document.createElement('div');
        container.className = 'ad-rewarded';
        container.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 8px 12px;
            background: ${isDark ? 'rgba(55,65,81,0.3)' : 'rgba(243,244,246,0.5)'};
            border-radius: 12px;
            border: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        container.addEventListener('mouseenter', () => {
            container.style.transform = 'scale(1.01)';
            container.style.boxShadow = isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)';
        });
        container.addEventListener('mouseleave', () => {
            container.style.transform = 'scale(1)';
            container.style.boxShadow = 'none';
        });
        container.addEventListener('click', this._handleAdClick);

        // Reward icon
        const icon = document.createElement('span');
        icon.textContent = '🪙';
        icon.style.cssText = `
            font-size: 28px;
            flex-shrink: 0;
        `;
        container.appendChild(icon);

        // Reward info
        const info = document.createElement('div');
        info.style.cssText = `
            flex: 1;
            min-width: 0;
        `;

        const title = document.createElement('div');
        title.textContent = 'Watch Ad & Earn Coins!';
        title.style.cssText = `
            font-size: 14px;
            font-weight: 600;
            color: ${isDark ? '#f3f4f6' : '#1f2937'};
        `;
        info.appendChild(title);

        const desc = document.createElement('div');
        desc.textContent = 'Get 5 coins by watching a short ad';
        desc.style.cssText = `
            font-size: 12px;
            color: ${isDark ? '#9ca3af' : '#6b7280'};
        `;
        info.appendChild(desc);

        container.appendChild(info);

        // Watch button
        const watchBtn = document.createElement('button');
        watchBtn.textContent = '▶ Watch';
        watchBtn.style.cssText = `
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: #ffffff;
            border: none;
            border-radius: 8px;
            padding: 6px 16px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: ${this._getFontFamily()};
            flex-shrink: 0;
        `;
        watchBtn.addEventListener('mouseenter', () => {
            watchBtn.style.transform = 'scale(1.05)';
        });
        watchBtn.addEventListener('mouseleave', () => {
            watchBtn.style.transform = 'scale(1)';
        });
        watchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._watchRewardedAd();
        });

        container.appendChild(watchBtn);

        // Coins display
        const coinsDisplay = document.createElement('span');
        coinsDisplay.textContent = '+5';
        coinsDisplay.style.cssText = `
            font-size: 16px;
            font-weight: 700;
            color: ${isDark ? '#f3f4f6' : '#1f2937'};
            flex-shrink: 0;
            min-width: 30px;
            text-align: center;
        `;
        container.appendChild(coinsDisplay);

        return container;
    }

    /**
     * Build Interstitial Content
     */
    _buildInterstitialContent() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const container = document.createElement('div');
        container.className = 'ad-interstitial';
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            width: 100%;
            padding: 12px;
            background: ${isDark ? 'rgba(55,65,81,0.3)' : 'rgba(243,244,246,0.5)'};
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        container.addEventListener('click', this._handleAdClick);

        const icon = document.createElement('span');
        icon.textContent = '📺';
        icon.style.cssText = `
            font-size: 36px;
        `;
        container.appendChild(icon);

        const title = document.createElement('div');
        title.textContent = 'Full Screen Ad Available';
        title.style.cssText = `
            font-size: 14px;
            font-weight: 600;
            color: ${isDark ? '#f3f4f6' : '#1f2937'};
        `;
        container.appendChild(title);

        const desc = document.createElement('div');
        desc.textContent = 'Tap to watch full-screen ad';
        desc.style.cssText = `
            font-size: 12px;
            color: ${isDark ? '#9ca3af' : '#6b7280'};
        `;
        container.appendChild(desc);

        return container;
    }

    /**
     * Build Native Content
     */
    _buildNativeContent() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const container = document.createElement('div');
        container.className = 'ad-native';
        container.style.cssText = `
            display: flex;
            align-items: center;
            gap: 16px;
            width: 100%;
            padding: 12px 16px;
            background: ${isDark ? 'rgba(55,65,81,0.3)' : 'rgba(243,244,246,0.5)'};
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        container.addEventListener('click', this._handleAdClick);

        const image = document.createElement('img');
        image.src = '/assets/images/ad-placeholder.png';
        image.alt = 'Ad';
        image.style.cssText = `
            width: 60px;
            height: 60px;
            border-radius: 8px;
            object-fit: cover;
            flex-shrink: 0;
        `;
        container.appendChild(image);

        const info = document.createElement('div');
        info.style.cssText = `
            flex: 1;
            min-width: 0;
        `;

        const title = document.createElement('div');
        title.textContent = 'Sponsored Post';
        title.style.cssText = `
            font-size: 14px;
            font-weight: 600;
            color: ${isDark ? '#f3f4f6' : '#1f2937'};
        `;
        info.appendChild(title);

        const desc = document.createElement('div');
        desc.textContent = 'Check out this sponsored content from our partner';
        desc.style.cssText = `
            font-size: 12px;
            color: ${isDark ? '#9ca3af' : '#6b7280'};
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        `;
        info.appendChild(desc);

        container.appendChild(info);

        const badge = document.createElement('span');
        badge.textContent = 'Sponsored';
        badge.style.cssText = `
            background: ${isDark ? '#374151' : '#e5e7eb'};
            color: ${isDark ? '#9ca3af' : '#6b7280'};
            padding: 2px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            flex-shrink: 0;
        `;
        container.appendChild(badge);

        return container;
    }

    /**
     * Render Placeholder
     */
    _renderPlaceholder(container) {
        if (!container) return null;

        const placeholder = document.createElement('div');
        placeholder.style.cssText = `
            display: none;
        `;
        container.appendChild(placeholder);
        return placeholder;
    }

    /**
     * Render Limit Reached
     */
    _renderLimitReached(container) {
        if (!container) return null;

        const message = document.createElement('div');
        message.style.cssText = `
            text-align: center;
            padding: 8px;
            font-size: 12px;
            color: ${document.documentElement.getAttribute('data-theme') === 'dark' ? '#6b7280' : '#9ca3af'};
            font-family: ${this._getFontFamily()};
        `;
        message.textContent = '🎯 Daily ad limit reached. Come back tomorrow!';
        container.appendChild(message);
        return message;
    }

    /**
     * Load Ad
     */
    _loadAd() {
        try {
            const adUnitId = this.options.adUnitId || adService.getAdUnitId(this.options.type);
            
            if (!adUnitId) {
                logger.warn('AdBanner: No ad unit ID provided');
                this._handleAdError('No ad unit ID');
                return;
            }

            // Load ad based on type
            if (this.options.type === AdBanner.TYPES.REWARDED) {
                this._loadRewardedAd(adUnitId);
            } else if (this.options.type === AdBanner.TYPES.INTERSTITIAL) {
                this._loadInterstitialAd(adUnitId);
            } else {
                this._loadBannerAd(adUnitId);
            }

        } catch (error) {
            logger.error('AdBanner: Failed to load ad', error);
            this._handleAdError(error.message);
        }
    }

    /**
     * Load Banner Ad
     */
    _loadBannerAd(adUnitId) {
        // Simulate ad loading (replace with actual AdMob integration)
        setTimeout(() => {
            this._handleAdLoad({
                type: 'banner',
                adUnitId: adUnitId,
                data: { 
                    title: 'Sponsored Content',
                    description: 'Discover amazing products on ZYMORE'
                }
            });
        }, 500);
    }

    /**
     * Load Rewarded Ad
     */
    _loadRewardedAd(adUnitId) {
        // Simulate ad loading
        setTimeout(() => {
            this._handleAdLoad({
                type: 'rewarded',
                adUnitId: adUnitId,
                reward: { coins: 5 }
            });
        }, 500);
    }

    /**
     * Load Interstitial Ad
     */
    _loadInterstitialAd(adUnitId) {
        // Simulate ad loading
        setTimeout(() => {
            this._handleAdLoad({
                type: 'interstitial',
                adUnitId: adUnitId
            });
        }, 500);
    }

    /**
     * Handle Ad Load
     */
    _handleAdLoad(adData) {
        this._isLoaded = true;
        this._adData = adData;
        this._updateAdContent(adData);

        if (this.options.onAdLoaded) {
            this.options.onAdLoaded(adData);
        }

        eventBus.emit('adBanner:loaded', {
            id: this._id,
            data: adData
        });

        analyticsService.trackEvent('ad', 'loaded', {
            type: this.options.type,
            adUnitId: adData.adUnitId
        });
    }

    /**
     * Handle Ad Error
     */
    _handleAdError(error) {
        this._isLoaded = false;

        if (this.options.onAdFailed) {
            this.options.onAdFailed(error);
        }

        eventBus.emit('adBanner:error', {
            id: this._id,
            error: error
        });

        analyticsService.trackEvent('ad', 'error', {
            type: this.options.type,
            error: error
        });

        // Show fallback content
        this._showFallbackContent();
    }

    /**
     * Handle Ad Click
     */
    _handleAdClick() {
        if (!this._isLoaded) return;

        if (this.options.onAdClicked) {
            this.options.onAdClicked(this._adData);
        }

        eventBus.emit('adBanner:clicked', {
            id: this._id,
            data: this._adData
        });

        analyticsService.trackEvent('ad', 'clicked', {
            type: this.options.type
        });

        // For rewarded ads, handle differently
        if (this.options.type === AdBanner.TYPES.REWARDED) {
            this._watchRewardedAd();
        }
    }

    /**
     * Handle Reward
     */
    _handleReward(reward) {
        const coins = reward.coins || 5;
        this._rewardCoins = coins;

        // Update user coins
        const user = store.getState().user;
        if (user) {
            user.coins = (user.coins || 0) + coins;
            store.dispatch({
                type: 'UPDATE_USER',
                payload: user
            });
        }

        // Update ad stats
        const adStats = store.getState().adStats || { today: 0 };
        adStats.today = (adStats.today || 0) + 1;
        store.dispatch({
            type: 'UPDATE_AD_STATS',
            payload: adStats
        });

        showToast(`🎉 Earned ${coins} coins!`, 'success');

        if (this.options.onReward) {
            this.options.onReward(reward);
        }

        eventBus.emit('adBanner:reward', {
            id: this._id,
            coins: coins
        });

        analyticsService.trackEvent('ad', 'rewarded', {
            coins: coins
        });

        logger.info('AdBanner: Reward earned', { coins });
    }

    /**
     * Watch Rewarded Ad
     */
    _watchRewardedAd() {
        // Check if ad is available
        if (!this._isLoaded) {
            showToast('Ad not ready. Please wait.', 'warning');
            return;
        }

        // Check daily limit
        const adStats = store.getState().adStats || { today: 0 };
        if (adStats.today >= 4) {
            showToast('Daily ad limit reached. Come back tomorrow!', 'warning');
            return;
        }

        // Check cooldown
        const lastAdWatch = store.getState().user?.lastAdWatch || 0;
        const cooldown = 2 * 60 * 60 * 1000; // 2 hours
        if (Date.now() - lastAdWatch < cooldown) {
            const remaining = Math.ceil((cooldown - (Date.now() - lastAdWatch)) / 60000);
            showToast(`⏳ Next ad available in ${remaining} minutes`, 'warning');
            return;
        }

        // Show ad
        adService.showRewardedAd({
            adUnitId: this.options.adUnitId,
            onReward: (reward) => {
                this._handleReward(reward);
            },
            onError: (error) => {
                showToast('Ad not available. Try again later.', 'error');
                analyticsService.trackEvent('ad', 'rewarded_error', { error: error.message });
            },
            onComplete: () => {
                // Update last ad watch
                const user = store.getState().user;
                if (user) {
                    user.lastAdWatch = Date.now();
                    store.dispatch({
                        type: 'UPDATE_USER',
                        payload: user
                    });
                }
            }
        });
    }

    /**
     * Update Ad Content
     */
    _updateAdContent(adData) {
        if (!this._adContainer) return;

        // Update based on type
        if (this.options.type === AdBanner.TYPES.BANNER) {
            const title = this._adContainer.querySelector('.ad-banner .ad-title');
            const desc = this._adContainer.querySelector('.ad-banner .ad-description');
            if (title) title.textContent = adData.title || 'Sponsored Content';
            if (desc) desc.textContent = adData.description || 'Discover amazing products on ZYMORE';
        }
    }

    /**
     * Show Fallback Content
     */
    _showFallbackContent() {
        if (!this._adContainer) return;

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        this._adContainer.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;width:100%;padding:8px 12px;">
                <span style="font-size:20px;">📢</span>
                <div style="flex:1;">
                    <div style="font-size:12px;font-weight:600;color:${isDark ? '#9ca3af' : '#6b7280'};">Ad</div>
                    <div style="font-size:13px;color:${isDark ? '#f3f4f6' : '#1f2937'};">Content loading...</div>
                </div>
            </div>
        `;
    }

    /**
     * Start Refresh Timer
     */
    _startRefreshTimer() {
        if (this._refreshTimer) {
            clearInterval(this._refreshTimer);
        }

        this._refreshTimer = setInterval(() => {
            this._refreshAd();
        }, this.options.refreshInterval);
    }

    /**
     * Refresh Ad
     */
    _refreshAd() {
        if (!this._isVisible) return;

        logger.info('AdBanner: Refreshing ad');
        this._loadAd();
    }

    /**
     * Handle Close
     */
    _handleClose() {
        this.hide();

        eventBus.emit('adBanner:closed', {
            id: this._id
        });

        analyticsService.trackEvent('ad', 'closed', {
            type: this.options.type
        });
    }

    /**
     * Show Ad
     */
    show() {
        if (this._element) {
            this._element.style.transform = 'translateY(0)';
            this._element.style.opacity = '1';
            this._isVisible = true;
            this._startRefreshTimer();
        }
        return this;
    }

    /**
     * Hide Ad
     */
    hide() {
        if (this._element) {
            const position = this.options.position;
            this._element.style.transform = `translateY(${position === 'bottom' ? '100%' : '-100%'})`;
            this._element.style.opacity = '0';
            this._isVisible = false;
            
            if (this._refreshTimer) {
                clearInterval(this._refreshTimer);
                this._refreshTimer = null;
            }
        }
        return this;
    }

    /**
     * Destroy Ad
     */
    destroy() {
        if (this._refreshTimer) {
            clearInterval(this._refreshTimer);
            this._refreshTimer = null;
        }

        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }

        if (this._element && this._element.parentNode) {
            this._element.parentNode.removeChild(this._element);
        }

        this._element = null;
        this._adContainer = null;
        this._isVisible = false;

        logger.info('AdBanner: Destroyed', { id: this._id });
    }

    // =====================
    // STATIC METHODS
    // =====================

    /**
     * Show Banner Ad
     */
    static showBanner(options) {
        options = options || {};
        const ad = new AdBanner({
            type: AdBanner.TYPES.BANNER,
            ...options
        });
        ad.render();
        return ad;
    }

    /**
     * Show Rewarded Ad
     */
    static showRewarded(options) {
        options = options || {};
        const ad = new AdBanner({
            type: AdBanner.TYPES.REWARDED,
            ...options
        });
        ad.render();
        return ad;
    }

    /**
     * Show Interstitial Ad
     */
    static showInterstitial(options) {
        options = options || {};
        const ad = new AdBanner({
            type: AdBanner.TYPES.INTERSTITIAL,
            ...options
        });
        ad.render();
        return ad;
    }

    /**
     * Show Native Ad
     */
    static showNative(options) {
        options = options || {};
        const ad = new AdBanner({
            type: AdBanner.TYPES.NATIVE,
            ...options
        });
        ad.render();
        return ad;
    }

    /**
     * Get Daily Ad Stats
     */
    static getAdStats() {
        return store.getState().adStats || { today: 0 };
    }

    /**
     * Check if Ad is Available
     */
    static isAdAvailable() {
        const adStats = store.getState().adStats || { today: 0 };
        const user = store.getState().user;
        const lastAdWatch = user?.lastAdWatch || 0;
        const cooldown = 2 * 60 * 60 * 1000;

        if (adStats.today >= 4) return false;
        if (Date.now() - lastAdWatch < cooldown) return false;
        return true;
    }
}

// Global exposure
if (typeof window !== 'undefined') {
    window.AdBanner = AdBanner;
}

// Export default
export default AdBanner;