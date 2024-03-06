import findAndReplaceDOMText from 'findandreplacedomtext';
import { MappedPrediction } from 'services/aymurai/groupPredictions';
import { anonymizeWrapper } from './wrappers';

const MARK_ELEMENT = 'MARK';

/**
 * Counts the offset of the node in relation to its siblings and sums it to the initial value, if provided.
 * @param node Node to start counting the offset.
 * @param init Initial offset value.
 * @returns The offset of the node in relation to its siblings.
 */
export const countSiblingOffset = (
  node: HTMLElement | Text,
  init: number = 0
) => {
  let offset = init;
  let sibling = node.previousSibling;

  while (sibling) {
    let text: string | null;
    if (sibling instanceof HTMLElement && sibling.tagName === MARK_ELEMENT) {
      // Uses the <span> first child to get the text
      const child = sibling.firstElementChild as HTMLElement;
      text = child.textContent;
    } else {
      text = sibling.textContent;
    }

    offset += text?.length ?? 0;
    sibling = sibling.previousSibling;
  }

  return offset;
};

/**
 * Checks if the word is present in the Text node and counts the offset of
 * the text node in relation to its siblings.
 * @param node Text node to use its text and siblings to calculate the offset.
 * @param pred Prediction tag to find in the text node.
 * @returns `true` if the replace should be done, `false` otherwise.
 */
const shouldReplace = (node: Text, pred: MappedPrediction) => {
  const text = node.textContent!;
  const found = text.includes(pred.text);
  const startIndex = pred.index - countSiblingOffset(node);

  return found && startIndex >= 0 && startIndex <= text.length;
};

/**
 * Creates a fragment that will be later used to replace the text node.
 * @param element Element to replace or edit.
 * @param pred Prediction information used to make the replacement.
 * @param anonymize If the replacement should be prepared to make the output document.
 * @returns A new fragment with the replaced text.
 */
const replace = (element: Text, pred: MappedPrediction, anonymize: boolean) => {
  const fragment = document.createDocumentFragment();

  // The start index is calculated by substracting the index on the original
  // paragraph (AI prediction) with the real offset of the text node (node.previousSibling loop)
  const start = pred.index - countSiblingOffset(element);
  const first = element.textContent!.slice(0, start);
  const last = element.textContent!.slice(start + pred.text.length);

  console.log(element.textContent, start, start + pred.text.length);

  fragment.append(first ?? '');
  // TODO: accept a wrapper as a parameter to be able to change the mark element
  fragment.appendChild(anonymizeWrapper({ anonymizing: anonymize, pred }));
  fragment.append(last ?? '');

  return fragment;
};

/**
 * Recursively replaces the text nodes with the predictions.
 * @param node Node to start the replacement.
 * @param pred Prediction tag to find in the text node.
 * @param anonymize If the replacement should be prepared to make the output document.
 */
export const recursiveReplace = (
  node: HTMLElement | Text,
  pred: MappedPrediction,
  anonymize: boolean
) => {
  const children = Array.from(node.childNodes);

  for (const child of children) {
    if (child instanceof Text && child.textContent) {
      if (shouldReplace(child, pred)) {
        const parent = child.parentElement!;
        parent.appendChild(replace(child, pred, anonymize));
        parent.removeChild(child);
        return;
      }
    } else if (child instanceof HTMLElement && child.tagName !== MARK_ELEMENT) {
      recursiveReplace(child, pred, anonymize);
    } else continue;
  }
};

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
    if (word === ':' || word === ';' || word === '=' || word === ' ') return;

    findAndReplaceDOMText(virtualDOM.body, {
      find: word,
      replace: (portion) => wrapper(portion.text, virtualDOM),
    });
  });

  return virtualDOM.body.innerHTML;
};
