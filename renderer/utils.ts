import { URL } from 'url';
import path from 'path';

import { isDebug, PORT } from './env';

/**
 * Retrieves the HMTL path to the requested file
 * @param fileName Name of the file, default to `index.html`
 * @returns An HTML path to the file, wether on the file system or the web
 */
export function resolveHTMLPath(fileName = 'index.html') {
  if (isDebug) {
    const url = new URL(`http://localhost:${PORT}`);

    return url.href;
  } else {
    const pathToFile = path.resolve(__dirname, '../', fileName);
    return `file://${pathToFile}`;
  }
}
