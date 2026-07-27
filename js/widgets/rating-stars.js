// Rating Stars
// ============================================================
// FILE: js/widgets/rating-stars.js
// PURPOSE: Star rating display and interaction component
// DEPENDENCY: constants.js
// USED BY: product-card.js, product-detail.js
// ============================================================

import { APP_CONSTANTS } from '../utils/constants.js';

/**
 * RatingStars Class - Renders interactive or static star ratings
 * 
 * Features:
 * - Static display mode (read-only)
 * - Interactive mode (user can rate)
 * - Half-star support (0.5 increments)
 * - Customizable number of stars (default 5)
 * - Customizable star size
 * - Hover preview in interactive mode
 * - Accessibility (keyboard navigation, ARIA labels)
 * - Event callbacks (onRate, onHover)
 * - Custom colors for filled/empty stars
 * - Animation on interaction
 * 
 * Usage:
 *   // Static display
 *   const stars = new RatingStars({
 *     rating: 4.5,
 *     maxStars: 5,
 *     readonly: true,
 *     size: 24
 *   });
 *   container.appendChild(stars.render());
 * 
 *   // Interactive
 *   const stars = new RatingStars({
 *     rating: 0,
 *     maxStars: 5,
 *     readonly: false,
 *     size: 32,
 *     onRate: (rating) => console.log('Rated:', rating)
 *   });
 *   container.appendChild(stars.render());
 */
