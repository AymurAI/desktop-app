/**
 * List of action types.
 */
export enum ActionTypes {
  ADD = 'ADD',
  ADD_PREDICTIONS = 'ADD_PREDICTIONS',
  ADD_PARSED_HTML = 'ADD_PARSED_HTML',
  FILTER_UNSELECTED = 'FILTER_UNSELECTED',
  TOGGLE_SELECTED = 'TOGGLE_SELECTED',
  REMOVE_ALL_PREDICTIONS = 'REMOVE_ALL_PREDICTIONS',
  REMOVE_PREDICTIONS = 'REMOVE_PREDICTIONS',
  REMOVE_ALL_FILES = 'REMOVE_ALL_FILES',
  REPLACE_FILE = 'REPLACE_FILE',
}

/**
 * Generic action
 */
type Action<Type, Payload = {}> = {
  type: Type;
  payload: Payload;
};

export type ToggleSelectedAction = Action<
  ActionTypes.TOGGLE_SELECTED,
  { fileName: string }
>;
/**
 * Toggles the `selected` property of the given file
 * @param fileName Name of the file to be toggled
 */
export function toggleSelected(fileName: string): ToggleSelectedAction {
  return {
    type: ActionTypes.TOGGLE_SELECTED,
    payload: { fileName },
  };
}

export type RemoveAllPredictionsAction =
  Action<ActionTypes.REMOVE_ALL_PREDICTIONS>;
/**
 * Removes all the predictions for all the files in the state
 */
export function removeAllPredictions(): RemoveAllPredictionsAction {
  return {
    type: ActionTypes.REMOVE_ALL_PREDICTIONS,
    payload: {},
  };
}

export type FilterUnselectedAction = Action<ActionTypes.FILTER_UNSELECTED>;
/**
 * Removes files from the state whose `selected` property is set on `false`
 */
export function filterUnselected(): FilterUnselectedAction {
  return {
    type: ActionTypes.FILTER_UNSELECTED,
    payload: {},
  };
}

export type AddFilesAction = Action<ActionTypes.ADD, { newFiles: File[] }>;
/**
 * Adds a new set of `File[]` to the end of the state
 * @param newFiles `File[]` to be added to the state
 */
export function addFiles(newFiles: File[]): AddFilesAction {
  return {
    type: ActionTypes.ADD,
    payload: { newFiles },
  };
}

export type RemoveAllFilesAction = Action<ActionTypes.REMOVE_ALL_FILES>;
/**
 * Removes all the files from the state
 */
export function removeAllFiles(): RemoveAllFilesAction {
  return {
    type: ActionTypes.REMOVE_ALL_FILES,
    payload: {},
  };
}

export type ReplaceFileAction = Action<
  ActionTypes.REPLACE_FILE,
  { fileName: string; file: File }
>;
/**
 * Replaces a file data with the given `fileName`
 */
export function replaceFile(fileName: string, file: File): ReplaceFileAction {
  return {
    type: ActionTypes.REPLACE_FILE,
    payload: { fileName, file },
  };
}
