import { app, BrowserWindow, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { PythonManager } from './pythonManager';

console.log('[Electron] main.ts loaded, app starting...');

// Detect if running in development
const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
const pythonManager = new PythonManager();

async function createWindow() {
    const iconPath = path.join(__dirname, '..', 'resources', 'icon.png');
    console.log('[Electron] Creating BrowserWindow...');

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        title: 'Retrocast',
        icon: fs.existsSync(iconPath) ? iconPath : undefined,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        show: false, // Show after ready
        backgroundColor: '#09090b', // Match app background
    });

    // Show when ready to prevent flash
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    if (isDev) {
        console.log('[Electron] Loading URL: http://127.0.0.1:5173');
        mainWindow.loadURL('http://127.0.0.1:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', async () => {
    try {
        // Start Python backend
        await pythonManager.start();

        // Create window after backend is ready
        await createWindow();
    } catch (error) {
        dialog.showErrorBox(
            'Startup Error',
            `Failed to start the application:\n\n${error}\n\nPlease ensure Python 3.11+ is installed.`
        );
        app.quit();
    }
});

app.on('window-all-closed', async () => {
    await pythonManager.stop();
    app.quit();
});

app.on('before-quit', async () => {
    await pythonManager.stop();
});

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
    console.error('Uncaught exception:', error);
    await pythonManager.stop();
});
