import findAndReplaceDOMText from 'findandreplacedomtext';

interface ReplacerArgs {
  html: string;
  words: string[] | RegExp[];
  wrapper: (word: string, dom: Document) => HTMLElement;
}
/**
 *
 * @param html HTML string value to be parsed.
 * @param words Array of words that are going to be replaced in the HTML string. The words can be a string or a regular expression.
 * @param wrapper Function that receives the word to be replaced and the virtual DOM, and returns a new HTML element.
 * The virtual DOM is used to create new elements, so the new elements are not attached to the real DOM.
 * @returns A new HTML string with the words replaced by the wrapper function.
 * @example
 *
 * ```
 * const html = replaceWords({
 *   html: '...',
 *   words: [...],
 *   wrapper: (word, dom) => {
 *     const el = dom.createElement('p');
 *     el.innerText = word;
 *     return el;
 *   }
 * })
 * ```
 */
export const replaceWords = ({
  html,
  words,
  wrapper,
}: ReplacerArgs): string => {
  const virtualDOM = new DOMParser().parseFromString(html, 'text/html');

  words.forEach((word) => {
    if (word === ':' || word === ';' || word === '=') return;

    findAndReplaceDOMText(virtualDOM.body, {
      find: word,
      replace: (portion) => wrapper(portion.text, virtualDOM),
    });
  });

  return virtualDOM.body.innerHTML;
};
