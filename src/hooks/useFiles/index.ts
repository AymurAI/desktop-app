import { useContext } from 'react';

import Context from 'context/File';
import addFilesToState from './addFiles';

export default function useFiles() {
  const { files, setFiles } = useContext(Context);

  const addFiles = (newFiles: File[]) =>
    setFiles(addFilesToState(newFiles, files));

  const removeFiles = (fileName: string) =>
    setFiles(removeFileFromState(fileName, files));

  const removeAllFiles = () => setFiles([]);
  return {
    files,
    addFiles,
    removeFiles,
  };
}
