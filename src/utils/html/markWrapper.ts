import { hash } from './hashWord';

type AnonymizerArgs = {
  tag: string;
  word?: string;
  anonymizing: boolean;
};
/**
 * Creates a new `HTMLElement` wrapping the values so it can be rendered in the UI.
 * @param anonymizing Should the wrapper render the final tag or just show the preview?
 * @param tag The tag to be rendered.
 * @param word The word to be rendered.
 * @returns A new `HTMLElement` with the tag and the word, `mark` or `strong` depending on the `anonymizing` value.
 */
export const anonymizeWrapper = ({
  anonymizing,
  tag,
  word,
}: AnonymizerArgs) => {
  let element: HTMLElement;

  if (anonymizing) {
    element = document.createElement('strong');
    element.innerText = `<${tag}>`;
  } else {
    element = document.createElement('mark');
    element.className = 'predicted-word';
    element.innerHTML = `
      <span>${word}</span>
      <strong>${tag}</strong>
      <button class="remove-tag" id="${hash(word!)}">X</button>
    `;
  }

  return element;
};
