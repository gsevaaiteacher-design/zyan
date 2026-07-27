/**
 * ============================================================
 * FILE: js/services/auth-service.js
 * PURPOSE: Authentication service with correct imports
 * DEPENDENCY: firebase-config.js, user-model.js, error-handler.js
 * USED BY: auth-screen.js, app.js, store.js
 * ============================================================
 */

// ✅ CORRECT: Import from firebase-config.js
import { auth, db } from '../config/firebase-config.js';
import { createUser } from '../models/user-model.js';
import { errorHandler } from '../services/error-handler.js';
import { logger } from '../services/logger.js';

// ✅ CORRECT: Firebase Auth methods from CDN
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    inMemoryPersistence,
    sendEmailVerification,
    updateEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    deleteUser,
    fetchSignInMethodsForEmail
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// ✅ CORRECT: Firestore methods from CDN
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp,
    onSnapshot,
    runTransaction
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ============================================
// AUTH SERVICE - CLASS
// ============================================

class AuthService {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.authStateListeners = [];
        this.isInitialized = false;
        
        // Set persistence to LOCAL (remember user)
        if (auth) {
            setPersistence(auth, browserLocalPersistence)
                .then(() => {
                    logger.info('Auth persistence set to LOCAL');
                })
                .catch((error) => {
                    logger.error('Auth persistence error:', error);
                });
        }
    }

    // ============================================
    // AUTH STATE OBSERVER
    // ============================================

    initAuthListener() {
        if (!auth) {
            logger.error('Auth not initialized');
            return;
        }

        onAuthStateChanged(auth, async (user) => {
            this.currentUser = user;
            this.isInitialized = true;
            
            if (user) {
                // User is signed in
                logger.info('User signed in:', user.uid);
                
                // Get user data from Firestore
                try {
                    this.userData = await this.getUserData(user.uid);
                    
                    // If no user document exists, create one
                    if (!this.userData) {
                        this.userData = await this.createUserDocument(user);
                    }
                    
                    // Update last login
                    await this.updateLastLogin(user.uid);
                    
                } catch (error) {
                    logger.error('Error fetching user data:', error);
                }
            } else {
                // User is signed out
                logger.info('User signed out');
                this.userData = null;
            }
            
            // Notify all listeners
            this.notifyAuthStateListeners();
        });
    }

    // ============================================
    // USER DOCUMENT OPERATIONS
    // ============================================

    async getUserData(uid) {
        if (!db) {
            throw new Error('Firestore not initialized');
        }
        
        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                return { uid, ...userSnap.data() };
            }
            return null;
        } catch (error) {
            logger.error('Error fetching user data:', error);
            throw error;
        }
    }

    async createUserDocument(user) {
        if (!db) {
            throw new Error('Firestore not initialized');
        }
        
        try {
            const userData = createUser({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || 'User',
                photoURL: user.photoURL || '',
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
            });
            
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, userData);
            
            logger.info('User document created:', user.uid);
            return { uid: user.uid, ...userData };
        } catch (error) {
            logger.error('Error creating user document:', error);
            throw error;
        }
    }

    async updateLastLogin(uid) {
        if (!db) {
            return;
        }
        
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
                lastLogin: serverTimestamp()
            });
        } catch (error) {
            logger.warn('Error updating last login:', error);
        }
    }

    // ============================================
    // AUTHENTICATION METHODS
    // ============================================

    // Email/Password Login
    async loginWithEmail(email, password) {
        if (!auth) {
            throw new Error('Auth not initialized');
        }
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            logger.info('User logged in:', userCredential.user.uid);
            return userCredential.user;
        } catch (error) {
            const friendlyMessage = this.getAuthErrorMessage(error);
            logger.error('Login error:', error);
            throw new Error(friendlyMessage);
        }
    }

    // Email/Password Signup
    async signupWithEmail(email, password, displayName = '') {
        if (!auth) {
            throw new Error('Auth not initialized');
        }
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Update profile with display name
            if (displayName) {
                await updateProfile(user, { displayName });
            }
            
            // Send email verification
            await sendEmailVerification(user);
            
            // Create user document in Firestore
            await this.createUserDocument(user);
            
            logger.info('User signed up:', user.uid);
            return user;
        } catch (error) {
            const friendlyMessage = this.getAuthErrorMessage(error);
            logger.error('Signup error:', error);
            throw new Error(friendlyMessage);
        }
    }

    // Google Sign In
    async loginWithGoogle(useRedirect = false) {
        if (!auth) {
            throw new Error('Auth not initialized');
        }
        
        try {
            const provider = new GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            
            let userCredential;
            
            if (useRedirect) {
                await signInWithRedirect(auth, provider);
                return null;
            } else {
                userCredential = await signInWithPopup(auth, provider);
            }
            
            const user = userCredential.user;
            
            // Check if user document exists, create if not
            const userData = await this.getUserData(user.uid);
            if (!userData) {
                await this.createUserDocument(user);
            } else {
                await this.updateLastLogin(user.uid);
            }
            
            logger.info('Google sign in successful:', user.uid);
            return user;
        } catch (error) {
            const friendlyMessage = this.getAuthErrorMessage(error);
            logger.error('Google sign in error:', error);
            throw new Error(friendlyMessage);
        }
    }

    // Get redirect result (for redirect flow)
    async getRedirectResult() {
        if (!auth) {
            return null;
        }
        
        try {
            const result = await getRedirectResult(auth);
            if (result) {
                const user = result.user;
                const userData = await this.getUserData(user.uid);
                if (!userData) {
                    await this.createUserDocument(user);
                } else {
                    await this.updateLastLogin(user.uid);
                }
                logger.info('Redirect sign in successful:', user.uid);
                return user;
            }
            return null;
        } catch (error) {
            const friendlyMessage = this.getAuthErrorMessage(error);
            logger.error('Redirect sign in error:', error);
            throw new Error(friendlyMessage);
        }
    }

    // Logout
    async logout() {
        if (!auth) {
            throw new Error('Auth not initialized');
        }
        
        try {
            await signOut(auth);
            this.userData = null;
            this.currentUser = null;
            logger.info('User logged out');
        } catch (error) {
            logger.error('Logout error:', error);
            throw error;
        }
    }

    // Password Reset
    async resetPassword(email) {
        if (!auth) {
            throw new Error('Auth not initialized');
        }
        
        try {
            await sendPasswordResetEmail(auth, email);
            logger.info('Password reset email sent to:', email);
        } catch (error) {
            const friendlyMessage = this.getAuthErrorMessage(error);
            logger.error('Password reset error:', error);
            throw new Error(friendlyMessage);
        }
    }

    // Update Profile
    async updateUserProfile(displayName, photoURL) {
        if (!auth || !auth.currentUser) {
            throw new Error('No user logged in');
        }
        
        try {
            const updateData = {};
            if (displayName) updateData.displayName = displayName;
            if (photoURL) updateData.photoURL = photoURL;
            
            await updateProfile(auth.currentUser, updateData);
            
            // Update Firestore
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, updateData);
            
            // Refresh user data
            this.userData = await this.getUserData(auth.currentUser.uid);
            this.notifyAuthStateListeners();
            
            logger.info('User profile updated');
        } catch (error) {
            logger.error('Profile update error:', error);
            throw error;
        }
    }

    // Update Email
    async updateUserEmail(newEmail) {
        if (!auth || !auth.currentUser) {
            throw new Error('No user logged in');
        }
        
        try {
            await updateEmail(auth.currentUser, newEmail);
            
            // Update Firestore
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, { email: newEmail });
            
            this.userData = await this.getUserData(auth.currentUser.uid);
            this.notifyAuthStateListeners();
            
            logger.info('Email updated');
        } catch (error) {
            const friendlyMessage = this.getAuthErrorMessage(error);
            logger.error('Email update error:', error);
            throw new Error(friendlyMessage);
        }
    }

    // Update Password
    async updateUserPassword(currentPassword, newPassword) {
        if (!auth || !auth.currentUser) {
            throw new Error('No user logged in');
        }
        
        try {
            // Re-authenticate first
            const credential = EmailAuthProvider.credential(
                auth.currentUser.email,
                currentPassword
            );
            await reauthenticateWithCredential(auth.currentUser, credential);
            
            // Update password
            await updatePassword(auth.currentUser, newPassword);
            
            logger.info('Password updated');
        } catch (error) {
            const friendlyMessage = this.getAuthErrorMessage(error);
            logger.error('Password update error:', error);
            throw new Error(friendlyMessage);
        }
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Get current user data
    getUserDataSync() {
        return this.userData;
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Check if user is seller
    isSeller() {
        return this.userData?.isSeller === true;
    }

    // Check if user is admin
    isAdmin() {
        return this.userData?.isAdmin === true;
    }

    // Get auth token
    async getAuthToken() {
        if (!auth || !auth.currentUser) {
            return null;
        }
        try {
            return await auth.currentUser.getIdToken();
        } catch (error) {
            logger.error('Error getting auth token:', error);
            return null;
        }
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    // Add auth state listener
    addAuthStateListener(callback) {
        if (typeof callback === 'function') {
            this.authStateListeners.push(callback);
            // Call immediately with current state
            callback(this.currentUser, this.userData);
        }
    }

    // Remove auth state listener
    removeAuthStateListener(callback) {
        this.authStateListeners = this.authStateListeners.filter(
            listener => listener !== callback
        );
    }

    // Notify all listeners
    notifyAuthStateListeners() {
        this.authStateListeners.forEach(callback => {
            try {
                callback(this.currentUser, this.userData);
            } catch (error) {
                logger.error('Error in auth state listener:', error);
            }
        });
    }

    // ============================================
    // ERROR MESSAGE HELPER
    // ============================================

    getAuthErrorMessage(error) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/email-already-in-use': 'This email is already registered.',
            'auth/invalid-email': 'Invalid email address.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/too-many-requests': 'Too many attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/popup-closed-by-user': 'Sign in popup was closed. Please try again.',
            'auth/popup-blocked': 'Sign in popup was blocked. Please allow popups.',
            'auth/requires-recent-login': 'Please re-authenticate to perform this action.',
            'auth/account-exists-with-different-credential': 'Account exists with a different sign-in method.',
            'auth/invalid-verification-code': 'Invalid verification code.',
            'auth/invalid-verification-id': 'Invalid verification ID.',
            'auth/captcha-check-failed': 'CAPTCHA check failed. Please try again.',
            'auth/credential-already-in-use': 'This credential is already in use.',
            'auth/operation-not-allowed': 'This sign-in method is not enabled.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/user-token-expired': 'Session expired. Please sign in again.'
        };
        
        const defaultMessage = 'An error occurred. Please try again.';
        const message = errorMessages[error.code] || error.message || defaultMessage;
        
        return message;
    }

    // ============================================
    // CHECK EXISTING ACCOUNT
    // ============================================

    async checkExistingAccount(email) {
        if (!auth) {
            throw new Error('Auth not initialized');
        }
        
        try {
            const methods = await fetchSignInMethodsForEmail(auth, email);
            return methods;
        } catch (error) {
            logger.error('Error checking account:', error);
            return [];
        }
    }

    // ============================================
    // DELETE ACCOUNT
    // ============================================

    async deleteAccount() {
        if (!auth || !auth.currentUser) {
            throw new Error('No user logged in');
        }
        
        try {
            // Delete user document from Firestore
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await deleteDoc(userRef);
            
            // Delete user from Authentication
            await deleteUser(auth.currentUser);
            
            logger.info('Account deleted');
        } catch (error) {
            const friendlyMessage = this.getAuthErrorMessage(error);
            logger.error('Account delete error:', error);
            throw new Error(friendlyMessage);
        }
    }
}



export { 
    app, 
    auth,           // ← YEH HONA CHAHIYE
    db, 
    storage, 
    analytics
};


export default {
    app,
    auth,           // ← YEH BHI HONA CHAHIYE
    db,
    storage,
    analytics
};

// ============================================
// SINGLETON EXPORT
// ============================================

const authService = new AuthService();

// Initialize auth listener on import
authService.initAuthListener();

export { authService };

// Default export for backward compatibility
export default authService;