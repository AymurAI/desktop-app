import { fetchEventSource } from "@microsoft/fetch-event-source";
import { CanceledError } from "axios";

import {
  type ASRDocument,
  type ASRParagraph,
  type ASRSpeakerTurn,
  type ASRStreamEvent,
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

const clampRatio = (ratio: number) => Math.max(0, Math.min(1, ratio));

const hasSegments = (
  segments: ASRParagraph[] | null | undefined,
): segments is ASRParagraph[] => Array.isArray(segments) && segments.length > 0;

function previewItemsForSegmentsEvent(
  event: Extract<ASRStreamEvent, { type: "segments" }>,
) {
  if (hasSegments(event.validation)) return event.validation;
  if (hasSegments(event.transcription)) return event.transcription;
  return event.speaker_turns.length > 0 ? event.speaker_turns : event.document;
}

export async function transcribeStream(
  file: File,
  { signal, useCache, onProgress, onPartialText }: TranscribeStreamOptions,
): Promise<Transcription> {
  const audioObjectUrl = URL.createObjectURL(file);

  const form = new FormData();
  form.append("file", file);

  let documentId: string | null = null;
  let title: string | null | undefined;
  let paragraphs: ASRParagraph[] = [];
  let speakerTurns: ASRSpeakerTurn[] = [];
  let cachedTranscription: ASRParagraph[] | null | undefined;
  let cachedValidation: ASRParagraph[] | null | undefined;
  // Accumulated `delta` chunks form the live preview. They overlap slightly at
  // their boundaries, so this is throwaway text — the authoritative transcript
  // arrives once in the `segments` event.
  const previewParts: string[] = [];

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

        // The backend signals failures with a named SSE event:
        //   event: error
        //   data: {"detail": "...", "code": "..."}
        // Throwing inside onmessage aborts the stream and propagates to the
        // outer catch with the server-provided message.
        if (ev.event === "error") {
          let detail = "Unexpected error during transcription";
          let code: string | undefined;
          try {
            const payload = JSON.parse(ev.data);
            if (typeof payload?.detail === "string") detail = payload.detail;
            if (typeof payload?.code === "string") code = payload.code;
          } catch {
            // fall through with the default message
          }
          throw new FatalStreamError(code ? `${detail} (${code})` : detail);
        }

        const parsed = ASRStreamEventSchema.safeParse(JSON.parse(ev.data));
        if (!parsed.success) return;

        const event = parsed.data;
        switch (event.type) {
          case "meta":
            documentId = event.document_id;
            title = event.title;
            break;
          case "delta":
            previewParts.push(event.text.trim());
            if (typeof event.progress === "number") {
              onProgress?.(clampRatio(event.progress));
            }
            onPartialText?.(previewParts.filter(Boolean).join(" "));
            break;
          case "segments":
            // The authoritative, full transcript. Replaces the preview text.
            paragraphs = event.document;
            title = event.title ?? title;
            speakerTurns = event.speaker_turns;
            cachedTranscription = event.transcription;
            cachedValidation = event.validation;
            onPartialText?.(
              previewItemsForSegmentsEvent(event)
                .map((item) => item.text.trim())
                .filter(Boolean)
                .join(" "),
            );
            break;
          case "done":
            onProgress?.(clampRatio(event.progress));
            break;
          case "error":
            throw new FatalStreamError(event.detail);
        }
      },
      onerror(err) {
        // Disable the library's default retry behavior — re-throw to abort.
        throw err;
      },
    });
  } catch (err) {
    // A FatalStreamError originates from us (server-side `event: error` or a
    // non-2xx response) — surface its message verbatim, even if the library
    // also aborted the underlying request as a side-effect.
    if (err instanceof FatalStreamError) throw err;
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
    title,
    document: paragraphs,
    speaker_turns: speakerTurns,
    transcription: cachedTranscription,
    validation: cachedValidation,
  };

  onProgress?.(1);

  return mapASRDocumentToTranscription(doc, file, audioObjectUrl);
}
