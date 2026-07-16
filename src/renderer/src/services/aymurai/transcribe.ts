import { CanceledError } from "axios";

import {
  STT_MOCK_DELAY_MS,
  USE_ASR_CACHE,
  USE_MOCK_STT,
} from "@/constants/config";
import type { Transcription } from "@/types/transcription";
import { MOCK_PREVIEW_CHUNKS, buildFixture } from "./fixtures/transcription";
import { transcribeStream } from "./transcribeStream";

export interface TranscribeOptions {
  signal?: AbortSignal;
  durationMs?: number;
  onProgress?: (ratio: number) => void;
  onPartialText?: (text: string) => void;
}

export async function transcribe(
  file: File,
  { signal, durationMs, onProgress, onPartialText }: TranscribeOptions = {},
): Promise<Transcription> {
  if (USE_MOCK_STT) {
    return new Promise((resolve, reject) => {
      const startedAt = Date.now();
      const tickMs = 100;
      let lastChunkIdx = -1;
      const tick = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const ratio = Math.min(0.99, elapsed / STT_MOCK_DELAY_MS);
        onProgress?.(ratio);

        if (onPartialText) {
          const chunkIdx = Math.min(
            MOCK_PREVIEW_CHUNKS.length - 1,
            Math.floor(ratio * MOCK_PREVIEW_CHUNKS.length),
          );
          if (chunkIdx !== lastChunkIdx) {
            lastChunkIdx = chunkIdx;
            onPartialText(MOCK_PREVIEW_CHUNKS.slice(0, chunkIdx + 1).join(" "));
          }
        }
      }, tickMs);
      const timer = setTimeout(() => {
        clearInterval(tick);
        onProgress?.(1);
        const fixture = buildFixture(file);
        resolve(
          typeof durationMs === "number" &&
            Number.isFinite(durationMs) &&
            durationMs > 0
            ? { ...fixture, audioDurationMs: Math.round(durationMs) }
            : fixture,
        );
      }, STT_MOCK_DELAY_MS);
      signal?.addEventListener("abort", () => {
        clearInterval(tick);
        clearTimeout(timer);
        reject(new CanceledError());
      });
    });
  }

  return transcribeStream(file, {
    signal,
    useCache: USE_ASR_CACHE,
    durationMs,
    onProgress,
    onPartialText,
  });
}

export interface TranscribeFileInput {
  file: File;
  durationMs?: number;
}
