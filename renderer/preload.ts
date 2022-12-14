import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('filesystem', {
  feedback: {
    export: () => {},
  },
});
