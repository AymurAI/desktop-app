import { DocFile } from 'types/file';
import { isAllowed, isAlreadyLoaded } from 'utils/file';

/**
 * Replaces a file by the given name on the files state
 * @param fileName Name of the file to be replaced
 * @param newFile File to be inserted into the state
 * @param state Current files state
 * @returns A new array containing the file replaced
 */
export default function replaceFile(
  fileName: string,
  newFile: File,
  state: DocFile[]
) {
  if (isAllowed(newFile) && !isAlreadyLoaded(newFile.name, state)) {
    const replaced = state.map((file) =>
      file.data.name === fileName
        ? {
            data: newFile,
            selected: true,
            predictions: undefined,
          }
        : file
    );
    return replaced;
  } else return state;
}
