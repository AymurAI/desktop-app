import { useCallback, useMemo, useRef, useState } from "react";

import { CaretLeft, CaretRight, MagnifyingGlass } from "phosphor-react";
import AudioPlayer, { AudioPlayerHandle } from "@/components/audio-player";
import Switch from "@/components/switch";
import { styled } from "@/styles/stitches.config";
import type { Transcription } from "@/types/transcription";
import TurnBlock from "./TurnBlock";
import AddTurnButton from "./AddTurnButton";
import SuggestedSpeakersPanel from "./SuggestedSpeakersPanel";
import { useActiveTurn } from "./useActiveTurn";

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

const EditorWrap = styled("div", {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  overflow: "hidden",
});

const EditorHeader = styled("div", {
  backgroundColor: "#FFFFFF",
  borderBottom: "1px solid #BCBAB8",
  padding: "42px 48px 24px",
  flexShrink: 0,
});

const Title = styled("h1", {
  fontFamily: "$primary",
  fontWeight: "$strong",
  fontSize: "32px",
  lineHeight: "38px",
  color: "#110041",
  margin: 0,
  padding: 0,
});

const ToolBar = styled("div", {
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "16px",
  gap: "16px",
});

const SearchWrapper = styled("div", {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  flex: 1,
  maxWidth: "711px",
  border: "1px solid #BCBAB8",
  borderRadius: "24px",
  padding: "8px 16px",
  backgroundColor: "#FFFFFF",
  gap: "8px",
  boxSizing: "border-box",

  "&:focus-within": {
    borderColor: "#3F479D",
  },
});

const SearchInput = styled("input", {
  flex: 1,
  border: "none",
  outline: "none",
  fontFamily: "$primary",
  fontSize: "16px",
  lineHeight: "22px",
  color: "$textDefault",
  backgroundColor: "transparent",

  "&::placeholder": {
    color: "#9F99A5",
  },
});

const SearchCounter = styled("span", {
  fontFamily: "$primary",
  fontSize: "13px",
  lineHeight: "18px",
  color: "#9F99A5",
  whiteSpace: "nowrap",
  flexShrink: 0,
});

const NavButton = styled("button", {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "24px",
  height: "24px",
  border: "none",
  borderRadius: "4px",
  backgroundColor: "transparent",
  cursor: "pointer",
  color: "#625C68",
  padding: 0,
  flexShrink: 0,

  "&:hover": {
    backgroundColor: "rgba(63, 71, 157, 0.08)",
    color: "#3F479D",
  },

  "&:disabled": {
    opacity: 0.3,
    cursor: "default",
    "&:hover": {
      backgroundColor: "transparent",
      color: "#625C68",
    },
  },
});

const EditorContent = styled("div", {
  flex: 1,
  display: "flex",
  flexDirection: "row",
  overflow: "hidden",
});

const EditorBody = styled("div", {
  flex: 1,
  overflowY: "auto",
  padding: "50px",
  display: "flex",
  flexDirection: "column",
  gap: "24px",
  backgroundColor: "#F6F5F7",
});

// ---------------------------------------------------------------------------
// Search match helpers
// ---------------------------------------------------------------------------

interface SearchMatch {
  turnId: string;
  index: number; // match index within the turn text
}

function findMatches(turns: Transcription["turns"], query: string): SearchMatch[] {
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

// ---------------------------------------------------------------------------
// Props & Component
// ---------------------------------------------------------------------------

interface TranscriptionEditorProps {
  transcription: Transcription;
  isEditMode: boolean;
  onEditModeChange: (val: boolean) => void;
}

function TranscriptionEditor({
  transcription,
  isEditMode,
  onEditModeChange,
}: TranscriptionEditorProps) {
  const [currentMs, setCurrentMs] = useState(0);
  const playerRef = useRef<AudioPlayerHandle>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);

  // Edit mode state
  const [selectedTurnId, setSelectedTurnId] = useState<string | null>(null);

  // Ref map for turn elements (for scroll-into-view)
  const turnRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const setTurnRef = useCallback(
    (turnId: string) => (el: HTMLDivElement | null) => {
      if (el) {
        turnRefsMap.current.set(turnId, el);
      } else {
        turnRefsMap.current.delete(turnId);
      }
    },
    [],
  );

  const speakerMap = useMemo(
    () => Object.fromEntries(transcription.speakers.map((s) => [s.id, s])),
    [transcription.speakers],
  );

  const activeTurnId = useActiveTurn(transcription.turns, currentMs);

  const handleSeekTo = (ms: number) => {
    playerRef.current?.seekTo(ms);
  };

  // Search matches
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setMatchIndex(0);
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
    setSelectedTurnId((prev) => (prev === turnId ? null : turnId));
  };

  return (
    <EditorWrap>
      <EditorHeader>
        <Title>{transcription.title}</Title>
        <ToolBar>
          <SearchWrapper>
            <MagnifyingGlass size={20} color="#9F99A5" weight="bold" />
            <SearchInput
              type="text"
              placeholder="Buscar"
              aria-label="Buscar en la transcripción"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <>
                <SearchCounter>
                  {matches.length > 0
                    ? `${safeMatchIndex + 1} / ${matches.length}`
                    : "0 / 0"}
                </SearchCounter>
                <NavButton
                  onClick={handlePrev}
                  disabled={matches.length === 0}
                  aria-label="Resultado anterior"
                  type="button"
                >
                  <CaretLeft size={16} weight="bold" />
                </NavButton>
                <NavButton
                  onClick={handleNext}
                  disabled={matches.length === 0}
                  aria-label="Resultado siguiente"
                  type="button"
                >
                  <CaretRight size={16} weight="bold" />
                </NavButton>
              </>
            )}
          </SearchWrapper>

          <Switch
            checked={isEditMode}
            onCheckedChange={onEditModeChange}
            label="Modo Edición"
          />
        </ToolBar>
      </EditorHeader>

      <EditorContent>
        <EditorBody>
          {transcription.turns.map((turn, index) => {
            const speaker = speakerMap[turn.speakerId];
            if (!speaker) return null;

            return (
              <div key={turn.id} style={{ display: "contents" }}>
                <TurnBlock
                  turn={turn}
                  speaker={speaker}
                  transcription={transcription}
                  isActive={turn.id === activeTurnId}
                  isEditMode={isEditMode}
                  isSelected={turn.id === selectedTurnId}
                  searchQuery={searchQuery}
                  onSeekTo={handleSeekTo}
                  onSelect={handleTurnSelect}
                  turnRef={setTurnRef(turn.id)}
                />

                {isEditMode && index < transcription.turns.length - 1 && (
                  <AddTurnButton
                    transcriptionId={transcription.id}
                    afterTurn={turn}
                  />
                )}
              </div>
            );
          })}

          {/* Add turn button after the last turn */}
          {isEditMode && transcription.turns.length > 0 && (
            <AddTurnButton
              transcriptionId={transcription.id}
              afterTurn={transcription.turns[transcription.turns.length - 1]}
            />
          )}
        </EditorBody>

        {isEditMode && (
          <SuggestedSpeakersPanel
            transcription={transcription}
            selectedTurnId={selectedTurnId}
          />
        )}
      </EditorContent>

      <AudioPlayer
        ref={playerRef}
        src={transcription.audioObjectUrl}
        durationMs={transcription.audioDurationMs}
        onTimeUpdate={(ms) => setCurrentMs(ms)}
      />
    </EditorWrap>
  );
}

export default TranscriptionEditor;
