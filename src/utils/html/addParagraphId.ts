import { hash } from './hashWord';

/**
 * Generates a string ready to be used as an ID by splitting and hashing the paragraph.
 * @param paragraph Paragraph to be hashed.
 * @returns A `string` representing the hashed paragraph.
 * @deprecated
 */
export const id = (paragraph: string) => {
  const start = paragraph.slice(0, 15);
  const end = paragraph.slice(-15);
  return hash(start + end).slice(0, 30);
};

/**
 * Generates and adds an id to each paragraph (directly <p> descendants) in the HTML string.
 * @param html HTML string.
 * @returns The same HTML string but with paragraph ids.
 * @deprecated
 */
export const addParagraphIds = (html: string) => {
  const dom = new DOMParser().parseFromString(html, 'text/html');
  const elements = Array.from(dom.body.children);

  elements.forEach((el) => {
    if (el instanceof HTMLElement && el.innerText) el.id = id(el.innerText);
  });

  return dom.body.innerHTML;
};

export default addParagraphIds;
