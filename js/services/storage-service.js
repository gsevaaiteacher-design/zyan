// ============================================================
// FILE: js/services/ad-service.js
// PURPOSE: Complete Ad Monetization Service - PRODUCTION READY
// DEPENDENCY: firebase-config.js, error-handler.js, logger.js, database-service.js
// USED BY: ad-banner.js, download-service.js, ai-service.js, all screens
// VERSION: 3.0.0 - FULLY UPDATED
// ============================================================

import { errorHandler, adError, networkError } from './error-handler.js';
import { logger } from './logger.js';
import { databaseService } from './database-service.js';
import { getCurrentUser, isAuthenticated } from './auth-service.js';

// ============================================================
// AD CONFIGURATION - ZYMORE v3.0 UPDATED
// ============================================================

const AD_CONFIG = {
    // Ad Units - Replace with your actual Ad Unit IDs
    adUnits: {
        // Banner Ads
        BANNER_HOME: 'ca-app-pub-3940256099942544/6300978111',
        BANNER_PRODUCT: 'ca-app-pub-3940256099942544/6300978111',
        BANNER_EXPLORE: 'ca-app-pub-3940256099942544/6300978111',
        BANNER_PROFILE: 'ca-app-pub-3940256099942544/6300978111',
        
        // Rewarded Ads
        REWARDED_DOWNLOAD: 'ca-app-pub-3940256099942544/5224354917',
        REWARDED_AI_CHAT: 'ca-app-pub-3940256099942544/5224354917',
        REWARDED_BONUS: 'ca-app-pub-3940256099942544/5224354917',
        
        // Interstitial Ads
        INTERSTITIAL_NAV: 'ca-app-pub-3940256099942544/1033173712',
        INTERSTITIAL_EXIT: 'ca-app-pub-3940256099942544/1033173712',
        
        // Native Ads
        NATIVE_FEED: 'ca-app-pub-3940256099942544/2247696110'
    },
    
    // === UPDATED: Rewarded Ad Settings ===
    rewarded: {
        coinsPerAd: 10,                    // Updated: 10 coins per ad
        maxAdsPerDay: 4,                   // Updated: 4 ads per day
        cooldownHours: 2,                  // 2 hours cooldown
        minIntervalSeconds: 30,            // 30 seconds minimum
        adDuration: 30,                    // 30 seconds ad duration
        bonusCoinsAfter: 3,                // Bonus after 3 ads
        bonusCoinsAmount: 5,               // 5 bonus coins
        streakBonus: 2,                    // 2 coins per streak
        maxStreakBonus: 10                 // Max 10 streak bonus
    },
    
    // === UPDATED: Coin System ===
    coins: {
        perAd: 10,
        perDownload: 5,
        perAIChat: 3,
        perReferral: 20,
        perShare: 2,
        dailyBonus: 5,
        streakBonus: 2,
        maxStreakDays: 7,
        conversionRate: 0.01,              // 1 coin = $0.01
        minWithdraw: 100,                  // Minimum 100 coins to withdraw
        withdrawMethod: ['paypal', 'bank', 'giftcard']
    },
    
    // === UPDATED: Banner Settings ===
    banner: {
        refreshInterval: 60,
        maxPerPage: 2,
        autoShow: true,
        positions: ['top', 'bottom', 'between'],
        sizes: ['320x50', '300x250', '728x90', '320x100']
    },
    
    // === UPDATED: Interstitial Settings ===
    interstitial: {
        cooldownMinutes: 5,
        maxPerSession: 2,
        showAfterActions: ['navigation', 'search', 'product_view', 'back_button'],
        skipAfterSeconds: 5
    },
    
    // === UPDATED: Native Ad Settings ===
    native: {
        maxPerPage: 3,
        styles: ['small', 'medium', 'large', 'card'],
        showLabels: true,
        ctaColors: ['primary', 'secondary', 'success']
    },
    
    // Loading Settings
    loading: {
        timeout: 15000,
        retryAttempts: 3,
        retryDelay: 2000,
        preload: true
    },
    
    // Test Mode
    testMode: true,
    testDevices: ['TEST_DEVICE_1', 'TEST_DEVICE_2'],
    
    // Tracking
    tracking: {
        enabled: true,
        events: ['impression', 'click', 'completed', 'reward', 'error'],
        analytics: true
    },
    
    // Fraud Detection
    fraudDetection: {
        enabled: true,
        maxWatchesPerMinute: 3,
        maxWatchesPerHour: 10,
        maxWatchesPerDay: 5,
        minWatchDuration: 5,
        maxWatchDuration: 60
    }
};

// ============================================================
// AD STATE MANAGEMENT - UPDATED
// ============================================================

class AdState {
    constructor() {
        this._dailyAds = new Map();
        this._cooldowns = new Map();
        this._lastAdTime = new Map();
        this._adHistory = [];
        this._listeners = [];
        this._streakData = new Map();
        this._dailyBonusClaimed = new Map();
        this._userStats = new Map();
    }

