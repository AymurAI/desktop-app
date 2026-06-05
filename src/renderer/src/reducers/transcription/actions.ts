import type {
  Speaker,
  SuggestedSpeaker,
  Transcription,
  Turn,
} from "@/types/transcription";

/**
 * List of action types.
 */
export enum ActionTypes {
  ADD_TRANSCRIPTION = "ADD_TRANSCRIPTION",
  REMOVE_TRANSCRIPTION = "REMOVE_TRANSCRIPTION",
  RENAME_TRANSCRIPTION = "RENAME_TRANSCRIPTION",
  RENAME_SPEAKER_GLOBAL = "RENAME_SPEAKER_GLOBAL",
  REASSIGN_TURN_SPEAKER = "REASSIGN_TURN_SPEAKER",
  UPDATE_TURN_TEXT = "UPDATE_TURN_TEXT",
  UPDATE_TURN_START_MS = "UPDATE_TURN_START_MS",
  INSERT_TURN = "INSERT_TURN",
  REMOVE_TURN = "REMOVE_TURN",
  ADD_SPEAKER = "ADD_SPEAKER",
  ASSIGN_SUGGESTED_SPEAKER_TO_TURN = "ASSIGN_SUGGESTED_SPEAKER_TO_TURN",
  SPLIT_TURN = "SPLIT_TURN",
  MERGE_TURN_WITH_PREVIOUS = "MERGE_TURN_WITH_PREVIOUS",
}

/**
 * Generic action
 */
type Action<Type, Payload = {}> = {
  type: Type;
  payload: Payload;
};

export type AddTranscriptionAction = Action<
  ActionTypes.ADD_TRANSCRIPTION,
  { transcription: Transcription }
>;
/**
 * Adds a new transcription to the state
 * @param transcription Transcription to be added
 */
export function addTranscription(
  transcription: Transcription,
): AddTranscriptionAction {
  return {
    type: ActionTypes.ADD_TRANSCRIPTION,
    payload: { transcription },
  };
}

export type RemoveTranscriptionAction = Action<
  ActionTypes.REMOVE_TRANSCRIPTION,
  { id: string }
>;
/**
 * Removes a transcription from the state by id
 * @param id ID of the transcription to remove
 */
export function removeTranscription(id: string): RemoveTranscriptionAction {
  return {
    type: ActionTypes.REMOVE_TRANSCRIPTION,
    payload: { id },
  };
}

export type RenameSpeakerGlobalAction = Action<
  ActionTypes.RENAME_SPEAKER_GLOBAL,
  { transcriptionId: string; speakerId: string; newLabel: string }
>;
/**
 * Renames a speaker globally across the transcription, recalculating initials
 * @param transcriptionId ID of the transcription to modify
 * @param speakerId ID of the speaker to rename
 * @param newLabel New label for the speaker
 */
export function renameSpeakerGlobal(
  transcriptionId: string,
  speakerId: string,
  newLabel: string,
): RenameSpeakerGlobalAction {
  return {
    type: ActionTypes.RENAME_SPEAKER_GLOBAL,
    payload: { transcriptionId, speakerId, newLabel },
  };
}

export type ReassignTurnSpeakerAction = Action<
  ActionTypes.REASSIGN_TURN_SPEAKER,
  { transcriptionId: string; turnId: string; newSpeakerId: string }
>;
/**
 * Reassigns a turn to a different speaker
 * @param transcriptionId ID of the transcription to modify
 * @param turnId ID of the turn to reassign
 * @param newSpeakerId ID of the new speaker
 */
export function reassignTurnSpeaker(
  transcriptionId: string,
  turnId: string,
  newSpeakerId: string,
): ReassignTurnSpeakerAction {
  return {
    type: ActionTypes.REASSIGN_TURN_SPEAKER,
    payload: { transcriptionId, turnId, newSpeakerId },
  };
}

export type UpdateTurnTextAction = Action<
  ActionTypes.UPDATE_TURN_TEXT,
  { transcriptionId: string; turnId: string; text: string }
>;
/**
 * Updates the text content of a turn
 * @param transcriptionId ID of the transcription to modify
 * @param turnId ID of the turn to update
 * @param text New text content
 */
export function updateTurnText(
  transcriptionId: string,
  turnId: string,
  text: string,
): UpdateTurnTextAction {
  return {
    type: ActionTypes.UPDATE_TURN_TEXT,
    payload: { transcriptionId, turnId, text },
  };
}

export type UpdateTurnStartMsAction = Action<
  ActionTypes.UPDATE_TURN_START_MS,
  { transcriptionId: string; turnId: string; startMs: number }
>;
/**
 * Updates the start timestamp (in milliseconds) of a turn.
 * If the new start exceeds the current end, end is shifted to keep duration positive.
 */
