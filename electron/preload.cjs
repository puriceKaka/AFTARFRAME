const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('afterframeDesktop', Object.freeze({
  isDesktop: true,
  openVideos: () => ipcRenderer.invoke('afterframe:open-videos'),
  getLibrary: () => ipcRenderer.invoke('afterframe:get-library'),
  restoreVideo: (path) => ipcRenderer.invoke('afterframe:restore-video', path),
  forgetVideo: (path) => ipcRenderer.invoke('afterframe:forget-video', path),
}));
