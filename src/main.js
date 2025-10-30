const { app, BrowserWindow, ipcMain, session, dialog, shell, nativeImage, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const BLOCKED_PROTOCOL_REGEX = /^(javascript:|data:|file:|about:|chrome:|smb:|ftp:|ssh:|tel:|mailto:)/i;

const SESSION_SHUTDOWN_TIMEOUT_MS = 4000;

const hasProtocol = (target = '') => /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(target);

const isLoopbackHost = (host = '') => (
  host === 'localhost' ||
  host === '127.0.0.1' ||
  host === '0.0.0.0' ||
  host.endsWith('.local')
);

const UI_ROOT_PATH = path.join(__dirname, 'ui');
const UI_ROOT_URL = (() => {
  const href = pathToFileURL(UI_ROOT_PATH).href;
  return href.endsWith('/') ? href : `${href}/`;
})();

const isTrustedFileUrl = (target = '') => {
  if (!target.startsWith('file://')) {
    return false;
  }

  try {
    const sanitized = new URL(target);
    const normalized = sanitized.href.split('#')[0];
    const base = UI_ROOT_URL;
    if (!normalized.startsWith(base)) {
      return false;
    }

    const relative = normalized.slice(base.length);
    return relative && !relative.startsWith('../');
  } catch (err) {
    return false;
  }
};

function registerSecureShutdown() {
  let cleanupTriggered = false;

  app.on('before-quit', (event) => {
    if (cleanupTriggered) {
      return;
    }

    event.preventDefault();
    cleanupTriggered = true;

    const ses = session.defaultSession;
    const cleanupTasks = [
      ses.clearStorageData({
        storages: [
          'appcache',
          'filesystem',
          'indexdb',
          'localstorage',
          'shadercache',
          'serviceworkers',
          'cachestorage',
          'websql',
          'cookies'
        ],
        quotas: ['temporary', 'persistent', 'syncable']
      }).catch(() => {}),
      ses.clearCache().catch(() => {}),
      ses.cookies.flushStore().catch(() => {})
    ];

    const timeoutId = setTimeout(() => {
      app.exit(0);
    }, SESSION_SHUTDOWN_TIMEOUT_MS);

    Promise.allSettled(cleanupTasks).finally(() => {
      clearTimeout(timeoutId);
      app.exit(0);
    });
  });
}

function toSafeNavigationUrl(rawInput = '') {
  const input = rawInput.trim();
  if (!input) {
    return 'https://www.google.com';
  }

  if (BLOCKED_PROTOCOL_REGEX.test(input)) {
    return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
  }

  let candidate = input;
  if (!hasProtocol(candidate)) {
    if (!candidate.includes('.')) {
      return `https://www.google.com/search?q=${encodeURIComponent(candidate)}`;
    }
    candidate = `https://${candidate}`;
  }

  try {
    const url = new URL(candidate);
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      if (url.protocol === 'http:' && !isLoopbackHost(url.hostname)) {
        return url.toString();
      }
      return url.toString();
    }
  } catch (err) {
    return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
}

function toSafeDownloadUrl(rawInput = '') {
  const input = rawInput.trim();
  if (!input || BLOCKED_PROTOCOL_REGEX.test(input)) {
    return null;
  }

  let candidate = input;
  if (!hasProtocol(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const url = new URL(candidate);
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      return url.toString();
    }
  } catch (err) {
    return null;
  }

  return null;
}

async function handleSaveAs(contents, browserWindow, pageURL) {
  if (!contents || contents.isDestroyed()) {
    return;
  }

  let suggestedName = 'page.html';
  try {
    if (pageURL) {
      const urlObj = new URL(pageURL);
      const pathname = urlObj.pathname.split('/').filter(Boolean).pop() || 'index';
      const base = pathname.includes('.') ? pathname : `${pathname}.html`;
      suggestedName = `${urlObj.hostname || 'page'}-${base}`;
    }
  } catch (err) {
    // ignore and use default name
  }

  try {
    const { canceled, filePath } = await dialog.showSaveDialog(browserWindow, {
      defaultPath: path.join(app.getPath('downloads'), suggestedName),
      filters: [
        { name: 'Web Page, Complete', extensions: ['html', 'htm'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!canceled && filePath) {
      await contents.savePage(filePath, 'HTMLComplete');
    }
  } catch (err) {
    console.warn('Save As failed:', err.message);
  }
}

function buildContextMenu(contents, params) {
  if (!contents || contents.isDestroyed()) {
    return;
  }

  const browserWindow = BrowserWindow.fromWebContents(contents);
  const pageURL = params?.pageURL || contents.getURL();
  const frameURL = params?.frameURL;
  const canGoBack = typeof contents.canGoBack === 'function' && contents.canGoBack();
  const canGoForward = typeof contents.canGoForward === 'function' && contents.canGoForward();

  let hostname = '';
  try {
    if (pageURL) {
      hostname = new URL(pageURL).hostname;
    }
  } catch (err) {
    hostname = '';
  }

  const template = [];

  if (browserWindow?.isFullScreen()) {
    template.push({
      label: 'Exit Full Screen',
      click: () => {
        if (!browserWindow.isDestroyed()) {
          browserWindow.setFullScreen(false);
        }
      }
    });
    template.push({ type: 'separator' });
  }

  template.push(
    {
      label: 'Back',
      enabled: canGoBack,
      click: () => {
        if (canGoBack) {
          contents.goBack();
        }
      }
    },
    {
      label: 'Forward',
      enabled: canGoForward,
      click: () => {
        if (canGoForward) {
          contents.goForward();
        }
      }
    },
    { label: 'Reload', click: () => contents.reload() },
    { type: 'separator' },
    {
      label: 'Save As…',
      click: () => handleSaveAs(contents, browserWindow, pageURL)
    },
    {
      label: 'Print…',
      click: () => contents.print({ silent: false, printBackground: true })
    },
    {
      label: 'Cast…',
      enabled: false
    },
    {
      label: 'Translate to English',
      enabled: Boolean(pageURL),
      click: () => {
        if (pageURL) {
          const translateUrl = `https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(pageURL)}`;
          shell.openExternal(translateUrl).catch(() => {});
        }
      }
    },
    { type: 'separator' },
    {
      label: 'View Page Source',
      enabled: Boolean(pageURL),
      click: () => {
        try {
          contents.viewSource();
        } catch (err) {
          console.warn('View Page Source failed:', err.message);
        }
      }
    },
    {
      label: 'View Frame Source',
      enabled: Boolean(frameURL),
      click: () => {
        if (frameURL) {
          try {
            contents.viewSource(frameURL);
          } catch (err) {
            console.warn('View Frame Source failed:', err.message);
          }
        }
      }
    },
    {
      label: 'Reload Frame',
      click: () => {
        if (frameURL) {
          contents.executeJavaScript('window.location.reload()', true).catch(() => {});
        } else {
          contents.reload();
        }
      }
    },
    {
      label: 'Inspect',
      click: () => {
        contents.inspectElement(params.x, params.y);
        if (!contents.isDevToolsOpened()) {
          contents.openDevTools({ mode: 'detach' });
        } else {
          contents.devToolsWebContents?.focus?.();
        }
      }
    }
  );

  const menu = Menu.buildFromTemplate(template);
  menu.popup({ window: browserWindow });
}

// Set app name BEFORE app is ready
app.name = 'Obsidian';

// Security: Disable remote module
app.allowRendererProcessReuse = true;

let mainWindow;
let isShuttingDown = false;

async function clearPersistentSessionData() {
  const ses = session.defaultSession;
  try {
    await Promise.all([
      ses.clearStorageData({
        storages: ['cookies', 'localstorage', 'cachestorage', 'filesystem', 'indexdb', 'serviceworkers', 'websql'],
        quotas: ['temporary', 'persistent', 'syncable']
      }).catch(() => {}),
      ses.clearCache().catch(() => {}),
      ses.clearAuthCache({ type: 'password' }).catch(() => {})
    ]);
    await ses.cookies.flushStore().catch(() => {});
  } catch (err) {
    console.warn('Failed to clear session data cleanly:', err);
  }
}

registerSecureShutdown();

// Security: Set strict Content Security Policy
function setupSecurityPolicies() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    if (details.url.startsWith('file://')) {
      responseHeaders['Content-Security-Policy'] = [
        "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'self'; form-action 'self'; object-src 'none'"
      ];
    }

    callback({ responseHeaders });
  });

  // Security: Block insecure content
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*'] }, (details, callback) => {
    callback({});
  });
}