export function updateTurnStartMs(
  transcriptionId: string,
  turnId: string,
  startMs: number,
): UpdateTurnStartMsAction {
  return {
    type: ActionTypes.UPDATE_TURN_START_MS,
    payload: { transcriptionId, turnId, startMs },
  };
}

export type InsertTurnAction = Action<
  ActionTypes.INSERT_TURN,
  { transcriptionId: string; afterTurnId: string | null; turn: Turn }
>;
/**
 * Inserts a new turn after the specified turn, or at the end if afterTurnId is null
 * @param transcriptionId ID of the transcription to modify
 * @param afterTurnId ID of the turn to insert after, or null to append at end
 * @param turn Turn to insert
 */
export function insertTurn(
  transcriptionId: string,
  afterTurnId: string | null,
  turn: Turn,
): InsertTurnAction {
  return {
    type: ActionTypes.INSERT_TURN,
    payload: { transcriptionId, afterTurnId, turn },
  };
}

export type RemoveTurnAction = Action<
  ActionTypes.REMOVE_TURN,
  { transcriptionId: string; turnId: string }
>;
/**
 * Removes a turn from a transcription
 * @param transcriptionId ID of the transcription to modify
 * @param turnId ID of the turn to remove
 */
export function removeTurn(
  transcriptionId: string,
  turnId: string,
): RemoveTurnAction {
  return {
    type: ActionTypes.REMOVE_TURN,
    payload: { transcriptionId, turnId },
  };
}

export type AddSpeakerAction = Action<
  ActionTypes.ADD_SPEAKER,
  { transcriptionId: string; speaker: Speaker }
>;
/**
 * Adds a new speaker to a transcription
 * @param transcriptionId ID of the transcription to modify
 * @param speaker Speaker to add
 */
export function addSpeaker(
  transcriptionId: string,
  speaker: Speaker,
): AddSpeakerAction {
  return {
    type: ActionTypes.ADD_SPEAKER,
    payload: { transcriptionId, speaker },
  };
}

export type RenameTranscriptionAction = Action<
  ActionTypes.RENAME_TRANSCRIPTION,
  { transcriptionId: string; title: string }
>;
/**
 * Renames a transcription's title
 * @param transcriptionId ID of the transcription to rename
 * @param title New title
 */
export function renameTranscription(
  transcriptionId: string,
  title: string,
): RenameTranscriptionAction {
  return {
    type: ActionTypes.RENAME_TRANSCRIPTION,
    payload: { transcriptionId, title },
  };
}

export type AssignSuggestedSpeakerToTurnAction = Action<
  ActionTypes.ASSIGN_SUGGESTED_SPEAKER_TO_TURN,
  { transcriptionId: string; turnId: string; suggested: SuggestedSpeaker }
>;
/**
 * Finds or creates the speaker in the transcription from a suggested speaker,
 * then reassigns the turn to it
 * @param transcriptionId ID of the transcription to modify
 * @param turnId ID of the turn to reassign
 * @param suggested The suggested speaker data
 */
export function assignSuggestedSpeakerToTurn(
  transcriptionId: string,
  turnId: string,
  suggested: SuggestedSpeaker,
): AssignSuggestedSpeakerToTurnAction {
  return {
    type: ActionTypes.ASSIGN_SUGGESTED_SPEAKER_TO_TURN,
    payload: { transcriptionId, turnId, suggested },
  };
}

export type SplitTurnAction = Action<
  ActionTypes.SPLIT_TURN,
  {
    transcriptionId: string;
    turnId: string;
    startChar: number;
    endChar: number;
    newSpeakerId: string;
  }
>;
/**
 * Splits a turn's [startChar,endChar) text range into a new speaker. Text before
 * and after the range stays with the original speaker. If the range covers the
 * whole (trimmed) text, the turn is just reassigned. No-op if the trimmed range
 * is empty.
 */
export function splitTurn(
  transcriptionId: string,
  turnId: string,
  startChar: number,
  endChar: number,
  newSpeakerId: string,
): SplitTurnAction {
  return {
    type: ActionTypes.SPLIT_TURN,
    payload: { transcriptionId, turnId, startChar, endChar, newSpeakerId },
  };
}

export type MergeTurnWithPreviousAction = Action<
  ActionTypes.MERGE_TURN_WITH_PREVIOUS,
  { transcriptionId: string; turnId: string }
>;
/**
 * Merges the turn into the turn immediately before it (text joined by a space,
 * endMs extended). No-op if it is the first turn.
 */
export function mergeTurnWithPrevious(
  transcriptionId: string,
  turnId: string,
): MergeTurnWithPreviousAction {
  return {
    type: ActionTypes.MERGE_TURN_WITH_PREVIOUS,
    payload: { transcriptionId, turnId },
  };
}
