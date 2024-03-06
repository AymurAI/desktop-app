import regex from 'utils/regex';
import { markWrapper, recursiveReplace, replaceWords } from './replaceWords';
import { groupPredictions } from 'services/aymurai';

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

function searched(html: string | null, word: string) {
  if (!html) return '';
  if (word.length <= 2) return html;

  const regExp = regex.includes(word);

  return replaceWords({
    html,
    words: [regExp],
    wrapper: markWrapper('searched-word'),
  });
}

const mark = {
  predicted,
  anonymizer,
  searched,
};

export default mark;