// Security: Setup session with privacy settings
function setupSession() {
  const ses = session.defaultSession;
  
  // Clear cache on startup for privacy
  ses.clearCache().catch(() => {});
  ses.clearStorageData({
    storages: ['cookies', 'localstorage', 'cachestorage', 'filesystem', 'indexdb', 'serviceworkers', 'websql'],
    quotas: ['temporary', 'persistent', 'syncable']
  }).catch(() => {});
  
  // Security: Set strict permissions
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    const url = webContents.getURL() || '';
    const isSecureContext =
      url.startsWith('https://') ||
      url.startsWith('http://localhost') ||
      url.startsWith('http://127.0.0.1') ||
      url.startsWith('http://0.0.0.0') ||
      url.startsWith('http://[::1]');
    const allowedPermissions = ['notifications', 'media'];
    callback(isSecureContext && allowedPermissions.includes(permission));
  });

  ses.setPermissionCheckHandler((webContents, permission) => {
    const url = webContents?.getURL() || '';
    const isSecureContext =
      url.startsWith('https://') ||
      url.startsWith('http://localhost') ||
      url.startsWith('http://127.0.0.1') ||
      url.startsWith('http://0.0.0.0') ||
      url.startsWith('http://[::1]');
    const allowedPermissions = ['notifications', 'media'];
    return isSecureContext && allowedPermissions.includes(permission);
  });
  
  // Security: Block ads and trackers
  ses.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
    const blocklist = [
      'doubleclick.net',
      'googleadservices.com',
      'googlesyndication.com',
      'facebook.com/tr',
      'analytics.google.com'
    ];
    
    const shouldBlock = blocklist.some(domain => details.url.includes(domain));
    callback({ cancel: shouldBlock });
  });
}

