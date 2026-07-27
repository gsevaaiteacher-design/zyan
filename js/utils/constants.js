// Constants
// ============================================================
// FILE: constants.js
// PURPOSE: App constants - colors, strings, sizes, etc.
// DEPENDENCY: app-config.js
// USED BY: All files (screens, widgets, services)
// LOCATION: js/utils/constants.js
// ============================================================

// ============================================================
// IMPORT DEPENDENCIES
// ============================================================

import { APP_CONFIG, getConfig } from '../config/app-config.js';

// ============================================================
// COLOR CONSTANTS
// ============================================================

/**
 * Application color palette
 * All colors are defined here for consistency
 * Used by: All UI components
 */
export const COLORS = {
    // ============================================
    // PRIMARY COLORS
    // ============================================
    primary: '#FF6B35',           // Vibrant Orange - Main brand color
    primaryDark: '#E55A2B',       // Darker orange for hover/pressed states
    primaryLight: '#FF8A5C',      // Lighter orange for backgrounds
    primaryGradient: 'linear-gradient(135deg, #FF6B35 0%, #FF8A5C 100%)',
    
    // ============================================
    // SECONDARY COLORS
    // ============================================
    secondary: '#1A1A2E',         // Dark Navy - Secondary brand color
    secondaryDark: '#0D0D1A',     // Darker navy for deep backgrounds
    secondaryLight: '#2D2D44',    // Lighter navy for cards/surfaces
    
    // ============================================
    // ACCENT COLORS
    // ============================================
    accent: '#00D4FF',            // Sky Blue - Accent/Highlight color
    accentDark: '#00B8E6',        // Darker blue for hover states
    accentLight: '#66E5FF',       // Lighter blue for backgrounds
    
    // ============================================
    // NEUTRAL COLORS
    // ============================================
    white: '#FFFFFF',
    black: '#000000',
    
    gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827'
    },
    
    // ============================================
    // STATUS COLORS
    // ============================================
    success: '#2ECC71',           // Green - Success/Complete
    successDark: '#27AE60',
    successLight: '#A9DFBF',
    
    warning: '#F39C12',           // Orange - Warning/Caution
    warningDark: '#D68910',
    warningLight: '#F5CBA7',
    
    error: '#E74C3C',             // Red - Error/Danger
    errorDark: '#C0392B',
    errorLight: '#F5B7B1',
    
    info: '#3498DB',              // Blue - Information
    infoDark: '#2E86C1',
    infoLight: '#AED6F1',
    
    // ============================================
    // TRANSPARENT VARIANTS
    // ============================================
    primaryTransparent: 'rgba(255, 107, 53, 0.1)',
    primaryTransparentMedium: 'rgba(255, 107, 53, 0.3)',
    primaryTransparentHeavy: 'rgba(255, 107, 53, 0.6)',
    
    secondaryTransparent: 'rgba(26, 26, 46, 0.1)',
    secondaryTransparentMedium: 'rgba(26, 26, 46, 0.3)',
    secondaryTransparentHeavy: 'rgba(26, 26, 46, 0.6)',
    
    accentTransparent: 'rgba(0, 212, 255, 0.1)',
    accentTransparentMedium: 'rgba(0, 212, 255, 0.3)',
    accentTransparentHeavy: 'rgba(0, 212, 255, 0.6)',
    
    // ============================================
    // OVERLAY COLORS
    // ============================================
    overlayLight: 'rgba(255, 255, 255, 0.8)',
    overlayDark: 'rgba(0, 0, 0, 0.6)',
    overlayMedium: 'rgba(0, 0, 0, 0.4)',
    overlayHeavy: 'rgba(0, 0, 0, 0.8)',
    
    // ============================================
    // SHADOW COLORS
    // ============================================
    shadowLight: 'rgba(0, 0, 0, 0.05)',
    shadowMedium: 'rgba(0, 0, 0, 0.1)',
    shadowHeavy: 'rgba(0, 0, 0, 0.2)',
    shadowPrimary: 'rgba(255, 107, 53, 0.3)',
    shadowAccent: 'rgba(0, 212, 255, 0.3)'
};

