import { App } from 'electron';
import path from 'path';
import { mainWindow } from './createWindow';

import { URI_SCHEME } from './env';

/**
 * Sets the uri scheme to handle default protocol
 */
export function setDefaultProtocol(app: App) {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(URI_SCHEME, process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient(URI_SCHEME);
  }
}

/**
 * Windows only lock handler
 */
export function lockHandler(app: App) {
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    app.quit();
  } else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      // Someone tried to run a second instance, we should focus our window.
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
  }
}
