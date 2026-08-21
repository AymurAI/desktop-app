import { PERSONA_LABEL_TEMPLATE } from "@/constants/i18n/locales/es/voice-to-text";
import {
  SPEAKER_PALETTE,
  type Speaker,
  type Transcription,
} from "@/types/transcription";
import { apportionTimeRange } from "@/utils/apportion-time-range";

import {
  ActionTypes,
  type AddPersonaSpeakerAction,
  type AddSpeakerAction,
  type AddTranscriptionAction,
  type ClearTranscriptionsAction,
  type InsertTurnAction,
  type MergeTurnWithNextAction,
  type MergeTurnWithPreviousAction,
  type ReassignTurnSpeakerAction,
  type RemoveTranscriptionAction,
  type RemoveTurnAction,
  type RenameSpeakerGlobalAction,
  type RenameTranscriptionAction,
  type SplitTurnAction,
  type UpdateTurnStartMsAction,
  type UpdateTurnTextAction,
} from "./actions";

type State = Transcription[];

export type TranscriptionAction =
  | AddTranscriptionAction
  | RemoveTranscriptionAction
  | RenameTranscriptionAction
  | RenameSpeakerGlobalAction
  | ReassignTurnSpeakerAction
  | UpdateTurnTextAction
  | UpdateTurnStartMsAction
  | InsertTurnAction
  | RemoveTurnAction
  | AddSpeakerAction
  | AddPersonaSpeakerAction
  | SplitTurnAction
  | MergeTurnWithPreviousAction
  | MergeTurnWithNextAction
  | ClearTranscriptionsAction;

/**
 * Computes speaker initials from a label.
 * Single word: first two characters, uppercased. E.g. "Jueza" → "JU".
 * Multiple words, last one numeric: first character of the first word plus
 * the FULL number (3 characters max), so "Persona 10" → "P10" instead of
 * colliding with "Persona 1" on "P1" — G7 criterion 4
 * (tasks/responsive-fixes/issues/G7-modo-edicion-personas.md). E.g. "Persona
 * 9" → "P9", "Persona 10" → "P10", "Locutor 11" → "L11".
 * Multiple words, none numeric: first character of the first two words,
 * max 2 characters, uppercased. E.g. "Dra. Silva" → "DS".
 */
export function computeInitials(label: string): string {
  const words = label.trim().split(/\s+/);

  if (words.length === 1) {
    // Single word: take first two characters
    return words[0].slice(0, 2).toUpperCase();
  }

  const lastWord = words[words.length - 1];
  if (/^\d+$/.test(lastWord)) {
    // Last word is a number: first letter of the first word + the number,
    // capped at 3 characters total (a 4th would overflow the avatar's 24px
    // circle). That cap is what bounds uniqueness to "Persona 1".."Persona
    // 99": "Persona 100" → "P10", colliding with "Persona 10" — beyond 99,
    // color and the full label (still shown alongside the badge) are the
    // desambiguators, not the initials.
    return `${words[0].charAt(0)}${lastWord}`.slice(0, 3).toUpperCase();
  }

  // Multi-word, non-numeric: take first char of each word, max 2
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
}

/**
 * G7 (tasks/responsive-fixes/issues/G7-modo-edicion-personas.md), i18n
 * restriction: derives the recognizer regex from `PERSONA_LABEL_TEMPLATE`
 * (constants/i18n/locales/es/voice-to-text.ts) instead of writing a second,
 * hand-maintained regex - if the template and the regex ever drifted apart,
 * `nextPersonaLabel` below would stop recognizing existing "Persona N"
 * speakers and reset the counter to 1, a new F4 (duplicate persona labels)
 * by another route, right after fixing the original one. Splits the
 * template on its `{{n}}` placeholder and escapes each literal half
 * separately before rebuilding the regex - concatenating the escaped
 * template naively (or not escaping at all) would let a template containing
 * `.`, `(`, or any other regex metacharacter silently produce a wrong or
 * unanchored pattern.
 *
 * Import-mechanism choice (three were measured, none is mandatory - see the
 * ticket): (A) importing `@/constants/i18n` (the bootstrap) runs
 * `i18n.use(initReactI18next).init(...)` at import time, and several test
 * files (e.g. turn-side-panel.test.tsx) import this reducer while mocking
 * `react-i18next` with a factory that doesn't export `initReactI18next` -
 * `i18next.use(undefined)` throws at import time and takes down the whole
 * test file, not just an assertion. (B) `import i18n from "i18next"` (the
 * bare package, un-configured) avoids that crash, but `test/setup.ts` never
 * initializes it and `constants/i18n` has exactly one import site in the
 * whole app (main.tsx) - so under vitest `t()` would return the raw key
 * instead of "Persona N". (C), used here: import the plain string constant
 * straight from its locale module. `voice-to-text.ts` has no i18next/
 * react-i18next import of its own, so this carries no init dependency and
 * no risk of an incomplete `react-i18next` mock breaking an unrelated test
 * file. The trade-off: the label can't change with a runtime language
 * switch - acceptable today, since `constants/i18n/index.ts` registers only
 * one locale (`resources: { es }`, `fallbackLng: "es"`) and a persona's
 * label is data persisted on the speaker, not re-derived on each render, so
 * a future language switch wouldn't retroactively relabel it either way.
 */
