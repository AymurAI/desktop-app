import { CanceledError } from "axios";

import { ASRDocumentSchema } from "@/schema/asr";
import type { Transcription } from "@/types/transcription";
import { STT_MOCK_DELAY_MS, USE_MOCK_STT } from "@/utils/config";
import api from "../api";
import { mapASRDocumentToTranscription } from "./asrMapper";
import { buildFixture } from "./fixtures/transcription";

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

  const audioObjectUrl = URL.createObjectURL(file);

  const form = new FormData();
  form.append("file", file);

  const raw = await api.post("/asr/transcribe", form, {
    headers: { "Content-Type": "multipart/form-data" },
    signal,
  });

  const doc = ASRDocumentSchema.parse(raw);
  return mapASRDocumentToTranscription(doc, file, audioObjectUrl);
}
