import SpeakerAvatar from "@/components/speaker-avatar";
import { useTranscriptionDispatch } from "@/hooks/useTranscriptions";
import { assignSuggestedSpeakerToTurn } from "@/reducers/transcription/actions";
import { SUGGESTED_SPEAKERS } from "@/services/aymurai/fixtures/suggestedSpeakers";
import { styled } from "@/styles/stitches.config";
import type { Transcription } from "@/types/transcription";
import type { SuggestedSpeaker } from "@/types/transcription";

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

const PanelWrap = styled("div", {
  width: "289px",
  flexShrink: 0,
  borderLeft: "1px solid #BCBAB8",
  padding: "24px",
  backgroundColor: "#FFFFFF",
  overflowY: "auto",
  boxSizing: "border-box",
});

const PanelTitle = styled("h3", {
  fontFamily: "$primary",
  fontWeight: "$default",
  fontSize: "14px",
  lineHeight: "18px",
  color: "#110041",
  margin: "0 0 16px 0",
});

const SpeakerRow = styled("div", {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: "10px",
  padding: "10px 12px",
  borderRadius: "8px",
  cursor: "pointer",

  "&:hover": {
    backgroundColor: "rgba(63, 71, 157, 0.06)",
  },

  variants: {
    disabled: {
      true: {
        cursor: "default",
        opacity: 0.4,
        "&:hover": {
          backgroundColor: "transparent",
        },
      },
    },
  },
});

const SpeakerName = styled("span", {
  fontFamily: "$primary",
  fontWeight: "$default",
  fontSize: "14px",
  lineHeight: "20px",
  color: "#110041",
});

const EmptyHint = styled("p", {
  fontFamily: "$primary",
  fontWeight: "$default",
  fontSize: "13px",
  lineHeight: "18px",
  color: "#9F99A5",
  fontStyle: "italic",
  margin: 0,
});

// ---------------------------------------------------------------------------
// Props & Component
// ---------------------------------------------------------------------------

interface SuggestedSpeakersPanelProps {
  transcription: Transcription;
  selectedTurnId: string | null;
}

function SuggestedSpeakersPanel({
  transcription,
  selectedTurnId,
}: SuggestedSpeakersPanelProps) {
  const dispatch = useTranscriptionDispatch();

  const handleAssign = (suggested: SuggestedSpeaker) => {
    if (!selectedTurnId) return;
    dispatch(
      assignSuggestedSpeakerToTurn(transcription.id, selectedTurnId, suggested),
    );
  };

  return (
    <PanelWrap>
      <PanelTitle>Speakers sugeridos</PanelTitle>

      {!selectedTurnId && (
        <EmptyHint>
          Seleccioná un turno para asignar un speaker sugerido.
        </EmptyHint>
      )}

      {SUGGESTED_SPEAKERS.map((suggested) => (
        <SpeakerRow
          key={suggested.id}
          disabled={!selectedTurnId}
          onClick={() => handleAssign(suggested)}
          role="button"
          tabIndex={selectedTurnId ? 0 : -1}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && selectedTurnId) {
              e.preventDefault();
              handleAssign(suggested);
            }
          }}
        >
          <SpeakerAvatar speaker={suggested} size="sm" />
          <SpeakerName>{suggested.label}</SpeakerName>
        </SpeakerRow>
      ))}
    </PanelWrap>
  );
}

export default SuggestedSpeakersPanel;
