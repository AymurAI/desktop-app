import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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
import { stack } from "@/styled/patterns";
import type {
  Speaker,
  SuggestedSpeaker,
  Transcription,
  Turn,
} from "@/types/transcription";
import { SPEAKER_PALETTE } from "@/types/transcription";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
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

const panelColumn = css({
  flexShrink: "0",
  borderLeft: "[1px solid #BCBAB8]",
  overflowY: "auto",
});

// SidePanel's size="sm" is 360px; this placeholder isn't a SidePanel (there's
// no turn selected yet) so it repeats that number directly to avoid a layout
// jump the moment a turn becomes active.
const emptyPanel = css({
  flexShrink: "0",
  width: "[360px]",
  borderLeft: "[1px solid #BCBAB8]",
  bg: "bg.secondary",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "text.lighter",
  fontSize: "[14px]",
  textAlign: "center",
  p: "6",
});

// Tratamiento de confirmación del Figma nodo 40002384:38487 — el mismo que
// usa el ConfirmDialog interno de @aymurai/ui para el conflicto de nombres.
// Se replica en vez de importarse porque ese componente no es público y trae
// los labels "Combinar"/"Cancelar" hardcodeados.
const confirmCard = css({ ...stack.raw({ gap: "4" }), maxW: "[389px]" });
const confirmTextBlock = css({ ...stack.raw({ gap: "1" }) });
const confirmTitle = css({
  margin: "0",
  textStyle: "subtitle.md.strong",
  color: "text.default",
});
const confirmDescription = css({
  margin: "0",
  textStyle: "subtitle.sm.default",
  color: "text.default",
});
const confirmButtons = css({
  display: "flex",
  alignItems: "center",
  gap: "3", // 12px
});

export interface TurnSidePanelProps {
  transcription: Transcription;
  activeTurnId: string | null;
}