    // === UPDATED: Can Watch Ad ===
    canWatchAd(userId, options = {}) {
        const now = Date.now();
        const today = new Date().toDateString();
        
        // Check daily limit
        const dailyData = this._dailyAds.get(userId);
        if (dailyData) {
            if (dailyData.date !== today) {
                this._dailyAds.set(userId, { count: 0, date: today, ads: [] });
            } else if (dailyData.count >= AD_CONFIG.rewarded.maxAdsPerDay) {
                return { 
                    allowed: false, 
                    reason: 'DAILY_LIMIT',
                    message: 'Daily ad limit reached. Please try tomorrow.',
                    remaining: 0,
                    resetTime: this._getResetTime()
                };
            }
        }

        // Check cooldown
        const cooldownEnd = this._cooldowns.get(userId);
        if (cooldownEnd && now < cooldownEnd) {
            const remaining = cooldownEnd - now;
            return {
                allowed: false,
                reason: 'COOLDOWN',
                message: `Please wait ${Math.ceil(remaining / 60000)} minutes before watching another ad.`,
                remaining: remaining,
                resetTime: cooldownEnd
            };
        }

        // Check minimum interval
        const lastAd = this._lastAdTime.get(userId);
        if (lastAd && (now - lastAd) < AD_CONFIG.rewarded.minIntervalSeconds * 1000) {
            const remaining = (AD_CONFIG.rewarded.minIntervalSeconds * 1000) - (now - lastAd);
            return {
                allowed: false,
                reason: 'MIN_INTERVAL',
                message: 'Please wait a moment before watching another ad.',
                remaining: remaining,
                resetTime: now + remaining
            };
        }

        // Check fraud detection
        if (AD_CONFIG.fraudDetection.enabled) {
            const fraudCheck = this._checkFraud(userId);
            if (!fraudCheck.allowed) {
                return fraudCheck;
            }
        }

        // Check streak bonus
        const streak = this._getStreak(userId);
        const bonus = this._calculateStreakBonus(streak);

        return { 
            allowed: true,
            streak: streak,
            bonus: bonus,
            remaining: this._dailyAds.get(userId) ? 
                AD_CONFIG.rewarded.maxAdsPerDay - this._dailyAds.get(userId).count : 
                AD_CONFIG.rewarded.maxAdsPerDay
        };
    }

    // === UPDATED: Check Fraud ===
    _checkFraud(userId) {
        const now = Date.now();
        const history = this._adHistory.filter(h => h.userId === userId);
        const recent = history.filter(h => (now - h.timestamp) < 60000); // Last minute
        
        if (recent.length >= AD_CONFIG.fraudDetection.maxWatchesPerMinute) {
            return {
                allowed: false,
                reason: 'FRAUD_DETECTED',
                message: 'Too many ad requests. Please wait a moment.'
            };
        }
        
        const hour = history.filter(h => (now - h.timestamp) < 3600000);
        if (hour.length >= AD_CONFIG.fraudDetection.maxWatchesPerHour) {
            return {
                allowed: false,
                reason: 'FRAUD_DETECTED',
                message: 'Ad request limit reached. Please try again later.'
            };
        }
        
        return { allowed: true };
    }

    // === UPDATED: Track Ad ===
    trackAd(userId, adData) {
        const now = Date.now();
        const today = new Date().toDateString();
        
        // Update daily count
        let dailyData = this._dailyAds.get(userId);
        if (!dailyData || dailyData.date !== today) {
            dailyData = { count: 0, date: today, ads: [] };
        }
        
        dailyData.count++;
        dailyData.ads.push({
            timestamp: now,
            type: adData.type,
            rewardEarned: adData.rewardEarned || 0,
            adUnit: adData.adUnit,
            duration: adData.duration || 0,
            completed: adData.completed || false,
            rewardType: adData.rewardType || 'coins'
        });
        this._dailyAds.set(userId, dailyData);

        // Update last ad time
        this._lastAdTime.set(userId, now);

        // Update streak
        this._updateStreak(userId);

        // Add to history
        this._adHistory.push({
            userId,
            ...adData,
            timestamp: now,
            date: today
        });

        // Set cooldown (2 hours)
        const cooldownTime = now + (AD_CONFIG.rewarded.cooldownHours * 60 * 60 * 1000);
        this._cooldowns.set(userId, cooldownTime);

        // Update user stats
        const stats = this._userStats.get(userId) || { total: 0, rewards: 0 };
        stats.total++;
        stats.rewards += adData.rewardEarned || 0;
        this._userStats.set(userId, stats);

        // Notify listeners
        this._notifyListeners('ad_watch', {
            userId,
            adData,
            dailyCount: dailyData.count,
            remaining: AD_CONFIG.rewarded.maxAdsPerDay - dailyData.count,
            cooldown: cooldownTime
        });

        // Check for bonus
        if (dailyData.count === AD_CONFIG.rewarded.bonusCoinsAfter) {
            this._notifyListeners('bonus_earned', {
                userId,
                bonus: AD_CONFIG.rewarded.bonusCoinsAmount,
                reason: 'Daily ad streak'
            });
        }

        return {
            dailyCount: dailyData.count,
            remaining: AD_CONFIG.rewarded.maxAdsPerDay - dailyData.count,
            cooldown: cooldownTime,
            streak: this._getStreak(userId),
            bonus: this._calculateStreakBonus(this._getStreak(userId))
        };
    }

    // === UPDATED: Get Streak ===
    _getStreak(userId) {
        const data = this._streakData.get(userId);
        if (!data) return 0;
        
        const today = new Date().toDateString();
        const lastDate = new Date(data.lastDate).toDateString();
        
        if (today === lastDate) return data.streak;
        if (this._isConsecutiveDay(data.lastDate)) return data.streak;
        
        return 0;
    }

    // === UPDATED: Update Streak ===
    _updateStreak(userId) {
        const today = new Date().toDateString();
        const data = this._streakData.get(userId) || { streak: 0, lastDate: null };
        
        if (!data.lastDate || new Date(data.lastDate).toDateString() !== today) {
            if (this._isConsecutiveDay(data.lastDate)) {
                data.streak++;
            } else {
                data.streak = 1;
            }
            data.lastDate = new Date().toISOString();
        }
        
        this._streakData.set(userId, data);
        
        // Check streak bonus
        if (data.streak > 0 && data.streak % 7 === 0) {
            this._notifyListeners('streak_bonus', {
                userId,
                streak: data.streak,
                bonus: AD_CONFIG.coins.streakBonus * data.streak
            });
        }
    }

    // === UPDATED: Is Consecutive Day ===
    _isConsecutiveDay(date) {
        if (!date) return false;
        const prev = new Date(date);
        const today = new Date();
        const diff = today.getDate() - prev.getDate();
        return diff === 1 && today.getMonth() === prev.getMonth() && today.getFullYear() === prev.getFullYear();
    }

