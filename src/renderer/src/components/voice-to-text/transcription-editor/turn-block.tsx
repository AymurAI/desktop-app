import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useTranscriptionDispatch } from "@/hooks/useTranscriptions";
import { updateTurnText } from "@/reducers/transcription/actions";
import { css, cva } from "@/styled/css";
import type { Speaker, Transcription, Turn } from "@/types/transcription";
import { formatTime } from "../format-time";
import SpeakerAvatar from "../speaker-avatar";
import { EditableTurnText } from "./editable-turn-text";

const wrap = cva({
  base: {
    display: "flex",
    flexDir: "column",
    width: "full",
    px: "8",
    boxSizing: "border-box",
    transition:
      "[border-left 150ms ease, background-color 150ms ease, outline 150ms ease]",
    position: "relative",
    borderLeftWidth: "[4px]",
    borderLeftStyle: "solid",
    borderLeftColor: "transparent",
  },
  variants: {
    active: {
      true: {
        borderLeftColor: "brand.primary",
        bg: "[rgba(197, 202, 255, 0.15)]",
        pl: "7",
      },
      false: {},
    },
    selected: {
      true: {
        outlineWidth: "[2px]",
        outlineStyle: "solid",
        outlineColor: "brand.primary",
        outlineOffset: "[2px]",
        rounded: "[4px]",
      },
      false: {},
    },
  },
  defaultVariants: { active: false, selected: false },
});

const row = css({
  display: "flex",
  flexDir: "row",
  alignItems: "flex-start",
  gap: "2",
  width: "full",
});

const avatarButton = css({
  border: "[none]",
  bg: "transparent",
  p: "[0]",
  cursor: "pointer",
  flexShrink: "0",
  mt: "[2px]",
});

const rightCol = css({
  display: "flex",
  flexDir: "column",
  gap: "2",
  flex: "[1]",
  minWidth: "0",
});

const labelRow = css({
  display: "flex",
  flexDir: "row",
  alignItems: "center",
  gap: "2",
  bg: "transparent",
  border: "[none]",
  p: "[0]",
  textAlign: "left",
  cursor: "pointer",
  "&:hover": { opacity: "0.8" },
});

const speakerLabel = css({
  fontSize: "[16px]",
  lineHeight: "[20px]",
  fontWeight: "[600]",
  color: "text.lighter",
  flexShrink: "0",
});

const timestamp = css({
  fontSize: "[16px]",
  lineHeight: "[20px]",
  color: "text.lighter",
});

const text = css({
  fontSize: "[16px]",
  lineHeight: "[26px]",
  fontWeight: "[300]",
  color: "text.default",
  m: "[0]",
  p: "[0]",
});

const highlightMark = css({
  bg: "[#FFE066]",
  color: "[currentColor]",
  rounded: "[2px]",
});

function highlightText(input: string, query: string): ReactNode {
  if (!query) return input;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = input.split(regex);
  return parts.map((part, i) => {
    if (regex.test(part)) {
      regex.lastIndex = 0;
      return (
        // biome-ignore lint/suspicious/noArrayIndexKey: split+regex parts are positionally stable
        <mark key={i} className={highlightMark}>
          {part}
        </mark>
      );
    }
    regex.lastIndex = 0;
    return part;
  });
}

interface TurnBlockProps {
  turn: Turn;
  speaker: Speaker;
  transcription: Transcription;
  isActive: boolean;
  isEditMode: boolean;
  isSelected: boolean;
  index: number;
  searchQuery: string;
  onSeekTo: (ms: number) => void;
  onSelect: (turnId: string) => void;
  onTextSelect: () => void;
  turnRef?: (el: HTMLDivElement | null) => void;
}

export default function TurnBlock({
  turn,
  speaker,
  transcription,
  isActive,
  isEditMode,
  isSelected,
  // index is kept in the interface (callers pass it) but unused post-toolbar removal
  searchQuery,
  onSeekTo,
  onSelect,
  onTextSelect,
  turnRef,
}: TurnBlockProps) {
  const { t } = useTranslation("voice-to-text");
  const dispatch = useTranscriptionDispatch();

  const handleHeaderClick = () => {
    if (isEditMode) onSelect(turn.id);
    else onSeekTo(turn.startMs);
  };

  const handleWrapClick = () => {
    if (isEditMode) onSelect(turn.id);
  };

  return (
    <div
      ref={turnRef}
      onClick={handleWrapClick}
      className={wrap({
        active: isActive,
        selected: isEditMode && isSelected,
      })}
    >
      <div className={row}>
        <button
          type="button"
          onClick={handleHeaderClick}
          className={avatarButton}
          tabIndex={-1}
          aria-hidden="true"
        >
          <SpeakerAvatar speaker={speaker} size="sm" />
        </button>
        <div className={rightCol}>
          <button
            type="button"
            onClick={handleHeaderClick}
            className={labelRow}
          >
            <span className={speakerLabel}>{speaker.label}</span>
            <span className={timestamp}>{formatTime(turn.startMs)}</span>
          </button>
          {isEditMode ? (
            <EditableTurnText
              turnId={turn.id}
              text={turn.text}
              ariaLabel={t("editor.turnTextAria", {
                speaker: speaker.label,
                time: formatTime(turn.startMs),
              })}
              onCommit={(id, value) =>
                dispatch(updateTurnText(transcription.id, id, value))
              }
              onSelect={onTextSelect}
            />
          ) : (
            <p className={text}>
              {searchQuery ? highlightText(turn.text, searchQuery) : turn.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
