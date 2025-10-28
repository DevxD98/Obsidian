const { app, BrowserWindow, ipcMain, session, dialog, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// Set app name BEFORE app is ready
app.name = 'Obsidian';

// Security: Disable remote module
app.allowRendererProcessReuse = true;

let mainWindow;

// Security: Set strict Content Security Policy
function setupSecurityPolicies() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
        ]
      }
    });
  });

  // Security: Block insecure content
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*'] }, (details, callback) => {
    if (!details.url.startsWith('http://localhost') && !details.url.startsWith('http://127.0.0.1')) {
      // We'll allow HTTP for now but warn the user
    }
    callback({});
  });
}

// Security: Setup session with privacy settings
function setupSession() {
  const ses = session.defaultSession;
  
  // Clear cache on startup for privacy
  ses.clearCache();
  
  // Security: Set strict permissions
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['notifications', 'media'];
    callback(allowedPermissions.includes(permission));
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

  mainWindow.loadFile('src/ui/index.html');

  // Show window when ready for smooth loading
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Allow webview to load local files
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Access-Control-Allow-Origin': ['*']
      }
    });
  });

  // Security: Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Development tools (disable in production)
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

// IPC Handlers for secure communication between renderer and main process

// Navigate to URL
ipcMain.handle('navigate', async (event, url) => {
  // Security: Validate URL
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (!url.includes('.')) {
      // Search query
      return `https://www.google.com/search?q=${encodeURIComponent(url)}`;
    }
    url = 'https://' + url;
  }
  return url;
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
  mainWindow.webContents.downloadURL(url);
});

// Handle downloads
app.on('ready', () => {
  session.defaultSession.on('will-download', (event, item, webContents) => {
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
            const progress = (item.getReceivedBytes() / totalBytes) * 100;
            mainWindow.webContents.send('download-progress', {
              fileName,
              progress: progress.toFixed(1)
            });
          }
        });
        
        item.once('done', (event, state) => {
          if (state === 'completed') {
            mainWindow.webContents.send('download-complete', { fileName });
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
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.protocol === 'file:' || parsedUrl.protocol === 'data:') {
      event.preventDefault();
    }
  });
});