function createWindow() {
  // Set app icon - use platform-specific icon
  let iconPath;
  if (process.platform === 'darwin') {
    iconPath = path.join(__dirname, '../assets/icons/mac/icon.icns');
  } else if (process.platform === 'win32') {
    iconPath = path.join(__dirname, '../assets/icons/win/icon.ico');
  } else {
    iconPath = path.join(__dirname, '../assets/icons/png/512x512.png');
  }
  
  let icon = null;
  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath);
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: icon,
    titleBarStyle: 'hiddenInset', // macOS native look
    trafficLightPosition: { x: 20, y: 20 },
    backgroundColor: '#0f0f1a',
    show: false, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Security: Enable context isolation
      nodeIntegration: false, // Security: Disable node integration
      sandbox: true, // Security: Enable sandbox
      webSecurity: true, // Security: Enable web security
      allowRunningInsecureContent: false, // Security: Block mixed content
      experimentalFeatures: false,
      enableRemoteModule: false, // Security: Disable remote module
      worldSafeExecuteJavaScript: true,
      navigateOnDragDrop: false, // Security: Prevent drag-drop navigation
      webviewTag: true // Enable webview tag
    }
  });

  // Allow screenshots for testing/documentation
  // mainWindow.setContentProtection(true); // Disabled to enable screenshots
  mainWindow.setMenuBarVisibility(false);

  mainWindow.loadFile('src/ui/index.html');

  // Show window when ready for smooth loading
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Security: Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const safeUrl = toSafeDownloadUrl(url);
    if (safeUrl) {
      shell.openExternal(safeUrl);
    }
    return { action: 'deny' };
  });

  // Development tools (disable in production)
  if (process.argv.includes('--dev')) {
    mainWindow.setMenuBarVisibility(true);
    mainWindow.webContents.openDevTools();
  }
}

// IPC Handlers for secure communication between renderer and main process

// Navigate to URL
ipcMain.handle('navigate', async (event, url) => {
  return toSafeNavigationUrl(url);
});

// Get page info (title, favicon, etc.)
ipcMain.handle('get-page-info', async (event, webContentsId) => {
  const webContents = require('electron').webContents.fromId(webContentsId);
  if (webContents) {
    return {
      title: webContents.getTitle(),
      url: webContents.getURL(),
      canGoBack: webContents.canGoBack(),
      canGoForward: webContents.canGoForward()
    };
  }
  return null;
});

