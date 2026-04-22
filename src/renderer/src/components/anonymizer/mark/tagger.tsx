import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { sva } from "@/styled/css";
import { styled } from "@/styled/jsx";
import { hstack } from "@/styled/patterns";
import { type AnonymizerLabels, anonymizerLabels } from "@/types/aymurai";
import TaggerButton from "./tagger-button";

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
  label?: AnonymizerLabels;
  suffix?: number;
  onAddOne: () => void;
  onAddAll: () => void;
}
export default function MarkTagger({
  label,
  suffix,
  onAddAll,
  onAddOne,
}: MarkTaggerProps) {
  const classes = tagger();
  return (
    <div className={classes.container}>
      {(label === undefined || suffix === undefined) && (
        <>
          <Select value={label} options={anonymizerLabels} size="sm" />
          <div className={classes.divider} />
          <styled.div maxWidth="16">
            <Input value={(suffix ?? "").toString()} size="sm" />
          </styled.div>
          <div className={classes.divider} />
        </>
      )}

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
