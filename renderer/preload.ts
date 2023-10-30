import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('filesystem', {
  feedback: {
    export: (fileName: string, object: object) =>
      ipcRenderer.invoke('EXPORT_FEEDBACK', fileName, object),
  },
  excel: {
    read: () => ipcRenderer.invoke('EXCEL_READ'),
    write: (buffer: Buffer) => ipcRenderer.invoke('EXCEL_WRITE', buffer),
    open: () => ipcRenderer.invoke('EXCEL_OPEN'),
  },
});

type OnceAuthCodeReceived = (authCode: string) => void;
contextBridge.exposeInMainWorld('oauth', {
  // Get challenge code
  getChallengeCode: () => ipcRenderer.invoke('GET_CHALLENGE_CODE'),
  // Get verifier code
  getVerifierCode: () => ipcRenderer.invoke('GET_VERIFIER_CODE'),
  // Get verifier code
  onceAuthCodeReceived: (callback: OnceAuthCodeReceived) =>
    ipcRenderer.once('AUTH_CODE_RECEIVED', (_, authCode) => callback(authCode)),
});

contextBridge.exposeInMainWorld('taskbar', {
  notify: () => ipcRenderer.invoke('TASKBAR_NOTIFY'),
});
