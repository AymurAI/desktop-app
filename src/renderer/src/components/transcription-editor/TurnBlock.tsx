import { useRef, useState } from "react";

import { Trash } from "phosphor-react";
import { styled } from "@/styles/stitches.config";
import SpeakerAvatar from "@/components/speaker-avatar";
import type { Speaker, Transcription, Turn } from "@/types/transcription";
import { useTranscriptionDispatch } from "@/hooks/useTranscriptions";
import { removeTurn, updateTurnText } from "@/reducers/transcription/actions";
import { formatMs } from "./formatMs";
import SpeakerDialog from "./SpeakerDialog";

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
  transition: "border-left 150ms ease, background-color 150ms ease, outline 150ms ease",
  position: "relative",

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
    selected: {
      true: {
        outline: "2px solid #3F479D",
        outlineOffset: "2px",
        borderRadius: "4px",
      },
    },
  },
  defaultVariants: {
    active: false,
    selected: false,
  },
});

const TurnHeader = styled("div", {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: "8px",
  marginBottom: "8px",

  variants: {
    clickable: {
      true: {
        cursor: "pointer",
        "&:hover": {
          opacity: 0.8,
        },
      },
      false: {
        cursor: "pointer",
        "&:hover": {
          opacity: 0.8,
        },
      },
    },
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

const TurnTextarea = styled("textarea", {
  fontFamily: "$primary",
  fontWeight: 300,
  fontSize: "16px",
  lineHeight: "26px",
  color: "#110041",
  margin: 0,
  padding: 0,
  border: "1px solid transparent",
  outline: "none",
  resize: "none",
  width: "100%",
  backgroundColor: "transparent",
  boxSizing: "border-box",
  overflow: "hidden",

  "&:focus": {
    border: "1px solid #BCBAB8",
    borderRadius: "4px",
    padding: "2px 4px",
    backgroundColor: "#FFFFFF",
  },
});

const TrashButton = styled("button", {
  position: "absolute",
  top: "8px",
  right: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  border: "none",
  borderRadius: "6px",
  backgroundColor: "transparent",
  cursor: "pointer",
  color: "#9F99A5",
  padding: 0,

  "&:hover": {
    backgroundColor: "rgba(220, 53, 69, 0.1)",
    color: "#DC3545",
  },
});

const HighlightMark = styled("mark", {
  backgroundColor: "#FFE066",
  color: "inherit",
  borderRadius: "2px",
});

// ---------------------------------------------------------------------------
// Highlight helper
// ---------------------------------------------------------------------------

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (regex.test(part)) {
      // Reset lastIndex after test()
      regex.lastIndex = 0;
      return <HighlightMark key={i}>{part}</HighlightMark>;
    }
    regex.lastIndex = 0;
    return part;
  });
}

// ---------------------------------------------------------------------------
// Props & Component
// ---------------------------------------------------------------------------

interface TurnBlockProps {
  turn: Turn;
  speaker: Speaker;
  transcription: Transcription;
  isActive: boolean;
  isEditMode: boolean;
  isSelected: boolean;
  searchQuery: string;
  onSeekTo: (ms: number) => void;
  onSelect: (turnId: string) => void;
  turnRef?: (el: HTMLDivElement | null) => void;
}

function TurnBlock({
  turn,
  speaker,
  transcription,
  isActive,
  isEditMode,
  isSelected,
  searchQuery,
  onSeekTo,
  onSelect,
  turnRef,
}: TurnBlockProps) {
  const dispatch = useTranscriptionDispatch();
  const [textValue, setTextValue] = useState(turn.text);
  const [speakerDialogOpen, setSpeakerDialogOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep local text in sync when turn.text changes externally
  // (e.g. after a reducer update from another location)
  const prevTurnText = useRef(turn.text);
  if (prevTurnText.current !== turn.text) {
    prevTurnText.current = turn.text;
    setTextValue(turn.text);
  }

  const handleHeaderClick = () => {
    if (isEditMode) {
      setSpeakerDialogOpen(true);
    } else {
      onSeekTo(turn.startMs);
    }
  };

  const handleWrapClick = () => {
    if (isEditMode) {
      onSelect(turn.id);
    }
  };

  const handleTextBlur = () => {
    if (textValue !== turn.text) {
      dispatch(updateTurnText(transcription.id, turn.id, textValue));
    }
  };

  const handleTextInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = "auto";
    target.style.height = `${target.scrollHeight}px`;
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(removeTurn(transcription.id, turn.id));
  };

  return (
    <>
      <TurnWrap
        active={isActive}
        selected={isEditMode && isSelected}
        onClick={handleWrapClick}
        ref={turnRef}
      >
        {/* Edit mode: trash button */}
        {isEditMode && (
          <TrashButton
            onClick={handleRemove}
            type="button"
            aria-label="Eliminar turno"
          >
            <Trash size={20} />
          </TrashButton>
        )}

        <TurnHeader
          onClick={handleHeaderClick}
          role="button"
          tabIndex={0}
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

        {isEditMode ? (
          <TurnTextarea
            ref={textareaRef}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onBlur={handleTextBlur}
            onInput={handleTextInput}
            rows={1}
            aria-label="Texto del turno"
          />
        ) : (
          <TurnText>
            {searchQuery ? highlightText(turn.text, searchQuery) : turn.text}
          </TurnText>
        )}
      </TurnWrap>

      {speakerDialogOpen && (
        <SpeakerDialog
          open={speakerDialogOpen}
          onClose={() => setSpeakerDialogOpen(false)}
          transcription={transcription}
          turn={turn}
          speaker={speaker}
        />
      )}
    </>
  );
}

export default TurnBlock;
