import { styled } from "@/styles/stitches.config";
import SpeakerAvatar from "@/components/speaker-avatar";
import type { Speaker, Turn } from "@/types/transcription";
import { formatMs } from "./formatMs";

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

const TurnWrap = styled("div", {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  paddingLeft: "32px",
  paddingRight: "32px",
  boxSizing: "border-box",
  transition: "border-left 150ms ease, background-color 150ms ease",

  variants: {
    active: {
      true: {
        borderLeft: "4px solid #3F479D",
        backgroundColor: "rgba(197, 202, 255, 0.15)",
        paddingLeft: "28px", // compensate for the 4px border
      },
      false: {
        borderLeft: "4px solid transparent",
      },
    },
  },
  defaultVariants: {
    active: false,
  },
});

const TurnHeader = styled("div", {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: "8px",
  cursor: "pointer",
  marginBottom: "8px",

  "&:hover": {
    opacity: 0.8,
  },
});

const SpeakerLabel = styled("span", {
  fontFamily: "$primary",
  fontWeight: "$strong",
  fontSize: "16px",
  lineHeight: "20px",
  color: "#625C68",
  flexShrink: 0,
});

const Timestamp = styled("span", {
  fontFamily: "$primary",
  fontWeight: "$default",
  fontSize: "16px",
  lineHeight: "20px",
  color: "#625C68",
});

const TurnText = styled("p", {
  fontFamily: "$primary",
  fontWeight: 300,
  fontSize: "16px",
  lineHeight: "26px",
  color: "#110041",
  margin: 0,
  padding: 0,
});

// ---------------------------------------------------------------------------
// Props & Component
// ---------------------------------------------------------------------------

interface TurnBlockProps {
  turn: Turn;
  speaker: Speaker;
  isActive: boolean;
  isEditMode: boolean;
  onSeekTo: (ms: number) => void;
}

function TurnBlock({
  turn,
  speaker,
  isActive,
  onSeekTo,
}: TurnBlockProps) {
  const handleHeaderClick = () => {
    onSeekTo(turn.startMs);
  };

  return (
    <TurnWrap active={isActive}>
      <TurnHeader onClick={handleHeaderClick} role="button" tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleHeaderClick();
          }
        }}
      >
        <SpeakerAvatar speaker={speaker} size="sm" />
        <SpeakerLabel>{speaker.label}</SpeakerLabel>
        <Timestamp>{formatMs(turn.startMs)}</Timestamp>
      </TurnHeader>
      <TurnText>{turn.text}</TurnText>
    </TurnWrap>
  );
}

export default TurnBlock;
