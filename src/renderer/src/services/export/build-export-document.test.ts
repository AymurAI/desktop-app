import type { Transcription } from "@/types/transcription";
import { describe, expect, it } from "vitest";
import { buildExportDocument } from "./build-export-document";
import { DEFAULT_EXPORT_OPTIONS } from "./types";

const transcription: Transcription = {
  id: "doc-1",
  title: "Audiencia 10/04/2025",
  audioFileName: "a.mp3",
  audioDurationMs: 10_000,
  audioObjectUrl: "blob:x",
  speakers: [
    { id: "s1", label: "Persona 1", initials: "P1", color: "primary" },
  ],
  turns: [
    { id: "t1", speakerId: "s1", text: "Hola", startMs: 0, endMs: 1000 },
    {
      id: "t2",
      speakerId: "missing-speaker",
      text: "Sin speaker",
      startMs: 1000,
      endMs: 2000,
    },
  ],
  source: "asr",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("buildExportDocument", () => {
  it("includes title, speaker labels and formatted timestamps by default", () => {
    const doc = buildExportDocument(transcription, DEFAULT_EXPORT_OPTIONS);
    expect(doc.title).toBe("Audiencia 10/04/2025");
    expect(doc.blocks[0]).toEqual({
      speaker: "Persona 1",
      timestamp: "00:00",
      text: "Hola",
    });
  });

  it("leaves speaker undefined when the turn references a speaker that no longer exists", () => {
    const doc = buildExportDocument(transcription, DEFAULT_EXPORT_OPTIONS);
    expect(doc.blocks[1].speaker).toBeUndefined();
    expect(doc.blocks[1].text).toBe("Sin speaker");
  });

  it("omits title/speakers/timestamps when their options are false", () => {
    const doc = buildExportDocument(transcription, {
      includeTitle: false,
      includeSpeakers: false,
      includeTimestamps: false,
    });
    expect(doc.title).toBeUndefined();
    expect(doc.blocks[0]).toEqual({
      speaker: undefined,
      timestamp: undefined,
      text: "Hola",
    });
  });
});
