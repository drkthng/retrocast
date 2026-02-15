import { contextBridge } from 'electron';

// Expose minimal API to renderer
// For now, just a version indicator. Can be extended later.
contextBridge.exposeInMainWorld('electronAPI', {
    isElectron: true,
    platform: process.platform,
});
