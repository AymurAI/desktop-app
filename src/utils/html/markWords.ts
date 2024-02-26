import regex from 'utils/regex';
import { hash } from './hashWord';
import { markWrapper, replaceWords, wrapperFromString } from './replaceWords';

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
  words: string[],
  tags: any[],
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

  const wrapper = wrapperFromString((word) => {
    const tag = getTag(tags, word);

    return anonymize
      ? `<strong>&lt;${tag}&gt;</strong>`
      : `<mark class="predicted-word">
          <span>${word}</span>
          <strong>${tag}</strong>
          <button class="remove-tag" id="${hash(word)}">X</button>
        </mark>`;
  });

  const replacedHTML = replaceWords({
    html,
    words: removeDuplicated(words),
    wrapper,
  });

  return headerImg + headerBody + replacedHTML;
}

function getTag(tags: any, word: string) {
  const tag = tags.find((data: any) => data.text === word);

  return tag?.tag;
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
