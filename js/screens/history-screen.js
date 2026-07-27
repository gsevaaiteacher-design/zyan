// ============================================================
// FILE: js/screens/history-screen.js
// PURPOSE: Download History - Complete History Management
// DEPENDENCIES: store.js, product-card.js, loading-spinner.js
// ROUTE: /history
// VERSION: 4.0.0 - FULL PRODUCTION
// ============================================================

import { store, getState, setState, subscribe } from '../store.js';
import { eventBus, EVENTS } from '../state/event-bus.js';
import { router, ROUTES } from '../router.js';
import { logger } from '../services/logger.js';
import { analyticsService } from '../services/analytics-service.js';
import { databaseService } from '../services/database-service.js';
import { ToastNotification } from '../widgets/toast-notification.js';
import { Modal } from '../widgets/modal.js';
import { LoadingSpinner } from '../widgets/loading-spinner.js';

// ============================================================
// HISTORY SCREEN CLASS
// ============================================================

export class HistoryScreen {
    constructor(options = {}) {
        // ==========================================
        // CONFIGURATION
        // ==========================================
        this.config = {
            itemsPerPage: 20,
            enableDelete: true,
            enableFilter: true,
            enableDateRange: true,
            enableSearch: true,
            enableExport: true,
            ...options
        };

        // ==========================================
        // STATE
        // ==========================================
        this._id = this._generateId('history');
        this._isDestroyed = false;
        this._isRendered = false;
        this._container = null;
        this._subscribers = [];
        this._eventListeners = [];
        this._isLoading = false;
        this._hasMore = true;
        this._page = 1;
        this._historyItems = [];
        this._filteredItems = [];
        this._selectedItems = new Set();

        // Filters
        this._filters = {
            status: 'all', // 'all' | 'completed' | 'pending' | 'failed'
            dateRange: 'all', // 'all' | 'today' | 'week' | 'month' | 'year'
            searchQuery: '',
            productType: 'all',
            sortBy: 'newest' // 'newest' | 'oldest' | 'a-z' | 'z-a'
        };

        // ==========================================
        // BIND METHODS
        // ==========================================
        this._handleItemClick = this._handleItemClick.bind(this);
        this._handleDelete = this._handleDelete.bind(this);
        this._handleDeleteAll = this._handleDeleteAll.bind(this);
        this._handleFilterChange = this._handleFilterChange.bind(this);
        this._handleSearch = this._handleSearch.bind(this);
        this._handleSortChange = this._handleSortChange.bind(this);
        this._handleExport = this._handleExport.bind(this);
        this._handleSelectItem = this._handleSelectItem.bind(this);
        this._handleSelectAll = this._handleSelectAll.bind(this);
        this._handleThemeChange = this._handleThemeChange.bind(this);
        this._handleAuthChange = this._handleAuthChange.bind(this);
        this._handleHistoryUpdate = this._handleHistoryUpdate.bind(this);
        this._handleLoadMore = this._handleLoadMore.bind(this);

        // ==========================================
        // SETUP
        // ==========================================
        this._setupSubscriptions();
        this._setupEventListeners();

        logger.info('📜 HistoryScreen initialized', { id: this._id });
    }

    // ============================================================
    // RENDER
    // ============================================================

    render() {
        if (this._isDestroyed) {
            logger.warn('⚠️ HistoryScreen destroyed, cannot render');
            return null;
        }

        if (this._isRendered) {
            return this._container;
        }

        logger.info('📜 Rendering HistoryScreen...');

        // Check authentication
        const user = getState('auth.user');
        if (!user) {
            ToastNotification.show('Please login to view history', 'warning');
            router.navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
            return null;
        }

        // Load history
        this._loadHistory();

        // Create container
        this._container = this._createContainer();

        // Build sections
        this._buildHeader();
        this._buildStats();
        this._buildToolbar();
        this._buildFilters();
        this._buildHistoryList();

        // Apply theme
        this._applyTheme();

        // Track view
        analyticsService.trackPageView('history');

        this._isRendered = true;
        logger.info('✅ HistoryScreen rendered');

        return this._container;
    }

    // ============================================================
    // CONTAINER
    // ============================================================

