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
import { useAnnotation } from "@/context/Annotation";
import { css, cva } from "@/styled/css";
import type {
  AllLabels,
  AllLabelsWithSufix,
  AnonymizerLabels,
} from "@/types/aymurai";
import { useRef, useState } from "react";
import ReplaceDialog from "./replace-dialog";
import SuggestionLabel from "./suggestion-label";
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
  annotation: Annotation;
}
export default function Mark({ children, isAnnotable, annotation }: MarkProps) {
  const [open, setOpen] = useState(false);
  const [replaceAllOpen, setReplaceAllOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<
    AnonymizerLabels | undefined
  >(
    annotation.type === "tag"
      ? (annotation.tag as AnonymizerLabels | undefined)
      : undefined,
  );
  const [suffix, setSuffix] = useState("");
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const isFocusInside = useRef(false);

  const { add, addBySearch, updateLabel, updateByText, createAnnotationData } =
    useAnnotation();

  const resolvedLabel: AllLabels | AllLabelsWithSufix | undefined =
    selectedLabel
      ? suffix
        ? (`${selectedLabel}_${suffix}` as AllLabelsWithSufix)
        : selectedLabel
      : undefined;

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

  const isTag = annotation.type === "tag";

  const renderAnnotation = isTag ? (
    <SuggestionLabel
      label={annotation.tag ?? "DESCONOCIDO"}
      isClickable={isAnnotable}
    >
      {children}
    </SuggestionLabel>
  ) : (
    <mark className={search({ clickable: isAnnotable })}>{children}</mark>
  );

  if (!isAnnotable) return renderAnnotation;

  return (
    <>
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
            label={selectedLabel}
            suffix={suffix}
            onLabelChange={setSelectedLabel}
            onSuffixChange={setSuffix}
            onClickOne={
              annotation.type === "search" ? handleAddOne : handleReplaceOne
            }
            onClickAll={
              annotation.type === "search" ? handleAddAll : handleReplaceAll
            }
          />
        </PopoverContent>
      </Popover>
      {resolvedLabel && (
        <ReplaceDialog
          isOpen={replaceAllOpen}
          label={resolvedLabel}
          onClose={(open) => setReplaceAllOpen(open)}
          onConfirm={handleConfirmReplaceAll}
        />
      )}
    </>
  );

  function handleAddOne() {
    const annotationData = createAnnotationData(
      annotation as LabelAnnotation,
      resolvedLabel,
    );
    if (annotationData) add(annotationData);
  }
  function handleAddAll() {
    if (!resolvedLabel) return;
    addBySearch(children, resolvedLabel);
  }

  function handleReplaceOne() {
    if (!resolvedLabel) return;
    const annotationData = createAnnotationData(
      children,
      annotation as LabelAnnotation,
    );
    if (annotationData) updateLabel(annotationData, resolvedLabel);
  }

  function handleReplaceAll() {
    if (!resolvedLabel) return;
    setReplaceAllOpen(true);
  }

  function handleConfirmReplaceAll() {
    if (!resolvedLabel) return;

    const annotationData = createAnnotationData(
      children,
      annotation as LabelAnnotation,
    );
    if (annotationData) updateByText(annotationData, resolvedLabel);
    setReplaceAllOpen(false);
  }
}
