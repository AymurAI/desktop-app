import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('filesystem', {
  feedback: {
    export: (fileName: string, object: object) =>
      ipcRenderer.invoke('EXPORT_FEEDBACK', fileName, object),
  },
});

contextBridge.exposeInMainWorld('oauth', {
  getCodeChallenge: () => ipcRenderer.invoke('GET_CODE_CHALLENGE'),
});
