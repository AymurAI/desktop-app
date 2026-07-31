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
import { css, cx } from "@/styled/css";
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

// SidePanelColumn (G1) already provides its own overflowY/maxHeight for the
// stacked-row case below `lg`, so nothing extra is needed for that here.
//
// SidePanel's own recipe always sets `maxW: full` on its root node alongside
// its fixed `size` width (node_modules/@aymurai/ui/dist/index.js:25478-25489)
// - a PROP, not CSS this file controls. At/above `lg` that's exactly what we
// want: at the `lg` tier SidePanelColumn is a literal 360px
// (`panel.sideCompact`), and the browser resolves `width: 479px` against
// `max-width: 100%` of that 360px containing block by using the smaller of
// the two - the panel measures 360px there without any class ever
// targeting the library's own selector (measured, see the fixture spec).
// Below `lg` (G1), SidePanelColumn is now a full-width stacked row - without
// an override here, `size="lg"`'s own 479px would stay put inside that wider
// row, leaving empty background space (exactly what the report measured at
// 768: a 479px panel with 289px of empty background to its side). Forcing
// this ONE child (`SidePanel`'s root, the wrapper's only element child - see
// the spec's `toHaveCount(1)` check, kept ahead of any width assertion so a
// library change that adds a sibling fails with a clear message rather than
// a silent wrong measurement) to `width: full` below `lg` fixes that; `auto`
// at/above `lg` leaves the library's own intrinsic sizing in charge.
const panelColumn = css({
  "& > div": {
    width: { base: "full", lg: "[auto]" },
  },
});

/**
 * G4 issue 13: with a 33-char `turn.name`, the library's own "Turno
 * seleccionado" card overflows its content box (measured: panel +18px,
 * card's own box +50px at 1024). 100% internal to `@aymurai/ui`, verified
 * in `dist/index.js`: the name span (`OM`) and the time span (`DM`) both
 * carry `whiteSpace: "nowrap"`, their flex row (`IM`, `display:flex;
 * alignItems:center; gap:2`) has no `minWidth: 0` and doesn't wrap, and the
 * card (`NM`) is the FIRST CHILD of `SidePanel`'s root div - the same root
 * `className` lands on (`dist/index.js:25675`:
 * `D(AM({ size: m }), b)`).
 *
 * Passed as `className` directly on `<SidePanel>` below (the prop exists,
 * `SidePanel.d.ts`'s `className?: string`, and lands on that same root) -
 * NOT added to `panelColumn` above, which lives on `SidePanelColumn` (the
 * wrapper one level further out) and already carries G1's unrelated width
 * fix. Putting a library-internals selector on the library's own component
 * keeps the two fixes from mixing in one recipe.
 *
 * Selector is `"& > div:first-child span"`: `&` is the root (this class),
 * `> div:first-child` is the card (`NM`), and `span` reaches every span
 * inside it - which is THREE spans, not one: the `AvatarPill` initials
 * (`dist/index.js:1780` renders its own root as a bare `<span>`, itself a
 * direct child of the row, sibling to the name/time spans), the name, and
 * the time. Harmless for the avatar (2 characters never wrap) but the
 * blast radius is real and deliberate, not assumed - narrower alternatives
 * were considered and rejected: `"& span"` would also reach every span in
 * the suggested-people pills and action buttons below the card (real,
 * unneeded blast radius); `flexWrap: "wrap"` on the row instead of
 * `whiteSpace: "normal"` + `overflowWrap: "anywhere"` on the spans removes
 * the measured overflow too, but not for a single 40-char word with no
 * spaces to wrap at - `overflowWrap: anywhere` breaks mid-word as a last
 * resort and the other doesn't.
 *
 * No `"&&"` here (contrast with G2's `tutorialGridOverride`): every
 * property below already lives behind this structural descendant selector,
 * whose specificity is (0, 2, 2) - one class + one `:first-child`
 * pseudo-class, two type selectors - which already beats the library's
 * plain atomic classes (0, 1, 0) regardless of stylesheet/layer order.
 * `"&&"` only matters when a plain single-class rule ties the library's own
 * single-class rule on the SAME node; that's not the situation here.
 *
 * Upstream fix (not done here - `node_modules/@aymurai/ui` stays
 * unpatched): the row (`IM`) should carry `minWidth: 0`, and the name span
 * shouldn't be `nowrap`.
 */
