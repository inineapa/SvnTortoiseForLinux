const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const { execFile } = require('child_process');
const { registerIpcHandlers } = require('./ipc-handlers');

// Handle sandbox issues on Linux
app.commandLine.appendSwitch('no-sandbox');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'SVN Tortoise for Ubuntu',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  // Remove default menu
  Menu.setApplicationMenu(null);

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Forward renderer console to main process (Electron 41+ uses event object)
  mainWindow.webContents.on('console-message', (event) => {
    const levelStr = ['LOG', 'WARN', 'ERROR'][event.level] || 'LOG';
    console.log(`[Renderer ${levelStr}] ${event.message}`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function checkSvnInstalled() {
  return new Promise((resolve) => {
    execFile('svn', ['--version', '--quiet'], (error) => {
      resolve(!error);
    });
  });
}

app.whenReady().then(async () => {
  const hasSvn = await checkSvnInstalled();
  if (!hasSvn) {
    dialog.showErrorBox(
      'SVN Not Found',
      'The "svn" command-line tool is not installed.\n\n' +
      'Please install it with:\n  sudo apt install subversion\n\n' +
      'The application will now exit.'
    );
    app.quit();
    return;
  }

  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
