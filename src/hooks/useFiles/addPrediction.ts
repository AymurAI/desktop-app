import { DocFile } from 'types/file';
import { PredictLabel } from 'types/predict';

/**
 * Appends predictions to the given file
 * @param fileName Name of the file to append predictions
 * @param prediction Prediction to append
 * @param state Current files state
 * @returns A new array with the given file updated
 */
export default function addPrediction(
  fileName: string,
  prediction: PredictLabel[],
  state: DocFile[]
) {
  const newState = state.map((file) => {
    if (file.data.name === fileName) {
      return {
        ...file,
        // Append new predictions to the old ones
        predictions: [...(file.predictions ?? []), ...prediction],
      };
    } else return file;
  });

  return newState;
}
