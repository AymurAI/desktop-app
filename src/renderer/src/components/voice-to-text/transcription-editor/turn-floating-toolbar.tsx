import { ArrowLineUp, CaretDown, Clock, Plus, Trash } from "phosphor-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatTime } from "@/components/voice-to-text/format-time";
import SpeakerAvatar from "@/components/voice-to-text/speaker-avatar";
import { useTranscriptionDispatch } from "@/hooks/useTranscriptions";
import {
  insertTurn,
  mergeTurnWithPrevious,
  reassignTurnSpeaker,
  removeTurn,
  updateTurnStartMs,
} from "@/reducers/transcription/actions";
import { css } from "@/styled/css";
import type { Transcription, Turn } from "@/types/transcription";
import SpeakerPicker from "./speaker-picker";

// ---------------------------------------------------------------------------
// mm:ss / hh:mm:ss timestamp parser (previously shared with the removed speaker dialog).
// Parses "mm:ss" or "hh:mm:ss" into milliseconds. Returns null on invalid input.
// ---------------------------------------------------------------------------
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
// Styles
// ---------------------------------------------------------------------------

const toolbarRoot = css({
  position: "absolute",
  // NOTE: top:-14px uses bracketed raw value — no token exists for negative
  // offsets at this specific size.
  top: "[-14px]",
  right: "0",
  zIndex: "30",
  display: "flex",
  alignItems: "center",
  // NOTE: gap:2px — bracketed raw value; nearest panda spacing (1=4px) is too
  // large for the tight icon row.
  gap: "[2px]",
  bg: "bg.secondary",
  // NOTE: border uses the `primary` token (1px solid #BCBAB8) which matches
  // the spec.
  border: "primary",
  // NOTE: bracketed border-radius — no radius token at 12px.
  borderRadius: "[12px]",
  // NOTE: bracketed padding — no token at 5px.
  padding: "[5px]",
  // NOTE: bracketed box-shadow — no shadow tokens exist in this project.
  boxShadow: "[0 10px 30px rgba(28,26,60,.14)]",
});

const speakerBtn = css({
  display: "flex",
  alignItems: "center",
  // NOTE: gap:2 = 8px in panda spacing scale — matches the ~6–8px intent.
  gap: "2",
  border: "[none]",
  bg: "transparent",
  cursor: "pointer",
  // NOTE: bracketed padding — no 5/10/5/6 token combination.
  padding: "[5px 10px 5px 6px]",
  // NOTE: bracketed border-radius — no 8px radius token.
  borderRadius: "[8px]",
  // NOTE: bracketed font-size — no 14px token (label.sm = 12px, label.md = 16px).
  fontSize: "[14px]",
  fontWeight: "[600]",
  color: "text.default",
  "&:hover": { bg: "bg.primary" },
});

const speakerBtnLabel = css({
  // NOTE: bracketed font-size same reason as above.
  fontSize: "[14px]",
  fontWeight: "[600]",
  color: "text.default",
  whiteSpace: "nowrap",
});

const vertDivider = css({
  // NOTE: bracketed width — no 1px token.
  width: "[1px]",
  // height:6 = 24px in panda scale; original spec says "height:6" which maps
  // exactly to panda's spacing.6 = 24px.
  height: "6",
  bg: "bg.secondary-highlight",
  // NOTE: bracketed margin — no 0 3px token combination.
  margin: "[0 3px]",
  flexShrink: "0",
});

const iconBtn = css({
  // width:8, height:8 = 32px panda spacing — matches spec "8".
  width: "8",
  height: "8",
  // NOTE: bracketed border-radius — 8px not in radius tokens.
  borderRadius: "[8px]",
  border: "[none]",
  bg: "transparent",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "text.lighter",
  "&:hover": { bg: "bg.primary", color: "brand.primary" },
  "&:disabled": { opacity: "[.32]", cursor: "default" },
});

const iconBtnDanger = css({
  width: "8",
  height: "8",
  borderRadius: "[8px]",
  border: "[none]",
  bg: "transparent",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "text.lighter",
  "&:hover": { bg: "system.error-secondary", color: "system.error" },
  "&:disabled": { opacity: "[.32]", cursor: "default" },
});

