// Service Worker
// ============================================================
// FILE: sw.js
// PURPOSE: Service Worker for PWA - Offline support, caching, push notifications
// DEPENDENCY: NONE
// REGISTERED IN: index.html
// ============================================================

/* eslint-disable no-restricted-globals */

// ============================================================
// CONFIGURATION
// ============================================================

const CACHE_VERSION = 'v2.0.0';
const CACHE_PREFIX = 'zymore';

// Cache names
const CACHE_NAMES = {
    static: `${CACHE_PREFIX}-static-${CACHE_VERSION}`,
    dynamic: `${CACHE_PREFIX}-dynamic-${CACHE_VERSION}`,
    images: `${CACHE_PREFIX}-images-${CACHE_VERSION}`,
    fonts: `${CACHE_PREFIX}-fonts-${CACHE_VERSION}`,
    api: `${CACHE_PREFIX}-api-${CACHE_VERSION}`
};

// Static assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/style.css',
    '/css/responsive.css',
    '/css/dark-mode.css',
    '/css/animations.css',
    '/css/components.css',
    '/js/app.js',
    '/js/router.js',
    '/js/store.js',
    '/js/event-bus.js',
    '/js/screens/auth-screen.js',
    '/js/screens/home-screen.js',
    '/js/screens/explore-screen.js',
    '/js/screens/product-detail.js',
    '/js/screens/upload-screen.js',
    '/js/screens/profile-screen.js',
    '/js/screens/history-screen.js',
    '/js/screens/settings-screen.js',
    '/js/screens/notifications-screen.js',
    '/js/widgets/loading-spinner.js',
    '/js/widgets/toast-notification.js',
    '/js/widgets/modal.js',
    '/js/widgets/rating-stars.js',
    '/js/widgets/product-card.js',
    '/js/widgets/category-card.js',
    '/js/widgets/ad-banner.js',
    '/js/widgets/infinite-scroll.js',
    '/js/widgets/image-slider.js',
    '/js/services/auth-service.js',
    '/js/services/database-service.js',
    '/js/services/storage-service.js',
    '/js/services/download-service.js',
    '/js/services/ad-service.js',
    '/js/services/analytics-service.js',
    '/js/services/notification-service.js',
    '/js/services/cache-service.js',
    '/js/services/logger.js',
    '/js/services/error-handler.js',
    '/js/models/user-model.js',
    '/js/models/product-model.js',
    '/js/models/review-model.js',
    '/js/models/category-model.js',
    '/js/models/notification-model.js',
    '/js/utils/constants.js',
    '/js/utils/validators.js',
    '/js/utils/helpers.js',
    '/js/utils/theme.js',
    '/js/utils/performance.js',
    '/js/config/firebase-config.js',
    '/js/config/app-config.js',
    '/js/config/env.js',
    '/assets/images/logo.svg',
    '/assets/images/splash.png',
    '/assets/images/favicon.ico',
    '/assets/images/offline.png',
    '/assets/images/empty-state.svg',
    '/assets/icons/icon-192.png',
    '/assets/icons/icon-512.png'
];

// External CDN assets (optional)
const EXTERNAL_ASSETS = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2'
];

// API routes to cache
const API_ROUTES = [
    '/api/products',
    '/api/categories',
    '/api/user'
];

// ============================================================
// INSTALL EVENT
// ============================================================

self.addEventListener('install', (event) => {
    console.log('[SW] Install event');
    
    // Skip waiting to activate immediately
    self.skipWaiting();

    event.waitUntil(
        (async () => {
            try {
                // Open static cache
                const staticCache = await caches.open(CACHE_NAMES.static);
                
                // Cache static assets
                await staticCache.addAll(STATIC_ASSETS);
                console.log('[SW] Static assets cached');

                // Cache external assets
                try {
                    const externalCache = await caches.open(CACHE_NAMES.fonts);
                    await externalCache.addAll(EXTERNAL_ASSETS);
                    console.log('[SW] External assets cached');
                } catch (err) {
                    console.warn('[SW] Failed to cache external assets:', err);
                }

                console.log('[SW] Installation complete');
            } catch (error) {
                console.error('[SW] Installation failed:', error);
            }
        })()
    );
});

// ============================================================
// ACTIVATE EVENT
// ============================================================

self.addEventListener('activate', (event) => {
    console.log('[SW] Activate event');

    event.waitUntil(
        (async () => {
            // Get all cache keys
            const cacheKeys = await caches.keys();
            const oldCaches = cacheKeys.filter(key => 
                key.startsWith(CACHE_PREFIX) && 
                !Object.values(CACHE_NAMES).includes(key)
            );

            // Delete old caches
            await Promise.all(oldCaches.map(key => caches.delete(key)));
            console.log('[SW] Old caches cleaned up');

            // Claim clients
            await clients.claim();
            console.log('[SW] Clients claimed');

            // Notify all clients about update
            const clientList = await clients.matchAll();
            clientList.forEach(client => {
                client.postMessage({
                    type: 'SW_ACTIVATED',
                    version: CACHE_VERSION
                });
            });
        })()
    );
});

