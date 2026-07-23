import { useState } from "react";

import { sva } from "@/styled/css";
import { styled } from "@/styled/jsx";
import { hstack } from "@/styled/patterns";

import AnonymizerLabelSelect from "@/components/anonymizer/anonymizer-label-select";
import { useAnnotation } from "@/context/Annotation";
import { useExcludedTagsConfig } from "@/store/useLocal";
import type { AllLabels } from "@/types/aymurai";
import type { SelectOption } from "@/types/select";
import { getActiveAnonymizerLabelOptions } from "@/utils/anonymizer/labels";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@aymurai/ui";

import TaggerButton from "./tagger-button";

const tagger = sva({
  slots: ["container", "divider", "tooltipContent"],
  base: {
    container: {
      ...hstack.raw({ alignItems: "center", gap: "1" }),
      // Figma "Tool Bar" (node 40000696:77073): p-[8px], rounded-[8px], plus
      // the "M3/Elevation Light/1" two-layer shadow — verified against the
      // literal exported CSS, not the design-context tool's drop-shadow-[...]
      // utility (which had mis-converted blur radii and dropped the spread).
      p: "2",
      bg: "action.alt-default",
      rounded: "md",
      boxShadow:
        "[0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)]",
    },
    divider: {
      alignSelf: "stretch",
      width: "[1px]",
      bg: "[#5960B0]",

      my: "1",
    },
    tooltipContent: {
      bg: "action.hover",
      color: "white",
      px: "1",
      py: "0.5",
      rounded: "sm",
    },
  },
});

interface MarkTaggerProps {
  onClickOne: (label: AllLabels) => void;
  onClickAll: (label: AllLabels) => void;
  onDeleteOne?: () => void;
  onDeleteAll?: () => void;
}
export default function Tagger({
  onClickAll,
  onClickOne,
  onDeleteOne,
  onDeleteAll,
}: MarkTaggerProps) {
  const { label: initialLabel } = useAnnotation();
  const { tags } = useExcludedTagsConfig();

  const [label, setLabel] = useState<AllLabels | null>(initialLabel);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const options = getActiveAnonymizerLabelOptions(tags);
  const activeLabel =
    label && options.some((option) => option.id === label) ? label : null;

  const handleClickOne = () => {
    if (!activeLabel) return;
    onClickOne(activeLabel);
  };
  const handleClickAll = () => {
    if (!activeLabel) return;
    onClickAll(activeLabel);
  };

  const handleLabelChange = (value: SelectOption) => {
    setLabel(value.id as AllLabels);
  };

  const classes = tagger();
  return (
    <div className={classes.container}>
      <TooltipProvider delayDuration={0}>
        <Tooltip open={isSelectOpen ? false : undefined}>
          <TooltipTrigger asChild>
            <div>
              <AnonymizerLabelSelect
                placeholder="Etiqueta"
                size="sm"
                value={activeLabel ?? undefined}
                options={options}
                onChange={handleLabelChange}
                onOpenChange={setIsSelectOpen}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent showArrow={false} sideOffset={12}>
            <div className={classes.tooltipContent}>
              <styled.p textStyle="label.sm.default">
                Selecciona tipo de etiqueta
              </styled.p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div className={classes.divider} />
      <TaggerButton
        action="agregar-etiqueta"
        tooltip="Afectar una ocurrencia"
        onClick={handleClickOne}
        disabled={!activeLabel}
      />
      <div className={classes.divider} />
      <TaggerButton
        action="agregar-todas"
        tooltip="Afectar todas las ocurrencias"
        onClick={handleClickAll}
        disabled={!activeLabel}
      />
      {onDeleteOne && (
        <>
          <div className={classes.divider} />
          <TaggerButton
            action="eliminar"
            tooltip="Eliminar esta ocurrencia"
            onClick={onDeleteOne}
          />
        </>
      )}
      {onDeleteAll && (
        <>
          <div className={classes.divider} />
          <TaggerButton
            action="eliminar-todo"
            tooltip="Eliminar todas las ocurrencias"
            onClick={onDeleteAll}
          />
        </>
      )}
    </div>
  );
}
