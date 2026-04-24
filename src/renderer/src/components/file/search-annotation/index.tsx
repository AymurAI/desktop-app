import type {
  Annotation,
  LabelAnnotation,
} from "@/components/file-annotator/types";
import AnnotationPopover from "@/components/file/annotation-popover";
import { useAnnotation } from "@/context/Annotation";
import { cva } from "@/styled/css";
import type { AllLabels, AllLabelsWithSufix } from "@/types/aymurai";
import SearchTagger from "./search-tagger";

const search = cva({
  base: {
    bg: "[#FCFC02]",
    textStyle: "label.md.default",
  },
  variants: {
    clickable: {
      true: { cursor: "pointer" },
      false: { cursor: "unset" },
    },
  },
  defaultVariants: {
    clickable: false,
  },
});

interface SearchAnnotationProps {
  annotateTo: AllLabels | AllLabelsWithSufix | undefined;
  children: string;
  annotation: Annotation;
}
export default function SearchAnnotation({
  annotateTo,
  children,
  annotation,
}: SearchAnnotationProps) {
  const { add, addBySearch, createAnnotationData } = useAnnotation();

  const isAnnotable = !!annotateTo;

  if (!isAnnotable)
    return <mark className={search({ clickable: false })}>{children}</mark>;

  return (
    <AnnotationPopover
      trigger={<mark className={search({ clickable: true })}>{children}</mark>}
      content={
        <SearchTagger
          onLabelChange={console.log}
          onSuffixChange={console.log}
          onAddAll={handleAddAll}
          onAddOne={handleAddOne}
        />
      }
    />
  );

  function handleAddOne() {
    const annotationData = createAnnotationData(
      children,
      annotation as LabelAnnotation,
      annotateTo,
    );
    if (annotationData) add(annotationData);
  }
  function handleAddAll() {
    if (!annotateTo) return;
    addBySearch(children, annotateTo);
  }
}
