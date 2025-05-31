import path from "node:path";
import type { App } from "electron";

import { mainWindow } from "./createWindow";
import { URI_SCHEME } from "./env";

/**
 * Sets the uri scheme to handle default protocol. This allows the app to be opened
 * by clicking on a link in the browser. This link is in the format:
 * `{URI_SCHEME}://path/to/app`
 * @param app App instance
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
 * The lock handler is used to prevent multiple instances of the app from running.
 * If the app is already running, the second instance will quit.
 * @param app App instance
 */
export function lockHandler(app: App) {
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    app.quit();
  } else {
    app.on("second-instance", (_, argv) => {
      // Someone tried to run a second instance, we should focus our window.
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
  }
}
