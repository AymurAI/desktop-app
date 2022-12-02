import { DocFile } from 'types/file';

/**
 * Removes all the predictions made for a single file by the AI on the state
 * @param state Current files state
 * @returns A new array with the predictions removed on the given file
 */
export default function removePrediction(fileName: string, state: DocFile[]) {
  const removed = state.map((file) =>
    file.data.name === fileName
      ? {
          ...file,
          predictions: undefined,
        }
      : file
  );

  return removed;
}