    // === UPDATED: Calculate Streak Bonus ===
    _calculateStreakBonus(streak) {
        if (streak === 0) return 0;
        const bonus = Math.min(streak * AD_CONFIG.rewarded.streakBonus, AD_CONFIG.rewarded.maxStreakBonus);
        return bonus;
    }

    // === UPDATED: Get Reset Time ===
    _getResetTime() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow.getTime();
    }

    // === UPDATED: Get User Stats ===
    getUserStats(userId) {
        const dailyData = this._dailyAds.get(userId);
        const today = new Date().toDateString();
        
        let count = 0;
        let ads = [];
        
        if (dailyData && dailyData.date === today) {
            count = dailyData.count;
            ads = dailyData.ads;
        }

        const cooldownEnd = this._cooldowns.get(userId);
        const isCooldown = cooldownEnd && Date.now() < cooldownEnd;
        const streak = this._getStreak(userId);
        const stats = this._userStats.get(userId);

        return {
            today: {
                count,
                remaining: Math.max(0, AD_CONFIG.rewarded.maxAdsPerDay - count),
                ads
            },
            cooldown: {
                active: isCooldown,
                endsAt: cooldownEnd || null,
                remaining: isCooldown ? cooldownEnd - Date.now() : 0
            },
            streak: {
                days: streak,
                bonus: this._calculateStreakBonus(streak),
                nextBonusIn: streak > 0 ? 7 - (streak % 7) : 7
            },
            stats: stats || { total: 0, rewards: 0 },
            lastAdTime: this._lastAdTime.get(userId) || null,
            totalHistory: this._adHistory.filter(h => h.userId === userId).length
        };
    }

    // === UPDATED: Add Listener ===
    addListener(callback) {
        this._listeners.push(callback);
        return () => {
            this._listeners = this._listeners.filter(c => c !== callback);
        };
    }

    _notifyListeners(event, data) {
        for (const callback of this._listeners) {
            try { callback(event, data); } catch (e) { /* ignore */ }
        }
    }

    resetUser(userId) {
        this._dailyAds.delete(userId);
        this._cooldowns.delete(userId);
        this._lastAdTime.delete(userId);
        this._streakData.delete(userId);
        this._userStats.delete(userId);
        this._notifyListeners('user_reset', { userId });
    }
}

// ============================================================
// COIN SYSTEM - UPDATED
// ============================================================

class CoinSystem {
    constructor() {
        this._balances = new Map();
        this._transactions = new Map();
        this._withdrawals = new Map();
        this._exchangeRates = {
            USD: 0.01,
            EUR: 0.009,
            GBP: 0.008,
            INR: 0.75,
            PKR: 2.5,
            AED: 0.037
        };
    }

    // === UPDATED: Add Coins ===
    async addCoins(userId, amount, source = 'ad_watch', metadata = {}) {
        try {
            // Check for bonus
            let bonus = 0;
            if (source === 'ad_watch') {
                const streak = this._getStreak(userId);
                bonus = this._calculateStreakBonus(streak);
            }

            const totalAmount = amount + bonus;
            const currentBalance = this._balances.get(userId) || 0;
            const newBalance = currentBalance + totalAmount;
            this._balances.set(userId, newBalance);

            const transaction = {
                id: this._generateTransactionId(),
                userId,
                amount: totalAmount,
                baseAmount: amount,
                bonus: bonus,
                source,
                timestamp: new Date().toISOString(),
                balance: newBalance,
                metadata,
                type: 'credit'
            };

            if (!this._transactions.has(userId)) {
                this._transactions.set(userId, []);
            }
            this._transactions.get(userId).push(transaction);

            // Update Firestore
            await databaseService.updateUser(userId, { 
                coins: newBalance,
                lastCoinUpdate: new Date().toISOString()
            });

            logger.info(`💰 ${totalAmount} coins added to user ${userId} (${source})`, {
                userId,
                amount,
                bonus,
                newBalance,
                source
            });

            return { 
                userId, 
                amount: totalAmount, 
                baseAmount: amount,
                bonus,
                newBalance, 
                transaction 
            };
        } catch (error) {
            logger.error(`❌ Failed to add coins`, { error: error.message });
            throw error;
        }
    }

    // === UPDATED: Deduct Coins ===
    async deductCoins(userId, amount, source = 'download', metadata = {}) {
        try {
            const currentBalance = this._balances.get(userId) || 0;
            
            if (currentBalance < amount) {
                throw adError('Insufficient coins', {
                    code: 'INSUFFICIENT_COINS',
                    context: { userId, currentBalance, required: amount }
                });
            }

            const newBalance = currentBalance - amount;
            this._balances.set(userId, newBalance);

            const transaction = {
                id: this._generateTransactionId(),
                userId,
                amount: -amount,
                source,
                timestamp: new Date().toISOString(),
                balance: newBalance,
                metadata,
                type: 'debit'
            };

            if (!this._transactions.has(userId)) {
                this._transactions.set(userId, []);
            }
            this._transactions.get(userId).push(transaction);

            await databaseService.updateUser(userId, { 
                coins: newBalance,
                lastCoinUpdate: new Date().toISOString()
            });

            logger.info(`💰 ${amount} coins deducted from user ${userId}`, {
                userId,
                amount,
                newBalance,
                source
            });

            return { userId, amount: -amount, newBalance, transaction };
        } catch (error) {
            logger.error(`❌ Failed to deduct coins`, { error: error.message });
            throw error;
        }
    }

    // === UPDATED: Get Balance ===
    async getBalance(userId) {
        if (this._balances.has(userId)) {
            return this._balances.get(userId);
        }

        try {
            const user = await databaseService.getUser(userId);
            const balance = user?.coins || 0;
            this._balances.set(userId, balance);
            return balance;
        } catch (error) {
            logger.error(`❌ Failed to get balance`, { error: error.message });
            return 0;
        }
    }

    // === UPDATED: Convert Coins to Currency ===
    convertCoins(coins, currency = 'USD') {
        const rate = this._exchangeRates[currency] || 0.01;
        return coins * rate;
    }

