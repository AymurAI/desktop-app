import { DocFile } from 'types/file';

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
  const replaced = state.map((file) =>
    file.data.name === fileName
      ? {
          data: newFile,
          selected: true,
        }
      : file
  );

  return replaced;
}
