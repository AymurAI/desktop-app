import { Trash } from "phosphor-react";
import {
  type FormEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { useTranscriptionDispatch } from "@/hooks/useTranscriptions";
import { removeTurn, updateTurnText } from "@/reducers/transcription/actions";
import { css, cva } from "@/styled/css";
import type { Speaker, Transcription, Turn } from "@/types/transcription";
import { formatTime } from "../format-time";
import SpeakerAvatar from "../speaker-avatar";
import SpeakerDialog from "./speaker-dialog";

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

const header = css({
  display: "flex",
  flexDir: "row",
  alignItems: "center",
  gap: "2",
  mb: "2",
  bg: "transparent",
  border: "[none]",
  p: "[0]",
  textAlign: "left",
  width: "full",
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

const textarea = css({
  fontSize: "[16px]",
  lineHeight: "[26px]",
  fontWeight: "[300]",
  color: "text.default",
  m: "[0]",
  p: "[0]",
  borderWidth: "[1px]",
  borderStyle: "solid",
  borderColor: "transparent",
  outline: "none",
  resize: "none",
  width: "full",
  bg: "transparent",
  boxSizing: "border-box",
  overflow: "hidden",
  "&:focus": {
    borderColor: "[#BCBAB8]",
    rounded: "[4px]",
    px: "[4px]",
    py: "[2px]",
    bg: "bg.secondary",
  },
});

const trashButton = css({
  position: "absolute",
  top: "2",
  right: "2",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "7",
  height: "7",
  border: "[none]",
  rounded: "md",
  bg: "transparent",
  cursor: "pointer",
  color: "[#9F99A5]",
  p: "[0]",
  "&:hover": {
    bg: "[rgba(220, 53, 69, 0.1)]",
    color: "[#DC3545]",
  },
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
  searchQuery: string;
  onSeekTo: (ms: number) => void;
  onSelect: (turnId: string) => void;
  turnRef?: (el: HTMLDivElement | null) => void;
}

export default function TurnBlock({
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
  const { t } = useTranslation("voice-to-text");
  const dispatch = useTranscriptionDispatch();
  const [textValue, setTextValue] = useState(turn.text);
  const [speakerDialogOpen, setSpeakerDialogOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const prevTurnText = useRef(turn.text);
  if (prevTurnText.current !== turn.text) {
    prevTurnText.current = turn.text;
    setTextValue(turn.text);
  }

  const handleHeaderClick = () => {
    if (isEditMode) setSpeakerDialogOpen(true);
    else onSeekTo(turn.startMs);
  };

  const handleWrapClick = () => {
    if (isEditMode) onSelect(turn.id);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: textValue needed to re-measure after external reducer updates
  useEffect(() => {
    if (isEditMode && textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [isEditMode, textValue]);

  const handleTextBlur = () => {
    if (textValue !== turn.text) {
      dispatch(updateTurnText(transcription.id, turn.id, textValue));
    }
  };

  const handleTextInput = (e: FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = "auto";
    target.style.height = `${target.scrollHeight}px`;
  };

  const handleRemove = (e: MouseEvent) => {
    e.stopPropagation();
    dispatch(removeTurn(transcription.id, turn.id));
  };

  return (
    <>
      <div
        ref={turnRef}
        onClick={handleWrapClick}
        className={wrap({
          active: isActive,
          selected: isEditMode && isSelected,
        })}
      >
        {isEditMode && (
          <button
            type="button"
            onClick={handleRemove}
            aria-label={t("editor.removeTurnAria")}
            className={trashButton}
          >
            <Trash size={20} />
          </button>
        )}

        <button type="button" onClick={handleHeaderClick} className={header}>
          <SpeakerAvatar speaker={speaker} size="sm" />
          <span className={speakerLabel}>{speaker.label}</span>
          <span className={timestamp}>{formatTime(turn.startMs)}</span>
        </button>

        {isEditMode ? (
          <textarea
            ref={textareaRef}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onBlur={handleTextBlur}
            onInput={handleTextInput}
            rows={1}
            aria-label={t("editor.turnTextAria")}
            className={textarea}
          />
        ) : (
          <p className={text}>
            {searchQuery ? highlightText(turn.text, searchQuery) : turn.text}
          </p>
        )}
      </div>

      {speakerDialogOpen && (
        <SpeakerDialog
          open={speakerDialogOpen}
          onOpenChange={setSpeakerDialogOpen}
          transcription={transcription}
          turn={turn}
          speaker={speaker}
        />
      )}
    </>
  );
}
