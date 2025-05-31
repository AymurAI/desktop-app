import type { PredictStatus } from "@/hooks/usePredict";
import type { DocFile } from "@/types/file";

type ProcessState = { name: string; status: PredictStatus };
/**
 * Creates the initial state for the `/process` page
 * @param files `DocFile[]` state
 * @returns An `ProcessState[]` array containing the name of each file and its processing state
 */
export function initProcessState(files: DocFile[]): ProcessState[] {
  return files.map(({ data }) => ({ name: data.name, status: "processing" }));
}

/**
 * Checks if the prediction process is completed
 * @param state Current files state
 * @returns `true` if the prediction process is completed, `false` otherwise
 */
export function isPredictionCompleted(state: ProcessState[]) {
  return !state.some(({ status }) => status === "processing");
}

export function canContinue(state: ProcessState[]) {
  const atLeastOneCompleted = state.some(
    ({ status }) => status === "completed",
  );
  const hasFinishedProcessing = !state.some(
    ({ status }) => status === "processing",
  );

  return hasFinishedProcessing && atLeastOneCompleted;
}

/**
 * Updates the status of a file in the state
 * @param name Name of the file to be updated
 * @param newValue New `PredictStatus` value to be updated
 * @param state `ProcessState[]` state in `/process` page
 * @returns A new array with the status of the given file changed
 */
export function replace(
  name: string,
  value: Partial<ProcessState>,
  state: ProcessState[],
) {
  return state.map((process) => {
    if (process.name === name) return { ...process, ...value };
    return process;
  });
}
