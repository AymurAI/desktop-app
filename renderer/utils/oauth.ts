import { mainWindow } from '../createWindow';

export function sendCodeToApp(url: URL) {
  const authCode = url.searchParams.get('code');

  if (mainWindow) mainWindow.webContents.send('AUTH_CODE_RECEIVED', authCode);
}
