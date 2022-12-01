import { Checkbox, Text } from 'components';
import { FileContainer, Wrapper } from './FilePreview.styles';
import { DocFile } from 'types/file';
import { useFileParser, useFiles } from 'hooks';

interface Props {
  file: DocFile;
}

export default function FilePreview({ file }: Props) {
  const { toggleSelected } = useFiles();
  // Converts the doc/docx file into HTML that can be inserted into a `<div>`
  const html = useFileParser(file.data);

  return (
    <Wrapper>
      <Checkbox
        css={{ position: 'absolute', top: '$s', right: '$s' }}
        checked={file.selected}
        onChange={() => toggleSelected(file.data.name)}
      ></Checkbox>
      <FileContainer dangerouslySetInnerHTML={{ __html: html ?? '' }} />
      <Text size="sm">{file.data.name}</Text>
    </Wrapper>
  );
}
