import { useMemo, useRef, useState } from "react";

import AudioPlayer, { AudioPlayerHandle } from "@/components/audio-player";
import Switch from "@/components/switch";
import { styled } from "@/styles/stitches.config";
import type { Transcription } from "@/types/transcription";
import TurnBlock from "./TurnBlock";
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
});

const SearchInput = styled("input", {
  width: "711px",
  maxWidth: "100%",
  border: "1px solid #BCBAB8",
  borderRadius: "24px",
  padding: "12px 20px",
  fontFamily: "$primary",
  fontSize: "16px",
  lineHeight: "22px",
  color: "$textDefault",
  backgroundColor: "#FFFFFF",
  outline: "none",
  boxSizing: "border-box",

  "&::placeholder": {
    color: "#9F99A5",
  },

  "&:focus": {
    borderColor: "#3F479D",
  },
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

  const speakerMap = useMemo(
    () =>
      Object.fromEntries(transcription.speakers.map((s) => [s.id, s])),
    [transcription.speakers],
  );

  const activeTurnId = useActiveTurn(transcription.turns, currentMs);

  const handleSeekTo = (ms: number) => {
    playerRef.current?.seekTo(ms);
  };

  return (
    <EditorWrap>
      <EditorHeader>
        <Title>{transcription.title}</Title>
        <ToolBar>
          <SearchInput
            type="text"
            placeholder="Buscar"
            aria-label="Buscar en la transcripción"
          />
          <Switch
            checked={isEditMode}
            onCheckedChange={onEditModeChange}
            label="Modo Edición"
          />
        </ToolBar>
      </EditorHeader>

      <EditorBody>
        {transcription.turns.map((turn) => {
          const speaker = speakerMap[turn.speakerId];
          if (!speaker) return null;

          return (
            <TurnBlock
              key={turn.id}
              turn={turn}
              speaker={speaker}
              isActive={turn.id === activeTurnId}
              isEditMode={isEditMode}
              onSeekTo={handleSeekTo}
            />
          );
        })}
      </EditorBody>

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
