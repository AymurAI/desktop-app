import { DocFile } from 'types/file';

/**
 * Removes a specific file from the files state
 * @param fileName Name of the file to be removed
 * @param state Current file state
 * @returns A new array with the given file removed
 */
export default function removeFile(fileName: string, state: DocFile[]) {
  const filtered = state.filter((file) => file.data.name !== fileName);

  return filtered;
}