    // === UPDATED: Request Withdrawal ===
    async requestWithdrawal(userId, amount, method = 'paypal', details = {}) {
        try {
            const balance = await this.getBalance(userId);
            
            if (balance < amount) {
                throw adError('Insufficient coins for withdrawal', {
                    code: 'INSUFFICIENT_WITHDRAW',
                    context: { userId, balance, requested: amount }
                });
            }

            if (amount < AD_CONFIG.coins.minWithdraw) {
                throw adError(`Minimum withdrawal is ${AD_CONFIG.coins.minWithdraw} coins`, {
                    code: 'MIN_WITHDRAW_REQUIRED',
                    context: { min: AD_CONFIG.coins.minWithdraw }
                });
            }

            const withdrawal = {
                id: this._generateTransactionId(),
                userId,
                amount,
                method,
                details,
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                value: this.convertCoins(amount, details.currency || 'USD')
            };

            if (!this._withdrawals.has(userId)) {
                this._withdrawals.set(userId, []);
            }
            this._withdrawals.get(userId).push(withdrawal);

            // Deduct coins
            await this.deductCoins(userId, amount, 'withdrawal', { withdrawalId: withdrawal.id });

            // Save to Firestore
            await databaseService.create('withdrawals', withdrawal);

            logger.info(`💰 Withdrawal requested for user ${userId}`, {
                userId,
                amount,
                method,
                value: withdrawal.value
            });

            return withdrawal;
        } catch (error) {
            logger.error(`❌ Failed to request withdrawal`, { error: error.message });
            throw error;
        }
    }

    // === UPDATED: Get Withdrawals ===
    getWithdrawals(userId) {
        return this._withdrawals.get(userId) || [];
    }

    // === UPDATED: Get Transaction History ===
    getTransactionHistory(userId, limit = 50, type = null) {
        let transactions = this._transactions.get(userId) || [];
        if (type) {
            transactions = transactions.filter(t => t.type === type);
        }
        return transactions.slice(-limit).reverse();
    }

    // === UPDATED: Get User Stats ===
    async getUserStats(userId) {
        const balance = await this.getBalance(userId);
        const history = this.getTransactionHistory(userId);
        const withdrawals = this.getWithdrawals(userId);
        
        const totalEarned = history
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalSpent = history
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
        const completedWithdrawals = withdrawals.filter(w => w.status === 'completed');

        return {
            balance,
            totalEarned,
            totalSpent,
            netCoins: totalEarned - totalSpent,
            transactionCount: history.length,
            lastTransaction: history[0] || null,
            withdrawals: {
                total: withdrawals.length,
                pending: pendingWithdrawals.length,
                completed: completedWithdrawals.length,
                totalValue: completedWithdrawals.reduce((sum, w) => sum + w.value, 0)
            },
            canWithdraw: balance >= AD_CONFIG.coins.minWithdraw,
            minWithdraw: AD_CONFIG.coins.minWithdraw
        };
    }

    _generateTransactionId() {
        return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    _getStreak(userId) {
        // For bonus calculation
        return 0; // Will be calculated by AdState
    }

    _calculateStreakBonus(streak) {
        return Math.min(streak * AD_CONFIG.rewarded.streakBonus, AD_CONFIG.rewarded.maxStreakBonus);
    }

    clearCache() {
        this._balances.clear();
        this._transactions.clear();
        this._withdrawals.clear();
        logger.info('💰 Coin cache cleared');
    }
}

// ============================================================
// REWARDED AD MANAGER - UPDATED
// ============================================================

class RewardedAdManager {
    constructor() {
        this._isLoading = false;
        this._isShowing = false;
        this._callbacks = [];
        this._adLoaded = false;
        this._rewardedAd = null;
        this._adCount = 0;
        this._lastAdTime = null;
        this._dailyAds = 0;
        this._cooldownTimer = null;
    }

    // === UPDATED: Load Rewarded Ad ===
    async loadRewardedAd(adUnit = AD_CONFIG.adUnits.REWARDED_DOWNLOAD) {
        if (this._isLoading) return;
        
        this._isLoading = true;
        
        try {
            // Simulate ad loading
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            this._adLoaded = true;
            this._rewardedAd = { 
                adUnit, 
                loaded: true,
                loadTime: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 30000).toISOString()
            };
            
            logger.info(`📢 Rewarded ad loaded: ${adUnit}`);
            this._notifyCallbacks('ad_loaded', { adUnit });
            
            // Preload next ad
            if (AD_CONFIG.loading.preload) {
                setTimeout(() => this._preloadNextAd(), 5000);
            }
        } catch (error) {
            logger.error(`❌ Failed to load rewarded ad`, { error: error.message });
            throw error;
        } finally {
            this._isLoading = false;
        }
    }

    // === UPDATED: Preload Next Ad ===
    async _preloadNextAd() {
        try {
            await this.loadRewardedAd(this._rewardedAd?.adUnit);
        } catch (e) {
            // Silent fail
        }
    }

