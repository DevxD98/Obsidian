// Browser Tab Manager
class TabManager {
    constructor() {
        this.tabs = [];
        this.activeTabId = null;
        this.tabIdCounter = 0;
        this.bookmarks = this.loadBookmarks();
        this.history = this.loadHistory();
        this.init();
    }

    loadBookmarks() {
        const saved = localStorage.getItem('bookmarks');
        return saved ? JSON.parse(saved) : [];
    }

    saveBookmarks() {
        localStorage.setItem('bookmarks', JSON.stringify(this.bookmarks));
        this.renderBookmarks();
    }

    loadHistory() {
        const saved = localStorage.getItem('history');
        return saved ? JSON.parse(saved) : [];
    }

    saveHistory() {
        localStorage.setItem('history', JSON.stringify(this.history));
    }

    addToHistory(url, title) {
        // Don't add local pages or file:// URLs
        if (url.includes('newtab.html') || url.includes('settings.html') || url.startsWith('file://') || url === '') return;
        
        // Remove if already exists
        this.history = this.history.filter(item => item.url !== url);
        
        // Add to beginning
        this.history.unshift({
            url,
            title,
            timestamp: Date.now(),
            favicon: this.getActiveTab()?.favicon || null
        });

        // Keep only last 100 items
        if (this.history.length > 100) {
            this.history = this.history.slice(0, 100);
        }

        this.saveHistory();
    }

    init() {
        // Create initial tab with new tab page
        this.createTab('newtab.html');
        this.setupEventListeners();

        // Force layout calculation after a brief delay to ensure DOM is ready
        setTimeout(() => this.updateLayout(), 100);
        window.addEventListener('resize', () => this.updateLayout());
    }

