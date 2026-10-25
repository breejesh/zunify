const { app, BrowserWindow, ipcMain, dialog, globalShortcut, session, nativeImage, shell } = require('electron');
const path = require('path');

// Explicitly define persistent application identity
app.name = 'Zunify';
app.setAppUserModelId('com.breejeshrathod.zunify');

let mainWindow = null;

const isDev = process.env.ELECTRON_DEV === 'true' || process.argv.includes('--dev');
const isMac = process.platform === 'darwin';

// Only one Zunify window: a second launch focuses the running instance instead of
// fighting it over the media keys and the shared library database.
const hasInstanceLock = app.requestSingleInstanceLock();
if (!hasInstanceLock) {
  app.quit();
}

app.on('second-instance', () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
});

function createWindow() {
  const iconIcoPath = path.join(__dirname, '../public/icon.ico');
  const iconPngPath = path.join(__dirname, '../public/icon.png');
  const iconImage = nativeImage.createFromPath(iconPngPath);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 640,
    // macOS keeps its native traffic lights inside the Zune header; Windows/Linux use
    // a fully frameless window with the app's own window controls.
    frame: isMac,
    titleBarStyle: isMac ? 'hidden' : 'default',
    trafficLightPosition: isMac ? { x: 20, y: 30 } : undefined,
    title: 'Zunify',
    backgroundColor: '#101010',
    icon: process.platform === 'win32' ? iconIcoPath : iconImage,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
      // A music player must keep playing (and auto-advance tracks) while minimized or
      // covered by other windows; throttling would also report the page as hidden,
      // which makes Chromium defer loading the next track.
      backgroundThrottling: false,
      // Guaranteed permanent storage partition on disk
      partition: 'persist:zunify'
    }
  });

  if (process.platform === 'win32' && !iconImage.isEmpty()) {
    mainWindow.setIcon(iconImage);
  }

  if (isDev) {
    mainWindow.loadURL('http://localhost:4200');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/zunify/browser/index.html'));
  }

  // Open external links (GitHub, website) in the user's browser, never inside the app window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const appUrl = mainWindow?.webContents.getURL();
    if (url !== appUrl && !url.startsWith('http://localhost:4200')) {
      event.preventDefault();
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    }
  });

  // Window state notification to renderer
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window-maximize-changed', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window-maximize-changed', false);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Automatically approve native file permissions for seamless offline playback
function setupPermissions() {
  const ses = session.fromPartition('persist:zunify');
  ses.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(true);
  });
  ses.setPermissionCheckHandler(() => {
    return true;
  });
}

// IPC Handlers for Window Controls
ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() ?? false;
});

// IPC Handler for Directory Selection Dialog
ipcMain.handle('dialog-open-directory', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Music Folder'
  });
  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

// Register Global Media Keys
function registerMediaShortcuts() {
  try {
    globalShortcut.register('MediaPlayPause', () => {
      mainWindow?.webContents.send('media-action', 'play-pause');
    });
    globalShortcut.register('MediaNextTrack', () => {
      mainWindow?.webContents.send('media-action', 'next');
    });
    globalShortcut.register('MediaPreviousTrack', () => {
      mainWindow?.webContents.send('media-action', 'prev');
    });
  } catch (err) {
    console.warn('Could not register media keys:', err);
  }
}

app.whenReady().then(() => {
  if (!hasInstanceLock) return;
  setupPermissions();
  createWindow();
  registerMediaShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
