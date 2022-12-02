import { DocFile } from 'types/file';

/**
 * Removes all the predictions made by the AI on the state
 * @param state Current files state
 * @returns A new array with the predictions removed
 */
export default function removeAllPredictions(state: DocFile[]) {
  const removed = state.map(({ data, selected }) => ({
    data,
    selected,
    predictions: undefined,
  }));

  return removed;
}