export class RatingStars {
    /**
     * Default configuration
     * @private
     * @static
     */
    static #defaultConfig = {
        rating: 0,              // Current rating (0-5)
        maxStars: 5,            // Maximum number of stars
        size: 24,               // Star size in pixels
        readonly: false,        // Read-only mode
        halfStars: true,        // Allow half-star ratings
        colorFilled: '#f59e0b', // Filled star color (gold)
        colorEmpty: '#d1d5db',  // Empty star color (gray)
        colorHover: '#fbbf24',  // Hover star color
        animation: true,        // Enable animation on interaction
        animationDuration: 200, // Animation duration in ms
        showLabel: true,        // Show rating label (e.g., "4.5/5")
        labelFormat: '{rating} / {max}', // Label format
        ariaLabel: 'Rating: {rating} out of {max} stars', // ARIA label
        className: '',          // Additional CSS class
        onRate: null,           // Callback when rating changes
        onHover: null           // Callback when hovering over stars
    };

    /**
     * Star SVG template
     * @private
     * @static
     */
    static #starSVG = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
    `;

    /**
     * Constructor
     * @param {Object} config - Configuration object
     */
    constructor(config = {}) {
        this.config = {
            ...RatingStars.#defaultConfig,
            ...config
        };

        // Validate config
        this._validateConfig();

        // Private state
        this._currentRating = this.config.rating;
        this._hoverRating = 0;
        this._isHovering = false;
        this._isDestroyed = false;
        this._starElements = [];
        this._container = null;

        // Bind methods
        this._handleClick = this._handleClick.bind(this);
        this._handleMouseEnter = this._handleMouseEnter.bind(this);
        this._handleMouseLeave = this._handleMouseLeave.bind(this);
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._handleTouch = this._handleTouch.bind(this);
    }

    /**
     * Validate configuration
     * @private
     */
    _validateConfig() {
        if (this.config.maxStars < 1) {
            this.config.maxStars = 1;
        }
        if (this.config.rating < 0) {
            this.config.rating = 0;
        }
        if (this.config.rating > this.config.maxStars) {
            this.config.rating = this.config.maxStars;
        }
        if (this.config.size < 8) {
            this.config.size = 8;
        }
        if (this.config.size > 80) {
            this.config.size = 80;
        }
    }

    /**
     * Render the rating stars component
     * @public
     * @returns {HTMLElement} Container element
     */
    render() {
        if (this._isDestroyed) return null;

        // Create container
        this._container = document.createElement('div');
        this._container.className = 'rating-stars-container';
        if (this.config.className) {
            this._container.classList.add(this.config.className);
        }

        // Apply styles
        Object.assign(this._container.style, {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'inherit',
            cursor: this.config.readonly ? 'default' : 'pointer',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            position: 'relative'
        });

        // Set ARIA attributes
        this._container.setAttribute('role', 'img');
        this._container.setAttribute('aria-label', this._getAriaLabel());

        // Create stars wrapper
        const starsWrapper = document.createElement('div');
        starsWrapper.className = 'rating-stars-wrapper';
        Object.assign(starsWrapper.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
        });

        // Create stars
        this._starElements = [];
        for (let i = 0; i < this.config.maxStars; i++) {
            const star = this._createStar(i);
            starsWrapper.appendChild(star);
            this._starElements.push(star);
        }

        this._container.appendChild(starsWrapper);

        // Add label if enabled
        if (this.config.showLabel) {
            const label = this._createLabel();
            this._container.appendChild(label);
            this._labelElement = label;
        }

        // Update stars with current rating
        this._updateStars(this._currentRating);

        // Bind events if not readonly
        if (!this.config.readonly) {
            this._bindEvents();
        }

        // Add to DOM for measurements if needed
        if (this.config.animation) {
            this._container.style.transition = 'transform 0.2s ease';
        }

        return this._container;
    }

    /**
     * Create a single star element
     * @private
     * @param {number} index - Star index (0-based)
     * @returns {HTMLElement} Star element
     */
    _createStar(index) {
        const star = document.createElement('div');
        star.className = 'rating-star';
        star.dataset.index = index;
        star.dataset.value = index + 1;

        // Apply styles
        const size = this.config.size;
        Object.assign(star.style, {
            width: `${size}px`,
            height: `${size}px`,
            display: 'inline-block',
            position: 'relative',
            flexShrink: '0',
            transition: this.config.animation ? 
                `transform ${this.config.animationDuration}ms ease, opacity ${this.config.animationDuration}ms ease` : 
                'none'
        });

        // Add star SVG
        const starSVG = document.createElement('div');
        starSVG.className = 'star-svg';
        starSVG.innerHTML = RatingStars.#starSVG;
        Object.assign(starSVG.style, {
            width: '100%',
            height: '100%',
            display: 'block',
            pointerEvents: 'none'
        });

        // Apply fill color
        const path = starSVG.querySelector('path');
        if (path) {
            const isFilled = (index + 1) <= Math.round(this._currentRating);
            path.setAttribute('fill', isFilled ? this.config.colorFilled : this.config.colorEmpty);
            path.setAttribute('stroke', isFilled ? this.config.colorFilled : this.config.colorEmpty);
            path.setAttribute('stroke-width', '0.5');
        }

        star.appendChild(starSVG);

        // Add half-star overlay if needed
        if (this.config.halfStars) {
            const halfOverlay = document.createElement('div');
            halfOverlay.className = 'star-half-overlay';
            Object.assign(halfOverlay.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '50%',
                height: '100%',
                overflow: 'hidden',
                pointerEvents: 'none',
                opacity: '0'
            });
            const halfSVG = document.createElement('div');
            halfSVG.innerHTML = RatingStars.#starSVG;
            Object.assign(halfSVG.style, {
                width: '100%',
                height: '100%',
                display: 'block',
                pointerEvents: 'none'
            });
            const halfPath = halfSVG.querySelector('path');
            if (halfPath) {
                halfPath.setAttribute('fill', this.config.colorFilled);
                halfPath.setAttribute('stroke', this.config.colorFilled);
                halfPath.setAttribute('stroke-width', '0.5');
            }
            halfOverlay.appendChild(halfSVG);
            star.appendChild(halfOverlay);
            star.dataset.hasHalf = 'true';
        }

        // Add accessibility
        star.setAttribute('role', 'button');
        star.setAttribute('tabindex', this.config.readonly ? '-1' : '0');
        star.setAttribute('aria-label', `Rate ${index + 1} out of ${this.config.maxStars} stars`);

        return star;
    }

    /**
     * Create rating label
     * @private
     * @returns {HTMLElement} Label element
     */
    _createLabel() {
        const label = document.createElement('span');
        label.className = 'rating-label';
        Object.assign(label.style, {
            marginLeft: '8px',
            fontSize: `${this.config.size * 0.6}px`,
            color: '#6b7280',
            fontWeight: '500',
            lineHeight: '1',
            whiteSpace: 'nowrap'
        });

        // Add dark mode support
        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            label.style.color = '#9ca3af';
        }

        this._updateLabel(label);
        return label;
    }

    /**
     * Update label text
     * @private
     * @param {HTMLElement} label - Label element
     */
    _updateLabel(label) {
        if (!label) return;
        const rating = this._currentRating;
        const max = this.config.maxStars;
        label.textContent = this.config.labelFormat
            .replace(/\{rating\}/g, rating.toFixed(1))
            .replace(/\{max\}/g, max);
    }

    /**
     * Get ARIA label
     * @private
     * @returns {string} ARIA label
     */
    _getAriaLabel() {
        return this.config.ariaLabel
            .replace(/\{rating\}/g, this._currentRating.toFixed(1))
            .replace(/\{max\}/g, this.config.maxStars);
    }

    /**
     * Update stars based on rating
     * @private
     * @param {number} rating - Current rating
     */
    _updateStars(rating) {
        const filledColor = this.config.colorFilled;
        const emptyColor = this.config.colorEmpty;
        const hoverColor = this.config.colorHover;

        let displayRating = rating;
        if (this._isHovering && this._hoverRating > 0) {
            displayRating = this._hoverRating;
        }

        this._starElements.forEach((star, index) => {
            const value = index + 1;
            const svg = star.querySelector('.star-svg');
            const path = svg ? svg.querySelector('path') : null;
            const halfOverlay = star.querySelector('.star-half-overlay');

            // Calculate fill percentage
            let fillPercentage = 0;
            if (displayRating >= value) {
                fillPercentage = 1;
            } else if (displayRating > index && displayRating < value) {
                fillPercentage = displayRating - index;
            }

            // Determine colors
            const isFilled = fillPercentage > 0;
            const color = this._isHovering && this._hoverRating > 0 && isFilled ? hoverColor : 
                          isFilled ? filledColor : emptyColor;

            // Update path
            if (path) {
                path.setAttribute('fill', color);
                path.setAttribute('stroke', color);
            }

            // Update half overlay
            if (halfOverlay) {
                if (fillPercentage > 0 && fillPercentage < 1) {
                    halfOverlay.style.opacity = '1';
                    halfOverlay.style.width = `${fillPercentage * 100}%`;
                    const halfPath = halfOverlay.querySelector('path');
                    if (halfPath) {
                        halfPath.setAttribute('fill', this._isHovering && this._hoverRating > 0 ? hoverColor : filledColor);
                        halfPath.setAttribute('stroke', this._isHovering && this._hoverRating > 0 ? hoverColor : filledColor);
                    }
                } else if (fillPercentage >= 1) {
                    halfOverlay.style.opacity = '0';
                } else {
                    halfOverlay.style.opacity = '0';
                }
            }

            // Apply hover transform
            if (this._isHovering && this._hoverRating >= value) {
                star.style.transform = 'scale(1.15)';
                star.style.opacity = '1';
            } else if (this._isHovering && this._hoverRating === value - 0.5) {
                star.style.transform = 'scale(1.08)';
                star.style.opacity = '1';
            } else {
                star.style.transform = 'scale(1)';
                star.style.opacity = '1';
            }

            // Update ARIA label
            star.setAttribute('aria-label', `Rate ${value} out of ${this.config.maxStars} stars`);

            // Update tabindex
            star.setAttribute('tabindex', this.config.readonly ? '-1' : '0');
        });

        // Update label
        if (this._labelElement) {
            this._updateLabel(this._labelElement);
        }

        // Update container ARIA label
        if (this._container) {
            this._container.setAttribute('aria-label', this._getAriaLabel());
        }
    }

    /**
     * Bind event listeners
     * @private
     */
    _bindEvents() {
        if (!this._container) return;

        // Click on stars
        this._container.addEventListener('click', this._handleClick);

        // Mouse events
        this._container.addEventListener('mouseenter', this._handleMouseEnter);
        this._container.addEventListener('mouseleave', this._handleMouseLeave);

        // Touch events
        this._container.addEventListener('touchstart', this._handleTouch, { passive: true });

        // Keyboard events on individual stars
        this._starElements.forEach(star => {
            star.addEventListener('keydown', this._handleKeyDown);
        });

        // Prevent context menu on long press
        this._container.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * Handle click on star
     * @private
     * @param {MouseEvent} e - Click event
     */
    _handleClick(e) {
        if (this.config.readonly) return;

        const star = e.target.closest('.rating-star');
        if (!star) return;

        const index = parseInt(star.dataset.index);
        const value = index + 1;

        // Calculate rating with half-star support
        let rating = value;
        if (this.config.halfStars) {
            const rect = star.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            if (x < 0.5) {
                rating = value - 0.5;
            }
        }

        // Cap rating
        if (rating < 0) rating = 0;
        if (rating > this.config.maxStars) rating = this.config.maxStars;

        this.setRating(rating);

        // Trigger click feedback
        if (this.config.animation) {
            star.style.transform = 'scale(0.85)';
            setTimeout(() => {
                star.style.transform = 'scale(1)';
            }, this.config.animationDuration);
        }
    }

    /**
     * Handle mouse enter on container
     * @private
     */
    _handleMouseEnter() {
        this._isHovering = true;
        this._container.style.cursor = this.config.readonly ? 'default' : 'pointer';
    }

    /**
     * Handle mouse leave from container
     * @private
     */
    _handleMouseLeave() {
        this._isHovering = false;
        this._hoverRating = 0;
        this._updateStars(this._currentRating);
        this._container.style.cursor = 'default';

        if (this.config.onHover) {
            this.config.onHover(0);
        }
    }

    /**
     * Handle touch on star
     * @private
     * @param {TouchEvent} e - Touch event
     */
    _handleTouch(e) {
        if (this.config.readonly) return;

        const touch = e.touches[0];
        if (!touch) return;

        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const star = element ? element.closest('.rating-star') : null;
        if (!star) return;

        const index = parseInt(star.dataset.index);
        const value = index + 1;
        let rating = value;

        if (this.config.halfStars) {
            const rect = star.getBoundingClientRect();
            const x = (touch.clientX - rect.left) / rect.width;
            if (x < 0.5) {
                rating = value - 0.5;
            }
        }

        this.setRating(rating);
    }

    /**
     * Handle keydown on star (keyboard navigation)
     * @private
     * @param {KeyboardEvent} e - Keyboard event
     */
    _handleKeyDown(e) {
        if (this.config.readonly) return;

        const star = e.currentTarget;
        const index = parseInt(star.dataset.index);
        const currentValue = index + 1;
        let newRating = this._currentRating;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowUp':
                e.preventDefault();
                newRating = Math.min(this.config.maxStars, Math.ceil(this._currentRating) + 0.5);
                break;
            case 'ArrowLeft':
            case 'ArrowDown':
                e.preventDefault();
                newRating = Math.max(0, Math.floor(this._currentRating) - 0.5);
                break;
            case 'Home':
                e.preventDefault();
                newRating = 0;
                break;
            case 'End':
                e.preventDefault();
                newRating = this.config.maxStars;
                break;
            case ' ':
            case 'Space':
            case 'Enter':
                e.preventDefault();
                this.setRating(currentValue);
                return;
            default:
                return;
        }

        this.setRating(newRating);
    }

    /**
     * Set rating value
     * @public
     * @param {number} rating - New rating
     * @param {boolean} triggerCallback - Whether to trigger callback
     * @returns {this} Chainable
     */
    setRating(rating, triggerCallback = true) {
        if (this._isDestroyed) return this;

        // Validate rating
        let newRating = Math.max(0, Math.min(this.config.maxStars, rating));
        
        // Round to nearest half if half-stars enabled
        if (this.config.halfStars) {
            newRating = Math.round(newRating * 2) / 2;
        } else {
            newRating = Math.round(newRating);
        }

        // Don't update if same
        if (newRating === this._currentRating) {
            // Still trigger callback if forced
            if (triggerCallback && this.config.onRate) {
                this.config.onRate(newRating);
            }
            return this;
        }

        // Update state
        this._currentRating = newRating;

        // Update UI
        this._updateStars(this._currentRating);

        // Trigger callback
        if (triggerCallback && this.config.onRate) {
            this.config.onRate(newRating);
        }

        return this;
    }

    /**
     * Get current rating
     * @public
     * @returns {number} Current rating
     */
    getRating() {
        return this._currentRating;
    }

    /**
     * Reset to initial rating
     * @public
     * @param {boolean} triggerCallback - Whether to trigger callback
     * @returns {this} Chainable
     */
    reset(triggerCallback = true) {
        return this.setRating(this.config.rating, triggerCallback);
    }

    /**
     * Make readonly or editable
     * @public
     * @param {boolean} readonly - Readonly state
     * @returns {this} Chainable
     */
    setReadonly(readonly) {
        this.config.readonly = readonly;
        this._starElements.forEach(star => {
            star.setAttribute('tabindex', readonly ? '-1' : '0');
        });
        this._container.style.cursor = readonly ? 'default' : 'pointer';
        return this;
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
        this._validateConfig();

        // Update rating if provided
        if (config.rating !== undefined) {
            this.setRating(config.rating);
        }

        // Update styles
        if (config.size) {
            const size = config.size;
            this._starElements.forEach(star => {
                star.style.width = `${size}px`;
                star.style.height = `${size}px`;
            });
        }

        if (config.colorFilled || config.colorEmpty) {
            this._updateStars(this._currentRating);
        }

        // Update label
        if (config.showLabel !== undefined) {
            if (config.showLabel && !this._labelElement) {
                const label = this._createLabel();
                this._container.appendChild(label);
                this._labelElement = label;
            } else if (!config.showLabel && this._labelElement) {
                this._labelElement.remove();
                this._labelElement = null;
            }
        }

        // Update ARIA label
        if (config.ariaLabel) {
            this._container.setAttribute('aria-label', this._getAriaLabel());
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
            this._container.removeEventListener('touchstart', this._handleTouch);
        }

        this._starElements.forEach(star => {
            star.removeEventListener('keydown', this._handleKeyDown);
        });

        // Remove from DOM
        if (this._container && this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }

        // Clear references
        this._container = null;
        this._starElements = [];
        this._labelElement = null;
    }

    /**
     * Create a static star rating display (factory method)
     * @public
     * @static
     * @param {number} rating - Rating value
     * @param {number} maxStars - Maximum stars
     * @param {number} size - Star size
     * @returns {RatingStars} RatingStars instance
     */
    static createStatic(rating, maxStars = 5, size = 20) {
        return new RatingStars({
            rating,
            maxStars,
            size,
            readonly: true,
            showLabel: true,
            animation: false
        });
    }

    /**
     * Create an interactive star rating (factory method)
     * @public
     * @static
     * @param {Object} options - Configuration options
     * @param {Function} onRate - Callback when rated
     * @returns {RatingStars} RatingStars instance
     */
    static createInteractive(options = {}, onRate = null) {
        return new RatingStars({
            rating: 0,
            maxStars: 5,
            size: 32,
            readonly: false,
            halfStars: true,
            showLabel: true,
            animation: true,
            onRate,
            ...options
        });
    }

    /**
     * Create a half-star rating display
     * @public
     * @static
     * @param {number} rating - Rating with half-stars (e.g., 4.5)
     * @param {number} maxStars - Maximum stars
     * @param {number} size - Star size
     * @returns {RatingStars} RatingStars instance
     */
    static createHalf(rating, maxStars = 5, size = 24) {
        return new RatingStars({
            rating,
            maxStars,
            size,
            readonly: true,
            halfStars: true,
            showLabel: true,
            animation: false
        });
    }
}

// ============================================================
// GLOBAL EXPOSURE
// ============================================================
if (typeof window !== 'undefined') {
    window.RatingStars = RatingStars;
}

// ============================================================
// EXPORT
// ============================================================
export default RatingStars;