    // === UPDATED: Show Rewarded Ad ===
    async showRewardedAd(options = {}) {
        const userId = getCurrentUser()?.uid;
        if (!userId) {
            throw adError('User not authenticated', { code: 'USER_NOT_AUTHENTICATED' });
        }

        const canWatch = adState.canWatchAd(userId);
        if (!canWatch.allowed) {
            throw adError(canWatch.message, {
                code: canWatch.reason,
                context: { userId, ...canWatch }
            });
        }

        if (this._isShowing) {
            throw adError('Ad is already showing', { code: 'AD_ALREADY_SHOWING' });
        }

        try {
            this._isShowing = true;
            this._notifyCallbacks('ad_started', { userId });

            // Load ad if not loaded
            if (!this._adLoaded) {
                await this.loadRewardedAd(options.adUnit);
            }

            // Show ad
            const adDuration = options.duration || AD_CONFIG.rewarded.adDuration * 1000;
            await this._showAdWithProgress(adDuration);

            // Calculate reward with bonuses
            let rewardEarned = AD_CONFIG.rewarded.coinsPerAd;
            
            // Check for streak bonus
            const streak = canWatch.streak || 0;
            if (streak > 0) {
                const bonus = Math.min(streak * AD_CONFIG.rewarded.streakBonus, AD_CONFIG.rewarded.maxStreakBonus);
                rewardEarned += bonus;
            }

            // Check for daily bonus (every 3 ads)
            const dailyData = adState._dailyAds.get(userId);
            if (dailyData && dailyData.count > 0 && dailyData.count % 3 === 0) {
                rewardEarned += AD_CONFIG.rewarded.bonusCoinsAmount;
            }

            // Track ad watch
            const stats = adState.trackAd(userId, {
                type: 'rewarded',
                rewardEarned,
                adUnit: options.adUnit || AD_CONFIG.adUnits.REWARDED_DOWNLOAD,
                completed: true,
                duration: AD_CONFIG.rewarded.adDuration,
                rewardType: 'coins'
            });

            // Add coins
            const coinResult = await coinSystem.addCoins(userId, rewardEarned, 'ad_watch', {
                adUnit: options.adUnit || AD_CONFIG.adUnits.REWARDED_DOWNLOAD,
                streak: stats.streak,
                bonus: rewardEarned - AD_CONFIG.rewarded.coinsPerAd
            });

            // Update user daily bonus
            await this._updateDailyBonus(userId);

            this._adLoaded = false;
            this._adCount++;
            this._lastAdTime = Date.now();
            this._dailyAds++;

            this._notifyCallbacks('ad_completed', {
                userId,
                rewardEarned,
                stats,
                coinResult
            });

            logger.info(`🎯 Rewarded ad completed for user ${userId}`, {
                userId,
                rewardEarned,
                dailyCount: stats.dailyCount,
                streak: stats.streak,
                bonus: rewardEarned - AD_CONFIG.rewarded.coinsPerAd
            });

            return {
                success: true,
                rewardEarned,
                stats,
                coinResult,
                streak: stats.streak,
                bonus: rewardEarned - AD_CONFIG.rewarded.coinsPerAd
            };
        } catch (error) {
            this._notifyCallbacks('ad_error', { userId, error: error.message });
            throw errorHandler.handle(error, {
                type: 'AD',
                context: { userId, operation: 'show_rewarded' }
            });
        } finally {
            this._isShowing = false;
        }
    }

    // === UPDATED: Show Ad With Progress ===
    async _showAdWithProgress(duration) {
        return new Promise((resolve, reject) => {
            let progress = 0;
            const interval = 100;
            const steps = duration / interval;
            let currentStep = 0;

            const timer = setInterval(() => {
                currentStep++;
                progress = Math.min((currentStep / steps) * 100, 100);
                this._notifyCallbacks('ad_progress', { progress });
                
                if (currentStep >= steps) {
                    clearInterval(timer);
                    resolve();
                }
            }, interval);

            // Timeout
            const timeout = setTimeout(() => {
                clearInterval(timer);
                reject(new Error('Ad timeout'));
            }, AD_CONFIG.loading.timeout);
            
            // Cleanup
            const cleanup = () => {
                clearTimeout(timeout);
                clearInterval(timer);
            };
            
            resolve._cleanup = cleanup;
            reject._cleanup = cleanup;
        });
    }

    // === UPDATED: Update Daily Bonus ===
    async _updateDailyBonus(userId) {
        try {
            const user = await databaseService.getUser(userId);
            if (user) {
                const today = new Date().toDateString();
                const lastBonus = user.lastDailyBonus || '';
                
                if (lastBonus !== today) {
                    await databaseService.updateUser(userId, {
                        lastDailyBonus: today,
                        dailyBonusClaimed: true
                    });
                    
                    // Add daily bonus coins
                    await coinSystem.addCoins(userId, AD_CONFIG.coins.dailyBonus, 'daily_bonus', {
                        date: today
                    });
                    
                    this._notifyCallbacks('daily_bonus', { userId, bonus: AD_CONFIG.coins.dailyBonus });
                }
            }
        } catch (error) {
            logger.error('Failed to update daily bonus', { error: error.message });
        }
    }

    // === UPDATED: Add Callback ===
    addCallback(callback) {
        this._callbacks.push(callback);
        return () => {
            this._callbacks = this._callbacks.filter(c => c !== callback);
        };
    }

    _notifyCallbacks(event, data) {
        for (const callback of this._callbacks) {
            try { callback(event, data); } catch (e) { /* ignore */ }
        }
    }

    isShowing() {
        return this._isShowing;
    }

    isLoaded() {
        return this._adLoaded;
    }

    getAdCount() {
        return this._adCount;
    }

    getDailyAds() {
        return this._dailyAds;
    }

    resetDaily() {
        this._dailyAds = 0;
    }
}

// ============================================================
// BANNER AD MANAGER - UPDATED
// ============================================================

class BannerAdManager {
    constructor() {
        this._banners = new Map();
        this._refreshTimers = new Map();
        this._visible = new Map();
        this._positions = new Map();
        this._sizes = new Map();
    }

