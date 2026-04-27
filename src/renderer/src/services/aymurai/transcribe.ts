import { CanceledError } from "axios";

import type { Transcription } from "@/types/transcription";
import { STT_MOCK_DELAY_MS, USE_ASR_CACHE, USE_MOCK_STT } from "@/utils/config";
import { buildFixture } from "./fixtures/transcription";
import { transcribeStream } from "./transcribeStream";

export interface TranscribeOptions {
  signal?: AbortSignal;
  onProgress?: (ratio: number) => void;
  onPartialText?: (text: string) => void;
}

const MOCK_PREVIEW_CHUNKS = [
  "Estamos aquí reunidos en virtud de un caso que tiene el número 78274.",
  "La fiscalía está trabajando la investigación de ese caso, para lo cual estaba prevista la discusión de los hechos como corresponde en un juicio oral y público.",
  "Nosotros lo que solicitamos es la suspensión del presente juicio a prueba en la primera parte del artículo 76 del código penal.",
  "A los efectos de la suspensión lo que propuso mi cliente fue el pago de 100.000 pesos en cuatro cuotas de 25.000 pesos.",
  "Tiene alguna propuesta más allá de que las pautas están supeditadas a que la fiscalía pueda fundar respecto de los hechos y los objetivos.",
];

export async function transcribe(
  file: File,
  { signal, onProgress, onPartialText }: TranscribeOptions = {},
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
        resolve(buildFixture(file));
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
    onProgress,
    onPartialText,
  });
}
