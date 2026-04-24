import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { sva } from "@/styled/css";
import { styled } from "@/styled/jsx";
import { hstack } from "@/styled/patterns";
import { type AnonymizerLabels, anonymizerLabels } from "@/types/aymurai";
import { useState } from "react";
import TaggerButton from "../tagger-button";

const IMG_SIZE = 24;

const tagger = sva({
  slots: ["container", "button", "divider"],
  base: {
    container: {
      ...hstack.raw({ alignItems: "center", gap: "1" }),
      p: "2",
      bg: "action.alt-default",
      rounded: "md",
    },
    button: {
      cursor: "pointer",
    },
    divider: {
      alignSelf: "stretch",
      width: "[1px]",
      bg: "[#5960B0]",

      my: "1",
    },
  },
});

interface MarkTaggerProps {
  initialLabel?: AnonymizerLabels;
  initialSuffix?: string;
  onLabelChange?: (label: AnonymizerLabels) => void;
  onSuffixChange?: (suffix: string) => void;
  onAddOne: () => void;
  onAddAll: () => void;
}
export default function SearchTagger({
  initialLabel,
  initialSuffix,
  onLabelChange,
  onSuffixChange,
  onAddOne,
  onAddAll,
}: MarkTaggerProps) {
  const classes = tagger();

  const [label, setLabel] = useState<AnonymizerLabels | undefined>(initialLabel);
  const [suffix, setSuffix] = useState<string>(initialSuffix ?? "");

  function handleLabelChange(newLabel: AnonymizerLabels) {
    setLabel(newLabel);
    onLabelChange?.(newLabel);
  }

  function handleSuffixChange(newSuffix: string) {
    setSuffix(newSuffix);
    onSuffixChange?.(newSuffix);
  }

  return (
    <div className={classes.container}>
      <Select
        value={label}
        options={anonymizerLabels}
        size="sm"
        onChange={(opt) => handleLabelChange(opt.id as AnonymizerLabels)}
      />
      <div className={classes.divider} />
      <styled.div maxWidth="16">
        <Input
          value={suffix}
          size="sm"
          onChange={(e) => handleSuffixChange(e.target.value)}
          type="number"
          min="1"
        />
      </styled.div>
      <div className={classes.divider} />
      <TaggerButton tooltip="Aplicar en una ocurrencia" onClick={onAddOne}>
        <img
          src="/button-icons/add-one.svg"
          alt="Añadir uno"
          width={IMG_SIZE}
          height={IMG_SIZE}
        />
      </TaggerButton>
      <div className={classes.divider} />
      <TaggerButton
        tooltip="Aplicar en todas las ocurrencias"
        onClick={onAddAll}
      >
        <img
          src="/button-icons/add-all.svg"
          alt="Añadir todas"
          width={IMG_SIZE}
          height={IMG_SIZE}
        />
      </TaggerButton>
    </div>
  );
}
