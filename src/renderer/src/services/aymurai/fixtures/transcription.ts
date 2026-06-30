import type { Transcription, Turn } from "@/types/transcription";
import sampleTranscript from "./sampleDeepgramTranscription.json";

type FixtureTurn = Omit<Turn, "id">;

const FIXTURE = sampleTranscript as {
  title: string;
  audioDurationMs: number;
  speakers: Transcription["speakers"];
  turns: FixtureTurn[];
};

export const MOCK_PREVIEW_CHUNKS = FIXTURE.turns
  .slice(0, 5)
  .map((turn) => turn.text);

export function buildFixture(file: File): Transcription {
  const turns = FIXTURE.turns.map((turn) => ({
    id: crypto.randomUUID(),
    ...turn,
  }));

  return {
    id: crypto.randomUUID(),
    title: FIXTURE.title,
    audioFileName: file.name,
    audioDurationMs: FIXTURE.audioDurationMs,
    audioObjectUrl: URL.createObjectURL(file),
    createdAt: new Date().toISOString(),
    source: "asr",
    speakers: FIXTURE.speakers.map((speaker) => ({ ...speaker })),
    turns,
  };
}
