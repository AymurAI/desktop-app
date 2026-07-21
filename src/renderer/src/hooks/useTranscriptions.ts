import { useContext } from "react";

import {
  TranscriptionContext,
  TranscriptionDispatchContext,
} from "@/context/Transcription";

/**
 * Hook used to view the transcriptions in the state
 */
export function useTranscriptions() {
  return useContext(TranscriptionContext);
}

/**
 * Hook used to dispatch actions that modify the transcription state
 */
export function useTranscriptionDispatch() {
  return useContext(TranscriptionDispatchContext);
}
