import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import SidePanelColumn from "@/components/layout/side-panel-column";
import { formatTime } from "@/components/voice-to-text/format-time";
import { showToast } from "@/features/showToast";
import { useTranscriptionDispatch } from "@/hooks/useTranscriptions";
import { computeInitials, nextPersonaLabel } from "@/reducers/transcription";
import {
  addSpeaker,
  insertTurn,
  mergeTurnWithNext,
  mergeTurnWithPrevious,
  reassignTurnSpeaker,
  removeTurn,
  renameSpeakerGlobal,
  updateTurnStartMs,
} from "@/reducers/transcription/actions";
import { SUGGESTED_SPEAKERS } from "@/services/aymurai/fixtures/suggestedSpeakers";
import { css } from "@/styled/css";
import type { Speaker, Transcription, Turn } from "@/types/transcription";
import { SPEAKER_PALETTE } from "@/types/transcription";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  SidePanel,
  TooltipProvider,
} from "@aymurai/ui";
import { parseTimestampToMs } from "./parse-timestamp";

// A newly-inserted turn needs a real (non-zero) time span, or it can never
// become the "active" turn during playback (useActiveTurn requires
// startMs <= currentMs < endMs). Capped so it doesn't eat too much of the
// gap to the next turn when turns are close together.
const DEFAULT_NEW_TURN_DURATION_MS = 2000;

/**
 * Valid [min, max) range for a turn's startMs so the `turns` array — which
 * both drives reading order and is assumed sorted by start time for
 * highlighting/follow-scroll — stays chronologically ordered after an edit.
 */
export function getTimestampBounds(
  turns: Turn[],
  idx: number,
  audioDurationMs: number,
): { minMs: number; maxMs: number } {
  const prevTurn = turns[idx - 1];
  const nextTurn = turns[idx + 1];
  return {
    minMs: prevTurn ? prevTurn.startMs + 1 : 0,
    maxMs: nextTurn ? nextTurn.startMs : audioDurationMs,
  };
}

// SidePanelColumn (T6) provides position/width/zIndex/shadow/flexShrink/
// borderLeft; overflowY has no equivalent in the primitive and must be added
// here so the panel's content scrolls independently of the transcript body.
const panelColumn = css({
  overflowY: "auto",
});

// SidePanel's own recipe always sets `maxW: full` on its root node alongside
// its fixed `size` width (node_modules/@aymurai/ui/dist/index.js:25478-25489),
// so nesting `size="lg"` (479px) inside SidePanelColumn does not need a CSS
// override: at the `lg` tier SidePanelColumn is a literal 360px
// (`panel.sideCompact`), and the browser resolves `width: 479px` against
// `max-width: 100%` of that 360px containing block by using the smaller of
// the two - the panel measures 360px there without any class ever
// targeting the library's own selector. Measured (see the fixture spec).
const emptyPanel = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "text.lighter",
  fontSize: "[14px]",
  textAlign: "center",
  p: "6",
});

// Lightweight text-link Cancel, matching the "Ya existe" Figma reference
// (bordered buttons for the real actions, plain text for Cancelar) instead of
// a third equally-weighted bordered button crowding the footer.
const cancelLink = css({
  color: "text.lighter",
  textStyle: "label.md.default",
  textDecoration: "underline",
  cursor: "pointer",
  bg: "transparent",
  border: "[none]",
  p: "[0]",
  mr: "auto",
  "&:hover": { color: "brand.primary" },
});

export interface TurnSidePanelProps {
  transcription: Transcription;
  activeTurnId: string | null;
}

/**
 * Edit-mode side panel. Thin adapter that wires the transcription reducer to
 * the @aymurai/ui SidePanel component (Figma-aligned). The library component
 * does not expose inline global speaker rename, free-form new-person naming, or
 * a timestamp-invalid hint, so those are intentionally not available here.
 */
