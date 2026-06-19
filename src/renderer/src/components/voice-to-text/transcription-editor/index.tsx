import {
  CaretLeft,
  CaretRight,
  Info,
  MagnifyingGlass,
  PencilSimple,
} from "phosphor-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { useTranscriptionDispatch } from "@/hooks/useTranscriptions";
import { renameTranscription } from "@/reducers/transcription/actions";
import { css } from "@/styled/css";
import type { Transcription } from "@/types/transcription";
import { Switch } from "@aymurai/ui";
import AudioPlayer, { type AudioPlayerHandle } from "../audio-player";
import { useActiveTurn } from "../use-active-turn";
import { SelectionToolbar, useSelectionAssign } from "./selection-toolbar";
import TurnBlock from "./turn-block";
import TurnSidePanel from "./turn-side-panel";

const wrap = css({
  display: "flex",
  flexDir: "column",
  height: "full",
  overflow: "hidden",
});

const header = css({
  bg: "bg.secondary",
  borderBottomWidth: "[1px]",
  borderBottomStyle: "solid",
  borderBottomColor: "[#BCBAB8]",
  pt: "[42px]",
  pb: "6",
  px: "12",
  flexShrink: "0",
});

const titleText = css({
  fontSize: "[32px]",
  lineHeight: "[38px]",
  fontWeight: "[600]",
  color: "text.default",
  m: "[0]",
  p: "[0]",
});

const toolBar = css({
  display: "flex",
  flexDir: "row",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "4",
});

const searchWrapper = css({
  display: "flex",
  flexDir: "row",
  alignItems: "center",
  flex: "[1]",
  maxWidth: "[711px]",
  borderWidth: "[1px]",
  borderStyle: "solid",
  borderColor: "[#BCBAB8]",
  rounded: "[24px]",
  px: "4",
  py: "2",
  bg: "bg.secondary",
  gap: "2",
  boxSizing: "border-box",
  "&:focus-within": { borderColor: "brand.primary" },
});

const searchInput = css({
  flex: "[1]",
  border: "[none]",
  outline: "none",
  fontSize: "[16px]",
  lineHeight: "[22px]",
  color: "text.default",
  bg: "transparent",
  "&::placeholder": { color: "[#9F99A5]" },
});

const searchCounter = css({
  fontSize: "[13px]",
  lineHeight: "[18px]",
  color: "[#9F99A5]",
  whiteSpace: "nowrap",
  flexShrink: "0",
});

const navButton = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "6",
  height: "6",
  border: "[none]",
  rounded: "[4px]",
  bg: "transparent",
  cursor: "pointer",
  color: "text.lighter",
  p: "[0]",
  flexShrink: "0",
  "&:hover": {
    bg: "[rgba(63, 71, 157, 0.08)]",
    color: "brand.primary",
  },
  "&:disabled": {
    opacity: "0.3",
    cursor: "default",
    "&:hover": { bg: "transparent", color: "text.lighter" },
  },
});

const switchLabel = css({
  fontSize: "[14px]",
  color: "text.default",
  display: "flex",
  alignItems: "center",
  gap: "2",
  cursor: "pointer",
});

const body = css({
  flex: "[1]",
  overflowY: "auto",
  p: "12",
  display: "flex",
  flexDir: "column",
  gap: "6",
  bg: "bg.primary",
  position: "relative",
});

const content = css({
  flex: "[1]",
  display: "flex",
  flexDir: "row",
  overflow: "hidden",
});

const titleRow = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  mt: "0",
});

const titleSection = css({
  bg: "bg.primary",
  px: "12",
  pt: "6",
  flexShrink: "0",
});

const titleInput = css({
  fontSize: "[32px]",
  lineHeight: "[38px]",
  fontWeight: "[600]",
  color: "text.default",
  border: "[none]",
  borderBottomWidth: "[2px]",
  borderBottomStyle: "solid",
  borderBottomColor: "brand.primary",
  outline: "none",
  bg: "transparent",
  m: "[0]",
  p: "[0]",
});

const editIconButton = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "[none]",
  bg: "transparent",
  cursor: "pointer",
  color: "text.lighter",
  p: "1",
  rounded: "[4px]",
  "&:hover": { color: "brand.primary" },
});

const editBanner = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  mt: "4",
  px: "4",
  py: "3",
  rounded: "md",
  bg: "bg.secondary-highlight",
  color: "text.default",
  fontSize: "[14px]",
});

interface SearchMatch {
  turnId: string;
  index: number;
}

function findMatches(
  turns: Transcription["turns"],
  query: string,
): SearchMatch[] {
  if (!query) return [];
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "gi");
  const matches: SearchMatch[] = [];
  for (const turn of turns) {
    let match: RegExpExecArray | null;
    // biome-ignore lint/suspicious/noAssignInExpressions: standard regex iteration pattern
    while ((match = regex.exec(turn.text)) !== null) {
      matches.push({ turnId: turn.id, index: match.index });
    }
  }
  return matches;
}

function EditableTitle({
  title,
  onRename,
}: {
  title: string;
  onRename: (value: string) => void;
}) {
  const { t } = useTranslation("voice-to-text");
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  const prevTitle = useRef(title);
  if (prevTitle.current !== title) {
    prevTitle.current = title;
    setValue(title);
  }

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== title) onRename(trimmed);
    else setValue(title);
    setEditing(false);
  };

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  if (editing) {
    return (
      <div className={titleRow}>
        <input
          ref={inputRef}
          className={titleInput}
          value={value}
          aria-label={t("editor.titleInputAria")}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setValue(title);
              setEditing(false);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className={titleRow}>
      <h1 className={titleText}>{title}</h1>
      <button
        type="button"
        className={editIconButton}
        onClick={() => setEditing(true)}
        aria-label={t("editor.editTitleAria")}
      >
        <PencilSimple size={20} />
      </button>
    </div>
  );
}