// ============================================================
// TYPOGRAPHY CONSTANTS
// ============================================================

/**
 * Typography configuration
 * Font sizes, weights, line heights
 * Used by: All UI components
 */
export const TYPOGRAPHY = {
    // ============================================
    // FONT FAMILIES
    // ============================================
    fontFamily: {
        primary: "'Poppins', sans-serif",
        secondary: "'Inter', sans-serif",
        monospace: "'Courier New', monospace"
    },
    
    // ============================================
    // FONT SIZES (in px)
    // ============================================
    fontSize: {
        xs: 10,
        sm: 12,
        base: 14,
        md: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 28,
        '4xl': 32,
        '5xl': 40,
        '6xl': 48
    },
    
    // ============================================
    // FONT WEIGHTS
    // ============================================
    fontWeight: {
        thin: 100,
        extraLight: 200,
        light: 300,
        normal: 400,
        medium: 500,
        semiBold: 600,
        bold: 700,
        extraBold: 800,
        black: 900
    },
    
    // ============================================
    // LINE HEIGHTS
    // ============================================
    lineHeight: {
        none: 1,
        tight: 1.25,
        snug: 1.375,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2
    },
    
    // ============================================
    // LETTER SPACING (in px)
    // ============================================
    letterSpacing: {
        tighter: -0.8,
        tight: -0.4,
        normal: 0,
        wide: 0.4,
        wider: 0.8,
        widest: 1.6
    }
};

// ============================================================
// SPACING CONSTANTS
// ============================================================

/**
 * Spacing constants (in px)
 * Used by: All UI components for consistent spacing
 */
export const SPACING = {
    xs: 2,
    sm: 4,
    md: 8,
    base: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
    '6xl': 56,
    '7xl': 64,
    '8xl': 80,
    '9xl': 96
};

// ============================================================
// BORDER RADIUS CONSTANTS
// ============================================================

/**
 * Border radius values (in px)
 * Used by: Cards, buttons, modals
 */
export const BORDER_RADIUS = {
    none: 0,
    sm: 2,
    md: 4,
    base: 6,
    lg: 8,
    xl: 12,
    '2xl': 16,
    '3xl': 24,
    '4xl': 32,
    full: 9999
};

// ============================================================
// SHADOW CONSTANTS
// ============================================================

/**
 * Shadow configurations
 * Used by: Cards, modals, floating elements
 */
export const SHADOWS = {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    primary: '0 8px 20px rgba(255, 107, 53, 0.3)',
    accent: '0 8px 20px rgba(0, 212, 255, 0.3)',
    card: '0 4px 16px rgba(0, 0, 0, 0.08)',
    dropdown: '0 12px 40px rgba(0, 0, 0, 0.12)',
    modal: '0 25px 60px rgba(0, 0, 0, 0.2)'
};

// ============================================================
// BREAKPOINT CONSTANTS
// ============================================================

/**
 * Responsive breakpoints (in px)
 * Used by: Responsive design, media queries
 */
export const BREAKPOINTS = {
    xs: 320,
    sm: 480,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
    '3xl': 1920,
    '4xl': 2560
};

/**
 * Breakpoint media query strings
 * Used by: CSS-in-JS or JavaScript media queries
 */
export const MEDIA_QUERIES = {
    xs: `(min-width: ${BREAKPOINTS.xs}px)`,
    sm: `(min-width: ${BREAKPOINTS.sm}px)`,
    md: `(min-width: ${BREAKPOINTS.md}px)`,
    lg: `(min-width: ${BREAKPOINTS.lg}px)`,
    xl: `(min-width: ${BREAKPOINTS.xl}px)`,
    '2xl': `(min-width: ${BREAKPOINTS['2xl']}px)`,
    '3xl': `(min-width: ${BREAKPOINTS['3xl']}px)`,
    '4xl': `(min-width: ${BREAKPOINTS['4xl']}px)`,
    mobile: `(max-width: ${BREAKPOINTS.md - 1}px)`,
    tablet: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
    desktop: `(min-width: ${BREAKPOINTS.lg}px)`
};

