// Category Model
// ============================================================
// FILE: category-model.js
// PURPOSE: Category data structure and management class
// DEPENDENCY: NONE
// USED BY: database-service.js, home-screen.js, category-card.js
// LOCATION: js/models/category-model.js
// ============================================================

// ============================================================
// CATEGORY CLASS
// ============================================================

/**
 * Category Model Class
 * Represents a product category in the ZYMORE marketplace
 * Handles category data structure, validation, and serialization
 */
export class Category {
    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * Create a new Category instance
     * @param {Object} data - Category data
     * @param {string} data.id - Category ID (optional)
     * @param {string} data.name - Category name
     * @param {string} data.slug - URL-friendly slug
     * @param {string} data.icon - Category icon (emoji or URL)
     * @param {string} data.description - Category description
     * @param {number} data.displayOrder - Display order
     * @param {boolean} data.isActive - Active status
     * @param {number} data.productCount - Number of products
     * @param {string} data.featuredImage - Featured image URL
     * @param {Date|string} data.createdAt - Creation date
     * @param {Date|string} data.updatedAt - Last update date
     * @param {string} data.parentCategory - Parent category ID
     * @param {string} data.metaTitle - SEO meta title
     * @param {string} data.metaDescription - SEO meta description
     * @param {string} data.color - Category color (hex)
     * @param {string} data.bannerImage - Banner image URL
     * @param {Array<string>} data.tags - Category tags
     * @param {number} data.viewCount - Number of views
     * @param {number} data.followerCount - Number of followers
     * @param {boolean} data.isFeatured - Featured status
     * @param {boolean} data.isPopular - Popular status
     * @param {boolean} data.isTrending - Trending status
     * @param {string} data.seoKeywords - SEO keywords
     * @param {string} data.seoTitle - SEO title (alternative)
     * @param {string} data.seoDescription - SEO description (alternative)
     * @param {string} data.seoImage - SEO image URL
     * @param {string} data.categoryType - Category type (main, sub, collection)
     * @param {Array<string>} data.attributes - Category attributes
     * @param {Array<string>} data.relatedCategories - Related category IDs
     * @param {Object} data.settings - Category settings
     * @param {Object} data.metadata - Additional metadata
     */
    constructor(data = {}) {
        // ============================================
        // BASIC INFORMATION
        // ============================================
        this.id = data.id || data.categoryId || this.generateId();
        this.name = data.name || '';
        this.slug = data.slug || '';
        this.icon = data.icon || '📦';
        this.description = data.description || '';
        
        // ============================================
        // DISPLAY SETTINGS
        // ============================================
        this.displayOrder = data.displayOrder !== undefined ? data.displayOrder : 0;
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.color = data.color || '#607D8B';
        this.bannerImage = data.bannerImage || '';
        
        // ============================================
        // STATISTICS
        // ============================================
        this.productCount = data.productCount !== undefined ? data.productCount : 0;
        this.viewCount = data.viewCount !== undefined ? data.viewCount : 0;
        this.followerCount = data.followerCount !== undefined ? data.followerCount : 0;
        
        // ============================================
        // MEDIA
        // ============================================
        this.featuredImage = data.featuredImage || '';
        
        // ============================================
        // TIMESTAMPS
        // ============================================
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
        
        // ============================================
        // HIERARCHY
        // ============================================
        this.parentCategory = data.parentCategory || '';
        
        // ============================================
        // SEO
        // ============================================
        this.metaTitle = data.metaTitle || '';
        this.metaDescription = data.metaDescription || '';
        this.seoKeywords = data.seoKeywords || '';
        this.seoTitle = data.seoTitle || data.metaTitle || '';
        this.seoDescription = data.seoDescription || data.metaDescription || '';
        this.seoImage = data.seoImage || data.featuredImage || '';
        
        // ============================================
        // TAGS & CATEGORIZATION
        // ============================================
        this.tags = data.tags || [];
        this.categoryType = data.categoryType || 'main';
        this.attributes = data.attributes || [];
        this.relatedCategories = data.relatedCategories || [];
        
        // ============================================
        // STATUS FLAGS
        // ============================================
        this.isFeatured = data.isFeatured !== undefined ? data.isFeatured : false;
        this.isPopular = data.isPopular !== undefined ? data.isPopular : false;
        this.isTrending = data.isTrending !== undefined ? data.isTrending : false;
        
        // ============================================
        // SETTINGS & METADATA
        // ============================================
        this.settings = data.settings || {};
        this.metadata = data.metadata || {};
    }

    // ============================================
    // ID GENERATION
    // ============================================