function derivePersonaLabelRegex(template: string): RegExp {
  const placeholder = "{{n}}";
  const placeholderIndex = template.indexOf(placeholder);
  if (placeholderIndex === -1) {
    throw new Error(
      `PERSONA_LABEL_TEMPLATE ("${template}") is missing the "${placeholder}" placeholder`,
    );
  }
  const escapeRegExp = (segment: string) =>
    segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const before = escapeRegExp(template.slice(0, placeholderIndex));
  const after = escapeRegExp(
    template.slice(placeholderIndex + placeholder.length),
  );
  return new RegExp(`^${before}(\\d+)${after}$`, "i");
}

const PERSONA_LABEL_RE = derivePersonaLabelRegex(PERSONA_LABEL_TEMPLATE);

/**
 * Label for the next auto-generated speaker: one past the highest existing
 * "Persona N" label, or "Persona 1" if there are none — regardless of how
 * many other (custom-named) speakers exist. Used by "Nuevo" in the side
 * panel. `RENAME_SPEAKER_GLOBAL` keeps "Persona N" speakers renumbered
 * contiguously after a rename or merge-collision drop (see
 * `renumberPersonaSpeakers` below), so in practice the highest existing
 * number and the count of "Persona N" speakers are the same value by the
 * time this runs — computing from the max (rather than "count + 1") is kept
 * anyway as the more robust invariant: it can never collide with an
 * existing label even if that contiguity assumption is ever broken by a
 * future code path that adds/removes "Persona N" speakers without going
 * through the renumbering step.
 *
 * Builds the label from the SAME `PERSONA_LABEL_TEMPLATE` the regex above
 * derives from (see its docblock) - the format itself is unchanged from
 * before this ticket ("Persona <number>", nothing else), so `computeInitials`
 * (above), which caps to 3 characters only when the label's last word is a
 * bare number, keeps working unmodified.
 */
export function nextPersonaLabel(speakers: Speaker[]): string {
  const numbers = speakers
    .map((s) => s.label.match(PERSONA_LABEL_RE)?.[1])
    .filter((n): n is string => n !== undefined)
    .map(Number);
  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return PERSONA_LABEL_TEMPLATE.replace("{{n}}", String(next));
}

/**
 * Renumbers auto-generated "Persona N" labels so they stay contiguous
 * (1, 2, 3, ...) after a rename/merge relabels or drops one of them.
 * Speakers with a custom label (anything not matching "Persona N",
 * including "Persona no identificada") are left untouched, and no
 * speaker's position in the array changes - only `label`/`initials` are
 * ever reassigned, keyed by `id`.
 *
 * Restored 2026-08-21 (see `RENAME_SPEAKER_GLOBAL` below for the product
 * decision behind reintroducing this): contiguous numbering was previously
 * removed over a concern that it lets a "Persona N" label point at a
 * different underlying speaker than a moment before. That concern is about
 * label stability for a human reading it OUTSIDE the app (e.g. a written
 * note taken mid-review) - it was never about `id`-based joins inside the
 * app, which stay completely unaffected by this function: every consumer
 * (turn reassignment, side panel selection, ASR export) resolves speakers
 * by `id`, never by `label`.
 */
