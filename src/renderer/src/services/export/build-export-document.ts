import { formatTime } from "@/components/voice-to-text/format-time";
import type { Transcription } from "@/types/transcription";
import type { ExportDocument, ExportOptions } from "./types";

export function buildExportDocument(
  transcription: Transcription,
  options: ExportOptions,
): ExportDocument {
  const speakerMap = new Map(transcription.speakers.map((s) => [s.id, s]));

  return {
    title: options.includeTitle ? transcription.title : undefined,
    blocks: transcription.turns.map((turn) => ({
      speaker: options.includeSpeakers
        ? (speakerMap.get(turn.speakerId)?.label ?? undefined)
        : undefined,
      timestamp: options.includeTimestamps
        ? formatTime(turn.startMs)
        : undefined,
      text: turn.text,
    })),
  };
}
