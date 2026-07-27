// ============================================================
// FILE: js/screens/upload-screen.js
// PURPOSE: Seller Product Upload - Complete Form
// DEPENDENCIES: auth-service.js, store.js, storage-service.js
// ROUTE: /upload
// VERSION: 4.0.0 - FULL PRODUCTION
// ============================================================

import { store, getState, setState, subscribe } from '../store.js';
import { eventBus, EVENTS } from '../state/event-bus.js';
import { router, ROUTES } from '../router.js';
import { logger } from '../services/logger.js';
import { analyticsService } from '../services/analytics-service.js';
import { authService } from '../services/auth-service.js';
import { databaseService } from '../services/database-service.js';
import { storageService } from '../services/storage-service.js';
import { ToastNotification } from '../widgets/toast-notification.js';
import { Modal } from '../widgets/modal.js';
import { LoadingSpinner } from '../widgets/loading-spinner.js';
import { validators } from '../utils/validators.js';

// ============================================================
// UPLOAD SCREEN CLASS
// ============================================================

export class UploadScreen {
    constructor(options = {}) {
        // ==========================================
        // CONFIGURATION
        // ==========================================
        this.config = {
            maxFileSize: 50 * 1024 * 1024, // 50MB
            maxImages: 5,
            allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
            allowedFileTypes: [
                'application/pdf',
                'application/zip',
                'application/x-rar-compressed',
                'application/x-7z-compressed',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'audio/mpeg',
                'audio/wav',
                'audio/ogg',
                'video/mp4',
                'video/webm',
                'video/ogg',
                'image/*'
            ],
            ...options
        };

        // ==========================================
        // STATE
        // ==========================================
        this._id = this._generateId('upload');
        this._isDestroyed = false;
        this._isRendered = false;
        this._container = null;
        this._subscribers = [];
        this._eventListeners = [];
        this._isLoading = false;
        this._isUploading = false;
        this._uploadProgress = 0;
        this._editingProduct = null;
        this._isEditMode = false;

        // ==========================================
        // FORM DATA
        // ==========================================
        this._formData = {
            title: '',
            description: '',
            category: '',
            subCategory: '',
            tags: [],
            productType: 'digital',
            // Digital fields
            fileSize: 0,
            fileType: '',
            downloadUrl: '',
            isLargeFile: false,
            driveFileId: '',
            // Physical fields
            price: 0,
            discount: 0,
            currency: 'USD',
            location: {
                address: '',
                city: '',
                state: '',
                country: '',
                pincode: '',
                lat: 0,
                lng: 0
            },
            shipping: {
                available: false,
                cost: 0,
                deliveryTime: ''
            },
            quantity: 0,
            condition: 'new',
            isNegotiable: false,
            // Common
            isFree: false,
            isPaid: false,
            contactMethod: 'chat',
            images: [],
            mockups: [],
            videoUrl: '',
            file: null,
            thumbnail: null,
            // Status
            isFeatured: false,
            isTrending: false
        };

        // ==========================================
        // BIND METHODS
        // ==========================================
        this._handleSubmit = this._handleSubmit.bind(this);
        this._handleCancel = this._handleCancel.bind(this);
        this._handleFileUpload = this._handleFileUpload.bind(this);
        this._handleImageUpload = this._handleImageUpload.bind(this);
        this._handleInputChange = this._handleInputChange.bind(this);
        this._handleProductTypeChange = this._handleProductTypeChange.bind(this);
        this._handleCategoryChange = this._handleCategoryChange.bind(this);
        this._handleTagsInput = this._handleTagsInput.bind(this);
        this._handleLocationChange = this._handleLocationChange.bind(this);
        this._handlePriceChange = this._handlePriceChange.bind(this);
        this._handleThemeChange = this._handleThemeChange.bind(this);
        this._handleAuthChange = this._handleAuthChange.bind(this);

        // ==========================================
        // SETUP
        // ==========================================
        this._setupSubscriptions();
        this._setupEventListeners();
        
        // Check if editing
        const params = new URLSearchParams(window.location.search);
        if (params.has('edit')) {
            this._isEditMode = true;
            this._editingProduct = params.get('edit');
        }

        logger.info('📤 UploadScreen initialized', { id: this._id, editMode: this._isEditMode });
    }

    // ============================================================
    // RENDER
    // ============================================================

    render() {
        if (this._isDestroyed) {
            logger.warn('⚠️ UploadScreen destroyed, cannot render');
            return null;
        }

        if (this._isRendered) {
            return this._container;
        }

        logger.info('📤 Rendering UploadScreen...');

        // Check authentication
        const user = getState('auth.user');
        if (!user) {
            ToastNotification.show('Please login to upload products', 'warning');
            router.navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
            return null;
        }

        // Check seller status
        if (!user.isSeller) {
            ToastNotification.show('Please enable seller mode to upload products', 'warning');
            router.navigate('/settings');
            return null;
        }

        // Load product if editing
        if (this._isEditMode && this._editingProduct) {
            this._loadProductForEdit(this._editingProduct);
        }

        // Create container
        this._container = this._createContainer();

        // Build sections
        this._buildHeader();
        this._buildForm();
        this._buildProgressBar();

        // Apply theme
        this._applyTheme();

        // Track view
        analyticsService.trackPageView('upload', { edit: this._isEditMode });

        this._isRendered = true;
        logger.info('✅ UploadScreen rendered');

        return this._container;
    }

    // ============================================================
    // CONTAINER
    // ============================================================

    _createContainer() {
        const container = document.createElement('div');
        container.className = 'upload-screen';
        container.id = `upload-screen-${this._id}`;
        container.style.cssText = `
            max-width: 900px;
            margin: 0 auto;
            padding: 16px 20px 100px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            min-height: 100vh;
            transition: all 0.3s ease;
            position: relative;
        `;
        return container;
    }

    // ============================================================
    // HEADER
    // ============================================================

    _buildHeader() {
        const header = document.createElement('header');
        header.className = 'upload-header';
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0 16px;
            flex-wrap: wrap;
            gap: 12px;
            border-bottom: 1px solid var(--border-color, rgba(0,0,0,0.06));
            margin-bottom: 24px;
        `;

        // Left
        const left = document.createElement('div');

        const title = document.createElement('h1');
        title.textContent = this._isEditMode ? '📝 Edit Product' : '📤 Upload Product';
        title.style.cssText = `
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            color: var(--text-primary, #1a1a2e);
        `;

        const subtitle = document.createElement('p');
        subtitle.textContent = this._isEditMode 
            ? 'Update your product details'
            : 'Sell your product to thousands of buyers';
        subtitle.style.cssText = `
            margin: 2px 0 0;
            font-size: 14px;
            color: var(--text-secondary, #6b7280);
        `;

        left.appendChild(title);
        left.appendChild(subtitle);
        header.appendChild(left);

        // Right - Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '✕ Cancel';
        cancelBtn.style.cssText = `
            padding: 8px 16px;
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: 8px;
            background: transparent;
            color: var(--text-secondary, #6b7280);
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.background = 'rgba(0,0,0,0.05)';
        });
        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.background = 'transparent';
        });
        cancelBtn.addEventListener('click', this._handleCancel);

