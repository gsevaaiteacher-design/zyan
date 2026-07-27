// ============================================================
// FILE: js/screens/settings-screen.js
// PURPOSE: Complete User Settings Management
// DEPENDENCY: store.js, theme.js, notification-service.js, toast-notification.js
// ROUTE: /settings
// VERSION: 4.0.0
// ============================================================

import { store } from '../store.js';
import { themeManager } from '../utils/theme.js';
import { notificationService } from '../services/notification-service.js';
import { showToast } from '../widgets/toast-notification.js';
import { authService } from '../services/auth-service.js';
import { analyticsService } from '../services/analytics-service.js';
import { databaseService } from '../services/database-service.js';

/**
 * SettingsScreen - Production Grade Settings Manager
 * 
 * FEATURES:
 * ✅ Theme Management (Light/Dark/System)
 * ✅ Language Support (5 Languages)
 * ✅ Notification Controls (Push/Email/Social/Ad)
 * ✅ Privacy Settings
 * ✅ Account Management
 * ✅ Data Export/Import
 * ✅ Cache Management
 * ✅ AI Assistant Settings
 * ✅ Ad Preferences
 * ✅ Danger Zone (Delete Account)
 * ✅ Real-time Updates
 * ✅ Analytics Tracking
 * ✅ Responsive Design
 * ✅ Accessibility (WCAG AA)
 * ✅ Error Handling
 * ✅ Loading States
 */
