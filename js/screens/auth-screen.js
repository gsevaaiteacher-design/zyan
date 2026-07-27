// ============================================================
// FILE: js/screens/auth-screen.js
// PURPOSE: Authentication Screen - Login, Signup, Password Reset
// DEPENDENCIES: auth-service.js, store.js, router.js, event-bus.js
// ROUTE: /auth, /login, /signup, /forgot-password, /reset-password/:token
// VERSION: 4.0.0 - FULL PRODUCTION
// ============================================================

import { store, getState, setState, subscribe } from '../store.js';
import { eventBus, EVENTS } from '../state/event-bus.js';
import { router, ROUTES } from '../router.js';
import { logger } from '../services/logger.js';
import { authService } from '../services/auth-service.js';
import { analyticsService } from '../services/analytics-service.js';
import { validators } from '../utils/validators.js';
import { LoadingSpinner } from '../widgets/loading-spinner.js';
import { ToastNotification } from '../widgets/toast-notification.js';
import { Modal } from '../widgets/modal.js';

// ============================================================
// AUTH SCREEN CLASS
// ============================================================

export class AuthScreen {
    constructor(options = {}) {
        // ==========================================
        // CONFIGURATION
        // ==========================================
        this.config = {
            enableSocialLogin: true,
            enablePasswordReset: true,
            enableRememberMe: true,
            enableTermsCheck: true,
            enableGoogleLogin: true,
            enableGuestLogin: true,
            autoRedirect: true,
            redirectAfterLogin: '/home',
            redirectAfterSignup: '/home',
            ...options
        };

        // ==========================================
        // STATE
        // ==========================================
        this._id = this._generateId('auth');
        this._isDestroyed = false;
        this._isRendered = false;
        this._container = null;
        this._subscribers = [];
        this._eventListeners = [];
        this._isLoading = false;
        this._currentMode = 'login'; // 'login' | 'signup' | 'forgot' | 'reset'

        // Form state
        this._formData = {
            email: '',
            password: '',
            confirmPassword: '',
            displayName: '',
            rememberMe: false,
            acceptTerms: false,
            resetEmail: ''
        };

        // ==========================================
        // BIND METHODS
        // ==========================================
        this._handleLogin = this._handleLogin.bind(this);
        this._handleSignup = this._handleSignup.bind(this);
        this._handleForgotPassword = this._handleForgotPassword.bind(this);
        this._handleResetPassword = this._handleResetPassword.bind(this);
        this._handleGoogleLogin = this._handleGoogleLogin.bind(this);
        this._handleGuestLogin = this._handleGuestLogin.bind(this);
        this._handleSocialLogin = this._handleSocialLogin.bind(this);
        this._handleInputChange = this._handleInputChange.bind(this);
        this._handleFormSubmit = this._handleFormSubmit.bind(this);
        this._handleToggleMode = this._handleToggleMode.bind(this);
        this._handleKeydown = this._handleKeydown.bind(this);
        this._handleAuthChange = this._handleAuthChange.bind(this);
        this._handleThemeChange = this._handleThemeChange.bind(this);

        // ==========================================
        // SETUP
        // ==========================================
        this._setupSubscriptions();
        this._setupEventListeners();
        
        logger.info('🔐 AuthScreen initialized', { id: this._id });
    }

    // ============================================================
    // RENDER
    // ============================================================

    render() {
        if (this._isDestroyed) {
            logger.warn('⚠️ AuthScreen destroyed, cannot render');
            return null;
        }

        if (this._isRendered) {
            return this._container;
        }

        logger.info('🔐 Rendering AuthScreen...');

        // Create container
        this._container = this._createContainer();

        // Build auth card
        this._buildAuthCard();

        // Apply theme
        this._applyTheme();

        // Check for reset token
        this._checkResetToken();

        // Track view
        analyticsService.trackPageView('auth');

        this._isRendered = true;
        logger.info('✅ AuthScreen rendered');

        return this._container;
    }

    // ============================================================
    // CONTAINER
    // ============================================================

