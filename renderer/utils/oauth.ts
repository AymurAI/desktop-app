import { mainWindow } from '../createWindow';
import { URI_SCHEME } from '../env';

/**
 * Retrieves the auth_code received from the Google OAuth2 consent screen and sends it to the React App
 * @param url URL containing the URI_SCHEME and the auth_code
 */
export function sendCodeToApp(url: URL) {
  const authCode = url.searchParams.get('code');

  if (mainWindow) mainWindow.webContents.send('AUTH_CODE_RECEIVED', authCode);
}

/**
 * Retrieves the URL from the argv array and sends the auth_code to the React App
 * @param argv Arguments from the `second-instance` app event
 */
export function parseArgv(argv: string[]) {
  // We search the part containing the URI_SCHEME
  const href = argv.find((key) => key.includes(`${URI_SCHEME}:`));

  if (href) sendCodeToApp(new URL(href));
  else throw new Error('URI_SCHEME not found in argv!');
}
