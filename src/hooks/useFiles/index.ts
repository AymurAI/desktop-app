import { useContext, useCallback } from 'react';

import Context from 'context/File';
import addFilesToState from './addFiles';
import removeFileFromState from './removeFile';
import toggleFromState from './toggleSelected';
import filterUnselectedFromState from './filterUnselected';
import checkPrediction from './isPredictionCompleted';
import replaceFileFromState from './replaceFile';
import addPredictionToState from './addPrediction';
import removeAllPredictionsFromState from './removeAllPredictions';
import removePredictionFromState from './removePrediction';
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

  const isPredictionCompleted = useCallback(
    () => checkPrediction(files),
    [files]
  );

  const addPrediction = (fileName: string, predictions: PredictLabel[]) =>
    setFiles((current) => addPredictionToState(fileName, predictions, current));

    const removeAllPredictions = () =>
    setFiles(removeAllPredictionsFromState(files));

  const removePrediction = (fileName: string) =>
    setFiles(removePredictionFromState(fileName, files));

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
    removeAllPredictions,
    removePrediction
  };
}
