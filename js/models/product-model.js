/**
 * ============================================================
 * FILE: product-model.js
 * PURPOSE: Product data structure with Digital + Physical + Service support
 * VERSION: 3.0.0 (Production Ready)
 * TOTAL LINES: 950+
 * LOCATION: js/models/product-model.js
 * DEPENDENCY: NONE
 * USED BY: database-service.js, store.js, product-card.js, product-detail.js, upload-screen.js
 * ============================================================
 */

// ============================================================
// PRODUCT CLASS - ZYMORE v3.0
// ============================================================

/**
 * Product Model Class
 * Represents a product in the ZYMORE Hybrid Platform
 * 
 * ZYMORE v3.0 Features:
 * - Digital Products (PDF, Images, Audio, Video, Software)
 * - Physical Products (Location based, Shipping, Inventory)
 * - Services (Consulting, Freelance, Digital Services)
 * - Hybrid Products (Digital + Physical combined)
 * - Bundle Support
 * - Variant Support
 * - Seller Analytics
 * - Review System
 * - SEO Ready
 */
export class Product {
    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * Create a new Product instance
     * @param {Object} data - Product data
     * @param {string} data.id - Product ID
     * @param {string} data.title - Product title
     * @param {string} data.description - Product description
     * @param {string} data.category - Category ID
     * @param {string} data.subCategory - Sub-category ID
     * @param {Array<string>} data.tags - Search tags
     * @param {Array<string>} data.images - Gallery images URLs
     * @param {string} data.thumbnail - Main thumbnail
     * @param {Array<string>} data.mockups - Preview mockups
     * @param {string} data.videoUrl - Optional video preview
     * @param {string} data.audioUrl - Optional audio preview
     * @param {string} data.productType - 'digital' | 'physical' | 'service' | 'hybrid'
     * @param {number} data.fileSize - File size in bytes
     * @param {string} data.fileType - MIME type
     * @param {string} data.downloadUrl - Download URL
     * @param {boolean} data.isLargeFile - > 20MB flag
     * @param {string} data.driveFileId - Google Drive ID
     * @param {number} data.price - Product price
     * @param {number} data.discount - Discount percentage
     * @param {string} data.currency - Currency code
     * @param {boolean} data.isFree - Free product flag
     * @param {boolean} data.isPaid - Paid product flag
     * @param {string} data.priceType - 'free' | 'paid' | 'donation' | 'subscription'
     * @param {Object} data.location - Location for physical products
     * @param {Object} data.shipping - Shipping details
     * @param {number} data.quantity - Total quantity
     * @param {number} data.availableQuantity - Available quantity
     * @param {string} data.condition - 'new' | 'used' | 'refurbished' | 'open-box'
     * @param {boolean} data.isNegotiable - Price negotiable
     * @param {string} data.contactMethod - 'chat' | 'email' | 'phone' | 'whatsapp'
     * @param {string} data.contactEmail - Contact email
     * @param {string} data.contactPhone - Contact phone
     * @param {string} data.contactWhatsApp - WhatsApp number
     * @param {number} data.views - Total views
     * @param {number} data.downloads - Total downloads
     * @param {number} data.likes - Total likes
     * @param {number} data.rating - Average rating (1-5)
     * @param {number} data.ratingCount - Number of ratings
     * @param {number} data.shareCount - Total shares
     * @param {number} data.saveCount - Total saves
     * @param {string} data.sellerId - Seller user ID
     * @param {string} data.sellerName - Seller name
     * @param {string} data.sellerPhoto - Seller photo
     * @param {number} data.sellerRating - Seller rating
     * @param {number} data.sellerTotalSales - Seller total sales
     * @param {boolean} data.sellerVerified - Seller verified
     * @param {Date|string} data.createdAt - Creation date
     * @param {Date|string} data.updatedAt - Last update date
     * @param {Date|string} data.publishedAt - Publication date
     * @param {Date|string} data.expiresAt - Expiry date
     * @param {boolean} data.isActive - Active status
     * @param {boolean} data.isFeatured - Featured flag
     * @param {boolean} data.isTrending - Trending flag
     * @param {boolean} data.isVerified - Verified flag
     * @param {boolean} data.isReported - Reported flag
     * @param {boolean} data.isBlocked - Blocked flag
     * @param {boolean} data.isDeleted - Deleted flag
     * @param {boolean} data.isDraft - Draft flag
     * @param {boolean} data.isPending - Pending approval
     * @param {boolean} data.isApproved - Approved flag
     * @param {boolean} data.isHighlighted - Highlighted flag
     * @param {boolean} data.isSponsored - Sponsored flag
     * @param {boolean} data.isExclusive - Exclusive flag
     * @param {boolean} data.isLimited - Limited edition
     * @param {boolean} data.isBestseller - Bestseller flag
     * @param {boolean} data.isNew - New product flag
     * @param {Array<string>} data.categoryTree - Category hierarchy
     * @param {string} data.targetAudience - Target audience
     * @param {Array<string>} data.suitableFor - Suitable for
     * @param {Array<string>} data.useCases - Use cases
     * @param {Array<string>} data.highlights - Product highlights
     * @param {Array<string>} data.features - Product features
     * @param {Array<string>} data.benefits - Product benefits
     * @param {Object} data.specifications - Technical specifications
     * @param {Array<string>} data.requirements - Requirements
     * @param {Array<string>} data.includedItems - Included items
     * @param {boolean} data.isBundle - Bundle product
     * @param {Array<Object>} data.bundleItems - Bundle items
     * @param {boolean} data.hasVariants - Has variants
     * @param {Array<Object>} data.variants - Product variants
     * @param {Array<Object>} data.reviews - Product reviews
     * @param {Object} data.reviewSummary - Review summary
     * @param {number} data.commission - Commission percentage
     * @param {Object} data.policies - Product policies
     * @param {string} data.demoUrl - Demo URL
     * @param {string} data.supportUrl - Support URL
     * @param {string} data.documentationUrl - Documentation URL
     * @param {Object} data.socialLinks - Social media links
     * @param {string} data.metaTitle - SEO meta title
     * @param {string} data.metaDescription - SEO meta description
     * @param {Array<string>} data.metaKeywords - SEO keywords
     * @param {string} data.ogImage - Open Graph image
     * @param {string} data.canonicalUrl - Canonical URL
     * @param {Object} data.structuredData - JSON-LD structured data
     * @param {Object} data.metadata - Additional metadata
     */
    constructor(data = {}) {
        // ============================================
        // 📌 BASIC INFORMATION
        // ============================================
        this.id = data.id || data.productId || this.generateId();
        this.title = data.title || '';
        this.description = data.description || '';
        this.shortDescription = data.shortDescription || '';
        this.category = data.category || '';
        this.subCategory = data.subCategory || '';
        this.tags = Array.isArray(data.tags) ? [...data.tags] : [];
        
        // ============================================
        // 🖼️ MEDIA
        // ============================================
        this.images = Array.isArray(data.images) ? [...data.images] : [];
        this.thumbnail = data.thumbnail || (this.images.length > 0 ? this.images[0] : '');
        this.mockups = Array.isArray(data.mockups) ? [...data.mockups] : [];
        this.videoUrl = data.videoUrl || '';
        this.videoThumbnail = data.videoThumbnail || '';
        this.audioUrl = data.audioUrl || '';
        this.documentPreview = data.documentPreview || '';
        this.previewImages = Array.isArray(data.previewImages) ? [...data.previewImages] : [];
        this.previewVideo = data.previewVideo || '';
        this.previewAudio = data.previewAudio || '';
        this.previewDocument = data.previewDocument || '';
        
        // ============================================
        // 📦 PRODUCT TYPE
        // ============================================
        this.productType = data.productType || 'digital'; // 'digital' | 'physical' | 'service' | 'hybrid'
        this.isDigital = data.isDigital !== undefined ? data.isDigital : (this.productType === 'digital');
        this.isPhysical = data.isPhysical !== undefined ? data.isPhysical : (this.productType === 'physical');
        this.isService = data.isService !== undefined ? data.isService : (this.productType === 'service');
        this.isHybrid = data.isHybrid !== undefined ? data.isHybrid : (this.productType === 'hybrid');
        
        // ============================================
        // 💾 DIGITAL PRODUCT FIELDS
        // ============================================
        this.fileSize = data.fileSize || 0;
        this.fileType = data.fileType || '';
        this.fileName = data.fileName || '';
        this.fileExtension = data.fileExtension || '';
        this.downloadUrl = data.downloadUrl || '';
        this.isLargeFile = data.isLargeFile || false;
        this.driveFileId = data.driveFileId || '';
        this.driveFileUrl = data.driveFileUrl || '';
        this.uploadProgress = data.uploadProgress || 0;
        this.isUploading = data.isUploading || false;
        this.isUploaded = data.isUploaded || false;
        
        // ============================================
        // 💰 PRICING
        // ============================================
        this.price = data.price || 0;
        this.discount = data.discount || 0;
        this.discountedPrice = data.discountedPrice || this.calculateDiscountedPrice();
        this.currency = data.currency || 'USD';
        this.isFree = data.isFree !== undefined ? data.isFree : (this.price === 0);
        this.isPaid = data.isPaid !== undefined ? data.isPaid : (this.price > 0);
        this.priceType = data.priceType || (this.isFree ? 'free' : 'paid'); // 'free' | 'paid' | 'donation' | 'subscription'
        this.subscriptionPrice = data.subscriptionPrice || 0;
        this.subscriptionPeriod = data.subscriptionPeriod || 'monthly'; // 'monthly' | 'yearly' | 'weekly'
        
        // ============================================
        // 📍 LOCATION & SHIPPING
        // ============================================
        this.location = {
            address: data.location?.address || '',
            city: data.location?.city || '',
            state: data.location?.state || '',
            country: data.location?.country || '',
            pincode: data.location?.pincode || '',
            lat: data.location?.lat || 0,
            lng: data.location?.lng || 0,
            formattedAddress: data.location?.formattedAddress || '',
            placeId: data.location?.placeId || ''
        };
        
        this.shipping = {
            available: data.shipping?.available !== undefined ? data.shipping.available : false,
            cost: data.shipping?.cost || 0,
            freeShipping: data.shipping?.freeShipping !== undefined ? data.shipping.freeShipping : false,
            deliveryTime: data.shipping?.deliveryTime || '3-5 days',
            deliveryEstimate: data.shipping?.deliveryEstimate || '',
            shippingMethods: data.shipping?.shippingMethods || ['standard'],
            internationalShipping: data.shipping?.internationalShipping || false,
            internationalCost: data.shipping?.internationalCost || 0,
            tracking: data.shipping?.tracking || false,
            returnsAccepted: data.shipping?.returnsAccepted !== undefined ? data.shipping.returnsAccepted : true,
            returnPolicy: data.shipping?.returnPolicy || '30 days return policy',
            returnCost: data.shipping?.returnCost || 'buyer' // 'buyer' | 'seller' | 'shared'
        };
        
        // ============================================
        // 📊 INVENTORY
        // ============================================
        this.quantity = data.quantity || 0;
        this.availableQuantity = data.availableQuantity || data.quantity || 0;
        this.reservedQuantity = data.reservedQuantity || 0;
        this.soldQuantity = data.soldQuantity || 0;
        this.minOrderQuantity = data.minOrderQuantity || 1;
        this.maxOrderQuantity = data.maxOrderQuantity || 100;
        this.condition = data.condition || 'new'; // 'new' | 'used' | 'refurbished' | 'open-box' | 'collectible'
        this.isNegotiable = data.isNegotiable !== undefined ? data.isNegotiable : false;
        this.isInStock = data.isInStock !== undefined ? data.isInStock : (this.quantity > 0);
        this.backorderAvailable = data.backorderAvailable !== undefined ? data.backorderAvailable : false;
        this.estimatedRestockDate = data.estimatedRestockDate ? new Date(data.estimatedRestockDate) : null;
        this.lowStockThreshold = data.lowStockThreshold || 5;
        this.isLowStock = data.isLowStock !== undefined ? data.isLowStock : (this.quantity <= this.lowStockThreshold);
        
        // ============================================
        // 💬 CONTACT & COMMUNICATION
        // ============================================
        this.contactMethod = data.contactMethod || 'chat'; // 'chat' | 'email' | 'phone' | 'whatsapp' | 'all'
        this.contactEmail = data.contactEmail || '';
        this.contactPhone = data.contactPhone || '';
        this.contactWhatsApp = data.contactWhatsApp || '';
        this.contactPreferred = data.contactPreferred || 'chat';
        this.responseTime = data.responseTime || '24 hours';
        this.autoRespond = data.autoRespond || '';
        this.isContactAvailable = data.isContactAvailable !== undefined ? data.isContactAvailable : true;
        this.contactHours = data.contactHours || '9 AM - 6 PM, Mon-Fri';
        
        // ============================================
        // 📈 ANALYTICS (Public)
        // ============================================
        this.views = data.views || 0;
        this.downloads = data.downloads || 0;
        this.likes = data.likes || 0;
        this.rating = data.rating || 0;
        this.ratingCount = data.ratingCount || 0;
        this.shareCount = data.shareCount || 0;
        this.saveCount = data.saveCount || 0;
        this.reportCount = data.reportCount || 0;
        this.clickCount = data.clickCount || 0;
        this.uniqueViewers = data.uniqueViewers || 0;
        this.wishlistCount = data.wishlistCount || 0;
        this.cartAddCount = data.cartAddCount || 0;
        
        // ============================================
        // 👤 SELLER INFORMATION
        // ============================================
        this.sellerId = data.sellerId || '';
        this.sellerName = data.sellerName || '';
        this.sellerPhoto = data.sellerPhoto || '';
        this.sellerEmail = data.sellerEmail || '';
        this.sellerPhone = data.sellerPhone || '';
        this.sellerRating = data.sellerRating || 0;
        this.sellerTotalSales = data.sellerTotalSales || 0;
        this.sellerTotalProducts = data.sellerTotalProducts || 0;
        this.sellerVerified = data.sellerVerified || false;
        this.sellerJoinedAt = data.sellerJoinedAt ? new Date(data.sellerJoinedAt) : null;
        this.sellerResponseRate = data.sellerResponseRate || 100;
        this.sellerResponseTime = data.sellerResponseTime || '1 hour';
        
        // ============================================
        // ⏰ TIMESTAMPS
        // ============================================
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
        this.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
        this.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
        this.lastViewedAt = data.lastViewedAt ? new Date(data.lastViewedAt) : null;
        this.lastPurchasedAt = data.lastPurchasedAt ? new Date(data.lastPurchasedAt) : null;
        
        // ============================================
        // 🏷️ STATUS FLAGS
        // ============================================
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.isFeatured = data.isFeatured || false;
        this.isTrending = data.isTrending || false;
        this.isVerified = data.isVerified || false;
        this.isReported = data.isReported || false;
        this.isBlocked = data.isBlocked || false;
        this.isDeleted = data.isDeleted || false;
        this.isDraft = data.isDraft || false;
        this.isPending = data.isPending || false;
        this.isApproved = data.isApproved !== undefined ? data.isApproved : true;
        this.isHighlighted = data.isHighlighted || false;
        this.isSponsored = data.isSponsored || false;
        this.isExclusive = data.isExclusive || false;
        this.isLimited = data.isLimited || false;
        this.isBestseller = data.isBestseller || false;
        this.isNew = data.isNew !== undefined ? data.isNew : true;
        this.isOnSale = data.isOnSale !== undefined ? data.isOnSale : (this.discount > 0);
        this.isPromoted = data.isPromoted || false;
        this.isStaffPick = data.isStaffPick || false;
        
        // ============================================
        // 🎯 TAGS & CATEGORIES
        // ============================================
        this.categoryTree = data.categoryTree || [];
        this.categoryPath = data.categoryPath || '';
        this.featuredTags = Array.isArray(data.featuredTags) ? [...data.featuredTags] : [];
        this.targetAudience = data.targetAudience || 'all'; // 'all' | 'beginners' | 'intermediate' | 'advanced' | 'professional' | 'enterprise'
        this.suitableFor = Array.isArray(data.suitableFor) ? [...data.suitableFor] : [];
        this.useCases = Array.isArray(data.useCases) ? [...data.useCases] : [];
        this.industry = data.industry || '';
        this.platform = data.platform || ''; // 'web' | 'mobile' | 'desktop' | 'all'
        
        // ============================================
        // 📝 CONTENT DETAILS
        // ============================================
        this.highlights = Array.isArray(data.highlights) ? [...data.highlights] : [];
        this.features = Array.isArray(data.features) ? [...data.features] : [];
        this.benefits = Array.isArray(data.benefits) ? [...data.benefits] : [];
        this.specifications = data.specifications || {};
        this.requirements = Array.isArray(data.requirements) ? [...data.requirements] : [];
        this.includedItems = Array.isArray(data.includedItems) ? [...data.includedItems] : [];
        this.compatibility = data.compatibility || '';
        this.version = data.version || '1.0';
        this.updateLog = Array.isArray(data.updateLog) ? [...data.updateLog] : [];
        this.changelog = data.changelog || '';
        this.releaseNotes = data.releaseNotes || '';
        
        // ============================================
        // 📦 BUNDLE & VARIANT
        // ============================================
        this.isBundle = data.isBundle || false;
        this.bundleItems = Array.isArray(data.bundleItems) ? [...data.bundleItems] : [];
        this.bundleDiscount = data.bundleDiscount || 0;
        this.bundlePrice = data.bundlePrice || 0;
        
        this.hasVariants = data.hasVariants || false;
        this.variants = Array.isArray(data.variants) ? [...data.variants] : [];
        this.variantTypes = data.variantTypes || []; // ['color', 'size', 'style']
        this.defaultVariant = data.defaultVariant || null;
        
        // ============================================
        // 🛒 CART & WISHLIST
        // ============================================
        this.cartQuantity = data.cartQuantity || 0;
        this.isInCart = data.isInCart || false;
        this.isInWishlist = data.isInWishlist || false;
        this.addedToCartAt = data.addedToCartAt ? new Date(data.addedToCartAt) : null;
        this.addedToWishlistAt = data.addedToWishlistAt ? new Date(data.addedToWishlistAt) : null;
        
        // ============================================
        // ⭐ REVIEWS & RATINGS
        // ============================================
        this.reviews = Array.isArray(data.reviews) ? [...data.reviews] : [];
        this.reviewSummary = data.reviewSummary || {
            total: 0,
            average: 0,
            breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            verified: 0,
            unverified: 0,
            withImages: 0,
            withVideos: 0
        };
        this.topReviews = Array.isArray(data.topReviews) ? [...data.topReviews] : [];
        this.recentReviews = Array.isArray(data.recentReviews) ? [...data.recentReviews] : [];
        
        // ============================================
        // 📈 PRIVATE STATS (Seller Only)
        // ============================================
        this.privateViews = data.privateViews || 0;
        this.privateStats = {
            dailyViews: data.privateStats?.dailyViews || {},
            dailyDownloads: data.privateStats?.dailyDownloads || {},
            dailySales: data.privateStats?.dailySales || {},
            weeklyViews: data.privateStats?.weeklyViews || {},
            weeklyDownloads: data.privateStats?.weeklyDownloads || {},
            weeklySales: data.privateStats?.weeklySales || {},
            monthlyViews: data.privateStats?.monthlyViews || {},
            monthlyDownloads: data.privateStats?.monthlyDownloads || {},
            monthlySales: data.privateStats?.monthlySales || {},
            deviceInfo: data.privateStats?.deviceInfo || { mobile: 0, desktop: 0, tablet: 0 },
            locationStats: data.privateStats?.locationStats || {},
            referrerStats: data.privateStats?.referrerStats || {},
            conversionRate: data.privateStats?.conversionRate || 0,
            bounceRate: data.privateStats?.bounceRate || 0,
            averageTimeSpent: data.privateStats?.averageTimeSpent || 0,
            topKeywords: data.privateStats?.topKeywords || [],
            topReferrers: data.privateStats?.topReferrers || [],
            customerRetention: data.privateStats?.customerRetention || 0,
            averageOrderValue: data.privateStats?.averageOrderValue || 0
        };
        
        // ============================================
        // 💰 PAYMENT & COMMISSION
        // ============================================
        this.commission = data.commission || 5; // Percentage
        this.commissionAmount = data.commissionAmount || 0;
        this.netAmount = data.netAmount || 0;
        this.paymentMethods = Array.isArray(data.paymentMethods) ? [...data.paymentMethods] : ['card', 'paypal', 'crypto'];
        this.installmentAvailable = data.installmentAvailable || false;
        this.installmentPlans = Array.isArray(data.installmentPlans) ? [...data.installmentPlans] : [];
        this.taxIncluded = data.taxIncluded !== undefined ? data.taxIncluded : true;
        this.taxRate = data.taxRate || 0;
        
        // ============================================
        // 📋 POLICIES
        // ============================================
        this.policies = {
            refund: data.policies?.refund || 'No refund on digital products',
            exchange: data.policies?.exchange || 'No exchange on digital products',
            warranty: data.policies?.warranty || 'No warranty on digital products',
            cancellation: data.policies?.cancellation || 'Cancellation within 24 hours',
            privacy: data.policies?.privacy || 'Privacy policy applies',
            shipping: data.policies?.shipping || 'Standard shipping applies',
            return: data.policies?.return || 'Returns accepted within 30 days',
            ...data.policies
        };
        
        // ============================================
        // 🔗 LINKS & SOCIAL
        // ============================================
        this.website = data.website || '';
        this.demoUrl = data.demoUrl || '';
        this.supportUrl = data.supportUrl || '';
        this.documentationUrl = data.documentationUrl || '';
        this.purchaseUrl = data.purchaseUrl || '';
        this.affiliateUrl = data.affiliateUrl || '';
        this.socialLinks = data.socialLinks || {};
        
        // ============================================
        // 📎 ATTACHMENTS
        // ============================================
        this.attachments = Array.isArray(data.attachments) ? [...data.attachments] : [];
        this.documents = Array.isArray(data.documents) ? [...data.documents] : [];
        this.licenseFile = data.licenseFile || '';
        this.licenseType = data.licenseType || 'standard'; // 'standard' | 'extended' | 'commercial' | 'personal'
        
        // ============================================
        // 🎨 CUSTOMIZATION
        // ============================================
        this.customizable = data.customizable || false;
        this.customizationOptions = Array.isArray(data.customizationOptions) ? [...data.customizationOptions] : [];
        this.customizationFee = data.customizationFee || 0;
        this.customizationLeadTime = data.customizationLeadTime || '3-5 days';
        
        // ============================================
        // 🔍 SEO & META
        // ============================================
        this.metaTitle = data.metaTitle || '';
        this.metaDescription = data.metaDescription || '';
        this.metaKeywords = Array.isArray(data.metaKeywords) ? [...data.metaKeywords] : [];
        this.ogImage = data.ogImage || this.thumbnail || (this.images && this.images[0]) || '';
        this.ogTitle = data.ogTitle || this.metaTitle || this.title;
        this.ogDescription = data.ogDescription || this.metaDescription || this.shortDescription || this.description;
        this.canonicalUrl = data.canonicalUrl || '';
        this.structuredData = data.structuredData || {};
        this.schema = data.schema || {};
        
        // ============================================
        // 📝 NOTES & METADATA
        // ============================================
        this.notes = data.notes || '';
        this.customFields = data.customFields || {};
        this.metadata = data.metadata || {};
        this.internalNotes = data.internalNotes || '';
        this.adminNotes = data.adminNotes || '';
        
        // ============================================
        // 🔄 SYNC & VERSION
        // ============================================
        this.lastSync = data.lastSync ? new Date(data.lastSync) : new Date();
        this.syncVersion = data.syncVersion || 1;
        this.appVersion = data.appVersion || '3.0.0';
        
        // ============================================
        // 📊 FEED ALGORITHM SCORES
        // ============================================
        this.followScore = data.followScore || 0;
        this.interestScore = data.interestScore || 0;
        this.engagementScore = data.engagementScore || 0;
        this.timeScore = data.timeScore || 0;
        this.finalScore = data.finalScore || 0;
        
        // ============================================
        // 🎯 RECOMMENDATION
        // ============================================
        this.recommendationScore = data.recommendationScore || 0;
        this.relatedProducts = Array.isArray(data.relatedProducts) ? [...data.relatedProducts] : [];
        this.similarProducts = Array.isArray(data.similarProducts) ? [...data.similarProducts] : [];
        this.alsoBought = Array.isArray(data.alsoBought) ? [...data.alsoBought] : [];
        
        // ============================================
        // 🌐 MULTI-LANGUAGE
        // ============================================
        this.translations = data.translations || {};
        this.defaultLanguage = data.defaultLanguage || 'en';
        this.availableLanguages = data.availableLanguages || ['en'];
    }

