// ============================================================
// FILE: js/widgets/loading-spinner.js
// PURPOSE: Premium Loading Spinner Component - 10 Styles
// DEPENDENCY: constants.js, theme.js
// USED BY: All screens, components, services
// VERSION: 6.0.1 - ULTRA PRODUCTION (SYNTAX FIXED)
// ============================================================

import { APP_CONSTANTS } from '../utils/constants.js';
import { themeManager } from '../utils/theme.js';

/**
 * LoadingSpinner - Ultimate Loading Component
 * 
 * 🔥 FEATURES:
 * ✅ 10 Spinner Types (Circle, Dots, Ripple, Pulse, Wave, Grid, Ring, Bars, Square, Heart)
 * ✅ 6 Size Variants (xs, sm, md, lg, xl, xxl)
 * ✅ 9 Color Variants
 * ✅ Custom Animation Speed
 * ✅ Full Screen Overlay
 * ✅ Container Overlay
 * ✅ Inline Loading
 * ✅ Progress Support
 * ✅ Text Support
 * ✅ Accessibility
 * ✅ Dark/Light Theme Support
 * ✅ Responsive
 * ✅ GPU Accelerated
 * ✅ Production Ready
 */
export class LoadingSpinner {
    /**
     * Spinner Types
     */
    static get TYPES() {
        return {
            CIRCLE: 'circle',
            DOTS: 'dots',
            RIPPLE: 'ripple',
            PULSE: 'pulse',
            WAVE: 'wave',
            GRID: 'grid',
            RING: 'ring',
            BARS: 'bars',
            SQUARE: 'square',
            HEART: 'heart'
        };
    }

    /**
     * Size Variants
     */
    static get SIZES() {
        return {
            XS: 'xs',
            SM: 'sm',
            MD: 'md',
            LG: 'lg',
            XL: 'xl',
            XXL: 'xxl'
        };
    }

    /**
     * Color Variants
     */
    static get COLORS() {
        return {
            PRIMARY: 'primary',
            SECONDARY: 'secondary',
            SUCCESS: 'success',
            DANGER: 'danger',
            WARNING: 'warning',
            INFO: 'info',
            LIGHT: 'light',
            DARK: 'dark',
            WHITE: 'white'
        };
    }

    /**
     * Size Mapping
     */
    static get SIZE_MAP() {
        return {
            xs: { width: 16, height: 16, borderWidth: 2, fontSize: 10, gap: 2 },
            sm: { width: 24, height: 24, borderWidth: 3, fontSize: 12, gap: 3 },
            md: { width: 40, height: 40, borderWidth: 4, fontSize: 14, gap: 4 },
            lg: { width: 56, height: 56, borderWidth: 5, fontSize: 16, gap: 5 },
            xl: { width: 72, height: 72, borderWidth: 6, fontSize: 18, gap: 6 },
            xxl: { width: 96, height: 96, borderWidth: 8, fontSize: 22, gap: 8 }
        };
    }

    /**
     * Color Mapping
     */
    static get COLOR_MAP() {
        return {
            primary: '#6366f1',
            secondary: '#6b7280',
            success: '#22c55e',
            danger: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6',
            light: '#f3f4f6',
            dark: '#1f2937',
            white: '#ffffff'
        };
    }

    /**
     * Constructor
     */
    constructor(options = {}) {
        this.options = {
            type: options.type || 'circle',
            size: options.size || 'md',
            color: options.color || 'primary',
            speed: options.speed || 1,
            text: options.text || '',
            progress: options.progress || 0,
            overlay: options.overlay || false,
            overlayColor: options.overlayColor || 'rgba(0,0,0,0.6)',
            overlayBlur: options.overlayBlur || '4px',
            fullScreen: options.fullScreen || false,
            className: options.className || '',
            zIndex: options.zIndex || 9999,
            ariaLabel: options.ariaLabel || 'Loading...',
            showText: options.showText !== undefined ? options.showText : true,
            showProgress: options.showProgress || false,
            animationDuration: options.animationDuration || 0.6,
            delay: options.delay || 0,
            position: options.position || 'center',
            container: options.container || null,
            onShow: options.onShow || null,
            onHide: options.onHide || null
        };

        this._element = null;
        this._overlayElement = null;
        this._progressInterval = null;
        this._isVisible = false;
        this._container = null;
        this._timeout = null;
        this._id = this._generateId();
    }

