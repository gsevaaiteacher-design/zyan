// ============================================================
// FILE: js/utils/validators.js
// PURPOSE: Full production input validation utility
// DEPENDENCY: NONE
// USED BY: auth-screen.js, upload-screen.js, all forms
// VERSION: 3.0.0 - ULTIMATE PRODUCTION
// ============================================================

export class Validators {
    static get DEFAULT_OPTIONS() {
        return {
            minLength: 8,
            maxLength: 64,
            requireUppercase: true,
            requireLowercase: true,
            requireNumber: true,
            requireSpecial: true,
            strictMode: true
        };
    }

    static get EMAIL_PATTERNS() {
        return {
            standard: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            strict: /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/
        };
    }

    static get PHONE_PATTERNS() {
        return {
            US: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
            IN: /^[6-9]\d{9}$/,
            UK: /^(?:(?:\(?(?:0(?:0|11)\)?[\s-]?\(?|\+)?44\)?[\s-]?)?(?:\(?0\)?[\s-]?)?\(?[1-9]\d{1,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4})$/,
            AU: /^\(?0[2-8]\d{1,2}\)?[-. ]?\d{4}[-. ]?\d{4}$/,
            CA: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
            DE: /^\(?0[1-9]\d{1,2}\)?[-. ]?\d{3,4}[-. ]?\d{4}$/,
            FR: /^\(?0[1-9]\)?[-. ]?\d{2}[-. ]?\d{2}[-. ]?\d{2}[-. ]?\d{2}$/,
            JP: /^\(?0[1-9]\d{0,3}\)?[-. ]?\d{1,4}[-. ]?\d{4}$/,
            BR: /^\(?[1-9]{2}\)?[-. ]?9?[1-9]\d{3,4}[-. ]?\d{4}$/
        };
    }

    static get COUNTRY_CODES() {
        return {
            US: '+1',
            IN: '+91',
            UK: '+44',
            AU: '+61',
            CA: '+1',
            DE: '+49',
            FR: '+33',
            JP: '+81',
            BR: '+55',
            AE: '+971',
            SA: '+966',
            EG: '+20',
            TR: '+90',
            PK: '+92',
            BD: '+880'
        };
    }

    static get CARD_TYPES() {
        return {
            VISA: { pattern: /^4[0-9]{12}(?:[0-9]{3})?$/, name: 'Visa', icon: '💳' },
            MASTERCARD: { pattern: /^5[1-5][0-9]{14}$/, name: 'Mastercard', icon: '💳' },
            AMEX: { pattern: /^3[47][0-9]{13}$/, name: 'American Express', icon: '💳' },
            DISCOVER: { pattern: /^6(?:011|5[0-9]{2})[0-9]{12}$/, name: 'Discover', icon: '💳' },
            JCB: { pattern: /^(?:2131|1800|35\d{3})\d{11}$/, name: 'JCB', icon: '💳' },
            DINERS: { pattern: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/, name: 'Diners Club', icon: '💳' },
            UNIONPAY: { pattern: /^62[0-9]{14,17}$/, name: 'UnionPay', icon: '💳' },
            MAESTRO: { pattern: /^(?:5[0678]\d{0,2}|6\d{0,2})[0-9]{10,17}$/, name: 'Maestro', icon: '💳' }
        };
    }

    static get PASSWORD_SPECIAL_CHARS() {
        return /[!@#$%^&*(),.?":{}|<>~`_\-+=\[\]\\;']/;
    }

    static get PASSWORD_COMMON_PATTERNS() {
        return [
            'password', '123456', '12345678', '123456789', 'qwerty', 
            'abc123', 'password1', 'admin', 'letmein', 'welcome',
            'monkey', 'dragon', 'master', 'hello', 'freedom',
            'whatever', 'dragon', 'trustno1', '1234567', 'sunshine',
            'princess', 'iloveyou', 'rockyou', '1234567890', 'password123'
        ];
    }

    // ============================================================
    // EMAIL VALIDATION
    // ============================================================

    static isEmail(email, options = {}) {
        const result = { valid: false, errors: [], normalized: null };
        
        if (!email || typeof email !== 'string') {
            result.errors.push('Email is required');
            return result;
        }

        const trimmed = email.trim();
        if (!trimmed) {
            result.errors.push('Email cannot be empty');
            return result;
        }

        const pattern = options.strict ? this.EMAIL_PATTERNS.strict : this.EMAIL_PATTERNS.standard;
        
        if (!pattern.test(trimmed)) {
            result.errors.push('Please enter a valid email address');
            return result;
        }

        const parts = trimmed.split('@');
        if (parts.length !== 2) {
            result.errors.push('Invalid email format');
            return result;
        }

        const [local, domain] = parts;
        if (local.length < 1 || local.length > 64) {
            result.errors.push('Email local part must be between 1 and 64 characters');
            return result;
        }

        if (domain.length < 3 || domain.length > 255) {
            result.errors.push('Email domain must be between 3 and 255 characters');
            return result;
        }

        if (options.requireTld && !domain.includes('.')) {
            result.errors.push('Email must have a valid TLD');
            return result;
        }

        const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'protonmail.com'];
        if (options.allowOnlyCommon && !commonDomains.includes(domain.toLowerCase())) {
            result.errors.push('Only common email providers are allowed');
            return result;
        }

        result.valid = true;
        result.normalized = trimmed.toLowerCase();
        return result;
    }

    // ============================================================
    // PASSWORD VALIDATION
    // ============================================================

    static isPassword(password, options = {}) {
        const result = { valid: false, errors: [], strength: 0, score: 0 };
        const opts = { ...this.DEFAULT_OPTIONS, ...options };

        if (!password || typeof password !== 'string') {
            result.errors.push('Password is required');
            return result;
        }

        const trimmed = password.trim();
        if (!trimmed) {
            result.errors.push('Password cannot be empty');
            return result;
        }

        let score = 0;
        const checks = [];

        if (trimmed.length < opts.minLength) {
            result.errors.push(`Password must be at least ${opts.minLength} characters`);
        } else {
            score += 1;
            checks.push('length');
        }

        if (trimmed.length > opts.maxLength) {
            result.errors.push(`Password must be less than ${opts.maxLength} characters`);
        }

        if (opts.requireUppercase) {
            if (!/[A-Z]/.test(trimmed)) {
                result.errors.push('Password must contain at least one uppercase letter');
            } else {
                score += 1;
                checks.push('uppercase');
            }
        }

        if (opts.requireLowercase) {
            if (!/[a-z]/.test(trimmed)) {
                result.errors.push('Password must contain at least one lowercase letter');
            } else {
                score += 1;
                checks.push('lowercase');
            }
        }

        if (opts.requireNumber) {
            if (!/\d/.test(trimmed)) {
                result.errors.push('Password must contain at least one number');
            } else {
                score += 1;
                checks.push('number');
            }
        }

        if (opts.requireSpecial) {
            if (!this.PASSWORD_SPECIAL_CHARS.test(trimmed)) {
                result.errors.push('Password must contain at least one special character');
            } else {
                score += 1;
                checks.push('special');
            }
        }

        const commonCheck = trimmed.toLowerCase();
        if (this.PASSWORD_COMMON_PATTERNS.some(p => commonCheck.includes(p))) {
            result.errors.push('Password contains common or weak pattern');
            if (opts.strictMode) {
                score = Math.max(0, score - 1);
            }
        }

        if (/(.)\1{2,}/.test(trimmed)) {
            result.errors.push('Password contains repeated characters');
            if (opts.strictMode) {
                score = Math.max(0, score - 1);
            }
        }

        if (/^[0-9]+$/.test(trimmed)) {
            result.errors.push('Password cannot be only numbers');
            if (opts.strictMode) {
                score = Math.max(0, score - 1);
            }
        }

        const strengthMap = {
            0: 'Very Weak',
            1: 'Weak',
            2: 'Fair',
            3: 'Good',
            4: 'Strong',
            5: 'Very Strong'
        };

        const maxScore = 5;
        result.strength = strengthMap[Math.min(score, maxScore)] || 'Weak';
        result.score = Math.min(score, maxScore);
        result.valid = result.errors.length === 0;

        return result;
    }

    // ============================================================
    // PHONE VALIDATION
    // ============================================================

    static isPhone(phone, country = 'US', options = {}) {
        const result = { valid: false, errors: [], normalized: null, countryCode: null };

        if (!phone || typeof phone !== 'string') {
            result.errors.push('Phone number is required');
            return result;
        }

        const trimmed = phone.trim();
        if (!trimmed) {
            result.errors.push('Phone number cannot be empty');
            return result;
        }

        const patterns = this.PHONE_PATTERNS;
        const pattern = patterns[country] || patterns.US;

        let cleaned = trimmed.replace(/[\s\-()]/g, '');
        if (cleaned.startsWith('+')) {
            const code = cleaned.substring(0, 3);
            const number = cleaned.substring(3);
            result.countryCode = code;
            cleaned = number;
        }

        if (!pattern.test(cleaned) && !pattern.test(trimmed)) {
            result.errors.push(`Invalid phone number format for ${country}`);
            return result;
        }

        const cleanForLength = cleaned.replace(/[^0-9]/g, '');
        if (cleanForLength.length < 7) {
            result.errors.push('Phone number is too short');
            return result;
        }

        if (cleanForLength.length > 15) {
            result.errors.push('Phone number is too long');
            return result;
        }

        result.valid = true;
        result.normalized = cleaned;
        return result;
    }

    // ============================================================
    // URL VALIDATION
    // ============================================================

    static isURL(url, options = {}) {
        const result = { valid: false, errors: [], normalized: null, parsed: null };

        if (!url || typeof url !== 'string') {
            result.errors.push('URL is required');
            return result;
        }

        const trimmed = url.trim();
        if (!trimmed) {
            result.errors.push('URL cannot be empty');
            return result;
        }

        const protocols = options.protocols || ['http', 'https'];
        let parsed;

        try {
            const urlObj = new URL(trimmed);
            parsed = urlObj;

            if (!protocols.includes(urlObj.protocol.replace(':', ''))) {
                result.errors.push(`Protocol must be one of: ${protocols.join(', ')}`);
                return result;
            }

            if (options.requireHostname && !urlObj.hostname) {
                result.errors.push('URL must have a hostname');
                return result;
            }

            if (options.requireTLD && !urlObj.hostname.includes('.')) {
                result.errors.push('URL must have a valid TLD');
                return result;
            }

            if (options.allowLocalhost === false) {
                const hostname = urlObj.hostname.toLowerCase();
                if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
                    result.errors.push('Localhost URLs are not allowed');
                    return result;
                }
            }

            if (options.forbidIP === true) {
                const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
                if (ipRegex.test(urlObj.hostname)) {
                    result.errors.push('IP addresses are not allowed');
                    return result;
                }
            }

            result.valid = true;
            result.normalized = urlObj.toString();
            result.parsed = urlObj;

        } catch (e) {
            result.errors.push('Invalid URL format');
        }

        return result;
    }

