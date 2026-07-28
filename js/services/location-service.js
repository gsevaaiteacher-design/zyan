// ============================================================
// FILE: js/services/location-service.js
// PURPOSE: Complete Location Services - PRODUCTION READY
// DEPENDENCY: error-handler.js, logger.js, database-service.js
// USED BY: upload-screen.js, explore-screen.js, product-detail.js, all screens
// VERSION: 3.0.0 - FULLY UPDATED
// ============================================================

import { errorHandler, locationError, networkError } from './error-handler.js';
import { logger } from './logger.js';
import { databaseService } from './database-service.js';
import { cacheService } from './cache-service.js';


// ============================================================
// LOCATION CONFIGURATION
// ============================================================

const LOCATION_CONFIG = {
    // Enable/Disable location services
    enabled: true,
    
    // Default location (Fallback)
    defaultLocation: {
        lat: 28.6139,
        lng: 77.2090,
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        pincode: '110001'
    },
    
    // Geolocation options
    geolocation: {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000
    },
    
    // Distance calculation unit
    distanceUnit: 'km', // 'km' or 'mi'
    
    // Max distance for nearby search (km)
    maxNearbyDistance: 100,
    
    // Cache duration (ms)
    cacheDuration: 5 * 60 * 1000, // 5 minutes
    
    // Reverse geocoding endpoint
    reverseGeocodeEndpoint: 'https://nominatim.openstreetmap.org/reverse',
    
    // Search endpoint
    searchEndpoint: 'https://nominatim.openstreetmap.org/search',
    
    // Rate limiting
    maxRequestsPerMinute: 10,
    
    // Allowed countries
    allowedCountries: ['IN', 'US', 'GB', 'CA', 'AU', 'AE', 'SA', 'PK', 'BD'],
    
    // IP Geolocation fallback
    ipGeolocationEnabled: true,
    ipGeolocationEndpoint: 'https://ipapi.co/json/'
};

// ============================================================
// LOCATION SERVICE CLASS
// ============================================================

class LocationService {
    constructor() {
        this._initialized = false;
        this._enabled = LOCATION_CONFIG.enabled;
        this._currentLocation = null;
        this._watchId = null;
        this._listeners = [];
        this._geocodeCache = new Map();
        this._reverseGeocodeCache = new Map();
        this._nearbyCache = new Map();
        this._requestCount = 0;
        this._lastRequestTime = Date.now();
        this._watchCallbacks = [];
        this._permissionGranted = false;
        this._permissionDenied = false;
        this._isWatching = false;
        this._lastLocationUpdate = null;
        this._accuracy = 0;
        this._heading = 0;
        this._speed = 0;
        this._altitude = 0;
        this._locationHistory = [];
        this._maxHistory = 100;
        this._ipLocation = null;
        this._ipLocationFetched = false;
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    /**
     * Initialize location service
     */
    async init(options = {}) {
        if (this._initialized) return;

        const {
            enabled = true,
            defaultLocation = LOCATION_CONFIG.defaultLocation,
            enableHighAccuracy = true,
            timeout = 30000,
            maxNearbyDistance = 100
        } = options;

        try {
            this._enabled = enabled;
            this._defaultLocation = defaultLocation;
            LOCATION_CONFIG.geolocation.enableHighAccuracy = enableHighAccuracy;
            LOCATION_CONFIG.geolocation.timeout = timeout;
            LOCATION_CONFIG.maxNearbyDistance = maxNearbyDistance;

            if (!this._enabled) {
                logger.info('📍 Location services are disabled');
                this._initialized = true;
                return this;
            }

            // Check if geolocation is supported
            if (!('geolocation' in navigator)) {
                logger.warn('📍 Geolocation is not supported by this browser');
                this._currentLocation = this._defaultLocation;
                this._initialized = true;
                return this;
            }

            // Try to get current location
            try {
                await this.getCurrentLocation();
            } catch (error) {
                logger.warn('📍 Failed to get current location, using default', { error: error.message });
                this._currentLocation = this._defaultLocation;
            }

            // Try to get IP location as fallback
            if (LOCATION_CONFIG.ipGeolocationEnabled && !this._currentLocation) {
                await this._fetchIPLocation();
            }

            this._initialized = true;

            logger.info('📍 Location Service initialized', {
                hasLocation: !!this._currentLocation,
                accuracy: this._accuracy,
                permission: this._permissionGranted ? 'granted' : 'unknown'
            });

            return this;
        } catch (error) {
            logger.error('❌ Location Service initialization failed', { error: error.message });
            throw error;
        }
    }

    // ============================================
    // PERMISSION MANAGEMENT
    // ============================================

    /**
     * Request location permission
     */
    async requestPermission() {
        if (this._permissionGranted) return true;
        if (this._permissionDenied) return false;

        try {
            if (!('geolocation' in navigator)) {
                throw locationError('Geolocation not supported', { code: 'NOT_SUPPORTED' });
            }

            const permission = await navigator.permissions.query({ name: 'geolocation' });
            
            if (permission.state === 'granted') {
                this._permissionGranted = true;
                return true;
            }

            if (permission.state === 'denied') {
                this._permissionDenied = true;
                throw locationError('Location permission denied', { code: 'PERMISSION_DENIED' });
            }

            // State is 'prompt' - try to get location which will trigger permission prompt
            try {
                await this.getCurrentLocation();
                this._permissionGranted = true;
                return true;
            } catch (error) {
                if (error.message.includes('denied')) {
                    this._permissionDenied = true;
                }
                throw error;
            }
        } catch (error) {
            logger.error('❌ Failed to request location permission', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'LOCATION',
                context: { action: 'request_permission' }
            });
        }
    }

