import { useEffect, useRef } from 'react';

import { Checkbox, Text } from 'components';
import { insertIntoHTML } from 'utils/file';
import { FileContainer, Wrapper } from './FilePreview.styles';
import { DocFile } from 'types/file';
import { useFiles } from 'hooks';

interface Props {
  file: DocFile;
}

export default function FilePreview({ file }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { toggleSelected } = useFiles();

  // Converts the doc/docx file and inserts it into a `<div>`
  useEffect(() => {
    if (containerRef.current) {
      insertIntoHTML(file.data, containerRef.current);
    }
  }, [file]);

  return (
    <Wrapper>
      <Checkbox
        css={{ position: 'absolute', top: '$s', right: '$s' }}
        checked={file.selected}
        onChange={() => toggleSelected(file.data.name)}
      ></Checkbox>
      <FileContainer ref={containerRef} />
      <Text size="sm">{file.data.name}</Text>
    </Wrapper>
  );
}