    // ============================================================
    // CREDIT CARD VALIDATION
    // ============================================================

    static isCreditCard(cardNumber, options = {}) {
        const result = { valid: false, errors: [], type: null, typeName: null, icon: null, lastFour: null };

        if (!cardNumber) {
            result.errors.push('Card number is required');
            return result;
        }

        const trimmed = cardNumber.toString().replace(/[\s\-]/g, '');
        if (!trimmed) {
            result.errors.push('Card number cannot be empty');
            return result;
        }

        if (!/^\d+$/.test(trimmed)) {
            result.errors.push('Card number must contain only digits');
            return result;
        }

        // Luhn algorithm
        let sum = 0;
        let alternate = false;
        for (let i = trimmed.length - 1; i >= 0; i--) {
            let n = parseInt(trimmed[i]);
            if (alternate) {
                n *= 2;
                if (n > 9) n -= 9;
            }
            sum += n;
            alternate = !alternate;
        }

        if (sum % 10 !== 0) {
            result.errors.push('Invalid credit card number (failed checksum)');
            return result;
        }

        // Detect card type
        let detectedType = null;
        for (const [key, card] of Object.entries(this.CARD_TYPES)) {
            if (card.pattern.test(trimmed)) {
                detectedType = key;
                break;
            }
        }

        if (!detectedType) {
            if (options.requireKnownType) {
                result.errors.push('Unknown or unsupported card type');
                return result;
            }
        }

        const cardInfo = detectedType ? this.CARD_TYPES[detectedType] : null;

        result.valid = true;
        result.type = detectedType;
        result.typeName = cardInfo?.name || 'Unknown';
        result.icon = cardInfo?.icon || '💳';
        result.lastFour = trimmed.slice(-4);

        return result;
    }

