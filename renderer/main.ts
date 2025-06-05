import { BrowserWindow, app } from "electron";

import createWindow from "./createWindow";
import { debug, installExtensions } from "./extensions";
import { lockHandler, setDefaultProtocol } from "./protocol";
import electronAPI from "./utils/batch";
/**
 * Configures the app with handlers and other features
 * @param app App instance, after the `whenReady()`
 */
export function configureApp() {
  // Set the name to the app
  setDefaultProtocol(app);

  /**
   * EVENT HANDLERS
   */
  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Handle the protocol. In this case, we choose to show an Error Box.
  app.on("open-url", (_, url) => {
    console.log("open-url handler", url);
  });
  app.on("before-quit", () => {
    electronAPI.stopBatch();
  });
}

(async () => {
  try {
    // Add debug features
    await debug();

    lockHandler(app);

    await app.whenReady();

    // Installs REACT DEVELOPER TOOLS
    await installExtensions();

    // Creates the main window
    createWindow();

    // Configures the app
    configureApp();
  } catch (e) {
    console.error("An error occurred while starting the app", e);
  }
})();