// ============================================================
// FETCH EVENT
// ============================================================

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        event.respondWith(fetch(request));
        return;
    }

    // Skip browser extensions and analytics
    if (url.hostname === 'www.google-analytics.com' || 
        url.hostname === 'googletagmanager.com') {
        event.respondWith(fetch(request));
        return;
    }

    // Handle different request types
    const requestType = getRequestType(url, request);

    switch (requestType) {
        case 'static':
            event.respondWith(handleStaticRequest(request));
            break;
        case 'image':
            event.respondWith(handleImageRequest(request));
            break;
        case 'font':
            event.respondWith(handleFontRequest(request));
            break;
        case 'api':
            event.respondWith(handleApiRequest(request));
            break;
        case 'html':
            event.respondWith(handleHtmlRequest(request));
            break;
        default:
            event.respondWith(handleDefaultRequest(request));
    }
});

/**
 * Get request type based on URL and headers
 * @param {URL} url - Request URL
 * @param {Request} request - Fetch request
 * @returns {string} Request type
 */
function getRequestType(url, request) {
    const pathname = url.pathname;
    const accept = request.headers.get('Accept') || '';

    // Check for API routes
    if (pathname.startsWith('/api/')) {
        return 'api';
    }

    // Check for images
    if (pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/i)) {
        return 'image';
    }

    // Check for fonts
    if (pathname.match(/\.(woff|woff2|ttf|otf|eot)$/i)) {
        return 'font';
    }

    // Check for HTML
    if (accept.includes('text/html') || pathname === '/' || pathname === '') {
        return 'html';
    }

    // Check for static assets (JS, CSS)
    if (pathname.match(/\.(js|css|json)$/i) || pathname.includes('/js/') || pathname.includes('/css/')) {
        return 'static';
    }

    return 'default';
}

// ============================================================
// REQUEST HANDLERS
// ============================================================

/**
 * Handle static asset requests (cache-first)
 * @param {Request} request - Fetch request
 * @returns {Promise<Response>} Response
 */
async function handleStaticRequest(request) {
    try {
        const cache = await caches.open(CACHE_NAMES.static);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }

        // Try network and cache
        const response = await fetch(request);
        if (response && response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        return new Response('Network error', { status: 503 });
    }
}

/**
 * Handle image requests (cache-first with stale-while-revalidate)
 * @param {Request} request - Fetch request
 * @returns {Promise<Response>} Response
 */
