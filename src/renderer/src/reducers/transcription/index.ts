import type { Speaker, Transcription } from "@/types/transcription";
import { apportionTimeRange } from "@/utils/apportion-time-range";

import {
  ActionTypes,
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
  | SplitTurnAction
  | MergeTurnWithPreviousAction
  | MergeTurnWithNextAction
  | ClearTranscriptionsAction;

/**
 * Computes speaker initials from a label.
 * Takes the first character of each word, max 2 characters, uppercased.
 * E.g. "Dra. Silva" → "DS", "Locutor 1" → "L1", "Jueza" → "JU"
 */
export function computeInitials(label: string): string {
  const words = label.trim().split(/\s+/);

  if (words.length === 1) {
    // Single word: take first two characters
    return words[0].slice(0, 2).toUpperCase();
  }

  // Multi-word: take first char of each word, max 2
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
}

const PERSONA_LABEL_RE = /^Persona (\d+)$/;

/**
 * Renumbers auto-generated "Persona N" labels so they stay contiguous
 * (1, 2, 3, ...) after a rename/merge relabels or drops one of them.
 * Speakers with a custom label (anything not matching "Persona N") are
 * left untouched.
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
    personaSpeakers.map((s, i) => [s.id, `Persona ${i + 1}`]),
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
      return updateTranscription(state, transcriptionId, (t) => ({
        ...t,
        turns: t.turns.map((turn) => {
          if (turn.id !== turnId) return turn;
          const duration = Math.max(0, turn.endMs - turn.startMs);
          return {
            ...turn,
            startMs: safeStart,
            endMs: safeStart + duration,
          };
        }),
      }));
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