    /**
     * Check if location permission is granted
     */
    hasPermission() {
        return this._permissionGranted;
    }

    // ============================================
    // LOCATION RETRIEVAL
    // ============================================

    /**
     * Get current location
     */
    async getCurrentLocation(options = {}) {
        if (!this._enabled) return this._defaultLocation;

        const {
            enableHighAccuracy = LOCATION_CONFIG.geolocation.enableHighAccuracy,
            timeout = LOCATION_CONFIG.geolocation.timeout,
            maximumAge = LOCATION_CONFIG.geolocation.maximumAge,
            force = false
        } = options;

        // Check cache
        const cacheKey = 'current_location';
        if (!force) {
            const cached = cacheService.get(cacheKey);
            if (cached) {
                this._currentLocation = cached;
                return cached;
            }
        }

        try {
            if (!('geolocation' in navigator)) {
                throw locationError('Geolocation not supported', { code: 'NOT_SUPPORTED' });
            }

            const position = await this._getPosition(enableHighAccuracy, timeout, maximumAge);
            
            const locationData = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude || null,
                heading: position.coords.heading || null,
                speed: position.coords.speed || null,
                timestamp: new Date(position.timestamp).toISOString()
            };

            // Get address details
            try {
                const address = await this.reverseGeocode(locationData.lat, locationData.lng);
                locationData.address = address;
                locationData.city = address.city || address.town || address.village || '';
                locationData.state = address.state || '';
                locationData.country = address.country || '';
                locationData.pincode = address.postcode || '';
                locationData.countryCode = address.country_code?.toUpperCase() || '';
            } catch (error) {
                logger.warn('📍 Failed to get address details', { error: error.message });
                locationData.city = '';
                locationData.state = '';
                locationData.country = '';
                locationData.pincode = '';
                locationData.countryCode = '';
            }

            this._currentLocation = locationData;
            this._accuracy = position.coords.accuracy;
            this._heading = position.coords.heading || 0;
            this._speed = position.coords.speed || 0;
            this._altitude = position.coords.altitude || 0;
            this._lastLocationUpdate = Date.now();

            // Add to history
            this._addToHistory(locationData);

            // Cache
            cacheService.set(cacheKey, locationData, { ttl: LOCATION_CONFIG.cacheDuration });

            // Notify listeners
            this._notifyListeners('location_updated', locationData);

            logger.info('📍 Location updated', {
                lat: locationData.lat,
                lng: locationData.lng,
                accuracy: locationData.accuracy,
                city: locationData.city
            });

            return locationData;
        } catch (error) {
            logger.error('❌ Failed to get current location', { error: error.message });
            
            // Return cached or default
            const cached = cacheService.get('current_location');
            if (cached) {
                return cached;
            }
            
            if (this._ipLocation) {
                return this._ipLocation;
            }
            
            // Try IP location
            if (LOCATION_CONFIG.ipGeolocationEnabled && !this._ipLocationFetched) {
                await this._fetchIPLocation();
                if (this._ipLocation) {
                    return this._ipLocation;
                }
            }

            return this._defaultLocation;
        }
    }

    /**
     * Get position from geolocation API
     */
    _getPosition(enableHighAccuracy, timeout, maximumAge) {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                resolve,
                (error) => {
                    let message = 'Failed to get location';
                    if (error.code === 1) message = 'Location permission denied';
                    else if (error.code === 2) message = 'Location unavailable';
                    else if (error.code === 3) message = 'Location request timeout';
                    reject(new Error(message));
                },
                {
                    enableHighAccuracy,
                    timeout,
                    maximumAge
                }
            );
        });
    }

    /**
     * Watch location changes
     */
    watchLocation(callback, options = {}) {
        if (!this._enabled) {
            callback(this._defaultLocation);
            return () => {};
        }

        const {
            enableHighAccuracy = LOCATION_CONFIG.geolocation.enableHighAccuracy,
            timeout = LOCATION_CONFIG.geolocation.timeout
        } = options;

        // Add callback
        this._watchCallbacks.push(callback);

        // Start watching if not already
        if (!this._isWatching && 'geolocation' in navigator) {
            this._watchId = navigator.geolocation.watchPosition(
                async (position) => {
                    const locationData = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude || null,
                        heading: position.coords.heading || null,
                        speed: position.coords.speed || null,
                        timestamp: new Date(position.timestamp).toISOString()
                    };

                    this._currentLocation = locationData;
                    this._accuracy = position.coords.accuracy;
                    this._heading = position.coords.heading || 0;
                    this._speed = position.coords.speed || 0;
                    this._altitude = position.coords.altitude || 0;
                    this._lastLocationUpdate = Date.now();
                    this._addToHistory(locationData);

                    // Notify callbacks
                    for (const cb of this._watchCallbacks) {
                        try {
                            cb(locationData);
                        } catch (e) {
                            // Ignore callback errors
                        }
                    }

                    this._notifyListeners('location_changed', locationData);
                },
                (error) => {
                    logger.warn('📍 Location watch error', { error: error.message });
                },
                {
                    enableHighAccuracy,
                    timeout
                }
            );
            this._isWatching = true;
        }

        // Return unsubscribe function
        return () => {
            this._watchCallbacks = this._watchCallbacks.filter(cb => cb !== callback);
            if (this._watchCallbacks.length === 0 && this._watchId !== null) {
                navigator.geolocation.clearWatch(this._watchId);
                this._watchId = null;
                this._isWatching = false;
            }
        };
    }

    /**
     * Stop watching location
     */
    stopWatching() {
        if (this._watchId !== null) {
            navigator.geolocation.clearWatch(this._watchId);
            this._watchId = null;
            this._isWatching = false;
        }
        this._watchCallbacks = [];
        logger.info('📍 Location watching stopped');
    }

    // ============================================
    // GEOCODING
    // ============================================

    /**
     * Search location by query
     */
    async searchLocation(query, options = {}) {
        if (!this._enabled) return [];

        const {
            limit = 5,
            country = null,
            language = 'en'
        } = options;

        try {
            const cacheKey = `search_${query}_${country}_${language}`;
            const cached = this._geocodeCache.get(cacheKey);
            if (cached && cached.expiry > Date.now()) {
                return cached.data;
            }

            // Rate limiting
            this._checkRateLimit();

            const params = new URLSearchParams({
                q: query,
                format: 'json',
                addressdetails: '1',
                limit: limit.toString(),
                'accept-language': language
            });

            if (country) {
                params.append('countrycodes', country);
            }

            const url = `${LOCATION_CONFIG.searchEndpoint}?${params.toString()}`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'ZYMORE-App/3.0'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            const results = data.map(item => ({
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                displayName: item.display_name,
                address: item.address || {},
                city: item.address?.city || item.address?.town || item.address?.village || '',
                state: item.address?.state || '',
                country: item.address?.country || '',
                pincode: item.address?.postcode || '',
                countryCode: item.address?.country_code?.toUpperCase() || '',
                type: item.type || '',
                class: item.class || '',
                importance: item.importance || 0
            }));

            // Cache
            this._geocodeCache.set(cacheKey, {
                data: results,
                expiry: Date.now() + LOCATION_CONFIG.cacheDuration
            });

            return results;
        } catch (error) {
            logger.error('❌ Failed to search location', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'LOCATION',
                context: { query, action: 'search' }
            });
        }
    }

    /**
     * Reverse geocode coordinates to address
     */
    async reverseGeocode(lat, lng, options = {}) {
        if (!this._enabled) return {};

        const {
            language = 'en',
            zoom = 18
        } = options;

        try {
            const cacheKey = `reverse_${lat}_${lng}_${language}`;
            const cached = this._reverseGeocodeCache.get(cacheKey);
            if (cached && cached.expiry > Date.now()) {
                return cached.data;
            }

            // Rate limiting
            this._checkRateLimit();

            const params = new URLSearchParams({
                lat: lat.toString(),
                lon: lng.toString(),
                format: 'json',
                addressdetails: '1',
                zoom: zoom.toString(),
                'accept-language': language
            });

            const url = `${LOCATION_CONFIG.reverseGeocodeEndpoint}?${params.toString()}`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'ZYMORE-App/3.0'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const address = data.address || {};

            const result = {
                ...address,
                displayName: data.display_name || '',
                lat: parseFloat(data.lat || lat),
                lng: parseFloat(data.lon || lng),
                city: address.city || address.town || address.village || '',
                state: address.state || address.region || '',
                country: address.country || '',
                pincode: address.postcode || '',
                countryCode: address.country_code?.toUpperCase() || '',
                road: address.road || '',
                neighbourhood: address.neighbourhood || '',
                suburb: address.suburb || '',
                county: address.county || '',
                postcode: address.postcode || ''
            };

            // Cache
            this._reverseGeocodeCache.set(cacheKey, {
                data: result,
                expiry: Date.now() + LOCATION_CONFIG.cacheDuration
            });

            return result;
        } catch (error) {
            logger.error('❌ Failed to reverse geocode', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'LOCATION',
                context: { lat, lng, action: 'reverse_geocode' }
            });
        }
    }

    // ============================================
    // NEARBY SEARCH
    // ============================================

    /**
     * Find nearby locations
     */
    async findNearby(lat, lng, radius = 10, options = {}) {
        if (!this._enabled) return [];

        const {
            category = null,
            type = null,
            limit = 50,
            language = 'en'
        } = options;

        try {
            const cacheKey = `nearby_${lat}_${lng}_${radius}_${category}_${type}`;
            const cached = this._nearbyCache.get(cacheKey);
            if (cached && cached.expiry > Date.now()) {
                return cached.data;
            }

            // Rate limiting
            this._checkRateLimit();

            let query = 'nearby';
            if (category) query += ` ${category}`;
            if (type) query += ` ${type}`;

            const params = new URLSearchParams({
                q: query,
                format: 'json',
                addressdetails: '1',
                limit: limit.toString(),
                'accept-language': language,
                lat: lat.toString(),
                lon: lng.toString(),
                radius: radius.toString()
            });

            const url = `${LOCATION_CONFIG.searchEndpoint}?${params.toString()}`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'ZYMORE-App/3.0'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            const results = data.map(item => ({
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                displayName: item.display_name,
                distance: this.calculateDistance(lat, lng, parseFloat(item.lat), parseFloat(item.lon)),
                address: item.address || {},
                city: item.address?.city || item.address?.town || item.address?.village || '',
                state: item.address?.state || '',
                country: item.address?.country || '',
                pincode: item.address?.postcode || '',
                countryCode: item.address?.country_code?.toUpperCase() || '',
                type: item.type || '',
                class: item.class || '',
                importance: item.importance || 0
            }));

            // Sort by distance
            results.sort((a, b) => a.distance - b.distance);

            // Cache
            this._nearbyCache.set(cacheKey, {
                data: results,
                expiry: Date.now() + LOCATION_CONFIG.cacheDuration
            });

            return results;
        } catch (error) {
            logger.error('❌ Failed to find nearby locations', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'LOCATION',
                context: { lat, lng, radius, action: 'nearby' }
            });
        }
    }

    // ============================================
    // DISTANCE CALCULATIONS
    // ============================================

    /**
     * Calculate distance between two coordinates
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = LOCATION_CONFIG.distanceUnit === 'km' ? 6371 : 3959;
        const dLat = this._toRad(lat2 - lat1);
        const dLng = this._toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this._toRad(lat1)) * Math.cos(this._toRad(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Convert degrees to radians
     */
    _toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Check if coordinates are within radius
     */
    isWithinRadius(lat1, lng1, lat2, lng2, radius) {
        const distance = this.calculateDistance(lat1, lng1, lat2, lng2);
        return distance <= radius;
    }

    /**
     * Get bounding box from center and radius
     */
    getBoundingBox(lat, lng, radius) {
        const R = 6371;
        const latRad = this._toRad(lat);
        const lngRad = this._toRad(lng);
        const radiusRad = radius / R;

        const minLat = lat - (radiusRad / Math.PI * 180);
        const maxLat = lat + (radiusRad / Math.PI * 180);
        const minLng = lng - (radiusRad / Math.PI * 180 / Math.cos(latRad));
        const maxLng = lng + (radiusRad / Math.PI * 180 / Math.cos(latRad));

        return {
            minLat,
            maxLat,
            minLng,
            maxLng,
            center: { lat, lng },
            radius
        };
    }

    // ============================================
    // IP LOCATION
    // ============================================

    /**
     * Fetch location from IP
     */
    async _fetchIPLocation() {
        if (this._ipLocationFetched) return;

        try {
            const response = await fetch(LOCATION_CONFIG.ipGeolocationEndpoint);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            this._ipLocation = {
                lat: data.latitude || 0,
                lng: data.longitude || 0,
                city: data.city || '',
                state: data.region || '',
                country: data.country_name || '',
                countryCode: data.country_code?.toUpperCase() || '',
                pincode: data.postal || '',
                ip: data.ip || '',
                accuracy: 'ip',
                timestamp: new Date().toISOString(),
                source: 'ip_geolocation'
            };

            this._ipLocationFetched = true;

            if (!this._currentLocation) {
                this._currentLocation = this._ipLocation;
                logger.info('📍 IP location fetched', { city: this._ipLocation.city, country: this._ipLocation.country });
            }
        } catch (error) {
            logger.warn('📍 Failed to fetch IP location', { error: error.message });
        }
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Check rate limit
     */
    _checkRateLimit() {
        const now = Date.now();
        if (now - this._lastRequestTime > 60000) {
            this._requestCount = 0;
            this._lastRequestTime = now;
        }

        this._requestCount++;
        if (this._requestCount > LOCATION_CONFIG.maxRequestsPerMinute) {
            throw locationError('Rate limit exceeded', { code: 'RATE_LIMIT' });
        }
    }

    /**
     * Add location to history
     */
    _addToHistory(location) {
        this._locationHistory.push({
            ...location,
            recordedAt: new Date().toISOString()
        });

        if (this._locationHistory.length > this._maxHistory) {
            this._locationHistory.shift();
        }
    }

    /**
     * Get location history
     */
    getLocationHistory(limit = 10) {
        return this._locationHistory.slice(-limit).reverse();
    }

    /**
     * Clear location history
     */
    clearHistory() {
        this._locationHistory = [];
        logger.info('📍 Location history cleared');
    }

    /**
     * Get current location
     */
    getLocation() {
        return this._currentLocation || this._defaultLocation;
    }

    /**
     * Get current location with address
     */
    async getLocationWithAddress() {
        const location = await this.getCurrentLocation();
        if (!location.address) {
            try {
                location.address = await this.reverseGeocode(location.lat, location.lng);
            } catch (error) {
                logger.warn('📍 Failed to get address', { error: error.message });
            }
        }
        return location;
    }

    /**
     * Get distance unit
     */
    getDistanceUnit() {
        return LOCATION_CONFIG.distanceUnit;
    }

    /**
     * Set distance unit
     */
    setDistanceUnit(unit) {
        if (unit === 'km' || unit === 'mi') {
            LOCATION_CONFIG.distanceUnit = unit;
            logger.info(`📍 Distance unit set to ${unit}`);
        }
    }

    /**
     * Get default location
     */
    getDefaultLocation() {
        return { ...this._defaultLocation };
    }

    /**
     * Set default location
     */
    setDefaultLocation(location) {
        this._defaultLocation = { ...location };
        if (!this._currentLocation) {
            this._currentLocation = this._defaultLocation;
        }
        logger.info('📍 Default location updated');
    }

    /**
     * Validate coordinates
     */
    isValidCoordinates(lat, lng) {
        return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }

    /**
     * Format location display
     */
    formatLocation(location, format = 'full') {
        if (!location) return '';

        const formats = {
            full: () => {
                const parts = [];
                if (location.city) parts.push(location.city);
                if (location.state) parts.push(location.state);
                if (location.country) parts.push(location.country);
                if (location.pincode) parts.push(location.pincode);
                return parts.join(', ') || `${location.lat}, ${location.lng}`;
            },
            short: () => {
                const parts = [];
                if (location.city) parts.push(location.city);
                if (location.country) parts.push(location.country);
                return parts.join(', ') || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
            },
            coordinates: () => {
                return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
            },
            city: () => {
                return location.city || location.town || location.village || '';
            },
            state: () => {
                return location.state || location.region || '';
            },
            country: () => {
                return location.country || '';
            }
        };

        const formatter = formats[format] || formats.full;
        return formatter();
    }

    /**
     * Get location suggestions
     */
    async getSuggestions(query, options = {}) {
        if (!query || query.length < 2) return [];
        
        try {
            const results = await this.searchLocation(query, options);
            return results.map(item => ({
                display: item.displayName,
                value: item,
                city: item.city,
                state: item.state,
                country: item.country,
                lat: item.lat,
                lng: item.lng
            }));
        } catch (error) {
            logger.error('❌ Failed to get suggestions', { error: error.message });
            return [];
        }
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    /**
     * Add listener
     */
    addListener(callback) {
        this._listeners.push(callback);
        return () => {
            this._listeners = this._listeners.filter(c => c !== callback);
        };
    }

    /**
     * Notify listeners
     */
    _notifyListeners(event, data) {
        for (const listener of this._listeners) {
            try {
                listener(event, data);
            } catch (e) {
                // Ignore
            }
        }
    }

    // ============================================
    // CLEANUP
    // ============================================

    /**
     * Clear cache
     */
    clearCache() {
        this._geocodeCache.clear();
        this._reverseGeocodeCache.clear();
        this._nearbyCache.clear();
        cacheService.delete('current_location');
        logger.info('📍 Location cache cleared');
    }

    /**
     * Destroy location service
     */
    destroy() {
        this.stopWatching();
        this._geocodeCache.clear();
        this._reverseGeocodeCache.clear();
        this._nearbyCache.clear();
        this._listeners = [];
        this._watchCallbacks = [];
        this._locationHistory = [];
        this._initialized = false;
        logger.info('📍 Location service destroyed');
    }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

const locationService = new LocationService();

// ============================================================
// EXPORTS
// ============================================================

export { locationService, LOCATION_CONFIG };

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Initialize location service
 */
export function initLocation(options = {}) {
    return locationService.init(options);
}

/**
 * Get current location
 */
export function getCurrentLocation(options = {}) {
    return locationService.getCurrentLocation(options);
}

/**
 * Get location with address
 */
export function getLocationWithAddress() {
    return locationService.getLocationWithAddress();
}

/**
 * Watch location
 */
export function watchLocation(callback, options = {}) {
    return locationService.watchLocation(callback, options);
}

/**
 * Stop watching location
 */
export function stopWatchingLocation() {
    return locationService.stopWatching();
}

/**
 * Search location
 */
export function searchLocation(query, options = {}) {
    return locationService.searchLocation(query, options);
}

/**
 * Reverse geocode
 */
export function reverseGeocode(lat, lng, options = {}) {
    return locationService.reverseGeocode(lat, lng, options);
}

/**
 * Find nearby locations
 */
export function findNearby(lat, lng, radius = 10, options = {}) {
    return locationService.findNearby(lat, lng, radius, options);
}

/**
 * Calculate distance
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
    return locationService.calculateDistance(lat1, lng1, lat2, lng2);
}

/**
 * Check if within radius
 */
export function isWithinRadius(lat1, lng1, lat2, lng2, radius) {
    return locationService.isWithinRadius(lat1, lng1, lat2, lng2, radius);
}

/**
 * Get bounding box
 */
export function getBoundingBox(lat, lng, radius) {
    return locationService.getBoundingBox(lat, lng, radius);
}

/**
 * Get location history
 */
export function getLocationHistory(limit = 10) {
    return locationService.getLocationHistory(limit);
}

/**
 * Clear history
 */
export function clearLocationHistory() {
    return locationService.clearHistory();
}

/**
 * Get current location
 */
export function getLocation() {
    return locationService.getLocation();
}

/**
 * Get default location
 */
export function getDefaultLocation() {
    return locationService.getDefaultLocation();
}

/**
 * Set default location
 */
export function setDefaultLocation(location) {
    return locationService.setDefaultLocation(location);
}

/**
 * Validate coordinates
 */
export function isValidCoordinates(lat, lng) {
    return locationService.isValidCoordinates(lat, lng);
}

/**
 * Format location
 */
export function formatLocation(location, format = 'full') {
    return locationService.formatLocation(location, format);
}

/**
 * Get suggestions
 */
export function getLocationSuggestions(query, options = {}) {
    return locationService.getSuggestions(query, options);
}

/**
 * Request permission
 */
export function requestLocationPermission() {
    return locationService.requestPermission();
}

/**
 * Check permission
 */
export function hasLocationPermission() {
    return locationService.hasPermission();
}

/**
 * Get distance unit
 */
export function getDistanceUnit() {
    return locationService.getDistanceUnit();
}

/**
 * Set distance unit
 */
export function setDistanceUnit(unit) {
    return locationService.setDistanceUnit(unit);
}

/**
 * Add location listener
 */
export function onLocationEvent(callback) {
    return locationService.addListener(callback);
}

/**
 * Clear location cache
 */
export function clearLocationCache() {
    return locationService.clearCache();
}

/**
 * Destroy location service
 */
export function destroyLocationService() {
    return locationService.destroy();
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export { LocationService };