import { useState } from 'react';

import { getParagraphId } from 'utils/file/getParagraphId';
import { SearchBar } from './SearchBar';

import * as S from './FileAnnotator.styles';
import { generateSplits } from './generateSplits';
import { Mark } from './Mark';
import { Annotation } from './types';
import { DocFile } from 'types/file';
import AnnotationProvider from 'context/Annotation';
import { createAnnotationsWithSearch } from './annotations';
import { SelectOption } from 'components/select';
import { AllLabels } from 'types/aymurai';

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
  file: DocFile;
  isAnnotable?: boolean;
}
export default function FileAnnotator({ file, isAnnotable = false }: Props) {
  const [search, setSearch] = useState('');
  const [searchTag, setSearchTag] = useState<AllLabels | null>(null);

  const paragraphs = file.paragraphs!;

  const selectChangeHandler = (option?: SelectOption) => {
    // We're sure the option is an AllLabels enum.
    // Check the type following the SearchBar component
    setSearchTag((option?.id as AllLabels) ?? null);
  };

  return (
    <S.Container>
      <S.SearchContainer>
        <SearchBar
          onChange={setSearch}
          onSelectChange={selectChangeHandler}
          isAnnotable={isAnnotable}
        ></SearchBar>
      </S.SearchContainer>
      <S.File>
        <AnnotationProvider {...{ file, isAnnotable, searchTag }}>
          {paragraphs.map((text) => {
            const id = getParagraphId(text);

            const annotations = createAnnotationsWithSearch(
              file.predictions ?? [],
              search,
              text,
              searchTag
            );
            return (
              <Paragraph {...{ key: id, id, annotations }}>{text}</Paragraph>
            );
          })}
        </AnnotationProvider>
      </S.File>
    </S.Container>
  );
}
