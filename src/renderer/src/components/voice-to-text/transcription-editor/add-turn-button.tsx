import { useTranslation } from "react-i18next";

import { useTranscriptionDispatch } from "@/hooks/useTranscriptions";
import { insertTurn } from "@/reducers/transcription/actions";
import { css } from "@/styled/css";
import type { Turn } from "@/types/transcription";

const button = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "full",
  px: "4",
  py: "2",
  borderWidth: "[1.5px]",
  borderStyle: "dashed",
  borderColor: "[#BCBAB8]",
  rounded: "lg",
  bg: "transparent",
  cursor: "pointer",
  color: "[#9F99A5]",
  fontSize: "[13px]",
  lineHeight: "[18px]",
  fontWeight: "[400]",
  transition: "[border-color 150ms ease, color 150ms ease]",
  boxSizing: "border-box",
  "&:hover": {
    borderColor: "brand.primary",
    color: "brand.primary",
    bg: "[rgba(63, 71, 157, 0.04)]",
  },
});

interface AddTurnButtonProps {
  transcriptionId: string;
  afterTurn: Turn;
}

export default function AddTurnButton({
  transcriptionId,
  afterTurn,
}: AddTurnButtonProps) {
  const { t } = useTranslation("voice-to-text");
  const dispatch = useTranscriptionDispatch();

  const handleClick = () => {
    const newTurn: Turn = {
      id: crypto.randomUUID(),
      speakerId: afterTurn.speakerId,
      text: "",
      startMs: afterTurn.endMs,
      endMs: afterTurn.endMs,
    };
    dispatch(insertTurn(transcriptionId, afterTurn.id, newTurn));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t("editor.addTurnAria")}
      className={button}
    >
      {t("editor.addTurn")}
    </button>
  );
}