function renumberPersonaSpeakers(speakers: Speaker[]): Speaker[] {
  const personaSpeakers = speakers
    .filter((s) => PERSONA_LABEL_RE.test(s.label))
    .sort((a, b) => {
      const aNum = Number(a.label.match(PERSONA_LABEL_RE)?.[1]);
      const bNum = Number(b.label.match(PERSONA_LABEL_RE)?.[1]);
      return aNum - bNum;
    });

  const nextLabelById = new Map(
    personaSpeakers.map((s, i) => [
      s.id,
      PERSONA_LABEL_TEMPLATE.replace("{{n}}", String(i + 1)),
    ]),
  );

  return speakers.map((s) => {
    const nextLabel = nextLabelById.get(s.id);
    if (!nextLabel || nextLabel === s.label) return s;
    return { ...s, label: nextLabel, initials: computeInitials(nextLabel) };
  });
}

/**
 * Updates a specific transcription in the state by id
 */
function updateTranscription(
  state: State,
  transcriptionId: string,
  updater: (t: Transcription) => Transcription,
): State {
  return state.map((t) => (t.id === transcriptionId ? updater(t) : t));
}

/**
 * Reducer function for `Transcription[]` state
 * @param state Current state
 * @param action Action to perform
 * @returns A new state
 */