interface TranscriptionEditorProps {
  transcription: Transcription;
  isEditMode: boolean;
  onEditModeChange: (val: boolean) => void;
  footerActions?: ReactNode;
}

export default function TranscriptionEditor({
  transcription,
  isEditMode,
  onEditModeChange,
  footerActions,
}: TranscriptionEditorProps) {
  const { t } = useTranslation("voice-to-text");
  const dispatch = useTranscriptionDispatch();

  const [currentMs, setCurrentMs] = useState(0);
  const playerRef = useRef<AudioPlayerHandle>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);
  const [selectedTurnId, setSelectedTurnId] = useState<string | null>(null);

  const turnRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const setTurnRef = useCallback(
    (turnId: string) => (el: HTMLDivElement | null) => {
      if (el) turnRefsMap.current.set(turnId, el);
      else turnRefsMap.current.delete(turnId);
    },
    [],
  );

  const speakerMap = useMemo(
    () => Object.fromEntries(transcription.speakers.map((s) => [s.id, s])),
    [transcription.speakers],
  );

  const activeTurnId = useActiveTurn(transcription.turns, currentMs);

  const sa = useSelectionAssign(scrollRef, transcription);

  const handleSeekTo = (ms: number) => {
    playerRef.current?.seekTo(ms);
  };

  const matches = useMemo(
    () => findMatches(transcription.turns, searchQuery),
    [transcription.turns, searchQuery],
  );

  const safeMatchIndex = matches.length > 0 ? matchIndex % matches.length : 0;

  const scrollToMatch = (idx: number) => {
    if (matches.length === 0) return;
    const match = matches[idx % matches.length];
    const el = turnRefsMap.current.get(match.turnId);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    const newIdx = (safeMatchIndex - 1 + matches.length) % matches.length;
    setMatchIndex(newIdx);
    scrollToMatch(newIdx);
  };

  const handleNext = () => {
    if (matches.length === 0) return;
    const newIdx = (safeMatchIndex + 1) % matches.length;
    setMatchIndex(newIdx);
    scrollToMatch(newIdx);
  };

  const handleTurnSelect = (turnId: string) => {
    setSelectedTurnId(turnId);
  };

  // Clear the selected turn when leaving edit mode so re-entering doesn't
  // reopen the side panel on a stale turn.
  useEffect(() => {
    if (!isEditMode) setSelectedTurnId(null);
  }, [isEditMode]);

  const switchId = "transcription-edit-mode";

  return (
    <div className={wrap}>
      <div className={header}>
        <div className={toolBar}>
          <div className={searchWrapper}>
            <MagnifyingGlass size={20} color="#9F99A5" weight="bold" />
            <input
              type="text"
              placeholder={t("editor.searchPlaceholder")}
              aria-label={t("editor.searchAria")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setMatchIndex(0);
              }}
              className={searchInput}
            />
            {searchQuery && (
              <>
                <span className={searchCounter}>
                  {matches.length > 0
                    ? `${safeMatchIndex + 1} / ${matches.length}`
                    : "0 / 0"}
                </span>
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={matches.length === 0}
                  aria-label={t("editor.prevResult")}
                  className={navButton}
                >
                  <CaretLeft size={16} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={matches.length === 0}
                  aria-label={t("editor.nextResult")}
                  className={navButton}
                >
                  <CaretRight size={16} weight="bold" />
                </button>
              </>
            )}
          </div>

          <label className={switchLabel} htmlFor={switchId}>
            <Switch
              id={switchId}
              checked={isEditMode}
              onCheckedChange={onEditModeChange}
            />
            <span>{t("editor.editMode")}</span>
          </label>
        </div>
      </div>

      <div className={titleSection}>
        <EditableTitle
          title={transcription.title}
          onRename={(value) =>
            dispatch(renameTranscription(transcription.id, value))
          }
        />

        {isEditMode && (
          <div className={editBanner}>
            <Info size={20} color="#3F479D" />
            <span>{t("editor.editModeBanner")}</span>
          </div>
        )}
      </div>

      <div className={content}>
        <div ref={scrollRef} className={body}>
          {transcription.turns.map((turn) => {
            const speaker = speakerMap[turn.speakerId];
            if (!speaker) return null;

            return (
              <TurnBlock
                key={turn.id}
                turn={turn}
                speaker={speaker}
                transcription={transcription}
                isActive={turn.id === activeTurnId}
                isEditMode={isEditMode}
                isSelected={turn.id === selectedTurnId}
                searchQuery={searchQuery}
                onSeekTo={handleSeekTo}
                onSelect={handleTurnSelect}
                onTextSelect={sa.onSelect}
                turnRef={setTurnRef(turn.id)}
              />
            );
          })}

          {isEditMode && (
            <SelectionToolbar
              sel={sa.sel}
              transcription={transcription}
              onAssign={(speakerId) => {
                sa.assign(speakerId);
                setSelectedTurnId(null);
              }}
              onClose={sa.clear}
            />
          )}
        </div>
        {isEditMode && (
          <TurnSidePanel
            transcription={transcription}
            activeTurnId={selectedTurnId}
          />
        )}
      </div>

      <AudioPlayer
        ref={playerRef}
        src={transcription.audioObjectUrl}
        durationMs={transcription.audioDurationMs}
        onTimeUpdate={(ms) => setCurrentMs(ms)}
        rightSlot={footerActions}
      />
    </div>
  );
}
