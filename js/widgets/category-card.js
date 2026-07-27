// Category Card
// ============================================================
// FILE: js/widgets/category-card.js
// PURPOSE: Category card component for displaying category previews
// DEPENDENCY: category-model.js, store.js
// USED BY: home-screen.js, explore-screen.js
// ============================================================

import { Category } from '../models/category-model.js';
import { Store } from '../store.js';

/**
 * CategoryCard Class - Renders a category card with icon and name
 * 
 * Features:
 * - Displays category icon, name, and product count
 * - Click to navigate to category products
 * - Multiple sizes (small, medium, large)
 * - Featured categories with gradient backgrounds
 * - Hover animations
 * - Responsive design
 * - Accessibility support
 * - Skeleton loading state
 * - Customizable colors
 * - Event callbacks
 * 
 * Usage:
 *   const card = new CategoryCard({
 *     categoryId: 'tech',
 *     onClick: (categoryId) => router.navigate('/explore?category=' + categoryId)
 *   });
 *   container.appendChild(card.render());
 */
export class CategoryCard {
    /**
     * Default configuration
     * @private
     * @static
     */
    static #defaultConfig = {
        size: 'medium',          // small, medium, large
        showCount: true,         // Show product count
        showIcon: true,          // Show category icon
        animation: true,         // Hover animations
        gradient: false,         // Use gradient background
        skeleton: false,         // Show skeleton loading
        onClick: null,           // Click callback
        onHover: null            // Hover callback
    };

    /**
     * Category icon mapping (emoji fallbacks)
     * @private
     * @static
     */
    static #iconMap = {
        'technology': '💻',
        'electronics': '📱',
        'gaming': '🎮',
        'design': '🎨',
        'photography': '📷',
        'music': '🎵',
        'video': '🎬',
        'art': '🖼️',
        'fashion': '👕',
        'food': '🍕',
        'health': '💪',
        'fitness': '🏋️',
        'education': '📚',
        'books': '📖',
        'business': '💼',
        'finance': '💰',
        'travel': '✈️',
        'home': '🏠',
        'garden': '🌿',
        'sports': '⚽',
        'automotive': '🚗',
        'pets': '🐾',
        'kids': '🧸',
        'toys': '🎲',
        'tools': '🔧',
        'crafts': '🧶',
        'jewelry': '💎',
        'watches': '⌚',
        'bags': '👜',
        'shoes': '👟',
        'default': '📦'
    };

    /**
     * Gradient color schemes for categories
     * @private
     * @static
     */
    static #gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
        'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
        'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    ];

    /**
     * Constructor
     * @param {Object} config - Configuration object
     */
    constructor(config = {}) {
        this.config = {
            ...CategoryCard.#defaultConfig,
            ...config
        };

        // Validate category ID
        if (!this.config.categoryId) {
            throw new Error('CategoryCard: categoryId is required');
        }

        // Private state
        this._category = null;
        this._isDestroyed = false;
        this._container = null;
        this._elements = {};

        // Bind methods
        this._handleClick = this._handleClick.bind(this);
        this._handleMouseEnter = this._handleMouseEnter.bind(this);
        this._handleMouseLeave = this._handleMouseLeave.bind(this);
    }

    /**
     * Render the category card
     * @public
     * @returns {HTMLElement} Container element
     */
    render() {
        if (this._isDestroyed) return null;

        // Get category from store
        this._category = Store.getCategory(this.config.categoryId);

        // Create container
        this._container = document.createElement('div');
        this._container.className = 'category-card';
        this._container.dataset.categoryId = this.config.categoryId;
        this._container.setAttribute('role', 'button');
        this._container.setAttribute('tabindex', '0');
        this._container.setAttribute('aria-label', `Category: ${this._category?.name || 'Loading...'}`);

        // Apply size class
        this._container.classList.add(`category-card-${this.config.size}`);

        // Apply animation class
        if (this.config.animation) {
            this._container.classList.add('category-card-animated');
        }

        // Check if skeleton mode
        if (this.config.skeleton || !this._category) {
            this._renderSkeleton();
            return this._container;
        }

        // Build card
        this._buildCard();

        // Bind events
        this._bindEvents();

        return this._container;
    }

    /**
     * Build the category card
     * @private
     */
    _buildCard() {
        const category = this._category;
        if (!category) return;

        // Clear container
        this._container.innerHTML = '';

        // Get gradient index based on category ID
        const gradientIndex = this._getGradientIndex(category.id);
        const gradient = CategoryCard.#gradients[gradientIndex % CategoryCard.#gradients.length];

        // Create card inner
        const inner = document.createElement('div');
        inner.className = 'category-card-inner';
        Object.assign(inner.style, {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 16px',
            backgroundColor: this.config.gradient ? 'transparent' : '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            cursor: 'pointer',
            height: '100%',
            minHeight: this.config.size === 'large' ? '180px' : 
                       this.config.size === 'medium' ? '140px' : '100px',
            position: 'relative',
            overflow: 'hidden',
            textAlign: 'center',
            gap: '8px'
        });

        // Apply gradient if enabled
        if (this.config.gradient) {
            inner.style.background = gradient;
            inner.style.color = '#ffffff';
            inner.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
        }

        // Dark mode support (non-gradient only)
        if (!this.config.gradient && document.documentElement.getAttribute('data-theme') === 'dark') {
            inner.style.backgroundColor = '#1f2937';
            inner.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        }

        // --- Icon ---
        if (this.config.showIcon) {
            const iconWrapper = document.createElement('div');
            iconWrapper.className = 'category-card-icon';
            Object.assign(iconWrapper.style, {
                fontSize: this.config.size === 'large' ? '48px' :
                           this.config.size === 'medium' ? '36px' : '28px',
                lineHeight: '1',
                transition: 'transform 0.3s ease',
                marginBottom: '4px'
            });

            const icon = this._getCategoryIcon(category);
            iconWrapper.textContent = icon;

            // If gradient is enabled and icon is emoji, add slight shadow
            if (this.config.gradient) {
                iconWrapper.style.textShadow = '0 2px 8px rgba(0,0,0,0.2)';
            }

            inner.appendChild(iconWrapper);
            this._elements.icon = iconWrapper;
        }

        // --- Name ---
        const name = document.createElement('span');
        name.className = 'category-card-name';
        name.textContent = category.name || 'Unnamed';
        Object.assign(name.style, {
            fontSize: this.config.size === 'large' ? '18px' :
                      this.config.size === 'medium' ? '15px' : '13px',
            fontWeight: '600',
            color: this.config.gradient ? '#ffffff' : '#1a1a2e',
            lineHeight: '1.3',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        });

        if (!this.config.gradient && document.documentElement.getAttribute('data-theme') === 'dark') {
            name.style.color = '#f3f4f6';
        }

        inner.appendChild(name);

        // --- Count ---
        if (this.config.showCount && category.productCount !== undefined) {
            const count = document.createElement('span');
            count.className = 'category-card-count';
            count.textContent = `${category.productCount || 0} products`;
            Object.assign(count.style, {
                fontSize: '12px',
                color: this.config.gradient ? 'rgba(255,255,255,0.8)' : '#6b7280',
                marginTop: '2px'
            });

            if (!this.config.gradient && document.documentElement.getAttribute('data-theme') === 'dark') {
                count.style.color = '#9ca3af';
            }

            inner.appendChild(count);
            this._elements.count = count;
        }

        this._container.appendChild(inner);
        this._elements.inner = inner;

        // Add hover effects
        if (this.config.animation) {
            inner.addEventListener('mouseenter', () => {
                inner.style.transform = 'translateY(-4px) scale(1.02)';
                inner.style.boxShadow = this.config.gradient ?
                    '0 8px 30px rgba(0,0,0,0.2)' :
                    '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)';
                if (this._elements.icon) {
                    this._elements.icon.style.transform = 'scale(1.1)';
                }
            });
            inner.addEventListener('mouseleave', () => {
                inner.style.transform = 'translateY(0) scale(1)';
                inner.style.boxShadow = this.config.gradient ?
                    '0 4px 15px rgba(0,0,0,0.1)' :
                    '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';
                if (this._elements.icon) {
                    this._elements.icon.style.transform = 'scale(1)';
                }
            });
        }
    }

    /**
     * Get category icon
     * @private
     * @param {Category} category - Category object
     * @returns {string} Icon character
     */
    _getCategoryIcon(category) {
        // If category has custom icon
        if (category.icon) {
            return category.icon;
        }

        // Try to match by name/slug
        const name = (category.name || '').toLowerCase();
        const slug = (category.slug || '').toLowerCase();

        // Check for exact matches
        const iconMap = CategoryCard.#iconMap;
        for (const [key, value] of Object.entries(iconMap)) {
            if (name.includes(key) || slug.includes(key)) {
                return value;
            }
        }

        // Try by first letter
        const firstChar = name.charAt(0).toUpperCase();
        if (firstChar.match(/[A-Z]/)) {
            return firstChar;
        }

        return iconMap.default || '📦';
    }

    /**
     * Get gradient index based on category ID
     * @private
     * @param {string} id - Category ID
     * @returns {number} Gradient index
     */
    _getGradientIndex(id) {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash);
    }

    /**
     * Render skeleton loading state
     * @private
     */
    _renderSkeleton() {
        this._container.innerHTML = '';
        this._container.className = 'category-card category-card-skeleton';

        const inner = document.createElement('div');
        Object.assign(inner.style, {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 16px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            height: '100%',
            minHeight: this.config.size === 'large' ? '180px' :
                       this.config.size === 'medium' ? '140px' : '100px',
            gap: '8px'
        });

        // Icon skeleton
        const iconSkel = document.createElement('div');
        Object.assign(iconSkel.style, {
            width: this.config.size === 'large' ? '48px' :
                   this.config.size === 'medium' ? '36px' : '28px',
            height: this.config.size === 'large' ? '48px' :
                    this.config.size === 'medium' ? '36px' : '28px',
            borderRadius: '50%',
            backgroundColor: '#e5e7eb',
            animation: 'pulse 1.5s ease-in-out infinite',
            flexShrink: '0'
        });
        inner.appendChild(iconSkel);

        // Name skeleton
        const nameSkel = document.createElement('div');
        Object.assign(nameSkel.style, {
            height: this.config.size === 'large' ? '20px' :
                    this.config.size === 'medium' ? '16px' : '14px',
            width: '70%',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            animation: 'pulse 1.5s ease-in-out infinite',
            marginTop: '4px'
        });
        inner.appendChild(nameSkel);

        // Count skeleton
        if (this.config.showCount) {
            const countSkel = document.createElement('div');
            Object.assign(countSkel.style, {
                height: '12px',
                width: '50%',
                backgroundColor: '#e5e7eb',
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite',
                marginTop: '2px'
            });
            inner.appendChild(countSkel);
        }

        this._container.appendChild(inner);

        // Add pulse animation if not exists
        if (!document.getElementById('skeleton-keyframes')) {
            const style = document.createElement('style');
            style.id = 'skeleton-keyframes';
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Handle click on card
     * @private
     */
    _handleClick(e) {
        if (this._isDestroyed) return;

        if (this.config.onClick && typeof this.config.onClick === 'function') {
            this.config.onClick(this.config.categoryId, this._category);
        }

        // Emit event via store if available
        if (Store && Store.emit) {
            Store.emit('category:click', {
                categoryId: this.config.categoryId,
                category: this._category
            });
        }
    }

    /**
     * Handle mouse enter
     * @private
     */
    _handleMouseEnter() {
        if (this.config.onHover && typeof this.config.onHover === 'function') {
            this.config.onHover(this.config.categoryId, true);
        }
    }

    /**
     * Handle mouse leave
     * @private
     */
    _handleMouseLeave() {
        if (this.config.onHover && typeof this.config.onHover === 'function') {
            this.config.onHover(this.config.categoryId, false);
        }
    }

    /**
     * Bind event listeners
     * @private
     */
    _bindEvents() {
        if (this._container) {
            this._container.addEventListener('click', this._handleClick);
            this._container.addEventListener('mouseenter', this._handleMouseEnter);
            this._container.addEventListener('mouseleave', this._handleMouseLeave);

            // Keyboard support
            this._container.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this._handleClick(e);
                }
            });
        }
    }

    /**
     * Update category data
     * @public
     * @param {string} categoryId - New category ID
     * @returns {this} Chainable
     */
    updateCategory(categoryId) {
        if (this._isDestroyed) return this;

        if (categoryId) {
            this.config.categoryId = categoryId;
            this._category = Store.getCategory(categoryId);
        } else {
            this._category = Store.getCategory(this.config.categoryId);
        }

        if (this._category) {
            this._buildCard();
            this._bindEvents();
        } else {
            this._renderSkeleton();
        }

        return this;
    }

    /**
     * Get category data
     * @public
     * @returns {Category|null} Category object
     */
    getCategory() {
        return this._category;
    }

    /**
     * Show skeleton loading
     * @public
     * @returns {this} Chainable
     */
    showSkeleton() {
        if (this._isDestroyed) return this;
        this._renderSkeleton();
        return this;
    }

    /**
     * Hide skeleton and show content
     * @public
     * @returns {this} Chainable
     */
    hideSkeleton() {
        if (this._isDestroyed) return this;
        if (this._category) {
            this._buildCard();
            this._bindEvents();
        }
        return this;
    }

    /**
     * Set gradient mode
     * @public
     * @param {boolean} enabled - Enable gradient
     * @returns {this} Chainable
     */
    setGradient(enabled) {
        this.config.gradient = enabled;
        if (this._category) {
            this._buildCard();
            this._bindEvents();
        }
        return this;
    }

    /**
     * Set size
     * @public
     * @param {string} size - Size (small, medium, large)
     * @returns {this} Chainable
     */
    setSize(size) {
        if (['small', 'medium', 'large'].includes(size)) {
            this.config.size = size;
            if (this._category) {
                this._buildCard();
                this._bindEvents();
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

        // Remove event listeners
        if (this._container) {
            this._container.removeEventListener('click', this._handleClick);
            this._container.removeEventListener('mouseenter', this._handleMouseEnter);
            this._container.removeEventListener('mouseleave', this._handleMouseLeave);
        }

        // Remove from DOM
        if (this._container && this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }

        // Clear references
        this._container = null;
        this._elements = {};
        this._category = null;
    }

    /**
     * Create a category card from category data (factory method)
     * @public
     * @static
     * @param {Object} categoryData - Category data
     * @param {Object} config - Card configuration
     * @returns {CategoryCard} CategoryCard instance
     */
    static fromCategory(categoryData, config = {}) {
        if (categoryData.id) {
            Store.addCategory(categoryData);
            return new CategoryCard({
                categoryId: categoryData.id,
                ...config
            });
        }
        throw new Error('CategoryCard: category data must have an id');
    }

    /**
     * Create multiple category cards (factory method)
     * @public
     * @static
     * @param {Array<string>} categoryIds - Array of category IDs
     * @param {Object} config - Card configuration
     * @returns {Array<CategoryCard>} Array of CategoryCard instances
     */
    static createMany(categoryIds, config = {}) {
        return categoryIds.map(id => new CategoryCard({
            categoryId: id,
            ...config
        }));
    }

    /**
     * Get default icon for a category name
     * @public
     * @static
     * @param {string} name - Category name
     * @returns {string} Icon character
     */
    static getIconForName(name) {
        const lowercase = (name || '').toLowerCase();
        for (const [key, value] of Object.entries(CategoryCard.#iconMap)) {
            if (lowercase.includes(key)) {
                return value;
            }
        }
        return CategoryCard.#iconMap.default || '📦';
    }

    /**
     * Get a gradient for a category ID
     * @public
     * @static
     * @param {string} id - Category ID
     * @returns {string} CSS gradient
     */
    static getGradientForId(id) {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % CategoryCard.#gradients.length;
        return CategoryCard.#gradients[index];
    }
}

// ============================================================
// GLOBAL EXPOSURE
// ============================================================
if (typeof window !== 'undefined') {
    window.CategoryCard = CategoryCard;
}

// ============================================================
// EXPORT
// ============================================================
export default CategoryCard;