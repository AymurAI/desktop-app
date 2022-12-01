import { useContext } from 'react';

import Context from 'context/File';

export default function useFiles() {
  const { files, setFiles } = useContext(Context);


  return {
    files,
  };
}
