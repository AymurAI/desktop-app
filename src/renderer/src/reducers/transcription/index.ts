import type { Speaker, Transcription } from "@/types/transcription";

import {
  ActionTypes,
  type AddSpeakerAction,
  type AddTranscriptionAction,
  type AssignSuggestedSpeakerToTurnAction,
  type InsertTurnAction,
  type ReassignTurnSpeakerAction,
  type RemoveTranscriptionAction,
  type RemoveTurnAction,
  type RenameSpeakerGlobalAction,
  type RenameTranscriptionAction,
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
  | AssignSuggestedSpeakerToTurnAction;

/**
 * Computes speaker initials from a label.
 * Takes the first character of each word, max 2 characters, uppercased.
 * E.g. "Dra. Silva" → "DS", "Locutor 1" → "L1", "Jueza" → "JU"
 */
function computeInitials(label: string): string {
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
      return updateTranscription(state, transcriptionId, (t) => ({
        ...t,
        speakers: t.speakers.map((s) =>
          s.id === speakerId
            ? { ...s, label: newLabel, initials: computeInitials(newLabel) }
            : s,
        ),
      }));
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
    // ASSIGN SUGGESTED SPEAKER TO TURN
    // ----------------
    case ActionTypes.ASSIGN_SUGGESTED_SPEAKER_TO_TURN: {
      const { transcriptionId, turnId, suggested } = payload;
      return updateTranscription(state, transcriptionId, (t) => {
        const existing = t.speakers.find((s) => s.label === suggested.label);

        if (existing) {
          // Speaker with same label already exists — reassign turn to it
          return {
            ...t,
            turns: t.turns.map((turn) =>
              turn.id === turnId ? { ...turn, speakerId: existing.id } : turn,
            ),
          };
        }

        // Create a new speaker from the suggested data
        const newSpeaker: Speaker = {
          id: suggested.id,
          label: suggested.label,
          initials: suggested.initials,
          color: suggested.color,
        };

        return {
          ...t,
          speakers: [...t.speakers, newSpeaker],
          turns: t.turns.map((turn) =>
            turn.id === turnId ? { ...turn, speakerId: newSpeaker.id } : turn,
          ),
        };
      });
    }

    // ----------------
    // DEFAULT
    // ----------------
    default:
      return state;
  }
}