    _createContainer() {
        const container = document.createElement('div');
        container.className = 'history-screen';
        container.id = `history-screen-${this._id}`;
        container.style.cssText = `
            max-width: 1100px;
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
    // LOAD HISTORY
    // ============================================================

    async _loadHistory() {
        try {
            this._isLoading = true;
            this._showLoader();

            const user = getState('auth.user');
            if (!user) {
                throw new Error('User not authenticated');
            }

            const history = await databaseService.getCollection('history', [
                { field: 'userId', operator: '==', value: user.uid }
            ], {
                orderBy: 'downloadedAt',
                orderDirection: 'desc',
                limit: this.config.itemsPerPage
            });

            this._historyItems = history;
            this._applyFilters();
            this._isLoading = false;

            if (this._isRendered) {
                this._renderHistoryList();
            }

        } catch (error) {
            logger.error('❌ Failed to load history:', error);
            this._showError(error.message || 'Failed to load history');
            this._isLoading = false;
        }
    }

    _applyFilters() {
        let items = [...this._historyItems];

        // Search filter
        if (this._filters.searchQuery) {
            const query = this._filters.searchQuery.toLowerCase();
            items = items.filter(item =>
                item.productTitle?.toLowerCase().includes(query) ||
                item.productId?.toLowerCase().includes(query)
            );
        }

        // Status filter
        if (this._filters.status !== 'all') {
            items = items.filter(item => item.status === this._filters.status);
        }

        // Date range filter
        if (this._filters.dateRange !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            items = items.filter(item => {
                const date = new Date(item.downloadedAt);
                switch (this._filters.dateRange) {
                    case 'today':
                        return date >= today;
                    case 'week':
                        return date >= new Date(today - 7 * 24 * 60 * 60 * 1000);
                    case 'month':
                        return date >= new Date(today - 30 * 24 * 60 * 60 * 1000);
                    case 'year':
                        return date >= new Date(today - 365 * 24 * 60 * 60 * 1000);
                    default:
                        return true;
                }
            });
        }

        // Product type filter
        if (this._filters.productType !== 'all') {
            items = items.filter(item => item.productType === this._filters.productType);
        }

        // Sort
        switch (this._filters.sortBy) {
            case 'newest':
                items.sort((a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt));
                break;
            case 'oldest':
                items.sort((a, b) => new Date(a.downloadedAt) - new Date(b.downloadedAt));
                break;
            case 'a-z':
                items.sort((a, b) => (a.productTitle || '').localeCompare(b.productTitle || ''));
                break;
            case 'z-a':
                items.sort((a, b) => (b.productTitle || '').localeCompare(a.productTitle || ''));
                break;
            default:
                break;
        }

        this._filteredItems = items;
        this._hasMore = this._filteredItems.length < this._historyItems.length;
        this._page = 1;

        // Update stats
        if (this._isRendered) {
            this._updateStats();
            this._updateItemCount();
        }
    }

    // ============================================================
    // HEADER
    // ============================================================

    _buildHeader() {
        const header = document.createElement('header');
        header.className = 'history-header';
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0 16px;
            flex-wrap: wrap;
            gap: 12px;
            border-bottom: 1px solid var(--border-color, rgba(0,0,0,0.06));
            margin-bottom: 16px;
        `;

        // Left: Title
        const left = document.createElement('div');

        const title = document.createElement('h1');
        title.textContent = '📜 Download History';
        title.style.cssText = `
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            color: var(--text-primary, #1a1a2e);
        `;

        const subtitle = document.createElement('p');
        subtitle.textContent = 'Track all your downloads and activity';
        subtitle.style.cssText = `
            margin: 2px 0 0;
            font-size: 14px;
            color: var(--text-secondary, #6b7280);
        `;

        left.appendChild(title);
        left.appendChild(subtitle);
        header.appendChild(left);

        // Right: Actions
        const actions = document.createElement('div');
        actions.style.cssText = `
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
        `;

        // Export button
        if (this.config.enableExport) {
            const exportBtn = document.createElement('button');
            exportBtn.textContent = '📤 Export';
            exportBtn.style.cssText = `
                padding: 8px 16px;
                border-radius: 8px;
                border: 1px solid var(--border-color, #e5e7eb);
                background: transparent;
                color: var(--text-secondary, #6b7280);
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            exportBtn.addEventListener('mouseenter', () => {
                exportBtn.style.background = 'rgba(0,0,0,0.05)';
                exportBtn.style.borderColor = '#6366f1';
            });
            exportBtn.addEventListener('mouseleave', () => {
                exportBtn.style.background = 'transparent';
                exportBtn.style.borderColor = 'var(--border-color, #e5e7eb)';
            });
            exportBtn.addEventListener('click', this._handleExport);
            actions.appendChild(exportBtn);
        }

        // Delete all button
        if (this.config.enableDelete) {
            const deleteAllBtn = document.createElement('button');
            deleteAllBtn.textContent = '🗑️ Clear All';
            deleteAllBtn.style.cssText = `
                padding: 8px 16px;
                border-radius: 8px;
                border: 1px solid #ef4444;
                background: transparent;
                color: #ef4444;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            deleteAllBtn.addEventListener('mouseenter', () => {
                deleteAllBtn.style.background = '#ef4444';
                deleteAllBtn.style.color = '#ffffff';
            });
            deleteAllBtn.addEventListener('mouseleave', () => {
                deleteAllBtn.style.background = 'transparent';
                deleteAllBtn.style.color = '#ef4444';
            });
            deleteAllBtn.addEventListener('click', this._handleDeleteAll);
            actions.appendChild(deleteAllBtn);
        }

        header.appendChild(actions);

        this._container.appendChild(header);
        this._headerEl = header;
    }

    // ============================================================
    // STATS
    // ============================================================

    _buildStats() {
        const statsContainer = document.createElement('div');
        statsContainer.className = 'history-stats';
        statsContainer.id = `history-stats-${this._id}`;
        statsContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 12px;
            padding: 16px;
            background: var(--bg-secondary, #f9fafb);
            border-radius: 12px;
            margin-bottom: 20px;
            border: 1px solid var(--border-color, #e5e7eb);
        `;

        const stats = [
            { label: 'Total Downloads', value: this._historyItems.length, icon: '📥' },
            { label: 'Completed', value: this._historyItems.filter(i => i.isCompleted).length, icon: '✅' },
            { label: 'Failed', value: this._historyItems.filter(i => !i.isCompleted).length, icon: '❌' },
            { label: 'File Size', value: this._getTotalSize(), icon: '📊' }
        ];

        stats.forEach(stat => {
            const div = document.createElement('div');
            div.className = 'history-stat';
            div.style.cssText = `
                text-align: center;
            `;

            const icon = document.createElement('div');
            icon.textContent = stat.icon;
            icon.style.fontSize = '24px';

            const value = document.createElement('div');
            value.textContent = typeof stat.value === 'number' ? stat.value : stat.value;
            value.style.cssText = `
                font-size: 20px;
                font-weight: 700;
                color: var(--text-primary, #1a1a2e);
                margin-top: 2px;
            `;

            const label = document.createElement('div');
            label.textContent = stat.label;
            label.style.cssText = `
                font-size: 12px;
                color: var(--text-secondary, #6b7280);
            `;

            div.appendChild(icon);
            div.appendChild(value);
            div.appendChild(label);
            statsContainer.appendChild(div);
        });

        this._container.appendChild(statsContainer);
        this._statsContainer = statsContainer;
    }

    // ============================================================
    // TOOLBAR
    // ============================================================

    _buildToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'history-toolbar';
        toolbar.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 16px;
        `;

        // Left: Item count & selection
        const left = document.createElement('div');
        left.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
        `;

        // Select all
        const selectAll = document.createElement('input');
        selectAll.type = 'checkbox';
        selectAll.className = 'history-select-all';
        selectAll.style.cssText = `
            width: 18px;
            height: 18px;
            accent-color: #6366f1;
            cursor: pointer;
        `;
        selectAll.addEventListener('change', this._handleSelectAll);

        const countLabel = document.createElement('span');
        countLabel.className = 'history-count';
        countLabel.textContent = `${this._filteredItems.length} items`;
        countLabel.style.cssText = `
            font-size: 14px;
            color: var(--text-secondary, #6b7280);
        `;

        left.appendChild(selectAll);
        left.appendChild(countLabel);
        toolbar.appendChild(left);

        // Right: Sort
        const right = document.createElement('div');
        right.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
        `;

        const sortLabel = document.createElement('span');
        sortLabel.textContent = 'Sort:';
        sortLabel.style.cssText = `
            font-size: 13px;
            color: var(--text-secondary, #6b7280);
        `;

        const sortSelect = document.createElement('select');
        sortSelect.className = 'history-sort';
        sortSelect.style.cssText = `
            padding: 6px 12px;
            border-radius: 6px;
            border: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-primary, #fff);
            color: var(--text-primary, #1f2937);
            font-size: 13px;
            outline: none;
            cursor: pointer;
        `;

        const sortOptions = [
            { value: 'newest', label: 'Newest First' },
            { value: 'oldest', label: 'Oldest First' },
            { value: 'a-z', label: 'A-Z' },
            { value: 'z-a', label: 'Z-A' }
        ];

        sortOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value === this._filters.sortBy) {
                option.selected = true;
            }
            sortSelect.appendChild(option);
        });

        sortSelect.addEventListener('change', (e) => {
            this._filters.sortBy = e.target.value;
            this._handleSortChange(e.target.value);
        });

        right.appendChild(sortLabel);
        right.appendChild(sortSelect);
        toolbar.appendChild(right);

        this._container.appendChild(toolbar);
        this._toolbar = toolbar;
        this._selectAll = selectAll;
        this._countLabel = countLabel;
    }

    // ============================================================
    // FILTERS
    // ============================================================

    _buildFilters() {
        if (!this.config.enableFilter) return;

        const filtersContainer = document.createElement('div');
        filtersContainer.className = 'history-filters';
        filtersContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 12px;
            padding: 16px;
            background: var(--bg-secondary, #f9fafb);
            border-radius: 10px;
            margin-bottom: 20px;
            border: 1px solid var(--border-color, #e5e7eb);
        `;

        // Search
        const searchGroup = document.createElement('div');
        searchGroup.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 4px;
        `;

        const searchLabel = document.createElement('label');
        searchLabel.textContent = '🔍 Search';
        searchLabel.style.cssText = `
            font-size: 13px;
            font-weight: 500;
            color: var(--text-primary, #1a1a2e);
        `;

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search history...';
        searchInput.value = this._filters.searchQuery;
        searchInput.style.cssText = `
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-primary, #fff);
            color: var(--text-primary, #1f2937);
            font-size: 13px;
            outline: none;
            width: 100%;
            box-sizing: border-box;
        `;
        searchInput.addEventListener('focus', () => {
            searchInput.style.borderColor = '#6366f1';
            searchInput.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
        });
        searchInput.addEventListener('blur', () => {
            searchInput.style.borderColor = 'var(--border-color, #e5e7eb)';
            searchInput.style.boxShadow = 'none';
        });
        searchInput.addEventListener('input', (e) => {
            this._filters.searchQuery = e.target.value;
            this._handleSearch(e.target.value);
        });

        searchGroup.appendChild(searchLabel);
        searchGroup.appendChild(searchInput);
        filtersContainer.appendChild(searchGroup);

        // Status filter
        const statusGroup = document.createElement('div');
        statusGroup.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 4px;
        `;

        const statusLabel = document.createElement('label');
        statusLabel.textContent = '📌 Status';
        statusLabel.style.cssText = `
            font-size: 13px;
            font-weight: 500;
            color: var(--text-primary, #1a1a2e);
        `;

        const statusSelect = document.createElement('select');
        statusSelect.className = 'history-filter-select';
        statusSelect.style.cssText = `
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-primary, #fff);
            color: var(--text-primary, #1f2937);
            font-size: 13px;
            outline: none;
            cursor: pointer;
            width: 100%;
        `;

        const statusOptions = [
            { value: 'all', label: 'All Status' },
            { value: 'completed', label: '✅ Completed' },
            { value: 'pending', label: '⏳ Pending' },
            { value: 'failed', label: '❌ Failed' }
        ];

        statusOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value === this._filters.status) {
                option.selected = true;
            }
            statusSelect.appendChild(option);
        });

        statusSelect.addEventListener('change', (e) => {
            this._filters.status = e.target.value;
            this._handleFilterChange('status', e.target.value);
        });

        statusGroup.appendChild(statusLabel);
        statusGroup.appendChild(statusSelect);
        filtersContainer.appendChild(statusGroup);

        // Date range filter
        const dateGroup = document.createElement('div');
        dateGroup.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 4px;
        `;

        const dateLabel = document.createElement('label');
        dateLabel.textContent = '📅 Date Range';
        dateLabel.style.cssText = `
            font-size: 13px;
            font-weight: 500;
            color: var(--text-primary, #1a1a2e);
        `;

        const dateSelect = document.createElement('select');
        dateSelect.className = 'history-filter-select';
        dateSelect.style.cssText = `
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-primary, #fff);
            color: var(--text-primary, #1f2937);
            font-size: 13px;
            outline: none;
            cursor: pointer;
            width: 100%;
        `;

        const dateOptions = [
            { value: 'all', label: 'All Time' },
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
            { value: 'year', label: 'This Year' }
        ];

        dateOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value === this._filters.dateRange) {
                option.selected = true;
            }
            dateSelect.appendChild(option);
        });

        dateSelect.addEventListener('change', (e) => {
            this._filters.dateRange = e.target.value;
            this._handleFilterChange('dateRange', e.target.value);
        });

        dateGroup.appendChild(dateLabel);
        dateGroup.appendChild(dateSelect);
        filtersContainer.appendChild(dateGroup);

        // Product type filter
        const typeGroup = document.createElement('div');
        typeGroup.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 4px;
        `;

        const typeLabel = document.createElement('label');
        typeLabel.textContent = '📦 Type';
        typeLabel.style.cssText = `
            font-size: 13px;
            font-weight: 500;
            color: var(--text-primary, #1a1a2e);
        `;

        const typeSelect = document.createElement('select');
        typeSelect.className = 'history-filter-select';
        typeSelect.style.cssText = `
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-primary, #fff);
            color: var(--text-primary, #1f2937);
            font-size: 13px;
            outline: none;
            cursor: pointer;
            width: 100%;
        `;

        const typeOptions = [
            { value: 'all', label: 'All Types' },
            { value: 'digital', label: '📱 Digital' },
            { value: 'physical', label: '📦 Physical' },
            { value: 'service', label: '🛠️ Service' }
        ];

        typeOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value === this._filters.productType) {
                option.selected = true;
            }
            typeSelect.appendChild(option);
        });

        typeSelect.addEventListener('change', (e) => {
            this._filters.productType = e.target.value;
            this._handleFilterChange('productType', e.target.value);
        });

        typeGroup.appendChild(typeLabel);
        typeGroup.appendChild(typeSelect);
        filtersContainer.appendChild(typeGroup);

        this._container.appendChild(filtersContainer);
        this._filtersContainer = filtersContainer;
    }

    // ============================================================
    // HISTORY LIST
    // ============================================================

    _buildHistoryList() {
        const container = document.createElement('div');
        container.className = 'history-list-container';
        container.id = `history-list-${this._id}`;
        container.style.cssText = `
            min-height: 200px;
            position: relative;
        `;

        const list = document.createElement('div');
        list.className = 'history-list';
        list.id = `history-list-items-${this._id}`;
        list.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 12px;
        `;

        container.appendChild(list);

        this._container.appendChild(container);
        this._listContainer = container;
        this._listEl = list;

        // Load items
        this._renderHistoryList();
    }

    _renderHistoryList() {
        if (!this._listEl) return;

        this._listEl.innerHTML = '';

        if (this._filteredItems.length === 0) {
            this._showEmptyState();
            return;
        }

        const items = this._filteredItems.slice(0, this._page * this.config.itemsPerPage);

        items.forEach(item => {
            const itemEl = this._createHistoryItem(item);
            this._listEl.appendChild(itemEl);
        });

        // Check if more items to load
        if (items.length < this._filteredItems.length) {
            this._addLoadMoreButton();
        }

        // Update select all state
        this._updateSelectAllState();

        // Update item count
        this._updateItemCount();
    }

    _createHistoryItem(item) {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.dataset.id = item.id;
        div.style.cssText = `
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 14px 16px;
            border-radius: 10px;
            background: var(--bg-primary, #fff);
            border: 1px solid var(--border-color, #e5e7eb);
            transition: all 0.3s ease;
            cursor: pointer;
        `;

        div.addEventListener('mouseenter', () => {
            div.style.transform = 'translateX(4px)';
            div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            div.style.borderColor = '#6366f1';
        });
        div.addEventListener('mouseleave', () => {
            div.style.transform = 'translateX(0)';
            div.style.boxShadow = 'none';
            div.style.borderColor = 'var(--border-color, #e5e7eb)';
        });

        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'history-item-checkbox';
        checkbox.checked = this._selectedItems.has(item.id);
        checkbox.style.cssText = `
            width: 18px;
            height: 18px;
            accent-color: #6366f1;
            cursor: pointer;
            flex-shrink: 0;
        `;
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            this._handleSelectItem(item.id, e.target.checked);
        });
        div.appendChild(checkbox);

        // Thumbnail
        const thumb = document.createElement('img');
        thumb.src = item.productThumbnail || 'https://placehold.co/60x60/6366f1/ffffff?text=📦';
        thumb.alt = item.productTitle || 'Product';
        thumb.style.cssText = `
            width: 50px;
            height: 50px;
            border-radius: 8px;
            object-fit: cover;
            flex-shrink: 0;
            background: var(--bg-secondary, #f3f4f6);
        `;
        div.appendChild(thumb);

        // Info
        const info = document.createElement('div');
        info.style.cssText = `
            flex: 1;
            min-width: 0;
        `;

        const title = document.createElement('div');
        title.textContent = item.productTitle || 'Unknown Product';
        title.style.cssText = `
            font-size: 15px;
            font-weight: 600;
            color: var(--text-primary, #1a1a2e);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `;

        const meta = document.createElement('div');
        meta.style.cssText = `
            display: flex;
            gap: 12px;
            font-size: 12px;
            color: var(--text-secondary, #6b7280);
            flex-wrap: wrap;
            margin-top: 2px;
        `;

        const date = document.createElement('span');
        date.textContent = `📅 ${this._formatDate(item.downloadedAt)}`;

        const size = document.createElement('span');
        size.textContent = `📊 ${this._formatFileSize(item.fileSize || 0)}`;

        const status = document.createElement('span');
        status.textContent = item.isCompleted ? '✅ Completed' : '❌ Failed';
        status.style.cssText = `
            color: ${item.isCompleted ? '#22c55e' : '#ef4444'};
        `;

        meta.appendChild(date);
        meta.appendChild(size);
        meta.appendChild(status);

        info.appendChild(title);
        info.appendChild(meta);
        div.appendChild(info);

        // Actions
        const actions = document.createElement('div');
        actions.style.cssText = `
            display: flex;
            gap: 4px;
            flex-shrink: 0;
        `;

        // View product button
        const viewBtn = document.createElement('button');
        viewBtn.textContent = '👁️';
        viewBtn.setAttribute('aria-label', 'View product');
        viewBtn.style.cssText = `
            width: 32px;
            height: 32px;
            border-radius: 6px;
            border: none;
            background: transparent;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.2s;
        `;
        viewBtn.addEventListener('mouseenter', () => {
            viewBtn.style.background = 'rgba(0,0,0,0.05)';
        });
        viewBtn.addEventListener('mouseleave', () => {
            viewBtn.style.background = 'transparent';
        });
        viewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._handleItemClick(item.productId);
        });
        actions.appendChild(viewBtn);

        // Download again button
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = '📥';
        downloadBtn.setAttribute('aria-label', 'Download again');
        downloadBtn.style.cssText = `
            width: 32px;
            height: 32px;
            border-radius: 6px;
            border: none;
            background: transparent;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.2s;
        `;
        downloadBtn.addEventListener('mouseenter', () => {
            downloadBtn.style.background = 'rgba(0,0,0,0.05)';
        });
        downloadBtn.addEventListener('mouseleave', () => {
            downloadBtn.style.background = 'transparent';
        });
        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._handleDownloadAgain(item.productId);
        });
        actions.appendChild(downloadBtn);

        // Delete button
        if (this.config.enableDelete) {
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.setAttribute('aria-label', 'Delete');
            deleteBtn.style.cssText = `
                width: 32px;
                height: 32px;
                border-radius: 6px;
                border: none;
                background: transparent;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.2s;
                color: var(--text-secondary, #6b7280);
            `;
            deleteBtn.addEventListener('mouseenter', () => {
                deleteBtn.style.background = 'rgba(239,68,68,0.1)';
                deleteBtn.style.color = '#ef4444';
            });
            deleteBtn.addEventListener('mouseleave', () => {
                deleteBtn.style.background = 'transparent';
                deleteBtn.style.color = 'var(--text-secondary, #6b7280)';
            });
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._handleDelete(item.id);
            });
            actions.appendChild(deleteBtn);
        }

        div.appendChild(actions);

        // Click to view product
        div.addEventListener('click', () => {
            this._handleItemClick(item.productId);
        });

        return div;
    }

    _addLoadMoreButton() {
        const btn = document.createElement('button');
        btn.className = 'history-load-more';
        btn.textContent = 'Load More...';
        btn.style.cssText = `
            padding: 12px;
            border: 1px dashed var(--border-color, #e5e7eb);
            border-radius: 8px;
            background: transparent;
            color: var(--text-secondary, #6b7280);
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
            text-align: center;
        `;
        btn.addEventListener('mouseenter', () => {
            btn.style.borderColor = '#6366f1';
            btn.style.color = '#6366f1';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.borderColor = 'var(--border-color, #e5e7eb)';
            btn.style.color = 'var(--text-secondary, #6b7280)';
        });
        btn.addEventListener('click', this._handleLoadMore);

        this._listEl.appendChild(btn);
        this._loadMoreBtn = btn;
    }

    _showEmptyState() {
        const empty = document.createElement('div');
        empty.className = 'history-empty';
        empty.style.cssText = `
            text-align: center;
            padding: 80px 20px;
            color: var(--text-secondary, #6b7280);
        `;
        empty.innerHTML = `
            <div style="font-size:64px;margin-bottom:16px;">📜</div>
            <h3 style="margin:0;color:var(--text-primary,#1a1a2e);">No History Found</h3>
            <p style="margin:8px 0 0;">Start downloading products to see your history</p>
            <button onclick="window.Router?.navigate('/explore')" style="margin-top:16px;padding:10px 24px;border:none;border-radius:8px;background:#6366f1;color:#fff;font-size:14px;font-weight:500;cursor:pointer;">
                Explore Products
            </button>
        `;
        this._listEl.appendChild(empty);
    }

    // ============================================================
    // HANDLERS
    // ============================================================

    _handleItemClick(productId) {
        if (productId) {
            router.navigate(`/product/${productId}`);
        }
    }

    async _handleDelete(itemId) {
        const modal = new Modal({
            title: 'Delete History Item',
            content: 'Are you sure you want to remove this item from history?',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: async () => {
                try {
                    await databaseService.deleteDocument('history', itemId);
                    this._historyItems = this._historyItems.filter(item => item.id !== itemId);
                    this._selectedItems.delete(itemId);
                    this._applyFilters();
                    this._renderHistoryList();
                    this._updateStats();
                    ToastNotification.show('History item deleted', 'success');
                    analyticsService.trackEvent('history_delete', { itemId });
                } catch (error) {
                    logger.error('❌ Failed to delete history:', error);
                    ToastNotification.show('Failed to delete history item', 'error');
                }
            }
        });
        modal.render();
    }

    async _handleDeleteAll() {
        if (this._filteredItems.length === 0) {
            ToastNotification.show('No items to delete', 'info');
            return;
        }

        const modal = new Modal({
            title: 'Clear All History',
            content: `Are you sure you want to delete all ${this._filteredItems.length} items from history?`,
            confirmText: 'Delete All',
            cancelText: 'Cancel',
            onConfirm: async () => {
                try {
                    const ids = this._filteredItems.map(item => item.id);
                    for (const id of ids) {
                        await databaseService.deleteDocument('history', id);
                    }
                    this._historyItems = this._historyItems.filter(item => !ids.includes(item.id));
                    this._selectedItems.clear();
                    this._applyFilters();
                    this._renderHistoryList();
                    this._updateStats();
                    ToastNotification.show('All history items deleted', 'success');
                    analyticsService.trackEvent('history_delete_all', { count: ids.length });
                } catch (error) {
                    logger.error('❌ Failed to delete all history:', error);
                    ToastNotification.show('Failed to delete all history items', 'error');
                }
            }
        });
        modal.render();
    }

    _handleFilterChange(key, value) {
        this._filters[key] = value;
        this._applyFilters();
        this._renderHistoryList();
        analyticsService.trackEvent('history_filter', { key, value });
    }

    _handleSearch(query) {
        this._filters.searchQuery = query;
        this._applyFilters();
        this._renderHistoryList();
        analyticsService.trackEvent('history_search', { query });
    }

    _handleSortChange(sortBy) {
        this._filters.sortBy = sortBy;
        this._applyFilters();
        this._renderHistoryList();
        analyticsService.trackEvent('history_sort', { sortBy });
    }

    async _handleExport() {
        if (this._filteredItems.length === 0) {
            ToastNotification.show('No items to export', 'info');
            return;
        }

        try {
            const data = this._filteredItems.map(item => ({
                Product: item.productTitle || 'Unknown',
                'Downloaded At': this._formatDate(item.downloadedAt),
                'File Size': this._formatFileSize(item.fileSize || 0),
                Status: item.isCompleted ? 'Completed' : 'Failed'
            }));

            const headers = Object.keys(data[0]);
            const csvContent = [
                headers.join(','),
                ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `zymore_history_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();

            ToastNotification.show('Export successful! 📤', 'success');
            analyticsService.trackEvent('history_export', { count: data.length });

        } catch (error) {
            logger.error('❌ Export failed:', error);
            ToastNotification.show('Failed to export history', 'error');
        }
    }

    _handleSelectItem(itemId, checked) {
        if (checked) {
            this._selectedItems.add(itemId);
        } else {
            this._selectedItems.delete(itemId);
        }
        this._updateSelectAllState();
        analyticsService.trackEvent('history_select_item', { checked });
    }

    _handleSelectAll(e) {
        const checked = e.target.checked;
        const items = this._filteredItems.slice(0, this._page * this.config.itemsPerPage);
        if (checked) {
            items.forEach(item => this._selectedItems.add(item.id));
        } else {
            items.forEach(item => this._selectedItems.delete(item.id));
        }
        // Update checkboxes
        const checkboxes = this._listEl?.querySelectorAll('.history-item-checkbox');
        checkboxes?.forEach(cb => {
            cb.checked = checked;
        });
        analyticsService.trackEvent('history_select_all', { checked });
    }

    _updateSelectAllState() {
        if (!this._selectAll) return;

        const items = this._filteredItems.slice(0, this._page * this.config.itemsPerPage);
        const checkedItems = items.filter(item => this._selectedItems.has(item.id));

        if (items.length === 0) {
            this._selectAll.checked = false;
            this._selectAll.indeterminate = false;
        } else if (checkedItems.length === items.length) {
            this._selectAll.checked = true;
            this._selectAll.indeterminate = false;
        } else if (checkedItems.length > 0) {
            this._selectAll.checked = false;
            this._selectAll.indeterminate = true;
        } else {
            this._selectAll.checked = false;
            this._selectAll.indeterminate = false;
        }
    }

    _handleLoadMore() {
        this._page++;
        this._renderHistoryList();
        analyticsService.trackEvent('history_load_more', { page: this._page });
    }

    async _handleDownloadAgain(productId) {
        if (!productId) {
            ToastNotification.show('Product not found', 'error');
            return;
        }

        try {
            ToastNotification.show('Starting download... 📥', 'info');
            router.navigate(`/product/${productId}`);
            analyticsService.trackEvent('history_download_again', { productId });
        } catch (error) {
            logger.error('❌ Download again failed:', error);
            ToastNotification.show('Failed to start download', 'error');
        }
    }

    // ============================================================
    // UI HELPERS
    // ============================================================

    _updateStats() {
        const stats = this._statsContainer?.querySelectorAll('.history-stat .history-stat-value');
        if (!stats) return;

        if (stats.length >= 4) {
            stats[0].textContent = this._historyItems.length;
            stats[1].textContent = this._historyItems.filter(i => i.isCompleted).length;
            stats[2].textContent = this._historyItems.filter(i => !i.isCompleted).length;
            stats[3].textContent = this._getTotalSize();
        }
    }

    _updateItemCount() {
        if (this._countLabel) {
            const displayCount = Math.min(this._page * this.config.itemsPerPage, this._filteredItems.length);
            this._countLabel.textContent = `${displayCount} of ${this._filteredItems.length} items`;
        }
    }

    _getTotalSize() {
        const total = this._historyItems.reduce((sum, item) => sum + (item.fileSize || 0), 0);
        return this._formatFileSize(total);
    }

    _formatDate(date) {
        if (!date) return 'N/A';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    _formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    _showLoader() {
        // Show loading skeleton
        if (this._listEl) {
            this._listEl.innerHTML = `
                <div style="display:flex;flex-direction:column;gap:12px;">
                    ${Array(5).fill(0).map(() => `
                        <div style="display:flex;gap:16px;padding:14px 16px;border-radius:10px;background:var(--bg-secondary,#f3f4f6);">
                            <div style="width:50px;height:50px;border-radius:8px;background:linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;"></div>
                            <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
                                <div style="width:60%;height:16px;border-radius:4px;background:linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;"></div>
                                <div style="width:40%;height:12px;border-radius:4px;background:linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <style>
                    @keyframes shimmer {
                        0% { background-position: 200% 0; }
                        100% { background-position: -200% 0; }
                    }
                </style>
            `;
        }
    }

    _showError(message) {
        if (this._listEl) {
            this._listEl.innerHTML = `
                <div style="text-align:center;padding:60px 20px;color:var(--text-secondary,#6b7280);">
                    <div style="font-size:48px;margin-bottom:16px;">😕</div>
                    <h3 style="margin:0;color:var(--text-primary,#1a1a2e);">${message}</h3>
                    <button onclick="window.location.reload()" style="margin-top:16px;padding:10px 24px;border:none;border-radius:8px;background:#6366f1;color:#fff;font-size:14px;font-weight:500;cursor:pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
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

        this._subscribers.push(
            subscribe((state) => {
                this._handleHistoryUpdate();
            }, ['history.items'])
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
        this._eventListeners.push(
            eventBus.on(EVENTS.HISTORY_UPDATED, this._handleHistoryUpdate)
        );
        this._eventListeners.push(
            eventBus.on(EVENTS.PRODUCT_DOWNLOADED, this._handleHistoryUpdate)
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
        } else {
            this._loadHistory();
        }
    }

    _handleHistoryUpdate() {
        this._loadHistory();
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

    refresh() {
        this._loadHistory();
        return this;
    }

    setFilter(key, value) {
        if (this._filters.hasOwnProperty(key)) {
            this._filters[key] = value;
            this._applyFilters();
            this._renderHistoryList();
        }
        return this;
    }

    setSearch(query) {
        this._filters.searchQuery = query;
        this._applyFilters();
        this._renderHistoryList();
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
        this._listEl = null;
        this._historyItems = [];
        this._filteredItems = [];

        logger.info('📜 HistoryScreen destroyed', { id: this._id });
    }
}

// ============================================================
// EXPORT
// ============================================================

export default HistoryScreen;

// ============================================================
// GLOBAL EXPOSURE
// ============================================================

if (typeof window !== 'undefined') {
    window.HistoryScreen = HistoryScreen;
}

// ============================================================
// END OF FILE: history-screen.js
// ============================================================