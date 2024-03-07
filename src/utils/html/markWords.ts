import {
  countSiblingOffset,
  markWrapper,
  recursiveReplace,
  replaceWords,
} from './replaceWords';
import { groupPredictions } from 'services/aymurai';
import { searchWrapper } from './wrappers';

const virtualDOM = (html: string) =>
  new DOMParser().parseFromString(html, 'text/html');

/**
 * Removes duplicated words from the predictions array
 * @param words Words array, containing all the predictions
 * @returns A reduced words array, with duplicated entries removed
 */
function removeDuplicated(words: string[]) {
  return words.reduce<string[]>((prev, cur) => {
    const isDuplicated = prev.find((t) => t.includes(cur));

    if (isDuplicated) return prev;
    else return [...prev, cur];
  }, []);
}

/**
 * Mark the predicted words with a `<mark>` tag to highlight them
 * @param html HTML content to be analyzed
 * @param words Words to be matched inside the HTML
 * @returns The same HTML but with the given words enclosed in `<mark>` tags
 */
function predicted(html: string, words: string[]) {
  return replaceWords({
    html,
    words: removeDuplicated(words),
    wrapper: markWrapper('predicted-word'),
  });
}

function anonymizer(
  html: string,
  predictions: ReturnType<typeof groupPredictions>,
  anonymize: boolean = false,
  header?: string
) {
  let headerImg = '';
  let headerBody = '';

  if (header) {
    const splitHeader = header
      ?.split('<p>')
      .map((text) => text.replaceAll('</p>', ''));
    headerImg = splitHeader?.find((text) => text.includes('img')) ?? '';
    if (headerImg) {
      headerImg = `<p>${headerImg}</p>`;
    }

    headerBody = splitHeader
      .map((text) => {
        if (!text.includes('img') && text !== '') return `<p>${text}</p>`;

        return '';
      })
      .join('');
  }

  const dom = virtualDOM(html);
  // TODO: agregar funcionalidad para agregar una predicción usando la búsqueda

  // For each prediction, search the corresponding word within the paragraph and tag it
  predictions.forEach((predictions, id) => {
    const paragraphElement = dom.getElementById(id);
    if (!paragraphElement) return;

    predictions.forEach((pred) => {
      recursiveReplace(paragraphElement, pred, anonymize);
    });
  });

  return headerImg + headerBody + dom.body.innerHTML;
}

const createFragment = (
  splitted: string[],
  search: string,
  tag: string | undefined,
  offset: number,
  wholeText: string
) => {
  const fragment = document.createDocumentFragment();
  // TODO: sanitize this regex
  const regex = new RegExp(search, 'g');

  splitted.forEach((el, i) => {
    fragment.append(el);

    if (i !== splitted.length - 1) {
      // Get the index for the word in the current node
      const result = regex.exec(wholeText);
      if (!result) return;

      const index = offset + result.index;
      fragment.appendChild(
        searchWrapper({ text: search, index, tag: tag ?? '' })
      );
    }
  });

  return fragment;
};

function searched(html: string | null, word: string, tag: string | undefined) {
  if (!html) return '';
  if (word.length <= 1) return html;

  const dom = virtualDOM(html);
  const xpath = `.//text()[contains(.,'${word}')]`;

  const result = document.evaluate(
    xpath,
    dom.body,
    null,
    XPathResult.ORDERED_NODE_ITERATOR_TYPE,
    null
  );
  let textNodes: Text[] = [];

  let element = result.iterateNext();

  while (element) {
    textNodes.push(element as Text);
    element = result.iterateNext();
  }

  textNodes.forEach((node) => {
    // If the node is inside a mark element, skip it
    if (node.parentElement?.closest('mark')) return;

    const text = node.textContent ?? '';
    const split = text.split(word);

    // Get the offset of the node, so it can be added to the button
    const siblingOffset = countSiblingOffset(node);
    const fragment = createFragment(split, word, tag, siblingOffset, text);

    node.replaceWith(fragment);
  });

  return dom.body.innerHTML;
}

const mark = {
  predicted,
  anonymizer,
  searched,
};

export default mark;
