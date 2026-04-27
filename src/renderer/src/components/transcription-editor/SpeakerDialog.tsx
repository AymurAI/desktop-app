import { useState } from "react";

import Button from "@/components/button";
import Dialog from "@/components/dialog";
import SpeakerAvatar from "@/components/speaker-avatar";
import { useTranscriptionDispatch } from "@/hooks/useTranscriptions";
import {
  addSpeaker,
  reassignTurnSpeaker,
  renameSpeakerGlobal,
  updateTurnStartMs,
} from "@/reducers/transcription/actions";
import { styled } from "@/styles/stitches.config";
import type {
  Speaker,
  SpeakerColor,
  Transcription,
  Turn,
} from "@/types/transcription";
import { formatMs } from "./formatMs";

// Parses "mm:ss" or "hh:mm:ss" into milliseconds. Returns null on invalid input.
function parseTimestampToMs(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d{1,3}(?::\d{1,2}){1,2}$/.test(trimmed)) return null;
  const parts = trimmed.split(":").map((p) => Number.parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;
  let h = 0;
  let m = 0;
  let s = 0;
  if (parts.length === 2) [m, s] = parts;
  else [h, m, s] = parts;
  if (m > 59 || s > 59) return null;
  return ((h * 60 + m) * 60 + s) * 1000;
}

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

const Section = styled("div", {
  marginBottom: "24px",
});

const SectionTitle = styled("h4", {
  fontFamily: "$primary",
  fontWeight: 600,
  fontSize: "14px",
  lineHeight: "18px",
  color: "#625C68",
  margin: "0 0 8px 0",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
});

const HelperText = styled("p", {
  fontFamily: "$primary",
  fontWeight: "$default",
  fontSize: "12px",
  lineHeight: "16px",
  color: "#9F99A5",
  margin: "6px 0 0 0",
});

const RenameRow = styled("div", {
  display: "flex",
  flexDirection: "row",
  gap: "8px",
  alignItems: "center",
});

const RenameInput = styled("input", {
  flex: 1,
  border: "1px solid #BCBAB8",
  borderRadius: "8px",
  padding: "10px 14px",
  fontFamily: "$primary",
  fontSize: "14px",
  lineHeight: "20px",
  color: "#110041",
  outline: "none",
  boxSizing: "border-box",

  "&:focus": {
    borderColor: "#3F479D",
  },
});

const SpeakerList = styled("ul", {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  maxHeight: "240px",
  overflowY: "auto",
});

const SpeakerItem = styled("li", {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: "10px",
  padding: "8px 12px",
  borderRadius: "8px",
  cursor: "pointer",
  border: "2px solid transparent",

  "&:hover": {
    backgroundColor: "rgba(63, 71, 157, 0.06)",
  },

  variants: {
    selected: {
      true: {
        border: "2px solid #3F479D",
        backgroundColor: "rgba(63, 71, 157, 0.06)",
      },
    },
  },
});

const SpeakerItemLabel = styled("span", {
  fontFamily: "$primary",
  fontWeight: "$default",
  fontSize: "14px",
  lineHeight: "20px",
  color: "#110041",
});

const NewSpeakerRow = styled("div", {
  display: "flex",
  flexDirection: "row",
  gap: "8px",
  alignItems: "center",
  marginTop: "8px",
});

const Divider = styled("div", {
  height: "1px",
  backgroundColor: "#BCBAB8",
  margin: "16px 0",
});

// ---------------------------------------------------------------------------
// Color cycling for new speakers
// ---------------------------------------------------------------------------

const SPEAKER_COLORS: SpeakerColor[] = [
  "primary",
  "secondary",
  "warning",
  "success",
];

function pickColor(existingColors: SpeakerColor[]): SpeakerColor {
  for (const color of SPEAKER_COLORS) {
    if (!existingColors.includes(color)) return color;
  }
  return SPEAKER_COLORS[existingColors.length % SPEAKER_COLORS.length];
}

function getInitials(label: string): string {
  const parts = label.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return label.slice(0, 2).toUpperCase();
}

// ---------------------------------------------------------------------------
// Props & Component
// ---------------------------------------------------------------------------

interface SpeakerDialogProps {
  open: boolean;
  onClose: () => void;
  transcription: Transcription;
  turn: Turn;
  speaker: Speaker;
}