    // ============================================================
    // NAME VALIDATION
    // ============================================================

    static isName(name, options = {}) {
        const result = { valid: false, errors: [], normalized: null };

        if (!name || typeof name !== 'string') {
            result.errors.push('Name is required');
            return result;
        }

        const trimmed = name.trim();
        if (!trimmed) {
            result.errors.push('Name cannot be empty');
            return result;
        }

        const minLength = options.minLength || 2;
        const maxLength = options.maxLength || 50;

        if (trimmed.length < minLength) {
            result.errors.push(`Name must be at least ${minLength} characters`);
            return result;
        }

        if (trimmed.length > maxLength) {
            result.errors.push(`Name must be less than ${maxLength} characters`);
            return result;
        }

        const allowUnicode = options.allowUnicode || false;
        const pattern = allowUnicode ? /^[\p{L}\s\-']+$/u : /^[a-zA-Z\s\-']+$/;

        if (!pattern.test(trimmed)) {
            result.errors.push('Name contains invalid characters');
            return result;
        }

        result.valid = true;
        result.normalized = trimmed.replace(/\s+/g, ' ').trim();
        return result;
    }

    // ============================================================
    // USERNAME VALIDATION
    // ============================================================

    static isUsername(username, options = {}) {
        const result = { valid: false, errors: [], normalized: null };

        if (!username || typeof username !== 'string') {
            result.errors.push('Username is required');
            return result;
        }

        const trimmed = username.trim();
        if (!trimmed) {
            result.errors.push('Username cannot be empty');
            return result;
        }

        const minLength = options.minLength || 3;
        const maxLength = options.maxLength || 30;

        if (trimmed.length < minLength) {
            result.errors.push(`Username must be at least ${minLength} characters`);
            return result;
        }

        if (trimmed.length > maxLength) {
            result.errors.push(`Username must be less than ${maxLength} characters`);
            return result;
        }

        const allowUnderscore = options.allowUnderscore !== false;
        const allowDot = options.allowDot !== false;
        const allowDash = options.allowDash !== false;

        let pattern = '^[a-zA-Z0-9';
        if (allowUnderscore) pattern += '_';
        if (allowDot) pattern += '\\.';
        if (allowDash) pattern += '-';
        pattern += ']+$';

        if (!new RegExp(pattern).test(trimmed)) {
            result.errors.push('Username contains invalid characters');
            return result;
        }

        if (/^[0-9]/.test(trimmed)) {
            result.errors.push('Username cannot start with a number');
            return result;
        }

        if (/^[._-]/.test(trimmed) || /[._-]$/.test(trimmed)) {
            result.errors.push('Username cannot start or end with special characters');
            return result;
        }

        if (/([._-])\1{1,}/.test(trimmed)) {
            result.errors.push('Username cannot have consecutive special characters');
            return result;
        }

        const reservedNames = ['admin', 'root', 'user', 'system', 'support', 'moderator', 'zy more'];
        if (reservedNames.includes(trimmed.toLowerCase())) {
            result.errors.push('Username is reserved or not allowed');
            return result;
        }

        result.valid = true;
        result.normalized = trimmed;
        return result;
    }