    // === UPDATED: Show Banner ===
    async showBanner(containerId, adUnit = AD_CONFIG.adUnits.BANNER_HOME, options = {}) {
        try {
            // Remove existing banner
            if (this._banners.has(containerId)) {
                this.hideBanner(containerId);
            }

            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error(`Container ${containerId} not found`);
            }

            // Clear container
            container.innerHTML = '';
            
            // Create ad container
            const adContainer = document.createElement('div');
            adContainer.id = `ad_${containerId}_${Date.now()}`;
            adContainer.className = 'banner-ad-container';
            
            // Set size
            const size = options.size || '320x50';
            const [width, height] = size.split('x');
            adContainer.style.width = '100%';
            adContainer.style.maxWidth = width + 'px';
            adContainer.style.minHeight = height + 'px';
            adContainer.style.display = 'flex';
            adContainer.style.justifyContent = 'center';
            adContainer.style.alignItems = 'center';
            adContainer.style.backgroundColor = '#f5f5f5';
            adContainer.style.borderRadius = '8px';
            adContainer.style.margin = '8px 0';
            adContainer.style.padding = '8px';
            
            container.appendChild(adContainer);

            // Show ad placeholder with animation
            adContainer.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    width: 100%;
                    padding: 8px;
                    font-size: 12px;
                    color: #666;
                ">
                    <span>📢</span>
                    <span style="font-weight: 500;">Sponsored</span>
                    <span style="color: #999;">|</span>
                    <span>Learn more about our products</span>
                </div>
            `;

            const banner = {
                containerId,
                adUnit,
                adContainerId: adContainer.id,
                size,
                options,
                position: options.position || 'bottom',
                shownAt: new Date().toISOString(),
                visible: true
            };

            this._banners.set(containerId, banner);
            this._visible.set(containerId, true);
            this._positions.set(containerId, options.position || 'bottom');
            this._sizes.set(containerId, size);

            // Set refresh timer
            if (options.autoRefresh !== false) {
                this._setRefreshTimer(containerId);
            }

            // Log impression
            await this._logBannerImpression(banner);

            logger.debug(`📢 Banner ad shown in ${containerId}`, { adUnit, size });
            return banner;
        } catch (error) {
            logger.error(`❌ Failed to show banner ad`, { error: error.message });
            throw errorHandler.handle(error, {
                type: 'AD',
                context: { containerId, adUnit, operation: 'show_banner' }
            });
        }
    }

    // === UPDATED: Log Banner Impression ===
    async _logBannerImpression(banner) {
        try {
            await adService._recordAdWatch({
                userId: getCurrentUser()?.uid,
                adType: 'banner',
                adUnitId: banner.adUnit,
                rewardEarned: 0,
                rewardType: 'coins',
                completed: true,
                duration: 0,
                placement: banner.position
            });
        } catch (e) {
            // Silent fail
        }
    }

    // === UPDATED: Hide Banner ===
    hideBanner(containerId) {
        this._clearRefreshTimer(containerId);
        const banner = this._banners.get(containerId);
        if (banner) {
            const container = document.getElementById(banner.adContainerId);
            if (container) {
                container.style.display = 'none';
                container.style.opacity = '0';
                container.style.transition = 'opacity 0.3s ease';
            }
            this._visible.set(containerId, false);
            this._banners.delete(containerId);
        }
        logger.debug(`📢 Banner hidden in ${containerId}`);
    }

    // === UPDATED: Refresh Banner ===
    refreshBanner(containerId) {
        const banner = this._banners.get(containerId);
        if (!banner) return;
        this.showBanner(containerId, banner.adUnit, { 
            ...banner.options, 
            size: banner.size,
            position: banner.position,
            autoRefresh: true 
        });
    }

    // === UPDATED: Set Refresh Timer ===
    _setRefreshTimer(containerId) {
        this._clearRefreshTimer(containerId);
        const timer = setInterval(() => {
            this.refreshBanner(containerId);
        }, AD_CONFIG.banner.refreshInterval * 1000);
        this._refreshTimers.set(containerId, timer);
    }

    _clearRefreshTimer(containerId) {
        if (this._refreshTimers.has(containerId)) {
            clearInterval(this._refreshTimers.get(containerId));
            this._refreshTimers.delete(containerId);
        }
    }

    // === UPDATED: Get Banner ===
    getBanner(containerId) {
        return this._banners.get(containerId);
    }

    getAllBanners() {
        return Array.from(this._banners.values());
    }

    getVisibleBanners() {
        return this.getAllBanners().filter(b => this._visible.get(b.containerId));
    }

    clearAll() {
        for (const [containerId] of this._banners) {
            this.hideBanner(containerId);
        }
    }

    getPosition(containerId) {
        return this._positions.get(containerId) || 'bottom';
    }

    getSize(containerId) {
        return this._sizes.get(containerId) || '320x50';
    }
}

// ============================================================
// INTERSTITIAL AD MANAGER - UPDATED
// ============================================================

class InterstitialAdManager {
    constructor() {
        this._lastShown = new Map();
        this._sessionCount = new Map();
        this._isShowing = false;
        this._isLoading = false;
        this._callbacks = [];
        this._adLoaded = false;
    }

    // === UPDATED: Show Interstitial ===
    async showInterstitial(options = {}) {
        const userId = getCurrentUser()?.uid;
        if (!userId) {
            throw adError('User not authenticated', { code: 'USER_NOT_AUTHENTICATED' });
        }

        // Check cooldown
        const lastShown = this._lastShown.get(userId);
        if (lastShown && (Date.now() - lastShown) < AD_CONFIG.interstitial.cooldownMinutes * 60 * 1000) {
            throw adError('Interstitial ad cooldown active', {
                code: 'INTERSTITIAL_COOLDOWN',
                context: { userId }
            });
        }

        // Check session limit
        const sessionCount = this._sessionCount.get(userId) || 0;
        if (sessionCount >= AD_CONFIG.interstitial.maxPerSession) {
            throw adError('Interstitial ad limit reached', {
                code: 'INTERSTITIAL_LIMIT',
                context: { userId, sessionCount }
            });
        }

        if (this._isShowing) {
            throw adError('Ad is already showing', { code: 'AD_ALREADY_SHOWING' });
        }

        try {
            this._isShowing = true;
            this._notifyCallbacks('interstitial_started', { userId });

            // Load ad
            if (!this._adLoaded) {
                await this._loadInterstitialAd();
            }

            // Show ad
            const showDuration = options.duration || 3000;
            await this._showAd(showDuration);

            // Update tracking
            this._lastShown.set(userId, Date.now());
            this._sessionCount.set(userId, sessionCount + 1);
            this._adLoaded = false;

            // Record impression
            await this._recordInterstitialImpression(userId);

            this._notifyCallbacks('interstitial_completed', { userId, sessionCount: sessionCount + 1 });

            logger.info(`📢 Interstitial ad shown to user ${userId}`, {
                userId,
                sessionCount: sessionCount + 1
            });

            return {
                success: true,
                sessionCount: sessionCount + 1
            };
        } catch (error) {
            this._notifyCallbacks('interstitial_error', { userId, error: error.message });
            throw errorHandler.handle(error, {
                type: 'AD',
                context: { userId, operation: 'show_interstitial' }
            });
        } finally {
            this._isShowing = false;
        }
    }

    // === UPDATED: Load Interstitial ===
    async _loadInterstitialAd() {
        if (this._isLoading) return;
        this._isLoading = true;
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            this._adLoaded = true;
        } finally {
            this._isLoading = false;
        }
    }

    // === UPDATED: Show Ad ===
    async _showAd(duration) {
        return new Promise((resolve) => {
            setTimeout(resolve, duration);
        });
    }

    // === UPDATED: Record Impression ===
    async _recordInterstitialImpression(userId) {
        try {
            await adService._recordAdWatch({
                userId,
                adType: 'interstitial',
                rewardEarned: 0,
                completed: true,
                duration: 0
            });
        } catch (e) {
            // Silent fail
        }
    }

    // === UPDATED: Add Callback ===
    addCallback(callback) {
        this._callbacks.push(callback);
        return () => {
            this._callbacks = this._callbacks.filter(c => c !== callback);
        };
    }

    _notifyCallbacks(event, data) {
        for (const callback of this._callbacks) {
            try { callback(event, data); } catch (e) { /* ignore */ }
        }
    }

    resetSession(userId) {
        this._sessionCount.delete(userId);
    }

    isShowing() {
        return this._isShowing;
    }

    isLoaded() {
        return this._adLoaded;
    }

    getSessionCount(userId) {
        return this._sessionCount.get(userId) || 0;
    }
}

// ============================================================
// MAIN AD SERVICE - UPDATED
// ============================================================

class AdService {
    constructor() {
        this._initialized = false;
        this._adState = new AdState();
        this._coinSystem = new CoinSystem();
        this._rewardedManager = new RewardedAdManager();
        this._bannerManager = new BannerAdManager();
        this._interstitialManager = new InterstitialAdManager();
        this._listeners = [];
        this._dailyResetTimer = null;
        this._stats = {
            totalImpressions: 0,
            totalClicks: 0,
            totalRewards: 0,
            totalRevenue: 0,
            startDate: null
        };
    }

    // === UPDATED: Initialize ===
    async init() {
        if (this._initialized) return;

        try {
            // Check if ads are enabled
            if (window.APP_CONFIG?.ADS_ENABLED === false) {
                logger.info('📢 Ads are disabled');
                this._initialized = true;
                return;
            }

            // Set daily reset timer
            this._setDailyResetTimer();

            // Preload rewarded ad
            this._rewardedManager.loadRewardedAd().catch(() => {});

            this._initialized = true;
            
            logger.info('📢 Ad Service initialized v3.0', {
                testMode: AD_CONFIG.testMode,
                rewardedCoins: AD_CONFIG.rewarded.coinsPerAd,
                maxAdsPerDay: AD_CONFIG.rewarded.maxAdsPerDay,
                cooldownHours: AD_CONFIG.rewarded.cooldownHours,
                bonusCoins: AD_CONFIG.rewarded.bonusCoinsAmount,
                streakBonus: AD_CONFIG.rewarded.streakBonus,
                maxStreakBonus: AD_CONFIG.rewarded.maxStreakBonus
            });
        } catch (error) {
            logger.error('❌ Ad Service initialization failed', { error: error.message });
            throw error;
        }
    }

    // === UPDATED: Set Daily Reset Timer ===
    _setDailyResetTimer() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const msUntilMidnight = tomorrow.getTime() - now.getTime();

        this._dailyResetTimer = setTimeout(() => {
            this._dailyReset();
            this._setDailyResetTimer();
        }, msUntilMidnight);
    }

    // === UPDATED: Daily Reset ===
    _dailyReset() {
        this._adState._dailyAds.clear();
        this._rewardedManager.resetDaily();
        logger.info('📢 Daily ad reset completed');
        this._notifyListeners('daily_reset', {});
    }

    // === REWARDED ADS ===
    
    showRewardedAd(options = {}) {
        return this._rewardedManager.showRewardedAd(options);
    }

    loadRewardedAd(adUnit) {
        return this._rewardedManager.loadRewardedAd(adUnit);
    }

    isRewardedAdLoaded() {
        return this._rewardedManager.isLoaded();
    }

    isRewardedAdShowing() {
        return this._rewardedManager.isShowing();
    }

    onRewardedAd(callback) {
        return this._rewardedManager.addCallback(callback);
    }

    // === BANNER ADS ===
    
    showBanner(containerId, adUnit, options = {}) {
        return this._bannerManager.showBanner(containerId, adUnit, options);
    }

    hideBanner(containerId) {
        return this._bannerManager.hideBanner(containerId);
    }

    refreshBanner(containerId) {
        return this._bannerManager.refreshBanner(containerId);
    }

    getBanner(containerId) {
        return this._bannerManager.getBanner(containerId);
    }

    getAllBanners() {
        return this._bannerManager.getAllBanners();
    }

    getVisibleBanners() {
        return this._bannerManager.getVisibleBanners();
    }

    // === INTERSTITIAL ADS ===
    
    showInterstitial(options = {}) {
        return this._interstitialManager.showInterstitial(options);
    }

    isInterstitialShowing() {
        return this._interstitialManager.isShowing();
    }

    resetInterstitialSession(userId) {
        return this._interstitialManager.resetSession(userId);
    }

    onInterstitialAd(callback) {
        return this._interstitialManager.addCallback(callback);
    }

    // === COIN SYSTEM ===
    
    async getUserCoins(userId) {
        return this._coinSystem.getBalance(userId);
    }

    async addCoins(userId, amount, source = 'admin', metadata = {}) {
        return this._coinSystem.addCoins(userId, amount, source, metadata);
    }

    async deductCoins(userId, amount, source = 'download', metadata = {}) {
        return this._coinSystem.deductCoins(userId, amount, source, metadata);
    }

    getCoinHistory(userId, limit = 50) {
        return this._coinSystem.getTransactionHistory(userId, limit);
    }

    async getCoinStats(userId) {
        return this._coinSystem.getUserStats(userId);
    }

    convertCoins(coins, currency = 'USD') {
        return this._coinSystem.convertCoins(coins, currency);
    }

    async requestWithdrawal(userId, amount, method = 'paypal', details = {}) {
        return this._coinSystem.requestWithdrawal(userId, amount, method, details);
    }

    getWithdrawals(userId) {
        return this._coinSystem.getWithdrawals(userId);
    }

    // === USER AD STATS ===
    
    getUserAdStats(userId) {
        return this._adState.getUserStats(userId);
    }

    canWatchAd(userId) {
        return this._adState.canWatchAd(userId);
    }

    // === LISTENERS ===
    
    addListener(callback) {
        return this._adState.addListener(callback);
    }

    _notifyListeners(event, data) {
        // Internal notification
    }

    // === UTILITY ===
    
    getAdStats() {
        return {
            initialized: this._initialized,
            activeBanners: this._bannerManager.getAllBanners().length,
            visibleBanners: this._bannerManager.getVisibleBanners().length,
            isRewardedShowing: this._rewardedManager.isShowing(),
            isInterstitialShowing: this._interstitialManager.isShowing(),
            isRewardedLoaded: this._rewardedManager.isLoaded(),
            coinCacheSize: this._coinSystem._balances.size,
            dailyAdCount: this._rewardedManager.getDailyAds(),
            totalAdCount: this._rewardedManager.getAdCount(),
            stats: this._stats
        };
    }

    resetUser(userId) {
        this._adState.resetUser(userId);
        this._coinSystem._balances.delete(userId);
        this._interstitialManager.resetSession(userId);
        logger.info(`🔄 Ad data reset for user ${userId}`);
    }

    clearCache() {
        this._coinSystem.clearCache();
        logger.info('📢 Ad caches cleared');
    }

    destroy() {
        if (this._dailyResetTimer) {
            clearTimeout(this._dailyResetTimer);
            this._dailyResetTimer = null;
        }
        this._bannerManager.clearAll();
        this._listeners = [];
        this._initialized = false;
        logger.info('📢 Ad service destroyed');
    }

    // === RECORD AD WATCH (Internal) ===
    async _recordAdWatch(adData) {
        try {
            await this._adState.trackAd(adData.userId, adData);
        } catch (error) {
            logger.error('Failed to record ad watch', { error: error.message });
        }
    }
}

// ============================================================
// SINGLETON INSTANCES
// ============================================================

const adState = new AdState();
const coinSystem = new CoinSystem();
const adService = new AdService();

// ============================================================
// EXPORTS
// ============================================================

export { adService, AD_CONFIG };

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export async function initAds() {
    return adService.init();
}

export function showRewardedAd(options = {}) {
    return adService.showRewardedAd(options);
}

export function loadRewardedAd(adUnit) {
    return adService.loadRewardedAd(adUnit);
}

export function isRewardedAdLoaded() {
    return adService.isRewardedAdLoaded();
}

export function isRewardedAdShowing() {
    return adService.isRewardedAdShowing();
}

export function onRewardedAd(callback) {
    return adService.onRewardedAd(callback);
}

export function showBanner(containerId, adUnit, options = {}) {
    return adService.showBanner(containerId, adUnit, options);
}

export function hideBanner(containerId) {
    return adService.hideBanner(containerId);
}

export function refreshBanner(containerId) {
    return adService.refreshBanner(containerId);
}

export function getBanner(containerId) {
    return adService.getBanner(containerId);
}

export function getAllBanners() {
    return adService.getAllBanners();
}

export function getVisibleBanners() {
    return adService.getVisibleBanners();
}

export function showInterstitial(options = {}) {
    return adService.showInterstitial(options);
}

export function isInterstitialShowing() {
    return adService.isInterstitialShowing();
}

export function resetInterstitialSession(userId) {
    return adService.resetInterstitialSession(userId);
}

export function onInterstitialAd(callback) {
    return adService.onInterstitialAd(callback);
}

export function getUserCoins(userId) {
    return adService.getUserCoins(userId);
}

export function addCoins(userId, amount, source = 'admin', metadata = {}) {
    return adService.addCoins(userId, amount, source, metadata);
}

export function deductCoins(userId, amount, source = 'download', metadata = {}) {
    return adService.deductCoins(userId, amount, source, metadata);
}

export function getCoinHistory(userId, limit = 50) {
    return adService.getCoinHistory(userId, limit);
}

export function getCoinStats(userId) {
    return adService.getCoinStats(userId);
}

export function convertCoins(coins, currency = 'USD') {
    return adService.convertCoins(coins, currency);
}

export function requestWithdrawal(userId, amount, method = 'paypal', details = {}) {
    return adService.requestWithdrawal(userId, amount, method, details);
}

export function getWithdrawals(userId) {
    return adService.getWithdrawals(userId);
}

export function getUserAdStats(userId) {
    return adService.getUserAdStats(userId);
}

export function canWatchAd(userId) {
    return adService.canWatchAd(userId);
}

export function onAdEvent(callback) {
    return adService.addListener(callback);
}

export function getAdStats() {
    return adService.getAdStats();
}

export function resetUserAds(userId) {
    return adService.resetUser(userId);
}

export function clearAdCache() {
    return adService.clearCache();
}

export function destroyAdService() {
    return adService.destroy();
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default adService;