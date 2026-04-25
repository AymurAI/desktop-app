import { sva } from "@/styled/css";
import { hstack } from "@/styled/patterns";
import TaggerButton from "../tagger-button";

const IMG_SIZE = 24;

const tagger = sva({
  slots: ["container", "button", "divider"],
  base: {
    container: {
      ...hstack.raw({ alignItems: "center", gap: "1" }),
      p: "1",
      bg: "action.alt-default",
      rounded: "lg",
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
  onRemove: () => void;
  onRemoveAll: () => void;
  onReplaceOne: () => void;
  onReplaceAll: () => void;
}
export default function TagTagger({
  onRemove,
  onRemoveAll,
  onReplaceAll,
  onReplaceOne,
}: MarkTaggerProps) {
  const classes = tagger();
  return (
    <div className={classes.container}>
      <TaggerButton tooltip="Reemplazar una ocurrencia" onClick={onReplaceOne}>
        <img
          src="/button-icons/replace-one.svg"
          alt="Reemplazar una"
          width={IMG_SIZE}
          height={IMG_SIZE}
        />
      </TaggerButton>
      <div className={classes.divider} />
      <TaggerButton
        tooltip="Reemplazar todas las ocurrencias"
        onClick={onReplaceAll}
      >
        <img
          src="/button-icons/replace-all.svg"
          alt="Reemplazar todas"
          width={IMG_SIZE}
          height={IMG_SIZE}
        />
      </TaggerButton>
      <div className={classes.divider} />
      <TaggerButton tooltip="Remover una ocurrencia" onClick={onRemove}>
        <img
          src="/button-icons/delete-one.svg"
          alt="Removar una"
          width={IMG_SIZE}
          height={IMG_SIZE}
        />
      </TaggerButton>
      <div className={classes.divider} />
      <TaggerButton
        tooltip="Remover todas las ocurrencias"
        onClick={onRemoveAll}
      >
        <img
          src="/button-icons/delete-all.svg"
          alt="Removar todas"
          width={IMG_SIZE}
          height={IMG_SIZE}
        />
      </TaggerButton>
    </div>
  );
}
