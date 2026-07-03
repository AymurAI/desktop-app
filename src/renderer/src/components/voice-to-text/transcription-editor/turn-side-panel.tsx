import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatTime } from "@/components/voice-to-text/format-time";
import { showToast } from "@/features/showToast";
import { useTranscriptionDispatch } from "@/hooks/useTranscriptions";
import { computeInitials } from "@/reducers/transcription";
import {
  addSpeaker,
  insertTurn,
  mergeTurnWithPrevious,
  reassignTurnSpeaker,
  removeTurn,
  updateTurnStartMs,
} from "@/reducers/transcription/actions";
import { SUGGESTED_SPEAKERS } from "@/services/aymurai/fixtures/suggestedSpeakers";
import { css } from "@/styled/css";
import type {
  Speaker,
  SpeakerColor,
  Transcription,
  Turn,
} from "@/types/transcription";
import { SidePanel } from "@aymurai/ui";
import { parseTimestampToMs } from "./parse-timestamp";

const PALETTE: SpeakerColor[] = ["primary", "secondary", "warning", "success"];

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

// The @aymurai/ui SidePanel has no intrinsic width, so constrain it to a fixed
// right column inside the editor's flex row.
const panelColumn = css({
  flexShrink: "0",
  width: "[360px]",
  borderLeft: "[1px solid #BCBAB8]",
  overflowY: "auto",
});

// Empty-state placeholder shown until a turn is selected. Width/border mirror
// the SidePanel column so the layout doesn't jump when a turn is picked.
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-seed from the stable turn id; activeTurn is derived from it
  useEffect(() => {
    setTimeValue(activeTurn ? formatTime(activeTurn.startMs) : "");
  }, [activeTurnId]);

  if (!activeTurn || !currentSpeaker) {
    return <aside className={emptyPanel}>{t("sidePanel.empty")}</aside>;
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
    })),
    ...availableSuggested.map((sg) => ({
      kind: "suggested" as const,
      sg,
      initials: sg.initials,
      name: sg.label,
      color: sg.color,
    })),
  ];
  const selectedIndex = people.findIndex(
    (p) => p.kind === "existing" && p.id === currentSpeaker.id,
  );

  const handleSelectPerson = (i: number) => {
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

  const handleNewPerson = () => {
    const label = `Persona ${speakers.length + 1}`;
    const newSpeaker: Speaker = {
      id: crypto.randomUUID(),
      label,
      initials: computeInitials(label),
      color: PALETTE[speakers.length % PALETTE.length],
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

  const nextTurn = turns[idx + 1];

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
      <SidePanel
        turn={{
          initials: currentSpeaker.initials,
          name: currentSpeaker.label,
          time: formatTime(activeTurn.startMs),
          color: currentSpeaker.color,
        }}
        people={people.map((p) => ({
          initials: p.initials,
          name: p.name,
          color: p.color,
        }))}
        selectedIndex={selectedIndex >= 0 ? selectedIndex : undefined}
        onSelectPerson={handleSelectPerson}
        onNewPerson={handleNewPerson}
        timestamp={timeValue}
        onTimestampChange={handleTimestampChange}
        onMergePrevious={() =>
          dispatch(mergeTurnWithPrevious(transcription.id, activeTurn.id))
        }
        onMergeNext={() => {
          if (nextTurn) {
            dispatch(mergeTurnWithPrevious(transcription.id, nextTurn.id));
          }
        }}
        onAddBelow={handleAddBelow}
        onDelete={() => dispatch(removeTurn(transcription.id, activeTurn.id))}
      />
    </div>
  );
}
