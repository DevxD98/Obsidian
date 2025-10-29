const { contextBridge, ipcRenderer } = require('electron');

// Security: Expose only specific APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', Object.freeze({
  // Navigation
  navigate: (url) => ipcRenderer.invoke('navigate', url),
  
  // Page info
  getPageInfo: (webContentsId) => ipcRenderer.invoke('get-page-info', webContentsId),
  
  // Downloads
  downloadFile: (url) => ipcRenderer.send('download-file', url),
  onDownloadProgress: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('download-progress', listener);
    return () => ipcRenderer.removeListener('download-progress', listener);
  },
  onDownloadComplete: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('download-complete', listener);
    return () => ipcRenderer.removeListener('download-complete', listener);
  },
  onDownloadError: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('download-error', listener);
    return () => ipcRenderer.removeListener('download-error', listener);
  },
  
  // Platform info
  platform: process.platform
}));
