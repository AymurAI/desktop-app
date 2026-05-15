import { memo, useEffect, useMemo, useState, useTransition } from "react";

import { SearchBar } from "./SearchBar";

import type { SelectOption } from "@/components/ui/select";
import AnnotationProvider, { useAnnotation } from "@/context/Annotation";
import { useExcludedTagsConfig } from "@/store/useLocal";
import { css } from "@/styled/css";
import { HStack } from "@/styled/jsx";
import type { AllLabels, PredictLabel } from "@/types/aymurai";
import type { DocFile, Paragraph as ParagraphType } from "@/types/file";
import { getActiveAnonymizerLabelOptions } from "@/utils/anonymizer/labels";
import { filterActivePredictions } from "@/utils/anonymizer/predictions";
import LabelManager from "../anonymizer/label-manager";
import SearchAnnotation from "../file/search-annotation";
import TagAnnotation from "../file/tag-annotation";
import * as S from "./FileAnnotator.styles";
import { createAnnotationsWithSearch, predictionsToMap } from "./annotations";
import { generateSplits } from "./generateSplits";

const labelManagerWrapper = css({
  display: "flex",
  h: "full",
  minH: "0",
  flexShrink: "0",
  "&[hidden]": {
    display: "none",
  },
});

interface ParagraphProps {
  children: string;
  search: string;
  paragraph: ParagraphType;
  predictions: PredictLabel[];
}
const Paragraph = memo(
  ({ children, search, paragraph, predictions }: ParagraphProps) => {
    const { label } = useAnnotation();

    const annotations = useMemo(() => {
      return createAnnotationsWithSearch(predictions, search, paragraph, label);
    }, [predictions, search, paragraph, label]);

    const splits = generateSplits(children, annotations);

    return (
      <S.Paragraph id={paragraph.id}>
        {splits.map((s) => {
          const content = children.slice(s.start, s.end);
          const key = `${s.start}-${s.end}`;

          switch (s.type) {
            case "search":
              return (
                <SearchAnnotation key={key} annotation={s}>
                  {content}
                </SearchAnnotation>
              );
            case "tag":
              return (
                <TagAnnotation key={key} annotation={s}>
                  {content}
                </TagAnnotation>
              );
            case "text":
            default:
              return (
                <span key={key} data-start={s.start}>
                  {content}
                </span>
              );
          }
        })}
      </S.Paragraph>
    );
  },
);

interface Props {
  file: DocFile;
  isAnnotable?: boolean;
}
export default function FileAnnotator({ file, isAnnotable = false }: Props) {
  const [search, setSearch] = useState("");
  const [, startTransition] = useTransition();

  const [label, setLabel] = useState<AllLabels | null>(null);
  const [labelManagerOpen, setLabelManagerOpen] = useState(false);

  const paragraphs = file.paragraphs ?? [];
  const { tags, words } = useExcludedTagsConfig();
  const activeLabelOptions = useMemo(
    () => getActiveAnonymizerLabelOptions(tags),
    [tags],
  );

  useEffect(() => {
    if (label && !activeLabelOptions.some((option) => option.id === label)) {
      setLabel(null);
    }
  }, [activeLabelOptions, label]);

  const filteredPredictions = useMemo(
    () => filterActivePredictions(file.predictions, tags, words),
    [file.predictions, tags, words],
  );

  const predictionsMap = useMemo(
    () => predictionsToMap(filteredPredictions),
    [filteredPredictions],
  );

  const selectChangeHandler = (option?: SelectOption) => {
    setLabel((option?.id as AllLabels) ?? null);
  };

  const toggleManagerLabel = () => {
    setLabelManagerOpen(!labelManagerOpen);
  };

  const handleSearchChange = (value: string) => {
    startTransition(() => setSearch(value));
  };

  return (
    <HStack w="full" h="full" alignItems="unset" overflow="hidden">
      <S.Container>
        <SearchBar
          onSearchChange={handleSearchChange}
          onLabelChange={selectChangeHandler}
          labelValue={label ?? undefined}
          onLabelManagerToggle={toggleManagerLabel}
          isAnnotable={isAnnotable}
          isLabelManagerOpen={labelManagerOpen}
        />
        <S.File>
          <AnnotationProvider
            file={file}
            isAnnotable={isAnnotable}
            label={label}
          >
            {paragraphs.map((p) => (
              <Paragraph
                key={p.id}
                search={search}
                paragraph={p}
                predictions={predictionsMap.get(p.id) ?? []}
              >
                {p.value}
              </Paragraph>
            ))}
          </AnnotationProvider>
        </S.File>
      </S.Container>
      <div hidden={!labelManagerOpen} className={labelManagerWrapper}>
        <LabelManager onClose={toggleManagerLabel} />
      </div>
    </HStack>
  );
}