    /**
     * Generate Unique ID
     */
    _generateId() {
        return 'spinner_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }

    /**
     * Get Color Value
     */
    _getColor() {
        const colorMap = LoadingSpinner.COLOR_MAP;
        const color = colorMap[this.options.color];
        if (color) return color;
        if (typeof this.options.color === 'string' && this.options.color.startsWith('#')) {
            return this.options.color;
        }
        if (typeof this.options.color === 'string' && this.options.color.startsWith('rgb')) {
            return this.options.color;
        }
        return colorMap.primary;
    }

    /**
     * Get Text Color
     */
    _getTextColor() {
        const color = this._getColor();
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        if (this.options.color === 'white') return '#ffffff';
        if (this.options.color === 'light') {
            return isDark ? '#f3f4f6' : '#6b7280';
        }
        if (this.options.color === 'dark') {
            return isDark ? '#f3f4f6' : '#1f2937';
        }
        return color;
    }

    /**
     * Get Size
     */
    _getSize() {
        const sizeMap = LoadingSpinner.SIZE_MAP;
        return sizeMap[this.options.size] || sizeMap.md;
    }

    /**
     * Create and Render Spinner
     */
    render(container = null) {
        this._container = container || this.options.container || document.body;
        
        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.id = this._id;
        wrapper.className = 'loading-spinner-wrapper';
        wrapper.setAttribute('role', 'status');
        wrapper.setAttribute('aria-label', this.options.ariaLabel);
        wrapper.setAttribute('aria-live', 'polite');
        
        // Apply wrapper styles
        Object.assign(wrapper.style, this._getWrapperStyles());

        // Create spinner container
        const spinnerContainer = document.createElement('div');
        spinnerContainer.className = 'loading-spinner-container';
        Object.assign(spinnerContainer.style, this._getSpinnerContainerStyles());

        // Create spinner element
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner loading-spinner-' + this.options.type;
        Object.assign(spinner.style, this._getSpinnerStyles());
        
        // Add spinner content based on type
        spinner.innerHTML = this._getSpinnerHTML();

        spinnerContainer.appendChild(spinner);
        wrapper.appendChild(spinnerContainer);

        // Add text if provided
        if (this.options.text && this.options.showText) {
            const textEl = document.createElement('div');
            textEl.className = 'loading-spinner-text';
            textEl.textContent = this.options.text;
            Object.assign(textEl.style, this._getTextStyles());
            wrapper.appendChild(textEl);
        }

        // Add progress if enabled
        if (this.options.showProgress) {
            const progressEl = this._createProgressElement();
            wrapper.appendChild(progressEl);
        }

        // Create overlay if needed
        if (this.options.overlay || this.options.fullScreen) {
            this._createOverlay(wrapper);
        }

        this._element = wrapper;
        
        // Apply delay if specified
        if (this.options.delay > 0) {
            wrapper.style.opacity = '0';
            this._timeout = setTimeout(() => {
                wrapper.style.opacity = '1';
                wrapper.style.transition = 'opacity 0.3s ease';
            }, this.options.delay);
        }

        if (this._container) {
            this._container.appendChild(wrapper);
        }

        this._isVisible = true;

        if (this.options.onShow) {
            this.options.onShow(this);
        }

        return wrapper;
    }

    /**
     * Create Progress Element
     */
    _createProgressElement() {
        const progressEl = document.createElement('div');
        progressEl.className = 'loading-spinner-progress';
        Object.assign(progressEl.style, this._getProgressStyles());
        
        const progressColor = this._getColor();
        const progress = Math.min(100, Math.max(0, this.options.progress));
        
        progressEl.innerHTML = `
            <div class="progress-track" style="background: ${progressColor}22; border-radius: 10px; height: 6px; overflow: hidden; width: 100%;">
                <div class="progress-bar" style="width: ${progress}%; height: 100%; background: ${progressColor}; transition: width 0.3s ease; border-radius: 10px;"></div>
            </div>
            <span class="progress-text" style="color: ${this._getTextColor()}; font-size: 14px; font-weight: 500; margin-top: 4px; display: block; text-align: center;">
                ${Math.round(progress)}%
            </span>
        `;
        
        return progressEl;
    }

    /**
     * Create Overlay
     */
    _createOverlay(wrapper) {
        const overlay = document.createElement('div');
        overlay.className = 'loading-spinner-overlay';
        Object.assign(overlay.style, this._getOverlayStyles());
        overlay.appendChild(wrapper);
        
        this._overlayElement = overlay;
        this._element = overlay;
    }

    /**
     * Get Wrapper Styles
     */
    _getWrapperStyles() {
        const size = this._getSize();
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        let justifyContent = 'center';
        let alignItems = 'center';
        let paddingTop = '0';
        let paddingBottom = '0';
        let position = 'relative';
        let inset = 'auto';
        
        if (this.options.fullScreen || this.options.overlay) {
            position = 'fixed';
            inset = '0';
        } else {
            position = 'relative';
            inset = 'auto';
        }

        if (this.options.position === 'top') {
            alignItems = 'flex-start';
            paddingTop = '40px';
        } else if (this.options.position === 'bottom') {
            alignItems = 'flex-end';
            paddingBottom = '40px';
        }

        const styles = {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: justifyContent,
            gap: size.fontSize + 'px',
            position: position,
            zIndex: this.options.zIndex,
            animation: 'loadingFadeIn 0.3s ease'
        };

        if (this.options.fullScreen || this.options.overlay) {
            styles.top = '0';
            styles.left = '0';
            styles.right = '0';
            styles.bottom = '0';
        } else {
            styles.padding = '20px';
        }

        if (this.options.className) {
            styles.className = this.options.className;
        }

        return styles;
    }

    /**
     * Get Spinner Container Styles
     */
    _getSpinnerContainerStyles() {
        const size = this._getSize();
        
        return {
            width: size.width + 'px',
            height: size.height + 'px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            flexShrink: '0'
        };
    }

    /**
     * Get Spinner Styles
     */
    _getSpinnerStyles() {
        const size = this._getSize();
        const duration = this.options.animationDuration || 0.6;
        const speed = this.options.speed || 1;
        
        return {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            animationDuration: (duration / speed) + 's'
        };
    }

    /**
     * Get Overlay Styles
     */
    _getOverlayStyles() {
        return {
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: this.options.overlayColor,
            backdropFilter: 'blur(' + this.options.overlayBlur + ')',
            WebkitBackdropFilter: 'blur(' + this.options.overlayBlur + ')',
            zIndex: this.options.zIndex,
            animation: 'loadingFadeIn 0.3s ease'
        };
    }

    /**
     * Get Text Styles
     */
    _getTextStyles() {
        const size = this._getSize();
        const color = this._getTextColor();
        
        return {
            fontSize: size.fontSize + 'px',
            color: color,
            fontWeight: '500',
            fontFamily: (APP_CONSTANTS && APP_CONSTANTS.FONT_FAMILY) ? APP_CONSTANTS.FONT_FAMILY : 'Poppins, sans-serif',
            textAlign: 'center',
            marginTop: '8px',
            animation: 'loadingPulse 1.5s ease-in-out infinite',
            letterSpacing: '0.5px',
            maxWidth: '300px',
            lineHeight: '1.5'
        };
    }

    /**
     * Get Progress Styles
     */
    _getProgressStyles() {
        return {
            width: '200px',
            maxWidth: '80%',
            marginTop: '8px'
        };
    }

    /**
     * Get Spinner HTML based on type
     */
    _getSpinnerHTML() {
        const size = this._getSize();
        const color = this._getColor();
        const borderWidth = size.borderWidth || 4;
        const duration = this.options.animationDuration || 0.6;
        const speed = this.options.speed || 1;

        switch (this.options.type) {
            case 'circle':
                return this._getCircleHTML(color, borderWidth, duration, speed);
            case 'dots':
                return this._getDotsHTML(color, size, duration, speed);
            case 'ripple':
                return this._getRippleHTML(color, size, duration, speed);
            case 'pulse':
                return this._getPulseHTML(color, size, duration, speed);
            case 'wave':
                return this._getWaveHTML(color, size, duration, speed);
            case 'grid':
                return this._getGridHTML(color, size, duration, speed);
            case 'ring':
                return this._getRingHTML(color, size, duration, speed);
            case 'bars':
                return this._getBarsHTML(color, size, duration, speed);
            case 'square':
                return this._getSquareHTML(color, size, duration, speed);
            case 'heart':
                return this._getHeartHTML(color, size, duration, speed);
            default:
                return this._getCircleHTML(color, borderWidth, duration, speed);
        }
    }

    /**
     * Circle Spinner
     */
    _getCircleHTML(color, borderWidth, duration, speed) {
        const size = this._getSize();
        const w = size.width;
        const h = size.height;
        const r = (w / 2) - borderWidth;
        const dashArray = (w - borderWidth) * 1.5;
        const durationVal = duration / speed;
        
        return `
            <svg viewBox="0 0 ${w} ${h}" style="width: 100%; height: 100%; animation: spin ${durationVal}s linear infinite;">
                <circle cx="${w / 2}" cy="${h / 2}" r="${r}" 
                        fill="none" 
                        stroke="${color}" 
                        stroke-width="${borderWidth}" 
                        stroke-dasharray="${dashArray} ${dashArray}" 
                        stroke-linecap="round"
                        style="animation: dash ${durationVal * 1.5}s ease-in-out infinite;">
                </circle>
            </svg>
            <style>
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes dash {
                    0% { stroke-dasharray: 1, ${dashArray}; stroke-dashoffset: 0; }
                    50% { stroke-dasharray: ${(w - borderWidth) * 0.8}, ${dashArray}; stroke-dashoffset: -${(w - borderWidth) * 0.2}; }
                    100% { stroke-dasharray: ${(w - borderWidth) * 0.8}, ${dashArray}; stroke-dashoffset: -${dashArray}; }
                }
            </style>
        `;
    }

    /**
     * Dots Spinner
     */
    _getDotsHTML(color, size, duration, speed) {
        const dotSize = size.width / 5;
        const gap = size.gap || 4;
        const durationVal = duration / speed;
        
        return `
            <div class="dots-container" style="display: flex; gap: ${gap}px; align-items: center; justify-content: center; width: 100%; height: 100%;">
                ${[0, 1, 2].map(function(i) {
                    return `<div class="dot" style="
                        width: ${dotSize}px;
                        height: ${dotSize}px;
                        border-radius: 50%;
                        background: ${color};
                        animation: dotPulse ${durationVal * 1.5}s ease-in-out infinite;
                        animation-delay: ${i * 0.15}s;
                    "></div>`;
                }).join('')}
            </div>
            <style>
                @keyframes dotPulse {
                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                    40% { transform: scale(1); opacity: 1; }
                }
            </style>
        `;
    }

    /**
     * Ripple Spinner
     */
    _getRippleHTML(color, size, duration, speed) {
        const rippleSize = size.width / 2;
        const durationVal = duration / speed;
        const borderW = size.borderWidth || 3;
        
        return `
            <div class="ripple-container" style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                ${[0, 1, 2].map(function(i) {
                    return `<div class="ripple" style="
                        position: absolute;
                        width: ${rippleSize}px;
                        height: ${rippleSize}px;
                        border-radius: 50%;
                        border: ${borderW}px solid ${color};
                        animation: rippleEffect ${durationVal * 1.5}s ease-out infinite;
                        animation-delay: ${i * 0.3}s;
                        opacity: 0;
                    "></div>`;
                }).join('')}
            </div>
            <style>
                @keyframes rippleEffect {
                    0% { transform: scale(0.2); opacity: 1; }
                    100% { transform: scale(1.8); opacity: 0; }
                }
            </style>
        `;
    }

    /**
     * Pulse Spinner
     */
    _getPulseHTML(color, size, duration, speed) {
        const pulseSize = size.width * 0.6;
        const durationVal = duration / speed;
        
        return `
            <div class="pulse-container" style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                <div class="pulse" style="
                    width: ${pulseSize}px;
                    height: ${pulseSize}px;
                    border-radius: 50%;
                    background: ${color};
                    animation: pulseScale ${durationVal * 1.2}s ease-in-out infinite;
                    box-shadow: 0 0 20px ${color}44, 0 0 60px ${color}22;
                "></div>
            </div>
            <style>
                @keyframes pulseScale {
                    0%, 100% { transform: scale(0.8); opacity: 0.6; }
                    50% { transform: scale(1.2); opacity: 1; }
                }
            </style>
        `;
    }

    /**
     * Wave Spinner
     */
    _getWaveHTML(color, size, duration, speed) {
        const barWidth = size.width / 10;
        const barHeight = size.height * 0.6;
        const gap = size.gap || 3;
        const durationVal = duration / speed;
        
        return `
            <div class="wave-container" style="display: flex; gap: ${gap}px; align-items: center; justify-content: center; width: 100%; height: 100%;">
                ${[0, 1, 2, 3, 4].map(function(i) {
                    return `<div class="wave-bar" style="
                        width: ${barWidth}px;
                        height: ${barHeight}px;
                        background: ${color};
                        border-radius: 4px;
                        animation: waveBounce ${durationVal * 1.2}s ease-in-out infinite;
                        animation-delay: ${i * 0.1}s;
                        transform-origin: bottom;
                    "></div>`;
                }).join('')}
            </div>
            <style>
                @keyframes waveBounce {
                    0%, 100% { transform: scaleY(0.3); opacity: 0.4; }
                    50% { transform: scaleY(1); opacity: 1; }
                }
            </style>
        `;
    }

    /**
     * Grid Spinner
     */
    _getGridHTML(color, size, duration, speed) {
        const cellSize = size.width / 4;
        const gap = size.gap || 3;
        const durationVal = duration / speed;
        
        return `
            <div class="grid-container" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: ${gap}px; width: 100%; height: 100%;">
                ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(function(i) {
                    const row = Math.floor(i / 3);
                    const col = i % 3;
                    return `<div class="grid-cell" style="
                        border-radius: ${cellSize * 0.15}px;
                        background: ${color};
                        animation: gridPulse ${durationVal * 1.5}s ease-in-out infinite;
                        animation-delay: ${col * 0.1 + row * 0.1}s;
                        opacity: 0.3;
                    "></div>`;
                }).join('')}
            </div>
            <style>
                @keyframes gridPulse {
                    0%, 70%, 100% { transform: scale(0.6); opacity: 0.3; }
                    35% { transform: scale(1); opacity: 1; }
                }
            </style>
        `;
    }

    /**
     * Ring Spinner
     */
    _getRingHTML(color, size, duration, speed) {
        const ringSize = size.width * 0.8;
        const borderW = size.borderWidth || 3;
        const durationVal = duration / speed;
        
        return `
            <div class="ring-container" style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                <div class="ring" style="
                    width: ${ringSize}px;
                    height: ${ringSize}px;
                    border-radius: 50%;
                    border: ${borderW}px solid transparent;
                    border-top-color: ${color};
                    border-right-color: ${color}88;
                    animation: ringSpin ${durationVal * 1.2}s linear infinite;
                "></div>
                <div class="ring-inner" style="
                    position: absolute;
                    width: ${ringSize * 0.6}px;
                    height: ${ringSize * 0.6}px;
                    border-radius: 50%;
                    border: ${borderW}px solid transparent;
                    border-bottom-color: ${color}66;
                    border-left-color: ${color}44;
                    animation: ringSpin ${durationVal * 0.8}s linear infinite reverse;
                "></div>
            </div>
            <style>
                @keyframes ringSpin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }

    /**
     * Bars Spinner
     */
    _getBarsHTML(color, size, duration, speed) {
        const barCount = 12;
        const center = size.width / 2;
        const radius = size.width / 2 * 0.8;
        const durationVal = duration / speed;
        
        return `
            <div class="bars-container" style="position: relative; width: 100%; height: 100%;">
                ${Array.from({ length: barCount }, function(_, i) {
                    const angle = (i / barCount) * 360;
                    return `<div class="bar" style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        width: ${size.width * 0.08}px;
                        height: ${size.height * 0.3}px;
                        background: ${color};
                        border-radius: 2px;
                        transform: translate(-50%, -100%) rotate(${angle}deg) translateY(${-radius}px);
                        animation: barFade ${durationVal * 1.2}s ease-in-out infinite;
                        animation-delay: ${(i / barCount) * durationVal}s;
                        opacity: 0.1;
                    "></div>`;
                }).join('')}
            </div>
            <style>
                @keyframes barFade {
                    0%, 100% { opacity: 0.1; }
                    50% { opacity: 1; }
                }
            </style>
        `;
    }

    /**
     * Square Spinner
     */
    _getSquareHTML(color, size, duration, speed) {
        const squareSize = size.width * 0.4;
        const durationVal = duration / speed;
        const radiusVal = squareSize * 0.15;
        
        return `
            <div class="square-container" style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                <div class="square" style="
                    width: ${squareSize}px;
                    height: ${squareSize}px;
                    background: ${color};
                    border-radius: ${radiusVal}px;
                    animation: squareSpin ${durationVal * 1.5}s ease-in-out infinite;
                    box-shadow: 0 0 30px ${color}44;
                "></div>
            </div>
            <style>
                @keyframes squareSpin {
                    0%, 100% { transform: rotate(0deg) scale(0.8); border-radius: ${radiusVal}px; }
                    25% { border-radius: ${squareSize * 0.3}px; }
                    50% { transform: rotate(180deg) scale(1.2); border-radius: ${squareSize * 0.5}px; }
                    75% { border-radius: ${squareSize * 0.3}px; }
                }
            </style>
        `;
    }

    /**
     * Heart Spinner
     */
    _getHeartHTML(color, size, duration, speed) {
        const heartSize = size.width * 0.8;
        const durationVal = duration / speed;
        
        return `
            <div class="heart-container" style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                <svg viewBox="0 0 24 24" style="width: ${heartSize}px; height: ${heartSize}px; fill: ${color}; animation: heartBeat ${durationVal}s ease-in-out infinite;">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
            </div>
            <style>
                @keyframes heartBeat {
                    0%, 100% { transform: scale(0.9); }
                    15% { transform: scale(1.2); }
                    30% { transform: scale(0.95); }
                    45% { transform: scale(1.1); }
                    60% { transform: scale(0.95); }
                    80% { transform: scale(1); }
                }
            </style>
        `;
    }

    /**
     * Show Spinner
     */
    show() {
        if (this._isVisible) return;
        
        if (this._element) {
            this._element.style.display = 'flex';
            this._element.style.opacity = '0';
            this._element.style.transition = 'opacity 0.3s ease';
            this._element.offsetHeight;
            this._element.style.opacity = '1';
        } else {
            this.render();
        }
        
        this._isVisible = true;
        
        if (this.options.onShow) {
            this.options.onShow(this);
        }
    }

    /**
     * Hide Spinner
     */
    hide() {
        if (!this._isVisible) return;
        
        if (this._element) {
            this._element.style.opacity = '0';
            this._element.style.transition = 'opacity 0.3s ease';
            
            setTimeout(function() {
                if (this && this._element) {
                    this._element.style.display = 'none';
                }
            }.bind(this), 300);
        }
        
        this._isVisible = false;
        this._stopProgress();
        
        if (this.options.onHide) {
            this.options.onHide(this);
        }
    }

    /**
     * Destroy Spinner
     */
    destroy() {
        this.hide();
        
        if (this._timeout) {
            clearTimeout(this._timeout);
            this._timeout = null;
        }
        
        if (this._element && this._element.parentNode) {
            this._element.parentNode.removeChild(this._element);
        }
        
        this._element = null;
        this._overlayElement = null;
        this._container = null;
    }

    /**
     * Update Progress
     */
    updateProgress(progress) {
        this.options.progress = Math.min(100, Math.max(0, progress));
        
        if (this._element && this.options.showProgress) {
            const bar = this._element.querySelector('.progress-bar');
            const text = this._element.querySelector('.progress-text');
            
            if (bar) {
                bar.style.width = this.options.progress + '%';
            }
            if (text) {
                text.textContent = Math.round(this.options.progress) + '%';
            }
        }
    }

    /**
     * Update Text
     */
    updateText(text) {
        this.options.text = text;
        
        if (this._element && this.options.showText) {
            const textEl = this._element.querySelector('.loading-spinner-text');
            if (textEl) {
                textEl.textContent = text;
            }
        }
    }

    /**
     * Stop Progress Updates
     */
    _stopProgress() {
        if (this._progressInterval) {
            clearInterval(this._progressInterval);
            this._progressInterval = null;
        }
    }

    /**
     * Create a full-screen loading spinner
     */
    static fullScreen(options) {
        options = options || {};
        return new LoadingSpinner({
            fullScreen: true,
            overlay: true,
            overlayColor: 'rgba(0,0,0,0.7)',
            overlayBlur: '8px',
            zIndex: 99999,
            ...options
        });
    }

    /**
     * Create a container loading spinner
     */
    static container(options) {
        options = options || {};
        return new LoadingSpinner({
            overlay: true,
            overlayColor: 'rgba(255,255,255,0.8)',
            overlayBlur: '2px',
            ...options
        });
    }

    /**
     * Create an inline loading spinner
     */
    static inline(options) {
        options = options || {};
        return new LoadingSpinner({
            overlay: false,
            fullScreen: false,
            ...options
        });
    }

    /**
     * Show a quick toast-style spinner with auto-hide
     */
    static quickShow(options) {
        options = options || {};
        const spinner = new LoadingSpinner({
            fullScreen: true,
            overlay: true,
            overlayColor: 'rgba(0,0,0,0.5)',
            overlayBlur: '4px',
            zIndex: 99999,
            showText: true,
            text: options.text || 'Loading...',
            ...options
        });
        
        spinner.render();
        
        if (options.duration) {
            setTimeout(function() {
                spinner.destroy();
            }, options.duration);
        }
        
        return spinner;
    }
}

// Global exposure
if (typeof window !== 'undefined') {
    window.LoadingSpinner = LoadingSpinner;
}

// Export default
export default LoadingSpinner;