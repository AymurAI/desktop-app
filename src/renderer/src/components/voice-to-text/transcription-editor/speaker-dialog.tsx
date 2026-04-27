import { useState } from "react";
import { useTranslation } from "react-i18next";

import Button from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTranscriptionDispatch } from "@/hooks/useTranscriptions";
import {
  addSpeaker,
  reassignTurnSpeaker,
  renameSpeakerGlobal,
  updateTurnStartMs,
} from "@/reducers/transcription/actions";
import { css, cva } from "@/styled/css";
import type {
  Speaker,
  SpeakerColor,
  Transcription,
  Turn,
} from "@/types/transcription";
import { formatTime } from "../format-time";
import SpeakerAvatar from "../speaker-avatar";

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

const section = css({ mb: "6" });

const sectionTitle = css({
  fontSize: "[14px]",
  lineHeight: "[18px]",
  fontWeight: "[600]",
  color: "text.lighter",
  m: "[0]",
  mb: "2",
  textTransform: "uppercase",
  letterSpacing: "[0.05em]",
});

const helper = cva({
  base: {
    fontSize: "[12px]",
    lineHeight: "[16px]",
    color: "[#9F99A5]",
    m: "[0]",
    mt: "[6px]",
  },
  variants: {
    error: {
      true: { color: "system.error" },
      false: {},
    },
  },
});

const row = css({
  display: "flex",
  flexDir: "row",
  gap: "2",
  alignItems: "center",
});

const inputBox = css({
  flex: "[1]",
  borderWidth: "[1px]",
  borderStyle: "solid",
  borderColor: "[#BCBAB8]",
  rounded: "lg",
  px: "[14px]",
  py: "[10px]",
  fontSize: "[14px]",
  lineHeight: "[20px]",
  color: "text.default",
  outline: "none",
  boxSizing: "border-box",
  "&:focus": { borderColor: "brand.primary" },
});

const list = css({
  listStyle: "none",
  m: "[0]",
  p: "[0]",
  display: "flex",
  flexDir: "column",
  gap: "1",
  maxHeight: "[240px]",
  overflowY: "auto",
});

const item = cva({
  base: {
    display: "flex",
    flexDir: "row",
    alignItems: "center",
    gap: "[10px]",
    px: "3",
    py: "2",
    width: "full",
    textAlign: "left",
    rounded: "lg",
    cursor: "pointer",
    borderWidth: "[2px]",
    borderStyle: "solid",
    borderColor: "transparent",
    bg: "transparent",
    "&:hover": { bg: "[rgba(63, 71, 157, 0.06)]" },
  },
  variants: {
    selected: {
      true: {
        borderColor: "brand.primary",
        bg: "[rgba(63, 71, 157, 0.06)]",
      },
      false: {},
    },
  },
});

const itemLabel = css({
  fontSize: "[14px]",
  lineHeight: "[20px]",
  color: "text.default",
});

const newSpeakerRow = css({
  display: "flex",
  flexDir: "row",
  gap: "2",
  alignItems: "center",
  mt: "2",
});

const divider = css({
  height: "[1px]",
  bg: "[#BCBAB8]",
  my: "4",
});

interface SpeakerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transcription: Transcription;
  turn: Turn;
  speaker: Speaker;
}

export default function SpeakerDialog({
  open,
  onOpenChange,
  transcription,
  turn,
  speaker,
}: SpeakerDialogProps) {
  const { t } = useTranslation("voice-to-text");
  const dispatch = useTranscriptionDispatch();

  const [renameValue, setRenameValue] = useState(speaker.label);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState(turn.speakerId);
  const [showNewSpeaker, setShowNewSpeaker] = useState(false);
  const [newSpeakerName, setNewSpeakerName] = useState("");
  const [timestampValue, setTimestampValue] = useState(
    formatTime(turn.startMs),
  );
  const [timestampError, setTimestampError] = useState<string | null>(null);

  const close = () => onOpenChange(false);

  const handleRename = () => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    dispatch(renameSpeakerGlobal(transcription.id, speaker.id, trimmed));
    close();
  };

  const handleTimestampSave = () => {
    const parsed = parseTimestampToMs(timestampValue);
    if (parsed === null) {
      setTimestampError(t("speakerDialog.timestampInvalid"));
      return;
    }
    if (parsed === turn.startMs) {
      close();
      return;
    }
    setTimestampError(null);
    dispatch(updateTurnStartMs(transcription.id, turn.id, parsed));
    close();
  };

  const handleSelectSpeaker = (speakerId: string) => {
    setSelectedSpeakerId(speakerId);
    setShowNewSpeaker(false);
    dispatch(reassignTurnSpeaker(transcription.id, turn.id, speakerId));
    close();
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
    close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t("speakerDialog.title")}</DialogTitle>

        <div className={section}>
          <h4 className={sectionTitle}>{t("speakerDialog.renameSection")}</h4>
          <div className={row}>
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
              }}
              aria-label={t("speakerDialog.renameAria")}
              className={inputBox}
            />
            <Button variant="primary" size="sm" onClick={handleRename}>
              {t("speakerDialog.renameButton")}
            </Button>
          </div>
          <p className={helper({ error: false })}>
            {t("speakerDialog.renameHelper")}
          </p>
        </div>

        <div className={divider} />

        <div className={section}>
          <h4 className={sectionTitle}>
            {t("speakerDialog.timestampSection")}
          </h4>
          <div className={row}>
            <input
              value={timestampValue}
              onChange={(e) => {
                setTimestampValue(e.target.value);
                if (timestampError) setTimestampError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTimestampSave();
              }}
              placeholder={t("speakerDialog.timestampPlaceholder")}
              inputMode="numeric"
              aria-label={t("speakerDialog.timestampAria")}
              className={inputBox}
            />
            <Button variant="primary" size="sm" onClick={handleTimestampSave}>
              {t("speakerDialog.timestampSave")}
            </Button>
          </div>
          <p className={helper({ error: !!timestampError })}>
            {timestampError ?? t("speakerDialog.timestampHelper")}
          </p>
        </div>

        <div className={divider} />

        <div className={section}>
          <h4 className={sectionTitle}>{t("speakerDialog.changeSection")}</h4>
          <ul className={list}>
            {transcription.speakers.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => handleSelectSpeaker(s.id)}
                  className={item({
                    selected: s.id === selectedSpeakerId && !showNewSpeaker,
                  })}
                >
                  <SpeakerAvatar speaker={s} size="sm" />
                  <span className={itemLabel}>{s.label}</span>
                </button>
              </li>
            ))}

            <li>
              <button
                type="button"
                onClick={() => setShowNewSpeaker(true)}
                className={item({ selected: showNewSpeaker })}
              >
                <SpeakerAvatar
                  speaker={{ initials: "+", color: "secondary" }}
                  size="sm"
                />
                <span className={itemLabel}>
                  {t("speakerDialog.newSpeaker")}
                </span>
              </button>
            </li>
          </ul>

          {showNewSpeaker && (
            <div className={newSpeakerRow}>
              <input
                placeholder={t("speakerDialog.newSpeakerPlaceholder")}
                value={newSpeakerName}
                onChange={(e) => setNewSpeakerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNewSpeakerConfirm();
                }}
                ref={(el) => el?.focus()}
                aria-label={t("speakerDialog.newSpeakerAria")}
                className={inputBox}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleNewSpeakerConfirm}
              >
                {t("speakerDialog.newSpeakerAdd")}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