// Download handler
ipcMain.on('download-file', (event, url) => {
  if (!mainWindow) {
    event.sender.send('download-error', { message: 'Download blocked: main window unavailable.' });
    return;
  }

  const safeUrl = toSafeDownloadUrl(url);
  if (!safeUrl) {
    event.sender.send('download-error', { message: 'Blocked unsafe download request.' });
    return;
  }
  mainWindow.webContents.downloadURL(safeUrl);
});

// Handle downloads
app.on('ready', () => {
  session.defaultSession.on('will-download', (event, item, webContents) => {
    const sourceUrl = toSafeDownloadUrl(item.getURL());
    if (!sourceUrl) {
      event.preventDefault();
      item.cancel();
      webContents?.send('download-error', { message: 'Download blocked due to insecure source.' });
      return;
    }

    if (!mainWindow || mainWindow.isDestroyed()) {
      event.preventDefault();
      item.cancel();
      webContents?.send('download-error', { message: 'Download blocked: window not available.' });
      return;
    }

    const fileName = item.getFilename();
    const totalBytes = item.getTotalBytes();
    
    // Show save dialog
    dialog.showSaveDialog(mainWindow, {
      defaultPath: path.join(app.getPath('downloads'), fileName)
    }).then(result => {
      if (!result.canceled) {
        item.setSavePath(result.filePath);
        
        // Send download progress to renderer
        item.on('updated', (event, state) => {
          if (state === 'progressing') {
            const receivedBytes = item.getReceivedBytes();
            const progress = totalBytes > 0 ? (receivedBytes / totalBytes) * 100 : 0;
            mainWindow.webContents.send('download-progress', {
              fileName,
              progress: progress.toFixed(1)
            });
          }
        });
        
        item.once('done', (event, state) => {
          if (state === 'completed') {
            mainWindow.webContents.send('download-complete', { fileName });
          } else if (state !== 'completed') {
            mainWindow.webContents.send('download-error', { fileName, message: 'Download did not complete successfully.' });
          }
        });
      } else {
        item.cancel();
      }
    });
  });
});

// App lifecycle
app.whenReady().then(() => {
  // Set app name and dock icon when ready
  app.name = 'Obsidian';
  
  // Set dock icon on macOS (use PNG instead of ICNS for runtime)
  if (process.platform === 'darwin') {
    const dockIconPath = path.join(__dirname, '../assets/icons/png/512x512.png');
    if (fs.existsSync(dockIconPath)) {
      try {
        app.dock.setIcon(dockIconPath);
      } catch (err) {
        console.log('Could not set dock icon:', err.message);
      }
    }
  }
  
  setupSecurityPolicies();
  setupSession();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', (event) => {
  if (isShuttingDown) {
    return;
  }

  event.preventDefault();
  isShuttingDown = true;

  clearPersistentSessionData().finally(() => {
    // Use exit to avoid re-triggering before-quit handlers
    app.exit(0);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  event.preventDefault();
  // In production, you should show a warning to the user
  callback(false); // Reject invalid certificates
});

// Security: Prevent navigation to insecure protocols
app.on('web-contents-created', (event, contents) => {
  contents.on('will-attach-webview', (attachEvent, webPreferences, params) => {
    if (params?.src) {
      const { src } = params;
      if (src.startsWith('file://')) {
        if (!isTrustedFileUrl(src)) {
          attachEvent.preventDefault();
          return;
        }
      } else if (BLOCKED_PROTOCOL_REGEX.test(src)) {
        attachEvent.preventDefault();
        return;
      }
    }

    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    webPreferences.sandbox = true;
    webPreferences.webSecurity = true;
    webPreferences.enableRemoteModule = false;
  });

  contents.on('will-navigate', (event, navigationUrl) => {
    if (navigationUrl.startsWith('file://')) {
      if (!isTrustedFileUrl(navigationUrl)) {
        event.preventDefault();
      }
      return;
    }

    if (BLOCKED_PROTOCOL_REGEX.test(navigationUrl)) {
      event.preventDefault();
      return;
    }

    try {
      const parsedUrl = new URL(navigationUrl);

      if (BLOCKED_PROTOCOL_REGEX.test(parsedUrl.protocol)) {
        event.preventDefault();
        return;
      }

      if (parsedUrl.protocol === 'data:') {
        event.preventDefault();
      }
    } catch (err) {
      event.preventDefault();
    }
  });

  contents.on('context-menu', (contextEvent, params) => {
    contextEvent.preventDefault();
    buildContextMenu(contents, params);
  });
});