export const SettingsScreen = {
    /**
     * Screen State
     */
    state: {
        settings: {},
        user: null,
        isLoading: false,
        isSaving: false,
        dirty: false
    },

    /**
     * Render the Settings Screen
     */
    render: function(container) {
        this.container = container;
        this.state.user = store.getState().user;
        
        if (!this.state.user) {
            showToast('Please login to access settings', 'warning');
            setTimeout(() => {
                window.location.hash = '/auth';
            }, 1500);
            return;
        }

        this.loadSettings();
        this.renderUI(container);
        this.bindEvents(container);
        analyticsService.trackScreen('settings');
    },

    /**
     * Load Settings from Store/LocalStorage
     */
    loadSettings: function() {
        const saved = localStorage.getItem('zymore_settings');
        const userPrefs = this.state.user?.preferences || {};

        this.state.settings = {
            theme: userPrefs.darkMode ? 'dark' : 'light',
            language: userPrefs.language || 'en',
            notifications: {
                push: userPrefs.notifications !== false,
                email: userPrefs.emailNotifications !== false,
                social: userPrefs.socialNotifications !== false,
                ad: userPrefs.adNotifications !== false
            },
            privacy: {
                analytics: true,
                profilePublic: userPrefs.profilePublic !== false,
                showOnline: userPrefs.showOnline !== false
            },
            ai: {
                enabled: userPrefs.enableAI !== false,
                autoSuggest: userPrefs.autoSuggest !== false
            },
            ads: {
                rewardNotifications: userPrefs.adNotifications !== false,
                autoPlay: userPrefs.autoPlayAds !== false
            },
            ...(saved ? JSON.parse(saved) : {})
        };
    },

    /**
     * Save Settings
     */
    saveSettings: async function() {
        if (this.state.isSaving) return;
        
        this.state.isSaving = true;
        this.showLoading('Saving settings...');

        try {
            // Save to localStorage
            localStorage.setItem('zymore_settings', JSON.stringify(this.state.settings));

            // Save to Firebase
            const user = this.state.user;
            if (user) {
                const updates = {
                    preferences: {
                        darkMode: this.state.settings.theme === 'dark',
                        language: this.state.settings.language,
                        notifications: this.state.settings.notifications.push,
                        emailNotifications: this.state.settings.notifications.email,
                        socialNotifications: this.state.settings.notifications.social,
                        adNotifications: this.state.settings.notifications.ad,
                        profilePublic: this.state.settings.privacy.profilePublic,
                        showOnline: this.state.settings.privacy.showOnline,
                        enableAI: this.state.settings.ai.enabled,
                        autoSuggest: this.state.settings.ai.autoSuggest,
                        autoPlayAds: this.state.settings.ads.autoPlay
                    }
                };

                await databaseService.updateDocument('users', user.uid, updates);
                
                // Update store
                store.dispatch({
                    type: 'UPDATE_USER',
                    payload: { ...user, preferences: updates.preferences }
                });
            }

            this.state.dirty = false;
            showToast('Settings saved successfully!', 'success');
            analyticsService.trackEvent('settings', 'saved');

        } catch (error) {
            console.error('Error saving settings:', error);
            showToast('Failed to save settings: ' + error.message, 'error');
            analyticsService.trackEvent('settings', 'save_error', { error: error.message });
        } finally {
            this.state.isSaving = false;
            this.hideLoading();
        }
    },

    /**
     * Render UI
     */
    renderUI: function(container) {
        const s = this.state.settings;
        const user = this.state.user;

        const html = `
            <div class="settings-screen" data-screen="settings" role="main" aria-label="Settings">
                <!-- Header -->
                <header class="settings-header" role="banner">
                    <button class="back-btn" aria-label="Go back" data-action="back">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <h1 class="settings-title">Settings</h1>
                    <button class="save-btn" data-action="save" aria-label="Save settings" ${!this.state.dirty ? 'disabled' : ''}>
                        Save
                    </button>
                </header>

                <!-- Quick Stats -->
                <div class="settings-stats" role="status">
                    <div class="stat-item">
                        <span class="stat-icon">👤</span>
                        <span class="stat-value">${user?.displayName || 'User'}</span>
                        <span class="stat-label">Profile</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">🪙</span>
                        <span class="stat-value">${user?.coins || 0}</span>
                        <span class="stat-label">Coins</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">📦</span>
                        <span class="stat-value">${user?.totalProducts || 0}</span>
                        <span class="stat-label">Products</span>
                    </div>
                </div>

                <!-- Settings Content -->
                <div class="settings-content" role="tabpanel">
                    ${this.renderProfileSection(user)}
                    ${this.renderAppearanceSection(s)}
                    ${this.renderLanguageSection(s)}
                    ${this.renderNotificationSection(s)}
                    ${this.renderPrivacySection(s)}
                    ${this.renderAISection(s)}
                    ${this.renderAdSection(s)}
                    ${this.renderDataSection()}
                    ${this.renderAboutSection()}
                    ${this.renderDangerZone()}
                </div>

                <!-- Save Floating Button -->
                <div class="settings-floating-save ${this.state.dirty ? 'visible' : ''}">
                    <button class="btn-primary btn-lg" data-action="save">
                        💾 Save Changes
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    /**
     * Render Profile Section
     */
    renderProfileSection: function(user) {
        return `
            <section class="settings-section" aria-label="Profile Settings">
                <h2 class="section-title">👤 Profile</h2>
                <div class="settings-card profile-card">
                    <div class="profile-info">
                        <img src="${user?.photoURL || '/assets/images/default-avatar.png'}" 
                             alt="${user?.displayName || 'User'}" 
                             class="profile-avatar"
                             loading="lazy"
                             onerror="this.src='/assets/images/default-avatar.png'">
                        <div class="profile-details">
                            <h3 class="profile-name">${user?.displayName || 'Guest User'}</h3>
                            <p class="profile-email">${user?.email || 'No email'}</p>
                            <div class="profile-badges">
                                <span class="badge ${user?.isSeller ? 'badge-seller' : 'badge-user'}">
                                    ${user?.isSeller ? '🛒 Seller' : '👤 User'}
                                </span>
                                ${user?.isVerified ? '<span class="badge badge-verified">✅ Verified</span>' : ''}
                                ${user?.isAdmin ? '<span class="badge badge-admin">⚡ Admin</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="profile-actions">
                        <button class="btn-outline" data-action="edit-profile">
                            ✏️ Edit Profile
                        </button>
                        <button class="btn-outline" data-action="change-password">
                            🔑 Change Password
                        </button>
                        <button class="btn-outline-danger" data-action="logout">
                            🚪 Logout
                        </button>
                    </div>
                </div>
            </section>
        `;
    },

    /**
     * Render Appearance Section
     */
    renderAppearanceSection: function(s) {
        return `
            <section class="settings-section" aria-label="Appearance Settings">
                <h2 class="section-title">🎨 Appearance</h2>
                <div class="settings-card">
                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-icon">🌙</span>
                            <div>
                                <p class="setting-label">Dark Mode</p>
                                <p class="setting-desc">Switch to dark theme for comfortable viewing</p>
                            </div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" 
                                   id="dark-mode-toggle" 
                                   ${s.theme === 'dark' ? 'checked' : ''}
                                   data-setting="theme"
                                   aria-label="Toggle dark mode">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-icon">🎯</span>
                            <div>
                                <p class="setting-label">Accent Color</p>
                                <p class="setting-desc">Choose your preferred accent color</p>
                            </div>
                        </div>
                        <div class="color-picker" role="radiogroup" aria-label="Accent color picker">
                            ${['#6C63FF', '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8A5C', '#6C5B7B'].map(color => `
                                <button class="color-option ${color === '#6C63FF' ? 'active' : ''}" 
                                        data-color="${color}" 
                                        style="background:${color}"
                                        role="radio"
                                        aria-checked="${color === '#6C63FF' ? 'true' : 'false'}"
                                        aria-label="Color ${color}">
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-icon">🔍</span>
                            <div>
                                <p class="setting-label">Font Size</p>
                                <p class="setting-desc">Adjust text size for better readability</p>
                            </div>
                        </div>
                        <div class="font-size-control">
                            <button class="font-size-btn" data-action="font-decrease" aria-label="Decrease font size">A-</button>
                            <span class="font-size-display" id="font-size-display">100%</span>
                            <button class="font-size-btn" data-action="font-increase" aria-label="Increase font size">A+</button>
                        </div>
                    </div>
                </div>
            </section>
        `;
    },

    /**
     * Render Language Section
     */
    renderLanguageSection: function(s) {
        return `
            <section class="settings-section" aria-label="Language Settings">
                <h2 class="section-title">🌐 Language</h2>
                <div class="settings-card">
                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-icon">🗣️</span>
                            <div>
                                <p class="setting-label">App Language</p>
                                <p class="setting-desc">Select your preferred language</p>
                            </div>
                        </div>
                        <select class="language-select" id="language-select" data-setting="language" aria-label="Select language">
                            <option value="en" ${s.language === 'en' ? 'selected' : ''}>🇬🇧 English</option>
                            <option value="hi" ${s.language === 'hi' ? 'selected' : ''}>🇮🇳 हिंदी</option>
                            <option value="ur" ${s.language === 'ur' ? 'selected' : ''}>🇵🇰 اردو</option>
                            <option value="ar" ${s.language === 'ar' ? 'selected' : ''}>🇸🇦 العربية</option>
                            <option value="es" ${s.language === 'es' ? 'selected' : ''}>🇪🇸 Español</option>
                            <option value="fr" ${s.language === 'fr' ? 'selected' : ''}>🇫🇷 Français</option>
                        </select>
                    </div>
                </div>
            </section>
        `;
    },

    /**
     * Render Notification Section
     */
    renderNotificationSection: function(s) {
        return `
            <section class="settings-section" aria-label="Notification Settings">
                <h2 class="section-title">🔔 Notifications</h2>
                <div class="settings-card">
                    ${this.renderToggleItem('push', 'Push Notifications', 'Receive real-time push notifications', s.notifications.push)}
                    ${this.renderToggleItem('email', 'Email Notifications', 'Receive email updates about your account', s.notifications.email)}
                    ${this.renderToggleItem('social', 'Social Notifications', 'Get notified about likes, comments, and follows', s.notifications.social)}
                    ${this.renderToggleItem('ad', 'Ad Reward Notifications', 'Get notified when you earn rewards from ads', s.notifications.ad)}
                </div>
            </section>
        `;
    },

    /**
     * Render Privacy Section
     */
    renderPrivacySection: function(s) {
        return `
            <section class="settings-section" aria-label="Privacy Settings">
                <h2 class="section-title">🔒 Privacy</h2>
                <div class="settings-card">
                    ${this.renderToggleItem('profilePublic', 'Public Profile', 'Allow others to see your profile and products', s.privacy.profilePublic)}
                    ${this.renderToggleItem('showOnline', 'Show Online Status', 'Show when you are online to other users', s.privacy.showOnline)}
                    ${this.renderToggleItem('analytics', 'Anonymous Analytics', 'Help improve the app by sharing anonymous usage data', s.privacy.analytics)}
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-icon">🗑️</span>
                            <div>
                                <p class="setting-label">Clear All Data</p>
                                <p class="setting-desc">Clear all cached data and local storage</p>
                            </div>
                        </div>
                        <button class="btn-outline" data-action="clear-data">
                            Clear Data
                        </button>
                    </div>
                </div>
            </section>
        `;
    },

    /**
     * Render AI Section
     */
    renderAISection: function(s) {
        return `
            <section class="settings-section" aria-label="AI Assistant Settings">
                <h2 class="section-title">🤖 AI Assistant</h2>
                <div class="settings-card">
                    ${this.renderToggleItem('aiEnabled', 'Enable AI Assistant', 'Get AI-powered help and recommendations', s.ai.enabled)}
                    ${this.renderToggleItem('aiAutoSuggest', 'Auto Suggestions', 'AI will suggest products and content automatically', s.ai.autoSuggest)}
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-icon">📊</span>
                            <div>
                                <p class="setting-label">Free Questions Used</p>
                                <p class="setting-desc">${this.state.user?.aiQuestionsUsed || 0} of 5 used today</p>
                            </div>
                        </div>
                        <span class="badge ${(this.state.user?.aiQuestionsUsed || 0) >= 5 ? 'badge-danger' : 'badge-success'}">
                            ${(this.state.user?.aiQuestionsUsed || 0) >= 5 ? '🔴 Limit Reached' : `🟢 ${5 - (this.state.user?.aiQuestionsUsed || 0)} Remaining`}
                        </span>
                    </div>
                </div>
            </section>
        `;
    },

    /**
     * Render Ad Section
     */
    renderAdSection: function(s) {
        const adStats = store.getState().adStats || { today: 0 };
        
        return `
            <section class="settings-section" aria-label="Ad Settings">
                <h2 class="section-title">💰 Ad Settings</h2>
                <div class="settings-card">
                    ${this.renderToggleItem('autoPlayAds', 'Auto-play Ads', 'Automatically play ads for rewards', s.ads.autoPlay)}
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-icon">🪙</span>
                            <div>
                                <p class="setting-label">Coins Balance</p>
                                <p class="setting-desc">Watch ads to earn more coins</p>
                            </div>
                        </div>
                        <span class="coins-display">🪙 ${this.state.user?.coins || 0}</span>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-icon">📺</span>
                            <div>
                                <p class="setting-label">Ads Watched Today</p>
                                <p class="setting-desc">${adStats.today || 0} of 4 max</p>
                            </div>
                        </div>
                        <span class="badge ${(adStats.today || 0) >= 4 ? 'badge-danger' : 'badge-success'}">
                            ${(adStats.today || 0) >= 4 ? '🔴 Max Reached' : `🟢 ${4 - (adStats.today || 0)} Remaining`}
                        </span>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-icon">⏱️</span>
                            <div>
                                <p class="setting-label">Next Ad Available</p>
                                <p class="setting-desc" id="next-ad-timer">Loading...</p>
                            </div>
                        </div>
                        <button class="btn-primary watch-ad-btn" id="watch-ad-btn" disabled>
                            🎯 Watch Ad
                        </button>
                    </div>
                </div>
            </section>
        `;
    },

    /**
     * Render Data Section
     */
    renderDataSection: function() {
        return `
            <section class="settings-section" aria-label="Data Management">
                <h2 class="section-title">💾 Data Management</h2>
                <div class="settings-card">
                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-icon">📤</span>
                            <div>
                                <p class="setting-label">Export All Data</p>
                                <p class="setting-desc">Download your complete account data (JSON)</p>
                            </div>
                        </div>
                        <button class="btn-primary" data-action="export-data">
                            📥 Export
                        </button>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-icon">📥</span>
                            <div>
                                <p class="setting-label">Import Data</p>
                                <p class="setting-desc">Restore your data from a backup file</p>
                            </div>
                        </div>
                        <button class="btn-outline" data-action="import-data">
                            📤 Import
                        </button>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-icon">📊</span>
                            <div>
                                <p class="setting-label">Download History</p>
                                <p class="setting-desc">${store.getState().history?.length || 0} items in history</p>
                            </div>
                        </div>
                        <button class="btn-outline" data-action="clear-history">
                            🗑️ Clear
                        </button>
                    </div>
                </div>
            </section>
        `;
    },

    /**
     * Render About Section
     */
    renderAboutSection: function() {
        return `
            <section class="settings-section" aria-label="About">
                <h2 class="section-title">ℹ️ About</h2>
                <div class="settings-card about-card">
                    <div class="app-brand">
                        <span class="app-icon">🔷</span>
                        <div>
                            <h3 class="app-name">ZYMORE</h3>
                            <p class="app-version">Version 4.0.0</p>
                            <p class="app-desc">Hybrid Social Digital Marketplace</p>
                        </div>
                    </div>
                    <div class="app-links">
                        <a href="#" class="app-link" data-action="privacy">Privacy Policy</a>
                        <a href="#" class="app-link" data-action="terms">Terms of Service</a>
                        <a href="#" class="app-link" data-action="support">Contact Support</a>
                    </div>
                    <div class="app-stats">
                        <span>👥 ${this.state.user?.followers || 0} Followers</span>
                        <span>📦 ${this.state.user?.totalProducts || 0} Products</span>
                        <span>⬇️ ${this.state.user?.totalSales || 0} Downloads</span>
                    </div>
                </div>
            </section>
        `;
    },

    /**
     * Render Danger Zone
     */
    renderDangerZone: function() {
        return `
            <section class="settings-section danger-zone" aria-label="Danger Zone">
                <h2 class="section-title text-danger">⚠️ Danger Zone</h2>
                <div class="settings-card danger-card">
                    <div class="setting-item danger-item">
                        <div class="setting-info">
                            <span class="setting-icon text-danger">⚠️</span>
                            <div>
                                <p class="setting-label text-danger">Delete Account</p>
                                <p class="setting-desc">Permanently delete your account and all associated data</p>
                                <p class="warning-text">This action is irreversible and cannot be undone!</p>
                            </div>
                        </div>
                        <button class="btn-danger" data-action="delete-account">
                            🗑️ Delete Account
                        </button>
                    </div>
                </div>
            </section>
        `;
    },

    /**
     * Toggle Item Helper
     */
    renderToggleItem: function(id, label, desc, checked) {
        return `
            <div class="setting-item">
                <div class="setting-info">
                    <span class="setting-icon">${this.getIconForSetting(id)}</span>
                    <div>
                        <p class="setting-label">${label}</p>
                        <p class="setting-desc">${desc}</p>
                    </div>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" 
                           id="${id}-toggle" 
                           ${checked ? 'checked' : ''}
                           data-setting="${id}"
                           aria-label="${label}">
                    <span class="toggle-slider"></span>
                </label>
            </div>
        `;
    },

    /**
     * Get icon for setting
     */
    getIconForSetting: function(id) {
        const icons = {
            push: '🔔',
            email: '✉️',
            social: '👥',
            ad: '💰',
            profilePublic: '👤',
            showOnline: '🟢',
            analytics: '📊',
            aiEnabled: '🤖',
            aiAutoSuggest: '💡',
            autoPlayAds: '▶️'
        };
        return icons[id] || '⚙️';
    },

    /**
     * Bind Events
     */
    bindEvents: function(container) {
        // Back button
        const backBtn = container.querySelector('[data-action="back"]');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (this.state.dirty) {
                    this.confirmDiscardChanges();
                } else {
                    window.history.back();
                }
                analyticsService.trackEvent('settings', 'back_clicked');
            });
        }

        // Save button
        const saveBtn = container.querySelector('[data-action="save"]');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveSettings();
                analyticsService.trackEvent('settings', 'save_clicked');
            });
        }

        // Floating save button
        const floatingSave = container.querySelector('.settings-floating-save .btn-primary');
        if (floatingSave) {
            floatingSave.addEventListener('click', () => {
                this.saveSettings();
                analyticsService.trackEvent('settings', 'floating_save_clicked');
            });
        }

        // Edit Profile
        const editProfileBtn = container.querySelector('[data-action="edit-profile"]');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                this.showEditProfileModal();
                analyticsService.trackEvent('settings', 'edit_profile_clicked');
            });
        }

        // Change Password
        const changePasswordBtn = container.querySelector('[data-action="change-password"]');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                this.changePassword();
                analyticsService.trackEvent('settings', 'change_password_clicked');
            });
        }

        // Logout
        const logoutBtn = container.querySelector('[data-action="logout"]');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
                analyticsService.trackEvent('settings', 'logout_clicked');
            });
        }

        // Settings Changes
        const settingsInputs = container.querySelectorAll('[data-setting]');
        settingsInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const setting = e.target.dataset.setting;
                let value;
                
                if (e.target.type === 'checkbox') {
                    value = e.target.checked;
                } else if (e.target.type === 'select-one') {
                    value = e.target.value;
                } else {
                    value = e.target.value;
                }
                
                this.updateSetting(setting, value);
                analyticsService.trackEvent('settings', 'setting_changed', { setting, value });
            });
        });

        // Color picker
        const colorOptions = container.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                colorOptions.forEach(opt => {
                    opt.classList.remove('active');
                    opt.setAttribute('aria-checked', 'false');
                });
                option.classList.add('active');
                option.setAttribute('aria-checked', 'true');
                const color = option.dataset.color;
                document.documentElement.style.setProperty('--primary-color', color);
                this.updateSetting('accentColor', color);
                analyticsService.trackEvent('settings', 'color_changed', { color });
            });
        });

        // Font size controls
        const fontDecrease = container.querySelector('[data-action="font-decrease"]');
        const fontIncrease = container.querySelector('[data-action="font-increase"]');
        if (fontDecrease) {
            fontDecrease.addEventListener('click', () => {
                this.adjustFontSize(-10);
                analyticsService.trackEvent('settings', 'font_decrease');
            });
        }
        if (fontIncrease) {
            fontIncrease.addEventListener('click', () => {
                this.adjustFontSize(10);
                analyticsService.trackEvent('settings', 'font_increase');
            });
        }

        // Watch Ad
        const watchAdBtn = container.querySelector('#watch-ad-btn');
        if (watchAdBtn) {
            watchAdBtn.addEventListener('click', () => {
                this.watchRewardedAd();
                analyticsService.trackEvent('settings', 'watch_ad_clicked');
            });
        }

        // Clear Data
        const clearDataBtn = container.querySelector('[data-action="clear-data"]');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                this.clearAllData();
                analyticsService.trackEvent('settings', 'clear_data_clicked');
            });
        }

        // Export Data
        const exportBtn = container.querySelector('[data-action="export-data"]');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
                analyticsService.trackEvent('settings', 'export_data_clicked');
            });
        }

        // Import Data
        const importBtn = container.querySelector('[data-action="import-data"]');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.importData();
                analyticsService.trackEvent('settings', 'import_data_clicked');
            });
        }

        // Clear History
        const clearHistoryBtn = container.querySelector('[data-action="clear-history"]');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                this.clearHistory();
                analyticsService.trackEvent('settings', 'clear_history_clicked');
            });
        }

        // Delete Account
        const deleteAccountBtn = container.querySelector('[data-action="delete-account"]');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', () => {
                this.deleteAccount();
                analyticsService.trackEvent('settings', 'delete_account_clicked');
            });
        }

        // Privacy Policy
        const privacyLink = container.querySelector('[data-action="privacy"]');
        if (privacyLink) {
            privacyLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPrivacyPolicy();
                analyticsService.trackEvent('settings', 'privacy_policy_viewed');
            });
        }

        // Terms
        const termsLink = container.querySelector('[data-action="terms"]');
        if (termsLink) {
            termsLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showTermsOfService();
                analyticsService.trackEvent('settings', 'terms_viewed');
            });
        }

        // Support
        const supportLink = container.querySelector('[data-action="support"]');
        if (supportLink) {
            supportLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSupport();
                analyticsService.trackEvent('settings', 'support_clicked');
            });
        }

        // Update timer
        this.updateNextAdTimer(container);
    },

    /**
     * Update a setting
     */
    updateSetting: function(setting, value) {
        const s = this.state.settings;
        
        // Handle nested settings
        const parts = setting.split('.');
        if (parts.length > 1) {
            let current = s;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) current[parts[i]] = {};
                current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = value;
        } else {
            // Direct setting
            if (setting === 'theme') {
                s.theme = value ? 'dark' : 'light';
                themeManager.setTheme(s.theme);
            } else if (setting === 'language') {
                s.language = value;
            } else if (setting === 'accentColor') {
                // Handled separately
                return;
            } else {
                // Toggle settings - find in nested structure
                const found = this.findAndUpdateSetting(s, setting, value);
                if (!found) {
                    // Try direct
                    s[setting] = value;
                }
            }
        }

        this.state.dirty = true;
        this.updateUI();
    },

    /**
     * Find and update nested setting
     */
    findAndUpdateSetting: function(obj, key, value) {
        for (const [k, v] of Object.entries(obj)) {
            if (k === key) {
                obj[k] = value;
                return true;
            }
            if (v && typeof v === 'object') {
                if (this.findAndUpdateSetting(v, key, value)) {
                    return true;
                }
            }
        }
        return false;
    },

    /**
     * Update UI
     */
    updateUI: function() {
        const saveBtn = this.container.querySelector('[data-action="save"]');
        if (saveBtn) {
            saveBtn.disabled = !this.state.dirty;
        }

        const floatingSave = this.container.querySelector('.settings-floating-save');
        if (floatingSave) {
            floatingSave.classList.toggle('visible', this.state.dirty);
        }

        // Update stats if changed
        const statItems = this.container.querySelectorAll('.stat-item');
        if (statItems.length > 0) {
            const user = this.state.user;
            // Update coin display
            const coinStat = statItems[1];
            if (coinStat) {
                const value = coinStat.querySelector('.stat-value');
                if (value) value.textContent = user?.coins || 0;
            }
        }

        // Update AI section
        const aiSection = this.container.querySelector('.settings-section:has(.setting-icon:contains("🤖"))');
        if (aiSection) {
            const badge = aiSection.querySelector('.badge');
            if (badge) {
                const used = this.state.user?.aiQuestionsUsed || 0;
                badge.textContent = used >= 5 ? '🔴 Limit Reached' : `🟢 ${5 - used} Remaining`;
                badge.className = `badge ${used >= 5 ? 'badge-danger' : 'badge-success'}`;
            }
        }
    },

    /**
     * Show Edit Profile Modal
     */
    showEditProfileModal: function() {
        import('../widgets/modal.js').then(module => {
            const { Modal } = module;
            const user = this.state.user;

            const html = `
                <div class="edit-profile-modal">
                    <form id="edit-profile-form" class="edit-form">
                        <div class="form-group">
                            <label for="edit-display-name">Display Name</label>
                            <input type="text" id="edit-display-name" value="${user?.displayName || ''}" 
                                   placeholder="Your name" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-bio">Bio</label>
                            <textarea id="edit-bio" rows="3" placeholder="Tell us about yourself">${user?.bio || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="edit-location">Location</label>
                            <input type="text" id="edit-location" value="${user?.location || ''}" 
                                   placeholder="City, Country">
                        </div>
                        <div class="form-group">
                            <label for="edit-photo">Profile Photo</label>
                            <input type="file" id="edit-photo" accept="image/*">
                            <small>Max 5MB, JPG or PNG</small>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn-outline" data-action="modal-close">Cancel</button>
                            <button type="submit" class="btn-primary">Save Changes</button>
                        </div>
                    </form>
                </div>
            `;

            const modal = new Modal({
                title: '✏️ Edit Profile',
                content: html,
                size: 'md'
            });

            modal.open();

            // Handle form submit
            const form = document.getElementById('edit-profile-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.updateProfile(form);
                    modal.close();
                });
            }
        });
    },

    /**
     * Update Profile
     */
    updateProfile: async function(form) {
        try {
            const user = this.state.user;
            if (!user) return;

            const displayName = form.querySelector('#edit-display-name').value.trim();
            const bio = form.querySelector('#edit-bio').value.trim();
            const location = form.querySelector('#edit-location').value.trim();
            const photoFile = form.querySelector('#edit-photo').files[0];

            const updates = {};
            if (displayName) updates.displayName = displayName;
            if (bio) updates.bio = bio;
            if (location) updates.location = location;

            // Upload photo if provided
            if (photoFile) {
                if (photoFile.size > 5 * 1024 * 1024) {
                    showToast('Photo must be less than 5MB', 'error');
                    return;
                }
                
                const { storageService } = await import('../services/storage-service.js');
                const photoURL = await storageService.uploadProfilePhoto(photoFile, user.uid);
                updates.photoURL = photoURL;
            }

            // Update Firebase
            await databaseService.updateDocument('users', user.uid, updates);

            // Update store
            store.dispatch({
                type: 'UPDATE_USER',
                payload: { ...user, ...updates }
            });

            // Update local state
            this.state.user = { ...user, ...updates };

            showToast('Profile updated successfully!', 'success');
            analyticsService.trackEvent('profile', 'updated');

            // Refresh UI
            this.renderUI(this.container);
            this.bindEvents(this.container);

        } catch (error) {
            console.error('Error updating profile:', error);
            showToast('Failed to update profile: ' + error.message, 'error');
            analyticsService.trackEvent('profile', 'update_error', { error: error.message });
        }
    },

    /**
     * Change Password
     */
    changePassword: function() {
        import('../widgets/modal.js').then(module => {
            const { Modal } = module;

            const html = `
                <div class="change-password-modal">
                    <form id="change-password-form">
                        <div class="form-group">
                            <label for="current-password">Current Password</label>
                            <input type="password" id="current-password" required>
                        </div>
                        <div class="form-group">
                            <label for="new-password">New Password</label>
                            <input type="password" id="new-password" required minlength="8">
                            <small>Minimum 8 characters</small>
                        </div>
                        <div class="form-group">
                            <label for="confirm-password">Confirm New Password</label>
                            <input type="password" id="confirm-password" required>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn-outline" data-action="modal-close">Cancel</button>
                            <button type="submit" class="btn-primary">Update Password</button>
                        </div>
                    </form>
                </div>
            `;

            const modal = new Modal({
                title: '🔑 Change Password',
                content: html,
                size: 'sm'
            });

            modal.open();

            const form = document.getElementById('change-password-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const current = document.getElementById('current-password').value;
                    const newPwd = document.getElementById('new-password').value;
                    const confirm = document.getElementById('confirm-password').value;

                    if (!current || !newPwd || !confirm) {
                        showToast('Please fill all fields', 'warning');
                        return;
                    }

                    if (newPwd.length < 8) {
                        showToast('Password must be at least 8 characters', 'warning');
                        return;
                    }

                    if (newPwd !== confirm) {
                        showToast('Passwords do not match', 'warning');
                        return;
                    }

                    try {
                        const result = await authService.changePassword(current, newPwd);
                        if (result.success) {
                            showToast('Password updated successfully!', 'success');
                            analyticsService.trackEvent('auth', 'password_changed');
                            modal.close();
                        } else {
                            showToast(result.message || 'Failed to update password', 'error');
                        }
                    } catch (error) {
                        showToast('Failed to update password: ' + error.message, 'error');
                        analyticsService.trackEvent('auth', 'password_change_error', { error: error.message });
                    }
                });
            }
        });
    },

    /**
     * Handle Logout
     */
    handleLogout: function() {
        import('../widgets/modal.js').then(module => {
            const { Modal } = module;

            Modal.confirm(
                'Are you sure you want to logout?',
                {
                    title: 'Logout',
                    confirmLabel: 'Logout',
                    cancelLabel: 'Cancel',
                    confirmClass: 'btn-danger'
                }
            ).then(async (confirmed) => {
                if (!confirmed) return;

                try {
                    await authService.logout();
                    showToast('Logged out successfully', 'success');
                    analyticsService.trackEvent('auth', 'logout');
                    
                    store.dispatch({ type: 'CLEAR_USER' });
                    window.location.hash = '/auth';
                } catch (error) {
                    showToast('Error logging out: ' + error.message, 'error');
                    analyticsService.trackEvent('auth', 'logout_error', { error: error.message });
                }
            });
        });
    },

    /**
     * Confirm Discard Changes
     */
    confirmDiscardChanges: function() {
        import('../widgets/modal.js').then(module => {
            const { Modal } = module;

            Modal.confirm(
                'You have unsaved changes. Are you sure you want to discard them?',
                {
                    title: 'Unsaved Changes',
                    confirmLabel: 'Discard',
                    cancelLabel: 'Keep Editing',
                    confirmClass: 'btn-danger'
                }
            ).then((confirmed) => {
                if (confirmed) {
                    this.state.dirty = false;
                    window.history.back();
                }
            });
        });
    },

    /**
     * Watch Rewarded Ad
     */
    watchRewardedAd: function() {
        const { adService } = require('../services/ad-service.js');
        
        adService.showRewardedAd({
            onReward: (reward) => {
                const user = this.state.user;
                if (user) {
                    user.coins = (user.coins || 0) + reward.coins;
                    store.dispatch({
                        type: 'UPDATE_USER',
                        payload: user
                    });
                    this.state.user = user;
                    showToast(`🎉 Earned ${reward.coins} coins!`, 'success');
                    analyticsService.trackEvent('ad', 'rewarded_completed', { coins: reward.coins });
                    
                    // Update UI
                    this.updateUI();
                }
            },
            onError: (error) => {
                showToast('Ad not available. Try again later.', 'warning');
                analyticsService.trackEvent('ad', 'rewarded_error', { error: error.message });
            }
        });
    },

    /**
     * Update next ad timer
     */
    updateNextAdTimer: function(container) {
        const timerEl = container.querySelector('#next-ad-timer');
        const watchBtn = container.querySelector('#watch-ad-btn');
        
        if (!timerEl || !watchBtn) return;

        const { adService } = require('../services/ad-service.js');
        const nextAvailable = adService.getNextAdTime();
        
        if (nextAvailable <= 0) {
            timerEl.textContent = 'Available now! 🎯';
            watchBtn.disabled = false;
            watchBtn.classList.add('btn-primary');
            watchBtn.classList.remove('btn-secondary');
        } else {
            timerEl.textContent = this.formatTime(nextAvailable);
            watchBtn.disabled = true;
            watchBtn.classList.add('btn-secondary');
            watchBtn.classList.remove('btn-primary');
            
            // Update timer every second
            const interval = setInterval(() => {
                if (!this.container || !this.container.contains(timerEl)) {
                    clearInterval(interval);
                    return;
                }
                const remaining = adService.getNextAdTime();
                if (remaining <= 0) {
                    clearInterval(interval);
                    timerEl.textContent = 'Available now! 🎯';
                    watchBtn.disabled = false;
                    watchBtn.classList.add('btn-primary');
                    watchBtn.classList.remove('btn-secondary');
                } else {
                    timerEl.textContent = this.formatTime(remaining);
                }
            }, 1000);
        }
    },

    /**
     * Format time
     */
    formatTime: function(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    },

    /**
     * Clear all data
     */
    clearAllData: function() {
        import('../widgets/modal.js').then(module => {
            const { Modal } = module;

            Modal.confirm(
                'This will clear all cached data, local storage, and session data. Continue?',
                {
                    title: 'Clear All Data',
                    confirmLabel: 'Clear All',
                    cancelLabel: 'Cancel',
                    confirmClass: 'btn-danger'
                }
            ).then(async (confirmed) => {
                if (!confirmed) return;

                try {
                    // Clear localStorage
                    localStorage.clear();
                    
                    // Clear sessionStorage
                    sessionStorage.clear();
                    
                    // Clear IndexedDB
                    const dbs = await indexedDB.databases?.() || [];
                    for (const db of dbs) {
                        indexedDB.deleteDatabase(db.name);
                    }
                    
                    // Clear service worker cache
                    if ('caches' in window) {
                        const cacheNames = await caches.keys();
                        for (const name of cacheNames) {
                            await caches.delete(name);
                        }
                    }
                    
                    showToast('All data cleared successfully!', 'success');
                    analyticsService.trackEvent('settings', 'all_data_cleared');
                    
                    // Reload app
                    location.reload();
                } catch (error) {
                    showToast('Error clearing data: ' + error.message, 'error');
                    analyticsService.trackEvent('settings', 'clear_data_error', { error: error.message });
                }
            });
        });
    },

    /**
     * Export data
     */
    exportData: function() {
        try {
            const user = this.state.user;
            const history = store.getState().history || [];
            const likedProducts = store.getState().likedProducts || [];
            
            const data = {
                user: {
                    uid: user?.uid,
                    displayName: user?.displayName,
                    email: user?.email,
                    bio: user?.bio,
                    location: user?.location,
                    isSeller: user?.isSeller,
                    coins: user?.coins,
                    interests: user?.interests
                },
                history: history,
                likedProducts: likedProducts,
                settings: this.state.settings,
                exportedAt: new Date().toISOString(),
                appVersion: '4.0.0'
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `zymore-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showToast('Data exported successfully!', 'success');
            analyticsService.trackEvent('settings', 'data_exported');
        } catch (error) {
            showToast('Error exporting data: ' + error.message, 'error');
            analyticsService.trackEvent('settings', 'export_error', { error: error.message });
        }
    },

    /**
     * Import data
     */
    importData: function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const data = JSON.parse(text);

                // Validate data
                if (!data.user || !data.exportedAt) {
                    showToast('Invalid data file', 'error');
                    return;
                }

                // Confirm import
                const { Modal } = await import('../widgets/modal.js');
                const confirmed = await Modal.confirm(
                    `This will import data from ${data.exportedAt}. Continue?`,
                    {
                        title: 'Import Data',
                        confirmLabel: 'Import',
                        cancelLabel: 'Cancel'
                    }
                );

                if (!confirmed) return;

                // Import settings
                if (data.settings) {
                    this.state.settings = { ...this.state.settings, ...data.settings };
                    localStorage.setItem('zymore_settings', JSON.stringify(this.state.settings));
                }

                // Import history
                if (data.history) {
                    store.dispatch({
                        type: 'SET_HISTORY',
                        payload: data.history
                    });
                }

                // Import liked products
                if (data.likedProducts) {
                    store.dispatch({
                        type: 'SET_LIKED_PRODUCTS',
                        payload: data.likedProducts
                    });
                }

                showToast('Data imported successfully!', 'success');
                analyticsService.trackEvent('settings', 'data_imported');

                // Refresh
                this.renderUI(this.container);
                this.bindEvents(this.container);

            } catch (error) {
                showToast('Error importing data: ' + error.message, 'error');
                analyticsService.trackEvent('settings', 'import_error', { error: error.message });
            }
        };
        input.click();
    },

    /**
     * Clear history
     */
    clearHistory: function() {
        import('../widgets/modal.js').then(module => {
            const { Modal } = module;

            Modal.confirm(
                'This will permanently delete all your download history. Continue?',
                {
                    title: 'Clear History',
                    confirmLabel: 'Clear All',
                    cancelLabel: 'Cancel',
                    confirmClass: 'btn-danger'
                }
            ).then(async (confirmed) => {
                if (!confirmed) return;

                try {
                    const user = this.state.user;
                    if (user) {
                        // Delete from Firebase
                        const history = store.getState().history || [];
                        for (const item of history) {
                            if (item.id) {
                                await databaseService.deleteDocument('history', item.id);
                            }
                        }
                    }

                    // Clear store
                    store.dispatch({
                        type: 'SET_HISTORY',
                        payload: []
                    });

                    showToast('History cleared successfully!', 'success');
                    analyticsService.trackEvent('settings', 'history_cleared');

                    // Update UI
                    this.updateUI();
                } catch (error) {
                    showToast('Error clearing history: ' + error.message, 'error');
                    analyticsService.trackEvent('settings', 'clear_history_error', { error: error.message });
                }
            });
        });
    },

    /**
     * Delete account
     */
    deleteAccount: function() {
        import('../widgets/modal.js').then(module => {
            const { Modal } = module;

            Modal.confirm(
                '⚠️ WARNING: This action is PERMANENT and CANNOT be undone.\n\n' +
                'All your data including:\n' +
                '• Profile and personal information\n' +
                '• Products and listings\n' +
                '• Download history\n' +
                '• Reviews and ratings\n' +
                '• Followers and following\n' +
                '• Coins and rewards\n\n' +
                'Will be DELETED FOREVER.\n\n' +
                'Type "DELETE" to confirm:',
                {
                    title: '🗑️ Delete Account',
                    confirmLabel: 'Delete Account',
                    cancelLabel: 'Cancel',
                    confirmClass: 'btn-danger',
                    requireInput: true,
                    inputPlaceholder: 'Type DELETE to confirm',
                    inputValidate: (value) => value === 'DELETE'
                }
            ).then(async (confirmed) => {
                if (!confirmed) return;

                try {
                    const result = await authService.deleteAccount();
                    if (result.success) {
                        showToast('Account deleted successfully', 'success');
                        analyticsService.trackEvent('settings', 'account_deleted');
                        
                        store.dispatch({ type: 'CLEAR_USER' });
                        window.location.hash = '/auth';
                    } else {
                        showToast(result.message || 'Failed to delete account', 'error');
                        analyticsService.trackEvent('settings', 'delete_account_error', { error: result.message });
                    }
                } catch (error) {
                    showToast('Failed to delete account: ' + error.message, 'error');
                    analyticsService.trackEvent('settings', 'delete_account_error', { error: error.message });
                }
            });
        });
    },

    /**
     * Show Privacy Policy
     */
    showPrivacyPolicy: function() {
        import('../widgets/modal.js').then(module => {
            const { Modal } = module;

            const modal = new Modal({
                title: '🔒 Privacy Policy',
                content: `
                    <div class="privacy-policy">
                        <h4>1. Information We Collect</h4>
                        <p>We collect information you provide directly, such as name, email, and content you upload.</p>
                        
                        <h4>2. How We Use Information</h4>
                        <p>We use your information to provide, improve, and personalize our services.</p>
                        
                        <h4>3. Data Security</h4>
                        <p>We use industry-standard encryption and security measures to protect your data.</p>
                        
                        <h4>4. Third-Party Sharing</h4>
                        <p>We do not sell your data to third parties. We share data only with service providers.</p>
                        
                        <h4>5. Your Rights</h4>
                        <p>You have the right to access, modify, or delete your data at any time.</p>
                        
                        <p><small>Last updated: July 2026</small></p>
                    </div>
                `,
                size: 'md'
            });
            modal.open();
        });
    },

    /**
     * Show Terms of Service
     */
    showTermsOfService: function() {
        import('../widgets/modal.js').then(module => {
            const { Modal } = module;

            const modal = new Modal({
                title: '📜 Terms of Service',
                content: `
                    <div class="terms-of-service">
                        <h4>1. Acceptance of Terms</h4>
                        <p>By using ZYMORE, you agree to these terms of service.</p>
                        
                        <h4>2. User Content</h4>
                        <p>You retain ownership of your content, but grant us license to display it.</p>
                        
                        <h4>3. Conduct</h4>
                        <p>You agree not to post harmful, illegal, or inappropriate content.</p>
                        
                        <h4>4. Intellectual Property</h4>
                        <p>All content and features are protected by intellectual property laws.</p>
                        
                        <h4>5. Termination</h4>
                        <p>We reserve the right to terminate accounts that violate these terms.</p>
                        
                        <p><small>Last updated: July 2026</small></p>
                    </div>
                `,
                size: 'md'
            });
            modal.open();
        });
    },

    /**
     * Show Support
     */
    showSupport: function() {
        import('../widgets/modal.js').then(module => {
            const { Modal } = module;

            const modal = new Modal({
                title: '📧 Contact Support',
                content: `
                    <div class="support-content">
                        <p>Need help? We're here for you!</p>
                        
                        <div class="support-options">
                            <div class="support-option">
                                <span class="support-icon">💬</span>
                                <div>
                                    <h4>Live Chat</h4>
                                    <p>Chat with our support team</p>
                                    <button class="btn-primary" data-action="start-chat">Start Chat</button>
                                </div>
                            </div>
                            <div class="support-option">
                                <span class="support-icon">✉️</span>
                                <div>
                                    <h4>Email</h4>
                                    <p>support@zymore.com</p>
                                    <button class="btn-outline" data-action="send-email">Send Email</button>
                                </div>
                            </div>
                            <div class="support-option">
                                <span class="support-icon">📚</span>
                                <div>
                                    <h4>Help Center</h4>
                                    <p>Browse our knowledge base</p>
                                    <button class="btn-outline" data-action="help-center">Visit Help Center</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                size: 'lg'
            });
            modal.open();

            // Handle actions
            const startChat = document.querySelector('[data-action="start-chat"]');
            if (startChat) {
                startChat.addEventListener('click', () => {
                    showToast('Chat feature coming soon!', 'info');
                });
            }

            const sendEmail = document.querySelector('[data-action="send-email"]');
            if (sendEmail) {
                sendEmail.addEventListener('click', () => {
                    window.location.href = 'mailto:support@zymore.com';
                });
            }

            const helpCenter = document.querySelector('[data-action="help-center"]');
            if (helpCenter) {
                helpCenter.addEventListener('click', () => {
                    showToast('Help center coming soon!', 'info');
                });
            }
        });
    },

    /**
     * Adjust font size
     */
    adjustFontSize: function(delta) {
        const display = document.getElementById('font-size-display');
        if (!display) return;

        let current = parseInt(display.textContent);
        if (isNaN(current)) current = 100;
        current = Math.max(80, Math.min(150, current + delta));
        display.textContent = `${current}%`;

        // Apply to root
        document.documentElement.style.fontSize = `${current}%`;
        localStorage.setItem('font_size', current.toString());

        showToast(`Font size: ${current}%`, 'info');
    },

    /**
     * Show loading
     */
    showLoading: function(message = 'Loading...') {
        const existing = this.container.querySelector('.settings-loading-overlay');
        if (existing) return;

        const overlay = document.createElement('div');
        overlay.className = 'settings-loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner"></div>
            <p>${message}</p>
        `;
        Object.assign(overlay.style, {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            color: '#ffffff'
        });
        document.body.appendChild(overlay);
    },

    /**
     * Hide loading
     */
    hideLoading: function() {
        const overlay = document.querySelector('.settings-loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    },

    /**
     * Destroy screen
     */
    destroy: function() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
};

// Export default
export default SettingsScreen;