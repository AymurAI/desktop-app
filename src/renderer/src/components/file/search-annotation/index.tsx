import type {
  Annotation,
  LabelAnnotation,
  Metadata,
} from "@/components/file-annotator/types";
import AnnotationPopover from "@/components/file/annotation-popover";
import { useAnnotation } from "@/context/Annotation";
import { showToast } from "@/features/showToast";
import { cva } from "@/styled/css";
import type {
  AllLabels,
  AllLabelsWithSufix,
  AnonymizerLabels,
} from "@/types/aymurai";
import { Check } from "phosphor-react";
import SearchTagger from "./search-tagger";

const search = cva({
  base: {
    bg: "[#FCFC02]",
    fontFamily: '["Times New Roman", Times, serif]',
    fontWeight: "bold",
    textStyle: "label.md.default",
    m: "0",
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
  children: string;
  annotation: Annotation;
}
export default function SearchAnnotation({
  children,
  annotation,
}: SearchAnnotationProps) {
  if (annotation.type !== "search")
    throw new Error(
      `Annotation of type "search" expected but got: ${annotation.type}`,
    );

  const { add, addBySearch, createAnnotationData, label, suffix, isAnnotable } =
    useAnnotation();

  const annotateTo: AllLabels | AllLabelsWithSufix | null = label
    ? suffix
      ? `${label}_${suffix}`
      : label
    : null;

  const metadata: Metadata = {
    "data-start": annotation.start,
    "data-end": annotation.end,
    "data-tag": annotation.tag,
  };

  if (!isAnnotable)
    return (
      <mark className={search({ clickable: false })} {...metadata}>
        {children}
      </mark>
    );

  return (
    <AnnotationPopover
      trigger={
        <mark className={search({ clickable: true })} {...metadata}>
          {children}
        </mark>
      }
      content={
        // TODO: IMPLEMENT SUFFIX HERE
        // TODO: FIX TYPING HERE
        <SearchTagger
          // TODO: FIX TYPING HERE — SearchTagger only handles AnonymizerLabels but label can be any AllLabels
          initialLabel={label as AnonymizerLabels}
          initialSuffix={suffix?.toString() ?? ""}
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
      annotateTo ?? undefined,
    );
    if (annotationData) {
      add(annotationData);
      showToast("Se agregó la etiqueta en esta ocurrencia.", "success", Check);
    }
  }
  function handleAddAll() {
    if (!annotateTo) return;
    addBySearch(children, annotateTo);
    showToast(
      "Se agregó la etiqueta en todas las ocurrencias.",
      "success",
      Check,
    );
  }
}
