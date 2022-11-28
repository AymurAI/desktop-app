import { useContext } from 'react';

import Context from 'context/File';
import { isFileAllowed, toggleSelected as toggle } from 'utils/file';
import { DocFile } from 'types/file';

/**
 * Works as an interface for the `FileContext`, providing functionalities to add or remove files
 * @returns List of `Files[]` with _add_, _remove_ and _removeAll_ functions
 */
export default function useFiles() {
  const { files, setFiles } = useContext(Context);

  const addFiles = (newFiles: File[]) => {
    // Check for whitelisted extensions
    const filtered = newFiles.filter(isFileAllowed);

    // Add the 'selected' field
    const selected: DocFile[] = filtered.map((file) => ({
      data: file,
      selected: true,
    }));

    setFiles([...files, ...selected]);
  };

  const removeFile = (fileName: string) => {
    const filtered = files.filter((file) => file.data.name !== fileName);

    setFiles(filtered);
  };
  const removeAllFiles = () => setFiles([]);

  const toggleSelected = (fileName: string) => {
    const toggledArray = files.map((file) => {
      if (file.data.name === fileName) return toggle(file);
      else return file;
    });
    setFiles(toggledArray);
  };

  const filterUnselected = () => {
    const filtered = files.filter((file) => file.selected);
    setFiles(filtered);
  };

  return {
    files,
    addFiles,
    removeFile,
    removeAllFiles,
    toggleSelected,
    filterUnselected,
  };
}
