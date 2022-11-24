import { useContext } from 'react';

import Context from 'context/File';

/**
 * Works as an interface for the `FileContext`, providing functionalities to add or remove files
 * @returns List of `Files[]` with _add_, _remove_ and _removeAll_ functions
 */
export default function useFiles() {
  const { files, setFiles } = useContext(Context);

  const addFiles = (newFiles: File[]) => setFiles([...files, ...newFiles]);
  const removeFiles = (fileName: string) => {
    const filtered = files.filter((file) => file.name !== fileName);

    setFiles(filtered);
  };
  const removeAllFiles = () => setFiles([]);

  return { files, addFiles, removeFiles, removeAllFiles };
}
