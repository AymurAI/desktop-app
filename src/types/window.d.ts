// Add functions to window object from the renderer process (Electron)
declare global {
	interface Window {
		filesystem?: {
			feedback: {
				export: (fileName: string, data: object) => Promise<void>;
			};
			excel: {
				read: () => Promise<Buffer>;
				write: (buffer: Buffer) => Promise<void>;
				open: () => Promise<string>;
			};
		};
		taskbar?: {
			notify: () => Promise<void>;
		};
		electronAPI?: {
			runBatch: () => void;
		};
	}
}

export {};
