import { Info, PencilSimple } from "phosphor-react";
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
import { css, cx } from "@/styled/css";
import type { Transcription } from "@/types/transcription";
import { Switch, Toolbar, TranscriptBlock } from "@aymurai/ui";
import AudioPlayer, { type AudioPlayerHandle } from "../audio-player";
import { formatTime } from "../format-time";
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

const titleText = css({
  fontSize: "[32px]",
  lineHeight: "[38px]",
  fontWeight: "[600]",
  color: "text.default",
  m: "[0]",
  p: "[0]",
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
  bg: "bg.secondary",
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
  bg: "bg.secondary",
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

// Read-mode transcript block: clickable (seeks the player to the turn) and
// gently highlighted while it is the turn currently playing.
const readBlock = css({
  cursor: "pointer",
  rounded: "md",
  transition: "[background-color 0.15s ease]",
  "&:hover": { bg: "[rgba(63, 71, 157, 0.04)]" },
});

const readBlockActive = css({
  bg: "[rgba(197, 202, 255, 0.15)]",
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
  const [editingTurnId, setEditingTurnId] = useState<string | null>(null);

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

  // Follow-along: keep the turn currently playing in view as the playhead
  // advances. Keyed on activeTurnId (which only changes when playback crosses
  // into a new turn), so it scrolls on play / seek but stays out of the way
  // while the audio is paused. Paused entirely while the user is typing in a
  // turn's text (editingTurnId set) so correcting a turn doesn't get yanked
  // out of view by unrelated playback — it resumes as soon as the field
  // blurs.
  useEffect(() => {
    if (!activeTurnId || editingTurnId) return;
    turnRefsMap.current
      .get(activeTurnId)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeTurnId, editingTurnId]);

  const handleEditingFocusChange = useCallback(
    (turnId: string, isFocused: boolean) => {
      setEditingTurnId((current) => {
        if (isFocused) return turnId;
        return current === turnId ? null : current;
      });
    },
    [],
  );

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
    if (!isEditMode) {
      setSelectedTurnId(null);
      setEditingTurnId(null);
    }
  }, [isEditMode]);

  const switchId = "transcription-edit-mode";

  return (
    <div className={wrap}>
      <Toolbar
        context="search-switch"
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setMatchIndex(0);
        }}
        searchPlaceholder={t("editor.searchPlaceholder")}
        searchAriaLabel={t("editor.searchAria")}
        searchLabels={{
          clear: t("editor.clearSearch"),
          previous: t("editor.prevResult"),
          next: t("editor.nextResult"),
        }}
        searchResultCount={
          searchQuery
            ? matches.length > 0
              ? `${safeMatchIndex + 1} de ${matches.length}`
              : "0 de 0"
            : undefined
        }
        onSearchPrev={handlePrev}
        onSearchNext={handleNext}
        onSearchClear={() => {
          setSearchQuery("");
          setMatchIndex(0);
        }}
        rightSlot={
          <label className={switchLabel} htmlFor={switchId}>
            <Switch
              id={switchId}
              checked={isEditMode}
              onCheckedChange={onEditModeChange}
            />
            <span>{t("editor.editMode")}</span>
          </label>
        }
      />

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

            // Read mode → @aymurai/ui TranscriptBlock (Figma display component).
            // Wrapped in a ref'd div so search scroll-to-match and the
            // playback follow-along both work. Clicking a block seeks the
            // player to that turn; the active turn is highlighted.
            if (!isEditMode) {
              const isActive = turn.id === activeTurnId;
              return (
                <div key={turn.id} ref={setTurnRef(turn.id)}>
                  <TranscriptBlock
                    initials={speaker.initials}
                    name={speaker.label}
                    time={formatTime(turn.startMs)}
                    text={turn.text}
                    highlight={searchQuery}
                    color={speaker.color}
                    className={cx(readBlock, isActive && readBlockActive)}
                    role="button"
                    tabIndex={0}
                    aria-label={t("editor.seekToTurn", {
                      time: formatTime(turn.startMs),
                    })}
                    onClick={() => handleSeekTo(turn.startMs)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSeekTo(turn.startMs);
                      }
                    }}
                  />
                </div>
              );
            }

            return (
              <TurnBlock
                key={turn.id}
                turn={turn}
                speaker={speaker}
                transcription={transcription}
                isActive={turn.id === activeTurnId}
                isSelected={turn.id === selectedTurnId}
                isEditing={turn.id === editingTurnId}
                highlight={searchQuery}
                onSeekTo={handleSeekTo}
                onSelect={handleTurnSelect}
                onTextSelect={sa.onSelect}
                onEditingFocusChange={handleEditingFocusChange}
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
