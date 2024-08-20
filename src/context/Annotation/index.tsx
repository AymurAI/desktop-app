import { useFileDispatch } from 'hooks';
import { createContext, ReactNode, useCallback, useContext } from 'react';
import { appendPrediction, removePrediction } from 'reducers/file/actions';
import { AllLabels, AllLabelsWithSufix, PredictLabel } from 'types/aymurai';
import { DocFile } from 'types/file';
import {
  getBoundaries,
  isValidNode,
  paragraphIdFromSelection,
  selectionHasNodes,
} from './utils';

interface AnnotationContextValues {
  isAnnotable: boolean;
  add: (prediction: PredictLabel) => void;
  remove: (prediction: PredictLabel) => void;
}

/**
 * Provides the token received through OAuth2 login to the whole app
 */
export const AnnotationContext = createContext<AnnotationContextValues>({
  isAnnotable: false,
  add: () => {},
  remove: () => {},
});
AnnotationContext.displayName = 'AnnotationContext';

interface Props {
  children?: ReactNode;
  file: DocFile;
  isAnnotable?: boolean;
  searchTag: AllLabels | AllLabelsWithSufix | null;
}
export default function AnnotationProvider({
  children,
  file,
  isAnnotable = false,
  searchTag,
}: Props) {
  const dispatch = useFileDispatch();

  const add = useCallback(
    (prediction: PredictLabel) => {
      dispatch(appendPrediction(file.data.name, prediction));
    },
    [dispatch, file.data.name]
  );

  const remove = useCallback(
    (prediction: PredictLabel) => {
      dispatch(removePrediction(file.data.name, prediction));
    },
    [dispatch, file.data.name]
  );

  const selectHandler = () => {
    // If the user hasn't selected any tag to search, do nothing
    if (!searchTag) return;

    const selection = window.getSelection();
    if (!selection || selection.type !== 'Range') return;
    const text = selection.getRangeAt(0).toString();

    if (selectionHasNodes(selection)) return;
    const node = selection.anchorNode;

    if (!isValidNode(node)) return;
    const span = node.parentElement as HTMLSpanElement;

    const offset = Number(
      span.attributes.getNamedItem('data-start')?.value ?? 0
    );
    const [start, end] = getBoundaries(selection);

    const aymurayLabel: AllLabels | AllLabelsWithSufix = searchTag;

    add({
      start_char: start + offset,
      end_char: end + offset,
      paragraphId: paragraphIdFromSelection(selection),
      text,
      attrs: {
        aymurai_label: aymurayLabel,
        aymurai_label_subclass: null,
        aymurai_alt_text: null,
        aymurai_alt_start_char: start + offset,
        aymurai_alt_end_char: end + offset,
      },
    });
  };

  return (
    <AnnotationContext.Provider value={{ isAnnotable, add, remove }}>
      <div onClick={selectHandler}>{children}</div>
    </AnnotationContext.Provider>
  );
}

export const useAnnotation = () => {
  const { add, remove, isAnnotable } = useContext(AnnotationContext);

  return { add, remove, isAnnotable };
};
