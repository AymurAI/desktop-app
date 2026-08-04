import { MEDIA_EXTENSIONS } from "@/constants/config";
import type { ASRDocument, ASRParagraph, ASRSpeakerTurn } from "@/schema/asr";
import type {
  Speaker,
  Transcription,
  TranscriptionSource,
  Turn,
} from "@/types/transcription";
import { SPEAKER_PALETTE } from "@/types/transcription";
import { stripKnownExtension } from "@/utils/strip-known-extension";

function parseDurationToMs(value: string | number): number {
  if (typeof value === "number") return Math.round(value * 1000);

  // ISO 8601 duration: PT1H2M3.5S
  const isoMatch = value.match(
    /^PT(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?$/,
  );
  if (isoMatch) {
    const h = Number.parseFloat(isoMatch[1] ?? "0");
    const m = Number.parseFloat(isoMatch[2] ?? "0");
    const s = Number.parseFloat(isoMatch[3] ?? "0");
    return Math.round((h * 3600 + m * 60 + s) * 1000);
  }

  // HH:MM:SS or MM:SS
  const colonMatch = value.match(/^(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)$/);
  if (colonMatch) {
    const h = Number.parseFloat(colonMatch[1] ?? "0");
    const m = Number.parseFloat(colonMatch[2] ?? "0");
    const s = Number.parseFloat(colonMatch[3] ?? "0");
    return Math.round((h * 3600 + m * 60 + s) * 1000);
  }

  // Plain seconds as string
  const num = Number.parseFloat(value);
  if (!Number.isNaN(num)) return Math.round(num * 1000);

  return 0;
}

function speakerLabelForSegment(segment: ASRParagraph): string {
  return (
    segment.speaker_name?.trim() ||
    (segment.speaker_no < 0
      ? `Speaker ${segment.speaker_no}`
      : `Persona ${segment.speaker_no}`)
  );
}

function normalizeSpeakerLabel(label: string, speakerNo: number): string {
  return speakerNo >= 0 && label.trim() === `Speaker ${speakerNo}`
    ? `Persona ${speakerNo}`
    : label;
}

function buildSpeakersFromLabels(
  speakerLabelsByNo: Map<number, string>,
): Speaker[] {
  return [...speakerLabelsByNo.entries()].map(([no, label], idx) => ({
    id: `s${no}`,
    label,
    initials: `P${no}`.slice(0, 2),
    color: SPEAKER_PALETTE[idx % SPEAKER_PALETTE.length],
  }));
}

function collectSpeakerTurnLabels(
  speakerTurns: ASRSpeakerTurn[],
): Map<number, string> {
  const labels = new Map<number, string>();
  for (const turn of speakerTurns) {
    if (labels.has(turn.speaker_no)) continue;
    labels.set(
      turn.speaker_no,
      normalizeSpeakerLabel(turn.speaker, turn.speaker_no),
    );
  }
  return labels;
}

function collectSegmentSpeakerLabels(
  segments: ASRParagraph[],
): Map<number, string> {
  const labels = new Map<number, string>();
  for (const segment of segments) {
    if (labels.has(segment.speaker_no)) continue;
    labels.set(segment.speaker_no, speakerLabelForSegment(segment));
  }
  return labels;
}

function turnIdFromSpeakerTurn(turn: ASRSpeakerTurn): string {
  const firstSegmentId = turn.segments.find(
    (s) => s.paragraph_id,
  )?.paragraph_id;
  return firstSegmentId
    ? `${firstSegmentId}:${turn.start}:${turn.end}`
    : `${turn.speaker_no}:${turn.start}:${turn.end}`;
}

function buildTurnsFromSpeakerTurns(speakerTurns: ASRSpeakerTurn[]): Turn[] {
  return speakerTurns.map((turn) => ({
    id: turnIdFromSpeakerTurn(turn),
    speakerId: `s${turn.speaker_no}`,
    speakerNo: turn.speaker_no,
    text: turn.text,
    startMs: parseDurationToMs(turn.start),
    endMs: parseDurationToMs(turn.end),
    segments: turn.segments,
  }));
}

export function legacyBuildTurnsFromDocument(document: ASRParagraph[]): Turn[] {
  return document.map((para) => ({
    id: para.paragraph_id ?? crypto.randomUUID(),
    speakerId: `s${para.speaker_no}`,
    speakerNo: para.speaker_no,
    text: para.text,
    startMs: parseDurationToMs(para.start),
    endMs: parseDurationToMs(para.end),
    segments: [para],
  }));
}

function transcriptionTitleFromFile(file: File): string {
  return stripKnownExtension(file.name, MEDIA_EXTENSIONS);
}

function transcriptionTitle(doc: ASRDocument, file: File): string {
  return doc.title?.trim() || transcriptionTitleFromFile(file);
}

function hasSegments(
  segments: ASRParagraph[] | null | undefined,
): segments is ASRParagraph[] {
  return Array.isArray(segments) && segments.length > 0;
}

function resolveASRTranscriptSource(doc: ASRDocument): {
  source: TranscriptionSource;
  turns: Turn[];
  speakerLabels: Map<number, string>;
} {
  if (hasSegments(doc.validation)) {
    return {
      source: "validation",
      turns: legacyBuildTurnsFromDocument(doc.validation),
      speakerLabels: collectSegmentSpeakerLabels(doc.validation),
    };
  }

  if (hasSegments(doc.transcription)) {
    return {
      source: "transcription",
      turns: legacyBuildTurnsFromDocument(doc.transcription),
      speakerLabels: collectSegmentSpeakerLabels(doc.transcription),
    };
  }

  const speakerTurns =
    doc.speaker_turns && doc.speaker_turns.length > 0 ? doc.speaker_turns : [];

  return {
    source: "asr",
    turns:
      speakerTurns.length > 0
        ? buildTurnsFromSpeakerTurns(speakerTurns)
        : legacyBuildTurnsFromDocument(doc.document),
    speakerLabels:
      speakerTurns.length > 0
        ? collectSpeakerTurnLabels(speakerTurns)
        : collectSegmentSpeakerLabels(doc.document),
  };
}

export function mapASRDocumentToTranscription(
  doc: ASRDocument,
  file: File,
  audioObjectUrl: string,
  knownAudioDurationMs?: number,
): Transcription {
  const { source, turns, speakerLabels } = resolveASRTranscriptSource(doc);
  const speakers = buildSpeakersFromLabels(speakerLabels);

  const transcriptDurationMs =
    doc.document.length > 0 || turns.length > 0
      ? Math.max(
          ...doc.document.map((p) => parseDurationToMs(p.end)),
          ...turns.map((turn) => turn.endMs),
        )
      : 0;
  const audioDurationMs =
    typeof knownAudioDurationMs === "number" &&
    Number.isFinite(knownAudioDurationMs) &&
    knownAudioDurationMs > 0
      ? Math.round(knownAudioDurationMs)
      : transcriptDurationMs;

  return {
    id: doc.document_id,
    title: transcriptionTitle(doc, file),
    audioFileName: file.name,
    audioDurationMs,
    audioObjectUrl,
    speakers,
    turns,
    source,
    rawDocument: doc.document,
    rawSpeakerTurns: doc.speaker_turns,
    rawTranscription: doc.transcription,
    rawValidation: doc.validation,
    createdAt: new Date().toISOString(),
  };
}

export function mapTranscriptionToASRParagraphRequests(
  transcription: Transcription,
) {
  // Map each speaker to a 1-indexed speaker_no based on position in speakers array
  const speakerNoMap = new Map<string, number>();
  for (const [idx, speaker] of transcription.speakers.entries()) {
    speakerNoMap.set(speaker.id, idx + 1);
  }

  return transcription.turns.map((turn) => {
    const speaker = transcription.speakers.find((s) => s.id === turn.speakerId);
    const speakerNoFromId = Number.parseInt(
      turn.speakerId.replace(/^s/, ""),
      10,
    );
    return {
      speaker_no: Number.isNaN(speakerNoFromId)
        ? (speakerNoMap.get(turn.speakerId) ?? 1)
        : speakerNoFromId,
      speaker_name: speaker?.label ?? null,
      start: turn.startMs / 1000,
      end: turn.endMs / 1000,
      text: turn.text,
    };
  });
}
