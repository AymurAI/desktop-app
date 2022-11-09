import { BrowserWindow } from 'electron';

import { isDebug, isProduction, startMinimized } from './env';
import { resolveHTMLPath } from './utils';

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
}

export default function createWindow() {
  // Creates the browser window.
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
  });

  // Add configuration
  configureWindow(mainWindow);

  // and handlers
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}
