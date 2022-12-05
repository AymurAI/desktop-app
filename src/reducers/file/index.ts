import {
  ActionTypes,
  AddFilesAction,
  ToggleSelectedAction,
} from './actions';
import { addFiles, replaceFile, updateFromState } from './utils';

import { DocFile } from 'types/file';

type State = DocFile[];

export type Action =
  | AddFilesAction
  | ToggleSelectedAction

/**
 * Reducer function for `DocFile[]` state
 * @param state Current state
 * @param action Action to perform
 * @returns A new state
 */
export default function reducer(state: State, action: Action): State {
  const { type, payload } = action;

  // Update/replace/delete utility function
  const update = updateFromState(state);

  switch (type) {
    // ----------------
    // ADD
    // ----------------
    case ActionTypes.ADD: {
      const { newFiles } = payload;

      // Performs some checkings on the file
      return addFiles(newFiles, state);
    }
    // ----------------
    // TOGGLE SELECTED
    // ----------------
    case ActionTypes.TOGGLE_SELECTED: {
      const { fileName } = payload;

      return update(fileName, (current) => ({
        ...current,
        selected: !current.selected,
      }));
    }
    default:
      return state;
  }
}
