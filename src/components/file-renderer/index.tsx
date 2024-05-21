import { DocumentParagraph } from 'types/aymurai';
import { randomUUID } from 'crypto';
// TODO: implement getParagraphId
// import { getParagraphId } from 'utils/file/getParagraphId';

import * as S from './FileRenderer.styles';

const getParagraphId = (paragraph: string) => {
  void paragraph;
  return window.btoa(Date.now().toString())
};

interface Props {
  children: DocumentParagraph[];
}
export default function FileRenderer({ children }: Props) {
  return (
    <div>
      {children.map(({ plain_text }) => {
        const id = getParagraphId(plain_text);
        return <S.Paragraph {...{ id, key: id }}>{plain_text}</S.Paragraph>;
      })}
    </div>
  );
}
