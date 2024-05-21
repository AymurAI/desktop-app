import { PredictLabel } from 'types/aymurai';
import { Annotation } from './types';
import { getParagraphId as id } from 'utils/file/getParagraphId';

/**
 * Converts a predict label to an annotation
 * @param labels List of predict labels from the API
 * @returns List of annotations
 */
export const labelToAnnotation = (labels: PredictLabel[]): Annotation[] => {
  return labels.map(({ start_char, end_char, attrs, paragraphId }) => ({
    start: start_char,
    end: end_char,
    type: 'tag',
    tag: attrs.aymurai_label!,
    paragraphId,
  }));
};

/**
 * Finds the indexes where the search string is found in the paragraph
 * @param paragraph Paragraph to search in
 * @param search Search string
 * @returns List of indexes where the search string is found
 */
const findSearchIndexes = (paragraph: string, search: string) => {
  const indexes = [];
  let index = paragraph.indexOf(search);

  while (index !== -1) {
    indexes.push(index);
    index = paragraph.indexOf(search, index + 1);
  }
  return indexes;
};

/**
 * Appends search annotations to the list of label annotations
 * @param arr List of label annotations
 * @param search Search string
 * @param paragraph Paragraph to search in
 * @returns List of annotations with search annotations appended
 */
export const annotationWithSearch = (
  labels: Annotation[],
  search: string,
  paragraph: string
): Annotation[] => {
  if (!search || search.length < 3) return labels;

  const indexes = findSearchIndexes(paragraph, search);
  const searchAnnotations = indexes.map(
    (el) =>
      ({
        start: el,
        end: el + search.length,
        type: 'search',
        // TODO: remove hardcoding
        tag: 'PERSONA',
        paragraphId: id(paragraph),
      } as Annotation)
  );

  return [...labels, ...searchAnnotations];
};
