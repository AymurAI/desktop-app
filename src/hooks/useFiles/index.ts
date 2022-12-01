import { useContext } from 'react';

import Context from 'context/File';
import addFilesToState from './addFiles';
import removeFileFromState from './removeFile';
import toggleFromState from './toggleSelected';
import filterUnselectedFromState from './filterUnselected';
import checkPrediction from './isPredictionCompleted';
import replaceFileFromState from './replaceFile';
import addPredictionToState from './addPrediction';
import { PredictLabel } from 'types/predict';

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

  const isPredictionCompleted = () => checkPrediction(files);

  const addPrediction = (fileName: string, predictions: PredictLabel[]) =>
    setFiles(addPredictionToState(fileName, predictions, files));

  return {
    files,
    addFiles,
    removeFiles,
    removeAllFiles,
    toggleSelected,
    filterUnselected,
    isPredictionCompleted,
    replaceFile,
    addPrediction,
  };
}