// ============================================================
// ANIMATION CONSTANTS
// ============================================================

/**
 * Animation durations (in ms)
 * Used by: CSS animations, JavaScript animations
 */
export const ANIMATION = {
    duration: {
        fastest: 100,
        fast: 200,
        normal: 300,
        slow: 500,
        slower: 700,
        slowest: 1000
    },
    easing: {
        linear: 'linear',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }
};

// ============================================================
// Z-INDEX CONSTANTS
// ============================================================

/**
 * Z-index values for layering
 * Used by: Modals, dropdowns, overlays
 */
export const Z_INDEX = {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 1080,
    loader: 1090,
    overlay: 1100,
    max: 9999
};

// ============================================================
// ROUTE CONSTANTS
// ============================================================

/**
 * Application route paths
 * Used by: Router, navigation components
 */
export const ROUTES = {
    HOME: '/home',
    AUTH: '/auth',
    EXPLORE: '/explore',
    PRODUCT_DETAIL: '/product/:id',
    UPLOAD: '/upload',
    PROFILE: '/profile',
    HISTORY: '/history',
    SETTINGS: '/settings',
    NOTIFICATIONS: '/notifications',
    ABOUT: '/about',
    CONTACT: '/contact',
    PRIVACY: '/privacy',
    TERMS: '/terms'
};

/**
 * Route names for navigation
 * Used by: Bottom navigation, menus
 */
export const ROUTE_NAMES = {
    [ROUTES.HOME]: 'Home',
    [ROUTES.AUTH]: 'Auth',
    [ROUTES.EXPLORE]: 'Explore',
    [ROUTES.PRODUCT_DETAIL]: 'Product Detail',
    [ROUTES.UPLOAD]: 'Upload',
    [ROUTES.PROFILE]: 'Profile',
    [ROUTES.HISTORY]: 'History',
    [ROUTES.SETTINGS]: 'Settings',
    [ROUTES.NOTIFICATIONS]: 'Notifications'
};

// ============================================================
// STORAGE KEYS
// ============================================================

/**
 * LocalStorage/SessionStorage keys
 * Used by: Cache service, storage service
 */
export const STORAGE_KEYS = {
    // Auth
    AUTH_TOKEN: 'zymore_auth_token',
    USER_DATA: 'zymore_user_data',
    SESSION_ID: 'zymore_session_id',
    
    // Preferences
    THEME: 'zymore_theme',
    LANGUAGE: 'zymore_language',
    NOTIFICATIONS: 'zymore_notifications',
    
    // Cache
    PRODUCTS_CACHE: 'zymore_products_cache',
    CATEGORIES_CACHE: 'zymore_categories_cache',
    HISTORY_CACHE: 'zymore_history_cache',
    
    // Analytics
    SESSION_START: 'zymore_session_start',
    ANALYTICS_ID: 'zymore_analytics_id',
    
    // App State
    APP_STATE: 'zymore_app_state',
    LAST_SCREEN: 'zymore_last_screen',
    
    // Onboarding
    ONBOARDING_COMPLETE: 'zymore_onboarding_complete',
    FIRST_LAUNCH: 'zymore_first_launch'
};

// ============================================================
// MESSAGE CONSTANTS
// ============================================================

/**
 * Application messages
 * Used by: Toast notifications, error messages
 */
