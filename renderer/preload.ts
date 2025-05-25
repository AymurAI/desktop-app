import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("filesystem", {
	feedback: {
		export: (fileName: string, object: object) =>
			ipcRenderer.invoke("EXPORT_FEEDBACK", fileName, object),
	},
	excel: {
		read: () => ipcRenderer.invoke("EXCEL_READ"),
		write: (buffer: Buffer) => ipcRenderer.invoke("EXCEL_WRITE", buffer),
		open: () => ipcRenderer.invoke("EXCEL_OPEN"),
	},
});

contextBridge.exposeInMainWorld("taskbar", {
	notify: () => ipcRenderer.invoke("TASKBAR_NOTIFY"),
});

contextBridge.exposeInMainWorld("electronAPI", {
	runBatch: (result: unknown) => ipcRenderer.invoke("RUN_BATCH", result),
});
