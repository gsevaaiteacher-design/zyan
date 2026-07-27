// ============================================================
// FILE: js/widgets/location-picker.js
// PURPOSE: Location picker component with map, search, and geolocation
// DEPENDENCY: constants.js, helpers.js, event-bus.js
// USED BY: upload-screen.js, profile-screen.js, explore-screen.js
// ============================================================

import { APP_CONSTANTS } from '../utils/constants.js';
import { debounce, generateUUID } from '../utils/helpers.js';
import { EventBus } from '../state/event-bus.js';

export class LocationPicker {
    constructor(options = {}) {
        this.containerId = options.containerId || 'location-picker-container';
        this.initialLocation = options.initialLocation || null;
        this.placeholder = options.placeholder || 'Search for a location...';
        this.enableGeolocation = options.enableGeolocation !== false;
        this.enableSearch = options.enableSearch !== false;
        this.enableMap = options.enableMap !== false;
        this.enableCurrentLocation = options.enableCurrentLocation !== false;
        this.countryRestrict = options.countryRestrict || null;
        this.radius = options.radius || 50;
        this.mapZoom = options.mapZoom || 14;
        this.onLocationSelect = options.onLocationSelect || null;
        this.onError = options.onError || null;
        this.suggestions = options.suggestions || [];
        this.mapId = options.mapId || 'location-map-' + generateUUID().substr(0, 8);
        this.element = null;
        this.isDestroyed = false;
        this.map = null;
        this.marker = null;
        this.autocomplete = null;
        this.geocoder = null;
        this.selectedLocation = null;
        this.searchInput = null;
        this.suggestionsContainer = null;
        this.currentPosition = null;
        this.isLoading = false;
        this.render = this.render.bind(this);
        this.destroy = this.destroy.bind(this);
        this.setLocation = this.setLocation.bind(this);
        this.getLocation = this.getLocation.bind(this);
        this.search = this.search.bind(this);
        this.useCurrentLocation = this.useCurrentLocation.bind(this);
        this.clear = this.clear.bind(this);
        this._handleSearchInput = this._handleSearchInput.bind(this);
        this._handleSearchSelect = this._handleSearchSelect.bind(this);
        this._handleMapClick = this._handleMapClick.bind(this);
        this._handleGeolocation = this._handleGeolocation.bind(this);
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._handleClickOutside = this._handleClickOutside.bind(this);
        this._initMap = this._initMap.bind(this);
        this._reverseGeocode = this._reverseGeocode.bind(this);
        this._updateMarker = this._updateMarker.bind(this);
    }

