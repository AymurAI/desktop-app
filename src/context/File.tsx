import { createContext } from 'react';

type FileContextType = {
  files: File[];
  setFiles: (files: File[]) => void;
  nextStep: () => void;
  previousStep: () => void;
};
/**
 * Context used to provide files that have to be processed and the current processing step
 */
export const FileContext = createContext<FileContextType>({
  files: [],
  setFiles: () => {},
  nextStep: () => {},
  previousStep: () => {},
});
FileContext.displayName = 'FileContext';

export default FileContext;
