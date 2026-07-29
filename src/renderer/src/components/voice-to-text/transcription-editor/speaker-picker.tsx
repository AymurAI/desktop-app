import { Check, Plus } from "phosphor-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import SpeakerAvatar from "@/components/voice-to-text/speaker-avatar";
import { useTranscriptionDispatch } from "@/hooks/useTranscriptions";
import { computeInitials } from "@/reducers/transcription";
import { addSpeaker } from "@/reducers/transcription/actions";
import { SUGGESTED_SPEAKERS } from "@/services/aymurai/fixtures/suggestedSpeakers";
import { css } from "@/styled/css";
import type {
  Speaker,
  SpeakerColor,
  Transcription,
} from "@/types/transcription";
import { SPEAKER_PALETTE } from "@/types/transcription";

const popover = css({
  bg: "bg.secondary",
  borderRadius: "[14px]",
  // NOTE: bracketed raw hex — no shadow token exists for this specific elevation
  boxShadow: "[0 16px 44px rgba(28,26,60,.18),0 0 0 1px rgba(28,26,60,.06)]",
  padding: "2",
  minWidth: "[270px]",
  maxWidth: "[min(270px, 90vw)]",
  maxHeight: "[440px]",
  overflowY: "auto",
  position: "absolute",
  zIndex: "50",
});

const sectionLabel = css({
  fontSize: "[11px]",
  fontWeight: "[700]",
  letterSpacing: "[0.6px]",
  textTransform: "uppercase",
  color: "text.lighter",
  padding: "[8px 10px 6px]",
  display: "block",
});

const itemBase = css({
  display: "flex",
  alignItems: "center",
  gap: "[11px]",
  width: "full",
  border: "[none]",
  bg: "transparent",
  padding: "[8px 10px]",
  borderRadius: "[9px]",
  cursor: "pointer",
  textAlign: "left",
  "&:hover": { bg: "bg.primary" },
});

const itemActive = css({
  display: "flex",
  alignItems: "center",
  gap: "[11px]",
  width: "full",
  border: "[none]",
  bg: "bg.primary-alternative",
  padding: "[8px 10px]",
  borderRadius: "[9px]",
  cursor: "pointer",
  textAlign: "left",
  "&:hover": { bg: "bg.primary" },
});

const itemName = css({
  fontSize: "[15px]",
  fontWeight: "[600]",
  color: "text.default",
  flex: "[1]",
});

const divider = css({
  border: "[0]",
  borderTop: "primary",
  margin: "[6px 4px]",
});

const newPersonRow = css({
  display: "flex",
  gap: "2",
  padding: "[6px 6px 4px]",
});

const newPersonInput = css({
  flex: "[1]",
  border: "primary",
  borderRadius: "[8px]",
  px: "3",
  py: "[6px]",
  fontSize: "[14px]",
  color: "text.default",
  outline: "none",
  "&:focus": { borderColor: "brand.primary" },
  bg: "bg.secondary",
});

const createBtn = css({
  border: "[none]",
  bg: "brand.primary",
  color: "text.onbutton-alternative",
  borderRadius: "[8px]",
  px: "3",
  py: "[6px]",
  fontSize: "[14px]",
  fontWeight: "[600]",
  cursor: "pointer",
  whiteSpace: "nowrap",
  "&:hover": { opacity: "0.85" },
});

const newPersonBtn = css({
  display: "flex",
  alignItems: "center",
  gap: "[11px]",
  width: "full",
  border: "[none]",
  bg: "transparent",
  padding: "[8px 10px]",
  borderRadius: "[9px]",
  cursor: "pointer",
  textAlign: "left",
  color: "brand.primary",
  fontWeight: "[600]",
  fontSize: "[15px]",
  "&:hover": { bg: "bg.primary" },
});

const checkIcon = css({
  color: "brand.primary",
  flexShrink: "0",
  ml: "auto",
});

export interface SpeakerPickerProps {
  transcription: Transcription;
  currentSpeakerId?: string;
  onPick: (speakerId: string) => void;
  onClose: () => void;
  style?: CSSProperties;
  className?: string;
}

