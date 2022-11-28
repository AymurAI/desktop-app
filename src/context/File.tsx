import { createContext } from 'react';

import { DocFile } from 'types/file';

type FileContextType = {
  files: DocFile[];
  setFiles: (files: DocFile[]) => void;
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
