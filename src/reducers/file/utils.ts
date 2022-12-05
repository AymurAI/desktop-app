import { DocFile } from 'types/file';

/**
 * Util function used along with `filter()` array function to mantain the types
 * @param file File to check
 * @returns `true` if the file is defined, `false` otherwise
 */
function removeUndefined(file: DocFile | undefined): file is DocFile {
  return !!file;
}

type ModifyFunction = (file: DocFile) => DocFile | undefined;
/**
 * Updates/replaces/deletes a file content in the array. The function was created
 * in a way that is not necessary to pass the `state` on every call.
 * @param state Current `DocFile[]` state
 * @param fileName Identifier of the file to replace
 * @param modify Modify function that alters the content of the affected `DocFile`
 * @returns A new function which accepts as parameters `fileName` and `modify`
 */
export function updateFromState(state: DocFile[]) {
  return function (fileName: string, modify: ModifyFunction) {
    // Modify/update the desired file
    const newState = state.map((file) => {
      if (file.data.name === fileName) return modify(file);
      else return file;
    });

    // Remove any `undefined` value inserted into the array
    // This way we can remove a file from the array more easely
    const filtered: DocFile[] = newState.filter(removeUndefined);

    return filtered;
  };
}
