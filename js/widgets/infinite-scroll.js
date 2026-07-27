// Infinite Scroll
// ============================================================
// FILE: js/widgets/infinite-scroll.js
// PURPOSE: Infinite scroll for product listing with pagination
// DEPENDENCY: store.js
// USED BY: home-screen.js, explore-screen.js
// ============================================================

import { Store } from '../store.js';
import { EventBus } from '../event-bus.js';

/**
 * InfiniteScroll Class - Manages infinite scrolling with pagination
 * 
 * Features:
 * - Scroll-based loading with threshold
 * - Pagination support (cursor-based)
 * - Loading states
 * - Error handling with retry
 * - Intersection Observer for performance
 * - Configurable threshold and debounce
 * - Empty state display
 * - End of list detection
 * - Manual refresh capability
 * - Event callbacks
 * 
 * Usage:
 *   const scroll = new InfiniteScroll({
 *     container: document.getElementById('product-grid'),
 *     loadMore: async (cursor) => {
 *       const data = await fetchProducts(cursor);
 *       return { items: data.products, nextCursor: data.nextCursor };
 *     },
 *     onLoad: (items) => { /* render items */ },
 *     onComplete: () => { /* all items loaded */ }
 *   });
 *   scroll.init();
 */
export class InfiniteScroll {
    /**
     * Default configuration
     * @private
     * @static
     */
    static #defaultConfig = {
        container: null,           // Container element (required)
        loadMore: null,            // Async function to load more (required)
        threshold: 200,            // Pixels before bottom to trigger load
        debounce: 200,             // Debounce time in ms
        initialPageSize: 20,       // Items per page
        maxPages: 100,             // Maximum pages to load
        loadingText: 'Loading more...',
        endText: 'No more items to load',
        errorText: 'Failed to load. Retry?',
        emptyText: 'No items found',
        showLoader: true,          // Show loading indicator
        useObserver: true,         // Use Intersection Observer
        autoInit: false,           // Auto initialize
        onLoad: null,              // Callback when items loaded
        onError: null,             // Callback on error
        onComplete: null,          // Callback when all items loaded
        onEmpty: null              // Callback when no items
    };

    /**
     * Constructor
     * @param {Object} config - Configuration object
     */
    constructor(config = {}) {
        this.config = {
            ...InfiniteScroll.#defaultConfig,
            ...config
        };

        // Validate required config
        if (!this.config.container) {
            throw new Error('InfiniteScroll: container is required');
        }
        if (typeof this.config.loadMore !== 'function') {
            throw new Error('InfiniteScroll: loadMore function is required');
        }

        // Private state
        this._isLoading = false;
        this._isComplete = false;
        this._isEmpty = false;
        this._isDestroyed = false;
        this._cursor = null;
        this._page = 0;
        this._items = [];
        this._retryCount = 0;
        this._maxRetries = 3;
        this._container = null;
        this._sentinel = null;
        this._loader = null;
        this._observer = null;

        // Bind methods
        this._handleScroll = this._handleScroll.bind(this);
        this._handleIntersection = this._handleIntersection.bind(this);
        this._loadMore = this._loadMore.bind(this);
        this._retry = this._retry.bind(this);
        this._debounceLoad = this._debounce(this._handleLoad, this.config.debounce);

        // Auto-init if configured
        if (this.config.autoInit) {
            this.init();
        }
    }

    /**
     * Initialize the infinite scroll
     * @public
     * @returns {this} Chainable
     */
    init() {
        if (this._isDestroyed) return this;

        // Get container
        this._container = this.config.container;
        if (typeof this._container === 'string') {
            this._container = document.querySelector(this._container);
        }
        if (!this._container) {
            throw new Error('InfiniteScroll: container not found');
        }

        // Setup container styles
        this._setupContainer();

        // Create sentinel element
        this._createSentinel();

        // Setup observer or scroll listener
        if (this.config.useObserver && typeof IntersectionObserver !== 'undefined') {
            this._setupObserver();
        } else {
            this._setupScrollListener();
        }

        // Load initial data
        this._loadMore();

        return this;
    }

    /**
     * Setup container styles
     * @private
     */
    _setupContainer() {
        // Ensure container has relative positioning
        if (this._container.style.position === 'static') {
            this._container.style.position = 'relative';
        }
        // Ensure overflow handling
        const overflowY = window.getComputedStyle(this._container).overflowY;
        if (overflowY !== 'auto' && overflowY !== 'scroll') {
            this._container.style.overflowY = 'auto';
            this._container.style.maxHeight = '100%';
        }
    }

    /**
     * Create sentinel element for intersection observer
     * @private
     */
    _createSentinel() {
        // Remove existing sentinel if any
        if (this._sentinel) {
            this._sentinel.remove();
        }

        this._sentinel = document.createElement('div');
        this._sentinel.className = 'infinite-scroll-sentinel';
        Object.assign(this._sentinel.style, {
            height: '1px',
            width: '100%',
            visibility: 'hidden',
            pointerEvents: 'none'
        });

        // Add loader after sentinel
        if (this.config.showLoader) {
            this._createLoader();
        }

        this._container.appendChild(this._sentinel);
        if (this._loader) {
            this._container.appendChild(this._loader);
        }
    }

    /**
     * Create loader element
     * @private
     */
    _createLoader() {
        this._loader = document.createElement('div');
        this._loader.className = 'infinite-scroll-loader';
        Object.assign(this._loader.style, {
            display: 'none',
            textAlign: 'center',
            padding: '20px',
            color: '#6b7280',
            fontSize: '14px',
            width: '100%'
        });

        // Add spinner
        const spinner = document.createElement('span');
        Object.assign(spinner.style, {
            display: 'inline-block',
            width: '20px',
            height: '20px',
            border: '2px solid #e5e7eb',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginRight: '10px',
            verticalAlign: 'middle'
        });

        const text = document.createElement('span');
        text.textContent = this.config.loadingText;

        this._loader.appendChild(spinner);
        this._loader.appendChild(text);

        // Add spin animation if not exists
        if (!document.getElementById('infinite-spinner-keyframes')) {
            const style = document.createElement('style');
            style.id = 'infinite-spinner-keyframes';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Setup Intersection Observer
     * @private
     */
    _setupObserver() {
        if (this._observer) {
            this._observer.disconnect();
        }

        this._observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this._isLoading && !this._isComplete) {
                    this._loadMore();
                }
            });
        }, {
            root: this._container,
            rootMargin: `0px 0px ${this.config.threshold}px 0px`,
            threshold: 0
        });

        if (this._sentinel) {
            this._observer.observe(this._sentinel);
        }
    }

    /**
     * Setup scroll listener (fallback)
     * @private
     */
    _setupScrollListener() {
        this._container.addEventListener('scroll', this._handleScroll);
        // Also listen to window scroll if container is body or document
        if (this._container === document.body || this._container === document.documentElement) {
            window.addEventListener('scroll', this._handleScroll);
        }
    }

    /**
     * Handle scroll event
     * @private
     */
    _handleScroll() {
        if (this._isLoading || this._isComplete || this._isEmpty) return;

        const container = this._container;
        const scrollTop = container.scrollTop || window.pageYOffset || 0;
        const scrollHeight = container.scrollHeight || document.documentElement.scrollHeight;
        const clientHeight = container.clientHeight || window.innerHeight;

        const distanceToBottom = scrollHeight - scrollTop - clientHeight;

        if (distanceToBottom <= this.config.threshold) {
            this._debounceLoad();
        }
    }

    /**
     * Debounce function
     * @private
     * @param {Function} fn - Function to debounce
     * @param {number} delay - Debounce delay
     * @returns {Function} Debounced function
     */
    _debounce(fn, delay) {
        let timeoutId = null;
        return function(...args) {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                fn.apply(this, args);
                timeoutId = null;
            }, delay);
        };
    }

    /**
     * Handle load with debounce
     * @private
     */
    _handleLoad() {
        if (!this._isLoading && !this._isComplete && !this._isEmpty) {
            this._loadMore();
        }
    }

    /**
     * Load more items
     * @private
     */
    async _loadMore() {
        if (this._isLoading || this._isComplete || this._isDestroyed) return;

        // Check max pages
        if (this._page >= this.config.maxPages) {
            this._setComplete();
            return;
        }

        this._isLoading = true;
        this._showLoader(true);

        try {
            // Call loadMore function
            const result = await this.config.loadMore({
                cursor: this._cursor,
                page: this._page,
                pageSize: this.config.initialPageSize
            });

            // Validate result
            if (!result || typeof result !== 'object') {
                throw new Error('Invalid response from loadMore');
            }

            const items = result.items || result.data || [];
            const nextCursor = result.nextCursor || result.cursor || null;

            // Check if empty
            if (items.length === 0 && this._items.length === 0) {
                this._setEmpty();
                return;
            }

            // Store items
            this._items = [...this._items, ...items];
            this._page++;
            this._cursor = nextCursor;
            this._retryCount = 0;

            // Call onLoad callback
            if (this.config.onLoad && typeof this.config.onLoad === 'function') {
                this.config.onLoad(items, this._items);
            }

            // Emit event
            EventBus.emit('infinite:load', {
                page: this._page,
                items: items,
                totalItems: this._items.length,
                hasMore: !!nextCursor
            });

            // Check if complete
            if (!nextCursor || items.length === 0) {
                this._setComplete();
            }

        } catch (error) {
            console.warn('[InfiniteScroll] Load error:', error);

            // Retry logic
            if (this._retryCount < this._maxRetries) {
                this._retryCount++;
                this._showError(`Load failed. Retrying... (${this._retryCount}/${this._maxRetries})`);
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * this._retryCount));
                this._hideError();
                this._isLoading = false;
                this._loadMore();
                return;
            }

            // Call onError callback
            if (this.config.onError && typeof this.config.onError === 'function') {
                this.config.onError(error);
            }

            // Show error with retry option
            this._showError(this.config.errorText, true);
            EventBus.emit('infinite:error', { error });

        } finally {
            if (this._isLoading) {
                this._isLoading = false;
                this._showLoader(false);
            }
        }
    }

    /**
     * Show loader
     * @private
     * @param {boolean} show - Show or hide
     */
    _showLoader(show) {
        if (!this._loader) return;
        this._loader.style.display = show ? 'block' : 'none';
        if (show) {
            const text = this._loader.querySelector('span:last-child');
            if (text) text.textContent = this.config.loadingText;
            const spinner = this._loader.querySelector('span:first-child');
            if (spinner) {
                spinner.style.display = 'inline-block';
            }
            // Remove any error classes
            this._loader.classList.remove('error');
        }
    }

    /**
     * Show error message
     * @private
     * @param {string} message - Error message
     * @param {boolean} showRetry - Show retry button
     */
    _showError(message, showRetry = false) {
        if (!this._loader) {
            this._createLoader();
            if (this._loader) {
                this._container.appendChild(this._loader);
            }
        }
        if (!this._loader) return;

        this._loader.style.display = 'block';
        this._loader.classList.add('error');
        this._loader.innerHTML = '';

        const errorIcon = document.createElement('span');
        errorIcon.textContent = '⚠️';
        Object.assign(errorIcon.style, {
            marginRight: '10px',
            fontSize: '20px',
            verticalAlign: 'middle'
        });

        const text = document.createElement('span');
        text.textContent = message;

        this._loader.appendChild(errorIcon);
        this._loader.appendChild(text);

        if (showRetry) {
            const retryBtn = document.createElement('button');
            retryBtn.textContent = 'Retry';
            Object.assign(retryBtn.style, {
                marginLeft: '12px',
                padding: '4px 16px',
                backgroundColor: '#6366f1',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
            });
            retryBtn.addEventListener('mouseenter', () => {
                retryBtn.style.backgroundColor = '#4f46e5';
            });
            retryBtn.addEventListener('mouseleave', () => {
                retryBtn.style.backgroundColor = '#6366f1';
            });
            retryBtn.addEventListener('click', this._retry);
            this._loader.appendChild(retryBtn);
        }
    }

    /**
     * Hide error message
     * @private
     */
    _hideError() {
        if (!this._loader) return;
        this._loader.classList.remove('error');
        this._loader.innerHTML = '';
        
        const spinner = document.createElement('span');
        Object.assign(spinner.style, {
            display: 'inline-block',
            width: '20px',
            height: '20px',
            border: '2px solid #e5e7eb',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginRight: '10px',
            verticalAlign: 'middle'
        });

        const text = document.createElement('span');
        text.textContent = this.config.loadingText;

        this._loader.appendChild(spinner);
        this._loader.appendChild(text);
        this._loader.style.display = 'none';
    }

    /**
     * Retry loading
     * @private
     */
    _retry() {
        if (this._isDestroyed) return;
        this._retryCount = 0;
        this._hideError();
        this._isLoading = false;
        this._loadMore();
    }

    /**
     * Set complete state
     * @private
     */
    _setComplete() {
        this._isComplete = true;
        this._showComplete();

        if (this.config.onComplete && typeof this.config.onComplete === 'function') {
            this.config.onComplete(this._items);
        }

        EventBus.emit('infinite:complete', {
            totalItems: this._items.length,
            totalPages: this._page
        });
    }

    /**
     * Show complete message
     * @private
     */
    _showComplete() {
        if (!this._loader) {
            this._createLoader();
            if (this._loader) {
                this._container.appendChild(this._loader);
            }
        }
        if (!this._loader) return;

        this._loader.style.display = 'block';
        this._loader.classList.remove('error');
        this._loader.innerHTML = '';

        const icon = document.createElement('span');
        icon.textContent = '✓';
        Object.assign(icon.style, {
            marginRight: '10px',
            fontSize: '18px',
            color: '#22c55e',
            verticalAlign: 'middle'
        });

        const text = document.createElement('span');
        text.textContent = this.config.endText;

        this._loader.appendChild(icon);
        this._loader.appendChild(text);
    }

    /**
     * Set empty state
     * @private
     */
    _setEmpty() {
        this._isEmpty = true;
        this._showEmpty();

        if (this.config.onEmpty && typeof this.config.onEmpty === 'function') {
            this.config.onEmpty();
        }

        EventBus.emit('infinite:empty');
    }

    /**
     * Show empty message
     * @private
     */
    _showEmpty() {
        if (!this._loader) {
            this._createLoader();
            if (this._loader) {
                this._container.appendChild(this._loader);
            }
        }
        if (!this._loader) return;

        this._loader.style.display = 'block';
        this._loader.classList.remove('error');
        this._loader.innerHTML = '';

        const icon = document.createElement('span');
        icon.textContent = '📭';
        Object.assign(icon.style, {
            marginRight: '10px',
            fontSize: '24px',
            verticalAlign: 'middle'
        });

        const text = document.createElement('span');
        text.textContent = this.config.emptyText;

        this._loader.appendChild(icon);
        this._loader.appendChild(text);
    }

    /**
     * Reset and reload
     * @public
     * @returns {this} Chainable
     */
    reset() {
        if (this._isDestroyed) return this;

        // Reset state
        this._isLoading = false;
        this._isComplete = false;
        this._isEmpty = false;
        this._cursor = null;
        this._page = 0;
        this._items = [];
        this._retryCount = 0;

        // Reset UI
        if (this._loader) {
            this._loader.style.display = 'none';
            this._loader.classList.remove('error');
        }

        // Hide sentinel
        if (this._sentinel) {
            this._sentinel.style.display = '';
        }

        // Reload
        this._loadMore();

        return this;
    }

    /**
     * Refresh current data
     * @public
     * @returns {this} Chainable
     */
    refresh() {
        return this.reset();
    }

    /**
     * Get all loaded items
     * @public
     * @returns {Array} Loaded items
     */
    getItems() {
        return [...this._items];
    }

    /**
     * Get current page
     * @public
     * @returns {number} Current page
     */
    getPage() {
        return this._page;
    }

    /**
     * Check if complete
     * @public
     * @returns {boolean} Is complete
     */
    isComplete() {
        return this._isComplete;
    }

    /**
     * Check if loading
     * @public
     * @returns {boolean} Is loading
     */
    isLoading() {
        return this._isLoading;
    }

    /**
     * Check if empty
     * @public
     * @returns {boolean} Is empty
     */
    isEmpty() {
        return this._isEmpty;
    }

    /**
     * Update configuration
     * @public
     * @param {Object} config - New configuration
     * @returns {this} Chainable
     */
    update(config = {}) {
        if (this._isDestroyed) return this;

        this.config = { ...this.config, ...config };

        // Update threshold
        if (this._observer && config.threshold) {
            this._observer.disconnect();
            this._setupObserver();
        }

        // Update loader text
        if (this._loader) {
            const text = this._loader.querySelector('span:last-child');
            if (text && !this._loader.classList.contains('error')) {
                text.textContent = this.config.loadingText;
            }
        }

        return this;
    }

    /**
     * Destroy the component
     * @public
     */
    destroy() {
        if (this._isDestroyed) return;

        this._isDestroyed = true;

        // Disconnect observer
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }

        // Remove scroll listeners
        this._container.removeEventListener('scroll', this._handleScroll);
        if (this._container === document.body || this._container === document.documentElement) {
            window.removeEventListener('scroll', this._handleScroll);
        }

        // Remove sentinel and loader
        if (this._sentinel) {
            this._sentinel.remove();
            this._sentinel = null;
        }
        if (this._loader) {
            this._loader.remove();
            this._loader = null;
        }

        // Clear references
        this._container = null;
        this._items = [];
    }

    /**
     * Create an infinite scroll for products (factory method)
     * @public
     * @static
     * @param {Object} config - Configuration
     * @param {string|HTMLElement} config.container - Container element
     * @param {Function} config.loadMore - Load function
     * @param {Object} config.options - Additional options
     * @returns {InfiniteScroll} InfiniteScroll instance
     */
    static forProducts(config = {}) {
        return new InfiniteScroll({
            initialPageSize: 20,
            threshold: 300,
            loadingText: 'Loading more products...',
            endText: 'No more products to show',
            emptyText: 'No products found',
            ...config
        });
    }

    /**
     * Create an infinite scroll for reviews (factory method)
     * @public
     * @static
     * @param {Object} config - Configuration
     * @returns {InfiniteScroll} InfiniteScroll instance
     */
    static forReviews(config = {}) {
        return new InfiniteScroll({
            initialPageSize: 10,
            threshold: 200,
            loadingText: 'Loading more reviews...',
            endText: 'No more reviews',
            emptyText: 'No reviews yet',
            ...config
        });
    }

    /**
     * Create an infinite scroll with cursor-based pagination
     * @public
     * @static
     * @param {Object} config - Configuration
     * @returns {InfiniteScroll} InfiniteScroll instance
     */
    static withCursor(config = {}) {
        return new InfiniteScroll({
            ...config,
            loadMore: async ({ cursor, page, pageSize }) => {
                const result = await config.fetch(cursor, pageSize);
                return {
                    items: result.data,
                    nextCursor: result.nextCursor
                };
            }
        });
    }
}

// ============================================================
// GLOBAL EXPOSURE
// ============================================================
if (typeof window !== 'undefined') {
    window.InfiniteScroll = InfiniteScroll;
}

// ============================================================
// EXPORT
// ============================================================
export default InfiniteScroll;