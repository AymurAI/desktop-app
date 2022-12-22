import { App } from 'electron';
import path from 'path';

import { URI_SCHEME } from './env';

/**
 * Sets the uri scheme to handle default protocol
 */
export function setDefaultProtocol(app: App) {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(URI_SCHEME, process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient(URI_SCHEME);
  }
}
