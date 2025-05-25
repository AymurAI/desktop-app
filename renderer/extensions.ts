import { isDebug } from "./env";

/**
 * Enables debug features. More info on https://www.npmjs.com/package/electron-debug
 */
export async function debug() {
	if (isDebug) {
		try {
			const debugTools = await import("electron-debug");
			console.log("Imported `electron-debug`");

			debugTools.default();
			console.log("Successfully added debug features");
		} catch (e) {
			console.error(e);
		}
	}
}

/**
 * Installs React Developer Tools
 */
export async function installExtensions() {
	if (isDebug) {
		const devtools = await import("electron-devtools-installer");
		console.log("Imported `electron-debug`");

		const install = devtools.default;

		// List extensions to install
		const extensions = [devtools.REACT_DEVELOPER_TOOLS];

		// Install each extension
		extensions.forEach(async (ext) => {
			try {
				const name = await install(ext);
				console.log(`Added Extension:  ${name}`);
			} catch (e) {
				console.error("An error occurred while installing extension: ", e);
			}
		});
	}
}
