import { PredictStatus } from 'hooks/usePredict';
import { DocFile } from 'types/file';

type ProcessState = { name: string; status: PredictStatus };
/**
 * Creates the initial state for the `/process` page
 * @param files `DocFile[]` state
 * @returns An `ProcessState[]` array containing the name of each file and its processing state
 */
export function initProcessState(files: DocFile[]): ProcessState[] {
  return files.map(({ data }) => ({ name: data.name, status: 'processing' }));
}

/**
 * Checks if the prediction process is completed
 * @param state Current files state
 * @returns `true` if the prediction process is completed, `false` otherwise
 */
export function isPredictionCompleted(state: ProcessState[]) {
  return !state.some((process) => process.status === 'processing');
}

/**
 * Updates the status of a file in the state
 * @param name Name of the file to be updated
 * @param newValue New `PredictStatus` value to be updated
 * @param state `ProcessState[]` state in `/process` page
 * @returns A new array with the status of the given file changed
 */
export function replaceValue(
  name: string,
  newValue: PredictStatus,
  state: ProcessState[]
) {
  return state.map((process) => {
    if (process.name === name) return { ...process, status: newValue };
    else return process;
  });
}