export const MESSAGES = {
    // ============================================
    // AUTHENTICATION
    // ============================================
    auth: {
        loginSuccess: 'Welcome back! You are now logged in.',
        loginError: 'Login failed. Please check your credentials.',
        signupSuccess: 'Account created successfully! Welcome to ZYMORE.',
        signupError: 'Signup failed. Please try again.',
        logoutSuccess: 'You have been logged out.',
        logoutError: 'Failed to logout. Please try again.',
        resetPasswordSuccess: 'Password reset email sent. Check your inbox.',
        resetPasswordError: 'Failed to send reset email. Please try again.',
        emailNotVerified: 'Please verify your email before proceeding.',
        accountBlocked: 'Your account has been blocked. Contact support.',
        sessionExpired: 'Your session has expired. Please login again.',
        authRequired: 'Please login to continue.',
        invalidEmail: 'Please enter a valid email address.',
        invalidPassword: 'Password must be at least 6 characters.',
        passwordMismatch: 'Passwords do not match.'
    },
    
    // ============================================
    // PRODUCTS
    // ============================================
    product: {
        loadSuccess: 'Products loaded successfully.',
        loadError: 'Failed to load products.',
        uploadSuccess: 'Product uploaded successfully! It will be live soon.',
        uploadError: 'Failed to upload product. Please try again.',
        updateSuccess: 'Product updated successfully.',
        updateError: 'Failed to update product.',
        deleteSuccess: 'Product deleted successfully.',
        deleteError: 'Failed to delete product.',
        notFound: 'Product not found.',
        noProducts: 'No products found. Be the first to upload!',
        downloadSuccess: 'Download started!',
        downloadError: 'Failed to download. Please try again.',
        likeSuccess: 'Added to favorites!',
        unlikeSuccess: 'Removed from favorites.',
        shareSuccess: 'Link copied to clipboard!'
    },
    
    // ============================================
    // REVIEWS
    // ============================================
    review: {
        createSuccess: 'Review posted successfully!',
        createError: 'Failed to post review. Please try again.',
        updateSuccess: 'Review updated successfully.',
        updateError: 'Failed to update review.',
        deleteSuccess: 'Review deleted successfully.',
        deleteError: 'Failed to delete review.',
        ratingRequired: 'Please select a rating.',
        commentRequired: 'Please write a comment.'
    },
    
    // ============================================
    // DOWNLOADS
    // ============================================
    download: {
        start: 'Downloading...',
        progress: 'Downloading: {progress}%',
        complete: 'Download complete! Saved to your history.',
        failed: 'Download failed. Please try again.',
        largeFile: 'This file is large. Please wait...',
        adRequired: 'Please watch the ad to unlock this download.',
        adReward: 'Ad complete! Your download is now available.',
        adFailed: 'Ad failed to load. Please try again.'
    },
    
    // ============================================
    // UPLOAD
    // ============================================
    upload: {
        titleRequired: 'Please enter a title.',
        descriptionRequired: 'Please enter a description.',
        categoryRequired: 'Please select a category.',
        imageRequired: 'Please upload at least one image.',
        fileRequired: 'Please upload a file or provide a drive link.',
        fileTooLarge: 'File is too large. Max size is {size}MB.',
        invalidFileType: 'File type not allowed. Allowed types: {types}',
        imageTooLarge: 'Image is too large. Max size is {size}MB.',
        invalidImageType: 'Image type not allowed. Allowed types: {types}',
        uploadInProgress: 'Upload in progress... Please wait.',
        uploadComplete: 'Upload complete!',
        uploadFailed: 'Upload failed. Please try again.',
        driveLinkInvalid: 'Invalid Google Drive link. Please check and try again.'
    },
    
    // ============================================
    // NETWORK
    // ============================================
    network: {
        offline: 'You are offline. Please check your internet connection.',
        online: 'Back online!',
        slow: 'Slow network detected. Please wait.',
        timeout: 'Request timed out. Please try again.',
        serverError: 'Server error. Please try again later.'
    },
    
    // ============================================
    // GENERAL
    // ============================================
    general: {
        loading: 'Loading...',
        saving: 'Saving...',
        deleting: 'Deleting...',
        processing: 'Processing...',
        pleaseWait: 'Please wait...',
        success: 'Success!',
        error: 'Error!',
        warning: 'Warning!',
        info: 'Info',
        cancel: 'Cancel',
        confirm: 'Confirm',
        yes: 'Yes',
        no: 'No',
        ok: 'OK',
        close: 'Close',
        save: 'Save',
        edit: 'Edit',
        delete: 'Delete',
        update: 'Update',
        create: 'Create',
        search: 'Search',
        filter: 'Filter',
        sort: 'Sort',
        viewAll: 'View All',
        seeMore: 'See More',
        seeLess: 'See Less',
        copy: 'Copy',
        copied: 'Copied!',
        share: 'Share',
        download: 'Download',
        like: 'Like',
        unlike: 'Unlike',
        report: 'Report',
        retry: 'Retry'
    }
};