    setupEventListeners() {
        // New tab button
        document.getElementById('newTabBtn').addEventListener('click', () => {
            this.createTab('newtab.html');
        });

        // Navigation buttons
        document.getElementById('backBtn').addEventListener('click', () => this.goBack());
        document.getElementById('forwardBtn').addEventListener('click', () => this.goForward());
        document.getElementById('refreshBtn').addEventListener('click', () => this.refresh());
        document.getElementById('homeBtn').addEventListener('click', () => this.goHome());

        // Address bar
        const urlInput = document.getElementById('urlInput');
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.navigate(urlInput.value);
            }
        });

        urlInput.addEventListener('focus', function() {
            this.select();
        });

        // Downloads button
        document.getElementById('downloadsBtn').addEventListener('click', () => {
            this.togglePanel('downloadsPanel');
        });

        // Menu button
        document.getElementById('menuBtn').addEventListener('click', () => {
            this.togglePanel('menuPanel');
        });

        // Close panels
        document.getElementById('closeDownloadsBtn').addEventListener('click', () => {
            document.getElementById('downloadsPanel').classList.add('hidden');
        });

        // Menu items
        document.getElementById('bookmarksBtn').addEventListener('click', () => {
            this.toggleSidePanel('bookmarksPanel');
            document.getElementById('menuPanel').classList.add('hidden');
        });

        document.getElementById('historyBtn').addEventListener('click', () => {
            this.toggleSidePanel('historyPanel');
            document.getElementById('menuPanel').classList.add('hidden');
        });

        document.getElementById('downloadsMenuBtn').addEventListener('click', () => {
            this.togglePanel('downloadsPanel');
            document.getElementById('menuPanel').classList.add('hidden');
        });

        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.createTab('settings.html');
            document.getElementById('menuPanel').classList.add('hidden');
        });

        // Close side panels
        document.getElementById('closeBookmarksBtn').addEventListener('click', () => {
            document.getElementById('bookmarksPanel').classList.add('hidden');
        });

        document.getElementById('closeHistoryBtn').addEventListener('click', () => {
            document.getElementById('historyPanel').classList.add('hidden');
        });

        // Bookmark button
        document.getElementById('bookmarkBtn').addEventListener('click', () => {
            this.toggleBookmark();
        });

        // Bookmark search
        document.getElementById('bookmarkSearch').addEventListener('input', (e) => {
            this.searchBookmarks(e.target.value);
        });

        // History search
        document.getElementById('historySearch').addEventListener('input', (e) => {
            this.searchHistory(e.target.value);
        });

        // Download handlers
        window.electronAPI.onDownloadProgress((data) => {
            this.updateDownloadProgress(data);
        });

        window.electronAPI.onDownloadComplete((data) => {
            this.completeDownload(data);
        });

        // Close panels when clicking outside
        document.addEventListener('click', (e) => {
            const downloadsPanel = document.getElementById('downloadsPanel');
            const menuPanel = document.getElementById('menuPanel');
            const downloadsBtn = document.getElementById('downloadsBtn');
            const menuBtn = document.getElementById('menuBtn');

            if (!downloadsPanel.contains(e.target) && !downloadsBtn.contains(e.target)) {
                downloadsPanel.classList.add('hidden');
            }

            if (!menuPanel.contains(e.target) && !menuBtn.contains(e.target)) {
                menuPanel.classList.add('hidden');
            }
        });

        // Initial render
        this.renderBookmarks();
        this.renderHistory();
    }

    // Dynamically size the webviews container to avoid cut-off content
    updateLayout() {
        try {
            const tabBar = document.querySelector('.tab-bar');
            const navBar = document.querySelector('.nav-bar');
            const container = document.getElementById('webviewsContainer');
            
            if (!tabBar || !navBar || !container) {
                console.warn('Layout elements not found');
                return;
            }

            // Calculate available height: window height minus chrome (tab + nav)
            const chromeHeight = tabBar.offsetHeight + navBar.offsetHeight;
            const availableHeight = window.innerHeight - chromeHeight;
            
            console.log('Window height:', window.innerHeight);
            console.log('Chrome height:', chromeHeight);
            console.log('Available height:', availableHeight);
            
            // Set explicit height on container
            container.style.height = availableHeight + 'px';
            container.style.minHeight = availableHeight + 'px';
            
            // Force all webviews to recalculate
            const webviews = container.querySelectorAll('webview');
            webviews.forEach(wv => {
                wv.style.height = '100%';
            });
        } catch (e) {
            console.error('Layout update failed:', e);
        }
    }

    async createTab(url = 'newtab.html') {
        const tabId = ++this.tabIdCounter;
        
        // Determine if this is the new tab page or settings
        const isNewTab = url === 'newtab.html';
        const isSettings = url === 'settings.html';
        const isLocalPage = isNewTab || isSettings;
        const tabTitle = isNewTab ? 'New Tab' : isSettings ? 'Settings' : 'Loading...';
        
        // Create tab element
        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.dataset.tabId = tabId;
        tabElement.innerHTML = `
            <img class="tab-favicon" src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><circle cx='8' cy='8' r='7' fill='%238b5cf6'/></svg>" alt="">
            <span class="tab-title">${tabTitle}</span>
            <button class="tab-close">×</button>
        `;

        // Create webview element
        const webview = document.createElement('webview');
        webview.className = 'webview';
        webview.dataset.tabId = tabId;
        
        // Set the source - if it's local page, construct proper file URL
        if (isLocalPage) {
            // Get the directory of the current page
            const currentDir = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
            webview.src = currentDir + url;
            console.log('Loading local page:', webview.src);
        } else {
            // Make sure external URLs have a protocol
            if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
                webview.src = 'https://' + url;
            } else {
                webview.src = url;
            }
            webview.setAttribute('allowpopups', '');
        }
        
        webview.setAttribute('partition', 'persist:obsidian');
        
        // Security: Disable node integration in webview
        webview.setAttribute('nodeintegration', 'false');
        webview.setAttribute('webpreferences', 'contextIsolation=true,webSecurity=false');

        // Tab object
        const tab = {
            id: tabId,
            element: tabElement,
            webview: webview,
            title: tabTitle,
            url: url,
            favicon: null,
            isBookmarked: false,
            isNewTab: isNewTab,
            isSettings: isSettings
        };

        this.tabs.push(tab);

        // Add to DOM
        document.getElementById('tabsContainer').appendChild(tabElement);
        document.getElementById('webviewsContainer').appendChild(webview);

        // Setup webview events
        this.setupWebviewEvents(tab);

        // Setup tab events
        tabElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                this.switchTab(tabId);
            }
        });

        tabElement.querySelector('.tab-close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(tabId);
        });

        // Switch to new tab
        this.switchTab(tabId);

        return tab;
    }

    setupWebviewEvents(tab) {
        const webview = tab.webview;

        // Page loaded
        webview.addEventListener('did-finish-load', () => {
            console.log('Webview loaded:', tab.url);
            this.updateTabInfo(tab);
        });

        // Failed to load
        webview.addEventListener('did-fail-load', (e) => {
            console.error('Failed to load:', tab.url, e);
        });

        // Page title updated
        webview.addEventListener('page-title-updated', (e) => {
            tab.title = e.title;
            this.updateTabTitle(tab);
            if (tab.id === this.activeTabId) {
                document.title = e.title + ' - Obsidian';
                
                // Add to history (not for local pages)
                if (!tab.isNewTab && !tab.isSettings) {
                    this.addToHistory(tab.url, e.title);
                }
            }
        });

        // Favicon updated
        webview.addEventListener('page-favicon-updated', (e) => {
            if (e.favicons && e.favicons.length > 0) {
                tab.favicon = e.favicons[0];
                this.updateTabFavicon(tab);
            }
        });

        // Navigation
        webview.addEventListener('did-navigate', () => {
            this.updateTabInfo(tab);
        });

        webview.addEventListener('did-navigate-in-page', () => {
            this.updateTabInfo(tab);
        });

        // Loading started
        webview.addEventListener('did-start-loading', () => {
            if (tab.id === this.activeTabId) {
                document.getElementById('loadingBar').classList.remove('hidden');
                document.getElementById('loadingBar').style.width = '50%';
            }
        });

        // Loading finished
        webview.addEventListener('did-stop-loading', () => {
            if (tab.id === this.activeTabId) {
                const loadingBar = document.getElementById('loadingBar');
                loadingBar.style.width = '100%';
                setTimeout(() => {
                    loadingBar.classList.add('hidden');
                    loadingBar.style.width = '0';
                }, 300);
            }
        });

        // New window (open in new tab)
        webview.addEventListener('new-window', (e) => {
            e.preventDefault();
            this.createTab(e.url);
        });

        // Certificate error (security)
        webview.addEventListener('certificate-error', (e) => {
            e.preventDefault();
            alert('⚠️ Security Warning: This site has an invalid security certificate. Connection blocked for your safety.');
        });
    }

    updateTabInfo(tab) {
        const webview = tab.webview;
        
        // Check if webview is ready and has getURL method
        if (!webview || typeof webview.getURL !== 'function') {
            return;
        }
        
        tab.url = webview.getURL();
        
        // Check if it's a local page
        const isLocalPage = tab.url.includes('newtab.html') || tab.url.includes('settings.html') || tab.isNewTab || tab.isSettings;
        
        if (tab.id === this.activeTabId) {
            // Update address bar - show empty for local pages
            if (isLocalPage) {
                document.getElementById('urlInput').value = '';
                document.getElementById('urlInput').placeholder = tab.isSettings ? 'Settings' : 'Search or enter website address';
            } else {
                document.getElementById('urlInput').value = tab.url;
            }
            
            // Update security indicator
            const securityIndicator = document.getElementById('securityIndicator');
            if (isLocalPage) {
                securityIndicator.style.display = 'none';
            } else {
                securityIndicator.style.display = 'flex';
                if (tab.url.startsWith('https://')) {
                    securityIndicator.classList.remove('insecure');
                    securityIndicator.title = 'Connection is secure';
                } else if (tab.url.startsWith('http://')) {
                    securityIndicator.classList.add('insecure');
                    securityIndicator.title = 'Connection is not secure';
                }
            }
            
            // Update navigation buttons
            document.getElementById('backBtn').disabled = !webview.canGoBack();
            document.getElementById('forwardBtn').disabled = !webview.canGoForward();
        }
    }

    updateTabTitle(tab) {
        const titleElement = tab.element.querySelector('.tab-title');
        titleElement.textContent = tab.title;
    }

    updateTabFavicon(tab) {
        const faviconElement = tab.element.querySelector('.tab-favicon');
        faviconElement.src = tab.favicon;
    }

    switchTab(tabId) {
        // Deactivate all tabs
        this.tabs.forEach(tab => {
            tab.element.classList.remove('active');
            tab.webview.classList.remove('active');
        });

        // Activate selected tab
        const tab = this.tabs.find(t => t.id === tabId);
        if (tab) {
            tab.element.classList.add('active');
            tab.webview.classList.add('active');
            this.activeTabId = tabId;
            this.updateTabInfo(tab);
            document.title = tab.title + ' - Obsidian';
            
            // Update bookmark button state
            this.updateBookmarkButton(tab);
        }
    }

    updateBookmarkButton(tab) {
        const bookmarkBtn = document.getElementById('bookmarkBtn');
        const isBookmarked = this.bookmarks.some(b => b.url === tab.url);
        bookmarkBtn.classList.toggle('bookmarked', isBookmarked);
    }

    closeTab(tabId) {
        const tabIndex = this.tabs.findIndex(t => t.id === tabId);
        if (tabIndex === -1) return;

        const tab = this.tabs[tabIndex];
        
        // Remove from DOM
        tab.element.remove();
        tab.webview.remove();
        
        // Remove from array
        this.tabs.splice(tabIndex, 1);

        // If closing active tab, switch to another
        if (tab.id === this.activeTabId) {
            if (this.tabs.length > 0) {
                const newActiveTab = this.tabs[Math.max(0, tabIndex - 1)];
                this.switchTab(newActiveTab.id);
            } else {
                // No tabs left, create a new one with new tab page
                this.createTab('newtab.html');
            }
        }
    }

    getActiveTab() {
        return this.tabs.find(t => t.id === this.activeTabId);
    }

    async navigate(input) {
        const tab = this.getActiveTab();
        if (!tab) return;

        const url = await window.electronAPI.navigate(input);
        tab.webview.src = url;
    }

    goBack() {
        const tab = this.getActiveTab();
        if (tab && tab.webview.canGoBack()) {
            tab.webview.goBack();
        }
    }

    goForward() {
        const tab = this.getActiveTab();
        if (tab && tab.webview.canGoForward()) {
            tab.webview.goForward();
        }
    }

    refresh() {
        const tab = this.getActiveTab();
        if (tab) {
            tab.webview.reload();
        }
    }

    goHome() {
        const tab = this.getActiveTab();
        if (tab) {
            tab.webview.src = 'newtab.html';
        }
    }

    togglePanel(panelId) {
        const panel = document.getElementById(panelId);
        const isHidden = panel.classList.contains('hidden');
        
        // Close all panels first
        document.getElementById('downloadsPanel').classList.add('hidden');
        document.getElementById('menuPanel').classList.add('hidden');
        
        // Toggle the requested panel
        if (isHidden) {
            panel.classList.remove('hidden');
        }
    }

    toggleSidePanel(panelId) {
        const panel = document.getElementById(panelId);
        panel.classList.toggle('hidden');
        
        // Close other side panels
        if (panelId === 'bookmarksPanel') {
            document.getElementById('historyPanel').classList.add('hidden');
        } else if (panelId === 'historyPanel') {
            document.getElementById('bookmarksPanel').classList.add('hidden');
        }
    }

    toggleBookmark() {
        const tab = this.getActiveTab();
        if (!tab || tab.isNewTab || tab.isSettings) return;

        const existingIndex = this.bookmarks.findIndex(b => b.url === tab.url);
        const bookmarkBtn = document.getElementById('bookmarkBtn');
        
        if (existingIndex !== -1) {
            // Remove bookmark
            this.bookmarks.splice(existingIndex, 1);
            bookmarkBtn.classList.remove('bookmarked');
            console.log('Removed bookmark:', tab.title);
        } else {
            // Add bookmark
            this.bookmarks.push({
                url: tab.url,
                title: tab.title,
                favicon: tab.favicon,
                timestamp: Date.now()
            });
            bookmarkBtn.classList.add('bookmarked');
            console.log('Added bookmark:', tab.title);
        }

        this.saveBookmarks();
    }

    renderBookmarks(filter = '') {
        const bookmarksList = document.getElementById('bookmarksList');
        const filtered = filter 
            ? this.bookmarks.filter(b => 
                b.title.toLowerCase().includes(filter.toLowerCase()) ||
                b.url.toLowerCase().includes(filter.toLowerCase())
              )
            : this.bookmarks;

        if (filtered.length === 0) {
            bookmarksList.innerHTML = '<div class="empty-state">No bookmarks found</div>';
            return;
        }

        bookmarksList.innerHTML = filtered.map(bookmark => `
            <div class="bookmark-item" data-url="${bookmark.url}">
                <img class="item-favicon" src="${bookmark.favicon || 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\'><circle cx=\'8\' cy=\'8\' r=\'7\' fill=\'%238b5cf6\'/></svg>'}" alt="">
                <div class="item-info">
                    <div class="item-title">${bookmark.title}</div>
                    <div class="item-url">${bookmark.url}</div>
                </div>
                <div class="item-actions">
                    <button class="item-action-btn delete-bookmark" data-url="${bookmark.url}">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M6 2l1-1h2l1 1h3v2H3V2h3zM4 5h8v9H4V5z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Add click handlers
        bookmarksList.querySelectorAll('.bookmark-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-bookmark')) {
                    const url = item.dataset.url;
                    this.navigate(url);
                    document.getElementById('bookmarksPanel').classList.add('hidden');
                }
            });
        });

        bookmarksList.querySelectorAll('.delete-bookmark').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = btn.dataset.url;
                this.bookmarks = this.bookmarks.filter(b => b.url !== url);
                this.saveBookmarks();
            });
        });
    }

    searchBookmarks(query) {
        this.renderBookmarks(query);
    }

    renderHistory(filter = '') {
        const historyList = document.getElementById('historyList');
        const filtered = filter 
            ? this.history.filter(h => 
                h.title.toLowerCase().includes(filter.toLowerCase()) ||
                h.url.toLowerCase().includes(filter.toLowerCase())
              )
            : this.history;

        if (filtered.length === 0) {
            historyList.innerHTML = '<div class="empty-state">No history found</div>';
            return;
        }

        // Group by date
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        const grouped = filtered.reduce((acc, item) => {
            const date = new Date(item.timestamp).toDateString();
            let label;
            if (date === today) label = 'Today';
            else if (date === yesterday) label = 'Yesterday';
            else label = date;

            if (!acc[label]) acc[label] = [];
            acc[label].push(item);
            return acc;
        }, {});

        historyList.innerHTML = Object.entries(grouped).map(([label, items]) => `
            <div class="history-group">
                <div class="history-group-label">${label}</div>
                ${items.map(item => `
                    <div class="history-item" data-url="${item.url}">
                        <img class="item-favicon" src="${item.favicon || 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\'><circle cx=\'8\' cy=\'8\' r=\'7\' fill=\'%238b5cf6\'/></svg>'}" alt="">
                        <div class="item-info">
                            <div class="item-title">${item.title}</div>
                            <div class="item-url">${item.url}</div>
                        </div>
                        <div class="item-actions">
                            <button class="item-action-btn delete-history" data-url="${item.url}">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M6 2l1-1h2l1 1h3v2H3V2h3zM4 5h8v9H4V5z" fill="currentColor"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('');

        // Add click handlers
        historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-history')) {
                    const url = item.dataset.url;
                    this.navigate(url);
                    document.getElementById('historyPanel').classList.add('hidden');
                }
            });
        });

        historyList.querySelectorAll('.delete-history').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = btn.dataset.url;
                this.history = this.history.filter(h => h.url !== url);
                this.saveHistory();
                this.renderHistory(filter);
            });
        });
    }

    searchHistory(query) {
        this.renderHistory(query);
    }

    updateDownloadProgress(data) {
        const downloadsList = document.getElementById('downloadsList');
        const badge = document.getElementById('downloadBadge');
        
        // Remove empty state
        const emptyState = downloadsList.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        // Find or create download item
        let downloadItem = downloadsList.querySelector(`[data-filename="${data.fileName}"]`);
        if (!downloadItem) {
            downloadItem = document.createElement('div');
            downloadItem.className = 'download-item';
            downloadItem.dataset.filename = data.fileName;
            downloadItem.innerHTML = `
                <div class="download-name">${data.fileName}</div>
                <div class="download-progress">
                    <div class="download-progress-bar" style="width: 0%"></div>
                </div>
                <div class="download-status">Downloading...</div>
            `;
            downloadsList.insertBefore(downloadItem, downloadsList.firstChild);
            
            // Update badge
            const count = downloadsList.querySelectorAll('.download-item').length;
            badge.textContent = count;
            badge.classList.add('has-downloads');
        }

        // Update progress
        const progressBar = downloadItem.querySelector('.download-progress-bar');
        progressBar.style.width = data.progress + '%';
    }

    completeDownload(data) {
        const downloadItem = document.querySelector(`[data-filename="${data.fileName}"]`);
        if (downloadItem) {
            const status = downloadItem.querySelector('.download-status');
            status.textContent = 'Complete ✓';
            status.style.color = 'var(--accent-green)';
        }
    }
}

// Initialize browser
const tabManager = new TabManager();

// Set window icon (if logo exists)
if (window.electronAPI && window.electronAPI.setIcon) {
    window.electronAPI.setIcon();
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + T - New tab
    if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        tabManager.createTab('newtab.html');
    }
    
    // Cmd/Ctrl + W - Close tab
    if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault();
        const activeTab = tabManager.getActiveTab();
        if (activeTab) {
            tabManager.closeTab(activeTab.id);
        }
    }
    
    // Cmd/Ctrl + R - Refresh
    if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        tabManager.refresh();
    }
    
    // Cmd/Ctrl + L - Focus address bar
    if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        document.getElementById('urlInput').focus();
    }
    
    // Cmd/Ctrl + [ - Back
    if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        e.preventDefault();
        tabManager.goBack();
    }
    
    // Cmd/Ctrl + ] - Forward
    if ((e.metaKey || e.ctrlKey) && e.key === ']') {
        e.preventDefault();
        tabManager.goForward();
    }
});

console.log('� Obsidian Browser initialized');
console.log('Platform:', window.electronAPI.platform);
