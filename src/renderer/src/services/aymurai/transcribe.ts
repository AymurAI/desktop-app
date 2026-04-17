import { CanceledError } from "axios";

import { USE_MOCK_STT, STT_MOCK_DELAY_MS } from "@/utils/config";
import { TranscriptionSchema } from "@/schema/transcription";
import { buildFixture } from "./fixtures/transcription";
import type { Transcription } from "@/types/transcription";
import api from "../api";

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
