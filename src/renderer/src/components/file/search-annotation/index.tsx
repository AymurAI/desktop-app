import type {
  Annotation,
  LabelAnnotation,
} from "@/components/file-annotator/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAnnotation } from "@/context/Annotation";
import { css, cva } from "@/styled/css";
import type { AllLabels, AllLabelsWithSufix } from "@/types/aymurai";
import { type FocusEventHandler, useRef, useState } from "react";
import SearchTagger from "./search-tagger";

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

  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const isFocusInside = useRef(false);

  const isAnnotable = !!annotateTo;

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => {
      if (!isFocusInside.current) setOpen(false);
    }, 100);
  };

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const handleMouseEnter = () => {
    cancelClose();
    setOpen(true);
  };

  const handleBlur: FocusEventHandler<HTMLDivElement> = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      isFocusInside.current = false;
      scheduleClose();
    }
  };

  if (!isAnnotable)
    return <mark className={search({ clickable: false })}>{children}</mark>;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={triggerReset}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={scheduleClose}
        >
          <mark className={search({ clickable: true })}>{children}</mark>
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
          onBlur={handleBlur}
        >
          <SearchTagger
            onLabelChange={console.log}
            onSuffixChange={console.log}
            onAddAll={handleAddAll}
            onAddOne={handleAddOne}
          />
        </PopoverContent>
      </Popover>
    </>
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
