// ============================================================
// FILE: js/widgets/image-slider.js
// PURPOSE: Image carousel/slider with support for images, videos, and stories
// DEPENDENCY: constants.js, helpers.js
// USED BY: product-detail.js, home-screen.js, story-viewer.js, post-card.js
// ============================================================

import { APP_CONSTANTS } from '../utils/constants.js';
import { formatTimeAgo } from '../utils/helpers.js';
import { EventBus } from '../state/event-bus.js';

// ============================================================
// IMAGE SLIDER CLASS
// ============================================================

export class ImageSlider {
    /**
     * @param {Object} options - Configuration options
     * @param {string} options.containerId - Container element ID
     * @param {Array} options.items - Array of items (images, videos, stories)
     * @param {string} options.type - 'product' | 'story' | 'post' | 'gallery' | 'hero'
     * @param {boolean} options.autoPlay - Auto-play slides
     * @param {number} options.interval - Auto-play interval (ms)
     * @param {boolean} options.showDots - Show navigation dots
     * @param {boolean} options.showArrows - Show navigation arrows
     * @param {boolean} options.showThumbnails - Show thumbnail strip
     * @param {boolean} options.showCounter - Show slide counter (1/5)
     * @param {boolean} options.infinite - Infinite loop
     * @param {boolean} options.zoomOnClick - Zoom image on click
     * @param {boolean} options.fullscreen - Enable fullscreen mode
     * @param {boolean} options.pauseOnHover - Pause auto-play on hover
     * @param {boolean} options.swipeEnabled - Enable touch swipe
     * @param {string} options.transition - 'slide' | 'fade' | 'zoom'
     * @param {number} options.transitionDuration - Transition duration (ms)
     * @param {Function} options.onSlideChange - Callback on slide change
     * @param {Function} options.onImageClick - Callback on image click
     * @param {Function} options.onInit - Callback on initialization
     * @param {Function} options.onDestroy - Callback on destroy
     */
    constructor(options = {}) {
        // ============================================================
        // CONFIGURATION
        // ============================================================
        
        this.config = {
            containerId: options.containerId || 'slider-container',
            items: options.items || [],
            type: options.type || 'product',
            autoPlay: options.autoPlay || false,
            interval: options.interval || 3000,
            showDots: options.showDots !== false,
            showArrows: options.showArrows !== false,
            showThumbnails: options.showThumbnails || false,
            showCounter: options.showCounter || false,
            infinite: options.infinite !== false,
            zoomOnClick: options.zoomOnClick || false,
            fullscreen: options.fullscreen || false,
            pauseOnHover: options.pauseOnHover !== false,
            swipeEnabled: options.swipeEnabled !== false,
            transition: options.transition || 'slide',
            transitionDuration: options.transitionDuration || 400,
            onSlideChange: options.onSlideChange || null,
            onImageClick: options.onImageClick || null,
            onInit: options.onInit || null,
            onDestroy: options.onDestroy || null,
            startIndex: options.startIndex || 0
        };

        // ============================================================
        // STATE
        // ============================================================
        
        this.currentIndex = Math.max(0, Math.min(this.config.startIndex, this.config.items.length - 1));
        this.totalSlides = this.config.items.length;
        this.isAnimating = false;
        this.isPlaying = this.config.autoPlay;
        this.isPaused = false;
        this.isDestroyed = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchDeltaX = 0;
        this.isDragging = false;
        this.autoPlayTimer = null;

        // ============================================================
        // DOM REFERENCES
        // ============================================================
        
        this.container = null;
        this.track = null;
        this.slides = [];
        this.dots = [];
        this.thumbnails = [];
        this.prevBtn = null;
        this.nextBtn = null;
        this.counter = null;
        this.fullscreenBtn = null;
        this.zoomOverlay = null;
        this.dotsContainer = null;
        this.thumbContainer = null;
        this.videos = [];

        // ============================================================
        // BIND METHODS
        // ============================================================
        
        this.goTo = this.goTo.bind(this);
        this.next = this.next.bind(this);
        this.prev = this.prev.bind(this);
        this.play = this.play.bind(this);
        this.pause = this.pause.bind(this);
        this.destroy = this.destroy.bind(this);
        this.updateItems = this.updateItems.bind(this);
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._handleTouchStart = this._handleTouchStart.bind(this);
        this._handleTouchMove = this._handleTouchMove.bind(this);
        this._handleTouchEnd = this._handleTouchEnd.bind(this);
        this._handleResize = this._handleResize.bind(this);
        this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
        this._toggleFullscreen = this._toggleFullscreen.bind(this);
        this._handleZoomClick = this._handleZoomClick.bind(this);
        this._startAutoPlay = this._startAutoPlay.bind(this);
        this._stopAutoPlay = this._stopAutoPlay.bind(this);
        this._goToInternal = this._goToInternal.bind(this);

        // ============================================================
        // INITIALIZE
        // ============================================================
        
        this.init();
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================

    init() {
        if (this.totalSlides === 0) {
            this._renderEmptyState();
            return;
        }

        this.container = document.getElementById(this.config.containerId);
        if (!this.container) {
            console.error('[ImageSlider] Container #' + this.config.containerId + ' not found');
            return;
        }

        this.container.innerHTML = '';
        this.container.className = 'slider-container slider-type-' + this.config.type;

        this._buildSlider();
        this._bindEvents();
        this._goToInternal(this.currentIndex, false);

        if (this.config.autoPlay && this.totalSlides > 1) {
            this._startAutoPlay();
        }

        if (this.config.onInit && typeof this.config.onInit === 'function') {
            this.config.onInit(this);
        }

        EventBus.emit('slider:init', {
            totalSlides: this.totalSlides,
            currentIndex: this.currentIndex,
            type: this.config.type
        });
    }

    // ============================================================
    // BUILD SLIDER
    // ============================================================

    _buildSlider() {
        // Create track
        this.track = document.createElement('div');
        this.track.className = 'slides-track';
        this.track.style.display = 'flex';
        this.track.style.height = '100%';
        this.track.style.willChange = 'transform';
        this.track.style.transition = 'none';
        
        if (this.config.transition === 'fade') {
            this.track.style.position = 'relative';
        }

        // Create slides
        this.config.items.forEach((item, index) => {
            const slide = this._createSlide(item, index);
            this.track.appendChild(slide);
            this.slides.push(slide);
        });

        this.container.appendChild(this.track);

        // Create arrows
        if (this.config.showArrows && this.totalSlides > 1) {
            this._createArrows();
        }

        // Create dots
        if (this.config.showDots && this.totalSlides > 1) {
            this._createDots();
        }

        // Create counter
        if (this.config.showCounter && this.totalSlides > 1) {
            this._createCounter();
        }

        // Create thumbnails
        if (this.config.showThumbnails && this.totalSlides > 1) {
            this._createThumbnails();
        }

        // Create fullscreen button
        if (this.config.fullscreen) {
            this._createFullscreenButton();
        }
    }

    // ============================================================
    // CREATE SLIDE
    // ============================================================

    _createSlide(item, index) {
        const slide = document.createElement('div');
        slide.className = 'slide-item';
        slide.dataset.index = index;
        slide.style.flex = '0 0 100%';
        slide.style.position = 'relative';
        slide.style.overflow = 'hidden';
        slide.style.display = 'flex';
        slide.style.alignItems = 'center';
        slide.style.justifyContent = 'center';
        slide.style.backgroundColor = '#f3f4f6';

        if (this.config.transition === 'fade') {
            slide.style.position = 'absolute';
            slide.style.top = '0';
            slide.style.left = '0';
            slide.style.width = '100%';
            slide.style.height = '100%';
            slide.style.opacity = '0';
            slide.style.transition = 'opacity ' + this.config.transitionDuration + 'ms ease';
        }

        if (index === 0) {
            slide.classList.add('active');
            if (this.config.transition === 'fade') {
                slide.style.opacity = '1';
            }
        }

        // Detect item type
        const itemType = item.type || this._detectItemType(item);
        const mediaContainer = document.createElement('div');
        mediaContainer.className = 'slide-media';
        mediaContainer.style.width = '100%';
        mediaContainer.style.height = '100%';
        mediaContainer.style.display = 'flex';
        mediaContainer.style.alignItems = 'center';
        mediaContainer.style.justifyContent = 'center';
        mediaContainer.style.overflow = 'hidden';

        switch (itemType) {
            case 'video':
                this._createVideoSlide(item, mediaContainer);
                break;
            case 'story':
                this._createStorySlide(item, mediaContainer, index);
                break;
            case 'product':
                this._createProductSlide(item, mediaContainer);
                break;
            case 'post':
                this._createPostSlide(item, mediaContainer);
                break;
            case 'image':
            default:
                this._createImageSlide(item, mediaContainer, index);
                break;
        }

        slide.appendChild(mediaContainer);

        // Caption
        if (item.caption || item.title) {
            const caption = document.createElement('div');
            caption.className = 'slide-caption';
            caption.textContent = item.caption || item.title;
            caption.style.position = 'absolute';
            caption.style.bottom = '0';
            caption.style.left = '0';
            caption.style.right = '0';
            caption.style.padding = '30px 20px 20px';
            caption.style.background = 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)';
            caption.style.color = '#fff';
            caption.style.fontSize = '14px';
            caption.style.textAlign = 'center';
            caption.style.pointerEvents = 'none';
            slide.appendChild(caption);
        }

        return slide;
    }

