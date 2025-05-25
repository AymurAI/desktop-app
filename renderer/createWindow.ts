import path from "node:path";
import { BrowserWindow, ipcMain, shell } from "electron";

import { EXTERNAL_URLS, isDebug, isProduction } from "./env";
import { excel, feedback, resolveHTMLPath, taskbar } from "./utils";
import electronAPI from "./utils/batch";

export let mainWindow: BrowserWindow | null;

/**
 * Configures the main `BrowserWindow` with features and handlers
 * @param window Main window created on the main process
 */
function configureWindow(window: BrowserWindow | null) {
	if (!window) {
		throw new Error('"mainWindow" is not defined');
	}
	if (isDebug) {
		window.webContents.openDevTools();
	}
	if (isProduction) {
		window.maximize();
	}

	window.loadURL(resolveHTMLPath());

	// window.webContents.openDevTools();

	/**
	 * HANDLERS
	 */
	window.on("ready-to-show", () => {
		window.show();
	});

	window.webContents.on("new-window", (e, url) => {
		// Check if the url is in the 'whitelist'
		if (EXTERNAL_URLS.find((val) => url.includes(val))) {
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
			preload: path.join(__dirname, "preload.js"),
		},
	});

	// Add configuration
	configureWindow(mainWindow);

	// and handlers
	mainWindow.on("closed", () => {
		mainWindow = null;
	});

	// FILESYSTEM
	ipcMain.handle("EXPORT_FEEDBACK", (_, fileName: string, data: object) =>
		feedback.export(fileName, data),
	);
	ipcMain.handle("EXCEL_READ", excel.read);
	ipcMain.handle("EXCEL_WRITE", (_, buffer: Buffer) => excel.write(buffer));
	ipcMain.handle("EXCEL_OPEN", excel.open);

	// TASKBAR
	ipcMain.handle("TASKBAR_NOTIFY", taskbar.notify);

	ipcMain.handle("RUN_BATCH", electronAPI.runBatch);
}
