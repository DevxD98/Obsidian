const { contextBridge, ipcRenderer } = require('electron');

// Security: Expose only specific APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Navigation
  navigate: (url) => ipcRenderer.invoke('navigate', url),
  
  // Page info
  getPageInfo: (webContentsId) => ipcRenderer.invoke('get-page-info', webContentsId),
  
  // Downloads
  downloadFile: (url) => ipcRenderer.send('download-file', url),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, data) => callback(data)),
  onDownloadComplete: (callback) => ipcRenderer.on('download-complete', (event, data) => callback(data)),
  
  // Platform info
  platform: process.platform
});
