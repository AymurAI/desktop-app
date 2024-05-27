// TODO: implement getParagraphId
// import { getParagraphId } from 'utils/file/getParagraphId';

import * as S from './FileRenderer.styles';

const getParagraphId = (paragraph: string) => {
  void paragraph;
  return window.btoa(Date.now().toString());
};

interface Props {
  children: string[];
}
export default function FileRenderer({ children }: Props) {
  return (
    <div>
      {children.map((text) => {
        const id = getParagraphId(text);
        return <S.Paragraph {...{ id, key: id }}>{text}</S.Paragraph>;
      })}
    </div>
  );
}