type PendingSelection =
  | { kind: "existing"; speakerId: string }
  | { kind: "role"; role: SuggestedSpeaker }
  | { kind: "new" };

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
    pending: PendingSelection;
    targetLabel: string;
  } | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-seed from the stable turn id; activeTurn is derived from it
  useEffect(() => {
    setTimeValue(activeTurn ? formatTime(activeTurn.startMs) : "");
  }, [activeTurnId]);

  if (!activeTurn || !currentSpeaker) {
    return <aside className={emptyPanel}>{t("sidePanel.empty")}</aside>;
  }

  // Pills = sólo los oradores detectados. Los roles ya no van acá: viven en el
  // desplegable de "Nuevo".
  const people = speakers.map((s) => ({
    id: s.id,
    initials: s.initials,
    name: s.label,
    color: s.color,
    renamable: true,
  }));
  const selectedIndex = speakers.findIndex((s) => s.id === currentSpeaker.id);

  // Roles todavía no usados, para el desplegable.
  const usedLabels = new Set(speakers.map((s) => s.label.toLowerCase()));
  const availableSuggested = SUGGESTED_SPEAKERS.filter(
    (sg) => !usedLabels.has(sg.label.toLowerCase()),
  );
  const newPersonOptions = availableSuggested.map((sg) => ({
    id: sg.id,
    initials: sg.initials,
    name: sg.label,
    color: sg.color,
  }));

  const buildNewPersonSpeaker = (): Speaker => {
    const label = nextPersonaLabel(speakers);
    return {
      id: crypto.randomUUID(),
      label,
      initials: computeInitials(label),
      color: SPEAKER_PALETTE[speakers.length % SPEAKER_PALETTE.length],
    };
  };

  const applySelection = (pending: PendingSelection) => {
    if (pending.kind === "existing") {
      dispatch(
        reassignTurnSpeaker(transcription.id, activeTurn.id, pending.speakerId),
      );
      return;
    }
    const newSpeaker: Speaker =
      pending.kind === "role"
        ? {
            id: crypto.randomUUID(),
            label: pending.role.label,
            initials: pending.role.initials,
            color: pending.role.color,
          }
        : buildNewPersonSpeaker();
    dispatch(addSpeaker(transcription.id, newSpeaker));
    dispatch(
      reassignTurnSpeaker(transcription.id, activeTurn.id, newSpeaker.id),
    );
  };

  const currentSpeakerTurnCount = turns.filter(
    (t) => t.speakerId === currentSpeaker.id,
  ).length;

  /**
   * Toast de confirmación (Figma nodo 40002383:73634). Se llama dentro del
   * mismo handler que despacha, para que `currentSpeaker.label` siga siendo el
   * valor de este render: después del dispatch el componente se re-renderiza y
   * el mensaje diría "de Fiscal a Fiscal".
   */
  const notifyApplied = (targetLabel: string, count: number) => {
    showToast(
      t("sidePanel.changeApplied", {
        from: currentSpeaker.label,
        to: targetLabel,
        count,
      }),
      "success",
    );
  };

  /** Decide entre aplicar directo o pedir alcance. Común a los dos caminos. */
  const requestSelection = (pending: PendingSelection, targetLabel: string) => {
    if (currentSpeakerTurnCount > 1) {
      setScopeChoice({ pending, targetLabel });
      return;
    }
    applySelection(pending);
    notifyApplied(targetLabel, 1);
  };

  /** Click en una pill de la grilla (un orador existente). */
  const handleSelectPerson = (index: number) => {
    const speaker = speakers[index];
    if (!speaker || speaker.id === currentSpeaker.id) return;
    requestSelection(
      { kind: "existing", speakerId: speaker.id },
      speaker.label,
    );
  };

  /** Click en un rol del desplegable de "Nuevo". */
  const handleSelectNewPersonOption = (index: number) => {
    const role = availableSuggested[index];
    if (!role) return;
    requestSelection({ kind: "role", role }, role.label);
  };

  const handleApplyToThisTurnOnly = () => {
    if (!scopeChoice) return;
    applySelection(scopeChoice.pending);
    notifyApplied(scopeChoice.targetLabel, 1);
    setScopeChoice(null);
  };

  const handleApplyToAllTurns = () => {
    if (!scopeChoice) return;
    dispatch(
      renameSpeakerGlobal(
        transcription.id,
        currentSpeaker.id,
        scopeChoice.targetLabel,
      ),
    );
    notifyApplied(scopeChoice.targetLabel, currentSpeakerTurnCount);
    setScopeChoice(null);
  };

  const handleNewPerson = () => {
    requestSelection({ kind: "new" }, nextPersonaLabel(speakers));
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
    const speaker = speakers[personIndex];
    if (!speaker) return;
    dispatch(renameSpeakerGlobal(transcription.id, speaker.id, name));
  };

  const handleMergePeople = (sourceIndex: number, targetIndex: number) => {
    const source = speakers[sourceIndex];
    const target = speakers[targetIndex];
    if (!source || !target) return;
    dispatch(renameSpeakerGlobal(transcription.id, source.id, target.label));
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
    <div className={panelColumn}>
      <TooltipProvider>
        <SidePanel
          size="sm"
          turn={{
            initials: currentSpeaker.initials,
            name: currentSpeaker.label,
            time: formatTime(activeTurn.startMs),
            color: currentSpeaker.color,
          }}
          people={people}
          selectedIndex={selectedIndex >= 0 ? selectedIndex : undefined}
          onSelectPerson={handleSelectPerson}
          newPersonOptions={newPersonOptions}
          onSelectNewPersonOption={handleSelectNewPersonOption}
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
        <DialogContent className={confirmCard}>
          <div className={confirmTextBlock}>
            <DialogTitle asChild>
              <p className={confirmTitle}>{t("sidePanel.scopeDialog.title")}</p>
            </DialogTitle>
            <DialogDescription asChild>
              <p className={confirmDescription}>
                {t("sidePanel.scopeDialog.description", {
                  current: currentSpeaker.label,
                })}
              </p>
            </DialogDescription>
          </div>
          <div className={confirmButtons}>
            <Button variant="primary" size="sm" onClick={handleApplyToAllTurns}>
              {t("sidePanel.scopeDialog.allTurns", {
                current: currentSpeaker.label,
              })}
            </Button>
            <Button
              variant="tertiary"
              size="sm"
              onClick={handleApplyToThisTurnOnly}
            >
              {t("sidePanel.scopeDialog.thisTurnOnly")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
