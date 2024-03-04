import { PredictLabel } from 'types/aymurai';
import { id as getParagraphId } from 'utils/html/addParagraphId';

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
    const text = p.attrs.aymurai_alt_text ?? p.text;
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