export default function TurnSidePanel({
  transcription,
  activeTurnId,
}: TurnSidePanelProps) {
  const { t } = useTranslation("voice-to-text");
  const dispatch = useTranscriptionDispatch();

  const { turns, speakers } = transcription;
  const idx = turns.findIndex((turn) => turn.id === activeTurnId);
  const activeTurn = idx >= 0 ? turns[idx] : null;
  const currentSpeaker = activeTurn
    ? (speakers.find((s) => s.id === activeTurn.speakerId) ?? null)
    : null;

  const [timeValue, setTimeValue] = useState(
    activeTurn ? formatTime(activeTurn.startMs) : "",
  );
  // Declared here (before the early-return guard below) rather than next to
  // the handlers that use it, so every render calls the same hooks in the
  // same order regardless of whether activeTurn/currentSpeaker are set.
  const [scopeChoice, setScopeChoice] = useState<{
    personIndex: number;
    targetLabel: string;
  } | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-seed from the stable turn id; activeTurn is derived from it
  useEffect(() => {
    setTimeValue(activeTurn ? formatTime(activeTurn.startMs) : "");
  }, [activeTurnId]);

  if (!activeTurn || !currentSpeaker) {
    return (
      <SidePanelColumn className={emptyPanel} data-testid="vtt-side-panel">
        {t("sidePanel.empty")}
      </SidePanelColumn>
    );
  }

  // People pills = existing speakers first, then still-unused suggested roles.
  const usedLabels = new Set(speakers.map((s) => s.label.toLowerCase()));
  const availableSuggested = SUGGESTED_SPEAKERS.filter(
    (sg) => !usedLabels.has(sg.label.toLowerCase()),
  );
  const people = [
    ...speakers.map((s) => ({
      kind: "existing" as const,
      id: s.id,
      initials: s.initials,
      name: s.label,
      color: s.color,
      renamable: true,
    })),
    ...availableSuggested.map((sg) => ({
      kind: "suggested" as const,
      id: sg.id,
      sg,
      initials: sg.initials,
      name: sg.label,
      color: sg.color,
      renamable: false,
    })),
  ];
  const selectedIndex = people.findIndex(
    (p) => p.kind === "existing" && p.id === currentSpeaker.id,
  );

  const applySelection = (i: number) => {
    const p = people[i];
    if (!p) return;
    if (p.kind === "existing") {
      dispatch(reassignTurnSpeaker(transcription.id, activeTurn.id, p.id));
      return;
    }
    const newSpeaker: Speaker = {
      id: crypto.randomUUID(),
      label: p.sg.label,
      initials: p.sg.initials,
      color: p.sg.color,
    };
    dispatch(addSpeaker(transcription.id, newSpeaker));
    dispatch(
      reassignTurnSpeaker(transcription.id, activeTurn.id, newSpeaker.id),
    );
  };

  const handleSelectPerson = (i: number) => {
    const p = people[i];
    if (!p || !currentSpeaker) return;

    const targetLabel = p.kind === "existing" ? p.name : p.sg.label;
    const isDifferentIdentity =
      p.kind === "suggested" || p.id !== currentSpeaker.id;
    const currentSpeakerTurnCount = turns.filter(
      (t) => t.speakerId === currentSpeaker.id,
    ).length;

    if (isDifferentIdentity && currentSpeakerTurnCount > 1) {
      setScopeChoice({ personIndex: i, targetLabel });
      return;
    }
    applySelection(i);
  };

  const handleApplyToThisTurnOnly = () => {
    if (!scopeChoice) return;
    applySelection(scopeChoice.personIndex);
    setScopeChoice(null);
  };

  const handleApplyToAllTurns = () => {
    if (!scopeChoice || !currentSpeaker) return;
    dispatch(
      renameSpeakerGlobal(
        transcription.id,
        currentSpeaker.id,
        scopeChoice.targetLabel,
      ),
    );
    setScopeChoice(null);
  };

  const handleNewPerson = () => {
    const label = nextPersonaLabel(speakers);
    const newSpeaker: Speaker = {
      id: crypto.randomUUID(),
      label,
      initials: computeInitials(label),
      color: SPEAKER_PALETTE[speakers.length % SPEAKER_PALETTE.length],
    };
    dispatch(addSpeaker(transcription.id, newSpeaker));
    dispatch(
      reassignTurnSpeaker(transcription.id, activeTurn.id, newSpeaker.id),
    );
  };

  const { minMs, maxMs } = getTimestampBounds(
    turns,
    idx,
    transcription.audioDurationMs,
  );

  const handleTimestampChange = (value: string) => {
    setTimeValue(value);
    const ms = parseTimestampToMs(value);
    if (ms === null) return;

    if (ms < minMs || ms >= maxMs) {
      showToast(
        t("sidePanel.timestampOutOfRange", {
          min: formatTime(minMs),
          max: formatTime(maxMs),
        }),
        "warning",
      );
      return;
    }
    dispatch(updateTurnStartMs(transcription.id, activeTurn.id, ms));
  };

  const previousTurn = turns[idx - 1];
  const nextTurn = turns[idx + 1];
  const previousTurnName = previousTurn
    ? speakers.find((speaker) => speaker.id === previousTurn.speakerId)?.label
    : undefined;
  const nextTurnName = nextTurn
    ? speakers.find((speaker) => speaker.id === nextTurn.speakerId)?.label
    : undefined;

  const handleRenamePerson = (personIndex: number, name: string) => {
    const person = people[personIndex];
    if (person?.kind !== "existing") return;
    dispatch(renameSpeakerGlobal(transcription.id, person.id, name));
  };

  const handleMergePeople = (sourceIndex: number, targetIndex: number) => {
    const source = people[sourceIndex];
    const target = people[targetIndex];
    if (source?.kind !== "existing" || target?.kind !== "existing") return;
    dispatch(renameSpeakerGlobal(transcription.id, source.id, target.name));
  };

  const handleAddBelow = () => {
    // Start right where the active turn ends, and use the gap to the next
    // turn (if any) for its duration — capped so a small gap doesn't get
    // entirely swallowed, or expanded, into a fixed default when there's no
    // next turn. A zero-width turn (the previous behavior) can never become
    // "active" during playback, since useActiveTurn requires
    // startMs <= currentMs < endMs.
    const insertStart = activeTurn.endMs;
    const gapToNext = nextTurn ? nextTurn.startMs - insertStart : null;
    const insertEnd =
      gapToNext !== null && gapToNext > 0
        ? insertStart + Math.min(gapToNext, DEFAULT_NEW_TURN_DURATION_MS)
        : insertStart + DEFAULT_NEW_TURN_DURATION_MS;

    dispatch(
      insertTurn(transcription.id, activeTurn.id, {
        id: crypto.randomUUID(),
        speakerId: activeTurn.speakerId,
        text: "",
        startMs: insertStart,
        endMs: insertEnd,
      }),
    );
  };

  return (
    <SidePanelColumn className={panelColumn} data-testid="vtt-side-panel">
      <TooltipProvider>
        <SidePanel
          size="lg"
          turn={{
            initials: currentSpeaker.initials,
            name: currentSpeaker.label,
            time: formatTime(activeTurn.startMs),
            color: currentSpeaker.color,
          }}
          people={people.map((p) => ({
            id: p.id,
            initials: p.initials,
            name: p.name,
            color: p.color,
            renamable: p.renamable,
          }))}
          selectedIndex={selectedIndex >= 0 ? selectedIndex : undefined}
          onSelectPerson={handleSelectPerson}
          onNewPerson={handleNewPerson}
          onRenamePerson={handleRenamePerson}
          onMergePeople={handleMergePeople}
          timestamp={timeValue}
          onTimestampChange={handleTimestampChange}
          onMergePrevious={() =>
            dispatch(mergeTurnWithPrevious(transcription.id, activeTurn.id))
          }
          onMergeNext={() =>
            dispatch(mergeTurnWithNext(transcription.id, activeTurn.id))
          }
          previousTurnName={previousTurnName}
          nextTurnName={nextTurnName}
          onAddBelow={handleAddBelow}
          onDelete={() => dispatch(removeTurn(transcription.id, activeTurn.id))}
        />
      </TooltipProvider>

      <Dialog
        open={scopeChoice !== null}
        onOpenChange={(open) => {
          if (!open) setScopeChoice(null);
        }}
      >
        <DialogContent size="sm">
          <DialogTitle>{t("sidePanel.scopeDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("sidePanel.scopeDialog.description", {
              current: currentSpeaker?.label,
            })}
          </DialogDescription>
          <DialogFooter>
            <button
              type="button"
              className={cancelLink}
              onClick={() => setScopeChoice(null)}
            >
              {t("sidePanel.scopeDialog.cancel")}
            </button>
            <Button variant="secondary" onClick={handleApplyToThisTurnOnly}>
              {t("sidePanel.scopeDialog.thisTurnOnly")}
            </Button>
            <Button onClick={handleApplyToAllTurns}>
              {t("sidePanel.scopeDialog.allTurns", {
                current: currentSpeaker?.label,
              })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidePanelColumn>
  );
}