const turnCardOverflowFix = css({
  "& > div:first-child span": {
    whiteSpace: "normal",
    overflowWrap: "anywhere",
  },
});

/**
 * G4 issue 13, follow-up found while measuring the fix above: the SAME
 * `currentSpeaker.label` that overflows the card also feeds that speaker's
 * own pill in the "Personas sugeridas" section below the card - every
 * existing speaker always renders a pill there (see the `people` array
 * below: `speakers.map(...)` always comes first). NOT a fixture artifact:
 * the active speaker is always in `speakers`, so their own long name always
 * has a pill.
 *
 * `dist/index.js`: the pill's name span (`Pg`) carries `whiteSpace:
 * "nowrap"` PLUS `flexShrink: "0"`, inside an `inline-flex` pill root
 * (marked `data-pill-root`, `Lg`'s recipe) that sits inside `div.PM`
 * (`display:flex; flexWrap:"wrap"; w:full`). Measured: `flexWrap: "wrap"`
 * on `PM` does NOT prevent a SINGLE wide pill from overflowing on its own
 * row - wrap only redistributes MULTIPLE items across lines; it cannot
 * shrink one item below its own min-content.
 *
 * Copying the card's two-property recipe alone does NOT fix this - measured,
 * not assumed: with `flex-basis: auto` and `flex-shrink: 0`, a flex item's
 * resolved main size never goes below its max-content size, regardless of
 * whether `whiteSpace: normal` allows wrapping - nothing in the flex
 * algorithm ever asks it to be narrower. `flexShrink` has to change too
 * (measured: `1` is enough once `minWidth: 0` removes the item's default
 * automatic minimum size, which is otherwise based on min-content and would
 * otherwise block shrinking on its own). `maxWidth: 100%` on the span was
 * tried and measured to be a NO-OP here: its containing block (the pill
 * root, `inline-flex`, itself sized by content) has no definite width, and
 * a percentage against an indefinite containing block resolves as `auto` -
 * the same trap RSP-04b hit with ReadingColumn's gutter/cap. `flexShrink` +
 * `minWidth: 0` doesn't have that problem: they act on the flex algorithm
 * directly, not on a percentage.
 *
 * Selector: `"& [data-pill-root] span"` - structural, but keyed off
 * `data-pill-root` (hardcoded `true` in the pill's own JSX, not a public
 * prop) rather than a `div`/`span` position count: the exact DOM depth from
 * `<SidePanel>`'s root to a pill's spans is five levels and more likely to
 * shift on a library refactor than this attribute is to be removed.
 * Reaches TWO spans per pill (the `AvatarPill` initials span AND the name
 * span) - harmless for the 2-character initials, same acceptable blast
 * radius as `turnCardOverflowFix` above. Verified NOT to reach the "Nuevo"
 * button: it's a plain `<button>` with an SVG icon and a bare text child,
 * no `<span>` - confirmed by node count in the CT spec, not assumed.
 *
 * Wins by structure, not `"&&"`: an attribute selector plus a type selector
 * is (0, 2, 1), which beats the library's plain atomic class (0, 1, 0)
 * regardless of stylesheet order - same reasoning as `turnCardOverflowFix`.
 *
 * Upstream fix (not done here - `node_modules/@aymurai/ui` stays
 * unpatched): `Pg` shouldn't combine `nowrap` with `flexShrink: 0` inside a
 * `flexWrap: wrap` container.
 */
const suggestedPersonPillFix = css({
  "& [data-pill-root] span": {
    whiteSpace: "normal",
    overflowWrap: "anywhere",
    flexShrink: "[1]",
    minWidth: "[0]",
  },
});

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
          className={cx(turnCardOverflowFix, suggestedPersonPillFix)}
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
