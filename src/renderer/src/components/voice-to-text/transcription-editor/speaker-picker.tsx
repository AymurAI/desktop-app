import { PersonMenu } from "@aymurai/ui";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

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
  const [step, setStep] = useState<"people" | "roles">("people");
  const [showNewRow, setShowNewRow] = useState(false);
  const [newName, setNewName] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingSpeakerIdsByLabel = useRef(new Map<string, string>());

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

  useEffect(() => {
    const committedLabels = new Set(
      speakers.map((speaker) => speaker.label.trim().toLowerCase()),
    );
    for (const label of pendingSpeakerIdsByLabel.current.keys()) {
      if (committedLabels.has(label)) {
        pendingSpeakerIdsByLabel.current.delete(label);
      }
    }
  }, [speakers]);

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
    const normalizedLabel = trimmed.toLowerCase();
    const existing = speakers.find(
      (s) => s.label.toLowerCase() === normalizedLabel,
    );
    if (existing) return existing.id;

    const pendingId = pendingSpeakerIdsByLabel.current.get(normalizedLabel);
    if (pendingId) return pendingId;

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
    pendingSpeakerIdsByLabel.current.set(normalizedLabel, newSpeaker.id);
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

  // Outer container: positioning only. PersonMenu brings its own card.
  const anchor = css({ position: "absolute", zIndex: "50" });

  const nameInput = (
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
  );

  return (
    <div
      ref={popoverRef}
      className={`${anchor}${className ? ` ${className}` : ""}`}
      style={style}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {step === "people" ? (
        <PersonMenu
          aria-label={t("speakerPicker.people")}
          options={speakers.map((s) => ({
            id: s.id,
            initials: s.initials,
            name: s.label,
            color: s.color,
          }))}
          selectedIndex={speakers.findIndex((s) => s.id === currentSpeakerId)}
          onSelectOption={(index) => {
            const speaker = speakers[index];
            if (speaker) handleExistingPick(speaker.id);
          }}
          footerLabel={t("speakerPicker.new")}
          onFooterAction={() => setStep("roles")}
        />
      ) : (
        <PersonMenu
          aria-label={t("speakerPicker.suggested")}
          options={availableSuggested.map((sg) => ({
            id: sg.id,
            initials: sg.initials,
            name: sg.label,
            color: sg.color,
          }))}
          onSelectOption={(index) => {
            const role = availableSuggested[index];
            if (role)
              handleSuggestedPick(role.label, role.color, role.initials);
          }}
          footerLabel={showNewRow ? undefined : t("speakerPicker.newPerson")}
          onFooterAction={() => setShowNewRow(true)}
          footerSlot={showNewRow ? nameInput : undefined}
        />
      )}
    </div>
  );
}
