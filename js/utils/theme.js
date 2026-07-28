// Theme Management
// ============================================================
// FILE: js/utils/theme.js
// PURPOSE: Theme management (light/dark)
// DEPENDENCY: constants.js
// USED BY: store.js, app.js, settings-screen.js
// ============================================================

import { APP_CONSTANTS } from './constants.js';
import EventBus from '../state/event-bus.js';

/**
 * ThemeManager Class - Manages application theme (light/dark)
 * 
 * Features:
 * - Light/Dark theme toggle
 * - System preference detection
 * - Persistent theme storage
 * - CSS variable management
 * - Theme transition animations
 * - Class-based theming
 * - Event notifications
 * - Accessibility support
 * 
 * Usage:
 *   import { ThemeManager } from './utils/theme.js';
 *   ThemeManager.setTheme('dark');
 *   const isDark = ThemeManager.isDark();
 */
export class ThemeManager {
    /**
     * Default configuration
     * @private
     * @static
     */
    static #defaultConfig = {
        defaultTheme: 'light',      // 'light' or 'dark'
        storageKey: 'zymore_theme',
        attributeName: 'data-theme',
        classNamePrefix: 'theme-',
        transitionDuration: 300,    // ms
        respectSystemPref: true,
        systemPrefKey: 'prefers-color-scheme'
    };

    /**
     * Current theme state
     * @private
     * @static
     */
    static #currentTheme = null;
    static #isInitialized = false;

    /**
     * Theme colors map
     * @private
     * @static
     */
    static #themeColors = {
        light: {
            background: '#ffffff',
            backgroundSecondary: '#f9fafb',
            backgroundCard: '#ffffff',
            backgroundInput: '#ffffff',
            text: '#1a1a2e',
            textSecondary: '#374151',
            textMuted: '#6b7280',
            border: '#e5e7eb',
            borderLight: '#f3f4f6',
            primary: '#6366f1',
            primaryHover: '#4f46e5',
            primaryLight: 'rgba(99, 102, 241, 0.1)',
            success: '#22c55e',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6',
            shadow: 'rgba(0, 0, 0, 0.08)',
            shadowHover: 'rgba(0, 0, 0, 0.12)'
        },
        dark: {
            background: '#111827',
            backgroundSecondary: '#1f2937',
            backgroundCard: '#1f2937',
            backgroundInput: '#374151',
            text: '#f3f4f6',
            textSecondary: '#d1d5db',
            textMuted: '#9ca3af',
            border: '#374151',
            borderLight: '#4b5563',
            primary: '#818cf8',
            primaryHover: '#6366f1',
            primaryLight: 'rgba(99, 102, 241, 0.15)',
            success: '#34d399',
            error: '#f87171',
            warning: '#fbbf24',
            info: '#60a5fa',
            shadow: 'rgba(0, 0, 0, 0.3)',
            shadowHover: 'rgba(0, 0, 0, 0.4)'
        }
    };

    /**
     * CSS variable mapping
     * @private
     * @static
     */
    static #cssVariables = {
        '--color-bg': 'background',
        '--color-bg-secondary': 'backgroundSecondary',
        '--color-bg-card': 'backgroundCard',
        '--color-bg-input': 'backgroundInput',
        '--color-text': 'text',
        '--color-text-secondary': 'textSecondary',
        '--color-text-muted': 'textMuted',
        '--color-border': 'border',
        '--color-border-light': 'borderLight',
        '--color-primary': 'primary',
        '--color-primary-hover': 'primaryHover',
        '--color-primary-light': 'primaryLight',
        '--color-success': 'success',
        '--color-error': 'error',
        '--color-warning': 'warning',
        '--color-info': 'info',
        '--shadow-default': 'shadow',
        '--shadow-hover': 'shadowHover'
    };

    /**
     * Initialize the theme manager
     * @public
     * @static
     * @param {Object} config - Configuration options
     * @returns {string} Current theme
     */
    static init(config = {}) {
        if (this.#isInitialized) {
            return this.#currentTheme;
        }

        // Merge config
        const mergedConfig = { ...this.#defaultConfig, ...config };
        this.#defaultConfig = mergedConfig;

        // Load saved theme
        const savedTheme = this.#loadFromStorage();

        // Determine theme
        let theme = savedTheme;
        if (!theme && this.#defaultConfig.respectSystemPref) {
            theme = this.#getSystemPreference();
        }
        if (!theme) {
            theme = this.#defaultConfig.defaultTheme;
        }

        // Apply theme
        this.#currentTheme = theme;
        this.#applyTheme(theme);

        // Listen for system preference changes
        this.#listenForSystemPreference();

        // Listen for storage changes (cross-tab sync)
        this.#listenForStorageChanges();

        this.#isInitialized = true;

        // Emit event
        EventBus.emit('theme:init', { theme });

        return theme;
    }

    /**
     * Set theme
     * @public
     * @static
     * @param {string} theme - 'light' or 'dark'
     * @param {boolean} animate - Animate transition
     * @returns {boolean} Success indicator
     */
    static setTheme(theme, animate = true) {
        if (theme !== 'light' && theme !== 'dark') {
            console.warn(`ThemeManager: Invalid theme "${theme}". Using "light".`);
            theme = 'light';
        }

        if (this.#currentTheme === theme) {
            return true;
        }

        this.#currentTheme = theme;
        this.#applyTheme(theme, animate);
        this.#saveToStorage(theme);

        // Emit event
        EventBus.emit('theme:change', { theme, previousTheme: this.#getOppositeTheme(theme) });

        return true;
    }

    /**
     * Toggle theme
     * @public
     * @static
     * @param {boolean} animate - Animate transition
     * @returns {string} New theme
     */
    static toggleTheme(animate = true) {
        const newTheme = this.#currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme, animate);
        return newTheme;
    }

    /**
     * Get current theme
     * @public
     * @static
     * @returns {string} Current theme
     */
    static getTheme() {
        if (!this.#isInitialized) {
            this.init();
        }
        return this.#currentTheme;
    }

    /**
     * Check if dark theme is active
     * @public
     * @static
     * @returns {boolean} Is dark mode
     */
    static isDark() {
        return this.getTheme() === 'dark';
    }

    /**
     * Check if light theme is active
     * @public
     * @static
     * @returns {boolean} Is light mode
     */
    static isLight() {
        return this.getTheme() === 'light';
    }

    /**
     * Apply theme to document
     * @private
     * @static
     * @param {string} theme - Theme to apply
     * @param {boolean} animate - Animate transition
     */
    static #applyTheme(theme, animate = true) {
        const root = document.documentElement;
        const colors = this.#themeColors[theme];

        // Apply data attribute
        root.setAttribute(this.#defaultConfig.attributeName, theme);

        // Apply CSS classes
        root.classList.remove(
            `${this.#defaultConfig.classNamePrefix}light`,
            `${this.#defaultConfig.classNamePrefix}dark`
        );
        root.classList.add(`${this.#defaultConfig.classNamePrefix}${theme}`);

        // Apply CSS variables
        for (const [cssVar, colorKey] of Object.entries(this.#cssVariables)) {
            root.style.setProperty(cssVar, colors[colorKey]);
        }

        // Apply meta theme color
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.content = theme === 'dark' ? '#111827' : '#ffffff';
        }

        // Apply transition animation
        if (animate) {
            root.style.transition = `background-color ${this.#defaultConfig.transitionDuration}ms ease, 
                                     color ${this.#defaultConfig.transitionDuration}ms ease`;
            setTimeout(() => {
                root.style.transition = '';
            }, this.#defaultConfig.transitionDuration + 50);
        }

        // Update body background
        document.body.style.backgroundColor = colors.background;
        document.body.style.color = colors.text;

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme, colors }
        }));
    }

    /**
     * Save theme to storage
     * @private
     * @static
     */
    static #saveToStorage(theme) {
        try {
            localStorage.setItem(this.#defaultConfig.storageKey, theme);
        } catch (e) {
            console.warn('ThemeManager: Failed to save theme to storage:', e);
        }
    }

    /**
     * Load theme from storage
     * @private
     * @static
     * @returns {string|null} Saved theme or null
     */
    static #loadFromStorage() {
        try {
            const saved = localStorage.getItem(this.#defaultConfig.storageKey);
            if (saved === 'light' || saved === 'dark') {
                return saved;
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Get system preference
     * @private
     * @static
     * @returns {string} System preference
     */
    static #getSystemPreference() {
        try {
            const darkModeMedia = window.matchMedia(`(${this.#defaultConfig.systemPrefKey}: dark)`);
            return darkModeMedia.matches ? 'dark' : 'light';
        } catch (e) {
            return 'light';
        }
    }

    /**
     * Get opposite theme
     * @private
     * @static
     * @param {string} theme - Current theme
     * @returns {string} Opposite theme
     */
    static #getOppositeTheme(theme) {
        return theme === 'light' ? 'dark' : 'light';
    }

    /**
     * Listen for system preference changes
     * @private
     * @static
     */
    static #listenForSystemPreference() {
        if (!this.#defaultConfig.respectSystemPref) return;

        try {
            const darkModeMedia = window.matchMedia(`(${this.#defaultConfig.systemPrefKey}: dark)`);
            
            // Use modern API if available
            if (darkModeMedia.addEventListener) {
                darkModeMedia.addEventListener('change', (e) => {
                    // Only change if user hasn't explicitly set a preference
                    const hasUserPreference = this.#loadFromStorage() !== null;
                    if (!hasUserPreference) {
                        const newTheme = e.matches ? 'dark' : 'light';
                        this.setTheme(newTheme, true);
                    }
                });
            } 
            // Fallback for older browsers
            else if (darkModeMedia.addListener) {
                darkModeMedia.addListener((e) => {
                    const hasUserPreference = this.#loadFromStorage() !== null;
                    if (!hasUserPreference) {
                        const newTheme = e.matches ? 'dark' : 'light';
                        this.setTheme(newTheme, true);
                    }
                });
            }
        } catch (e) {
            // Ignore errors
        }
    }

    /**
     * Listen for storage changes (cross-tab sync)
     * @private
     * @static
     */
    static #listenForStorageChanges() {
        window.addEventListener('storage', (e) => {
            if (e.key === this.#defaultConfig.storageKey) {
                const newTheme = e.newValue;
                if (newTheme === 'light' || newTheme === 'dark') {
                    if (newTheme !== this.#currentTheme) {
                        this.#currentTheme = newTheme;
                        this.#applyTheme(newTheme, true);
                        EventBus.emit('theme:sync', { theme: newTheme });
                    }
                }
            }
        });
    }

    /**
     * Get theme colors
     * @public
     * @static
     * @param {string} theme - Theme to get colors for
     * @returns {Object} Theme colors
     */
    static getColors(theme = null) {
        const targetTheme = theme || this.#currentTheme || 'light';
        return { ...this.#themeColors[targetTheme] };
    }

    /**
     * Get CSS variables
     * @public
     * @static
     * @param {string} theme - Theme to get variables for
     * @returns {Object} CSS variables
     */
    static getCSSVariables(theme = null) {
        const targetTheme = theme || this.#currentTheme || 'light';
        const colors = this.#themeColors[targetTheme];
        const variables = {};
        for (const [cssVar, colorKey] of Object.entries(this.#cssVariables)) {
            variables[cssVar] = colors[colorKey];
        }
        return variables;
    }

    /**
     * Get a specific CSS variable value
     * @public
     * @static
     * @param {string} cssVar - CSS variable name
     * @param {string} theme - Theme to get value from
     * @returns {string} CSS variable value
     */
    static getCSSVar(cssVar, theme = null) {
        const targetTheme = theme || this.#currentTheme || 'light';
        const colorKey = this.#cssVariables[cssVar];
        if (!colorKey) return '';
        return this.#themeColors[targetTheme][colorKey] || '';
    }

    /**
     * Get theme from localStorage
     * @public
     * @static
     * @returns {string|null} Theme from storage
     */
    static getSavedTheme() {
        return this.#loadFromStorage();
    }

    /**
     * Reset to system preference
     * @public
     * @static
     * @param {boolean} animate - Animate transition
     * @returns {string} New theme
     */
    static resetToSystemPreference(animate = true) {
        const theme = this.#getSystemPreference();
        this.setTheme(theme, animate);
        // Remove saved preference to follow system
        try {
            localStorage.removeItem(this.#defaultConfig.storageKey);
        } catch (e) {
            // Ignore
        }
        return theme;
    }

    /**
     * Generate theme-aware class name
     * @public
     * @static
     * @param {string} baseClass - Base class name
     * @param {string} theme - Theme suffix
     * @returns {string} Theme-aware class name
     */
    static getThemeClass(baseClass, theme = null) {
        const targetTheme = theme || this.#currentTheme || 'light';
        return `${baseClass} ${baseClass}--${targetTheme}`;
    }

    /**
     * Check if theme is valid
     * @public
     * @static
     * @param {string} theme - Theme to check
     * @returns {boolean} Is valid theme
     */
    static isValidTheme(theme) {
        return theme === 'light' || theme === 'dark';
    }

    /**
     * Get all available themes
     * @public
     * @static
     * @returns {Array<string>} Available themes
     */
    static getAvailableThemes() {
        return ['light', 'dark'];
    }

    /**
     * Get theme display name
     * @public
     * @static
     * @param {string} theme - Theme code
     * @returns {string} Display name
     */
    static getThemeDisplayName(theme) {
        const names = {
            light: 'Light',
            dark: 'Dark'
        };
        return names[theme] || theme;
    }

    /**
     * Get theme icon
     * @public
     * @static
     * @param {string} theme - Theme code
     * @returns {string} Theme icon
     */
    static getThemeIcon(theme) {
        const icons = {
            light: '☀️',
            dark: '🌙'
        };
        return icons[theme] || '🎨';
    }

    /**
     * Check if dark mode is system default
     * @public
     * @static
     * @returns {boolean} System prefers dark
     */
    static isSystemDark() {
        try {
            const darkModeMedia = window.matchMedia(`(${this.#defaultConfig.systemPrefKey}: dark)`);
            return darkModeMedia.matches;
        } catch (e) {
            return false;
        }
    }

    /**
     * Get system preference
     * @public
     * @static
     * @returns {string} System preference ('light' or 'dark')
     */
    static getSystemPreference() {
        return this.#getSystemPreference();
    }

    /**
     * Apply theme to a specific element
     * @public
     * @static
     * @param {HTMLElement} element - Element to apply theme to
     * @param {string} theme - Theme to apply
     */
    static applyThemeToElement(element, theme = null) {
        if (!element || !(element instanceof HTMLElement)) return;

        const targetTheme = theme || this.#currentTheme || 'light';
        const colors = this.#themeColors[targetTheme];

        // Apply data attribute
        element.setAttribute(this.#defaultConfig.attributeName, targetTheme);

        // Apply colors directly
        element.style.backgroundColor = colors.background;
        element.style.color = colors.text;

        // Apply CSS variables to element
        for (const [cssVar, colorKey] of Object.entries(this.#cssVariables)) {
            element.style.setProperty(cssVar, colors[colorKey]);
        }
    }

    /**
     * Destroy theme manager
     * @public
     * @static
     */
    static destroy() {
        // Remove event listeners
        // No cleanup needed for global listeners
        this.#isInitialized = false;
        this.#currentTheme = null;

        // Clear storage listener
        // Storage events are global, can't remove specific listener
    }

    /**
     * Get theme color for a specific usage
     * @public
     * @static
     * @param {string} usage - Color usage (e.g., 'primary', 'success')
     * @param {string} theme - Theme to get color from
     * @returns {string} Color value
     */
    static getColor(usage, theme = null) {
        const targetTheme = theme || this.#currentTheme || 'light';
        const colors = this.#themeColors[targetTheme];
        return colors[usage] || '';
    }

    /**
     * Get all theme color names
     * @public
     * @static
     * @returns {Array<string>} Color names
     */
    static getColorNames() {
        return Object.keys(this.#themeColors.light);
    }

    /**
     * Check if a color exists
     * @public
     * @static
     * @param {string} colorName - Color name to check
     * @returns {boolean} Color exists
     */
    static hasColor(colorName) {
        return colorName in this.#themeColors.light;
    }
}

// ============================================================
// INITIALIZE ON LOAD
// ============================================================
if (typeof document !== 'undefined') {
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            ThemeManager.init();
        });
    } else {
        ThemeManager.init();
    }
}

// ============================================================
// SAFE EXPORT FIX FOR theme.js
// ============================================================
const themeManager = typeof ThemeManager !== 'undefined' ? ThemeManager : {
    init: () => {},
    setTheme: () => {},
    toggle: () => {}
};

if (typeof window !== 'undefined') {
    window.ThemeManager = ThemeManager;
    window.themeManager = themeManager;
}

export { themeManager };
export default themeManager;