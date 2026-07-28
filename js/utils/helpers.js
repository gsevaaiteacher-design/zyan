// ============================================================
// FILE: js/utils/helpers.js
// PURPOSE: Ultimate production-grade helper utilities
// DEPENDENCY: NONE
// USED BY: All files
// VERSION: 4.0.0 - ULTIMATE PRODUCTION
// ============================================================

export class Helpers {
    // ============================================================
    // STRING HELPERS
    // ============================================================

    static truncate(str, length = 100, suffix = '...', options = {}) {
        if (!str || typeof str !== 'string') return '';
        const { preserveWords = true, preserveHtml = false } = options;
        if (str.length <= length) return str;
        let text = str;
        if (preserveHtml) {
            const temp = document.createElement('div');
            temp.innerHTML = str;
            text = temp.textContent || temp.innerText || '';
        }
        let truncated = text.substring(0, length).trim();
        if (preserveWords) {
            const lastSpace = truncated.lastIndexOf(' ');
            if (lastSpace > 0) truncated = truncated.substring(0, lastSpace);
        }
        return truncated + suffix;
    }

    static slugify(str, options = {}) {
        if (!str || typeof str !== 'string') return '';
        const { lowercase = true, separator = '-', removeStopWords = false } = options;
        let text = str.trim();
        if (lowercase) text = text.toLowerCase();
        text = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
        text = text.replace(/[^\w\s-]/g, '');
        if (removeStopWords) {
            const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'for', 'nor', 'on', 'at', 'to', 'by', 'in', 'of', 'with'];
            text = text.split(' ').filter(w => !stopWords.includes(w)).join(' ');
        }
        text = text.replace(/[\s_-]+/g, separator);
        text = text.replace(new RegExp('^' + separator + '+|' + separator + '+$', 'g'), '');
        return text;
    }

    static capitalize(str, options = {}) {
        if (!str || typeof str !== 'string') return '';
        const { allWords = false, preserveCase = false } = options;
        if (allWords) {
            return str.split(' ').map(word => {
                if (preserveCase && word.length > 1 && word === word.toUpperCase()) return word;
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }).join(' ');
        }
        if (preserveCase && str.length > 1 && str === str.toUpperCase()) return str;
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    static toCamelCase(str) {
        if (!str || typeof str !== 'string') return '';
        return str.replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '').replace(/^[A-Z]/, char => char.toLowerCase());
    }

    static toSnakeCase(str) {
        if (!str || typeof str !== 'string') return '';
        return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/[\s-]+/g, '_');
    }

    static toKebabCase(str) {
        if (!str || typeof str !== 'string') return '';
        return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '').replace(/[\s_]+/g, '-');
    }

    static toPascalCase(str) {
        if (!str || typeof str !== 'string') return '';
        const camel = this.toCamelCase(str);
        return camel.charAt(0).toUpperCase() + camel.slice(1);
    }

    static randomString(length = 8, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
        let result = '';
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        for (let i = 0; i < length; i++) {
            result += chars.charAt(array[i] % chars.length);
        }
        return result;
    }

    static escapeHtml(str) {
        if (!str || typeof str !== 'string') return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return str.replace(/[&<>"']/g, char => map[char]);
    }

    static unescapeHtml(str) {
        if (!str || typeof str !== 'string') return '';
        const map = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'" };
        return str.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, char => map[char]);
    }

    static stripHtml(str) {
        if (!str || typeof str !== 'string') return '';
        const temp = document.createElement('div');
        temp.innerHTML = str;
        return temp.textContent || temp.innerText || '';
    }

    static pluralize(word, count, plural = null) {
        if (count === 1) return word;
        if (plural) return plural;
        const irregulars = { child: 'children', foot: 'feet', goose: 'geese', man: 'men', mouse: 'mice', tooth: 'teeth', woman: 'women' };
        if (irregulars[word]) return irregulars[word];
        if (word.endsWith('y') && !/[aeiou]y$/.test(word)) return word.slice(0, -1) + 'ies';
        if (word.endsWith('s') || word.endsWith('x') || word.endsWith('ch') || word.endsWith('sh')) return word + 'es';
        return word + 's';
    }

    // ============================================================
    // ARRAY HELPERS
    // ============================================================

    static chunk(arr, size = 1) {
        if (!Array.isArray(arr)) return [];
        const result = [];
        for (let i = 0; i < arr.length; i += size) {
            result.push(arr.slice(i, i + size));
        }
        return result;
    }

    static unique(arr, keyFn = null) {
        if (!Array.isArray(arr)) return [];
        if (!keyFn) return [...new Set(arr)];
        const seen = new Set();
        return arr.filter(item => {
            const key = keyFn(item);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    static shuffle(arr) {
        if (!Array.isArray(arr)) return [];
        const result = [...arr];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    static groupBy(arr, key) {
        if (!Array.isArray(arr)) return {};
        return arr.reduce((result, item) => {
            const groupKey = typeof key === 'function' ? key(item) : item[key];
            if (!result[groupKey]) result[groupKey] = [];
            result[groupKey].push(item);
            return result;
        }, {});
    }

    static sortBy(arr, key, order = 'asc') {
        if (!Array.isArray(arr)) return [];
        const sorted = [...arr];
        sorted.sort((a, b) => {
            const aVal = typeof key === 'function' ? key(a) : a[key];
            const bVal = typeof key === 'function' ? key(b) : b[key];
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;
            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }

    static flatten(arr, depth = Infinity) {
        if (!Array.isArray(arr)) return [];
        return arr.flat(depth);
    }

    static intersection(arr1, arr2) {
        if (!Array.isArray(arr1) || !Array.isArray(arr2)) return [];
        const set = new Set(arr2);
        return arr1.filter(item => set.has(item));
    }

    static difference(arr1, arr2) {
        if (!Array.isArray(arr1) || !Array.isArray(arr2)) return [];
        const set = new Set(arr2);
        return arr1.filter(item => !set.has(item));
    }

    static isArrayEqual(arr1, arr2) {
        if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
        if (arr1.length !== arr2.length) return false;
        return arr1.every((item, index) => item === arr2[index]);
    }

    // ============================================================
    // OBJECT HELPERS
    // ============================================================

    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof RegExp) return new RegExp(obj);
        if (obj instanceof Map) {
            const map = new Map();
            obj.forEach((value, key) => map.set(key, this.deepClone(value)));
            return map;
        }
        if (obj instanceof Set) {
            const set = new Set();
            obj.forEach(value => set.add(this.deepClone(value)));
            return set;
        }
        if (Array.isArray(obj)) return obj.map(item => this.deepClone(item));
        const cloned = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    }

    static deepMerge(...objects) {
        const result = {};
        for (const obj of objects) {
            if (!obj || typeof obj !== 'object') continue;
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const value = obj[key];
                    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) && !(value instanceof RegExp)) {
                        result[key] = this.deepMerge(result[key] || {}, value);
                    } else if (value !== undefined) {
                        result[key] = value;
                    }
                }
            }
        }
        return result;
    }

    static pick(obj, keys) {
        if (!obj || typeof obj !== 'object' || !Array.isArray(keys)) return {};
        const result = {};
        for (const key of keys) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                result[key] = obj[key];
            }
        }
        return result;
    }

    static omit(obj, keys) {
        if (!obj || typeof obj !== 'object' || !Array.isArray(keys)) return {};
        const result = { ...obj };
        for (const key of keys) {
            delete result[key];
        }
        return result;
    }

    static hasKey(obj, key) {
        if (!obj || typeof obj !== 'object') return false;
        return Object.prototype.hasOwnProperty.call(obj, key);
    }

    static isEmptyObject(obj) {
        if (!obj || typeof obj !== 'object') return true;
        return Object.keys(obj).length === 0;
    }

    static invertObject(obj) {
        if (!obj || typeof obj !== 'object') return {};
        const inverted = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const value = obj[key];
                if (value !== null && value !== undefined) {
                    inverted[value] = key;
                }
            }
        }
        return inverted;
    }

    // ============================================================
    // NUMBER HELPERS
    // ============================================================

    static formatNumber(num, locale = 'en-US', options = {}) {
        if (num === undefined || num === null || isNaN(num)) return '0';
        return new Intl.NumberFormat(locale, options).format(num);
    }

    static formatCurrency(num, currency = 'USD', locale = 'en-US') {
        if (num === undefined || num === null || isNaN(num)) return '0';
        return new Intl.NumberFormat(locale, { style: 'currency', currency: currency }).format(num);
    }

    static formatCompactNumber(num, locale = 'en-US') {
        if (num === undefined || num === null || isNaN(num)) return '0';
        return new Intl.NumberFormat(locale, { notation: 'compact', compactDisplay: 'short' }).format(num);
    }

    static clamp(num, min, max) {
        return Math.max(min, Math.min(max, num));
    }

    static randomNumber(min, max, integer = false) {
        const num = Math.random() * (max - min) + min;
        return integer ? Math.round(num) : num;
    }

    static formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    static formatDuration(seconds) {
        if (!seconds || seconds < 0) return '0s';
        const units = [
            { label: 'd', value: 86400 },
            { label: 'h', value: 3600 },
            { label: 'm', value: 60 },
            { label: 's', value: 1 }
        ];
        let remaining = seconds;
        const parts = [];
        for (const unit of units) {
            const count = Math.floor(remaining / unit.value);
            if (count > 0) {
                parts.push(count + unit.label);
                remaining -= count * unit.value;
            }
        }
        return parts.join(' ') || '0s';
    }

    static percent(value, total, decimals = 0) {
        if (total === 0) return 0;
        return parseFloat(((value / total) * 100).toFixed(decimals));
    }

    // ============================================================
    // DATE HELPERS
    // ============================================================

    static formatDate(date, format = 'MMM DD, YYYY', locale = 'en-US') {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Invalid Date';
        const options = {};
        if (format.includes('MMM')) options.month = 'short';
        else if (format.includes('MMMM')) options.month = 'long';
        else options.month = 'numeric';
        if (format.includes('DD')) options.day = '2-digit';
        else if (format.includes('D')) options.day = 'numeric';
        if (format.includes('YYYY')) options.year = 'numeric';
        else if (format.includes('YY')) options.year = '2-digit';
        if (format.includes('HH')) {
            options.hour = '2-digit';
            options.minute = '2-digit';
            if (format.includes('ss')) options.second = '2-digit';
        }
        if (format.includes('a')) options.hour12 = true;
        return d.toLocaleDateString(locale, options);
    }

    static timeAgo(date, locale = 'en-US') {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Invalid Date';
        const now = Date.now();
        const diff = now - d.getTime();
        const rtf = new Intl.RelativeTimeFormatter(locale, { numeric: 'auto' });
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);
        if (years > 0) return rtf.format(-years, 'year');
        if (months > 0) return rtf.format(-months, 'month');
        if (weeks > 0) return rtf.format(-weeks, 'week');
        if (days > 0) return rtf.format(-days, 'day');
        if (hours > 0) return rtf.format(-hours, 'hour');
        if (minutes > 0) return rtf.format(-minutes, 'minute');
        return rtf.format(-seconds, 'second');
    }

    static isToday(date) {
        const d = new Date(date);
        if (isNaN(d.getTime())) return false;
        const today = new Date();
        return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
    }

    static isYesterday(date) {
        const d = new Date(date);
        if (isNaN(d.getTime())) return false;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return d.getFullYear() === yesterday.getFullYear() && d.getMonth() === yesterday.getMonth() && d.getDate() === yesterday.getDate();
    }

    static isTomorrow(date) {
        const d = new Date(date);
        if (isNaN(d.getTime())) return false;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return d.getFullYear() === tomorrow.getFullYear() && d.getMonth() === tomorrow.getMonth() && d.getDate() === tomorrow.getDate();
    }

    static daysBetween(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
        const diff = Math.abs(d2 - d1);
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    static addDays(date, days) {
        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        d.setDate(d.getDate() + days);
        return d;
    }

    static startOfDay(date) {
        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        d.setHours(0, 0, 0, 0);
        return d;
    }

    static endOfDay(date) {
        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        d.setHours(23, 59, 59, 999);
        return d;
    }

    static isWeekend(date) {
        const d = new Date(date);
        if (isNaN(d.getTime())) return false;
        const day = d.getDay();
        return day === 0 || day === 6;
    }

    // ============================================================
    // DOM HELPERS
    // ============================================================

    static createElement(tag, attrs = {}, ...children) {
        const el = document.createElement(tag);
        for (const [key, value] of Object.entries(attrs)) {
            if (key === 'className') el.className = value;
            else if (key === 'style' && typeof value === 'object') Object.assign(el.style, value);
            else if (key === 'dataset' && typeof value === 'object') Object.assign(el.dataset, value);
            else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
            else el.setAttribute(key, value);
        }
        for (const child of children) {
            if (typeof child === 'string') el.appendChild(document.createTextNode(child));
            else if (child instanceof HTMLElement || child instanceof DocumentFragment) el.appendChild(child);
        }
        return el;
    }

    static async addClassAnimated(el, className, duration = 300) {
        if (!el || !(el instanceof HTMLElement)) return;
        return new Promise(resolve => {
            el.classList.add(className);
            if (duration > 0) {
                setTimeout(() => { el.classList.remove(className); resolve(); }, duration);
            } else resolve();
        });
    }

    static scrollTo(target, options = {}) {
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: options.block || 'start', inline: options.inline || 'nearest' });
    }

    static isInViewport(el, offset = 0) {
        if (!el || !(el instanceof HTMLElement)) return false;
        const rect = el.getBoundingClientRect();
        return rect.top - offset <= window.innerHeight && rect.bottom + offset >= 0 && rect.left - offset <= window.innerWidth && rect.right + offset >= 0;
    }

    static getPosition(el) {
        if (!el || !(el instanceof HTMLElement)) return { top: 0, left: 0 };
        let top = 0, left = 0, current = el;
        while (current) {
            top += current.offsetTop || 0;
            left += current.offsetLeft || 0;
            current = current.offsetParent;
        }
        return { top, left };
    }

    static getElementSize(el, includeMargin = false) {
        if (!el || !(el instanceof HTMLElement)) return { width: 0, height: 0 };
        const rect = el.getBoundingClientRect();
        let width = rect.width, height = rect.height;
        if (includeMargin) {
            const style = getComputedStyle(el);
            width += parseFloat(style.marginLeft) + parseFloat(style.marginRight);
            height += parseFloat(style.marginTop) + parseFloat(style.marginBottom);
        }
        return { width, height };
    }

    static getParentBySelector(el, selector) {
        if (!el || !(el instanceof HTMLElement)) return null;
        let current = el;
        while (current) {
            if (current.matches(selector)) return current;
            current = current.parentElement;
        }
        return null;
    }

    // ============================================================
    // STORAGE HELPERS
    // ============================================================

    static setStorage(key, value, expiry = null) {
        const data = { value, timestamp: Date.now() };
        if (expiry) data.expiry = expiry;
        try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
    }

    static getStorage(key, defaultValue = null) {
        try {
            const data = JSON.parse(localStorage.getItem(key));
            if (!data) return defaultValue;
            if (data.expiry && Date.now() - data.timestamp > data.expiry) {
                localStorage.removeItem(key);
                return defaultValue;
            }
            return data.value;
        } catch { return defaultValue; }
    }

    static removeStorage(key) { localStorage.removeItem(key); }

    static clearStorage() { localStorage.clear(); }

    static setSession(key, value) { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }

    static getSession(key, defaultValue = null) {
        try {
            const data = JSON.parse(sessionStorage.getItem(key));
            return data !== null ? data : defaultValue;
        } catch { return defaultValue; }
    }

    static removeSession(key) { sessionStorage.removeItem(key); }

    // ============================================================
    // URL HELPERS
    // ============================================================

    static parseUrlParams(url = window.location.search) { return new URLSearchParams(url); }

    static getUrlParam(key, url = window.location.search) {
        const params = this.parseUrlParams(url);
        return params.get(key);
    }

    static buildUrl(base, params = {}) {
        const url = new URL(base, window.location.origin);
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
        }
        return url.toString();
    }

    static getUrlPath(url = window.location.href) {
        try { return new URL(url).pathname; } catch { return ''; }
    }

    static getUrlHost(url = window.location.href) {
        try { return new URL(url).host; } catch { return ''; }
    }

    static isSameOrigin(url) {
        try { return new URL(url).origin === window.location.origin; } catch { return false; }
    }

    // ============================================================
    // FUNCTION HELPERS
    // ============================================================

    static debounce(fn, delay = 300, options = {}) {
        let timeoutId = null;
        const { leading = false, trailing = true } = options;
        return function (...args) {
            const context = this;
            const later = () => {
                timeoutId = null;
                if (trailing) fn.apply(context, args);
            };
            const callNow = leading && !timeoutId;
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(later, delay);
            if (callNow) fn.apply(context, args);
        };
    }

    static throttle(fn, limit = 300, options = {}) {
        let inThrottle = false;
        let lastResult = null;
        const { leading = true, trailing = true } = options;
        return function (...args) {
            const context = this;
            if (!inThrottle) {
                if (leading) lastResult = fn.apply(context, args);
                inThrottle = true;
                setTimeout(() => {
                    inThrottle = false;
                    if (trailing) lastResult = fn.apply(context, args);
                }, limit);
            }
            return lastResult;
        };
    }

    static memoize(fn, keyFn = null) {
        const cache = new Map();
        return function (...args) {
            const key = keyFn ? keyFn(args) : JSON.stringify(args);
            if (cache.has(key)) return cache.get(key);
            const result = fn.apply(this, args);
            cache.set(key, result);
            return result;
        };
    }

    static async retry(fn, maxRetries = 3, delay = 1000, backoff = true) {
        let lastError = null;
        for (let i = 0; i < maxRetries; i++) {
            try { return await fn(); } catch (error) {
                lastError = error;
                if (i < maxRetries - 1) {
                    const wait = backoff ? delay * Math.pow(2, i) : delay;
                    await new Promise(resolve => setTimeout(resolve, wait));
                }
            }
        }
        throw lastError;
    }

    static once(fn) {
        let called = false;
        let result = null;
        return function (...args) {
            if (!called) {
                called = true;
                result = fn.apply(this, args);
            }
            return result;
        };
    }

    // ============================================================
    // COLOR HELPERS
    // ============================================================

    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return null;
        return { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) };
    }

    static rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(c => { const hex = c.toString(16); return hex.length === 1 ? '0' + hex : hex; }).join('');
    }

    static randomColor(hex = true) {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return hex ? this.rgbToHex(r, g, b) : `rgb(${r}, ${g}, ${b})`;
    }

    static lightenColor(color, amount = 0.2) {
        const rgb = this.hexToRgb(color);
        if (!rgb) return color;
        const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount));
        const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount));
        const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount));
        return this.rgbToHex(r, g, b);
    }

    static darkenColor(color, amount = 0.2) {
        const rgb = this.hexToRgb(color);
        if (!rgb) return color;
        const r = Math.max(0, Math.round(rgb.r * (1 - amount)));
        const g = Math.max(0, Math.round(rgb.g * (1 - amount)));
        const b = Math.max(0, Math.round(rgb.b * (1 - amount)));
        return this.rgbToHex(r, g, b);
    }

    static hexToHsl(hex) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return null;
        const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) { h = s = 0; } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            else if (max === g) h = ((b - r) / d + 2) / 6;
            else h = ((r - g) / d + 4) / 6;
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    static hslToHex(h, s, l) {
        s /= 100;
        l /= 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r, g, b;
        if (h < 60) { r = c; g = x; b = 0; } else if (h < 120) { r = x; g = c; b = 0; } else if (h < 180) { r = 0; g = c; b = x; } else if (h < 240) { r = 0; g = x; b = c; } else if (h < 300) { r = x; g = 0; b = c; } else { r = c; g = 0; b = x; }
        return this.rgbToHex(Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255));
    }

    static isLightColor(color, threshold = 128) {
        const rgb = this.hexToRgb(color);
        if (!rgb) return false;
        return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000 > threshold;
    }

    // ============================================================
    // FILE HELPERS
    // ============================================================

    static getFileExtension(filename) {
        if (!filename || typeof filename !== 'string') return '';
        return filename.split('.').pop().toLowerCase();
    }

    static getFileIcon(type) {
        const map = {
            pdf: '📄', zip: '📦', rar: '📦', '7z': '📦',
            doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
            ppt: '📽️', pptx: '📽️',
            jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', svg: '🎨',
            mp3: '🎵', wav: '🎵', mp4: '🎬', avi: '🎬', mov: '🎬',
            txt: '📝', json: '📋', xml: '📋', csv: '📊',
            js: '📜', css: '🎨', html: '🌐', php: '🐘', py: '🐍'
        };
        const ext = this.getFileExtension(type);
        return map[ext] || '📁';
    }

    static getMimeType(filename) {
        const ext = this.getFileExtension(filename);
        const map = {
            pdf: 'application/pdf', zip: 'application/zip',
            doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
            mp3: 'audio/mpeg', wav: 'audio/wav', mp4: 'video/mp4', avi: 'video/x-msvideo', mov: 'video/quicktime',
            txt: 'text/plain', json: 'application/json', xml: 'application/xml', csv: 'text/csv',
            js: 'application/javascript', css: 'text/css', html: 'text/html'
        };
        return map[ext] || 'application/octet-stream';
    }

    static async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    static async fileToText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    static formatFileSize(bytes) { return this.formatBytes(bytes); }

    // ============================================================
    // DEVICE HELPERS
    // ============================================================

    static isMobile() { return window.innerWidth < 768; }

    static isTablet() { return window.innerWidth >= 768 && window.innerWidth < 1024; }

    static isDesktop() { return window.innerWidth >= 1024; }

    static isTouch() { return 'ontouchstart' in window || navigator.maxTouchPoints > 0; }

    static isDarkMode() { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; }

    static getDeviceInfo() {
        return {
            mobile: this.isMobile(),
            tablet: this.isTablet(),
            desktop: this.isDesktop(),
            touch: this.isTouch(),
            darkMode: this.isDarkMode(),
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
        };
    }

    // ============================================================
    // MISC HELPERS
    // ============================================================

    static sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    static async copyToClipboard(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        } catch { return false; }
    }

    static downloadFile(data, filename, mimeType = 'text/plain') {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    static downloadUrl(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || '';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    static timestamp(format = 'iso') {
        const now = new Date();
        switch (format) {
            case 'unix': return Math.floor(now.getTime() / 1000);
            case 'ms': return now.getTime();
            default: return now.toISOString();
        }
    }

    static isJSON(str) {
        if (!str || typeof str !== 'string') return false;
        try { JSON.parse(str); return true; } catch { return false; }
    }

    static safeJSONParse(str, defaultValue = null) {
        try { return JSON.parse(str); } catch { return defaultValue; }
    }

    static isPlainObject(value) {
        if (!value || typeof value !== 'object') return false;
        return Object.prototype.toString.call(value) === '[object Object]';
    }

    static getNestedValue(obj, path, defaultValue = null) {
        if (!obj || typeof obj !== 'object') return defaultValue;
        const keys = Array.isArray(path) ? path : path.split('.');
        let current = obj;
        for (const key of keys) {
            if (current === null || current === undefined || typeof current !== 'object') return defaultValue;
            current = current[key];
        }
        return current !== undefined ? current : defaultValue;
    }

    static setNestedValue(obj, path, value) {
        if (!obj || typeof obj !== 'object') return obj;
        const keys = Array.isArray(path) ? path : path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key] || typeof current[key] !== 'object') current[key] = {};
            current = current[key];
        }
        current[keys[keys.length - 1]] = value;
        return obj;
    }

    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    static generateShortId(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}

if (typeof window !== 'undefined') {
    window.Helpers = Helpers;
}

// Safe helpers export for app.js
export const helpers = {
    formatCurrency: (amount) => `₹${amount}`,
    formatDate: (date) => new Date(date).toLocaleDateString(),
    debounce: (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
};

export default helpers;

//export default Helpers;