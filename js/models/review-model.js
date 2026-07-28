// Review Model
// ============================================================
// FILE: review-model.js
// PURPOSE: Review data structure and management class
// DEPENDENCY: NONE
// USED BY: database-service.js, product-detail.js
// LOCATION: js/models/review-model.js
// ============================================================

// ============================================================
// REVIEW CLASS
// ============================================================

/**
 * Review Model Class
 * Represents a product review in the ZYMORE marketplace
 * Handles review data structure, validation, and serialization
 */
export class Review {
    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * Create a new Review instance
     * @param {Object} data - Review data
     * @param {string} data.id - Review ID (optional)
     * @param {string} data.productId - Product ID
     * @param {string} data.userId - User ID
     * @param {string} data.userName - User name
     * @param {string} data.userPhoto - User photo URL
     * @param {number} data.rating - Rating (1-5)
     * @param {string} data.comment - Review text
     * @param {Date|string} data.createdAt - Creation date
     * @param {Date|string} data.updatedAt - Last update date
     * @param {boolean} data.isVerifiedPurchase - Verified purchase flag
     * @param {number} data.likes - Number of likes
     * @param {Array} data.replies - Replies to review
     * @param {boolean} data.reported - Reported flag
     * @param {boolean} data.isVisible - Visibility flag
     */
    constructor(data = {}) {
        // ============================================
        // BASIC INFORMATION
        // ============================================
        this.id = data.id || data.reviewId || '';
        this.productId = data.productId || '';
        this.userId = data.userId || '';
        this.userName = data.userName || 'Anonymous User';
        this.userPhoto = data.userPhoto || '';
        
        // ============================================
        // REVIEW CONTENT
        // ============================================
        this.rating = data.rating || 0;
        this.comment = data.comment || '';
        
        // ============================================
        // TIMESTAMPS
        // ============================================
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
        
        // ============================================
        // METADATA
        // ============================================
        this.isVerifiedPurchase = data.isVerifiedPurchase || false;
        this.likes = data.likes || 0;
        this.replies = Array.isArray(data.replies) ? data.replies.map(r => ({ ...r })) : [];
        this.reported = data.reported || false;
        this.isVisible = data.isVisible !== undefined ? data.isVisible : true;
    }

    // ============================================
    // VALIDATION METHODS
    // ============================================

