import { useFileParser } from 'hooks';
import { DocFile } from 'types/file';
import { markPredictedWords } from 'utils/html';

import Container from './FileContainer.styles';

interface Props {
  file: DocFile;
}
export default function FileContainer({ file }: Props) {
  const predictions = file.predictions!.map((label) => label.text);

  const html = useFileParser(file.data, (html) =>
    markPredictedWords(html, predictions)
  );

  return (
    <Container dangerouslySetInnerHTML={{ __html: html ?? '' }}></Container>
  );
}
