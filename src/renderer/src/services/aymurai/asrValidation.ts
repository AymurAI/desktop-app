import type { Transcription } from "@/types/transcription";
import api from "../api";
import { mapTranscriptionToASRParagraphRequests } from "./asrMapper";

export async function saveValidation(
  transcription: Transcription,
  signal?: AbortSignal,
): Promise<void> {
  const body = {
    title: transcription.title,
    document: mapTranscriptionToASRParagraphRequests(transcription),
  };
  await api.post(`/asr/validation/document/${transcription.id}`, body, {
    signal,
  });
}

export async function loadValidation(
  documentId: string,
  signal?: AbortSignal,
): Promise<unknown> {
  return api.get(`/asr/validation/document/${documentId}`, { signal });
}
