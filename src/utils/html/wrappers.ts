import { MappedPrediction } from 'services/aymurai/groupPredictions';
import { hash } from './hashWord';

/**
 * Creates a new `HTMLElement` wrapping the values so it can be rendered in the UI.
 * @param tag The tag to be rendered.
 * @param word The word to be rendered.
 * @param index The index of the word in the initial paragraph.
 * @returns A new `HTMLElement` with the tag and the word. Only used to render the search results.
 */
export const searchWrapper = ({ text, tag, index }: MappedPrediction) => {
  const element = document.createElement('mark');
  const hasTag = tag.length > 0;

  element.className = 'searched-word';
  element.innerHTML = `
    <span>${text}</span>
    
    ${
      hasTag
        ? `
        <strong>${tag}</strong>
        <button class="add-tag" data-text="${text}" data-tag="${hash(
            tag
          )}" data-i="${index}">+</button>`
        : ''
    }
  `;

  return element;
};

type AnonymizerArgs = {
  pred: MappedPrediction;
  anonymizing: boolean;
};
/**
 * Creates a new `HTMLElement` wrapping the values so it can be rendered in the UI.
 * @param anonymizing Should the wrapper render the final tag or just show the preview?
 * @param tag The tag to be rendered.
 * @param word The word to be rendered.
 * @param index The index of the word in the initial paragraph.
 * @returns A new `HTMLElement` with the tag and the word, `mark` or `strong` depending on the `anonymizing` value.
 */
export const anonymizeWrapper = ({ anonymizing, pred }: AnonymizerArgs) => {
  const { tag, text: word, index } = pred;
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
      <button class="remove-tag" data-text="${word}" data-tag="${hash(
      tag
    )}" data-i="${index}">X</button>
    `;
  }

  return element;
};
