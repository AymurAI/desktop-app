import { BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';

import { isDebug, isProduction, startMinimized } from './env';
import { resolveHTMLPath } from './utils';
import { getCodeChallenge } from './utils/crypto';
import exportFeedback from './utils/feedback';

let mainWindow: BrowserWindow | null;

/**
 * Configures the main `BrowserWindow` with features and handlers
 * @param window Main window created on the main process
 */
function configureWindow(window: BrowserWindow | null) {
  if (!window) {
    throw new Error('"mainWindow" is not defined');
  } else {
  }
  if (isDebug) {
    window.webContents.openDevTools();
  }
  if (isProduction) {
    window.maximize();
  }

  window.loadURL(resolveHTMLPath());

  /**
   * HANDLERS
   */
  window.on('ready-to-show', () => {
    if (startMinimized) {
      window.minimize();
    } else {
      window.show();
    }
  });

  window.webContents.on('new-window', (e, url) => {
    const EXTERNAL_URLS = ['https://www.datagenero.org/'];

    // Check if the url is in the 'whitelist'
    if (!!EXTERNAL_URLS.find((val) => val === url)) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });
}

export default function createWindow() {
  // Creates the browser window.
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Add configuration
  configureWindow(mainWindow);

  // and handlers
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  ipcMain.handle('EXPORT_FEEDBACK', (_, fileName: string, data: object) =>
    exportFeedback(fileName, data)
  );
  ipcMain.handle('GET_CODE_CHALLENGE', () => getCodeChallenge());
}
