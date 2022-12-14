import { URL } from 'url';

import { PORT } from '../env';

/**
 * Retrieves the HMTL path to the requested file
 * @param fileName Name of the file, default to `index.html`
 * @returns An HTML path to the file, wether on the file system or the web
 */
export default function resolveHTMLPath() {
  const url = new URL(`http://localhost:${PORT}`);

  return url.href;
}
