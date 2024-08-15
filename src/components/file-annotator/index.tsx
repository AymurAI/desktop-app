import { useMemo, useState } from 'react';

import { SearchBar } from './SearchBar';

import { SelectOption } from 'components/select';
import AnnotationProvider from 'context/Annotation';
import { AllLabels, AllLabelsWithSufix } from 'types/aymurai';
import { DocFile } from 'types/file';
import { createAnnotationsWithSearch } from './annotations';
import * as S from './FileAnnotator.styles';
import { generateSplits } from './generateSplits';
import { Mark } from './Mark';
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
  file: DocFile;
  isAnnotable?: boolean;
}
export default function FileAnnotator({ file, isAnnotable = false }: Props) {
  const [search, setSearch] = useState('');

  const [labelSearch, setLabelSearch] = useState<AllLabels | null>(null);
  const [sufixlabelSearch, setSufixLabelSearch] = useState<number | null>(0);

  const searchTag = useMemo<AllLabels | AllLabelsWithSufix | null>(() => {
    return labelSearch
      ? sufixlabelSearch
        ? `${labelSearch}_${sufixlabelSearch}`
        : labelSearch
      : null;
  }, [labelSearch, sufixlabelSearch]);

  const paragraphs = file.paragraphs!;

  const selectChangeHandler = (option?: SelectOption) => {
    // We're sure the option is an AllLabels enum.
    // Check the type following the SearchBar component
    setLabelSearch((option?.id as AllLabels) ?? null);
  };

  return (
    <S.Container>
      <S.SearchContainer>
        <SearchBar
          onSearchChange={setSearch}
          onLabelChange={selectChangeHandler}
          onLabelSufixChange={setSufixLabelSearch}
          isAnnotable={isAnnotable}
        ></SearchBar>
      </S.SearchContainer>
      <S.File>
        <AnnotationProvider
          {...{
            file,
            isAnnotable,
            searchTag,
          }}
        >
          {paragraphs.map((p) => {
            const annotations = createAnnotationsWithSearch(
              file.predictions ?? [],
              search,
              p,
              searchTag
            );
            return (
              <Paragraph {...{ key: p.id, id: p.id, annotations }}>
                {p.value}
              </Paragraph>
            );
          })}
        </AnnotationProvider>
      </S.File>
    </S.Container>
  );
}