    // ============================================================
    // DATE VALIDATION
    // ============================================================

    static isDate(date, options = {}) {
        const result = { valid: false, errors: [], date: null, formatted: null };

        if (!date) {
            result.errors.push('Date is required');
            return result;
        }

        let parsedDate = null;
        const format = options.format || 'YYYY-MM-DD';

        try {
            if (date instanceof Date) {
                parsedDate = date;
            } else if (typeof date === 'string') {
                const cleanDate = date.trim();
                if (format === 'YYYY-MM-DD') {
                    const parts = cleanDate.split('-');
                    if (parts.length === 3) {
                        parsedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    }
                } else if (format === 'MM/DD/YYYY') {
                    const parts = cleanDate.split('/');
                    if (parts.length === 3) {
                        parsedDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
                    }
                } else if (format === 'DD/MM/YYYY') {
                    const parts = cleanDate.split('/');
                    if (parts.length === 3) {
                        parsedDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                    }
                } else {
                    parsedDate = new Date(cleanDate);
                }
            } else if (typeof date === 'number') {
                parsedDate = new Date(date);
            }
        } catch (e) {
            result.errors.push('Invalid date format');
            return result;
        }

        if (!parsedDate || isNaN(parsedDate.getTime())) {
            result.errors.push('Invalid date');
            return result;
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const inputDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());

        if (options.future && inputDate <= today) {
            result.errors.push('Date must be in the future');
            return result;
        }

        if (options.past && inputDate >= today) {
            result.errors.push('Date must be in the past');
            return result;
        }

        if (options.minDate) {
            const min = new Date(options.minDate);
            if (parsedDate < min) {
                result.errors.push(`Date must be after ${min.toLocaleDateString()}`);
                return result;
            }
        }

        if (options.maxDate) {
            const max = new Date(options.maxDate);
            if (parsedDate > max) {
                result.errors.push(`Date must be before ${max.toLocaleDateString()}`);
                return result;
            }
        }

        result.valid = true;
        result.date = parsedDate;
        result.formatted = parsedDate.toISOString().split('T')[0];
        return result;
    }

    // ============================================================
    // NUMBER VALIDATION
    // ============================================================

    static isNumber(value, options = {}) {
        const result = { valid: false, errors: [], parsed: null, original: value };

        if (value === undefined || value === null || value === '') {
            result.errors.push('Value is required');
            return result;
        }

        const parsed = parseFloat(value);
        if (isNaN(parsed)) {
            result.errors.push('Must be a valid number');
            return result;
        }

        if (options.integer && !Number.isInteger(parsed)) {
            result.errors.push('Must be an integer');
            return result;
        }

        if (options.positive && parsed < 0) {
            result.errors.push('Must be a positive number');
            return result;
        }

        if (options.negative && parsed > 0) {
            result.errors.push('Must be a negative number');
            return result;
        }

        if (options.min !== undefined && parsed < options.min) {
            result.errors.push(`Must be at least ${options.min}`);
            return result;
        }

        if (options.max !== undefined && parsed > options.max) {
            result.errors.push(`Must be at most ${options.max}`);
            return result;
        }

        if (options.decimals !== undefined) {
            const decimalPlaces = (parsed.toString().split('.')[1] || '').length;
            if (decimalPlaces > options.decimals) {
                result.errors.push(`Must have at most ${options.decimals} decimal places`);
                return result;
            }
        }

        result.valid = true;
        result.parsed = parsed;
        return result;
    }

    // ============================================================
    // ZIP CODE VALIDATION
    // ============================================================

