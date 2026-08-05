import type {
  Annotation,
  ExtractedValueAnnotation,
} from "@/components/file-annotator/types";
import { cva, cx } from "@/styled/css";

const extracted = cva({
  base: {
    fontFamily: '["Times New Roman", Times, serif]',
    textStyle: "label.md.default",
    m: "0",
    userSelect: "text",
    boxDecorationBreak: "clone",
  },
  variants: {
    variant: {
      value: { bg: "bg.primary-alternative" },
      support: { bg: "bg.primary-highlight" },
    },
    active: {
      true: {
        // `borders.primary-alt` is a full "1px solid #110041" shorthand, not
        // a bare color, so it can't be dropped into boxShadow via token();
        // #110041 is that token's color, kept as an inline ring (not
        // `border`) so activation doesn't reflow the inline `<mark>`.
        boxShadow: "[inset 0 -2px 0 #110041]",
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