    // ============================================================
    // DETECT ITEM TYPE
    // ============================================================

    _detectItemType(item) {
        if (item.videoUrl || item.video) return 'video';
        if (item.storyId || item.isStory) return 'story';
        if (item.productId || item.price !== undefined) return 'product';
        if (item.postId || item.content) return 'post';
        return 'image';
    }

    // ============================================================
    // CREATE IMAGE SLIDE
    // ============================================================

    _createImageSlide(item, container, index) {
        const img = document.createElement('img');
        img.className = 'slide-image';
        img.src = item.url || item.image || item.thumbnail || '';
        img.alt = item.alt || item.title || 'Slide image';
        img.loading = (index === 0) ? 'eager' : 'lazy';
        img.draggable = false;
        img.decoding = 'async';

        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.display = 'block';
        img.style.opacity = '0';
        img.style.transition = 'opacity ' + this.config.transitionDuration + 'ms ease';

        if (this.config.zoomOnClick) {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', (e) => {
                e.stopPropagation();
                this._handleZoomClick(img);
            });
        }

        img.addEventListener('load', () => {
            img.style.opacity = '1';
        });

        img.addEventListener('error', () => {
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23d1d5db"%3E%3Crect width="24" height="24" rx="4"/%3E%3Ccircle cx="12" cy="12" r="4" fill="%239ca3af"/%3E%3C/svg%3E';
            img.style.opacity = '1';
            img.style.objectFit = 'contain';
            img.style.padding = '20%';
        });

        if (this.config.onImageClick) {
            img.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!this.config.zoomOnClick) {
                    this.config.onImageClick(item, this.currentIndex);
                }
            });
        }

        container.appendChild(img);
    }

    // ============================================================
    // CREATE VIDEO SLIDE
    // ============================================================

    _createVideoSlide(item, container) {
        const wrapper = document.createElement('div');
        wrapper.className = 'video-wrapper';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.style.position = 'relative';
        wrapper.style.background = '#000';

        const video = document.createElement('video');
        video.className = 'slide-video';
        video.src = item.videoUrl || item.video || '';
        video.poster = item.thumbnail || item.image || '';
        video.controls = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'contain';

        wrapper.appendChild(video);
        container.appendChild(wrapper);
        this.videos.push(video);
    }

    // ============================================================
    // CREATE STORY SLIDE
    // ============================================================

    _createStorySlide(item, container, index) {
        const wrapper = document.createElement('div');
        wrapper.className = 'story-wrapper';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.style.position = 'relative';
        wrapper.style.background = '#000';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'center';

        // Background media
        const bg = document.createElement('div');
        bg.className = 'story-background';
        bg.style.width = '100%';
        bg.style.height = '100%';
        bg.style.position = 'absolute';
        bg.style.top = '0';
        bg.style.left = '0';

        if (item.mediaType === 'video') {
            const video = document.createElement('video');
            video.className = 'story-video';
            video.src = item.media || item.url || '';
            video.autoplay = true;
            video.muted = true;
            video.playsInline = true;
            video.loop = true;
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.objectFit = 'cover';
            bg.appendChild(video);
        } else {
            const img = document.createElement('img');
            img.className = 'story-image';
            img.src = item.media || item.url || item.image || '';
            img.alt = item.alt || 'Story';
            img.loading = 'lazy';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            bg.appendChild(img);
        }

        wrapper.appendChild(bg);

        // Story info
        const info = document.createElement('div');
        info.className = 'story-info';
        info.style.position = 'absolute';
        info.style.top = '20px';
        info.style.left = '20px';
        info.style.right = '20px';
        info.style.display = 'flex';
        info.style.alignItems = 'center';
        info.style.gap = '12px';
        info.style.zIndex = '15';

        const avatar = document.createElement('img');
        avatar.className = 'story-avatar';
        avatar.src = item.userPhoto || APP_CONSTANTS.DEFAULT_AVATAR || '';
        avatar.alt = item.userName || 'User';
        avatar.style.width = '40px';
        avatar.style.height = '40px';
        avatar.style.borderRadius = '50%';
        avatar.style.border = '2px solid #fff';
        avatar.style.objectFit = 'cover';

        const name = document.createElement('span');
        name.className = 'story-username';
        name.textContent = item.userName || 'Unknown';
        name.style.color = '#fff';
        name.style.fontWeight = '600';
        name.style.fontSize = '15px';
        name.style.textShadow = '0 1px 4px rgba(0,0,0,0.5)';

        const time = document.createElement('span');
        time.className = 'story-time';
        time.textContent = formatTimeAgo(item.createdAt || item.timestamp);
        time.style.color = 'rgba(255,255,255,0.7)';
        time.style.fontSize = '12px';
        time.style.marginLeft = 'auto';
        time.style.textShadow = '0 1px 4px rgba(0,0,0,0.5)';

        info.appendChild(avatar);
        info.appendChild(name);
        info.appendChild(time);
        wrapper.appendChild(info);

        // Story progress bars
        if (this.totalSlides > 1) {
            const progress = document.createElement('div');
            progress.className = 'story-progress-bars';
            progress.style.position = 'absolute';
            progress.style.top = '12px';
            progress.style.left = '12px';
            progress.style.right = '12px';
            progress.style.display = 'flex';
            progress.style.gap = '4px';
            progress.style.zIndex = '20';

            for (let i = 0; i < this.totalSlides; i++) {
                const bar = document.createElement('div');
                bar.className = 'story-progress-bar';
                bar.dataset.index = i;
                bar.style.flex = '1';
                bar.style.height = '3px';
                bar.style.background = 'rgba(255,255,255,0.3)';
                bar.style.borderRadius = '2px';
                bar.style.overflow = 'hidden';
                if (i < index) {
                    bar.style.background = 'rgba(255,255,255,0.8)';
                }
                progress.appendChild(bar);
            }

            wrapper.appendChild(progress);
        }

        container.appendChild(wrapper);
    }

    // ============================================================
    // CREATE PRODUCT SLIDE
    // ============================================================

    _createProductSlide(item, container) {
        const productInfo = document.createElement('div');
        productInfo.className = 'product-slide-info';
        productInfo.style.width = '100%';
        productInfo.style.height = '100%';
        productInfo.style.position = 'relative';
        productInfo.style.cursor = 'pointer';

        // Image
        const img = document.createElement('img');
        img.className = 'product-slide-image';
        img.src = item.thumbnail || item.image || item.url || '';
        img.alt = item.title || 'Product';
        img.loading = 'lazy';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        productInfo.appendChild(img);

        // Details overlay
        const details = document.createElement('div');
        details.className = 'product-slide-details';
        details.style.position = 'absolute';
        details.style.bottom = '0';
        details.style.left = '0';
        details.style.right = '0';
        details.style.padding = '20px';
        details.style.background = 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)';
        details.style.color = '#fff';

        const title = document.createElement('h4');
        title.className = 'product-slide-title';
        title.textContent = item.title || 'Product';
        title.style.fontSize = '16px';
        title.style.fontWeight = '600';
        title.style.marginBottom = '4px';

        const price = document.createElement('span');
        price.className = 'product-slide-price';
        if (item.isFree) {
            price.textContent = 'FREE';
            price.style.color = '#FF5722';
        } else if (item.price) {
            price.textContent = (item.currency || '$') + ' ' + item.price;
            price.style.color = '#4CAF50';
        } else {
            price.textContent = 'View';
            price.style.color = '#fff';
        }
        price.style.fontSize = '14px';
        price.style.fontWeight = '500';

        details.appendChild(title);
        details.appendChild(price);
        productInfo.appendChild(details);

        // Click handler
        productInfo.addEventListener('click', () => {
            if (this.config.onImageClick) {
                this.config.onImageClick(item, this.currentIndex);
            }
        });

        container.appendChild(productInfo);
    }

    // ============================================================
    // CREATE POST SLIDE
    // ============================================================

    _createPostSlide(item, container) {
        const postContent = document.createElement('div');
        postContent.className = 'post-slide-content';
        postContent.style.width = '100%';
        postContent.style.height = '100%';
        postContent.style.position = 'relative';

        if (item.images && item.images.length > 0) {
            const img = document.createElement('img');
            img.className = 'post-slide-image';
            img.src = item.images[0] || '';
            img.alt = item.title || 'Post';
            img.loading = 'lazy';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            postContent.appendChild(img);
        }

        const overlay = document.createElement('div');
        overlay.className = 'post-slide-overlay';
        overlay.style.position = 'absolute';
        overlay.style.bottom = '0';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.padding = '30px 20px 20px';
        overlay.style.background = 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)';
        overlay.style.color = '#fff';

        const text = document.createElement('p');
        text.className = 'post-slide-text';
        text.textContent = item.content || item.title || '';
        if (text.textContent.length > 150) {
            text.textContent = text.textContent.substring(0, 150) + '...';
        }
        text.style.fontSize = '14px';
        text.style.lineHeight = '1.5';
        text.style.margin = '0';

        overlay.appendChild(text);
        postContent.appendChild(overlay);
        container.appendChild(postContent);
    }

    // ============================================================
    // CREATE NAVIGATION ARROWS
    // ============================================================

    _createArrows() {
        const arrowStyle = {
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: '10',
            background: 'rgba(255,255,255,0.9)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            fontSize: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            color: '#1f2937',
            padding: '0',
            lineHeight: '1'
        };

        // Previous
        this.prevBtn = document.createElement('button');
        this.prevBtn.className = 'slider-arrow slider-arrow-left';
        this.prevBtn.setAttribute('aria-label', 'Previous slide');
        this.prevBtn.innerHTML = '‹';
        Object.assign(this.prevBtn.style, arrowStyle, { left: '12px' });
        this.prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.prev();
        });

        // Next
        this.nextBtn = document.createElement('button');
        this.nextBtn.className = 'slider-arrow slider-arrow-right';
        this.nextBtn.setAttribute('aria-label', 'Next slide');
        this.nextBtn.innerHTML = '›';
        Object.assign(this.nextBtn.style, arrowStyle, { right: '12px' });
        this.nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.next();
        });

        if (window.innerWidth < 640) {
            this.prevBtn.style.width = '32px';
            this.prevBtn.style.height = '32px';
            this.prevBtn.style.fontSize = '18px';
            this.nextBtn.style.width = '32px';
            this.nextBtn.style.height = '32px';
            this.nextBtn.style.fontSize = '18px';
        }

        this.container.appendChild(this.prevBtn);
        this.container.appendChild(this.nextBtn);
    }

    // ============================================================
    // CREATE DOTS
    // ============================================================

    _createDots() {
        this.dotsContainer = document.createElement('div');
        this.dotsContainer.className = 'slider-dots';
        this.dotsContainer.style.position = 'absolute';
        this.dotsContainer.style.bottom = '16px';
        this.dotsContainer.style.left = '50%';
        this.dotsContainer.style.transform = 'translateX(-50%)';
        this.dotsContainer.style.display = 'flex';
        this.dotsContainer.style.gap = '8px';
        this.dotsContainer.style.zIndex = '10';
        this.dotsContainer.style.padding = '4px 12px';
        this.dotsContainer.style.background = 'rgba(0,0,0,0.3)';
        this.dotsContainer.style.borderRadius = '20px';
        this.dotsContainer.style.backdropFilter = 'blur(4px)';

        for (let i = 0; i < this.totalSlides; i++) {
            const dot = document.createElement('button');
            dot.className = 'slider-dot';
            dot.dataset.index = i;
            dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
            dot.style.width = '10px';
            dot.style.height = '10px';
            dot.style.borderRadius = '50%';
            dot.style.border = 'none';
            dot.style.padding = '0';
            dot.style.cursor = 'pointer';
            dot.style.background = (i === this.currentIndex) ? '#ffffff' : 'rgba(255,255,255,0.5)';
            dot.style.transition = 'all 0.3s ease';
            dot.style.flexShrink = '0';
            dot.addEventListener('click', () => {
                this.goTo(i);
            });
            this.dotsContainer.appendChild(dot);
            this.dots.push(dot);
        }

        this.container.appendChild(this.dotsContainer);
    }

    // ============================================================
    // CREATE COUNTER
    // ============================================================

    _createCounter() {
        this.counter = document.createElement('span');
        this.counter.className = 'slider-counter';
        this.counter.style.position = 'absolute';
        this.counter.style.top = '12px';
        this.counter.style.right = '12px';
        this.counter.style.background = 'rgba(0,0,0,0.6)';
        this.counter.style.color = '#fff';
        this.counter.style.padding = '4px 12px';
        this.counter.style.borderRadius = '12px';
        this.counter.style.fontSize = '13px';
        this.counter.style.fontWeight = '500';
        this.counter.style.zIndex = '10';
        this.counter.style.backdropFilter = 'blur(4px)';
        this._updateCounter();
        this.container.appendChild(this.counter);
    }

    // ============================================================
    // CREATE THUMBNAILS
    // ============================================================

    _createThumbnails() {
        this.thumbContainer = document.createElement('div');
        this.thumbContainer.className = 'slider-thumbnails';
        this.thumbContainer.style.display = 'flex';
        this.thumbContainer.style.gap = '8px';
        this.thumbContainer.style.padding = '12px 16px';
        this.thumbContainer.style.background = 'rgba(0,0,0,0.05)';
        this.thumbContainer.style.overflowX = 'auto';
        this.thumbContainer.style.scrollBehavior = 'smooth';
        this.thumbContainer.style.position = 'relative';
        this.thumbContainer.style.zIndex = '5';

        this.config.items.forEach((item, index) => {
            const thumb = document.createElement('button');
            thumb.className = 'thumbnail-item';
            thumb.dataset.index = index;
            thumb.style.flex = '0 0 60px';
            thumb.style.height = '60px';
            thumb.style.borderRadius = '6px';
            thumb.style.overflow = 'hidden';
            thumb.style.border = (index === this.currentIndex) ? '2px solid #6366f1' : '2px solid transparent';
            thumb.style.cursor = 'pointer';
            thumb.style.padding = '0';
            thumb.style.transition = 'all 0.3s ease';
            thumb.style.opacity = (index === this.currentIndex) ? '1' : '0.6';

            const img = document.createElement('img');
            img.src = item.thumbnail || item.image || item.url || '';
            img.alt = 'Thumbnail ' + (index + 1);
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.display = 'block';

            thumb.appendChild(img);
            thumb.addEventListener('click', () => {
                this.goTo(index);
            });

            this.thumbContainer.appendChild(thumb);
            this.thumbnails.push(thumb);
        });

        this.container.appendChild(this.thumbContainer);
    }

    // ============================================================
    // CREATE FULLSCREEN BUTTON
    // ============================================================

    _createFullscreenButton() {
        this.fullscreenBtn = document.createElement('button');
        this.fullscreenBtn.className = 'slider-fullscreen';
        this.fullscreenBtn.setAttribute('aria-label', 'Toggle fullscreen');
        this.fullscreenBtn.innerHTML = '⛶';
        this.fullscreenBtn.style.position = 'absolute';
        this.fullscreenBtn.style.bottom = '60px';
        this.fullscreenBtn.style.right = '12px';
        this.fullscreenBtn.style.background = 'rgba(255,255,255,0.9)';
        this.fullscreenBtn.style.border = 'none';
        this.fullscreenBtn.style.borderRadius = '8px';
        this.fullscreenBtn.style.width = '36px';
        this.fullscreenBtn.style.height = '36px';
        this.fullscreenBtn.style.fontSize = '16px';
        this.fullscreenBtn.style.cursor = 'pointer';
        this.fullscreenBtn.style.zIndex = '10';
        this.fullscreenBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        this.fullscreenBtn.style.display = 'flex';
        this.fullscreenBtn.style.alignItems = 'center';
        this.fullscreenBtn.style.justifyContent = 'center';
        this.fullscreenBtn.style.transition = 'all 0.3s ease';
        this.fullscreenBtn.style.color = '#1f2937';
        this.fullscreenBtn.addEventListener('click', this._toggleFullscreen);
        this.container.appendChild(this.fullscreenBtn);
    }

    // ============================================================
    // NAVIGATION METHODS
    // ============================================================

    goTo(index) {
        if (this.isDestroyed) return this;
        this._goToInternal(index, true);
        return this;
    }

    next() {
        if (this.isDestroyed) return this;
        if (this.config.infinite || this.currentIndex < this.totalSlides - 1) {
            this._goToInternal(this.currentIndex + 1, true);
        }
        return this;
    }

    prev() {
        if (this.isDestroyed) return this;
        if (this.config.infinite || this.currentIndex > 0) {
            this._goToInternal(this.currentIndex - 1, true);
        }
        return this;
    }

    _goToInternal(index, animate) {
        if (this.isDestroyed) return;
        if (this.isAnimating && animate) return;
        if (this.totalSlides === 0) return;

        let targetIndex = index;

        if (this.config.infinite) {
            if (targetIndex < 0) targetIndex = this.totalSlides - 1;
            if (targetIndex >= this.totalSlides) targetIndex = 0;
        } else {
            targetIndex = Math.max(0, Math.min(this.totalSlides - 1, targetIndex));
        }

        if (targetIndex === this.currentIndex && animate) return;

        this.isAnimating = animate;
        this.currentIndex = targetIndex;

        // Update slides
        const offset = -targetIndex * 100;
        if (this.config.transition === 'fade') {
            this.slides.forEach((slide, i) => {
                slide.style.opacity = (i === targetIndex) ? '1' : '0';
                slide.classList.toggle('active', i === targetIndex);
            });
        } else {
            if (animate) {
                this.track.style.transition = 'transform ' + this.config.transitionDuration + 'ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            } else {
                this.track.style.transition = 'none';
            }
            this.track.style.transform = 'translateX(' + offset + '%)';
            if (!animate) {
                this.track.offsetHeight;
            }
        }

        // Update dots
        this.dots.forEach((dot, i) => {
            dot.style.background = (i === targetIndex) ? '#ffffff' : 'rgba(255,255,255,0.5)';
        });

        // Update thumbnails
        this.thumbnails.forEach((thumb, i) => {
            thumb.style.borderColor = (i === targetIndex) ? '#6366f1' : 'transparent';
            thumb.style.opacity = (i === targetIndex) ? '1' : '0.6';
        });

        if (this.thumbContainer && this.thumbnails[targetIndex]) {
            this.thumbnails[targetIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest'
            });
        }

        // Update counter
        this._updateCounter();

        // Handle videos
        if (this.videos.length > 0) {
            this.videos.forEach((video, i) => {
                if (i === targetIndex) {
                    video.play().catch(function() {});
                } else {
                    video.pause();
                }
            });
        }

        // Story progress
        if (this.config.type === 'story') {
            this._updateStoryProgress(targetIndex);
        }

        // Callback
        if (this.config.onSlideChange && typeof this.config.onSlideChange === 'function') {
            this.config.onSlideChange(targetIndex, this.config.items[targetIndex]);
        }

        EventBus.emit('slider:change', {
            currentIndex: targetIndex,
            totalSlides: this.totalSlides,
            item: this.config.items[targetIndex]
        });

        if (animate) {
            setTimeout(() => {
                this.isAnimating = false;
            }, this.config.transitionDuration + 50);
        } else {
            this.isAnimating = false;
        }
    }

    // ============================================================
    // UPDATE STORY PROGRESS
    // ============================================================

    _updateStoryProgress(index) {
        const bars = this.container.querySelectorAll('.story-progress-bar');
        bars.forEach(function(bar, i) {
            if (i <= index) {
                bar.style.background = 'rgba(255,255,255,0.8)';
            } else {
                bar.style.background = 'rgba(255,255,255,0.3)';
            }
        });
    }

    // ============================================================
    // UPDATE COUNTER
    // ============================================================

    _updateCounter() {
        if (this.counter) {
            this.counter.textContent = (this.currentIndex + 1) + ' / ' + this.totalSlides;
        }
    }

    // ============================================================
    // AUTO-PLAY
    // ============================================================

    _startAutoPlay() {
        this._stopAutoPlay();
        if (this.totalSlides <= 1) return;

        this.isPlaying = true;
        this.autoPlayTimer = setInterval(() => {
            if (!this.isPaused && !this.isDestroyed && !this.isAnimating) {
                this.next();
            }
        }, this.config.interval);
    }

    _stopAutoPlay() {
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
        this.isPlaying = false;
    }

    play() {
        if (this.isDestroyed) return this;
        if (!this.isPlaying) {
            this._startAutoPlay();
        }
        this.isPaused = false;
        return this;
    }

    pause() {
        if (this.isDestroyed) return this;
        this.isPaused = true;
        return this;
    }

    // ============================================================
    // ZOOM
    // ============================================================

    _handleZoomClick(img) {
        if (this.zoomOverlay) {
            this.zoomOverlay.remove();
            this.zoomOverlay = null;
            document.body.style.overflow = '';
            return;
        }

        this.zoomOverlay = document.createElement('div');
        this.zoomOverlay.style.position = 'fixed';
        this.zoomOverlay.style.top = '0';
        this.zoomOverlay.style.left = '0';
        this.zoomOverlay.style.width = '100%';
        this.zoomOverlay.style.height = '100%';
        this.zoomOverlay.style.background = 'rgba(0,0,0,0.9)';
        this.zoomOverlay.style.zIndex = '9999';
        this.zoomOverlay.style.display = 'flex';
        this.zoomOverlay.style.alignItems = 'center';
        this.zoomOverlay.style.justifyContent = 'center';
        this.zoomOverlay.style.cursor = 'zoom-out';
        this.zoomOverlay.style.animation = 'fadeIn 0.3s ease';

        const zoomImg = document.createElement('img');
        zoomImg.src = img.src;
        zoomImg.alt = img.alt || 'Zoomed image';
        zoomImg.style.maxWidth = '90%';
        zoomImg.style.maxHeight = '90%';
        zoomImg.style.objectFit = 'contain';
        zoomImg.style.animation = 'zoomIn 0.3s ease';

        this.zoomOverlay.appendChild(zoomImg);
        this.zoomOverlay.addEventListener('click', () => {
            this.zoomOverlay.remove();
            this.zoomOverlay = null;
            document.body.style.overflow = '';
        });

        document.body.appendChild(this.zoomOverlay);
        document.body.style.overflow = 'hidden';
    }

    // ============================================================
    // FULLSCREEN
    // ============================================================

    _toggleFullscreen() {
        if (!document.fullscreenElement) {
            if (this.container.requestFullscreen) {
                this.container.requestFullscreen();
            } else if (this.container.webkitRequestFullscreen) {
                this.container.webkitRequestFullscreen();
            } else if (this.container.mozRequestFullScreen) {
                this.container.mozRequestFullScreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            }
        }
    }

    // ============================================================
    // EMPTY STATE
    // ============================================================

    _renderEmptyState() {
        const container = document.getElementById(this.config.containerId);
        if (!container) return;

        container.innerHTML = '';
        container.className = 'slider-container slider-empty';
        container.innerHTML = '<div class="slider-empty-state"><span class="empty-icon">📷</span><p>No images available</p></div>';

        const style = container.querySelector('.slider-empty-state');
        if (style) {
            style.style.display = 'flex';
            style.style.flexDirection = 'column';
            style.style.alignItems = 'center';
            style.style.justifyContent = 'center';
            style.style.padding = '40px 20px';
            style.style.color = '#999';
            style.style.fontSize = '16px';

            const icon = style.querySelector('.empty-icon');
            if (icon) {
                icon.style.fontSize = '48px';
                icon.style.marginBottom = '12px';
            }
        }
    }

    // ============================================================
    // UPDATE ITEMS
    // ============================================================

    updateItems(newItems) {
        if (this.isDestroyed) return this;

        this._stopAutoPlay();

        this.config.items = newItems;
        this.totalSlides = this.config.items.length;
        this.currentIndex = 0;
        this.slides = [];
        this.dots = [];
        this.thumbnails = [];
        this.videos = [];

        if (this.totalSlides === 0) {
            this._renderEmptyState();
            return this;
        }

        this.container.innerHTML = '';
        this.container.className = 'slider-container slider-type-' + this.config.type;

        this._buildSlider();

        if (this.config.showArrows && this.totalSlides > 1) {
            this._createArrows();
        }

        if (this.config.showDots && this.totalSlides > 1) {
            this._createDots();
        }

        if (this.config.showCounter && this.totalSlides > 1) {
            this._createCounter();
        }

        if (this.config.showThumbnails && this.totalSlides > 1) {
            this._createThumbnails();
        }

        if (this.config.fullscreen) {
            this._createFullscreenButton();
        }

        this._goToInternal(0, false);

        if (this.config.autoPlay && this.totalSlides > 1) {
            this._startAutoPlay();
        }

        return this;
    }

    // ============================================================
    // EVENT BINDING
    // ============================================================

    _bindEvents() {
        document.addEventListener('keydown', this._handleKeyDown);
        document.addEventListener('visibilitychange', this._handleVisibilityChange);
        window.addEventListener('resize', this._handleResize);
        document.addEventListener('fullscreenchange', this._handleResize);
        document.addEventListener('webkitfullscreenchange', this._handleResize);

        if (this.config.swipeEnabled) {
            this.container.addEventListener('touchstart', this._handleTouchStart, { passive: true });
            this.container.addEventListener('touchmove', this._handleTouchMove, { passive: true });
            this.container.addEventListener('touchend', this._handleTouchEnd);
            this.container.addEventListener('mousedown', this._handleTouchStart);
            this.container.addEventListener('mousemove', this._handleTouchMove);
            this.container.addEventListener('mouseup', this._handleTouchEnd);
            this.container.addEventListener('mouseleave', this._handleTouchEnd);
        }

        if (this.config.pauseOnHover && this.config.autoPlay) {
            this.container.addEventListener('mouseenter', () => {
                this.isPaused = true;
            });
            this.container.addEventListener('mouseleave', () => {
                this.isPaused = false;
            });
        }
    }

    // ============================================================
    // EVENT HANDLERS
    // ============================================================

    _handleKeyDown(e) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.prev();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.next();
        } else if (e.key === 'Home') {
            e.preventDefault();
            this.goTo(0);
        } else if (e.key === 'End') {
            e.preventDefault();
            this.goTo(this.totalSlides - 1);
        } else if (e.key === 'Escape' && this.zoomOverlay) {
            this.zoomOverlay.remove();
            this.zoomOverlay = null;
            document.body.style.overflow = '';
        }
    }

    _handleTouchStart(e) {
        if (this.isDestroyed) return;

        const touch = e.touches ? e.touches[0] : e;
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchDeltaX = 0;
        this.isDragging = false;

        if (this.config.autoPlay) {
            this.isPaused = true;
        }
    }

    _handleTouchMove(e) {
        if (this.isDestroyed) return;
        if (this.touchStartX === 0) return;

        const touch = e.touches ? e.touches[0] : e;
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;

        if (!this.isDragging && Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
            this.isDragging = true;
            this.container.style.cursor = 'grabbing';
        }

        if (this.isDragging) {
            e.preventDefault();

            const containerWidth = this.container.offsetWidth;
            const maxDrag = containerWidth * 0.3;
            const dragPercent = Math.max(-maxDrag, Math.min(maxDrag, deltaX)) / containerWidth * 100;
            const currentOffset = -this.currentIndex * 100;

            if (this.config.transition !== 'fade') {
                this.track.style.transition = 'none';
                this.track.style.transform = 'translateX(' + (currentOffset + dragPercent) + '%)';
            }

            this.touchDeltaX = deltaX;
        }
    }

    _handleTouchEnd() {
        if (this.isDestroyed) return;

        if (this.isDragging) {
            const threshold = 50;
            const deltaX = this.touchDeltaX;

            if (deltaX < -threshold) {
                this.next();
            } else if (deltaX > threshold) {
                this.prev();
            } else {
                this._goToInternal(this.currentIndex, true);
            }

            this.container.style.cursor = '';
            this.isDragging = false;
        }

        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchDeltaX = 0;

        if (this.config.autoPlay && this.isPaused) {
            setTimeout(() => {
                this.isPaused = false;
            }, 1000);
        }
    }

    _handleResize() {
        if (this.isDestroyed) return;

        const isMobile = window.innerWidth < 640;
        if (this.prevBtn && this.nextBtn) {
            const size = isMobile ? '32px' : '40px';
            const fontSize = isMobile ? '18px' : '24px';
            this.prevBtn.style.width = size;
            this.prevBtn.style.height = size;
            this.prevBtn.style.fontSize = fontSize;
            this.nextBtn.style.width = size;
            this.nextBtn.style.height = size;
            this.nextBtn.style.fontSize = fontSize;
        }
    }

    _handleVisibilityChange() {
        if (document.hidden) {
            this.isPaused = true;
        } else {
            this.isPaused = false;
        }
    }

    // ============================================================
    // PUBLIC METHODS
    // ============================================================

    getCurrentIndex() {
        return this.currentIndex;
    }

    getTotalSlides() {
        return this.totalSlides;
    }

    getCurrentItem() {
        return this.config.items[this.currentIndex] || null;
    }

    update(config) {
        if (this.isDestroyed) return this;

        const oldAutoPlay = this.config.autoPlay;
        this.config = { ...this.config, ...config };

        if (config.autoPlay !== undefined && config.autoPlay !== oldAutoPlay) {
            if (config.autoPlay) {
                this._startAutoPlay();
            } else {
                this._stopAutoPlay();
            }
        }

        if (config.interval && this.isPlaying) {
            this._startAutoPlay();
        }

        return this;
    }

    destroy() {
        if (this.isDestroyed) return;

        this.isDestroyed = true;
        this._stopAutoPlay();

        if (this.zoomOverlay) {
            this.zoomOverlay.remove();
            this.zoomOverlay = null;
            document.body.style.overflow = '';
        }

        document.removeEventListener('keydown', this._handleKeyDown);
        document.removeEventListener('visibilitychange', this._handleVisibilityChange);
        window.removeEventListener('resize', this._handleResize);
        document.removeEventListener('fullscreenchange', this._handleResize);
        document.removeEventListener('webkitfullscreenchange', this._handleResize);

        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        this.container = null;
        this.track = null;
        this.slides = [];
        this.dots = [];
        this.thumbnails = [];
        this.prevBtn = null;
        this.nextBtn = null;
        this.counter = null;
        this.fullscreenBtn = null;
        this.zoomOverlay = null;
        this.videos = [];

        if (this.config.onDestroy && typeof this.config.onDestroy === 'function') {
            this.config.onDestroy();
        }
    }

    // ============================================================
    // FACTORY METHODS
    // ============================================================

    static forProduct(config) {
        return new ImageSlider({
            transition: 'slide',
            transitionDuration: 400,
            showArrows: true,
            showDots: true,
            showThumbnails: false,
            showCounter: true,
            zoomOnClick: true,
            fullscreen: true,
            autoPlay: false,
            ...config
        });
    }

    static forGallery(config) {
        return new ImageSlider({
            transition: 'fade',
            transitionDuration: 500,
            showArrows: true,
            showDots: true,
            showThumbnails: true,
            showCounter: true,
            zoomOnClick: true,
            fullscreen: true,
            autoPlay: true,
            interval: 5000,
            pauseOnHover: true,
            infinite: true,
            ...config
        });
    }

    static forHero(config) {
        return new ImageSlider({
            transition: 'fade',
            transitionDuration: 800,
            showArrows: true,
            showDots: true,
            showThumbnails: false,
            showCounter: false,
            zoomOnClick: false,
            fullscreen: false,
            autoPlay: true,
            interval: 4000,
            pauseOnHover: true,
            infinite: true,
            ...config
        });
    }

    static forStories(config) {
        return new ImageSlider({
            transition: 'fade',
            transitionDuration: 300,
            showArrows: false,
            showDots: false,
            showThumbnails: false,
            showCounter: false,
            zoomOnClick: false,
            fullscreen: false,
            autoPlay: true,
            interval: 5000,
            pauseOnHover: false,
            infinite: false,
            type: 'story',
            ...config
        });
    }
}

