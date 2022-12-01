import { useFileParser } from 'hooks';

import Container from './FileContainer.styles';

interface Props {
  data: File;
}
export default function FileContainer({ data }: Props) {
  const html = useFileParser(data);

  return (
    <Container dangerouslySetInnerHTML={{ __html: html ?? '' }}></Container>
  );
}