// ============================================================
// CATEGORY CONSTANTS
// ============================================================

/**
 * Default categories for the marketplace
 * Used by: Category selection, product listing
 */
export const CATEGORIES = [
    {
        id: 'wallpapers',
        name: 'Wallpapers',
        icon: 'ðŸ–¼ï¸',
        description: 'High-quality wallpapers for all devices',
        displayOrder: 1
    },
    {
        id: 'icons',
        name: 'Icons',
        icon: 'ðŸŽ¨',
        description: 'Beautiful icon packs for apps and websites',
        displayOrder: 2
    },
    {
        id: 'art',
        name: 'Digital Art',
        icon: 'ðŸ–Œï¸',
        description: 'Digital artwork from talented creators',
        displayOrder: 3
    },
    {
        id: 'assets',
        name: 'Assets',
        icon: 'ðŸ“¦',
        description: 'Game assets, 3D models, and more',
        displayOrder: 4
    },
    {
        id: 'templates',
        name: 'Templates',
        icon: 'ðŸ“„',
        description: 'Website, presentation, and document templates',
        displayOrder: 5
    },
    {
        id: 'mockups',
        name: 'Mockups',
        icon: 'ðŸ“±',
        description: 'Device mockups for presentations',
        displayOrder: 6
    }
];

// ============================================================
// FILE TYPE CONSTANTS
// ============================================================

/**
 * File type categories
 * Used by: Upload validation, file handling
 */
export const FILE_TYPES = {
    // Images
    IMAGES: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'image/bmp'],
    
    // Documents
    DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    
    // Archives
    ARCHIVES: ['application/zip', 'application/rar', 'application/x-tar', 'application/gzip'],
    
    // Videos
    VIDEOS: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    
    // Audio
    AUDIO: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm'],
    
    // 3D Models
    MODELS: ['model/gltf-binary', 'model/gltf+json', 'model/stl', 'model/obj'],
    
    // All allowed types (from config)
    getAllowed: function() {
        const allowedTypes = getConfig('upload.allowedFileTypes', []);
        if (Array.isArray(allowedTypes) && allowedTypes.length > 0) {
            return allowedTypes;
        }
        // Fallback to defaults
        return [...this.IMAGES, ...this.DOCUMENTS, ...this.ARCHIVES, ...this.VIDEOS];
    },
    
    // Get allowed image types
    getAllowedImages: function() {
        const allowedImages = getConfig('upload.allowedImageTypes', []);
        if (Array.isArray(allowedImages) && allowedImages.length > 0) {
            return allowedImages;
        }
        return this.IMAGES;
    }
};

// ============================================================
// SORT OPTIONS
// ============================================================

/**
 * Sorting options for product listing
 * Used by: Explore screen, product listing
 */
export const SORT_OPTIONS = [
    { value: 'trending', label: 'Trending' },
    { value: 'newest', label: 'Newest' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'most_downloaded', label: 'Most Downloaded' },
    { value: 'highest_rated', label: 'Highest Rated' },
    { value: 'most_liked', label: 'Most Liked' }
];

// ============================================================
// FILTER OPTIONS
// ============================================================

/**
 * Default filter options
 * Used by: Explore screen
 */
export const FILTER_OPTIONS = {
    priceRange: {
        min: 0,
        max: 100
    },
    ratings: [1, 2, 3, 4, 5],
    fileTypes: ['image', 'document', 'archive', 'video', 'audio']
};

