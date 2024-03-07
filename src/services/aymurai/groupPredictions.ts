import { PredictLabel } from 'types/aymurai';
import { id as getParagraphId } from 'utils/html/addParagraphId';

/**
 * Generates the id for each paragraph based on the text and creates a map to easily get the initial paragraph text.
 * @param html HTML content to be analyzed. Should be the initial HTML content of the document.
 * @returns A map with the paragraph id as key and the paragraph text as value
 */
export const groupParagraphs = (html: string): Map<string, string> => {
  const map = new Map<string, string>();

  // Uses a virtual DOM to get each paragraph
  const dom = new DOMParser().parseFromString(html, 'text/html');
  const elements = Array.from(dom.body.children);

  elements.forEach((el) => {
    if (el instanceof HTMLElement && el.innerText) {
      const id = getParagraphId(el.innerText);
      map.set(id, el.innerText);
    }
  });

  return map;
};

export interface MappedPrediction {
  text: string;
  tag: string;
  index: number;
}
/**
 * Groups the predictions by paragraph and sorts them by index
 * @param predictions AymurAI response array
 * @returns A map with the paragraph id as key and an array of predictions as value
 */
export const groupPredictions = (predictions: PredictLabel[] | undefined) => {
  const map = new Map<string, MappedPrediction[]>();
  if (!predictions) return map;

  predictions.forEach((p) => {
    const text = p.text ?? p.attrs.aymurai_alt_text;
    const tag = p.attrs.aymurai_label;
    const index = p.start_char;

    const id = getParagraphId(p.paragraph);
    const label = { text, tag, index };

    if (map.has(id)) {
      map.get(id)!.push(label);
    } else {
      map.set(id, [label]);
    }
  });

  // TODO: si dos index son iguales, se deberia renderizar uno
  map.forEach((value, key) => {
    if (value.length > 1)
      map.set(
        key,
        value.sort((a, b) => a.index - b.index)
      );
  });

  return map;
};

export type GroupedPredictions = ReturnType<typeof groupPredictions>;
