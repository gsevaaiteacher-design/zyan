// ============================================================
// FILE: js/services/auth-service.js
// PURPOSE: Complete Authentication System with All Updates
// DEPENDENCY: firebase-config.js, user-model.js, error-handler.js
// USED BY: auth-screen.js, app.js, store.js, all screens
// VERSION: 3.0.0
// ============================================================

import { auth, db, googleProvider, facebookProvider, githubProvider, phoneProvider } from '../config/firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    updateProfile,
    updateEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    GoogleAuthProvider,
    FacebookAuthProvider,
    GithubAuthProvider,
    PhoneAuthProvider,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    linkWithPopup,
    linkWithRedirect,
    unlink,
    fetchSignInMethodsForEmail,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    inMemoryPersistence,
    onAuthStateChanged,
    getIdToken,
    getIdTokenResult,
    getMultiFactorResolver,
    PhoneMultiFactorGenerator,
    reauthenticateWithPopup,
    reauthenticateWithRedirect,
    deleteUser
} from 'firebase/auth';
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc,
    serverTimestamp,
    query,
    where,
    getDocs,
    collection,
    runTransaction
} from 'firebase/firestore';
import { errorHandler, authError, networkError, validationError } from './error-handler.js';
import { logger } from './logger.js';
import { UserModel, createUserFromFirebase, userToFirestore } from '../models/user-model.js';

// ============================================================
// AUTH CONFIGURATION
// ============================================================

const AUTH_CONFIG = {
    // Persistence type: 'local', 'session', 'none'
    persistence: 'local',
    
    // Auto-refresh token interval (ms)
    tokenRefreshInterval: 10 * 60 * 1000, // 10 minutes
    
    // Session timeout (ms) - 30 days for local, 1 day for session
    sessionTimeout: {
        local: 30 * 24 * 60 * 60 * 1000, // 30 days
        session: 24 * 60 * 60 * 1000,     // 1 day
        none: 0
    },
    
    // Max login attempts before rate limiting
    maxLoginAttempts: 5,
    
    // Lockout duration (ms)
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    
    // Require email verification
    requireEmailVerification: false,
    
    // Allowed providers
    providers: {
        email: true,
        google: true,
        facebook: true,
        github: true,
        phone: false
    },
    
    // Custom claims for admin/seller
    customClaims: {
        admin: 'isAdmin',
        seller: 'isSeller'
    }
};

// ─── AUTH STATE ─────────────────────────────────────────────

let currentUser = null;
let currentUserData = null;
let authStateListeners = [];
let tokenRefreshTimer = null;
let authInitialized = false;
let loginAttempts = 0;
let lockoutTimer = null;
let isLockedOut = false;

// ─── MAIN AUTH SERVICE ──────────────────────────────────────

class AuthService {
    constructor() {
        this._initialized = false;
        this._authStateReady = false;
        this._pendingCredentials = null;
        this._multiFactorResolver = null;
        this._verificationId = null;
    }