        header.appendChild(cancelBtn);

        this._container.appendChild(header);
        this._headerEl = header;
    }

    // ============================================================
    // FORM
    // ============================================================

    _buildForm() {
        const form = document.createElement('form');
        form.className = 'upload-form';
        form.id = `upload-form-${this._id}`;
        form.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 20px;
        `;

        // --- Basic Information ---
        const basicSection = this._createSection('Basic Information');

        // Title
        const titleGroup = this._createInputGroup('title', 'Product Title', 'text', '📝');
        const titleInput = titleGroup.querySelector('input');
        titleInput.placeholder = 'Enter product title';
        titleInput.value = this._formData.title;
        titleInput.required = true;
        titleInput.addEventListener('change', (e) => {
            this._formData.title = e.target.value;
        });
        basicSection.appendChild(titleGroup);

        // Description
        const descGroup = document.createElement('div');
        descGroup.className = 'form-group';
        descGroup.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 6px;
        `;

        const descLabel = document.createElement('label');
        descLabel.textContent = '📄 Description';
        descLabel.style.cssText = `
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary, #1a1a2e);
        `;

        const descInput = document.createElement('textarea');
        descInput.placeholder = 'Describe your product in detail...';
        descInput.value = this._formData.description;
        descInput.style.cssText = `
            width: 100%;
            padding: 10px 12px;
            border-radius: 8px;
            border: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-primary, #fff);
            color: var(--text-primary, #1f2937);
            font-size: 14px;
            outline: none;
            resize: vertical;
            min-height: 120px;
            box-sizing: border-box;
            font-family: inherit;
        `;
        descInput.addEventListener('focus', () => {
            descInput.style.borderColor = '#6366f1';
            descInput.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
        });
        descInput.addEventListener('blur', () => {
            descInput.style.borderColor = 'var(--border-color, #e5e7eb)';
            descInput.style.boxShadow = 'none';
        });
        descInput.addEventListener('input', (e) => {
            this._formData.description = e.target.value;
            const charCount = e.target.value.length;
            const label = descGroup.querySelector('.char-count');
            if (label) {
                label.textContent = `${charCount} characters`;
            }
        });

        const charCount = document.createElement('span');
        charCount.className = 'char-count';
        charCount.textContent = '0 characters';
        charCount.style.cssText = `
            font-size: 12px;
            color: var(--text-secondary, #6b7280);
            text-align: right;
        `;

        descGroup.appendChild(descLabel);
        descGroup.appendChild(descInput);
        descGroup.appendChild(charCount);
        basicSection.appendChild(descGroup);

        // --- Product Type ---
        const typeSection = this._createSection('Product Type');

        const typeContainer = document.createElement('div');
        typeContainer.style.cssText = `
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        `;

        const types = [
            { value: 'digital', label: '📱 Digital', description: 'PDF, Images, Audio, Video, Software' },
            { value: 'physical', label: '📦 Physical', description: 'Physical items, goods' },
            { value: 'service', label: '🛠️ Service', description: 'Services, consulting, freelancing' }
        ];

        types.forEach(type => {
            const option = document.createElement('label');
            option.style.cssText = `
                flex: 1;
                padding: 16px;
                border-radius: 10px;
                border: 2px solid ${this._formData.productType === type.value ? '#6366f1' : 'var(--border-color, #e5e7eb)'};
                background: ${this._formData.productType === type.value ? 'rgba(99,102,241,0.05)' : 'transparent'};
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
                min-width: 120px;
            `;

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'productType';
            radio.value = type.value;
            radio.checked = this._formData.productType === type.value;
            radio.style.cssText = `
                display: none;
            `;

            const label = document.createElement('div');
            label.textContent = type.label;
            label.style.cssText = `
                font-size: 16px;
                font-weight: 600;
                color: var(--text-primary, #1a1a2e);
            `;

            const desc = document.createElement('div');
            desc.textContent = type.description;
            desc.style.cssText = `
                font-size: 12px;
                color: var(--text-secondary, #6b7280);
                margin-top: 4px;
            `;

            option.appendChild(radio);
            option.appendChild(label);
            option.appendChild(desc);

            option.addEventListener('click', () => {
                this._formData.productType = type.value;
                this._handleProductTypeChange(type.value);
                // Update styles
                typeContainer.querySelectorAll('label').forEach(el => {
                    el.style.borderColor = 'var(--border-color, #e5e7eb)';
                    el.style.background = 'transparent';
                });
                option.style.borderColor = '#6366f1';
                option.style.background = 'rgba(99,102,241,0.05)';
                // Show/hide fields
                this._toggleFields(type.value);
            });

            typeContainer.appendChild(option);
        });

        typeSection.appendChild(typeContainer);
        form.appendChild(typeSection);

        // --- Dynamic Fields ---
        this._dynamicFieldsContainer = document.createElement('div');
        this._dynamicFieldsContainer.className = 'dynamic-fields';
        form.appendChild(this._dynamicFieldsContainer);

        // Build dynamic fields based on initial type
        this._toggleFields(this._formData.productType);

        // --- Categories ---
        const catSection = this._createSection('Categories & Tags');

        // Category
        const catGroup = this._createSelectGroup('category', 'Category');
        const catSelect = catGroup.querySelector('select');
        catSelect.style.cssText = `
            width: 100%;
            padding: 10px 12px;
            border-radius: 8px;
            border: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-primary, #fff);
            color: var(--text-primary, #1f2937);
            font-size: 14px;
            outline: none;
            cursor: pointer;
        `;

        const categories = getState('categories.items') || [];
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select category';
        catSelect.appendChild(defaultOption);

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name || 'Category';
            if (cat.id === this._formData.category) {
                option.selected = true;
            }
            catSelect.appendChild(option);
        });

        catSelect.addEventListener('change', (e) => {
            this._formData.category = e.target.value;
            this._handleCategoryChange(e.target.value);
        });

        catGroup.appendChild(catSelect);
        catSection.appendChild(catGroup);

        // Sub Category
        const subCatGroup = this._createSelectGroup('subCategory', 'Sub Category');
        const subCatSelect = subCatGroup.querySelector('select');
        subCatSelect.style.cssText = `
            width: 100%;
            padding: 10px 12px;
            border-radius: 8px;
            border: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-primary, #fff);
            color: var(--text-primary, #1f2937);
            font-size: 14px;
            outline: none;
            cursor: pointer;
        `;

        const subDefault = document.createElement('option');
        subDefault.value = '';
        subDefault.textContent = 'Select sub category';
        subCatSelect.appendChild(subDefault);

        // Add some sub-categories based on main category
        const subCategories = this._getSubCategories(this._formData.category);
        subCategories.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub;
            option.textContent = sub;
            if (sub === this._formData.subCategory) {
                option.selected = true;
            }
            subCatSelect.appendChild(option);
        });

        subCatSelect.addEventListener('change', (e) => {
            this._formData.subCategory = e.target.value;
        });

        subCatGroup.appendChild(subCatSelect);
        catSection.appendChild(subCatGroup);

        // Tags
        const tagsGroup = document.createElement('div');
        tagsGroup.className = 'form-group';
        tagsGroup.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 6px;
        `;

        const tagsLabel = document.createElement('label');
        tagsLabel.textContent = '🏷️ Tags (comma separated)';
        tagsLabel.style.cssText = `
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary, #1a1a2e);
        `;

        const tagsInput = document.createElement('input');
        tagsInput.type = 'text';
        tagsInput.placeholder = 'e.g., design, template, premium';
        tagsInput.value = this._formData.tags.join(', ');
        tagsInput.style.cssText = `
            width: 100%;
            padding: 10px 12px;
            border-radius: 8px;
            border: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-primary, #fff);
            color: var(--text-primary, #1f2937);
            font-size: 14px;
            outline: none;
            box-sizing: border-box;
        `;
        tagsInput.addEventListener('focus', () => {
            tagsInput.style.borderColor = '#6366f1';
            tagsInput.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
        });
        tagsInput.addEventListener('blur', () => {
            tagsInput.style.borderColor = 'var(--border-color, #e5e7eb)';
            tagsInput.style.boxShadow = 'none';
        });
        tagsInput.addEventListener('input', (e) => {
            this._formData.tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
        });

        tagsGroup.appendChild(tagsLabel);
        tagsGroup.appendChild(tagsInput);
        catSection.appendChild(tagsGroup);

        form.appendChild(catSection);

        // --- Media ---
        const mediaSection = this._createSection('📸 Media');

        // Images
        const imageGroup = document.createElement('div');
        imageGroup.className = 'form-group';
        imageGroup.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 6px;
        `;

        const imageLabel = document.createElement('label');
        imageLabel.textContent = `Product Images (max ${this.config.maxImages})`;
        imageLabel.style.cssText = `
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary, #1a1a2e);
        `;

        const imageDropzone = document.createElement('div');
        imageDropzone.className = 'upload-dropzone';
        imageDropzone.style.cssText = `
            border: 2px dashed var(--border-color, #e5e7eb);
            border-radius: 10px;
            padding: 40px 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            background: var(--bg-secondary, #f9fafb);
        `;
        imageDropzone.innerHTML = `
            <div style="font-size:48px;margin-bottom:8px;">📷</div>
            <div style="font-size:14px;color:var(--text-secondary,#6b7280);">Drop images here or click to browse</div>
            <div style="font-size:12px;color:var(--text-secondary,#6b7280);margin-top:4px;">JPEG, PNG, WEBP, GIF</div>
        `;

        imageDropzone.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = true;
            input.addEventListener('change', (e) => {
                this._handleImageUpload(e.target.files);
            });
            input.click();
        });

        imageDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            imageDropzone.style.borderColor = '#6366f1';
            imageDropzone.style.background = 'rgba(99,102,241,0.05)';
        });
        imageDropzone.addEventListener('dragleave', () => {
            imageDropzone.style.borderColor = 'var(--border-color, #e5e7eb)';
            imageDropzone.style.background = 'var(--bg-secondary, #f9fafb)';
        });
        imageDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            imageDropzone.style.borderColor = 'var(--border-color, #e5e7eb)';
            imageDropzone.style.background = 'var(--bg-secondary, #f9fafb)';
            this._handleImageUpload(e.dataTransfer.files);
        });

        // Image previews
        const previewContainer = document.createElement('div');
        previewContainer.className = 'image-preview-container';
        previewContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 8px;
            margin-top: 12px;
        `;

        this._formData.images.forEach((img, index) => {
            const preview = this._createImagePreview(img, index);
            previewContainer.appendChild(preview);
        });

        imageGroup.appendChild(imageLabel);
        imageGroup.appendChild(imageDropzone);
        imageGroup.appendChild(previewContainer);
        mediaSection.appendChild(imageGroup);

        // Video URL
        const videoGroup = this._createInputGroup('videoUrl', 'Video URL (optional)', 'url', '🎬');
        const videoInput = videoGroup.querySelector('input');
        videoInput.placeholder = 'https://youtube.com/watch?v=...';
        videoInput.value = this._formData.videoUrl;
        videoInput.addEventListener('change', (e) => {
            this._formData.videoUrl = e.target.value;
        });
        mediaSection.appendChild(videoGroup);

        // Mockups
        const mockupGroup = document.createElement('div');
        mockupGroup.className = 'form-group';
        mockupGroup.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 6px;
        `;

        const mockupLabel = document.createElement('label');
        mockupLabel.textContent = '📐 Mockups (optional)';
        mockupLabel.style.cssText = `
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary, #1a1a2e);
        `;

        const mockupDropzone = document.createElement('div');
        mockupDropzone.className = 'upload-dropzone';
        mockupDropzone.style.cssText = `
            border: 2px dashed var(--border-color, #e5e7eb);
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            background: var(--bg-secondary, #f9fafb);
        `;
        mockupDropzone.innerHTML = `
            <div style="font-size:32px;margin-bottom:4px;">🖼️</div>
            <div style="font-size:13px;color:var(--text-secondary,#6b7280);">Upload mockups</div>
        `;

        mockupDropzone.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = true;
            input.addEventListener('change', (e) => {
                this._handleMockupUpload(e.target.files);
            });
            input.click();
        });

        mockupGroup.appendChild(mockupLabel);
        mockupGroup.appendChild(mockupDropzone);
        mediaSection.appendChild(mockupGroup);

        form.appendChild(mediaSection);

        // --- Actions ---
        const actionsSection = document.createElement('div');
        actionsSection.style.cssText = `
            display: flex;
            gap: 12px;
            padding-top: 20px;
            border-top: 1px solid var(--border-color, #e5e7eb);
            flex-wrap: wrap;
        `;

        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.textContent = this._isEditMode ? '💾 Update Product' : '🚀 Publish Product';
        submitBtn.style.cssText = `
            flex: 2;
            padding: 14px 24px;
            border: none;
            border-radius: 10px;
            background: #6366f1;
            color: #fff;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            min-width: 140px;
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

        // Spinner in button
        const spinner = document.createElement('span');
        spinner.className = 'upload-spinner';
        spinner.style.cssText = `
            display: none;
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-left: 8px;
        `;
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        submitBtn.appendChild(spinner);

        const draftBtn = document.createElement('button');
        draftBtn.type = 'button';
        draftBtn.textContent = '💾 Save Draft';
        draftBtn.style.cssText = `
            flex: 1;
            padding: 14px 24px;
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: 10px;
            background: transparent;
            color: var(--text-secondary, #6b7280);
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        draftBtn.addEventListener('mouseenter', () => {
            draftBtn.style.background = 'rgba(0,0,0,0.05)';
        });
        draftBtn.addEventListener('mouseleave', () => {
            draftBtn.style.background = 'transparent';
        });
        draftBtn.addEventListener('click', () => {
            this._formData.status = 'draft';
            this._handleSubmit();
        });

        actionsSection.appendChild(submitBtn);
        actionsSection.appendChild(draftBtn);
        form.appendChild(actionsSection);

        // Form submit
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this._formData.status = 'published';
            this._handleSubmit();
        });

        this._container.appendChild(form);
        this._form = form;
        this._submitBtn = submitBtn;
        this._spinner = spinner;
        this._imagePreviewContainer = previewContainer;

        // Store references
        this._titleInput = titleInput;
        this._descInput = descInput;
        this._catSelect = catSelect;
        this._subCatSelect = subCatSelect;
        this._tagsInput = tagsInput;
    }

    // ============================================================
    // DYNAMIC FIELDS
    // ============================================================

    _toggleFields(type) {
        if (!this._dynamicFieldsContainer) return;

        this._dynamicFieldsContainer.innerHTML = '';

        if (type === 'digital') {
            this._buildDigitalFields();
        } else if (type === 'physical') {
            this._buildPhysicalFields();
        } else if (type === 'service') {
            this._buildServiceFields();
        }
    }

    _buildDigitalFields() {
        const section = this._createSection('📁 Digital Product Details');

        // File Upload
        const fileGroup = document.createElement('div');
        fileGroup.className = 'form-group';
        fileGroup.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 6px;
        `;

        const fileLabel = document.createElement('label');
        fileLabel.textContent = '📎 Upload File';
        fileLabel.style.cssText = `
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary, #1a1a2e);
        `;

        const fileDropzone = document.createElement('div');
        fileDropzone.className = 'upload-dropzone';
        fileDropzone.style.cssText = `
            border: 2px dashed var(--border-color, #e5e7eb);
            border-radius: 10px;
            padding: 30px 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            background: var(--bg-secondary, #f9fafb);
        `;
        fileDropzone.innerHTML = `
            <div style="font-size:32px;margin-bottom:4px;">📄</div>
            <div style="font-size:14px;color:var(--text-secondary,#6b7280);">Drop file here or click to browse</div>
            <div style="font-size:12px;color:var(--text-secondary,#6b7280);margin-top:4px;">Max 50MB</div>
        `;

        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        fileInfo.style.cssText = `
            display: ${this._formData.file ? 'block' : 'none'};
            padding: 8px 12px;
            border-radius: 6px;
            background: var(--bg-secondary, #f3f4f6);
            font-size: 13px;
            color: var(--text-primary, #1f2937);
            margin-top: 8px;
        `;
        fileInfo.textContent = this._formData.file ? `📎 ${this._formData.file.name}` : '';

        fileDropzone.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = this.config.allowedFileTypes.join(',');
            input.addEventListener('change', (e) => {
                this._handleFileUpload(e.target.files);
            });
            input.click();
        });

        fileDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileDropzone.style.borderColor = '#6366f1';
            fileDropzone.style.background = 'rgba(99,102,241,0.05)';
        });
        fileDropzone.addEventListener('dragleave', () => {
            fileDropzone.style.borderColor = 'var(--border-color, #e5e7eb)';
            fileDropzone.style.background = 'var(--bg-secondary, #f9fafb)';
        });
        fileDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            fileDropzone.style.borderColor = 'var(--border-color, #e5e7eb)';
            fileDropzone.style.background = 'var(--bg-secondary, #f9fafb)';
            this._handleFileUpload(e.dataTransfer.files);
        });

        fileGroup.appendChild(fileLabel);
        fileGroup.appendChild(fileDropzone);
        fileGroup.appendChild(fileInfo);
        section.appendChild(fileGroup);

        this._dynamicFieldsContainer.appendChild(section);
        this._fileDropzone = fileDropzone;
        this._fileInfo = fileInfo;
    }

    _buildPhysicalFields() {
        const section = this._createSection('📦 Physical Product Details');

        // Price
        const priceGroup = document.createElement('div');
        priceGroup.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        `;

        const priceInputGroup = this._createInputGroup('price', 'Price', 'number', '💰');
        const priceInput = priceInputGroup.querySelector('input');
        priceInput.placeholder = '0.00';
        priceInput.value = this._formData.price || '';
        priceInput.addEventListener('change', (e) => {
            this._formData.price = parseFloat(e.target.value) || 0;
        });
        priceGroup.appendChild(priceInputGroup);

        const discountGroup = this._createInputGroup('discount', 'Discount %', 'number', '🏷️');
        const discountInput = discountGroup.querySelector('input');
        discountInput.placeholder = '0';
        discountInput.value = this._formData.discount || '';
        discountInput.addEventListener('change', (e) => {
            this._formData.discount = parseFloat(e.target.value) || 0;
        });
        priceGroup.appendChild(discountGroup);

        section.appendChild(priceGroup);

        // Quantity
        const quantityGroup = this._createInputGroup('quantity', 'Quantity', 'number', '📦');
        const quantityInput = quantityGroup.querySelector('input');
        quantityInput.placeholder = '0';
        quantityInput.value = this._formData.quantity || '';
        quantityInput.addEventListener('change', (e) => {
            this._formData.quantity = parseInt(e.target.value) || 0;
        });
        section.appendChild(quantityGroup);

        // Condition
        const conditionGroup = this._createSelectGroup('condition', 'Condition');
        const conditionSelect = conditionGroup.querySelector('select');
        const conditions = [
            { value: 'new', label: '🆕 New' },
            { value: 'used', label: '🔄 Used' },
            { value: 'refurbished', label: '🔄 Refurbished' }
        ];
        conditions.forEach(c => {
            const option = document.createElement('option');
            option.value = c.value;
            option.textContent = c.label;
            if (c.value === this._formData.condition) {
                option.selected = true;
            }
            conditionSelect.appendChild(option);
        });
        conditionSelect.addEventListener('change', (e) => {
            this._formData.condition = e.target.value;
        });
        section.appendChild(conditionGroup);

        // Location
        const locationSection = this._createSection('📍 Location');

        const locFields = ['address', 'city', 'state', 'country', 'pincode'];
        locFields.forEach(field => {
            const group = this._createInputGroup(field, field.charAt(0).toUpperCase() + field.slice(1), 'text', '📍');
            const input = group.querySelector('input');
            input.value = this._formData.location[field] || '';
            input.addEventListener('change', (e) => {
                this._formData.location[field] = e.target.value;
            });
            locationSection.appendChild(group);
        });

        section.appendChild(locationSection);

        // Shipping
        const shippingSection = this._createSection('🚚 Shipping');

        const shippingGroup = document.createElement('div');
        shippingGroup.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        `;

        const shippingCostGroup = this._createInputGroup('shippingCost', 'Shipping Cost', 'number', '💰');
        const shippingCostInput = shippingCostGroup.querySelector('input');
        shippingCostInput.placeholder = '0.00';
        shippingCostInput.value = this._formData.shipping.cost || '';
        shippingCostInput.addEventListener('change', (e) => {
            this._formData.shipping.cost = parseFloat(e.target.value) || 0;
        });
        shippingGroup.appendChild(shippingCostGroup);

        const deliveryGroup = this._createInputGroup('deliveryTime', 'Delivery Time', 'text', '⏱️');
        const deliveryInput = deliveryGroup.querySelector('input');
        deliveryInput.placeholder = '3-5 days';
        deliveryInput.value = this._formData.shipping.deliveryTime || '';
        deliveryInput.addEventListener('change', (e) => {
            this._formData.shipping.deliveryTime = e.target.value;
        });
        shippingGroup.appendChild(deliveryGroup);

        shippingSection.appendChild(shippingGroup);

        // Shipping available toggle
        const shippingToggleGroup = document.createElement('div');
        shippingToggleGroup.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
        `;

        const shippingToggle = document.createElement('input');
        shippingToggle.type = 'checkbox';
        shippingToggle.checked = this._formData.shipping.available;
        shippingToggle.style.cssText = `
            width: 18px;
            height: 18px;
            accent-color: #6366f1;
            cursor: pointer;
        `;
        shippingToggle.addEventListener('change', (e) => {
            this._formData.shipping.available = e.target.checked;
        });

        const shippingLabel = document.createElement('label');
        shippingLabel.textContent = 'Shipping available';
        shippingLabel.style.cssText = `
            font-size: 14px;
            color: var(--text-primary, #1a1a2e);
            cursor: pointer;
        `;

        shippingToggleGroup.appendChild(shippingToggle);
        shippingToggleGroup.appendChild(shippingLabel);
        shippingSection.appendChild(shippingToggleGroup);

        // Negotiable
        const negotiableGroup = document.createElement('div');
        negotiableGroup.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
        `;

        const negotiableToggle = document.createElement('input');
        negotiableToggle.type = 'checkbox';
        negotiableToggle.checked = this._formData.isNegotiable;
        negotiableToggle.style.cssText = `
            width: 18px;
            height: 18px;
            accent-color: #6366f1;
            cursor: pointer;
        `;
        negotiableToggle.addEventListener('change', (e) => {
            this._formData.isNegotiable = e.target.checked;
        });

        const negotiableLabel = document.createElement('label');
        negotiableLabel.textContent = 'Price is negotiable';
        negotiableLabel.style.cssText = `
            font-size: 14px;
            color: var(--text-primary, #1a1a2e);
            cursor: pointer;
        `;

        negotiableGroup.appendChild(negotiableToggle);
        negotiableGroup.appendChild(negotiableLabel);
        shippingSection.appendChild(negotiableGroup);

        section.appendChild(shippingSection);

        this._dynamicFieldsContainer.appendChild(section);
    }

    _buildServiceFields() {
        const section = this._createSection('🛠️ Service Details');

        // Price
        const priceGroup = this._createInputGroup('price', 'Price', 'number', '💰');
        const priceInput = priceGroup.querySelector('input');
        priceInput.placeholder = '0.00';
        priceInput.value = this._formData.price || '';
        priceInput.addEventListener('change', (e) => {
            this._formData.price = parseFloat(e.target.value) || 0;
        });
        section.appendChild(priceGroup);

        // Contact Method
        const contactGroup = this._createSelectGroup('contactMethod', 'Contact Method');
        const contactSelect = contactGroup.querySelector('select');
        const contactMethods = [
            { value: 'chat', label: '💬 Chat' },
            { value: 'email', label: '📧 Email' },
            { value: 'phone', label: '📞 Phone' }
        ];
        contactMethods.forEach(m => {
            const option = document.createElement('option');
            option.value = m.value;
            option.textContent = m.label;
            if (m.value === this._formData.contactMethod) {
                option.selected = true;
            }
            contactSelect.appendChild(option);
        });
        contactSelect.addEventListener('change', (e) => {
            this._formData.contactMethod = e.target.value;
        });
        section.appendChild(contactGroup);

        this._dynamicFieldsContainer.appendChild(section);
    }

    // ============================================================
    // PROGRESS BAR
    // ============================================================

    _buildProgressBar() {
        const container = document.createElement('div');
        container.className = 'upload-progress';
        container.id = `upload-progress-${this._id}`;
        container.style.cssText = `
            display: none;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: var(--bg-primary, #fff);
            padding: 16px 20px;
            box-shadow: 0 -4px 12px rgba(0,0,0,0.1);
            z-index: 1000;
            border-top: 1px solid var(--border-color, #e5e7eb);
        `;

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.style.cssText = `
            width: 100%;
            height: 6px;
            border-radius: 3px;
            background: var(--bg-secondary, #e5e7eb);
            overflow: hidden;
            margin-bottom: 8px;
        `;

        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressFill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #6366f1, #8b5cf6);
            border-radius: 3px;
            transition: width 0.3s ease;
            width: 0%;
        `;

        const progressInfo = document.createElement('div');
        progressInfo.className = 'progress-info';
        progressInfo.style.cssText = `
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            color: var(--text-secondary, #6b7280);
        `;

        const progressLabel = document.createElement('span');
        progressLabel.textContent = 'Uploading...';

        const progressPercent = document.createElement('span');
        progressPercent.textContent = '0%';

        progressInfo.appendChild(progressLabel);
        progressInfo.appendChild(progressPercent);

        progressBar.appendChild(progressFill);
        container.appendChild(progressBar);
        container.appendChild(progressInfo);

        document.body.appendChild(container);
        this._progressContainer = container;
        this._progressFill = progressFill;
        this._progressPercent = progressPercent;
    }

    _updateProgress(percent, label = 'Uploading...') {
        if (this._progressFill) {
            this._progressFill.style.width = `${percent}%`;
        }
        if (this._progressPercent) {
            this._progressPercent.textContent = `${Math.round(percent)}%`;
        }
        if (this._progressContainer) {
            this._progressContainer.style.display = 'flex';
            this._progressContainer.style.flexDirection = 'column';
        }
    }

    _hideProgress() {
        if (this._progressContainer) {
            this._progressContainer.style.display = 'none';
        }
    }

    // ============================================================
    // FILE HANDLERS
    // ============================================================

    async _handleFileUpload(files) {
        if (!files || files.length === 0) return;

        const file = files[0];

        // Validate size
        if (file.size > this.config.maxFileSize) {
            ToastNotification.show(`File too large. Max ${this.config.maxFileSize / (1024 * 1024)}MB`, 'error');
            return;
        }

        // Validate type
        if (!this.config.allowedFileTypes.some(type => {
            if (type === 'image/*') return file.type.startsWith('image/');
            return file.type === type;
        })) {
            ToastNotification.show('File type not supported', 'error');
            return;
        }

        this._formData.file = file;
        this._formData.fileSize = file.size;
        this._formData.fileType = file.type;

        if (this._fileInfo) {
            this._fileInfo.textContent = `📎 ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
            this._fileInfo.style.display = 'block';
        }

        // Upload to storage
        try {
            this._isUploading = true;
            this._updateProgress(0, 'Uploading file...');

            const url = await storageService.uploadProductFile(file, {
                onProgress: (progress) => {
                    this._updateProgress(progress, 'Uploading file...');
                }
            });

            this._formData.downloadUrl = url;
            this._updateProgress(100, 'File uploaded!');

            setTimeout(() => {
                this._hideProgress();
            }, 1000);

            ToastNotification.show('File uploaded successfully! 📎', 'success');
            this._isUploading = false;

        } catch (error) {
            logger.error('❌ File upload failed:', error);
            ToastNotification.show('File upload failed: ' + error.message, 'error');
            this._hideProgress();
            this._isUploading = false;
        }
    }

    async _handleImageUpload(files) {
        if (!files || files.length === 0) return;

        const remaining = this.config.maxImages - this._formData.images.length;
        if (files.length > remaining) {
            ToastNotification.show(`Only ${remaining} more images allowed`, 'warning');
            return;
        }

        this._isUploading = true;
        this._updateProgress(0, 'Uploading images...');

        let uploaded = 0;
        const total = files.length;

        for (const file of files) {
            try {
                const url = await storageService.uploadProductImage(file, {
                    onProgress: (progress) => {
                        const overall = ((uploaded + progress / 100) / total) * 100;
                        this._updateProgress(overall, `Uploading image ${uploaded + 1}/${total}`);
                    }
                });

                this._formData.images.push(url);
                uploaded++;

                // Update preview
                const preview = this._createImagePreview(url, this._formData.images.length - 1);
                this._imagePreviewContainer.appendChild(preview);

            } catch (error) {
                logger.error('❌ Image upload failed:', error);
                ToastNotification.show(`Failed to upload image: ${file.name}`, 'error');
            }
        }

        this._updateProgress(100, 'All images uploaded!');
        setTimeout(() => this._hideProgress(), 1000);

        ToastNotification.show(`${uploaded} images uploaded successfully! 📸`, 'success');
        this._isUploading = false;
    }

    async _handleMockupUpload(files) {
        if (!files || files.length === 0) return;

        this._isUploading = true;
        this._updateProgress(0, 'Uploading mockups...');

        for (const file of files) {
            try {
                const url = await storageService.uploadProductImage(file, {
                    onProgress: (progress) => {
                        this._updateProgress(progress, 'Uploading mockups...');
                    },
                    folder: 'mockups'
                });

                this._formData.mockups.push(url);

            } catch (error) {
                logger.error('❌ Mockup upload failed:', error);
                ToastNotification.show(`Failed to upload mockup: ${file.name}`, 'error');
            }
        }

        this._updateProgress(100, 'Mockups uploaded!');
        setTimeout(() => this._hideProgress(), 1000);

        ToastNotification.show('Mockups uploaded successfully! 🖼️', 'success');
        this._isUploading = false;
    }

    // ============================================================
    // IMAGE PREVIEW
    // ============================================================

    _createImagePreview(url, index) {
        const container = document.createElement('div');
        container.className = 'image-preview';
        container.style.cssText = `
            position: relative;
            border-radius: 8px;
            overflow: hidden;
            aspect-ratio: 1;
            border: 1px solid var(--border-color, #e5e7eb);
        `;

        const img = document.createElement('img');
        img.src = url;
        img.alt = `Image ${index + 1}`;
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
        `;

        const removeBtn = document.createElement('button');
        removeBtn.textContent = '✕';
        removeBtn.type = 'button';
        removeBtn.style.cssText = `
            position: absolute;
            top: 4px;
            right: 4px;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: none;
            background: rgba(0,0,0,0.6);
            color: #fff;
            font-size: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        `;
        removeBtn.addEventListener('mouseenter', () => {
            removeBtn.style.background = 'rgba(239,68,68,0.9)';
        });
        removeBtn.addEventListener('mouseleave', () => {
            removeBtn.style.background = 'rgba(0,0,0,0.6)';
        });
        removeBtn.addEventListener('click', () => {
            this._formData.images = this._formData.images.filter((_, i) => i !== index);
            container.remove();
        });

        container.appendChild(img);
        container.appendChild(removeBtn);

        return container;
    }

    // ============================================================
    // SUBMIT HANDLER
    // ============================================================

    async _handleSubmit() {
        if (this._isLoading) return;

        // Validate
        if (!this._validateForm()) return;

        this._isLoading = true;
        this._submitBtn.disabled = true;
        this._spinner.style.display = 'inline-block';
        this._submitBtn.textContent = this._isEditMode ? '⏳ Updating...' : '⏳ Publishing...';

        try {
            const user = getState('auth.user');
            const productData = {
                ...this._formData,
                sellerId: user.uid,
                sellerName: user.displayName || 'User',
                sellerPhoto: user.photoURL || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: true,
                views: 0,
                downloads: 0,
                likes: 0,
                rating: 0,
                ratingCount: 0,
                shareCount: 0
            };

            let result;

            if (this._isEditMode && this._editingProduct) {
                // Update existing product
                result = await databaseService.updateDocument('products', this._editingProduct, productData);
                analyticsService.trackEvent('product_update', { 
                    productId: this._editingProduct,
                    category: productData.category 
                });
                ToastNotification.show('Product updated successfully! ✅', 'success');
            } else {
                // Create new product
                result = await databaseService.addDocument('products', productData);
                analyticsService.trackEvent('product_upload', { 
                    productId: result.id,
                    category: productData.category,
                    type: productData.productType 
                });
                ToastNotification.show('Product published successfully! 🚀', 'success');
            }

            eventBus.emit(this._isEditMode ? EVENTS.PRODUCT_UPDATED : EVENTS.PRODUCT_CREATED, result);

            // Redirect
            setTimeout(() => {
                router.navigate(`/product/${result.id}`);
            }, 1500);

        } catch (error) {
            logger.error('❌ Failed to save product:', error);
            ToastNotification.show(error.message || 'Failed to save product', 'error');
        } finally {
            this._isLoading = false;
            this._submitBtn.disabled = false;
            this._spinner.style.display = 'none';
            this._submitBtn.textContent = this._isEditMode ? '💾 Update Product' : '🚀 Publish Product';
        }
    }

    // ============================================================
    // VALIDATION
    // ============================================================

    _validateForm() {
        const errors = [];

        if (!this._formData.title || this._formData.title.length < 3) {
            errors.push('Title must be at least 3 characters');
        }

        if (!this._formData.description || this._formData.description.length < 10) {
            errors.push('Description must be at least 10 characters');
        }

        if (!this._formData.category) {
            errors.push('Please select a category');
        }

        if (this._formData.productType === 'digital') {
            if (!this._formData.downloadUrl && !this._formData.file) {
                errors.push('Please upload a file or provide a download URL');
            }
        }

        if (this._formData.productType === 'physical') {
            if (!this._formData.price || this._formData.price <= 0) {
                errors.push('Please set a price');
            }
            if (!this._formData.location.address) {
                errors.push('Please provide a location address');
            }
        }

        if (this._formData.productType === 'service') {
            if (!this._formData.price || this._formData.price <= 0) {
                errors.push('Please set a price');
            }
        }

        if (this._formData.images.length === 0) {
            errors.push('Please upload at least one image');
        }

        if (errors.length > 0) {
            ToastNotification.show(errors[0], 'error');
            return false;
        }

        return true;
    }

    // ============================================================
    // LOAD PRODUCT FOR EDIT
    // ============================================================

    async _loadProductForEdit(productId) {
        try {
            const product = await databaseService.getDocument('products', productId);
            if (!product) {
                ToastNotification.show('Product not found', 'error');
                router.navigate('/my-products');
                return;
            }

            // Check ownership
            const user = getState('auth.user');
            if (product.sellerId !== user.uid) {
                ToastNotification.show('You don\'t have permission to edit this product', 'error');
                router.navigate('/my-products');
                return;
            }

            this._formData = {
                title: product.title || '',
                description: product.description || '',
                category: product.category || '',
                subCategory: product.subCategory || '',
                tags: product.tags || [],
                productType: product.productType || 'digital',
                fileSize: product.fileSize || 0,
                fileType: product.fileType || '',
                downloadUrl: product.downloadUrl || '',
                isLargeFile: product.isLargeFile || false,
                driveFileId: product.driveFileId || '',
                price: product.price || 0,
                discount: product.discount || 0,
                currency: product.currency || 'USD',
                location: product.location || { address: '', city: '', state: '', country: '', pincode: '' },
                shipping: product.shipping || { available: false, cost: 0, deliveryTime: '' },
                quantity: product.quantity || 0,
                condition: product.condition || 'new',
                isNegotiable: product.isNegotiable || false,
                isFree: product.isFree || false,
                isPaid: product.isPaid || false,
                contactMethod: product.contactMethod || 'chat',
                images: product.images || [],
                mockups: product.mockups || [],
                videoUrl: product.videoUrl || '',
                file: null,
                thumbnail: product.thumbnail || null,
                isFeatured: product.isFeatured || false,
                isTrending: product.isTrending || false
            };

            // Update UI after render
            if (this._isRendered) {
                this._updateFormUI();
            }

        } catch (error) {
            logger.error('❌ Failed to load product:', error);
            ToastNotification.show('Failed to load product', 'error');
        }
    }

    _updateFormUI() {
        // Update title
        if (this._titleInput) {
            this._titleInput.value = this._formData.title;
        }

        // Update description
        if (this._descInput) {
            this._descInput.value = this._formData.description;
        }

        // Update category
        if (this._catSelect) {
            this._catSelect.value = this._formData.category;
        }

        // Update tags
        if (this._tagsInput) {
            this._tagsInput.value = this._formData.tags.join(', ');
        }

        // Update images
        if (this._imagePreviewContainer) {
            this._imagePreviewContainer.innerHTML = '';
            this._formData.images.forEach((img, index) => {
                const preview = this._createImagePreview(img, index);
                this._imagePreviewContainer.appendChild(preview);
            });
        }

        // Update product type
        this._toggleFields(this._formData.productType);

        // Update header
        const titleEl = this._headerEl?.querySelector('h1');
        if (titleEl) {
            titleEl.textContent = '📝 Edit Product';
        }
    }

    // ============================================================
    // HANDLERS
    // ============================================================

    _handleProductTypeChange(type) {
        this._formData.productType = type;
        this._toggleFields(type);
    }

    _handleCategoryChange(categoryId) {
        // Update sub categories
        const subCategories = this._getSubCategories(categoryId);
        if (this._subCatSelect) {
            this._subCatSelect.innerHTML = '';
            const defaultOpt = document.createElement('option');
            defaultOpt.value = '';
            defaultOpt.textContent = 'Select sub category';
            this._subCatSelect.appendChild(defaultOpt);
            subCategories.forEach(sub => {
                const option = document.createElement('option');
                option.value = sub;
                option.textContent = sub;
                this._subCatSelect.appendChild(option);
            });
        }
    }

    _getSubCategories(categoryId) {
        const subMap = {
            // Digital categories
            'graphics': ['Logos', 'Banners', 'Illustrations', 'Mockups', 'Icons', 'Fonts'],
            'templates': ['Website', 'Presentation', 'Social Media', 'Documents', 'Email', 'Resume'],
            'audio': ['Music', 'Sound Effects', 'Voiceovers', 'Podcast', 'Audiobooks'],
            'video': ['Stock Footage', 'Animation', 'Motion Graphics', 'Tutorials', 'VFX'],
            'software': ['Apps', 'Plugins', 'Scripts', 'WordPress Themes', 'E-commerce'],
            'ebooks': ['PDF', 'EPUB', 'MOBI', 'Audiobooks', 'Courses', 'Tutorials'],
            // Physical categories
            'electronics': ['Phones', 'Laptops', 'Tablets', 'Accessories', 'Audio', 'Cameras'],
            'fashion': ['Clothing', 'Shoes', 'Accessories', 'Bags', 'Jewelry', 'Watches'],
            'home': ['Furniture', 'Decor', 'Kitchen', 'Bedding', 'Lighting', 'Storage'],
            'books': ['Fiction', 'Non-Fiction', 'Comics', 'Textbooks', 'Magazines', 'Collectibles'],
            'toys': ['Action Figures', 'Board Games', 'Puzzles', 'Dolls', 'Educational', 'Outdoor'],
            'sports': ['Equipment', 'Apparel', 'Accessories', 'Fitness', 'Camping', 'Cycling'],
            // Service categories
            'design': ['Graphic Design', 'Web Design', 'UI/UX', 'Logo Design', 'Branding', 'Illustration'],
            'development': ['Web Development', 'App Development', 'Software', 'Game Dev', 'DevOps'],
            'writing': ['Content Writing', 'Copywriting', 'Ghostwriting', 'Editing', 'Translation'],
            'marketing': ['SEO', 'Social Media', 'Email Marketing', 'Advertising', 'Analytics'],
            'consulting': ['Business', 'Career', 'Finance', 'Legal', 'IT', 'Marketing'],
            'video-production': ['Editing', 'Animation', 'Motion Graphics', 'VFX', 'Color Grading']
        };

        // Get category name
        const categories = getState('categories.items') || [];
        const cat = categories.find(c => c.id === categoryId);
        const catName = cat?.name?.toLowerCase() || '';

        // Find matching sub categories
        for (const [key, value] of Object.entries(subMap)) {
            if (catName.includes(key) || key.includes(catName)) {
                return value;
            }
        }

        return [];
    }

    _handleCancel() {
        if (this._isLoading) return;
        const confirmModal = new Modal({
            title: 'Cancel Upload',
            content: 'Are you sure you want to cancel? Your progress will be lost.',
            confirmText: 'Yes, Cancel',
            cancelText: 'Keep Editing',
            onConfirm: () => {
                router.navigate('/home');
            }
        });
        confirmModal.render();
    }

    _handleInputChange(e) {
        const { name, value } = e.target;
        this._formData[name] = value;
    }

    _handleLocationChange(field, value) {
        this._formData.location[field] = value;
    }

    _handlePriceChange(field, value) {
        this._formData[field] = parseFloat(value) || 0;
    }

    _handleTagsInput(e) {
        this._formData.tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
    }

    // ============================================================
    // THEME
    // ============================================================

    _applyTheme() {
        if (!this._container) return;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        this._container.style.color = isDark ? '#f3f4f6' : '#1a1a2e';
        this._container.style.background = isDark ? '#0f0f1a' : '#ffffff';
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
                this._handleAuthChange();
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
            eventBus.on(EVENTS.AUTH_LOGOUT, this._handleAuthChange)
        );
    }

    // ============================================================
    // STATE HANDLERS
    // ============================================================

    _handleThemeChange() {
        this._applyTheme();
    }

    _handleAuthChange() {
        const user = getState('auth.user');
        if (!user) {
            router.navigate('/auth');
        } else if (!user.isSeller) {
            router.navigate('/settings');
        }
    }

    // ============================================================
    // UTILITY METHODS
    // ============================================================

    _generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    _createSection(title) {
        const section = document.createElement('div');
        section.className = 'form-section';
        section.style.cssText = `
            padding: 16px;
            border-radius: 12px;
            background: var(--bg-secondary, #f9fafb);
            border: 1px solid var(--border-color, #e5e7eb);
        `;

        const header = document.createElement('h3');
        header.textContent = title;
        header.style.cssText = `
            margin: 0 0 16px;
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary, #1a1a2e);
        `;

        section.appendChild(header);
        return section;
    }

    _createInputGroup(id, label, type, icon) {
        const group = document.createElement('div');
        group.className = 'form-group';
        group.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 6px;
        `;

        const labelEl = document.createElement('label');
        labelEl.htmlFor = `upload-${id}`;
        labelEl.textContent = `${icon} ${label}`;
        labelEl.style.cssText = `
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary, #1a1a2e);
        `;

        const input = document.createElement('input');
        input.type = type;
        input.id = `upload-${id}`;
        input.name = id;
        input.className = 'form-input';
        input.style.cssText = `
            width: 100%;
            padding: 10px 12px;
            border-radius: 8px;
            border: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-primary, #fff);
            color: var(--text-primary, #1f2937);
            font-size: 14px;
            outline: none;
            box-sizing: border-box;
            transition: all 0.3s ease;
        `;
        input.addEventListener('focus', () => {
            input.style.borderColor = '#6366f1';
            input.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
        });
        input.addEventListener('blur', () => {
            input.style.borderColor = 'var(--border-color, #e5e7eb)';
            input.style.boxShadow = 'none';
        });

        group.appendChild(labelEl);
        group.appendChild(input);

        return group;
    }

    _createSelectGroup(id, label) {
        const group = document.createElement('div');
        group.className = 'form-group';
        group.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 6px;
        `;

        const labelEl = document.createElement('label');
        labelEl.htmlFor = `upload-${id}`;
        labelEl.textContent = label;
        labelEl.style.cssText = `
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary, #1a1a2e);
        `;

        const select = document.createElement('select');
        select.id = `upload-${id}`;
        select.name = id;
        select.className = 'form-select';
        select.style.cssText = `
            width: 100%;
            padding: 10px 12px;
            border-radius: 8px;
            border: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-primary, #fff);
            color: var(--text-primary, #1f2937);
            font-size: 14px;
            outline: none;
            cursor: pointer;
            transition: all 0.3s ease;
        `;

        group.appendChild(labelEl);
        group.appendChild(select);

        return group;
    }

    // ============================================================
    // PUBLIC METHODS
    // ============================================================

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

        // Remove progress bar
        if (this._progressContainer && this._progressContainer.parentNode) {
            this._progressContainer.parentNode.removeChild(this._progressContainer);
        }

        // Remove from DOM
        if (this._container && this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }

        this._container = null;
        this._form = null;

        logger.info('📤 UploadScreen destroyed', { id: this._id });
    }
}

// ============================================================
// EXPORT
// ============================================================

export default UploadScreen;

// ============================================================
// GLOBAL EXPOSURE
// ============================================================

if (typeof window !== 'undefined') {
    window.UploadScreen = UploadScreen;
}

// ============================================================
// END OF FILE: upload-screen.js
// ============================================================