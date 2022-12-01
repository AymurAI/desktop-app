import { useContext } from 'react';

import Context from 'context/File';
import addFilesToState from './addFiles';
import removeFileFromState from './removeFile';
import toggleFromState from './toggleSelected';
import filterUnselectedFromState from './filterUnselected';
import replaceFileFromState from './replaceFile';

export default function useFiles() {
  const { files, setFiles } = useContext(Context);

  const addFiles = (newFiles: File[]) =>
    setFiles(addFilesToState(newFiles, files));

  const removeFiles = (fileName: string) =>
    setFiles(removeFileFromState(fileName, files));

  const removeAllFiles = () => setFiles([]);

  const replaceFile = (fileName: string, newFile: File) =>
    setFiles(replaceFileFromState(fileName, newFile, files));

  const toggleSelected = (fileName: string) =>
    setFiles(toggleFromState(fileName, files));

  const filterUnselected = () => setFiles(filterUnselectedFromState(files));

  return {
    files,
    addFiles,
    removeFiles,
    removeAllFiles,
    toggleSelected,
    filterUnselected,
  };
}
