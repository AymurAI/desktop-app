import { MEDIA_EXTENSIONS } from "@/constants/config";
import type { ASRDocument, ASRParagraph, ASRSpeakerTurn } from "@/schema/asr";
import type {
  Speaker,
  SpeakerColor,
  Transcription,
  Turn,
} from "@/types/transcription";

const SPEAKER_COLORS: SpeakerColor[] = [
  "primary",
  "secondary",
  "warning",
  "success",
];

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

function buildSpeakersFromLabels(
  speakerLabelsByNo: Map<number, string>,
): Speaker[] {
  return [...speakerLabelsByNo.entries()].map(([no, label], idx) => ({
    id: `s${no}`,
    label,
    initials: `P${no}`.slice(0, 2),
    color: SPEAKER_COLORS[idx % SPEAKER_COLORS.length],
  }));
}

function collectSpeakerTurnLabels(
  speakerTurns: ASRSpeakerTurn[],
): Map<number, string> {
  const labels = new Map<number, string>();
  for (const turn of speakerTurns) {
    if (labels.has(turn.speaker_no)) continue;
    labels.set(turn.speaker_no, turn.speaker);
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
  const lowerName = file.name.toLowerCase();
  const extension = MEDIA_EXTENSIONS.find((ext) =>
    lowerName.endsWith(`.${ext.toLowerCase()}`),
  );
  if (!extension) return file.name;

  const extensionLength = extension.length + 1;
  return file.name.length > extensionLength
    ? file.name.slice(0, -extensionLength)
    : file.name;
}
export function mapASRDocumentToTranscription(
  doc: ASRDocument,
  file: File,
  audioObjectUrl: string,
): Transcription {
  const speakerTurns =
    doc.speaker_turns && doc.speaker_turns.length > 0 ? doc.speaker_turns : [];
  const turns =
    speakerTurns.length > 0
      ? buildTurnsFromSpeakerTurns(speakerTurns)
      : legacyBuildTurnsFromDocument(doc.document);
  const speakerLabels =
    speakerTurns.length > 0
      ? collectSpeakerTurnLabels(speakerTurns)
      : collectSegmentSpeakerLabels(doc.document);
  const speakers = buildSpeakersFromLabels(speakerLabels);

  const audioDurationMs =
    doc.document.length > 0 || turns.length > 0
      ? Math.max(
          ...doc.document.map((p) => parseDurationToMs(p.end)),
          ...turns.map((turn) => turn.endMs),
        )
      : 0;

  return {
    id: doc.document_id,
    title: transcriptionTitleFromFile(file),
    audioFileName: file.name,
    audioDurationMs,
    audioObjectUrl,
    speakers,
    turns,
    rawDocument: doc.document,
    rawSpeakerTurns: speakerTurns,
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