    static isZipCode(zip, country = 'US') {
        const result = { valid: false, errors: [], normalized: null };

        if (!zip || typeof zip !== 'string') {
            result.errors.push('ZIP code is required');
            return result;
        }

        const trimmed = zip.trim();
        if (!trimmed) {
            result.errors.push('ZIP code cannot be empty');
            return result;
        }

        const patterns = {
            US: /^[0-9]{5}(-[0-9]{4})?$/,
            UK: /^[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][A-Z]{2}$/i,
            CA: /^[A-Z][0-9][A-Z] [0-9][A-Z][0-9]$/i,
            AU: /^[0-9]{4}$/,
            IN: /^[0-9]{6}$/,
            DE: /^[0-9]{5}$/,
            FR: /^[0-9]{5}$/,
            JP: /^[0-9]{3}-[0-9]{4}$/,
            BR: /^[0-9]{5}-[0-9]{3}$/,
            IT: /^[0-9]{5}$/,
            ES: /^[0-9]{5}$/,
            NL: /^[0-9]{4}[A-Z]{2}$/i,
            SE: /^[0-9]{3}\s?[0-9]{2}$/,
            CH: /^[0-9]{4}$/,
            NZ: /^[0-9]{4}$/
        };

        const pattern = patterns[country] || patterns.US;
        if (!pattern.test(trimmed)) {
            result.errors.push(`Invalid ZIP code format for ${country}`);
            return result;
        }

        result.valid = true;
        result.normalized = trimmed.toUpperCase();
        return result;
    }

    // ============================================================
    // FILE VALIDATION
    // ============================================================

    static isFile(file, options = {}) {
        const result = { valid: false, errors: [], type: null, size: 0, name: null };

        if (!file) {
            result.errors.push('File is required');
            return result;
        }

        if (!(file instanceof File) && !(file instanceof Blob)) {
            result.errors.push('Invalid file object');
            return result;
        }

        const allowedTypes = options.allowedTypes || [];
        const maxSize = options.maxSize || null;
        const minSize = options.minSize || 0;

        if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
            result.errors.push(`File type not allowed. Allowed: ${allowedTypes.join(', ')}`);
            return result;
        }

        if (minSize > 0 && file.size < minSize) {
            const minKB = (minSize / 1024).toFixed(1);
            result.errors.push(`File size must be at least ${minKB}KB`);
            return result;
        }

        if (maxSize !== null && file.size > maxSize) {
            const maxMB = (maxSize / 1024 / 1024).toFixed(1);
            result.errors.push(`File size exceeds ${maxMB}MB limit`);
            return result;
        }

