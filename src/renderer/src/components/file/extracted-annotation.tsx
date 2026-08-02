import type {
  Annotation,
  ExtractedValueAnnotation,
} from "@/components/file-annotator/types";
import { cva, cx } from "@/styled/css";

const extracted = cva({
  base: {
    m: "0",
    userSelect: "text",
    boxDecorationBreak: "clone",
  },
  variants: {
    variant: {
      value: { bg: "bg.secondary-highlight" },
      support: { bg: "bg.primary-highlight" },
    },
    active: {
      true: {
        border: "primary-alt",
      },
      false: {},
    },
  },
  defaultVariants: {
    variant: "value",
    active: false,
  },
});

interface ExtractedAnnotationProps {
  children: string;
  annotation: Annotation;
}
export default function ExtractedAnnotation({
  children,
  annotation,
}: ExtractedAnnotationProps) {
  if (annotation.type !== "extracted")
    throw new Error(
      `Annotation of type "extracted" expected but got: ${annotation.type}`,
    );

  const extractedAnnotation = annotation as ExtractedValueAnnotation;
  const className = cx(
    "extracted",
    extracted({
      variant: extractedAnnotation.variant ?? "value",
      active: extractedAnnotation.isActive ?? false,
    }),
  );

  return (
    <mark
      className={className}
      data-start={annotation.start}
      data-end={annotation.end}
      data-extracted-field={extractedAnnotation.field}
    >
      {children}
    </mark>
  );
}
