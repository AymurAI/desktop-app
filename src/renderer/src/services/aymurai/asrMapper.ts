import type { ASRDocument } from "@/schema/asr";
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

export function mapASRDocumentToTranscription(
  doc: ASRDocument,
  file: File,
  audioObjectUrl: string,
): Transcription {
  // Collect unique speaker numbers in order of appearance
  const speakerNos: number[] = [];
  for (const para of doc.document) {
    if (!speakerNos.includes(para.speaker_no)) speakerNos.push(para.speaker_no);
  }

  const speakers: Speaker[] = speakerNos.map((no, idx) => ({
    id: `s${no}`,
    label: `Locutor ${no}`,
    initials: `L${no}`.slice(0, 2),
    color: SPEAKER_COLORS[idx % SPEAKER_COLORS.length],
  }));

  const turns: Turn[] = doc.document.map((para) => ({
    id: para.paragraph_id ?? crypto.randomUUID(),
    speakerId: `s${para.speaker_no}`,
    text: para.text,
    startMs: parseDurationToMs(para.start),
    endMs: parseDurationToMs(para.end),
  }));

  const audioDurationMs =
    turns.length > 0 ? Math.max(...turns.map((t) => t.endMs)) : 0;

  return {
    id: doc.document_id,
    title: `Audiencia ${new Date().toLocaleDateString("es-AR")}`,
    audioFileName: file.name,
    audioDurationMs,
    audioObjectUrl,
    speakers,
    turns,
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

  return transcription.turns.map((turn) => ({
    speaker_no: speakerNoMap.get(turn.speakerId) ?? 1,
    start: turn.startMs / 1000,
    end: turn.endMs / 1000,
    text: turn.text,
  }));
}