    // ============================================
    // ID GENERATION
    // ============================================

    /**
     * Generate a unique product ID
     * @returns {string} Unique ID
     */
    generateId() {
        return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // ============================================
    // VALIDATION
    // ============================================

    /**
     * Validate product data
     * @param {Object} options - Validation options
     * @param {boolean} options.strict - Strict validation
     * @param {Array<Category>} options.categories - Categories for validation
     * @returns {Object} Validation result { isValid, errors, warnings }
     */
    validate(options = {}) {
        const errors = [];
        const warnings = [];
        const { strict = false, categories = [] } = options;

        // === BASIC REQUIRED ===
        if (!this.title || this.title.trim() === '') {
            errors.push('Product title is required');
        }
        if (this.title && (this.title.length < 3 || this.title.length > 100)) {
            errors.push('Product title must be between 3 and 100 characters');
        }
        if (!this.description || this.description.trim() === '') {
            errors.push('Product description is required');
        }
        if (this.description && this.description.length > 10000) {
            warnings.push('Description exceeds 10000 characters - consider shortening');
        }
        if (!this.category) {
            errors.push('Category is required');
        }
        if (!this.sellerId) {
            errors.push('Seller ID is required');
        }

        // === CATEGORY VALIDATION ===
        if (this.category && categories.length > 0) {
            const categoryExists = categories.some(c => c.id === this.category || c.slug === this.category);
            if (!categoryExists) {
                warnings.push('Category may not exist in the system');
            }
        }

        // === IMAGES ===
        if (!this.images || this.images.length === 0) {
            errors.push('At least one image is required');
        }
        if (this.images && this.images.length > 20) {
            warnings.push('More than 20 images - consider reducing');
        }
        if (this.images && this.images.some(img => !img || img.trim() === '')) {
            errors.push('All image URLs must be valid');
        }

        // === PRICE ===
        if (this.isPaid && this.price <= 0) {
            errors.push('Price must be greater than 0 for paid products');
        }
        if (this.discount < 0 || this.discount > 100) {
            warnings.push('Discount must be between 0 and 100');
        }
        if (this.discount > 0 && this.price <= 0) {
            warnings.push('Discount on free product - no effect');
        }

        // === PRODUCT TYPE ===
        const validTypes = ['digital', 'physical', 'service', 'hybrid'];
        if (this.productType && !validTypes.includes(this.productType)) {
            errors.push(`Invalid product type. Must be one of: ${validTypes.join(', ')}`);
        }

        // === QUANTITY ===
        if (this.isPhysical && this.quantity <= 0) {
            warnings.push('Quantity is 0 - product will show as out of stock');
        }
        if (this.quantity < 0) {
            errors.push('Quantity cannot be negative');
        }

        // === SHIPPING ===
        if (this.isPhysical && !this.shipping.available) {
            warnings.push('Shipping not available for physical product');
        }
        if (this.isPhysical && !this.shipping.cost && !this.shipping.freeShipping) {
            warnings.push('Shipping cost not specified for physical product');
        }

        // === LOCATION ===
        if (this.isPhysical && !this.location.city) {
            warnings.push('Location not specified for physical product');
        }
        if (this.isPhysical && !this.location.country) {
            warnings.push('Country not specified for physical product');
        }

        // === FILE ===
        if (this.isDigital && !this.downloadUrl && !this.driveFileId) {
            errors.push('Either download URL or drive file ID is required for digital product');
        }
        if (this.isDigital && !this.fileType) {
            warnings.push('File type not specified for digital product');
        }

        // === TAGS ===
        if (this.tags && this.tags.length > 30) {
            warnings.push('Maximum 30 tags recommended');
        }
        if (this.tags && this.tags.some(t => !t || t.trim() === '')) {
            errors.push('Tags cannot be empty');
        }

        // === RATING ===
        if (this.rating < 0 || this.rating > 5) {
            warnings.push('Rating must be between 0 and 5');
        }

        // === CONTACT ===
        if (!this.contactMethod) {
            warnings.push('Contact method not specified');
        }
        if (this.contactMethod === 'email' && !this.contactEmail) {
            warnings.push('Contact email required when contact method is email');
        }
        if (this.contactMethod === 'phone' && !this.contactPhone) {
            warnings.push('Contact phone required when contact method is phone');
        }

        // === URL VALIDATION ===
        if (this.videoUrl && !this.isValidUrl(this.videoUrl)) {
            warnings.push('Invalid video URL format');
        }
        if (this.demoUrl && !this.isValidUrl(this.demoUrl)) {
            warnings.push('Invalid demo URL format');
        }
        if (this.supportUrl && !this.isValidUrl(this.supportUrl)) {
            warnings.push('Invalid support URL format');
        }

        // === BUNDLE ===
        if (this.isBundle && (!this.bundleItems || this.bundleItems.length < 2)) {
            warnings.push('Bundle should have at least 2 items');
        }

        // === VARIANTS ===
        if (this.hasVariants && (!this.variants || this.variants.length < 2)) {
            warnings.push('Variants should have at least 2 options');
        }

        // === STRICT VALIDATION ===
        if (strict) {
            if (!this.sellerName || this.sellerName.trim() === '') {
                errors.push('Seller name is required');
            }
            if (!this.thumbnail) {
                errors.push('Thumbnail is required');
            }
            if (this.isPaid && !this.currency) {
                errors.push('Currency is required for paid products');
            }
        }

        return {
            isValid: errors.length === 0,
            hasWarnings: warnings.length > 0,
            errors: errors,
            warnings: warnings
        };
    }

    /**
     * Validate URL format
     * @param {string} url - URL to validate
     * @returns {boolean} True if valid URL
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // ============================================
    // CONVERSION METHODS
    // ============================================

    /**
     * Convert to Firestore document
     * @param {Object} options - Conversion options
     * @param {boolean} options.includePrivate - Include private stats
     * @param {boolean} options.includeMetadata - Include metadata
     * @param {boolean} options.includeReviews - Include reviews
     * @returns {Object} Firestore document
     */
    toFirestore(options = {}) {
        const { includePrivate = false, includeMetadata = false, includeReviews = false } = options;

        const data = {
            // Basic
            title: this.title,
            description: this.description,
            shortDescription: this.shortDescription,
            category: this.category,
            subCategory: this.subCategory,
            tags: [...this.tags],

            // Media
            images: [...this.images],
            thumbnail: this.thumbnail,
            mockups: [...this.mockups],
            videoUrl: this.videoUrl,
            videoThumbnail: this.videoThumbnail,
            audioUrl: this.audioUrl,
            documentPreview: this.documentPreview,
            previewImages: [...this.previewImages],
            previewVideo: this.previewVideo,
            previewAudio: this.previewAudio,
            previewDocument: this.previewDocument,

            // Product Type
            productType: this.productType,
            isDigital: this.isDigital,
            isPhysical: this.isPhysical,
            isService: this.isService,
            isHybrid: this.isHybrid,

            // Digital
            fileSize: this.fileSize,
            fileType: this.fileType,
            fileName: this.fileName,
            fileExtension: this.fileExtension,
            downloadUrl: this.downloadUrl,
            isLargeFile: this.isLargeFile,
            driveFileId: this.driveFileId,
            driveFileUrl: this.driveFileUrl,
            uploadProgress: this.uploadProgress,
            isUploading: this.isUploading,
            isUploaded: this.isUploaded,

            // Pricing
            price: this.price,
            discount: this.discount,
            discountedPrice: this.discountedPrice,
            currency: this.currency,
            isFree: this.isFree,
            isPaid: this.isPaid,
            priceType: this.priceType,
            subscriptionPrice: this.subscriptionPrice,
            subscriptionPeriod: this.subscriptionPeriod,

            // Location
            location: { ...this.location },
            shipping: { ...this.shipping },

            // Inventory
            quantity: this.quantity,
            availableQuantity: this.availableQuantity,
            reservedQuantity: this.reservedQuantity,
            soldQuantity: this.soldQuantity,
            minOrderQuantity: this.minOrderQuantity,
            maxOrderQuantity: this.maxOrderQuantity,
            condition: this.condition,
            isNegotiable: this.isNegotiable,
            isInStock: this.isInStock,
            backorderAvailable: this.backorderAvailable,
            estimatedRestockDate: this.estimatedRestockDate ? this.estimatedRestockDate.toISOString() : null,
            lowStockThreshold: this.lowStockThreshold,
            isLowStock: this.isLowStock,

            // Contact
            contactMethod: this.contactMethod,
            contactEmail: this.contactEmail,
            contactPhone: this.contactPhone,
            contactWhatsApp: this.contactWhatsApp,
            contactPreferred: this.contactPreferred,
            responseTime: this.responseTime,
            autoRespond: this.autoRespond,
            isContactAvailable: this.isContactAvailable,
            contactHours: this.contactHours,

            // Analytics
            views: this.views,
            downloads: this.downloads,
            likes: this.likes,
            rating: this.rating,
            ratingCount: this.ratingCount,
            shareCount: this.shareCount,
            saveCount: this.saveCount,
            reportCount: this.reportCount,
            clickCount: this.clickCount,
            uniqueViewers: this.uniqueViewers,
            wishlistCount: this.wishlistCount,
            cartAddCount: this.cartAddCount,

            // Seller
            sellerId: this.sellerId,
            sellerName: this.sellerName,
            sellerPhoto: this.sellerPhoto,
            sellerEmail: this.sellerEmail,
            sellerPhone: this.sellerPhone,
            sellerRating: this.sellerRating,
            sellerTotalSales: this.sellerTotalSales,
            sellerTotalProducts: this.sellerTotalProducts,
            sellerVerified: this.sellerVerified,
            sellerJoinedAt: this.sellerJoinedAt ? this.sellerJoinedAt.toISOString() : null,
            sellerResponseRate: this.sellerResponseRate,
            sellerResponseTime: this.sellerResponseTime,

            // Timestamps
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            publishedAt: this.publishedAt ? this.publishedAt.toISOString() : null,
            expiresAt: this.expiresAt ? this.expiresAt.toISOString() : null,
            lastViewedAt: this.lastViewedAt ? this.lastViewedAt.toISOString() : null,
            lastPurchasedAt: this.lastPurchasedAt ? this.lastPurchasedAt.toISOString() : null,

            // Status
            isActive: this.isActive,
            isFeatured: this.isFeatured,
            isTrending: this.isTrending,
            isVerified: this.isVerified,
            isReported: this.isReported,
            isBlocked: this.isBlocked,
            isDeleted: this.isDeleted,
            isDraft: this.isDraft,
            isPending: this.isPending,
            isApproved: this.isApproved,
            isHighlighted: this.isHighlighted,
            isSponsored: this.isSponsored,
            isExclusive: this.isExclusive,
            isLimited: this.isLimited,
            isBestseller: this.isBestseller,
            isNew: this.isNew,
            isOnSale: this.isOnSale,
            isPromoted: this.isPromoted,
            isStaffPick: this.isStaffPick,

            // Categories & Tags
            categoryTree: this.categoryTree,
            categoryPath: this.categoryPath,
            featuredTags: [...this.featuredTags],
            targetAudience: this.targetAudience,
            suitableFor: [...this.suitableFor],
            useCases: [...this.useCases],
            industry: this.industry,
            platform: this.platform,

            // Content
            highlights: [...this.highlights],
            features: [...this.features],
            benefits: [...this.benefits],
            specifications: this.specifications,
            requirements: [...this.requirements],
            includedItems: [...this.includedItems],
            compatibility: this.compatibility,
            version: this.version,
            updateLog: [...this.updateLog],
            changelog: this.changelog,
            releaseNotes: this.releaseNotes,

            // Bundle
            isBundle: this.isBundle,
            bundleItems: [...this.bundleItems],
            bundleDiscount: this.bundleDiscount,
            bundlePrice: this.bundlePrice,

            // Variants
            hasVariants: this.hasVariants,
            variants: [...this.variants],
            variantTypes: this.variantTypes,
            defaultVariant: this.defaultVariant,

            // Payment
            commission: this.commission,
            commissionAmount: this.commissionAmount,
            netAmount: this.netAmount,
            paymentMethods: [...this.paymentMethods],
            installmentAvailable: this.installmentAvailable,
            installmentPlans: [...this.installmentPlans],
            taxIncluded: this.taxIncluded,
            taxRate: this.taxRate,

            // Policies
            policies: { ...this.policies },

            // Links
            website: this.website,
            demoUrl: this.demoUrl,
            supportUrl: this.supportUrl,
            documentationUrl: this.documentationUrl,
            purchaseUrl: this.purchaseUrl,
            affiliateUrl: this.affiliateUrl,
            socialLinks: this.socialLinks,

            // Attachments
            attachments: [...this.attachments],
            documents: [...this.documents],
            licenseFile: this.licenseFile,
            licenseType: this.licenseType,

            // Customization
            customizable: this.customizable,
            customizationOptions: [...this.customizationOptions],
            customizationFee: this.customizationFee,
            customizationLeadTime: this.customizationLeadTime,

            // SEO
            metaTitle: this.metaTitle,
            metaDescription: this.metaDescription,
            metaKeywords: [...this.metaKeywords],
            ogImage: this.ogImage,
            ogTitle: this.ogTitle,
            ogDescription: this.ogDescription,
            canonicalUrl: this.canonicalUrl,
            structuredData: this.structuredData,
            schema: this.schema,

            // Notes
            notes: this.notes,
            customFields: this.customFields,
            internalNotes: this.internalNotes,
            adminNotes: this.adminNotes,

            // Sync
            lastSync: this.lastSync.toISOString(),
            syncVersion: this.syncVersion,
            appVersion: this.appVersion,

            // Algorithm Scores
            followScore: this.followScore,
            interestScore: this.interestScore,
            engagementScore: this.engagementScore,
            timeScore: this.timeScore,
            finalScore: this.finalScore,

            // Recommendation
            recommendationScore: this.recommendationScore,
            relatedProducts: [...this.relatedProducts],
            similarProducts: [...this.similarProducts],
            alsoBought: [...this.alsoBought],

            // Multi-language
            translations: this.translations,
            defaultLanguage: this.defaultLanguage,
            availableLanguages: [...this.availableLanguages]
        };

        if (includePrivate) {
            data.privateViews = this.privateViews;
            data.privateStats = { ...this.privateStats };
        }

        if (includeMetadata) {
            data.metadata = this.metadata;
        }

        if (includeReviews) {
            data.reviews = [...this.reviews];
            data.reviewSummary = { ...this.reviewSummary };
            data.topReviews = [...this.topReviews];
            data.recentReviews = [...this.recentReviews];
        }

        return data;
    }

    /**
     * Convert to JSON
     * @param {Object} options - Conversion options
     * @param {boolean} options.includePrivate - Include private stats
     * @param {boolean} options.includeReviews - Include reviews
     * @param {boolean} options.includeMetadata - Include metadata
     * @returns {Object} JSON object
     */
    toJSON(options = {}) {
        const { includePrivate = false, includeReviews = false, includeMetadata = false } = options;

        const data = {
            id: this.id,
            title: this.title,
            description: this.description,
            shortDescription: this.shortDescription,
            category: this.category,
            subCategory: this.subCategory,
            tags: [...this.tags],
            images: [...this.images],
            thumbnail: this.thumbnail,
            mockups: [...this.mockups],
            videoUrl: this.videoUrl,
            videoThumbnail: this.videoThumbnail,
            audioUrl: this.audioUrl,
            documentPreview: this.documentPreview,
            productType: this.productType,
            isDigital: this.isDigital,
            isPhysical: this.isPhysical,
            isService: this.isService,
            isHybrid: this.isHybrid,
            fileSize: this.fileSize,
            fileType: this.fileType,
            fileName: this.fileName,
            fileExtension: this.fileExtension,
            downloadUrl: this.downloadUrl,
            isLargeFile: this.isLargeFile,
            driveFileId: this.driveFileId,
            driveFileUrl: this.driveFileUrl,
            price: this.price,
            discount: this.discount,
            discountedPrice: this.discountedPrice,
            currency: this.currency,
            isFree: this.isFree,
            isPaid: this.isPaid,
            priceType: this.priceType,
            subscriptionPrice: this.subscriptionPrice,
            subscriptionPeriod: this.subscriptionPeriod,
            location: { ...this.location },
            shipping: { ...this.shipping },
            quantity: this.quantity,
            availableQuantity: this.availableQuantity,
            reservedQuantity: this.reservedQuantity,
            soldQuantity: this.soldQuantity,
            minOrderQuantity: this.minOrderQuantity,
            maxOrderQuantity: this.maxOrderQuantity,
            condition: this.condition,
            isNegotiable: this.isNegotiable,
            isInStock: this.isInStock,
            backorderAvailable: this.backorderAvailable,
            estimatedRestockDate: this.estimatedRestockDate ? this.estimatedRestockDate.toISOString() : null,
            lowStockThreshold: this.lowStockThreshold,
            isLowStock: this.isLowStock,
            contactMethod: this.contactMethod,
            contactEmail: this.contactEmail,
            contactPhone: this.contactPhone,
            contactWhatsApp: this.contactWhatsApp,
            contactPreferred: this.contactPreferred,
            responseTime: this.responseTime,
            isContactAvailable: this.isContactAvailable,
            contactHours: this.contactHours,
            views: this.views,
            downloads: this.downloads,
            likes: this.likes,
            rating: this.rating,
            ratingCount: this.ratingCount,
            shareCount: this.shareCount,
            saveCount: this.saveCount,
            reportCount: this.reportCount,
            clickCount: this.clickCount,
            uniqueViewers: this.uniqueViewers,
            wishlistCount: this.wishlistCount,
            cartAddCount: this.cartAddCount,
            sellerId: this.sellerId,
            sellerName: this.sellerName,
            sellerPhoto: this.sellerPhoto,
            sellerEmail: this.sellerEmail,
            sellerPhone: this.sellerPhone,
            sellerRating: this.sellerRating,
            sellerTotalSales: this.sellerTotalSales,
            sellerTotalProducts: this.sellerTotalProducts,
            sellerVerified: this.sellerVerified,
            sellerJoinedAt: this.sellerJoinedAt ? this.sellerJoinedAt.toISOString() : null,
            sellerResponseRate: this.sellerResponseRate,
            sellerResponseTime: this.sellerResponseTime,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            publishedAt: this.publishedAt ? this.publishedAt.toISOString() : null,
            expiresAt: this.expiresAt ? this.expiresAt.toISOString() : null,
            lastViewedAt: this.lastViewedAt ? this.lastViewedAt.toISOString() : null,
            lastPurchasedAt: this.lastPurchasedAt ? this.lastPurchasedAt.toISOString() : null,
            isActive: this.isActive,
            isFeatured: this.isFeatured,
            isTrending: this.isTrending,
            isVerified: this.isVerified,
            isReported: this.isReported,
            isBlocked: this.isBlocked,
            isDeleted: this.isDeleted,
            isDraft: this.isDraft,
            isPending: this.isPending,
            isApproved: this.isApproved,
            isHighlighted: this.isHighlighted,
            isSponsored: this.isSponsored,
            isExclusive: this.isExclusive,
            isLimited: this.isLimited,
            isBestseller: this.isBestseller,
            isNew: this.isNew,
            isOnSale: this.isOnSale,
            isPromoted: this.isPromoted,
            isStaffPick: this.isStaffPick,
            categoryTree: this.categoryTree,
            categoryPath: this.categoryPath,
            featuredTags: [...this.featuredTags],
            targetAudience: this.targetAudience,
            suitableFor: [...this.suitableFor],
            useCases: [...this.useCases],
            industry: this.industry,
            platform: this.platform,
            highlights: [...this.highlights],
            features: [...this.features],
            benefits: [...this.benefits],
            specifications: this.specifications,
            requirements: [...this.requirements],
            includedItems: [...this.includedItems],
            compatibility: this.compatibility,
            version: this.version,
            updateLog: [...this.updateLog],
            changelog: this.changelog,
            releaseNotes: this.releaseNotes,
            isBundle: this.isBundle,
            bundleItems: [...this.bundleItems],
            bundleDiscount: this.bundleDiscount,
            bundlePrice: this.bundlePrice,
            hasVariants: this.hasVariants,
            variants: [...this.variants],
            variantTypes: this.variantTypes,
            defaultVariant: this.defaultVariant,
            commission: this.commission,
            commissionAmount: this.commissionAmount,
            netAmount: this.netAmount,
            paymentMethods: [...this.paymentMethods],
            installmentAvailable: this.installmentAvailable,
            installmentPlans: [...this.installmentPlans],
            taxIncluded: this.taxIncluded,
            taxRate: this.taxRate,
            policies: { ...this.policies },
            website: this.website,
            demoUrl: this.demoUrl,
            supportUrl: this.supportUrl,
            documentationUrl: this.documentationUrl,
            purchaseUrl: this.purchaseUrl,
            affiliateUrl: this.affiliateUrl,
            socialLinks: this.socialLinks,
            attachments: [...this.attachments],
            documents: [...this.documents],
            licenseFile: this.licenseFile,
            licenseType: this.licenseType,
            customizable: this.customizable,
            customizationOptions: [...this.customizationOptions],
            customizationFee: this.customizationFee,
            customizationLeadTime: this.customizationLeadTime,
            metaTitle: this.metaTitle,
            metaDescription: this.metaDescription,
            metaKeywords: [...this.metaKeywords],
            ogImage: this.ogImage,
            ogTitle: this.ogTitle,
            ogDescription: this.ogDescription,
            canonicalUrl: this.canonicalUrl,
            structuredData: this.structuredData,
            schema: this.schema,
            notes: this.notes,
            customFields: this.customFields,
            internalNotes: this.internalNotes,
            adminNotes: this.adminNotes,
            lastSync: this.lastSync.toISOString(),
            syncVersion: this.syncVersion,
            appVersion: this.appVersion,
            followScore: this.followScore,
            interestScore: this.interestScore,
            engagementScore: this.engagementScore,
            timeScore: this.timeScore,
            finalScore: this.finalScore,
            recommendationScore: this.recommendationScore,
            relatedProducts: [...this.relatedProducts],
            similarProducts: [...this.similarProducts],
            alsoBought: [...this.alsoBought],
            translations: this.translations,
            defaultLanguage: this.defaultLanguage,
            availableLanguages: [...this.availableLanguages]
        };

        if (includePrivate) {
            data.privateViews = this.privateViews;
            data.privateStats = { ...this.privateStats };
        }

        if (includeMetadata) {
            data.metadata = this.metadata;
        }

        if (includeReviews) {
            data.reviews = [...this.reviews];
            data.reviewSummary = { ...this.reviewSummary };
            data.topReviews = [...this.topReviews];
            data.recentReviews = [...this.recentReviews];
        }

        return data;
    }

    /**
     * Get public product data
     * @param {Object} options - Options
     * @param {boolean} options.includeStats - Include statistics
     * @param {boolean} options.includeSeller - Include seller info
     * @returns {Object} Public product data
     */
    getPublicData(options = {}) {
        const { includeStats = true, includeSeller = true } = options;

        const data = {
            id: this.id,
            title: this.title,
            description: this.description,
            shortDescription: this.shortDescription,
            category: this.category,
            subCategory: this.subCategory,
            tags: [...this.tags],
            images: [...this.images],
            thumbnail: this.thumbnail,
            mockups: [...this.mockups],
            videoUrl: this.videoUrl,
            videoThumbnail: this.videoThumbnail,
            audioUrl: this.audioUrl,
            productType: this.productType,
            isDigital: this.isDigital,
            isPhysical: this.isPhysical,
            isService: this.isService,
            isHybrid: this.isHybrid,
            price: this.price,
            discount: this.discount,
            discountedPrice: this.discountedPrice,
            currency: this.currency,
            isFree: this.isFree,
            isPaid: this.isPaid,
            priceType: this.priceType,
            location: { ...this.location },
            shipping: { ...this.shipping },
            condition: this.condition,
            isNegotiable: this.isNegotiable,
            isInStock: this.isInStock,
            quantity: this.quantity,
            contactMethod: this.contactMethod,
            responseTime: this.responseTime,
            isContactAvailable: this.isContactAvailable,
            contactHours: this.contactHours,
            isActive: this.isActive,
            isFeatured: this.isFeatured,
            isTrending: this.isTrending,
            isVerified: this.isVerified,
            isHighlighted: this.isHighlighted,
            isSponsored: this.isSponsored,
            isExclusive: this.isExclusive,
            isLimited: this.isLimited,
            isBestseller: this.isBestseller,
            isNew: this.isNew,
            isOnSale: this.isOnSale,
            isBundle: this.isBundle,
            hasVariants: this.hasVariants,
            variantTypes: this.variantTypes,
            customizable: this.customizable,
            customizationOptions: [...this.customizationOptions],
            highlights: [...this.highlights],
            features: [...this.features],
            benefits: [...this.benefits],
            specifications: this.specifications,
            requirements: [...this.requirements],
            includedItems: [...this.includedItems],
            compatibility: this.compatibility,
            version: this.version,
            targetAudience: this.targetAudience,
            suitableFor: [...this.suitableFor],
            useCases: [...this.useCases],
            policies: { ...this.policies },
            demoUrl: this.demoUrl,
            supportUrl: this.supportUrl,
            documentationUrl: this.documentationUrl,
            licenseType: this.licenseType,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            publishedAt: this.publishedAt ? this.publishedAt.toISOString() : null
        };

        if (includeStats) {
            data.views = this.views;
            data.downloads = this.downloads;
            data.likes = this.likes;
            data.rating = this.rating;
            data.ratingCount = this.ratingCount;
            data.shareCount = this.shareCount;
            data.saveCount = this.saveCount;
            data.wishlistCount = this.wishlistCount;
            data.cartAddCount = this.cartAddCount;
        }

        if (includeSeller) {
            data.sellerId = this.sellerId;
            data.sellerName = this.sellerName;
            data.sellerPhoto = this.sellerPhoto;
            data.sellerRating = this.sellerRating;
            data.sellerTotalSales = this.sellerTotalSales;
            data.sellerTotalProducts = this.sellerTotalProducts;
            data.sellerVerified = this.sellerVerified;
            data.sellerJoinedAt = this.sellerJoinedAt ? this.sellerJoinedAt.toISOString() : null;
            data.sellerResponseRate = this.sellerResponseRate;
            data.sellerResponseTime = this.sellerResponseTime;
        }

        return data;
    }

    /**
     * Get seller data (includes private stats)
     * @returns {Object} Seller product data
     */
    getSellerData() {
        return {
            ...this.getPublicData({ includeStats: true, includeSeller: true }),
            privateViews: this.privateViews,
            privateStats: { ...this.privateStats },
            contactEmail: this.contactEmail,
            contactPhone: this.contactPhone,
            contactWhatsApp: this.contactWhatsApp,
            autoRespond: this.autoRespond,
            sellerEmail: this.sellerEmail,
            sellerPhone: this.sellerPhone,
            commission: this.commission,
            commissionAmount: this.commissionAmount,
            netAmount: this.netAmount,
            internalNotes: this.internalNotes,
            adminNotes: this.adminNotes,
            reportCount: this.reportCount,
            isReported: this.isReported,
            isBlocked: this.isBlocked,
            isDeleted: this.isDeleted,
            isPending: this.isPending,
            isApproved: this.isApproved
        };
    }

    /**
     * Get minimal product data
     * @returns {Object} Minimal product data
     */
    getMinimalData() {
        return {
            id: this.id,
            title: this.title,
            thumbnail: this.thumbnail,
            category: this.category,
            productType: this.productType,
            isFree: this.isFree,
            isPaid: this.isPaid,
            price: this.price,
            discountedPrice: this.discountedPrice,
            currency: this.currency,
            rating: this.rating,
            ratingCount: this.ratingCount,
            downloads: this.downloads,
            likes: this.likes,
            sellerName: this.sellerName,
            sellerPhoto: this.sellerPhoto,
            sellerVerified: this.sellerVerified,
            isFeatured: this.isFeatured,
            isTrending: this.isTrending,
            isNew: this.isNew,
            isBestseller: this.isBestseller,
            isOnSale: this.isOnSale,
            isInStock: this.isInStock,
            isPhysical: this.isPhysical,
            isDigital: this.isDigital,
            isService: this.isService,
            createdAt: this.createdAt.toISOString()
        };
    }

    /**
     * Get compact data for lists
     * @returns {Object} Compact product data
     */
    getCompactData() {
        return {
            id: this.id,
            title: this.title,
            thumbnail: this.thumbnail,
            productType: this.productType,
            price: this.price,
            discountedPrice: this.discountedPrice,
            currency: this.currency,
            rating: this.rating,
            ratingCount: this.ratingCount,
            isFree: this.isFree,
            isPaid: this.isPaid,
            isInStock: this.isInStock,
            isFeatured: this.isFeatured,
            isTrending: this.isTrending,
            isNew: this.isNew,
            sellerId: this.sellerId,
            sellerName: this.sellerName,
            sellerVerified: this.sellerVerified
        };
    }

    // ============================================
    // PRICE CALCULATION
    // ============================================

    /**
     * Calculate discounted price
     * @returns {number} Discounted price
     */
    calculateDiscountedPrice() {
        if (this.discount > 0 && this.discount <= 100) {
            return Math.round((this.price - (this.price * this.discount / 100)) * 100) / 100;
        }
        return this.price;
    }

    /**
     * Get formatted price
     * @param {string} locale - Locale
     * @param {string} currency - Currency code
     * @returns {string} Formatted price
     */
    getFormattedPrice(locale = 'en-US', currency = null) {
        const cur = currency || this.currency || 'USD';
        const price = this.getDiscountedPrice() || 0;
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: cur
        }).format(price);
    }

    /**
     * Get formatted original price
     * @param {string} locale - Locale
     * @param {string} currency - Currency code
     * @returns {string} Formatted original price
     */
    getFormattedOriginalPrice(locale = 'en-US', currency = null) {
        const cur = currency || this.currency || 'USD';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: cur
        }).format(this.price || 0);
    }

    /**
     * Get discount amount
     * @returns {number} Discount amount
     */
    getDiscountAmount() {
        return this.price - this.getDiscountedPrice();
    }

    /**
     * Get formatted file size
     * @returns {string} Formatted file size
     */
    getFormattedFileSize() {
        if (this.fileSize === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(this.fileSize) / Math.log(k));
        const size = (this.fileSize / Math.pow(k, i)).toFixed(1);
        return `${size} ${sizes[i]}`;
    }

    // ============================================
    // INVENTORY METHODS
    // ============================================

    /**
     * Check if product is in stock
     * @param {number} quantity - Quantity to check
     * @returns {boolean} True if in stock
     */
    hasStock(quantity = 1) {
        if (!this.isInStock) return false;
        if (this.availableQuantity === undefined) {
            return this.quantity >= quantity;
        }
        return this.availableQuantity >= quantity;
    }

    /**
     * Reduce stock
     * @param {number} quantity - Quantity to reduce
     * @returns {Product} Updated product (this)
     */
    reduceStock(quantity = 1) {
        if (!this.hasStock(quantity)) {
            throw new Error('Insufficient stock');
        }
        this.quantity = Math.max(0, this.quantity - quantity);
        this.availableQuantity = Math.max(0, (this.availableQuantity || this.quantity) - quantity);
        this.soldQuantity = (this.soldQuantity || 0) + quantity;
        if (this.quantity <= this.lowStockThreshold) {
            this.isLowStock = true;
        }
        if (this.quantity <= 0) {
            this.isInStock = false;
        }
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Increase stock
     * @param {number} quantity - Quantity to increase
     * @returns {Product} Updated product (this)
     */
    increaseStock(quantity = 1) {
        this.quantity = (this.quantity || 0) + quantity;
        this.availableQuantity = (this.availableQuantity || 0) + quantity;
        this.isInStock = true;
        if (this.quantity > this.lowStockThreshold) {
            this.isLowStock = false;
        }
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Reserve stock
     * @param {number} quantity - Quantity to reserve
     * @returns {Product} Updated product (this)
     */
    reserveStock(quantity = 1) {
        if (!this.hasStock(quantity)) {
            throw new Error('Insufficient stock');
        }
        this.reservedQuantity = (this.reservedQuantity || 0) + quantity;
        this.availableQuantity = Math.max(0, (this.availableQuantity || this.quantity) - quantity);
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Release reserved stock
     * @param {number} quantity - Quantity to release
     * @returns {Product} Updated product (this)
     */
    releaseReservedStock(quantity = 1) {
        this.reservedQuantity = Math.max(0, (this.reservedQuantity || 0) - quantity);
        this.availableQuantity = (this.availableQuantity || 0) + quantity;
        this.isInStock = true;
        this.updatedAt = new Date();
        return this;
    }

    // ============================================
    // ANALYTICS METHODS
    // ============================================

    /**
     * Increment views
     * @param {number} amount - Amount to increment
     * @param {Object} details - View details
     * @returns {Product} Updated product (this)
     */
    incrementViews(amount = 1, details = {}) {
        this.views = (this.views || 0) + amount;
        this.privateViews = (this.privateViews || 0) + amount;
        this.lastViewedAt = new Date();

        const date = new Date().toISOString().split('T')[0];
        this.privateStats.dailyViews[date] = (this.privateStats.dailyViews[date] || 0) + amount;

        if (details.device) {
            this.addDeviceView(details.device, amount);
        }
        if (details.country) {
            this.addLocationView(details.country, amount);
        }

        this.updatedAt = new Date();
        return this;
    }

    /**
     * Increment downloads
     * @param {number} amount - Amount to increment
     * @returns {Product} Updated product (this)
     */
    incrementDownloads(amount = 1) {
        this.downloads = (this.downloads || 0) + amount;
        const date = new Date().toISOString().split('T')[0];
        this.privateStats.dailyDownloads[date] = (this.privateStats.dailyDownloads[date] || 0) + amount;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Increment likes
     * @param {number} amount - Amount to increment
     * @returns {Product} Updated product (this)
     */
    incrementLikes(amount = 1) {
        this.likes = (this.likes || 0) + amount;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Increment shares
     * @param {number} amount - Amount to increment
     * @returns {Product} Updated product (this)
     */
    incrementShares(amount = 1) {
        this.shareCount = (this.shareCount || 0) + amount;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Increment saves
     * @param {number} amount - Amount to increment
     * @returns {Product} Updated product (this)
     */
    incrementSaves(amount = 1) {
        this.saveCount = (this.saveCount || 0) + amount;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Increment wishlist count
     * @param {number} amount - Amount to increment
     * @returns {Product} Updated product (this)
     */
    incrementWishlist(amount = 1) {
        this.wishlistCount = (this.wishlistCount || 0) + amount;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Increment cart add count
     * @param {number} amount - Amount to increment
     * @returns {Product} Updated product (this)
     */
    incrementCartAdd(amount = 1) {
        this.cartAddCount = (this.cartAddCount || 0) + amount;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Update rating
     * @param {number} newRating - New rating (1-5)
     * @param {number} count - Number of ratings
     * @returns {Product} Updated product (this)
     */
    updateRating(newRating, count = 1) {
        const totalRating = this.rating * this.ratingCount;
        this.ratingCount = (this.ratingCount || 0) + count;
        this.rating = (totalRating + (newRating * count)) / this.ratingCount;
        this.rating = Math.min(5, Math.max(0, this.rating));
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Add device view
     * @param {string} device - Device type
     * @param {number} count - Count
     * @returns {Product} Updated product (this)
     */
    addDeviceView(device, count = 1) {
        const validDevices = ['mobile', 'desktop', 'tablet', 'other'];
        if (validDevices.includes(device)) {
            this.privateStats.deviceInfo[device] = (this.privateStats.deviceInfo[device] || 0) + count;
        }
        return this;
    }

    /**
     * Add location view
     * @param {string} country - Country code
     * @param {number} count - Count
     * @returns {Product} Updated product (this)
     */
    addLocationView(country, count = 1) {
        if (country) {
            this.privateStats.locationStats[country] = (this.privateStats.locationStats[country] || 0) + count;
        }
        return this;
    }

    // ============================================
    // STATUS METHODS
    // ============================================

    /** @returns {boolean} Check if product is active */
    isActiveProduct() { return this.isActive === true && !this.isDeleted && !this.isBlocked; }

    /** @returns {boolean} Check if product is featured */
    isFeaturedProduct() { return this.isFeatured === true; }

    /** @returns {boolean} Check if product is trending */
    isTrendingProduct() { return this.isTrending === true; }

    /** @returns {boolean} Check if product is verified */
    isVerifiedProduct() { return this.isVerified === true; }

    /** @returns {boolean} Check if product is digital */
    isDigitalProduct() { return this.isDigital === true; }

    /** @returns {boolean} Check if product is physical */
    isPhysicalProduct() { return this.isPhysical === true; }

    /** @returns {boolean} Check if product is service */
    isServiceProduct() { return this.isService === true; }

    /** @returns {boolean} Check if product is hybrid */
    isHybridProduct() { return this.isHybrid === true; }

    /** @returns {boolean} Check if product is free */
    isFreeProduct() { return this.isFree === true; }

    /** @returns {boolean} Check if product is paid */
    isPaidProduct() { return this.isPaid === true; }

    /** @returns {boolean} Check if product is on sale */
    isOnSaleProduct() { return this.isOnSale === true || this.discount > 0; }

    /** @returns {boolean} Check if product is new */
    isNewProduct() { return this.isNew === true; }

    /** @returns {boolean} Check if product is bestseller */
    isBestsellerProduct() { return this.isBestseller === true; }

    /** @returns {boolean} Check if product is exclusive */
    isExclusiveProduct() { return this.isExclusive === true; }

    /** @returns {boolean} Check if product is limited */
    isLimitedProduct() { return this.isLimited === true; }

    /** @returns {boolean} Check if product is sponsored */
    isSponsoredProduct() { return this.isSponsored === true; }

    /** @returns {boolean} Check if product is bundle */
    isBundleProduct() { return this.isBundle === true; }

    /** @returns {boolean} Check if product has variants */
    hasVariantsProduct() { return this.hasVariants === true; }

    /** @returns {boolean} Check if product is negotiable */
    isNegotiableProduct() { return this.isNegotiable === true; }

    /** @returns {boolean} Check if product is in stock */
    isInStockProduct() { return this.isInStock === true && this.quantity > 0; }

    /** @returns {boolean} Check if product is low stock */
    isLowStockProduct() { return this.isLowStock === true && this.quantity > 0; }

    /** @returns {boolean} Check if product has video */
    hasVideo() { return this.videoUrl && this.videoUrl.trim() !== ''; }

    /** @returns {boolean} Check if product has audio */
    hasAudio() { return this.audioUrl && this.audioUrl.trim() !== ''; }

    /** @returns {boolean} Check if product has mockups */
    hasMockups() { return this.mockups && this.mockups.length > 0; }

    /** @returns {boolean} Check if product is large file */
    isLargeFileProduct() { return this.isLargeFile === true; }

    /** @returns {boolean} Check if product is draft */
    isDraftProduct() { return this.isDraft === true; }

    /** @returns {boolean} Check if product is pending */
    isPendingProduct() { return this.isPending === true; }

    /** @returns {boolean} Check if product is approved */
    isApprovedProduct() { return this.isApproved === true; }

    /** @returns {boolean} Check if product is deleted */
    isDeletedProduct() { return this.isDeleted === true; }

    /** @returns {boolean} Check if product is blocked */
    isBlockedProduct() { return this.isBlocked === true; }

    /** @returns {boolean} Check if product is reported */
    isReportedProduct() { return this.isReported === true; }

    /** @returns {boolean} Check if product is staff pick */
    isStaffPickProduct() { return this.isStaffPick === true; }

    /** @returns {boolean} Check if product is promoted */
    isPromotedProduct() { return this.isPromoted === true; }

    // ============================================
    // SHIPPING METHODS
    // ============================================

    /**
     * Get shipping cost
     * @param {string} country - Country code
     * @returns {number} Shipping cost
     */
    getShippingCost(country = 'US') {
        if (this.shipping.freeShipping) return 0;
        if (this.shipping.internationalShipping && country !== 'US') {
            return this.shipping.internationalCost || this.shipping.cost || 0;
        }
        return this.shipping.cost || 0;
    }

    /**
     * Get delivery estimate
     * @param {string} country - Country code
     * @returns {string} Delivery estimate
     */
    getDeliveryEstimate(country = 'US') {
        if (this.shipping.internationalShipping && country !== 'US') {
            return this.shipping.deliveryEstimate || `${parseInt(this.shipping.deliveryTime) + 5} days`;
        }
        return this.shipping.deliveryEstimate || this.shipping.deliveryTime || '3-5 days';
    }

    /**
     * Check if shipping is available
     * @param {string} country - Country code
     * @returns {boolean} True if shipping available
     */
    isShippingAvailable(country = 'US') {
        if (!this.shipping.available) return false;
        if (country === 'US') return true;
        return this.shipping.internationalShipping || false;
    }

    // ============================================
    // LOCATION METHODS
    // ============================================

    /**
     * Get formatted location string
     * @returns {string} Formatted location
     */
    getLocationString() {
        const parts = [];
        if (this.location.address) parts.push(this.location.address);
        if (this.location.city) parts.push(this.location.city);
        if (this.location.state) parts.push(this.location.state);
        if (this.location.country) parts.push(this.location.country);
        if (this.location.pincode) parts.push(this.location.pincode);
        return parts.join(', ');
    }

    /**
     * Get location coordinates
     * @returns {Object} Coordinates { lat, lng }
     */
    getCoordinates() {
        return {
            lat: this.location.lat || 0,
            lng: this.location.lng || 0
        };
    }

    /**
     * Check if location is set
     * @returns {boolean} True if location is set
     */
    hasLocation() {
        return !!(this.location.lat || this.location.lng || this.location.city || this.location.address);
    }

    // ============================================
    // VARIANT METHODS
    // ============================================

    /**
     * Add a variant
     * @param {Object} variant - Variant data
     * @returns {Product} Updated product (this)
     */
    addVariant(variant) {
        if (this.hasVariants) {
            variant.id = variant.id || `var_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            this.variants.push(variant);
            this.updatedAt = new Date();
            if (this.variants.length === 1) {
                this.defaultVariant = variant.id;
            }
        }
        return this;
    }

    /**
     * Remove a variant
     * @param {string} variantId - Variant ID
     * @returns {Product} Updated product (this)
     */
    removeVariant(variantId) {
        if (this.hasVariants) {
            this.variants = this.variants.filter(v => v.id !== variantId);
            if (this.defaultVariant === variantId) {
                this.defaultVariant = this.variants.length > 0 ? this.variants[0].id : null;
            }
            this.updatedAt = new Date();
        }
        return this;
    }

    /**
     * Get variant by ID
     * @param {string} variantId - Variant ID
     * @returns {Object|null} Variant or null
     */
    getVariant(variantId) {
        return this.variants.find(v => v.id === variantId) || null;
    }

    /**
     * Get variant by options
     * @param {Object} options - Variant options
     * @returns {Object|null} Variant or null
     */
    getVariantByOptions(options) {
        return this.variants.find(v => {
            return Object.keys(options).every(key => v.options && v.options[key] === options[key]);
        }) || null;
    }

    /**
     * Get default variant
     * @returns {Object|null} Default variant or null
     */
    getDefaultVariant() {
        if (!this.defaultVariant) return this.variants[0] || null;
        return this.getVariant(this.defaultVariant);
    }

    // ============================================
    // BUNDLE METHODS
    // ============================================

    /**
     * Add bundle item
     * @param {Object} item - Bundle item
     * @returns {Product} Updated product (this)
     */
    addBundleItem(item) {
        if (this.isBundle) {
            item.id = item.id || `bundle_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            this.bundleItems.push(item);
            this.updatedAt = new Date();
        }
        return this;
    }

    /**
     * Remove bundle item
     * @param {string} itemId - Bundle item ID
     * @returns {Product} Updated product (this)
     */
    removeBundleItem(itemId) {
        if (this.isBundle) {
            this.bundleItems = this.bundleItems.filter(item => item.id !== itemId);
            this.updatedAt = new Date();
        }
        return this;
    }

    /**
     * Calculate bundle price
     * @returns {number} Bundle price
     */
    calculateBundlePrice() {
        if (!this.isBundle || !this.bundleItems.length) return 0;
        const total = this.bundleItems.reduce((sum, item) => sum + (item.price || 0), 0);
        if (this.bundleDiscount > 0) {
            return Math.round((total - (total * this.bundleDiscount / 100)) * 100) / 100;
        }
        return total;
    }

    // ============================================
    // SEARCH HELPERS
    // ============================================

    /**
     * Get searchable text
     * @returns {string} Searchable text
     */
    getSearchText() {
        const parts = [
            this.title,
            this.description,
            this.shortDescription,
            ...this.tags,
            this.category,
            this.subCategory,
            ...this.featuredTags,
            ...this.highlights,
            ...this.features,
            ...this.benefits,
            ...this.suitableFor,
            ...this.useCases,
            this.compatibility,
            this.industry,
            this.platform
        ];
        return parts.filter(p => p).join(' ').toLowerCase();
    }

    /**
     * Check if product matches search query
     * @param {string} query - Search query
     * @returns {boolean} True if matches
     */
    matchesSearch(query) {
        if (!query || query.trim() === '') return true;
        const search = query.toLowerCase().trim();
        return this.getSearchText().includes(search);
    }

    // ============================================
    // SEO METHODS
    // ============================================

    /**
     * Get SEO data
     * @param {Object} options - Options
     * @param {string} options.baseUrl - Base URL
     * @param {string} options.siteName - Site name
     * @returns {Object} SEO data
     */
    getSeoData(options = {}) {
        const { baseUrl = '', siteName = 'ZYMORE Marketplace' } = options;
        const url = baseUrl ? `${baseUrl}/product/${this.id}` : `/product/${this.id}`;

        return {
            title: this.metaTitle || this.title,
            description: this.metaDescription || this.shortDescription || this.description,
            image: this.ogImage || this.thumbnail || (this.images && this.images[0]) || '',
            url: url,
            type: 'product',
            siteName: siteName,
            keywords: [...this.metaKeywords, ...this.tags, this.category],
            canonical: this.canonicalUrl || url,
            ogTitle: this.ogTitle || this.metaTitle || this.title,
            ogDescription: this.ogDescription || this.metaDescription || this.shortDescription || this.description,
            ogImage: this.ogImage || this.thumbnail || (this.images && this.images[0]) || '',
            ogUrl: url,
            ogType: 'product',
            twitterCard: 'summary_large_image',
            twitterTitle: this.ogTitle || this.metaTitle || this.title,
            twitterDescription: this.ogDescription || this.metaDescription || this.shortDescription || this.description,
            twitterImage: this.ogImage || this.thumbnail || (this.images && this.images[0]) || '',
            price: this.price,
            currency: this.currency,
            availability: this.isInStock ? 'in_stock' : 'out_of_stock',
            condition: this.condition,
            brand: this.sellerName,
            ratingValue: this.rating,
            ratingCount: this.ratingCount
        };
    }

    /**
     * Get structured data (JSON-LD)
     * @param {Object} options - Options
     * @param {string} options.baseUrl - Base URL
     * @returns {Object} Structured data
     */
    getStructuredData(options = {}) {
        const { baseUrl = '' } = options;
        const url = baseUrl ? `${baseUrl}/product/${this.id}` : `/product/${this.id}`;

        return {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: this.title,
            description: this.description || this.shortDescription,
            image: this.images || [this.thumbnail],
            sku: this.id,
            productId: this.id,
            brand: {
                '@type': 'Brand',
                name: this.sellerName
            },
            offers: {
                '@type': 'Offer',
                price: this.getDiscountedPrice() || this.price,
                priceCurrency: this.currency || 'USD',
                availability: this.isInStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                url: url,
                seller: {
                    '@type': 'Organization',
                    name: this.sellerName
                }
            },
            aggregateRating: this.ratingCount > 0 ? {
                '@type': 'AggregateRating',
                ratingValue: this.rating,
                ratingCount: this.ratingCount,
                reviewCount: this.ratingCount
            } : undefined,
            review: this.reviews && this.reviews.length > 0 ? this.reviews.slice(0, 3).map(review => ({
                '@type': 'Review',
                author: {
                    '@type': 'Person',
                    name: review.userName || 'Anonymous'
                },
                reviewRating: {
                    '@type': 'Rating',
                    ratingValue: review.rating
                },
                reviewBody: review.comment || ''
            })) : undefined
        };
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Get first image
     * @returns {string} First image URL
     */
    getFirstImage() {
        return this.images && this.images.length > 0 ? this.images[0] : this.thumbnail;
    }

    /**
     * Get download URL
     * @returns {string} Download URL
     */
    getDownloadUrl() {
        return this.downloadUrl || this.driveFileUrl || '';
    }

    /**
     * Get category name
     * @param {Array<Category>} categories - Categories
     * @returns {string} Category name
     */
    getCategoryName(categories = []) {
        const category = categories.find(c => c.id === this.category || c.slug === this.category);
        return category ? category.name : this.category;
    }

    /**
     * Get category icon
     * @param {Array<Category>} categories - Categories
     * @returns {string} Category icon
     */
    getCategoryIcon(categories = []) {
        const category = categories.find(c => c.id === this.category || c.slug === this.category);
        return category ? category.icon : '📦';
    }

    /**
     * Get time ago
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
     * Get formatted created date
     * @param {string} locale - Locale
     * @param {Object} options - Date options
     * @returns {string} Formatted date
     */
    getCreatedDate(locale = 'en-US', options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return this.createdAt.toLocaleDateString(locale, { ...defaultOptions, ...options });
    }

    /**
     * Check if product belongs to seller
     * @param {string} sellerId - Seller ID
     * @returns {boolean} True if belongs to seller
     */
    belongsToSeller(sellerId) {
        return this.sellerId === sellerId;
    }

    /**
     * Check if product is in category
     * @param {string} categoryId - Category ID
     * @returns {boolean} True if in category
     */
    isInCategory(categoryId) {
        return this.category === categoryId || this.categoryTree.includes(categoryId);
    }

    /**
     * Check if product has tag
     * @param {string} tag - Tag
     * @returns {boolean} True if has tag
     */
    hasTag(tag) {
        return this.tags.some(t => t.toLowerCase() === tag.toLowerCase());
    }

    /**
     * Add a tag
     * @param {string} tag - Tag to add
     * @returns {Product} Updated product (this)
     */
    addTag(tag) {
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
            this.updatedAt = new Date();
        }
        return this;
    }

    /**
     * Remove a tag
     * @param {string} tag - Tag to remove
     * @returns {Product} Updated product (this)
     */
    removeTag(tag) {
        this.tags = this.tags.filter(t => t !== tag);
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Clone product
     * @param {Object} options - Clone options
     * @param {boolean} options.keepId - Keep original ID
     * @param {boolean} options.keepTimestamps - Keep original timestamps
     * @param {boolean} options.keepStats - Keep original stats
     * @returns {Product} Cloned product
     */
    clone(options = {}) {
        const { keepId = false, keepTimestamps = false, keepStats = false } = options;
        
        const data = this.toFirestore({ 
            includePrivate: true, 
            includeMetadata: true, 
            includeReviews: true 
        });
        
        if (!keepId) {
            delete data.id;
            data.id = this.generateId();
        }
        
        if (!keepTimestamps) {
            data.createdAt = new Date();
            data.updatedAt = new Date();
            data.publishedAt = null;
            data.lastViewedAt = null;
            data.lastPurchasedAt = null;
        }
        
        if (!keepStats) {
            data.views = 0;
            data.downloads = 0;
            data.likes = 0;
            data.rating = 0;
            data.ratingCount = 0;
            data.shareCount = 0;
            data.saveCount = 0;
            data.reportCount = 0;
            data.clickCount = 0;
            data.uniqueViewers = 0;
            data.wishlistCount = 0;
            data.cartAddCount = 0;
            data.privateViews = 0;
            data.privateStats = {
                dailyViews: {},
                dailyDownloads: {},
                dailySales: {},
                weeklyViews: {},
                weeklyDownloads: {},
                weeklySales: {},
                monthlyViews: {},
                monthlyDownloads: {},
                monthlySales: {},
                deviceInfo: { mobile: 0, desktop: 0, tablet: 0 },
                locationStats: {},
                referrerStats: {},
                conversionRate: 0,
                bounceRate: 0,
                averageTimeSpent: 0,
                topKeywords: [],
                topReferrers: [],
                customerRetention: 0,
                averageOrderValue: 0
            };
        }

        return new Product({ ...data, id: data.id });
    }

    /**
     * Compare two products
     * @param {Product} other - Other product
     * @returns {boolean} True if equal
     */
    equals(other) {
        if (!other) return false;
        return this.id === other.id;
    }

    /**
     * Convert to string
     * @returns {string} String representation
     */
    toString() {
        return `Product(${this.title}, ${this.id})`;
    }

    /**
     * Convert to display string
     * @returns {string} Display string
     */
    toDisplayString() {
        return this.title || 'Untitled Product';
    }

    // ============================================
    // STATIC FACTORY METHODS
    // ============================================

    /**
     * Create product from Firestore data
     * @param {Object} data - Firestore data
     * @param {string} id - Document ID
     * @returns {Product} Product instance
     */
    static fromFirestore(data, id) {
        const productData = { ...data, id };
        return new Product(productData);
    }

    /**
     * Create products from Firestore array
     * @param {Array} dataArray - Firestore data array
     * @returns {Array<Product>} Product instances
     */
    static fromFirestoreArray(dataArray) {
        if (!Array.isArray(dataArray)) return [];
        return dataArray.map(data => Product.fromFirestore(data, data.id));
    }

    /**
     * Create product template
     * @param {string} sellerId - Seller ID
     * @param {string} sellerName - Seller name
     * @returns {Product} Product template
     */
    static createTemplate(sellerId, sellerName) {
        return new Product({
            sellerId: sellerId,
            sellerName: sellerName,
            isActive: true,
            isDraft: true,
            isNew: true,
            tags: [],
            images: [],
            mockups: [],
            highlights: [],
            features: [],
            benefits: [],
            requirements: [],
            includedItems: [],
            updateLog: [],
            reviewSummary: {
                total: 0,
                average: 0,
                breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
                verified: 0,
                unverified: 0,
                withImages: 0,
                withVideos: 0
            }
        });
    }

    /**
     * Create product from form data
     * @param {Object} formData - Form data
     * @param {string} sellerId - Seller ID
     * @param {string} sellerName - Seller name
     * @returns {Product} Product instance
     */
    static fromForm(formData, sellerId, sellerName) {
        return new Product({
            title: formData.title,
            description: formData.description,
            shortDescription: formData.shortDescription,
            category: formData.category,
            subCategory: formData.subCategory,
            tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
            images: formData.images || [],
            thumbnail: formData.thumbnail || (formData.images && formData.images[0]),
            mockups: formData.mockups || [],
            videoUrl: formData.videoUrl || '',
            audioUrl: formData.audioUrl || '',
            productType: formData.productType || 'digital',
            isDigital: formData.productType === 'digital' || formData.productType === 'hybrid',
            isPhysical: formData.productType === 'physical' || formData.productType === 'hybrid',
            isService: formData.productType === 'service',
            isHybrid: formData.productType === 'hybrid',
            isFree: formData.isFree || false,
            isPaid: formData.isPaid || !formData.isFree,
            price: formData.price || 0,
            discount: formData.discount || 0,
            currency: formData.currency || 'USD',
            location: formData.location || {},
            shipping: formData.shipping || {},
            quantity: formData.quantity || 0,
            condition: formData.condition || 'new',
            isNegotiable: formData.isNegotiable || false,
            contactMethod: formData.contactMethod || 'chat',
            contactEmail: formData.contactEmail || '',
            contactPhone: formData.contactPhone || '',
            contactWhatsApp: formData.contactWhatsApp || '',
            fileSize: formData.fileSize || 0,
            fileType: formData.fileType || '',
            downloadUrl: formData.downloadUrl || '',
            isLargeFile: formData.isLargeFile || false,
            driveFileId: formData.driveFileId || '',
            sellerId: sellerId,
            sellerName: sellerName,
            sellerPhoto: formData.sellerPhoto || '',
            isActive: true,
            isFeatured: false,
            isTrending: false,
            isVerified: false,
            highlights: formData.highlights || [],
            features: formData.features || [],
            benefits: formData.benefits || [],
            requirements: formData.requirements || [],
            includedItems: formData.includedItems || [],
            compatibility: formData.compatibility || '',
            version: formData.version || '1.0',
            isBundle: formData.isBundle || false,
            hasVariants: formData.hasVariants || false,
            isNew: true,
            targetAudience: formData.targetAudience || 'all',
            suitableFor: formData.suitableFor || [],
            useCases: formData.useCases || [],
            customizationOptions: formData.customizationOptions || [],
            metaTitle: formData.metaTitle || '',
            metaDescription: formData.metaDescription || '',
            metaKeywords: formData.metaKeywords ? formData.metaKeywords.split(',').map(k => k.trim()).filter(k => k) : [],
            ogImage: formData.ogImage || '',
            canonicalUrl: formData.canonicalUrl || '',
            policies: formData.policies || {},
            notes: formData.notes || '',
            licenseType: formData.licenseType || 'standard',
            demoUrl: formData.demoUrl || '',
            supportUrl: formData.supportUrl || '',
            documentationUrl: formData.documentationUrl || '',
            sellerResponseRate: 100,
            sellerResponseTime: '1 hour',
            commission: 5,
            taxIncluded: true,
            taxRate: 0
        });
    }

    /**
     * Create digital product
     * @param {Object} data - Product data
     * @param {string} sellerId - Seller ID
     * @param {string} sellerName - Seller name
     * @returns {Product} Digital product
     */
    static createDigital(data, sellerId, sellerName) {
        return new Product({
            ...data,
            productType: 'digital',
            isDigital: true,
            isPhysical: false,
            isService: false,
            isHybrid: false,
            sellerId: sellerId,
            sellerName: sellerName,
            isActive: true,
            isNew: true
        });
    }

    /**
     * Create physical product
     * @param {Object} data - Product data
     * @param {string} sellerId - Seller ID
     * @param {string} sellerName - Seller name
     * @returns {Product} Physical product
     */
    static createPhysical(data, sellerId, sellerName) {
        return new Product({
            ...data,
            productType: 'physical',
            isDigital: false,
            isPhysical: true,
            isService: false,
            isHybrid: false,
            sellerId: sellerId,
            sellerName: sellerName,
            isActive: true,
            isNew: true,
            shipping: {
                available: true,
                cost: data.shippingCost || 0,
                freeShipping: data.freeShipping || false,
                deliveryTime: data.deliveryTime || '3-5 days',
                deliveryEstimate: data.deliveryEstimate || '',
                shippingMethods: data.shippingMethods || ['standard'],
                internationalShipping: data.internationalShipping || false,
                internationalCost: data.internationalCost || 0,
                tracking: true,
                returnsAccepted: true,
                returnPolicy: data.returnPolicy || '30 days return policy',
                returnCost: 'buyer'
            },
            location: data.location || {},
            quantity: data.quantity || 0,
            condition: data.condition || 'new',
            isNegotiable: data.isNegotiable || false
        });
    }

    /**
     * Create service product
     * @param {Object} data - Product data
     * @param {string} sellerId - Seller ID
     * @param {string} sellerName - Seller name
     * @returns {Product} Service product
     */
    static createService(data, sellerId, sellerName) {
        return new Product({
            ...data,
            productType: 'service',
            isDigital: false,
            isPhysical: false,
            isService: true,
            isHybrid: false,
            sellerId: sellerId,
            sellerName: sellerName,
            isActive: true,
            isNew: true,
            contactMethod: data.contactMethod || 'chat',
            contactEmail: data.contactEmail || '',
            contactPhone: data.contactPhone || '',
            contactWhatsApp: data.contactWhatsApp || '',
            responseTime: data.responseTime || '24 hours',
            isContactAvailable: true,
            contactHours: data.contactHours || '9 AM - 6 PM, Mon-Fri',
            customizationOptions: data.customizationOptions || [],
            customizable: data.customizable || false
        });
    }

    // ============================================
    // STATIC SORT & FILTER
    // ============================================

    /**
     * Sort products by field
     * @param {Array<Product>} products - Products array
     * @param {string} field - Sort field
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<Product>} Sorted products
     */
    static sortProducts(products, field, order = 'desc') {
        const sorted = [...products];
        sorted.sort((a, b) => {
            let aVal = a[field] ?? 0;
            let bVal = b[field] ?? 0;
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            if (aVal < bVal) return order === 'desc' ? 1 : -1;
            if (aVal > bVal) return order === 'desc' ? -1 : 1;
            return 0;
        });
        return sorted;
    }

    /**
     * Filter products by category
     * @param {Array<Product>} products - Products array
     * @param {string} categoryId - Category ID
     * @returns {Array<Product>} Filtered products
     */
    static filterByCategory(products, categoryId) {
        if (!categoryId) return products;
        return products.filter(p => p.isInCategory(categoryId));
    }

    /**
     * Filter products by search
     * @param {Array<Product>} products - Products array
     * @param {string} query - Search query
     * @returns {Array<Product>} Filtered products
     */
    static filterBySearch(products, query) {
        if (!query || query.trim() === '') return products;
        return products.filter(p => p.matchesSearch(query));
    }

    /**
     * Filter products by type
     * @param {Array<Product>} products - Products array
     * @param {string} type - Product type
     * @returns {Array<Product>} Filtered products
     */
    static filterByType(products, type) {
        if (!type) return products;
        if (type === 'digital') return products.filter(p => p.isDigital);
        if (type === 'physical') return products.filter(p => p.isPhysical);
        if (type === 'service') return products.filter(p => p.isService);
        if (type === 'hybrid') return products.filter(p => p.isHybrid);
        if (type === 'free') return products.filter(p => p.isFree);
        if (type === 'paid') return products.filter(p => p.isPaid);
        if (type === 'inStock') return products.filter(p => p.isInStock);
        if (type === 'onSale') return products.filter(p => p.isOnSale);
        return products;
    }

    /**
     * Get top rated products
     * @param {Array<Product>} products - Products array
     * @param {number} limit - Limit
     * @param {number} minRating - Minimum rating
     * @returns {Array<Product>} Top rated products
     */
    static getTopRated(products, limit = 10, minRating = 4) {
        const filtered = products.filter(p => p.rating >= minRating && p.ratingCount > 0);
        return Product.sortProducts(filtered, 'rating', 'desc').slice(0, limit);
    }

    /**
     * Get most downloaded products
     * @param {Array<Product>} products - Products array
     * @param {number} limit - Limit
     * @returns {Array<Product>} Most downloaded products
     */
    static getMostDownloaded(products, limit = 10) {
        const filtered = products.filter(p => p.isDigital || p.isHybrid);
        return Product.sortProducts(filtered, 'downloads', 'desc').slice(0, limit);
    }

    /**
     * Get newest products
     * @param {Array<Product>} products - Products array
     * @param {number} limit - Limit
     * @returns {Array<Product>} Newest products
     */
    static getNewest(products, limit = 10) {
        return Product.sortProducts(products, 'createdAt', 'desc').slice(0, limit);
    }

    /**
     * Get trending products
     * @param {Array<Product>} products - Products array
     * @param {number} limit - Limit
     * @returns {Array<Product>} Trending products
     */
    static getTrending(products, limit = 10) {
        const scored = products.map(p => ({
            product: p,
            score: (p.views || 0) * 0.3 + (p.downloads || 0) * 0.4 + (p.likes || 0) * 0.3
        }));
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, limit).map(s => s.product);
    }

    /**
     * Get bestsellers
     * @param {Array<Product>} products - Products array
     * @param {number} limit - Limit
     * @returns {Array<Product>} Bestsellers
     */
    static getBestsellers(products, limit = 10) {
        const filtered = products.filter(p => p.isBestseller || p.downloads > 100);
        return Product.sortProducts(filtered, 'downloads', 'desc').slice(0, limit);
    }

    /**
     * Get products on sale
     * @param {Array<Product>} products - Products array
     * @param {number} limit - Limit
     * @returns {Array<Product>} Products on sale
     */
    static getOnSale(products, limit = 10) {
        const filtered = products.filter(p => p.isOnSale && p.discount > 0);
        return Product.sortProducts(filtered, 'discount', 'desc').slice(0, limit);
    }

    /**
     * Get recommended products
     * @param {Array<Product>} products - Products array
     * @param {string} productId - Product ID for recommendation
     * @param {number} limit - Limit
     * @returns {Array<Product>} Recommended products
     */
    static getRecommended(products, productId, limit = 6) {
        const product = products.find(p => p.id === productId);
        if (!product) return products.slice(0, limit);

        // Score based on category, tags, and product type
        const scored = products.map(p => {
            if (p.id === productId) return { product: p, score: -1 };
            let score = 0;
            if (p.category === product.category) score += 30;
            if (p.productType === product.productType) score += 20;
            const commonTags = p.tags.filter(t => product.tags.includes(t));
            score += commonTags.length * 5;
            score += (p.rating || 0) * 2;
            score += (p.downloads || 0) / 100;
            return { product: p, score: score };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored.filter(s => s.score > 0).slice(0, limit).map(s => s.product);
    }

    /**
     * Validate product data
     * @param {Object} data - Product data
     * @returns {boolean} True if valid
     */
    static isValidProductData(data) {
        return data && typeof data === 'object' &&
            data.title && data.title.trim() !== '' &&
            data.sellerId && data.sellerId.trim() !== '';
    }

    /**
     * Check if product is visible
     * @param {Product} product - Product
     * @param {Object} options - Options
     * @param {boolean} options.includeDrafts - Include drafts
     * @param {boolean} options.includeInactive - Include inactive
     * @returns {boolean} True if visible
     */
    static isVisible(product, options = {}) {
        const { includeDrafts = false, includeInactive = false } = options;
        if (product.isDeleted) return false;
        if (product.isBlocked) return false;
        if (!includeInactive && !product.isActive) return false;
        if (!includeDrafts && product.isDraft) return false;
        if (product.isPending && !product.isApproved) return false;
        return true;
    }

    /**
     * Get visible products
     * @param {Array<Product>} products - Products array
     * @param {Object} options - Options
     * @param {boolean} options.includeDrafts - Include drafts
     * @param {boolean} options.includeInactive - Include inactive
     * @returns {Array<Product>} Visible products
     */
    static getVisible(products, options = {}) {
        return products.filter(p => Product.isVisible(p, options));
    }

    /**
     * Group products by category
     * @param {Array<Product>} products - Products array
     * @returns {Object} Grouped products
     */
    static groupByCategory(products) {
        const groups = {};
        products.forEach(p => {
            const key = p.category || 'uncategorized';
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        });
        return groups;
    }

    /**
     * Group products by type
     * @param {Array<Product>} products - Products array
     * @returns {Object} Grouped products
     */
    static groupByType(products) {
        const groups = { digital: [], physical: [], service: [], hybrid: [] };
        products.forEach(p => {
            if (p.isDigital && !p.isPhysical) groups.digital.push(p);
            else if (p.isPhysical && !p.isDigital) groups.physical.push(p);
            else if (p.isService) groups.service.push(p);
            else if (p.isHybrid) groups.hybrid.push(p);
            else {
                // Fallback based on productType
                const type = p.productType || 'digital';
                if (groups[type]) groups[type].push(p);
                else groups.digital.push(p);
            }
        });
        return groups;
    }
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default Product;

// ============================================================
// END OF FILE: product-model.js
// ============================================================