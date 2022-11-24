import { createContext } from 'react';

type FileContextType = {
  files: File[];
  setFiles: (files: File[]) => void;
  step: number;
  setStep: (step: number) => void;
};
/**
 * Context used to provide files that have to be processed and the current processing step
 */
export const FileContext = createContext<FileContextType>({
  files: [],
  setFiles: () => {},
  step: 0,
  setStep: () => {},
});
FileContext.displayName = 'FileContext';

export default FileContext;
