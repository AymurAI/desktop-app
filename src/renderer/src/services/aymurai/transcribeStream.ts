import { fetchEventSource } from "@microsoft/fetch-event-source";
import { CanceledError } from "axios";

import {
  type ASRDocument,
  type ASRParagraph,
  ASRStreamEventSchema,
} from "@/schema/asr";
import api from "@/services/api";
import type { Transcription } from "@/types/transcription";
import { mapASRDocumentToTranscription } from "./asrMapper";

export interface TranscribeStreamOptions {
  signal?: AbortSignal;
  useCache: boolean;
  onProgress?: (ratio: number) => void;
  onPartialText?: (text: string) => void;
}

class FatalStreamError extends Error {}

export async function transcribeStream(
  file: File,
  { signal, useCache, onProgress, onPartialText }: TranscribeStreamOptions,
): Promise<Transcription> {
  const audioObjectUrl = URL.createObjectURL(file);

  const form = new FormData();
  form.append("file", file);

  const paragraphs = new Map<string, ASRParagraph>();
  const anonymousParagraphs: ASRParagraph[] = [];
  let documentId: string | null = null;

  const baseURL = api.defaults.baseURL?.replace(/\/$/, "");
  if (!baseURL) {
    throw new Error(
      "No server selected. Connect to a server from the login page first.",
    );
  }
  const url = `${baseURL}/asr/transcribe/stream?use_cache=${useCache}`;

  try {
    await fetchEventSource(url, {
      method: "POST",
      body: form,
      signal,
      openWhenHidden: true,
      async onopen(response) {
        if (!response.ok) {
          throw new FatalStreamError(
            `Transcription stream failed: ${response.status} ${response.statusText}`,
          );
        }
      },
      onmessage(ev) {
        if (!ev.data) return;
        const parsed = ASRStreamEventSchema.safeParse(JSON.parse(ev.data));
        if (!parsed.success) return;

        const { document_id, document, current_time, total_time } = parsed.data;
        documentId = document_id;

        for (const para of document) {
          if (para.paragraph_id) {
            paragraphs.set(para.paragraph_id, para);
          } else {
            anonymousParagraphs.push(para);
          }
        }

        if (onProgress && total_time > 0) {
          const ratio = (current_time ?? 0) / total_time;
          onProgress(Math.max(0, Math.min(1, ratio)));
        }

        if (onPartialText) {
          // Each SSE event already carries the complete document so far; build
          // the preview straight from it. Don't reuse the merged accumulators
          // above because anonymous paragraphs get .push()'d every event and
          // would duplicate themselves in the preview.
          const cumulative = document
            .filter((p) => p.speaker_no >= 0)
            .map((p) => p.text.trim())
            .filter(Boolean)
            .join(" ");
          onPartialText(cumulative);
        }
      },
      onerror(err) {
        // Disable the library's default retry behavior — re-throw to abort.
        throw err;
      },
    });
  } catch (err) {
    if (signal?.aborted || (err as { name?: string })?.name === "AbortError") {
      throw new CanceledError();
    }
    throw err;
  }

  if (!documentId) {
    throw new Error("Transcription stream ended without a document_id");
  }

  const doc: ASRDocument = {
    document_id: documentId,
    document: [...paragraphs.values(), ...anonymousParagraphs],
  };

  onProgress?.(1);

  return mapASRDocumentToTranscription(doc, file, audioObjectUrl);
}
