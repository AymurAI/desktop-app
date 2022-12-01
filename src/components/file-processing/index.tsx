import { ChangeEventHandler, useRef } from 'react';

import { HiddenInput, Stack } from 'components';
import Button from './Button';
import ProgressBar from './ProgressBar';
import { useFiles, usePredict } from 'hooks';

interface Props {
  file: File;
}
export default function FileProcessing({ file }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { progress, status, abort } = usePredict(file);
  const { replaceFile } = useFiles();

  const handleOpenFinder = () => {
    inputRef.current?.click();
  };

  const handleAddedFile: ChangeEventHandler<HTMLInputElement> = (e) => {
    const rawFiles = e.target.files;

    // Check if any file was added
    if (rawFiles) {
      const files = Array.from(rawFiles);

      // Only one file can be used to replace the old one
      if (files.length > 0) {
        replaceFile(file.name, files[0]);
      }
    }
  };

  return (
    <Stack align="center" spacing="m" css={{ width: '100%' }}>
      <HiddenInput
        multiple={false}
        css={{ position: 'absolute' }}
        ref={inputRef}
        onChange={handleAddedFile}
      />
      <ProgressBar
        status={status}
        fileName={file.name}
        progress={Math.floor(progress * 100)}
      />
      <Button status={status} onStop={abort} onReplace={handleOpenFinder} />
    </Stack>
  );
}
