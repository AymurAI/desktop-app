import { BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';

import { isDebug, isProduction } from './env';
import { resolveHTMLPath, crypto, feedback, excel } from './utils';

export let mainWindow: BrowserWindow | null;

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
    window.show();
  });

  window.webContents.on('new-window', (e, url) => {
    const EXTERNAL_URLS = [
      'https://www.datagenero.org/',
      'https://accounts.google.com/o/oauth2/v2/auth',
    ];

    // Check if the url is in the 'whitelist'
    if (!!EXTERNAL_URLS.find((val) => url.includes(val))) {
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

  // FILESYSTEM
  ipcMain.handle('EXPORT_FEEDBACK', (_, fileName: string, data: object) =>
    feedback.export(fileName, data)
  );
  ipcMain.handle('EXCEL_READ', excel.read);
  ipcMain.handle('EXCEL_WRITE', (_, buffer: Buffer) => excel.write(buffer));
  ipcMain.handle('EXCEL_OPEN', excel.open);

  // OAUTH
  ipcMain.handle('GET_CHALLENGE_CODE', crypto.getChallengeCode);
  ipcMain.handle('GET_VERIFIER_CODE', crypto.getVerifierCode);
}
