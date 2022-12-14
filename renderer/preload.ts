import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('filesystem', {
  feedback: {
    export: (fileName: string, object: object) =>
      ipcRenderer.invoke('EXPORT', fileName, object),
  },
});
