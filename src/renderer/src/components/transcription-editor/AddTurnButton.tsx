import { useTranscriptionDispatch } from "@/hooks/useTranscriptions";
import { insertTurn } from "@/reducers/transcription/actions";
import { styled } from "@/styles/stitches.config";
import type { Turn } from "@/types/transcription";

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

const AddButton = styled("button", {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  padding: "8px 16px",
  border: "1.5px dashed #BCBAB8",
  borderRadius: "8px",
  backgroundColor: "transparent",
  cursor: "pointer",
  color: "#9F99A5",
  fontFamily: "$primary",
  fontWeight: "$default",
  fontSize: "13px",
  lineHeight: "18px",
  transition: "border-color 150ms ease, color 150ms ease",
  boxSizing: "border-box",

  "&:hover": {
    borderColor: "#3F479D",
    color: "#3F479D",
    backgroundColor: "rgba(63, 71, 157, 0.04)",
  },
});

// ---------------------------------------------------------------------------
// Props & Component
// ---------------------------------------------------------------------------

interface AddTurnButtonProps {
  transcriptionId: string;
  afterTurn: Turn;
}

function AddTurnButton({ transcriptionId, afterTurn }: AddTurnButtonProps) {
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
    <AddButton onClick={handleClick} type="button" aria-label="Agregar turno">
      + Agregar turno
    </AddButton>
  );
}

export default AddTurnButton;