        result.valid = true;
        result.type = file.type;
        result.size = file.size;
        result.name = file.name || 'file';
        return result;
    }

    // ============================================================
    // IMAGE VALIDATION
    // ============================================================

    static async isImage(file, options = {}) {
        const result = { valid: false, errors: [], width: 0, height: 0, aspectRatio: 0, type: null };

        const fileResult = this.isFile(file, {
            allowedTypes: options.allowedTypes || ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
            maxSize: options.maxSize || null,
            minSize: options.minSize || 0
        });

        if (!fileResult.valid) {
            result.errors = fileResult.errors;
            return result;
        }

        try {
            const dimensions = await new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    resolve({ width: img.width, height: img.height });
                };
                img.onerror = () => {
                    reject(new Error('Failed to load image'));
                };
                const url = URL.createObjectURL(file);
                img.src = url;
                img.onload = () => {
                    resolve({ width: img.width, height: img.height });
                    URL.revokeObjectURL(url);
                };
                img.onerror = () => {
                    URL.revokeObjectURL(url);
                    reject(new Error('Failed to load image'));
                };
            });

            result.width = dimensions.width;
            result.height = dimensions.height;
            result.aspectRatio = dimensions.width / dimensions.height;
            result.type = file.type;

            if (options.minWidth && dimensions.width < options.minWidth) {
                result.errors.push(`Image width must be at least ${options.minWidth}px`);
                return result;
            }

            if (options.maxWidth && dimensions.width > options.maxWidth) {
                result.errors.push(`Image width must be at most ${options.maxWidth}px`);
                return result;
            }

            if (options.minHeight && dimensions.height < options.minHeight) {
                result.errors.push(`Image height must be at least ${options.minHeight}px`);
                return result;
            }

            if (options.maxHeight && dimensions.height > options.maxHeight) {
                result.errors.push(`Image height must be at most ${options.maxHeight}px`);
                return result;
            }

            if (options.requireSquare && dimensions.width !== dimensions.height) {
                result.errors.push('Image must be square');
                return result;
            }

            result.valid = true;

        } catch (e) {
            result.errors.push('Invalid image file');
        }

        return result;
    }

    // ============================================================
    // UUID VALIDATION
    // ============================================================

    static isUUID(uuid, version = null) {
        const result = { valid: false, errors: [], normalized: null, version: null };

        if (!uuid || typeof uuid !== 'string') {
            result.errors.push('UUID is required');
            return result;
        }

        const trimmed = uuid.trim();
        if (!trimmed) {
            result.errors.push('UUID cannot be empty');
            return result;
        }

        const patterns = {
            1: /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
            3: /^[0-9a-f]{8}-[0-9a-f]{4}-3[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
            4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
            5: /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
            7: /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
            any: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        };

        const pattern = version ? patterns[version] : patterns.any;
        if (!pattern || !pattern.test(trimmed)) {
            result.errors.push('Invalid UUID format');
            return result;
        }

        // Detect version
        const versionMatch = trimmed.match(/^[0-9a-f]{8}-[0-9a-f]{4}-([0-9a-f])/i);
        if (versionMatch) {
            const detectedVersion = parseInt(versionMatch[1], 16);
            if (detectedVersion >= 1 && detectedVersion <= 5) {
                result.version = detectedVersion;
            } else if (detectedVersion === 7) {
                result.version = 7;
            }
        }

        result.valid = true;
        result.normalized = trimmed.toLowerCase();
        return result;
    }

    // ============================================================
    // GOOGLE DRIVE LINK VALIDATION
    // ============================================================

    static isGoogleDriveLink(url) {
        const result = { valid: false, errors: [], fileId: null, type: null };

        if (!url || typeof url !== 'string') {
            result.errors.push('URL is required');
            return result;
        }

        const trimmed = url.trim();
        if (!trimmed) {
            result.errors.push('URL cannot be empty');
            return result;
        }

        const patterns = [
            { pattern: /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/, type: 'file' },
            { pattern: /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/, type: 'open' },
            { pattern: /drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/, type: 'uc' },
            { pattern: /drive\.google\.com\/folders\/([a-zA-Z0-9_-]+)/, type: 'folder' }
        ];

        let matched = false;
        for (const p of patterns) {
            const match = trimmed.match(p.pattern);
            if (match) {
                result.fileId = match[1];
                result.type = p.type;
                matched = true;
                break;
            }
        }

        if (!matched) {
            result.errors.push('Invalid Google Drive link');
            return result;
        }

        if (result.fileId && result.fileId.length < 10) {
            result.errors.push('Invalid Google Drive file ID');
            return result;
        }

        result.valid = true;
        return result;
    }

    // ============================================================
    // JSON VALIDATION
    // ============================================================

    static isJSON(json, options = {}) {
        const result = { valid: false, errors: [], parsed: null };

        if (!json || typeof json !== 'string') {
            result.errors.push('JSON string is required');
            return result;
        }

        const trimmed = json.trim();
        if (!trimmed) {
            result.errors.push('JSON cannot be empty');
            return result;
        }

        try {
            const parsed = JSON.parse(trimmed);
            result.parsed = parsed;

            if (options.requireObject && (typeof parsed !== 'object' || Array.isArray(parsed))) {
                result.errors.push('JSON must be an object');
                return result;
            }

            if (options.requireArray && !Array.isArray(parsed)) {
                result.errors.push('JSON must be an array');
                return result;
            }

            if (options.requireNonNull && parsed === null) {
                result.errors.push('JSON cannot be null');
                return result;
            }

            result.valid = true;

        } catch (e) {
            result.errors.push('Invalid JSON format');
        }

        return result;
    }

    // ============================================================
    // HTML VALIDATION
    // ============================================================

    static isHTML(html, options = {}) {
        const result = { valid: false, errors: [], sanitized: null };

        if (!html || typeof html !== 'string') {
            result.errors.push('HTML content is required');
            return result;
        }

        const trimmed = html.trim();
        if (!trimmed) {
            result.errors.push('HTML cannot be empty');
            return result;
        }

        try {
            const doc = new DOMParser().parseFromString(trimmed, 'text/html');
            if (doc.querySelector('parsererror')) {
                result.errors.push('Invalid HTML structure');
                return result;
            }

            if (options.allowOnlyTags) {
                const allowedTags = options.allowOnlyTags || ['p', 'br', 'strong', 'em', 'u', 'span', 'div'];
                const allTags = doc.querySelectorAll('*');
                let invalid = false;
                allTags.forEach(tag => {
                    if (!allowedTags.includes(tag.tagName.toLowerCase())) {
                        invalid = true;
                    }
                });
                if (invalid) {
                    result.errors.push('HTML contains disallowed tags');
                    return result;
                }
            }

            if (options.sanitize) {
                const serializer = new XMLSerializer();
                let sanitized = trimmed;
                // Basic sanitization - remove script and iframe
                sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
                sanitized = sanitized.replace(/on\w+="[^"]*"/g, '');
                sanitized = sanitized.replace(/on\w+='[^']*'/g, '');
                result.sanitized = sanitized;
            }

            result.valid = true;

        } catch (e) {
            result.errors.push('Invalid HTML');
        }

        return result;
    }

    // ============================================================
    // DOMAIN VALIDATION
    // ============================================================

    static isDomain(domain, options = {}) {
        const result = { valid: false, errors: [], normalized: null };

        if (!domain || typeof domain !== 'string') {
            result.errors.push('Domain is required');
            return result;
        }

        const trimmed = domain.trim().toLowerCase();
        if (!trimmed) {
            result.errors.push('Domain cannot be empty');
            return result;
        }

        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            result.errors.push('Domain should not include protocol');
            return result;
        }

        const pattern = /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,}$/;
        if (!pattern.test(trimmed)) {
            result.errors.push('Invalid domain format');
            return result;
        }

        if (options.requireTLD) {
            const tlds = options.tlds || ['com', 'org', 'net', 'edu', 'gov', 'io', 'co', 'in', 'uk', 'de', 'fr', 'jp', 'au', 'ca', 'br'];
            const parts = trimmed.split('.');
            const tld = parts[parts.length - 1];
            if (!tlds.includes(tld)) {
                result.errors.push(`Domain TLD must be one of: ${tlds.join(', ')}`);
                return result;
            }
        }

        if (options.forbidSubdomains && trimmed.split('.').length > 2) {
            result.errors.push('Subdomains are not allowed');
            return result;
        }

        result.valid = true;
        result.normalized = trimmed;
        return result;
    }

    // ============================================================
    // SLUG VALIDATION
    // ============================================================

    static isSlug(slug, options = {}) {
        const result = { valid: false, errors: [], normalized: null };

        if (!slug || typeof slug !== 'string') {
            result.errors.push('Slug is required');
            return result;
        }

        const trimmed = slug.trim().toLowerCase();
        if (!trimmed) {
            result.errors.push('Slug cannot be empty');
            return result;
        }

        const minLength = options.minLength || 1;
        const maxLength = options.maxLength || 100;

        if (trimmed.length < minLength) {
            result.errors.push(`Slug must be at least ${minLength} characters`);
            return result;
        }

        if (trimmed.length > maxLength) {
            result.errors.push(`Slug must be less than ${maxLength} characters`);
            return result;
        }

        const pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (!pattern.test(trimmed)) {
            result.errors.push('Slug can only contain lowercase letters, numbers, and hyphens');
            return result;
        }

        if (trimmed.startsWith('-') || trimmed.endsWith('-')) {
            result.errors.push('Slug cannot start or end with a hyphen');
            return result;
        }

        if (options.forbidNumbers && /\d/.test(trimmed)) {
            result.errors.push('Slug cannot contain numbers');
            return result;
        }

        result.valid = true;
        result.normalized = trimmed;
        return result;
    }

    // ============================================================
    // IP ADDRESS VALIDATION
    // ============================================================

    static isIP(ip, version = null) {
        const result = { valid: false, errors: [], normalized: null, version: null };

        if (!ip || typeof ip !== 'string') {
            result.errors.push('IP address is required');
            return result;
        }

        const trimmed = ip.trim();
        if (!trimmed) {
            result.errors.push('IP address cannot be empty');
            return result;
        }

        const ipv4Pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Pattern = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

        if (version === 4 || !version) {
            if (ipv4Pattern.test(trimmed)) {
                const parts = trimmed.split('.');
                if (parts.every(p => parseInt(p) <= 255)) {
                    result.valid = true;
                    result.version = 4;
                    result.normalized = trimmed;
                    return result;
                }
            }
        }

        if (version === 6 || !version) {
            if (ipv6Pattern.test(trimmed)) {
                result.valid = true;
                result.version = 6;
                result.normalized = trimmed;
                return result;
            }
        }

        result.errors.push('Invalid IP address');
        return result;
    }

    // ============================================================
    // ISBN VALIDATION
    // ============================================================

    static isISBN(isbn) {
        const result = { valid: false, errors: [], normalized: null, type: null };

        if (!isbn || typeof isbn !== 'string') {
            result.errors.push('ISBN is required');
            return result;
        }

        const cleaned = isbn.replace(/[-\s]/g, '');
        if (!cleaned) {
            result.errors.push('ISBN cannot be empty');
            return result;
        }

        // ISBN-10 validation
        if (cleaned.length === 10) {
            if (!/^\d{9}[\dX]$/.test(cleaned)) {
                result.errors.push('Invalid ISBN-10 format');
                return result;
            }

            let sum = 0;
            for (let i = 0; i < 10; i++) {
                const digit = cleaned[i] === 'X' ? 10 : parseInt(cleaned[i]);
                sum += digit * (10 - i);
            }

            if (sum % 11 === 0) {
                result.valid = true;
                result.type = 'ISBN-10';
                result.normalized = cleaned;
                return result;
            }

            result.errors.push('Invalid ISBN-10 checksum');
            return result;
        }

        // ISBN-13 validation
        if (cleaned.length === 13) {
            if (!/^\d{13}$/.test(cleaned)) {
                result.errors.push('Invalid ISBN-13 format');
                return result;
            }

            if (!cleaned.startsWith('978') && !cleaned.startsWith('979')) {
                result.errors.push('ISBN-13 must start with 978 or 979');
                return result;
            }

            let sum = 0;
            for (let i = 0; i < 13; i++) {
                const digit = parseInt(cleaned[i]);
                sum += digit * (i % 2 === 0 ? 1 : 3);
            }

            if (sum % 10 === 0) {
                result.valid = true;
                result.type = 'ISBN-13';
                result.normalized = cleaned;
                return result;
            }

            result.errors.push('Invalid ISBN-13 checksum');
            return result;
        }

        result.errors.push('ISBN must be 10 or 13 digits');
        return result;
    }

    // ============================================================
    // CURRENCY VALIDATION
    // ============================================================

    static isCurrency(amount, options = {}) {
        const result = { valid: false, errors: [], parsed: null, formatted: null };

        if (amount === undefined || amount === null || amount === '') {
            result.errors.push('Amount is required');
            return result;
        }

        const currencySymbols = ['$', '€', '£', '¥', '₹', '₽', '₩', '₺', '₦', '₨', '₪', '₫', '₭', '₮', '₩', '₴', '₸', '₻', '₼', '₽', '₿'];
        let cleanAmount = amount.toString().trim();

        // Remove currency symbols
        for (const symbol of currencySymbols) {
            cleanAmount = cleanAmount.replace(symbol, '');
        }

        // Remove thousands separators (commas)
        cleanAmount = cleanAmount.replace(/,/g, '');

        const parsed = parseFloat(cleanAmount);
        if (isNaN(parsed)) {
            result.errors.push('Invalid currency amount');
            return result;
        }

        const minAmount = options.min !== undefined ? options.min : 0;
        const maxAmount = options.max !== undefined ? options.max : Infinity;
        const decimals = options.decimals !== undefined ? options.decimals : 2;

        const numStr = parsed.toFixed(10);
        const decimalPlaces = (numStr.split('.')[1] || '').replace(/0+$/, '').length;

        if (decimalPlaces > decimals) {
            result.errors.push(`Amount must have at most ${decimals} decimal places`);
            return result;
        }

        if (parsed < minAmount) {
            result.errors.push(`Amount must be at least ${minAmount}`);
            return result;
        }

        if (parsed > maxAmount) {
            result.errors.push(`Amount must be at most ${maxAmount}`);
            return result;
        }

        result.valid = true;
        result.parsed = parsed;
        result.formatted = parsed.toFixed(decimals);
        return result;
    }

    // ============================================================
    // ALPHANUMERIC VALIDATION
    // ============================================================

    static isAlphanumeric(value, options = {}) {
        const result = { valid: false, errors: [], normalized: null };

        if (!value || typeof value !== 'string') {
            result.errors.push('Value is required');
            return result;
        }

        const trimmed = value.trim();
        if (!trimmed) {
            result.errors.push('Value cannot be empty');
            return result;
        }

        const allowSpaces = options.allowSpaces || false;
        const allowUnderscore = options.allowUnderscore || false;
        const allowDash = options.allowDash || false;

        let pattern = '^[a-zA-Z0-9';
        if (allowSpaces) pattern += ' ';
        if (allowUnderscore) pattern += '_';
        if (allowDash) pattern += '-';
        pattern += ']+$';

        if (!new RegExp(pattern).test(trimmed)) {
            result.errors.push('Value contains invalid characters');
            return result;
        }

        const minLength = options.minLength || 1;
        const maxLength = options.maxLength || 255;

        if (trimmed.length < minLength) {
            result.errors.push(`Value must be at least ${minLength} characters`);
            return result;
        }

        if (trimmed.length > maxLength) {
            result.errors.push(`Value must be less than ${maxLength} characters`);
            return result;
        }

        result.valid = true;
        result.normalized = trimmed;
        return result;
    }

    // ============================================================
    // UTILITY METHODS
    // ============================================================

    static isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim() === '';
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }

    static isIn(value, allowedValues) {
        if (!Array.isArray(allowedValues)) return false;
        return allowedValues.includes(value);
    }

    static isBetween(value, min, max) {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num)) return false;
        return num >= min && num <= max;
    }

    static isLength(value, min = 0, max = Infinity) {
        const str = value?.toString() || '';
        const length = str.length;
        return length >= min && length <= max;
    }

    static isHexColor(color) {
        if (!color || typeof color !== 'string') return false;
        return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(color.trim());
    }

    static isRGBColor(color) {
        if (!color || typeof color !== 'string') return false;
        return /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/.test(color.trim());
    }

    static isHSLColor(color) {
        if (!color || typeof color !== 'string') return false;
        return /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/.test(color.trim());
    }

    static isBitcoinAddress(address) {
        if (!address || typeof address !== 'string') return false;
        return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address.trim());
    }

    static isEthereumAddress(address) {
        if (!address || typeof address !== 'string') return false;
        return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
    }

    static isMongoId(id) {
        if (!id || typeof id !== 'string') return false;
        return /^[a-fA-F0-9]{24}$/.test(id.trim());
    }

    static isLatitude(lat) {
        const num = parseFloat(lat);
        return !isNaN(num) && num >= -90 && num <= 90;
    }

    static isLongitude(lng) {
        const num = parseFloat(lng);
        return !isNaN(num) && num >= -180 && num <= 180;
    }

    static isCoordinates(lat, lng) {
        return this.isLatitude(lat) && this.isLongitude(lng);
    }
}

if (typeof window !== 'undefined') {
    window.Validators = Validators;
}

export default Validators;