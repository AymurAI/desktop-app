import type {
  Annotation,
  LabelAnnotation,
  Metadata,
} from "@/components/file-annotator/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Suggestion from "@/components/ui/suggestion";
import { useAnnotation } from "@/context/Annotation";
import { css, cva } from "@/styled/css";
import { useRef, useState } from "react";
import Tagger from "./tagger";

const triggerReset = css({
  appearance: "none",
  bg: "transparent",
  border: "[none]",
  padding: "0",
  cursor: "default",
  "&:focus-visible": {
    outline: "[2px solid token(colors.action.hover)]",
    outlineOffset: "[2px]",
    borderRadius: "sm",
  },
});

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

interface MarkProps {
  children: string;
  isAnnotable: boolean;
  isSearch: boolean;
  annotation: Annotation;
}
export default function Mark({
  children,
  isAnnotable,
  isSearch,
  annotation,
}: MarkProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const isFocusInside = useRef(false);

  const { add, addBySearch, remove } = useAnnotation();

  function scheduleClose() {
    closeTimer.current = setTimeout(() => {
      if (!isFocusInside.current) setOpen(false);
    }, 100);
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  let metadata: Metadata = {
    "data-start": annotation.start,
    "data-end": annotation.end,
  };
  if (annotation.type !== "text") {
    metadata = {
      ...metadata,
      "data-tag": annotation.tag,
    };
  }

  const renderAnnotation = isSearch ? (
    <mark className={search({ clickable: isAnnotable })}>{children}</mark>
  ) : (
    <Suggestion clickable={isAnnotable}>{children}</Suggestion>
  );

  if (!isAnnotable) return annotation;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={triggerReset}
        onMouseEnter={() => {
          cancelClose();
          setOpen(true);
        }}
        onMouseLeave={scheduleClose}
      >
        {renderAnnotation}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        sideOffset={8}
        showArrow={false}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        onFocus={() => {
          isFocusInside.current = true;
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            isFocusInside.current = false;
            scheduleClose();
          }
        }}
      >
        <Tagger
          // suffix={1}
          // label="PER"
          onAddAll={console.log}
          onAddOne={console.log}
        />
      </PopoverContent>
    </Popover>
  );

  function createAnnotationData(annotation: LabelAnnotation) {
    const { start, end, paragraphId, tag } = annotation;
    if (!tag) return null;
    return {
      text: children,
      start_char: start,
      end_char: end,
      paragraphId: paragraphId,
      attrs: {
        aymurai_label: tag,
        aymurai_label_subclass: null,
        aymurai_alt_text: null,
        aymurai_alt_start_char: start,
        aymurai_alt_end_char: end,
      },
    };
  }

  function handleAdd() {
    const annotationData = createAnnotationData(annotation as LabelAnnotation);
    if (annotationData) add(annotationData);
  }
  function handleAddBySearch() {
    if (annotation.type === "search" && annotation.tag)
      addBySearch(children, annotation.tag);
  }

  function handleReplace() {}

  function handleReplaceAll() {}
}