    /**
     * Generate a unique category ID
     * @returns {string} Unique ID
     */
    generateId() {
        return `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // ============================================
    // VALIDATION METHODS
    // ============================================

    /**
     * Validate category data
     * @param {Object} options - Validation options
     * @param {boolean} options.strict - Strict validation
     * @param {Array<Category>} options.existingCategories - Existing categories for uniqueness check
     * @returns {Object} Validation result { isValid, errors, warnings }
     */
    validate(options = {}) {
        const errors = [];
        const warnings = [];
        const { strict = false, existingCategories = [] } = options;
        
        // === REQUIRED FIELDS ===
        if (!this.name || this.name.trim() === '') {
            errors.push('Category name is required');
        }
        
        if (this.name && (this.name.length < 2 || this.name.length > 50)) {
            errors.push('Category name must be between 2 and 50 characters');
        }
        
        if (strict && (!this.slug || this.slug.trim() === '')) {
            errors.push('Category slug is required');
        }
        
        // === SLUG VALIDATION ===
        if (this.slug && !this.isValidSlug(this.slug)) {
            errors.push('Category slug must be URL-friendly (lowercase, letters, numbers, hyphens only)');
        }
        
        // === UNIQUENESS ===
        if (existingCategories.length > 0 && this.slug) {
            const duplicate = existingCategories.find(c => 
                c.slug === this.slug && c.id !== this.id
            );
            if (duplicate) {
                errors.push(`Slug "${this.slug}" is already used by category "${duplicate.name}"`);
            }
        }
        
        if (existingCategories.length > 0 && this.name) {
            const duplicate = existingCategories.find(c => 
                c.name.toLowerCase() === this.name.toLowerCase() && 
                c.id !== this.id
            );
            if (duplicate) {
                warnings.push(`Category name "${this.name}" may be a duplicate of "${duplicate.name}"`);
            }
        }
        
        // === LENGTH VALIDATION ===
        if (this.description && this.description.length > 500) {
            errors.push('Category description must be less than 500 characters');
        }
        
        if (this.metaTitle && this.metaTitle.length > 60) {
            errors.push('Meta title must be less than 60 characters');
        }
        
        if (this.metaDescription && this.metaDescription.length > 160) {
            errors.push('Meta description must be less than 160 characters');
        }
        
        if (this.seoKeywords && this.seoKeywords.length > 200) {
            warnings.push('SEO keywords should be less than 200 characters');
        }
        
        if (this.bannerImage && this.bannerImage.length > 1000) {
            warnings.push('Banner image URL is very long');
        }
        
        if (this.featuredImage && this.featuredImage.length > 1000) {
            warnings.push('Featured image URL is very long');
        }
        
        // === COLOR VALIDATION ===
        if (this.color && !this.isValidColor(this.color)) {
            warnings.push('Invalid color format. Use hex color (e.g., #FF0000)');
        }
        
        // === TYPE VALIDATION ===
        const validTypes = ['main', 'sub', 'collection', 'brand'];
        if (this.categoryType && !validTypes.includes(this.categoryType)) {
            warnings.push(`Invalid category type. Must be one of: ${validTypes.join(', ')}`);
        }
        
        // === CIRCULAR REFERENCE ===
        if (this.id && this.parentCategory === this.id) {
            errors.push('Category cannot be its own parent');
        }
        
        // === TAGS VALIDATION ===
        if (this.tags && this.tags.length > 50) {
            warnings.push('Too many tags (max 50 recommended)');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            hasWarnings: warnings.length > 0
        };
    }

    /**
     * Validate slug format
     * @param {string} slug - Slug to validate
     * @returns {boolean} True if slug is valid
     */
    isValidSlug(slug) {
        return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
    }

    /**
     * Validate color format
     * @param {string} color - Color to validate
     * @returns {boolean} True if color is valid
     */
    isValidColor(color) {
        return /^#[0-9A-Fa-f]{6}$/.test(color) || /^#[0-9A-Fa-f]{3}$/.test(color);
    }

    // ============================================
    // TRANSFORMATION METHODS
    // ============================================

    /**
     * Convert Category to plain object for Firestore
     * @param {Object} options - Conversion options
     * @param {boolean} options.includeMetadata - Include metadata
     * @param {boolean} options.includeSettings - Include settings
     * @returns {Object} Plain object representation
     */
    toFirestore(options = {}) {
        const { includeMetadata = true, includeSettings = true } = options;
        
        const data = {
            name: this.name,
            slug: this.slug,
            icon: this.icon,
            description: this.description,
            displayOrder: this.displayOrder,
            isActive: this.isActive,
            productCount: this.productCount,
            featuredImage: this.featuredImage,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            parentCategory: this.parentCategory,
            metaTitle: this.metaTitle,
            metaDescription: this.metaDescription,
            color: this.color,
            bannerImage: this.bannerImage,
            viewCount: this.viewCount,
            followerCount: this.followerCount,
            isFeatured: this.isFeatured,
            isPopular: this.isPopular,
            isTrending: this.isTrending,
            seoKeywords: this.seoKeywords,
            seoTitle: this.seoTitle,
            seoDescription: this.seoDescription,
            seoImage: this.seoImage,
            categoryType: this.categoryType,
            tags: this.tags,
            attributes: this.attributes,
            relatedCategories: this.relatedCategories
        };
        
        if (includeSettings) {
            data.settings = this.settings;
        }
        
        if (includeMetadata) {
            data.metadata = this.metadata;
        }
        
        return data;
    }

    /**
     * Convert to JSON for API responses
     * @param {Object} options - Conversion options
     * @param {boolean} options.includePrivate - Include private fields
     * @param {boolean} options.includeMetadata - Include metadata
     * @returns {Object} Category data
     */
    toJSON(options = {}) {
        const { includePrivate = false, includeMetadata = false } = options;
        
        const data = {
            id: this.id,
            name: this.name,
            slug: this.slug,
            icon: this.icon,
            description: this.description,
            displayOrder: this.displayOrder,
            isActive: this.isActive,
            productCount: this.productCount,
            featuredImage: this.featuredImage,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            parentCategory: this.parentCategory,
            metaTitle: this.metaTitle,
            metaDescription: this.metaDescription,
            color: this.color,
            bannerImage: this.bannerImage,
            viewCount: this.viewCount,
            followerCount: this.followerCount,
            isFeatured: this.isFeatured,
            isPopular: this.isPopular,
            isTrending: this.isTrending,
            seoKeywords: this.seoKeywords,
            seoTitle: this.seoTitle,
            seoDescription: this.seoDescription,
            seoImage: this.seoImage,
            categoryType: this.categoryType,
            tags: this.tags,
            attributes: this.attributes,
            relatedCategories: this.relatedCategories
        };
        
        if (includePrivate && includeMetadata) {
            data.settings = this.settings;
            data.metadata = this.metadata;
        } else if (includePrivate) {
            data.settings = this.settings;
        } else if (includeMetadata) {
            data.metadata = this.metadata;
        }
        
        return data;
    }

    /**
     * Get public category data
     * @param {Object} options - Options
     * @param {boolean} options.includeStats - Include statistics
     * @param {boolean} options.includeSeo - Include SEO data
     * @returns {Object} Public category data
     */
    getPublicData(options = {}) {
        const { includeStats = true, includeSeo = true } = options;
        
        const data = {
            id: this.id,
            name: this.name,
            slug: this.slug,
            icon: this.icon,
            description: this.description,
            displayOrder: this.displayOrder,
            productCount: this.productCount,
            featuredImage: this.featuredImage,
            parentCategory: this.parentCategory,
            color: this.color,
            bannerImage: this.bannerImage,
            isFeatured: this.isFeatured,
            isPopular: this.isPopular,
            isTrending: this.isTrending,
            categoryType: this.categoryType,
            tags: this.tags,
            attributes: this.attributes,
            relatedCategories: this.relatedCategories
        };
        
        if (includeStats) {
            data.viewCount = this.viewCount;
            data.followerCount = this.followerCount;
        }
        
        if (includeSeo) {
            data.seo = this.getSeoData();
        }
        
        return data;
    }

    /**
     * Get minimal category data
     * @returns {Object} Minimal category data
     */
    getMinimalData() {
        return {
            id: this.id,
            name: this.name,
            slug: this.slug,
            icon: this.icon,
            productCount: this.productCount,
            color: this.color,
            isFeatured: this.isFeatured,
            isPopular: this.isPopular
        };
    }

    /**
     * Get compact category data (for lists)
     * @returns {Object} Compact category data
     */
    getCompactData() {
        return {
            id: this.id,
            name: this.name,
            slug: this.slug,
            icon: this.icon,
            productCount: this.productCount,
            color: this.color,
            isActive: this.isActive
        };
    }

    /**
     * Get SEO data for the category
     * @param {Object} options - Options
     * @param {string} options.baseUrl - Base URL
     * @param {string} options.siteName - Site name
     * @returns {Object} SEO data
     */
    getSeoData(options = {}) {
        const { baseUrl = '', siteName = 'ZYMORE Marketplace' } = options;
        
        const title = this.seoTitle || this.metaTitle || this.name;
        const description = this.seoDescription || this.metaDescription || 
                           this.description || `${this.name} category - ${siteName}`;
        const image = this.seoImage || this.featuredImage || this.bannerImage || '';
        const url = baseUrl ? `${baseUrl}/category/${this.slug}` : `/category/${this.slug}`;
        const keywords = this.seoKeywords || this.tags?.join(', ') || '';
        
        return {
            title: title,
            description: description,
            image: image,
            url: url,
            type: 'category',
            siteName: siteName,
            keywords: keywords,
            canonical: url,
            ogTitle: title,
            ogDescription: description,
            ogImage: image,
            ogUrl: url,
            ogType: 'website',
            twitterCard: 'summary_large_image',
            twitterTitle: title,
            twitterDescription: description,
            twitterImage: image
        };
    }

    /**
     * Get structured data for SEO (JSON-LD)
     * @param {Object} options - Options
     * @param {string} options.baseUrl - Base URL
     * @returns {Object} Structured data
     */
    getStructuredData(options = {}) {
        const { baseUrl = '' } = options;
        const url = baseUrl ? `${baseUrl}/category/${this.slug}` : `/category/${this.slug}`;
        
        return {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: this.name,
            description: this.description || `${this.name} category`,
            url: url,
            image: this.featuredImage || this.bannerImage || '',
            mainEntity: {
                '@type': 'ItemList',
                itemListElement: [
                    // Will be populated with products
                ],
                numberOfItems: this.productCount || 0
            },
            breadcrumb: {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    {
                        '@type': 'ListItem',
                        position: 1,
                        name: 'Home',
                        item: baseUrl || '/'
                    },
                    {
                        '@type': 'ListItem',
                        position: 2,
                        name: this.name,
                        item: url
                    }
                ]
            }
        };
    }

    // ============================================
    // STATIC FACTORY METHODS
    // ============================================

    /**
     * Create Category from Firestore data
     * @param {Object} data - Firestore document data
     * @param {string} id - Document ID
     * @returns {Category} Category instance
     */
    static fromFirestore(data, id) {
        const categoryData = { ...data, id };
        return new Category(categoryData);
    }

    /**
     * Create a new category from form data
     * @param {Object} formData - Form data
     * @param {Array<Category>} existingCategories - Existing categories for validation
     * @returns {Category} Category instance
     */
    static fromForm(formData, existingCategories = []) {
        const category = new Category({
            name: formData.name,
            slug: formData.slug || Category.generateSlug(formData.name),
            icon: formData.icon || '📦',
            description: formData.description || '',
            displayOrder: formData.displayOrder !== undefined ? formData.displayOrder : 0,
            parentCategory: formData.parentCategory || '',
            featuredImage: formData.featuredImage || '',
            metaTitle: formData.metaTitle || '',
            metaDescription: formData.metaDescription || '',
            isActive: formData.isActive !== undefined ? formData.isActive : true,
            color: formData.color || '#607D8B',
            bannerImage: formData.bannerImage || '',
            categoryType: formData.categoryType || 'main',
            tags: formData.tags || [],
            attributes: formData.attributes || [],
            relatedCategories: formData.relatedCategories || [],
            isFeatured: formData.isFeatured || false,
            isPopular: formData.isPopular || false,
            isTrending: formData.isTrending || false,
            seoKeywords: formData.seoKeywords || '',
            seoTitle: formData.seoTitle || '',
            seoDescription: formData.seoDescription || '',
            seoImage: formData.seoImage || '',
            settings: formData.settings || {},
            metadata: formData.metadata || {}
        });
        
        // Validate with existing categories
        const validation = category.validate({ existingCategories });
        if (!validation.isValid) {
            throw new Error(`Category validation failed: ${validation.errors.join(', ')}`);
        }
        
        return category;
    }

    /**
     * Create a category template (empty)
     * @param {string} name - Category name
     * @param {Object} options - Template options
     * @param {string} options.icon - Icon
     * @param {string} options.color - Color
     * @param {string} options.categoryType - Category type
     * @returns {Category} Empty category template
     */
    static createTemplate(name = '', options = {}) {
        const { icon = '📦', color = '#607D8B', categoryType = 'main' } = options;
        
        return new Category({
            name: name,
            slug: name ? Category.generateSlug(name) : '',
            icon: icon,
            description: '',
            displayOrder: 0,
            isActive: true,
            productCount: 0,
            viewCount: 0,
            followerCount: 0,
            color: color,
            categoryType: categoryType,
            tags: [],
            attributes: [],
            relatedCategories: [],
            isFeatured: false,
            isPopular: false,
            isTrending: false,
            settings: {
                allowSubCategories: true,
                showInMenu: true,
                showInFooter: false
            },
            metadata: {}
        });
    }

    /**
     * Generate URL-friendly slug from name
     * @param {string} name - Category name
     * @param {Array<Category>} existingCategories - Existing categories for uniqueness
     * @returns {string} URL-friendly slug
     */
    static generateSlug(name, existingCategories = []) {
        let slug = name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
        
        // Ensure uniqueness
        if (existingCategories.length > 0) {
            let counter = 1;
            let uniqueSlug = slug;
            while (existingCategories.some(c => c.slug === uniqueSlug)) {
                uniqueSlug = `${slug}-${counter}`;
                counter++;
            }
            slug = uniqueSlug;
        }
        
        return slug || 'uncategorized';
    }

    // ============================================
    // UPDATE METHODS
    // ============================================

    /**
     * Update category data
     * @param {Object} updates - Fields to update
     * @param {boolean} autoGenerateSlug - Auto-generate slug if name changes
     * @returns {Category} Updated category (this)
     */
    update(updates, autoGenerateSlug = true) {
        if (updates.name !== undefined) {
            this.name = updates.name;
            if (autoGenerateSlug && !updates.slug) {
                this.slug = Category.generateSlug(updates.name);
            }
        }
        if (updates.slug !== undefined) {
            this.slug = updates.slug;
        }
        if (updates.icon !== undefined) {
            this.icon = updates.icon;
        }
        if (updates.description !== undefined) {
            this.description = updates.description;
        }
        if (updates.displayOrder !== undefined) {
            this.displayOrder = updates.displayOrder;
        }
        if (updates.isActive !== undefined) {
            this.isActive = updates.isActive;
        }
        if (updates.featuredImage !== undefined) {
            this.featuredImage = updates.featuredImage;
        }
        if (updates.parentCategory !== undefined) {
            this.parentCategory = updates.parentCategory;
        }
        if (updates.metaTitle !== undefined) {
            this.metaTitle = updates.metaTitle;
        }
        if (updates.metaDescription !== undefined) {
            this.metaDescription = updates.metaDescription;
        }
        if (updates.color !== undefined) {
            this.color = updates.color;
        }
        if (updates.bannerImage !== undefined) {
            this.bannerImage = updates.bannerImage;
        }
        if (updates.tags !== undefined) {
            this.tags = updates.tags;
        }
        if (updates.attributes !== undefined) {
            this.attributes = updates.attributes;
        }
        if (updates.relatedCategories !== undefined) {
            this.relatedCategories = updates.relatedCategories;
        }
        if (updates.categoryType !== undefined) {
            this.categoryType = updates.categoryType;
        }
        if (updates.isFeatured !== undefined) {
            this.isFeatured = updates.isFeatured;
        }
        if (updates.isPopular !== undefined) {
            this.isPopular = updates.isPopular;
        }
        if (updates.isTrending !== undefined) {
            this.isTrending = updates.isTrending;
        }
        if (updates.seoKeywords !== undefined) {
            this.seoKeywords = updates.seoKeywords;
        }
        if (updates.seoTitle !== undefined) {
            this.seoTitle = updates.seoTitle;
        }
        if (updates.seoDescription !== undefined) {
            this.seoDescription = updates.seoDescription;
        }
        if (updates.seoImage !== undefined) {
            this.seoImage = updates.seoImage;
        }
        if (updates.settings !== undefined) {
            this.settings = { ...this.settings, ...updates.settings };
        }
        if (updates.metadata !== undefined) {
            this.metadata = { ...this.metadata, ...updates.metadata };
        }
        
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Increment product count
     * @param {number} amount - Amount to increment
     * @returns {Category} Updated category (this)
     */
    incrementProductCount(amount = 1) {
        this.productCount = (this.productCount || 0) + amount;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Decrement product count
     * @param {number} amount - Amount to decrement
     * @returns {Category} Updated category (this)
     */
    decrementProductCount(amount = 1) {
        this.productCount = Math.max(0, (this.productCount || 0) - amount);
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Increment view count
     * @param {number} amount - Amount to increment
     * @returns {Category} Updated category (this)
     */
    incrementViewCount(amount = 1) {
        this.viewCount = (this.viewCount || 0) + amount;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Increment follower count
     * @param {number} amount - Amount to increment
     * @returns {Category} Updated category (this)
     */
    incrementFollowerCount(amount = 1) {
        this.followerCount = (this.followerCount || 0) + amount;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Decrement follower count
     * @param {number} amount - Amount to decrement
     * @returns {Category} Updated category (this)
     */
    decrementFollowerCount(amount = 1) {
        this.followerCount = Math.max(0, (this.followerCount || 0) - amount);
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Toggle active status
     * @returns {Category} Updated category (this)
     */
    toggleActive() {
        this.isActive = !this.isActive;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Toggle featured status
     * @returns {Category} Updated category (this)
     */
    toggleFeatured() {
        this.isFeatured = !this.isFeatured;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Toggle popular status
     * @returns {Category} Updated category (this)
     */
    togglePopular() {
        this.isPopular = !this.isPopular;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Toggle trending status
     * @returns {Category} Updated category (this)
     */
    toggleTrending() {
        this.isTrending = !this.isTrending;
        this.updatedAt = new Date();
        return this;
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Get formatted creation date
     * @param {string} locale - Locale for formatting
     * @param {Object} options - Date formatting options
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
     * Get formatted update date
     * @param {string} locale - Locale for formatting
     * @param {Object} options - Date formatting options
     * @returns {string} Formatted date
     */
    getUpdatedDate(locale = 'en-US', options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return this.updatedAt.toLocaleDateString(locale, { ...defaultOptions, ...options });
    }

    /**
     * Get time ago (e.g., "5 minutes ago")
     * @param {string} locale - Locale for formatting
     * @returns {string} Time ago string
     */
    getTimeAgo(locale = 'en-US') {
        const now = new Date();
        const diff = now - this.createdAt;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (seconds < 60) {
            return `${seconds}s ago`;
        } else if (minutes < 60) {
            return `${minutes}m ago`;
        } else if (hours < 24) {
            return `${hours}h ago`;
        } else if (days < 7) {
            return `${days}d ago`;
        } else if (weeks < 4) {
            return `${weeks}w ago`;
        } else if (months < 12) {
            return `${months}mo ago`;
        } else {
            return `${years}y ago`;
        }
    }

    /**
     * Check if category is active
     * @returns {boolean} True if active
     */
    isActiveCategory() {
        return this.isActive === true;
    }

    /**
     * Check if category has parent
     * @returns {boolean} True if has parent
     */
    hasParent() {
        return this.parentCategory && this.parentCategory.trim() !== '';
    }

    /**
     * Check if category is sub-category
     * @returns {boolean} True if sub-category
     */
    isSubCategory() {
        return this.hasParent();
    }

    /**
     * Check if category has products
     * @returns {boolean} True if has products
     */
    hasProducts() {
        return this.productCount > 0;
    }

    /**
     * Check if category is empty (no products)
     * @returns {boolean} True if empty
     */
    isEmpty() {
        return this.productCount === 0;
    }

    /**
     * Check if category is published
     * @returns {boolean} True if published
     */
    isPublished() {
        return this.isActive && this.slug && this.slug.trim() !== '';
    }

    /**
     * Get category display name with parent info
     * @param {Array<Category>} categories - All categories
     * @param {string} separator - Separator string
     * @returns {string} Full display name
     */
    getFullName(categories = [], separator = ' › ') {
        if (!this.hasParent()) return this.name;
        
        const parent = categories.find(c => c.id === this.parentCategory);
        if (parent) {
            return `${parent.name}${separator}${this.name}`;
        }
        return this.name;
    }

    /**
     * Get parent category object
     * @param {Array<Category>} categories - All categories
     * @returns {Category|null} Parent category or null
     */
    getParent(categories = []) {
        if (!this.hasParent()) return null;
        return categories.find(c => c.id === this.parentCategory) || null;
    }

    /**
     * Get child categories
     * @param {Array<Category>} categories - All categories
     * @param {Object} options - Options
     * @param {boolean} options.includeInactive - Include inactive categories
     * @param {boolean} options.includeEmpty - Include empty categories
     * @returns {Array<Category>} Child categories
     */
    getChildren(categories = [], options = {}) {
        const { includeInactive = false, includeEmpty = true } = options;
        
        let children = categories.filter(c => c.parentCategory === this.id);
        
        if (!includeInactive) {
            children = children.filter(c => c.isActive);
        }
        
        if (!includeEmpty) {
            children = children.filter(c => c.hasProducts());
        }
        
        return children;
    }

    /**
     * Check if category has children
     * @param {Array<Category>} categories - All categories
     * @param {Object} options - Options
     * @returns {boolean} True if has children
     */
    hasChildren(categories = [], options = {}) {
        return this.getChildren(categories, options).length > 0;
    }

    /**
     * Get category level in hierarchy
     * @param {Array<Category>} categories - All categories
     * @param {number} level - Current level (internal use)
     * @returns {number} Category level (0 = root)
     */
    getLevel(categories = [], level = 0) {
        if (!this.hasParent()) return level;
        
        const parent = categories.find(c => c.id === this.parentCategory);
        if (parent) {
            return parent.getLevel(categories, level + 1);
        }
        return level;
    }

    /**
     * Get category path (breadcrumb)
     * @param {Array<Category>} categories - All categories
     * @returns {Array<Category>} Category path
     */
    getPath(categories = []) {
        return Category.getPath(categories, this.id);
    }

    /**
     * Get category URL
     * @param {Object} options - Options
     * @param {string} options.baseUrl - Base URL
     * @param {string} options.pathPrefix - Path prefix
     * @returns {string} Category URL
     */
    getUrl(options = {}) {
        const { baseUrl = '', pathPrefix = '/category' } = options;
        const path = `${pathPrefix}/${this.slug}`;
        return baseUrl ? `${baseUrl}${path}` : path;
    }

    /**
     * Get category icon or fallback
     * @param {string} fallback - Fallback icon
     * @returns {string} Category icon
     */
    getIcon(fallback = '📦') {
        return this.icon || fallback;
    }

    /**
     * Get category color
     * @param {string} fallback - Fallback color
     * @returns {string} Category color
     */
    getColor(fallback = '#607D8B') {
        return this.color || fallback;
    }

    /**
     * Clone category object
     * @param {Object} options - Clone options
     * @param {boolean} options.keepId - Keep original ID
     * @param {boolean} options.keepTimestamps - Keep original timestamps
     * @returns {Category} New Category instance with same data
     */
    clone(options = {}) {
        const { keepId = false, keepTimestamps = false } = options;
        
        const data = this.toFirestore({ includeMetadata: true, includeSettings: true });
        
        if (!keepId) {
            delete data.id;
            data.id = this.generateId();
        }
        
        if (!keepTimestamps) {
            data.createdAt = new Date();
            data.updatedAt = new Date();
        }
        
        return new Category({ ...data, id: data.id });
    }

    // ============================================
    // COMPARISON METHODS
    // ============================================

    /**
     * Compare two categories for equality
     * @param {Category} other - Other category
     * @returns {boolean} True if same category
     */
    equals(other) {
        if (!other) return false;
        return this.id === other.id;
    }

    /**
     * Check if category is the same by slug
     * @param {string} slug - Slug to compare
     * @returns {boolean} True if same slug
     */
    matchesSlug(slug) {
        return this.slug === slug;
    }

    /**
     * Check if category has a tag
     * @param {string} tag - Tag to check
     * @returns {boolean} True if has tag
     */
    hasTag(tag) {
        return this.tags && this.tags.includes(tag);
    }

    /**
     * Add a tag to category
     * @param {string} tag - Tag to add
     * @returns {Category} Updated category (this)
     */
    addTag(tag) {
        if (!this.tags) this.tags = [];
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
            this.updatedAt = new Date();
        }
        return this;
    }

    /**
     * Remove a tag from category
     * @param {string} tag - Tag to remove
     * @returns {Category} Updated category (this)
     */
    removeTag(tag) {
        if (this.tags) {
            this.tags = this.tags.filter(t => t !== tag);
            this.updatedAt = new Date();
        }
        return this;
    }

    // ============================================
    // STRING REPRESENTATION
    // ============================================

    /**
     * Get string representation
     * @returns {string} String representation
     */
    toString() {
        return `Category(${this.name}, ${this.slug})`;
    }

    /**
     * Get display string for UI
     * @param {Object} options - Display options
     * @param {string} options.format - Display format
     * @param {string} options.separator - Separator for parent/child
     * @returns {string} Display string
     */
    toDisplayString(options = {}) {
        const { format = 'icon_name', separator = ' › ' } = options;
        
        switch (format) {
            case 'icon_name':
                return this.icon ? `${this.icon} ${this.name}` : this.name;
            case 'name_only':
                return this.name;
            case 'name_parent':
                return this.hasParent() ? `${this.name} (${this.parentCategory})` : this.name;
            default:
                return this.icon ? `${this.icon} ${this.name}` : this.name;
        }
    }

    // ============================================
    // STATIC HELPERS
    // ============================================

    /**
     * Check if data is a valid category object
     * @param {Object} data - Data to check
     * @returns {boolean} True if valid category data
     */
    static isValidCategoryData(data) {
        return data && typeof data === 'object' &&
               data.name && data.name.trim() !== '' &&
               data.slug && data.slug.trim() !== '';
    }

    /**
     * Create an array of categories from Firestore data
     * @param {Array} dataArray - Array of Firestore documents
     * @returns {Array<Category>} Array of Category instances
     */
    static fromFirestoreArray(dataArray) {
        if (!Array.isArray(dataArray)) return [];
        return dataArray.map(data => Category.fromFirestore(data, data.id));
    }

    /**
     * Sort categories by display order
     * @param {Array<Category>} categories - Categories array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<Category>} Sorted categories
     */
    static sortByOrder(categories, order = 'asc') {
        const sorted = [...categories];
        sorted.sort((a, b) => {
            return order === 'asc' ? a.displayOrder - b.displayOrder : b.displayOrder - a.displayOrder;
        });
        return sorted;
    }

    /**
     * Sort categories by name
     * @param {Array<Category>} categories - Categories array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<Category>} Sorted categories
     */
    static sortByName(categories, order = 'asc') {
        const sorted = [...categories];
        sorted.sort((a, b) => {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            if (aName < bName) return order === 'asc' ? -1 : 1;
            if (aName > bName) return order === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }

    /**
     * Sort categories by product count
     * @param {Array<Category>} categories - Categories array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<Category>} Sorted categories
     */
    static sortByProductCount(categories, order = 'desc') {
        const sorted = [...categories];
        sorted.sort((a, b) => {
            return order === 'asc' ? a.productCount - b.productCount : b.productCount - a.productCount;
        });
        return sorted;
    }

    /**
     * Sort categories by view count
     * @param {Array<Category>} categories - Categories array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<Category>} Sorted categories
     */
    static sortByViews(categories, order = 'desc') {
        const sorted = [...categories];
        sorted.sort((a, b) => {
            return order === 'asc' ? a.viewCount - b.viewCount : b.viewCount - a.viewCount;
        });
        return sorted;
    }

    /**
     * Sort categories by follower count
     * @param {Array<Category>} categories - Categories array
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array<Category>} Sorted categories
     */
    static sortByFollowers(categories, order = 'desc') {
        const sorted = [...categories];
        sorted.sort((a, b) => {
            return order === 'asc' ? a.followerCount - b.followerCount : b.followerCount - a.followerCount;
        });
        return sorted;
    }

    /**
     * Filter categories by active status
     * @param {Array<Category>} categories - Categories array
     * @param {boolean} active - Active status
     * @returns {Array<Category>} Filtered categories
     */
    static filterByActive(categories, active = true) {
        return categories.filter(c => c.isActive === active);
    }

    /**
     * Filter categories by featured status
     * @param {Array<Category>} categories - Categories array
     * @param {boolean} featured - Featured status
     * @returns {Array<Category>} Filtered categories
     */
    static filterByFeatured(categories, featured = true) {
        return categories.filter(c => c.isFeatured === featured);
    }

    /**
     * Filter categories by popular status
     * @param {Array<Category>} categories - Categories array
     * @param {boolean} popular - Popular status
     * @returns {Array<Category>} Filtered categories
     */
    static filterByPopular(categories, popular = true) {
        return categories.filter(c => c.isPopular === popular);
    }

    /**
     * Filter categories by trending status
     * @param {Array<Category>} categories - Categories array
     * @param {boolean} trending - Trending status
     * @returns {Array<Category>} Filtered categories
     */
    static filterByTrending(categories, trending = true) {
        return categories.filter(c => c.isTrending === trending);
    }

    /**
     * Filter categories by type
     * @param {Array<Category>} categories - Categories array
     * @param {string|Array<string>} types - Type(s) to filter
     * @returns {Array<Category>} Filtered categories
     */
    static filterByType(categories, types) {
        if (!Array.isArray(types)) {
            types = [types];
        }
        return categories.filter(c => types.includes(c.categoryType));
    }

    /**
     * Filter categories by tag
     * @param {Array<Category>} categories - Categories array
     * @param {string} tag - Tag to filter
     * @returns {Array<Category>} Filtered categories
     */
    static filterByTag(categories, tag) {
        return categories.filter(c => c.hasTag(tag));
    }

    /**
     * Filter categories with products
     * @param {Array<Category>} categories - Categories array
     * @param {boolean} hasProducts - Has products
     * @returns {Array<Category>} Filtered categories
     */
    static filterWithProducts(categories, hasProducts = true) {
        return categories.filter(c => hasProducts ? c.hasProducts() : !c.hasProducts());
    }

    /**
     * Get root categories (no parent)
     * @param {Array<Category>} categories - Categories array
     * @param {Object} options - Options
     * @param {boolean} options.includeInactive - Include inactive
     * @param {boolean} options.includeEmpty - Include empty
     * @returns {Array<Category>} Root categories
     */
    static getRootCategories(categories, options = {}) {
        const { includeInactive = false, includeEmpty = true } = options;
        
        let roots = categories.filter(c => !c.hasParent());
        
        if (!includeInactive) {
            roots = roots.filter(c => c.isActive);
        }
        
        if (!includeEmpty) {
            roots = roots.filter(c => c.hasProducts());
        }
        
        return roots;
    }

    /**
     * Get sub-categories (have parent)
     * @param {Array<Category>} categories - Categories array
     * @param {Object} options - Options
     * @param {boolean} options.includeInactive - Include inactive
     * @param {boolean} options.includeEmpty - Include empty
     * @returns {Array<Category>} Sub-categories
     */
    static getSubCategories(categories, options = {}) {
        const { includeInactive = false, includeEmpty = true } = options;
        
        let subs = categories.filter(c => c.hasParent());
        
        if (!includeInactive) {
            subs = subs.filter(c => c.isActive);
        }
        
        if (!includeEmpty) {
            subs = subs.filter(c => c.hasProducts());
        }
        
        return subs;
    }

    /**
     * Build category tree
     * @param {Array<Category>} categories - Categories array
     * @param {string|null} parentId - Parent ID (optional)
     * @param {Object} options - Options
     * @param {boolean} options.includeInactive - Include inactive
     * @param {boolean} options.includeEmpty - Include empty
     * @param {string} options.sortBy - Sort field
     * @param {string} options.sortOrder - Sort order
     * @returns {Array} Category tree
     */
    static buildTree(categories, parentId = null, options = {}) {
        const {
            includeInactive = false,
            includeEmpty = true,
            sortBy = 'displayOrder',
            sortOrder = 'asc'
        } = options;
        
        let filteredCategories = categories;
        
        if (!includeInactive) {
            filteredCategories = filteredCategories.filter(c => c.isActive);
        }
        
        if (!includeEmpty) {
            filteredCategories = filteredCategories.filter(c => c.hasProducts());
        }
        
        const tree = [];
        const children = filteredCategories.filter(c => 
            (parentId === null && !c.hasParent()) || 
            (parentId !== null && c.parentCategory === parentId)
        );
        
        // Sort children
        let sortedChildren = [...children];
        switch (sortBy) {
            case 'displayOrder':
                sortedChildren = Category.sortByOrder(sortedChildren, sortOrder);
                break;
            case 'name':
                sortedChildren = Category.sortByName(sortedChildren, sortOrder);
                break;
            case 'productCount':
                sortedChildren = Category.sortByProductCount(sortedChildren, sortOrder);
                break;
            default:
                sortedChildren = Category.sortByOrder(sortedChildren, sortOrder);
        }
        
        for (const child of sortedChildren) {
            const node = {
                category: child,
                children: Category.buildTree(categories, child.id, options),
                level: child.getLevel(categories)
            };
            tree.push(node);
        }
        
        return tree;
    }

    /**
     * Flatten category tree
     * @param {Array} tree - Category tree
     * @param {number} level - Current level
     * @returns {Array<Category>} Flattened categories
     */
    static flattenTree(tree, level = 0) {
        const result = [];
        for (const node of tree) {
            result.push({ category: node.category, level: level });
            if (node.children && node.children.length > 0) {
                result.push(...Category.flattenTree(node.children, level + 1));
            }
        }
        return result;
    }

    /**
     * Get category by slug
     * @param {Array<Category>} categories - Categories array
     * @param {string} slug - Category slug
     * @returns {Category|null} Category or null
     */
    static getBySlug(categories, slug) {
        return categories.find(c => c.slug === slug) || null;
    }

    /**
     * Get category by ID
     * @param {Array<Category>} categories - Categories array
     * @param {string} id - Category ID
     * @returns {Category|null} Category or null
     */
    static getById(categories, id) {
        return categories.find(c => c.id === id) || null;
    }

    /**
     * Get categories by IDs
     * @param {Array<Category>} categories - Categories array
     * @param {Array<string>} ids - Category IDs
     * @returns {Array<Category>} Found categories
     */
    static getByIds(categories, ids) {
        if (!Array.isArray(ids)) return [];
        return categories.filter(c => ids.includes(c.id));
    }

    /**
     * Get categories by type
     * @param {Array<Category>} categories - Categories array
     * @param {string} type - Category type
     * @returns {Array<Category>} Filtered categories
     */
    static getByType(categories, type) {
        return categories.filter(c => c.categoryType === type);
    }

    /**
     * Get all descendants of a category
     * @param {Array<Category>} categories - Categories array
     * @param {string} categoryId - Category ID
     * @param {Object} options - Options
     * @param {boolean} options.includeSelf - Include the category itself
     * @param {boolean} options.includeInactive - Include inactive
     * @returns {Array<Category>} Descendant categories
     */
    static getDescendants(categories, categoryId, options = {}) {
        const { includeSelf = false, includeInactive = false } = options;
        const result = [];
        
        if (includeSelf) {
            const self = categories.find(c => c.id === categoryId);
            if (self) result.push(self);
        }
        
        const directChildren = categories.filter(c => c.parentCategory === categoryId);
        
        for (const child of directChildren) {
            if (!includeInactive && !child.isActive) continue;
            result.push(child);
            const grandchildren = Category.getDescendants(categories, child.id, options);
            result.push(...grandchildren);
        }
        
        return result;
    }

    /**
     * Get all ancestors of a category
     * @param {Array<Category>} categories - Categories array
     * @param {string} categoryId - Category ID
     * @param {Object} options - Options
     * @param {boolean} options.includeSelf - Include the category itself
     * @returns {Array<Category>} Ancestor categories
     */
    static getAncestors(categories, categoryId, options = {}) {
        const { includeSelf = false } = options;
        const result = [];
        const category = categories.find(c => c.id === categoryId);
        
        if (includeSelf && category) {
            result.push(category);
        }
        
        if (category && category.hasParent()) {
            const parent = categories.find(c => c.id === category.parentCategory);
            if (parent) {
                result.push(parent);
                const grandAncestors = Category.getAncestors(categories, parent.id);
                result.push(...grandAncestors);
            }
        }
        
        return result;
    }

    /**
     * Get category path (breadcrumb)
     * @param {Array<Category>} categories - Categories array
     * @param {string} categoryId - Category ID
     * @param {Object} options - Options
     * @param {boolean} options.includeHome - Include home in path
     * @param {boolean} options.includeSelf - Include self in path
     * @returns {Array<Category>} Category path
     */
    static getPath(categories, categoryId, options = {}) {
        const { includeHome = true, includeSelf = true } = options;
        const ancestors = Category.getAncestors(categories, categoryId);
        const category = categories.find(c => c.id === categoryId);
        
        const path = [...ancestors.reverse()];
        if (includeSelf && category) {
            path.push(category);
        }
        
        return path.filter(Boolean);
    }

    /**
     * Get category product count total (including sub-categories)
     * @param {Array<Category>} categories - Categories array
     * @param {string} categoryId - Category ID
     * @param {Object} options - Options
     * @param {boolean} options.includeDescendants - Include descendants
     * @returns {number} Total product count
     */
    static getTotalProductCount(categories, categoryId, options = {}) {
        const { includeDescendants = true } = options;
        const category = categories.find(c => c.id === categoryId);
        if (!category) return 0;
        
        let total = category.productCount || 0;
        
        if (includeDescendants) {
            const descendants = Category.getDescendants(categories, categoryId);
            for (const descendant of descendants) {
                total += descendant.productCount || 0;
            }
        }
        
        return total;
    }

    /**
     * Get category with most products
     * @param {Array<Category>} categories - Categories array
     * @param {Object} options - Options
     * @param {boolean} options.includeInactive - Include inactive
     * @returns {Category|null} Category with most products
     */
    static getMostPopular(categories, options = {}) {
        const { includeInactive = false } = options;
        
        let filtered = categories;
        if (!includeInactive) {
            filtered = filtered.filter(c => c.isActive);
        }
        
        if (!filtered || filtered.length === 0) return null;
        return filtered.reduce((max, current) => 
            (current.productCount > max.productCount) ? current : max
        );
    }

    /**
     * Get top categories by product count
     * @param {Array<Category>} categories - Categories array
     * @param {number} limit - Number of categories to return
     * @param {Object} options - Options
     * @param {boolean} options.includeInactive - Include inactive
     * @returns {Array<Category>} Top categories
     */
    static getTopByProductCount(categories, limit = 10, options = {}) {
        const { includeInactive = false } = options;
        
        let filtered = categories;
        if (!includeInactive) {
            filtered = filtered.filter(c => c.isActive);
        }
        
        const sorted = Category.sortByProductCount(filtered, 'desc');
        return sorted.slice(0, limit);
    }

    /**
     * Get top categories by view count
     * @param {Array<Category>} categories - Categories array
     * @param {number} limit - Number of categories to return
     * @param {Object} options - Options
     * @param {boolean} options.includeInactive - Include inactive
     * @returns {Array<Category>} Top categories
     */
    static getTopByViews(categories, limit = 10, options = {}) {
        const { includeInactive = false } = options;
        
        let filtered = categories;
        if (!includeInactive) {
            filtered = filtered.filter(c => c.isActive);
        }
        
        const sorted = Category.sortByViews(filtered, 'desc');
        return sorted.slice(0, limit);
    }

    /**
     * Get default categories (predefined)
     * @returns {Array<Object>} Default categories
     */
    static getDefaultCategories() {
        return [
            { name: 'Wallpapers', icon: '🖼️', description: 'High-quality wallpapers for all devices', color: '#4CAF50', categoryType: 'main' },
            { name: 'Icons', icon: '🎨', description: 'Beautiful icon packs for apps and websites', color: '#2196F3', categoryType: 'main' },
            { name: 'Digital Art', icon: '🖌️', description: 'Digital artwork from talented creators', color: '#9C27B0', categoryType: 'main' },
            { name: 'Assets', icon: '📦', description: 'Game assets, 3D models, and more', color: '#FF9800', categoryType: 'main' },
            { name: 'Templates', icon: '📄', description: 'Website, presentation, and document templates', color: '#F44336', categoryType: 'main' },
            { name: 'Mockups', icon: '📱', description: 'Device mockups for presentations', color: '#00BCD4', categoryType: 'main' },
            { name: 'Fonts', icon: '🔤', description: 'Professional fonts for designers', color: '#795548', categoryType: 'main' },
            { name: 'Stock Photos', icon: '📸', description: 'High-quality stock photography', color: '#607D8B', categoryType: 'main' },
            { name: 'UI Kits', icon: '🎯', description: 'UI kits for designers and developers', color: '#E91E63', categoryType: 'main' },
            { name: '3D Models', icon: '🎮', description: '3D models for games and visualization', color: '#FF5722', categoryType: 'main' }
        ];
    }

    /**
     * Create default categories
     * @param {Object} options - Options
     * @param {string} options.prefix - Name prefix
     * @param {number} options.startOrder - Starting display order
     * @returns {Array<Category>} Default category instances
     */
    static createDefaultCategories(options = {}) {
        const { prefix = '', startOrder = 0 } = options;
        const defaults = Category.getDefaultCategories();
        
        return defaults.map((cat, index) => 
            new Category({
                name: prefix ? `${prefix} ${cat.name}` : cat.name,
                slug: Category.generateSlug(cat.name),
                icon: cat.icon,
                description: cat.description,
                displayOrder: startOrder + index,
                isActive: true,
                productCount: 0,
                viewCount: 0,
                followerCount: 0,
                color: cat.color || '#607D8B',
                categoryType: cat.categoryType || 'main',
                tags: cat.tags || [],
                isFeatured: index < 3,
                isPopular: false,
                isTrending: false,
                settings: {
                    allowSubCategories: true,
                    showInMenu: true,
                    showInFooter: false
                },
                metadata: {
                    source: 'default'
                }
            })
        );
    }

    /**
     * Create sub-categories from parent
     * @param {string} parentId - Parent category ID
     * @param {Array<string>} names - Sub-category names
     * @param {Object} options - Options
     * @returns {Array<Category>} Sub-category instances
     */
    static createSubCategories(parentId, names, options = {}) {
        const { icon = '📎', color = '#607D8B', startOrder = 0 } = options;
        
        return names.map((name, index) => 
            new Category({
                name: name,
                slug: Category.generateSlug(name),
                icon: icon,
                description: `Sub-category of ${name}`,
                displayOrder: startOrder + index,
                isActive: true,
                productCount: 0,
                viewCount: 0,
                followerCount: 0,
                color: color,
                parentCategory: parentId,
                categoryType: 'sub',
                tags: ['sub-category'],
                settings: {
                    allowSubCategories: false,
                    showInMenu: false,
                    showInFooter: false
                },
                metadata: {
                    parentId: parentId
                }
            })
        );
    }
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default Category;

// ============================================================
// END OF FILE: category-model.js
// ============================================================