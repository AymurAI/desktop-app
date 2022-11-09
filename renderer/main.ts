import { App, app, BrowserWindow } from 'electron';

import createWindow from './createWindow';
import { debug, installExtensions } from './extensions';

/**
 * Configures the app with handlers and other features
 * @param app App instance, after the `whenReady()`
 */
export function configureApp(app: App) {
  // Set the name to the app
  app.setAsDefaultProtocolClient('aymurai');

  /**
   * EVENT HANDLERS
   */
  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
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
