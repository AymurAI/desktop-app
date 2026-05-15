import type {
  Annotation,
  LabelAnnotation,
  Metadata,
} from "@/components/file-annotator/types";
import AnnotationPopover from "@/components/file/annotation-popover";
import { useAnnotation } from "@/context/Annotation";
import { cva } from "@/styled/css";
import type { AllLabels } from "@/types/aymurai";

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

  const { add, addBySearch, createAnnotationData, isAnnotable } =
    useAnnotation();

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
    <AnnotationPopover onClickOne={handleAddOne} onClickAll={handleAddAll}>
      <mark className={search({ clickable: true })} {...metadata}>
        {children}
      </mark>
    </AnnotationPopover>
  );

  function handleAddOne(label: AllLabels) {
    const annotationData = createAnnotationData(
      children,
      annotation as LabelAnnotation,
      label,
    );
    if (annotationData) {
      add(annotationData);
    }
  }
  function handleAddAll(label: AllLabels) {
    addBySearch(children, label);
  }
}