// ============================================================
// PAGINATION CONSTANTS
// ============================================================

/**
 * Pagination defaults
 * Used by: Infinite scroll, product listing
 */
export const PAGINATION = {
    defaultLimit: 20,
    maxLimit: 100,
    initialPage: 1
};

// ============================================================
// TIMEOUT CONSTANTS
// ============================================================

/**
 * Timeout values (in ms)
 * Used by: API calls, animations, delays
 */
export const TIMEOUTS = {
    apiCall: 30000,       // 30 seconds
    upload: 60000,        // 60 seconds
    download: 120000,     // 2 minutes
    toast: 3000,          // 3 seconds
    modalClose: 200,      // 200ms
    debounce: 300,        // 300ms
    throttle: 200,        // 200ms
    idle: 5000,           // 5 seconds
    sessionTimeout: 3600000 // 1 hour
};

// ============================================================
// REGEX PATTERNS
// ============================================================

/**
 * Common regex patterns for validation
 * Used by: Validators, form validation
 */
export const REGEX = {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
    phone: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/,
    url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
    slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    youtube: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
    vimeo: /^(https?:\/\/)?(www\.)?vimeo\.com\/.+$/,
    driveId: /^[a-zA-Z0-9_-]{28,}$/,
    driveLink: /^(https?:\/\/)?(drive\.google\.com\/file\/d\/|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/
};

// ============================================================
// APP STATE CONSTANTS
// ============================================================

/**
 * App state constants
 * Used by: Store, state management
 */
export const APP_STATES = {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error',
    OFFLINE: 'offline',
    ONLINE: 'online'
};

// ============================================================
// STRINGS - App Text Strings
// ============================================================

/**
 * App text strings for UI
 * Used by: All UI components, navigation
 */
export const STRINGS = {
    appName: 'ZYMORE',
    appTagline: 'Ultimate Digital Marketplace',
    appDescription: 'Buy, sell, and share digital products',
    
    // Navigation
    home: 'Home',
    explore: 'Explore',
    upload: 'Upload',
    profile: 'Profile',
    history: 'History',
    settings: 'Settings',
    notifications: 'Notifications',
    
    // Actions
    login: 'Login',
    signup: 'Sign Up',
    logout: 'Logout',
    download: 'Download',
    like: 'Like',
    share: 'Share',
    report: 'Report',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    
    // Status
    loading: 'Loading...',
    success: 'Success!',
    error: 'Error!',
    warning: 'Warning!',
    info: 'Info',
    
    // Product
    product: 'Product',
    products: 'Products',
    category: 'Category',
    categories: 'Categories',
    price: 'Price',
    rating: 'Rating',
    reviews: 'Reviews',
    description: 'Description',
    features: 'Features',
    
    // User
    user: 'User',
    seller: 'Seller',
    buyer: 'Buyer',
    admin: 'Admin',
    
    // Messages
    welcome: 'Welcome to ZYMORE!',
    noProducts: 'No products found',
    noResults: 'No results found',
    tryAgain: 'Please try again',
    refresh: 'Refresh'
};

// ============================================================
// THEME CONSTANTS
// ============================================================

/**
 * Theme constants for dark/light mode
 * Used by: Theme manager, settings
 */
export const THEME = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system'
};

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default {
    COLORS,
    STRINGS, 
    TYPOGRAPHY,
    SPACING,
    BORDER_RADIUS,
    SHADOWS,
    BREAKPOINTS,
    MEDIA_QUERIES,
    ANIMATION,
    Z_INDEX,
    ROUTES,
    ROUTE_NAMES,
    STORAGE_KEYS,
    MESSAGES,
    CATEGORIES,
    FILE_TYPES,
    SORT_OPTIONS,
    FILTER_OPTIONS,
    PAGINATION,
    TIMEOUTS,
    REGEX,
    APP_STATES
};

// ============================================================
// END OF FILE: constants.js
// ============================================================