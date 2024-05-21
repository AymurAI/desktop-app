import { useState } from 'react';

import { DocumentParagraph, PredictLabel } from 'types/aymurai';
import { getParagraphId } from 'utils/file/getParagraphId';

import * as S from './FileRenderer.styles';
import { generateSplits } from './generateSplits';
import { Mark } from './Mark';
import { annotationWithSearch, labelToAnnotation } from './annotations';
import { Annotation } from './types';

interface ParagraphProps {
  children: string;
  annotations?: Annotation[];
  id: string;
}
const Paragraph = ({ children, annotations = [], id }: ParagraphProps) => {
  const splits = generateSplits(children, annotations);

  return (
    <S.Paragraph id={id}>
      {splits.map((s) => {
        const content = children.slice(s.start, s.end);
        const key = `${s.start}-${s.end}`;

        return <Mark {...{ annotation: s, key }}>{content}</Mark>;
      })}
    </S.Paragraph>
  );
};

interface Props {
  paragraphs: DocumentParagraph[];
  labels?: Map<string, PredictLabel[]>;
}
export default function FileRenderer({ paragraphs, labels }: Props) {
  const [search, setSearch] = useState('');

  return (
    <S.Container>
      {/* TODO: add search bar */}
      <S.File>
        {paragraphs.map((p) => {
          const content = p.plain_text;
          const id = getParagraphId(content);

          const labelAnnotations = labelToAnnotation(labels?.get(id) ?? []);
          const annotations = annotationWithSearch(
            labelAnnotations,
            search,
            content
          );

          return (
            <Paragraph {...{ key: id, id, annotations }}>{content}</Paragraph>
          );
        })}
      </S.File>
    </S.Container>
  );
}