function SpeakerDialog({
  open,
  onClose,
  transcription,
  turn,
  speaker,
}: SpeakerDialogProps) {
  const dispatch = useTranscriptionDispatch();
  const [renameValue, setRenameValue] = useState(speaker.label);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState(turn.speakerId);
  const [showNewSpeaker, setShowNewSpeaker] = useState(false);
  const [newSpeakerName, setNewSpeakerName] = useState("");
  const [timestampValue, setTimestampValue] = useState(formatMs(turn.startMs));
  const [timestampError, setTimestampError] = useState<string | null>(null);

  const handleRename = () => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    dispatch(renameSpeakerGlobal(transcription.id, speaker.id, trimmed));
    onClose();
  };

  const handleTimestampSave = () => {
    const parsed = parseTimestampToMs(timestampValue);
    if (parsed === null) {
      setTimestampError("Formato inválido. Usá mm:ss o hh:mm:ss.");
      return;
    }
    if (parsed === turn.startMs) {
      onClose();
      return;
    }
    setTimestampError(null);
    dispatch(updateTurnStartMs(transcription.id, turn.id, parsed));
    onClose();
  };

  const handleSelectSpeaker = (speakerId: string) => {
    setSelectedSpeakerId(speakerId);
    setShowNewSpeaker(false);
    dispatch(reassignTurnSpeaker(transcription.id, turn.id, speakerId));
    onClose();
  };

  const handleNewSpeakerConfirm = () => {
    const trimmed = newSpeakerName.trim();
    if (!trimmed) return;
    const existingColors = transcription.speakers.map((s) => s.color);
    const color = pickColor(existingColors);
    const newSpeaker: Speaker = {
      id: crypto.randomUUID(),
      label: trimmed,
      initials: getInitials(trimmed),
      color,
    };
    dispatch(addSpeaker(transcription.id, newSpeaker));
    dispatch(reassignTurnSpeaker(transcription.id, turn.id, newSpeaker.id));
    onClose();
  };

  return (
    <Dialog isOpen={open} title="Editar locutor" onClose={onClose}>
      {/* Section A: Rename globally */}
      <Section>
        <SectionTitle>Renombrar globalmente</SectionTitle>
        <RenameRow>
          <RenameInput
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
            }}
            aria-label="Nuevo nombre del locutor"
          />
          <Button variant="primary" size="s" onClick={handleRename}>
            Renombrar
          </Button>
        </RenameRow>
        <HelperText>Cambia el nombre en todos los turnos</HelperText>
      </Section>

      <Divider />

      {/* Section: Edit timestamp */}
      <Section>
        <SectionTitle>Marca de tiempo</SectionTitle>
        <RenameRow>
          <RenameInput
            value={timestampValue}
            onChange={(e) => {
              setTimestampValue(e.target.value);
              if (timestampError) setTimestampError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTimestampSave();
            }}
            placeholder="mm:ss"
            inputMode="numeric"
            aria-label="Marca de tiempo del turno"
          />
          <Button variant="primary" size="s" onClick={handleTimestampSave}>
            Guardar
          </Button>
        </RenameRow>
        <HelperText css={timestampError ? { color: "#DC3545" } : undefined}>
          {timestampError ??
            "Formato mm:ss o hh:mm:ss. Cambia el inicio de este turno."}
        </HelperText>
      </Section>

      <Divider />

      {/* Section B: Change this turn */}
      <Section>
        <SectionTitle>Cambiar este turno</SectionTitle>
        <SpeakerList>
          {transcription.speakers.map((s) => (
            <SpeakerItem
              key={s.id}
              selected={s.id === selectedSpeakerId && !showNewSpeaker}
              onClick={() => handleSelectSpeaker(s.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectSpeaker(s.id);
                }
              }}
            >
              <SpeakerAvatar speaker={s} size="sm" />
              <SpeakerItemLabel>{s.label}</SpeakerItemLabel>
            </SpeakerItem>
          ))}

          {/* New speaker option */}
          <SpeakerItem
            selected={showNewSpeaker}
            onClick={() => setShowNewSpeaker(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setShowNewSpeaker(true);
              }
            }}
          >
            <SpeakerAvatar
              speaker={{ initials: "+", color: "secondary" }}
              size="sm"
            />
            <SpeakerItemLabel>Nuevo locutor</SpeakerItemLabel>
          </SpeakerItem>
        </SpeakerList>

        {showNewSpeaker && (
          <NewSpeakerRow>
            <RenameInput
              placeholder="Nombre del nuevo locutor"
              value={newSpeakerName}
              onChange={(e) => setNewSpeakerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNewSpeakerConfirm();
              }}
              autoFocus
              aria-label="Nombre del nuevo locutor"
            />
            <Button
              variant="primary"
              size="s"
              onClick={handleNewSpeakerConfirm}
            >
              Agregar
            </Button>
          </NewSpeakerRow>
        )}
      </Section>
    </Dialog>
  );
}

export default SpeakerDialog;