export default function SpeakerPicker({
  transcription,
  currentSpeakerId,
  onPick,
  onClose,
  style,
  className,
}: SpeakerPickerProps) {
  const { t } = useTranslation("voice-to-text");
  const dispatch = useTranscriptionDispatch();
  const [showNewRow, setShowNewRow] = useState(false);
  const [newName, setNewName] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside pointerdown
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("pointerdown", handler, true);
    return () => document.removeEventListener("pointerdown", handler, true);
  }, [onClose]);

  // Focus input when new row is revealed
  useEffect(() => {
    if (showNewRow) {
      inputRef.current?.focus();
    }
  }, [showNewRow]);

  const { speakers } = transcription;

  // Filter suggested speakers whose label isn't already in use
  const usedLabels = new Set(speakers.map((s) => s.label.toLowerCase()));
  const availableSuggested = SUGGESTED_SPEAKERS.filter(
    (sg) => !usedLabels.has(sg.label.toLowerCase()),
  );

  function ensureSpeaker(
    label: string,
    fallbackColor?: SpeakerColor,
    fallbackInitials?: string,
  ): string {
    const trimmed = label.trim();
    const existing = speakers.find(
      (s) => s.label.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existing) return existing.id;

    const color: SpeakerColor =
      fallbackColor ??
      SPEAKER_PALETTE[speakers.length % SPEAKER_PALETTE.length];
    const initials = fallbackInitials ?? computeInitials(trimmed);
    const newSpeaker: Speaker = {
      id: crypto.randomUUID(),
      label: trimmed,
      initials,
      color,
    };
    dispatch(addSpeaker(transcription.id, newSpeaker));
    return newSpeaker.id;
  }

  const handleExistingPick = (speakerId: string) => {
    onPick(speakerId);
    onClose();
  };

  const handleSuggestedPick = (
    label: string,
    color: SpeakerColor,
    initials: string,
  ) => {
    const id = ensureSpeaker(label, color, initials);
    onPick(id);
    onClose();
  };

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const id = ensureSpeaker(trimmed);
    onPick(id);
    onClose();
  };

  return (
    <div
      ref={popoverRef}
      className={`${popover}${className ? ` ${className}` : ""}`}
      style={style}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Existing speakers */}
      {speakers.length > 0 && (
        <>
          <span className={sectionLabel}>{t("speakerPicker.people")}</span>
          {speakers.map((s) => {
            const isCurrent = s.id === currentSpeakerId;
            return (
              <button
                key={s.id}
                type="button"
                className={isCurrent ? itemActive : itemBase}
                onClick={() => handleExistingPick(s.id)}
              >
                <SpeakerAvatar speaker={s} size="sm" />
                <span className={itemName}>{s.label}</span>
                {isCurrent && (
                  <Check size={16} weight="bold" className={checkIcon} />
                )}
              </button>
            );
          })}
        </>
      )}

      {/* Suggested speakers */}
      {availableSuggested.length > 0 && (
        <>
          {speakers.length > 0 && <hr className={divider} />}
          <span className={sectionLabel}>{t("speakerPicker.suggested")}</span>
          {availableSuggested.map((sg) => (
            <button
              key={sg.id}
              type="button"
              className={itemBase}
              onClick={() =>
                handleSuggestedPick(sg.label, sg.color, sg.initials)
              }
            >
              <SpeakerAvatar speaker={sg} size="sm" />
              <span className={itemName}>{sg.label}</span>
            </button>
          ))}
        </>
      )}

      {/* New person */}
      <hr className={divider} />
      {!showNewRow ? (
        <button
          type="button"
          className={newPersonBtn}
          onClick={() => setShowNewRow(true)}
        >
          <Plus size={16} weight="bold" />
          {t("speakerPicker.newPerson")}
        </button>
      ) : (
        <div className={newPersonRow}>
          <input
            ref={inputRef}
            className={newPersonInput}
            placeholder={t("speakerPicker.newPersonPlaceholder")}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") {
                setShowNewRow(false);
                setNewName("");
              }
            }}
          />
          <button type="button" className={createBtn} onClick={handleCreate}>
            {t("speakerPicker.create")}
          </button>
        </div>
      )}
    </div>
  );
}
