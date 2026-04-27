import { useTranslation } from "react-i18next";

import { useTranscriptionDispatch } from "@/hooks/useTranscriptions";
import { assignSuggestedSpeakerToTurn } from "@/reducers/transcription/actions";
import { SUGGESTED_SPEAKERS } from "@/services/aymurai/fixtures/suggestedSpeakers";
import { css, cva } from "@/styled/css";
import type { SuggestedSpeaker, Transcription } from "@/types/transcription";
import SpeakerAvatar from "../speaker-avatar";

const panel = css({
  width: "[289px]",
  flexShrink: "0",
  borderLeftWidth: "[1px]",
  borderLeftStyle: "solid",
  borderLeftColor: "[#BCBAB8]",
  p: "6",
  bg: "bg.secondary",
  overflowY: "auto",
  boxSizing: "border-box",
});

const panelTitle = css({
  fontSize: "[14px]",
  lineHeight: "[18px]",
  color: "text.default",
  m: "[0]",
  mb: "4",
});

const speakerRow = cva({
  base: {
    display: "flex",
    flexDir: "row",
    alignItems: "center",
    gap: "[10px]",
    py: "[10px]",
    px: "3",
    width: "full",
    rounded: "lg",
    border: "[none]",
    bg: "transparent",
    cursor: "pointer",
    textAlign: "left",
    "&:hover:not(:disabled)": { bg: "[rgba(63, 71, 157, 0.06)]" },
  },
  variants: {
    disabled: {
      true: {
        cursor: "default",
        opacity: "0.4",
      },
      false: {},
    },
  },
});

const speakerName = css({
  fontSize: "[14px]",
  lineHeight: "[20px]",
  color: "text.default",
});

const emptyHint = css({
  fontSize: "[13px]",
  lineHeight: "[18px]",
  color: "[#9F99A5]",
  fontStyle: "italic",
  m: "[0]",
});

interface SuggestedSpeakersPanelProps {
  transcription: Transcription;
  selectedTurnId: string | null;
}

export default function SuggestedSpeakersPanel({
  transcription,
  selectedTurnId,
}: SuggestedSpeakersPanelProps) {
  const { t } = useTranslation("voice-to-text");
  const dispatch = useTranscriptionDispatch();

  const handleAssign = (suggested: SuggestedSpeaker) => {
    if (!selectedTurnId) return;
    dispatch(
      assignSuggestedSpeakerToTurn(transcription.id, selectedTurnId, suggested),
    );
  };

  return (
    <div className={panel}>
      <h3 className={panelTitle}>{t("suggestedPanel.title")}</h3>

      {!selectedTurnId && (
        <p className={emptyHint}>{t("suggestedPanel.empty")}</p>
      )}

      {SUGGESTED_SPEAKERS.map((suggested) => (
        <button
          key={suggested.id}
          type="button"
          disabled={!selectedTurnId}
          onClick={() => handleAssign(suggested)}
          className={speakerRow({ disabled: !selectedTurnId })}
        >
          <SpeakerAvatar speaker={suggested} size="sm" />
          <span className={speakerName}>{suggested.label}</span>
        </button>
      ))}
    </div>
  );
}
