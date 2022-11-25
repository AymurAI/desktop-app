import { useContext } from 'react';

import Context from 'context/File';
import { getExtension } from 'utils/file';

/**
 * Works as an interface for the `FileContext`, providing functionalities to add or remove files
 * @returns List of `Files[]` with _add_, _remove_ and _removeAll_ functions
 */
export default function useFiles() {
  const { files, setFiles } = useContext(Context);

  const addFiles = (newFiles: File[]) => {
    const ALLOWED_EXT = ['doc', 'docx'];

    // Check for whitelisted extensions
    const filtered = newFiles.filter(
      (file) => !!ALLOWED_EXT.find((ext) => ext === getExtension(file))
    );

    setFiles([...files, ...filtered]);
  };

  const removeFiles = (fileName: string) => {
    const filtered = files.filter((file) => file.name !== fileName);

    setFiles(filtered);
  };
  const removeAllFiles = () => setFiles([]);

  return { files, addFiles, removeFiles, removeAllFiles };
}
