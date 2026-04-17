import { CanceledError } from "axios";

import { TranscriptionSchema } from "@/schema/transcription";
import type { Transcription } from "@/types/transcription";
import { STT_MOCK_DELAY_MS, USE_MOCK_STT } from "@/utils/config";
import api from "../api";
import { buildFixture } from "./fixtures/transcription";

/**
 * Sends an audio file to the STT service and returns a Transcription.
 * When USE_MOCK_STT is true it resolves after STT_MOCK_DELAY_MS with fixture data.
 * @param file Audio file to transcribe
 * @param signal Optional AbortSignal for cancellation
 */
export async function transcribe(
  file: File,
  signal?: AbortSignal,
): Promise<Transcription> {
  if (USE_MOCK_STT) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => resolve(buildFixture(file)),
        STT_MOCK_DELAY_MS,
      );
      signal?.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new CanceledError());
      });
    });
  }

  const form = new FormData();
  form.append("audio", file);

  const data = await api.post("/stt/transcribe", form, {
    headers: { "Content-Type": "multipart/form-data" },
    signal,
  });

  return TranscriptionSchema.parse(data);
}