// TimePopover styles
const timePop = css({
  position: "absolute",
  // NOTE: top:100% is a raw percentage — bracketed.
  top: "[100%]",
  // NOTE: right:0 needs to be raw — bracketed.
  right: "[0]",
  // NOTE: bracketed margin-top — no 6px token.
  marginTop: "[6px]",
  zIndex: "50",
  bg: "bg.secondary",
  // NOTE: bracketed border-radius — no 12px radius token.
  borderRadius: "[12px]",
  // NOTE: bracketed padding — no 10px token.
  padding: "[10px]",
  // NOTE: bracketed box-shadow — no shadow tokens.
  boxShadow: "[0 14px 40px rgba(28,26,60,.18)]",
  display: "flex",
  flexDir: "column",
  gap: "2",
  minWidth: "[160px]",
});

const timeInput = css({
  border: "primary",
  // NOTE: bracketed border-radius — no 8px token.
  borderRadius: "[8px]",
  // NOTE: bracketed padding — no 6px/10px tokens.
  padding: "[6px 10px]",
  // NOTE: bracketed font-size — no 14px token.
  fontSize: "[14px]",
  color: "text.default",
  bg: "bg.primary",
  outline: "none",
  "&:focus": { borderColor: "brand.primary" },
  width: "full",
  boxSizing: "border-box",
});

const timeError = css({
  // NOTE: bracketed font-size — no 12px token.
  fontSize: "[12px]",
  color: "system.error",
  margin: "[0]",
});

const timeSaveBtn = css({
  border: "[none]",
  bg: "brand.primary",
  color: "text.onbutton-alternative",
  // NOTE: bracketed border-radius — no 8px token.
  borderRadius: "[8px]",
  // NOTE: bracketed padding — no 6px/10px token combo.
  padding: "[6px 10px]",
  // NOTE: bracketed font-size — no 14px token.
  fontSize: "[14px]",
  fontWeight: "[600]",
  cursor: "pointer",
  "&:hover": { opacity: "0.85" },
  alignSelf: "flex-end",
});

// SpeakerPicker anchor
const pickerAnchor = css({
  position: "absolute",
  // NOTE: top:100% — bracketed.
  top: "[100%]",
  left: "[0]",
  // NOTE: bracketed margin-top — no 6px token.
  marginTop: "[6px]",
  zIndex: "50",
});

// Wrapper for speaker button + picker popover
const speakerBtnWrap = css({
  position: "relative",
  display: "flex",
  alignItems: "center",
});

// Wrapper for clock button + time popover
const clockBtnWrap = css({
  position: "relative",
  display: "flex",
  alignItems: "center",
});

// ---------------------------------------------------------------------------
// TimePopover sub-component
// ---------------------------------------------------------------------------

interface TimePopoverProps {
  turn: Turn;
  transcription: Transcription;
  onClose: () => void;
}

function TimePopover({ turn, transcription, onClose }: TimePopoverProps) {
  const { t } = useTranslation("voice-to-text");
  const dispatch = useTranscriptionDispatch();
  const [value, setValue] = useState(formatTime(turn.startMs));
  const [error, setError] = useState<string | null>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on outside pointerdown
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("pointerdown", handler, true);
    return () => document.removeEventListener("pointerdown", handler, true);
  }, [onClose]);

  const handleSave = () => {
    const parsed = parseTimestampToMs(value);
    if (parsed === null) {
      setError(t("floatingToolbar.timeInvalid"));
      return;
    }
    dispatch(updateTurnStartMs(transcription.id, turn.id, parsed));
    onClose();
  };

  return (
    <div
      ref={popRef}
      className={timePop}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <input
        ref={inputRef}
        className={timeInput}
        value={value}
        placeholder={t("floatingToolbar.timePlaceholder")}
        inputMode="numeric"
        aria-label={t("floatingToolbar.editTime")}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") onClose();
        }}
      />
      {error && <p className={timeError}>{error}</p>}
      <button type="button" className={timeSaveBtn} onClick={handleSave}>
        {t("floatingToolbar.timeSave")}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TurnFloatingToolbar
