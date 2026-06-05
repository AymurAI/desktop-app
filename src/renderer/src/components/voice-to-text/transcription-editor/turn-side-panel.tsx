import { ArrowLineUp, PencilSimple, Plus, Trash } from "phosphor-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatTime } from "@/components/voice-to-text/format-time";
import SpeakerAvatar from "@/components/voice-to-text/speaker-avatar";
import { useTranscriptionDispatch } from "@/hooks/useTranscriptions";
import { computeInitials } from "@/reducers/transcription";
import {
  addSpeaker,
  insertTurn,
  mergeTurnWithPrevious,
  reassignTurnSpeaker,
  removeTurn,
  renameSpeakerGlobal,
  updateTurnStartMs,
} from "@/reducers/transcription/actions";
import { SUGGESTED_SPEAKERS } from "@/services/aymurai/fixtures/suggestedSpeakers";
import { css, cva } from "@/styled/css";
import { HStack, Stack } from "@/styled/jsx";
import type {
  Speaker,
  SpeakerColor,
  Transcription,
} from "@/types/transcription";
import { parseTimestampToMs } from "./parse-timestamp";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PALETTE: SpeakerColor[] = ["primary", "secondary", "warning", "success"];

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const panelRoot = css({
  flexShrink: "0",
  width: "[340px]",
  borderLeft: "[1px solid #BCBAB8]",
  bg: "bg.primary",
  padding: "6",
  overflowY: "auto",
  display: "flex",
  flexDir: "column",
  gap: "0",
});

const emptyHint = css({
  flex: "1",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "text.lighter",
  fontSize: "[14px]",
  textAlign: "center",
  padding: "4",
});

const section = css({
  paddingY: "5",
  borderBottom: "[1px solid #BCBAB8]",
  "&:last-child": { borderBottom: "[none]" },
});

const sectionHeading = css({
  textTransform: "uppercase",
  fontSize: "[12px]",
  fontWeight: "[700]",
  letterSpacing: "[0.6px]",
  color: "text.lighter",
  marginBottom: "3",
  display: "block",
});

// Selected turn header
const speakerLabel = css({
  fontSize: "[18px]",
  fontWeight: "[700]",
  color: "text.default",
  lineHeight: "[1.2]",
});

const nameRow = css({
  display: "flex",
  flexDir: "row",
  alignItems: "center",
  gap: "2",
});

const renameIconBtn = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "[none]",
  bg: "transparent",
  cursor: "pointer",
  color: "text.lighter",
  p: "1",
  rounded: "[4px]",
  flexShrink: "0",
  "&:hover": { color: "brand.primary" },
});

const nameInput = css({
  fontSize: "[18px]",
  fontWeight: "[700]",
  color: "text.default",
  lineHeight: "[1.2]",
  border: "[none]",
  borderBottomWidth: "[2px]",
  borderBottomStyle: "solid",
  borderBottomColor: "brand.primary",
  outline: "none",
  bg: "transparent",
  p: "[0]",
  width: "full",
  minWidth: "0",
});

const startsAtLabel = css({
  fontSize: "[13px]",
  color: "text.lighter",
  marginTop: "[2px]",
});

// Speaker chips
const chipsWrap = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
});

const chip = cva({
  base: {
    display: "flex",
    alignItems: "center",
    gap: "2",
    // NOTE: bracketed border-radius — pill shape, no token at 999px
    borderRadius: "[999px]",
    // NOTE: bracketed padding — no 6px/13px/6px/6px token combo
    padding: "[6px 13px 6px 6px]",
    cursor: "pointer",
    fontSize: "[14px]",
    color: "text.default",
    transition: "[background 0.12s]",
  },
  variants: {
    active: {
      true: {
        border: "[1.5px solid]",
        borderColor: "brand.primary",
        bg: "bg.primary-alternative",
        fontWeight: "[600]",
      },
      false: {
        border: "[1px solid #BCBAB8]",
        bg: "bg.secondary",
        fontWeight: "[500]",
        "&:hover": { bg: "bg.primary-highlight" },
      },
    },
  },
  defaultVariants: { active: false },
});

const newPersonChip = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  borderRadius: "[999px]",
  padding: "[6px 13px 6px 10px]",
  border: "[1.5px solid]",
  borderColor: "brand.primary",
  bg: "transparent",
  cursor: "pointer",
  fontSize: "[14px]",
  fontWeight: "[600]",
  color: "brand.primary",
  "&:hover": { bg: "bg.primary-alternative" },
  transition: "[background 0.12s]",
});