    render() {
        if (this.isDestroyed) return null;
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error('[LocationPicker] Container #' + this.containerId + ' not found');
            return null;
        }
        container.innerHTML = '';
        this.element = document.createElement('div');
        this.element.className = 'location-picker-root';
        this.element.setAttribute('role', 'region');
        this.element.setAttribute('aria-label', 'Location picker');
        this.element.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: 100%;
            font-family: inherit;
        `;
        const searchWrapper = document.createElement('div');
        searchWrapper.className = 'location-search-wrapper';
        searchWrapper.style.cssText = `
            position: relative;
            width: 100%;
        `;
        const searchRow = document.createElement('div');
        searchRow.className = 'location-search-row';
        searchRow.style.cssText = `
            display: flex;
            gap: 8px;
            align-items: center;
        `;
        if (this.enableSearch) {
            this.searchInput = document.createElement('input');
            this.searchInput.type = 'text';
            this.searchInput.className = 'location-search-input';
            this.searchInput.placeholder = this.placeholder;
            this.searchInput.setAttribute('aria-label', 'Search location');
            this.searchInput.setAttribute('autocomplete', 'off');
            this.searchInput.style.cssText = `
                flex: 1;
                padding: 10px 14px;
                border: 2px solid #e5e7eb;
                border-radius: 10px;
                font-size: 14px;
                outline: none;
                transition: all 0.2s ease;
                background: #ffffff;
                color: #1f2937;
                min-width: 0;
            `;
            this.searchInput.addEventListener('focus', () => {
                this.searchInput.style.borderColor = '#6366f1';
                this.searchInput.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
            });
            this.searchInput.addEventListener('blur', () => {
                this.searchInput.style.borderColor = '#e5e7eb';
                this.searchInput.style.boxShadow = 'none';
            });
            this.searchInput.addEventListener('input', debounce(this._handleSearchInput, 300));
            this.searchInput.addEventListener('keydown', this._handleKeyDown);
            searchRow.appendChild(this.searchInput);
            this.suggestionsContainer = document.createElement('div');
            this.suggestionsContainer.className = 'location-suggestions';
            this.suggestionsContainer.setAttribute('role', 'listbox');
            this.suggestionsContainer.style.cssText = `
                position: absolute;
                top: calc(100% + 4px);
                left: 0;
                right: 0;
                background: #ffffff;
                border-radius: 10px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.12);
                max-height: 240px;
                overflow-y: auto;
                z-index: 1000;
                display: none;
                border: 1px solid #e5e7eb;
            `;
            searchWrapper.appendChild(searchRow);
            searchWrapper.appendChild(this.suggestionsContainer);
        }
        if (this.enableCurrentLocation) {
            const locBtn = document.createElement('button');
            locBtn.className = 'location-current-btn';
            locBtn.innerHTML = '📍';
            locBtn.setAttribute('aria-label', 'Use current location');
            locBtn.title = 'Use current location';
            locBtn.style.cssText = `
                padding: 10px 14px;
                border: 2px solid #e5e7eb;
                border-radius: 10px;
                background: #ffffff;
                cursor: pointer;
                font-size: 18px;
                transition: all 0.2s ease;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                min-width: 44px;
                min-height: 44px;
            `;
            locBtn.addEventListener('mouseenter', () => {
                locBtn.style.borderColor = '#6366f1';
                locBtn.style.background = '#f3f4f6';
            });
            locBtn.addEventListener('mouseleave', () => {
                locBtn.style.borderColor = '#e5e7eb';
                locBtn.style.background = '#ffffff';
            });
            locBtn.addEventListener('click', this.useCurrentLocation);
            searchRow.appendChild(locBtn);
        }
        if (this.enableSearch) {
            this.element.appendChild(searchWrapper);
        }
        if (this.enableMap) {
            const mapContainer = document.createElement('div');
            mapContainer.id = this.mapId;
            mapContainer.className = 'location-map-container';
            mapContainer.style.cssText = `
                width: 100%;
                height: 280px;
                border-radius: 12px;
                overflow: hidden;
                background: #e5e7eb;
                border: 2px solid #e5e7eb;
                position: relative;
                transition: border-color 0.2s ease;
            `;
            this.element.appendChild(mapContainer);
            setTimeout(() => {
                this._initMap();
            }, 100);
        }
        const infoRow = document.createElement('div');
        infoRow.className = 'location-info-row';
        infoRow.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: #6b7280;
            padding: 4px 0;
            min-height: 24px;
        `;
        this._locationInfo = document.createElement('span');
        this._locationInfo.className = 'location-info-text';
        this._locationInfo.textContent = this.initialLocation ? this.initialLocation.address || 'Location selected' : 'No location selected';
        infoRow.appendChild(this._locationInfo);
        this.element.appendChild(infoRow);
        container.appendChild(this.element);
        this._bindEvents();
        if (this.initialLocation) {
            this.setLocation(this.initialLocation);
        }
        EventBus.emit('location:picker:render', {
            containerId: this.containerId
        });
        return this.element;
    }

    _initMap() {
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
            console.warn('[LocationPicker] Google Maps not loaded');
            return;
        }
        const mapContainer = document.getElementById(this.mapId);
        if (!mapContainer) return;
        const center = this.initialLocation ?
            { lat: this.initialLocation.lat || 28.6139, lng: this.initialLocation.lng || 77.2090 } :
            { lat: 28.6139, lng: 77.2090 };
        try {
            this.map = new google.maps.Map(mapContainer, {
                center: center,
                zoom: this.mapZoom,
                mapTypeControl: false,
                fullscreenControl: true,
                streetViewControl: false,
                zoomControl: true,
                styles: [
                    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
                    { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] }
                ]
            });
            this.marker = new google.maps.Marker({
                map: this.map,
                draggable: true,
                animation: google.maps.Animation.DROP,
                icon: {
                    url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236366f1"%3E%3Cpath d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/%3E%3C/svg%3E',
                    scaledSize: new google.maps.Size(36, 36),
                    anchor: new google.maps.Point(12, 36)
                }
            });
            if (this.initialLocation) {
                this.marker.setPosition({
                    lat: this.initialLocation.lat,
                    lng: this.initialLocation.lng
                });
                this.map.setCenter({
                    lat: this.initialLocation.lat,
                    lng: this.initialLocation.lng
                });
                this.selectedLocation = this.initialLocation;
                this._updateLocationInfo(this.initialLocation);
            }
            google.maps.event.addListener(this.marker, 'dragend', (event) => {
                const position = event.latLng;
                const lat = position.lat();
                const lng = position.lng();
                this._reverseGeocode(lat, lng);
            });
            google.maps.event.addListener(this.map, 'click', (event) => {
                const lat = event.latLng.lat();
                const lng = event.latLng.lng();
                this._reverseGeocode(lat, lng);
            });
            google.maps.event.addListener(this.map, 'idle', () => {
                if (this.map) {
                    mapContainer.style.borderColor = '#e5e7eb';
                }
            });
            EventBus.emit('location:map:loaded', {
                containerId: this.containerId
            });
        } catch (error) {
            console.error('[LocationPicker] Map initialization error:', error);
            mapContainer.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9ca3af;flex-direction:column;gap:8px;">
                    <span style="font-size:32px;">🗺️</span>
                    <span>Map could not be loaded</span>
                </div>
            `;
            if (this.onError) this.onError(error);
        }
    }

    _reverseGeocode(lat, lng) {
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
            this._updateMarker(lat, lng);
            return;
        }
        if (!this.geocoder) {
            this.geocoder = new google.maps.Geocoder();
        }
        const location = { lat: lat, lng: lng };
        this.geocoder.geocode({ location: location }, (results, status) => {
            if (status === 'OK' && results && results.length > 0) {
                const result = results[0];
                const address = result.formatted_address;
                const components = this._parseAddressComponents(result.address_components);
                const locationData = {
                    lat: lat,
                    lng: lng,
                    address: address,
                    city: components.city || components.locality || '',
                    state: components.state || '',
                    country: components.country || '',
                    pincode: components.pincode || '',
                    formatted: address,
                    placeId: result.place_id,
                    components: components
                };
                this.selectedLocation = locationData;
                this._updateMarker(lat, lng);
                this._updateLocationInfo(locationData);
                if (this.onLocationSelect) {
                    this.onLocationSelect(locationData);
                }
                EventBus.emit('location:selected', {
                    location: locationData
                });
            } else {
                this._updateMarker(lat, lng);
                this.selectedLocation = {
                    lat: lat,
                    lng: lng,
                    address: 'Location at ' + lat.toFixed(6) + ', ' + lng.toFixed(6),
                    formatted: 'Location at ' + lat.toFixed(6) + ', ' + lng.toFixed(6)
                };
                this._updateLocationInfo(this.selectedLocation);
                if (this.onLocationSelect) {
                    this.onLocationSelect(this.selectedLocation);
                }
            }
        });
    }

    _parseAddressComponents(components) {
        const result = {};
        components.forEach((component) => {
            const types = component.types;
            if (types.includes('locality')) result.locality = component.long_name;
            if (types.includes('administrative_area_level_1')) result.state = component.long_name;
            if (types.includes('country')) result.country = component.long_name;
            if (types.includes('postal_code')) result.pincode = component.long_name;
            if (types.includes('city')) result.city = component.long_name;
            if (types.includes('route')) result.street = component.long_name;
            if (types.includes('street_number')) result.streetNumber = component.long_name;
            if (types.includes('neighborhood')) result.neighborhood = component.long_name;
            if (types.includes('sublocality')) result.sublocality = component.long_name;
        });
        return result;
    }

    _updateMarker(lat, lng) {
        if (this.marker) {
            this.marker.setPosition({ lat: lat, lng: lng });
            this.map.setCenter({ lat: lat, lng: lng });
            if (this.map.getZoom() < 12) {
                this.map.setZoom(14);
            }
        }
    }

    _updateLocationInfo(location) {
        if (this._locationInfo) {
            this._locationInfo.textContent = location.address || location.formatted || 'Location selected';
        }
        if (this.searchInput && location.address) {
            this.searchInput.value = location.address;
        }
    }

    _handleSearchInput(event) {
        const query = event.target.value.trim();
        if (!query || query.length < 2) {
            this._hideSuggestions();
            return;
        }
        this._searchPlaces(query);
    }

    _searchPlaces(query) {
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
            this._showLocalSuggestions(query);
            return;
        }
        if (!this.autocomplete) {
            this.autocomplete = new google.maps.places.AutocompleteService();
        }
        const request = {
            input: query,
            componentRestrictions: this.countryRestrict ? { country: this.countryRestrict } : null,
            types: ['geocode']
        };
        this.autocomplete.getPlacePredictions(request, (predictions, status) => {
            if (status === 'OK' && predictions && predictions.length > 0) {
                this._renderSuggestions(predictions);
            } else {
                this._showLocalSuggestions(query);
            }
        });
    }

    _showLocalSuggestions(query) {
        const filtered = this.suggestions.filter(s =>
            s.toLowerCase().includes(query.toLowerCase())
        );
        this._renderLocalSuggestions(filtered);
    }

    _renderSuggestions(predictions) {
        if (!this.suggestionsContainer) return;
        this.suggestionsContainer.innerHTML = '';
        if (predictions.length === 0) {
            this.suggestionsContainer.style.display = 'none';
            return;
        }
        predictions.forEach((prediction, index) => {
            const item = document.createElement('div');
            item.className = 'location-suggestion-item';
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', 'false');
            item.dataset.index = index;
            item.dataset.placeId = prediction.place_id;
            item.textContent = prediction.description;
            item.style.cssText = `
                padding: 10px 14px;
                cursor: pointer;
                transition: background 0.15s ease;
                font-size: 14px;
                color: #1f2937;
                border-bottom: 1px solid #f3f4f6;
            `;
            item.addEventListener('mouseenter', () => {
                item.style.background = '#f3f4f6';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
            });
            item.addEventListener('click', () => {
                this._handleSearchSelect(prediction);
            });
            this.suggestionsContainer.appendChild(item);
        });
        this.suggestionsContainer.style.display = 'block';
        const firstItem = this.suggestionsContainer.querySelector('.location-suggestion-item');
        if (firstItem) {
            firstItem.setAttribute('aria-selected', 'true');
        }
    }

    _renderLocalSuggestions(suggestions) {
        if (!this.suggestionsContainer) return;
        this.suggestionsContainer.innerHTML = '';
        if (suggestions.length === 0) {
            this.suggestionsContainer.style.display = 'none';
            return;
        }
        suggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'location-suggestion-item';
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', 'false');
            item.dataset.index = index;
            item.textContent = suggestion;
            item.style.cssText = `
                padding: 10px 14px;
                cursor: pointer;
                transition: background 0.15s ease;
                font-size: 14px;
                color: #1f2937;
                border-bottom: 1px solid #f3f4f6;
            `;
            item.addEventListener('mouseenter', () => {
                item.style.background = '#f3f4f6';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
            });
            item.addEventListener('click', () => {
                this._handleLocalSelect(suggestion);
            });
            this.suggestionsContainer.appendChild(item);
        });
        this.suggestionsContainer.style.display = 'block';
    }

    _handleSearchSelect(prediction) {
        this._hideSuggestions();
        if (this.searchInput) {
            this.searchInput.value = prediction.description;
        }
        if (typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
            if (!this.geocoder) {
                this.geocoder = new google.maps.Geocoder();
            }
            this.geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
                if (status === 'OK' && results && results.length > 0) {
                    const result = results[0];
                    const location = result.geometry.location;
                    const lat = location.lat();
                    const lng = location.lng();
                    const components = this._parseAddressComponents(result.address_components);
                    const locationData = {
                        lat: lat,
                        lng: lng,
                        address: result.formatted_address,
                        city: components.city || components.locality || '',
                        state: components.state || '',
                        country: components.country || '',
                        pincode: components.pincode || '',
                        formatted: result.formatted_address,
                        placeId: prediction.place_id,
                        components: components
                    };
                    this.selectedLocation = locationData;
                    this._updateMarker(lat, lng);
                    this._updateLocationInfo(locationData);
                    if (this.onLocationSelect) {
                        this.onLocationSelect(locationData);
                    }
                    EventBus.emit('location:selected', {
                        location: locationData
                    });
                }
            });
        }
    }

    _handleLocalSelect(suggestion) {
        this._hideSuggestions();
        if (this.searchInput) {
            this.searchInput.value = suggestion;
        }
        const locationData = {
            lat: 0,
            lng: 0,
            address: suggestion,
            formatted: suggestion,
            city: '',
            state: '',
            country: '',
            pincode: ''
        };
        this.selectedLocation = locationData;
        this._updateLocationInfo(locationData);
        if (this.onLocationSelect) {
            this.onLocationSelect(locationData);
        }
        EventBus.emit('location:selected', {
            location: locationData
        });
    }

    _hideSuggestions() {
        if (this.suggestionsContainer) {
            this.suggestionsContainer.style.display = 'none';
            this.suggestionsContainer.innerHTML = '';
        }
    }

    _handleKeyDown(event) {
        if (event.key === 'Escape') {
            this._hideSuggestions();
            if (this.searchInput) {
                this.searchInput.blur();
            }
        }
        if (event.key === 'Enter') {
            const firstItem = this.suggestionsContainer?.querySelector('.location-suggestion-item');
            if (firstItem) {
                firstItem.click();
            }
        }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const items = this.suggestionsContainer?.querySelectorAll('.location-suggestion-item');
            if (!items || items.length === 0) return;
            let currentIndex = -1;
            items.forEach((item, index) => {
                if (item.getAttribute('aria-selected') === 'true') {
                    currentIndex = index;
                }
            });
            if (event.key === 'ArrowDown') {
                currentIndex = Math.min(currentIndex + 1, items.length - 1);
            } else {
                currentIndex = Math.max(currentIndex - 1, 0);
            }
            items.forEach((item, index) => {
                item.setAttribute('aria-selected', index === currentIndex ? 'true' : 'false');
                if (index === currentIndex) {
                    item.style.background = '#f3f4f6';
                    item.scrollIntoView({ block: 'nearest' });
                } else {
                    item.style.background = 'transparent';
                }
            });
        }
    }

    _handleClickOutside(event) {
        if (this.element && !this.element.contains(event.target)) {
            this._hideSuggestions();
        }
    }

    _bindEvents() {
        if (!this.element) return;
        document.addEventListener('click', this._handleClickOutside);
        document.addEventListener('keydown', this._handleKeyDown);
    }

    useCurrentLocation() {
        if (this.isLoading) return;
        if (!navigator.geolocation) {
            EventBus.emit('toast:show', {
                message: 'Geolocation is not supported by your browser',
                type: 'error'
            });
            return;
        }
        this.isLoading = true;
        if (this.searchInput) {
            this.searchInput.disabled = true;
            this.searchInput.placeholder = 'Getting location...';
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                this.currentPosition = { lat, lng };
                this._reverseGeocode(lat, lng);
                this.isLoading = false;
                if (this.searchInput) {
                    this.searchInput.disabled = false;
                    this.searchInput.placeholder = this.placeholder;
                }
                EventBus.emit('location:current', {
                    lat: lat,
                    lng: lng
                });
            },
            (error) => {
                this.isLoading = false;
                if (this.searchInput) {
                    this.searchInput.disabled = false;
                    this.searchInput.placeholder = this.placeholder;
                }
                let message = 'Unable to get your location';
                if (error.code === 1) message = 'Location access denied. Please enable location services.';
                else if (error.code === 2) message = 'Location unavailable. Please try again.';
                else if (error.code === 3) message = 'Location request timed out. Please try again.';
                EventBus.emit('toast:show', {
                    message: message,
                    type: 'error'
                });
                if (this.onError) this.onError(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 60000
            }
        );
    }

    setLocation(location) {
        if (!location) return;
        const lat = location.lat || 0;
        const lng = location.lng || 0;
        if (lat === 0 && lng === 0) {
            this.selectedLocation = {
                lat: 0,
                lng: 0,
                address: location.address || location.formatted || 'Unknown location',
                formatted: location.address || location.formatted || 'Unknown location',
                city: location.city || '',
                state: location.state || '',
                country: location.country || '',
                pincode: location.pincode || ''
            };
            this._updateLocationInfo(this.selectedLocation);
            if (this.onLocationSelect) {
                this.onLocationSelect(this.selectedLocation);
            }
            return;
        }
        this._reverseGeocode(lat, lng);
    }

    getLocation() {
        return this.selectedLocation || null;
    }

    search(query) {
        if (!query || query.length < 2) return;
        if (this.searchInput) {
            this.searchInput.value = query;
        }
        this._searchPlaces(query);
    }

    clear() {
        this.selectedLocation = null;
        if (this.marker) {
            this.marker.setMap(null);
            this.marker = null;
        }
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        if (this._locationInfo) {
            this._locationInfo.textContent = 'No location selected';
        }
        if (this.map) {
            this.map.setCenter({ lat: 28.6139, lng: 77.2090 });
            this.map.setZoom(5);
        }
        EventBus.emit('location:cleared', {
            containerId: this.containerId
        });
    }

    _handleMapClick(event) {
        // Handled by Google Maps click event
    }

    _handleGeolocation(event) {
        // Handled by useCurrentLocation
    }

    destroy() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        this._hideSuggestions();
        document.removeEventListener('click', this._handleClickOutside);
        document.removeEventListener('keydown', this._handleKeyDown);
        if (this.marker) {
            this.marker.setMap(null);
            this.marker = null;
        }
        if (this.map) {
            google.maps.event.clearInstanceListeners(this.map);
            this.map = null;
        }
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.searchInput = null;
        this.suggestionsContainer = null;
        this._locationInfo = null;
        EventBus.emit('location:picker:destroy', {
            containerId: this.containerId
        });
    }

    static createWithMap(options) {
        return new LocationPicker({
            enableMap: true,
            enableSearch: true,
            enableGeolocation: true,
            enableCurrentLocation: true,
            ...options
        });
    }

    static createSimple(options) {
        return new LocationPicker({
            enableMap: false,
            enableSearch: true,
            enableGeolocation: false,
            enableCurrentLocation: true,
            ...options
        });
    }

    static createMapOnly(options) {
        return new LocationPicker({
            enableMap: true,
            enableSearch: false,
            enableGeolocation: false,
            enableCurrentLocation: false,
            ...options
        });
    }
}

export default LocationPicker;