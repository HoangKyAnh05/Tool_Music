const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectBeatFile: () => ipcRenderer.invoke('dialog:selectBeatFile'),
  saveProjectFile: (data) => ipcRenderer.invoke('dialog:saveProjectFile', data),
  openProjectFile: () => ipcRenderer.invoke('dialog:openProjectFile'),
  openExternalUrl: (url) => ipcRenderer.invoke('shell:openExternal', url),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close')
});