export default function reducer(
  state: State,
  action: TranscriptionAction,
): State {
  const { type, payload } = action;

  switch (type) {
    // ----------------
    // ADD TRANSCRIPTION
    // ----------------
    case ActionTypes.ADD_TRANSCRIPTION: {
      const { transcription } = payload;
      return [...state, transcription];
    }

    // ----------------
    // REMOVE TRANSCRIPTION
    // ----------------
    case ActionTypes.REMOVE_TRANSCRIPTION: {
      const { id } = payload;
      return state.filter((t) => t.id !== id);
    }

    // ----------------
    // RENAME TRANSCRIPTION
    // ----------------
    case ActionTypes.RENAME_TRANSCRIPTION: {
      const { transcriptionId, title } = payload;
      return updateTranscription(state, transcriptionId, (t) => ({
        ...t,
        title,
      }));
    }

    // ----------------
    // RENAME SPEAKER GLOBAL
    // ----------------
    case ActionTypes.RENAME_SPEAKER_GLOBAL: {
      const { transcriptionId, speakerId, newLabel } = payload;
      return updateTranscription(state, transcriptionId, (t) => {
        const trimmed = newLabel.trim();
        if (!trimmed) return t;

        // If another speaker already uses this label (case-insensitive), merge
        // into it: reassign this speaker's turns to the existing one and drop
        // this speaker — avoids two distinct speakers sharing the same label.
        const existing = t.speakers.find(
          (s) =>
            s.id !== speakerId &&
            s.label.toLowerCase() === trimmed.toLowerCase(),
        );

        // G7 (tasks/responsive-fixes/issues/G7-modo-edicion-personas.md),
        // criterion 2, then reverted, then restored again (2026-08-21):
        // this end with `renumberPersonaSpeakers` was removed over a
        // concern that a "Persona N" label could point at a different
        // underlying speaker than a moment before (e.g. renaming s2 to
        // "Testigo" would leave s3 - previously "Persona 2" - holding that
        // label instead, one down the chain). That concern is real but
        // narrow: it's about label stability for a human reading it
        // OUTSIDE the app (e.g. a note taken mid-review before every
        // speaker is identified), not about `id`-based joins inside the
        // app - every consumer here (turn reassignment below, side panel
        // selection, ASR export) resolves speakers by `id`, never by
        // `label`, so that stays completely unaffected either way. Product
        // decided the UX cost of leaving numbering gaps (1, 2, 4, 5) after
        // a rename/merge outweighs that narrow risk - see
        // `renumberPersonaSpeakers`'s docblock above.
        const renamed = existing
          ? {
              ...t,
              speakers: t.speakers.filter((s) => s.id !== speakerId),
              turns: t.turns.map((turn) =>
                turn.speakerId === speakerId
                  ? { ...turn, speakerId: existing.id }
                  : turn,
              ),
            }
          : {
              ...t,
              speakers: t.speakers.map((s) =>
                s.id === speakerId
                  ? { ...s, label: trimmed, initials: computeInitials(trimmed) }
                  : s,
              ),
            };

        return {
          ...renamed,
          speakers: renumberPersonaSpeakers(renamed.speakers),
        };
      });
    }

    // ----------------
    // REASSIGN TURN SPEAKER
    // ----------------
    case ActionTypes.REASSIGN_TURN_SPEAKER: {
      const { transcriptionId, turnId, newSpeakerId } = payload;
      return updateTranscription(state, transcriptionId, (t) => ({
        ...t,
        turns: t.turns.map((turn) =>
          turn.id === turnId ? { ...turn, speakerId: newSpeakerId } : turn,
        ),
      }));
    }

    // ----------------
    // UPDATE TURN TEXT
    // ----------------
    case ActionTypes.UPDATE_TURN_TEXT: {
      const { transcriptionId, turnId, text } = payload;
      return updateTranscription(state, transcriptionId, (t) => ({
        ...t,
        turns: t.turns.map((turn) =>
          turn.id === turnId ? { ...turn, text } : turn,
        ),
      }));
    }

    // ----------------
    // UPDATE TURN START MS
    // ----------------
    case ActionTypes.UPDATE_TURN_START_MS: {
      const { transcriptionId, turnId, startMs } = payload;
      const safeStart = Math.max(0, Math.floor(startMs));
      return updateTranscription(state, transcriptionId, (t) => {
        const turnIdx = t.turns.findIndex((turn) => turn.id === turnId);
        if (turnIdx < 0) return t;

        const duration = Math.max(
          0,
          t.turns[turnIdx].endMs - t.turns[turnIdx].startMs,
        );
        const isLastTurn = turnIdx === t.turns.length - 1;
        return {
          ...t,
          turns: t.turns.map((turn, idx) => {
            if (idx === turnIdx - 1) {
              return { ...turn, endMs: safeStart };
            }
            if (idx !== turnIdx) return turn;
            return {
              ...turn,
              startMs: safeStart,
              endMs: isLastTurn ? t.audioDurationMs : safeStart + duration,
            };
          }),
        };
      });
    }

    // ----------------
    // INSERT TURN
    // ----------------
    case ActionTypes.INSERT_TURN: {
      const { transcriptionId, afterTurnId, turn } = payload;
      return updateTranscription(state, transcriptionId, (t) => {
        if (afterTurnId === null) {
          return { ...t, turns: [...t.turns, turn] };
        }

        const insertIdx = t.turns.findIndex((tu) => tu.id === afterTurnId);
        if (insertIdx === -1) {
          return { ...t, turns: [...t.turns, turn] };
        }

        const newTurns = [
          ...t.turns.slice(0, insertIdx + 1),
          turn,
          ...t.turns.slice(insertIdx + 1),
        ];
        return { ...t, turns: newTurns };
      });
    }

    // ----------------
    // REMOVE TURN
    // ----------------
    case ActionTypes.REMOVE_TURN: {
      const { transcriptionId, turnId } = payload;
      return updateTranscription(state, transcriptionId, (t) => ({
        ...t,
        turns: t.turns.filter((turn) => turn.id !== turnId),
      }));
    }

    // ----------------
    // ADD SPEAKER
    // ----------------
    case ActionTypes.ADD_SPEAKER: {
      const { transcriptionId, speaker } = payload;
      return updateTranscription(state, transcriptionId, (t) => ({
        ...t,
        speakers: [...t.speakers, speaker],
      }));
    }

    // ----------------
    // ADD PERSONA SPEAKER
    // ----------------
    // G7 F4: label/initials/color are derived HERE, from the transcription's
    // own speakers array at apply time - not by the caller from a `speakers`
    // prop that every handler in a React batch reads identically. That's
    // what makes N of these dispatched back-to-back (e.g. N rapid "+ Nuevo"
    // clicks in the same batch) each see the PREVIOUS dispatch's result and
    // produce N distinct labels and N distinct colors, instead of all N
    // colliding on the same "Persona K" / same palette color.
    case ActionTypes.ADD_PERSONA_SPEAKER: {
      const { transcriptionId, id } = payload;
      return updateTranscription(state, transcriptionId, (t) => {
        const label = nextPersonaLabel(t.speakers);
        const speaker: Speaker = {
          id,
          label,
          initials: computeInitials(label),
          color: SPEAKER_PALETTE[t.speakers.length % SPEAKER_PALETTE.length],
        };
        return { ...t, speakers: [...t.speakers, speaker] };
      });
    }

    // ----------------
    // SPLIT TURN
    // ----------------
    case ActionTypes.SPLIT_TURN: {
      const { transcriptionId, turnId, startChar, endChar, newSpeakerId } =
        payload;
      return updateTranscription(state, transcriptionId, (tr) => {
        const idx = tr.turns.findIndex((t) => t.id === turnId);
        if (idx < 0) return tr;
        const turn = tr.turns[idx];
        const pre = turn.text.slice(0, startChar).trim();
        const mid = turn.text.slice(startChar, endChar).trim();
        const post = turn.text.slice(endChar).trim();
        if (!mid) return tr;
        if (!pre && !post) {
          return {
            ...tr,
            turns: tr.turns.map((t) =>
              t.id === turnId ? { ...t, speakerId: newSpeakerId } : t,
            ),
          };
        }
        // There's no word-level timing, so apportion the turn's time range
        // across the split pieces by character offset — each piece gets its
        // own non-overlapping range instead of all pieces claiming the
        // original full range (which would make them indistinguishable for
        // playback highlighting/seeking).
        const [msAtStartChar, msAtEndChar] = apportionTimeRange(
          turn.startMs,
          turn.endMs,
          turn.text.length,
          [startChar, endChar],
        );
        const pieces: typeof tr.turns = [];
        if (pre)
          pieces.push({
            ...turn,
            text: pre,
            startMs: turn.startMs,
            endMs: msAtStartChar,
          }); // keeps original id
        pieces.push({
          ...turn,
          id: crypto.randomUUID(),
          speakerId: newSpeakerId,
          text: mid,
          // When pre/post is dropped (its trimmed text was whitespace-only),
          // mid absorbs that edge's time span too, instead of leaving a gap
          // that no turn covers — startChar/endChar are offsets into the raw,
          // untrimmed text, so a dropped edge's span still needs a home.
          startMs: pre ? msAtStartChar : turn.startMs,
          endMs: post ? msAtEndChar : turn.endMs,
        });
        if (post)
          pieces.push({
            ...turn,
            id: pre ? crypto.randomUUID() : turn.id,
            text: post,
            startMs: msAtEndChar,
            endMs: turn.endMs,
          });
        return {
          ...tr,
          turns: [
            ...tr.turns.slice(0, idx),
            ...pieces,
            ...tr.turns.slice(idx + 1),
          ],
        };
      });
    }

    // ----------------
    // MERGE TURN WITH PREVIOUS
    // ----------------
    case ActionTypes.MERGE_TURN_WITH_PREVIOUS: {
      const { transcriptionId, turnId } = payload;
      return updateTranscription(state, transcriptionId, (tr) => {
        const i = tr.turns.findIndex((t) => t.id === turnId);
        if (i <= 0) return tr;
        const prev = tr.turns[i - 1];
        const cur = tr.turns[i];
        const merged = {
          ...prev,
          text: `${prev.text.replace(/\s+$/, "")} ${cur.text.replace(/^\s+/, "")}`.trim(),
          endMs: Math.max(prev.endMs, cur.endMs),
        };
        return {
          ...tr,
          turns: [
            ...tr.turns.slice(0, i - 1),
            merged,
            ...tr.turns.slice(i + 1),
          ],
        };
      });
    }

    // ----------------
    // MERGE TURN WITH NEXT
    // ----------------
    case ActionTypes.MERGE_TURN_WITH_NEXT: {
      const { transcriptionId, turnId } = payload;
      return updateTranscription(state, transcriptionId, (tr) => {
        const i = tr.turns.findIndex((t) => t.id === turnId);
        if (i < 0 || i >= tr.turns.length - 1) return tr;
        const cur = tr.turns[i];
        const next = tr.turns[i + 1];
        const merged = {
          ...cur,
          speakerId: next.speakerId,
          text: `${cur.text.replace(/\s+$/, "")} ${next.text.replace(/^\s+/, "")}`.trim(),
          endMs: Math.max(cur.endMs, next.endMs),
        };
        return {
          ...tr,
          turns: [...tr.turns.slice(0, i), merged, ...tr.turns.slice(i + 2)],
        };
      });
    }

    // ----------------
    // CLEAR TRANSCRIPTIONS
    // ----------------
    case ActionTypes.CLEAR_TRANSCRIPTIONS: {
      return [];
    }

    // ----------------
    // DEFAULT
    // ----------------
    default:
      return state;
  }
}