const inlineNewPersonWrap = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  width: "full",
  marginTop: "2",
});

const newPersonInput = css({
  flex: "[1]",
  // NOTE: bracketed height — no 42px token
  height: "[42px]",
  // NOTE: bracketed border — matches timestamp field
  border: "[1.5px solid #BCBAB8]",
  // NOTE: bracketed border-radius — no 10px token
  borderRadius: "[10px]",
  px: "3",
  fontSize: "[14px]",
  color: "text.default",
  bg: "bg.primary",
  outline: "none",
  boxSizing: "border-box",
  "&:focus": { borderColor: "brand.primary" },
});

const createBtn = css({
  border: "[none]",
  bg: "brand.primary",
  color: "text.onbutton-alternative",
  // NOTE: bracketed border-radius — no 8px token
  borderRadius: "[8px]",
  // NOTE: bracketed padding — no 6px/14px token combo
  padding: "[6px 14px]",
  fontSize: "[14px]",
  fontWeight: "[600]",
  cursor: "pointer",
  whiteSpace: "nowrap",
  "&:hover": { opacity: "0.85" },
});

// Timestamp field
const timeField = css({
  width: "full",
  // NOTE: bracketed height — no 42px token
  height: "[42px]",
  // NOTE: bracketed border — slightly thicker than tokens.primary
  border: "[1.5px solid #BCBAB8]",
  // NOTE: bracketed border-radius — no 10px token
  borderRadius: "[10px]",
  px: "3",
  fontSize: "[14px]",
  color: "text.default",
  bg: "bg.primary",
  outline: "none",
  boxSizing: "border-box",
  "&:focus": { borderColor: "brand.primary" },
});

const timeInvalidHint = css({
  fontSize: "[12px]",
  color: "system.error",
  marginTop: "[4px]",
});

// Action buttons
const actionButton = cva({
  base: {
    display: "flex",
    alignItems: "center",
    gap: "2",
    width: "full",
    textAlign: "left",
    bg: "bg.secondary",
    border: "[1px solid #BCBAB8]",
    // NOTE: bracketed border-radius — no 11px token
    borderRadius: "[11px]",
    // NOTE: bracketed padding — no 11px/13px token combo
    padding: "[11px 13px]",
    fontSize: "[14px]",
    fontWeight: "[500]",
    cursor: "pointer",
    transition: "[background 0.12s]",
  },
  variants: {
    danger: {
      true: {
        color: "system.error",
        "&:hover": { bg: "system.error-secondary" },
      },
      false: {
        color: "text.default",
        "&:hover": { bg: "bg.primary" },
        "&:disabled": {
          opacity: "[.4]",
          cursor: "default",
          pointerEvents: "none",
        },
      },
    },
  },
  defaultVariants: { danger: false },
});

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TurnSidePanelProps {
  transcription: Transcription;
  activeTurnId: string | null;
}

// ---------------------------------------------------------------------------
// TurnSidePanel
// ---------------------------------------------------------------------------