    /**
     * Validate review data
     * @returns {Object} Validation result { isValid, errors }
     */
    validate() {
        const errors = [];
        
        // Check required fields
        if (!this.productId || this.productId.trim() === '') {
            errors.push('Product ID is required');
        }
        
        if (!this.userId || this.userId.trim() === '') {
            errors.push('User ID is required');
        }
        
        if (!this.userName || this.userName.trim() === '') {
            errors.push('User name is required');
        }
        
        // Validate rating
        if (this.rating < 1 || this.rating > 5) {
            errors.push('Rating must be between 1 and 5');
        }
        
        // Validate comment
        if (!this.comment || this.comment.trim() === '') {
            errors.push('Comment is required');
        }
        
        if (this.comment && (this.comment.length < 3 || this.comment.length > 500)) {
            errors.push('Comment must be between 3 and 500 characters');
        }
        
        // Validate replies
        if (this.replies && this.replies.length > 50) {
            errors.push('Maximum 50 replies allowed');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // ============================================
    // TRANSFORMATION METHODS
    // ============================================

    /**
     * Convert Review to plain object for Firestore
     * @returns {Object} Plain object representation
     */
    toFirestore() {
        return {
            productId: this.productId,
            userId: this.userId,
            userName: this.userName,
            userPhoto: this.userPhoto,
            rating: this.rating,
            comment: this.comment,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            isVerifiedPurchase: this.isVerifiedPurchase,
            likes: this.likes,
            replies: this.replies.map(r => ({
                ...r,
                timestamp: r.timestamp ? new Date(r.timestamp).toISOString() : new Date().toISOString()
            })),
            reported: this.reported,
            isVisible: this.isVisible
        };
    }

    /**
     * Convert to JSON for API responses
     * @param {boolean} includeReplies - Include replies in response
     * @returns {Object} Review data
     */
    toJSON(includeReplies = true) {
        const data = {
            id: this.id,
            productId: this.productId,
            userId: this.userId,
            userName: this.userName,
            userPhoto: this.userPhoto,
            rating: this.rating,
            comment: this.comment,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            isVerifiedPurchase: this.isVerifiedPurchase,
            likes: this.likes,
            reported: this.reported,
            isVisible: this.isVisible
        };
        
        if (includeReplies) {
            data.replies = this.replies.map(r => ({
                ...r,
                timestamp: r.timestamp ? new Date(r.timestamp).toISOString() : null
            }));
        }
        
        return data;
    }

    /**
     * Get public review data (for display)
     * @returns {Object} Public review data
     */
    getPublicData() {
        return {
            id: this.id,
            productId: this.productId,
            userId: this.userId,
            userName: this.userName,
            userPhoto: this.userPhoto,
            rating: this.rating,
            comment: this.comment,
            createdAt: this.createdAt.toISOString(),
            isVerifiedPurchase: this.isVerifiedPurchase,
            likes: this.likes,
            replies: this.replies.map(r => ({
                userId: r.userId,
                userName: r.userName,
                userPhoto: r.userPhoto,
                comment: r.comment,
                timestamp: r.timestamp ? new Date(r.timestamp).toISOString() : null
            })),
            isVisible: this.isVisible
        };
    }

    /**
     * Get minimal review data (for listings)
     * @returns {Object} Minimal review data
     */
    getMinimalData() {
        return {
            id: this.id,
            productId: this.productId,
            userName: this.userName,
            rating: this.rating,
            comment: this.comment.substring(0, 100) + (this.comment.length > 100 ? '...' : ''),
            createdAt: this.createdAt.toISOString(),
            likes: this.likes
        };
    }

    /**
     * Get rating breakdown
     * @returns {Object} Rating breakdown
     */
    getRatingBreakdown() {
        return {
            rating: this.rating,
            stars: this.getStars(),
            percentage: (this.rating / 5) * 100
        };
    }

    /**
     * Get star representation
     * @returns {string} Star string (e.g., "â˜…â˜…â˜…â˜…â˜…")
     */
    getStars() {
        const fullStars = Math.floor(this.rating);
        const hasHalfStar = this.rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        return 'â˜…'.repeat(fullStars) + (hasHalfStar ? 'Â½' : '') + 'â˜†'.repeat(emptyStars);
    }

    // ============================================
    // REPLY METHODS
    // ============================================

    /**
     * Add a reply to the review
     * @param {Object} reply - Reply data
     * @param {string} reply.userId - User ID
     * @param {string} reply.userName - User name
     * @param {string} reply.userPhoto - User photo URL
     * @param {string} reply.comment - Reply text
     * @param {Date|string} reply.timestamp - Reply timestamp
     * @returns {Review} Updated review (this)
     */
    addReply(reply) {
        if (!reply.userId || !reply.userId.trim()) {
            throw new Error('User ID is required for reply');
        }
        
        if (!reply.comment || reply.comment.trim() === '') {
            throw new Error('Reply comment is required');
        }
        
        if (reply.comment.length > 500) {
            throw new Error('Reply comment must be less than 500 characters');
        }
        
        this.replies.push({
            userId: reply.userId,
            userName: reply.userName || 'Anonymous',
            userPhoto: reply.userPhoto || '',
            comment: reply.comment.trim(),
            timestamp: reply.timestamp ? new Date(reply.timestamp) : new Date()
        });
        
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Remove a reply from the review
     * @param {number} index - Reply index
     * @param {string} userId - User ID for authorization
     * @returns {Review} Updated review (this)
     */
    removeReply(index, userId = null) {
        if (index < 0 || index >= this.replies.length) {
            throw new Error('Reply index out of range');
        }
        
        const reply = this.replies[index];
        
        // Check authorization (only author or admin can delete)
        if (userId && reply.userId !== userId) {
            throw new Error('You can only delete your own replies');
        }
        
        this.replies.splice(index, 1);
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Update a reply in the review
     * @param {number} index - Reply index
     * @param {string} newComment - New comment text
     * @param {string} userId - User ID for authorization
     * @returns {Review} Updated review (this)
     */
    updateReply(index, newComment, userId = null) {
        if (index < 0 || index >= this.replies.length) {
            throw new Error('Reply index out of range');
        }
        
        const reply = this.replies[index];
        
        // Check authorization (only author or admin can update)
        if (userId && reply.userId !== userId) {
            throw new Error('You can only update your own replies');
        }
        
        if (!newComment || newComment.trim() === '') {
            throw new Error('Reply comment cannot be empty');
        }
        
        if (newComment.length > 500) {
            throw new Error('Reply comment must be less than 500 characters');
        }
        
        reply.comment = newComment.trim();
        reply.timestamp = new Date();
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Get total number of replies
     * @returns {number} Reply count
     */
    getReplyCount() {
        return this.replies.length;
    }

    // ============================================
    // LIKE METHODS
    // ============================================

    /**
     * Increment like count
     * @param {number} amount - Amount to increment
     * @returns {Review} Updated review (this)
     */
    incrementLikes(amount = 1) {
        this.likes = (this.likes || 0) + amount;
        return this;
    }

    /**
     * Decrement like count
     * @param {number} amount - Amount to decrement
     * @returns {Review} Updated review (this)
     */
    decrementLikes(amount = 1) {
        this.likes = Math.max(0, (this.likes || 0) - amount);
        return this;
    }

    // ============================================
    // STATIC FACTORY METHODS
    // ============================================

    /**
     * Create Review from Firestore data
     * @param {Object} data - Firestore document data
     * @param {string} id - Document ID
     * @returns {Review} Review instance
     */
    static fromFirestore(data, id) {
        const reviewData = { ...data, id };
        return new Review(reviewData);
    }

    /**
     * Create a new review from form data
     * @param {Object} formData - Form data
     * @param {string} userId - User ID
     * @param {string} userName - User name
     * @param {string} userPhoto - User photo URL
     * @returns {Review} Review instance
     */
    static fromForm(formData, userId, userName, userPhoto = '') {
        return new Review({
            productId: formData.productId,
            userId: userId,
            userName: userName || 'Anonymous User',
            userPhoto: userPhoto || '',
            rating: formData.rating || 0,
            comment: formData.comment || '',
            isVerifiedPurchase: formData.isVerifiedPurchase || false
        });
    }

    /**
     * Create a review template (empty)
     * @param {string} productId - Product ID
     * @param {string} userId - User ID
     * @param {string} userName - User name
     * @returns {Review} Empty review template
     */
    static createTemplate(productId, userId, userName) {
        return new Review({
            productId: productId,
            userId: userId,
            userName: userName || 'Anonymous User',
            rating: 5,
            comment: '',
            isVerifiedPurchase: false
        });
    }

    // ============================================
    // UPDATE METHODS
    // ============================================

    /**
     * Update review data
     * @param {Object} updates - Fields to update
     * @param {string} userId - User ID for authorization
     * @returns {Review} Updated review (this)
     */
    update(updates, userId = null) {
        // Check authorization
        if (userId && this.userId !== userId) {
            throw new Error('You can only update your own reviews');
        }
        
        if (updates.rating !== undefined) {
            if (updates.rating < 1 || updates.rating > 5) {
                throw new Error('Rating must be between 1 and 5');
            }
            this.rating = updates.rating;
        }
        
        if (updates.comment !== undefined) {
            if (!updates.comment || updates.comment.trim() === '') {
                throw new Error('Comment cannot be empty');
            }
            if (updates.comment.length > 500) {
                throw new Error('Comment must be less than 500 characters');
            }
            this.comment = updates.comment.trim();
        }
        
        if (updates.userName !== undefined) {
            this.userName = updates.userName;
        }
        
        if (updates.userPhoto !== undefined) {
            this.userPhoto = updates.userPhoto;
        }
        
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Mark review as verified purchase
     * @param {boolean} verified - Verified status
     * @returns {Review} Updated review (this)
     */
    setVerifiedPurchase(verified = true) {
        this.isVerifiedPurchase = verified;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Report a review
     * @param {boolean} reported - Reported status
     * @returns {Review} Updated review (this)
     */
    setReported(reported = true) {
        this.reported = reported;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Toggle review visibility
     * @param {boolean} visible - Visible status
     * @returns {Review} Updated review (this)
     */
    setVisibility(visible = true) {
        this.isVisible = visible;
        this.updatedAt = new Date();
        return this;
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Get formatted creation date
     * @param {string} locale - Locale for formatting
     * @returns {string} Formatted date
     */
    getCreatedDate(locale = 'en-US') {
        return this.createdAt.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Get time since creation
     * @returns {string} Time ago
     */
    getTimeAgo() {
        const now = new Date();
        const diff = now - this.createdAt;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        if (weeks < 4) return `${weeks}w ago`;
        if (months < 12) return `${months}mo ago`;
        return `${years}y ago`;
    }

    /**
     * Check if user can edit this review
     * @param {string} userId - User ID
     * @param {boolean} isAdmin - Admin status
     * @returns {boolean} True if can edit
     */
    canEdit(userId, isAdmin = false) {
        return this.userId === userId || isAdmin === true;
    }

    /**
     * Check if user can delete this review
     * @param {string} userId - User ID
     * @param {boolean} isAdmin - Admin status
     * @returns {boolean} True if can delete
     */
    canDelete(userId, isAdmin = false) {
        return this.userId === userId || isAdmin === true;
    }

    /**
     * Check if review is visible
     * @returns {boolean} True if visible
     */
    isVisibleReview() {
        return this.isVisible === true;
    }

    /**
     * Check if review is reported
     * @returns {boolean} True if reported
     */
    isReported() {
        return this.reported === true;
    }

    /**
     * Check if review is verified purchase
     * @returns {boolean} True if verified
     */
    isVerified() {
        return this.isVerifiedPurchase === true;
    }

    /**
     * Check if review has replies
     * @returns {boolean} True if has replies
     */
    hasReplies() {
        return this.replies && this.replies.length > 0;
    }

    /**
     * Get reply by index
     * @param {number} index - Reply index
     * @returns {Object|null} Reply object
     */
    getReply(index) {
        if (index < 0 || index >= this.replies.length) {
            return null;
        }
        return this.replies[index];
    }

    /**
     * Get all replies by user
     * @param {string} userId - User ID
     * @returns {Array} Replies by user
     */
    getRepliesByUser(userId) {
        return this.replies.filter(r => r.userId === userId);
    }

    // ============================================
    // COMPARISON METHODS
    // ============================================

    /**
     * Compare two reviews for equality
     * @param {Review} other - Other review
     * @returns {boolean} True if same review
     */
    equals(other) {
        if (!other) return false;
        return this.id === other.id;
    }

    /**
     * Check if this review belongs to a product
     * @param {string} productId - Product ID
     * @returns {boolean} True if same product
     */
    belongsToProduct(productId) {
        return this.productId === productId;
    }

    /**
     * Check if this review belongs to a user
     * @param {string} userId - User ID
     * @returns {boolean} True if same user
     */
    belongsToUser(userId) {
        return this.userId === userId;
    }

    /**
     * Check if this review has a rating
     * @param {number} rating - Rating to check
     * @returns {boolean} True if matches rating
     */
    hasRating(rating) {
        return Math.floor(this.rating) === rating;
    }

    // ============================================
    // STRING REPRESENTATION
    // ============================================

    /**
     * Get string representation
     * @returns {string} String representation
     */
    toString() {
        return `Review(${this.userName}, ${this.rating}â­, ${this.id})`;
    }

    /**
     * Get display string for UI
     * @returns {string} Display string
     */
    toDisplayString() {
        return `${this.userName} - ${this.rating}â­`;
    }

    // ============================================
    // STATIC HELPERS
    // ============================================

    /**
     * Check if data is a valid review object
     * @param {Object} data - Data to check
     * @returns {boolean} True if valid review data
     */
    static isValidReviewData(data) {
        return data && typeof data === 'object' &&
               data.productId && data.productId.trim() !== '' &&
               data.userId && data.userId.trim() !== '' &&
               data.rating && data.rating >= 1 && data.rating <= 5 &&
               data.comment && data.comment.trim() !== '';
    }

    /**
     * Create an array of reviews from Firestore data
     * @param {Array} dataArray - Array of Firestore documents
     * @returns {Array<Review>} Array of Review instances
     */
    static fromFirestoreArray(dataArray) {
        if (!Array.isArray(dataArray)) return [];
        return dataArray.map(data => Review.fromFirestore(data, data.id));
    }

    /**
     * Calculate average rating from reviews
     * @param {Array<Review>} reviews - Reviews array
     * @returns {number} Average rating (0-5)
     */
    static calculateAverageRating(reviews) {
        if (!reviews || reviews.length === 0) return 0;
        const total = reviews.reduce((sum, r) => sum + r.rating, 0);
        return parseFloat((total / reviews.length).toFixed(1));
    }

    /**
     * Get rating distribution from reviews
     * @param {Array<Review>} reviews - Reviews array
     * @returns {Object} Rating distribution { 1: count, 2: count, ... }
     */
    static getRatingDistribution(reviews) {
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        
        if (!reviews || reviews.length === 0) return distribution;
        
        reviews.forEach(review => {
            const rating = Math.floor(review.rating);
            if (distribution[rating] !== undefined) {
                distribution[rating]++;
            }
        });
        
        return distribution;
    }

    /**
     * Sort reviews by date
     * @param {Array<Review>} reviews - Reviews array
     * @param {string} order - 'desc' or 'asc'
     * @returns {Array<Review>} Sorted reviews
     */
    static sortByDate(reviews, order = 'desc') {
        const sorted = [...reviews];
        sorted.sort((a, b) => {
            const aDate = a.createdAt.getTime();
            const bDate = b.createdAt.getTime();
            return order === 'desc' ? bDate - aDate : aDate - bDate;
        });
        return sorted;
    }

    /**
     * Sort reviews by rating
     * @param {Array<Review>} reviews - Reviews array
     * @param {string} order - 'desc' or 'asc'
     * @returns {Array<Review>} Sorted reviews
     */
    static sortByRating(reviews, order = 'desc') {
        const sorted = [...reviews];
        sorted.sort((a, b) => {
            return order === 'desc' ? b.rating - a.rating : a.rating - b.rating;
        });
        return sorted;
    }

    /**
     * Filter reviews by rating
     * @param {Array<Review>} reviews - Reviews array
     * @param {number} minRating - Minimum rating
     * @returns {Array<Review>} Filtered reviews
     */
    static filterByMinRating(reviews, minRating) {
        if (!minRating || minRating <= 0) return reviews;
        return reviews.filter(r => r.rating >= minRating);
    }

    /**
     * Get most helpful reviews (most likes)
     * @param {Array<Review>} reviews - Reviews array
     * @param {number} limit - Max reviews
     * @returns {Array<Review>} Most helpful reviews
     */
    static getMostHelpful(reviews, limit = 5) {
        const sorted = [...reviews];
        sorted.sort((a, b) => b.likes - a.likes);
        return sorted.slice(0, limit);
    }

    /**
     * Get verified purchase reviews only
     * @param {Array<Review>} reviews - Reviews array
     * @returns {Array<Review>} Verified reviews
     */
    static getVerifiedOnly(reviews) {
        return reviews.filter(r => r.isVerifiedPurchase === true);
    }

    /**
     * Get visible reviews only
     * @param {Array<Review>} reviews - Reviews array
     * @returns {Array<Review>} Visible reviews
     */
    static getVisibleOnly(reviews) {
        return reviews.filter(r => r.isVisible === true);
    }

    /**
     * Get reviews by user
     * @param {Array<Review>} reviews - Reviews array
     * @param {string} userId - User ID
     * @returns {Array<Review>} User's reviews
     */
    static getByUser(reviews, userId) {
        return reviews.filter(r => r.userId === userId);
    }

    /**
     * Get reviews by product
     * @param {Array<Review>} reviews - Reviews array
     * @param {string} productId - Product ID
     * @returns {Array<Review>} Product's reviews
     */
    static getByProduct(reviews, productId) {
        return reviews.filter(r => r.productId === productId);
    }
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default Review;


/**
 * Helpers to match index.js expectation for Review
 */
export function createReview(data) {
    return new Review(data);
}

export function validateReview(data) {
    const review = data instanceof Review ? data : new Review(data);
    return review.validate ? review.validate() : { isValid: true };
}

export function reviewToFirestore(review) {
    if (review && typeof review.toFirestore === 'function') {
        return review.toFirestore();
    }
    return review;
}

export function firestoreToReview(doc) {
    if (!doc) return null;
    const data = typeof doc.data === 'function' ? doc.data() : doc;
    const id = typeof doc.id === 'string' ? doc.id : data.id;
    if (typeof Review.fromFirestore === 'function') {
        return Review.fromFirestore(data, id);
    }
    return new Review({ ...data, id });
}

// ============================================================
// END OF FILE: review-model.js
// ============================================================