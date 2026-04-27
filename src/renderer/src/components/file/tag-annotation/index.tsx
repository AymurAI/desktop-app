import { Check } from "phosphor-react";
import { useState } from "react";

import type {
  Annotation,
  LabelAnnotation,
  Metadata,
} from "@/components/file-annotator/types";
import { useAnnotation } from "@/context/Annotation";
import { showToast } from "@/features/showToast";
import type { AllLabels, AllLabelsWithSufix } from "@/types/aymurai";

import AnnotationPopover from "../annotation-popover";
import SuggestionLabel from "../suggestion-label";
import RemoveDialog from "./remove-dialog";
import ReplaceDialog from "./replace-dialog";

interface TagAnnotationProps {
  children: string;
  annotation: Annotation;
}
export default function TagAnnotation({
  children,
  annotation,
}: TagAnnotationProps) {
  if (annotation.type !== "tag")
    throw new Error(
      `Annotation of type "tag" expected but got: ${annotation.type}`,
    );

  const {
    updateLabel,
    removeByText,
    updateByText,
    label,
    suffix,
    isAnnotable,
  } = useAnnotation();
  const [replaceAllOpen, setReplaceAllOpen] = useState(false);
  const [removeAllOpen, setRemoveAllOpen] = useState(false);
  const tag = annotation.tag ?? "DESCONOCIDO";

  const annotateTo: AllLabels | AllLabelsWithSufix | null = label
    ? suffix
      ? `${label}_${suffix}`
      : label
    : null;

  const { start, end, paragraphId } = annotation as LabelAnnotation;
  const annotationData = annotation.tag
    ? {
        text: children,
        start_char: start,
        end_char: end,
        paragraphId,
        attrs: {
          aymurai_label: annotation.tag,
          aymurai_label_subclass: null,
          aymurai_alt_text: null,
          aymurai_alt_start_char: start,
          aymurai_alt_end_char: end,
        },
      }
    : null;

  const metadata: Metadata = {
    "data-start": annotation.start,
    "data-end": annotation.end,
    "data-tag": annotation.tag,
  };

  if (!isAnnotable)
    return (
      <SuggestionLabel label={tag} {...metadata}>
        {children}
      </SuggestionLabel>
    );

  return (
    <>
      <AnnotationPopover
        onClickOne={handleReplaceOne}
        onClickAll={handleReplaceAll}
      >
        <SuggestionLabel isClickable label={tag} {...metadata}>
          {children}
        </SuggestionLabel>
      </AnnotationPopover>
      <ReplaceDialog
        isOpen={replaceAllOpen}
        label={annotateTo ?? ""}
        onClose={setReplaceAllOpen}
        onConfirm={confirmReplaceAll}
      />
      <RemoveDialog
        isOpen={removeAllOpen}
        label={tag}
        onClose={setRemoveAllOpen}
        onConfirm={confirmRemoveAll}
      />
    </>
  );

  function handleReplaceOne() {
    if (!annotationData || !annotateTo) return;
    updateLabel(annotationData, annotateTo);
    showToast("Se reemplazó la etiqueta en esta ocurrencia.", "success", Check);
  }

  function handleReplaceAll() {
    setReplaceAllOpen(true);
  }

  function confirmReplaceAll() {
    if (!annotationData || !annotateTo) return;
    updateByText(annotationData, annotateTo);
    setReplaceAllOpen(false);
    showToast(
      "Se reemplazó la etiqueta en todas las ocurrencias.",
      "success",
      Check,
    );
  }

  // function handleRemoveOne() {
  //   if (!annotationData) return;
  //   remove(annotationData);
  //   showToast("Se eliminó la etiqueta en esta ocurrencia.", "success", Check);
  // }

  // function handleRemoveAll() {
  //   setRemoveAllOpen(true);
  // }

  function confirmRemoveAll() {
    if (!annotationData) return;
    removeByText(annotationData);
    setRemoveAllOpen(false);
    showToast(
      "Se eliminaron todas las etiquetas de este texto.",
      "success",
      Check,
    );
  }
}
