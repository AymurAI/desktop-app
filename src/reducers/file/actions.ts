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