// ============================================================
// CSS STYLES - To be added to style.css or components.css
// ============================================================
/*
.slider-container {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: 12px;
    background: #f3f4f6;
}

.slides-track {
    display: flex;
    height: 100%;
    will-change: transform;
}

.slide-item {
    flex: 0 0 100%;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
}

.slide-item.active {
    z-index: 1;
}

.slide-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    opacity: 0;
    transition: opacity 0.4s ease;
}

.slide-image.loaded {
    opacity: 1;
}

.slide-caption {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 30px 20px 20px;
    background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
    color: #fff;
    font-size: 14px;
    text-align: center;
    pointer-events: none;
}

.slider-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    background: rgba(255,255,255,0.9);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
    color: #1f2937;
    padding: 0;
    line-height: 1;
}

.slider-arrow:hover {
    background: #ffffff;
    transform: translateY(-50%) scale(1.1);
}

.slider-arrow-left {
    left: 12px;
}

.slider-arrow-right {
    right: 12px;
}

.slider-dots {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    z-index: 10;
    padding: 4px 12px;
    background: rgba(0,0,0,0.3);
    border-radius: 20px;
    backdrop-filter: blur(4px);
}

.slider-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: none;
    padding: 0;
    cursor: pointer;
    background: rgba(255,255,255,0.5);
    transition: all 0.3s ease;
    flex-shrink: 0;
}

.slider-dot.active {
    background: #ffffff;
}

.slider-counter {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(0,0,0,0.6);
    color: #fff;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    z-index: 10;
    backdrop-filter: blur(4px);
}

.slider-thumbnails {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    background: rgba(0,0,0,0.05);
    overflow-x: auto;
    scroll-behavior: smooth;
    position: relative;
    z-index: 5;
}

.thumbnail-item {
    flex: 0 0 60px;
    height: 60px;
    border-radius: 6px;
    overflow: hidden;
    border: 2px solid transparent;
    cursor: pointer;
    padding: 0;
    transition: all 0.3s ease;
    opacity: 0.6;
}

.thumbnail-item.active {
    border-color: #6366f1;
    opacity: 1;
}

.thumbnail-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.thumbnail-item:hover {
    opacity: 0.9;
}

.slider-fullscreen {
    position: absolute;
    bottom: 60px;
    right: 12px;
    background: rgba(255,255,255,0.9);
    border: none;
    border-radius: 8px;
    width: 36px;
    height: 36px;
    font-size: 16px;
    cursor: pointer;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    color: #1f2937;
}

.slider-fullscreen:hover {
    background: #ffffff;
}

.slider-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: #999;
    font-size: 16px;
}

.slider-empty .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
}

.slider-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: #999;
    font-size: 16px;
}

.slider-empty-state .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
}

@media (max-width: 768px) {
    .slider-arrow {
        width: 32px;
        height: 32px;
        font-size: 18px;
    }
    
    .slider-arrow-left {
        left: 8px;
    }
    
    .slider-arrow-right {
        right: 8px;
    }
    
    .story-avatar {
        width: 32px;
        height: 32px;
    }
    
    .story-username {
        font-size: 13px;
    }
    
    .thumbnail-item {
        flex: 0 0 44px;
        height: 44px;
    }
    
    .slider-counter {
        font-size: 11px;
        padding: 2px 10px;
        top: 8px;
        right: 8px;
    }
}

@media (max-width: 480px) {
    .slider-container {
        border-radius: 8px;
    }
    
    .slide-caption {
        font-size: 12px;
        padding: 20px 15px 15px;
    }
    
    .product-slide-details {
        padding: 12px;
    }
    
    .product-slide-title {
        font-size: 12px;
    }
    
    .product-slide-price {
        font-size: 12px;
    }
    
    .story-info {
        top: 12px;
        left: 12px;
        right: 12px;
    }
    
    .slider-dots {
        bottom: 12px;
        padding: 3px 10px;
        gap: 6px;
    }
    
    .slider-dot {
        width: 8px;
        height: 8px;
    }
}

@media (prefers-color-scheme: dark) {
    .slider-container {
        background: #1a1a1a;
    }
    
    .slide-item {
        background: #1a1a1a;
    }
    
    .slider-thumbnails {
        background: rgba(255,255,255,0.05);
    }
    
    .slider-arrow {
        background: rgba(50,50,50,0.9);
        color: #e5e7eb;
    }
    
    .slider-arrow:hover {
        background: rgba(70,70,70,0.9);
    }
    
    .slider-fullscreen {
        background: rgba(50,50,50,0.9);
        color: #e5e7eb;
    }
    
    .slider-fullscreen:hover {
        background: rgba(70,70,70,0.9);
    }
}
*/

// ============================================================
// EXPORT
// ============================================================

export default ImageSlider;