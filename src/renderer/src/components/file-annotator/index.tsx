import { useMemo, useState } from "react";

import { SearchBar } from "./SearchBar";

import type { SelectOption } from "@/components/ui/select";
import AnnotationProvider from "@/context/Annotation";
import { HStack } from "@/styled/jsx";
import type { AllLabels, AllLabelsWithSufix } from "@/types/aymurai";
import type { DocFile } from "@/types/file";
import LabelManager from "../anonymizer/label-manager";
import * as S from "./FileAnnotator.styles";
import { Mark } from "./Mark";
import { createAnnotationsWithSearch } from "./annotations";
import { generateSplits } from "./generateSplits";
import type { Annotation } from "./types";

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

        return (
          <Mark key={key} annotation={s}>
            {content}
          </Mark>
        );
      })}
    </S.Paragraph>
  );
};

interface Props {
  file: DocFile;
  isAnnotable?: boolean;
}
export default function FileAnnotator({ file, isAnnotable = false }: Props) {
  const [search, setSearch] = useState("");

  const [labelSearch, setLabelSearch] = useState<AllLabels | null>(null);
  const [sufixlabelSearch, setSufixLabelSearch] = useState<number | null>(0);
  const [labelManagerOpen, setLabelManagerOpen] = useState(false);

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

  const toggleManagerLabel = () => {
    setLabelManagerOpen(!labelManagerOpen);
  };

  return (
    <HStack w="full" h="full" alignItems="unset" overflow="hidden">
      <S.Container>
        <SearchBar
          onSearchChange={setSearch}
          onLabelChange={selectChangeHandler}
          onLabelSufixChange={setSufixLabelSearch}
          onLabelManagerToggle={toggleManagerLabel}
          isAnnotable={isAnnotable}
          isLabelManagerOpen={labelManagerOpen}
        />
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
                searchTag,
              );
              return (
                <Paragraph key={p.id} id={p.id} annotations={annotations}>
                  {p.value}
                </Paragraph>
              );
            })}
          </AnnotationProvider>
        </S.File>
      </S.Container>
      {labelManagerOpen && <LabelManager onClose={toggleManagerLabel} />}
    </HStack>
  );
}
