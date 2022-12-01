import { DocFile } from 'types/file';

/**
 * Checks if the prediction process is completed
 * @param state Current files state
 * @returns `true` if the prediction process is completed, `false` otherwise
 */
export default function isPredictionCompleted(state: DocFile[]) {
  // If we find any file with no predictions, return false
  const uncompleted = state.find((file) => !file.predictions);

  return !uncompleted;
}
