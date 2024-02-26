import findAndReplaceDOMText from 'findandreplacedomtext';

/**
 * Wraps a word with a mark element, adding a class to it.
 * @param className Class name to be added to the mark element.
 * @returns `HTMLElement`.
 */
export const markWrapper =
  (className: string) => (word: string, dom: Document) => {
    const el = dom.createElement('mark');
    el.classList.add(className);
    el.innerText = word;
    return el;
  };

/**
 * Wraps a word with a generic HTML element.
 * @param html A function that receives a word that should be inserted in the 'template'.
 * @returns `HTMLElement`.
 */
export const wrapperFromString =
  (html: (word: string) => string) => (word: string, dom: Document) => {
    const el = dom.createElement('div');
    el.innerHTML = html(word);

    // Return the first child, because the div wrapper is not needed.
    return el.children[0] as HTMLElement;
  };

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
