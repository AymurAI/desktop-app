import { DocFile } from 'types/file';
import { isAllowed, isAlreadyLoaded } from 'utils/file';

/**
 * Adds an array of `File` to the current files state
 * @param files Files to be added
 * @param state Current files state
 * @returns A new state with the files added
 */
export default function addFiles(files: File[], state: DocFile[]) {
  // Check for whitelisted extensions and already loaded files
  const filtered = files.filter(
    (file) => isAllowed(file) && !isAlreadyLoaded(file.name, state)
  );

  // Add necessary fields to the object
  const newFiles: DocFile[] = filtered.map((file) => ({
    data: file,
    selected: true,
  }));

  return [...state, ...newFiles];
}