export default function TurnSidePanel({
  transcription,
  activeTurnId,
}: TurnSidePanelProps) {
  const { t } = useTranslation("voice-to-text");
  const dispatch = useTranscriptionDispatch();

  const { turns, speakers } = transcription;
  const idx = turns.findIndex((t) => t.id === activeTurnId);
  const activeTurn = idx >= 0 ? turns[idx] : null;

  const samePrev =
    idx > 0 && turns[idx - 1].speakerId === activeTurn?.speakerId;
  const sameNext =
    activeTurn !== null &&
    idx < turns.length - 1 &&
    turns[idx + 1].speakerId === activeTurn.speakerId;

  const currentSpeaker =
    activeTurn != null
      ? (speakers.find((s) => s.id === activeTurn.speakerId) ?? null)
      : null;

  // ---- Timestamp input state ----
  const [timeValue, setTimeValue] = useState(
    activeTurn ? formatTime(activeTurn.startMs) : "",
  );
  const [timeInvalid, setTimeInvalid] = useState(false);

  // ---- Global speaker rename state (renames the speaker across all turns) ----
  const [renaming, setRenaming] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Re-seed when the active turn id changes.
  // We read activeTurn inside but biome needs us to list it;
  // listing activeTurnId (the stable primitive) is semantically equivalent
  // because activeTurn is fully derived from it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: activeTurn is derived from activeTurnId; listing both would cause double-runs
  useEffect(() => {
    setTimeValue(activeTurn ? formatTime(activeTurn.startMs) : "");
    setTimeInvalid(false);
    setRenaming(false);
  }, [activeTurnId]);

  // ---- Global speaker rename (renames the speaker across all their turns) ----
  useEffect(() => {
    if (renaming) nameInputRef.current?.focus();
  }, [renaming]);

  const startRename = () => {
    if (!currentSpeaker) return;
    setNameValue(currentSpeaker.label);
    setRenaming(true);
  };

  const commitRename = () => {
    if (!currentSpeaker) {
      setRenaming(false);
      return;
    }
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== currentSpeaker.label) {
      dispatch(
        renameSpeakerGlobal(transcription.id, currentSpeaker.id, trimmed),
      );
    }
    setRenaming(false);
  };

  const commitTime = () => {
    if (!activeTurn) return;
    const ms = parseTimestampToMs(timeValue);
    if (ms !== null) {
      setTimeInvalid(false);
      dispatch(updateTurnStartMs(transcription.id, activeTurn.id, ms));
    } else {
      setTimeInvalid(true);
      // Revert to current value so the field isn't stuck broken
      setTimeValue(formatTime(activeTurn.startMs));
    }
  };

  // ---- New person inline input ----
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState("");
  const newInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showNewInput) newInputRef.current?.focus();
  }, [showNewInput]);

  const handleCreateSpeaker = () => {
    if (!activeTurn) return;
    const trimmed = newName.trim();
    if (!trimmed) return;

    // Reuse existing speaker with same label (case-insensitive)
    const existing = speakers.find(
      (s) => s.label.toLowerCase() === trimmed.toLowerCase(),
    );
    const speakerId = existing
      ? existing.id
      : (() => {
          const newSpeaker: Speaker = {
            id: crypto.randomUUID(),
            label: trimmed,
            initials: computeInitials(trimmed),
            color: PALETTE[speakers.length % PALETTE.length],
          };
          dispatch(addSpeaker(transcription.id, newSpeaker));
          return newSpeaker.id;
        })();

    dispatch(reassignTurnSpeaker(transcription.id, activeTurn.id, speakerId));
    setNewName("");
    setShowNewInput(false);
  };

  // ---- Suggested speakers not yet in the transcription ----
  const usedLabels = new Set(speakers.map((s) => s.label.toLowerCase()));
  const availableSuggested = SUGGESTED_SPEAKERS.filter(
    (sg) => !usedLabels.has(sg.label.toLowerCase()),
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!activeTurn) {
    return (
      <aside className={panelRoot}>
        <p className={emptyHint}>{t("sidePanel.empty")}</p>
      </aside>
    );
  }

  return (
    <aside className={panelRoot}>
      {/* ── Section 1: Selected turn ── */}
      <div className={section}>
        <span className={sectionHeading}>{t("sidePanel.selectedTurn")}</span>
        <HStack gap="3" alignItems="center">
          {currentSpeaker && (
            <SpeakerAvatar speaker={currentSpeaker} size="md" />
          )}
          <Stack gap="0" flex="1" minWidth="0">
            {renaming && currentSpeaker ? (
              <input
                ref={nameInputRef}
                className={nameInput}
                value={nameValue}
                aria-label={t("sidePanel.renameAria")}
                placeholder={t("sidePanel.renamePlaceholder")}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setRenaming(false);
                }}
              />
            ) : (
              <div className={nameRow}>
                <span className={speakerLabel}>
                  {currentSpeaker?.label ?? "—"}
                </span>
                {currentSpeaker && (
                  <button
                    type="button"
                    className={renameIconBtn}
                    onClick={startRename}
                    aria-label={t("sidePanel.renameAria")}
                  >
                    <PencilSimple size={16} />
                  </button>
                )}
              </div>
            )}
            <span className={startsAtLabel}>
              {t("sidePanel.startsAt", {
                time: formatTime(activeTurn.startMs),
              })}
            </span>
          </Stack>
        </HStack>
      </div>

      {/* ── Section 2: Speaker chips ── */}
      <div className={section}>
        <span className={sectionHeading}>{t("sidePanel.personSection")}</span>
        <div className={chipsWrap}>
          {/* Existing speakers */}
          {speakers.map((spk) => {
            const isActive = spk.id === activeTurn.speakerId;
            return (
              <button
                key={spk.id}
                type="button"
                className={chip({ active: isActive })}
                onClick={() =>
                  dispatch(
                    reassignTurnSpeaker(
                      transcription.id,
                      activeTurn.id,
                      spk.id,
                    ),
                  )
                }
              >
                <SpeakerAvatar speaker={spk} size="sm" />
                {spk.label}
              </button>
            );
          })}

          {/* Suggested speakers (not yet added) */}
          {availableSuggested.map((sg) => (
            <button
              key={sg.id}
              type="button"
              className={chip({ active: false })}
              onClick={() => {
                const newSpeaker: Speaker = {
                  id: crypto.randomUUID(),
                  label: sg.label,
                  initials: sg.initials,
                  color: sg.color,
                };
                dispatch(addSpeaker(transcription.id, newSpeaker));
                dispatch(
                  reassignTurnSpeaker(
                    transcription.id,
                    activeTurn.id,
                    newSpeaker.id,
                  ),
                );
              }}
            >
              <SpeakerAvatar
                speaker={{ initials: sg.initials, color: sg.color }}
                size="sm"
              />
              {sg.label}
            </button>
          ))}

          {/* "+ Nuevo" chip */}
          {!showNewInput && (
            <button
              type="button"
              className={newPersonChip}
              onClick={() => setShowNewInput(true)}
            >
              <Plus size={14} weight="bold" aria-hidden />
              {t("sidePanel.newPerson")}
            </button>
          )}
        </div>

        {/* Inline new-person form */}
        {showNewInput && (
          <div className={inlineNewPersonWrap}>
            <input
              ref={newInputRef}
              className={newPersonInput}
              placeholder={t("sidePanel.newPersonPlaceholder")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateSpeaker();
                if (e.key === "Escape") {
                  setShowNewInput(false);
                  setNewName("");
                }
              }}
            />
            <button
              type="button"
              className={createBtn}
              onClick={handleCreateSpeaker}
            >
              {t("sidePanel.create")}
            </button>
          </div>
        )}
      </div>

      {/* ── Section 3: Timestamp ── */}
      <div className={section}>
        <span className={sectionHeading}>{t("sidePanel.timeSection")}</span>
        <input
          className={timeField}
          value={timeValue}
          placeholder="mm:ss"
          inputMode="numeric"
          aria-label={t("sidePanel.timeSection")}
          onChange={(e) => {
            setTimeValue(e.target.value);
            if (timeInvalid) setTimeInvalid(false);
          }}
          onBlur={commitTime}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
        />
        {timeInvalid && (
          <p className={timeInvalidHint}>{t("sidePanel.timeInvalid")}</p>
        )}
      </div>

      {/* ── Section 4: Actions ── */}
      <div className={section}>
        <span className={sectionHeading}>{t("sidePanel.actionsSection")}</span>
        <Stack gap="2">
          {/* Merge with previous */}
          <button
            type="button"
            className={actionButton({ danger: false })}
            disabled={!samePrev}
            aria-label={t("sidePanel.mergePrev")}
            onClick={() =>
              dispatch(mergeTurnWithPrevious(transcription.id, activeTurn.id))
            }
          >
            <ArrowLineUp size={16} weight="regular" aria-hidden />
            {t("sidePanel.mergePrev")}
          </button>

          {/* Merge with next (merge the next turn into its predecessor = this turn) */}
          <button
            type="button"
            className={actionButton({ danger: false })}
            disabled={!sameNext}
            aria-label={t("sidePanel.mergeNext")}
            onClick={() => {
              const nextTurn = turns[idx + 1];
              if (nextTurn) {
                dispatch(mergeTurnWithPrevious(transcription.id, nextTurn.id));
              }
            }}
          >
            {/* Rotate 180° to indicate merging downward */}
            <ArrowLineUp
              size={16}
              weight="regular"
              style={{ transform: "rotate(180deg)" }}
              aria-hidden
            />
            {t("sidePanel.mergeNext")}
          </button>

          {/* Add turn below */}
          <button
            type="button"
            className={actionButton({ danger: false })}
            aria-label={t("sidePanel.addBelow")}
            onClick={() =>
              dispatch(
                insertTurn(transcription.id, activeTurn.id, {
                  id: crypto.randomUUID(),
                  speakerId: activeTurn.speakerId,
                  text: "",
                  startMs: activeTurn.startMs,
                  endMs: activeTurn.startMs,
                }),
              )
            }
          >
            <Plus size={16} weight="regular" aria-hidden />
            {t("sidePanel.addBelow")}
          </button>

          {/* Delete turn */}
          <button
            type="button"
            className={actionButton({ danger: true })}
            aria-label={t("sidePanel.delete")}
            onClick={() =>
              dispatch(removeTurn(transcription.id, activeTurn.id))
            }
          >
            <Trash size={16} weight="regular" aria-hidden />
            {t("sidePanel.delete")}
          </button>
        </Stack>
      </div>
    </aside>
  );
}