    /**
     * Initialize auth service
     */
    async init() {
        if (this._initialized) return;

        try {
            // Set persistence
            await this._setPersistence();
            
            // Setup auth state listener
            this._setupAuthListener();
            
            // Setup token refresh
            this._setupTokenRefresh();
            
            this._initialized = true;
            authInitialized = true;
            
            logger.info('🔐 Auth Service initialized', {
                persistence: AUTH_CONFIG.persistence,
                requireEmailVerification: AUTH_CONFIG.requireEmailVerification
            });
        } catch (error) {
            logger.error('❌ Auth Service initialization failed', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'AUTH',
                context: { action: 'init' }
            });
        }
    }

    /**
     * Set persistence
     */
    async _setPersistence() {
        let persistenceType;
        switch (AUTH_CONFIG.persistence) {
            case 'local':
                persistenceType = browserLocalPersistence;
                break;
            case 'session':
                persistenceType = browserSessionPersistence;
                break;
            case 'none':
                persistenceType = inMemoryPersistence;
                break;
            default:
                persistenceType = browserLocalPersistence;
        }
        await setPersistence(auth, persistenceType);
    }

    /**
     * Setup auth state listener
     */
    _setupAuthListener() {
        onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    // User is signed in
                    await this._handleUserSignedIn(user);
                } else {
                    // User is signed out
                    await this._handleUserSignedOut();
                }
                
                // Notify listeners
                this._notifyListeners();
                
                this._authStateReady = true;
            } catch (error) {
                logger.error('❌ Auth state change error', { error: error.message });
                this._handleAuthError(error);
            }
        });
    }

    /**
     * Handle user signed in
     */
    async _handleUserSignedIn(user) {
        try {
            // Get fresh token
            const token = await this.getToken();
            
            // Get user data from Firestore
            const userData = await this._getUserData(user.uid);
            
            if (userData) {
                // Merge Firebase user with Firestore data
                currentUser = {
                    ...user,
                    ...userData,
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || userData.displayName,
                    photoURL: user.photoURL || userData.photoURL
                };
                currentUserData = userData;
            } else {
                // Create user document if doesn't exist
                currentUser = user;
                currentUserData = await this._createUserDocument(user);
            }
            
            // Update last login
            await this.updateUser({ lastLogin: new Date().toISOString() });
            
            // Store in session
            this._storeSession(currentUser);
            
            logger.auth('User signed in', user.uid, {
                email: user.email,
                displayName: user.displayName,
                isSeller: currentUserData?.isSeller || false,
                isAdmin: currentUserData?.isAdmin || false
            });
            
        } catch (error) {
            logger.error('❌ Error handling user sign in', { error: error.message });
            throw error;
        }
    }

    /**
     * Handle user signed out
     */
    async _handleUserSignedOut() {
        currentUser = null;
        currentUserData = null;
        this._clearSession();
        logger.auth('User signed out', 'anonymous');
    }

    /**
     * Get user data from Firestore
     */
    async _getUserData(uid) {
        try {
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data();
            }
            return null;
        } catch (error) {
            logger.error('Error getting user data', { error: error.message });
            return null;
        }
    }

    /**
     * Create user document
     */
    async _createUserDocument(user) {
        try {
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || 'User',
                photoURL: user.photoURL || '',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                isSeller: false,
                isAdmin: false,
                isVerified: user.emailVerified || false,
                isBlocked: false,
                followers: 0,
                following: 0,
                totalPosts: 0,
                totalProducts: 0,
                totalSales: 0,
                coins: 0,
                freeDownloadsUsed: 0,
                aiQuestionsUsed: 0,
                lastAdWatch: null,
                interests: [],
                preferences: {
                    darkMode: false,
                    language: 'en',
                    notifications: true
                },
                socialLinks: {},
                bio: '',
                location: '',
                sellerProfile: {
                    bio: '',
                    socialLinks: {},
                    totalListings: 0,
                    totalSales: 0,
                    joinedDate: new Date().toISOString()
                }
            };

            await setDoc(doc(db, 'users', user.uid), userData);
            
            logger.info('📝 User document created', { uid: user.uid, email: user.email });
            
            return userData;
        } catch (error) {
            logger.error('Error creating user document', { error: error.message });
            throw error;
        }
    }

    /**
     * Setup token refresh
     */
    _setupTokenRefresh() {
        if (tokenRefreshTimer) {
            clearInterval(tokenRefreshTimer);
        }
        tokenRefreshTimer = setInterval(async () => {
            if (currentUser) {
                try {
                    await this.getToken(true);
                    logger.debug('🔄 Token refreshed');
                } catch (error) {
                    logger.error('❌ Token refresh failed', { error: error.message });
                }
            }
        }, AUTH_CONFIG.tokenRefreshInterval);
    }

    /**
     * Store session data
     */
    _storeSession(user) {
        try {
            const sessionData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                timestamp: Date.now()
            };
            sessionStorage.setItem('zymore_auth', JSON.stringify(sessionData));
        } catch (error) {
            // Silent fail
        }
    }

    /**
     * Clear session data
     */
    _clearSession() {
        try {
            sessionStorage.removeItem('zymore_auth');
        } catch (error) {
            // Silent fail
        }
    }

    /**
     * Notify auth state listeners
     */
    _notifyListeners() {
        for (const listener of authStateListeners) {
            try {
                listener(currentUser, currentUserData);
            } catch (error) {
                logger.error('Error in auth listener', { error: error.message });
            }
        }
    }

    /**
     * Handle auth errors
     */
    _handleAuthError(error) {
        const code = error.code || '';
        
        if (code.includes('too-many-requests')) {
            this._handleRateLimit();
        }
        
        if (code.includes('network')) {
            logger.warn('Network error in auth', { error: error.message });
        }
    }

    /**
     * Handle rate limiting
     */
    _handleRateLimit() {
        loginAttempts++;
        if (loginAttempts >= AUTH_CONFIG.maxLoginAttempts) {
            isLockedOut = true;
            if (lockoutTimer) clearTimeout(lockoutTimer);
            lockoutTimer = setTimeout(() => {
                isLockedOut = false;
                loginAttempts = 0;
                logger.info('🔓 Auth lockout expired');
            }, AUTH_CONFIG.lockoutDuration);
            logger.warn('🔒 Auth rate limit exceeded', {
                attempts: loginAttempts,
                lockoutDuration: AUTH_CONFIG.lockoutDuration
            });
        }
    }

    // ─── PUBLIC AUTH METHODS ────────────────────────────────

    /**
     * Sign in with email and password
     */
    async signInWithEmail(email, password, rememberMe = true) {
        try {
            // Check lockout
            if (isLockedOut) {
                throw authError('Too many login attempts. Please wait before trying again.', {
                    context: { lockoutDuration: AUTH_CONFIG.lockoutDuration }
                });
            }

            // Validate inputs
            if (!email || !password) {
                throw validationError('email', 'Email and password are required');
            }

            // Set persistence
            await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

            // Sign in
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            // Reset login attempts
            loginAttempts = 0;
            
            logger.auth('Email sign in successful', userCredential.user.uid);
            
            return {
                user: userCredential.user,
                userData: currentUserData
            };
        } catch (error) {
            logger.error('Email sign in failed', { error: error.message });
            this._handleAuthError(error);
            throw errorHandler.handle(error, {
                type: 'AUTH',
                context: { email, method: 'email' }
            });
        }
    }

    /**
     * Sign up with email and password
     */
    async signUpWithEmail(email, password, displayName = '', options = {}) {
        try {
            // Validate
            if (!email || !password) {
                throw validationError('email', 'Email and password are required');
            }
            if (password.length < 6) {
                throw validationError('password', 'Password must be at least 6 characters');
            }

            // Create user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update profile
            if (displayName) {
                await updateProfile(user, { displayName });
            }

            // Create user document
            const userData = await this._createUserDocument({
                ...user,
                displayName: displayName || email.split('@')[0]
            });

            // Send verification email if required
            if (AUTH_CONFIG.requireEmailVerification) {
                await this.sendVerificationEmail();
            }

            logger.auth('Email sign up successful', user.uid, {
                email,
                displayName: displayName || email.split('@')[0]
            });

            return {
                user,
                userData
            };
        } catch (error) {
            logger.error('Email sign up failed', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'AUTH',
                context: { email, method: 'signup' }
            });
        }
    }

    /**
     * Sign in with Google
     */
    async signInWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            // Check if user document exists, create if not
            const userData = await this._getUserData(user.uid);
            if (!userData) {
                await this._createUserDocument(user);
            }
            
            logger.auth('Google sign in successful', user.uid);
            
            return {
                user,
                userData: currentUserData
            };
        } catch (error) {
            logger.error('Google sign in failed', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'AUTH',
                context: { provider: 'google' }
            });
        }
    }

    /**
     * Sign in with Facebook
     */
    async signInWithFacebook() {
        try {
            if (!AUTH_CONFIG.providers.facebook) {
                throw authError('Facebook sign in is disabled');
            }
            
            const result = await signInWithPopup(auth, facebookProvider);
            const user = result.user;
            
            const userData = await this._getUserData(user.uid);
            if (!userData) {
                await this._createUserDocument(user);
            }
            
            logger.auth('Facebook sign in successful', user.uid);
            
            return {
                user,
                userData: currentUserData
            };
        } catch (error) {
            logger.error('Facebook sign in failed', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'AUTH',
                context: { provider: 'facebook' }
            });
        }
    }

    /**
     * Sign in with GitHub
     */
    async signInWithGithub() {
        try {
            if (!AUTH_CONFIG.providers.github) {
                throw authError('GitHub sign in is disabled');
            }
            
            const result = await signInWithPopup(auth, githubProvider);
            const user = result.user;
            
            const userData = await this._getUserData(user.uid);
            if (!userData) {
                await this._createUserDocument(user);
            }
            
            logger.auth('GitHub sign in successful', user.uid);
            
            return {
                user,
                userData: currentUserData
            };
        } catch (error) {
            logger.error('GitHub sign in failed', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'AUTH',
                context: { provider: 'github' }
            });
        }
    }

    /**
     * Sign in with Phone (SMS)
     */
    async signInWithPhone(phoneNumber, recaptchaContainer) {
        try {
            if (!AUTH_CONFIG.providers.phone) {
                throw authError('Phone sign in is disabled');
            }

            // Setup recaptcha
            const recaptcha = new RecaptchaVerifier(auth, recaptchaContainer, {
                size: 'normal',
                callback: () => {
                    logger.debug('✅ reCAPTCHA verified');
                }
            });

            // Send verification code
            const verificationId = await signInWithPhoneNumber(auth, phoneNumber, recaptcha);
            this._verificationId = verificationId;
            
            logger.info('📱 Phone verification code sent', { phoneNumber });
            
            return { verificationId };
        } catch (error) {
            logger.error('Phone sign in failed', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'AUTH',
                context: { provider: 'phone' }
            });
        }
    }

    /**
     * Verify phone code
     */
    async verifyPhoneCode(code) {
        try {
            if (!this._verificationId) {
                throw authError('No verification in progress');
            }

            const credential = PhoneAuthProvider.credential(this._verificationId, code);
            const result = await signInWithCredential(auth, credential);
            
            const userData = await this._getUserData(result.user.uid);
            if (!userData) {
                await this._createUserDocument(result.user);
            }
            
            logger.auth('Phone verification successful', result.user.uid);
            
            return {
                user: result.user,
                userData: currentUserData
            };
        } catch (error) {
            logger.error('Phone verification failed', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'AUTH',
                context: { method: 'phone_verify' }
            });
        }
    }

    /**
     * Sign out
     */
    async signOut() {
        try {
            await signOut(auth);
            currentUser = null;
            currentUserData = null;
            this._clearSession();
            
            logger.auth('Sign out successful', 'anonymous');
            
            return true;
        } catch (error) {
            logger.error('Sign out failed', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'AUTH',
                context: { action: 'signout' }
            });
        }
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return currentUser;
    }

    /**
     * Get current user data
     */
    getCurrentUserData() {
        return currentUserData;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!currentUser;
    }

    /**
     * Check if user is admin
     */
    isAdmin() {
        return currentUserData?.isAdmin || false;
    }

    /**
     * Check if user is seller
     */
    isSeller() {
        return currentUserData?.isSeller || false;
    }

    /**
     * Check if user is verified
     */
    isVerified() {
        return currentUser?.emailVerified || currentUserData?.isVerified || false;
    }

    /**
     * Get user token
     */
    async getToken(forceRefresh = false) {
        if (!currentUser) {
            throw authError('No user logged in');
        }
        try {
            return await getIdToken(currentUser, forceRefresh);
        } catch (error) {
            logger.error('Failed to get token', { error: error.message });
            throw error;
        }
    }

    /**
     * Get token claims
     */
    async getTokenClaims() {
        if (!currentUser) {
            throw authError('No user logged in');
        }
        try {
            const result = await getIdTokenResult(currentUser);
            return result.claims;
        } catch (error) {
            logger.error('Failed to get token claims', { error: error.message });
            throw error;
        }
    }

    /**
     * Send verification email
     */
    async sendVerificationEmail() {
        if (!currentUser) {
            throw authError('No user logged in');
        }
        try {
            await sendEmailVerification(currentUser);
            logger.info('📧 Verification email sent', { email: currentUser.email });
            return true;
        } catch (error) {
            logger.error('Failed to send verification email', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'AUTH',
                context: { action: 'send_verification' }
            });
        }
    }

    /**
     * Send password reset email
     */
    async sendPasswordReset(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            logger.info('📧 Password reset email sent', { email });
            return true;
        } catch (error) {
            logger.error('Failed to send password reset', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'AUTH',
                context: { email, action: 'reset_password' }
            });
        }
    }

    /**
     * Update user profile
     */
    async updateUser(data) {
        if (!currentUser) {
            throw authError('No user logged in');
        }

        try {
            // Update Firestore
            const updates = { ...data };
            delete updates.uid;
            delete updates.email;
            delete updates.createdAt;

            await updateDoc(doc(db, 'users', currentUser.uid), {
                ...updates,
                updatedAt: new Date().toISOString()
            });

            // Update local data
            if (currentUserData) {
                currentUserData = { ...currentUserData, ...updates };
            }

            logger.info('👤 User profile updated', { uid: currentUser.uid });
            return currentUserData;
        } catch (error) {
            logger.error('Failed to update user profile', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'AUTH',
                context: { action: 'update_user' }
            });
        }
    }

    /**
     * Update display name
     */
    async updateDisplayName(displayName) {
        if (!currentUser) {
            throw authError('No user logged in');
        }

        try {
            await updateProfile(currentUser, { displayName });
            await this.updateUser({ displayName });
            
            logger.info('👤 Display name updated', { displayName });
            return true;
        } catch (error) {
            logger.error('Failed to update display name', { error: error.message });
            throw error;
        }
    }

    /**
     * Update email
     */
    async updateEmail(newEmail) {
        if (!currentUser) {
            throw authError('No user logged in');
        }

        try {
            // Re-authenticate if needed
            await updateEmail(currentUser, newEmail);
            
            // Update Firestore
            await this.updateUser({ email: newEmail });
            
            logger.info('📧 Email updated', { newEmail });
            return true;
        } catch (error) {
            logger.error('Failed to update email', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'AUTH',
                context: { action: 'update_email' }
            });
        }
    }

    /**
     * Update password
     */
    async updatePassword(newPassword) {
        if (!currentUser) {
            throw authError('No user logged in');
        }

        try {
            await updatePassword(currentUser, newPassword);
            logger.info('🔑 Password updated');
            return true;
        } catch (error) {
            logger.error('Failed to update password', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'AUTH',
                context: { action: 'update_password' }
            });
        }
    }

    /**
     * Re-authenticate user
     */
    async reauthenticate(password) {
        if (!currentUser || !currentUser.email) {
            throw authError('No user logged in or no email');
        }

        try {
            const credential = EmailAuthProvider.credential(currentUser.email, password);
            await reauthenticateWithCredential(currentUser, credential);
            logger.debug('🔐 Re-authentication successful');
            return true;
        } catch (error) {
            logger.error('Re-authentication failed', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'AUTH',
                context: { action: 'reauthenticate' }
            });
        }
    }

    /**
     * Link Google account
     */
    async linkWithGoogle() {
        if (!currentUser) {
            throw authError('No user logged in');
        }

        try {
            const result = await linkWithPopup(currentUser, googleProvider);
            logger.auth('Google account linked', currentUser.uid);
            return result.user;
        } catch (error) {
            logger.error('Failed to link Google account', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'AUTH',
                context: { action: 'link_google' }
            });
        }
    }

    /**
     * Unlink provider
     */
    async unlinkProvider(providerId) {
        if (!currentUser) {
            throw authError('No user logged in');
        }

        try {
            await unlink(currentUser, providerId);
            logger.auth(`Provider unlinked: ${providerId}`, currentUser.uid);
            return true;
        } catch (error) {
            logger.error(`Failed to unlink provider: ${providerId}`, { error: error.message });
            throw errorHandler.handle(error, {
                type: 'AUTH',
                context: { action: 'unlink', providerId }
            });
        }
    }

    /**
     * Delete account
     */
    async deleteAccount(password) {
        if (!currentUser) {
            throw authError('No user logged in');
        }

        try {
            // Re-authenticate
            if (password) {
                await this.reauthenticate(password);
            }

            // Delete from Firestore
            await deleteDoc(doc(db, 'users', currentUser.uid));

            // Delete user
            await deleteUser(currentUser);

            logger.auth('Account deleted', currentUser.uid);
            return true;
        } catch (error) {
            logger.error('Failed to delete account', { error: error.message });
            throw errorHandler.handle(error, {
                type: 'AUTH',
                context: { action: 'delete_account' }
            });
        }
    }

    /**
     * Get sign in methods for email
     */
    async getSignInMethods(email) {
        try {
            const methods = await fetchSignInMethodsForEmail(auth, email);
            return methods;
        } catch (error) {
            logger.error('Failed to get sign in methods', { error: error.message });
            throw error;
        }
    }

    /**
     * Check if email exists
     */
    async emailExists(email) {
        try {
            const methods = await this.getSignInMethods(email);
            return methods.length > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Add auth state listener
     */
    onAuthStateChanged(callback) {
        authStateListeners.push(callback);
        
        // Immediately call with current state
        if (this._authStateReady) {
            callback(currentUser, currentUserData);
        }
        
        // Return unsubscribe function
        return () => {
            authStateListeners = authStateListeners.filter(l => l !== callback);
        };
    }

    /**
     * Wait for auth to be ready
     */
    async waitForAuth() {
        return new Promise((resolve) => {
            if (this._authStateReady) {
                resolve();
            } else {
                const unsubscribe = this.onAuthStateChanged(() => {
                    if (this._authStateReady) {
                        unsubscribe();
                        resolve();
                    }
                });
            }
        });
    }

    /**
     * Get auth statistics
     */
    getStats() {
        return {
            initialized: this._initialized,
            authenticated: this.isAuthenticated(),
            userId: currentUser?.uid,
            email: currentUser?.email,
            isAdmin: this.isAdmin(),
            isSeller: this.isSeller(),
            isVerified: this.isVerified(),
            listenerCount: authStateListeners.length,
            loginAttempts,
            isLockedOut,
            tokenRefreshInterval: AUTH_CONFIG.tokenRefreshInterval
        };
    }

    /**
     * Refresh auth config
     */
    updateConfig(config) {
        Object.assign(AUTH_CONFIG, config);
        logger.info('⚙️ Auth config updated', config);
    }
}

// ─── SINGLETON INSTANCE ──────────────────────────────────────

const authService = new AuthService();

// ─── EXPORTS ──────────────────────────────────────────────────

export { authService };

// ─── HELPER FUNCTIONS ────────────────────────────────────────

/**
 * Initialize auth service
 */
export async function initAuth() {
    return authService.init();
}

/**
 * Get current user
 */
export function getCurrentUser() {
    return authService.getCurrentUser();
}

/**
 * Get current user data
 */
export function getCurrentUserData() {
    return authService.getCurrentUserData();
}

/**
 * Check if authenticated
 */
export function isAuthenticated() {
    return authService.isAuthenticated();
}

/**
 * Check if admin
 */
export function isAdmin() {
    return authService.isAdmin();
}

/**
 * Check if seller
 */
export function isSeller() {
    return authService.isSeller();
}

/**
 * Check if verified
 */
export function isVerified() {
    return authService.isVerified();
}

/**
 * Sign in with email
 */
export function signInWithEmail(email, password, rememberMe = true) {
    return authService.signInWithEmail(email, password, rememberMe);
}

/**
 * Sign up with email
 */
export function signUpWithEmail(email, password, displayName = '', options = {}) {
    return authService.signUpWithEmail(email, password, displayName, options);
}

/**
 * Sign in with Google
 */
export function signInWithGoogle() {
    return authService.signInWithGoogle();
}

/**
 * Sign in with Facebook
 */
export function signInWithFacebook() {
    return authService.signInWithFacebook();
}

/**
 * Sign in with GitHub
 */
export function signInWithGithub() {
    return authService.signInWithGithub();
}

/**
 * Sign in with Phone
 */
export function signInWithPhone(phoneNumber, recaptchaContainer) {
    return authService.signInWithPhone(phoneNumber, recaptchaContainer);
}

/**
 * Verify phone code
 */
export function verifyPhoneCode(code) {
    return authService.verifyPhoneCode(code);
}

/**
 * Sign out
 */
export function triggerSignOut() {
    return authService.signOut();
}

/**
 * Get token
 */
export function getToken(forceRefresh = false) {
    return authService.getToken(forceRefresh);
}

/**
 * Get token claims
 */
export function getTokenClaims() {
    return authService.getTokenClaims();
}

/**
 * Send verification email
 */
export function sendVerificationEmail() {
    return authService.sendVerificationEmail();
}

/**
 * Send password reset
 */
export function sendPasswordReset(email) {
    return authService.sendPasswordReset(email);
}

/**
 * Update user
 */
export function updateUser(data) {
    return authService.updateUser(data);
}

/**
 * Update display name
 */
export function updateDisplayName(displayName) {
    return authService.updateDisplayName(displayName);
}

/**
 * Update email
 */
// Function ka naam change karke export function bana dein
export function triggerUpdateEmail(newEmail) {
    return authService.updateEmail(newEmail);
}

/**
 * Update password
 */
export function triggerupdatePassword(newPassword) {
    return authService.updatePassword(newPassword);
}

/**
 * Reauthenticate
 */
export function reauthenticate(password) {
    return authService.reauthenticate(password);
}

/**
 * Link Google account
 */
export function linkWithGoogle() {
    return authService.linkWithGoogle();
}

/**
 * Unlink provider
 */
export function unlinkProvider(providerId) {
    return authService.unlinkProvider(providerId);
}

/**
 * Delete account
 */
export function deleteAccount(password) {
    return authService.deleteAccount(password);
}

/**
 * Get sign in methods
 */
export function getSignInMethods(email) {
    return authService.getSignInMethods(email);
}

/**
 * Check if email exists
 */
export function emailExists(email) {
    return authService.emailExists(email);
}

/**
 * On auth state changed
 */
export function triggeronAuthStateChanged(callback) {
    return authService.onAuthStateChanged(callback);
}

/**
 * Wait for auth
 */
export function waitForAuth() {
    return authService.waitForAuth();
}

/**
 * Get auth stats
 */
export function getAuthStats() {
    return authService.getStats();
}

// ─── DEFAULT EXPORT ──────────────────────────────────────────

export default authService;

export { AuthService };