    _createContainer() {
        const container = document.createElement('div');
        container.className = 'auth-screen';
        container.id = `auth-screen-${this._id}`;
        container.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
            margin: 0 auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg-primary, #f3f4f6);
            transition: all 0.3s ease;
        `;
        return container;
    }

    // ============================================================
    // AUTH CARD
    // ============================================================

    _buildAuthCard() {
        const card = document.createElement('div');
        card.className = 'auth-card';
        card.style.cssText = `
            width: 100%;
            max-width: 440px;
            padding: 40px 36px;
            border-radius: 16px;
            background: var(--bg-secondary, #ffffff);
            box-shadow: 0 8px 32px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
        `;

        // Logo / Brand
        this._buildBrand(card);

        // Mode selector
        this._buildModeSelector(card);

        // Form
        this._buildForm(card);

        // Social login
        if (this.config.enableSocialLogin) {
            this._buildSocialLogin(card);
        }

        // Footer
        this._buildFooter(card);

        this._container.appendChild(card);
        this._card = card;
    }

    // ============================================================
    // BRAND
    // ============================================================

    _buildBrand(container) {
        const brand = document.createElement('div');
        brand.className = 'auth-brand';
        brand.style.cssText = `
            text-align: center;
            margin-bottom: 32px;
        `;

        const logo = document.createElement('div');
        logo.textContent = '🛒';
        logo.style.cssText = `
            font-size: 48px;
            margin-bottom: 8px;
        `;

        const title = document.createElement('h1');
        title.textContent = 'ZYMORE';
        title.style.cssText = `
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            color: var(--text-primary, #1a1a2e);
            letter-spacing: -0.5px;
        `;

        const subtitle = document.createElement('p');
        subtitle.textContent = 'Welcome back! Please login to your account.';
        subtitle.style.cssText = `
            margin: 4px 0 0;
            font-size: 14px;
            color: var(--text-secondary, #6b7280);
        `;

        brand.appendChild(logo);
        brand.appendChild(title);
        brand.appendChild(subtitle);
        container.appendChild(brand);
        this._brandEl = brand;
    }

    // ============================================================
    // MODE SELECTOR
    // ============================================================

    _buildModeSelector(container) {
        const modes = [
            { id: 'login', label: 'Login' },
            { id: 'signup', label: 'Sign Up' }
        ];

        const wrapper = document.createElement('div');
        wrapper.className = 'auth-mode-selector';
        wrapper.style.cssText = `
            display: flex;
            background: var(--bg-primary, #f3f4f6);
            border-radius: 12px;
            padding: 4px;
            margin-bottom: 28px;
            position: relative;
        `;

        modes.forEach(mode => {
            const btn = document.createElement('button');
            btn.className = 'auth-mode-btn';
            btn.dataset.mode = mode.id;
            btn.textContent = mode.label;
            btn.type = 'button';
            btn.style.cssText = `
                flex: 1;
                padding: 10px 16px;
                border: none;
                border-radius: 8px;
                background: ${this._currentMode === mode.id ? '#6366f1' : 'transparent'};
                color: ${this._currentMode === mode.id ? '#ffffff' : 'var(--text-secondary, #6b7280)'};
                font-size: 14px;
                font-weight: ${this._currentMode === mode.id ? '600' : '500'};
                cursor: pointer;
                transition: all 0.3s ease;
            `;

            if (this._currentMode !== mode.id) {
                btn.addEventListener('mouseenter', () => {
                    btn.style.background = 'rgba(99,102,241,0.1)';
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.background = 'transparent';
                });
            }

            btn.addEventListener('click', () => {
                this._handleToggleMode(mode.id);
            });

            wrapper.appendChild(btn);
        });

        container.appendChild(wrapper);
        this._modeWrapper = wrapper;
    }

    // ============================================================
    // FORM
    // ============================================================

    _buildForm(container) {
        const form = document.createElement('form');
        form.className = 'auth-form';
        form.id = `auth-form-${this._id}`;
        form.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 16px;
        `;
        form.setAttribute('novalidate', '');

        // --- Email ---
        const emailGroup = this._createInputGroup('email', 'Email Address', 'email', '📧', 'email');
        form.appendChild(emailGroup);

        // --- Password ---
        const passwordGroup = this._createInputGroup('password', 'Password', 'password', '🔒', 'password');
        form.appendChild(passwordGroup);

        // --- Confirm Password (Signup) ---
        const confirmGroup = this._createInputGroup('confirmPassword', 'Confirm Password', 'password', '🔐', 'password');
        confirmGroup.style.display = this._currentMode === 'signup' ? 'block' : 'none';
        form.appendChild(confirmGroup);

        // --- Display Name (Signup) ---
        const nameGroup = this._createInputGroup('displayName', 'Full Name', 'text', '👤', 'text');
        nameGroup.style.display = this._currentMode === 'signup' ? 'block' : 'none';
        form.appendChild(nameGroup);

        // --- Remember Me ---
        if (this.config.enableRememberMe) {
            const rememberGroup = document.createElement('div');
            rememberGroup.className = 'auth-remember';
            rememberGroup.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin: 4px 0;
            `;

            const checkboxLabel = document.createElement('label');
            checkboxLabel.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                color: var(--text-secondary, #6b7280);
                cursor: pointer;
            `;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'auth-remember-checkbox';
            checkbox.checked = this._formData.rememberMe;
            checkbox.style.cssText = `
                width: 16px;
                height: 16px;
                accent-color: #6366f1;
                cursor: pointer;
            `;
            checkbox.addEventListener('change', (e) => {
                this._formData.rememberMe = e.target.checked;
            });

            const labelText = document.createElement('span');
            labelText.textContent = 'Remember me';

            checkboxLabel.appendChild(checkbox);
            checkboxLabel.appendChild(labelText);

            rememberGroup.appendChild(checkboxLabel);

            // Forgot password link
            if (this.config.enablePasswordReset) {
                const forgotLink = document.createElement('button');
                forgotLink.type = 'button';
                forgotLink.textContent = 'Forgot Password?';
                forgotLink.style.cssText = `
                    background: none;
                    border: none;
                    color: #6366f1;
                    font-size: 13px;
                    cursor: pointer;
                    padding: 4px 8px;
                    transition: color 0.2s;
                `;
                forgotLink.addEventListener('mouseenter', () => {
                    forgotLink.style.color = '#4f46e5';
                });
                forgotLink.addEventListener('mouseleave', () => {
                    forgotLink.style.color = '#6366f1';
                });
                forgotLink.addEventListener('click', () => {
                    this._handleToggleMode('forgot');
                });
                rememberGroup.appendChild(forgotLink);
            }

            form.appendChild(rememberGroup);
        }

        // --- Terms (Signup) ---
        if (this.config.enableTermsCheck) {
            const termsGroup = document.createElement('div');
            termsGroup.className = 'auth-terms';
            termsGroup.style.cssText = `
                display: ${this._currentMode === 'signup' ? 'flex' : 'none'};
                align-items: flex-start;
                gap: 8px;
                margin: 4px 0;
            `;

            const termsCheckbox = document.createElement('input');
            termsCheckbox.type = 'checkbox';
            termsCheckbox.className = 'auth-terms-checkbox';
            termsCheckbox.checked = this._formData.acceptTerms;
            termsCheckbox.style.cssText = `
                width: 16px;
                height: 16px;
                margin-top: 2px;
                accent-color: #6366f1;
                cursor: pointer;
                flex-shrink: 0;
            `;
            termsCheckbox.addEventListener('change', (e) => {
                this._formData.acceptTerms = e.target.checked;
            });

            const termsLabel = document.createElement('label');
            termsLabel.style.cssText = `
                font-size: 13px;
                color: var(--text-secondary, #6b7280);
                cursor: pointer;
                line-height: 1.4;
            `;
            termsLabel.innerHTML = `
                I agree to the 
                <a href="/terms" style="color:#6366f1;text-decoration:none;">Terms of Service</a> 
                and 
                <a href="/privacy" style="color:#6366f1;text-decoration:none;">Privacy Policy</a>
            `;

            termsGroup.appendChild(termsCheckbox);
            termsGroup.appendChild(termsLabel);
            form.appendChild(termsGroup);
        }

        // --- Submit Button ---
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.className = 'auth-submit-btn';
        submitBtn.textContent = this._getSubmitLabel();
        submitBtn.style.cssText = `
            padding: 14px;
            border: none;
            border-radius: 12px;
            background: #6366f1;
            color: #ffffff;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 8px;
            position: relative;
        `;
        submitBtn.addEventListener('mouseenter', () => {
            submitBtn.style.background = '#4f46e5';
            submitBtn.style.transform = 'translateY(-2px)';
            submitBtn.style.boxShadow = '0 4px 12px rgba(99,102,241,0.3)';
        });
        submitBtn.addEventListener('mouseleave', () => {
            submitBtn.style.background = '#6366f1';
            submitBtn.style.transform = 'translateY(0)';
            submitBtn.style.boxShadow = 'none';
        });

        // Loading spinner inside button
        const spinner = document.createElement('span');
        spinner.className = 'auth-spinner';
        spinner.style.cssText = `
            display: none;
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: #ffffff;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
        `;
        // Add keyframe animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                to { transform: translateY(-50%) rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        submitBtn.appendChild(spinner);

        form.appendChild(submitBtn);

        // --- Error Message ---
        const errorMsg = document.createElement('div');
        errorMsg.className = 'auth-error';
        errorMsg.id = `auth-error-${this._id}`;
        errorMsg.style.cssText = `
            display: none;
            padding: 12px 16px;
            border-radius: 8px;
            background: #fef2f2;
            color: #dc2626;
            font-size: 14px;
            border: 1px solid #fecaca;
        `;
        form.appendChild(errorMsg);

        // --- Success Message ---
        const successMsg = document.createElement('div');
        successMsg.className = 'auth-success';
        successMsg.id = `auth-success-${this._id}`;
        successMsg.style.cssText = `
            display: none;
            padding: 12px 16px;
            border-radius: 8px;
            background: #f0fdf4;
            color: #16a34a;
            font-size: 14px;
            border: 1px solid #bbf7d0;
        `;
        form.appendChild(successMsg);

        // Form submit
        form.addEventListener('submit', this._handleFormSubmit);

        // Keydown for enter key
        form.addEventListener('keydown', this._handleKeydown);

        container.appendChild(form);
        this._form = form;
        this._submitBtn = submitBtn;
        this._spinner = spinner;
        this._errorMsg = errorMsg;
        this._successMsg = successMsg;

        // Store input references
        this._inputs = {
            email: form.querySelector('#auth-email'),
            password: form.querySelector('#auth-password'),
            confirmPassword: form.querySelector('#auth-confirmPassword'),
            displayName: form.querySelector('#auth-displayName')
        };
    }

    // ============================================================
    // INPUT GROUP
    // ============================================================

    _createInputGroup(id, label, type, icon, inputType) {
        const group = document.createElement('div');
        group.className = 'auth-input-group';
        group.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 6px;
        `;

        const labelEl = document.createElement('label');
        labelEl.htmlFor = `auth-${id}`;
        labelEl.textContent = label;
        labelEl.style.cssText = `
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary, #1a1a2e);
        `;

        const inputWrapper = document.createElement('div');
        inputWrapper.style.cssText = `
            position: relative;
            display: flex;
            align-items: center;
        `;

        const iconEl = document.createElement('span');
        iconEl.textContent = icon;
        iconEl.style.cssText = `
            position: absolute;
            left: 14px;
            font-size: 18px;
            opacity: 0.5;
            pointer-events: none;
        `;

        const input = document.createElement('input');
        input.type = inputType;
        input.id = `auth-${id}`;
        input.name = id;
        input.className = 'auth-input';
        input.placeholder = `Enter ${label.toLowerCase()}`;
        input.value = this._formData[id] || '';
        input.autocomplete = id === 'password' ? 'current-password' : id === 'email' ? 'email' : 'off';
        input.style.cssText = `
            width: 100%;
            padding: 12px 16px 12px 44px;
            border-radius: 10px;
            border: 1px solid var(--border-color, #e5e7eb);
            font-size: 14px;
            background: var(--bg-primary, #ffffff);
            color: var(--text-primary, #1f2937);
            transition: all 0.3s ease;
            outline: none;
            box-sizing: border-box;
        `;

        input.addEventListener('focus', () => {
            input.style.borderColor = '#6366f1';
            input.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
        });
        input.addEventListener('blur', () => {
            input.style.borderColor = 'var(--border-color, #e5e7eb)';
            input.style.boxShadow = 'none';
        });
        input.addEventListener('input', (e) => {
            this._formData[id] = e.target.value;
            this._clearError();
        });

        // Password toggle
        if (type === 'password') {
            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.textContent = '👁️';
            toggleBtn.style.cssText = `
                position: absolute;
                right: 12px;
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                opacity: 0.5;
                padding: 4px;
                transition: opacity 0.2s;
            `;
            toggleBtn.addEventListener('mouseenter', () => {
                toggleBtn.style.opacity = '1';
            });
            toggleBtn.addEventListener('mouseleave', () => {
                toggleBtn.style.opacity = '0.5';
            });
            toggleBtn.addEventListener('click', () => {
                input.type = input.type === 'password' ? 'text' : 'password';
                toggleBtn.textContent = input.type === 'password' ? '👁️' : '👁️‍🗨️';
            });
            inputWrapper.appendChild(toggleBtn);
        }

        inputWrapper.appendChild(iconEl);
        inputWrapper.appendChild(input);
        group.appendChild(labelEl);
        group.appendChild(inputWrapper);

        // Validation message
        const validationMsg = document.createElement('span');
        validationMsg.className = 'auth-validation-msg';
        validationMsg.style.cssText = `
            font-size: 12px;
            color: #dc2626;
            display: none;
            margin-top: 2px;
        `;
        group.appendChild(validationMsg);

        return group;
    }

    // ============================================================
    // SOCIAL LOGIN
    // ============================================================

    _buildSocialLogin(container) {
        const divider = document.createElement('div');
        divider.className = 'auth-divider';
        divider.style.cssText = `
            display: flex;
            align-items: center;
            gap: 16px;
            margin: 20px 0 16px;
        `;

        const line = document.createElement('span');
        line.style.cssText = `
            flex: 1;
            height: 1px;
            background: var(--border-color, #e5e7eb);
        `;

        const text = document.createElement('span');
        text.textContent = 'Or continue with';
        text.style.cssText = `
            font-size: 13px;
            color: var(--text-secondary, #6b7280);
            white-space: nowrap;
        `;

        divider.appendChild(line);
        divider.appendChild(text);
        divider.appendChild(line);
        container.appendChild(divider);

        const socialWrapper = document.createElement('div');
        socialWrapper.className = 'auth-social';
        socialWrapper.style.cssText = `
            display: flex;
            gap: 12px;
            justify-content: center;
        `;

        // Google
        if (this.config.enableGoogleLogin) {
            const googleBtn = document.createElement('button');
            googleBtn.type = 'button';
            googleBtn.className = 'auth-social-btn';
            googleBtn.textContent = 'Google';
            googleBtn.style.cssText = `
                flex: 1;
                padding: 12px 16px;
                border-radius: 10px;
                border: 1px solid var(--border-color, #e5e7eb);
                background: var(--bg-primary, #ffffff);
                color: var(--text-primary, #1f2937);
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            `;
            googleBtn.addEventListener('mouseenter', () => {
                googleBtn.style.borderColor = '#6366f1';
                googleBtn.style.background = 'rgba(99,102,241,0.05)';
            });
            googleBtn.addEventListener('mouseleave', () => {
                googleBtn.style.borderColor = 'var(--border-color, #e5e7eb)';
                googleBtn.style.background = 'var(--bg-primary, #ffffff)';
            });

            const googleIcon = document.createElement('span');
            googleIcon.textContent = '🔵';
            googleBtn.prepend(googleIcon);

            googleBtn.addEventListener('click', this._handleGoogleLogin);
            socialWrapper.appendChild(googleBtn);
        }

        // Guest
        if (this.config.enableGuestLogin) {
            const guestBtn = document.createElement('button');
            guestBtn.type = 'button';
            guestBtn.className = 'auth-social-btn';
            guestBtn.textContent = 'Guest';
            guestBtn.style.cssText = `
                flex: 1;
                padding: 12px 16px;
                border-radius: 10px;
                border: 1px solid var(--border-color, #e5e7eb);
                background: var(--bg-primary, #ffffff);
                color: var(--text-primary, #1f2937);
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            `;
            guestBtn.addEventListener('mouseenter', () => {
                guestBtn.style.borderColor = '#6b7280';
                guestBtn.style.background = 'rgba(107,114,128,0.05)';
            });
            guestBtn.addEventListener('mouseleave', () => {
                guestBtn.style.borderColor = 'var(--border-color, #e5e7eb)';
                guestBtn.style.background = 'var(--bg-primary, #ffffff)';
            });

            const guestIcon = document.createElement('span');
            guestIcon.textContent = '👤';
            guestBtn.prepend(guestIcon);

            guestBtn.addEventListener('click', this._handleGuestLogin);
            socialWrapper.appendChild(guestBtn);
        }

        container.appendChild(socialWrapper);
    }

    // ============================================================
    // FOOTER
    // ============================================================

    _buildFooter(container) {
        const footer = document.createElement('div');
        footer.className = 'auth-footer';
        footer.style.cssText = `
            text-align: center;
            margin-top: 20px;
            font-size: 13px;
            color: var(--text-secondary, #6b7280);
        `;

        const toggleText = document.createElement('span');
        toggleText.textContent = this._currentMode === 'login' 
            ? "Don't have an account? " 
            : "Already have an account? ";

        const toggleLink = document.createElement('button');
        toggleLink.type = 'button';
        toggleLink.textContent = this._currentMode === 'login' ? 'Sign Up' : 'Login';
        toggleLink.style.cssText = `
            background: none;
            border: none;
            color: #6366f1;
            font-weight: 600;
            cursor: pointer;
            padding: 4px 8px;
            transition: color 0.2s;
            font-size: 13px;
        `;
        toggleLink.addEventListener('mouseenter', () => {
            toggleLink.style.color = '#4f46e5';
        });
        toggleLink.addEventListener('mouseleave', () => {
            toggleLink.style.color = '#6366f1';
        });
        toggleLink.addEventListener('click', () => {
            this._handleToggleMode(this._currentMode === 'login' ? 'signup' : 'login');
        });

        footer.appendChild(toggleText);
        footer.appendChild(toggleLink);

        // Back to login (for forgot mode)
        if (this._currentMode === 'forgot') {
            const backBtn = document.createElement('button');
            backBtn.type = 'button';
            backBtn.textContent = '← Back to Login';
            backBtn.style.cssText = `
                background: none;
                border: none;
                color: #6366f1;
                font-weight: 600;
                cursor: pointer;
                padding: 4px 8px;
                transition: color 0.2s;
                font-size: 13px;
                display: block;
                margin: 0 auto 8px;
            `;
            backBtn.addEventListener('mouseenter', () => {
                backBtn.style.color = '#4f46e5';
            });
            backBtn.addEventListener('mouseleave', () => {
                backBtn.style.color = '#6366f1';
            });
            backBtn.addEventListener('click', () => {
                this._handleToggleMode('login');
            });
            footer.prepend(backBtn);
        }

        container.appendChild(footer);
        this._footer = footer;
    }

    // ============================================================
    // FORM HANDLERS
    // ============================================================

    _handleFormSubmit(e) {
        e.preventDefault();

        if (this._isLoading) return;

        // Clear previous messages
        this._clearError();
        this._clearSuccess();

        // Validate based on mode
        if (this._currentMode === 'login') {
            this._handleLogin();
        } else if (this._currentMode === 'signup') {
            this._handleSignup();
        } else if (this._currentMode === 'forgot') {
            this._handleForgotPassword();
        } else if (this._currentMode === 'reset') {
            this._handleResetPassword();
        }
    }

    _handleKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this._handleFormSubmit(e);
        }
    }

    // ============================================================
    // LOGIN
    // ============================================================

    async _handleLogin() {
        const { email, password, rememberMe } = this._formData;

        // Validate
        if (!email) {
            this._showError('Please enter your email address');
            this._focusInput('email');
            return;
        }

        if (!validators.isEmail(email)) {
            this._showError('Please enter a valid email address');
            this._focusInput('email');
            return;
        }

        if (!password) {
            this._showError('Please enter your password');
            this._focusInput('password');
            return;
        }

        if (password.length < 6) {
            this._showError('Password must be at least 6 characters');
            this._focusInput('password');
            return;
        }

        this._setLoading(true);

        try {
            analyticsService.trackEvent('auth_login_attempt', { method: 'email' });

            const user = await authService.loginWithEmail(email, password);

            if (rememberMe) {
                // Save session
                localStorage.setItem('zymore_remember', 'true');
            }

            analyticsService.trackEvent('auth_login_success', { method: 'email' });
            this._showSuccess('Login successful! Redirecting...');

            // Update store
            setState('auth.user', user);
            setState('auth.isAuthenticated', true);

            // Emit event
            eventBus.emit(EVENTS.AUTH_LOGIN, user);

            // Redirect
            setTimeout(() => {
                this._redirectAfterAuth();
            }, 500);

        } catch (error) {
            analyticsService.trackEvent('auth_login_failed', { 
                method: 'email',
                error: error.message 
            });
            this._showError(error.message || 'Login failed. Please try again.');
            logger.error('❌ Login failed:', error);
        } finally {
            this._setLoading(false);
        }
    }

    // ============================================================
    // SIGNUP
    // ============================================================

    async _handleSignup() {
        const { email, password, confirmPassword, displayName, acceptTerms } = this._formData;

        // Validate
        if (!displayName) {
            this._showError('Please enter your full name');
            this._focusInput('displayName');
            return;
        }

        if (displayName.length < 2) {
            this._showError('Name must be at least 2 characters');
            this._focusInput('displayName');
            return;
        }

        if (!email) {
            this._showError('Please enter your email address');
            this._focusInput('email');
            return;
        }

        if (!validators.isEmail(email)) {
            this._showError('Please enter a valid email address');
            this._focusInput('email');
            return;
        }

        if (!password) {
            this._showError('Please enter a password');
            this._focusInput('password');
            return;
        }

        if (password.length < 6) {
            this._showError('Password must be at least 6 characters');
            this._focusInput('password');
            return;
        }

        if (password !== confirmPassword) {
            this._showError('Passwords do not match');
            this._focusInput('confirmPassword');
            return;
        }

        if (this.config.enableTermsCheck && !acceptTerms) {
            this._showError('Please accept the Terms of Service and Privacy Policy');
            return;
        }

        this._setLoading(true);

        try {
            analyticsService.trackEvent('auth_signup_attempt', { method: 'email' });

            const user = await authService.signupWithEmail(email, password, displayName);

            analyticsService.trackEvent('auth_signup_success', { method: 'email' });
            this._showSuccess('Account created successfully! Welcome to ZYMORE! 🎉');

            // Update store
            setState('auth.user', user);
            setState('auth.isAuthenticated', true);

            // Emit event
            eventBus.emit(EVENTS.AUTH_SIGNUP, user);

            // Redirect
            setTimeout(() => {
                this._redirectAfterAuth();
            }, 800);

        } catch (error) {
            analyticsService.trackEvent('auth_signup_failed', {
                method: 'email',
                error: error.message
            });
            this._showError(error.message || 'Signup failed. Please try again.');
            logger.error('❌ Signup failed:', error);
        } finally {
            this._setLoading(false);
        }
    }

    // ============================================================
    // FORGOT PASSWORD
    // ============================================================

    async _handleForgotPassword() {
        const email = this._formData.email;

        if (!email) {
            this._showError('Please enter your email address');
            this._focusInput('email');
            return;
        }

        if (!validators.isEmail(email)) {
            this._showError('Please enter a valid email address');
            this._focusInput('email');
            return;
        }

        this._setLoading(true);

        try {
            analyticsService.trackEvent('auth_forgot_password', { method: 'email' });

            await authService.sendPasswordResetEmail(email);

            this._showSuccess('Password reset link sent to your email! 📧');
            this._formData.resetEmail = email;

            // Switch to reset mode after 2 seconds
            setTimeout(() => {
                this._handleToggleMode('login');
                this._showSuccess('Check your email for reset instructions!', 5000);
            }, 2000);

        } catch (error) {
            this._showError(error.message || 'Failed to send reset link. Please try again.');
            logger.error('❌ Forgot password failed:', error);
        } finally {
            this._setLoading(false);
        }
    }

    // ============================================================
    // RESET PASSWORD
    // ============================================================

    async _handleResetPassword() {
        const { password, confirmPassword } = this._formData;

        if (!password) {
            this._showError('Please enter a new password');
            this._focusInput('password');
            return;
        }

        if (password.length < 6) {
            this._showError('Password must be at least 6 characters');
            this._focusInput('password');
            return;
        }

        if (password !== confirmPassword) {
            this._showError('Passwords do not match');
            this._focusInput('confirmPassword');
            return;
        }

        this._setLoading(true);

        try {
            const token = this._getResetToken();
            if (!token) {
                throw new Error('Invalid reset token. Please try again.');
            }

            analyticsService.trackEvent('auth_reset_password', { method: 'token' });

            await authService.confirmPasswordReset(token, password);

            this._showSuccess('Password reset successful! You can now login. ✅');

            setTimeout(() => {
                this._handleToggleMode('login');
                this._showSuccess('Password reset complete! Please login.', 3000);
            }, 1500);

        } catch (error) {
            this._showError(error.message || 'Password reset failed. Please try again.');
            logger.error('❌ Reset password failed:', error);
        } finally {
            this._setLoading(false);
        }
    }

    // ============================================================
    // SOCIAL LOGIN
    // ============================================================

    async _handleGoogleLogin() {
        if (this._isLoading) return;

        this._setLoading(true);

        try {
            analyticsService.trackEvent('auth_social_login', { provider: 'google' });

            const user = await authService.loginWithGoogle();

            analyticsService.trackEvent('auth_social_login_success', { provider: 'google' });
            this._showSuccess('Google login successful! Redirecting...');

            setState('auth.user', user);
            setState('auth.isAuthenticated', true);
            eventBus.emit(EVENTS.AUTH_LOGIN, user);

            setTimeout(() => {
                this._redirectAfterAuth();
            }, 500);

        } catch (error) {
            analyticsService.trackEvent('auth_social_login_failed', { 
                provider: 'google',
                error: error.message 
            });
            this._showError(error.message || 'Google login failed. Please try again.');
            logger.error('❌ Google login failed:', error);
        } finally {
            this._setLoading(false);
        }
    }

    async _handleGuestLogin() {
        if (this._isLoading) return;

        this._setLoading(true);

        try {
            analyticsService.trackEvent('auth_guest_login');

            const user = await authService.loginAsGuest();

            analyticsService.trackEvent('auth_guest_login_success');
            this._showSuccess('Welcome, Guest! 🎉');

            setState('auth.user', user);
            setState('auth.isAuthenticated', true);
            eventBus.emit(EVENTS.AUTH_LOGIN, user);

            setTimeout(() => {
                this._redirectAfterAuth();
            }, 500);

        } catch (error) {
            analyticsService.trackEvent('auth_guest_login_failed', {
                error: error.message
            });
            this._showError(error.message || 'Guest login failed. Please try again.');
            logger.error('❌ Guest login failed:', error);
        } finally {
            this._setLoading(false);
        }
    }

    // ============================================================
    // TOGGLE MODE
    // ============================================================

    _handleToggleMode(mode) {
        if (this._isLoading) return;

        this._currentMode = mode;
        this._clearError();
        this._clearSuccess();
        this._formData.password = '';
        this._formData.confirmPassword = '';

        // Update mode selector
        const btns = this._modeWrapper?.querySelectorAll('.auth-mode-btn');
        btns?.forEach(btn => {
            const isActive = btn.dataset.mode === mode;
            btn.style.background = isActive ? '#6366f1' : 'transparent';
            btn.style.color = isActive ? '#ffffff' : 'var(--text-secondary, #6b7280)';
            btn.style.fontWeight = isActive ? '600' : '500';
        });

        // Update form elements
        const confirmGroup = this._form?.querySelector('.auth-input-group:has(#auth-confirmPassword)');
        if (confirmGroup) {
            confirmGroup.style.display = mode === 'signup' || mode === 'reset' ? 'block' : 'none';
        }

        const nameGroup = this._form?.querySelector('.auth-input-group:has(#auth-displayName)');
        if (nameGroup) {
            nameGroup.style.display = mode === 'signup' ? 'block' : 'none';
        }

        const termsGroup = this._form?.querySelector('.auth-terms');
        if (termsGroup) {
            termsGroup.style.display = mode === 'signup' ? 'flex' : 'none';
        }

        const rememberGroup = this._form?.querySelector('.auth-remember');
        if (rememberGroup) {
            rememberGroup.style.display = mode === 'login' ? 'flex' : 'none';
        }

        // Update submit button
        if (this._submitBtn) {
            this._submitBtn.textContent = this._getSubmitLabel();
        }

        // Update brand subtitle
        const subtitle = this._brandEl?.querySelector('p');
        if (subtitle) {
            const texts = {
                login: 'Welcome back! Please login to your account.',
                signup: 'Create your account to get started.',
                forgot: 'Enter your email to reset your password.',
                reset: 'Enter your new password.'
            };
            subtitle.textContent = texts[mode] || texts.login;
        }

        // Update footer
        this._updateFooter();

        // Focus first input
        setTimeout(() => {
            const firstInput = this._form?.querySelector('input:not([type="hidden"])');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);

        // Update URL
        const routes = {
            login: '/auth?mode=login',
            signup: '/auth?mode=signup',
            forgot: '/auth?mode=forgot',
            reset: '/auth?mode=reset'
        };
        if (routes[mode] && window.history) {
            window.history.replaceState({}, '', routes[mode]);
        }

        logger.info(`🔄 Auth mode changed: ${mode}`);
    }

    // ============================================================
    // UI HELPERS
    // ============================================================

    _getSubmitLabel() {
        const labels = {
            login: 'Login',
            signup: 'Create Account',
            forgot: 'Send Reset Link',
            reset: 'Reset Password'
        };
        return labels[this._currentMode] || 'Submit';
    }

    _getModeTitle() {
        const titles = {
            login: 'Login to Your Account',
            signup: 'Create Your Account',
            forgot: 'Reset Password',
            reset: 'Set New Password'
        };
        return titles[this._currentMode] || 'Authentication';
    }

    _updateFooter() {
        if (!this._footer) return;

        // Clear footer
        this._footer.innerHTML = '';

        // Back to login button (for forgot/reset)
        if (this._currentMode === 'forgot' || this._currentMode === 'reset') {
            const backBtn = document.createElement('button');
            backBtn.type = 'button';
            backBtn.textContent = '← Back to Login';
            backBtn.style.cssText = `
                background: none;
                border: none;
                color: #6366f1;
                font-weight: 600;
                cursor: pointer;
                padding: 4px 8px;
                transition: color 0.2s;
                font-size: 13px;
                display: block;
                margin: 0 auto 8px;
            `;
            backBtn.addEventListener('mouseenter', () => {
                backBtn.style.color = '#4f46e5';
            });
            backBtn.addEventListener('mouseleave', () => {
                backBtn.style.color = '#6366f1';
            });
            backBtn.addEventListener('click', () => {
                this._handleToggleMode('login');
            });
            this._footer.appendChild(backBtn);
        }

        // Toggle text
        const toggleText = document.createElement('span');
        toggleText.textContent = this._currentMode === 'login' 
            ? "Don't have an account? " 
            : this._currentMode === 'signup' 
                ? "Already have an account? " 
                : '';

        const toggleLink = document.createElement('button');
        toggleLink.type = 'button';
        toggleLink.textContent = this._currentMode === 'login' ? 'Sign Up' : 'Login';
        toggleLink.style.cssText = `
            background: none;
            border: none;
            color: #6366f1;
            font-weight: 600;
            cursor: pointer;
            padding: 4px 8px;
            transition: color 0.2s;
            font-size: 13px;
        `;
        toggleLink.addEventListener('mouseenter', () => {
            toggleLink.style.color = '#4f46e5';
        });
        toggleLink.addEventListener('mouseleave', () => {
            toggleLink.style.color = '#6366f1';
        });
        toggleLink.addEventListener('click', () => {
            this._handleToggleMode(this._currentMode === 'login' ? 'signup' : 'login');
        });

        if (toggleText.textContent) {
            this._footer.appendChild(toggleText);
            this._footer.appendChild(toggleLink);
        }
    }

    _showError(message, duration = 5000) {
        if (!this._errorMsg) return;
        this._errorMsg.textContent = message;
        this._errorMsg.style.display = 'block';
        this._clearSuccess();

        // Auto hide after duration
        if (duration > 0) {
            setTimeout(() => {
                this._errorMsg.style.display = 'none';
            }, duration);
        }
    }

    _showSuccess(message, duration = 4000) {
        if (!this._successMsg) return;
        this._successMsg.textContent = message;
        this._successMsg.style.display = 'block';
        this._clearError();

        // Auto hide after duration
        if (duration > 0) {
            setTimeout(() => {
                this._successMsg.style.display = 'none';
            }, duration);
        }
    }

    _clearError() {
        if (this._errorMsg) {
            this._errorMsg.style.display = 'none';
            this._errorMsg.textContent = '';
        }
    }

    _clearSuccess() {
        if (this._successMsg) {
            this._successMsg.style.display = 'none';
            this._successMsg.textContent = '';
        }
    }

    _setLoading(loading) {
        this._isLoading = loading;
        if (this._submitBtn) {
            this._submitBtn.disabled = loading;
            this._submitBtn.style.opacity = loading ? '0.7' : '1';
            this._submitBtn.style.cursor = loading ? 'wait' : 'pointer';
        }
        if (this._spinner) {
            this._spinner.style.display = loading ? 'block' : 'none';
        }
        // Disable all inputs
        const inputs = this._form?.querySelectorAll('input');
        inputs?.forEach(input => {
            input.disabled = loading;
        });
        // Disable social buttons
        const socialBtns = this._container?.querySelectorAll('.auth-social-btn');
        socialBtns?.forEach(btn => {
            btn.disabled = loading;
            btn.style.opacity = loading ? '0.5' : '1';
            btn.style.cursor = loading ? 'wait' : 'pointer';
        });
    }

    _focusInput(id) {
        const input = this._form?.querySelector(`#auth-${id}`);
        if (input) {
            setTimeout(() => {
                input.focus();
                input.select();
            }, 100);
        }
    }

    // ============================================================
    // REDIRECT
    // ============================================================

    _redirectAfterAuth() {
        const redirect = this.config.redirectAfterLogin;
        const from = new URLSearchParams(window.location.search).get('redirect');
        const target = from || redirect;

        if (this.config.autoRedirect) {
            router.navigate(target);
        } else {
            // Show a button or message
            const btn = document.createElement('button');
            btn.textContent = 'Continue to Dashboard →';
            btn.style.cssText = `
                padding: 12px 24px;
                border: none;
                border-radius: 12px;
                background: #6366f1;
                color: #ffffff;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 16px;
                width: 100%;
            `;
            btn.addEventListener('mouseenter', () => {
                btn.style.background = '#4f46e5';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = '#6366f1';
            });
            btn.addEventListener('click', () => {
                router.navigate(target);
            });
            this._form?.appendChild(btn);
        }
    }

    // ============================================================
    // RESET TOKEN
    // ============================================================

    _checkResetToken() {
        const token = this._getResetToken();
        if (token) {
            this._handleToggleMode('reset');
            // Show success message
            setTimeout(() => {
                this._showSuccess('Please enter your new password.', 3000);
            }, 500);
        }
    }

    _getResetToken() {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        // Also check path for /reset-password/:token
        const path = window.location.pathname;
        const match = path.match(/\/reset-password\/(.+)/);
        return token || (match ? match[1] : null);
    }

    // ============================================================
    // THEME
    // ============================================================

    _applyTheme() {
        if (!this._container) return;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        this._container.style.background = isDark ? '#0f0f1a' : '#f3f4f6';
        
        // Update card background
        const card = this._container.querySelector('.auth-card');
        if (card) {
            card.style.background = isDark ? '#1a1a2e' : '#ffffff';
            card.style.boxShadow = isDark 
                ? '0 8px 32px rgba(0,0,0,0.3)' 
                : '0 8px 32px rgba(0,0,0,0.08)';
        }

        // Update inputs
        const inputs = this._container.querySelectorAll('.auth-input');
        inputs.forEach(input => {
            input.style.background = isDark ? '#2d2d44' : '#ffffff';
            input.style.color = isDark ? '#f3f4f6' : '#1f2937';
            input.style.borderColor = isDark ? '#3d3d5c' : '#e5e7eb';
        });

        // Update mode selector
        const modeWrapper = this._container.querySelector('.auth-mode-selector');
        if (modeWrapper) {
            modeWrapper.style.background = isDark ? '#2d2d44' : '#f3f4f6';
        }

        // Update social buttons
        const socialBtns = this._container.querySelectorAll('.auth-social-btn');
        socialBtns.forEach(btn => {
            btn.style.background = isDark ? '#2d2d44' : '#ffffff';
            btn.style.color = isDark ? '#f3f4f6' : '#1f2937';
            btn.style.borderColor = isDark ? '#3d3d5c' : '#e5e7eb';
        });
    }

    // ============================================================
    // EVENT HANDLERS
    // ============================================================

    _handleInputChange(e) {
        const { name, value, type, checked } = e.target;
        this._formData[name] = type === 'checkbox' ? checked : value;
    }

    _handleAuthChange(user) {
        if (user) {
            this._redirectAfterAuth();
        }
    }

    _handleThemeChange() {
        this._applyTheme();
    }

    // ============================================================
    // SUBSCRIPTIONS
    // ============================================================

    _setupSubscriptions() {
        this._subscribers.push(
            subscribe((state) => {
                this._handleThemeChange();
            }, ['ui.theme'])
        );

        this._subscribers.push(
            subscribe((state) => {
                if (state.auth?.isAuthenticated) {
                    this._redirectAfterAuth();
                }
            }, ['auth.isAuthenticated'])
        );
    }

    // ============================================================
    // EVENT LISTENERS
    // ============================================================

    _setupEventListeners() {
        this._eventListeners.push(
            eventBus.on(EVENTS.THEME_CHANGED, this._handleThemeChange)
        );
        this._eventListeners.push(
            eventBus.on(EVENTS.AUTH_LOGIN, this._handleAuthChange)
        );
        this._eventListeners.push(
            eventBus.on(EVENTS.AUTH_SIGNUP, this._handleAuthChange)
        );
    }

    // ============================================================
    // UTILITY METHODS
    // ============================================================

    _generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    // ============================================================
    // PUBLIC METHODS
    // ============================================================

    setMode(mode) {
        if (['login', 'signup', 'forgot', 'reset'].includes(mode)) {
            this._handleToggleMode(mode);
        }
        return this;
    }

    setEmail(email) {
        this._formData.email = email;
        if (this._inputs?.email) {
            this._inputs.email.value = email;
        }
        return this;
    }

    refresh() {
        this._applyTheme();
        return this;
    }

    destroy() {
        if (this._isDestroyed) return;

        this._isDestroyed = true;

        // Unsubscribe
        this._subscribers.forEach(unsub => {
            if (typeof unsub === 'function') unsub();
        });
        this._subscribers = [];

        // Remove event listeners
        this._eventListeners.forEach(unsub => {
            if (typeof unsub === 'function') unsub();
        });
        this._eventListeners = [];

        // Remove from DOM
        if (this._container && this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }

        this._container = null;
        this._form = null;
        this._submitBtn = null;
        this._spinner = null;
        this._errorMsg = null;
        this._successMsg = null;

        logger.info('🔐 AuthScreen destroyed', { id: this._id });
    }
}

// ============================================================
// EXPORT
// ============================================================

export default AuthScreen;

// ============================================================
// GLOBAL EXPOSURE
// ============================================================

if (typeof window !== 'undefined') {
    window.AuthScreen = AuthScreen;
}

// ============================================================
// END OF FILE: auth-screen.js
// ============================================================