async function handleImageRequest(request) {
    try {
        const cache = await caches.open(CACHE_NAMES.images);
        const cachedResponse = await cache.match(request);

        // Return cached response if available
        if (cachedResponse) {
            // Revalidate in background
            fetch(request).then(response => {
                if (response && response.status === 200) {
                    cache.put(request, response);
                }
            }).catch(() => {});
            return cachedResponse;
        }

        // Fetch from network
        const response = await fetch(request);
        if (response && response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // Return placeholder image if available
        const fallbackCache = await caches.open(CACHE_NAMES.static);
        const fallback = await fallbackCache.match('/assets/images/offline.png');
        if (fallback) return fallback;
        return new Response('Image not available', { status: 404 });
    }
}

/**
 * Handle font requests (cache-first)
 * @param {Request} request - Fetch request
 * @returns {Promise<Response>} Response
 */
async function handleFontRequest(request) {
    try {
        const cache = await caches.open(CACHE_NAMES.fonts);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }

        const response = await fetch(request);
        if (response && response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        return new Response('Font not available', { status: 404 });
    }
}

/**
 * Handle API requests (network-first with cache fallback)
 * @param {Request} request - Fetch request
 * @returns {Promise<Response>} Response
 */
async function handleApiRequest(request) {
    try {
        // Try network first
        const response = await fetch(request);
        
        // Cache successful responses for offline
        if (response && response.status === 200) {
            const cache = await caches.open(CACHE_NAMES.api);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // Return cached response if available
        const cache = await caches.open(CACHE_NAMES.api);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Return error response
        return new Response(
            JSON.stringify({
                error: 'Network error',
                offline: true
            }),
            {
                status: 503,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}

/**
 * Handle HTML requests (network-first with cache fallback)
 * @param {Request} request - Fetch request
 * @returns {Promise<Response>} Response
 */
async function handleHtmlRequest(request) {
    try {
        // Try network first
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(CACHE_NAMES.static);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // Return cached index if available
        const cache = await caches.open(CACHE_NAMES.static);
        const cachedResponse = await cache.match('/index.html');
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page
        return new Response(
            `<!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Offline - ZYMORE</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        background: #f9fafb;
                        color: #1a1a2e;
                        padding: 20px;
                        text-align: center;
                    }
                    .offline-container {
                        max-width: 400px;
                    }
                    .offline-icon {
                        font-size: 64px;
                        margin-bottom: 16px;
                    }
                    h1 {
                        font-size: 24px;
                        margin: 0 0 8px;
                    }
                    p {
                        color: #6b7280;
                        margin: 0 0 20px;
                    }
                    button {
                        padding: 10px 24px;
                        background: #6366f1;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 14px;
                        cursor: pointer;
                    }
                </style>
            </head>
            <body>
                <div class="offline-container">
                    <div class="offline-icon">📡</div>
                    <h1>You're Offline</h1>
                    <p>Please check your internet connection and try again.</p>
                    <button onclick="location.reload()">Retry</button>
                </div>
            </body>
            </html>`,
            {
                status: 503,
                headers: {
                    'Content-Type': 'text/html'
                }
            }
        );
    }
}

/**
 * Handle default requests
 * @param {Request} request - Fetch request
 * @returns {Promise<Response>} Response
 */
async function handleDefaultRequest(request) {
    try {
        // Try network first
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(CACHE_NAMES.dynamic);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // Try cache
        const cache = await caches.open(CACHE_NAMES.dynamic);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        return new Response('Resource not available', { status: 404 });
    }
}

// ============================================================
// MESSAGE HANDLING
// ============================================================

self.addEventListener('message', (event) => {
    const data = event.data;

    if (!data) return;

    switch (data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;

        case 'CLEAR_CACHE':
            clearAllCaches();
            break;

        case 'PUSH_NOTIFICATION':
            handlePushNotification(data.payload);
            break;

        case 'GET_VERSION':
            event.ports[0]?.postMessage({
                type: 'VERSION',
                version: CACHE_VERSION
            });
            break;

        case 'CACHE_URLS':
            cacheUrls(data.urls);
            break;

        default:
            console.warn('[SW] Unknown message type:', data.type);
    }
});

/**
 * Clear all caches
 */
async function clearAllCaches() {
    try {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
        console.log('[SW] All caches cleared');
        
        // Notify clients
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'CACHE_CLEARED'
            });
        });
    } catch (error) {
        console.error('[SW] Failed to clear caches:', error);
    }
}

/**
 * Cache specific URLs
 * @param {Array<string>} urls - URLs to cache
 */
async function cacheUrls(urls) {
    try {
        const cache = await caches.open(CACHE_NAMES.dynamic);
        await cache.addAll(urls);
        console.log('[SW] URLs cached:', urls);
    } catch (error) {
        console.error('[SW] Failed to cache URLs:', error);
    }
}

// ============================================================
// PUSH NOTIFICATIONS
// ============================================================

self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const options = {
            body: data.body || 'New notification from ZYMORE',
            icon: data.icon || '/assets/icons/icon-192.png',
            badge: data.badge || '/assets/icons/badge-icon.png',
            data: data.data || {},
            actions: data.actions || [],
            vibrate: data.vibrate || [200, 100, 200],
            timestamp: data.timestamp || Date.now(),
            requireInteraction: data.requireInteraction || false,
            silent: data.silent || false,
            tag: data.tag || `notification-${Date.now()}`
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'ZYMORE', options)
        );
    } catch (error) {
        // If JSON parsing fails, use text
        const text = event.data.text();
        event.waitUntil(
            self.registration.showNotification('ZYMORE', {
                body: text,
                icon: '/assets/icons/icon-192.png',
                badge: '/assets/icons/badge-icon.png'
            })
        );
    }
});

// ============================================================
// NOTIFICATION CLICK
// ============================================================

self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const data = notification.data || {};

    event.notification.close();

    const urlToOpen = data.url || '/';

    event.waitUntil(
        (async () => {
            // Get all clients
            const clientList = await clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            });

            // Check if there's already a window/tab open
            const existingClient = clientList.find(client => 
                client.url === urlToOpen || 
                client.url === '/' + urlToOpen
            );

            if (existingClient) {
                // Focus existing client
                await existingClient.focus();
            } else {
                // Open new window
                await clients.openWindow(urlToOpen);
            }
        })()
    );
});

// ============================================================
// PERIODIC BACKGROUND SYNC (Optional)
// ============================================================

self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-cache') {
        event.waitUntil(updateStaticCache());
    }
});

/**
 * Update static cache in background
 */
async function updateStaticCache() {
    try {
        const cache = await caches.open(CACHE_NAMES.static);
        await cache.addAll(STATIC_ASSETS);
        console.log('[SW] Static cache updated via background sync');
    } catch (error) {
        console.error('[SW] Background cache update failed:', error);
    }
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Handle push notification
 * @param {Object} payload - Notification payload
 */
function handlePushNotification(payload) {
    // Custom push notification handling
    if (payload && payload.title) {
        self.registration.showNotification(payload.title, {
            body: payload.body || '',
            icon: payload.icon || '/assets/icons/icon-192.png',
            badge: payload.badge || '/assets/icons/badge-icon.png',
            data: payload.data || {},
            actions: payload.actions || [],
            vibrate: payload.vibrate || [200, 100, 200],
            requireInteraction: payload.requireInteraction || false,
            tag: payload.tag || `notification-${Date.now()}`
        });
    }
}

// ============================================================
// ERROR HANDLING
// ============================================================

self.addEventListener('error', (event) => {
    console.error('[SW] Error:', event.error || event.message);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('[SW] Unhandled rejection:', event.reason);
});

// ============================================================
// LOGGING
// ============================================================

console.log(`[SW] Service Worker ${CACHE_VERSION} initialized`);
console.log('[SW] Cache names:', CACHE_NAMES);