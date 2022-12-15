import { URL } from 'url';

import { PORT } from '../env';

/**
 * Retrieves the HMTL path to the requested URL
 * @param fileName URL path, default to `index.html`
 * @returns An HTML path to the file
 */
export default function resolveHTMLPath() {
  const url = new URL(`http://localhost:${PORT}`);

  return url.href;
}