// ---------------------------------------------------------------------------

export interface TurnFloatingToolbarProps {
  transcription: Transcription;
  turn: Turn;
  index: number;
}

export default function TurnFloatingToolbar({
  transcription,
  turn,
  index,
}: TurnFloatingToolbarProps) {
  const { t } = useTranslation("voice-to-text");
  const dispatch = useTranscriptionDispatch();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);

  const currentSpeaker = transcription.speakers.find(
    (s) => s.id === turn.speakerId,
  );

  const prevTurn = index > 0 ? transcription.turns[index - 1] : undefined;
  const mergeDisabled = index === 0 || prevTurn?.speakerId !== turn.speakerId;

  const stopProp = (e: React.PointerEvent) => e.stopPropagation();

  return (
    <div
      className={toolbarRoot}
      onPointerDown={stopProp}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Speaker control */}
      <div className={speakerBtnWrap}>
        <button
          type="button"
          className={speakerBtn}
          aria-label={t("floatingToolbar.changeSpeaker")}
          onPointerDown={stopProp}
          onClick={() => {
            setTimeOpen(false);
            setPickerOpen((prev) => !prev);
          }}
        >
          {currentSpeaker && (
            <SpeakerAvatar speaker={currentSpeaker} size="sm" />
          )}
          {currentSpeaker && (
            <span className={speakerBtnLabel}>{currentSpeaker.label}</span>
          )}
          <CaretDown size={12} weight="bold" aria-hidden />
        </button>

        {pickerOpen && (
          <SpeakerPicker
            transcription={transcription}
            currentSpeakerId={turn.speakerId}
            onPick={(speakerId) => {
              dispatch(
                reassignTurnSpeaker(transcription.id, turn.id, speakerId),
              );
              setPickerOpen(false);
            }}
            onClose={() => setPickerOpen(false)}
            className={pickerAnchor}
          />
        )}
      </div>

      {/* 2. Vertical divider */}
      <div className={vertDivider} aria-hidden />

      {/* 3. Timestamp button */}
      <div className={clockBtnWrap}>
        <button
          type="button"
          className={iconBtn}
          aria-label={t("floatingToolbar.editTime")}
          onPointerDown={stopProp}
          onClick={() => {
            setPickerOpen(false);
            setTimeOpen((prev) => !prev);
          }}
        >
          <Clock size={16} weight="regular" aria-hidden />
        </button>

        {timeOpen && (
          <TimePopover
            turn={turn}
            transcription={transcription}
            onClose={() => setTimeOpen(false)}
          />
        )}
      </div>

      {/* 4. Add-below button */}
      <button
        type="button"
        className={iconBtn}
        aria-label={t("floatingToolbar.addBelow")}
        onPointerDown={stopProp}
        onClick={() => {
          dispatch(
            insertTurn(transcription.id, turn.id, {
              id: crypto.randomUUID(),
              speakerId: turn.speakerId,
              text: "",
              startMs: turn.startMs,
              endMs: turn.startMs,
            }),
          );
        }}
      >
        <Plus size={16} weight="regular" aria-hidden />
      </button>

      {/* 5. Merge-previous button
          Icon: ArrowLineUp (ArrowsMerge not available in this phosphor-react version)
          Disabled when index === 0 or previous turn has a different speaker. */}
      <button
        type="button"
        className={iconBtn}
        aria-label={t("floatingToolbar.mergePrev")}
        disabled={mergeDisabled}
        onPointerDown={stopProp}
        onClick={() => {
          dispatch(mergeTurnWithPrevious(transcription.id, turn.id));
        }}
      >
        <ArrowLineUp size={16} weight="regular" aria-hidden />
      </button>

      {/* 6. Delete button */}
      <button
        type="button"
        className={iconBtnDanger}
        aria-label={t("floatingToolbar.delete")}
        onPointerDown={stopProp}
        onClick={() => {
          dispatch(removeTurn(transcription.id, turn.id));
        }}
      >
        <Trash size={16} weight="regular" aria-hidden />
      </button>
    </div>
  );
}
