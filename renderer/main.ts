import { App, app, BrowserWindow, dialog } from 'electron';

import createWindow from './createWindow';
import { debug, installExtensions } from './extensions';
import { setDefaultProtocol } from './protocol';
import { sendCodeToApp } from './utils/oauth';

/**
 * Configures the app with handlers and other features
 * @param app App instance, after the `whenReady()`
 */
export function configureApp(app: App) {
  // Set the name to the app
  setDefaultProtocol(app);

  /**
   * EVENT HANDLERS
   */
  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Handle the protocol. In this case, we choose to show an Error Box.
  app.on('open-url', (_, url) => {
    const parsed = new URL(url);

    if (parsed.protocol === 'aymurai.app:') {
      sendCodeToApp(parsed);
    } else {
      dialog.showErrorBox('Welcome Back', `You arrived from: ${url}`);
    }
  });

  // On macOS it's common for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
  });
}

(async () => {
  try {
    // Add debug features
    await debug();

    await app.whenReady();

    // Installs REACT DEVELOPER TOOLS
    await installExtensions();

    // Creates the main window
    createWindow();

    // Configures the app
    configureApp(app);
  } catch (e) {
    console.error('An error occurred while starting the app', e);
  }
})();
