import { createContext, Dispatch, SetStateAction } from 'react';

import { DocFile } from 'types/file';

type FileContextType = {
  files: DocFile[];
  setFiles: Dispatch<SetStateAction<DocFile[]>>;
  step: number;
  setStep: Dispatch<SetStateAction<number>>;
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
